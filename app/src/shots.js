// Fixed scenes for the round-2 screenshots, driven by the query string:
//
//   ?shot=editor&layout=banner&grade=warm&caption=SUNSET HEIST
//     the editor with sample photos loaded and the caption set.
//   ?shot=cover&size=landscape&layout=quad&grade=posterize&caption=VICE CITY
//     the cover alone, drawn by the app at a size inside the screenshot limits
//     (landscape 1280 x 720, portrait 1024 x 1280, square 1080 x 1080, or w/h).
//
// Extra knobs: badge=NEW SUMMER 2026, tagline=EVERY SUNSET HAS A PRICE,
// badgeOn=0 hides the starburst, photo4 and crop4 feed the fourth plate.
// Crops are "zoom,panX,panY" and are deliberately far apart per plate, so the
// two sample photos never read as the same picture twice. The samples under
// app/samples/ were made for make.fun and are free to use.
//
// window.__shotReady is set once the scene is painted, so a screenshot tool
// can wait for it.
import { COVER_SIZES, GRADES, LAYOUTS, drawCover } from './cover.js';

const SHOT_DIMS = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 1024, height: 1280 },
  square: { width: 1080, height: 1080 },
};

const PHOTO_NAMES = ['boulevard', 'pier', 'boulevard', 'pier'];

/** A sample name from the query, or the fallback when it is not a plain name. */
function sampleUrl(name, fallback) {
  const safe = /^[a-z0-9-]+$/.test(name ?? '') ? name : fallback;
  return `samples/${safe}.jpg`;
}

/** Reads a "zoom,panX,panY" crop from the query, or keeps the fallback. */
function shotCrop(query, key, fallback) {
  const raw = query.get(key);
  if (!raw) return fallback;
  const parts = raw.split(',').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return fallback;
  return { zoom: parts[0], panX: parts[1], panY: parts[2] };
}

/** Strongly different crops per plate, so the two samples read as four shots. */
const SHOT_CROPS = [
  { zoom: 1.6, panX: -0.6, panY: 0.45 },
  { zoom: 1.3, panX: 0.7, panY: -0.5 },
  { zoom: 1.85, panX: 0.5, panY: 0.6 },
  { zoom: 1.2, panX: -0.7, panY: -0.6 },
];

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, api) {
  const sizeKey = COVER_SIZES[query.get('size')] ? query.get('size') : 'landscape';
  const layout = LAYOUTS.includes(query.get('layout')) ? query.get('layout') : 'quad';
  const grade = GRADES.includes(query.get('grade')) ? query.get('grade') : 'posterize';
  const titlePos = query.get('title') === 'top' ? 'top' : 'bottom';
  const caption = query.get('caption') ?? 'VICE CITY';
  const subcaption = query.get('sub') ?? 'SUMMER NIGHTS';
  const tagline = query.get('tagline') ?? 'EVERY SUNSET HAS A PRICE';
  const badgeText = query.get('badge') ?? 'NEW SUMMER 2026';
  const badgeOn = query.get('badgeOn') !== '0';
  const photos = await Promise.all(
    PHOTO_NAMES.map((fallback, i) => api.load(sampleUrl(query.get(`photo${i + 1}`), fallback))),
  );

  await api.waitForFont();

  const crops = SHOT_CROPS.map((fallback, i) => shotCrop(query, `crop${i + 1}`, fallback));

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const dims = SHOT_DIMS[sizeKey];
    // Keep custom sizes inside the screenshot gate: long side at most 1280,
    // short side at least 480, so a stray w/h can never break the entry.
    const width = Math.min(1280, Math.max(480, Number(query.get('w')) || dims.width));
    const height = Math.min(1280, Math.max(480, Number(query.get('h')) || dims.height));
    drawCover(api.canvas, {
      width,
      height,
      layout,
      grade,
      titlePos,
      caption,
      subcaption,
      tagline,
      badge: badgeOn ? badgeText : '',
      photos,
      crops,
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
    crops,
    caption,
    subcaption,
    tagline,
    badgeText,
    badgeOn,
  });
  api.redraw();
  markReady();
}
