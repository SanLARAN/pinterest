// (4.0) The album: the frames the game's camera took (src/game/photo.js) that a player chose to keep at the end of
// a shift (src/ui/film.js → src/core/photoStore.js). They live in this browser's IndexedDB: the site is served from
// the same origin as the game (/pinterest/ and /pinterest/site/), so this page reads the very store the results
// screen wrote — nothing is uploaded anywhere. Grouped by shift, newest first; a frame opens big (← → to walk the
// film, Del to throw one away); one frame, a shift or everything downloads as a file / a .zip.
import { listPhotos, deletePhoto, clearPhotos, zipPhotos, zipName, photoName, downloadBlob } from '../src/core/photoStore.js';
import { t, getLang, plural } from './i18n.js';
import { esc } from './fx.js';

const two = (n) => String(n).padStart(2, '0');
export const clock = (s) => `${two(Math.floor((s | 0) / 60))}:${two((s | 0) % 60)}`;

// what a frame says under itself: «ночь 2 · 03:41»
export function caption(meta) {
  const m = meta || {};
  const key = m.phase === 'training' ? 'album.training' : m.phase === 'morning' || m.phase === 'dusk' ? 'album.morning' : 'album.night';
  return t(key, { n: m.day || 1, t: clock(m.t || 0) });
}

// the film, as shifts: [{ shift, at, frames: [...] }], the newest shift first, its frames in the order they were taken
export function groupShifts(list) {
  const by = new Map();
  for (const p of list || []) {
    const k = p.meta?.shift || p.meta?.at || 0;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(p);
  }
  return [...by.entries()].map(([shift, frames]) => {
    frames.sort((a, b) => a.meta.at - b.meta.at || a.id - b.id);
    return { shift, at: frames[0].meta.at, frames };
  }).sort((a, b) => b.at - a.at);
}

function when(at, lang) {
  const d = new Date(at);
  let day;
  try {
    day = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '');
  } catch {
    day = d.toISOString().slice(0, 10);
  }
  return `${day} · ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export class Album {
  constructor(root, { onToast = () => {}, reduced = false } = {}) {
    this.root = root;
    this.onToast = onToast;
    this.reduced = reduced;
    this.list = [];
    this.groups = [];
    this.urls = new Map(); // id → object URL (made once, revoked when the frame is gone)
    this.state = 'wait'; // wait | ok | empty | nodb | fail
    this.visible = false;
    this.cur = -1; // the frame open in the viewer (its index in this.flat)
    this.armed = ''; // a destructive button waiting for its second press
    this.busy = false;
    this._build();
    this._bind();
    this.labels();
    this.load();
  }

  // the words on the parts that are always there
  labels() {
    this.closeBtn.textContent = t('album.close');
    this.dlBtn.textContent = t('album.download');
    this.delBtn.textContent = this.armed === 'del' ? t('album.delSure') : t('album.del');
    this.root.querySelector('.alb-nav.prev').setAttribute('aria-label', t('album.prev'));
    this.root.querySelector('.alb-nav.next').setAttribute('aria-label', t('album.next'));
  }

  _build() {
    this.root.innerHTML = `<div class="alb">
      <div class="alb-tools">
        <p class="alb-count" role="status"></p>
        <div class="alb-btns">
          <button class="chip alb-zip-all" type="button"></button>
          <button class="chip alb-clear" type="button"></button>
        </div>
      </div>
      <div class="alb-body"></div>
    </div>
    <dialog class="alb-view" aria-labelledby="albCap">
      <figure class="alb-fig">
        <img class="alb-big" alt="">
        <figcaption><b id="albCap"></b><span class="alb-of"></span><em class="alb-mark"></em></figcaption>
      </figure>
      <button class="alb-nav prev" type="button" data-go="-1"><span aria-hidden="true">‹</span></button>
      <button class="alb-nav next" type="button" data-go="1"><span aria-hidden="true">›</span></button>
      <div class="alb-acts">
        <button class="chip alb-dl" type="button"></button>
        <button class="chip alb-del" type="button"></button>
        <button class="chip alb-close" type="button"></button>
      </div>
    </dialog>`;
    const $ = (s) => this.root.querySelector(s);
    this.countEl = $('.alb-count');
    this.zipAllBtn = $('.alb-zip-all');
    this.clearBtn = $('.alb-clear');
    this.body = $('.alb-body');
    this.dlg = $('.alb-view');
    this.big = $('.alb-big');
    this.capEl = $('#albCap');
    this.ofEl = $('.alb-of');
    this.markEl = $('.alb-mark');
    this.dlBtn = $('.alb-dl');
    this.delBtn = $('.alb-del');
    this.closeBtn = $('.alb-close');
  }

  _bind() {
    this.body.addEventListener('click', (e) => {
      const f = e.target.closest('[data-id]');
      if (f) return this.open(this.flat.findIndex((p) => p.id === +f.dataset.id));
      const z = e.target.closest('[data-zip]');
      if (z) this.zipShift(+z.dataset.zip);
    });
    this.zipAllBtn.addEventListener('click', () => this.zip(this.list.slice().reverse(), zipName(this.list[this.list.length - 1]?.meta.at)));
    this.clearBtn.addEventListener('click', () => this.clear());
    this.dlBtn.addEventListener('click', () => this.downloadCur());
    this.delBtn.addEventListener('click', () => this.deleteCur());
    this.closeBtn.addEventListener('click', () => this.close());
    for (const b of this.root.querySelectorAll('.alb-nav')) b.addEventListener('click', () => this.step(+b.dataset.go));
    this.dlg.addEventListener('click', (e) => { if (e.target === this.dlg) this.close(); }); // the dark around the picture
    this.dlg.addEventListener('close', () => { this.cur = -1; this.disarm(); });
    this.dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
      else if (e.key === 'Delete') { e.preventDefault(); this.deleteCur(); }
    });
    // a shift saved in another tab (the game, played while this page waited): read the store again on coming back
    this._onShow = () => { if (document.visibilityState === 'visible' && this.visible && !this.busy) this.load(); };
    document.addEventListener('visibilitychange', this._onShow);
    addEventListener('focus', this._onShow);
  }

  get flat() { return this.groups.flatMap((g) => g.frames); }

  async load() {
    if (!globalThis.indexedDB) {
      this.state = 'nodb';
      return this.render();
    }
    try {
      const list = await listPhotos();
      const ids = new Set(list.map((p) => p.id));
      for (const [id, u] of this.urls) if (!ids.has(id)) { URL.revokeObjectURL(u); this.urls.delete(id); }
      for (const p of list) if (!this.urls.has(p.id)) this.urls.set(p.id, URL.createObjectURL(p.blob));
      const key = list.map((p) => p.id).join(',');
      this.list = list;
      this.groups = groupShifts(list);
      this.state = list.length ? 'ok' : 'empty';
      if (key !== this.key || !this.rendered) this.render();
      else this.counts();
      this.key = key;
    } catch (e) {
      console.warn('[album]', e);
      this.state = 'fail';
      this.render();
    }
  }

  counts() {
    const n = this.list.length;
    this.countEl.textContent = n ? t('album.count', { frames: plural(n, t('album.frames')), shifts: plural(this.groups.length, t('album.shifts')) }) : '';
    this.zipAllBtn.hidden = this.clearBtn.hidden = !n;
    this.zipAllBtn.textContent = t('album.zipAll');
    this.clearBtn.textContent = this.armed === 'clear' ? t('album.clearSure') : t('album.clear');
    this.clearBtn.classList.toggle('alb-armed', this.armed === 'clear');
  }

  render() {
    this.rendered = true;
    const L = getLang();
    this.counts();
    if (this.state === 'wait') { this.body.innerHTML = ''; return; }
    if (this.state !== 'ok') {
      const msg = this.state === 'nodb' ? t('album.noDb') : this.state === 'fail' ? t('album.fail') : t('album.empty');
      this.body.innerHTML = `<div class="alb-empty">
        <div class="alb-ghost" aria-hidden="true"><i></i><i></i><i></i></div>
        <p class="alb-empty-t">${esc(msg)}</p>
        ${this.state === 'empty' ? `<p class="alb-empty-h">${esc(t('album.emptyHint'))}</p><a class="btn" href="../">${esc(t('album.play'))}</a>` : ''}
      </div>`;
      return;
    }
    this.body.innerHTML = this.groups.map((g) => {
      const m = g.frames[0].meta;
      const tags = [t(m.map === 'bog' ? 'album.bog' : 'album.forest')];
      if (m.coop > 1) tags.push(t('album.coop', { n: m.coop }));
      const caught = g.frames.filter((p) => p.meta.watcher).length;
      if (caught) tags.push(`${t('album.watcher')} ×${caught}`);
      return `<section class="alb-shift">
        <header class="alb-head">
          <h3>${esc(t('album.shift', { date: when(g.at, L) }))}</h3>
          <span class="alb-tags">${tags.map((x) => `<i>${esc(x)}</i>`).join('')}<i>${esc(plural(g.frames.length, t('album.frames')))}</i></span>
          <button class="chip alb-zip" type="button" data-zip="${g.shift}">${esc(t('album.zip'))}</button>
        </header>
        <div class="alb-grid">${g.frames.map((p) => `<button class="alb-frame${p.meta.watcher ? ' watcher' : ''}" type="button" data-id="${p.id}" aria-label="${esc(caption(p.meta))}${p.meta.watcher ? ` · ${esc(t('album.watcher'))}` : ''}">
            <img src="${this.urls.get(p.id)}" alt="" loading="lazy" decoding="async" width="${p.meta.w}" height="${p.meta.h}">
            <span>${esc(caption(p.meta))}</span>${p.meta.watcher ? `<em>${esc(t('album.watcher'))}</em>` : ''}
          </button>`).join('')}</div>
      </section>`;
    }).join('');
    if (this.cur >= 0) { // the viewer stays on (a frame gone from under it: the one after, or the last)
      this.cur = Math.min(this.cur, this.flat.length - 1);
      this.show();
    }
  }

  refreshLang() {
    this.labels();
    this.render();
  }

  setVisible(v) {
    const was = this.visible;
    this.visible = !!v;
    if (v && !was && this.rendered && !this.busy) this.load();
  }

  // ---------------- the viewer ----------------
  open(i) {
    if (i < 0) return;
    this.cur = i;
    this.show();
    if (!this.dlg.open) {
      if (typeof this.dlg.showModal === 'function') this.dlg.showModal();
      else this.dlg.setAttribute('open', '');
    }
    this.dlg.focus();
  }

  show() {
    const flat = this.flat, p = flat[this.cur];
    if (!p) return this.close();
    this.disarm();
    this.big.src = this.urls.get(p.id);
    this.big.alt = caption(p.meta);
    this.capEl.textContent = caption(p.meta);
    this.ofEl.textContent = t('album.of', { i: this.cur + 1, n: flat.length });
    this.markEl.textContent = p.meta.watcher ? t('album.watcher') : '';
    this.root.querySelector('.alb-nav.prev').disabled = this.cur <= 0;
    this.root.querySelector('.alb-nav.next').disabled = this.cur >= flat.length - 1;
  }

  step(d) {
    const n = this.flat.length;
    if (this.cur < 0 || !n) return;
    const i = Math.max(0, Math.min(n - 1, this.cur + d));
    if (i !== this.cur) {
      this.cur = i;
      this.show();
    }
  }

  close() {
    if (this.dlg.open) {
      if (typeof this.dlg.close === 'function') this.dlg.close();
      else this.dlg.removeAttribute('open');
    }
    this.cur = -1;
    this.disarm();
  }

  // ---------------- the buttons ----------------
  disarm() {
    this.armed = '';
    clearTimeout(this.armT);
    this.delBtn.textContent = t('album.del');
    this.delBtn.classList.remove('alb-armed');
    this.counts();
  }

  // a destructive press asks once more (the second press within a few seconds does it)
  arm(what) {
    if (this.armed === what) return true;
    this.disarm();
    this.armed = what;
    if (what === 'del') {
      this.delBtn.textContent = t('album.delSure');
      this.delBtn.classList.add('alb-armed');
    } else this.counts();
    this.armT = setTimeout(() => this.disarm(), 3500);
    return false;
  }

  downloadCur() {
    const flat = this.flat, p = flat[this.cur];
    if (!p) return;
    const g = this.groups.find((x) => x.frames.includes(p));
    downloadBlob(p.blob, photoName(p.meta, g ? g.frames.indexOf(p) + 1 : 1));
  }

  async deleteCur() {
    const p = this.flat[this.cur];
    if (!p || !this.arm('del')) return;
    this.disarm();
    try {
      await deletePhoto(p.id);
      this.onToast(t('album.deleted'));
      const keep = this.cur;
      await this.load();
      const n = this.flat.length;
      if (!n) this.close();
      else {
        this.cur = Math.min(keep, n - 1);
        this.show();
      }
    } catch (e) {
      console.warn('[album] delete', e);
      this.onToast(t('album.fail'), { kind: 'warn' });
    }
  }

  async clear() {
    if (!this.list.length || !this.arm('clear')) return;
    this.disarm();
    try {
      await clearPhotos();
      this.onToast(t('album.cleared'));
      await this.load();
    } catch (e) {
      console.warn('[album] clear', e);
      this.onToast(t('album.fail'), { kind: 'warn' });
    }
  }

  zipShift(shift) {
    const g = this.groups.find((x) => x.shift === shift);
    if (g) this.zip(g.frames, zipName(g.at));
  }

  async zip(frames, name) {
    if (this.busy || !frames.length) return;
    this.busy = true;
    this.onToast(t('album.zipping'));
    try {
      downloadBlob(await zipPhotos(frames), name);
    } catch (e) {
      console.warn('[album] zip', e);
      this.onToast(t('album.fail'), { kind: 'warn' });
    }
    this.busy = false;
  }
}
