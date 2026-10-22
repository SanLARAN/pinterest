// 3.0d: the Дrowned. It is the first thing in the game that is not a variation on listening: it is deaf, it
// cannot leave the water, and it does not kill you quickly — it walks you out where the bog is deep and waits.
// These check the four rules that make it that, on the real map, with a stub Game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { RNG } from '../src/core/rng.js';
import { CFG } from '../src/core/config.js';
import { DROWNED, Drowned, DrownedBody } from '../src/game/drowned.js';

let bog = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

// a player object with just enough of itself
function mkPlayer(id, x, z) {
  return { id, alive: true, held: false, x, z, y: 0, yaw: 0, pitch: 0, speed: 0, vx: 0, vz: 0, eyeCur: 1.6, stepAcc: 0 };
}

function stubGame(world, player) {
  const g = {
    world, scene: world.scene, map: 'bog', state: 'play', time: 0, auth: true, role: 'solo',
    rng: new RNG(4242),
    player, remotes: new Map(), monsters: [],
    hud: { flashAlert() {}, peek() {}, popup() {}, setHint() {} },
    audio: new Proxy({}, { get: () => () => {} }),
    sync: null,
    livePlayers() { return [g.player, ...[...g.remotes.values()]].filter((p) => p.alive); },
    playerById(id) { return id === g.player.id ? g.player : g.remotes.get(id) || null; },
    addTrauma() {},
    distToEars(x, z) { return Math.hypot(x - player.x, z - player.z); },
    isPlayer(p) { return p === player || [...g.remotes.values()].includes(p); },
    doors: null, escape: null,
    kills: [],
    kill(m, victim) { g.kills.push({ type: m.type, id: victim.id }); victim.alive = false; },
  };
  return g;
}

// a wet point away from the planks, with at least `want` of water over it
function wetSpot(w, want = 0.6) {
  for (let z = -150; z < 150; z += 3) {
    for (let x = -150; x < 150; x += 3) {
      if (w.water.depth(x, z) > want && !w.onWalk(x, z, 1.5)) return { x, z };
    }
  }
  throw new Error('no water that deep');
}

test('the Дrowned is deaf, slow, and cannot leave the water', () => {
  const w = bogWorld();
  const g = stubGame(w, mkPlayer('a', 0, 0));
  const m = new DrownedBody(g);
  assert.equal(m.type, 'drowned');
  assert.equal(m.hear(0, 0, 1, 'voice', true), null, 'nothing in its head hears a voice');
  assert.ok(DROWNED.speed < CFG.PLAYER.walk, `slower than a walk: ${DROWNED.speed} < ${CFG.PLAYER.walk}`);
  assert.ok(DROWNED.grabR < 1.5 && DROWNED.grabR > 0.8, 'it takes you by the leg, not across the map');
  assert.ok(DROWNED.dragT > 2 && DROWNED.dragT < 4, 'the deep is patient, not instant');
  assert.ok(DROWNED.deep > 1 && DROWNED.deep < 1.5, 'out of your depth, not up to your knees');
  assert.equal(CFG.MONSTER.drowned.hearing, 0, 'its place in the shared table says it hears nothing');
  // and it is built: a body with a head to see and arms that reach
  const nodes = Object.keys(m.rig.nodes);
  for (const n of ['hips', 'spine', 'head', 'armL', 'armR', 'legL', 'legR']) assert.ok(nodes.includes(n), n);
  const verts = m.rig.parts.reduce((n, p) => n + p.arr.count, 0);
  assert.ok(verts > 120 && verts < 2000, `built in the game's own style: ${verts} vertices`);
});

test('it comes up where the peat bog is deep, and only on the bog', () => {
  const w = bogWorld();
  const g = stubGame(w, mkPlayer('a', 0, 0));
  g.drowned = new Drowned(g);
  const m = g.drowned.spawnNight();
  assert.ok(m, 'it came up');
  assert.equal(g.monsters.length, 1);
  assert.ok(w.water.depth(m.x, m.z) > DROWNED.deep, 'in water deep enough to take you');
  assert.ok(Math.abs(m.x) < w.wall && Math.abs(m.z) < w.wall, 'inside the участок');
  assert.ok(Math.hypot(m.x - g.player.x, m.z - g.player.z) > 30, 'far enough that it is not already on you');

  // the forest is not its place
  const f = stubGame(bogWorld(), mkPlayer('a', 0, 0));
  f.map = 'forest';
  f.drowned = new Drowned(f);
  assert.equal(f.drowned.spawnNight(), null);
  // and it stays where it is if it is already out
  assert.ok(g.drowned.spawnNight());
  assert.equal(g.monsters.length, 1, 'one of it, not a shoal');
});

test('it ignores a friend on the planks and goes for the one standing in the water', () => {
  const w = bogWorld();
  const wet = wetSpot(w, 0.7);
  const onDry = { x: 0, z: 0 }; // the camp
  const p = mkPlayer('a', onDry.x, onDry.z);
  const q = mkPlayer('b', wet.x, wet.z);
  const g = stubGame(w, p);
  q.alive = true;
  g.remotes.set('b', q);
  g.drowned = new Drowned(g);
  const m = new DrownedBody(g);
  m.spawn(wet.x + 8, wet.z);
  g.monsters.push(m);
  g.drowned.body = m;
  g.drowned.cool = 0;

  g.drowned.update(0.05);
  assert.equal(m.tgt.id, 'b', 'the one in the water is the one worth going to');
  assert.equal(m.mode, 'stalk');

  // ...and a friend on the planks is out of its world
  q.x = w.walks[0].ax; q.z = w.walks[0].az;
  g.drowned.update(0.05);
  assert.equal(m.tgt, null, 'planks are not water');
});

test('it takes you by the leg, walks you out, and the deep has you', () => {
  const w = bogWorld();
  const wet = wetSpot(w, 0.5);
  const p = mkPlayer('a', wet.x, wet.z);
  const g = stubGame(w, p);
  g.drowned = new Drowned(g);
  const m = new DrownedBody(g);
  m.spawn(wet.x + 1.0, wet.z);
  g.monsters.push(m);
  g.drowned.body = m;
  g.drowned.cool = 0;

  g.drowned.update(0.016);
  assert.ok(g.drowned.cap, 'the hand closed at 1.2 m');
  assert.equal(p.held, true, 'you are held');
  assert.equal(g.drowned.captiveLocal(), true);

  // the drag frame hands the game a step, and hands the body over to the water
  const frame = g.drowned.dragFrame(0.016);
  assert.ok(frame.step === null || frame.step.water === true, 'being dragged splashes');
  assert.equal(p.vx, 0, 'your own legs are not part of this');

  // hold on: it walks you toward the deepest water it can find, and the clock runs
  let killed = false;
  for (let i = 0; i < 600 && !killed; i++) {
    g.drowned.update(0.02);
    killed = g.kills.length > 0;
    if (g.drowned.cap) assert.ok(w.water.depth(p.x, p.z) > 0, 'and it never drags you out of the water');
  }
  assert.ok(killed, 'after about dragT in the deep, you are gone');
  assert.deepEqual(g.kills[0], { type: 'drowned', id: 'a' });
  assert.equal(p.held, false, 'and it lets go of the body');
});

test('pulled onto the planks or into the shallows, the grip is gone', () => {
  const w = bogWorld();
  const wet = wetSpot(w, 0.5);
  const p = mkPlayer('a', wet.x, wet.z);
  const g = stubGame(w, p);
  g.drowned = new Drowned(g);
  const m = new DrownedBody(g);
  m.spawn(wet.x + 1.0, wet.z);
  g.monsters.push(m);
  g.drowned.body = m;
  g.drowned.cool = 0;
  g.drowned.update(0.016);
  assert.ok(g.drowned.cap);

  // someone hauls you onto the boards
  p.x = w.walks[0].ax; p.z = w.walks[0].az;
  g.drowned.update(0.02);
  assert.equal(g.drowned.cap, null, 'the plank road is out of its reach');
  assert.equal(p.held, false);
  assert.equal(g.drowned.cool, DROWNED.cool, 'and it waits before trying again');
  assert.equal(g.kills.length, 0);
});

test('a friend can pull you out of its hands', () => {
  const w = bogWorld();
  const wet = wetSpot(w, 0.5);
  const p = mkPlayer('a', wet.x, wet.z);
  const g = stubGame(w, p);
  g.drowned = new Drowned(g);
  const m = new DrownedBody(g);
  m.spawn(wet.x + 1.0, wet.z);
  g.monsters.push(m);
  g.drowned.body = m;
  g.drowned.cool = 0;
  g.drowned.update(0.016);
  assert.ok(g.drowned.cap);
  g.drowned.freed('a');
  assert.equal(g.drowned.cap, null, 'hauled clear by hand (Rescue calls this)');
});

test('the game hands its frame and its night over to the water', () => {
  const game = readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8');
  assert.match(game, /this\.drowned = new Drowned\(this\)/);
  assert.match(game, /this\.drowned\.reset\(\)/);
  assert.match(game, /this\.drowned\.update\(dt\)/);
  assert.match(game, /const heldByWater = this\.drowned\.captiveLocal\(\)/);
  assert.match(game, /heldByWater \? this\.drowned\.dragFrame\(dt\)/);
  assert.match(game, /if \(this\.map === 'bog' && this\.drowned\) this\.drowned\.spawnNight\(\)/);
  // and the sounds and the words for it exist in both languages
  const i18n = readFileSync(new URL('../src/core/i18n.js', import.meta.url), 'utf8');
  assert.match(i18n, /aDrowned: 'В ВОДЕ ЧТО-ТО ЕСТЬ'/);
  assert.match(i18n, /aDrowned: 'THERE IS SOMETHING IN THE WATER'/);
  const audio = readFileSync(new URL('../src/audio/audio.js', import.meta.url), 'utf8');
  assert.match(audio, /drownedRise\(x, y, z\)/);
  assert.match(audio, /drownedGrab\(\)/);
});
