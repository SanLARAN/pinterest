// The night's goal: five dead generators. The people who tried before you are still out there —
// what's left of them carries the part each generator needs, and a note about where the next one is.
//
//   camp body → fuel → camp generator → (beacon) → body at site 2 → part → generator 2 → …
//
// A running generator lights a warm pool around its lamp: monsters standing in it can be seen, and
// the Watcher won't step into it. Its radio beeps until it runs, so you can find it by ear.
//
// Co-op: every player works on the objectives on their own machine and shares the state. Nothing here
// ever goes backwards (a part found stays found, progress only grows, a running engine keeps running),
// so merging is simply "furthest wins" — no host round-trip, and two people on one engine can't conflict.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { shared, shadowLights, LAMP_SLOTS } from '../render/sonar.js';
import { RNG, clamp, smoothstep, damp } from '../core/rng.js';
import { t } from '../core/i18n.js';

const USE_R_BODY = 2.1;
const USE_R_GEN = 2.4;
const SEARCH_TIME = 1.1;
const LAMP_I = 1.15;
const NOTE_SECONDS = 11;
const PH = ['dead', 'work', 'cord', 'spin', 'running'];
const ESC_KINDS = new Set(['part', 'carNote', 'carDoor', 'carFit', 'carSeat']); // see Escape.consider
const CAB_KINDS = new Set(['cabinet', 'cabinetItem', 'trapGrab', 'trapSelf']); // see Cabinets.consider

const _m = new THREE.Matrix4();
const _l = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export function placer(b, x, y, z, yaw) {
  _e.set(0, yaw, 0, 'YXZ');
  const base = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(_e), new THREE.Vector3(1, 1, 1));
  return (lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
    _e.set(rx, ry, rz, 'YXZ');
    _q.setFromEuler(_e);
    _l.compose(_p.set(lx, ly, lz), _q, _s.set(sx, sy, sz));
    _m.multiplyMatrices(base, _l);
    b.setMatrix(_m);
  };
}

// the body: on its front, one arm reaching for the generator it never got to. P = placer, r = RNG.
// returns how far the arm reaches (the tool bag lies by that hand). Shared with the atlas portraits.
export function buildCorpse(b, P, r) {
  P(0.15, 0.012, 0.15, 0, r.float(0, 6), 0, 1, 1, 1.3);
  b.cylinder(7, 0.85, 0.8, 0.012, KIND.FLESH, { ringEdges: false }); // what soaked into the ground
  const tilt = r.float(-0.35, 0.35);
  P(0, 0.13, 0, 0, 0, tilt);
  b.box(0.44, 0.21, 0.64, KIND.WOOD); // jacket
  P(0, 0.2, -0.05, 0, 0, tilt);
  b.box(0.3, 0.04, 0.4, KIND.BONE); // the note, pinned to the back where you can't miss it
  P(r.float(-0.06, 0.06), 0.12, 0.46, r.float(-0.3, 0.3), r.float(-0.8, 0.8), 0);
  b.rock(0.12, () => r.next(), KIND.FLESH, 0.18, 0.95);
  P(0, 0, 0);
  const reach = r.float(0.75, 0.95);
  b.limb([0.21, 0.13, 0.26], [0.32, 0.07, 0.26 + reach * 0.5], 0.05, 0.04, KIND.WOOD, 4);
  b.limb([0.32, 0.07, 0.26 + reach * 0.5], [0.3, 0.05, 0.26 + reach], 0.04, 0.03, KIND.FLESH, 4);
  const bend = r.float(-0.4, 0.2);
  b.limb([-0.21, 0.13, 0.24], [-0.48, 0.07, 0.02 + bend], 0.05, 0.04, KIND.WOOD, 4);
  b.limb([-0.48, 0.07, 0.02 + bend], [-0.4, 0.05, -0.32 + bend], 0.04, 0.03, KIND.FLESH, 4);
  const kick = r.float(-0.25, 0.25);
  b.limb([0.1, 0.11, -0.3], [0.17 + kick, 0.09, -0.78], 0.065, 0.05, KIND.WOOD, 4);
  b.limb([0.17 + kick, 0.09, -0.78], [0.2 + kick * 1.5, 0.07, -1.18], 0.05, 0.04, KIND.WOOD, 4);
  b.limb([-0.1, 0.11, -0.3], [-0.24, 0.09, -0.75], 0.065, 0.05, KIND.WOOD, 4);
  b.limb([-0.24, 0.09, -0.75], [-0.18, 0.07, -1.16], 0.05, 0.04, KIND.WOOD, 4);
  // a dead flashlight
  P(-0.75, 0.04, 0.45, Math.PI / 2, r.float(0, 6), 0);
  b.cylinder(6, 0.03, 0.04, 0.24, KIND.METAL);
  return reach;
}

// every body has a tool bag by its hand; which part is in it changes from night to night
export function buildToolBag(b, P, i, hx, hz) {
  const A = KIND.SHARD;
  P(hx, 0, hz, 0, 0.4 + i, 0);
  b.box(0.3, 0.3, 0.16, A, { bottom: true }); // a canvas tool bag
  P(hx, 0.3, hz, 0, 0.4 + i, 0);
  b.limb([-0.1, 0, 0], [0, 0.12, 0], 0.012, 0.012, A, 3);
  b.limb([0, 0.12, 0], [0.1, 0, 0], 0.012, 0.012, A, 3);
}

// the flare gun someone brought and never fired: a fat-barrelled pistol lying on its side, and its two
// cartridges. M = matrix of the spot on the ground (x along the barrel); shared with the atlas plate
export function buildFlareGun(b, M) {
  const A = KIND.SHARD, Mt = KIND.METAL;
  const G = new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeRotationX(Math.PI / 2)); // on its side
  G.multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.035));
  const at = (m, ox, oy, oz, rx = 0, ry = 0, rz = 0) => {
    _e.set(rx, ry, rz, 'YXZ');
    _l.compose(_p.set(ox, oy, oz), _q.setFromEuler(_e), _s.set(1, 1, 1));
    _m.multiplyMatrices(m, _l);
    b.setMatrix(_m);
  };
  at(G, 0.02, 0, 0, 0, 0, -Math.PI / 2);
  b.cylinder(8, 0.03, 0.03, 0.2, A); // 26 mm: more drainpipe than gun barrel
  at(G, 0.2, 0, 0, 0, 0, -Math.PI / 2);
  b.cylinder(8, 0.035, 0.035, 0.026, Mt);
  at(G, -0.012, -0.004, 0);
  b.box(0.075, 0.072, 0.052, A); // the breech
  at(G, -0.042, -0.08, 0, 0, 0, 0.32);
  b.box(0.048, 0.125, 0.042, A); // the grip
  at(G, -0.05, 0.036, 0, 0, 0, 0.5);
  b.box(0.016, 0.032, 0.014, Mt); // hammer
  at(G, 0, 0, 0);
  b.limb([0.042, -0.034, 0], [0.036, -0.078, 0], 0.006, 0.006, Mt, 3); // trigger guard
  b.limb([0.036, -0.078, 0], [-0.006, -0.084, 0], 0.006, 0.006, Mt, 3);
  // two cartridges: red paper, brass rims
  for (const [ox, oz, yaw] of [[0.06, 0.15, 0.4], [0.17, 0.12, -0.7]]) {
    const C = new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(ox, 0.03, oz));
    C.multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    at(C, 0, -0.05, 0);
    b.cylinder(7, 0.028, 0.028, 0.09, KIND.FLESH);
    at(C, 0, 0.04, 0);
    b.cylinder(7, 0.033, 0.033, 0.012, Mt);
  }
}

let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(255,220,170,0.75)');
  gr.addColorStop(0.5, 'rgba(255,170,90,0.18)');
  gr.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

function shuffle(rng, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Objectives {
  constructor(game) {
    this.g = game;
    const world = game.world;
    this.sites = world.sites;
    const b = new MeshBuilder(4096);
    this.bodies = this.sites.map((site, i) => this._buildBody(b, world, site, i));
    this.glows = this.sites.map((site) => this._buildGlow(game.scene, site));
    this.gens = [];
    this.chain = [];
    this.target = null;
    this.note = null;
    this.dirty = false;
  }

  // ---------------- co-op ----------------
  netState() {
    return {
      g: this.gens.map((g) => [PH.indexOf(g.phase), Math.round(g.progress * 1000) / 1000, g.pulls, Math.round(g.spinT * 100) / 100, (g.hasPart ? 1 : 0) | (g.known ? 2 : 0) | (g.running ? 4 : 0)]),
      b: this.bodies.reduce((m, b, i) => m | (b.searched ? 1 << i : 0), 0),
    };
  }

  // someone else's view of the objectives: take whatever is further along
  netMerge(s, by = null) {
    if (!s || !Array.isArray(s.g)) return;
    for (let k = 0; k < this.gens.length; k++) {
      const g = this.gens[k], r = s.g[k];
      if (!Array.isArray(r)) continue;
      const ph = PH[r[0]] || 'dead';
      const fl = r[4] | 0;
      if (fl & 1) g.hasPart = true;
      if (fl & 2 && !g.known) {
        g.known = true;
        g.beaconT = 3.5;
      }
      if (+r[1] > g.progress) g.progress = Math.min(1, +r[1]);
      if ((r[2] | 0) > g.pulls) g.pulls = r[2] | 0;
      const want = PH.indexOf(ph), have = PH.indexOf(g.phase);
      if (want > have) {
        if (ph === 'running') this._start(g, by || true);
        else {
          g.phase = ph;
          if (ph === 'cord') {
            g.pullCD = 0;
            g.pullQueued = false;
          }
          if (ph === 'spin') {
            g.spinT = Math.max(g.spinT, +r[3] || 0);
            g.spinNoiseT = 0.6;
            this.g.onSpinUp(g);
          }
        }
      } else if (ph === 'spin' && g.phase === 'spin') g.spinT = Math.max(g.spinT, +r[3] || 0);
    }
    const mask = s.b | 0;
    this.bodies.forEach((body, i) => {
      if (mask & (1 << i) && !body.searched) {
        body.searched = true;
        body.item.visible = false;
        if (body.gun) body.gun.visible = false;
        if (this.target && this.target.obj === body) this.searchT = 0;
      }
    });
  }

  // a teammate's repair noises: you hear them working
  remoteFx(kind, k, extra) {
    const g = this.gens[k];
    if (!g) return;
    const a = this.g.audio;
    if (kind === 'clank') a.clank(g.x, g.y + 0.6, g.z, extra ? 1 : 0.55);
    else if (kind === 'glug') a.glug(g.x, g.y + 0.9, g.z);
    else if (kind === 'spark') this.g.onSpark(g, true);
    else if (kind === 'pull') {
      a.cordPull(g.x, g.y + 0.6, g.z, !!extra);
      this.g.particles.burst(g.x - 0.4, g.y + 1.25, g.z, extra ? 4 : 10, { color: [0.35, 0.35, 0.38], speed: 1.2, up: 1.5, life: 1.2, size: 0.09, gravity: 0.6, drag: 1.2 });
    }
  }

  // ---------------- meshes ----------------
  _buildBody(b, world, site, i) {
    const c = site.corpse;
    const y = world.terrain.height(c.x, c.z);
    const r = new RNG(c.seed);
    b.reset();
    const P = placer(b, c.x, y, c.z, c.yaw);
    const reach = buildCorpse(b, P, r);
    const mesh = new THREE.Mesh(b.toGeometry(), this.g.world.material);
    mesh.matrixAutoUpdate = false;
    this.g.scene.add(mesh);

    // the part it was carrying lies by its hand (amber when the sound finds it)
    b.reset();
    const hx = 0.62, hz = 0.5 + reach * 0.4;
    const Q = placer(b, c.x, y, c.z, c.yaw);
    buildToolBag(b, Q, i, hx, hz);
    const item = new THREE.Mesh(b.toGeometry(), this.g.world.material);
    item.matrixAutoUpdate = false;
    this.g.scene.add(item);
    // one of the four out there also had a flare gun (which one changes every night)
    let gun = null;
    if (i > 0) {
      b.reset();
      _e.set(0, c.yaw, 0, 'YXZ');
      const base = new THREE.Matrix4().compose(new THREE.Vector3(c.x, y, c.z), new THREE.Quaternion().setFromEuler(_e), new THREE.Vector3(1, 1, 1));
      const spot = new THREE.Matrix4().makeTranslation(hx + 0.34, 0, hz - 0.3).multiply(new THREE.Matrix4().makeRotationY(2.2 + i));
      buildFlareGun(b, base.multiply(spot));
      gun = new THREE.Mesh(b.toGeometry(), this.g.world.material);
      gun.matrixAutoUpdate = false;
      gun.visible = false;
      this.g.scene.add(gun);
    }
    // world position of the body's centre (for distances / sounds)
    return { site, x: c.x, z: c.z, y, mesh, item, gun, k: -1, searched: false, revealed: false, flies: null };
  }

  _buildGlow(scene, site) {
    const tex = glowTexture();
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffd2a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    core.position.set(site.lamp.x, site.lamp.y - 0.05, site.lamp.z);
    core.scale.setScalar(1.3);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xff9a50, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    halo.position.copy(core.position);
    halo.scale.setScalar(7);
    core.visible = halo.visible = false;
    scene.add(core, halo);
    return { core, halo };
  }

  // ---------------- run lifecycle ----------------
  reset(rng) {
    // camp first, then the four landmarks in a different order every night
    this.chain = [0, ...shuffle(rng, [1, 2, 3, 4])];
    for (const g of this.gens) if (g.hum) g.hum.stop();
    this.gens = this.chain.map((si, k) => ({
      k, si, site: this.sites[si], spec: CFG.GENERATORS[k],
      x: this.sites[si].x, y: this.sites[si].y, z: this.sites[si].z,
      phase: 'dead', progress: 0, pulls: 0, pullCD: 0, spinT: 0, spinNoiseT: 0,
      hasPart: false, known: k === 0, running: false,
      lamp: 0, flick: 0, hum: null, beaconT: 1.5 + k, clankT: 0.5, sparkT: 1.5,
    }));
    for (const body of this.bodies) {
      body.k = this.chain.indexOf(this.sites.indexOf(body.site));
      body.searched = false;
      body.revealed = false;
      body.mesh.visible = true;
      body.item.visible = true;
      if (body.flies) body.flies.stop();
      body.flies = null;
    }
    this.bodies[0].mesh.visible = false; // it wasn't there this morning
    this.bodies[0].item.visible = false;
    // the flare gun lies by one of the four bodies out in the forest (the seed is shared: co-op agrees)
    this.flareBody = 1 + Math.floor(rng.next() * 4);
    this.bodies.forEach((body, i) => {
      if (body.gun) body.gun.visible = i === this.flareBody;
    });
    this.morningOn = false;
    this.target = null;
    this.searchT = 0;
    this.closeNote();
    this.lastTask = '';
    this.pendingTask = null;
    this.count = 0;
    this.dirty = false;
    this.firstRevealDone = false;
    for (let i = 0; i < 5; i++) {
      shared.uLamp.value[i].w = 0;
      shadowLights.lamp[i] = null;
    }
    for (const gl of this.glows) gl.core.visible = gl.halo.visible = false;
  }

  // morning: the camp generator chugs along, its lamp burning in daylight
  setMorning(on) {
    this.morningOn = on;
    const g = this.gens[0];
    g.lamp = on ? 1 : g.lamp;
  }

  // dusk: it coughs, sputters and dies, the lamp flickering out with it
  campFail() {
    const g = this.gens[0];
    this.morningOn = false;
    g.flick = 1.4;
    g.dying = true;
    if (g.hum) {
      g.hum.sputter();
      const h = g.hum;
      g.hum = null;
      setTimeout(() => h.stop(), 1600);
    }
  }

  startNight() {
    const g = this.gens[0];
    g.dying = false;
    g.lamp = 0;
    if (g.hum) { g.hum.stop(); g.hum = null; }
    this.bodies[0].mesh.visible = true;
    this.bodies[0].item.visible = true;
  }

  // back to the menu: every hum, fly and lamp off
  silence() {
    for (const g of this.gens) {
      if (g.hum) g.hum.stop();
      g.hum = null;
      g.lamp = 0;
      g.running = false;
    }
    for (const body of this.bodies) {
      if (body.flies) body.flies.stop();
      body.flies = null;
    }
    this.morningOn = false;
    this.closeNote();
    for (let i = 0; i < 5; i++) {
      shared.uLamp.value[i].w = 0;
      shadowLights.lamp[i] = null;
    }
    for (const gl of this.glows) gl.core.visible = gl.halo.visible = false;
  }

  // ---------------- queries ----------------
  // how much lamp light falls at (x, z) — same falloff as the shader (and a wall in between stops it)
  lampAt(x, z, y = null) {
    let best = 0;
    const R = CFG.LAMP_R;
    const world = this.g.world;
    for (let i = 0; i < LAMP_SLOTS; i++) {
      const L = shared.uLamp.value[i];
      if (L.w <= 0.001) continue;
      const d = Math.hypot(L.x - x, L.z - z);
      if (d > R * 1.5) continue;
      const f = 1 - smoothstep(R * 0.12, R * 1.5, d);
      const v = f * f * Math.min(1, L.w / LAMP_I);
      if (v <= best) continue;
      if (world.losBlocked(L.x, L.y - 0.15, L.z, x, y ?? world.terrain.height(x, z) + 1.3, z, 0.6)) continue;
      best = v;
    }
    return best;
  }

  inLamp(x, z) {
    return this.lampAt(x, z) > 0.18;
  }

  siteAt(site) {
    return t('siteAt')[site.id] || '';
  }

  // the line shown on Tab / when the task changes
  taskText() {
    const g = this.gens.find((q) => !q.running);
    if (!g) return this.g.escape ? this.g.escape.taskText() : '';
    if (g.phase === 'spin') return t('taskSpin');
    if (g.hasPart) return t('taskRepair').replace('{site}', this.siteAt(g.site));
    if (g.k === 0) return t('taskCamp');
    if (!g.known) return t('taskFindNext');
    return t('taskFollow').replace('{site}', this.siteAt(g.site));
  }

  // ---------------- per frame ----------------
  update(dt, night) {
    const game = this.g;
    const p = game.player;
    const ears = game.ears();
    const audio = game.audio;

    // lamps + hum
    for (const g of this.gens) {
      let want = g.running || (g.k === 0 && this.morningOn) ? 1 : 0;
      if (g.phase === 'spin') want = 0.25 * smoothstep(0, g.spec.spin, g.spinT) * (Math.random() < 0.3 ? 1 : 0.2);
      g.lamp = damp(g.lamp, want, g.running ? 3 : 6, dt);
      if (g.dying) g.lamp = damp(g.lamp, 0, 1.6, dt);
      let I = g.lamp;
      if (g.flick > 0) {
        g.flick -= dt;
        I *= Math.random() < 0.45 ? 0.15 : 1;
      }
      const L = shared.uLamp.value[g.si];
      L.set(g.site.lamp.x, g.site.lamp.y, g.site.lamp.z, I * LAMP_I);
      // its shadows are drawn from just under the shade (the shade itself doesn't count)
      if (I > 0.004) {
        const sl = shadowLights.lamp[g.si] || (shadowLights.lamp[g.si] = { x: 0, y: 0, z: 0, R: 0, near: 0.1 });
        sl.x = g.site.lamp.x;
        sl.y = g.site.lamp.y - 0.15;
        sl.z = g.site.lamp.z;
        sl.R = CFG.LAMP_R * 1.5;
      } else shadowLights.lamp[g.si] = null;
      const gl = this.glows[g.si];
      gl.core.visible = gl.halo.visible = I > 0.01;
      gl.core.material.opacity = Math.min(1, I * 1.2);
      gl.halo.material.opacity = I * 0.22;
      const wantHum = (g.running || (g.k === 0 && this.morningOn && !g.dying)) && audio.ready;
      if (wantHum && !g.hum) g.hum = audio.genHum(g.x, g.y + 0.5, g.z);
      if (!wantHum && g.hum && !g.dying) { g.hum.stop(); g.hum = null; }
    }
    if (!night) {
      // the morning: nothing to do yet — but a door opens (the first-aid hut is right by the camp)
      if (game.state === 'morning' && p.alive) this._interact(dt, true);
      return;
    }

    // flies around the bodies (you hear them before you find them)
    for (const body of this.bodies) {
      if (!body.mesh.visible) continue;
      const d = Math.hypot(body.x - ears.x, body.z - ears.z);
      if (d < 15 && !body.flies && audio.ready) body.flies = audio.flies(body.x, body.y + 0.3, body.z);
      else if (d > 20 && body.flies) { body.flies.stop(); body.flies = null; }
    }

    // radio beacons on generators you know about
    for (const g of this.gens) {
      if (!p.alive) break;
      if (!g.known || g.running || g.phase === 'spin') continue;
      g.beaconT -= dt;
      if (g.beaconT > 0) continue;
      const d = Math.hypot(g.x - p.x, g.z - p.z);
      g.beaconT = 2.2 + 2.8 * clamp(d / 90, 0, 1);
      if (d < 3) continue;
      audio.beacon(g.x, g.y + 1.1, g.z);
      // where it is relative to where you're looking (right = positive)
      const dx = g.x - p.x, dz = g.z - p.z;
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      game.hud.beacon(Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz), d);
      game.radar.blip(g.x, g.z, 'beacon');
    }

    // generators working on their own (spin-up)
    for (const g of this.gens) {
      if (g.phase !== 'spin') continue;
      g.spinT += dt;
      g.spinNoiseT -= dt;
      if (g.hum) g.hum.spin(g.spinT / g.spec.spin);
      else if (audio.ready) g.hum = audio.genHum(g.x, g.y + 0.5, g.z, true);
      if (g.spinNoiseT <= 0) {
        g.spinNoiseT = 1.8;
        game.noise(g.x, g.z, g.spec.spinLoud, 'repair'); // the machine itself: only the host's monsters listen
        game.particles.burst(g.x, g.y + 1.0, g.z, 8, { color: [1, 0.8, 0.45], speed: 3, up: 2, life: 0.5, size: 0.05, gravity: -6, drag: 1.5 });
      }
      if (g.spinT >= g.spec.spin) this._start(g);
    }

    // note
    if (this.note) {
      this.note.t -= dt;
      if (this.note.t <= 0) this.closeNote();
    }

    if (p.alive) this._interact(dt);
    else if (this.target) {
      this.target = null;
      game.hud.setUse(null);
    }

    // task changes surface for a moment (once the intro has had its say)
    const task = this.taskText();
    if (task !== this.lastTask) {
      this.lastTask = task;
      this.pendingTask = task;
    }
    if (this.pendingTask && game.intro.itHearsT < 0 && game.firstPingT >= 0 && game.time > game.firstPingT + 3.5) {
      game.hud.task();
      this.pendingTask = null;
    }
  }

  _interact(dt, doorsOnly = false) {
    const game = this.g;
    const p = game.player;
    const input = game.input;
    if (game.expedition?.onTower) {
      this.target = null;
      this.searchT = 0;
      game.cabinets.pry = null;
      game.expedition.towerPrompt();
      return;
    }
    const f = p.forward();
    const es = game.escape;
    const seated = !!es && es.mySeat >= 0;
    const hands = !doorsOnly && !p.carrying && !(es && es.held) && !seated; // (with someone on your shoulder — or a part in your arms — you can still shove a door)
    // what's in front of you
    let best = null, bd = 1e9;
    const consider = (obj, x, z, r, kind) => {
      const dx = x - p.x, dz = z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > r) return;
      const facing = d < 1.1 ? 1 : (dx * f.x + dz * f.z) / d;
      if (facing < 0.25) return;
      const score = d * (1.6 - facing);
      if (score < bd) { bd = score; best = { obj, kind, d }; }
    };
    if (hands) {
      for (const body of this.bodies) if (!body.searched && body.mesh.visible) consider(body, body.x, body.z, USE_R_BODY, 'body');
      for (const g of this.gens) if (!g.running) consider(g, g.x, g.z, USE_R_GEN, 'gen');
      if (game.rescue) game.rescue.consider(consider);
      if (game.glows) game.glows.consider(consider);
      if (game.torch) game.torch.consider(consider);
      if (game.tools) game.tools.consider(consider);
      if (game.expedition) game.expedition.consider(consider);
    }
    if (es && !doorsOnly) es.consider(consider);
    if (game.doors && !seated) game.doors.consider(consider);
    // cupboards (in the morning too: the first-aid hut is right by the camp) — and someone caught in one
    if (game.cabinets && !seated) game.cabinets.consider(consider, !p.carrying && !(es && es.held));
    if (best && this.target && best.obj !== this.target.obj) this.searchT = 0;
    this.target = best;
    if (!best || best.kind !== 'lookout') game.expedition?.idle();
    if (!best || best.kind !== 'cabinet' || !best.obj.locked) game.cabinets.pry = null;

    const held = input.useHeld;
    const pressed = game.events.includes('useDown');
    const still = p.speed < 0.6;
    const hud = game.hud;
    const T = (key) => t(input.touch ? key + 'T' : key); // touch has no E key: name the button instead
    if (game.rescue && (!best || (best.kind !== 'mate' && best.kind !== 'cot'))) game.rescue.idle();
    const escKind = !!best && ESC_KINDS.has(best.kind);
    if (es && !escKind) es.idle(dt);
    if (!best) {
      this.searchT = 0;
      // your hands are full: say what R does (and F, with a part)
      let line = null;
      if (es && es.held) line = T('usePartHeld');
      else if (p.carrying && es && es.canLoad()) line = T('useLoadCar');
      else if (p.carrying && game.rescue) line = game.rescue.carryPrompt(T);
      hud.setUse(line, 0, false);
      return;
    }
    const o = best.obj;
    if (best.kind === 'fieldTool') {
      this.searchT = 0;
      game.tools.interact(best, pressed, T);
      return;
    }
    if (best.kind === 'lookout' || best.kind === 'campSpeaker') {
      this.searchT = 0;
      game.expedition.interact(best, dt, held, pressed, T);
      return;
    }
    if (escKind) {
      this.searchT = 0;
      es.interact(best, dt, held, pressed, still, T);
      return;
    }
    if (CAB_KINDS.has(best.kind)) {
      this.searchT = 0;
      game.cabinets.interact(best, dt, held, pressed, T);
      return;
    }
    if (best.kind === 'door') {
      this.searchT = 0;
      hud.setUse(T(game.doors.prompt(o)), 0, true);
      if (pressed) game.doors.use(o);
      return;
    }
    if (best.kind === 'mate' || best.kind === 'cot') {
      this.searchT = 0;
      game.rescue.interact(best, dt, held, still, T);
      return;
    }
    if (best.kind === 'glow') {
      this.searchT = 0;
      hud.setUse(T('useGlowPick'), 0, true);
      if (pressed) game.glows.pick(o);
      return;
    }
    if (best.kind === 'torch') {
      this.searchT = 0;
      hud.setUse(T('useTorch'), 0, true);
      if (pressed) game.torch.take(o);
      return;
    }
    if (best.kind === 'body') {
      if (held && still) this.searchT += dt;
      else this.searchT = Math.max(0, this.searchT - dt * 2);
      hud.setUse(T('useSearch'), this.searchT / SEARCH_TIME, true);
      if (this.searchT >= SEARCH_TIME) {
        this.searchT = 0;
        this._search(o);
      }
      return;
    }
    // generator
    const g = o;
    const spec = g.spec;
    if (g.phase === 'spin') { hud.setUse(t('useSpin'), g.spinT / spec.spin, false); return; }
    if (!g.hasPart) { hud.setUse(t('useNeed').replace('{part}', t('parts')[spec.part]), 0, false, true); return; }
    if (g.phase === 'cord') {
      hud.setUse(T('useCord').replace('{n}', g.pulls).replace('{m}', spec.pulls), g.pulls / spec.pulls, true);
      g.pullCD -= dt;
      if (pressed) g.pullQueued = true; // a press during the cooldown isn't lost, just delayed
      if (g.pullQueued && g.pullCD <= 0) {
        g.pullQueued = false;
        this._pull(g);
      }
      return;
    }
    hud.setUse(T('useHold').replace('{action}', t('actions')[spec.part]), g.progress, true);
    if (held && still) this._work(g, dt);
  }

  _search(body) {
    const game = this.g;
    body.searched = true;
    body.item.visible = false;
    const gun = !!body.gun && body.gun.visible;
    if (body.gun) body.gun.visible = false;
    const k = body.k;
    const g = this.gens[k];
    g.hasPart = true;
    g.known = true;
    this.dirty = true;
    if (game.sync) game.sync.ev('fd', this.bodies.indexOf(body), k);
    const next = this.gens[k + 1];
    if (next && !next.running) {
      next.known = true;
      next.beaconT = 3.5;
    }
    game.onCorpseSearched(body, k);
    const nextSite = next ? this.siteAt(next.site) : '';
    const text = t('notes')[k].replace('{next}', nextSite);
    this.openNote(`${t('noteKicker')} · ${t('parts')[g.spec.part]}${gun ? ` + ${t('flareGun')}` : ''}`, text);
    if (gun) game.onFlareFound();
  }

  openNote(kicker, text) {
    this.note = { t: NOTE_SECONDS };
    this.g.hud.showNote(kicker, text);
    this.g.audio.paper();
  }

  closeNote() {
    if (!this.note) return;
    this.note = null;
    this.g.hud.showNote(null);
  }

  _work(g, dt) {
    const game = this.g;
    const spec = g.spec;
    if (g.phase === 'dead') g.phase = 'work';
    g.progress = Math.min(1, g.progress + dt / spec.dur);
    this.dirty = true;
    g.clankT -= dt;
    if (g.clankT <= 0) {
      g.clankT = spec.clank[0] + Math.random() * (spec.clank[1] - spec.clank[0]);
      if (spec.part === 'fuel') game.audio.glug(g.x, g.y + 0.9, g.z);
      else game.audio.clank(g.x, g.y + 0.6, g.z, spec.mode === 'clank' ? 1 : 0.55);
      if (game.sync) game.sync.ev('fx', spec.part === 'fuel' ? 'glug' : 'clank', g.k, spec.mode === 'clank' ? 1 : 0);
      game.playerNoise(g.x, g.z, spec.clankLoud, 'repair');
      game.addTrauma(spec.mode === 'clank' ? 0.05 : 0.02);
    }
    if (spec.mode === 'spark') {
      g.sparkT -= dt;
      if (g.sparkT <= 0) {
        g.sparkT = spec.spark[0] + Math.random() * (spec.spark[1] - spec.spark[0]);
        game.onSpark(g);
        if (game.sync) game.sync.ev('fx', 'spark', g.k);
      }
    }
    if (g.progress >= 1) {
      if (spec.mode === 'cord') {
        g.phase = 'cord';
        g.pullCD = 0;
        g.pullQueued = false;
      } else if (spec.mode === 'spinup') {
        g.phase = 'spin';
        g.spinT = 0;
        g.spinNoiseT = 0.6;
        game.onSpinUp(g);
      } else this._start(g);
    }
  }

  _pull(g) {
    const game = this.g;
    const spec = g.spec;
    g.pulls++;
    g.pullCD = 0.75;
    this.dirty = true;
    const ok = g.pulls >= spec.pulls;
    game.audio.cordPull(g.x, g.y + 0.6, g.z, ok);
    if (game.sync) game.sync.ev('fx', 'pull', g.k, ok ? 1 : 0);
    game.playerNoise(g.x, g.z, spec.pullLoud, 'repair');
    game.addTrauma(0.08);
    game.particles.burst(g.x - 0.4, g.y + 1.25, g.z, ok ? 4 : 10, { color: [0.35, 0.35, 0.38], speed: 1.2, up: 1.5, life: 1.2, size: 0.09, gravity: 0.6, drag: 1.2 });
    if (ok) this._start(g);
  }

  // by: null = you (or the machine), a teammate, or true = someone else
  _start(g, by = null) {
    if (g.running) return;
    const game = this.g;
    g.phase = 'running';
    g.running = true;
    g.flick = 1.2;
    if (g.hum) g.hum.spin(1); // a spun-up engine just keeps going
    this.count = this.gens.filter((q) => q.running).length;
    if (!by) this.dirty = true;
    game.audio.genStart(g.x, g.y + 0.6, g.z);
    game.onGeneratorStarted(g, this.count, by && by !== true ? by : null);
  }

  // a sound wave just found something
  onFront(s) {
    const game = this.g;
    for (const body of this.bodies) {
      if (body.revealed || !body.mesh.visible) continue;
      const d = Math.hypot(body.x - s.x, body.y + 0.3 - s.y, body.z - s.z);
      if (d > s.prevR && d <= s.curR && d <= s.radius) {
        body.revealed = true;
        if (!body.searched) {
          game.audio.discover(body.x, body.y + 0.4, body.z);
          game.radar.blip(body.x, body.z, 'beacon');
        }
      }
    }
  }
}
