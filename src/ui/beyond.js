// The other side. Down or dead on a co-op night, you hear everyone else who is — wherever they lie, close and
// clear, as if they were right beside you — and they hear you. The living hear none of it (see
// Game.updateRemotes and Audio.voiceMode). This little list is who's over here with you, and which of you is
// talking right now.
import { t } from '../core/i18n.js';
import { PLAYER_COLORS } from '../game/remote.js';

const TALK = 0.3; // level at which a row counts as talking
const HOLD = 0.3; // s: keeps a row lit through the gaps between words

export class Beyond {
  constructor(el) {
    this.el = el;
    this.on = false;
    this.key = '';
    this.rows = new Map(); // id -> { div, lv, hold, talk, css }
  }

  hide() {
    if (!this.on) return;
    this.on = false;
    this.key = '';
    document.body.classList.remove('beyond-on');
  }

  update(game, dt) {
    const p = game.player;
    const live = game.state === 'play' || game.state === 'dawn' || game.state === 'escape';
    // (not while the thing that got you is still in your face)
    if (!game.online || p.alive || !live || game.localDeath === true) return this.hide();
    if (!this.on) {
      this.on = true;
      document.body.classList.add('beyond-on');
    }
    const audio = game.audio, mic = game.mic;
    const me = game.coop && game.coop.me ? game.coop.me() : null;
    const list = [{ id: p.id, name: me ? me.name : '', color: PLAYER_COLORS[me ? me.slot % 4 : 0], self: true, gone: !!p.gone, slot: me ? me.slot : 0 }];
    for (const r of game.remotes.values()) if (!r.alive) list.push({ id: r.id, name: r.name, color: r.color, self: false, gone: !!r.gone, slot: r.slot });
    list.sort((a, b) => (a.self ? -1 : b.self ? 1 : a.slot - b.slot));
    const micOf = (it) => (it.self ? mic.state === 'on' : audio.voices.has(it.id));
    const key = list.map((it) => `${it.id}:${it.name}:${it.gone ? 1 : 0}:${micOf(it) ? 1 : 0}`).join('|') + `|${t('beyondTitle')}`;
    if (key !== this.key) {
      this.key = key;
      this._render(list, micOf);
    }
    // who's talking: your own mic, and each of them as you hear them
    for (const it of list) {
      const row = this.rows.get(it.id);
      if (!row) continue;
      let lv = 0;
      if (it.self) lv = mic.state === 'on' ? Math.min(1, Math.max(mic.loud > 0 ? 0.45 : 0, (mic.meter || 0) * 0.85)) : 0;
      else lv = audio.voiceLevel(it.id);
      row.lv = Math.max(lv, row.lv - dt * 2.4);
      row.hold = lv > TALK ? HOLD : Math.max(0, row.hold - dt);
      const talk = row.hold > 0;
      if (talk !== row.talk) {
        row.talk = talk;
        row.div.classList.toggle('talk', talk);
      }
      const css = row.lv.toFixed(2);
      if (css !== row.css) {
        row.css = css;
        row.div.style.setProperty('--lv', css);
      }
    }
  }

  _render(list, micOf) {
    this.rows.clear();
    this.el.textContent = '';
    const head = document.createElement('div');
    head.className = 'by-h';
    head.textContent = t('beyondTitle');
    this.el.appendChild(head);
    for (const it of list) {
      const div = document.createElement('div');
      div.className = `by-row${micOf(it) ? '' : ' nomic'}${it.self ? ' self' : ''}`;
      div.style.setProperty('--c', it.color);
      div.dataset.id = it.id;
      const name = it.self ? it.name || t('beyondYou') : it.name;
      const tag = [it.self && it.name ? t('beyondYou') : '', micOf(it) ? '' : t('beyondNoMic')].filter(Boolean).join(' · ');
      div.innerHTML = `<i class="by-v"><s></s><s></s><s></s></i><b>${esc(it.gone ? `† ${name}` : name)}</b>${tag ? `<em>${esc(tag)}</em>` : ''}`;
      this.el.appendChild(div);
      this.rows.set(it.id, { div, lv: 0, hold: 0, talk: false, css: '' });
    }
    const sub = document.createElement('div');
    sub.className = 'by-sub';
    sub.textContent = t(list.length > 1 ? 'beyondSub' : 'beyondAlone');
    this.el.appendChild(sub);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
