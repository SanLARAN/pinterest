// Enemy AI and rendering state. Behaviours are small state machines with telegraphed attacks.
import { ENEMY_DEFS } from '../sim/defs.js';
import { createEnemyModel } from '../render/enemyModels.js';
import { resolveStatic, clampToArena } from '../sim/collision.js';
import { damp, clamp, angleLerp, Spring, easeOutBack } from '../util/math.js';
import { HALF, SIZE } from '../sim/layout.js';

let nextId = 1;
const _steer = { x: 0, z: 0 };

export const BOSS_SLAM = { radius: 5.2, windup: 1.0, damage: 22 };

export class EnemyManager {
  constructor(scene, shadows) {
    this.scene = scene;
    this.shadows = shadows;
    this.list = [];
    this.arrowCount = 0;
  }

  get aliveCount() {
    let n = 0;
    for (const e of this.list) if (!e.decor && e.state !== 'dying') n++;
    return n;
  }

  spawn(type, x, z, hpScale = 1, { decor = false } = {}) {
    const def = ENEMY_DEFS[type];
    const model = createEnemyModel(type);
    this.scene.add(model.root);
    const e = {
      id: nextId++,
      type,
      def,
      decor,
      model,
      x,
      y: 0,
      z,
      yaw: Math.random() * Math.PI * 2,
      radius: def.radius,
      hp: Math.round(def.hp * hpScale),
      maxHp: Math.round(def.hp * hpScale),
      state: decor ? 'active' : 'pop',
      popT: decor ? 1 : 0,
      deadT: 0,
      t: Math.random() * 10,
      seed: Math.random() * 100,
      vx: 0,
      vz: 0,
      desVx: 0,
      desVz: 0,
      kx: 0,
      kz: 0,
      flashT: 0,
      touchCd: 0.4 + Math.random() * 0.4,
      // brutes and bosses have no idle phase: they start straight in the chase state
      phase: type === 'brute' || type === 'boss' ? 'chase' : 'wait',
      phaseT: 0.4 + Math.random() * 0.6,
      cool: 0.8 + Math.random() * 1.5,
      recoil: 0,
      airY: 0,
      hopX: 0,
      hopZ: 0,
      strafe: Math.random() < 0.5 ? -1 : 1,
      enraged: false,
      glow: null,
      glowAmt: 0,
      squash: new Spring(230, 14),
      removeMe: false,
      wanderX: x,
      wanderZ: z,
      wanderT: 0,
      stunT: 0,
      stallT: 0,
      stallX: x,
      stallZ: z,
    };
    model.root.position.set(x, 0, z);
    model.root.scale.setScalar(0.001);
    this.list.push(e);
    return e;
  }

  clear() {
    for (const e of this.list) this.destroy(e);
    this.list = [];
  }

  destroy(e) {
    this.scene.remove(e.model.root);
    e.model.body.geometry.dispose();
    e.model.mat.dispose();
    if (e.model.ring) {
      e.model.ring.geometry.dispose();
      e.model.ring.material.dispose();
    }
    e.removeMe = true;
  }

  /** Marks an active enemy as dying (called by the game after lethal damage). */
  kill(e) {
    e.state = 'dying';
    e.deadT = 0;
  }

  update(dt, ctx) {
    for (const e of this.list) {
      if (e.state === 'dying') {
        this.animateDeath(e, dt);
        continue;
      }
      if (e.state === 'pop') {
        e.popT += dt;
        if (e.popT >= 0.35) e.state = 'active';
        e.model.root.scale.setScalar(Math.max(0.001, easeOutBack(clamp(e.popT / 0.35, 0, 1))));
        e.model.root.position.set(e.x, e.y, e.z);
        continue;
      }
      this.checkStall(e, dt, ctx);
      this.think(e, dt, ctx);
    }
    this.separate();
    let kept = 0;
    for (let i = 0; i < this.list.length; i++) {
      const e = this.list[i];
      if (e.removeMe) continue;
      this.list[kept++] = e;
    }
    this.list.length = kept;
    this.putShadows();
  }

  separate() {
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      if (a.state === 'dying') continue;
      for (let j = i + 1; j < L.length; j++) {
        const b = L[j];
        if (b.state === 'dying') continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const min = a.radius + b.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 < min * min && d2 > 1e-8) {
          const d = Math.sqrt(d2);
          const push = min - d;
          const wa = a.type === 'boss' ? 0.1 : 1;
          const wb = b.type === 'boss' ? 0.1 : 1;
          const sa = wa / (wa + wb);
          const sb = 1 - sa;
          a.x -= (dx / d) * push * sa;
          a.z -= (dz / d) * push * sa;
          b.x += (dx / d) * push * sb;
          b.z += (dz / d) * push * sb;
        }
      }
    }
  }

  /**
   * Anti-stuck safeguard. A foe that makes no progress for ~2.5s while far from the hero
   * (wedged between colliders, or on a pocket the flow field cannot leave) is moved to
   * the nearest free cell that is closer to the hero along the flow field. Without this a
   * single stuck foe would keep the chapter from ever clearing.
   */
  checkStall(e, dt, ctx) {
    const hero = ctx.hero;
    const flow = ctx.flow;
    const busy = e.phase === 'windup' || e.phase === 'charge' || e.stunT > 0; // hops still count: a hop-in-place is a stall
    const far = Math.hypot(hero.x - e.x, hero.z - e.z) > 6;
    if (e.decor || busy || !far || Math.hypot(e.x - e.stallX, e.z - e.stallZ) > 0.4) {
      e.stallT = 0;
      e.stallX = e.x;
      e.stallZ = e.z;
      return;
    }
    e.stallT += dt;
    if (e.stallT < 2.5) return;
    e.stallT = 0;
    e.stallX = e.x;
    e.stallZ = e.z;
    const here = flow.dist[flow.cellOf(e.x, e.z)];
    const ci = Math.round(e.x) + HALF;
    const cj = Math.round(e.z) + HALF;
    let best = -1;
    let bestScore = Infinity;
    for (let dj = -5; dj <= 5; dj++) {
      for (let di = -5; di <= 5; di++) {
        const i = ci + di;
        const j = cj + dj;
        if (i < 0 || j < 0 || i > SIZE - 1 || j > SIZE - 1) continue;
        const idx = j * SIZE + i;
        if (flow.blocked[idx] || flow.dist[idx] < 0) continue;
        const better = here < 0 || flow.dist[idx] < here ? 0 : 1000;
        const score = better + flow.dist[idx] + Math.hypot(di, dj) * 0.5;
        if (score < bestScore) {
          bestScore = score;
          best = idx;
        }
      }
    }
    if (best < 0) {
      // nothing reachable nearby: the foe is walled in for good, so retire it quietly
      this.destroy(e);
      return;
    }
    e.x = (best % SIZE) - HALF;
    e.z = Math.floor(best / SIZE) - HALF;
    e.squash.impulse(-3);
  }

  think(e, dt, ctx) {
    const def = e.def;
    const hero = ctx.hero;
    const layout = ctx.layout;
    e.t += dt;
    if (e.stunT > 0) {
      // psi stun: no AI and no contact damage; knockback carries on and damps out
      e.stunT -= dt;
      e.touchCd -= dt;
      e.flashT -= dt;
      e.glow = { r: 0.5, g: 0.95, b: 1 };
      e.glowAmt = 0.4 + 0.25 * Math.sin(e.t * 40);
      e.vx = damp(e.vx, 0, 20, dt);
      e.vz = damp(e.vz, 0, 20, dt);
      e.kx = damp(e.kx, 0, 8, dt);
      e.kz = damp(e.kz, 0, 8, dt);
      e.x += (e.vx + e.kx) * dt;
      e.z += (e.vz + e.kz) * dt;
      resolveStatic(layout, e);
      clampToArena(e);
      e.y = layout.heightAt(e.x, e.z);
      this.animate(e, dt);
      return;
    }
    e.touchCd -= dt;
    e.flashT -= dt;
    e.glow = null;

    let dx = 0;
    let dz = 0;
    let dist = 0;
    if (!e.decor) {
      dx = hero.x - e.x;
      dz = hero.z - e.z;
      dist = Math.hypot(dx, dz);
    }
    const hdx = dist > 1e-4 ? dx / dist : 0;
    const hdz = dist > 1e-4 ? dz / dist : 0;
    let wantX = 0;
    let wantZ = 0;
    let accel = 10;
    const enrage = e.enraged ? 1.25 : 1;

    // steering toward the hero along the flow field (or a wander point for decor)
    const pathTo = (tx, tz) => {
      ctx.flow.steer(e.x, e.z, tx, tz, _steer);
      return _steer;
    };

    switch (e.type) {
      case 'slime': {
        accel = 40;
        if (e.phase === 'wait') {
          e.phaseT -= dt;
          if (e.phaseT <= 0) {
            let d;
            if (e.decor) {
              if (Math.hypot(e.wanderX - e.x, e.wanderZ - e.z) < 1.5) {
                const a = Math.random() * Math.PI * 2;
                e.wanderX = clamp(e.x + Math.cos(a) * 6, -18, 18);
                e.wanderZ = clamp(e.z + Math.sin(a) * 6, -18, 18);
              }
              d = pathTo(e.wanderX, e.wanderZ);
            } else {
              d = pathTo(hero.x, hero.z);
            }
            e.hopX = d.x;
            e.hopZ = d.z;
            e.phase = 'air';
            e.phaseT = 0.42;
            ctx.ev.hop(e);
          }
        } else {
          e.phaseT -= dt;
          const prog = clamp(1 - e.phaseT / 0.42, 0, 1);
          wantX = e.hopX * def.speed * 2.4 * enrage;
          wantZ = e.hopZ * def.speed * 2.4 * enrage;
          e.airY = Math.sin(prog * Math.PI) * 0.5;
          if (e.phaseT <= 0) {
            e.phase = 'wait';
            e.phaseT = 0.32 + Math.random() * 0.3;
            e.airY = 0;
            e.squash.impulse(-5);
            ctx.ev.land(e);
          }
        }
        break;
      }
      case 'imp': {
        accel = 9;
        if (e.decor) {
          const d = pathTo(e.wanderX, e.wanderZ);
          wantX = d.x * def.speed * 0.3;
          wantZ = d.z * def.speed * 0.3;
          break;
        }
        const d = pathTo(hero.x, hero.z);
        const px = -d.z;
        const pz = d.x;
        const weave = dist < 1.6 ? 0 : Math.sin(e.t * 6.5 + e.seed) * 0.85;
        let vx = d.x + px * weave;
        let vz = d.z + pz * weave;
        const m = Math.hypot(vx, vz) || 1;
        wantX = (vx / m) * def.speed * enrage;
        wantZ = (vz / m) * def.speed * enrage;
        break;
      }
      case 'archer': {
        accel = 6;
        const range = def.range;
        if (e.decor) {
          const d = pathTo(e.wanderX, e.wanderZ);
          wantX = d.x * def.speed * 0.3;
          wantZ = d.z * def.speed * 0.3;
          break;
        }
        if (dist > range + 1) {
          const d = pathTo(hero.x, hero.z);
          wantX = d.x * def.speed;
          wantZ = d.z * def.speed;
        } else if (dist < range * 0.55) {
          wantX = -hdx * def.speed * 0.9;
          wantZ = -hdz * def.speed * 0.9;
        } else {
          if (Math.random() < dt * 0.4) e.strafe *= -1;
          wantX = -hdz * e.strafe * def.speed * 0.45;
          wantZ = hdx * e.strafe * def.speed * 0.45;
        }
        e.cool -= dt;
        if (e.cool < 0.6 && e.cool > 0) {
          e.glow = { r: 0.35, g: 0.9, b: 1 };
          e.glowAmt = 0.4 + 0.4 * Math.sin(e.cool * 30);
        }
        if (e.cool <= 0 && dist < range + 3 && ctx.flow.hasLine(e.x, e.z, hero.x, hero.z)) {
          ctx.ev.arrow(e.x + hdx * 0.4, 0.9, e.z + hdz * 0.4, hero.x, hero.y + 0.7, hero.z, def.arrowDmg);
          e.recoil = 0.3;
          e.cool = def.fireCooldown * (0.9 + Math.random() * 0.2);
        }
        break;
      }
      case 'brute':
      case 'boss': {
        const isBoss = e.type === 'boss';
        if (isBoss && !e.enraged && e.hp < e.maxHp * 0.5) {
          e.enraged = true;
          ctx.ev.roar(e);
        }
        if (e.decor) {
          const d = pathTo(e.wanderX, e.wanderZ);
          wantX = d.x * def.speed * 0.3;
          wantZ = d.z * def.speed * 0.3;
          break;
        }
        if (e.phase === 'chase') {
          accel = 7;
          const d = pathTo(hero.x, hero.z);
          const sp = def.speed * (isBoss ? enrage : 1);
          wantX = d.x * sp;
          wantZ = d.z * sp;
          e.cool -= dt;
          if (!isBoss && e.cool <= 0 && dist < 4.6) {
            e.phase = 'windup';
            e.phaseT = 0.8;
          }
          if (isBoss && e.cool <= 0 && dist < 9) {
            e.phase = 'windup';
            e.phaseT = BOSS_SLAM.windup;
            ctx.ev.warn(e.x, e.z, BOSS_SLAM.radius, BOSS_SLAM.windup);
          }
        } else if (e.phase === 'windup') {
          accel = 30;
          e.phaseT -= dt;
          e.glow = isBoss ? { r: 0.45, g: 0.95, b: 1 } : { r: 1, g: 0.25, b: 0.15 };
          e.glowAmt = 0.3 + 0.35 * Math.abs(Math.sin(e.t * 22));
          if (e.phaseT <= 0) {
            if (isBoss) {
              ctx.ev.slam(e.x, e.z, BOSS_SLAM.radius, BOSS_SLAM.damage);
              e.phase = 'recover';
              e.phaseT = 0.75;
              e.cool = e.enraged ? 2.4 : 3.2;
            } else {
              e.phase = 'charge';
              e.phaseT = 0.45;
              e.chargeX = hdx;
              e.chargeZ = hdz;
              ctx.ev.stomp(e);
            }
          }
        } else if (e.phase === 'charge') {
          accel = 60;
          wantX = e.chargeX * 11;
          wantZ = e.chargeZ * 11;
          e.phaseT -= dt;
          if (e.phaseT <= 0) {
            e.phase = 'recover';
            e.phaseT = 0.8;
            e.cool = 1.6;
          }
        } else if (e.phase === 'recover') {
          accel = 10;
          e.phaseT -= dt;
          if (e.phaseT <= 0) e.phase = 'chase';
        }
        break;
      }
      default:
        break;
    }

    if (e.decor) accel = Math.min(accel, 3);
    e.desVx = wantX;
    e.desVz = wantZ;
    e.vx = damp(e.vx, e.desVx, accel, dt);
    e.vz = damp(e.vz, e.desVz, accel, dt);
    e.kx = damp(e.kx, 0, 8, dt);
    e.kz = damp(e.kz, 0, 8, dt);
    e.x += (e.vx + e.kx) * dt;
    e.z += (e.vz + e.kz) * dt;
    const hitWall = resolveStatic(layout, e);
    if (hitWall && e.phase === 'charge') {
      e.phase = 'recover';
      e.phaseT = 0.8;
      e.cool = 1.6;
      ctx.ev.bump(e);
    }
    clampToArena(e);
    e.y = layout.heightAt(e.x, e.z) + (e.type === 'slime' ? e.airY : 0);

    // facing
    const sp = Math.hypot(e.vx, e.vz);
    if (e.phase === 'charge') e.yaw = angleLerp(e.yaw, Math.atan2(e.chargeX, e.chargeZ), 1 - Math.exp(-14 * dt));
    else if (sp > 0.4) e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), 1 - Math.exp(-10 * dt));
    else if (!e.decor) e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), 1 - Math.exp(-6 * dt));

    // contact damage
    if (!e.decor && e.touchCd <= 0 && dist < hero.radius + e.radius * 0.9) {
      const dmg = e.phase === 'charge' ? def.chargeDmg : def.touchDmg;
      if (ctx.ev.hit(dmg, e.x, e.z, e)) e.touchCd = 0.8;
    }
    this.animate(e, dt);
  }

  animate(e, dt) {
    const root = e.model.root;
    const body = e.model.body;
    e.squash.update(dt);
    const s = e.squash.x;
    root.position.set(e.x, e.y, e.z);
    root.rotation.y = e.yaw;
    root.scale.setScalar(1);
    let sx = 1;
    let sy = 1;
    let sz = 1;
    body.position.set(0, 0, 0);
    body.rotation.set(0, 0, 0);
    switch (e.type) {
      case 'slime': {
        const antic = e.phase === 'wait' && e.phaseT < 0.12 ? (0.12 - e.phaseT) / 0.12 : 0;
        const stretch = e.phase === 'air' ? Math.sin(clamp(1 - e.phaseT / 0.42, 0, 1) * Math.PI) * 0.22 : 0;
        sy = 1 + s * 0.5 - antic * 0.22 + stretch;
        sx = sz = 1 - s * 0.25 + antic * 0.14 - stretch * 0.4;
        break;
      }
      case 'imp':
        body.position.y = Math.abs(Math.sin(e.t * 16)) * 0.12;
        body.rotation.z = Math.sin(e.t * 8) * 0.12;
        sy = 1 + s * 0.3;
        break;
      case 'archer':
        e.recoil = Math.max(0, e.recoil - dt * 2.5);
        body.position.z = -e.recoil * 0.3;
        sy = 1 + s * 0.2;
        break;
      case 'brute':
        body.rotation.x = e.phase === 'windup' ? -0.28 : e.phase === 'charge' ? 0.22 : 0;
        sy = 1 + s * 0.25 + (e.phase === 'windup' ? 0.05 : 0);
        break;
      case 'boss':
        sy = 1 + s * 0.2 + (e.phase === 'windup' ? Math.sin(e.t * 20) * 0.03 + 0.04 : 0);
        sx = sz = 1 - (e.phase === 'windup' ? 0.02 : 0);
        if (e.model.ring) {
          e.model.ring.material.opacity = e.phase === 'windup' ? 0.5 + 0.4 * Math.abs(Math.sin(e.t * 14)) : 0.5;
          e.model.ring.rotation.z = e.t * 0.8;
        }
        break;
      default:
        break;
    }
    body.scale.set(sx, sy, sz);

    // emissive: hit flash wins over telegraph glow
    const mat = e.model.mat;
    if (e.flashT > 0) {
      const f = e.flashT / 0.12;
      mat.emissive.setRGB(f, f, f);
    } else if (e.glow) {
      mat.emissive.setRGB(e.glow.r * e.glowAmt, e.glow.g * e.glowAmt, e.glow.b * e.glowAmt);
    } else {
      mat.emissive.setRGB(0, 0, 0);
    }
  }

  animateDeath(e, dt) {
    e.deadT += dt;
    const t = clamp(e.deadT / 0.3, 0, 1);
    const root = e.model.root;
    const body = e.model.body;
    root.position.set(e.x, e.y, e.z);
    root.rotation.y = e.yaw + t * 4;
    body.scale.set(1 + t * 0.45, 1 - t * 0.85, 1 + t * 0.45);
    body.position.set(0, 0, 0);
    e.model.mat.emissive.setRGB(1, 1, 1);
    if (e.deadT >= 0.3) this.destroy(e);
  }

  putShadows() {
    const sh = this.shadows;
    sh.begin();
    for (const e of this.list) {
      if (e.removeMe) continue;
      let k = 1;
      if (e.state === 'pop') k = Math.min(1, e.popT / 0.35);
      if (e.state === 'dying') k = Math.max(0, 1 - e.deadT / 0.3);
      const r = e.radius * (e.type === 'boss' ? 1.2 : 1.05) * k;
      sh.put(e.x, e.y - (e.type === 'slime' ? e.airY : 0), e.z, r);
    }
    sh.end();
  }

  /** Enemies that can be hit right now. */
  targets() {
    return this.list.filter((e) => e.state === 'active' && !e.decor);
  }
}
