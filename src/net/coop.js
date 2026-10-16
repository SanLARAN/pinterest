// ============================================================
// COOP — peer-to-peer co-op over WebRTC (PeerJS cloud broker).
// The host simulates monsters/objectives and broadcasts snapshots;
// guests own their own body and forward their inputs + noise events.
// Optional voice chat: your partner's mic is analysed too, so if THEY
// scream, the forest hears it where they are standing.
// ============================================================
import { Emitter } from '../core/util.js';

const PREFIX = 'eh30-';
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeCode(len = 5) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[(Math.random() * ALPHABET.length) | 0];
  return s;
}

export class Coop extends Emitter {
  constructor() {
    super();
    this.mode = 'solo';          // 'solo' | 'host' | 'guest'
    this.code = null;
    this.peer = null;
    this.conns = new Map();      // host: peerId -> DataConnection
    this.hostConn = null;        // guest: connection to the host
    this.ready = false;
    this.stateAcc = 0;
    this.inputAcc = 0;
    this.voice = false;
    this.calls = new Map();
    this.remoteAudio = [];
    this.remoteLevels = new Map();
    this.lastError = '';
  }

  get connected() { return this.mode === 'guest' ? !!this.hostConn && this.hostConn.open : this.conns.size > 0; }
  get peerCount() { return this.mode === 'host' ? this.conns.size : this.mode === 'guest' && this.connected ? 1 : 0; }

  status(s, msg = '') {
    this.lastError = s === 'error' ? msg : '';
    this.emit('status', s, msg);
  }

  async loadPeer() {
    if (this.Peer) return this.Peer;
    try {
      const mod = await import('peerjs');
      this.Peer = mod.default || mod.Peer;
      return this.Peer;
    } catch (e) {
      this.status('error', 'peerjs-load-failed');
      return null;
    }
  }

  async host(micStream) {
    const Peer = await this.loadPeer();
    if (!Peer) return null;
    this.close();
    this.mode = 'host';
    this.code = makeCode();
    this.status('hosting', this.code);
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => { if (!done) { done = true; resolve(ok ? this.code : null); } };
      try {
        this.peer = new Peer(PREFIX + this.code, { debug: 0 });
      } catch (e) { this.status('error', 'peer-init'); finish(false); return; }
      const to = setTimeout(() => { if (!this.peer || !this.peer.open) { this.status('error', 'timeout'); this.close(); finish(false); } }, 18000);
      this.peer.on('open', (id) => { clearTimeout(to); this.ready = true; this.status('hosted', this.code); finish(this.code); });
      this.peer.on('error', (err) => {
        clearTimeout(to);
        const type = err && err.type;
        if (type === 'unavailable-id') { this.code = makeCode(); this.host(micStream).then(resolve); return; }
        this.status('error', type || 'peer-error');
        finish(false);
      });
      this.peer.on('disconnected', () => { this.status('reconnect'); try { this.peer.reconnect(); } catch (e) {} });
      this.peer.on('connection', (conn) => this.setupHostConn(conn, micStream));
      this.peer.on('call', (call) => this.answerCall(call));
    });
  }

  setupHostConn(conn, micStream) {
    conn.on('open', () => {
      this.conns.set(conn.peer, conn);
      this.status('peer-joined', conn.peer);
      this.emit('peerJoined', conn.peer);
      if (this.voice && micStream) this.callPeer(conn.peer, micStream);
    });
    conn.on('data', (msg) => this.onMessage(conn.peer, msg));
    conn.on('close', () => { this.conns.delete(conn.peer); this.emit('peerLeft', conn.peer); this.status('peer-left', conn.peer); });
    conn.on('error', () => { this.conns.delete(conn.peer); this.emit('peerLeft', conn.peer); });
  }

  async join(code, micStream) {
    const Peer = await this.loadPeer();
    if (!Peer) return false;
    this.close();
    this.mode = 'guest';
    this.code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (this.code.length < 4) { this.status('error', 'bad-code'); return false; }
    this.status('joining', this.code);
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
      try {
        this.peer = new Peer({ debug: 0 });
      } catch (e) { this.status('error', 'peer-init'); finish(false); return; }
      const to = setTimeout(() => { if (!this.hostConn || !this.hostConn.open) { this.status('error', 'timeout'); this.close(); finish(false); } }, 20000);
      this.peer.on('open', () => {
        const conn = this.peer.connect(PREFIX + this.code, { reliable: true, serialization: 'json', metadata: { v: 1 } });
        this.hostConn = conn;
        conn.on('open', () => {
          clearTimeout(to);
          this.ready = true;
          this.status('joined', this.code);
          if (this.voice && micStream) this.callPeer(PREFIX + this.code, micStream);
          finish(true);
        });
        conn.on('data', (msg) => this.onMessage('host', msg));
        conn.on('close', () => { this.status('closed'); this.emit('hostLeft'); this.close(); });
        conn.on('error', (e) => { clearTimeout(to); this.status('error', 'conn'); finish(false); });
      });
      this.peer.on('error', (err) => {
        clearTimeout(to);
        const type = err && err.type;
        this.status('error', type === 'peer-unavailable' ? 'no-room' : type || 'peer-error');
        finish(false);
      });
      this.peer.on('call', (call) => this.answerCall(call));
    });
  }

  onMessage(from, msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.t) {
      case 'hello': this.emit('hello', msg, from); break;
      case 'state': this.emit('state', msg.s, msg.e, from); break;
      case 'input': this.emit('input', msg.i, msg.p, from); break;
      case 'ev': this.emit('ev', msg.i, msg.e, from); break;
      case 'bye': this.emit('peerLeft', from); break;
      default: this.emit('msg', msg, from);
    }
  }

  // ---------------- sending ----------------
  sendHello(info) {
    this.broadcast({ t: 'hello', ...info }, this.mode === 'guest' ? 'host' : null);
  }
  /** Host -> guests: snapshot + discrete events since the last tick. */
  sendState(snapshot, events) {
    if (this.mode !== 'host') return;
    const msg = { t: 'state', s: snapshot, e: events && events.length ? events : 0 };
    for (const conn of this.conns.values()) if (conn.open) this.safeSend(conn, msg);
  }
  /** Guest -> host: own transform + events. */
  sendInput(id, playerState, events) {
    if (this.mode !== 'guest' || !this.hostConn || !this.hostConn.open) return;
    const msg = { t: 'input', i: id, p: playerState };
    if (events && events.length) msg.e = events;
    this.safeSend(this.hostConn, msg);
  }
  sendEvent(id, ev) {
    const msg = { t: 'ev', i: id, e: ev };
    if (this.mode === 'guest' && this.hostConn && this.hostConn.open) this.safeSend(this.hostConn, msg);
    else if (this.mode === 'host') for (const conn of this.conns.values()) if (conn.open) this.safeSend(conn, msg);
  }
  broadcast(msg, onlyTo) {
    if (this.mode === 'guest') { if (this.hostConn && this.hostConn.open) this.safeSend(this.hostConn, msg); return; }
    for (const [id, conn] of this.conns) { if (onlyTo && id !== onlyTo) continue; if (conn.open) this.safeSend(conn, msg); }
  }
  safeSend(conn, msg) {
    try { conn.send(msg); } catch (e) { /* buffer full / closing */ }
  }

  // ---------------- voice ----------------
  setVoice(on, micStream) {
    this.voice = !!on;
    if (!on) {
      for (const call of this.calls.values()) { try { call.close(); } catch (e) {} }
      this.calls.clear();
      for (const a of this.remoteAudio) { try { a.el.pause(); a.el.srcObject = null; } catch (e) {} }
      this.remoteAudio.length = 0;
      this.remoteLevels.clear();
      return;
    }
    if (!micStream || !this.peer) return;
    const ids = this.mode === 'host' ? Array.from(this.conns.keys()) : (this.hostConn ? [this.hostConn.peer] : []);
    for (const id of ids) this.callPeer(id, micStream);
  }
  callPeer(id, stream) {
    if (!this.peer || !stream || this.calls.has(id)) return;
    try {
      const call = this.peer.call(id, stream);
      if (!call) return;
      this.calls.set(id, call);
      call.on('stream', (remote) => this.attachRemote(id, remote));
      call.on('close', () => { this.calls.delete(id); this.detachRemote(id); });
      call.on('error', () => { this.calls.delete(id); });
    } catch (e) { /* ignore */ }
  }
  answerCall(call) {
    try {
      call.answer(this.micStreamRef || undefined);
      this.calls.set(call.peer, call);
      call.on('stream', (remote) => this.attachRemote(call.peer, remote));
      call.on('close', () => { this.calls.delete(call.peer); this.detachRemote(call.peer); });
    } catch (e) {}
  }
  attachRemote(id, stream) {
    let entry = this.remoteAudio.find((a) => a.id === id);
    if (!entry) {
      const el = new Audio();
      el.autoplay = true;
      el.playsInline = true;
      el.style.display = 'none';
      document.body.appendChild(el);
      entry = { id, el, stream, analyser: null, buf: null, level: 0 };
      this.remoteAudio.push(entry);
    }
    entry.stream = stream;
    entry.el.srcObject = stream;
    entry.el.play && entry.el.play().catch(() => {});
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = entry.ctx || (entry.ctx = new AC());
      if (ctx.state === 'suspended') ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);                     // never to destination: the <audio> element plays it
      entry.analyser = an;
      entry.buf = new Uint8Array(an.fftSize);
    } catch (e) {}
    this.emit('voiceOn', id);
  }
  detachRemote(id) {
    const i = this.remoteAudio.findIndex((a) => a.id === id);
    if (i < 0) return;
    const a = this.remoteAudio[i];
    try { a.el.pause(); a.el.remove(); } catch (e) {}
    this.remoteAudio.splice(i, 1);
    this.remoteLevels.delete(id);
  }
  /** Peak level 0..1 of each remote voice, for "your friend screamed" noise. */
  updateRemoteLevels(dt) {
    for (const a of this.remoteAudio) {
      if (!a.analyser) continue;
      a.analyser.getByteTimeDomainData(a.buf);
      let sum = 0;
      for (let i = 0; i < a.buf.length; i += 2) { const v = (a.buf[i] - 128) / 128; sum += v * v; }
      a.level = Math.sqrt(sum / (a.buf.length / 2));
      this.remoteLevels.set(a.id, a.level);
    }
  }

  close() {
    this.ready = false;
    for (const conn of this.conns.values()) { try { this.safeSend(conn, { t: 'bye' }); conn.close(); } catch (e) {} }
    this.conns.clear();
    if (this.hostConn) { try { this.safeSend(this.hostConn, { t: 'bye' }); this.hostConn.close(); } catch (e) {} this.hostConn = null; }
    for (const call of this.calls.values()) { try { call.close(); } catch (e) {} }
    this.calls.clear();
    for (const a of this.remoteAudio) { try { a.el.pause(); a.el.remove(); } catch (e) {} }
    this.remoteAudio.length = 0;
    if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
    this.mode = 'solo';
    this.code = null;
  }
}
