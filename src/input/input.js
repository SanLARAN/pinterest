// Unified input: keyboard (layout-independent codes), mouse (pointer lock w/ drag fallback), touch.
import { settings } from '../core/storage.js';

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
  'ShiftLeft', 'ShiftRight', 'KeyC', 'KeyF', 'KeyM', 'KeyP', 'KeyR', 'KeyQ', 'KeyE', 'Tab',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.move = { x: 0, y: 0 };
    this.lookDX = 0;
    this.lookDY = 0;
    this.turn = 0;
    this.sprint = false;
    this.crouch = false;
    this.pingHeld = false;
    this.peekHeld = false; // Tab (or a tap on the top strip on touch): show time + score
    this.peekTouchUntil = 0;
    this.events = [];
    this.locked = false;
    this.lockFailed = false;
    this.touch = false;
    this.gameActive = false; // true while a run is being played (not paused)
    this.joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0, mag: 0 };
    this.look = { id: -1, x: 0, y: 0 };
    this.mouseDrag = { down: false, x: 0, y: 0, moved: 0, t: 0 };
    this._bind();
  }

  emit(type) {
    this.events.push(type);
  }
  consume() {
    const e = this.events;
    this.events = [];
    return e;
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
        if (e.code === 'Enter' || e.code === 'Escape') e.target.blur();
        return;
      }
      if (GAME_KEYS.has(e.code) && this.gameActive) e.preventDefault();
      if (e.code === 'Space') e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      switch (e.code) {
        case 'Space':
          this.pingHeld = true;
          this.emit('pingDown');
          break;
        case 'KeyF':
          this.emit('throw');
          break;
        case 'KeyC':
          this.crouch = !this.crouch;
          this.emit('crouch');
          break;
        case 'KeyM':
          this.emit('mic');
          break;
        case 'Tab':
          this.peekHeld = true;
          break;
        case 'Escape':
        case 'KeyP':
          this.emit('pause');
          break;
        case 'KeyR':
          this.emit('restart');
          break;
        case 'Enter':
        case 'NumpadEnter':
          this.emit('confirm');
          break;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Tab') this.peekHeld = false;
      if (e.code === 'Space' && this.pingHeld) {
        this.pingHeld = false;
        this.emit('pingUp');
      }
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.peekHeld = false;
      if (this.pingHeld) {
        this.pingHeld = false;
        this.emit('pingUp');
      }
      this.emit('blur');
    });

    // ---- mouse ----
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('mousedown', (e) => {
      if (this.touch) return;
      if (!this.gameActive) return;
      if (!this.locked && !this.lockFailed) {
        this.requestLock(true);
        return;
      }
      if (e.button === 0) {
        if (this.locked) {
          this.pingHeld = true;
          this.emit('pingDown');
        } else {
          this.mouseDrag = { down: true, x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
        }
      } else if (e.button === 2) this.emit('throw');
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      if (this.locked && this.pingHeld && !this.keys.has('Space')) {
        this.pingHeld = false;
        this.emit('pingUp');
      }
      if (this.mouseDrag.down) {
        const md = this.mouseDrag;
        md.down = false;
        if (md.moved < 6 && performance.now() - md.t < 300 && this.gameActive) {
          this.emit('pingDown');
          this.emit('pingUp');
        }
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (this.locked) {
        // ignore absurd spikes some browsers produce on lock
        if (Math.abs(e.movementX) < 400 && Math.abs(e.movementY) < 400) {
          this.lookDX += e.movementX;
          this.lookDY += e.movementY;
        }
      } else if (this.mouseDrag.down) {
        const dx = e.clientX - this.mouseDrag.x, dy = e.clientY - this.mouseDrag.y;
        this.mouseDrag.moved += Math.abs(dx) + Math.abs(dy);
        this.mouseDrag.x = e.clientX;
        this.mouseDrag.y = e.clientY;
        this.lookDX += dx * 1.4;
        this.lookDY += dy * 1.4;
      }
    });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === this.canvas;
      if (this.locked) this.lockFails = 0;
      if (was && !this.locked) {
        if (this.pingHeld) {
          this.pingHeld = false;
          this.emit('pingUp');
        }
        this.emit('unlock');
      }
    });
    document.addEventListener('pointerlockerror', () => {
      // only count here for browsers whose requestPointerLock() doesn't return a promise
      if (this._reqFromClick && !this._reqPromise) {
        this.lockFails = (this.lockFails || 0) + 1;
        if (this.lockFails >= 2) this.lockFailed = true;
      }
    });

    // ---- touch (pointer events) ----
    window.addEventListener('touchstart', () => this.setTouch(true), { passive: true, once: true });
  }

  requestLock(fromClick = false) {
    if (this.touch || this.locked) return;
    const c = this.canvas;
    this._reqFromClick = fromClick;
    if (!c.requestPointerLock) {
      this.lockFailed = true;
      return;
    }
    const fail = () => {
      if (!fromClick) return;
      this.lockFails = (this.lockFails || 0) + 1;
      if (this.lockFails >= 2) this.lockFailed = true;
    };
    try {
      const p = c.requestPointerLock({ unadjustedMovement: true });
      this._reqPromise = !!(p && p.catch);
      if (p && p.catch) {
        p.catch((err) => {
          // unadjustedMovement unsupported -> retry plain
          if (err && err.name === 'NotSupportedError') {
            try {
              const p2 = c.requestPointerLock();
              if (p2 && p2.catch) p2.catch(fail);
            } catch {
              fail();
            }
          } else fail();
        });
      }
    } catch {
      this._reqPromise = false;
      try { c.requestPointerLock(); } catch { fail(); }
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  setTouch(on) {
    if (this.touch === on) return;
    this.touch = on;
    document.body.classList.toggle('touch', on);
  }

  bindTouchUI(el) {
    const zoneJoy = el.querySelector('#joyZone');
    const zoneLook = el.querySelector('#lookZone');
    const base = el.querySelector('#joyBase');
    const knob = el.querySelector('#joyKnob');
    const R = 62;
    const showJoy = (on, x, y) => {
      base.style.opacity = on ? '1' : '0';
      if (on) base.style.transform = `translate(${x - 70}px, ${y - 70}px)`;
    };
    zoneJoy.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setTouch(true);
      if (this.joy.id !== -1) return;
      this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0, mag: 0 };
      zoneJoy.setPointerCapture(e.pointerId);
      showJoy(true, e.clientX, e.clientY);
      knob.style.transform = 'translate(0px, 0px)';
    });
    zoneJoy.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joy.id) return;
      let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > R) {
        // drag the base along so the thumb never "runs out" of stick
        const over = d - R;
        this.joy.ox += (dx / d) * over;
        this.joy.oy += (dy / d) * over;
        dx = e.clientX - this.joy.ox;
        dy = e.clientY - this.joy.oy;
        showJoy(true, this.joy.ox, this.joy.oy);
      }
      this.joy.x = dx / R;
      this.joy.y = -dy / R;
      this.joy.mag = Math.min(1, Math.hypot(this.joy.x, this.joy.y));
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      base.classList.toggle('sprint', this.joy.mag > 0.94);
    });
    const endJoy = (e) => {
      if (e.pointerId !== this.joy.id) return;
      this.joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0, mag: 0 };
      showJoy(false);
      base.classList.remove('sprint');
    };
    zoneJoy.addEventListener('pointerup', endJoy);
    zoneJoy.addEventListener('pointercancel', endJoy);

    zoneLook.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setTouch(true);
      if (this.look.id !== -1) return;
      this.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
      zoneLook.setPointerCapture(e.pointerId);
    });
    zoneLook.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.look.id) return;
      this.lookDX += (e.clientX - this.look.x) * 2.2;
      this.lookDY += (e.clientY - this.look.y) * 2.2;
      this.look.x = e.clientX;
      this.look.y = e.clientY;
    });
    const endLook = (e) => {
      if (e.pointerId === this.look.id) this.look.id = -1;
    };
    zoneLook.addEventListener('pointerup', endLook);
    zoneLook.addEventListener('pointercancel', endLook);

    const btn = (sel, down, up) => {
      const b = el.querySelector(sel);
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setTouch(true);
        b.classList.add('down');
        try { b.setPointerCapture(e.pointerId); } catch { /* */ }
        down && down();
      });
      const release = (e) => {
        e.preventDefault();
        b.classList.remove('down');
        up && up();
      };
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    btn('#tPing', () => {
      this.pingHeld = true;
      this.emit('pingDown');
    }, () => {
      if (this.pingHeld) {
        this.pingHeld = false;
        this.emit('pingUp');
      }
    });
    btn('#tStone', () => this.emit('throw'));
    const peekZone = el.querySelector('#peekZone');
    if (peekZone) {
      peekZone.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.setTouch(true);
        this.emit('peek');
      });
    }
    btn('#tCrouch', () => {
      this.crouch = !this.crouch;
      this.emit('crouch');
    });
  }

  // called once per frame; resolves continuous axes
  poll() {
    const k = this.keys;
    let mx = 0, my = 0, turn = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) my += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) my -= 1;
    if (k.has('KeyD')) mx += 1;
    if (k.has('KeyA')) mx -= 1;
    if (k.has('ArrowLeft') || k.has('KeyQ')) turn -= 1;
    if (k.has('ArrowRight') || k.has('KeyE')) turn += 1;
    let sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    if (this.joy.id !== -1) {
      mx += this.joy.x;
      my += this.joy.y;
      if (this.joy.mag > 0.94) sprint = true;
    }
    const l = Math.hypot(mx, my);
    if (l > 1) {
      mx /= l;
      my /= l;
    }
    this.move.x = mx;
    this.move.y = my;
    this.turn = turn;
    this.sprint = sprint;
    const dx = this.lookDX, dy = this.lookDY;
    this.lookDX = 0;
    this.lookDY = 0;
    const s = 0.0022 * settings.mouseSens;
    return { dx: dx * s, dy: dy * s * (settings.invertY ? -1 : 1) };
  }

  reset() {
    this.keys.clear();
    this.pingHeld = false;
    this.peekHeld = false;
    this.crouch = false;
    this.lookDX = this.lookDY = 0;
    this.events = [];
  }
}
