// ============================================================
// PLAYER — first person movement, stamina, noise emission.
// Pure sim: no rendering. The renderer reads pos/yaw/pitch.
// ============================================================
import { clamp, damp, dist2, lerp, TAU } from '../core/util.js';

export const EYE = 1.70;
export const EYE_CROUCH = 1.02;
export const ADRENALINE_TIME = 16;   // seconds of +22% speed and free stamina
export const SPEED = { walk: 3.15, crouch: 1.55, sprint: 5.7, back: 2.2 };

// noise radii in metres — the single most important balance knob in the game
export const NOISE = {
  breath: 2.0,
  crouchStep: 5.5,
  step: 14,
  sprint: 34,
  pant: 13,
  bump: 12,
  ping: 20,          // a quiet tongue click: reveals ~44m, barely heard
  pingCharged: 96,   // a full shout pulse: reveals 132m, the whole forest hears
  scream: 300,
  repair: 30,
  water: 22,
  fuse: 8,
  generatorDone: 70,
  heart: 7,
};

export class Player {
  constructor(opts = {}) {
    this.id = opts.id ?? 0;
    this.name = opts.name ?? 'P1';
    this.remote = !!opts.remote;
    this.x = 0; this.y = 0; this.z = 0;
    this.px = 0; this.py = 0; this.pz = 0;      // previous (for interpolation / velocity)
    this.vx = 0; this.vz = 0;
    this.yaw = 0; this.pitch = 0;
    this.tYaw = 0; this.tPitch = 0;
    this.speed = 0;
    this.grounded = true;
    this.crouch = false; this.sprint = false; this.breath = false;
    this.stamina = 1; this.panting = 0;
    this.nerve = 3; this.maxNerve = 3;
    this.alive = true;
    this.fuses = 0;
    this.iframe = 0;          // invulnerability after a hit
    this.stepDist = 0;
    this.bob = 0; this.bobAmt = 0;
    this.pingCd = 0;
    this.chargeT = 0;
    this.holding = null;      // {kind, id, t, need}
    this.noiseNow = 0;        // instantaneous loudness 0..1 for HUD
    this.lastNoiseT = 0;
    this.silenceT = 0;
    this.deadT = 0;
    this.flashT = 0;          // generator-lamp flash / scare flash
    this.heart = 0;           // 0..1 panic
    this.wet = 0;
    this.headlamp = 0;
    this.items = { earplugs: 0, adrenaline: 0 };
    this.adrenaline = 0;
    this.score = 0;
    this.dist = 0;
    this.shake = 0;
    this.hitDir = 0;
    this.spawnT = 0;
    this.inputs = { f: 0, b: 0, l: 0, r: 0, ax: 0, az: 0 };
    this.netTick = 0;
  }

  place(world, x, z, yaw) {
    this.x = x; this.z = z; this.yaw = yaw ?? 0; this.tYaw = this.yaw;
    this.y = world.heightAt(x, z);
    this.px = x; this.pz = z; this.py = this.y;
  }

  get eye() { return this.y + lerp(EYE, EYE_CROUCH, this.crouchT ?? (this.crouch ? 1 : 0)); }

  /** Instantaneous noise radius produced by the player this frame. */
  noiseRadius() {
    if (!this.alive) return 0;
    if (this.breath) return NOISE.breath;
    let r = 0;
    if (this.speed > 0.35) {
      r = this.crouch ? NOISE.crouchStep : this.sprint ? NOISE.sprint : NOISE.step;
      // footsteps are pulses, not a constant: scale by the step phase
      r *= 0.45 + 0.55 * Math.abs(Math.sin(this.stepDist * 1.35));
      // and by how fast you are actually moving: wedged in brush you are quieter
      const top = this.crouch ? SPEED.crouch : this.sprint ? SPEED.sprint : SPEED.walk;
      r *= clamp(this.speed / top, 0.22, 1);
    } else if (!this.crouch) r = NOISE.breath * 1.6;
    if (this.wet > 0.15) r = Math.max(r, NOISE.water * clamp(this.speed / 3, 0.3, 1.3));
    if (this.panting > 0.55) r = Math.max(r, NOISE.pant * this.panting);
    if (this.holding && this.holding.kind === 'gen') r = Math.max(r, NOISE.repair);
    if (this.adrenaline > 0) r *= 1.15;
    return r;
  }

  update(dt, ctx) {
    const { world, game } = ctx;
    this.crouchT = damp(this.crouchT ?? 0, this.crouch ? 1 : 0, 14, dt);
    this.iframe = Math.max(0, this.iframe - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.adrenaline = Math.max(0, this.adrenaline - dt);
    this.shake = Math.max(0, this.shake - dt * 3.2);
    this.pingCd = Math.max(0, this.pingCd - dt);

    if (!this.alive) { this.deadT += dt; this.speed = 0; return; }

    // ---- input -> intent ----
    let ix = this.inputs.ax, iz = this.inputs.az;
    if (this.inputs.f) iz += 1;
    if (this.inputs.b) iz -= 1;
    if (this.inputs.l) ix -= 1;
    if (this.inputs.r) ix += 1;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }

    this.sprint = !!this.inputs.sprint && iz > 0.35 && this.stamina > 0.02 && !this.crouch;
    this.breath = !!this.inputs.breath;
    if (this.breath) { this.sprint = false; }

    // ---- stamina ----
    const drain = this.sprint ? 0.185 : this.breath ? 0.135 : 0;
    const regen = (this.speed < 0.6 ? 0.135 : 0.055) * (this.crouch ? 1.25 : 1);
    this.stamina = clamp(this.stamina - drain * dt + (drain === 0 ? regen * dt : 0), 0, 1);
    if (this.adrenaline > 0) this.stamina = clamp(this.stamina + 0.25 * dt, 0, 1);
    this.panting = clamp(this.panting + ((this.stamina < 0.22 || this.heart > 0.6 ? 1 : -1) * dt * (this.stamina < 0.22 ? 1.6 : 0.8)), 0, 1);

    // ---- speed ----
    let max = this.crouch ? SPEED.crouch : this.sprint ? SPEED.sprint : SPEED.walk;
    if (this.breath) max *= 0.45;
    if (this.adrenaline > 0) max *= 1.22;
    if (this.wet > 0.15) max *= lerp(1, 0.52, clamp(this.wet, 0, 1));
    if (this.stamina < 0.02 && this.sprint) max = SPEED.walk * 0.8;
    if (this.holding) max *= 0.0;          // repairing roots you in place
    if (this.heart > 0.85) max *= 0.94;

    const ca = Math.cos(this.yaw), sa = Math.sin(this.yaw);
    // iz>0 = forward. forward vector is (-sin yaw, -cos yaw) in XZ with our camera convention
    const dx = (-sa * iz + ca * ix);
    const dz = (-ca * iz - sa * ix);
    const target = mag * max;
    const accel = this.grounded ? 26 : 6;
    this.vx = damp(this.vx, dx * target, accel / Math.max(target, 1.2), dt);
    this.vz = damp(this.vz, dz * target, accel / Math.max(target, 1.2), dt);

    this.px = this.x; this.pz = this.z; this.py = this.y;
    this.x += this.vx * dt;
    this.z += this.vz * dt;

    // ---- world collision ----
    const hit = world.collide(this.x, this.z, 0.42);
    if (hit) {
      this.x = hit.x; this.z = hit.z;
      const impact = Math.hypot(this.vx, this.vz);
      this.vx *= 0.25; this.vz *= 0.25;
      if (impact > 2.1 && ctx.t - this.lastBump > 0.55) {
        this.lastBump = ctx.t;
        ctx.emit('bump', this, impact, hit.hit);
      }
    }
    // soft bounds
    const dc = Math.hypot(this.x, this.z);
    if (dc > world.half * 0.985) {
      const a = Math.atan2(this.z, this.x);
      this.x = Math.cos(a) * world.half * 0.985;
      this.z = Math.sin(a) * world.half * 0.985;
      ctx.emit('bounds', this);
    }

    // ---- ground ----
    const gy = world.heightAt(this.x, this.z);
    this.y = damp(this.y, gy, 18, dt);
    this.grounded = this.y - gy < 0.35;
    this.wet = world.waterDepth(this.x, this.z);

    // ---- footsteps ----
    this.speed = Math.hypot(this.x - this.px, this.z - this.pz) / Math.max(dt, 1e-4);
    this.dist += this.speed * dt;
    const stride = this.sprint ? 3.15 : this.crouch ? 1.35 : 2.15;
    if (this.speed > 0.4) {
      this.stepDist += (this.speed * dt) / stride;
      if (this.stepDist >= 1) {
        this.stepDist -= 1;
        ctx.emit('step', this, this.sprint ? 2 : this.crouch ? 0 : 1);
      }
      this.bobAmt = damp(this.bobAmt, clamp(this.speed / SPEED.walk, 0, 1.35), 10, dt);
    } else {
      this.bobAmt = damp(this.bobAmt, 0, 6, dt);
    }
    this.bob += dt * (this.sprint ? 12.5 : this.crouch ? 5.4 : 8.2) * clamp(this.speed / 2.4, 0, 1.4);

    // ---- smooth look ----
    this.yaw += (this.tYaw - this.yaw) * Math.min(1, dt * 34);
    this.pitch = damp(this.pitch, this.tPitch, 26, dt);
    this.pitch = clamp(this.pitch, -1.35, 1.35);

    // ---- noise / silence bookkeeping ----
    const r = this.noiseRadius();
    this.noiseNow = clamp(r / NOISE.sprint, 0, 1.6);
    if (r > 6) { this.lastNoiseT = ctx.t; this.silenceT = 0; ctx.emit('noise', this, r, 'move'); }
    else this.silenceT += dt;

    // ---- heartbeat / panic from nearby monsters ----
    let threat = 0;
    for (const m of game.monsters) {
      if (!m.alive || m.state === 'flee') continue;
      const d = dist2(this.x, this.z, m.x, m.z);
      const w = clamp(1 - d / (m.def.senseRadius * 1.5), 0, 1) * m.def.dread;
      if (w > threat) threat = w;
    }
    this.heart = clamp(damp(this.heart, Math.max(threat, this.panting * 0.35), 3.2, dt), 0, 1);
    if (this.heart > 0.55 && ctx.t - this.lastHeart > lerp(1.15, 0.42, this.heart)) {
      this.lastHeart = ctx.t;
      ctx.emit('noise', this, NOISE.heart * this.heart, 'heart');
      ctx.emit('heartbeat', this, this.heart);
    }

    // ---- hold-to-use progress ----
    if (this.holding) {
      const h = this.holding;
      h.t += dt;
      if (h.t >= h.need) { ctx.emit('use_done', this, h); this.holding = null; }
    }
  }

  hurt(ctx, amount, fromX, fromZ, cause, monster) {
    if (!this.alive || this.iframe > 0) return false;
    if (this.items.earplugs > 0 && cause === 'scream') {
      this.items.earplugs--;
      ctx.emit('earplugs', this);
      this.iframe = 1.6;
      return false;
    }
    this.nerve -= amount;
    this.iframe = amount >= 2 ? 1.4 : 4.0;   // one nerve = four seconds to get away
    this.hitDir = Math.atan2(fromX - this.x, fromZ - this.z);
    this.shake = 1;
    // an adrenaline shot in your pocket fires the moment teeth find you:
    // you still take the hit, but now you can actually run for it.
    if (this.items.adrenaline > 0 && this.adrenaline <= 0) {
      this.items.adrenaline--;
      this.adrenaline = ADRENALINE_TIME;
      this.iframe = Math.max(this.iframe, 4.6);
      this.panting = 0;
      this.stamina = Math.max(this.stamina, 0.7);
      ctx.emit('adrenaline', this);
    }
    // knockback
    const a = Math.atan2(this.z - fromZ, this.x - fromX);
    const kb = amount >= 2 ? 17 : 13;
    this.vx += Math.cos(a) * kb; this.vz += Math.sin(a) * kb;
    ctx.emit('hurt', this, amount, cause, monster);
    if (this.nerve <= 0) { this.nerve = 0; this.alive = false; ctx.emit('died', this, cause, monster); }
    return true;
  }

  kill(ctx, cause, monster) {
    if (!this.alive) return;
    // wax earplugs forgive exactly one fatal scream
    if ((cause === 'scream_close' || cause === 'weeper' || cause === 'scream') && this.items.earplugs > 0) {
      this.items.earplugs--;
      this.iframe = 1.8;
      this.shake = 1;
      ctx.emit('earplugs', this);
      return;
    }
    this.nerve = 0; this.alive = false;
    ctx.emit('died', this, cause, monster);
  }

  serialize() {
    return {
      i: this.id, x: +this.x.toFixed(2), y: +this.y.toFixed(2), z: +this.z.toFixed(2),
      w: +this.yaw.toFixed(3), p: +this.pitch.toFixed(3),
      s: this.speed > 0.5 ? 1 : 0, v: +this.speed.toFixed(1), c: this.crouch ? 1 : 0, n: this.nerve, f: this.fuses,
      a: this.alive ? 1 : 0, nm: this.name, sc: Math.round(this.score),
    };
  }
  applyNet(m, dt) {
    // exponential interpolation toward the authoritative/remote transform
    this.x = damp(this.x, m.x, 16, dt); this.z = damp(this.z, m.z, 16, dt);
    this.y = damp(this.y, m.y, 16, dt);
    let dy = (m.w - this.yaw) % TAU; if (dy > Math.PI) dy -= TAU; if (dy < -Math.PI) dy += TAU;
    this.yaw += dy * Math.min(1, dt * 14);
    this.pitch = damp(this.pitch, m.p, 14, dt);
    this.nerve = m.n; this.fuses = m.f; this.alive = !!m.a;
    this.crouch = !!m.c; this.speed = m.v !== undefined ? m.v : (m.s ? 3 : 0);
    this._ty = m.y;
    this.stepDist += dt * (m.s ? 0.55 : 0.22);
    if (this.stepDist >= 1) { this.stepDist -= 1; }
  }
}
