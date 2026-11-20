// Vice Cover Studio — poster renderer.
//
// Draws a GTA-style poster onto a canvas: one to three photo panels inside a
// white gutter frame, a sunset or neon colour grade, palm silhouettes, and a
// bold two-line caption with an eyebrow. Everything is drawn with the canvas
// 2D API; the only outside inputs are the photos and the cover settings.
//
// The renderer is size-agnostic: it works at the canvas's own pixel size, so
// the editor preview and the full-size PNG export share one code path.

export const COVER_SIZES = {
  square: { width: 1080, height: 1080, label: '1080 × 1080 · square post' },
  portrait: { width: 1080, height: 1350, label: '1080 × 1350 · portrait post' },
  wide: { width: 1920, height: 1080, label: '1920 × 1080 · wide banner' },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    top: 'rgba(255, 150, 80, 0)',
    mid: 'rgba(255, 90, 120, 0.28)',
    bottom: 'rgba(190, 30, 110, 0.55)',
    sky: ['#ff9a5c', '#ff5e7a', '#7a2a8a'],
  },
  neon: {
    label: 'Neon nights',
    top: 'rgba(60, 220, 255, 0)',
    mid: 'rgba(40, 120, 255, 0.25)',
    bottom: 'rgba(160, 30, 220, 0.55)',
    sky: ['#37e0ff', '#4a6cff', '#a020f0'],
  },
  noir: {
    label: 'Noir',
    top: 'rgba(20, 20, 40, 0)',
    mid: 'rgba(10, 10, 30, 0.35)',
    bottom: 'rgba(0, 0, 0, 0.72)',
    sky: ['#3a3a55', '#1a1a30', '#050510'],
  },
};

/** Panel layout for a given cover size and panel count.
 *  Returns rectangles in cover coordinates, with a white gutter between them.
 *  hero: one full-bleed photo. duo: a tall top panel and a bottom strip.
 *  trio: a big left panel and two stacked panels on the right. */
export function panelLayout(size, panels) {
  const { width: w, height: h } = size;
  const gutter = Math.round(w * 0.012);
  const captionZone = Math.round(h * 0.24);
  const photoArea = { x: 0, y: 0, w, h: h - captionZone };
  if (panels === 1) return [photoArea];
  if (panels === 2) {
    const strip = Math.round(photoArea.h * 0.32);
    return [
      { x: 0, y: 0, w, h: photoArea.h - strip - gutter },
      { x: 0, y: photoArea.h - strip, w, h: strip },
    ];
  }
  const rightW = Math.round(w * 0.38);
  const leftW = w - rightW - gutter;
  const halfH = Math.round((photoArea.h - gutter) / 2);
  return [
    { x: 0, y: 0, w: leftW, h: photoArea.h },
    { x: leftW + gutter, y: 0, w: rightW, h: halfH },
    { x: leftW + gutter, y: halfH + gutter, w: rightW, h: photoArea.h - halfH - gutter },
  ];
}

/** Draws one photo into a rectangle, cover-fit, with a zoom and a pan.
 *  `fit` is { zoom, fx, fy }: zoom 1..2.5, fx/fy 0..1 pan across the photo. */
export function drawPhotoPanel(ctx, photo, rect, fit) {
  if (!photo || !photo.naturalWidth) {
    ctx.fillStyle = '#241534';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const scale = base * (fit?.zoom ?? 1);
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const fx = fit?.fx ?? 0.5;
  const fy = fit?.fy ?? 0.5;
  const dx = rect.x + (rect.w - pw) * fx;
  const dy = rect.y + (rect.h - ph) * fy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.restore();
}

/** A palm silhouette: a curved trunk with seven fronds that arch up from the
 *  crown and droop back down, like a real palm against the sky. */
function drawPalm(ctx, x, y, size, lean, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk, curving gently.
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.06, -size * 0.5, 0, -size);
  ctx.stroke();
  // Fronds: each leaves the crown upward and falls back down past it.
  const crownX = 0;
  const crownY = -size;
  for (let i = 0; i < 7; i++) {
    const spread = (i / 6) * 2.4 - 1.2; // -1.2 .. +1.2 radians from vertical
    const len = size * (0.7 + (i % 2) * 0.12);
    const endX = crownX + Math.sin(spread) * len;
    const endY = crownY + len * 0.42;
    const ctrlX = crownX + Math.sin(spread) * len * 0.75;
    const ctrlY = crownY - len * 0.55;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrade(ctx, w, h, grade) {
  const tint = ctx.createLinearGradient(0, h * 0.3, 0, h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(0.55, grade.mid);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  // Vignette: darkened corners keep the caption readable.
  const vig = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.35, w / 2, h * 0.5, h * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Bold condensed caption lettering: white fill, thick dark outline, shadow.
 *  The font stack uses the condensed bold faces every desktop ships with. */
function drawCaption(ctx, w, h, caption, eyebrow) {
  const zoneTop = h * 0.76;
  const zoneH = h - zoneTop;
  const lines = caption
    .trim()
    .toUpperCase()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (!lines.length) return;
  const fontFor = (px) => `900 ${px}px 'Arial Narrow', 'Helvetica Neue Condensed Bold', Impact, 'Franklin Gothic Medium', sans-serif`;
  let size = zoneH * 0.42;
  const widest = () => Math.max(...lines.map((line) => ctx.measureText(line).width));
  ctx.font = fontFor(size);
  while (size > 16 && widest() > w * 0.92) {
    size -= 2;
    ctx.font = fontFor(size);
  }
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${Math.max(1, size * 0.01)}px`;
  const lineH = size * 1.04;
  const totalH = lines.length * lineH;
  // The eyebrow sits above the caption block, not on top of it: reserve its
  // height, then centre the whole block (eyebrow + caption) in the zone.
  const browSize = eyebrow ? Math.max(14, size * 0.22) : 0;
  const browH = eyebrow ? browSize * 1.9 : 0;
  let y = zoneTop + (zoneH - totalH - browH) / 2 + browH + size * 0.82;
  if (eyebrow) {
    ctx.font = `700 ${browSize}px 'Arial Narrow', Impact, sans-serif`;
    if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${browSize * 0.42}px`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = browSize * 0.3;
    // Baseline just above the first caption line's cap height.
    ctx.fillText(eyebrow.trim().toUpperCase(), w / 2, y - size * 0.78 - browSize * 0.45);
  }
  ctx.font = fontFor(size);
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${Math.max(1, size * 0.01)}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  for (const line of lines) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = 'rgba(20, 5, 30, 0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, w / 2, y);
    y += lineH;
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = '0px';
}

/** Draws the whole cover.
 *  `settings`: { sizeKey, panels, caption, eyebrow, gradeKey, photos, fits }
 *  `photos` is an array of images (one per panel, reused when short);
 *  `fits` is an array of { zoom, fx, fy } per panel. */
export function drawCover(canvas, settings) {
  const ctx = canvas.getContext('2d');
  const size = COVER_SIZES[settings.sizeKey] ?? COVER_SIZES.square;
  const { width: w, height: h } = size;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const grade = GRADES[settings.gradeKey] ?? GRADES.sunset;
  const panels = Math.min(3, Math.max(1, settings.panels ?? 3));
  // Sky backing: the grade's sunset bands show through the gutters.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((stop, i) => sky.addColorStop(i / (grade.sky.length - 1), stop));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // White gutters: paint the frame, then draw the photos inside it.
  ctx.fillStyle = '#fdf7ef';
  ctx.fillRect(0, 0, w, h - Math.round(h * 0.24));
  const rects = panelLayout(size, panels);
  rects.forEach((rect, i) => {
    const photo = settings.photos?.[i % (settings.photos?.length || 1)] ?? null;
    drawPhotoPanel(ctx, photo, rect, settings.fits?.[i]);
  });
  drawGrade(ctx, w, h, grade);
  // Palm silhouettes frame the caption zone.
  const palmSize = h * 0.13;
  drawPalm(ctx, w * 0.02, h * 0.985, palmSize, 0.16, 'rgba(15, 5, 25, 0.45)');
  drawPalm(ctx, w * 0.98, h * 0.985, palmSize * 0.9, -0.16, 'rgba(15, 5, 25, 0.45)');
  drawCaption(ctx, w, h, settings.caption ?? '', settings.eyebrow ?? 'Vice City');
  return { width: w, height: h };
}

/** Renders the cover at full size into a fresh canvas and returns it. */
export function renderCover(settings) {
  const size = COVER_SIZES[settings.sizeKey] ?? COVER_SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  drawCover(canvas, settings);
  return canvas;
}
