// Neon Coast Cover Maker — editor UI: photos, panels, caption, export.
// State lives in one object; every change re-renders the preview canvas.

import { SIZES, LAYOUTS, GRADES, layoutRects, renderCover, exportCoverPng } from './engine.js';

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const params = new URLSearchParams(location.search);

const state = {
  photos: [],
  panels: [],
  layout: 'heroTrio',
  grade: 'sunset',
  size: 'square',
  title: 'NEON COAST',
  subtitle: 'golden hour stories',
  badge: 'EST. 2026',
  titleSize: 104,
  titleTilt: -3,
  titleStyle: 'sunset',
  onePhoto: false,
  selected: 0,
  fx: { sun: true, palms: true, skyline: true, grain: true, halftone: false, vignette: true, frame: true },
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function resetPanels() {
  const n = panelCount();
  state.panels = Array.from({ length: n }, (_, i) => ({
    photo: state.photos.length > 0 ? i % state.photos.length : -1,
    zoom: 1,
    ox: 0,
    // The hero panel favours the top of the photo, where faces usually are.
    oy: i === 0 ? 0.3 : 0.1,
  }));
  if (state.selected >= n) state.selected = 0;
}

function render() {
  renderCover(canvas, state);
  syncPanelBar();
  syncPanelHint();
  syncThumbs();
}

function syncPanelBar() {
  const bar = $('panelBar');
  bar.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.photo >= 0 ? `Panel ${i + 1} · photo ${p.photo + 1}` : `Panel ${i + 1} · empty`;
    if (i === state.selected) b.classList.add('on');
    b.addEventListener('click', () => { state.selected = i; render(); });
    bar.appendChild(b);
  });
}

function syncPanelHint() {
  const p = state.panels[state.selected];
  const el = $('panelHint');
  if (!p) { el.textContent = 'No panel selected yet — click a panel on the preview.'; return; }
  el.textContent = p.photo >= 0
    ? `Panel ${state.selected + 1}: photo ${p.photo + 1}, zoom ${Math.round(p.zoom * 100)}%.`
    : `Panel ${state.selected + 1} is empty — pick a photo below to fill it.`;
  $('zoomRange').value = String(Math.round(p.zoom * 100));
}

function syncThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((img, i) => {
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = `Photo ${i + 1}`;
    if (state.panels[state.selected] && state.panels[state.selected].photo === i) t.classList.add('on');
    if (state.panels.some((p) => p.photo === i)) t.classList.add('used');
    t.addEventListener('click', () => assignPhotoToSelected(i));
    box.appendChild(t);
  });
  $('canvasHint').style.display = state.photos.length ? 'none' : '';
}

function assignPhotoToSelected(i) {
  const p = state.panels[state.selected];
  if (!p) return;
  if (state.onePhoto) {
    state.panels.forEach((panel) => { panel.photo = i; panel.zoom = 1; panel.ox = 0; panel.oy = 0.1; });
  } else {
    p.photo = i;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0.1;
  }
  render();
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not read ${file.name}`));
    img.src = url;
  });
}

async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  const before = state.photos.length;
  for (const f of list) {
    try {
      const img = await loadImageFile(f);
      state.photos.push(img);
    } catch (e) {
      console.warn(e.message);
    }
  }
  if (state.photos.length > before) {
    if (before === 0) resetPanels();
    else if (state.onePhoto) state.panels.forEach((p) => { p.photo = 0; });
    render();
  }
}

async function loadSamplePhotos() {
  const names = ['boulevard.jpg', 'pier.jpg'];
  for (const name of names) {
    try {
      const res = await fetch(`samples/${name}`);
      if (!res.ok) continue;
      const blob = await res.blob();
      const img = await loadImageFile(new File([blob], name, { type: blob.type }));
      if (!state.photos.some((p) => p.src === img.src)) state.photos.push(img);
    } catch (e) {
      console.warn('sample failed', name, e.message);
    }
  }
  if (state.photos.length) {
    resetPanels();
    render();
  }
}

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return { x: (event.clientX - r.left) * scaleX, y: (event.clientY - r.top) * scaleY };
}

function panelAt(x, y) {
  const aspect = canvas.width / canvas.height;
  const rects = layoutRects(state.layout, aspect);
  return rects.findIndex((r) => x >= r.x * canvas.width && x < (r.x + r.w) * canvas.width
    && y >= r.y * canvas.height && y < (r.y + r.h) * canvas.height);
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  const pt = canvasPoint(event);
  const idx = panelAt(pt.x, pt.y);
  if (idx < 0) return;
  state.selected = idx;
  drag = { x: pt.x, y: pt.y, moved: false, panel: state.panels[idx] };
  canvas.setPointerCapture(event.pointerId);
  render();
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag || !drag.panel) return;
  const pt = canvasPoint(event);
  const dx = pt.x - drag.x;
  const dy = pt.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const rects = layoutRects(state.layout, canvas.width / canvas.height);
  const r = rects[state.selected];
  drag.panel.ox = clamp(drag.panel.ox + dx / (r.w * canvas.width), -0.6, 0.6);
  drag.panel.oy = clamp(drag.panel.oy + dy / (r.h * canvas.height), -0.6, 0.6);
  drag.x = pt.x;
  drag.y = pt.y;
  if (drag.moved) render();
});

canvas.addEventListener('pointerup', () => { drag = null; });

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const p = state.panels[state.selected];
  if (!p) return;
  const step = event.deltaY < 0 ? 1.08 : 1 / 1.08;
  p.zoom = clamp(p.zoom * step, 1, 3);
  render();
}, { passive: false });

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function bindSeg(id, key, onChange) {
  $(id).addEventListener('click', (event) => {
    const b = event.target.closest('button[data-' + key + ']');
    if (!b) return;
    [...$(id).children].forEach((c) => c.classList.remove('on'));
    b.classList.add('on');
    onChange(b.dataset[key]);
  });
}

bindSeg('layoutSeg', 'layout', (v) => { state.layout = v; resetPanels(); render(); });
bindSeg('gradeSeg', 'grade', (v) => { state.grade = v; render(); });
bindSeg('sizeSeg', 'size', (v) => { state.size = v; render(); });
bindSeg('titleStyleSeg', 'tstyle', (v) => { state.titleStyle = v; render(); });

$('fileInput').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
$('sampleBtn').addEventListener('click', loadSamplePhotos);
$('onePhotoMode').addEventListener('change', (e) => {
  state.onePhoto = e.target.checked;
  if (state.onePhoto && state.photos.length) state.panels.forEach((p) => { p.photo = 0; p.zoom = 1; p.ox = 0; p.oy = 0; });
  render();
});

$('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
$('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
$('badgeInput').addEventListener('input', (e) => { state.badge = e.target.value; render(); });
$('titleSize').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); render(); });
$('titleTilt').addEventListener('input', (e) => { state.titleTilt = Number(e.target.value); render(); });
$('zoomRange').addEventListener('input', (e) => {
  const p = state.panels[state.selected];
  if (p) { p.zoom = Number(e.target.value) / 100; render(); }
});
$('fitBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  if (p) { p.zoom = 1; p.ox = 0; p.oy = 0; render(); }
});
$('swapBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  if (!p || !state.photos.length) return;
  p.photo = ((p.photo < 0 ? -1 : p.photo) + 1) % state.photos.length;
  p.zoom = 1; p.ox = 0; p.oy = 0;
  render();
});
$('clearBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  if (p) { p.photo = -1; render(); }
});

for (const key of ['sun', 'palms', 'skyline', 'grain', 'halftone', 'vignette', 'frame']) {
  $('fx' + key[0].toUpperCase() + key.slice(1)).addEventListener('change', (e) => {
    state.fx[key] = e.target.checked;
    render();
  });
}

// Keyboard: arrows nudge the selected panel, + / - zoom it, 1-4 pick a panel.
document.addEventListener('keydown', (event) => {
  const tag = (event.target && event.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const p = state.panels[state.selected];
  if (!p) return;
  const step = 0.03;
  if (event.key === 'ArrowLeft') { p.ox = clamp(p.ox - step, -0.6, 0.6); render(); }
  else if (event.key === 'ArrowRight') { p.ox = clamp(p.ox + step, -0.6, 0.6); render(); }
  else if (event.key === 'ArrowUp') { p.oy = clamp(p.oy - step, -0.6, 0.6); render(); }
  else if (event.key === 'ArrowDown') { p.oy = clamp(p.oy + step, -0.6, 0.6); render(); }
  else if (event.key === '+' || event.key === '=') { p.zoom = clamp(p.zoom * 1.1, 1, 3); render(); }
  else if (event.key === '-') { p.zoom = clamp(p.zoom / 1.1, 1, 3); render(); }
  else if (/^[1-4]$/.test(event.key)) {
    const idx = Number(event.key) - 1;
    if (idx < state.panels.length) { state.selected = idx; render(); }
  }
});

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

$('exportBtn').addEventListener('click', async () => {
  const s = SIZES[state.size];
  $('exportNote').textContent = 'Rendering PNG…';
  try {
    const blob = await exportCoverPng(state);
    downloadBlob(blob, `neon-coast-cover-${s.w}x${s.h}.png`);
    $('exportNote').textContent = `Exported ${s.w} × ${s.h} PNG (${Math.round(blob.size / 1024)} KB).`;
  } catch (e) {
    $('exportNote').textContent = `Export failed: ${e.message}`;
  }
});

$('exportAllBtn').addEventListener('click', async () => {
  $('exportNote').textContent = 'Rendering all 3 sizes…';
  for (const key of ['square', 'portrait', 'wide']) {
    const keep = state.size;
    state.size = key;
    const s = SIZES[key];
    try {
      const blob = await exportCoverPng(state);
      downloadBlob(blob, `neon-coast-cover-${s.w}x${s.h}.png`);
    } catch (e) {
      console.warn('export failed', key, e.message);
    }
    state.size = keep;
  }
  render();
  $('exportNote').textContent = 'Exported all 3 sizes as PNG files.';
});

// Drag and drop photos onto the preview.
const wrap = $('canvasWrap');
wrap.addEventListener('dragover', (e) => e.preventDefault());
wrap.addEventListener('drop', (e) => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});

// ---- Shot modes (for screenshots and self-test only) -----------------------

function applyShotParams() {
  const layout = params.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = params.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = params.get('size');
  if (size && SIZES[size]) state.size = size;
  const title = params.get('title');
  if (title) { state.title = title; $('titleInput').value = title; }
  const subtitle = params.get('subtitle');
  if (subtitle !== null) { state.subtitle = subtitle; $('subtitleInput').value = subtitle; }
  const badge = params.get('badge');
  if (badge !== null) { state.badge = badge; $('badgeInput').value = badge; }
}

async function runSelfTest() {
  const out = [];
  const check = (name, ok, detail = '') => out.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  try {
    await loadSamplePhotos();
    check('sample photos load', state.photos.length >= 2, `${state.photos.length} loaded`);
    applyShotParams();
    for (const key of ['square', 'portrait', 'wide']) {
      state.size = key;
      const blob = await exportCoverPng(state);
      const s = SIZES[key];
      check(`export ${s.w}x${s.h}`, blob.size > 10000, `${Math.round(blob.size / 1024)} KB`);
    }
    const external = performance.getEntriesByType('resource')
      .map((r) => r.name)
      .filter((n) => !n.startsWith(location.origin) && !n.startsWith('data:') && !n.startsWith('blob:'));
    check('no external requests', external.length === 0, external.join(', ') || 'none');
    check('panels filled', state.panels.every((p) => p.photo >= 0), `${state.panels.length} panels`);
  } catch (e) {
    out.push(`FAIL selftest threw — ${e.message}`);
  }
  const el = $('selftest');
  el.hidden = false;
  el.textContent = out.join('\n');
  document.title = out.some((l) => l.startsWith('FAIL')) ? 'SELFTEST FAIL' : 'SELFTEST PASS';
  return out;
}

async function boot() {
  resetPanels();
  applyShotParams();
  const shot = params.get('shot');
  if (shot === 'cover' || shot === 'export') {
    document.body.classList.add('shot-mode');
    await loadSamplePhotos();
    applyShotParams();
    render();
    if (shot === 'export') {
      const blob = await exportCoverPng(state);
      const url = URL.createObjectURL(blob);
      const img = $('shotImg');
      img.src = url;
      $('shotView').hidden = false;
      document.title = 'EXPORT READY';
    } else {
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.objectFit = 'contain';
      document.body.appendChild(canvas);
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.margin = 'auto';
      document.title = 'COVER READY';
    }
    return;
  }
  render();
  if (shot === 'editor') {
    await loadSamplePhotos();
    document.title = 'EDITOR READY';
    return;
  }
  if (params.get('selftest') === '1') {
    await runSelfTest();
  }
}

boot();
