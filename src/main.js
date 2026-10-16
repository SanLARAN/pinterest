// ТИШЕ / HUSH — entry point: renderer, boot, menu attract mode, state machine, main loop.
import '@fontsource/rubik-wet-paint/cyrillic-400.css';
import '@fontsource/rubik-wet-paint/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './style.css';

import * as THREE from 'three';
import { CFG } from './core/config.js';
import { settings, saveSettings, submitScore } from './core/storage.js';
import { setLang, t } from './core/i18n.js';
import { World } from './world/world.js';
import { shared, createWorldMaterial, createMotes, createSky } from './render/sonar.js';
import { Pulses } from './render/pulses.js';
import { Post } from './render/post.js';
import { Ghosts } from './render/ghosts.js';
import { Eyes } from './render/eyes.js';
import { Particles } from './render/particles.js';
import { audio } from './audio/audio.js';
import { mic, Mic } from './audio/mic.js';
import { Input } from './input/input.js';
import { HUD, fmtTime, fmtScore } from './ui/hud.js';
import { Radar } from './ui/radar.js';
import { Menus } from './ui/menus.js';
import { Game } from './game/game.js';
import { buildListener } from './game/monsters.js';

setLang(settings.lang);

const params = new URLSearchParams(location.search);
const DEBUG = {
  t: parseFloat(params.get('t')) || 0,
  speed: parseFloat(params.get('speed')) || 1,
  autostart: params.has('autostart'),
  nomic: params.has('nomic'),
  fps: params.has('fps'),
};

const $ = (id) => document.getElementById(id);
const canvas = $('gl');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
} catch (e) {
  $('bootText').textContent = 'WebGL2 недоступен / WebGL2 is not available';
  throw e;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.info.autoReset = false;
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CFG.FOV, innerWidth / innerHeight, 0.05, CFG.CAMERA_FAR);
camera.rotation.order = 'YXZ';
const post = new Post(renderer);

// ---------------- systems ----------------
const worldMat = createWorldMaterial();
const world = new World(scene, worldMat);
const pulses = new Pulses();
const ghosts = new Ghosts(scene);
const eyes = new Eyes(scene);
const particles = new Particles(scene);
const motes = createMotes(2600);
scene.add(motes);
const sky = createSky();
scene.add(sky);
const hud = new HUD();
const radar = new Radar($('radar'));
const input = new Input(canvas);
input.bindTouchUI($('touch'));
let game = null;

let state = 'boot'; // boot | menu | playing | paused | over
let overAt = 0;
let menuTime = 0;
const perf = { acc: 0, n: 0, scale: 1, cool: 3, ceiling: 9, ceilT: 0, fpsEl: null, fps: 60 };

// ---------------- resolution ----------------
function scaleBounds() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (settings.quality === 'high') return [Math.min(dpr, 1.5), Math.min(dpr, 1.5)];
  if (settings.quality === 'low') return [0.55, 0.55];
  return [0.5, Math.min(dpr, 1.25)];
}
function applyQuality() {
  const [lo, hi] = scaleBounds();
  perf.scale = Math.min(hi, Math.max(lo, settings.quality === 'auto' ? Math.min(1, hi) : hi));
  resize();
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  post.setSize(w, h, perf.scale);
  radar.resize();
}
window.addEventListener('resize', resize);

function pixScale() {
  return post.h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
}

function perfTick(dt) {
  perf.acc += dt;
  perf.n++;
  perf.cool -= dt;
  perf.ceilT -= dt;
  if (perf.ceilT <= 0) perf.ceiling = 9;
  if (perf.acc < 1) return;
  const avg = perf.acc / perf.n;
  perf.fps = 1 / avg;
  perf.acc = 0;
  perf.n = 0;
  if (settings.quality === 'auto' && (state === 'playing' || state === 'menu')) {
    const [lo, hi] = scaleBounds();
    if (avg > 1 / 50 && perf.scale > lo + 0.001) {
      perf.ceiling = perf.scale - 0.05;
      perf.ceilT = 30;
      perf.scale = Math.max(lo, perf.scale - 0.12);
      perf.cool = 4;
      resize();
    } else if (avg < 1 / 57 && perf.scale < Math.min(hi, perf.ceiling) - 0.001 && perf.cool <= 0) {
      perf.scale = Math.min(hi, perf.ceiling, perf.scale + 0.06);
      perf.cool = 5;
      resize();
    }
  }
  if (perf.fpsEl) perf.fpsEl.textContent = `${perf.fps.toFixed(0)} fps · ${post.w}×${post.h} · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris`;
}

// ---------------- menus ----------------
const menus = new Menus({
  onPlay: () => startRun(),
  onResume: () => resume(),
  onRestart: () => startRun(),
  onMenu: () => toMenu(),
  onMicToggle: () => toggleMic(),
  onSettingsChanged: (key) => {
    if (key === 'volume') audio.setVolume(settings.volume);
    if (key === 'voiceEcho') mic.setEcho(settings.voiceEcho);
    if (key === 'micEnabled') {
      if (!settings.micEnabled && mic.state === 'on') mic.stop();
      if (settings.micEnabled && mic.state !== 'on') {
        audio.init();
        mic.start(audio).then(updateMicUI);
      }
      updateMicUI();
    }
    if (key === 'quality') applyQuality();
    if (key === 'radar') applyRadar();
    if (key === 'lang' || key === undefined) {
      hud.cache = {};
      updateMicUI();
      $('lockHint').textContent = input.lockFailed ? t('dragToLook') : t('clickToLook');
    }
  },
  uiSound: (k) => {
    if (!audio.ready) return;
    if (k === 'hover') audio.uiHover();
    else audio.uiClick();
  },
});

function updateMicUI() {
  menus.setMicStatus(mic.state, Mic.inIframe());
  hud.setMic(mic.state);
  $('sMic').checked = settings.micEnabled;
}

async function toggleMic() {
  audio.init();
  if (mic.state === 'on') {
    mic.stop();
    settings.micEnabled = false;
  } else {
    settings.micEnabled = true;
    updateMicUI();
    await mic.start(audio);
  }
  saveSettings();
  updateMicUI();
  if (state === 'playing') hud.popup(mic.state === 'on' ? t('micOn') : t('micOff'), 'dim');
}

function applyRadar() {
  document.body.classList.toggle('radar-on', !!settings.radar);
  radar.resize();
}

$('pauseBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  if (state === 'playing') pause();
});
// first interaction anywhere unlocks audio (browser autoplay policy)
window.addEventListener('pointerdown', () => audio.init(), { capture: true });
window.addEventListener('keydown', () => audio.init(), { capture: true });

// ---------------- attract mode (menu background) ----------------
const attract = { rig: null, yaw: 0.6, nextPing: 0.4, nextGlint: 2.2 };
function setupAttract() {
  const rig = buildListener();
  const a = 2.35, d = 21;
  const x = world.spawn.x + Math.cos(a) * d, z = world.spawn.z + Math.sin(a) * d;
  rig.root.position.set(x, world.terrain.height(x, z), z);
  rig.root.rotation.y = Math.atan2(world.spawn.x - x, world.spawn.z - z);
  rig.nodes.spine.rotation.x = 0.35;
  rig.nodes.neck.rotation.x = -0.3;
  rig.nodes.head.rotation.z = 0.35;
  rig.nodes.shoulderL.rotation.x = -0.2;
  rig.nodes.shoulderR.rotation.x = 0.1;
  rig.nodes.jaw.rotation.x = 0.25;
  attract.rig = rig;
}

function attractPulse(loud, white = true) {
  const p = camera.position;
  pulses.emit(p.x, p.y - 0.3, p.z, menuTime, {
    radius: CFG.revealRadius(loud), strength: 0.85 + loud * 0.5, decay: 0.42, color: white ? [0.84, 0.92, 1.0] : [1, 0.2, 0.15], kind: 'player',
  });
  attract.lastPing = menuTime;
}

// between the pings, the thing in the trees looks at you
function attractGlint() {
  const rig = attract.rig;
  rig.root.updateMatrixWorld(true);
  const h = rig.nodes.head;
  const v = h.getWorldPosition(new THREE.Vector3());
  const yaw = rig.root.rotation.y;
  eyes.add(v.x + Math.sin(yaw) * 0.09, v.y + 0.06, v.z + Math.cos(yaw) * 0.09, yaw, { time: menuTime, life: 0.75, intensity: 0.85, blink: Math.random() < 0.5, spacing: 0.26, size: 0.16 });
}

function updateAttract(dt) {
  menuTime += dt;
  shared.uTime.value = menuTime;
  attract.yaw += dt * 0.06;
  const sx = world.spawn.x, sz = world.spawn.z;
  camera.position.set(sx, world.terrain.height(sx, sz) + 1.7, sz);
  camera.rotation.set(0.03 + Math.sin(menuTime * 0.21) * 0.03, attract.yaw, Math.sin(menuTime * 0.13) * 0.01, 'YXZ');
  shared.uCam.value.copy(camera.position);
  if (state === 'menu' && menuTime > attract.nextPing) {
    attractPulse(0.5 + Math.random() * 0.35);
    attract.nextPing = menuTime + 3.2 + Math.random() * 2.2;
  }
  if (state === 'menu' && menuTime > attract.nextGlint) {
    if (menuTime - (attract.lastPing ?? -9) > 2.2 && attract.nextPing - menuTime > 0.9) attractGlint();
    attract.nextGlint = menuTime + 2.5 + Math.random() * 4;
  }
  // talk to the menu: your voice lights the forest
  if (mic.state === 'on') {
    const ev = mic.update(dt, audio.outputDb());
    if (ev.pulse > 0 && state === 'menu') {
      attractPulse(Math.max(0.35, ev.pulse));
      attract.nextPing = menuTime + 3;
    }
    const trigPos = mic.screamDb > mic.floor ? (mic.trig - mic.floor) / (mic.screamDb - mic.floor) : 0.3;
    menus.micTest(mic.meter, Math.min(0.9, Math.max(0.05, trigPos)));
  }
  pulses.update(menuTime);
  for (const s of pulses.fronts()) {
    const r = attract.rig.root.position;
    const d = Math.hypot(r.x - s.x, r.y + 1.4 - s.y, r.z - s.z);
    if (d > s.prevR && d <= s.curR) ghosts.spawn(attract.rig, menuTime, { strength: 1.0, life: 2.6, decay: 1.0, color: 0xff2a20 });
  }
  ghosts.update(menuTime);
  eyes.update(menuTime, pixScale());
  particles.update(dt, pixScale());
  const u = post.u;
  u.uAberr.value = 0.2;
  u.uGlitch.value = Math.max(0, u.uGlitch.value - dt * 2);
  u.uRed.value = 0;
  u.uWhite.value = 0;
  u.uDanger.value = 0;
  u.uGrain.value = 0.06;
  u.uShockAmp.value = 0;
  u.uFade.value = Math.min(1, u.uFade.value + dt * 0.8);
  u.uWarm.value = 0;
  u.uFlicker.value = 0;
  u.uAsh.value = 0.62;
  shared.uDawn.value = 0;
  shared.uFear.value = 0;
}

// ---------------- state transitions ----------------
function setBodyState() {
  document.body.classList.toggle('playing', state === 'playing');
  input.gameActive = state === 'playing';
}

function startRun() {
  if (!game) return;
  if (state === 'over' && performance.now() - overAt < 450) return;
  audio.init();
  audio.setVolume(settings.volume);
  menus.only(null);
  menus.show('settingsPanel', false);
  menus.show('howPanel', false);
  menus.show('scoresPanel', false);
  hud.show(true);
  hud.cache = {};
  input.reset();
  game.reset();
  if (DEBUG.t > 0) {
    game.time = DEBUG.t;
    game.firstPingT = Math.max(0, DEBUG.t - 30);
    game.tut.done = true;
  }
  state = 'playing';
  setBodyState();
  post.u.uFade.value = 1;
  if (!input.touch) input.requestLock();
  audio.startAmbience();
  audio.resetFx(); // never start a run muffled, silent, or with the last death still ringing
  audio.setAmbience(0.9, 0);
  audio.setPaused(false);
  if (settings.micEnabled && !DEBUG.nomic && (mic.state === 'off')) {
    mic.start(audio).then(updateMicUI);
    updateMicUI();
  }
  lastFrame = performance.now();
}

function pause() {
  if (state !== 'playing' || !game || game.state !== 'play') return;
  state = 'paused';
  setBodyState();
  audio.setPaused(true);
  input.exitLock();
  $('pauseStats').innerHTML = `${fmtTime(game.time)} · ${t('dawnIn')} ${fmtTime(CFG.RUN_SECONDS - game.time)}<br>${t('score')} ${fmtScore(game.score)} ×${game.mult.toFixed(1)}`;
  menus.only('pause');
}

function resume() {
  if (state !== 'paused') return;
  menus.show('settingsPanel', false);
  menus.only(null);
  state = 'playing';
  setBodyState();
  audio.setPaused(false);
  if (!input.touch) input.requestLock();
  lastFrame = performance.now();
}

function toMenu() {
  if (game) {
    for (const m of game.monsters) m.dispose();
    game.monsters = [];
    game.state = 'idle';
  }
  pulses.clear();
  ghosts.clear();
  eyes.clear();
  particles.clear();
  input.exitLock();
  audio.setPaused(false);
  audio.resetFx();
  audio.setAmbience(0, 0);
  hud.show(false);
  hud.setIntro(null);
  hud.setHint(null);
  state = 'menu';
  setBodyState();
  menus.only('menu');
  menus.renderScores();
  updateMicUI();
  post.u.uFade.value = 0;
}

function onEnd(res) {
  const stats = {
    ...game.stats,
    time: Math.min(game.time, CFG.RUN_SECONDS),
    score: game.score,
    loudestDb: -100,
  };
  const { rank, list } = submitScore({ name: settings.name || '???', score: game.score, time: stats.time, won: res.won, shards: stats.shards });
  menus.showOver(res, stats, rank, list);
  menus.renderScores();
  state = 'over';
  overAt = performance.now();
  setBodyState();
  input.exitLock();
  hud.show(false);
  menus.only('over');
}

// ---------------- global input ----------------
function handleEvents(events) {
  for (const e of events) {
    switch (e) {
      case 'pause':
        if (menus.isOpen('settingsPanel')) menus.closeSettings();
        else if (menus.isOpen('howPanel')) menus.show('howPanel', false);
        else if (menus.isOpen('scoresPanel')) menus.show('scoresPanel', false);
        else if (state === 'playing') pause();
        else if (state === 'paused') resume();
        break;
      case 'unlock':
      case 'blur':
        if (state === 'playing' && !input.touch) pause();
        break;
      case 'restart':
        if (state === 'over' || state === 'paused') startRun();
        break;
      case 'confirm':
        if (menus.isOpen('settingsPanel') || menus.isOpen('howPanel') || menus.isOpen('scoresPanel')) break;
        if (state === 'over' || state === 'menu') startRun();
        else if (state === 'paused') resume();
        break;
      case 'mic':
        toggleMic();
        break;
      case 'peek':
        if (state === 'playing') hud.peek(3.5);
        break;
    }
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pause();
});

// ---------------- main loop ----------------
let lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let rawDt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (!(rawDt > 0)) rawDt = 1 / 60;
  if (rawDt > 0.1) rawDt = 0.1;
  perfTick(rawDt);

  const look = input.poll();
  const events = input.consume();
  if (state === 'boot') return;
  handleEvents(events);

  if (state === 'menu') {
    updateAttract(rawDt);
  } else if (state === 'playing') {
    const dt = Math.min(rawDt, 0.05) * game.fx.timeScale * DEBUG.speed;
    game.update(dt, { look, events });
    if (state === 'playing') {
      shared.uTime.value = game.time;
      ghosts.update(game.time);
      eyes.update(game.time, pixScale());
      particles.update(dt, pixScale());
      game.applyView(camera, now / 1000);
      shared.uCam.value.copy(camera.position);
      game.hudUpdate(rawDt);
      // pointer-lock hint (or drag-to-look hint when the browser/iframe refuses pointer lock)
      let lockMsg = '';
      if (!input.touch && game.state === 'play' && !input.locked) {
        if (!input.lockFailed) lockMsg = t('clickToLook');
        else {
          if (!perf.dragHintAt) perf.dragHintAt = now;
          if (now - perf.dragHintAt < 7000) lockMsg = t('dragToLook');
        }
      }
      const lh = $('lockHint');
      if (lh.textContent !== lockMsg && lockMsg) lh.textContent = lockMsg;
      document.body.classList.toggle('needlock', !!lockMsg);
      document.body.classList.toggle('crouching', input.crouch);
    }
  } else if (state === 'over' && game && game.state === 'won') {
    // daylight: look around the forest that was hunting you
    game.player.yaw += rawDt * 0.05;
    game.time += rawDt;
    shared.uTime.value = game.time;
    ghosts.update(game.time);
    eyes.update(game.time, pixScale());
    particles.update(rawDt, pixScale());
    game.applyView(camera, now / 1000);
    shared.uCam.value.copy(camera.position);
  }
  if (state !== 'playing') document.body.classList.remove('needlock');

  sky.position.copy(camera.position);
  motes.material.uniforms.uPix.value = 9 * (post.h / 900);
  post.u.uTime.value = now / 1000;
  renderer.info.reset();
  post.render(scene, camera);
}

// ---------------- boot ----------------
function boot() {
  applyQuality();
  applyRadar();
  requestAnimationFrame(frame);
  // let the boot screen paint before the heavy generation
  setTimeout(() => {
    try {
      world.generate();
    } catch (e) {
      $('bootText').textContent = 'world generation failed: ' + e.message;
      throw e;
    }
    game = new Game({ scene, camera, world, pulses, ghosts, eyes, particles, audio, mic, input, hud, radar, post });
    game.onEnd = onEnd;
    setupAttract();
    // warm up shaders so the first ping doesn't hitch
    renderer.compile(scene, camera);
    if (DEBUG.fps) {
      perf.fpsEl = document.createElement('div');
      perf.fpsEl.style.cssText = 'position:fixed;right:8px;top:64px;z-index:99;font:11px JetBrains Mono,monospace;color:#8ef0ff;opacity:.8;pointer-events:none';
      document.body.appendChild(perf.fpsEl);
    }
    window.__hush = { world, game, pulses, ghosts, eyes, renderer, perf, mic, audio, input, hud, post, debug: DEBUG, startRun, pause, toMenu, get state() { return state; } };
    state = 'menu';
    menuTime = 0;
    post.u.uFade.value = 0;
    menus.only('menu');
    updateMicUI();
    if (DEBUG.autostart) startRun();
    if (params.has('sfx')) import('./ui/sfxtest.js').then((m) => m.mountSfxPanel(audio));
  }, 60);
}
boot();
