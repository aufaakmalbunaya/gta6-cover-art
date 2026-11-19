// Vice City Nights, round 2 — the cover painter, revised after the first test.
//
// What changed since round 1: the title is now the poster (far bigger, with a
// slanted neon script line under it), two extra grades (a posterised halftone
// look and a stronger warm sunset), two extra layouts (a four-panel grid and a
// hero-plus-strip banner), and real poster furniture — a starburst badge, a
// tagline bar, a halftone band and a five-star row — all drawn by this file.
// The word block stacks top to bottom as tagline bar, stars, big title, then
// the script line under the title, so no two pieces ever overlap. Every
// picture the app paints comes from files under app/; nothing here reaches
// the network.

export const COVER_SIZES = {
  square: { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
  landscape: { width: 1920, height: 1080, label: 'Landscape · 1920 × 1080' },
};

export const GRADES = ['sunset', 'warm', 'posterize', 'neon', 'noir'];
export const LAYOUTS = ['poster', 'triptych', 'quad', 'banner'];

const PAPER = '#fff3d6';
const DARK = '#1c0b2e';
const POSTER_SEED = 20261119;

/** One corner of a panel, as a share of the cover, in pixels. */
function pt(w, h, fx, fy) {
  return [w * fx, h * fy];
}

/** A tiny deterministic generator, so the halftone dots never move between runs. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function aspectKind(w, h) {
  const r = w / h;
  if (r > 1.4) return 'wide';
  if (r < 0.9) return 'tall';
  return 'even';
}

/**
 * Panel polygons for a cover, plus where the little retro sun sits.
 * Every layout is written in shares of the cover, so the same poster shape
 * holds at square, portrait and landscape export sizes.
 */
export function panelShapes(width, height, layout) {
  const kind = aspectKind(width, height);
  const P = (fx, fy) => pt(width, height, fx, fy);

  if (layout === 'triptych') {
    if (kind === 'wide') {
      return {
        panels: [
          [P(0, 0), P(0.34, 0), P(0.31, 1), P(0, 1)],
          [P(0.35, 0), P(0.67, 0), P(0.64, 1), P(0.32, 1)],
          [P(0.68, 0), P(1, 0), P(1, 1), P(0.65, 1)],
        ],
        sun: { x: width * 0.9, y: height * 0.09, r: height * 0.05 },
      };
    }
    return {
      panels: [
        [P(0, 0), P(1, 0), P(1, 0.3), P(0, 0.34)],
        [P(0, 0.36), P(1, 0.32), P(1, 0.64), P(0, 0.68)],
        [P(0, 0.7), P(1, 0.66), P(1, 1), P(0, 1)],
      ],
      sun: { x: width * 0.1, y: height * 0.09, r: height * 0.045 },
    };
  }

  if (layout === 'quad') {
    // Four plates in a 2 x 2 grid, the middle seams leaning a little.
    return {
      panels: [
        [P(0, 0), P(0.52, 0), P(0.49, 0.5), P(0, 0.53)],
        [P(0.53, 0), P(1, 0), P(1, 0.47), P(0.5, 0.5)],
        [P(0, 0.54), P(0.49, 0.51), P(0.47, 1), P(0, 1)],
        [P(0.5, 0.51), P(1, 0.48), P(1, 1), P(0.48, 1)],
      ],
      sun: { x: width * 0.5, y: height * 0.5, r: height * 0.042 },
    };
  }

  if (layout === 'banner') {
    // One wide hero plate on top, three small plates in a strip below it.
    if (kind === 'tall') {
      return {
        panels: [
          [P(0, 0), P(1, 0), P(1, 0.55), P(0, 0.58)],
          [P(0, 0.6), P(0.35, 0.57), P(0.33, 1), P(0, 1)],
          [P(0.36, 0.57), P(0.68, 0.56), P(0.66, 1), P(0.34, 1)],
          [P(0.69, 0.56), P(1, 0.55), P(1, 1), P(0.67, 1)],
        ],
        sun: { x: width * 0.86, y: height * 0.1, r: height * 0.045 },
      };
    }
    return {
      panels: [
        [P(0, 0), P(1, 0), P(1, 0.62), P(0, 0.66)],
        [P(0, 0.68), P(0.35, 0.65), P(0.33, 1), P(0, 1)],
        [P(0.36, 0.65), P(0.68, 0.64), P(0.66, 1), P(0.34, 1)],
        [P(0.69, 0.64), P(1, 0.62), P(1, 1), P(0.67, 1)],
      ],
      sun: { x: width * 0.88, y: height * 0.11, r: height * 0.05 },
    };
  }

  // Poster: a big hero plate on the left, two smaller plates stacked right.
  if (kind === 'wide') {
    return {
      panels: [
        [P(0, 0), P(0.6, 0), P(0.57, 1), P(0, 1)],
        [P(0.61, 0), P(1, 0), P(1, 0.48), P(0.58, 0.48)],
        [P(0.58, 0.5), P(1, 0.5), P(1, 1), P(0.57, 1)],
      ],
      sun: { x: width * 0.08, y: height * 0.1, r: height * 0.05 },
    };
  }
  return {
    panels: [
      [P(0, 0), P(1, 0), P(1, 0.54), P(0, 0.6)],
      [P(0, 0.62), P(0.51, 0.58), P(0.48, 1), P(0, 1)],
      [P(0.52, 0.58), P(1, 0.56), P(1, 1), P(0.49, 1)],
    ],
    sun: { x: width * 0.09, y: height * 0.09, r: height * 0.05 },
  };
}

/** Walks a polygon onto the context as the current path. */
function trace(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

/** The upright box that holds a polygon, used to fit a photo inside it. */
function boundsOf(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** One photo, cover-fit into one panel with its zoom and pan. */
function drawPhoto(ctx, photo, crop, poly) {
  const box = boundsOf(poly);
  ctx.save();
  trace(ctx, poly);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, '#46206b');
    g.addColorStop(1, '#140820');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = 'rgba(255, 243, 214, 0.6)';
    ctx.font = `400 ${Math.round(box.h * 0.06)}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', box.x + box.w / 2, box.y + box.h / 2);
    ctx.restore();
    return;
  }
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const scale = Math.max(box.w / iw, box.h / ih) * (crop?.zoom ?? 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const overX = dw - box.w;
  const overY = dh - box.h;
  const dx = box.x - overX / 2 + (crop?.panX ?? 0) * (overX / 2);
  const dy = box.y - overY / 2 + (crop?.panY ?? 0) * (overY / 2);
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/**
 * Posterises one panel in place: the photo is copied offscreen, each colour
 * channel is snapped to one of five steps, the flat colours come back, and a
 * field of halftone dots is laid over them. Fixed seed, so two exports match.
 */
function posterizePanel(ctx, poly) {
  const box = boundsOf(poly);
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(box.w));
  off.height = Math.max(2, Math.round(box.h));
  const o = off.getContext('2d');
  o.drawImage(ctx.canvas, box.x, box.y, box.w, box.h, 0, 0, off.width, off.height);
  const img = o.getImageData(0, 0, off.width, off.height);
  const d = img.data;
  const snap = (v) => Math.min(255, Math.round(v / 64) * 64);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = snap(d[i]);
    d[i + 1] = snap(d[i + 1]);
    d[i + 2] = snap(d[i + 2]);
  }
  o.putImageData(img, 0, 0);
  ctx.save();
  trace(ctx, poly);
  ctx.clip();
  ctx.drawImage(off, box.x, box.y);
  // Halftone dots: a fixed grid, each dot sized by a seeded wobble.
  const rnd = seeded(POSTER_SEED);
  const step = Math.max(11, Math.round(box.w / 88));
  ctx.fillStyle = 'rgba(20, 4, 36, 0.28)';
  for (let gy = box.y + step / 2; gy < box.y + box.h; gy += step) {
    for (let gx = box.x + step / 2; gx < box.x + box.w; gx += step) {
      const r = step * (0.16 + rnd() * 0.22);
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** One panel's colour grade, clipped to the panel. */
function gradePanel(ctx, grade, poly) {
  const box = boundsOf(poly);
  ctx.save();
  trace(ctx, poly);
  ctx.clip();
  if (grade === 'posterize') {
    posterizePanel(ctx, poly);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 122, 40, 0.4)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'source-over';
    const warm = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    warm.addColorStop(0, 'rgba(255, 200, 90, 0.12)');
    warm.addColorStop(1, 'rgba(255, 60, 140, 0.28)');
    ctx.fillStyle = warm;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else if (grade === 'warm') {
    // A strong warm sunset: one amber multiply wash, then a pink fall.
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 150, 60, 0.38)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 90, 120, 0.35)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'source-over';
    const fall = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    fall.addColorStop(0, 'rgba(255, 214, 110, 0.22)');
    fall.addColorStop(0.55, 'rgba(255, 120, 70, 0.1)');
    fall.addColorStop(1, 'rgba(255, 60, 140, 0.32)');
    ctx.fillStyle = fall;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, 'rgba(0, 229, 255, 0.18)');
    g.addColorStop(1, 'rgba(255, 0, 140, 0.32)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 0, 160, 0.32)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(12, 10, 32, 0.3)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'overlay';
    const g = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else {
    // Sunset, the original warm wash.
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 120, 40, 0.35)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    g.addColorStop(0, 'rgba(255, 190, 80, 0.1)');
    g.addColorStop(0.55, 'rgba(255, 110, 90, 0.12)');
    g.addColorStop(1, 'rgba(255, 60, 140, 0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  // A soft inner edge so neighbouring plates stay apart.
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = Math.max(24, box.w * 0.05);
  ctx.strokeStyle = 'rgba(10, 2, 24, 0.2)';
  trace(ctx, poly);
  ctx.stroke();
  ctx.restore();
}

/** The little slatted retro sun, kept small and tucked into a corner. */
function drawSun(ctx, sun) {
  const r = sun.r;
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2 + 8);
  off.height = Math.ceil(r * 2 + 8);
  const o = off.getContext('2d');
  const cx = off.width / 2;
  const cy = off.height / 2;
  const g = o.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffd76a');
  g.addColorStop(0.45, '#ff7a3d');
  g.addColorStop(0.75, '#ff2e88');
  g.addColorStop(1, '#7b2ff7');
  o.fillStyle = g;
  o.beginPath();
  o.arc(cx, cy, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.08;
  let thick = r * 0.045;
  while (y < cy + r) {
    o.fillRect(0, y, off.width, thick);
    y += thick + r * 0.11;
    thick *= 1.45;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(255, 110, 60, 0.55)';
  ctx.shadowBlur = r * 0.35;
  ctx.drawImage(off, sun.x - off.width / 2, sun.y - off.height / 2);
  ctx.restore();
}

/**
 * Where the words sit. The block reads top to bottom as tagline bar, stars,
 * big title, then the script line under the title — at the bottom of the
 * cover, or mirrored at the top when the title goes up there.
 */
function titleBlock(height, titlePos, titleSize) {
  if (titlePos === 'top') {
    const titleY = height * 0.055 + titleSize;
    return {
      titleY,
      scriptY: titleY + titleSize * 0.48,
      starsY: titleY + titleSize * 0.82,
      barY: titleY + titleSize * 1.12,
      barH: titleSize * 0.42,
    };
  }
  return {
    titleY: height * 0.88,
    scriptY: height * 0.965,
    starsY: height * 0.7,
    barY: height * 0.585,
    barH: titleSize * 0.42,
  };
}

/** The big caption: Anton, a warm-to-pink gradient, a dark rim and a glow. */
function drawTitle(ctx, text, width, block, titleSize) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return titleSize;
  let size = titleSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `400 ${s}px Anton, 'Arial Narrow', sans-serif`; };
  setFont(size);
  while (ctx.measureText(words).width > width * 0.94 && size > 20) {
    size -= 2;
    setFont(size);
  }
  const cx = width / 2;
  const cy = block.titleY;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.018);
  ctx.translate(-cx, -cy);
  const fill = ctx.createLinearGradient(0, cy - size, 0, cy + size * 0.14);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.45, '#ffe9b8');
  fill.addColorStop(0.75, '#ff9a3d');
  fill.addColorStop(1, '#ff2e88');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = DARK;
  ctx.lineWidth = Math.max(4, size * 0.09);
  ctx.shadowColor = 'rgba(255, 45, 149, 0.6)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.04;
  ctx.strokeText(words, cx, cy);
  ctx.fillStyle = fill;
  ctx.fillText(words, cx, cy);
  ctx.restore();
  return size;
}

/**
 * The script-style line under the title. Anton is the only font on board, so
 * the line is slanted hard, filled with a neon gradient, given a glow, and
 * underlined with a hand-drawn swoosh, so it reads as a script accent.
 */
function drawScriptLine(ctx, text, width, block, titleSize) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  const size = Math.max(16, Math.round(titleSize * 0.3));
  ctx.save();
  ctx.font = `400 ${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(size * 0.28)}px`; } catch { /* older canvas */ }
  const tw = ctx.measureText(words).width;
  const cy = block.scriptY;
  const cx = width / 2;
  ctx.translate(cx, cy);
  ctx.transform(1, 0, -0.32, 1, 0, 0);
  const fill = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
  fill.addColorStop(0, '#00e5ff');
  fill.addColorStop(0.5, '#ff7ad9');
  fill.addColorStop(1, '#ffd76a');
  ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
  ctx.shadowBlur = size * 0.5;
  ctx.fillStyle = fill;
  ctx.fillText(words, 0, 0);
  // The swoosh: one bezier flourish sweeping under the words.
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-tw * 0.58, size * 0.42);
  ctx.bezierCurveTo(-tw * 0.2, size * 0.95, tw * 0.25, size * 0.95, tw * 0.62, size * 0.18);
  ctx.stroke();
  ctx.restore();
}

/** Five gold stars in a row, centred on the given line. */
function drawStars(ctx, width, y, size) {
  const r = size * 0.22;
  const gap = r * 2.7;
  const startX = width / 2 - gap * 2;
  ctx.save();
  ctx.fillStyle = '#ffd76a';
  ctx.strokeStyle = DARK;
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = size * 0.12;
  for (let i = 0; i < 5; i++) {
    const cx = startX + i * gap;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? r : r * 0.42;
      const x = cx + Math.cos(ang) * rad;
      const y2 = y + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(x, y2);
      else ctx.lineTo(x, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** A full-width tagline bar with a halftone dot edge and tracked cream type. */
function drawTaglineBar(ctx, text, width, block) {
  const words = (text || '').trim().toUpperCase();
  const y = block.barY;
  const h = block.barH;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 6, 40, 0.92)';
  ctx.fillRect(0, y, width, h);
  ctx.fillStyle = 'rgba(255, 214, 106, 0.85)';
  const step = Math.max(10, Math.round(h * 0.55));
  for (let x = step / 2; x < width; x += step) {
    ctx.beginPath();
    ctx.arc(x, y + h * 0.22, step * 0.14, 0, Math.PI * 2);
    ctx.arc(x, y + h * 0.78, step * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  if (words) {
    const size = Math.max(12, Math.round(h * 0.52));
    ctx.font = `400 ${size}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.round(size * 0.35)}px`; } catch { /* older canvas */ }
    let fit = size;
    while (ctx.measureText(words).width > width * 0.86 && fit > 10) {
      fit -= 1;
      ctx.font = `400 ${fit}px Anton, 'Arial Narrow', sans-serif`;
    }
    ctx.fillStyle = PAPER;
    ctx.fillText(words, width / 2, y + h / 2 + fit * 0.05);
  }
  ctx.restore();
}

/** The starburst badge: a spiky roundel with the badge words inside it. */
function drawBadge(ctx, text, width, height, titlePos) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  const cx = width * 0.86;
  const cy = titlePos === 'top' ? height * 0.86 : height * 0.13;
  const outer = Math.min(width, height) * 0.085;
  const inner = outer * 0.78;
  const parts = words.split(/\s+/);
  const line1 = parts.length > 2 ? parts.slice(0, 1).join(' ') : parts[0];
  const line2 = parts.length > 2 ? parts.slice(1).join(' ') : parts.slice(1).join(' ');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  const g = ctx.createLinearGradient(-outer, -outer, outer, outer);
  g.addColorStop(0, '#ffd76a');
  g.addColorStop(0.55, '#ff9a3d');
  g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.strokeStyle = DARK;
  ctx.lineWidth = Math.max(3, outer * 0.05);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = outer * 0.25;
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = DARK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = Math.max(11, Math.round(outer * 0.24));
  ctx.font = `400 ${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.fillText(line1, 0, line2 ? -size * 0.55 : 0);
  if (line2) ctx.fillText(line2, 0, size * 0.55);
  ctx.restore();
}

/**
 * Paints the whole cover onto canvas. opts:
 *   width, height, layout ('poster' | 'triptych' | 'quad' | 'banner'),
 *   grade ('sunset' | 'warm' | 'posterize' | 'neon' | 'noir'),
 *   titlePos ('bottom' | 'top'), caption, subcaption (the script line),
 *   tagline (the bar), badge (starburst words; blank hides it),
 *   photos: [image|null] per panel, crops: [{ zoom, panX, panY }] per panel.
 */
export function drawCover(canvas, opts) {
  const { width, height } = opts;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  const layout = LAYOUTS.includes(opts.layout) ? opts.layout : 'poster';
  const grade = GRADES.includes(opts.grade) ? opts.grade : 'sunset';
  const { panels, sun } = panelShapes(width, height, layout);
  const gutter = Math.max(8, Math.round(width * 0.0075));
  const titleSize = Math.round(height * 0.185);
  const block = titleBlock(height, opts.titlePos, titleSize);

  ctx.fillStyle = '#160a28';
  ctx.fillRect(0, 0, width, height);

  panels.forEach((poly, i) => {
    drawPhoto(ctx, opts.photos?.[i] ?? null, opts.crops?.[i], poly);
    gradePanel(ctx, grade, poly);
  });

  // Cream gutters on every seam, then the frame around the poster.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = gutter;
  panels.forEach((poly) => {
    trace(ctx, poly);
    ctx.stroke();
  });
  ctx.strokeRect(gutter / 2, gutter / 2, width - gutter, height - gutter);

  drawSun(ctx, sun);

  // The edges fall away a little so the art sits forward.
  const vig = ctx.createRadialGradient(
    width / 2, height * 0.45, Math.min(width, height) * 0.42,
    width / 2, height * 0.5, Math.max(width, height) * 0.75,
  );
  vig.addColorStop(0, 'rgba(16, 4, 32, 0)');
  vig.addColorStop(1, 'rgba(16, 4, 32, 0.36)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // A scrim behind the word block so the lettering reads over any photo.
  const atTop = opts.titlePos === 'top';
  const scrim = atTop
    ? ctx.createLinearGradient(0, 0, 0, height * 0.55)
    : ctx.createLinearGradient(0, height * 0.55, 0, height);
  if (atTop) {
    scrim.addColorStop(0, 'rgba(24, 6, 40, 0.9)');
    scrim.addColorStop(1, 'rgba(24, 6, 40, 0)');
  } else {
    scrim.addColorStop(0, 'rgba(24, 6, 40, 0)');
    scrim.addColorStop(1, 'rgba(24, 6, 40, 0.9)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  drawTaglineBar(ctx, opts.tagline, width, block);
  drawStars(ctx, width, block.starsY, titleSize);
  drawScriptLine(ctx, opts.subcaption, width, block, titleSize);
  drawTitle(ctx, opts.caption, width, block, titleSize);
  drawBadge(ctx, opts.badge, width, height, opts.titlePos);
}
