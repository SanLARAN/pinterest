// 5.0c: «Грунтовка» — chapter 2 of «Топь» is driven. The host's car on the dirt road, the arm coming after it
// along the very track it drove, the Корень swelling out of the road ahead, three forks and the navigator's map.
// These pin the car's handling, the plan of the roots, the chase's rules, the balance (a driver who dodges gets
// through; a timid one is caught and the chapter starts again), the wire (the guest draws the host's car), who
// sits where and who may open the map — and that leaving the chapter takes everything with it.
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

const frame = (game, dt = 1 / 60, events = []) => game.update(dt, { events, move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
// a still pair of hands on the keyboard (a Proxy would hand the walker NaN)
const still = () => ({ move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, consume: () => [], uiMode: false, events: [] });
const put = (game, x, z) => { const p = game.player; p.x = x; p.z = z; p.vx = p.vz = 0; };

const D = await import('../src/game/roadDrive.js');
const { Car, Chase, DRIVE, CHASE, ROOT, MAIN, ROUTES, START_S, GOAL_D, pointAt, project, yawOf, rootPlan, chasePhase, drawMap } = D;
const { FORKS, CRASH, onRoad } = await import('../src/world/swamp.js');
const { shared } = await import('../src/render/sonar.js');
const { PROTOCOL } = await import('../src/net/net.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// a driver: follows the main road a few metres ahead, slows for the bends, and (unless told not to) steers to the
// other side of the road from a root that is swelling
function bot(game, drive, { vmax = 13, thrMax = 1, dodge = true } = {}) {
  const c = drive.car, [fx, fz] = c.fwd(), lx = fz, lz = -fx;
  const pr = project(MAIN, c.x, c.z);
  let lat = 0;
  for (const R of drive.roots) {
    const a = drive.rootAge.get(R.i);
    if (R.route !== 'main' || a === undefined || a > ROOT.swell + ROOT.up + ROOT.stand) continue;
    if (!dodge && a < ROOT.swell) continue;
    if (R.s > pr.s - 3 && R.s < pr.s + 40) lat = -Math.sign(R.lat) * 1.5;
  }
  // (5.0g) a pine down across the road ahead: slow, and through on the far half
  if (drive.fell) {
    const f = drive.fell, qt = project(MAIN, f.base.x + f.d.x * f.len, f.base.z + f.d.z * f.len), qb = project(MAIN, f.base.x, f.base.z);
    if (qt.s - pr.s > -3 && qt.s - pr.s < 22) { lat = qb.lat > 0 ? -1.9 : 1.9; vmax = Math.min(vmax, 6.5); }
  }
  const p = pointAt(MAIN, pr.s + 7 + Math.abs(c.v) * 0.55);
  const tx = p.x + p.dz * lat, tz = p.z - p.dx * lat;
  const dx = tx - c.x, dz = tz - c.z;
  const ang = Math.atan2(dx * lx + dz * lz, dx * fx + dz * fz);
  const a = pointAt(MAIN, pr.s), b = pointAt(MAIN, pr.s + 22);
  const turn = Math.abs(Math.atan2(a.dx * b.dz - a.dz * b.dx, a.dx * b.dx + a.dz * b.dz));
  game.input.move.x = -Math.max(-1, Math.min(1, ang * 2.6));
  game.input.move.y = Math.max(-1, Math.min(thrMax, (vmax - 5 * turn - c.v) * 0.6));
}

// drive chapter 2 from its start for up to `secs`: what happened
function run(seed, secs, opts) {
  const input = still();
  const { game } = mkGame('bog', input);
  game.setupSolo();
  game.reset({ seed, chapter: 1 });
  const L = game.level2, dt = 1 / 30;
  let tt = 0, deaths = 0, minGap = Infinity;
  while (tt < secs && L.chapter.id === 'road') {
    if (L.play?.car) bot(game, L.play, opts);
    game.update(dt, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
    tt += dt;
    const d = L.play;
    if (!d) continue;
    if (d.dead && !d._counted) { d._counted = true; deaths++; }
    if (d.chase.on && !d.dead) minGap = Math.min(minGap, d.chase.carS(d.car.x, d.car.z) - d.chase.cs);
  }
  return { game, L, tt, deaths, minGap };
}

let world1 = null;
const swampWorld = () => world1 || (world1 = mkGame('bog').world);

test('the car: quick on the road, slow off it, brakes, reverses, and turns no tighter than its tyres hold', () => {
  const c = new Car(0, 0, 0, 0);
  c.onRoad = true;
  let tt = 0;
  while (c.v < 9 && tt < 20) { c.step(1 / 120, 1, 0); tt += 1 / 120; }
  assert.ok(tt > 1.2 && tt < 3.5, `0 → 9 m/s in ${tt.toFixed(1)} s`);
  for (let i = 0; i < 120 * 20; i++) c.step(1 / 120, 1, 0);
  assert.ok(c.v > DRIVE.vmax - 1 && c.v <= DRIVE.vmax + 0.01, `top speed on the road ${c.v.toFixed(1)}`);
  c.onRoad = false;
  for (let i = 0; i < 120 * 12; i++) c.step(1 / 120, 1, 0);
  assert.ok(Math.abs(c.v - DRIVE.vmaxOff) < 1, `off the road it settles near ${DRIVE.vmaxOff} (${c.v.toFixed(1)})`);
  // a hard stop (9.5 m/s²)
  c.onRoad = true;
  c.v = 13;
  let stop = 0, x0 = c.x;
  while (c.v > 0 && stop < 5) { c.step(1 / 120, -1, 0); stop += 1 / 120; }
  assert.ok(stop < 1.7, `13 m/s to a standstill in ${stop.toFixed(2)} s`);
  assert.ok(Math.abs(c.x - x0) < 13, 'within a dozen metres');
  for (let i = 0; i < 120 * 4; i++) c.step(1 / 120, -1, 0);
  assert.ok(c.v < -3.5 && c.v > -DRIVE.vrev - 0.01, `and backwards at ${c.v.toFixed(1)}`);
  // half the pedal is half the speed
  const h = new Car(0, 0, 0, 0);
  h.onRoad = true;
  for (let i = 0; i < 120 * 12; i++) h.step(1 / 120, 0.5, 0);
  assert.ok(Math.abs(h.v - DRIVE.vmax / 2) < 0.6, `half the pedal: ${h.v.toFixed(1)} m/s`);
  // let go and it rolls to a stop — never turning round
  c.v = 3;
  for (let i = 0; i < 120 * 10; i++) c.step(1 / 120, 0, 0);
  assert.equal(c.v, 0);
  // the turn: left is +, and at speed no tighter than the grip
  const k = new Car(0, 0, 0, 12.5);
  k.onRoad = true;
  const y0 = k.yaw;
  for (let i = 0; i < 120; i++) k.step(1 / 120, 1, 1);
  const rate = (k.yaw - y0) / 1;
  assert.ok(rate > 0, 'A turns left (yaw up)');
  assert.ok(rate <= DRIVE.grip / 11.5 + 0.03, `held by the grip (${rate.toFixed(2)} rad/s)`);
  // the nose is local −x, so yawOf points it along a direction
  const d = new Car(0, 0, yawOf(0, 1), 0);
  const [fx, fz] = d.fwd();
  assert.ok(Math.abs(fx) < 1e-9 && Math.abs(fz - 1) < 1e-9);
});

test('the car meets the trees: it stops against them, and a post in the road is a post', () => {
  const w = swampWorld();
  // straight off the road into the forest, at speed
  const p = pointAt(MAIN, 150);
  const c = new Car(p.x, p.z, yawOf(p.dz, -p.dx), 12); // facing across the road, to its left
  c.onRoad = true;
  let hardest = 0;
  for (let i = 0; i < 30 * 8; i++) {
    for (let k = 0; k < 4; k++) c.step(1 / 120, 1, 0);
    c.onRoad = !!onRoad(c.x, c.z, 0.35);
    hardest = Math.max(hardest, c.collide(w));
  }
  assert.ok(hardest > 2, `it hit something (${hardest.toFixed(1)} m/s)`);
  assert.ok(w.col.free(c.x, c.z, 0.2), 'and stands clear of it, not in it');
  // a root standing in the road: drive into it and you stop
  const q = new Car(p.x, p.z, yawOf(p.dx, p.dz), 8);
  const post = { x: p.x + p.dx * 6, z: p.z + p.dz * 6, r: ROOT.r };
  let hit = 0;
  for (let i = 0; i < 60; i++) { q.step(1 / 60, 1, 0); hit = Math.max(hit, q.collide(w, [post])); }
  assert.ok(hit > 3, 'a post in the road stops the car');
  assert.ok(Math.hypot(q.x - post.x, q.z - post.z) > DRIVE.r + ROOT.r - 0.05 - DRIVE.axle, 'and it is not inside it');
});

test('the roads are measured, the roots planned from the seed: on the road, off the forks, none at the start', () => {
  assert.equal(ROUTES.length, 4);
  assert.ok(MAIN.len > 420 && MAIN.len < 480, `the main road ${MAIN.len.toFixed(0)} m`);
  const end = pointAt(MAIN, MAIN.len);
  assert.ok(Math.hypot(end.x - CRASH.x, end.z - CRASH.z) < 12, 'it ends at the pine');
  assert.ok(Math.hypot(end.x - CRASH.x, end.z - CRASH.z) < GOAL_D, 'within the goal');
  const a = rootPlan(7), b = rootPlan(7), c = rootPlan(8);
  assert.deepEqual(a, b, 'the same night, the same roots');
  assert.notDeepEqual(a, c, 'another night, others');
  for (const seed of [1, 7, 8, 99, 1234]) {
    const plan = rootPlan(seed);
    assert.ok(plan.filter((r) => r.route === 'main').length >= 4, `${seed}: a handful on the way through`);
    assert.ok(plan.some((r) => r.route !== 'main'), `${seed}: and some down the dead ends`);
    for (const R of plan) {
      assert.ok(onRoad(R.x, R.z, 0), `${seed}/${R.i}: on the road`);
      assert.ok(Math.abs(R.lat) >= ROOT.lateral[0] - 1e-9 && Math.abs(R.lat) <= ROOT.lateral[1] + 1e-9, 'to one side of it');
      assert.ok(!FORKS.some((F) => Math.hypot(R.x - F.x, R.z - F.z) < 17), 'not at a fork');
      if (R.route === 'main') assert.ok(R.s > START_S + 50, 'not on top of the start');
      const pr = project(ROUTES.find((r) => r.id === R.route), R.x, R.z);
      assert.ok(Math.abs(Math.abs(pr.lat) - Math.abs(R.lat)) < 0.05 && Math.sign(pr.lat) === Math.sign(R.lat), 'left is left');
    }
  }
});

test('the chase follows the track you drove — into a dead end and out again — and slams where it has got to', () => {
  const ch = new Chase(START_S);
  assert.ok(Math.abs(ch.cs - (START_S - CHASE.behind)) < 1e-9, 'it starts behind the car');
  // a track: up the main road to fork 1, down the west branch a way, and back
  const W = ROUTES.find((r) => r.id === 'west');
  const p = {};
  for (let s = START_S; s <= 126; s += 1) { pointAt(MAIN, s, p); ch.push(p.x, p.z); }
  for (let s = 0; s <= 80; s += 1) { pointAt(W, s, p); ch.push(p.x, p.z); }
  for (let s = 80; s >= 0; s -= 1) { pointAt(W, s, p); ch.push(p.x, p.z); }
  const last = ch.trail[ch.trail.length - 1];
  const carS = ch.carS(last.x, last.z);
  let slams = 0, inBranch = false;
  for (let i = 0; i < 30 * 40; i++) {
    if (ch.update(1 / 30, carS) === 'slam') slams++;
    assert.ok(ch.cs <= carS + 1e-9, 'never past the car');
    const at = ch.at(ch.cs);
    if (project(W, at.x, at.z).d < 2 && project(W, at.x, at.z).s > 40) inBranch = true;
  }
  assert.ok(inBranch, 'it went down the dead end after you');
  assert.ok(Math.abs(ch.cs - carS) < 1e-6, 'and caught up with a car that stopped');
  assert.ok(slams >= 14 && slams <= 17, `a slam every ${CHASE.cycle} s (${slams} in 40)`);
  // its pace: the leash pulls it on when it is far behind, never when it is close
  const c2 = new Chase(START_S);
  c2.t = CHASE.start + 1;
  assert.ok(c2.speed(80) > c2.speed(20) + 2, 'far behind: quicker');
  assert.equal(c2.speed(20), c2.speed(5), 'within the leash: its own pace');
  // the cycle
  assert.equal(chasePhase(0.1).ph, 'rise');
  assert.equal(chasePhase(CHASE.rise + 0.05).ph, 'slam');
  assert.equal(chasePhase(CHASE.rise + CHASE.slam + 0.1).ph, 'lie');
  assert.equal(chasePhase(CHASE.cycle - 0.05).ph, 'sink');
});

test('a driver who steers round the roots gets to the pine, and the chapter goes on', () => {
  for (const seed of [7, 11]) {
    const r = run(seed, 70);
    assert.equal(r.L.chapter.id, 'crash', `${seed}: through to chapter 3 (${r.tt.toFixed(1)} s)`);
    assert.equal(r.deaths, 0, `${seed}: alive`);
    assert.ok(r.tt > 25 && r.tt < 60, `${seed}: ${r.tt.toFixed(1)} s on the road`);
    assert.ok(r.minGap < 40, `${seed}: it was never far (${r.minGap.toFixed(1)} m at the closest)`);
    assert.equal(shared.uHead.value.w, 0, 'the car\'s beams went with the chapter');
  }
});

test('a timid driver is caught; the chapter starts again, a little gentler', () => {
  const r = run(7, 40, { thrMax: 0.55 });
  assert.ok(r.deaths >= 1, 'caught');
  assert.equal(r.L.chapter.id, 'road', 'still chapter 2');
  assert.ok(r.L.tries >= 1, `started again (${r.L.tries})`);
  const d = r.L.play;
  assert.ok(d.t < 25, 'a fresh drive');
  // the retry starts slower than the film's hand-over
  const fresh = new D.RoadDrive(r.game);
  fresh.begin(1);
  assert.equal(fresh.car.v, 4);
  fresh.dispose();
});

test('a root: the road swells ahead of the car, then it strikes — on the car\'s line it knocks it aside', () => {
  const input = still();
  const { game } = mkGame('bog', input);
  game.setupSolo();
  game.reset({ seed: 7, chapter: 1 });
  const dr = game.level2.play;
  const R = dr.roots.find((q) => q.route === 'main');
  const lane = (lat, v) => {
    const p = pointAt(MAIN, R.s - 30);
    dr.car.x = p.x + p.dz * lat;
    dr.car.z = p.z - p.dx * lat;
    dr.car.yaw = yawOf(p.dx, p.dz);
    dr.car.v = v;
    dr.car.stall = 0;
    dr.car.spin = 0;
    dr.car.steer = 0;
    dr.chase.t = -99; // (the arm stays out of it)
  };
  // at it, a metre in from its side of the road
  lane(R.lat - Math.sign(R.lat) * 0.9, 9);
  dr.rootAge.clear();
  input.move.y = 0.7; // (the pedal asks for 9 m/s: it holds its speed)
  input.move.x = 0;
  let swelled = -1, knocked = false;
  for (let i = 0; i < 30 * 5 && !knocked; i++) {
    game.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
    if (swelled < 0 && dr.rootAge.has(R.i)) swelled = i;
    if (dr.car.stall > 0.3) knocked = true;
  }
  assert.ok(swelled >= 0, 'it began to swell ahead of the car');
  assert.ok(knocked, 'and knocked it aside');
  const [fx, fz] = dr.car.fwd();
  const dx = R.x - dr.car.x, dz = R.z - dr.car.z, al = Math.max(-2, Math.min(2, dx * fx + dz * fz));
  assert.ok(Math.hypot(dx - fx * al, dz - fz * al) > ROOT.r + DRIVE.r, 'shoved clear of the post it now is');
  assert.equal(dr.dead, null, 'knocked, not killed');
  // the same root from the other side of the road: nothing
  lane(-R.lat, 9);
  dr.rootAge.clear();
  let touched = false;
  for (let i = 0; i < 30 * 5; i++) {
    game.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
    if (dr.car.stall > 0.3) touched = true;
  }
  assert.ok(dr.rootAge.has(R.i), 'it came up again');
  assert.ok(!touched, 'and missed a car on the other side');
  // right over it, quick: the car goes over, and that is the chapter
  lane(R.lat, 11);
  dr.rootAge.clear();
  input.move.y = 1;
  for (let i = 0; i < 30 * 4 && !dr.dead; i++) game.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
  assert.equal(dr.dead?.kind, 'flipped', 'over');
});

test('co-op: the host drives, the guest draws the host\'s car; the seats go by lobby order; only the navigator opens the map', () => {
  const { game: host } = mkGame('bog', still());
  host.setupSolo();
  host.reset({ seed: 3, chapter: 1 });
  const H = host.level2.play;
  host.input.move.y = 1;
  for (let i = 0; i < 60; i++) host.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
  const pk = H.pack();
  assert.deepEqual(Object.keys(pk).sort(), ['c', 'd', 'f', 'h', 'r']); // (5.0g: f — the pine it dropped across the road)
  assert.ok(JSON.stringify(pk).length < 400, `small on the wire (${JSON.stringify(pk).length} bytes)`);
  const { game: guest } = mkGame('bog', still());
  guest.setupSolo();
  guest.reset({ seed: 3, chapter: 1 });
  const G = guest.level2.play;
  G.applyNet({ c: [1, 2, 'x'] }); // a bad packet changes nothing
  assert.equal(G.net, null);
  for (let i = 0; i < 20; i++) { G.applyNet(pk); G._follow(1 / 30); }
  assert.ok(Math.hypot(G.car.x - H.car.x, G.car.z - H.car.z) < 1.5, 'the guest\'s car is where the host\'s is');
  assert.ok(Math.abs(G.car.yaw - H.car.yaw) < 0.05);
  assert.deepEqual([G.chaseView.T.x, G.chaseView.T.z], [pk.h[1], pk.h[2]]);
  G.applyNet({ ...pk, d: 1 });
  G._follow(1 / 30);
  assert.equal(G.dead?.kind, 'caught', 'the host\'s death is the guest\'s');
  assert.equal(G.restart, false, 'but only the host starts the chapter again');
  // the seats: the host drives, the others by slot — the first of them is the navigator
  const seatTest = (role, me, others, hostId) => {
    const { game } = mkGame('bog', still());
    game.setupSolo();
    game.reset({ seed: 1, chapter: 1 });
    game.role = role;
    game.player.id = me.id;
    game.player.slot = me.slot;
    game.coop = { hostId, rules: {} };
    game.remotes = new Map(others.map((o) => [o.id, { id: o.id, slot: o.slot, yaw: 0, pitch: 0, rig: { root: new THREE.Object3D(), nodes: {} } }]));
    const d = game.level2.play;
    d.seats.clear();
    d._seats();
    return d;
  };
  const hostSeat = seatTest('host', { id: 'A', slot: 0 }, [{ id: 'C', slot: 3 }, { id: 'B', slot: 1 }], 'A');
  assert.equal(hostSeat.seat, 0);
  assert.equal(hostSeat.canMap, false, 'with a navigator in the car, the driver has no map');
  const nav = seatTest('client', { id: 'B', slot: 1 }, [{ id: 'A', slot: 0 }, { id: 'C', slot: 3 }], 'A');
  assert.equal(nav.seat, 1);
  assert.equal(nav.canMap, true, 'the navigator has it');
  const back = seatTest('client', { id: 'C', slot: 3 }, [{ id: 'A', slot: 0 }, { id: 'B', slot: 1 }], 'A');
  assert.equal(back.seat, 2);
  assert.equal(back.canMap, false);
  assert.equal(H.canMap, true, 'alone, the driver reads it (and does not see the road meanwhile)');
  assert.ok(PROTOCOL >= 24, 'the wire changed, so the protocol did');
  assert.match(src('src/game/netsync.js'), /case 'dv': [^\n]*\n\s+if \(!this\.host && isHostMsg && d\) g\.level2\?\.play\?\.applyNet\?\.\(d\);/);
});

test('the map: the roads, three forks, three dead ends, the way to the village and you', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (...a) => calls.push([k, ...a])),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  setLang('ru');
  drawMap(ctx, 900, new Car(10, 200, 0, 0));
  const texts = calls.filter((c) => c[0] === 'fillText').map((c) => c[1]);
  assert.equal(texts.filter((s) => s === t('l2MapDead')).length, 3, 'three dead ends');
  for (const k of ['l2MapVillage', 'l2MapTitle', 'l2MapHighway', 'l2MapYou']) assert.ok(texts.includes(t(k)), k);
  for (const n of ['1', '2', '3']) assert.ok(texts.includes(n), `fork ${n}`);
  // the map opens while TAB is held, and the road hint makes way for it
  const { game } = mkGame('bog', still());
  game.setupSolo();
  game.reset({ seed: 2, chapter: 1 });
  game.input.peekHeld = true;
  game.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
  assert.equal(game.level2.play.mapOpen, true);
  game.input.peekHeld = false;
  game.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
  assert.equal(game.level2.play.mapOpen, false);
});

test('in the seat: the camera is in the car, the hands are off the kit, and leaving the chapter takes it all away', () => {
  const { game, scene } = mkGame('bog', still());
  game.setupSolo();
  game.reset({ seed: 5, chapter: 1 });
  const dr = game.level2.play;
  dr.raimiOn = false; // (5.0g: past its own eyes at the start)
  game.update(1 / 30, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
  const cam = new THREE.PerspectiveCamera(60, 1.6, 0.05, 600);
  game.applyView(cam, 1);
  assert.ok(Math.hypot(cam.position.x - dr.car.x, cam.position.z - dr.car.z) < 2, 'the eyes are in the car');
  assert.ok(cam.position.y > dr.car.y + 1 && cam.position.y < dr.car.y + 2.2, 'at a seated head\'s height');
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  const [fx, fz] = dr.car.fwd();
  assert.ok(fwd.x * fx + fwd.z * fz > 0.9, 'looking down the road');
  assert.equal(game.level2.seated, true);
  assert.ok(shared.uHead.value.w > 1, 'the beams are on');
  const out = [];
  game.level2.lightSources(out);
  assert.ok(out.length <= 6 && out[0].id === 'moon' && out.some((l) => l.id === 'tail'), 'the moon, the dash, the tail lamps');
  assert.ok(scene.children.includes(dr.car3), 'the car is in the scene');
  game.level2.goto(2);
  assert.equal(game.level2.play, null);
  assert.ok(!scene.children.includes(dr.car3), 'and gone with the chapter');
  assert.equal(shared.uHead.value.w, 0);
  assert.equal(game.level2.seated, false);
});

test('the words and the sounds: both languages, and every sound the drive asks for exists', () => {
  for (const L of ['ru', 'en']) {
    setLang(L);
    for (const k of ['l2DriveHint', 'l2DriveHintCoop', 'l2NavHint', 'l2RideHint', 'l2MapTitle', 'l2MapDead', 'l2MapVillage', 'l2MapHighway', 'l2MapYou', 'l2RootAlert', 'l2Caught', 'l2Flipped', 'l2Again']) {
      assert.notEqual(t(k), k, `${L}.${k}`);
    }
  }
  setLang('ru');
  const au = src('src/audio/audio.js'), dr = src('src/game/roadDrive.js');
  for (const fn of ['chaseRumble', 'gravelRoll', 'rootSwell', 'rootStrike', 'carHit']) {
    assert.match(au, new RegExp(`\\n  ${fn}\\(`), `audio.${fn}`);
    assert.match(dr, new RegExp(`au\\.${fn}\\?\\.`), `the drive asks for ${fn}`);
  }
  assert.match(src('src/style.css'), /#l2map\.open/);
  assert.match(src('src/style.css'), /body\.driving #crosshair/);
});
