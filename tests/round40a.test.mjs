// 4.0 ULTRA (1/3) — the forest: «подлесок»; «лес с каждой ночью приходит в упадок»; «щупальца за картой».
// Everything here comes from the world's seed (a room sees the same forest on the same day, the same arms at the
// same moment), so it is checked in node: where things may grow, what holds you back, which layers stand on
// which day, and that an event's plan is the same on every machine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
const { Player } = await import('../src/game/player.js');
const { UG } = await import('../src/world/undergrowth.js');
const { DECAY, DECAY_LAYERS } = await import('../src/world/decay.js');
const { CAP } = await import('../src/world/caps.js');
const { TENT, tentaclePlan, armPhase, bearingVisible, Tentacles } = await import('../src/render/tentacles.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let _w = null;
const forest = () => (_w ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate());

// ---------------------------------------------------------------- the undergrowth
test('the undergrowth: four kinds, thousands of plants, the same from the same seed', () => {
  const w = forest(), u = w.undergrowth;
  assert.ok(u, 'the forest has undergrowth');
  assert.equal(u.items.length, u.count.reduce((s, n) => s + n, 0));
  for (const k of Object.values(UG)) assert.ok(u.count[k] > 500, `kind ${k}: ${u.count[k]}`);
  assert.ok(u.items.length > 6000, `${u.items.length} plants`);
  // the budget: it is drawn in ~40 m tiles, each only within 100 m of the eyes
  assert.ok(u.vertices < 1.2e6, `${u.vertices} vertices`);
  assert.ok(u.meshes.length > 50 && u.meshes.every((m) => m.userData.undergrowth && m.userData.centre));
  const w2 = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate();
  assert.equal(w2.undergrowth.items.length, u.items.length);
  assert.ok(w2.undergrowth.items.every((it, i) => it.x === u.items[i].x && it.z === u.items[i].z && it.type === u.items[i].type));
  // its own RNG (the trees stand where they stood before it existed), and it grows after them
  assert.match(src('src/world/undergrowth.js'), /new RNG\(\(w\.seed \^ 0x[0-9a-f]+\) >>> 0\)/);
  const ws = src('src/world/world.js');
  assert.ok(ws.indexOf('this.genTrees(rng)') < ws.indexOf('new Undergrowth(this).generate()'));
  // the bog has none (it has its own reeds)
  const bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate();
  assert.equal(bog.undergrowth ?? null, null);
  assert.equal(bog.decay ?? null, null);
});

test('the undergrowth keeps off the camp, the paths, the trunks and the yard', () => {
  const w = forest(), u = w.undergrowth;
  for (const it of u.items) {
    assert.ok(Math.hypot(it.x, it.z - 3) >= 13, `a plant in the camp at ${it.x.toFixed(1)},${it.z.toFixed(1)}`);
    assert.ok(!w.trails.near(it.x, it.z, it.r + 0.7), `a plant on a path at ${it.x.toFixed(1)},${it.z.toFixed(1)}`);
    assert.ok(!(Math.abs(it.x - 96) < 19 && it.z > 226), 'a plant in the yard or on the road out');
  }
  // nothing in it is a wall: it never files a collider, and the navigation never hears of it
  assert.doesNotMatch(src('src/world/undergrowth.js'), /col\.(circle|capsule|box)\(/);
});

test('probe(): thick in a bush, thinner in ferns, dry in brushwood, nothing on open ground', () => {
  const u = forest().undergrowth;
  const bush = u.items.find((i) => i.type === UG.BUSH), fern = u.items.find((i) => i.type === UG.FERN), dry = u.items.find((i) => i.type === UG.BRUSH);
  assert.ok(u.probe(bush.x, bush.z).k >= 0.999);
  assert.ok(u.probe(fern.x, fern.z).k >= 0.55);
  const p = u.probe(dry.x, dry.z);
  assert.ok(p.k >= 0.85);
  assert.equal(u.at(0, 3), 0, 'the camp is trodden flat');
  // it falls off toward the edge of a plant and is gone past it
  const r = bush.r;
  assert.ok(u.probe(bush.x + r * 0.7, bush.z).k < u.probe(bush.x + r * 0.2, bush.z).k + 1e-9);
  assert.equal(u.at(bush.x, bush.z), u.probe(bush.x, bush.z).k);
  // only brushwood is dry: a bush with none in reach is quiet green
  const lone = u.items.find((i) => i.type === UG.BUSH && !u.items.some((j) => j.type === UG.BRUSH && Math.hypot(j.x - i.x, j.z - i.z) < j.r));
  assert.equal(u.probe(lone.x, lone.z).dry, false);
});

function walkIn(k, dry, seconds = 3, crouch = false) {
  const w = forest(), u = w.undergrowth;
  const keep = u.probe;
  u.probe = () => ({ k, dry }); // (the same bush all the way)
  try {
    const p = new Player(w);
    p.reset(0);
    p.yaw = 4.7;
    const input = { move: { x: 0, y: 1 }, sprint: false, crouch, turn: 0 };
    let loud = 0, steps = 0, rustle = 0, v = 0;
    for (let i = 0; i < 60 * seconds; i++) {
      const ev = p.update(1 / 60, input, { dx: 0, dy: 0 });
      if (ev.step) {
        steps++;
        loud = Math.max(loud, ev.step.loud);
        if (ev.step.brush) rustle++;
      }
      v = Math.hypot(p.vx, p.vz);
    }
    return { loud, steps, rustle, v };
  } finally {
    u.probe = keep;
  }
}

test('wading through a bush is slower and louder (crouched, only a whisper of it); dry brushwood cracks', () => {
  const U = CFG.UNDERGROWTH;
  const open = walkIn(0, false), bush = walkIn(1, false), dry = walkIn(1, true);
  assert.ok(Math.abs(bush.v / open.v - (1 - U.slow)) < 0.03, `walking speed ${open.v.toFixed(2)} → ${bush.v.toFixed(2)} m/s`);
  assert.ok(open.steps > 2 && open.rustle === 0);
  assert.ok(bush.rustle > 0 && bush.rustle === bush.steps, 'every step through it rustles');
  assert.ok(Math.abs(bush.loud - open.loud - U.loud) < 1e-6, `a step: ${open.loud.toFixed(3)} → ${bush.loud.toFixed(3)}`);
  assert.ok(Math.abs(dry.loud - open.loud - U.loud - U.dry) < 1e-6, 'brushwood: the crack on top');
  const sneak = walkIn(0, false, 3, true), sneakDry = walkIn(1, true, 3, true);
  assert.ok(Math.abs(sneakDry.loud - sneak.loud - U.crouchLoud) < 1e-6, 'crouched: no crack, a whisper of a rustle');
});

// ---------------------------------------------------------------- the decay
test('the decay: five layers (days 2…6), each the same size, the same from the same seed', () => {
  const w = forest(), d = w.decay;
  assert.equal(DECAY_LAYERS, 5);
  assert.equal(d.layers.length, DECAY_LAYERS);
  for (const l of d.layers) {
    assert.equal(l.snags.length, DECAY.snags);
    assert.equal(l.effigies.length, DECAY.effigies);
    assert.equal(l.marks.length, DECAY.marks);
    assert.equal(l.caps.length, DECAY.snags + DECAY.effigies, 'a snag and a stick man are solid; paint is not');
    for (const p of [...l.snags, ...l.effigies]) {
      assert.ok(Math.hypot(p.x, p.z - 3) >= 16, 'nothing grows in the camp');
      assert.ok(!(Math.abs(p.x - 96) < 22 && p.z > 222), 'nor in the yard / on the road out');
    }
  }
  const w2 = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate();
  assert.deepEqual(w2.decay.layers.map((l) => l.snags), d.layers.map((l) => l.snags));
  assert.deepEqual(w2.decay.layers.map((l) => l.effigies), d.layers.map((l) => l.effigies));
  // each night's stick men are set out closer to the camp than the night before's
  const mean = (l) => l.effigies.reduce((s, e) => s + Math.hypot(e.x, e.z - 3), 0) / l.effigies.length;
  for (let i = 1; i < d.layers.length; i++) assert.ok(mean(d.layers[i]) < mean(d.layers[i - 1]), `layer ${i}: ${mean(d.layers[i]).toFixed(0)} m`);
  assert.ok(mean(d.layers[DECAY_LAYERS - 1]) < 60);
});

test('setDay(): day one is the forest as it was; each day after wakes one more layer — and its colliders', () => {
  const w = forest(), d = w.decay, caps = w.col.caps;
  const solid = (l) => l.caps.every((i) => caps[i].r > 0 && caps[i].h > 0);
  const parked = (l) => l.caps.every((i) => caps[i].r < 0);
  d.setDay(1);
  assert.deepEqual(d.counts(), { snags: 0, effigies: 0, marks: 0 });
  assert.ok(d.layers.every((l) => !l.mesh.visible && parked(l)));
  // a parked collider is found by nothing
  const s0 = d.layers[0].snags[0];
  assert.ok(w.col.free(s0.x, s0.z, 0.2), 'day 1: you walk through where the snag will stand');
  for (let day = 2; day <= 7; day++) {
    d.setDay(day);
    const on = Math.min(DECAY_LAYERS, day - 1);
    assert.deepEqual(d.counts(), { snags: on * DECAY.snags, effigies: on * DECAY.effigies, marks: on * DECAY.marks }, `day ${day}`);
    d.layers.forEach((l, i) => {
      assert.equal(l.mesh.visible, i < on);
      assert.ok(i < on ? solid(l) : parked(l), `day ${day}, layer ${i}`);
    });
  }
  assert.ok(!w.col.free(s0.x, s0.z, 0.2), 'and from day 2 it is a trunk you bump into');
  assert.equal(caps[d.layers[0].caps[0]].kind, CAP.TREE);
  assert.equal(caps[d.layers[0].caps[DECAY.snags]].kind, CAP.EFFIGY);
  // a new shift: back to day one (and the colliders with it)
  d.setDay(1);
  assert.ok(d.layers.every(parked));
  assert.ok(w.col.free(s0.x, s0.z, 0.2));
  // the game turns the page: a new shift, each morning, a debug jump into a later night
  const g = src('src/game/game.js');
  assert.match(g, /this\.world\.decay\?\.setDay\(1\)/);
  assert.match(g, /this\.world\.decay\?\.setDay\(day\)/);
});

// ---------------------------------------------------------------- the arms past the edge
test('tentaclePlan(): one seed, one event — the same on every machine', () => {
  for (const seed of [1, 7, 0x74656e74, 4294967295]) {
    const a = tentaclePlan(seed), b = tentaclePlan(seed);
    assert.deepEqual(a, b);
    assert.ok(a.arms.length >= 3 && a.arms.length <= 5, `${a.arms.length} arms`);
    assert.ok(a.az >= 0 && a.az < Math.PI * 2);
    for (const arm of a.arms) {
      assert.ok(arm.len >= 58 && arm.len <= 88 && arm.r0 > 4 && arm.dist > TENT.dist - 5);
      assert.ok(arm.side === 1 || arm.side === -1);
    }
    const end = Math.max(...a.arms.map((x) => x.delay + TENT.rise + x.writhe + TENT.fall + TENT.sink));
    assert.equal(a.end, end);
    assert.ok(a.end > 20 && a.end < 40, `${a.end.toFixed(1)} s`);
  }
  assert.notDeepEqual(tentaclePlan(2).arms, tentaclePlan(3).arms);
  assert.equal(tentaclePlan(0).seed, 0, '(seed 0 still plans: its RNG starts from 1)');
});

test('armPhase(): out of the ground, up there, over, back down — in that order', () => {
  const arm = tentaclePlan(99).arms[1];
  const seen = [];
  for (let t = 0; t < 60; t += 0.05) {
    const p = armPhase(arm, t);
    assert.ok(p.k >= 0 && p.k <= 1);
    if (seen[seen.length - 1] !== p.ph) seen.push(p.ph);
  }
  assert.deepEqual(seen, arm.delay > 0 ? ['wait', 'rise', 'writhe', 'fall', 'sink', 'gone'] : ['rise', 'writhe', 'fall', 'sink', 'gone']);
  assert.equal(armPhase(arm, arm.delay + TENT.rise / 2).k, 0.5);
});

test('Tentacles: each arm is heard rising and crashing, then the event is over by itself', () => {
  const scene = new THREE.Scene();
  const T = new Tentacles(scene);
  assert.equal(T.active, false);
  T.start(12345);
  assert.equal(T.active, true);
  const n = tentaclePlan(12345).arms.length, eye = new THREE.Vector3(0, 1.6, 0);
  const ev = [];
  for (let t = 0; t < 45 && T.active; t += 0.1) {
    T.update(0.1, eye, t);
    ev.push(...T.take());
  }
  assert.equal(T.active, false, 'it ends on its own');
  assert.equal(ev.filter((e) => e.type === 'rise').length, n);
  assert.equal(ev.filter((e) => e.type === 'impact').length, n);
  assert.ok(ev.findIndex((e) => e.type === 'impact') > ev.findIndex((e) => e.type === 'rise'));
  T.start(5);
  T.stop();
  assert.equal(T.active, false);
  T.dispose?.();
});

test('the arms: some nights, more often later in the shift; the host rolls, the room is told (tn)', () => {
  const T = CFG.TENTACLES, p = (day) => Math.min(T.maxChance, T.chance + T.perDay * (day - 1));
  assert.equal(p(1), 0.3);
  assert.ok(Math.abs(p(6) - 0.75) < 1e-9);
  assert.ok(p(9) === T.maxChance);
  assert.ok(T.minT >= 30 && T.maxT <= 360 && T.minT < T.maxT);
  // far off: the crash comes ~1.9 s after you see it
  assert.ok(TENT.far / 343 > 1.5 && TENT.far / 343 < 2.5);
  // bearingVisible: forward is (−sin yaw, −cos yaw)
  assert.equal(bearingVisible(Math.PI, 0), true);
  assert.equal(bearingVisible(0, 0), false);
  assert.equal(bearingVisible(Math.PI + 0.6, 0), true);
  assert.equal(bearingVisible(Math.PI + 0.9, 0), false);
  const g = src('src/game/game.js'), n = src('src/game/netsync.js');
  assert.match(g, /this\.sync\.ev\('tn', this\.tentSeed\)/);
  assert.match(n, /case 'tn':.*g\.startTentacles\(\+a >>> 0\)/);
});
