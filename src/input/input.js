// ============================================================
// INPUT — keyboard + mouse (pointer lock) + touch (dynamic sticks).
// Writes into a single state object the player controller reads.
// ============================================================
import { clamp } from '../core/util.js';

export function createState() {
  return {
    ax: 0, az: 0,
    lookDX: 0, lookDY: 0,
    sprint: false, crouch: false, breath: false,
    ping: false, pingHeld: false, shout: false, use: false,
    pressed: {},           // one-shot presses this frame
    pointerLocked: false,
    touch: false,
  };
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
  ControlLeft: 'crouch', ControlRight: 'crouch', KeyC: 'crouch',
  KeyQ: 'breath',
  Space: 'ping', KeyX: 'shout', KeyE: 'use', KeyF: 'use',
  Escape: 'pause', Tab: 'notes', KeyR: 'restart', KeyP: 'pause',
  Enter: 'confirm', KeyN: 'skip', KeyM: 'mute',
  Digit1: 'slot1', Digit2: 'slot2',
};

export class Input {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.s = createState();
    this.keys = {};
    this.sens = opts.sens ?? 1.0;
    this.invert = false;
    this.enabled = true;
    this.lookMode = 'lock';       // 'lock' | 'drag'
    this.lockTimer = 0;
    this.onLookMode = opts.onLookMode || null;
    this.touchActive = false;
    this.pointers = new Map();
    this.onLockChange = opts.onLockChange || (() => {});
    this.moveOrigin = null;
    this.lookPointer = null;
    this.knobL = document.getElementById('tKnobL');
    this.knobR = document.getElementById('tKnobR');
    this.stickR = document.getElementById('tStickR');
    this.lookOrigin = null;
    this.stickL = document.getElementById('tStickL');
    this.bind();
  }

  bind() {
    const c = this.canvas;
    window.addEventListener('keydown', (e) => this.onKey(e, true), { passive: false });
    window.addEventListener('keyup', (e) => this.onKey(e, false), { passive: false });
    window.addEventListener('blur', () => { this.keys = {}; this.clearButtons(); });

    c.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      if (e.pointerType === 'touch') return;
      // always arm drag-look: some embeds refuse pointer lock without telling us
      this.dragId = e.pointerId; this.lastX = e.clientX; this.lastY = e.clientY;
      if (!this.s.pointerLocked && this.lookMode === 'lock') this.requestLock();
      if (e.button === 0) { this.s.ping = true; this.s.pressed.ping = true; }
      if (e.button === 2) { this.s.breath = true; }
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button === 0) this.s.ping = false;
      if (e.button === 2) this.s.breath = false;
      if (this.dragId === e.pointerId) this.dragId = null;
    });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      if (e.pointerType === 'touch') return;
      let dx = 0, dy = 0;
      if (this.s.pointerLocked) { dx = e.movementX || 0; dy = e.movementY || 0; }
      else if (this.dragId === e.pointerId) { dx = e.clientX - this.lastX; dy = e.clientY - this.lastY; this.lastX = e.clientX; this.lastY = e.clientY; }
      if (dx || dy) { this.s.lookDX += dx * this.sens; this.s.lookDY += dy * this.sens; }
    }, { passive: true });

    document.addEventListener('pointerlockchange', () => {
      this.s.pointerLocked = document.pointerLockElement === c;
      if (this.s.pointerLocked) { clearTimeout(this.lockTimer); if (this.lookMode !== 'lock') { this.lookMode = 'lock'; if (this.onLookMode) this.onLookMode('lock'); } }
      this.onLockChange(this.s.pointerLocked);
    });
    document.addEventListener('pointerlockerror', () => this.setDragLook());

    // -------- touch --------
    this.touchRoot = document.getElementById('touch');
    const zone = (el, role) => {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => this.touchDown(e, role, el));
      el.addEventListener('pointermove', (e) => this.touchMove(e, role, el));
      el.addEventListener('pointerup', (e) => this.touchUp(e, role, el));
      el.addEventListener('pointercancel', (e) => this.touchUp(e, role, el));
      el.addEventListener('lostpointercapture', (e) => this.touchUp(e, role, el));
    };
    zone(document.getElementById('tStickL'), 'move');
    zone(document.getElementById('tLook'), 'look');

    const btn = (id, down, up) => {
      const el = document.getElementById(id);
      if (!el) return;
      const set = (on) => { el.classList.toggle('on', on); };
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); set(true); down && down(); try { el.setPointerCapture(e.pointerId); } catch (err) {} });
      const off = (e) => { e && e.stopPropagation && e.stopPropagation(); set(false); up && up(); };
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    };
    btn('btnPing', () => { this.s.ping = true; this.s.pressed.ping = true; }, () => { this.s.ping = false; });
    btn('btnUse', () => { this.s.use = true; }, () => { this.s.use = false; });
    btn('btnRun', () => { this.s.sprint = true; }, () => { this.s.sprint = false; });
    btn('btnCrouch', () => { this.s.breath = !this.s.breath; }, null);
    btn('btnShout', () => { this.s.pressed.shout = true; this.s.shout = true; }, () => { this.s.shout = false; });
    btn('btnPause', () => { this.s.pressed.pause = true; }, null);
    // the right stick floats to wherever the thumb lands, so look input is visible
    if (this.stickR) { this.stickR.style.pointerEvents = 'none'; this.stickR.style.opacity = '0'; }
  }

  clearButtons() {
    this.s.ping = false; this.s.use = false; this.s.sprint = false; this.s.breath = false; this.s.shout = false;
  }

  detectTouch() {
    const t = window.matchMedia && window.matchMedia('(hover:none) and (pointer:coarse)').matches;
    this.touchActive = t || this.touchActive;
    this.s.touch = this.touchActive;
    if (this.touchRoot) this.touchRoot.classList.toggle('hidden', !this.touchActive);
    return this.touchActive;
  }
  forceTouch(on) {
    this.touchActive = on;
    this.detectTouch();
  }

  requestLock() {
    try {
      const p = this.canvas.requestPointerLock({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => { try { this.canvas.requestPointerLock(); } catch (e) {} });
    } catch (e) { try { this.canvas.requestPointerLock(); } catch (e2) {} }
    clearTimeout(this.lockTimer);
    this.lockTimer = setTimeout(() => { if (!this.s.pointerLocked) this.setDragLook(); }, 900);
  }
  /** Sandbox/iframes can deny pointer lock silently — drag-look keeps the game playable. */
  setDragLook() {
    clearTimeout(this.lockTimer);
    if (this.lookMode === 'drag') return;
    this.lookMode = 'drag';
    if (this.onLookMode) this.onLookMode('drag');
  }
  exitLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  onKey(e, down) {
    const tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) {
      if (e.code === 'Escape') tgt.blur();
      return;
    }
    const k = KEYMAP[e.code];
    if (e.code === 'Tab' || (e.code === 'Space' && this.enabled)) e.preventDefault();
    if (!k) return;
    if (down && !e.repeat) this.s.pressed[k] = true;
    this.keys[k] = down && !e.repeat ? true : down ? this.keys[k] : false;
    if (down) this.keys[k] = true; else this.keys[k] = false;
  }

  // -------- touch handlers --------
  touchDown(e, role, el) {
    this.detectTouch();
    if (role === 'move') {
      this.movePointer = e.pointerId;
      const r = el.getBoundingClientRect();
      this.moveOrigin = { x: e.clientX, y: e.clientY, r: r.width * 0.36 };
      if (this.knobL) {
        this.knobL.style.transition = 'none';
        this.knobL.style.left = (e.clientX - r.left) + 'px';
        this.knobL.style.top = (e.clientY - r.top) + 'px';
        this.knobL.style.margin = '-8vmin';
        el.style.opacity = '0.85';
      }
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    } else if (role === 'look') {
      this.lookPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      if (this.stickR) {
        const w = this.stickR.offsetWidth || 160;
        this.lookOrigin = { x: e.clientX, y: e.clientY, r: w * 0.36 };
        this.stickR.style.left = (e.clientX - w / 2) + 'px';
        this.stickR.style.top = (e.clientY - w / 2) + 'px';
        this.stickR.style.right = 'auto';
        this.stickR.style.bottom = 'auto';
        this.stickR.style.opacity = '0.8';
        if (this.knobR) {
          this.knobR.style.transition = 'none';
          this.knobR.style.left = '50%'; this.knobR.style.top = '50%';
        }
      }
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }
  touchMove(e, role, el) {
    if (role === 'move' && this.movePointer === e.pointerId && this.moveOrigin) {
      const o = this.moveOrigin;
      let dx = (e.clientX - o.x) / o.r, dy = (e.clientY - o.y) / o.r;
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      this.s.ax = dx; this.s.az = -dy;
      if (this.knobL) {
        const r = el.getBoundingClientRect();
        this.knobL.style.left = (o.x + dx * o.r - r.left) + 'px';
        this.knobL.style.top = (o.y + dy * o.r - r.top) + 'px';
      }
      this.s.sprint = m > 0.94;
    } else if (role === 'look' && this.lookPointer && this.lookPointer.id === e.pointerId) {
      const dx = e.clientX - this.lookPointer.x, dy = e.clientY - this.lookPointer.y;
      this.lookPointer.x = e.clientX; this.lookPointer.y = e.clientY;
      this.s.lookDX += dx * this.sens * 1.6;
      this.s.lookDY += dy * this.sens * 1.6;
      if (this.knobR && this.lookOrigin) {
        const o = this.lookOrigin;
        let nx = (e.clientX - o.x) / o.r, ny = (e.clientY - o.y) / o.r;
        const m = Math.hypot(nx, ny);
        if (m > 1) { nx /= m; ny /= m; }
        this.knobR.style.left = `calc(50% + ${(nx * o.r).toFixed(1)}px)`;
        this.knobR.style.top = `calc(50% + ${(ny * o.r).toFixed(1)}px)`;
      }
    }
  }
  touchUp(e, role, el) {
    if (role === 'move' && (!this.movePointer || this.movePointer === e.pointerId)) {
      this.movePointer = null; this.moveOrigin = null;
      this.s.ax = 0; this.s.az = 0;
      if (!this.keys.sprint) this.s.sprint = false;
      if (this.knobL) {
        this.knobL.style.transition = '';
        this.knobL.style.left = '50%'; this.knobL.style.top = '50%';
        el.style.opacity = '';
      }
    } else if (role === 'look' && this.lookPointer && this.lookPointer.id === e.pointerId) {
      this.lookPointer = null;
      this.lookOrigin = null;
      if (this.stickR) this.stickR.style.opacity = '0';
      if (this.knobR) { this.knobR.style.transition = ''; this.knobR.style.left = '50%'; this.knobR.style.top = '50%'; }
    }
  }

  /** Called once per frame AFTER the game read the state. */
  endFrame() {
    this.s.lookDX = 0; this.s.lookDY = 0;
    this.s.pressed = {};
  }

  /** Push input state into a player controller. */
  apply(player, opts = {}) {
    const s = this.s;
    const k = this.keys;
    let ax = clamp(s.ax + (k.right ? 1 : 0) - (k.left ? 1 : 0), -1, 1);
    let az = clamp(s.az + (k.up ? 1 : 0) - (k.down ? 1 : 0), -1, 1);
    player.inputs.ax = ax;
    player.inputs.az = az;
    player.inputs.f = 0; player.inputs.b = 0; player.inputs.l = 0; player.inputs.r = 0;
    player.inputs.sprint = s.sprint || !!k.sprint;
    player.inputs.crouch = s.crouch || !!k.crouch;
    player.crouch = !!player.inputs.crouch;
    player.inputs.breath = s.breath || !!k.breath;
    player.tYaw -= s.lookDX * 0.0026;
    player.tPitch -= s.lookDY * 0.0022 * (this.invert ? -1 : 1);
    player.tPitch = clamp(player.tPitch, -1.35, 1.35);
  }

  get pingHeld() { return !!(this.s.ping || this.keys.ping); }
  get useHeld() { return !!(this.s.use || this.keys.use); }
}
