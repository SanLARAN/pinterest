// The atlas, the big version: both books of the game's field journal on one long table. A large live plate (the
// game's own models, lit by the echo), the page's text beside it, a filmstrip of the chapter underneath (each
// frame developed from the model itself), the creatures' voices, their height next to yours, and your own journal
// from the game (same origin, same localStorage).
import { BOOKS, CHAPTERS, ENTRIES, atlasText } from '../src/ui/atlasData.js';
import { Atlas } from '../src/ui/atlas.js';
import { readJSON } from '../src/core/persistence.js';
import { CFG } from '../src/core/config.js';
import { Plate, thumb } from './plate.js';
import { t, getLang } from './i18n.js';
import { scramble, esc } from './fx.js';

const ICON = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path class="w1" d="M15.5 9a4 4 0 0 1 0 6"/><path class="w2" d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  ping: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.4 10.4 0 0 0 0 14.8M19.4 4.6a10.4 10.4 0 0 1 0 14.8"/></svg>',
  full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>',
};

const PLAYER_H = CFG.PLAYER.eye + 0.12; // you, standing: eyes at 1.62 m

function lenText(m, u) {
  if (!(m > 0)) return '—';
  if (m >= 10) return `${Math.round(m)} ${u.m}`;
  if (m >= 0.995) return `${m.toFixed(1)} ${u.m}`;
  if (m >= 0.1) return `${Math.round(m * 100)} ${u.cm}`;
  if (m >= 0.01) return `${(m * 100).toFixed(1).replace(/\.0$/, '')} ${u.cm}`;
  return `${Math.round(m * 1000)} ${u.mm}`;
}

function readLog() {
  const a = readJSON('hush.atlas.v1', null);
  return a && typeof a === 'object' ? a : null;
}

function stat(a, key) {
  if (!a) return 0;
  const [k, sub] = key.split(':');
  if (k === 'seen') return (a.seen || {})[sub] | 0;
  if (k === 'kills') return (a.kills || {})[sub] | 0;
  if (k === 'part') return (a.parts || [])[+sub] | 0;
  if (k === 'car') return (a.carFit || [])[+sub] | 0;
  if (k === 'site') return (a.sites || {})[sub] | 0;
  return a[k] | 0;
}

export class AtlasTheatre {
  // root: the section's mount; audio(): the shared AudioEngine (made on the first gesture)
  constructor(root, { audio, reduced = false, onToast = () => {} } = {}) {
    this.root = root;
    this.audio = audio;
    this.reduced = reduced;
    this.onToast = onToast;
    this.book = 'forest';
    this.chapter = 'beasts';
    this.key = 'listener';
    this.log = readLog();
    this.visible = false;
    this._build();
    this.plate = null;
    try {
      this.plate = new Plate(this.plateEl, { onScale: (s) => this._scale(s) });
      this.plate.onTap = () => this._pinged();
    } catch (e) {
      console.warn('[site] no WebGL for the atlas plate', e);
      this.plateEl.classList.add('nogl');
    }
    const hash = location.hash.match(/^#atlas-([a-z0-9]+)$/);
    this.open(hash && ENTRIES[hash[1]] ? hash[1] : 'listener', { instant: true });
    this._bind();
  }

  _T() { return atlasText(getLang()); }

  _build() {
    this.root.innerHTML = `
      <div class="atl-top">
        <div class="atl-books" role="tablist"></div>
        <div class="atl-chapters" role="tablist"></div>
      </div>
      <div class="atl-main">
        <figure class="atl-plate">
          <div class="plate-hud" aria-hidden="true">
            <i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>
            <span class="plate-fig"></span>
            <span class="plate-coord"></span>
            <span class="plate-scale"><i></i><b></b></span>
            <span class="plate-stamp"></span>
            <span class="plate-help"></span>
            <span class="plate-load"></span>
          </div>
          <div class="plate-sweep" aria-hidden="true"></div>
          <div class="plate-tools">
            <button class="ptool voice" data-act="voice">${ICON.sound}<span></span></button>
            <button class="ptool" data-act="ping">${ICON.ping}<span></span></button>
            <button class="ptool" data-act="full">${ICON.full}<span></span></button>
            <button class="ptool" data-act="link">${ICON.link}<span></span></button>
          </div>
          <button class="plate-nav prev" data-act="prev" aria-label="←">${ICON.prev}</button>
          <button class="plate-nav next" data-act="next" aria-label="→">${ICON.next}</button>
        </figure>
        <article class="atl-text" aria-live="polite"></article>
      </div>
      <div class="atl-strip" role="listbox"></div>`;
    this.plateEl = this.root.querySelector('.atl-plate');
    this.textEl = this.root.querySelector('.atl-text');
    this.stripEl = this.root.querySelector('.atl-strip');
    this.booksEl = this.root.querySelector('.atl-books');
    this.chEl = this.root.querySelector('.atl-chapters');
  }

  _bind() {
    this.root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !this.root.contains(b)) return;
      if (b.dataset.book) this.openBook(b.dataset.book);
      else if (b.dataset.ch) this.openChapter(b.dataset.ch);
      else if (b.dataset.go) this.open(b.dataset.go);
      else if (b.dataset.act === 'voice' || b.dataset.sound) this.voice();
      else if (b.dataset.act === 'ping') { this.plate?.ping(); this._pinged(); }
      else if (b.dataset.act === 'full') this.fullscreen();
      else if (b.dataset.act === 'link') this.copyLink();
      else if (b.dataset.act === 'prev') this.step(-1);
      else if (b.dataset.act === 'next') this.step(1);
    });
    document.addEventListener('keydown', (e) => {
      if (!this.visible || e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowLeft') { this.step(-1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { this.step(1); e.preventDefault(); }
      else if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') this.voice();
      else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') this.fullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
      const on = document.fullscreenElement === this.plateEl;
      this.plateEl.classList.toggle('is-full', on);
      this._toolLabels();
      setTimeout(() => this.plate?.resize(), 50);
    });
    // swipe on the text column turns the page (the plate itself turns the model)
    let sx = 0, sy = 0;
    this.textEl.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    this.textEl.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) this.step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // every entry in reading order: forest I–IV, then the bog I–IV
  _order() { return CHAPTERS.flatMap((c) => c.entries); }

  step(d) {
    const all = this._order();
    const i = all.indexOf(this.key);
    const k = all[(i + d + all.length) % all.length];
    this.open(k, { dir: d });
  }

  openBook(id) {
    const b = BOOKS.find((x) => x.id === id);
    if (!b) return;
    this.open(b.chapters[0].entries[0]);
  }

  openChapter(id) {
    const c = CHAPTERS.find((x) => x.id === id);
    if (c) this.open(c.entries[0]);
  }

  open(key, { instant = false, dir = 1 } = {}) {
    if (!ENTRIES[key]) return;
    const ch = CHAPTERS.find((c) => c.entries.includes(key));
    const book = BOOKS.find((b) => b.chapters.includes(ch));
    const chapterChanged = ch.id !== this.chapter || book.id !== this.book || !this.stripEl.childElementCount;
    this.key = key;
    this.chapter = ch.id;
    this.book = book.id;
    this._tabs();
    if (chapterChanged) this._strip();
    this._markStrip();
    this._show(instant, dir);
    if (this.visible && !instant) {
      try { history.replaceState(null, '', `#atlas-${key}`); } catch { /* fine */ }
    }
  }

  _tabs() {
    const T = this._T();
    this.booksEl.innerHTML = BOOKS.map((b) => {
      const n = b.chapters.reduce((a, c) => a + c.entries.length, 0);
      return `<button role="tab" class="atl-book${b.id === this.book ? ' on' : ''}" data-book="${b.id}" aria-selected="${b.id === this.book}">${esc(T.books[b.id])}<small>${n}</small></button>`;
    }).join('');
    const book = BOOKS.find((b) => b.id === this.book);
    this.chEl.innerHTML = book.chapters.map((c) => `<button role="tab" class="atl-ch${c.id === this.chapter ? ' on' : ''}" data-ch="${c.id}" aria-selected="${c.id === this.chapter}"><b>${c.num}</b>${esc(T.chapters[c.id])}<small>${c.entries.length}</small></button>`).join('');
  }

  _strip() {
    const T = this._T();
    const ch = CHAPTERS.find((c) => c.id === this.chapter);
    const unseen = (id) => this.log && ENTRIES[id].kind === 'beast' && !stat(this.log, `seen:${id}`);
    this.stripEl.innerHTML = ch.entries.map((id, i) => `
      <button role="option" class="frame${unseen(id) ? ' unseen' : ''}" data-go="${id}" style="--i:${i}">
        <span class="ph"><img alt="" decoding="async"></span>
        <span class="cap"><b>${String(i + 1).padStart(2, '0')}</b>${esc(T.entries[id].name)}</span>
      </button>`).join('');
    // develop the thumbnails: this chapter first
    for (const [i, id] of ch.entries.entries()) {
      thumb(ENTRIES[id].model, (url) => {
        const img = this.stripEl.querySelector(`[data-go="${id}"] img`);
        if (img && url) {
          img.src = url;
          img.closest('.frame').classList.add('dev');
        }
      }, i < 3);
    }
  }

  _markStrip() {
    for (const f of this.stripEl.querySelectorAll('.frame')) {
      const on = f.dataset.go === this.key;
      f.classList.toggle('on', on);
      f.setAttribute('aria-selected', on);
      // sideways only: scrollIntoView would also drag the page down to a strip that is below the fold
      if (on && this.visible) {
        const s = this.stripEl;
        s.scrollTo({ left: f.offsetLeft - (s.clientWidth - f.offsetWidth) / 2, behavior: this.reduced ? 'auto' : 'smooth' });
      }
    }
  }

  _show(instant, dir) {
    const E = ENTRIES[this.key];
    this._stopSounds();
    // the plate: an echo sweeps it, the specimen surfaces with its first ping
    if (this.plate) {
      this.plateEl.classList.add('loading');
      const m = this.plate.show(E.model);
      this.plateEl.classList.toggle('nogl', !m);
      this.plateEl.classList.remove('loading');
      if (!instant && !this.reduced) {
        const sw = this.plateEl.querySelector('.plate-sweep');
        sw.classList.remove('go');
        void sw.offsetWidth;
        sw.classList.add('go');
      }
    }
    // the text: out, swap, in
    const swap = () => {
      this.textEl.innerHTML = this._entryHtml();
      this.textEl.classList.remove('out', 'outl', 'outr');
      this.textEl.classList.add('in');
      const nm = this.textEl.querySelector('.ent-name');
      if (nm && !this.reduced) scramble(nm, nm.textContent, 520);
      setTimeout(() => this.textEl.classList.remove('in'), 900);
      this._hud();
    };
    if (instant || this.reduced) swap();
    else {
      this.textEl.classList.add('out', dir < 0 ? 'outr' : 'outl');
      clearTimeout(this._swapT);
      this._swapT = setTimeout(swap, 170);
    }
  }

  _hud() {
    const T = this._T();
    const E = ENTRIES[this.key];
    const ch = CHAPTERS.find((c) => c.id === this.chapter);
    const idx = ch.entries.indexOf(this.key) + 1;
    this.plateEl.querySelector('.plate-fig').textContent = `${t('atlas.fig')} ${ch.num}.${idx} — ${T.entries[this.key].latin}`;
    const stamp = this.plateEl.querySelector('.plate-stamp');
    const beast = E.kind === 'beast';
    const seen = beast && this.log ? stat(this.log, `seen:${this.key}`) : 0;
    stamp.textContent = beast && this.log ? (seen ? `${t('atlas.seen')} · ${seen}` : t('atlas.notSeen')) : '';
    stamp.classList.toggle('red', beast && !!this.log && !seen);
    stamp.classList.toggle('show', beast && !!this.log);
    const touch = matchMedia('(pointer: coarse)').matches;
    this.plateEl.querySelector('.plate-help').textContent = `${touch ? t('atlas.helpTouch') : t('atlas.help')}${touch ? '' : ' · ' + t('atlas.keys')}`;
    this.plateEl.querySelector('.plate-load').textContent = t('atlas.loading');
    const voice = this.plateEl.querySelector('.ptool.voice');
    voice.hidden = !E.sound;
    this._toolLabels();
  }

  _toolLabels() {
    const T = this._T();
    const E = ENTRIES[this.key];
    const set = (act, label) => {
      const b = this.plateEl.querySelector(`.ptool[data-act="${act}"]`);
      if (!b) return;
      b.querySelector('span').textContent = label;
      b.title = label;
      b.setAttribute('aria-label', label);
    };
    set('voice', E.kind === 'beast' ? T.ui.voice : T.ui.sound);
    set('ping', t('atlas.ping'));
    set('full', this.plateEl.classList.contains('is-full') ? t('atlas.exitFull') : t('atlas.full'));
    set('link', t('atlas.link'));
  }

  _entryHtml() {
    const T = this._T();
    const E = ENTRIES[this.key];
    const e = T.entries[this.key];
    const ch = CHAPTERS.find((c) => c.id === this.chapter);
    const idx = ch.entries.indexOf(this.key) + 1;
    const m = this.plate ? this.plate.measure(E.model) : null;
    const dims = { h: m ? lenText(m.height, T.ui) : '—', len: m ? lenText(m.length, T.ui) : '—' };
    const fill = (v) => String(v).replace(/\{(h|len)\}/g, (_, k) => dims[k]);
    let line = 0;
    const L = () => ` style="--l:${line++}"`;
    let h = `<div class="ent-kicker"${L()}><span>${ch.num} · ${esc(T.chapters[ch.id])}</span><span>${idx} ${esc(t('atlas.of'))} ${ch.entries.length}</span></div>`;
    h += `<h3 class="ent-name${E.kind === 'beast' ? ' horror' : ''}"${L()}>${esc(e.name)}</h3><div class="ent-latin"${L()}>${esc(e.latin)}</div>`;
    if (E.rate) {
      const labels = T.rate[E.kind];
      h += `<div class="ent-rate ${E.kind}"${L()}>`;
      E.rate.forEach((v, k) => {
        const pips = [0, 1, 2, 3, 4].map((j) => `<i class="${v == null ? 'q' : j < v ? 'on' : ''}" style="--j:${j}"></i>`).join('');
        h += `<div class="rr"><span>${esc(labels[k])}</span><span class="pips">${pips}${v == null ? `<em>${esc(T.ui.unknown)}</em>` : ''}</span></div>`;
      });
      h += '</div>';
    }
    h += `<div class="ent-body">${e.text.map((p) => `<p${L()}>${esc(p)}</p>`).join('')}</div>`;
    if (e.tips?.length) h += `<h4${L()}>${esc(E.kind === 'task' ? T.ui.howTo : T.ui.survive)}</h4><ul class="ent-tips">${e.tips.map((p) => `<li${L()}>${esc(p)}</li>`).join('')}</ul>`;
    if (e.facts?.length) h += `<h4${L()}>${esc(T.ui.facts)}</h4><dl class="ent-facts">${e.facts.map(([k, v]) => `<div${L()}><dt>${esc(k)}</dt><i></i><dd>${esc(fill(v))}</dd></div>`).join('')}</dl>`;
    if (E.kind === 'beast' && m) h += this._heightsHtml(T, line++);
    if (e.quote) h += `<blockquote class="ent-quote"${L()}>«${esc(e.quote)}»<cite>— ${esc(T.ui.fromNotes)}</cite></blockquote>`;
    if (E.log?.length) {
      if (this.log) h += `<h4${L()}>${esc(T.ui.journal)}</h4><dl class="ent-log">${E.log.map(([lk, sk]) => `<div${L()}><dt>${esc(T.log[lk])}</dt><i></i><dd>${stat(this.log, sk)}</dd></div>`).join('')}</dl>`;
      else h += `<p class="ent-nolog"${L()}>${esc(t('atlas.journalEmpty'))}</p>`;
    }
    return h;
  }

  // the creatures of this book side by side, to scale, next to you
  _heightsHtml(T, line) {
    const book = BOOKS.find((b) => b.id === this.book);
    const beasts = book.chapters[0].entries.filter((id) => ENTRIES[id].kind === 'beast');
    const rows = beasts.map((id) => ({ id, h: this.plate.measure(ENTRIES[id].model)?.height || 0, name: T.entries[id].name }));
    rows.push({ id: 'you', h: PLAYER_H, name: t('atlas.you') });
    const max = Math.max(...rows.map((r) => r.h), 2);
    const bars = rows.sort((a, b) => a.h - b.h).map((r) => `
      <div class="hb${r.id === this.key ? ' on' : ''}${r.id === 'you' ? ' you' : ''}" style="--h:${(r.h / max).toFixed(3)}" title="${esc(r.name)} · ${esc(lenText(r.h, T.ui))}">
        <i></i><span>${esc(r.name)}</span><b>${esc(lenText(r.h, T.ui))}</b>
      </div>`).join('');
    return `<h4 style="--l:${line}">${esc(t('atlas.heights'))}</h4><div class="ent-heights" style="--l:${line}">${bars}</div>`;
  }

  _scale({ px, meters }) {
    const s = this.plateEl.querySelector('.plate-scale');
    if (!s) return;
    s.querySelector('i').style.width = `${px}px`;
    s.querySelector('b').textContent = lenText(meters, this._T().ui);
    this.plateEl.style.setProperty('--scale-w', `${s.offsetWidth}px`); // the caption stops short of it (site.css)
  }

  _pinged() {
    const p = this.plateEl;
    p.classList.remove('pinged');
    void p.offsetWidth;
    p.classList.add('pinged');
  }

  // the creature's voice: the game's own sound design (src/ui/atlas.js playSound), played on the site's engine.
  // playSound wants the engine itself as `audio` (here audio() makes it on the first gesture), so it runs on a small
  // host object that carries the engine, the text column (it marks the playing button there) and its own timers.
  _host() {
    if (!this._vh) {
      this._vh = {
        el: this.textEl, soundTimers: [], soundHandles: [], soundUntil: 0,
        playSound: Atlas.prototype.playSound, _stopSounds: Atlas.prototype._stopSounds,
      };
    }
    this._vh.audio = this.audio();
    this._vh.spec = this.plate;
    return this._vh;
  }

  voice() {
    const E = ENTRIES[this.key];
    if (!E.sound) return;
    const h = this._host();
    if (!h.audio) return;
    try { h.playSound(E.sound); } catch (e) { console.warn('[site] voice', e); }
    const b = this.plateEl.querySelector('.ptool.voice');
    b?.classList.add('playing');
    clearTimeout(this._playT);
    const left = () => (h.soundUntil || 0) - performance.now();
    // (the engine may still be waking up: the length is known only once playSound has really started)
    const done = () => (left() > 0 ? (this._playT = setTimeout(done, left() + 60)) : b?.classList.remove('playing'));
    this._playT = setTimeout(done, 400);
  }

  _stopSounds() {
    if (this._vh) {
      try { this._vh._stopSounds(); } catch { /* fine */ }
    }
    clearTimeout(this._playT);
    this.plateEl?.querySelector('.ptool.voice')?.classList.remove('playing');
  }

  fullscreen() {
    const el = this.plateEl;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  }

  copyLink() {
    const url = `${location.origin}${location.pathname}#atlas-${this.key}`;
    const done = () => this.onToast(t('atlas.copied'));
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, done);
    else done();
  }

  setVisible(v) {
    this.visible = v;
    if (v) this._markStrip();
  }

  refreshLang() {
    this._tabs();
    this._strip();
    this._markStrip();
    this.textEl.innerHTML = this._entryHtml();
    this._hud();
  }

  frame(dt) {
    if (this.visible && this.plate) this.plate.frame(dt);
  }
}
