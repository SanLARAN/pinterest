// 5.0e: «Топь», chapters 4 and 5 — the map of the bog in four pieces, and the mouth of the bog: the Корень's nerves
// on the open ground, the generator everyone has to come to, the lamps down the causeway, the gate, the bikes.
// These pin where the pieces are and how they change hands, the drawing of the map with holes for the missing
// quarters, the end of the village (free + whole), chapter 5 starting where you stood, the nerves (stand still and
// the ground comes up), the generator (everyone, three pulls), the gate and the lamps, the wire and TAB.
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
const face = (game, x, z) => { const p = game.player; p.yaw = Math.atan2(-(x - p.x), -(z - p.z)); };

const { PIECES, piecePlan, tableSpot, quarterOf, drawBogMap, MID, BOG_VIEW } = await import('../src/game/bogMap.js');
const { GeneratorPlay, BogMouth, NERVE, GEN, EDGE, nervePlan, onNerves, bikeSpots } = await import('../src/game/bogMouth.js');
const { VillagePlay, PIECE, seatAt } = await import('../src/game/village.js');
const { insideHouse } = await import('../src/game/keeper.js');
const { ROOT, rootLife } = await import('../src/game/roadDrive.js');
const { GATE, GENERATOR, HOUSES } = await import('../src/world/swamp.js');
const { PLAYS, CHAPTERS } = await import('../src/game/level2.js');
const { PROTOCOL } = await import('../src/net/net.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// a 2D context that remembers what was written and how many things were filled
function paper() {
  const log = { text: [], fills: 0 };
  const noop = () => {};
  const ctx = new Proxy({}, {
    get: (_, k) => {
      if (k === 'fillText') return (s) => log.text.push(String(s));
      if (k === 'fill' || k === 'fillRect') return () => { log.fills++; };
      if (k === 'createRadialGradient') return () => ({ addColorStop: noop });
      return noop;
    },
    set: () => true,
  });
  return { ctx, log };
}

// a «Топь» game in chapter `ch` (0-based), solo or as a host with friends standing at given places
function bog(ch, seed = 4242, friends = []) {
  const inp = still();
  const { game, world } = mkGame('bog', inp);
  const sent = [];
  game.setupSolo();
  if (friends.length) {
    game.role = 'host';
    game.player.id = 'H';
    game.coop = { rules: {}, toHost() {}, hostId: 'H' };
    game.sync = { ev() {}, send: (type, d) => sent.push([type, d]), process() {}, tick() {} };
    for (const f of friends) game.remotes.set(f.id, { id: f.id, slot: f.slot, x: f.x ?? 0, z: f.z ?? 0, alive: true, crouching: false, speed: 0, rig: null });
  }
  game.reset({ seed, chapter: ch });
  return { game, world, inp, sent, step: (n = 1, ev = []) => { for (let i = 0; i < n; i++) game.level2.update(1 / 60, { events: ev, look: { dx: 0, dy: 0 } }); } };
}

test('the map in four: each seat holds its own piece, the rest lie on tables of the keeper\'s houses — never where someone is tied', () => {
  const plan = piecePlan([{ id: 'A', slot: 0 }, { id: 'B', slot: 2 }], [5, 3, 9, 7], [5]);
  assert.deepEqual(plan.map((q) => [q.k, q.holder, q.hi]), [[0, 'A', null], [1, null, 3], [2, 'B', null], [3, null, 9]]);
  const solo = piecePlan([{ id: 'me', slot: 0 }], [2, 3, 1, 5], [2]);
  assert.deepEqual(solo.map((q) => q.holder), ['me', null, null, null]);
  assert.deepEqual(solo.slice(1).map((q) => q.hi), [3, 1, 5], 'alone: three houses of his round');
  assert.equal(PIECES, 4);
  // the quarters: north-west, north-east, south-west, south-east (north is −z)
  assert.deepEqual([quarterOf(MID.x - 1, MID.z - 1), quarterOf(MID.x + 1, MID.z - 1), quarterOf(MID.x - 1, MID.z + 1), quarterOf(MID.x + 1, MID.z + 1)], [0, 1, 2, 3]);
  assert.ok(GATE.x > BOG_VIEW.x0 && GATE.x < BOG_VIEW.x1 && GATE.z > BOG_VIEW.z0 && GATE.z < BOG_VIEW.z1, 'the gate is on it');
  // a table is inside its house
  const { world } = mkGame('bog', still());
  for (const H of world.houses.filter((h) => HOUSES.some((q) => q.id === h.id))) {
    const s = tableSpot(H);
    assert.ok(insideHouse(H, s.x, s.z, -0.3), `${H.id}: the table is indoors`);
    assert.ok(s.y > H.y + 0.9 && s.y < H.y + 1.05, 'on the table, not the floor');
  }
});

test('drawing it: the quarters in your hands, a torn hole for each one missing, the places named', () => {
  setLang('ru');
  const a = paper();
  drawBogMap(a.ctx, 900, [true, false, false, false], { x: -150, z: -250, yaw: 0 }, []);
  assert.equal(a.log.text.filter((s) => s === '?').length, 3, 'three holes');
  assert.ok(a.log.text.includes('кусков: 1 из 4'));
  const b = paper();
  drawBogMap(b.ctx, 900, [true, true, true, true], { x: GATE.x - 10, z: GATE.z, yaw: Math.PI / 2 }, []);
  assert.equal(b.log.text.filter((s) => s === '?').length, 0, 'whole');
  for (const k of ['bogMapTitle', 'bogMapVillage', 'bogMapGate', 'bogMapGenerator', 'bogMapCauseway', 'bogMapCliff', 'bogMapLake', 'bogMapPier', 'l2MapYou']) assert.ok(b.log.text.includes(t(k)), k);
  assert.ok(b.log.text.includes('кусков: 4 из 4'));
});

test('the village: E takes a piece off a table; the map whole and everyone free ends the chapter — the map goes on in those hands', () => {
  const { game } = bog(3);
  const v = game.level2.play;
  assert.ok(v instanceof VillagePlay);
  assert.equal(v.pieces.length, 4);
  assert.equal(v.held(), 1, 'you come to with your own piece');
  assert.ok(v.pieces.filter((q) => !q.holder).every((q) => q.at && v.papers[q.k]), 'the others lie somewhere you can see them');
  v.mine.st = 'free';
  v.K.x += 400;
  for (const q of v.pieces) {
    if (q.holder) continue;
    put(game, q.at.x + 0.7, q.at.z);
    face(game, q.at.x, q.at.z);
    frame(game);
    assert.ok(v.papers[q.k].visible, 'on the table');
    frame(game, 1 / 60, ['useDown']);
    assert.equal(q.holder, v.me);
    frame(game);
    assert.equal(v.papers[q.k].visible, false, 'in your hands now');
  }
  assert.equal(v._whole(), v.me);
  for (let i = 0; i < 60 * (2.2 + 0.4); i++) frame(game);
  assert.equal(game.level2.chapter.id, 'generator');
  assert.equal(game.level2.mapHolder, v.me);
});

test('the village in a room: E at a friend gives them your pieces; a body that falls drops what it carried', () => {
  const { game, step } = bog(3, 4242, [{ id: 'G', slot: 1 }]);
  const v = game.level2.play;
  assert.deepEqual(v.pieces.filter((q) => q.holder).map((q) => [q.k, q.holder]), [[0, 'H'], [1, 'G']]);
  const G = v.players.get('G'), r = game.remotes.get('G');
  v.mine.st = 'free'; G.st = 'free'; v.K.x += 400;
  // stand by the friend: E gives
  r.x = game.player.x + 1; r.z = game.player.z;
  face(game, r.x, r.z);
  step(1, ['useDown']);
  assert.equal(v.held('G'), 2, 'both pieces with them');
  assert.equal(v.held('H'), 0);
  assert.ok([...v.cues].some((c) => c.startsWith('give:G:H')));
  // too far: refused
  assert.equal(v.hostPiece('H', ['give', 'G']), false, '(nothing to give)');
  r.x += 20;
  v.pieces[2].holder = 'H';
  assert.equal(v.hostPiece('H', ['give', 'G']), false, 'out of reach');
  // a guest takes a piece only from where it lies
  const q = v.pieces[3];
  assert.equal(v.hostPiece('G', ['take', 3]), false, 'not from across the village');
  r.x = q.at.x; r.z = q.at.z;
  assert.equal(v.hostPiece('G', ['take', 3]), true);
  // they fall: what they carried lies where they fell
  G.st = 'dead';
  step(1);
  assert.equal(v.held('G'), 0);
  assert.ok(v.pieces.filter((x) => !x.holder && x.at).length >= 3);
  assert.ok(Math.hypot(v.pieces[1].at.x - r.x, v.pieces[1].at.z - r.z) < 0.1, 'at the body');
  // the wire: the pieces ride 'vg', the requests 'vp'
  assert.ok(v.pack().m.length === 4);
  assert.match(src('src/game/netsync.js'), /case 'vp':[\s\S]*?hostPiece\?\.\(pid, d\)/);
});

test('chapter 5 begins where the village left you; a retry begins at the edge of the village', () => {
  const { game } = bog(3);
  const v = game.level2.play;
  v.mine.st = 'free';
  v.K.x += 400;
  for (const q of v.pieces) q.holder = v.me;
  put(game, -100, -150);
  for (let i = 0; i < 60 * 2.6; i++) frame(game);
  assert.equal(game.level2.chapter.id, 'generator');
  assert.ok(Math.hypot(game.player.x + 100, game.player.z + 150) < 1, 'nobody was moved');
  assert.ok(game.level2.play instanceof GeneratorPlay);
  assert.equal(PLAYS.generator, GeneratorPlay);
  assert.equal(CHAPTERS.find((c) => c.id === 'generator').stay, true);
  game.level2.goto(4);
  assert.ok(Math.hypot(game.player.x - EDGE.x, game.player.z - EDGE.z) < 3, 'again: from the edge');
});

test('the nerves: stand on them and the ground swells, and a second later it comes up; walk over them and nothing happens', () => {
  const N = nervePlan(4242);
  assert.equal(N.length, NERVE.n);
  for (const q of N) {
    assert.ok(Math.hypot(q.x - GATE.x, q.z - GATE.z) > NERVE.keep && Math.hypot(q.x - GENERATOR.x, q.z - GENERATOR.z) > NERVE.keep, 'clear of the mouth');
    assert.ok(HOUSES.every((H) => Math.hypot(q.x - H.x, q.z - H.z) > NERVE.r + 6), 'clear of the houses');
  }
  assert.ok(onNerves(N, N[0].x + 3, N[0].z) && !onNerves(N, GATE.x, GATE.z));
  assert.deepEqual(nervePlan(4242), N, 'the same night, the same ground');
  // standing: the swell at 2.8 s, the strike ROOT.swell later
  const { game, step } = bog(4);
  const g = game.level2.play, n0 = g.nerves[0];
  put(game, n0.x, n0.z);
  step(10);
  g.mine.spd = 0; g.mine.px = n0.x; g.mine.pz = n0.z; // (the teleport is not a sprint)
  step(Math.round(60 * (NERVE.still - 0.2)));
  assert.equal(g.strikes.length, 0);
  step(20);
  assert.equal(g.strikes.length, 1, 'the ground swells');
  assert.ok([...g.cues].some((c) => c.startsWith('swell:')));
  assert.ok(g.danger > 0.5);
  step(Math.round(60 * (ROOT.swell + 0.1)));
  assert.equal(g.mine.alive, false, 'it had you');
  assert.ok([...g.cues].some((c) => c.startsWith('grab:')));
  step(Math.round(60 * (GEN.deadT + 0.3)));
  assert.equal(game.level2.chapter.id, 'generator');
  assert.notEqual(game.level2.play, g, 'alone: the chapter again');
  // walking over them
  const h = bog(4).game, w = h.level2.play, q = w.nerves[1];
  put(h, q.x - 6, q.z);
  for (let i = 0; i < 60 * 6; i++) { h.player.x = q.x - 6 + (i / 60) * 2; h.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } }); }
  assert.equal(w.strikes.length, 0, 'moving: nothing');
  assert.equal(w.mine.alive, true);
  // ...and if you step off as it swells, it misses
  const k = bog(4).game, u = k.level2.play;
  u.strikes.push({ x: 0, z: -150, age: 0, pid: u.me, n: 99 });
  put(k, 3, -150);
  for (let i = 0; i < 60 * 2; i++) k.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.equal(u.mine.alive, true, 'three metres off: it misses');
  assert.ok(rootLife > ROOT.swell);
});

test('the generator: not until everyone alive is here; hold E — three pulls, the third catches; the lamps, the gate, the bikes', () => {
  const { game, inp, sent, step } = bog(4, 7, [{ id: 'G', slot: 1, x: 0, z: -170 }]);
  const g = game.level2.play, M = game.level2.mouth, r = game.remotes.get('G');
  assert.ok(M instanceof BogMouth);
  assert.equal(M.bikes.length, 2, 'a Kugoo for each of us');
  for (const [i, b] of M.bikes.entries()) {
    const s = bikeSpots(2)[i];
    assert.ok(Math.hypot(b.position.x - s.x, b.position.z - s.z) < 1e-6);
    assert.ok(s.x < GATE.x, 'inside the gate');
  }
  assert.equal(M.open, 0, 'shut');
  assert.equal(M.lit, 0, 'dark');
  assert.equal(game.world.col.free(GATE.x, GATE.z - 1, 0.3), false, 'the leaves bar the way');
  put(game, GENERATOR.x + 1.5, GENERATOR.z + 1);
  inp.useHeld = true;
  step(60 * 4);
  assert.equal(g.started, false, 'the friend is not here');
  assert.deepEqual(g.gathered(), { n: 1, m: 2, all: false });
  r.x = GENERATOR.x + 4; r.z = GENERATOR.z;
  step(Math.round(60 * (GEN.pull - 0.3)));
  assert.equal(g.started, false, 'the third pull has not come');
  step(30);
  assert.equal(g.started, true, 'it caught');
  inp.useHeld = false;
  step(60);
  assert.ok(M.open > 0.2 && M.lit >= 2, 'the gate swinging, the lamps coming on');
  step(60 * 3);
  assert.equal(M.open, 1);
  assert.equal(M.lit, game.world.swamp.lamps.length, 'all the way down the causeway');
  assert.ok(game.world.col.free(GATE.x, GATE.z - 1, 0.3), 'the way is open');
  const out = [];
  game.level2.lightSources(out);
  assert.ok(out.filter((l) => game.world.swamp.lamps.includes(l.id)).length === 2, 'the two nearest lamps light the ground');
  assert.ok(sent.some(([type, d]) => type === 'gv' && d.s === 1));
  step(60 * GEN.doneT);
  assert.equal(game.level2.chapter.id, 'escape', 'the way is open: chapter 6');
  assert.equal(M.open, 1, 'and stays open');
  // a jump straight to a later chapter finds it open and lit
  const later = bog(5).game;
  assert.equal(later.level2.mouth.open, 1);
  assert.equal(later.level2.mouth.lit, later.world.swamp.lamps.length);
});

test('co-op: the host sends chapter 5; a guest follows it and pulls the cord through the host', () => {
  const { game } = bog(4, 7, [{ id: 'G', slot: 1, x: GENERATOR.x + 2, z: GENERATOR.z }]);
  const g = game.level2.play;
  put(game, GENERATOR.x - 3, GENERATOR.z);
  assert.equal(g.hostStart('G'), true, 'a guest\'s pull counts when everyone is here');
  const pk = g.pack();
  assert.equal(pk.s, 1);
  assert.equal(pk.h, game.level2.mapHolder);
  // a guest
  const g2 = mkGame('bog', still()).game;
  g2.setupSolo();
  g2.role = 'client';
  g2.player.id = 'G';
  g2.player.slot = 1;
  const up = [];
  g2.coop = { rules: {}, toHost: (type, d) => up.push([type, d]), hostId: 'H' };
  g2.sync = { ev() {}, send() {}, process() {}, tick() {} };
  g2.reset({ seed: 7, chapter: 4 });
  const w = g2.level2.play;
  w.applyMouth({ p: [['G', 1]], s: 0, st: 0, r: [[1, -150, 0.5, 'G', 3]], h: 'H', c: ['swell:3'] });
  assert.equal(w.strikes.length, 1);
  assert.equal(g2.level2.mapHolder, 'H', 'the map is with the host');
  for (let i = 0; i < 30; i++) g2.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.ok(w.strikes[0].age > 0.9, 'its clock runs on');
  put(g2, GENERATOR.x + 1.5, GENERATOR.z);
  w.applyMouth({ p: [['G', 1]], s: 0, st: 0, r: [], h: 'H', c: [] });
  g2.input.useHeld = true;
  for (let i = 0; i < 60 * (GEN.pull + 0.3); i++) g2.level2.update(1 / 60, { events: [], look: { dx: 0, dy: 0 } });
  assert.ok(up.some(([type]) => type === 'gq'), 'the pull goes to the host');
  assert.equal(w.started, false, 'and only the host starts it');
  w.applyMouth({ p: [['G', 1]], s: 1, st: 0.2, r: [], h: 'H', c: ['start'] });
  assert.equal(w.started, true);
  assert.equal(g2.level2.mouth.want, 1, 'the guest\'s gate opens too');
  assert.equal(g2.level2.chapter.id, 'generator', 'a guest never ends the chapter');
  const net = src('src/game/netsync.js');
  assert.match(net, /case 'gv':[\s\S]*?applyMouth\?\.\(d\)/);
  assert.match(net, /case 'gq':[\s\S]*?hostStart\?\.\(pid\)/);
  assert.equal(PROTOCOL, 26);
});

test('TAB holds up the map: in the village, whatever pieces you have; at the mouth, only in the hands that carry it', () => {
  const { game, inp } = bog(3);
  const v = game.level2.play;
  inp.peekHeld = true;
  frame(game);
  assert.equal(v.mapOpen, undefined, 'tied: your hands are not yours');
  v.mine.st = 'free';
  v.K.x += 400;
  frame(game);
  assert.equal(v.mapOpen, true, 'free, with your piece');
  for (const q of v.pieces) if (q.holder === v.me) q.holder = null;
  frame(game);
  assert.equal(v.mapOpen, false, 'nothing to look at');
  const h = bog(4, 7, [{ id: 'G', slot: 1, x: -20, z: -170 }]);
  h.inp.peekHeld = true;
  h.game.level2.mapHolder = 'G';
  h.step(2);
  assert.equal(h.game.level2.play.mapOpen, false, 'the map is in the friend\'s hands');
  h.game.level2.mapHolder = 'H';
  h.step(2);
  assert.equal(h.game.level2.play.mapOpen, true);
});

test('the words and the sounds of 5.0e', () => {
  for (const L of ['ru', 'en']) {
    setLang(L);
    for (const k of ['villagePieces', 'villageNoPiece', 'villageMapDone', 'villageMapWith', 'villageGotPiece', 'villageGotMap', 'usePiece', 'useGiveMap', 'bogMapTitle', 'bogMapPieces', 'useGen', 'useGenWait', 'genGoMap', 'genGoWith', 'genHere', 'genStarted', 'genNerves', 'genTaken', 'l2Goal_generator', 'l2Goal_village']) assert.notEqual(t(k), k, `${L}.${k}`);
  }
  setLang('ru');
  const au = src('src/audio/audio.js');
  for (const fn of ['paperRustle(x, y, z)', 'cordPull(x, y, z, k = 0.6)', 'gateSwing(x, y, z)', 'lampOn(x, y, z)']) assert.ok(au.includes('  ' + fn + ' {'), fn);
  const m = src('src/game/bogMouth.js');
  for (const s of ['cordPull', 'gateSwing', 'lampOn', 'rootSwell', 'rootStrike', 'genHum']) assert.ok(m.includes(s + '?.('), s);
  assert.ok(src('src/game/village.js').includes('paperRustle?.('));
  assert.ok(seatAt && PIECE.takeR > 1);
});
