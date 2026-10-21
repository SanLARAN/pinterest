// The reel: what the night's highlights look like on screen (2.1u). Finds the clip strip, plays the frames
// the director kept, and writes the whole thing out as a video file with MediaRecorder — the picture, the
// captions and the title card all drawn into the exported canvas, because a file has no DOM to lean on.
//
// Frames arrive as { t, blob } (a JPEG grabbed from the game's canvas). Playback decodes them lazily and
// keeps them as ImageBitmaps; nothing here touches the game, so the reel also opens from the menu.
import { t } from '../core/i18n.js';
import { reelPlan, reelDuration, reelFileName, frameAt } from '../game/highlights.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// the CAPTURED frame is 320×180 already cropped to 16:9 (see main.js), so drawing it fills a 16:9 canvas
const STAGE_W = 320, STAGE_H = 180;

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
const OUT_W = 960, OUT_H = 540;

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
    this.bitmaps = new WeakMap(); // frame object → ImageBitmap | 'pending'
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
    this._prefetch(0);
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
    this._prefetch(this.i);
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
    this._prefetch(this.i);
    this._renderStrip();
    this._syncButtons();
    this._caption();
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
          this.playing = true; // (seekClip keeps it running)
        } else {
          this.localT = c.duration;
          this.playing = false;
          this._syncButtons();
        }
      }
    }
    this._draw();
  }

  _tick = (now) => {
    if (!this.shown) { this._raf = 0; return; }
    const dt = Math.min(0.1, Math.max(0, (now - this._last) / 1000));
    this._last = now;
    this.frame(dt);
    this._raf = requestAnimationFrame(this._tick);
  };

  // ---------------- drawing ----------------
  _prefetch(i) {
    const c = this.plan[i];
    if (!c) return;
    for (const f of c.frames) this._bitmap(f);
    const next = this.plan[i + 1];
    if (next) for (const f of next.frames) this._bitmap(f);
  }

  _bitmap(f) {
    if (!f) return null;
    const cached = this.bitmaps.get(f);
    if (cached && cached !== 'pending') return cached;
    if (cached === 'pending') return null;
    this.bitmaps.set(f, 'pending');
    const blob = f.frame && f.frame.blob;
    if (!blob || typeof blob.then !== 'function') return null;
    blob.then((b) => {
      if (!b) { this.bitmaps.set(f, null); return; }
      decode(b).then((bm) => this.bitmaps.set(f, bm)).catch(() => this.bitmaps.set(f, null));
    }).catch(() => this.bitmaps.set(f, null));
    return null;
  }

  _draw() {
    if (!this.ctx) return;
    const c = this.plan[this.i];
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // the black the reel lives in, with a little scanline breathing so a still frame still feels alive
    ctx.fillStyle = '#07090a';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    if (!c) { ctx.restore(); return; }
    const at = c.start + Math.max(0, Math.min(c.end - c.start, this.localT - c.lead));
    const f = frameAt(c.frames, at);
    const bm = this._bitmap(f);
    if (bm) this.lastBitmap = bm;
    const img = bm || this.lastBitmap;
    if (img) {
      const sw = img.width || STAGE_W, sh = img.height || STAGE_H;
      const k = Math.max(STAGE_W / sw, STAGE_H / sh);
      const w = sw * k, h = sh * k;
      ctx.drawImage(img, (STAGE_W - w) / 2, (STAGE_H - h) / 2, w, h);
    } else {
      // not decoded yet: the frame's number, so the reel never looks broken
      ctx.fillStyle = '#5c6152';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▚', STAGE_W / 2, STAGE_H / 2);
    }
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
    // the bar
    if (this.progEl) {
      const d = this.plan.reduce((a, k) => a + k.duration, 0) || 1;
      const before = this.plan.slice(0, this.i).reduce((a, k) => a + k.duration, 0);
      this.progEl.style.width = `${Math.min(100, ((before + this.localT) / d) * 100).toFixed(2)}%`;
    }
    this._caption();
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

  // A real-time capture of an offscreen replay: 30 fps, captions baked in, a card at each end.
  async record() {
    if (typeof MediaRecorder !== 'function' || !this.canvas) return null;
    const cv = document.createElement('canvas');
    cv.width = OUT_W; cv.height = OUT_H;
    const ctx = cv.getContext('2d');
    if (!ctx || !cv.captureStream) return null;
    const stream = cv.captureStream(30);
    const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } });
    let rec;
    try {
      rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 5_000_000 } : undefined);
    } catch {
      return null;
    }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    rec.start(250);
    // decode everything up front: a video that stutters while recording stutters forever
    for (const c of this.plan) for (const f of c.frames) await this._ready(f);
    const total = 1.5 + reelDuration(this.plan) + 1.6;
    await new Promise((resolve) => {
      const t0 = performance.now();
      const loop = () => {
        const now = (performance.now() - t0) / 1000;
        drawExport(ctx, this.plan, Math.min(now, total), total, this.bitmaps);
        if (now < total) requestAnimationFrame(loop);
        else resolve();
      };
      loop();
    });
    await new Promise((r) => setTimeout(r, 220));
    if (rec.state !== 'inactive') rec.stop();
    await stopped;
    for (const tr of stream.getTracks()) tr.stop();
    return chunks.length ? new Blob(chunks, { type: 'video/webm' }) : null;
  }

  _ready(f) {
    return new Promise((res) => {
      const cached = this.bitmaps.get(f);
      if (cached && cached !== 'pending') return res(cached);
      const blob = f.frame && f.frame.blob;
      if (!blob || typeof blob.then !== 'function') return res(null);
      blob.then((b) => (b ? decode(b) : null)).then((bm) => { this.bitmaps.set(f, bm); res(bm); }).catch(() => res(null));
    });
  }

  // no MediaRecorder (an old browser, a locked-down iframe): at least the poster of the best shot
  async saveStill() {
    const best = this.clips.slice().sort((a, b) => b.weight - a.weight)[0];
    const f = best && frameAt(best.frames, best.start + (best.end - best.start) * 0.55);
    const bm = f ? await this._ready(f) : null;
    if (!bm) { if (this.stateEl) this.stateEl.textContent = t('hlNoRec'); return; }
    const cv = document.createElement('canvas');
    cv.width = OUT_W; cv.height = OUT_H;
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
  // top-left: the show's name and a live dot; top-right: the moment's number in the shift
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

function drawExport(ctx, plan, now, total, bitmaps) {
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  const intro = 1.5;
  if (now < intro) {
    const k = Math.min(1, now / 0.5);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e4d3';
    ctx.font = `700 78px ${FONT}`;
    ctx.fillText('ТИШЕ', OUT_W / 2, 230);
    ctx.font = `400 20px ${FONT}`;
    ctx.fillStyle = 'rgba(200,206,180,0.8)';
    ctx.fillText(t('hlTitle'), OUT_W / 2, 272);
    ctx.font = `400 15px ${FONT}`;
    ctx.fillStyle = 'rgba(150,158,135,0.7)';
    ctx.fillText(t('hlSub'), OUT_W / 2, 306);
    ctx.restore();
    return;
  }
  if (now > intro + reelDuration(plan)) {
    const k = Math.min(1, (now - intro - reelDuration(plan)) / 0.5);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e4d3';
    ctx.font = `400 26px ${FONT}`;
    ctx.fillText(t('hlEndCard'), OUT_W / 2, 262);
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = 'rgba(150,158,135,0.75)';
    ctx.fillText(t('hlEndSub'), OUT_W / 2, 296);
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
  const f = frameAt(clip.frames, clip.start + inner);
  const bm = f ? bitmaps.get(f) : null;
  if (bm) cover(ctx, bm, 0, 0, OUT_W, OUT_H);
  // the cut: a blink of black at each end of a clip
  const edge = Math.min(local, clip.duration - local);
  if (edge < 0.12) {
    ctx.fillStyle = `rgba(0,0,0,${1 - edge / 0.12})`;
    ctx.fillRect(0, 0, OUT_W, OUT_H);
  }
  const g = ctx.createRadialGradient(OUT_W / 2, OUT_H / 2, 120, OUT_W / 2, OUT_H / 2, 640);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  stamp(ctx, `${t('hlEpisode')} ${clip.index + 1}/${plan.length}`);
  const fade = Math.max(0, Math.min(1, local / 0.3, (clip.duration - local) / 0.3));
  caption(ctx, captionFor(clip), t('hlStamp'), fade);
}

function drawStill(ctx, bm, clip) {
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  cover(ctx, bm, 0, 0, OUT_W, OUT_H);
  stamp(ctx, t('hlTitle'));
  caption(ctx, captionFor(clip || {}), t('hlStillSub'));
}
