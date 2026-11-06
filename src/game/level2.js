// «Топь» — the second level, told as one night in chapters (5.0, docs/LEVEL2.md).
//
// The forest is a shift: mornings, nights, generators, a car. This level is not. It is seven chapters played in
// order, each with its own place to start, its own goal and its own way of ending — a film, or something you do.
// This file is the machine that runs them; each chapter's content arrives in its own round:
//
//   1 convoy     film  the highway at night, the convoy, the tentacle across the road     (5.0b)
//   2 road       play  the dirt road: the driver, the forks and the navigator, the Корень  (5.0c)
//   3 crash      film  the pine, the black                                                  (5.0d)
//   4 village    play  tied up in a random house, the Сторож, finding each other           (5.0d)
//   5 generator  play  the map pieces put together, the generator at the mouth of the bog  (5.0e)
//   6 escape     play  the Kugoo bikes down the causeway                                    (5.0f)
//   7 cliff      play  off the cliff into the lake → the pier, the old fisherman, the end   (5.0f)
//
// Until a chapter has its round, it plays as a plain stand-in: a film is a title over the place it happens, a
// play chapter is walked on foot to its goal. That is enough to cross the whole level end to end.
//
// Co-op: the host's machine decides when a chapter ends and tells everyone ('l2', the chapter index); a guest
// never ends a chapter by itself.
import { t } from '../core/i18n.js';
import { smoothstep } from '../core/rng.js';
import { HIGHWAY, ROADS, CRASH, HOUSES, GATE, GENERATOR, CAUSEWAY, CLIFF } from '../world/swamp.js';
import { swimming } from './water.js';

export const CHAPTERS = [
  { id: 'convoy', film: true, dur: 9 },
  { id: 'road' },
  { id: 'crash', film: true, dur: 6 },
  { id: 'village' },
  { id: 'generator' },
  { id: 'escape' },
  { id: 'cliff' },
];
export const TITLE_T = 5; // s the chapter's title stays up
const TAIL = 4.5; // s from the lake to the end of the level (the pier film arrives in 5.0f)
const SLOT_GAP = 1.6; // m between players at a shared start

// the yaw that looks from (fx, fz) toward (tx, tz) (the player looks along (-sin yaw, -cos yaw))
export function faceYaw(fx, fz, tx, tz) {
  return Math.atan2(-(tx - fx), -(tz - fz));
}

// which house a player wakes up in (chapter 4): a different one for each seat, chosen from the night's seed
export function houseFor(seed, slot) {
  const n = HOUSES.length;
  const first = (seed >>> 0) % n;
  const step = 5; // (co-prime with 16: four seats, four houses far apart)
  return HOUSES[(first + slot * step) % n];
}

// where a chapter starts for the player in this seat
export function chapterStart(id, world, slot = 0, seed = 0) {
  const side = (slot - 1.5) * SLOT_GAP;
  const main = ROADS[0].pts;
  const at = (x, z, tx, tz) => ({ x, z, yaw: faceYaw(x, z, tx, tz) });
  switch (id) {
    case 'convoy': return at(HIGHWAY.turn - 46 - slot * SLOT_GAP, HIGHWAY.z - 1.8, HIGHWAY.turn, HIGHWAY.z - 1.8);
    case 'road': return at(main[0][0] + side, main[0][1], main[1][0], main[1][1]);
    case 'crash': return at(CRASH.x + 9 + side, CRASH.z + 7, CRASH.x, CRASH.z);
    case 'village': {
      const H = (world.houses || []).find((h) => h.id === houseFor(seed, slot).id) || houseFor(seed, slot);
      const p = H.post || { x: H.x, z: H.z };
      return at(p.x + (H.x - p.x) * 0.35, p.z + (H.z - p.z) * 0.35, H.x, H.z);
    }
    case 'generator': return at(GATE.x - 18 + side, GATE.z + 6, GENERATOR.x, GENERATOR.z);
    case 'escape': return at(CAUSEWAY.pts[0][0] - 2, CAUSEWAY.pts[0][1] + side * 0.4, CAUSEWAY.pts[1][0], CAUSEWAY.pts[1][1]);
    case 'cliff': { const e = CAUSEWAY.pts[CAUSEWAY.pts.length - 1]; return at(e[0], e[1] + side * 0.4, CLIFF.x, CLIFF.z); }
    default: return at(world.spawn.x, world.spawn.z, 0, 0);
  }
}

// has this player done what the chapter asks? (play chapters only; the generator also wants E)
export function chapterGoal(id, world, p, used = false) {
  switch (id) {
    case 'road': return Math.hypot(p.x - CRASH.x, p.z - CRASH.z) < 14;
    case 'village': return Math.hypot(p.x - GATE.x, p.z - GATE.z) < 22;
    case 'generator': return used && Math.hypot(p.x - GENERATOR.x, p.z - GENERATOR.z) < 3.2;
    case 'escape': { const e = CAUSEWAY.pts[CAUSEWAY.pts.length - 1]; return Math.hypot(p.x - e[0], p.z - e[1]) < 9; }
    case 'cliff': return swimming(world, p.x, p.z);
    default: return false;
  }
}

export class Level2 {
  static COUNT = CHAPTERS.length;

  constructor(game) {
    this.g = game;
    this.i = -1;
    this.t = 0;
    this.tail = -1; // s since the lake took you (the last chapter's end), -1 before
    this.done = false;
  }

  get chapter() {
    return CHAPTERS[this.i] || null;
  }

  // the night starts at chapter `index` (0 normally; ?chapter=N for a debug jump)
  begin(index = 0) {
    this.done = false;
    this.tail = -1;
    this.goto(Math.max(0, Math.min(CHAPTERS.length - 1, index | 0)));
  }

  // put everyone at this chapter's start. remote: the host said so (a guest does not announce)
  goto(index, remote = false) {
    const g = this.g;
    if (index < 0 || index >= CHAPTERS.length) return;
    this.i = index;
    this.t = 0;
    this.tail = -1;
    const C = CHAPTERS[index];
    const p = g.player;
    const s = chapterStart(C.id, g.world, p.slot || 0, g.baseSeed || 0);
    p.x = s.x;
    p.z = s.z;
    p.yaw = s.yaw;
    p.pitch = -0.04;
    p.vx = p.vz = 0;
    p.y = g.world.walkHeight?.(s.x, s.z) ?? g.world.terrain.height(s.x, s.z);
    g.fx.fade = 0; // every chapter opens out of the black
    g.hud.setIntro(t('l2Ch').replace('{n}', index + 1) + ' · ' + t('l2_' + C.id), t('l2_' + C.id + 'S'));
    g.hud.setHint(null);
    g.hud.setSkip(!!C.film);
    if (!remote && g.role === 'host') g.sync?.ev?.('l2', index);
  }

  next() {
    if (this.i >= CHAPTERS.length - 1) return this.finish();
    this.goto(this.i + 1);
  }

  finish() {
    if (this.done) return;
    this.done = true;
    if (this.g.role === 'host') this.g.sync?.ev?.('l2', CHAPTERS.length);
    this.g.winLevel2?.();
  }

  // one frame. Returns the player's step events for the game's sounds (or nothing in a film)
  update(dt, raw) {
    const g = this.g;
    const C = this.chapter;
    if (!C || this.done) return null;
    this.t += dt;
    g.fx.fade = Math.max(g.fx.fade, smoothstep(0, 1.2, this.t));
    if (this.t > TITLE_T && this.t - dt <= TITLE_T) g.hud.setIntro(null);
    const events = raw?.events || [];
    if (C.film) {
      // (the stand-in film: you stand where it happens and look about; Enter goes on)
      g.player.update(dt, g.input, raw?.look || { dx: 0, dy: 0 }, true);
      if (g.auth && (this.t >= C.dur || events.includes('confirm') || events.includes('skip'))) this.next();
      return null;
    }
    const pev = g.player.update(dt, g.input, raw?.look || { dx: 0, dy: 0 }, g.inputMuted || g.inventory?.active);
    if (this.t > TITLE_T) g.hud.setHint(t('l2Goal_' + C.id));
    if (this.tail >= 0) {
      this.tail += dt;
      g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(0, TAIL, this.tail));
      if (this.tail >= TAIL && g.auth) this.finish();
      return pev;
    }
    if (g.auth && chapterGoal(C.id, g.world, g.player, events.includes('useDown'))) {
      if (C.id === 'cliff') this.tail = 0;
      else this.next();
    }
    return pev;
  }
}
