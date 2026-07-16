/*
====================================================================
Module: wishes.js
Purpose: Dynamic wish board with SQL-themed form, safe DOM injection,
         and localStorage persistence.
  - Validates input fields (name ≥ 2 chars, message ≥ 5 chars).
  - Creates wish cards using document.createElement (XSS-safe).
  - Persists all wishes to localStorage under a known key.
  - Hydrates the board from localStorage on load; falls back to
    seed wishes when storage is empty.
  - Announces new cards to screen readers via aria-live region.
====================================================================
*/

/* ---------- Constants ---------- */
const STORAGE_KEY = 'tribute_wishes_data';
const seedWishes = [
  { name: 'From IOI Pune', message: 'The best mentor a student could ask for. Grateful!' },
  { name: 'Kshitij Das', message: 'Your passion for fullstack is contagious. Happy Birthday!' },
  { name: 'Ankit Bhalke', message: 'Happy Birthday, Sir! Thank you for bridging the gap between theory and practice, and for inspiring us to build better web architectures every day. Have a wonderful year ahead' },
];

/**
 * Sanitise a string for safe textContent usage.
 * Defense-in-depth — even though we use createElement/textContent
 * (which are inherently XSS-safe), this normalises whitespace
 * and strips control characters.
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
   localStorage helpers
   ============================== */

/**
 * Load the wishes array from localStorage.
 * Returns null if the key is missing or JSON is corrupt.
 * @returns {Array|null}
 */
const loadWishes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Persist the wishes array to localStorage.
 * @param {Array} wishes  Array of {name, message, timestamp}
 */
const saveWishes = (wishes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  } catch {
    // localStorage full or unavailable — degrade silently
  }
};

/* ==============================
   Card rendering
   ============================== */

/**
 * Creates a wish card <article> element using safe DOM methods.
 * Never uses innerHTML with user-supplied data.
 * @param {string}  name
 * @param {string}  message
 * @param {string}  [isoTimestamp]  ISO string for restored wishes
 * @returns {HTMLElement}
 */
const createWishCard = (name, message, isoTimestamp) => {
  const safeName = sanitise(name);
  const safeMessage = sanitise(message);

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
  const date = isoTimestamp ? new Date(isoTimestamp) : new Date();
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
 * Render an array of wish objects into the board container.
 * Replaces all existing children (used on initialisation).
 * @param {HTMLElement} board
 * @param {Array}       wishes  Array of {name, message, timestamp}
 */
const renderAllWishes = (board, wishes) => {
  board.textContent = ''; // safe — no user data in board itself
  // Render in reverse so newest appears first (prepended order)
  for (let i = wishes.length - 1; i >= 0; i--) {
    const { name, message, timestamp } = wishes[i];
    board.appendChild(createWishCard(name, message, timestamp));
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
 * Initialises the wish board: hydrates from localStorage or seeds,
 * wires form validation, and handles submission + persistence.
 */
export function initWishBoard() {
  const form = document.getElementById('wishForm');
  const nameInput = document.getElementById('wishName');
  const msgInput = document.getElementById('wishMessage');
  const nameError = document.getElementById('nameError');
  const msgError = document.getElementById('msgError');
  const board = document.getElementById('wishBoardContainer');

  if (!form || !board) return;

  /* ---------- Hydrate from localStorage / seed ---------- */
  const stored = loadWishes();
  const wishes = stored !== null ? stored : seedWishes.map((w) => ({
    ...w,
    timestamp: new Date().toISOString(),
  }));

  // Persist seed wishes on first visit so they appear next time
  if (stored === null) {
    saveWishes(wishes);
  }

  renderAllWishes(board, wishes);

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

  /* ---------- Form submission ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameValid = validateName();
    const msgValid = validateMsg();
    if (!nameValid || !msgValid) return;

    const name = sanitise(nameInput.value);
    const message = sanitise(msgInput.value);
    const timestamp = new Date().toISOString();

    // Prepend to in-memory array and persist
    wishes.unshift({ name, message, timestamp });
    saveWishes(wishes);

    // Render the new card at the top of the board
    board.prepend(createWishCard(name, message, timestamp));

    // Reset form
    nameInput.value = '';
    msgInput.value = '';
    nameInput.classList.remove('error');
    msgInput.classList.remove('error');
    nameError.textContent = '';
    msgError.textContent = '';

    // Screen-reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Wish from ${name} added to the board.`;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 3000);
  });

  /* ---------- Enter key submits ---------- */
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
}
