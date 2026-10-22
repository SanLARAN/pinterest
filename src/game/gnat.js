// The Гнус (the gnat swarm) — 3.0e. It does not kill you and it does not chase you: it eats your echo.
//
// A swarm is a cloud of midges the size of a room. It has no interest in you, only in the loudest thing on the
// участок: anything worth 0.4 or more within 80 m and it starts across the bog at 3.6 m/s — faster than your
// walk, slower than your run: you can leave it behind, at the price of running. Being inside it for three seconds blinds you for twenty: every echo takes
// twice as long to come back, which on the bog, where the water already shortens every wave, means ten metres
// of sight and no way to tell a stake from a man.
//
// Two things turn it: smoke. A lit fire or a burning flare inside eight metres and the swarm breaks off for
// eight seconds. That is the whole counterplay, and it is what the campfire is for.
//
// It is host-authoritative in co-op (the host's swarm picks targets and announces who it blinded, 'gb'),
// because a blind that each machine decided for itself would disagree with itself.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { clamp } from '../core/rng.js';
import { t } from '../core/i18n.js';

export const GNAT = {
  speed: 3.6, // m/s: faster than your 3.1 walk, slower than your 5.7 run
  drift: 0.55, // and how it wanders when it has nothing to go to
  r: 6, // the cloud's radius: inside this you are in it
  loudMin: 0.4, // what it needs to hear: a raised voice, a run, an engine, a scream
  hearR: 80,
  blindT: 3, // seconds inside the cloud
  blindFor: 20, // seconds of doubled echo cooldown
  blindMul: 2,
  repelR: 8, // smoke within this and it turns
  repelT: 8,
  maxSwarms: 4,
  gap: [70, 130], // s between swarms, per night
  firstAt: [55, 90],
  keepR: 120, // it will not cross the whole участок for a sound
};

// a swarm's body: 26 small dark flakes, so in an echo it reads as a cloud of specks, not a blob
function buildSwarm() {
  const b = new MeshBuilder(512);
  const rnd = (() => { let s = 12345; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })();
  b.identity();
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = 0.4 + rnd() * 2.2, y = 0.5 + rnd() * 2.4;
    b.place(Math.cos(a) * d, y, Math.sin(a) * d, rnd() * 3, rnd() * 3, rnd() * 3, 0.16 + rnd() * 0.14);
    b.octa(0.5, 1.0, KIND.BARK);
  }
  return b.toGeometry();
}

let SWARM_GEO = null;
const swarmGeometry = () => (SWARM_GEO ||= buildSwarm());

class Swarm {
  constructor(game, x, z) {
    this.g = game;
    this.x = x;
    this.z = z;
    this.hx = x; // home: where it drifts back to
    this.hz = z;
    this.tx = x;
    this.tz = z;
    this.mode = 'drift'; // drift | fly | feed
    this.t = 0;
    this.phase = Math.random() * 6.28;
    this.blind = new Map(); // pid -> seconds spent inside the cloud
    this.repelT = 0;
    this.lost = 0; // how long it has been without a sound
    this.mesh = new THREE.Mesh(swarmGeometry(), game.world.material);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.position.set(x, game.world.terrain.height(x, z) + 1.6, z);
    game.scene.add(this.mesh);
  }

  dispose() {
    this.g.scene.remove(this.mesh);
  }
}

export class Gnats {
  constructor(game) {
    this.g = game;
    this.reset();
  }

  reset() {
    for (const s of this.list || []) s.dispose();
    this.list = [];
    this.nextT = 0;
    this.spawned = 0;
    this.hinted = {};
    this.lt = 0;
  }

  get onBog() {
    return this.g.map === 'bog';
  }

  // the night's first swarm comes when the shift has had time to teach you the water
  startNight() {
    this.reset();
    if (!this.onBog) return;
    const [a, b] = GNAT.firstAt;
    this.nextT = this.g.rng.float(a, b);
  }

  // a sound, from the game's own funnel (every source: voices, steps, engines, screams)
  hear(x, z, loud, source) {
    if (!this.onBog || this.g.state !== 'play') return;
    if (!(loud >= GNAT.loudMin)) return;
    if (source === 'step' && loud < GNAT.loudMin) return;
    let best = null, bd = 1e9;
    for (const s of this.list) {
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < bd) { bd = d; best = s; }
    }
    if (best && bd < GNAT.hearR) {
      best.tx = x;
      best.tz = z;
      best.mode = 'fly';
      best.lost = 0;
    }
  }

  // ---- fire and flares: the one thing it will not fly into ----
  smokeAt(x, z) {
    const g = this.g;
    const f = g.fire;
    if (f && f.lit > 0.05 && Math.hypot(f.x - x, f.z - z) < GNAT.repelR) return true;
    for (const fl of g.flares?.list || []) {
      if (!fl.lit || fl.dead) continue;
      if (Math.hypot(fl.x - x, fl.z - z) < GNAT.repelR) return true;
    }
    return false;
  }

  _spawn() {
    const g = this.g;
    const core = g.player;
    for (let i = 0; i < 30; i++) {
      const a = g.rng.float(0, Math.PI * 2), d = g.rng.float(35, 80);
      const x = core.x + Math.cos(a) * d, z = core.z + Math.sin(a) * d;
      if (Math.abs(x) > g.world.wall - 8 || Math.abs(z) > g.world.wall - 8) continue;
      if (this.smokeAt(x, z)) continue;
      const s = new Swarm(g, x, z);
      this.list.push(s);
      this.spawned++;
      if (!this.hinted.first) {
        this.hinted.first = true;
        g.hud && g.hud.flashAlert(t('aGnats'), 'warn', 2.4);
      }
      return s;
    }
    return null;
  }

  update(dt) {
    const g = this.g;
    if (!this.onBog || g.state !== 'play') return;
    this.lt += dt;
    this.nextT -= dt;
    if (this.nextT <= 0 && this.list.length < GNAT.maxSwarms && this.spawned < GNAT.maxSwarms) {
      this._spawn();
      this.nextT = g.rng.float(GNAT.gap[0], GNAT.gap[1]);
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const s = this.list[i];
      this._step(s, dt);
      if (!Number.isFinite(s.x + s.z)) { s.dispose(); this.list.splice(i, 1); }
    }
  }

  _step(s, dt) {
    const g = this.g, w = g.world;
    s.t += dt;
    s.repelT = Math.max(0, s.repelT - dt);

    // smoke first: it will not be in it, and it leaves
    if (this.smokeAt(s.x, s.z)) s.repelT = GNAT.repelT;
    if (s.repelT > 0) {
      let ax = 0, az = 0, n = 0;
      const f = g.fire;
      if (f && f.lit > 0.05) { ax += s.x - f.x; az += s.z - f.z; n++; }
      for (const fl of g.flares?.list || []) {
        if (!fl.lit || fl.dead) continue;
        ax += s.x - fl.x; az += s.z - fl.z; n++;
      }
      const len = Math.hypot(ax, az) || 1;
      s.mode = 'drift';
      s.x += (ax / len) * GNAT.speed * 0.9 * dt;
      s.z += (az / len) * GNAT.speed * 0.9 * dt;
    } else if (s.mode === 'fly') {
      const dx = s.tx - s.x, dz = s.tz - s.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.5) {
        s.mode = 'feed';
        s.lost = 0;
      } else {
        s.x += (dx / d) * GNAT.speed * dt;
        s.z += (dz / d) * GNAT.speed * dt;
      }
    } else if (s.mode === 'feed') {
      s.lost += dt;
      if (s.lost > 4) { s.mode = 'drift'; s.lost = 0; }
    } else {
      // drifting: a slow wander around its home, so it can be met without being asked for
      const a = s.t * 0.25 + s.phase;
      const tx = s.hx + Math.cos(a) * 14, tz = s.hz + Math.sin(a * 1.3) * 14;
      const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz) || 1;
      s.x += (dx / d) * GNAT.drift * dt;
      s.z += (dz / d) * GNAT.drift * dt;
    }

    // the участок's edge and its walls: a cloud of midges goes round a tree, but it does not leave
    const wall = w.wall - 8;
    s.x = clamp(s.x, -wall, wall);
    s.z = clamp(s.z, -wall, wall);
    const gy = w.terrain.height(s.x, s.z);
    s.mesh.position.set(s.x, gy + 1.5 + Math.sin(s.t * 1.7) * 0.25, s.z);
    s.mesh.rotation.y = s.t * 0.4;

    // ---- inside the cloud ----
    for (const p of g.livePlayers()) {
      if (!p.alive) continue;
      const inside = Math.hypot(p.x - s.x, p.z - s.z) < GNAT.r;
      const had = s.blind.get(p.id) || 0;
      if (!inside) {
        if (had > 0) s.blind.set(p.id, Math.max(0, had - dt * 1.5)); // it loses you if you walk out
        continue;
      }
      const now = had + dt;
      s.blind.set(p.id, now);
      if (now < GNAT.blindT) continue;
      s.blind.set(p.id, 0);
      this.blind(p.id, p);
    }
  }

  // blinded: for twenty seconds every echo takes twice as long to come back
  blind(pid, p = null) {
    const g = this.g;
    if (g.auth || g.role !== 'client') {
      if (g.sync) g.sync.ev('gb', pid, GNAT.blindFor);
    }
    this.apply(pid, GNAT.blindFor);
    if (pid === g.player.id) {
      g.addTrauma && g.addTrauma(0.18);
      g.hud && g.hud.flashAlert(t('aGnatBlind'), 'danger', 2.2);
      g.audio && g.audio.gnatSwarm && g.audio.gnatSwarm();
    }
  }

  // the effect lands on whoever it named, on whichever machine they are on
  apply(pid, seconds = GNAT.blindFor) {
    const g = this.g;
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    if (pid === g.player.id) {
      g.echoMul = GNAT.blindMul;
      g.echoMulT = Math.max(g.echoMulT || 0, seconds);
    } else {
      const r = g.remotes?.get(pid);
      if (r) { r.echoMulT = Math.max(r.echoMulT || 0, seconds); r.echoMul = GNAT.blindMul; }
    }
  }

  // a swarm is near enough to be heard: the hum of it, for the ears
  nearest(x, z) {
    let best = null, bd = 1e9;
    for (const s of this.list) {
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { swarm: best, d: bd } : null;
  }
}
