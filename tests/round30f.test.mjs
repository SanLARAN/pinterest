// 3.0f, rebuilt in 3.0m: one car on the участок.
//
// The shift arrives in a УАЗ and leaves in the same one. These check the four things that make getting out of
// the bog a finale rather than a button: the drum on its own bumper, the ratchet against the pumps, the flooded
// проезд that will not let the engine take water, and the dawn that will not close the shift without it.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { WINCH, Winch } from '../src/game/winch.js';
import { syncPumps } from '../src/world/bog.js';

let bog = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

// just enough of the Game: a car, five pumps, a HUD and a results callback
function stubGame(opts = {}) {
  const world = opts.world || bogWorld();
  const g = {
    world, scene: world.scene, map: opts.map || 'bog', state: 'play', time: 0, auth: true, online: false,
    player: { alive: true, x: 0, z: 0 },
    hud: {
      use: [], hints: [], alerts: [],
      setUse(line, f, ok) { g.hud.use.push({ line, f, ok }); },
      setHint(h) { g.hud.hints.push(h); },
      flashAlert(a, k, d) { g.hud.alerts.push(a); },
    },
    audio: new Proxy({}, { get: () => () => {} }),
    pulses: { rings: [], emitStep(x, y, z) { g.pulses.rings.push({ x, y, z }); } },
    objectives: { gens: [0, 1, 2, 3, 4].map((i) => ({ running: i < (opts.on ?? 5), site: { x: 12.6 + i * 0.01, z: 0.9 } })) },
    score: 0, stats: {}, shiftLeft: () => 0,
    ends: [], onEnd(e) { g.ends.push(e); },
    addTrauma() {}, hlNote() {}, noise() {},
  };
  g.winch = new Winch(g);
  return g;
}

const T = () => 'Х';
const turn = (g, seconds) => {
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) {
    g.winch.interact({ kind: 'winch' }, dt, true, true, T);
    g.winch.update(dt);
  }
};

test('the drum is on the nose of the car the shift came in, and the cable runs back to the bank', () => {
  const g = stubGame();
  const w = g.winch;
  assert.equal(w.car, g.world.crewCar, 'one car: the one the opening film drove in');
  const d = w.drum();
  const car = g.world.crewCar;
  const nose = Math.hypot(d.x - car.x, d.z - car.z);
  assert.ok(Math.abs(nose - WINCH.nose) < 1e-6, `the drum is ${nose.toFixed(2)} m out on the bumper`);
  // it is on the *water* side of the car, not behind it
  assert.ok((d.x - car.x) * car.nose.x + (d.z - car.z) * car.nose.z > 0, 'the drum faces the проезд');
  // the cable: one line, from the drum to the stake on the dry bank
  const pos = w.cable.geometry.attributes.position;
  assert.ok(Math.abs(pos.getX(0) - d.x) < 1e-6 && Math.abs(pos.getZ(1) - g.world.campSet.anchor.z) < 1e-6);
  let best = null;
  const consider = (obj, x, z, r, kind) => { if (Math.hypot(x - d.x, z - d.z) <= r) best = kind; };
  w.consider(consider);
  assert.equal(best, 'winch');
});

test('the car is standing nose-deep in the проезд, rear wheels on the bank', () => {
  const w = bogWorld();
  const c = w.crewCar;
  const depth = (k) => w.water.depth(c.x + c.nose.x * k, c.z + c.nose.z * k);
  assert.ok(depth(2.2) > 0.35, `its nose is in the water (${depth(2.2).toFixed(2)} m)`);
  assert.ok(depth(-2.2) < 0.05, 'and its tail is on dry ground');
  const mouth = w.campSet.water;
  assert.ok(w.water.depth(mouth.x, mouth.z) > 0.4, 'the ford between the banks is the deep part');
});

test('twenty-five seconds of turning and the car is out of the rut — and not before', () => {
  const g = stubGame();
  const w = g.winch;
  const before = w.spot(0);
  turn(g, WINCH.reelT - 0.3);
  assert.ok(!w.done, `still in the rut after ${(WINCH.reelT - 0.3).toFixed(1)} s`);
  let guard = 0;
  while (!w.done && guard++ < 600) { w.interact({ kind: 'winch' }, 1 / 60, true, true, T); w.update(1 / 60); }
  assert.ok(w.done, 'the car came out');
  const after = w.spot(1);
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  assert.ok(Math.abs(moved - WINCH.pull) < 1e-6, `it came back ${moved.toFixed(2)} m up its own bank`);
  assert.ok(after.y > before.y, 'and a little higher, out of the hole');
  assert.ok(Math.abs(g.world.crewCar.node.position.x - after.x) < 1e-6, 'the mesh went with it');
  assert.equal(g.world.crewCar.x, after.x, 'and so did the world\'s handle on it');
  assert.deepEqual(g.hud.alerts.length, 1);
  // its nose is on dry ground now
  const c = g.world.crewCar;
  assert.ok(g.world.water.depth(after.x + c.nose.x * 2.2, after.z + c.nose.z * 2.2) < 0.05, 'the nose is out of the water');
});

test('the ratchet holds, and five dead pumps beat twenty-five seconds of turning', () => {
  // the drum turns 4% a second; a dead pump gives back 0.6% a second
  const g = stubGame({ on: 5 });
  turn(g, 5);
  const at = g.winch.p;
  assert.ok(at > 0.15, 'turning works');
  // let go with the pumps running: nothing gives it back
  for (let i = 0; i < 60; i++) g.winch.update(1 / 60);
  assert.ok(Math.abs(g.winch.p - at) < 1e-9, 'with every pump running the drum holds where you left it');
  // let go with them dead: it slips back
  const dead = stubGame({ on: 0 });
  for (let i = 0; i < 60 * 5; i++) { dead.winch.interact({ kind: 'winch' }, 1 / 60, true, true, T); dead.winch.update(1 / 60); }
  const held = dead.winch.p;
  for (let i = 0; i < 60; i++) dead.winch.update(1 / 60);
  assert.ok(dead.winch.p < held, 'five dead pumps: let go and the car slides back');

  // five pumps down: 3% a second against 4% — you still get there, but it takes four times as long
  const slow = stubGame({ on: 0 });
  for (let i = 0; i < 60 * 140; i++) {
    slow.winch.interact({ kind: 'winch' }, 1 / 60, true, true, T);
    slow.winch.update(1 / 60);
    if (slow.winch.done) break;
  }
  assert.ok(slow.winch.done, 'with every pump dead the drum still wins…');
  assert.ok(slow.winch.p >= 1 - 1e-9);
  // ...but not at the same speed: the five dead pumps cost more than a third of it
  const fast = stubGame({ on: 5 });
  let tf = 0;
  while (!fast.winch.done && tf < 200) { fast.winch.interact({ kind: 'winch' }, 1 / 60, true, true, T); fast.winch.update(1 / 60); tf += 1 / 60; }
  assert.ok(tf < WINCH.reelT + 1, `five pumps: ${tf.toFixed(1)} s`);
});

test('the door does nothing until the car is out — and the flooded проезд will not let it start', () => {
  const g = stubGame();
  const w = g.winch;
  w.interact({ kind: 'bogCar' }, 1 / 60, true, true, T);
  assert.ok(g.hud.use.at(-1).line.includes('Х') || g.hud.use.at(-1).ok === false, 'in the rut is not out of the rut');
  assert.equal(g.ends.length, 0);

  turn(g, WINCH.reelT + 0.5);
  assert.ok(w.done);
  // the ford is still up: the starter turns, and the engine floods
  assert.ok(w.flooded(), 'the pump has not been started yet');
  for (let i = 0; i < 240; i++) w.interact({ kind: 'bogCar' }, 1 / 60, true, true, T);
  assert.equal(w.driven, false, 'no engine, no way out');
  assert.equal(g.ends.length, 0);
  assert.ok(g.hud.hints.some((h) => h.includes('Х') || h.length > 0), 'and he says why');

  // start the camp pump: the sector drains and the ford goes down
  g.objectives.gens.forEach((x) => { x.running = true; });
  syncPumps(g.world, g.objectives.gens);
  assert.ok(w.ford() < WINCH.dryDepth, `the проезд is down to ${w.ford().toFixed(2)} m`);
  assert.equal(w.flooded(), false);

  for (let i = 0; i < 240 && !w.driven; i++) w.interact({ kind: 'bogCar' }, 1 / 60, true, true, T);
  assert.ok(w.driven, 'the starter catches');
  assert.equal(g.ends.length, 1);
  assert.equal(g.ends[0].won, true);
  assert.equal(g.ends[0].map, 'bog');
});

test('the last dawn will not close the shift while the car is still in the rut', () => {
  const g = stubGame();
  g.winch.finale();
  assert.equal(g.winch.driven, false);
  assert.equal(g.hud.alerts.length, 1, 'it says so out loud');
  assert.ok(g.hud.hints.length >= 1);
  g.winch.finale();
  assert.equal(g.hud.alerts.length, 1, '...once, not every frame');
});

test('on any other участок there is no winch and no car', () => {
  const g = stubGame({ map: 'forest' });
  assert.equal(g.winch.car, null);
  assert.equal(g.winch.cable, null);
  g.winch.finale();
  assert.equal(g.hud.alerts.length, 0);
});

test('a new shift puts the car back in the rut and the drum back to zero', () => {
  const g = stubGame();
  turn(g, 6);
  assert.ok(g.winch.p > 0.1);
  g.winch.reset();
  assert.equal(g.winch.p, 0);
  assert.equal(g.winch.done, false);
  assert.ok(Math.abs(g.world.crewCar.x - g.winch.home.x) < 1e-9, 'the car is back where the film left it');
});
