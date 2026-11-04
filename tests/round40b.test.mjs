// 4.0 ULTRA (2/3) — the body and the eyes: «прыжки и вес, анимации — проверь в мультиплеере»; «игроков видно
// вблизи»; «пробел — эхолокатор с перезарядкой 30 с»; «утром лучи солнца и длинные тени». The jump and the weight
// are run through the real Player; the echolocator through a real Game; a friend's gait and its blending through
// the real rig; the morning's sun and its shadow map on a renderer that only counts what it is asked to draw.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '', width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'getImageData' ? () => ({ data: new Uint8Array(4) }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
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
const { ACTIONS, DEFAULT_KEYS, cleanKeys, keysToSave } = await import('../src/core/keybinds.js');
const { World } = await import('../src/world/world.js');
const { Player, spring } = await import('../src/game/player.js');
const { Game } = await import('../src/game/game.js');
const { PF } = await import('../src/game/remote.js');
const { buildSurvivor, animateSurvivor, settleRig } = await import('../src/game/survivor.js');
const { SunShadow } = await import('../src/render/shadows.js');
const { Post } = await import('../src/render/post.js');
const { shared } = await import('../src/render/sonar.js');
const { createPersonMaterial } = await import('../src/render/people.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let _w = null;
const forest = () => (_w ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate());

// ---------------------------------------------------------------- the keys
test('V jumps, SPACE is the echolocator — and a key a player chose before 4.0 stays theirs', () => {
  assert.ok(ACTIONS.includes('jump'));
  assert.equal(DEFAULT_KEYS.jump, 'KeyV');
  assert.equal(DEFAULT_KEYS.ping, 'Space');
  assert.deepEqual(cleanKeys({}), DEFAULT_KEYS);
  // somebody had «use» on V: they keep it, and the jump waits unbound until they give it a key
  const m = cleanKeys({ use: 'KeyV' });
  assert.equal(m.use, 'KeyV');
  assert.equal(m.jump, null);
  assert.deepEqual(keysToSave(m), { use: 'KeyV' });
  // ...and the jump, once bound, is theirs too
  assert.equal(cleanKeys({ use: 'KeyV', jump: 'KeyJ' }).jump, 'KeyJ');
  // the touch screen has its own button
  assert.match(src('src/input/input.js'), /btn\('#tJump', \(\) => \{ this\.jumpAt = performance\.now\(\);/);
  assert.match(src('index.html'), /id="tJump"/);
});

// ---------------------------------------------------------------- the jump
function body() {
  const p = new Player(forest());
  p.reset(0);
  p.x = 30; // open ground off the camp
  p.z = 40;
  p.yaw = 4.7;
  const input = { move: { x: 0, y: 0 }, sprint: false, crouch: false, turn: 0, jumpAt: 0 };
  const run = (s, hz = 120, each) => {
    const out = [];
    for (let i = 0; i < Math.round(s * hz); i++) {
      const ev = p.update(1 / hz, input, { dx: 0, dy: 0 });
      out.push(ev);
      each?.(ev, i / hz);
    }
    return out;
  };
  run(1); // settle onto the ground
  let n = 0;
  const press = () => (input.jumpAt = performance.now() + 1e6 + ++n);
  return { p, input, run, press };
}

test('a jump: ~0.75 m at the top, a fall heavier than the rise, a landing you feel', () => {
  const { p, run, press } = body();
  assert.equal(p.grounded, true);
  const y0 = p.y, st0 = p.stamina;
  press();
  let top = 0, upT = -1, landT = -1, jump = null, land = null, st1 = 0;
  run(1.2, 120, (ev, t) => {
    if (ev.jump) { jump = ev.jump; st1 = p.stamina; }
    if (ev.land && !land) { land = ev.land; landT = t; }
    if (p.y - y0 > top) { top = p.y - y0; upT = t; }
  });
  assert.ok(jump && jump.wet === false, 'the push off is an event');
  const P = CFG.PLAYER;
  assert.ok(Math.abs(P.jumpV ** 2 / (2 * P.gravity) - 0.75) < 0.01, 'the config says 0.75 m');
  assert.ok(top > 0.68 && top < 0.78, `the top: ${top.toFixed(3)} m`);
  assert.ok(P.gravityFall > P.gravity);
  assert.ok(landT - upT < upT, `the fall (${(landT - upT).toFixed(2)} s) is quicker than the rise (${upT.toFixed(2)} s)`);
  assert.ok(land && land.impact > 4.5 && land.impact < 6.5, `came down at ${land?.impact.toFixed(2)} m/s`);
  assert.ok(land.k > 0.5 && land.k <= 1);
  assert.ok(Math.abs(st0 - st1 - P.jumpCost) < 0.5, `it costs breath: ${(st0 - st1).toFixed(1)}`);
  assert.equal(p.grounded, true);
  assert.ok(Math.abs(p.y - y0) < 0.02);
});

test('no jump crouched, out of breath, or with an arm full; a press just before landing still counts', () => {
  {
    const { p, input, run, press } = body();
    input.crouch = true;
    run(0.5);
    press();
    assert.ok(!run(0.4).some((e) => e.jump), 'crouched');
  }
  {
    const { p, run, press } = body();
    p.stamina = CFG.PLAYER.jumpCost - 3;
    p.staminaDelay = 1; // (no breath back before the press is forgotten)
    press();
    assert.ok(!run(0.4).some((e) => e.jump), 'out of breath');
  }
  {
    const { p, input, press } = body();
    press();
    let jumped = false;
    for (let i = 0; i < 48; i++) if (p.update(1 / 120, input, { dx: 0, dy: 0 }, false, { walk: 1.6 }).jump) jumped = true;
    assert.equal(jumped, false, 'an engine part in your arms');
  }
  {
    // the buffer: pressed 0.1 s before the feet touch, it goes off the moment they do
    const { p, run, press } = body();
    press();
    run(0.47);
    assert.equal(p.grounded, false);
    press();
    const evs = run(0.6);
    assert.ok(evs.some((e) => e.land) && evs.some((e) => e.jump), 'a second jump off the landing');
  }
  {
    // ...but a press long before is forgotten
    const { p, run, press } = body();
    press();
    run(0.05);
    press();
    const evs = run(1.2);
    assert.equal(evs.filter((e) => e.jump).length, 0, '(the first one went at once, the second was too early)');
  }
});

test('weight: it takes a moment to get going and to stop, and in the air you only steer', () => {
  const { p, input, run, press } = body();
  input.move.y = 1;
  run(0.1);
  const v01 = Math.hypot(p.vx, p.vz);
  run(1);
  const vWalk = Math.hypot(p.vx, p.vz);
  // (a time constant of ~95 ms where 3.x had 62: a third short of walking pace a tenth of a second in)
  const P = CFG.PLAYER;
  assert.ok(Math.abs(v01 / vWalk - (1 - Math.exp(-P.accel * 0.1))) < 0.04, `0.1 s in: ${v01.toFixed(2)} of ${vWalk.toFixed(2)} m/s`);
  assert.ok(v01 / vWalk < 0.7);
  input.move.y = 0;
  run(0.1);
  assert.ok(Math.hypot(p.vx, p.vz) > 0.6, 'and it does not stop dead');
  run(1);
  // from standing, a jump with the key held all the way: the air gives you far less than the ground would
  press();
  input.move.y = 1;
  let inAir = 0;
  run(0.25, 120, () => { if (!p.grounded) inAir = Math.max(inAir, Math.hypot(p.vx, p.vz)); });
  const ground = vWalk * (1 - Math.exp(-P.accel * 0.25));
  assert.ok(inAir < 0.55 * ground, `a quarter-second up: ${inAir.toFixed(2)} m/s (the ground gives ${ground.toFixed(2)})`);
  run(1);
  // a walking jump, the key let go at the top: you carry on where you were going, and land still walking
  run(1);
  const vGo = Math.hypot(p.vx, p.vz);
  press();
  run(0.15);
  input.move.y = 0;
  let vLand = 0;
  run(0.6, 120, (ev) => { if (ev.land) vLand = Math.hypot(p.vx, p.vz); });
  assert.ok(vLand > 0.8 * vGo, `took off at ${vGo.toFixed(2)}, landed at ${vLand.toFixed(2)} m/s`);
  // the eyes: a damped spring (it settles, it does not ring for ever)
  const s = { x: 1, v: 0 };
  for (let i = 0; i < 120; i++) spring(s, 0, 120, 15, 1 / 60);
  assert.ok(Math.abs(s.x) < 1e-3 && Math.abs(s.v) < 1e-2);
});

// ---------------------------------------------------------------- the echolocator
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
function mkGame() {
  const scene = new THREE.Scene();
  const world = forest();
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.05, 400);
  const log = { emit: [], deny: 0, ready: 0, ping: 0 };
  const hud = new Proxy({}, { get: (o, k) => (k === 'cooldownDeny' ? () => log.deny++ : k === 'pingReady' ? () => log.ready++ : anyFn) });
  const audio = new Proxy({}, { get: (o, k) => (k === 'echoPing' ? () => log.ping++ : anyFn) });
  const game = new Game({
    scene, camera, world,
    pulses: { emit: (x, y, z, t, o) => (log.emit.push(o), { x, y, z, radius: o.radius, speed: o.speed || 30 }), emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0 }; }, release() {} },
    eyes: { add() {}, clear() {} },
    particles: { burst() {}, clear() {} },
    audio, input: { move: { x: 0, y: 0 }, consume: () => [], events: [], reset() {}, exitLock() {}, requestLock() {} }, hud, radar: anyFn, post: anyFn, shadows: anyFn,
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
  return { game, log };
}

test('SPACE: one wave 64 m wide, quiet as a tongue click — then the device is empty for 30 s', () => {
  const E = CFG.ECHO;
  assert.equal(E.cd, 30);
  assert.equal(E.radius, 64);
  assert.ok(CFG.hearRadius(E.noise) < 8, `a monster hears it within ${CFG.hearRadius(E.noise).toFixed(1)} m`);
  const { game: g, log } = mkGame();
  g.firstPingT = 1; // (not the night's first wave: that one is widened to 52 m whatever made it)
  g.stats = {};
  g.pingCD = 0;
  g.player.x = 30;
  g.player.z = 40;
  g.pingPress();
  assert.equal(log.ping, 1);
  assert.equal(log.emit.length, 1);
  assert.equal(log.emit[0].radius, E.radius, 'dry ground: the full 64 m');
  assert.equal(log.emit[0].strength, E.strength);
  assert.equal(g.pingCD, 30);
  // pressed again while it is empty: a flinch of the arc, no wave
  g.pingPress();
  assert.equal(log.emit.length, 1);
  assert.equal(log.deny, 1);
  for (let i = 0; i < 29; i++) g._echoClock(1);
  assert.ok(g.pingCD > 0.9 && log.ready === 0);
  g._echoClock(1);
  assert.equal(g.pingCD, 0);
  assert.equal(log.ready, 1, 'a tick when it is ready');
  g.pingPress();
  assert.equal(log.emit.length, 2);
  // the gnats in your eyes: it refills at half speed
  g.echoMul = 2;
  for (let i = 0; i < 30; i++) g._echoClock(1);
  assert.ok(Math.abs(g.pingCD - 15) < 1e-9);
  // a friend's echolocator (pu … 2) is drawn as theirs, 64 m wide; an old build's click is still a click
  assert.match(src('src/game/netsync.js'), /g\.remotePulse\(r, \+a, \+b, \+c, \+e, f === 2 \? 2 : f \? 1 : 0\)/);
  assert.match(src('src/game/game.js'), /device \? 2 : fromMic \? 1 : 0\);/);
});

// ---------------------------------------------------------------- a friend's body
test('a friend in the air tucks, lands with a fold, and no pose ever snaps (settleRig)', () => {
  const rig = buildSurvivor();
  const st = { phase: 0, speed: 0, fwd: 0, side: 0, crouch: false, sprint: false, air: false, vy: 0, land: 0, pitch: 0, turn: 0 };
  for (let i = 0; i < 60; i++) animateSurvivor(rig, st, 1 / 60);
  const kneeStand = rig.nodes.knL.rotation.x, hipStand = rig.nodes.hips.position.y;
  assert.ok(Math.abs(kneeStand) < 0.2);
  for (let i = 0; i < 30; i++) animateSurvivor(rig, { ...st, air: true, vy: 3 }, 1 / 60);
  assert.ok(rig.nodes.knL.rotation.x > kneeStand + 0.6, `tucked: ${rig.nodes.knL.rotation.x.toFixed(2)} rad`);
  let low = Infinity;
  animateSurvivor(rig, { ...st, land: 1 }, 1 / 60);
  for (let i = 0; i < 30; i++) {
    animateSurvivor(rig, st, 1 / 60);
    low = Math.min(low, rig.nodes.hips.position.y);
  }
  assert.ok(low < hipStand - 0.025, `the landing folds them: ${(hipStand - low).toFixed(3)} m`);
  // inertialization: a pose written in one go (a crouch, a seat) is reached over a few frames, not in one
  const r2 = buildSurvivor(), kn = r2.nodes.knL.rotation;
  kn.x = 0;
  settleRig(r2, 1 / 60);
  kn.x = 1.6;
  settleRig(r2, 1 / 60);
  assert.ok(kn.x < 0.1, `the frame after: ${kn.x.toFixed(2)} rad`);
  let prev = kn.x, jump = 0;
  for (let i = 0; i < 40; i++) {
    kn.x = 1.6;
    settleRig(r2, 1 / 60);
    jump = Math.max(jump, Math.abs(kn.x - prev));
    prev = kn.x;
  }
  assert.ok(Math.abs(kn.x - 1.6) < 0.02, 'and there by ~0.25 s');
  assert.ok(jump < 0.35, `never more than ${jump.toFixed(2)} rad in a frame`);
  // their feet off the ground travel in the state (PF.air), and the remote animates from it
  assert.equal(PF.air, 256);
  assert.ok(Object.values(PF).every((v, i, a) => a.indexOf(v) === i));
  assert.match(src('src/game/netsync.js'), /if \(p\.grounded === false\) f \|= PF\.air;/);
  assert.match(src('src/game/remote.js'), /settleRig\(this\.rig, dt\);/);
});

test('close by, a friend is simply there: fully at 3 m, gone by 9 m (people.js uNear)', () => {
  const m = createPersonMaterial(buildSurvivor().dyes, 0xff8800);
  assert.ok('uNear' in m.uniforms);
  assert.match(m.fragmentShader, /if \(uNear > 0\.001\)/);
  assert.match(src('src/game/game.js'), /r\.near = day \? 0 : 1 - smoothstep\(3, 9, nd\);/);
  assert.match(src('src/game/game.js'), /\(lit > 0\.03 \|\| r\.near > 0\.01\)/);
});

// ---------------------------------------------------------------- the morning
test('the morning sun comes up low (long shadows) and climbs a little by the dusk, on its old bearing', () => {
  const { game: g } = mkGame();
  const sun = shared.uSun.value;
  g._morningSun(0);
  const el0 = Math.asin(sun.y), az0 = Math.atan2(sun.x, sun.z);
  assert.ok(Math.abs(sun.length() - 1) < 1e-6);
  assert.ok(el0 > 0.15 && el0 < 0.2, `${(el0 * 57.3).toFixed(1)}° at sunrise`);
  assert.ok(10 / Math.tan(el0) > 45, `a 10 m pine throws ${(10 / Math.tan(el0)).toFixed(0)} m of shadow`);
  g._morningSun(1);
  const el1 = Math.asin(sun.y);
  assert.ok(el1 > el0 + 0.15 && el1 < 0.45);
  assert.ok(Math.abs(Math.atan2(sun.x, sun.z) - az0) < 1e-9);
  assert.ok(Math.abs(az0 - Math.atan2(0.42, -0.66)) < 1e-9, 'the camp\'s sun, where it always was');
});

test('SunShadow: drawn only by day, kept centred on you, redrawn only when you have walked or the sun moved', () => {
  const draws = [];
  const r = { getRenderTarget: () => null, getClearColor: (c) => c, getClearAlpha: () => 1, setClearColor() {}, setRenderTarget() {}, clear() {}, render: (s, c) => draws.push(c) };
  const omni = { scene: new THREE.Scene(), dyn: [], frame: 0 };
  const ss = new SunShadow(r, omni, 1024, 64);
  const keepDawn = shared.uDawn.value;
  try {
    shared.uSun.value.set(0.4, 0.17, -0.62).normalize();
    shared.uDawn.value = 0;
    assert.equal(ss.update({ x: 0, y: 0, z: 0 }), false);
    assert.equal(shared.uSunK.value.x, 0, 'the night: no sun, no map');
    shared.uDawn.value = 1;
    const f = { x: 10, y: 2, z: -20 };
    assert.equal(ss.update(f), true);
    assert.equal(shared.uSunK.value.x, 1);
    assert.equal(ss.update(f), false, 'the same place: the same map');
    assert.equal(ss.update({ x: 15, y: 2, z: -20 }), false, '5 m: still inside the box');
    assert.equal(ss.update({ x: 20, y: 2, z: -20 }), true, '10 m: drawn round you again');
    shared.uSun.value.set(0.4, 0.3, -0.62).normalize();
    assert.equal(ss.update({ x: 20, y: 2, z: -20 }), true, 'the sun climbed');
    assert.equal(draws.length, 3);
    // where you stand is the middle of the map (to a texel)
    const q = new THREE.Vector4(20, 2, -20, 1).applyMatrix4(shared.uSunMat.value);
    assert.ok(Math.abs(q.x - 0.5) < 2 / 1024 && Math.abs(q.y - 0.5) < 2 / 1024, `${q.x.toFixed(4)}, ${q.y.toFixed(4)}`);
    // and a point toward the sun is nearer the light (smaller depth)
    const s = shared.uSun.value, q2 = new THREE.Vector4(20 + s.x * 10, 2 + s.y * 10, -20 + s.z * 10, 1).applyMatrix4(shared.uSunMat.value);
    assert.ok(q2.z < q.z);
    ss.enabled = false;
    assert.equal(ss.update(f), false);
    assert.equal(shared.uSunK.value.x, 0, 'the graphics switch turns it off');
  } finally {
    shared.uDawn.value = keepDawn;
    shared.uSunK.value.x = 0;
  }
});

test('the light shafts: only with the sun\'s shadows on, stronger in the morning milk', () => {
  const keep = [shared.uSunK.value.x, shared.uDawn.value, shared.uFog.value, shared.uMorning.value];
  try {
    const k = (on) => Post.prototype._raysStrength.call({ raysOn: on });
    shared.uSunK.value.x = 0;
    shared.uDawn.value = 1;
    assert.equal(k(true), 0, 'no shadow map, no shafts');
    shared.uSunK.value.x = 1;
    shared.uFog.value = 0;
    const clear = k(true);
    shared.uFog.value = 1;
    shared.uMorning.value = 1;
    const milk = k(true);
    assert.ok(clear > 0.3 && milk > clear && milk <= 1.0001, `${clear} → ${milk}`);
    assert.equal(k(false), 0);
    assert.match(src('src/main.js'), /post\.setRays\(g\.shadows && settings\.quality !== 'low'\)/);
  } finally {
    [shared.uSunK.value.x, shared.uDawn.value, shared.uFog.value, shared.uMorning.value] = keep;
  }
});
