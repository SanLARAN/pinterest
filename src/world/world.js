// Procedural forest: terrain + thousands of low-poly trees + landmarks, merged into chunk meshes.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { RNG, smoothstep } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';
import { Terrain } from './terrain.js';
import { Collision } from './collision.js';

export const CAP = { TREE: 0, ROCK: 1, WOOD: 2, METAL: 3, WATER: 4, EFFIGY: 5 };

export const LANDMARKS = [
  { id: 'camp', x: 0, z: 0, r: 11 },
  { id: 'cabin', x: 58, z: -74, r: 15, ry: 0.5 },
  { id: 'tower', x: -114, z: 40, r: 12, ry: 0.3 },
  { id: 'stones', x: 98, z: 108, r: 17 },
  { id: 'wreck', x: -50, z: -118, r: 12, ry: 1.1 },
  { id: 'lake', x: 152, z: -30, r: 31 },
  { id: 'graves', x: -152, z: -60, r: 16, ry: -0.2 },
  { id: 'cabin2', x: -40, z: 170, r: 13, ry: 2.2 },
  { id: 'stones2', x: 205, z: 175, r: 14 },
  { id: 'tower2', x: 190, z: -190, r: 11, ry: 1.0 },
  { id: 'graves2', x: -210, z: 120, r: 14, ry: 0.7 },
  { id: 'wreck2', x: 30, z: -230, r: 11, ry: 0.2 },
  // the scouts' first-aid hut, a stone's throw from the camp, its door turned toward the fire.
  // (last in the list: the atlas reads the first five as the generator sites)
  { id: 'medhut', x: 12, z: 22, r: 6.5, ry: -2.606 },
];

const _m = new THREE.Matrix4();
const _l = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

function makeBase(x, y, z, ry) {
  _e.set(0, ry, 0, 'YXZ');
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(1, 1, 1));
}
function localPlace(b, base, lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _v.set(lx, ly, lz);
  _s.set(sx, sy, sz);
  _l.compose(_v, _q, _s);
  _m.multiplyMatrices(base, _l);
  b.setMatrix(_m);
}
function rot(lx, lz, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [lx * c + lz * s, -lx * s + lz * c];
}

export class World {
  constructor(scene, material) {
    this.scene = scene;
    this.material = material;
    this.seed = CFG.WORLD_SEED;
    this.half = CFG.WORLD_HALF;
    this.terrain = new Terrain(this.seed);
    this.col = new Collision(this.half, 8);
    this.meshes = [];
    this.props = []; // { cx, cz, build(b) }
    this.lake = null;
    this.spawn = { x: 0, z: 0, yaw: 0 };
    this.effigies = [];
    this.doors = []; // cabin doors (the game hangs and swings them)
    this.medhut = null; // the first-aid hut: where its cot and lantern are (see lm_medhut)
  }

  generate() {
    const t0 = performance.now();
    const rng = new RNG(this.seed);
    const rnd = () => rng.next();
    const terr = this.terrain;

    for (const L of LANDMARKS) {
      if (L.id === 'lake') {
        terr.addFlat(L.x, L.z, L.r + 8);
        terr.addBasin(L.x, L.z, L.r * 0.95, 3.6);
      } else terr.addFlat(L.x, L.z, L.r * 1.25);
    }
    terr.finalize();

    for (const L of LANDMARKS) {
      const kind = L.id.replace(/\d+$/, '');
      const fn = this['lm_' + kind];
      if (fn) fn.call(this, L, rng);
    }
    this.genSites(); // own RNG: the forest stays exactly the same

    this.genTrees(rng);
    this.genScatter(rng);
    this.buildChunks();
    this.genTime = performance.now() - t0;
    return this;
  }

  addProp(x, z, build) {
    this.props.push({ x, z, build });
  }

  inLandmark(x, z, pad = 0) {
    for (const L of LANDMARKS) {
      const dx = x - L.x, dz = z - L.z;
      if (dx * dx + dz * dz < (L.r + pad) * (L.r + pad)) return L;
    }
    return null;
  }

  // ---------------- trees ----------------
  genTrees(rng) {
    const step = 5.4;
    const half = this.half - 4;
    const noise = this.terrain.noise;
    let count = 0;
    for (let gz = -half; gz < half; gz += step) {
      for (let gx = -half; gx < half; gx += step) {
        const x = gx + rng.float(-2.1, 2.1);
        const z = gz + rng.float(-2.1, 2.1);
        if (this.inLandmark(x, z, 1)) continue;
        const dens = noise.noise(x / 70 + 40, z / 70 - 20) * 0.7 + noise.noise(x / 23, z / 23) * 0.3;
        const p = 0.12 + 0.82 * smoothstep(-0.45, 0.3, dens);
        if (!rng.chance(p)) continue;
        const y = this.terrain.height(x, z);
        const roll = rng.next();
        const s = rng.float(0.8, 1.3);
        if (roll < 0.66) this.pine(x, y, z, s, rng);
        else if (roll < 0.84) this.deadTree(x, y, z, s, rng);
        else if (roll < 0.95) this.birch(x, y, z, s, rng);
        else this.stump(x, y, z, rng);
        count++;
      }
    }
    this.treeCount = count;
  }

  pine(x, y, z, s, rng) {
    const ry = rng.float(0, 6.283), tx = rng.float(-0.05, 0.05), tz = rng.float(-0.05, 0.05);
    const trunkH = rng.float(1.8, 3.0);
    const layers = rng.chance(0.4) ? 4 : 3;
    const r0 = rng.float(1.7, 2.3);
    const ph = rng.float(0, 6);
    this.addProp(x, z, (b) => {
      b.place(x, y - 0.3, z, tx, ry, tz, s, s * rng.float(0.95, 1.05), s);
      b.cylinder(5, 0.27, 0.12, trunkH + layers * 1.5, KIND.BARK, { capTop: false });
      let yb = trunkH, r = r0;
      for (let i = 0; i < layers; i++) {
        const h = 2.7 - i * 0.28;
        b.cone(7, r, h, KIND.LEAF, { y0: yb, phase: ph + i });
        yb += h * 0.56;
        r *= 0.73;
      }
    });
    this.col.circle(x, z, 0.3 * s, 10 * s, CAP.TREE);
  }

  deadTree(x, y, z, s, rng) {
    const ry = rng.float(0, 6.283), tilt = rng.float(-0.12, 0.12);
    const h = rng.float(5, 8.5);
    const branches = [];
    const nb = rng.int(2, 5);
    for (let i = 0; i < nb; i++) {
      const by = h * rng.float(0.35, 0.85);
      const a = rng.float(0, 6.283);
      const len = rng.float(1.0, 2.6) * (1.2 - by / h);
      const up = rng.float(0.2, 0.9);
      branches.push([by, a, len, up]);
    }
    this.addProp(x, z, (b) => {
      b.place(x, y - 0.3, z, tilt, ry, tilt * 0.5, s);
      b.cylinder(5, 0.33, 0.06, h, KIND.BARK, { capTop: true });
      for (const [by, a, len, up] of branches) {
        const rr = 0.3 * (1 - by / h) + 0.05;
        const ex = Math.cos(a) * len, ez = Math.sin(a) * len;
        b.limb([Math.cos(a) * rr * 0.5, by, Math.sin(a) * rr * 0.5], [ex, by + len * up, ez], 0.09, 0.02, KIND.BARK);
        if (len > 1.6) b.limb([ex * 0.6, by + len * up * 0.6, ez * 0.6], [ex * 0.8 - ez * 0.3, by + len * up + 0.7, ez * 0.8 + ex * 0.3], 0.04, 0.01, KIND.BARK);
      }
    });
    this.col.circle(x, z, 0.32 * s, 8 * s, CAP.TREE);
    return { x, z, h: h * s };
  }

  birch(x, y, z, s, rng) {
    const ry = rng.float(0, 6.283);
    const h = rng.float(3.5, 5.0);
    const seedA = rng.next() * 1e6 | 0;
    this.addProp(x, z, (b) => {
      const r2 = new RNG(seedA);
      b.place(x, y - 0.3, z, rng.float(-0.06, 0.06), ry, 0, s);
      b.cylinder(5, 0.2, 0.12, h + 1, KIND.BARK, { capTop: false });
      b.place(x, y - 0.3 + (h + 1.2) * s, z, 0, ry, 0, s);
      b.rock(1.9, () => r2.next(), KIND.LEAF, 0.4, 0.85);
      b.place(x + 0.6 * s, y - 0.3 + (h + 0.2) * s, z + 0.4 * s, 0, ry + 1, 0, s * 0.7);
      b.rock(1.6, () => r2.next(), KIND.LEAF, 0.4, 0.8);
    });
    this.col.circle(x, z, 0.24 * s, 7 * s, CAP.TREE);
  }

  stump(x, y, z, rng) {
    const r = rng.float(0.35, 0.55);
    this.addProp(x, z, (b) => {
      b.place(x, y - 0.2, z, 0, rng.float(0, 6), 0, 1);
      b.cylinder(6, r, r * 0.85, rng.float(0.4, 0.8), KIND.BARK, { capTop: true });
    });
    this.col.circle(x, z, r, 0.7, CAP.TREE);
  }

  // ---------------- scatter ----------------
  genScatter(rng) {
    const half = this.half - 10;
    // boulders
    for (let i = 0; i < 900; i++) {
      const x = rng.float(-half, half), z = rng.float(-half, half);
      if (this.inLandmark(x, z, 2) || !this.col.free(x, z, 1.5)) continue;
      const r = rng.chance(0.15) ? rng.float(1.4, 2.6) : rng.float(0.4, 1.0);
      const y = this.terrain.height(x, z);
      const seed = (rng.next() * 1e9) | 0;
      const ry = rng.float(0, 6.28);
      this.addProp(x, z, (b) => {
        const r2 = new RNG(seed);
        b.place(x, y + r * 0.15, z, 0, ry, 0, 1);
        b.rock(r, () => r2.next(), KIND.ROCK, 0.35, 0.62);
      });
      this.col.circle(x, z, r * 0.85, r * 1.2, CAP.ROCK);
    }
    // fallen logs
    for (let i = 0; i < 260; i++) {
      const x = rng.float(-half, half), z = rng.float(-half, half);
      if (this.inLandmark(x, z, 3)) continue;
      const a = rng.float(0, 6.28), len = rng.float(3, 7);
      const x2 = x + Math.cos(a) * len, z2 = z + Math.sin(a) * len;
      if (!this.col.free(x, z, 1.0) || !this.col.free(x2, z2, 1.0) || !this.col.free((x + x2) / 2, (z + z2) / 2, 1.0)) continue;
      const y1 = this.terrain.height(x, z) + 0.25, y2 = this.terrain.height(x2, z2) + 0.25;
      const r = rng.float(0.25, 0.4);
      this.addProp(x, z, (b) => {
        b.identity();
        b.limb([x, y1, z], [x2, y2, z2], r, r * 0.8, KIND.BARK, 6);
        b.limb([x + (x2 - x) * 0.4, y1 + (y2 - y1) * 0.4 + r * 0.5, z + (z2 - z) * 0.4], [x + (x2 - x) * 0.4 + Math.sin(a) * 1.1, y1 + 1.0, z + (z2 - z) * 0.4 - Math.cos(a) * 1.1], 0.07, 0.02, KIND.BARK);
      });
      this.col.add(x, z, x2, z2, r + 0.05, 0.8, CAP.WOOD);
    }
    // effigies (stick figures) — the creepy ones are near paths & landmarks
    const effSpots = [[6, 16], [-14, 9], [11, -15], [-7, -21], [26, 4]];
    for (let i = 0; i < 70; i++) {
      const ang = rng.float(0, 6.28), dist = rng.float(40, half);
      effSpots.push([Math.cos(ang) * dist, Math.sin(ang) * dist]);
    }
    for (const [ex, ez] of effSpots) {
      if (this.inLandmark(ex, ez, 0.5) || !this.col.free(ex, ez, 0.8)) continue;
      this.effigy(ex, ez, rng);
    }
  }

  effigy(x, z, rng) {
    const y = this.terrain.height(x, z);
    const ry = rng.float(0, 6.28);
    const hang = rng.chance(0.5);
    const lean = rng.float(-0.25, 0.25);
    this.effigies.push({ x, z });
    this.addProp(x, z, (b) => {
      const base = makeBase(x, y, z, ry);
      const by = hang ? 1.6 : 0.0;
      localPlace(b, base, 0, 0, 0, 0, 0, lean);
      if (!hang) b.limb([0, 0, 0], [0, 2.4, 0], 0.05, 0.04, KIND.EFFIGY); // stake
      else {
        b.limb([0, by + 1.7, 0], [0, 4.6, 0], 0.012, 0.012, KIND.EFFIGY); // rope
        b.limb([0, 4.6, -0.4], [0, 4.6, 0.6], 0.04, 0.04, KIND.EFFIGY); // crossbar
      }
      const top = by + 1.7;
      b.limb([0, by + 0.6, 0], [0, top, 0], 0.035, 0.03, KIND.EFFIGY); // body
      b.limb([-0.55, top - 0.25, 0], [0.55, top - 0.3, 0], 0.03, 0.03, KIND.EFFIGY); // arms
      b.limb([0, by + 0.65, 0], [-0.25, by, 0.05], 0.03, 0.02, KIND.EFFIGY);
      b.limb([0, by + 0.65, 0], [0.22, by, -0.05], 0.03, 0.02, KIND.EFFIGY);
      localPlace(b, base, 0, top + 0.12, 0, 0.3, 0, lean);
      b.octa(0.14, 0.16, KIND.EFFIGY);
    });
    this.col.circle(x, z, 0.12, 2, CAP.EFFIGY);
  }

  // ---------------- landmarks ----------------
  lm_camp(L, rng) {
    const y = this.terrain.height(L.x, L.z);
    this.spawn = { x: L.x + 0.4, z: L.z + 2.5, yaw: Math.PI }; // fire at your back, forest ahead
    const r2 = new RNG(77);
    const rr = () => r2.next();
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, 0);
      // fire ring
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        localPlace(b, base, Math.cos(a) * 0.95, 0.05, Math.sin(a) * 0.95, 0, a, 0, 1);
        b.rock(0.24, rr, KIND.ROCK, 0.3, 0.7);
      }
      // charred teepee
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        localPlace(b, base, 0, 0, 0);
        b.limb([Math.cos(a) * 0.7, 0.05, Math.sin(a) * 0.7], [Math.cos(a + 2) * 0.1, 0.9, Math.sin(a + 2) * 0.1], 0.06, 0.03, KIND.WOOD);
      }
      // benches
      localPlace(b, base, 0, 0, 0);
      b.limb([-3.4, 0.3, -1.8], [-2.1, 0.3, -3.4], 0.24, 0.22, KIND.BARK, 6);
      b.limb([3.0, 0.3, -2.6], [3.6, 0.3, -0.6], 0.22, 0.22, KIND.BARK, 6);
      // collapsed tent (A-frame) near the fire
      localPlace(b, base, -4.2, 0, 2.6, 0, 0.4, 0);
      const hw = 1.1, hl = 1.2, hh = 1.2;
      const A = [-hw, 0, -hl], B = [hw, 0, -hl], C = [0, hh, -hl + 0.3], D = [-hw, 0, hl], E = [hw, 0, hl], F = [0, hh * 0.7, hl];
      b.quadN(A, D, F, C, [-1, 0.6, 0], KIND.WOOD);
      b.quadN(B, C, F, E, [1, 0.6, 0], KIND.WOOD);
      b.quadN(A, C, F, D, [1, -0.6, 0], KIND.WOOD);
      b.quadN(B, E, F, C, [-1, -0.6, 0], KIND.WOOD);
      b.triN(A, B, C, [0, 0, -1], KIND.WOOD);
      // backpack
      localPlace(b, base, 2.1, 0.3, 2.4, 0.2, 0.7, 0);
      b.box(0.45, 0.6, 0.3, KIND.WOOD);
    });
    this.col.circle(L.x, L.z, 1.05, 0.5, CAP.ROCK);
    this.col.add(L.x - 3.4, L.z - 1.8, L.x - 2.1, L.z - 3.4, 0.26, 0.6, CAP.WOOD);
    this.col.add(L.x + 3.0, L.z - 2.6, L.x + 3.6, L.z - 0.6, 0.24, 0.6, CAP.WOOD);
    const [tx, tz] = [L.x - 4.2, L.z + 2.6];
    this.col.add(tx - 0.5, tz - 1.1, tx + 0.5, tz + 1.1, 1.0, 1.2, CAP.WOOD);
  }

  lm_cabin(L, rng) {
    const y = this.terrain.height(L.x, L.z);
    const ry = L.ry || 0;
    const W = 7, D = 5.5, H = 2.7, T = 0.2;
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, ry);
      localPlace(b, base, 0, 0.1, 0);
      b.box(W + 0.4, 0.2, D + 0.4, KIND.WOOD);
      localPlace(b, base, 0, H / 2, -D / 2);
      b.box(W, H, T, KIND.WOOD);
      localPlace(b, base, -W / 2, H / 2, 0);
      b.box(T, H, D, KIND.WOOD);
      localPlace(b, base, W / 2, H / 2, 0);
      b.box(T, H, D, KIND.WOOD);
      // front wall with a door gap at x = 1.2 (width 1.4)
      const l1 = -W / 2, r1 = 0.5, l2 = 1.9, r2 = W / 2;
      localPlace(b, base, (l1 + r1) / 2, H / 2, D / 2);
      b.box(r1 - l1, H, T, KIND.WOOD);
      localPlace(b, base, (l2 + r2) / 2, H / 2, D / 2);
      b.box(r2 - l2, H, T, KIND.WOOD);
      localPlace(b, base, 1.2, H - 0.3, D / 2);
      b.box(1.4, 0.6, T, KIND.WOOD);
      // (the door itself is its own mesh: it swings — see game/doors.js)
      // gable roof, both sides visible
      const ov = 0.5, ridge = H + 1.5;
      const p = [
        [-W / 2 - ov, H - 0.15, D / 2 + ov], [W / 2 + ov, H - 0.15, D / 2 + ov],
        [W / 2 + ov, ridge, 0], [-W / 2 - ov, ridge, 0],
        [-W / 2 - ov, H - 0.15, -D / 2 - ov], [W / 2 + ov, H - 0.15, -D / 2 - ov],
      ];
      localPlace(b, base, 0, 0, 0);
      b.quadN(p[0], p[1], p[2], p[3], [0, 1, 1], KIND.WOOD);
      b.quadN(p[0], p[1], p[2], p[3], [0, -1, -1], KIND.WOOD);
      b.quadN(p[4], p[5], p[2], p[3], [0, 1, -1], KIND.WOOD);
      b.quadN(p[4], p[5], p[2], p[3], [0, -1, 1], KIND.WOOD);
      for (const sx of [-1, 1]) {
        const g = [[sx * W / 2, H, D / 2], [sx * W / 2, H, -D / 2], [sx * W / 2, ridge - 0.1, 0]];
        b.triN(g[0], g[1], g[2], [sx, 0, 0], KIND.WOOD);
      }
      localPlace(b, base, -2.2, H + 1.2, -1.2);
      b.box(0.6, 2.6, 0.6, KIND.ROCK);
      // furniture
      localPlace(b, base, -1.6, 0.2, -1.4);
      b.box(1.5, 0.8, 0.9, KIND.WOOD, { bottom: true });
      localPlace(b, base, -0.6, 0.2, -0.6, 0, 0.4, 0.5);
      b.box(0.5, 0.9, 0.5, KIND.WOOD, { bottom: true });
      localPlace(b, base, 2.3, 0.2, -1.6);
      b.box(1.0, 0.5, 2.0, KIND.WOOD, { bottom: true });
      // porch posts + fence remains
      for (let i = 0; i < 7; i++) {
        const fx = -W / 2 - 2 + i * 1.9;
        localPlace(b, base, fx, 0, D / 2 + 3.2, rng.float(-0.2, 0.2), 0, rng.float(-0.2, 0.2));
        b.cylinder(4, 0.07, 0.06, rng.float(0.8, 1.2), KIND.WOOD, { capTop: true });
      }
    });
    const seg = (ax, az, bx, bz) => {
      const [x1, z1] = rot(ax, az, ry), [x2, z2] = rot(bx, bz, ry);
      this.col.add(L.x + x1, L.z + z1, L.x + x2, L.z + z2, T, H, CAP.WOOD);
    };
    seg(-W / 2, -D / 2, W / 2, -D / 2);
    seg(-W / 2, -D / 2, -W / 2, D / 2);
    seg(W / 2, -D / 2, W / 2, D / 2);
    seg(-W / 2, D / 2, 0.5, D / 2);
    seg(1.9, D / 2, W / 2, D / 2);
    seg(-2.3, -1.4, -0.9, -1.4);
    seg(2.3, -2.4, 2.3, -0.8);
    // a plank door on strap hinges at the right jamb, swinging either way. hinge (hx, hz) and everything
    // else in cabin-local metres
    if (this.doors) this.doors.push({ id: L.id, x: L.x, z: L.z, y: y + 0.21, ry, hx: 1.92, hz: D / 2, w: 1.42, h: 1.95, W, D, gap: [0.5, 1.9] });
  }

  // the scouts' first-aid hut: a plank hut under a gable roof, a red cross over the door, a battery lantern
  // by it that still works. Inside, along the back wall, a cot — the one place a fallen friend can be
  // brought back. Its own RNG: adding it moved no other landmark.
  lm_medhut(L) {
    const y = this.terrain.height(L.x, L.z);
    const ry = L.ry || 0;
    const r = new RNG(911);
    const W = 4.6, D = 3.8, H = 2.4, T = 0.16;
    const g0 = -0.7, g1 = 0.7; // the doorway
    const cot = { x: -1.05, z: -D / 2 + 0.52, len: 1.95, wid: 0.68, top: 0.62 }; // hut-local, along x
    const lamp = { x: 1.2, y: 2.12, z: D / 2 + 0.3 };
    const lampIn = { x: -0.55, y: 2.0, z: -0.3 }; // a camping lantern hung from the ridge, over the cot's foot
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, ry);
      const P = (lx, ly, lz, rx = 0, ryy = 0, rz = 0, sx = 1, sy = sx, sz = sx) => localPlace(b, base, lx, ly, lz, rx, ryy, rz, sx, sy, sz);
      // floor on a low frame, a step up to the door
      P(0, 0.1, 0);
      b.box(W + 0.3, 0.2, D + 0.3, KIND.WOOD);
      P((g0 + g1) / 2, 0.06, D / 2 + 0.42);
      b.box(1.5, 0.12, 0.5, KIND.WOOD);
      // walls: back, sides, the front around the doorway, a lintel over it
      P(0, H / 2, -D / 2);
      b.box(W, H, T, KIND.WOOD);
      for (const sx of [-1, 1]) {
        // a small window in each side wall
        const wz0 = -0.45, wz1 = 0.45, wy0 = 1.05, wy1 = 1.6;
        P(sx * W / 2, wy0 / 2, 0);
        b.box(T, wy0, D, KIND.WOOD);
        P(sx * W / 2, (wy1 + H) / 2, 0);
        b.box(T, H - wy1, D, KIND.WOOD);
        P(sx * W / 2, (wy0 + wy1) / 2, (-D / 2 + wz0) / 2);
        b.box(T, wy1 - wy0, wz0 + D / 2, KIND.WOOD);
        P(sx * W / 2, (wy0 + wy1) / 2, (D / 2 + wz1) / 2);
        b.box(T, wy1 - wy0, D / 2 - wz1, KIND.WOOD);
        P(sx * (W / 2 + 0.03), (wy0 + wy1) / 2, 0);
        b.box(0.05, 0.05, wz1 - wz0, KIND.WOOD); // the cross bar of the frame
      }
      P((-W / 2 + g0) / 2, H / 2, D / 2);
      b.box(g0 + W / 2, H, T, KIND.WOOD);
      P((W / 2 + g1) / 2, H / 2, D / 2);
      b.box(W / 2 - g1, H, T, KIND.WOOD);
      P((g0 + g1) / 2, (2.12 + H) / 2, D / 2);
      b.box(g1 - g0, H - 2.12, T, KIND.WOOD);
      // gable roof, ridge along the hut
      const ov = 0.35, ridge = H + 1.05, eave = H - 0.1;
      const q = [
        [-W / 2 - ov, eave, D / 2 + ov], [W / 2 + ov, eave, D / 2 + ov],
        [W / 2 + ov, ridge, 0], [-W / 2 - ov, ridge, 0],
        [-W / 2 - ov, eave, -D / 2 - ov], [W / 2 + ov, eave, -D / 2 - ov],
      ];
      P(0, 0, 0);
      b.quadN(q[0], q[1], q[2], q[3], [0, 1, 1], KIND.WOOD);
      b.quadN(q[0], q[1], q[2], q[3], [0, -1, -1], KIND.WOOD);
      b.quadN(q[4], q[5], q[2], q[3], [0, 1, -1], KIND.WOOD);
      b.quadN(q[4], q[5], q[2], q[3], [0, -1, 1], KIND.WOOD);
      for (const sx of [-1, 1]) {
        const gt = [[sx * W / 2, H, D / 2], [sx * W / 2, H, -D / 2], [sx * W / 2, ridge - 0.08, 0]];
        b.triN(gt[0], gt[1], gt[2], [sx, 0, 0], KIND.WOOD);
      }
      // a white board with a red cross over the door
      P(0, H + 0.42, D / 2 + 0.1);
      b.box(0.72, 0.62, 0.04, KIND.BONE);
      P(0, H + 0.42, D / 2 + 0.13);
      b.box(0.46, 0.13, 0.03, KIND.FLESH);
      P(0, H + 0.42, D / 2 + 0.13);
      b.box(0.13, 0.46, 0.03, KIND.FLESH);
      // the lantern on its bracket
      P(lamp.x, lamp.y + 0.28, D / 2 + 0.02);
      b.box(0.05, 0.05, 0.36, KIND.METAL);
      P(lamp.x, lamp.y + 0.07, lamp.z);
      b.limb([0, 0.2, 0], [0, 0.1, 0], 0.008, 0.008, KIND.METAL, 3);
      P(lamp.x, lamp.y - 0.12, lamp.z);
      b.box(0.15, 0.04, 0.15, KIND.METAL);
      P(lamp.x, lamp.y + 0.1, lamp.z);
      b.box(0.15, 0.04, 0.15, KIND.METAL);
      for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P(lamp.x + cx * 0.065, lamp.y - 0.1, lamp.z + cz * 0.065);
        b.cylinder(3, 0.008, 0.008, 0.2, KIND.METAL);
      }
      // inside, from the ridge beam: a camping lantern on a wire
      P(lampIn.x, 0, lampIn.z);
      b.limb([0, ridge - 0.12, 0], [0, lampIn.y + 0.16, 0], 0.011, 0.011, KIND.METAL, 3);
      P(lampIn.x, lampIn.y + 0.1, lampIn.z);
      b.cylinder(6, 0.075, 0.05, 0.06, KIND.METAL, { capBottom: true });
      P(lampIn.x, lampIn.y - 0.14, lampIn.z);
      b.cylinder(6, 0.08, 0.08, 0.04, KIND.METAL, { capBottom: true });
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        P(lampIn.x + Math.cos(a) * 0.07, lampIn.y - 0.1, lampIn.z + Math.sin(a) * 0.07);
        b.cylinder(3, 0.006, 0.006, 0.2, KIND.METAL);
      }
      P(0, 0, 0);
      b.limb([-W / 2, ridge - 0.12, 0], [W / 2, ridge - 0.12, 0], 0.05, 0.05, KIND.WOOD, 4); // the ridge beam
      // inside: the cot along the back wall — a wooden frame, old canvas, a pillow, an army blanket
      const cx0 = cot.x, cz0 = cot.z, hl = cot.len / 2, hw = cot.wid / 2;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P(cx0 + sx * (hl - 0.06), 0.2, cz0 + sz * (hw - 0.04), sz * 0.12, 0, 0);
        b.cylinder(4, 0.03, 0.03, cot.top - 0.2, KIND.WOOD);
      }
      for (const sz of [-1, 1]) {
        P(cx0, cot.top - 0.03, cz0 + sz * hw);
        b.box(cot.len, 0.06, 0.06, KIND.WOOD);
      }
      P(cx0, cot.top - 0.02, cz0);
      b.box(cot.len - 0.12, 0.035, cot.wid - 0.04, KIND.BONE);
      P(cx0 - hl + 0.28, cot.top + 0.05, cz0, 0, 0.08, 0);
      b.box(0.36, 0.1, 0.5, KIND.BONE);
      P(cx0 + hl - 0.32, cot.top + 0.05, cz0 + 0.02, 0, -0.1, 0);
      b.box(0.42, 0.1, cot.wid - 0.08, KIND.LEAF);
      // a stool and a wash basin by the cot
      P(cx0 + hl + 0.42, 0.2, cz0 + 0.55);
      b.cylinder(6, 0.17, 0.15, 0.04, KIND.WOOD, { y0: 0.4 });
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        P(cx0 + hl + 0.42 + Math.cos(a) * 0.1, 0.2, cz0 + 0.55 + Math.sin(a) * 0.1, Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
        b.cylinder(3, 0.02, 0.02, 0.42, KIND.WOOD);
      }
      P(cx0 + hl + 0.42, 0.64, cz0 + 0.55);
      b.cylinder(7, 0.11, 0.15, 0.08, KIND.METAL, { capTop: false, capBottom: true });
      // the first-aid cabinet on the right wall, a red cross on its door; a shelf of jars and rolled bandages
      P(W / 2 - T / 2 - 0.12, 1.45, -0.55);
      b.box(0.22, 0.72, 0.6, KIND.BONE);
      P(W / 2 - T / 2 - 0.24, 1.45, -0.55);
      b.box(0.02, 0.1, 0.34, KIND.FLESH);
      P(W / 2 - T / 2 - 0.24, 1.45, -0.55);
      b.box(0.02, 0.34, 0.1, KIND.FLESH);
      P(W / 2 - T / 2 - 0.12, 1.02, 0.55);
      b.box(0.24, 0.03, 0.9, KIND.WOOD);
      for (let i = 0; i < 5; i++) {
        P(W / 2 - T / 2 - 0.12 + r.float(-0.04, 0.04), 1.035, 0.2 + i * 0.17 + r.float(-0.03, 0.03));
        if (i % 2) b.cylinder(6, 0.045, 0.045, r.float(0.07, 0.11), KIND.BONE, { phase: r.next() });
        else b.cylinder(5, 0.035, 0.03, r.float(0.12, 0.17), i === 2 ? KIND.WATER : KIND.METAL);
      }
      // a stretcher leans on the outside of the left wall
      P(-W / 2 - 0.32, 0, 0.2, 0, 0, -0.22);
      b.limb([0, 0, -0.32], [0, 2.1, -0.32], 0.025, 0.025, KIND.WOOD, 4);
      b.limb([0, 0, 0.32], [0, 2.1, 0.32], 0.025, 0.025, KIND.WOOD, 4);
      P(-W / 2 - 0.32, 1.05, 0.2, 0, 0, -0.22);
      b.box(0.02, 1.5, 0.6, KIND.BONE);
      // the scouts' flag: a bare pole and what is left of their pennant
      const fx = -W / 2 - 1.1, fz = D / 2 + 1.0;
      P(fx, 0, fz);
      b.cylinder(5, 0.05, 0.035, 4.4, KIND.WOOD, { capTop: true });
      P(fx, 0, fz);
      const p0 = [0.04, 4.25, 0], p1 = [0.04, 3.7, 0], p2 = [0.95, 3.9, 0.12];
      b.triN(p0, p1, p2, [0, 0, 1], KIND.FLESH);
      b.triN(p0, p1, p2, [0, 0, -1], KIND.FLESH);
      for (const lx of [-0.5, 0.5]) {
        P(fx + lx * 0.6, 0, fz + 0.25, r.float(-0.15, 0.15), 0, r.float(-0.15, 0.15));
        b.rock(0.12, () => r.next(), KIND.ROCK, 0.3, 0.6);
      }
    });
    const seg = (ax, az, bx, bz, rad = T, h = H) => {
      const [x1, z1] = rot(ax, az, ry), [x2, z2] = rot(bx, bz, ry);
      this.col.add(L.x + x1, L.z + z1, L.x + x2, L.z + z2, rad, h, CAP.WOOD);
    };
    seg(-W / 2, -D / 2, W / 2, -D / 2);
    seg(-W / 2, -D / 2, -W / 2, D / 2);
    seg(W / 2, -D / 2, W / 2, D / 2);
    seg(-W / 2, D / 2, g0, D / 2);
    seg(g1, D / 2, W / 2, D / 2);
    seg(cot.x - cot.len / 2 + 0.25, cot.z, cot.x + cot.len / 2 - 0.25, cot.z, 0.3, 0.7); // the cot
    {
      const [fx, fz] = rot(-W / 2 - 1.1, D / 2 + 1.0, ry);
      this.col.circle(L.x + fx, L.z + fz, 0.12, 4, CAP.WOOD);
    }
    if (this.doors) this.doors.push({ id: L.id, x: L.x, z: L.z, y: y + 0.21, ry, hx: g1 + 0.02, hz: D / 2, w: g1 - g0 + 0.02, h: 1.95, W, D, gap: [g0, g1] });
    // for the game: where the cot is (and which way it lies), where to stand at it, where the lantern hangs
    const at = (lx, lz) => {
      const [wx, wz] = rot(lx, lz, ry);
      return { x: L.x + wx, z: L.z + wz };
    };
    const c = at(cot.x, cot.z);
    const side = at(cot.x, cot.z + 0.95); // in front of it, in the room
    const l = at(lamp.x, lamp.z);
    const li = at(lampIn.x, lampIn.z);
    const head = at(cot.x - cot.len / 2, cot.z);
    this.medhut = {
      x: L.x, z: L.z, y, ry, W, D,
      cot: { x: c.x, z: c.z, y: y + cot.top, yaw: Math.atan2(head.x - c.x, head.z - c.z), len: cot.len },
      stand: { x: side.x, z: side.z, yaw: Math.atan2(-(c.x - side.x), -(c.z - side.z)) },
      lamp: { x: l.x, y: y + lamp.y, z: l.z },
      lampIn: { x: li.x, y: y + lampIn.y, z: li.z },
      door: at((g0 + g1) / 2, D / 2 + 1.0),
    };
  }

  lm_tower(L, rng) {
    const y = this.terrain.height(L.x, L.z);
    const ry = L.ry || 0;
    const H = 30, b0 = 2.6, b1 = 0.55;
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, ry);
      localPlace(b, base, 0, 0, 0);
      const leg = (sx, sz, t) => [sx * (b0 + (b1 - b0) * t), H * t - 0.2, sz * (b0 + (b1 - b0) * t)];
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [sx, sz] of corners) b.limb(leg(sx, sz, 0), leg(sx, sz, 1), 0.13, 0.07, KIND.METAL);
      const levels = 8;
      for (let k = 1; k <= levels; k++) {
        const t0 = (k - 1) / levels, t1 = k / levels;
        for (let c = 0; c < 4; c++) {
          const [ax, az] = corners[c], [bx, bz] = corners[(c + 1) % 4];
          b.limb(leg(ax, az, t1), leg(bx, bz, t1), 0.04, 0.04, KIND.METAL, 3);
          b.limb(leg(ax, az, t0), leg(bx, bz, t1), 0.03, 0.03, KIND.METAL, 3);
          if (k % 2 === 0) b.limb(leg(bx, bz, t0), leg(ax, az, t1), 0.03, 0.03, KIND.METAL, 3);
        }
      }
      localPlace(b, base, 0, H, 0);
      b.box(1.8, 0.15, 1.8, KIND.METAL);
      localPlace(b, base, 0, H, 0);
      b.limb([0, 0, 0], [0, 6, 0], 0.06, 0.02, KIND.METAL);
      localPlace(b, base, 0.7, H + 1.5, 0, 0, 0, -1.2);
      b.cone(8, 0.6, 0.3, KIND.METAL);
      localPlace(b, base, -0.6, H + 2.5, 0.3, 1.1, 0.4, 0);
      b.cone(8, 0.5, 0.25, KIND.METAL);
      // generator shack
      localPlace(b, base, 5.2, 0, 2.5, 0, 0.1, 0);
      b.box(2.4, 2.2, 2.0, KIND.METAL, { bottom: true });
      localPlace(b, base, 5.2, 2.25, 2.5, 0.08, 0.1, 0);
      b.box(2.8, 0.1, 2.4, KIND.METAL);
      // fuel barrels
      for (let i = 0; i < 3; i++) {
        localPlace(b, base, 2.6 + i * 0.75, 0, 4.4 + (i % 2) * 0.3, 0, 0, i === 2 ? 1.5 : 0);
        b.cylinder(7, 0.3, 0.3, 0.9, KIND.METAL, { capTop: true, y0: i === 2 ? -0.3 : 0 });
      }
    });
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const [x, z] = rot(sx * b0, sz * b0, ry);
      this.col.circle(L.x + x, L.z + z, 0.25, H, CAP.METAL);
    }
    const [sx, sz] = rot(5.2, 2.5, ry);
    this.col.circle(L.x + sx, L.z + sz, 1.45, 2.2, CAP.METAL);
    const [bx, bz] = rot(3.3, 4.5, ry);
    this.col.add(L.x + bx - 0.8, L.z + bz, L.x + bx + 0.8, L.z + bz, 0.4, 0.9, CAP.METAL);
  }

  lm_stones(L, rng) {
    const y = this.terrain.height(L.x, L.z);
    const n = L.r > 15 ? 9 : 7;
    const R = L.r * 0.5;
    const stones = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng.float(-0.1, 0.1);
      const fallen = rng.chance(0.18);
      stones.push({ a, h: rng.float(2.2, 3.4), fallen, tilt: rng.float(-0.12, 0.12) });
    }
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, 0);
      for (const s of stones) {
        const sx = Math.cos(s.a) * R, sz = Math.sin(s.a) * R;
        if (s.fallen) {
          localPlace(b, base, sx, 0.35, sz, Math.PI / 2 - 0.1, -s.a + Math.PI / 2, 0);
          b.taper(1.1, 0.7, 0.8, 0.5, s.h, KIND.ROCK);
        } else {
          localPlace(b, base, sx, -0.2, sz, s.tilt, -s.a + Math.PI / 2, s.tilt * 0.5);
          b.taper(1.15, 0.7, 0.75, 0.45, s.h, KIND.ROCK);
        }
      }
      localPlace(b, base, 0, 0, 0, 0, 0.3, 0);
      b.box(2.4, 0.85, 1.3, KIND.ROCK, { bottom: true });
      localPlace(b, base, 0, 0.9, 0, 0, 0.3, 0);
      b.octa(0.25, 0.32, KIND.EFFIGY);
    });
    for (const s of stones) {
      const sx = L.x + Math.cos(s.a) * R, sz = L.z + Math.sin(s.a) * R;
      this.col.circle(sx, sz, 0.75, s.fallen ? 0.8 : s.h, CAP.ROCK);
    }
    this.col.add(L.x - 1.1, L.z - 0.35, L.x + 1.1, L.z + 0.35, 0.7, 0.9, CAP.ROCK);
  }

  lm_wreck(L, rng) {
    const y = this.terrain.height(L.x, L.z);
    const ry = L.ry || 0;
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, ry);
      const tiltBase = base.clone().multiply(new THREE.Matrix4().makeRotationX(0.12)).multiply(new THREE.Matrix4().makeRotationZ(-0.05));
      localPlace(b, tiltBase, 0, 0.78, 0);
      b.box(4.4, 0.75, 1.85, KIND.METAL);
      localPlace(b, tiltBase, -0.25, 1.15, 0);
      b.taper(2.5, 1.75, 1.6, 1.45, 0.72, KIND.METAL, 0, 0.2);
      for (const [wx, wz, gone] of [[-1.4, -0.95, false], [1.4, -0.95, false], [-1.4, 0.95, true], [1.4, 0.95, false]]) {
        if (gone) continue;
        localPlace(b, tiltBase, wx, 0.38, wz, Math.PI / 2, 0, 0);
        b.cylinder(8, 0.38, 0.38, 0.24, KIND.METAL, { capTop: true, capBottom: true, y0: -0.12 });
      }
      localPlace(b, tiltBase, 0.3, 0.95, 1.35, 0, 0.9, 0);
      b.box(1.1, 0.9, 0.07, KIND.METAL);
      // scattered tires + barrel
      localPlace(b, base, 3.4, 0.12, 1.8, 0, 0, 0);
      b.cylinder(8, 0.4, 0.4, 0.25, KIND.METAL, { capTop: true });
      localPlace(b, base, -3.2, 0, -2.2, 0, 0, 0.3);
      b.cylinder(7, 0.3, 0.3, 0.9, KIND.METAL, { capTop: true });
      // road posts
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        localPlace(b, base, i * 4.2, 0, -3.6, rng.float(-0.25, 0.25), 0, rng.float(-0.2, 0.2));
        b.box(0.14, 1.1, 0.14, KIND.WOOD, { bottom: true });
      }
    });
    const [x1, z1] = rot(-1.9, 0, ry), [x2, z2] = rot(1.9, 0, ry);
    this.col.add(L.x + x1, L.z + z1, L.x + x2, L.z + z2, 0.95, 1.6, CAP.METAL);
    const [tx, tz] = rot(3.4, 1.8, ry);
    this.col.circle(L.x + tx, L.z + tz, 0.4, 0.3, CAP.METAL);
    const [bx, bz] = rot(-3.2, -2.2, ry);
    this.col.circle(L.x + bx, L.z + bz, 0.35, 0.9, CAP.METAL);
  }

  lm_lake(L, rng) {
    const flat = this.terrain.flats.find((f) => f.x === L.x && f.z === L.z);
    const wy = (flat ? flat.h : this.terrain.height(L.x, L.z)) - 0.85;
    this.lake = { x: L.x, z: L.z, r: L.r - 3.5, y: wy };
    this.addProp(L.x, L.z, (b) => {
      b.identity();
      const segs = 40, rings = 5, R = L.r - 1.0;
      for (let k = 0; k < rings; k++) {
        const ra = (k / rings) * R, rb = ((k + 1) / rings) * R;
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
          const p0 = [L.x + Math.cos(a0) * ra, wy, L.z + Math.sin(a0) * ra];
          const p1 = [L.x + Math.cos(a1) * ra, wy, L.z + Math.sin(a1) * ra];
          const q0 = [L.x + Math.cos(a0) * rb, wy, L.z + Math.sin(a0) * rb];
          const q1 = [L.x + Math.cos(a1) * rb, wy, L.z + Math.sin(a1) * rb];
          if (k === 0) b.triN(p0, q0, q1, [0, 1, 0], KIND.WATER, 5);
          else {
            // hide radial edges, keep concentric rings (ripple look)
            b.triN(p0, q0, q1, [0, 1, 0], KIND.WATER, 4 | 1);
            b.triN(p0, q1, p1, [0, 1, 0], KIND.WATER, 1 | 2);
          }
        }
      }
      // dock on the west shore
      const dx0 = L.x - L.r - 3, dx1 = L.x - L.r + 9;
      for (let x = dx0; x < dx1; x += 0.55) {
        b.place(x, wy + 0.45, L.z, 0, 0, (Math.sin(x * 7) * 0.05), 1);
        b.box(0.45, 0.08, 2.0, KIND.WOOD);
      }
      for (let x = dx0 + 1; x < dx1; x += 2.4) {
        for (const sz of [-0.9, 0.9]) {
          b.place(x, wy - 1.2, L.z + sz, 0, 0, 0, 1);
          b.cylinder(5, 0.09, 0.09, 1.9, KIND.WOOD, { capTop: true });
        }
      }
      // a small rowboat, half sunk
      b.place(L.x + 6, wy - 0.15, L.z + 8, 0.25, 0.8, 0.1, 1);
      b.taper(0.6, 2.6, 1.2, 3.0, 0.6, KIND.WOOD);
    });
    this.col.circle(L.x, L.z, L.r - 3.5, 0, CAP.WATER);
  }

  lm_graves(L, rng) {
    const y = this.terrain.height(L.x, L.z);
    const ry = L.ry || 0;
    const items = [];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 5; i++) {
        if (rng.chance(0.2)) continue;
        items.push({ lx: -6 + i * 3 + rng.float(-0.4, 0.4), lz: -4 + row * 3.5 + rng.float(-0.3, 0.3), cross: rng.chance(0.55), tx: rng.float(-0.25, 0.25), tz: rng.float(-0.2, 0.2) });
      }
    }
    const fence = [];
    const FW = 10, FD = 7.5;
    const perim = [[-FW, -FD], [FW, -FD], [FW, FD], [-FW, FD]];
    for (let s = 0; s < 4; s++) {
      const [ax, az] = perim[s], [bx, bz] = perim[(s + 1) % 4];
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.floor(len / 2.2);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        if (s === 2 && t > 0.4 && t < 0.6) continue; // gate gap
        fence.push({ lx: ax + (bx - ax) * t, lz: az + (bz - az) * t, rail: k < n && rng.chance(0.7) && !(s === 2 && t >= 0.3 && t < 0.6), nx: ax + (bx - ax) * ((k + 1) / n), nz: az + (bz - az) * ((k + 1) / n), tilt: rng.float(-0.2, 0.2) });
      }
    }
    this.addProp(L.x, L.z, (b) => {
      const base = makeBase(L.x, y, L.z, ry);
      for (const it of items) {
        if (it.cross) {
          localPlace(b, base, it.lx, -0.1, it.lz, it.tx, 0, it.tz);
          b.box(0.13, 1.5, 0.13, KIND.WOOD, { bottom: true });
          localPlace(b, base, it.lx, 1.0, it.lz, it.tx, 0, it.tz);
          b.box(0.8, 0.12, 0.12, KIND.WOOD);
        } else {
          localPlace(b, base, it.lx, -0.1, it.lz, it.tx, 0, it.tz);
          b.taper(0.75, 0.22, 0.6, 0.18, 1.0, KIND.ROCK);
        }
      }
      for (const f of fence) {
        localPlace(b, base, f.lx, 0, f.lz, f.tilt, 0, f.tilt * 0.5);
        b.box(0.12, 1.2, 0.12, KIND.WOOD, { bottom: true });
        if (f.rail) {
          localPlace(b, base, 0, 0, 0);
          b.limb([f.lx, 0.9, f.lz], [f.nx, 0.85, f.nz], 0.04, 0.04, KIND.WOOD, 3);
          b.limb([f.lx, 0.45, f.lz], [f.nx, 0.5, f.nz], 0.04, 0.04, KIND.WOOD, 3);
        }
      }
    });
    for (const it of items) {
      const [x, z] = rot(it.lx, it.lz, ry);
      this.col.circle(L.x + x, L.z + z, it.cross ? 0.18 : 0.38, 1.2, it.cross ? CAP.WOOD : CAP.ROCK);
    }
    for (const f of fence) {
      const [x, z] = rot(f.lx, f.lz, ry);
      if (f.rail) {
        const [x2, z2] = rot(f.nx, f.nz, ry);
        this.col.add(L.x + x, L.z + z, L.x + x2, L.z + z2, 0.12, 1.2, CAP.WOOD);
      } else this.col.circle(L.x + x, L.z + z, 0.12, 1.2, CAP.WOOD);
    }
    // great dead tree in the middle with hanging effigies
    const [tx, tz] = rot(0, 0.5, ry);
    const ty = this.terrain.height(L.x + tx, L.z + tz);
    this.deadTree(L.x + tx, ty, L.z + tz, 1.5, rng);
    this.effigy(L.x + tx + 1.3, L.z + tz + 0.5, rng);
  }

  // ---------------- generators ----------------
  // Five generator sites: the camp + four landmarks. Each one gets a clear spot for the generator
  // (with a lamp post), a spot nearby for the body of whoever tried to fix it, and colliders.
  genSites() {
    const rng = new RNG(4242);
    this.sites = [];
    const ids = ['camp', ...CFG.GEN_SITES];
    for (const id of ids) {
      const L = LANDMARKS.find((l) => l.id === id);
      let gx, gz, cx, cz;
      if (id === 'camp') {
        // in plain view from where you wake up; the body lies between you and it
        gx = L.x - 3.8; gz = L.z + 7.4;
        cx = L.x - 1.5; cz = L.z + 5.3;
      } else {
        const g = this._freeSpot(L.x, L.z, 4, L.r - 2.5, 2.1, rng);
        gx = g.x; gz = g.z;
        const c = this._freeSpot(gx, gz, 2.8, 4.6, 1.0, rng, L);
        cx = c.x; cz = c.z;
      }
      const yaw = Math.atan2(L.x - gx, L.z - gz) + (id === 'camp' ? 0 : rng.float(-0.5, 0.5));
      const gy = this.terrain.height(gx, gz);
      const [px, pz] = rot(0.78, -0.32, yaw);
      const [hx, hz] = rot(0.78 + 0.42, -0.32, yaw);
      const site = {
        id, x: gx, z: gz, y: gy, yaw,
        lamp: { x: gx + hx, y: gy + 3.0, z: gz + hz },
        corpse: { x: cx, z: cz, yaw: Math.atan2(gx - cx, gz - cz) + rng.float(-0.6, 0.6), seed: rng.int(1, 1e6) },
      };
      this.sites.push(site);
      this.genProp(site);
      const [ax, az] = rot(-0.5, 0, yaw), [bx, bz] = rot(0.5, 0, yaw);
      this.col.add(gx + ax, gz + az, gx + bx, gz + bz, 0.48, 1.2, CAP.METAL);
      this.col.circle(gx + px, gz + pz, 0.1, 3.2, CAP.METAL);
    }
  }

  _freeSpot(ox, oz, minR, maxR, clear, rng, inside = null) {
    const a0 = rng.float(0, Math.PI * 2);
    for (let r = minR; r <= maxR; r += 0.6) {
      for (let k = 0; k < 20; k++) {
        const a = a0 + (k / 20) * Math.PI * 2;
        const x = ox + Math.cos(a) * r, z = oz + Math.sin(a) * r;
        if (inside && Math.hypot(x - inside.x, z - inside.z) > inside.r - 1) continue;
        if (this.col.free(x, z, clear)) return { x, z };
      }
    }
    return { x: ox + minR, z: oz };
  }

  // a battered portable generator on skids, with a work lamp on a pole
  genProp(s) {
    this.addProp(s.x, s.z, (b) => {
      const base = makeBase(s.x, s.y, s.z, s.yaw);
      const M = KIND.METAL;
      localPlace(b, base, 0, 0, 0);
      for (const z of [-0.3, 0.3]) b.limb([-0.68, 0.06, z], [0.68, 0.06, z], 0.045, 0.045, M, 4); // skids
      localPlace(b, base, 0, 0.12, 0);
      b.box(1.12, 0.6, 0.6, M, { bottom: true }); // engine housing
      localPlace(b, base, 0.05, 0.72, 0);
      b.box(0.86, 0.24, 0.48, M, { bottom: true }); // fuel tank
      localPlace(b, base, 0.3, 0.96, 0.05);
      b.cylinder(6, 0.06, 0.06, 0.06, M); // filler cap
      localPlace(b, base, 0.3, 0.42, 0.31, Math.PI / 2, 0, 0);
      b.cylinder(8, 0.2, 0.2, 0.08, M); // flywheel cover
      localPlace(b, base, -0.33, 0.46, 0.31);
      b.box(0.34, 0.26, 0.04, KIND.WOOD); // control panel
      localPlace(b, base, 0, 0, 0);
      // roll cage
      for (const [x, z] of [[-0.62, -0.34], [0.62, -0.34], [-0.62, 0.34], [0.62, 0.34]]) b.limb([x, 0.06, z], [x, 0.98, z], 0.025, 0.025, M, 4);
      for (const z of [-0.34, 0.34]) b.limb([-0.62, 0.98, z], [0.62, 0.98, z], 0.025, 0.025, M, 4);
      b.limb([-0.48, 0.72, -0.18], [-0.52, 1.28, -0.22], 0.045, 0.04, M, 5); // exhaust
      // lamp pole + head
      const px = 0.78, pz = -0.32;
      b.limb([px, 0, pz], [px, 3.15, pz], 0.05, 0.035, M, 5);
      b.limb([px, 3.12, pz], [px + 0.42, 3.18, pz], 0.025, 0.02, M, 4);
      localPlace(b, base, px + 0.42, 2.98, pz);
      b.cone(6, 0.2, 0.22, M);
      localPlace(b, base, 0, 0, 0);
      b.limb([0.56, 0.3, -0.3], [px, 0.05, pz + 0.05], 0.015, 0.015, M, 3); // cable
      b.limb([px, 0.05, pz + 0.05], [px, 1.2, pz + 0.02], 0.012, 0.012, M, 3);
      // a toolbox someone dropped
      localPlace(b, base, -0.95, 0.12, 0.55, 0, 0.5, 0);
      b.box(0.42, 0.22, 0.2, KIND.WOOD);
    });
  }

  // ---------------- meshes ----------------
  buildChunks() {
    const C = CFG.CHUNK, half = this.half;
    const n = Math.ceil((2 * half) / C);
    const buckets = new Array(n * n);
    for (let i = 0; i < buckets.length; i++) buckets[i] = [];
    for (const p of this.props) {
      const i = Math.min(n - 1, Math.max(0, Math.floor((p.x + half) / C)));
      const j = Math.min(n - 1, Math.max(0, Math.floor((p.z + half) / C)));
      buckets[j * n + i].push(p);
    }
    const b = new MeshBuilder(60000);
    let tris = 0;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        b.reset();
        const x0 = -half + i * C, z0 = -half + j * C;
        this.terrain.build(b, x0, z0, x0 + C, z0 + C);
        for (const p of buckets[j * n + i]) {
          b.identity();
          p.build(b);
        }
        if (b.count === 0) continue;
        const geo = b.toGeometry();
        const mesh = new THREE.Mesh(geo, this.material);
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        this.scene.add(mesh);
        this.meshes.push(mesh);
        tris += b.count / 3;
      }
    }
    this.tris = tris;
    this.props = null; // free closures
  }

  randomOpenPoint(rng, minFromSpawn = 20, tries = 60) {
    const half = CFG.WORLD_WALL - 12;
    for (let i = 0; i < tries; i++) {
      const x = rng.float(-half, half), z = rng.float(-half, half);
      if (Math.hypot(x - this.spawn.x, z - this.spawn.z) < minFromSpawn) continue;
      if (this.lake && Math.hypot(x - this.lake.x, z - this.lake.z) < this.lake.r + 3) continue;
      if (!this.col.free(x, z, 1.2)) continue;
      return { x, z };
    }
    return { x: rng.float(-50, 50), z: rng.float(-50, 50) };
  }
}
