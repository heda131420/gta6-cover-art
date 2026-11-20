// Vice Cover Studio — screenshot modes.
//
// The app reads its own query string, so a screenshot run is just a URL:
//   ?shot=cover&photo=beach&caption=Sunset%20Heist
//       renders only the finished cover, full-window, at the cover's size.
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//       shows the editor with that photo and caption loaded.
// Without ?shot the editor opens on the beach sample with its default caption.

import { state, initEditor } from './main.js';
import { COVER_SIZES, drawCover } from './cover.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function renderCoverShot(params) {
  const photoKey = params.get('photo') ?? 'beach';
  const caption = (params.get('caption') ?? 'Sunset Heist').replace(/\\n/g, '\n');
  const sizeKey = params.get('size') ?? 'square';
  const gradeKey = params.get('grade') ?? 'sunset';
  const size = COVER_SIZES[sizeKey] ?? COVER_SIZES.square;
  const img = await loadImage(`samples/${photoKey}.jpg`);
  document.body.classList.add('shot-cover');
  document.body.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.objectFit = 'contain';
  canvas.style.background = '#1a0b26';
  document.body.appendChild(canvas);
  drawCover(canvas, {
    sizeKey,
    panels: Number(params.get('panels') ?? 3),
    caption,
    eyebrow: params.get('eyebrow') ?? 'Vice City',
    gradeKey,
    photos: [img],
    fits: [{ zoom: 1, fx: 0.5, fy: 0.5 }],
  });
  document.title = `Vice Cover Studio — ${caption}`;
}

async function renderEditorShot(params) {
  const photoKey = params.get('photo') ?? 'boulevard';
  const caption = (params.get('caption') ?? 'Boulevard Queen').replace(/\\n/g, '\n');
  initEditor();
  const img = await loadImage(`samples/${photoKey}.jpg`);
  state.photos = [img];
  state.caption = caption;
  state.gradeKey = params.get('grade') ?? 'sunset';
  state.sizeKey = params.get('size') ?? 'square';
  const captionInput = document.querySelector('#caption');
  if (captionInput) captionInput.value = caption;
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.grade === state.gradeKey);
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.sizeKey);
  });
  const preview = document.querySelector('#preview');
  preview.width = COVER_SIZES[state.sizeKey].width;
  preview.height = COVER_SIZES[state.sizeKey].height;
  drawCover(preview, state);
  document.title = 'Vice Cover Studio — editor';
}

const params = new URLSearchParams(location.search);
if (params.get('shot') === 'cover') {
  renderCoverShot(params);
} else if (params.get('shot') === 'editor') {
  renderEditorShot(params);
} else {
  initEditor();
}
