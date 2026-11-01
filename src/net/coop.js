// Co-op session: the room, who is in it, and getting everyone into the same night.
//
// The room's creator is the host. The host assigns seats (colours), starts runs and — during a run —
// is the one machine that decides what the monsters do. Everybody else joins with the room code.
// Lobby traffic is handled here; in-game traffic is queued for the game to drain once per frame.
import { Net, PROTOCOL, MAX_PLAYERS, makeCode, cleanCode } from './net.js';
import { settings, saveSettings } from '../core/storage.js';
import { t } from '../core/i18n.js';
import { myFit, cleanFit } from '../game/outfit.js';
import { cleanLobbyRules } from './lobbyRules.js';
import { cleanMap } from '../core/maps.js';
import {currentIdentity} from '../core/identity.js';
import { forestCleared, mapAskList, roomMapOpen } from '../core/mapUnlock.js';

// (3.0s) mq: the host asks a player who has not cleared the forest whether the room may go to the bog; ma: the answer
// (3.0y) rd: a player says they are ready (or not) for the next night
const LOBBY_TYPES = new Set(['hi', 'roster', 'full', 'start', 'bye', 'nm', 'lobby', 'mq', 'ma', 'rd']);

// (3.0x) a player's cloud account id, if they have one — so a name in the lobby can open their profile
export const cleanUid = (v) => (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

export function cleanName(s) {
  return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14) || '???';
}

export function myName() {
  const identity=currentIdentity();if(identity?.locked)return cleanName(identity.name);
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
    this.mapId = 'forest'; // which участок this machine has loaded (main.js sets it at boot)
    this.rules = cleanLobbyRules({ hideNames: settings.lobbyHideNames, days: settings.shiftDays, map: this.mapId });
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
    this.ask = null; // (3.0s) host: { id, map, wait: Set } — who still has to agree to the bog; guest: the host's { map, wait }
    this.question = null; // (3.0s) guest: the host's open question to this machine { id, map }
    this.refused = null; // (3.0s) the last «no»: { name, at }
    this.uid = null; // (3.0x) this machine's cloud account id (main sets it), announced so friends can open the profile
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

  async join(raw, options = {}) {
    const code = cleanCode(raw);
    if (code.length < 4) throw new Error('bad code');
    await this._enter(code, false, options);
    return code;
  }

  async _enter(code, host, options = {}) {
    await this.leave();
    this.code = code;
    this.isHost = host;
    this.rules = cleanLobbyRules(host ? { hideNames: settings.lobbyHideNames, days: settings.shiftDays, map: this.mapId } : null);
    this.active = true;
    this.phase = 'lobby';
    this.status = 'joining';
    this.hostId = host ? null : null;
    this.roster.clear();
    this.queue = [];
    this.inRun = false;
    this.ask = null;
    this.question = null;
    this.refused = null;
    this.joinedAt = performance.now();
    this.emit('change');
    const params = new URLSearchParams(location.search);
    const relays = params.get('relays') ? params.get('relays').split(',').filter(Boolean) : null;
    const only = options.strategy==='default'?null:['nostr','torrent'].includes(options.strategy)?options.strategy:['nostr','torrent'].includes(params.get('net'))?params.get('net'):null;
    this.signalling={only};
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
    this.roster.set(this.selfId, { id: this.selfId, name: myName(), slot: host ? 0 : -1, host, mic: this.mic.state === 'on', inRun: false, self: true, fit: myFit(), cleared: forestCleared() });
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
    this.ask = null;
    this.question = null;
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
    if(q.get('relays'))u.searchParams.set('relays',q.get('relays')); // diagnostics stay local to the caller, never in cloud invites
    if(this.signalling?.only)u.searchParams.set('net',this.signalling.only);
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
    return { v: PROTOCOL, name: myName(), host: this.isHost, mic: this.mic.state === 'on', fit: myFit(), cleared: forestCleared(), uid: this.uid };
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
        if (!this.isHost && d && d.host === pid && (!this.hostId || this.hostId === pid)) this._onRoster(d);
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
      case 'mq':
        if (!this.isHost && pid === this.hostId && d && Number.isInteger(d.id)) {
          this.question = { id: d.id, map: cleanMap(d.map) };
          this.emit('change');
        }
        break;
      case 'ma':
        if (this.isHost && d) this._onMapAnswer(pid, d);
        break;
      case 'rd': {
        const r = this.roster.get(pid);
        if (this.isHost && r && d && this.phase === 'lobby') { r.ready = d.ready === true; this._broadcastRoster(); this.emit('change'); }
        break;
      }
      case 'nm': {
        const r = this.roster.get(pid);
        if (r && d) {
          r.name = cleanName(d.name);
          r.mic = !!d.mic;
          if (d.fit) r.fit = cleanFit(d.fit);
          if (typeof d.cleared === 'boolean') r.cleared = d.cleared;
          if ('uid' in d) r.uid = cleanUid(d.uid);
          // (3.0s: a player who wins the forest while being asked has nothing left to agree to)
          if (this.isHost && r.cleared && this.ask?.wait.has(pid)) { this._onMapAnswer(pid, { id: this.ask.id, yes: true }); break; }
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
    r.cleared = d.cleared === true; // (3.0s) has won a shift on the forestry
    r.uid = cleanUid(d.uid);
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
      // (3.0s) the room is on the bog (or about to be) and this one has not cleared the forest: they are asked too
      const bog = this.ask ? this.ask.map === 'bog' : this.rules.map === 'bog';
      if (bog && !r.cleared && this.phase === 'lobby') this._askMore('bog', [pid]);
      this._broadcastRoster();
    }
    this.emit('change');
  }

  setHideNames(value) {
    if (!this.active || !this.isHost || this.phase !== 'lobby' || typeof value !== 'boolean') return false;
    this.rules = cleanLobbyRules({ ...this.rules, hideNames: value });
    settings.lobbyHideNames = value; saveSettings();
    this._broadcastRoster(); this.emit('change'); return true;
  }

  // (2.1s: how long the shift runs — 2, 4 or 6 nights; the difficulty stretches to fit)
  setDays(value) {
    if (!this.active || !this.isHost || this.phase !== 'lobby' || ![2, 4, 6].includes(value)) return false;
    this.rules = cleanLobbyRules({ ...this.rules, days: value });
    settings.shiftDays = value; saveSettings();
    this._unready(); // (3.0y) new terms: everyone says yes again
    this._broadcastRoster(); this.emit('change'); return true;
  }

  // (3.0n) the host picks the участок from the lobby's own settings: it is the room's ground, so it belongs
  // with the other rules instead of being whatever URL the host happened to open
  //
  // (3.0s) the bog is earned on the forestry. The room can go there only if someone in it has cleared the
  // forest, and everyone who has not must agree first: the pick becomes a question (`mq`) to each of them,
  // and the rule changes when the last one says yes (`ma`). One «no» and the room stays on the forest.
  setMap(value) {
    if (!this.active || !this.isHost || this.phase !== 'lobby') return false;
    const map = cleanMap(value);
    if (map !== 'bog' && this.ask) this._endAsk(); // picking the forest withdraws the question
    if (map === this.rules.map) { this.emit('change'); return false; }
    if (!roomMapOpen(map, this.players())) { this.emit('mapLocked'); this.emit('change'); return false; }
    const wait = mapAskList(map, this.players(), this.selfId);
    if (wait.length) { this._askMore(map, wait); return true; }
    this._applyMap(map);
    return true;
  }

  _applyMap(map) {
    this.ask = null;
    if (map !== this.rules.map) this._unready(); // (3.0y) a different ground: everyone says yes again
    this.rules = cleanLobbyRules({ ...this.rules, map });
    settings.shiftMap = map; saveSettings();
    this._broadcastRoster(); this.emit('change');
  }

  // ask these players (and keep asking whoever was already being asked)
  _askMore(map, pids) {
    if (!this.ask || this.ask.map !== map) this.ask = { id: (Math.random() * 2 ** 31) >>> 0, map, wait: new Set() };
    for (const pid of pids) {
      this.ask.wait.add(pid);
      this.net.send('mq', { id: this.ask.id, map }, pid);
    }
    this._broadcastRoster(); this.emit('change');
  }

  _endAsk() {
    this.ask = null;
    this._broadcastRoster(); this.emit('change');
  }

  _onMapAnswer(pid, d) {
    const a = this.ask;
    if (!a || d.id !== a.id || !a.wait.has(pid)) return;
    if (!d.yes) {
      // one «no»: the room stays on (or goes back to) the forest, and everyone sees who said it
      const name = this.roster.get(pid)?.name || '???';
      this.refused = { name, at: performance.now() };
      this.emit('mapRefused', name);
      this._applyMap('forest');
      return;
    }
    a.wait.delete(pid);
    if (a.wait.size === 0) this._applyMap(a.map);
    else { this._broadcastRoster(); this.emit('change'); }
  }

  // guest: say yes or no to the host's question
  answerMap(yes) {
    const q = this.question;
    if (!q || this.isHost || !this.hostId) return false;
    this.question = null;
    this.net.send('ma', { id: q.id, yes: !!yes }, this.hostId);
    this.emit('change');
    return true;
  }

  // ---------------- ready (3.0y) ----------------
  // every player ticks «ready»; the host's START waits for the guests (the host's own press is their yes)
  setReady(on) {
    const me = this.me();
    if (!me || !this.active || this.phase !== 'lobby') return false;
    me.ready = !!on;
    if (this.isHost) this._broadcastRoster();
    else if (this.hostId) this.net.send('rd', { ready: !!on }, this.hostId);
    this.emit('change');
    return true;
  }

  // the seated guests who have not said they are ready (names, for the note and the START button)
  notReady() {
    return this.players().filter((p) => !p.host && !p.ready).map((p) => p.name);
  }

  _unready() {
    for (const p of this.roster.values()) p.ready = false;
  }

  // the names still holding the bog back (for the lobby's note)
  askNames() {
    const wait = this.ask ? [...this.ask.wait] : [];
    return wait.map((id) => this.roster.get(id)?.name).filter(Boolean);
  }

  _broadcastRoster() {
    if (!this.isHost) return;
    const list = this.players().map((p) => ({ id: p.id, name: p.name, slot: p.slot, host: !!p.host, mic: !!p.mic, inRun: !!p.inRun, fit: p.fit, cleared: !!p.cleared, uid: p.self ? this.uid : p.uid || null, ready: !!p.ready }));
    const ask = this.ask ? { map: this.ask.map, wait: [...this.ask.wait] } : null;
    const refused = this.refused && performance.now() - this.refused.at < 8000 ? this.refused.name : null;
    this.net.send('roster', { host: this.selfId, phase: this.phase, list, rules: this.rules, ask, refused });
  }

  _onRoster(d) {
    this.hostId = d.host;
    this.rules = cleanLobbyRules(d.rules);
    this.phase = d.phase === 'game' ? 'game' : 'lobby';
    // (3.0s) the host's open question about the bog, and the last «no»
    this.ask = d.ask && Array.isArray(d.ask.wait) ? { map: cleanMap(d.ask.map), wait: new Set(d.ask.wait.filter((x) => typeof x === 'string')) } : null;
    if (this.question && !this.ask?.wait.has(this.selfId)) this.question = null; // withdrawn, or answered
    if (d.refused && (!this.refused || this.refused.name !== cleanName(d.refused))) { this.refused = { name: cleanName(d.refused), at: performance.now() }; this.emit('mapRefused', this.refused.name); }
    else if (!d.refused) this.refused = null;
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
      if (!r.self) r.cleared = !!e.cleared;
      if (!r.self) r.uid = cleanUid(e.uid);
      r.ready = !!e.ready; // (3.0y) the host's word, for everyone (yours too: it went through the host)
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
    // (3.0s) someone who was being asked left: the rest of the room can still agree
    if (this.isHost && this.ask?.wait.delete(pid) && this.ask.wait.size === 0) this._applyMap(this.ask.map);
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
    me.cleared = forestCleared();
    me.uid = this.uid;
    this.net.send('nm', { name: me.name, mic: me.mic, fit: me.fit, cleared: me.cleared, uid: this.uid });
    if (this.isHost) this._broadcastRoster();
    this.emit('change');
  }

  // ---------------- runs ----------------
  // host: everyone seated right now goes into a new night
  // cut: from the garage — everyone watches the car start before the night begins (a restart is instant)
  startRun({ cut = false } = {}) {
    if (!this.isHost) return null;
    if (this.ask && cut !== 2) return null; // (3.0s) the night waits until the bog question is answered (the gates to the range do not)
    if (this.notReady().length) return null; // (3.0y) and until every guest has said they are ready
    const list = this.players();
    for (const p of list) p.inRun = true;
    this.phase = 'game';
    // cut: 1 the engine-start film, 2 the departure film — the gates open and the car takes the
    // team to the training ground (tr) instead of the night
    const msg = { seed: (Math.random() * 2 ** 31) >>> 0, players: list.map((p) => ({ id: p.id, name: p.name, slot: p.slot, fit: p.self ? myFit() : p.fit })), cut: cut === 2 ? 2 : cut ? 1 : 0, tr: cut === 2 ? 1 : 0, rules: cleanLobbyRules(this.rules) };
    this.net.send('start', msg);
    this._broadcastRoster();
    this._onStart(msg);
    return msg;
  }

  _onStart(d) {
    if (!Array.isArray(d.players) || !d.players.some((p) => p.id === this.selfId)) return; // not seated this time
    this.phase = 'game';
    this.rules = cleanLobbyRules(d.rules);
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
    for (const p of this.roster.values()) { p.inRun = false; p.ready = false; } // (3.0y) a new night, a new yes
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
