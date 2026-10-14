// The chibi knight: movement, dash, swing, stats and animation.
import { HERO_BASE, xpForLevel } from '../config.js';
import { createHeroModel } from '../render/heroModel.js';
import { damp, clamp, lerp, angleLerp, easeOutCubic, easeOutBack, Spring } from '../util/math.js';
import { resolveStatic, clampToArena } from '../sim/collision.js';

const HIP = 0.42;
const SWING_OUT = -1; // sentinel: not swinging

export function dirFromAngle(a) {
  return { x: Math.sin(a), z: Math.cos(a) };
}

export class Hero {
  constructor(scene) {
    this.model = createHeroModel();
    this.model.root.rotation.order = 'YXZ';
    scene.add(this.model.root);
    this.squash = new Spring(260, 16);
    this.dashDir = { x: 0, z: 1 };
    this.swingSet = new Set();
    this.reset(0, 7.5);
  }

  reset(x, z) {
    this.radius = HERO_BASE.radius;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.vx = 0;
    this.vz = 0;
    this.kx = 0;
    this.kz = 0;
    this.facing = Math.PI; // angle 0 faces +z (camera); PI faces north towards the keep
    this.stats = {
      maxHp: HERO_BASE.maxHp,
      speed: HERO_BASE.speed,
      accel: HERO_BASE.accel,
      friction: HERO_BASE.friction,
      damage: HERO_BASE.swingDamage,
      reach: HERO_BASE.swingReach,
      arc: HERO_BASE.swingArc,
      swingCooldown: HERO_BASE.swingCooldown,
      dashCooldown: HERO_BASE.dashCooldown,
      magnet: HERO_BASE.magnet,
      lifesteal: HERO_BASE.lifesteal,
    };
    this.hp = this.stats.maxHp;
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpForLevel(1);
    this.dead = false;
    this.deadT = 0;
    this.invT = 0;
    this.hurtBlink = false;
    this.dashT = 0;
    this.dashCd = 0;
    this.swingT = SWING_OUT;
    this.swingDirA = 0;
    this.swingCd = 0;
    this.swingSet.clear();
    this.sweepFrom = 0;
    this.sweepTo = 0;
    this.sweeping = false;
    this.bufAtk = 0;
    this.bufDash = 0;
    this.walk = 0;
    this.moveAmt = 0;
    this.lean = 0;
    this.armYaw = 0;
    this.flash = 0;
    this.time = 0;
    this.spawnT = 0.45;
    this.dustT = 0;
    this.stepT = 0;
    this.squash.reset();
    const r = this.model.root;
    r.visible = true;
    r.rotation.set(0, 0, 0);
    r.scale.setScalar(0.001);
    this.syncModel(0, 1);
  }

  get swinging() {
    return this.swingT >= 0;
  }

  get dashing() {
    return this.dashT > 0;
  }

  /** Current sword yaw relative to the attack direction, in [-arc/2, arc/2]. */
  swingTheta() {
    const arc = this.stats.arc;
    const p = clamp(this.swingT / HERO_BASE.swingTime, 0, 1);
    return -arc / 2 + arc * easeOutCubic(p);
  }

  heal(n) {
    this.hp = Math.min(this.stats.maxHp, this.hp + n);
  }

  /** Returns true if the hit landed. */
  takeHit(dmg, fromX, fromZ) {
    if (this.dead || this.invT > 0) return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.invT = HERO_BASE.hurtIframes;
    this.hurtBlink = true;
    let dx = this.x - fromX;
    let dz = this.z - fromZ;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d;
    dz /= d;
    this.kx = dx * 7;
    this.kz = dz * 7;
    this.flash = 0.18;
    this.squash.impulse(-6);
    if (this.swinging) this.swingT = SWING_OUT;
    return true;
  }

  addXp(n) {
    this.xp += n;
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = xpForLevel(this.level);
      return true;
    }
    return false;
  }

  die() {
    this.dead = true;
    this.deadT = 0;
    this.hp = 0;
    this.swingT = SWING_OUT;
    this.dashT = 0;
    this.vx = this.vz = 0;
  }

  /**
   * Simulation step. `input` supplies move/aim/buttons; `ev` receives gameplay events:
   * onDash(hero), onSwing(hero), dust(x,z,dx,dz,amount), step(hero)
   */
  update(dt, input, layout, ev) {
    this.time += dt;
    this.sweeping = false;
    if (this.dead) {
      this.deadT += dt;
      this.syncModel(dt);
      return;
    }
    this.invT = Math.max(0, this.invT - dt);
    if (this.invT <= 0) this.hurtBlink = false;
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.swingCd = Math.max(0, this.swingCd - dt);
    this.bufAtk = Math.max(0, this.bufAtk - dt);
    this.bufDash = Math.max(0, this.bufDash - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (input.justPressed('attack')) this.bufAtk = HERO_BASE.inputBuffer;
    if (input.justPressed('dash')) this.bufDash = HERO_BASE.inputBuffer;

    const mv = input.move;
    const moveLen = Math.hypot(mv.x, mv.z);
    const moving = moveLen > 0.05;
    const moveAng = moving ? Math.atan2(mv.x, mv.z) : null;

    // ---- dash --------------------------------------------------------------
    if (this.bufDash > 0 && this.dashCd <= 0 && this.dashT <= 0) {
      const d = moving ? { x: mv.x / moveLen, z: mv.z / moveLen } : dirFromAngle(this.facing);
      this.dashDir = d;
      this.dashT = HERO_BASE.dashTime;
      this.dashCd = this.stats.dashCooldown;
      this.invT = Math.max(this.invT, HERO_BASE.dashIframes);
      this.swingT = SWING_OUT; // dash cancels a swing
      this.bufDash = 0;
      this.vx = d.x * HERO_BASE.dashSpeed;
      this.vz = d.z * HERO_BASE.dashSpeed;
      ev.onDash(this);
    }
    if (this.dashT > 0) {
      this.dashT = Math.max(0, this.dashT - dt);
      this.vx = this.dashDir.x * HERO_BASE.dashSpeed;
      this.vz = this.dashDir.z * HERO_BASE.dashSpeed;
      this.dustT -= dt;
      if (this.dustT <= 0) {
        this.dustT = 0.05;
        ev.dust(this.x, this.z, -this.dashDir.x, -this.dashDir.z, 0.6);
      }
    }

    // ---- swing -------------------------------------------------------------
    if (!this.swinging && this.dashT <= 0 && this.swingCd <= 0 && (this.bufAtk > 0 || input.attackHeld)) {
      const aim = input.aimActive ? input.aimAngle : (moveAng ?? this.facing);
      this.swingDirA = aim;
      this.swingT = 0;
      this.swingCd = this.stats.swingCooldown;
      this.swingSet.clear();
      this.bufAtk = 0;
      this.facing = aim;
      ev.onSwing(this);
    }
    if (this.swinging) {
      const before = this.swingTheta();
      this.swingT += dt;
      const p = this.swingT / HERO_BASE.swingTime;
      const after = this.swingTheta();
      // the blade is only "live" during the middle of the arc
      if (p > 0.08 && p < 1) {
        this.sweeping = true;
        this.sweepFrom = before;
        this.sweepTo = after;
      }
      if (p >= 1) this.swingT = SWING_OUT;
    }

    // ---- movement ----------------------------------------------------------
    if (this.dashT <= 0) {
      const sp = this.stats.speed * (this.swinging ? HERO_BASE.swingSlowdown : 1);
      const k = moving ? this.stats.accel : this.stats.friction;
      this.vx = damp(this.vx, mv.x * sp, k, dt);
      this.vz = damp(this.vz, mv.z * sp, k, dt);
    }
    this.kx = damp(this.kx, 0, 9, dt);
    this.kz = damp(this.kz, 0, 9, dt);
    this.x += (this.vx + this.kx) * dt;
    this.z += (this.vz + this.kz) * dt;
    const hitWall = resolveStatic(layout, this);
    if (hitWall && this.dashT > 0) {
      this.dashT = 0;
      this.vx *= 0.2;
      this.vz *= 0.2;
    }
    clampToArena(this);
    this.y = layout.heightAt(this.x, this.z);

    // footstep dust
    if (moving && !this.swinging) {
      this.stepT -= dt * (this.moveAmt + 0.2);
      if (this.stepT <= 0) {
        this.stepT = 0.42;
        ev.step(this);
      }
    }

    // ---- facing --------------------------------------------------------------
    if (!this.swinging) {
      if (input.aimActive) this.facing = angleLerp(this.facing, input.aimAngle, 1 - Math.exp(-22 * dt));
      else if (moveAng !== null) this.facing = angleLerp(this.facing, moveAng, 1 - Math.exp(-12 * dt));
    }

    this.animate(dt);
  }

  animate(dt) {
    const M = this.model;
    const speed = Math.hypot(this.vx, this.vz);
    this.moveAmt = damp(this.moveAmt, clamp(speed / this.stats.speed, 0, 1), 14, dt);
    this.walk += speed * dt * 1.6;
    this.squash.update(dt);

    // spawn pop
    if (this.spawnT > 0) {
      this.spawnT = Math.max(0, this.spawnT - dt);
    }
    const pop = this.spawnT > 0 ? easeOutBack(1 - this.spawnT / 0.45) : 1;
    this.syncModel(dt, pop);
  }

  syncModel(dt, pop = 1) {
    const M = this.model;
    const r = M.root;
    r.position.set(this.x, this.y, this.z);
    r.rotation.y = this.facing;

    // death: topple over facing direction
    if (this.dead) {
      const t = Math.min(1, this.deadT / 0.45);
      r.rotation.x = -easeOutCubic(t) * Math.PI / 2;
      r.position.y = this.y + (1 - Math.cos(t * Math.PI / 2)) * 0.1;
      r.scale.setScalar(1);
      return;
    }
    r.rotation.x = 0;
    r.scale.setScalar(Math.max(0.001, pop));

    const sp = this.squash.x;
    const breathe = Math.sin(this.time * 3.2) * 0.012;
    const dashing = this.dashT > 0;
    const bob = Math.abs(Math.sin(this.walk)) * 0.05 * this.moveAmt;
    M.upper.position.y = HIP + bob;
    M.upper.scale.set(1 - sp * 0.5, 1 + sp * 0.8 + breathe, 1 - sp * 0.5);

    const leanTarget = dashing ? -0.42 : this.swinging ? -0.14 : -0.04 * this.moveAmt;
    this.lean = damp(this.lean, leanTarget, 12, dt || 1 / 60);
    M.upper.rotation.x = this.lean;

    M.legs[0].rotation.x = Math.sin(this.walk) * 0.9 * this.moveAmt;
    M.legs[1].rotation.x = -Math.sin(this.walk) * 0.9 * this.moveAmt;

    // sword arm
    if (this.swinging) {
      const p = clamp(this.swingT / HERO_BASE.swingTime, 0, 1);
      const e = easeOutCubic(p);
      M.armR.rotation.y = this.swingTheta();
      M.armR.rotation.x = lerp(-0.95, -0.12, e);
      this.armYaw = 0;
    } else {
      this.armYaw = damp(this.armYaw, 0, 14, dt || 1 / 60);
      M.armR.rotation.y = this.armYaw;
      M.armR.rotation.x = -0.55 + Math.sin(this.time * 2.4) * 0.04 - this.moveAmt * 0.1;
    }
    M.armL.rotation.set(-0.6 + Math.cos(this.walk) * 0.08 * this.moveAmt, 0.35, 0, 'YXZ');

    M.cape.rotation.x = 0.12 + this.moveAmt * 0.3 + (dashing ? 0.9 : 0) + Math.sin(this.time * 8) * 0.05;

    // hit flash + invulnerability blink
    const f = this.flash > 0 ? this.flash / 0.18 : 0;
    for (const m of M.mats) m.emissive.setRGB(f * 0.9, f * 0.12, f * 0.12);
    const blink = this.hurtBlink && Math.floor(this.time * 18) % 2 === 0;
    r.visible = !blink;
  }
}

