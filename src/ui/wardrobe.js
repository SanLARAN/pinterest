// The wardrobe. Your survivor stands beside the main menu — click it and you're in the room where you
// dress it: headwear and an outfit, the standard kit or one of three themed pieces for each, two dyes
// per piece. What you pick is saved here and sent to your friends: it's how they'll see you out there.
import { Mannequin } from './mannequin.js';
import {
  SLOTS, ITEMS, PALETTE, item, wardrobe, saveWardrobe, colorsOf, setColor, resetColors, isDefaultColors,
  myFit, fitWith, fullSet, fitKey, wt,
} from '../game/outfit.js';
import { PLAYER_COLORS } from '../game/remote.js';

const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ICON = {
  head: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15.5c0-5 3-8.5 7-8.5s7 3.5 7 8.5"/><path d="M3.5 15.5h17"/><path d="M12 7V4.5"/></svg>',
  body: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l-4.5 2.5L3 11l3 1v8h12v-8l3-1-1.5-4.5L15 4c-.6 1.3-1.7 2-3 2s-2.4-.7-3-2z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/><circle cx="8.5" cy="15.5" r="1.1"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V9h4.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v10M7 12h10"/></svg>',
};

// colours: is this hex one of the swatches?
const PAL = new Set(PALETTE.map((p) => p[0]));

export class Wardrobe {
  constructor({ audio, coop = null, name = null, onClose = null, onChange = null }) {
    this.audio = audio;
    this.coop = coop;
    this._name = name; // () => your callsign
    this.onClose = onClose;
    this.onChange = onChange; // (fit) when you walk out wearing something else
    this.el = $('wardrobePanel');
    this.btn = $('btnWardrobe');
    this.figHost = $('figStage');
    this.stageHost = $('wrStage');
    this.slot = 'head';
    this.part = 0; // which dye the swatches paint: 0 main, 1 accent
    this.shown = false;
    this.mq = null;
    this.failed = false;
    this.canv = new Map(); // item id -> its card's canvas (kept: stills cost a render)
    this.stillKey = new Map(); // item id -> the fit its still shows
    this.queue = [];
    this.touched = false;
    this.lastFit = fitKey(myFit());
    this._bind();
  }

  // the 3D figure comes up after the forest (the main renderer gets the first WebGL context)
  init() {
    if (this.mq || this.failed) return;
    try {
      this.mq = new Mannequin();
      this.mq.attach(this.figHost, 'menu');
      this.mq.setFit(myFit());
      this.mq.onTap = () => {
        this._sound('tap');
        this._touch();
      };
      this.mq.onInteract = () => this._touch();
      this._placeFigure();
    } catch (e) {
      console.warn('[wardrobe] no WebGL for the mannequin', e);
      this.mq = null;
      this.failed = true;
      this.btn.classList.add('nogl');
    }
    this.applyI18n();
  }

  isOpen() {
    if (this.shown && !this.el.classList.contains('show')) this.close();
    return this.shown;
  }

  // ---------------- open / close ----------------
  open() {
    if (this.shown) return;
    this.init();
    this.shown = true;
    this.el.classList.add('show');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wardrobe-open');
    this.lastFit = fitKey(myFit());
    this._renderAll();
    if (this.mq) {
      this.mq.attach(this.stageHost, 'stage');
      this.mq.setFocus(this.slot);
      this.mq.orbit.base = 0.42;
      this.mq.orbit.yaw = 0.42;
      this.mq.orbit.pitch = 0.08;
      this.mq.setHover(false);
      this.mq.play('wave');
    }
    this._queueStills();
    this._sound('open');
    setTimeout(() => this.el.querySelector('.wr').focus({ preventScroll: true }), 30);
  }

  close() {
    if (!this.shown) return;
    this.shown = false;
    this.el.classList.remove('show');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wardrobe-open');
    saveWardrobe();
    if (this.mq) {
      this.mq.attach(this.figHost, 'menu');
      this._placeFigure();
    }
    const k = fitKey(myFit());
    if (k !== this.lastFit) {
      this.lastFit = k;
      this.onChange && this.onChange(myFit());
    }
    this._sound('close');
    this.onClose && this.onClose();
  }

  // the main loop, while the wardrobe is open (the forest isn't drawn meanwhile)
  frame(dt) {
    if (!this.shown) return;
    if (this.mq) {
      this.mq.frame(dt);
      // your callsign floats over your head, like your friends' do out there
      const p = this.mq.headScreen();
      const tag = this._tagEl || (this._tagEl = $('wrTag'));
      if (p) {
        const y = Math.max(22, p.y);
        tag.style.transform = `translate(${p.x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
        tag.style.opacity = p.y < 4 ? '0' : '1';
      } else tag.style.opacity = '0';
    }
    this._stills();
  }

  // the main loop, on the main menu: the figure by the buttons
  menuFrame(dt) {
    if (this.mq && !this.shown) this.mq.frame(dt);
  }

  // an echo reaches it (the menu's own pings, your voice)
  ping() {
    if (this.mq) this.mq.ping();
  }

  // something screamed in the menu: it flinches
  startle() {
    if (this.mq && !this.mq.gesture) this.mq.play('startle');
  }

  applyI18n() {
    const T = wt();
    const cap = this.btn.querySelector('.fig-cap span');
    if (cap) cap.textContent = T.menuCap;
    this.btn.setAttribute('aria-label', T.title);
    if (this.shown) this._renderAll();
  }

  // ---------------- what you can do here ----------------
  setSlot(slot) {
    if (!SLOTS.includes(slot) || slot === this.slot) return;
    this.slot = slot;
    this.part = 0;
    if (this.mq) this.mq.setFocus(slot);
    this._renderSlots();
    this._renderItems();
    this._renderInfo();
    this._renderPaint();
    this._queueStills();
  }

  wear(id) {
    const it = item(id);
    if (!it) return;
    if (it.slot !== this.slot) this.setSlot(it.slot);
    if (wardrobe[it.slot] === id) {
      if (this.mq && !this.mq.gesture) this.mq.play(it.slot === 'head' ? 'hat' : 'body');
      return;
    }
    wardrobe[it.slot] = id;
    saveWardrobe();
    if (this.mq) this.mq.setFit(myFit(), it.slot === 'head' ? 'hat' : 'body');
    this._sound(it.slot === 'head' ? 'hat' : 'cloth');
    this._renderItems();
    this._renderInfo();
    this._renderPaint();
    this._renderSet();
    this._queueStills();
    this._touch();
  }

  cycle(dir) {
    const list = ITEMS[this.slot];
    const i = list.findIndex((it) => it.id === wardrobe[this.slot]);
    this.wear(list[(i + dir + list.length) % list.length].id);
    const card = this.el.querySelector(`.wr-card[data-id="${wardrobe[this.slot]}"]`);
    if (card) card.focus({ preventScroll: true });
  }

  // live = still dragging the custom colour: no save, no sound, no rebuild
  paint(hex, live = false) {
    const id = wardrobe[this.slot];
    const before = colorsOf(id)[this.part];
    setColor(id, this.part, hex);
    const now = colorsOf(id)[this.part];
    if (this.mq) this.mq.setFit(myFit());
    if (!live) {
      saveWardrobe();
      if (now !== before || !this._lastPaint || performance.now() - this._lastPaint > 200) {
        this._sound('dye');
        if (this.mq) this.mq.ping();
      }
      this._lastPaint = performance.now();
      this._queueStills();
    }
    this._syncPaint();
    this._touch();
  }

  setPart(p) {
    this.part = p ? 1 : 0;
    this._syncPaint();
  }

  randomize() {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const h = pick(ITEMS.head), b = pick(ITEMS.body);
    wardrobe.head = h.id;
    wardrobe.body = b.id;
    for (const id of [h.id, b.id]) {
      if (Math.random() < 0.3) {
        resetColors(id); // sometimes the way it came is the best
        continue;
      }
      const a = pick(PALETTE)[0];
      let c = pick(PALETTE)[0];
      while (c === a) c = pick(PALETTE)[0];
      setColor(id, 0, a);
      setColor(id, 1, c);
    }
    saveWardrobe();
    if (this.mq) this.mq.setFit(myFit(), 'body');
    this._sound('cloth');
    this._renderAll();
    this._queueStills();
    this._touch();
  }

  resetItem() {
    const id = wardrobe[this.slot];
    if (isDefaultColors(id)) return;
    resetColors(id);
    saveWardrobe();
    if (this.mq) this.mq.setFit(myFit());
    this._sound('dye');
    if (this.mq) this.mq.ping();
    this._syncPaint();
    this._queueStills();
  }

  // ---------------- drawing the room ----------------
  _renderAll() {
    const T = wt();
    $('wrTitle').textContent = T.title;
    $('wrSub').textContent = T.sub;
    $('wrNote').textContent = T.note;
    $('wrDone').textContent = T.done;
    $('wrRandom').innerHTML = `${ICON.dice}<span>${esc(T.random)}</span>`;
    $('wrReset').innerHTML = `${ICON.reset}<span>${esc(T.reset)}</span>`;
    this._renderSlots();
    this._renderItems();
    this._renderInfo();
    this._renderPaint();
    this._renderTag();
    this._renderSet();
    const touch = document.body.classList.contains('touch') || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const hint = $('wrHint');
    hint.textContent = touch ? T.hintTouch : T.hint;
    hint.classList.toggle('gone', this.touched);
  }

  _renderSlots() {
    const T = wt();
    $('wrSlots').innerHTML = SLOTS.map((s, i) => `<button class="wr-slot${s === this.slot ? ' on' : ''}" data-slot="${s}" role="tab" aria-selected="${s === this.slot}"><b>${i + 1}</b>${ICON[s]}<em>${esc(T.slot[s])}</em></button>`).join('');
  }

  _canvasFor(id) {
    let c = this.canv.get(id);
    if (!c) {
      c = document.createElement('canvas');
      c.width = 168;
      c.height = 168;
      c.className = 'wr-still';
      this.canv.set(id, c);
    }
    return c;
  }

  _renderItems() {
    const T = wt();
    const box = $('wrItems');
    box.textContent = '';
    for (const it of ITEMS[this.slot]) {
      const worn = wardrobe[this.slot] === it.id;
      const card = document.createElement('button');
      card.className = `wr-card${worn ? ' on' : ''}`;
      card.dataset.id = it.id;
      card.setAttribute('role', 'option');
      card.setAttribute('aria-selected', String(worn));
      card.innerHTML = `<span class="wr-theme t-${it.theme}">${esc(T.theme[it.theme])}</span>`;
      card.appendChild(this._canvasFor(it.id));
      card.insertAdjacentHTML('beforeend', `<span class="wr-name">${esc(T.items[it.id].name)}</span>`);
      box.appendChild(card);
    }
  }

  _renderInfo() {
    const T = wt();
    const it = item(wardrobe[this.slot]);
    const tx = T.items[it.id];
    $('wrInfo').innerHTML = `<div class="wr-info-head"><h3>${esc(tx.name)}</h3><span class="wr-theme t-${it.theme}">${esc(T.theme[it.theme])}</span></div><p>${esc(tx.desc)}</p>`;
  }

  _renderPaint() {
    const T = wt();
    const id = wardrobe[this.slot];
    const tx = T.items[id];
    const c = colorsOf(id);
    $('wrParts').innerHTML = `<span class="wr-lbl">${esc(T.color)}</span>` + [0, 1].map((p) => `<button class="wr-part${p === this.part ? ' on' : ''}" data-part="${p}" aria-pressed="${p === this.part}"><i style="--c:${c[p]}"></i>${esc(tx.parts[p])}</button>`).join('');
    const sw = PALETTE.map(([hex, key]) => `<button class="wr-sw" data-hex="${hex}" style="--c:${hex}" title="${esc(T.swatch[key])}" aria-label="${esc(T.swatch[key])}"></button>`).join('');
    $('wrSwatches').innerHTML = `${sw}<label class="wr-sw custom" title="${esc(T.custom)}" aria-label="${esc(T.custom)}"><input type="color" id="wrPick" value="${c[this.part]}">${ICON.plus}</label>`;
    this._syncPaint();
  }

  // swatch / chip states in place (the colour input may be open: don't rebuild it)
  _syncPaint() {
    const id = wardrobe[this.slot];
    const c = colorsOf(id);
    const cur = c[this.part];
    this.el.querySelectorAll('.wr-part').forEach((b) => {
      const p = +b.dataset.part;
      b.classList.toggle('on', p === this.part);
      b.setAttribute('aria-pressed', String(p === this.part));
      b.querySelector('i').style.setProperty('--c', c[p]);
    });
    this.el.querySelectorAll('.wr-sw[data-hex]').forEach((b) => b.classList.toggle('on', b.dataset.hex === cur));
    const custom = this.el.querySelector('.wr-sw.custom');
    if (custom) {
      const mine = !PAL.has(cur);
      custom.classList.toggle('on', mine);
      custom.classList.toggle('filled', mine);
      custom.style.setProperty('--c', cur);
      const pick = $('wrPick');
      if (pick && document.activeElement !== pick) pick.value = cur;
    }
    $('wrReset').disabled = isDefaultColors(id);
  }

  // your callsign above its head, in your colour — the way friends see it out there
  _renderTag() {
    const me = this.coop && this.coop.active ? this.coop.me() : null;
    const tag = $('wrTag');
    tag.textContent = this._name ? this._name() : '';
    tag.style.setProperty('--c', PLAYER_COLORS[me && me.slot >= 0 ? me.slot % 4 : 0]);
  }

  _renderSet() {
    const T = wt();
    const set = fullSet(myFit());
    const el = $('wrSet');
    el.textContent = set ? `${T.set} · ${T.theme[set]}` : '';
    el.classList.toggle('show', !!set);
  }

  // ---------------- stills on the cards ----------------
  // each card shows its piece in its own colours, on you as you are now
  _queueStills() {
    for (const slot of SLOTS) {
      for (const it of ITEMS[slot]) {
        const k = `${slot}|${fitKey(fitWith(it.id))}`;
        if (this.stillKey.get(it.id) === k) continue;
        if (!this.queue.includes(it.id)) this.queue.push(it.id);
      }
    }
    // the slot you're looking at first
    this.queue.sort((a, b) => (item(a).slot === this.slot ? 0 : 1) - (item(b).slot === this.slot ? 0 : 1));
  }

  _stills() {
    if (!this.mq || !this.queue.length) return;
    const id = this.queue.shift();
    const it = item(id);
    const fit = fitWith(id);
    try {
      this.mq.still(fit, it.slot, this._canvasFor(id));
      this.stillKey.set(id, `${it.slot}|${fitKey(fit)}`);
    } catch (e) {
      console.warn('[wardrobe] still failed', e);
    }
  }

  // ---------------- the figure in the menu ----------------
  // beside the buttons on wide screens (turned toward them), under them on phones held upright
  _placeFigure() {
    if (!this.mq) return;
    const r = this.btn.getBoundingClientRect();
    const side = r.width > 0 && r.left + r.width / 2 > innerWidth * 0.6;
    this.mq.setMenuYaw(side ? 0.55 : 0.3);
    this.mq.resize();
  }

  _touch() {
    if (this.touched) return;
    this.touched = true;
    const h = $('wrHint');
    if (h) h.classList.add('gone');
  }

  _sound(kind) {
    try {
      if (this.audio && this.audio.ready) this.audio.wardrobe(kind);
    } catch { /* */ }
  }

  _bind() {
    // the figure in the menu: hover lights it, the pointer turns its head, a click opens the room
    this.btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.open();
    });
    this.btn.addEventListener('pointerenter', () => {
      if (this.mq) {
        this.mq.setHover(true);
        // it notices you: a wave (not every time)
        const now = performance.now();
        if (!this.mq.gesture && now - (this._waved || -1e9) > 8000) {
          this._waved = now;
          this.mq.play('wave');
        }
      }
      if (this.audio && this.audio.ready) this.audio.uiHover();
    });
    this.btn.addEventListener('pointerleave', () => this.mq && this.mq.setHover(false));
    this.btn.addEventListener('focus', () => this.mq && this.mq.setHover(true));
    this.btn.addEventListener('blur', () => this.mq && this.mq.setHover(false));
    window.addEventListener('pointermove', (e) => {
      if (this.mq && !this.shown && this.mq.mode === 'menu') this.mq.pointerAt(e.clientX, e.clientY);
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!this.shown) this._placeFigure();
    });

    // the room
    this.el.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t || !this.el.contains(t)) return;
      if (t.dataset.slot) {
        this._click();
        this.setSlot(t.dataset.slot);
      } else if (t.classList.contains('wr-card')) this.wear(t.dataset.id);
      else if (t.classList.contains('wr-part')) {
        this._click();
        this.setPart(+t.dataset.part);
      } else if (t.dataset.hex) this.paint(t.dataset.hex);
      else if (t.id === 'wrRandom') this.randomize();
      else if (t.id === 'wrReset') this.resetItem();
      else if (t.id === 'wrDone' || t.id === 'wrClose') {
        this._click();
        this.close();
      }
    });
    this.el.addEventListener('input', (e) => {
      if (e.target.id === 'wrPick') this.paint(e.target.value, true);
    });
    this.el.addEventListener('change', (e) => {
      if (e.target.id === 'wrPick') this.paint(e.target.value);
    });
    // a click outside the room (on the dark around it) closes it
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this._outside = true;
    });
    this.el.addEventListener('pointerup', (e) => {
      if (this._outside && e.target === this.el) this.close();
      this._outside = false;
    });
    window.addEventListener('keydown', (e) => {
      if (!this.shown || e.repeat) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          this.cycle(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          this.cycle(1);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          this.setPart(this.part ? 0 : 1);
          break;
        case 'Digit1':
        case 'Numpad1':
          this.setSlot('head');
          break;
        case 'Digit2':
        case 'Numpad2':
          this.setSlot('body');
          break;
        case 'KeyR':
          this.randomize();
          break;
      }
    });
  }

  _click() {
    if (this.audio && this.audio.ready) this.audio.uiClick();
  }
}
