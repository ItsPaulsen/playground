# Playground

A collection of interactive visual experiments built with Claude.

## Projects

- **Wave** — Animated waveform with controls for lines, motion, and pulse
- **Typo** — Animated typography with font and animation controls
- **Mesh** — Mesh gradient with tweakable color points

## Stack

No build step. Each project is a static HTML file using React 18 and Babel via CDN. Shared utilities live in `/shared`.

- `shared/tokens.css` — Stone color palette tokens
- `shared/tweaks-panel.jsx` — Reusable tweaks panel and controls
- `header.js` — Shared site header with navigation and theme toggle
