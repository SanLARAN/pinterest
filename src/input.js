import { clamp } from './noise.js';

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'fire', KeyJ: 'fire', KeyZ: 'fire',
  ShiftLeft: 'boost', ShiftRight: 'boost', KeyK: 'boost', KeyX: 'boost',
};
const EDGE = {
  Escape: 'pause', KeyP: 'pause',
  KeyR: 'restart',
  Enter: 'confirm', NumpadEnter: 'confirm', Space: 'confirm',
  KeyM: 'mute',
  KeyC: 'camera',
  Backquote: 'fps', F3: 'fps',
  ArrowUp: 'nav-up', ArrowDown: 'nav-down', ArrowLeft: 'nav-left', ArrowRight: 'nav-right',
  KeyW: 'nav-up', KeyS: 'nav-down', KeyA: 'nav-left', KeyD: 'nav-right',
  Backspace: 'back',
};

/**
 * Unified input: keyboard (+ smoothed digital steering), mouse fire,
 * floating touch stick + buttons, and standard gamepads.
 */
export class Input {
  constructor() {
    this.codes = new Set();
    this.held = new Set();
    this.edges = new Set();
    this.letters = [];
    this.state = { throttle: 0, brake: 0, steer: 0, fire: false, boost: false };
    this.kSteer = 0;
    this.mouseFire = false;
    this.touchMode = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.t = { stickId: null, ox: 0, oy: 0, steer: 0, fire: false, drift: false, boost: false };
    this.gpPrev = [];
    this.anyPress = false;
    this.lastKeyTime = 0;
    this.onModeChange = null;
    this.listeners();
  }

  setTouchMode(on) {
    if (this.touchMode === on) return;
    this.touchMode = on;
    if (this.onModeChange) this.onModeChange(on);
  }

  listeners() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      const a = KEYMAP[e.code];
      if (a || EDGE[e.code]) {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      }
      if (e.repeat) return;
      if (a) this.codes.add(e.code);
      const ed = EDGE[e.code];
      if (ed) this.edges.add(ed);
      if (e.code.startsWith('Key') && e.code.length === 4) this.letters.push(e.code.slice(3));
      this.anyPress = true;
      this.setTouchMode(false);
    }, { passive: false });
    window.addEventListener('keyup', (e) => {
      this.codes.delete(e.code);
    });
    window.addEventListener('blur', () => { this.codes.clear(); this.mouseFire = false; this.resetTouch(); });
    const canvas = document.getElementById('game');
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { this.mouseFire = true; this.anyPress = true; } });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseFire = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('touchstart', () => this.setTouchMode(true), { passive: true });
    this.bindTouch();
  }

  resetTouch() {
    const t = this.t;
    t.stickId = null; t.steer = 0; t.fire = false; t.drift = false; t.boost = false;
    const knob = document.getElementById('stick-knob');
    const base = document.getElementById('stick-base');
    if (base) base.classList.remove('on');
    if (knob) knob.style.transform = 'translate(-50%, -50%)';
    document.querySelectorAll('.tbtn').forEach((b) => b.classList.remove('down'));
  }

  bindTouch() {
    const zone = document.getElementById('stick-zone');
    const base = document.getElementById('stick-base');
    const knob = document.getElementById('stick-knob');
    if (!zone) return;
    const R = 62;
    const t = this.t;
    zone.addEventListener('pointerdown', (e) => {
      if (t.stickId !== null) return;
      e.preventDefault();
      t.stickId = e.pointerId;
      t.ox = e.clientX; t.oy = e.clientY;
      try { zone.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      base.style.left = t.ox + 'px';
      base.style.top = t.oy + 'px';
      base.classList.add('on');
      knob.style.transform = 'translate(-50%, -50%)';
      this.anyPress = true;
      if (e.pointerType === 'touch') this.setTouchMode(true);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== t.stickId) return;
      let dx = e.clientX - t.ox;
      // floating origin: drag it along so reversing direction is instant
      if (dx > R) { t.ox += dx - R; dx = R; }
      if (dx < -R) { t.ox += dx + R; dx = -R; }
      base.style.left = t.ox + 'px';
      const v = dx / R;
      const dz = 0.08;
      const a = Math.abs(v) < dz ? 0 : (Math.abs(v) - dz) / (1 - dz);
      t.steer = Math.sign(v) * Math.pow(a, 1.2);
      knob.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
    });
    const end = (e) => {
      if (e.pointerId !== t.stickId) return;
      t.stickId = null;
      t.steer = 0;
      base.classList.remove('on');
      knob.style.transform = 'translate(-50%, -50%)';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    const btn = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        t[key] = true;
        el.classList.add('down');
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        this.anyPress = true;
        if (e.pointerType === 'touch') this.setTouchMode(true);
      });
      const up = () => { t[key] = false; el.classList.remove('down'); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
    };
    btn('btn-fire', 'fire');
    btn('btn-drift', 'drift');
    btn('btn-boost', 'boost');
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) return null;
    const b = (i) => (gp.buttons[i] ? gp.buttons[i].value || (gp.buttons[i].pressed ? 1 : 0) : 0);
    const pressed = (i) => b(i) > 0.5;
    const edge = (i, name) => {
      const now = pressed(i);
      if (now && !this.gpPrev[i]) { this.edges.add(name); this.anyPress = true; }
      this.gpPrev[i] = now;
    };
    edge(9, 'pause'); edge(8, 'restart'); edge(0, 'confirm'); edge(1, 'back');
    edge(12, 'nav-up'); edge(13, 'nav-down'); edge(14, 'nav-left'); edge(15, 'nav-right');
    let ax = gp.axes[0] || 0;
    if (Math.abs(ax) < 0.15) ax = 0;
    if (pressed(14)) ax = -1;
    if (pressed(15)) ax = 1;
    return {
      steer: ax,
      throttle: Math.max(b(7), (gp.axes[1] || 0) < -0.6 ? 1 : 0),
      brake: Math.max(b(6), (gp.axes[1] || 0) > 0.6 ? 1 : 0),
      fire: pressed(0) || pressed(2),
      boost: pressed(1) || pressed(5) || pressed(3),
      drift: pressed(4),
    };
  }

  update(dt) {
    const h = this.held;
    h.clear();
    for (const c of this.codes) { const a = KEYMAP[c]; if (a) h.add(a); }
    // smoothed digital steering (fast in, faster out)
    const want = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    if (want !== 0) {
      if (Math.sign(this.kSteer) !== want && this.kSteer !== 0) this.kSteer = 0;
      this.kSteer = clamp(this.kSteer + want * dt * 9, -1, 1);
    } else {
      const d = dt * 14;
      this.kSteer = Math.abs(this.kSteer) <= d ? 0 : this.kSteer - Math.sign(this.kSteer) * d;
    }
    const s = this.state;
    s.steer = this.kSteer;
    s.throttle = h.has('up') ? 1 : 0;
    s.brake = h.has('down') ? 1 : 0;
    s.fire = h.has('fire') || this.mouseFire;
    s.boost = h.has('boost');
    const gp = this.pollGamepad();
    if (gp) {
      if (Math.abs(gp.steer) > Math.abs(s.steer)) s.steer = gp.steer;
      s.throttle = Math.max(s.throttle, gp.throttle);
      s.brake = Math.max(s.brake, gp.brake, gp.drift ? 1 : 0);
      s.fire = s.fire || gp.fire;
      s.boost = s.boost || gp.boost;
      if (gp.throttle > 0.1 || gp.fire || Math.abs(gp.steer) > 0.3) this.setTouchMode(false);
    }
    const t = this.t;
    if (this.touchMode) {
      if (Math.abs(t.steer) > Math.abs(s.steer)) s.steer = t.steer;
      s.fire = s.fire || t.fire;
      s.boost = s.boost || t.boost;
      if (t.drift) s.brake = 1;
      // auto-gas on touch (unless braking / reversing)
      if (!t.drift) s.throttle = Math.max(s.throttle, 1);
    }
  }

  /** Edge-triggered action this frame? (consumes it) */
  take(name) {
    if (this.edges.has(name)) { this.edges.delete(name); return true; }
    return false;
  }

  takeLetter() {
    return this.letters.length ? this.letters.shift() : null;
  }

  endFrame() {
    this.edges.clear();
    this.letters.length = 0;
    this.anyPress = false;
  }
}
