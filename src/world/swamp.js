// «Топь» — the second level, rebuilt from nothing (5.0). One night told in chapters (see docs/LEVEL2.md and
// game/level2.js); this file owns only the *place* the chapters are played on:
//
//   south edge  the highway, an embankment running the whole width; the tentacle lies across it at BLOCK
//   south half  the dirt road, from the turn-off north into the forest, forking three times (two forks end
//               in a dead end), up to the pine it ends against (CRASH)
//   west/middle the village: houses and huts scattered over a huge clearing, each with a post inside it
//   north-east  the bog: the gate and the generator at its mouth, the causeway (гать) over the water, the
//               cliff, and under the cliff the bog lake with the pier on its far shore
//
// The id stays 'bog': the menu, the URL (?map=bog) and the unlock (core/mapUnlock.js) know the level by it.
import * as THREE from 'three';
import { RNG, Simplex2, smoothstep, lerp } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';
import { Terrain } from './terrain.js';
import { ForestNavigation } from './navigation.js';
import { CAP } from './caps.js';

const LEVEL = 0.34; // the water line, in world metres
const HALF = 380; // 760 × 760 m

// the highway: a raised two-lane road along the south edge. Westbound traffic keeps to the north lane (`lane`,
// the side the dirt road leaves from), eastbound to the south one. (5.0b) Round the junction the road is lit:
// sodium lamps on arms over the north lane (`lamps`, the shader's uRoad), and `block` is where the arm lies
// across it — west of the turn-off, so a car stopped in the queue has the way into the forest right beside it.
export const HIGHWAY = {
  z: 334, y: 2.2, w: 9, x0: -HALF, x1: HALF, block: -41, turn: 18,
  lane: 331.8, oncoming: 336.2,
  lamps: { x0: -120, x1: 120, every: 40, z: 332.4, h: 8.8, pole: 328.0 },
};

// (5.0b) the arm that lies across the highway (chapter 1): the line it lies along, from its base — buried in the
// north forest — over the road to its tip, curled in the south ditch. The trees along it are down: it came out
// of the forest, not through it
export const ARM_PATH = [[-76, 294], [-68, 303], [-60, 312], [-53, 320], [-47, 327], [-43, 332], [-40, 336], [-36, 341], [-30, 347], [-23, 351], [-17, 350], [-14, 346], [-16, 342]];

// The dirt road. `main` is the way through; the branches are the wrong turns (a dead end at the far end of
// each one). The forks are where the navigator has to say left or right (chapter 2).
export const ROADS = [
  { id: 'main', w: 5.2, pts: [[18, 326], [12, 288], [-6, 246], [-28, 210], [-14, 170], [10, 130], [36, 96], [30, 58], [8, 26], [-26, 0], [-62, -26], [-86, -46]] },
  { id: 'west', w: 4.4, dead: true, pts: [[-28, 210], [-70, 204], [-112, 188], [-150, 160], [-166, 128]] },
  { id: 'east', w: 4.4, dead: true, pts: [[36, 96], [80, 92], [124, 104], [156, 132]] },
  { id: 'north', w: 4.4, dead: true, pts: [[8, 26], [-30, 34], [-84, 40], [-128, 30]] },
];
export const FORKS = [
  { id: 'f1', x: -28, z: 210, right: 'main', left: 'west' },
  { id: 'f2', x: 36, z: 96, right: 'east', left: 'main' },
  { id: 'f3', x: 8, z: 26, right: 'main', left: 'north' },
];
export const CRASH = { x: -92, z: -52, yaw: 0.9 }; // the pine at the end of the road

// The village: a huge clearing of houses and huts. Each one has a post inside it (chapter 4 wakes everyone
// tied to a post in a random house) and a door that swings (game/doors.js hangs it).
export const HOUSES = [
  { id: 'h1', kind: 'house', x: -150, z: -80, ry: 0.3 },
  { id: 'h2', kind: 'hut', x: -196, z: -42, ry: -0.6 },
  { id: 'h3', kind: 'house', x: -232, z: -118, ry: 1.1 },
  { id: 'h4', kind: 'hut', x: -286, z: -66, ry: 0.2 },
  { id: 'h5', kind: 'house', x: -120, z: -142, ry: -0.2 },
  { id: 'h6', kind: 'hut', x: -178, z: -186, ry: 2.4 },
  { id: 'h7', kind: 'house', x: -262, z: -214, ry: 0.7 },
  { id: 'h8', kind: 'hut', x: -310, z: -160, ry: 1.6 },
  { id: 'h9', kind: 'house', x: -62, z: -110, ry: 3.0 },
  { id: 'h10', kind: 'hut', x: -40, z: -176, ry: -1.2 },
  { id: 'h11', kind: 'house', x: -100, z: -232, ry: 0.5 },
  { id: 'h12', kind: 'hut', x: -214, z: -272, ry: -0.4 },
  { id: 'h13', kind: 'house', x: 6, z: -228, ry: 1.9 },
  { id: 'h14', kind: 'hut', x: -300, z: -300, ry: 0.9 },
  { id: 'h15', kind: 'house', x: -160, z: -312, ry: 2.8 },
  { id: 'h16', kind: 'hut', x: 22, z: -128, ry: -2.2 },
];
// which house a player wakes up in (chapter 4): a different one for each seat, chosen from the night's seed
// (5.0d: here, not in game/level2.js — the crash film needs it too, and the chapter machine imports the film)
export function houseFor(seed, slot) {
  const n = HOUSES.length;
  const first = (seed >>> 0) % n;
  const step = 5; // (co-prime with 16: four seats, four houses far apart)
  return HOUSES[(first + (slot | 0) * step) % n];
}

export const HOUSE_DIMS = {
  house: { W: 7.2, D: 5.6, H: 2.7, gap: [0.5, 1.9] },
  hut: { W: 4.6, D: 4.0, H: 2.3, gap: [-0.7, 0.7] },
};

// the mouth of the bog: the gate in a fence of stakes, the generator beside it, and the bikes (chapter 5–6)
export const GATE = { x: 96, z: -170, yaw: -Math.PI / 2 }; // the causeway leaves eastward
export const GENERATOR = { x: 86, z: -180 };
export const BIKES = [[90, -160], [94, -158], [98, -160], [102, -158]];

// the causeway across the bog, the cliff over the lake, the lake, and the pier on the far side (chapter 6–7)
export const CAUSEWAY = { id: 'causeway', w: 3.4, pts: [[104, -170], [136, -188], [162, -176], [184, -196], [196, -206]] };
export const CLIFF = { x: 222, z: -222, top: 9.5 };
export const LAKE = { x: 270, z: -270, r: 56, depth: 3.0 };
export const PIER = { x: 270, z: -334, yaw: Math.PI, len: 18 }; // on the north shore, pointing into the lake

export const SWAMP_LANDMARKS = [
  { id: 'highway', x: HIGHWAY.block, z: HIGHWAY.z, r: 16 },
  { id: 'crash', x: CRASH.x, z: CRASH.z, r: 10 },
  { id: 'gate', x: GATE.x, z: GATE.z, r: 16 },
  { id: 'cliff', x: CLIFF.x, z: CLIFF.z, r: 9 },
  { id: 'pier', x: PIER.x, z: PIER.z, r: 8 },
];

export const SWAMP_SOFT = [{ x: 150, z: -120, r: 7 }, { x: 196, z: -150, r: 7 }, { x: 150, z: -240, r: 7 }];
export const SWAMP_MIST = [{ x: 160, z: -230, r: 14 }, { x: 212, z: -128, r: 14 }, { x: 300, z: -190, r: 14 }];

// where the bog is: a broad mask over the north-east quarter (1 in the bog, 0 on dry ground)
export function bogMask(x, z) {
  return smoothstep(60, 120, x) * smoothstep(-40, -110, z);
}

// a point's distance to a polyline, and the parameter along it
// (5.0g) the forest closing on the dirt road: how far past its edge the first trunks stand
export const ROAD_VERGE = 1.6;

// a young spruce at the verge: a short trunk and two skirts of needles, head-high to twice that
function youngSpruce(world, x, y, z, s, rng) {
  const ry = rng.float(0, 6.283), h = rng.float(1.6, 3.2);
  world.addProp(x, z, (b) => {
    b.place(x, y - 0.1, z, rng.float(-0.06, 0.06), ry, rng.float(-0.06, 0.06), s);
    b.cylinder(4, 0.09, 0.05, h * 0.35, KIND.BARK, { capTop: false });
    b.cone(6, h * 0.42, h * 0.62, KIND.LEAF, { y0: h * 0.12, phase: ry });
    b.cone(6, h * 0.28, h * 0.5, KIND.LEAF, { y0: h * 0.5, phase: ry + 1 });
  });
  world.col.circle(x, z, 0.16 * s, 3 * s, CAP.TREE);
}

// a pine at the verge leaning out over the road (toward yaw): its crown hangs over the ruts
function leaningPine(world, x, y, z, s, toward, rng) {
  const lean = rng.float(0.1, 0.2), trunkH = rng.float(2.0, 3.2), r0 = rng.float(1.6, 2.1), ph = rng.float(0, 6);
  world.addProp(x, z, (b) => {
    // tilt about the axis across the lean: Rz after turning to face the road
    b.place(x, y - 0.3, z, 0, toward, -lean, s);
    b.cylinder(5, 0.27, 0.12, trunkH + 4.5, KIND.BARK, { capTop: false });
    let yb = trunkH, r = r0;
    for (let i = 0; i < 3; i++) {
      const hh = 2.6 - i * 0.28;
      b.cone(7, r, hh, KIND.LEAF, { y0: yb, phase: ph + i });
      yb += hh * 0.56;
      r *= 0.73;
    }
  });
  world.col.circle(x, z, 0.3 * s, 10 * s, CAP.TREE);
}

// (5.0f) the embankment up the knoll: from the end of the causeway round the far side of the mound to its top,
// rising evenly along its length
export const RISE = { pts: [[196, -206], [201, -207], [206, -203], [212, -195], [224, -190], [236, -198], [234, -212], [228, -218]], w: 3.6 };
RISE.cum = RISE.pts.reduce((a, p, i) => (i ? [...a, a[i - 1] + Math.hypot(p[0] - RISE.pts[i - 1][0], p[1] - RISE.pts[i - 1][1])] : [0]), []);
RISE.len = RISE.cum[RISE.cum.length - 1];
// how far (x, z) is from it, and how high it is there: { d, y, s }
export function riseAt(x, z) {
  let best = { d: 1e9, y: 0, s: 0 };
  for (let i = 0; i < RISE.pts.length - 1; i++) {
    const [ax, az] = RISE.pts[i], [bx, bz] = RISE.pts[i + 1];
    const dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best.d) {
      const s = RISE.cum[i] + Math.sqrt(len2) * t;
      best = { d, s, y: LEVEL + 0.2 + (CLIFF.top - LEVEL - 0.2) * (s / RISE.len) };
    }
  }
  return best;
}

function nearLine(pts, x, z) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best) best = d;
  }
  return best;
}

// is this point on the dirt road (any branch)? pad widens the test
export function onRoad(x, z, pad = 0) {
  for (const R of ROADS) if (nearLine(R.pts, x, z) < R.w / 2 + pad) return R;
  return null;
}

// Water: the question the rest of the game asks (game/water.js). The bog lake is deep enough to swim in.
export class SwampWater {
  constructor(world) {
    this.world = world;
    this.level = LEVEL;
    this.swim = true; // (game/water.js: deeper than depthSwim, you float)
    this.drains = [];
  }
  depth(x, z) {
    return Math.max(0, this.level - this.world.terrain.height(x, z));
  }
  wet(x, z) {
    return this.depth(x, z) > 0.06;
  }
  wading(x, z) {
    return this.depth(x, z) > 0.25;
  }
  soft(x, z) {
    for (const s of SWAMP_SOFT) if (Math.hypot(x - s.x, z - s.z) < s.r) return true;
    return false;
  }
  misted(x, z) {
    for (const m of SWAMP_MIST) if (Math.hypot(x - m.x, z - m.z) < m.r) return true;
    return false;
  }
}

// The ground. Dry forest floor in the south and west, the bog drowning the north-east, the highway's
// embankment along the south edge, the roads graded into it, the cliff and the lake under it.
class SwampTerrain extends Terrain {
  constructor(seed) {
    super(seed);
    this.half = HALF;
    this.cell = 3; // (a bigger участок: 3 m cells keep the ground near the forest's triangle count)
    this.level = LEVEL;
    this.n = Math.round((2 * this.half) / this.cell);
    this.H = new Float32Array((this.n + 1) * (this.n + 1));
  }

  // the broad shape alone: what the roads are graded to (no small bumps)
  baseHeight(x, z) {
    const n = this.noise;
    let h = 2.4 + n.fbm(x / 140, z / 140, 3) * 3.2 + n.noise(x / 52 + 3.1, z / 52 - 8.4) * 1.1;
    // the bog: the ground sinks under the water line, with islands of peat left in it
    const bog = bogMask(x, z);
    if (bog > 0) {
      const isl = n.noise(x / 34 - 12.4, z / 34 + 8.9);
      h = lerp(h, LEVEL - 0.55 + Math.max(0, isl) * 1.5, bog);
    }
    return h;
  }

  rawHeight(x, z) {
    const n = this.noise;
    let h = this.baseHeight(x, z) + n.noise(x / 13.7, z / 13.7) * 0.35 * (1 - bogMask(x, z) * 0.6);
    // the dirt roads: graded into the broad shape, a little raised (ruts are drawn, not dug)
    let road = 1e9;
    for (const R of ROADS) road = Math.min(road, nearLine(R.pts, x, z) - R.w / 2);
    if (road < 5) h = lerp(h, this.baseHeight(x, z) + 0.12, 1 - smoothstep(0.5, 5, road));
    // the highway embankment: level, two metres up, with ditches either side
    const dzH = Math.abs(z - HIGHWAY.z);
    if (dzH < 22) {
      const emb = 1 - smoothstep(HIGHWAY.w / 2 + 1.5, HIGHWAY.w / 2 + 7, dzH);
      const ditch = smoothstep(HIGHWAY.w / 2 + 5, HIGHWAY.w / 2 + 8, dzH) * (1 - smoothstep(HIGHWAY.w / 2 + 9, HIGHWAY.w / 2 + 15, dzH));
      h = lerp(h, HIGHWAY.y - 0.06, emb) - ditch * 0.7;
    }
    // the causeway runs over the water: the peat under it stays drowned (the deck stands on posts)
    const cw = nearLine(CAUSEWAY.pts, x, z);
    if (cw < 6) h = lerp(h, Math.min(h, LEVEL - 0.6), 1 - smoothstep(1.5, 6, cw));
    // the cliff: a knoll of rock and peat that ends in a sheer drop into the lake. (5.0f) A steep mound, and the old
    // embankment that winds up round its far side from the end of the causeway (a Kugoo climbs 8°; the old 27°
    // flank looped it over backwards)
    const dc = Math.hypot(x - CLIFF.x, z - CLIFF.z);
    if (dc < 24) h = Math.max(h, lerp(h, CLIFF.top, 1 - smoothstep(10, 22, dc)));
    const up = riseAt(x, z);
    if (up.d < 7) h = Math.max(h, lerp(h, up.y, 1 - smoothstep(2.2, 7, up.d)));
    // the lake: cut straight down, so the cliff's edge is an edge
    const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
    if (dl < LAKE.r + 3) h = lerp(h, LEVEL - LAKE.depth, 1 - smoothstep(LAKE.r - 5, LAKE.r + 1, dl));
    // the edge: the land rises into a wooded ridge that closes the участок
    const e = Math.max(Math.abs(x), Math.abs(z));
    h += smoothstep(this.half - 34, this.half - 6, e) * 7.0;
    return h;
  }
}

export const SWAMP = {
  id: 'bog',
  seed: 50117,
  half: HALF,
  level: LEVEL,
  landmarks: SWAMP_LANDMARKS,
  terrain: (seed) => new SwampTerrain(seed),
  soft: SWAMP_SOFT,
  mist: SWAMP_MIST,
};

// ---------------------------------------------------------------- helpers

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function baseAt(x, y, z, ry) {
  _e.set(0, ry, 0, 'YXZ');
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(_e), new THREE.Vector3(1, 1, 1));
}
function sub(b, base, lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _v.set(lx, ly, lz);
  _s.set(sx, sy, sz);
  b.setMatrix(_m.compose(_v, _q, _s).premultiply(base));
}
// local (x, z) of a thing turned by ry → world offset (three's rotation.y)
export function rot(lx, lz, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [lx * c + lz * s, -lx * s + lz * c];
}

// a strip of road surface along a polyline, laid on the ground (each quad follows the terrain)
function roadStrip(world, pts, w, kind, lift = 0.05) {
  const terr = world.terrain;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / 3));
    const px = -(bz - az) / len, pz = (bx - ax) / len;
    world.addProp((ax + bx) / 2, (az + bz) / 2, (b) => {
      b.identity();
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
        const hw = w / 2;
        const P = (x, z, s) => [x + px * hw * s, terr.height(x + px * hw * s, z + pz * hw * s) + lift, z + pz * hw * s];
        b.quadN(P(x0, z0, -1), P(x1, z1, -1), P(x1, z1, 1), P(x0, z0, 1), [0, 1, 0], kind, 15);
      }
    });
  }
}

// ---------------------------------------------------------------- the planks (ported from the old bog, 3.0k)

function deck(world, b, ax, az, bx, bz, w, ya, yb = ya) {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.4) return;
  const ux = dx / len, uz = dz / len, px = -uz, pz = ux;
  const yAt = (t) => ya + (yb - ya) * t;
  const hw = w / 2;
  const n = Math.max(1, Math.round(len / 1.5));
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const x0 = ax + dx * t0, z0 = az + dz * t0, x1 = ax + dx * t1, z1 = az + dz * t1;
    const y0 = yAt(t0), y1 = yAt(t1);
    b.identity();
    b.quadN([x0 - px * hw, y0, z0 - pz * hw], [x1 - px * hw, y1, z1 - pz * hw],
      [x1 + px * hw, y1, z1 + pz * hw], [x0 + px * hw, y0, z0 + pz * hw], [0, 1, 0], KIND.WOOD, 15);
    for (const s of [-1, 1]) {
      const ex = px * hw * s, ez = pz * hw * s;
      b.tri([x0 + ex, y0, z0 + ez], [x1 + ex, y1, z1 + ez], [x1 + ex, y1 - 0.11, z1 + ez], KIND.WOOD, 6);
      b.tri([x0 + ex, y0, z0 + ez], [x1 + ex, y1 - 0.11, z1 + ez], [x0 + ex, y0 - 0.11, z0 + ez], KIND.WOOD, 5);
    }
  }
  // posts down into the peat; the гать has no handrail — a bike has to be able to leave it (and fall)
  for (let d = 1.2; d < len; d += 4) {
    const x = ax + ux * d, z = az + uz * d, y = yAt(d / len);
    const g = world.terrain.height(x, z);
    if (y <= g + 0.02) continue;
    for (const s of [-1, 1]) {
      const ox = px * (hw - 0.16) * s, oz = pz * (hw - 0.16) * s;
      b.identity();
      b.limb([x + ox, y, z + oz], [x + ox, Math.min(g - 0.2, y - 0.3), z + oz], 0.075, 0.075, KIND.WOOD, 4);
    }
  }
}

function addWalk(world, walk, yMin = LEVEL + 0.18) {
  const yOf = (x, z) => Math.max(yMin, world.terrain.height(x, z) + 0.05);
  for (let i = 0; i < walk.pts.length - 1; i++) {
    const [ax, az] = walk.pts[i], [bx, bz] = walk.pts[i + 1];
    const ya = yOf(ax, az), yb = yOf(bx, bz);
    world.addProp((ax + bx) / 2, (az + bz) / 2, (b) => deck(world, b, ax, az, bx, bz, walk.w, ya, yb));
    world.walks.push({ ax, az, bx, bz, w: walk.w, y: (ya + yb) / 2, ya, yb, id: walk.id });
  }
}

// (5.0f) a ramp of planks from the gate down onto the causeway: the bank fell 1.7 m in four metres, and a bike
// went over its bars there. 13 m at under 8°, joining the causeway 9.5 m along it (it wins over the deck it lies on)
export const RAMP = { from: [99, -170], s: 9.5, w: 3.4 };
function addRamp(world) {
  const [ax, az] = RAMP.from, [p0x, p0z] = CAUSEWAY.pts[0], [p1x, p1z] = CAUSEWAY.pts[1];
  const L = Math.hypot(p1x - p0x, p1z - p0z), bx = p0x + ((p1x - p0x) / L) * RAMP.s, bz = p0z + ((p1z - p0z) / L) * RAMP.s;
  const ya = world.terrain.height(ax, az) + 0.03, yb = LEVEL + 0.18;
  world.addProp((ax + bx) / 2, (az + bz) / 2, (b) => deck(world, b, ax, az, bx, bz, RAMP.w, ya, yb));
  world.walks.unshift({ ax, az, bx, bz, w: RAMP.w, y: (ya + yb) / 2, ya, yb, id: 'ramp' });
}

// ---------------------------------------------------------------- the place

export function buildSwamp(world, t0) {
  const rng = new RNG(SWAMP.seed);
  const terr = world.terrain;
  world.walks = [];
  world.water = new SwampWater(world);
  world.sites = [];
  world.houses = [];
  world.swamp = { highway: HIGHWAY, roads: ROADS, forks: FORKS, crash: CRASH, gate: GATE, generator: GENERATOR, bikes: BIKES, causeway: CAUSEWAY, cliff: CLIFF, lake: LAKE, pier: PIER, arm: ARM_PATH, roadLamps: [] };
  world.spawn = { x: HIGHWAY.turn - 30, z: HIGHWAY.z, yaw: -Math.PI / 2 };

  // level pads under every house, the gate and the crash site
  for (const H of HOUSES) terr.addFlat(H.x, H.z, H.kind === 'house' ? 9 : 7);
  terr.addFlat(GATE.x - 8, GATE.z, 18);
  terr.addFlat(CRASH.x, CRASH.z, 8);
  // the old man's hut behind the pier stands on a bank of its own, above the water line
  { const [hx, hz] = pierHut(); terr.addFlat(hx, hz, 8, LEVEL + 0.9); }
  terr.finalize();

  buildHighway(world);
  for (const R of ROADS) roadStrip(world, R.pts, R.w, KIND.TRAIL_RUT, 0.04);
  for (const R of ROADS) if (R.dead) deadEnd(world, R, rng);
  buildCrash(world);
  for (const H of HOUSES) buildHouse(world, H, rng);
  buildGate(world);
  addWalk(world, CAUSEWAY);
  addRamp(world);
  buildPier(world);
  genGrowth(world, rng);

  world.navigation = new ForestNavigation(world);
  world.buildChunks();
  buildWater(world);
  world.waterMesh = true;
  world.genTime = performance.now() - t0;
  return world;
}

// the highway: asphalt, a dashed centre line, the shoulders, a guard rail along the ditch side, and the
// tentacle's place (a gouge in the asphalt — chapter 1 lays the arm itself across it)
function buildHighway(world) {
  const H = HIGHWAY, y = H.y;
  const span = 60;
  for (let x = H.x0 + 6; x < H.x1 - 6; x += span) {
    const x1 = Math.min(H.x1 - 6, x + span);
    world.addProp((x + x1) / 2, H.z, (b) => {
      b.identity();
      const z0 = H.z - H.w / 2, z1 = H.z + H.w / 2;
      for (let xx = x; xx < x1; xx += 6) {
        const xe = Math.min(x1, xx + 6);
        b.quadN([xx, y, z0], [xe, y, z0], [xe, y, z1], [xx, y, z1], [0, 1, 0], KIND.ROCK, 15);
        // the dashes of the centre line
        b.quadN([xx + 0.5, y + 0.012, H.z - 0.08], [xx + 3.5, y + 0.012, H.z - 0.08], [xx + 3.5, y + 0.012, H.z + 0.08], [xx + 0.5, y + 0.012, H.z + 0.08], [0, 1, 0], KIND.BONE, 15);
      }
      // the guard rail on the north shoulder, on its posts (gapped where the dirt road leaves, and torn out
      // where the arm came over it: 5.0b)
      const gz = z0 - 0.9;
      for (let xx = x; xx < x1; xx += 4) {
        if (Math.abs(xx - H.turn) < 8 || Math.abs(xx - ARM_RAIL) < 6) continue;
        b.limb([xx, y - 0.3, gz], [xx, y + 0.72, gz], 0.06, 0.06, KIND.METAL, 4);
        b.limb([xx, y + 0.62, gz], [Math.min(x1, xx + 4), y + 0.62, gz], 0.09, 0.09, KIND.METAL, 4);
      }
    });
  }
  // (5.0b) the junction's lamps: a pole behind the rail, an arm out over the north lane, a sodium head on it.
  // Their light is the shader's (uRoad: game/level2.js turns it on); here they are things, and the heads are kept
  // in world.swamp.roadLamps for the glow drawn over them
  const L = H.lamps;
  for (let x = L.x0; x <= L.x1; x += L.every) {
    const g = world.terrain.height(x, L.pole);
    const top = y + L.h;
    world.swamp.roadLamps.push({ x, y: top - 0.25, z: L.z });
    world.addProp(x, L.pole, (b) => {
      b.identity();
      b.limb([x, g - 0.4, L.pole], [x, top + 0.2, L.pole], 0.14, 0.09, KIND.METAL, 6);
      b.limb([x, top + 0.1, L.pole], [x, top, L.z], 0.07, 0.06, KIND.METAL, 4);
      b.place(x, top - 0.12, L.z);
      b.box(0.36, 0.2, 0.62, KIND.METAL);
    });
    world.col.circle(x, L.pole, 0.2, 9, CAP.METAL);
  }
}
// where along the north rail the arm came over it (the rail is missing there)
const ARM_RAIL = -45;

// a road that goes nowhere: it peters out in a felled tree across the ruts and a heap of brushwood
function deadEnd(world, R, rng) {
  const [x, z] = R.pts[R.pts.length - 1], [px, pz] = R.pts[R.pts.length - 2];
  const a = Math.atan2(x - px, z - pz);
  const y = world.terrain.height(x, z);
  world.addProp(x, z, (b) => {
    const base = baseAt(x, y, z, a);
    sub(b, base, -4, 0.35, 0, 0, Math.PI / 2, 0.06);
    b.limb([0, 0, 0], [0, 0, -8.5], 0.38, 0.24, KIND.BARK, 6);
    for (let k = 0; k < 7; k++) {
      sub(b, base, rng.float(-3, 3), 0.2, rng.float(1.5, 4), rng.float(-0.6, 0.6), rng.float(0, 6.28), rng.float(-0.6, 0.6));
      b.limb([0, 0, 0], [0, 0, -rng.float(1.4, 2.8)], 0.06, 0.02, KIND.BARK, 3);
    }
  });
  const [cx, cz] = rot(0, 0, a);
  world.col.add(x + cx - Math.cos(a) * 4.2, z + cz + Math.sin(a) * 4.2, x + cx + Math.cos(a) * 4.2, z + cz - Math.sin(a) * 4.2, 0.45, 1.0, CAP.TREE);
}

// the pine the road ends against: a thick old trunk leaning over the ruts
function buildCrash(world) {
  const { x, z } = CRASH;
  const y = world.terrain.height(x, z);
  world.addProp(x, z, (b) => {
    b.identity();
    b.place(x, y - 0.2, z, 0.06, 0, -0.04);
    b.limb([0, 0, 0], [0, 1.2, 0], 0.95, 0.7, KIND.BARK, 7);
    b.limb([0, 1.2, 0], [0.4, 14, 0.2], 0.7, 0.22, KIND.BARK, 7);
    for (let k = 0; k < 5; k++) {
      const up = 6 + k * 1.6, r = 3.2 - k * 0.5;
      const base = b.m.clone();
      sub(b, base, 0.3, up, 0.15, 0, k * 1.3, 0);
      b.cone(7, r, 2.4, KIND.LEAF, { hideRibs: true });
      b.setMatrix(base);
    }
  });
  world.col.circle(x, z, 0.9, 6, CAP.TREE);
}

// A house (log walls, gable roof, two windows, a door) or a hut (smaller, one window). Inside each: the post a
// captive is tied to, a table, a bench, junk. The walls are colliders; the door swings (game/doors.js).
function buildHouse(world, H, rng) {
  const D0 = HOUSE_DIMS[H.kind];
  const { W, D, H: HH, gap } = D0;
  const T = 0.2, ry = H.ry;
  const y = world.terrain.height(H.x, H.z);
  const post = { lx: -W / 4, lz: -D / 4 }; // where the captive's post stands, in house-local metres
  const [pxo, pzo] = rot(post.lx, post.lz, ry);
  world.houses.push({ ...H, y, W, D, post: { x: H.x + pxo, z: H.z + pzo } });
  world.addProp(H.x, H.z, (b) => {
    const base = baseAt(H.x, y, H.z, ry);
    // the floor
    sub(b, base, 0, 0.1, 0);
    b.box(W + 0.3, 0.2, D + 0.3, KIND.WOOD);
    // back wall with a window (two pieces under and over it), side walls, the front wall with the door gap
    const win = (lx0, lx1, lz, along) => {
      // a wall from lx0 to lx1 at lz with a 1 m window in its middle (along x)
      const m = (lx0 + lx1) / 2;
      sub(b, base, (lx0 + m - 0.5) / 2, HH / 2, lz);
      b.box(m - 0.5 - lx0, HH, T, KIND.WOOD);
      sub(b, base, (m + 0.5 + lx1) / 2, HH / 2, lz);
      b.box(lx1 - m - 0.5, HH, T, KIND.WOOD);
      sub(b, base, m, 0.5, lz);
      b.box(1.0, 1.0, T, KIND.WOOD);
      sub(b, base, m, HH - 0.35, lz);
      b.box(1.0, 0.7, T, KIND.WOOD);
      // the cross of the frame (no glass)
      sub(b, base, m, 1.45, lz);
      b.box(1.0, 0.05, 0.06, KIND.WOOD);
      b.box(0.05, 0.9, 0.06, KIND.WOOD);
    };
    win(-W / 2, W / 2, -D / 2);
    sub(b, base, -W / 2, HH / 2, 0);
    b.box(T, HH, D, KIND.WOOD);
    sub(b, base, W / 2, HH / 2, 0);
    b.box(T, HH, D, KIND.WOOD);
    const [g0, g1] = gap;
    sub(b, base, (-W / 2 + g0) / 2, HH / 2, D / 2);
    b.box(g0 + W / 2, HH, T, KIND.WOOD);
    sub(b, base, (g1 + W / 2) / 2, HH / 2, D / 2);
    b.box(W / 2 - g1, HH, T, KIND.WOOD);
    sub(b, base, (g0 + g1) / 2, HH - 0.3, D / 2);
    b.box(g1 - g0, 0.6, T, KIND.WOOD);
    // the roof (both faces drawn) and the gables
    const ov = 0.45, ridge = HH + (H.kind === 'house' ? 1.6 : 1.2);
    const p = [
      [-W / 2 - ov, HH - 0.15, D / 2 + ov], [W / 2 + ov, HH - 0.15, D / 2 + ov],
      [W / 2 + ov, ridge, 0], [-W / 2 - ov, ridge, 0],
      [-W / 2 - ov, HH - 0.15, -D / 2 - ov], [W / 2 + ov, HH - 0.15, -D / 2 - ov],
    ];
    sub(b, base, 0, 0, 0);
    b.quadN(p[0], p[1], p[2], p[3], [0, 1, 1], KIND.WOOD);
    b.quadN(p[0], p[1], p[2], p[3], [0, -1, -1], KIND.WOOD);
    b.quadN(p[4], p[5], p[2], p[3], [0, 1, -1], KIND.WOOD);
    b.quadN(p[4], p[5], p[2], p[3], [0, -1, 1], KIND.WOOD);
    for (const sx of [-1, 1]) b.triN([sx * W / 2, HH, D / 2], [sx * W / 2, HH, -D / 2], [sx * W / 2, ridge - 0.1, 0], [sx, 0, 0], KIND.WOOD);
    // the post, floor to beam, with a coil of rope at its foot
    sub(b, base, post.lx, 0.2, post.lz);
    b.cylinder(6, 0.13, 0.12, HH - 0.2, KIND.WOOD, { capTop: false });
    sub(b, base, post.lx, 0.26, post.lz, Math.PI / 2, 0, 0);
    b.cylinder(8, 0.24, 0.24, 0.08, KIND.BONE);
    // a table and a bench by the window; a heap of junk in the far corner
    sub(b, base, W / 4, 0.2, -D / 4);
    b.box(1.2, 0.75, 0.7, KIND.WOOD, { bottom: true });
    sub(b, base, W / 4, 0.2, -D / 4 + 0.75);
    b.box(1.1, 0.42, 0.3, KIND.WOOD, { bottom: true });
    for (let k = 0; k < 3; k++) {
      sub(b, base, W / 2 - 0.6 - rng.float(0, 0.4), 0.2, D / 2 - 0.7 - rng.float(0, 0.6), 0, rng.float(0, 3), 0);
      b.box(rng.float(0.3, 0.6), rng.float(0.2, 0.5), rng.float(0.3, 0.5), KIND.WOOD, { bottom: true });
    }
  });
  const seg = (ax, az, bx, bz) => {
    const [x1, z1] = rot(ax, az, ry), [x2, z2] = rot(bx, bz, ry);
    world.col.add(H.x + x1, H.z + z1, H.x + x2, H.z + z2, T, HH, CAP.WOOD);
  };
  seg(-W / 2, -D / 2, W / 2, -D / 2);
  seg(-W / 2, -D / 2, -W / 2, D / 2);
  seg(W / 2, -D / 2, W / 2, D / 2);
  seg(-W / 2, D / 2, gap[0], D / 2);
  seg(gap[1], D / 2, W / 2, D / 2);
  world.col.circle(H.x + pxo, H.z + pzo, 0.16, HH, CAP.WOOD);
  world.doors.push({ id: H.id, x: H.x, z: H.z, y: y + 0.21, ry, hx: gap[1] + 0.02, hz: D / 2, w: gap[1] - gap[0] + 0.02, h: 1.95, W, D, gap });
  world.navBuildings.push({ id: H.id, x: H.x, z: H.z, ry, W, D, gap });
}

// the mouth of the bog: a fence of stakes with a gate in it, the generator on its skid, lamp posts down the
// first stretch of causeway (dark until chapter 5 starts the generator)
function buildGate(world) {
  const { x, z } = GATE;
  const y = world.terrain.height(x, z);
  world.addProp(x, z, (b) => {
    b.identity();
    // the fence: stakes north and south of the gate
    for (const s of [-1, 1]) {
      for (let d = 3.2; d < 26; d += 0.9) {
        const zz = z + s * d, h = 2.1 + ((d * 7.3) % 1) * 0.5;
        const g = world.terrain.height(x, zz);
        b.limb([x, g - 0.3, zz], [x + ((d * 3.1) % 0.3) - 0.15, g + h, zz], 0.1, 0.07, KIND.WOOD, 4);
      }
    }
    // the gate posts and the leaf (shut: chapter 5 opens it)
    for (const s of [-1, 1]) b.limb([x, y - 0.3, z + s * 2.6], [x, y + 2.8, z + s * 2.6], 0.16, 0.14, KIND.WOOD, 5);
    b.limb([x, y + 2.7, z - 2.8], [x, y + 2.7, z + 2.8], 0.1, 0.1, KIND.WOOD, 4);
  });
  for (const s of [-1, 1]) world.col.add(x, z + s * 3.0, x, z + s * 26, 0.12, 2.2, CAP.WOOD);
  // the generator: a diesel set on a skid, a fuel can, a cable reel
  const G = GENERATOR, gy = world.terrain.height(G.x, G.z);
  world.addProp(G.x, G.z, (b) => {
    const base = baseAt(G.x, gy, G.z, 0.3);
    sub(b, base, 0, 0, 0);
    b.box(2.0, 0.16, 1.0, KIND.METAL, { bottom: true });
    sub(b, base, -0.2, 0.16, 0);
    b.box(1.3, 0.8, 0.8, KIND.METAL, { bottom: true });
    sub(b, base, 0.7, 0.16, 0);
    b.box(0.5, 0.6, 0.7, KIND.METAL, { bottom: true });
    sub(b, base, -0.6, 0.96, 0.2);
    b.cylinder(6, 0.05, 0.05, 0.5, KIND.METAL);
    sub(b, base, 1.4, 0, 0.6);
    b.box(0.3, 0.45, 0.2, KIND.METAL, { bottom: true });
    sub(b, base, 1.3, 0.3, -0.7, Math.PI / 2, 0, 0);
    b.cylinder(10, 0.3, 0.3, 0.3, KIND.WOOD);
  });
  world.col.circle(G.x, G.z, 1.1, 1.2, CAP.METAL);
  // lamp posts along the first legs of the causeway
  const lamps = [];
  const P = CAUSEWAY.pts;
  for (const [Q, first] of [[P, 6], [RISE.pts, 11]]) for (let i = 0; i < Q.length - 1; i++) { // (5.0f: and up the embankment)
    const [ax, az] = Q[i], [bx, bz] = Q[i + 1];
    const len = Math.hypot(bx - ax, bz - az), px = -(bz - az) / len, pz = (bx - ax) / len;
    for (let d = first; d < len; d += 22) lamps.push({ x: ax + (bx - ax) * (d / len) + px * 2.2, z: az + (bz - az) * (d / len) + pz * 2.2 });
  }
  world.swamp.lamps = lamps.map((l) => ({ ...l, y: Math.max(LEVEL, world.terrain.height(l.x, l.z)) + 3.2 }));
  for (const l of lamps) {
    const g = world.terrain.height(l.x, l.z);
    world.addProp(l.x, l.z, (b) => {
      b.identity();
      b.limb([l.x, g - 0.6, l.z], [l.x, Math.max(LEVEL, g) + 3.3, l.z], 0.08, 0.06, KIND.WOOD, 4);
      b.place(l.x, Math.max(LEVEL, g) + 3.1, l.z);
      b.box(0.3, 0.22, 0.3, KIND.METAL);
    });
  }
}

// where the old man's hut stands: behind the root of the pier, on the shore
function pierHut() {
  const ux = -Math.sin(PIER.yaw), uz = -Math.cos(PIER.yaw);
  return [PIER.x - ux * 8, PIER.z - uz * 8];
}

// the pier on the lake's far shore: a long deck on piles, a bench, a boat tied up, the old man's hut behind it
function buildPier(world) {
  const P = PIER;
  const ux = -Math.sin(P.yaw), uz = -Math.cos(P.yaw);
  const ax = P.x, az = P.z, bx = P.x + ux * P.len, bz = P.z + uz * P.len;
  addWalk(world, { id: 'pier', w: 2.6, pts: [[ax, az], [bx, bz]] }, LEVEL + 0.55);
  const y = LEVEL + 0.55;
  world.addProp(bx, bz, (b) => {
    const base = baseAt(bx, y, bz, P.yaw);
    sub(b, base, 0.6, 0, 0.6);
    b.box(1.4, 0.45, 0.35, KIND.WOOD, { bottom: true });
    // the boat alongside
    sub(b, base, 2.2, -0.45, 1.5);
    b.taper(1.0, 3.4, 1.4, 3.8, 0.55, KIND.WOOD);
  });
  const [hx, hz] = pierHut();
  buildHouse(world, { id: 'pierhut', kind: 'hut', x: hx, z: hz, ry: P.yaw + Math.PI }, new RNG(7));
}

// ---------------------------------------------------------------- growth (ported from the old bog, 3.0)

function genGrowth(world, rng) {
  const half = world.half - 10;
  const noise = new Simplex2(SWAMP.seed + 7);
  // (5.0b) and nothing grows where the arm lies: it came out of the forest along that line (see the windfall below)
  const clear = (x, z, pad) => !world.inLandmark(x, z, pad) && !world.onWalk(x, z, pad) && !onRoad(x, z, pad) && Math.abs(z - HIGHWAY.z) > HIGHWAY.w / 2 + 3 + pad && nearLine(ARM_PATH, x, z) > 7 + pad;
  const nearHouse =(x, z, pad) => HOUSES.some((H) => Math.hypot(x - H.x, z - H.z) < 7 + pad);
  const thick = (x, z, sc = 55) => 0.5 + 0.5 * noise.fbm(x / sc, z / sc, 2);
  const depth = (x, z) => world.water.depth(x, z);
  // the village clearing: thin there, so the houses see each other's lights
  const village = (x, z) => smoothstep(60, 20, Math.hypot((x + 160) / 1.6, (z + 180) / 1.1) / 1.6);

  // ---- the forest on the dry ground: pines and birches, thick along the roads (it closes over the car)
  for (let i = 0; i < 9000; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (depth(x, z) > 0.02 || !clear(x, z, 2.5) || nearHouse(x, z, 2)) continue;
    if (Math.hypot(x - CLIFF.x, z - CLIFF.z) < 14) continue;
    if (rng.next() > thick(x, z, 60) * (1 - village(x, z) * 0.85)) continue;
    if (!world.col.free(x, z, 1.6)) continue;
    const y = world.terrain.height(x, z);
    const s = rng.float(0.8, 1.3);
    if (rng.chance(0.78)) world.pine(x, y, z, s, rng);
    else world.birch(x, y, z, s, rng);
  }

  // ---- (forest pass 2) the walls of the dirt road. In a dark forest the trees are the dark: young spruce crowding
  // the verge, pines leaning out over the ruts, the old forest close behind them — beyond the headlights a wall, and
  // the thing behind the car breaks through it. (The road itself and a strip either side stay clear: a car swerving
  // round a root has its metre and a half.)
  const segs = [];
  for (const R of ROADS) for (let i = 0; i < R.pts.length - 1; i++) {
    const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1];
    segs.push({ R, ax, az, bx, bz, L: Math.hypot(bx - ax, bz - az) });
  }
  const total = segs.reduce((a, q) => a + q.L, 0);
  for (let i = 0; i < Math.round(total * 9); i++) {
    let pick = rng.float(0, total), q = segs[0];
    for (const g of segs) { if (pick < g.L) { q = g; break; } pick -= g.L; }
    const ux = (q.bx - q.ax) / q.L, uz = (q.bz - q.az) / q.L, side = rng.chance(0.5) ? 1 : -1;
    const lat = q.R.w / 2 + ROAD_VERGE + Math.pow(rng.next(), 1.7) * 21; // (crowded at the verge, thinning back)
    const along = rng.float(0, q.L);
    const x = q.ax + ux * along - uz * lat * side, z = q.az + uz * along + ux * lat * side;
    if (onRoad(x, z, ROAD_VERGE) || depth(x, z) > 0.02 || !clear(x, z, 0.4) || nearHouse(x, z, 2)) continue;
    const near = lat < q.R.w / 2 + ROAD_VERGE + 3.2;
    if (!world.col.free(x, z, near ? 0.75 : 1.15)) continue;
    const y = world.terrain.height(x, z);
    if (near && rng.chance(0.62)) youngSpruce(world, x, y, z, rng.float(0.7, 1.35), rng);
    else if (near) leaningPine(world, x, y, z, rng.float(0.85, 1.2), Math.atan2(ux * side, uz * side), rng); // (Ry·Rz: the crown goes to (cos t, −sin t) — toward the road)
    else if (rng.chance(0.8)) world.pine(x, y, z, rng.float(0.85, 1.35), rng);
    else world.birch(x, y, z, rng.float(0.8, 1.2), rng);
  }

  // ---- dead trees standing in the water: the drowned forest the bog swallowed
  for (let i = 0; i < 2600; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    const d = depth(x, z);
    if (d < 0.12 || d > 1.9) continue;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r) continue;
    if (!clear(x, z, 2) || !world.col.free(x, z, 1.1)) continue;
    if (rng.next() > 0.35 + 0.65 * thick(x, z, 70)) continue;
    const h = rng.float(1.8, 6.2), r = rng.float(0.1, 0.28);
    const lean = rng.float(-0.14, 0.14), lean2 = rng.float(-0.14, 0.14);
    const broken = rng.chance(0.35);
    const y = world.terrain.height(x, z);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y - 0.25, z, lean, rng.float(0, 6.28), lean2);
      b.limb([0, -0.15, 0], [0, 0.5, 0], r * 2.1, r * 1.25, KIND.BARK, 5);
      if (broken) b.limb([0, 0.5, 0], [0, h * 0.45, 0], r * 1.15, r * 0.75, KIND.BARK, 5);
      else {
        b.limb([0, 0.5, 0], [rng.float(-0.25, 0.25), h * 0.72, rng.float(-0.25, 0.25)], r * 1.1, r * 0.6, KIND.BARK, 5);
        b.limb([0, h * 0.7, 0], [rng.float(-0.5, 0.5), h, rng.float(-0.5, 0.5)], r * 0.6, r * 0.16, KIND.BARK, 4);
        for (let k = 0; k < 2; k++) {
          const a = rng.float(0, 6.28), up = h * rng.float(0.55, 0.85);
          b.limb([0, up, 0], [Math.cos(a) * rng.float(0.7, 1.6), up + rng.float(0.3, 1.1), Math.sin(a) * rng.float(0.7, 1.6)], r * 0.34, 0.025, KIND.BARK, 3);
        }
      }
    });
    world.col.circle(x, z, Math.max(0.22, r * 1.3), 3.4, CAP.TREE);
  }

  // ---- reeds at the shore
  for (let i = 0; i < 4200; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    const d = depth(x, z);
    if (d < 0.03 || d > 0.55 || !clear(x, z, 1)) continue;
    if (rng.next() > 0.45 + thick(x, z, 22) * 0.55) continue;
    const y = world.terrain.height(x, z);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y, z, 0, rng.float(0, 6.28), 0);
      const n = rng.int(5, 9);
      for (let k = 0; k < n; k++) {
        const ox = rng.float(-0.34, 0.34), oz = rng.float(-0.34, 0.34);
        b.limb([ox, -0.12, oz], [ox + rng.float(-0.1, 0.1), rng.float(0.75, 1.75), oz + rng.float(-0.1, 0.1)], 0.02, 0.007, KIND.LEAF, 3);
      }
    });
  }

  // ---- tussocks on the wet peat and in the clearings
  for (let i = 0; i < 6000; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (depth(x, z) > 0.28 || !clear(x, z, 0.6) || nearHouse(x, z, 0) || !world.col.free(x, z, 0.6)) continue;
    if (bogMask(x, z) < 0.2 && rng.next() > 0.3) continue;
    const y = world.terrain.height(x, z);
    const n = rng.int(3, 6), sc = rng.float(0.7, 1.25);
    world.addProp(x, z, (b) => {
      b.identity();
      b.place(x, y - 0.05, z, 0, rng.float(0, 6.28), 0, sc);
      b.rock(0.34, () => rng.next(), KIND.GROUND, 0.3, 0.42);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 6.283 + rng.float(-0.5, 0.5);
        const lean = rng.float(0.14, 0.4), h = rng.float(0.3, 0.7);
        b.limb([0, 0.1, 0], [Math.cos(a) * lean, h, Math.sin(a) * lean], 0.028, 0.006, KIND.LEAF, 3);
      }
    });
  }

  // ---- fallen trunks and stumps
  for (let i = 0; i < 700; i++) {
    const x = rng.float(-half, half), z = rng.float(-half, half);
    if (depth(x, z) > 0.6 || !clear(x, z, 2) || nearHouse(x, z, 2) || !world.col.free(x, z, 1.0)) continue;
    const y = world.terrain.height(x, z);
    if (rng.chance(0.5)) {
      const a = rng.float(0, 6.28), len = rng.float(2.2, 5.4), r = rng.float(0.14, 0.3);
      world.addProp(x, z, (b) => {
        b.identity();
        b.place(x, y + r * 0.7, z, rng.float(-0.1, 0.1), a, rng.float(-0.12, 0.12));
        b.limb([0, 0, 0], [0, 0, -len], r, r * 0.7, KIND.BARK, 5);
      });
      world.col.circle(x, z, 0.4, 1.0, CAP.TREE);
    } else world.stump(x, y, z, rng);
  }

  // ---- (5.0b) the windfall along the arm: the pines it came through, snapped and pushed over away from it.
  // (Last, on its own stream: everything above grows exactly where it did.)
  const wr = new RNG(SWAMP.seed + 51);
  for (let i = 0; i + 1 < ARM_PATH.length; i++) {
    const [ax, az] = ARM_PATH[i], [bx, bz] = ARM_PATH[i + 1];
    const len = Math.hypot(bx - ax, bz - az), px = -(bz - az) / len, pz = (bx - ax) / len;
    for (const side of [-1, 1]) {
      if (wr.chance(0.35)) continue;
      const t = wr.float(0.15, 0.85), off = wr.float(7.5, 10.5) * side;
      const x = ax + (bx - ax) * t + px * off, z = az + (bz - az) * t + pz * off;
      if (Math.abs(z - HIGHWAY.z) < HIGHWAY.w / 2 + 2 || !world.col.free(x, z, 1.2)) continue;
      const y = world.terrain.height(x, z), r = wr.float(0.18, 0.3), h = wr.float(5, 9);
      // fallen outward, away from the arm, with the stump left standing and splintered
      const fall = Math.atan2(px * side, pz * side) + wr.float(-0.5, 0.5);
      world.addProp(x, z, (b) => {
        b.identity();
        b.place(x, y, z, 0, wr.float(0, 6.28), 0);
        b.limb([0, -0.1, 0], [0, 0.9, 0], r * 1.2, r, KIND.BARK, 6);
        b.limb([0, 0.9, 0], [wr.float(-0.1, 0.1), 1.25, wr.float(-0.1, 0.1)], r * 0.9, 0.03, KIND.BARK, 4);
        b.place(x, y + 0.9, z, Math.PI / 2 - 0.12, fall, 0);
        b.limb([0, 0, 0], [0, h, 0], r, r * 0.35, KIND.BARK, 5);
        for (let k = 0; k < 3; k++) {
          const up = h * wr.float(0.5, 0.9), a = wr.float(0, 6.28);
          b.limb([0, up, 0], [Math.cos(a) * 1.1, up + 0.8, Math.sin(a) * 1.1], r * 0.3, 0.03, KIND.BARK, 3);
        }
      });
      world.col.circle(x, z, r * 1.3, 1.2, CAP.TREE);
    }
  }
}

// ---------------------------------------------------------------- water surface

// a sparse grid only where water stands; 2 m cells, fine enough for the swell (3.0n)
function buildWater(world) {
  const b = new MeshBuilder(60000);
  const step = 2;
  const half = world.half;
  b.identity();
  for (let z = -half; z < half; z += step) {
    for (let x = -half; x < half; x += step) {
      if (world.water.depth(x + step / 2, z + step / 2) < 0.05) continue;
      const x1 = x + step, z1 = z + step;
      b.quadN([x, LEVEL, z], [x1, LEVEL, z], [x1, LEVEL, z1], [x, LEVEL, z1], [0, 1, 0], KIND.WATER, 15);
    }
  }
  const mesh = new THREE.Mesh(b.toGeometry(), world.material);
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  mesh.userData.water = true;
  world.scene.add(mesh);
  world.meshes.push(mesh);
  world.waterTris = b.count / 3;
}
