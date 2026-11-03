// Scroll → scene, as pure math (no DOM, no WebGL: tests/site.test.mjs runs it in node).
//
// The page is one walk through the forest: the hero stands at the far end of the old footpath, the echo section
// walks you down it, the shift lifts you over the treetops while the nights and mornings go by, and the co-op
// section sets you down by the camp fire. Each section owns a stretch [u0, u1] of the camera's track; inside a
// section, how far you have scrolled through it moves you along its stretch.
import { CFG } from '../src/core/config.js';

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, v) => {
  const k = clamp01((v - a) / (b - a));
  return k * k * (3 - 2 * k);
};

// how far a block has travelled through the viewport: 0 as its top meets the bottom edge, 1 as its bottom leaves the top
export function blockProgress(top, height, scrollY, vh) {
  return clamp01((scrollY + vh - top) / Math.max(1, height + vh));
}
// how far through a tall block whose inside sticks to the screen: 0 when its top reaches the top, 1 when its bottom
// reaches the bottom
export function pinProgress(top, height, scrollY, vh) {
  return clamp01((scrollY - top) / Math.max(1, height - vh));
}

// the camera's stretch per section, and the keyframes of the walk (positions are on the forest's own map, see forest.js)
export const STRETCH = { top: [0, 0.16], echo: [0.16, 0.36], shift: [0.36, 0.84], coop: [0.84, 1] };
export const KEYS = [
  { u: 0.0, pos: [6.2, 1.7, 99], look: [2.5, 1.5, 70] },
  { u: 0.16, pos: [4.6, 1.75, 88], look: [0.5, 1.6, 62] },
  { u: 0.36, pos: [0.4, 1.8, 70], look: [-1.5, 1.4, 44] },
  { u: 0.46, pos: [-2, 7.5, 70], look: [0, 0.5, 36] },
  { u: 0.6, pos: [-9, 15, 62], look: [1, 0, 22] },
  { u: 0.74, pos: [6, 16, 48], look: [0, 0, 6] },
  { u: 0.84, pos: [9, 9, 22], look: [0, 0.5, 0] },
  { u: 0.93, pos: [4.2, 2.5, 8.5], look: [0, 0.9, 0] },
  { u: 1.0, pos: [-3.4, 2.1, 6.6], look: [0.4, 0.95, -0.6] },
];

// the track position for a scroll offset: sections = [{ id, top, height }] in page order
export function trackU(sections, scrollY, vh) {
  let u = 0;
  for (const s of sections) {
    const st = STRETCH[s.id];
    if (!st) continue;
    if (scrollY < s.top) break;
    const run = s.id === 'shift' ? Math.max(1, s.height - vh) : Math.max(1, s.height);
    u = lerp(st[0], st[1], clamp01((scrollY - s.top) / run));
  }
  return u;
}

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// { pos, look } at track position u (a Catmull–Rom spline through the keyframes)
export function trackAt(u, keys = KEYS) {
  u = clamp01(u);
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(keys.length - 1, i + 2)];
  const t = clamp01((u - b.u) / Math.max(1e-6, c.u - b.u));
  const out = { pos: [0, 0, 0], look: [0, 0, 0] };
  for (let k = 0; k < 3; k++) {
    out.pos[k] = catmull(a.pos[k], b.pos[k], c.pos[k], d.pos[k], t);
    out.look[k] = catmull(a.look[k], b.look[k], c.look[k], d.look[k], t);
  }
  return out;
}

// ---------------- the shift, squeezed into one scroll ----------------
// The real thing is 4 × 8 min of night, 3 × 1:45 of morning and a 5-minute last dawn. On the page every segment
// gets a readable share of the scroll instead (a morning is 4% of the shift, which would flash by), but the clock
// it shows runs at the real durations.
const S = CFG.SHIFT;
export const SHIFT_SEGMENTS = (() => {
  const seg = [];
  for (let n = 1; n <= S.DAYS; n++) {
    seg.push({ kind: 'night', n, dur: S.NIGHT, w: 0.17 });
    if (n < S.DAYS) seg.push({ kind: 'morning', n, dur: S.MORNING, w: 0.08 });
  }
  seg.push({ kind: 'finale', n: S.DAYS, dur: S.FINALE, w: 0.08 });
  const W = seg.reduce((a, s) => a + s.w, 0);
  let at = 0;
  for (const s of seg) {
    s.w /= W;
    s.a = at;
    at += s.w;
    s.b = at;
  }
  return seg;
})();

// p (0..1 through the shift section) → which segment, how far into it, and its clock in real seconds
export function shiftAt(p) {
  p = clamp01(p);
  const seg = SHIFT_SEGMENTS.find((s) => p <= s.b) || SHIFT_SEGMENTS[SHIFT_SEGMENTS.length - 1];
  const k = clamp01((p - seg.a) / seg.w);
  return { seg, k, clock: k * seg.dur, woke: seg.kind === 'night' && seg.n === S.DAYS && k * seg.dur >= S.LAST_WAKE };
}

// the light for p: { dawn, morning, fog, fear, sun:[x,y,z], hit } — a morning rises over its first quarter and dies
// over its last fifth the way the game's dusk does (a bulb stuttering out: game.js updateDusk); `hit` marks the
// instant it goes black. The last dawn is the orange one (uMorning 0) and stays.
export function lightAt(p) {
  const { seg, k, woke } = shiftAt(p);
  const L = { dawn: 0, morning: 0, fog: 0, fear: 0, sun: [0.5, 0.35, -0.8], hit: 0 };
  if (seg.kind === 'morning') {
    const rise = smooth(0, 0.22, k);
    const fall = smooth(0.78, 0.97, k);
    let light = 0.95 * rise * (1 - fall);
    // the dying bulb: the same stutter as the game's dusk, over the scroll instead of 1.8 s
    const v = (k - 0.78) / 0.19 * 1.8;
    if (v > 0.45 && v < 1.75 && Math.sin(v * 61) * Math.sin(v * 23) > 0.2) light *= 0.2;
    L.dawn = light;
    L.morning = smooth(0.06, 0.3, k);
    L.fog = 0.55 * (1 - smooth(0.1, 0.5, k));
    const sunUp = 0.25 + 0.4 * Math.sin(Math.PI * clamp01(k));
    L.sun = [0.42, sunUp, -0.66];
    L.hit = k > 0.965 && k < 0.995 ? 1 : 0;
  } else if (seg.kind === 'finale') {
    L.dawn = 0.95 * smooth(0, 0.45, k);
    L.morning = 0;
    L.sun = [0.5, 0.12 + 0.22 * k, -0.8];
  } else if (woke) {
    L.fear = 0.55 * smooth(0, 0.25, (k * seg.dur - S.LAST_WAKE) / (seg.dur - S.LAST_WAKE));
  }
  const n = Math.hypot(...L.sun);
  L.sun = L.sun.map((v) => v / n);
  return L;
}

// the generators come on one by one through the nights: one a night, and the last two on the fourth — the second of
// them after the forest has woken (index → the p at which its lamp lights)
export const GEN_PLAN = [[1, 0.55], [2, 0.55], [3, 0.55], [4, 0.3], [4, 0.72]];
export function gensLitAt(p) {
  const nights = SHIFT_SEGMENTS.filter((s) => s.kind === 'night');
  const marks = GEN_PLAN.map(([n, k]) => {
    const s = nights[Math.min(nights.length, n) - 1];
    return s.a + s.w * k;
  });
  return { marks, lit: marks.map((m) => p >= m) };
}

// m:ss
export function clockText(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
