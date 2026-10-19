// Your volume for each friend's voice: a slider (+ mute) per teammate, in the lobby and in the pause menu.
// Remembered by name, so the same friends sound right next time too.
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';

const MAX = 2; // the slider runs 0..200 %
const KEEP = 40; // how many names we remember
// loudness-like: 50 % ≈ half as loud (−10 dB), 200 % ≈ twice as loud (+10 dB)
export const volGain = (v) => (v <= 0.001 ? 0 : Math.pow(v, 1.661));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SPEAKER = (muted) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/>${
    muted ? '<path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>' : '<path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4"/>'
  }</svg>`;

export class VoiceMix {
  constructor(audio) {
    this.audio = audio;
    this.vol = new Map(); // peer id -> 0..MAX, this session
    this.names = new Map(); // peer id -> the name we know them by
    this.before = new Map(); // peer id -> volume before you muted them
    this._saveT = 0;
  }

  _stored(name) {
    const m = settings.voiceVol;
    const v = m && typeof m[name] === 'number' ? m[name] : 1;
    return Math.max(0, Math.min(MAX, v));
  }

  // a friend's name is known (or changed): pick up what you set for them before
  bind(id, name) {
    if (!id || !name || this.names.get(id) === name) return;
    this.names.set(id, name);
    if (!this.vol.has(id)) this._apply(id, this._stored(name));
    else this._remember(name, this.vol.get(id)); // they renamed: your setting follows them
  }

  get(id) {
    return this.vol.has(id) ? this.vol.get(id) : 1;
  }

  set(id, v) {
    v = Math.max(0, Math.min(MAX, Math.round(v * 20) / 20));
    this._apply(id, v);
    const name = this.names.get(id);
    if (name) this._remember(name, v);
  }

  toggleMute(id) {
    const v = this.get(id);
    if (v > 0) {
      this.before.set(id, v);
      this.set(id, 0);
    } else this.set(id, this.before.get(id) || 1);
  }

  _apply(id, v) {
    this.vol.set(id, v);
    this.audio.voiceVolume(id, volGain(v));
  }

  _remember(name, v) {
    const m = settings.voiceVol && typeof settings.voiceVol === 'object' ? settings.voiceVol : {};
    delete m[name]; // re-insert = most recent last
    if (Math.abs(v - 1) > 0.001) m[name] = v;
    const keys = Object.keys(m);
    for (let i = 0; i < keys.length - KEEP; i++) delete m[keys[i]];
    settings.voiceVol = m;
    clearTimeout(this._saveT);
    this._saveT = setTimeout(saveSettings, 250);
  }

  // [speaker = mute] [——●——] [100%] for one friend. Double-click the slider = back to 100 %.
  control(id) {
    const el = document.createElement('div');
    el.className = 'vol';
    el.innerHTML = `<button class="vol-mute" type="button"></button><input class="vol-range" type="range" min="0" max="${MAX * 100}" step="5" /><span class="vol-v"></span>`;
    el._id = id;
    const btn = el.children[0], range = el.children[1];
    range.addEventListener('input', () => {
      this.set(el._id, range.value / 100);
      this.sync(el);
    });
    range.addEventListener('dblclick', () => {
      this.set(el._id, 1);
      this.sync(el);
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMute(el._id);
      this.sync(el);
    });
    for (const n of [btn, range]) n.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.sync(el);
    return el;
  }

  sync(el) {
    const v = this.get(el._id);
    const pct = Math.round(v * 100);
    const range = el.children[1];
    if (+range.value !== pct) range.value = pct;
    range.style.setProperty('--fill', `${(pct / (MAX * 100)) * 100}%`);
    const muted = pct === 0;
    const key = `${pct}|${muted}|${t('voiceVolume')}`;
    if (el._key === key) return;
    el._key = key;
    el.classList.toggle('muted', muted);
    el.children[2].textContent = muted ? t('voiceMuted') : `${pct}%`;
    const btn = el.children[0];
    btn.innerHTML = SPEAKER(muted);
    btn.setAttribute('aria-label', muted ? t('voiceUnmute') : t('voiceMute'));
    btn.title = muted ? t('voiceUnmute') : t('voiceMute');
    range.setAttribute('aria-label', t('voiceVolume'));
    range.title = t('voiceVolume');
  }
}

// a list of teammates with their volume controls (the pause menu)
export class VoiceList {
  constructor(el, mix, audio) {
    this.el = el;
    this.mix = mix;
    this.audio = audio;
    this.rows = new Map(); // id -> { el, dot, n, ctl, key }
  }

  // players: [{ id, name, color, dead }]
  render(players) {
    const seen = new Set();
    let prev = null;
    for (const p of players) {
      seen.add(p.id);
      this.mix.bind(p.id, p.name);
      let r = this.rows.get(p.id);
      if (!r) {
        const el = document.createElement('div');
        el.className = 'vrow';
        el.innerHTML = '<i class="dot"></i><span class="n"></span>';
        const ctl = this.mix.control(p.id);
        el.appendChild(ctl);
        r = { el, dot: el.children[0], n: el.children[1], ctl, key: '' };
        this.rows.set(p.id, r);
      }
      const key = `${p.name}|${p.color}|${p.dead ? 1 : 0}|${t('stDead')}`;
      if (r.key !== key) {
        r.key = key;
        r.el.style.setProperty('--c', p.color);
        r.el.classList.toggle('dead', !!p.dead);
        r.n.innerHTML = `${esc(p.name)}${p.dead ? `<em>${esc(t('stDead'))}</em>` : ''}`;
      }
      this.mix.sync(r.ctl);
      const at = prev ? prev.nextSibling : this.el.firstChild;
      if (at !== r.el) this.el.insertBefore(r.el, at);
      prev = r.el;
    }
    for (const [id, r] of this.rows) {
      if (!seen.has(id)) {
        r.el.remove();
        this.rows.delete(id);
      }
    }
    return players.length;
  }

  // who is talking right now
  tick() {
    for (const [id, r] of this.rows) r.dot.style.setProperty('--lv', this.audio.voiceLevel(id).toFixed(2));
  }

  clear() {
    for (const r of this.rows.values()) r.el.remove();
    this.rows.clear();
  }
}
