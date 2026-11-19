// Neon Coast Cover Maker — entry program (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-app.ts.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function copyTree(fromDir: string, toDir: string): number {
  mkdirSync(toDir, { recursive: true });
  let copied = 0;
  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    const from = join(fromDir, entry.name);
    const to = join(toDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyTree(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
      copied++;
    }
  }
  return copied;
}

function requireDir(path: string, label: string): void {
  let ok = false;
  try {
    ok = statSync(path).isDirectory();
  } catch {
    ok = false;
  }
  if (!ok) throw new Error(`${label} is missing: expected a directory at ${path}`);
}

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
requireDir(appDir, 'app/');
requireDir(shotsDir, 'screenshots/');

mkdirSync(outputDir, { recursive: true });
const copiedApp = copyTree(appDir, join(outputDir, 'app'));
const copiedShots = copyTree(shotsDir, join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`dossier written: ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
console.log(`copied ${copiedApp} app files and ${copiedShots} screenshots`);
