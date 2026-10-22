// Торфяник — the peat bog. A second участок, not a reskin of the forest: the ground itself plays differently.
//
// 38% of it is water. Standing in it muffles your echo (the wave is shorter and slower) but every step sends a
// ring across the surface that is visible — and loud — from far further away. Planks are the opposite: fast and
// dry, and they creak. The five pumps drain the sectors they stand in; the УАЗ is stuck up to the hubs at the far
// end of the causeway, and the only way to it is five pumps and a winch.
//
// This file owns the *place*: the heightfield, the water, the six landmarks, the planks, the pumps, the car.
// The mechanics that read it (wading, rings, hearing) live in game/water.js; the pumps and the winch in
// game/pumps.js and game/winch.js.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { RNG, Simplex2, smoothstep, lerp } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';
import { Terrain } from './terrain.js';
import { ForestNavigation } from './navigation.js';
import { CAP } from './caps.js';

const LEVEL = 0.34; // the water line, in world metres
const HALF = 170;

// what a running pump does: it drains the sector it stands in, 0.6 m in 40 m, and the water surface with it
export const PUMP = { drainR: 40, drainDrop: 0.6 };

// Six places. The first five carry a pump (the chain); the causeway is where the shift ends.
export const BOG_LANDMARKS = [
  { id: 'camp', x: 0, z: 0, r: 18 }, // dry island: the tents, the fire, the cots
  { id: 'pumpstation', x: -84, z: 44, r: 15, ry: 0.42 }, // a shed with the master pump
  { id: 'barracks', x: 72, z: -52, r: 14, ry: -0.72 }, // the flooded barracks on stilts
  { id: 'stacks', x: 16, z: 102, r: 16, ry: 0.18 }, // peat stacks, drying racks
  { id: 'bridges', x: 102, z: 62, r: 16 }, // three short bridges over the channels
  { id: 'causeway', x: 0, z: -122, r: 26 }, // the plank road out — and the УАЗ at its end
];

// soft mud: standing in it you sink, struggling sinks you faster (game/water.js)
export const BOG_SOFT = [
  { x: -42, z: -26, r: 6 },
  { x: 58, z: 26, r: 6 },
  { x: -18, z: 74, r: 6 },
];

// vapour: echo does not come back out of these (six patches of 12 m)
export const BOG_MIST = [
  { x: -60, z: 96, r: 12 },
  { x: 120, z: -12, r: 12 },
  { x: 34, z: -74, r: 12 },
  { x: -110, z: -60, r: 12 },
  { x: 82, z: 118, r: 12 },
  { x: -8, z: 40, r: 12 },
];

// the plank roads: every point a leg, the deck runs 3 m wide and stands a hand above the water
const WALKS = [
  { id: 'camp-causeway', w: 3.0, pts: [[0, -14], [-7, -42], [-13, -72], [-6, -98], [0, -112], [0, -152]] },
  { id: 'camp-station', w: 2.6, pts: [[-14, 6], [-34, 16], [-56, 30], [-74, 40], [-84, 44]] },
  { id: 'camp-barracks', w: 2.6, pts: [[12, -8], [30, -22], [48, -34], [64, -46]] },
  { id: 'camp-stacks', w: 2.6, pts: [[4, 14], [8, 40], [12, 68], [16, 92]] },
  { id: 'camp-bridges', w: 2.6, pts: [[14, 8], [40, 22], [70, 36], [92, 50], [102, 62]] },
];

// Water: a read-only question the rest of the game asks of the bog ("how deep is it here?").
// The level itself moves: each running pump drains its own sector (game/pumps.js writes `drains`).
export class BogWater {
  constructor(world) {
    this.world = world;
    this.level = LEVEL;
    this.drains = []; // { x, z, r, drop } — a pump that is running lowers the water around itself
  }

  // depth at a point: how much water stands over the ground (0 on dry land)
  depth(x, z) {
    const h = this.world.terrain.height(x, z);
    let lvl = this.level;
    for (const d of this.drains) {
      const t = 1 - smoothstep(d.r * 0.45, d.r, Math.hypot(x - d.x, z - d.z));
      if (t > 0) lvl -= d.drop * t;
    }
    return Math.max(0, lvl - h);
  }

  // wet = ankle-deep or more; wading = knee-deep (the speed penalty starts here)
  wet(x, z) {
    return this.depth(x, z) > 0.06;
  }

  wading(x, z) {
    return this.depth(x, z) > 0.25;
  }

  // soft mud: it is not water, it is what water leaves behind
  soft(x, z) {
    for (const s of BOG_SOFT) if (Math.hypot(x - s.x, z - s.z) < s.r) return true;
    return false;
  }

  // inside a vapour patch: the echo dies in it
  misted(x, z) {
    for (const m of BOG_MIST) if (Math.hypot(x - m.x, z - m.z) < m.r) return true;
    return false;
  }
}

// The bog's ground: peat that sits almost flat, hollows drowned by the water line, a dyke at the edge.
class BogTerrain extends Terrain {
  constructor(seed) {
    super(seed);
    this.half = HALF;
    this.level = LEVEL;
    this.n = Math.round((2 * this.half) / this.cell);
    this.H = new Float32Array((this.n + 1) * (this.n + 1));
  }

  rawHeight(x, z) {
    const n = this.noise;
    // peat: broad, shallow undulation, barely a metre across fifty
    let h = 0.95 + n.fbm(x / 95, z / 95, 3) * 1.45 + n.noise(x / 31 + 5.2, z / 31 - 2.7) * 0.5;
    // the wet hollows: one low-frequency mask drowns wide, flat pieces of the bog at once
    const wet = smoothstep(-0.22, 0.32, n.noise(x / 68 - 12.4, z / 68 + 8.9));
    h -= wet * 1.32;
    // the drowned channel that the bridges cross
    const ch = Math.abs(n.noise(x / 40 + 21.7, z / 40 - 3.1));
    h -= (1 - smoothstep(0.02, 0.12, ch)) * 0.9;
    // the far shore: a narrow spit where the plank road comes out of the bog (the car stands past it,
    // in the water — that is the whole point of the winch)
    const spit = Math.hypot((x - 0) / 9, (z + 160) / 7);
    h += (1 - smoothstep(0.6, 1.0, spit)) * 0.75;
    // ...and the shelf it went down on: the УАЗ sits up to its hubs, not on the bottom
    const shelf = Math.hypot((x - 1.5) / 11, (z + 130) / 9);
    h += (1 - smoothstep(0.55, 1.0, shelf)) * 1.28;
    // the roads follow the wettest lines — a boardwalk is built where the peat cannot be crossed, so the
    // ground under one is a channel. (The ends stay dry: they land on the islands.)
    for (const W of WALKS) {
      for (let i = 0; i < W.pts.length - 1; i++) {
        const [ax, az] = W.pts[i], [bx, bz] = W.pts[i + 1];
        const dx = bx - ax, dz = bz - az;
        const len2 = dx * dx + dz * dz || 1;
        let t = ((x - ax) * dx + (z - az) * dz) / len2;
        if (t < 0.06 || t > 0.94) continue; // dry landings
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
        if (d > 6) continue;
        // (blend toward a floor below the water line, not "subtract some": the peat under a road is high)
        h = lerp(h, Math.min(h, LEVEL - 0.55), 1 - smoothstep(1.4, 5.6, d));
      }
    }
    // the dyke: a ring of higher peat that closes the участок (and hides the world's edge)
    const e = Math.max(Math.abs(x), Math.abs(z));
    h += smoothstep(this.half - 30, this.half - 6, e) * 5.0;
    return h;
  }
}

export const BOG = {
  id: 'bog',
  seed: 90210,
  half: HALF,
  level: LEVEL,
  landmarks: BOG_LANDMARKS,
  terrain: (seed) => new BogTerrain(seed),
  soft: BOG_SOFT,
  mist: BOG_MIST,
};

// ---------------------------------------------------------------- geometry

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

// a plank deck from a to b, 3 m wide, a hand above the water, on posts
function deck(world, b, ax, az, bx, bz, w, y) {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.4) return;
  const ux = dx / len, uz = dz / len; // along
  const px = -uz, pz = ux; // across
  const plank = 1.5;
  const n = Math.max(1, Math.round(len / plank));
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const x0 = ax + dx * t0, z0 = az + dz * t0, x1 = ax + dx * t1, z1 = az + dz * t1;
    const hw = w / 2;
    // the walking surface (a quad with its diagonal hidden), a hair above the water
    b.identity();
    b.quad([x0 - px * hw, y, z0 - pz * hw], [x1 - px * hw, y, z1 - pz * hw],
      [x1 + px * hw, y, z1 + pz * hw], [x0 + px * hw, y, z0 + pz * hw], KIND.WOOD, 15);
    // the edge board, so the deck reads at a glance from a low echo
    for (const s of [-1, 1]) {
      const ex = px * hw * s, ez = pz * hw * s;
      b.tri([x0 + ex, y, z0 + ez], [x1 + ex, y, z1 + ez], [x1 + ex, y - 0.11, z1 + ez], KIND.WOOD, 6);
      b.tri([x0 + ex, y, z0 + ez], [x1 + ex, y - 0.11, z1 + ez], [x0 + ex, y - 0.11, z0 + ez], KIND.WOOD, 5);
    }
  }
  // posts, every four metres, one pair
  for (let d = 1.2; d < len; d += 4) {
    const x = ax + ux * d, z = az + uz * d;
    const g = world.terrain.height(x, z);
    for (const s of [-1, 1]) {
      const ox = px * (w / 2 - 0.16) * s, oz = pz * (w / 2 - 0.16) * s;
      b.identity();
      b.limb([x + ox, y, z + oz], [x + ox, Math.min(g - 0.2, y - 0.3), z + oz], 0.075, 0.075, KIND.WOOD, 4);
    }
  }
  // and one handrail post every twelve metres, so a bridge looks like a bridge
  for (let d = 3; d < len; d += 12) {
    const x = ax + ux * d, z = az + uz * d;
    for (const s of [-1, 1]) {
      const ox = px * (w / 2 - 0.1) * s, oz = pz * (w / 2 - 0.1) * s;
      b.identity();
      b.limb([x + ox, y, z + oz], [x + ox, y + 1.0, z + oz], 0.05, 0.045, KIND.WOOD, 4);
    }
  }
}

// a walkable deck is one collider-free ribbon: nothing blocks a player, but the ground under it is water,
// and the game asks `world.walkAt(x, z)` which surface you are on (see game/water.js)
function addWalk(world, walk) {
  const y = LEVEL + 0.16;
  for (let i = 0; i < walk.pts.length - 1; i++) {
    const [ax, az] = walk.pts[i], [bx, bz] = walk.pts[i + 1];
    world.addProp((ax + bx) / 2, (az + bz) / 2, (b) => deck(world, b, ax, az, bx, bz, walk.w, y));
    world.walks.push({ ax, az, bx, bz, w: walk.w, y });
  }
}

// ---------------------------------------------------------------- the place

export function buildBog(world, t0) {
  const rng = new RNG(BOG.seed);
  const terr = world.terrain;
  world.walks = [];
  world.water = new BogWater(world);
  world.spawn = { x: 0, z: 2, yaw: Math.PI };

  // dry islands: a camp worth of flat ground per place, a hand or two above the water line
  for (const L of world.landmarks) {
    const h = LEVEL + (L.id === 'causeway' ? 0.42 : 0.8);
    terr.addFlat(L.x, L.z, L.r * (L.id === 'causeway' ? 0.34 : 1.1), h);
  }
  // two drowned pools: the deep water the Дrowned waits in (3.0c)
  terr.addBasin(-40, -34, 26, 1.5);
  terr.addBasin(66, 22, 22, 1.3);
  terr.finalize();

  for (const L of world.landmarks) {
    const fn = PLACES[L.id];
    if (fn) fn(world, L, rng);
  }
  for (const W of WALKS) addWalk(world, W);

  genPumps(world, rng);
  genCar(world);
  genGrowth(world, rng);

  world.navigation = new ForestNavigation(world);
  world.buildChunks();
  buildWater(world);
  world.waterMesh = true;
  world.genTime = performance.now() - t0;
  return world;
}

// camp: two tents, a fire ring, crates — the same vocabulary as the forest camp, drier
function placeCamp(world, L, rng) {
  const y = world.terrain.height(L.x, L.z);
  world.addProp(L.x, L.z + 3, (b) => {
    b.identity();
    // a ridge tent
    const bx = L.x - 3.4, bz = L.z - 2.2;
    b.place(bx, y, bz, 0, 0.3, 0);
    b.limb([-1.6, 0.02, 0], [0, 1.55, 0], 0.05, 0.045, KIND.WOOD, 4);
    b.limb([1.6, 0.02, 0], [0, 1.55, 0], 0.05, 0.045, KIND.WOOD, 4);
    b.tri([-1.75, 0, -1.3], [1.75, 0, -1.3], [0, 1.58, 0], KIND.LEAF, 1);
    b.tri([1.75, 0, 1.3], [-1.75, 0, 1.3], [0, 1.58, 0], KIND.LEAF, 1);
    b.quadN([-1.75, 0, -1.3], [1.75, 0, -1.3], [1.75, 0, 1.3], [-1.75, 0, 1.3], [0, -1, 0], KIND.LEAF);
    // the fire ring
    b.place(L.x + 1.6, y, L.z + 1.1, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.283;
      b.place(L.x + 1.6 + Math.cos(a) * 0.72, y, L.z + 1.1 + Math.sin(a) * 0.72, 0, a, 0);
      b.rock(0.22, () => rng.next(), KIND.ROCK, 0.3, 0.6);
    }
    // crates, a bench, a fuel drum
    b.place(L.x - 1.2, y, L.z + 2.6, 0, 0.6, 0);
    b.box(0.9, 0.55, 0.6, KIND.WOOD, { bottom: true });
    b.place(L.x + 3.0, y, L.z - 0.6, 0, -0.2, 0);
    b.box(1.6, 0.14, 0.42, KIND.WOOD, { bottom: true });
    b.limb([-0.6, 0, 0], [-0.6, 0.44, 0], 0.05, 0.05, KIND.WOOD, 3);
    b.limb([0.6, 0, 0], [0.6, 0.44, 0], 0.05, 0.05, KIND.WOOD, 3);
    b.place(L.x + 4.2, y, L.z + 2.2, 0, 0.4, 0);
    b.cylinder(8, 0.29, 0.29, 0.88, KIND.METAL, { capTop: true });
  });
}

// the pump shed: open-fronted, a master pump, a pipe running out into the bog
function placeStation(world, L, rng) {
  const y = world.terrain.height(L.x, L.z);
  const ry = L.ry || 0;
  world.addProp(L.x, L.z, (b) => {
    b.identity();
    b.place(L.x, y, L.z, 0, ry, 0);
    // floor
    b.box(6.4, 0.18, 5.0, KIND.WOOD, { bottom: true });
    // three walls and a roof
    b.place(0, 0.18, -2.4);
    b.box(6.4, 2.4, 0.16, KIND.WOOD, { bottom: true });
    b.place(-3.1, 0.18, 0);
    b.box(0.16, 2.4, 5.0, KIND.WOOD, { bottom: true });
    b.place(3.1, 0.18, 0);
    b.box(0.16, 2.4, 5.0, KIND.WOOD, { bottom: true });
    b.place(0, 2.5, -0.2, 0.08, 0, 0);
    b.box(6.9, 0.14, 5.6, KIND.METAL);
    // the pump itself: a squat drum with a flywheel and a rising main
    b.place(L.x - 1.2, y + 0.2, L.z + 0.6, 0, ry + 0.4, 0);
    b.cylinder(10, 0.55, 0.5, 1.15, KIND.METAL, { capTop: true });
    b.place(0, 1.2, 0);
    b.cylinder(8, 0.22, 0.22, 0.35, KIND.METAL, { capTop: true });
    b.place(0.62, 0.6, 0, 0, 0, Math.PI / 2);
    b.cylinder(12, 0.42, 0.42, 0.12, KIND.METAL);
    // suction pipe into the water
    b.setMatrix(new THREE.Matrix4().makeTranslation(L.x - 1.2, y + 0.2, L.z + 0.6));
    b.limb([0, 0.35, 0], [0, 0.35, 3.6], 0.17, 0.17, KIND.METAL, 6);
    b.limb([0, 0.35, 3.6], [0, -0.6, 3.6], 0.17, 0.17, KIND.METAL, 6);
  });
  world.col.add(L.x - 3.3, L.z - 2.5, L.x + 3.3, L.z - 2.5, 0.2, 2.8, CAP.WOOD);
  world.col.add(L.x - 3.1, L.z - 2.4, L.x - 3.1, L.z + 2.4, 0.2, 2.8, CAP.WOOD);
  world.col.add(L.x + 3.1, L.z - 2.4, L.x + 3.1, L.z + 2.4, 0.2, 2.8, CAP.WOOD);
}

// the flooded barracks: a long hut on stilts, the water inside it ankle-deep
function placeBarracks(world, L, rng) {
  const y = world.terrain.height(L.x, L.z);
  const ry = L.ry || 0;
  const W = 11, D = 5.2, FLOOR = 0.9;
  world.addProp(L.x, L.z, (b) => {
    b.identity();
    b.place(L.x, y, L.z, 0, ry, 0);
    // stilts
    for (const sx of [-W / 2 + 0.5, 0, W / 2 - 0.5]) {
      for (const sz of [-D / 2 + 0.4, D / 2 - 0.4]) {
        b.place(sx, y - 0.4, sz);
        b.limb([0, 0, 0], [0, FLOOR + 0.4, 0], 0.13, 0.11, KIND.WOOD, 5);
        world.col.circle(L.x + sx * Math.cos(ry) + sz * Math.sin(ry), L.z - sx * Math.sin(ry) + sz * Math.cos(ry), 0.16, 1.6, CAP.WOOD);
      }
    }
    // deck, walls, roof — the roof sagging, one leaf missing
    b.place(0, FLOOR, 0);
    b.box(W, 0.16, D, KIND.WOOD, { bottom: true });
    b.place(0, FLOOR + 0.16, -D / 2 + 0.1);
    b.box(W, 2.5, 0.14, KIND.WOOD, { bottom: true });
    b.place(-W / 2 + 0.08, FLOOR + 0.16, 0);
    b.box(0.14, 2.2, D, KIND.WOOD, { bottom: true });
    b.place(W / 2 - 0.08, FLOOR + 0.16, 0);
    b.box(0.14, 2.2, D, KIND.WOOD, { bottom: true });
    b.place(0, FLOOR + 2.5, 0, 0.05, 0, 0.03);
    b.box(W + 0.8, 0.16, D + 0.9, KIND.METAL);
    // the bunks inside, and the water that got in
    for (let i = -1; i <= 1; i++) {
      b.place(i * 3.2, FLOOR + 0.16, 1.3);
      b.box(1.9, 0.1, 0.8, KIND.WOOD, { bottom: true });
      b.limb([-0.85, 0, 0], [-0.85, 0.5, 0], 0.04, 0.04, KIND.METAL, 3);
      b.limb([0.85, 0, 0], [0.85, 0.5, 0], 0.04, 0.04, KIND.METAL, 3);
    }
  });
  world.col.add(L.x - W / 2, L.z - D / 2, L.x - W / 2, L.z + D / 2, 0.2, 3.4, CAP.WOOD);
  world.col.add(L.x - W / 2, L.z - D / 2, L.x + W / 2, L.z - D / 2, 0.2, 3.4, CAP.WOOD);
  world.col.add(L.x + W / 2, L.z - D / 2, L.x + W / 2, L.z + D / 2, 0.2, 3.4, CAP.WOOD);
}

// peat stacks: the cutting that was never taken away — rows of dark, drying blocks
function placeStacks(world, L, rng) {
  const y = world.terrain.height(L.x, L.z);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = L.x - 5.4 + col * 3.6 + rng.float(-0.25, 0.25);
      const z = L.z - 4 + row * 3.4 + rng.float(-0.2, 0.2);
      const hgt = rng.float(0.7, 1.2);
      world.addProp(x, z, (b) => {
        b.identity();
        b.place(x, y, z, 0, rng.float(-0.2, 0.2), 0);
        for (let k = 0; k < 3; k++) {
          const f = 1 - k * 0.12;
          b.place(x + rng.float(-0.06, 0.06), y + k * (hgt / 3), z + rng.float(-0.06, 0.06), 0, rng.float(-0.1, 0.1), 0);
          b.box(1.5 * f, hgt / 3 - 0.04, 1.0 * f, KIND.BARK, { bottom: true });
        }
      });
      world.col.add(x - 0.7, z - 0.45, x + 0.7, z + 0.45, 0.3, hgt, CAP.WOOD);
    }
  }
  // the drying rack
  world.addProp(L.x + 6, L.z + 2, (b) => {
    b.identity();
    for (const sx of [-2.2, 2.2]) {
      b.place(L.x + 6 + sx, y, L.z + 2);
      b.limb([0, 0, 0], [0, 2.2, 0], 0.07, 0.06, KIND.WOOD, 4);
    }
    b.place(L.x + 6, y + 2.1, L.z + 2);
    b.box(4.6, 0.12, 0.12, KIND.WOOD);
    for (let i = -2; i <= 2; i++) {
      b.place(L.x + 6 + i * 1.0, y + 1.6, L.z + 2);
      b.box(0.5, 0.6, 0.1, KIND.BARK, { bottom: true });
    }
  });
}

// three short bridges over the drowned channel
function placeBridges(world, L, rng) {
  const y = LEVEL + 0.2;
  for (let i = 0; i < 3; i++) {
    const a = (i - 1) * 0.5;
    const cx = L.x + Math.cos(a) * 3.5, cz = L.z + Math.sin(a) * 3.5 - 2;
    const ry = a + Math.PI / 2;
    const ux = Math.cos(ry), uz = Math.sin(ry);
    const len = 9 + i * 2.5;
    world.addProp(cx, cz, (b) => {
      b.identity();
      for (let d = 0; d < len; d += 1.2) {
        const t0 = d / len, t1 = (d + 1.2) / len;
        const x0 = cx - ux * len / 2 + ux * len * t0, z0 = cz - uz * len / 2 + uz * len * t0;
        const x1 = cx - ux * len / 2 + ux * len * t1, z1 = cz - uz * len / 2 + uz * len * t1;
        b.quad([x0 + uz, y, z0 - ux], [x1 + uz, y, z1 - ux], [x1 - uz, y, z1 + ux], [x0 - uz, y, z0 + ux], KIND.WOOD, 15);
      }
      for (const s of [-1, 1]) {
        for (let d = 0; d <= len; d += 4) {
          const x = cx - ux * len / 2 + ux * d, z = cz - uz * len / 2 + uz * d;
          b.place(x, y, z);
          b.limb([uz * s, 0, -ux * s], [uz * s, 0.9, -ux * s], 0.05, 0.045, KIND.WOOD, 4);
        }
      }
    });
    world.walks.push({ ax: cx - ux * len / 2, az: cz - uz * len / 2, bx: cx + ux * len / 2, bz: cz + uz * len / 2, w: 2.0, y });
  }
}

const PLACES = {
  camp: placeCamp,
  pumpstation: placeStation,
  barracks: placeBarracks,
  stacks: placeStacks,
  bridges: placeBridges,
};

// ---------------------------------------------------------------- pumps and the car

// Five pumps on the five places. The chain itself is built by game/pumps.js; here they are only things:
// a pump body (two columns and a flywheel), a rising main, and a stand of valves. `site` is what the game
// drives, exactly like a generator's site in the forest.
function genPumps(world, rng) {
  const ids = ['camp', 'pumpstation', 'barracks', 'stacks', 'bridges'];
  world.sites = [];
  for (const id of ids) {
    const L = world.landmarks.find((l) => l.id === id);
    let px, pz;
    if (id === 'camp') { px = L.x + 5.6; pz = L.z - 6.0; }
    else { px = L.x + 2.2; pz = L.z + 2.4; }
    const y = world.terrain.height(px, pz);
    const yaw = Math.atan2(L.x - px, L.z - pz);
    // whoever came out here to start it: a body on the dry ground by the pump, a note in its hand
    const cx = px + Math.cos(yaw + 1.4) * 2.6, cz = pz - Math.sin(yaw + 1.4) * 2.6;
    const corpse = { x: cx, z: cz, yaw: Math.atan2(px - cx, pz - cz) + rng.float(-0.6, 0.6), seed: rng.int(1, 1e6) };
    const site = { id, x: px, z: pz, y, yaw, corpse };
    world.sites.push(site);
    world.addProp(px, pz, (b) => {
      b.identity();
      b.place(px, y, pz, 0, yaw + Math.PI, 0);
      // a base plate on the wet ground
      b.box(1.5, 0.16, 1.1, KIND.METAL, { bottom: true });
      // the two columns of a hand pump
      b.place(-0.34, 0.16, 0);
      b.limb([0, 0, 0], [0, 1.15, 0], 0.16, 0.13, KIND.METAL, 6);
      b.place(0.34, 0.16, 0);
      b.limb([0, 0, 0], [0, 1.15, 0], 0.16, 0.13, KIND.METAL, 6);
      // the head, the lever, the flywheel
      b.place(0, 1.3, 0);
      b.box(1.15, 0.34, 0.5, KIND.METAL, { bottom: true });
      b.place(-0.62, 1.34, 0, 0, 0, -0.55);
      b.limb([0, 0, 0], [0, 1.5, 0], 0.055, 0.05, KIND.METAL, 4);
      b.place(0.62, 1.36, 0.28, 0, 0, Math.PI / 2);
      b.cylinder(12, 0.36, 0.36, 0.1, KIND.METAL);
      // the rising main, elbow, and a standpipe
      b.place(0, 1.32, -0.25);
      b.limb([0, 0, 0], [0, 0.9, 0], 0.1, 0.1, KIND.METAL, 5);
      b.limb([0, 0.9, 0], [0, 0.9, -1.7], 0.1, 0.1, KIND.METAL, 5);
      b.limb([0, 0.9, -1.7], [0, -0.35, -1.7], 0.1, 0.1, KIND.METAL, 5);
      // the valve stand
      b.place(-0.95, 0.16, 0.5, 0, 0, 0);
      b.limb([0, 0, 0], [0, 0.85, 0], 0.05, 0.045, KIND.METAL, 4);
      b.place(0, 0.85, 0, 0, 0, Math.PI / 2);
      b.cylinder(10, 0.18, 0.18, 0.06, KIND.METAL);
    });
    world.col.circle(px, pz, 0.75, 1.7, CAP.METAL);
    // a work lamp on a pole, like a generator's
    const [hx, hz] = [0.9 * Math.cos(yaw), -0.9 * Math.sin(yaw)];
    site.lamp = { x: px + hx, y: y + 2.9, z: pz + hz };
    world.addProp(px + hx, pz + hz, (b) => {
      b.identity();
      b.place(px + hx, y, pz + hz);
      b.limb([0, 0, 0], [0, 3.0, 0], 0.055, 0.04, KIND.METAL, 5);
      b.place(0, 2.86, 0);
      b.cone(6, 0.2, 0.22, KIND.METAL);
    });
  }
}

// the УАЗ: up to the hubs at the end of the causeway, a winch on its nose, the cable run out to a leaning
// post. The finale (game/winch.js) turns the drum and pulls it onto the planks.
function genCar(world) {
  const L = world.landmarks.find((l) => l.id === 'causeway');
  const x = L.x + 1.5, z = L.z - 8;
  const y = world.terrain.height(x, z);
  const yaw = 0.12;
  world.car = { x, z, y, yaw, winch: { x: x + 0.1, z: z + 1.9 }, post: { x: x - 8.5, z: z + 14 } };
  world.addProp(x, z, (b) => {
    b.identity();
    b.place(x, y, z, 0.02, yaw, 0.03);
    // a boxy 4x4: body, canvas top, bonnet — the forest car's shape, sitting low in the water
    b.box(1.86, 0.72, 4.3, KIND.METAL, { bottom: true });
    b.place(0, 0.72, -0.3);
    b.box(1.7, 0.66, 3.1, KIND.LEAF, { bottom: true }); // canvas
    b.place(0, 0.6, 1.95, 0.06, 0, 0);
    b.box(1.7, 0.36, 1.0, KIND.METAL, { bottom: true }); // bonnet
    for (const [wx, wz] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
      b.place(wx, 0.36, wz, 0, 0, Math.PI / 2);
      b.cylinder(10, 0.36, 0.36, 0.26, KIND.BARK);
    }
    // winch drum + cable out to the post
    b.place(0, 0.45, 2.5, 0, 0, Math.PI / 2);
    b.cylinder(8, 0.16, 0.16, 0.42, KIND.METAL);
    const P = world.car.post;
    b.place(x, y, z, 0, yaw, 0);
    b.limb([0, 0.5, 2.4], [P.x - x, P.y != null ? P.y - y + 0.3 : 0.9, P.z - z], 0.035, 0.035, KIND.METAL, 3);
  });
  world.col.add(x - 1.1, z - 2.2, x + 1.1, z + 2.2, 0.35, 1.6, CAP.METAL);
  // the post the cable is tied to
  const P = world.car.post;
  P.y = world.terrain.height(P.x, P.z);
  world.addProp(P.x, P.z, (b) => {
    b.identity();
    b.place(P.x, P.y, P.z, 0.14, 0.6, 0.1);
    b.limb([0, 0, 0], [0, 3.0, 0], 0.15, 0.12, KIND.WOOD, 5);
    b.place(0, 2.6, 0);
    b.box(0.9, 0.12, 0.12, KIND.WOOD);
  });
  world.col.circle(P.x, P.z, 0.2, 3.0, CAP.WOOD);
}

// ---------------------------------------------------------------- growth

function genGrowth(world, rng) {
  const half = world.half - 12;
  // drowned trees: bare trunks standing in the water, the bog's own forest
  for (let i = 0; i < 260; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    const d = world.water.depth(x, z);
    if (d < 0.25 || d > 1.4) continue;
    if (world.inLandmark(x, z, 3) || world.onWalk(x, z, 2)) continue;
    const h = rng.float(2.2, 5.5), r = rng.float(0.12, 0.26);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, world.terrain.height(x, z) - 0.2, z, rng.float(-0.08, 0.08), rng.float(0, 6.28), rng.float(-0.08, 0.08));
      b.limb([0, 0, 0], [0, h, 0], r, r * 0.45, KIND.BARK, 5);
      if (rng.chance(0.45)) b.limb([0, h * 0.6, 0], [rng.float(-0.9, 0.9), h * 0.95, rng.float(-0.9, 0.9)], r * 0.6, 0.02, KIND.BARK, 3);
    });
    world.col.circle(x, z, r * 1.4, 3.0, CAP.TREE);
  }
  // reeds: clumps of thin stalks at the shore
  for (let i = 0; i < 420; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    const d = world.water.depth(x, z);
    if (d < 0.05 || d > 0.55) continue;
    if (world.inLandmark(x, z, 2) || world.onWalk(x, z, 0.6)) continue;
    world.addProp(x, z, (b) => {
      b.identity();
      const n = rng.int(4, 8);
      for (let k = 0; k < n; k++) {
        const ox = rng.float(-0.35, 0.35), oz = rng.float(-0.35, 0.35);
        const hh = rng.float(0.8, 1.7);
        b.limb([ox, -0.1, oz], [ox + rng.float(-0.08, 0.08), hh, oz + rng.float(-0.08, 0.08)], 0.022, 0.008, KIND.LEAF, 3);
      }
    });
  }
  // peat hummocks on the dry ground
  for (let i = 0; i < 300; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.02 || world.inLandmark(x, z, 2) || !world.col.free(x, z, 1.2)) continue;
    const r = rng.float(0.35, 0.9);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, world.terrain.height(x, z) - 0.1, z, 0, rng.float(0, 6.28), 0, 1, 0.5, 1);
      b.rock(r, () => rng.next(), KIND.GROUND, 0.3, 0.5);
    });
  }
}

// ---------------------------------------------------------------- pumps

// The shift's clock, read off the pumps: every running one drains its own sector, and the water surface is
// redrawn when that set changes (a handful of times a night at most). Because it is derived from the generators'
// state, it heals itself in co-op: a guest's pump drains the water on the host's screen and in everyone's list.
export function pumpDrains(world, gens) {
  const out = [];
  for (const g of gens || []) {
    if (!g.running) continue;
    out.push({ x: g.site.x, z: g.site.z, r: PUMP.drainR, drop: PUMP.drainDrop });
  }
  return out;
}

// the same sectors? (order does not matter: it is a set of positions)
export function sameDrains(a, b) {
  if (a.length !== b.length) return false;
  const key = (d) => `${d.x.toFixed(1)},${d.z.toFixed(1)}`;
  const set = new Set(a.map(key));
  return b.every((d) => set.has(key(d)));
}

// put the current drains into the map, and redraw the water if they changed. Returns true when it redrew.
export function syncPumps(world, gens) {
  const water = world.water;
  if (!water) return false;
  const next = pumpDrains(world, gens);
  if (sameDrains(water.drains, next)) return false;
  water.drains = next;
  refreshWater(world);
  return true;
}

// ---------------------------------------------------------------- water surface

// Redraw the surface where the water stands now (a pump changed the level somewhere).
export function refreshWater(world) {
  for (let i = world.meshes.length - 1; i >= 0; i--) {
    const m = world.meshes[i];
    if (!m.userData.water) continue;
    world.scene.remove(m);
    m.geometry?.dispose();
    world.meshes.splice(i, 1);
  }
  buildWater(world);
  return world;
}

// The water itself, drawn as a sparse grid only where it stands: in the sonar it reads as a flat, quiet
// plane with the ground's edges showing through it.
function buildWater(world) {
  const b = new MeshBuilder(40000);
  const step = 4;
  const half = world.half;
  b.identity();
  for (let z = -half; z < half; z += step) {
    for (let x = -half; x < half; x += step) {
      const x1 = x + step, z1 = z + step;
      if (world.water.depth(x + step / 2, z + step / 2) < 0.05) continue;
      const y = LEVEL;
      // (the diagonal is hidden: a calm surface, not a grid of triangles)
      b.quad([x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1], KIND.WATER, 15);
    }
  }
  const geo = b.toGeometry();
  const mesh = new THREE.Mesh(geo, world.material);
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  mesh.userData.water = true;
  world.scene.add(mesh);
  world.meshes.push(mesh);
  world.waterTris = b.count / 3;
}
