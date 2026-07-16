/*
====================================================================
Module: app.js (Entry Point)
Purpose: Orchestrates all modules.
  - Imports every feature module.
  - Initialises them in the correct order on DOMContentLoaded.
  - Handles global concerns (footer year, console tribute).
====================================================================
*/

import { initClock } from './modules/clock.js';
import { initEditor } from './modules/editor.js';
import { ParticleEngine } from './modules/particles.js';
import { AudioChime } from './modules/audio.js';
import { initTerminal } from './modules/terminal.js';
import { initWishBoard } from './modules/wishes.js';

/**
 * Application entry point.
 * All initialisation happens after the DOM is ready.
 * (type="module" scripts are deferred by default, but
 *  DOMContentLoaded guarantees full parsing.)
 */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Digital clock — navbar
  initClock();

  // 2. Code editor tabs
  initEditor();

  // 3. Particle engine — canvas overlay
  const engine = new ParticleEngine('particleCanvas');

  // 5. Audio chime — Web Audio API (muted by default)
  const chime = new AudioChime();

  // 6. Terminal / CTA — coordinates engine + chime
  initTerminal(engine, chime);

  // 7. Wish board — form + DOM injection + analytics beacon
  initWishBoard();

  // 8. Footer — dynamic year + IntersectionObserver reveal
  const yearSpan = document.getElementById('yearSpan');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const siteFooter = document.getElementById('siteFooter');
  if (siteFooter && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          siteFooter.classList.add('reveal');
          observer.unobserve(siteFooter);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(siteFooter);
  }

  // 9. Console tribute (for devtools aficionados)
  console.log(
    '%c\u2764  Happy Birthday, Dharamraj Sir!  \u2764',
    'color: #ff79c6; font-size: 1.25rem; font-weight: bold; font-family: monospace;'
  );
  console.log(
    '%cBuilt with semantic HTML5, Tailwind CSS, and Vanilla JS (ES6+)',
    'color: #6272a4; font-family: monospace;'
  );

});
