// Co-op session: the room, who is in it, and getting everyone into the same night.
//
// The room's creator is the host. The host assigns seats (colours), starts runs and — during a run —
// is the one machine that decides what the monsters do. Everybody else joins with the room code.
// Lobby traffic is handled here; in-game traffic is queued for the game to drain once per frame.
import { Net, PROTOCOL, MAX_PLAYERS, makeCode, cleanCode } from './net.js';
import { settings, saveSettings } from '../core/storage.js';
import { t } from '../core/i18n.js';
import { myFit, cleanFit } from '../game/outfit.js';

const LOBBY_TYPES = new Set(['hi', 'roster', 'full', 'start', 'bye', 'nm', 'lobby']);

export function cleanName(s) {
  return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14) || '???';
}

export function myName() {
  if (!settings.name) {
    settings.name = `${t('defaultName')}-${10 + Math.floor(Math.random() * 90)}`;
    saveSettings();
  }
  return cleanName(settings.name);
}

export class Coop {
  constructor({ audio, mic }) {
    this.audio = audio;
    this.mic = mic;
    this.net = new Net();
    this.active = false; // in a room
    this.isHost = false;
    this.code = null;
    this.hostId = null;
    this.roster = new Map(); // id -> { id, name, slot, host, mic, inRun, self, fit }
    this.phase = 'lobby'; // lobby | game  (as the host sees it)
    this.status = 'idle'; // idle | joining | waiting | searching | ready | full | version | hostLost | error
    this.joinedAt = 0;
    this.inRun = false; // this machine is in the current run
    this.queue = []; // in-game messages for the game
    this.handlers = {}; // ui: change | start | hostLost | left
    this.net.onPeerJoin = (pid) => this._onPeerJoin(pid);
    this.net.onPeerLeave = (pid) => this._onPeerLeave(pid);
    this.net.onMessage = (type, d, pid) => this._onMessage(type, d, pid);
    this.net.onPeerStream = (pid, stream) => this._onStream(pid, stream);
    this.net.onError = (e) => console.warn('[coop]', e);
    this.lastStreamOf = new Map();
  }

  get selfId() {
    return this.net.selfId;
  }

  on(name, fn) {
    this.handlers[name] = fn;
  }
  emit(name, ...a) {
    const f = this.handlers[name];
    if (f) f(...a);
  }

  me() {
    return this.roster.get(this.selfId) || null;
  }
  players() {
    return [...this.roster.values()].filter((p) => p.slot >= 0).sort((a, b) => a.slot - b.slot);
  }
  everyone() {
    return [...this.roster.values()];
  }

  // ---------------- room ----------------
  async create() {
    const code = makeCode();
    await this._enter(code, true);
    return code;
  }

  async join(raw) {
    const code = cleanCode(raw);
    if (code.length < 4) throw new Error('bad code');
    await this._enter(code, false);
    return code;
  }

  async _enter(code, host) {
    await this.leave();
    this.code = code;
    this.isHost = host;
    this.active = true;
    this.phase = 'lobby';
    this.status = 'joining';
    this.hostId = host ? null : null;
    this.roster.clear();
    this.queue = [];
    this.inRun = false;
    this.joinedAt = performance.now();
    this.emit('change');
    const params = new URLSearchParams(location.search);
    const relays = params.get('relays') ? params.get('relays').split(',').filter(Boolean) : null;
    const only = ['nostr', 'torrent'].includes(params.get('net')) ? params.get('net') : null;
    try {
      await this.net.join(code, { relays, test: !!relays, only });
    } catch (e) {
      console.warn('[coop] join failed', e);
      this.active = false;
      this.status = 'error';
      this.emit('change');
      throw e;
    }
    if (this.code !== code) return;
    this.roster.set(this.selfId, { id: this.selfId, name: myName(), slot: host ? 0 : -1, host, mic: this.mic.state === 'on', inRun: false, self: true, fit: myFit() });
    if (host) this.hostId = this.selfId;
    this.status = host ? 'waiting' : 'searching';
    this.syncVoice();
    this.emit('change');
  }

  async leave() {
    if (!this.active && !this.net.connected) return;
    try {
      this.net.send('bye', null);
    } catch { /* */ }
    this.active = false;
    this.inRun = false;
    this.status = 'idle';
    this.code = null;
    this.hostId = null;
    this.roster.clear();
    this.queue = [];
    this.lastStreamOf.clear();
    this.audio.voiceDetachAll();
    await this.net.leave();
    this.emit('change');
  }

  inviteLink() {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    u.searchParams.set('room', this.code);
    const q = new URLSearchParams(location.search);
    for (const k of ['relays', 'net']) if (q.get(k)) u.searchParams.set(k, q.get(k)); // test / diagnostic setups keep their signalling
    return u.toString();
  }

  // relays connected / total, for the status line
  relayStatus() {
    return this.net.relayStatus();
  }

  rtt(pid) {
    return this.net.rtt(pid);
  }

  // ---------------- handshake ----------------
  _hello() {
    return { v: PROTOCOL, name: myName(), host: this.isHost, mic: this.mic.state === 'on', fit: myFit() };
  }

  _onPeerJoin(pid) {
    this.net.send('hi', this._hello(), pid);
  }

  _onMessage(type, d, pid) {
    if (!LOBBY_TYPES.has(type)) {
      if (this.inRun) this.queue.push([type, d, pid]);
      return;
    }
    switch (type) {
      case 'hi':
        this._onHello(pid, d);
        break;
      case 'roster':
        if (!this.isHost && d && d.host === pid) this._onRoster(d);
        break;
      case 'full':
        if (!this.isHost && pid === this.hostId) {
          this.status = 'full';
          this.emit('change');
          this.leave().then(() => {
            this.status = 'full';
            this.emit('change');
          });
        }
        break;
      case 'start':
        if (!this.isHost && pid === this.hostId && d) this._onStart(d);
        break;
      case 'bye':
        this._onPeerLeave(pid);
        break;
      case 'nm': {
        const r = this.roster.get(pid);
        if (r && d) {
          r.name = cleanName(d.name);
          r.mic = !!d.mic;
          if (d.fit) r.fit = cleanFit(d.fit);
          if (this.isHost) this._broadcastRoster();
          this.emit('change');
        }
        break;
      }
    }
  }

  _onHello(pid, d) {
    if (!d || d.v !== PROTOCOL) {
      this.status = 'version';
      this.emit('change');
      return;
    }
    let r = this.roster.get(pid);
    if (!r) {
      r = { id: pid, slot: -1, inRun: false, self: false };
      this.roster.set(pid, r);
    }
    r.name = cleanName(d.name);
    r.host = !!d.host;
    r.mic = !!d.mic;
    r.fit = cleanFit(d.fit); // what they wear (an older client sends nothing: the standard kit)
    if (d.host && !this.isHost) {
      this.hostId = pid;
      if (this.status === 'searching') this.status = 'ready';
    }
    if (this.isHost) {
      if (r.slot < 0) {
        const used = new Set(this.players().map((p) => p.slot));
        let s = 0;
        while (used.has(s)) s++;
        if (s >= MAX_PLAYERS) {
          this.net.send('full', null, pid);
          this.roster.delete(pid);
          return;
        }
        r.slot = s;
      }
      this._broadcastRoster();
    }
    this.emit('change');
  }

  _broadcastRoster() {
    if (!this.isHost) return;
    const list = this.players().map((p) => ({ id: p.id, name: p.name, slot: p.slot, host: !!p.host, mic: !!p.mic, inRun: !!p.inRun, fit: p.fit }));
    this.net.send('roster', { host: this.selfId, phase: this.phase, list });
  }

  _onRoster(d) {
    this.hostId = d.host;
    this.phase = d.phase === 'game' ? 'game' : 'lobby';
    const keep = new Set([this.selfId]);
    for (const e of d.list || []) {
      keep.add(e.id);
      let r = this.roster.get(e.id);
      if (!r) {
        r = { id: e.id, self: e.id === this.selfId };
        this.roster.set(e.id, r);
      }
      r.slot = e.slot | 0;
      if (!r.self) r.name = cleanName(e.name);
      r.host = !!e.host;
      if (!r.self) r.mic = !!e.mic;
      if (!r.self && e.fit) r.fit = cleanFit(e.fit);
      r.inRun = !!e.inRun;
    }
    // people the host doesn't seat (yet) still show up, unseated
    if (this.status === 'searching' || this.status === 'ready') this.status = 'ready';
    void keep;
    this.emit('change');
  }

  _onPeerLeave(pid) {
    const r = this.roster.get(pid);
    if (!r && pid !== this.hostId) return;
    this.roster.delete(pid);
    this.lastStreamOf.delete(pid);
    this.audio.voiceDetach(pid);
    if (this.inRun) this.queue.push(['_left', null, pid]);
    if (!this.isHost && pid === this.hostId) {
      this.hostId = null;
      this.status = 'hostLost';
      this.emit('hostLost');
    }
    if (this.isHost) this._broadcastRoster();
    this.emit('left', r ? r.name : '???');
    this.emit('change');
  }

  // name, mic or clothes changed: tell everyone
  announce() {
    const me = this.me();
    if (!me) return;
    me.name = myName();
    me.mic = this.mic.state === 'on';
    me.fit = myFit();
    this.net.send('nm', { name: me.name, mic: me.mic, fit: me.fit });
    if (this.isHost) this._broadcastRoster();
    this.emit('change');
  }

  // ---------------- runs ----------------
  // host: everyone seated right now goes into a new night
  startRun() {
    if (!this.isHost) return null;
    const list = this.players();
    for (const p of list) p.inRun = true;
    this.phase = 'game';
    const msg = { seed: (Math.random() * 2 ** 31) >>> 0, players: list.map((p) => ({ id: p.id, name: p.name, slot: p.slot, fit: p.self ? myFit() : p.fit })) };
    this.net.send('start', msg);
    this._broadcastRoster();
    this._onStart(msg);
    return msg;
  }

  _onStart(d) {
    if (!Array.isArray(d.players) || !d.players.some((p) => p.id === this.selfId)) return; // not seated this time
    this.phase = 'game';
    for (const p of d.players) {
      const r = this.roster.get(p.id);
      if (r) {
        r.inRun = true;
        r.slot = p.slot;
        // everyone's clothes: the host's word, or what they told us themselves (an older host sends none)
        p.fit = cleanFit(p.fit || r.fit);
      } else p.fit = cleanFit(p.fit);
    }
    this.queue = [];
    this.inRun = true;
    this.emit('start', d);
  }

  // host: the night is over, back to the lobby state
  endRun() {
    this.inRun = false;
    this.queue = [];
    if (!this.isHost) return;
    this.phase = 'lobby';
    for (const p of this.roster.values()) p.inRun = false;
    this._broadcastRoster();
  }

  leaveRun() {
    this.inRun = false;
    this.queue = [];
  }

  // ---------------- in-game traffic ----------------
  send(type, data, target) {
    this.net.send(type, data, target);
  }
  toHost(type, data) {
    if (this.hostId && this.hostId !== this.selfId) this.net.send(type, data, this.hostId);
  }
  drain() {
    const q = this.queue;
    this.queue = [];
    return q;
  }

  // ---------------- voice ----------------
  syncVoice() {
    if (!this.active) return;
    this.net.setStream(this.mic.state === 'on' && this.mic.stream ? this.mic.stream : null);
  }

  _onStream(pid, stream) {
    if (this.lastStreamOf.get(pid) === stream) return;
    this.lastStreamOf.set(pid, stream);
    this.audio.voiceAttach(pid, stream);
    this.emit('change');
  }
}
