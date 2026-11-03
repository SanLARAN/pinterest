// The landing page's forest: a patch of the game's own woods around the old footpath that runs down to the camp,
// built with the game's own builders (terrain, pines, dead trees, birches, the stick figures, the camp, the
// generators — World.prototype.* called on a stand-in world, the way the atlas builds its places).
//
// The map: the camp at (0, 0); the path comes in from the north (z ≈ 110) and the camera walks it toward −z.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../src/world/builder.js';
import { Terrain } from '../src/world/terrain.js';
import { World } from '../src/world/world.js';
import { RNG } from '../src/core/rng.js';
import { trackAt } from './timeline.js';

export const TRAIL = [[6.5, 112], [6.2, 99], [3.6, 85], [-1.8, 68], [1.6, 50], [-0.8, 31], [0.6, 15], [0.4, 4.2]];
export const CAMP = { x: 0, z: 0 };
// five generators in clearings off the path, all in sight of the camera as it rises over the trees (stage: the shift)
export const GENS = [
  { x: -15, z: 72, yaw: 0.7 },
  { x: 17, z: 55, yaw: -0.9 },
  { x: -18, z: 33, yaw: 1.9 },
  { x: 16, z: 16, yaw: -2.3 },
  { x: -9, z: -13, yaw: 2.8 },
];
export const EFFIGIES = [[5.6, 92], [-6.5, 63], [6.8, 41], [-5.6, 21]];
export const BOUNDS = { x0: -70, x1: 70, z0: -58, z1: 120 };

// the path, resampled every ~2 m
export function trailPoints(step = 2) {
  const out = [];
  for (let i = 0; i < TRAIL.length - 1; i++) {
    const [ax, az] = TRAIL[i], [bx, bz] = TRAIL[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      // a soft S between the knots (no corners on the path)
      const s = t * t * (3 - 2 * t);
      out.push([ax + (bx - ax) * s, az + (bz - az) * t]);
    }
  }
  out.push(TRAIL[TRAIL.length - 1]);
  return out;
}

const PTS = trailPoints(1.5);
export function trailDist(x, z) {
  let best = Infinity;
  for (let i = 0; i < PTS.length - 1; i++) {
    const [ax, az] = PTS[i], [bx, bz] = PTS[i + 1];
    const dx = bx - ax, dz = bz - az;
    const L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best) best = d;
  }
  return best;
}
// the path's x at a given z (for the stands on it)
export function trailX(z) {
  for (let i = 0; i < PTS.length - 1; i++) {
    const [ax, az] = PTS[i], [bx, bz] = PTS[i + 1];
    if ((z <= az && z >= bz) || (z >= az && z <= bz)) return ax + (bx - ax) * ((z - az) / ((bz - az) || 1));
  }
  return 0;
}

function soilStrip(b, terrain) {
  b.identity();
  const P = trailPoints(1.6);
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i], [bx, bz] = P[i + 1];
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L;
    const w0 = 0.95 + 0.25 * Math.sin(i * 0.7), w1 = 0.95 + 0.25 * Math.sin((i + 1) * 0.7);
    const q = [
      [ax - nx * w0, az - nz * w0], [ax + nx * w0, az + nz * w0], [bx + nx * w1, bz + nz * w1], [bx - nx * w1, bz - nz * w1],
    ].map(([x, z]) => [x, terrain.height(x, z) + 0.035, z]);
    const across = [0, 1, 1, 0];
    b._ensure(6);
    for (const k of [0, 2, 1, 0, 3, 2]) b._v(...q[k], Math.round(across[k] * 255), 255, 255, KIND.TRAIL);
  }
}

// → { terrain, chunks: [{ arr, z0 }], gens: [{ x, y, z, yaw, lamp: [x, y, z] }], fire: [x, y, z], trees }
export function buildForest(seed = 1337) {
  const terrain = new Terrain(seed);
  terrain.addFlat(CAMP.x, CAMP.z, 15);
  for (const g of GENS) terrain.addFlat(g.x, g.z, 6);
  terrain.finalize();
  const rng = new RNG((seed ^ 0x5173) >>> 0);
  // the props go into bands along z, so the far ones can be culled
  const BAND = 30;
  const bands = new Map();
  const bandOf = (z) => {
    const k = Math.floor((z - BOUNDS.z0) / BAND);
    if (!bands.has(k)) bands.set(k, []);
    return bands.get(k);
  };
  const fake = {
    terrain,
    addProp: (x, z, fn) => bandOf(z).push(fn),
    col: { circle() {}, add() {}, free: () => true },
    effigies: [], perches: [], doors: [], cabinets: [], addCabinet() {},
    spawn: null, lake: null,
    genProp: World.prototype.genProp,
  };
  const W = World.prototype;
  const nearGen = (x, z, r) => GENS.some((g) => Math.hypot(x - g.x, z - g.z) < r);
  // the camera's own flight (timeline KEYS, heights over the ground): below the treetops it must never pass through a
  // crown — 15 trees stood within 3.6 m of it where it climbs over the forest at the start of the shift
  const cam = [];
  for (let i = 0; i <= 240; i++) {
    const { pos } = trackAt(i / 240);
    if (pos[1] < 14) cam.push(pos);
  }
  const nearCam = (x, z, r) => cam.some((p) => Math.hypot(x - p[0], z - p[2]) < r);

  // the camp, the generators, the stick figures
  W.lm_camp.call(fake, { id: 'camp', x: CAMP.x, z: CAMP.z, r: 11 }, new RNG(seed));
  const gens = GENS.map((g) => {
    const y = terrain.height(g.x, g.z);
    W.genProp.call(fake, { x: g.x, y, z: g.z, yaw: g.yaw });
    const c = Math.cos(g.yaw), s = Math.sin(g.yaw);
    const lx = 1.2, lz = -0.32; // the work lamp on its pole (atlasModels: generator)
    return { ...g, y, lamp: [g.x + lx * c + lz * s, y + 2.92, g.z - lx * s + lz * c] };
  });
  for (const [x, z] of EFFIGIES) W.effigy.call(fake, x, z, rng);

  // the trees: a jittered grid, kept off the path, the camp and the generators' clearings
  let trees = 0;
  const C = 3.5;
  for (let z = BOUNDS.z0; z < BOUNDS.z1; z += C) {
    for (let x = BOUNDS.x0; x < BOUNDS.x1; x += C) {
      const tx = x + rng.float(-1.3, 1.3), tz = z + rng.float(-1.3, 1.3);
      const r = rng.next();
      const dPath = trailDist(tx, tz);
      if (dPath < 2.4 + rng.float(0, 1.4)) continue;
      if (Math.hypot(tx - CAMP.x, tz - CAMP.z) < 12.5 + rng.float(0, 2)) continue;
      if (nearGen(tx, tz, 5.5)) continue;
      if (nearCam(tx, tz, 3.6)) continue;
      // thinner near the path, so the walk has room to breathe
      if (r < (dPath < 7 ? 0.45 : 0.22)) continue;
      const y = terrain.height(tx, tz);
      const roll = rng.next();
      const s = rng.float(0.8, 1.3);
      if (roll < 0.62) W.pine.call(fake, tx, y, tz, s, rng);
      else if (roll < 0.82) W.deadTree.call(fake, tx, y, tz, s, rng);
      else if (roll < 0.94) W.birch.call(fake, tx, y, tz, s, rng);
      else W.stump.call(fake, tx, y, tz, rng);
      trees++;
    }
  }
  // boulders and fallen logs
  for (let i = 0; i < 90; i++) {
    const x = rng.float(BOUNDS.x0, BOUNDS.x1), z = rng.float(BOUNDS.z0, BOUNDS.z1);
    if (trailDist(x, z) < 2 || Math.hypot(x, z) < 9 || nearGen(x, z, 4)) continue;
    const r = rng.chance(0.15) ? rng.float(1.2, 2.2) : rng.float(0.35, 0.9);
    const y = terrain.height(x, z), seedR = (rng.next() * 1e9) | 0, ry = rng.float(0, 6.28);
    fake.addProp(x, z, (b) => {
      const r2 = new RNG(seedR);
      b.place(x, y + r * 0.15, z, 0, ry, 0, 1);
      b.rock(r, () => r2.next(), KIND.ROCK, 0.35, 0.62);
    });
  }
  for (let i = 0; i < 30; i++) {
    const x = rng.float(BOUNDS.x0, BOUNDS.x1), z = rng.float(BOUNDS.z0, BOUNDS.z1);
    const a = rng.float(0, 6.28), len = rng.float(3, 6.5);
    const x2 = x + Math.cos(a) * len, z2 = z + Math.sin(a) * len;
    if (Math.min(trailDist(x, z), trailDist(x2, z2), trailDist((x + x2) / 2, (z + z2) / 2)) < 2.2 || Math.hypot(x, z) < 10 || nearGen(x, z, 5)) continue;
    const y1 = terrain.height(x, z) + 0.25, y2 = terrain.height(x2, z2) + 0.25, r = rng.float(0.22, 0.38);
    fake.addProp(x, z, (b) => {
      b.identity();
      b.limb([x, y1, z], [x2, y2, z2], r, r * 0.8, KIND.BARK, 6);
    });
  }

  const chunks = [];
  // the ground (+ the path's soil) in one piece
  const g = new MeshBuilder(40000);
  terrain.build(g, BOUNDS.x0 - 20, BOUNDS.z0 - 20, BOUNDS.x1 + 20, BOUNDS.z1 + 20);
  soilStrip(g, terrain);
  chunks.push({ arr: g.toArrays(), ground: true });
  for (const [, fns] of [...bands.entries()].sort((a, b) => a[0] - b[0])) {
    const b = new MeshBuilder(16384);
    for (const fn of fns) {
      b.identity();
      fn(b);
    }
    chunks.push({ arr: b.toArrays() });
  }
  const fy = terrain.height(CAMP.x, CAMP.z);
  return { terrain, chunks, gens, fire: [CAMP.x, fy + 0.45, CAMP.z], trees };
}

export function geometryOf(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}
