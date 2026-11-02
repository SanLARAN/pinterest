// The splash (3.1q): before the menu, the forest at night and the thing on the posters — the Listener, the tall one
// with the antlers, «Лось». It stands far off among the trees, alone. The piano (the owner's «Detuned Piano»,
// 14.4 s) is the clock: its accents are echoes, and an echo shows only where it WAS — the game's own rule, you never
// see them move — so each time it is nearer: once, twice. On the long chord it turns its head (that one you do see,
// a red outline in the dark). Once more, nearer. The piano dies away, a breath of silence — and it is in your face.
//
// It is drawn the way the night is drawn: the forest is the real one (built at boot), the pings are pulses, it is a
// ghost of the Listener's own rig, its eyes are the eyes of the dark. Any key or tap skips it. In a browser that
// will not play sound before a gesture, it waits in the dark for one («press any key»): without the piano it is
// only half of itself.
import { t } from '../core/i18n.js';
import { settings } from '../core/storage.js';
import { buildListener } from '../game/monsters.js';

export const SPLASH_SRC = 'audio/splash-piano.mp3';
export const SPLASH_BUS = 0.9; // the piano is the whole score here, not a bed under a menu

// Where it stands for each act (m from you) and the track's accents (s), measured from the file's onsets:
// a chord at 0.32; a swell that cuts off dead at 4.38; the loudest chord at 7.45; the long chord 7.9–9.2; a hit at
// 9.30; the last notes die by 12.9; silence from 13.0.
export const SPLASH = {
  stand: [34, 22, 12.5, 5.2],
  cues: [
    { at: 0.32, act: 'ping' }, // the first chord: there, far off, alone
    { at: 1.62, act: 'eyes' },
    { at: 2.5, act: 'ping', soft: true }, // ...still there
    { at: 4.38, act: 'jump', to: 1 }, // the swell cuts off — and it is nearer
    { at: 6.1, act: 'eyes' },
    { at: 7.45, act: 'jump', to: 2 }, // the loudest chord: nearer again
    { at: 9.3, act: 'jump', to: 3 }, // after the turn: right here
    { at: 11.14, act: 'ping', soft: true },
    { at: 12.25, act: 'eyes' },
  ],
  turn: [7.9, 9.2], // the long chord: it turns its head
  scream: 13.3, // a breath of silence, then
  screamFor: 1.0,
  end: 14.35,
  wave: 90, // m/s: the splash's echo sweeps fast, and is sent early so it reaches it on the beat
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (k) => k * k * (3 - 2 * k);

// Somewhere in the trees, away from the camp and every landmark (their lanterns and lit tents would spoil the dark),
// a straight, open line for its four stands: each clear of trunks and in sight of your eyes, none in the yard or the
// lake, none far above or below you. The roomiest such line wins; the camp itself is the fallback.
export function chooseSplashSpot(world, stand = SPLASH.stand) {
  const W = (world.wall || 280) - 24;
  const marks = world.landmarks || [];
  const away = (x, z) => Math.hypot(x - world.spawn.x, z - world.spawn.z) > 45 && marks.every((m) => Math.hypot(x - m.x, z - m.z) > (m.r || 10) + 22);
  const origins = [];
  for (const r of [70, 105]) for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + r * 0.01;
    const x = world.spawn.x + Math.cos(a) * r, z = world.spawn.z + Math.sin(a) * r;
    if (Math.abs(x) < W && Math.abs(z) < W && away(x, z)) origins.push([x, z]);
  }
  let best = null;
  for (const [x, z] of origins) {
    const c = lineFrom(world, x, z, stand, away);
    if (c && (!best || c.room > best.room)) best = c;
  }
  return best || lineFrom(world, world.spawn.x, world.spawn.z, stand, () => true, true);
}

function lineFrom(world, sx, sz, stand, away, fallback = false) {
  const h0 = world.terrain.height(sx, sz);
  const eye = h0 + 1.65;
  const L = world.lake;
  if (!fallback && (!world.col.free(sx, sz, 1) || (L && Math.hypot(sx - L.x, sz - L.z) < L.r + 3))) return null;
  let best = null;
  for (let k = 0; k < 90; k++) {
    const a = (k / 90) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    const at = [];
    let room = 0, ok = true;
    for (const d of stand) {
      const x = sx + dx * d, z = sz + dz * d, y = world.terrain.height(x, z);
      if (Math.abs(y - h0) > 2.5 || !world.col.free(x, z, 0.8) || world.inYard?.(x, z, 2) || (L && Math.hypot(x - L.x, z - L.z) < L.r + 2) || !away(x, z)
        || world.losBlocked(sx, eye, sz, x, y + 2.3, z, 0.3)) { ok = false; break; }
      if (world.col.free(x, z, 2)) room++;
      at.push({ x, y, z });
    }
    if (!ok) continue;
    if (!best || room > best.room) best = { room, dx, dz, at };
  }
  if (!best) {
    if (!fallback) return null;
    // nowhere open enough (a map we do not know): the old menu's corner of the camp, nearer
    const a = 2.35, dx = Math.cos(a), dz = Math.sin(a);
    best = { room: 0, dx, dz, at: [21, 14, 8, 4].map((d) => ({ x: sx + dx * d, y: world.terrain.height(sx + dx * d, sz + dz * d), z: sz + dz * d })) };
  }
  return { x: sx, z: sz, eye, yaw: Math.atan2(-best.dx, -best.dz), dx: best.dx, dz: best.dz, at: best.at, room: best.room };
}

// its pose for each act, and in between (k: 0..1 of the head's turn)
function pose(rig, act, turn = 0) {
  const n = rig.nodes;
  const lean = [0.12, 0.24, 0.34, 0.55][act];
  n.spine.rotation.set(lean, 0, 0);
  n.neck.rotation.set(-lean * 0.8, 0, 0);
  n.head.rotation.set(0.05 + act * 0.04, -0.4 * turn, 0.78 * turn);
  n.jaw.rotation.x = [0.05, 0.12, 0.2, 0.5][act];
  const reach = [0.08, 0.3, 0.45, 0.95][act];
  n.shoulderL.rotation.set(-reach, 0, -0.08);
  n.shoulderR.rotation.set(-reach * 0.85, 0, 0.08);
  n.elbowL.rotation.x = -0.2 - act * 0.12;
  n.elbowR.rotation.x = -0.15 - act * 0.12;
}

// the kill's own pose (Game.updateDying, 'listener'): the jaw wide, the arms up round your head, shaking
function poseScream(rig, tt) {
  const n = rig.nodes;
  n.spine.rotation.set(0.95, 0, 0);
  n.neck.rotation.set(-0.4, 0, 0);
  n.head.rotation.set(0.45, Math.sin(tt * 33) * 0.08, Math.sin(tt * 45) * 0.12);
  n.jaw.rotation.x = 0.85 + Math.sin(tt * 38) * 0.18;
  n.shoulderL.rotation.set(-2.1, 0, -0.5);
  n.shoulderR.rotation.set(-2.1, 0, 0.5);
  n.elbowL.rotation.x = -0.5;
  n.elbowR.rotation.x = -0.5;
}

export class Splash {
  // deps: { world, camera, pulses, ghosts, eyes, audio, post, shared, pixScale(), makeAudio? }
  constructor(deps) {
    this.d = deps;
    this.state = 'idle'; // idle | gate | run | done
    this.onDone = null;
  }

  // silent: no piano (the harness, a seek for a screenshot)
  begin(onDone, { silent = false } = {}) {
    const d = this.d;
    this.onDone = onDone;
    this.spot = chooseSplashSpot(d.world);
    this.rig = buildListener();
    this.t = 0; // the track's time (the cues' clock)
    this.clock = 0; // the frame clock (pulses, ghosts, eyes)
    this.act = 0;
    this.cues = SPLASH.cues.map((c) => ({ ...c, pinged: false, done: false }));
    this.ghost = null;
    this.turnGhost = null;
    this.screamGhost = null;
    this.shake = 0;
    this.white = 0;
    this.glitch = 0;
    this.red = 0;
    this.fade = 0;
    this.screamed = false;
    this.reduced = settings.scares === 'reduced';
    this._place(0);
    this._ui(true);
    this._ui();
    this.el = silent ? null : (d.makeAudio || ((src) => (typeof Audio !== 'undefined' ? new Audio(src) : null)))(new URL(SPLASH_SRC, typeof document !== 'undefined' ? document.baseURI : 'http://localhost/').href);
    if (this.el) {
      this.el.preload = 'auto';
      this.el.volume = clamp01(settings.volume * Math.pow(settings.music ?? 0.55, 1.15) * SPLASH_BUS);
    }
    this.state = 'gate';
    this._tryStart();
  }

  // the browser may refuse the piano until a key or a tap: then it waits in the dark for one
  _tryStart() {
    const go = () => {
      if (this.state !== 'gate') return;
      this.state = 'run';
      this.started = true;
      this._setLine(null);
    };
    if (!this.el) { go(); return; }
    let r;
    try { r = this.el.play(); } catch { r = null; }
    if (r && r.then) r.then(go).catch(() => this._setLine(t('splashGate')));
    else go();
  }

  // a key, a click, a tap: in the dark before the piano, it starts it; once it plays, it skips
  input() {
    if (this.state === 'gate') {
      this.d.audio?.init?.();
      this._tryStart();
      return true;
    }
    if (this.state === 'run' && this.clock > 0.25) { this.finish(); return true; }
    return false;
  }

  // the cues' clock: the piano's own position while it plays (so a hitch never puts a jump off its beat)
  _trackTime(dt) {
    const el = this.el;
    if (el && !el.paused && Number.isFinite(el.currentTime) && el.currentTime > 0) return el.currentTime;
    return this.t + dt;
  }

  update(dt) {
    if (this.state === 'done' || this.state === 'idle') return;
    const d = this.d;
    this.clock += dt;
    if (this.state === 'run') {
      this.t = Math.max(this.t, this._trackTime(dt));
      this._cues();
      if (this.t >= SPLASH.end) { this.finish(); return; }
    } else if (this.clock > 2.4 && this.clock - (this._gateEyes || 0) > 3.1) {
      // waiting for a key: a pair of eyes out there, now and then
      this._gateEyes = this.clock;
      this._eyes();
    }
    this._camera(dt);
    d.shared.uTime.value = this.clock;
    d.pulses.update(this.clock);
    d.ghosts.update(this.clock);
    d.eyes.update(this.clock, d.pixScale ? d.pixScale() : 1);
    this._post(dt);
  }

  _cues() {
    const T = this.t;
    for (const c of this.cues) {
      if (c.done) continue;
      const to = c.act === 'jump' ? c.to : this.act;
      const dist = SPLASH.stand[to];
      // the wave goes out early, so it reaches it on the beat
      if (!c.pinged && c.act !== 'eyes' && T >= c.at - dist / SPLASH.wave) {
        c.pinged = true;
        this._pulse(c.soft ? 0.45 : c.act === 'jump' ? 1 : 0.8, dist);
      }
      if (T < c.at) continue;
      c.done = true;
      if (c.act === 'eyes') this._eyes();
      else {
        if (c.act === 'jump') {
          this.act = c.to;
          this._place(this.act);
          if (this.ghost) this.d.ghosts.release(this.ghost); // a cut, not a crowd: only where it is now
          this.shake = Math.max(this.shake, 0.25 + 0.15 * c.to);
        }
        this.ghost = this.d.ghosts.spawn(this.rig, this.clock, { strength: c.soft ? 0.7 : 1.05, life: c.soft ? 2.2 : 2.8, decay: 0.85, color: 0xff2a20 });
      }
    }
    // the long chord: the head turns, and this one you see — a red outline, refreshed every frame
    const [a, b] = SPLASH.turn;
    if (T >= a && T < b + 0.6) {
      const k = ease(clamp01((T - a) / (b - a)));
      pose(this.rig, this.act, k);
      if (!this.turnGhost) {
        if (this.ghost) { this.d.ghosts.release(this.ghost); this.ghost = null; } // (the still one would hide the turn)
        this.turnGhost = this.d.ghosts.spawn(this.rig, this.clock, { sticky: true, strength: 0.85, full: 0.35, color: 0xff2a20, jitter: 0.25 });
      } else this.d.ghosts.refresh(this.turnGhost, this.rig);
      this.turnGhost.strength = 0.85 * (T < b ? 1 : 1 - (T - b) / 0.6);
    } else if (this.turnGhost) { this.d.ghosts.release(this.turnGhost); this.turnGhost = null; }
    if (T >= SPLASH.scream) this._scream(T - SPLASH.scream);
  }

  _place(act) {
    const s = this.spot, p = s.at[act], r = this.rig.root;
    r.position.set(p.x, p.y, p.z);
    r.rotation.set(0, Math.atan2(s.x - p.x, s.z - p.z), 0);
    pose(this.rig, act, act >= 3 ? 1 : 0);
  }

  _pulse(loud, dist) {
    const c = this.d.camera.position;
    this.d.pulses.emit(c.x, c.y - 0.3, c.z, this.clock, {
      radius: Math.max(dist + 9, 14 + 40 * loud), strength: 0.7 + loud * 0.5, speed: SPLASH.wave, decay: 0.5, color: [0.84, 0.92, 1.0], kind: 'player',
    });
  }

  _eyes() {
    const rig = this.rig, h = rig.nodes.head;
    rig.root.updateMatrixWorld(true);
    const v = h.getWorldPosition(rig.root.position.clone());
    const yaw = rig.root.rotation.y;
    const far = Math.hypot(v.x - this.spot.x, v.z - this.spot.z);
    this.d.eyes.add(v.x + Math.sin(yaw) * 0.09, v.y + 0.06, v.z + Math.cos(yaw) * 0.09, yaw, {
      time: this.clock, life: 0.9, intensity: 0.95, blink: true, spacing: 0.26, size: 0.16 + far * 0.006,
    });
  }

  _scream(tt) {
    const d = this.d, rig = this.rig;
    if (!this.screamed) {
      this.screamed = true;
      if (this.ghost) { d.ghosts.release(this.ghost); this.ghost = null; }
      d.audio?.jumpscare?.(this.reduced ? 0.45 : 1);
      this.white = this.reduced ? 0 : 0.85;
      this.red = 0.7;
      this.glitch = 1;
      this.shake = 1;
    }
    // in your face: its head a metre in front of your eyes (the kill's own framing)
    poseScream(rig, tt);
    const cam = d.camera, fx = -Math.sin(this.spot.yaw), fz = -Math.cos(this.spot.yaw);
    const r = rig.root;
    r.position.set(0, 0, 0);
    r.rotation.set(0, Math.atan2(-fx, -fz), 0);
    r.updateMatrixWorld(true);
    const hv = rig.nodes.head.getWorldPosition(r.position.clone());
    const lunge = Math.max(0, 1 - tt * 5);
    const dist = 1.05 + lunge * 1.8;
    r.position.set(cam.position.x + fx * dist - hv.x, this.spot.eye - hv.y + 0.12, cam.position.z + fz * dist - hv.z);
    const strobe = this.reduced ? 1 : (Math.floor(tt * 14) % 2 === 0 ? 1.6 : 0.35);
    if (!this.screamGhost) this.screamGhost = d.ghosts.spawn(rig, this.clock, { sticky: true, strength: strobe, full: 1, color: 0xff3020 });
    else { d.ghosts.refresh(this.screamGhost, rig); this.screamGhost.strength = strobe; }
    this.glitch = Math.max(this.glitch, 0.6);
    this.red = Math.max(this.red, 0.4);
    this.shake = Math.max(this.shake, this.reduced ? 0.35 : 0.8 - tt * 0.3);
    if (tt > SPLASH.screamFor * 0.7) this.fade = Math.max(0, 1 - (tt - SPLASH.screamFor * 0.7) * 4);
  }

  _camera(dt) {
    const cam = this.d.camera, s = this.spot, c = this.clock;
    this.shake = Math.max(0, this.shake - dt * 1.6);
    const sh = this.shake * this.shake;
    const n1 = Math.sin(c * 71.3) * Math.sin(c * 23.1), n2 = Math.sin(c * 61.7 + 1.3) * Math.sin(c * 17.9), n3 = Math.sin(c * 53.1 + 2.1);
    cam.position.set(s.x, s.eye, s.z);
    cam.rotation.set(0.02 + Math.sin(c * 0.37) * 0.012 + sh * 0.05 * n1, s.yaw + Math.sin(c * 0.23) * 0.015 + sh * 0.07 * n2, sh * 0.09 * n3, 'YXZ');
    if (Math.abs(cam.fov - 58) > 0.01) { cam.fov = 58; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    this.d.shared.uCam.value.copy(cam.position);
  }

  _post(dt) {
    const u = this.d.post.u;
    if (!this.screamed) this.fade = Math.min(1, this.fade + dt * (this.state === 'run' ? 0.9 : 0.5));
    this.white = Math.max(0, this.white - dt * 2.4);
    this.red = Math.max(0, this.red - dt * 0.9);
    this.glitch = Math.max(0, this.glitch - dt * 1.4);
    u.uAberr.value = 0.2 + this.glitch * 0.9 + this.shake * 0.4;
    u.uGlitch.value = this.glitch;
    u.uPsych.value = 0;
    u.uRed.value = this.red;
    u.uWhite.value = this.white;
    u.uDanger.value = this.screamed ? 0.8 : this.act * 0.12;
    u.uGrain.value = 0.07 + this.glitch * 0.1;
    u.uShockAmp.value = 0;
    u.uFade.value = this.fade;
    u.uWarm.value = 0;
    u.uFlicker.value = 0;
    u.uAsh.value = 0.62;
    this.d.shared.uDawn.value = 0;
    this.d.shared.uFear.value = 0;
  }

  // for the harness and the screenshots: the frame at track time T (silently)
  seek(T) {
    if (this.el) try { this.el.pause(); } catch { /* fine */ }
    const keep = this.onDone;
    this.d.ghosts.clear();
    this.d.pulses.clear();
    this.d.eyes.clear();
    this.begin(keep, { silent: true });
    const dt = 1 / 60;
    while (this.t + dt <= T) this.update(dt);
  }

  finish() {
    if (this.state === 'done') return;
    this.state = 'done';
    const d = this.d;
    if (this.el) {
      const el = this.el, v0 = el.volume;
      let k = 1;
      const fade = setInterval(() => {
        k -= 0.2;
        if (k <= 0) { clearInterval(fade); try { el.pause(); } catch { /* fine */ } }
        else el.volume = v0 * k;
      }, 40);
    }
    d.ghosts.clear();
    d.pulses.clear();
    d.eyes.clear();
    const u = d.post.u;
    u.uWhite.value = 0;
    u.uRed.value = 0;
    u.uGlitch.value = 0;
    u.uFade.value = 0; // the menu fades in from black, as it always has
    this._ui(true);
    const cb = this.onDone;
    this.onDone = null;
    if (cb) cb();
  }

  // a line in the dark («press any key») and, once it plays, the faint «any key to skip»
  _ui(remove = false) {
    if (typeof document === 'undefined' || !document.createElement) return;
    if (remove) { this.box?.remove?.(); this.box = null; return; }
    const box = document.createElement('div');
    box.className = 'splash-ui';
    box.innerHTML = '<div class="splash-line"></div><div class="splash-skip"></div>';
    document.body?.appendChild?.(box);
    this.box = box;
    this.lineEl = box.querySelector?.('.splash-line');
    this.skipEl = box.querySelector?.('.splash-skip');
  }

  _setLine(text) {
    if (this.lineEl) this.lineEl.textContent = text || '';
    if (this.skipEl) this.skipEl.textContent = this.state === 'run' ? t('splashSkip') : '';
    this.box?.classList?.toggle?.('gate', !!text);
  }
}
