// (4.2) A car's tuning: the rims and their colour, the windscreen's tint and up to four stickers of your own
// (a picture you load, cut down to 64×64 and 15 colours). Pure data, no THREE: every machine in a room cleans
// what it receives the same way, and it is small enough to ride along in the fit (fit.ct, see outfit.js) — the
// host's car is the one the whole room sees, in the garage and in the road film.
//
// A sticker: { at: a place on the car (DECAL_SLOTS), s: its size (×), px: the picture, pal: its colours }.
// px is base64 of 2048 bytes — 64×64 colour indices, 4 bits each (0 = clear, i = pal[i − 1]), rows from the
// top of the picture. Four of them are 11 KB at most: the lobby's roster carries every fit (TRYSTERO chunks it).

export const RIMS = ['stock', 'steel', 'spoke5', 'mesh', 'dish', 'turbine'];
// what a rim is painted with: a material kind (ui/garageSet.js GK / CK); stock = the model's own
export const RIM_TONES = { stock: -1, chrome: 23, silver: 36, black: 25, gold: 46, white: 34, red: 37, body: 52 };
export const RIM_TONE_IDS = Object.keys(RIM_TONES);
// each style's own colour when the tone is left at stock (BBS gold for the mesh, as on every second AE86)
export const RIM_DEFAULT = { stock: 23, steel: 36, spoke5: 23, mesh: 46, dish: 23, turbine: 36 };
export const TINTS = 4; // 0 none … 3 limo
export const TINT_ALPHA = [0, 0.38, 0.6, 0.82];
export const DECAL_SLOTS = ['door', 'hood', 'rear', 'tail'];
export const STICKER = { w: 64, h: 64, colors: 15, max: 4, sMin: 0.5, sMax: 1.25 };
export const PX_LEN = 2732; // base64 of 2048 bytes
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const HEX = /^#[0-9a-f]{6}$/;

export const DEFAULT_LOOK = Object.freeze({ rim: 'stock', rt: 'stock', tint: 0, st: Object.freeze([]) });

const _clean = new WeakSet(); // looks that came out of cleanLook (frozen): no need to look at them again
const _keys = new WeakMap();
_clean.add(DEFAULT_LOOK);

function hex(v) {
  const s = String(v || '').trim().toLowerCase();
  return HEX.test(s) ? s : /^[0-9a-f]{6}$/.test(s) ? '#' + s : null;
}

function cleanSticker(s) {
  if (!s || typeof s !== 'object' || !DECAL_SLOTS.includes(s.at)) return null;
  if (typeof s.px !== 'string' || s.px.length !== PX_LEN || !B64.test(s.px)) return null;
  const pal = Array.isArray(s.pal) ? s.pal.slice(0, STICKER.colors).map(hex).filter(Boolean) : [];
  if (!pal.length) return null;
  const n = Number(s.s);
  const sc = Number.isFinite(n) ? Math.round(Math.min(STICKER.sMax, Math.max(STICKER.sMin, n)) * 100) / 100 : 1;
  return Object.freeze({ at: s.at, s: sc, px: s.px, pal: Object.freeze(pal) });
}

// anything from storage or the network → a valid look (frozen; a clean look comes back as it is)
export function cleanLook(o) {
  if (o && _clean.has(o)) return o;
  const v = o && typeof o === 'object' ? o : {};
  const rim = RIMS.includes(v.rim) ? v.rim : 'stock';
  const rt = RIM_TONE_IDS.includes(v.rt) ? v.rt : 'stock';
  const tn = Math.round(Number(v.tint));
  const tint = Number.isFinite(tn) ? Math.min(TINTS - 1, Math.max(0, tn)) : 0;
  const st = [];
  if (Array.isArray(v.st)) {
    for (const s of v.st.slice(0, 8)) {
      const c = cleanSticker(s);
      if (c && !st.some((x) => x.at === c.at)) st.push(c);
      if (st.length >= STICKER.max) break;
    }
  }
  if (rim === 'stock' && rt === 'stock' && !tint && !st.length) return DEFAULT_LOOK;
  const out = Object.freeze({ rim, rt, tint, st: Object.freeze(st) });
  _clean.add(out);
  return out;
}

export function isDefaultLook(look) {
  const l = cleanLook(look);
  return l.rim === 'stock' && l.rt === 'stock' && !l.tint && !l.st.length;
}

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// a short key that changes whenever the look does (fitKey, the garage's rebuild check)
export function lookKey(look) {
  const l = cleanLook(look);
  let k = _keys.get(l);
  if (k) return k;
  k = `${l.rim}.${l.rt}.${l.tint}` + l.st.map((s) => `.${s.at}${s.s}:${djb2(s.px + s.pal.join(''))}`).join('');
  _keys.set(l, k);
  return k;
}

// a look with one thing changed (the wardrobe's buttons): a new clean object, the old one is never touched
export function withLook(look, patch) {
  const l = cleanLook(look);
  return cleanLook({ ...l, st: l.st.slice(), ...patch });
}
export function withSticker(look, at, sticker) {
  const l = cleanLook(look);
  const st = l.st.filter((s) => s.at !== at);
  if (sticker) st.push({ ...sticker, at });
  st.sort((a, b) => DECAL_SLOTS.indexOf(a.at) - DECAL_SLOTS.indexOf(b.at));
  return cleanLook({ ...l, st });
}

// ---------------- the pictures ----------------
function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// indices (64×64, 0..15) → px
export function encodeSticker(idx) {
  const bytes = new Uint8Array(2048);
  for (let i = 0; i < 2048; i++) bytes[i] = ((idx[i * 2] & 15) << 4) | (idx[i * 2 + 1] & 15);
  return toB64(bytes);
}
// px → indices (null if it is not one)
export function decodeSticker(px) {
  if (typeof px !== 'string' || px.length !== PX_LEN || !B64.test(px)) return null;
  let bytes;
  try { bytes = fromB64(px); } catch { return null; }
  if (bytes.length !== 2048) return null;
  const idx = new Uint8Array(4096);
  for (let i = 0; i < 2048; i++) {
    idx[i * 2] = bytes[i] >> 4;
    idx[i * 2 + 1] = bytes[i] & 15;
  }
  return idx;
}

// a 64×64 RGBA picture (a canvas's ImageData.data) → { px, pal }: median cut down to ≤ 15 colours, anything
// less than half opaque is clear. null when nothing in it is opaque.
export function quantize(rgba, n = STICKER.colors) {
  const N = STICKER.w * STICKER.h;
  const pts = [];
  for (let i = 0; i < N; i++) if (rgba[i * 4 + 3] >= 128) pts.push(i);
  if (!pts.length) return null;
  const boxes = [pts];
  while (boxes.length < n) {
    let best = -1, bestR = 0, bestC = 0;
    boxes.forEach((b, bi) => {
      if (b.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 255, hi = 0;
        for (const i of b) {
          const v = rgba[i * 4 + c];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        if (hi - lo > bestR) { bestR = hi - lo; best = bi; bestC = c; }
      }
    });
    if (best < 0) break;
    const b = boxes[best].sort((p, q) => rgba[p * 4 + bestC] - rgba[q * 4 + bestC]);
    const mid = b.length >> 1;
    boxes.splice(best, 1, b.slice(0, mid), b.slice(mid));
  }
  const pal = boxes.map((b) => {
    let r = 0, g = 0, bl = 0;
    for (const i of b) { r += rgba[i * 4]; g += rgba[i * 4 + 1]; bl += rgba[i * 4 + 2]; }
    return [r / b.length, g / b.length, bl / b.length].map((x) => Math.round(x));
  });
  const idx = new Uint8Array(N);
  for (const i of pts) {
    let bi = 0, bd = Infinity;
    for (let p = 0; p < pal.length; p++) {
      const dr = rgba[i * 4] - pal[p][0], dg = rgba[i * 4 + 1] - pal[p][1], db = rgba[i * 4 + 2] - pal[p][2];
      const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; bi = p; }
    }
    idx[i] = bi + 1;
  }
  return { px: encodeSticker(idx), pal: pal.map(([r, g, b]) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')) };
}

// the stickers of a look as one 128×128 RGBA atlas (a quarter each, in st order): raw sRGB bytes
export function stickerAtlas(look) {
  const l = cleanLook(look);
  const S = 128, out = new Uint8Array(S * S * 4);
  l.st.forEach((s, q) => {
    const idx = decodeSticker(s.px);
    if (!idx) return;
    const pal = s.pal.map((h) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16)));
    const ox = (q & 1) * 64, oy = (q >> 1) * 64;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const c = idx[y * 64 + x];
        if (!c || !pal[c - 1]) continue;
        const o = ((oy + 63 - y) * S + ox + x) * 4; // (texture rows run bottom-up: the picture's top is v = 1)
        out[o] = pal[c - 1][0];
        out[o + 1] = pal[c - 1][1];
        out[o + 2] = pal[c - 1][2];
        out[o + 3] = 255;
      }
    }
  });
  return out;
}

// ---------------- where they go ----------------
// defs: a car model's places ({ door: [{ p, n, up, s }, …], … } — ui/garageSet.js CAR_MODELS). One flat quad
// per place, a few mm off the panel, facing out; never mirrored (right = up × n, as seen from outside).
// → { pos, dat, uv, count } (dat: no wire edges, the paint's kind)
export function decalArrays(defs, look, kind = 52) {
  const l = cleanLook(look);
  const quads = [];
  l.st.forEach((s, q) => {
    for (const d of (defs && defs[s.at]) || []) quads.push([d, s, q]);
  });
  const count = quads.length * 6;
  const pos = new Float32Array(count * 3), dat = new Uint8Array(count * 4), uv = new Float32Array(count * 2);
  let v = 0;
  for (const [d, s, q] of quads) {
    const [nx, ny, nz] = norm(d.n), [ux, uy, uz] = norm(d.up);
    const rx = uy * nz - uz * ny, ry = uz * nx - ux * nz, rz = ux * ny - uy * nx;
    const h = (d.s * s.s) / 2;
    const c = [d.p[0] + nx * 0.004, d.p[1] + ny * 0.004, d.p[2] + nz * 0.004];
    const corner = (a, b) => [c[0] + (rx * a + ux * b) * h, c[1] + (ry * a + uy * b) * h, c[2] + (rz * a + uz * b) * h];
    const BL = corner(-1, -1), BR = corner(1, -1), TR = corner(1, 1), TL = corner(-1, 1);
    const qx = (q & 1) * 64, qy = (q >> 1) * 64;
    const tex = (u, w) => [(qx + 0.5 + u * 63) / 128, (qy + 0.5 + w * 63) / 128];
    for (const [p, t] of [[BL, tex(0, 0)], [BR, tex(1, 0)], [TR, tex(1, 1)], [BL, tex(0, 0)], [TR, tex(1, 1)], [TL, tex(0, 1)]]) {
      pos.set(p, v * 3);
      dat.set([255, 255, 255, kind], v * 4);
      uv.set(t, v * 2);
      v++;
    }
  }
  return { pos, dat, uv, count };
}
function norm(a) {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
