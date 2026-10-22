// 3.0l: the camp is a base at a washed-out проезд, the shift arrives in a УАЗ, and the pumps are started.
//
// Three things are checked here, all against the real map:
//   · the проезд is a real flooded stretch of a real road: dry track, water, dry track — and the camp pump
//     stands at it, with its suction line in the water
//   · the opening film drives the car in and puts all four of them to work on the camp side of the water
//   · nothing on the bog sounds like a generator any more: the pump has its own voice, and the forest keeps its
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { RNG } from '../src/core/rng.js';
import { Objectives } from '../src/game/objectives.js';
import { CAMP_TRACK, CAMP_FLOODS, PUMP } from '../src/world/bog.js';

globalThis.document ||= {
  body: { classList: { add() {}, remove() {} } },
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({
      createRadialGradient: () => ({ addColorStop() {} }),
      fillRect() {}, set fillStyle(v) {}, get fillStyle() { return ''; },
    }),
  }),
};

let bog = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

// the thinnest Game that can hold objectives: the same stub round30c uses, plus a spy on the audio
function stubGame(world, map = 'bog') {
  const heard = [];
  const audio = new Proxy({ ready: true }, {
    get: (t, k) => {
      if (k === 'ready') return true;
      return (...args) => { heard.push([k, ...args]); return k === 'pumpRun' ? { level() {}, glug() {}, stop() {} } : null; };
    },
  });
  const g = {
    world, scene: world.scene, map, time: 0, mult: 1, score: 0, state: 'play', online: false, stats: {},
    audio,
    hud: new Proxy({}, { get: () => () => {} }),
    pulses: { emit() {} }, particles: { burst() {} }, fx: {},
    escape: { powerOn() {} }, radar: { blip() {} },
    onGeneratorStarted() {}, onGenBroken() {}, hlNote() {},
    siteAt: (s) => s.id, heard,
  };
  g.objectives = new Objectives(g);
  return g;
}

test('the проезд is a flooded stretch of the track: dry road, water, dry road', () => {
  const w = bogWorld();
  const at = (d) => ({ x: CAMP_TRACK.x * d, z: CAMP_TRACK.z * d });
  const depth = (d) => w.water.depth(at(d).x, at(d).z);
  assert.ok(depth(9) < 0.05, 'the road inside the camp is dry');
  assert.ok(depth(14) < 0.12, 'the near bank is dry ground');
  const deep = [];
  for (let d = 12; d <= 30; d += 0.5) if (depth(d) > 0.3) deep.push(d);
  assert.ok(deep.length >= 8, `the flood is ${deep.length} half-metres wide`);
  const mid = deep[Math.floor(deep.length / 2)];
  assert.ok(depth(mid) > 0.55, `knee-deep in the middle (${depth(mid).toFixed(2)} m)`);
  assert.ok(depth(32) < 0.05, 'and the road comes out of the water again');
  for (const F of CAMP_FLOODS) {
    assert.ok(Math.abs(w.water.depth(F.x, F.z) - 0) > 0.4, 'each basin is under water');
  }
});

test('the camp pump stands at the проезд, with its suction line in the water and its ground dry', () => {
  const w = bogWorld();
  const cs = w.campSet;
  assert.ok(cs, 'the camp is laid out');
  assert.ok(w.water.depth(cs.pump.x, cs.pump.z) < 0.05, 'a pump that stood in the flood would be useless');
  assert.ok(w.water.depth(cs.water.x, cs.water.z) > 0.2, 'the hose end is in the water');
  const d = Math.hypot(cs.pump.x - cs.water.x, cs.pump.z - cs.water.z);
  assert.ok(d < 7, `the hose is a hose, not a expedition (${d.toFixed(1)} m)`);
  for (const k of ['crank', 'prime', 'hose']) {
    assert.ok(w.water.depth(cs[k].x, cs[k].z) < 0.1, `${k} is on dry ground`);
  }
  assert.ok(w.water.depth(cs.marker.x, cs.marker.z) < 0.1, 'the marker is at the edge, not in the middle');
  // the car waits on the far bank, nose to the water — as far as the road went
  assert.ok(w.water.depth(cs.car.x, cs.car.z) < 0.1, 'the car is not in the water');
  const toWater = Math.hypot(cs.car.x - cs.water.x, cs.car.z - cs.water.z);
  assert.ok(toWater > 6, 'the water is between the car and the pump');
});

test('starting the camp pump drains the проезд (the water answers it)', () => {
  const w = bogWorld();
  const before = w.water.depth(CAMP_FLOODS[0].x, CAMP_FLOODS[0].z);
  w.water.drains = [{ x: w.campSet.pump.x, z: w.campSet.pump.z, r: PUMP.drainR, drop: PUMP.drainDrop }];
  const after = w.water.depth(CAMP_FLOODS[0].x, CAMP_FLOODS[0].z);
  assert.ok(after < before - 0.3, `the passage drops ${(before - after).toFixed(2)} m`);
  w.water.drains = [];
});

test('the film drives in the world\'s own car and puts four people to work on the camp side', async () => {
  const { IntroCutscene } = await import('../src/game/intro.js');
  const w = bogWorld();
  const g = stubGame(w);
  Object.assign(g, {
    fx: { fade: 0 }, input: { requestLock() {} },
    fire: { reset() {}, douse() {}, out() {}, update() {} },
    audio: new Proxy({ ready: true }, {
      get: (_, k) => (...a) => {
        if (k === 'pumpRun') return { level() {}, glug() {}, stop() {} };
        if (k === 'uazStart') return { rev() {}, stop() {} };
        if (k === 'fire') return { level() {}, stop() {}, crackle() {} };
        return null;
      },
    }),
    hud: { setIntro() {}, setHint() {}, setUse() {}, setSkip() {} },
  });
  const film = new IntroCutscene(g);
  film.forceSeats = 4;
  film.begin();
  film._build();
  // the parked car is out of the shot while the film's own car is driving
  assert.equal(w.crewCar.node.visible, false);
  // mid-film they are all at their own job, on the camp side of the water
  film.seek(film.tJump + 1.4);
  film.update(1 / 60, []);
  assert.equal(film.cast.length, 4);
  for (const a of film.cast) {
    const d = Math.hypot(a.x - w.campSet.pump.x, a.z - w.campSet.pump.z);
    assert.ok(d < 6.5, `${a.seat.act} works ${d.toFixed(1)} m from the pump`);
    assert.ok(w.water.depth(a.x, a.z) < 0.12, `${a.seat.act} is standing in the water`);
  }
  for (let i = 0; i < 60 * 25 && film.state === 'run'; i++) film.update(1 / 60, []);
  assert.equal(film.state, 'done');
  assert.equal(w.crewCar.node.visible, true, 'the car the world keeps is back where the film left it');
  assert.ok(Math.abs(film.set.car.x - w.crewCar.x) < 0.01 && Math.abs(film.set.car.z - w.crewCar.z) < 0.01,
    'the film ends exactly where the parked car stands');
});

// the user's complaint, made un-repeatable: the car at the проезд and the car in the film were a box with a
// bonnet propped on it. They are now the garage's own УАЗ — the same builder the yard and the shop use.
test('the car is the real УАЗ: full body, four wheels on the ground, not a box', async () => {
  const w = bogWorld();
  const { buildCarBody } = await import('../src/ui/garageSet.js');
  const { geometryOf } = await import('../src/game/uaz.js');
  const { IntroCutscene } = await import('../src/game/intro.js');
  const real = geometryOf(buildCarBody());
  const parked = w.crewCar.node;
  const body = parked.children.find((c) => c.geometry && !c.userData.wheel);
  assert.ok(body, 'the parked car has a body mesh');
  assert.equal(body.geometry.attributes.position.count, real.attributes.position.count,
    'the body is the garage car, vertex for vertex');
  const box = new THREE.Box3().setFromObject(parked);
  const size = box.max.clone().sub(box.min);
  assert.ok(size.y > 1.7, `it is a УАЗ tall (${size.y.toFixed(2)} m), not a shoebox`);
  assert.ok(Math.max(size.x, size.z) > 4.0, 'and 4.4 m long');
  assert.equal(parked.userData.wheels.length, 4, 'all four wheels, none missing');
  const g = w.terrain.height(w.crewCar.x, w.crewCar.z);
  for (const pivot of parked.userData.wheels) {
    const y = pivot.getWorldPosition(new THREE.Vector3()).y - g;
    assert.ok(Math.abs(y - 0.39) < 0.03, `the wheel stands on the ground (${y.toFixed(2)} m)`);
  }
  // and the film drives this very car, not a second one
  const game = stubGame(w);
  Object.assign(game, {
    fx: { fade: 0 }, input: { requestLock() {} },
    fire: { reset() {}, douse() {}, out() {}, update() {} },
    audio: new Proxy({ ready: true }, { get: () => () => null }),
    hud: { setIntro() {}, setHint() {}, setUse() {}, setSkip() {} },
  });
  const film = new IntroCutscene(game);
  film.begin();
  film._build();
  assert.equal(film.carNode.userData.crewCar, true);
  assert.equal(film.carNode.children.find((c) => c.geometry && c.geometry.attributes.position.count === real.attributes.position.count)?.geometry.attributes.position.count,
    real.attributes.position.count, 'the film drives the same body');
});

test('the bog speaks pump, the forest speaks generator — same objectives, different machine', () => {
  const w = bogWorld();
  const b = stubGame(w, 'bog');
  b.objectives.reset(new RNG(3));
  const gen = b.objectives.gens[0];
  b.heard.length = 0;
  const voice = b.objectives._voice(gen);
  assert.ok(voice && typeof voice.level === 'function', 'a pump voice comes back');
  assert.deepEqual(b.heard.map((h) => h[0]), ['pumpRun']);
  assert.ok(!b.heard.some((h) => /gen(Hum|Start)/.test(h[0])));

  const f = stubGame(w, 'forest');
  f.objectives.reset(new RNG(3));
  f.heard.length = 0;
  f.objectives._voice(f.objectives.gens[0]);
  assert.deepEqual(f.heard.map((h) => h[0]), ['genHum'], 'the forest still runs its generators');

  // and the words on the tab are about the проезд, not about a forestry yard
  const bogTask = b.objectives.taskText();
  assert.ok(/насос|проезд/i.test(bogTask), bogTask);
  const forestTask = f.objectives.taskText();
  assert.ok(/генератор/i.test(forestTask), forestTask);
});

test('the pump has its own voice: no lamp tink, no mains hum, no beep', () => {
  const src = readFileSync(new URL('../src/audio/audio.js', import.meta.url), 'utf8');
  const start = src.indexOf('  pumpStart(x, y, z) {');
  assert.ok(start > 0, 'pumpStart exists');
  const body = src.slice(start, src.indexOf('\n  cordPull(', start));
  assert.ok(!/3700|100, 150|_tone\(t \+ 0\.85/.test(body), 'nothing in the pump is the generator start');
  const run = src.indexOf('  pumpRun(x, y, z, lvl = 1) {');
  assert.ok(run > 0, 'pumpRun exists');
  const rb = src.slice(run, src.indexOf('  pumpStart(', run));
  assert.ok(/square/.test(rb) && /bandpass/.test(rb), 'a stroke and a valve, not a hum');
  assert.ok(!/flutter|whine/.test(rb));
});
