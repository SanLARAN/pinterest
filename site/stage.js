// The landing page's night: one full-screen canvas behind the page, drawn exactly the way the game draws the
// forest (render/sonar.js world material, pulses, echo ghosts, the eyes in the dark, the post chain).
//
// Scroll moves the camera down the old footpath (timeline.js); the shift section runs the nights and mornings and
// lights the five generators; the co-op section sets you by the fire with three friends. You can make sounds:
// a click throws a stone (the sound is where it lands, and the Listener goes there), holding is your voice
// (loudness grows while you hold; a scream brings it to you). The numbers are the game's own (core/config.js).
import * as THREE from 'three';
import { CFG } from '../src/core/config.js';
import { shared, createWorldMaterial, createMotes, createSky } from '../src/render/sonar.js';
import { Pulses } from '../src/render/pulses.js';
import { Ghosts } from '../src/render/ghosts.js';
import { Eyes } from '../src/render/eyes.js';
import { Post } from '../src/render/post.js';
import { buildListener } from '../src/game/monsters.js';
import { buildSurvivor, poseSurvivor } from '../src/game/survivor.js';
import { buildForest, geometryOf, trailX, CAMP } from './forest.js';
import { trackAt, lightAt, gensLitAt, clamp01, smooth, lerp } from './timeline.js';

const PLAYER = [0.84, 0.92, 1.0];
const STONE = [1.0, 0.93, 0.82];
const FRIEND = [1.0, 0.86, 0.66];
const RED = 0xff2a20;
const BONE = 0xd6cdc0;

// where the Listener waits in each part of the walk (on the path itself, facing up it)
const STANDS = {
  top: { z: 71 },
  echo: { z: 55 },
  coop: { x: 10.5, z: -9.5 },
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// its pose for how close it has come (0 = it waits, 1 = alert, 2 = on you) — the splash's poses
function poseListener(rig, act, turn = 0) {
  const n = rig.nodes;
  const lean = [0.12, 0.3, 0.55][act];
  n.spine.rotation.set(lean, 0, 0);
  n.neck.rotation.set(-lean * 0.8, 0, 0);
  n.head.rotation.set(0.05 + act * 0.05, -0.4 * turn, 0.7 * turn);
  n.jaw.rotation.x = [0.05, 0.16, 0.55][act];
  const reach = [0.08, 0.35, 0.95][act];
  n.shoulderL.rotation.set(-reach, 0, -0.08);
  n.shoulderR.rotation.set(-reach * 0.85, 0, 0.08);
  n.elbowL.rotation.x = -0.2 - act * 0.15;
  n.elbowR.rotation.x = -0.15 - act * 0.15;
}

export class Stage {
  // opts: { reduced, onEvent(kind, data), audio: () => AudioEngine|null }
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.reduced = !!opts.reduced;
    this.onEvent = opts.onEvent || (() => {});
    this.audio = opts.audio || (() => null);
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    r.setClearColor(0x000000, 1);
    this.renderer = r;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 170);
    this.camera.rotation.order = 'YXZ';
    this.post = new Post(r);
    this.post.setAntialias(true);
    this.pulses = new Pulses();
    this.ghosts = new Ghosts(this.scene);
    this.eyes = new Eyes(this.scene);
    this.mat = createWorldMaterial();
    this.motes = createMotes(1600);
    this.scene.add(this.motes);
    this.sky = createSky();
    this.scene.add(this.sky);
    this.time = 0;
    this.q = matchMedia('(pointer: coarse)').matches ? 0.7 : 0.9; // the render scale, adapted to the machine
    this.fixedQ = opts.q > 0 && opts.q <= 1; // (?q=0.4 on the page's URL: a fixed scale, for slow machines and tests)
    if (this.fixedQ) this.q = opts.q;
    this.perf = { acc: 0, n: 0, cool: 2 };
    this.u = 0;
    this.uSmooth = 0;
    this.shiftP = 0;
    this.section = 'top';
    this.dim = 0;
    this.fade = 0;
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.glitch = 0;
    this.red = 0;
    this.shake = 0;
    this.lastAuto = -10;
    this.lastUser = -100;
    this.nextEyes = 4;
    this.wasDark = true;
    this.litGens = [];
    this.ready = false;
    this.paused = false;
    this._target = new THREE.Vector3();
  }

  // the heavy part (the forest), split from the constructor so the page can paint first
  build() {
    const F = buildForest();
    this.forest = F;
    this.terrain = F.terrain;
    for (const c of F.chunks) {
      const m = new THREE.Mesh(geometryOf(c.arr), this.mat);
      m.frustumCulled = !c.ground;
      this.scene.add(m);
    }
    // the generators' work lamps (lit through the nights) and the camp fire
    const tex = glowTexture();
    const sprite = (color, s, opacity) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
      sp.scale.setScalar(s);
      sp.visible = false;
      this.scene.add(sp);
      return sp;
    };
    this.lamps = F.gens.map((g) => ({ g, core: sprite(0xffd2a0, 0.9, 0.9), halo: sprite(0xff9a50, 4.2, 0.3), on: 0 }));
    for (const L of this.lamps) {
      L.core.position.set(...L.g.lamp);
      L.halo.position.set(...L.g.lamp);
    }
    this.fireSprites = [sprite(0xffc070, 1.2, 0.8), sprite(0xff7a30, 4.6, 0.35)];
    for (const s of this.fireSprites) s.position.set(F.fire[0], F.fire[1], F.fire[2]);
    // the Listener (it only ever shows as an echo ghost) and the three friends by the fire
    this.L = { rig: buildListener(), x: 0, z: 0, tx: 0, tz: 0, speed: 0, act: 0, ghost: null, home: 'top', back: 0, seenT: -10 };
    this._goHome('top', true);
    this.friends = [0.5, 2.25, 4.1].map((a, i) => {
      const rig = buildSurvivor();
      const x = CAMP.x + Math.cos(a) * 2.7, z = CAMP.z + Math.sin(a) * 2.7;
      const y = this.terrain.height(x, z);
      rig.root.position.set(x, y, z);
      rig.root.rotation.y = Math.atan2(CAMP.x - x, CAMP.z - z);
      try { poseSurvivor(rig, i * 0.7, 0, 0, false); } catch { /* rest pose */ }
      rig.root.updateMatrixWorld(true);
      return { rig, x, y, z, ghost: null, next: 1.5 + i * 1.3 };
    });
    this.ready = true;
    this.resize();
  }

  resize() {
    const w = Math.max(2, innerWidth), h = Math.max(2, innerHeight);
    this.w = w;
    this.h = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // a phone held upright keeps a sane horizontal view (core/config: FOV_PORTRAIT_MIN_H)
    const minH = THREE.MathUtils.degToRad(CFG.FOV_PORTRAIT_MIN_H);
    const v = 2 * Math.atan(Math.tan(minH / 2) / this.camera.aspect);
    this.camera.fov = Math.min(CFG.FOV_MAX, Math.max(62, THREE.MathUtils.radToDeg(v)));
    this.camera.updateProjectionMatrix();
    this.post.setSize(w, h, this.q * dpr);
  }

  // from the page: where the scroll is
  setScroll({ u, shiftP, section, dim }) {
    this.u = u;
    this.shiftP = shiftP;
    this.section = section;
    this.dim = dim;
    const home = section === 'coop' ? 'coop' : section === 'echo' ? 'echo' : section === 'shift' ? null : 'top';
    if (home && home !== this.L?.home && this.ready) this._goHome(home);
  }

  setPointer(nx, ny) {
    this.pointer.x = nx;
    this.pointer.y = ny;
  }

  _goHome(home, snap = false) {
    const L = this.L;
    L.home = home;
    const s = STANDS[home];
    const x = s.x ?? trailX(s.z) + 0.3, z = s.z;
    L.tx = x;
    L.tz = z;
    L.speed = 0;
    // it does not walk there in front of you: it is simply somewhere else the next time an echo finds it
    L.x = x;
    L.z = z;
    L.act = 0;
    if (L.ghost) { this.ghosts.release(L.ghost); L.ghost = null; }
    if (snap) this._placeListener();
  }

  _placeListener() {
    const L = this.L, r = L.rig.root;
    const y = this.terrain.height(L.x, L.z);
    r.position.set(L.x, y, L.z);
    const c = this.camera.position;
    r.rotation.set(0, Math.atan2(c.x - L.x, c.z - L.z), 0);
    poseListener(L.rig, L.act, L.act >= 1 ? 0.5 : 0);
    r.updateMatrixWorld(true);
  }

  // ---------------- the sounds you make ----------------
  // the ground under a screen point (a ray marched against the terrain)
  groundAt(clientX, clientY) {
    if (!this.ready) return null;
    const ndc = new THREE.Vector2((clientX / this.w) * 2 - 1, -(clientY / this.h) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    for (let t = 1; t < 90; t += 0.5) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      if (y <= this.terrain.height(x, z)) return new THREE.Vector3(x, this.terrain.height(x, z), z);
    }
    // the sky: the stone falls somewhere ahead
    const t = 28;
    const x = o.x + d.x * t, z = o.z + d.z * t;
    return new THREE.Vector3(x, this.terrain.height(x, z), z);
  }

  stone(clientX, clientY) {
    const p = this.groundAt(clientX, clientY);
    if (!p) return null;
    const c = this.camera.position;
    const dist = Math.hypot(p.x - c.x, p.z - c.z);
    const flight = Math.min(1.4, Math.max(0.25, dist / 11)); // thrown at 11 m/s (core/config: STONE.speed)
    this.lastUser = this.time;
    const A = this.audio();
    A?.throwWhoosh?.();
    this.pending = (this.pending || []).filter((e) => e.at > this.time);
    this.pending.push({ at: this.time + flight, kind: 'stone', p });
    return { dist };
  }

  // your voice, 0..1 (the hold, or the microphone)
  voice(loud, { mic = false } = {}) {
    if (!this.ready) return null;
    loud = clamp01(loud);
    const c = this.camera.position;
    const reveal = CFG.voiceRevealRadius(loud);
    const hear = CFG.voiceHearRadius(loud);
    this.pulses.emit(c.x, c.y - 0.3, c.z, this.time, { radius: reveal, strength: 0.55 + loud * 0.7, speed: CFG.PULSE.speed, decay: 0.55, color: PLAYER, kind: 'player' });
    this.lastUser = this.time;
    this.lastAuto = this.time;
    const A = this.audio();
    A?.sonarSweep?.(loud, loud > 0.6);
    const L = this.L;
    const d = Math.hypot(L.x - c.x, L.z - c.z);
    if (this.section !== 'shift' && loud >= CFG.SCREAM) {
      // a scream: it comes at once, to where you stand
      const f = this._forward();
      this._send(c.x + f.x * 2.2, c.z + f.z * 2.2, 6.5, 2);
      this.onEvent('scream', { hear, reveal });
    } else if (this.section !== 'shift' && d <= hear) {
      // it heard you: it comes to check the spot
      const f = this._forward();
      this._send(lerp(L.x, c.x + f.x * 4, 0.6), lerp(L.z, c.z + f.z * 4, 0.6), 4.7, 1);
      this.onEvent('heard', { hear, reveal, mic });
    } else this.onEvent('voice', { hear, reveal, mic });
    return { hear, reveal };
  }

  _forward() {
    const f = new THREE.Vector3();
    this.camera.getWorldDirection(f);
    f.y = 0;
    return f.normalize();
  }

  _send(x, z, speed, act) {
    const L = this.L;
    L.tx = x;
    L.tz = z;
    L.speed = speed;
    L.act = Math.max(L.act, act);
    L.back = this.time + Math.hypot(x - L.x, z - L.z) / speed + (act >= 2 ? 3.2 : 6);
  }

  // ---------------- the frame ----------------
  frame(dt) {
    if (!this.ready || this.paused) return;
    dt = Math.min(dt, 0.1);
    this.time += dt;
    const T = this.time;
    this._perf(dt);
    // the walk: smoothed, so a wheel's steps glide
    this.uSmooth += (this.u - this.uSmooth) * (1 - Math.exp(-dt * (this.reduced ? 10 : 3.2)));
    this._camera(dt);
    this._light(dt);
    this._auto(T);
    this._listener(dt, T);
    this._friends(T);
    this._eyes(T);
    // stones in flight land
    if (this.pending) {
      for (const e of this.pending) {
        if (e.done || T < e.at) continue;
        e.done = true;
        this.pulses.emit(e.p.x, e.p.y + 0.25, e.p.z, T, { radius: 24, strength: 1.0, speed: CFG.PULSE.speed, decay: 0.6, color: STONE, kind: 'stone' });
        this.audio()?.impact?.(e.p.x, e.p.y, e.p.z);
        const L = this.L;
        if (this.section !== 'shift' && Math.hypot(e.p.x - L.x, e.p.z - L.z) < CFG.hearRadius(0.7)) this._send(e.p.x + 1.2, e.p.z + 1.2, 4.7, 1);
        this.onEvent('stone', { x: e.p.x, z: e.p.z });
      }
      this.pending = this.pending.filter((e) => !e.done);
    }
    shared.uTime.value = T;
    this.pulses.update(T);
    this.ghosts.update(T);
    const pix = this.post.h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
    this.eyes.update(T, pix);
    this.motes.material.uniforms.uPix.value = 9 * (this.post.h / 900);
    this._post(dt);
    // under the atlas and the rest the forest is only a dark backdrop: no need to draw it every frame
    if (this.dim > 0.985 && this._drewDim) return;
    this._drewDim = this.dim > 0.985;
    this.post.render(this.scene, this.camera);
  }

  _camera(dt) {
    const tr = trackAt(this.uSmooth);
    const H = (x, z) => this.terrain.height(x, z);
    const cam = this.camera;
    const [px, py, pz] = tr.pos, [lx, ly, lz] = tr.look;
    const gy = H(px, pz);
    const p = this.pointer;
    p.sx += (p.x - p.sx) * (1 - Math.exp(-dt * 2.5));
    p.sy += (p.y - p.sy) * (1 - Math.exp(-dt * 2.5));
    const t = this.time;
    const walk = this.reduced ? 0 : 1;
    cam.position.set(px, gy + py + Math.sin(t * 1.3) * 0.015 * walk, pz);
    this._target.set(lx + p.sx * 2.2, H(lx, lz) + ly - p.sy * 1.1, lz);
    cam.lookAt(this._target);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    const sh = this.shake * this.shake * walk;
    cam.rotation.z += Math.sin(t * 0.37) * 0.006 * walk + sh * 0.06 * Math.sin(t * 53.1);
    cam.rotation.x += Math.sin(t * 0.29) * 0.005 * walk + sh * 0.04 * Math.sin(t * 61.7);
    cam.updateMatrixWorld();
    // the sky dome (r 140) rides with the camera, as in the game (main.js): left at the origin, its far side fell past
    // the 170 m far plane once the camera was 70 m up the path — a black disc over the first morning
    this.sky.position.copy(cam.position);
    shared.uCam.value.copy(cam.position);
    const A = this.audio();
    if (A?.ready) {
      const f = this._forward();
      A.setListener(cam.position.x, cam.position.y, cam.position.z, f.x, 0, f.z);
    }
  }

  _light(dt) {
    const inShift = this.section === 'shift';
    const L = inShift ? lightAt(this.shiftP) : { dawn: 0, morning: 0, fog: 0, fear: 0, sun: [0.5, 0.35, -0.8], hit: 0 };
    shared.uDawn.value = L.dawn;
    shared.uMorning.value = L.morning;
    shared.uFog.value = L.fog;
    shared.uFear.value = L.fear;
    shared.uSun.value.set(L.sun[0], L.sun[1], L.sun[2]);
    const dark = L.dawn < 0.02;
    // the instant a morning dies: the hit the game gives you at dusk
    if (dark && !this.wasDark && inShift && !this.reduced) {
      this.glitch = Math.max(this.glitch, 0.7);
      this.shake = Math.max(this.shake, 0.5);
      this.audio()?.dusk?.();
    }
    if (!dark && this.wasDark && inShift) this.audio()?.dawn?.();
    this.wasDark = dark;
    // the generators: lamps come on through the nights (and stay on through the rest of the page's walk)
    const lit = inShift ? gensLitAt(this.shiftP).lit : this.section === 'coop' || this.dim > 0 ? [1, 1, 1, 1, 1] : [0, 0, 0, 0, 0];
    this.lamps.forEach((Lm, i) => {
      const want = lit[i] ? 1 : 0;
      if (want && Lm.on < 0.05 && inShift) {
        this.audio()?.genStart?.(...Lm.g.lamp);
        this.onEvent('gen', { i });
      }
      Lm.on += (want - Lm.on) * (1 - Math.exp(-dt * (want ? 2.2 : 6)));
      const fl = 0.93 + 0.07 * Math.sin(this.time * 31 + i) * Math.sin(this.time * 7.3 + i * 2);
      const k = Lm.on * fl;
      shared.uLamp.value[i].set(Lm.g.lamp[0], Lm.g.lamp[1], Lm.g.lamp[2], k > 0.01 ? k : 0);
      Lm.core.visible = Lm.halo.visible = k > 0.02;
      Lm.core.material.opacity = 0.9 * k;
      Lm.halo.material.opacity = 0.3 * k;
    });
    // the camp fire: always burning, a small light of its own
    const F = this.forest.fire;
    const fl = 0.8 + 0.12 * Math.sin(this.time * 11.3) + 0.08 * Math.sin(this.time * 23.7 + 1);
    shared.uGlow.value[0].set(F[0], F[1] + 0.3, F[2], 1.15 * fl);
    shared.uGlowC.value[0].set(1.0, 0.6, 0.3, 9);
    shared.uGlowD.value[0].set(0, 0, 0, 0);
    this.fireSprites[0].visible = this.fireSprites[1].visible = true;
    this.fireSprites[0].material.opacity = 0.75 * fl;
    this.fireSprites[1].material.opacity = 0.3 * fl;
    this.fireSprites[0].position.y = F[1] + 0.15 + Math.sin(this.time * 9) * 0.04;
    this.dawnNow = L.dawn;
  }

  // the forest is pitch black: when you make no sound, the page makes one for you every few seconds
  _auto(T) {
    if (this.dawnNow > 0.5) return;
    const quietFor = T - this.lastUser;
    const every = this.section === 'shift' ? 2.6 : quietFor < 8 ? 99 : 3.4;
    if (T - this.lastAuto < every || T < 0.6) return;
    this.lastAuto = T;
    const c = this.camera.position;
    if (this.section === 'shift') {
      // from up here: a wide ring from somewhere below, sweeping over the treetops
      const f = this._forward();
      const x = c.x + f.x * 18 + Math.sin(T * 1.7) * 9, z = c.z + f.z * 18 + Math.cos(T * 1.3) * 9;
      const y = this.terrain.height(x, z) + 1.5;
      this.pulses.emit(x, y, z, T, { radius: 62, strength: 0.75, speed: CFG.PULSE.speed * 1.3, decay: 0.5, color: PLAYER, kind: 'player' });
    } else {
      const loud = 0.5 + 0.2 * Math.sin(T * 0.7);
      this.pulses.emit(c.x, c.y - 0.3, c.z, T, { radius: CFG.revealRadius(loud), strength: 0.8, speed: CFG.PULSE.speed, decay: 0.55, color: PLAYER, kind: 'player' });
    }
  }

  // the Listener: it moves only toward the sounds it heard; you see it only where an echo caught it
  _listener(dt, T) {
    const L = this.L;
    if (this.section === 'shift' || this.dim > 0.6) {
      if (L.ghost) { this.ghosts.release(L.ghost); L.ghost = null; }
      return;
    }
    if (L.speed > 0) {
      const dx = L.tx - L.x, dz = L.tz - L.z, d = Math.hypot(dx, dz);
      const step = L.speed * dt;
      if (d <= step) {
        L.x = L.tx;
        L.z = L.tz;
        L.speed = 0;
        if (L.act >= 2) {
          // on you: the game's kill frame, without the kill
          this.red = 0.7;
          this.glitch = Math.max(this.glitch, this.reduced ? 0.2 : 0.9);
          this.shake = this.reduced ? 0.2 : 1;
          const c = this.camera.position;
          this.pulses.emit(L.x, this.terrain.height(L.x, L.z) + 1.6, L.z, T, { radius: 9, strength: 1.4, speed: 60, decay: 0.9, color: [1, 0.3, 0.25], kind: 'monster' });
          this.audio()?.screech?.(L.x, c.y, L.z, 0.9);
        } else this.audio()?.sniff?.(L.x, this.terrain.height(L.x, L.z) + 1.8, L.z, 0.5);
      } else {
        L.x += (dx / d) * step;
        L.z += (dz / d) * step;
      }
    } else if (L.back && T > L.back) {
      L.back = 0;
      this._goHome(L.home);
    }
    this._placeListener();
    // a wavefront that crossed it this frame leaves its afterimage
    const hx = L.x, hz = L.z, hy = this.terrain.height(L.x, L.z) + 1.6;
    for (const s of this.pulses.slots) {
      if (!s.active || s.kind === 'monster') continue;
      const d = Math.hypot(hx - s.x, hy - s.y, hz - s.z);
      if (d > s.radius || !(s.prevR < d && s.curR >= d)) continue;
      if (L.ghost) this.ghosts.release(L.ghost);
      L.ghost = this.ghosts.spawn(L.rig, T, { strength: 0.75 + 0.4 * Math.min(1, s.strength), life: 2.6, decay: 0.85, color: RED, full: L.act >= 2 ? 0.6 : 0 });
      L.seenT = T;
      if (L.act >= 1 || Math.random() < 0.5) this._listenerEyes(T);
      this.onEvent('seen', { d: Math.hypot(hx - this.camera.position.x, hz - this.camera.position.z) });
      break;
    }
  }

  _listenerEyes(T) {
    const rig = this.L.rig, h = rig.nodes.head;
    const v = h.getWorldPosition(new THREE.Vector3());
    const yaw = rig.root.rotation.y;
    const far = v.distanceTo(this.camera.position);
    this.eyes.add(v.x + Math.sin(yaw) * 0.09, v.y + 0.06, v.z + Math.cos(yaw) * 0.09, yaw, { time: T, life: 1.1, intensity: 0.95, blink: true, spacing: 0.26, size: 0.16 + far * 0.006 });
  }

  // the friends by the fire: they talk (their voice is an echo too), and the echoes show them
  _friends(T) {
    if (this.section !== 'coop' && this.uSmooth < 0.8) return;
    for (const f of this.friends) {
      if (T > f.next && this.section === 'coop') {
        f.next = T + 2.4 + Math.random() * 3.5;
        const loud = 0.25 + Math.random() * 0.35;
        this.pulses.emit(f.x, f.y + 1.55, f.z, T, { radius: CFG.voiceRevealRadius(loud) * 0.6, strength: 0.7, speed: CFG.PULSE.speed, decay: 0.6, color: FRIEND, kind: 'mate' });
      }
      const hy = f.y + 1.2;
      for (const s of this.pulses.slots) {
        if (!s.active) continue;
        const d = Math.hypot(f.x - s.x, hy - s.y, f.z - s.z);
        if (d > s.radius || !(s.prevR < d && s.curR >= d)) continue;
        if (f.ghost) this.ghosts.release(f.ghost);
        f.ghost = this.ghosts.spawn(f.rig, T, { strength: 0.7, life: 2.4, decay: 0.8, color: BONE });
        break;
      }
    }
  }

  // eyes in the dark, now and then, off the path ahead
  _eyes(T) {
    if (T < this.nextEyes || this.dawnNow > 0.3 || this.dim > 0.5) return;
    this.nextEyes = T + 5 + Math.random() * 5;
    const c = this.camera.position, f = this._forward();
    const side = Math.random() < 0.5 ? -1 : 1;
    const d = 16 + Math.random() * 16;
    const x = c.x + f.x * d - f.z * side * (5 + Math.random() * 8);
    const z = c.z + f.z * d + f.x * side * (5 + Math.random() * 8);
    const y = this.terrain.height(x, z) + 1.5 + Math.random() * 0.8;
    const yaw = Math.atan2(c.x - x, c.z - z);
    this.eyes.add(x, y, z, yaw, { time: T, life: 0.9 + Math.random() * 0.6, intensity: 0.8, blink: true, spacing: 0.22, size: 0.14 + d * 0.005 });
  }

  _post(dt) {
    const u = this.post.u;
    this.fade = Math.min(1, this.fade + dt * 0.6);
    this.glitch = Math.max(0, this.glitch - dt * 1.4);
    this.red = Math.max(0, this.red - dt * 0.8);
    const dawn = shared.uDawn.value;
    u.uFade.value = this.fade * (1 - 0.86 * this.dim);
    u.uAberr.value = 0.18 + this.glitch * 0.8 + this.shake * 0.3;
    u.uGlitch.value = this.reduced ? 0 : this.glitch;
    u.uPsych.value = 0;
    u.uRed.value = this.red;
    u.uWhite.value = 0;
    u.uDanger.value = this.L && this.L.act >= 2 && this.L.speed > 0 ? 0.5 : this.red * 0.6;
    u.uGrain.value = 0.07 + this.glitch * 0.08;
    u.uShockAmp.value = 0;
    u.uWarm.value = this.section === 'coop' ? 0.12 : 0;
    u.uFlicker.value = 0;
    u.uAsh.value = 0.62 * (1 - Math.min(1, dawn * 1.4));
    u.uBloom.value = 0.8;
    u.uTime.value = this.time;
  }

  // the machine decides how sharp the night can be
  _perf(dt) {
    if (this.fixedQ) return;
    const p = this.perf;
    p.acc += dt;
    p.n++;
    p.cool -= dt;
    if (p.acc < 1.2) return;
    const avg = p.acc / p.n;
    p.acc = 0;
    p.n = 0;
    if (p.cool > 0) return;
    let q = this.q;
    if (avg > 0.028 && q > 0.5) q = Math.max(0.5, q - 0.12);
    else if (avg < 0.0135 && q < 1) q = Math.min(1, q + 0.05);
    if (q !== this.q) {
      this.q = q;
      p.cool = 2.5;
      this.post.setSize(this.w, this.h, q * Math.min(window.devicePixelRatio || 1, 1.5));
    }
  }

  dispose() {
    this.ready = false;
    try { this.renderer.dispose(); } catch { /* fine */ }
  }
}
