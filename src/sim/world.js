// ============================================================
// WORLD — deterministic low-poly forest generation (pure data, no three.js)
// Both solo and co-op clients build the exact same forest from a seed.
// ============================================================
import { Rng, fbm2, ridged2, vnoise2 } from '../core/noise.js';
import { clamp, dist2, lerp, smoothstep, TAU } from '../core/util.js';

export const WORLD = {
  half: 258,          // playable radius (soft wall of ridge + dead forest beyond)
  seg: 132,           // terrain mesh segments (seg+1 ^2 verts)
  waterY: -1.15,
  treeCount: 4600,
  rockCount: 430,
  bushCount: 2100,
  logCount: 150,
};

export const TREE = { PINE: 0, SPRUCE: 1, BIRCH: 2, DEAD: 3 };

export function createWorld(seed = 20261016) {
  const rng = new Rng(seed);
  const S = seed >>> 0;

  // ---------- landmarks ----------
  const lake = { x: rng.range(-95, 95), z: rng.range(-95, 95), r: rng.range(46, 60) };
  if (Math.hypot(lake.x, lake.z) < 46) { const a = Math.atan2(lake.z, lake.x); lake.x = Math.cos(a) * 62; lake.z = Math.sin(a) * 62; }
  const start = { x: 0, z: 0, yaw: Math.atan2(lake.x, lake.z) + Math.PI * 0.5 };

  // ---------- height field ----------
  const hillScale = rng.range(150, 220);
  const lakeLevel = -1.15;

  function base(x, z) {
    let h = fbm2(x, z, { scale: hillScale, octaves: 4, seed: S }) * 12.5;
    h += ridged2(x + 400, z - 250, { scale: 300, octaves: 2, seed: S + 31 }) * 7.5;
    h += fbm2(x, z, { scale: 21, octaves: 2, seed: S + 7 }) * 1.1;
    return h;
  }

  // flatten pads: computed from base() so they stay welded to the terrain
  const pads = [{ x: start.x, z: start.z, r: 26, k: 0.85 }];
  const lakeBed = (t) => lakeLevel - 3.6 + Math.pow(t, 1.7) * 3.6;

  // generators on a rough ring, well separated
  const gens = [];
  const genN = 5;
  const a0 = rng.range(0, TAU);
  for (let i = 0; i < genN; i++) {
    let best = null, bestScore = -1e9;
    for (let tries = 0; tries < 40; tries++) {
      const a = a0 + (i / genN) * TAU + rng.range(-0.46, 0.46);
      const rWant = 86 + (i % 3) * 42 + rng.range(-16, 16);   // inner / mid / outer mix
      const r = clamp(rWant, 74, 208);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (dist2(x, z, lake.x, lake.z) < lake.r + 24) continue;
      if (Math.hypot(x, z) > WORLD.half * 0.86) continue;
      let score = -Math.abs(dist2(x, z, 0, 0) - rWant) * 0.6;
      let ok = true;
      for (const g of gens) { const d = dist2(x, z, g.x, g.z); if (d < 84) { ok = false; break; } score += Math.min(d, 150) * 0.35; }
      if (!ok) continue;
      const slope = Math.abs(base(x + 3, z) - base(x - 3, z)) + Math.abs(base(x, z + 3) - base(x, z - 3));
      score -= slope * 5;
      if (score > bestScore) { bestScore = score; best = { x, z, a }; }
    }
    if (!best) best = { x: Math.cos(a0 + i) * 140, z: Math.sin(a0 + i) * 140, a: 0 };
    gens.push({ id: i, x: best.x, z: best.z, rot: best.a, y: 0, fixed: false, needsFuse: true, progress: 0, lamp: 0 });
    pads.push({ x: best.x, z: best.z, r: 15, k: 0.95 });
  }

  // corpses: 8 of them, 5 carry a fuse (2 spares so the run is always winnable)
  const corpses = [];
  const corpseN = 8;
  for (let i = 0; i < corpseN; i++) {
    let x = 0, z = 0, ok = false;
    for (let t = 0; t < 60 && !ok; t++) {
      const p = rng.ring(0, 0, 52, 226);
      x = p.x; z = p.z;
      if (dist2(x, z, lake.x, lake.z) < lake.r + 8) continue;
      if (dist2(x, z, start.x, start.z) < 34) continue;
      ok = corpses.every((c) => dist2(x, z, c.x, c.z) > 44) && gens.every((g) => dist2(x, z, g.x, g.z) > 22);
    }
    corpses.push({ id: i, x, z, y: 0, rot: rng.range(0, TAU), pose: rng.int(0, 3), searched: false, hasFuse: false, note: i });
  }
  // Hand out 5 fuses across a spread of distances (near/mid/far) so the loop has legs but is winnable.
  const order = corpses.slice().sort((a, b) => dist2(a.x, a.z, 0, 0) - dist2(b.x, b.z, 0, 0));
  const fuseIdx = [1, 2, 4, 5, 7];
  order.forEach((c, i) => { c.hasFuse = fuseIdx.includes(i); });

  for (const g of gens) g.y = 0;

  function heightAt(x, z) {
    let h = base(x, z);

    // lake basin (absolute override blended into the base terrain)
    const dl = dist2(x, z, lake.x, lake.z);
    if (dl < lake.r * 1.75) {
      const t = clamp(dl / lake.r, 0, 1.75);
      const bed = t <= 1 ? lakeBed(t) : lakeBed(1) + (t - 1) * 26;
      const w = 1 - smoothstep(lake.r * 1.12, lake.r * 1.72, dl);
      h = lerp(h, Math.max(bed, h - 16), w);
    }

    // flatten pads
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      const d = dist2(x, z, p.x, p.z);
      if (d < p.r * 1.6) {
        const w = (1 - smoothstep(p.r * 0.55, p.r * 1.5, d)) * p.k;
        if (w > 0) {
          const target = base(p.x, p.z) * 0.995;
          h = lerp(h, target, w);
        }
      }
    }

    // rim mountains: the forest does not let you leave
    const dc = Math.hypot(x, z);
    const edge = smoothstep(WORLD.half * 0.80, WORLD.half * 1.05, dc);
    if (edge > 0) h += edge * edge * 62 + edge * ridged2(x, z, { scale: 44, octaves: 2, seed: S + 91 }) * 14;

    return h;
  }

  // bake pad heights now that heightAt exists (used for prop placement)
  for (const g of gens) g.y = heightAt(g.x, g.z);
  for (const c of corpses) c.y = heightAt(c.x, c.z);
  start.y = heightAt(0, 0);

  function slopeAt(x, z) {
    const e = 1.6;
    const hx = heightAt(x + e, z) - heightAt(x - e, z);
    const hz = heightAt(x, z + e) - heightAt(x, z - e);
    return Math.hypot(hx, hz) / (2 * e);
  }

  // ---------- scatter ----------
  const density = (x, z) => {
    let d = fbm2(x, z, { scale: 74, octaves: 3, seed: S + 121 }) * 0.5 + 0.5;   // groves
    d = Math.pow(d, 1.5);
    const dc = Math.hypot(x, z);
    d *= smoothstep(WORLD.half * 0.62, WORLD.half * 0.92, dc) * 0.9 + 0.35;      // thicker at the rim
    d *= 1 - smoothstep(26, 6, dist2(x, z, start.x, start.z)) * 0.9;             // camp clearing
    for (const g of gens) d *= 1 - smoothstep(15, 5, dist2(x, z, g.x, g.z)) * 0.95;
    const dl = dist2(x, z, lake.x, lake.z);
    d *= smoothstep(lake.r + 4, lake.r + 22, dl);                                // no trees in the lake
    return clamp(d, 0, 1.35);
  };

  // Placement keeps a walkable gap between every pair of solids, so the forest can
  // never pinch the player (or a monster) into an inescapable pocket.
  const CLEAR = 0.95;                 // extra air beyond the two radii
  const CS = 7, COFF = WORLD.half + 24, CGN = Math.ceil((WORLD.half * 2 + 48) / CS);
  const cells = new Array(CGN * CGN);
  const cellKey = (x, z) => Math.floor((z + COFF) / CS) * CGN + Math.floor((x + COFF) / CS);
  const blocked = (x, z, r) => {
    const gx = Math.floor((x + COFF) / CS), gz = Math.floor((z + COFF) / CS);
    for (let iz = -1; iz <= 1; iz++) {
      for (let ix = -1; ix <= 1; ix++) {
        const cx = gx + ix, cz = gz + iz;
        if (cx < 0 || cz < 0 || cx >= CGN || cz >= CGN) continue;
        const list = cells[cz * CGN + cx];
        if (!list) continue;
        for (let i = 0; i < list.length; i += 3) {
          const rr = r + list[i + 2] + CLEAR;
          const dx = x - list[i], dz = z - list[i + 1];
          if (dx * dx + dz * dz < rr * rr) return true;
        }
      }
    }
    return false;
  };
  const reserve = (x, z, r) => {
    const k = cellKey(x, z);
    if (k < 0 || k >= cells.length) return;
    (cells[k] || (cells[k] = [])).push(x, z, r);
  };
  const trunkR = (type, scale) => (type === TREE.BIRCH ? 0.22 : 0.34) * (0.6 + scale * 0.045);

  const trees = { count: 0, data: new Float32Array(WORLD.treeCount * 6) }; // x,z,y,scale,rot,type
  let guard = WORLD.treeCount * 60;
  while (trees.count < WORLD.treeCount && guard-- > 0) {
    const p = rng.ring(0, 0, 6, WORLD.half * 1.03);
    const d = density(p.x, p.z);
    if (rng.next() > d) continue;
    if (slopeAt(p.x, p.z) > 1.05) continue;
    const dc = Math.hypot(p.x, p.z);
    const rim = dc > WORLD.half * 0.88;
    let type;
    const t = rng.next();
    if (rim) type = t < 0.72 ? TREE.DEAD : TREE.PINE;
    else if (t < 0.52) type = TREE.PINE;
    else if (t < 0.78) type = TREE.SPRUCE;
    else if (t < 0.92) type = TREE.BIRCH;
    else type = TREE.DEAD;
    const scale = type === TREE.PINE ? rng.range(9, 19)
      : type === TREE.SPRUCE ? rng.range(5.5, 10)
      : type === TREE.BIRCH ? rng.range(7, 13)
      : rng.range(8, 16);
    const r = trunkR(type, scale);
    if (blocked(p.x, p.z, r)) continue;
    reserve(p.x, p.z, r);
    const i = trees.count * 6;
    trees.data[i] = p.x; trees.data[i + 1] = p.z; trees.data[i + 2] = heightAt(p.x, p.z);
    trees.data[i + 3] = scale; trees.data[i + 4] = rng.range(0, TAU); trees.data[i + 5] = type;
    trees.count++;
  }

  const rocks = { count: 0, data: new Float32Array(WORLD.rockCount * 6) };
  guard = WORLD.rockCount * 30;
  while (rocks.count < WORLD.rockCount && guard-- > 0) {
    const p = rng.ring(0, 0, 10, WORLD.half * 1.0);
    if (dist2(p.x, p.z, lake.x, lake.z) < lake.r - 6) continue;
    const rs = rng.range(0.6, 3.4);
    const rr = rs > 1.5 ? rs * 0.72 : 0;      // only the big ones are solid
    if (rr && blocked(p.x, p.z, rr)) continue;
    if (rr) reserve(p.x, p.z, rr);
    const i = rocks.count * 6;
    rocks.data[i] = p.x; rocks.data[i + 1] = p.z; rocks.data[i + 2] = heightAt(p.x, p.z) - 0.25;
    rocks.data[i + 3] = rs; rocks.data[i + 4] = rng.range(0, TAU); rocks.data[i + 5] = rng.range(0.4, 1.1);
    rocks.count++;
  }

  const bushes = { count: 0, data: new Float32Array(WORLD.bushCount * 5) };
  guard = WORLD.bushCount * 24;
  while (bushes.count < WORLD.bushCount && guard-- > 0) {
    const p = rng.ring(0, 0, 8, WORLD.half * 0.99);
    if (dist2(p.x, p.z, lake.x, lake.z) < lake.r + 2) continue;
    if (heightAt(p.x, p.z) < lakeLevel + 0.25) continue;
    const i = bushes.count * 5;
    bushes.data[i] = p.x; bushes.data[i + 1] = p.z; bushes.data[i + 2] = heightAt(p.x, p.z);
    bushes.data[i + 3] = rng.range(0.5, 1.5); bushes.data[i + 4] = rng.range(0, TAU);
    bushes.count++;
  }

  const logs = { count: 0, data: new Float32Array(WORLD.logCount * 6) };
  guard = WORLD.logCount * 30;
  while (logs.count < WORLD.logCount && guard-- > 0) {
    const p = rng.ring(0, 0, 18, WORLD.half * 0.97);
    if (density(p.x, p.z) < 0.28) continue;
    if (dist2(p.x, p.z, lake.x, lake.z) < lake.r + 6) continue;
    const ls = rng.range(4, 9.5);
    const lr = ls * 0.34;
    if (blocked(p.x, p.z, lr)) continue;
    reserve(p.x, p.z, lr);
    const i = logs.count * 6;
    logs.data[i] = p.x; logs.data[i + 1] = p.z; logs.data[i + 2] = heightAt(p.x, p.z) + 0.35;
    logs.data[i + 3] = ls; logs.data[i + 4] = rng.range(0, TAU); logs.data[i + 5] = rng.range(0.28, 0.6);
    logs.count++;
  }

  // stone circle landmark (a place the notes can point at)
  const circle = { x: rng.range(-1, 1) * rng.range(60, 150), z: 0, r: 9 };
  circle.z = rng.sign() * rng.range(60, 150);
  if (dist2(circle.x, circle.z, lake.x, lake.z) < lake.r + 20) { circle.x *= -1; circle.z *= -0.7; }
  const stones = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rng.range(-0.1, 0.1);
    const x = circle.x + Math.cos(a) * circle.r, z = circle.z + Math.sin(a) * circle.r;
    stones.push({ x, z, y: heightAt(x, z), h: rng.range(2.4, 4.6), rot: a + rng.range(-0.3, 0.3), s: rng.range(0.7, 1.25) });
  }
  // ruined cabin by the lake
  const cabA = Math.atan2(lake.z, lake.x) + rng.range(-0.5, 0.5);
  const cabin = { x: Math.cos(cabA) * (lake.r + rng.range(16, 30)), z: Math.sin(cabA) * (lake.r + rng.range(16, 30)), rot: rng.range(0, TAU) };
  cabin.y = heightAt(cabin.x, cabin.z);
  // radio mast at camp
  const mast = { x: start.x + 9, z: start.z - 7, y: 0, h: 17 };
  mast.y = heightAt(mast.x, mast.z);

  const landmarks = [
    { kind: 'mast', ...mast },
    { kind: 'cabin', ...cabin },
    { kind: 'circle', x: circle.x, z: circle.z, y: heightAt(circle.x, circle.z), stones },
    { kind: 'tent', x: start.x - 6, z: start.z + 4, y: heightAt(start.x - 6, start.z + 4), rot: rng.range(0, TAU) },
    { kind: 'fire', x: start.x + 1.5, z: start.z + 2.5, y: heightAt(start.x + 1.5, start.z + 2.5) },
  ];

  // ---------- clearings: no trunk may ever wall in a generator, the cabin or a stone ----------
  // This both reads better on the sonar (each objective sits in a small gap in the
  // forest) and guarantees there is no pocket the player can be wedged inside.
  const clearSpots = [];
  for (const g of gens) clearSpots.push({ x: g.x, z: g.z, r: 5.6 });
  for (const c of corpses) clearSpots.push({ x: c.x, z: c.z, r: 2.6 });
  clearSpots.push({ x: cabin.x, z: cabin.z, r: 7.2 });
  clearSpots.push({ x: mast.x, z: mast.z, r: 3.4 });
  clearSpots.push({ x: start.x - 6, z: start.z + 4, r: 4.2 });
  for (const st of stones) clearSpots.push({ x: st.x, z: st.z, r: st.s * 0.9 + 1.5 });
  const keep = (x, z, r) => {
    for (let i = 0; i < clearSpots.length; i++) {
      const c = clearSpots[i];
      const rr = c.r + r;
      const dx = x - c.x, dz = z - c.z;
      if (dx * dx + dz * dz < rr * rr) return false;
    }
    return true;
  };
  const prune = (arr, L, rAt) => {
    let n = 0;
    for (let i = 0; i < arr.count; i++) {
      const o = i * L;
      if (!keep(arr.data[o], arr.data[o + 1], rAt(o))) continue;
      if (n !== i) for (let k = 0; k < L; k++) arr.data[n * L + k] = arr.data[o + k];
      n++;
    }
    arr.count = n;
  };
  prune(trees, 6, (o) => trunkR(trees.data[o + 5], trees.data[o + 3]));
  prune(logs, 6, (o) => logs.data[o + 3] * 0.34);
  prune(rocks, 6, (o) => (rocks.data[o + 3] > 1.5 ? rocks.data[o + 3] * 0.72 : 0));

  // ---------- collision grid (tree trunks, rocks, props, landmarks) ----------
  const CELL = 11;
  const GN = Math.ceil((WORLD.half * 2 + 40) / CELL);
  const OFF = WORLD.half + 20;
  const grid = new Array(GN * GN);
  const pushSolid = (x, z, r, tag) => {
    const gx = Math.floor((x + OFF) / CELL), gz = Math.floor((z + OFF) / CELL);
    if (gx < 0 || gz < 0 || gx >= GN || gz >= GN) return;
    const k = gz * GN + gx;
    (grid[k] || (grid[k] = [])).push({ x, z, r, tag });
  };
  for (let i = 0; i < trees.count; i++) {
    const o = i * 6;
    pushSolid(trees.data[o], trees.data[o + 1], trunkR(trees.data[o + 5], trees.data[o + 3]), 1);
  }
  for (let i = 0; i < rocks.count; i++) {
    const o = i * 6;
    if (rocks.data[o + 3] > 1.5) pushSolid(rocks.data[o], rocks.data[o + 1], rocks.data[o + 3] * 0.72, 2);
  }
  for (let i = 0; i < logs.count; i++) {
    const o = i * 6;
    pushSolid(logs.data[o], logs.data[o + 1], logs.data[o + 3] * 0.34, 2);
  }
  for (const g of gens) pushSolid(g.x, g.z, 2.1, 3);
  for (const c of corpses) pushSolid(c.x, c.z, 0.0, 3);
  for (const lm of landmarks) {
    if (lm.kind === 'mast') pushSolid(lm.x, lm.z, 0.9, 3);
    else if (lm.kind === 'cabin') { for (let i = 0; i < 4; i++) { const a = lm.rot + i * Math.PI / 2; pushSolid(lm.x + Math.cos(a) * 3.2, lm.z + Math.sin(a) * 3.2, 1.2, 3); } }
    else if (lm.kind === 'circle') for (const s of lm.stones) pushSolid(s.x, s.z, s.s * 0.9, 2);
    else if (lm.kind === 'tent') pushSolid(lm.x, lm.z, 1.5, 3);
  }

  /** Slide a circle of radius `rad` out of solids. Returns 1 if it hit something. */
  function collide(x, z, rad) {
    const gx = Math.floor((x + OFF) / CELL), gz = Math.floor((z + OFF) / CELL);
    let hit = 0;
    for (let iz = -1; iz <= 1; iz++) {
      for (let ix = -1; ix <= 1; ix++) {
        const cx = gx + ix, cz = gz + iz;
        if (cx < 0 || cz < 0 || cx >= GN || cz >= GN) continue;
        const list = grid[cz * GN + cx];
        if (!list) continue;
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          const dx = x - s.x, dz = z - s.z;
          const rr = s.r + rad;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr) {
            if (d2 <= 1e-6) { x = s.x + rr; z = s.z; hit = s.tag; continue; }
            const d = Math.sqrt(d2);
            x = s.x + (dx / d) * rr;
            z = s.z + (dz / d) * rr;
            hit = s.tag;
          }
        }
      }
    }
    return hit ? { x, z, hit } : null;
  }

  /** A cheap "is there forest here" value for radar texture. */
  const forestness = (x, z) => density(x, z);
  const isWater = (x, z) => heightAt(x, z) < lakeLevel - 0.05 && dist2(x, z, lake.x, lake.z) < lake.r * 1.3;
  const waterDepth = (x, z) => clamp(lakeLevel - heightAt(x, z), 0, 6);

  // monster spawn anchors
  const spawns = [];
  for (let i = 0; i < 8; i++) spawns.push(rng.ring(0, 0, 120, 235));

  return {
    seed: S, lake, start, gens, corpses, trees, rocks, bushes, logs, landmarks, stones, circle, cabin, mast,
    heightAt, slopeAt, density, forestness, collide, isWater, waterDepth, lakeLevel, spawns,
    half: WORLD.half,
    bounds: { min: -WORLD.half, max: WORLD.half },
  };
}

/** Random walkable point at least `minD` from (x,z) — used by monster AI. */
export function randomRoamPoint(world, rng, x, z, minD = 40, maxD = 130) {
  for (let i = 0; i < 24; i++) {
    const p = rng.ring(x, z, minD, maxD);
    const d = Math.hypot(p.x, p.z);
    if (d > world.half * 0.95) continue;
    if (world.isWater(p.x, p.z) && rng.chance(0.8)) continue;
    if (world.slopeAt(p.x, p.z) > 0.9) continue;
    return { x: p.x, z: p.z };
  }
  return { x: clamp(x + rng.range(-30, 30), -world.half, world.half), z: clamp(z + rng.range(-30, 30), -world.half, world.half) };
}
