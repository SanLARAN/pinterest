// A live specimen plate for the site: the game's own atlas plate (src/ui/atlas3d.js), which also knows the ballot's
// candidates ('mob:<id>', built by site/mobs.js). One more instance, kept off-screen, is the darkroom: it develops
// the filmstrip's thumbnails one by one and is let go once the queue is empty.
import { Specimen } from '../src/ui/atlas3d.js';
import { buildMob } from './mobs.js';

export class Plate extends Specimen {
  constructor(host, opts = {}) {
    super(host, opts);
    // a plate sits in a long page: the wheel scrolls the page, and only zooms with ctrl / ⌘ held (or full screen)
    host.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey || document.fullscreenElement === host) return;
      e.stopPropagation();
    }, { capture: true });
  }

  _get(key) {
    if (!String(key).startsWith('mob:')) return super._get(key);
    let m = this.models.get(key);
    if (m === undefined) {
      try {
        m = buildMob(key.slice(4), this.mat) || null;
        if (m) {
          m.key = key;
          this._prepare(m);
        }
      } catch (e) {
        console.warn('[site] the plate for', key, 'would not build', e);
        m = null;
      }
      this.models.set(key, m);
    }
    return m;
  }

  dispose() {
    try { this.ro?.disconnect(); } catch { /* fine */ }
    try { this.renderer.dispose(); this.renderer.forceContextLoss(); } catch { /* fine */ }
    this.canvas.remove();
  }
}

// key → a jpeg dataURL, developed in the background (and remembered for the session)
const cache = new Map();
const queue = [];
const waiters = new Map();
let room = null;
let busy = false;
let idleTimer = 0;

function host() {
  const el = document.createElement('div');
  el.className = 'darkroom';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  return el;
}

function develop(key) {
  if (!room) {
    const el = host();
    room = { el, plate: new Plate(el, {}) };
  }
  const p = room.plate;
  if (!p.show(key)) return '';
  p.u.uFade.value = 1;
  // its first echo goes out at 0.25 s and reaches it a moment later: wait for the light
  for (let i = 0; i < 11; i++) p.frame(0.08);
  return p.snapshot();
}

function pump() {
  if (busy) return;
  const next = queue.shift();
  if (!next) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (queue.length || !room) return;
      room.plate.dispose();
      room.el.remove();
      room = null;
    }, 6000);
    return;
  }
  busy = true;
  const run = () => {
    let url = '';
    try { url = develop(next); } catch (e) { console.warn('[site] darkroom', next, e); }
    cache.set(next, url);
    for (const fn of waiters.get(next) || []) fn(url);
    waiters.delete(next);
    busy = false;
    setTimeout(pump, 16);
  };
  (window.requestIdleCallback || ((f) => setTimeout(f, 30)))(run, { timeout: 600 });
}

// ask for a thumbnail; `first` puts it at the head of the queue (the chapter you are looking at)
export function thumb(key, cb, first = false) {
  if (cache.has(key)) { cb(cache.get(key)); return; }
  if (!waiters.has(key)) {
    waiters.set(key, []);
    if (first) queue.unshift(key);
    else queue.push(key);
  } else if (first) {
    const i = queue.indexOf(key);
    if (i > 0) { queue.splice(i, 1); queue.unshift(key); }
  }
  waiters.get(key).push(cb);
  pump();
}
