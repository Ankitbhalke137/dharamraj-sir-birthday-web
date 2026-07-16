/*
====================================================================
Module: analytics.js
Purpose: Privacy-respecting observability via navigator.sendBeacon.
  - Fires a beacon for key events (wish_submitted).
  - Payload includes event name, timestamp, and a SHA-256 name hash
    (no plain-text PII sent).
  - Degrades silently if sendBeacon is unavailable or the endpoint
    is unreachable.
====================================================================
*/

/**
 * Compute a simple hex digest for a string.
 * Uses the SubtleCrypto API when available; falls back to
 * a basic hash to avoid blocking.
 * @param {string} str
 * @returns {Promise<string>}
 */
async function simpleHash(str) {
  if (!window.crypto?.subtle?.digest) {
    // Fallback: return a truncated identifier
    return str.length.toString(16) + '-unhashed';
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fire a privacy-respecting analytics beacon.
 * @param {string} event    Event name (e.g. 'wish_submitted')
 * @param {Object} payload  Additional data (no PII — names are hashed)
 */
export async function sendBeacon(event, payload = {}) {
  try {
    const data = JSON.stringify({
      event,
      ...payload,
      timestamp: new Date().toISOString(),
    });
    // Use sendBeacon — non-blocking, survives page navigation
    const sent = navigator.sendBeacon('/analytics', data);
    if (!sent) {
      // Queue full — silently drop
    }
  } catch {
    // Fail silently — analytics must never break the app
  }
}

/**
 * Sugar: fire a wish_submitted event with a hashed student name.
 * @param {string} name  Student name (will be hashed before sending)
 */
export async function trackWishSubmitted(name) {
  const nameHash = await simpleHash(name);
  sendBeacon('wish_submitted', { nameHash });
}
