// Cabin doors. Each hunting cabin has a plank door on two strap hinges: E swings it open or shut. It
// swings both ways and always away from whoever pushes it (nobody gets swept along by it). A shut door
// keeps the wanderers out for a while — they lean on it, it creaks, it gives. One that's hunting you
// doesn't lean: it hits the door until the door gives, and you hear every blow.
//
// Every machine animates every door. Any player can swing one; the newest swing wins (seq, then who) —
// the state also rides along with the objective snapshots, so a lost message heals itself. Only the
// host's monsters open doors; it tells everyone.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { CAP } from '../world/world.js';
import { clamp } from '../core/rng.js';

export const DOOR_OPEN = 1.9; // rad: swung open (either way), resting at an angle off the wall
const STOP = DOOR_OPEN + 0.2; // ...and nothing swings past this
const PASS = 1.5; // open at least this far and a body fits through
const USE_R = 1.9;
const LEAF_R = 0.06; // the leaf's collision half-thickness
// spring per kind of swing: stiffness, damping
const SPRING = { swing: [30, 9], creak: [5.5, 4.6], bash: [62, 4.8] };

// the leaf in its own space: hinge at the origin, closed along -x, the outside face toward +z.
// (shared with the atlas plate of the cabin)
export function buildDoorLeaf(b, w = 1.42, h = 1.95) {
  const Wd = KIND.WOOD, M = KIND.METAL;
  const n = 5, pw = w / n;
  const tops = [0, 0.03, 0.065, 0.015, 0.04]; // planks cut by hand, none of them quite level
  for (let i = 0; i < n; i++) {
    b.place(-pw * (i + 0.5), 0, 0);
    b.box(pw - 0.014, h - tops[i], 0.05, Wd, { bottom: true });
  }
  // a Z-brace on the inside: two ledges and the diagonal between them
  for (const y of [0.34, h - 0.36]) {
    b.place(-w / 2, y, -0.045);
    b.box(w - 0.14, 0.15, 0.04, Wd);
  }
  const x0 = -0.14, y0 = 0.42, x1 = -w + 0.14, y1 = h - 0.44;
  b.place((x0 + x1) / 2, (y0 + y1) / 2, -0.045, 0, 0, Math.atan2(y1 - y0, x1 - x0));
  b.box(Math.hypot(x1 - x0, y1 - y0) - 0.1, 0.13, 0.038, Wd);
  // strap hinges on the outside, and their knuckles on the jamb
  for (const y of [0.34, h - 0.36]) {
    b.place(-0.33, y, 0.032);
    b.box(0.66, 0.055, 0.012, M);
    b.place(0, y - 0.07, 0.03);
    b.cylinder(5, 0.024, 0.024, 0.14, M);
  }
  // a wooden pull outside, a latch bar inside
  const hx = -w + 0.15;
  b.place(0, 0, 0);
  b.limb([hx, 0.94, 0.03], [hx, 0.94, 0.1], 0.013, 0.013, Wd, 3);
  b.limb([hx, 1.16, 0.03], [hx, 1.16, 0.1], 0.013, 0.013, Wd, 3);
  b.limb([hx, 0.92, 0.1], [hx, 1.18, 0.1], 0.018, 0.018, Wd, 4);
  b.place(hx + 0.2, 1.05, -0.075);
  b.box(0.42, 0.045, 0.03, Wd);
}

// cabin-local ↔ world (same rotation as World.rot)
function toLocal(d, x, z) {
  const wx = x - d.x, wz = z - d.z;
  return { x: wx * d.c - wz * d.s, z: wx * d.s + wz * d.c };
}
function toWorld(d, lx, lz) {
  return { x: d.x + lx * d.c + lz * d.s, z: d.z - lx * d.s + lz * d.c };
}

export class Doors {
  constructor(game) {
    this.g = game;
    const world = game.world;
    const b = new MeshBuilder(512);
    this.list = (world.doors || []).map((spec, i) => {
      b.reset();
      buildDoorLeaf(b, spec.w, spec.h);
      const mesh = new THREE.Mesh(b.toGeometry(), world.material);
      mesh.matrixAutoUpdate = false;
      game.scene.add(mesh);
      const d = {
        i, id: spec.id, spec, mesh,
        x: spec.x, z: spec.z, y: spec.y, ry: spec.ry, c: Math.cos(spec.ry), s: Math.sin(spec.ry),
        W: spec.W, D: spec.D, w: spec.w,
        ang: 0, vel: 0, open: false, dir: 1, mode: 'swing', seq: 0, by: '', // dir: +1 swings out, -1 in
        mx: 0, mz: 0, // where the middle of the leaf is (for the E prompt)
        pushT: 0, pushIdle: 9, bashes: 0, bashT: 0, shaken: 0,
      };
      const gm = (spec.gap[0] + spec.gap[1]) / 2;
      d.hinge = toWorld(d, spec.hx, spec.hz);
      d.out = toWorld(d, gm, spec.D / 2 + 1.15); // in front of the doorway
      d.inn = toWorld(d, gm, spec.D / 2 - 0.85); // just inside it
      d.mid = toWorld(d, gm, spec.D / 2); // the threshold
      d.cap = world.col.addDynamic(d.hinge.x, d.hinge.z, spec.w + 0.2, LEAF_R, spec.h + 0.2, CAP.WOOD);
      this._place(d);
      return d;
    });
  }

  reset() {
    for (const d of this.list) {
      d.ang = 0;
      d.vel = 0;
      d.open = false;
      d.dir = 1;
      d.mode = 'swing';
      d.seq = 0;
      d.by = '';
      d.pushT = 0;
      d.pushIdle = 9;
      d.bashes = 0;
      d.shaken = 0;
      this._place(d);
    }
  }

  // mesh + collider follow the angle
  _place(d) {
    const a = d.spec.ry + d.ang + (d.shaken > 0 ? Math.sin(d.shaken * 90) * 0.012 * d.shaken * 4 : 0);
    d.mesh.position.set(d.hinge.x, d.y, d.hinge.z);
    d.mesh.rotation.set(0, a, 0);
    d.mesh.updateMatrix();
    const fx = -Math.cos(a) * d.w, fz = Math.sin(a) * d.w; // the free edge, from the hinge
    this.g.world.col.setSeg(d.cap, d.hinge.x, d.hinge.z, d.hinge.x + fx * 0.97, d.hinge.z + fz * 0.97);
    d.mx = d.hinge.x + fx * 0.5;
    d.mz = d.hinge.z + fz * 0.5;
  }

  // ---------------- swinging ----------------
  // open / shut, however it happened. by = whoever swung it (for the tie-break), seq = its version,
  // dir = which way it opens (+1 out, -1 in)
  _set(d, open, mode, by, seq, dir = d.dir) {
    const was = d.open;
    d.open = open;
    if (open) d.dir = dir < 0 ? -1 : 1;
    d.mode = mode;
    d.by = String(by || '');
    d.seq = seq;
    d.pushT = 0;
    d.bashes = 0;
    if (was === open) return;
    d.shutting = !open;
    const a = this.g.audio;
    const y = d.y + 1.2;
    if (mode === 'bash') {
      d.vel = 9.5 * d.dir; // it flies open
      this._bashFx(d, true);
    } else if (mode === 'creak') {
      a.doorCreak(d.mx, y, d.mz, 1.9, 0.78, 0.55); // slowly, slowly, all by itself
    } else {
      a.doorCreak(d.mx, y, d.mz, open ? 0.62 : 0.42, open ? 1 : 1.12, 0.42);
      d.vel += open ? 1.2 * d.dir : -0.8 * Math.sign(d.ang); // a shove to get it going
    }
  }

  // which way a door opens for someone standing at (x, z): away from them
  _away(d, x, z) {
    return toLocal(d, x, z).z > d.D / 2 ? -1 : 1;
  }

  // you, pressing E at it
  use(d) {
    const g = this.g, p = g.player;
    this._set(d, !d.open, 'swing', p.id, d.seq + 1, this._away(d, p.x, p.z));
    if (g.sync) g.sync.ev('dr', d.i, d.open ? d.dir : 0, d.seq, d.by, 0);
    g.playerNoise(d.mx, d.mz, CFG.DOOR.loud, 'door');
    g.addTrauma(0.03);
  }

  // what the E prompt says for this door
  prompt(d) {
    return d.open ? 'useDoorClose' : 'useDoorOpen';
  }

  update(dt) {
    for (const d of this.list) {
      const [k, c] = SPRING[d.mode] || SPRING.swing;
      const target = d.open ? DOOR_OPEN * d.dir : 0;
      const before = d.ang, v0 = d.vel;
      d.vel += ((target - d.ang) * k - d.vel * c) * dt;
      d.ang += d.vel * dt;
      if (!d.open && (before === 0 || Math.sign(d.ang) !== Math.sign(before))) {
        // it meets the frame (from whichever side)
        if (before !== 0 && Math.abs(v0) > 0.35) this.g.audio.doorShut(d.mx, d.y + 1.1, d.mz, clamp(Math.abs(v0) / 3, 0.35, 1));
        d.ang = 0;
        d.vel = 0;
        if (d.shutting) {
          d.shutting = false;
          if (d.by === this.g.player.id) this.g.playerNoise(d.mx, d.mz, CFG.DOOR.shutLoud, 'door'); // the slam carries
        }
      } else if (Math.abs(d.ang) >= STOP) {
        // ...or the end of its swing
        d.ang = STOP * Math.sign(d.ang);
        if (Math.abs(v0) > 2.5) this.g.audio.doorShut(d.mx, d.y + 1.1, d.mz, clamp(Math.abs(v0) / 9, 0.3, 0.8));
        d.vel = -v0 * 0.32;
      }
      if (d.shaken > 0) d.shaken = Math.max(0, d.shaken - dt);
      // nobody leaning on it any more
      d.pushIdle += dt;
      if (d.pushIdle > 0.6) {
        d.pushT = 0;
        d.bashes = 0;
        d.bashT = 0.12;
      }
      if (Math.abs(d.ang - before) > 1e-5 || d.shaken > 0 || d.wasShaken) this._place(d);
      d.wasShaken = d.shaken > 0;
    }
  }

  // ---------------- the player's E ----------------
  consider(fn) {
    // by the leaf, or by the doorway (an open leaf stands out of reach of someone inside)
    for (const d of this.list) {
      fn(d, d.mx, d.mz, USE_R, 'door');
      fn(d, d.mid.x, d.mid.z, USE_R, 'door');
    }
  }

  // ---------------- monsters (host) ----------------
  _inside(d, p, pad = 0) {
    return Math.abs(p.x) < d.W / 2 + pad && Math.abs(p.z) < d.D / 2 + pad;
  }
  _doorway(d, p) {
    const g0 = d.spec.gap[0], g1 = d.spec.gap[1];
    return p.x > g0 - 0.15 && p.x < g1 + 0.15 && p.z > d.D / 2 - 0.55 && p.z < d.D / 2 + 0.85;
  }

  // a monster at (x, z) wants to get to (tx, tz): if a cabin wall stands between (one of them is inside,
  // the other isn't) it goes by the door — in front of it, then through. shut = it's at a closed door
  route(x, z, tx, tz) {
    for (const d of this.list) {
      if (Math.abs(x - d.x) > 14 || Math.abs(z - d.z) > 14) {
        if (Math.abs(tx - d.x) > 14 || Math.abs(tz - d.z) > 14) continue;
      }
      const a = toLocal(d, x, z), b = toLocal(d, tx, tz);
      const ain = this._inside(d, a), bin = this._inside(d, b);
      if (ain === bin) continue;
      const near = ain ? d.inn : d.out, far = ain ? d.out : d.inn;
      const lined = this._doorway(d, a) || Math.hypot(near.x - x, near.z - z) < 0.75;
      if (!lined) return { x: near.x, z: near.z, door: d, shut: false };
      return { x: far.x, z: far.z, door: d, shut: Math.abs(d.ang) < PASS };
    }
    return null;
  }

  // the doorway is a squeeze (the big one only gets through sideways)
  squeeze(x, z, r) {
    if (r <= 0.36) return r;
    for (const d of this.list) if (Math.hypot(x - d.mid.x, z - d.mid.z) < 2.4) return 0.36;
    return r;
  }

  // does a wall (or a shut door) stand between these two? — nothing reaches through one
  blocks(ax, az, bx, bz) {
    for (const d of this.list) {
      if (Math.abs(ax - d.x) > 9 && Math.abs(bx - d.x) > 9) continue;
      if (Math.abs(az - d.z) > 9 && Math.abs(bz - d.z) > 9) continue;
      const a = toLocal(d, ax, az), b = toLocal(d, bx, bz);
      const ain = this._inside(d, a), bin = this._inside(d, b);
      if (ain === bin) continue;
      if (Math.abs(d.ang) < PASS) return true;
      if (!this._doorway(d, ain ? b : a) && !this._doorway(d, ain ? a : b)) return true;
    }
    return false;
  }

  // is (x, z) inside one of the cabins?
  indoors(x, z) {
    for (const d of this.list) if (this._inside(d, toLocal(d, x, z), -0.05)) return d;
    return null;
  }

  // a monster is up against a shut door (host only). Wanderers lean until it creaks open;
  // a hunter bashes it — a few blows, and on the last one it gives.
  push(d, m, dt) {
    const g = this.g;
    if (!g.auth || d.open) return;
    d.pushIdle = 0;
    d.pushT += dt;
    if (m.state === 'hunt') {
      d.bashT -= dt;
      if (d.bashT > 0) return;
      d.bashes++;
      d.bashT = CFG.DOOR.bashEvery * (0.8 + Math.random() * 0.4);
      const away = this._away(d, m.x, m.z);
      if (d.bashes >= CFG.DOOR.bashes) this.force(d, 'bash', away);
      else {
        this._bashFx(d, false, away);
        if (g.sync) g.sync.ev('dk', d.i, away);
      }
    } else if (d.pushT > CFG.DOOR.calmPush) this.force(d, 'creak', this._away(d, m.x, m.z));
  }

  // the host's monster got it open (away from itself)
  force(d, mode, dir = 1) {
    const g = this.g;
    this._set(d, true, mode, `${g.player.id}~`, d.seq + 1, dir);
    if (g.sync) g.sync.ev('dr', d.i, d.dir, d.seq, d.by, mode === 'bash' ? 2 : 1);
  }

  // a blow on the door: it jumps in its frame; you see it (and what's behind it) in the flash
  _bashFx(d, final, dir = 1) {
    const g = this.g;
    const x = d.mid.x, z = d.mid.z, y = d.y + 1.1;
    g.audio.doorBash(x, y, z, final);
    d.shaken = final ? 0 : 0.28;
    if (!final) d.vel += 0.9 * dir; // the leaf jolts against the latch
    g.pulses.emit(x, y, z, g.time, { radius: final ? 15 : 10, strength: final ? 1.1 : 0.85, decay: 1.1, color: [0.95, 0.82, 0.72], kind: 'stone' });
    g.particles.burst(x, y + 0.3, z, final ? 26 : 10, { color: [0.7, 0.6, 0.5], speed: final ? 4.5 : 2, up: 1, life: 0.8, size: 0.05, gravity: -7, drag: 1.4 });
    const near = Math.max(0, 1 - g.distToEars(x, z) / 18);
    if (near > 0 && g.player.alive) {
      g.addTrauma((final ? 0.4 : 0.22) * near);
      if (final) {
        g.fx.glitch = Math.max(g.fx.glitch, 0.4 * near);
        g.fx.shockT = 0;
        g.fx.shockAmp = 0.5 * near;
      }
    }
  }

  // ---------------- co-op ----------------
  // someone swung a door (fx: 0 a player, 1 a monster leaned it open, 2 a monster broke through)
  // open: 0 shut, +1 open outward, -1 open inward
  netSet(i, open, seq, by, fx = 0) {
    const d = this.list[i | 0];
    if (!d) return;
    seq |= 0;
    by = String(by || '');
    if (seq < d.seq || (seq === d.seq && by <= d.by)) return;
    open = +open || 0;
    this._set(d, open !== 0, fx === 2 ? 'bash' : fx === 1 ? 'creak' : 'swing', by, seq, open < 0 ? -1 : 1);
  }

  // the host's monster is hitting a door
  netKnock(i, dir = 1) {
    const d = this.list[i | 0];
    if (d && !d.open) this._bashFx(d, false, +dir < 0 ? -1 : 1);
  }

  netState() {
    return this.list.map((d) => [d.open ? d.dir : 0, d.seq, d.by]);
  }

  netMerge(arr) {
    if (!Array.isArray(arr)) return;
    arr.forEach((r, i) => {
      if (Array.isArray(r)) this.netSet(i, r[0], r[1], r[2], 0);
    });
  }
}
