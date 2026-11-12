// Geometry that keeps the thought balloon and its dots off the pet's face.
// Pure functions in pixels, so they can be unit-tested.

export type Box = { x: number; y: number; w: number; h: number };
export type Spot = { x: number; y: number };
export type Dot = { cx: number; cy: number; size: number };

/** Gap between the bubble and the first dot, and between dots (scale 1). */
const GAP = 4;
/** Dots stop at least this far from the head. */
const HEAD_MARGIN = 8;
/** Below this shrink factor the dots would be specks: draw none. */
const MIN_SHRINK = 0.5;

/** Overlap area of two boxes (0 when apart). */
export function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Picks the candidate bubble position that covers the least of the head
 * (and then of the scene's main prop), and among equals the one farthest
 * from the head. Candidates are in order of preference.
 */
export function bestSpot(candidates: Box[], head: Box, prop?: Box, body?: Box): number {
  const hc = centre(head);
  let best = 0;
  let bestScore = Infinity;
  candidates.forEach((c, i) => {
    const cc = centre(c);
    const distance = Math.hypot(cc.x - hc.x, cc.y - hc.y);
    // Covering the face always loses, then the body, then the prop; distance only breaks ties.
    const score =
      overlap(c, head) * 1000 +
      (body ? overlap(c, body) * 400 : 0) +
      (prop ? overlap(c, prop) * 300 : 0) -
      distance;
    if (score < bestScore - 0.5) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/**
 * The trail of dots from the bubble towards the head, biggest first.
 * The dots never reach the head: they shrink to fit the free space, and
 * disappear when there is no room (e.g. the bubble was dragged onto the face).
 */
export function trailDots(bubble: Box, head: Box, sizes: number[], scale: number): Dot[] {
  const from = centre(bubble);
  const to = centre(head);
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  if (len < 1) return [];
  const d = { x: (to.x - from.x) / len, y: (to.y - from.y) / len };

  const start = exitPill(bubble, from, d, len);
  const margin = HEAD_MARGIN * scale;
  const end = enterBox({ x: head.x - margin, y: head.y - margin, w: head.w + 2 * margin, h: head.h + 2 * margin }, from, d);
  if (end === null || end <= start) return [];

  const gap = GAP * scale;
  const scaled = sizes.map((s) => s * scale);
  const needed = gap + scaled.reduce((a, b) => a + b + gap, 0);
  const shrink = Math.min(1, (end - start) / needed);
  if (shrink < MIN_SHRINK) return [];

  const dots: Dot[] = [];
  let t = start + gap * shrink;
  for (const s of scaled) {
    const size = s * shrink;
    const mid = t + size / 2;
    dots.push({ cx: from.x + d.x * mid, cy: from.y + d.y * mid, size });
    t += size + gap * shrink;
  }
  return dots;
}

function centre(b: Box) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** Distance along the ray where it leaves the pill-shaped bubble (rounded ends). */
function exitPill(b: Box, o: Spot, d: Spot, max: number): number {
  let lo = 0;
  let hi = max;
  if (insidePill(b, o.x + d.x * hi, o.y + d.y * hi)) return hi;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (insidePill(b, o.x + d.x * mid, o.y + d.y * mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

function insidePill(b: Box, x: number, y: number): boolean {
  const r = Math.min(b.w, b.h) / 2;
  const cx = Math.min(Math.max(x, b.x + r), b.x + b.w - r);
  const cy = Math.min(Math.max(y, b.y + r), b.y + b.h - r);
  return Math.hypot(x - cx, y - cy) <= r;
}

/** Distance along the ray where it enters the box (0 if it starts inside). */
function enterBox(b: Box, o: Spot, d: Spot): number | null {
  let tMin = 0;
  let tMax = Infinity;
  for (const [p, v, lo, hi] of [
    [o.x, d.x, b.x, b.x + b.w],
    [o.y, d.y, b.y, b.y + b.h],
  ]) {
    if (Math.abs(v) < 1e-9) {
      if (p < lo || p > hi) return null;
      continue;
    }
    let t1 = (lo - p) / v;
    let t2 = (hi - p) / v;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  }
  return tMin <= tMax ? tMin : null;
}
