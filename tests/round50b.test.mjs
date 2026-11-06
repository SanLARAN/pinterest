// 5.0b: «Кортеж» — chapter 1 of «Топь» is a film now: the night highway, the convoy that overtakes the crew, the
// arm across the road at the junction, the long wait, the wake, the turn into the forest. These pin what has to
// stay true while it is tuned: the beats in order, the car's way (it stops in the queue beside the turn-off and
// ends up on the dirt road), the convoy really passing it, the arm's pose at each blow, the lights it hands the
// shader (never more than the slots), the sounds it asks for, the skip — and that a whole Game plays it through
// into chapter 2.
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

const { HIGHWAY, ROADS, FORKS, CRASH, HOUSES, GATE, GENERATOR, BIKES, CAUSEWAY, CLIFF, LAKE, rot } = await import('../src/world/swamp.js');
const { CHAPTERS, chapterStart, houseFor, faceYaw } = await import('../src/game/level2.js');
const { swimming } = await import('../src/game/water.js');
const { PROTOCOL } = await import('../src/net/net.js');
const { t, setLang } = await import('../src/core/i18n.js');

const frame = (game, dt = 1 / 60, events = []) => game.update(dt, { events, move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
// a still pair of hands on the keyboard (a Proxy would hand the walker NaN)
const still = () => ({ move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, consume: () => [], uiMode: false, events: [] });
const put = (game, x, z) => { const p = game.player; p.x = x; p.z = z; p.vx = p.vz = 0; };
const { ConvoyFilm, shotList, STAGE, QUEUE, COLUMN, STOP_X, TURN_PATH, MOON } = await import('../src/game/convoyFilm.js');
const { armPose, armRadius, armSAt, RoadArm, restLine, ARM } = await import('../src/game/roadArm.js');
const { flashState, Vehicle } = await import('../src/game/convoyCast.js');
const { ARM_PATH } = await import('../src/world/swamp.js');
const { GLOW_SLOTS, shared } = await import('../src/render/sonar.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let film1 = null;
const filmGame = () => film1 || (film1 = (() => {
  const { game } = mkGame('bog', still());
  game.setupSolo();
  game.reset({ seed: 11 });
  return game;
})());

test('the beats come in order, and the film is long — the wait is the point', () => {
  const g = filmGame();
  const F = g.level2.film;
  assert.ok(F instanceof ConvoyFilm, 'chapter 1 runs its film');
  const T = F.T;
  const order = ['radio', 'meet', 'mirror', 'pass', 'passEnd', 'arrive', 'stop', 'reveal', 'faces', 'worker', 'still', 'close', 'twitch', 'wake', 'lift', 'slam', 'sweep', 'tip', 'go', 'rear', 'truck', 'forest', 'fade', 'end'];
  for (let i = 1; i < order.length; i++) assert.ok(T[order[i]] > T[order[i - 1]], `${order[i - 1]} < ${order[i]}`);
  assert.ok(T.stop > 50 && T.stop < 57, `it stops in the queue at ${T.stop.toFixed(1)} s`);
  assert.ok(T.lift - T.stop > 20, 'and then it waits more than twenty seconds');
  assert.ok(F.dur > 85 && F.dur < 110, `${F.dur.toFixed(0)} s in all`);
  const shots = shotList(T);
  for (let i = 1; i < shots.length; i++) assert.equal(shots[i].t0, shots[i - 1].t1, `${shots[i].k} follows ${shots[i - 1].k}`);
  assert.equal(shots[0].t0, 0);
  assert.ok(shots[shots.length - 1].t1 >= T.end);
});

test('the car: down the north lane, pulled over for the convoy, stopped beside the turn-off, off onto the dirt road', () => {
  const F = filmGame().level2.film, T = F.T;
  for (const tt of [1, 10, 18, 40]) assert.ok(Math.abs(F.carAt(tt, {}).z - HIGHWAY.lane) < 0.01, `in its lane at ${tt}`);
  assert.ok(F.carAt(26.5, {}).z < HIGHWAY.lane - 1.2, 'on the shoulder while they go by');
  const s = F.carAt(T.stop + 0.1, {});
  assert.ok(Math.abs(s.x - STOP_X) < 0.05 && s.v < 0.05, `stopped at ${s.x.toFixed(2)}`);
  assert.ok(Math.abs(s.x - HIGHWAY.turn) < 5, 'with the turn-off right beside it');
  assert.ok(STOP_X - QUEUE.sedan.x > 5, 'behind the Lada, not in it');
  for (const tt of [T.stop + 5, T.lift, T.go - 0.01]) assert.ok(Math.abs(F.carAt(tt, {}).x - STOP_X) < 0.01, `still there at ${tt.toFixed(1)}`);
  // off the highway: it ends on the dirt road, well into the forest
  const e = F.carAt(T.end, {});
  const main = ROADS[0].pts;
  let d = Infinity;
  for (let i = 0; i + 1 < main.length; i++) {
    const [ax, az] = main[i], [bx, bz] = main[i + 1];
    const L2 = (bx - ax) ** 2 + (bz - az) ** 2, u = Math.max(0, Math.min(1, ((e.x - ax) * (bx - ax) + (e.z - az) * (bz - az)) / L2));
    d = Math.min(d, Math.hypot(e.x - (ax + (bx - ax) * u), e.z - (az + (bz - az) * u)));
  }
  assert.ok(d < 3.5, `on the dirt road at the end (${d.toFixed(2)} m off it)`);
  assert.ok(e.z < HIGHWAY.z - 40, 'forty metres and more into the forest');
  assert.deepEqual(TURN_PATH[0], [STOP_X, HIGHWAY.lane]);
  // no teleport inside the continuous stretches
  for (const [a, b] of [[T.pass, T.passEnd], [T.arrive, T.end]]) {
    let prev = F.carAt(a, {});
    for (let tt = a + 1 / 30; tt < b; tt += 1 / 30) {
      const c = F.carAt(tt, {});
      assert.ok(Math.hypot(c.x - prev.x, c.z - prev.z) < 1.2, `smooth at ${tt.toFixed(2)}`);
      prev = c;
    }
  }
});

test('the convoy overtakes the car — every one of the five — and is waiting at the arm when the car gets there', () => {
  const F = filmGame().level2.film, T = F.T;
  COLUMN.forEach((kind, k) => {
    let crossed = false, before = null;
    for (let tt = T.pass; tt < T.passEnd; tt += 0.05) {
      const c = F.carAt(tt, {}), v = F.convoyAt(tt, k, {});
      const ahead = v.x < c.x;
      if (before === false && ahead) crossed = true;
      before = ahead;
    }
    assert.ok(crossed, `the ${kind} (${k}) goes past`);
    assert.equal(F.convoyAt(26, k, {}).z, HIGHWAY.oncoming, 'in the other lane');
  });
  // parked round the arm: apart from each other, east of it, between it and the queue
  for (let i = 0; i < STAGE.length; i++) {
    for (let j = i + 1; j < STAGE.length; j++) assert.ok(Math.hypot(STAGE[i].x - STAGE[j].x, STAGE[i].z - STAGE[j].z) > 4.5, `${i} and ${j} apart`);
    assert.ok(STAGE[i].x > HIGHWAY.block + 4 && STAGE[i].x < QUEUE.lorry.x - 7, `${i} between the arm and the queue`);
  }
  const p = F.convoyAt(T.stop, 0, {});
  assert.deepEqual([p.x, p.z], [STAGE[0].x, STAGE[0].z]);
});

test('the arm: lying across the road, up over the police car, down on it, the tip on the lorry', () => {
  const F = filmGame().level2.film, T = F.T;
  const ground = (x, z) => F._ground(x, z);
  const n = ARM.seg + 1;
  // at rest it lies on the ground along its path, and it crosses the highway where the blockade is
  const rest = armPose(T.stop, T, ground);
  for (let i = Math.round(n * 0.1); i < n; i += 4) {
    const x = rest.pos[i * 3], y = rest.pos[i * 3 + 1], z = rest.pos[i * 3 + 2];
    assert.ok(Math.abs(y - ground(x, z) - armRadius(i / ARM.seg) * 0.82) < 0.15, `ring ${i} lies on the ground`);
  }
  const sRoad = armSAt(HIGHWAY.block, HIGHWAY.z), iR = Math.round(sRoad * ARM.seg);
  assert.ok(Math.abs(rest.pos[iR * 3 + 2] - HIGHWAY.z) < 2.5 && Math.abs(rest.pos[iR * 3] - HIGHWAY.block) < 3, 'across the road at the block');
  assert.ok(armRadius(sRoad) > 1.2, 'as tall as a car where it crosses');
  // up: the middle well clear of the road before it comes down
  const up = armPose(T.slam - 0.4, T, ground);
  const iC = Math.round(T.sCar * ARM.seg);
  assert.ok(up.pos[iC * 3 + 1] > HIGHWAY.y + 8, `up over it (${(up.pos[iC * 3 + 1] - HIGHWAY.y).toFixed(1)} m)`);
  // down: on the police car, not beside it
  const down = armPose(T.slam + 0.02, T, ground);
  const hit = [down.pos[iC * 3], down.pos[iC * 3 + 1], down.pos[iC * 3 + 2]];
  assert.ok(Math.hypot(hit[0] - STAGE[0].x, hit[2] - STAGE[0].z) < 3.5, `on the police car (${hit[0].toFixed(1)}, ${hit[2].toFixed(1)})`);
  assert.ok(hit[1] - HIGHWAY.y < down.rad[iC] + 0.6, 'down to the road');
  // the tip: up as tall as the lamps, then flat on the lorry
  const tipUp = armPose(T.tip + 2.4, T, ground), last = (n - 1) * 3;
  assert.ok(tipUp.pos[last + 1] > HIGHWAY.y + 9, 'the tip stands up out of the ditch');
  const onLorry = armPose(T.truck + 0.05, T, ground);
  assert.ok(Math.hypot(onLorry.pos[last] - QUEUE.lorry.x, onLorry.pos[last + 2] - QUEUE.lorry.z) < 4, 'and comes down on the lorry');
  // the same time, the same arm: a seek lands on the same frame
  const again = armPose(T.slam + 0.02, T, ground);
  assert.deepEqual([...again.pos], [...down.pos]);
});

test('the arm is a world mesh bent onto its spine: every vertex lands round the spine at its radius', () => {
  const scene = new THREE.Scene(), F = filmGame().level2.film, T = F.T;
  const arm = new RoadArm(scene, new THREE.MeshBasicMaterial());
  arm.update(T.slam - 0.6, T, (x, z) => F._ground(x, z));
  const P = arm.geo.attributes.position.array;
  let worst = 0;
  for (let v = 0; v < arm.count; v += 37) {
    const s = arm.skin.S[v], c = arm.at(s);
    const d = Math.hypot(P[v * 3] - c.x, P[v * 3 + 1] - c.y, P[v * 3 + 2] - c.z);
    const want = armRadius(s) * arm.skin.RK[v] * 1.45 + arm.skin.EX[v] + 0.6;
    assert.ok(Number.isFinite(d), 'finite');
    worst = Math.max(worst, d / want);
  }
  assert.ok(worst < 1, `every sampled vertex within its radius of the spine (${worst.toFixed(2)})`);
  assert.ok(arm.count > 8000, `a tube with suckers (${arm.count} vertices)`);
  arm.dispose();
  assert.equal(restLine().pts.length, ARM.seg + 1);
  assert.equal(ARM_PATH[0].length, 2);
});

test('the beacons: police red then blue, never both at once; the others blue; each lends one real light', () => {
  for (const kind of ['police', 'ambulance', 'fire']) {
    let a = 0, b = 0;
    for (let t = 0; t < 4; t += 0.013) {
      const f = flashState(kind, t);
      assert.ok(!(f.a && f.b), `${kind}: one side at a time`);
      a += f.a; b += f.b;
    }
    assert.ok(a > 20 && b > 20, `${kind}: both sides flash`);
  }
  const scene = new THREE.Scene();
  const v = new Vehicle('police', new THREE.MeshBasicMaterial(), scene);
  v.place(10, 2.2, 330, 0);
  const red = { ...v.beacon(0.0) }, blue = { ...v.beacon(0.41) };
  assert.ok(red.c[0] > red.c[2] && red.I > 2, 'red, bright');
  assert.ok(blue.c[2] > blue.c[0] && blue.I > 2, 'then blue');
  assert.ok(Math.abs(red.y - 2.2 - 1.85) < 0.05, 'from the bar on its roof');
  v.on.dead = true;
  assert.ok(v.beacon(0).I < 0.1, 'a crushed car is dark');
  v.dispose();
});

test('the lights it hands the shader never take more than the slots, the moon first', () => {
  const g = filmGame(), F = g.level2.film;
  const cam = new THREE.PerspectiveCamera(60, 1.6, 0.05, 600);
  for (const tt of [3, 11, 26, 44, F.T.stop + 3, F.T.worker + 2, F.T.slam + 0.5, F.T.go + 1, F.T.end - 2]) {
    F.seek(tt);
    frame(g);
    g.applyView(cam, tt);
    const out = [];
    g.level2.lightSources(out);
    assert.ok(out.length <= GLOW_SLOTS, `${tt}: ${out.length} lights`);
    assert.equal(out[0].id, 'moon');
    for (const l of out) assert.ok([l.x, l.y, l.z, l.I, l.R].every(Number.isFinite), `${tt}: a finite light`);
    assert.ok(shared.uHead.value.w > 0, `${tt}: the car's beams are on`);
    assert.ok(Math.abs(cam.position.x) < 400 && Math.abs(cam.position.z) < 400, `${tt}: the camera is on the map`);
  }
  assert.ok(MOON.R > 600);
});

test('a whole Game plays it through into chapter 2, then the beams go out; Enter (the host\'s) skips it', () => {
  const { game } = mkGame('bog', still());
  game.setupSolo();
  game.reset({ seed: 3 });
  const dur = game.level2.film.dur;
  let frames = 0;
  while (game.level2.i === 0 && frames < (dur + 3) * 30) { frame(game, 1 / 30); frames++; }
  assert.equal(game.level2.chapter.id, 'road', 'the film hands over to the dirt road');
  assert.ok(frames / 30 > dur - 1, `after the whole film (${(frames / 30).toFixed(1)} s)`);
  assert.equal(game.level2.film, null);
  assert.equal(shared.uHead.value.w, 0, 'the film\'s beams are off');
  assert.equal(game.state, 'level2');
  // a skip
  game.reset({ seed: 4 });
  for (let i = 0; i < 20; i++) frame(game);
  frame(game, 1 / 60, ['confirm']);
  for (let i = 0; i < 60; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'road', 'Enter: a short fade and the chapter ends');
  // a guest's Enter does nothing: the host decides
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  const voices = new Map();
  g2.audio = new Proxy(function () {}, { get: (o, k) => (k === 'voices' ? voices : anyFn), apply: () => undefined });
  g2.role = 'client';
  g2.coop = { rules: {}, toHost() {} };
  g2.sync = { ev() {}, process() {}, tick() {}, send() {} };
  g2.reset({ seed: 5 });
  for (let i = 0; i < 10; i++) frame(g2);
  frame(g2, 1 / 60, ['confirm']);
  for (let i = 0; i < 90; i++) frame(g2);
  assert.equal(g2.level2.chapter.id, 'convoy', 'still watching');
  assert.equal(g2.level2.film.skipping, false);
});

test('the sounds it asks for exist, the junction is lit and the arm\'s line is cleared of trees', () => {
  const au = src('src/audio/audio.js');
  for (const fn of ['sirenLoop', 'nightRadio', 'radioSquelch', 'tensionDrone', 'armGroan', 'armSlam', 'metalScrape', 'tyreScreech', 'filmHorn']) {
    assert.match(au, new RegExp(`\\n  ${fn}\\(`), `audio.${fn}`);
    assert.match(src('src/game/convoyFilm.js'), new RegExp(`au\\.${fn}\\?\\.`), `the film asks for ${fn}`);
  }
  assert.match(au, /carPass\(x, y, z, dir, v, dest = null\)/, 'the film\'s cars go to the effects bus');
  const { world } = mkGame('bog');
  const L = HIGHWAY.lamps;
  assert.equal(world.swamp.roadLamps.length, Math.floor((L.x1 - L.x0) / L.every) + 1);
  for (const h of world.swamp.roadLamps) assert.ok(Math.abs(h.z - L.z) < 0.01 && h.y > HIGHWAY.y + 7, 'a head over the lane');
  for (const [x, z] of ARM_PATH.slice(2, -2)) assert.ok(world.col.free(x, z, 2.5), `nothing standing where the arm lies (${x}, ${z})`);
  // the police car's legend reads the right way from both sides (it read backwards from the far one)
  assert.match(src('src/game/roadTraffic.js'), /boxAt\(b, side \* \(col \+ i - 13\.5\) \* 0\.043/);
  // and the Mire has no camp fire burning at its origin
  const g = filmGame();
  assert.equal(g.fire.group.visible, false);
  assert.equal(g.fire.I, 0);
});
