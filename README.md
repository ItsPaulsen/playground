# Playground

A collection of interactive visual experiments built with Claude. Live at [kristianpaulsen.com](https://kristianpaulsen.com).

## Experiments

- **Wave** — Animated waveform with controls for lines, motion, and pulse
- **Typo** — Animated typography with font and animation controls
- **Gradient** — Moving mesh gradient with tweakable color points
- **Trail** — Glowing cursor trail with tweakable particles, gravity, and spread
- **Card** — Credit card with cursor-tracked tilt
- **Button** — Button with a moving spark border

Plus **Waystones** (`/waystones/`) — a PoE2 stash search-string builder — and two reference pages: **Style** (`/style/`, the design system) and **Grid** (`/grid/`, the responsive layout with a live column overlay — press `G`).

## Stack

- **Preact**, vendored locally at `shared/vendor/preact-bundle.js` (no CDN).
- **JSX is compiled to JS** by `scripts/compile.js` (Babel, `@babel/preset-react`). The compiled `.js` files are committed — GitHub Pages serves them directly, so there is no build step at deploy time.
- Edit `.jsx` only; `npm start` (or `npm run watch`) recompiles on save.

## Shared

- `shared/tokens.css` — design tokens (Stone palette, radii, z-index)
- `shared/components.css` / `components.js` — shared components (select, slider, switch)
- `shared/tweaks-panel.jsx` — the reusable tweaks panel and controls
- `shared/header.js` — site header with navigation and theme toggle

## Deploy

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`.
