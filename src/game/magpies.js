// Сороки — the magpies (3.1c). They do not hunt and they do not hurt: they tell.
//
// A few flocks sit in the dead trees of the forest each night, four to seven birds on the branches. Walk past
// and they keep still (now and then a dry «чак-чак» if you are near enough to hear it — that is how you know
// they are there). Run under them, walk right up to the trunk, or make a loud noise beside the tree, and the
// whole flock goes up at once, rattling: a sound worth a raised voice to every monster within ~50 m, and it
// counts as yours (close enough, and a monster comes for whoever spooked them). The rattle also lights the tree
// up like a stone does, for everyone. A minute and a half later they are back on their branches.
//
// So the forest has places where you slow down — and a stone thrown into a flock is an alarm you set off
// somewhere else on purpose.
//
// Host-authoritative in co-op: only the host decides a flock went up (from everyone's positions, run and crouch
// flags it already has), and says so ('mp'); every machine plays the flight, the rattle and the echo. The
// flocks themselves are the same everywhere: chosen from the world's dead trees by the night's own seed.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { RNG } from '../core/rng.js';
import { t } from '../core/i18n.js';

export const MAGPIE = {
  flocks: 10,
  trailR: 12, // m: most flocks sit by the paths people actually walk
  birds: [4, 7],
  spook: 7.5, // m: a runner passing this near the trunk
  spookWalk: 2.4, // m: anyone (but a crouching one) walking right up to it
  noiseR: 14, // m: a loud sound this near the tree...
  noiseMin: 0.45, // ...and at least this loud (a stone landing is 0.46)
  loud: 0.75, // what the take-off is worth to the monsters: hearRadius(0.75) ≈ 52 m
  away: [70, 110], // s before a flock is back on its tree
  backClear: 22, // m: and nobody standing this near when it lands again
  flight: 4.5, // s the birds are seen leaving
  spread: 45, // m between flocks
  keepOff: 32, // m from where the night starts (the camp)
  chatter: [6, 14], // s between quiet calls while perched
  hearChatter: 26, // m: and you hear them within this
  alertR: 34, // m: the warning line shows for players this near a take-off
  echo: { radius: 20, strength: 0.85, decay: 0.6 },
};
const ECHO_COLOR = [0.92, 0.9, 0.82];

// pick tonight's trees: spread out, away from where everyone starts. Pure (rng in, trees out) so every machine
// that has the same world and the same seed sits the same birds on the same branches.
export function pickPerches(perches, rng, { n = MAGPIE.flocks, spread = MAGPIE.spread, avoid = [], keepOff = MAGPIE.keepOff, prefer = null } = {}) {
  const all = (perches || []).filter((p) => p && p.spots && p.spots.length >= 2);
  const near = prefer ? all.filter(prefer) : all;
  const pool = near.length >= n * 2 ? near : all; // (by the trails if there are enough trees there)
  const out = [];
  for (let tries = 0; tries < pool.length * 3 && out.length < n; tries++) {
    const p = pool[Math.floor(rng.next() * pool.length)];
    if (out.includes(p)) continue;
    if (out.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < spread)) continue;
    if (avoid.some((a) => Math.hypot(a.x - p.x, a.z - p.z) < keepOff)) continue;
    out.push(p);
  }
  return out;
}

// who (if anyone) sends this flock up: a runner under it, or anyone standing at the trunk. Crouching never does.
export function spooker(flock, players) {
  for (const p of players) {
    if (!p || !p.alive || p.crouching) continue;
    const d = Math.hypot(p.x - flock.x, p.z - flock.z);
    if (d < MAGPIE.spookWalk) return p;
    if (p.sprinting && (p.speed == null || p.speed > 2.5) && d < MAGPIE.spook) return p;
  }
  return null;
}

// one bird, ~0.5 m nose to tail: a dark body, a long tail, the white of the shoulder — specks in an echo,
// a magpie in the lamp light
function buildBird() {
  const b = new MeshBuilder(128);
  b.place(0, 0.11, 0, 0, 0, 0, 1, 1, 1.6);
  b.octa(0.1, 0.07, KIND.BARK); // body, 0.32 m long
  b.place(0, 0.17, 0.17);
  b.octa(0.06, 0.055, KIND.BARK); // head
  b.place(0, 0.175, 0.245, 0, 0, 0, 0.35, 0.35, 1.3);
  b.octa(0.04, 0.03, KIND.METAL); // beak
  b.place(0, 0.12, -0.27, -0.25, 0, 0);
  b.box(0.05, 0.018, 0.3, KIND.BARK); // tail
  for (const s of [-1, 1]) {
    b.place(s * 0.08, 0.13, 0.01, 0, 0, s * 0.3, 0.6, 1, 1.2);
    b.octa(0.07, 0.04, KIND.BONE); // the white shoulder
  }
  return b.toGeometry();
}
let BIRD_GEO = null;
const birdGeometry = () => (BIRD_GEO ||= buildBird());

class Flock {
  constructor(game, i, perch, rng) {
    this.g = game;
    this.i = i;
    this.x = perch.x;
    this.z = perch.z;
    this.top = perch.spots.reduce((a, s) => Math.max(a, s[1]), -1e9); // world y of the highest bird
    this.state = 'perched'; // perched | flying | away
    this.t = 0;
    this.awayFor = MAGPIE.away[0] + ((i * 17) % (MAGPIE.away[1] - MAGPIE.away[0])); // same on every machine
    this.chatterT = rng.float(...MAGPIE.chatter);
    this.birds = [];
    const n = rng.int(MAGPIE.birds[0], MAGPIE.birds[1]);
    for (let k = 0; k < n; k++) {
      const s = perch.spots[k % perch.spots.length];
      const jit = Math.floor(k / perch.spots.length) * 0.22;
      const m = new THREE.Mesh(birdGeometry(), game.world.material);
      m.frustumCulled = false;
      const home = new THREE.Vector3(s[0] + jit, s[1] + 0.02, s[2] - jit);
      const yaw = rng.float(0, Math.PI * 2);
      this.birds.push({ m, home, yaw, v: new THREE.Vector3(), flap: rng.float(0, 6), delay: rng.float(0, 0.35) });
      game.scene.add(m);
    }
    this.land();
  }

  land() {
    this.state = 'perched';
    this.t = 0;
    for (const b of this.birds) {
      b.m.visible = true;
      b.m.position.copy(b.home);
      b.m.rotation.set(0, b.yaw, 0);
    }
  }

  // up they go, away from whoever did it (dir: radians, or NaN for «any way»)
  fly(dir) {
    if (this.state !== 'perched') return false;
    this.state = 'flying';
    this.t = 0;
    let k = 0;
    for (const b of this.birds) {
      const a = Number.isFinite(dir) ? dir + (((k++ * 0.618) % 1) - 0.5) * 1.6 : (k++ / this.birds.length) * Math.PI * 2;
      const sp = 4 + ((k * 0.37) % 1) * 3;
      b.v.set(Math.sin(a) * sp, 2.6 + ((k * 0.53) % 1) * 2, Math.cos(a) * sp);
    }
    return true;
  }

  step(dt) {
    this.t += dt;
    if (this.state === 'flying') {
      for (const b of this.birds) {
        if (this.t < b.delay) continue;
        const m = b.m;
        m.position.addScaledVector(b.v, dt);
        b.v.y += 1.2 * dt; // climbing away over the trees
        m.rotation.set(-0.35, Math.atan2(b.v.x, b.v.z), Math.sin((this.t + b.flap) * 28) * 0.55);
      }
      if (this.t > MAGPIE.flight) {
        for (const b of this.birds) b.m.visible = false;
        this.state = 'away';
        this.t = 0;
      }
    } else if (this.state === 'away' && this.t > this.awayFor) {
      // they come back only when nobody is standing under the tree to see them do it
      const near = this.g.livePlayers().some((p) => p.alive && Math.hypot(p.x - this.x, p.z - this.z) < MAGPIE.backClear);
      if (!near) this.land();
    }
  }

  dispose() {
    for (const b of this.birds) this.g.scene.remove(b.m);
  }
}

export class Magpies {
  constructor(game) {
    this.g = game;
    this.list = [];
    this.hinted = false;
  }

  get active() {
    return this.g.map === 'forest' && this.g.state === 'play';
  }

  reset() {
    for (const f of this.list) f.dispose();
    this.list = [];
  }

  // a new night: tonight's trees, from the world and the night's seed (the same on every machine)
  startNight(day = this.g.day, seed = this.g.baseSeed) {
    this.reset();
    if (this.g.map !== 'forest') return;
    const rng = new RNG(((seed | 0) ^ Math.imul((day | 0) + 1, 0x9e3779b1) ^ 0x6d616770) >>> 0);
    const start = this.g.world.spawn || { x: 0, z: 0 };
    const tr = this.g.world.trails;
    const trees = pickPerches(this.g.world.perches, rng, { avoid: [start], prefer: tr?.near ? (p) => tr.near(p.x, p.z, MAGPIE.trailR) : null });
    this.list = trees.map((p, i) => new Flock(this.g, i, p, rng));
  }

  // a sound from the game's funnel (host side): a loud one right by the tree sends them up too
  hear(x, z, loud, source, pid = null) {
    if (!this.active || source === 'magpie' || !(loud >= MAGPIE.noiseMin)) return;
    for (const f of this.list) {
      if (f.state !== 'perched' || Math.hypot(f.x - x, f.z - z) > MAGPIE.noiseR) continue;
      this.takeoff(f.i, pid, Math.atan2(f.x - x, f.z - z));
    }
  }

  // the flock goes up. On the host: tell everyone and let the monsters hear it; everywhere: the flight, the
  // rattle and the echo.
  takeoff(i, pid = null, dir = NaN, host = true) {
    const g = this.g;
    const f = this.list[i];
    if (!f || !f.fly(dir)) return false;
    const y = Math.max(g.world.terrain.height(f.x, f.z) + 3, f.top);
    if (host && g.auth) {
      if (g.sync) g.sync.ev('mp', i, Number.isFinite(dir) ? Math.round(dir * 100) / 100 : null, pid);
      g.noise(f.x, f.z, MAGPIE.loud, 'magpie', false, pid);
    }
    if (g.audio?.ready && g.audio.magpieFlight) g.audio.magpieFlight(f.x, y, f.z);
    const s = g.pulses?.emit(f.x, y, f.z, g.time, { ...MAGPIE.echo, color: ECHO_COLOR, kind: 'magpie' });
    if (s && g.echoTicks) g.echoTicks(s, 0.3);
    g.radar?.blip?.(f.x, f.z, 'stone');
    const me = g.player;
    if (me && Math.hypot(me.x - f.x, me.z - f.z) < MAGPIE.alertR) {
      g.hud?.flashAlert(t(this.hinted ? 'aMagpiesShort' : 'aMagpies'), 'warn', this.hinted ? 1.6 : 2.6);
      this.hinted = true;
    }
    return true;
  }

  // a guest hears the host's word
  netTakeoff(i, dir, pid) {
    return this.takeoff(i | 0, typeof pid === 'string' ? pid : null, dir == null ? NaN : +dir, false);
  }

  update(dt) {
    const g = this.g;
    if (g.map !== 'forest' || !this.list.length) return;
    const play = g.state === 'play';
    const me = g.player;
    for (const f of this.list) {
      f.step(dt);
      if (!play || f.state !== 'perched') continue;
      // the host watches everyone; a guest only ever waits for the host's word
      if (g.auth) {
        const p = spooker(f, g.livePlayers());
        if (p) { this.takeoff(f.i, p.id ?? null, Math.atan2(f.x - p.x, f.z - p.z)); continue; }
      }
      // perched: now and then a quiet call, for whoever is near enough to hear it
      f.chatterT -= dt;
      if (f.chatterT <= 0) {
        f.chatterT = MAGPIE.chatter[0] + Math.random() * (MAGPIE.chatter[1] - MAGPIE.chatter[0]);
        if (me && Math.hypot(me.x - f.x, me.z - f.z) < MAGPIE.hearChatter && g.audio?.ready && g.audio.magpieChatter) {
          g.audio.magpieChatter(f.x, f.top, f.z, 0.22);
        }
      }
    }
  }
}
