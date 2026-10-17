// The microphone in 15 seconds. Three steps — be quiet, talk, shout — and the thresholds set themselves:
// your normal voice lands in the "talk" band (the things out there hear it only from a couple of steps),
// a raised voice above it, and your real shout just over the scream line. Saved in settings.micCal, read by
// Mic.update (the sensitivity slider still nudges it by up to ±6 dB).
import { settings, saveSettings } from '../core/storage.js';
import { t } from '../core/i18n.js';

const STEPS = [
  { id: 'quiet', len: 3 },
  { id: 'talk', len: 6.5 },
  { id: 'shout', len: 4.5 },
];
const TOTAL = STEPS.reduce((a, s) => a + s.len, 0);

const pct = (arr, q) => {
  if (!arr.length) return -100;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * (s.length - 1))))];
};
const LO = -80, HI = 0; // the meter's range, dBFS
const pos = (db) => Math.max(0, Math.min(1, (db - LO) / (HI - LO)));

export class MicCal {
  // ensureMic: async () => true if the microphone is on (asks for it if need be); sound: (kind) => void
  constructor({ mic, ensureMic, sound = null, onDone = null }) {
    this.mic = mic;
    this.ensureMic = ensureMic;
    this.sound = sound;
    this.onDone = onDone;
    this.el = document.getElementById('micCalPanel');
    this.shown = false;
    this.run = null;
    this._raf = 0;
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) {
        if (e.target === this.el) this.close();
        return;
      }
      if (b.dataset.act === 'close' || b.dataset.act === 'done') this.close();
      else if (b.dataset.act === 'again') this.start();
    });
    window.addEventListener('keydown', (e) => {
      if (!this.shown) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      } else if (e.code === 'Enter' && this.run && this.run.done) this.close();
    }, true);
  }

  isOpen() {
    return this.shown;
  }

  async open() {
    if (this.shown) return;
    this.shown = true;
    this.el.classList.add('show');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('miccal-open');
    this._paint({ phase: 'ask' });
    const ok = await this.ensureMic();
    if (!this.shown) return;
    if (!ok) {
      this._paint({ phase: 'nomic' });
      return;
    }
    this.start();
  }

  close() {
    if (!this.shown) return;
    this.shown = false;
    this.run = null;
    cancelAnimationFrame(this._raf);
    this.el.classList.remove('show');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('miccal-open');
    this.onDone && this.onDone();
  }

  start() {
    cancelAnimationFrame(this._raf);
    this.run = { t: 0, step: 0, s: { quiet: [], talk: [], shout: [] }, last: performance.now(), done: false, result: null };
    this.sound && this.sound('step');
    this._paint({ phase: 'run' });
    const tick = () => {
      if (!this.shown || !this.run || this.run.done) return;
      const now = performance.now();
      const dt = Math.min(0.5, (now - this.run.last) / 1000); // (real seconds: it's a 15-second thing)
      this.run.last = now;
      this._tick(dt);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  _tick(dt) {
    const r = this.run;
    r.t += dt;
    let acc = 0, k = 0;
    while (k < STEPS.length && r.t > acc + STEPS[k].len) acc += STEPS[k++].len;
    if (k >= STEPS.length) return this._finish();
    if (k !== r.step) {
      r.step = k;
      this.sound && this.sound('step');
      this._paint({ phase: 'run' });
    }
    const db = this.mic.readDb();
    const into = r.t - acc;
    if (into > 0.35) r.s[STEPS[k].id].push(db); // (a moment to react to each new step)
    this._meter(db, (r.t - acc) / STEPS[k].len, r.t / TOTAL);
  }

  _finish() {
    const r = this.run;
    r.done = true;
    const floor = pct(r.s.quiet, 0.5);
    const voiced = r.s.talk.filter((d) => d > floor + 6);
    const talk = voiced.length >= 6 ? pct(voiced, 0.7) : null;
    let shout = pct(r.s.shout, 0.9);
    if (talk == null) {
      r.result = { ok: false, floor };
      this.sound && this.sound('fail');
      this._paint({ phase: 'fail' });
      return;
    }
    const shoutHeard = shout > talk + 5;
    if (!shoutHeard) shout = null; // (no shout: the scream line goes a sensible way over the voice)
    settings.micCal = { floor: Math.round(floor * 10) / 10, talk: Math.round(talk * 10) / 10, shout: shout == null ? null : Math.round(shout * 10) / 10, at: Date.now() };
    saveSettings();
    this.mic.applyCalibration && this.mic.applyCalibration();
    r.result = { ok: true, floor, talk, shout };
    this.sound && this.sound('done');
    this._paint({ phase: 'done' });
  }

  // ---------------- drawing ----------------
  _meter(db, stepK, allK) {
    const fill = this.el.querySelector('.mc-fill');
    if (fill) fill.style.transform = `scaleX(${pos(db).toFixed(3)})`;
    const sp = this.el.querySelector('.mc-step.on i');
    if (sp) sp.style.transform = `scaleX(${Math.min(1, stepK).toFixed(3)})`;
    const all = this.el.querySelector('.mc-all i');
    if (all) all.style.transform = `scaleX(${Math.min(1, allK).toFixed(3)})`;
    const sec = this.el.querySelector('.mc-sec');
    if (sec) sec.textContent = String(Math.max(0, Math.ceil(TOTAL * (1 - allK))));
  }

  _paint({ phase }) {
    const r = this.run;
    const steps = STEPS.map((s, i) => {
      const state = phase === 'run' ? (i < r.step ? 'past' : i === r.step ? 'on' : '') : phase === 'done' ? 'past' : '';
      return `<div class="mc-step ${state}"><b>${i + 1}</b><span>${t('mcStep_' + s.id)}</span><i></i></div>`;
    }).join('');
    let body = '';
    if (phase === 'ask') body = `<p class="mc-say">${t('mcAsk')}</p>`;
    else if (phase === 'nomic') body = `<p class="mc-say">${t('mcNoMic')}</p><div class="mc-btns"><button class="btn" data-act="close">${t('mcClose')}</button></div>`;
    else if (phase === 'run') {
      const s = STEPS[r.step];
      body = `<p class="mc-say">${t('mcSay_' + s.id)}</p><p class="mc-sub">${t('mcSub_' + s.id)}</p>`
        + `<div class="mc-meter"><i class="mc-fill"></i></div><div class="mc-all"><i></i></div><div class="mc-sec"></div>`;
    } else if (phase === 'fail') {
      body = `<p class="mc-say">${t('mcFail')}</p><div class="mc-btns"><button class="btn primary" data-act="again">${t('mcAgain')}</button><button class="btn" data-act="close">${t('mcClose')}</button></div>`;
    } else if (phase === 'done') {
      const R = r.result;
      const mk = (db, cls) => (db == null ? '' : `<i class="mc-mark ${cls}" style="left:${(pos(db) * 100).toFixed(1)}%"></i>`);
      const line = t('mcResult').replace('{q}', R.floor.toFixed(0)).replace('{v}', R.talk.toFixed(0)).replace('{s}', R.shout == null ? '—' : R.shout.toFixed(0));
      body = `<p class="mc-say">${t('mcDone')}</p><p class="mc-sub">${line}</p>`
        + `<div class="mc-meter result">${mk(R.floor, 'q')}${mk(R.talk, 'v')}${mk(R.shout, 's')}</div>`
        + `<p class="mc-sub">${R.shout == null ? t('mcNoShout') : t('mcWhat')}</p>`
        + `<div class="mc-btns"><button class="btn primary" data-act="done">${t('mcOk')}</button><button class="btn" data-act="again">${t('mcAgain')}</button></div>`;
    }
    this.el.innerHTML = `<div class="mc" role="document"><div class="mc-head"><h2>${t('mcTitle')}</h2><button class="book-close" data-act="close" aria-label="close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>`
      + `<div class="mc-steps">${steps}</div>${body}</div>`;
  }
}
