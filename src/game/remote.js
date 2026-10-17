// A teammate, as this machine knows them: their last few reported states, replayed ~100 ms late and
// interpolated so they move smoothly; a body that echoes back when a wave reaches it — and that you can
// simply see, in their own clothes, wherever real light falls on them; footsteps you can hear; and the 3D
// position their voice comes from. Down, they lie where they fell — or over someone's shoulder, or on the
// first-aid hut's cot (see Rescue).
import { CFG } from '../core/config.js';
import { clamp, lerp, angleDiff } from '../core/rng.js';
import { buildSurvivor, poseSurvivor, poseCarrier, poseGlowHand } from './survivor.js';
import { cleanFit } from './outfit.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';

export const PLAYER_COLORS = ['#8ef0ff', '#a6ff9e', '#d2a8ff', '#ffe08a'];
export const PLAYER_HEX = [0x8ef0ff, 0xa6ff9e, 0xd2a8ff, 0xffe08a];
const DELAY = 110; // ms

// flags in the player-state message
export const PF = { crouch: 1, sprint: 2, alive: 4, charging: 8, use: 16, morning: 32 };

// slot → spawn offset around the camp (right, back) in metres
export const SLOT_OFFSET = [[0, 0], [1.5, 0.55], [-1.5, 0.55], [0, 1.6]];

export class RemotePlayer {
  constructor(game, info) {
    this.game = game;
    this.id = info.id;
    this.name = info.name || '???';
    this.slot = info.slot | 0;
    this.color = PLAYER_COLORS[this.slot % 4];
    this.hex = PLAYER_HEX[this.slot % 4];
    const s = game.world.spawn;
    const [ox, oz] = SLOT_OFFSET[this.slot % 4];
    const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
    this.x = s.x + cy * ox + sy * oz;
    this.z = s.z - sy * ox + cy * oz;
    this.y = game.world.terrain.height(this.x, this.z);
    this.yaw = s.yaw;
    this.pitch = 0;
    this.speed = 0;
    this.crouching = false;
    this.sprinting = false;
    this.charging = false;
    this.useHeld = false;
    this.alive = true;
    this.inRun = true;
    this.eyeCur = CFG.PLAYER.eye;
    this.loud = 0;
    this.score = 0;
    this.gens = 0;
    this.cause = null;
    this.buf = [];
    this.fit = cleanFit(info.fit); // what they wear (their wardrobe): shows in their afterimages
    this.rig = buildSurvivor(this.fit);
    // ...and on them, when there's light to see them by
    this.mat = createPersonMaterial(this.rig.dyes, this.hex);
    this.meshes = dressPerson(this.rig, this.mat);
    this.rig.root.visible = false;
    game.scene.add(this.rig.root);
    // down, not out (co-op): see Rescue
    this.downs = 0;
    this.bleedEnd = 0;
    this.gone = false;
    this.carriedBy = null;
    this.carrying = null;
    this.onCot = false;
    this.phase = 0;
    this.stepAcc = 0;
    this.lastStep = 0;
    this.revealT = -9; // last time a wave found them (name label)
    this.lastHeard = performance.now();
  }

  forward() {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
  }

  // a state message: [x, y, z, yaw, pitch, speed, flags, loud, score]
  push(a) {
    if (!Array.isArray(a) || a.length < 7) return;
    const now = performance.now();
    this.lastHeard = now;
    // just brought back: a packet still in flight from before (where they lay) mustn't drag them back
    if (now - (this.revivedAt || -1e9) < 1500 && Math.hypot(+a[0] - this.x, +a[2] - this.z) > 3) return;
    const f = a[6] | 0;
    this.buf.push({ t: now, x: +a[0], y: +a[1], z: +a[2], yaw: +a[3], pitch: +a[4], speed: +a[5], f });
    if (this.buf.length > 10) this.buf.shift();
    this.loud = +a[7] || 0;
    if (a[8] !== undefined) this.score = +a[8] || 0;
    // note: "alive" only ever changes through the host's word (a kill event), never from a state packet
  }

  update(dt) {
    const B = this.buf;
    if (B.length) {
      const now = performance.now() - DELAY;
      let a = B[0], b = B[0];
      for (let i = B.length - 1; i >= 0; i--) {
        if (B[i].t <= now) {
          a = B[i];
          b = B[Math.min(i + 1, B.length - 1)];
          break;
        }
      }
      let k = b.t > a.t ? (now - a.t) / (b.t - a.t) : 1;
      k = clamp(k, 0, 1.15);
      if (Math.hypot(b.x - a.x, b.z - a.z) > 6) {
        a = b;
        k = 1;
      }
      const k1 = Math.min(1, k);
      const ox = this.x, oz = this.z;
      if (this.alive) {
        this.x = lerp(a.x, b.x, k);
        this.z = lerp(a.z, b.z, k);
        this.y = lerp(a.y, b.y, k1);
        this.yaw = a.yaw + angleDiff(a.yaw, b.yaw) * k1;
        this.pitch = lerp(a.pitch, b.pitch, k1);
      }
      this.speed = lerp(a.speed, b.speed, k1);
      const f = (k1 > 0.5 ? b : a).f;
      this.crouching = !!(f & PF.crouch);
      this.sprinting = !!(f & PF.sprint);
      this.charging = !!(f & PF.charging);
      this.useHeld = !!(f & PF.use);
      this.eyeCur = lerp(this.eyeCur, this.crouching ? CFG.PLAYER.crouchEye : CFG.PLAYER.eye, 1 - Math.exp(-10 * dt));
      // footsteps you can hear (not on the network: derived from how they move)
      const moved = Math.hypot(this.x - ox, this.z - oz);
      if (this.alive && moved < 3 && this.speed > 0.3) {
        const stepLen = this.carrying ? CFG.PLAYER.stepWalk * 0.82 : this.crouching ? CFG.PLAYER.stepCrouch : this.sprinting ? CFG.PLAYER.stepSprint : CFG.PLAYER.stepWalk;
        this.stepAcc += moved;
        this.phase += (moved / stepLen) * Math.PI;
        if (this.stepAcc >= stepLen) {
          this.stepAcc -= stepLen;
          const d = this.game.distToEars(this.x, this.z);
          if (d < 26 && (!this.crouching || this.carrying)) this.game.audio.mateStep(this.x, this.y + 0.1, this.z, this.carrying ? 0.62 : this.sprinting ? 0.85 : 0.4);
        }
      }
    }
    poseSurvivor(this.rig, this.phase, this.alive ? this.speed : 0, this.crouching, !this.alive);
    const r = this.rig.root;
    if (this.alive) {
      if (this.carrying) poseCarrier(this.rig);
      const gs = this.game.glows;
      if (gs && gs.heldBy(this.id)) poseGlowHand(this.rig);
    } else {
      const rs = this.game.rescue;
      if (rs && rs.poseBody(this)) return; // over someone's shoulder, or on the cot
    }
    r.position.set(this.x, this.y + (this.alive ? 0 : 0.2), this.z);
    r.rotation.set(this.alive ? 0 : -Math.PI / 2, this.yaw + Math.PI, 0); // the rig faces +z, players look down -z
  }

  die(x, z) {
    this.alive = false;
    if (x !== undefined) {
      this.x = x;
      this.z = z;
      this.y = this.game.world.terrain.height(x, z);
    }
    this.speed = 0;
    this.charging = false;
  }

  // brought back on the cot: on their feet beside it
  revive(x, z, yaw) {
    this.alive = true;
    this.x = x;
    this.z = z;
    this.y = this.game.world.terrain.height(x, z);
    this.yaw = yaw;
    this.buf = []; // (their next state packets carry on from here)
    this.revivedAt = performance.now();
    this.speed = 0;
    this.gone = false;
    this.onCot = false;
    this.carriedBy = null;
    this.cause = null;
  }

  // gone from the night (left, or the night was torn down)
  dispose() {
    if (this.rig.root.parent) this.rig.root.parent.remove(this.rig.root);
    undressPerson(this.meshes);
    this.meshes = [];
    this.mat.dispose();
  }
}
