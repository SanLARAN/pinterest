// 3.0k: the four things that were wrong after the first night on the bog.
//
//   (a) «мостики не физичны» — a plank road was a surface test and a promise. Now the deck is ground you stand
//       on, its handrails are colliders, and the three spans of the bridges place cross a channel that is cut
//       into the island instead of lying on the peat.
//   (b) «добавь звуки хождения по воде» — wading had the generic footstep and a quiet splash. Now a step in
//       water has its own sound, told how deep the foot went.
//   (c) «TAB и инвентарь не работает» — both were the same bug: the bog's stand-ins for the forest's systems
//       were missing *fields* (`escape.mySeat`, `torch.charge`), so the wristwatch never came up and the pack
//       threw inside its own first render.
//   (d) «почему там старые мобы а не новые» — the bog's night still spawned the forest's listeners and
//       crawlers (and the Angler, the girl with the ears, the watcher and the howler). The bog now wakes only
//       its own: the Дrowned in the water and the Гнус in the air.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
const { Player } = await import('../src/game/player.js');
const { stepOf, WATER } = await import('../src/game/water.js');
const { CAP } = await import('../src/world/caps.js');

const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
const quietInput = () => ({
  move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0,
  peekHeld: false, peekTouchUntil: 0, uiMode: false, touch: false,
  consume: () => [], events: [], reset() {}, exitLock() {}, requestLock() {},
});
function mkGame(mapId, input = quietInput()) {
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
  return { game, world, input, scene };
}
const frame = (game, dt = 1 / 60) => game.update(dt, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });

test('(a) a plank road is ground: the deck answers with a height, and the foot stands on it', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate();
  const overWater = w.walks.filter((k) => {
    const mx = (k.ax + k.bx) / 2, mz = (k.az + k.bz) / 2;
    return w.water.depth(mx, mz) > 0.2;
  });
  assert.ok(overWater.length > 0, 'some roads run over water');
  for (const k of overWater.slice(0, 8)) {
    const mx = (k.ax + k.bx) / 2, mz = (k.az + k.bz) / 2;
    const deck = w.walkHeight(mx, mz);
    assert.ok(Number.isFinite(deck), 'the deck has a height here');
    assert.ok(deck > w.terrain.height(mx, mz) + 0.1, 'and it is above the peat under it');
  }
  // a player put down in the middle of a road over water stands on the planks, not in the water under them
  const k = overWater[0];
  const mx = (k.ax + k.bx) / 2, mz = (k.az + k.bz) / 2;
  const p = new Player(w);
  p.x = mx; p.z = mz; p.yaw = 0;
  p.y = w.terrain.height(mx, mz);
  const look = { dx: 0, dy: 0 };
  const still = { move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0 };
  for (let i = 0; i < 40; i++) p.update(1 / 60, still, look, false, null);
  assert.ok(Math.abs(p.y - w.walkHeight(mx, mz)) < 0.02, `feet on the deck: ${p.y.toFixed(2)} vs ${w.walkHeight(mx, mz).toFixed(2)}`);
  assert.ok(p.y > w.water.level, 'above the water line, dry');
});

test('(a) the handrails are real: you cannot walk off the edge of a bridge', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate();
  const k = w.walks.find((s) => Math.abs(s.az + 72) < 8 && w.water.depth((s.ax + s.bx) / 2, (s.az + s.bz) / 2) > 0.2);
  assert.ok(k, 'the causeway road over open water');
  const mx = (k.ax + k.bx) / 2, mz = (k.az + k.bz) / 2;
  // there are colliders along both edges (kind WOOD), and they are where the rail beams are drawn
  const ux = (k.bx - k.ax) / Math.hypot(k.bx - k.ax, k.bz - k.az), uz = (k.bz - k.az) / Math.hypot(k.bx - k.ax, k.bz - k.az);
  const px = -uz, pz = ux;
  let rails = 0;
  for (const c of w.col.caps) {
    if (c.r < 0 || c.kind !== CAP.WOOD) continue;
    const cx = (c.ax + c.bx) / 2, cz = (c.az + c.bz) / 2;
    const along = Math.abs((cx - mx) * ux + (cz - mz) * uz);
    const across = Math.abs((cx - mx) * px + (cz - mz) * pz);
    if (along < 3 && Math.abs(across - k.w / 2) < 0.3) rails++;
  }
  assert.ok(rails >= 2, `a collider under each handrail (${rails})`);
  // now try to walk through it: a player pressed sideways slides along the rail and stays on the deck
  const p = new Player(w);
  p.x = mx; p.z = mz; p.yaw = 0; p.y = w.walkHeight(mx, mz);
  const look = { dx: 0, dy: 0 };
  const across = (q) => (q.x - k.ax) * px + (q.z - k.az) * pz;
  for (let i = 0; i < 180; i++) p.update(1 / 60, { move: { x: 1, y: 0 }, crouch: false, sprint: false, turn: 0 }, look, false, null);
  assert.ok(Math.abs(across(p)) <= k.w / 2, `held inside the rails: ${Math.abs(across(p)).toFixed(2)} of ${(k.w / 2).toFixed(2)}`);
  assert.ok(w.onWalk(p.x, p.z, 0.1), 'and still on the planks');
});

test('(a) three spans in the bridges place, each over water and each crossable', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate();
  const spans = w.walks.filter((k) => {
    const mx = (k.ax + k.bx) / 2, mz = (k.az + k.bz) / 2;
    return Math.hypot(mx - 102, mz - 62) < 14 && Math.abs(k.ax - k.bx) < 0.01 && k.w > 2;
  });
  assert.equal(spans.length, 3, 'three bridges, parallel and across the channel');
  for (const s of spans) {
    const mx = (s.ax + s.bx) / 2, mz = (s.az + s.bz) / 2;
    assert.ok(w.water.depth(mx, mz) > 0.2, `water under the span at ${mx.toFixed(0)}: ${w.water.depth(mx, mz).toFixed(2)} m`);
    assert.ok(w.walkHeight(mx, mz) > w.water.level + 0.2, 'and the deck is a hand above it');
    // walk it end to end
    const p = new Player(w);
    p.x = s.ax; p.z = s.az; p.y = w.walkHeight(s.ax, s.az);
    const look = { dx: 0, dy: 0 };
    let wet = 0, off = 0;
    for (let i = 0; i < 60 * 20; i++) {
      p.yaw = Math.atan2(-(s.bx - p.x), -(s.bz - p.z));
      const ev = p.update(1 / 60, { move: { x: 0, y: 1 }, crouch: false, sprint: false, turn: 0 }, look, false, null);
      if (ev.step && ev.step.water) wet++;
      if (!w.onWalk(p.x, p.z, 0.15)) off++;
      if (Math.hypot(s.bx - p.x, s.bz - p.z) < 1.3) break;
    }
    assert.ok(Math.hypot(s.bx - p.x, s.bz - p.z) < 1.3, 'crossed to the far side');
    assert.equal(wet, 0, 'and never had a foot in the water');
    assert.equal(off, 0, 'and never left the deck');
  }
});

test('(b) a foot in water has its own sound, and the depth reaches it', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate();
  // a deep spot and a shallow one
  let deep = null, shallow = null;
  for (let i = 0; i < 400 && (!deep || !shallow); i++) {
    const a = (i / 400) * Math.PI * 2, d = 30 + (i % 60);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (w.onWalk(x, z, 0.2)) continue;
    const depth = w.water.depth(x, z);
    if (depth > 0.6 && !deep) deep = { x, z };
    if (depth > 0.1 && depth < 0.3 && !shallow) shallow = { x, z };
  }
  assert.ok(deep && shallow, 'both kinds of water are on the map');
  const s1 = stepOf(w, deep.x, deep.z, 0.085);
  const s2 = stepOf(w, shallow.x, shallow.z, 0.085);
  assert.equal(s1.water, true);
  assert.equal(s2.water, true);
  assert.ok(Math.abs(s1.depth - w.water.depth(deep.x, deep.z)) < 0.02, 'the step knows how deep it went');
  assert.ok(s1.depth > s2.depth, 'knee-deep is deeper than ankle-deep');
  assert.equal(s1.loud, Math.min(1, 0.1 * WATER.waterStepLoud));
  // the sound itself is a wading step, and it is pitched by the depth; the teammate one is too
  const audio = readFileSync(new URL('../src/audio/audio.js', import.meta.url), 'utf8');
  assert.match(audio, /wade\(intensity = 0\.5, depth = 0\.3, dest = null\)/);
  assert.match(audio, /const d = Math\.max\(0, Math\.min\(1\.2, depth\)\)/, 'the depth is read, not ignored');
  assert.match(audio, /mateStep\(x, y, z, intensity = 0\.4, waterDepth = 0(, [^)]*)?\)/); // (4.0: + the undergrowth it rustles through)
  assert.match(audio, /if \(waterDepth > 0\) this\.wade\(/, 'a friend wading sounds like a friend wading');
  const game = readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8');
  assert.match(game, /this\.audio\.wade\(s\.intensity, s\.depth \|\| 0\.3\)/);
  const remote = readFileSync(new URL('../src/game/remote.js', import.meta.url), 'utf8');
  assert.match(remote, /mateStep\([^)]*depth(, [^)]*)?\)/, 'the network step carries the water it is standing in');
});

test('(c) TAB lifts the wristwatch on the bog — the stand-ins answer with data, not undefined', () => {
  const { game, input } = mkGame('bog');
  // the two fields that were missing (3.0i fixed the *methods*; these are the values read out of them)
  assert.equal(game.escape.mySeat, -1, 'no seat in a car that is not on this map');
  assert.equal(game.torch.charge, 0, 'a torch you do not have holds no charge');
  assert.equal(game.torch.has, false);
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  for (let i = 0; i < 10; i++) frame(game);
  assert.equal(game.fieldView.watch, 0, 'down, until you look at it');
  input.peekHeld = true;
  for (let i = 0; i < 30; i++) frame(game);
  assert.ok(game.fieldView.watch > 0.8, `the watch is up: ${game.fieldView.watch.toFixed(2)}`);
  input.peekHeld = false;
  for (let i = 0; i < 40; i++) frame(game);
  assert.equal(game.fieldView.watch, 0, 'and down again when you let go');
});

test('(c) the backpack opens on the bog instead of throwing inside its first render', () => {
  const { game } = mkGame('bog');
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  for (let i = 0; i < 10; i++) frame(game);
  let ok = null;
  assert.doesNotThrow(() => { ok = game.inventory.open(); });
  assert.equal(ok, true, 'the pack opens');
  assert.equal(game.inventory.opened, true);
  assert.equal(game.inventory.active, true);
  assert.doesNotThrow(() => game.inventory.close(false));
  assert.equal(game.inventory.opened, false);
});

test('(d) the bog wakes its own: no listeners, no crawlers, no man with the lantern', () => {
  const { game } = mkGame('bog');
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  for (let i = 0; i < 60 * 120; i++) frame(game); // two minutes: the calm, the wake, the first midges
  const types = game.monsters.map((m) => m.type);
  for (const forest of ['listener', 'crawler', 'howler', 'watcher', 'angler']) {
    assert.ok(!types.includes(forest), `${forest} does not live on a peat bog`);
  }
  assert.equal(game.awake, true, 'the night woke (the calm is 45 s)');
  assert.ok(types.includes('drowned'), 'the one in the water does');
  assert.ok(game.drowned.bodyObj(), 'and the controller knows where it is');
  assert.ok(game.gnats.spawned >= 1, 'the midges came out when the night woke');
  assert.ok(!game.stray.present, 'and the girl with the ears is not out here');
  assert.equal(game.stray.rig, null, 'she never even built a body');
});

test('(d) the forest still has its own night: the listeners are its first two', () => {
  const { game } = mkGame('forest');
  game.setupSolo();
  game.reset({ days: 4 });
  game.startNight();
  for (let i = 0; i < 60 * 60; i++) frame(game); // past the 45 s calm
  assert.equal(game.awake, true);
  const listeners = game.monsters.filter((m) => m.type === 'listener').length;
  assert.ok(listeners >= 1, `the forest wakes its listeners (${listeners})`);
  assert.ok(!game.monsters.some((m) => m.type === 'drowned'), 'and no Дrowned in a forest');
});
