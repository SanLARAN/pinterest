// 3.0c: five pumps instead of five generators, and the water answers them.
//
// The pumps are the same machines the forest runs — the same chain, the same repair, the same sabotage — with
// one difference that makes the участок: a running pump drains the sector it stands in, and the water surface
// is redrawn as it does. That is checked here against the real Objectives, on the real map, with a stub Game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { RNG } from '../src/core/rng.js';
import { CFG } from '../src/core/config.js';
import { Objectives, pickChain } from '../src/game/objectives.js';
import { PUMP, pumpDrains, sameDrains, syncPumps } from '../src/world/bog.js';
import { inert } from '../src/core/inert.js';

// the objectives hang a glow sprite on every site's lamp, and that sprite wants a canvas: the only browser
// thing this test needs
globalThis.document ||= {
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

// the thinnest Game that can hold objectives and the water: no renderer, no night, nothing else
function stubGame(world) {
  const scene = world.scene;
  const g = {
    world, scene, map: 'bog', time: 0, mult: 1, score: 0, state: 'play', online: false, stats: {},
    audio: new Proxy({}, { get: () => () => {} }),
    hud: new Proxy({}, { get: () => () => {} }),
    pulses: { emit() {} }, particles: { burst() {} }, fx: {},
    escape: { powerOn() { g.powerOn = true; } },
    onGeneratorStarted() {}, onGenBroken() {}, hlNote() {},
    siteAt: (s) => s.id,
  };
  g.objectives = new Objectives(g);
  return g;
}

test('the bog has five pumps, each with a dead worker and a note, in a chain that uses all five', () => {
  const w = bogWorld();
  const g = stubGame(w);
  assert.equal(g.objectives.sites.length, 5);
  assert.equal(g.objectives.bodies.length, 5, 'a body by every pump');
  for (const s of w.sites) {
    assert.ok(s.corpse && Number.isFinite(s.corpse.x), `${s.id} has a body`);
    assert.ok(w.water.depth(s.corpse.x, s.corpse.z) < 0.2, `${s.id}'s body is not underwater`);
  }
  g.objectives.reset(new RNG(11));
  assert.equal(g.objectives.gens.length, 5, 'five pumps to start');
  assert.deepEqual(g.objectives.gens.map((x) => x.site.id).sort(), w.sites.map((s) => s.id).sort(), 'all five are used');
  for (const gen of g.objectives.gens) {
    assert.equal(gen.phase, 'dead');
    assert.ok(CFG.GENERATORS[gen.k], 'a pump uses the generator specs the game already has');
  }
  // with five sites the chain cannot drop one the way the six-site forest does
  for (let seed = 1; seed < 30; seed++) assert.equal(pickChain(new RNG(seed), 5).length, 5);
});

test('a running pump drains its own sector, and the water goes back when it stops', () => {
  const w = bogWorld();
  const g = stubGame(w);
  g.objectives.reset(new RNG(3));
  const gen = g.objectives.gens[1];
  const site = gen.site;

  // find a point in the pump's sector that is actually wet
  let probe = null;
  for (let r = 6; r < PUMP.drainR - 4 && !probe; r += 2) {
    for (let a = 0; a < 6.28; a += 0.4) {
      const x = site.x + Math.cos(a) * r, z = site.z + Math.sin(a) * r;
      if (w.water.depth(x, z) > 0.3 && !w.onWalk(x, z, 1)) { probe = { x, z }; break; }
    }
  }
  assert.ok(probe, 'the pump has wet ground in its sector');
  const before = w.water.depth(probe.x, probe.z);

  gen.running = true;
  const changed = syncPumps(w, g.objectives.gens);
  assert.equal(changed, true, 'the water was redrawn');
  assert.equal(w.water.drains.length, 1);
  assert.ok(w.water.depth(probe.x, probe.z) < before - 0.2, 'and the sector is drained');
  assert.ok(w.water.drains[0].drop === PUMP.drainDrop);

  // the same set again: nothing to redraw
  assert.equal(syncPumps(w, g.objectives.gens), false);

  // the machine is beaten stopped: the water comes back
  gen.running = false;
  gen.broken = true;
  assert.equal(syncPumps(w, g.objectives.gens), true);
  assert.equal(w.water.drains.length, 0);
  assert.ok(Math.abs(w.water.depth(probe.x, probe.z) - before) < 0.02);
});

test('the water surface itself is redrawn, not just the numbers', () => {
  const w = bogWorld();
  const g = stubGame(w);
  g.objectives.reset(new RNG(5));
  const waterMesh = () => w.meshes.find((m) => m.userData.water);
  const first = waterMesh();
  assert.ok(first, 'the bog is drawn with a water surface');
  const trisBefore = w.waterTris;

  g.objectives.gens.forEach((x) => { x.running = true; });
  syncPumps(w, g.objectives.gens);
  const second = waterMesh();
  assert.ok(second);
  assert.notEqual(second, first, 'a new mesh');
  assert.equal(w.scene.children.includes(first), false, 'the old one left the scene');
  assert.ok(w.waterTris < trisBefore, `five pumps leave less water: ${w.waterTris} < ${trisBefore}`);
});

test('the drains follow the state, so a co-op room agrees without a new message', () => {
  const w = bogWorld();
  const g = stubGame(w);
  g.objectives.reset(new RNG(7));
  // two pumps running here, one on a friend's machine: the list is derived, so it is the same everywhere
  g.objectives.gens[0].running = true;
  g.objectives.gens[3].running = true;
  const mine = pumpDrains(w, g.objectives.gens);
  assert.equal(mine.length, 2);
  const theirs = pumpDrains(w, [g.objectives.gens[3], g.objectives.gens[0]]);
  assert.equal(sameDrains(mine, theirs), true, 'order does not matter: it is a set of positions');
  assert.equal(sameDrains(mine, pumpDrains(w, [g.objectives.gens[0]])), false);
});

test('the forest does not grow water when a shift is reset on it', () => {
  const scene = new THREE.Scene();
  const w = new World(scene, new THREE.MeshBasicMaterial(), 'bog').generate();
  const g = stubGame(w);
  assert.equal(syncPumps(w, g.objectives.gens), false, 'nothing running, nothing to do');
  // and a map with no water at all is simply not affected
  assert.equal(syncPumps({ water: null }, []), false);
});

test('forest-only systems are inert on the bog instead of being half-built', () => {
  // the yard, the tower and the flashlight read coordinates the bog does not have
  class Fake {
    constructor() { throw new Error('must not be constructed'); }
    update() { throw new Error('must not run'); }
    powerOn() { throw new Error('must not run'); }
    load() { return ['a seat']; }
    seatOf() { return 2; }
    reset() { throw new Error('must not run'); }
    taskText() { throw new Error('must not run'); }
  }
  const e = inert(Fake, { map: 'bog' }, { load: () => null, seatOf: () => -1 });
  assert.equal(e.inert, true);
  assert.equal(e.load(), null, 'the seat list is empty, not undefined');
  assert.equal(e.seatOf(), -1, 'and nobody is sitting anywhere');
  assert.doesNotThrow(() => { e.update(1); e.powerOn(); e.reset(); e.taskText(); });
  assert.equal(e.g.map, 'bog');

  const game = readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8');
  assert.match(game, /this\.map = this\.world\.mapId \|\| 'forest'/);
  assert.match(game, /this\.escape = this\.map === 'forest' \? new Escape\(this\) : inert\(Escape/);
  assert.match(game, /this\.torch = this\.map === 'forest' \? new Torches\(this\) : inert\(Torches/);
  assert.match(game, /this\.expedition = this\.map === 'forest' \? new Expedition\(this\) : inert\(Expedition/);
  // and the water is only ever asked about on the bog
  assert.match(game, /if \(this\.map === 'bog'\) syncPumps\(this\.world, this\.objectives\.gens\)/);
});

test('the edge of the world follows the map, not the forest', () => {
  const w = bogWorld();
  assert.equal(w.wall, 156, '170 − 14');
  assert.ok(w.wall < CFG.WORLD_WALL, 'a smaller участок has a nearer edge');
  const src = readFileSync(new URL('../src/game/player.js', import.meta.url), 'utf8');
  assert.match(src, /const w = this\.world\.wall;/, 'the player is kept inside its own map');
  const mon = readFileSync(new URL('../src/game/monsters.js', import.meta.url), 'utf8');
  assert.doesNotMatch(mon, /CFG\.WORLD_WALL/, 'and so is everything that hunts');
});
