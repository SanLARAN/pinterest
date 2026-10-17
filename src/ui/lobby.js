// The co-op panel: create a room or join one, see who's in it, start the night.
// In a room it becomes the garage (garage.js, drawn behind): everyone's name tag floats over their place —
// your own opens the wardrobe, a friend's holds your volume for their voice; an empty place invites someone.
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { PLAYER_COLORS } from '../game/remote.js';
import { cleanCode, MAX_PLAYERS } from '../net/net.js';
import { cleanName } from '../net/coop.js';
import { wt, myFit } from '../game/outfit.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
const MIC_ON = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const MIC_OFF = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/></svg>';
const HANGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.2a1.9 1.9 0 1 0-1.9-1.9"/><path d="M12 7.2v1.3L3.2 15a1.3 1.3 0 0 0 .8 2.4h16a1.3 1.3 0 0 0 .8-2.4L12 8.5"/></svg>';
const SPEAKER = (muted) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/>${
    muted ? '<path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>' : '<path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4"/>'
  }</svg>`;

export class Lobby {
  constructor({ coop, mic, audio, mix, onMicToggle, uiSound, onWardrobe = null, beforeOpen = null }) {
    this.coop = coop;
    this.beforeOpen = beforeOpen; // (main builds the garage the first time)
    this.onWardrobe = onWardrobe; // your own tag (or figure) opens the wardrobe
    this.mic = mic;
    this.audio = audio;
    this.mix = mix; // per-friend voice volume
    this.rows = new Map(); // tags, keyed: p:<id> seated · e:<slot> free place · w:<id> connecting
    this.onMicToggle = onMicToggle;
    this.uiSound = uiSound;
    this.el = $('coopPanel');
    this.busy = false;
    this.homeMsg = '';
    this.timer = 0;
    this.copiedUntil = 0;
    this.garage = null; // set by main once it exists
    this.starting = false;
    this.openVol = null; // the friend whose volume popover is open
    this.inviteCopied = 0;
    this.rulesOpen=false;
    this.rulesButton=document.createElement('button');this.rulesButton.id='btnGarageRules';this.rulesButton.type='button';
    this.rulesButton.innerHTML='<span></span>';this.rulesButton.hidden=true;this.el.append(this.rulesButton);
    this.rulesPanel=document.createElement('section');this.rulesPanel.id='lobbyRules';this.rulesPanel.hidden=true;
    this.rulesPanel.setAttribute('role','dialog');this.rulesPanel.setAttribute('aria-modal','true');this.rulesPanel.setAttribute('aria-labelledby','lobbyRulesTitle');
    this.rulesPanel.innerHTML='<div class="lobby-rules-backdrop"></div><div class="lobby-rules-card"><div class="rules-kicker">HUSH / GARAGE</div><h2 id="lobbyRulesTitle"></h2><p class="rule-authority"></p><div class="rules-line"><span></span><div class="rule-choices"><button type="button" data-hide="yes"></button><button type="button" data-hide="no"></button></div></div><p class="rules-explain"></p><button type="button" class="rules-close"></button></div>';
    this.el.append(this.rulesPanel);
    this.rulesPanel.addEventListener('keydown',e=>{
      if(!this.rulesOpen) return;
      if(e.code==='Escape') { e.preventDefault();e.stopPropagation();this.closeRules(); }
      if(e.code==='Tab') {
        e.preventDefault();e.stopPropagation();
        const buttons=[...this.rulesPanel.querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(document.activeElement),dir=e.shiftKey?-1:1;
        buttons[(i+dir+buttons.length)%buttons.length]?.focus();
      }
    });
    this.rulesButton.addEventListener('click',()=>this.openRules());
    this.rulesPanel.querySelector('.rules-close').addEventListener('click',()=>this.closeRules());
    this.rulesPanel.querySelector('.lobby-rules-backdrop').addEventListener('click',()=>this.closeRules());
    for(const button of this.rulesPanel.querySelectorAll('[data-hide]')) button.addEventListener('click',()=>{this.coop.setHideNames(button.dataset.hide==='yes');this.renderRules();});
    this._bind();
  }

  isOpen() {
    return this.el.classList.contains('show');
  }

  open() {
    if (this.beforeOpen) this.beforeOpen();
    $('coopName').value = settings.name || '';
    this.el.classList.add('show');
    document.body.classList.add('in-lobby');
    this.render();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 120);
  }

  close() {
    if (this.starting) return; // the engine's running: we're going
    this.closeRules(false);
    this.el.classList.remove('show');
    document.body.classList.remove('in-lobby');
    clearInterval(this.timer);
    if (this.garage) {
      this.garage.close();
      this.garage.restorePost();
    }
  }

  // the car is starting: nothing to press, nowhere to go
  setStarting(on) {
    this.closeRules(false);
    this.starting = !!on;
    this.el.classList.toggle('starting', this.starting);
    this.openVol = null;
    this.render();
  }

  _bind() {
    const click = (id, fn) => {
      const el = $(id);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.starting) return;
        if (this.uiSound) this.uiSound('click');
        fn(e);
      });
      el.addEventListener('mouseenter', () => this.uiSound && this.uiSound('hover'));
    };
    click('btnCreate', () => this._go(() => this.coop.create()));
    $('coopList').addEventListener('click', (e) => {
      if (this.starting) return;
      const row = e.target.closest('.row');
      if (!row) return;
      if (e.target.closest('[data-wardrobe]')) {
        e.preventDefault();
        if (this.uiSound) this.uiSound('click');
        if (this.onWardrobe) this.onWardrobe();
        return;
      }
      if (e.target.closest('.vbtn') || (row.classList.contains('mate') && !e.target.closest('.vol'))) {
        e.preventDefault();
        if (this.uiSound) this.uiSound('click');
        this._toggleVol(row.dataset.id);
        return;
      }
      if (row.classList.contains('empty')) {
        e.preventDefault();
        if (this.uiSound) this.uiSound('click');
        this._copy(() => { this.inviteCopied = performance.now() + 1600; });
      }
    });
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
      if (this.coop.isHost && this.coop.active) this.coop.startRun({ cut: true });
    });
    click('btnLeave', () => {
      this.coop.leave().then(() => this.render());
    });
    click('btnCoopBack', () => this.close());
    click('btnRoomBack', () => this.close());
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
    // the garage itself: your figure under the pointer lights up — click it to dress up; a friend's opens their volume
    const bare = (e) => e.target === this.el || e.target.id === 'coopRoom' || e.target.id === 'coopList' || e.target.classList.contains('form-panel');
    this.el.addEventListener('pointermove', (e) => {
      if (!this.garage || !this._inRoom() || e.pointerType === 'touch') return;
      const s = this.garage.pointer(e.clientX, e.clientY, true);
      const me = this.coop.me();
      this.el.classList.toggle('over-me', !!me && s === me.slot && bare(e) && !this.starting);
      this.el.classList.toggle('over-mate', s >= 0 && (!me || s !== me.slot) && bare(e) && !this.starting);
    });
    this.el.addEventListener('pointerleave', () => {
      if (this.garage) this.garage.pointer(0, 0, false);
      this.el.classList.remove('over-me', 'over-mate');
    });
    this.el.addEventListener('click', (e) => {
      if (!this.garage || !this._inRoom() || this.starting || !bare(e)) return;
      if(this.garage.hitRules(e.clientX,e.clientY)) { this.openRules(); return; }
      const s = this.garage.hit(e.clientX, e.clientY);
      const me = this.coop.me();
      if (s < 0) {
        if (this.openVol) this._toggleVol(null);
        return;
      }
      if (this.uiSound) this.uiSound('click');
      if (me && s === me.slot) {
        if (this.onWardrobe) this.onWardrobe();
      } else {
        const p = this.coop.players().find((q) => q.slot === s);
        if (p) this._toggleVol(p.id);
      }
    });
  }

  openRules() {
    if(!this._inRoom() || this.starting) return;
    this.rulesOpen=true;this.rulesPanel.hidden=false;this.renderRules();this.openVol=null;
    this.rulesPanel.querySelector('.rules-close').focus();if(this.uiSound) this.uiSound('click');
  }
  closeRules(focus=true) {
    const had=this.rulesOpen;this.rulesOpen=false;this.rulesPanel.hidden=true;
    if(had && focus && this.isOpen()) this.rulesButton.focus({preventScroll:true});
  }
  renderRules() {
    const c=this.coop,r=c.rules||{hideNames:false},host=c.isHost&&c.phase==='lobby'&&!this.starting;
    this.rulesButton.hidden=!this._inRoom()||this.starting;
    this.rulesButton.setAttribute('aria-label',t('lobbySettings'));this.rulesButton.title=t('lobbySettings');
    this.rulesButton.firstChild.textContent=t('lobbySettings');
    this.garage?.setRules(r);
    this.rulesPanel.querySelector('h2').textContent=t('lobbyRulesTitle');
    this.rulesPanel.querySelector('.rule-authority').textContent=t(host?'ruleHost':'ruleGuest');
    this.rulesPanel.querySelector('.rules-line > span').textContent=t('ruleHideNames');
    this.rulesPanel.querySelector('.rules-explain').textContent=t('ruleExplain');
    this.rulesPanel.querySelector('.rules-close').textContent=`${t('bagClose')} [ ESC ]`;
    for(const b of this.rulesPanel.querySelectorAll('[data-hide]')) { const yes=b.dataset.hide==='yes';b.textContent=t(yes?'ruleYes':'ruleNo');b.disabled=!host;b.setAttribute('aria-pressed',String(r.hideNames===yes)); }
  }
  placeRules() {
    if(!this._inRoom() || !this.garage || this.starting) return;
    const r=this.garage.rulesRect();const visible=r && r.x>4 && r.y>30 && r.x+r.w<innerWidth-4 && r.y+r.h<innerHeight-40 && r.w>60;
    this.rulesButton.classList.toggle('poster-fallback',!visible);
    const b=this.rulesButton.style;
    if(visible) { b.left=`${r.x}px`;b.top=`${r.y}px`;b.width=`${Math.max(48,r.w)}px`;b.height=`${Math.max(48,r.h)}px`; }
    else { b.left='18px';b.top=`${Math.max(80,innerHeight-(this.garage.safe.bottom||160)-55)}px`;b.width='145px';b.height='36px'; }
  }

  _inRoom() {
    return this.coop.active && !!this.coop.code;
  }

  _toggleVol(id) {
    this.openVol = id && this.openVol !== id ? id : null;
    for (const [k, el] of this.rows) el.classList.toggle('open', !!this.openVol && k === `p:${this.openVol}`);
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

  _copy(after = null) {
    const link = this.coop.inviteLink();
    const done = () => {
      this.copiedUntil = performance.now() + 1600;
      if (after) after();
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
    this.renderRules();
    const inRoom = this._inRoom();
    this.el.classList.toggle('room', inRoom);
    this.el.classList.toggle('home', !inRoom);
    $('btnCreate').disabled = this.busy;
    $('btnJoin').disabled = this.busy;
    if (this.garage && this.isOpen()) {
      this.garage.open(inRoom ? 'room' : 'home');
      this.garage.setPlayers(inRoom ? c.players().map((p) => ({ slot: p.slot, id: p.id, name: p.name, self: p.self, host: p.host, fit: p.self ? myFit() : p.fit })) : []);
    }
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
    start.disabled = !c.isHost || c.status === 'joining' || this.starting;
    this._measure();
  }

  // tell the garage how much of the screen the top bar and the dock take
  _measure() {
    if (!this.garage || !this.isOpen() || !this._inRoom()) return;
    const top = this.el.querySelector('.coop-top');
    const dock = this.el.querySelector('.coop-dock');
    if (!top || !dock) return;
    const a = top.getBoundingClientRect(), b = dock.getBoundingClientRect();
    if (a.height < 1 || b.height < 1) return;
    this.garage.setSafe(Math.round(a.bottom + 34), Math.round(innerHeight - b.top + 6));
  }

  // tags are kept and updated in place (a slider being dragged must survive the ping refreshes)
  _renderList() {
    const c = this.coop;
    const seated = c.players();
    const want = [];
    for (let s = 0; s < MAX_PLAYERS; s++) {
      const p = seated.find((q) => q.slot === s);
      want.push(p ? { key: `p:${p.id}`, p, s } : { key: `e:${s}`, s });
    }
    // in the room but not seated yet (connecting to the host)
    for (const p of c.everyone()) if (p.slot < 0) want.push({ key: `w:${p.id}`, p, wait: true });
    const list = $('coopList');
    const keys = new Set(want.map((w) => w.key));
    for (const [k, el] of this.rows) {
      if (!keys.has(k)) {
        el.remove();
        this.rows.delete(k);
      }
    }
    if (this.openVol && !keys.has(`p:${this.openVol}`)) this.openVol = null;
    let prev = null;
    for (const w of want) {
      let el = this.rows.get(w.key);
      if (!el) {
        el = document.createElement('div');
        el.innerHTML = '<span class="pill"><i class="dot"></i><span class="n"></span><span class="mic"></span><span class="p"></span><span class="act"></span></span>';
        if (w.p && !w.wait) el.dataset.id = w.p.id;
        el.dataset.slot = w.s ?? -1;
        this.rows.set(w.key, el);
      }
      this._fillRow(el, w);
      const at = prev ? prev.nextSibling : list.firstChild;
      if (at !== el) list.insertBefore(el, at);
      prev = el;
    }
  }

  _fillRow(el, w) {
    const pill = el.firstChild;
    const [dot, n, mic, ping, act] = pill.children;
    const set = (node, html) => {
      if (node._html !== html) {
        node._html = html;
        node.innerHTML = html;
      }
    };
    const p = w.p;
    if (!p) {
      el.className = 'row empty';
      const copied = performance.now() < this.inviteCopied;
      set(n, `<b>+</b>${esc(copied ? t('coopCopied') : t('coopInvite'))}<small>${esc(t('coopSeats')[w.s] || t('coopFree'))}</small>`);
      return;
    }
    if (w.wait) {
      el.className = 'row wait';
      set(n, `${esc(p.name || '…')}${p.self ? `<em>${esc(t('coopYou'))}</em>` : ''}`);
      set(ping, '…');
      return;
    }
    el.className = `row${p.self ? ' self' : ' mate'}${p.mic ? '' : ' nomic'}${this.openVol === p.id ? ' open' : ''}`;
    dot.style.setProperty('--c', PLAYER_COLORS[w.s]);
    el.style.setProperty('--c', PLAYER_COLORS[w.s]);
    const tags = [];
    if (p.self) tags.push(t('coopYou'));
    if (p.host) tags.push(t('coopHost'));
    set(n, `${esc(p.name)}${tags.map((x) => `<em>${esc(x)}</em>`).join('')}`);
    mic.className = `mic ${p.mic ? 'on' : 'off'}`;
    set(mic, p.mic ? MIC_ON : MIC_OFF);
    const rtt = p.self ? null : this.coop.rtt(p.id);
    set(ping, rtt != null ? `${rtt} ${esc(t('ms'))}` : '');
    if (p.self) {
      set(act, this.onWardrobe ? `<button class="fit" data-wardrobe title="${esc(wt().title)}" aria-label="${esc(t('coopDress'))}">${HANGER}</button>` : '');
      return;
    }
    // a friend: how loud you hear them (the popover opens from the speaker, or by clicking them)
    if (this.mix) {
      this.mix.bind(p.id, p.name);
      const muted = this.mix.get(p.id) <= 0.001;
      set(act, `<button class="vbtn${muted ? ' muted' : ''}" title="${esc(t('coopVolume'))}" aria-label="${esc(t('coopVolume'))}">${SPEAKER(muted)}</button>`);
      if (!el._vol) {
        el._vol = this.mix.control(p.id);
        el._vol.classList.add('pop');
        el.appendChild(el._vol);
      }
      el._vol.style.setProperty('--c', PLAYER_COLORS[w.s]);
      this.mix.sync(el._vol);
    }
  }

  _renderStatus() {
    const c = this.coop;
    const r = c.relayStatus();
    const since = (performance.now() - c.joinedAt) / 1000;
    let main = '';
    if (this.starting) main = `<span class="go">${esc(t('coopGo'))}</span>`;
    else if (c.status === 'version') main = `<span class="bad">${esc(t('coopVersion'))}</span>`;
    else if (c.status === 'joining') main = esc(t('coopJoining'));
    else if (c.isHost) main = esc(c.players().length > 1 ? (this.garage ? t('coopReadyHostCar') : t('coopReadyHost')) : t('coopWaitFriends'));
    else if (c.status === 'hostLost') main = `<span class="warn">${esc(t('coopHostLeft'))}</span>`;
    else if (!c.hostId) main = since > 14 ? `<span class="warn">${esc(t('coopNoHost'))}</span>` : esc(t('coopSearching'));
    else if (c.phase === 'game' && !(c.me() && c.me().inRun)) main = esc(t('coopInRun'));
    else main = esc(t('coopWaitHost'));
    let sub = '';
    if (r.total > 0 && !this.starting) {
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

  // every frame while the garage is drawn: hang each tag over its place (CSS px from garage.anchors())
  place(anchors) {
    this.placeRules();
    if (!this._inRoom() || !anchors || !anchors.length) return;
    const W = innerWidth, H = innerHeight;
    const top = this.garage ? this.garage.safe.top - 26 : 60;
    const bottom = H - (this.garage ? this.garage.safe.bottom : 180);
    const boxes = [];
    for (const [k, el] of this.rows) {
      const slot = +el.dataset.slot;
      if (k.startsWith('w:')) continue;
      const a = anchors[slot];
      if (!a || !a.on) {
        el.style.visibility = 'hidden';
        continue;
      }
      el.style.visibility = '';
      if (!el._w || el._sizeAt !== el.className + (el.firstChild.firstChild ? el.textContent.length : 0)) {
        el._w = el.firstChild.offsetWidth || 120;
        el._h = el.firstChild.offsetHeight || 26;
        el._sizeAt = el.className + el.textContent.length;
      }
      boxes.push({ el, x: a.x, y: a.y, w: el._w, h: el._h, appear: a.here ? a.appear : 1 });
    }
    // keep them on screen, and off each other (the higher one gives way upward)
    for (const b of boxes) {
      b.x = Math.min(W - b.w / 2 - 8, Math.max(b.w / 2 + 8, b.x));
      b.y = Math.min(bottom, Math.max(top + b.h, b.y));
    }
    boxes.sort((a, b) => b.y - a.y);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = 0; j < i; j++) {
        const A = boxes[i], B = boxes[j];
        if (Math.abs(A.x - B.x) < (A.w + B.w) / 2 + 4 && A.y > B.y - B.h - 4) A.y = B.y - B.h - 4;
      }
    }
    // the connecting ones stack under the top bar, on the right
    let wy = top + 4;
    for (const [k, el] of this.rows) {
      if (!k.startsWith('w:')) continue;
      el.style.visibility = '';
      const x = W - 14, y = wy;
      wy += 32;
      const tr = `translate(${x}px, ${y}px) translate(-100%, 0)`;
      if (el._tr !== tr) { el._tr = tr; el.style.transform = tr; }
    }
    for (const b of boxes) {
      const x = Math.round(b.x), y = Math.round(b.y);
      const tr = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      if (b.el._tr !== tr) {
        b.el._tr = tr;
        b.el.style.transform = tr;
      }
      const op = (Math.min(1, b.appear * 1.5)).toFixed(2);
      if (b.el._op !== op) {
        b.el._op = op;
        b.el.style.opacity = op;
      }
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
      const lv = this.level(id);
      const dot = row.querySelector('.dot');
      if (dot) dot.style.setProperty('--lv', lv.toFixed(2));
      row.classList.toggle('talk', lv > 0.12);
    }
    if (this.copiedUntil && performance.now() > this.copiedUntil) {
      this.copiedUntil = 0;
      $('btnCopyText').textContent = t('coopCopy');
    }
    this._measure();
  }

  // how loud someone in the room is right now (you: your mic)
  level(id) {
    const c = this.coop;
    if (id === c.selfId) return this.mic.state === 'on' ? Math.min(1, this.mic.meter) : 0;
    return this.audio.voiceLevel(id);
  }
}
