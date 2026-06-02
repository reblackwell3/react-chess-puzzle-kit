import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'node_modules/stockfish/bin');
const targetDir = join(root, 'public/stockfish');
const files = [
  'stockfish-18-lite-single.js',
  'stockfish-18-lite-single.wasm',
];

if (!existsSync(sourceDir)) {
  console.error(
    'Stockfish not found. Run: npm install stockfish --save-optional',
  );
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  copyFileSync(join(sourceDir, file), join(targetDir, file));
}

console.log(`Copied Stockfish to ${targetDir}`);
