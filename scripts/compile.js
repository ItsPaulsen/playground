#!/usr/bin/env node
// Auto-discovers and builds/watches all .jsx files in the project.
// Usage: node scripts/compile.js [--watch]

const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const watch = process.argv.includes('--watch');
const babel = path.join(__dirname, '..', 'node_modules', '.bin', 'babel');

function findJsx(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findJsx(full, files);
    else if (entry.name.endsWith('.jsx')) files.push(full);
  }
  return files;
}

const root = path.join(__dirname, '..');
const files = findJsx(root);

if (watch) {
  console.log(`Watching ${files.length} .jsx files…`);
  for (const f of files) {
    const out = f.replace(/\.jsx$/, '.js');
    spawn(babel, ['--watch', '--presets', '@babel/preset-react', f, '-o', out], {
      stdio: 'inherit',
      cwd: root,
    });
  }
} else {
  console.log(`Building ${files.length} .jsx files…`);
  for (const f of files) {
    const out = f.replace(/\.jsx$/, '.js');
    const rel = path.relative(root, f);
    process.stdout.write(`  ${rel} … `);
    execSync(`"${babel}" --presets @babel/preset-react "${f}" -o "${out}"`, { cwd: root });
    console.log('✓');
  }
  console.log('Done.');
}
