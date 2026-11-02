// 3.1p: «вещи утром не подбираются, и вообще много чего утром нельзя делать»; «удильщик тебя не похищает вообще —
// он сразу разворачивается»; «когда тебя убивает волчица, ты просто стоишь на месте, а не умираешь как должен».
// Each one on the real Game, frame by frame.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '', width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
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
const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');
const { chooseTree } = await import('../src/game/angler.js');
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });

let _world = null;
function mkGame() {
  const scene = new THREE.Scene();
  _world ||= new World(scene, new THREE.MeshBasicMaterial(), 'forest').generate();
  const IN = { move: { x: 0, y: 0 }, sprint: false, crouch: false, turn: 0, locked: true, touch: false, useHeld: false, peekHeld: false, peekTouchUntil: 0, uiMode: false };
  const input = new Proxy(IN, { get: (o, k) => (k in o ? o[k] : anyFn), set: (o, k, v) => { o[k] = v; return true; } });
  const g = new Game({
    scene, camera: new THREE.PerspectiveCamera(70, 1.6, 0.05, 400), world: _world,
    pulses: { emit() { return {}; }, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0, strength: 0 }; }, release() {}, refresh() {} }, eyes: { add() {}, clear() {} },
    particles: { burst() {}, clear() {}, update() {} },
    audio: anyFn, input, hud: anyFn, radar: anyFn, post: anyFn, shadows: anyFn,
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
  g.setupSolo();
  g.reset({ days: 4, seed: 7 });
  g.opening.cancel?.();
  g.IN = IN;
  return g;
}
const step = (g, events = []) => g.update(1 / 60, { events, move: g.IN.move, look: { dx: 0, dy: 0 } });
// stand a metre short of (x, z), facing it
function standBy(g, x, z, d = 1) {
  const p = g.player;
  const dx = p.x - x, dz = p.z - z, l = Math.hypot(dx, dz) || 1;
  p.x = x + (dx / l) * d; p.z = z + (dz / l) * d;
  p.y = g.world.terrain.height(p.x, p.z);
  p.yaw = Math.atan2(-(x - p.x), -(z - p.z));
  p.vx = p.vz = 0;
}
function morning() {
  const g = mkGame();
  g.startMorning(2);
  assert.equal(g.state, 'morning');
  step(g);
  return g;
}

// ---------------- the morning ----------------
test('by day a tool on the ground is picked up — E, the same as at night', () => {
  const g = morning();
  const it = g.tools.items.find((q) => q.kind === 'crowbar') || g.tools.items[0];
  assert.ok(it, 'a field tool lies somewhere');
  standBy(g, it.x, it.z, 1);
  g.player.y = it.y;
  step(g);
  assert.equal(g.objectives.target?.kind, 'fieldTool', `what is in front of you: ${g.objectives.target?.kind}`);
  step(g, ['useDown']);
  assert.equal(it.state, 'held', 'it is in your hands');
  assert.equal(it.owner, g.player.id);
});

test('by day a body is searched and its page put away with E; the generators wait for the night', () => {
  const g = morning();
  const body = g.objectives.bodies.find((b) => b.mesh.visible && !b.searched);
  assert.ok(body);
  standBy(g, body.x, body.z, 0.9);
  g.IN.useHeld = true;
  for (let i = 0; i < 60 * 6 && !body.searched; i++) step(g);
  g.IN.useHeld = false;
  assert.equal(body.searched, true, 'searched in daylight');
  assert.ok(g.objectives.note, 'the page is open');
  step(g, ['useDown']);
  assert.equal(g.objectives.note, null, 'E puts it away (by day too)');
  // a generator: still the night's work
  const gen = g.objectives.gens.find((q) => !q.running);
  standBy(g, gen.x, gen.z, 1.2);
  for (let i = 0; i < 5; i++) step(g);
  assert.notEqual(g.objectives.target?.kind, 'gen', 'the generators are fixed at night');
});

test('by day the kit works: a stone thrown lands, the flare gun and the tape say they are for the night', () => {
  const g = morning();
  const p = g.player;
  g.inventory.equipped = 'stones';
  g.inventory.equipT = 0;
  const before = p.stones;
  step(g, ['primary']);
  assert.equal(p.stones, before - 1, 'a stone left your hand');
  assert.equal(g.stones.list.length, 1, 'it is in the air');
  for (let i = 0; i < 60 * 4; i++) step(g);
  assert.equal(g.stones.list.length, 0, 'and came down (the stones are stepped in the morning now)');
  const pops = [];
  g.hud = new Proxy({}, { get: (o, k) => (k === 'popup' ? (txt) => pops.push(txt) : () => {}) });
  g.fireFlare();
  assert.equal(pops.length, 1, 'the flare gun says why it will not fire, rather than nothing');
  const src = (f) => import('node:fs').then((fs) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
  return src('src/game/tools.js').then((s) => assert.match(s, /if \(this\.g\.state === 'morning'\) \{ this\.g\.hud\.popup\(t\('tapeDay'\), 'dim'\); return; \}/));
});

// ---------------- the Angler ----------------
test('his tree: half a metre off the bark is room enough for a body — the trunk itself is not "in the way"', () => {
  const w = mkGame().world, a = CFG.ANGLER;
  let found = 0;
  for (const [x, z] of [[0.4, 2.5], [60, -40], [-100, 80], [140, 150]]) {
    const tree = chooseTree(w.col.caps, x, z, () => 0.37, a, (tx, tz) => w.inYard(tx, tz, 1) || !w.col.free(tx, tz, CFG.PLAYER.radius));
    if (tree) found++;
  }
  assert.equal(found, 4, 'a tree in reach from anywhere');
  // the old ask (0.8 m) failed on every tree: the bark is 0.5 m from the spot
  const strict = chooseTree(w.col.caps, 0.4, 2.5, () => 0.37, a, (tx, tz) => !w.col.free(tx, tz, 0.8));
  assert.equal(strict, null, '(why he always walked off)');
});

test('night three, alone: he comes, takes you, hauls you to a tree and ties you there', () => {
  const g = mkGame();
  g.state = 'play'; g.day = 3; g.time = 120; g.awake = true; g.firstPingT = 1;
  g.angler.coolT = 0;
  const seen = new Set();
  let ended = null;
  g.onEnd = (r) => { ended = r; };
  for (let i = 0; i < 60 * 70 && !ended; i++) {
    step(g);
    if (g.angler.cap) seen.add(g.angler.cap.phase);
    if (g.angler.cap?.phase === 'bound') break;
  }
  assert.ok(seen.has('drag'), 'his hand closed and he hauls you');
  assert.ok(seen.has('bound'), `tied at the tree (${[...seen].join(' → ')})`);
  const tree = g.angler.cap.tree;
  assert.ok(Math.hypot(g.player.x - tree.ax, g.player.z - tree.az) < 1.5, 'you sit against that trunk');
});

// ---------------- the Stray ----------------
test('alone, her hand is the end: the kill plays and the night is over', () => {
  const g = mkGame();
  g.state = 'play'; g.day = 4; g.time = 200; g.awake = true; g.firstPingT = 1;
  let ended = null;
  g.onEnd = (r) => { ended = r; };
  const st = g.stray, p = g.player;
  st.ensureRig();
  st.x = p.x + 1; st.z = p.z; st.y = p.y;
  st._setPhase('chase');
  st._grab(p);
  let dyingAt = -1;
  for (let i = 0; i < 60 * 5 && !ended; i++) {
    step(g);
    if (dyingAt < 0 && g.state === 'dying') dyingAt = i / 60;
  }
  assert.ok(dyingAt > 1.2 && dyingAt < 1.7, `1.4 s in her hands, then the kill (${dyingAt.toFixed(2)} s)`);
  assert.deepEqual(ended, { won: false, cause: 'stray' });
});
