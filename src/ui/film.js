// (4.0) The shift's film, on the results screen: every frame the camera took (game/photo.js), and what to do with
// them — into the album the site keeps (core/photoStore.js: the same origin, so /site/#album shows them), or down
// to disk as one .zip. A frame on its own downloads with a click. Nothing is kept unless you say so: the next shift
// starts a new film.
import { t } from '../core/i18n.js';
import { savePhotos, zipPhotos, zipName, photoName, downloadBlob } from '../core/photoStore.js';
import { fmtTime } from './hud.js';

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// the site's album, from wherever the game is served (Pages: /pinterest/ → /pinterest/site/; the old /play/ fallback)
export function albumUrl(loc = globalThis.location) {
  if (!loc) return 'site/#album';
  return new URL(/\/play\/?$/.test(loc.pathname.replace(/[^/]*$/, '')) ? '../site/#album' : 'site/#album', loc.href).href;
}
// the album is this browser's: a desktop shell (or a page off file://) has its own storage the site never sees
export const albumHere = () => !globalThis.hushDesktop && /^https?:$/.test(globalThis.location?.protocol || '') && !!globalThis.indexedDB;

export function frameCaption(meta) {
  const m = meta || {};
  const key = m.phase === 'morning' || m.phase === 'dusk' ? 'filmMorning' : 'filmNight';
  return t(key).replace('{n}', m.day || 1).replace('{t}', fmtTime(m.t || 0));
}

export class FilmStrip {
  constructor(el) {
    this.el = el;
    this.film = [];
    this.saved = false;
    this.busy = false;
    if (!el) return;
    el.innerHTML = `<header class="film-head"><b class="film-title"></b><span class="film-count"></span></header>
      <div class="film-strip" role="list"></div>
      <div class="film-btns">
        <button class="btn film-save" type="button"></button>
        <button class="btn film-zip" type="button"></button>
      </div>
      <p class="film-note" role="status"></p>`;
    this.strip = el.querySelector('.film-strip');
    this.saveBtn = el.querySelector('.film-save');
    this.zipBtn = el.querySelector('.film-zip');
    this.note = el.querySelector('.film-note');
    this.saveBtn.addEventListener('click', () => this.save());
    this.zipBtn.addEventListener('click', () => this.zip());
    this.strip.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      const f = b && this.film[+b.dataset.i];
      if (f) downloadBlob(f.blob, photoName(f.meta, +b.dataset.i + 1));
    });
  }

  show(film) {
    if (!this.el) return;
    this.film = (film || []).filter((f) => f && f.blob);
    this.saved = false;
    this.busy = false;
    delete this.note.dataset.state; // (a new film: not saved yet)
    this.el.hidden = !this.film.length;
    if (!this.film.length) return;
    this.strip.innerHTML = this.film.map((f, i) => `<button type="button" class="film-frame${f.meta?.watcher ? ' watcher' : ''}" role="listitem" data-i="${i}" title="${esc(frameCaption(f.meta))}${f.meta?.watcher ? ` · ${esc(t('filmWatcher'))}` : ''}">
        <img src="${f.url}" alt="${esc(frameCaption(f.meta))}" loading="lazy" decoding="async"><span>${esc(frameCaption(f.meta))}</span></button>`).join('');
    this.render();
  }

  render() {
    if (!this.el) return;
    this.el.querySelector('.film-title').textContent = t('filmTitle');
    this.el.querySelector('.film-count').textContent = t('filmCount').replace('{n}', this.film.length);
    this.saveBtn.hidden = !albumHere();
    this.saveBtn.disabled = this.saved || this.busy;
    this.saveBtn.textContent = this.saved ? t('filmSaved') : this.busy ? t('filmSaving') : t('filmSave');
    this.zipBtn.textContent = t('filmZip');
    if (!this.note.dataset.state) this.note.textContent = t('filmHint');
  }

  async save() {
    if (this.saved || this.busy || !this.film.length) return;
    this.busy = true;
    this.render();
    try {
      await savePhotos(this.film.map((f) => ({ blob: f.blob, meta: f.meta })));
      this.saved = true;
      this.note.dataset.state = 'saved';
      this.note.innerHTML = `<a href="${esc(albumUrl())}" target="_blank" rel="noopener">${esc(t('filmOpen'))} →</a>`;
    } catch (e) {
      console.warn('[film] could not save', e);
      this.note.dataset.state = 'fail';
      this.note.textContent = t('filmFail');
    }
    this.busy = false;
    this.render();
  }

  async zip() {
    if (!this.film.length) return;
    try {
      const blob = await zipPhotos(this.film);
      downloadBlob(blob, zipName(this.film[0].meta?.shift || Date.now()));
    } catch (e) {
      console.warn('[film] zip failed', e);
    }
  }
}
