// First-person controller: a body with weight (4.0) — momentum, a jump with a heavy fall, a landing the knees
// and the eyes feel — stamina, footsteps, bumps into trees.
import { CFG } from '../core/config.js';
import { speedScale, stepOf, swimming, waterOf } from './water.js';
import { clamp, damp } from '../core/rng.js';
import { SLOT_OFFSET } from './remote.js';

// a damped spring (x'' = -k(x - to) - c x'), sub-stepped so a slow frame can't blow it up
export function spring(s, to, k, c, dt) {
  const n = Math.min(8, Math.ceil(dt / 0.008)), h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (-k * (s.x - to) - c * s.v) * h;
    s.x += s.v * h;
  }
  return s.x;
}

export class Player {
  constructor(world) {
    this.world = world;
    this.id = 'me';
    this.alive = true;
    this.reset();
  }

  // slot: co-op seat — everyone wakes up around the same fire
  reset(slot = 0) {
    // (4.2) and it is kept: the opening films seat everyone by slot (RoadFilm/CampFilm/BogArrival read player.slot).
    // It never was — every guest was slot 0 to their own films, the same seat as the host, and the dedupe by slot
    // dropped the host: a friend's УАЗ drove off without the one at the wheel.
    this.slot = slot | 0;
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
    this.bobAmp = 0;
    this.crouching = false;
    this.sprinting = false;
    this.swimming = false;
    this.swimPhase = 0;
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
    this._initBody();
  }

  // (4.0) the vertical: feet on the ground, or a body in the air
  _initBody() {
    this.vy = 0;
    this.grounded = true;
    this.airT = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this._jumpSeen = performance.now();
    this.landK = 0; // how hard the last landing was (0..1), fading — the remote and self bodies squat with it
    // ...and what the eyes feel of it: the landing's dip, the nod, the head lagging behind a push (see applyView)
    this.dip = { x: 0, v: 0 };
    this.nod = { x: 0, v: 0 };
    this.lagF = { x: 0, v: 0 };
    this.lagR = { x: 0, v: 0 };
    this.viewY = 0;
    this.viewPitch = 0;
    this.swayF = 0;
    this.swayR = 0;
    this._vx0 = 0;
    this._vz0 = 0;
  }

  forward() {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
  }

  // returns events: { step: {loud, intensity, mode} | null, bump: {nx,nz} | null, breath: bool }
  // load: a part of the УАЗ in your arms ({ walk, step }: see game/uaz.js) — slow, no running
  update(dt, input, look, frozen = false, load = null) {
    const P = CFG.PLAYER;
    if (!this.dip) this._initBody();
    const ev = { step: null, bump: null, breath: false };
    this.yaw -= look.dx;
    this.pitch = clamp(this.pitch - look.dy, -1.35, 1.35);
    this.yaw -= input.turn * 2.3 * dt;

    let mx = frozen ? 0 : input.move.x, my = frozen ? 0 : input.move.y;
    const mag = Math.min(1, Math.hypot(mx, my));
    this.swimming = this.floorY == null && !this.col && swimming(this.world, this.x, this.z) && this.y < waterOf(this.world).level - 0.45;
    this.crouching = input.crouch && !frozen && !this.swimming;
    const heavy = !!this.carrying || !!load; // someone on your shoulder (or an engine part in your arms): no running
    const wantSprint = input.sprint && !this.swimming && !heavy && !this.crouching && mag > 0.3 && !this.exhausted && this.stamina > 2;
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
    // (4.0) the undergrowth holds your legs back: the thicker it is around you, the slower (world/undergrowth.js)
    const ug = this.world.undergrowth?.probe(this.x, this.z);
    this.brush = ug ? ug.k : 0;
    this.brushDry = !!ug?.dry;
    if (this.brush > 0) target *= 1 - CFG.UNDERGROWTH.slow * this.brush;

    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    const wx = (-sy * my + cy * mx) * target;
    const wz = (-cy * my - sy * mx) * target;
    // (4.0) weight: getting going takes a moment, turning round is braking first, and in the air you only steer —
    // let go of the keys up there and you carry on where you were going (only the air slows you, a little)
    const against = this.vx * wx + this.vz * wz < 0;
    const accel = this.swimming ? 3.6 : !this.grounded ? (mag > 0.01 ? P.airAccel : P.airDrag) : mag > 0.01 && !against ? P.accel : P.decel;
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
    const canFloat = this.floorY == null && !this.col && swimming(this.world, this.x, this.z);
    this.swimming = canFloat && this.y < waterOf(this.world).level - 0.45;
    if (this.swimming) {
      const surface = waterOf(this.world).level;
      this.swimPhase += dt * (this.speed > 0.2 ? 3 : 1.5);
      const floatY = surface - P.eye + 0.3 + Math.sin(this.swimPhase) * 0.025;
      this.y = Math.max(surface - P.eye + 0.14, damp(this.y, floatY, 5, dt));
      this.vy = 0; this.grounded = false; this.airT = 0;
      this.coyote = 0; this.jumpBuf = 0;
      this.sprinting = false; this.crouching = false;
    } else this._vertical(dt, gy, input, frozen, heavy, wetScale, ev);

    // stamina
    if (this.sprinting && this.speed > 1 && this.grounded) {
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
    if (this.speed > 0.25 && (this.grounded || this.swimming)) {
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
        // (4.0) through a bush: a rustle on top of the step (and dry brushwood cracks) — even crouched, a little
        if (this.brush > 0.08) {
          const U = CFG.UNDERGROWTH;
          ev.step.brush = this.brush;
          ev.step.dry = this.brushDry;
          ev.step.loud += this.brush * (this.crouching ? U.crouchLoud : U.loud) + (this.brushDry && !this.crouching ? U.dry * this.brush : 0);
        }
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
    // (3.1o) the head dips into each footfall and rises between them — a smooth cos², not |sin|: the old curve
    // reversed the camera's vertical speed in one frame, four times a second, and in any light you could see
    // the world jolt on every step (on a bike there's no bob, so a bike rode smooth). The depth eases too,
    // so starting a sprint doesn't drop the view a few centimetres at once.
    const ampTo = !this.grounded ? 0 : heavy ? clamp(this.speed / carryV, 0, 1) * 0.06 : clamp(this.speed / P.sprint, 0, 1) * (this.sprinting ? 0.075 : 0.045);
    this.bobAmp = damp(this.bobAmp || 0, ampTo, 8, dt);
    const bobAmp = this.bobAmp;
    const c = Math.cos(this.bobPhase);
    this.bobY = this.swimming ? Math.sin(this.swimPhase) * 0.015 : -c * c * bobAmp;
    // (4.0) lean into a sidestep with the body's real sideways speed, not the key: it eases in and out with it
    const vR = this.vx * cy - this.vz * sy;
    this.roll = damp(this.roll, Math.sin(this.bobPhase) * bobAmp * 0.35 - vR * 0.0042, 10, dt);
    this._eyes(dt, sy, cy);
    return ev;
  }

  // (4.0) the vertical: a jump (V, buffered, with a little grace off an edge), a fall when the ground drops away
  // under you, and the landing — how hard depends on how fast you came down
  _vertical(dt, gy, input, frozen, heavy, wetScale, ev) {
    const P = CFG.PLAYER;
    const jt = input.jumpAt || 0;
    if (jt > this._jumpSeen) {
      this._jumpSeen = jt;
      this.jumpBuf = P.jumpBuffer;
    }
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.coyote = this.grounded ? P.coyote : Math.max(0, this.coyote - dt);
    this.landK = Math.max(0, this.landK - dt * 2.2);
    const can = !frozen && !heavy && !this.crouching && !this.exhausted && !this.col && this.stamina >= P.jumpCost && this.floorY == null;
    if (this.jumpBuf > 0 && this.coyote > 0 && can && this.vy <= 0.01) {
      const wet = wetScale < 0.999;
      this.vy = P.jumpV * (wet ? 0.72 : 1);
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.airT = 0;
      this.stamina -= P.jumpCost;
      this.staminaDelay = Math.max(this.staminaDelay, 0.6);
      this.dip.v -= 0.25; // the knees give a little as you push off
      ev.jump = { wet };
    }
    if (this.grounded) {
      if (this.y - gy > P.stepDown) {
        // the ground fell away (a deck's edge, a bank): you are falling now
        this.grounded = false;
        this.vy = Math.min(this.vy, 0);
        this.airT = 0;
      } else {
        this.y = damp(this.y, gy, 18, dt);
        this.vy = 0;
      }
    }
    if (!this.grounded) {
      this.airT += dt;
      this.vy -= (this.vy > 0 ? P.gravity : P.gravityFall) * dt;
      this.y += this.vy * dt;
      if (this.y <= gy) {
        const impact = Math.max(0, -this.vy);
        this.y = gy;
        this.vy = 0;
        this.grounded = true;
        this.stepAcc = 0;
        const k = clamp((impact - 1.2) / 5.5, 0, 1);
        this.landK = Math.max(this.landK, k);
        this.dip.v -= impact * 0.16;
        this.nod.v -= impact * 0.055;
        if (impact > 1.2) ev.land = { impact, k, air: this.airT };
        this.airT = 0;
      }
    }
  }

  // (4.0) what the eyes feel of the body: the landing's dip and nod, and the head lagging a hair behind every push
  // and every stop (springs: they overshoot a little and settle, the way a neck does)
  _eyes(dt, sy, cy) {
    const idt = 1 / Math.max(dt, 1e-3);
    let ax = (this.vx - this._vx0) * idt, az = (this.vz - this._vz0) * idt;
    this._vx0 = this.vx;
    this._vz0 = this.vz;
    const al = Math.hypot(ax, az);
    if (al > 25) { ax *= 25 / al; az *= 25 / al; } // a tree stops you dead: that is the bump's business
    const aF = -ax * sy - az * cy, aR = ax * cy - az * sy;
    this.viewY = spring(this.dip, 0, 120, 15, dt);
    this.viewPitch = spring(this.nod, clamp(aF * 0.0018, -0.03, 0.03), 90, 13, dt);
    this.swayF = spring(this.lagF, clamp(-aF * 0.0016, -0.03, 0.03), 60, 11, dt);
    this.swayR = spring(this.lagR, clamp(-aR * 0.0016, -0.03, 0.03), 60, 11, dt);
  }
}
