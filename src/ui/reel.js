// The reel: what the night's highlights look like on screen (2.1u). Finds the clip strip, plays the frames
// the director kept, and writes the whole thing out as a video file with MediaRecorder — the picture, the
// captions, the title card and now the score all baked in, because a file has no DOM (and no speakers) to
// lean on.
//
// Frames arrive as { t, blob } (a JPEG grabbed from the game's canvas, 640×360 — see HL_CAPTURE). Playback
// decodes them lazily around the playhead and dissolves from one to the next, so the reel moves instead of
// flicking; the cache keeps a couple of seconds' worth of bitmaps and closes the rest (0.9 MB each).
import { t } from '../core/i18n.js';
import { reelPlan, reelDuration, reelFileName, frameAt, frameWindow } from '../game/highlights.js';
import { ReelScore, scoreLength } from '../audio/reelScore.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// the preview's own stage (the source frames are twice this and go down smoothly)
const STAGE_W = 320, STAGE_H = 180;
// the exported file: 720p, 8 Mbps, with the score underneath
export const OUT = { w: 1280, h: 720, fps: 30, bits: 8_000_000 };

// decode a JPEG blob into something drawImage takes. createImageBitmap is the fast path; an <img> is the
// fallback for a browser that has not got it (the reel must not show placeholders because of that).
function decode(blob) {
  if (typeof createImageBitmap === 'function') {
    try { return createImageBitmap(blob); } catch { /* fall through to the <img> */ }
  }
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('no decode')); };
    img.src = url;
  });
}

// a small tile of film grain, made once and stamped with a fresh offset every frame
function grainTile(n = 96) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 26 + Math.random() * 26;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

export class Reel {
  constructor({ audio = null } = {}) {
    this.audio = audio;
    this.el = $('reelPanel');
    this.canvas = $('reelCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.capEl = $('reelCap');
    this.strip = $('reelStrip');
    this.emptyEl = $('reelEmpty');
    this.progEl = $('reelProg');
    this.stateEl = $('reelSaveState');
    this.hintEl = $('reelHint');
    this.cache = new Map(); // frame object → ImageBitmap | 'pending'
    this.grain = null;
    this.clips = [];
    this.plan = [];
    this.i = 0;
    this.localT = 0;
    this.playing = false;
    this.shown = false;
    this.saving = false;
    this.lastBitmap = null;
    this._raf = 0;
    this._last = 0;
    this._bind();
  }

  _click() {
    try { this.audio?.uiClick?.(); } catch { /* the reel must work without audio */ }
  }

  get isOpen() {
    return this.shown;
  }

  _bind() {
    if (!this.el) return;
    const on = (id, fn) => $(id)?.addEventListener('click', (e) => { e.preventDefault(); this._click(); fn(); });
    on('btnReelPlay', () => this.toggle());
    on('btnReelPrev', () => this.seekClip(this.i - 1));
    on('btnReelNext', () => this.seekClip(this.i + 1));
    on('btnReelSave', () => this.save());
    on('btnReelClose', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    // the reel owns the keyboard while it is open: the results screen must not restart the night under it
    window.addEventListener('keydown', (e) => {
      if (!this.shown) return;
      const code = e.code;
      if (code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); this.close(); }
      else if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') { e.preventDefault(); e.stopImmediatePropagation(); this.toggle(); }
      else if (code === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); this.seekClip(this.i - 1); }
      else if (code === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); this.seekClip(this.i + 1); }
    }, true);
  }

  // ---------------- open / close ----------------
  open(clips) {
    if (!this.el) return;
    this.clips = clips || [];
    this.plan = reelPlan(this.clips);
    this.i = 0;
    this.localT = 0;
    this.shown = true;
    this.el.classList.add('show');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('reel-open');
    this._renderStrip();
    this._renderEmpty();
    this.lastBitmap = null;
    this._pump(this.plan[0], this.plan[0] ? this.plan[0].start : 0, 8);
    this.play();
    if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(this._tick); }
    this._syncButtons();
    this.applyI18n();
  }

  close() {
    if (!this.shown) return;
    this.shown = false;
    this.playing = false;
    this.el.classList.remove('show');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('reel-open');
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  applyI18n() {
    if (!this.shown) return;
    this._renderStrip();
    this._renderEmpty();
    this._syncButtons();
    this._caption();
  }

  // ---------------- playback ----------------
  play() {
    if (!this.clips.length) return;
    if (this.i >= this.plan.length) { this.i = 0; this.localT = 0; }
    this.playing = true;
    this._pump(this.plan[this.i], this._playhead(), 8);
    this._syncButtons();
  }

  pause() {
    this.playing = false;
    this._syncButtons();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  seekClip(i) {
    if (!this.plan.length) return;
    this.i = (i + this.plan.length) % this.plan.length;
    this.localT = 0;
    this.lastBitmap = null;
    this._pump(this.plan[this.i], this.plan[this.i].start, 8);
    this._renderStrip();
    this._syncButtons();
    this._caption();
  }

  // where the playhead is inside the current clip, in the clip's own seconds
  _playhead() {
    const c = this.plan[this.i];
    if (!c) return 0;
    return c.start + Math.max(0, Math.min(c.end - c.start, this.localT - c.lead));
  }

  frame(dt) {
    if (!this.shown) return;
    if (this.playing && this.plan.length) {
      this.localT += dt;
      const c = this.plan[this.i];
      if (this.localT >= c.duration) {
        if (this.i + 1 < this.plan.length) {
          this.localT -= c.duration;
          this.seekClip(this.i + 1);
          this.playing = true;
        } else {
          this.localT = c.duration;
          this.playing = false;
          this._syncButtons();
        }
      }
    }
    this._pump(this.plan[this.i], this._playhead(), 6);
    this._draw();
  }

  _tick = (now) => {
    if (!this.shown) { this._raf = 0; return; }
    const dt = Math.min(0.1, Math.max(0, (now - this._last) / 1000));
    this._last = now;
    this.frame(dt);
    this._raf = requestAnimationFrame(this._tick);
  };

  // ---------------- frames ----------------
  // decode what is coming and close what has gone: a 640×360 bitmap is ~0.9 MB and a shift has hundreds
  _pump(clip, at, ahead) {
    if (!clip) return;
    const win = frameWindow(clip.frames, at, 3, ahead);
    for (const f of win) this._bitmap(f);
    const keep = new Set(win);
    for (const [f, bm] of this.cache) {
      if (keep.has(f)) continue;
      if (f.t < at - 2) {
        if (bm && bm !== 'pending' && bm.close) { try { bm.close(); } catch { /* already gone */ } }
        this.cache.delete(f);
      }
    }
  }

  _bitmap(f) {
    if (!f) return null;
    const cached = this.cache.get(f);
    if (cached && cached !== 'pending') return cached;
    if (cached === 'pending') return null;
    this.cache.set(f, 'pending');
    const blob = f.frame && f.frame.blob;
    if (!blob || typeof blob.then !== 'function') return null;
    blob.then((b) => {
      if (!b) { this.cache.set(f, null); return; }
      decode(b).then((bm) => this.cache.set(f, bm)).catch(() => this.cache.set(f, null));
    }).catch(() => this.cache.set(f, null));
    return null;
  }

  _ready(f) {
    return new Promise((res) => {
      const cached = this.cache.get(f);
      if (cached && cached !== 'pending') return res(cached);
      const blob = f.frame && f.frame.blob;
      if (!blob || typeof blob.then !== 'function') return res(null);
      blob.then((b) => (b ? decode(b) : null)).then((bm) => { this.cache.set(f, bm); res(bm); }).catch(() => res(null));
    });
  }

  // ---------------- drawing ----------------
  _draw() {
    if (!this.ctx) return;
    const c = this.plan[this.i];
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#07090a';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    if (!c) { ctx.restore(); return; }
    const at = this._playhead();
    const bm = this._paintFrames(ctx, c, at, 0, 0, STAGE_W, STAGE_H, this.localT, c.duration);
    if (bm) this.lastBitmap = bm;
    // the found-footage floor: a cold vignette and two scanlines
    const g = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 40, STAGE_W / 2, STAGE_H / 2, 210);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#dfe6cf';
    for (let y = (this.localT * 18) % 4; y < STAGE_H; y += 4) ctx.fillRect(0, y, STAGE_W, 1);
    ctx.globalAlpha = 1;
    ctx.restore();
    if (this.progEl) {
      const d = this.plan.reduce((a, k) => a + k.duration, 0) || 1;
      const before = this.plan.slice(0, this.i).reduce((a, k) => a + k.duration, 0);
      this.progEl.style.width = `${Math.min(100, ((before + this.localT) / d) * 100).toFixed(2)}%`;
    }
    this._caption();
  }

  // draw the frame at `at`, dissolving into the next one when the playhead sits between them (10 frames a
  // second held still is a slideshow; two of them mixed is motion)
  _paintFrames(ctx, clip, at, x, y, w, h, localT = 0, duration = 1) {
    const cur = frameAt(clip.frames, at);
    const bm = this._bitmap(cur) || this.lastBitmap;
    if (!bm) {
      ctx.fillStyle = '#5c6152';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▚', x + w / 2, y + h / 2);
      return null;
    }
    // the next frame: how far past this one are we?
    const next = clip.frames.find((f) => f.t > at + 1e-6);
    let k = 0;
    if (next && cur) {
      const span = Math.max(1e-3, next.t - cur.t);
      k = Math.max(0, Math.min(0.85, (at - cur.t) / span)); // (never a full hand-over: no ghost frame)
    }
    const nbm = next ? this._bitmap(next) : null;
    cover(ctx, bm, x, y, w, h);
    if (nbm && k > 0.02) {
      ctx.save();
      ctx.globalAlpha = k;
      cover(ctx, nbm, x, y, w, h);
      ctx.restore();
    }
    // the cut: a blink of black at each end of a clip
    const edge = Math.min(localT, duration - localT);
    if (edge < 0.12) {
      ctx.fillStyle = `rgba(0,0,0,${1 - edge / 0.12})`;
      ctx.fillRect(x, y, w, h);
    }
    return k > 0.5 && nbm ? nbm : bm;
  }

  // the caption under the stage, and the strip's current chip
  _caption() {
    if (!this.capEl) return;
    const c = this.plan[this.i];
    if (!c) { this.capEl.textContent = ''; return; }
    const text = captionFor(c);
    if (this.capEl.textContent !== text) this.capEl.textContent = text;
    if (this.strip) for (const b of this.strip.children) b.classList.toggle('on', +b.dataset.i === this.i);
  }

  _renderEmpty() {
    if (!this.emptyEl) return;
    this.emptyEl.hidden = !!this.clips.length;
    if (!this.clips.length) this.emptyEl.textContent = t('hlEmpty');
  }

  _renderStrip() {
    if (!this.strip) return;
    this.strip.innerHTML = '';
    this.plan.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `reel-chip${i === this.i ? ' on' : ''}`;
      b.dataset.i = String(i);
      b.innerHTML = `<b>${i + 1}</b><span>${esc(captionFor(c))}</span>`;
      b.addEventListener('click', (e) => { e.preventDefault(); this._click(); this.seekClip(i); });
      this.strip.appendChild(b);
    });
  }

  _syncButtons() {
    const play = $('btnReelPlay');
    if (play) play.textContent = this.playing ? t('hlPause') : t('hlPlay');
    const save = $('btnReelSave');
    if (save) save.disabled = this.saving || !this.clips.length;
    const prev = $('btnReelPrev'), next = $('btnReelNext');
    for (const b of [prev, next]) if (b) b.disabled = this.clips.length < 2;
    if (this.hintEl) this.hintEl.textContent = t(this.saving ? 'hlSaving' : 'hlHint');
  }

  // ---------------- saving ----------------
  async save() {
    if (this.saving || !this.clips.length) return;
    this.saving = true;
    this._syncButtons();
    try {
      const blob = await this.record();
      if (blob) {
        const name = reelFileName(new Date());
        download(blob, name);
        if (this.stateEl) this.stateEl.textContent = t('hlSaved').replace('{name}', name);
      } else {
        await this.saveStill();
      }
    } catch (e) {
      console.warn('[reel] could not write the video', e);
      if (this.stateEl) this.stateEl.textContent = t('hlNoRec');
    } finally {
      this.saving = false;
      this._syncButtons();
    }
  }

  // A real-time capture of an offscreen replay: 720p, 30 fps, the score underneath, captions baked in.
  async record() {
    if (typeof MediaRecorder !== 'function' || !this.canvas) return null;
    const cv = document.createElement('canvas');
    cv.width = OUT.w; cv.height = OUT.h;
    const ctx = cv.getContext('2d', { alpha: false });
    if (!ctx || !cv.captureStream) return null;
    const stream = cv.captureStream(OUT.fps);
    // the score: the night's own sound was never recorded, so the reel gets one of its own
    let score = null;
    try {
      const actx = this._audioContext();
      if (actx && typeof actx.createMediaStreamDestination === 'function') {
        score = new ReelScore(actx);
        for (const tr of score.stream.getAudioTracks()) stream.addTrack(tr);
      }
    } catch {
      score = null; // a silent picture is still a picture
    }
    const type = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm']
      .find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } });
    let rec;
    try {
      rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: OUT.bits } : undefined);
    } catch {
      score?.stop();
      for (const tr of stream.getTracks()) tr.stop();
      return null;
    }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    const total = scoreLength(this.plan);
    // the first frames of every episode, decoded before the tape rolls: no placeholder ever reaches the file
    await this._prewarm();
    rec.start(250);
    if (score) score.schedule(this.plan); // (scheduled ahead in AudioContext time: no drift)
    // the picture: real time, at the export size, dissolving between the captured frames
    if (!this.grain) this.grain = grainTile();
    await new Promise((resolve) => {
      const t0 = performance.now();
      const loop = () => {
        const now = (performance.now() - t0) / 1000;
        drawExport(ctx, this.plan, Math.min(now, total), total, this, this.grain);
        if (now < total) requestAnimationFrame(loop);
        else resolve();
      };
      loop();
    });
    await new Promise((r) => setTimeout(r, 260));
    if (rec.state !== 'inactive') rec.stop();
    await stopped;
    score?.stop();
    for (const tr of stream.getTracks()) tr.stop();
    return chunks.length ? new Blob(chunks, { type: 'video/webm' }) : null;
  }

  // decode the opening beat of every clip before recording (a few hundred kB, a few milliseconds)
  async _prewarm() {
    for (const c of this.plan) {
      for (const f of c.frames.slice(0, 2)) await this._ready(f);
    }
  }

  // the engine's own AudioContext, so the file's score does not cost a second context (and is unlocked by
  // the click that started the save)
  _audioContext() {
    const a = this.audio;
    const c = a && a.ctx;
    if (!c) return null;
    try { if (c.state === 'suspended') c.resume(); } catch { /* it will stay silent */ }
    return c;
  }

  // no MediaRecorder (an old browser, a locked-down iframe): at least the poster of the best shot
  async saveStill() {
    const best = this.clips.slice().sort((a, b) => b.weight - a.weight)[0];
    const f = best && frameAt(best.frames, best.start + (best.end - best.start) * 0.55);
    const bm = f ? await this._ready(f) : null;
    if (!bm) { if (this.stateEl) this.stateEl.textContent = t('hlNoRec'); return; }
    const cv = document.createElement('canvas');
    cv.width = OUT.w; cv.height = OUT.h;
    const ctx = cv.getContext('2d');
    drawStill(ctx, bm, best);
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
    if (!blob) return;
    const name = reelFileName(new Date(), 'png');
    download(blob, name);
    if (this.stateEl) this.stateEl.textContent = t('hlNoRec') + ' ' + t('hlSaved').replace('{name}', name);
  }
}

// ---------------- words ----------------
// one caption per kind; a death names its killer, because that is the joke
export function captionFor(clip) {
  if (!clip) return '';
  const death = (cause) => {
    const by = t('deathBy');
    const name = (by && by[cause]) || by?.listener || '';
    return `${t('hlKDeath')}${name ? ' · ' + name : ''}`;
  };
  const table = {
    death: () => death(clip.meta && clip.meta.cause),
    seize: () => t('hlKSeize'),
    grab: () => t('hlKGrab'),
    down: () => t('hlKDown'),
    revive: () => t('hlKRevive'),
    genBroken: () => t('hlKGenBroken'),
    genStart: () => t('hlKGenStart'),
    chain: () => t('hlKChain'),
    scream: () => t('hlKScream'),
    escape: () => t('hlKEscape'),
    left: () => t('hlKLeft'),
    win: () => t('hlKWin'),
  };
  return (table[clip.kind] || (() => t('hlKOther')))();
}

// ---------------- both ends of an exported file ----------------
const FONT = '"JetBrains Mono", ui-monospace, monospace';

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function cover(ctx, img, x, y, w, h) {
  const sw = img.width || w, sh = img.height || h;
  const k = Math.max(w / sw, h / sh);
  const ww = sw * k, hh = sh * k;
  ctx.drawImage(img, x + (w - ww) / 2, y + (h - hh) / 2, ww, hh);
}

function stamp(ctx, at) {
  ctx.save();
  ctx.font = `600 15px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(223,230,207,0.82)';
  ctx.fillText(t('title') + ' · REC', 26, 22);
  ctx.fillStyle = '#ff5a4a';
  ctx.beginPath();
  ctx.arc(232, 29, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(223,230,207,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(at, 934, 22);
  ctx.restore();
}

function caption(ctx, text, sub, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const y = 540 - 108;
  const g = ctx.createLinearGradient(0, y - 20, 0, 540);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 20, 960, 540 - y + 20);
  ctx.fillStyle = '#e8e4d3';
  ctx.font = `600 30px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 40, 540 - 56);
  if (sub) {
    ctx.fillStyle = 'rgba(190,196,170,0.72)';
    ctx.font = `400 16px ${FONT}`;
    ctx.fillText(sub, 40, 540 - 28);
  }
  ctx.restore();
}

// the whole file, drawn at time `now` into a 1280×720 context: title card, then the episodes one after
// another with their captions, then the end card, and a film grain over all of it
function drawExport(ctx, plan, now, total, reel, grain) {
  const W = OUT.w, H = OUT.h;
  ctx.save();
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);
  const intro = 1.5;
  if (now < intro) {
    const k = Math.min(1, now / 0.5);
    ctx.globalAlpha = k;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e4d3';
    ctx.font = `700 104px ${FONT}`;
    ctx.fillText('ТИШЕ', W / 2, 320);
    ctx.font = `400 26px ${FONT}`;
    ctx.fillStyle = 'rgba(200,206,180,0.8)';
    ctx.fillText(t('hlTitle'), W / 2, 372);
    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = 'rgba(150,158,135,0.7)';
    ctx.fillText(t('hlSub'), W / 2, 414);
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }
  const body = reelDuration(plan);
  if (now > intro + body) {
    const k = Math.min(1, (now - intro - body) / 0.5);
    ctx.globalAlpha = k;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e4d3';
    ctx.font = `400 34px ${FONT}`;
    ctx.fillText(t('hlEndCard'), W / 2, 350);
    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = 'rgba(150,158,135,0.75)';
    ctx.fillText(t('hlEndSub'), W / 2, 392);
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }
  let at = now - intro;
  let clip = plan[plan.length - 1];
  let local = clip.duration;
  for (const c of plan) {
    if (at < c.duration) { clip = c; local = at; break; }
    at -= c.duration;
  }
  const inner = Math.max(0, Math.min(clip.end - clip.start, local - clip.lead));
  // the picture, dissolving between frames at export resolution
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  try { ctx.filter = 'contrast(1.05) saturate(0.92)'; } catch { /* no canvas filters: fine */ }
  if (reel) {
    reel._pump(clip, clip.start + inner, 6);
    const prevLast = reel.lastBitmap;
    reel.lastBitmap = null;
    reel._paintFrames(ctx, clip, clip.start + inner, 0, 0, W, H, local, clip.duration);
    reel.lastBitmap = prevLast;
  }
  try { ctx.filter = 'none'; } catch { /* */ }
  // the found-footage floor
  const g = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 860);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.58)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (grain) {
    const pat = ctx.createPattern(grain, 'repeat');
    if (pat) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.translate(-Math.random() * 96, -Math.random() * 96);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W + 96, H + 96);
      ctx.restore();
    }
  }
  // scanlines, barely there
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = '#dfe6cf';
  for (let y = (now * 24) % 5; y < H; y += 5) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 1;
  // the captions scale with the file: the drawing below is written in 960×540 units
  ctx.save();
  ctx.scale(W / 960, H / 540);
  stamp(ctx, `${t('hlEpisode')} ${clip.index + 1}/${plan.length}`);
  const fade = Math.max(0, Math.min(1, local / 0.3, (clip.duration - local) / 0.3));
  caption(ctx, captionFor(clip), t('hlStamp'), fade);
  ctx.restore();
  ctx.restore();
}

function drawStill(ctx, bm, clip) {
  const W = OUT.w, H = OUT.h;
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);
  cover(ctx, bm, 0, 0, W, H);
  ctx.save();
  ctx.scale(W / 960, H / 540);
  stamp(ctx, t('hlTitle'));
  caption(ctx, captionFor(clip || {}), t('hlStillSub'));
  ctx.restore();
}
