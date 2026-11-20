// Vice Cover Studio — the editor: pick photos, arrange the panels, write a
// caption, pick a grade and a size, export the poster as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).

import { drawCover, renderCover, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = ['boulevard', 'beach', 'skyline'];

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const status = document.getElementById('status');
const panelList = document.getElementById('panels');
const zoomSlider = document.getElementById('zoom');
const samePhoto = document.getElementById('same-photo');

const state = {
  panels: [0, 1, 2].map(() => ({ img: null, src: null, zoom: 1, ox: 0, oy: 0 })),
  caption: 'Sunset Heist',
  grade: 'sunset',
  size: 'square',
  selected: 1,
};

let sampleImages = {};
let userImages = {};

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  const entries = await Promise.all(
    SAMPLES.map(async (name) => [name, await loadImage(`samples/${name}.jpg`)]),
  );
  sampleImages = Object.fromEntries(entries);
}

function currentSize() {
  return SIZES[state.size];
}

function redraw() {
  const size = currentSize();
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  updatePanelUI();
}

function updatePanelUI() {
  [...panelList.querySelectorAll('[data-panel]')].forEach((el) => {
    const i = Number(el.dataset.panel);
    el.classList.toggle('selected', i === state.selected);
    const label = el.querySelector('.panel-src');
    if (label) label.textContent = state.panels[i].src ?? 'Empty panel';
  });
  const panel = state.panels[state.selected];
  zoomSlider.value = String(panel.zoom);
  document.getElementById('zoom-value').textContent = `${Math.round(panel.zoom * 100)}%`;
}

/** Assigns a photo to a panel (and to all three when "same photo" is on). */
function assignPhoto(index, img, src) {
  const targets = samePhoto.checked ? [0, 1, 2] : [index];
  for (const i of targets) {
    state.panels[i].img = img;
    state.panels[i].src = src;
    state.panels[i].zoom = 1;
    state.panels[i].ox = 0;
    state.panels[i].oy = 0;
  }
  redraw();
}

function buildPanelControls() {
  panelList.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'panel-row';
    el.dataset.panel = String(i);
    el.innerHTML = `
      <div class="panel-head"><strong>Panel ${i + 1}</strong> <span class="panel-src">Empty panel</span></div>
      <div class="panel-btns">
        <label class="file-btn">Upload photo
          <input type="file" accept="image/*" data-upload="${i}">
        </label>
        <button type="button" data-sample="${i}">Use a sample</button>
      </div>`;
    el.addEventListener('click', (e) => {
      if (e.target.closest('button, label, input')) return;
      state.selected = i;
      updatePanelUI();
    });
    panelList.appendChild(el);
  }
  panelList.querySelectorAll('[data-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const i = Number(input.dataset.upload);
      const img = await loadImage(URL.createObjectURL(file));
      userImages[i] = img;
      assignPhoto(i, img, file.name);
      status.textContent = `Loaded ${file.name} into panel ${i + 1}.`;
    });
  });
  panelList.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.sample);
      const name = SAMPLES[(SAMPLES.indexOf(currentSampleName(i)) + 1) % SAMPLES.length];
      assignPhoto(i, sampleImages[name], `sample: ${name}`);
      status.textContent = `Panel ${i + 1} uses the ${name} sample.`;
    });
  });
}

function currentSampleName(i) {
  const src = state.panels[i].src ?? '';
  const hit = SAMPLES.find((name) => src.includes(name));
  return hit ?? SAMPLES[i % SAMPLES.length];
}

function buildOptionButtons() {
  const gradeBox = document.getElementById('grades');
  GRADES.forEach((grade) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = grade[0].toUpperCase() + grade.slice(1);
    btn.dataset.grade = grade;
    btn.addEventListener('click', () => {
      state.grade = grade;
      gradeBox.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
    if (grade === state.grade) btn.classList.add('active');
    gradeBox.appendChild(btn);
  });
  const sizeBox = document.getElementById('sizes');
  Object.entries(SIZES).forEach(([key, size]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = size.label;
    btn.dataset.size = key;
    btn.addEventListener('click', () => {
      state.size = key;
      sizeBox.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
    if (key === state.size) btn.classList.add('active');
    sizeBox.appendChild(btn);
  });
}

function wireEditor() {
  buildPanelControls();
  buildOptionButtons();
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    redraw();
  });
  zoomSlider.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(zoomSlider.value);
    redraw();
  });
  document.getElementById('reset-pan').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.ox = 0;
    panel.oy = 0;
    panel.zoom = 1;
    redraw();
  });
  // Drag on the preview pans the selected panel; a click picks a panel.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    state.selected = x < canvas.width * 0.3 ? 0 : x < canvas.width * 0.7 ? 1 : 2;
    drag = { x: e.clientX, y: e.clientY, ox: state.panels[state.selected].ox, oy: state.panels[state.selected].oy };
    canvas.setPointerCapture(e.pointerId);
    updatePanelUI();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    panel.ox = drag.ox + ((e.clientX - drag.x) / rect.width) * 0.6;
    panel.oy = drag.oy + ((e.clientY - drag.y) / rect.height) * 0.6;
    panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
    panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  document.getElementById('export').addEventListener('click', async () => {
    const size = currentSize();
    const blob = await exportPNG(size.w, size.h);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`;
  });
}

/** Renders the poster at `w` x `h` and returns it as a PNG blob. */
export function exportPNG(w, h) {
  const out = renderCover(state, w, h);
  return new Promise((resolve) => out.toBlob(resolve, 'image/png'));
}

// Programmatic hook used by the screenshot scenes and the export check.
window.__viceCover = { state, redraw, exportPNG, SIZES };

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
await loadSamples();
if (shot) {
  if (shot === 'editor') wireEditor();
  runShot(shot, query, {
    samples: sampleImages,
    load: loadImage,
    apply: (scene) => {
      state.panels = scene.panels;
      state.caption = scene.caption;
      state.grade = scene.grade;
      state.size = scene.size;
      state.selected = 1;
      captionInput.value = scene.caption;
      redraw();
    },
  });
} else {
  wireEditor();
  // Start with the samples spread across the three panels.
  state.panels[0].img = sampleImages.boulevard;
  state.panels[0].src = 'sample: boulevard';
  state.panels[1].img = sampleImages.beach;
  state.panels[1].src = 'sample: beach';
  state.panels[2].img = sampleImages.skyline;
  state.panels[2].src = 'sample: skyline';
  redraw();
}
