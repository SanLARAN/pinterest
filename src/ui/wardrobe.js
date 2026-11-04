import {getScope} from '../core/persistence.js';
import {cloudError} from '../cloud/words.js';
// The wardrobe. Your survivor stands beside the main menu — click it and you're in the room where you
// dress it: headwear and an outfit, the standard kit or one of three themed pieces for each, two dyes
// per piece. What you pick is saved here and sent to your friends: it's how they'll see you out there.
import { Mannequin } from './mannequin.js';
import { ScreenEditor } from './screenEditor.js';
import { t } from '../core/i18n.js';
import {
  SLOTS, ITEMS, PALETTE, SHOP, item, product, owns, wardrobe, saveWardrobe, colorsOf, setColor, resetColors, isDefaultColors,
  myFit, fitWith, fullSet, fitKey, wt, lockProgress, tuneOf, setTune } from '../game/outfit.js';
import { RIMS, RIM_TONE_IDS, TINTS, DECAL_SLOTS, STICKER, withLook, withSticker, quantize, decodeSticker, isDefaultLook } from '../game/carLook.js';
import { wallet, onWallet, buyProduct, hasProduct } from '../game/wallet.js';

// the tabs: the three slots, and the shop
const TABS = [...SLOTS, 'shop'];
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
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 15.5v-3l2-1 2.5-3.5h6l3 3.5 3 .8v3.2"/><circle cx="7.5" cy="16" r="1.8"/><circle cx="16.5" cy="16" r="1.8"/><path d="M9.3 16h5.4"/></svg>',
  shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l5.5 6.5L12 20.5 6.5 10z"/><path d="M6.5 10h11M12 3.5L9.5 10 12 20.5 14.5 10z"/></svg>',
};
const GEM = '<i class="gem"></i>'; // (a CSS diamond: not every font has ◆)

// colours: is this hex one of the swatches?
const PAL = new Set(PALETTE.map((p) => p[0]));

export class Wardrobe {
  constructor({ audio, coop = null, name = null, onClose = null, onChange = null, stageFactory = null }) {
    this.audio = audio;
    this.stageFactory=stageFactory;
    this.coop = coop;
    this._name = name; // () => your callsign
    this.onClose = onClose;
    this.onChange = onChange; // (fit) when you walk out wearing something else
    this.el = $('wardrobePanel');
    this.btn = $('btnWardrobe');
    this.figHost = $('figStage');
    this.stageHost = $('wrStage');
    this.mode='items';
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
    this.shopSel = SHOP[0].id; // the product looked at in the shop
    this.screenEditor=new ScreenEditor({getValue:()=>wardrobe.screen,getColor:()=>colorsOf('screen')[1],onApply:screen=>{
      wardrobe.screen=screen;saveWardrobe();this.mq?.setFit(myFit());this._queueStills();this._renderInfo();this.coop?.active&&this.coop.announce();
    }});
    this._bind();
    onWallet(() => {
      this._renderWallet();
      if (this.shown && this.slot === 'shop') {
        this._renderItems();
        this._renderInfo();
      }
    });
    this._renderWallet();
  }

  // the 3D figure comes up after the forest (the main renderer gets the first WebGL context)
  init() {
    if (this.mq || this.failed) return;
    try {
      this.mq = this.stageFactory?.() || new Mannequin();
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
  // tab: open on that tab (the menu's shop link opens the shop)
  open(tab = null) {
    if (this.shown) return;
    if (tab && TABS.includes(tab)) {
      this.slot = tab;
      this.part = 0;
    }
    this.init();
    this.shown = true;
    this.el.classList.add('show');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wardrobe-open');
    this.lastFit = fitKey(myFit());
    this._renderAll();
    if (this.mq) {
      this.mq.attach(this.stageHost, 'stage');
      this._stage();
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
    this.screenEditor?.close();
    this.shown = false;
    this.el.classList.remove('show');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wardrobe-open');
    saveWardrobe();
    if (this.mq) {
      // whatever was tried on in the shop comes off; the car goes back to the garage
      this.mq.showCar(null);
      this.mq.setFit(myFit());
      this.mq.setFocus(this.slot === 'head' ? 'head' : 'body');
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
    if (!this.shown || this.screenEditor?.opened) return;
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
    const cap = this.btn.querySelector('.hi-label'); // (3.1j) a line of the home list
    if (cap) cap.textContent = t('homeWardrobe');
    this.btn.setAttribute('aria-label', T.title);
    if (this.shown) this._renderAll();
  }

  // ---------------- what you can do here ----------------
  setSlot(slot) {
    if (!TABS.includes(slot) || slot === this.slot) return;
    this.slot = slot;
    this.mode='items';this._renderMode();
    this.part = 0;
    this._stage();
    this._renderSlots();
    this._renderItems();
    this._renderInfo();
    this._renderPaint();
    this._queueStills();
  }

  setMode(mode) {
    if(!['items','paint'].includes(mode))return;
    this.mode=this.slot==='shop'?'items':mode;this._renderMode();
  }
  _renderMode() {
    if(this.slot==='shop')this.mode='items';
    this.el.dataset.mode=this.mode;
    for(const b of this.el.querySelectorAll('[data-wr-mode]'))b.setAttribute('aria-pressed',String(b.dataset.wrMode===this.mode));
  }

  // what stands on the stage for this tab: you (as you are, or trying on a set from the shop), or a car
  _stage() {
    const mq = this.mq;
    this.el.classList.toggle('shop-tab', this.slot === 'shop');
    if (!mq) return;
    if (this.slot === 'shop') {
      const p = product(this.shopSel) || SHOP[0];
      const first = item(p.items[0]);
      if (first.slot === 'car') {
        mq.setFocus('car');
        mq.showCar(first.id, colorsOf(first.id), tuneOf(first.id));
      } else {
        mq.showCar(null);
        mq.setFocus('body');
        mq.setFit(fitWith(...p.items));
      }
      return;
    }
    if (this.slot === 'car') {
      mq.setFocus('car');
      mq.showCar(wardrobe.car, colorsOf(wardrobe.car), tuneOf(wardrobe.car));
      return;
    }
    mq.showCar(null);
    mq.setFit(myFit());
    mq.setFocus(this.slot);
  }

  // what's on the shelves of this tab (shop pieces only once they're yours)
  _list(slot = this.slot) {
    return slot === 'shop' ? SHOP : ITEMS[slot];
  }

  wear(id) {
    const it = item(id);
    if (!it) return;
    if (!owns(id)) {
      const lock = lockProgress(id);
      if (lock) {
        // earned, not bought (2.1v): say how far along the ten you are, and do not leave the slot
        const toast = $('wrToast');
        if (toast) {
          toast.textContent = t('wrStrayLock').replace('{n}', lock.met).replace('{need}', lock.need);
          toast.classList.add('show');
        }
        this._sound('deny');
        return;
      }
      // not yours yet: the shop, on it
      this.shopSel = it.shop;
      if (this.slot !== 'shop') this.setSlot('shop');
      else this.select(it.shop);
      return;
    }
    if (it.slot !== this.slot) this.setSlot(it.slot);
    if (wardrobe[it.slot] === id) {
      if (this.mq && !this.mq.gesture && it.slot !== 'car') this.mq.play(it.slot === 'head' ? 'hat' : 'body');
      if (it.slot === 'car' && this.mq) this.mq.toggleLights();
      return;
    }
    wardrobe[it.slot] = id;
    saveWardrobe();
    if (this.mq) {
      if (it.slot === 'car') this.mq.showCar(id, colorsOf(id), tuneOf(id));
      else this.mq.setFit(myFit(), it.slot === 'head' ? 'hat' : 'body');
    }
    this._sound(it.slot === 'head' ? 'hat' : it.slot === 'car' ? 'dye' : 'cloth');
    this._renderItems();
    this._renderInfo();
    this._renderPaint();
    this._renderSet();
    this._queueStills();
    this._touch();
  }

  // the shop: look at a product (a set goes on you, the car comes onto the stage)
  select(pid) {
    const p = product(pid);
    if (!p) return;
    this.shopSel = pid;
    this._stage();
    if (this.mq && item(p.items[0]).slot !== 'car') this.mq.play('body', true);
    this._sound('cloth');
    this._renderItems();
    this._renderInfo();
    this._touch();
  }

  async buy(pid) {
    if(this.buying)return;
    const p = product(pid);
    if (!p) return;
    const T = wt().shop;
    if (hasProduct(pid)) {
      // yours already: put it on
      for (const id of p.items) wardrobe[item(id).slot] = id;
      saveWardrobe();
      this._afterBuy(p, false);
      return;
    }
    const owner=getScope();let bought=false;this.buying=true;this._renderInfo();
    try{bought=await buyProduct(pid,p.price);}catch(error){const toast=$('wrToast');if(toast){toast.textContent=cloudError(error);toast.classList.add('show');}return;}finally{this.buying=false;if(this.shown)this._renderInfo();}
    if(owner!==getScope())return;
    if (!bought) {
      this._sound('tap');
      const b = this.el.querySelector('.wr-buy');
      if (b) {
        b.classList.remove('nope');
        void b.offsetWidth;
        b.classList.add('nope');
      }
      return;
    }
    for (const id of p.items) wardrobe[item(id).slot] = id;
    saveWardrobe();
    this._afterBuy(p, true);
    const name = T.sets[p.id] ? T.sets[p.id].name : p.id;
    const toast = $('wrToast');
    if (toast) {
      toast.textContent = T.bought.replace('{name}', name);
      toast.classList.remove('show');
      void toast.offsetWidth;
      toast.classList.add('show');
    }
  }

  _afterBuy(p, fresh) {
    const car = item(p.items[0]).slot === 'car';
    if (this.mq) {
      if (car) {
        this.mq.showCar(p.items[0], colorsOf(p.items[0]), tuneOf(p.items[0]));
        this.mq.toggleLights();
      } else this.mq.setFit(myFit(), 'body');
      this.mq.ping();
    }
    this._sound(fresh ? 'buy' : 'cloth');
    this._renderAll();
    this._queueStills();
  }

  cycle(dir) {
    const list = this._list().filter(it=>this.slot==='shop'||owns(it.id));
    if (this.slot === 'shop') {
      const i = SHOP.findIndex((p) => p.id === this.shopSel);
      this.select(SHOP[(i + dir + SHOP.length) % SHOP.length].id);
      return;
    }
    const i = list.findIndex((it) => it.id === wardrobe[this.slot]);
    this.wear(list[(i + dir + list.length) % list.length].id);
    const card = this.el.querySelector(`.wr-card[data-id="${wardrobe[this.slot]}"]`);
    if (card) card.focus({ preventScroll: true });
  }

  // live = still dragging the custom colour: no save, no sound, no rebuild
  paint(hex, live = false) {
    if (this.slot === 'shop') return;
    const id = wardrobe[this.slot];
    const before = colorsOf(id)[this.part];
    setColor(id, this.part, hex);
    const now = colorsOf(id)[this.part];
    this._restage(id);
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

  // a piece's colours changed: show it
  _restage(id) {
    if (!this.mq) return;
    if (item(id).slot === 'car') this.mq.showCar(id, colorsOf(id), tuneOf(id));
    else this.mq.setFit(myFit());
  }

  randomize() {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const h = pick(this._list('head')), b = pick(this._list('body'));
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
    if (this.slot === 'shop' || this.slot === 'car') this.slot = 'body';
    this._stage();
    if (this.mq) this.mq.setFit(myFit(), 'body');
    this._sound('cloth');
    this._renderAll();
    this._queueStills();
    this._touch();
  }

  resetItem() {
    if (this.slot === 'shop') return;
    const id = wardrobe[this.slot];
    if (isDefaultColors(id)) return;
    resetColors(id);
    saveWardrobe();
    this._restage(id);
    this._sound('dye');
    if (this.mq) this.mq.ping();
    this._syncPaint();
    this._queueStills();
  }

  // ---------------- drawing the room ----------------
  _renderAll() {
    const T = wt();
    $('wrSub').textContent = T.sub;
    $('wrNote').textContent = T.note;
    $('wrDone').textContent = T.done;
    $('wrRandom').innerHTML = `${ICON.dice}<span>${esc(T.random)}</span>`;
    $('wrReset').innerHTML = `${ICON.reset}<span>${esc(T.reset)}</span>`;
    this._renderSlots();
    this._renderMode();
    this._renderItems();
    this._renderInfo();
    this._renderPaint();
    this._renderTag();
    this._renderSet();
    this._renderWallet();
    this.el.classList.toggle('shop-tab', this.slot === 'shop');
    const touch = document.body.classList.contains('touch') || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const hint = $('wrHint');
    hint.textContent = touch ? T.hintTouch : T.hint;
    hint.classList.toggle('gone', this.touched);
  }

  _renderSlots() {
    const T = wt();
    // (3.1j) came in through «Магазин»? the panel says so, not «Гардероб» over a shop
    $('wrTitle').textContent = this.slot === 'shop' ? T.slot.shop : T.title;
    $('wrSlots').innerHTML = TABS.map((s, i) => `<button class="wr-slot${s === this.slot ? ' on' : ''}${s === 'shop' ? ' shop' : ''}" data-slot="${s}" role="tab" aria-selected="${s === this.slot}"><b>${i + 1}</b>${ICON[s]}<em>${esc(T.slot[s])}</em></button>`).join('');
  }

  // the purse: in the room's corner and on the menu's shop link
  _renderWallet() {
    const n = wallet.shards;
    const el = $('wrWallet');
    if (el) {
      el.innerHTML = `${GEM}<b>${n}</b><span>${esc(wt().shop.shards)}</span>`;
      el.title = wt().shop.sub;
    }
    const m = $('walletMenu');
    if (m) m.textContent = String(n);
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
    if (this.slot === 'shop') {
      for (const p of SHOP) {
        const own = hasProduct(p.id), sel = this.shopSel === p.id;
        const first = item(p.items[0]);
        const card = document.createElement('button');
        card.className = `wr-card prod${sel ? ' on' : ''}${own ? ' owned' : ''}${!own && wallet.shards < p.price ? ' poor' : ''}`;
        card.dataset.prod = p.id;
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', String(sel));
        card.innerHTML = `<span class="wr-theme t-${first.theme}">${esc(T.theme[first.theme])}</span>`;
        card.appendChild(this._canvasFor('shop:' + p.id));
        card.insertAdjacentHTML('beforeend', `<span class="wr-name">${esc(T.shop.sets[p.id].name)}</span><span class="wr-price">${own ? esc(T.shop.owned) : `${GEM} ${p.price}`}</span>`);
        box.appendChild(card);
      }
      return;
    }
    for (const it of this._list()) {
      const available=owns(it.id),worn = available && wardrobe[this.slot] === it.id;
      const card = document.createElement('button');
      card.className = `wr-card${worn ? ' on' : ''}${available?'':' locked'}`;
      card.dataset.id = it.id;
      card.setAttribute('role', 'option');
      card.setAttribute('aria-selected', String(worn));
      card.innerHTML = `<span class="wr-theme t-${it.theme}">${esc(T.theme[it.theme])}</span>`;
      card.appendChild(this._canvasFor(it.id));
      const lock = available ? null : lockProgress(it.id);
      const tail = !available ? (lock ? ` · ${lock.met}/${lock.need}` : it.shop ? ` · ${product(it.shop).price} ${GEM}` : '') : '';
      card.insertAdjacentHTML('beforeend', `<span class="wr-name">${esc(T.items[it.id].name)}</span><span class="wr-status">${esc(worn?t('wardrobeWorn'):available?t('wardrobeWear'):t('wardrobeTry'))}${esc(tail)}</span>`);
      box.appendChild(card);
    }
  }

  _renderInfo() {
    const T = wt();
    if (this.slot === 'shop') {
      const p = product(this.shopSel) || SHOP[0];
      const S = T.shop, first = item(p.items[0]), own = hasProduct(p.id);
      const worn = own && p.items.every((id) => wardrobe[item(id).slot] === id);
      const short = p.price - wallet.shards;
      const btn = own
        ? `<button class="btn wr-buy${worn ? ' worn' : ''}" data-buy="${p.id}"${worn ? ' disabled' : ''}>${esc(worn ? S.worn : S.wear)}</button>`
        : `<button class="btn primary wr-buy${short > 0 ? ' short' : ''}" data-buy="${p.id}"><span>${esc(S.buy)}</span><b>${GEM} ${p.price}</b></button>`;
      const pieces = p.items.map((id) => esc(T.items[id].name)).join(' + ');
      $('wrInfo').innerHTML = `<div class="wr-info-head"><h3>${esc(S.sets[p.id].name)}</h3><span class="wr-theme t-${first.theme}">${esc(T.theme[first.theme])}</span></div>`
        + `<p>${esc(S.sets[p.id].desc)}</p><p class="wr-pieces">${pieces}${first.slot === 'car' ? ` · ${esc(S.carNote)}` : ''}</p>`
        + `<div class="wr-shoprow">${btn}${!own && short > 0 ? `<span class="wr-short">${esc(S.short.replace('{n}', short))} ${GEM}</span>` : ''}</div>`
        + `<p class="wr-earn">${esc(S.sub)}</p>`;
      this.el.querySelector('[data-buy]')?.toggleAttribute('disabled',!!this.buying||worn);
      return;
    }
    const it = item(wardrobe[this.slot]);
    const tx = T.items[it.id];
    $('wrInfo').innerHTML = `<div class="wr-info-head"><span class="wr-worn-label">${esc(t('wardrobeWorn'))}</span><h3>${esc(tx.name)}</h3><span class="wr-theme t-${it.theme}">${esc(T.theme[it.theme])}</span></div><p>${esc(tx.desc)}</p>`
      + (it.id==='screen'?`<button type="button" id="wrScreenEdit" class="btn">${esc(t('editScreen'))}</button>`:'');
  }

  _renderPaint() {
    const T = wt();
    if (this.slot === 'shop') {
      $('wrParts').innerHTML = '';
      $('wrSwatches').innerHTML = '';
      return;
    }
    const id = wardrobe[this.slot];
    const tx = T.items[id];
    const c = colorsOf(id);
    $('wrParts').innerHTML = `<span class="wr-lbl">${esc(T.color)}</span>` + [0, 1].map((p) => `<button class="wr-part${p === this.part ? ' on' : ''}" data-part="${p}" aria-pressed="${p === this.part}"><i style="--c:${c[p]}"></i>${esc(tx.parts[p])}</button>`).join('');
    const sw = PALETTE.map(([hex, key]) => `<button class="wr-sw" data-hex="${hex}" style="--c:${hex}" title="${esc(T.swatch[key])}" aria-label="${esc(T.swatch[key])}"></button>`).join('');
    $('wrSwatches').innerHTML = `${sw}<label class="wr-sw custom" title="${esc(T.custom)}" aria-label="${esc(T.custom)}"><input type="color" id="wrPick" value="${c[this.part]}">${ICON.plus}</label>`;
    this._syncPaint();
    this._renderTune();
  }

  // ---------------- (4.2) the car's tuning: rims, their colour, the tint, stickers of your own ----------------
  _renderTune() {
    const el = $('wrTune');
    if (!el) return;
    if (this.slot !== 'car') {
      el.innerHTML = '';
      return;
    }
    const id = wardrobe.car, L = tuneOf(id), main = colorsOf(id)[0];
    const chip = (attr, v, label, on) => `<button type="button" class="wr-chip${on ? ' on' : ''}" ${attr}="${v}" aria-pressed="${on}">${esc(label)}</button>`;
    const TONE = { stock: 'linear-gradient(135deg,#d8dadc 0 50%,#2a2c2e 50%)', chrome: '#cfd3d6', silver: '#9d9d99', black: '#19191b', gold: '#c39a2b', white: '#e9e3d2', red: '#a5231a', body: main };
    const rims = RIMS.map((r) => chip('data-rim', r, t('tuneRim_' + r), L.rim === r)).join('');
    const tones = RIM_TONE_IDS.map((k) => `<button type="button" class="wr-tone${L.rt === k ? ' on' : ''}" data-rt="${k}" style="--c:${TONE[k]}" title="${esc(t('tuneTone_' + k))}" aria-label="${esc(t('tuneTone_' + k))}" aria-pressed="${L.rt === k}"></button>`).join('');
    const tints = Array.from({ length: TINTS }, (_, i) => chip('data-tint', i, t('tuneTint' + i), L.tint === i)).join('');
    const stk = DECAL_SLOTS.map((at) => {
      const s = L.st.find((x) => x.at === at);
      return `<div class="wr-stk${s ? ' has' : ''}" data-at="${at}"><canvas width="64" height="64" data-stk="${at}" aria-hidden="true"></canvas>`
        + `<span class="wr-stk-name">${esc(t('tuneSlot_' + at))}</span>`
        + `<div class="wr-stk-acts"><label class="wr-chip wr-stk-up">${esc(s ? t('tuneReplace') : t('tuneUpload'))}<input type="file" accept="image/*" data-up="${at}"></label>`
        + (s ? `<button type="button" class="wr-chip" data-size="${at}" title="${esc(t('tuneSize'))}">×${s.s.toFixed(2).replace(/0$/, '')}</button><button type="button" class="wr-chip wr-stk-del" data-del="${at}" title="${esc(t('tuneRemove'))}" aria-label="${esc(t('tuneRemove'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>` : '')
        + '</div></div>';
    }).join('');
    el.innerHTML = `<h4>${esc(t('tuneTitle'))}</h4>`
      + `<div class="wr-tune-row"><span class="wr-lbl">${esc(t('tuneRims'))}</span><div class="wr-chips">${rims}</div></div>`
      + `<div class="wr-tune-row"><span class="wr-lbl">${esc(t('tuneRimColor'))}</span><div class="wr-tones">${tones}</div></div>`
      + `<div class="wr-tune-row"><span class="wr-lbl">${esc(t('tuneTint'))}</span><div class="wr-chips">${tints}</div></div>`
      + `<div class="wr-tune-row"><span class="wr-lbl">${esc(t('tuneStickers'))}</span><div class="wr-stickers">${stk}</div><p class="wr-tune-note">${esc(t('tuneNote'))}</p></div>`
      + `<div class="wr-tune-row"><button type="button" class="wr-chip" data-factory="1"${isDefaultLook(L) ? ' disabled' : ''}>${esc(t('tuneFactory'))}</button><span class="wr-tune-err" id="wrTuneErr" role="status"></span></div>`;
    for (const cv of el.querySelectorAll('canvas[data-stk]')) this._drawSticker(cv, L.st.find((x) => x.at === cv.dataset.stk));
  }

  // a sticker on its little card (a checker under what is clear)
  _drawSticker(cv, s) {
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);
    const idx = s && decodeSticker(s.px);
    if (!idx) return;
    const img = ctx.createImageData(64, 64);
    const pal = s.pal.map((h) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16)));
    for (let i = 0; i < 4096; i++) {
      const c = idx[i] && pal[idx[i] - 1];
      if (!c) continue;
      img.data.set([c[0], c[1], c[2], 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }

  // the tuning changed: keep it, show it (the room hears of it when you walk out: fitKey has it)
  _tune(look, sound = 'dye') {
    const id = wardrobe.car;
    setTune(id, look);
    saveWardrobe();
    this._restage(id);
    this._sound(sound);
    if (this.mq) this.mq.ping();
    this._renderTune();
    this._queueStills();
    this._touch();
  }

  tuneClick(b) {
    const id = wardrobe.car, L = tuneOf(id);
    if (b.dataset.rim) this._tune(withLook(L, { rim: b.dataset.rim }));
    else if (b.dataset.rt) this._tune(withLook(L, { rt: b.dataset.rt }));
    else if (b.dataset.tint !== undefined) this._tune(withLook(L, { tint: +b.dataset.tint }));
    else if (b.dataset.size) {
      const s = L.st.find((x) => x.at === b.dataset.size);
      if (!s) return;
      const steps = [0.5, 0.75, 1, 1.25];
      const next = steps[(steps.indexOf(s.s) + 1) % steps.length] ?? 1;
      this._tune(withSticker(L, s.at, { ...s, s: next }));
    } else if (b.dataset.del) this._tune(withSticker(L, b.dataset.del, null), 'cloth');
    else if (b.dataset.factory) this._tune(null, 'cloth');
  }

  // a picture from your disk → a sticker: fitted into 64×64 (aspect kept, centred), cut to 15 colours
  async uploadSticker(at, file) {
    const err = (on) => { const e = $('wrTuneErr'); if (e) e.textContent = on ? t('tuneBad') : ''; };
    err(false);
    if (!file || !DECAL_SLOTS.includes(at)) return;
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = url;
      });
      URL.revokeObjectURL(url);
      const cv = document.createElement('canvas');
      cv.width = STICKER.w;
      cv.height = STICKER.h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const k = Math.min(STICKER.w / img.naturalWidth, STICKER.h / img.naturalHeight);
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (STICKER.w - w) >> 1, (STICKER.h - h) >> 1, w, h);
      const q = quantize(ctx.getImageData(0, 0, STICKER.w, STICKER.h).data);
      if (!q) throw new Error('empty');
      const L = tuneOf(wardrobe.car);
      this._tune(withSticker(L, at, { px: q.px, pal: q.pal, s: L.st.find((x) => x.at === at)?.s ?? 1 }));
    } catch (e) {
      console.warn('[wardrobe] sticker', e);
      err(true);
      this._sound('deny');
    }
  }

  // swatch / chip states in place (the colour input may be open: don't rebuild it)
  _syncPaint() {
    if (this.slot === 'shop') return;
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
    const body = this.slot === 'car' && this.el.querySelector('.wr-tone[data-rt="body"]');
    if (body) body.style.setProperty('--c', c[0]); // (the rims «in the body's colour» follow the paint)
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
  // what a card shows: [fit, which kind of still]
  _stillOf(id) {
    if (id.startsWith('shop:')) {
      const p = product(id.slice(5));
      const first = item(p.items[0]);
      return [fitWith(...p.items), first.slot === 'car' ? 'car' : 'body'];
    }
    return [fitWith(id), item(id).slot];
  }

  _queueStills() {
    const ids=this.slot==='shop'?SHOP.map(p=>'shop:'+p.id):this._list().map(it=>it.id);
    this.queue=this.queue.filter(id=>ids.includes(id));
    for (const id of ids) {
      const [fit, kind] = this._stillOf(id);
      const k = `${kind}|${fitKey(fit)}`;
      if (this.stillKey.get(id) === k) continue;
      if (!this.queue.includes(id)) this.queue.push(id);
    }
    // the tab you're looking at first
    const tabOf = (id) => (id.startsWith('shop:') ? 'shop' : item(id).slot);
    this.queue.sort((a, b) => (tabOf(a) === this.slot ? 0 : 1) - (tabOf(b) === this.slot ? 0 : 1));
  }

  _stills() {
    if (!this.mq || !this.queue.length) return;
    const id = this.queue.shift();
    const [fit, kind] = this._stillOf(id);
    try {
      this.mq.still(fit, kind, this._canvasFor(id));
      this.stillKey.set(id, `${kind}|${fitKey(fit)}`);
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
      if(t.dataset.wrMode){this._click();this.setMode(t.dataset.wrMode);}
      else if (t.dataset.slot) {
        this._click();
        this.setSlot(t.dataset.slot);
      } else if (t.dataset.prod) this.select(t.dataset.prod);
      else if (t.dataset.buy) this.buy(t.dataset.buy);
      else if (t.classList.contains('wr-card')) this.wear(t.dataset.id);
      else if (t.classList.contains('wr-part')) {
        this._click();
        this.setPart(+t.dataset.part);
      } else if (t.dataset.hex) this.paint(t.dataset.hex);
      else if (t.closest('#wrTune')) { this._click(); this.tuneClick(t); }
      else if (t.id === 'wrScreenEdit') this.screenEditor.open();
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
      if (e.target.dataset && e.target.dataset.up) this.uploadSticker(e.target.dataset.up, e.target.files && e.target.files[0]);
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
      if(e.code==='Tab') {
        const all=[...this.el.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el=>el.getClientRects().length);
        const first=all[0],last=all[all.length-1];
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===this.el.querySelector('.wr'))) {e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
      if(e.target.closest?.('#wrSlots button')&&['ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();const i=TABS.indexOf(this.slot),next=TABS[(i+(e.code==='ArrowRight'?1:-1)+TABS.length)%TABS.length];this.setSlot(next);this.el.querySelector(`[data-slot="${next}"]`)?.focus();return;
      }
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
        case 'Digit3':
        case 'Numpad3':
          this.setSlot('car');
          break;
        case 'Digit4':
        case 'Numpad4':
          this.setSlot('shop');
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
