import { clamp, wrapAngle } from './noise.js';

const _pt = { x: 0, y: 0, z: 0, tx: 0, tz: 1, heading: 0, idx: 0 };

/**
 * Racing AI for rivals (also drives the player's car on autopilot in the
 * attract mode / after the finish). Follows a lane along the racing line,
 * brakes for corners using the track speed profile, dodges traffic,
 * rams and shoots the player when the mood strikes.
 */
export class RivalAI {
  constructor(car, game, opts = {}) {
    this.car = car;
    this.game = game;
    this.aggro = opts.aggro ?? 0.5;
    this.skill = opts.skill ?? 1;
    this.canFire = opts.canFire ?? true;
    this.out = { throttle: 0, brake: 0, steer: 0, fire: false, boost: false };
    this.reset();
  }

  reset() {
    this.lane = (Math.random() * 2 - 1) * 4;
    this.laneTarget = this.lane;
    this.laneT = 1 + Math.random() * 2;
    this.attackT = 0;
    this.attackCd = 2 + Math.random() * 3;
    this.fireCd = 2.5 + Math.random() * 3;
    this.burst = 0;
    this.burstT = 0;
    this.stuckT = 0;
    this.reverseT = 0;
    this.rubber = 1;
    this.startDelay = Math.random() * 0.35;
  }

  /** racing: a race is on (rubber band, start delay). combat: allowed to attack. */
  update(dt, racing, combat = racing) {
    const c = this.car, g = this.game, T = g.track, out = this.out;
    out.fire = false; out.boost = false;
    if (c.dead) { out.throttle = 0; out.brake = 0; out.steer = 0; return out; }
    if (this.startDelay > 0 && racing) { this.startDelay -= dt; out.throttle = 0; out.brake = 0; out.steer = 0; return out; }
    const P = g.player;
    const spd = c.fwdSpeed;
    const s = c.q.s;
    const hw = T.hw;

    // ---- lane choice
    this.laneT -= dt;
    if (this.laneT <= 0) {
      this.laneTarget = (Math.random() * 2 - 1) * (hw - 3);
      this.laneT = 2 + Math.random() * 3;
    }
    // ---- traffic avoidance
    const fx = Math.sin(c.heading), fz = Math.cos(c.heading);
    const rx = -fz, rz = fx;
    const cars = g.allCars;
    for (let i = 0; i < cars.length; i++) {
      const o = cars[i];
      if (o === c || !o.active || o.dead) continue;
      if (o === P && this.attackT > 0) continue;
      const dx = o.pos.x - c.pos.x, dz = o.pos.z - c.pos.z;
      const ahead = dx * fx + dz * fz;
      if (ahead < 0 || ahead > 16) continue;
      const side = dx * rx + dz * rz;
      if (Math.abs(side) < 2.8 && o.fwdSpeed < spd + 3) {
        this.laneTarget = clamp(c.q.lateral + (side > 0 ? -4.5 : 4.5), -hw + 2, hw - 2);
        this.laneT = 1.2;
      }
    }
    this.lane += clamp(this.laneTarget - this.lane, -6 * dt, 6 * dt);

    // ---- rubber band relative to the player (keeps the pack around you)
    let behindGap = 0;
    if (racing && !c.isPlayer) {
      const gap = c.progress - P.progress;
      const finalLap = P.progress > T.length * 2;
      let rb = 1;
      if (gap > 60) rb = 1 - Math.min(0.12, (gap - 60) / 700);
      else if (gap < -40) rb = 1 + Math.min(finalLap ? 0.1 : 0.24, (-gap - 40) / 260);
      this.rubber += (rb - this.rubber) * Math.min(1, dt * 0.8);
      c.speedMul = this.rubber;
      behindGap = -gap;
      c.nitro = Math.min(1, c.nitro + dt * 0.05);
    } else {
      c.speedMul = 1;
    }

    // ---- attack decision (rivals only)
    let tx, tz, attacking = false;
    const pdx = P.pos.x - c.pos.x, pdz = P.pos.z - c.pos.z;
    const pd = Math.hypot(pdx, pdz);
    const pAhead = pdx * fx + pdz * fz;
    if (combat && this.canFire && !P.dead && g.state === 'race') {
      this.attackCd -= dt;
      if (this.attackT <= 0 && this.attackCd <= 0 && pd < 26 && pAhead > -4 && Math.random() < this.aggro * dt * 1.6) {
        this.attackT = 1.0 + Math.random() * 1.3;
        this.attackCd = 4 + Math.random() * 4 - this.aggro * 2;
      }
    }
    if (this.attackT > 0) {
      this.attackT -= dt;
      if (pd > 34 || pAhead < -6 || P.dead) this.attackT = 0;
      else {
        attacking = true;
        tx = P.pos.x + P.vel.x * 0.3;
        tz = P.pos.z + P.vel.z * 0.3;
      }
    }
    if (!attacking) {
      const off = Math.abs(c.q.lateral) > hw + 2;
      const look = off ? 6 + spd * 0.25 : 7 + spd * 0.42;
      T.pointAt(s + look, off ? clamp(c.q.lateral * 0.3, -hw + 3, hw - 3) : this.lane, _pt);
      tx = _pt.x; tz = _pt.z;
    }

    const desired = Math.atan2(tx - c.pos.x, tz - c.pos.z);
    const diff = wrapAngle(desired - c.heading);
    out.steer = clamp(-diff * 2.6, -1, 1);

    // ---- speed control
    let vT = T.speedAt(s + Math.max(spd, 0) * 0.6) * this.skill * c.speedMul;
    if (attacking) vT = Math.max(vT, P.speed + 8);
    if (Math.abs(diff) > 0.7) vT = Math.min(vT, 22);
    out.throttle = spd < vT ? 1 : spd < vT + 3 ? 0.25 : 0;
    out.brake = spd > vT + 7 ? 1 : 0;
    if (attacking && pd < 14) out.boost = true;
    // AI nitro: on straights when chasing the player, or to pull away
    if (racing && !c.isPlayer && c.nitro > 0.3 && Math.abs(diff) < 0.15 && T.speedAt(s + 40) > 62 && T.speedAt(s + 90) > 58) {
      if (behindGap > 25 || (behindGap < -10 && behindGap > -40 && Math.random() < 0.02)) out.boost = true;
    }
    if (c.boosting && !out.boost && c.nitro > 0.05 && Math.abs(diff) < 0.2 && T.speedAt(s + 40) > 58) out.boost = true;

    // ---- stuck recovery
    if (racing || !c.isPlayer) {
      if (this.reverseT > 0) {
        this.reverseT -= dt;
        out.throttle = 0; out.brake = 1; out.steer = -out.steer;
      } else if (Math.abs(spd) < 2.5 && out.throttle > 0) {
        this.stuckT += dt;
        if (this.stuckT > 1.1) { this.reverseT = 0.9; this.stuckT = 0; }
      } else this.stuckT = Math.max(0, this.stuckT - dt);
    }

    // ---- shooting: player in front, within the cone
    if (combat && this.canFire && g.state === 'race' && !P.dead && !c.isPlayer) {
      this.fireCd -= dt;
      if (this.burst > 0) {
        this.burstT -= dt;
        if (this.burstT <= 0) {
          this.burst--;
          this.burstT = 0.13;
          g.weapons.fireBolt(c, P, 78, 'rival');
        }
      } else if (this.fireCd <= 0 && pd < 58 && pAhead > 8) {
        const ang = Math.abs(wrapAngle(Math.atan2(pdx, pdz) - c.heading));
        if (ang < 0.16) {
          this.burst = 3;
          this.burstT = 0;
          this.fireCd = 3.6 - this.aggro * 1.4 + Math.random() * 1.5;
        }
      }
    }
    return out;
  }
}

/**
 * Raider goons: spawn ahead and come at you down the wrong way (head-ons!),
 * or chase you from behind. Easy fodder that keeps the clock fed.
 */
export class GoonAI {
  constructor(car, game) {
    this.car = car;
    this.game = game;
    this.out = { throttle: 0, brake: 0, steer: 0, fire: false, boost: false };
    this.mode = 'oncoming';
    this.lane = 0;
    this.fireCd = 1.5;
    this.stuckT = 0;
    this.reverseT = 0;
  }

  reset(mode) {
    this.mode = mode;
    this.lane = (Math.random() * 2 - 1) * 5;
    this.fireCd = 1.2 + Math.random() * 1.2;
    this.stuckT = 0;
    this.reverseT = 0;
    this.speed = mode === 'oncoming' ? 24 + Math.random() * 8 : 0;
  }

  update(dt) {
    const c = this.car, g = this.game, T = g.track, out = this.out, P = g.player;
    out.fire = false; out.boost = false;
    if (c.dead) { out.throttle = 0; out.brake = 0; out.steer = 0; return out; }
    const spd = c.fwdSpeed;
    const pdx = P.pos.x - c.pos.x, pdz = P.pos.z - c.pos.z;
    const pd = Math.hypot(pdx, pdz);
    const fx = Math.sin(c.heading), fz = Math.cos(c.heading);
    const pAhead = pdx * fx + pdz * fz;
    let tx, tz, vT;
    if (this.mode === 'oncoming') {
      // drive against the flow, drifting toward the player's lane for a head-on
      const lane = pd < 140 ? clamp(P.q.lateral, -T.hw + 2, T.hw - 2) : this.lane;
      T.pointAt(c.q.s - (8 + Math.max(spd, 0) * 0.45), lane, _pt);
      tx = _pt.x; tz = _pt.z;
      if (pd < 26 && pAhead > 0) { tx = P.pos.x; tz = P.pos.z; }
      vT = this.speed;
      // once we've passed the player, turn around and hunt
      if (pAhead < -10 && pd > 12 && pd < 60) this.mode = 'chase';
    } else {
      if (pd < 70) { tx = P.pos.x + P.vel.x * 0.35; tz = P.pos.z + P.vel.z * 0.35; }
      else { T.pointAt(c.q.s + 10 + Math.max(spd, 0) * 0.45, this.lane, _pt); tx = _pt.x; tz = _pt.z; }
      vT = Math.min(c.st.maxSpeed, P.speed + 9);
    }
    const desired = Math.atan2(tx - c.pos.x, tz - c.pos.z);
    const diff = wrapAngle(desired - c.heading);
    out.steer = clamp(-diff * 2.4, -1, 1);
    if (Math.abs(diff) > 1.2) vT = Math.min(vT, 18);
    out.throttle = spd < vT ? 1 : 0;
    out.brake = spd > vT + 6 ? 1 : 0;
    // stuck
    if (this.reverseT > 0) {
      this.reverseT -= dt;
      out.throttle = 0; out.brake = 1; out.steer = -out.steer;
    } else if (Math.abs(spd) < 2 && out.throttle > 0) {
      this.stuckT += dt;
      if (this.stuckT > 1.0) { this.reverseT = 0.8; this.stuckT = 0; }
    } else this.stuckT = 0;
    // shooting
    this.fireCd -= dt;
    if (g.state === 'race' && !P.dead && this.fireCd <= 0 && pd < 62 && pAhead > 6) {
      const ang = Math.abs(wrapAngle(Math.atan2(pdx, pdz) - c.heading));
      if (ang < 0.3) {
        g.weapons.fireBolt(c, P, 62, 'goon');
        this.fireCd = 1.3 + Math.random() * 0.9;
      }
    }
    return out;
  }
}
