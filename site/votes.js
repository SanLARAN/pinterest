// The ballot: six creatures that are not in the game yet. One big live plate (the candidate's model, built with the
// game's own MeshBuilder — site/mobs.js), its page beside it (how it would hunt, the field note, a sketch of its
// voice), and six cards with the darkroom's thumbnails. One vote per device (or per account, if you are signed in
// to the game on this browser); the results open after your vote. The ballot box is Supabase
// (supabase/migrations/…_hush_mob_votes.sql); until it answers, the vote waits on this device.
import { MOBS, mobText } from './mobs.js';
import { VoteClient, MOB_IDS, shares } from './voteClient.js';
import { mobVoice } from './mobVoices.js';
import { Plate, thumb } from './plate.js';
import { atlasText } from '../src/ui/atlasData.js';
import { t, getLang } from './i18n.js';
import { esc, scramble } from './fx.js';

const ICON = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path class="w1" d="M15.5 9a4 4 0 0 1 0 6"/><path class="w2" d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  ping: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.4 10.4 0 0 0 0 14.8M19.4 4.6a10.4 10.4 0 0 1 0 14.8"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
};

export class Ballot {
  constructor(root, { audio = () => null, reduced = false, onToast = () => {} } = {}) {
    this.root = root;
    this.audio = audio;
    this.reduced = reduced;
    this.onToast = onToast;
    this.client = new VoteClient();
    this.focus = this.client.mine || MOB_IDS[0];
    this.res = null; // the last tally: { ok, counts, total, mine } or { ok: false, why }
    this.status = this.client.pending ? 'pending' : '';
    this.busy = false;
    this.visible = false;
    this.handle = null;
    this._build();
    this.plate = null;
    try {
      this.plate = new Plate(this.plateEl, {});
      this.plate.onTap = () => this._pinged();
    } catch (e) {
      console.warn('[site] no WebGL for the ballot plate', e);
      this.plateEl.classList.add('nogl');
    }
    this._cards();
    this._show(true);
    this._bind();
    this.refresh();
  }

  _build() {
    this.root.innerHTML = `
      <div class="vote-main">
        <figure class="vote-plate plate-frame">
          <div class="plate-hud" aria-hidden="true">
            <i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>
            <span class="plate-fig"></span>
            <span class="plate-stamp red show"></span>
          </div>
          <div class="plate-sweep" aria-hidden="true"></div>
          <div class="plate-tools">
            <button class="ptool voice" data-act="voice">${ICON.sound}<span></span></button>
            <button class="ptool" data-act="ping">${ICON.ping}<span></span></button>
          </div>
        </figure>
        <article class="vote-info" aria-live="polite"></article>
      </div>
      <div class="vote-cards" role="list"></div>
      <div class="vote-foot"><span class="vote-total"></span><span class="vote-status" role="status"></span></div>`;
    this.plateEl = this.root.querySelector('.vote-plate');
    this.infoEl = this.root.querySelector('.vote-info');
    this.cardsEl = this.root.querySelector('.vote-cards');
    this.totalEl = this.root.querySelector('.vote-total');
    this.statusEl = this.root.querySelector('.vote-status');
  }

  _bind() {
    this.root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !this.root.contains(b)) return;
      if (b.dataset.mob) this.pick(b.dataset.mob);
      else if (b.dataset.act === 'vote') this.cast(this.focus);
      else if (b.dataset.act === 'voice') this.voice();
      else if (b.dataset.act === 'ping') { this.plate?.ping(); this._pinged(); }
    });
    // ← → between the cards when one of them has the focus
    this.cardsEl.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const i = MOB_IDS.indexOf(this.focus);
      const k = MOB_IDS[(i + (e.key === 'ArrowRight' ? 1 : -1) + MOB_IDS.length) % MOB_IDS.length];
      this.pick(k);
      this.cardsEl.querySelector(`[data-mob="${k}"]`)?.focus();
      e.preventDefault();
    });
  }

  pick(id) {
    if (!MOB_IDS.includes(id) || id === this.focus) return;
    this._picked = true;
    const dir = MOB_IDS.indexOf(id) > MOB_IDS.indexOf(this.focus) ? 1 : -1;
    this.focus = id;
    this._show(false, dir);
  }

  _cards() {
    const L = getLang();
    this.cardsEl.innerHTML = MOBS.map((m, i) => {
      const x = m[L] || m.ru;
      return `
      <button class="vcard" role="listitem" data-mob="${m.id}" style="--i:${i}">
        <span class="ph"><img alt="" decoding="async"></span>
        <span class="vc-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="vc-name">${esc(x.name)}</span>
        <span class="vc-where">${esc(x.where)}</span>
        <span class="vc-res"><span class="vc-bar"><i></i></span><b class="vc-pct"></b></span>
        <span class="vc-mine">${ICON.check}<em>${esc(t('vote.voted'))}</em></span>
      </button>`;
    }).join('');
    MOBS.forEach((m, i) => thumb(`mob:${m.id}`, (url) => {
      const img = this.cardsEl.querySelector(`[data-mob="${m.id}"] img`);
      if (img && url) {
        img.src = url;
        img.closest('.vcard').classList.add('dev');
      }
    }, i < 2));
    this._marks();
  }

  _marks() {
    const mine = this.client.mine;
    const open = this._open();
    const sh = open ? shares(this.res.counts) : null;
    const lead = open && this.res.total ? MOB_IDS.reduce((a, id) => (this.res.counts[id] > this.res.counts[a] ? id : a), MOB_IDS[0]) : null;
    for (const c of this.cardsEl.querySelectorAll('.vcard')) {
      const id = c.dataset.mob;
      c.classList.toggle('on', id === this.focus);
      c.setAttribute('aria-current', id === this.focus ? 'true' : 'false');
      c.classList.toggle('mine', id === mine);
      c.classList.toggle('lead', id === lead);
      c.classList.toggle('open', !!open);
      c.querySelector('.vc-bar i').style.setProperty('--w', open ? (sh[id] / 100).toFixed(3) : '0');
      c.querySelector('.vc-pct').textContent = open ? `${sh[id]}%` : '?'; // sealed until your own vote
      const x = mobText(id, getLang());
      c.setAttribute('aria-label', `${x.name}${open ? ` · ${sh[id]}%` : ''}${id === mine ? ` · ${t('vote.voted')}` : ''}`);
    }
  }

  // results are shown once your vote is in (and the box has answered)
  _open() {
    return !!(this.res && this.res.ok && this.client.mine && !this.client.pending);
  }

  _show(instant, dir = 1) {
    const id = this.focus;
    this._stop();
    if (this.plate) {
      const m = this.plate.show(`mob:${id}`);
      this.plateEl.classList.toggle('nogl', !m);
      if (!instant && !this.reduced) {
        const sw = this.plateEl.querySelector('.plate-sweep');
        sw.classList.remove('go');
        void sw.offsetWidth;
        sw.classList.add('go');
      }
    }
    const swap = () => {
      this.infoEl.innerHTML = this._infoHtml();
      this.infoEl.classList.remove('out', 'outl', 'outr');
      this.infoEl.classList.add('in');
      const nm = this.infoEl.querySelector('.ent-name');
      if (nm && !instant && !this.reduced) scramble(nm, nm.textContent, 480);
      setTimeout(() => this.infoEl.classList.remove('in'), 900);
    };
    if (instant || this.reduced) swap();
    else {
      this.infoEl.classList.add('out', dir < 0 ? 'outr' : 'outl');
      clearTimeout(this._swapT);
      this._swapT = setTimeout(swap, 160);
    }
    this._hud();
    this._marks();
  }

  _hud() {
    const n = MOB_IDS.indexOf(this.focus) + 1;
    const x = mobText(this.focus, getLang());
    this.plateEl.querySelector('.plate-fig').textContent = `${t('vote.fig', { n })} — ${x.latin}`;
    this.plateEl.querySelector('.plate-stamp').textContent = t('vote.concept');
    const set = (act, label) => {
      const b = this.plateEl.querySelector(`.ptool[data-act="${act}"]`);
      b.querySelector('span').textContent = label;
      b.title = label;
      b.setAttribute('aria-label', label);
    };
    set('voice', t('vote.listen'));
    set('ping', t('atlas.ping'));
  }

  _infoHtml() {
    const id = this.focus;
    const m = MOBS.find((x) => x.id === id);
    const x = mobText(id, getLang());
    const T = atlasText(getLang());
    const n = MOB_IDS.indexOf(id) + 1;
    let line = 0;
    const L = () => ` style="--l:${line++}"`;
    let h = `<div class="ent-kicker"${L()}><span>V.${n} · ${esc(x.where)}</span><span>${n} ${esc(t('atlas.of'))} ${MOB_IDS.length}</span></div>`;
    h += `<h3 class="ent-name horror"${L()}>${esc(x.name)}</h3><div class="ent-latin"${L()}>${esc(x.latin)}</div>`;
    h += `<p class="vote-pitch"${L()}>${esc(x.pitch)}</p>`;
    h += `<div class="ent-rate beast"${L()}>${m.rate.map((v, k) => `<div class="rr"><span>${esc(T.rate.beast[k])}</span><span class="pips">${[0, 1, 2, 3, 4].map((j) => `<i class="${j < v ? 'on' : ''}"></i>`).join('')}</span></div>`).join('')}</div>`;
    h += `<h4${L()}>${esc(t('vote.mechanics'))}</h4><ol class="vote-mech">${x.mech.map((s) => `<li${L()}>${esc(s)}</li>`).join('')}</ol>`;
    h += `<blockquote class="ent-quote"${L()}>«${esc(x.quote)}»<cite>— ${esc(T.ui.fromNotes)}</cite></blockquote>`;
    h += `<div class="vote-actions"${L()}>${this._actionHtml()}</div>`;
    return h;
  }

  _actionHtml() {
    const id = this.focus;
    const mine = this.client.mine;
    const open = this._open();
    let label = t('vote.vote'), dis = false, cls = 'primary';
    if (this.busy) { label = t('vote.sending'); dis = true; }
    else if (mine === id) { label = t('vote.voted'); dis = true; cls = 'primary is-mine'; }
    else if (mine) label = t('vote.change');
    const sh = open ? shares(this.res.counts)[id] : null;
    return `<button class="btn ${cls} vote-btn" data-act="vote"${dis ? ' disabled' : ''}>${mine === id && !this.busy ? ICON.check : ''}<span>${esc(label)}</span></button>
      <div class="vote-share${open ? ' open' : ''}">${open ? `<b>${sh}%</b><span>${esc(t('vote.share', { p: sh }).replace(/^\S+\s*/, ''))}</span>` : `<span>${esc(t('vote.hidden'))}</span>`}</div>`;
  }

  _actions() {
    const a = this.infoEl.querySelector('.vote-actions');
    if (a) a.innerHTML = this._actionHtml();
  }

  _foot() {
    const open = this._open();
    this.totalEl.textContent = open ? t('vote.total', { n: this.res.total }) : '';
    const msg = { thanks: t('vote.thanks'), pending: t('vote.pending'), limited: t('vote.limited'), error: t('vote.error') }[this.status] || '';
    this.statusEl.textContent = msg;
    this.statusEl.className = `vote-status ${this.status}`;
  }

  async refresh() {
    if (this.client.pending) {
      const r = await this.client.flush();
      if (r && r.ok) {
        this.res = r;
        this.status = '';
      }
    }
    const r = await this.client.tally();
    if (r.ok) this.res = r;
    else if (!this.res) this.res = r;
    if (this.client.pending) this.status = 'pending';
    // the box remembers a vote this device forgot (signed in elsewhere): open on it, unless you already looked around
    if (!this._picked && this.client.mine && this.client.mine !== this.focus) {
      this.focus = this.client.mine;
      this._show(true);
    }
    this._marks();
    this._actions();
    this._foot();
  }

  async cast(id) {
    if (this.busy || !MOB_IDS.includes(id) || this.client.mine === id) return;
    this.busy = true;
    this._actions();
    const r = await this.client.vote(id);
    this.busy = false;
    if (r.ok) {
      this.res = r;
      this.status = 'thanks';
      this.onToast(t('vote.thanks'));
      this.plate?.ping();
      this.plate?.react();
      this._pinged();
    } else {
      this.status = r.why === 'limited' ? 'limited' : this.client.pending ? 'pending' : 'error';
      if (this.status === 'pending') this.onToast(t('vote.pending'));
    }
    this._marks();
    this._actions();
    this._foot();
  }

  // the sketch of its voice (site/mobVoices.js); the engine may still be waking up on the first press
  voice(tries = 0) {
    const A = this.audio();
    if (!A) return;
    this._stop();
    const h = mobVoice(A, this.focus);
    if (!h) {
      if (tries < 6) this._voiceT = setTimeout(() => this.voice(tries + 1), 120);
      return;
    }
    this.handle = h;
    this.plate?.react();
    const b = this.plateEl.querySelector('.ptool.voice');
    b.classList.add('playing');
    clearTimeout(this._playT);
    this._playT = setTimeout(() => b.classList.remove('playing'), h.dur * 1000);
  }

  _stop() {
    clearTimeout(this._voiceT);
    clearTimeout(this._playT);
    if (this.handle) {
      this.handle.stop();
      this.handle = null;
    }
    this.plateEl?.querySelector('.ptool.voice')?.classList.remove('playing');
  }

  _pinged() {
    const p = this.plateEl;
    p.classList.remove('pinged');
    void p.offsetWidth;
    p.classList.add('pinged');
  }

  setVisible(v) {
    this.visible = v;
    if (!v) this._stop();
  }

  refreshLang() {
    this._cards();
    this.infoEl.innerHTML = this._infoHtml();
    this._hud();
    this._foot();
  }

  frame(dt) {
    if (this.visible && this.plate) this.plate.frame(dt);
  }
}
