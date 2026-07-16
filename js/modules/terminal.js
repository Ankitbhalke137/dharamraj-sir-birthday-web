/*
====================================================================
Module: terminal.js
Purpose: Interactive console with boot logs and wish-dispatch action.
  - Manages the CTA button that triggers terminal output animation.
  - Coordinates with ParticleEngine and AudioChime.
  - Mute toggle button with accessible aria-pressed state.
  - Reads dispatch strings from copy JSON (Section 2.6).
  - Wraps audio/canvas in feature detection guards (Section 2.1).
====================================================================
*/

import { getCopy } from './copy.js';

/**
 * Initialises the terminal/console section.
 * - Wires the mute toggle button.
 * - Binds the "Send Birthday Wishes" CTA button.
 * @param {ParticleEngine} engine
 * @param {AudioChime} chime
 */
export function initTerminal(engine, chime) {
  const copy = getCopy();
  const c = copy.console || {};

  const ctaBtn = document.getElementById('wishCta');
  const terminalBody = document.getElementById('terminalBody');
  const muteToggle = document.getElementById('muteToggle');
  const muteIcon = document.getElementById('muteIcon');
  const muteLabel = document.getElementById('muteLabel');

  if (!ctaBtn || !terminalBody || !muteToggle) return;

  /* ---------- Mute toggle ---------- */
  muteToggle.addEventListener('click', () => {
    const isMuted = chime.toggle();
    const pressed = isMuted ? 'false' : 'true';
    muteToggle.setAttribute('aria-pressed', pressed);
    muteToggle.setAttribute('aria-label', isMuted ? 'Unmute sound' : 'Mute sound');
    muteToggle.classList.toggle('muted', isMuted);
    muteIcon.innerHTML = isMuted ? '\u{1F507}' : '\u{1F514}';
    muteLabel.textContent = isMuted
      ? (copy.audio?.mutedLabel || 'Muted')
      : (copy.audio?.unmutedLabel || 'Unmuted');

    if (!isMuted) {
      chime.ensureContext();
    }
  });

  /* ---------- Helper: append terminal line with animation ---------- */
  const addTerminalLine = (text, color = '#50fa7b', delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.style.color = color;
        line.style.animationDelay = '0s';
        line.textContent = text;
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
        resolve();
      }, delay);
    });
  };

  /* ---------- CTA: dispatch birthday wishes ---------- */
  const dispatchMessages = c.dispatch || [
    '> Sending birthday wish payload...',
    '> Connecting to gratitude API...',
    '> 200 OK — Wishes Deployed!',
    '> Happy Birthday, Dharamraj Sir! From all your students.',
    '> Ready for next wish. _',
  ];

  const dispatchColors = ['#f1fa8c', '#6272a4', '#50fa7b', '#ff79c6', '#6272a4'];
  const ctaLabel = c.ctaLabel || '> Send Birthday Wishes';
  const ctaLoadingLabel = c.ctaLoading || '> Deploying...';

  const dispatchWish = async () => {
    // Feature detection guard — Section 2.1 Progressive Enhancement
    if (!('requestAnimationFrame' in window)) return;

    ctaBtn.disabled = true;
    ctaBtn.textContent = ctaLoadingLabel;
    ctaBtn.style.opacity = '0.7';

    for (let i = 0; i < dispatchMessages.length; i++) {
      await addTerminalLine(dispatchMessages[i], dispatchColors[i], i === 0 ? 0 : 300);
    }

    ctaBtn.disabled = false;
    ctaBtn.textContent = ctaLabel;
    ctaBtn.style.opacity = '1';

    // Particle explosion at viewport centre
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    if (engine && typeof engine.burst === 'function') {
      engine.burst(cx, cy, 100);
    }

    // Audio chime (respects mute state)
    if (chime && typeof chime.play === 'function') {
      chime.play();
    }
  };

  ctaBtn.addEventListener('click', dispatchWish);
}
