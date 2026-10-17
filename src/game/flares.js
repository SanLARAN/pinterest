// The flare gun. One lies by one of the bodies each night (never the camp's), with two shots. A flare
// climbs on a hiss, pops at the top of its arc and hangs under a little parachute, burning red for a
// quarter of a minute: the forest stands there in its light — monsters and all — and everything in it
// comes to see. Shot into the trees it burns where it falls; into the lake, it drowns.
//
// Every machine flies every flare (the shot is an event: where from, which way) and sees its light;
// only the host's monsters come to it.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { CAP } from '../world/world.js';
import { Collision } from '../world/collision.js';
import { shared } from '../render/sonar.js';
import { clamp, smoothstep } from '../core/rng.js';

const F = CFG.FLARE;
const SLOTS = 2; // flares the world shader lights at once (the brightest ones)
const IGNITE = 0.3; // s after the shot the star catches
const CHUTE_VY = -1.45; // m/s, falling under the parachute
const OUT_FADE = 1.4;

let _tex = null;
function glowTexture() {
  if (_tex) return _tex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.16, 'rgba(255,190,170,0.85)');
  gr.addColorStop(0.45, 'rgba(255,70,40,0.22)');
  gr.addColorStop(1, 'rgba(255,40,20,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  _tex = new THREE.CanvasTexture(c);
  return _tex;
}

const _res = { d: 0, nx: 0, nz: 0 };

export class Flares {
  constructor(game) {
    this.g = game;
    this.list = [];
    this.pool = [];
  }

  get burning() {
    return this.list.some((f) => f.lit && !f.dead);
  }

  clear() {
    for (const f of this.list) this._free(f);
    this.list = [];
    for (let i = 0; i < SLOTS; i++) shared.uFlare.value[i].w = 0;
  }

  _sprites() {
    const s = this.pool.pop();
    if (s) {
      s.core.visible = s.halo.visible = true;
      return s;
    }
    const tex = glowTexture();
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffd0c0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xff3a1c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    core.renderOrder = halo.renderOrder = 7;
    this.g.scene.add(core, halo);
    return { core, halo };
  }

  _free(f) {
    if (f.snd) f.snd.stop(0.2);
    f.snd = null;
    if (f.spr) {
      f.spr.core.visible = f.spr.halo.visible = false;
      this.pool.push(f.spr);
      f.spr = null;
    }
  }

  // a shot: from (x, y, z) along (dx, dy, dz) (normalised). owner = the player who fired it
  launch(x, y, z, dx, dy, dz, owner = null) {
    const n = Math.hypot(dx, dy, dz) || 1;
    dx /= n; dy /= n; dz /= n;
    // a little drift on the wind, the same on every machine (it only depends on the shot)
    const wa = (Math.abs(x * 12.9898 + z * 78.233) % 6.283) + 1;
    const f = {
      x, y, z, vx: dx * F.speed, vy: dy * F.speed, vz: dz * F.speed,
      wx: Math.cos(wa) * 0.55, wz: Math.sin(wa) * 0.55,
      t: 0, lit: false, litAt: 0, phase: 'fly', dead: false, outT: 0, owner,
      I: 0, lureT: 0, sparkT: 0, smokeT: 0, crackT: 0, seed: wa * 10,
      spr: this._sprites(), snd: this.g.audio.flareBurn(x, y, z),
    };
    if (f.snd) f.snd.level(0.22, 0.03); // the motor's hiss
    this.list.push(f);
    return f;
  }

  update(dt) {
    const g = this.g;
    const world = g.world;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.t += dt;
      // ---- flight ----
      if (f.phase === 'fly' || f.phase === 'drop') {
        f.vy -= F.gravity * dt;
        const drag = Math.exp(-0.1 * dt);
        f.vx *= drag; f.vz *= drag;
        if (f.phase === 'fly' && f.lit && f.vy <= 0) this._pop(f);
      } else if (f.phase === 'chute') {
        // hanging under the parachute: it sinks slowly and drifts
        const k = 1 - Math.exp(-1.8 * dt);
        f.vy += (CHUTE_VY - f.vy) * k;
        f.vx += (f.wx - f.vx) * k * 0.6;
        f.vz += (f.wz - f.vz) * k * 0.6;
      }
      if (f.phase !== 'ground') this._move(f, dt, world);
      if (this.list[i] !== f) continue; // drowned

      // ---- burning ----
      if (!f.lit && f.t >= IGNITE) {
        f.lit = true;
        f.litAt = f.t;
        f.lureT = 0;
        if (f.snd) f.snd.level(1, 0.05);
      }
      if (f.lit && !f.dead && f.t - f.litAt >= F.burn) this._out(f);
      if (f.dead) {
        f.outT += dt;
        if (f.outT >= OUT_FADE + 1.5) {
          this._free(f);
          this.list.splice(i, 1);
          continue;
        }
      }
      f.I = this._intensity(f);
      this._fx(f, dt);
      // ---- it calls them (host) ----
      if (f.lit && !f.dead) {
        f.lureT -= dt;
        if (f.lureT <= 0) {
          f.lureT = F.lureEvery;
          this._lure(f);
        }
      }
    }
    this._uniforms();
  }

  _move(f, dt, world) {
    const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt, nz = f.z + f.vz * dt;
    const L = world.lake;
    if (L && Math.hypot(nx - L.x, nz - L.z) < L.r + 1.5 && ny <= L.y + 0.05) return this._drown(f, nx, L.y, nz);
    const gy = world.terrain.height(nx, nz);
    // fired indoors: the cabin roof stops it, and it drops back to the floor
    const cab = this.g.doors && f.vy > 0 ? this.g.doors.indoors(nx, nz) : null;
    if (cab && ny > cab.y + 2.3 && f.y <= cab.y + 2.3) {
      f.vy = -Math.abs(f.vy) * 0.15;
      f.vx *= 0.3; f.vz *= 0.3;
      f.phase = 'drop'; // (no room for a parachute in here)
      this.g.audio.impact(f.x, f.y, f.z, false);
      return;
    }
    if (ny <= gy + 0.12) {
      // it lands where it lands and burns there
      f.x = nx; f.z = nz; f.y = gy + 0.12;
      const sp = Math.hypot(f.vx, f.vy, f.vz);
      if (sp > 9 && !f.bounced) {
        f.bounced = true;
        f.vy = Math.abs(f.vy) * 0.22;
        f.vx *= 0.35; f.vz *= 0.35;
        this.g.particles.burst(f.x, f.y, f.z, 14, { color: [1, 0.5, 0.3], speed: 3.5, up: 2, life: 0.6, size: 0.06, gravity: -9, drag: 1.2 });
        return;
      }
      f.vx = f.vy = f.vz = 0;
      f.phase = 'ground';
      return;
    }
    // trees, rocks, walls: it glances off and keeps falling
    const list = world.col.query(nx, nz, 1.5);
    for (const ci of list) {
      const c = world.col.caps[ci];
      if (c.kind === CAP.WATER || ny - gy > c.h) continue;
      Collision.closest(c, nx, nz, _res);
      if (_res.d < 0.06) {
        const dot = f.vx * _res.nx + f.vz * _res.nz;
        if (dot < 0) {
          f.vx = (f.vx - 2 * dot * _res.nx) * 0.28;
          f.vz = (f.vz - 2 * dot * _res.nz) * 0.28;
        }
        f.x = nx + _res.nx * (0.07 - _res.d);
        f.z = nz + _res.nz * (0.07 - _res.d);
        f.y = ny;
        if (f.phase === 'chute') f.phase = 'drop'; // the chute tangles: it drops
        if (Math.hypot(f.vx, f.vz) > 2) this.g.audio.impact(f.x, f.y, f.z, false);
        return;
      }
    }
    f.x = nx; f.y = ny; f.z = nz;
  }

  // the top of the arc: the star bursts out and the parachute opens
  _pop(f) {
    f.phase = 'chute';
    f.vx *= 0.25; f.vz *= 0.25;
    this.g.audio.flarePop(f.x, f.y, f.z);
    this.g.particles.burst(f.x, f.y, f.z, 30, { color: [1, 0.55, 0.38], speed: 6, life: 0.9, size: 0.07, gravity: -6, drag: 1.6 });
  }

  _out(f) {
    f.dead = true;
    f.outT = 0;
    if (f.snd) f.snd.stop(OUT_FADE);
    f.snd = null;
  }

  _drown(f, x, y, z) {
    const g = this.g;
    g.audio.flareDrown(x, y, z);
    g.particles.burst(x, y + 0.1, z, 24, { color: [0.6, 0.35, 0.3], speed: 2, up: 2.5, life: 1.4, size: 0.12, gravity: 0.8, drag: 1.2 });
    this._free(f);
    this.list.splice(this.list.indexOf(f), 1);
  }

  _intensity(f) {
    if (!f.lit) return 0.1 * clamp(f.t / IGNITE, 0, 1); // only the motor
    const b = f.t - f.litAt;
    let I = F.light;
    if (b < 0.2) I *= (b / 0.2) * 1.45; // it catches with a flash
    else if (b < 0.8) I *= 1.45 - ((b - 0.2) / 0.6) * 0.45;
    // magnesium never burns evenly
    I *= 0.9 + 0.07 * Math.sin(b * 29 + f.seed) + 0.05 * Math.sin(b * 13.7 + f.seed * 2) + (Math.random() - 0.5) * 0.07;
    const left = F.burn - b;
    if (left < 2.5) I *= Math.max(0, left / 2.5) * (Math.random() < 0.22 ? 0.45 : 1); // it gutters
    if (f.dead) I *= Math.max(0, 1 - f.outT / OUT_FADE) * (Math.random() < 0.3 ? 0.3 : 1);
    if (f.phase === 'ground') I *= 0.82; // down among the trunks, some of it is swallowed
    return Math.max(0, I);
  }

  _fx(f, dt) {
    const g = this.g;
    const I = f.I;
    const s = f.spr;
    if (s) {
      s.core.position.set(f.x, f.y, f.z);
      s.halo.position.set(f.x, f.y, f.z);
      s.core.scale.setScalar(0.7 + I * 0.9);
      s.halo.scale.setScalar(6 + I * 11);
      s.core.material.opacity = Math.min(1, I * 0.9 + (f.dead ? 0 : 0.12));
      s.halo.material.opacity = Math.min(0.55, I * 0.33);
    }
    if (f.snd) f.snd.setPos(f.x, f.y, f.z);
    if (f.dead) {
      // a last thread of smoke
      f.smokeT -= dt;
      if (f.smokeT <= 0 && f.outT < OUT_FADE + 0.8) {
        f.smokeT = 0.12;
        g.particles.burst(f.x, f.y, f.z, 1, { color: [0.12, 0.05, 0.04], speed: 0.3, life: 2.2, size: 0.5, gravity: 0.7, drag: 0.6 });
      }
      return;
    }
    if (!f.lit) {
      g.particles.burst(f.x, f.y, f.z, 1, { color: [1, 0.6, 0.4], speed: 0.4, life: 0.35, size: 0.06, gravity: 0, drag: 2 });
      return;
    }
    // sparks dripping off it; lit smoke curling up
    f.sparkT -= dt;
    while (f.sparkT <= 0) {
      f.sparkT += f.phase === 'fly' ? 0.012 : 0.035;
      g.particles.burst(f.x, f.y - 0.05, f.z, 1, { color: [1, 0.62, 0.4], speed: f.phase === 'fly' ? 0.8 : 1.6, life: f.phase === 'fly' ? 0.45 : 0.9, size: 0.06, gravity: -6, drag: 0.8 });
    }
    f.smokeT -= dt;
    if (f.smokeT <= 0) {
      f.smokeT = 0.09;
      g.particles.burst(f.x, f.y + 0.1, f.z, 1, { color: [0.3 * I, 0.08 * I, 0.05 * I], speed: 0.35, life: 2.8, size: 0.7, gravity: 0.9, drag: 0.5 });
    }
    f.crackT -= dt;
    if (f.crackT <= 0 && f.snd) {
      f.crackT = 0.04 + Math.random() * 0.25;
      f.snd.crackle();
    }
  }

  // every monster near enough comes to the light (not the Watcher: light is the one thing it hates)
  _lure(f) {
    const g = this.g;
    if (!g.auth || g.state !== 'play') return;
    for (const m of g.monsters) {
      if (m.type === 'watcher' || !m.alive || m.scripted) continue;
      if (m.state === 'hunt' || m.state === 'feed' || m.state === 'flee' || m.state === 'inhale' || m.state === 'howl') continue;
      const d = Math.hypot(m.x - f.x, m.z - f.z);
      if (d > F.lure) continue;
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 4;
      const fresh = m.investigate(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      m.rushT = 4;
      if (fresh) g.onMonsterInvestigate(m, d, 'flare');
    }
  }

  // the brightest two light the world shader
  _uniforms() {
    const U = shared.uFlare.value;
    let a = null, b = null;
    for (const f of this.list) {
      if (f.I <= 0.001) continue;
      if (!a || f.I > a.I) { b = a; a = f; } else if (!b || f.I > b.I) b = f;
    }
    const set = (i, f) => (f ? U[i].set(f.x, f.y, f.z, f.I) : U[i].set(0, -100, 0, 0));
    set(0, a);
    set(1, b);
  }

  // how much flare light falls on (x, y, z), 0..1 — the same falloff as the shader
  lightAt(x, y, z) {
    let best = 0;
    const R = F.radius;
    for (let i = 0; i < SLOTS; i++) {
      const L = shared.uFlare.value[i];
      if (L.w <= 0.001) continue;
      const d = Math.hypot(L.x - x, L.y - y, L.z - z);
      if (d > R) continue;
      const fall = 1 - smoothstep(R * 0.12, R, d);
      best = Math.max(best, fall * Math.min(1, L.w / F.light));
    }
    return best;
  }
}
