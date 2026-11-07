// 5.0f: «Топь», chapters 6 and 7 — «Побег» on the Kugoo bikes down the causeway, and «Обрыв»: up the embankment,
// off the cliff into the lake, the pier film and the old fisherman, the end of the level. These pin the way (the
// causeway, the ramp off the gate, the embankment a Kugoo can climb), the arms across the planks, the roots that come
// up where you will be, the bog, getting back on after a throw, a rider who reads it getting through to the end and
// one who does not being caught, the top and the biggest arm, the pier film, the wire, the words and the bars.
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
const step = (game, n = 1, events = []) => { for (let i = 0; i < n; i++) game.update(1 / 60, { events, move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } }); };

const R = await import('../src/game/bogRide.js');
const { EscapePlay, CliffPlay, CW, cwAt, cwProject, ARMS, armU, armTB, ARM_LAND, ARM_UP, ARM_HIT, ARM_LIE, ARM_PERIOD, ROOTS, rootAt, ROOT_HIT, TOP, RIDE, endSpots, inLake } = R;
const { PierFilm, Fisherman, PT, pierEnd, benchAt, hutLight, LEVEL_Y } = await import('../src/game/pierFilm.js');
const { CAUSEWAY, CLIFF, LAKE, RISE, riseAt, RAMP } = await import('../src/world/swamp.js');
const { MOTO, buildBars, placeBars } = await import('../src/game/moto.js');
const { CHASE, ROOT } = await import('../src/game/roadDrive.js');
const { PLAYS, CHAPTERS } = await import('../src/game/level2.js');
const { PROTOCOL } = await import('../src/net/net.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// one «Топь» game in chapter `ch` (0-based), solo
function bog(ch, seed = 4242) {
  const inp = still();
  const { game, world, scene } = mkGame('bog', inp);
  game.setupSolo();
  let ended = null;
  game.onEnd = (r) => { ended = r; };
  game.reset({ seed, chapter: ch });
  return { game, world, scene, inp, ended: () => ended };
}

// a rider who reads the causeway: waits out an arm that will be down when he gets there, crosses to the far side of a
// swelling root, rides the middle otherwise; on the embankment, gently up, and at the top over the edge to the lake.
// careless: none of that on the causeway
function rideBot(game, inp, { speed = 8, careless = false, maxT = 90 } = {}) {
  const riseP = (s) => { s = Math.max(0, Math.min(RISE.len, s)); let i = 1; while (i < RISE.cum.length - 1 && RISE.cum[i] < s) i++; const [ax, az] = RISE.pts[i - 1], [bx, bz] = RISE.pts[i]; const f = (s - RISE.cum[i - 1]) / (RISE.cum[i] - RISE.cum[i - 1]); return { x: ax + (bx - ax) * f, z: az + (bz - az) * f }; };
  const L2 = game.level2;
  let tt = 0, prevErr = 0, ch6 = null;
  while (tt < maxT && game.state === 'level2') {
    const v = L2.play;
    if (ch6 === null && L2.chapter.id === 'cliff') ch6 = tt;
    if (v.mine?.st === 'dead') return { t: tt, died: v.mine.cause, ch: L2.chapter.id, ch6 };
    if (v.mine?.st !== 'ride') { step(game); tt += 1 / 60; continue; }
    const b = v.bike(v.mine.i);
    const q = cwProject(b.x, b.z), sp = Math.abs(b.speed || 0);
    let lat = 0, target = speed, aim;
    const rr = riseAt(b.x, b.z), onRise = (rr.d < 5 && rr.s > 0.3) || (q.s >= CW.len - 4 && q.d < 4) || Math.hypot(b.x - CLIFF.x, b.z - CLIFF.z) < 14;
    if (!onRise) {
      if (!careless) {
        for (const a of ARMS) {
          const ahead = a.s - q.s;
          if (ahead > 0 && ahead < 26) {
            const eta = Math.max(0, ahead - 2) / Math.max(2, sp);
            const u = armU(a, v.t + eta), u2 = armU(a, v.t + eta + 0.5);
            if ((u >= 0 && u < ARM_UP + 0.5) || (u2 >= 0 && u2 < ARM_UP)) target = Math.min(target, Math.max(0, (ahead - 6.5) * 1.1));
          }
        }
        ROOTS.forEach((Rt, k) => { const ahead = Rt.s - q.s, age = v.rootAge?.get(k); if (ahead > -1 && ahead < 14 && (age === undefined || age < 4)) lat = -Math.sign(Rt.lat) * 1.05; });
      }
      const p = cwAt(q.d < 6 && q.s > 0.5 ? Math.min(CW.len, q.s + 6) : 2);
      aim = { x: p.x + p.dz * lat, z: p.z - p.dx * lat };
    } else {
      aim = rr.s > RISE.len - 3 || Math.hypot(b.x - CLIFF.x, b.z - CLIFF.z) < 8 ? { x: LAKE.x, z: LAKE.z } : riseP(rr.s + 8);
      target = rr.s < 30 ? 3.5 : 6;
    }
    const want = Math.atan2(-(aim.x - b.x), -(aim.z - b.z));
    let err = want - b.yaw; err = Math.atan2(Math.sin(err), Math.cos(err));
    inp.move.y = sp < target - 0.4 ? Math.min(0.85, 0.4 + sp * 0.12) : sp > target + 0.4 ? -0.7 : 0.15;
    const dErr = Math.atan2(Math.sin(err - prevErr), Math.cos(err - prevErr)) * 60;
    prevErr = err;
    inp.move.x = Math.max(-1, Math.min(1, -(err * 2.0 + dErr * 0.28)));
    step(game);
    tt += 1 / 60;
  }
  inp.move.x = 0; inp.move.y = 0;
  return { t: tt, ch: L2.chapter?.id, state: game.state, ch6 };
}

test('the way: the causeway measured, a ramp off the gate, an embankment up the knoll — all gentle enough for a Kugoo', () => {
  const { world } = mkGame('bog', still());
  assert.ok(Math.abs(CW.len - 110.6) < 0.5, `the causeway is ${CW.len.toFixed(1)} m`);
  for (const s of [5, 40, 90]) {
    const p = cwAt(s), q = cwProject(p.x, p.z);
    assert.ok(Math.abs(q.s - s) < 1e-6 && q.d < 1e-6);
  }
  const p = cwAt(50), q = cwProject(p.x + p.dz * 1, p.z - p.dx * 1);
  assert.ok(Math.abs(q.lat - 1) < 1e-6, 'lat: to the left of the way it runs');
  const g = (x, z) => world.walkHeight(x, z) ?? world.terrain.height(x, z);
  // the ramp: planks from the bank at the gate down onto the causeway
  const ramp = world.walks.find((w) => w.id === 'ramp');
  assert.ok(ramp && world.walks[0] === ramp, 'a deck of its own, over the one it lies on');
  const rl = Math.hypot(ramp.bx - ramp.ax, ramp.bz - ramp.az);
  assert.ok(Math.atan2(ramp.ya - ramp.yb, rl) < 0.14, 'under 8°');
  assert.deepEqual(RAMP.from, [99, -170]);
  // the embankment: up from the causeway's end to the top, 7° on average and never steeper than 11° over three metres (the
  // ground's own cells put a few centimetres of bump in it) — and the top still nine metres up
  let steep = 0;
  for (let s = 0; s < RISE.len - 3; s += 1) {
    const a = riseP(s), b = riseP(s + 3);
    steep = Math.max(steep, Math.atan2(g(b.x, b.z) - g(a.x, a.z), 3));
  }
  assert.ok(steep < 0.19, `the climb is ${(steep * 180 / Math.PI).toFixed(1)}° at its steepest`);
  assert.ok(RISE.len > 60);
  assert.ok(g(CLIFF.x, CLIFF.z) > 9, 'the top');
  assert.ok(riseAt(RISE.pts[RISE.pts.length - 1][0], RISE.pts[RISE.pts.length - 1][1]).y > 9, 'it ends at the top');
  assert.ok(world.swamp.lamps.filter((l) => riseAt(l.x, l.z).d < 3).length >= 3, 'lamps up the embankment too');
  function riseP(s) { let i = 1; while (i < RISE.cum.length - 1 && RISE.cum[i] < s) i++; const [ax, az] = RISE.pts[i - 1], [bx, bz] = RISE.pts[i]; const f = (s - RISE.cum[i - 1]) / (RISE.cum[i] - RISE.cum[i - 1]); return { x: ax + (bx - ax) * f, z: az + (bz - az) * f }; }
});

test('the arms: they rise, come down across the planks, lie there and go back under — on the chapter\'s clock', () => {
  assert.ok(ARM_PERIOD > CHASE.cycle, 'and a while gone between');
  for (const a of ARMS) {
    const { T, B } = armTB(a);
    assert.ok(cwProject(T.x, T.z).d < 1e-6, 'it comes down on the planks');
    assert.ok(cwProject(B.x, B.z).d > 8, 'out of the bog beside them');
    assert.equal(armU(a, -a.off), 0);
    assert.equal(armU(a, -a.off + CHASE.cycle + 0.1), -1, 'under the bog');
    assert.equal(armU(a, -a.off + ARM_PERIOD + 0.5), 0.5, 'and again');
  }
  const { game } = bog(5);
  const v = game.level2.play;
  assert.ok(v instanceof EscapePlay);
  assert.equal(PLAYS.escape, EscapePlay);
  const a = ARMS[0], { T } = armTB(a), b = v.bike(0);
  // under it as it lands
  v.t = ARM_LAND - a.off - 0.05;
  b.x = T.x + 1; b.z = T.z; b.y = v.ground(b.x, b.z);
  step(game, 6);
  assert.equal(v.mine.st, 'dead');
  assert.equal(v.mine.cause, 'arm');
  // lying across: ride into it
  const h = bog(5).game, w = h.level2.play, c = w.bike(0);
  w.t = ARM_LAND - a.off + 0.1;
  c.x = T.x + 4; c.z = T.z; c.y = w.ground(c.x, c.z);
  step(h, 2);
  assert.equal(w.mine.st, 'ride', 'four metres off: nothing');
  c.x = T.x + ARM_LIE * 0.6;
  step(h, 2);
  assert.equal(w.mine.st, 'dead', 'into it');
  // gone under: you pass
  const k = bog(5).game, u = k.level2.play, d = u.bike(0);
  u.t = CHASE.cycle - a.off + 0.3;
  d.x = T.x; d.z = T.z; d.y = u.ground(d.x, d.z);
  step(k, 20);
  assert.equal(u.mine.st, 'ride');
  assert.ok(ARM_HIT > ARM_LIE);
});

test('the roots come up where you will be: the middle of the planks is in reach, the far edge is not', () => {
  for (const [lat, alive] of [[0, false], [-1.05, true]]) {
    const { game } = bog(5);
    const v = game.level2.play, b = v.bike(0), Rt = ROOTS[0], at = rootAt(Rt);
    // riding at 8 m/s toward it, in the middle or on the far side: a ghost rider moved by hand
    const p = game.player;
    let s = Rt.s - 14;
    v.t = 1.2; // (between the arms)
    for (let i = 0; i < 60 * 3; i++) {
      s += 8 / 60;
      const q = cwAt(s);
      b.x = q.x + q.dz * lat; b.z = q.z - q.dx * lat; b.y = v.ground(b.x, b.z); b.vx = 0; b.vz = 0;
      p.speed = 8;
      v.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
      b.x = q.x + q.dz * lat; b.z = q.z - q.dx * lat; p.x = b.x; p.z = b.z; p.y = b.y; p.speed = 8;
      if (v.mine.st !== 'ride') break;
    }
    assert.ok(v.rootAge.has(0), 'it came up');
    assert.equal(v.mine.st === 'ride', alive, `at lat ${lat}`);
    if (!alive) assert.equal(v.mine.cause, 'root');
    assert.ok(Math.hypot(at.x - cwAt(Rt.s).x, at.z - cwAt(Rt.s).z) < 1, 'to one side of the middle');
  }
  assert.ok(ROOT_HIT > Math.abs(ROOTS[0].lat) && ROOT_HIT < Math.abs(ROOTS[0].lat) + 1.05, 'the middle in reach, the far edge not');
});

test('off the planks is the bog; thrown from the saddle you stand it up and get back on, on the slope', () => {
  const { game } = bog(5);
  const v = game.level2.play, b = v.bike(0), q = cwAt(40);
  b.x = q.x + q.dz * 4; b.z = q.z - q.dx * 4; b.y = v.level - 0.5;
  step(game, 2);
  assert.equal(v.mine.st, 'dead');
  assert.equal(v.mine.cause, 'bog');
  // the remount: both wheels on the ground, nose along the way
  const h = bog(6).game, w = h.level2.play, c = w.bike(0);
  const r0 = RISE.pts[3], r1 = RISE.pts[4];
  c.x = (r0[0] + r1[0]) / 2; c.z = (r0[1] + r1[1]) / 2; c.roll = 1.4; c.pitch = 0.9; c.y = 0;
  w.remount(0, c);
  assert.equal(c.roll, 0);
  const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw);
  const gF = w.ground(c.x + fx * MOTO.half, c.z + fz * MOTO.half), gR = w.ground(c.x - fx * MOTO.half, c.z - fz * MOTO.half);
  assert.ok(Math.abs(c.y - (gF + gR) / 2) < 1e-6 && Math.abs(c.pitch - Math.atan2(gF - gR, 2 * MOTO.half)) < 1e-6);
  assert.equal(w.stun, 0);
});

test('a rider who reads it gets through: the causeway, the embankment, the jump, the pier, the end — and one who does not is caught', () => {
  for (const seed of [4242, 7]) {
    const { game, inp, ended } = bog(5, seed);
    const r = rideBot(game, inp, { maxT: 100 });
    assert.equal(game.state, 'won', `seed ${seed}: ${JSON.stringify(r)}`);
    assert.deepEqual(ended(), { won: true, level2: true, coop: false, alive: true });
    assert.ok(r.ch6 > 15 && r.ch6 < 50, `the causeway took ${r.ch6?.toFixed(1)} s`);
  }
  const { game, inp } = bog(5);
  const r = rideBot(game, inp, { careless: true, maxT: 40 });
  assert.ok(r.died, 'down the middle, never waiting: caught');
  assert.equal(r.ch, 'escape');
});

test('the top: reach it and the biggest of them rises behind you; six seconds on it comes down on whoever is still there', () => {
  const { game } = bog(6);
  const v = game.level2.play;
  assert.ok(v instanceof CliffPlay);
  assert.equal(CHAPTERS.find((c) => c.id === 'cliff').stay, true);
  const b = v.bike(0);
  assert.ok(Math.hypot(b.x - endSpots(1)[0].x, b.z - endSpots(1)[0].z) < 0.5, 'a jump straight here starts at the end of the causeway');
  b.x = CLIFF.x - 3; b.z = CLIFF.z + 3; b.y = 9.5;
  step(game, 30);
  assert.equal(v.top.on, true);
  assert.ok([...v.cues].includes('rise'));
  assert.ok(v.big.mesh.visible);
  assert.ok(v.danger >= 0.3, 'it feels it');
  step(game, Math.round(60 * (TOP.warn - 0.3)));
  assert.equal(v.mine.st, 'dead');
  assert.equal(v.mine.cause, 'top');
  assert.ok([...v.cues].includes('crash'));
  assert.equal(inLake(LAKE.x, LAKE.z), true);
  assert.equal(inLake(CLIFF.x, CLIFF.z), false);
});

test('the pier film: up out of the water, the swim, the old man and his line, the lake from above; a skip from the host', () => {
  const { game, scene } = bog(6);
  const v = game.level2.play;
  // the old man is there before the film: his lantern across the lake
  const out = [];
  v.lightSources(out);
  assert.ok(out.some((l) => l.id === v.fisher), 'his light from the top of the cliff');
  const F = v.fisher;
  const B = benchAt(), e = pierEnd();
  assert.ok(Math.hypot(F.rig.root.position.x - B.x, F.rig.root.position.z - B.z) < 1e-6, 'on his bench');
  assert.equal(F.rig.fit.head, 'ushanka');
  assert.ok(Math.abs(F.rig.root.rotation.y - Math.atan2(e.ux, e.uz)) < 1e-9, 'facing out over the lake');
  // into the water: the film
  const b = v.bike(0);
  b.x = LAKE.x - 20; b.z = LAKE.z + 10; b.y = -1;
  step(game, 2);
  assert.equal(v.mine.st, 'swim');
  assert.ok(v.film instanceof PierFilm);
  const f = v.film;
  assert.deepEqual([0.5, 5, 11, 16].map((x) => f.shotAt(x)), ['surface', 'swim', 'pier', 'wide']);
  assert.ok(f.fadeAt(0) === 0 && f.fadeAt(5) === 1 && f.fadeAt(PT.end) === 0);
  const s0 = f.swimmer(0), s1 = f.swimmer(PT.pier[1]);
  assert.ok(Math.hypot(s0.x - b.x, s0.z - b.z) < 3, 'from where you went in');
  assert.ok(Math.hypot(s1.x - e.x, s1.z - e.z) < 6, 'to the end of the pier');
  const cam = new THREE.PerspectiveCamera();
  assert.ok(v.applyCamera(cam), 'the film has the camera');
  const lights = [];
  v.lightSources(lights);
  assert.ok(lights.some((l) => l.id === 'hutWindow') && lights.some((l) => l.id === F));
  assert.ok(Math.abs(LEVEL_Y - game.world.water.level) < 1e-9);
  assert.ok(hutLight().y > LEVEL_Y);
  // Enter: to its last fade, and the level is won
  step(game, 1, ['confirm']);
  assert.ok(f.t >= PT.end - 2.3);
  step(game, 60 * 3);
  assert.equal(game.state, 'won');
  const n = scene.children.length;
  assert.ok(n > 0);
});

test('co-op: the host sends the ride, a friend\'s machine leans under them, and the bike index rides the state packet', () => {
  const inp = still();
  const { game } = mkGame('bog', inp);
  const sent = [];
  game.setupSolo();
  game.role = 'host';
  game.player.id = 'H';
  game.coop = { rules: {}, toHost() {}, hostId: 'H' };
  game.sync = { ev() {}, send: (type, d) => sent.push([type, d]), process() {}, tick() {} };
  game.remotes.set('G', { id: 'G', slot: 1, x: 0, y: 0, z: 0, yaw: -Math.PI / 2, speed: 6, alive: true, rig: null });
  game.reset({ seed: 3, chapter: 5 });
  const v = game.level2.play, L2 = game.level2;
  assert.equal(L2.mouth.bikes.length, 2);
  assert.equal(L2.riding, 0, 'you are on bike 0');
  assert.equal(v.players.get('G').i, 1);
  const r = game.remotes.get('G'), q = cwAt(30);
  r.x = q.x; r.z = q.z; r.y = v.ground(q.x, q.z) + 0.02;
  const step2 = () => L2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  for (let i = 0; i < 8; i++) step2();
  assert.ok(Math.hypot(L2.bikeOf(1).x - q.x, L2.bikeOf(1).z - q.z) < 1e-6, 'their machine is under them');
  assert.ok(L2.mouth.bikes[1].visible);
  const ew = sent.filter(([type]) => type === 'ew');
  assert.ok(ew.length >= 1);
  // the friend goes into the bog: the host says so
  r.y = v.level - 1;
  step2();
  assert.equal(v.players.get('G').st, 'dead');
  const pk = v.pack();
  assert.deepEqual(pk.p.find((e) => e[0] === 'G'), ['G', 2, 'bog']);
  // a guest follows the host's word
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  g2.role = 'client';
  g2.player.id = 'G';
  g2.player.slot = 1;
  g2.coop = { rules: {}, toHost() {}, hostId: 'H' };
  g2.sync = { ev() {}, send() {}, process() {}, tick() {} };
  g2.remotes.set('H', { id: 'H', slot: 0, x: 0, y: 0, z: 0, alive: true, rig: null });
  g2.reset({ seed: 3, chapter: 5 });
  const w = g2.level2.play;
  w.applyRide({ p: [['G', 2, 'bog'], ['H', 0, '']], t: 7.3, c: ['die:G:bog'], r: [[1, 0.4]] });
  assert.equal(w.mine.st, 'dead');
  assert.equal(w.t, 7.3, 'the arms keep the host\'s time');
  assert.equal(w.rootAge.get(1), 0.4);
  assert.equal(g2.level2.riding, -1, 'down: on no bike');
  // the wire
  const net = src('src/game/netsync.js');
  assert.match(net, /case 'ew':[\s\S]*?applyRide\?\.\(d\)/);
  assert.match(net, /g\.state === 'level2' && g\.level2 \? g\.level2\.riding : g\.motos/);
  assert.match(src('src/game/remote.js'), /this\.game\.level2\?\.bikeOf\?\.\(this\.riding\)/);
  assert.equal(PROTOCOL, 27);
});

test('the words, the sounds, and the bars shared with the training ground', () => {
  for (const L of ['ru', 'en']) {
    setLang(L);
    for (const k of ['escHint', 'escArmWarn', 'escRootWarn', 'escThrown', 'escBog', 'escArm', 'escRoot', 'cliffHint', 'cliffRise', 'cliffTop', 'cliffSwim', 'cliffDown', 'pierLine', 'l2Goal_escape', 'l2Goal_cliff']) assert.notEqual(t(k), k, `${L}.${k}`);
  }
  setLang('ru');
  assert.match(t('pierLine'), /чайник/);
  assert.ok(src('src/audio/audio.js').includes('  bogGulp(x, y, z) {'));
  const ride = src('src/game/bogRide.js');
  for (const s of ['armGroan', 'armSlam', 'rootSwell', 'rootStrike', 'splash', 'bogGulp', 'motoLoop', 'motoOn', 'motoOff']) assert.ok(ride.includes(s + '?.('), s);
  assert.ok(src('src/game/pierFilm.js').includes('lanternSqueak?.('));
  const moto = src('src/game/moto.js');
  assert.match(moto, /this\.cockpitMesh = buildBars\(paint, g\.world\.material\)/, 'the training ground uses the same bars');
  const bars = buildBars(1, null), cam = new THREE.PerspectiveCamera();
  cam.position.set(1, 2, 3);
  placeBars(bars, cam, { roll: 0.2, steer: 0.1 });
  assert.ok(bars.visible && bars.position.distanceTo(cam.position) < 1);
  assert.deepEqual(CHAPTERS.map((c) => !!PLAYS[c.id] || c.film).filter(Boolean).length, 7, 'every chapter is played or filmed');
  assert.ok(RIDE.netHz >= 10 && CAUSEWAY.w === 3.4);
});
