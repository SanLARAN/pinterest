// 3.0b: water in the echo. The участок is only worth having if the ground changes how the game is played,
// so these check the two halves of the bargain — you hear worse in water, and you are heard better — and that
// the forest, which has no water at all, behaves exactly as it did.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { CFG } from '../src/core/config.js';
import { WATER, echoOf, mistScale, onPlanks, speedScale, stepOf, wading, wet } from '../src/game/water.js';
import { BOG_MIST } from '../src/world/bog.js';

let bog = null;
let forest = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());
const forestWorld = () => forest || (forest = new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate());

// a point that is knee-deep (and shallow enough that a pump's 0.6 m would drain it), off the planks
function deepSpot(w, lo = 0.3, hi = 0.6) {
  for (let z = -150; z < 150; z += 3) {
    for (let x = -150; x < 150; x += 3) {
      const d = w.water.depth(x, z);
      if (d > lo && d < hi && !w.onWalk(x, z, 1.2)) return { x, z };
    }
  }
  throw new Error('no water of that depth on the map');
}
// a point on the planks that is over deep water
function plankSpot(w) {
  for (const wk of w.walks) {
    for (let i = 1; i < 8; i++) {
      const x = wk.ax + (wk.bx - wk.ax) * (i / 8), z = wk.az + (wk.bz - wk.az) * (i / 8);
      if (w.water.depth(x, z) > 0.35) return { x, z };
    }
  }
  throw new Error('no planks over deep water');
}

test('in the water the echo is shorter and slower; the haze swallows it entirely', () => {
  const w = bogWorld();
  const d = deepSpot(w);
  const e = echoOf(w, d.x, d.z);
  assert.equal(e.scale, 0.6, 'a wave in knee-deep water reaches 60% as far');
  assert.equal(e.speed, 18, 'and runs 18 m/s instead of 30');
  assert.ok(e.speed < CFG.PULSE.speed);

  const dry = echoOf(w, 0, 0); // the camp
  assert.equal(dry.scale, 1);
  assert.equal(dry.speed, CFG.PULSE.speed);

  // ...and the wave that leaves you in vapour does not come back
  const m = BOG_MIST[0];
  assert.equal(mistScale(w, m.x, m.z), 0.35);
  assert.equal(mistScale(w, 0, 0), 1);
  assert.equal(echoOf(w, m.x, m.z).scale, 1, 'the haze is not depth: it eats the return, not the reach');
});

test('planks cancel the water: full reach, full speed, dry feet', () => {
  const w = bogWorld();
  const p = plankSpot(w);
  assert.ok(w.water.depth(p.x, p.z) > 0.25, 'the plank really is over deep water');
  assert.equal(onPlanks(w, p.x, p.z), true);
  assert.equal(wading(w, p.x, p.z), false, 'standing on planks is not standing in water');
  assert.equal(wet(w, p.x, p.z), false);
  assert.equal(speedScale(w, p.x, p.z), 1);
  assert.equal(echoOf(w, p.x, p.z).scale, 1);
});

test('water costs speed, and nothing else on the map does', () => {
  const w = bogWorld();
  const d = deepSpot(w);
  assert.equal(wading(w, d.x, d.z), true);
  assert.equal(speedScale(w, d.x, d.z), WATER.wadeSpeed);
  assert.ok(WATER.wadeSpeed > 0.5 && WATER.wadeSpeed < 0.65, 'just over half speed: slow, not a crawl');
  assert.equal(speedScale(w, 0, 0), 1, 'the camp is dry ground');
  assert.equal(wet(w, d.x, d.z), true);
});

test('a footstep is worth what the ground makes it worth', () => {
  const w = bogWorld();
  const d = deepSpot(w);
  const walk = stepOf(w, d.x, d.z, 0.085);
  assert.equal(walk.water, true);
  assert.equal(walk.plank, false);
  assert.ok(Math.abs(walk.loud - 0.1 * WATER.waterStepLoud) < 1e-9, 'a splash carries 1.8× a footstep (floored at 0.1)');
  assert.ok(walk.loud > 0.085, 'which is further than the same walk on dry ground');
  assert.ok(walk.ring > 0, 'and draws a ring on the surface');
  assert.equal(walk.ring, WATER.ringRadius);
  assert.ok(walk.loud > 0.085 * 1.7 && walk.loud < 0.2, 'still quieter than a shout — but it is heard');

  // crouching in the water does not make you silent: there is a floor, and it is above zero
  const crouch = stepOf(w, d.x, d.z, 0);
  assert.ok(crouch.loud > 0, 'a crouched step in water still splashes');

  const p = plankSpot(w);
  const plank = stepOf(w, p.x, p.z, 0.085);
  assert.equal(plank.plank, true);
  assert.ok(Math.abs(plank.loud - WATER.plankLoud) < 1e-9, 'a board creaks at 0.35, louder than a walk');

  // dry peat is exactly what it always was
  const dry = stepOf(w, 0, 0, 0.085);
  assert.deepEqual(dry, { loud: 0.085, plank: false, water: false, ring: 0 });
  const run = stepOf(w, 0, 0, 0.24);
  assert.equal(run.loud, 0.24, 'sprinting on dry ground is untouched');
});

test('a running pump pushes the water line down, and the echo comes back with it', () => {
  const w = bogWorld();
  const d = deepSpot(w);
  w.water.drains.push({ x: d.x, z: d.z, r: 40, drop: 0.6 });
  try {
    assert.ok(w.water.depth(d.x, d.z) < 0.45, 'the sector is drained');
    assert.equal(echoOf(w, d.x, d.z).scale, 1, 'drained ground echoes like dry ground');
  } finally {
    w.water.drains.length = 0;
  }
  assert.equal(echoOf(w, d.x, d.z).scale, 0.6, 'and the water wins again when the pump stops');
});

test('the forest has no water, so none of this happens there', () => {
  const w = forestWorld();
  assert.equal(w.water, null);
  for (const [x, z] of [[0, 0], [58, -74], [-114, 40], [152, -30]]) {
    assert.equal(wading(w, x, z), false);
    assert.equal(wet(w, x, z), false);
    assert.equal(mistScale(w, x, z), 1);
    assert.equal(speedScale(w, x, z), 1);
    assert.deepEqual(echoOf(w, x, z), { scale: 1, speed: CFG.PULSE.speed });
    assert.deepEqual(stepOf(w, x, z, 0.085), { loud: 0.085, plank: false, water: false, ring: 0 });
  }
});

test('the game and the player actually ask those questions', () => {
  const game = readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8');
  const player = readFileSync(new URL('../src/game/player.js', import.meta.url), 'utf8');
  const audio = readFileSync(new URL('../src/audio/audio.js', import.meta.url), 'utf8');
  // the wave, yours and your friends'
  assert.match(game, /const echo = echoOf\(this\.world, e\.x, e\.z\)/);
  assert.match(game, /R \*= echo\.scale \* mistScale\(this\.world, e\.x, e\.z\)/);
  assert.match(game, /const echo = echoOf\(this\.world, x, z\)/, 'a teammate in the water is in the water');
  assert.match(game, /speed: echo\.speed/, 'and the wave is slower');
  // the steps
  assert.match(player, /const wetScale = speedScale\(this\.world, this\.x, this\.z\)/);
  assert.match(player, /const g = stepOf\(this\.world, this\.x, this\.z, ev\.step\.loud\)/);
  assert.match(game, /this\.audio\.splash\(s\.intensity\)/, 'a step in water sounds like water');
  assert.match(game, /this\.audio\.creak\(s\.intensity\)/, 'a board sounds like a board');
  assert.match(game, /radius: s\.ring \|\| 8/, 'and the ring is drawn on the surface');
  assert.match(audio, /splash\(intensity = 0\.5\)/);
  assert.match(audio, /creak\(intensity = 0\.4\)/);
  // the ring is at the water line, not at the player's boots
  assert.match(game, /this\.world\.water\?\.level/);
});
