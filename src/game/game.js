// Game orchestrator: owns the renderer, the run lifecycle and the fixed-step simulation.
// State machine: menu -> playing <-> paused | levelup ; playing -> over -> (restart | menu).
import * as THREE from 'three';
import { FIXED_DT, MAX_STEPS_PER_FRAME, CAMERA } from '../config.js';
import { buildLayout } from '../sim/layout.js';
import { FlowField } from '../sim/nav.js';
import { ScoreKeeper } from '../sim/scoring.js';
import { WaveDirector } from '../sim/waves.js';
import { drawUpgrades } from '../sim/upgrades.js';
import { PICKUPS } from '../sim/defs.js';
import { qualifies, addScore, cleanName } from '../sim/highscores.js';
import { createRng, seedCode } from '../util/rng.js';
import { buildWorld } from '../render/worldModel.js';
import { ShadowPool } from '../render/pools.js';
import { clamp, damp, wrapAngle } from '../util/math.js';
import { Hero } from './hero.js';
import { EnemyManager } from './enemies.js';
import { Pickups } from './pickups.js';
import { Arrows } from './projectiles.js';
import { Juice } from './juice.js';
import { Input } from '../core/input.js';
import { Sound } from '../core/audio.js';
import { loadScores, saveScores, loadName, saveName, loadMuted, saveMuted } from '../core/storage.js';
import { UI } from '../ui/ui.js';

const FOG_COLOR = 0xf1c9a0;
const SLASH_FADE = 0.2;
const DEATH_REAL_TIME = 1.8; // seconds of slow-motion before the game-over screen
const DEATH_TIMESCALE = 0.35;
const OVER_GUARD = 0.6; // ignore confirm/restart briefly so mashing attack doesn't skip the screen

const ACCENT_COLOR = {
  slime: 0x7fe36a, imp: 0xa66bff, archer: 0xe8dcc0, brute: 0xb07a4a, boss: 0x6ff3ff,
};

const newSeed = () => (Math.random() * 0xffffffff) >>> 0;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.state = 'menu';
    this.debugOn = false;

    this.sound = new Sound();
    this.sound.muted = loadMuted();
    this.input = new Input();
    this.input.onAction = (a) => this.onAction(a);
    this.input.onBlur = () => this.onBlur();
    this.input.onPointerInGame = null;

    this.list = loadScores();
    this.pendingEntry = null;
    this.snd = {};

    this.ui = new UI({
      onStart: () => this.beginRun(),
      onToggleMute: () => this.toggleMute(),
      onPause: () => this.togglePause(),
      onResume: () => this.togglePause(true),
      onRestart: () => this.restart(),
      onQuit: () => this.toTitle(),
      onSaveName: (name) => this.saveEntry(name),
      onDashButton: () => this.input.press('dash'),
    });
    this.ui.setTouch(this.isTouch);

    // ---- renderer / scene --------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.isTouch, powerPreference: 'high-performance' });
    this.maxPR = this.isTouch ? 1.5 : 2;
    this.pr = Math.min(window.devicePixelRatio || 1, this.maxPR);
    this.renderer.setPixelRatio(this.pr);
    this.renderer.setClearColor(FOG_COLOR, 1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(FOG_COLOR);
    this.fog = new THREE.Fog(FOG_COLOR, 26, 92);
    this.scene.fog = this.fog;
    this.scene.add(new THREE.HemisphereLight(0xfff3dc, 0x8a5a6e, 1.9));
    const sun = new THREE.DirectionalLight(0xffd7a0, 1.6);
    sun.position.set(-14, 26, 10);
    this.scene.add(sun);

    this.camera = new THREE.PerspectiveCamera(CAMERA.baseFov, 1, 0.5, 400);
    this.zoom = 1;
    this.camTarget = new THREE.Vector3();
    this.camInit = false;
    this.menuA = 0.6;

    this.shadows = new ShadowPool(this.scene, 160);
    this.heroShadows = new ShadowPool(this.scene, 2);
    this.hero = new Hero(this.scene);
    this.enemies = new EnemyManager(this.scene, this.shadows);
    this.pickups = new Pickups(this.scene);
    this.arrows = new Arrows(this.scene);
    this.juice = new Juice(this.scene, this.camera, document.getElementById('popups'));

    this.slashMat = new THREE.MeshBasicMaterial({
      color: 0xfff2b0, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.slash = new THREE.Mesh(new THREE.BufferGeometry(), this.slashMat);
    this.slash.visible = false;
    this.slash.frustumCulled = false;
    this.scene.add(this.slash);
    this.slashArc = -1;
    this.slashReach = -1;
    this.slashT = 0;

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.groundHit = new THREE.Vector3();

    this.pending = [];
    this.pendingLevels = 0;
    this.offers = [];
    this.hitstop = 0;
    this.acc = 0;
    this.deathReal = 0;
    this.comboTick = 0;
    this.overAt = 0;
    this.simT = 0;
    this.worldFresh = true; // the title world is still unused

    // ---- sim context shared with entity modules ----------------------------
    this.enemyCtx = { hero: this.hero, layout: null, flow: null, ev: this.buildEnemyEvents() };
    this.heroEv = this.buildHeroEvents();
    this.arrowHooks = {
      onHero: (dmg, x, z) => this.damageHero(dmg, x, z),
      onImpact: (x, y, z, hitHero) => {
        if (hitHero) return;
        this.juice.dust(x, z, 0, 0, 0.5);
        this.juice.sparks(x, y + 0.1, z, 0xf2e4c8, 4, 0.6);
      },
    };
    this.waveEnv = {
      onChapter: (spec) => this.onChapter(spec),
      spawn: (type, hpScale) => this.queueSpawn(type, hpScale),
      alive: () => this.enemies.aliveCount + this.pending.length,
      onCleared: (spec) => this.onCleared(spec),
    };

    this.perf = { acc: 0, n: 0, sum: 0, warm: 1.5 };
    this.fpsFrames = 0;
    this.fpsAcc = 0;
    this.fps = 0;
    this.debugAcc = 0;
    this.lastT = performance.now();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.onBlur();
    });

    this.seed = newSeed();
    this.buildWorld(this.seed);
    this.hero.model.root.visible = false;
    this.ui.showStart(this.list, this.sound.muted);
    this.bindUnlock();
    this.loop = (t) => {
      this.frame(t);
      requestAnimationFrame(this.loop);
    };
  }

  start() {
    requestAnimationFrame((t) => {
      this.lastT = t;
      this.loop(t);
    });
  }

  bindUnlock() {
    const unlock = () => {
      this.sound.unlock();
      if (this.state === 'playing' && !this.sound.playingMusic) this.sound.startMusic();
    };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
  }

  // ---- world & run lifecycle -------------------------------------------------
  buildWorld(seed) {
    if (this.world) {
      this.scene.remove(this.world.group);
      this.world.dispose();
    }
    this.seed = seed;
    this.layout = buildLayout(seed);
    this.world = buildWorld(this.layout);
    this.scene.add(this.world.group);
    this.flow = new FlowField(this.layout.blocked);
    this.enemyCtx.layout = this.layout;
    this.enemyCtx.flow = this.flow;
  }

  /** Resets all run state. The world is rebuilt only when `rebuild` is true. */
  resetRun(rebuild) {
    if (rebuild) this.buildWorld(newSeed());
    this.rng = createRng(this.seed ^ 0x9e3779b9);
    this.director = new WaveDirector(this.rng);
    this.score = new ScoreKeeper();
    this.enemies.clear();
    this.arrows.clear();
    this.pickups.clear();
    this.juice.clearParticles();
    this.juice.clearTexts();
    this.pending = [];
    this.pendingLevels = 0;
    this.hitstop = 0;
    this.acc = 0;
    this.deathReal = 0;
    this.comboTick = 0;
    this.simT = 0;
    this.slash.visible = false;
    this.hero.reset(this.layout.start.x, this.layout.start.z);
    this.hero.model.root.visible = true;
    this.enemyCtx.hero = this.hero;
    this.flow.goal = -1;
    this.flow.setGoal(this.hero.x, this.hero.z);
    this.camInit = false;
    this.director.nextWave(this.waveEnv);
  }

  beginRun() {
    if (this.state !== 'menu') return;
    if (!this.worldFresh) this.resetRun(true);
    else this.resetRun(false);
    this.worldFresh = false;
    this.state = 'playing';
    this.ui.hideStart();
    this.ui.showHud();
    this.sound.unlock();
    this.sound.startMusic();
  }

  restart() {
    if (this.state === 'menu') return;
    if (this.state === 'over' && performance.now() / 1000 - this.overAt < OVER_GUARD) return;
    this.commitPending(this.ui.nameValue);
    this.ui.hideOver();
    this.ui.hidePause();
    this.ui.hideLevel();
    this.ui.hideBanner();
    this.resetRun(true);
    this.state = 'playing';
    this.ui.showHud();
    this.sound.unlock();
    if (!this.sound.playingMusic) this.sound.startMusic();
  }

  toTitle() {
    if (this.state === 'menu') return;
    this.commitPending(this.ui.nameValue);
    this.state = 'menu';
    this.enemies.clear();
    this.arrows.clear();
    this.pickups.clear();
    this.juice.clearParticles();
    this.juice.clearTexts();
    this.hero.model.root.visible = false;
    this.slash.visible = false;
    this.ui.hideHud();
    this.ui.hideOver();
    this.ui.hidePause();
    this.ui.hideLevel();
    this.ui.hideBanner();
    this.sound.stopMusic();
    this.ui.showStart(this.list, this.sound.muted);
  }

  togglePause(forceResume = false) {
    if (this.state === 'playing' && !forceResume) {
      this.state = 'paused';
      this.ui.showPause(this.sound.muted);
      this.sound.stopMusic();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.ui.hidePause();
      this.input.clearLatched();
      this.input.edges.clear();
      this.acc = 0;
      this.sound.startMusic();
    }
  }

  onBlur() {
    if (this.state === 'playing') this.togglePause();
  }

  toggleMute() {
    this.sound.unlock();
    this.sound.setMuted(!this.sound.muted);
    saveMuted(this.sound.muted);
    this.ui.setMuted(this.sound.muted);
    this.ui.toast(this.sound.muted ? 'Sound off' : 'Sound on');
  }

  onAction(action) {
    const now = performance.now() / 1000;
    switch (action) {
      case 'confirm':
        if (this.state === 'menu') this.beginRun();
        else if (this.state === 'over' && now - this.overAt >= OVER_GUARD) this.restart();
        break;
      case 'restart':
        if (this.state === 'playing' || this.state === 'paused' || this.state === 'levelup' || this.state === 'over') this.restart();
        break;
      case 'pause':
        if (this.state === 'playing' || this.state === 'paused') this.togglePause();
        break;
      case 'mute':
        this.toggleMute();
        break;
      case 'debug':
        this.debugOn = !this.debugOn;
        break;
      case 'pick1':
      case 'pick2':
      case 'pick3':
        if (this.state === 'levelup') this.pickUpgrade(Number(action.slice(4)) - 1);
        break;
      default:
        break;
    }
  }

  // ---- high scores ------------------------------------------------------------
  /** Commits the finished run to the table (if it qualified and is not yet saved). */
  commitPending(name) {
    if (!this.pendingEntry) return;
    this.saveEntry(name);
  }

  saveEntry(name) {
    if (!this.pendingEntry) return;
    const clean = cleanName(name);
    const entry = { ...this.pendingEntry, name: clean };
    const res = addScore(this.list, entry);
    this.list = res.list;
    saveScores(this.list);
    saveName(clean);
    this.pendingEntry = null;
    this.ui.afterSave(clean, res.rank, this.list);
  }

  finishRun() {
    this.state = 'over';
    this.overAt = performance.now() / 1000;
    const h = this.hero;
    const score = this.score.score;
    const entry = {
      score,
      wave: this.director.wave,
      kills: this.score.kills,
      level: h.level,
      seed: seedCode(this.seed),
      time: Date.now(),
    };
    const q = qualifies(this.list, score);
    this.pendingEntry = q ? entry : null;
    this.ui.hideHud();
    this.ui.hideBanner();
    this.sound.stopMusic();
    this.sound.gameOver();
    this.ui.showOver({
      score,
      wave: entry.wave,
      kills: entry.kills,
      bestCombo: this.score.bestCombo,
      level: entry.level,
      seedCode: entry.seed,
      qualifies: q,
      name: loadName(),
      list: this.list,
      highlight: -1,
    });
  }

  // ---- waves & spawns ----------------------------------------------------------
  onChapter(spec) {
    this.ui.banner(`Chapter ${spec.number}${spec.isBoss ? ' · Boss' : ''}`, spec.title, spec.story, 3.4);
    if (spec.isBoss) this.sound.boss();
    else this.sound.waveStart();
  }

  onCleared(spec) {
    const bonus = this.score.waveBonus(spec.number);
    const h = this.hero;
    this.ui.banner('Chapter cleared', spec.title, `+${bonus} bonus · the walls hold`, 2.6);
    this.sound.waveClear();
    this.juice.text(`+${bonus}`, 'big', h.x, h.y + 1.6, h.z);
    this.juice.burst(h.x, 0.8, h.z, 0xf6c24f, 36, 1.6);
    this.juice.ring(h.x, 0.1, h.z, 5, 0xf6c24f, 0.7, 1.2);
    h.heal(12);
    this.juice.text('+12', 'heal', h.x + 0.6, h.y + 2.2, h.z);
    this.juice.addTrauma(0.2);
  }

  queueSpawn(type, hpScale) {
    const rifts = this.layout.rifts;
    const rf = rifts[Math.floor(this.rng.next() * rifts.length)];
    const isBoss = type === 'boss';
    const p = { type, hpScale, x: rf.x, z: rf.z, t: isBoss ? 1.8 : 0.9, total: isBoss ? 1.8 : 0.9, fx: 0 };
    this.pending.push(p);
    const col = ACCENT_COLOR[type] ?? 0xffffff;
    this.juice.disk(rf.x, 0.05, rf.z, isBoss ? 3.2 : 2.2, col, p.t, 'rift', 0.7);
    if (isBoss) this.juice.ring(rf.x, 0.1, rf.z, 4, 0x6ff3ff, 1.4, 1.4);
  }

  updatePending(dt) {
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      p.t -= dt;
      p.fx -= dt;
      if (p.fx <= 0) {
        p.fx = 0.12;
        this.juice.sparks(p.x, 0.4, p.z, ACCENT_COLOR[p.type] ?? 0xffffff, 3, 0.7);
      }
      if (p.t <= 0) {
        this.pending.splice(i, 1);
        this.enemies.spawn(p.type, p.x, p.z, p.hpScale);
        const col = ACCENT_COLOR[p.type] ?? 0xffffff;
        const big = p.type === 'boss';
        this.juice.burst(p.x, 0.6, p.z, col, big ? 40 : 14, big ? 1.8 : 1);
        this.juice.ring(p.x, 0.1, p.z, big ? 6 : 2.6, col, big ? 0.9 : 0.5, 1.2);
        if (big) {
          this.sound.boss();
          this.juice.addTrauma(0.5);
        } else {
          this.throttle('spawn', 0.09, () => this.sound.spawn());
        }
      }
    }
  }

  // ---- events from entities ------------------------------------------------------
  throttle(key, gap, fn) {
    const now = performance.now() / 1000;
    if (this.snd[key] !== undefined && now - this.snd[key] < gap) return;
    this.snd[key] = now;
    fn();
  }

  buildEnemyEvents() {
    return {
      hit: (dmg, fx, fz) => this.damageHero(dmg, fx, fz),
      hop: (e) => {
        this.throttle('hop', 0.06, () => this.sound.hop());
        this.juice.dust(e.x, e.z, 0, 0, 0.25);
      },
      land: (e) => {
        this.juice.dust(e.x, e.z, 0, 0, 0.5);
        this.throttle('land', 0.07, () => this.sound.land());
      },
      arrow: (x, y, z, tx, ty, tz, dmg) => {
        this.arrows.spawn(x, y, z, tx, ty, tz, dmg, 11);
        this.throttle('arrow', 0.12, () => this.sound.arrow());
      },
      warn: (x, z, r, t) => {
        this.juice.disk(x, 0.05, z, r, 0xff6a4a, t + 0.15, 'warn', 0.45);
        this.throttle('windup', 0.3, () => this.sound.windup());
      },
      slam: (x, z, r, dmg) => {
        this.juice.ring(x, 0.2, z, r, 0x6ff3ff, 0.6, 1.5);
        this.juice.burst(x, 0.3, z, 0xf2e4c8, 34, 2);
        this.juice.dust(x, z, 0, 0, 4);
        this.juice.addTrauma(0.9);
        this.hitstop = Math.max(this.hitstop, 0.05);
        this.sound.slam();
        const h = this.hero;
        if (Math.hypot(h.x - x, h.z - z) < r + h.radius) this.damageHero(dmg, x, z);
      },
      stomp: (e) => {
        this.juice.dust(e.x, e.z, e.chargeX ?? 0, e.chargeZ ?? 0, 1.4);
        this.juice.addTrauma(0.15);
        this.throttle('stomp', 0.2, () => this.sound.windup());
      },
      bump: (e) => {
        this.juice.addTrauma(0.3);
        this.juice.sparks(e.x, 0.8, e.z, 0xffe0a0, 12, 1.3);
        this.juice.dust(e.x, e.z, 0, 0, 1.2);
        this.sound.land();
      },
      roar: (e) => {
        this.juice.ring(e.x, 0.2, e.z, 7, 0xff4a3a, 0.9, 1.4);
        this.juice.addTrauma(0.7);
        this.sound.boss();
        this.ui.banner('The Hollow Champion', 'Enraged!', 'It roars and quickens its stride.', 1.8);
      },
    };
  }

  buildHeroEvents() {
    return {
      onDash: (h) => {
        this.juice.burst(h.x, 0.5, h.z, 0xfff1c0, 12, 0.8);
        this.juice.dust(h.x, h.z, -h.dashDir.x, -h.dashDir.z, 1.4);
        this.sound.dash();
      },
      onSwing: (h) => {
        this.throttle('swing', 0.05, () => this.sound.swing());
        this.showSlash(h);
      },
      dust: (x, z, dx, dz, amount) => this.juice.dust(x, z, dx, dz, amount),
      step: (h) => {
        this.juice.dust(h.x, h.z, 0, 0, 0.3);
        this.throttle('step', 0.12, () => this.sound.step());
      },
    };
  }

  // ---- combat ---------------------------------------------------------------------
  damageHero(dmg, fx, fz) {
    const h = this.hero;
    if (!h.takeHit(dmg, fx, fz)) return false;
    this.hitstop = Math.max(this.hitstop, 0.06);
    this.juice.addTrauma(0.45);
    this.juice.text(`-${Math.round(dmg)}`, 'hurt', h.x, h.y + 2.3, h.z);
    this.juice.burst(h.x, 0.9, h.z, 0xff6b5b, 12, 0.9);
    this.sound.hurt();
    this.ui.hurtFlash();
    if (h.hp <= 0) this.heroDown();
    return true;
  }

  heroDown() {
    const h = this.hero;
    h.die();
    this.deathReal = 0;
    this.hitstop = Math.max(this.hitstop, 0.12);
    this.juice.addTrauma(1);
    this.juice.burst(h.x, 0.8, h.z, 0xffe0a0, 26, 1.6);
    this.juice.ring(h.x, 0.1, h.z, 3.2, 0xff5a4a, 0.8, 1.2);
    this.ui.banner('Fallen', 'Sir Pip has fallen', 'The Hollow King laughs in the dark...', 1.8);
  }

  resolveSwing() {
    const h = this.hero;
    if (!h.sweeping) return;
    const reach = h.stats.reach;
    const lo = Math.min(h.sweepFrom, h.sweepTo);
    const hi = Math.max(h.sweepFrom, h.sweepTo);
    for (const e of this.enemies.targets()) {
      if (h.swingSet.has(e.id)) continue;
      const dx = e.x - h.x;
      const dz = e.z - h.z;
      const d = Math.hypot(dx, dz);
      if (d - e.radius > reach) continue;
      const ang = wrapAngle(Math.atan2(dx, dz) - h.swingDirA);
      const halfW = d > e.radius ? Math.asin(Math.min(1, e.radius / d)) : Math.PI / 2;
      if (ang + halfW < lo || ang - halfW > hi) continue;
      h.swingSet.add(e.id);
      this.hitEnemy(e, h.stats.damage, d > 1e-4 ? dx / d : 0, d > 1e-4 ? dz / d : 0);
    }
  }

  hitEnemy(e, base, nx, nz) {
    const crit = Math.random() < 0.12;
    const dmg = Math.max(1, Math.round(base * (crit ? 1.8 : 1)));
    const def = e.def;
    const boss = e.type === 'boss';
    e.hp -= dmg;
    e.flashT = 0.12;
    e.squash.impulse(boss ? -2 : -4);
    const k = boss ? 0.25 : 1;
    e.kx = nx * def.knock * k;
    e.kz = nz * def.knock * k;
    const col = ACCENT_COLOR[e.type] ?? 0xffffff;
    this.juice.text(String(dmg), crit ? 'crit' : 'dmg', e.x, e.y + e.radius * 2 + 0.7, e.z);
    this.juice.sparks(e.x, e.y + 0.7, e.z, crit ? 0xffe27a : col, crit ? 16 : 8, crit ? 1.4 : 1);
    this.hitstop = Math.max(this.hitstop, crit ? 0.06 : 0.035);
    this.juice.addTrauma(crit ? 0.22 : 0.12);
    if (crit) this.sound.crit();
    else this.sound.hit();
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    const h = this.hero;
    const def = e.def;
    const boss = e.type === 'boss';
    const prevMult = this.score.multiplier;
    const r = this.score.kill(def.score);
    this.comboTick++;
    this.enemies.kill(e);
    if (h.stats.lifesteal > 0) h.heal(h.stats.lifesteal);

    const col = ACCENT_COLOR[e.type] ?? 0xffffff;
    this.juice.burst(e.x, e.y + 0.5, e.z, col, boss ? 70 : 18, boss ? 2.2 : 1.2);
    this.juice.burst(e.x, e.y + 0.4, e.z, 0xf2e4c8, boss ? 24 : 6, 1.0);
    this.juice.ring(e.x, 0.08, e.z, e.radius * (boss ? 4 : 2.4), col, boss ? 0.8 : 0.45, 1.1);
    this.juice.text(`+${r.gained}`, boss ? 'big' : 'score', e.x, e.y + 1.4, e.z);
    if (r.multiplier > prevMult) this.juice.text(`×${r.multiplier} COMBO`, 'combo', h.x, h.y + 2.8, h.z);

    // drops
    const shards = clamp(Math.round(def.xp / 2), 1, 5);
    this.pickups.drop('shard', e.x, e.z, shards, def.xp / shards);
    const coins = boss ? 4 : def.xp >= 4 ? 2 : Math.random() < 0.5 ? 1 : 0;
    if (coins) this.pickups.drop('coin', e.x, e.z, coins, PICKUPS.coinValue);
    if (Math.random() < def.heartChance) this.pickups.drop('heart', e.x, e.z, 1, PICKUPS.heartHeal);

    this.sound.kill(e.type);
    this.hitstop = Math.max(this.hitstop, boss ? 0.16 : 0.05);
    this.juice.addTrauma(boss ? 0.9 : 0.2);
    if (boss) {
      this.juice.ring(e.x, 0.2, e.z, 9, 0x6ff3ff, 1.1, 1.6);
      this.ui.banner('The Hollow Champion', 'Vanquished!', 'The rift shudders and dims a little.', 2.4);
    }
  }

  pickUpgrade(i) {
    if (this.state !== 'levelup') return;
    const u = this.offers[i];
    if (!u) return;
    u.apply(this.hero.stats, this.hero);
    this.state = 'playing';
    this.ui.hideLevel();
    this.sound.pick();
    this.juice.text(u.name, 'big', this.hero.x, this.hero.y + 2.2, this.hero.z);
    this.input.clearLatched();
    this.input.edges.clear();
  }

  openLevelUp() {
    this.pendingLevels--;
    this.state = 'levelup';
    this.input.clearLatched();
    this.input.edges.clear();
    this.offers = drawUpgrades(this.rng, 3);
    this.sound.levelUp();
    const h = this.hero;
    this.juice.burst(h.x, h.y + 1, h.z, 0xf6c24f, 30, 1.6);
    this.juice.ring(h.x, 0.1, h.z, 4.5, 0x43d3c1, 0.8, 1.2);
    this.ui.showLevel(this.offers, (i) => this.pickUpgrade(i), h.level);
  }

  // ---- sword sweep visuals ----------------------------------------------------------
  showSlash(h) {
    const arc = h.stats.arc;
    const reach = h.stats.reach;
    if (Math.abs(arc - this.slashArc) > 1e-4 || Math.abs(reach - this.slashReach) > 1e-4) {
      this.slash.geometry.dispose();
      // Ring centred on +Z (theta = -PI/2 after the X rotation below), then yawed to the swing heading.
      const g = new THREE.RingGeometry(0.4, reach, 28, 1, -Math.PI / 2 - arc / 2, arc);
      g.rotateX(-Math.PI / 2);
      this.slash.geometry = g;
      this.slashArc = arc;
      this.slashReach = reach;
    }
    this.slash.visible = true;
    this.slash.rotation.set(0, h.swingDirA, 0);
    this.slashT = SLASH_FADE;
  }

  updateSlash(dt) {
    if (!this.slash.visible) return;
    this.slashT -= dt;
    const h = this.hero;
    this.slash.position.set(h.x, h.y + 0.12, h.z);
    const p = clamp(this.slashT / SLASH_FADE, 0, 1);
    this.slashMat.opacity = 0.55 * p;
    this.slash.scale.setScalar(1 + (1 - p) * 0.08);
    if (this.slashT <= 0) this.slash.visible = false;
  }

  // ---- simulation step ------------------------------------------------------------
  step(dt) {
    const h = this.hero;
    this.simT += dt;
    // Aim assist: without a manual aim, face the nearest foe in striking range.
    if (!this.input.manualAim && !h.dead) {
      const t = this.nearestTarget(2.6);
      if (t) {
        this.input.aimActive = true;
        this.input.aimAngle = Math.atan2(t.x - h.x, t.z - h.z);
      }
    }
    h.update(dt, this.input, this.layout, this.heroEv);
    this.flow.setGoal(h.x, h.z);
    if (!h.dead) {
      this.resolveSwing();
      this.director.update(dt, this.waveEnv);
    }
    this.updatePending(dt);
    this.enemies.update(dt, this.enemyCtx);
    this.arrows.update(dt, h, this.layout, this.arrowHooks);
    this.pickups.update(dt, h, this.layout, h.stats.magnet, (kind, value, x, y, z) => this.collect(kind, value, x, y, z));
    this.score.update(dt);
    this.updateSlash(dt);
  }

  nearestTarget(maxGap) {
    const h = this.hero;
    let best = null;
    let bestD = maxGap;
    for (const e of this.enemies.targets()) {
      const d = Math.hypot(e.x - h.x, e.z - h.z) - e.radius;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  collect(kind, value, x, y, z) {
    const h = this.hero;
    if (kind === 'coin') {
      this.score.collectCoin(value);
      this.juice.text(`+${value}`, 'coin', x, y + 0.6, z);
      this.juice.sparks(x, y, z, 0xffe27a, 5, 0.6);
      this.throttle('coin', 0.04, () => this.sound.coin(Math.min(12, this.score.coins % 12)));
    } else if (kind === 'shard') {
      if (h.addXp(value)) this.pendingLevels++;
      this.juice.sparks(x, y, z, 0x43d3c1, 4, 0.6);
      this.throttle('shard', 0.05, () => this.sound.shard());
    } else if (kind === 'heart') {
      const before = h.hp;
      h.heal(value);
      this.juice.text(`+${Math.round(h.hp - before)}`, 'heal', x, y + 0.6, z);
      this.juice.burst(x, y, z, 0xff7a9a, 12, 0.9);
      this.sound.heal();
    }
  }

  // ---- main loop ------------------------------------------------------------------
  trackPerf(realDt) {
    const p = this.perf;
    if (p.warm > 0) {
      p.warm -= realDt;
      return;
    }
    p.acc += realDt;
    p.n++;
    p.sum += realDt * 1000;
    if (p.acc >= 1.5) {
      const avg = p.sum / p.n;
      if (avg > 19 && this.pr > 0.61) this.setPixelRatio(Math.max(0.6, this.pr - 0.1));
      p.acc = 0;
      p.n = 0;
      p.sum = 0;
    }
  }

  setPixelRatio(pr) {
    this.pr = pr;
    this.renderer.setPixelRatio(pr);
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const need = 13.5 / (Math.tan(THREE.MathUtils.degToRad(CAMERA.baseFov / 2)) * this.camera.aspect);
    this.zoom = clamp(need / 18.34, 1, 2.2);
    this.camera.updateProjectionMatrix();
    this.fog.near = 26 * this.zoom;
    this.fog.far = 92 * this.zoom;
    this.juice.setSize(w, h);
  }

  updateMouseAim() {
    const inp = this.input;
    if (this.state !== 'playing' || !inp.mouse.active || inp.touchMode) {
      inp.mouseAim = null;
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ndc.set((inp.mouse.x / w) * 2 - 1, -(inp.mouse.y / h) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.groundPlane.constant = -this.hero.y;
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.groundHit)) {
      inp.mouseAim = null;
      return;
    }
    const dx = this.groundHit.x - this.hero.x;
    const dz = this.groundHit.z - this.hero.z;
    inp.mouseAim = Math.hypot(dx, dz) < 0.3 ? null : Math.atan2(dx, dz);
  }

  updateCamera(realDt) {
    const cam = this.camera;
    if (this.state === 'menu') {
      this.menuA += realDt * 0.1;
      const r = 36 * this.zoom;
      cam.position.set(Math.sin(this.menuA) * r, 27 * this.zoom, Math.cos(this.menuA) * r);
      cam.lookAt(0, 0, 0);
      return;
    }
    const h = this.hero;
    const la = CAMERA.lookAhead;
    const tx = h.x + clamp(h.vx * 0.2, -la, la);
    const tz = h.z + clamp(h.vz * 0.2, -la, la);
    const T = this.camTarget;
    if (!this.camInit) {
      T.set(tx, h.y, tz);
      this.camInit = true;
    }
    const k = 1 - Math.exp(-CAMERA.damping * realDt);
    T.x += (tx - T.x) * k;
    T.y = damp(T.y, h.y, 10, realDt);
    T.z += (tz - T.z) * k;
    const [ox, oy, oz] = CAMERA.offset;
    const z = this.zoom;
    cam.position.set(T.x + ox * z, T.y + oy * z, T.z + oz * z);
    const s = this.juice.shakeOffset(realDt);
    cam.position.x += s.x;
    cam.position.y += s.y;
    cam.position.z += s.z;
    cam.lookAt(T.x, T.y + 0.6, T.z);
  }

  frame(now) {
    const realDt = clamp((now - this.lastT) / 1000, 0, 0.1);
    this.lastT = now;
    this.trackPerf(realDt);
    this.fpsFrames++;
    this.fpsAcc += realDt;
    if (this.fpsAcc >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAcc;
      this.fpsFrames = 0;
      this.fpsAcc = 0;
    }

    this.input.update();
    this.updateMouseAim();
    this.input.latch();

    let steps = 0;
    if (this.state === 'playing') {
      this.hitstop = Math.max(0, this.hitstop - realDt);
      if (this.hero.dead) this.deathReal += realDt;
      const scale = this.hitstop > 0 ? 0 : this.hero.dead ? DEATH_TIMESCALE : 1;
      this.acc = Math.min(this.acc + realDt * scale, FIXED_DT * MAX_STEPS_PER_FRAME);
      while (this.acc >= FIXED_DT && this.state === 'playing') {
        this.step(FIXED_DT);
        this.acc -= FIXED_DT;
        steps++;
        if (this.hero.dead && this.deathReal >= DEATH_REAL_TIME) {
          this.finishRun();
          break;
        }
      }
      if (this.state === 'playing' && this.pendingLevels > 0 && !this.hero.dead) this.openLevelUp();
    }
    if (steps > 0 || this.state !== 'playing') this.input.clearLatched();
    const simDt = steps * FIXED_DT;

    this.updateCamera(realDt);
    this.juice.update(simDt, realDt, this.camera);

    // blob shadow for the hero
    this.heroShadows.begin();
    if (this.hero.model.root.visible) this.heroShadows.put(this.hero.x, this.hero.y, this.hero.z, 0.5 * (1 + this.hero.squash.x * 0.1));
    this.heroShadows.end();

    this.updateHud(realDt);
    this.renderer.render(this.scene, this.camera);
  }

  updateHud(realDt) {
    const ui = this.ui;
    const touchLive = this.isTouch && this.state === 'playing';
    ui.setSticks(touchLive ? this.input.touch.left : null, touchLive ? this.input.touch.right : null);
    if (this.state === 'menu') return;
    const h = this.hero;
    ui.setLowHp(h.hp / h.stats.maxHp < 0.3 && !h.dead);
    ui.setHud({
      level: h.level,
      hp: h.hp,
      maxHp: h.stats.maxHp,
      xp: h.xp,
      xpNext: h.xpNext,
      score: this.score.score,
      combo: this.score.combo,
      multiplier: this.score.multiplier,
      comboTick: this.comboTick,
      wave: this.director.wave,
      chapterTitle: this.director.spec ? this.director.spec.title : '',
      foes: this.enemies.aliveCount + this.pending.length,
      dashReady: h.dashCd <= 0,
      dashFrac: h.dashCd / h.stats.dashCooldown,
    });
    this.debugAcc -= realDt;
    if (this.debugOn && this.debugAcc <= 0) {
      this.debugAcc = 0.25;
      const info = this.renderer.info;
      ui.setDebug(
        [
          `fps ${this.fps.toFixed(0)}  pr ${this.pr.toFixed(2)}  zoom ${this.zoom.toFixed(2)}`,
          `draws ${info.render.calls}  tris ${info.render.triangles}  geo ${info.memory.geometries}`,
          `state ${this.state}  seed ${seedCode(this.seed)}`,
          `enemies ${this.enemies.list.length}  pending ${this.pending.length}  arrows ${this.arrows.items?.length ?? 0}`,
          `wave ${this.director.wave} phase ${this.director.phase}  hero ${h.x.toFixed(1)},${h.z.toFixed(1)}`,
        ].join('\n'),
        true,
      );
    } else if (!this.debugOn) {
      ui.setDebug('', false);
    }
  }
}
