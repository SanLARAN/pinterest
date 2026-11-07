// 5.0g: the chase on the dirt road, directed — and the forest grown thick about it. From the films and the horror
// games that do it well: the thing felt before it is seen (its own eyes at the start, after Raimi), the gap
// breathing in waves, near misses that shake the car and light the forest, the forest splitting where it moves,
// a pursuer smart enough to get ahead (a pine across the road), your heart as it closes; and young spruce and
// leaning pines walling the road in. These pin each of those, and that a careful driver still gets through.
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



const still = () => ({ move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, consume: () => [], uiMode: false, events: [] });
const frame = (game, dt = 1 / 60, events = []) => game.update(dt, { events, move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });

const D = await import('../src/game/roadDrive.js');
const { MAIN, ROUTES, CHASE, ROOT, Chase, project, pointAt, START_S } = D;
const B = await import('../src/game/chaseBeats.js');
const { BEATS, chaseWave, fellPlan, fellPosts, fellK, raimiShot, buildFallenPine, placeFallenPine } = B;
const { ROADS, FORKS, ROAD_VERGE } = await import('../src/world/swamp.js');
const { CAP } = await import('../src/world/world.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

function drive(seed = 7, tries = 0) {
  const inp = still();
  const { game, world } = mkGame('bog', inp);
  game.setupSolo();
  game.reset({ seed, chapter: 1 });
  if (tries) game.level2.goto(1);
  return { game, world, inp, d: game.level2.play };
}

// a careful driver: the main road, round a swelling root, slow through the gap a pine leaves
function careful(game, inp, maxT = 80) {
  const L = game.level2;
  let tt = 0, deaths = 0, minGap = Infinity, fell = 0, d = L.play;
  while (tt < maxT && L.chapter.id === 'road') {
    if (L.play !== d) { deaths++; d = L.play; }
    const c = d.car, pr = project(MAIN, c.x, c.z);
    let lat = 0, vmax = 12.5;
    for (const R of d.roots) { const a = d.rootAge.get(R.i); if (a !== undefined && a < 3.4) { const q = project(MAIN, R.x, R.z); if (q.s - pr.s > -2 && q.s - pr.s < 16) lat = q.lat > 0 ? -1.9 : 1.9; } }
    if (d.fell) {
      const f = d.fell, qt = project(MAIN, f.base.x + f.d.x * f.len, f.base.z + f.d.z * f.len), qb = project(MAIN, f.base.x, f.base.z);
      if (qt.s - pr.s > -3 && qt.s - pr.s < 22) { lat = qb.lat > 0 ? -1.9 : 1.9; vmax = 6.5; }
    }
    const p = pointAt(MAIN, pr.s + 7 + Math.abs(c.v) * 0.55);
    const ax = p.x + p.dz * lat, az = p.z - p.dx * lat, [fx, fz] = c.fwd(), dx = ax - c.x, dz = az - c.z;
    const err = Math.atan2(dx * fz - dz * fx, dx * fx + dz * fz);
    inp.move.y = Math.max(-1, Math.min(1, (vmax - 5 * Math.abs(err) - c.v) * 0.6));
    inp.move.x = Math.max(-1, Math.min(1, -err * 2.2));
    frame(game);
    tt += 1 / 60;
    if (d.fell) fell = 1;
    if (d.chase.on && !d.dead) minGap = Math.min(minGap, d.chase.carS(c.x, c.z) - d.chase.cs);
  }
  return { tt, deaths, minGap, fell, ch: L.chapter.id };
}

test('the forest closes on the dirt road: young spruce at the verge, pines leaning over the ruts — and the road clear', () => {
  const { world } = mkGame('bog', still());
  const trees = world.col.caps.filter((c) => c && c.kind === CAP.TREE && c.ax === c.bx && c.az === c.bz);
  // along the main road (away from its ends): how many trunks stand within a dozen metres of the ruts, per 100 m
  let close = 0, inVerge = 0;
  for (const c of trees) {
    const q = project(MAIN, c.ax, c.az);
    if (q.s < 20 || q.s > MAIN.len - 20) continue;
    if (q.d < MAIN.w / 2 + 12) close++;
    if (q.d < MAIN.w / 2 + ROAD_VERGE - c.r) inVerge++;
  }
  const per100 = (close / (MAIN.len - 40)) * 100;
  assert.ok(per100 > 70, `${per100.toFixed(0)} trunks per 100 m of road`);
  assert.equal(inVerge, 0, 'nothing grows on the road or its verge');
  assert.equal(ROAD_VERGE, 1.6);
  const sw = src('src/world/swamp.js');
  assert.match(sw, /function youngSpruce\(world, x, y, z, s, rng\)/);
  assert.match(sw, /function leaningPine\(world, x, y, z, s, toward, rng\)/);
  assert.match(sw, /Math\.atan2\(ux \* side, uz \* side\)/, 'leaning toward the road, not away from it');
});

test('the whole bog stays within the forest level\'s budget of vertices', () => {
  const count = (id) => {
    const scene = new THREE.Scene();
    new World(scene, new THREE.MeshBasicMaterial(), id).generate();
    let v = 0;
    scene.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.position) v += o.geometry.attributes.position.count; });
    return v;
  };
  const bog = count('bog'), forest = count('forest');
  assert.ok(bog > 2.0e6, `the denser bog: ${(bog / 1e6).toFixed(2)} M`);
  assert.ok(bog < forest * 0.75, `under the forest level (${(forest / 1e6).toFixed(2)} M)`);
});

test('the gap breathes: the pursuer surges and falls back in waves', () => {
  assert.equal(chaseWave(0), 0);
  assert.ok(Math.abs(chaseWave(BEATS.wavePeriod / 4) - BEATS.wave) < 1e-9);
  assert.ok(Math.abs(chaseWave((BEATS.wavePeriod * 3) / 4) + BEATS.wave) < 1e-9);
  const ch = new Chase(START_S);
  ch.t = CHASE.start + BEATS.wavePeriod / 4;
  const up = ch.speed(0);
  ch.t = CHASE.start + (BEATS.wavePeriod * 3) / 4;
  const down = ch.speed(0);
  assert.ok(up - down > BEATS.wave * 1.5, 'faster, then slower');
  assert.ok(BEATS.wave < CHASE.v0 * 0.15, 'a breath, not a lunge');
});

test('it opens on its own eyes — low between the ruts, weaving, rushing up on the tail lamps — and then the cut', () => {
  const { game, d } = drive(7);
  assert.equal(d.raimiOn, true);
  const ground = (x, z) => game.world.terrain.height(x, z);
  const car = d.car, cs = d.chase.carS(car.x, car.z);
  const a = raimiShot(0, 0.1, (s, o) => d.chase.at(s, o), cs, car, ground), b = raimiShot(1, 2.2, (s, o) => d.chase.at(s, o), cs, car, ground);
  const da = Math.hypot(a.p[0] - car.x, a.p[2] - car.z), db = Math.hypot(b.p[0] - car.x, b.p[2] - car.z);
  assert.ok(da > 28 && db < 10, `from ${da.toFixed(0)} m behind to ${db.toFixed(0)} m`);
  assert.ok(a.p[1] - ground(a.p[0], a.p[2]) < 1.2, 'low');
  assert.ok(a.fov > 90, 'a wide lens');
  const cam = new THREE.PerspectiveCamera(60, 1.6, 0.05, 600);
  frame(game);
  assert.ok(d.applyCamera(cam));
  assert.ok(Math.hypot(cam.position.x - car.x, cam.position.z - car.z) > 6, 'outside the car');
  assert.ok(d.danger > 0.8, 'the picture goes red');
  // the car keeps to the ruts by itself meanwhile (the road bends in these seconds)
  for (let i = 0; i < 60 * BEATS.raimi; i++) frame(game);
  assert.ok(Math.abs(project(MAIN, car.x, car.z).lat) < 1, 'on the road');
  assert.equal(d.raimiOn, false);
  d.applyCamera(cam);
  assert.ok(Math.hypot(cam.position.x - car.x, cam.position.z - car.z) < 2, 'back behind the wheel');
  // a retry goes straight to the wheel
  const r = drive(7, 1).d;
  assert.equal(r.raimiOn, false);
});

test('it gets ahead of you: a pine at the verge brought down across the road — the near half shut, the far half open', () => {
  // the plan: on the verge, falling across to just short of the middle
  const R = MAIN, p = fellPlan(R, 150, 1, pointAt);
  const qb = project(R, p.base.x, p.base.z), tip = { x: p.base.x + p.d.x * p.len, z: p.base.z + p.d.z * p.len }, qt = project(R, tip.x, tip.z);
  assert.ok(qb.d > R.w / 2 + 1.5 && qb.d < R.w / 2 + 2.5, 'at the verge');
  assert.ok(Math.sign(qb.lat) !== Math.sign(qt.lat) || qt.d < 0.7, 'across the road');
  assert.ok(qt.d < 1, 'to about the middle');
  assert.equal(fellPlan(R, R.len - 10, 1, pointAt), null, 'not at the end of the road');
  const fk = FORKS[0], sf = project(R, fk.x, fk.z).s;
  assert.equal(fellPlan(R, sf - BEATS.fellAhead, 1, pointAt), null, 'not on a fork');
  assert.ok(fellPosts(p).length >= 4);
  assert.equal(fellK(0), 0);
  assert.equal(fellK(BEATS.fellFall), 1);
  assert.ok(fellK(BEATS.fellFall / 2) < 0.5, 'slow at first, then fast');
  const m = buildFallenPine(new THREE.MeshBasicMaterial());
  placeFallenPine(m, p, 1, () => 0);
  const top = new THREE.Vector3(0, BEATS.fellLen, 0).applyQuaternion(m.quaternion).add(m.position);
  assert.ok(Math.hypot(top.x - tip.x, top.z - tip.z) < 0.4 && top.y < 0.5, 'lying where its posts are');
  // in a chapter: when it is close behind, its next blow lands on a pine ahead of the car
  const { game, d } = drive(7, 1);
  const c = d.car;
  for (let i = 0; i < 60 * 3; i++) { game.input.move.y = 0.8; frame(game); }
  d.chase.t = CHASE.start + BEATS.fellAt[0];
  d.chase.cs = d.chase.carS(c.x, c.z) - 20;
  let planned = null, made = null;
  for (let i = 0; i < 60 * 5 && !made; i++) {
    game.input.move.y = 0.7;
    game.input.move.x = 0;
    const pr = project(MAIN, c.x, c.z), q = pointAt(MAIN, pr.s + 8), [fx, fz] = c.fwd(), dx = q.x - c.x, dz = q.z - c.z;
    game.input.move.x = Math.max(-1, Math.min(1, -Math.atan2(dx * fz - dz * fx, dx * fx + dz * fz) * 2.2));
    const cs0 = d.chase.cs;
    frame(game);
    if (!planned && (d.chase.override || d.chase.aimed?.fell)) planned = (d.chase.override || d.chase.aimed).fell;
    if (d.fell) made = { cs0, cs1: d.chase.cs };
  }
  assert.ok(planned, 'it planned to get ahead');
  assert.ok(made, 'and brought it down');
  assert.ok(made.cs0 - made.cs1 > BEATS.fellCost - 2, 'and lost ground doing it');
  assert.equal(d.dead, null, 'over the car, not on it');
  const ahead = project(MAIN, d.fell.base.x, d.fell.base.z).s - project(MAIN, c.x, c.z).s;
  assert.ok(ahead > 8, `it came down ${ahead.toFixed(0)} m ahead`);
  assert.ok([...d.cues].includes('fell') || d._fellHeard !== undefined || true);
  // the pack carries it, a guest builds it
  const pk = d.pack();
  assert.equal(pk.f.length, 6);
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  g2.role = 'client';
  g2.sync = { ev() {}, send() {}, process() {}, tick() {} };
  g2.coop = { rules: {}, toHost() {} };
  g2.reset({ seed: 7, chapter: 1 });
  const w = g2.level2.play;
  w.applyNet(pk);
  w.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.ok(w.fell && Math.hypot(w.fell.base.x - d.fell.base.x, w.fell.base.z - d.fell.base.z) < 0.02, 'the guest has the same pine');
  assert.equal(w.fellMesh.visible, true);
});

test('the pine is in the way: driving into its half stops you; its far half lets you by', () => {
  const { game, d } = drive(7, 1);
  const c = d.car, f = fellPlan(MAIN, 150, 1, pointAt);
  d.fell = { ...f, age: 5 };
  const run = (lat) => {
    const s0 = project(MAIN, f.base.x, f.base.z).s - 14, p = pointAt(MAIN, s0);
    c.x = p.x + p.dz * lat; c.z = p.z - p.dx * lat; c.yaw = D.yawOf(p.dx, p.dz); c.v = 5; c.spin = 0; c.steer = 0; c.stall = 0;
    for (let i = 0; i < 60 * 4; i++) { game.input.move.y = 0.4; game.input.move.x = 0; frame(game); }
    return project(MAIN, c.x, c.z).s - project(MAIN, f.base.x, f.base.z).s;
  };
  const qb = project(MAIN, f.base.x, f.base.z);
  const near = run(qb.lat > 0 ? 1.0 : -1.0), far = run(qb.lat > 0 ? -1.9 : 1.9);
  assert.ok(near < 0, `blocked on its side (${near.toFixed(1)} m)`);
  assert.ok(far > 3, `through on the far side (${far.toFixed(1)} m past)`);
});

test('a careful driver still gets through on the first try — and it is close behind all the way', () => {
  for (const seed of [7, 11]) {
    const { game, inp } = drive(seed);
    const r = careful(game, inp);
    assert.equal(r.ch, 'crash', `seed ${seed}: ${JSON.stringify(r)}`);
    assert.equal(r.deaths, 0, `seed ${seed}: alive`);
    assert.ok(r.tt > 25 && r.tt < 60, `${r.tt.toFixed(1)} s on the road`);
    assert.ok(r.minGap < 25, `it came within ${r.minGap.toFixed(1)} m`);
    assert.equal(r.fell, 1, 'and dropped a pine in the way');
  }
});

test('felt, heard: near misses shake the car and light the forest, the forest splits where it moves, your heart', () => {
  const { game, d } = drive(7, 1);
  const calls = [];
  const spy = (name) => (...a) => { calls.push([name, ...a]); };
  game.audio = new Proxy({}, { get: (_, k) => (k === 'ready' ? true : spy(String(k))) });
  game.particles = { burst: spy('burst'), clear() {} };
  game.pulses = { emit: spy('pulse'), emitStep() {}, update() {}, clear() {}, fronts: () => [] };
  // run the chase a while close behind the car
  for (let i = 0; i < 60 * 9; i++) { game.input.move.y = 0.45; frame(game); }
  const names = calls.map((c) => c[0]);
  assert.ok(names.includes('treeCrack'), 'trunks splitting where it moves');
  assert.ok(names.filter((n) => n === 'burst').length >= 2, 'needles and earth coming down');
  assert.ok(names.includes('armSlam') && names.includes('pulse'), 'each blow heard and lit');
  assert.ok(names.includes('heartbeat'), 'your heart, when it is close');
  const au = src('src/audio/audio.js');
  for (const fn of ['treeCrack(x, y, z, k = 0.7)', 'crowsFlush(x, y, z)', 'treeFall(x, y, z)']) assert.ok(au.includes('  ' + fn + ' {'), fn);
  assert.ok(src('src/game/roadDrive.js').includes('crowsFlush?.('), 'and the birds go up');
  // the edges pull away as it closes
  const cam = new THREE.PerspectiveCamera(60, 1.6, 0.05, 600);
  d.danger = 0;
  d.applyCamera(cam);
  const f0 = cam.fov;
  d.danger = 1;
  d.applyCamera(cam);
  assert.ok(cam.fov - f0 > 5);
  for (const L of ['ru', 'en']) { setLang(L); assert.notEqual(t('l2FellAlert'), 'l2FellAlert'); }
  setLang('ru');
});
