# 🎂 Tribute to Dharamraj Sir

A single-page birthday tribute website for Dharamraj Sir (HOD, Frontend Academics), built with semantic HTML5, Tailwind CSS (CDN), and vanilla ES6+ JavaScript.

## Features

- **Dracula-themed UI** — Dark IDE-inspired design with CSS custom properties
- **Code Editor** — Tabbed tribute viewer (bio/contributions/tribute) with syntax-highlighted panels
- **Interactive Console** — Terminal-style wish dispatcher with animated typing output
- **Wish Board** — SQL-themed form to post birthday wishes with localStorage persistence
- **Canvas Particles** — 60 FPS particle system with ResizeObserver & lifecycle management
- **Audio Chime** — Dual-tone sine wave (`C5→E5`) via Web Audio API, muted by default
- **Service Worker** — Inline Blob-based SW caching `/` and Tailwind CDN
- **Analytics** — `navigator.sendBeacon` with SHA-256 name hash; web-vitals (CLS/LCP/FID)
- **Accessibility** — ARIA roles, `prefers-reduced-motion` support, semantic sections
- **Test Harness** — Smoke tests via `?test=true` using `@jest/globals` CDN

## Structure

```
├── index.html           # Entry page (615 lines) — HTML, critical CSS, SW, copy JSON, CSP
├── css/style.css        # Design system, motion tokens, animations, utilities
├── js/
│   ├── app.js           # Module entry point — wires all modules
│   └── modules/
│       ├── clock.js     # Live clock in navbar
│       ├── editor.js    # Tabbed code editor
│       ├── particles.js # Canvas particle system
│       ├── audio.js     # Web Audio API chime
│       ├── terminal.js  # Terminal dispatcher with typing animation
│       ├── wishes.js    # Wish board form + DOM injection + localStorage
│       ├── copy.js      # Loads externalised strings from JSON script block
│       └── analytics.js # Analytics + web-vitals reporting
└── .gitignore
```

## Getting Started

Serve the project directory with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser. Append `?test=true` to run the test suite.

## Browser Support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge) with ES6 module support.

## License

MIT
