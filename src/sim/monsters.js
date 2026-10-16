// ============================================================
// MONSTERS — three species, each with its own hearing, gait and kill rule.
//   whisperer : blind pack hunter (2 → 4 over the night)
//   tall      : one per map. Slow, relentless, swallows echoes.
//   weeper    : one per map. Fast, wails, punishes screams instantly.
// ============================================================
import { clamp, damp, dist2, lerp, approachAngle, TAU } from '../core/util.js';
import { randomRoamPoint } from './world.js';

export const DEFS = {
  whisperer: {
    key: 'whisperer',
    name: 'ШЕПТУН', nameEn: 'THE WHISPERER',
    dread: 1.0,
    height: 2.55, radius: 0.5,
    speed: { roam: 1.5, investigate: 2.85, hunt: 4.35, lunge: 7.6, flee: 5.2 },
    senseRadius: 74,          // base hearing distance multiplier
    closeSense: 6.5,          // feels your breath even in silence
    hearMul: 1.0,
    attackRange: 2.05, damage: 1, attackCd: 2.0,
    lightFear: 26,            // repaired generators push them out
    echoDamp: 0,
    color: 0x9fb4ae,
    recoil: 1.05,
  },
  tall: {
    key: 'tall',
    name: 'ДЛИННЫЙ', nameEn: 'THE TALL ONE',
    dread: 1.5,
    height: 7.4, radius: 0.62,
    speed: { roam: 1.15, investigate: 2.45, hunt: 3.35, lunge: 9.4, flee: 3.0 },
    senseRadius: 150,
    closeSense: 15,
    hearMul: 1.35,
    attackRange: 3.0, damage: 2, attackCd: 2.6,
    lightFear: 0,
    echoDamp: 30,             // metres around it where echoes die
    color: 0x2b2f33,
    recoil: 1.5,
  },
  weeper: {
    key: 'weeper',
    name: 'ПЛАКАЛЬЩИЦА', nameEn: 'THE WEEPER',
    dread: 1.9,
    height: 2.25, radius: 0.46,
    speed: { roam: 1.9, investigate: 3.4, hunt: 5.9, lunge: 7.9, flee: 6.0 },
    senseRadius: 105,
    closeSense: 9,
    hearMul: 1.6,             // obsessed with your voice
    attackRange: 1.8, damage: 3, attackCd: 1.6,
    lightFear: 14,
    echoDamp: 0,
    color: 0xd8cfc0,
    recoil: 0.72,
  },
};

let MID = 1;

export class Monster {
  constructor(type, x, z, world, rng = null) {
    this.id = MID++;
    this.type = type;
    this.def = DEFS[type];
    this.x = x; this.z = z; this.y = world.heightAt(x, z);
    this.px = x; this.pz = z;
    this.yaw = rng ? rng.next() * TAU : Math.atan2(-x, -z);
    this.state = 'spawn';
    this.stateT = 0;
    this.alive = true;
    this.speed = 0;
    this.tx = x; this.tz = z;
    this.alert = 0;           // 0..1 — how sure it is about you
    this.attackCd = 0;
    this.anim = rng ? rng.next() * 100 : (Math.abs(x * 0.13 + z * 0.07) % 100);
    this.stuck = 0;
    this.detour = 0;
    this.wailT = 0;           // weeper cycle
    this.cycle = 0;
    this.growl = 0;
    this.lungeT = 0;
    this.spawnT = 0;
    this.huntT = 0;
    this.lastKnown = null;
    this.bodyLean = 0;
    this.headTilt = 0;
    this.scared = 0;
    this.drownT = 0;
  }

  setState(s) {
    if (this.state === s) return;
    this.state = s; this.stateT = 0;
  }

  /** Distance-weighted hearing of a noise event. Returns true if it noticed. */
  hear(nx, nz, radius, loud, ctx) {
    const d = dist2(this.x, this.z, nx, nz);
    const reach = radius * this.def.hearMul * (loud ? 1.5 : 1) + (loud ? 60 : 0);
    if (d > reach) return false;
    const strength = clamp(1 - d / Math.max(reach, 1), 0, 1) * (loud ? 1 : 0.65);
    this.tx = nx; this.tz = nz;
    this.lastKnown = { x: nx, z: nz };
    this.alert = clamp(this.alert + strength * (loud ? 1.1 : 0.5), 0, 1);
    if (loud) { this.growl = 1; this.huntT = Math.max(this.huntT, 26); }
    else if (this.state === 'roam' || this.state === 'spawn') this.setState('investigate');
    if (this.alert > 0.42 && this.state !== 'hunt') this.setState('investigate');
    if (this.alert > 0.85) this.setState('hunt');
    return true;
  }

  update(dt, ctx) {
    const { world, game, rng } = ctx;
    const D = this.def;
    this.stateT += dt;
    this.anim += dt * (1 + this.speed * 0.55);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.stagger = Math.max(0, (this.stagger || 0) - dt);
    this.growl = Math.max(0, this.growl - dt * 0.8);
    this.alert = clamp(this.alert - dt * (this.state === 'hunt' ? 0.085 : 0.055), 0, 1);
    this.lostT = Math.max(0, (this.lostT || 0) - dt);
    this.huntT = Math.max(0, this.huntT - dt);
    if (!this.tallCycle) this.tallCycle = 0;
    this.lungeT = Math.max(0, this.lungeT - dt);
    this.scared = Math.max(0, this.scared - dt);

    if (!this.alive) return;

    if (this.state === 'spawn') {
      this.spawnT += dt;
      this.y = world.heightAt(this.x, this.z) - clamp(1 - this.spawnT / 1.7, 0, 1) * D.height * 0.9;
      if (this.spawnT > 1.7) { this.setState('roam'); this.y = world.heightAt(this.x, this.z); ctx.emit('monsterSpawned', this); }
      return;
    }

    // ---------- perception ----------
    // These things are blind. They only ever know WHERE THE SOUND CAME FROM, so a
    // silent player genuinely disappears from them — that is the whole game.
    let prey = null, preyD = 1e9, heard = false;
    for (const p of game.players) {
      if (!p.alive) continue;
      const d = dist2(this.x, this.z, p.x, p.z);
      if (d < preyD) { preyD = d; prey = p; }
      // continuous hearing of movement noise
      const r = p.noiseRadius();
      if (r > 1 && d < r * D.hearMul + 6) {
        heard = true;
        this.tx = p.x; this.tz = p.z; this.lastKnown = { x: p.x, z: p.z };
        const s = clamp(1 - d / Math.max(r * D.hearMul + 6, 1), 0, 1);
        this.alert = clamp(this.alert + s * dt * (r > 20 ? 1.5 : 0.55), 0, 1);
        if (this.alert > 0.5) this.setState('investigate');
        if (this.alert > 0.88 || r > 28) { this.setState('hunt'); this.lostT = 2.6; }
      }
      // proximity sense: it feels you breathing
      if (d < D.closeSense && !(p.breath && p.speed < 0.4)) {
        heard = true;
        this.alert = clamp(this.alert + dt * (D.closeSense - d) * 0.22, 0, 1);
        this.tx = p.x; this.tz = p.z; this.lastKnown = { x: p.x, z: p.z };
        if (d < D.closeSense * 0.7) { this.setState('hunt'); this.lostT = 2.2; }
      }
    }
    if (heard) this.lostT = Math.max(this.lostT, this.state === 'hunt' ? 2.6 : 2.2);

    // light from repaired generators repels some species
    let lightPush = 0, lpX = 0, lpZ = 0;
    if (D.lightFear > 0) {
      for (const g of world.gens) {
        if (!g.fixed || g.lamp <= 0.05) continue;
        const d = dist2(this.x, this.z, g.x, g.z);
        if (d < D.lightFear) {
          const w = 1 - d / D.lightFear;
          if (w > lightPush) { lightPush = w; lpX = g.x; lpZ = g.z; }
        }
      }
    }
    if (lightPush > 0.35 && this.state !== 'flee') { this.scared = 1.2; }
    // lit generators are real safe havens for the light-fearing species:
    // they break off the hunt and walk out of the pool of light.
    if (lightPush > 0.18 && D.lightFear > 0 && this.state !== 'flee' && this.state !== 'spawn') {
      const la = Math.atan2(this.z - lpZ, this.x - lpX);
      this.tx = this.x + Math.cos(la) * 34;
      this.tz = this.z + Math.sin(la) * 34;
      this.lastKnown = null;
      this.scared = Math.max(this.scared, 1.4);
      this.alert = Math.min(this.alert, lerp(0.85, 0.22, lightPush));
      if (this.state === 'hunt' && lightPush > 0.34) this.setState('investigate');
    }

    // ---------- state machine ----------
    if (game.phase === 'dawn') { this.setState('flee'); }

    switch (this.state) {
      case 'roam': {
        if (!this.lastKnown || dist2(this.x, this.z, this.tx, this.tz) < 6 || this.stateT > 14) {
          const p = randomRoamPoint(world, rng, this.x, this.z, 30, 90);
          this.tx = p.x; this.tz = p.z; this.lastKnown = null; this.setState('roam');
        }
        this.move(dt, ctx, D.speed.roam * (this.type === 'tall' ? 1 : 1));
        if (rng.chance(dt * 0.09)) ctx.emit('monsterSound', this, 'idle');
        break;
      }
      case 'investigate': {
        this.move(dt, ctx, D.speed.investigate);
        if (rng.chance(dt * 0.16)) ctx.emit('monsterSound', this, 'sniff');
        if (dist2(this.x, this.z, this.tx, this.tz) < 4.5) { this.setState('search'); this.searchT = 13; }
        if (this.stateT > 26) { this.setState('roam'); this.alert *= 0.5; }
        break;
      }
      case 'search': {
        this.searchT -= dt;
        if (this.stateT > 2.4) {
          this.setState('search');
          const p = randomRoamPoint(world, rng, this.tx, this.tz, 5, 22);
          this.tx = p.x; this.tz = p.z;
        }
        this.move(dt, ctx, D.speed.investigate * 0.72);
        if (rng.chance(dt * 0.22)) ctx.emit('monsterSound', this, 'search');
        if (this.searchT <= 0) { this.setState('roam'); this.alert = clamp(this.alert, 0, 0.35); }
        break;
      }
      case 'hunt': {
        if (prey && heard) {
          // lead the target a touch — but only while it can actually hear it
          const lead = clamp(preyD / 26, 0, 1.1);
          this.tx = prey.x + prey.vx * lead;
          this.tz = prey.z + prey.vz * lead;
          this.lastKnown = { x: prey.x, z: prey.z };
        } else if (this.lastKnown) {
          this.tx = this.lastKnown.x; this.tz = this.lastKnown.z;
        }
        // trail goes cold: it charges to the last sound, then has to look for you
        if (!heard && this.lostT <= 0 && this.stateT > 1.6) {
          this.setState('search'); this.searchT = 9; this.alert = Math.min(this.alert, 0.62);
          ctx.emit('monsterSound', this, 'lost');
          break;
        }
        let sp = D.speed.hunt * (heard ? 1 : 0.82);
        // species flavour
        if (this.type === 'weeper') {
          this.cycle += dt;
          const ph = this.cycle % 9;
          if (ph < 3.2) { this.setState('hunt'); sp = D.speed.hunt * 0.42; this.wailT = 0; }      // stalk
          else if (ph < 6.0) { sp = 0.35; this.wailT = Math.min(1, this.wailT + dt * 1.4); if (this.wailT > 0.15 && !this.wailed) { this.wailed = true; ctx.emit('monsterSound', this, 'wail'); ctx.emit('wail', this); } }
          else { this.wailed = false; sp = D.speed.lunge; }                                        // rush
        }
        if (this.type === 'tall') {
          // It walks. Then it charges. You can outwalk the charge for about a second
          // and a half — the rumble before it is the only warning you get.
          const stalk = this.huntT > 0 ? 2.6 : 4.9;
          this.tallCycle = (this.tallCycle || 0) + dt;
          const ph = this.tallCycle % (1.5 + stalk);
          if (ph < 1.5) {
            sp = D.speed.lunge * 0.8;
            if (!this.chargeCued) { this.chargeCued = true; ctx.emit('monsterSound', this, 'charge'); }
          } else {
            sp = D.speed.hunt * 0.9;
            this.chargeCued = false;
          }
        }
        if (this.lungeT > 0) sp = D.speed.lunge;
        this.move(dt, ctx, sp);
        if (rng.chance(dt * (this.type === 'tall' ? 0.3 : 0.2))) ctx.emit('monsterSound', this, this.type === 'tall' ? 'rumble' : 'growl');
        // attack
        if (prey && preyD < D.attackRange && this.attackCd <= 0) {
          this.attackCd = D.attackCd;
          this.lungeT = 0.32;
          this.stagger = D.recoil;
          ctx.emit('attack', this, prey);
        }
        if (!prey || this.alert < 0.12) { if (this.stateT > 3) { this.setState('search'); this.searchT = 9; } }
        if (lightPush > 0.6) { this.alert = clamp(this.alert - dt * 0.5, 0, 1); }
        break;
      }
      case 'flee': {
        // dawn: run for the rim and dissolve
        const a = Math.atan2(this.z, this.x);
        this.tx = Math.cos(a) * world.half * 1.1; this.tz = Math.sin(a) * world.half * 1.1;
        this.move(dt, ctx, D.speed.flee);
        this.drownT += dt;
        if (Math.hypot(this.x, this.z) > world.half * 1.02 || this.drownT > 9) { this.alive = false; ctx.emit('monsterGone', this); }
        break;
      }
    }

    // pushed out of lamp light
    if (lightPush > 0.12 && D.lightFear > 0) {
      const a = Math.atan2(this.z - lpZ, this.x - lpX);
      this.x += Math.cos(a) * lightPush * dt * 9.5;
      this.z += Math.sin(a) * lightPush * dt * 9.5;
    }

    this.y = damp(this.y, world.heightAt(this.x, this.z), 14, dt);
    this.bodyLean = damp(this.bodyLean, clamp(this.speed / D.speed.hunt, 0, 1.4) * 0.16, 6, dt);
    this.headTilt = Math.sin(this.anim * 0.7) * 0.16;
  }

  move(dt, ctx, wantSpeed) {
    const { world } = ctx;
    if (this.stagger > 0) {          // recovering from a lunge: it cannot move
      this.px = this.x; this.pz = this.z;
      this.speed = damp(this.speed, 0, 14, dt);
      return;
    }
    const dx = this.tx - this.x, dz = this.tz - this.z;
    const d = Math.hypot(dx, dz) || 1;
    let ang = Math.atan2(dx, dz);
    if (this.detour > 0) { this.detour -= dt; ang += this.detourDir; }
    this.yaw = approachAngle(this.yaw, ang, dt * (this.type === 'tall' ? 2.2 : 5.4));
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const sp = wantSpeed * (this.scared > 0 ? 1.25 : 1);
    this.px = this.x; this.pz = this.z;
    this.x += fx * sp * dt;
    this.z += fz * sp * dt;
    const hit = world.collide(this.x, this.z, this.def.radius);
    if (hit) {
      const before = Math.hypot(this.x - this.px, this.z - this.pz);
      this.x = hit.x; this.z = hit.z;
      this.stuck += dt;
      if (this.stuck > 0.55) { this.detour = 0.85; this.detourDir = (ctx.rng.next() < 0.5 ? -1 : 1) * (0.7 + ctx.rng.next() * 0.7); this.stuck = 0; }
      if (before < sp * dt * 0.35 && ctx.rng.chance(dt * 2)) ctx.emit('monsterSound', this, 'bump');
    } else this.stuck = Math.max(0, this.stuck - dt * 0.6);
    const dc = Math.hypot(this.x, this.z);
    if (dc > world.half * 0.99 && this.state !== 'flee') {
      const a = Math.atan2(this.z, this.x);
      this.x = Math.cos(a) * world.half * 0.99; this.z = Math.sin(a) * world.half * 0.99;
      this.tx = 0; this.tz = 0;
    }
    this.speed = damp(this.speed, Math.hypot(this.x - this.px, this.z - this.pz) / Math.max(dt, 1e-4), 10, dt);
  }

  serialize() {
    return {
      i: this.id, t: this.type[0], x: +this.x.toFixed(1), z: +this.z.toFixed(1), y: +this.y.toFixed(1),
      w: +this.yaw.toFixed(2), s: this.state, a: +this.alert.toFixed(2), sp: +this.speed.toFixed(1),
      al: this.alive ? 1 : 0, wl: +this.wailT.toFixed(2),
    };
  }
}

export const STATE_CHARS = { w: 'whisperer', t: 'tall', e: 'weeper' };
