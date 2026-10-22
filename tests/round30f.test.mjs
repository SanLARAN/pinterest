// 3.0f: the winch. The bog does not end with a clock — it ends with forty seconds of turning a drum by hand,
// with the water climbing back every second you are not turning it. These check the four rules that make that
// a finale rather than a button: the ratchet, the pumps, the starter, and the shift that will not close without it.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { WINCH, Winch } from '../src/game/winch.js';

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
    objectives: { gens: [0, 1, 2, 3, 4].map((i) => ({ running: i < (opts.on ?? 5) })) },
    score: 0, stats: {}, shiftLeft: () => 0,
    ends: [], onEnd(e) { g.ends.push(e); },
    addTrauma() {}, hlNote() {},
  };
  g.winch = new Winch(g);
  return g;
}

const T = () => 'Х';

test('the drum is on the nose of the car, and only there', () => {
  const g = stubGame();
  const w = g.winch;
  const d = w.drum();
  const car = g.world.car;
  const nose = Math.hypot(d.x - car.x, d.z - car.z);
  assert.ok(Math.abs(nose - WINCH.nose) < 1e-6, `the drum is ${nose} m from the car`);
  // the cable: one line, from the drum to the post
  const pos = w.cable.geometry.attributes.position;
  assert.ok(Math.abs(pos.getX(0) - d.x) < 1e-6 && Math.abs(pos.getZ(1) - car.post.z) < 1e-6);
  // a player at the nose is offered the drum; one at the tail is not
  let best = null;
  const consider = (obj, x, z, r, kind) => { if (Math.hypot(x - d.x, z - d.z) <= r) best = kind; };
  w.consider(consider);
  assert.equal(best, 'winch');
});

test('forty seconds of turning and the car is out of the water — and not before', () => {
  const g = stubGame();
  const w = g.winch;
  const y0 = w.carY();
  const dt = 1 / 60;
  let t = 0;
  while (t < WINCH.reelT - 0.2) {
    w.interact({ kind: 'winch' }, dt, true, true, T);
    w.update(dt);
    t += dt;
  }
  assert.ok(!w.done, 'still in the hole after 39.8 s');
  assert.ok(Math.abs(w.p - t / WINCH.reelT) < 0.02);
  while (!w.done && t < WINCH.reelT + 1) {
    w.interact({ kind: 'winch' }, dt, true, true, T);
    w.update(dt);
    t += dt;
  }
  assert.ok(w.done, 'the car came out');
  assert.ok(Math.abs(w.carY() - (y0 + WINCH.lift)) < 1e-6, 'it lifted by exactly its own lift');
  assert.ok(Math.abs(g.world.car.node.position.y - (y0 + WINCH.lift)) < 1e-6, 'and the mesh went with it');
  assert.deepEqual(g.hud.alerts.length, 1);
});

test('the ratchet holds, and five dead pumps beat forty seconds of turning', () => {
  // the drum turns 2.5% a second; a dead pump gives back 0.6% a second
  const gain = 1 / WINCH.reelT;
  const dt = 1 / 60;
  // every pump running: holding still costs nothing at all
  const all = stubGame({ on: 5 });
  for (let i = 0; i < 240; i++) all.winch.interact({ kind: 'winch' }, dt, true, true, T);
  const held = all.winch.p;
  assert.ok(held > 0.09 && held < 0.11, `four seconds of turning: ${held}`);
  for (let i = 0; i < 120; i++) all.winch.update(dt);
  assert.ok(Math.abs(all.winch.p - held) < 1e-9, 'the ratchet holds with the water down');

  // one pump down: still forward, just slower — the ratio is exactly what the numbers promise
  const one = stubGame({ on: 4 });
  for (let i = 0; i < 240; i++) { one.winch.interact({ kind: 'winch' }, dt, true, true, T); one.winch.update(dt); }
  assert.ok(one.winch.p < held, 'one dead pump slows the drum');
  assert.ok(one.winch.p > held * 0.7, 'but does not stop it');

  // all five down: no amount of turning gets ahead of the water, and the drum only falls back
  const none = stubGame({ on: 0 });
  assert.ok(none.winch.slip() > gain, 'five dead pumps come back faster than the drum turns');
  for (let i = 0; i < 240; i++) { none.winch.interact({ kind: 'winch' }, dt, true, true, T); none.winch.update(dt); }
  assert.equal(none.winch.p, 0, 'it never even left the hole');
  assert.ok(!none.winch.done);

  // three seconds of turning then hands off for ten: the ratchet gives back, never below the start
  const two = stubGame({ on: 3 });
  for (let i = 0; i < 180; i++) { two.winch.interact({ kind: 'winch' }, dt, true, true, T); two.winch.update(dt); }
  const turned = two.winch.p;
  assert.ok(Math.abs(two.winch.slip() - 2 * WINCH.slipPerPump) < 1e-12);
  for (let i = 0; i < 600; i++) two.winch.update(dt);
  assert.ok(two.winch.p < turned * 0.5, `the water came back: ${two.winch.p} of ${turned}`);
  assert.ok(two.winch.p >= 0);
});

test('the door does nothing until the car is out, and then the starter ends the shift', () => {
  const g = stubGame();
  const w = g.winch;
  const dt = 1 / 60;
  // early: E at the door is a line, not an action
  w.interact({ kind: 'bogCar' }, dt, true, true, T);
  assert.equal(w.crank, 0);
  assert.ok(!w.done);
  // turn the drum all the way
  let t = 0;
  while (!w.done && t < WINCH.reelT + 2) { w.interact({ kind: 'winch' }, dt, true, true, T); t += dt; }
  assert.ok(w.done);
  // now the starter: three seconds, and no more
  t = 0;
  while (!w.driven && t < WINCH.crankT + 1) { w.interact({ kind: 'bogCar' }, dt, true, true, T); t += dt; }
  assert.ok(w.driven, 'the engine caught');
  assert.equal(g.state, 'won');
  assert.equal(g.ends.length, 1);
  assert.equal(g.ends[0].won, true);
  assert.equal(g.stats.escaped, 1);
  assert.ok(g.winBonus > 0, 'the shift is paid for');
});

test('the last dawn will not close the shift while the car is in the water', () => {
  const g = stubGame();
  const w = g.winch;
  w.finale();
  w.finale();
  assert.equal(g.hud.alerts.length, 1, 'said once, not every frame');
  assert.equal(g.ends.length, 0, 'no results screen');
  // ...and once it is driven, nothing more is said
  w.driven = true;
  w.finale();
  assert.equal(g.hud.alerts.length, 1);
});

test('on any other участок there is no winch and no car', () => {
  const g = stubGame({ map: 'forest' });
  const w = g.winch;
  assert.equal(w.car, null);
  let asked = false;
  w.consider(() => { asked = true; });
  w.update(1 / 60);
  w.interact({ kind: 'winch' }, 1 / 60, true, true, T);
  assert.equal(asked, false);
  assert.equal(g.state, 'play');
});

test('a new shift puts the car back in the water and the drum back to zero', () => {
  const g = stubGame();
  const w = g.winch;
  const dt = 1 / 60;
  for (let i = 0; i < 600; i++) w.interact({ kind: 'winch' }, dt, true, true, T);
  assert.ok(w.p > 0.2);
  w.reset();
  assert.equal(w.p, 0);
  assert.equal(w.done, false);
  assert.equal(w.driven, false);
  assert.ok(Math.abs(w.carY() - g.world.car.baseY) < 1e-9);
});
