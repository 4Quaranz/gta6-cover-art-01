// Neon Bay Cover Studio — the entry program (Node 22, standard library only).
// It hands the app in: copies this repository's app/ and screenshots/ to the
// output directory and writes /output/dossier.json with the kit's vendored
// make.fun library, so the sealed scorer can check it and the judge can read
// it. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => statSync(join(shotsDir, f)).isFile())
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the dossier's bytes; the rest refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; app/ over 993 files or
// 48 MiB in all, or a path under app/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
