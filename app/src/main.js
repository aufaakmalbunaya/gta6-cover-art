// Wires the Vice City Nights editor: photo slots, caption, size, layout, grade, and
// the PNG export. The preview canvas is the cover itself at export resolution, so what
// you see is exactly what the download holds. A `?shot=` query sets up a fixed scene
// for a screenshot instead (see ./shots.js). Photos are read on this machine only.
import { COVER_SIZES, drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const stageNote = document.getElementById('stageNote');

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/boulevard.jpg'];

const state = {
  sizeKey: 'landscape',
  layout: 'poster',
  grade: 'sunset',
  titlePos: 'bottom',
  photos: [null, null, null],
  crops: [
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
  ],
};

let fontReady = false;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Paints the preview at the chosen export size and labels it. */
function redraw() {
  const size = COVER_SIZES[state.sizeKey];
  drawCover(canvas, {
    width: size.width,
    height: size.height,
    layout: state.layout,
    grade: state.grade,
    titlePos: state.titlePos,
    caption: captionInput.value,
    subcaption: subInput.value,
    photos: state.photos,
    crops: state.crops,
  });
  stageNote.textContent = `${size.label} · ${state.layout} · ${state.grade} grade`;
}

/** Marks one button in a segmented group as the active choice. */
function markOn(group, button) {
  group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === button));
}

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

captionInput.addEventListener('input', redraw);
subInput.addEventListener('input', redraw);

/** Loads a photo into one panel, resets that panel's crop, and repaints. */
async function setPhoto(index, url, label) {
  try {
    state.photos[index] = await loadImage(url);
    state.crops[index] = { zoom: 1, panX: 0, panY: 0 };
    document.querySelector(`input[data-zoom="${index}"]`).value = '1';
    document.querySelector(`input[data-panx="${index}"]`).value = '0';
    document.querySelector(`input[data-pany="${index}"]`).value = '0';
    status.textContent = `${label} loaded into panel ${index + 1}.`;
  } catch {
    status.textContent = `That photo could not be read. Try another file.`;
  }
  redraw();
}

document.querySelectorAll('input[data-photo]').forEach((input) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const index = Number(input.dataset.photo);
    setPhoto(index, URL.createObjectURL(file), file.name);
  });
});

document.querySelectorAll('button[data-sample]').forEach((button) => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.sample);
    setPhoto(index, SAMPLES[index], `Sample photo ${index + 1}`);
  });
});

document.querySelectorAll('button[data-fill-all]').forEach((button) => {
  button.addEventListener('click', async () => {
    const index = Number(button.dataset.fillAll);
    const photo = state.photos[index];
    if (!photo) {
      status.textContent = 'Load a photo into this panel first, then fill all panels with it.';
      return;
    }
    state.photos = [photo, photo, photo];
    state.crops = state.crops.map((crop) => ({ ...crop }));
    status.textContent = `Panel ${index + 1}'s photo now fills all three panels.`;
    redraw();
  });
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

/** Exports the cover at full size as a PNG download. */
document.getElementById('export').addEventListener('click', () => {
  const size = COVER_SIZES[state.sizeKey];
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'The export did not work. Try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-nights-${size.width}x${size.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-city-nights-${size.width}x${size.height}.png (${Math.round(blob.size / 1024)} KiB).`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

/** Waits for the Anton display font so the caption never falls back mid-shot. */
async function waitForFont() {
  if (fontReady) return;
  try {
    await document.fonts.load('400 100px Anton');
    await document.fonts.ready;
  } catch {
    // The caption still draws in the fallback condensed face.
  }
  fontReady = true;
}

if (shot) {
  runShot(shot, params, {
    load: loadImage,
    setState(next) {
      Object.assign(state, next);
      captionInput.value = next.caption ?? captionInput.value;
      subInput.value = next.subcaption ?? subInput.value;
    },
    redraw,
    waitForFont,
    canvas,
  });
} else {
  waitForFont().then(redraw);
  redraw();
}
