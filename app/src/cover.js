// Vice Cover Studio — the poster renderer.
//
// A cover is three photo panels divided by slanted white cuts, a colour
// grade over the whole poster, palm silhouettes along the foot, and a bold
// caption under a "VICE CITY" eyebrow. Everything is drawn with the canvas
// 2D API; no image, font or library is loaded from outside app/.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const GRADES = ['sunset', 'neon', 'noir'];

/** The three panel polygons for a canvas of width `w` and height `h`. */
export function panelShapes(w, h) {
  const slant = w * 0.045;
  const gap = Math.max(3, w * 0.005);
  const left = 0.3 * w;
  const right = 0.7 * w;
  return [
    [[0, 0], [left, 0], [left + slant, h], [0, h]],
    [[left + gap, 0], [right, 0], [right + slant, h], [left + slant + gap, h]],
    [[right + gap, 0], [w, 0], [w, h], [right + slant + gap, h]],
  ];
}

/** Draws one panel's photo clipped to its polygon, cover-fit with zoom/pan. */
function drawPanelPhoto(ctx, shape, panel, w, h) {
  const img = panel.img;
  if (!img) return;
  ctx.save();
  ctx.beginPath();
  shape.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.clip();
  // Panel bounds, widened so a slanted panel never shows a bare corner.
  const xs = shape.map(([x]) => x);
  const ys = shape.map(([, y]) => y);
  const x0 = Math.min(...xs) - w * 0.02;
  const x1 = Math.max(...xs) + w * 0.02;
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const pw = x1 - x0;
  const ph = y1 - y0;
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const cx = x0 + pw / 2 + (panel.ox ?? 0) * pw;
  const cy = y0 + ph / 2 + (panel.oy ?? 0) * ph;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

/** The colour grade over the whole poster, drawn after the photos. */
function applyGrade(ctx, grade, w, h) {
  if (grade === 'noir') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const wash = ctx.createLinearGradient(0, 0, w, h);
  if (grade === 'sunset') {
    wash.addColorStop(0, 'rgba(255, 140, 60, 0.16)');
    wash.addColorStop(0.55, 'rgba(255, 90, 120, 0.10)');
    wash.addColorStop(1, 'rgba(150, 40, 160, 0.20)');
  } else if (grade === 'neon') {
    wash.addColorStop(0, 'rgba(255, 0, 150, 0.16)');
    wash.addColorStop(0.5, 'rgba(120, 0, 220, 0.06)');
    wash.addColorStop(1, 'rgba(0, 220, 255, 0.16)');
  } else {
    wash.addColorStop(0, 'rgba(20, 30, 60, 0.10)');
    wash.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  }
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  if (grade === 'sunset') {
    // A low sun glow behind the top-right panel.
    const glow = ctx.createRadialGradient(w * 0.86, h * 0.2, 0, w * 0.86, h * 0.2, w * 0.42);
    glow.addColorStop(0, 'rgba(255, 200, 120, 0.34)');
    glow.addColorStop(1, 'rgba(255, 200, 120, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
  // Vignette, to pull the eye to the middle of the poster.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** The caption block: scrim, eyebrow, and the big caption itself. */
function drawCaptionBlock(ctx, caption, w, h) {
  // Scrim so white lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, h * 0.58, 0, h);
  scrim.addColorStop(0, 'rgba(8, 4, 18, 0)');
  scrim.addColorStop(0.55, 'rgba(8, 4, 18, 0.55)');
  scrim.addColorStop(1, 'rgba(8, 4, 18, 0.85)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  // No drawn palm silhouettes: the sample photos already carry real palms,
  // and a canvas-drawn palm at poster scale reads as a spider, not a tree.
  // Eyebrow.
  const brow = 'V I C E  C I T Y';
  const browSize = Math.max(14, h * 0.028);
  ctx.font = `700 ${browSize}px 'Arial Black', 'Liberation Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffb347';
  ctx.fillText(brow, w / 2, h * 0.815);
  // Caption, shrunk until it fits the poster's width.
  const text = (caption || '').trim().toUpperCase();
  if (!text) return;
  let size = h * 0.115;
  const font = (s) => `900 ${s}px 'Arial Black', 'Archivo Black', 'Liberation Sans', sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > w * 0.9 && size > 16) {
    size -= 2;
    ctx.font = font(size);
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.09;
  ctx.strokeStyle = '#160a24';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.04;
  ctx.strokeText(text, w / 2, h * 0.94);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, h * 0.94);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draws the whole poster onto `canvas` (at the canvas's own size).
 * `state` is { panels: [{ img, zoom, ox, oy } x3], caption, grade }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1a0b24';
  ctx.fillRect(0, 0, w, h);
  const shapes = panelShapes(w, h);
  state.panels.forEach((panel, i) => drawPanelPhoto(ctx, shapes[i], panel, w, h));
  // Slanted white cuts between the panels.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  const slant = w * 0.045;
  [[0.3, 0.3], [0.7, 0.7]].forEach(([a]) => {
    ctx.beginPath();
    ctx.moveTo(a * w, 0);
    ctx.lineTo(a * w + slant, h);
    ctx.stroke();
  });
  applyGrade(ctx, state.grade ?? 'sunset', w, h);
  drawCaptionBlock(ctx, state.caption ?? '', w, h);
}

/** Renders the poster at `w` x `h` on a fresh canvas and returns it. */
export function renderCover(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}
