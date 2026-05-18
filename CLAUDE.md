# Playground

## Auto-start

At the start of every session, run `npm start` as a background process. This starts the local server (`npx serve .`) and Babel watch (`npm run watch`) together. The site will be available at the URL printed in the terminal (usually http://localhost:3000).

## Workflow

- Edit `.jsx` files only — `.js` files are Babel-compiled output and are gitignored.
- `npm start` (or `npm run watch`) compiles all `.jsx` files immediately on startup, so no manual build step is needed after a fresh clone.
- Run `npm run build` only if you need a one-shot compile without the watcher.
