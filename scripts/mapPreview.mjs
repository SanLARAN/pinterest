// Map previews for the solo panel (3.0h): two plates, drawn from the real ground.
//
// The menu asks which участок, and a word is not a map. These are rendered from the same terrain, water,
// planks and landmarks the shift is played on, so what the card shows is what you get: a surveyor's plate of
// the forestry (mostly land, the lake, the yard) and one of the peat bog (nearly half water, the plank roads,
// the pumps, the car on the causeway).
//
// Run after changing either map:  node scripts/mapPreview.mjs
// Writes public/maps/forest.png and public/maps/bog.png (a few hundred kB, no dependencies).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import * as THREE from 'three';

// ---------------------------------------------------------------- a tiny raster, a tiny PNG writer
const W = 440, H = 560;

class Plate {
  constructor(w, h, [r, g, b]) {
    this.w = w; this.h = h;
    this.px = new Uint8Array(w * h * 3);
    for (let i = 0; i < w * h; i++) { this.px[i * 3] = r; this.px[i * 3 + 1] = g; this.px[i * 3 + 2] = b; }
  }
  set(x, y, c, a = 1) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    for (let k = 0; k < 3; k++) this.px[i + k] = this.px[i + k] * (1 - a) + c[k] * a;
  }
  line(x0, y0, x1, y1, c, a = 1, wide = 1) {
    const dx = x1 - x0, dy = y1 - y0;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (dx * i) / n, y = y0 + (dy * i) / n;
      for (let oy = 0; oy < wide; oy++) for (let ox = 0; ox < wide; ox++) {
        this.set(x + ox - (wide - 1) / 2, y + oy - (wide - 1) / 2, c, a);
      }
    }
  }
  dashed(x0, y0, x1, y1, c, a, dash = 5, gap = 4, wide = 2) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / (len || 1), uy = (y1 - y0) / (len || 1);
    for (let d = 0; d < len; d += dash + gap) {
      const e = Math.min(len, d + dash);
      this.line(x0 + ux * d, y0 + uy * d, x0 + ux * e, y0 + uy * e, c, a, wide);
    }
  }
  disc(x, y, r, c, a = 1) {
    for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
      if (ox * ox + oy * oy <= r * r + 0.4) this.set(x + ox, y + oy, c, a);
    }
  }
  ring(x, y, r, c, a = 1, wide = 2) {
    for (let i = 0; i < 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      for (let o = 0; o < wide; o++) this.set(x + Math.cos(t) * (r + o), y + Math.sin(t) * (r + o), c, a);
    }
  }
  box(x, y, s, c, a = 1) {
    for (let oy = -s; oy <= s; oy++) for (let ox = -s; ox <= s; ox++) this.set(x + ox, y + oy, c, a);
  }
  cross(x, y, s, c, a = 1, wide = 2) {
    this.line(x - s, y - s, x + s, y + s, c, a, wide);
    this.line(x + s, y - s, x - s, y + s, c, a, wide);
  }
  png() { return encodePng(this.w, this.h, this.px); }
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter: none
    Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- the ground, without a browser
const el = () => new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : (typeof k === 'string' && k.startsWith('to') ? () => 0 : () => {})),
  set: (t, k, v) => ((t[k] = v), true),
});
globalThis.document = globalThis.document || {
  documentElement: el(), body: el(), getElementById: () => null, querySelector: () => null,
  querySelectorAll: () => [], createElement: () => ({ getContext: () => null, style: {} }), addEventListener() {},
};
globalThis.window = globalThis.window || { addEventListener() {}, location: { search: '' } };

const { World } = await import('../src/world/world.js');

const PAPER = [186, 176, 137];
const INK = [46, 52, 42];
const WATER = [86, 112, 114];
const DEEP = [58, 84, 90];
const PLANK = [112, 92, 62];
const MARK = [142, 48, 36];

function render(mapId) {
  const world = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), mapId).generate();
  const half = world.half;
  const plate = new Plate(W, H, PAPER);
  const pad = 26;
  const span = W - pad * 2, vspan = H - pad * 2; // the frame: everything is drawn inside it
  const toX = (x) => W / 2 + (x / (half * 2)) * span;
  const toY = (z) => H / 2 + (z / (half * 2)) * vspan;
  const wx_of = (x) => ((x - W / 2) / span) * half * 2;
  const wz_of = (y) => ((y - H / 2) / vspan) * half * 2;

  // ---- elevation, sampled once: hillshade + contour lines (the same for both участка)
  const heights = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const z = wz_of(y);
    for (let x = 0; x < W; x++) {
      const wx = wx_of(x);
      const inside = x > pad && x < W - pad && y > pad && y < H - pad && Math.abs(wx) < half && Math.abs(z) < half;
      heights[y * W + x] = inside ? world.terrain.height(wx, z) : NaN;
    }
  }
  let lo = Infinity, hi = -Infinity;
  for (const h of heights) { if (Number.isFinite(h)) { if (h < lo) lo = h; if (h > hi) hi = h; } }
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const h = heights[y * W + x];
      if (!Number.isFinite(h)) continue; // past the edge of the участок: the plate stays blank
      const hx = heights[y * W + x + 1] - heights[y * W + x - 1];
      const hz = heights[(y + 1) * W + x] - heights[(y - 1) * W + x];
      // light from the north-west, the way a paper map is shaded
      const shade = Math.max(-1, Math.min(1, (hx * 0.7 + hz * 0.7) * 1.6));
      const k = (h - lo) / (hi - lo || 1);
      if (shade > 0) plate.set(x, y, [70, 76, 58], shade * 0.035);
      else plate.set(x, y, [255, 250, 226], -shade * 0.03);
      // a contour every 0.5 m, a dark one every 2.5 m
      const nxt = heights[y * W + x + 1];
      if (Number.isFinite(nxt)) {
        const c = h / 4.0, cw = nxt / 4.0;
        if (Math.floor(c) !== Math.floor(cw)) plate.set(x, y, INK, Math.abs(c % 5) < 1 ? 0.26 : 0.09);
      }
      if (k > 0.995) plate.set(x, y, INK, 0.05);
    }
  }

  // ---- water
  if (world.water) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const wx = wx_of(x);
        const wz = wz_of(y);
        const d = world.water.depth(wx, wz);
        if (d <= 0.02) continue;
        plate.set(x, y, d > 0.8 ? DEEP : WATER, d > 0.8 ? 0.9 : 0.72);
        if (d > 0.02 && d < 0.12) plate.set(x, y, INK, 0.22); // the shoreline, inked
      }
    }
  }
  if (world.lake) {
    const L = world.lake;
    const cx = toX(L.x), cy = toY(L.z);
    const rx = (L.r / (half * 2)) * span, ry = (L.r / (half * 2)) * (H - pad * 2);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) plate.set(cx + x, cy + y, WATER, 0.78);
    }
    plate.ring(cx, cy, Math.max(rx, ry), INK, 0.35, 1);
  }

  // ---- the plank roads (the bog's whole way of moving)
  for (const w of world.walks || []) {
    plate.line(toX(w.ax), toY(w.az), toX(w.bx), toY(w.bz), [226, 214, 178], 0.55, w.w > 2.8 ? 4 : 3);
    plate.dashed(toX(w.ax), toY(w.az), toX(w.bx), toY(w.bz), PLANK, 0.95, 5, 3, 2);
  }

  // ---- the forest's trails: they are what you actually walk, and on a plate they are dotted
  for (const route of world.trails?.routes || []) {
    const pts = route.points || [];
    for (let i = 0; i + 1 < pts.length; i++) {
      plate.dashed(toX(pts[i].x), toY(pts[i].z), toX(pts[i + 1].x), toY(pts[i + 1].z), [128, 104, 62], 0.5, 3, 5, 1);
    }
  }

  // ---- places
  for (const L of world.landmarks || []) {
    if (L.id === 'camp') { plate.disc(toX(L.x), toY(L.z), 5, MARK, 0.9); plate.ring(toX(L.x), toY(L.z), 8, MARK, 0.5, 1); }
    else plate.box(toX(L.x), toY(L.z), 3, INK, 0.75);
  }
  // the pumps, and the car at the end of the causeway
  for (const p of world.pumps || []) {
    plate.box(toX(p.x), toY(p.z), 2, MARK, 0.8);
    plate.ring(toX(p.x), toY(p.z), 4, MARK, 0.32, 1);
  }
  if (world.car) plate.cross(toX(world.car.x), toY(world.car.z), 5, MARK, 0.95, 2);
  if (world.yard) { plate.box(toX(world.yard.x), toY(world.yard.z), 4, INK, 0.9); plate.ring(toX(world.yard.x), toY(world.yard.z), 7, INK, 0.4, 1); }

  // ---- texture: the forest is drawn as timber, the bog as tussock (small, dense, low contrast)
  {
    const forest = mapId === 'forest';
    const step = forest ? 10 : 18;
    let n = 0;
    for (let gy = pad + 8; gy < H - pad - 8; gy += step) {
      for (let gx = pad + 8; gx < W - pad - 8; gx += step) {
        // a jittered lattice, deterministic: the same plate every time the script runs
        const hsh = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
        const jx = (hsh - Math.floor(hsh)) - 0.5, jy = (Math.sin(hsh * 91.7) * 0.5);
        const x = Math.round(gx + jx * step), y = Math.round(gy + jy * step);
        if (x < pad + 4 || x > W - pad - 4 || y < pad + 4 || y > H - pad - 4) continue;
        const wx = wx_of(x), wz = wz_of(y);
        if (Math.abs(wx) > half - 4 || Math.abs(wz) > half - 4) continue;
        if (world.water && world.water.depth(wx, wz) > 0.02) continue; // nothing printed on water
        if (world.lake && Math.hypot(wx - world.lake.x, wz - world.lake.z) < world.lake.r) continue;
        // keep the symbols off the places themselves
        let near = false;
        for (const L of world.landmarks || []) if (Math.hypot(wx - L.x, wz - L.z) < 12) { near = true; break; }
        if (near) continue;
        if (forest) {
          plate.line(x, y, x, y - 4, [58, 68, 46], 0.4, 1); // a conifer: a stalk
          plate.line(x - 2, y - 2, x, y - 6, [58, 68, 46], 0.4, 1);
          plate.line(x + 2, y - 2, x, y - 6, [58, 68, 46], 0.4, 1);
        } else {
          plate.line(x - 2, y, x + 2, y, [96, 96, 60], 0.26, 1); // a tussock
          plate.set(x, y - 1, [96, 96, 60], 0.26);
        }
        n++;
      }
    }
  }

  // ---- the plate itself: border, a north arrow, a scale bar
  const ink = (x0, y0, x1, y1, a = 0.7, wide = 2) => plate.line(x0, y0, x1, y1, INK, a, wide);
  ink(pad - 6, pad - 6, W - pad + 6, pad - 6); ink(W - pad + 6, pad - 6, W - pad + 6, H - pad + 6);
  ink(W - pad + 6, H - pad + 6, pad - 6, H - pad + 6); ink(pad - 6, H - pad + 6, pad - 6, pad - 6);
  // north: an arrow, the only glyph a plate needs
  const nx = W - pad - 4, ny = pad + 26;
  ink(nx, ny + 16, nx, ny - 12, 0.8, 2);
  ink(nx, ny - 12, nx - 6, ny - 2, 0.8, 2);
  ink(nx, ny - 12, nx + 6, ny - 2, 0.8, 2);
  // scale: 50 m
  const bar = (50 / (half * 2)) * span;
  const by = H - pad - 4;
  ink(pad + 2, by, pad + 2 + bar, by, 0.75, 2);
  ink(pad + 2, by - 4, pad + 2, by + 4, 0.75, 1);
  ink(pad + 2 + bar, by - 4, pad + 2 + bar, by + 4, 0.75, 1);
  ink(pad + 2 + bar / 2, by - 3, pad + 2 + bar / 2, by + 3, 0.5, 1);

  // a soft vignette so the plate sits in the dark panel instead of glowing out of it
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
    const d = Math.min(1, Math.hypot(dx, dy) / 1.18);
    if (d > 0.55) plate.set(x, y, [52, 48, 34], (d - 0.55) * 0.35);
  }
  // a plate is printed, not photographed: rounding the colours gives the paper its flat look and makes the
  // PNG a third of the size
  for (let i = 0; i < plate.px.length; i++) plate.px[i] = Math.round(plate.px[i] / 6) * 6;
  return { png: plate.png(), stats: { map: mapId, water: world.waterTris || 0, landmarks: (world.landmarks || []).length } };
}

mkdirSync(new URL('../public/maps/', import.meta.url), { recursive: true });
for (const id of ['forest', 'bog']) {
  const t0 = performance.now();
  const { png, stats } = render(id);
  writeFileSync(new URL(`../public/maps/${id}.png`, import.meta.url), png);
  console.log(`${id}: ${(png.length / 1024).toFixed(0)} kB, ${(performance.now() - t0).toFixed(0)} ms`, stats);
}
