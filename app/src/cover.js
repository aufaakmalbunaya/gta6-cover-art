// Draws the cover: a multi-panel GTA-style poster with a Vice City sunset or neon grade,
// a synthwave sun, bold condensed caption lettering, and a cream poster frame.
//
// drawCover(canvas, opts) paints the whole cover at opts.width x opts.height. opts.photos
// holds one image (or null) per panel and opts.crops one { zoom, panX, panY } per panel.
// Panels are polygons; each photo is cover-fit into its panel, then graded, then the
// gutters and frame are stroked over the seams. Nothing here reads the network.

export const COVER_SIZES = {
  square: { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
  landscape: { width: 1920, height: 1080, label: 'Landscape · 1920 × 1080' },
};

const CREAM = '#fff3d6';
const INK = '#1c0b2e';

/** A point as a fraction of the cover size, turned into pixels. */
function at(w, h, fx, fy) {
  return [w * fx, h * fy];
}

/**
 * The panel polygons and the sun spot for a cover of this size and layout.
 * Fractions keep the same poster shape at every export size.
 */
export function panelShapes(width, height, layout) {
  const ratio = width / height;
  const kind = ratio > 1.4 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square';
  if (layout === 'triptych') {
    if (kind === 'landscape') {
      return {
        panels: [
          [at(width, height, 0, 0), at(width, height, 0.344, 0), at(width, height, 0.312, 1), at(width, height, 0, 1)],
          [at(width, height, 0.355, 0), at(width, height, 0.677, 0), at(width, height, 0.646, 1), at(width, height, 0.323, 1)],
          [at(width, height, 0.688, 0), at(width, height, 1, 0), at(width, height, 1, 1), at(width, height, 0.657, 1)],
        ],
        sun: { x: width * 0.5, y: height * 0.16, r: height * 0.075 },
      };
    }
    if (kind === 'portrait') {
      return {
        panels: [
          [at(width, height, 0, 0), at(width, height, 1, 0), at(width, height, 1, 0.318), at(width, height, 0, 0.349)],
          [at(width, height, 0, 0.37), at(width, height, 1, 0.34), at(width, height, 1, 0.652), at(width, height, 0, 0.683)],
          [at(width, height, 0, 0.704), at(width, height, 1, 0.673), at(width, height, 1, 1), at(width, height, 0, 1)],
        ],
        sun: { x: width * 0.5, y: height * 0.335, r: height * 0.05 },
      };
    }
    return {
      panels: [
        [at(width, height, 0, 0), at(width, height, 1, 0), at(width, height, 1, 0.3), at(width, height, 0, 0.333)],
        [at(width, height, 0, 0.354), at(width, height, 1, 0.321), at(width, height, 1, 0.633), at(width, height, 0, 0.667)],
        [at(width, height, 0, 0.688), at(width, height, 1, 0.654), at(width, height, 1, 1), at(width, height, 0, 1)],
      ],
      sun: { x: width * 0.5, y: height * 0.333, r: height * 0.06 },
    };
  }

  // Poster: one hero panel and two smaller ones, split by a slanted gutter.
  if (kind === 'landscape') {
    return {
      panels: [
        [at(width, height, 0, 0), at(width, height, 0.604, 0), at(width, height, 0.573, 1), at(width, height, 0, 1)],
        [at(width, height, 0.615, 0), at(width, height, 1, 0), at(width, height, 1, 0.49), at(width, height, 0.599, 0.49)],
        [at(width, height, 0.599, 0.51), at(width, height, 1, 0.51), at(width, height, 1, 1), at(width, height, 0.583, 1)],
      ],
      sun: { x: width * 0.591, y: height * 0.5, r: height * 0.088 },
    };
  }
  if (kind === 'portrait') {
    return {
      panels: [
        [at(width, height, 0, 0), at(width, height, 1, 0), at(width, height, 1, 0.519), at(width, height, 0, 0.563)],
        [at(width, height, 0, 0.578), at(width, height, 0.505, 0.545), at(width, height, 0.481, 1), at(width, height, 0, 1)],
        [at(width, height, 0.526, 0.545), at(width, height, 1, 0.53), at(width, height, 1, 1), at(width, height, 0.502, 1)],
      ],
      sun: { x: width * 0.505, y: height * 0.545, r: height * 0.06 },
    };
  }
  return {
    panels: [
      [at(width, height, 0, 0), at(width, height, 1, 0), at(width, height, 1, 0.546), at(width, height, 0, 0.602)],
      [at(width, height, 0, 0.622), at(width, height, 0.505, 0.582), at(width, height, 0.481, 1), at(width, height, 0, 1)],
      [at(width, height, 0.526, 0.582), at(width, height, 1, 0.562), at(width, height, 1, 1), at(width, height, 0.502, 1)],
    ],
    sun: { x: width * 0.505, y: height * 0.585, r: height * 0.07 },
  };
}

/** Traces a polygon path on ctx. */
function tracePath(ctx, polygon) {
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i][0], polygon[i][1]);
  ctx.closePath();
}

/** The axis-aligned box around a polygon, for cover-fitting a photo into it. */
function panelBox(polygon) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

/** Paints one photo into one panel, cover-fit with the panel's zoom and pan. */
function paintPhoto(ctx, photo, crop, polygon) {
  const box = panelBox(polygon);
  ctx.save();
  tracePath(ctx, polygon);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, '#3b1a5e');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = 'rgba(255, 243, 214, 0.55)';
    ctx.font = `400 ${Math.round(box.h * 0.055)}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', box.x + box.w / 2, box.y + box.h / 2);
    ctx.restore();
    return;
  }
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const base = Math.max(box.w / iw, box.h / ih);
  const scale = base * (crop?.zoom ?? 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const ex = dw - box.w;
  const ey = dh - box.h;
  const dx = box.x - ex / 2 + (crop?.panX ?? 0) * (ex / 2);
  const dy = box.y - ey / 2 + (crop?.panY ?? 0) * (ey / 2);
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** Washes one panel with the chosen colour grade, clipped to the panel. */
function paintGrade(ctx, grade, polygon) {
  const box = panelBox(polygon);
  ctx.save();
  tracePath(ctx, polygon);
  ctx.clip();
  if (grade === 'neon') {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    g.addColorStop(1, 'rgba(255, 0, 140, 0.30)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 0, 160, 0.30)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(12, 10, 32, 0.28)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'overlay';
    const g = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else {
    // Sunset: a warm wash and a pink-orange fall from the top of the panel.
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 120, 40, 0.35)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    g.addColorStop(0, 'rgba(255, 190, 80, 0.10)');
    g.addColorStop(0.55, 'rgba(255, 110, 90, 0.12)');
    g.addColorStop(1, 'rgba(255, 60, 140, 0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  // A soft inner shadow so the panels read as separate plates.
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = Math.max(24, box.w * 0.05);
  ctx.strokeStyle = 'rgba(10, 2, 24, 0.20)';
  tracePath(ctx, polygon);
  ctx.stroke();
  ctx.restore();
}

/** A retro sun with slatted lower half, drawn on its own canvas so the cuts stay clean. */
function paintSun(ctx, sun) {
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

/** Fits the caption to the cover width and paints it with a gradient fill and dark rim. */
function paintTitle(ctx, text, width, height, titlePos) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  const atTop = titlePos === 'top';
  const base = atTop ? height * 0.115 : height * 0.90;
  let size = Math.round(height * 0.115);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `400 ${s}px Anton, 'Arial Narrow', sans-serif`; };
  setFont(size);
  while (ctx.measureText(words).width > width * 0.9 && size > 18) {
    size -= 2;
    setFont(size);
  }
  const cx = width / 2;
  const cy = base;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.02);
  ctx.translate(-cx, -cy);
  const fill = ctx.createLinearGradient(0, cy - size, 0, cy + size * 0.12);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.6, '#ffe9b8');
  fill.addColorStop(1, '#ffb347');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, size * 0.085);
  ctx.shadowColor = 'rgba(255, 45, 149, 0.55)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.035;
  ctx.strokeText(words, cx, cy);
  ctx.fillStyle = fill;
  ctx.fillText(words, cx, cy);
  ctx.restore();
}

/** The small tag line above the caption, with a rule on each side. */
function paintTag(ctx, text, width, height, titlePos, titleSize) {
  const words = (text || '').trim().toUpperCase();
  if (!words) return;
  const atTop = titlePos === 'top';
  const size = Math.max(14, Math.round(titleSize * 0.2));
  ctx.save();
  ctx.font = `400 ${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(size * 0.45)}px`; } catch { /* older canvas: no tracking */ }
  const tw = ctx.measureText(words).width;
  const cy = atTop ? height * 0.115 + titleSize * 1.28 : height * 0.90 - titleSize * 1.18;
  const gap = size * 1.1;
  const ruleLen = Math.min(width * 0.12, size * 4);
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(width / 2 - tw / 2 - gap - ruleLen, cy - size * 0.35);
  ctx.lineTo(width / 2 - tw / 2 - gap, cy - size * 0.35);
  ctx.moveTo(width / 2 + tw / 2 + gap, cy - size * 0.35);
  ctx.lineTo(width / 2 + tw / 2 + gap + ruleLen, cy - size * 0.35);
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.3;
  ctx.fillText(words, width / 2, cy);
  ctx.restore();
}

/**
 * Paints the whole cover onto canvas. opts:
 *   width, height, layout ('poster' | 'triptych'), grade ('sunset' | 'neon' | 'noir'),
 *   titlePos ('bottom' | 'top'), caption, subcaption,
 *   photos: [image|null] per panel, crops: [{ zoom, panX, panY }] per panel.
 */
export function drawCover(canvas, opts) {
  const { width, height } = opts;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  const { panels, sun } = panelShapes(width, height, opts.layout || 'poster');
  const gutter = Math.max(8, Math.round(width * 0.0075));

  ctx.fillStyle = '#160a28';
  ctx.fillRect(0, 0, width, height);

  panels.forEach((polygon, i) => {
    paintPhoto(ctx, opts.photos?.[i] ?? null, opts.crops?.[i], polygon);
    paintGrade(ctx, opts.grade || 'sunset', polygon);
  });

  // Cream gutters along every panel seam, then the poster frame.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = gutter;
  panels.forEach((polygon) => {
    tracePath(ctx, polygon);
    ctx.stroke();
  });
  ctx.lineWidth = gutter;
  ctx.strokeRect(gutter / 2, gutter / 2, width - gutter, height - gutter);

  paintSun(ctx, sun);

  // A dark vignette so the edges fall away from the art.
  const vig = ctx.createRadialGradient(
    width / 2, height * 0.45, Math.min(width, height) * 0.42,
    width / 2, height * 0.5, Math.max(width, height) * 0.75,
  );
  vig.addColorStop(0, 'rgba(16, 4, 32, 0)');
  vig.addColorStop(1, 'rgba(16, 4, 32, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // A scrim behind the words so the caption stays readable over any photo.
  const atTop = opts.titlePos === 'top';
  const scrim = atTop
    ? ctx.createLinearGradient(0, 0, 0, height * 0.36)
    : ctx.createLinearGradient(0, height * 0.64, 0, height);
  if (atTop) {
    scrim.addColorStop(0, 'rgba(24, 6, 40, 0.88)');
    scrim.addColorStop(1, 'rgba(24, 6, 40, 0)');
  } else {
    scrim.addColorStop(0, 'rgba(24, 6, 40, 0)');
    scrim.addColorStop(1, 'rgba(24, 6, 40, 0.88)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  const titleSize = Math.round(height * 0.115);
  paintTag(ctx, opts.subcaption, width, height, opts.titlePos, titleSize);
  paintTitle(ctx, opts.caption, width, height, opts.titlePos);
}
