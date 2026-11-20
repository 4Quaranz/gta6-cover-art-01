// Neon Bay Cover Studio — the cover engine. Pure canvas 2D, no dependencies.
// It draws a multi-panel poster cover from the user's photos: panels, a bold
// Anton title with a neon Pacifico subtitle, a Vice-style sunset or neon grade,
// grain and a vignette. Every name, city and character here is invented;
// nothing is taken from any game.

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  story: { w: 1080, h: 1350, label: 'Story 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

export const GRADES = [
  {
    id: 'sunset', name: 'Vice Sunset', accent: '#ff5e3a', deep: '#7b1e5b',
    sky: ['#2b1055', '#c33d6e', '#ff7a3d', '#ffc46b'],
    tint: 'rgba(255,110,60,0.16)', cool: 'rgba(90,20,90,0.20)',
  },
  {
    id: 'neon', name: 'Neon Night', accent: '#00e5c7', deep: '#12082e',
    sky: ['#0a0620', '#3b0f66', '#d63384', '#00e5c7'],
    tint: 'rgba(214,51,132,0.20)', cool: 'rgba(0,180,200,0.22)',
  },
  {
    id: 'gold', name: 'Palm Gold', accent: '#ffb347', deep: '#4a2408',
    sky: ['#3a1c07', '#8a4b12', '#e8963c', '#ffd97a'],
    tint: 'rgba(255,170,60,0.18)', cool: 'rgba(120,60,10,0.18)',
  },
  {
    id: 'noir', name: 'Teal Noir', accent: '#39c6ff', deep: '#06222e',
    sky: ['#04141d', '#0d3a4d', '#1b7a8a', '#39c6ff'],
    tint: 'rgba(40,160,200,0.20)', cool: 'rgba(4,20,30,0.24)',
  },
  {
    id: 'rose', name: 'Rose Heat', accent: '#ff2d78', deep: '#4d0a2e',
    sky: ['#2a0630', '#8a1450', '#ff2d78', '#ff9a5c'],
    tint: 'rgba(255,45,120,0.20)', cool: 'rgba(80,10,50,0.20)',
  },
];

export const LAYOUTS = [
  { id: 'vice-grid', name: 'Vice Grid', blurb: 'Hero + three panels' },
  { id: 'nine', name: 'Nine Panel', blurb: 'Six panels + title band' },
  { id: 'hero', name: 'Hero Bleed', blurb: 'One photo, full bleed' },
  { id: 'tilt', name: 'Tilted Stack', blurb: 'Tilted snapshots' },
  { id: 'diagonal', name: 'Diagonal Split', blurb: 'Two angled panels' },
  { id: 'strip', name: 'Comic Strip', blurb: 'Four tall panels' },
];

export const SAMPLE_TITLES = [
  'NEON BAY', 'NIGHT SHIFT', 'PIER PRESSURE', 'PALMA HEAT',
  'SUNSET CHASERS', 'TURBO PALMS', 'LAST LIGHT', 'COAST RUNNERS',
];

const PAPER = '#f4ecdd';
const INK = '#160a12';

/** Panel rects for a layout, in fractions of the cover. tilt is degrees. */
export function layoutPanels(layoutId) {
  switch (layoutId) {
    case 'nine': {
      // Six panels, top and bottom rows; the middle row is a full-width
      // ink title band, like the classic multi-panel poster cover.
      const cells = [];
      for (const r of [0, 2]) {
        for (let c = 0; c < 3; c++) {
          cells.push({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3, tilt: 0, photo: cells.length });
        }
      }
      return { panels: cells, titleCell: { x: 0, y: 1 / 3, w: 1, h: 1 / 3 } };
    }
    case 'hero':
      return {
        panels: [{ x: 0, y: 0, w: 1, h: 1, tilt: 0, photo: 0 }],
        titleZone: { x: 0.06, y: 0.62, w: 0.88, h: 0.32, align: 'left', scrim: true },
      };
    case 'tilt':
      return {
        panels: [
          { x: 0.05, y: 0.30, w: 0.42, h: 0.52, tilt: -5, photo: 0 },
          { x: 0.30, y: 0.24, w: 0.42, h: 0.52, tilt: 2, photo: 1 },
          { x: 0.54, y: 0.32, w: 0.42, h: 0.52, tilt: 5, photo: 2 },
        ],
        titleZone: { x: 0.05, y: 0.02, w: 0.90, h: 0.17, align: 'center', scrim: false },
        backdrop: true,
      };
    case 'diagonal':
      return {
        panels: [
          { x: 0, y: 0, w: 1, h: 0.78, tilt: 0, photo: 0, poly: [[0, 0], [1, 0], [0.42, 1], [0, 1]] },
          { x: 0, y: 0, w: 1, h: 0.78, tilt: 0, photo: 1, poly: [[1, 0], [1, 1], [0.42, 1]] },
        ],
        titleZone: { x: 0.05, y: 0.80, w: 0.90, h: 0.17, align: 'center', scrim: false },
      };
    case 'strip':
      return {
        panels: [0, 1, 2, 3].map((i) => ({
          x: i / 4, y: 0.20, w: 0.25, h: 0.80, tilt: 0, photo: i,
        })),
        titleZone: { x: 0.04, y: 0.02, w: 0.92, h: 0.16, align: 'center', scrim: false },
      };
    case 'vice-grid':
    default:
      return {
        panels: [
          { x: 0, y: 0, w: 1, h: 0.56, tilt: 0, photo: 0 },
          { x: 0, y: 0.56, w: 1 / 3, h: 0.44, tilt: 0, photo: 1 },
          { x: 1 / 3, y: 0.56, w: 1 / 3, h: 0.44, tilt: 0, photo: 2 },
          { x: 2 / 3, y: 0.56, w: 1 / 3, h: 0.44, tilt: 0, photo: 0 },
        ],
        titleZone: { x: 0.05, y: 0.30, w: 0.90, h: 0.22, align: 'center', scrim: true },
      };
  }
}

function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function wrapTitle(ctx, text, maxWidth, startSize) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  let size = startSize;
  let lines = [words.join(' ')];
  for (;;) {
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth || size <= 12) break;
    if (lines.length === 1 && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      continue;
    }
    size *= 0.92;
  }
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  return { lines, size };
}

function drawTitleBlock(ctx, zone, state, grade, W, H) {
  const zx = zone.x * W;
  const zy = zone.y * H;
  const zw = zone.w * W;
  const zh = zone.h * H;
  const cx = zx + zw / 2;

  if (zone.scrim) {
    const scrim = ctx.createLinearGradient(0, zy - zh * 0.4, 0, zy + zh);
    scrim.addColorStop(0, 'rgba(10,4,14,0)');
    scrim.addColorStop(1, 'rgba(10,4,14,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, zy - zh * 0.4, W, zh * 1.4);
  }

  const { lines, size } = wrapTitle(ctx, state.title || 'NEON BAY', zw, zh * 0.62);
  const lineH = size * 1.02;
  const totalH = lineH * lines.length;
  const subSize = Math.max(14, zh * 0.16);
  const subY = totalH / 2 + subSize * 0.6;
  const starR = Math.max(6, zh * 0.055);
  const starY = subY + subSize * 0.9;
  // The block is bottom-heavy (subtitle + stars hang below the title), so
  // centre it in the zone instead of letting the stars spill past its edge.
  const contentTop = -totalH / 2 - totalH * 0.08;
  const contentBottom = starY + starR;
  const shiftY = (contentTop + contentBottom) / 2;
  // Scale the whole block down when it would still spill out of the zone
  // (long two-line titles in a short band).
  const contentH = contentBottom - contentTop;
  const availH = zh * 0.96;
  const fit = contentH > availH ? availH / contentH : 1;

  ctx.save();
  ctx.translate(cx, zy + zh / 2 - shiftY * fit);
  ctx.rotate((-1.5 * Math.PI) / 180);
  ctx.scale(fit, fit);
  ctx.textAlign = zone.align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'middle';
  const tx = zone.align === 'left' ? -zw / 2 : 0;

  lines.forEach((line, i) => {
    const y = (i - (lines.length - 1) / 2) * lineH - totalH * 0.08;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = size * 0.10;
    ctx.shadowOffsetY = size * 0.045;
    ctx.strokeText(line, tx, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, tx, y);
  });

  // Neon script subtitle under the title.
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = subSize * 0.7;
  ctx.fillStyle = grade.accent;
  ctx.fillText(state.subtitle || '', tx, subY);
  ctx.shadowBlur = 0;

  // Five-star heat meter.
  const gap = starR * 2.6;
  const yStars = starY;
  const starX0 = zone.align === 'left' ? tx + starR : tx - 2 * gap;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starX0 + i * gap, yStars, starR,
      i < 4 ? '#ffd94d' : 'rgba(255,255,255,0.35)');
  }
  ctx.restore();
}

function drawBadge(ctx, text, grade, W, H) {
  if (!text) return;
  const pad = H * 0.012;
  ctx.font = `bold ${Math.max(12, H * 0.016)}px 'Arial Black', sans-serif`;
  const tw = ctx.measureText(text.toUpperCase()).width;
  const bw = tw + pad * 3;
  const bh = H * 0.038;
  const bx = W * 0.025;
  const by = H * 0.025;
  ctx.save();
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = 'rgba(10,4,14,0.88)';
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, H * 0.002);
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, 1);
  ctx.restore();
}

let grainPattern = null;
function grainTile() {
  if (grainPattern) return grainPattern;
  const t = document.createElement('canvas');
  t.width = 140;
  t.height = 140;
  const c = t.getContext('2d');
  const data = c.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 28;
  }
  c.putImageData(data, 0, 0);
  grainPattern = t;
  return t;
}

function drawPhotoInto(ctx, img, px, py, pw, ph, adjust, grade, clipPoly) {
  ctx.save();
  ctx.beginPath();
  if (clipPoly) {
    clipPoly.forEach(([fx, fy], i) => {
      const x = px + fx * pw;
      const y = py + fy * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = adjust.zoom || 1;
  const base = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const cx = px + pw / 2 + (adjust.dx || 0) * pw;
  const cy = py + ph / 2 + (adjust.dy || 0) * ph;
  ctx.translate(cx, cy);
  if (adjust.rot) ctx.rotate((adjust.rot * Math.PI) / 180);
  ctx.filter = 'saturate(1.18) contrast(1.06)';
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.filter = 'none';
  // Sunset / neon grade: warm wash + cool shadow wash.
  ctx.globalCompositeOperation = 'soft-light';
  const wash = ctx.createLinearGradient(0, -dh / 2, 0, dh / 2);
  wash.addColorStop(0, grade.tint);
  wash.addColorStop(1, grade.cool);
  ctx.fillStyle = wash;
  ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/**
 * Render the cover described by `state` onto `canvas` at its own size.
 * state: { layout, grade, title, subtitle, badge, size, photos, panelPhoto,
 *   panelAdjust } — photos are HTMLImageElements (or any drawable).
 */
export function renderCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  const W = size.w;
  const H = size.h;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const layout = layoutPanels(state.layout);
  const gutter = Math.max(4, Math.round(W * 0.008));

  // Backdrop: paper for grids, gradient sky for the tilted stack.
  if (layout.backdrop) {
    const sky = ctx.createLinearGradient(0, 0, W, H);
    grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.5, H * 0.42, 10, W * 0.5, H * 0.42, W * 0.42);
    sun.addColorStop(0, 'rgba(255,220,140,0.95)');
    sun.addColorStop(0.35, 'rgba(255,160,90,0.45)');
    sun.addColorStop(1, 'rgba(255,160,90,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
  }

  const photos = state.photos || [];
  const panelPhoto = state.panelPhoto || [];
  const panelAdjust = state.panelAdjust || [];

  layout.panels.forEach((p, i) => {
    const px = p.x * W + gutter;
    const py = p.y * H + gutter;
    const pw = p.w * W - gutter * 2;
    const ph = p.h * H - gutter * 2;
    const photoIdx = panelPhoto[i] ?? p.photo ?? 0;
    const photo = photos[photoIdx % Math.max(1, photos.length)];
    // A photo entry is { img, name }; a bare drawable is used as-is.
    const img = photo && photo.img ? photo.img : photo;
    const adjust = panelAdjust[i] || { dx: 0, dy: 0, zoom: 1, rot: 0 };

    ctx.save();
    if (p.tilt) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((p.tilt * Math.PI) / 180);
      ctx.translate(-(px + pw / 2), -(py + ph / 2));
    }
    // Polaroid white frame + drop shadow for tilted snapshots.
    if (layout.backdrop) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = H * 0.02;
      ctx.shadowOffsetY = H * 0.008;
      ctx.fillStyle = '#fffdf6';
      ctx.fillRect(px - gutter, py - gutter, pw + gutter * 2, ph + gutter * 2 + H * 0.05);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    if (img) {
      drawPhotoInto(ctx, img, px, py, pw, ph, adjust, grade,
        p.poly ? p.poly.map(([fx, fy]) => [fx, fy]) : null);
    } else {
      ctx.fillStyle = grade.deep;
      ctx.fillRect(px, py, pw, ph);
    }
    // Thin ink frame around each panel.
    ctx.strokeStyle = 'rgba(22,10,18,0.85)';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(px, py, pw, ph);
    ctx.restore();
  });

  // Centre title cell of the nine-panel grid.
  if (layout.titleCell) {
    const c = layout.titleCell;
    const cx = c.x * W + gutter;
    const cy = c.y * H + gutter;
    const cw = c.w * W - gutter * 2;
    const ch = c.h * H - gutter * 2;
    ctx.fillStyle = INK;
    ctx.fillRect(cx, cy, cw, ch);
    // Halftone dots.
    ctx.fillStyle = grade.accent;
    const step = Math.max(10, cw / 16);
    for (let y = cy + step / 2; y < cy + ch; y += step) {
      for (let x = cx + step / 2; x < cx + cw; x += step) {
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.5, step * 0.12), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    drawTitleBlock(ctx, { x: c.x, y: c.y, w: c.w, h: c.h, align: 'center', scrim: false },
      state, grade, W, H);
  } else if (layout.titleZone) {
    drawTitleBlock(ctx, layout.titleZone, state, grade, W, H);
  }

  drawBadge(ctx, state.badge, grade, W, H);

  // Grain + vignette over the whole cover.
  const tile = grainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,14,0.22)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** Hit-test a point (cover fractions) against the layout's panels. */
export function panelAt(layoutId, fx, fy) {
  const layout = layoutPanels(layoutId);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) return i;
  }
  return -1;
}
