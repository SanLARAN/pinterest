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
import { buildCrewCar } from '../game/uaz.js'; // (3.0l) the crew's УАЗ is the garage's car, not a new one

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
  { id: 'camp-bridges', w: 2.6, pts: [[14, 8], [40, 22], [70, 36], [88, 46], [100, 48]] },
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

// (3.0k) a plank deck from a to b — and it is a *thing you walk on*, not a painted stripe: it follows the
// peat it crosses, so a boardwalk climbs over an island and stands on posts over the channels, and its
// handrails are beams with a collider behind them.
function deck(world, b, ax, az, bx, bz, w, ya, yb = ya) {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.4) return;
  const ux = dx / len, uz = dz / len; // along
  const px = -uz, pz = ux; // across
  const yAt = (t) => ya + (yb - ya) * t;
  const hw = w / 2;
  const plank = 1.5;
  const n = Math.max(1, Math.round(len / plank));
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const x0 = ax + dx * t0, z0 = az + dz * t0, x1 = ax + dx * t1, z1 = az + dz * t1;
    const y0 = yAt(t0), y1 = yAt(t1);
    // the walking surface (a quad with its diagonal hidden)
    b.identity();
    // (3.0i) wound to face UP: the world material culls back faces, and a deck wound the other way is not
    // dark, it is simply not there
    b.quadN([x0 - px * hw, y0, z0 - pz * hw], [x1 - px * hw, y1, z1 - pz * hw],
      [x1 + px * hw, y1, z1 + pz * hw], [x0 + px * hw, y0, z0 + pz * hw], [0, 1, 0], KIND.WOOD, 15);
    // the edge board, so the deck reads at a glance from a low echo
    for (const s of [-1, 1]) {
      const ex = px * hw * s, ez = pz * hw * s;
      b.tri([x0 + ex, y0, z0 + ez], [x1 + ex, y1, z1 + ez], [x1 + ex, y1 - 0.11, z1 + ez], KIND.WOOD, 6);
      b.tri([x0 + ex, y0, z0 + ez], [x1 + ex, y1 - 0.11, z1 + ez], [x0 + ex, y0 - 0.11, z0 + ez], KIND.WOOD, 5);
    }
  }
  // the handrail: a top beam at a metre and a mid rail under it, on both edges — exactly where the
  // colliders run, so what you see is what stops you (3.0k)
  for (const s of [-1, 1]) {
    const ox = px * (hw - 0.1) * s, oz = pz * (hw - 0.1) * s;
    b.identity();
    b.limb([ax + ox, ya + 1.02, az + oz], [bx + ox, yb + 1.02, bz + oz], 0.048, 0.048, KIND.WOOD, 4);
    b.limb([ax + ox, ya + 0.54, az + oz], [bx + ox, yb + 0.54, bz + oz], 0.032, 0.032, KIND.WOOD, 4);
    // a post every six metres, so the rail has something to stand on all the way along
    for (let d = 0; d < len; d += 6) {
      const x = ax + ux * d, z = az + uz * d, y = yAt(d / len);
      b.limb([x + ox, y - 0.02, z + oz], [x + ox, y + 1.08, z + oz], 0.05, 0.045, KIND.WOOD, 4);
    }
  }
  // posts down to the peat, every four metres, one pair
  for (let d = 1.2; d < len; d += 4) {
    const x = ax + ux * d, z = az + uz * d, y = yAt(d / len);
    const g = world.terrain.height(x, z);
    if (y <= g + 0.02) continue; // this stretch lies on the ground: there is nothing to stand on
    for (const s of [-1, 1]) {
      const ox = px * (hw - 0.16) * s, oz = pz * (hw - 0.16) * s;
      b.identity();
      b.limb([x + ox, y, z + oz], [x + ox, Math.min(g - 0.2, y - 0.3), z + oz], 0.075, 0.075, KIND.WOOD, 4);
    }
  }
}

// (3.0k) a leg of boardwalk — and it is a thing you walk on, not a painted stripe. Its surface runs from
// one end to the other (over a channel that is a level deck on posts, between two islands a gentle ramp),
// its handrails are beams, and behind each handrail is a collider, so the edge of a road is where you stop.
// Only the two ends of a road are open: that is where you step on and off.
function deckLeg(world, ax, az, bx, bz, w, openA = true, openB = true) {
  const len = Math.hypot(bx - ax, bz - az);
  if (len < 0.4) return;
  const yOf = (x, z) => Math.max(LEVEL + 0.14, world.terrain.height(x, z) + 0.05); // a hand over the water
  const ya = yOf(ax, az), yb = yOf(bx, bz);
  world.addProp((ax + bx) / 2, (az + bz) / 2, (b) => deck(world, b, ax, az, bx, bz, w, ya, yb));
  world.walks.push({ ax, az, bx, bz, w, y: (ya + yb) / 2, ya, yb });
  // the rails, as things: a capsule along each edge, stopping short of the ends of the road
  const ux = (bx - ax) / len, uz = (bz - az) / len, px = -uz, pz = ux;
  const s0 = openA ? 0.6 : 0, s1 = len - (openB ? 0.6 : 0);
  if (s1 - s0 < 0.4) return;
  for (const s of [-1, 1]) {
    const ox = px * (w / 2) * s, oz = pz * (w / 2) * s;
    world.col.add(ax + ux * s0 + ox, az + uz * s0 + oz, ax + ux * s1 + ox, az + uz * s1 + oz, 0.08, 1.4, CAP.WOOD);
  }
}

function addWalk(world, walk) {
  const n = walk.pts.length;
  for (let i = 0; i < n - 1; i++) {
    const [ax, az] = walk.pts[i], [bx, bz] = walk.pts[i + 1];
    deckLeg(world, ax, az, bx, bz, walk.w, i === 0, i === n - 2);
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
  // and the lagoon the camp stands on: the bog has to be *there* when you open your eyes, not fifteen metres of
  // dry peat away (3.0i). You wake facing it — the fire ring is the last dry thing before the shore.
  terr.addBasin(2, 21, 14, 1.6);
  // (3.0k) and the drowned channel at the bridges place: a long cut across the island (two basins make one
  // channel), so the three spans cross water instead of lying on the peat
  terr.addBasin(95, 62, 8.5, 1.3);
  terr.addBasin(109, 62, 8.5, 1.3);
  // (3.0l) the old track out of the camp, and the flooded проезд in it. The road itself has to be a road: a
  // raised strip of peat and gravel across the bog, dry except for the one place the water has taken it. Without
  // that the "road" would be indistinguishable from the rest of the участок, and the УАЗ would be parked in a pond.
  for (let d = 14; d <= 62; d += 2.6) terr.addFlat(CAMP_TRACK.x * d, CAMP_TRACK.z * d, 4.0, LEVEL + 0.52);
  for (const F of CAMP_FLOODS) terr.addBasin(F.x, F.z, F.r, F.depth);
  terr.finalize();

  for (const L of world.landmarks) {
    const fn = PLACES[L.id];
    if (fn) fn(world, L, rng);
  }
  for (const W of WALKS) addWalk(world, W);

  genPumps(world, rng);
  genCar(world);
  genCrewCar(world); // (3.0l) the car they came in: at the bank, and it is not going anywhere
  genGrowth(world, rng);

  world.navigation = new ForestNavigation(world);
  world.buildChunks();
  buildWater(world);
  world.waterMesh = true;
  world.genTime = performance.now() - t0;
  return world;
}

// (3.0l) The camp is a base at the end of a washed-out track, not a picnic: two ridge tents for four people,
// the fire, the day book, and — east of it — the flooded проезд the crew's УАЗ could not get through. It is a
// place on a shift: you wake here, the pump is here, the road out is here and it is under water.
export const CAMP_FLOOD = { x: 17.6, z: 6.4, r: 4.0, depth: 1.3 };
export const CAMP_FLOODS = [CAMP_FLOOD];
export const CAMP_TRACK = { x: 0.94, z: 0.34 }; // which way the track runs, out of the camp
const CAMP_PUMP = { x: 12.6, z: 0.9 }; // (3.0l) the pump sits at the проезд, where the water is

function placeCamp(world, L, rng) {
  const gy = (x, z) => world.terrain.height(x, z);
  const y = gy(L.x, L.z);
  // a ridge tent: two poles, two slopes, a floor — the same one the forest camp has, twice, for four
  const tent = (b, tx, tz, ry) => {
    const ty = gy(tx, tz);
    b.place(tx, ty, tz, 0, ry, 0);
    const base = b.m.clone();
    b.limb([-1.6, 0.02, 0], [0, 1.55, 0], 0.05, 0.045, KIND.WOOD, 4);
    b.limb([1.6, 0.02, 0], [0, 1.55, 0], 0.05, 0.045, KIND.WOOD, 4);
    b.tri([-1.75, 0, -1.3], [1.75, 0, -1.3], [0, 1.58, 0], KIND.LEAF, 1);
    b.tri([1.75, 0, 1.3], [-1.75, 0, 1.3], [0, 1.58, 0], KIND.LEAF, 1);
    b.quadN([-1.75, 0, -1.3], [1.75, 0, -1.3], [1.75, 0, 1.3], [-1.75, 0, 1.3], [0, -1, 0], KIND.LEAF);
    // a bedroll, rolled up under the flap against the rain
    sub(b, base, -1.1, 0.12, 1.55, 0, 0.2, Math.PI / 2);
    b.cylinder(7, 0.16, 0.16, 0.9, KIND.WOOD);
  };
  world.addProp(L.x, L.z, (b) => {
    b.identity();
    tent(b, L.x - 4.4, L.z - 2.8, 0.34);
    tent(b, L.x + 3.2, L.z - 4.4, -0.5);
    // the fire ring, on the fire itself (Campfire stands at the camp's own origin)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283;
      b.place(L.x + Math.cos(a) * 0.72, y, L.z + Math.sin(a) * 0.72, 0, a, 0);
      b.rock(0.22, () => rng.next(), KIND.ROCK, 0.3, 0.6);
    }
    // two logs to sit on
    for (const [lx, lz, ry, len] of [[-2.1, 1.9, 0.5, 1.9], [2.2, 1.5, -0.7, 1.7]]) {
      b.place(L.x + lx, y, L.z + lz, 0, ry, 0);
      b.cylinder(7, 0.19, 0.19, len, KIND.BARK);
    }
    // crates: the shift's kit, stacked by the first tent
    b.place(L.x - 6.4, y, L.z - 0.6, 0, 0.6, 0);
    b.box(0.9, 0.55, 0.6, KIND.WOOD, { bottom: true });
    b.place(L.x - 6.2, y + 0.55, L.z - 0.5, 0, 0.15, 0);
    b.box(0.7, 0.4, 0.5, KIND.WOOD, { bottom: true });
    // the fuel drum and a hand lamp on it
    b.place(L.x + 4.2, y, L.z + 2.0, 0, 0.4, 0);
    b.cylinder(8, 0.29, 0.29, 0.88, KIND.METAL, { capTop: true });
    b.place(L.x + 4.2, y + 0.88, L.z + 2.0);
    b.box(0.14, 0.2, 0.14, KIND.METAL);
    // a work table with the day book: the shift's log, one page a night
    b.place(L.x - 1.4, y + 0.72, L.z + 3.0, 0, 0.2, 0);
    b.box(1.5, 0.09, 0.8, KIND.WOOD, { bottom: true });
    b.place(L.x - 1.4, y + 0.8, L.z + 3.0, 0, 0.2, 0);
    b.box(0.34, 0.02, 0.26, KIND.BONE); // the log book
    for (const [sx, sz] of [[-0.62, -0.3], [0.62, -0.3], [-0.62, 0.3], [0.62, 0.3]]) {
      b.place(L.x - 1.4 + sx, y, L.z + 3.0 + sz);
      b.limb([0, 0, 0], [0, 0.72, 0], 0.04, 0.04, KIND.WOOD, 4);
    }
  });
}

// A place's own frame. `MeshBuilder.place()` takes world coordinates, so a building written out in local
// metres has to be mapped through this — the bug it fixes (3.0i): the pump shed and the barracks were opened
// with `b.place(L.x, y, L.z)` and then written out from (0, 0, 0), which put both of them on the camp's
// doorstep. The barracks roof, two metres over the spawn point, *was* the «низкая крыша» you woke up under.
function siteOf(L, ry = L.ry || 0) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const y = L.y ?? 0;
  return (x, z, dy = 0) => [L.x + x * cs + z * sn, y + dy, L.z - x * sn + z * cs];
}

// the pump shed: open-fronted, a master pump, a pipe running out into the bog
function placeStation(world, L, rng) {
  const y = world.terrain.height(L.x, L.z);
  const ry = L.ry || 0;
  const P = siteOf({ ...L, y }, ry);
  world.addProp(L.x, L.z, (b) => {
    b.identity();
    // floor
    b.place(...P(0, 0, 0), 0, ry, 0);
    b.box(6.4, 0.18, 5.0, KIND.WOOD, { bottom: true });
    // three walls and a roof (the fourth side is the way in)
    b.place(...P(0, -2.4, 0.18), 0, ry, 0);
    b.box(6.4, 2.4, 0.16, KIND.WOOD, { bottom: true });
    b.place(...P(-3.1, 0, 0.18), 0, ry, 0);
    b.box(0.16, 2.4, 5.0, KIND.WOOD, { bottom: true });
    b.place(...P(3.1, 0, 0.18), 0, ry, 0);
    b.box(0.16, 2.4, 5.0, KIND.WOOD, { bottom: true });
    b.place(...P(0, -0.2, 2.68), 0.08, ry, 0);
    b.box(6.9, 0.14, 5.6, KIND.METAL);
    // the pump itself: a squat drum with a flywheel and a rising main
    b.place(...P(-1.2, 0.6, 0.2), 0, ry + 0.4, 0);
    const pump = b.m.clone();
    b.cylinder(10, 0.55, 0.5, 1.15, KIND.METAL, { capTop: true });
    sub(b, pump, 0, 1.2, 0);
    b.cylinder(8, 0.22, 0.22, 0.35, KIND.METAL, { capTop: true });
    sub(b, pump, 0.62, 0.6, 0, 0, 0, Math.PI / 2);
    b.cylinder(12, 0.42, 0.42, 0.12, KIND.METAL);
    // suction pipe into the water (a limb is local to the transform it is drawn in)
    b.place(...P(-1.2, 0.6, 0.2), 0, ry + 0.4, 0);
    b.limb([0, 0.35, 0], [0, 0.35, 3.6], 0.17, 0.17, KIND.METAL, 6);
    b.limb([0, 0.35, 3.6], [0, -0.6, 3.6], 0.17, 0.17, KIND.METAL, 6);
  });
  // the three closed sides, in the same frame
  for (const [x0, z0, x1, z1] of [[-3.2, -2.5, 3.2, -2.5], [-3.1, -2.4, -3.1, 2.4], [3.1, -2.4, 3.1, 2.4]]) {
    const a = P(x0, z0), c = P(x1, z1);
    world.col.add(a[0], a[2], c[0], c[2], 0.2, 2.8, CAP.WOOD);
  }
}

// the flooded barracks: a long hut on stilts, the water inside it ankle-deep
function placeBarracks(world, L, rng) {
  const y = world.terrain.height(L.x, L.z);
  const ry = L.ry || 0;
  const W = 11, D = 5.2, FLOOR = 0.9;
  const P = siteOf({ ...L, y }, ry);
  world.addProp(L.x, L.z, (b) => {
    b.identity();
    // stilts
    for (const sx of [-W / 2 + 0.5, 0, W / 2 - 0.5]) {
      for (const sz of [-D / 2 + 0.4, D / 2 - 0.4]) {
        b.place(...P(sx, sz, -0.4));
        b.limb([0, 0, 0], [0, FLOOR + 0.4, 0], 0.13, 0.11, KIND.WOOD, 5);
        const p = P(sx, sz);
        world.col.circle(p[0], p[2], 0.16, 1.6, CAP.WOOD);
      }
    }
    // deck, walls, roof — the roof sagging, one leaf missing
    b.place(...P(0, 0, FLOOR), 0, ry, 0);
    b.box(W, 0.16, D, KIND.WOOD, { bottom: true });
    b.place(...P(0, -D / 2 + 0.1, FLOOR + 0.16), 0, ry, 0);
    b.box(W, 2.5, 0.14, KIND.WOOD, { bottom: true });
    b.place(...P(-W / 2 + 0.08, 0, FLOOR + 0.16), 0, ry, 0);
    b.box(0.14, 2.2, D, KIND.WOOD, { bottom: true });
    b.place(...P(W / 2 - 0.08, 0, FLOOR + 0.16), 0, ry, 0);
    b.box(0.14, 2.2, D, KIND.WOOD, { bottom: true });
    b.place(...P(0, 0, FLOOR + 2.5), 0.05, ry, 0.03);
    b.box(W + 0.8, 0.16, D + 0.9, KIND.METAL);
    // the bunks inside, and the water that got in
    for (let i = -1; i <= 1; i++) {
      b.place(...P(i * 3.2, 1.3, FLOOR + 0.16), 0, ry, 0);
      b.box(1.9, 0.1, 0.8, KIND.WOOD, { bottom: true });
      b.limb([-0.85, 0, 0], [-0.85, 0.5, 0], 0.04, 0.04, KIND.METAL, 3);
      b.limb([0.85, 0, 0], [0.85, 0.5, 0], 0.04, 0.04, KIND.METAL, 3);
    }
  });
  // the three closed sides, in the same frame
  for (const [x0, z0, x1, z1] of [[-W / 2, -D / 2, -W / 2, D / 2], [-W / 2, -D / 2, W / 2, -D / 2], [W / 2, -D / 2, W / 2, D / 2]]) {
    const a = P(x0, z0), c = P(x1, z1);
    world.col.add(a[0], a[2], c[0], c[2], 0.2, 3.4, CAP.WOOD);
  }
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

// three short bridges over the drowned channel — parallel spans, so each one is a way across (3.0k)
function placeBridges(world, L, rng) {
  for (let i = 0; i < 3; i++) {
    const x = L.x - 8 + i * 8;
    deckLeg(world, x, L.z - 11, x, L.z + 11, 2.2, true, true);
  }
}

export const PLACES = {
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
    if (id === 'camp') { px = L.x + CAMP_PUMP.x; pz = L.z + CAMP_PUMP.z; }
    // (3.0k) the bridges pump stands on the shore of the channel, not in it: the shed, the flywheel and the
    // man who came out to start it all have to be on dry ground
    else if (id === 'bridges') { px = L.x - 12; pz = L.z + 10; }
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
      const base = b.m.clone();
      // a base plate on the wet ground
      b.box(1.5, 0.16, 1.1, KIND.METAL, { bottom: true });
      // the two columns of a hand pump
      sub(b, base, -0.34, 0.16, 0);
      b.limb([0, 0, 0], [0, 1.15, 0], 0.16, 0.13, KIND.METAL, 6);
      sub(b, base, 0.34, 0.16, 0);
      b.limb([0, 0, 0], [0, 1.15, 0], 0.16, 0.13, KIND.METAL, 6);
      // the head, the lever, the flywheel
      sub(b, base, 0, 1.3, 0);
      b.box(1.15, 0.34, 0.5, KIND.METAL, { bottom: true });
      sub(b, base, -0.62, 1.34, 0, 0, 0, -0.55);
      b.limb([0, 0, 0], [0, 1.5, 0], 0.055, 0.05, KIND.METAL, 4);
      sub(b, base, 0.62, 1.36, 0.28, 0, 0, Math.PI / 2);
      b.cylinder(12, 0.36, 0.36, 0.1, KIND.METAL);
      // the rising main, elbow, and a standpipe
      sub(b, base, 0, 1.32, -0.25);
      b.limb([0, 0, 0], [0, 0.9, 0], 0.1, 0.1, KIND.METAL, 5);
      b.limb([0, 0.9, 0], [0, 0.9, -1.7], 0.1, 0.1, KIND.METAL, 5);
      b.limb([0, 0.9, -1.7], [0, -0.35, -1.7], 0.1, 0.1, KIND.METAL, 5);
      // the valve stand
      sub(b, base, -0.95, 0.16, 0.5, 0, 0, 0);
      b.limb([0, 0, 0], [0, 0.85, 0], 0.05, 0.045, KIND.METAL, 4);
      sub(b, base, 0, 0.85, 0, 0, 0, Math.PI / 2);
      b.cylinder(10, 0.18, 0.18, 0.06, KIND.METAL);
    });
    world.col.circle(px, pz, 0.75, 1.7, CAP.METAL);
    // a work lamp on a pole, like a generator's
    const [hx, hz] = [0.9 * Math.cos(yaw), -0.9 * Math.sin(yaw)];
    site.lamp = { x: px + hx, y: y + 2.9, z: pz + hz };
    world.addProp(px + hx, pz + hz, (b) => {
      b.identity();
      b.place(px + hx, y, pz + hz);
      const base = b.m.clone();
      b.limb([0, 0, 0], [0, 3.0, 0], 0.055, 0.04, KIND.METAL, 5);
      sub(b, base, 0, 2.86, 0);
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
  const P = { x: x - 8.5, z: z + 14 };
  P.y = world.terrain.height(P.x, P.z);
  // (3.0f) the car is the only prop that moves: it is built as its own mesh, not baked into the chunk, so the
  // winch can lift it out of the water one frame at a time
  const b = new MeshBuilder(240);
  b.identity();
  b.place(0, 0.38, -0.3);
  b.box(1.86, 0.72, 4.3, KIND.METAL); // body
  b.place(0, 0.78, 1.15);
  b.box(1.7, 0.66, 3.1, KIND.LEAF); // canvas top
  b.place(0, 0.6, -1.85);
  b.box(1.7, 0.36, 1.0, KIND.METAL); // bonnet
  for (const [wx, wz] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
    b.place(wx, 0.36, wz, 0, 0, Math.PI / 2);
    b.cylinder(10, 0.36, 0.36, 0.26, KIND.BARK);
  }
  // the winch drum on the nose
  b.place(0, 0.46, -2.5, 0, 0, Math.PI / 2);
  b.cylinder(8, 0.16, 0.16, 0.42, KIND.METAL);
  const geo = b.toGeometry();
  const node = new THREE.Mesh(geo, world.material);
  node.position.set(x, y, z);
  node.rotation.y = yaw;
  node.matrixAutoUpdate = true;
  node.updateMatrix();
  node.userData.car = true;
  world.scene.add(node);
  world.meshes.push(node);
  world.car = { x, z, y, baseY: y, yaw, node, post: P };
  world.col.add(x - 1.1, z - 2.2, x + 1.1, z + 2.2, 0.35, 1.6, CAP.METAL);
  // the post the cable is tied to
  world.addProp(P.x, P.z, (b) => {
    b.identity();
    b.place(P.x, P.y, P.z, 0.14, 0.6, 0.1);
    const base = b.m.clone();
    b.limb([0, 0, 0], [0, 3.0, 0], 0.15, 0.12, KIND.WOOD, 5);
    sub(b, base, 0, 2.6, 0);
    b.box(0.9, 0.12, 0.12, KIND.WOOD);
  });
  world.col.circle(P.x, P.z, 0.2, 3.0, CAP.WOOD);
}

// ---------------------------------------------------------------- growth

// A piece hung on a prop that is already in the world: `MeshBuilder.place()` is absolute, so `b.place(0, 2, 0)`
// means *the map's origin*, not "two metres up this tree". Writing a pine's skirts that way stacked them all at
// (0, 2.4, 0) — the invisible panel over the spawn point in 3.0i. `sub()` maps local coordinates through the
// prop's own matrix instead. The base is passed in and never re-read from `b`: composing on `b.m` a second time
// would stack each piece on the last one and walk the clump off its stump.
// (3.0l) Where the crew's car stopped: the near bank of the flooded проезд, found on the ground itself rather
// than guessed. The whole opening hangs off these points — the film, the hose, the marker — so they are
// measured once, here, and read by name.
function fitCampSet(world) {
  const site = world.sites.find((s) => s.id === 'camp');
  const T = CAMP_TRACK;
  const depth = (x, z) => world.water.depth(x, z);
  const pump = { x: CAMP_PUMP.x, z: CAMP_PUMP.z };
  pump.y = world.terrain.height(pump.x, pump.z);
  pump.yaw = Math.atan2(pump.x, pump.z); // its nose looks back at the camp
  // the flooded stretch, measured along the track: where the water starts and where the road comes out again
  let near = null, far = null;
  for (let d = 1; d < 40; d += 0.1) {
    const x = T.x * d, z = T.z * d;
    if (depth(x, z) > 0.06) {
      if (!near) near = { x, z, d };
    } else if (near) { far = { x, z, d }; break; }
  }
  if (!near) near = { x: CAMP_FLOOD.x - 4, z: CAMP_FLOOD.z - 1.5, d: 12 };
  if (!far) far = { x: near.x + 9, z: near.z + 3.3, d: near.d + 9 };
  // the crew's car: on the outer bank, nose to the water — it is as far as the road went
  const nose = { x: -T.x, z: -T.z };
  const car = { x: far.x + T.x * 3.4, z: far.z + T.z * 3.4, nose };
  // (the car is built in the garage's frame — nose toward -x, driver's side +z — so its yaw is not the box's)
  car.yaw = Math.atan2(nose.z, -nose.x);
  car.y = world.terrain.height(car.x, car.z);
  // the suction hose goes into the water on the camp side of it, where the pump is
  const toWater = (() => {
    const dx = CAMP_FLOOD.x - pump.x, dz = CAMP_FLOOD.z - pump.z, l = Math.hypot(dx, dz) || 1;
    return { x: dx / l, z: dz / l };
  })();
  const side = { x: -toWater.z, z: toWater.x };
  let water = { x: pump.x + toWater.x * 9, z: pump.z + toWater.z * 9 };
  for (let d = 1; d < 12; d += 0.2) {
    const x = pump.x + toWater.x * d, z = pump.z + toWater.z * d;
    if (depth(x, z) > 0.22) { water = { x: x + toWater.x * 0.8, z: z + toWater.z * 0.8 }; break; }
  }
  // where each of the four works: all on the camp side of the pump, within arm's reach of each other
  const at = (f, s) => ({ x: pump.x + toWater.x * f + side.x * s, z: pump.z + toWater.z * f + side.z * s });
  return {
    pump: { ...pump, site },
    car,
    near,
    far,
    water,
    hose: at(-0.2, 1.35),
    crank: at(-0.75, -0.95),
    prime: at(-0.8, 0.95),
    marker: { x: near.x - toWater.x * 1.1, z: near.z - toWater.z * 1.1 },
    sign: { x: car.x + T.x * 2.4 + side.x * 2.6, z: car.z + T.z * 2.4 + side.z * 2.6 },
    toWater,
    side,
  };
}

function genCrewCar(world) {
  const set = fitCampSet(world);
  world.campSet = set;
  const { x, z, y, yaw, nose } = set.car;
  const node = buildCrewCar(world.material);
  node.position.set(x, y, z);
  node.rotation.y = yaw;
  node.updateMatrix();
  world.scene.add(node);
  world.crewCar = { x, z, y, yaw, nose, node };
  // it is 4.4 m long and 1.8 wide, and it stands across the road: a capsule along its own nose axis
  world.col.add(x + nose.x * 1.9, z + nose.z * 1.9, x - nose.x * 1.9, z - nose.z * 1.9, 0.95, 1.6, CAP.METAL);

  // the suction hose, from the pump's inlet down to the water; the film drags it out, the shift leaves it there
  world.addProp(set.hose.x, set.hose.z, (bb) => {
    bb.identity();
    const pts = [[CAMP_PUMP.x + 0.35, CAMP_PUMP.z + 0.45], [set.hose.x, set.hose.z], [set.water.x, set.water.z]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      bb.limb([ax, world.terrain.height(ax, az) + 0.1, az], [bx, world.terrain.height(bx, bz) + 0.1, bz], 0.1, 0.1, KIND.METAL, 5);
    }
    const [sx, sz] = pts[pts.length - 1];
    bb.place(sx, world.terrain.height(sx, sz) + 0.04, sz, Math.PI / 2, 0.7, 0);
    bb.cylinder(8, 0.19, 0.19, 0.46, KIND.METAL, { capTop: true }); // the strainer, in the water
  });

  // the sign at the bank: a board on a leaning post, and the red rag on it — «проезд затоплен»
  const sx = set.sign.x, sz = set.sign.z;
  const sy = world.terrain.height(sx, sz);
  world.addProp(sx, sz, (bb) => {
    bb.identity();
    bb.place(sx, sy, sz, 0.07, 0.8, 0.11);
    bb.limb([0, 0, 0], [0, 1.5, 0], 0.06, 0.05, KIND.WOOD, 4);
    bb.place(sx, sy + 1.32, sz, 0.07, 0.8, 0.11);
    bb.box(0.9, 0.42, 0.05, KIND.WOOD, { bottom: true });
    bb.place(sx, sy + 1.5, sz, 0.07, 0.8, 0.11);
    bb.box(0.2, 0.15, 0.03, KIND.EFFIGY); // the rag
    bb.place(sx, sy + 0.95, sz, 0.07, 0.8, 0.11);
    bb.box(0.5, 0.03, 0.03, KIND.BONE); // a scrawled arrow
  });

  // the two ruts of the old track, in and out of the water, and the stakes that used to mark it
  world.addProp(CAMP_TRACK.x * 16, CAMP_TRACK.z * 16, (bb) => {
    bb.identity();
    for (let t = 26; t <= 56; t++) {
      for (const off of [-0.55, 0.55]) {
        const ax = CAMP_TRACK.x * t - CAMP_TRACK.z * off;
        const az = CAMP_TRACK.z * t + CAMP_TRACK.x * off;
        if (world.water.depth(ax, az) > 0.1) continue; // (under the water you cannot see it anyway)
        const ay = world.terrain.height(ax, az) + 0.035;
        bb.quadN([ax - 0.16, ay, az - 0.16], [ax + 0.16, ay, az - 0.16], [ax + 0.16, ay, az + 0.16], [ax - 0.16, ay, az + 0.16], [0, 1, 0], KIND.TRAIL_RUT, 30);
      }
    }
    for (const t of [25, 57, 59]) {
      const px = CAMP_TRACK.x * t + 2.2, pz = CAMP_TRACK.z * t - 1.4;
      const py = world.terrain.height(px, pz);
      bb.place(px, py, pz, 0.05, 0.4, 0.06);
      bb.limb([0, 0, 0], [0, 0.85, 0], 0.04, 0.035, KIND.WOOD, 4);
    }
  });
}


const _subM = new THREE.Matrix4(), _subQ = new THREE.Quaternion(), _subE = new THREE.Euler(),
  _subV = new THREE.Vector3(), _subS = new THREE.Vector3();
function sub(b, base, lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _subE.set(rx, ry, rz, 'YXZ');
  _subQ.setFromEuler(_subE);
  _subV.set(lx, ly, lz);
  _subS.set(sx, sy, sz);
  b.setMatrix(_subM.compose(_subV, _subQ, _subS).premultiply(base));
}

function genGrowth(world, rng) {
  const half = world.half - 12;
  const noise = new Simplex2(BOG.seed + 7);
  const clear = (x, z, pad) => !world.inLandmark(x, z, pad) && !world.onWalk(x, z, pad);
  const dry = (x, z) => world.water.depth(x, z) <= 0.02;
  // how thick the cover is here: broad patches, so the bog has thickets and open lawns instead of a speckle
  const thick = (x, z, sc = 55) => 0.5 + 0.5 * noise.fbm(x / sc, z / sc, 2);

  // ---- dead trees standing in the water: the drowned forest the bog swallowed
  for (let i = 0; i < 1500; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    const d = world.water.depth(x, z);
    if (d < 0.12 || d > 1.9) continue;
    if (!clear(x, z, 2) || !world.col.free(x, z, 1.1)) continue;
    if (rng.next() > 0.35 + 0.65 * thick(x, z, 70)) continue;
    const h = rng.float(1.8, 6.2), r = rng.float(0.1, 0.28);
    const lean = rng.float(-0.14, 0.14), lean2 = rng.float(-0.14, 0.14);
    const broken = rng.chance(0.35);
    const y = world.terrain.height(x, z);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y - 0.25, z, lean, rng.float(0, 6.28), lean2);
      // a root flare in the mud, then the trunk (a broken one is a snapped stump)
      b.limb([0, -0.15, 0], [0, 0.5, 0], r * 2.1, r * 1.25, KIND.BARK, 5);
      if (broken) b.limb([0, 0.5, 0], [0, h * 0.45, 0], r * 1.15, r * 0.75, KIND.BARK, 5);
      else {
        b.limb([0, 0.5, 0], [rng.float(-0.25, 0.25), h * 0.72, rng.float(-0.25, 0.25)], r * 1.1, r * 0.6, KIND.BARK, 5);
        b.limb([0, h * 0.7, 0], [rng.float(-0.5, 0.5), h, rng.float(-0.5, 0.5)], r * 0.6, r * 0.16, KIND.BARK, 4);
        for (let k = 0; k < 2; k++) { // two gaunt limbs off the upper trunk
          const a = rng.float(0, 6.28), up = h * rng.float(0.55, 0.85);
          b.limb([0, up, 0], [Math.cos(a) * rng.float(0.7, 1.6), up + rng.float(0.3, 1.1), Math.sin(a) * rng.float(0.7, 1.6)], r * 0.34, 0.025, KIND.BARK, 3);
        }
      }
    });
    world.col.circle(x, z, Math.max(0.22, r * 1.3), 3.4, CAP.TREE);
  }

  // ---- dwarf pines on the dry peat: bent trunks, flat skirts of needles
  for (let i = 0; i < 2800; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (!dry(x, z) || !clear(x, z, 2)) continue;
    if (!world.col.free(x, z, 1.3) || rng.next() > thick(x, z, 48) * 0.9) continue;
    const h = rng.float(1.6, 4.6), r = rng.float(0.09, 0.2);
    const lean = rng.float(-0.16, 0.16), lean2 = rng.float(-0.16, 0.16);
    const y = world.terrain.height(x, z);
    const tiers = rng.int(2, 4);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y, z, lean, rng.float(0, 6.28), lean2);
      const base = b.m.clone();
      b.limb([0, 0, 0], [0.05, h * 0.55, -0.04], r * 1.3, r * 0.8, KIND.BARK, 4);
      b.limb([0.05, h * 0.5, -0.04], [rng.float(-0.35, 0.35), h, rng.float(-0.35, 0.35)], r * 0.8, r * 0.3, KIND.BARK, 4);
      for (let k = 0; k < tiers; k++) {
        const t = 0.42 + (k / tiers) * 0.62; // up the trunk
        const rr = rng.float(0.55, 1.05) * (1.15 - t * 0.55);
        sub(b, base, 0, h * t, 0, 0, rng.float(0, 6.28), 0);
        // a skirt: a squat cone of needles, the cheapest thing that reads as a pine from below
        b.cone(6, rr, rr * 0.72, KIND.LEAF, { y0: 0, hideRibs: true });
      }
    });
    world.col.circle(x, z, Math.max(0.2, r * 1.2), 3.0, CAP.TREE);
  }

  // ---- willow scrub: clumps of whippy stems with a leafy head, along the water and in the wet peat
  for (let i = 0; i < 2400; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.42 || !clear(x, z, 1.5)) continue;
    if (!world.col.free(x, z, 1.0) || rng.next() > 0.25 + thick(x, z, 34) * 0.85) continue;
    const y = world.terrain.height(x, z);
    const n = rng.int(3, 6), hh = rng.float(0.9, 2.1);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y, z, 0, rng.float(0, 6.28), 0);
      const base = b.m.clone();
      for (let k = 0; k < n; k++) {
        b.setMatrix(base);
        const a = (k / n) * 6.283 + rng.float(-0.3, 0.3);
        const lean = rng.float(0.25, 0.75), h = hh * rng.float(0.75, 1.15);
        const tx = Math.cos(a) * lean, tz = Math.sin(a) * lean;
        b.limb([0, 0, 0], [tx, h, tz], 0.035, 0.014, KIND.BARK, 3);
        // the head: a small leaf cluster at the tip
        sub(b, base, tx, h, tz, 0, rng.float(0, 6.28), rng.float(0, 1), rng.float(1.5, 2.4), rng.float(1.1, 1.8), rng.float(1.5, 2.4));
        b.rock(rng.float(0.16, 0.3), () => rng.next(), KIND.LEAF, 0.5, 0.8);
      }
    });
  }

  // ---- reeds at the shore: the thin palisade between water and peat
  for (let i = 0; i < 1800; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    const d = world.water.depth(x, z);
    if (d < 0.03 || d > 0.55 || !clear(x, z, 1)) continue;
    if (rng.next() > 0.45 + thick(x, z, 22) * 0.55) continue;
    const y = world.terrain.height(x, z);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y, z, 0, rng.float(0, 6.28), 0);
      const n = rng.int(5, 9);
      for (let k = 0; k < n; k++) {
        const ox = rng.float(-0.34, 0.34), oz = rng.float(-0.34, 0.34);
        const hh = rng.float(0.75, 1.75);
        b.limb([ox, -0.12, oz], [ox + rng.float(-0.1, 0.1), hh, oz + rng.float(-0.1, 0.1)], 0.02, 0.007, KIND.LEAF, 3);
      }
    });
  }

  // ---- tussocks: the clumps of coarse grass every metre of a bog is made of
  for (let i = 0; i < 5600; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.28 || !clear(x, z, 0.6) || !world.col.free(x, z, 0.6)) continue;
    const y = world.terrain.height(x, z);
    const n = rng.int(3, 6), sc = rng.float(0.7, 1.25);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y - 0.05, z, 0, rng.float(0, 6.28), 0, sc);
      // a low hummock of peat under the blades
      b.rock(0.34, () => rng.next(), KIND.GROUND, 0.3, 0.42);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 6.283 + rng.float(-0.5, 0.5);
        const lean = rng.float(0.14, 0.4), h = rng.float(0.3, 0.7);
        b.limb([0, 0.1, 0], [Math.cos(a) * lean, h, Math.sin(a) * lean], 0.028, 0.006, KIND.LEAF, 3);
      }
    });
  }

  // ---- cotton grass: the white tufts that give a raised bog its colour
  for (let i = 0; i < 1700; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.3 || !clear(x, z, 0.8) || !world.col.free(x, z, 0.7) || rng.next() > 0.5) continue;
    const y = world.terrain.height(x, z);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y, z, 0, rng.float(0, 6.28), 0);
      const base = b.m.clone();
      const n = rng.int(3, 6);
      for (let k = 0; k < n; k++) {
        b.setMatrix(base);
        const ox = rng.float(-0.22, 0.22), oz = rng.float(-0.22, 0.22), h = rng.float(0.35, 0.72);
        b.limb([ox, 0, oz], [ox, h, oz], 0.008, 0.006, KIND.LEAF, 3);
        sub(b, base, ox, h, oz, 0, 0, 0.5, 1.6, 1, 1.6);
        b.rock(0.05, () => rng.next(), KIND.BONE, 0.45, 0.9);
      }
    });
  }

  // ---- fallen trunks and stumps: what the cutting left behind
  for (let i = 0; i < 300; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.9 || !clear(x, z, 2) || !world.col.free(x, z, 1.0)) continue;
    const y = world.terrain.height(x, z);
    const a = rng.float(0, 6.28), len = rng.float(2.2, 5.4), r = rng.float(0.14, 0.3);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y + r * 0.7, z, rng.float(-0.1, 0.1), a, rng.float(-0.12, 0.12));
      b.limb([0, 0, 0], [0, 0, -len], r, r * 0.7, KIND.BARK, 5);
      for (let k = 0; k < 2; k++) { // broken branch stubs
        const t = rng.float(0.2, 0.8);
        b.limb([0, 0, -len * t], [rng.float(-0.5, 0.5), rng.float(0.2, 0.6), -len * t + rng.float(-0.4, 0.4)], r * 0.4, 0.03, KIND.BARK, 3);
      }
    });
    world.col.circle(x, z, 0.4, 1.0, CAP.TREE);
  }
  for (let i = 0; i < 420; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.3 || !clear(x, z, 2) || !world.col.free(x, z, 0.7)) continue;
    const y = world.terrain.height(x, z), r = rng.float(0.16, 0.36), h = rng.float(0.25, 0.7);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y - 0.05, z, rng.float(-0.06, 0.06), rng.float(0, 6.28), rng.float(-0.06, 0.06));
      b.cylinder(6, r * 1.2, r, h, KIND.BARK, { capTop: true });
    });
  }

  // ---- peat hummocks: the low mounds the sphagnum builds, dotted over the open bog
  for (let i = 0; i < 1100; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (world.water.depth(x, z) > 0.1 || world.inLandmark(x, z, 2) || !world.col.free(x, z, 1.0)) continue;
    const r = rng.float(0.4, 1.1);
    const y = world.terrain.height(x, z);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y - 0.12, z, 0, rng.float(0, 6.28), 0, 1, 0.5, 1);
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
  const step = 2; // (3.0n) the surface has to be fine enough to carry a swell: 2 m cells, ~22k triangles
  const half = world.half;
  b.identity();
  for (let z = -half; z < half; z += step) {
    for (let x = -half; x < half; x += step) {
      const x1 = x + step, z1 = z + step;
      if (world.water.depth(x + step / 2, z + step / 2) < 0.05) continue;
      const y = LEVEL;
      // (the diagonal is hidden: a calm surface, not a grid of triangles)
      // (3.0i) the whole bog was invisible: the surface was wound downward, and the material culls back faces
      b.quadN([x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1], [0, 1, 0], KIND.WATER, 15);
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
