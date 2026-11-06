// 4.0a, in a real Game: the forestry gate rolls on its own five generators — there is no breaker in the forest.
//
// 3.0q hung the gate's contactor off a shelter's breaker; the shelter then moved under the peat works' camp on the
// other участок, and the forest's gate was left waiting for a lever that is not there: after the fifth generator
// the task line sent you to a shelter the forest does not have, and the night could not be finished. This builds
// the whole Game headlessly (the same DOM stub as round30q-game), starts the five machines one by one, and watches
// the gate open by itself.
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

const { t, setLang, getLang } = await import('../src/core/i18n.js');
const { readFileSync } = await import('node:fs');
const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

function forestNight() {
  const made = mkGame('forest');
  const { game } = made;
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  return made;
}
const startAll = (game, n = 5) => {
  const ob = game.objectives;
  const gens = ob.gens.filter((q) => !q.running).slice(0, n);
  for (const g of gens) ob._start(g);
  return gens.length;
};

test('the forest: five generators, and the gate opens by itself — no shelter, no breaker', () => {
  const { game, world } = forestNight();
  const esc = game.escape;
  assert.equal(game.state, 'play');
  assert.equal(world.bunker, undefined, 'there is no shelter on the forestry участок');
  assert.equal(esc.inert, undefined, 'the forest has its yard and its car');
  assert.ok(game.objectives.gens.length >= 5, 'five machines to start');
  assert.equal(esc.power, false);
  assert.equal(esc.gate.state, 'shut', 'the night starts with the gate shut');
  // four are not enough
  assert.equal(startAll(game, 4), 4);
  run(game, 2.5);
  assert.equal(game.objectives.count, 4);
  assert.equal(esc.power, false, 'four machines do not put the yard on the mains');
  assert.equal(esc.gateOpen, false, 'and the gate stays where it is');
  // the fifth: 1.8 s later the yard has power, and the gate is already moving — nobody pulls anything
  assert.equal(startAll(game, 1), 1);
  assert.equal(game.objectives.count, 5);
  run(game, 0.5);
  assert.equal(esc.gateOpen, false, 'not on the same frame: the mains take a moment to arrive');
  run(game, 1.6);
  assert.equal(esc.power, true, 'all five: the yard is on the mains');
  assert.equal(esc.gate.state, 'opening', 'and the gate rolls on its own');
  // the task line and the note on the gate: the way out, not a shelter
  const was = getLang();
  for (const L of ['ru', 'en']) {
    setLang(L);
    const task = esc.taskText();
    assert.ok(task.length > 0, `${L}: the task line says what is next`);
    assert.notEqual(task, t('taskBunker'), `${L}: not «go down into the shelter»`);
    assert.doesNotMatch(task, /рубильник|убежищ|breaker|shelter/i, `${L}: no lever in the forest's task line`);
    assert.doesNotMatch(game.objectives.taskText(), /рубильник|убежищ|breaker|shelter/i, `${L}: nor on Tab`);
    let note = '';
    const open = game.objectives.openNote;
    game.objectives.openNote = (kicker, text) => { note = text; };
    esc.readNote('gate');
    game.objectives.openNote = open;
    assert.equal(note, t('noteGateMoving'), `${L}: the sign on the gate says it is moving`);
    assert.doesNotMatch(t('noteGate'), /рубильник|убежищ|breaker|shelter/i, `${L}: and before the power it promises the gate opens by itself`);
  }
  setLang(was);
  // the gate goes all the way
  run(game, 9.5);
  assert.equal(esc.gate.state, 'open', 'the gate is fully open');
  assert.ok(esc.gate.open > 0.99, 'all the way along its track');
});

test('the strings of the old wait are gone, and the shelter does not reach for the forest\'s gate', () => {
  for (const L of ['ru', 'en']) {
    const was = getLang();
    setLang(L);
    assert.equal(t('noteGateOn'), 'noteGateOn', `${L}: no «the power is on, but the gate stands» note`);
    assert.equal(t('aYardPower'), 'aYardPower', `${L}: the gate itself is the alert now`);
    assert.ok(t('aGateOpen') !== 'aGateOpen' && t('hintGate') !== 'hintGate', `${L}: the gate opening says so`);
    setLang(was);
  }
  const esc = src('src/game/escape.js');
  assert.ok(!/taskBunker|world\.bunker|noteGateOn|aYardPower/.test(esc), 'the forest\'s escape knows nothing of a shelter');
});
