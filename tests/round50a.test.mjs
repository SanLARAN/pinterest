// 5.0a: «Топь», rebuilt from nothing. The old peat bog (pumps, the winch, the Drowned, the midges, the shelter) is
// gone; the second level is one night told in seven chapters (docs/LEVEL2.md). This round is the skeleton: the
// new ground (world/swamp.js) and the chapter machine (game/level2.js). These pin the place — the highway, the
// dirt road and its forks, the village, the bog, the cliff, the lake — and that a whole Game walks every chapter,
// in solo and with the host leading a guest.
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

const { HIGHWAY, ROADS, FORKS, CRASH, HOUSES, GATE, GENERATOR, BIKES, CAUSEWAY, CLIFF, LAKE, rot } = await import('../src/world/swamp.js');
const { CHAPTERS, chapterStart, houseFor, faceYaw } = await import('../src/game/level2.js');
const { swimming } = await import('../src/game/water.js');
const { PROTOCOL } = await import('../src/net/net.js');
const { t, setLang } = await import('../src/core/i18n.js');

const frame = (game, dt = 1 / 60, events = []) => game.update(dt, { events, move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
// a still pair of hands on the keyboard (a Proxy would hand the walker NaN)
const still = () => ({ move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, consume: () => [], uiMode: false, events: [] });
const put = (game, x, z) => { const p = game.player; p.x = x; p.z = z; p.vx = p.vz = 0; };

// ---------------------------------------------------------------- the place

let swamp = null;
const swampWorld = () => swamp || (swamp = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

test('«Топь» is a new ground: 760 m across, the old bog\'s places and modules are gone', () => {
  const w = swampWorld();
  assert.equal(w.mapId, 'bog', 'the id stays: the menu, the URL and the unlock know it');
  assert.equal(w.half, 380);
  assert.equal(w.wall, 366);
  for (const f of ['src/world/bog.js', 'src/world/bunker.js', 'src/game/bunker.js', 'src/game/winch.js', 'src/game/drowned.js', 'src/game/gnat.js']) {
    assert.equal(existsSync(new URL('../' + f, import.meta.url)), false, `${f} is gone`);
  }
  assert.deepEqual(w.landmarks.map((L) => L.id), ['highway', 'crash', 'gate', 'cliff', 'pier']);
  assert.ok(w.genTime < 8000, `it builds in reasonable time (${Math.round(w.genTime)} ms)`);
});

test('the highway runs the whole south edge, level and dry, with the turn-off in its guard rail', () => {
  const w = swampWorld();
  for (let x = -340; x <= 340; x += 20) {
    const h = w.terrain.height(x, HIGHWAY.z);
    assert.ok(Math.abs(h - HIGHWAY.y) < 0.2, `the embankment is level at x=${x}: ${h.toFixed(2)}`);
    assert.equal(w.water.depth(x, HIGHWAY.z), 0);
  }
  assert.ok(Math.abs(HIGHWAY.block - HIGHWAY.turn) > 30, 'the tentacle lies past the turn-off, not on it');
});

test('the dirt road leaves the highway and forks three times; two of three branches go nowhere', () => {
  const w = swampWorld();
  const main = ROADS.find((r) => r.id === 'main');
  assert.ok(Math.abs(main.pts[0][0] - HIGHWAY.turn) < 1 && Math.abs(main.pts[0][1] - HIGHWAY.z) < 12, 'it starts at the turn-off');
  const end = main.pts[main.pts.length - 1];
  assert.ok(Math.hypot(end[0] - CRASH.x, end[1] - CRASH.z) < 12, 'and ends at the pine');
  assert.equal(FORKS.length, 3);
  for (const F of FORKS) {
    const ids = [F.left, F.right];
    assert.ok(ids.includes('main'), `${F.id}: one way is the way`);
    const other = ROADS.find((r) => r.id === ids.find((i) => i !== 'main'));
    assert.ok(other.dead, `${F.id}: the other is a dead end`);
    assert.deepEqual(other.pts[0], [F.x, F.z], `${F.id}: the branch leaves at the fork`);
    assert.ok(main.pts.some(([x, z]) => x === F.x && z === F.z), `${F.id}: on the main road`);
  }
  // the roads are dry and passable: no water and no tree on any metre of them
  for (const R of ROADS) {
    for (let i = 0; i + 1 < R.pts.length; i++) {
      const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1];
      for (let t = 0.1; t < 0.95; t += 0.1) {
        const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        assert.ok(w.water.depth(x, z) < 0.06, `${R.id} is dry at ${x.toFixed(0)},${z.toFixed(0)}`);
        assert.ok(w.col.free(x, z, 1.0), `${R.id} is clear at ${x.toFixed(0)},${z.toFixed(0)}`);
      }
    }
  }
});

test('the village: sixteen houses and huts, each with a post inside, a door that swings and walls that stop you', () => {
  const w = swampWorld();
  assert.equal(HOUSES.length, 16);
  assert.equal(w.houses.length, 17, 'the sixteen and the old man\'s hut by the pier');
  for (const H of w.houses) {
    assert.equal(w.water.depth(H.x, H.z), 0, `${H.id} stands on dry ground`);
    assert.ok(w.doors.some((d) => d.id === H.id), `${H.id} has a door`);
    assert.ok(!w.col.free(H.post.x, H.post.z, 0.1), `${H.id}: the post is a thing`);
    // the back wall is solid: walking straight out through it is not a way out
    const [bx, bz] = rot(0, -H.D / 2, H.ry);
    assert.ok(!w.col.free(H.x + bx, H.z + bz, 0.3), `${H.id}: the back wall stops you`);
  }
  // they are far apart: a whole map to cross between two of them
  let far = 0;
  for (const a of HOUSES) for (const b of HOUSES) far = Math.max(far, Math.hypot(a.x - b.x, a.z - b.z));
  assert.ok(far > 300, `the village spreads over ${far.toFixed(0)} m`);
});

test('the bog: the causeway over water to the cliff, the cliff a sheer drop, the lake deep enough to swim', () => {
  const w = swampWorld();
  const walk = w.walks.filter((k) => k.id === 'causeway');
  assert.equal(walk.length, CAUSEWAY.pts.length - 1);
  let overWater = 0;
  for (const k of walk) {
    const mx = (k.ax + k.bx) / 2, mz = (k.az + k.bz) / 2;
    if (w.water.depth(mx, mz) > 0.3) overWater++;
    assert.ok(w.walkHeight(mx, mz) > w.water.level, 'the deck stands over the water');
  }
  assert.ok(overWater >= 3, 'most of it crosses open water');
  assert.ok(w.terrain.height(CLIFF.x, CLIFF.z) > 9, 'the cliff top is nine metres up');
  // from its top toward the lake: down by more than ten metres inside fifteen
  const dx = LAKE.x - CLIFF.x, dz = LAKE.z - CLIFF.z, L = Math.hypot(dx, dz);
  let drop = 0;
  for (let d = 0; d < 26; d += 1) {
    const h0 = w.terrain.height(CLIFF.x + (dx / L) * d, CLIFF.z + (dz / L) * d);
    const h1 = w.terrain.height(CLIFF.x + (dx / L) * (d + 6), CLIFF.z + (dz / L) * (d + 6));
    drop = Math.max(drop, h0 - h1);
  }
  assert.ok(drop > 7, `the edge is an edge: ${drop.toFixed(1)} m down in six`);
  assert.ok(swimming(w, LAKE.x, LAKE.z), 'the lake swims');
  assert.ok(w.water.depth(LAKE.x, LAKE.z) > 2.5);
  const pier = w.walks.find((k) => k.id === 'pier');
  assert.ok(pier, 'the pier is a deck');
  assert.ok(w.water.depth(pier.bx, pier.bz) > 1, 'and it runs out over deep water');
  assert.ok(w.waterTris > 15000, `2 m water cells for the swell (${w.waterTris})`);
});

test('the gate and the generator at the mouth of the bog; the lamps down the causeway', () => {
  const w = swampWorld();
  assert.ok(w.water.depth(GATE.x - 6, GATE.z) === 0, 'dry at the gate');
  assert.ok(Math.hypot(GENERATOR.x - GATE.x, GENERATOR.z - GATE.z) < 16);
  assert.ok(!w.col.free(GENERATOR.x, GENERATOR.z, 0.3), 'the generator is a thing');
  assert.ok(w.swamp.lamps.length >= 4, `lamps on the causeway (${w.swamp.lamps.length})`);
  assert.equal(BIKES.length, 4, 'a Kugoo for each seat');
});

// ---------------------------------------------------------------- the chapters

test('seven chapters, each with a start on the map that is free to stand on', () => {
  const w = swampWorld();
  assert.deepEqual(CHAPTERS.map((c) => c.id), ['convoy', 'road', 'crash', 'village', 'generator', 'escape', 'cliff']);
  assert.deepEqual(CHAPTERS.filter((c) => c.film).map((c) => c.id), ['convoy', 'crash']);
  for (const C of CHAPTERS) {
    for (let slot = 0; slot < 4; slot++) {
      const s = chapterStart(C.id, w, slot, 12345);
      assert.ok(Number.isFinite(s.x) && Number.isFinite(s.z) && Number.isFinite(s.yaw), `${C.id}/${slot}`);
      assert.ok(Math.abs(s.x) < w.wall && Math.abs(s.z) < w.wall, `${C.id}/${slot} inside the wall`);
      if (C.id !== 'escape' && C.id !== 'cliff') assert.ok(w.col.free(s.x, s.z, 0.3), `${C.id}/${slot}: free to stand on`);
    }
  }
  // the village wakes each seat in a different house, and which ones changes with the night
  const seats = [0, 1, 2, 3].map((s) => houseFor(777, s).id);
  assert.equal(new Set(seats).size, 4, 'four seats, four houses');
  assert.notDeepEqual(seats, [0, 1, 2, 3].map((s) => houseFor(778, s).id));
  // (5.0b) in the convoy film everyone is in the car: their bodies wait where the film leaves them, on the dirt road
  assert.deepEqual(chapterStart('convoy', w, 2), chapterStart('road', w, 2));
  const c = chapterStart('road', w, 0);
  assert.ok(Math.abs(c.yaw - faceYaw(ROADS[0].pts[0][0], ROADS[0].pts[0][1], ROADS[0].pts[1][0], ROADS[0].pts[1][1])) < 0.2, 'the road chapter looks up the dirt road');
});

test('a whole «Топь» Game: it starts in chapter 1 and walks every chapter to the end of the level', () => {
  const { game, world } = mkGame('bog', still());
  assert.ok(game.level2, 'the chapter machine is there');
  assert.equal(game.objectives.inert, true, 'no generator chain on the Mire');
  assert.ok(game.escape.inert && game.expedition.inert && game.partMap.inert, 'nor the forest\'s yard, tower or parts map');
  let ended = null;
  game.onEnd = (r) => { ended = r; };
  game.setupSolo();
  game.reset({ seed: 4242 });
  assert.equal(game.state, 'level2');
  assert.equal(game.level2.chapter.id, 'convoy');
  game.startNight(); // (a debug ?night does nothing here)
  assert.equal(game.state, 'level2');
  for (let i = 0; i < 30; i++) frame(game);
  // 1 → 2: a film (5.0b: the real one), and Enter goes on — after a short fade
  frame(game, 1 / 60, ['confirm']);
  assert.equal(game.level2.chapter.id, 'convoy', 'not on the same frame: the picture goes first');
  for (let i = 0; i < 70; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'road');
  // (5.0c) chapter 2 is driven: you are in the car on the dirt road, and the end of the road ends it
  const car = game.level2.play.car;
  assert.ok(Math.hypot(car.x - 2.7, car.z - 266.4) < 12, 'the car on the dirt road where the film left it (rolling on)');
  assert.ok(Math.hypot(game.player.x - car.x, game.player.z - car.z) < 1.5, 'and you in it');
  for (let i = 0; i < 30; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'road', 'nothing ends a chapter early');
  car.x = CRASH.x + 20; car.z = CRASH.z + 22;
  frame(game);
  assert.equal(game.level2.chapter.id, 'crash');
  // 3 → 4: the film (5.0d: «Удар») runs its length and goes on by itself
  for (let i = 0; i < 60 * 20 && game.level2.chapter.id === 'crash'; i++) frame(game, 1 / 60);
  assert.equal(game.level2.chapter.id, 'village');
  const H = world.houses.find((h) => h.id === houseFor(game.baseSeed, 0).id);
  assert.ok(Math.hypot(game.player.x - H.x, game.player.z - H.z) < 4, 'you come to inside your house');
  // 4 → 5 → 6: (5.0d) free of the rope and out of the house ends the village; the generator wants your hand on it
  game.level2.play.mine.st = 'free';
  game.level2.play.K.x += 400;
  put(game, H.x + 12, H.z + 12);
  for (let i = 0; i < 60 * 3; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'generator');
  put(game, GENERATOR.x + 1.6, GENERATOR.z + 1.2);
  for (let i = 0; i < 10; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'generator', 'standing next to it is not starting it');
  frame(game, 1 / 60, ['useDown']);
  assert.equal(game.level2.chapter.id, 'escape');
  // 6 → 7: the far end of the causeway
  const e = CAUSEWAY.pts[CAUSEWAY.pts.length - 1];
  put(game, e[0] + 2, e[1] + 2);
  frame(game);
  assert.equal(game.level2.chapter.id, 'cliff');
  // 7: into the lake, the picture goes, the level is won
  put(game, LAKE.x, LAKE.z);
  frame(game);
  assert.ok(game.level2.tail >= 0, 'the lake took you');
  assert.equal(ended, null, 'not at once: the picture goes first');
  for (let i = 0; i < 60 * 5; i++) frame(game);
  assert.equal(game.state, 'won');
  assert.deepEqual(ended, { won: true, level2: true, coop: false, alive: true });
});

test('?chapter=N starts there, and a debug jump never lands in a missing place', () => {
  const { game } = mkGame('bog', still());
  game.setupSolo();
  for (let i = 0; i < CHAPTERS.length; i++) {
    game.reset({ seed: 99, chapter: i });
    assert.equal(game.level2.i, i);
    for (let k = 0; k < 20; k++) frame(game);
    assert.equal(game.state, 'level2', `${CHAPTERS[i].id} runs frames`);
  }
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /chapter: parseInt\(params\.get\('chapter'\), 10\) \|\| 0/);
  assert.match(main, /chapter: DEBUG\.chapter \? DEBUG\.chapter - 1 : undefined/);
  assert.doesNotMatch(main, /DEBUG\.shelter/, 'the old ?shelter jump went with the shelter');
});

test('co-op: the host announces each chapter, a guest follows and never ends one by itself', () => {
  const { game } = mkGame('bog', still());
  const sent = [];
  game.setupSolo();
  game.role = 'host';
  game.coop = { rules: {}, toHost() {} };
  game.sync = { ev: (...a) => sent.push(a) };
  game.reset({ seed: 5 });
  assert.deepEqual(sent.at(-1), ['l2', 0]);
  game.level2.next();
  assert.deepEqual(sent.at(-1), ['l2', 1]);
  // a guest: standing on the goal does nothing until the host says so
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  g2.role = 'client';
  g2.sync = { ev() { throw new Error('a guest does not announce'); } };
  g2.coop = { rules: {}, toHost() {} };
  g2.reset({ seed: 5, chapter: 1 });
  g2.level2.play.car.x = CRASH.x + 6; g2.level2.play.car.z = CRASH.z + 6;
  g2.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.equal(g2.level2.chapter.id, 'road', 'the guest waits for the host');
  g2.level2.goto(2, true);
  assert.equal(g2.level2.chapter.id, 'crash');
  const net = readFileSync(new URL('../src/game/netsync.js', import.meta.url), 'utf8');
  assert.match(net, /case 'l2': if \(g\.level2 && g\.state === 'level2'/);
  assert.ok(PROTOCOL >= 23, 'the wire changed, so the protocol did');
});

test('the words: every chapter has a name, a subtitle and a goal in both languages; the old bog\'s are gone', () => {
  for (const L of ['ru', 'en']) {
    setLang(L);
    for (const C of CHAPTERS) {
      for (const k of ['l2_' + C.id, 'l2_' + C.id + 'S', 'l2Goal_' + C.id]) assert.notEqual(t(k), k, `${L}.${k}`);
    }
    for (const k of ['l2Ch', 'l2Chapters', 'l2WinTitle', 'l2WinKicker']) assert.notEqual(t(k), k, `${L}.${k}`);
    for (const k of ['notesBog', 'winchTurn', 'aPumpOn', 'taskBunker', 'aDrowned', 'aGnats', 'escTitleBog']) assert.equal(t(k), k, `${L}.${k} is gone`);
    assert.doesNotMatch(t('mapBogHint'), /насос|лебёд|pump|winch/i);
  }
  setLang('ru');
  assert.equal(t('mapBog'), 'ТОПЬ');
});
