// 5.0d: «Топь», chapters 3 and 4 — «Удар», the crash film, and «Деревня», the village and its keeper.
// These pin the keeper (his body, his lantern, what he hears and sees, his way round the houses), the film (the
// arm missing just behind, the car into the pine, the pieces, the door of your house), and the village: waking tied
// at your own post with him at your door, the rope (its pulls, its creaks, the knots pulled tight again), the door,
// being run down and carried back, the second time, the end of the chapter, his round, and the wire in co-op.
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
const still = () => ({ move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, consume: () => [], uiMode: false, events: [] });
const put = (game, x, z) => { const p = game.player; p.x = x; p.z = z; p.vx = p.vz = 0; };
// A, then D, then A...: one alternation every `every` frames, for `n` frames (or until stop())
function pull(game, inp, n, every = 6, stop = () => false) {
  let s = 1;
  for (let i = 0; i < n && !stop(); i++) {
    if (i % every === 0) { s = -s; inp.move.x = s; }
    frame(game);
  }
  inp.move.x = 0;
}

const { KeeperBody, KEEP, LANTERN, KEEPER_SCALE, hears, sees, yawTo, detour, insideHouse } = await import('../src/game/keeper.js');
const { CrashFilm, CT, crashPath, LEAD, STOP } = await import('../src/game/crashFilm.js');
const { VillagePlay, ROPE, VILLAGE, STATES, MODES, roundOf, keptHouses, seatAt, ropeStep } = await import('../src/game/village.js');
const { MAIN, CHASE, pointAt } = await import('../src/game/roadDrive.js');
const { CRASH, HOUSES, houseFor } = await import('../src/world/swamp.js');
const { FILMS, PLAYS, CHAPTERS } = await import('../src/game/level2.js');
const { shared } = await import('../src/render/sonar.js');
const { PROTOCOL } = await import('../src/net/net.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// one «Топь» game, solo, in chapter 4
function village(seed = 4242) {
  const inp = still();
  const { game, world, scene } = mkGame('bog', inp);
  game.setupSolo();
  game.reset({ seed, chapter: 3 });
  const v = game.level2.play;
  return { game, world, scene, inp, v, P: v.mine, K: v.K };
}

test('the keeper: a head taller than anyone, in a long coat and a hood, a storm lantern that is a real light', () => {
  const scene = new THREE.Scene();
  const k = new KeeperBody(scene);
  assert.equal(KEEPER_SCALE, 1.2);
  assert.equal(k.rig.root.scale.x, 1.2);
  assert.equal(k.rig.fit.body, 'plaguecoat');
  assert.equal(k.rig.fit.head, 'hood');
  assert.ok(k.rig.nodes.lantern, 'the lantern hangs from his left fist');
  assert.equal(k.mat.uniforms.uShow.value, 1, 'drawn as a person, lit by what lights him');
  k.place(10, 2, -5, 0.4);
  k.pose({ carry: true, kneel: 1, t: 3 });
  k.pose({ phase: 1, speed: 1.6, raise: 1, t: 2 });
  const L = k.light(1);
  assert.ok(L && L.I > 1.2 && L.R === LANTERN.R && L.c === LANTERN.c, 'one small light, warm');
  assert.ok(L.y > 2 + 0.8 && Math.hypot(L.x - 10, L.z + 5) < 1.4, 'at his hand');
  const dark = new KeeperBody(scene, { lantern: false });
  assert.equal(dark.light(1), null, 'the shape without a lantern lights nothing');
  const n = scene.children.length;
  k.dispose(); dark.dispose();
  assert.equal(scene.children.length, n - 2);
});

test('his senses: a creak at 32 m, running at 18, walking at 7, a crouch never; his lantern ahead, not behind, not through a wall', () => {
  const k = { x: 0, z: 0, yaw: 0 }; // looking along −z
  assert.ok(hears(k, 0, -31, 'creak') && !hears(k, 0, -33, 'creak'));
  assert.ok(hears(k, 17, 0, 'run') && !hears(k, 19, 0, 'run'));
  assert.ok(hears(k, 0, 6.5, 'walk') && !hears(k, 0, 7.5, 'walk'));
  assert.ok(!hears(k, 0, 1, 'crouch'), 'a crouch is silent');
  assert.ok(sees(k, 0, -10), 'ahead in the light');
  assert.ok(!sees(k, 0, 10), 'not behind him');
  assert.ok(sees(k, 0, 2), '...unless you are right at his back');
  assert.ok(!sees(k, 0, -15), 'the lantern goes so far');
  assert.ok(!sees(k, 0, -8, () => true), 'not through a wall');
  assert.ok(Math.abs(yawTo(0, 0, 0, -5)) < 1e-9 && Math.abs(yawTo(0, 0, -5, 0) - Math.PI / 2) < 1e-9);
  // round a house, not through it
  const H = { id: 'x', x: 0, z: 0, ry: 0.4, W: 7.2, D: 5.6 };
  const w = detour([H], -20, 0.3, 20, -0.2);
  assert.ok(w, 'a house in the way: a corner first');
  assert.ok(!insideHouse(H, w.x, w.z, 0.9), 'the corner is outside it');
  assert.equal(detour([H], -20, 20, 20, 20), null, 'nothing in the way');
  assert.equal(detour([H], 0, 0, 20, 20), null, 'leaving the house he is in: the doorway is his business');
});

test('the crash film: the arm comes down just behind, the car runs off the end of the road into the pine', () => {
  const { game, scene } = mkGame('bog', still());
  game.setupSolo();
  game.reset({ seed: 7, chapter: 2 });
  const f = game.level2.film;
  assert.ok(f instanceof CrashFilm, 'chapter 3 has its film');
  assert.equal(FILMS.crash, CrashFilm);
  const P = crashPath();
  // it starts where chapter 2 ended (the end of the road, the pine ahead) and stops with its nose in the trunk
  const c0 = f.carAt(0), cH = f.carAt(CT.hit), cE = f.carAt(CT.end);
  const start = pointAt(MAIN, MAIN.len - LEAD);
  assert.ok(Math.hypot(c0.x - start.x, c0.z - start.z) < 0.6, 'on the road where the drive left off');
  assert.ok(Math.abs(Math.hypot(cH.x - CRASH.x, cH.z - CRASH.z) - STOP) < 0.2, 'stopped dead at the pine');
  assert.ok(Math.hypot(cE.x - cH.x, cE.z - cH.z) < 1e-6 && cE.v === 0, 'and stays there');
  assert.ok(f.v > 12 && f.v < 16, `into it at ${f.v.toFixed(1)} m/s`);
  assert.ok(Math.abs(cE.yaw - cH.yaw) > 0.1, 'slewed by the blow');
  // the swerve: aside and back
  const mid = f.carAt((CT.swerve + CT.hit) / 2), on = f._at(mid.d, {});
  assert.ok(Math.hypot(mid.x - on.x, mid.z - on.z) > 1, 'the wheel thrown over');
  // the arm: lying across the road behind at the start; the second blow lands behind the car — a miss
  const a0 = f.armAt(0);
  assert.ok(a0 && a0.u > CHASE.rise + CHASE.slam, 'lying behind when it begins');
  const a = f.armAt(CT.slam), cs = f.carAt(CT.slam);
  assert.ok(Math.abs(a.u - CHASE.rise) < 1e-6, 'comes down at its time');
  const miss = Math.hypot(a.T.x - cs.x, a.T.z - cs.z);
  assert.ok(miss > CHASE.reach && miss < 9, `just behind: ${miss.toFixed(1)} m`);
  assert.equal(f.armAt(CT.hit), null, 'gone into the ground by the pine');
  // the shots, the picture, the pieces
  assert.deepEqual(['back', 'slam', 'ahead', 'black', 'wreck', 'black', 'carried', 'black', 'post', 'black'], [0.5, 2, 3, 5, 8, 10.8, 12, 14.7, 16, 18.4].map((x) => f.shotAt(x)));
  assert.equal(f.fadeAt(3), 1);
  assert.equal(f.fadeAt(6), 0, 'black after the blow');
  assert.ok(f.fadeAt(9) > 0.8 && f.fadeAt(12.5) > 0.8 && f.fadeAt(16.5) > 0.8, 'the pieces come out of it');
  assert.equal(f.fadeAt(10.9), 0);
  assert.equal(P.pts.length > 100, true);
  // run it: the keepers walk into the pieces with their light, the door of your house opens and shuts again
  const H = game.world.houses.find((h) => h.id === houseFor(game.baseSeed, 0).id);
  const door = game.doors.list.find((d) => d.id === H.id);
  let lantern = false, opened = false, seenK = false;
  const n0 = scene.children.length;
  for (let i = 0; i < 60 * 20 && game.level2.chapter.id === 'crash'; i++) {
    frame(game);
    if (!game.level2.film) break;
    const ff = game.level2.film;
    if (ff.keepers?.[0].rig.root.visible) seenK = true;
    const out = [];
    ff.lightSources(out);
    if (out.some((l) => l.id === ff.keepers?.[0])) lantern = true;
    if (door.open) opened = true;
  }
  assert.ok(seenK && lantern, 'the keeper and his light in the pieces');
  assert.ok(opened, 'he goes out by the door of the house you will wake in');
  assert.equal(game.level2.chapter.id, 'village', 'and the film goes on into chapter 4 by itself');
  assert.equal(door.open, false, 'shut behind him');
  assert.equal(shared.uHead.value.w, 0, 'the headlight went with the film');
  assert.ok(scene.children.length <= n0 + 1 + game.level2.play.papers.length, 'the film took its things with it (what is left: the keeper, the map on the tables)');
});

test('the crash film is a function of its clock: seek, hold, and a skip only from the host', () => {
  const { game } = mkGame('bog', still());
  game.setupSolo();
  game.reset({ seed: 7, chapter: 2 });
  const f = game.level2.film;
  frame(game);
  f.seek(12.3);
  f.hold = true;
  frame(game);
  const cam = new THREE.PerspectiveCamera();
  assert.ok(f.applyCamera(cam));
  const a = cam.position.clone();
  frame(game);
  f.applyCamera(cam);
  assert.ok(cam.position.distanceTo(a) < 1e-6, 'held');
  assert.equal(f.cameraAt(12.3).kind, 'carried');
  f.hold = false;
  frame(game, 1 / 60, ['confirm']);
  for (let i = 0; i < 60; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'village', 'Enter skips it (after a short fade)');
  // a guest's Enter does nothing
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  g2.role = 'client';
  g2.sync = { ev() {}, send() {}, process() {}, tick() {} };
  g2.coop = { rules: {}, toHost() {} };
  g2.reset({ seed: 7, chapter: 2 });
  g2.level2.update(1 / 60, { events: ['confirm'], look: { dx: 0, dy: 0 } });
  for (let i = 0; i < 90; i++) g2.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.equal(g2.level2.film.skipping, false);
  assert.equal(g2.level2.chapter.id, 'crash');
});

test('you come to tied to the post of your house, facing its door — and the keeper is at that door, looking in', () => {
  const { game, v, P, K } = village();
  assert.equal(PLAYS.village, VillagePlay);
  assert.equal(game.level2.chapter.id, 'village');
  assert.equal(P.st, 'bound');
  assert.equal(P.H.id, houseFor(game.baseSeed, 0).id);
  const p = game.player;
  assert.ok(Math.hypot(p.x - P.H.post.x, p.z - P.H.post.z) < 0.6, 'at the post');
  assert.ok(game.doors.indoors(p.x, p.z), 'inside');
  assert.ok(Math.abs(p.eyeCur - 0.98) < 0.05, 'sitting');
  assert.equal(K.mode, 'look');
  assert.ok(Math.hypot(K.x - P.door.out.x, K.z - P.door.out.z) < 0.5, 'at your door');
  assert.equal(P.door.open, false, 'shut');
  assert.equal(game.level2.seated, true, 'your hands are not yours');
  // your head turns, your body does not go anywhere
  for (let i = 0; i < 30; i++) game.update(1 / 60, { events: [], look: { dx: 0.05, dy: 0 } });
  assert.ok(Math.hypot(p.x - P.seat.x, p.z - P.seat.z) < 1e-6);
  assert.ok(Math.abs(p.yaw - P.seat.yaw) <= 1.31, 'only so far round');
  // his round: your house first, and its nearest
  assert.equal(v.round[0], P.hi);
  assert.equal(v.round.length, 4, 'alone: your house and three beside it');
});

test('the rope: A then D, some 56 pulls; every pull creaks — within his hearing he comes in and pulls it tight again', () => {
  assert.equal(ropeStep(0, 1, 0), ROPE.hit);
  assert.ok(Math.ceil(1 / ROPE.hit) >= 50, 'it is work');
  assert.ok(ropeStep(0.5, 0, 10) < 0.5, 'and a knot left alone takes some back');
  const { game, inp, v, P, K } = village();
  // he is twelve metres off, walking: a few pulls and he is coming
  K.mode = 'walk'; K.t = 0; K.x = P.door.out.x + 12; K.z = P.door.out.z;
  pull(game, inp, 64, 8);
  assert.ok(v.local.meter > 0.05, 'the rope gave a little');
  assert.ok(P.creak >= 3, 'and creaked');
  assert.equal(K.mode, 'go');
  assert.equal(K.target, v.me);
  const modes = [];
  for (let i = 0; i < 60 * 25; i++) { frame(game); if (modes.at(-1) !== K.mode) modes.push(K.mode); }
  assert.deepEqual(modes.slice(0, 4), ['go', 'check', 'leave', 'walk'], 'in, the knots, out, on his round');
  assert.equal(v.local.meter, 0, 'tight again');
  assert.equal(P.tight, 1);
  assert.equal(P.door.open, true, 'he opened your door to come in');
  // far off, he does not hear: the rope goes
  K.mode = 'walk'; K.x = P.door.out.x + 90; K.z = P.door.out.z;
  pull(game, inp, 60 * 30, 6, () => P.st !== 'bound');
  assert.equal(P.st, 'free');
  assert.equal(game.level2.seated, false);
  assert.notEqual(K.mode, 'go', 'he never knew');
});

test('free: E at the door, and a keeper who sees you runs you down, carries you back and ties you up again', () => {
  const { game, v, P, K } = village();
  K.mode = 'walk'; K.x += 200;
  P.st = 'free';
  const p = game.player, d = P.door;
  put(game, d.inn.x, d.inn.z);
  p.yaw = yawTo(p.x, p.z, d.mid.x, d.mid.z);
  frame(game, 1 / 60, ['useDown']);
  assert.equal(d.open, true, 'E opens it');
  put(game, d.out.x, d.out.z);
  K.x = d.out.x + 7; K.z = d.out.z; K.yaw = yawTo(K.x, K.z, p.x, p.z); K.mode = 'walk';
  const modes = [];
  for (let i = 0; i < 60 * 40 && !(P.st === 'bound' && K.mode === 'leave'); i++) { frame(game); if (modes.at(-1) !== K.mode) modes.push(K.mode); }
  assert.deepEqual(modes.slice(0, 3), ['chase', 'carry', 'tie']);
  assert.equal(P.st, 'bound');
  assert.equal(P.caught, 1);
  assert.equal(v.local.meter, 0);
  assert.ok(Math.hypot(p.x - P.seat.x, p.z - P.seat.z) < 1e-6, 'back at your post');
  assert.ok(v.cues.has('caught:' + v.me));
});

test('the second time he does not bother with the rope: alone, the chapter starts again', () => {
  const { game, v, P, K } = village();
  P.st = 'free';
  P.caught = 1;
  const p = game.player, d = P.door;
  d.open = true;
  put(game, d.out.x, d.out.z);
  K.x = d.out.x + 1; K.z = d.out.z; K.mode = 'walk';
  frame(game);
  frame(game);
  assert.equal(P.st, 'dead');
  assert.equal(K.mode, 'kill');
  assert.ok(v.cues.has('kill:' + v.me));
  for (let i = 0; i < 60 * (VILLAGE.deadT + 0.5); i++) frame(game);
  assert.equal(game.level2.chapter.id, 'village');
  assert.notEqual(game.level2.play, v, 'again from its start');
  assert.equal(game.level2.tries, 1);
  assert.equal(game.level2.play.mine.st, 'bound');
  assert.notEqual(game.level2.play.K.mode === 'look' && game.level2.play.K.t < KEEP.look, true, 'a retry: he has just left your door');
  assert.ok(p);
});

test('everyone free ends the chapter — (5.0e) with the four pieces of the map in one pair of hands', () => {
  const { game, v, P, K } = village();
  K.mode = 'walk'; K.x += 300;
  P.st = 'free';
  put(game, P.door.out.x + 3, P.door.out.z + 3);
  for (let i = 0; i < 60 * 4; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'village', 'free, but the map is in pieces');
  for (const q of v.pieces) q.holder = v.me;
  for (let i = 0; i < 60 * (VILLAGE.allT + 0.4); i++) frame(game);
  assert.equal(game.level2.chapter.id, 'generator');
});

test('his round: every captive\'s door and their neighbours, nearest first — and he walks it without sticking', () => {
  const H = HOUSES.map((h) => ({ ...h }));
  const kept = keptHouses(H, [2, 9], false);
  assert.deepEqual(kept.slice(0, 2), [2, 9]);
  assert.equal(kept.length, 4, 'one neighbour each in a room');
  assert.equal(keptHouses(H, [5], true).length, 4, 'three alone');
  const r = roundOf(H, 2, kept);
  assert.equal(r[0], 2);
  assert.deepEqual([...r].sort(), [...kept].sort());
  // a long watch: he looks in at every door of his round, again
  const { game, v, K } = village(99); // (you stay in your rope and keep still: nothing for him to see or hear)
  const looked = new Set();
  let still = 0, lx = K.x, lz = K.z;
  for (let i = 0; i < 60 * 240; i++) {
    frame(game, 1 / 30);
    if (K.mode === 'look') looked.add(v.round[K.ri]);
    if (K.mode === 'walk') { if (Math.hypot(K.x - lx, K.z - lz) < 0.002) still++; else still = 0; assert.ok(still < 90, 'stuck on his way'); }
    lx = K.x; lz = K.z;
  }
  assert.equal(looked.size, v.round.length, 'every door of his round');
  // a seat looks at its doorway
  const S = seatAt(game.world.houses[0], game.doors.list[0]);
  assert.ok(Number.isFinite(S.yaw));
});

test('co-op: the host sends the keeper and every rope; a guest follows, sends its own rope, and a friend unties a friend', () => {
  const inp = still();
  const { game } = mkGame('bog', inp);
  const sent = [];
  game.setupSolo();
  game.role = 'host';
  game.player.id = 'H';
  game.coop = { rules: {}, toHost() {}, hostId: 'H' };
  game.sync = { ev() {}, send: (type, d) => sent.push([type, d]), process() {}, tick() {} };
  game.reset({ seed: 11, chapter: 3 });
  const v = game.level2.play;
  // a friend in the room: tied in a house of their own
  v.players.set('G', { id: 'G', st: 'bound', hi: (v.mine.hi + 3) % v.houses.length, meter: 0, caught: 0, creak: 0, tight: 0, spd: 0, px: null, pz: null });
  const G = v.players.get('G');
  G.H = v.houses[G.hi]; G.door = v._door(G.hi); G.seat = seatAt(G.H, G.door);
  game.remotes.set('G', { id: 'G', slot: 1, x: G.seat.x, z: G.seat.z, alive: true, crouching: false, speed: 0, rig: null });
  v.K.x += 300;
  const step = () => game.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  for (let i = 0; i < 12; i++) step();
  const vg = sent.filter(([type]) => type === 'vg');
  assert.ok(vg.length >= 1, 'the host sends the village');
  const pk = vg.at(-1)[1];
  assert.equal(pk.k.length, 6);
  assert.deepEqual(pk.p.map((e) => [e[0], STATES[e[1]]]).sort(), [['G', 'bound'], ['H', 'bound']]);
  // the guest's rope: its meter and creaks come in; it tears
  v.hostStruggle('G', [0.4, 3]);
  assert.equal(G.meter, 0.4);
  assert.equal(G.creak, 3, 'three creaks: each one a sound at their post');
  v.hostStruggle('G', [1, 4]);
  step();
  assert.equal(G.st, 'free');
  // an untie is checked against where the untier stands
  G.st = 'bound';
  v.hostUntie('G', 'H');
  assert.equal(G.st, 'bound', 'the host is nowhere near their post');
  v.mine.st = 'free';
  put(game, G.seat.x + 0.5, G.seat.z);
  v.hostUntie('G', 'H');
  assert.equal(G.st, 'free');
  // a guest: applies the host's packet (its own state and the keeper)
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  g2.role = 'client';
  g2.player.id = 'G';
  g2.player.slot = 1;
  const up = [];
  g2.coop = { rules: {}, toHost: (type, d) => up.push([type, d]), hostId: 'H' };
  g2.sync = { ev() {}, send() {}, process() {}, tick() {} };
  g2.reset({ seed: 11, chapter: 3 });
  const w = g2.level2.play;
  w.applyVillage({ k: [12, -30, 0.5, MODES.indexOf('chase'), 4.8, 'G'], p: [['G', STATES.indexOf('bound'), w.mine.hi, 0, 0, 0, 0]], c: [] });
  assert.equal(w.K.mode, 'chase');
  for (let i = 0; i < 60; i++) g2.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.ok(Math.hypot(w.K.x - 12, w.K.z + 30) < 0.5, 'the guest\'s keeper goes where the host has him');
  // its own rope goes up the wire
  const s = g2.input || still();
  g2.input = s;
  let sign = 1;
  for (let i = 0; i < 40; i++) { if (i % 6 === 0) { sign = -sign; s.move.x = sign; } g2.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } }); }
  const vq = up.filter(([type]) => type === 'vq');
  assert.ok(vq.length >= 1 && vq.at(-1)[1][0] > 0 && vq.at(-1)[1][1] >= 1, 'its meter and its creaks go to the host');
  assert.equal(g2.level2.chapter.id, 'village', 'a guest never ends the chapter');
  // the wire
  const net = src('src/game/netsync.js');
  assert.match(net, /case 'vg':[\s\S]*?applyVillage\?\.\(d\)/);
  assert.match(net, /case 'vq':[\s\S]*?hostStruggle\?\.\(pid, d\)/);
  assert.match(net, /case 'vu':[\s\S]*?hostUntie\?\.\(d, pid\)/);
  assert.ok(PROTOCOL >= 25, 'the village moved the wire');
});

test('the words and the sounds of chapters 3 and 4', () => {
  for (const L of ['ru', 'en']) {
    setLang(L);
    for (const k of ['villageTied', 'villageTiedTouch', 'villageWork', 'villageNear', 'villageCarried', 'villageFind', 'villageOut', 'villageAll', 'villageCaught', 'villageCaughtS', 'villageKilled', 'villageWait', 'l2Goal_village']) assert.notEqual(t(k), k, `${L}.${k}`);
  }
  setLang('ru');
  assert.match(t('villageTied'), /^A \/ D/);
  const au = src('src/audio/audio.js');
  for (const fn of ['crashSmash(x, y, z)', 'ringing()', 'ropeCreak(x, y, z, k = 1)', 'keeperStep(x, y, z, k = 1)', 'lanternSqueak(x, y, z)']) assert.ok(au.includes('  ' + fn + ' {'), fn);
  const cf = src('src/game/crashFilm.js');
  for (const s of ['crashSmash', 'ringing', 'tyreScreech', 'armSlam', 'keeperStep', 'ropeTie', 'heartbeat']) assert.ok(cf.includes(s + '?.('), s);
  const vl = src('src/game/village.js');
  for (const s of ['ropeCreak', 'keeperStep', 'lanternSqueak', 'koThud', 'cleaverStrike', 'ropeRub']) assert.ok(vl.includes(s + '?.('), s);
  assert.deepEqual(CHAPTERS.filter((c) => FILMS[c.id] || PLAYS[c.id]).map((c) => c.id), ['convoy', 'road', 'crash', 'village', 'generator']);
});
