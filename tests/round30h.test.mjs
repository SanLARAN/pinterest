// 3.0h: the участок actually loads.
//
// The bog built its world (round30a–f test that) but the *game* on top of it was never constructed anywhere in the
// suite — and that is exactly what broke: the forest's field kit reads its spawn points out of places the bog does
// not have, threw inside `new Game`, and the boot screen spun on «лес растёт…» for ever. So this builds the whole
// thing, headlessly, with a DOM stub, runs frames, and plays the finale.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';

// ---------------------------------------------------------------- the smallest DOM a Game touches
const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '',
  width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {},
  querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => ({
    fillRect() {}, clearRect() {}, strokeRect() {}, drawImage() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, fill() {}, fillText() {}, arc() {}, ellipse() {},
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: new Uint8Array(4) }),
    putImageData() {},
  }),
});
globalThis.document = globalThis.document || {
  documentElement: stubEl(), body: stubEl(), head: stubEl(),
  getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [],
  createElement: () => stubEl(), createElementNS: () => stubEl(),
  addEventListener() {}, removeEventListener() {},
};
globalThis.window = globalThis.window || {
  addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { search: '', href: 'http://localhost/' },
};
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');

// a headset for the Game: everything it is handed at boot, silenced
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
function mkGame(mapId, input = anyFn) {
  const scene = new THREE.Scene();
  const world = new World(scene, new THREE.MeshBasicMaterial(), mapId).generate();
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.05, 400);
  const game = new Game({
    scene, camera, world,
    pulses: { emit() {}, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0 }; }, release() {} },
    eyes: { add() {}, clear() {} },
    particles: { burst() {}, clear() {} },
    audio: anyFn, input, hud: anyFn, radar: anyFn, post: anyFn, shadows: anyFn,
    // the mic answers every frame: a mouth that is silent, not a proxy that returns nothing
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
  return { game, world, scene };
}

const frame = (game, dt = 1 / 60) => game.update(dt, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });

test('the bog builds a whole Game — the thing that used to spin on «лес растёт…»', () => {
  const { game, world } = mkGame('bog');
  assert.equal(game.map, 'bog');
  assert.equal(world.mapId, 'bog');
  // the forest's kit is not lying around a bog that has no yard and no tower: an empty list, not a throw
  assert.deepEqual(game.tools.items, []);
  // ...and there is no UAZ parts map, because there is no UAZ to lay out
  assert.equal(game.partMap.has, false);
  assert.equal(game.partMap.inert, true);
  // the bog's own systems are real ones
  assert.equal(game.winch.inert, undefined);
  assert.ok(game.winch.car, 'the car the shift came in is the one to get out');
  assert.equal(game.drowned.inert, undefined);
  assert.equal(game.gnats.inert, undefined);
  // the forest's yard and tower are the inert ones
  assert.ok(game.escape.inert && game.expedition.inert);
});

test('a bog shift starts, runs frames and never touches a missing place', () => {
  const { game } = mkGame('bog');
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  assert.equal(game.state, 'play');
  assert.equal(game.objectives.gens.length, 5);
  for (let i = 0; i < 600; i++) frame(game); // ten seconds of a night: lamps, midges, water, the drowned
  assert.ok(game.time > 9.5);
  // the last dawn is the winch's: turning the drum out in the light must not throw either
  game.startDawn();
  for (let i = 0; i < 120; i++) frame(game);
  assert.equal(game.state, 'dawn');
  // the winch is where the car is, and it is offered as a target
  // (3.0m) the drum is on the nose of the car the shift came in, not of a wreck across the map
  const d = game.winch.drum();
  const near = Math.hypot(d.x - game.world.crewCar.x, d.z - game.world.crewCar.z);
  assert.ok(Math.abs(near - 1.5) < 0.01, `the drum is on the nose: ${near}`);
});

test('the bog does not sit you on the fire tower: you can actually walk', () => {
  // (3.0i) `inert(Expedition)` left the prototype's getter in place, and `this.tower !== null` on an object with
  // no tower is *true* — so the bog thought you were standing on the lookout, and the player controller was
  // replaced by "look around from the deck". Looking worked. Walking did not.
  const input = { move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, consume: () => [], uiMode: false, events: [] };
  const { game, world } = mkGame('bog', input);
  assert.equal(game.expedition.onTower, false, 'the bog has no lookout to stand on');
  assert.equal(game.expedition.walkTop, false);
  assert.equal(game.escape.held, false, 'and no car part in your arms');
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  const p = game.player;
  const s = { x: p.x, z: p.z };
  input.move.y = 1; // forward
  for (let i = 0; i < 180; i++) frame(game); // three seconds
  const d = Math.hypot(p.x - s.x, p.z - s.z);
  assert.ok(d > 4, `walked ${d.toFixed(2)} m in three seconds`);
  assert.ok(world.col.free(p.x, p.z, 0.34), 'and stands where it got to');
});

test('the forest still has its own kit and its parts map', () => {
  const { game } = mkGame('forest');
  assert.equal(game.tools.items.length, 4, 'a tape and a crowbar in each of the two places');
  assert.equal(game.partMap.inert, undefined);
  assert.equal(game.winch.car, null, 'no car to winch');
  game.setupSolo();
  game.reset({ days: 2 });
  game.startNight();
  for (let i = 0; i < 60; i++) frame(game);
  assert.equal(game.state, 'play');
});

test('the menu has a plate of each ground, printed from the real terrain', () => {
  for (const id of ['forest', 'bog']) {
    const f = new URL(`../public/maps/${id}.png`, import.meta.url);
    assert.ok(existsSync(f), `${id}.png exists`);
    const buf = readFileSync(f);
    assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'a real PNG');
    assert.equal(buf.readUInt32BE(16), 440, 'width');
    assert.equal(buf.readUInt32BE(20), 560, 'height');
    assert.ok(buf.length > 20_000 && buf.length < 400_000, `a few hundred kB, not a megabyte: ${buf.length}`);
  }
  // and the solo panel points at them
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="soloMapPreview"'), 'the plate is in the panel');
  assert.ok(html.includes('maps/forest.png'), 'with a first plate already set');
});
