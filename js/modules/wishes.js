/*
====================================================================
Module: wishes.js
Purpose: Persistent wish board backed by Google Forms + Google Sheets.
  - Displays wishes fetched via opensheet JSON proxy.
  - Polls every 30 s and on tab visibility change.
  - Submits new wishes via no-cors POST to Google Forms.
  - Validates input fields (name >= 2 chars, message >= 5 chars).
  - Announces new cards to screen readers via aria-live region.
====================================================================
*/

/* ==============================
   Google Forms Configuration
   ============================== */

const GFORM_CONFIG = {
  formId: '1FAIpQLSeGSmEmSHRIR-jF0q5B8LdMPC63X5U3tkw8y75FY0SoqiQyKA',
  entryName: 'entry.825922743',
  entryWish: 'entry.238972684',
  sheetJsonUrl: 'https://opensheet.elk.sh/1IGqrnCXz5gAEhuAmxWPLyu0x2Y_bARlacxBkOj_3oS8/1',
  pollIntervalMs: 30000,
};

/* ==============================
   Sanitisation (XSS-safe)
   ============================== */

/**
 * Escape HTML special characters for safe innerHTML usage.
 * @param {string} str
 * @returns {string}
 */
const escapeHtml = (str) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
};

/**
 * Sanitise a string for safe textContent usage.
 * Normalises whitespace and strips control characters.
 * @param {string} str
 * @returns {string}
 */
const sanitise = (str) => {
  return String(str)
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ');
};

/* ==============================
   Static seed wishes (always shown first)
   ============================== */

const seedWishes = [
  { Name: 'From IOI Pune', 'Your Wish': 'The best mentor a student could ask for. Grateful!', Timestamp: new Date().toISOString() },
  { Name: 'Kshitij Das', 'Your Wish': 'Your passion for fullstack is contagious. Happy Birthday!', Timestamp: new Date().toISOString() },
  { Name: 'Ankit Bhalke', 'Your Wish': 'Happy Birthday, Sir! Thank you for bridging the gap between theory and practice, and for inspiring us to build better web architectures every day. Have a wonderful year ahead', Timestamp: new Date().toISOString() },
];

/* ==============================
   Fetch & Render
   ============================== */

/**
 * Fetch wishes from the opensheet JSON proxy.
 * Returns an array of row objects.
 */
const loadWishes = async () => {
  try {
    const res = await fetch(GFORM_CONFIG.sheetJsonUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Wish load failed:', err);
    return [];
  }
};

/**
 * Create a single wish card <article> element.
 * Uses createElement and textContent for XSS safety.
 * @param {Object} row  {Name, 'Your Wish', Timestamp}
 * @returns {HTMLElement}
 */
const createWishCard = (row) => {
  const safeName = sanitise(row.Name || 'Anonymous');
  const safeMessage = sanitise(row['Your Wish'] || '');

  const card = document.createElement('article');
  card.className = 'wish-card interactive';

  const icon = document.createElement('span');
  icon.className = 'text-[#ff79c6] text-lg leading-none';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '\u201C';

  const msgEl = document.createElement('p');
  msgEl.className = 'font-mono text-sm text-[#f8f8f2] mt-1 leading-relaxed';
  msgEl.textContent = safeMessage;

  const divider = document.createElement('hr');
  divider.className = 'border-[#44475a] my-3';

  const footer = document.createElement('div');
  footer.className = 'flex items-center justify-between';

  const nameEl = document.createElement('span');
  nameEl.className = 'font-mono text-xs text-[#8be9fd] font-medium';
  nameEl.textContent = `-- ${safeName}`;

  const timeEl = document.createElement('time');
  timeEl.className = 'font-mono text-[10px] text-[#6272a4]';
  const date = row.Timestamp ? new Date(row.Timestamp) : new Date();
  timeEl.textContent = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  timeEl.setAttribute('datetime', date.toISOString());

  footer.appendChild(nameEl);
  footer.appendChild(timeEl);

  card.appendChild(icon);
  card.appendChild(msgEl);
  card.appendChild(divider);
  card.appendChild(footer);

  return card;
};

/**
 * Render seed wishes then sheet wishes into the board.
 * Seeds are always shown first; sheet wishes appended after (newest first).
 * @param {HTMLElement} board
 */
const renderWishes = async (board) => {
  board.textContent = '';

  // 1. Static seed wishes
  seedWishes.forEach((w) => board.appendChild(createWishCard(w)));

  // 2. Sheet wishes (newest first)
  const data = await loadWishes();
  for (let i = data.length - 1; i >= 0; i--) {
    board.appendChild(createWishCard(data[i]));
  }
};

/* ==============================
   Validation
   ============================== */

/**
 * Validate a single field value.
 * @param {string} value
 * @param {number} minLen
 * @param {string} fieldName
 * @returns {string} Error message or empty string
 */
const validateField = (value, minLen, fieldName) => {
  const trimmed = value.trim();
  if (!trimmed) return `${fieldName} is required.`;
  if (trimmed.length < minLen) {
    return `${fieldName} must be at least ${minLen} characters.`;
  }
  return '';
};

/* ==============================
   Initialisation
   ============================== */

/**
 * Initialises the wish board: fetches from Google Sheets,
 * wires form validation, and submits to Google Forms.
 */
export function initWishBoard() {
  const form = document.getElementById('wishForm');
  const nameInput = document.getElementById('wishName');
  const msgInput = document.getElementById('wishMessage');
  const nameError = document.getElementById('nameError');
  const msgError = document.getElementById('msgError');
  const board = document.getElementById('wishBoardContainer');

  if (!form || !board) return;

  /* ---------- Initial load ---------- */
  renderWishes(board);

  /* ---------- Poll every 30 s ---------- */
  const pollTimer = setInterval(() => renderWishes(board), GFORM_CONFIG.pollIntervalMs);

  /* ---------- Refresh on tab focus ---------- */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderWishes(board);
  });

  /* ---------- Validation helpers ---------- */
  const validateName = () => {
    const err = validateField(nameInput.value, 2, 'Name');
    nameError.textContent = err;
    nameInput.classList.toggle('error', !!err);
    return !err;
  };

  const validateMsg = () => {
    const err = validateField(msgInput.value, 5, 'Message');
    msgError.textContent = err;
    msgInput.classList.toggle('error', !!err);
    return !err;
  };

  /* ---------- Real-time validation on blur ---------- */
  nameInput.addEventListener('blur', validateName);
  msgInput.addEventListener('blur', validateMsg);

  nameInput.addEventListener('focus', () => {
    nameError.textContent = '';
    nameInput.classList.remove('error');
  });

  msgInput.addEventListener('focus', () => {
    msgError.textContent = '';
    msgInput.classList.remove('error');
  });

  /* ---------- Form submission — POST to Google Forms ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameValid = validateName();
    const msgValid = validateMsg();
    if (!nameValid || !msgValid) return;

    const name = sanitise(nameInput.value);
    const message = sanitise(msgInput.value);

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const formData = new FormData();
      formData.append(GFORM_CONFIG.entryName, name);
      formData.append(GFORM_CONFIG.entryWish, message);

      await fetch(
        `https://docs.google.com/forms/d/e/${GFORM_CONFIG.formId}/formResponse`,
        { method: 'POST', mode: 'no-cors', body: formData }
      );

      form.reset();
      nameInput.classList.remove('error');
      msgInput.classList.remove('error');
      nameError.textContent = '';
      msgError.textContent = '';

      // Screen-reader announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Wish from ${name} submitted. Refreshing board.`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 3000);

      // Optimistic board refresh after Google's processing delay
      setTimeout(() => renderWishes(board), 1500);
    } catch (err) {
      console.error(err);
      nameError.textContent = 'Submission failed. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = '$ EXECUTE';
    }
  });

  /* ---------- Enter key submits ---------- */
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
}
