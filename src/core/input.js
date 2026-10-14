// Unified keyboard, mouse and touch input. Gameplay buttons are latched per
// simulation frame so a tap is never lost or double-counted.

const KEY_MAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'attack', KeyJ: 'attack',
  ShiftLeft: 'dash', ShiftRight: 'dash', KeyK: 'dash',
  Escape: 'pause', KeyP: 'pause',
  Tab: 'stats',
  KeyQ: 'skill1', KeyE: 'skill2', KeyC: 'skill3',
  Enter: 'confirm', NumpadEnter: 'confirm',
  KeyR: 'restart',
  KeyM: 'mute',
  Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4', Digit5: 'slot5', Digit6: 'slot6',
  KeyB: 'buy', KeyT: 'trade', KeyX: 'sell', KeyF: 'cycle', // merchant shortcuts
  F3: 'debug', Backquote: 'debug',
};
const GAME_EDGES = new Set(['attack', 'dash']);
const STICK_RADIUS = 64;

export class Input {
  constructor() {
    this.keys = new Set();
    this.edges = new Set();
    this.latched = new Set();
    this.move = { x: 0, z: 0 };
    this.aimActive = false;
    this.manualAim = false;
    this.aimAngle = 0;
    this.mouseAim = null; // angle to cursor on the ground, set by the game each frame
    this.mouse = { x: 0, y: 0, active: false };
    this.mouseDown = false;
    this.attackHeld = false;
    this.touchMode = false;
    this.touch = { left: null, right: null };
    this.onAction = null; // (action) => void, for menu/UI-level actions
    this.onPointerInGame = null;
    this.onBlur = null;
    this.bindings = [];
    this.bindAll();
  }

  bindAll() {
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      this.bindings.push(() => target.removeEventListener(type, fn, opts));
    };
    on(window, 'keydown', (e) => this.keyDown(e));
    on(window, 'keyup', (e) => this.keyUp(e));
    on(window, 'blur', () => this.releaseAll());
    on(window, 'pointerdown', (e) => this.pointerDown(e));
    on(window, 'pointermove', (e) => this.pointerMove(e));
    on(window, 'pointerup', (e) => this.pointerUp(e));
    on(window, 'pointercancel', (e) => this.pointerUp(e));
    on(window, 'contextmenu', (e) => { if (!this.isUiTarget(e.target)) e.preventDefault(); });
  }

  destroy() {
    for (const f of this.bindings) f();
    this.bindings = [];
  }

  isTyping(target) {
    return target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  }

  isUiTarget(target) {
    return !!(target && target.closest && target.closest('button, input, textarea, select, a, label, .screen-panel, .no-game'));
  }

  keyDown(e) {
    if (this.isTyping(e.target)) {
      if (e.code === 'Escape') e.target.blur();
      return;
    }
    const action = KEY_MAP[e.code];
    if (action === 'attack' || action === 'confirm' || action === 'dash' || action === 'up' || action === 'down' || action === 'left' || action === 'right') {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    }
    if (action === 'stats') e.preventDefault(); // TAB must not move focus
    this.keys.add(e.code);
    if (!action || e.repeat) return;
    this.touchMode = false;
    if (GAME_EDGES.has(action)) this.edges.add(action);
    else if (this.onAction) this.onAction(action);
    // Space both attacks in play and confirms in menus.
    if (e.code === 'Space' && this.onAction) this.onAction('confirm');
  }

  keyUp(e) {
    this.keys.delete(e.code);
  }

  releaseAll() {
    this.keys.clear();
    this.attackHeld = false;
    this.mouseDown = false;
    this.touch.left = null;
    this.touch.right = null;
    if (this.onBlur) this.onBlur();
  }

  pointerDown(e) {
    if (this.isUiTarget(e.target)) return;
    if (e.pointerType === 'touch') {
      this.touchMode = true;
      const w = window.innerWidth;
      const slot = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 };
      if (e.clientX < w * 0.5) {
        if (!this.touch.left) this.touch.left = slot;
      } else if (!this.touch.right) {
        this.touch.right = slot;
        this.edges.add('attack'); // tap to swing immediately
      }
      e.preventDefault?.();
      return;
    }
    // mouse / pen
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
    if (e.button === 0) {
      this.mouseDown = true;
      this.edges.add('attack');
    } else if (e.button === 2) {
      this.edges.add('dash');
    }
    if (this.onPointerInGame) this.onPointerInGame(e);
  }

  pointerMove(e) {
    if (e.pointerType === 'touch') {
      for (const k of ['left', 'right']) {
        const s = this.touch[k];
        if (s && s.id === e.pointerId) {
          s.x = e.clientX;
          s.y = e.clientY;
          s.moved = Math.max(s.moved, Math.hypot(s.x - s.ox, s.y - s.oy));
        }
      }
      return;
    }
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
  }

  pointerUp(e) {
    if (e.pointerType === 'touch') {
      for (const k of ['left', 'right']) {
        const s = this.touch[k];
        if (s && s.id === e.pointerId) this.touch[k] = null;
      }
      return;
    }
    if (e.button === 0) this.mouseDown = false;
  }

  /** Dash button and other DOM-bound gameplay buttons. */
  press(action) {
    this.touchMode = true;
    if (GAME_EDGES.has(action)) this.edges.add(action);
    else if (this.onAction) this.onAction(action);
  }

  justPressed(action) {
    return this.latched.has(action);
  }

  /** Moves this frame's presses into the latch the simulation will consume. */
  latch() {
    for (const a of this.edges) this.latched.add(a);
    this.edges.clear();
  }

  clearLatched() {
    this.latched.clear();
  }

  /** Recomputes move/aim/attack state from raw devices. Call once per rendered frame. */
  update() {
    // keyboard
    let kx = 0;
    let kz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kz += 1;
    const kl = Math.hypot(kx, kz);
    if (kl > 1) {
      kx /= kl;
      kz /= kl;
    }
    // left stick
    let sx = 0;
    let sz = 0;
    const L = this.touch.left;
    if (L) {
      sx = (L.x - L.ox) / STICK_RADIUS;
      sz = (L.y - L.oy) / STICK_RADIUS;
      const m = Math.hypot(sx, sz);
      if (m > 1) {
        sx /= m;
        sz /= m;
      }
    }
    const mx = sx || sz ? sx : kx;
    const mz = sx || sz ? sz : kz;
    this.move.x = mx;
    this.move.z = mz;

    // aim: touch right stick overrides mouse; mouse aim is set by the game
    let aimX = 0;
    let aimZ = 0;
    let rightMag = 0;
    const R = this.touch.right;
    if (R) {
      aimX = (R.x - R.ox) / STICK_RADIUS;
      aimZ = (R.y - R.oy) / STICK_RADIUS;
      rightMag = Math.hypot(aimX, aimZ);
      if (rightMag > 1) {
        aimX /= rightMag;
        aimZ /= rightMag;
        rightMag = 1;
      }
    }
    // manualAim: the player is steering the aim directly (touch stick or mouse).
    if (rightMag > 0.18) {
      this.manualAim = true;
      this.aimActive = true;
      this.aimAngle = Math.atan2(aimX, aimZ);
    } else if (this.mouse.active && this.mouseAim !== null && !this.touchMode) {
      this.manualAim = true;
      this.aimActive = true;
      this.aimAngle = this.mouseAim;
    } else {
      this.manualAim = false;
      this.aimActive = false;
    }
    // Holding Space / J keeps swinging (hero cooldown paces the strikes).
    const keyHeld = this.keys.has('Space') || this.keys.has('KeyJ');
    this.attackHeld = this.mouseDown || rightMag > 0.4 || keyHeld;
  }
}
