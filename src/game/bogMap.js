// (5.0e) The map of the bog, in four pieces (chapters 4–5 of «Топь», docs/LEVEL2.md).
//
// Somebody drew the way through: the village, the mouth of the bog with its gate and generator, the causeway over
// the water, the cliff, the lake and the pier. It was torn in four. In a room each of you comes to with one piece
// (the piece of your seat); the pieces nobody has lie on tables in the houses the keeper walks past. A piece is a
// quarter of the drawing: with some missing you see only those quarters, the rest is a dark torn hole. All four in
// one pair of hands — the map is whole, and the chapter of the village is over.
//
// The overlay is the same paper as the navigator's map in chapter 2 (#l2map, held open on TAB).
import { RNG } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { GATE, GENERATOR, CAUSEWAY, CLIFF, LAKE, PIER, bogMask } from '../world/swamp.js';

const PI = Math.PI;
export const PIECES = 4;
export const BOG_VIEW = { x0: -330, x1: 345, z0: -355, z1: -20 };
export const MID = { x: (BOG_VIEW.x0 + BOG_VIEW.x1) / 2, z: (BOG_VIEW.z0 + BOG_VIEW.z1) / 2 };

// which piece a place on the map is drawn on: 0 north-west, 1 north-east, 2 south-west, 3 south-east (north is −z)
export function quarterOf(x, z) {
  return (x >= MID.x ? 1 : 0) + (z >= MID.z ? 2 : 0);
}

// where the pieces are when the village begins. holders: the players' ids by seat (a room's slots), each with
// the piece of its seat; the rest go to the tables of the houses in `near` (the keeper's round first), never a
// house with someone tied in it. Returns [{ k, holder, hi }] (hi: the house index whose table it is on)
export function piecePlan(seats, near, occupied) {
  const out = [];
  const taken = new Set();
  for (const { id, slot } of seats) {
    const k = slot % PIECES;
    if (taken.has(k)) continue;
    taken.add(k);
    out.push({ k, holder: id, hi: null });
  }
  const free = near.filter((hi) => !occupied.includes(hi));
  let n = 0;
  for (let k = 0; k < PIECES; k++) {
    if (taken.has(k)) continue;
    out.push({ k, holder: null, hi: free.length ? free[n++ % free.length] : null });
  }
  return out.sort((a, b) => a.k - b.k);
}

// the table a piece lies on, in a house (the world's own house record: x, z, ry, W, D, y)
export function tableSpot(H) {
  const lx = H.W / 4, lz = -H.D / 4, c = Math.cos(H.ry), s = Math.sin(H.ry);
  return { x: H.x + lx * c + lz * s, y: H.y + 0.97, z: H.z - lx * s + lz * c };
}

// ---------------------------------------------------------------- the drawing
// ctx: a 2D context on an S×S canvas. have: [bool × 4] — the pieces in these hands. me: { x, z, yaw } or null.
// houses: the village's houses ({ x, z, ry, W, D })
export function drawBogMap(ctx, S, have, me = null, houses = []) {
  const V = BOG_VIEW;
  const sc = Math.min((S - 90) / (V.x1 - V.x0), (S - 170) / (V.z1 - V.z0));
  const cx = S / 2, cy = S / 2 + 20;
  const X = (x) => cx + (x - MID.x) * sc, Y = (z) => cy + (z - MID.z) * sc;
  const INK = '#2e261d', PATH = '#7a5532', RED = '#a3170f', WET = 'rgba(70,96,110,0.42)';
  const font = (w, px) => `${w} ${px}px "JetBrains Mono", monospace`;
  ctx.save();
  ctx.fillStyle = '#d8ccae';
  ctx.fillRect(0, 0, S, S);
  const r = new RNG(4127);
  for (let i = 0; i < 8; i++) {
    const sx = r.float(0, S), sy = r.float(0, S);
    const g = ctx.createRadialGradient ? ctx.createRadialGradient(sx, sy, 0, sx, sy, r.float(60, 220)) : null;
    if (!g) break;
    g.addColorStop(0, 'rgba(120,90,50,0.10)');
    g.addColorStop(1, 'rgba(120,90,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  // the bog: stippled wet where the mask says so
  ctx.fillStyle = WET;
  for (let i = 0; i < 1400; i++) {
    const x = r.float(V.x0, V.x1), z = r.float(V.z0, V.z1);
    if (bogMask(x, z) > 0.35) ctx.fillRect(X(x), Y(z), 3, 2);
  }
  // the lake
  ctx.fillStyle = 'rgba(70,96,110,0.55)';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(X(LAKE.x), Y(LAKE.z), LAKE.r * sc, 0, PI * 2);
  ctx.fill();
  ctx.stroke();
  // the houses of the village
  ctx.fillStyle = INK;
  for (const H of houses) {
    const c = Math.cos(H.ry), s = Math.sin(H.ry), w = H.W * 0.9, d = H.D * 0.9; // (drawn twice their size: a map's houses are signs)
    ctx.beginPath();
    [[-w, -d], [w, -d], [w, d], [-w, d]].forEach(([lx, lz], i) => {
      const x = H.x + lx * c + lz * s, z = H.z - lx * s + lz * c;
      if (i) ctx.lineTo(X(x), Y(z)); else ctx.moveTo(X(x), Y(z));
    });
    ctx.fill();
  }
  // the way: out of the village to the gate (dotted), then the causeway over the water (the heavy dashes)
  ctx.lineCap = 'round';
  ctx.strokeStyle = PATH;
  ctx.lineWidth = 4;
  ctx.setLineDash?.([3, 9]);
  ctx.beginPath();
  ctx.moveTo(X(-70), Y(-168));
  ctx.lineTo(X(GATE.x - 4), Y(GATE.z));
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.setLineDash?.([14, 8]);
  ctx.beginPath();
  CAUSEWAY.pts.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z))));
  ctx.lineTo(X(CLIFF.x), Y(CLIFF.z));
  ctx.stroke();
  ctx.setLineDash?.([]);
  // the gate across the way, the generator beside it
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(X(GATE.x), Y(GATE.z - 9));
  ctx.lineTo(X(GATE.x), Y(GATE.z + 9));
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(X(GENERATOR.x) - 7, Y(GENERATOR.z) - 5, 14, 10);
  // the cliff: teeth along its edge
  ctx.lineWidth = 3;
  for (let k = -3; k <= 3; k++) {
    const a = 0.9 + k * 0.18, x = CLIFF.x + Math.cos(a) * 10, z = CLIFF.z + Math.sin(a) * 10;
    ctx.beginPath();
    ctx.moveTo(X(x), Y(z));
    ctx.lineTo(X(x + Math.cos(a) * 6), Y(z + Math.sin(a) * 6));
    ctx.stroke();
  }
  // the pier
  const ux = -Math.sin(PIER.yaw), uz = -Math.cos(PIER.yaw);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(X(PIER.x), Y(PIER.z));
  ctx.lineTo(X(PIER.x + ux * PIER.len), Y(PIER.z + uz * PIER.len));
  ctx.stroke();
  // the words
  ctx.fillStyle = INK;
  ctx.font = font(700, 22);
  ctx.textAlign = 'center';
  ctx.fillText(t('bogMapVillage'), X(-150), Y(-200));
  ctx.font = font(600, 18);
  // (each word on its own side of its thing: the mouth of the bog is crowded)
  ctx.fillText(t('bogMapGate'), X(GATE.x), Y(GATE.z + 9) + 22);
  ctx.textAlign = 'right';
  ctx.fillText(t('bogMapGenerator'), X(GENERATOR.x) - 12, Y(GENERATOR.z) - 8);
  ctx.textAlign = 'center';
  ctx.fillText(t('bogMapCauseway'), X(140), Y(-170) + 24);
  ctx.textAlign = 'left';
  ctx.fillText(t('bogMapCliff'), X(CLIFF.x) + 14, Y(CLIFF.z) + 24);
  ctx.textAlign = 'center';
  ctx.fillText(t('bogMapLake'), X(LAKE.x), Y(LAKE.z + 5));
  ctx.fillText(t('bogMapPier'), X(PIER.x + 34), Y(PIER.z + 6));
  // you
  if (me && have[quarterOf(me.x, me.z)]) {
    const fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw), x = X(me.x), y = Y(me.z), lx = fz, lz = -fx;
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(x + fx * 18, y + fz * 18);
    ctx.lineTo(x - fx * 10 + lx * 10, y - fz * 10 + lz * 10);
    ctx.lineTo(x - fx * 10 - lx * 10, y - fz * 10 - lz * 10);
    ctx.fill();
    ctx.font = font(700, 17);
    ctx.fillText(t('l2MapYou'), x, y - 20);
  }
  // the pieces nobody has given you: a hole, torn
  const ym = Y(MID.z); // (the world's middle is the paper's: the tears run through it)
  for (let k = 0; k < PIECES; k++) {
    if (have[k]) continue;
    const tr = new RNG(900 + k), left = k % 2 === 0, top = k < 2;
    const x0 = left ? 0 : cx, x1 = left ? cx : S, y0 = top ? 0 : ym, y1 = top ? ym : S;
    const ix = left ? x1 : x0, iy = top ? y1 : y0; // the torn edges: the ones inside the paper
    ctx.fillStyle = '#0d0c0a';
    ctx.beginPath();
    // along the torn horizontal edge, then down (or up) the torn vertical one, then round the outside
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += 18) pts.push([x, iy + tr.float(-7, 7)]);
    const vert = [];
    for (let y = y0; y <= y1 + 0.1; y += 18) vert.push([ix + tr.float(-7, 7), y]);
    ctx.moveTo(left ? x0 : x1, top ? y0 : y1);
    ctx.lineTo(left ? x1 : x0, top ? y0 : y1);
    for (const [x, y] of (top ? vert : vert.reverse())) ctx.lineTo(x, y);
    for (const [x, y] of (left ? [...pts].reverse() : pts)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(214,205,192,0.25)';
    ctx.font = font(700, 54);
    ctx.textAlign = 'center';
    ctx.fillText('?', (x0 + x1) / 2, (y0 + y1) / 2 + 18);
  }
  // the frame, the title, the north, the count
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, S - 44, S - 44);
  const n = have.filter(Boolean).length;
  ctx.fillStyle = have[0] ? INK : '#d8ccae';
  ctx.textAlign = 'left';
  ctx.font = font(700, 32);
  ctx.fillText(t('bogMapTitle'), 46, 70);
  ctx.textAlign = 'right';
  ctx.font = font(600, 19);
  ctx.fillStyle = n === PIECES ? INK : RED;
  ctx.fillText(t('bogMapPieces').replace('{n}', n).replace('{m}', PIECES), S - 40, S - 40);
  ctx.restore();
}

// the overlay: one element for the whole level (#l2map), the paper held up while TAB is down
export class MapOverlay {
  constructor() {
    this.wrap = null;
    this.canvas = null;
    this.k = 0;
    if (typeof document === 'undefined') return;
    let el = document.getElementById?.('l2map');
    if (!el || !el.querySelector) {
      el = document.createElement('div');
      el.id = 'l2map';
      el.appendChild(document.createElement('canvas'));
      document.body?.appendChild?.(el);
    }
    this.wrap = el;
    this.canvas = el.querySelector?.('canvas') || null;
    if (this.canvas) { this.canvas.width = 900; this.canvas.height = 900; }
  }

  // open: held this frame; draw(ctx, S) paints it
  show(open, draw) {
    this.wrap?.classList?.toggle('open', !!open);
    this.open = !!open;
    if (!open || !this.canvas) return;
    const ctx = this.canvas.getContext?.('2d');
    if (ctx) draw(ctx, 900);
  }

  hide() { this.show(false); }
}
