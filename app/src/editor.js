// Neon Bay Cover Studio — the editor. Wires the controls in index.html to the
// cover engine: photo tray, per-panel crop and position, layouts, grades,
// caption editing, sizes, undo/redo and PNG export. Photos stay on the
// machine: they are read with FileReader and never uploaded anywhere.

import { GRADES, LAYOUTS, SIZES, SAMPLE_TITLES, layoutPanels, panelAt, renderCover } from './cover.js';

const SAMPLES = [
  { src: './samples/boulevard.jpg', name: 'Boulevard sunset' },
  { src: './samples/neon.jpg', name: 'Neon street' },
  { src: './samples/pier.jpg', name: 'Pier at dusk' },
];

const MAX_PHOTOS = 8;

export function defaultState() {
  return {
    layout: 'vice-grid',
    grade: 'sunset',
    size: 'square',
    title: 'NEON BAY',
    subtitle: 'chasing the last light',
    badge: 'Palma Shores • Est. 2026',
    photos: [],
    panelPhoto: [0, 1, 2, 0, 1, 2, 0, 1, 2],
    panelAdjust: Array.from({ length: 9 }, () => ({ dx: 0, dy: 0, zoom: 1, rot: 0 })),
    selectedPanel: 0,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function loadSamplePhotos(state) {
  const imgs = await Promise.all(SAMPLES.map((s) => loadImage(s.src)));
  state.photos = imgs.map((img, i) => ({ img, name: SAMPLES[i].name }));
}

export function createEditor() {
  const state = defaultState();
  const $ = (id) => document.getElementById(id);
  const preview = $('preview');
  const tray = $('tray');
  const status = $('status');
  let undoStack = [];
  let redoStack = [];
  let drag = null;

  function snapshot() {
    return JSON.stringify({
      layout: state.layout, grade: state.grade, size: state.size,
      title: state.title, subtitle: state.subtitle, badge: state.badge,
      panelPhoto: state.panelPhoto, panelAdjust: state.panelAdjust,
      selectedPanel: state.selectedPanel,
    });
  }

  function restore(json) {
    const s = JSON.parse(json);
    Object.assign(state, s);
    syncControls();
    render();
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    syncUndoButtons();
  }

  function syncUndoButtons() {
    $('undo').disabled = undoStack.length === 0;
    $('redo').disabled = redoStack.length === 0;
  }

  function say(msg) {
    status.textContent = msg;
  }

  function render() {
    const size = SIZES[state.size];
    const scale = Math.min(720 / size.w, 720 / size.h);
    preview.width = Math.round(size.w * scale);
    preview.height = Math.round(size.h * scale);
    renderCover(preview, state);
    // Outline the selected panel so the user sees what they are cropping.
    const layout = layoutPanels(state.layout);
    const p = layout.panels[state.selectedPanel];
    if (p) {
      const ctx = preview.getContext('2d');
      const sx = preview.width / size.w;
      const sy = preview.height / size.h;
      ctx.save();
      ctx.strokeStyle = '#00e5c7';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(p.x * preview.width + 2, p.y * preview.height + 2,
        p.w * preview.width - 4, p.h * preview.height - 4);
      ctx.setLineDash([]);
      ctx.font = 'bold 13px system-ui, sans-serif';
      const hint = `Panel ${state.selectedPanel + 1} — drag to move, scroll to zoom`;
      const hw = ctx.measureText(hint).width;
      ctx.fillStyle = 'rgba(10,4,14,0.75)';
      ctx.fillRect(6, preview.height - 26, hw + 12, 20);
      ctx.fillStyle = '#00e5c7';
      ctx.fillText(hint, 12, preview.height - 12);
      ctx.restore();
    }
    document.documentElement.dataset.ready = '1';
  }

  function syncControls() {
    $('title').value = state.title;
    $('subtitle').value = state.subtitle;
    $('badge').value = state.badge;
    document.querySelectorAll('#layouts button').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === state.layout);
    });
    document.querySelectorAll('#grades button').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === state.grade);
    });
    document.querySelectorAll('#sizes button').forEach((b) => {
      b.classList.toggle('active', b.dataset.size === state.size);
    });
    const adj = state.panelAdjust[state.selectedPanel] || { dx: 0, dy: 0, zoom: 1, rot: 0 };
    $('zoom').value = String(adj.zoom);
    $('rotate').value = String(adj.rot || 0);
    document.querySelectorAll('#tray .thumb').forEach((t, i) => {
      t.classList.toggle('assigned', state.panelPhoto[state.selectedPanel] === i);
    });
  }

  function renderTray() {
    tray.innerHTML = '';
    state.photos.forEach((photo, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb';
      b.title = `${photo.name} — click to put it in panel ${state.selectedPanel + 1}`;
      const img = document.createElement('img');
      img.src = photo.img.src;
      img.alt = photo.name;
      b.appendChild(img);
      const label = document.createElement('span');
      label.textContent = photo.name;
      b.appendChild(label);
      b.addEventListener('click', () => {
        pushUndo();
        state.panelPhoto[state.selectedPanel] = i;
        syncControls();
        render();
        say(`${photo.name} is now in panel ${state.selectedPanel + 1}.`);
      });
      tray.appendChild(b);
    });
    if (state.photos.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'tray-empty';
      empty.textContent = 'No photos yet — add your own or use the samples.';
      tray.appendChild(empty);
    }
    syncControls();
  }

  function buildPickers() {
    const layoutsEl = $('layouts');
    LAYOUTS.forEach((l) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.layout = l.id;
      b.innerHTML = `<span class="mini mini-${l.id}"></span><span>${l.name}</span><small>${l.blurb}</small>`;
      b.addEventListener('click', () => {
        if (state.layout === l.id) return;
        pushUndo();
        state.layout = l.id;
        state.selectedPanel = 0;
        syncControls();
        render();
        say(`Layout: ${l.name}.`);
      });
      layoutsEl.appendChild(b);
    });
    const gradesEl = $('grades');
    GRADES.forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.grade = g.id;
      b.title = g.name;
      b.style.background = `linear-gradient(135deg, ${g.sky[1]}, ${g.sky[2]}, ${g.accent})`;
      const label = document.createElement('span');
      label.textContent = g.name;
      b.appendChild(label);
      b.addEventListener('click', () => {
        if (state.grade === g.id) return;
        pushUndo();
        state.grade = g.id;
        syncControls();
        render();
        say(`Grade: ${g.name}.`);
      });
      gradesEl.appendChild(b);
    });
    const sizesEl = $('sizes');
    Object.entries(SIZES).forEach(([id, s]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.size = id;
      b.textContent = s.label;
      b.addEventListener('click', () => {
        if (state.size === id) return;
        pushUndo();
        state.size = id;
        syncControls();
        render();
        say(`Export size: ${s.label}.`);
      });
      sizesEl.appendChild(b);
    });
  }

  function bindInputs() {
    $('title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
    $('title').addEventListener('change', pushUndo);
    $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
    $('subtitle').addEventListener('change', pushUndo);
    $('badge').addEventListener('input', (e) => { state.badge = e.target.value; render(); });
    $('badge').addEventListener('change', pushUndo);
    $('zoom').addEventListener('input', (e) => {
      state.panelAdjust[state.selectedPanel].zoom = Number(e.target.value);
      render();
    });
    $('zoom').addEventListener('change', pushUndo);
    $('rotate').addEventListener('input', (e) => {
      state.panelAdjust[state.selectedPanel].rot = Number(e.target.value);
      render();
    });
    $('rotate').addEventListener('change', pushUndo);
    $('fillAll').addEventListener('click', () => {
      pushUndo();
      const layout = layoutPanels(state.layout);
      layout.panels.forEach((p, i) => {
        state.panelPhoto[i] = i % Math.max(1, state.photos.length);
      });
      render();
      say('Every panel filled from your photos.');
    });
    $('shuffle').addEventListener('click', () => {
      pushUndo();
      state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
      state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
      state.title = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
      state.selectedPanel = 0;
      syncControls();
      render();
      say(`Shuffled: ${state.layout} + ${state.grade} + “${state.title}”.`);
    });
    $('undo').addEventListener('click', () => {
      if (!undoStack.length) return;
      redoStack.push(snapshot());
      restore(undoStack.pop());
      syncUndoButtons();
      say('Undid the last change.');
    });
    $('redo').addEventListener('click', () => {
      if (!redoStack.length) return;
      undoStack.push(snapshot());
      restore(redoStack.pop());
      syncUndoButtons();
      say('Redid the change.');
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        $('undo').click();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        $('redo').click();
      }
    });
  }

  function bindPhotoInput() {
    const input = $('photoInput');
    input.addEventListener('change', () => {
      const files = [...input.files].filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      let loaded = 0;
      files.slice(0, MAX_PHOTOS - state.photos.length).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          loadImage(reader.result).then((img) => {
            state.photos.push({ img, name: file.name.replace(/\.[^.]+$/, '') });
            loaded += 1;
            if (loaded === files.length) {
              renderTray();
              render();
              say(`${loaded} photo${loaded > 1 ? 's' : ''} added. Click one to put it in the selected panel.`);
            }
          });
        };
        reader.readAsDataURL(file);
      });
      input.value = '';
    });
    $('useSamples').addEventListener('click', async () => {
      await loadSamplePhotos(state);
      renderTray();
      render();
      say('Sample photos loaded.');
    });
    const drop = $('dropzone');
    ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add('over');
    }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove('over');
    }));
    drop.addEventListener('drop', (e) => {
      const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    });
  }

  function bindPreview() {
    preview.addEventListener('pointerdown', (e) => {
      const rect = preview.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      const hit = panelAt(state.layout, fx, fy);
      if (hit >= 0 && hit !== state.selectedPanel) {
        state.selectedPanel = hit;
        syncControls();
        render();
        say(`Panel ${hit + 1} selected.`);
      }
      drag = { x: e.clientX, y: e.clientY, moved: false };
      preview.setPointerCapture(e.pointerId);
    });
    preview.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const rect = preview.getBoundingClientRect();
      const adj = state.panelAdjust[state.selectedPanel];
      const layout = layoutPanels(state.layout);
      const p = layout.panels[state.selectedPanel];
      if (!p) return;
      const dx = (e.clientX - drag.x) / rect.width / p.w;
      const dy = (e.clientY - drag.y) / rect.height / p.h;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 2) drag.moved = true;
      adj.dx = Math.max(-0.6, Math.min(0.6, adj.dx + dx));
      adj.dy = Math.max(-0.6, Math.min(0.6, adj.dy + dy));
      drag.x = e.clientX;
      drag.y = e.clientY;
      render();
    });
    preview.addEventListener('pointerup', () => {
      if (drag?.moved) pushUndo();
      drag = null;
    });
    preview.addEventListener('wheel', (e) => {
      e.preventDefault();
      const adj = state.panelAdjust[state.selectedPanel];
      adj.zoom = Math.max(1, Math.min(3.5, adj.zoom * Math.exp(-e.deltaY * 0.0012)));
      $('zoom').value = String(adj.zoom);
      render();
    }, { passive: false });
  }

  function bindExport() {
    $('exportPng').addEventListener('click', () => {
      const size = SIZES[state.size];
      const off = document.createElement('canvas');
      renderCover(off, state);
      say('Rendering PNG…');
      off.toBlob((blob) => {
        if (!blob) {
          say('Export failed — try again.');
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `neon-bay-cover-${size.w}x${size.h}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        say(`Exported PNG ${size.w} x ${size.h} — check your downloads.`);
      }, 'image/png');
    });
  }

  async function init() {
    buildPickers();
    bindInputs();
    bindPhotoInput();
    bindPreview();
    bindExport();
    syncUndoButtons();
    try {
      await loadSamplePhotos(state);
    } catch (err) {
      say('Sample photos could not load — add your own photo to start.');
    }
    renderTray();
    syncControls();
    render();
    say('Ready — pick a panel, drop in a photo, write a caption, export.');
  }

  return { state, init, render, renderTray, syncControls, say };
}
