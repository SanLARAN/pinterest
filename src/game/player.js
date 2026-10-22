// First-person controller: snappy acceleration, stamina, footsteps, bumps into trees.
import { CFG } from '../core/config.js';
import { speedScale, stepOf } from './water.js';
import { clamp, damp } from '../core/rng.js';
import { SLOT_OFFSET } from './remote.js';

export class Player {
  constructor(world) {
    this.world = world;
    this.id = 'me';
    this.alive = true;
    this.reset();
  }

  // slot: co-op seat — everyone wakes up around the same fire
  reset(slot = 0) {
    const s = this.world.spawn;
    const [ox, oz] = SLOT_OFFSET[slot % 4] || [0, 0];
    const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
    const pos = { x: s.x + cy * ox + sy * oz, z: s.z - sy * ox + cy * oz };
    if (slot) this.world.col.resolve(pos, CFG.PLAYER.radius);
    this.x = pos.x;
    this.z = pos.z;
    this.yaw = s.yaw;
    this.alive = true;
    this.pitch = -0.04;
    this.roll = 0;
    this.vx = 0;
    this.vz = 0;
    this.speed = 0;
    this.y = this.world.terrain.height(this.x, this.z);
    this.eyeCur = CFG.PLAYER.eye;
    this.stamina = CFG.PLAYER.stamina;
    this.adrenaline = 0; // >0: the syringe's rubber legs, counting down (see CFG.SYRINGE)
    this.exhausted = false;
    this.staminaDelay = 0;
    this.stepAcc = 0;
    this.bobPhase = 0;
    this.bobY = 0;
    this.crouching = false;
    this.sprinting = false;
    this.bumpCD = 0;
    this.stones = CFG.PLAYER.maxStones;
    this.stoneTimer = 0;
    this.breathT = 0;
    this.moved = 0;
    this.distFromSpawn = 0;
    this.carrying = null; // co-op: the id of a friend on your shoulder (see Rescue)
    this.held = false; // the Angler has this one (see angler.js): dragged, tied — not to be hunted by the rest
    this.floorY = null; // (2.1s: the lookout's deck — while set, you stand on it, not on the terrain)
    this.col = null; // (3.0q: under the camp, the shelter's own walls — see game/bunker.js)
    this.underground = false; // (3.0q: five metres of clay between you and everything out there)
  }

  forward() {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
  }

  // returns events: { step: {loud, intensity, mode} | null, bump: {nx,nz} | null, breath: bool }
  // load: a part of the УАЗ in your arms ({ walk, step }: see game/uaz.js) — slow, no running
  update(dt, input, look, frozen = false, load = null) {
    const P = CFG.PLAYER;
    const ev = { step: null, bump: null, breath: false };
    this.yaw -= look.dx;
    this.pitch = clamp(this.pitch - look.dy, -1.35, 1.35);
    this.yaw -= input.turn * 2.3 * dt;

    let mx = frozen ? 0 : input.move.x, my = frozen ? 0 : input.move.y;
    const mag = Math.min(1, Math.hypot(mx, my));
    this.crouching = input.crouch && !frozen;
    const heavy = !!this.carrying || !!load; // someone on your shoulder (or an engine part in your arms): no running
    const wantSprint = input.sprint && !heavy && !this.crouching && mag > 0.3 && !this.exhausted && this.stamina > 2;
    this.sprinting = wantSprint;
    const R = CFG.REVIVE;
    const carryV = load && !this.carrying ? load.walk : R.carry;
    let target = heavy ? (this.crouching ? Math.min(R.carryCrouch, carryV * 0.55) : carryV) : this.crouching ? P.crouch : wantSprint ? P.sprint : P.walk;
    // the syringe's after-effect: rubber legs — walking ×0.8, running ×0.72, for as long as it lasts
    if (this.adrenaline > 0) {
      this.adrenaline = Math.max(0, this.adrenaline - dt);
      target *= this.sprinting && !heavy ? CFG.SYRINGE.sprint : CFG.SYRINGE.walk;
    }

    // the bog (3.0b): knee-deep water is just over half speed — and it stacks with everything else
    const wetScale = speedScale(this.world, this.x, this.z);
    if (wetScale !== 1) target *= wetScale;

    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    const wx = (-sy * my + cy * mx) * target;
    const wz = (-cy * my - sy * mx) * target;
    const accel = mag > 0.01 ? P.accel : P.decel;
    this.vx = damp(this.vx, wx, accel, dt);
    this.vz = damp(this.vz, wz, accel, dt);

    const ox = this.x, oz = this.z;
    const pos = { x: this.x + this.vx * dt, z: this.z + this.vz * dt };
    const hit = (this.col || this.world.col).resolve(pos, P.radius);
    const w = this.world.wall;
    pos.x = clamp(pos.x, -w, w);
    pos.z = clamp(pos.z, -w, w);
    this.bumpCD -= dt;
    if (hit.hit) {
      const into = -(this.vx * hit.nx + this.vz * hit.nz);
      if (into > 1.9 && this.bumpCD <= 0 && hit.kind !== 4) {
        ev.bump = { nx: hit.nx, nz: hit.nz, x: pos.x - hit.nx * P.radius, z: pos.z - hit.nz * P.radius, strength: Math.min(1, into / 5) };
        this.bumpCD = 0.7;
      }
      // kill velocity into the obstacle so we slide
      const vn = this.vx * hit.nx + this.vz * hit.nz;
      if (vn < 0) {
        this.vx -= vn * hit.nx;
        this.vz -= vn * hit.nz;
      }
    }
    this.x = pos.x;
    this.z = pos.z;
    const moved = Math.hypot(this.x - ox, this.z - oz);
    this.speed = moved / Math.max(dt, 1e-4);
    this.moved += moved;
    this.distFromSpawn = Math.hypot(this.x - this.world.spawn.x, this.z - this.world.spawn.z);
    // (3.0k) the planks are ground too: on a boardwalk the feet are on the deck, not on the peat under it
    const deckY = this.world.walkHeight ? this.world.walkHeight(this.x, this.z) : null;
    const gy = this.floorY != null ? this.floorY
      : deckY != null ? Math.max(deckY, this.world.terrain.height(this.x, this.z))
      : this.world.terrain.height(this.x, this.z);
    this.y = damp(this.y, gy, 18, dt);

    // stamina
    if (this.sprinting && this.speed > 1) {
      this.stamina -= P.sprintDrain * (this.adrenaline > 0 ? CFG.SYRINGE.drain : 1) * dt;
      this.staminaDelay = 0.8;
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.exhausted = true;
        this.sprinting = false;
      }
    } else {
      this.staminaDelay -= dt;
      if (this.staminaDelay <= 0) this.stamina = Math.min(P.stamina, this.stamina + P.staminaRegen * dt * (this.exhausted ? 0.7 : 1));
      if (this.exhausted && this.stamina >= P.exhaustedUntil) this.exhausted = false;
    }
    if (this.exhausted) {
      this.breathT -= dt;
      if (this.breathT <= 0) {
        ev.breath = true;
        this.breathT = 1.15;
      }
    } else this.breathT = 0.3;

    // eye height / bob / footsteps
    const eyeTarget = this.crouching ? P.crouchEye : P.eye;
    this.eyeCur = damp(this.eyeCur, eyeTarget, 10, dt);
    const stepLen = heavy ? P.stepWalk * 0.82 : this.crouching ? P.stepCrouch : this.sprinting ? P.stepSprint : P.stepWalk;
    if (this.speed > 0.25) {
      this.stepAcc += moved;
      this.bobPhase += (moved / stepLen) * Math.PI;
      if (this.stepAcc >= stepLen) {
        this.stepAcc -= stepLen;
        const mode = this.crouching ? 'crouch' : this.sprinting ? 'sprint' : 'walk';
        let loud = mode === 'sprint' ? 0.24 : mode === 'walk' ? 0.085 : 0;
        let intensity = mode === 'sprint' ? 0.85 : mode === 'walk' ? 0.4 : 0.12;
        if (heavy) {
          // two people's weight on the ground: every step is heavier (even crouched)
          const st = load && !this.carrying ? load.step : R.carryStep;
          loud = this.crouching ? st * 0.45 : st;
          intensity = this.crouching ? 0.35 : 0.62;
          ev.step = { loud, mode: 'walk', intensity, heavy: true };
        } else ev.step = { loud, mode, intensity };
        // (3.0b) the ground decides what a step is worth: a splash carries further, a board creaks
        const g = stepOf(this.world, this.x, this.z, ev.step.loud);
        if (g.water || g.plank) {
          ev.step.loud = g.loud;
          ev.step.water = g.water;
          ev.step.plank = g.plank;
          ev.step.ring = g.ring;
          ev.step.depth = g.depth || 0;
          if (g.water) ev.step.intensity = Math.max(0.5, intensity);
          if (g.plank) ev.step.intensity = Math.max(0.35, intensity);
        }
      }
    } else {
      this.stepAcc = Math.min(this.stepAcc, stepLen * 0.6);
    }
    const bobAmp = heavy ? clamp(this.speed / carryV, 0, 1) * 0.06 : clamp(this.speed / P.sprint, 0, 1) * (this.sprinting ? 0.075 : 0.045);
    this.bobY = -Math.abs(Math.sin(this.bobPhase)) * bobAmp;
    this.roll = damp(this.roll, Math.sin(this.bobPhase) * bobAmp * 0.35 - input.move.x * 0.012, 10, dt);
    return ev;
  }
}
