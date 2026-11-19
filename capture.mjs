// Screenshot + playtest runner for the Neon Coast Cover Maker entry.
// Serves app/ with serve.ts, drives headless Chromium (playwright-core),
// and writes the entry's screenshots/ plus a playtest report.
// Usage: node capture.mjs   (run from the repository root)
import pw from '/tmp/pw/node_modules/playwright-core/index.js';
const { chromium } = pw;
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SHOTS = join(ROOT, 'screenshots');
const PORT = 8091;
const BASE = `http://localhost:${PORT}`;

mkdirSync(SHOTS, { recursive: true });

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: ROOT, stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('server did not start')), 10000);
  server.stdout.on('data', () => { clearTimeout(timer); resolve(); });
  server.stderr.on('data', (d) => process.stderr.write(d));
});

const report = [];
const note = (line) => { report.push(line); console.log(line); };

let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/home/hatch/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();

  // 1. Self-test page: loads samples, exports all 3 sizes, checks no external requests.
  await page.goto(`${BASE}/index.html?selftest=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.title.startsWith('SELFTEST'), null, { timeout: 30000 });
  const selftest = await page.locator('#selftest').innerText();
  note('--- selftest ---');
  note(selftest);
  note('selftest title: ' + (await page.title()));

  // 2. Editor with photos loaded.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/index.html?shot=editor&title=SUNSET%20DRIVE&subtitle=coast%20nights%20%26%20neon%20lights`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.title === 'EDITOR READY', null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, '2-editor.jpg'), type: 'jpeg', quality: 82 });
  note('editor screenshot saved');

  // 3. Real export via the Export button: verify the downloaded PNG bytes.
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.click('#exportBtn');
  const download = await downloadPromise;
  const dlPath = join('/tmp', 'neon-coast-playtest.png');
  await download.saveAs(dlPath);
  const png = readFileSync(dlPath);
  const pngOk = png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47;
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  note(`export download: PNG signature ${pngOk ? 'OK' : 'BAD'}, ${w}x${h}, ${png.length} bytes`);

  // 4. Exported covers, shown as the PNG the app wrote (shot=export renders the blob).
  const covers = [
    { name: '1-cover.jpg', size: 'wide', title: 'SUNSET%20DRIVE', subtitle: 'coast%20nights%20%26%20neon%20lights', vw: 1280, vh: 720 },
    { name: '3-cover-square.jpg', size: 'square', title: 'NEON%20COAST', subtitle: 'golden%20hour%20stories', vw: 1024, vh: 1024 },
    { name: '4-cover-portrait.jpg', size: 'portrait', title: 'PALM%20SHADOWS', subtitle: 'one%20last%20summer%20night', vw: 1024, vh: 1280 },
  ];
  for (const c of covers) {
    await page.setViewportSize({ width: c.vw, height: c.vh });
    await page.goto(`${BASE}/index.html?shot=export&size=${c.size}&layout=heroTrio&grade=sunset&title=${c.title}&subtitle=${c.subtitle}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.title === 'EXPORT READY', null, { timeout: 30000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(SHOTS, c.name), type: 'jpeg', quality: 82 });
    note(`${c.name} saved (${c.vw}x${c.vh})`);
  }

  // 5. Report screenshot sizes.
  for (const f of ['1-cover.jpg', '2-editor.jpg', '3-cover-square.jpg', '4-cover-portrait.jpg']) {
    const st = statSync(join(SHOTS, f));
    note(`screenshot ${f}: ${st.size} bytes`);
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}

writeFileSync(join('/tmp', 'neon-coast-playtest.txt'), report.join('\n') + '\n');
console.log('playtest report: /tmp/neon-coast-playtest.txt');
