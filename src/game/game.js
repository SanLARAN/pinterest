// One run of the game: rules, scoring, director, scares, juice.
import * as THREE from 'three';
import { CFG, dangerMultiplier, monsterTargets } from '../core/config.js';
import { RNG, Simplex2, clamp, lerp, smoothstep, damp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { Monster, ShadeRig } from './monsters.js';
import { Player } from './player.js';
import { Shards } from './shards.js';
import { Stones } from './stones.js';
import { Dread } from './dread.js';
import { CAP } from '../world/world.js';
import { shared } from '../render/sonar.js';
import { Pulses } from '../render/pulses.js';

const RED = [1.0, 0.13, 0.08];
const SONAR = [0.84, 0.92, 1.0]; // cold, colourless light
const STONE = [0.85, 0.95, 1.0];
const _v = new THREE.Vector3();

export class Game {
  constructor(deps) {
    Object.assign(this, deps); // scene, camera, world, pulses, ghosts, eyes, particles, audio, mic, input, hud, radar, post
    this.player = new Player(this.world);
    this.dread = new Dread(this, this.eyes);
    this.shards = new Shards(this.scene);
    this.stones = new Stones();
    this.shade = new ShadeRig();
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
  }

  _fxDefaults() {
    return { trauma: 0, glitch: 0, red: 0, white: 0, shockT: 9, shockAmp: 0, fovKick: 0, danger: 0, slowT: 0, timeScale: 1, fade: 1, aberr: 0.12 };
  }

  // ---------------- lifecycle ----------------
  reset() {
    this.rng = new RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.time = 0;
    this.score = 0;
    this.mult = 1;
    this.stats = { shards: 0, close: 0, escapes: 0, loudest: 0, hunts: 0 };
    this.state = 'play';
    this.grace = true;
    this.fx = this._fxDefaults();
    this.timeline = [];
    this.player.reset();
    this.pulses.clear();
    this.ghosts.clear();
    this.particles.clear();
    this.stones.clear();
    this.radar.clear();
    for (const m of this.monsters) m.dispose();
    this.monsters = [];
    this.shards.reset(this.world, this.rng);
    this.charge = { active: false, t: 0 };
    this.pingCD = 0;
    this.stepNoise = 0;
    this.lastHeardAlert = -10;
    this.lastScreamAlert = -10;
    this.screamFlag = false;
    this.killer = null;
    this.deathT = 0;
    this.dawnT = 0;
    this.nextScare = 80 + this.rng.float(0, 35);
    this.scareCount = 0;
    this.firstPingT = -1;
    this.lastPulseT = -9;
    this.intro = { t: 0, phase: 0, autoSnap: false, revealDone: false, itHearsT: -1 };
    this.tut = { step: 0, t: 0, done: settings.tutorialDone };
    this.lastMultStep = 1;
    this.dawnWarned = false;
    shared.uDawn.value = 0;
    shared.uFear.value = 0;
    this.dread.reset();

    // the first thing you'll ever see: something standing in the trees, facing you
    const p = this.player;
    const f = p.forward();
    let mx = p.x + f.x * 17 + f.z * 2.5, mz = p.z + f.z * 17 - f.x * 2.5;
    for (let k = 0; k < 20 && !this.world.col.free(mx, mz, 0.8); k++) {
      mx += this.rng.float(-2, 2);
      mz += this.rng.float(-2, 2);
    }
    const m = new Monster('listener', this);
    m.spawn(mx, mz, 'idle');
    m.yaw = Math.atan2(p.x - mx, p.z - mz);
    m.scripted = 'freeze';
    m.intro = true;
    this.monsters.push(m);
    this.spawnMonster('listener', 75, 100);
    this.hud.setIntro(null);
    this.hud.setHint(null);
  }

  // ---------------- helpers ----------------
  addTrauma(v) {
    const k = settings.scares === 'reduced' ? 0.6 : 1;
    this.fx.trauma = Math.min(1, this.fx.trauma + v * k);
  }

  spawnMonster(type, dmin, dmax) {
    const p = this.player;
    const w = CFG.WORLD_WALL - 6;
    for (let k = 0; k < 40; k++) {
      const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(dmin, dmax);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w) continue;
      if (!this.world.col.free(x, z, 1)) continue;
      const L = this.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      const m = new Monster(type, this);
      m.spawn(x, z);
      this.monsters.push(m);
      return m;
    }
    return null;
  }

  relocate(m) {
    const p = this.player;
    const w = CFG.WORLD_WALL - 6;
    for (let k = 0; k < 30; k++) {
      const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(55, 85);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w || !this.world.col.free(x, z, 1)) continue;
      const L = this.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      m.spawn(x, z);
      return;
    }
  }

  // a sound happened in the world
  noise(x, z, loud, source, scream = false) {
    if (loud <= 0 || this.state !== 'play') return 0;
    let n = 0;
    for (const m of this.monsters) {
      const r = m.hear(x, z, loud, source, scream);
      if (r) {
        n++;
        if (r === 'hunt' && scream) m.huntCause = 'scream';
      }
    }
    return n;
  }

  eyePos() {
    const p = this.player;
    return { x: p.x, y: p.y + p.eyeCur, z: p.z };
  }

  // ---------------- player sound ----------------
  emitPlayerPulse(loud, fromMic) {
    const p = this.player;
    const e = this.eyePos();
    let R = CFG.revealRadius(loud);
    const first = this.firstPingT < 0;
    if (first) {
      R = Math.max(R, 52);
      this.firstPingT = this.time;
      this.onFirstPing();
    }
    const strength = 0.8 + loud * 0.7;
    this.lastPulseT = this.time;
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
    this.noise(this.player.x, this.player.z, loud, 'ping', scream);
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
    const cp = Math.cos(p.pitch);
    const dx = -Math.sin(p.yaw) * cp, dz = -Math.cos(p.yaw) * cp, dy = Math.sin(p.pitch);
    const e = this.eyePos();
    this.stones.throw(e.x + dx * 0.4, e.y - 0.15, e.z + dz * 0.4, dx, dy, dz);
    this.audio.throwWhoosh();
    this.addTrauma(0.05);
    if (this.tut.step === 2) this.tut.t = 99;
  }

  onStoneImpact(h) {
    const s = this.pulses.emit(h.x, h.y + 0.3, h.z, this.time, { radius: 17, strength: 1.0, decay: 0.55, color: STONE, kind: 'stone' });
    this.echoTicks(s, 0.35);
    this.audio.impact(h.x, h.y, h.z, h.water);
    this.particles.burst(h.x, h.y + 0.15, h.z, h.water ? 26 : 18, {
      color: h.water ? [0.5, 0.8, 1.0] : [0.9, 0.97, 1.0], speed: h.water ? 3.5 : 4.5, up: h.water ? 3 : 1.5,
      life: h.water ? 0.9 : 0.6, size: 0.09, gravity: -9, drag: 1,
    });
    this.radar.blip(h.x, h.z, 'stone');
    this.noise(h.x, h.z, h.water ? 0.5 : 0.46, 'stone');
  }

  onFirstPing() {
    this.hud.setIntro(null);
    const m = this.monsters.find((q) => q.intro);
    if (m) {
      m.scripted = null;
      const p = this.player;
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

  onShard(s) {
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
    this.stats.hunts++;
    this.audio.screech(m.x, m.y + 2.4, m.z, 1);
    this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 26, strength: 0.95, decay: 0.75, color: RED, kind: 'monster' });
    this.hud.flashAlert(t('aHunt'), 'danger', 1.8);
    this.fx.glitch = Math.max(this.fx.glitch, 0.65);
    this.fx.red = Math.max(this.fx.red, 0.3);
    this.addTrauma(0.45);
  }

  onMonsterInvestigate(m, d) {
    if (this.time - this.lastHeardAlert > 6 && d < 65 && !m.intro) {
      this.hud.flashAlert(t('aHeard'), 'warn', 1.3);
      this.lastHeardAlert = this.time;
    }
    if (this.time - (m.lastGrowl || -9) > 5) {
      this.audio.growl(m.x, m.y + 2.4, m.z, 0.55);
      m.lastGrowl = this.time;
    }
  }

  onMonsterLost(m) {
    if (this.state !== 'play') return;
    if (m.playerDist > 7) {
      this.stats.escapes++;
      const pts = CFG.SCORE.escape * this.mult;
      this.score += pts;
      this.hud.popup(`+${Math.round(pts)} ${t('aEscaped')}`, 'cyan');
      this.fx.slowT = 0.5;
    }
  }

  // ---------------- death ----------------
  kill(m) {
    if (this.state !== 'play') return;
    this.state = 'dying';
    this.deathT = 0;
    this.killer = m;
    this.cause = m.huntCause === 'scream' ? 'scream' : m.type;
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

  updateDying(dt) {
    this.deathT += dt;
    const m = this.killer;
    const p = this.player;
    const reduced = settings.scares === 'reduced';
    // whip the camera to face it
    const want = Math.atan2(-(m.x - p.x), -(m.z - p.z));
    let da = want - p.yaw;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    p.yaw += da * Math.min(1, dt * 25);
    p.pitch = damp(p.pitch, 0.05, 20, dt);
    // pose the killer in your face
    const rig = m.rig;
    const n = rig.nodes;
    const tt = this.deathT;
    if (m.type === 'listener') {
      n.spine.rotation.x = 0.95;
      n.neck.rotation.x = -0.4;
      n.head.rotation.x = 0.45;
      n.head.rotation.z = Math.sin(tt * 45) * 0.12;
      n.head.rotation.y = Math.sin(tt * 33) * 0.08;
      n.jaw.rotation.x = 0.85 + Math.sin(tt * 38) * 0.18;
      n.shoulderL.rotation.x = -2.1; n.shoulderR.rotation.x = -2.1;
      n.shoulderL.rotation.z = -0.5; n.shoulderR.rotation.z = 0.5;
      n.elbowL.rotation.x = -0.5; n.elbowR.rotation.x = -0.5;
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
    const dist = (m.type === 'listener' ? 1.05 : 0.95) + lunge * 1.8;
    r.position.set(p.x + fx * dist - _v.x, camY - _v.y + 0.12, p.z + fz * dist - _v.z);
    const strobe = reduced ? 1 : (Math.floor(tt * 14) % 2 === 0 ? 1.6 : 0.35);
    if (!this.jsGhost) this.jsGhost = this.ghosts.spawn(rig, this.time, { sticky: true, strength: strobe, full: 1, color: 0xff3020 });
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
      this.state = 'over';
      this.fx.fade = 0;
      this.audio.setAmbience(0, 0);
      if (this.onEnd) this.onEnd({ won: false, cause: this.cause });
    }
  }

  // ---------------- dawn ----------------
  startDawn() {
    this.state = 'dawn';
    this.dawnT = 0;
    this.hud.setIntro(null);
    this.hud.intro.classList.remove('red');
    this.score += CFG.SCORE.dawn;
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
      if (this.onEnd) this.onEnd({ won: true });
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
    this.timeline.push({ at: this.time + lead, fn: () => { if (this.state === 'play') this['scare_' + kind](); } });
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
        this.ghosts.spawn(this.shade.rig, this.time, { strength: 1.1, life: 2.0, decay: 1.0, color: 0xff3a2a });
      },
    });
  }

  // ---------------- per-frame ----------------
  update(dt, raw) {
    const fx = this.fx;
    const input = this.input;
    const look = raw.look;

    if (this.state === 'dying') {
      this.updateDying(dt);
      this.time += dt;
      this._commonFx(dt);
      return;
    }
    if (this.state === 'dawn') {
      this.updateDawn(dt);
      this.time += dt;
      this.player.update(dt, input, look, false);
      this._commonFx(dt);
      return;
    }
    if (this.state !== 'play') return;

    this.time += dt;
    this.grace = this.time < CFG.GRACE_SECONDS || (this.firstPingT >= 0 && this.time < this.firstPingT + 8) || this.firstPingT < 0;

    // timeline events
    for (let i = this.timeline.length - 1; i >= 0; i--) {
      if (this.time >= this.timeline[i].at) {
        const ev = this.timeline[i];
        this.timeline.splice(i, 1);
        ev.fn();
      }
    }

    // ---- input events ----
    for (const e of raw.events) {
      if (e === 'pingDown') {
        this.charge.active = true;
        this.charge.t = 0;
      } else if (e === 'pingUp') this.pingRelease();
      else if (e === 'throw') this.throwStone();
    }
    if (this.charge.active) {
      this.charge.t += dt; // the loudness ring around the dot shows how loud this will be
      if (this.charge.t > 2.4) this.pingRelease(); // don't hold forever
    }
    this.pingCD -= dt;

    // ---- player ----
    const p = this.player;
    const pev = p.update(dt, input, look);
    if (pev.step) {
      const s = pev.step;
      this.audio.footstep(s.intensity);
      if (s.mode === 'crouch') {
        this.pulses.emitStep(p.x, p.y + 0.15, p.z, this.time, { radius: 2.6, strength: 0.3, speed: 10, decay: 2.4, kind: 'step' });
      } else {
        const sprint = s.mode === 'sprint';
        this.pulses.emitStep(p.x, p.y + 0.2, p.z, this.time, { radius: sprint ? 9 : 5.5, strength: sprint ? 0.6 : 0.42, speed: 16, decay: sprint ? 1.9 : 2.3, kind: 'step' });
        this.noise(p.x, p.z, s.loud, 'step');
        this.stepNoise = Math.max(this.stepNoise, s.loud);
      }
    }
    if (pev.bump) {
      const b = pev.bump;
      this.audio.bump();
      this.addTrauma(0.22 + b.strength * 0.2);
      this.pulses.emitStep(b.x, p.y + 1.2, b.z, this.time, { radius: 5, strength: 0.9, speed: 14, decay: 1.1, kind: 'step' });
      this.noise(p.x, p.z, 0.26, 'bump');
      this.stepNoise = Math.max(this.stepNoise, 0.26);
      this.particles.burst(b.x, p.y + 1.3, b.z, 12, { color: [0.55, 0.8, 0.9], speed: 2.5, life: 0.7, size: 0.05, gravity: -5, drag: 2, dir: { x: b.nx, y: 0.3, z: b.nz }, cone: 0.8 });
    }
    if (pev.breath) {
      this.audio.breathHeavy();
      this.noise(p.x, p.z, 0.14, 'breath');
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
      this.noise(p.x, p.z, mev.loud, 'voice', mev.scream);
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
    const nearest = this.updateMonsters(dt);
    if (this.state !== 'play') return; // killed this frame
    this.shards.update(dt, this);
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

    // dawn approaching
    const left = CFG.RUN_SECONDS - this.time;
    shared.uDawn.value = left < 60 ? (1 - left / 60) * 0.12 : 0;
    if (left < 60 && !this.dawnWarned) {
      this.dawnWarned = true;
      this.hud.flashAlert(t('aDawnSoon'), 'dawn', 2.5);
    }
    if (left <= 0) this.startDawn();

    this._commonFx(dt);
  }

  updateMonsters(dt) {
    const p = this.player;
    let danger = 0;
    for (const m of this.monsters) {
      m.update(dt, this.time);
      if (this.state !== 'play') return 1;
      const d = m.playerDist;
      if (m.state === 'hunt') danger = Math.max(danger, 0.55 + 0.45 * clamp(1 - d / 40, 0, 1));
      else if (m.state === 'investigate' || m.state === 'search') danger = Math.max(danger, 0.55 * clamp(1 - d / 28, 0, 1));
      else danger = Math.max(danger, 0.4 * clamp(1 - d / 14, 0, 1));
      // close call: it passed right by you and never knew
      if (m.state !== 'hunt' && d < 4.6 && this.time - m.lastCloseCall > 25 && this.firstPingT >= 0) {
        m.lastCloseCall = this.time;
        this.stats.close++;
        const pts = CFG.SCORE.closeCall * this.mult;
        this.score += pts;
        this.hud.popup(`+${Math.round(pts)} ${t('aClose')}`, 'red');
        this.fx.slowT = 0.7;
        this.audio.heartbeat(0.9);
        this.audio.sniff(m.x, m.y + (m.type === 'crawler' ? 0.7 : 2.1), m.z, 0.55);
        this.addTrauma(0.12);
      }
    }
    void p;
    return danger;
  }

  updateFronts() {
    for (const s of this.pulses.fronts()) {
      for (const m of this.monsters) {
        const d = Math.hypot(m.x - s.x, m.y + 1.4 - s.y, m.z - s.z);
        if (d > s.prevR && d <= s.curR && d <= s.radius) {
          const fall = 1 - smoothstep(s.radius * 0.42, s.radius, d);
          const str = clamp(s.strength * (0.65 + 0.7 * fall), 0.6, 1.8);
          this.ghosts.spawn(m.rig, this.time, { strength: str, color: 0xff2a20, life: 2.9, decay: 0.85 });
          m.lastGhostT = this.time;
          this.radar.blip(m.x, m.z, 'monster', m.state === 'hunt');
          if (s.kind !== 'monster') this.audio.monsterReturn(0, m.x, m.y + 2, m.z, 0.25 + str * 0.3);
          if (m.intro && !this.intro.revealDone && s.kind === 'player') {
            this.intro.revealDone = true;
            this.intro.itHearsT = this.time;
            this.hud.setIntro(t('itHears'), null);
            this.hud.intro.classList.add('red');
            this.audio.sting(0.35);
            this.addTrauma(0.2);
          }
        }
      }
      this.shards.onFront(s, this);
    }
  }

  updateDirector(dt) {
    this.mult = dangerMultiplier(this.time);
    if (this.mult !== this.lastMultStep) {
      this.lastMultStep = this.mult;
      this.hud.flashAlert(`${t('aWake')} ×${this.mult.toFixed(1)}`, 'warn', 2.2);
      this.hud.peek(4);
      this.audio.sting(0.35);
    }
    const prog = this.time / CFG.RUN_SECONDS;
    this.hearingScale = 1 + prog * 0.35;
    this.speedScale = 1 + prog * 0.18;
    this.dirT = (this.dirT || 0) - dt;
    if (this.dirT > 0) return;
    this.dirT = 1.0;
    const want = monsterTargets(this.time);
    let L = 0, C = 0;
    for (const m of this.monsters) (m.type === 'listener' ? L++ : C++);
    if (L < want.listeners) this.spawnMonster('listener', 60, 90);
    else if (C < want.crawlers) this.spawnMonster('crawler', 55, 85);
    for (const m of this.monsters) {
      if ((m.state === 'wander' || m.state === 'idle') && m.playerDist > 120 && !m.intro) this.relocate(m);
      if (m.intro && m.playerDist > 120) { m.intro = false; this.relocate(m); }
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
    const p = this.player;
    if (tut.step === 0) {
      if (tut.t > 2.2) { tut.step = 1; tut.t = 0; }
    } else if (tut.step === 1) {
      hud.setHint(touch ? t('tutMoveTouch') : t('tutMove'));
      if ((p.distFromSpawn > 12 && tut.t > 4) || tut.t > 16) { tut.step = 2; tut.t = 0; }
    } else if (tut.step === 2) {
      hud.setHint(touch ? t('tutStoneTouch') : t('tutStone'));
      if (tut.t > 8) { tut.step = 3; tut.t = 0; }
    } else if (tut.step === 3) {
      hud.setHint(touch ? t('tutShardsTouch') : t('tutShards'));
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
    const p = this.player;
    const fx = this.fx;
    const sh = fx.trauma * fx.trauma;
    const n = this.noiseGen;
    const tt = realT * 26;
    const nx = n.noise(tt, 1.3), ny = n.noise(tt, 7.1), nr = n.noise(tt, 13.7), px = n.noise(tt, 21.4), py = n.noise(tt, 31.9);
    // a held breath: the view is never perfectly still, and shakes more when it's close
    const br = 0.0035 + fx.danger * 0.0045 + (p.exhausted ? 0.006 : 0);
    const yaw = p.yaw + sh * 0.07 * nx + Math.sin(realT * 0.43) * br * 0.5;
    const pitch = p.pitch + sh * 0.06 * ny + Math.sin(realT * 1.05) * br;
    const roll = p.roll + sh * 0.09 * nr + Math.sin(realT * 0.61 + 1.3) * br * 0.7;
    camera.rotation.set(pitch, yaw, roll, 'YXZ');
    const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    camera.position.set(p.x + cy * sh * 0.08 * px, p.y + p.eyeCur + p.bobY + sh * 0.06 * py, p.z - sy * sh * 0.08 * px);
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
    u.uAsh.value = 0.62 * (1 - Math.min(1, shared.uDawn.value * 1.4));
    const live = this.state === 'play' || this.state === 'dying';
    u.uFlicker.value = this.state === 'play' ? this.dread.flicker : 0;
    shared.uFear.value = live ? smoothstep(0.5, 1.0, fx.danger) : 0;
  }

  hudUpdate(dt) {
    const p = this.player;
    this.hud.update(this, dt, this.input.peekHeld);
    const chargeLvl = this.charge.active ? (this.charge.t < 0.18 ? 0.24 : lerp(0.32, 1, clamp((this.charge.t - 0.18) / 0.95, 0, 1))) : 0;
    this.hud.ring(dt, this.mic, this.state === 'play' ? chargeLvl : 0, this.mic.state === 'on');
    if (settings.radar) {
      const loud = Math.max(this.mic.loud, this.stepNoise, chargeLvl);
      const scream = this.mic.screamHeld > 0.1 || chargeLvl >= CFG.SCREAM;
      this.radar.draw(dt, p.x, p.z, p.yaw, this.pulses.slots, loud, scream);
    }
  }
}

export { Pulses };
