import * as THREE from 'three';
import { CFG, PLAYER_DEF, RIVALS, TRACKS, COMBO_NAMES, PAL } from './config.js';
import { clamp, rand, wrapAngle } from './noise.js';
import { Track } from './track.js';
import { Terrain } from './terrain.js';
import { World } from './world.js';
import { Car } from './car.js';
import { RivalAI, GoonAI } from './ai.js';
import { Weapons } from './weapons.js';
import { SpriteSystem, PuffSystem, DebrisSystem, RingSystem, SkidMarks } from './particles.js';
import { FX } from './fx.js';
import { ChaseCamera } from './camera.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { HUD } from './hud.js';
import { UI } from './ui.js';
import { Post } from './post.js';
import { loadSettings, saveSettings } from './storage.js';
import { buildWheelGeometry, makeGlowMaterial } from './models.js';

const _w = { x: 0, y: 0, z: 0 };
const _w2 = { x: 0, y: 0, z: 0 };
const SUN_DIR = new THREE.Vector3(-0.42, 0.2, -0.88).normalize();
const LIGHT_DIR = new THREE.Vector3(-0.45, 0.72, -0.53).normalize();
const KILL_WORDS = ['WRECKED!', 'SCRAPPED!', 'TOTALED!', 'DESTROYED!', 'OBLITERATED!'];
const CONFETTI = [0xff2e88, 0x29f3ff, 0xffe23d, 0x7dff6a, 0xb44bff, 0xffffff];
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

export class Game {
  constructor() {
    this.settings = loadSettings();
    this.canvas = document.getElementById('game');
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(PAL.fog, 90, 380);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.5, 1500);
    this.fx = new FX(this.settings);
    this.chase = new ChaseCamera(this.camera, this.fx);
    this.chase.far = this.settings.farCam;
    this.input = new Input();
    this.input.onModeChange = (on) => this.onTouchMode(on);
    this.audio = new AudioEngine(this.settings);
    this.post = new Post(renderer);
    this.time = 0;
    this.realTime = 0;
    this.state = 'boot';
    this.width = 1; this.height = 1;
    this.lowShadows = false;

    this.buildLights();
    this.buildSky();
    this.fxs = {
      sprites: new SpriteSystem(1800),
      puffs: new PuffSystem(1000, LIGHT_DIR),
      debris: new DebrisSystem(this, 280),
      rings: new RingSystem(10),
      skids: new SkidMarks(1600),
    };
    this.scene.add(this.fxs.sprites.mesh, this.fxs.puffs.mesh, this.fxs.debris.mesh, this.fxs.rings.group, this.fxs.skids.mesh);
    this.boomLight = new THREE.PointLight(0xffa040, 0, 60, 1.2);
    this.scene.add(this.boomLight);
    this.weapons = new Weapons(this);
    this.hud = new HUD(this);
    this.loadTrack(this.settings.track, true);
    this.createCars();
    this.ui = new UI(this);
    this.hud.buildTags(this.rivals);
    this.applyQuality(this.settings.quality === 'auto' ? this.autoQuality() : this.settings.quality);
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.autoPause(); this.audio.suspend(); } else this.audio.resume();
    });
    window.addEventListener('blur', () => this.autoPause());
    this.resize();
    this.onTouchMode(this.input.touchMode);
    document.getElementById('btn-pause').addEventListener('pointerdown', (e) => { e.preventDefault(); this.pause(); });
    this.pendingBarrels = [];
    this.perf = { acc: 0, n: 0, slow: 0 };
    this.debugAuto = /[?&]autopilot/.test(location.search);
    this.toTitle(true);
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // =================================================================== setup
  buildLights() {
    this.hemi = new THREE.HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.25);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(PAL.sunLight, 2.5);
    sun.castShadow = true;
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    sun.shadow.camera.near = 10; sun.shadow.camera.far = 420;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.6;
    this.sun = sun;
    this.scene.add(sun, sun.target);
  }

  buildSky() {
    const geo = new THREE.SphereGeometry(1200, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(PAL.skyTop) },
        uMid: { value: new THREE.Color(PAL.skyMid) },
        uHor: { value: new THREE.Color(PAL.fog) },
        uSunCol: { value: new THREE.Color(PAL.sun) },
        uSun: { value: SUN_DIR.clone() },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uMid, uHor, uSunCol, uSun;
        uniform float uTime;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float y = d.y;
          vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.22, y));
          c = mix(c, uTop, smoothstep(0.18, 0.75, y));
          float sd = distance(d, uSun);
          float disc = smoothstep(0.205, 0.195, sd);
          // retro sun stripes on the lower half
          float rel = (d.y - uSun.y) / 0.2;
          float stripes = step(0.0, sin((rel + uTime * 0.02) * 40.0) + rel * 1.6 + 0.6);
          disc *= (rel > 0.0) ? 1.0 : stripes;
          vec3 sunC = mix(vec3(1.0, 0.36, 0.55), uSunCol, smoothstep(-0.2, 0.2, d.y - uSun.y + 0.1));
          c = mix(c, sunC, disc);
          c += uSunCol * 0.35 * exp(-sd * 4.5) * (1.0 - disc);
          // horizon glow band
          c += vec3(1.0, 0.45, 0.3) * 0.12 * exp(-abs(y) * 18.0);
          // stars up high
          vec3 sp = floor(d * 180.0);
          float st = fract(sin(dot(sp, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          c += step(0.9965, st) * smoothstep(0.35, 0.8, y) * 0.8;
          if (y < 0.0) c = uHor;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  }

  loadTrack(index, first = false) {
    const def = TRACKS[index] || TRACKS[0];
    if (this.world) this.world.dispose();
    this.track = new Track(def.seed);
    this.terrain = new Terrain(this.track);
    this.world = new World(this);
    if (this.propShadows !== undefined) this.world.setPropShadows(this.propShadows);
    this.trackName = def.name;
    this.trackIndex = index;
    this.hud.setTrack(this.track);
    if (!first) {
      this.clearEffects();
      this.setupGrid();
      this.setAttract();
    }
  }

  createCars() {
    this.player = new Car(this, PLAYER_DEF, 0);
    this.rivals = RIVALS.map((d, i) => {
      const c = new Car(this, { ...d, kind: 'rival' }, i + 1);
      c.ai = new RivalAI(c, this, { aggro: d.aggro, skill: 1 });
      return c;
    });
    this.goons = [];
    for (let i = 0; i < CFG.MAX_GOONS; i++) {
      const c = new Car(this, { kind: 'goon', name: 'RAIDER', color: 0x2a1f33, color2: 0xff3355 }, 100 + i);
      c.ai = new GoonAI(c, this);
      c.setActive(false);
      this.goons.push(c);
    }
    this.racers = [this.player, ...this.rivals];
    this.allCars = [...this.racers, ...this.goons];
    this.autopilot = new RivalAI(this.player, this, { aggro: 0, skill: 0.96, canFire: false });
    const wmat = makeGlowMaterial();
    this.wheelMesh = new THREE.InstancedMesh(buildWheelGeometry(), wmat, this.allCars.length * 4);
    this.wheelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.wheelMesh.castShadow = true;
    this.wheelMesh.frustumCulled = false;
    this.scene.add(this.wheelMesh);
    this.setupGrid();
  }

  setupGrid() {
    const T = this.track;
    const order = [...this.rivals];
    // shuffle lightly so every race looks different
    for (let i = order.length - 1; i > 0; i--) {
      if (Math.random() < 0.5) { const j = i - 1; const t = order[i]; order[i] = order[j]; order[j] = t; }
    }
    const grid = [...order, this.player];
    grid.forEach((c, k) => {
      const row = Math.floor(k / 2), col = k % 2;
      const s = T.length - 14 - row * 9;
      c.reset();
      c.setActive(true);
      c.place(s, col === 0 ? -3.6 : 3.6, 0, s - T.length);
      if (c.ai) c.ai.reset();
    });
    this.autopilot.reset();
    for (const g of this.goons) { g.reset(); g.setActive(false); }
  }

  clearEffects() {
    for (const k in this.fxs) this.fxs[k].clear();
    this.weapons.clear();
    this.pendingBarrels = [];
    this.boomLight.intensity = 0;
    this.fx.reset();
  }

  // ================================================================ quality
  autoQuality() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    return coarse || small ? 'medium' : 'high';
  }

  applyQuality(q) {
    this.qualityName = q;
    const dpr = window.devicePixelRatio || 1;
    this.pixelRatio = q === 'high' ? Math.min(dpr, 2) : q === 'medium' ? Math.min(dpr, 1.5) : Math.min(dpr, 1);
    const shadows = q !== 'low';
    if (this.renderer.shadowMap.enabled !== shadows) {
      this.renderer.shadowMap.enabled = shadows;
      this.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); });
    }
    this.sun.castShadow = shadows;
    const ms = q === 'high' ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== ms) {
      this.sun.shadow.mapSize.set(ms, ms);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    }
    this.lowShadows = !shadows;
    this.world.setPropShadows(q === 'high');
    this.propShadows = q === 'high';
    this.post.enabled = q !== 'low';
    this.post.setSamples(q === 'high' ? 4 : 2);
    document.body.classList.toggle('q-low', q === 'low');
    this.renderer.setPixelRatio(this.pixelRatio);
    this.resize();
    if (this.ui) this.ui.refreshSettings();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.chase.setAspect(w / h);
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.post.setSize(Math.floor(w * pr), Math.floor(h * pr));
    document.body.classList.toggle('portrait', h > w);
  }

  onTouchMode(on) {
    document.body.classList.toggle('touch', on);
  }

  // ================================================================= states
  setAttract() {
    this.chase.mode = 'orbit';
    this.chase.snap(this.player);
  }

  toTitle(first = false) {
    this.state = 'title';
    this.clearEffects();
    this.setupGrid();
    this.setAttract();
    this.hud.show(false);
    this.ui.show('title');
    this.audio.setPaused(false);
    this.audio.setMusicMode(0);
    this.audio.silenceCar();
    document.body.classList.remove('racing');
    if (!first) this.audio.ui();
  }

  startRace() {
    this.audio.init();
    this.clearEffects();
    this.world.resetProps();
    this.setupGrid();
    this.timeLeft = CFG.START_TIME;
    this.score = 0;
    this.combo = 0;
    this.comboT = 0;
    this.comboName = '';
    this.bestCombo = 0;
    this.overdrive = 0;
    this.raceTime = 0;
    this.cpCount = 1;
    this.finishOrder = [];
    this.lastKillT = -10;
    this.spawnT = 2.6;
    this.wrongWay = 0;
    this.offT = 0;
    this.startPress = null;
    this.perfect = false;
    this.driftAcc = 0;
    this.lowBeat = 0;
    this.stats = { rivalKills: 0, goonKills: 0, rivalPts: 0, goonPts: 0, stylePts: 0, timeGained: 0, timeLost: 0 };
    this.playerPos = 8;
    this.prevPos = 8;
    this.countdown = 2.4;
    this.cdShown = -1;
    this.endT = 0;
    this.state = 'countdown';
    this.chase.mode = 'chase';
    this.chase.transition();
    this.chase.yaw = this.player.heading;
    this.hud.show(true);
    this.hud.feed.innerHTML = '';
    this.ui.hide();
    this.audio.setPaused(false);
    this.audio.setMusicMode(1);
    document.body.classList.add('racing');
    this.input.edges.clear();
  }

  pause() {
    if (this.state !== 'race' && this.state !== 'countdown') return;
    this.pausedFrom = this.state;
    this.state = 'paused';
    this.ui.show('pause');
    this.audio.setPaused(true);
    this.input.resetTouch();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = this.pausedFrom;
    this.ui.hide();
    this.audio.setPaused(false);
    this.last = performance.now();
  }

  autoPause() {
    if (this.state === 'race' || this.state === 'countdown') this.pause();
  }

  /** Test hook: fast-forward the simulation without rendering. */
  debugAdvance(seconds, dt = 1 / 60) {
    const n = Math.round(seconds / dt);
    for (let i = 0; i < n; i++) {
      this.input.update(dt);
      this.fx.update(dt);
      this.sim(dt * this.fx.timeScale(), dt);
      this.input.endFrame();
      if (this.state === 'results' || this.state === 'title') break;
    }
  }

  // ============================================================ main loop
  loop(now) {
    requestAnimationFrame(this.loop);
    let rdt = (now - this.last) / 1000;
    this.last = now;
    if (!(rdt > 0)) rdt = 0.016;
    rdt = Math.min(rdt, 0.05);
    this.realTime += rdt;
    this.frame(rdt);
  }

  frame(rdt) {
    this.input.update(rdt);
    this.globalInput();
    if (this.state !== 'paused') {
      this.fx.update(rdt);
      const dt = rdt * this.fx.timeScale();
      this.sim(dt, rdt);
    } else {
      this.ui.nav(this.input);
    }
    this.render(rdt);
    this.input.endFrame();
    this.trackPerf(rdt);
  }

  globalInput() {
    const inp = this.input;
    if (inp.take('mute')) {
      this.settings.music = !this.settings.music;
      this.audio.setMusic(this.settings.music);
      saveSettings(this.settings);
      this.ui.refreshSettings();
    }
    if (inp.take('fps')) { this.settings.showFps = !this.settings.showFps; saveSettings(this.settings); }
    if (inp.take('camera')) { this.settings.farCam = !this.settings.farCam; this.chase.far = this.settings.farCam; saveSettings(this.settings); }
    const st = this.state;
    if (st === 'race' || st === 'countdown') {
      if (inp.take('pause')) { this.pause(); return; }
      if (inp.take('restart')) { this.startRace(); return; }
    } else if (st === 'paused') {
      if (inp.take('pause')) { if (this.ui.current === 'pause') this.resume(); else this.ui.back(); return; }
      if (inp.take('restart')) { this.startRace(); return; }
    } else if (st === 'results' && this.ui.current === 'results' && !this.ui.editing) {
      if (inp.take('restart')) { this.startRace(); return; }
      if (inp.take('pause')) { this.toTitle(); return; }
    } else if (st === 'title' && this.ui.current === 'title') {
      if (inp.take('restart')) { this.startRace(); return; }
    }
  }

  trackPerf(rdt) {
    if (this.settings.quality !== 'auto' || this.state !== 'race') return;
    const p = this.perf;
    p.acc += rdt; p.n++;
    if (p.acc >= 2) {
      const avg = p.acc / p.n;
      p.acc = 0; p.n = 0;
      if (avg > 1 / 45) p.slow++; else p.slow = Math.max(0, p.slow - 1);
      if (p.slow >= 2) {
        p.slow = 0;
        if (this.qualityName === 'high') this.applyQuality('medium');
        else if (this.qualityName === 'medium') this.applyQuality('low');
      }
    }
  }

  // ============================================================ simulation
  sim(dt, rdt) {
    this.time += dt;
    const st = this.state;
    const P = this.player;
    const racing = st === 'race';

    if (st === 'title' || st === 'results' || st === 'paused') this.ui.nav(this.input);

    // ---------------- countdown
    if (st === 'countdown') {
      const before = this.countdown;
      this.countdown -= rdt;
      const n = Math.ceil(this.countdown / 0.8);
      if (n !== this.cdShown && n > 0) {
        this.cdShown = n;
        const hint = this.input.touchMode
          ? '<b>FIRE</b> SHOOT · <b>NITRO</b> BOOST · <b>DRIFT</b> BRAKE+SLIDE'
          : 'HOLD <b>SPACE</b> SHOOT · <b>SHIFT</b> NITRO · KILL TO GAIN TIME';
        this.hud.message(String(n), [], 'countdown', 0.75, hint);
        this.audio.countdown(false);
      }
      const gas = this.input.state.throttle > 0 && (!this.input.touchMode || this.input.anyPress || this.input.t.stickId !== null);
      if (this.input.touchMode) {
        if (this.input.anyPress && this.countdown < 0.55) this.startPress = this.countdown;
      } else if (gas) {
        if (this.startPress === null) this.startPress = this.countdown;
      } else this.startPress = null;
      if (this.countdown <= 0 && before > 0) this.go();
    }

    // ---------------- inputs
    const pin = P.input;
    if (st === 'race' && !P.dead && !P.finished && this.debugAuto) {
      const o = this.autopilot.update(dt, true);
      pin.throttle = o.throttle; pin.brake = o.brake; pin.steer = o.steer; pin.boost = P.nitro > 0.5;
      pin.fire = !!this.weapons.lockTarget;
    } else if (st === 'race' && !P.dead && !P.finished) {
      const s = this.input.state;
      pin.throttle = s.throttle; pin.brake = s.brake; pin.steer = s.steer; pin.boost = s.boost;
      const auto = this.settings.autoFire === 'always' || (this.settings.autoFire === 'touch' && this.input.touchMode);
      pin.fire = s.fire || (auto && !!this.weapons.lockTarget);
    } else if (st === 'countdown') {
      pin.throttle = 0; pin.brake = 0; pin.steer = 0; pin.boost = false; pin.fire = false;
    } else {
      const o = this.autopilot.update(dt, false);
      pin.throttle = o.throttle; pin.brake = o.brake; pin.steer = o.steer; pin.boost = false; pin.fire = false;
    }
    const aiRacing = st === 'race';
    for (const c of this.rivals) {
      if (st === 'countdown') { c.input.throttle = 0; c.input.brake = 0; c.input.steer = 0; c.input.boost = false; continue; }
      const o = c.ai.update(dt, aiRacing && this.raceTime > 4);
      Object.assign(c.input, o);
    }
    for (const g of this.goons) {
      if (!g.active) continue;
      Object.assign(g.input, g.ai.update(dt));
    }

    // ---------------- physics (sub-stepped)
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    if (h > 0) {
      for (let k = 0; k < steps; k++) {
        for (const c of this.allCars) {
          if (!c.active) continue;
          if (c.dead) c.updateWreck(h);
          else c.physics(h, c.input);
        }
        this.carCollisions();
      }
    }
    for (const c of this.racers) c.updateProgress();

    // ---------------- race logic
    if (racing) this.raceLogic(dt);
    else if (st === 'dying' || st === 'finished') this.endLogic(dt, rdt);
    if (st !== 'countdown') this.updateRespawns(dt);

    // weapons
    if (racing) this.weapons.updatePlayer(dt, P, pin.fire, this.overdrive > 0);
    else this.weapons.lockTarget = null;
    this.weapons.update(dt);
    this.updateBarrelChain(dt);

    // ---------------- effects & visuals
    for (const c of this.allCars) {
      c.updateVisual(dt, this.realTime);
      this.carFx(c, dt);
    }
    for (let i = 0; i < this.allCars.length; i++) this.allCars[i].writeWheels(this.wheelMesh, i * 4);
    this.wheelMesh.instanceMatrix.needsUpdate = true;
    this.fxs.sprites.update(dt);
    this.fxs.puffs.update(dt);
    this.fxs.debris.update(dt);
    this.fxs.rings.update(dt);
    this.world.update(dt);
    if (this.boomLight.intensity > 0) this.boomLight.intensity = Math.max(0, this.boomLight.intensity - dt * 120);

    // audio
    const audible = st === 'race' || st === 'countdown' || st === 'finished';
    this.audio.updateCar(P, audible);
    if (racing && this.timeLeft < 3.2) this.audio.heartbeat(this.timeLeft < 1.5 ? 2.6 : 1.7);

    // camera + hud
    this.chase.update(rdt, P);
    if (st !== 'title') this.hud.update(rdt);
  }

  go() {
    this.state = 'race';
    this.hud.message('GO!', [], 'go', 0.9);
    this.audio.countdown(true);
    this.fx.addTrauma(0.2);
    const sp = this.startPress;
    if (sp !== null && sp <= 0.55 && sp >= 0) {
      this.perfect = true;
      this.player.freeBoost = 1.4;
      this.hud.message('PERFECT START!', ['NITRO BURST'], 'go', 1.2);
      this.audio.boost();
      this.fx.doFlash(0.25, 0.4, 1, 1);
      this.addScore(250);
      this.stats.stylePts += 250;
    }
  }

  raceLogic(dt) {
    const P = this.player, T = this.track, L = T.length;
    this.raceTime += dt;
    // ---- timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver();
      return;
    }
    // ---- combo / overdrive
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) { this.combo = 0; this.comboName = ''; }
    }
    if (this.overdrive > 0) this.overdrive -= dt;
    // ---- checkpoints & laps
    const cpLen = L / CFG.CP_PER_LAP;
    while (P.progress >= this.cpCount * cpLen) {
      const j = this.cpCount;
      this.cpCount++;
      if (j >= CFG.LAPS * CFG.CP_PER_LAP) { this.finishRace(); return; }
      this.addTime(CFG.CP_TIME);
      this.stats.timeGained += CFG.CP_TIME;
      this.addScore(50);
      this.world.pulseGate(j % CFG.CP_PER_LAP);
      if (j % CFG.CP_PER_LAP === 0) {
        const lap = j / CFG.CP_PER_LAP + 1;
        const final = lap === CFG.LAPS;
        this.hud.message(final ? 'FINAL LAP' : `LAP ${lap}/${CFG.LAPS}`, [`+${CFG.CP_TIME}s`], 'lap', 1.6);
        this.audio.lap(final);
      } else {
        this.hud.popup(P.pos.x, P.pos.y + 3, P.pos.z, `CHECKPOINT +${CFG.CP_TIME}s`, 'cp');
        this.audio.checkpoint();
      }
    }
    // rivals finishing
    for (const c of this.rivals) {
      if (!c.finished && c.progress >= CFG.LAPS * L) {
        c.finished = true;
        this.finishOrder.push(c);
        this.hud.feedLine(`<b style="color:${hex(c.color)}">${c.name}</b> FINISHED P${this.finishOrder.length}`);
      }
    }
    // ---- positions
    let ahead = 0;
    for (const c of this.rivals) {
      if (c.finished || c.progress > P.progress) ahead++;
    }
    this.playerPos = ahead + 1;
    if (this.playerPos !== this.prevPos) {
      this.hud.bumpPos(this.playerPos < this.prevPos);
      this.prevPos = this.playerPos;
    }
    let lead = null;
    for (const c of this.rivals) if (!lead || c.progress > lead.progress) lead = c;
    this.leader = lead;
    // ---- wrong way / off track
    const fwdDot = Math.sin(P.heading) * T.tx[P.q.idx] + Math.cos(P.heading) * T.tz[P.q.idx];
    if (fwdDot < -0.35 && P.speed > 4) this.wrongWay += dt; else this.wrongWay = Math.max(0, this.wrongWay - dt * 3);
    if (Math.abs(P.q.lateral) > T.hw + 34) this.offT += dt; else this.offT = 0;
    if (this.offT > 2.2) this.recoverPlayer();
    // ---- drift scoring
    if (P.drifting && P.speed > 15) {
      this.driftAcc += dt;
      P.nitro = Math.min(1, P.nitro + dt * 0.1);
    } else if (this.driftAcc > 0) {
      if (this.driftAcc > 0.7) {
        const pts = Math.round(this.driftAcc * 120 / 10) * 10;
        this.addScore(pts);
        this.stats.stylePts += pts;
        const bonusT = this.driftAcc > 1.6 ? 0.5 : 0;
        this.hud.popup(P.pos.x, P.pos.y + 2.5, P.pos.z, `DRIFT +${pts}${bonusT ? ' · +0.5s' : ''}`, 'style');
        if (bonusT) { this.addTime(bonusT); this.stats.timeGained += bonusT; }
      }
      this.driftAcc = 0;
    }
    if (!P.grounded) P.nitro = Math.min(1, P.nitro + dt * 0.12);
    // ---- goons
    this.updateSpawns(dt);
    // ---- pickups
    for (const p of this.world.pickups) {
      if (!p.active) continue;
      const dx = p.x - P.pos.x, dz = p.z - P.pos.z;
      if (dx * dx + dz * dz < 3.6 * 3.6 && Math.abs(p.y - P.pos.y) < 4) this.collect(p);
    }
    // ---- low time warnings
    if (this.timeLeft < 3 && this.lowBeat <= 0) {
      this.lowBeat = 1;
      this.hud.message('KILL SOMETHING!', [], 'warn', 1.2);
    }
    if (this.timeLeft > 5) this.lowBeat = 0;
  }

  updateSpawns(dt) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    let alive = 0;
    for (const g of this.goons) if (g.active && !g.dead) alive++;
    const want = Math.min(CFG.MAX_GOONS, 3 + Math.floor(this.raceTime / 22));
    const desperate = this.timeLeft < 4.5;
    if (alive < want || (desperate && alive < CFG.MAX_GOONS)) this.spawnGoon(desperate);
    this.spawnT = desperate ? 0.9 : rand(1.4, 2.6);
  }

  spawnGoon(close) {
    const g = this.goons.find((c) => !c.active);
    if (!g) return;
    const P = this.player;
    const oncoming = Math.random() < 0.72;
    const T = this.track;
    let s;
    if (oncoming) s = P.q.s + (close ? rand(110, 140) : rand(150, 210));
    else s = P.q.s - rand(55, 80);
    const lat = rand(-T.hw + 2.5, T.hw - 2.5);
    g.reset();
    g.setActive(true);
    g.place(s, lat, 0);
    if (oncoming) {
      g.heading += Math.PI;
      const sp = rand(22, 30);
      g.vel.set(Math.sin(g.heading) * sp, 0, Math.cos(g.heading) * sp);
    } else {
      const sp = Math.max(20, P.speed * 0.95);
      g.vel.set(Math.sin(g.heading) * sp, 0, Math.cos(g.heading) * sp);
    }
    g.ai.reset(oncoming ? 'oncoming' : 'chase');
    g.lingerT = 0;
  }

  updateRespawns(dt) {
    const P = this.player;
    for (const c of this.rivals) {
      if (!c.dead) continue;
      c.respawnT += dt;
      if (c.respawnT > CFG.RIVAL_RESPAWN) {
        const s = c.q.s - 6;
        const prog = c.progress;
        const hp = c.st.hp;
        c.dead = false;
        c.hp = hp;
        c.burn = 0;
        c.respawnT = 0;
        c.place(s, rand(-4, 4), 18, prog - 6);
        c.ghost = 1.6;
        c.ai.reset();
        c.ai.startDelay = 0;
        this.fxs.rings.spawn(c.pos.x, c.pos.y, c.pos.z, 6, c.color, 0.5);
      }
    }
    for (const g of this.goons) {
      if (!g.active) continue;
      const dx = g.pos.x - P.pos.x, dz = g.pos.z - P.pos.z;
      const d2 = dx * dx + dz * dz;
      if (g.dead) {
        g.lingerT += dt;
        if (g.lingerT > CFG.GOON_LINGER && d2 > 30 * 30) g.setActive(false);
        else if (g.lingerT > 6) g.setActive(false);
      } else if (d2 > 280 * 280 || (this.state !== 'race' && d2 > 120 * 120)) {
        g.setActive(false);
      }
    }
  }

  recoverPlayer() {
    const P = this.player;
    this.offT = 0;
    P.place(P.q.s, 0, 14);
    P.ghost = 1.2;
    this.fx.doGlitch(0.8);
    this.hud.message('BACK ON TRACK', ['-1s'], 'warn', 1);
    this.timeLeft = Math.max(0.1, this.timeLeft - 1);
    this.hud.timeDelta(-1);
    this.chase.snap(P);
  }

  collect(p) {
    const P = this.player;
    p.active = false;
    p.timer = 12;
    this.audio.pickup(p.kind);
    if (p.kind === 'nitro') {
      P.nitro = Math.min(1, P.nitro + 0.45);
      this.hud.popup(p.x, p.y + 3, p.z, 'NITRO!', 'nitro');
      this.fx.doFlash(0.12, 0.3, 0.9, 1);
    } else {
      this.overdrive = Math.max(this.overdrive, 6);
      P.heat = 0; P.overheated = false;
      this.hud.message('OVERDRIVE!', ['NO HEAT · FAST FIRE'], 'od', 1.2);
      this.fx.doFlash(0.2, 1, 0.3, 0.6);
    }
    const col = p.kind === 'nitro' ? PAL.neonCyan : PAL.neonPink;
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      this.fxs.sprites.spawn(p.x, p.y + 1.5, p.z, Math.cos(a) * 12, rand(2, 9), Math.sin(a) * 12, 0.5, 0.8, 0.1, col, 1, 2, 10, 0.03);
    }
    this.fxs.rings.spawn(p.x, p.y, p.z, 7, col, 0.4);
  }

  // ========================================================= end of race
  gameOver() {
    const P = this.player;
    this.state = 'dying';
    this.endT = 0;
    this.endKind = 'dead';
    this.fx.slowmo(0.25, 1.4);
    this.fx.doFlash(0.6, 1, 0.2, 0.3);
    this.fx.addTrauma(0.7);
    this.fx.doGlitch(1);
    P.die(null, 'time');
    this.chase.mode = 'death';
    this.chase.orbitA = P.heading + Math.PI;
    this.hud.message("TIME'S UP", ['WRECKED BY THE CLOCK'], 'dead', 3);
    this.audio.lose();
    this.audio.silenceCar();
  }

  finishRace() {
    const P = this.player;
    P.finished = true;
    this.finishPos = this.finishOrder.length + 1;
    this.finishOrder.push(P);
    this.state = 'finished';
    this.endT = 0;
    this.endKind = 'finish';
    const won = this.finishPos === 1;
    this.won = won;
    this.fx.slowmo(0.3, 1.2);
    this.fx.doFlash(0.45, 1, 1, 1);
    this.fx.addTrauma(0.3);
    this.chase.mode = 'victory';
    this.chase.orbitA = P.heading + Math.PI * 0.75;
    this.autopilot.reset();
    this.autopilot.startDelay = 0;
    if (won) {
      this.hud.message('YOU WON<br>THE RIDE!', ['P1 · ' + this.trackName], 'win', 4);
      this.audio.win();
      this.audio.setMusicMode(2);
    } else {
      this.hud.message(`FINISHED P${this.finishPos}`, ['NOT BAD. NOT FIRST.'], 'lap', 3.5);
      this.audio.lap(true);
    }
  }

  endLogic(dt, rdt) {
    this.endT += rdt;
    const P = this.player;
    if (this.endKind === 'finish' && this.won && this.endT < 3.2) {
      if (Math.random() < 0.6) {
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2, r = rand(0, 4);
          this.fxs.sprites.spawn(P.pos.x + Math.cos(a) * r, P.pos.y + rand(3, 7), P.pos.z + Math.sin(a) * r,
            rand(-8, 8), rand(6, 16), rand(-8, 8), rand(1.2, 2), 0.5, 0.4, CONFETTI[i % CONFETTI.length], 1, 0.9, 9);
        }
      }
      if (Math.random() < 0.035) {
        const x = P.pos.x + rand(-20, 20), z = P.pos.z + rand(-20, 20), y = P.pos.y + rand(12, 20);
        const col = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2, b = Math.acos(rand(-1, 1));
          const sp = rand(10, 16);
          this.fxs.sprites.spawn(x, y, z, Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp, rand(0.8, 1.3), 0.7, 0.2, col, 1, 1.5, 8, 0.02);
        }
        this.audio.explosion(0.3, 60);
      }
    }
    if (this.state === 'dying' || this.state === 'finished') {
      this.updateRespawns(0);
      if (this.endT > (this.endKind === 'finish' ? 3.6 : 2.4)) this.showResults();
    }
  }

  showResults() {
    const P = this.player;
    const finished = this.endKind === 'finish';
    let finishPts = 0, timePts = 0;
    if (finished) {
      finishPts = [0, 5000, 3000, 2000, 1000][this.finishPos] || 500;
      timePts = Math.round(this.timeLeft * 200);
      this.addScore(finishPts + timePts);
    }
    this.state = 'results';
    this.audio.setMusicMode(0);
    this.hud.show(false);
    this.ui.showResults({
      title: finished ? (this.won ? 'YOU WON THE RIDE!' : `FINISHED P${this.finishPos}`) : "TIME'S UP",
      cls: finished ? (this.won ? 'win' : 'fin') : 'dead',
      sub: finished
        ? `${this.trackName} · ${fmt(this.raceTime)}`
        : `${this.trackName} · LAP ${Math.min(CFG.LAPS, Math.max(1, P.lap + 1))}/${CFG.LAPS} · P${this.playerPos}`,
      score: Math.round(this.score),
      rivalKills: this.stats.rivalKills, rivalPts: this.stats.rivalPts,
      goonKills: this.stats.goonKills, goonPts: this.stats.goonPts,
      bestCombo: this.bestCombo, stylePts: this.stats.stylePts,
      finished, pos: this.finishPos, finishPts, timePts, timeLeft: this.timeLeft,
      won: !!(finished && this.won), track: this.trackName,
    });
  }

  // ================================================================ scoring
  addScore(n) { this.score += n; }

  addTime(v) {
    this.timeLeft = clamp(this.timeLeft + v, 0, CFG.MAX_TIME);
    this.hud.timeDelta(v);
    if (v > 0) this.audio.timeGain();
  }

  registerKill(car, cause) {
    const P = this.player;
    const isRival = car.kind === 'rival';
    this.combo = this.comboT > 0 ? Math.min(CFG.COMBO_MAX, this.combo + 1) : 1;
    this.comboT = CFG.COMBO_WINDOW;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const tags = [];
    let bonus = 0;
    if (cause === 'headon') { tags.push('HEAD-ON'); bonus += 150; }
    else if (cause === 'ram') { tags.push('RAM'); bonus += 75; }
    if (P.boosting && (cause === 'ram' || cause === 'headon')) { tags.push('NITRO SLAM'); bonus += 100; }
    if (!P.grounded && P.airTime > 0.2) { tags.push('AIRBORNE'); bonus += 150; }
    if (P.drifting) { tags.push('DRIFT KILL'); bonus += 100; }
    if (cause === 'barrel') { tags.push('KABOOM'); bonus += 100; }
    if (cause === 'explosion') { tags.push('CHAIN'); bonus += 100; }
    const dx = car.pos.x - P.pos.x, dz = car.pos.z - P.pos.z;
    if (cause === 'gun' && dx * dx + dz * dz > 55 * 55) { tags.push('LONG SHOT'); bonus += 75; }
    if (P.lastAttacker === car && this.time - P.lastAttackT < 5) { tags.push('REVENGE'); bonus += 100; }
    if (isRival && this.leader === car && this.playerPos > 1) { tags.push('LEADER DOWN'); bonus += 200; }
    if (this.time - this.lastKillT < 0.8) { tags.push('MULTI'); bonus += 100; }
    this.lastKillT = this.time;
    const pts = (isRival ? 250 : 100 + 0) * this.combo + bonus * this.combo;
    this.addScore(pts);
    // kill time grows with the combo: chaining is how you stay alive
    const tg = isRival
      ? CFG.KILL_TIME_RIVAL + Math.min(2, 0.5 * (this.combo - 1))
      : CFG.KILL_TIME_GOON + Math.min(1.5, 0.25 * (this.combo - 1));
    this.addTime(tg);
    this.stats.timeGained += tg;
    if (isRival) { this.stats.rivalKills++; this.stats.rivalPts += pts; } else { this.stats.goonKills++; this.stats.goonPts += pts; }
    P.nitro = Math.min(1, P.nitro + (isRival ? 0.2 : 0.1));
    P.kills++;
    // juice
    this.fx.hitStop(isRival ? 0.075 : 0.045);
    this.fx.addTrauma(isRival ? 0.45 : 0.3);
    this.fx.doFlash(isRival ? 0.22 : 0.12, 1, 0.85, 0.7);
    this.fx.aberrate(0.6);
    this.audio.kill(this.combo);
    this.hud.popup(car.pos.x, car.pos.y + 2.5, car.pos.z, `+${pts}`, isRival ? 'kill big' : 'kill');
    this.hud.hit(true);
    if (this.combo >= 2) {
      this.comboName = COMBO_NAMES[Math.min(this.combo, COMBO_NAMES.length - 1)];
      this.hud.bumpCombo();
    }
    const nameHtml = `<b style="color:${hex(isRival ? car.color : 0xff3355)}">${car.name}</b>`;
    this.hud.feedLine(`${nameHtml} WRECKED${tags.length ? ' · <i>' + tags.join(' · ') + '</i>' : ''}`);
    if (isRival) {
      this.hud.message(KILL_WORDS[Math.floor(Math.random() * KILL_WORDS.length)], [`${car.name} +${tg}s`], 'kill', 1.1);
    }
    if (this.combo >= 5) {
      if (this.overdrive <= 0) this.hud.message('OVERDRIVE!', [`COMBO x${this.combo}`], 'od', 1.2);
      this.overdrive = Math.max(this.overdrive, 5);
      P.heat = 0; P.overheated = false;
    }
  }

  // ================================================================ events
  onCarKilled(car, killer, cause) {
    const big = car.kind === 'rival' ? 1.35 : 1;
    this.explode(car.pos.x, car.pos.y + 0.8, car.pos.z, big, car, killer, cause);
    if (car.isPlayer) return;
    if (killer === this.player && this.state === 'race') this.registerKill(car, cause);
    else if (car.kind === 'rival' && this.state === 'race') this.hud.feedLine(`<b style="color:${hex(car.color)}">${car.name}</b> CRASHED OUT`);
    car.respawnT = 0;
  }

  onPlayerDamage(amount, attacker, cause) {
    if (this.state !== 'race') return;
    const P = this.player;
    if (P.invuln > 0) return;
    let loss = 0;
    if (cause === 'bolt') loss = attacker && attacker.kind === 'rival' ? CFG.BOLT_PENALTY + 0.1 : CFG.BOLT_PENALTY - 0.1;
    else if (cause === 'ram' || cause === 'headon') {
      if (P.boosting) return;
      loss = clamp(amount * 0.022, 0.2, 1.4);
    } else if (cause === 'barrel') loss = CFG.BARREL_PENALTY;
    else if (cause === 'explosion') loss = clamp(amount * 0.02, 0.2, 1.0);
    if (loss <= 0) return;
    loss = Math.round(loss * 10) / 10;
    this.timeLeft = Math.max(0, this.timeLeft - loss);
    this.stats.timeLost += loss;
    this.hud.timeDelta(-loss);
    P.invuln = 0.3;
    this.fx.hurt(0.45 + loss * 0.3);
    this.fx.addTrauma(0.22 + loss * 0.18);
    this.fx.doGlitch(0.3);
    this.fx.aberrate(0.4);
    this.audio.playerHit();
  }

  onBulletHit(target, p, killed) {
    const sp = this.fxs.sprites;
    for (let i = 0; i < 5; i++) {
      sp.spawn(p.x, p.y, p.z, -p.dx * rand(4, 14) + rand(-6, 6), rand(2, 9), -p.dz * rand(4, 14) + rand(-6, 6), rand(0.15, 0.3), 0.35, 0.05, 0xffd27a, 1, 1, 25, 0.04);
    }
    sp.spawn(p.x, p.y, p.z, 0, 0, 0, 0.06, 1.6, 0.6, 0xffffff, 1);
    if (Math.random() < 0.25) this.fxs.debris.spawn(p.x, p.y, p.z, -p.dx * 6 + rand(-3, 3), rand(3, 7), -p.dz * 6 + rand(-3, 3), 0.25, target.color, 1.2, target.q.idx);
    if (!killed) { this.audio.hit(); this.hud.hit(false); }
    target.vel.x += p.dx * 0.25; target.vel.z += p.dz * 0.25;
  }

  onBoltHitPlayer(b) {
    const P = this.player;
    P.damage(1, b.owner, 'bolt');
    const col = b.kind === 'rival' ? 0xff3fd0 : 0xff4030;
    for (let i = 0; i < 12; i++) {
      this.fxs.sprites.spawn(b.x, b.y, b.z, rand(-10, 10), rand(2, 10), rand(-10, 10), rand(0.2, 0.4), 0.6, 0.05, col, 1, 2, 20, 0.03);
    }
    this.fxs.sprites.spawn(b.x, b.y, b.z, 0, 0, 0, 0.12, 4, 1, col, 1);
    this.fx.kick((Math.random() - 0.5) * 1.2, 0.6);
  }

  boltSplash(x, y, z, col) {
    for (let i = 0; i < 5; i++) this.fxs.sprites.spawn(x, y + 0.3, z, rand(-6, 6), rand(2, 7), rand(-6, 6), 0.3, 0.5, 0.05, col, 1, 2, 20, 0.03);
    this.fxs.puffs.spawn(x, y + 0.4, z, 0, 2, 0, 0.5, 0.6, 0xf2d6b8, 0xe8c8a8, 0, 0, 3, -1, 0.5);
  }

  onWallHit(car, impact, x, z) {
    const near = this.distToPlayer(car) < 90;
    if (!near) return;
    const y = car.pos.y + 0.6;
    const n = Math.min(14, Math.floor(impact / 2));
    for (let i = 0; i < n; i++) this.fxs.sprites.spawn(x, y, z, rand(-10, 10), rand(2, 10), rand(-10, 10), rand(0.15, 0.35), 0.35, 0.05, 0xffc860, 1, 1, 26, 0.05);
    this.audio.impact(impact, this.distToPlayer(car));
    if (car.isPlayer) {
      this.fx.addTrauma(Math.min(0.45, impact * 0.012));
      this.fx.kick(rand(-0.4, 0.4), 0.3);
    }
  }

  onPropSmash(car, c, impact) {
    this.world.breakProp(c);
    const near = this.distToPlayer(car) < 120;
    if (!near) return;
    const cols = c.kind === 'cactus' ? [0x2f9e6e, 0x3fbf86] : c.kind === 'post' ? [0xf4eefc, 0xff2e88] : [0x16121c, 0xffe23d];
    const n = c.kind === 'post' ? 4 : 8;
    for (let i = 0; i < n; i++) {
      this.fxs.debris.spawn(c.x, (c.y || car.pos.y) + rand(0.5, 2.5), c.z,
        car.vel.x * rand(0.3, 0.8) + rand(-4, 4), rand(4, 10), car.vel.z * rand(0.3, 0.8) + rand(-4, 4),
        c.kind === 'post' ? 0.3 : 0.5, cols[i % 2], 2.5, car.q.idx);
    }
    this.fxs.puffs.spawn(c.x, (c.y || car.pos.y) + 0.5, c.z, car.vel.x * 0.2, 1.5, car.vel.z * 0.2, 0.7, 1.4, 0xf6dcc0, 0xf0d0b0, 0, 0, 2.5, -1, 0.5);
    this.audio.smash();
    if (car.isPlayer) {
      this.fx.addTrauma(0.08);
      if (this.state === 'race') {
        const pts = c.kind === 'sign' ? 50 : 20;
        this.addScore(pts);
        this.stats.stylePts += pts;
        if (c.kind !== 'post') this.hud.popup(c.x, (c.y || 0) + 3, c.z, `+${pts}`, 'small');
      }
    }
  }

  onBarrelHit(c, car) {
    this.explodeBarrel(c, car.isPlayer ? car : (car.lastAttacker === this.player ? this.player : car));
  }

  explodeBarrel(c, owner) {
    if (!c.alive) return;
    this.world.breakProp(c);
    const y = (c.y || this.world.groundAt(c.x, c.z)) + 0.7;
    this.explode(c.x, y, c.z, 1.15, null, owner, 'barrel');
    // chain reaction
    this.world.forColliders(c.x, c.z, 9, (o) => {
      if (o.kind !== 'barrel' || !o.alive || o === c) return false;
      const dx = o.x - c.x, dz = o.z - c.z;
      if (dx * dx + dz * dz < 8 * 8 && !this.pendingBarrels.some((p) => p.c === o)) {
        this.pendingBarrels.push({ c: o, t: 0.12 + Math.random() * 0.12, owner });
      }
      return false;
    });
  }

  updateBarrelChain(dt) {
    for (let i = this.pendingBarrels.length - 1; i >= 0; i--) {
      const p = this.pendingBarrels[i];
      p.t -= dt;
      if (p.t <= 0) {
        this.pendingBarrels.splice(i, 1);
        this.explodeBarrel(p.c, p.owner);
      }
    }
  }

  onCarLand(car, impact, air) {
    const near = this.distToPlayer(car) < 100;
    if (near && impact > 6) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        this.fxs.puffs.spawn(car.pos.x + Math.cos(a) * 1.5, car.pos.y + 0.3, car.pos.z + Math.sin(a) * 1.5,
          Math.cos(a) * 6, 1, Math.sin(a) * 6, rand(0.5, 0.8), rand(0.8, 1.3), 0xf6dcc0, 0xf0d0b0, 0, 0, 3, -1, 0.5);
      }
      if (impact > 12) this.fxs.rings.spawn(car.pos.x, car.pos.y, car.pos.z, 5, 0xffd9a8, 0.35);
    }
    if (car.isPlayer) {
      this.audio.land(impact);
      this.fx.addTrauma(Math.min(0.35, impact * 0.014));
      if (this.state === 'race' && air > 0.55) {
        const pts = Math.round(air * 300 / 10) * 10;
        this.addScore(pts);
        this.stats.stylePts += pts;
        const bonusT = air > 0.9 ? 0.5 : 0;
        this.hud.popup(car.pos.x, car.pos.y + 3, car.pos.z, `AIR ${air.toFixed(1)}s +${pts}${bonusT ? ' · +0.5s' : ''}`, 'style');
        if (bonusT) { this.addTime(bonusT); this.stats.timeGained += bonusT; }
      }
    }
  }

  onWreckBounce(car, imp) {
    if (this.distToPlayer(car) > 100) return;
    for (let i = 0; i < 6; i++) this.fxs.sprites.spawn(car.pos.x, car.pos.y, car.pos.z, rand(-8, 8), rand(2, 8), rand(-8, 8), 0.3, 0.4, 0.05, 0xffc860, 1, 1, 25, 0.05);
    this.fxs.puffs.spawn(car.pos.x, car.pos.y - 0.2, car.pos.z, 0, 2, 0, 0.8, 1.6, 0xf6dcc0, 0xf0d0b0, 0, 0, 2, -1, 0.5);
    if (imp > 8) this.audio.impact(imp, this.distToPlayer(car));
  }

  overheatFx() {}

  onOverheat() {
    this.audio.overheat();
    this.hud.popup(this.player.pos.x, this.player.pos.y + 3, this.player.pos.z, 'OVERHEAT!', 'warn');
  }

  distToPlayer(c) {
    const dx = c.pos.x - this.player.pos.x, dz = c.pos.z - this.player.pos.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ============================================================ explosions
  explode(x, y, z, size, car, owner, cause) {
    const fxs = this.fxs;
    const P = this.player;
    const dx = x - P.pos.x, dz = z - P.pos.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    // core flash
    fxs.sprites.spawn(x, y + 0.5, z, 0, 0, 0, 0.16, 9 * size, 14 * size, 0xfff3c0, 1);
    fxs.sprites.spawn(x, y + 0.5, z, 0, 0, 0, 0.3, 6 * size, 9 * size, 0xff8a30, 0.9);
    // fireball
    const nf = Math.round(14 * size);
    for (let i = 0; i < nf; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random();
      fxs.puffs.spawn(x + Math.cos(a) * r, y + rand(0, 1), z + Math.sin(a) * r,
        Math.cos(a) * rand(3, 10) * size, rand(3, 10), Math.sin(a) * rand(3, 10) * size,
        rand(0.45, 0.8), rand(1.2, 2.0) * size, i % 3 ? 0xffb03a : 0xffe08a, 0x8a2a2a, 1, 0.25, 3, -4, 0.95);
    }
    // smoke
    for (let i = 0; i < 8 * size; i++) {
      fxs.puffs.spawn(x + rand(-1.5, 1.5), y + rand(1, 2.5), z + rand(-1.5, 1.5), rand(-2, 2), rand(4, 8), rand(-2, 2),
        rand(1.0, 1.6), rand(1.1, 1.8) * size, 0x6a4a5a, 0x3a2a3a, 0, 0, 1.5, -3, 0.75);
    }
    // sparks
    for (let i = 0; i < 26 * size; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(10, 30);
      fxs.sprites.spawn(x, y, z, Math.cos(a) * sp, rand(4, 22), Math.sin(a) * sp, rand(0.3, 0.8), 0.45, 0.05, i % 2 ? 0xffd27a : 0xff8040, 1, 1.2, 28, 0.035);
    }
    // debris
    if (car) {
      for (let i = 0; i < 10; i++) {
        const cc = i % 3 === 0 ? 0x1d1726 : i % 3 === 1 ? car.color : car.color2;
        fxs.debris.spawn(x + rand(-1, 1), y + rand(0, 1), z + rand(-1, 1), car.vel.x * 0.4 + rand(-12, 12), rand(8, 20), car.vel.z * 0.4 + rand(-12, 12), rand(0.3, 0.7), cc, rand(2, 3.5), car.q.idx);
      }
    } else {
      for (let i = 0; i < 6; i++) fxs.debris.spawn(x, y, z, rand(-12, 12), rand(8, 18), rand(-12, 12), rand(0.3, 0.5), i % 2 ? 0xe0303a : 0xffd23d, rand(2, 3), -1);
    }
    fxs.rings.spawn(x, y - 0.6, z, 11 * size, 0xffb070, 0.45);
    this.boomLight.position.set(x, y + 2, z);
    this.boomLight.intensity = 60 * size;
    // camera + audio
    const k = Math.max(0, 1 - d / 90);
    this.fx.addTrauma(0.55 * size * k);
    if (d < 40) this.fx.aberrate(0.3 * k);
    this.audio.explosion(size, d);
    // area damage + knockback
    const R = cause === 'barrel' ? 9 : 7;
    const maxD = cause === 'barrel' ? 85 : 45;
    for (const o of this.allCars) {
      if (!o.active || o.dead || o === car) continue;
      const ox = o.pos.x - x, oz = o.pos.z - z;
      const od = Math.sqrt(ox * ox + oz * oz);
      if (od > R) continue;
      const f = 1 - od / R;
      if (o.isPlayer && owner === o) {
        o.vel.x += (ox / (od || 1)) * 4 * f; o.vel.z += (oz / (od || 1)) * 4 * f;
        continue;
      }
      o.vel.x += (ox / (od || 1)) * 14 * f;
      o.vel.z += (oz / (od || 1)) * 14 * f;
      o.vy += 7 * f;
      o.grounded = false;
      o.damage(maxD * f, owner, o.isPlayer && cause === 'barrel' ? 'barrel' : 'explosion');
    }
  }

  // ============================================================ collisions
  carCollisions() {
    const cars = this.allCars;
    const n = cars.length;
    for (let i = 0; i < n; i++) {
      const a = cars[i];
      if (!a.active || a.dead) continue;
      for (let j = i + 1; j < n; j++) {
        const b = cars[j];
        if (!b.active || b.dead) continue;
        if (a.ghost > 0 || b.ghost > 0) continue;
        const dx0 = b.pos.x - a.pos.x, dz0 = b.pos.z - a.pos.z;
        if (dx0 * dx0 + dz0 * dz0 > 36) continue;
        if (Math.abs(a.pos.y - b.pos.y) > 2.2) continue;
        // two circles per car; find the deepest overlap
        const afx = Math.sin(a.heading), afz = Math.cos(a.heading);
        const bfx = Math.sin(b.heading), bfz = Math.cos(b.heading);
        let best = 0, nx = 0, nz = 0;
        const rr = a.st.radius + b.st.radius;
        for (let p = -1; p <= 1; p += 2) {
          const ax = a.pos.x + afx * a.st.axle * p, az = a.pos.z + afz * a.st.axle * p;
          for (let q = -1; q <= 1; q += 2) {
            const bx = b.pos.x + bfx * b.st.axle * q, bz = b.pos.z + bfz * b.st.axle * q;
            const dx = bx - ax, dz = bz - az;
            const d2 = dx * dx + dz * dz;
            if (d2 < rr * rr) {
              const d = Math.sqrt(d2) || 0.001;
              const pen = rr - d;
              if (pen > best) { best = pen; nx = dx / d; nz = dz / d; }
            }
          }
        }
        if (best <= 0) continue;
        const ma = a.st.mass, mb = b.st.mass;
        const ia = 1 / ma, ib = 1 / mb;
        const sum = ia + ib;
        a.pos.x -= nx * best * (ia / sum); a.pos.z -= nz * best * (ia / sum);
        b.pos.x += nx * best * (ib / sum); b.pos.z += nz * best * (ib / sum);
        const rel = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz;
        if (rel >= 0) continue;
        const e = 0.3;
        const jimp = (-(1 + e) * rel) / sum;
        a.vel.x -= jimp * ia * nx; a.vel.z -= jimp * ia * nz;
        b.vel.x += jimp * ib * nx; b.vel.z += jimp * ib * nz;
        const impact = -rel;
        // spin from off-centre hits
        const crossA = afx * nz - afz * nx;
        const crossB = bfx * nz - bfz * nx;
        a.yawRate += crossA * impact * 0.045 * ia;
        b.yawRate -= crossB * impact * 0.045 * ib;
        this.ramDamage(a, b, impact, nx, nz);
      }
    }
  }

  ramDamage(a, b, impact, nx, nz) {
    if (impact < 5.5) return;
    const P = this.player;
    const aInto = a.vel.x * nx + a.vel.z * nz;
    const bInto = -(b.vel.x * nx + b.vel.z * nz);
    const headOn = (Math.sin(a.heading) * Math.sin(b.heading) + Math.cos(a.heading) * Math.cos(b.heading)) < -0.5 && impact > 30;
    const base = (impact - 5) * 3.0;
    const aiOnly = !a.isPlayer && !b.isPlayer;
    const k = aiOnly ? 0.3 : 1;
    const dmgToB = base * k * Math.sqrt(a.st.mass / b.st.mass) * (aInto >= bInto ? 1.25 : 0.75) * a.st.ramPower * (a.boosting ? 2.2 : 1);
    const dmgToA = base * k * Math.sqrt(b.st.mass / a.st.mass) * (bInto > aInto ? 1.25 : 0.75) * b.st.ramPower * (b.boosting ? 2.2 : 1);
    const cause = headOn ? 'headon' : 'ram';
    // effects at contact
    const cx = (a.pos.x + b.pos.x) / 2, cz = (a.pos.z + b.pos.z) / 2, cy = (a.pos.y + b.pos.y) / 2 + 0.7;
    const near = Math.hypot(cx - P.pos.x, cz - P.pos.z) < 90;
    if (near) {
      const ns = Math.min(18, Math.floor(impact / 1.5));
      for (let i = 0; i < ns; i++) this.fxs.sprites.spawn(cx, cy, cz, rand(-12, 12), rand(2, 12), rand(-12, 12), rand(0.2, 0.45), 0.4, 0.05, 0xffd27a, 1, 1, 26, 0.04);
      this.audio.impact(impact, Math.hypot(cx - P.pos.x, cz - P.pos.z));
    }
    if (a.isPlayer || b.isPlayer) {
      this.fx.addTrauma(Math.min(0.5, impact * 0.012));
      if (impact > 18) this.fx.hitStop(0.03);
    }
    // the stronger hit resolves first; a car that dies deals no damage back
    if (dmgToB >= dmgToA) {
      const killed = b.damage(dmgToB, a, cause);
      if (!killed) a.damage(dmgToA, b, cause);
    } else {
      const killed = a.damage(dmgToA, b, cause);
      if (!killed) b.damage(dmgToB, a, cause);
    }
  }

  // ============================================================ car effects
  carFx(c, dt) {
    if (!c.active || dt <= 0) return;
    const P = this.player;
    const dx = c.pos.x - P.pos.x, dz = c.pos.z - P.pos.z;
    if (dx * dx + dz * dz > 150 * 150) { c.skid[0].on = c.skid[1].on = false; return; }
    const fxs = this.fxs;
    if (c.dead) {
      c.fireT += dt * 26;
      while (c.fireT > 1) {
        c.fireT -= 1;
        const old = c.wreckT > 2;
        fxs.puffs.spawn(c.pos.x + rand(-0.8, 0.8), c.pos.y + 0.6, c.pos.z + rand(-0.8, 0.8), rand(-1, 1), rand(3, 6), rand(-1, 1),
          rand(0.5, 0.9), rand(0.6, 1.1), old ? 0x5a4550 : 0xffa030, old ? 0x3a2a35 : 0x5a2028, old ? 0 : 1, 0, 1, -3, old ? 0.6 : 0.9);
      }
      return;
    }
    const sp = c.speed;
    // dust trail
    if (c.grounded && sp > 6) {
      c.dustT += dt * (c.onRoad ? sp * 0.14 : sp * 0.5) * (c.drifting ? 2.6 : 1);
      while (c.dustT > 1) {
        c.dustT -= 1;
        const side = Math.random() < 0.5 ? -0.9 : 0.9;
        c.localToWorld(side, 0.2, -1.5, _w);
        const lift = c.drifting ? 1.3 : 1;
        fxs.puffs.spawn(_w.x, _w.y, _w.z, -c.vel.x * 0.12 + rand(-1.5, 1.5), rand(0.8, 2.5), -c.vel.z * 0.12 + rand(-1.5, 1.5),
          rand(0.6, 1.1), rand(0.6, 1.05) * lift, c.drifting ? 0xfff0dc : 0xf6dcc0, 0xf0d0b0, 0, 0, 2.2, -1.2, c.drifting ? 0.5 : c.onRoad ? 0.3 : 0.45);
      }
    }
    // skid marks
    const slipping = c.grounded && (c.drifting || Math.abs(c.slip) > 4.5 || (c.input.brake > 0 && c.fwdSpeed > 12));
    for (let k = 0; k < 2; k++) {
      const sk = c.skid[k];
      if (slipping) {
        c.localToWorld(k ? 0.86 : -0.86, 0, -1.32, _w);
        _w.y = this.world.groundAt(_w.x, _w.z, c.q.idx) + 0.04;
        if (sk.on) fxs.skids.add(sk.x, sk.y, sk.z, _w.x, _w.y, _w.z, 0.38);
        sk.x = _w.x; sk.y = _w.y; sk.z = _w.z; sk.on = true;
      } else sk.on = false;
    }
    // nitro flames
    if (c.boosting) {
      c.localToWorld(c.kind === 'goon' ? 0.4 : 0.55, 0.38, -2.3, _w);
      const bx = -Math.sin(c.heading), bz = -Math.cos(c.heading);
      for (let i = 0; i < 2; i++) {
        fxs.sprites.spawn(_w.x, _w.y, _w.z, c.vel.x + bx * rand(10, 18), rand(0, 1), c.vel.z + bz * rand(10, 18), rand(0.1, 0.18), rand(0.5, 0.8), 0.1, i ? 0x29f3ff : 0xff5ab0, 1, 0, 0, 0.025);
      }
      if (c.isPlayer && Math.random() < 0.3) {
        c.localToWorld(-0.55, 0.38, -2.3, _w2);
        fxs.sprites.spawn(_w2.x, _w2.y, _w2.z, c.vel.x + bx * 14, 0, c.vel.z + bz * 14, 0.14, 0.6, 0.1, 0x29f3ff, 1, 0, 0, 0.025);
      }
    }
    // damage smoke / fire
    const hurt = c.isPlayer ? (this.state === 'race' && this.timeLeft < 3 ? 0.2 : 1) : c.hp / c.st.hp;
    if (hurt < 0.55) {
      c.smokeT += dt * (hurt < 0.25 ? 18 : 9);
      while (c.smokeT > 1) {
        c.smokeT -= 1;
        c.localToWorld(rand(-0.4, 0.4), 1.1, 1.3, _w);
        const fire = hurt < 0.25 && Math.random() < 0.5;
        fxs.puffs.spawn(_w.x, _w.y, _w.z, c.vel.x * 0.5 + rand(-1, 1), rand(2, 4), c.vel.z * 0.5 + rand(-1, 1),
          rand(0.5, 0.8), rand(0.4, 0.7), fire ? 0xffa030 : 0x6a5560, fire ? 0x5a2028 : 0x3f3440, fire ? 1 : 0, 0, 1.2, -2, fire ? 0.9 : 0.6);
      }
    }
  }

  // ================================================================ render
  render() {
    const P = this.player;
    const look = this.chase.lookAt;
    // shadow camera follows the view, snapped to texels to avoid shimmer
    const ms = this.sun.shadow.mapSize.x;
    const texel = 120 / ms;
    const sx = Math.round(look.x / texel) * texel, sz = Math.round(look.z / texel) * texel;
    this.sun.position.set(sx + LIGHT_DIR.x * 200, look.y + LIGHT_DIR.y * 200, sz + LIGHT_DIR.z * 200);
    this.sun.target.position.set(sx, look.y, sz);
    this.sun.target.updateMatrixWorld();
    this.sky.position.copy(this.camera.position);
    this.sky.material.uniforms.uTime.value = this.realTime;
    let speedK = 0;
    if (this.state === 'race' || this.state === 'countdown') {
      speedK = P.boosting ? 0.9 : clamp((P.speed - 46) / 20, 0, 1) * 0.5;
    }
    const lowK = this.state === 'race' && this.timeLeft < 3 ? 0.5 + 0.5 * Math.sin(this.realTime * 12) : 0;
    if (!this.post.enabled) {
      const el = this.hud.lowFlash;
      const v = Math.min(0.8, this.fx.damage + lowK * 0.4);
      el.style.opacity = v.toFixed(2);
    }
    this.post.render(this.scene, this.camera, this.fx, this.realTime, speedK, lowK);
  }
}

function fmt(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
}

export { wrapAngle };
