// The garage behind the co-op lobby: a cinder-block box with a cutaway front, green steel gates with an ajar
// wicket door (the night forest outside), a workbench, shelves, a hanging bulb — and the УАЗ that takes
// everyone out to the forest. Geometry only (built once); garage.js lights, animates and draws it.
//
// Garage-only material kinds start past the survivor's dyes (0–18); see GPAL in garage.js.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { RNG } from '../core/rng.js';

export const GK = {
  CONCRETE: 19, BLOCK: 20, PAINTWALL: 21, CARPAINT: 22, CHROME: 23, RUBBER: 24, DARK: 25, HEADLAMP: 26,
  TAILLAMP: 27, BULB: 28, EMBER: 29, GATE: 30, RUST: 31, NIGHT: 32, DASH: 33, PAPER: 34, CANVAS: 35, TIN: 36,
  REDPAINT: 37, SEAT: 38, OIL: 39, WOODDARK: 40, LANTERN: 41, RADIO: 42, SILHOUETTE: 43, FLAME: 44, GLASS: 45,
  YELLOW: 46, MARK: 47, BULB2: 48, MOONLIT: 49,
};

// the room (metres). The camera looks in from +z, where the front wall has been cut away.
export const ROOM = { X0: -4.3, X1: 4.3, Z0: -3.2, Z1: 3.0, H: 3.0, T: 0.25 };
// the double gates in the left wall, the wicket door in the near leaf (hinged on its near side, ajar outward)
export const GATE = { z0: -1.9, z1: 1.5, h: 2.5, mid: -0.2, wz0: 0.55, wz1: 1.3, wy0: 0.1, wy1: 1.95, open: 0.5 };
export const WIN = { x0: -2.95, x1: -2.05, y0: 1.72, y1: 2.32 };
// the car stands nose to the gates (−x); its driver's side (+z) faces you
export const CAR = { x: 0.35, z: -0.6, len: 4.0, wid: 1.78 };
export const BULB = { x: -1.1, z: -0.35, len: 0.4 };
// a second, bare bulb over the right half — older, and it knows it
export const BULB2 = { x: 2.45, z: 0.5, len: 0.55 };
export const LANTERN_AT = [-2.32, 0, 2.32];
export const DRUM_AT = [3.32, 0, 1.68];
// where each slot's survivor spends the lobby (slot 0, the host, drives)
export const SPOTS = [
  { kind: 'driver', pos: [0.1, 0, 0.42], yaw: -Math.PI / 2 }, // car-local
  { kind: 'chair', pos: [2.85, 0, 1.22], yaw: -0.8 },
  { kind: 'smoke', pos: [-3.97, 0, 2.18], yaw: 1.12 },
  { kind: 'pack', pos: [-1.72, 0, 1.72], yaw: 0.5 },
];

const PI = Math.PI;

// ---------------- helpers ----------------
export function boxAt(b, x, y, z, w, h, d, kind, ry = 0, rx = 0, rz = 0, opts) {
  b.place(x, y, z, rx, ry, rz);
  b.box(w, h, d, kind, opts);
}
// a quad in world space (b's matrix is reset)
function quad(b, p0, p1, p2, p3, kind, hide = 0) {
  b.identity();
  b.quad(p0, p1, p2, p3, kind, hide);
}
// a flat ring (annulus) around +y at height y, facing +y (down = facing −y)
function ring(b, r0, r1, y, segs, kind, down = false) {
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * PI * 2, a1 = ((i + 1) / segs) * PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    if (down) b.quad([c0 * r1, y, s0 * r1], [c1 * r1, y, s1 * r1], [c1 * r0, y, s1 * r0], [c0 * r0, y, s0 * r0], kind, 0);
    else b.quad([c0 * r0, y, s0 * r0], [c1 * r0, y, s1 * r0], [c1 * r1, y, s1 * r1], [c0 * r1, y, s0 * r1], kind, 0);
  }
}
// a tyre lying on its side (axis +y): tread, sidewalls, the hole
export function tyre(b, r, w, kind, segs = 12, treads = true) {
  const ri = r * 0.58;
  b.cylinder(segs, r, r, w, kind, { y0: -w / 2, capTop: false });
  b.cylinder(segs, ri, ri, w, kind, { y0: -w / 2, capTop: false });
  ring(b, ri, r, w / 2, segs, kind);
  ring(b, ri, r, -w / 2, segs, kind, true); // (the other sidewall faces the other way)
  if (!treads) return;
  const m = b.m.clone();
  for (let i = 0; i < segs; i++) {
    const a = ((i + 0.5) / segs) * PI * 2;
    _e.set(0, -a, 0, 'YXZ');
    _m.compose(_p.set(Math.cos(a) * (r + 0.012), 0, Math.sin(a) * (r + 0.012)), _q.setFromEuler(_e), _s);
    b.setMatrix(m.clone().multiply(_m));
    b.box(0.03, w * 0.92, r * 0.42, kind);
  }
  b.setMatrix(m);
}
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();

// ---------------- the room ----------------
export function buildRoom() {
  const b = new MeshBuilder(8192);
  const r = new RNG(77);
  const { X0, X1, Z0, Z1, H, T } = ROOM;

  // concrete floor: slabs with joints, a little uneven
  const nx = 8, nz = 6;
  const cw = (X1 - X0) / nx, cd = (Z1 - Z0) / nz;
  const hgt = [];
  for (let j = 0; j <= nz; j++) {
    hgt.push([]);
    for (let i = 0; i <= nx; i++) hgt[j].push(-0.004 + r.next() * 0.008);
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x0 = X0 + i * cw, z0 = Z0 + j * cd;
      quad(b, [x0, hgt[j][i], z0], [x0, hgt[j + 1][i], z0 + cd], [x0 + cw, hgt[j + 1][i + 1], z0 + cd], [x0 + cw, hgt[j][i + 1], z0], GK.CONCRETE);
    }
  }
  // the slab's cut edge, toward you
  quad(b, [X0 - T, -0.3, Z1], [X1 + T, -0.3, Z1], [X1 + T, 0, Z1], [X0 - T, 0, Z1], GK.CONCRETE);
  // an old oil stain under the engine, a drain grate, a crack
  const ox = CAR.x - 1.15, oz = CAR.z + 0.05;
  b.identity();
  const stain = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2;
    const rr = 0.55 + r.next() * 0.35;
    stain.push([ox + Math.cos(a) * rr * 1.25, 0.006, oz + Math.sin(a) * rr]);
  }
  for (let i = 0; i < 9; i++) b.tri([ox, 0.006, oz], stain[(i + 1) % 9], stain[i], GK.OIL, 5);
  boxAt(b, 1.55, 0.004, 1.15, 0.5, 0.008, 0.32, GK.DARK);
  for (let i = 0; i < 5; i++) boxAt(b, 1.35 + i * 0.1, 0.009, 1.15, 0.025, 0.004, 0.3, GK.RUST);

  // cinder-block walls: block faces over a dark mortar plane, oil-painted below, whitewashed above
  const BW = 0.4, BH = 0.2;
  const wall = (len, holes, put) => {
    for (let row = 0; row * BH < H - 0.001; row++) {
      const y0 = row * BH, y1 = Math.min(H, y0 + BH);
      const off = row % 2 ? BW / 2 : 0;
      for (let u0 = -off; u0 < len - 0.001; u0 += BW) {
        const a = Math.max(0, u0), c = Math.min(len, u0 + BW);
        if (c - a < 0.02) continue;
        if (holes.some((h) => a < h[1] && c > h[0] && y0 < h[3] && y1 > h[2])) continue;
        const k = y1 <= 1.2 + 0.001 ? GK.PAINTWALL : GK.BLOCK;
        const d = 0.006 + r.next() * 0.01;
        put(a + 0.009, c - 0.009, y0 + 0.009, y1 - 0.009, d, k);
      }
    }
  };
  // back wall (z = Z0), u runs along +x
  const winHole = [WIN.x0 - X0, WIN.x1 - X0, WIN.y0, WIN.y1];
  wall(X1 - X0, [winHole], (a, c, y0, y1, d, k) => quad(b, [X0 + a, y0, Z0 + d], [X0 + c, y0, Z0 + d], [X0 + c, y1, Z0 + d], [X0 + a, y1, Z0 + d], k));
  quad(b, [X0, 0, Z0], [X1, 0, Z0], [X1, WIN.y0, Z0], [X0, WIN.y0, Z0], GK.DARK);
  quad(b, [X0, WIN.y1, Z0], [X1, WIN.y1, Z0], [X1, H, Z0], [X0, H, Z0], GK.DARK);
  quad(b, [X0, WIN.y0, Z0], [WIN.x0, WIN.y0, Z0], [WIN.x0, WIN.y1, Z0], [X0, WIN.y1, Z0], GK.DARK);
  quad(b, [WIN.x1, WIN.y0, Z0], [X1, WIN.y0, Z0], [X1, WIN.y1, Z0], [WIN.x1, WIN.y1, Z0], GK.DARK);
  // right wall (x = X1), u runs along +z
  wall(Z1 - Z0, [], (a, c, y0, y1, d, k) => quad(b, [X1 - d, y0, Z0 + a], [X1 - d, y0, Z0 + c], [X1 - d, y1, Z0 + c], [X1 - d, y1, Z0 + a], k));
  quad(b, [X1, 0, Z0], [X1, 0, Z1], [X1, H, Z1], [X1, H, Z0], GK.DARK);
  // left wall (x = X0) around the gate opening
  const gateHole = [GATE.z0 - Z0, GATE.z1 - Z0, 0, GATE.h];
  wall(Z1 - Z0, [gateHole], (a, c, y0, y1, d, k) => quad(b, [X0 + d, y0, Z0 + a], [X0 + d, y0, Z0 + c], [X0 + d, y1, Z0 + c], [X0 + d, y1, Z0 + a], k));
  quad(b, [X0, 0, Z0], [X0, 0, GATE.z0], [X0, H, GATE.z0], [X0, H, Z0], GK.DARK);
  quad(b, [X0, 0, GATE.z1], [X0, 0, Z1], [X0, H, Z1], [X0, H, GATE.z1], GK.DARK);
  quad(b, [X0, GATE.h, GATE.z0], [X0, GATE.h, GATE.z1], [X0, H, GATE.z1], [X0, H, GATE.z0], GK.DARK);
  // the cut ends of the walls and the roof slab, facing you
  quad(b, [X0 - T, -0.3, Z1], [X0, -0.3, Z1], [X0, H + T, Z1], [X0 - T, H + T, Z1], GK.BLOCK);
  quad(b, [X1, -0.3, Z1], [X1 + T, -0.3, Z1], [X1 + T, H + T, Z1], [X1, H + T, Z1], GK.BLOCK);
  // window recess + frame in the back wall
  const wz = Z0, wd = -T;
  quad(b, [WIN.x0, WIN.y0, wz], [WIN.x1, WIN.y0, wz], [WIN.x1, WIN.y0, wz + wd], [WIN.x0, WIN.y0, wz + wd], GK.BLOCK);
  quad(b, [WIN.x0, WIN.y1, wz], [WIN.x1, WIN.y1, wz], [WIN.x1, WIN.y1, wz + wd], [WIN.x0, WIN.y1, wz + wd], GK.BLOCK);
  quad(b, [WIN.x0, WIN.y0, wz], [WIN.x0, WIN.y1, wz], [WIN.x0, WIN.y1, wz + wd], [WIN.x0, WIN.y0, wz + wd], GK.BLOCK);
  quad(b, [WIN.x1, WIN.y0, wz], [WIN.x1, WIN.y1, wz], [WIN.x1, WIN.y1, wz + wd], [WIN.x1, WIN.y0, wz + wd], GK.BLOCK);
  const wx = (WIN.x0 + WIN.x1) / 2, wy = (WIN.y0 + WIN.y1) / 2, ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0;
  const fz = Z0 - 0.12;
  boxAt(b, wx, WIN.y0 + 0.025, fz, ww, 0.05, 0.05, GK.WOODDARK);
  boxAt(b, wx, WIN.y1 - 0.025, fz, ww, 0.05, 0.05, GK.WOODDARK);
  boxAt(b, WIN.x0 + 0.025, wy, fz, 0.05, wh, 0.05, GK.WOODDARK);
  boxAt(b, WIN.x1 - 0.025, wy, fz, 0.05, wh, 0.05, GK.WOODDARK);
  boxAt(b, wx, wy, fz, 0.03, wh, 0.03, GK.WOODDARK);
  boxAt(b, wx, wy, fz, ww, 0.03, 0.03, GK.WOODDARK);
  boxAt(b, wx, WIN.y0 - 0.02, Z0 + 0.06, ww + 0.12, 0.04, 0.14, GK.WOODDARK); // sill
  // the night behind it
  quad(b, [WIN.x0 - 0.5, WIN.y0 - 0.5, Z0 - T - 0.45], [WIN.x1 + 0.5, WIN.y0 - 0.5, Z0 - T - 0.45], [WIN.x1 + 0.5, WIN.y1 + 0.6, Z0 - T - 0.45], [WIN.x0 - 0.5, WIN.y1 + 0.6, Z0 - T - 0.45], GK.NIGHT);


  // ---- the gates (left wall): steel angle frame, two leaves of corrugated sheet, braces, hinges ----
  const gx = X0;
  const gz0 = GATE.z0, gz1 = GATE.z1, gh = GATE.h, gm = GATE.mid;
  boxAt(b, gx + 0.04, gh / 2, gz0 + 0.04, 0.08, gh, 0.08, GK.METAL);
  boxAt(b, gx + 0.04, gh / 2, gz1 - 0.04, 0.08, gh, 0.08, GK.METAL);
  boxAt(b, gx + 0.04, gh - 0.04, (gz0 + gz1) / 2, 0.08, 0.08, gz1 - gz0, GK.METAL);
  const sheet = (za, zb, holes = []) => {
    // the outer skin (seen through the frame), ribbed
    const sx = gx - 0.05;
    const segs = [[za, zb, 0.06, gh - 0.08]];
    for (const h of holes) {
      // split around a rectangular hole: below, above, left, right
      segs.length = 0;
      segs.push([za, zb, 0.06, h[2]], [za, zb, h[3], gh - 0.08], [za, h[0], h[2], h[3]], [h[1], zb, h[2], h[3]]);
    }
    for (const s of segs) {
      if (s[1] - s[0] < 0.01 || s[3] - s[2] < 0.01) continue;
      quad(b, [sx, s[2], s[0]], [sx, s[2], s[1]], [sx, s[3], s[1]], [sx, s[3], s[0]], GK.GATE);
    }
    // ribs
    for (let z = za + 0.09; z < zb - 0.05; z += 0.16) {
      const inHole = holes.some((h) => z > h[0] - 0.02 && z < h[1] + 0.02);
      if (inHole) {
        for (const h of holes) {
          boxAt(b, sx + 0.012, (0.08 + h[2]) / 2, z, 0.024, h[2] - 0.08, 0.035, GK.GATE);
          boxAt(b, sx + 0.012, (h[3] + gh - 0.1) / 2, z, 0.024, gh - 0.1 - h[3], 0.035, GK.GATE);
        }
      } else boxAt(b, sx + 0.012, gh / 2 - 0.02, z, 0.024, gh - 0.16, 0.035, GK.GATE);
    }
    // the leaf's frame and braces (inside)
    const fx = gx - 0.01;
    boxAt(b, fx, 0.1, (za + zb) / 2, 0.06, 0.07, zb - za, GK.GATE);
    boxAt(b, fx, gh - 0.13, (za + zb) / 2, 0.06, 0.07, zb - za, GK.GATE);
    boxAt(b, fx, gh / 2, za + 0.035, 0.06, gh - 0.2, 0.07, GK.GATE);
    boxAt(b, fx, gh / 2, zb - 0.035, 0.06, gh - 0.2, 0.07, GK.GATE);
    if (!holes.length) {
      boxAt(b, fx, gh * 0.52, (za + zb) / 2, 0.05, 0.06, zb - za - 0.06, GK.GATE);
      const L = Math.hypot(zb - za - 0.1, gh * 0.4);
      boxAt(b, fx, gh * 0.31, (za + zb) / 2, 0.05, 0.06, L, GK.GATE, 0, Math.atan2(gh * 0.4, zb - za - 0.1));
    }
  };
  sheet(gz0 + 0.08, gm - 0.01);
  sheet(gm + 0.01, gz1 - 0.08, [[GATE.wz0, GATE.wz1, GATE.wy0, GATE.wy1]]);
  // the wicket's own frame in the leaf
  const wzc = (GATE.wz0 + GATE.wz1) / 2;
  boxAt(b, gx - 0.01, GATE.wy1 + 0.03, wzc, 0.06, 0.06, GATE.wz1 - GATE.wz0 + 0.12, GK.GATE);
  boxAt(b, gx - 0.01, (GATE.wy0 + GATE.wy1) / 2, GATE.wz0 - 0.03, 0.06, GATE.wy1 - GATE.wy0, 0.06, GK.GATE);
  // a vertical latch bar between the leaves, the big hinges, a padlock hanging open
  boxAt(b, gx + 0.03, 1.2, gm, 0.05, 1.9, 0.06, GK.METAL);
  boxAt(b, gx + 0.09, 1.05, gm - 0.06, 0.06, 0.09, 0.06, GK.RUST);
  for (const z of [gz0 + 0.1, gz1 - 0.1]) for (const y of [0.45, 2.05]) boxAt(b, gx + 0.03, y, z, 0.06, 0.18, 0.1, GK.RUST);
  // outside: moonlit ground, pines against the night sky (big: you look out through the gap at a slant)
  quad(b, [gx - 0.06, 0.0, -30], [gx - 4.2, 0.0, -30], [gx - 4.2, 0.0, 6], [gx - 0.06, 0.0, 6], GK.MOONLIT);
  // (kept low: above the roof line it would show over the walls)
  quad(b, [gx - 4.2, -0.5, -40], [gx - 4.2, -0.5, 8], [gx - 4.2, 3.4, 8], [gx - 4.2, 3.4, -40], GK.NIGHT);
  const pines = [[-6.0, -1.0, 2.3], [-6.4, 0.4, 2.8], [-5.6, 1.5, 2.0], [-7.2, -2.4, 3.1], [-6.1, -3.6, 2.6], [-7.4, -5.0, 3.2], [-5.9, -6.4, 2.4], [-7.0, -8.0, 3.0], [-6.3, -10.5, 2.9], [-7.6, -13.0, 3.2], [-5.8, -2.0, 2.1]];
  for (const [x, z, hh] of pines) {
    for (let k = 0; k < 3; k++) {
      b.place(x, hh * (0.16 + k * 0.26), z, 0, r.next() * 2, 0);
      b.cone(5, hh * (0.34 - k * 0.08), hh * 0.42, GK.SILHOUETTE);
    }
    boxAt(b, x, hh * 0.1, z, 0.12, hh * 0.22, 0.12, GK.SILHOUETTE);
  }
  return b.toArrays();
}

// ---------------- the ceiling (its own mesh: hidden when the camera looks in from above) ----------------
export function buildCeiling() {
  const b = new MeshBuilder(1024);
  const r = new RNG(78);
  const { X0, X1, Z0, Z1, H } = ROOM;
  for (let i = 0; i < 28; i++) {
    const x0 = X0 + i * ((X1 - X0) / 28), x1 = X0 + (i + 1) * ((X1 - X0) / 28);
    const y = H + (r.next() - 0.5) * 0.01;
    quad(b, [x0, y, Z0], [x1, y, Z0], [x1, y, Z1], [x0, y, Z1], GK.WOODDARK);
  }
  for (const z of [-2.15, BULB.z, 1.35]) boxAt(b, 0, H - 0.1, z, X1 - X0, 0.2, 0.14, GK.WOODDARK);
  boxAt(b, 0, H - 0.215, BULB.z + 0.05, X1 - X0 - 0.3, 0.018, 0.018, GK.DARK);
  quad(b, [X0, H, Z1], [X1, H, Z1], [X1, H + ROOM.T, Z1], [X0, H + ROOM.T, Z1], GK.WOODDARK); // the roof's cut edge
  return b.toArrays();
}

// ---------------- the wicket door (its own mesh: it sways in the draught) ----------------
// local frame: hinge line on the y axis, the door extends along −z
export function buildWicket() {
  const b = new MeshBuilder(512);
  const w = GATE.wz1 - GATE.wz0 - 0.02, h = GATE.wy1 - GATE.wy0 - 0.02;
  boxAt(b, -0.015, h / 2, -w / 2, 0.03, h, w, GK.GATE);
  for (let z = -0.09; z > -w + 0.04; z -= 0.16) boxAt(b, 0.012, h / 2, z, 0.024, h - 0.1, 0.035, GK.GATE);
  boxAt(b, 0.03, 0.07, -w / 2, 0.05, 0.07, w, GK.GATE);
  boxAt(b, 0.03, h - 0.07, -w / 2, 0.05, 0.07, w, GK.GATE);
  boxAt(b, 0.03, h / 2, -w + 0.04, 0.05, h, 0.06, GK.GATE);
  boxAt(b, 0.07, h * 0.52, -w + 0.1, 0.05, 0.05, 0.12, GK.METAL); // handle
  return b.toArrays();
}

// ---------------- furniture and junk ----------------
export function buildProps() {
  const b = new MeshBuilder(8192);
  const r = new RNG(5);
  const { Z0, X1, X0 } = ROOM;

  // workbench along the back wall, right half
  const bx0 = 0.8, bx1 = 3.6, bz = Z0 + 0.34, top = 0.92;
  boxAt(b, (bx0 + bx1) / 2, top - 0.03, bz, bx1 - bx0, 0.06, 0.66, GK.WOODDARK);
  boxAt(b, (bx0 + bx1) / 2, 0.24, bz, bx1 - bx0 - 0.1, 0.03, 0.58, GK.WOODDARK);
  for (const x of [bx0 + 0.06, bx1 - 0.06]) for (const z of [bz - 0.27, bz + 0.27]) boxAt(b, x, top / 2 - 0.03, z, 0.07, top - 0.06, 0.07, KIND.WOOD);
  // under the bench: crates, a car battery, a coil of hose
  boxAt(b, 1.3, 0.255 + 0.13, bz, 0.42, 0.26, 0.38, KIND.WOOD, 0.08);
  boxAt(b, 2.05, 0.255 + 0.11, bz + 0.04, 0.3, 0.22, 0.2, GK.DARK, -0.1);
  boxAt(b, 2.05, 0.255 + 0.23, bz - 0.0, 0.03, 0.03, 0.03, GK.REDPAINT);
  b.place(2.9, 0.3, bz, 0, 0, 0);
  tyre(b, 0.2, 0.08, GK.DARK, 10, false);
  // on the bench: a vice, a red toolbox, a radio with a lit dial, a jar of nails, a clamp lamp
  boxAt(b, 3.35, top + 0.06, bz + 0.22, 0.14, 0.12, 0.16, GK.METAL);
  boxAt(b, 3.35, top + 0.14, bz + 0.22, 0.24, 0.05, 0.05, GK.METAL);
  boxAt(b, 3.35, top + 0.06, bz + 0.34, 0.03, 0.03, 0.18, GK.METAL);
  boxAt(b, 1.35, top + 0.11, bz + 0.02, 0.5, 0.22, 0.24, GK.REDPAINT, 0.05);
  boxAt(b, 1.35, top + 0.235, bz + 0.02, 0.2, 0.03, 0.04, GK.DARK, 0.05);
  boxAt(b, 2.45, top + 0.12, bz - 0.03, 0.42, 0.24, 0.18, GK.WOODDARK, -0.06);
  boxAt(b, 2.37, top + 0.15, bz + 0.065, 0.2, 0.07, 0.01, GK.RADIO, -0.06);
  boxAt(b, 2.6, top + 0.08, bz + 0.07, 0.06, 0.06, 0.012, GK.METAL, -0.06);
  b.place(2.47, top + 0.24, bz - 0.06, 0, 0, -0.5);
  b.box(0.008, 0.5, 0.008, GK.METAL, { bottom: true });
  b.place(2.95, top, bz + 0.08, 0, 0, 0);
  b.cylinder(7, 0.05, 0.05, 0.13, GK.GLASS, { capTop: false });
  b.cylinder(7, 0.04, 0.04, 0.09, GK.RUST, { y0: 0.005 });
  // the clamp lamp: a base, an arm, a shade looking down at the bench
  boxAt(b, 1.95, top + 0.02, bz - 0.2, 0.12, 0.04, 0.12, GK.DARK);
  b.place(1.95, top + 0.04, bz - 0.2, 0.25, 0, 0);
  b.box(0.02, 0.45, 0.02, GK.DARK, { bottom: true });
  b.place(1.95, top + 0.47, bz - 0.09, -2.0, 0, 0);
  b.cone(8, 0.09, 0.14, GK.DARK, { capBottom: false });
  // pegboard and its tools
  const pz = Z0 + 0.025;
  boxAt(b, 2.2, 1.65, pz, 2.6, 0.95, 0.02, GK.WOODDARK);
  const tools = [[1.15, 0.36, 0.05, 0.0], [1.32, 0.42, 0.05, 0.0], [1.5, 0.3, 0.04, 0.0], [1.8, 0.5, 0.05, 0.25], [2.35, 0.22, 0.12, 0.0], [2.65, 0.4, 0.06, -0.15], [2.95, 0.34, 0.05, 0.0], [3.15, 0.28, 0.05, 0.1], [3.35, 0.38, 0.05, 0.0]];
  for (const [x, h, w, rz] of tools) {
    boxAt(b, x, 1.85 - h / 2, pz + 0.025, w, h, 0.02, GK.METAL, 0, 0, rz);
    boxAt(b, x, 1.89, pz + 0.02, 0.01, 0.03, 0.03, GK.DARK);
  }
  boxAt(b, 2.35, 1.36, pz + 0.03, 0.62, 0.16, 0.012, GK.METAL, 0, 0, 0.0); // a saw blade
  boxAt(b, 2.05, 1.36, pz + 0.035, 0.1, 0.12, 0.03, KIND.WOOD);

  // steel shelving on the right wall: tins, boxes, a lantern-less shelf, jars
  const sx = X1 - 0.24, sz0 = -3.05, sz1 = -1.35;
  for (const z of [sz0 + 0.03, sz1 - 0.03]) for (const x of [sx - 0.2, sx + 0.18]) boxAt(b, x, 1.1, z, 0.03, 2.2, 0.03, GK.METAL);
  for (const y of [0.12, 0.62, 1.12, 1.62, 2.12]) boxAt(b, sx, y, (sz0 + sz1) / 2, 0.42, 0.025, sz1 - sz0, GK.METAL);
  const shelfJunk = [[0.135, -2.85, 0.3, 0.26, 'box'], [0.135, -2.45, 0.22, 0.2, 'box'], [0.135, -1.75, 0.34, 0.3, 'tyre'],
    [0.635, -2.9, 0.08, 0.14, 'tin'], [0.635, -2.76, 0.08, 0.14, 'tin'], [0.635, -2.62, 0.08, 0.14, 'tin'], [0.635, -2.2, 0.28, 0.22, 'box'], [0.635, -1.7, 0.1, 0.24, 'can'],
    [1.135, -2.95, 0.07, 0.12, 'jar'], [1.135, -2.82, 0.07, 0.12, 'jar'], [1.135, -2.5, 0.3, 0.18, 'box'], [1.135, -1.9, 0.24, 0.3, 'canister'],
    [1.635, -2.7, 0.36, 0.3, 'box'], [1.635, -2.1, 0.2, 0.2, 'box'], [1.635, -1.65, 0.08, 0.16, 'tin']];
  for (const [y, z, w, h, t] of shelfJunk) {
    if (t === 'box') boxAt(b, sx, y + h / 2, z, Math.min(0.36, w + 0.06), h, w, KIND.WOOD, (r.next() - 0.5) * 0.2);
    else if (t === 'tin' || t === 'jar') {
      b.place(sx + (r.next() - 0.5) * 0.1, y, z, 0, 0, 0);
      b.cylinder(7, w / 2, w / 2, h, t === 'tin' ? GK.TIN : GK.GLASS);
    } else if (t === 'can') boxAt(b, sx, y + h / 2, z, 0.16, h, 0.1, GK.REDPAINT);
    else if (t === 'canister') boxAt(b, sx, y + h / 2, z, 0.28, h, w, GK.YELLOW);
    else if (t === 'tyre') {
      b.place(sx, y + 0.06, z, 0, 0, 0);
      tyre(b, w / 2, 0.12, GK.RUBBER, 10, false);
    }
  }

  // a stack of tyres by the right wall, one more leaning
  for (let i = 0; i < 3; i++) {
    b.place(3.85 + (r.next() - 0.5) * 0.06, 0.11 + i * 0.225, 0.42, 0, r.next(), 0);
    tyre(b, 0.36, 0.22, GK.RUBBER, 12, i === 2);
  }
  b.place(4.12, 0.36, -0.55, PI / 2, PI / 2, 0.22);
  tyre(b, 0.36, 0.22, GK.RUBBER, 12, true);

  // a red jerry can and a broom in the far corner by the gate, a crate by the car's tail
  boxAt(b, -3.62, 0.24, -2.78, 0.18, 0.48, 0.36, GK.REDPAINT, 0.3);
  boxAt(b, -3.62, 0.5, -2.7, 0.06, 0.05, 0.12, GK.REDPAINT, 0.3);
  b.place(-4.1, 0, -3.02, 0.12, 0.6, -0.16);
  b.box(0.025, 1.35, 0.025, KIND.WOOD, { bottom: true });
  b.place(-4.1, 0, -3.02, 0.12, 0.6, -0.16);
  b.taper(0.26, 0.06, 0.06, 0.04, 0.3, GK.YELLOW);
  boxAt(b, 2.95, 0.22, -2.05, 0.5, 0.44, 0.4, KIND.WOOD, 0.35);
  boxAt(b, 2.95, 0.5, -2.05, 0.3, 0.12, 0.28, GK.DARK, 0.5);

  // on the back wall: a hand-drawn map of the forest (five red rings) and a calendar
  const mz = Z0 + 0.02;
  boxAt(b, -0.95, 1.85, mz, 1.0, 0.7, 0.008, GK.PAPER, 0, 0, 0.02);
  for (let i = 0; i < 14; i++) {
    const x = -1.38 + r.next() * 0.86, y = 1.56 + r.next() * 0.58;
    boxAt(b, x, y, mz + 0.008, 0.06 + r.next() * 0.12, 0.006, 0.004, GK.WOODDARK, 0, 0, r.next() * PI);
  }
  for (const [x, y] of [[-1.25, 2.02], [-0.62, 1.98], [-1.05, 1.66], [-0.6, 1.62], [-0.85, 1.85]]) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * PI * 2;
      boxAt(b, x + Math.cos(a) * 0.035, y + Math.sin(a) * 0.035, mz + 0.01, 0.04, 0.01, 0.004, GK.MARK, 0, 0, a + PI / 2);
    }
  }
  boxAt(b, -1.4, 2.17, mz + 0.012, 0.02, 0.02, 0.02, GK.REDPAINT);
  boxAt(b, -0.5, 2.17, mz + 0.012, 0.02, 0.02, 0.02, GK.REDPAINT);
  boxAt(b, 0.25, 1.9, mz, 0.4, 0.55, 0.008, GK.PAPER, 0, 0, -0.03);
  boxAt(b, 0.25, 2.06, mz + 0.006, 0.34, 0.18, 0.004, GK.WOODDARK, 0, 0, -0.03);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) boxAt(b, 0.12 + j * 0.065, 1.9 - i * 0.07, mz + 0.006, 0.04, 0.035, 0.004, (i === 2 && j === 3) ? GK.MARK : GK.CANVAS, 0, 0, -0.03);

  // the chair (slot 1) and the drum beside it, a thermos on the drum
  const [cx, , cz] = SPOTS[1].pos;
  const cy = SPOTS[1].yaw;
  const local = (lx, lz) => [cx + Math.sin(cy) * lz + Math.cos(cy) * lx, cz + Math.cos(cy) * lz - Math.sin(cy) * lx];
  const seat = local(0, -0.05);
  boxAt(b, seat[0], 0.42, seat[1], 0.44, 0.04, 0.42, KIND.WOOD, cy);
  for (const [lx, lz] of [[-0.19, -0.23], [0.19, -0.23], [-0.19, 0.13], [0.19, 0.13]]) {
    const p = local(lx, lz);
    boxAt(b, p[0], 0.2, p[1], 0.035, 0.4, 0.035, KIND.WOOD, cy);
  }
  for (const lx of [-0.19, 0.19]) {
    const p = local(lx, -0.255);
    boxAt(b, p[0], 0.68, p[1], 0.035, 0.52, 0.035, KIND.WOOD, cy, -0.08);
  }
  for (const y of [0.72, 0.86]) {
    const p = local(0, -0.27 - (y - 0.68) * 0.08);
    boxAt(b, p[0], y, p[1], 0.38, 0.07, 0.02, KIND.WOOD, cy, -0.08);
  }
  const [dx, , dz] = DRUM_AT;
  b.place(dx, 0, dz, 0, 0.3, 0);
  b.cylinder(12, 0.29, 0.29, 0.88, GK.RUST);
  for (const y of [0.29, 0.59]) {
    b.place(dx, y, dz, 0, 0, 0);
    b.cylinder(12, 0.3, 0.3, 0.03, GK.RUST, { capTop: false });
  }
  b.place(dx + 0.1, 0.88, dz - 0.06, 0, 0, 0);
  b.cylinder(8, 0.05, 0.05, 0.26, GK.CHROME);
  b.place(dx + 0.1, 1.14, dz - 0.06, 0, 0, 0);
  b.cylinder(8, 0.045, 0.04, 0.05, GK.REDPAINT);
  boxAt(b, dx - 0.1, 0.89, dz + 0.08, 0.07, 0.015, 0.1, GK.PAPER, 0.4); // a deck of cards

  // the packer's tarp on the floor, and the lantern
  const [kx, , kz] = SPOTS[3].pos;
  b.place(kx + 0.05, 0.004, kz + 0.18, 0, SPOTS[3].yaw + 0.15, 0);
  b.box(1.5, 0.006, 1.2, GK.CANVAS);
  const [lx, , lz] = LANTERN_AT;
  b.place(lx, 0, lz, 0, 0, 0);
  b.cylinder(8, 0.08, 0.075, 0.06, GK.RUST, { capBottom: true });
  b.place(lx, 0.06, lz, 0, 0, 0);
  b.cylinder(8, 0.05, 0.05, 0.13, GK.LANTERN, { capTop: false });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + 0.4;
    boxAt(b, lx + Math.cos(a) * 0.058, 0.125, lz + Math.sin(a) * 0.058, 0.01, 0.14, 0.01, GK.RUST);
  }
  b.place(lx, 0.19, lz, 0, 0, 0);
  b.cone(8, 0.075, 0.06, GK.RUST);
  b.place(lx, 0.27, lz, 0, 0.4, 0);
  b.box(0.12, 0.012, 0.012, GK.RUST);
  return b.toArrays();
}

// ---------------- the hanging bulb (its own group: it swings) ----------------
// local frame: the hook at the origin, hanging down −y
export function buildBulb() {
  const b = new MeshBuilder(256);
  b.place(0, -BULB.len, 0, 0, 0, 0);
  b.box(0.008, BULB.len, 0.008, GK.DARK, { bottom: true });
  b.place(0, -BULB.len - 0.02, 0, 0, 0, 0);
  b.cylinder(6, 0.025, 0.022, 0.05, GK.DARK);
  // a tin shade, narrow end up, open below — the bulb hangs just under its rim
  b.place(0, -BULB.len - 0.17, 0, 0, 0, 0);
  b.cone(10, 0.22, 0.14, GK.METAL, { capBottom: false });
  b.place(0, -BULB.len - 0.2, 0, 0, 0, 0);
  b.octa(0.042, 0.06, GK.BULB);
  return b.toArrays();
}
export const BULB_LOCAL = -BULB.len - 0.2; // the glowing bit, below the hook
export function buildBulb2() {
  const b = new MeshBuilder(128);
  b.place(0, -BULB2.len, 0, 0, 0, 0);
  b.box(0.008, BULB2.len, 0.008, GK.DARK, { bottom: true });
  b.place(0, -BULB2.len - 0.02, 0, 0, 0, 0);
  b.cylinder(6, 0.022, 0.02, 0.045, GK.DARK);
  b.place(0, -BULB2.len - 0.07, 0, 0, 0, 0);
  b.octa(0.04, 0.055, GK.BULB2);
  return b.toArrays();
}
export const BULB2_LOCAL = -BULB2.len - 0.07;

// ---------------- the car: a УАЗ-469 with its canvas top off ----------------
// car-local frame: nose toward −x, centre on the ground, driver's side +z
export const CARP = {
  wheelX: 1.19, wheelZ: 0.76, wheelR: 0.39, wheelW: 0.25,
  head: [[-2.03, 0.86, 0.55], [-2.03, 0.86, -0.55]], // headlights
  tail: [[2.03, 0.95, 0.74], [2.03, 0.95, -0.74]],
  exhaust: [2.1, 0.43, -0.52],
  dash: [-0.66, 1.16, 0.42],
  key: [-0.56, 1.06, 0.28], // ignition, right of the column
  wheelC: [-0.42, 1.24, 0.42], // the steering wheel's centre
  wheelN: [0.9, 0.44, 0], // ...and the way it faces (toward the driver, tilted up)
  wheelRad: 0.19,
  horn: [-0.42, 1.24, 0.42],
};

// opts.forest: the one in the forestry yard — no spare wheel or can on its tail, and no hood (its hood is
// its own mesh, propped open over an engine bay with things missing: see game/uaz.js)
export function buildCarBody(opts = {}) {
  const forest = !!opts.forest;
  const b = new MeshBuilder(8192);
  const P = GK.CARPAINT, D = GK.DARK;
  const W = 0.89;
  // chassis rails and the sump, seen under the body
  boxAt(b, 0, 0.5, 0.42, 3.8, 0.12, 0.08, D);
  boxAt(b, 0, 0.5, -0.42, 3.8, 0.12, 0.08, D);
  boxAt(b, -1.19, 0.4, 0, 0.14, 0.14, 1.36, D);
  boxAt(b, 1.19, 0.4, 0, 0.14, 0.14, 1.36, D);
  boxAt(b, 0.2, 0.42, 0, 1.2, 0.1, 0.12, D);
  // the tub: floor, sides with the rear arches, the tail
  boxAt(b, -0.2, 0.55, 0, 1.0, 0.04, 1.74, D); // the footwell
  boxAt(b, 1.0, 0.66, 0, 2.0, 0.04, 1.74, D);
  for (const s of [-1, 1]) {
    const z = s * (W - 0.02);
    boxAt(b, 0.0, 0.94, z, 1.4, 0.64, 0.04, P);
    boxAt(b, 1.19, 1.1, z, 0.94, 0.32, 0.04, P);
    boxAt(b, 1.83, 0.94, z, 0.34, 0.64, 0.04, P);
    // arch lips (the УАЗ's arches are flat-topped trapezoids)
    boxAt(b, 1.19, 0.95, z + s * 0.015, 0.7, 0.04, 0.05, P);
    boxAt(b, 0.78, 0.8, z + s * 0.015, 0.04, 0.32, 0.05, P, 0, 0, -0.35);
    boxAt(b, 1.6, 0.8, z + s * 0.015, 0.04, 0.32, 0.05, P, 0, 0, 0.35);
    // the top rail of the side, door seams, a handle, a step
    boxAt(b, 0.65, 1.27, z, 2.72, 0.05, 0.08, P);
    boxAt(b, -0.66, 0.95, z + s * 0.022, 0.012, 0.62, 0.01, D);
    boxAt(b, 0.34, 0.95, z + s * 0.022, 0.012, 0.62, 0.01, D);
    boxAt(b, 0.66, 0.95, z + s * 0.022, 0.012, 0.62, 0.01, D);
    boxAt(b, 0.18, 1.12, z + s * 0.03, 0.12, 0.025, 0.025, GK.CHROME);
    boxAt(b, 0.5, 1.12, z + s * 0.03, 0.1, 0.025, 0.025, GK.CHROME);
    boxAt(b, -0.1, 0.6, z + s * 0.05, 0.5, 0.03, 0.12, D);
  }
  boxAt(b, 2.0, 0.94, 0, 0.04, 0.64, 1.78, P);
  boxAt(b, 2.0, 1.27, 0, 0.08, 0.05, 1.8, P);
  for (const [x, y, z] of CARP.tail) boxAt(b, x - 0.01, y, z, 0.03, 0.09, 0.12, GK.TAILLAMP);
  boxAt(b, 2.08, 0.52, 0, 0.1, 0.12, 1.76, D); // rear bumper
  // the spare wheel on the tail, a jerry can beside it (the forest's car: an empty bracket, an empty strap)
  if (!forest) {
    b.place(2.18, 0.98, 0.3, 0, 0, PI / 2);
    tyre(b, 0.36, 0.22, GK.RUBBER, 12, true);
    b.place(2.18, 0.98, 0.3, 0, 0, PI / 2);
    b.cylinder(10, 0.2, 0.2, 0.18, GK.CARPAINT, { y0: -0.09 });
    boxAt(b, 2.14, 0.98, -0.5, 0.14, 0.44, 0.3, GK.CARPAINT);
    boxAt(b, 2.14, 1.22, -0.44, 0.06, 0.05, 0.1, GK.CARPAINT);
  } else {
    b.place(2.1, 0.98, 0.3, 0, 0, PI / 2);
    b.cylinder(6, 0.04, 0.04, 0.16, GK.RUST, { y0: -0.02 }); // the stud the spare hung on
    boxAt(b, 2.09, 0.98, -0.5, 0.03, 0.03, 0.34, GK.RUST);
  }
  // exhaust pipe under the tail, right side
  b.place(1.55, 0.43, CARP.exhaust[2], 0, 0, PI / 2);
  b.cylinder(6, 0.03, 0.03, 1.1, D, { y0: -0.55 });

  // the front: flat hood, fenders like shelves, a slotted grille panel, round lamps
  if (!forest) boxAt(b, -1.35, 1.06, 0, 1.28, 0.06, 1.32, P, 0, 0, 0.025);
  boxAt(b, -1.35, 0.83, 0.64, 1.26, 0.42, 0.03, P);
  boxAt(b, -1.35, 0.83, -0.64, 1.26, 0.42, 0.03, P);
  for (const s of [-1, 1]) {
    const zc = s * 0.765;
    boxAt(b, -1.36, 0.99, zc, 1.3, 0.035, 0.27, P);
    boxAt(b, -1.85, 0.8, s * (W - 0.015), 0.28, 0.4, 0.03, P);
    boxAt(b, -0.76, 0.8, s * (W - 0.015), 0.12, 0.4, 0.03, P);
    boxAt(b, -1.31, 0.94, s * (W - 0.015), 0.8, 0.09, 0.03, P);
    boxAt(b, -1.31, 0.88, s * (W + 0.0), 0.86, 0.035, 0.05, P);
    boxAt(b, -1.98, 0.8, zc, 0.03, 0.4, 0.26, P);
  }
  boxAt(b, -1.995, 0.83, 0, 0.03, 0.44, 1.02, P);
  for (let i = 0; i < 7; i++) boxAt(b, -2.01, 0.85, -0.3 + i * 0.1, 0.012, 0.3, 0.045, D);
  for (const [x, y, z] of CARP.head) {
    b.place(x + 0.04, y, z, 0, 0, PI / 2);
    b.cylinder(10, 0.105, 0.105, 0.06, GK.CHROME, { y0: -0.03, capTop: false });
    b.place(x + 0.012, y, z, 0, 0, PI / 2);
    b.cylinder(10, 0.088, 0.088, 0.012, GK.HEADLAMP, { y0: -0.006 });
    boxAt(b, x + 0.02, 0.68, z * 1.12, 0.03, 0.05, 0.08, GK.YELLOW);
  }
  boxAt(b, -2.08, 0.56, 0, 0.12, 0.13, 1.82, D); // front bumper
  for (const s of [-1, 1]) boxAt(b, -2.16, 0.56, s * 0.42, 0.06, 0.06, 0.05, GK.RUST);
  // windshield frame (raked), wipers, mirrors
  const wf = (y) => -0.72 + (y - 1.1) * 0.17;
  for (const s of [-1, 1]) {
    b.place(-0.72, 1.1, s * 0.85, 0, 0, -0.17);
    b.box(0.05, 0.64, 0.05, P, { bottom: true });
    b.place(wf(1.4), 1.42, s * 0.97, 0, 0, 0);
    b.box(0.02, 0.02, 0.14, D);
    b.place(wf(1.4) + 0.02, 1.47, s * 1.04, 0, s * 0.2, 0);
    b.box(0.03, 0.12, 0.1, GK.CHROME);
  }
  b.place(wf(1.12), 1.12, 0, 0, 0, -0.17);
  b.box(0.05, 0.05, 1.72, P);
  b.place(wf(1.72), 1.72, 0, 0, 0, -0.17);
  b.box(0.05, 0.05, 1.74, P);
  for (const z of [0.38, -0.3]) {
    b.place(wf(1.16) - 0.02, 1.16, z, 0.4, 0, -0.17);
    b.box(0.012, 0.012, 0.36, D);
  }
  // the hoop of the folded top, and the canvas rolled up behind the rear seat
  for (const x of [0.42, 1.62]) {
    for (const s of [-1, 1]) boxAt(b, x, 1.56, s * 0.86, 0.04, 0.6, 0.04, D);
    boxAt(b, x, 1.86, 0, 0.04, 0.04, 1.76, D);
  }
  b.place(1.92, 1.38, 0, PI / 2, 0, 0);
  b.cylinder(8, 0.11, 0.11, 1.66, GK.CANVAS, { y0: -0.83, capBottom: true });
  for (const z of [-0.5, 0.5]) {
    b.place(1.92, 1.38, z, PI / 2, 0, 0);
    b.cylinder(8, 0.118, 0.118, 0.04, GK.DARK, { y0: -0.02, capTop: false });
  }

  // inside: dashboard + gauges, the column and the wheel, seats, the gear stick, cargo
  boxAt(b, -0.68, 1.1, 0, 0.16, 0.2, 1.7, D);
  boxAt(b, -0.6, 1.2, 0, 0.12, 0.03, 1.66, D);
  for (const dz of [-0.07, 0.07]) {
    b.place(CARP.dash[0] + 0.07, CARP.dash[1] - 0.04, CARP.dash[2] + dz, 0, 0, PI / 2 - 0.3);
    b.cylinder(8, 0.042, 0.042, 0.01, GK.DASH, { y0: -0.005 });
  }
  boxAt(b, -0.6, 1.1, -0.42, 0.02, 0.1, 0.3, GK.DARK); // glovebox lid
  const [wx, wy, wz] = CARP.wheelC;
  b.place(-0.58, 1.06, wz, 0, 0, -(PI / 2 - 0.45));
  b.box(0.035, 0.22, 0.035, D, { bottom: true });
  void wx; void wy; // (the wheel itself is buildSteering: it turns)
  // a rear-view mirror under the top of the windshield
  b.place(-0.63, 1.66, 0.0, 0, 0.12, 0);
  b.box(0.03, 0.06, 0.2, D);
  b.place(-0.625, 1.69, 0.0, 0, 0, 0);
  b.box(0.012, 0.05, 0.012, D, { bottom: true });
  // seats
  for (const s of [1, -1]) {
    const z = s * 0.42;
    boxAt(b, 0.12, 0.84, z, 0.46, 0.12, 0.46, GK.SEAT);
    b.place(0.36, 0.9, z, 0, 0, 0.16);
    b.box(0.1, 0.62, 0.44, GK.SEAT, { bottom: true });
    boxAt(b, 0.12, 0.72, z, 0.3, 0.12, 0.3, D);
  }
  boxAt(b, 1.15, 0.86, 0, 0.46, 0.12, 1.5, GK.SEAT);
  b.place(1.42, 0.92, 0, 0, 0, 0.12);
  b.box(0.1, 0.5, 1.48, GK.SEAT, { bottom: true });
  b.place(-0.22, 0.7, 0.02, 0, 0, -0.3);
  b.box(0.02, 0.38, 0.02, D, { bottom: true });
  b.place(-0.12, 1.05, 0.02, 0, 0, 0);
  b.octa(0.03, 0.03, D);
  boxAt(b, -0.22, 0.72, 0.02, 0.18, 0.06, 0.16, D);
  // cargo in the back: a crate, a sack, a shovel
  boxAt(b, 1.75, 0.86, 0.48, 0.36, 0.36, 0.42, KIND.WOOD, 0.1);
  b.place(1.72, 0.7, -0.4, 0, 0.5, 0.25);
  b.taper(0.42, 0.3, 0.3, 0.24, 0.42, GK.CANVAS);
  b.place(1.2, 1.0, -0.78, 0.1, 0, 1.25);
  b.box(0.035, 1.1, 0.035, KIND.WOOD, { bottom: true });
  return b.toArrays();
}

// the steering wheel, in its own frame: the axis along +x, the rim in the y–z plane (12 o'clock = +y)
export function buildSteering() {
  const b = new MeshBuilder(512);
  const R = CARP.wheelRad;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * PI * 2;
    pts.push([0, Math.sin(a) * R, Math.cos(a) * R]);
  }
  b.identity();
  for (let i = 0; i < 12; i++) b.limb(pts[i], pts[i + 1], 0.016, 0.016, GK.DARK, 4);
  for (const i of [0, 6, 9]) b.limb([0, 0, 0], pts[i], 0.012, 0.012, GK.DARK, 4);
  b.place(0.012, 0, 0, 0, 0, PI / 2);
  b.cylinder(8, 0.045, 0.045, 0.03, GK.DARK, { y0: -0.015, capBottom: true });
  return b.toArrays();
}

export function buildCarWheels() {
  const b = new MeshBuilder(4096);
  const { wheelX: x, wheelZ: z, wheelR: r, wheelW: w } = CARP;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.place(sx * x, r, sz * z, PI / 2, 0, 0);
      tyre(b, r, w, GK.RUBBER, 12, true);
      b.place(sx * x, r, sz * (z + w * 0.38), PI / 2, 0, 0);
      b.cylinder(10, r * 0.55, r * 0.55, 0.03, GK.CARPAINT, { y0: -0.015, capBottom: true });
      b.place(sx * x, r, sz * (z + w * 0.45), PI / 2, 0, 0);
      b.cylinder(6, 0.07, 0.07, 0.03, GK.CHROME, { y0: -0.015 });
    }
  }
  return b.toArrays();
}

// a faint glass pane for the windshield (drawn after everything, blended)
export function buildCarGlass() {
  const b = new MeshBuilder(64);
  b.place(-0.72 + 0.29 * 0.17 * 1.0 + 0.0, 1.41, 0, 0, 0, -0.17);
  b.box(0.008, 0.56, 1.66, GK.GLASS);
  return b.toArrays();
}

// ---------------- what the packer packs (each its own little mesh) ----------------
export function buildItems() {
  const out = [];
  const mk = (fn) => {
    const b = new MeshBuilder(256);
    fn(b);
    out.push(b.toArrays());
  };
  // a tin of stew
  mk((b) => {
    b.place(0, 0, 0, 0, 0, 0);
    b.cylinder(8, 0.045, 0.045, 0.1, GK.TIN, { capBottom: true });
    b.place(0, 0.035, 0, 0, 0, 0);
    b.cylinder(8, 0.047, 0.047, 0.035, GK.REDPAINT, { capTop: false });
  });
  // a coil of rope
  mk((b) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * PI * 2;
      pts.push([Math.cos(a) * 0.09, 0.03, Math.sin(a) * 0.09]);
    }
    b.identity();
    for (let i = 0; i < 10; i++) b.limb(pts[i], pts[i + 1], 0.028, 0.028, KIND.WOOD, 4);
    for (let i = 0; i < 10; i += 2) b.limb([pts[i][0] * 0.7, 0.055, pts[i][2] * 0.7], [pts[i + 1][0] * 0.7, 0.055, pts[i + 1][2] * 0.7], 0.022, 0.022, KIND.WOOD, 4);
  });
  // a first-aid kit
  mk((b) => {
    b.place(0, 0.05, 0, 0, 0, 0);
    b.box(0.2, 0.1, 0.13, KIND.BONE);
    b.place(0, 0.101, 0, 0, 0, 0);
    b.box(0.09, 0.004, 0.026, GK.MARK);
    b.box(0.026, 0.004, 0.09, GK.MARK);
  });
  // a flashlight
  mk((b) => {
    b.place(0, 0.03, 0, 0, 0, PI / 2);
    b.cylinder(8, 0.025, 0.025, 0.17, GK.DARK, { y0: -0.085, capBottom: true });
    b.place(-0.085, 0.03, 0, 0, 0, PI / 2);
    b.cylinder(8, 0.034, 0.034, 0.04, GK.CHROME, { y0: -0.04 });
  });
  // a thermos
  mk((b) => {
    b.place(0, 0, 0, 0, 0, 0);
    b.cylinder(8, 0.045, 0.045, 0.24, GK.YELLOW, { capBottom: true });
    b.place(0, 0.24, 0, 0, 0, 0);
    b.cylinder(8, 0.048, 0.045, 0.05, GK.DARK);
  });
  return out;
}
// floor spots for the items, in the packer's frame (x: their left/right, z: forward), and their resting yaw
export const ITEM_SPOTS = [[0.48, 0.22, 0.3], [0.55, -0.12, 1.2], [-0.5, 0.28, -0.4], [-0.56, -0.02, 0.9], [0.32, 0.56, 2.1]];

// ---------------- the backpack: body + a flap that opens ----------------
// frame: bottom centre on the origin, facing +z (the packer); the flap hinges on the back top edge
export const PACK = { w: 0.42, h: 0.6, d: 0.3 };
export function buildPack() {
  const b = new MeshBuilder(1024);
  const { w, h, d } = PACK;
  b.place(0, 0, 0, 0, 0, 0);
  b.taper(w, d, w * 0.9, d * 0.82, h, GK.CANVAS);
  // side pockets, straps on the back, a sleeping mat strapped under it
  for (const s of [-1, 1]) {
    b.place(s * (w / 2 + 0.035), 0.08, 0, 0, 0, 0);
    b.taper(0.07, d * 0.7, 0.07, d * 0.6, 0.26, GK.CANVAS);
    boxAt(b, s * 0.12, h * 0.55, -d / 2 - 0.012, 0.05, h * 0.8, 0.02, GK.DARK);
  }
  boxAt(b, 0, h * 0.42, d / 2 + 0.005, w * 0.7, 0.04, 0.012, GK.DARK);
  b.place(0, 0.07, -d / 2 - 0.09, 0, 0, PI / 2);
  b.cylinder(8, 0.075, 0.075, w * 1.1, KIND.EFFIGY, { y0: -w * 0.55, capBottom: true });
  // the opening: a dark mouth on top (shows when the flap is up)
  b.place(0, h - 0.004, 0, 0, 0, 0);
  b.box(w * 0.82, 0.006, d * 0.74, GK.DARK);
  return b.toArrays();
}
export function buildPackFlap() {
  const b = new MeshBuilder(256);
  const { w, d } = PACK;
  // hinge on the local x axis; the flap lies along +z, folds down over the front
  boxAt(b, 0, 0.02, d * 0.42, w * 0.94, 0.04, d * 0.86, GK.CANVAS);
  boxAt(b, 0, -0.06, d * 0.84, w * 0.62, 0.16, 0.035, GK.CANVAS);
  boxAt(b, 0, -0.1, d * 0.86, 0.05, 0.03, 0.03, GK.CHROME);
  return b.toArrays();
}

// ---------------- small things in hands ----------------
export function buildCigarette() {
  const b = new MeshBuilder(64);
  // along +z from the fingers; the lit end at +z
  b.place(0, 0, 0, PI / 2, 0, 0);
  b.cylinder(5, 0.0055, 0.0055, 0.06, KIND.BONE, { capBottom: true, capTop: false });
  b.place(0, 0, 0.06, PI / 2, 0, 0);
  b.cylinder(5, 0.0058, 0.0058, 0.008, GK.EMBER, { capTop: true });
  return b.toArrays();
}
export function buildCup() {
  const b = new MeshBuilder(64);
  b.place(0, -0.04, 0, 0, 0, 0);
  b.cylinder(8, 0.034, 0.04, 0.075, GK.REDPAINT, { capBottom: true, capTop: false });
  b.place(0, 0.03, 0, 0, 0, 0);
  b.cylinder(8, 0.036, 0.036, 0.002, GK.DARK);
  return b.toArrays();
}
export function buildLighter() {
  const b = new MeshBuilder(64);
  b.place(0, 0, 0, 0, 0, 0);
  b.box(0.025, 0.04, 0.012, GK.CHROME);
  return b.toArrays();
}
export function buildFlame() {
  const b = new MeshBuilder(32);
  b.place(0, 0.04, 0, 0, 0, 0);
  b.octa(0.008, 0.02, GK.FLAME);
  return b.toArrays();
}
// the thing that walks past the window now and then: flat, black, too tall, arms too long
export function buildPasser() {
  const b = new MeshBuilder(256);
  b.place(0, 2.15, 0, 0, 0, 0);
  b.octa(0.12, 0.16, GK.SILHOUETTE);
  b.place(0, 1.35, 0, 0, 0, 0.05);
  b.taper(0.2, 0.06, 0.32, 0.08, 0.7, GK.SILHOUETTE);
  for (const s of [-1, 1]) {
    b.identity();
    b.limb([s * 0.17, 1.95, 0], [s * 0.34, 1.3, 0], 0.03, 0.025, GK.SILHOUETTE, 4);
    b.limb([s * 0.34, 1.3, 0], [s * 0.4, 0.7, 0], 0.025, 0.015, GK.SILHOUETTE, 4);
  }
  return b.toArrays();
}
