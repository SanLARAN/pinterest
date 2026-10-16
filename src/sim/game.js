// ============================================================
// GAME — the whole simulation: phases, echo waves, noise propagation,
// objectives, monsters, scoring. Headless-safe (no DOM / WebGL / audio here).
// ============================================================
import { Emitter, Ring, clamp, damp, dist2, lerp, smoothstep, TAU } from '../core/util.js';
import { Rng } from '../core/noise.js';
import { createWorld } from './world.js';
import { Player, NOISE, SPEED } from './player.js';
import { Monster, DEFS } from './monsters.js';
import { NOTES, TUTORIAL, SCARES } from './content.js';

export const MAX_WAVES = 8;
export const DAY_LEN = 62;      // seconds of peaceful morning
export const DUSK_LEN = 15;     // scripted transition
export const DAWN_LEN = 11;

export const DIFF = {
  480: { mult: 0.62, name: 'АРКАДА', nameEn: 'ARCADE' },
  900: { mult: 0.9, name: 'КОРОТКАЯ', nameEn: 'SHORT' },
  1800: { mult: 1.35, name: 'КАНОН', nameEn: 'CANON' },
};

export class Game extends Emitter {
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.lang = opts.lang || 'ru';
    this.nightLen = opts.nightLength || 1800;
    this.seed = opts.seed || (Math.floor(Math.random() * 1e9) >>> 0);
    this.scaresEnabled = opts.scares !== false;
    this.headless = !!opts.headless;
    this.diff = DIFF[this.nightLen] || DIFF[1800];
    this.rng = new Rng(this.seed ^ 0x9e3779b9);
    this.world = createWorld(this.seed);
    this.players = [];
    this.monsters = [];
    this.waves = [];
    this.noiseEvents = new Ring(48);
    this.returns = [];           // audio/radar echo returns (scheduled blips)
    this.phase = 'menu';
    this.t = 0; this.phaseT = 0;
    this.nightT = this.nightLen;
    this.dawnT = 0;
    this.score = 0;
    this.tutorialIdx = 0;
    this.known = { gens: new Set(), corpses: new Set(), circle: false, cabin: false, mast: true, lake: true };
    this.objectives = [];
    this.notesFound = [];
    this.spareFuseTaken = false;
    this.stats = { pings: 0, screams: 0, dist: 0, gens: 0, notes: 0, fuses: 0, hits: 0, seen: new Set(), maxThreat: 0, longestSilence: 0, scares: 0 };
    this.deadCause = null;
    this.deadMonster = null;
    this.deathT = 0;
    this.winT = 0;
    this.paused = false;
    this.schedule = [];
    this.scareT = 0;
    this.nextScare = 150;
    this.globalEcho = 0;         // 0 night .. 1 day (renderer light mix)
    this.skyT = 0;               // 0 morning .. 1 full night
    this.shake = 0;
    this.dampers = [];           // echo dampers (the Tall One)
    this.ctx = { world: this.world, game: this, t: 0, rng: this.rng, emit: (k, a, b, c, d) => this.emit(k, a, b, c, d) };
    this.localId = opts.localId ?? 0;
    this.isHost = opts.host !== false;
    // internal wiring: sim events -> rules
    this.on('use_done', (p, h) => this.applyUseDone(p, h));
    this.on('attack', (m, p) => this.onAttack(m, p));
    this.on('died', (p, cause, monster) => this.die(p, cause, monster));
  }

  // ---------------- setup ----------------
  reset(opts = {}) {
    Object.assign(this.opts, opts);
    if (opts.nightLength && opts.nightLength !== this.nightLen) {
      this.nightLen = opts.nightLength;
      this.diff = DIFF[this.nightLen] || DIFF[1800];
    }
    if (opts.seed) { this.seed = opts.seed; this.rng = new Rng(this.seed ^ 0x9e3779b9); this.world = createWorld(this.seed); this.ctx.world = this.world; }
    this.players.length = 0;
    this.monsters.length = 0;
    this.waves.length = 0;
    this.returns.length = 0;
    this.noiseEvents.clear();
    this.dampers.length = 0;
    this.t = 0; this.phaseT = 0; this.nightT = this.nightLen; this.dawnT = 0;
    this.score = 0; this.tutorialIdx = 0;
    this.known = { gens: new Set(), corpses: new Set(), circle: false, cabin: false, mast: true, lake: true };
    this.objectives = []; this.notesFound = [];
    this.spareFuseTaken = false;
    this.stats = { pings: 0, screams: 0, dist: 0, gens: 0, notes: 0, fuses: 0, hits: 0, seen: new Set(), maxThreat: 0, longestSilence: 0, scares: 0 };
    this.deadCause = null; this.deadMonster = null; this.deathT = 0; this.winT = 0;
    this.shake = 0; this.globalEcho = 1; this.skyT = 0;
    this.nextScare = 130 + this.rng.next() * 80;
    this.buildSchedule();
    this.addObjective('survive');
    this.addObjective('gens');
    this.addObjective('fuses');

    const p = new Player({ id: this.localId, name: this.opts.name || 'ТЫ' });
    p.place(this.world, this.world.start.x, this.world.start.z, this.world.start.yaw);
    this.players.push(p);
    this.local = p;
    this.phase = 'day';
    this.emit('phase', 'day');
    this.emit('reset');
    return this;
  }

  buildSchedule() {
    const L = this.nightLen;
    this.schedule = [
      { t: 6, type: 'whisperer', n: 1, msg: null },
      { t: Math.min(150, L * 0.10), type: 'whisperer', n: 1, msg: null },
      { t: Math.min(330, L * 0.20), type: 'tall', n: 1, msg: 'tall' },
      { t: Math.min(560, L * 0.34), type: 'whisperer', n: 1, msg: null },
      { t: Math.min(820, L * 0.52), type: 'weeper', n: 1, msg: 'weeper' },
      { t: Math.min(1180, L * 0.74), type: 'whisperer', n: 1, msg: null },
      { t: Math.min(1500, L * 0.9), type: 'whisperer', n: 1, msg: 'horde' },
    ].sort((a, b) => a.t - b.t);
  }

  addObjective(key) {
    if (this.objectives.some((o) => o.key === key)) return;
    this.objectives.push({ key, done: false });
    this.emit('objectives', this.objectives);
  }
  doneObjective(key) {
    const o = this.objectives.find((x) => x.key === key);
    if (o && !o.done) { o.done = true; this.emit('objectives', this.objectives); }
  }

  addPlayer(id, name) {
    if (this.players.some((p) => p.id === id)) return this.players.find((p) => p.id === id);
    const p = new Player({ id, name: name || `P${this.players.length + 1}`, remote: true });
    const a = this.rng.next() * TAU;
    p.place(this.world, Math.cos(a) * 2.4, Math.sin(a) * 2.4, this.world.start.yaw);
    this.players.push(p);
    this.emit('playerJoined', p);
    return p;
  }
  removePlayer(id) {
    const i = this.players.findIndex((p) => p.id === id);
    if (i >= 0) { const [p] = this.players.splice(i, 1); this.emit('playerLeft', p); }
  }

  // ---------------- main update ----------------
  update(dtRaw) {
    if (this.paused || this.phase === 'menu') return;
    const dt = clamp(dtRaw, 0, 1 / 15);
    this.t += dt; this.phaseT += dt;
    this.ctx.t = this.t;
    this.ctx.dt = dt;
    this.shake = Math.max(0, this.shake - dt * 2.6);
    const H = this.isHost;

    // ---- phase flow (host authoritative) ----
    if (this.phase === 'day') {
      if (H) {
        this.skyT = damp(this.skyT, 0, 1.2, dt);
        this.globalEcho = damp(this.globalEcho, 1, 2, dt);
        this.tutorials(dt);
        if (this.phaseT >= DAY_LEN) this.startDusk();
      } else { this.skyT = damp(this.skyT, 0, 1.2, dt); this.globalEcho = damp(this.globalEcho, 1, 2, dt); }
    } else if (this.phase === 'dusk') {
      const k = clamp(this.phaseT / DUSK_LEN, 0, 1);
      this.skyT = H ? k : damp(this.skyT, k, 6, dt);
      this.globalEcho = 1 - smoothstep(0.15, 0.92, this.skyT);
      if (H) {
        this.duskBeats(k);
        if (k >= 1) this.startNight();
      }
    } else if (this.phase === 'night') {
      if (H) {
        this.skyT = damp(this.skyT, 1, 2, dt);
        this.globalEcho = damp(this.globalEcho, 0, 2, dt);
        this.nightT -= dt;
        this.score += dt * 11 * this.diff.mult;
        this.spawner();
        if (this.scaresEnabled) this.scareTick(dt);
        const lp = this.local;
        if (lp && lp.alive) {
          this.stats.longestSilence = Math.max(this.stats.longestSilence, lp.silenceT);
          if (lp.silenceT > 14) this.score += dt * 7 * this.diff.mult;
        }
        if (this.nightT <= 0) this.startDawn();
      } else {
        this.skyT = damp(this.skyT, 1, 2, dt);
        this.globalEcho = damp(this.globalEcho, 0, 2, dt);
      }
    } else if (this.phase === 'dawn') {
      this.dawnT += dt;
      const k = clamp(this.dawnT / DAWN_LEN, 0, 1);
      this.skyT = H ? 1 - k : damp(this.skyT, 1 - k, 4, dt);
      this.globalEcho = smoothstep(0.1, 0.85, k);
      if (H && k >= 1 && this.winT === 0) { this.winT = 1; this.finish(true); }
    } else if (this.phase === 'dead') {
      this.deathT += dt;
      if (this.deathT > 2.5 && !this.overFired) {
        const anyoneAlive = this.players.some((p) => p.alive);
        if (!anyoneAlive || !H) { this.overFired = true; this.phase = 'over'; this.emit('gameover', this.summary()); }
      }
    }

    // ---- players ----
    for (const p of this.players) {
      if (p.remote) continue;
      p.update(dt, this.ctx);
      this.stats.dist += p.speed * dt;
    }

    // ---- monsters ----
    this.dampers.length = 0;
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (!m.alive) { this.monsters.splice(i, 1); continue; }
      if (H) {
        m.update(dt, this.ctx);
      } else {
        m.anim += dt * (1 + m.speed * 0.5);
        m.bodyLean = damp(m.bodyLean, clamp(m.speed / 4.5, 0, 1.4) * 0.16, 6, dt);
        m.headTilt = Math.sin(m.anim * 0.7) * 0.16;
      }
      if (m.def.echoDamp > 0) this.dampers.push({ x: m.x, y: m.y, z: m.z, r: m.def.echoDamp });
      if (this.local && this.local.alive && m.state === 'hunt') this.stats.seen.add(m.type);
      if (this.local) this.stats.maxThreat = Math.max(this.stats.maxThreat, m.alert);
    }
    if (!H) this.guestAttackCheck(dt);

    // ---- waves ----
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.r += w.speed * dt;
      w.life -= dt;
      const k = w.r / w.maxR;
      w.str = w.str0 * (1 - k) * (1 - k) * clamp(w.life / w.maxLife, 0, 1);
      if (w.r > w.maxR || w.life <= 0 || w.str < 0.012) { this.waves.splice(i, 1); this.emit('waveEnd', w); }
    }
    // ---- scheduled echo returns ----
    for (let i = this.returns.length - 1; i >= 0; i--) {
      const r = this.returns[i];
      r.at -= dt;
      if (r.at <= 0) { this.emit('return', r); this.returns.splice(i, 1); }
    }

    // ---- generator lamps ----
    for (const g of this.world.gens) {
      if (g.fixed) g.lamp = damp(g.lamp, 1, 1.4, dt);
    }

    // ---- interaction target ----
    this.updateInteract(dt);

    this.emit('tick', dt);
  }

  /** Guests do not simulate monster AI, but they do resolve their own hits locally. */
  guestAttackCheck(dt) {
    const p = this.local;
    if (!p || !p.alive) return;
    for (const m of this.monsters) {
      if (!m.alive || m.state === 'spawn' || m.state === 'flee') continue;
      m.attackCd = Math.max(0, (m.attackCd || 0) - dt);
      const d = dist2(p.x, p.z, m.x, m.z);
      if (d < m.def.attackRange && (m.state === 'hunt' || d < m.def.attackRange * 0.8) && m.attackCd <= 0) {
        m.attackCd = m.def.attackCd;
        this.emit('attack', m, p);
      }
    }
  }

  tutorials(dt) {
    const list = TUTORIAL;
    while (this.tutorialIdx < list.length && this.phaseT >= list[this.tutorialIdx].t) {
      const h = list[this.tutorialIdx++];
      this.emit('hint', this.lang === 'en' ? h.en : h.ru, 5.5);
    }
  }

  duskBeats(k) {
    const beats = [0.05, 0.28, 0.5, 0.72, 0.9];
    for (const b of beats) {
      if (k >= b && !this['beat' + b]) {
        this['beat' + b] = true;
        this.emit('duskBeat', b);
      }
    }
  }

  startDusk() {
    this.phase = 'dusk'; this.phaseT = 0;
    for (const b of [0.05, 0.28, 0.5, 0.72, 0.9]) this['beat' + b] = false;
    this.emit('phase', 'dusk');
    this.emit('toast', this.tr('Солнце село. Лес изменился.', 'The sun went down. The forest changed.'), 'bad', 4);
  }

  startNight() {
    this.phase = 'night'; this.phaseT = 0; this.nightT = this.nightLen;
    this.emit('phase', 'night');
    this.shake = 0.8;
    this.emit('toast', this.tr('НОЧЬ. Продержись до рассвета.', 'NIGHT. Hold on until dawn.'), 'bad', 5);
    this.emit('nightStart');
  }

  startDawn() {
    this.phase = 'dawn'; this.phaseT = 0; this.dawnT = 0;
    this.nightT = 0;
    for (const m of this.monsters) m.setState('flee');
    this.emit('phase', 'dawn');
    this.emit('toast', this.tr('Рассвет. Они уходят.', 'Dawn. They are leaving.'), 'good', 6);
  }

  tr(ru, en) { return this.lang === 'en' ? en : ru; }

  // ---------------- spawning ----------------
  spawner() {
    const elapsed = this.nightLen - this.nightT;
    while (this.schedule.length && this.schedule[0].t <= elapsed) {
      const s = this.schedule.shift();
      this.spawn(s.type, s.n, s.msg);
    }
  }

  spawn(type, n = 1, msg) {
    const lp = this.local || this.players[0];
    for (let i = 0; i < n; i++) {
      const def = DEFS[type];
      let x = 0, z = 0, ok = false;
      for (let t = 0; t < 40 && !ok; t++) {
        const a = this.rng.next() * TAU;
        const r = type === 'tall' ? this.rng.range(150, 225) : this.rng.range(78, 165);
        x = (lp ? lp.x : 0) + Math.cos(a) * r;
        z = (lp ? lp.z : 0) + Math.sin(a) * r;
        const dc = Math.hypot(x, z);
        if (dc > this.world.half * 0.95) continue;
        if (this.world.isWater(x, z)) continue;
        if (lp && dist2(x, z, lp.x, lp.z) < (type === 'tall' ? 120 : 62)) continue;
        let lit = false;
        for (const g of this.world.gens) if (g.fixed && dist2(x, z, g.x, g.z) < def.lightFear) lit = true;
        if (lit) continue;
        ok = true;
      }
      const m = new Monster(type, x, z, this.world, this.rng);
      this.monsters.push(m);
      this.emit('spawn', m);
    }
    if (msg === 'tall') {
      this.emit('announce', this.tr('ЭХО ПОГАСЛО. ДЛИННЫЙ ПРОСНУЛСЯ.', 'THE ECHO WENT OUT. THE TALL ONE IS AWAKE.'), 6, 'tall');
      this.emit('sting', 'tall');
    } else if (msg === 'weeper') {
      this.emit('announce', this.tr('ГДЕ-ТО ПЛАЧУТ. ПЛАКАЛЬЩИЦА В ЛЕСУ.', 'SOMETHING IS CRYING. THE WEEPER IS IN THE FOREST.'), 6, 'weeper');
      this.emit('sting', 'weeper');
    } else if (msg === 'horde') {
      this.emit('announce', this.tr('ЛЕС ЗАШЕВЕЛИЛСЯ. ИХ БОЛЬШЕ.', 'THE FOREST STIRRED. THERE ARE MORE OF THEM.'), 5, 'whisperer');
      this.emit('sting', 'horde');
    }
  }

  scareTick(dt) {
    this.scareT += dt;
    if (this.scareT < this.nextScare) return;
    this.scareT = 0;
    this.nextScare = 120 + this.rng.next() * 150;
    const lp = this.local;
    if (!lp || !lp.alive) return;
    const near = this.monsters.some((m) => m.alive && dist2(m.x, m.z, lp.x, lp.z) < 40);
    if (near) { this.nextScare = 60; return; }        // don't pile scares on a real chase
    const s = SCARES[this.rng.int(0, SCARES.length - 1)];
    this.stats.scares++;
    this.emit('scare', s, this.tr(s.ru, s.en));
  }

  // ---------------- echo & noise ----------------
  /** Emit an echolocation wave. strength 0..1 (0 = quiet tongue click, 1 = full shout pulse). */
  ping(player, strength = 0.35, opts = {}) {
    if (!player.alive) return null;
    const s = clamp(strength, 0.05, 1);
    const maxR = lerp(44, 132, s);
    const w = {
      x: player.x, y: player.eye - 0.15, z: player.z,
      r: 0.6, maxR, speed: lerp(52, 78, s), str: s, str0: s,
      life: maxR / lerp(52, 78, s) + 0.75, maxLife: maxR / lerp(52, 78, s) + 0.75,
      owner: player.id, loud: s > 0.72, kind: opts.kind || 'ping', color: opts.color || 0,
      t0: this.t,
    };
    w.maxLife = w.life;
    if (this.waves.length >= MAX_WAVES) this.waves.shift();
    this.waves.push(w);
    this.stats.pings++;
    player.pingCd = lerp(0.42, 0.95, s);
    this.emit('ping', player, w);
    // noise: an echo click is itself a sound other things can hear
    // only screams are 'loud' events; a charged ping is a big but local beacon
    this.noise(player.x, player.z, lerp(NOISE.ping, NOISE.pingCharged, s), 'ping', player, false);
    this.buildReturns(player, w);
    return w;
  }

  /** Faint delayed blips so the sonar is audible, not just visible. */
  buildReturns(player, w) {
    const out = [];
    const add = (x, z, y, kind, gain, ref) => {
      const d = dist2(player.x, player.z, x, z);
      if (d > w.maxR || d < 3) return;
      out.push({ x, z, y, d, at: d / w.speed, kind, gain: gain * (1 - d / w.maxR), owner: w.owner, ref });
    };
    for (const g of this.world.gens) add(g.x, g.z, g.y + 1.4, g.fixed ? 'gen_on' : 'gen', 1, g);
    for (const c of this.world.corpses) if (!c.searched) add(c.x, c.z, c.y + 0.5, 'corpse', 0.85, c);
    for (const lm of this.world.landmarks) {
      if (lm.kind === 'circle') for (const s of lm.stones) add(s.x, s.z, s.y + 1.5, 'stone', 0.5);
      else add(lm.x, lm.z, (lm.y || 0) + 2, lm.kind, 0.8);
    }
    for (const m of this.monsters) if (m.alive && m.state !== 'spawn') add(m.x, m.z, m.y + m.def.height * 0.6, 'monster', 1.15);
    for (const p of this.players) if (p !== player && p.alive) add(p.x, p.z, p.y + 1, 'player', 1);
    // forest texture: sample the density field so the echo has body
    for (let i = 0; i < 14; i++) {
      const a = this.rng.next() * TAU;
      const d = 6 + Math.pow(this.rng.next(), 0.62) * (w.maxR - 8);
      const x = player.x + Math.cos(a) * d, z = player.z + Math.sin(a) * d;
      if (Math.hypot(x, z) > this.world.half) continue;
      const dens = this.world.density(x, z);
      if (this.rng.next() < dens * 0.95) add(x, z, this.world.heightAt(x, z) + 2 + this.rng.next() * 8, 'tree', 0.32 * dens);
    }
    out.sort((a, b) => a.d - b.d);
    // the sonar is how you FIND the objectives: a clean return is marked forever
    for (const r of out) {
      if (r.kind === 'gen' && r.ref && !this.known.gens.has(r.ref.id)) { this.known.gens.add(r.ref.id); this.emit('sonarFound', 'gen', r.ref); }
      else if (r.kind === 'corpse' && r.ref && r.d < 74 && !this.known.corpses.has(r.ref.id)) { this.known.corpses.add(r.ref.id); this.emit('sonarFound', 'corpse', r.ref); }
    }
    for (const r of out.slice(0, 26)) this.returns.push(r);
    this.emit('returns', out, w);
    return out;
  }

  /** A noise of radius `radius` at (x,z). Monsters hear it immediately. */
  noise(x, z, radius, kind, owner, loud = false) {
    if (radius <= 0.5) return;
    const inCircle = this.known.circle && dist2(x, z, this.world.circle.x, this.world.circle.z) < this.world.circle.r * 1.25;
    const r = inCircle ? radius * 0.45 : radius;
    const ev = { x, z, r, kind, owner: owner ? owner.id : -1, loud, t: this.t };
    this.noiseEvents.push(ev);
    this.emit('noiseEvent', ev);
    for (const m of this.monsters) {
      if (!m.alive || m.state === 'spawn') continue;
      m.hear(x, z, r, loud, this.ctx);
    }
    return ev;
  }

  /** The player screamed (mic or shout key). The most dangerous thing you can do. */
  scream(player, level = 1) {
    if (!player.alive || this.phase === 'day') return;
    this.stats.screams++;
    const r = NOISE.scream * clamp(level, 0.6, 1.4);
    this.noise(player.x, player.z, r, 'scream', player, true);
    this.ping(player, 1.0, { kind: 'scream' });
    this.emit('scream', player, level);
    this.shake = Math.max(this.shake, 0.75);

    // instant death if something is already on top of you
    for (const m of this.monsters) {
      if (!m.alive || m.state === 'spawn') continue;
      const d = dist2(player.x, player.z, m.x, m.z);
      const killR = m.type === 'tall' ? 26 : m.type === 'weeper' ? 22 : 18;
      if (d < killR) {
        if (m.type === 'weeper' && m.wailT > 0.15) { player.kill(this.ctx, 'weeper', m); return; }
        player.kill(this.ctx, 'scream_close', m); return;
      }
      if (d < 120) {
        m.tx = player.x; m.tz = player.z; m.lastKnown = { x: player.x, z: player.z };
        m.alert = 1; m.huntT = Math.max(m.huntT, m.type === 'tall' ? 34 : 22);
        m.setState('hunt');
        m.growl = 1;
      }
    }
  }

  // ---------------- interaction ----------------
  findInteractable(player) {
    let best = null, bd = 1e9;
    const test = (kind, id, x, z, y, range, label) => {
      const d = dist2(player.x, player.z, x, z);
      if (d < range && d < bd) { bd = d; best = { kind, id, x, z, y, d, label }; }
    };
    for (const c of this.world.corpses) if (!c.searched) test('corpse', c.id, c.x, c.z, c.y, 3.0, 'corpse');
    for (const g of this.world.gens) if (!g.fixed) test('gen', g.id, g.x, g.z, g.y, 3.6, 'gen');
    const cab = this.world.cabin;
    if (!this.spareFuseTaken) test('stash', 0, cab.x, cab.z, cab.y, 3.4, 'stash');
    return best;
  }

  updateInteract(dt) {
    const p = this.local;
    if (!p) return;
    const target = this.findInteractable(p);
    this.interact = target;
    if (!p.alive) { p.holding = null; return; }
    if (target && this.wantUse) {
      const need = target.kind === 'gen' ? 5.4 : target.kind === 'corpse' ? 1.5 : 1.2;
      if (!p.holding || p.holding.kind !== target.kind || p.holding.id !== target.id) {
        if (target.kind === 'gen' && p.fuses <= 0) {
          if (!this.noFuseWarn || this.t - this.noFuseWarn > 4) {
            this.noFuseWarn = this.t;
            this.emit('toast', this.tr('Нужен предохранитель. Обыщи тела.', 'You need a fuse. Search the bodies.'), 'bad', 3);
          }
          p.holding = null;
        } else {
          p.holding = { kind: target.kind, id: target.id, t: 0, need, x: target.x, z: target.z };
          this.emit('useStart', p, target);
        }
      }
    } else if (p.holding && (!target || p.holding.kind !== target.kind || p.holding.id !== target.id)) {
      p.holding = null;
      this.emit('useStop', p);
    }
    if (p.holding && p.holding.kind === 'gen') {
      this.noise(p.x, p.z, NOISE.repair, 'repair', p, false);
      if (this.rng.chance(dt * 9)) this.emit('spark', p.holding.x, p.holding.z);
    }
    // auto-discover props you walk close to
    for (const g of this.world.gens) if (!this.known.gens.has(g.id) && dist2(p.x, p.z, g.x, g.z) < 30) { this.known.gens.add(g.id); this.emit('discovered', 'gen', g); }
    for (const c of this.world.corpses) if (!this.known.corpses.has(c.id) && dist2(p.x, p.z, c.x, c.z) < 16) { this.known.corpses.add(c.id); this.emit('discovered', 'corpse', c); }
  }

  setUse(v) { this.wantUse = !!v; }

  applyUseDone(player, h) {
    if (h.kind === 'corpse') {
      const c = this.world.corpses[h.id];
      if (!c || c.searched) return;
      c.searched = true;
      const note = NOTES[c.note % NOTES.length];
      this.notesFound.push({ id: c.id, note });
      this.stats.notes++;
      this.score += 150 * this.diff.mult;
      this.emit('note', note, c);
      if (note.reveal) this.applyReveal(note.reveal, c);
      if (note.item) { player.items[note.item] = (player.items[note.item] || 0) + 1; this.emit('item', note.item); }
      if (c.hasFuse) {
        player.fuses++; this.stats.fuses++; this.score += 200 * this.diff.mult;
        this.emit('fuse', player.fuses);
      }
      this.ping(player, 0.25, { kind: 'soft' });
    } else if (h.kind === 'stash') {
      if (this.spareFuseTaken) return;
      this.spareFuseTaken = true;
      player.fuses++; this.stats.fuses++; this.score += 120 * this.diff.mult;
      this.emit('fuse', player.fuses);
      this.emit('toast', this.tr('Запасной предохранитель забран.', 'Spare fuse taken.'), 'good', 3);
    } else if (h.kind === 'gen') {
      const g = this.world.gens[h.id];
      if (!g || g.fixed) return;
      if (player.fuses <= 0) { this.emit('toast', this.tr('Нет предохранителя!', 'No fuse!'), 'bad', 3); return; }
      player.fuses--;
      g.fixed = true; g.lamp = 0.01;
      this.stats.gens++;
      this.score += 500 * this.diff.mult;
      this.known.gens.add(g.id);
      const cut = Math.min(55, this.nightT * 0.12);
      this.nightT = Math.max(6, this.nightT - cut);
      this.emit('generator', g, cut);
      this.noise(g.x, g.z, NOISE.generatorDone, 'generator', player, true);
      this.waves.push({ x: g.x, y: g.y + 2.2, z: g.z, r: 1, maxR: 170, speed: 90, str: 1, str0: 1, life: 2.4, maxLife: 2.4, owner: -1, loud: false, kind: 'gen', color: 1, t0: this.t });
      this.shake = Math.max(this.shake, 0.5);
      for (const m of this.monsters) {
        if (m.def.lightFear > 0 && dist2(m.x, m.z, g.x, g.z) < m.def.lightFear * 1.5) { m.scared = 3; m.alert *= 0.4; if (m.state === 'hunt') m.setState('search'); }
      }
      if (this.stats.gens >= this.world.gens.length) this.doneObjective('gens');
      if (player.fuses >= 0 && this.stats.gens + player.fuses >= this.world.gens.length) this.doneObjective('fuses');
    }
  }

  applyReveal(rev, c) {
    if (rev.gen !== undefined) { this.known.gens.add(rev.gen); this.emit('discovered', 'gen', this.world.gens[rev.gen]); }
    if (rev.circle) { this.known.circle = true; this.emit('discovered', 'circle', this.world.circle); }
    if (rev.cabin) { this.known.cabin = true; this.emit('discovered', 'cabin', this.world.cabin); }
    if (rev.corpseNearest) {
      let best = null, bd = 1e9;
      for (const o of this.world.corpses) {
        if (o.searched || !o.hasFuse) continue;
        const d = dist2(c.x, c.z, o.x, o.z);
        if (d < bd) { bd = d; best = o; }
      }
      if (best) { this.known.corpses.add(best.id); this.emit('discovered', 'corpse', best); }
    }
    if (rev.lore) this.emit('lore', rev.lore);
    if (rev.spareFuse) this.emit('discovered', 'stash', this.world.cabin);
  }

  // ---------------- attacks / death ----------------
  onAttack(m, p) {
    if (!p.alive || p.iframe > 0) return;
    const cause = m.type;
    p.hurt(this.ctx, m.def.damage, m.x, m.z, cause, m);
    this.shake = 1;
    m.alert = 1;
    this.emit('hitFlash', m, p);
  }

  finish(win) {
    if (this.phase === 'over') return;
    const lp = this.local;
    if (win) {
      this.score += 4000 * this.diff.mult * (1 + (lp ? lp.nerve : 1) * 0.25);
      this.score += this.stats.gens * 300 * this.diff.mult;
      this.phase = 'over';
      this.emit('win', this.summary());
    }
  }

  die(p, cause, monster) {
    if (this.phase === 'dead' || this.phase === 'over') return;
    this.deadCause = cause;
    this.deadMonster = monster || null;
    this.phase = 'dead';
    this.phaseT = 0; this.deathT = 0;
    this.shake = 1.6;
    this.emit('death', cause, monster, p);
  }

  summary() {
    const lp = this.local;
    const survived = this.nightLen - Math.max(0, this.nightT);
    return {
      win: this.phase === 'over' && lp && lp.alive,
      score: Math.round(this.score),
      time: survived,
      gens: this.stats.gens,
      notes: this.stats.notes,
      fuses: this.stats.fuses,
      pings: this.stats.pings,
      screams: this.stats.screams,
      dist: this.stats.dist,
      nerve: lp ? lp.nerve : 0,
      cause: this.deadCause,
      monster: this.deadMonster ? this.deadMonster.type : null,
      nightLen: this.nightLen,
      diff: this.diff,
      longestSilence: this.stats.longestSilence,
      scares: this.stats.scares,
      seed: this.seed,
    };
  }

  // ---------------- co-op: host -> guest state ----------------
  snapshot() {
    return {
      p: this.phase, t: +this.t.toFixed(2), nt: +this.nightT.toFixed(1), sk: +this.skyT.toFixed(3),
      sc: Math.round(this.score), sg: this.stats.gens,
      pl: this.players.map((p) => p.serialize()),
      mo: this.monsters.map((m) => m.serialize()),
      wa: this.waves.map((w) => [+(w.x).toFixed(1), +(w.y).toFixed(1), +(w.z).toFixed(1), +w.r.toFixed(1), +w.maxR.toFixed(0), +w.str.toFixed(3), w.owner, w.color, w.kind]),
      gf: this.world.gens.map((g) => (g.fixed ? 1 : 0)),
      cs: this.world.corpses.map((c) => (c.searched ? 1 : 0)),
      kn: [Array.from(this.known.gens), Array.from(this.known.corpses), this.known.circle ? 1 : 0, this.known.cabin ? 1 : 0, this.spareFuseTaken ? 1 : 0],
      sf: this.schedule.map((s) => s.t),
    };
  }

  applySnapshot(s, dt) {
    // a dead guest keeps watching its own death instead of snapping back to the host's phase
    if (this.phase !== 'dead' && this.phase !== 'over') this.phase = s.p;
    this.t = s.t; this.nightT = s.nt; this.skyT = s.sk;
    this.globalEcho = 1 - s.sk;
    this.score = s.sc; this.stats.gens = s.sg;
    s.gf.forEach((f, i) => { if (this.world.gens[i]) this.world.gens[i].fixed = !!f; });
    s.cs.forEach((f, i) => { if (this.world.corpses[i]) this.world.corpses[i].searched = !!f; });
    if (s.kn) {
      this.known.gens = new Set(s.kn[0]); this.known.corpses = new Set(s.kn[1]);
      this.known.circle = !!s.kn[2]; this.known.cabin = !!s.kn[3]; this.spareFuseTaken = !!s.kn[4];
    }
    // players
    for (const pm of s.pl) {
      let p = this.players.find((x) => x.id === pm.i);
      if (!p) p = this.addPlayer(pm.i, pm.nm);
      if (p === this.local) { p.nerve = pm.n; p.fuses = pm.f; p.alive = !!pm.a; continue; }
      p.name = pm.nm;
      p.applyNet(pm, dt);
    }
    // monsters (host authoritative)
    for (const mm of s.mo) {
      let m = this.monsters.find((x) => x.id === mm.i);
      if (!m) {
        const type = mm.t === 'w' ? 'whisperer' : mm.t === 't' ? 'tall' : 'weeper';
        m = new Monster(type, mm.x, mm.z, this.world);
        m.id = mm.i; m.state = mm.s; m.spawnT = 99;
        this.monsters.push(m);
        this.emit('spawn', m);
      }
      m.x = damp(m.x, mm.x, 12, dt); m.z = damp(m.z, mm.z, 12, dt);
      m.y = damp(m.y, mm.y, 12, dt); m.yaw = mm.w; m.state = mm.s; m.alert = mm.a;
      m.speed = mm.sp; m.alive = !!mm.al; m.wailT = mm.wl;
      m.anim += dt * (1 + m.speed * 0.55);
    }
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      if (!s.mo.some((mm) => mm.i === this.monsters[i].id)) this.monsters.splice(i, 1);
    }
    // waves are visual: adopt new host waves
    const have = new Set(this.waves.map((w) => w.id));
    for (const w of s.wa) {
      const id = `${Math.round(w[0])}_${Math.round(w[2])}_${w[6]}_${w[7]}_${w[8]}`;
      if (have.has(id)) continue;
      this.waves.push({ id, x: w[0], y: w[1], z: w[2], r: w[3], maxR: w[4], str: w[5], str0: 1, speed: 62, life: (w[4] - w[3]) / 62, maxLife: w[4] / 62, owner: w[6], color: w[7], kind: w[8], t0: this.t });
    }
    this.dampers.length = 0;
    for (const m of this.monsters) if (m.def.echoDamp > 0) this.dampers.push({ x: m.x, y: m.y, z: m.z, r: m.def.echoDamp });
    this.updateInteract(dt);
  }
}
