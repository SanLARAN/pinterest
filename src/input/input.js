// Unified input: keyboard (layout-independent codes), mouse (pointer lock w/ drag fallback), touch.
import { settings } from '../core/storage.js';
import { cleanKeys, actionMap } from '../core/keybinds.js';

// (3.0y) the keyboard is read as actions (core/keybinds.js): the player can rebind them in the settings.
// The шкафандр's beat follows the movement keys, whatever they are (and the arrows).
const QTE_OF = { forward: 'qU', left: 'qL', back: 'qD', right: 'qR', turnLeft: 'qL', turnRight: 'qR' };

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
    this.useHeld = false; // E (or the hands button on touch): search / repair, held
    this.peekHeld = false; // Tab (or a tap on the top strip on touch): show time + score
    this.peekTouchUntil = 0;
    this.events = [];
    this.locked = false;
    this.lockFailed = false; // (3.0v) only where the lock can never be had: no API, or a frame that keeps refusing it
    // (3.0v) a page inside someone else's frame may be refused the lock for good; a page of its own never is
    this.inFrame = (() => { try { return typeof window !== 'undefined' && window.self !== window.top; } catch { return true; } })();
    // (3.0v) raw, unaccelerated mouse movement is opt-in (?rawmouse): on Windows Chrome it arrives in uneven
    // bursts and the camera stepped — worst when the frame rate dips, which is to say under the lamps
    this.rawMouse = typeof location !== 'undefined' && new URLSearchParams(location.search || '').has('rawmouse');
    this.touch = false;
    this.uiMode = false; // the live backpack: a cursor, no movement or accidental use
    this.gameActive = false; // true while a run is being played (not paused)
    this.joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0, mag: 0 };
    this.look = { id: -1, x: 0, y: 0 };
    this.mouseDrag = { down: false, x: 0, y: 0, moved: 0, t: 0 };
    this.wheel = null; // (3.1c) {dx, dy} while the quick wheel is open (ui/quickWheel.js)
    this.capturing = false; // (3.0y) the settings are listening for a key to bind: the game ignores it
    this.setKeys(settings.keys);
    this._bind();
  }

  // (3.0y) apply a player's bindings (anything invalid falls back to the defaults)
  setKeys(raw) {
    this.binds = cleanKeys(raw);
    this.amap = actionMap(this.binds);
  }

  // is any key bound to this action held right now?
  held(action) {
    for (const c of this.keys) if (this.amap.get(c) === action) return true;
    return false;
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
      // Native button activation owns Enter/Space in menus; never also start/skip a run.
      if((!this.gameActive||this.uiMode)&&['Enter','NumpadEnter','Space'].includes(e.code)&&e.target?.closest?.('button,a,[role=button]'))return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) {
        if (e.code === 'Enter' || e.code === 'Escape') e.target.blur();
        return;
      }
      if (this.capturing) return; // (the settings take this key)
      const act = this.amap.get(e.code);
      if (act && this.gameActive) e.preventDefault();
      if (act === 'ping') e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (QTE_OF[act]) this.emit(QTE_OF[act]); // (the шкафандр's beat)
      switch (act) {
        case 'ping':
          this.pingHeld = true;
          this.emit('pingDown');
          break;
        case 'bag':
          this.emit('bag');
          break;
        case 'use':
          this.useHeld = true;
          this.emit('useDown');
          break;
        case 'crouch':
          this.crouch = !this.crouch;
          this.emit('crouch');
          break;
        case 'mic':
          this.emit('mic');
          break;
        case 'watch':
          this.peekHeld = true;
          break;
        case 'pause':
          this.emit('pause');
          break;
        case 'carry':
          this.emit('restart'); // (on the results screen)
          this.emit('carry'); // (in the forest: lift a friend who's down / put them down)
          break;
        case 'confirm':
          this.emit('confirm');
          break;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      const act = this.amap.get(e.code);
      if (act === 'watch' && !this.held('watch')) this.peekHeld = false;
      if (act === 'use' && !this.held('use')) this.useHeld = false;
      if (act === 'ping' && this.pingHeld && !this.held('ping')) {
        this.pingHeld = false;
        this.emit('pingUp');
      }
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.peekHeld = false;
      this.useHeld = false;
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
      if (!this.gameActive || this.uiMode) return;
      if (!this.locked && !this.lockFailed) {
        this.requestLock(true);
        return;
      }
      // LMB makes no sound — the echo is SPACE (or the ECHO button) only, so a habitual click can't give
      // you away. It just picks the next friend to watch after you die.
      if (e.button === 0) {
        if (this.locked) this.emit('primary');
        else this.mouseDrag = { down: true, x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
      } else if (e.button === 2) this.emit('secondary');
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0 || !this.mouseDrag.down) return;
      const md = this.mouseDrag;
      md.down = false;
      if (md.moved < 6 && performance.now() - md.t < 300 && this.gameActive) this.emit('primary');
    });
    window.addEventListener('mousemove', (e) => {
      // (3.1c) the quick wheel is open: the mouse points at a pocket instead of turning the head
      if (this.wheel) {
        const w = this.wheel;
        if (this.locked) {
          if (Math.abs(e.movementX) < 400 && Math.abs(e.movementY) < 400) { w.dx += e.movementX; w.dy += e.movementY; }
        } else { w.dx = e.clientX - innerWidth / 2; w.dy = e.clientY - innerHeight / 2; }
        const len = Math.hypot(w.dx, w.dy);
        if (len > 140) { w.dx *= 140 / len; w.dy *= 140 / len; } // a stick, not a trackball: moving back works at once
        return;
      }
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
      if (this.locked) {
        this.lockFails = 0;
        // A previous lock request may resolve after the backpack has already opened.
        if (this.uiMode) { this.exitLock(); return; }
      }
      if (was && !this.locked) {
        if (this.pingHeld) {
          this.pingHeld = false;
          this.emit('pingUp');
        }
        if (!this._intentionalUnlock) this.emit('unlock');
        this._intentionalUnlock = false;
      }
    });
    document.addEventListener('pointerlockerror', () => {
      // only count here for browsers whose requestPointerLock() doesn't return a promise
      if (this._reqFromClick && !this._reqPromise) this._lockRefused();
    });

    // ---- touch (pointer events) ----
    window.addEventListener('touchstart', () => this.setTouch(true), { passive: true, once: true });
  }

  requestLock(fromClick = false) {
    if (this.touch || this.locked || this.uiMode) return;
    const c = this.canvas;
    this._reqFromClick = fromClick;
    if (!c.requestPointerLock) {
      this.lockFailed = true;
      return;
    }
    const fail = () => {
      if (fromClick) this._lockRefused();
    };
    try {
      const p = this.rawMouse ? c.requestPointerLock({ unadjustedMovement: true }) : c.requestPointerLock();
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

  // (3.0v) a refused lock. The browser refuses for ordinary reasons — no click behind the request, Esc (which is
  // never a gesture: closing the backpack with it used to count), or the second after you left the lock — and
  // none of those may turn the mouse into drag-to-look for the rest of the session: the next click asks again.
  // Only a page in someone else's frame, refused twice, falls back to dragging — and (3.1f) the desktop build:
  // a shell from before 3.1f refuses the lock outright (its permission list had no 'pointerLock'), and there the
  // camera must still turn while the new shell is on its way.
  _lockRefused() {
    this.lockFails = (this.lockFails || 0) + 1;
    if ((this.inFrame || !!globalThis.hushDesktop) && this.lockFails >= 2) this.lockFailed = true;
  }

  exitLock() {
    if (document.pointerLockElement) { this._intentionalUnlock = true; document.exitPointerLock(); }
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
    btn('#tBag', () => { this.bagTouch = true; this.emit('bag'); }, () => { this.bagTouch = false; }); // (3.1c) a long press opens the quick wheel
    btn('#tItem', () => this.emit('primary'));
    btn('#tAlt', () => this.emit('secondary'));
    btn('#tCarry', () => this.emit('carry'));
    btn('#tDescend', () => this.emit('carry'));
    btn('#tPull', () => this.emit('qX')); // (touch: one button for the beat — only the timing counts)
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
    btn('#tUse', () => {
      this.useHeld = true;
      this.emit('useDown');
    }, () => {
      this.useHeld = false;
    });
    btn('#tSkip', () => this.emit('skip'));
  }

  // called once per frame; resolves continuous axes
  poll() {
    const k = this.keys;
    let mx = 0, my = 0, turn = 0;
    void k;
    if (this.held('forward')) my += 1;
    if (this.held('back')) my -= 1;
    if (this.held('right')) mx += 1;
    if (this.held('left')) mx -= 1;
    if (this.held('turnLeft')) turn -= 1;
    if (this.held('turnRight')) turn += 1;
    let sprint = this.held('sprint');
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
    if (this.uiMode) { this.move.x = this.move.y = this.turn = 0; this.sprint = false; return { dx: 0, dy: 0 }; }
    const s = 0.0022 * settings.mouseSens;
    return { dx: dx * s, dy: dy * s * (settings.invertY ? -1 : 1) };
  }

  // (3.1c) is the backpack key (or the touch button) still down? — a short press opens the pack, a hold the wheel
  bagHeld() {
    return this.held('bag') || !!this.bagTouch;
  }

  reset() {
    this.keys.clear();
    this.bagTouch = false;
    this.pingHeld = false;
    this.useHeld = false;
    this.peekHeld = false;
    this.crouch = false;
    this.lookDX = this.lookDY = 0;
    this.events = [];
  }
}
