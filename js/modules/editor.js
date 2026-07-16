/*
====================================================================
Module: editor.js
Purpose: Code editor tab switching (bio.json / contributions.md / tribute.js).
  - Manages aria-selected states for accessibility.
  - Toggles .active class on panels and tabs.
  - Supports keyboard navigation (Enter/Space).
====================================================================
*/

/**
 * Initialises the code editor tab system.
 * Binds click and keydown handlers to each tab button.
 */
export function initEditor() {
  const tabs = document.querySelectorAll('[role="tab"][data-tab]');
  const panels = {
    bio:     document.getElementById('panel-bio'),
    contrib: document.getElementById('panel-contrib'),
    tribute: document.getElementById('panel-tribute'),
  };

  const activateTab = (tabId) => {
    // Deactivate all tabs
    tabs.forEach((tab) => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });

    // Hide all panels
    Object.values(panels).forEach((panel) => {
      if (panel) panel.classList.remove('active');
    });

    // Activate selected tab
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-selected', 'true');
    }

    // Show corresponding panel
    const panel = panels[tabId];
    if (panel) panel.classList.add('active');
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      if (tabId) activateTab(tabId);
    });

    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tabId = tab.getAttribute('data-tab');
        if (tabId) activateTab(tabId);
      }
    });
  });
}
