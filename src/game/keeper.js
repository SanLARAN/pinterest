// (5.0d) The Сторож — the keeper of the village on «Топь» (chapters 3–4, docs/LEVEL2.md).
//
// A tall man in a long coat and a hood, a storm lantern held out in front of him: the lantern is a real light (one
// of the shader's small-light slots), so you see him the way you see anything here — by what he lights — and his
// light comes through the gaps of a house before he does. He is drawn as a person (the survivor rig in his own
// clothes, a head taller than anyone), not as a monster's echo: he is a man, if that is the word.
//
// This file is his body and the pure rules of his senses and his way about the village; what he decides (the
// round, the sounds he goes to, who he takes back) is the chapter's (game/village.js), on the host.
import * as THREE from 'three';
import { KIND } from '../world/builder.js';
import { clamp, lerp } from '../core/rng.js';
import { part } from './monsters.js';
import { buildSurvivor, poseSurvivor, poseCarrier } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture } from './roadTraffic.js';

const PI = Math.PI;
const _v = new THREE.Vector3();

export const KEEPER_FIT = { head: 'hood', body: 'plaguecoat', hc: ['#1d1a16', '#2b261f'], bc: ['#221e19', '#16130f'] };
export const KEEPER_SCALE = 1.2; // a head over anyone
export const LANTERN = { I: 1.55, c: [1, 0.66, 0.3], R: 13 }; // his light: warm, and not far

export const KEEP = {
  walk: 1.6, // m/s on his round
  hurry: 3.3, // ...to a sound
  chase: 4.8, // ...after someone he has seen (you walk 3.1 and sprint 5.7 — for as long as your breath lasts)
  carry: 2.1, // ...with you over his shoulder
  look: 3.0, // s at each doorway on his round, the lantern up
  hearCreak: 32, // m: a rope's creak carries this far to him
  hearRun: 18, hearWalk: 7, // ...footsteps (a crouch is silent)
  seeR: 14, seeCos: 0.55, near: 2.6, // what his lantern shows him: this far ahead (±57°), and anyone this close
  catchR: 1.3,
  lose: 6, // s he searches where he lost you
  check: 3.2, // s at a post, pulling the knots tight again
  tie: 3.0, // s to tie someone he brought back
  r: 0.42,
};

// ---------------- the body ----------------
export function buildKeeperRig() {
  const rig = buildSurvivor(KEEPER_FIT);
  // the lantern, hanging from his left fist: cage, cap and a coal of light (the light itself is a shader slot)
  const lamp = new THREE.Object3D();
  lamp.position.set(0, -0.31, 0.03);
  rig.nodes.elL.add(lamp);
  rig.nodes.lantern = lamp;
  part(rig, lamp, (b) => {
    b.place(0, -0.02, 0); b.limb([0, 0.07, 0], [0, 0.0, 0], 0.008, 0.008, KIND.METAL, 3); // the bail
    b.place(0, -0.06, 0); b.cylinder(6, 0.05, 0.075, 0.035, KIND.METAL, { capBottom: true });
    b.place(0, -0.21, 0); b.cylinder(6, 0.075, 0.06, 0.03, KIND.METAL, { capTop: true });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * PI * 2 + 0.5;
      b.place(Math.cos(a) * 0.062, -0.14, Math.sin(a) * 0.062); b.box(0.012, 0.15, 0.012, KIND.METAL);
    }
    b.place(0, -0.14, 0); b.octa(0.036, 0.05, KIND.EYE);
  });
  return rig;
}

export class KeeperBody {
  constructor(scene, { lantern = true, rim = 0x5a3f1f } = {}) {
    this.rig = buildKeeperRig();
    this.rig.root.scale.setScalar(KEEPER_SCALE);
    this.mat = createPersonMaterial(this.rig.dyes, rim);
    this.mat.uniforms.uShow.value = 1;
    this.meshes = dressPerson(this.rig, this.mat);
    this.halo = null;
    this.lit = lantern ? 1 : 0;
    if (lantern) {
      this.halo = new THREE.Sprite(haloMaterial(0xffa04a, beaconTexture()));
      this.halo.position.set(0, -0.14, 0);
      this.halo.scale.setScalar(0.9);
      this.halo.material.opacity = 1.2;
      this.rig.nodes.lantern.add(this.halo);
    } else this.rig.nodes.lantern.visible = false;
    scene?.add(this.rig.root);
    this.x = 0; this.y = 0; this.z = 0; this.yaw = 0;
  }

  // yaw: the player's convention (he looks along (−sin yaw, −cos yaw)); the rig faces +z
  place(x, y, z, yaw) {
    this.x = x; this.y = y; this.z = z; this.yaw = yaw;
    this.rig.root.position.set(x, y, z);
    this.rig.root.rotation.set(0, yaw + PI, 0);
  }

  // phase: the stride; speed: m/s; raise 0..1: the lantern up to look; carry: someone over his shoulder;
  // kneel 0..1: down at a post; t: the clock (for the lantern's sway)
  pose({ phase = 0, speed = 0, raise = 0, carry = false, kneel = 0, t = 0 } = {}) {
    const rig = this.rig, n = rig.nodes;
    poseSurvivor(rig, phase, speed * 0.75, false, false);
    // a slow man's walk: short, a stoop under the hood
    n.chest.rotation.x += 0.12 + kneel * 0.5;
    n.head.rotation.x += 0.08 + kneel * 0.2;
    // the lantern arm: held out in front, higher when he looks into something
    n.shL.rotation.set(lerp(-0.62, -1.75, raise) + Math.sin(t * 0.9) * 0.025, 0, -0.18);
    n.elL.rotation.set(lerp(-0.55, -0.15, raise), 0, 0);
    n.lantern.rotation.x = Math.sin(phase) * 0.12 * clamp(speed / 2, 0, 1) + Math.sin(t * 1.7) * 0.04 - n.shL.rotation.x - n.elL.rotation.x;
    n.lantern.rotation.z = Math.cos(phase) * 0.08 * clamp(speed / 2, 0, 1);
    if (carry) poseCarrier(rig);
    if (kneel > 0) {
      n.hips.position.y = lerp(n.hips.position.y, 0.5, kneel);
      n.thL.rotation.x = lerp(n.thL.rotation.x, -1.5, kneel);
      n.knL.rotation.x = lerp(n.knL.rotation.x, 1.9, kneel);
      n.thR.rotation.x = lerp(n.thR.rotation.x, -0.3, kneel);
      n.knR.rotation.x = lerp(n.knR.rotation.x, 1.4, kneel);
      n.shR.rotation.set(-0.9 + Math.sin(t * 7) * 0.15 * kneel, 0, 0.1); // working a knot
      n.elR.rotation.x = -0.8 + Math.sin(t * 7 + 1) * 0.2 * kneel;
    }
  }

  lanternPos(out = _v) {
    this.rig.root.updateMatrixWorld(true);
    return this.rig.nodes.lantern.getWorldPosition(out);
  }

  // the slot his light asks for (null with no lantern)
  light(t = 0, k = 1) {
    if (!this.halo || this.lit * k <= 0.01) return null;
    const p = this.lanternPos();
    const fl = 0.9 + 0.07 * Math.sin(t * 11) + 0.03 * Math.sin(t * 23 + 1.7);
    return { x: p.x, y: p.y - 0.1, z: p.z, I: LANTERN.I * fl * this.lit * k, c: LANTERN.c, R: LANTERN.R, prio: 1, near: 0.12, id: this };
  }

  setVisible(v) { this.rig.root.visible = v; }

  dispose() {
    undressPerson(this.meshes);
    this.rig.root.removeFromParent();
    this.halo?.material.dispose();
    this.mat.dispose();
  }
}

// ---------------- his senses (pure: the tests ride on these) ----------------

// does a sound at (x, z) reach him? kind: 'creak' | 'run' | 'walk' | 'crouch'
export function hears(k, x, z, kind, K = KEEP) {
  const r = kind === 'creak' ? K.hearCreak : kind === 'run' ? K.hearRun : kind === 'walk' ? K.hearWalk : 0;
  return r > 0 && Math.hypot(x - k.x, z - k.z) <= r;
}

// does his lantern show him (x, z)? k: { x, z, yaw }; blocked(ax, az, bx, bz): a wall between
export function sees(k, x, z, blocked = null, K = KEEP) {
  const dx = x - k.x, dz = z - k.z, d = Math.hypot(dx, dz);
  if (d > K.seeR) return false;
  if (d > K.near) {
    const fx = -Math.sin(k.yaw), fz = -Math.cos(k.yaw);
    if ((dx * fx + dz * fz) / (d || 1) < K.seeCos) return false;
  }
  return !(blocked && blocked(k.x, k.z, x, z));
}

// the yaw (player convention) that looks from (fx, fz) toward (tx, tz)
export function yawTo(fx, fz, tx, tz) {
  return Math.atan2(-(tx - fx), -(tz - fz));
}

// a house in its own frame: { x, z, ry, W, D }; world → local
function local(H, x, z) {
  const c = Math.cos(H.ry), s = Math.sin(H.ry), dx = x - H.x, dz = z - H.z;
  return [dx * c - dz * s, dx * s + dz * c];
}
function world(H, lx, lz) {
  const c = Math.cos(H.ry), s = Math.sin(H.ry);
  return [H.x + lx * c + lz * s, H.z - lx * s + lz * c];
}
// does the segment a→b pass through the box |x| < hw, |z| < hd (house-local)? (Liang–Barsky)
function crosses(ax, az, bx, bz, hw, hd) {
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  for (const [p, q] of [[-dx, ax + hw], [dx, hw - ax], [-dz, az + hd], [dz, hd - az]]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t1 - t0 > 1e-4;
}

// the way round a house: if one stands between (x, z) and (tx, tz), the corner to make for first (outside it,
// with a margin), else null. Houses either end is inside of are left alone (the doorway is how he goes in).
export function detour(houses, x, z, tx, tz, margin = 0.8) {
  let best = null, bestAlong = Infinity;
  for (const H of houses) {
    if (Math.abs(H.x - x) > 40 && Math.abs(H.x - tx) > 40) continue;
    const hw = H.W / 2 + margin, hd = H.D / 2 + margin;
    const [ax, az] = local(H, x, z), [bx, bz] = local(H, tx, tz);
    if ((Math.abs(ax) < hw && Math.abs(az) < hd) || (Math.abs(bx) < hw && Math.abs(bz) < hd)) continue;
    if (!crosses(ax, az, bx, bz, hw, hd)) continue;
    const along = Math.hypot(H.x - x, H.z - z);
    if (along >= bestAlong) continue;
    // the corners, a little further out, that he can walk to straight — not the one he is standing at (from a
    // corner he goes on to the next; from the far side of the house the way on is clear)
    const cw = hw + 0.5, cd = hd + 0.5;
    let pick = null, cost = Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = sx * cw, cz = sz * cd;
      if (Math.hypot(cx - ax, cz - az) < 0.6 || crosses(ax, az, cx, cz, hw, hd)) continue;
      const c = Math.hypot(cx - ax, cz - az) + Math.hypot(bx - cx, bz - cz) + (crosses(cx, cz, bx, bz, hw, hd) ? hw + hd : 0);
      if (c < cost) { cost = c; pick = [cx, cz]; }
    }
    if (!pick) continue;
    const [wx, wz] = world(H, pick[0], pick[1]);
    best = { x: wx, z: wz, house: H.id };
    bestAlong = along;
  }
  return best;
}

// is (x, z) inside this house (with a margin)?
export function insideHouse(H, x, z, pad = 0) {
  const [lx, lz] = local(H, x, z);
  return Math.abs(lx) < H.W / 2 + pad && Math.abs(lz) < H.D / 2 + pad;
}
