# Playground

## Auto-start

At the start of every session, run `npm start` as a background process. This starts the local server (`npx serve .`) and Babel watch (`npm run watch`) together. The site will be available at the URL printed in the terminal (usually http://localhost:3000).

## Workflow

- Edit `.jsx` files only — `.js` files are compiled output, never edit them by hand.
- Run `npm run build` before committing if you skipped `npm start`.
- The `npm start` script handles both serving and watching in one command.
