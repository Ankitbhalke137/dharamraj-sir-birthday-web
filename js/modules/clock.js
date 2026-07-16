/*
====================================================================
Module: clock.js
Purpose: Real-time digital clock in the navbar.
  - Updates every second using setInterval.
  - Uses Intl / toLocaleTimeString for locale-safe formatting.
  - Updates the <time> element's datetime attribute for semantics.
====================================================================
*/

/**
 * Initialises the digital clock.
 * Reads the #digitalClock element and updates it every 1000ms.
 */
export function initClock() {
  const clockEl = document.getElementById('digitalClock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    clockEl.textContent = timeStr;
    clockEl.setAttribute('datetime', now.toISOString());
  };

  updateClock();
  setInterval(updateClock, 1000);
}
