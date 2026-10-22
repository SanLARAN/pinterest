// 3.0q, in a real Game: not the bunker's own numbers, but the whole night around it.
//
// The shelter is the first thing in this project that moves the player to another world-space room inside a live
// night: a second collision set, a floor of its own, a script that can end the run, and a gate on the road out
// that now waits for it. None of that is visible to unit tests, so this builds the whole Game headlessly (the same
// DOM stub as round30h), puts the camp on the mains, goes down, walks the corridor, throws the breaker, and climbs
// back out.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

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

const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
const mkInput = () => ({
  move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, uiMode: false,
  events: [], useHeld: false, touch: false, consume: () => [],
});
function mkGame(mapId, input = mkInput()) {
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
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
  return { game, world, scene, input };
}
const frame = (game, dt = 1 / 60) => game.update(dt, { events: [], look: { dx: 0, dy: 0 } });
const run = (game, sec, fn) => { for (let i = 0; i < Math.ceil(sec * 60); i++) fn ? fn(i) : frame(game); };

test('the forest has no shelter, and asking it anything is harmless', () => {
  const { game, world } = mkGame('forest');
  assert.equal(world.bunker, undefined, 'no cap, no corridor, no crack on the forestry участок');
  assert.equal(game.bunker.B, null, 'and the shelter knows it has no place to be');
  assert.equal(game.bunker.gateOpen, false);
  assert.equal(game.bunker.needsBreaker, false);
  assert.doesNotThrow(() => {
    game.bunker.onPower(); game.bunker.consider(() => {}); game.bunker.interact({ kind: 'shelterCap' }, true, (k) => k);
    game.bunker.update(1 / 60); game.bunker.reset();
    game.bunker.evacuate();
  });
  assert.equal(game.winch.shut(), false, 'and nothing holds the car up');
});

test('the bog: five pumps unlock the cap, the breaker lifts the gate, and the corridor is walked', () => {
  const { game, world, input } = mkGame('bog');
  const B = world.bunker;
  assert.ok(B, 'the camp island has a shelter under it');
  const G = world.worksGate;
  assert.ok(G, 'and the way out of the участок has a gate on it');
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  assert.equal(game.state, 'play');
  assert.equal(game.escape.inert, true, 'the bog has no yard to escape from: the winch is its way out');
  // the night starts: nothing is armed, and the road is shut
  assert.equal(game.bunker.state, 'sealed');
  assert.equal(G.open, false, 'the leaf is down');
  assert.equal(game.winch.shut(), true, 'so the car cannot leave yet');
  // five pumps: the camp is on the mains (this is what game.js does when the fifth one catches)
  game.bunker.onPower();
  run(game, 0.2);
  assert.equal(game.bunker.state, 'unlocked', 'the cap\'s lock let go');
  assert.equal(G.open, false, 'and the gate has not moved: its contactor is in the shelter');
  assert.equal(game.bunker.needsBreaker, true, 'the task line points down the hole');
  assert.ok(game.objectives.taskText().length > 0, 'and there is something to read on Tab');
  assert.equal(game.winch.shut(), true, 'still no road out');
  // the cap: force the lock, then go down
  game.bunker.unlock();
  run(game, 0.1);
  assert.equal(game.bunker.state, 'open');
  game.bunker.descend();
  run(game, 1.6);
  const p = game.player;
  assert.equal(game.bunker.inside, true, 'she is under the ground');
  assert.equal(p.col, B.col, 'resolved against the shelter now');
  assert.equal(p.underground, true, 'and nothing above can reach her');
  assert.equal(p.floorY, B.y);
  assert.ok(Math.abs(p.y - B.y) < 0.35, `standing on its floor (${p.y.toFixed(2)} vs ${B.y.toFixed(2)})`);
  // walk down the corridor: forward is −z, and the floor holds
  const z0 = p.z;
  input.move.y = 1; // forward
  run(game, 3.0);
  input.move.y = 0;
  assert.ok(p.z < z0 - 3, `she walks away from the ladder (${(z0 - p.z).toFixed(1)} m)`);
  assert.ok(Math.abs(p.y - B.y) < 0.5, 'and does not fall through the floor');
  assert.ok(p.x > B.hall.x0 + 0.3 && p.x < B.hall.x1 - 0.3, 'and is still in the corridor, not through its wall');
  // the breaker: the gate lifts above, the wall answers, the lamps go out
  game.bunker.throwBreaker();
  run(game, 0.9);
  assert.equal(game.bunker.gateOpen, true, 'the way out of the участок is opening');
  run(game, 5.0);
  assert.equal(G.open, true, 'the leaf is high enough to drive under');
  assert.equal(game.winch.shut(), false, 'so the car could leave now');
  assert.equal(game.bunker.script.lampsLit(), 0, 'the corridor is dark');
  assert.ok(game.bunker.script.alarmT >= 0, 'the siren is going');
  assert.ok(game.bunker.horde.length > 0, 'and they are coming out');
  assert.ok(game.bunker.script.doorK < 0.999, 'the slab is on its way down');
  // back up the ladder, before the slab is down
  p.x = B.ladder.x;
  p.z = B.ladder.z;
  game.bunker.ascend();
  run(game, 1.8);
  assert.equal(game.bunker.inside, false, 'out on the camp island');
  assert.equal(p.col, null, 'back on the участок\'s own walls');
  assert.equal(p.underground, false);
  assert.equal(game.bunker.state, 'left');
  assert.ok(p.z > B.hatch.z - 3.5, 'and standing by the cap');
  run(game, 2.0);
  assert.ok(game.objectives.taskText().length > 0, 'and the task line still says something');
});
