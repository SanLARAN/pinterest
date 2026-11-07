// (5.0d) Chapter 4 of «Топь»: «Деревня» — tied up in the village, the Сторож, finding each other (docs/LEVEL2.md).
//
// Everyone comes to tied to the post of a different house (world/swamp.js houseFor). The keeper walks a round of
// those houses and a few beside them, stopping at each doorway with his lantern up. Tied, you tear at the rope —
// A then D, A then D — and every pull makes the rope creak against the post: within his hearing he comes to see,
// goes in and pulls the knots tight again. So you work while his light is away, and keep still while it comes
// through the gaps of the walls. Free, you open the door (E), find the others and untie them (hold E). Whoever he
// sees out of their rope he runs down, carries back over his shoulder and ties up again; the second time he does
// not bother with the rope. When everyone still alive is free and out under the sky, the chapter is over.
//
// The host decides everything (the keeper, the ropes, who is caught): a guest sends its struggle and its creaks
// ('vq') and an untie it finished ('vu'); the host sends the keeper and every player's state ('vg', 10 Hz).
// Death here is the chapter's own: solo it starts again; in co-op the fallen wait for the others to finish.
//
// (5.0e) The map of the bog, torn in four (game/bogMap.js): each of you comes to with the piece of your seat, and
// the pieces nobody has lie on the tables of the keeper's houses. E takes one off a table, E at a friend hands them
// all your pieces; a body that falls drops what it carried. TAB holds up what you have. The chapter is over when
// everyone alive is free and the four pieces are in one pair of hands — that player carries the map into chapter 5.
import * as THREE from 'three';
import { clamp, damp, smoothstep, angleDiff } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { HOUSES, houseFor } from '../world/swamp.js';
import { poseBound, poseCarried, poseSprawled } from './survivor.js';
import { KeeperBody, KEEP, hears, sees, yawTo, detour, insideHouse } from './keeper.js';
import { MOON } from './convoyFilm.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { PIECES, piecePlan, tableSpot, drawBogMap, MapOverlay } from './bogMap.js';

const NO_LOOK = { dx: 0, dy: 0 };
export const ROPE = {
  hit: 0.018, // a pull (A, then D): about 56 of them and the rope gives (some ten seconds of work)
  decay: 0.008, // what the knot takes back each second
  creakEvery: 0.26, // s between creaks while you work at it — each one a sound he may hear
  untie: 2.4, // s of a friend's hands on the knot (hold E)
  untieR: 1.6,
};
export const VILLAGE = { allT: 2.2, deadT: 3.2, netHz: 10 };
export const PIECE = { takeR: 1.5, giveR: 2.2 }; // (5.0e) m: a piece off a table, the map to a friend
export const STATES = ['bound', 'free', 'carried', 'dead'];
export const MODES = ['look', 'walk', 'go', 'enter', 'check', 'search', 'chase', 'carry', 'tie', 'kill', 'leave'];

// the order he walks his houses in: from the first, always the nearest not yet on the list
export function roundOf(houses, first, want) {
  const left = new Set(want);
  left.delete(first);
  const out = [first];
  while (left.size) {
    const L = houses[out[out.length - 1]];
    let best = -1, bd = Infinity;
    for (const i of left) {
      const d = Math.hypot(houses[i].x - L.x, houses[i].z - L.z);
      if (d < bd) { bd = d; best = i; }
    }
    out.push(best);
    left.delete(best);
  }
  return out;
}

// which houses he keeps: the ones with someone tied in them, and the nearest others (three alone, one per house
// in a room) — so his round passes every captive's door again and again
export function keptHouses(houses, occupied, solo) {
  const want = new Set(occupied);
  const extra = solo ? 3 : 1;
  for (const i of occupied) {
    const H = houses[i];
    const near = houses.map((h, j) => [j, Math.hypot(h.x - H.x, h.z - H.z)]).filter(([j]) => !want.has(j)).sort((a, b) => a[1] - b[1]);
    for (const [j] of near.slice(0, extra)) want.add(j);
  }
  return [...want];
}

// where a captive sits: back to the post, facing the doorway
export function seatAt(H, door) {
  const p = H.post, dx = (door?.mid?.x ?? H.x) - p.x, dz = (door?.mid?.z ?? H.z) - p.z, L = Math.hypot(dx, dz) || 1;
  return { x: p.x + (dx / L) * 0.42, z: p.z + (dz / L) * 0.42, yaw: yawTo(p.x, p.z, p.x + dx, p.z + dz) };
}

// one step of a rope being worked at: hits in, the knot taking it back
export function ropeStep(meter, hits, dt) {
  return clamp(meter + hits * ROPE.hit - ROPE.decay * dt, 0, 1);
}

export class VillagePlay {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.done = false;
    this.restart = false;
    this.danger = 0;
    this.players = new Map(); // id → { id, st, hi, H, door, seat, meter, caught, creak, tight, spd, px, pz }
    this.K = null; // the keeper (the host's record; a guest's copy follows the wire)
    this.sendT = 0;
    this.allT = 0;
    this.deadT = 0;
    this.untieT = 0;
    this.lastSign = 0;
    this.creakT = 0;
    this.local = { meter: 0, creak: 0, sentM: -1, sendT: 0, tight: 0 };
    this.cues = new Set();
    this.pieces = []; // (5.0e) [{ k, holder, at: { x, y, z } }] — the host's word; a guest's copy follows 'vg'
    this.papers = [];
  }

  get me() { return this.g.player.id ?? 'me'; }
  get mine() { return this.players.get(this.me) || null; }
  // in a rope or on his shoulder your hands are not yours (no kit, no doors)
  get seated() { const P = this.mine; return !!P && P.st !== 'free'; }

  _pl(id) {
    const g = this.g;
    return id === this.me ? g.player : g.remotes?.get(id) || null;
  }

  // ---------------- begin / end ----------------
  begin(tries = 0) {
    const g = this.g;
    this.tries = tries;
    this.houses = g.world.houses.filter((h) => HOUSES.some((H) => H.id === h.id)); // (not the old man's hut by the pier)
    this.byId = new Map(this.houses.map((h, i) => [h.id, i]));
    this._roster();
    this.body = new KeeperBody(g.scene);
    // his round: the captives' houses and their neighbours; he starts at the host's door (alone: yours), looking in
    const occ = [...new Set([...this.players.values()].map((P) => P.hi))];
    const hostP = this.players.get(this.me);
    const first = tries > 0 ? occ[occ.length - 1] : hostP ? hostP.hi : occ[0];
    const kept = keptHouses(this.houses, occ, this.players.size < 2);
    this.round = roundOf(this.houses, first, kept);
    if (tries > 0) this.round.push(this.round.shift()); // (a retry: he has just left)
    const d0 = this._door(this.round[0]);
    const at = d0 ? d0.out : this.houses[this.round[0]];
    this.K = { x: at.x, z: at.z, yaw: d0 ? yawTo(d0.out.x, d0.out.z, d0.mid.x, d0.mid.z) : 0, mode: 'look', t: tries > 0 ? KEEP.look : 1.0, ri: 0, hi: this.round[0], target: null, goal: null, lost: 0, phase: 0, spd: 0, lit: 1 };
    this.view = { x: this.K.x, z: this.K.z, yaw: this.K.yaw, mode: 'look', phase: 0, spd: 0 };
    // (5.0e) the map's pieces: in the hands of their seats, the rest on the tables of his round (then the nearest)
    const home = hostP ? this.houses[hostP.hi] : this.houses[first];
    const byNear = this.houses.map((h, i) => [i, Math.hypot(h.x - home.x, h.z - home.z)]).sort((a, b) => a[1] - b[1]).map(([i]) => i);
    const near = [...this.round, ...byNear.filter((i) => !this.round.includes(i))];
    const seats = [...this.players.values()].map((P) => ({ id: P.id, slot: P.slot })).sort((a, b) => a.slot - b.slot);
    this.pieces = piecePlan(seats, near, occ).map((q) => ({ k: q.k, holder: q.holder, at: q.hi === null ? null : tableSpot(this.houses[q.hi]), hi: q.hi }));
    this._papers();
    this.map = new MapOverlay();
    for (const d of g.doors?.list || []) if (this.byId.has(d.id)) { d.open = false; d.ang = 0; d.vel = 0; g.doors._place?.(d); }
    this._placeMe(true);
  }

  dispose() {
    this.body?.dispose();
    this.body = null;
    for (const m of this.papers) { m.removeFromParent(); m.geometry.dispose(); }
    this.papers = [];
    this.map?.hide();
    this.g.hud?.setUse(null);
  }

  // a piece of the map lying somewhere: a folded sheet (in the world's material: a lamp or the echo finds it)
  _papers() {
    const g = this.g;
    for (const q of this.pieces) {
      const b = new MeshBuilder(64);
      b.place(0, 0.006, 0, 0, 0.3 + q.k * 0.7, 0);
      b.box(0.24, 0.012, 0.17, KIND.BONE);
      b.place(0.05, 0.02, 0.02, 0, 0.3 + q.k * 0.7, 0.32);
      b.box(0.12, 0.008, 0.16, KIND.BONE);
      const m = new THREE.Mesh(b.toGeometry(), g.world.material);
      m.frustumCulled = false;
      m.visible = false;
      g.scene?.add(m);
      this.papers[q.k] = m;
    }
  }

  // whose hands hold all four (alive), or null
  _whole() {
    const h = this.pieces[0]?.holder;
    if (!h || this.pieces.length < PIECES || !this.pieces.every((q) => q.holder === h)) return null;
    const P = this.players.get(h);
    return P && P.st !== 'dead' ? h : null;
  }

  // how many pieces these hands hold
  held(id = this.me) {
    return this.pieces.filter((q) => q.holder === id).length;
  }

  // who is in the chapter: me and every friend; anyone new comes to tied in their own house
  _roster() {
    const g = this.g, seed = g.baseSeed || 0;
    const ids = [{ id: this.me, slot: g.player.slot | 0 }];
    for (const r of g.remotes?.values?.() || []) ids.push({ id: r.id, slot: r.slot | 0 });
    for (const { id, slot } of ids) {
      if (this.players.has(id)) continue;
      const hid = houseFor(seed, slot).id, hi = this.byId.get(hid) ?? 0;
      const H = this.houses[hi], door = this._door(hi);
      this.players.set(id, { id, slot, st: 'bound', hi, H, door, seat: seatAt(H, door), meter: 0, caught: 0, creak: 0, tight: 0, spd: 0, px: null, pz: null });
    }
    for (const id of [...this.players.keys()]) if (!ids.some((q) => q.id === id)) this.players.delete(id);
  }

  _door(hi) {
    const H = this.houses[hi];
    return H ? (this.g.doors?.list || []).find((d) => d.id === H.id) || null : null;
  }

  // ---------------- the frame ----------------
  update(dt, raw) {
    const g = this.g;
    this.t += dt;
    this._roster();
    if (g.auth) this._host(dt);
    else this._follow(dt);
    const pev = this._self(dt, raw);
    this._draw(dt);
    this._others();
    this._sound(dt);
    this._hud();
    if (g.role === 'host' && g.sync) {
      this.sendT -= dt;
      if (this.sendT <= 0) {
        this.sendT = 1 / VILLAGE.netHz;
        g.sync.send('vg', this.pack());
      }
    }
    // the end: everyone alive free, and the four pieces of the map in one pair of hands (5.0e); or nobody left
    if (g.auth) {
      const live = [...this.players.values()].filter((P) => P.st !== 'dead');
      const whole = this._whole();
      const out = live.length > 0 && !!whole && live.every((P) => P.st === 'free');
      this.allT = out ? this.allT + dt : 0;
      if (this.allT >= VILLAGE.allT) {
        this.done = true;
        if (g.level2) g.level2.mapHolder = whole; // (the map goes on into chapter 5 in these hands)
      }
      this.deadT = live.length ? 0 : this.deadT + dt;
      if (this.deadT >= VILLAGE.deadT) this.restart = true;
    }
    return pev;
  }

  _indoors(id) {
    const p = this._pl(id);
    return !!p && !!this.g.doors?.indoors(p.x, p.z);
  }

  // ---------------- the host: the keeper and the ropes ----------------
  _host(dt) {
    const g = this.g, K = this.K;
    // how fast everyone moves (for their footsteps)
    for (const P of this.players.values()) {
      const p = this._pl(P.id);
      if (!p) continue;
      if (P.px !== null && dt > 0) P.spd = damp(P.spd, Math.hypot(p.x - P.px, p.z - P.pz) / dt, 6, dt);
      P.px = p.x; P.pz = p.z;
    }
    K.t += dt;
    for (const q of this.pieces) {
      if (!q.holder) continue;
      const P = this.players.get(q.holder), p = this._pl(q.holder);
      if (!P || P.st === 'dead') {
        q.holder = null;
        q.at = p ? { x: p.x, y: this._floor(p.x, p.z) + 0.02, z: p.z } : q.at;
      }
    }
    const free = [...this.players.values()].filter((P) => P.st === 'free');
    // what his lantern shows him (not while his hands are full)
    if (!['carry', 'tie', 'kill'].includes(K.mode)) {
      const blocked = (ax, az, bx, bz) => !!g.doors?.blocks(ax, az, bx, bz);
      for (const P of free) {
        const p = this._pl(P.id);
        if (p && sees(K, p.x, p.z, blocked)) {
          if (K.mode !== 'chase' || K.target !== P.id) this._mode('chase', { target: P.id });
          K.goal = { x: p.x, z: p.z };
          K.lost = 0;
          break;
        }
      }
      // what he hears: running and walking feet (a crouch is silent)
      if (['look', 'walk', 'search', 'leave'].includes(K.mode)) {
        for (const P of free) {
          const p = this._pl(P.id);
          if (!p) continue;
          const kind = p.crouching ? 'crouch' : P.spd > 4.2 ? 'run' : P.spd > 1.5 ? 'walk' : null;
          if (kind && hears(K, p.x, p.z, kind)) { this._mode('search', { goal: { x: p.x, z: p.z } }); break; }
        }
      }
    }
    switch (K.mode) {
      case 'look': {
        K.lit = 1;
        if (K.t >= KEEP.look) this._next();
        break;
      }
      case 'walk': case 'leave': {
        const d = this._door(this.round[K.ri]);
        if (this._move(d ? d.out : this.houses[this.round[K.ri]], KEEP.walk, dt)) {
          if (K.mode === 'leave') { this._next(); break; }
          this._mode('look');
          if (d) K.yaw = yawTo(d.out.x, d.out.z, d.mid.x, d.mid.z);
        }
        break;
      }
      case 'go': {
        // to the house a creak came from: in by the door, to its post
        const P = this.players.get(K.target);
        if (!P) { this._mode('leave'); break; }
        if (this._move(this._postStand(P), KEEP.hurry, dt)) this._mode('check');
        break;
      }
      case 'check': {
        const P = this.players.get(K.target);
        if (P && P.st === 'bound' && !K.did) { K.did = true; P.meter = 0; P.tight++; } // the knots pulled tight again
        if (P) K.yaw = yawTo(K.x, K.z, P.seat.x, P.seat.z);
        if (K.t >= KEEP.check) this._mode('leave', { ri: this.round.indexOf(P ? P.hi : -1) });
        break;
      }
      case 'search': {
        if (K.goal && this._move(K.goal, KEEP.hurry, dt)) K.goal = null;
        if (!K.goal) K.yaw += dt * 1.1; // turning about with the lantern up
        if (K.t >= KEEP.lose + 4) this._mode('leave');
        break;
      }
      case 'chase': {
        const P = this.players.get(K.target), p = P && this._pl(P.id);
        if (!P || P.st !== 'free' || !p) { this._mode('leave'); break; }
        K.lost += dt;
        if (K.lost > 1.6) { this._mode('search', { goal: K.goal }); break; }
        this._move(K.goal || p, KEEP.chase, dt);
        if (Math.hypot(p.x - K.x, p.z - K.z) < KEEP.catchR) this._catch(P);
        break;
      }
      case 'carry': {
        const P = this.players.get(K.target);
        if (!P) { this._mode('leave'); break; }
        if (this._move(this._postStand(P), KEEP.carry, dt)) this._mode('tie');
        break;
      }
      case 'tie': {
        const P = this.players.get(K.target);
        if (P) K.yaw = yawTo(K.x, K.z, P.seat.x, P.seat.z);
        if (K.t >= KEEP.tie) {
          if (P) { P.st = 'bound'; P.meter = 0; P.tight++; }
          this._mode('leave', { ri: this.round.indexOf(P ? P.hi : -1) });
        }
        break;
      }
      case 'kill': {
        // he stands over what he has done, then goes back to his round
        if (K.t >= 2.6) this._mode('leave');
        break;
      }
    }
    // everyone's rope: a captive who tore it is free
    for (const P of this.players.values()) if (P.st === 'bound' && P.meter >= 0.999) { P.st = 'free'; P.meter = 1; }
  }

  _mode(mode, o = {}) {
    const K = this.K;
    K.mode = mode;
    K.t = 0;
    K.did = false;
    if ('target' in o) K.target = o.target;
    if ('goal' in o) K.goal = o.goal ? { x: o.goal.x, z: o.goal.z } : null;
    if (o.ri !== undefined && o.ri >= 0) K.ri = o.ri;
    if (mode === 'chase') K.lost = 0;
  }

  // on to the next house of his round
  _next() {
    const K = this.K;
    K.ri = (K.ri + 1) % this.round.length;
    this._mode('walk');
  }

  // where he stands at a captive's post (beside them, toward the door)
  _postStand(P) {
    const s = P.seat, d = P.door;
    const dx = (d?.mid.x ?? P.H.x) - s.x, dz = (d?.mid.z ?? P.H.z) - s.z, L = Math.hypot(dx, dz) || 1;
    return { x: s.x + (dx / L) * 0.75 + (dz / L) * 0.35, z: s.z + (dz / L) * 0.75 - (dx / L) * 0.35 };
  }

  // a sound from a captive's post: does it bring him?
  _creak(P) {
    const K = this.K;
    P.creak++;
    if (!['look', 'walk', 'search', 'leave'].includes(K.mode)) return;
    if (hears(K, P.H.post.x, P.H.post.z, 'creak')) this._mode('go', { target: P.id });
  }

  _catch(P) {
    P.caught++;
    if (P.caught >= 2) {
      // the second time he does not bother with the rope
      P.st = 'dead';
      this._mode('kill', { target: P.id });
      this._cue('kill:' + P.id);
      return;
    }
    P.st = 'carried';
    this._mode('carry', { target: P.id });
    this._cue('caught:' + P.id);
  }

  // walk toward (tx, tz): by the doorways in and out of houses, round the corners of the others. true: there
  _move(to, speed, dt) {
    const g = this.g, K = this.K;
    if (!to) return true;
    const tx = to.x, tz = to.z;
    const left = Math.hypot(tx - K.x, tz - K.z);
    if (left < 0.4) { K.spd = damp(K.spd, 0, 8, dt); return true; }
    let wp = g.doors?.route(K.x, K.z, tx, tz) || null;
    if (wp && wp.shut) {
      // a shut door in his way: he opens it (and it is heard)
      const d = wp.door;
      if (Math.hypot(d.mid.x - K.x, d.mid.z - K.z) < 1.9) g.doors.force(d, 'creak', g.doors._away(d, K.x, K.z));
    }
    if (!wp) wp = detour(this.houses, K.x, K.z, tx, tz) || { x: tx, z: tz };
    const dx = wp.x - K.x, dz = wp.z - K.z, d = Math.hypot(dx, dz) || 1;
    K.spd = damp(K.spd, speed, 5, dt);
    const step = Math.min(d, K.spd * dt);
    const pos = { x: K.x + (dx / d) * step, z: K.z + (dz / d) * step };
    g.world.col.resolve(pos, KEEP.r);
    K.x = pos.x; K.z = pos.z;
    const want = yawTo(0, 0, dx, dz);
    K.yaw += clamp(angleDiff(K.yaw, want), -4 * dt, 4 * dt);
    K.phase += dt * K.spd * 2.6;
    return false;
  }

  // a guest's rope ('vq': [meter, creaks so far])
  hostStruggle(pid, d) {
    const P = this.players.get(pid);
    if (!P || P.st !== 'bound' || !Array.isArray(d)) return;
    const m = +d[0], c = d[1] | 0;
    if (Number.isFinite(m)) P.meter = clamp(m, 0, 1);
    for (let k = 0; (P.creakSeen ?? 0) < c && k < 8; k++) { P.creakSeen = (P.creakSeen ?? 0) + 1; this._creak(P); }
    P.creakSeen = Math.max(P.creakSeen ?? 0, c);
  }

  // a guest finished untying someone ('vu'); the host checks they were at the post
  hostUntie(id, by) {
    const P = this.players.get(id), q = this._pl(by);
    if (!P || P.st !== 'bound' || !q) return;
    if (Math.hypot(q.x - P.seat.x, q.z - P.seat.z) > ROPE.untieR + 1.2) return;
    P.st = 'free';
    P.meter = 1;
  }

  // (5.0e) a piece off a table, or all of one's pieces to a friend ('vp': ['take', k] | ['give', id]); the host
  // checks they were there
  hostPiece(pid, d) {
    if (!Array.isArray(d)) return false;
    const P = this.players.get(pid), p = this._pl(pid);
    if (!P || P.st !== 'free' || !p) return false;
    if (d[0] === 'take') {
      const q = this.pieces.find((x) => x.k === (d[1] | 0));
      if (!q || q.holder || !q.at || Math.hypot(q.at.x - p.x, q.at.z - p.z) > PIECE.takeR + 1) return false;
      q.holder = pid;
      q.at = null;
      this._cue('take:' + pid + ':' + q.k);
      return true;
    }
    if (d[0] === 'give') {
      const Q = this.players.get(d[1]), to = this._pl(d[1]);
      if (!Q || Q.st !== 'free' || !to || Q.id === pid || Math.hypot(to.x - p.x, to.z - p.z) > PIECE.giveR + 1) return false;
      let n = 0;
      for (const q of this.pieces) if (q.holder === pid) { q.holder = Q.id; n++; }
      if (n) this._cue('give:' + Q.id + ':' + pid + ':' + this.t.toFixed(1));
      return n > 0;
    }
    return false;
  }

  // ---------------- the wire ----------------
  pack() {
    const r2 = (v) => Math.round(v * 100) / 100, K = this.K;
    return {
      k: [r2(K.x), r2(K.z), r2(K.yaw), MODES.indexOf(K.mode), r2(K.spd), K.target || ''],
      p: [...this.players.values()].map((P) => [P.id, STATES.indexOf(P.st), P.hi, r2(P.meter), P.caught, P.creak, P.tight]),
      c: [...this.cues],
      m: this.pieces.map((q) => [q.holder || '', q.at ? r2(q.at.x) : 0, q.at ? r2(q.at.y) : 0, q.at ? r2(q.at.z) : 0]),
    };
  }

  applyVillage(d) {
    if (!d || !Array.isArray(d.k) || !Array.isArray(d.p)) return;
    this.net = d;
    const [x, z, yaw, mi, spd, target] = d.k;
    const K = this.K;
    if (K && [x, z, yaw].every(Number.isFinite)) {
      K.tx = x; K.tz = z; K.tyaw = yaw;
      K.mode = MODES[mi] || 'walk';
      K.spdNet = +spd || 0;
      K.target = target || null;
    }
    for (const e of d.p) {
      if (!Array.isArray(e)) continue;
      const P = this.players.get(e[0]);
      if (!P) continue;
      const st = STATES[e[1]] || 'bound';
      if (st !== P.st) { if (e[0] === this.me && st === 'bound' && P.st !== 'bound') this.local.meter = 0; P.st = st; }
      if ((e[2] | 0) !== P.hi && this.houses[e[2] | 0]) { P.hi = e[2] | 0; P.H = this.houses[P.hi]; P.door = this._door(P.hi); P.seat = seatAt(P.H, P.door); }
      if (e[0] !== this.me) P.meter = +e[3] || 0;
      P.caught = e[4] | 0;
      if ((e[5] | 0) > P.creak) { P.creak = e[5] | 0; if (e[0] !== this.me) this._cueSound('creak', P); }
      if ((e[6] | 0) !== P.tight) { P.tight = e[6] | 0; if (e[0] === this.me) this.local.meter = 0; }
    }
    for (const c of d.c || []) this.cues.add(c);
    if (Array.isArray(d.m)) d.m.forEach((e, k) => {
      const q = this.pieces[k];
      if (!q || !Array.isArray(e)) return;
      q.holder = e[0] || null;
      q.at = q.holder ? null : { x: +e[1] || 0, y: +e[2] || 0, z: +e[3] || 0 };
    });
  }

  // a guest: the keeper glides to where the host has him
  _follow(dt) {
    const K = this.K;
    if (!K || K.tx === undefined) return;
    const d = Math.hypot(K.tx - K.x, K.tz - K.z);
    if (d > 6) { K.x = K.tx; K.z = K.tz; } else { K.x = damp(K.x, K.tx, 8, dt); K.z = damp(K.z, K.tz, 8, dt); }
    K.yaw += angleDiff(K.yaw, K.tyaw) * clamp(dt * 8, 0, 1);
    K.spd = damp(K.spd, K.spdNet || 0, 6, dt);
    K.phase += dt * K.spd * 2.6;
  }

  // ---------------- you ----------------
  _self(dt, raw) {
    const g = this.g, p = g.player, P = this.mine;
    const look = g.inputMuted ? NO_LOOK : raw?.look || NO_LOOK;
    if (!P) return null;
    if (P.st === 'free') {
      const pev = p.update(dt, g.input, look, g.inputMuted || g.inventory?.active);
      p.roll = damp(p.roll || 0, 0, 4, dt);
      this._interact(dt, raw);
      this._map();
      return pev;
    }
    g.hud.setUse(null);
    this.map?.hide();
    p.vx = p.vz = 0;
    p.speed = 0;
    p.sprinting = false;
    p.crouching = false;
    p.bobY = 0;
    if (P.st === 'bound') {
      this._placeMe(false, look, dt);
      this._struggle(dt);
    } else if (P.st === 'carried') {
      // over his shoulder, head down his back: you can only look about
      const K = this.K, bx = Math.sin(K.yaw), bz = Math.cos(K.yaw);
      p.x = K.x + bx * 0.45;
      p.z = K.z + bz * 0.45;
      p.y = this._floor(p.x, p.z) + 0.55;
      p.eyeCur = damp(p.eyeCur, 1.0, 6, dt);
      p.yaw -= look.dx;
      p.pitch = clamp(p.pitch - look.dy, -1.2, 0.4);
      p.yaw = K.yaw + Math.PI + clamp(angleDiff(K.yaw + Math.PI, p.yaw), -1.6, 1.6);
      p.roll = Math.sin(this.t * 4.4) * 0.12;
    } else if (P.st === 'dead') {
      p.eyeCur = damp(p.eyeCur, 0.35, 3, dt);
      p.roll = damp(p.roll || 0, 0.9, 2, dt);
      g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(0, 1.6, this.deadClock = (this.deadClock || 0) + dt) * 0.8);
    }
    return null;
  }

  // TAB: what you have of the map, held up (hands free only)
  _map() {
    const g = this.g, have = [0, 1, 2, 3].map((k) => this.pieces[k]?.holder === this.me);
    const want = have.some(Boolean) && !g.inputMuted && !!g.input?.peekHeld;
    this.mapOpen = want;
    this.map?.show(want, (ctx, S) => drawBogMap(ctx, S, have, g.player, this.houses));
  }

  _floor(x, z) {
    const w = this.g.world;
    return w.walkHeight?.(x, z) ?? w.terrain.height(x, z);
  }

  // sitting against the post: where, and how far you can turn your head
  _placeMe(first, look = NO_LOOK, dt = 0) {
    const g = this.g, p = g.player, P = this.mine;
    if (!P) return;
    const s = P.seat;
    p.x = s.x;
    p.z = s.z;
    p.y = this._floor(s.x, s.z);
    if (first) {
      p.yaw = s.yaw;
      p.pitch = -0.1;
      p.eyeCur = 0.98;
    } else {
      p.eyeCur = damp(p.eyeCur, 0.98, 6, dt);
      p.yaw -= look.dx;
      p.pitch = clamp(p.pitch - look.dy, -0.9, 0.9);
      p.yaw = s.yaw + clamp(angleDiff(s.yaw, p.yaw), -1.3, 1.3);
      p.roll = damp(p.roll || 0, 0.04, 4, dt);
    }
  }

  // A, then D: the rope gives a little; every pull creaks
  _struggle(dt) {
    const g = this.g, P = this.mine, L = this.local;
    let hits = 0;
    if (!g.inputMuted) {
      const sx = g.input?.move ? g.input.move.x : 0;
      const sign = sx > 0.5 ? 1 : sx < -0.5 ? -1 : 0;
      if (sign && this.lastSign && sign !== this.lastSign) hits++;
      if (sign) this.lastSign = sign;
      if (g.input?.touch && (g.events || []).includes('pingDown')) hits++;
    }
    L.meter = ropeStep(L.meter, hits, dt);
    this.creakT -= dt;
    if (hits && this.creakT <= 0) {
      this.creakT = ROPE.creakEvery;
      L.creak++;
      g.audio?.ropeCreak?.(P.H.post.x, this._floor(P.H.post.x, P.H.post.z) + 1, P.H.post.z, 1);
      if (g.auth) this._creak(P);
    }
    if (g.auth) P.meter = L.meter;
    else if (g.coop) {
      L.sendT -= dt;
      if (L.sendT <= 0 && (Math.abs(L.meter - L.sentM) > 0.004 || L.creak !== L.sentC)) {
        L.sendT = 0.18;
        L.sentM = L.meter;
        L.sentC = L.creak;
        g.coop.toHost('vq', [Math.round(L.meter * 1000) / 1000, L.creak]);
      }
    }
  }

  // free: a door (E), a friend's rope (hold E)
  _interact(dt, raw) {
    const g = this.g, p = g.player, ev = raw?.events || [];
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    let best = null, bd = Infinity;
    for (const P of this.players.values()) {
      if (P.id === this.me || P.st !== 'bound') continue;
      const d = Math.hypot(P.seat.x - p.x, P.seat.z - p.z);
      if (d < ROPE.untieR && d < bd) { bd = d; best = { kind: 'rope', P }; }
    }
    if (!best) {
      for (const q of this.pieces) {
        if (q.holder || !q.at) continue;
        const d = Math.hypot(q.at.x - p.x, q.at.z - p.z);
        if (d < PIECE.takeR && d < bd) { bd = d; best = { kind: 'piece', q }; }
      }
    }
    if (!best && this.held() > 0) {
      for (const P of this.players.values()) {
        if (P.id === this.me || P.st !== 'free') continue;
        const q = this._pl(P.id);
        const d = q ? Math.hypot(q.x - p.x, q.z - p.z) : Infinity;
        if (d < PIECE.giveR && d < bd) { bd = d; best = { kind: 'give', P }; }
      }
    }
    if (!best) {
      g.doors?.consider((d, x, z, r) => {
        const dx = x - p.x, dz = z - p.z, dd = Math.hypot(dx, dz);
        if (dd > r || dd > bd) return;
        if (dd > 0.6 && (dx * fx + dz * fz) / dd < 0.2) return; // (in front of you)
        bd = dd;
        best = { kind: 'door', d };
      });
    }
    if (!best) { this.untieT = 0; g.hud.setUse(null); return; }
    if (best.kind === 'piece') {
      this.untieT = 0;
      g.hud.setUse(t('usePiece'), 0, true);
      if (ev.includes('useDown')) {
        if (g.auth) this.hostPiece(this.me, ['take', best.q.k]);
        else g.coop?.toHost('vp', ['take', best.q.k]);
      }
      return;
    }
    if (best.kind === 'give') {
      this.untieT = 0;
      g.hud.setUse(t('useGiveMap').replace('{name}', g.nameOf(this._pl(best.P.id) || best.P.id)), 0, true);
      if (ev.includes('useDown')) {
        if (g.auth) this.hostPiece(this.me, ['give', best.P.id]);
        else g.coop?.toHost('vp', ['give', best.P.id]);
      }
      return;
    }
    if (best.kind === 'door') {
      this.untieT = 0;
      g.hud.setUse(t(g.doors.prompt(best.d)), 0, true);
      if (ev.includes('useDown')) g.doors.use(best.d);
      return;
    }
    const P = best.P;
    if (g.input?.useHeld) {
      this.untieT += dt;
      if (Math.random() < dt * 3) g.audio?.ropeRub?.(P.H.post.x, p.y + 0.8, P.H.post.z);
      if (this.untieT >= ROPE.untie) {
        this.untieT = 0;
        g.audio?.ropeTie?.(P.H.post.x, p.y + 0.8, P.H.post.z, 0.5);
        if (g.auth) this.hostUntie(P.id, this.me);
        else g.coop?.toHost('vu', P.id);
      }
    } else this.untieT = Math.max(0, this.untieT - dt * 2);
    g.hud.setUse(t('useUntie').replace('{name}', g.nameOf(this._pl(P.id) || P.id)), Math.min(1, this.untieT / ROPE.untie), true);
  }

  // ---------------- drawing ----------------
  _draw(dt) {
    for (const q of this.pieces) {
      const m = this.papers[q.k];
      if (!m) continue;
      m.visible = !q.holder && !!q.at;
      if (m.visible) m.position.set(q.at.x, q.at.y, q.at.z);
    }
    const K = this.K, b = this.body;
    if (!K || !b) return;
    const y = this._floor(K.x, K.z);
    b.place(K.x, y, K.z, K.yaw);
    const m = K.mode;
    this.raise = damp(this.raise || 0, m === 'look' || m === 'search' || m === 'check' ? 1 : 0, 3, dt);
    this.kneel = damp(this.kneel || 0, m === 'check' || m === 'tie' ? 1 : 0, 4, dt);
    b.pose({ phase: K.phase, speed: K.spd, raise: this.raise, carry: m === 'carry', kneel: this.kneel, t: this.t });
    if (m === 'kill') {
      // the lantern down, the other hand up — and down
      const n = b.rig.nodes, k = clamp(K.t / 1.3, 0, 1); // (the blow lands as the chapter's death cue does)
      n.shR.rotation.set(-0.4 - Math.min(1, k / 0.75) * 2.2 + (k > 0.85 ? 2.4 : 0), 0, 0.15);
    }
    // the danger the picture feels: his light close
    const p = this.g.player, d = Math.hypot(K.x - p.x, K.z - p.z);
    this.danger = clamp(1 - (d - 3) / (m === 'chase' ? 26 : 16), 0, 1) * (m === 'chase' ? 1 : 0.6);
  }

  // friends drawn the way they are: in their rope, over his shoulder, down
  _others() {
    const g = this.g;
    for (const r of g.remotes?.values?.() || []) {
      const P = this.players.get(r.id);
      if (!P || !r.rig) continue;
      const root = r.rig.root;
      if (P.st === 'bound') {
        poseBound(r.rig, this.t + (r.seed || 0), 0);
        root.position.set(P.seat.x, this._floor(P.seat.x, P.seat.z), P.seat.z);
        root.rotation.set(0, P.seat.yaw + Math.PI, 0);
      } else if (P.st === 'carried') {
        const K = this.K, yaw = K.yaw, rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        poseCarried(r.rig, Math.sin(K.phase) * 0.6);
        root.position.set(K.x - rx * 0.24 + fx * 0.1, this._floor(K.x, K.z) + 1.56 * 1.2, K.z - rz * 0.24 + fz * 0.1);
        root.rotation.set(0, yaw, 0);
      } else if (P.st === 'dead') {
        poseSprawled(r.rig, 1);
      }
    }
  }

  // ---------------- sound ----------------
  _cue(key) {
    this.cues.add(key);
    if (this.cues.size > 24) this.cues.delete(this.cues.values().next().value);
  }

  _cueSound(kind, P) {
    const au = this.g.audio;
    if (kind === 'creak' && P) au?.ropeCreak?.(P.H.post.x, this._floor(P.H.post.x, P.H.post.z) + 1, P.H.post.z, 0.9);
  }

  _sound(dt) {
    const g = this.g, au = g.audio, K = this.K, b = this.body;
    if (!au || !K) return;
    // his boots on every stride, the bail of his lantern now and then
    const step = Math.floor(K.phase / Math.PI);
    if (step !== this.lastStep) {
      if (this.lastStep !== undefined && K.spd > 0.3) au.keeperStep?.(K.x, this._floor(K.x, K.z), K.z, clamp(K.spd / 3, 0.5, 1.2));
      this.lastStep = step;
    }
    this.squeakT = (this.squeakT ?? 2) - dt * (K.spd > 0.3 ? 1 : 0.3);
    if (this.squeakT <= 0) {
      this.squeakT = 2.2 + Math.random() * 3;
      const L = b.lanternPos();
      au.lanternSqueak?.(L.x, L.y, L.z);
    }
    // what happened to someone: once, here and on every guest
    for (const c of this.cues) {
      if (this.heard?.has(c)) continue;
      (this.heard ||= new Set()).add(c);
      const [kind, id] = c.split(':');
      const mine = id === this.me;
      if (kind === 'take' || kind === 'give') {
        // a piece of paper changing hands
        const who = this._pl(id);
        if (who) au.paperRustle?.(who.x, (who.y || 0) + 1.1, who.z);
        if (mine) g.hud.flashAlert?.(t(kind === 'take' ? 'villageGotPiece' : 'villageGotMap').replace('{n}', this.held()).replace('{m}', PIECES), 'info', 1.6);
      } else if (kind === 'caught') {
        g.addTrauma?.(mine ? 0.7 : 0.2);
        au.koThud?.(K.x, this._floor(K.x, K.z) + 1.2, K.z, mine ? 1.2 : 0.6);
        if (mine) { g.hud.setIntro(t('villageCaught'), t('villageCaughtS')); this.introT = this.t; }
      } else if (kind === 'kill') {
        au.cleaverStrike?.(K.x, this._floor(K.x, K.z) + 1, K.z, mine ? 1.2 : 0.7);
        if (mine) {
          g.addTrauma?.(1);
          g.fx.white = Math.max(g.fx.white, 0.4);
          g.hud.setIntro(t('villageKilled'), t(this.players.size > 1 ? 'villageWait' : 'l2Again'));
          this.introT = this.t;
        }
      }
    }
  }

  _hud() {
    const g = this.g, P = this.mine;
    if (!P) return;
    if (this.introT !== undefined && this.t - this.introT > 4 && P.st !== 'dead') { g.hud.setIntro(null); this.introT = undefined; }
    if (P.st === 'bound') {
      const K = this.K, near = K && Math.hypot(K.x - P.H.post.x, K.z - P.H.post.z) < 20;
      g.hud.setUse(t(g.input?.touch ? 'villageTiedTouch' : 'villageTied'), this.local.meter, true);
      if (this.t > 5.2) g.hud.setHint(t(near ? 'villageNear' : 'villageWork'));
    } else if (P.st === 'carried') g.hud.setHint(t('villageCarried'));
    else if (P.st === 'free') {
      if (this.mapOpen) { g.hud.setHint(null); return; }
      const others = [...this.players.values()].some((q) => q.id !== this.me && q.st === 'bound');
      const whole = this._whole();
      const n = this.held();
      if (others) g.hud.setHint(t('villageFind'));
      else if (whole) g.hud.setHint(whole === this.me ? t('villageMapDone') : t('villageMapWith').replace('{name}', g.nameOf(this._pl(whole) || whole)));
      else g.hud.setHint(t(n ? 'villagePieces' : 'villageNoPiece').replace('{n}', n).replace('{m}', PIECES));
    } else g.hud.setHint(null);
  }

  // the small lights: the moon over the village, his lantern
  lightSources(out) {
    out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I * 0.8, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    const L = this.body?.light(this.t);
    if (L) out.push(L);
  }

  applyCamera() {
    return false;
  }
}

