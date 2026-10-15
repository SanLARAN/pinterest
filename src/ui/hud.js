// HUD: DOM overlay. Only touches the DOM when values actually change.
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

export class HUD {
  constructor() {
    this.el = $('hud');
    this.score = $('scoreVal');
    this.mult = $('multVal');
    this.timer = $('timerVal');
    this.dawn = $('dawnFill');
    this.dawnLbl = $('dawnLbl');
    this.stones = $('stones');
    this.stam = $('stamFill');
    this.stamWrap = $('stamina');
    this.meterFill = $('meterFill');
    this.meterTrig = $('meterTrig');
    this.meterScream = $('meterScream');
    this.meterLbl = $('meterLbl');
    this.meter = $('meter');
    this.alert = $('alert');
    this.hint = $('hint');
    this.intro = $('intro');
    this.chargeRing = $('chargeRing');
    this.cross = $('crosshair');
    this.micBtn = $('micBtn');
    this.popups = [];
    const pc = $('popups');
    for (let i = 0; i < 8; i++) {
      const d = document.createElement('div');
      d.className = 'popup';
      pc.appendChild(d);
      this.popups.push(d);
    }
    this.popIdx = 0;
    this.cache = {};
    this.alertUntil = 0;
    this.hintKey = null;
  }

  show(on) {
    this.el.classList.toggle('hidden', !on);
  }

  _set(key, el, val) {
    if (this.cache[key] === val) return;
    this.cache[key] = val;
    el.textContent = val;
  }

  update(g) {
    this._set('score', this.score, fmtScore(g.score));
    this._set('mult', this.mult, '×' + g.mult.toFixed(1));
    this._set('timer', this.timer, fmtTime(g.time));
    const left = CFG.RUN_SECONDS - g.time;
    this._set('dawnLbl', this.dawnLbl, `${t('dawnIn')} ${fmtTime(left)}`);
    const pct = Math.min(100, (g.time / CFG.RUN_SECONDS) * 100).toFixed(2);
    if (this.cache.dawn !== pct) {
      this.cache.dawn = pct;
      this.dawn.style.width = pct + '%';
    }
    const st = g.player.stones;
    if (this.cache.stones !== st) {
      this.cache.stones = st;
      [...this.stones.children].forEach((c, i) => c.classList.toggle('on', i < st));
    }
    const sp = g.player.stamina;
    const sv = Math.round(sp);
    if (this.cache.stam !== sv) {
      this.cache.stam = sv;
      this.stam.style.transform = `scaleX(${sp / 100})`;
    }
    this.stamWrap.classList.toggle('low', g.player.exhausted);
    this.stamWrap.classList.toggle('full', sp >= 99.5);
  }

  meterUpdate(mic, extraLevel, micOn) {
    const lvl = Math.max(mic.meter, extraLevel);
    const pct = Math.min(1, lvl / 1.05);
    this.meterFill.style.transform = `scaleY(${pct})`;
    // trigger line position in meter space: trig relative to floor..scream
    let trigPos = 0.32;
    if (micOn && mic.screamDb > mic.floor) trigPos = Math.min(0.8, Math.max(0.05, (mic.trig - mic.floor) / (mic.screamDb - mic.floor)));
    const tp = (trigPos * 100).toFixed(1);
    if (this.cache.trig !== tp) {
      this.cache.trig = tp;
      this.meterTrig.style.bottom = tp + '%';
    }
    const scPos = (CFG.SCREAM * (1 - trigPos) + trigPos) / 1.05;
    const sp = (scPos * 100).toFixed(1);
    if (this.cache.scr !== sp) {
      this.cache.scr = sp;
      this.meterScream.style.bottom = sp + '%';
      this.meterScream.style.height = 100 - sp + '%';
    }
    let zone = 'q';
    if (pct >= scPos) zone = 's';
    else if (pct >= trigPos) zone = 'e';
    if (this.cache.zone !== zone) {
      this.cache.zone = zone;
      this.meter.dataset.zone = zone;
      this.meterLbl.textContent = zone === 's' ? t('zoneScream') : zone === 'e' ? t('zoneEcho') : t('zoneQuiet');
    }
    this.meter.classList.toggle('nomic', !micOn);
  }

  setMic(state) {
    const on = state === 'on';
    this.micBtn.classList.toggle('off', !on);
    this.micBtn.title = on ? t('micOn') : t('micOff');
  }

  charge(v, danger = false) {
    // v in [0,1] or -1 for hidden
    const c = 2 * Math.PI * 18;
    if (v < 0) {
      if (this.cache.charge !== -1) {
        this.cache.charge = -1;
        this.chargeRing.style.strokeDashoffset = c;
        this.cross.classList.remove('charging', 'danger');
      }
      return;
    }
    this.cache.charge = v;
    this.chargeRing.style.strokeDashoffset = c * (1 - v);
    this.cross.classList.add('charging');
    this.cross.classList.toggle('danger', danger);
  }

  pulseCross() {
    this.cross.classList.remove('kick');
    void this.cross.offsetWidth;
    this.cross.classList.add('kick');
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
