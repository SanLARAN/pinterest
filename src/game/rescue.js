// Co-op: going down, and being brought back.
//
// Caught, a player doesn't die on the spot: they go down where they fell and slowly bleed out — four
// minutes the first time, less each time after. Nobody is told how long they have. Kneel by them and feel
// for a pulse (hold E): then you know — and you have to feel again to know again. Lift them onto your
// shoulder (R) — slow going, no running, every step louder — and carry them to the scouts' first-aid hut
// by the camp. Lay them on its cot (R there) and work on them for a few seconds (hold E): they come back.
// Anywhere else, they can't.
//
// The host keeps the clocks: who is down and until when, who carries whom, who is back. Everyone else asks.
//   host → all    'ki'  [..., bleed]          someone went down (bleed: the seconds they have)
//                 'cu'  [body, carrier]       someone lifted someone
//                 'rv'  [body, x, z, yaw, by] someone is back on their feet
//                 'bo'  [body]                someone bled out
//   carrier → all 'cd'  [body, x, z, onCot]   put down (on the cot, or on the ground)
//   guest → host  'rc'  body                  "let me lift them"
//                 'rr'  body                  "they're breathing — confirm"
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { poseCarried, poseLying } from './survivor.js';

const RV = CFG.REVIVE;
const fmt = (s) => {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
};

export class Rescue {
  constructor(game) {
    this.g = game;
    this.reset();
  }

  reset() {
    this.pulseT = 0;
    this.pulseFor = null;
    this.pulseDone = false;
    this.reviveT = 0;
    this.cprT = 0;
    this.askT = 0;
    this.waitRv = 0;
    this.beaconT = 0;
    this.cotId = null;
    this.hinted = {};
  }

  // a new night: everyone whole
  resetPlayer(p) {
    p.downs = 0;
    p.bleedEnd = 0;
    p.gone = false;
    p.consumed = false; // (the шкафандр leaves nothing to carry)
    p.carriedBy = null;
    p.carrying = null;
    p.onCot = false;
  }

  get hut() {
    return this.g.medhut;
  }

  // everyone who is down right now
  downed() {
    const g = this.g;
    const out = [];
    if (!g.online) return out;
    if (!g.player.alive) out.push(g.player);
    for (const r of g.remotes.values()) if (!r.alive) out.push(r);
    return out;
  }

  bleedFor(p) {
    return RV.bleed[Math.min(p.downs | 0, RV.bleed.length - 1)];
  }

  timeLeft(p) {
    return p.gone ? 0 : Math.max(0, p.bleedEnd - this.g.time);
  }

  floorY(x, z) {
    const g = this.g;
    return g.world.terrain.height(x, z) + (g.doors && g.doors.indoors(x, z) ? 0.2 : 0);
  }

  // ---------------- going down (every machine: the host announced it) ----------------
  down(p, bleed) {
    const g = this.g;
    p.bleed = bleed;
    p.bleedEnd = g.time + bleed;
    p.gone = false;
    p.onCot = false;
    p.downs = (p.downs | 0) + 1;
    // whoever was on their shoulder falls with them
    if (p.carrying) {
      const b = g.playerById(p.carrying);
      p.carrying = null;
      if (b && !b.alive) this.place(b, null, p.x, p.z, false);
    }
    if (p.carriedBy) {
      const c = g.playerById(p.carriedBy);
      if (c && c.carrying === p.id) c.carrying = null;
      p.carriedBy = null;
    }
    if (this.cotId === p.id) this.cotId = null;
    if (g.escape) {
      g.escape.onDown(p); // (knocked out of the УАЗ's seat: they fall by its door)
      g.escape.dropFor(p.id, p.x, p.z); // a part in their arms falls where they fell
    }
    if (g.glows) g.glows.dropFor(p.id, p.x, p.z);
  }

  // someone left the night: whatever they carried falls, whoever carried them has empty hands
  left(p) {
    const g = this.g;
    if (p.carrying) {
      const b = g.playerById(p.carrying);
      p.carrying = null;
      if (b && !b.alive) this.place(b, null, p.x, p.z, false);
    }
    if (p.carriedBy) {
      const c = g.playerById(p.carriedBy);
      if (c && c.carrying === p.id) c.carrying = null;
    }
    if (this.cotId === p.id) this.cotId = null;
  }

  // the host: anybody's time up?
  hostTick() {
    const g = this.g;
    if (!g.auth || !g.online) return;
    for (const p of this.downed()) {
      if (p.gone || g.time < p.bleedEnd) continue;
      p.gone = true;
      g.sync.ev('bo', p.id);
      this._gone(p);
    }
  }

  netGone(id) {
    const p = this.g.playerById(id);
    if (!p || p.alive || p.gone) return;
    p.gone = true;
    this._gone(p);
  }

  _gone(p) {
    const g = this.g;
    if (p === g.player) g.hud.popup(t('youGone'), 'dim'); // (nobody else is told: they'd have to feel for it)
    if (this.waitRv > 0 && this.cotId === p.id) {
      this.waitRv = 0;
      g.hud.pulse(t('reviveLate'), 'none');
    }
  }

  // ---------------- lifting ----------------
  // R: lift whoever is down in front of you — or put down whoever is on your shoulder (on the cot, if
  // you're at it)
  carryKey() {
    const g = this.g, p = g.player;
    if (!g.online || !p.alive || (g.state !== 'play' && g.state !== 'dawn')) return;
    if (p.carrying) {
      this.putDown();
      return;
    }
    const b = this.liftTarget();
    if (!b) return;
    if (g.escape && g.escape.held) return;
    if (g.auth) this.grant(b.id, p.id);
    else if (this.askT <= 0) {
      g.coop.toHost('rc', b.id);
      this.askT = 0.8;
    }
  }

  // who R would lift: the nearest body in front of you (on the ground or on the cot)
  liftTarget() {
    const g = this.g, p = g.player, f = p.forward();
    let best = null, bd = 1e9;
    for (const b of this.downed()) {
      if (b === p || b.carriedBy || b.consumed) continue;
      const dx = b.x - p.x, dz = b.z - p.z, d = Math.hypot(dx, dz);
      if (d > RV.pick) continue;
      const facing = d < 0.9 ? 1 : (dx * f.x + dz * f.z) / d;
      if (facing < 0) continue;
      const sc = d * (1.6 - facing);
      if (sc < bd) {
        bd = sc;
        best = b;
      }
    }
    return best;
  }

  // the host: may this one lift that one?
  grant(bodyId, carrierId) {
    const g = this.g;
    const b = g.playerById(bodyId), c = g.playerById(carrierId);
    if (!b || !c || b === c || b.alive || !c.alive || b.carriedBy || c.carrying) return;
    if (g.escape && g.escape.heldBy(carrierId)) return; // (arms full)
    if (Math.hypot(b.x - c.x, b.z - c.z) > RV.pick + 1.5) return;
    this.lift(b, c);
    g.sync.ev('cu', bodyId, carrierId);
  }

  netLift(bodyId, carrierId) {
    const g = this.g;
    this.lift(g.playerById(bodyId), g.playerById(carrierId));
  }

  // (every machine) c lifts b onto their shoulder
  lift(b, c) {
    const g = this.g;
    if (!b || !c || b.alive || !c.alive) return;
    if (b.carriedBy) {
      const o = g.playerById(b.carriedBy);
      if (o) o.carrying = null;
    }
    b.carriedBy = c.id;
    b.onCot = false;
    if (this.cotId === b.id) this.cotId = null;
    if (g.escape) g.escape.onLifted(b);
    c.carrying = b.id;
    const me = g.player;
    g.audio.bodyLift(c.x, c.y + 1.2, c.z, c === me);
    if (c === me) {
      this.beaconT = 1.2;
      this.pulseFor = null;
      g.addTrauma(0.1);
      if (!this.hinted.carry) {
        this.hinted.carry = true;
        g.hud.setHint(t(g.input.touch ? 'hintCarryTouch' : 'hintCarry'));
        g.timeline.push({ at: g.time + 7, fn: () => g.hud.setHint(null) });
      }
    } else if (b === me && g.spectate) {
      g.spectate.target = c; // over a friend's shoulder: you see what they see
      g.spectLabel = null;
    }
  }

  cotTaken() {
    const id = this.cotId;
    if (!id) return false;
    const b = this.g.playerById(id);
    return !!b && !b.alive && b.onCot;
  }

  atCot(p) {
    const h = this.hut;
    return !!(h && h.cot && h.cotDist(p.x, p.z) < RV.cot);
  }

  // R again: down here — or on the cot, if you're at it and it's free
  putDown() {
    const g = this.g, p = g.player;
    const b = g.playerById(p.carrying);
    if (!b || b.alive) {
      p.carrying = null;
      return;
    }
    const onCot = this.atCot(p) && !this.cotTaken();
    let x, z;
    if (onCot) {
      const cp = this.hut.cotPose();
      x = cp.x;
      z = cp.z;
    } else {
      const f = p.forward();
      const pos = { x: p.x + f.x * 0.75, z: p.z + f.z * 0.75 };
      g.world.col.resolve(pos, 0.3);
      x = pos.x;
      z = pos.z;
    }
    this.place(b, p, x, z, onCot);
    if (g.sync) g.sync.ev('cd', b.id, +x.toFixed(2), +z.toFixed(2), onCot ? 1 : 0);
  }

  netPlace(carrierId, bodyId, x, z, onCot) {
    const g = this.g;
    const b = g.playerById(bodyId);
    if (!b || !Number.isFinite(x) || !Number.isFinite(z)) return;
    this.place(b, g.playerById(carrierId), x, z, onCot);
  }

  // (every machine) b is put down at (x, z): on the cot, or on the ground
  place(b, c, x, z, onCot) {
    const g = this.g;
    if (c && c.carrying === b.id) c.carrying = null;
    if (b.carriedBy) {
      const o = g.playerById(b.carriedBy);
      if (o && o.carrying === b.id) o.carrying = null;
    }
    b.carriedBy = null;
    if (b.alive) return;
    b.onCot = !!onCot && !!this.hut;
    if (b.onCot) {
      const cp = this.hut.cotPose();
      b.x = cp.x;
      b.z = cp.z;
      b.yaw = cp.yaw;
      this.cotId = b.id;
    } else {
      b.x = x;
      b.z = z;
      if (c) b.yaw = c.yaw;
      if (this.cotId === b.id) this.cotId = null;
    }
    b.y = this.floorY(b.x, b.z);
    g.audio.bodyDrop(b.x, b.y + 0.4, b.z, b.onCot);
    if (b === g.player) g.spectLabel = null;
    if (c === g.player && b.onCot && !this.hinted.cot) {
      this.hinted.cot = true;
      g.hud.setHint(t(g.input.touch ? 'hintCotTouch' : 'hintCot'));
      g.timeline.push({ at: g.time + 7, fn: () => g.hud.setHint(null) });
    }
  }

  // ---------------- E: a pulse, the cot ----------------
  // what the E prompt can find (Objectives._interact)
  consider(fn) {
    const g = this.g;
    if (!g.online) return;
    const me = g.player;
    for (const b of this.downed()) {
      if (b === me || b.carriedBy || b.onCot || b.consumed) continue;
      fn(b, b.x, b.z, RV.pick, 'mate');
    }
    const h = this.hut;
    if (h && h.cot && this.cotTaken()) {
      const b = g.playerById(this.cotId);
      fn(b, h.cot.x, h.cot.z, RV.cot, 'cot');
    }
  }

  // per frame while E points at someone who's down ('mate') or at the cot with someone on it ('cot')
  interact(best, dt, held, still, T) {
    const g = this.g, hud = g.hud, b = best.obj;
    if (best.kind === 'mate') {
      this.reviveT = 0;
      if (this.pulseFor !== b) {
        this.pulseFor = b;
        this.pulseT = 0;
        this.pulseDone = false;
      }
      if (!held) {
        this.pulseT = 0;
        this.pulseDone = false; // let go: feel again to know again
      } else if (still && !this.pulseDone) this.pulseT += dt;
      hud.setUse(`${T('usePulse')} · ${T('useLift')}`, this.pulseDone ? 1 : this.pulseT / RV.pulse, true);
      if (!this.pulseDone && this.pulseT >= RV.pulse) {
        this.pulseDone = true;
        this.feelPulse(b);
      }
      return;
    }
    // the cot
    this.pulseFor = null;
    if (this.waitRv > 0) {
      hud.setUse(t('useReviveWait'), 1, false);
      return;
    }
    const working = held && still;
    if (working) this.reviveT += dt;
    else this.reviveT = Math.max(0, this.reviveT - dt * 1.5);
    hud.setUse(`${T('useRevive')} · ${T('useLift')}`, this.reviveT / RV.revive, true);
    if (working) {
      this.cprT -= dt;
      if (this.cprT <= 0) {
        this.cprT = 0.55;
        const c = this.hut.cot;
        g.audio.cprPush(c.x, c.y, c.z);
        g.playerNoise(g.player.x, g.player.z, RV.work, 'repair');
        g.addTrauma(0.02);
      }
    } else this.cprT = 0;
    if (this.reviveT >= RV.revive) {
      this.reviveT = 0;
      if (b.gone || this.timeLeft(b) <= 0) {
        hud.pulse(t('reviveLate'), 'none');
        g.audio.pulseFelt(0);
        return;
      }
      if (g.auth) this.hostRevive(b.id, g.player.id);
      else {
        g.coop.toHost('rr', b.id);
        this.waitRv = 3;
      }
    }
  }

  idle() {
    this.pulseFor = null;
    this.pulseT = 0;
    this.pulseDone = false;
    this.reviveT = 0;
  }

  // what your fingers find on their neck
  feelPulse(b) {
    const g = this.g;
    const left = this.timeLeft(b);
    if (left <= 0) {
      g.hud.pulse(t('pulseNone'), 'none');
      g.audio.pulseFelt(0);
      return;
    }
    const word = left > 100 ? 'pulseSteady' : left > 40 ? 'pulseWeak' : 'pulseFaint';
    g.hud.pulse(`${t(word)} · ${t('pulseLeft').replace('{t}', fmt(left))}`, left > 40 ? 'ok' : 'low');
    g.audio.pulseFelt(left > 100 ? 1 : left > 40 ? 0.6 : 0.3);
  }

  // ---------------- back ----------------
  hostRevive(bodyId, reviverId) {
    const g = this.g;
    const b = g.playerById(bodyId), rv = g.playerById(reviverId);
    if (!b || b.alive || !b.onCot || b.gone || g.time >= b.bleedEnd || !rv || !rv.alive || !this.hut) return;
    const s = this.hut.standPose();
    this.revive(b, s.x, s.z, s.yaw, reviverId);
    g.sync.ev('rv', bodyId, +s.x.toFixed(2), +s.z.toFixed(2), +s.yaw.toFixed(3), reviverId);
  }

  netRevive(bodyId, x, z, yaw, reviverId) {
    const g = this.g;
    const b = g.playerById(bodyId);
    if (!b || ![x, z, yaw].every(Number.isFinite)) return;
    this.revive(b, x, z, yaw, reviverId);
  }

  // (every machine) b breathes again, on their feet beside the cot
  revive(b, x, z, yaw, reviverId) {
    const g = this.g;
    if (b.alive) return;
    if (this.cotId === b.id) this.cotId = null;
    if (b.carriedBy) {
      const c = g.playerById(b.carriedBy);
      if (c && c.carrying === b.id) c.carrying = null;
    }
    b.carriedBy = null;
    b.onCot = false;
    b.gone = false;
    const c = this.hut ? this.hut.cot : { x, y: g.world.terrain.height(x, z), z };
    g.audio.reviveGasp(c.x, c.y + 0.25, c.z, b === g.player);
    if (b === g.player) g.reviveLocal(x, z, yaw);
    else {
      b.revive(x, z, yaw);
      g.hud.popup(t('mateRevived').replace('{name}', g.nameOf(b.id)), 'cyan');
    }
    if (reviverId === g.player.id && b !== g.player) {
      const pts = Math.round(CFG.SCORE.revive * g.mult);
      g.score += pts;
      g.stats.revives = (g.stats.revives | 0) + 1;
      g.hud.popup(`+${pts} ${t('popRevive')}`, 'amber');
    }
    this.reviveT = 0;
    this.waitRv = 0;
    if (g.auth) g.teamOverAt = 0;
  }

  // ---------------- per frame ----------------
  update(dt) {
    const g = this.g;
    if (!g.online) return;
    this.askT -= dt;
    if (this.waitRv > 0) this.waitRv -= dt;
    this.hostTick();
    const p = g.player;
    if (p.alive && p.carrying) {
      const b = g.playerById(p.carrying);
      if (!b || b.alive) p.carrying = null;
      else {
        b.x = p.x;
        b.z = p.z;
        b.y = p.y;
        // the hut's radio-beacon tick: which way the cot is
        this.beaconT -= dt;
        const h = this.hut;
        if (this.beaconT <= 0 && h && h.cot) {
          const d = h.cotDist(p.x, p.z);
          this.beaconT = d < 12 ? 1.8 : 2.6;
          if (d > 2.2) {
            const dx = h.cot.x - p.x, dz = h.cot.z - p.z;
            const f = p.forward();
            g.hud.beacon(Math.atan2(dx * -f.z + dz * f.x, dx * f.x + dz * f.z), d, 'med');
            g.radar.blip(h.cot.x, h.cot.z, 'beacon');
          }
        }
      }
    }
    // you, down: your body goes where it's carried; your eyes follow whoever carries you
    if (!p.alive && p.carriedBy) {
      const c = g.playerById(p.carriedBy);
      if (c) {
        p.x = c.x;
        p.z = c.z;
        if (g.spectate && g.spectate.target !== c) {
          g.spectate.target = c;
          g.spectLabel = null;
        }
      }
    }
  }

  // a teammate who's down, drawn where they are: over someone's shoulder, or on the cot.
  // (returns false for a body simply lying where it fell — the default pose)
  poseBody(r) {
    const g = this.g;
    const root = r.rig.root;
    if (r.carriedBy) {
      const c = g.playerById(r.carriedBy);
      if (!c) return false;
      const yaw = c.yaw;
      const ph = c === g.player ? c.bobPhase : c.phase;
      poseCarried(r.rig, Math.sin(ph || 0) * Math.min(1, (c.speed || 0) / RV.carry));
      const rx = Math.cos(yaw), rz = -Math.sin(yaw); // the carrier's right
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw); // ...and forward
      const low = c.crouching ? 0.4 : 0;
      // on the carrier's left shoulder (the arm on that side holds the legs: see poseCarrier)
      root.position.set(c.x - rx * 0.2 + fx * 0.09, c.y + 1.56 - low, c.z - rz * 0.2 + fz * 0.09);
      root.rotation.set(0, yaw, 0);
      r.x = c.x;
      r.z = c.z;
      r.y = c.y;
      return true;
    }
    if (r.onCot && this.hut) {
      const cp = this.hut.cotPose();
      poseLying(r.rig);
      root.position.set(cp.x, cp.y, cp.z);
      root.rotation.set(-Math.PI / 2, cp.yaw + Math.PI, 0);
      return true;
    }
    return false;
  }

  // what the E prompt says while your hands are full
  carryPrompt(T) {
    const p = this.g.player;
    if (this.atCot(p)) return this.cotTaken() ? t('useCotTaken') : T('useLayCot');
    return T('usePutDown');
  }

  // the spectator's line, when it's you who's down
  selfState() {
    const p = this.g.player;
    if (p.alive) return null;
    if (p.gone) return 'gone';
    if (p.carriedBy) return 'carried';
    if (p.onCot) return 'cot';
    return 'down';
  }
}
