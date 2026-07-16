/*
====================================================================
Module: copy.js
Purpose: Loads the externalised copy JSON block from the HTML.
  - Parses <script id="site-copy" type="application/json">
  - Caches the result so subsequent calls are O(1).
  - Returns an empty object if the block is missing or malformed,
    allowing graceful degradation.
====================================================================
*/

const COPY_ID = 'site-copy';
let cache = null;

/**
 * Retrieve the copy object.
 * @returns {Object} Copy dictionary (empty object as fallback)
 */
export function getCopy() {
  if (cache) return cache;

  const el = document.getElementById(COPY_ID);
  if (!el) {
    cache = {};
    return cache;
  }

  try {
    cache = JSON.parse(el.textContent);
  } catch {
    cache = {};
  }

  return cache;
}
