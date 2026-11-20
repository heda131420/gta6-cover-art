// Vice Cover Studio — editor wiring.
//
// Owns the editor state (photos, layout, caption, grade, size, per-panel
// crop), binds every control, renders the live preview, and exports the
// finished cover as a PNG. The preview reuses drawCover from cover.js, so
// what the editor shows is exactly what the export writes.

import { COVER_SIZES, GRADES, drawCover, renderCover } from './cover.js';

const SAMPLES = [
  { key: 'boulevard', src: 'samples/boulevard.jpg', label: 'Neon boulevard' },
  { key: 'beach', src: 'samples/beach.jpg', label: 'Sunset beach' },
  { key: 'skyline', src: 'samples/skyline.jpg', label: 'Night skyline' },
];

export const state = {
  sizeKey: 'square',
  panels: 3,
  caption: 'Sunset\nHeist',
  eyebrow: 'Vice City',
  gradeKey: 'sunset',
  photos: [],
  fits: [{ zoom: 1, fx: 0.5, fy: 0.5 }, { zoom: 1, fx: 0.5, fy: 0.5 }, { zoom: 1, fx: 0.5, fy: 0.5 }],
};

let previewCanvas = null;
let activePanel = 0;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSample(key) {
  const sample = SAMPLES.find((s) => s.key === key) ?? SAMPLES[0];
  const img = await loadImage(sample.src);
  state.photos = [img];
  state.fits = state.fits.map(() => ({ zoom: 1, fx: 0.5, fy: 0.5 }));
  renderPreview();
  syncSampleButtons();
}

function renderPreview() {
  if (!previewCanvas) return;
  const size = COVER_SIZES[state.sizeKey];
  previewCanvas.width = size.width;
  previewCanvas.height = size.height;
  previewCanvas.style.aspectRatio = `${size.width} / ${size.height}`;
  drawCover(previewCanvas, state);
  updateFitControls();
}

function updateFitControls() {
  const fit = state.fits[activePanel];
  const zoom = document.querySelector('#fit-zoom');
  const panX = document.querySelector('#fit-pan-x');
  const panY = document.querySelector('#fit-pan-y');
  if (!zoom || !panX || !panY) return;
  zoom.value = fit.zoom;
  panX.value = fit.fx;
  panY.value = fit.fy;
  document.querySelector('#fit-panel-label').textContent = `Panel ${activePanel + 1} of ${state.panels}`;
}

function syncSampleButtons() {
  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.classList.toggle('active', state.photos.length === 1 && btn.dataset.sample === currentSampleKey());
  });
}

function currentSampleKey() {
  const img = state.photos[0];
  if (!img) return '';
  const sample = SAMPLES.find((s) => img.src.endsWith(s.src));
  return sample?.key ?? '';
}

function syncLayoutButtons() {
  document.querySelectorAll('[data-panels]').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.panels) === state.panels);
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.sizeKey);
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.grade === state.gradeKey);
  });
}

function buildPanelTabs() {
  const tabs = document.querySelector('#panel-tabs');
  if (!tabs) return;
  tabs.innerHTML = '';
  for (let i = 0; i < state.panels; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Panel ${i + 1}`;
    btn.className = i === activePanel ? 'active' : '';
    btn.addEventListener('click', () => {
      activePanel = i;
      buildPanelTabs();
      updateFitControls();
    });
    tabs.appendChild(btn);
  }
}

async function exportPng() {
  const canvas = renderCover(state);
  const size = COVER_SIZES[state.sizeKey];
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-cover-${size.width}x${size.height}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  const status = document.querySelector('#export-status');
  if (status) status.textContent = `Exported ${size.width} × ${size.height} PNG — check your downloads.`;
}

export function initEditor() {
  previewCanvas = document.querySelector('#preview');
  // Caption.
  const captionInput = document.querySelector('#caption');
  captionInput.value = state.caption;
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    renderPreview();
  });
  const eyebrowInput = document.querySelector('#eyebrow');
  eyebrowInput.value = state.eyebrow;
  eyebrowInput.addEventListener('input', () => {
    state.eyebrow = eyebrowInput.value;
    renderPreview();
  });
  // Layout, size and grade.
  document.querySelectorAll('[data-panels]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.panels = Number(btn.dataset.panels);
      activePanel = 0;
      buildPanelTabs();
      syncLayoutButtons();
      renderPreview();
    });
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sizeKey = btn.dataset.size;
      syncLayoutButtons();
      renderPreview();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.gradeKey = btn.dataset.grade;
      syncLayoutButtons();
      renderPreview();
    });
  });
  // Sample photos.
  const sampleRow = document.querySelector('#sample-row');
  for (const sample of SAMPLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sample';
    btn.dataset.sample = sample.key;
    const img = document.createElement('img');
    img.src = sample.src;
    img.alt = sample.label;
    const span = document.createElement('span');
    span.textContent = sample.label;
    btn.append(img, span);
    btn.addEventListener('click', () => loadSample(sample.key));
    sampleRow.appendChild(btn);
  }
  // Your own photos: up to three, one per panel.
  document.querySelector('#upload').addEventListener('change', async (event) => {
    const files = [...event.target.files].slice(0, 3);
    if (!files.length) return;
    const images = [];
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        images.push(await loadImage(url));
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    state.photos = images;
    state.fits = images.map(() => ({ zoom: 1, fx: 0.5, fy: 0.5 }));
    while (state.fits.length < 3) state.fits.push({ zoom: 1, fx: 0.5, fy: 0.5 });
    renderPreview();
    syncSampleButtons();
  });
  // Per-panel crop: zoom and pan.
  document.querySelector('#fit-zoom').addEventListener('input', (e) => {
    state.fits[activePanel].zoom = Number(e.target.value);
    renderPreview();
  });
  document.querySelector('#fit-pan-x').addEventListener('input', (e) => {
    state.fits[activePanel].fx = Number(e.target.value);
    renderPreview();
  });
  document.querySelector('#fit-pan-y').addEventListener('input', (e) => {
    state.fits[activePanel].fy = Number(e.target.value);
    renderPreview();
  });
  document.querySelector('#export').addEventListener('click', exportPng);
  buildPanelTabs();
  syncLayoutButtons();
  loadSample('beach');
}

// Caption presets: one click fills in a ready-made cover line.
export function applyPreset(caption, gradeKey) {
  state.caption = caption;
  if (gradeKey) state.gradeKey = gradeKey;
  const input = document.querySelector('#caption');
  if (input) input.value = caption;
  syncLayoutButtons();
  renderPreview();
}

export { GRADES, COVER_SIZES };
