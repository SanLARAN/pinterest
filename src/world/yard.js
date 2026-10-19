// The way out. A fenced forestry yard by the north edge of the forest: chain-link on steel posts with barbed
// wire on top, a guard's booth, a floodlight on a pole, old tyres and drums on cracked concrete slabs — and the
// УАЗ, stripped. Its sliding gate runs on the generators' power (game/escape.js opens it); a chained swing gate
// at the back leads out through a cut in the hills, down to the highway, where sodium lamps burn all night.
//
// Everything here is the yard's own: its own RNG (the forest keeps its seed), its own frame (yard-local:
// x across, z from the forest side −d/2 to the highway side +d/2; the yard isn't rotated).
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { RNG, smoothstep } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';
import { GK, tyre } from '../ui/garageSet.js';

const PI = Math.PI;
const Y = CFG.YARD;
export const GATE = { z: -Y.d / 2 - 0.32, x0: -4.35, len: 8.8, travel: 8.65, h: 2.2, open0: -4.0, open1: 4.0 };
export const BACK = { z: Y.d / 2, half: 2.2, h: 2.0 };
export const CAR_AT = { x: 2.0, z: 3.0 }; // yard-local; nose toward the back gate
export const LAMP_AT = { x: -2.6, z: -0.9, h: 6.2 };
export const BOOTH = { x: -12.3, z: -8.5, w: 2.6, d: 2.6, h: 2.5 };
export const MOTOR_AT = { x: 5.15, z: -Y.d / 2 - 0.95 };
const POST_H = 2.45;
const MESH_H = 2.05;
const T = GK.TIN;

// chain-link: a panel of the mesh kind — the world's shader cuts the diamonds out of it (see sonar.js), so it's
// see-through, and lets light through (shadows.js). Both faces; no outline of its own
export const MESH = 50;
export function meshPanel(b, A, B, C, D) {
  b.identity();
  b.quad(A, B, C, D, MESH, 15);
  b.quad(A, D, C, B, MESH, 15);
}

// chain-link between two posts: the mesh, a top rail, the tension wire. (a0, a1: world x/z of the posts;
// g0, g1: ground heights under them, world y)
function chainPanel(b, ax, az, bx, bz, g0, g1, h = MESH_H, top = true) {
  const y0 = g0 + 0.05, y1 = g1 + 0.05;
  meshPanel(b, [ax, y0, az], [bx, y1, bz], [bx, y1 + h, bz], [ax, y0 + h, az]);
  b.identity();
  if (top) b.limb([ax, y0 + h, az], [bx, y1 + h, bz], 0.03, 0.03, T, 4);
  b.limb([ax, y0 + 0.02, az], [bx, y1 + 0.02, bz], 0.012, 0.012, T, 3); // the tension wire at the bottom
}

// a steel post with a barbed-wire arm leaning out (out = which side is outside: unit x/z)
function post(b, x, z, gy, ox, oz, h = POST_H) {
  b.place(x, gy - 0.25, z);
  b.cylinder(6, 0.06, 0.055, h + 0.25, T, { capTop: true });
  b.identity();
  b.limb([x, gy + h - 0.05, z], [x + ox * 0.36, gy + h + 0.32, z + oz * 0.36], 0.025, 0.02, T, 3);
}

// three strands of barbed wire along a run of arms, with barbs every so often
function barbs(b, ax, az, bx, bz, ga, gb, ox, oz, rng) {
  for (let k = 0; k < 3; k++) {
    const t = 0.25 + k * 0.33;
    const off = t * 0.36, up = POST_H - 0.05 + t * 0.37;
    const p0 = [ax + ox * off, ga + up, az + oz * off], p1 = [bx + ox * off, gb + up, bz + oz * off];
    b.identity();
    b.limb(p0, p1, 0.008, 0.008, T, 3);
    const len = Math.hypot(bx - ax, bz - az);
    for (let s = 0.15; s < len; s += 0.32 + rng.next() * 0.1) {
      const f = s / len;
      const c = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, p0[2] + (p1[2] - p0[2]) * f];
      b.limb([c[0] - 0.03, c[1] - 0.03, c[2] + 0.02], [c[0] + 0.03, c[1] + 0.03, c[2] - 0.02], 0.004, 0.004, T, 3);
    }
  }
}

// the sliding gate's leaf, in its own frame: its left (closing) end at x = 0, running to +x, bottom at y = 0,
// lying along the fence line (z = 0). A frame of square pipe, pickets, a diagonal, the beam that rolls.
export function buildGateLeaf(b) {
  const L = GATE.len, H = GATE.h, P = GK.GATE;
  b.place(L / 2, 0.08, 0);
  b.box(L, 0.12, 0.09, P); // the bottom beam (it rides the rollers)
  b.place(L / 2, H, 0);
  b.box(L, 0.07, 0.06, P);
  for (const x of [0.03, L - 0.03]) {
    b.place(x, 0.08, 0);
    b.box(0.07, H - 0.06, 0.07, P, { bottom: true });
  }
  b.place(L / 2, H * 0.5, 0);
  b.box(L - 0.1, 0.05, 0.05, P);
  for (let x = 0.2; x < L - 0.1; x += 0.24) {
    b.place(x, 0.14, 0);
    b.box(0.035, H - 0.17, 0.035, P, { bottom: true });
  }
  b.identity();
  b.limb([0.1, 0.2, -0.04], [L * 0.5, H - 0.1, -0.04], 0.025, 0.025, P, 4);
  b.limb([L * 0.5, H - 0.1, -0.04], [L - 0.1, 0.2, -0.04], 0.025, 0.025, P, 4);
  // a warning stripe on the leading edge, and a rusted sign plate
  for (let i = 0; i < 4; i++) {
    b.place(0.03, 0.35 + i * 0.45, 0.04);
    b.box(0.08, 0.2, 0.012, i % 2 ? GK.YELLOW : GK.DARK);
  }
  b.place(L * 0.3, 1.2, 0.045);
  b.box(0.6, 0.4, 0.012, GK.RUST);
}

// one leaf of the back gate, in its frame: hinge at the origin, the leaf running toward +x (the right leaf is
// the same mesh turned round), bottom at y = 0. A pipe frame with chain-link in it; the left one carries the
// chain and the padlock
export function buildBackLeaf(b, withLock = false) {
  const W = BACK.half, H = BACK.h;
  b.identity();
  b.limb([0, 0.08, 0], [W - 0.04, 0.08, 0], 0.03, 0.03, T, 4);
  b.limb([0, H, 0], [W - 0.04, H, 0], 0.03, 0.03, T, 4);
  b.limb([0.03, 0.06, 0], [0.03, H + 0.02, 0], 0.03, 0.03, T, 4);
  b.limb([W - 0.05, 0.06, 0], [W - 0.05, H + 0.02, 0], 0.03, 0.03, T, 4);
  // chain-link inside the frame
  meshPanel(b, [0.05, 0.1, 0], [W - 0.07, 0.1, 0], [W - 0.07, H - 0.03, 0], [0.05, H - 0.03, 0]);
  if (withLock) {
    // the chain round both leaves, and a fat padlock hanging off it
    for (let i = 0; i < 7; i++) {
      b.place(W - 0.02 + (i % 2 ? 0.05 : 0), 1.0 - i * 0.045, (i % 2 ? 0.03 : -0.03));
      b.box(0.05, 0.035, 0.012, GK.RUST, {});
    }
    b.place(W + 0.02, 0.62, 0.04);
    b.box(0.09, 0.1, 0.035, GK.RUST);
    b.identity();
    b.limb([W - 0.0, 0.67, 0.04], [W + 0.04, 0.72, 0.04], 0.008, 0.008, GK.CHROME, 3);
  }
}

// ---------------- the yard itself (static: merged into the forest's chunks) ----------------
export function buildYard(world, L) {
  const rng = new RNG(6161);
  const X = L.x, Z = L.z;
  const hw = Y.w / 2, hd = Y.d / 2;
  const gy = (lx, lz) => world.terrain.height(X + lx, Z + lz);
  const y0 = gy(0, 0);
  const col = world.col, CAPM = 3, CAPW = 2;
  // fence runs (yard-local), each with the side that's outside
  const runs = [
    { a: [-hw, -hd], b: [GATE.open0 - 0.1, -hd], o: [0, -1] },
    { a: [GATE.open1 + 0.1, -hd], b: [hw, -hd], o: [0, -1] },
    { a: [-hw, hd], b: [-BACK.half - 0.08, hd], o: [0, 1] },
    { a: [BACK.half + 0.08, hd], b: [hw, hd], o: [0, 1] },
    { a: [-hw, -hd], b: [-hw, hd], o: [-1, 0] },
    { a: [hw, -hd], b: [hw, hd], o: [1, 0] },
  ];
  world.addProp(X, Z, (b) => {
    // concrete slabs, laid long ago, a little heaved
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const lx = -hw + 0.4 + 3.9 * i + 1.95, lz = -hd + 0.4 + 2.9 * j + 1.45;
        if (lx > hw - 0.2) continue;
        b.place(X + lx, gy(lx, lz) + 0.035 + rng.float(-0.015, 0.015), Z + lz, rng.float(-0.012, 0.012), 0, rng.float(-0.012, 0.012));
        b.box(3.82, 0.09, 2.82, GK.CONCRETE);
      }
    }
    // ...and a few more out in front of the gate
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 3; i++) {
        const lx = -3 + i * 3, lz = -hd - 1.6 - j * 2.9;
        b.place(X + lx, gy(lx, lz) + 0.03, Z + lz, rng.float(-0.03, 0.03), rng.float(-0.05, 0.05), rng.float(-0.03, 0.03));
        b.box(2.9, 0.09, 2.8, GK.CONCRETE);
      }
    }
    // fence: posts every ~2.4 m, chain-link between, barbed wire over it all
    for (const r of runs) {
      const [ax, az] = r.a, [bx, bz] = r.b;
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.ceil(len / 2.45));
      for (let k = 0; k <= n; k++) {
        const f = k / n;
        const px = ax + (bx - ax) * f, pz = az + (bz - az) * f;
        post(b, X + px, Z + pz, gy(px, pz), r.o[0], r.o[1]);
        if (k < n) {
          const qx = ax + (bx - ax) * ((k + 1) / n), qz = az + (bz - az) * ((k + 1) / n);
          chainPanel(b, X + px, Z + pz, X + qx, Z + qz, gy(px, pz), gy(qx, qz));
          barbs(b, X + px, Z + pz, X + qx, Z + qz, gy(px, pz), gy(qx, qz), r.o[0], r.o[1], rng);
        }
      }
    }
    // the gate: heavy posts either side of the opening, the catcher, the roller posts, the motor
    for (const gx of [GATE.open0 - 0.12, GATE.open1 + 0.12]) {
      b.place(X + gx, gy(gx, -hd) - 0.3, Z - hd);
      b.box(0.16, POST_H + 0.4, 0.16, T, { bottom: true });
    }
    for (const rx of [GATE.open1 + 0.7, GATE.open1 + 4.6]) {
      const gz = GATE.z - 0.18;
      b.place(X + rx, gy(rx, gz), Z + gz);
      b.box(0.14, 0.45, 0.4, GK.DARK, { bottom: true }); // roller carriage
      b.place(X + rx, gy(rx, gz) - 0.3, Z + gz - 0.2);
      b.box(0.12, 1.3, 0.12, T, { bottom: true });
    }
    {
      const mx = MOTOR_AT.x, mz = MOTOR_AT.z, my = gy(mx, mz);
      b.place(X + mx, my, Z + mz);
      b.box(0.5, 0.06, 0.4, GK.CONCRETE, { bottom: true }); // its plinth
      b.place(X + mx, my + 0.06, Z + mz);
      b.box(0.34, 0.5, 0.3, GK.YELLOW, { bottom: true }); // the drive unit
      b.place(X + mx, my + 0.56, Z + mz);
      b.box(0.36, 0.04, 0.32, GK.DARK, { bottom: true });
      b.place(X + mx, my + 0.6, Z + mz);
      b.cylinder(7, 0.07, 0.06, 0.12, GK.DARK); // the beacon's base (its light is a sprite)
      b.place(X + mx, my + 0.72, Z + mz);
      b.cylinder(7, 0.06, 0.04, 0.1, GK.EMBER, { capTop: true });
      b.place(X + mx, my + 0.32, Z + mz - 0.16);
      b.box(0.2, 0.14, 0.012, KIND.BONE); // a sheet of paper taped to it
      b.identity();
      b.limb([X + mx - 0.1, my + 0.1, Z + mz + 0.1], [X + GATE.open1 + 0.5, gy(4.5, -hd) + 0.05, Z + GATE.z - 0.1], 0.012, 0.012, GK.DARK, 3); // cable
    }
    // the guard's booth: plank walls, a window toward the gate, a window to the yard, a door
    {
      const { x: bx0, z: bz0, w, d, h } = BOOTH;
      const by = gy(bx0, bz0);
      const P = (lx, ly, lz, rx = 0, ry = 0, rz = 0) => b.place(X + bx0 + lx, by + ly, Z + bz0 + lz, rx, ry, rz);
      P(0, 0.08, 0); b.box(w + 0.2, 0.16, d + 0.2, GK.CONCRETE);
      // back (−x) wall solid
      P(-w / 2, h / 2 + 0.16, 0); b.box(0.1, h, d, KIND.WOOD);
      // front (−z) wall with a window
      P(0, 0.16 + 0.5, -d / 2); b.box(w, 1.0, 0.1, KIND.WOOD);
      P(0, 0.16 + h - 0.35, -d / 2); b.box(w, 0.7, 0.1, KIND.WOOD);
      for (const sx of [-1, 1]) { P(sx * (w / 2 - 0.3), 0.16 + 1.4, -d / 2); b.box(0.6, 0.8, 0.1, KIND.WOOD); }
      // +x wall with a window onto the yard
      P(w / 2, 0.16 + 0.5, 0); b.box(0.1, 1.0, d, KIND.WOOD);
      P(w / 2, 0.16 + h - 0.35, 0); b.box(0.1, 0.7, d, KIND.WOOD);
      for (const sz of [-1, 1]) { P(w / 2, 0.16 + 1.4, sz * (d / 2 - 0.35)); b.box(0.1, 0.8, 0.7, KIND.WOOD); }
      // +z wall with the door (shut)
      P(-0.55, h / 2 + 0.16, d / 2); b.box(w - 1.1, h, 0.1, KIND.WOOD);
      P(w / 2 - 0.25, h / 2 + 0.16, d / 2); b.box(0.5, h, 0.1, KIND.WOOD);
      P(0.55, 0.16 + 2.05 + (h - 2.05) / 2, d / 2); b.box(0.6, h - 2.05, 0.1, KIND.WOOD);
      P(0.55, 0.16, d / 2 + 0.03); b.box(0.6, 2.04, 0.05, GK.DARK, { bottom: true }); // the door, shut
      P(0.33, 1.15, d / 2 + 0.07); b.box(0.03, 0.12, 0.03, GK.CHROME);
      // roof: a sheet of tin on a slope, overhanging
      P(0, h + 0.26, 0, 0, 0, 0.08); b.box(w + 0.6, 0.06, d + 0.6, GK.RUST);
      // inside: a desk under the window, a chair, a dead telephone, a kettle
      P(0, 0.16, -d / 2 + 0.4); b.box(w - 0.4, 0.75, 0.6, KIND.WOOD, { bottom: true });
      P(0.4, 0.92, -d / 2 + 0.4); b.box(0.2, 0.1, 0.16, GK.DARK);
      P(-0.5, 0.92, -d / 2 + 0.45); b.cylinder(6, 0.07, 0.08, 0.16, GK.TIN);
      P(0.1, 0.16, -d / 2 + 1.15); b.box(0.45, 0.45, 0.45, KIND.WOOD, { bottom: true });
      // the log book: a clipboard on the outside of the wall, by the door
      P(-0.75, 1.35, d / 2 + 0.07); b.box(0.28, 0.36, 0.02, GK.WOODDARK);
      P(-0.75, 1.33, d / 2 + 0.085); b.box(0.24, 0.3, 0.01, KIND.BONE);
      P(-0.75, 1.52, d / 2 + 0.09); b.box(0.12, 0.03, 0.02, GK.CHROME);
    }
    // the floodlight on its pole
    {
      const { x: lx, z: lz, h } = LAMP_AT;
      const ly = gy(lx, lz);
      b.place(X + lx, ly - 0.3, Z + lz);
      b.cylinder(6, 0.1, 0.07, h + 0.3, T, { capTop: true });
      b.place(X + lx, ly, Z + lz);
      b.box(0.3, 0.6, 0.3, GK.CONCRETE, { bottom: true });
      b.place(X + lx + 0.08, ly + 1.2, Z + lz);
      b.box(0.12, 0.3, 0.2, GK.DARK); // a switch box
      const a = Math.atan2(CAR_AT.x - lx, CAR_AT.z - lz);
      b.place(X + lx, ly + h - 0.1, Z + lz, 0, a, 0);
      b.box(0.5, 0.06, 0.06, T);
      b.place(X + lx + Math.sin(a) * 0.12, ly + h - 0.22, Z + lz + Math.cos(a) * 0.12, 0.55, a, 0);
      b.box(0.42, 0.3, 0.14, GK.DARK);
      b.place(X + lx + Math.sin(a) * 0.2, ly + h - 0.26, Z + lz + Math.cos(a) * 0.2, 0.55, a, 0);
      b.box(0.36, 0.24, 0.02, GK.HEADLAMP);
    }
    // junk: stacks of old tyres, drums, pallets, a pair of concrete blocks by the back gate, a workbench
    const tyreAt = (lx, lz, n, lean = 0) => {
      for (let i = 0; i < n; i++) {
        b.place(X + lx + rng.float(-0.05, 0.05), gy(lx, lz) + 0.13 + i * 0.25, Z + lz + rng.float(-0.05, 0.05), lean, rng.float(0, 6), 0);
        tyre(b, 0.38, 0.24, GK.RUBBER, 10, false);
      }
    };
    tyreAt(12.6, 9.1, 3);
    tyreAt(-13.4, 8.6, 2);
    b.place(X - 12.6, gy(-12.6, 9.4) + 0.38, Z + 9.5, 1.25, 0.4, 0);
    tyre(b, 0.38, 0.24, GK.RUBBER, 10, false);
    for (const [lx, lz, lying] of [[13.3, -9.3, 0], [12.4, -9.9, 0], [13.5, -7.9, 1]]) {
      b.place(X + lx, gy(lx, lz) + (lying ? 0.3 : 0), Z + lz, lying ? PI / 2 : 0, lying ? 0.6 : 0, 0);
      b.cylinder(8, 0.3, 0.3, 0.88, lying ? GK.RUST : GK.REDPAINT, { capTop: true, capBottom: true, y0: lying ? -0.44 : 0 });
    }
    const pallet = (lx, lz, y, ry) => {
      for (let i = 0; i < 5; i++) {
        b.place(X + lx + Math.cos(ry) * (-0.48 + i * 0.24), gy(lx, lz) + y + 0.13, Z + lz - Math.sin(ry) * (-0.48 + i * 0.24), 0, ry, 0);
        b.box(0.1, 0.025, 1.2, KIND.WOOD);
      }
      b.place(X + lx, gy(lx, lz) + y + 0.06, Z + lz, 0, ry, 0);
      b.box(1.2, 0.1, 1.0, KIND.WOOD);
    };
    pallet(-9.6, 9.8, 0, 0.1);
    pallet(-9.6, 9.8, 0.16, 0.25);
    pallet(9.2, 10.2, 0, -0.2);
    for (const sx of [-1, 1]) {
      b.place(X + sx * 4.4, gy(sx * 4.4, 10.4), Z + 10.4, 0, sx * 0.08, 0);
      b.box(2.4, 0.6, 0.6, GK.CONCRETE, { bottom: true });
    }
    b.place(X + 14.9, gy(14.9, 1.5), Z + 1.5, 0, PI / 2, 0);
    b.box(2.2, 0.85, 0.7, KIND.WOOD, { bottom: true }); // workbench
    b.place(X + 14.85, gy(14.9, 2.2) + 0.85, Z + 2.2);
    b.box(0.18, 0.12, 0.14, GK.DARK); // a vice
    b.place(X + 14.8, gy(14.8, 0.6) + 0.87, Z + 0.6, 0, 0.4, 0);
    b.box(0.3, 0.04, 0.05, GK.RUST); // a wrench nobody took
    // a board on two posts by the gate (the forestry's name washed off it long ago)
    b.place(X - 6.4, gy(-6.4, -hd - 1.4), Z - hd - 1.4);
    b.box(0.08, 2.0, 0.08, KIND.WOOD, { bottom: true });
    b.place(X - 4.9, gy(-4.9, -hd - 1.4), Z - hd - 1.4);
    b.box(0.08, 2.0, 0.08, KIND.WOOD, { bottom: true });
    b.place(X - 5.65, gy(-5.65, -hd - 1.4) + 1.65, Z - hd - 1.4, 0, 0, 0.04);
    b.box(1.7, 0.6, 0.05, KIND.BONE);
    b.place(X - 5.65, gy(-5.65, -hd - 1.4) + 1.45, Z - hd - 1.37, 0, 0, 0.04);
    b.box(1.6, 0.08, 0.02, GK.GATE);
  });
  // colliders: the fence runs, the gate's posts, the booth, the lamp pole, the junk, the back gate
  const CAPF = 6; // (CAP.FENCE: you can see and light through chain-link)
  for (const r of runs) col.add(X + r.a[0], Z + r.a[1], X + r.b[0], Z + r.b[1], 0.1, 2.6, CAPF);
  col.add(X - BACK.half - 0.1, Z + hd + 0.05, X + BACK.half + 0.1, Z + hd + 0.05, 0.12, 2.3, CAPF);
  {
    const { x: bx0, z: bz0, w, d } = BOOTH;
    const c = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
    for (let i = 0; i < 4; i++) col.add(X + bx0 + c[i][0], Z + bz0 + c[i][1], X + bx0 + c[(i + 1) % 4][0], Z + bz0 + c[(i + 1) % 4][1], 0.12, 2.6, CAPW);
  }
  col.circle(X + LAMP_AT.x, Z + LAMP_AT.z, 0.22, 6.2, CAPM);
  col.circle(X + MOTOR_AT.x, Z + MOTOR_AT.z, 0.3, 0.9, CAPM);
  col.circle(X + GATE.open1 + 0.7, Z + GATE.z - 0.25, 0.25, 1.3, CAPM);
  col.circle(X + GATE.open1 + 4.6, Z + GATE.z - 0.25, 0.25, 1.3, CAPM);
  col.circle(X + 12.6, Z + 9.1, 0.45, 0.9, CAPM);
  col.circle(X - 13.2, Z + 8.9, 0.6, 0.6, CAPM);
  for (const [lx, lz] of [[13.3, -9.3], [12.4, -9.9]]) col.circle(X + lx, Z + lz, 0.32, 0.9, CAPM);
  col.add(X + 13.1, Z - 7.9, X + 13.9, Z - 7.9, 0.32, 0.6, CAPM);
  col.add(X - 10.1, Z + 9.8, X - 9.1, Z + 9.8, 0.55, 0.45, CAPW);
  col.add(X + 8.7, Z + 10.2, X + 9.7, Z + 10.2, 0.55, 0.2, CAPW);
  for (const sx of [-1, 1]) col.add(X + sx * 4.4 - 1.1, Z + 10.4, X + sx * 4.4 + 1.1, Z + 10.4, 0.32, 0.6, CAPM);
  col.add(X + 14.9, Z + 0.5, X + 14.9, Z + 2.5, 0.38, 0.9, CAPW);
  // a tool locker by the workbench (game/cabinets.js: it opens)
  if (world.addCabinet) world.addCabinet('yard:locker', 'locker', X + 15.5, gy(15.5, 4.5) + 0.08, Z + 4.5, -Math.PI / 2, true);
  // the УАЗ (its body: one long capsule; the doors are where you get in — see game/escape.js)
  const car = { x: X + CAR_AT.x, z: Z + CAR_AT.z, yaw: PI / 2, y: gy(CAR_AT.x, CAR_AT.z) + 0.04 };
  col.add(car.x, car.z - 1.75, car.x, car.z + 1.75, 0.95, 1.7, CAPM);
  // the sliding gate's leaf: a capsule that moves with it (game/escape.js slides it)
  const gateCap = col.addDynamic(X + 4.4, Z + GATE.z, 9.6, 0.12, GATE.h + 0.3, CAPF);
  world.yard = {
    x: X, z: Z, y: y0, w: Y.w, d: Y.d,
    car,
    gateCap,
    lamp: { x: X + LAMP_AT.x + Math.sin(Math.atan2(CAR_AT.x - LAMP_AT.x, CAR_AT.z - LAMP_AT.z)) * 0.3, y: gy(LAMP_AT.x, LAMP_AT.z) + LAMP_AT.h - 0.35, z: Z + LAMP_AT.z + Math.cos(Math.atan2(CAR_AT.x - LAMP_AT.x, CAR_AT.z - LAMP_AT.z)) * 0.3 },
    motor: { x: X + MOTOR_AT.x, y: gy(MOTOR_AT.x, MOTOR_AT.z) + 0.78, z: Z + MOTOR_AT.z },
    sign: { x: X + MOTOR_AT.x, z: Z + MOTOR_AT.z - 0.2 },
    log: { x: X + BOOTH.x - 0.75, z: Z + BOOTH.z + BOOTH.d / 2 + 0.55 },
    front: { x: X, z: Z - Y.d / 2 }, // the middle of the gateway
  };
}

// is (x, z) inside the yard's fence (pad: grow it by that much)?
export function inYard(x, z, pad = 0) {
  return Math.abs(x - Y.x) < Y.w / 2 + pad && Math.abs(z - Y.z) < Y.d / 2 + pad;
}

// ---------------- beyond the edge: the cut, the lowland, the highway ----------------
// built as meshes of their own (outside the forest's chunks), never walked on — only seen: from the yard
// through the cut, and from the УАЗ on the way out
export function roadHeight() {
  return CFG.ROAD.y; // (down in the lowland: from the yard you look down the cut onto it)
}

// the highway's lamps stand every lampEvery metres, one of them right where the road from the cut comes in
export function lampFirst() {
  const R = CFG.ROAD;
  return Y.x - R.lampEvery * Math.floor((Y.x - R.x0) / R.lampEvery);
}

// the ground out there (and in here: the same surface the forest's chunks are built from)
export function groundAt(world, x, z) {
  const h = CFG.WORLD_HALF;
  if (Math.abs(x) <= h && Math.abs(z) <= h) return world.terrain.height(x, z);
  return outsideHeight(world, x, z);
}

function outsideHeight(world, x, z) {
  const R = CFG.ROAD;
  const raw = world.terrain.rawHeight(x, z);
  const HY = roadHeight(world);
  const m = 1 - smoothstep(7, 20, Math.abs(z - R.z));
  return raw + (HY - 0.12 - raw) * m;
}

// the УАЗ's way out, from the yard to the highway and off east along it (world x, z; the y comes from the
// ground). The road through the cut follows these too.
export function exitPath(world) {
  const X = Y.x, Z = Y.z, R = CFG.ROAD;
  // (it turns right at the highway: west, in the near lane)
  const pts = [
    [X + CAR_AT.x, Z + CAR_AT.z],
    [X + CAR_AT.x * 0.6, Z + Y.d / 2 - 2],
    [X + 0.6, Z + Y.d / 2 + 4],
    [X + 0.2, Z + Y.d / 2 + 22],
    [X - 0.4, Z + Y.d / 2 + 44],
    [X + 0.2, R.z - 14],
    [X - 1.4, R.z - 5.8],
    [X - 7, R.z - 2.5],
    [X - 16, R.z - 1.9],
    [X - 60, R.z - 1.9],
    [X - 120, R.z - 1.9],
    [X - 175, R.z - 1.9],
  ];
  return pts;
}

// a pine for the far side (no collider: nobody gets there)
function farPine(b, x, y, z, s, r) {
  const ry = r.float(0, 6.283);
  const trunkH = r.float(1.8, 3.0);
  const layers = r.chance(0.4) ? 4 : 3;
  let rr = r.float(1.7, 2.3);
  b.place(x, y - 0.3, z, r.float(-0.05, 0.05), ry, r.float(-0.05, 0.05), s);
  b.cylinder(5, 0.27, 0.12, trunkH + layers * 1.5, KIND.BARK, { capTop: false });
  let yb = trunkH;
  const ph = r.float(0, 6);
  for (let i = 0; i < layers; i++) {
    const h = 2.7 - i * 0.28;
    b.cone(7, rr, h, KIND.LEAF, { y0: yb, phase: ph + i });
    yb += h * 0.56;
    rr *= 0.73;
  }
}

// returns { meshes, lamps: [{x, y, z}] (the sodium heads, for their glow) }
export function buildOutside(world, material) {
  const R = CFG.ROAD, H = CFG.WORLD_HALF, cell = CFG.TERRAIN_CELL;
  const HY = roadHeight(world);
  const r = new RNG(5150);
  const meshes = [];
  const lamps = [];
  const X0 = R.x0, X1 = R.x1 - 2, Z0 = H, Z1 = H + 100;
  const chunk = 40;
  const pathPts = exitPath(world);
  // the gravel road through the cut: a strip along the path, from the back gate to the highway
  const road = [[Y.x + 0.8, Y.z + Y.d / 2 + 0.3]];
  for (let i = 2; i < 7; i++) {
    const [ax, az] = pathPts[i], [bx, bz] = pathPts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
    for (let k = 0; k < n; k++) road.push([ax + (bx - ax) * (k / n), az + (bz - az) * (k / n)]);
  }
  road.push(pathPts[7]);
  for (let cx = X0; cx < X1; cx += chunk) {
    const b = new MeshBuilder(30000);
    const x1 = Math.min(X1, cx + chunk);
    b.identity();
    // the land (the same grid as the forest's, so the seam at the edge closes)
    for (let z = Z0; z < Z1 - 0.01; z += cell) {
      for (let x = cx; x < x1 - 0.01; x += cell) {
        const p00 = [x, outsideHeight(world, x, z), z], p10 = [x + cell, outsideHeight(world, x + cell, z), z];
        const p01 = [x, outsideHeight(world, x, z + cell), z + cell], p11 = [x + cell, outsideHeight(world, x + cell, z + cell), z + cell];
        b.tri(p00, p01, p11, KIND.GROUND, 4);
        b.tri(p00, p11, p10, KIND.GROUND, 1);
      }
    }
    // the highway: two lanes of asphalt, gravel shoulders, lines, guard rails, lamps on arms
    for (let x = cx; x < x1 - 0.01; x += 4) {
      const xe = Math.min(x1, x + 4);
      b.identity();
      b.quadN([x, HY, R.z - 4.5], [xe, HY, R.z - 4.5], [xe, HY, R.z + 4.5], [x, HY, R.z + 4.5], [0, 1, 0], GK.CONCRETE);
      for (const s of [-1, 1]) {
        const z0 = R.z + s * 4.5, z1 = R.z + s * 6.4;
        b.quadN([x, HY, z0], [xe, HY, z0], [xe, HY - 0.1, z1], [x, HY - 0.1, z1], [0, 1, 0], KIND.ROCK);
        b.place((x + xe) / 2, HY + 0.008, R.z + s * 4.1);
        b.box(xe - x, 0.012, 0.12, KIND.BONE); // edge line
      }
    }
    for (let x = Math.ceil(cx / 9) * 9; x < x1; x += 9) {
      b.place(x + 1.5, HY + 0.008, R.z);
      b.box(3, 0.012, 0.13, KIND.BONE); // centre dashes
    }
    for (const s of [-1, 1]) {
      const zr = R.z + s * 5.7;
      for (let x = Math.ceil(cx / 4) * 4; x < x1; x += 4) {
        if (s < 0 && Math.abs(x - Y.x) < 9) continue; // (the gap where the road from the cut comes in)
        b.place(x, HY - 0.25, zr);
        b.box(0.09, 1.0, 0.12, T, { bottom: true });
        b.place(x + 2, HY + 0.6, zr + s * 0.05);
        b.box(4.02, 0.3, 0.05, T);
      }
    }
    for (let x = lampFirst(); x < R.x1; x += R.lampEvery) {
      if (x < cx || x >= x1) continue;
      const zp = R.z - 7.2;
      b.place(x, HY - 0.4, zp);
      b.cylinder(6, 0.12, 0.08, 9.2, T, { capTop: true });
      b.identity();
      b.limb([x, HY + 8.6, zp], [x, HY + 9.05, zp + 2.0], 0.05, 0.045, T, 4);
      b.limb([x, HY + 9.05, zp + 2.0], [x, HY + 8.95, zp + 4.6], 0.045, 0.04, T, 4);
      b.place(x, HY + 8.88, zp + 4.6);
      b.box(0.28, 0.12, 0.6, GK.DARK);
      b.place(x, HY + 8.81, zp + 4.6);
      b.box(0.2, 0.02, 0.46, GK.BULB);
      lamps.push({ x, y: HY + 8.7, z: zp + 4.6 });
    }
    // the gravel road down from the cut (the part past the edge)
    for (let i = 0; i < road.length - 1; i++) {
      const [ax, az] = road[i], [bx, bz] = road[i + 1];
      if (Math.max(ax, bx) < cx || Math.min(ax, bx) >= x1) continue;
      if (az < Z0 - 2 && bz < Z0 - 2) continue;
      roadQuad(b, world, ax, az, bx, bz, 2.3);
    }
    // a give-way sign where the gravel meets the asphalt, a direction sign, a kilometre post
    if (Y.x >= cx && Y.x < x1) {
      const sx = Y.x - 3.6, sz = R.z - 7.4;
      b.place(sx, HY - 0.3, sz);
      b.cylinder(5, 0.035, 0.035, 2.5, T);
      b.place(sx, HY + 2.05, sz - 0.03, -PI / 2, 0, 0);
      b.cylinder(3, 0.42, 0.42, 0.03, KIND.FLESH, { phase: -PI / 2 });
      b.place(sx, HY + 2.05, sz - 0.055, -PI / 2, 0, 0);
      b.cylinder(3, 0.3, 0.3, 0.02, KIND.BONE, { phase: -PI / 2 });
      const dx = Y.x + 7.5, dz = R.z - 8.0;
      for (const o of [-0.7, 0.7]) {
        b.place(dx + o, HY - 0.3, dz);
        b.cylinder(5, 0.04, 0.04, 3.1, T);
      }
      b.place(dx, HY + 2.35, dz - 0.04);
      b.box(1.9, 0.9, 0.04, KIND.WATER);
      b.place(dx, HY + 2.35, dz - 0.065);
      b.box(1.5, 0.05, 0.01, KIND.BONE);
      b.place(dx + 0.5, HY + 2.55, dz - 0.065);
      b.box(0.5, 0.05, 0.01, KIND.BONE);
      b.place(Y.x + 30, HY - 0.2, R.z - 6.3);
      b.box(0.14, 1.1, 0.1, KIND.BONE, { bottom: true });
    }
    // pines on the hills and beyond the road
    const nTrees = Math.round((x1 - cx) * 2.0);
    for (let i = 0; i < nTrees; i++) {
      const x = cx + r.float(0, x1 - cx), z = Z0 + 2 + r.float(0, Z1 - Z0 - 4);
      if (Math.abs(z - R.z) < 11) continue;
      if (Math.abs(x - CFG.PASS.x) < CFG.PASS.w - 1 && z < R.z) continue; // (the cut's floor stays open)
      if (!r.chance(z < R.z ? 0.75 : 0.45)) continue;
      farPine(b, x, outsideHeight(world, x, z), z, r.float(0.85, 1.3), r);
    }
    if (!b.count) continue;
    const geo = b.toGeometry();
    const mesh = new THREE.Mesh(geo, material);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    meshes.push(mesh);
  }
  // ...and the part of the cut's road inside the forest's edge (from the back gate to the edge)
  {
    const b = new MeshBuilder(4096);
    for (let i = 0; i < road.length - 1; i++) {
      const [ax, az] = road[i], [bx, bz] = road[i + 1];
      if (az >= Z0 - 2 && bz >= Z0 - 2) continue;
      roadQuad(b, world, ax, az, bx, bz, 2.3);
    }
    if (b.count) {
      const mesh = new THREE.Mesh(b.toGeometry(), material);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      meshes.push(mesh);
    }
  }
  return { meshes, lamps, HY };
}

function roadQuad(b, world, ax, az, bx, bz, hw) {
  const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1;
  const nx = -dz / l, nz = dx / l;
  const y = (x, z) => groundAt(world, x, z) + 0.05;
  const A = [ax + nx * hw, 0, az + nz * hw], B = [bx + nx * hw, 0, bz + nz * hw], C = [bx - nx * hw, 0, bz - nz * hw], D = [ax - nx * hw, 0, az - nz * hw];
  for (const p of [A, B, C, D]) p[1] = y(p[0], p[2]);
  b.identity();
  b.quadN(A, B, C, D, [0, 1, 0], KIND.ROCK);
}
