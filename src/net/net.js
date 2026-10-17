// Peer-to-peer transport for co-op: WebRTC through Trystero — no game server anywhere.
//
// Browsers find each other through public signalling networks, two at once: Nostr relays and
// WebTorrent trackers. If one is blocked or down on somebody's connection the other still works.
// The same friend can turn up on both; everything we send goes out once, over the link that came up
// first (receiving needs no dedupe for that reason). Game traffic itself never touches the relays:
// it flows directly between the browsers, end-to-end encrypted.
import { ICE_SERVERS } from './ice.js';

const APP_ID = 'hush-echolocation-horror'; // must stay stable: relay selection is derived from it
export const PROTOCOL = 10; // 2: doors, flares · 3: the garage (the car starts the night), the calm at the start · 4: going down and the first-aid hut, glow sticks · 5: shadows, the forestry yard, the УАЗ's parts and the way out · 6: cupboards, the шкафандр · 7: flashlights (and batteries in the cupboards), shared shards, the host's car · 8: a weaker flashlight (its dark moments go over the wire; a friend's light draws them too) · 9: Zarya, lookout, physical field kit and locked cupboards · 10: four-pocket inventory, watch, complete voice phrases, lobby rules
export const MAX_PLAYERS = 4;

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L
export function makeCode(n = 5) {
  let s = '';
  const r = crypto.getRandomValues(new Uint8Array(n));
  for (let i = 0; i < n; i++) s += ALPHABET[r[i] % ALPHABET.length];
  return s;
}
// whatever got pasted (a whole invite link, spaces, lowercase) → just the code
export function cleanCode(s) {
  s = String(s || '').trim();
  const m = s.match(/[?&#]room=([A-Za-z0-9]+)/);
  if (m) s = m[1];
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export class Net {
  constructor() {
    this.links = []; // { name, room, act, sockets() }
    this.selfId = null;
    this.code = null;
    this.peers = new Map(); // peerId -> { links: Set<idx>, primary: idx, rtt }
    this.stream = null;
    // callbacks
    this.onMessage = null; // (type, data, peerId)
    this.onPeerJoin = null; // (peerId)
    this.onPeerLeave = null; // (peerId)
    this.onPeerStream = null; // (peerId, stream)
    this.onError = null; // (msg)
    this._pingTimer = 0;
  }

  get connected() {
    return this.links.length > 0;
  }

  // relays: optional list of ws(s):// URLs — local testing / self-hosted relay (Nostr protocol)
  // only: 'nostr' | 'torrent' — use just one signalling network (diagnostics: ?net=torrent)
  async join(code, { relays = null, test = false, only = null } = {}) {
    if (this.connected) await this.leave();
    this.code = code;
    const roomId = 'hush-' + code;
    const base = { appId: APP_ID, password: 'hush:' + code };
    if (ICE_SERVERS.length) base.turnConfig = ICE_SERVERS;
    if (test) base._test_only_mdnsHostFallbackToLoopback = true;
    let plan = relays && relays.length
      ? [['nostr', { relayConfig: { urls: relays, warnOnRelayFailure: false } }]]
      : [['nostr', { relayConfig: { redundancy: 6, warnOnRelayFailure: false } }], ['torrent', { relayConfig: { redundancy: 4 } }]];
    if (only) plan = plan.filter(([name]) => name === only);
    for (const [name, extra] of plan) {
      let mod;
      try {
        mod = name === 'nostr' ? await import('@trystero-p2p/nostr') : await import('@trystero-p2p/torrent');
      } catch (e) {
        console.warn('[net] could not load', name, e);
        continue;
      }
      if (this.code !== code) return; // left while loading
      this.selfId = mod.selfId;
      let room;
      try {
        room = mod.joinRoom({ ...base, ...extra }, roomId, {
          onJoinError: (d) => this.onError && this.onError(d && d.error ? d.error : 'join error'),
        });
      } catch (e) {
        console.warn('[net] joinRoom failed on', name, e);
        continue;
      }
      const idx = this.links.length;
      const act = room.makeAction('m');
      act.onMessage = (data, ctx) => this._recv(data, ctx.peerId);
      room.onPeerJoin = (pid) => this._link(idx, pid);
      room.onPeerLeave = (pid) => this._unlink(idx, pid);
      room.onPeerStream = (stream, pid) => this.onPeerStream && this.onPeerStream(pid, stream);
      this.links.push({ name, room, act, sockets: mod.getRelaySockets });
    }
    if (!this.links.length) throw new Error('no signalling strategy available');
    this._pingTimer = setInterval(() => this._pingAll(), 2000);
  }

  async leave() {
    clearInterval(this._pingTimer);
    const links = this.links;
    this.links = [];
    this.peers.clear();
    this.code = null;
    for (const l of links) {
      try {
        await l.room.leave();
      } catch { /* already gone */ }
    }
  }

  // how many signalling sockets are open right now (for the lobby's status line)
  relayStatus(name = null) {
    let open = 0, total = 0;
    const seen = new Set();
    for (const l of this.links) {
      if (name && l.name !== name) continue;
      let socks = {};
      try {
        socks = l.sockets ? l.sockets() : {};
      } catch { /* */ }
      for (const [url, s] of Object.entries(socks)) {
        if (seen.has(url)) continue;
        seen.add(url);
        total++;
        if (s && s.readyState === 1) open++;
      }
    }
    return { open, total };
  }

  peerIds() {
    return [...this.peers.keys()];
  }

  rtt(pid) {
    const p = this.peers.get(pid);
    return p ? p.rtt : null;
  }

  // ---------------- peers ----------------
  _link(idx, pid) {
    let p = this.peers.get(pid);
    if (p) {
      p.links.add(idx);
      return;
    }
    p = { links: new Set([idx]), primary: idx, rtt: null, stuck: 0 };
    this.peers.set(pid, p);
    // both sides adding audio the instant the link is up makes their offers collide ("glare"):
    // the larger id waits a moment
    if (this.stream) setTimeout(() => this.peers.get(pid) === p && this._addStream(pid), this.selfId < pid ? 0 : 1800);
    this.onPeerJoin && this.onPeerJoin(pid);
  }

  _unlink(idx, pid) {
    const p = this.peers.get(pid);
    if (!p) return;
    p.links.delete(idx);
    if (p.links.size === 0) {
      this.peers.delete(pid);
      this.onPeerLeave && this.onPeerLeave(pid);
      return;
    }
    if (p.primary === idx) {
      p.primary = p.links.values().next().value;
      if (this.stream) this._addStream(pid); // the voice moves over to the surviving link
    }
  }

  async _pingAll() {
    this._voiceWatchdog();
    for (const [pid, p] of this.peers) {
      const l = this.links[p.primary];
      if (!l) continue;
      try {
        const ms = await l.room.ping(pid);
        if (this.peers.get(pid) === p) p.rtt = Math.round(ms);
      } catch { /* peer busy or gone */ }
    }
  }

  // ---------------- messages ----------------
  // target: undefined = everyone, a peer id, or a list of ids
  send(type, data, target) {
    const ids = target === undefined ? this.peerIds() : Array.isArray(target) ? target : [target];
    if (!ids.length) return;
    const byLink = new Map();
    for (const pid of ids) {
      const p = this.peers.get(pid);
      if (!p) continue;
      if (!byLink.has(p.primary)) byLink.set(p.primary, []);
      byLink.get(p.primary).push(pid);
    }
    const msg = [type, data === undefined ? null : data];
    for (const [idx, pids] of byLink) {
      const l = this.links[idx];
      if (!l) continue;
      try {
        const pr = l.act.send(msg, { target: pids });
        if (pr && pr.catch) pr.catch(() => {});
      } catch { /* channel congested or closing: real-time data, drop it */ }
    }
  }

  _recv(data, pid) {
    if (!Array.isArray(data) || typeof data[0] !== 'string') return;
    if (!this.peers.has(pid)) return; // not (or no longer) one of ours
    this.onMessage && this.onMessage(data[0], data[1], pid);
  }

  // ---------------- voice ----------------
  setStream(stream) {
    if (this.stream === stream) return;
    const old = this.stream;
    this.stream = stream;
    if (old) {
      for (const l of this.links) {
        try {
          l.room.removeStream(old);
        } catch { /* */ }
      }
    }
    if (stream) for (const pid of this.peers.keys()) this._addStream(pid);
  }

  _addStream(pid) {
    const p = this.peers.get(pid);
    const l = p && this.links[p.primary];
    if (!l || !this.stream) return;
    const pc = this._pc(pid);
    const tracks = this.stream.getTracks();
    if (pc && pc.getSenders().some((s) => s.track && tracks.includes(s.track))) return; // already there
    try {
      const prs = l.room.addStream(this.stream, { target: pid });
      for (const pr of prs || []) if (pr && pr.catch) pr.catch((e) => console.warn('[net] addStream rejected', e && e.message));
    } catch (e) {
      console.warn('[net] addStream failed', e && e.message);
    }
  }

  _pc(pid) {
    const p = this.peers.get(pid);
    const l = p && this.links[p.primary];
    if (!l) return null;
    try {
      return l.room.getPeers()[pid] || null;
    } catch {
      return null;
    }
  }

  // our voice must actually reach everyone: a track that never got negotiated (an offer lost to a
  // collision) gets another round of negotiation; a track that isn't there at all gets added again
  _voiceWatchdog() {
    if (!this.stream) return;
    const tracks = this.stream.getTracks();
    for (const [pid, p] of this.peers) {
      const pc = this._pc(pid);
      if (!pc || pc.connectionState === 'closed') continue;
      const tr = pc.getTransceivers().find((t) => t.sender && t.sender.track && tracks.includes(t.sender.track));
      if (!tr) {
        if (++p.stuck >= 2) {
          p.stuck = 0;
          this._addStream(pid);
        }
        continue;
      }
      const sending = tr.currentDirection === 'sendrecv' || tr.currentDirection === 'sendonly';
      if (sending) {
        p.stuck = 0;
        continue;
      }
      if (pc.signalingState === 'stable' && ++p.stuck >= 2) {
        p.stuck = 0;
        try {
          if (pc.onnegotiationneeded) pc.onnegotiationneeded(new Event('negotiationneeded'));
        } catch { /* */ }
      }
    }
  }
}
