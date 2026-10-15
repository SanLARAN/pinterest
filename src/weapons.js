import { clamp, wrapAngle } from './noise.js';
import { CFG } from './config.js';

const _w = { x: 0, y: 0, z: 0 };
const TRACER_SPEED = 420;

/**
 * Player twin machine guns (hitscan with travelling tracers + aim assist)
 * and enemy energy bolts (slow, visible, dodgeable).
 */
export class Weapons {
  constructor(game) {
    this.game = game;
    this.pending = [];
    this.bolts = [];
    for (let i = 0; i < 48; i++) this.pending.push({ on: false, t: 0, target: null, barrel: null, dmg: 0, x: 0, y: 0, z: 0, dx: 0, dz: 0 });
    for (let i = 0; i < 64; i++) this.bolts.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, owner: null, kind: 'goon', hint: -1 });
    this.lockTarget = null;
  }

  clear() {
    for (const p of this.pending) p.on = false;
    for (const b of this.bolts) b.on = false;
    this.lockTarget = null;
  }

  /** Best target in front of the car for aim assist / auto-fire. */
  findTarget(car, range = 92, cone = 0.27) {
    const g = this.game;
    let best = null, bestScore = Infinity;
    const h = car.heading;
    for (const o of g.allCars) {
      if (o === car || !o.active || o.dead || o.ghost > 0) continue;
      const dx = o.pos.x - car.pos.x, dz = o.pos.z - car.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > range || d < 1) continue;
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - h));
      const c = d < 25 ? cone * 1.5 : cone;
      if (ang > c) continue;
      const score = ang * 60 + d * 0.5;
      if (score < bestScore) { bestScore = score; best = o; }
    }
    return best;
  }

  updatePlayer(dt, car, firing, overdrive) {
    const g = this.game;
    this.lockTarget = car.dead ? null : this.findTarget(car);
    car.fireCd -= dt;
    if (car.fireCd < -0.1) car.fireCd = -0.1;
    if (firing && !car.overheated && !car.dead) {
      let guard = 0;
      while (car.fireCd <= 0 && guard++ < 3) {
        car.fireCd += overdrive ? 0.048 : 0.072;
        if (!overdrive) car.heat += 0.03;
        this.shoot(car, overdrive);
        if (car.heat >= 1) {
          car.heat = 1;
          car.overheated = true;
          g.onOverheat(car);
          break;
        }
      }
    } else {
      car.heat = Math.max(0, car.heat - dt * (car.overheated ? 0.6 : 0.85));
      if (car.overheated && car.heat <= 0.22) car.overheated = false;
    }
  }

  shoot(car, overdrive) {
    const g = this.game;
    const side = (car.shot++ & 1) ? 1 : -1;
    car.localToWorld(0.48 * side, 1.15, 2.25, _w);
    const mx = _w.x, my = _w.y, mz = _w.z;
    let dirA = car.heading;
    const target = this.lockTarget;
    let ty = my;
    if (target) {
      const dx0 = target.pos.x - mx, dz0 = target.pos.z - mz;
      const d0 = Math.hypot(dx0, dz0);
      const lead = d0 / TRACER_SPEED;
      const px = target.pos.x + target.vel.x * lead, pz = target.pos.z + target.vel.z * lead;
      dirA = Math.atan2(px - mx, pz - mz);
      ty = target.pos.y + 0.9;
    }
    dirA += (Math.random() - 0.5) * 0.04;
    const dx = Math.sin(dirA), dz = Math.cos(dirA);
    // hitscan against cars and barrels
    const range = 100;
    let hitT = range, hitCar = null, hitBarrel = null;
    for (const o of g.allCars) {
      if (o === car || !o.active || o.dead) continue;
      const fx = Math.sin(o.heading), fz = Math.cos(o.heading);
      for (let k = -1; k <= 1; k += 2) {
        const cx = o.pos.x + fx * o.st.axle * k, cz = o.pos.z + fz * o.st.axle * k;
        const t = rayCircle(mx, mz, dx, dz, cx, cz, o.st.radius + 0.35);
        if (t > 0 && t < hitT) { hitT = t; hitCar = o; hitBarrel = null; }
      }
    }
    // barrels along the ray
    const W = g.world;
    const steps = Math.ceil(Math.min(hitT, range) / 14);
    for (let sIdx = 0; sIdx <= steps; sIdx++) {
      const sx = mx + dx * sIdx * 14, sz = mz + dz * sIdx * 14;
      W.forColliders(sx, sz, 9, (c) => {
        if (c.kind !== 'barrel') return false;
        const t = rayCircle(mx, mz, dx, dz, c.x, c.z, c.r + 0.2);
        if (t > 0 && t < hitT) { hitT = t; hitBarrel = c; hitCar = null; }
        return false;
      });
    }
    if (!hitCar && !hitBarrel) ty = my - 0.3;
    else if (hitBarrel) ty = (hitBarrel.y || my) + 0.7;
    const life = hitT / TRACER_SPEED;
    const vy = (ty - my) / Math.max(0.001, life);
    const fxs = g.fxs;
    const tc = overdrive ? 0xff4fb0 : 0xffd27a;
    fxs.sprites.spawn(mx, my, mz, dx * TRACER_SPEED, vy, dz * TRACER_SPEED, life, 0.55, 0.55, tc, 1, 0, 0, 0.02);
    fxs.sprites.spawn(mx + dx * 0.4, my, mz + dz * 0.4, car.vel.x, 0, car.vel.z, 0.05, overdrive ? 2.4 : 1.8, 0.6, 0xfff0b0, 1);
    // shell casing
    if (Math.random() < 0.6) {
      const ex = -Math.cos(car.heading) * side;
      const ez = Math.sin(car.heading) * side;
      fxs.debris.spawn(mx - dx * 1.2, my, mz - dz * 1.2, car.vel.x + ex * 4, 4 + Math.random() * 3, car.vel.z + ez * 4, 0.12, 0xffc34a, 0.7, car.q.idx);
    }
    if (hitCar || hitBarrel) {
      const p = this.pending.find((q) => !q.on);
      if (p) {
        p.on = true; p.t = life; p.target = hitCar; p.barrel = hitBarrel;
        p.dmg = overdrive ? 11 : 7.5;
        p.x = mx + dx * hitT; p.y = ty; p.z = mz + dz * hitT; p.dx = dx; p.dz = dz;
        p.dist = hitT;
      }
    }
    g.audio.shoot(overdrive);
    g.fx.addTrauma(0.012);
  }

  fireBolt(shooter, target, speed, kind) {
    const g = this.game;
    const b = this.bolts.find((q) => !q.on);
    if (!b) return;
    shooter.localToWorld(0, 1.3, 2.4, _w);
    const dx0 = target.pos.x - _w.x, dz0 = target.pos.z - _w.z;
    const d = Math.hypot(dx0, dz0);
    const tt = d / speed;
    const lead = kind === 'rival' ? 0.85 : 0.6;
    const ax = target.pos.x + target.vel.x * tt * lead, az = target.pos.z + target.vel.z * tt * lead;
    let a = Math.atan2(ax - _w.x, az - _w.z) + (Math.random() - 0.5) * 0.06;
    b.on = true;
    b.x = _w.x; b.y = _w.y; b.z = _w.z;
    b.vx = Math.sin(a) * speed; b.vz = Math.cos(a) * speed;
    b.vy = clamp(((target.pos.y + 0.9) - _w.y) / Math.max(0.2, tt), -12, 12);
    b.life = 1.7;
    b.owner = shooter;
    b.kind = kind;
    b.hint = shooter.q.idx;
    const col = kind === 'rival' ? 0xff3fd0 : 0xff4030;
    g.fxs.sprites.spawn(_w.x, _w.y, _w.z, shooter.vel.x, 0, shooter.vel.z, 0.08, 2.2, 0.5, col, 1);
    g.audio.bolt(Math.hypot(_w.x - g.player.pos.x, _w.z - g.player.pos.z));
  }

  update(dt) {
    const g = this.game;
    // pending player hits (tracers arrive)
    for (const p of this.pending) {
      if (!p.on) continue;
      p.t -= dt;
      if (p.t > 0) continue;
      p.on = false;
      if (p.target) {
        const t = p.target;
        if (!t.dead && t.active) {
          const killed = t.damage(p.dmg, g.player, 'gun');
          g.onBulletHit(t, p, killed);
        }
      } else if (p.barrel && p.barrel.alive) {
        g.explodeBarrel(p.barrel, g.player);
      }
    }
    // enemy bolts
    const P = g.player;
    const sp = g.fxs.sprites;
    for (const b of this.bolts) {
      if (!b.on) continue;
      b.life -= dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      const col = b.kind === 'rival' ? 0xff3fd0 : 0xff4030;
      const pulse = 1 + Math.sin(b.life * 40) * 0.15;
      sp.draw(b.x, b.y, b.z, 2.8 * pulse, col, 1);
      sp.draw(b.x, b.y, b.z, 1.1, 0xffffff, 1);
      sp.spawn(b.x, b.y, b.z, b.vx * 0.05, 0, b.vz * 0.05, 0.22, 1.3, 0.1, col, 0.9);
      if (b.life <= 0) { b.on = false; continue; }
      // hit the player?
      if (!P.dead && P.active) {
        const dx = P.pos.x - b.x, dz = P.pos.z - b.z;
        if (dx * dx + dz * dz < 2.2 * 2.2 && Math.abs(P.pos.y + 0.8 - b.y) < 2.6) {
          b.on = false;
          g.onBoltHitPlayer(b);
          continue;
        }
      }
      // hit the ground?
      const gh = g.world.groundAt(b.x, b.z, b.hint);
      b.hint = g.world.lastIdx;
      if (b.y < gh + 0.1) {
        b.on = false;
        g.boltSplash(b.x, gh, b.z, col);
      }
    }
  }
}

/** Ray (origin o, unit dir d) vs circle; returns distance or -1. */
function rayCircle(ox, oz, dx, dz, cx, cz, r) {
  const lx = cx - ox, lz = cz - oz;
  const t = lx * dx + lz * dz;
  if (t < 0) return -1;
  const d2 = lx * lx + lz * lz - t * t;
  if (d2 > r * r) return -1;
  return t - Math.sqrt(r * r - d2);
}

export { CFG };
