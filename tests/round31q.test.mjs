// 3.1q: «сделай заставку перед главным меню: главный маскот-монстр Лось стоит вдалеке один в темноте, потом под
// мелодию резко приближается и ещё раз, поворачивает голову, потом ещё резко приближается — и скример». The piano is
// the owner's «Detuned Piano». Run here on the real forest, with spies for the echo, the ghosts and the eyes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import * as THREE from 'three';

const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '',
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, remove() {}, addEventListener() {}, querySelector: () => stubEl(),
});
globalThis.document = globalThis.document || { body: stubEl(), documentElement: stubEl(), createElement: () => stubEl(), baseURI: 'http://localhost/' };
globalThis.window = globalThis.window || { location: { search: '' } };
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { World } = await import('../src/world/world.js');
const { Splash, SPLASH, SPLASH_SRC, chooseSplashSpot } = await import('../src/ui/splash.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let _w = null;
const forest = () => (_w ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate());

function rigOf(splash) { return splash.rig.root.position.clone(); }
function mk({ audio = null } = {}) {
  const log = { ghosts: [], pulses: [], eyes: 0, scream: 0, refreshed: 0 };
  const handle = () => ({ strength: 0 });
  const deps = {
    world: forest(),
    camera: new THREE.PerspectiveCamera(58, 1.6, 0.05, 400),
    pulses: { emit: (x, y, z, time, o) => log.pulses.push({ time, ...o }), update() {}, clear() {} },
    ghosts: {
      spawn: (model, time, o) => { log.ghosts.push({ time, sticky: !!o.sticky, at: model.root.position.clone(), head: model.nodes.head.rotation.clone() }); return handle(); },
      refresh: () => { log.refreshed++; }, release() {}, update() {}, clear() {},
    },
    eyes: { add: () => { log.eyes++; }, update() {}, clear() {} },
    audio: { init() {}, jumpscare: () => { log.scream++; } },
    post: { u: new Proxy({}, { get: (o, k) => (o[k] ||= { value: 0 }) }) },
    shared: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uDawn: { value: 0 }, uFear: { value: 0 } },
    pixScale: () => 1,
    makeAudio: audio || (() => null),
  };
  const s = new Splash(deps);
  return { s, log, deps };
}
const run = (s, until) => { while (s.state === 'run' && s.t < until) s.update(1 / 60); };

test('it stands in the trees, away from the camp, on an open line: four stands, nearer and nearer, all in sight', () => {
  const w = forest();
  const t0 = performance.now();
  const spot = chooseSplashSpot(w);
  assert.ok(performance.now() - t0 < 400, 'cheap enough for the boot');
  assert.ok(Math.hypot(spot.x - w.spawn.x, spot.z - w.spawn.z) > 45, 'not in the camp (its lit tents spoil the dark)');
  const d = spot.at.map((p) => Math.hypot(p.x - spot.x, p.z - spot.z));
  assert.deepEqual(d.map((v) => Math.round(v * 10) / 10), SPLASH.stand, 'the four stands, far to near');
  for (const p of spot.at) {
    assert.ok(w.col.free(p.x, p.z, 0.8), 'no trunk where it stands');
    assert.ok(!w.losBlocked(spot.x, spot.eye, spot.z, p.x, p.y + 2.3, p.z, 0.3), 'in sight');
  }
  // you look at it
  const fwd = { x: -Math.sin(spot.yaw), z: -Math.cos(spot.yaw) }, p0 = spot.at[0];
  assert.ok((fwd.x * (p0.x - spot.x) + fwd.z * (p0.z - spot.z)) / d[0] > 0.99);
});

test('the score: far and still, nearer on the cut-off swell, nearer on the loudest chord, the head turns, nearer — the scream', () => {
  const { s, log } = mk();
  let done = 0;
  s.begin(() => done++);
  assert.equal(s.state, 'run', 'without a piano element it runs on its own clock');
  const at = (k) => s.spot.at[k];
  const near = (v, p) => Math.hypot(v.x - p.x, v.z - p.z) < 0.01;
  run(s, 0.4);
  assert.ok(log.ghosts.some((g) => near(g.at, at(0))), 'the first chord shows it, far off');
  run(s, 4.3);
  assert.ok(near(rigOf(s), at(0)), '...and it has not moved');
  run(s, 4.45);
  assert.ok(near(rigOf(s), at(1)) && log.ghosts.some((g) => near(g.at, at(1)) && g.time >= 4.3), 'nearer — on the cut-off');
  run(s, 7.5);
  assert.ok(near(rigOf(s), at(2)), 'nearer again — on the loudest chord');
  const turnStart = log.refreshed;
  run(s, 9.2);
  assert.ok(log.refreshed - turnStart > 40, 'the head turns, and it is drawn as it turns');
  const sticky = log.ghosts.filter((g) => g.sticky);
  assert.ok(sticky.length >= 1);
  assert.ok(Math.abs(s.rig.nodes.head.rotation.z) > 0.6, `the head is round (${s.rig.nodes.head.rotation.z.toFixed(2)})`);
  run(s, 9.4);
  assert.ok(near(rigOf(s), at(3)), 'and right here');
  run(s, 13.25);
  assert.equal(log.scream, 0, 'a breath of silence first');
  run(s, 13.4);
  assert.equal(log.scream, 1, 'the scream');
  const cam = s.d.camera.position, head = s.rig.nodes.head.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.hypot(head.x - cam.x, head.z - cam.z) < 3.2, 'in your face');
  run(s, 20);
  assert.equal(done, 1, 'then the menu, once');
  assert.equal(s.state, 'done');
  // every jump and ping was an echo sent so it reaches it on its beat
  assert.ok(log.pulses.length >= 6 && log.pulses.every((p) => p.speed === SPLASH.wave));
  assert.ok(log.eyes >= 3, 'eyes in the dark between');
});

test('the cues sit on the track: inside it, the scream after the last note', () => {
  const dur = 14.37;
  for (const c of SPLASH.cues) assert.ok(c.at > 0 && c.at < 13, `${c.act} at ${c.at}`);
  assert.deepEqual(SPLASH.cues.filter((c) => c.act === 'jump').map((c) => c.to), [1, 2, 3], 'three jumps, in order');
  assert.ok(SPLASH.turn[0] > 7.45 && SPLASH.turn[1] < 9.3, 'the turn between the second jump and the third');
  assert.ok(SPLASH.scream >= 13.0 && SPLASH.scream + SPLASH.screamFor <= SPLASH.end && SPLASH.end <= dur + 0.05);
  const size = statSync(new URL('../public/' + SPLASH_SRC, import.meta.url)).size;
  assert.ok(size > 150e3 && size < 400e3, `the piano: ${size} bytes`);
});

test('a key skips it; a browser that holds the piano back gets «press any key» in the dark, and the key starts it', () => {
  const { s, log } = mk();
  let done = 0;
  s.begin(() => done++);
  s.update(0.3);
  assert.equal(s.input(), true);
  assert.equal(done, 1, 'skipped straight to the menu');
  assert.equal(log.scream, 0, 'no scream for those who skip');
  // the browser's no
  let allow = false;
  const el = { volume: 0, paused: true, currentTime: 0, play() { return allow ? Promise.resolve() : Promise.reject(new Error('NotAllowed')); }, pause() {} };
  const g = mk({ audio: () => el });
  let done2 = 0;
  g.s.begin(() => done2++);
  return Promise.resolve().then(() => new Promise((r) => setTimeout(r, 0))).then(() => {
    assert.equal(g.s.state, 'gate', 'it waits in the dark');
    allow = true;
    assert.equal(g.s.input(), true, 'the first key is the gesture');
    return new Promise((r) => setTimeout(r, 0));
  }).then(() => {
    assert.equal(g.s.state, 'run', '...and the piano starts');
    assert.equal(done2, 0);
    setLang('ru');
    for (const lang of ['ru', 'en']) { setLang(lang); for (const k of ['splashGate', 'splashSkip']) assert.notEqual(t(k), k); }
    setLang('ru');
  });
});

test('main: once a launch, before the menu; never for an invite, a debug start or a test-driven browser', () => {
  const m = src('src/main.js');
  assert.match(m, /if \(wantSplash\(\)\) \{[\s\S]*?state = 'splash';[\s\S]*?splash\.begin\(enterMenu\);[\s\S]*?\} else enterMenu\(\);/);
  assert.match(m, /sessionStorage\.setItem\('hush\.splash', '1'\)/);
  assert.match(m, /DEBUG\.nosplash \|\| DEBUG\.range \|\| DEBUG\.autostart/);
  assert.match(m, /navigator\.webdriver/);
  assert.match(m, /\} else if \(state === 'splash'\) \{\s+splash\.update\(rawDt\);/);
  assert.match(m, /if \(state !== 'splash'\) handleEvents\(events\);/);
});
