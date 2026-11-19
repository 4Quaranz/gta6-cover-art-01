// Neon Coast Cover Maker — cover render engine (2D canvas, no libraries).
// Every pixel of art here is drawn in code: panels, grades, sun, palms,
// skyline, grain and lettering. No game artwork, logos or fonts are used.

export const SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  heroTrio: { label: 'Hero + 3', panels: 4 },
  grid: { label: 'Grid 2×2', panels: 4 },
  triple: { label: 'Triple strip', panels: 3 },
  fullBleed: { label: 'Full bleed', panels: 3 },
};

export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.35) contrast(1.1) brightness(1.02)', wash: ['#ff5e3a', '#ff2e88'], washAlpha: 0.16 },
  neon: { label: 'Neon night', filter: 'saturate(1.5) contrast(1.16) brightness(0.96)', wash: ['#ff2e88', '#00e5c7'], washAlpha: 0.2 },
  golden: { label: 'Golden hour', filter: 'saturate(1.3) contrast(1.06) brightness(1.06)', wash: ['#ffb347', '#ff7b00'], washAlpha: 0.18 },
  teal: { label: 'Teal dawn', filter: 'saturate(1.25) contrast(1.08) brightness(1.0)', wash: ['#00c2a8', '#2b6cff'], washAlpha: 0.18 },
  mono: { label: 'Mono ink', filter: 'grayscale(1) contrast(1.22) brightness(1.04)', wash: ['#ffd166', '#ffffff'], washAlpha: 0.1 },
};

/** Panel rectangles for a layout, in normalised 0..1 coordinates. */
export function layoutRects(layout, aspect) {
  const gap = 0.012;
  if (layout === 'grid') {
    const half = 0.5 - gap / 2;
    return [
      { x: 0, y: 0, w: half, h: half },
      { x: 0.5 + gap / 2, y: 0, w: half, h: half },
      { x: 0, y: 0.5 + gap / 2, w: half, h: half },
      { x: 0.5 + gap / 2, y: 0.5 + gap / 2, w: half, h: half },
    ];
  }
  if (layout === 'triple') {
    const third = 1 / 3 - gap * (2 / 3);
    return [
      { x: 0, y: 0, w: third, h: 1 },
      { x: third + gap, y: 0, w: third, h: 1 },
      { x: (third + gap) * 2, y: 0, w: third, h: 1 },
    ];
  }
  if (layout === 'fullBleed') {
    const stripH = aspect > 1.2 ? 0.26 : 0.2;
    const half = 0.5 - gap / 2;
    return [
      { x: 0, y: 0, w: 1, h: 1 - stripH - gap },
      { x: 0, y: 1 - stripH, w: half, h: stripH },
      { x: 0.5 + gap / 2, y: 1 - stripH, w: half, h: stripH },
    ];
  }
  // heroTrio: hero on top (or left when wide), three small panels below.
  if (aspect > 1.2) {
    const heroW = 0.62;
    const smallW = (1 - heroW - gap * 2) / 3;
    const smallX = heroW + gap;
    return [
      { x: 0, y: 0, w: heroW, h: 1 },
      { x: smallX, y: 0, w: smallW, h: 1 },
      { x: smallX + smallW + gap, y: 0, w: smallW, h: 1 },
      { x: smallX + (smallW + gap) * 2, y: 0, w: smallW, h: 1 },
    ];
  }
  const heroH = 0.58;
  const third = 1 / 3 - gap * (2 / 3);
  return [
    { x: 0, y: 0, w: 1, h: heroH },
    { x: 0, y: heroH + gap, w: third, h: 1 - heroH - gap },
    { x: third + gap, y: heroH + gap, w: third, h: 1 - heroH - gap },
    { x: (third + gap) * 2, y: heroH + gap, w: third, h: 1 - heroH - gap },
  ];
}

function coverFit(img, rectW, rectH, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rectW / iw, rectH / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  // Clamp the offsets so the photo always covers the whole panel (no gaps).
  const maxOx = Math.max(0, (dw - rectW) / 2 / rectW);
  const maxOy = Math.max(0, (dh - rectH) / 2 / rectH);
  const cx = Math.min(maxOx, Math.max(-maxOx, ox));
  const cy = Math.min(maxOy, Math.max(-maxOy, oy));
  const dx = (rectW - dw) / 2 + cx * rectW;
  const dy = (rectH - dh) / 2 + cy * rectH;
  return { dx, dy, dw, dh };
}

function drawPhoto(ctx, img, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(0.55, '#a1336b');
    g.addColorStop(1, '#ff7b3d');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.round(rect.h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  } else {
    const f = coverFit(img, rect.w, rect.h, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    ctx.filter = grade.filter;
    ctx.drawImage(img, rect.x + f.dx, rect.y + f.dy, f.dw, f.dh);
    ctx.filter = 'none';
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.globalAlpha = grade.washAlpha;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawRetroSun(ctx, cx, cy, r) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, 'rgba(255, 170, 80, 0.55)');
  glow.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffd166');
  disc.addColorStop(0.5, '#ff8a3d');
  disc.addColorStop(1, '#ff2e88');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slats cut only inside the disc: clip to the circle first.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    const y = cy + r * (0.08 + i * 0.2);
    ctx.fillRect(cx - r, y, r * 2, r * (0.045 + i * 0.02));
  }
  ctx.restore();
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.fillStyle = '#160a24';
  ctx.strokeStyle = '#160a24';
  // Curved trunk, wider at the base.
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.quadraticCurveTo(2, -50, -8, -96);
  ctx.lineTo(2, -98);
  ctx.quadraticCurveTo(12, -48, 7, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: filled tapered leaves drooping out from the crown.
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.06 + i * 0.14);
    const len = 52 - Math.abs(i - 3) * 6;
    const tipX = -4 + Math.cos(a) * len;
    const tipY = -96 + Math.sin(a) * len * 0.55 + 12;
    const midX = -4 + Math.cos(a) * len * 0.55;
    const midY = -96 + Math.sin(a) * len * 0.3 - 10;
    ctx.beginPath();
    ctx.moveTo(-4, -96);
    ctx.quadraticCurveTo(midX, midY - 9, tipX, tipY);
    ctx.quadraticCurveTo(midX, midY + 9, -4, -96);
    ctx.closePath();
    ctx.fill();
  }
  // Coconuts under the crown.
  ctx.beginPath();
  ctx.arc(-10, -90, 4, 0, Math.PI * 2);
  ctx.arc(-1, -87, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(22, 8, 36, 0.9)';
  let bx = x;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (bx < x + w) {
    const bw = w * (0.05 + rnd() * 0.06);
    const bh = h * (0.3 + rnd() * 0.7);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
    for (let wy = y + h - bh + 6; wy < y + h - 8; wy += 12) {
      for (let wx = bx + 4; wx < bx + bw - 5; wx += 11) {
        if (rnd() > 0.45) ctx.fillRect(wx, wy, 3.5, 5);
      }
    }
    ctx.fillStyle = 'rgba(22, 8, 36, 0.9)';
    bx += bw + 2;
  }
  ctx.restore();
}

function drawGrain(ctx, w, h, strength) {
  const n = Math.floor((w * h) / 9000);
  ctx.save();
  ctx.globalAlpha = strength;
  for (let i = 0; i < n; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(22, 10, 36, 0.16)';
  const step = Math.max(14, Math.min(w, h) * 0.016);
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const r = step * 0.16 * (0.6 + 0.4 * Math.sin((x + y) / step));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.38, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(10,4,20,0)');
  g.addColorStop(1, 'rgba(10,4,20,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawTitle(ctx, state, w, h) {
  let size = state.titleSize || 104;
  const tilt = ((state.titleTilt || 0) * Math.PI) / 180;
  const hero = layoutRects(state.layout, w / h)[0];
  const hx = hero.x * w;
  const hy = hero.y * h;
  const hw = hero.w * w;
  const hh = hero.h * h;
  const cx = hx + hw / 2;
  const cy = hy + hh * 0.74;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = (state.title || 'NEON COAST').toUpperCase();
  const maxW = hw * 0.94;
  let fontSize = size;
  let font = `900 ${fontSize}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  ctx.font = font;
  while (fontSize > 40 && ctx.measureText(text).width > maxW) {
    fontSize -= 4;
    font = `900 ${fontSize}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
    ctx.font = font;
  }
  size = fontSize;
  const tw = ctx.measureText(text).width;
  let fill;
  if (state.titleStyle === 'neon') {
    fill = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    fill.addColorStop(0, '#7df9ff');
    fill.addColorStop(0.5, '#ff2e88');
    fill.addColorStop(1, '#b967ff');
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.22;
  } else if (state.titleStyle === 'white') {
    fill = '#fff7ec';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.08;
  } else {
    fill = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    fill.addColorStop(0, '#fff3b0');
    fill.addColorStop(0.45, '#ffb347');
    fill.addColorStop(0.75, '#ff5e3a');
    fill.addColorStop(1, '#ff2e88');
    ctx.shadowColor = 'rgba(255,46,136,0.55)';
    ctx.shadowBlur = size * 0.14;
  }
  ctx.lineWidth = Math.max(4, size * 0.07);
  ctx.strokeStyle = '#160a24';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0;
  const sub = state.subtitle || '';
  if (sub) {
    ctx.font = `italic 700 ${Math.round(size * 0.26)}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = '#fff7ec';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.1;
    ctx.fillText(sub, 0, size * 0.52);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  return { titleWidth: tw, titleY: cy };
}

function drawBadge(ctx, state, w, h) {
  const text = (state.badge || '').trim();
  if (!text) return;
  const fs = Math.round(Math.min(w, h) * 0.022);
  ctx.save();
  ctx.font = `800 ${fs}px "Arial Black", Impact, sans-serif`;
  const tw = ctx.measureText(text.toUpperCase()).width;
  const pad = fs * 0.9;
  const bw = tw + pad * 2;
  const bh = fs * 2.1;
  const x = w - bw - Math.min(w, h) * 0.03;
  const y = Math.min(w, h) * 0.03;
  ctx.translate(x + bw / 2, y + bh / 2);
  ctx.rotate(0.06);
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = '#fff7ec';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, 1);
  ctx.restore();
}

/** Render a full cover onto `canvas` from `state`. State shape is documented in app.js. */
export function renderCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const w = size.w;
  const h = size.h;
  const aspect = w / h;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutRects(state.layout, aspect);
  const gapPx = Math.round(Math.min(w, h) * 0.012);

  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((r, i) => {
    const panel = (state.panels && state.panels[i]) || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    drawPhoto(ctx, img, { x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h }, panel, grade);
  });

  const hero = rects[0];
  const hx = hero.x * w;
  const hy = hero.y * h;
  const hw = hero.w * w;
  const hh = hero.h * h;
  const fx = state.fx || {};
  if (fx.sun !== false) {
    drawRetroSun(ctx, hx + hw * 0.68, hy + hh * 0.24, Math.min(hw, hh) * 0.15);
  }
  if (fx.skyline !== false) {
    drawSkyline(ctx, hx, hy + hh * 0.82, hw, hh * 0.18);
  }
  if (fx.palms !== false) {
    drawPalm(ctx, hx + hw * 0.1, hy + hh * 0.98, Math.min(hw, hh) * 0.0021, 0.12);
    drawPalm(ctx, hx + hw * 0.24, hy + hh * 0.99, Math.min(hw, hh) * 0.0016, -0.1);
  }

  drawTitle(ctx, state, w, h);
  drawBadge(ctx, state, w, h);

  if (fx.grain !== false) drawGrain(ctx, w, h, 0.05);
  if (fx.halftone) drawHalftone(ctx, w, h);
  if (fx.vignette !== false) drawVignette(ctx, w, h);
  if (fx.frame !== false) {
    ctx.strokeStyle = 'rgba(255,247,236,0.9)';
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.006);
    ctx.strokeRect(gapPx / 2, gapPx / 2, w - gapPx, h - gapPx);
  }
  return { width: w, height: h };
}

/** Export a cover as a PNG blob at the chosen size. */
export function exportCoverPng(state) {
  const off = document.createElement('canvas');
  renderCover(off, state);
  return new Promise((resolve, reject) => {
    off.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}
