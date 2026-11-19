// Fixed scenes for screenshots, driven by the page's query string:
//
//   ?shot=editor&photo1=boulevard&photo2=pier&photo3=boulevard&caption=SUNSET HEIST
//     the editor with sample photos loaded and the caption set.
//   ?shot=cover&size=landscape&photo1=boulevard&photo2=pier&photo3=boulevard
//     &caption=SUNSET HEIST&layout=poster&grade=sunset
//     the cover alone, drawn by the app at a size inside the screenshot limits
//     (landscape 1280 x 720, portrait 1024 x 1280, square 1080 x 1080, or w/h).
//
// window.__shotReady is set once the scene is painted, so a screenshot tool can wait
// for it. The sample photos under app/samples/ were made for make.fun and are free to use.
import { COVER_SIZES, drawCover } from './cover.js';

const SHOT_DIMS = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 1024, height: 1280 },
  square: { width: 1080, height: 1080 },
};

function sampleUrl(name, fallback) {
  const safe = /^[a-z0-9-]+$/.test(name ?? '') ? name : fallback;
  return `samples/${safe}.jpg`;
}

/** Parses a "zoom,panX,panY" crop from the query, falling back to the given crop. */
function shotCrop(query, key, fallback) {
  const raw = query.get(key);
  if (!raw) return fallback;
  const parts = raw.split(',').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return fallback;
  return { zoom: parts[0], panX: parts[1], panY: parts[2] };
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, api) {
  const sizeKey = COVER_SIZES[query.get('size')] ? query.get('size') : 'landscape';
  const layout = query.get('layout') === 'triptych' ? 'triptych' : 'poster';
  const grade = ['sunset', 'neon', 'noir'].includes(query.get('grade')) ? query.get('grade') : 'sunset';
  const titlePos = query.get('title') === 'top' ? 'top' : 'bottom';
  const caption = query.get('caption') ?? 'SUNSET HEIST';
  const subcaption = query.get('sub') ?? 'VICE CITY';
  const photos = await Promise.all([
    api.load(sampleUrl(query.get('photo1') ?? query.get('photo'), 'boulevard')),
    api.load(sampleUrl(query.get('photo2'), 'pier')),
    api.load(sampleUrl(query.get('photo3'), 'boulevard')),
  ]);

  await api.waitForFont();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const dims = SHOT_DIMS[sizeKey];
    const width = Number(query.get('w')) || dims.width;
    const height = Number(query.get('h')) || dims.height;
    drawCover(api.canvas, {
      width,
      height,
      layout,
      grade,
      titlePos,
      caption,
      subcaption,
      photos,
      crops: [
        shotCrop(query, 'crop1', { zoom: 1.05, panX: 0, panY: 0.55 }),
        shotCrop(query, 'crop2', { zoom: 1.05, panX: 0, panY: 0.15 }),
        shotCrop(query, 'crop3', { zoom: 1.1, panX: 0.1, panY: 0.45 }),
      ],
    });
    markReady();
    return;
  }

  // Editor scene: the same state, shown through the normal editor.
  api.setState({
    sizeKey,
    layout,
    grade,
    titlePos,
    photos,
    caption,
    subcaption,
  });
  api.redraw();
  markReady();
}
