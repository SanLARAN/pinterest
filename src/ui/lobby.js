// The co-op panel: create a room or join one, see who's in it, start the night.
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { PLAYER_COLORS } from '../game/remote.js';
import { cleanCode, MAX_PLAYERS } from '../net/net.js';
import { cleanName } from '../net/coop.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MIC_ON = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const MIC_OFF = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/></svg>';

export class Lobby {
  constructor({ coop, mic, audio, onMicToggle, uiSound }) {
    this.coop = coop;
    this.mic = mic;
    this.audio = audio;
    this.onMicToggle = onMicToggle;
    this.uiSound = uiSound;
    this.el = $('coopPanel');
    this.busy = false;
    this.homeMsg = '';
    this.timer = 0;
    this.copiedUntil = 0;
    this._bind();
  }

  isOpen() {
    return this.el.classList.contains('show');
  }

  open() {
    $('coopName').value = settings.name || '';
    this.el.classList.add('show');
    this.render();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 120);
  }

  close() {
    this.el.classList.remove('show');
    clearInterval(this.timer);
  }

  _bind() {
    const click = (id, fn) => {
      const el = $(id);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.uiSound) this.uiSound('click');
        fn(e);
      });
      el.addEventListener('mouseenter', () => this.uiSound && this.uiSound('hover'));
    };
    click('btnCreate', () => this._go(() => this.coop.create()));
    $('coopJoinForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.uiSound) this.uiSound('click');
      const code = cleanCode($('coopCode').value);
      if (code.length < 4) {
        this.homeMsg = `<span class="warn">${esc(t('coopBadCode'))}</span>`;
        this.render();
        return;
      }
      $('coopCode').value = code;
      this._go(() => this.coop.join(code));
    });
    click('btnCopy', () => this._copy());
    click('btnStart', () => {
      if (this.coop.isHost && this.coop.active) this.coop.startRun();
    });
    click('btnLeave', () => {
      this.coop.leave().then(() => this.render());
    });
    click('btnCoopBack', () => this.close());
    click('btnCoopMic', () => this.onMicToggle && this.onMicToggle());
    const name = $('coopName');
    let nameT = 0;
    name.addEventListener('input', () => {
      settings.name = cleanName(name.value) === '???' ? '' : name.value.trim().slice(0, 14);
      saveSettings();
      const other = $('nameInput');
      if (other) other.value = settings.name;
      clearTimeout(nameT);
      nameT = setTimeout(() => this.coop.active && this.coop.announce(), 400);
    });
    for (const id of ['coopName', 'coopCode']) $(id).addEventListener('keydown', (e) => e.stopPropagation());
  }

  async _go(fn) {
    if (this.busy) return;
    this.busy = true;
    this.homeMsg = '';
    this.render();
    try {
      await fn();
    } catch (e) {
      this.homeMsg = `<span class="bad">${esc(t('coopError'))}</span>`;
      console.warn('[lobby]', e);
    }
    this.busy = false;
    this.render();
  }

  _copy() {
    const link = this.coop.inviteLink();
    const done = () => {
      this.copiedUntil = performance.now() + 1600;
      this.render();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done, () => this._copyFallback(link, done));
    } else this._copyFallback(link, done);
  }

  _copyFallback(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch { /* the code is on screen anyway */ }
    ta.remove();
  }

  // menu button: shows the room you're in
  menuLabel() {
    const btn = $('btnCoop');
    const inRoom = this.coop.active && !!this.coop.code;
    btn.classList.toggle('in-room', inRoom);
    $('btnCoopText').textContent = inRoom ? t('coopBtnRoom').replace('{code}', this.coop.code) : t('coopBtn');
  }

  render() {
    const c = this.coop;
    this.menuLabel();
    const inRoom = c.active && !!c.code;
    this.el.classList.toggle('room', inRoom);
    this.el.classList.toggle('home', !inRoom);
    $('btnCreate').disabled = this.busy;
    $('btnJoin').disabled = this.busy;
    if (!inRoom) {
      let msg = this.homeMsg;
      if (!msg && this.busy) msg = esc(t('coopJoining'));
      if (!msg && c.status === 'full') msg = `<span class="warn">${esc(t('coopFull'))}</span>`;
      if (!msg && c.status === 'error') msg = `<span class="bad">${esc(t('coopError'))}</span>`;
      $('coopHomeMsg').innerHTML = msg;
      return;
    }
    $('coopCodeOut').textContent = c.code;
    $('btnCopyText').textContent = performance.now() < this.copiedUntil ? t('coopCopied') : t('coopCopy');
    this._renderList();
    this._renderStatus();
    const micOn = this.mic.state === 'on';
    const mr = $('coopMicRow');
    mr.classList.toggle('on', micOn);
    $('coopMicText').textContent = micOn ? t('coopMicOn') : t('coopMicOff');
    $('btnCoopMic').textContent = t('coopMicAsk');
    const start = $('btnStart');
    start.classList.toggle('hidden-host', !c.isHost);
    start.disabled = !c.isHost || c.status === 'joining';
  }

  _renderList() {
    const c = this.coop;
    const seated = c.players();
    const rows = [];
    for (let s = 0; s < MAX_PLAYERS; s++) {
      const p = seated.find((q) => q.slot === s);
      if (!p) {
        rows.push(`<div class="row empty"><i class="dot"></i><span class="n">${esc(t('coopFree'))}</span><span></span><span class="p"></span></div>`);
        continue;
      }
      const tags = [];
      if (p.self) tags.push(t('coopYou'));
      if (p.host) tags.push(t('coopHost'));
      const rtt = p.self ? null : c.rtt(p.id);
      rows.push(
        `<div class="row" data-id="${esc(p.id)}"><i class="dot" style="--c:${PLAYER_COLORS[s]}"></i>` +
          `<span class="n">${esc(p.name)}${tags.map((x) => `<em>${esc(x)}</em>`).join('')}</span>` +
          `<span class="mic ${p.mic ? 'on' : 'off'}">${p.mic ? MIC_ON : MIC_OFF}</span>` +
          `<span class="p">${rtt != null ? `${rtt} ${esc(t('ms'))}` : ''}</span></div>`,
      );
    }
    // in the room but not seated yet (connecting to the host)
    for (const p of c.everyone()) {
      if (p.slot >= 0) continue;
      rows.push(`<div class="row wait"><i class="dot"></i><span class="n">${esc(p.name || '…')}${p.self ? `<em>${esc(t('coopYou'))}</em>` : ''}</span><span></span><span class="p">…</span></div>`);
    }
    const html = rows.join('');
    const list = $('coopList');
    if (list._html !== html) {
      list._html = html;
      list.innerHTML = html;
    }
  }

  _renderStatus() {
    const c = this.coop;
    const r = c.relayStatus();
    const since = (performance.now() - c.joinedAt) / 1000;
    let main = '';
    if (c.status === 'version') main = `<span class="bad">${esc(t('coopVersion'))}</span>`;
    else if (c.status === 'joining') main = esc(t('coopJoining'));
    else if (c.isHost) main = esc(c.players().length > 1 ? t('coopReadyHost') : t('coopWaitFriends'));
    else if (c.status === 'hostLost') main = `<span class="warn">${esc(t('coopHostLeft'))}</span>`;
    else if (!c.hostId) main = since > 14 ? `<span class="warn">${esc(t('coopNoHost'))}</span>` : esc(t('coopSearching'));
    else if (c.phase === 'game' && !(c.me() && c.me().inRun)) main = esc(t('coopInRun'));
    else main = esc(t('coopWaitHost'));
    let sub = '';
    if (r.total > 0) {
      if (r.open === 0 && since > 6) sub = `<span class="dim warn">${esc(t('coopNoRelays'))}</span>`;
      else sub = `<span class="dim">${esc(t('coopRelays'))} ${r.open}/${r.total}</span>`;
    }
    const html = main + sub;
    const el = $('coopStatus');
    if (el._html !== html) {
      el._html = html;
      el.innerHTML = html;
    }
  }

  // live bits: who is talking, pings, relay count
  tick() {
    if (!this.isOpen()) return;
    const c = this.coop;
    if (!c.active) return this.render();
    this._renderStatus();
    this._renderList();
    for (const row of $('coopList').querySelectorAll('.row[data-id]')) {
      const id = row.dataset.id;
      const lv = id === c.selfId ? (this.mic.state === 'on' ? Math.min(1, this.mic.meter) : 0) : this.audio.voiceLevel(id);
      const dot = row.querySelector('.dot');
      if (dot) dot.style.setProperty('--lv', lv.toFixed(2));
    }
    if (this.copiedUntil && performance.now() > this.copiedUntil) {
      this.copiedUntil = 0;
      $('btnCopyText').textContent = t('coopCopy');
    }
  }
}
