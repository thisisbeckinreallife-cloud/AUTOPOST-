/* ==========================================================================
   AUTOPOST — Icon set (12 SVGs inline, stroke 1.5)
   Uso: <i data-icon="folder"></i>  o  ICONS.render('folder')
   ========================================================================== */

(function () {
  'use strict';

  const COMMON = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"';

  const SET = {
    folder:    `<svg viewBox="0 0 24 24" ${COMMON}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>`,
    upload:    `<svg viewBox="0 0 24 24" ${COMMON}><path d="M12 16V4M5 11l7-7 7 7M4 20h16"/></svg>`,
    calendar:  `<svg viewBox="0 0 24 24" ${COMMON}><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>`,
    sparkle:   `<svg viewBox="0 0 24 24" ${COMMON}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></svg>`,
    chevron:   `<svg viewBox="0 0 24 24" ${COMMON}><path d="M6 9l6 6 6-6"/></svg>`,
    check:     `<svg viewBox="0 0 24 24" ${COMMON}><path d="M5 12l5 5 9-11"/></svg>`,
    arrow:     `<svg viewBox="0 0 24 24" ${COMMON}><path d="M5 12h14M13 5l7 7-7 7"/></svg>`,
    settings:  `<svg viewBox="0 0 24 24" ${COMMON}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8h0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" ${COMMON}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>`,
    tiktok:    `<svg viewBox="0 0 24 24" ${COMMON}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
    x:         `<svg viewBox="0 0 24 24" ${COMMON}><path d="M4 4l16 16M20 4L4 20"/></svg>`,
    linkedin:  `<svg viewBox="0 0 24 24" ${COMMON}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v8M8 7v0M12 18v-5a2.5 2.5 0 0 1 5 0v5"/></svg>`,
    youtube:   `<svg viewBox="0 0 24 24" ${COMMON}><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>`,
    threads:   `<svg viewBox="0 0 24 24" ${COMMON}><path d="M16 9c-1-2-3-3-5-3-3 0-5 2-5 5s2 5 5 5c2 0 4-1 4-3 0-1-1-2-3-2-1 0-3 1-3 2"/></svg>`,
    facebook:  `<svg viewBox="0 0 24 24" ${COMMON}><path d="M14 8V6a2 2 0 0 1 2-2h2v4h-2v3h2l-1 4h-1v7h-4v-7H10v-4h2V8a4 4 0 0 1 4-4"/></svg>`,
    grid:      `<svg viewBox="0 0 24 24" ${COMMON}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    chart:     `<svg viewBox="0 0 24 24" ${COMMON}><path d="M3 3v18h18M7 16l4-4 3 3 5-7"/></svg>`,
    play:      `<svg viewBox="0 0 24 24" ${COMMON}><path d="M6 4l14 8-14 8z"/></svg>`,
    plus:      `<svg viewBox="0 0 24 24" ${COMMON}><path d="M12 5v14M5 12h14"/></svg>`,
    close:     `<svg viewBox="0 0 24 24" ${COMMON}><path d="M5 5l14 14M19 5L5 19"/></svg>`,
    user:      `<svg viewBox="0 0 24 24" ${COMMON}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
    bell:      `<svg viewBox="0 0 24 24" ${COMMON}><path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3z M10 19a2 2 0 0 0 4 0"/></svg>`,
    search:    `<svg viewBox="0 0 24 24" ${COMMON}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>`,
    image:     `<svg viewBox="0 0 24 24" ${COMMON}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-9 9"/></svg>`,
    video:     `<svg viewBox="0 0 24 24" ${COMMON}><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 9l4-2v10l-4-2z"/></svg>`,
    clock:     `<svg viewBox="0 0 24 24" ${COMMON}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
    eye:       `<svg viewBox="0 0 24 24" ${COMMON}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
    heart:     `<svg viewBox="0 0 24 24" ${COMMON}><path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4-7 2 0 3.5 1 5 3 1.5-2 3-3 5-3 3 0 5.5 3.5 4 7-2 4.5-9 9-9 9z"/></svg>`,
  };

  function render(name) {
    return SET[name] || '';
  }

  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      const svg = SET[name];
      if (svg) {
        el.innerHTML = svg;
        el.classList.add('icon');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => hydrate());
  } else {
    hydrate();
  }

  window.ICONS = { render, hydrate, names: () => Object.keys(SET) };
})();
