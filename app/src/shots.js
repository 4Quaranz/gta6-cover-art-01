// Neon Bay Cover Studio — screenshot scenes. When the page opens with
// ?shot=<name>, the app loads its sample photos, applies a preset and draws
// the scene itself, so the maker can capture the app and its exported covers
// with a headless browser. This is the app's own drawing, nothing composited.
//   ?shot=cover-wide   the 1920 x 1080 cover, drawn full frame
//   ?shot=cover-square the 1080 x 1080 cover, drawn full frame
//   ?shot=cover-story  the 1080 x 1350 cover, drawn full frame
//   ?shot=editor       the editor with a photo loaded and a panel selected

import { renderCover } from './cover.js';

const COVER_SHOTS = {
  'cover-wide': {
    size: 'wide', layout: 'vice-grid', grade: 'sunset',
    title: 'NEON BAY', subtitle: 'chasing the last light',
  },
  'cover-square': {
    size: 'square', layout: 'nine', grade: 'neon',
    title: 'NIGHT SHIFT', subtitle: 'the city never sleeps',
  },
  'cover-story': {
    size: 'story', layout: 'hero', grade: 'gold',
    title: 'PIER PRESSURE', subtitle: 'last cast at dusk',
    panelPhoto: [2, 2, 2, 2, 2, 2, 2, 2, 2],
  },
};

const EDITOR_SHOT = {
  size: 'square', layout: 'tilt', grade: 'sunset',
  title: 'NEON BAY', subtitle: 'chasing the last light', selectedPanel: 1,
};

export function shotName() {
  return new URLSearchParams(location.search).get('shot');
}

export async function runShotMode(editor) {
  const name = shotName();
  if (!name) return false;
  const { state } = editor;

  if (COVER_SHOTS[name]) {
    const preset = COVER_SHOTS[name];
    Object.assign(state, preset);
    state.panelPhoto = preset.panelPhoto || [0, 1, 2, 0, 1, 2, 0, 1, 2];
    document.body.classList.add('shot-cover');
    document.getElementById('app').hidden = true;
    const canvas = document.getElementById('shotCanvas');
    canvas.hidden = false;
    // The engine sizes the canvas to the export size; CSS stretches it to
    // fill the screenshot window, which is opened at the same aspect.
    renderCover(canvas, state);
    document.documentElement.dataset.ready = '1';
    return true;
  }

  if (name === 'editor') {
    Object.assign(state, EDITOR_SHOT);
    editor.syncControls();
    editor.render();
    editor.say('Panel 2 selected — drag the photo to move it, scroll to zoom.');
    document.documentElement.dataset.ready = '1';
    return true;
  }

  return false;
}
