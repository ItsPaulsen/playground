# Playground

## Auto-start

At the start of every session, run `npm start` as a background process. This starts the local server (`npx serve .`) and Babel watch (`npm run watch`) together. The site will be available at the URL printed in the terminal (usually http://localhost:3000).

## Workflow

- Edit `.jsx` files only — `.js` files are Babel-compiled output. They ARE committed (GitHub Pages serves them), so run `npm run build` before committing if the watcher isn't running.

## Thumbnails

Experiment card thumbnails are produced by the thumb workflow — see `.claude/skills/thumb/SKILL.md`. When the user drops a `thumb.mov` in an experiment folder and says "do your thing", follow that skill exactly (LUT color correction, 600×400 encode, AVIF poster, cache-bust bump in index.html).
- `npm start` (or `npm run watch`) compiles all `.jsx` files immediately on startup, so no manual build step is needed after a fresh clone.
- Run `npm run build` only if you need a one-shot compile without the watcher.
- Adding a new `.jsx` file is automatically picked up — no changes to `package.json` needed. The build and watch scripts use `scripts/compile.js`, which discovers all `.jsx` files in the project at runtime.
