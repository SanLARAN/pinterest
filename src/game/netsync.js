// In-game co-op traffic.
//
//  everyone → everyone  'ps'  own state, 15/s: position, look, speed, flags, loudness, score
//                       'ev'  things that happened: pulses, stones, shards, repair sounds, found parts,
//                             a flare fired, a door swung (newest swing wins, see Doors), a glow stick
//                             cracked / thrown / picked up, a friend put down (see Rescue)
//                       'ob'  the objectives (generators, bodies) — merged monotonically, see Objectives —
//                             and the doors
//  guest → host         'nz'  a noise the guest made (voice, ping, steps, repairs): the host's monsters hear it
//                       'sk'  "skip the morning"
//                       'rc' / 'rr'  "let me lift them" / "they're breathing" (see Rescue)
//  host → everyone      'sn'  monster snapshot, 10/s
//                       'ev'  monster events (hunt, howl, kill...), phase changes (dusk, dawn, end),
//                             who lifted whom, who is back, who bled out
import { createMonster, STATES, TYPES } from './monsters.js';
import { PF } from './remote.js';
import { kindIndex } from './backpackData.js';

const PS_HZ = 15;
const SNAP_HZ = 10;
export const NOISE_SRC = ['voice', 'ping', 'step', 'bump', 'breath', 'repair', 'door', 'flare', 'glow', 'part', 'engine', 'torch', 'crowbar', 'ladder'];
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

export class NetSync {
  constructor(game, coop) {
    this.g = game;
    this.coop = coop;
    this.psT = 0;
    this.snT = 0;
    this.obT = 0;
    this.obBeat = 3;
    this.voiceAcc = 0;
    this.voiceScream = false;
    this.voiceT = 0;
  }

  get host() {
    return this.coop.isHost;
  }

  // ---------------- outgoing ----------------
  send(type, data, target) {
    this.coop.send(type, data, target);
  }

  ev(name, ...args) {
    this.coop.send('ev', [name, ...args]);
  }

  // a noise this machine's player made: the host's monsters must hear it
  noise(x, z, loud, source, scream) {
    const i = NOISE_SRC.indexOf(source);
    if (i < 0) return;
    if (source === 'voice') {
      // the mic reports every frame; batch it to ~8 messages a second (loudest wins)
      this.voiceAcc = Math.max(this.voiceAcc, loud);
      this.voiceScream = this.voiceScream || scream;
      return;
    }
    this.coop.toHost('nz', [r2(x), r2(z), r3(loud), i, scream ? 1 : 0]);
  }

  tick(dt) {
    const g = this.g;
    const p = g.player;
    // own state
    this.psT -= dt;
    if (this.psT <= 0) {
      this.psT = p.alive ? 1 / PS_HZ : 0.5;
      let f = 0;
      if (p.crouching) f |= PF.crouch;
      if (p.sprinting) f |= PF.sprint;
      if (p.alive) f |= PF.alive;
      if (g.charge && g.charge.active && g.charge.t > 0.3) f |= PF.charging;
      if (g.input.useHeld) f |= PF.use;
      if (g.torch && g.torch.on) f |= PF.torch;
      if (g.torch && g.torch.on && g.torch.dip) f |= PF.dip;
      const loud = g.mic.state === 'on' ? g.mic.loud : 0;
      this.send('ps', [r2(p.x), r2(p.y), r2(p.z), r3(p.yaw), r3(p.pitch), r2(p.speed), f, r2(loud), Math.floor(g.score), g.torch ? r2(g.torch.charge) : 0, kindIndex(g.inventory.equipped), g.inventory.active ? 1 : g.fieldView.watch > 0.2 ? 2 : 0]);
    }
    // batched voice noise → host
    if (!this.host) {
      this.voiceT -= dt;
      if (this.voiceT <= 0 && this.voiceAcc > 0) {
        this.voiceT = 0.12;
        this.coop.toHost('nz', [r2(p.x), r2(p.z), r3(this.voiceAcc), 0, this.voiceScream ? 1 : 0]);
        this.voiceAcc = 0;
        this.voiceScream = false;
      }
    }
    // monsters (host)
    if (this.host && (g.state === 'play' || g.state === 'dawn')) {
      this.snT -= dt;
      if (this.snT <= 0) {
        this.snT = 1 / SNAP_HZ;
        this.send('sn', { t: r2(g.time), m: g.monsters.map((m) => this.packMonster(m)) });
      }
    }
    // objectives: when they change (throttled), plus a slow heartbeat that heals anything lost
    const ob = g.objectives;
    this.obT -= dt;
    this.obBeat -= dt;
    if ((ob.dirty && this.obT <= 0) || this.obBeat <= 0) {
      this.obT = 0.15;
      this.obBeat = 3;
      ob.dirty = false;
      this.send('ob', { ...ob.netState(), d: g.doors.netState(), e: g.escape.netState(), k: g.cabinets.netState(), it: g.tools.netState(), ex: g.expedition.netState(), bag: this.host ? g.inventory.netState() : null });
    }
  }

  packMonster(m) {
    let fl = 0;
    if (m.lit) fl |= 1;
    if (m.intro) fl |= 2;
    if (m.scripted === 'freeze') fl |= 4;
    return [m.id, TYPES.indexOf(m.type), r2(m.x), r2(m.z), r3(m.yaw), r2(m.headYaw || 0), r2(m.speedCur), STATES.indexOf(m.state), fl];
  }

  // ---------------- incoming ----------------
  process() {
    const g = this.g;
    for (const [type, d, pid] of this.coop.drain()) {
      try {
        this.handle(type, d, pid);
      } catch (e) {
        console.warn('[sync] bad message', type, e);
      }
      if (g.state === 'over' || g.state === 'idle') break;
    }
  }

  handle(type, d, pid) {
    const g = this.g;
    const isHostMsg = pid === this.coop.hostId;
    switch (type) {
      case 'ps': {
        const r = g.remotes.get(pid);
        if (r) r.push(d);
        break;
      }
      case 'sn':
        if (!this.host && isHostMsg && d && Array.isArray(d.m)) this.applySnap(d);
        break;
      case 'ob':
        if (d) {
          g.objectives.netMerge(d, g.remotes.get(pid));
          g.doors.netMerge(d.d);
          g.escape.netMerge(d.e, isHostMsg);
          g.cabinets.netMerge(d.k, isHostMsg);
          if (!this.host && isHostMsg) { g.tools.netMerge(d.it); g.expedition.netMerge(d.ex); g.inventory.netMerge(d.bag); }
        }
        break;
      case 'nz': {
        if (!this.host || !Array.isArray(d)) break;
        const r = g.remotes.get(pid);
        if (!r || !r.alive || g.state !== 'play') break;
        g.noise(+d[0], +d[1], Math.min(1, +d[2]), NOISE_SRC[d[3]] || 'voice', !!d[4], pid);
        break;
      }
      case 'sk':
        if (this.host && g.state === 'morning') g.startDusk();
        break;
      case 'rc': // a guest wants to lift someone who's down
        if (this.host && typeof d === 'string') g.rescue.grant(d, pid);
        break;
      case 'rr': // a guest finished working on someone on the cot
        if (this.host && typeof d === 'string') g.rescue.hostRevive(d, pid);
        break;
      // the УАЗ (see Escape): a guest asks for a part, a seat, to go; lays a friend in the back
      case 'xq':
        if (this.host && g.state === 'play') g.escape.grant(d | 0, pid);
        break;
      case 'xs':
        if (this.host && g.state === 'play') g.escape.assign(d | 0, pid);
        break;
      case 'xd':
        if (this.host && g.state === 'play') g.escape.hostDepart(pid);
        break;
      case 'xb':
        if (this.host && typeof d === 'string' && g.state === 'play') g.escape.hostLoad(d, pid);
        break;
      // the шкафандр (see Cabinets): a guest grabs a hand of whoever's caught; a guest's press on a beat
      case 'zg':
        if (this.host) g.cabinets.hostGrab(pid);
        break;
      case 'zp':
        if (this.host && Array.isArray(d)) g.cabinets.hostPress(pid, d[0] | 0, d[1] | 0, d[2] | 0);
        break;
      case 'vp': if (this.host && Array.isArray(d)) g.voiceMimic.accept(pid, d[0], d[1]); break;
      case 'ip': g.inventory.receiveSlots(pid, d); break;
      case 'gq': if(this.host && typeof d==='string') g.glows.hostPick(pid,d); break;
      case 'ibc': if (this.host && Array.isArray(d)) g.inventory.hostClaim(pid, d[0], d[1], d[2]); break;
      case 'ibd': if (this.host && Array.isArray(d)) g.inventory.hostDrop(pid, d[0], d[1], !!d[2]); break;
      case 'ibq': if (this.host && typeof d === 'string') g.inventory.hostPick(pid, d); break;
      case 'ibr': if (isHostMsg && typeof d === 'string') g.inventory.reject(g.player.id, d); break;
      case 'it':
        if (this.host && Array.isArray(d) && typeof d[0] === 'string') g.tools.grant(d[0], d[1], pid, d[2]);
        break;
      case 'su':
        if (this.host) g.expedition.switchSpeaker(pid, !!d);
        break;
      case 'ev':
        if (Array.isArray(d)) this.event(d, pid, isHostMsg);
        break;
      case '_left':
        g.removeRemote(pid);
        break;
    }
  }

  event(d, pid, isHostMsg) {
    const g = this.g;
    const [name, a, b, c, e, f] = d;
    const r = g.remotes.get(pid);
    switch (name) {
      // ---- from any player ----
      case 've': if (isHostMsg) g.voiceMimic.hear(a); break;
      case 'ibp': if (isHostMsg) g.inventory.applyParcel(a); break;
      case 'ibg': if (isHostMsg) g.inventory.applyClaim(a); break;
      case 'gd': if (r && typeof a === 'string') { const s = g.glows.find(a); if (s?.owner === pid && s.state === 'held') g.glows.dropFor(pid, +b, +c); } break;
      case 'pu':
        if (r) g.remotePulse(r, +a, +b, +c, +e, !!f);
        break;
      case 'st':
        if (r) g.stones.throw(+a, +b, +c, +e, +f, +d[6], pid);
        break;
      case 'sh':
        if (g.shards.take(a | 0) && g.onMateShard) g.onMateShard(g.remotes.get(pid));
        break;
      case 'fx':
        g.objectives.remoteFx(a, b | 0, c);
        break;
      case 'fd':
        if (r) g.fxMateFound(r, b | 0);
        break;
      case 'fg':
        if (r) g.fxMateFlare(r);
        break;
      case 'tq': // someone took a flashlight
        if (g.torch) g.torch.netTake(a);
        break;
      case 'fl':
        if (r && [a, b, c, e, f, d[6]].every((v) => Number.isFinite(+v))) g.remoteFlare(r, +a, +b, +c, +e, +f, +d[6]);
        break;
      case 'dr': // a door swung (a player — or, from the host, a monster)
        g.doors.netSet(a, b, c, e, f | 0);
        break;
      case 'gc': // a glow stick cracked, in their hand
        if (r && typeof a === 'string') g.glows.crack(a, pid);
        break;
      case 'gt': // ...thrown
        if (r && typeof a === 'string' && [b, c, e, f, d[6], d[7]].every((v) => Number.isFinite(+v))) g.glows.remoteThrow(pid, a, +b, +c, +e, +f, +d[6], +d[7], +d[8]);
        break;
      case 'ga': // the host awards a lit stick to exactly one backpack
        if (isHostMsg && typeof a === 'string' && typeof b === 'string') g.glows.remotePick(b, a);
        break;
      case 'cd': // the one carrying someone put them down (here, or on the cot)
        if (r && typeof a === 'string') g.rescue.netPlace(pid, a, +b, +c, !!e);
        break;
      case 'xt': // a part out of their arms: thrown, or set down
        if (r) g.escape.netFling(pid, a, +b, +c, +e, +f, +d[6], +d[7], +d[8], +d[9], d[10] | 0);
        break;
      case 'xr': // ...where it came to rest
        if (r) g.escape.netRest(a, +b, +c, +e, +f, +d[6], +d[7], +d[8], +d[9]);
        break;
      case 'xi': // ...fitted to the car
        if (r) g.escape.netFit(pid, a, +b);
        break;
      case 'xw': // the sound of them fitting it
        if (r) g.escape.remoteWork(a);
        break;
      case 'xk': // the starter grinding (or giving up)
        if (r) g.escape.netCrank(a | 0);
        break;
      case 'xe': // it caught
        if (r) g.escape.startEngine(false);
        break;
      case 'ls': // a friend's rung creaked (the noise to the AI is a separate 'nz')
        if (r && Number.isFinite(a)) g.expedition.ladderFx(r.x, a, r.z);
        break;
      case 'pf':
        if (r) g.cabinets.pryFx(a);
        break;
      case 'co': // a cupboard opened
        g.cabinets.netOpen(a);
        break;
      case 'ct': // ...something taken out of it
        g.cabinets.netTake(a, b);
        break;
      case 'zs': // ...it was the шкафандр, and it has them
        if (r) g.cabinets.netSpring(pid, a);
        break;
      // ---- from the host only ----
      default: {
        if (!isHostMsg || this.host) break;
        const m = typeof a === 'number' ? g.monsterById(a) : null;
        switch (name) {
          case 'ix': g.tools.apply(a); break;
          case 'itape': g.tools.setClip(a, b); break;
          case 'iu': g.cabinets.netUnlock(a); break;
          case 'spe': g.expedition.netMerge(a); break;
          case 'du': if (g.state === 'morning') g.startDusk(); break;
          case 'hu': if (m) g.fxHunt(m, b); break;
          case 'in': if (m) g.fxInvestigate(m, +c || 0, b); break;
          case 'lo': if (m) g.fxLost(m, b); break;
          case 'ih': if (m) g.fxInhale(m); break;
          case 'hw': if (m) g.fxHowl(m); break;
          case 'hb': if (m) g.fxBark(m); break;
          case 'ar': g.fxArrive(a); break;
          case 'wk': g.fxWake(); break;
          case 'aw': g.fxAwake(Number.isFinite(a) ? a : null, Number.isFinite(b) ? b : null); break;
          case 'ki': g.netKill(a, b, c, +e, +f, +d[6]); break;
          case 'cu': g.rescue.netLift(a, b); break;
          case 'rv': g.rescue.netRevive(a, +b, +c, +e, f); break;
          case 'bo': g.rescue.netGone(a); break;
          case 'dk': g.doors.netKnock(a, b); break;
          case 'dn': if (g.state === 'play') g.startDawn(); break;
          case 'xg': g.escape.netGrant(a, b, +c); break;
          case 'xa': g.escape.netSeats(a); break;
          case 'xl': g.escape.netLoaded(a, b); break;
          case 'xx': if (g.state === 'play' && Array.isArray(a)) g.escape.depart(a); break;
          case 'zh': g.cabinets.netHands(a, b, c); break;
          case 'zb': g.cabinets.netBeat(a, b, c, e); break;
          case 'zr': g.cabinets.netEnd(a, 'rescued'); break;
          case 'zd': g.cabinets.netEnd(a, 'died'); break;
          case 'en': g.endOnline(false); break;
        }
      }
    }
  }

  applySnap(d) {
    const g = this.g;
    const now = performance.now();
    g.netT = +d.t || 0;
    const seen = new Set();
    for (const a of d.m) {
      if (!Array.isArray(a)) continue;
      const [id, ti, x, z, yaw, hy, spd, si, fl] = a;
      const type = TYPES[ti];
      if (!type) continue;
      seen.add(id);
      let m = g.monsterById(id);
      if (!m) {
        m = createMonster(type, g, id);
        m.puppet = true;
        m.x = x;
        m.z = z;
        m.yaw = yaw;
        m.state = STATES[si] || 'wander';
        if (Math.abs(x) < 2000) m.y = g.world.terrain.height(x, z);
        g.monsters.push(m);
      }
      m.pushSnap(now, { x, z, yaw, hy, spd, st: STATES[si] || 'wander', lit: !!(fl & 1), intro: !!(fl & 2), scr: !!(fl & 4) });
    }
    for (let i = g.monsters.length - 1; i >= 0; i--) {
      const m = g.monsters[i];
      if (!seen.has(m.id)) {
        m.dispose();
        g.monsters.splice(i, 1);
      }
    }
  }
}
