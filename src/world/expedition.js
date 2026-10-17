// Optional detours, not generator sites. Their own random stream keeps the old landmarks unchanged.
// Shared by the forest and the atlas: the plates show the very same buildings, not stand-ins.
import * as THREE from 'three';
import { MeshBuilder, KIND } from './builder.js';
import { GK, boxAt } from '../ui/garageSet.js';

export const FIRETOWER = { x: -178, z: 204, r: 14, deck: 16, climb: 5, descend: 4, look: 10, cooldown: 25, far: 390 };
export const ZARYA = { x: -170, z: -182, r: 41, speaker: { x: 0, z: -7 }, duration: 35, loud: 1.4 };
const PI = Math.PI;
const WOOD = 2, METAL = 3; // World.CAP (avoid importing World back into its builder)

// Block lettering cut from the same geometry as the sign: visible in an echo and casts proper shadows.
const GLYPHS = {
  'З': ['111','001','011','001','111'], 'О': ['111','101','101','101','111'],
  'Р': ['110','101','110','100','100'], 'Ь': ['100','100','110','101','110'],
  'К': ['101','101','110','101','101'], 'А': ['010','101','111','101','101'],
  'П': ['111','101','101','101','101'], 'У': ['101','101','011','001','110'],
  'С': ['111','100','100','100','111'], 'Т': ['111','010','010','010','010'],
  'Л': ['011','101','101','101','101'], 'В': ['110','101','110','101','110'],
  'Я': ['011','101','011','101','101'], 'Ж': ['101','111','010','111','101'],
  'Н': ['101','101','111','101','101'], 'И': ['101','101','111','101','101'],
  'Ш': ['101','101','101','101','111'], 'Ы': ['101','101','111','101','111'],
  'Й': ['010','101','111','101','101'], '1': ['010','110','010','010','111'],
  '2': ['110','001','010','100','111'], '8': ['111','101','111','101','111'],
};
export function lettering(b, text, x, y, z, cell, mat = KIND.BONE, yaw = 0) {
  const width = (text.length * 4 - 1) * cell;
  for (let k = 0; k < text.length; k++) {
    const rows = GLYPHS[text[k]];
    if (!rows) continue;
    rows.forEach((row, j) => [...row].forEach((v, i) => {
      const dx = -width / 2 + (k * 4 + i + 0.5) * cell;
      if (v === '1') boxAt(b, x + dx * Math.cos(yaw), y + (2 - j) * cell, z - dx * Math.sin(yaw), cell * 0.86, cell * 0.86, cell * 0.18, mat, yaw);
    }));
  }
}

export function buildBinoculars(b = new MeshBuilder(512)) {
  // objective lenses face -z, eyepieces +z; the pair of offset prisms and a focus wheel
  for (const s of [-1, 1]) {
    for (const [z, r, len] of [[-0.08, 0.054, 0.15], [0.045, 0.043, 0.11], [0.14, 0.031, 0.06]]) {
      b.place(s * 0.078, 0.07, z, PI / 2, 0, 0);
      b.cylinder(8, r, r * 0.94, len, GK.DARK, { y0: -len / 2, capBottom: true });
    }
    boxAt(b, s * 0.072, 0.075, 0.015, 0.1, 0.1, 0.1, GK.CARPAINT, s * 0.1);
    b.place(s * 0.078, 0.07, -0.159, PI / 2, 0, 0);
    b.cylinder(8, 0.044, 0.044, 0.004, GK.GLASS);
  }
  boxAt(b, 0, 0.07, 0.015, 0.16, 0.025, 0.04, GK.CHROME);
  b.place(0, 0.11, 0.04, PI / 2, 0, 0);
  b.cylinder(10, 0.025, 0.025, 0.035, GK.RUBBER, { capBottom: true });
  return b;
}

export function buildFiretower(world, L) {
  const x = L.x, z = L.z, y = world.terrain.height(x, z), H = FIRETOWER.deck;
  world.firetower = { x, y, z, ladder: { x, y, z: z + 2.7 }, top: { x, y: y + H, z: z + 0.15 } };
  world.addProp(x, z, (b) => {
    const box = (xx, yy, zz, w, h, d, mat = KIND.WOOD, ry = 0) => boxAt(b, x + xx, y + yy, z + zz, w, h, d, mat, ry);
    const limb = (a, c, r = 0.06, mat = KIND.WOOD) => { b.place(x, y, z); b.limb(a, c, r, r, mat, 4); };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(sx * 2.5, 0.18, sz * 2.5, 0.75, 0.36, 0.75, GK.CONCRETE);
      limb([sx * 2.5, 0.25, sz * 2.5], [sx * 1.65, H, sz * 1.65], 0.15);
    }
    for (let j = 0; j < 4; j++) {
      const y0 = j * 4 + 0.5, y1 = (j + 1) * 4, a = 2.5 - j * 0.21, a1 = a - 0.21;
      for (const s of [-1, 1]) {
        limb([-a, y0, s * a], [a1, y1, s * a1]);
        limb([s * a, y0, -a], [s * a1, y1, a1]);
        // the front has a gap for the ladder
        if (s < 0) limb([a, y0, s * a], [-a1, y1, s * a1]);
        limb([s * a, y0, a], [s * a1, y1, -a1]);
      }
      box(0, y1, -a1, a1 * 2, 0.12, 0.12);
      box(0, y1, a1, a1 * 2, 0.12, 0.12);
    }
    // two rusty ladder rails, rungs all the way up, a safety cage on the last few metres
    for (const s of [-1, 1]) limb([s * 0.43, 0.15, 2.42], [s * 0.43, H + 0.9, 1.98], 0.036, GK.RUST);
    for (let h = 0.28; h < H + 0.2; h += 0.34) {
      const zz = 2.42 - h / H * 0.44;
      limb([-0.43, h, zz], [0.43, h, zz], 0.025, GK.RUST);
    }
    // deck, open rails, a small weather roof (no walls to hide the view)
    for (let i = 0; i < 14; i++) box(-1.9 + i * 0.29, H, 0, 0.275, 0.18, 4.1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(sx * 1.96, H + 1.6, sz * 1.96, 0.1, 3.2, 0.1);
      box(sx * 1.96, H + 0.8, sz * 1.96, 0.17, 0.08, 0.17, GK.TIN);
    }
    for (const s of [-1, 1]) {
      box(s * 1.96, H + 1, 0, 0.08, 0.1, 4);
      box(0, H + 1, -1.96, 4, 0.1, 0.08);
      box(s * 1.27, H + 1, 1.96, 1.5, 0.1, 0.08);
      box(s * 1.96, H + 0.48, 0, 0.06, 0.08, 4);
    }
    b.place(x, y, z);
    for (const s of [-1, 1]) {
      const A = [-2.3, H + 3, s * 2.3], B = [2.3, H + 3, s * 2.3], C = [2.3, H + 3.8, 0], D = [-2.3, H + 3.8, 0];
      b.quadN(A, B, C, D, [0, 1, s], GK.TIN);
      b.quadN(D, C, B, A, [0, -1, -s], GK.TIN);
    }
    box(0.85, H + 0.65, -0.95, 1.25, 0.08, 0.6); // logbook table
    box(0.85, H + 0.71, -0.95, 0.27, 0.025, 0.21, GK.PAPER);
    for (const s of [-1, 1]) box(0.85 + s * 0.45, H + 0.31, -0.95, 0.06, 0.62, 0.45);
    box(1.6, 1.6, 2.3, 2.1, 0.7, 0.1, GK.REDPAINT);
    lettering(b, 'ПОЖАР', x + 1.6, y + 1.62, z + 2.36, 0.09);
    // a binocular pedestal (the optic itself is a dynamic mesh, so it can swivel)
    limb([0, H + 0.1, -0.7], [0, H + 1.28, -0.7], 0.04, GK.RUST);
  });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) world.col.circle(x + sx * 2.5, z + sz * 2.5, 0.24, H, WOOD);
  // a tool locker at the foot, with a spare light stick rather than an extra generator
  world.addCabinet('firetower:locker', 'locker', x - 3.5, y, z - 0.2, PI / 2, false, { loot: ['glow', 'nuts'] });
}

export function buildZarya(world, L) {
  const x = L.x, z = L.z, y = world.terrain.height(x, z);
  const buildings = [
    { id: 'dorm1', x: -14, z: -6, w: 8, d: 11, label: 'КОРПУС 1', dorm: true },
    { id: 'dorm2', x: 14, z: -6, w: 8, d: 11, label: 'КОРПУС 2', dorm: true },
    { id: 'dining', x: 0, z: -23, w: 17, d: 9, label: 'СТОЛОВАЯ' },
  ];
  world.zarya = {
    x, y, z,
    floors: buildings.map((B) => ({ x: x + B.x, z: z + B.z, w: B.w + 0.3, d: B.d + 0.3, y: y + 0.18 })),
    speaker: { x: x + ZARYA.speaker.x, y: y + 5.1, z: z + ZARYA.speaker.z },
    switch: { x: x + 0.65, y, z: z + ZARYA.speaker.z + 0.5 },
  };
  for (const B of buildings) {
    const bx = x + B.x, bz = z + B.z, W = B.w, D = B.d, H = 2.85, T = 0.16;
    world.addProp(bx, bz, (b) => {
      const box = (xx, yy, zz, w, h, d, mat = KIND.WOOD, ry = 0) => boxAt(b, bx + xx, y + yy, bz + zz, w, h, d, mat, ry);
      box(0, 0.09, 0, W + 0.3, 0.18, D + 0.3, GK.BLOCK);
      box(0, H / 2, -D / 2, W, H, T, GK.PAINTWALL);
      // side walls with three broken-open window apertures (no invisible collision across the door)
      for (const s of [-1, 1]) {
        box(s * W / 2, 0.55, 0, T, 1.1, D, GK.PAINTWALL);
        box(s * W / 2, 2.5, 0, T, 0.7, D, GK.PAINTWALL);
        for (let j = 0; j < 4; j++) box(s * W / 2, 1.65, -D / 2 + 0.35 + j * (D - 0.7) / 3, T, 1.1, 0.7, GK.PAINTWALL);
        for (let j = 0; j < 3; j++) box(s * (W / 2 + 0.03), 1.08, -D / 3 + j * D / 3, 0.36, 0.07, 1.6, KIND.BONE);
      }
      const gap = 1.65;
      for (const s of [-1, 1]) box(s * (W + gap) / 4, H / 2, D / 2, (W - gap) / 2, H, T, GK.PAINTWALL);
      box(0, H - 0.22, D / 2, gap, 0.44, T, GK.PAINTWALL);
      box(0, 0.05, D / 2 + 0.48, 2, 0.1, 0.65, GK.BLOCK);
      box(0, H + 0.25, D / 2 + 0.12, B.dorm ? 3 : 4, 0.52, 0.08, GK.REDPAINT);
      lettering(b, B.label, bx, y + H + 0.27, bz + D / 2 + 0.17, B.dorm ? 0.07 : 0.09);
      b.place(bx, y, bz);
      for (const s of [-1, 1]) {
        const A = [-W / 2 - 0.4, H, s * (D / 2 + 0.4)], C = [W / 2 + 0.4, H + 1.1, 0];
        const BB = [W / 2 + 0.4, H, s * (D / 2 + 0.4)], DD = [-W / 2 - 0.4, H + 1.1, 0];
        b.quadN(A, BB, C, DD, [0, 1, s], GK.TIN);
        b.quadN(DD, C, BB, A, [0, -1, -s], GK.TIN);
      }
      if (B.dorm) {
        for (const s of [-1, 1]) for (const zz of [-3.6, -0.7, 2.2]) {
          box(s * (W / 2 - 0.75), 0.45, zz, 1.15, 0.09, 2, GK.RUST);
          box(s * (W / 2 - 0.75), 0.54, zz, 1.08, 0.14, 1.92, GK.CANVAS);
          box(s * (W / 2 - 0.75), 0.65, zz - 0.67, 0.8, 0.13, 0.45, KIND.BONE);
          for (const dz of [-0.83, 0.83]) box(s * (W / 2 - 0.75), 0.22, zz + dz, 1.08, 0.44, 0.05, GK.RUST);
        }
      } else {
        for (const xx of [-5.2, 0, 5.2]) {
          box(xx, 0.8, 0.7, 2.6, 0.09, 1.35);
          for (const s of [-1, 1]) {
            box(xx, 0.44, 0.7 + s * 1.05, 2.6, 0.1, 0.38);
            for (const dx of [-0.9, 0.9]) box(xx + dx, 0.39, 0.7, 0.07, 0.78, 1.2);
          }
        }
        box(4.5, 0.85, -2.65, 5.5, 0.1, 1.15, GK.TIN); // kitchen / tape table
        for (const xx of [2.2, 6.8]) box(xx, 0.42, -2.65, 0.1, 0.84, 1);
        // abandoned enamel bowls, a huge pot
        for (const xx of [3, 5.2]) { b.place(bx + xx, y + 0.91, bz - 2.65); b.cylinder(8, 0.12, 0.16, 0.08, KIND.BONE); }
        b.place(bx + 6.4, y + 0.91, bz - 2.65); b.cylinder(10, 0.25, 0.25, 0.32, GK.TIN);
      }
    });
    const seg = (ax, az, cx, cz) => world.col.add(bx + ax, bz + az, bx + cx, bz + cz, T, H, WOOD);
    seg(-W / 2, -D / 2, W / 2, -D / 2);
    seg(-W / 2, -D / 2, -W / 2, D / 2);
    seg(W / 2, -D / 2, W / 2, D / 2);
    seg(-W / 2, D / 2, -0.825, D / 2);
    seg(0.825, D / 2, W / 2, D / 2);
    // Furnishings have colliders too, but leave the aisle and the door clear.
    if (B.dorm) {
      for (const s of [-1, 1]) for (const zz of [-3.6, -0.7, 2.2]) world.col.add(bx + s * (W / 2 - 0.75), bz + zz - 0.45, bx + s * (W / 2 - 0.75), bz + zz + 0.45, 0.58, 0.7, WOOD);
      for (let i = 0; i < 3; i++) world.addCabinet(`zarya:${B.id}:${i}`, 'locker', bx - 1.05 + i * 1.05, y + 0.18, bz - D / 2 + 0.4, 0, false, { locked: i === 1, minLoot: 2, loot: i === 1 ? ['shard', 'flare', 'battery'] : null });
    } else {
      for (const xx of [-5.2, 0, 5.2]) world.col.add(bx + xx - 0.68, bz + 0.7, bx + xx + 0.68, bz + 0.7, 0.7, 0.85, WOOD);
      world.col.add(bx + 2.2, bz - 2.65, bx + 6.8, bz - 2.65, 0.57, 0.9, METAL);
      world.addCabinet('zarya:kitchen', 'cupboard', bx - 5.3, y + 0.18, bz - 3.9, 0, false, { locked: true, loot: ['glow', 'shard', 'flare'] });
      world.addCabinet('zarya:aid', 'firstaid', bx - 7.2, y + 0.18, bz - 1.4, PI / 2, false, { loot: ['glow', 'battery'] });
    }
  }
  world.addProp(x, z, (b) => {
    const box = (xx, yy, zz, w, h, d, mat = KIND.WOOD) => boxAt(b, x + xx, y + yy, z + zz, w, h, d, mat);
    // gate / faded camp name
    for (const s of [-1, 1]) box(s * 3.8, 2.35, 20, 0.22, 4.7, 0.22, GK.REDPAINT);
    box(0, 4.2, 20, 8.2, 1.5, 0.18, GK.REDPAINT);
    lettering(b, 'ЗОРЬКА', x, y + 4.23, z + 20.11, 0.26);
    for (const s of [-1, 1]) for (let i = 0; i < 10; i++) {
      box(s * (4.6 + i * 0.75), 0.7, 20, 0.16, 1.4 - (i % 3) * 0.12, 0.12, KIND.BONE);
      box(s * 8.3, 0.5 + (i % 2) * 0.5, 20, 7.8, 0.07, 0.08);
    }
    // assembly square, flagpole with a torn flag and horn speaker, switch box at the foot
    box(0, 0.012, 0, 12, 0.025, 12, GK.CONCRETE);
    box(0, 0.18, -7, 1.2, 0.35, 1.2, GK.BLOCK);
    b.place(x, y + 0.35, z - 7); b.cylinder(6, 0.065, 0.045, 7.2, GK.RUST);
    b.place(x, y, z);
    b.quad([0.05,7.2,-7], [2,6.85,-7.25], [1.3,5.9,-7.15], [0.05,6.1,-7], GK.REDPAINT);
    b.quad([0.05,6.1,-7], [1.3,5.9,-7.15], [2,6.85,-7.25], [0.05,7.2,-7], GK.REDPAINT);
    b.place(x, y + 5.1, z - 7, PI / 2, 0, 0); b.cylinder(8, 0.12, 0.46, 0.6, GK.TIN, { capTop: false });
    box(0.65, 1.05, -6.5, 0.35, 0.45, 0.16, GK.GATE);
    box(0.65, 1.08, -6.4, 0.08, 0.16, 0.035, GK.REDPAINT);
    // a sandbox and a swing with one empty, crooked seat
    box(-10, 0.13, 11.7, 4, 0.25, 0.12);
    box(-10, 0.13, 15, 4, 0.25, 0.12);
    for (const s of [-1, 1]) box(-10 + s * 2, 0.13, 13.3, 0.12, 0.25, 3.4);
    b.place(x, y, z);
    for (const xx of [9, 14]) {
      b.limb([xx, 0, 11], [xx, 3, 13], 0.06, 0.06, GK.RUST, 5);
      b.limb([xx, 0, 15], [xx, 3, 13], 0.06, 0.06, GK.RUST, 5);
    }
    b.limb([9, 3, 13], [14, 3, 13], 0.08, 0.08, GK.RUST, 5);
    for (const xx of [11, 12]) b.limb([xx, 2.95, 13], [xx, 0.65, 13.2], 0.012, 0.012, GK.CHROME, 4);
    box(11.5, 0.65, 13.2, 1.15, 0.08, 0.4);
  });
  for (const s of [-1, 1]) world.col.circle(x + s * 3.8, z + 20, 0.18, 4.7, WOOD);
  world.col.circle(x, z - 7, 0.3, 7.5, METAL);
}

// A real, echo-visible signpost near the starting fire, pointing toward both detours.
export function buildWaymarks(world) {
  const x = world.col.free(6, 6, 0.7) ? 6 : 7.5, z = 6, y = world.terrain.height(x, z);
  world.addProp(x, z, (b) => {
    boxAt(b, x, y + 1.3, z, 0.14, 2.6, 0.14, KIND.WOOD);
    for (const [name, target, h] of [['ЗОРЬКА', ZARYA, 2.1], ['ВЫШКА', FIRETOWER, 1.45]]) {
      const dx = target.x - x, dz = target.z - z, yaw = Math.atan2(-dz, dx);
      const c = Math.cos(yaw), s = Math.sin(yaw);
      boxAt(b, x, y + h, z, 3.1, 0.62, 0.12, GK.REDPAINT, yaw);
      lettering(b, name, x + s * 0.075, y + h, z + c * 0.075, 0.105, KIND.BONE, yaw);
      // readable from either side; the arrow still physically points along the right direction
      lettering(b, name, x - s * 0.075, y + h, z - c * 0.075, 0.105, KIND.BONE, yaw + PI);
      b.place(x, y + h, z, 0, yaw, 0);
      b.tri([1.55,-0.31,0.061], [1.95,0,0.061], [1.55,0.31,0.061], GK.REDPAINT);
      b.tri([1.55,0.31,-0.061], [1.95,0,-0.061], [1.55,-0.31,-0.061], GK.REDPAINT);
    }
  });
  world.col.circle(x, z, 0.12, 2.6, WOOD);
}
