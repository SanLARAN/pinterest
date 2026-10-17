// One run of the game: rules, scoring, director, scares, juice.
import * as THREE from 'three';
import { CFG, dangerMultiplier, monsterTargets } from '../core/config.js';
import { RNG, Simplex2, clamp, lerp, smoothstep, damp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { createMonster, ShadeRig, buildRig } from './monsters.js';
import { RemotePlayer } from './remote.js';
import { NetSync } from './netsync.js';
import { Objectives } from './objectives.js';
import { Player } from './player.js';
import { Shards } from './shards.js';
import { Stones } from './stones.js';
import { Doors } from './doors.js';
import { Flares } from './flares.js';
import { Dread } from './dread.js';
import { CAP } from '../world/world.js';
import { shared } from '../render/sonar.js';
import { Pulses } from '../render/pulses.js';

const RED = [1.0, 0.13, 0.08];
const SONAR = [0.84, 0.92, 1.0]; // cold, colourless light
const STONE = [0.85, 0.95, 1.0];
const HOWL = [1.0, 0.36, 0.1];
const LAMPC = [1.0, 0.74, 0.42];
const MORNING_LIGHT = 0.95;
const NO_LOOK = { dx: 0, dy: 0 };
const SRC_SELF = new Set(['voice', 'ping', 'step', 'bump', 'breath', 'repair', 'door', 'flare']);
const _v = new THREE.Vector3();
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class Game {
  constructor(deps) {
    Object.assign(this, deps); // scene, camera, world, pulses, ghosts, eyes, particles, audio, mic, input, hud, radar, post
    this.player = new Player(this.world);
    this.dread = new Dread(this, this.eyes);
    this.shards = new Shards(this.scene);
    this.stones = new Stones();
    this.shade = new ShadeRig();
    this.objectives = new Objectives(this);
    this.doors = new Doors(this);
    this.flares = new Flares(this);
    this.hud.onNoteClose = () => this.objectives.closeNote();
    this.events = [];
    this.monsters = [];
    this.timeline = [];
    this.noiseGen = new Simplex2(99);
    this.state = 'idle';
    this.fx = this._fxDefaults();
    this.time = 0;
    this.score = 0;
    this.mult = 1;
    this.hearingScale = 1;
    this.speedScale = 1;
    this.onEnd = null; // (result) => void
    // co-op
    this.role = 'solo'; // solo | host | client
    this.coop = null;
    this.sync = null;
    this.remotes = new Map(); // id -> RemotePlayer
    this.spectate = null; // { target } once you're dead and watching someone
    this.inputMuted = false; // co-op pause: the world goes on, you just stand there
    this.netT = 0; // the host's night clock (guests)
    this.scareRigs = {};
    this._ears = { x: 0, y: 0, z: 0 };
  }

  // ---------------- co-op: who is where ----------------
  get auth() {
    return this.role !== 'client'; // this machine decides what the monsters do
  }
  get online() {
    return this.role !== 'solo';
  }

  livePlayers() {
    const a = [];
    if (this.player.alive) a.push(this.player);
    for (const r of this.remotes.values()) if (r.alive) a.push(r);
    return a;
  }
  isPlayer(p) {
    return p === this.player || (!!p && this.remotes.get(p.id) === p);
  }
  playerById(id) {
    if (id === this.player.id) return this.player;
    return this.remotes.get(id) || null;
  }
  localAlive() {
    return this.player.alive;
  }
  monsterById(id) {
    for (const m of this.monsters) if (m.id === id) return m;
    return null;
  }
  // where "you" hear and see from: yourself, or the friend you're watching after you died
  ears() {
    return this._ears;
  }
  _updateEars() {
    const e = this._ears;
    const watched = this.spectate && this.spectate.target;
    const src = watched || this.player;
    e.x = src.x;
    e.y = src.y + (src.eyeCur || 1.6);
    e.z = src.z;
  }
  distToEars(x, z) {
    return Math.hypot(this._ears.x - x, this._ears.z - z);
  }

  // join a co-op night: players = [{ id, name, slot }] from the host's start message
  setupOnline(coop, players) {
    this.coop = coop;
    this.role = coop.isHost ? 'host' : 'client';
    this.sync = new NetSync(this, coop);
    this.player.id = coop.selfId;
    for (const r of this.remotes.values()) if (r.liveGhost) this.ghosts.release(r.liveGhost);
    this.remotes.clear();
    for (const p of players) {
      if (p.id === coop.selfId) continue;
      const r = new RemotePlayer(this, p);
      this.remotes.set(p.id, r);
      this.audio.voiceSpatial(p.id, true);
    }
    this.teamSize = players.length;
  }

  setupSolo() {
    for (const r of this.remotes.values()) if (r.liveGhost) this.ghosts.release(r.liveGhost);
    this.remotes.clear();
    this.role = 'solo';
    this.coop = null;
    this.sync = null;
    this.player.id = 'me';
    this.teamSize = 1;
  }

  // leaving a co-op night (game over / back to the menu): voices go back to the lobby
  teardownOnline() {
    for (const id of this.audio.voices.keys()) {
      this.audio.voiceSpatial(id, false);
      this.audio.voiceSet(id, 0, 0, 0, 1);
    }
    for (const r of this.remotes.values()) {
      if (r.liveGhost) this.ghosts.release(r.liveGhost);
      r.liveGhost = null;
      this.audio.voiceSpatial(r.id, false);
      this.audio.voiceSet(r.id, 0, 0, 0, 1);
    }
  }

  removeRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    if (r.liveGhost) this.ghosts.release(r.liveGhost);
    this.remotes.delete(id);
    if (this.state !== 'over') this.hud.popup(t('mateLeft').replace('{name}', r.name), 'dim');
    if (this.spectate && this.spectate.target === r) this.nextSpectate();
    if (this.auth) this.checkTeam();
  }

  _fxDefaults() {
    return { trauma: 0, glitch: 0, red: 0, white: 0, shockT: 9, shockAmp: 0, fovKick: 0, danger: 0, slowT: 0, timeScale: 1, fade: 1, aberr: 0.12 };
  }

  // ---------------- lifecycle ----------------
  reset(opts = {}) {
    this.rng = new RNG(opts.seed != null ? opts.seed >>> 0 : (Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.time = 0;
    this.score = 0;
    this.mult = 1;
    this.stats = { shards: 0, close: 0, escapes: 0, loudest: 0, hunts: 0, gens: 0, bodies: 0, thrown: 0, flares: 0, seen: {} }; // seen: creatures that showed themselves (the atlas)
    this.state = 'morning';
    this.grace = true;
    this.fx = this._fxDefaults();
    this.timeline = [];
    this.player.reset(opts.slot || 0);
    this.player.alive = true;
    this.spectate = null;
    this.localDeath = false;
    this.inputMuted = false;
    this.teamOverAt = 0;
    this.netT = 0;
    for (const r of this.remotes.values()) r.liveGhost = null;
    this.pulses.clear();
    this.ghosts.clear();
    this.particles.clear();
    this.stones.clear();
    this.flares.clear();
    this.doors.reset();
    this.radar.clear();
    for (const m of this.monsters) m.dispose();
    this.monsters = [];
    this.shards.reset(this.world, this.rng);
    this.objectives.reset(this.rng);
    this.setFlares(0, false);
    this.objectives.setMorning(true);
    this.charge = { active: false, t: 0 };
    this.pingCD = 0;
    this.stepNoise = 0;
    this.killer = null;
    this.deathT = 0;
    this.dawnT = 0;
    this.morningT = 0;
    this.duskT = 0;
    this.duskHit = false;
    this.leashT = 0;
    this.morningAudio = false;
    this.events = [];
    this._resetNight();
    shared.uDawn.value = MORNING_LIGHT;
    shared.uMorning.value = 1;
    shared.uSun.value.set(0.42, 0.62, -0.66).normalize(); // a high, friendly sun
    shared.uFear.value = 0;
    this.dread.reset();
    this.hud.setIntro(null);
    this.hud.setHint(null);
    this.hud.setUse(null);
    this.hud.showNote(null);
    this.hud.setSkip(true);
  }

  // everything that measures the night starts from zero when the light dies
  _resetNight() {
    this.lastHeardAlert = -10;
    this.lastScreamAlert = -10;
    this.screamFlag = false;
    this.nextScare = 80 + this.rng.float(0, 35);
    this.scareCount = 0;
    this.firstPingT = -1;
    this.lastPulseT = -9;
    this.intro = { t: 0, phase: 0, autoSnap: false, revealDone: false, itHearsT: -1 };
    this.tut = { step: 0, t: 0, done: settings.tutorialDone };
    this.lastMultStep = 1;
    this.endgame = false;
    this.wakeT = 0;
    this.hinted = {};
  }

  // ---------------- morning → dusk → night ----------------
  updateMorning(dt, raw) {
    const p = this.player;
    this.morningT += dt;
    this.time += dt;
    if (!this.morningAudio && this.audio.ready && this.audio.ambOn) {
      this.morningAudio = true;
      this.audio.setMorning(true);
    }
    this.netFrame(dt);
    for (const e of this.inputMuted ? [] : raw.events) {
      if (e === 'confirm' || e === 'skip') {
        if (this.auth) {
          this.startDusk();
          return;
        }
        this.coop.toHost('sk', 1); // a guest asks; the host's word starts the dusk for everyone
      }
    }
    if (this.state !== 'morning') return;
    const pev = p.update(dt, this.input, this.inputMuted ? NO_LOOK : raw.look, this.inputMuted);
    if (pev.step) this.audio.footstep(pev.step.intensity * 0.8);
    if (pev.bump) {
      this.audio.bump();
      this.addTrauma(0.12);
    }
    // stay around the camp — there's nothing out there you need yet
    const cx = 0, cz = 3, R = CFG.CAMP_LEASH;
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d > R) {
      p.x = cx + (dx / d) * R;
      p.z = cz + (dz / d) * R;
      p.vx *= 0.2;
      p.vz *= 0.2;
      this.leashT = 2.8;
    }
    const hud = this.hud;
    if (this.morningT > 0.8 && this.morningT < 7.5) hud.setIntro(t('morningBig'), t('morningSmall'));
    else hud.setIntro(null);
    let hint = null;
    if (this.morningT > 8 && this.morningT < 17) hint = this.input.touch ? t('morningHintTouch') : t('morningHint');
    else if (this.morningT > 19 && this.morningT < 26) hint = t('morningGen');
    if (this.leashT > 0) {
      this.leashT -= dt;
      hint = t('campLeash');
    }
    hud.setHint(hint);
    this.objectives.update(dt, false);
    this.doors.update(dt);
    this.pulses.update(this.time);
    this.audio.morningTick();
    this.fx.danger = 0;
    this._commonFx(dt);
    if (this.morningT >= CFG.MORNING_SECONDS + (this.auth ? 0 : 6)) this.startDusk(); // a guest only goes alone if the host never says
  }

  startDusk() {
    if (this.state !== 'morning') return;
    this.state = 'dusk';
    this.duskT = 0;
    this.duskHit = false;
    this.duskLight = shared.uDawn.value;
    this.hud.setIntro(null);
    this.hud.setHint(null);
    this.hud.setSkip(false);
    this.audio.dusk();
    this.objectives.campFail();
    if (this.role === 'host') this.sync.ev('du');
  }

  updateDusk(dt, raw) {
    this.duskT += dt;
    this.time += dt;
    const k = this.duskT;
    // the light drains in under two seconds, stuttering like a dying bulb — then it's just gone
    let L = this.duskLight * (1 - smoothstep(0.15, 1.75, k));
    if (k > 0.45 && k < 1.75 && Math.sin(k * 61) * Math.sin(k * 23) > 0.2) L *= 0.2;
    shared.uDawn.value = Math.max(0, L);
    this.netFrame(dt);
    this.player.update(dt, this.input, this.inputMuted ? NO_LOOK : raw.look, true); // you stop dead and stare
    if (k >= 1.8 && !this.duskHit) {
      this.duskHit = true;
      shared.uDawn.value = 0;
      this.addTrauma(0.55);
      this.fx.glitch = 0.7;
      this.fx.shockT = 0;
      this.fx.shockAmp = 0.7;
    }
    this.objectives.update(dt, false);
    this.doors.update(dt);
    this.pulses.update(this.time);
    this._commonFx(dt);
    if (k >= CFG.DUSK_SECONDS) this.startNight();
  }

  startNight() {
    this.state = 'play';
    this.time = 0;
    shared.uDawn.value = 0;
    shared.uMorning.value = 0;
    shared.uSun.value.set(0.5, 0.35, -0.8).normalize(); // if you ever see the sky again, it'll be a sunrise
    this.pulses.clear();
    this.ghosts.clear();
    for (const r of this.remotes.values()) r.liveGhost = null;
    this.timeline = [];
    this.audio.setMorning(false);
    this.objectives.setMorning(false);
    this.objectives.startNight();
    this._resetNight();
    this.dread.reset();
    this.hud.setSkip(false);
    this.hud.setIntro(null);
    this.hud.setHint(null);
    if (!this.auth) {
      // a guest's monsters arrive with the host's first snapshot
      for (const m of this.monsters) m.dispose();
      this.monsters = [];
      return;
    }
    // the first thing you'll ever see in the dark: something standing in the trees, facing you
    const p = this.player;
    const f = p.forward();
    let mx = p.x + f.x * 17 + f.z * 2.5, mz = p.z + f.z * 17 - f.x * 2.5;
    for (let k = 0; k < 20 && !this.world.col.free(mx, mz, 0.8); k++) {
      mx += this.rng.float(-2, 2);
      mz += this.rng.float(-2, 2);
    }
    const m = createMonster('listener', this);
    m.spawn(mx, mz, 'idle');
    m.yaw = Math.atan2(p.x - mx, p.z - mz);
    m.scripted = 'freeze';
    m.intro = true;
    this.monsters.push(m);
    this.spawnMonster('listener', 75, 100);
  }

  // how brightly the sound waves light (x, y, z) right now
  lightAt(x, y, z) {
    let L = 0;
    for (const s of this.pulses.slots) {
      if (!s.active) continue;
      L += Pulses.lightAt(s, Math.hypot(x - s.x, y - s.y, z - s.z), this.time);
    }
    return L;
  }

  // what the Howler's wave counts as "moving" (anyone: you, or a teammate by their last report)
  movingForHowler(pl = this.player) {
    if (pl === this.player) return pl.speed > 0.7 || (this.charge.active && this.charge.t > 0.3);
    return pl.speed > 0.7 || !!pl.charging;
  }

  // ---------------- helpers ----------------
  addTrauma(v) {
    const k = settings.scares === 'reduced' ? 0.6 : 1;
    this.fx.trauma = Math.min(1, this.fx.trauma + v * k);
  }

  // somewhere around a living player (any of them), not too close to anyone
  _around() {
    const live = this.livePlayers();
    return live.length ? live[Math.floor(this.rng.next() * live.length)] : this.player;
  }
  _clearOfPlayers(x, z, dmin) {
    for (const q of this.livePlayers()) if (Math.hypot(q.x - x, q.z - z) < dmin) return false;
    return true;
  }

  spawnMonster(type, dmin, dmax) {
    const p = this._around();
    const w = CFG.WORLD_WALL - 6;
    for (let k = 0; k < 40; k++) {
      const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(dmin, dmax);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w) continue;
      if (this.online && !this._clearOfPlayers(x, z, dmin * 0.75)) continue;
      if (!this.world.col.free(x, z, 1)) continue;
      const L = this.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      const m = createMonster(type, this);
      m.spawn(x, z);
      this.monsters.push(m);
      return m;
    }
    return null;
  }

  relocate(m) {
    const p = this._around();
    const w = CFG.WORLD_WALL - 6;
    for (let k = 0; k < 30; k++) {
      const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(55, 85);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w || !this.world.col.free(x, z, 1)) continue;
      if (this.online && !this._clearOfPlayers(x, z, 40)) continue;
      const L = this.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      m.spawn(x, z);
      return;
    }
  }

  // a sound happened in the world (authoritative side: the monsters hear it). pid = who made it
  noise(x, z, loud, source, scream = false, pid = null) {
    if (loud <= 0 || this.state !== 'play' || !this.auth) return 0;
    let n = 0;
    for (const m of this.monsters) {
      const r = m.hear(x, z, loud, source, scream, pid);
      if (r) {
        n++;
        if (r === 'hunt' && scream) {
          m.huntCause = 'scream';
          m.huntCausePid = pid;
        }
      }
    }
    return n;
  }

  // a sound YOU made: heard here (solo / host) or sent to the host (guest)
  playerNoise(x, z, loud, source, scream = false) {
    if (loud <= 0 || this.state !== 'play' || !this.player.alive) return;
    if (this.auth) this.noise(x, z, loud, source, scream, this.player.id);
    else if (SRC_SELF.has(source)) this.sync.noise(x, z, loud, source, scream);
  }

  eyePos() {
    const p = this.player;
    return { x: p.x, y: p.y + p.eyeCur, z: p.z };
  }

  // ---------------- player sound ----------------
  emitPlayerPulse(loud, fromMic) {
    const p = this.player;
    const e = this.eyePos();
    let R = fromMic ? CFG.voiceRevealRadius(loud) : CFG.revealRadius(loud);
    const first = this.firstPingT < 0;
    if (first) {
      R = Math.max(R, 52);
      this.firstPingT = this.time;
      this.onFirstPing(this.player);
    }
    const strength = 0.8 + loud * 0.7;
    this.lastPulseT = this.time;
    if (this.sync) this.sync.ev('pu', +e.x.toFixed(2), +(e.y - 0.25).toFixed(2), +e.z.toFixed(2), +loud.toFixed(3), fromMic ? 1 : 0);
    const s = this.pulses.emit(e.x, e.y - 0.25, e.z, this.time, { radius: R, strength, decay: 0.38 + (1 - loud) * 0.22, color: SONAR, kind: 'player' });
    this.echoTicks(s, loud);
    this.fx.shockT = 0;
    this.fx.shockAmp = 0.35 + loud * 0.75;
    this.addTrauma(0.06 + loud * 0.22);
    this.fx.fovKick = Math.max(this.fx.fovKick, 1.5 + loud * 5);
    this.hud.pulseCross();
    this.audio.sonarSweep(loud, loud > 0.45);
    this.particles.burst(e.x, e.y - 0.4, e.z, 10 + Math.round(loud * 26), { color: [0.5, 0.6, 0.66], speed: 6 + loud * 12, life: 0.55, size: 0.06, gravity: 0, drag: 2.2, dir: { x: 0, y: 0, z: 0 }, cone: 1, spread: 0.5 });
    return s;
  }

  // echo returns: soft clicks from objects as the wave reaches them
  echoTicks(s, loud) {
    const col = this.world.col;
    const list = col.query(s.x, s.z, s.radius);
    const N = 20;
    const best = new Array(N).fill(null);
    const extra = [];
    for (let i = 0; i < list.length; i++) {
      const c = col.caps[list[i]];
      const cx = (c.ax + c.bx) * 0.5, cz = (c.az + c.bz) * 0.5;
      const dx = cx - s.x, dz = cz - s.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.2 || d > s.radius) continue;
      const sec = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * N) % N;
      if (!best[sec] || d < best[sec].d) best[sec] = { d, x: cx, z: cz, k: c.kind };
      else if (extra.length < 14 && Math.random() < 0.05) extra.push({ d, x: cx, z: cz, k: c.kind });
    }
    const kindMap = { [CAP.TREE]: 0, [CAP.ROCK]: 1, [CAP.WOOD]: 2, [CAP.METAL]: 3, [CAP.WATER]: 4, [CAP.EFFIGY]: 2 };
    for (const b of best.concat(extra)) {
      if (!b) continue;
      const gain = (0.22 + loud * 0.5) * Math.pow(1 - b.d / s.radius, 1.3);
      this.audio.tick(b.d / s.speed, this.audio.panOf(b.x, b.z), gain, 0.9 + Math.random() * 0.25, kindMap[b.k] ?? 0);
    }
  }

  pingRelease() {
    const c = this.charge;
    if (!c.active) return;
    c.active = false;
    if (this.pingCD > 0) return;
    this.pingCD = 0.22;
    const held = c.t;
    const loud = held < 0.18 ? 0.24 : lerp(0.32, 1.0, clamp((held - 0.18) / 0.95, 0, 1));
    if (loud < 0.36) this.audio.click(loud);
    else if (loud < CFG.SCREAM) this.audio.clap(loud);
    else this.audio.shout(loud);
    const scream = loud >= CFG.SCREAM;
    this.stats.loudest = Math.max(this.stats.loudest, loud);
    this.emitPlayerPulse(loud, false);
    this.playerNoise(this.player.x, this.player.z, loud, 'ping', scream);
    if (scream) this.onScream();
    this.radar.noiseR = Math.max(this.radar.noiseR, CFG.hearRadius(loud));
  }

  onScream() {
    if (this.time - this.lastScreamAlert > 3) {
      this.hud.flashAlert(t('aDontScream'), 'danger', 1.2);
      this.lastScreamAlert = this.time;
    }
    this.fx.red = Math.max(this.fx.red, 0.25);
    this.addTrauma(0.25);
  }

  throwStone() {
    const p = this.player;
    if (p.stones <= 0) {
      this.hud.popup(t('aNoStones'), 'dim');
      this.hud.flashStones();
      return;
    }
    p.stones--;
    this.stats.thrown++;
    const cp = Math.cos(p.pitch);
    const dx = -Math.sin(p.yaw) * cp, dz = -Math.cos(p.yaw) * cp, dy = Math.sin(p.pitch);
    const e = this.eyePos();
    this.stones.throw(e.x + dx * 0.4, e.y - 0.15, e.z + dz * 0.4, dx, dy, dz);
    if (this.sync) this.sync.ev('st', +(e.x + dx * 0.4).toFixed(2), +(e.y - 0.15).toFixed(2), +(e.z + dz * 0.4).toFixed(2), +dx.toFixed(3), +dy.toFixed(3), +dz.toFixed(3));
    this.audio.throwWhoosh();
    this.addTrauma(0.05);
    if (this.tut.step === 3) this.tut.t = 99;
  }

  onStoneImpact(h, owner = null) {
    const s = this.pulses.emit(h.x, h.y + 0.3, h.z, this.time, { radius: 17, strength: 1.0, decay: 0.55, color: STONE, kind: 'stone' });
    this.echoTicks(s, 0.35);
    this.audio.impact(h.x, h.y, h.z, h.water);
    this.particles.burst(h.x, h.y + 0.15, h.z, h.water ? 26 : 18, {
      color: h.water ? [0.5, 0.8, 1.0] : [0.9, 0.97, 1.0], speed: h.water ? 3.5 : 4.5, up: h.water ? 3 : 1.5,
      life: h.water ? 0.9 : 0.6, size: 0.09, gravity: -9, drag: 1,
    });
    this.radar.blip(h.x, h.z, 'stone');
    this.noise(h.x, h.z, h.water ? 0.5 : 0.46, 'stone', false, owner ?? this.player.id); // every machine simulates every stone; only the host's monsters listen
  }

  // ---------------- the flare gun ----------------
  setFlares(n, has = n > 0) {
    const p = this.player;
    p.flares = n;
    p.hasFlare = has;
    document.body.classList.toggle('has-flare', n > 0);
  }

  // it was lying by the body you just searched
  onFlareFound() {
    this.setFlares(CFG.FLARE.charges);
    this.hud.popup(`+ ${t('flareGun')} · ${t('flareCharges').replace('{n}', CFG.FLARE.charges)}`, 'amber');
    this.hud.flashFlares();
    this.audio.flareFound();
    if (this.sync) this.sync.ev('fg');
    if (!this.hinted.flare) {
      this.hinted.flare = true;
      this.timeline.push({ at: this.time + 1.2, fn: () => this.hud.setHint(t(this.input.touch ? 'hintFlareTouch' : 'hintFlare')) });
      this.timeline.push({ at: this.time + 8.5, fn: () => this.hud.setHint(null) });
    }
  }

  // a teammate found it
  fxMateFlare(r) {
    this.hud.popup(t('mateFlare').replace('{name}', r.name), 'amber');
    for (const b of this.objectives.bodies) if (b.gun) b.gun.visible = false;
  }

  // Q: up it goes. it lights the forest red for a quarter of a minute — and calls everything in it
  fireFlare() {
    const p = this.player;
    if (!p.alive || this.state !== 'play') return;
    if (p.flares <= 0) {
      this.hud.popup(t(p.hasFlare ? 'aNoFlares' : 'aNoFlareGun'), 'dim');
      if (p.hasFlare) this.hud.flashFlares();
      return;
    }
    this.setFlares(p.flares - 1, true);
    this.stats.flares++;
    this.hud.flashFlares();
    // where you look, a touch higher (you fire a flare up, not at things)
    const pitch = clamp(p.pitch + 0.12, -0.6, 1.5);
    const cp = Math.cos(pitch);
    const dx = -Math.sin(p.yaw) * cp, dz = -Math.cos(p.yaw) * cp, dy = Math.sin(pitch);
    const e = this.eyePos();
    const x = e.x + dx * 0.5, y = e.y - 0.1 + dy * 0.5, z = e.z + dz * 0.5;
    this.flares.launch(x, y, z, dx, dy, dz, p.id);
    if (this.sync) this.sync.ev('fl', +x.toFixed(2), +y.toFixed(2), +z.toFixed(2), +dx.toFixed(3), +dy.toFixed(3), +dz.toFixed(3));
    this.audio.flareShot(x, y, z, true);
    this.addTrauma(0.16);
    this.fx.fovKick = Math.max(this.fx.fovKick, 4);
    this.fx.white = Math.max(this.fx.white, 0.1);
    this.particles.burst(x, y, z, 16, { color: [1, 0.55, 0.35], speed: 4, life: 0.4, size: 0.05, gravity: -4, drag: 2, dir: { x: dx, y: dy, z: dz }, cone: 0.35 });
    this.playerNoise(p.x, p.z, CFG.FLARE.launchLoud, 'flare');
    if (!this.hinted.flareLure) {
      this.hinted.flareLure = true;
      this.timeline.push({ at: this.time + 2.2, fn: () => this.hud.setHint(`<span class="red">${t('hintFlareLure')}</span>`) });
      this.timeline.push({ at: this.time + 7.5, fn: () => this.hud.setHint(null) });
    }
  }

  // a teammate fired one: it flies here too
  remoteFlare(r, x, y, z, dx, dy, dz) {
    this.flares.launch(x, y, z, dx, dy, dz, r.id);
    this.audio.flareShot(x, y, z, false);
    const near = Math.max(0, 1 - this.distToEars(x, z) / 30);
    if (near > 0) this.addTrauma(0.1 * near);
  }

  // a teammate made a sound: you see their wave (tinted with their colour) and hear their click / clap / shout
  remotePulse(r, x, y, z, loud, fromMic) {
    loud = Math.max(0, Math.min(1, loud));
    let R = fromMic ? CFG.voiceRevealRadius(loud) : CFG.revealRadius(loud);
    const first = this.firstPingT < 0;
    if (first) R = Math.max(R, 52);
    const c = r.hex;
    const k = 0.32;
    const color = [SONAR[0] * (1 - k) + (((c >> 16) & 255) / 255) * k, SONAR[1] * (1 - k) + (((c >> 8) & 255) / 255) * k, SONAR[2] * (1 - k) + ((c & 255) / 255) * k];
    this.pulses.emit(x, y, z, this.time, { radius: R, strength: 0.8 + loud * 0.7, decay: 0.38 + (1 - loud) * 0.22, color, kind: 'player' });
    if (!fromMic) this.audio.matePing(x, y + 0.25, z, loud, CFG.SCREAM);
    // whoever made the sound flashes up at the heart of their own wave
    if (!(this.spectate && this.spectate.target === r) && this.distToEars(r.x, r.z) > 1.2) {
      this.ghosts.spawn(r.rig, this.time, { strength: 0.55 + loud * 0.6, color: r.hex, life: 1.6 + loud, decay: 1.1, jitter: 0.4 });
      r.revealT = this.time;
    }
    this.lastPulseT = this.time;
    if (first && this.state === 'play') {
      this.firstPingT = this.time;
      this.onFirstPing(r);
    }
  }

  onFirstPing(p = this.player) {
    this.hud.setIntro(null);
    const m = this.auth ? this.monsters.find((q) => q.intro) : null;
    if (m) {
      m.scripted = null;
      this.timeline.push({
        at: this.time + 1.1,
        fn: () => {
          // it walks to where the sound was... but misses you by a few steps
          const f = p.forward();
          m.investigate(p.x - f.z * 3.2, p.z + f.x * 3.2, true);
        },
      });
    }
  }

  onShard(s, i) {
    if (this.sync && i !== undefined) this.sync.ev('sh', i);
    this.stats.shards++;
    const pts = CFG.SCORE.shard * this.mult;
    this.score += pts;
    this.hud.popup(`+${Math.round(pts)} ${t('aShard')}`, 'amber');
    this.audio.shardPickup(this.stats.shards);
    this.particles.burst(s.x, s.y, s.z, 40, { color: [1.0, 0.7, 0.25], speed: 5, up: 2, life: 1.0, size: 0.11, gravity: -4, drag: 1.6 });
    this.particles.burst(s.x, s.y, s.z, 16, { color: [1.0, 0.9, 0.6], speed: 9, life: 0.35, size: 0.06, gravity: 0, drag: 3 });
    this.fx.white = Math.max(this.fx.white, 0.06);
    this.addTrauma(0.08);
    const p = this.player;
    if (p.stones < CFG.PLAYER.maxStones) p.stones++;
    // a little amber pulse of light
    this.pulses.emit(s.x, s.y, s.z, this.time, { radius: 7, strength: 0.6, decay: 1.4, color: [1.0, 0.72, 0.35], kind: 'shard' });
  }

  onMonsterHunt(m) {
    const pid = m.tgt ? m.tgt.id : null;
    if (this.role === 'host') this.sync.ev('hu', m.id, pid);
    this.fxHunt(m, pid);
  }

  fxHunt(m, pid) {
    const mine = pid == null || pid === this.player.id;
    if (mine) this.stats.hunts++;
    if (m.type === 'howler') {
      this.audio.howlerBark(m.x, m.y + 1.8, m.z);
      this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 20, strength: 0.9, decay: 0.8, color: HOWL, kind: 'monster' });
      if (!this.hinted.howlSpot && mine && this.player.alive) {
        this.hinted.howlSpot = true;
        this.hud.setHint(`<span class="red">${t('hintHowlerSpot')}</span>`);
        this.timeline.push({ at: this.time + 4.5, fn: () => this.hud.setHint(null) });
      }
    } else {
      this.audio.screech(m.x, m.y + 2.4, m.z, 1);
      this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 26, strength: 0.95, decay: 0.75, color: RED, kind: 'monster' });
    }
    if (!mine || !this.player.alive) {
      // it's after someone else: you still hear it, and it still shakes you if it's close
      const k = Math.max(0, 1 - m.playerDist / 40);
      if (k > 0) this.addTrauma(0.25 * k);
      return;
    }
    this.hud.flashAlert(t('aHunt'), 'danger', 1.8);
    this.fx.glitch = Math.max(this.fx.glitch, 0.65);
    this.fx.red = Math.max(this.fx.red, 0.3);
    this.addTrauma(0.45);
  }

  onMonsterInvestigate(m, d, pid = null) {
    if (this.role === 'host') this.sync.ev('in', m.id, pid, Math.round(d));
    this.fxInvestigate(m, d, pid);
  }

  fxInvestigate(m, d, pid) {
    const mine = pid == null || pid === this.player.id;
    if (mine && this.player.alive && this.time - this.lastHeardAlert > 6 && d < 65 && !m.intro) {
      this.hud.flashAlert(t('aHeard'), 'warn', 1.3);
      this.lastHeardAlert = this.time;
    }
    if (this.time - (m.lastGrowl || -9) > 5) {
      this.audio.growl(m.x, m.y + 2.4, m.z, 0.55);
      m.lastGrowl = this.time;
    }
  }

  onMonsterLost(m) {
    const pid = m.tgt ? m.tgt.id : null;
    if (this.role === 'host') this.sync.ev('lo', m.id, pid);
    this.fxLost(m, pid);
  }

  fxLost(m, pid) {
    if (this.state !== 'play' || !this.player.alive) return;
    if (pid != null && pid !== this.player.id) return;
    if (m.playerDist > 7) {
      this.stats.escapes++;
      const pts = CFG.SCORE.escape * this.mult;
      this.score += pts;
      this.hud.popup(`+${Math.round(pts)} ${t('aEscaped')}`, 'cyan');
      this.fx.slowT = 0.5;
    }
  }

  // ---------------- the Howler ----------------
  onHowlerInhale(m) {
    if (this.role === 'host') this.sync.ev('ih', m.id);
    this.fxInhale(m);
  }

  fxInhale(m) {
    this.audio.howlerInhale(m.x, m.y + 1.8, m.z);
    const d = m.playerDist;
    if (d < m.cfg.howlR + 8) {
      this.fx.danger = Math.max(this.fx.danger, 0.5);
      if (!this.hinted.howl && this.player.alive) {
        this.hinted.howl = true;
        this.hud.setHint(`<span class="red">${t('hintHowler')}</span>`);
        this.timeline.push({ at: this.time + 4.2, fn: () => this.hud.setHint(null) });
      }
    }
  }

  onHowl(m) {
    if (this.role === 'host') this.sync.ev('hw', m.id);
    this.fxHowl(m);
  }

  fxHowl(m) {
    const R = m.cfg.howlR;
    this.audio.howlerHowl(m.x, m.y + 2.2, m.z, 1);
    // the howl is a wave of its own: it lights the forest red for everyone, you included
    const s = this.pulses.emit(m.x, m.y + 2.0, m.z, this.time, { radius: R, strength: 1.05, decay: 0.55, color: HOWL, kind: 'monster' });
    this.echoTicks(s, 0.5);
    const d = m.playerDist;
    if (d < R) {
      const k = 1 - d / R;
      this.addTrauma(0.2 + 0.4 * k);
      this.fx.red = Math.max(this.fx.red, 0.2 + 0.3 * k);
      this.fx.shockT = 0;
      this.fx.shockAmp = 0.3 + 0.6 * k;
    }
    this.radar.blip(m.x, m.z, 'monster', true);
  }

  onHowlerBark(m) {
    if (this.role === 'host') this.sync.ev('hb', m.id);
    this.fxBark(m);
  }

  fxBark(m) {
    this.audio.howlerBark(m.x, m.y + 1.8, m.z);
    this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 18, strength: 0.8, decay: 0.9, color: HOWL, kind: 'monster' });
    if (m.playerDist < 18) this.addTrauma(0.12);
  }

  // the two that come later: one of each, ever
  updateArrivals() {
    const n = this.objectives.count;
    for (const type of ['watcher', 'howler']) {
      if (this.monsters.some((m) => m.type === type)) continue;
      const c = CFG.MONSTER[type];
      const due = this.time >= c.arrive || (n >= c.arriveGens && this.time >= c.arrive * 0.5);
      if (!due || this.state !== 'play') continue;
      let h = null;
      if (type === 'watcher') {
        const w = createMonster('watcher', this);
        w.vanish(6);
        this.monsters.push(w);
      } else {
        h = this.spawnMonster('howler', 70, 110);
        if (!h) continue;
        h.howlT = 26;
      }
      if (this.role === 'host') this.sync.ev('ar', type, h ? Math.round(h.x) : 0, h ? Math.round(h.z) : 0);
      this.fxArrive(type, h ? h.x : null, h ? h.z : null);
    }
  }

  fxArrive(type, hx = null, hz = null) {
    if (type === 'watcher') this.audio.watcherArrive();
    else {
      // far away, it announces itself
      const p = this.ears();
      const x = hx ?? p.x + 90, z = hz ?? p.z;
      this.audio.howlerHowl(x, this.world.terrain.height(x, z) + 2.2, z, 0.8);
    }
    this.hud.flashAlert(t(type === 'watcher' ? 'aWatcherArrive' : 'aHowlerArrive'), 'warn', 2.6);
    this.audio.sting(0.3);
  }

  // ---------------- objectives ----------------
  onCorpseSearched(body, k) {
    this.stats.bodies++;
    const pts = CFG.SCORE.corpse * this.mult;
    this.score += pts;
    this.hud.popup(`+${Math.round(pts)} ${t('aFound')}: ${t('parts')[CFG.GENERATORS[k].part]}`, 'amber');
    this.particles.burst(body.x, body.y + 0.3, body.z, 18, { color: [1.0, 0.72, 0.3], speed: 2.5, up: 1.5, life: 0.8, size: 0.06, gravity: -4, drag: 2 });
    this.audio.heartbeat(0.7);
    this.addTrauma(0.06);
    this.playerNoise(body.x, body.z, 0.1, 'repair');
  }

  // a teammate found a part
  fxMateFound(r, k) {
    const spec = CFG.GENERATORS[k];
    if (!spec) return;
    this.hud.popup(t('mateFound').replace('{name}', r.name).replace('{part}', t('parts')[spec.part]), 'amber');
  }

  onSpark(g, remote = false) {
    const x = g.x, y = g.y + 0.7, z = g.z;
    this.audio.spark(x, y, z);
    this.particles.burst(x, y, z, 34, { color: [1.0, 0.9, 0.55], speed: 7, up: 2.5, life: 0.55, size: 0.05, gravity: -9, drag: 1.2 });
    this.pulses.emit(x, y, z, this.time, { radius: 8, strength: 0.95, decay: 1.6, color: [0.85, 0.92, 1.0], kind: 'stone' });
    if (!remote) this.playerNoise(x, z, g.spec.sparkLoud, 'repair');
    const near = Math.max(0, 1 - this.distToEars(x, z) / 12);
    this.addTrauma(0.18 * (remote ? near : 1));
    if (!remote || near > 0.5) {
      this.fx.white = Math.max(this.fx.white, 0.12);
      this.fx.glitch = Math.max(this.fx.glitch, 0.3);
    }
  }

  onSpinUp(g) {
    this.hud.flashAlert(t('aSpinUp'), 'warn', 2.2);
    this.audio.sting(0.25);
  }

  onGeneratorStarted(g, count, by = null) {
    this.stats.gens = count;
    const pts = CFG.SCORE.generator * this.mult;
    this.score += pts;
    this.hud.popup(by ? `+${Math.round(pts)} · ${t('mateStarted').replace('{name}', by.name)}` : `+${Math.round(pts)}`, 'amber');
    this.hud.flashAlert(t('aGenOn').replace('{n}', count), 'dawn', 2.6);
    this.hud.peek(4);
    // the light coming back: a warm wave rolls out from the lamp
    const L = g.site.lamp;
    this.pulses.emit(L.x, L.y - 1, L.z, this.time, { radius: 24, strength: 1.0, decay: 0.45, color: LAMPC, kind: 'shard' });
    this.particles.burst(L.x, L.y, L.z, 30, { color: [1.0, 0.82, 0.5], speed: 4, life: 0.9, size: 0.06, gravity: -3, drag: 1.6 });
    this.fx.white = Math.max(this.fx.white, 0.08);
    this.addTrauma(0.15);
    this.noise(g.x, g.z, g.spec.startLoud, 'repair'); // the engine roars — the host's monsters hear it whoever started it
    if (count >= 5 && this.auth) this.timeline.push({ at: this.time + 1.4, fn: () => { if (this.state === 'play') this.startDawn(); } });
  }

  // ---------------- death ----------------
  kill(m, victim = this.player) {
    if (this.state !== 'play') return;
    const cause = m.huntCause === 'scream' && (m.huntCausePid == null || m.huntCausePid === victim.id) ? 'scream' : m.type;
    if (victim !== this.player) {
      // co-op host: one of the others was caught. it stays with the body; the rest can get away
      if (!victim.alive) return;
      victim.die(victim.x, victim.z);
      victim.cause = cause;
      this.sync.ev('ki', m.id, victim.id, cause, +victim.x.toFixed(2), +victim.z.toFixed(2));
      m.feed();
      this.fxMateDied(victim, m);
      this.checkTeam();
      return;
    }
    if (!this.player.alive) return;
    if (this.online) {
      if (this.auth) {
        this.sync.ev('ki', m.id, this.player.id, cause, +this.player.x.toFixed(2), +this.player.z.toFixed(2));
        m.feed();
      }
      this.localDie(m, cause);
      if (this.auth) this.checkTeam();
      return;
    }
    this.state = 'dying';
    this.beginDeath(m, cause);
  }

  // the host says someone was caught
  netKill(mid, pid, cause, x, z) {
    if (this.state !== 'play') return;
    const m = this.monsterById(mid);
    if (pid === this.player.id) {
      if (!this.player.alive) return;
      this.localDie(m || { type: 'listener', x: this.player.x + 1, z: this.player.z, id: -1 }, cause || 'listener');
      return;
    }
    const r = this.remotes.get(pid);
    if (!r || !r.alive) return;
    r.die(x, z);
    r.cause = cause;
    this.fxMateDied(r, m);
  }

  // co-op: you're dead, the night goes on without you
  localDie(m, cause) {
    const p = this.player;
    p.alive = false;
    this.localDeath = true;
    this.charge.active = false;
    this.hud.setUse(null);
    this.objectives.closeNote();
    this.objectives.target = null;
    this.beginDeath(m, cause);
  }

  fxMateDied(r, m) {
    const near = this.distToEars(r.x, r.z) < 30;
    this.audio.mateDeath(r.x, r.y + 1.4, r.z, near);
    if (m && m.x !== undefined) this.pulses.emit(r.x, r.y + 1.2, r.z, this.time, { radius: near ? 18 : 12, strength: 0.9, decay: 0.8, color: RED, kind: 'monster' });
    this.hud.flashAlert(t('mateDied').replace('{name}', r.name), 'danger', 2.4);
    this.addTrauma(near ? 0.4 : 0.15);
    this.fx.red = Math.max(this.fx.red, near ? 0.35 : 0.15);
    if (this.spectate && this.spectate.target === r) this.timeline.push({ at: this.time + 1.6, fn: () => this.nextSpectate() });
  }

  // host: nobody left standing → in a moment, the night ends for everyone
  checkTeam() {
    if (!this.auth || !this.online || this.state !== 'play' || this.teamOverAt) return;
    if (this.livePlayers().length === 0) this.teamOverAt = this.time + 2.3;
  }

  // the end of a co-op night that nobody survived (or the host vanished)
  endOnline(won, extra = {}) {
    if (this.state === 'over' || this.state === 'idle') return;
    if (this.role === 'host' && !won) this.sync.ev('en');
    if (this.jsGhost) this.ghosts.release(this.jsGhost);
    this.jsGhost = null;
    this.state = 'over';
    this.fx.fade = 0;
    this.audio.setAmbience(0, 0);
    if (this.onEnd) this.onEnd({ won, cause: this.cause || 'listener', coop: true, alive: this.player.alive, ...extra });
  }

  hostLost() {
    if (this.state === 'over' || this.state === 'idle') return;
    this.endOnline(false, { hostLost: true });
  }

  scareRig(type) {
    return (this.scareRigs[type] ||= buildRig(type));
  }

  enterSpectate() {
    this.spectate = { target: null };
    this.nextSpectate();
    this.fx.fade = 1;
    this.fx.red = 0.2;
    document.body.classList.add('spectating');
  }

  nextSpectate() {
    if (!this.spectate) return;
    const live = [...this.remotes.values()].filter((r) => r.alive);
    const i = live.indexOf(this.spectate.target);
    this.spectate.target = live.length ? live[(i + 1) % live.length] : null;
    this.spectLabel = null;
  }

  beginDeath(m, cause) {
    this.stats.seen[m.type] = 1;
    this.deathT = 0;
    this.killer = m;
    this.killType = m.type;
    this.killX = m.x;
    this.killZ = m.z;
    this.cause = cause;
    const reduced = settings.scares === 'reduced';
    this.audio.jumpscare(reduced ? 0.45 : 1);
    this.fx.trauma = reduced ? 0.6 : 1;
    this.fx.white = reduced ? 0 : 0.85;
    this.fx.red = 0.7;
    this.fx.glitch = 1;
    this.hud.setHint(null);
    this.hud.setIntro(null);
    this.hud.peekUntil = 0;
    for (const q of this.monsters) if (q !== m && q.breath) { q.breath.stop(); q.breath = null; }
    this.jsGhost = null;
    this.jsYaw = Math.atan2(-(m.x - this.player.x), -(m.z - this.player.z));
  }

  // the kill: it's in your face. solo → game over; co-op → you watch the others
  updateDying(dt) {
    this.deathT += dt;
    const p = this.player;
    const reduced = settings.scares === 'reduced';
    // whip the camera to face it
    const want = Math.atan2(-(this.killX - p.x), -(this.killZ - p.z));
    let da = want - p.yaw;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    p.yaw += da * Math.min(1, dt * 25);
    p.pitch = damp(p.pitch, 0.05, 20, dt);
    // pose the killer in your face (a stand-in rig: the real one may already be walking away)
    const type = this.killType;
    const rig = this.scareRig(type);
    const n = rig.nodes;
    const tt = this.deathT;
    if (type === 'listener') {
      n.spine.rotation.x = 0.95;
      n.neck.rotation.x = -0.4;
      n.head.rotation.x = 0.45;
      n.head.rotation.z = Math.sin(tt * 45) * 0.12;
      n.head.rotation.y = Math.sin(tt * 33) * 0.08;
      n.jaw.rotation.x = 0.85 + Math.sin(tt * 38) * 0.18;
      n.shoulderL.rotation.x = -2.1; n.shoulderR.rotation.x = -2.1;
      n.shoulderL.rotation.z = -0.5; n.shoulderR.rotation.z = 0.5;
      n.elbowL.rotation.x = -0.5; n.elbowR.rotation.x = -0.5;
    } else if (type === 'watcher') {
      // its face comes apart down the middle
      const open = Math.min(1, tt * 3.2);
      n.faceL.rotation.y = -1.1 * open;
      n.faceR.rotation.y = 1.1 * open;
      n.head.rotation.z = 0.9 + Math.sin(tt * 40) * 0.08;
      n.neck.rotation.x = 0.5;
      n.spine.rotation.x = 0.7;
      n.shoulderL.rotation.x = -2.5; n.shoulderR.rotation.x = -2.5;
      n.shoulderL.rotation.z = -0.7; n.shoulderR.rotation.z = 0.7;
      n.elbowL.rotation.x = -0.9; n.elbowR.rotation.x = -0.9;
    } else if (type === 'howler') {
      n.pelvis.rotation.x = 0.1;
      n.chest.rotation.x = 0.15;
      n.chest.scale.setScalar(1);
      n.neck.rotation.x = 0.1;
      n.head.rotation.x = -0.2 + Math.sin(tt * 36) * 0.08;
      n.head.rotation.z = Math.sin(tt * 47) * 0.15;
      n.jaw.rotation.x = 1.15 + Math.sin(tt * 30) * 0.15;
      n.shoulderL.rotation.x = -1.6; n.shoulderR.rotation.x = -1.6;
      n.shoulderL.rotation.z = -0.9; n.shoulderR.rotation.z = 0.9;
    } else {
      n.head.rotation.z = Math.sin(tt * 50) * 0.2;
      n.jaw.rotation.x = 0.9 + Math.sin(tt * 40) * 0.2;
      n.body.rotation.x = -0.6;
    }
    const camY = p.y + p.eyeCur;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const r = rig.root;
    r.position.set(0, 0, 0);
    r.rotation.set(0, Math.atan2(-fx, -fz), 0);
    r.updateMatrixWorld(true);
    n.head.getWorldPosition(_v);
    const lunge = Math.max(0, 1 - tt * 5);
    const dist = (type === 'listener' ? 1.05 : type === 'howler' ? 1.3 : type === 'watcher' ? 0.9 : 0.95) + lunge * 1.8;
    r.position.set(p.x + fx * dist - _v.x, camY - _v.y + 0.12, p.z + fz * dist - _v.z);
    const strobe = reduced ? 1 : (Math.floor(tt * 14) % 2 === 0 ? 1.6 : 0.35);
    if (!this.jsGhost) this.jsGhost = this.ghosts.spawn(rig, this.time, { sticky: true, strength: strobe, full: 1, color: type === 'watcher' ? 0xe8eef4 : type === 'howler' ? 0xff5a18 : 0xff3020 });
    else {
      this.ghosts.refresh(this.jsGhost, rig);
      this.jsGhost.strength = strobe;
    }
    this.fx.trauma = Math.max(this.fx.trauma, reduced ? 0.4 : 0.8 - tt * 0.3);
    this.fx.glitch = Math.max(this.fx.glitch, 0.6);
    this.fx.red = Math.max(this.fx.red, 0.4);
    this.fx.fovKick = -12;
    if (tt > 1.45) {
      this.fx.fade = Math.max(0, 1 - (tt - 1.45) * 4);
    }
    if (tt > 1.75) {
      this.ghosts.release(this.jsGhost);
      this.jsGhost = null;
      if (this.online) {
        this.localDeath = 'done';
        this.enterSpectate();
        return;
      }
      this.state = 'over';
      this.fx.fade = 0;
      this.audio.setAmbience(0, 0);
      if (this.onEnd) this.onEnd({ won: false, cause: this.cause });
    }
  }

  // ---------------- dawn ----------------
  // all five generators run: the lamps flare, the dark backs off, and the sky goes pale
  startDawn() {
    this.state = 'dawn';
    this.dawnT = 0;
    this.hud.setIntro(null);
    this.hud.intro.classList.remove('red');
    this.hud.setUse(null);
    this.objectives.closeNote();
    if (this.role === 'host') this.sync.ev('dn');
    const tNight = this.role === 'client' && this.netT > 0 ? this.netT : this.time;
    this.winBonus = CFG.SCORE.win + Math.max(0, Math.round(CFG.RUN_SECONDS - tNight)) * CFG.SCORE.speedBonus;
    if (!this.player.alive) this.winBonus = Math.round(this.winBonus * 0.3); // your team made it; you didn't
    this.score += this.winBonus;
    this.audio.dawn();
    this.audio.setAmbience(0.25, 0);
    this.hud.setHint(null);
    for (const m of this.monsters) m.setState('flee');
    this.hud.flashAlert(t('winTitle'), 'dawn', 3);
  }

  updateDawn(dt) {
    this.dawnT += dt;
    shared.uDawn.value = smoothstep(0, 5, this.dawnT) * 0.85 + 0.15;
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (this.dawnT > 1.5) {
        m.dispose();
        this.monsters.splice(i, 1);
      } else m.update(dt, this.time);
    }
    if (this.dawnT > 7 && this.state === 'dawn') {
      this.state = 'won';
      if (this.onEnd) this.onEnd({ won: true, coop: this.online, alive: this.player.alive });
    }
  }

  // ---------------- scares ----------------
  scare() {
    const opts = ['apparition', 'snap', 'whisper', 'runner'];
    if (this.mic.snippets.length) opts.push('mimic', 'mimic');
    let kind = this.rng.pick(opts);
    if (this.scareCount === 0) kind = 'snap';
    this.scareCount++;
    // the forest holds its breath first (sometimes something inhales behind you), then the hit
    const reduced = settings.scares === 'reduced';
    const lead = kind === 'whisper' ? 1.4 : this.rng.float(0.75, 1.15);
    this.audio.preScare(lead, kind === 'whisper' ? 'silence' : null, reduced ? 0.6 : 1);
    this.timeline.push({ at: this.time + lead, fn: () => { if (this.state === 'play' && this.player.alive) this['scare_' + kind](); } });
  }

  _ahead(d, lateral = 0) {
    const p = this.player;
    const f = p.forward();
    const x = p.x + f.x * d + -f.z * lateral, z = p.z + f.z * d + f.x * lateral;
    return { x, z, y: this.world.terrain.height(x, z) };
  }

  scare_apparition() {
    const p = this.player;
    const a = this._ahead(this.rng.float(2.8, 4.2), this.rng.float(-0.6, 0.6));
    this.shade.place(a.x, a.y, a.z, Math.atan2(p.x - a.x, p.z - a.z));
    const reduced = settings.scares === 'reduced';
    this.pulses.emit(p.x, p.y + 1.3, p.z, this.time, { radius: 9, strength: 0.75, decay: 2.2, color: [1, 0.85, 0.82], kind: 'scare' });
    this.stats.seen.shade = 1;
    this.ghosts.spawn(this.shade.rig, this.time, { strength: reduced ? 0.9 : 1.6, life: 0.6, decay: 3.5, color: 0xff3a2a, full: 0.7 });
    this.audio.sting(reduced ? 0.6 : 1);
    this.addTrauma(0.55);
    this.fx.glitch = 0.8;
    if (!reduced) this.fx.white = 0.22;
    this.radar.blip(a.x, a.z, 'unknown');
  }

  scare_runner() {
    const p = this.player;
    const side = this.rng.sign();
    const d = this.rng.float(9, 13);
    {
      // you hear it coming before you see it: the sound sweeps the whole path at ~18 m/s
      const f = p.forward();
      const at = (lat) => [p.x + f.x * d - f.z * lat, p.y + 0.4, p.z + f.z * d + f.x * lat];
      this.audio.runnerPass(...at(-9.5 * side), ...at(9.5 * side), 1.05);
    }
    for (let i = 0; i < 5; i++) {
      this.timeline.push({
        at: this.time + 0.25 + i * 0.14,
        fn: () => {
          const f = p.forward();
          const lat = side * (-5 + i * 2.5);
          const x = p.x + f.x * d - f.z * lat, z = p.z + f.z * d + f.x * lat;
          const y = this.world.terrain.height(x, z);
          this.shade.place(x, y, z, Math.atan2(-f.z * side, f.x * side));
          this.shade.rig.root.rotation.x = 0.25;
          this.stats.seen.shade = 1;
          this.ghosts.spawn(this.shade.rig, this.time, { strength: 1.1, life: 0.9, decay: 2.5, color: 0xff3a2a });
          this.shade.rig.root.rotation.x = 0;
          if (i === 0) this.pulses.emit(p.x, p.y + 1.3, p.z, this.time, { radius: 16, strength: 0.45, decay: 1.6, color: [1, 0.85, 0.82], kind: 'scare' });
        },
      });
    }
    this.addTrauma(0.2);
    this.fx.glitch = 0.35;
  }

  scare_snap() {
    const p = this.player;
    const f = p.forward();
    const lat = this.rng.float(-5, 5);
    const d = -this.rng.float(5, 8);
    const x = p.x + f.x * d - f.z * lat, z = p.z + f.z * d + f.x * lat;
    const y = this.world.terrain.height(x, z);
    this.audio.branchSnap(x, y + 1.2, z, 1.7, true); // ...then one slow step, and a breath
    this.pulses.emit(x, y + 1.0, z, this.time, { radius: 9, strength: 0.9, decay: 0.9, color: [0.85, 0.9, 1], kind: 'scare' });
    if (this.rng.chance(0.45)) {
      this.shade.place(x, y, z, Math.atan2(p.x - x, p.z - z));
      this.stats.seen.shade = 1;
      this.ghosts.spawn(this.shade.rig, this.time, { strength: 1.0, life: 1.6, decay: 1.4, color: 0xff3a2a });
    }
    this.radar.blip(x, z, 'unknown');
    this.addTrauma(0.15);
  }

  scare_whisper() {
    // right behind your head, a little to one side. it knows the name of the game.
    const p = this.player;
    const f = p.forward();
    const side = this.rng.sign() * 0.3;
    this.audio.whisper(p.x - f.x * 0.55 - f.z * side, p.y + p.eyeCur, p.z - f.z * 0.55 + f.x * side);
    this.fx.glitch = 0.3;
  }

  scare_mimic() {
    const p = this.player;
    const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(12, 20);
    const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
    const y = this.world.terrain.height(x, z);
    if (!this.mic.mimic(x, y + 1.7, z, 0.9)) return this.scare_snap();
    this.radar.blip(x, z, 'unknown');
    this.timeline.push({
      at: this.time + 0.9,
      fn: () => {
        this.pulses.emit(x, y + 1.5, z, this.time, { radius: 8, strength: 0.6, decay: 1.2, color: RED, kind: 'scare' });
        this.shade.place(x, y, z, Math.atan2(p.x - x, p.z - z));
        this.stats.seen.shade = 1;
        this.ghosts.spawn(this.shade.rig, this.time, { strength: 1.1, life: 2.0, decay: 1.0, color: 0xff3a2a });
      },
    });
  }

  // ---------------- per-frame ----------------
  // co-op housekeeping every frame, whatever the phase: messages in, teammates, messages out
  netFrame(dt) {
    if (this.sync) this.sync.process();
    this.updateRemotes(dt);
    this._updateEars();
    if (this.sync && this.state !== 'over' && this.state !== 'idle') this.sync.tick(dt);
  }

  // teammates: interpolate, place their voices, and — in daylight or a lamp's light — simply show them
  updateRemotes(dt) {
    if (this.online) for (const id of this.audio.voices.keys()) if (!this.remotes.has(id)) this.audio.voiceSet(id, 0, 0, 0, 0);
    if (!this.remotes.size) return;
    const day = this.state === 'morning' || (this.state === 'dusk' && this.duskT < 1.5) || this.state === 'dawn' || this.state === 'won';
    const meAlive = this.player.alive;
    for (const r of this.remotes.values()) {
      r.update(dt);
      // the dead are heard only by the dead
      this.audio.voiceSet(r.id, r.x, r.y + (r.alive ? r.eyeCur : 0.35), r.z, r.alive || !meAlive ? 1 : 0);
      const watching = this.spectate && this.spectate.target === r;
      const lit = watching ? 0 : day ? 1 : this.glowAt(r.x, r.y + 1.2, r.z);
      if (lit > 0.06) {
        const str = day ? 0.62 : Math.min(0.8, 0.22 + lit * 1.2);
        if (!r.liveGhost) r.liveGhost = this.ghosts.spawn(r.rig, this.time, { sticky: true, strength: str, full: day ? 0.7 : 0.3, color: r.alive ? r.hex : 0x8a9396, jitter: 0.25, dyeK: r.alive ? 1 : 0.3 });
        else {
          this.ghosts.refresh(r.liveGhost, r.rig);
          r.liveGhost.strength = str;
        }
        if (!day) r.revealT = this.time;
      } else if (r.liveGhost) {
        this.ghosts.release(r.liveGhost);
        r.liveGhost = null;
      }
    }
  }

  update(dt, raw) {
    const fx = this.fx;
    const input = this.input;
    if (this.inputMuted) raw = { look: NO_LOOK, events: [] };
    const look = raw.look;
    this.events = raw.events;
    if (this.state === 'morning') return this.updateMorning(dt, raw);
    if (this.state === 'dusk') return this.updateDusk(dt, raw);

    if (this.state === 'dying') {
      this._updateEars();
      this.updateDying(dt);
      this.doors.update(dt);
      this.flares.update(dt);
      this.time += dt;
      this._commonFx(dt);
      return;
    }
    if (this.state === 'dawn') {
      this.netFrame(dt);
      this.updateDawn(dt);
      this.doors.update(dt);
      this.flares.update(dt);
      this.time += dt;
      if (this.player.alive) this.player.update(dt, input, look, this.inputMuted);
      this._commonFx(dt);
      return;
    }
    if (this.state !== 'play') return;

    this.time += dt;
    this.grace = this.time < CFG.GRACE_SECONDS || (this.firstPingT >= 0 && this.time < this.firstPingT + 8) || this.firstPingT < 0;
    this.netFrame(dt);
    if (this.state !== 'play') return; // the host ended the night
    if (this.teamOverAt && this.time >= this.teamOverAt) return this.endOnline(false);

    // timeline events
    for (let i = this.timeline.length - 1; i >= 0; i--) {
      if (this.time >= this.timeline[i].at) {
        const ev = this.timeline[i];
        this.timeline.splice(i, 1);
        ev.fn();
      }
    }
    if (this.state !== 'play') return;
    if (!this.player.alive) return this.updateDead(dt, raw);

    // ---- input events ----
    for (const e of raw.events) {
      if (e === 'pingDown') {
        this.charge.active = true;
        this.charge.t = 0;
      } else if (e === 'pingUp') this.pingRelease();
      else if (e === 'throw') this.throwStone();
      else if (e === 'flare') this.fireFlare();
    }
    // E puts a note away
    if (this.objectives.note && raw.events.includes('useDown')) {
      this.objectives.closeNote();
      this.events = raw.events.filter((e) => e !== 'useDown');
    }
    if (this.charge.active) {
      this.charge.t += dt; // the loudness ring around the dot shows how loud this will be
      if (this.charge.t > 2.4) this.pingRelease(); // don't hold forever
    }
    this.pingCD -= dt;

    // ---- player ----
    const p = this.player;
    const pev = p.update(dt, input, look, this.inputMuted);
    if (pev.step) {
      const s = pev.step;
      this.audio.footstep(s.intensity);
      if (s.mode === 'crouch') {
        this.pulses.emitStep(p.x, p.y + 0.15, p.z, this.time, { radius: 2.6, strength: 0.3, speed: 10, decay: 2.4, kind: 'step' });
      } else {
        const sprint = s.mode === 'sprint';
        this.pulses.emitStep(p.x, p.y + 0.2, p.z, this.time, { radius: sprint ? 9 : 5.5, strength: sprint ? 0.6 : 0.42, speed: 16, decay: sprint ? 1.9 : 2.3, kind: 'step' });
        this.playerNoise(p.x, p.z, s.loud, 'step');
        this.stepNoise = Math.max(this.stepNoise, s.loud);
      }
    }
    if (pev.bump) {
      const b = pev.bump;
      this.audio.bump();
      this.addTrauma(0.22 + b.strength * 0.2);
      this.pulses.emitStep(b.x, p.y + 1.2, b.z, this.time, { radius: 5, strength: 0.9, speed: 14, decay: 1.1, kind: 'step' });
      this.playerNoise(p.x, p.z, 0.26, 'bump');
      this.stepNoise = Math.max(this.stepNoise, 0.26);
      this.particles.burst(b.x, p.y + 1.3, b.z, 12, { color: [0.55, 0.8, 0.9], speed: 2.5, life: 0.7, size: 0.05, gravity: -5, drag: 2, dir: { x: b.nx, y: 0.3, z: b.nz }, cone: 0.8 });
    }
    if (pev.breath) {
      this.audio.breathHeavy();
      this.playerNoise(p.x, p.z, 0.14, 'breath');
      if (!this.exhaustWarned) {
        this.hud.popup(t('aExhausted'), 'dim');
        this.exhaustWarned = true;
      }
    }
    if (!p.exhausted) this.exhaustWarned = false;
    this.stepNoise = Math.max(0, this.stepNoise - dt * 0.6);

    // ---- microphone ----
    const mev = this.mic.update(dt, this.audio.outputDb());
    if (mev.loud > 0) {
      this.playerNoise(p.x, p.z, mev.loud, 'voice', mev.scream);
      this.stats.loudest = Math.max(this.stats.loudest, mev.loud);
    }
    if (mev.pulse > 0) this.emitPlayerPulse(mev.pulse, true);
    if (mev.scream && !this.screamFlag) this.onScream();
    this.screamFlag = mev.scream;
    if (this.mic.lostFlag) {
      this.mic.lostFlag = false;
      this.hud.flashAlert(t('aMicLost'), 'warn', 2);
      this.hud.setMic('off');
    }

    // ---- world ----
    this.pulses.update(this.time);
    this.stones.update(dt, this);
    this.doors.update(dt);
    this.flares.update(dt);
    const nearest = this.updateMonsters(dt);
    if (this.state !== 'play') return; // killed this frame
    if (!this.player.alive) return; // co-op: caught this frame — the death plays from the next one
    this.shards.update(dt, this);
    this.objectives.update(dt, true);
    if (this.state !== 'play') return;
    if (this.auth) this.updateArrivals();
    this.updateFronts();
    this.updateDirector(dt);
    if (this.time > this.nextScare) {
      this.nextScare = this.time + this.rng.float(55, 115);
      if (!this.monsters.some((m) => m.state === 'hunt')) this.scare();
    }
    this.updateIntro(dt);
    this.dread.update(dt);

    // ---- scoring ----
    this.score += dt * CFG.SCORE.perSecond * this.mult;

    // ---- danger / atmosphere ----
    const dread = this.firstPingT < 0 ? 0.16 : 0; // a slow heartbeat in the dark before your first sound
    fx.danger = damp(fx.danger, Math.max(nearest, dread), 3, dt);
    this.audio.update(fx.danger, this.time / CFG.RUN_SECONDS);
    this.audio.setAmbience(0.9, fx.danger);

    // past half an hour the forest stops pretending: everything starts closing in on you
    if (this.time > CFG.RUN_SECONDS && this.auth) {
      if (!this.endgame) {
        this.endgame = true;
        this.wakeT = 5;
        if (this.role === 'host') this.sync.ev('wk');
        this.fxWake();
      }
      this.wakeT -= dt;
      if (this.wakeT <= 0) {
        this.wakeT = 14;
        const live = this.livePlayers();
        for (const m of this.monsters) {
          const q = live.length ? live[Math.floor(this.rng.next() * live.length)] : p;
          if (m.state === 'wander' || m.state === 'search' || m.state === 'idle') m.investigate(q.x + this.rng.float(-7, 7), q.z + this.rng.float(-7, 7));
        }
      }
    }

    this._commonFx(dt);
  }

  fxWake() {
    this.hud.flashAlert(t('aAwake'), 'danger', 3);
    this.audio.sting(0.7);
  }

  // co-op, after your death: the kill plays out, then you see the night through a friend's eyes
  updateDead(dt, raw) {
    if (this.localDeath === true) this.updateDying(dt);
    else if (this.spectate) {
      for (const e of raw.events) if (e === 'pingDown' || e === 'primary' || e === 'throw' || e === 'skip') this.nextSpectate();
      if (!this.spectate.target || !this.spectate.target.alive) this.nextSpectate();
    }
    this.mic.update(dt, this.audio.outputDb()); // keeps the meter honest; the dead make no noise
    this.pulses.update(this.time);
    this.stones.update(dt, this);
    this.doors.update(dt);
    this.flares.update(dt);
    const nearest = this.updateMonsters(dt);
    if (this.state !== 'play') return;
    this.objectives.update(dt, true);
    if (this.auth) this.updateArrivals();
    this.updateFronts();
    this.updateDirector(dt);
    this.fx.danger = damp(this.fx.danger, nearest * 0.8, 3, dt);
    this.audio.update(this.fx.danger, this.time / CFG.RUN_SECONDS);
    this.audio.setAmbience(0.9, this.fx.danger);
    if (this.time > CFG.RUN_SECONDS && this.auth && !this.endgame) {
      this.endgame = true;
      if (this.role === 'host') this.sync.ev('wk');
      this.fxWake();
    }
    this._commonFx(dt);
  }

  updateMonsters(dt) {
    let danger = 0;
    for (const m of this.monsters) {
      m.update(dt, this.time);
      if (this.state !== 'play') return 1;
      danger = Math.max(danger, m.danger());
      this.lampGhost(m);
      // close call: it passed right by you and never knew
      const d = m.playerDist;
      if (this.player.alive && m.type !== 'watcher' && m.state !== 'hunt' && m.state !== 'feed' && d < 4.6 && this.time - m.lastCloseCall > 25 && this.firstPingT >= 0) {
        m.lastCloseCall = this.time;
        this.stats.close++;
        const pts = CFG.SCORE.closeCall * this.mult;
        this.score += pts;
        this.hud.popup(`+${Math.round(pts)} ${t('aClose')}`, 'red');
        this.fx.slowT = 0.7;
        this.audio.heartbeat(0.9);
        this.audio.sniff(m.x, m.y + m.headY, m.z, 0.55);
        this.addTrauma(0.12);
      }
    }
    return danger;
  }

  // steady light at a spot: a running generator's lamp, or a burning flare (0..1)
  glowAt(x, y, z) {
    return Math.max(this.objectives.lampAt(x, z), this.flares.lightAt(x, y, z));
  }

  // standing in a lamp's (or a flare's) light, a monster can simply be seen — a live afterimage that follows it
  lampGhost(m) {
    const lit = m.state === 'lurk' ? 0 : this.glowAt(m.x, m.y + 1.5, m.z);
    if (lit > 0.06) {
      const str = Math.min(0.85, 0.22 + lit * 1.3);
      if (!m.lampGhost) {
        m.lampGhost = this.ghosts.spawn(m.rig, this.time, { sticky: true, strength: str, full: 0.25, color: m.ghostColor, jitter: 0.6 });
        this.stats.seen[m.type] = 1;
      }
      else {
        this.ghosts.refresh(m.lampGhost, m.rig);
        m.lampGhost.strength = str;
      }
      m.lastGhostT = this.time;
    } else if (m.lampGhost) {
      this.ghosts.release(m.lampGhost);
      m.lampGhost = null;
    }
  }

  updateFronts() {
    for (const s of this.pulses.fronts()) {
      for (const m of this.monsters) {
        const d = Math.hypot(m.x - s.x, m.y + 1.4 - s.y, m.z - s.z);
        if (d > s.prevR && d <= s.curR && d <= s.radius) {
          const fall = 1 - smoothstep(s.radius * 0.42, s.radius, d);
          const str = clamp(s.strength * (0.65 + 0.7 * fall), 0.6, 1.8);
          this.ghosts.spawn(m.rig, this.time, { strength: str, color: m.ghostColor, life: 2.9, decay: 0.85 });
          m.lastGhostT = this.time;
          this.stats.seen[m.type] = 1;
          if (m.type === 'watcher' && !m.revealed) {
            m.revealed = true;
            if (this.time - (this.lastWatcherSting ?? -99) > 40 && this.player.alive) {
              this.lastWatcherSting = this.time;
              this.audio.watcherSting();
              this.addTrauma(0.3);
              this.fx.glitch = Math.max(this.fx.glitch, 0.5);
            }
            if (!this.hinted.watcher && this.player.alive) {
              this.hinted.watcher = true;
              this.hud.setHint(`<span class="red">${t('hintWatcher')}</span>`);
              this.timeline.push({ at: this.time + 5.5, fn: () => this.hud.setHint(null) });
            }
          }
          this.radar.blip(m.x, m.z, 'monster', m.state === 'hunt');
          if (s.kind !== 'monster') this.audio.monsterReturn(0, m.x, m.y + 2, m.z, 0.25 + str * 0.3);
          if (m.intro && !this.intro.revealDone && s.kind === 'player' && this.player.alive) {
            this.intro.revealDone = true;
            this.intro.itHearsT = this.time;
            this.hud.setIntro(t('itHears'), null);
            this.hud.intro.classList.add('red');
            this.audio.sting(0.35);
            this.addTrauma(0.2);
          }
        }
      }
      for (const r of this.remotes.values()) {
        if (this.spectate && this.spectate.target === r) continue;
        const d = Math.hypot(r.x - s.x, r.y + 1.0 - s.y, r.z - s.z);
        if (d > s.prevR && d <= s.curR && d <= s.radius && d > 0.8) {
          const fall = 1 - smoothstep(s.radius * 0.42, s.radius, d);
          this.ghosts.spawn(r.rig, this.time, { strength: clamp(s.strength * (0.55 + 0.6 * fall), 0.45, 1.4), color: r.alive ? r.hex : 0x7c8588, life: 2.6, decay: 0.9, jitter: 0.4, dyeK: r.alive ? 1 : 0.3 });
          r.revealT = this.time;
          this.radar.blip(r.x, r.z, 'mate');
        }
      }
      this.shards.onFront(s, this);
      this.objectives.onFront(s);
    }
  }

  updateDirector(dt) {
    this.mult = dangerMultiplier(this.auth ? this.time : this.netT || this.time);
    if (this.mult !== this.lastMultStep) {
      this.lastMultStep = this.mult;
      this.hud.flashAlert(`${t('aWake')} ×${this.mult.toFixed(1)}`, 'warn', 2.2);
      this.hud.peek(4);
      this.audio.sting(0.35);
    }
    if (!this.auth) return;
    const prog = this.time / CFG.RUN_SECONDS;
    this.hearingScale = 1 + prog * 0.35;
    this.speedScale = 1 + prog * 0.18;
    this.dirT = (this.dirT || 0) - dt;
    if (this.dirT > 0) return;
    this.dirT = 1.0;
    const want = monsterTargets(this.time);
    let L = 0, C = 0;
    for (const m of this.monsters) {
      if (m.type === 'listener') L++;
      else if (m.type === 'crawler') C++;
    }
    // a bigger team draws a few more of them
    const extra = this.online ? Math.max(0, Math.round((this.livePlayers().length - 1) * 0.7)) : 0;
    if (L < want.listeners + extra) this.spawnMonster('listener', 60, 90);
    else if (C < want.crawlers) this.spawnMonster('crawler', 55, 85);
    for (const m of this.monsters) {
      if ((m.state === 'wander' || m.state === 'idle') && m.tgtDist > 120 && !m.intro) this.relocate(m);
      if (m.intro && m.tgtDist > 120) { m.intro = false; this.relocate(m); }
    }
  }

  updateIntro(dt) {
    const it = this.intro;
    it.t += dt;
    const hud = this.hud;
    if (this.firstPingT < 0) {
      if (it.t < 1.9) hud.setIntro(t('intro1'));
      else {
        const hint = this.input.touch ? t('introHintTouch') : this.mic.state === 'on' ? t('introHintMic') : t('introHintKeys');
        hud.setIntro(t('intro2'), hint);
      }
      if (it.t > 9 && !it.autoSnap) {
        it.autoSnap = true;
        this.scare_snap();
      }
      return;
    }
    if (it.itHearsT < 0 && !it.cleared) {
      it.cleared = true;
      hud.setIntro(null);
    }
    if (it.itHearsT >= 0 && this.time - it.itHearsT > 2.4) {
      hud.setIntro(null);
      hud.intro.classList.remove('red');
      it.itHearsT = -1;
    }
    // tutorial hints (first run only)
    const tut = this.tut;
    if (tut.done) return;
    tut.t += dt;
    const touch = this.input.touch;
    if (tut.step === 0) {
      if (tut.t > 2.2) { tut.step = this.morningT < 17 ? 1 : 2; tut.t = 0; }
    } else if (tut.step === 1) {
      hud.setHint(touch ? t('tutMoveTouch') : t('tutMove'));
      if (tut.t > 7) { tut.step = 2; tut.t = 0; }
    } else if (tut.step === 2) {
      hud.setHint(touch ? t('tutUseTouch') : t('tutUse'));
      if (tut.t > 9 || this.stats.bodies > 0) { tut.step = 3; tut.t = 0; }
    } else if (tut.step === 3) {
      hud.setHint(touch ? t('tutStoneTouch') : t('tutStone'));
      if (tut.t > 7) { tut.step = 4; tut.t = 0; }
    } else if (tut.step === 4) {
      hud.setHint(`<span class="red">${t('tutScream')}</span>`);
      if (tut.t > 5) {
        tut.step = 5;
        tut.done = true;
        hud.setHint(null);
        settings.tutorialDone = true;
        saveSettings();
      }
    }
  }

  _commonFx(dt) {
    const fx = this.fx;
    fx.trauma = Math.max(0, fx.trauma - dt * 1.05);
    fx.glitch = Math.max(0, fx.glitch - dt * 1.8);
    fx.red = Math.max(0, fx.red - dt * 1.4);
    fx.white = Math.max(0, fx.white - dt * 3.2);
    fx.shockT += dt;
    fx.fovKick = damp(fx.fovKick, 0, 5, dt);
    if (fx.slowT > 0) fx.slowT -= dt / Math.max(fx.timeScale, 0.3);
    fx.timeScale = damp(fx.timeScale, fx.slowT > 0 ? 0.45 : 1, 8, dt);
  }

  // camera + listener + post uniforms
  applyView(camera, realT) {
    const sp = this.spectate && this.spectate.target;
    const p = sp || this.player;
    const fx = this.fx;
    const sh = fx.trauma * fx.trauma;
    const n = this.noiseGen;
    const tt = realT * 26;
    const nx = n.noise(tt, 1.3), ny = n.noise(tt, 7.1), nr = n.noise(tt, 13.7), px = n.noise(tt, 21.4), py = n.noise(tt, 31.9);
    // a held breath: the view is never perfectly still, and shakes more when it's close
    const br = 0.0035 + fx.danger * 0.0045 + (p.exhausted ? 0.006 : 0);
    const yaw = p.yaw + sh * 0.07 * nx + Math.sin(realT * 0.43) * br * 0.5;
    const pitch = p.pitch + sh * 0.06 * ny + Math.sin(realT * 1.05) * br;
    const roll = (p.roll || 0) + sh * 0.09 * nr + Math.sin(realT * 0.61 + 1.3) * br * 0.7;
    camera.rotation.set(pitch, yaw, roll, 'YXZ');
    const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    camera.position.set(p.x + cy * sh * 0.08 * px, p.y + p.eyeCur + (p.bobY || 0) + sh * 0.06 * py, p.z - sy * sh * 0.08 * px);
    const fov = CFG.FOV + fx.fovKick + (p.sprinting ? 5 : 0);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = damp(camera.fov, fov, 10, 1 / 60);
      camera.updateProjectionMatrix();
    }
    camera.getWorldDirection(_v);
    this.audio.setListener(camera.position.x, camera.position.y, camera.position.z, _v.x, _v.y, _v.z);

    const u = this.post.u;
    u.uAberr.value = 0.12 + fx.glitch * 0.9 + fx.danger * 0.25 + sh * 0.5;
    u.uGlitch.value = fx.glitch;
    u.uRed.value = fx.red;
    u.uWhite.value = fx.white;
    u.uDanger.value = fx.danger;
    u.uGrain.value = 0.06 + fx.danger * 0.05 + fx.glitch * 0.1;
    u.uShockR.value = fx.shockT * 0.9;
    u.uShockAmp.value = fx.shockAmp * Math.max(0, 1 - fx.shockT * 1.3);
    u.uFade.value = fx.fade;
    u.uWarm.value = shared.uDawn.value;
    // under a burning flare the world gets its colour back: red
    const flareK = this.flares.lightAt(camera.position.x, camera.position.y, camera.position.z);
    u.uAsh.value = 0.62 * (1 - Math.min(1, shared.uDawn.value * 1.4)) * (1 - 0.7 * flareK);
    const live = this.state === 'play' || this.state === 'dying';
    u.uFlicker.value = this.state === 'play' ? this.dread.flicker : 0;
    shared.uFear.value = live ? smoothstep(0.5, 1.0, fx.danger) : 0;
  }

  hudUpdate(dt) {
    const p = this.player;
    this.hud.update(this, dt, this.input.peekHeld);
    const sp = this.spectate;
    const key = sp ? (sp.target ? sp.target.id : '-') : '';
    if (this.spectLabel !== key) {
      this.spectLabel = key;
      const el = document.getElementById('spect');
      if (sp) {
        el.style.setProperty('--c', sp.target ? sp.target.color : '#fff');
        el.innerHTML = sp.target
          ? `${t('spectating').replace('{name}', escHtml(sp.target.name))}<small>${t(this.input.touch ? 'spectNextTouch' : 'spectNext')}</small>`
          : t('spectAllDead');
      }
      document.body.classList.toggle('spectating', !!sp);
    }
    const chargeLvl = this.charge.active ? (this.charge.t < 0.18 ? 0.24 : lerp(0.32, 1, clamp((this.charge.t - 0.18) / 0.95, 0, 1))) : 0;
    this.hud.ring(dt, this.mic, this.state === 'play' ? chargeLvl : 0, this.mic.state === 'on');
    if (settings.radar) {
      const R = p.alive ? Math.max(this.mic.loud > 0 ? CFG.voiceHearRadius(this.mic.loud) : 0, this.stepNoise > 0 ? CFG.hearRadius(this.stepNoise) : 0, chargeLvl > 0 ? CFG.hearRadius(chargeLvl) : 0) : 0;
      const scream = p.alive && (this.mic.screamHeld > 0.1 || chargeLvl >= CFG.SCREAM);
      const c = (sp && sp.target) || p;
      this.radar.draw(dt, c.x, c.z, c.yaw, this.pulses.slots, R, scream);
    }
  }
}

export { Pulses };
