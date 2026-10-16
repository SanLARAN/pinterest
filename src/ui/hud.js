// Minimal HUD. Nothing lives on screen permanently except a faint dot.
//  - your loudness is a ring around the dot (with a dashed red line where screaming starts)
//  - stamina / stones appear under the dot only when they change
//  - time and score "peek" in at the start, every minute, and while Tab is held (tap top on touch)
//  - a hairline at the very top of the screen slowly fills toward dawn
// Only touches the DOM when values actually change.
import { t } from '../core/i18n.js';
import { CFG } from '../core/config.js';

const $ = (id) => document.getElementById(id);

export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
export function fmtScore(n) {
  return Math.floor(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
}

const RING_MIN = 7;
const RING_SPAN = 27;
const ringR = (u) => RING_MIN + RING_SPAN * Math.min(1.12, Math.max(0, u));

export class HUD {
  constructor() {
    this.el = $('hud');
    this.dawn = $('dawnFill');
    this.peekEl = $('peek');
    this.peekTime = $('peekTime');
    this.peekSub = $('peekSub');
    this.stones = $('stones');
    this.stamWrap = $('stam');
    this.stam = $('stamFill');
    this.cross = $('crosshair');
    this.noiseRing = $('noiseRing');
    this.screamRing = $('screamRing');
    this.ripple = $('ripple');
    this.alert = $('alert');
    this.hint = $('hint');
    this.intro = $('intro');
    this.popups = [];
    const pc = $('popups');
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'popup';
      pc.appendChild(d);
      this.popups.push(d);
    }
    this.popIdx = 0;
    this.cache = {};
    this.hintKey = null;
    this.clock = 0;
    this.peekUntil = 0;
    this.stonesUntil = 0;
    this.lastMinute = -1;
    this.ringU = 0;
  }

  show(on) {
    this.el.classList.toggle('hidden', !on);
    if (on) {
      this.cache = {};
      this.lastMinute = -1;
      this.ringU = 0;
    }
  }

  _set(key, el, val) {
    if (this.cache[key] === val) return;
    this.cache[key] = val;
    el.textContent = val;
  }
  _cls(key, el, cls, on) {
    const k = key + ':' + cls;
    if (this.cache[k] === on) return;
    this.cache[k] = on;
    el.classList.toggle(cls, on);
  }

  // show time + score for a few seconds
  peek(sec = 3) {
    this.peekUntil = Math.max(this.peekUntil, this.clock + sec);
  }

  update(g, dt, peekHeld = false) {
    this.clock += dt;
    // hairline toward dawn
    const pct = Math.min(1, g.time / CFG.RUN_SECONDS);
    const pv = pct.toFixed(4);
    if (this.cache.dawn !== pv) {
      this.cache.dawn = pv;
      this.dawn.style.transform = `scaleX(${pv})`;
    }
    // every survived minute, the time surfaces for a moment
    const minute = Math.floor(g.time / 60);
    if (minute !== this.lastMinute) {
      if (this.lastMinute < 0) this.peek(g.time < 2 ? 4.5 : 3);
      else this.peek(3.2);
      this.lastMinute = minute;
    }
    const show = peekHeld || this.clock < this.peekUntil;
    if (show) {
      const left = Math.max(0, CFG.RUN_SECONDS - g.time);
      this._set('pt', this.peekTime, fmtTime(g.time));
      this._set('ps', this.peekSub, `${t('dawnIn')} ${fmtTime(left)} · ${t('score')} ${fmtScore(g.score)} ×${g.mult.toFixed(1)}`);
    }
    this._cls('peek', this.peekEl, 'show', show);

    // stones: only when the count changes (or while peeking)
    const st = g.player.stones;
    if (this.cache.stones !== st) {
      if (this.cache.stones !== undefined) this.stonesUntil = this.clock + 2.4;
      this.cache.stones = st;
      [...this.stones.children].forEach((c, i) => c.classList.toggle('on', i < st));
    }
    this._cls('stones', this.stones, 'show', show || this.clock < this.stonesUntil);

    // stamina: only while it isn't full
    const sp = g.player.stamina;
    const sv = Math.round(sp);
    if (this.cache.stam !== sv) {
      this.cache.stam = sv;
      this.stam.style.transform = `scaleX(${(sp / 100).toFixed(3)})`;
    }
    this._cls('stam', this.stamWrap, 'show', sp < 99.5);
    this._cls('stam', this.stamWrap, 'low', g.player.exhausted);
  }

  flashStones() {
    this.stonesUntil = this.clock + 2.4;
  }

  // loudness ring. u-space: 0 = silence, uT = where sound starts to echo, uS = scream.
  ring(dt, mic, chargeLoud, micOn) {
    let uT = 0.3;
    if (micOn && mic.screamDb > mic.floor) uT = Math.min(0.8, Math.max(0.05, (mic.trig - mic.floor) / (mic.screamDb - mic.floor)));
    const uS = uT + CFG.SCREAM * (1 - uT);
    let u = micOn ? mic.meter : 0;
    if (chargeLoud > 0) u = Math.max(u, uT + chargeLoud * (1 - uT));
    this.ringU = u > this.ringU ? u : Math.max(u, this.ringU - dt * 2.4);
    const v = this.ringU;
    const r = ringR(v).toFixed(1);
    if (this.cache.ringR !== r) {
      this.cache.ringR = r;
      this.noiseRing.setAttribute('r', r);
    }
    const sr = ringR(uS).toFixed(1);
    if (this.cache.scrR !== sr) {
      this.cache.scrR = sr;
      this.screamRing.setAttribute('r', sr);
    }
    const zone = v >= uS ? 's' : v >= uT ? 'e' : v > 0.09 ? 'q' : ''; // below 0.09: room noise, keep the dot alone
    if (this.cache.zone !== zone) {
      this.cache.zone = zone;
      this.cross.dataset.zone = zone;
    }
    this._cls('cross', this.cross, 'charging', chargeLoud > 0);
  }

  setMic() {
    /* the minimal HUD has no mic button; toggles are announced with a popup */
  }

  pulseCross() {
    this.ripple.classList.remove('go');
    void this.ripple.offsetWidth;
    this.ripple.classList.add('go');
  }

  popup(text, kind = '') {
    const d = this.popups[this.popIdx++ % this.popups.length];
    d.textContent = text;
    d.className = 'popup';
    void d.offsetWidth;
    d.className = 'popup show ' + kind;
  }

  flashAlert(text, kind = '', dur = 1.6) {
    this.alert.textContent = text;
    this.alert.dataset.text = text;
    this.alert.className = '';
    void this.alert.offsetWidth;
    this.alert.className = 'show ' + kind;
    this.alert.style.setProperty('--dur', dur + 's');
  }

  setHint(text) {
    if (this.hintKey === text) return;
    this.hintKey = text;
    if (!text) {
      this.hint.classList.remove('show');
      return;
    }
    this.hint.classList.remove('show');
    void this.hint.offsetWidth;
    this.hint.innerHTML = text;
    this.hint.classList.add('show');
  }

  setIntro(big, small) {
    if (!big) {
      this.intro.classList.remove('show');
      return;
    }
    this.intro.innerHTML = `<div class="big">${big}</div>${small ? `<div class="small">${small}</div>` : ''}`;
    this.intro.classList.add('show');
  }
}
