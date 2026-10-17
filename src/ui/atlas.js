// The atlas: a field journal found in the backpack at the camp. Creatures, objectives and places, each
// with a live 3D plate (the game's own models), what the previous owner learned the hard way, and the
// pages you add yourself (what you've met, what killed you, what you've started).
import { getLang } from '../core/i18n.js';
import { atlasLog, saveAtlas } from '../core/storage.js';
import { CHAPTERS, ENTRIES, atlasText, pageList } from './atlasData.js';
import { Specimen } from './atlas3d.js';
import { fmtTime } from './hud.js';

const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ICON_SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path class="w1" d="M15.5 9a4 4 0 0 1 0 6"/><path class="w2" d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>';
const ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>';
const ICON_TOC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9"/></svg>';
const KEY_L = '<kbd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 7l-5 5 5 5"/></svg></kbd>';
const KEY_R = '<kbd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7l5 5-5 5"/></svg></kbd>';

// flies over a body, for the book: the game's own loop rides the ambience bus, which is silent in the menu
function buzz(A, [x, y, z], dur) {
  const t = A.now;
  const pn = A._panner(x, y, z, 1.2, 1.4);
  pn.connect(A.sfx);
  const bp = A._filter('bandpass', 640, 1.3);
  const g = A._gain(0);
  bp.connect(g).connect(pn);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.35);
  g.gain.setValueAtTime(0.5, t + dur - 0.6);
  g.gain.linearRampToValueAtTime(0, t + dur);
  for (const f of [188, 212, 243]) {
    const o = A._osc('sawtooth', f);
    const m = A._osc('sine', 6 + Math.random() * 8);
    const mg = A._gain(14 + Math.random() * 10);
    m.connect(mg).connect(o.frequency);
    const og = A._gain(0.3);
    o.connect(og).connect(bp);
    for (const q of [o, m]) {
      q.start(t);
      q.stop(t + dur + 0.1);
    }
  }
}

export class Atlas {
  constructor({ audio, world = null, onClose = null }) {
    this.audio = audio;
    this.world = world;
    this.onClose = onClose;
    this.el = $('atlasPanel');
    this.pages = pageList();
    this.i = 0;
    this.shown = false;
    this.spec = null;
    this.busy = 0; // a page is turning
    this.timers = [];
    this.soundUntil = 0;
    this.touched = false; // the drag hint goes away once you've turned something
    this._saveT = 0;
    this._bind();
    this.refreshBadge();
  }

  isOpen() {
    // something else may have swapped the screens under us (e.g. menus.only): then we're closed
    if (this.shown && !this.el.classList.contains('show')) this.close();
    return this.shown;
  }

  // ---------------- open / close ----------------
  open(id = null) {
    if (!this.spec) {
      try {
        this.spec = new Specimen($('atlasPlate'), { ctx: { world: this.world }, onScale: (s) => this._ruler(s) });
        this.spec.onInteract = () => this._touch();
        this.spec.onTap = () => this._touch();
      } catch (e) {
        console.warn('[atlas] no WebGL for the plates', e);
        this.spec = null;
      }
    }
    if (id) {
      const k = this.pages.findIndex((p) => p.id === id);
      if (k >= 0) this.i = k;
    }
    this.shown = true;
    this.el.classList.add('show');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('atlas-open');
    if (atlasLog.fresh) {
      atlasLog.fresh = false;
      saveAtlas();
    }
    this.refreshBadge();
    this._renderAll();
    if (this.spec) this.spec.resize();
    setTimeout(() => this.el.querySelector('.book').focus({ preventScroll: true }), 30);
  }

  close() {
    if (!this.shown) return;
    this.shown = false;
    this._stopSounds();
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
    if (this.busy) {
      // a page was mid-turn: land it
      $('atlasLeaf').className = 'leaf';
      this.busy = 0;
      this._renderAll();
    }
    this.el.classList.remove('show');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('atlas-open');
    this._flushSave(true);
    this.onClose && this.onClose();
  }

  // the main loop calls this every frame while the atlas is open
  frame(dt) {
    if (!this.shown) return;
    if (this.spec) this.spec.frame(dt);
    if (this._saveT > 0) {
      this._saveT -= dt;
      if (this._saveT <= 0) this._flushSave(true);
    }
    if (this.soundUntil && performance.now() > this.soundUntil) {
      this.soundUntil = 0;
      const b = this.el.querySelector('.ent-sound');
      if (b) b.classList.remove('playing');
    }
  }

  // your voice (menu mic) reaches the plate too
  ping() {
    if (this.shown && this.spec && !this.busy) this.spec.ping();
  }

  // a red dot by the menu link: something new to read
  refreshBadge() {
    const b = $('btnAtlas');
    if (b) b.classList.toggle('fresh', !!atlasLog.fresh);
  }

  applyI18n() {
    if (this.shown) this._renderAll();
  }

  // ---------------- navigation ----------------
  go(i, anim = true) {
    i = Math.max(0, Math.min(this.pages.length - 1, i));
    if (i === this.i || this.busy) return;
    const dir = i > this.i ? 1 : -1;
    this._stopSounds();
    this.audio && this.audio.paper && this.audio.paper();
    const single = this._single();
    if (!anim || single || !this.spec || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.i = i;
      if (single && anim) {
        const book = this.el.querySelector('.spread');
        book.classList.remove('swap-l', 'swap-r');
        void book.offsetWidth;
        book.classList.add(dir > 0 ? 'swap-r' : 'swap-l');
      }
      this._renderAll();
      return;
    }
    this._flip(i, dir);
  }
  next() {
    this.go(this.i + 1);
  }
  prev() {
    this.go(this.i - 1);
  }
  goId(id) {
    const k = this.pages.findIndex((p) => p.id === id);
    if (k >= 0) this.go(k);
  }

  _single() {
    return getComputedStyle(this.el.querySelector('.spread')).getPropertyValue('--single').trim() === '1';
  }

  // a page turns: the old right page lifts and falls onto the left (or back)
  _flip(i, dir) {
    const leaf = $('atlasLeaf');
    const front = leaf.querySelector('.leaf-front');
    const back = leaf.querySelector('.leaf-back');
    const right = $('atlasRight');
    this.busy = 1;
    if (dir > 0) {
      // front: the page you were reading. under it: the next right page. back: the next plate, still dark
      front.innerHTML = right.innerHTML;
      const sc = right.querySelector('.page-scroll');
      const fsc = front.querySelector('.page-scroll');
      if (sc && fsc) fsc.scrollTop = sc.scrollTop;
      this.i = i;
      const cap = this._cap(this._page(), i, this._T());
      back.innerHTML = this._leftFace('', cap, $('atlasPnoL').textContent.replace(/\d+/, String(2 * i + 1)));
      this._renderRight();
    } else {
      // front: the plate you were looking at (a still of it). under it: the previous plate. back: its text
      const capEl = $('atlasCap');
      front.innerHTML = this._leftFace(this.spec ? this.spec.snapshot() : '', { cls: capEl.className, html: capEl.innerHTML }, $('atlasPnoL').textContent);
      this.i = i;
      this._renderLeft();
      this._renderRight(back);
    }
    this._renderTabs();
    front.className = 'leaf-face leaf-front ' + (dir > 0 ? 'as-r' : 'as-l');
    back.className = 'leaf-face leaf-back ' + (dir > 0 ? 'as-l' : 'as-r');
    leaf.className = 'leaf ' + (dir > 0 ? 'fwd' : 'back');
    const done = () => {
      leaf.className = 'leaf';
      front.innerHTML = '';
      back.innerHTML = '';
      if (dir > 0) this._renderLeft();
      else this._renderRight();
      this.busy = 0;
    };
    this._later(done, 640);
  }

  // ---------------- rendering ----------------
  _renderAll() {
    this._renderLeft();
    this._renderRight();
    this._renderTabs();
  }

  _page() {
    return this.pages[this.i];
  }

  _T() {
    return atlasText(getLang());
  }

  _renderTabs() {
    const T = this._T();
    const p = this._page();
    const tabs = $('atlasTabs');
    let html = `<button class="tab toc${p.id === 'contents' ? ' on' : ''}" data-go="contents" aria-label="${esc(T.ui.contents)}" title="${esc(T.ui.contents)}">${ICON_TOC}<em>${esc(T.ui.contents)}</em></button>`;
    for (const c of CHAPTERS) {
      html += `<button class="tab${p.chapter === c.id ? ' on' : ''}" data-go="${c.entries[0]}"><b>${c.num}</b><em>${esc(T.chapters[c.id])}</em></button>`;
    }
    tabs.innerHTML = html;
    $('atlasClose').setAttribute('aria-label', T.ui.close);
    $('atlasClose').title = T.ui.close;
  }

  _model(id) {
    return id === 'contents' ? 'listener' : ENTRIES[id].model;
  }

  _renderLeft() {
    const T = this._T();
    const p = this._page();
    const n = this.i;
    const plate = $('atlasPlate');
    const cap = $('atlasCap');
    if (this.spec) this.spec.show(this._model(p.id));
    plate.classList.toggle('nogl', !this.spec);
    const c = this._cap(p, n, T);
    cap.innerHTML = c.html;
    cap.className = c.cls;
    let stamp = '';
    if (p.id !== 'contents' && ENTRIES[p.id].kind === 'beast' && !(atlasLog.seen[p.id] | 0)) stamp = T.ui.notSeen;
    const st = $('atlasStamp');
    st.textContent = stamp;
    st.classList.toggle('show', !!stamp);
    const hint = $('atlasHint');
    const touch = document.body.classList.contains('touch') || matchMedia('(pointer: coarse)').matches;
    hint.textContent = touch ? T.ui.hintTouch : T.ui.hint;
    hint.classList.toggle('gone', this.touched);
    $('atlasPnoL').textContent = `${T.ui.page} ${2 * n + 1}`;
  }

  _renderRight(target = null) {
    const T = this._T();
    const p = this._page();
    const n = this.i;
    const root = target || $('atlasRight');
    const html = p.id === 'contents' ? this._tocHtml(T) : this._entryHtml(T, p);
    const chapter = CHAPTERS.find((c) => c.id === p.chapter);
    let dots = '';
    if (chapter) dots = chapter.entries.map((id) => `<i class="${id === p.id ? 'on' : ''}"></i>`).join('');
    root.innerHTML = `
      <div class="page-scroll">${html}</div>
      <div class="page-foot">
        <button class="pg prev" data-nav="-1" aria-label="${esc(T.ui.prev)}" ${n === 0 ? 'disabled' : ''}>${ICON_PREV}</button>
        <span class="pg-dots">${dots}</span>
        <span class="pg-keys">${KEY_L}${KEY_R} ${esc(T.ui.keys)}</span>
        <button class="pg next" data-nav="1" aria-label="${esc(T.ui.next)}" ${n === this.pages.length - 1 ? 'disabled' : ''}>${ICON_NEXT}</button>
        <span class="pno">${esc(T.ui.page)} ${2 * n + 2}</span>
      </div>`;
    if (!target && p.id !== 'contents') {
      if (!atlasLog.read[p.id]) {
        atlasLog.read[p.id] = 1;
        this._saveT = 1.2;
      }
    }
  }

  _stat(key) {
    const a = atlasLog;
    const [k, sub] = key.split(':');
    if (k === 'seen') return a.seen[sub] | 0;
    if (k === 'kills') return a.kills[sub] | 0;
    if (k === 'part') return a.parts[+sub] | 0;
    if (k === 'site') return a.sites[sub] | 0;
    return a[k] | 0;
  }

  _len(m) {
    const u = this._T().ui;
    if (!(m > 0)) return '—';
    if (m >= 10) return `${Math.round(m)} ${u.m}`;
    if (m >= 0.995) return `${m.toFixed(1)} ${u.m}`;
    if (m >= 0.1) return `${Math.round(m * 100)} ${u.cm}`;
    if (m >= 0.01) return `${(m * 100).toFixed(1).replace(/\.0$/, '')} ${u.cm}`;
    return `${Math.round(m * 1000)} ${u.mm}`;
  }

  _entryHtml(T, p) {
    const E = ENTRIES[p.id];
    const e = T.entries[p.id];
    const ch = CHAPTERS.find((c) => c.id === p.chapter);
    const idx = ch.entries.indexOf(p.id) + 1;
    const m = this.spec ? this.spec.measure(E.model) : null;
    const dims = { h: m ? this._len(m.height) : '—', len: m ? this._len(m.length) : '—' };
    const fill = (v) => String(v).replace(/\{(h|len)\}/g, (_, k) => dims[k]);
    let h = `<div class="ent-kicker"><span>${ch.num} · ${esc(T.chapters[ch.id])}</span><span>${idx} / ${ch.entries.length}</span></div>`;
    h += '<div class="ent-head"><div>';
    h += `<h2 class="ent-name">${esc(e.name)}</h2><div class="ent-latin">${esc(e.latin)}</div></div>`;
    if (E.sound) {
      const label = E.kind === 'beast' ? T.ui.voice : T.ui.sound;
      h += `<button class="ent-sound" data-sound="${E.sound}" title="${esc(label)} (S)">${ICON_SOUND}<span>${esc(label)}</span></button>`;
    }
    h += '</div>';
    if (E.rate) {
      const labels = T.rate[E.kind];
      h += `<div class="ent-rate ${E.kind}">`;
      E.rate.forEach((v, k) => {
        const pips = [0, 1, 2, 3, 4].map((j) => `<i class="${v == null ? 'q' : j < v ? 'on' : ''}"></i>`).join('');
        h += `<div class="rr${labels[k] && k === labels.length - 1 ? ' last' : ''}"><span>${esc(labels[k])}</span><span class="pips">${pips}${v == null ? `<em>${esc(T.ui.unknown)}</em>` : ''}</span></div>`;
      });
      h += '</div>';
    }
    h += `<div class="ent-text">${e.text.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`;
    if (e.tips && e.tips.length) {
      h += `<h3>${esc(E.kind === 'task' ? T.ui.howTo : T.ui.survive)}</h3><ul class="ent-tips">${e.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    }
    if (e.facts && e.facts.length) {
      h += `<h3>${esc(T.ui.facts)}</h3><dl class="ent-facts">${e.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><i class="ld"></i><dd>${esc(fill(v))}</dd></div>`).join('')}</dl>`;
    }
    if (e.quote) h += `<blockquote class="ent-quote">«${esc(e.quote)}»<cite>— ${esc(T.ui.fromNotes)}</cite></blockquote>`;
    if (E.log && E.log.length) {
      h += `<h3 class="jh">${esc(T.ui.journal)}</h3><dl class="ent-log">${E.log.map(([lk, sk]) => `<div><dt>${esc(T.log[lk])}</dt><i class="ld"></i><dd>${this._stat(sk)}</dd></div>`).join('')}</dl>`;
    }
    return `<article class="ent ${E.kind}">${h}</article>`;
  }

  _tocHtml(T) {
    const a = atlasLog;
    let h = `<div class="ent-kicker"><span>${esc(T.ui.contents)}</span><span></span></div>`;
    h += `<h2 class="ent-name toc-title">${esc(T.ui.title)}</h2><p class="toc-found">${esc(T.ui.found)}</p>`;
    for (const c of CHAPTERS) {
      h += `<div class="toc-ch"><h3>${c.num} · ${esc(T.chapters[c.id])}</h3><ol>`;
      for (const id of c.entries) {
        const k = this.pages.findIndex((p) => p.id === id);
        const E = ENTRIES[id];
        const unseen = E.kind === 'beast' && !(a.seen[id] | 0);
        const fresh = !a.read[id];
        h += `<li><button data-go="${id}" class="${unseen ? 'unseen' : ''}"><span class="tn">${esc(T.entries[id].name)}</span>${fresh ? `<i class="nw" title="${esc(T.ui.fresh)}"></i>` : ''}<i class="lead"></i><b>${2 * k + 1}</b></button></li>`;
      }
      h += '</ol></div>';
    }
    const deaths = Object.values(a.kills).reduce((s, v) => s + (v | 0), 0);
    const rows = [
      [T.log.nights, a.nights | 0],
      [T.log.best, fmtTime(a.best | 0)],
      [T.log.wins, a.wins | 0],
      [T.log.gens, a.gens | 0],
      [T.log.deaths, deaths],
      [T.log.screams, a.kills.scream | 0],
    ];
    h += `<h3 class="jh">${esc(T.ui.journal)}</h3><dl class="ent-log toc-log">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><i class="ld"></i><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
    return `<article class="ent toc">${h}</article>`;
  }

  // the caption under the plate
  _cap(p, n, T) {
    if (p.id === 'contents') return { cls: 'plate-cap cover', html: `<span class="cap-title">${esc(T.ui.title)}</span><span class="cap-sub">${esc(T.ui.subtitle)}</span>` };
    return { cls: 'plate-cap', html: `<span class="cap-fig">${esc(T.ui.fig)} ${n}</span><span class="cap-name">${esc(T.entries[p.id].name)}</span>` };
  }

  // a left page on a turning leaf: the plate (dark, or a still of what was on it), its caption, the page number
  _leftFace(img, cap, pno) {
    const bg = img ? ` style="background-image:url(${img})"` : '';
    return `<div class="plate leaf-plate"><div class="plate-still"${bg}></div><div class="plate-fx"></div><i class="pc tl"></i><i class="pc tr"></i><i class="pc bl"></i><i class="pc br"></i></div>` +
      `<div class="${cap.cls}">${cap.html}</div><div class="page-foot l"><span class="pno">${esc(pno)}</span></div>`;
  }

  _ruler(s) {
    const r = $('atlasRuler');
    if (!r) return;
    r.style.setProperty('--w', `${s.px}px`);
    r.querySelector('span').textContent = this._len(s.meters);
  }

  _touch() {
    if (this.touched) return;
    this.touched = true;
    $('atlasHint').classList.add('gone');
  }

  _flushSave(now = false) {
    if (this._saveT > 0 && !now) return;
    this._saveT = 0;
    saveAtlas();
  }

  _later(fn, ms) {
    const id = setTimeout(() => {
      this.timers = this.timers.filter((x) => x !== id);
      fn();
    }, ms);
    this.timers.push(id);
    return id;
  }

  // ---------------- sounds ----------------
  _stopSounds() {
    for (const id of this.soundTimers || []) clearTimeout(id);
    this.soundTimers = [];
    this.soundUntil = 0;
    const b = this.el.querySelector('.ent-sound.playing');
    if (b) b.classList.remove('playing');
  }

  playSound(key) {
    const A = this.audio;
    if (!A) return;
    A.init();
    if (!A.ready) {
      // the context is waking up (first gesture): try again in a moment
      setTimeout(() => A.ready && this.playSound(key), 120);
      return;
    }
    this._stopSounds();
    // in front of you, a little to the left (where the plate is)
    const L = A.listener;
    const rx = -L.fz, rz = L.fx;
    const at = (side = -1, up = 0, fwd = 3) => [L.x + L.fx * fwd + rx * side, (L.y || 1.6) + up, L.z + L.fz * fwd + rz * side];
    const T = [];
    const later = (ms, fn) => T.push(setTimeout(fn, ms));
    let dur = 1.5;
    switch (key) {
      case 'listener':
        A.sniff(...at(-1.2, 0.3), 0.6);
        later(900, () => A.growl(...at(-1.2, 0.2, 2.6), 0.75));
        dur = 3;
        break;
      case 'crawler':
        A.chitter(...at(-0.8, -0.9, 1.5), 1.1);
        later(520, () => A.chitter(...at(-0.5, -0.9, 1.3), 0.9));
        later(1100, () => A.chitter(...at(-0.7, -0.9, 1.2), 1.1));
        dur = 1.9;
        break;
      case 'watcher':
        A.crack(...at(-1, 0.6, 1.8), 1);
        later(420, () => A.crack(...at(-0.9, 0.5, 1.7), 0.75));
        later(1050, () => A.crack(...at(-0.8, 0.7, 1.5), 1));
        dur = 1.8;
        break;
      case 'howler':
        A.howlerInhale(...at(-1.4, 0.4, 4));
        later(1800, () => A.howlerHowl(...at(-1.4, 0.6, 4), 0.8));
        dur = 4.4;
        break;
      case 'shade':
        A.whisper(...at(-1.1, 0, 0.9));
        dur = 2.8;
        break;
      case 'generator':
        for (let k = 0; k < 4; k++) later(k * 900, () => A.beacon(...at(-1, -0.4, 2)));
        dur = 3.4;
        break;
      case 'corpse':
        buzz(A, at(-0.8, -1.1, 1.2), 2.6);
        A.discover(...at(-1, -1, 2));
        later(900, () => A.paper());
        dur = 2.8;
        break;
      case 'fuel':
        A.glug(...at(-0.8, -0.8, 1.8));
        later(700, () => A.glug(...at(-0.8, -0.8, 1.8)));
        later(1600, () => A.cordPull(...at(-1, -0.6, 2)));
        later(2500, () => A.cordPull(...at(-1, -0.6, 2)));
        later(3400, () => {
          A.cordPull(...at(-1, -0.6, 2), true);
          A.genStart(...at(-1, -0.6, 2.4));
        });
        dur = 5.5;
        break;
      case 'plug':
        for (let k = 0; k < 4; k++) later(k * 380, () => A.clank(...at(-0.8, -0.6, 1.4), 0.32));
        dur = 1.6;
        break;
      case 'fuses':
        A.clank(...at(-0.8, -0.5, 1.6), 0.16);
        later(450, () => A.spark(...at(-1, -0.4, 1.8)));
        later(1700, () => A.spark(...at(-1, -0.4, 1.8)));
        dur = 2.4;
        break;
      case 'belt':
        for (let k = 0; k < 6; k++) later(k * 290 + Math.random() * 60, () => A.clank(...at(-0.9, -0.5, 1.8), 0.62));
        dur = 2;
        break;
      case 'battery':
        A.clank(...at(-0.8, -0.6, 1.6), 0.2);
        later(420, () => A.clank(...at(-0.8, -0.6, 1.6), 0.25));
        later(1100, () => A.genStart(...at(-1, -0.4, 2.6)));
        dur = 3.8;
        break;
      case 'shard':
        A.chime(...at(-1.2, 0, 3), 0, 0.45, true);
        later(700, () => A.shardPickup(3));
        dur = 2;
        break;
      case 'stone':
        A.throwWhoosh();
        later(620, () => A.impact(...at(1.5, -1.4, 7)));
        dur = 1.6;
        break;
      case 'flare':
        A.flareShot(...at(-0.4, -0.3, 0.8), true);
        later(1300, () => A.flarePop(...at(-3, 9, 14)));
        later(1350, () => A.flareHiss(...at(-3, 8.5, 14), 2.6));
        dur = 4.2;
        break;
      case 'glowstick':
        A.glowCrack(...at(0.3, -0.4, 0.7), true);
        later(1500, () => A.throwWhoosh());
        later(2100, () => A.glowLand(...at(1, -1.4, 6), 0.8));
        dur = 2.8;
        break;
      default:
        return;
    }
    this.soundTimers = T;
    this.soundUntil = performance.now() + dur * 1000;
    const b = this.el.querySelector('.ent-sound');
    if (b) b.classList.add('playing');
    if (this.spec) this.spec.react();
  }

  // ---------------- input ----------------
  _bind() {
    this.el.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) {
        e.preventDefault();
        const id = go.dataset.go;
        if (id === 'contents') this.go(0);
        else this.goId(id);
        return;
      }
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        e.preventDefault();
        this.go(this.i + (+nav.dataset.nav));
        return;
      }
      const snd = e.target.closest('[data-sound]');
      if (snd) {
        e.preventDefault();
        this.playSound(snd.dataset.sound);
        return;
      }
      if (e.target.closest('#atlasClose') || e.target === this.el) {
        e.preventDefault();
        this.close();
      }
    });
    window.addEventListener('keydown', (e) => {
      if (!this.shown || e.repeat) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;
        case 'ArrowRight':
        case 'KeyD':
        case 'PageDown':
          e.preventDefault();
          this.next();
          break;
        case 'Home':
          e.preventDefault();
          this.go(0);
          break;
        case 'End':
          e.preventDefault();
          this.go(this.pages.length - 1);
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3': {
          const c = CHAPTERS[+e.code.slice(5) - 1];
          if (c) this.goId(c.entries[0]);
          break;
        }
        case 'KeyS':
        case 'Space': {
          e.preventDefault();
          const E = ENTRIES[this._page().id];
          if (E && E.sound) this.playSound(E.sound);
          break;
        }
        case 'ArrowUp':
        case 'ArrowDown': {
          const sc = $('atlasRight').querySelector('.page-scroll');
          if (sc) {
            e.preventDefault();
            sc.scrollBy({ top: e.code === 'ArrowUp' ? -80 : 80, behavior: 'smooth' });
          }
          break;
        }
      }
    });
    // swipe the text page to turn it
    const right = $('atlasRight');
    let sw = null;
    right.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      sw = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    right.addEventListener('pointerup', (e) => {
      if (!sw) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      const quick = performance.now() - sw.t < 1000;
      sw = null;
      if (quick && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        if (dx < 0) this.next();
        else this.prev();
      }
    });
    right.addEventListener('pointercancel', () => (sw = null));
  }
}
