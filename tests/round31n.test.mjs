// 3.1n: «сделай в начале фильм длиннее — едем на уазике по шоссе вайбово под музыку с эффектом радио, каждый
// что-то делает, приезжаем в лесхоз, оставляем машину, потом гасим лагерь». The forest's opening is now two films:
// the road (roadFilm.js — the highway at sunset, the radio playing CUPSIZE «вайфуу» through a car speaker, a job
// per seat, the turn into the cut, round the yard onto the spot where the game's УАЗ stands) and then the camp's
// last evening (campFilm.js, 3.1h). Run on the real Game below, frame by frame.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import * as THREE from 'three';

const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '', width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
});
globalThis.document = globalThis.document || {
  documentElement: stubEl(), body: stubEl(), head: stubEl(), getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [],
  createElement: () => stubEl(), createElementNS: () => stubEl(), addEventListener() {}, removeEventListener() {},
};
globalThis.window = globalThis.window || {
  addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { search: '', href: 'http://localhost/' },
};
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { CFG } = await import('../src/core/config.js');
const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');
const { ForestOpening, CampFilm, RoadFilm } = await import('../src/game/intro.js');
const { arrivalPath, beatPulse, BEAT, BEAT0, ROLES, TF, TUNE_AT } = await import('../src/game/roadFilm.js');
const { t, setLang } = await import('../src/core/i18n.js');
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
function mkGame() {
  const scene = new THREE.Scene();
  const world = new World(scene, new THREE.MeshBasicMaterial(), 'forest').generate();
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.05, 400);
  return new Game({
    scene, camera, world,
    pulses: { emit() {}, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0 }; }, release() {} }, eyes: { add() {}, clear() {} }, particles: { burst() {}, clear() {} },
    audio: anyFn, input: anyFn, hud: anyFn, radar: anyFn, post: anyFn, shadows: anyFn,
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
}
const step = (g, events = []) => g.update(1 / 60, { events, move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const Y = CFG.YARD;

// the yard's junk, its lamp pole and the booth (yard-local, from world/yard.js): the car keeps clear of all of it
const JUNK = [[-2.6, -0.9], [12.6, 9.1], [-13.4, 8.6], [13.3, -9.3], [12.4, -9.9], [13.5, -7.9], [-9.6, 9.8], [9.2, 10.2], [-4.4, 10.4], [4.4, 10.4], [14.9, 1.5], [15.5, 4.5], [-12.3, -8.5]];

test('the forest opens on the road, then the camp; the road drives the whole way in and parks on the УАЗ\'s spot', () => {
  const g = mkGame();
  g.setupSolo(); g.reset({ days: 4 });
  const o = g.opening;
  assert.ok(o instanceof ForestOpening);
  o.forceSeats = 4;
  o.begin();
  const road = o.road;
  assert.ok(road instanceof RoadFilm);
  let prev = null, maxV = 0, nearJunk = Infinity, shots = new Set();
  while (o.part === road && road.t < 200) {
    step(g);
    const c = road.pose;
    assert.ok([c.x, c.y, c.z, c.yaw].every(Number.isFinite), `finite at ${road.t}`);
    shots.add(road.shotAt(road.t).k);
    if (road.t > TF + 0.05 && prev) maxV = Math.max(maxV, Math.hypot(c.x - prev.x, c.z - prev.z) * 60);
    if (Math.abs(c.x - Y.x) < Y.w / 2 && Math.abs(c.z - Y.z) < Y.d / 2) {
      for (const [lx, lz] of JUNK) nearJunk = Math.min(nearJunk, Math.hypot(c.x - (Y.x + lx), c.z - (Y.z + lz)));
    }
    prev = { x: c.x, z: c.z };
    for (const a of road.cast) assert.ok(Number.isFinite(a.rig.root.position.x + a.rig.root.position.y + a.rig.root.position.z));
    if (road.state === 'run' && road.t > road.tStop - 0.02 && road.t < road.tStop + 0.3) {
      assert.ok(Math.abs(c.x - (Y.x + 2)) < 0.15 && Math.abs(c.z - (Y.z + 3)) < 0.15, `parks at the УАЗ's spot: ${c.x}, ${c.z}`);
      assert.ok(Math.abs(c.yaw - Math.PI / 2) < 0.06, `nose to the back gate: ${c.yaw}`);
    }
  }
  assert.deepEqual([...shots], ['wide', 'radio', 'side', 'rear', 'pass', 'drone', 'turn', 'cut', 'yard', 'out']);
  assert.ok(maxV < 15, `no jumps on the way in: ${maxV.toFixed(1)} m/s`);
  assert.ok(nearJunk > 1.6, `round the yard clear of its junk: ${nearJunk.toFixed(2)} m`);
  assert.ok(road.dur > 60 && road.dur < 85, `a long film, but not endless: ${road.dur.toFixed(1)} s`);
  assert.ok(o.part === o.camp && o.camp.state === 'run', 'the camp film takes over');
  assert.equal(o.camp.afterRoad, true, 'without its own title');
  assert.equal(g.escape.car.visible, true, 'the game\'s УАЗ is back on its spot');
  assert.ok(g.escape.backLeaves.every((L) => L.ang === 0), 'the back gate shut behind them');
  assert.equal(road.cast.length, 0, 'the road\'s cast is gone');
});

test('Enter on the road skips the whole opening: the night begins within a second', () => {
  const g = mkGame();
  g.setupSolo(); g.reset({ days: 4 });
  for (let i = 0; i < 120; i++) step(g);
  step(g, ['confirm']);
  let n = 0;
  while (g.state === 'intro' && n++ < 120) step(g);
  assert.equal(g.state, 'play');
  assert.ok(n < 70, `${n} frames`);
  assert.equal(g.escape.car.visible, true);
});

test('a job per seat, the radio tuned at its time, nods on the song\'s beat', () => {
  assert.deepEqual(ROLES, ['drive', 'radio', 'sleep', 'map']);
  assert.ok(Math.abs(beatPulse(BEAT0) - 1) < 1e-9, 'a nod on the downbeat');
  assert.ok(beatPulse(BEAT0 + BEAT * 0.5) < 0.1, 'and down between');
  assert.equal(beatPulse(-1), 0, 'no song, no nod');
  const film = src('src/game/roadFilm.js');
  assert.match(film, /hit\('radioOn', TUNE_AT - 0\.3, \(\) => \{\s+this\.radio = au\.carRadio\?\.\(\) \|\| null;/);
  assert.match(film, /hit\('off', this\.tOff,/, 'the ignition cuts the song');
  assert.match(film, /const seat = players\.length === 1 \? 0 : p\.slot % 4;/, 'alone you are the driver (and tune it yourself)');
  assert.ok(TUNE_AT > 7 && TUNE_AT < 13.5, 'in the radio shot');
});

test('the radio: the record through a car speaker, the file small enough for the .pak', () => {
  const audio = src('src/audio/audio.js');
  assert.match(audio, /carRadio\(src = 'audio\/road-radio\.mp3'\)/);
  assert.match(audio, /ctx\.createMediaElementSource\(el\)/, 'streamed, not decoded into 20 MB');
  assert.match(audio, /this\._filter\('highpass', 260/);
  assert.match(audio, /this\._filter\('lowpass', 3400/);
  const size = statSync(new URL('../public/audio/road-radio.mp3', import.meta.url)).size;
  assert.ok(size > 500e3 && size < 1.3e6, `${size} bytes`);
  setLang('ru');
  for (const lang of ['ru', 'en']) { setLang(lang); assert.notEqual(t('introSmallRoad'), 'introSmallRoad'); }
  setLang('ru');
  assert.match(src('src/game/campFilm.js'), /if \(this\.afterRoad\) return;/);
  assert.ok(arrivalPath().length > 10);
});
