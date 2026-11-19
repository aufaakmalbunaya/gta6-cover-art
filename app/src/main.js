// Vice City Nights, round 2 — the editor wiring.
//
// Four photo slots now (the quad and banner layouts hold four plates), five
// grades, four layouts, and controls for the new poster furniture: the
// starburst badge words and the tagline bar. The preview canvas is the cover
// itself at export size, so the picture on screen is the picture the PNG
// holds. A `?shot=` query hands the page to ./shots.js for screenshots.
// Photos are read on this machine only; nothing is uploaded.
import { COVER_SIZES, GRADES, LAYOUTS, drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionField = document.getElementById('caption');
const scriptField = document.getElementById('subcaption');
const taglineField = document.getElementById('tagline');
const badgeField = document.getElementById('badgeText');
const badgeToggle = document.getElementById('badgeOn');
const statusLine = document.getElementById('status');
const stageNote = document.getElementById('stageNote');

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/boulevard.jpg', 'samples/pier.jpg'];

const emptyCrop = () => ({ zoom: 1, panX: 0, panY: 0 });

const state = {
  sizeKey: 'landscape',
  layout: 'quad',
  grade: 'posterize',
  titlePos: 'bottom',
  badgeOn: true,
  badgeText: 'NEW SUMMER 2026',
  tagline: 'EVERY SUNSET HAS A PRICE',
  photos: [null, null, null, null],
  crops: [emptyCrop(), emptyCrop(), emptyCrop(), emptyCrop()],
};

let fontLoaded = false;

/** Fetches an image and resolves once it is ready to draw. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Repaints the preview at the chosen export size and labels the stage. */
function redraw() {
  const size = COVER_SIZES[state.sizeKey];
  drawCover(canvas, {
    width: size.width,
    height: size.height,
    layout: state.layout,
    grade: state.grade,
    titlePos: state.titlePos,
    caption: captionField.value,
    subcaption: scriptField.value,
    tagline: taglineField.value,
    badge: state.badgeOn ? badgeField.value : '',
    photos: state.photos,
    crops: state.crops,
  });
  stageNote.textContent = `${size.label} · ${state.layout} · ${state.grade} grade`;
}

/** Highlights the picked button inside one segmented group. */
function markOn(group, button) {
  group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === button));
}

/** Wires one segmented group: click a button, keep its value, repaint. */
function bindSegments(id, onPick) {
  const group = document.getElementById(id);
  group.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    markOn(group, button);
    onPick(button.dataset);
    redraw();
  });
}

bindSegments('sizeSeg', (d) => { state.sizeKey = d.size; });
bindSegments('layoutSeg', (d) => { state.layout = d.layout; });
bindSegments('gradeSeg', (d) => { state.grade = d.grade; });
bindSegments('titleSeg', (d) => { state.titlePos = d.titlePos; });

captionField.addEventListener('input', redraw);
scriptField.addEventListener('input', redraw);
taglineField.addEventListener('input', redraw);
badgeField.addEventListener('input', redraw);
badgeToggle.addEventListener('change', () => {
  state.badgeOn = badgeToggle.checked;
  redraw();
});

/** Loads a picture into one plate, resets that plate's crop, repaints. */
async function setPhoto(index, url, label) {
  try {
    state.photos[index] = await loadImage(url);
    state.crops[index] = emptyCrop();
    document.querySelector(`input[data-zoom="${index}"]`).value = '1';
    document.querySelector(`input[data-panx="${index}"]`).value = '0';
    document.querySelector(`input[data-pany="${index}"]`).value = '0';
    statusLine.textContent = `${label} loaded into panel ${index + 1}.`;
  } catch {
    statusLine.textContent = 'That photo could not be read. Try another file.';
  }
  redraw();
}

document.querySelectorAll('input[data-photo]').forEach((input) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setPhoto(Number(input.dataset.photo), URL.createObjectURL(file), file.name);
  });
});

document.querySelectorAll('button[data-sample]').forEach((button) => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.sample);
    setPhoto(index, SAMPLES[index], `Sample photo ${index + 1}`);
  });
});

/** Fills every plate with one panel's photo, keeping each plate's own crop. */
document.querySelectorAll('button[data-fill-all]').forEach((button) => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.fillAll);
    const photo = state.photos[index];
    if (!photo) {
      statusLine.textContent = 'Load a photo into this panel first, then fill all panels with it.';
      return;
    }
    state.photos = state.photos.map(() => photo);
    statusLine.textContent = `Panel ${index + 1}'s photo now fills all ${state.photos.length} panels.`;
    redraw();
  });
});

/** Copies the crop state back onto the sliders, after a bulk load. */
function syncCropSliders() {
  document.querySelectorAll('input[data-zoom]').forEach((input) => {
    input.value = String(state.crops[Number(input.dataset.zoom)].zoom);
  });
  document.querySelectorAll('input[data-panx]').forEach((input) => {
    input.value = String(state.crops[Number(input.dataset.panx)].panX);
  });
  document.querySelectorAll('input[data-pany]').forEach((input) => {
    input.value = String(state.crops[Number(input.dataset.pany)].panY);
  });
}

/** Loads the two samples across the plates with varied crops, one click. */
document.getElementById('loadSamples').addEventListener('click', async () => {
  const varied = [
    { zoom: 1.6, panX: -0.6, panY: 0.4 },
    { zoom: 1.3, panX: 0.7, panY: -0.5 },
    { zoom: 1.8, panX: 0.5, panY: 0.6 },
    { zoom: 1.2, panX: -0.7, panY: -0.6 },
  ];
  for (let i = 0; i < state.photos.length; i++) {
    try {
      state.photos[i] = await loadImage(SAMPLES[i]);
      state.crops[i] = varied[i];
    } catch {
      // One failed sample leaves that plate empty; the rest still load.
    }
  }
  syncCropSliders();
  statusLine.textContent = 'Samples loaded with varied crops.';
  redraw();
});

document.querySelectorAll('input[data-zoom]').forEach((input) => {
  input.addEventListener('input', () => {
    state.crops[Number(input.dataset.zoom)].zoom = Number(input.value);
    redraw();
  });
});
document.querySelectorAll('input[data-panx]').forEach((input) => {
  input.addEventListener('input', () => {
    state.crops[Number(input.dataset.panx)].panX = Number(input.value);
    redraw();
  });
});
document.querySelectorAll('input[data-pany]').forEach((input) => {
  input.addEventListener('input', () => {
    state.crops[Number(input.dataset.pany)].panY = Number(input.value);
    redraw();
  });
});

/** Saves the cover at full size as a PNG download. */
document.getElementById('export').addEventListener('click', () => {
  const size = COVER_SIZES[state.sizeKey];
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) {
      statusLine.textContent = 'The export did not work. Try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-nights-${size.width}x${size.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusLine.textContent = `Saved vice-city-nights-${size.width}x${size.height}.png (${Math.round(blob.size / 1024)} KiB).`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

/** Waits for Anton so the caption never falls back mid-shot. */
async function waitForFont() {
  if (fontLoaded) return;
  try {
    await document.fonts.load('400 100px Anton');
    await document.fonts.ready;
  } catch {
    // The caption still draws in the fallback condensed face.
  }
  fontLoaded = true;
}

if (shot) {
  runShot(shot, params, {
    load: loadImage,
    setState(next) {
      Object.assign(state, next);
      captionField.value = next.caption ?? captionField.value;
      scriptField.value = next.subcaption ?? scriptField.value;
      taglineField.value = next.tagline ?? taglineField.value;
      badgeField.value = next.badgeText ?? badgeField.value;
      if (typeof next.badgeOn === 'boolean') {
        badgeToggle.checked = next.badgeOn;
      }
      document.querySelectorAll('#layoutSeg button').forEach((b) => {
        b.classList.toggle('on', b.dataset.layout === state.layout);
      });
      document.querySelectorAll('#gradeSeg button').forEach((b) => {
        b.classList.toggle('on', b.dataset.grade === state.grade);
      });
      document.querySelectorAll('#sizeSeg button').forEach((b) => {
        b.classList.toggle('on', b.dataset.size === state.sizeKey);
      });
      document.querySelectorAll('#titleSeg button').forEach((b) => {
        b.classList.toggle('on', b.dataset.titlePos === state.titlePos);
      });
    },
    redraw,
    waitForFont,
    canvas,
  });
} else {
  waitForFont().then(redraw);
  redraw();
}

// Keep the grade and layout lists honest: the buttons on the page must match
// the lists the painter knows, so a stray button cannot pick a dead option.
if (document.querySelectorAll('#gradeSeg button').length !== GRADES.length) {
  statusLine.textContent = 'Grade buttons do not match the painter. Reload the page.';
}
if (document.querySelectorAll('#layoutSeg button').length !== LAYOUTS.length) {
  statusLine.textContent = 'Layout buttons do not match the painter. Reload the page.';
}
