// 3.0q — the shelter under the forestry yard.
//
// Behind the yard's back wall there is a concrete cap with a steel door on it, and under the slabs a shelter
// the forest service dug in the fifties and forgot: a landing, a long corridor on a row of ribs, and a vault at
// the far end where the wall has come apart. The yard's gates are not on the generators' circuit at all — they
// hang off the shelter's breaker, down at the far end of the corridor, past the crack.
//
// This file is the shelter as a place: the concrete, the ladder, the door frames, the pipes, the colliders —
// everything that never moves. What moves (the lamps, the blast door, the breaker's lever, the crack's red
// light and what comes out of it) belongs to game/bunker.js.
//
// The underground has its own collision set (world.bunkerCol): the surface's capsules are 2D, and a corridor
// forty metres long would otherwise put invisible walls across the yard. A player below is resolved against
// this one instead (game/player.js, world.col override).
import { CFG } from '../core/config.js';
import { RNG, clamp, smoothstep } from '../core/rng.js';
import { KIND } from './builder.js';
import { GK } from '../ui/garageSet.js';
import { Collision } from './collision.js';

const Y = CFG.YARD;

// the layout, in world x/z. Laid out along −z: the yard's own fence is 24 deep, the corridor runs south under
// the forest, well away from the cut (the cut's floor falls away to the highway, and a shelter there would have
// been open to the sky).
export const BUNKER = {
  depth: 5.7, // floor, this far under the yard's slabs
  hatch: { x: Y.x - 5.5, z: Y.z + 6.5, w: 3.4, d: 3.0, h: 2.45, wall: 0.26 }, // the cap in the yard
  landing: { x0: Y.x - 8.3, x1: Y.x - 2.7, z0: Y.z + 3.4, z1: Y.z + 9.6, h: 3.4 },
  door: { z: Y.z + 2.9, x0: Y.x - 7.8, x1: Y.x - 3.2, h: 3.0 }, // the blast door: a slab in the ceiling slot
  hall: { x0: Y.x - 7.3, x1: Y.x - 3.7, z0: Y.z - 19.0, z1: Y.z + 2.6, h: 3.15 },
  vault: { x0: Y.x - 10.8, x1: Y.x - 0.2, z0: Y.z - 30.0, z1: Y.z - 19.0, h: 4.8 },
  ladder: { x: Y.x - 4.0, z: Y.z + 7.4 }, // the way back up, in the landing
  breaker: { x: Y.x - 0.55, z: Y.z - 26.6 }, // on the vault's east wall
  rift: { x: Y.x - 5.6, z: Y.z - 28.4 }, // the wall that came apart, at the far end
  spawn: { x: Y.x - 6.4, z: Y.z + 6.8, yaw: 0 }, // where you come down: facing the corridor (−z), two steps clear of the ladder
  lamps: [Y.z + 6.4, Y.z + 0.4, Y.z - 6.6, Y.z - 12.6, Y.z - 18.0, Y.z - 24.0],
  doorTravel: 2.85, // how far the slab comes down before it is shut
};

// s: the closing doors are given three minutes — see game/bunker.js
export const DOOR_TIME = 180;

const _in = (x, z, r, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;

// which room is (x, z) in — 'landing' | 'hall' | 'vault' | null
export function bunkerRoom(x, z, pad = 0) {
  const B = BUNKER;
  if (_in(x, z, B.landing, pad)) return 'landing';
  if (_in(x, z, B.hall, pad)) return 'hall';
  if (_in(x, z, B.vault, pad)) return 'vault';
  return null;
}

export function inBunker(x, z, pad = 0) {
  return bunkerRoom(x, z, pad) !== null;
}

// the floor of the shelter at (x, z) — null out in the open (the caller keeps the ground's own height)
export function bunkerFloor(x, z, groundY) {
  if (!inBunker(x, z, 0.05)) return null;
  return groundY - BUNKER.depth;
}

// the low, musty smell of the place: a box standing in the yard. Built with the yard's own frame of mind —
// concrete that has been rained on for seventy years, a steel door, a lamp over it that has never worked —
// but the inside is what matters and none of it is above ground.
export function buildBunker(world, y0) {
  const B = BUNKER;
  const rng = new RNG(30517);
  const fy = y0 - B.depth; // the shelter's floor
  const H = B.hatch;
  const L = B.landing, HL = B.hall, V = B.vault;

  // ---- 1. the cap in the yard ----
  world.addProp(H.x, H.z, (b) => {
    const gy = (x, z) => world.terrain.height(x, z);
    const w = H.w / 2, d = H.d / 2;
    // a concrete plinth, its top heaved and stained
    for (let i = 0; i < 3; i++) {
      b.place(H.x, gy(H.x, H.z) - 0.3 + 0.1 + i * 0.14, H.z, 0, 0.02 * i, 0);
      b.box(H.w + 0.35 - i * 0.08, 0.15, H.d + 0.3 - i * 0.06, GK.CONCRETE);
    }
    // four walls, a slab on top, and a door in the south face
    const wall = H.wall, h = H.h;
    const box = (x0, x1, yA, yB, z0, z1, kind) => {
      b.place((x0 + x1) / 2, (yA + yB) / 2, (z0 + z1) / 2);
      b.box(Math.abs(x1 - x0), Math.abs(yB - yA), Math.abs(z1 - z0), kind);
    };
    const g0 = gy(H.x, H.z);
    box(H.x - w, H.x + w, g0 - 0.1, g0 + h, H.z - d, H.z - d + wall, GK.CONCRETE);
    box(H.x - w, H.x + w, g0 - 0.1, g0 + h, H.z + d - wall, H.z + d, GK.CONCRETE);
    box(H.x - w, H.x - w + wall, g0 - 0.1, g0 + h, H.z - d + wall, H.z + d - wall, GK.CONCRETE);
    box(H.x + w - wall, H.x + w, g0 - 0.1, g0 + h, H.z - d + wall, H.z + d - wall, GK.CONCRETE);
    b.place(H.x, g0 + h + 0.09, H.z, 0.012, 0.03, -0.014);
    b.box(H.w + 0.3, 0.2, H.d + 0.3, GK.CONCRETE);
    // a rusted hood over the door, a dead lamp and its bracket
    b.place(H.x, g0 + h - 0.15, H.z - d - 0.16, 0.16, 0, 0);
    b.box(1.5, 0.06, 0.42, GK.RUST);
    b.identity();
    b.limb([H.x + 1.1, g0 + h + 0.05, H.z - d + 0.1], [H.x + 0.85, g0 + h - 0.3, H.z - d - 0.3], 0.035, 0.03, GK.TIN, 4);
    b.place(H.x + 0.85, g0 + h - 0.36, H.z - d - 0.34);
    b.cylinder(6, 0.13, 0.05, 0.12, GK.TIN, { capTop: true });
    // the number stencilled over the door: a plate, not a texture
    b.place(H.x - 0.5, g0 + h - 0.55, H.z - d - 0.02);
    b.box(0.62, 0.28, 0.02, GK.RUST);
    // the door frame, bolted
    b.place(H.x, g0 + 1.05, H.z - d - 0.05);
    b.box(1.1, 2.1, 0.1, GK.DARK);
    for (const sx of [-1, 1]) {
      b.place(H.x + sx * 0.58, g0 + 1.05, H.z - d - 0.06);
      b.box(0.08, 2.2, 0.13, GK.RUST);
      for (let k = 0; k < 4; k++) {
        b.place(H.x + sx * 0.58, g0 + 0.25 + k * 0.5, H.z - d - 0.13);
        b.cylinder(5, 0.025, 0.025, 0.04, GK.CHROME);
      }
    }
    // weeds against the plinth, and a shovel somebody left leaning on it
    for (let i = 0; i < 9; i++) {
      const a = rng.float(0, 6.28), r = 1.5 + rng.next() * 0.9;
      const x = H.x + Math.cos(a) * r * 0.9, z = H.z + Math.sin(a) * r * 0.75;
      b.place(x, gy(x, z) + 0.12, z, rng.float(-0.2, 0.2), rng.float(0, 6), rng.float(-0.2, 0.2));
      b.cone(4, 0.09, rng.float(0.35, 0.6), KIND.LEAF);
    }
    b.identity();
    b.limb([H.x + w + 0.1, gy(H.x, H.z) + 0.02, H.z - 0.4], [H.x + w + 0.45, gy(H.x, H.z) + 1.25, H.z - 0.55], 0.03, 0.025, GK.WOODDARK, 4);
  });
  // the cap is solid: you walk round it (a 3.4 × 3.0 box)
  const hw = H.w / 2, hd = H.d / 2, R = 0.5;
  world.col.add(H.x - hw, H.z - hd, H.x + hw, H.z - hd, R, 2.6, 0);
  world.col.add(H.x - hw, H.z + hd, H.x + hw, H.z + hd, R, 2.6, 0);
  world.col.add(H.x - hw, H.z - hd, H.x - hw, H.z + hd, R, 2.6, 0);
  world.col.add(H.x + hw, H.z - hd, H.x + hw, H.z + hd, R, 2.6, 0);

  // ---- 2. the underground, in its own collision set ----
  const col = new Collision(160, 4);
  const wall = 0.2;
  const run = (x0, z0, x1, z1) => col.add(x0, z0, x1, z1, wall);
  // landing
  run(L.x0, L.z0, L.x0, L.z1);
  run(L.x1, L.z0, L.x1, L.z1);
  run(L.x0, L.z1, L.x1, L.z1);
  run(L.x0, L.z0, B.door.x0, L.z0); // either side of the doorway
  run(B.door.x1, L.z0, L.x1, L.z0);
  // the corridor
  run(HL.x0, HL.z0, HL.x0, HL.z1);
  run(HL.x1, HL.z0, HL.x1, HL.z1);
  // the vault
  run(V.x0, V.z0, V.x0, V.z1);
  run(V.x1, V.z0, V.x1, V.z1);
  run(V.x0, V.z0, V.x1, V.z0);
  run(V.x0, V.z1, HL.x0, V.z1);
  run(HL.x1, V.z1, V.x1, V.z1);
  // the crack is a wall too: nothing walks out of it (what does, comes out through the game)
  col.circle(B.rift.x, B.rift.z, 1.5);
  // the blast door: a capsule that moves with the slab. Parked far off while it stands open
  const doorCap = col.addDynamic((B.door.x0 + B.door.x1) / 2, B.door.z, 4.5, 0.14, 3.2);
  col.setSeg(doorCap, B.door.x0, 300, B.door.x1, 300);

  world.bunker = {
    ...B,
    y: fy,
    groundY: y0,
    col,
    doorCap,
    // the two ends the game asks about
    ladderTop: { x: B.ladder.x, z: B.ladder.z },
    rooms: ['landing', 'hall', 'vault'],
  };

  // ---- 3. the concrete ----
  const slab = (b, x0, x1, z0, z1, h) => {
    b.place((x0 + x1) / 2, fy - 0.12, (z0 + z1) / 2);
    b.box(x1 - x0, 0.24, z1 - z0, GK.CONCRETE);
    b.place((x0 + x1) / 2, fy + h, (z0 + z1) / 2);
    b.box(x1 - x0 + 0.4, 0.3, z1 - z0 + 0.4, GK.CONCRETE); // the ceiling
  };
  const wallsOf = (b, r, h) => {
    for (const [x, z] of [[r.x0, (r.z0 + r.z1) / 2], [r.x1, (r.z0 + r.z1) / 2]]) {
      b.place(x, fy + h / 2, z);
      b.box(0.26, h, r.z1 - r.z0, GK.CONCRETE);
      // the oil-paint band along the bottom two metres, peeling
      b.place(x + (x === r.x0 ? 0.14 : -0.14), fy + 0.95, z);
      b.box(0.02, 1.9, r.z1 - r.z0 - 0.02, GK.PAINTWALL);
    }
  };

  world.addProp(L.x0, L.z1, (b) => {
    const h = L.h;
    slab(b, L.x0 - 0.3, L.x1 + 0.3, L.z0 - 0.2, L.z1 + 0.3, h);
    wallsOf(b, L, h);
    b.place((L.x0 + L.x1) / 2, fy + h / 2, L.z1);
    b.box(L.x1 - L.x0 + 0.5, h, 0.26, GK.CONCRETE);
    b.place((L.x0 + L.x1) / 2, fy + 0.9, L.z1 - 0.14);
    b.box(L.x1 - L.x0, 1.8, 0.02, GK.PAINTWALL);
    // the doorway: a frame of steel angle either side, and a lintel
    for (const x of [B.door.x0, B.door.x1]) {
      b.place(x, fy + 1.4, B.door.z);
      b.box(0.16, 2.9, 0.3, GK.TIN);
    }
    b.place((B.door.x0 + B.door.x1) / 2, fy + 2.95, B.door.z);
    b.box(B.door.x1 - B.door.x0 + 0.2, 0.22, 0.34, GK.TIN);
    // a strip of hazard paint on the floor at the threshold, worn through in the middle
    for (let i = 0; i < 9; i++) {
      const x = B.door.x0 + 0.25 + i * 0.5;
      b.place(x, fy + 0.008, B.door.z - 0.35, 0, 0.12, 0);
      b.box(0.24, 0.012, 0.34, i % 2 ? GK.YELLOW : GK.DARK);
    }
    // the ladder up: two rails into a dark hole in the ceiling, rungs every 0.32 m
    const LX = B.ladder.x, LZ = B.ladder.z;
    b.place(LX - 0.26, fy + h / 2, LZ + 0.1, 0, 0, 0.02);
    b.box(0.06, h, 0.06, GK.RUST);
    b.place(LX + 0.26, fy + h / 2, LZ + 0.1, 0, 0, -0.02);
    b.box(0.06, h, 0.06, GK.RUST);
    for (let k = 0; k < 10; k++) {
      b.place(LX, fy + 0.28 + k * 0.32, LZ + 0.1);
      b.cylinder(5, 0.019, 0.019, 0.52, GK.RUST, { capTop: true });
      b.place(LX, fy + 0.28 + k * 0.32, LZ + 0.1, 0, 0, Math.PI / 2);
      b.box(0.02, 0.54, 0.02, GK.RUST);
    }
    // the hatch hole above it: a shaft of black with a rim of angle iron
    b.place(LX, fy + h - 0.02, LZ + 0.1);
    b.box(0.95, 0.06, 0.95, GK.DARK);
    for (const s of [-1, 1]) {
      b.place(LX + s * 0.5, fy + h + 0.02, LZ + 0.1);
      b.box(0.1, 0.12, 1.0, GK.TIN);
      b.place(LX, fy + h + 0.02, LZ + 0.1 + s * 0.5);
      b.box(1.0, 0.12, 0.1, GK.TIN);
    }
    // crates somebody stacked and never came back for; a bench; a bucket of sand
    const cr = (x, z, s, ry) => {
      b.place(x, fy + s / 2, z, 0, ry, 0);
      b.box(0.8 * s, s, 0.6 * s, GK.WOODDARK);
      b.place(x, fy + s + 0.02, z, 0, ry, 0);
      b.box(0.84 * s, 0.04, 0.64 * s, GK.RUST);
    };
    cr(L.x0 + 0.95, L.z1 - 1.0, 0.62, 0.2);
    cr(L.x0 + 0.9, L.z1 - 1.05, 0.5, -0.35);
    b.place(L.x0 + 0.75, fy + 0.42, L.z1 - 2.6, 0, 0.08, 0);
    b.box(1.5, 0.09, 0.45, GK.WOODDARK);
    b.identity();
    for (const s of [-1, 1]) b.limb([L.x0 + 0.75 + s * 0.6, fy, L.z1 - 2.6], [L.x0 + 0.75 + s * 0.6, fy + 0.38, L.z1 - 2.6], 0.03, 0.03, GK.TIN, 4);
    b.place(L.x1 - 0.7, fy + 0.24, L.z1 - 1.4);
    b.cylinder(7, 0.2, 0.16, 0.48, GK.RUST, { capTop: true });
    // a painted sign on the wall by the door: ВЫХОД, with an arrow
    b.place((L.x0 + L.x1) / 2, fy + 2.15, B.door.z + 0.22);
    b.box(1.0, 0.3, 0.03, GK.GATE);
    b.identity();
    b.limb([(L.x0 + L.x1) / 2 - 0.3, fy + 2.15, B.door.z + 0.25], [(L.x0 + L.x1) / 2 + 0.32, fy + 2.15, B.door.z + 0.25], 0.035, 0.012, GK.YELLOW, 4);
  });

  world.addProp((HL.x0 + HL.x1) / 2, HL.z1, (b) => {
    const h = HL.h;
    slab(b, HL.x0 - 0.3, HL.x1 + 0.3, HL.z0 - 0.3, HL.z1 + 0.2, h);
    wallsOf(b, HL, h);
    // ribs every 3 m: a steel arch under the ceiling, its feet in the paint band
    for (let z = HL.z1 - 1.6; z > HL.z0; z -= 3.0) {
      for (const x of [HL.x0 + 0.22, HL.x1 - 0.22]) {
        b.place(x, fy + h / 2, z);
        b.box(0.14, h, 0.16, GK.TIN);
      }
      b.place((HL.x0 + HL.x1) / 2, fy + h - 0.1, z);
      b.box(HL.x1 - HL.x0 - 0.3, 0.17, 0.18, GK.TIN);
      b.place((HL.x0 + HL.x1) / 2, fy + 2.2, z);
      b.box(HL.x1 - HL.x0 - 0.24, 0.09, 0.12, GK.RUST);
    }
    // pipes: a fat water main on brackets along the west wall, a thin conduit along the east
    b.identity();
    b.limb([HL.x0 + 0.3, fy + 2.55, HL.z1], [HL.x0 + 0.3, fy + 2.55, HL.z0], 0.11, 0.11, GK.RUST, 6);
    b.limb([HL.x1 - 0.3, fy + 2.7, HL.z1], [HL.x1 - 0.3, fy + 2.7, HL.z0], 0.035, 0.035, GK.TIN, 5);
    for (let z = HL.z1 - 1.2; z > HL.z0; z -= 4.2) {
      b.identity();
      b.limb([HL.x0 + 0.02, fy + 2.55, z], [HL.x0 + 0.42, fy + 2.55, z], 0.03, 0.03, GK.TIN, 4);
      // valves on the main: a wheel every twelve metres
      if (Math.round((HL.z1 - z) / 4.2) % 2 === 0) {
        b.place(HL.x0 + 0.32, fy + 2.55, z, 0, 0, Math.PI / 2);
        b.cylinder(8, 0.16, 0.16, 0.04, GK.DARK, { capTop: true });
        b.identity();
        b.limb([HL.x0 + 0.32, fy + 2.55, z], [HL.x0 + 0.32, fy + 2.42, z], 0.03, 0.03, GK.RUST, 4);
      }
    }
    // cable trays over the corridor, and the lamps' conduits
    for (const x of [HL.x0 + 0.42, HL.x1 - 0.42]) {
      b.place(x, fy + h - 0.28, (HL.z0 + HL.z1) / 2);
      b.box(0.1, 0.06, HL.z1 - HL.z0 - 0.4, GK.DARK);
    }
    // the floor: expansion joints every 2.2 m, its surface heaved in one place, gravel and grit in the corners
    for (let z = HL.z0 + 2.2; z < HL.z1; z += 2.2) {
      b.place((HL.x0 + HL.x1) / 2, fy + 0.004, z);
      b.box(HL.x1 - HL.x0 - 0.02, 0.014, 0.05, GK.DARK);
    }
    b.place(HL.x0 + 1.2, fy + 0.05, HL.z0 + 6.0, 0.05, 0.3, 0.02);
    b.box(1.3, 0.1, 1.6, GK.CONCRETE);
    // a dead light by the door and its pulled wire
    b.place((HL.x0 + HL.x1) / 2, fy + h - 0.34, HL.z1 - 0.9);
    b.box(0.5, 0.09, 0.16, GK.TIN);
    b.identity();
    b.limb([(HL.x0 + HL.x1) / 2 + 0.14, fy + h - 0.3, HL.z1 - 0.95], [(HL.x0 + HL.x1) / 2 + 0.3, fy + h - 0.62, HL.z1 - 1.6], 0.012, 0.006, GK.DARK, 3);
    // a barrow against the east wall, on its side, one wheel still on
    b.place(HL.x1 - 0.75, fy + 0.3, HL.z0 + 4.5, 0, 0.4, 1.35);
    b.box(0.9, 0.42, 0.6, GK.RUST);
    b.identity();
    b.limb([HL.x1 - 0.6, fy + 0.15, HL.z0 + 4.9], [HL.x1 - 1.1, fy + 0.5, HL.z0 + 4.2], 0.03, 0.025, GK.TIN, 4);
  });

  world.addProp((V.x0 + V.x1) / 2, V.z0, (b) => {
    const h = V.h;
    slab(b, V.x0 - 0.3, V.x1 + 0.3, V.z0 - 0.4, V.z1 + 0.3, h);
    wallsOf(b, V, h);
    b.place((V.x0 + V.x1) / 2, fy + h / 2, V.z0);
    b.box(V.x1 - V.x0 + 0.5, h, 0.26, GK.CONCRETE);
    b.place((V.x0 + V.x1) / 2, fy + 0.95, V.z0 + 0.14);
    b.box(V.x1 - V.x0, 1.9, 0.02, GK.PAINTWALL);
    // the north wall, either side of the corridor's mouth, with a lintel over it
    for (const [x0, x1] of [[V.x0 - 0.2, HL.x0], [HL.x1, V.x1 + 0.2]]) {
      b.place((x0 + x1) / 2, fy + h / 2, V.z1);
      b.box(x1 - x0, h, 0.26, GK.CONCRETE);
    }
    b.place((HL.x0 + HL.x1) / 2, fy + h - 0.6, V.z1);
    b.box(HL.x1 - HL.x0 + 0.5, 1.2, 0.26, GK.CONCRETE);
    // an arch of ribs over the vault, and a pair of columns
    for (let z = V.z1 - 3.0; z > V.z0 + 2.0; z -= 4.0) {
      for (const x of [V.x0 + 0.6, V.x1 - 0.6]) {
        b.place(x, fy + h / 2, z);
        b.box(0.34, h, 0.34, GK.CONCRETE);
      }
      b.place((V.x0 + V.x1) / 2, fy + h - 0.16, z);
      b.box(V.x1 - V.x0 - 0.8, 0.28, 0.3, GK.TIN);
    }
    // the breaker's panel on the east wall: a heavy box on stand-offs, its cable tray running up and away
    const BX = B.breaker.x, BZ = B.breaker.z;
    b.place(BX - 0.1, fy + 1.35, BZ, 0, 0, 0);
    b.box(0.22, 1.1, 0.9, GK.DARK);
    b.place(BX - 0.22, fy + 1.35, BZ);
    b.box(0.03, 0.98, 0.78, GK.RUST);
    b.place(BX - 0.08, fy + 1.95, BZ);
    b.box(0.3, 0.09, 0.5, GK.TIN);
    b.identity();
    b.limb([BX - 0.1, fy + 2.0, BZ], [BX - 0.1, fy + h - 0.4, BZ], 0.05, 0.05, GK.RUST, 4);
    b.limb([BX - 0.1, fy + h - 0.4, BZ], [V.x0 + 1.6, fy + h - 0.45, BZ], 0.05, 0.05, GK.RUST, 4);
    // the wall that came apart: a wedge torn out of the far wall, its teeth pointing in, rubble under it
    const RX = B.rift.x, RZ = B.rift.z;
    b.identity();
    for (let k = 0; k < 7; k++) {
      const f = k / 6, y = fy + 0.2 + f * 3.6, w = 1.9 - Math.abs(f - 0.45) * 2.6;
      if (w <= 0.15) continue;
      b.place(RX + rng.float(-0.35, 0.35), y, RZ + 0.14, 0, rng.float(-0.3, 0.3), rng.float(-0.15, 0.15));
      b.rock(w * 0.42, () => rng.next(), GK.CONCRETE, 0.42, 0.55);
    }
    // the hole itself: black, and deep. (the red light in it is the game's)
    b.place(RX, fy + 1.7, RZ + 0.02);
    b.box(2.2, 3.5, 0.06, GK.NIGHT);
    // rubble on the floor, and a few bones that were not there before the wall opened
    for (let k = 0; k < 16; k++) {
      const x = RX + rng.float(-2.6, 2.6), z = RZ + rng.float(-0.4, 2.6);
      b.place(x, fy + rng.float(0.02, 0.12), z, rng.float(0, 3), rng.float(0, 6), rng.float(0, 3), rng.float(0.4, 1.1));
      b.rock(rng.float(0.08, 0.24), () => rng.next(), GK.CONCRETE, 0.5, 0.6);
    }
    for (let k = 0; k < 7; k++) {
      b.place(RX + rng.float(-2.2, 2.2), fy + 0.05, RZ + rng.float(-0.2, 2.2), 0, rng.float(0, 6), Math.PI / 2);
      b.limb([0, 0, 0], [rng.float(0.2, 0.45), 0, 0], 0.022, 0.012, KIND.BONE, 3);
    }
    // what the shelter was for: empty racking down the west side, a drum, a stretcher folded against a column
    for (let z = V.z1 - 2.4; z > V.z0 + 2.4; z -= 1.9) {
      b.place(V.x0 + 1.5, fy + 0.7, z);
      b.box(1.5, 0.06, 0.7, GK.TIN);
      b.place(V.x0 + 1.5, fy + 1.5, z);
      b.box(1.5, 0.06, 0.7, GK.TIN);
      b.identity();
      for (const s of [-1, 1]) b.limb([V.x0 + 1.5 + s * 0.7, fy, z], [V.x0 + 1.5 + s * 0.7, fy + 2.2, z], 0.03, 0.03, GK.RUST, 4);
    }
    b.place(V.x0 + 1.3, fy + 0.45, V.z1 - 1.1);
    b.cylinder(8, 0.3, 0.3, 0.9, GK.RUST, { capTop: true });
  });

  return world.bunker;
}

// ---------------- the shelter's script ----------------
// One switch, and this is what follows it, in order and out of your hands:
//
//   the breaker clunks  →  the gate's motor answers, up in the yard  →  the wall at the far end moves
//   →  the lamps die, one by one, from the far end toward you  →  the alarm, and the blast door starting down
//   →  three minutes, one for each of the things the light was keeping still.
//
// The whole sequence is pure numbers in here, so it can be read (and tested) without a screen: the game takes
// the events this hands back and turns them into sound and light. DOOR_TIME is the three minutes; when the slab
// reaches the floor with you on the wrong side of it, the shelter has you.
export const T_GATE = 0.55; // s after the breaker: the gate starts rolling, far above
export const T_STIR = 2.3; // ...the crack answers
export const T_BLACK = 3.2; // ...the lamps start going out
export const T_ALARM = 4.4; // ...and the blast door starts down, with the siren
const OUT_EVERY = 0.42; // one of them climbs out of the crack this often
export const HORDE_MAX = 9;

export class ShelterScript {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = 'sealed'; // sealed | unlocked | open | inside | left
    this.thrown = false;
    this.t = 0; // s since the breaker
    this.wake = 0; // 0..1: how much of the crack is awake
    this.lit = 1; // 0..1: the lamps
    this.doorK = 1; // 1 = the slab up in its slot (open), 0 = shut
    this.alarmT = -1; // s since the siren started, −1 while it is quiet
    this.out = 0; // how many have come out of the crack
    this.events = [];
  }

  // the yard's power reaches the cap in the yard: the lock lets go (the door is still shut)
  power() {
    if (this.state !== 'sealed') return null;
    this.state = 'unlocked';
    return 'unlock';
  }

  // ...and you throw the bolt back: the way down is open
  open() {
    if (this.state !== 'unlocked' && this.state !== 'open') return false;
    this.state = 'open';
    return true;
  }

  enter() {
    if (this.state !== 'open' && this.state !== 'inside') return false;
    this.state = 'inside';
    return true;
  }

  // back up the ladder and out. Once it is awake there is no going down again: the cap is shut for good
  leave() {
    if (this.state !== 'inside') return false;
    this.state = 'left';
    this.alarmT = -1;
    return true;
  }

  get canThrow() {
    return this.state === 'inside' && !this.thrown;
  }

  get awake() {
    return this.thrown;
  }

  get sealed() {
    return this.doorK <= 0.0001;
  }

  // the breaker. Returns false if it has already been thrown (there is one, and it stays down)
  throwBreaker() {
    if (!this.canThrow) return false;
    this.thrown = true;
    this.t = 0;
    this.events = [];
    return true;
  }

  // advance the sequence; returns the beats crossed this frame
  step(dt) {
    const ev = [];
    if (this.thrown && this.state === 'inside') {
      const t0 = this.t;
      this.t += dt;
      const cross = (a) => t0 < a && this.t >= a;
      if (cross(T_GATE)) ev.push('gate');
      if (cross(T_STIR)) ev.push('stir');
      if (cross(T_BLACK)) ev.push('blackout');
      this.wake = clamp(smoothstep(T_STIR, T_ALARM + 0.6, this.t), 0, 1);
      // the lamps go out from the far end toward the landing: six of them, in order, over nine-tenths of a second
      this.lit = this.t < T_BLACK ? 1 : clamp(1 - (this.t - T_BLACK) / 0.9, 0, 1);
      if (cross(T_ALARM)) {
        ev.push('alarm');
        this.alarmT = 0;
      }
      if (this.t >= T_ALARM) {
        this.alarmT = this.t - T_ALARM;
        this.doorK = clamp(1 - (this.alarmT / DOOR_TIME), 0, 1);
        const n = Math.min(HORDE_MAX, Math.floor(this.alarmT / OUT_EVERY) + 1);
        while (this.out < n) {
          this.out++;
          ev.push('out');
        }
        if (this.sealed && !this.dead) {
          this.dead = true;
          ev.push('sealed');
        }
      }
    } else if (this.thrown) {
      // out of the shelter, the clock stops: the door below still comes down, but it is no longer your problem
      this.alarmT = -1;
    }
    return ev;
  }

  // the lamp index that is still burning, from the far end back (0 = all of them, 6 = none)
  lampsLit() {
    return Math.round(this.lit * 6);
  }
}
