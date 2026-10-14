// Procedural world layout: heightfield, castle colliders, props, spawn rifts.
// Pure data generation (no three.js) so it can be unit tested.
import { createNoise2D, fbm } from '../util/noise.js';
import { createRng } from '../util/rng.js';
import { smoothstep, clamp, lerp } from '../util/math.js';
import { WORLD } from '../config.js';

export const HALF = WORLD.half;
export const N = HALF * 2; // number of cells per side
export const SIZE = N + 1; // number of height nodes per side
export const PLAY_RADIUS = WORLD.playRadius;
export const CASTLE = {
  half: 11, // courtyard half-size (walls are at +-half)
  wallT: 0.7, // half-thickness of walls
  gate: 2.2, // half-width of each gate opening
  keepHalf: 2.9,
  keepH: 7,
  wallH: 3.4,
};
export const AGENT_R = 0.55; // blocking margin used for navigation

/** Road influence (0..1) along the two crossing roads that lead to the gates. */
export function roadWeight(x, z) {
  const h = CASTLE.half;
  const ax = Math.abs(x);
  const az = Math.abs(z);
  const alongZ = (1 - smoothstep(1.3, 2.4, ax)) * smoothstep(h + 0.5, h + 2.5, az) * (1 - smoothstep(49, 58, az));
  const alongX = (1 - smoothstep(1.3, 2.4, az)) * smoothstep(h + 0.5, h + 2.5, ax) * (1 - smoothstep(49, 58, ax));
  return Math.max(alongZ, alongX);
}

export function buildLayout(seed) {
  const terrainN = createNoise2D(seed);
  const detailN = createNoise2D((seed ^ 0x5bd1e995) >>> 0);
  const patchN = createNoise2D((seed * 3 + 17) >>> 0);
  const forestN = createNoise2D((seed * 7 + 101) >>> 0);
  const rng = createRng((seed * 2654435761) >>> 0);

  // ---- heightfield -------------------------------------------------------
  const heights = new Float32Array(SIZE * SIZE);
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const x = i - HALF;
      const z = j - HALF;
      const r = Math.hypot(x, z);
      let h = fbm(terrainN, x * 0.045, z * 0.045, 4) * 3.4;
      h += fbm(detailN, x * 0.12, z * 0.12, 2) * 0.35;
      // flat courtyard + castle grounds
      const castleBlend = smoothstep(CASTLE.half + 1.5, CASTLE.half + 10, Math.max(Math.abs(x), Math.abs(z)));
      h *= castleBlend;
      // distant mountains wrap the arena
      h += smoothstep(49, 72, r) * (9 + 4 * fbm(detailN, x * 0.05, z * 0.05, 3));
      // roads are kept gentle
      const road = roadWeight(x, z);
      h = lerp(h, 0.12, road * 0.85);
      heights[j * SIZE + i] = h;
    }
  }

  const heightAt = (x, z) => {
    const fx = clamp(x + HALF, 0, N - 1e-4);
    const fz = clamp(z + HALF, 0, N - 1e-4);
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const a = j * SIZE + i; // (i, j)
    const h00 = heights[a];
    const h10 = heights[a + 1];
    const h01 = heights[a + SIZE];
    const h11 = heights[a + SIZE + 1];
    // same triangulation as the rendered mesh: (a,c,b) and (b,c,d)
    if (tx + tz <= 1) return h00 + tx * (h10 - h00) + tz * (h01 - h00);
    return h11 + (1 - tx) * (h01 - h11) + (1 - tz) * (h10 - h11);
  };

  // ---- castle colliders --------------------------------------------------
  const boxes = [];
  const circles = [];
  const h = CASTLE.half;
  const t = CASTLE.wallT;
  const g = CASTLE.gate;
  for (const [a, b] of [[-h, -g], [g, h]]) {
    boxes.push({ minX: a, maxX: b, minZ: -h - t, maxZ: -h + t }); // north
    boxes.push({ minX: a, maxX: b, minZ: h - t, maxZ: h + t }); // south
    boxes.push({ minX: -h - t, maxX: -h + t, minZ: a, maxZ: b }); // west
    boxes.push({ minX: h - t, maxX: h + t, minZ: a, maxZ: b }); // east
  }
  const towers = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    towers.push({ x: sx * h, z: sz * h });
    circles.push({ x: sx * h, z: sz * h, r: 1.25, kind: 'tower' });
  }
  const K = CASTLE.keepHalf;
  boxes.push({ minX: -K, maxX: K, minZ: -K, maxZ: K, kind: 'keep' });
  const braziers = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    braziers.push({ x: sx * 7.5, z: sz * 7.5 });
    circles.push({ x: sx * 7.5, z: sz * 7.5, r: 0.5, kind: 'brazier' });
  }

  // ---- spawn rifts (outside the walls) ----------------------------------
  const rifts = [];
  for (let k = 0; k < WORLD.riftCount; k++) {
    const ang = (k / WORLD.riftCount) * Math.PI * 2 + rng.range(-0.14, 0.14);
    const r = rng.range(WORLD.riftMinR, WORLD.riftMaxR);
    rifts.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r });
  }

  // ---- props ---------------------------------------------------------------
  const props = [];
  const spaced = []; // all placed positions for spacing checks
  const nearAny = (x, z, d) => {
    const d2 = d * d;
    for (const p of spaced) {
      const dx = p.x - x;
      const dz = p.z - z;
      if (dx * dx + dz * dz < d2) return true;
    }
    return false;
  };
  for (const rf of rifts) spaced.push({ x: rf.x, z: rf.z, r: 2.5 });
  const castleZone = (x, z) => Math.max(Math.abs(x), Math.abs(z)) < h + 2.6;
  for (let a = 0; a < 6000; a++) {
    const x = rng.range(-PLAY_RADIUS - 3, PLAY_RADIUS + 3);
    const z = rng.range(-PLAY_RADIUS - 3, PLAY_RADIUS + 3);
    if (Math.hypot(x, z) > PLAY_RADIUS - 1) continue;
    if (castleZone(x, z) || roadWeight(x, z) > 0.2) continue;
    const forest = smoothstep(-0.15, 0.45, forestN(x * 0.06, z * 0.06));
    const roll = rng.next();
    let type = null;
    if (roll < 0.1 + 0.5 * forest) type = 'tree';
    else if (roll < 0.1 + 0.5 * forest + 0.07) type = 'rock';
    else if (roll < 0.1 + 0.5 * forest + 0.07 + 0.16) type = 'bush';
    if (!type) continue;
    const minD = type === 'bush' ? 1.1 : type === 'tree' ? 1.9 : 1.5;
    if (nearAny(x, z, minD)) continue;
    const s = type === 'tree' ? rng.range(0.85, 1.25) : type === 'rock' ? rng.range(0.7, 1.3) : rng.range(0.8, 1.2);
    const prop = { type, x, z, s, ry: rng.range(0, Math.PI * 2), v: rng.int(0, 3) };
    props.push(prop);
    spaced.push({ x, z, r: minD });
    if (type === 'tree') circles.push({ x, z, r: 0.5 * s, kind: 'tree' });
    if (type === 'rock') circles.push({ x, z, r: 0.75 * s, kind: 'rock' });
  }

  // ---- navigation grid -----------------------------------------------------
  const blocked = new Uint8Array(SIZE * SIZE);
  const markCircle = (c) => {
    const R = c.r + AGENT_R;
    const i0 = Math.max(0, Math.floor(c.x - R) + HALF);
    const i1 = Math.min(SIZE - 1, Math.ceil(c.x + R) + HALF);
    const j0 = Math.max(0, Math.floor(c.z - R) + HALF);
    const j1 = Math.min(SIZE - 1, Math.ceil(c.z + R) + HALF);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = i - HALF - c.x;
      const dz = j - HALF - c.z;
      if (dx * dx + dz * dz <= R * R) blocked[j * SIZE + i] = 1;
    }
  };
  const markBox = (b) => {
    const i0 = Math.max(0, Math.floor(b.minX - AGENT_R) + HALF);
    const i1 = Math.min(SIZE - 1, Math.ceil(b.maxX + AGENT_R) + HALF);
    const j0 = Math.max(0, Math.floor(b.minZ - AGENT_R) + HALF);
    const j1 = Math.min(SIZE - 1, Math.ceil(b.maxZ + AGENT_R) + HALF);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = i - HALF;
      const z = j - HALF;
      if (x >= b.minX - AGENT_R && x <= b.maxX + AGENT_R && z >= b.minZ - AGENT_R && z <= b.maxZ + AGENT_R) {
        blocked[j * SIZE + i] = 1;
      }
    }
  };
  for (const c of circles) markCircle(c);
  for (const b of boxes) markBox(b);
  for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) {
    if (Math.hypot(i - HALF, j - HALF) > PLAY_RADIUS + 1) blocked[j * SIZE + i] = 1;
  }

  const roadAt = (x, z) => roadWeight(x, z);
  return {
    seed,
    heights,
    heightAt,
    boxes,
    circles,
    props,
    rifts,
    towers,
    braziers,
    blocked,
    roadAt,
    patchNoise: patchN,
    detailNoise: detailN,
    start: { x: 0, z: 7.5 },
    castle: { ...CASTLE },
  };
}
