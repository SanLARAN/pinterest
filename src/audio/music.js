// The record player in the garage: «Knock at the Door» runs under the main menu.
// A real file, not a synth — so it is an <audio> element, streamed (the track is three and a half
// minutes; decoding it into a WebAudio buffer would cost ~80 MB, which a phone does not have).
// Two players take turns: the next pass starts three seconds before the last one ends and fades in
// as the old one fades out, so the loop has no seam and no click.
// Volume is its own setting (settings.music), scaled by the master volume.
import { settings } from '../core/storage.js';

export const MUSIC_SRC = 'audio/knock-at-the-door.mp3';
export const MUSIC_BUS = 0.62; // the track sits under the menu, not over it

const FADE_IN = 2.6; // s
const FADE_OUT = 1.6;
const CROSSFADE = 3.4;
const TICK_MS = 100;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// an element with the two calls we need; browsers block play() until a gesture, and that promise is
// allowed to reject (we simply try again on the next tap)
function makeElement(src) {
  if (typeof Audio === 'undefined') return null;
  const el = new Audio();
  el.preload = 'auto';
  el.loop = false; // the seam is ours: two players, one crossfade
  el.crossOrigin = null;
  el.src = src;
  el.volume = 0;
  return el;
}

export class MenuMusic {
  constructor({
    src = MUSIC_SRC,
    makeAudio = makeElement,
    readVolume = () => settings.volume * Math.pow(settings.music ?? 0.55, 1.15) * MUSIC_BUS,
    autoTick = true,
    clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  } = {}) {
    this.src = typeof document !== 'undefined' ? new URL(src, document.baseURI).href : src;
    this.makeAudio = makeAudio;
    this.readVolume = readVolume;
    this.clock = clock;
    this.autoTick = autoTick;
    this.players = [];
    this.active = -1;
    this.cross = null; // { to, at }
    this.startedAt = 0;
    this.stoppingAt = 0;
    this.wanted = false;
    this.blocked = false; // the browser said no (no gesture yet)
    this.timer = 0;
    this._lost = 0;
  }

  get playing() {
    return this.active >= 0 && this.wanted && !this.stoppingAt;
  }

  ensure() {
    if (this.players.length) return true;
    for (let i = 0; i < 2; i++) {
      const el = this.makeAudio(this.src);
      if (!el) return false;
      if (el.addEventListener) el.addEventListener('ended', () => this._ended(i));
      this.players.push({ el, level: 0, starting: 0 });
    }
    return true;
  }

  // the menu asks for music; the browser may refuse until the first tap or key
  start() {
    if (!this.ensure()) return false;
    this.wanted = true;
    this.stoppingAt = 0;
    if (this.active >= 0) {
      this._play(this.active);
      this._run();
      return true;
    }
    this.active = 0;
    this.startedAt = this.clock();
    this._play(0);
    this._run();
    return true;
  }

  // a tap anywhere: if music was blocked by the autoplay policy, this is the moment it may go
  retry() {
    if (!this.wanted) return;
    if (this.active >= 0 && !this.blocked) return;
    if (this.active < 0) this.active = 0;
    this.stoppingAt = 0;
    this.startedAt = this.clock(); // a clean fade-in, never a jump in level
    this._play(this.active);
    this._run();
  }

  stop() {
    this.wanted = false;
    this.stoppingAt = this.clock() || 1;
    this._run();
  }

  applyVolume() {
    const base = clamp01(this.readVolume());
    for (const p of this.players) {
      const v = clamp01(base * p.level);
      if (Math.abs((p.el.volume ?? 0) - v) > 0.001) p.el.volume = v;
    }
  }

  // call from the menu's frame loop if you want the fade to follow the game's clock; the timer does
  // the same thing on its own (autoTick), so tests can drive `update()` by hand
  _run() {
    if (!this.autoTick) return;
    if (this.timer) return;
    this.timer = setInterval(() => this.update(), TICK_MS);
    if (this.timer?.unref) this.timer.unref();
  }

  _stopTimer() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = 0;
  }

  _play(i) {
    const p = this.players[i];
    if (!p) return;
    p.el.muted = false;
    try {
      const r = p.el.play();
      if (r && r.then) {
        r.then(() => { this.blocked = false; }).catch(() => {
          // no gesture yet: leave the player armed, the next tap calls retry()
          this.blocked = true;
          p.level = 0;
          if (i === this.active) this.active = -1;
          else this.cross = null;
          this._stopTimer();
        });
      }
    } catch {
      this.blocked = true;
      if (i === this.active) this.active = -1;
    }
  }

  _ended(i) {
    // the crossfade should have handed over already; if it did not (a tab was throttled), start over
    if (i !== this.active || !this.wanted || this.stoppingAt) return;
    const p = this.players[i];
    try { p.el.currentTime = 0; } catch { /* */ }
    p.level = 0;
    this.startedAt = this.clock();
    this.cross = null;
    this._play(i);
  }

  _other(i) {
    return i === 0 ? 1 : 0;
  }

  update(now = this.clock()) {
    if (!this.players.length) return;
    const sec = (t) => t / 1000;

    if (this.wanted && !this.stoppingAt) {
      // fade in
      const since = Math.max(0, (now - this.startedAt) / 1000);
      const inLevel = clamp01(since / FADE_IN);
      const a = this.players[this.active];
      if (a && !this.cross) a.level = inLevel;

      // hand over to the second player just before the end
      if (a && !this.cross && !this.blocked) {
        const d = a.el.duration;
        if (Number.isFinite(d) && d > CROSSFADE * 2 && a.el.currentTime > 1 && d - a.el.currentTime <= CROSSFADE) {
          const o = this._other(this.active);
          const op = this.players[o];
          try { op.el.currentTime = 0; } catch { /* */ }
          op.level = 0;
          this.cross = { to: o, at: now };
          this._play(o);
        }
      }
      if (this.cross) {
        const k = clamp01(sec(now - this.cross.at) / CROSSFADE);
        this.players[this.active].level = 1 - k;
        this.players[this.cross.to].level = k;
        if (k >= 1) {
          const old = this.active;
          this.active = this.cross.to;
          this.cross = null;
          const p = this.players[old];
          p.level = 0;
          try { p.el.pause(); p.el.currentTime = 0; } catch { /* */ }
        }
      }
    } else if (this.stoppingAt) {
      const k = clamp01(sec(now - this.stoppingAt) / FADE_OUT);
      const a = this.players[this.active];
      if (a) a.level = 1 - k;
      for (let i = 0; i < this.players.length; i++) if (i !== this.active) this.players[i].level = 0;
      if (k >= 1) {
        for (const p of this.players) {
          p.level = 0;
          try { p.el.pause(); p.el.currentTime = 0; } catch { /* */ }
        }
        this.active = -1;
        this.cross = null;
        this.stoppingAt = 0;
        this.blocked = false;
        this._stopTimer();
      }
    }
    this.applyVolume();
  }

  destroy() {
    this.wanted = false;
    this._stopTimer();
    for (const p of this.players) {
      try { p.el.pause(); } catch { /* */ }
    }
    this.players = [];
    this.active = -1;
  }
}
