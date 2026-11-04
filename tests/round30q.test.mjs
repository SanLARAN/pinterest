// 3.0q: the shelter under the peat works' camp, and the rift at the end of it.
//
// Three things are checked here. The place: the cap stands on the camp's island, the corridor runs north under
// the camp with peat over its roof the whole way, and the works' gate on the track out stands past the car. The
// script: one switch, then the gate, the crack, the lamps going out, the alarm and three minutes of door, in that
// order and with nothing left to chance (ShelterScript). And the joining-up: five pumps only unlock the cap, the
// gate moves only when the breaker is thrown, and the shelter can end the night.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

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

const { World } = await import('../src/world/world.js');
const { BUNKER, SHELTER, WORKS, DOOR_TIME, HORDE_MAX, ShelterScript, bunkerDepth, bunkerFloor, bunkerRoom, inBunker, T_GATE, T_STIR, T_BLACK, T_ALARM } = await import('../src/world/bunker.js');
const { t, setLang, getLang } = await import('../src/core/i18n.js');

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let world = null;
const bog = () => world || (world = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());
const campSite = (w) => w.landmarks.find((l) => l.id === 'camp');

// ---- 1. the place ----
test('the shelter is under the camp: a landing, a long corridor, a vault at the far end', () => {
  const w = bog();
  const B = w.bunker;
  assert.ok(B, 'the bog has a shelter now — the forest has none');
  assert.equal(w.landmarks.some((l) => l.id === 'yard'), false, 'and there is no forestry yard on this участок');
  // the floor is measured from the peat, not guessed: the vault is the tall room and its roof has to stay under it
  assert.ok(B.depth >= BUNKER.depth, `the floor is at least the design depth down (${B.depth.toFixed(2)} m)`);
  assert.ok(Math.abs(B.y - (B.groundY - B.depth)) < 1e-9, 'the floor is the camp\'s ground, that far down');
  assert.equal(bunkerDepth(w, B.groundY), B.depth, 'and the depth is the one the ground asked for');
  assert.ok(inBunker(B.landing.x0 + 1, B.landing.z0 + 1), 'the landing is a room');
  assert.equal(bunkerRoom(B.hall.x0 + 1, B.hall.z0 + 1), 'hall');
  assert.equal(bunkerRoom(B.vault.x0 + 1, B.vault.z0 + 1), 'vault');
  assert.equal(bunkerRoom(0, 0), null, 'and the rest of the bog is not');
  assert.equal(bunkerFloor(0, 0, 0), null, 'no floor of its own out in the open');
  assert.equal(bunkerFloor(B.hall.x0 + 1, B.hall.z0 + 1, 10, B.depth), 10 - B.depth);
  // the corridor is a corridor: long, and it runs north under the camp
  const len = B.hall.z1 - B.hall.z0;
  assert.ok(len > 20, `the corridor is long (${len.toFixed(1)} m)`);
  assert.ok(B.vault.z0 < B.hall.z0, 'the vault is past the corridor, which is the point of the walk');
  assert.ok(B.hall.z1 < B.hatch.z, 'and the corridor starts on the far side of the cap');
  // the way in is on the dry camp island, on the water side, and the way out is the same hole
  const camp = campSite(w);
  const d = Math.hypot(B.hatch.x - camp.x, B.hatch.z - camp.z);
  assert.ok(d < camp.r * 1.1, `the cap stands on the camp's island (${d.toFixed(1)} m from the fire)`);
  assert.ok(w.water.depth(B.hatch.x, B.hatch.z) < 0.02, 'and it is on dry ground, not in the lagoon');
  assert.equal(bunkerRoom(B.spawn.x, B.spawn.z), 'landing', 'you come down in the landing');
  assert.ok(Math.hypot(B.spawn.x - B.ladder.x, B.spawn.z - B.ladder.z) < 3.5, 'with the ladder a step or two behind you');
});

test('the whole shelter is under the peat: no roof, no wall, nothing comes up through the camp', () => {
  const w = bog();
  const B = w.bunker;
  // over every room, the ground is above the ceiling of that room
  for (const [name, r] of [['landing', B.landing], ['hall', B.hall], ['vault', B.vault]]) {
    let worst = 1e9;
    for (let x = r.x0; x <= r.x1; x += 0.5) for (let z = r.z0; z <= r.z1; z += 0.5) worst = Math.min(worst, w.terrain.height(x, z));
    assert.ok(worst > B.y + r.h + 0.4, `${name}: ${(worst - (B.y + r.h)).toFixed(2)} m of peat over its roof`);
  }
  // ...and the cap is the only piece of it above ground
  assert.ok(B.hatch.z > B.hall.z1, 'the cap is at the near end, and the corridor runs away from it');
});

test('the cap does not stand on the car, and its walls are solid', () => {
  const w = bog();
  const B = w.bunker;
  const car = w.crewCar;
  const d = Math.hypot(B.hatch.x - car.x, B.hatch.z - car.z);
  assert.ok(d > 6, `there is room to walk round it (${d.toFixed(1)} m from the crew's car)`);
  // you cannot walk through the cap: its four walls are colliders, and the inside is not the surface's business
  assert.equal(w.col.free(B.hatch.x, B.hatch.z - B.hatch.d / 2, 0.4), false, 'the door side is a wall');
  assert.notEqual(B.col, w.col, 'the shelter has a collision set of its own');
  // the corridor's walls are in the shelter's set only: nothing of it is filed in the camp's
  const onWall = (set) => set.caps.some((c) => c.r > 0 && Math.abs(c.ax - B.hall.x0) < 1e-6 && Math.abs(c.az - B.hall.z0) < 1e-6);
  assert.equal(onWall(w.col), false, 'the corridor puts no wall across the camp');
  assert.equal(onWall(B.col), true, 'and inside, the corridor wall is a wall');
  assert.equal(B.col.free(B.hall.x0 + 0.2, B.hall.z0 + 2, 0.35), false, 'you cannot walk out of the side of it');
  assert.equal(B.col.free((B.hall.x0 + B.hall.x1) / 2, B.hall.z0 + 2, 0.35), true, 'but the corridor itself is clear');
});

test('the works\' gate stands across the track out, past the car, and it shuts the road', () => {
  const w = bog();
  const B = w.bunker;
  const G = w.worksGate;
  assert.ok(G, 'there is a gate on the way out of the участок');
  const car = w.crewCar;
  const d = Math.hypot(G.x - car.x, G.z - car.z);
  assert.ok(d > 4, `it is past the car, not on it (${d.toFixed(1)} m)`);
  assert.ok(w.water.depth(G.x, G.z) < 0.05, 'on dry road');
  assert.equal(WORKS.half * 2 > 6, true, 'wide enough for one УАЗ and no more');
  // the leaf is down: the road through it is shut
  const mid = { x: (G.span.ax + G.span.bx) / 2, z: (G.span.az + G.span.bz) / 2 };
  assert.equal(w.col.free(mid.x, mid.z, 0.25), false, 'you cannot walk out past it');
  // ...and it is on the shelter's circuit, not the water's: nothing about the проезд is part of it
  assert.equal(B.worksGate, G, 'the shelter owns the gate');
  assert.equal(G.open, false);
});

// ---- 2. the script ----
test('until the camp is on the mains, the cap is sealed and there is nothing to throw', () => {
  const s = new ShelterScript();
  assert.equal(s.state, 'sealed');
  assert.equal(s.open(), false, 'the door does not open on a lock with no power');
  assert.equal(s.enter(), false);
  assert.equal(s.throwBreaker(), false, 'and the breaker is not waiting for you down there');
  assert.equal(s.power(), 'unlock');
  assert.equal(s.power(), null, 'once is enough');
  assert.equal(s.throwBreaker(), false, 'the door is open, but you are not in the shelter yet');
  assert.equal(s.open(), true);
  assert.equal(s.enter(), true);
  assert.equal(s.canThrow, true);
});

test('one switch: the gate, then the wall, then the lamps, then the alarm — in that order', () => {
  const s = new ShelterScript();
  s.power(); s.open(); s.enter();
  assert.equal(s.throwBreaker(), true);
  assert.equal(s.throwBreaker(), false, 'there is one breaker, and it stays down');
  const seen = [];
  const at = (seconds, step = 0.05) => {
    let n = 0;
    while (n < seconds) { for (const e of s.step(step)) seen.push({ e, t: s.t }); n += step; }
  };
  at(0.4);
  assert.ok(!seen.some((x) => x.e === 'gate'), 'the gate cannot answer before half a second has passed');
  at(0.3);
  assert.deepEqual(seen.map((x) => x.e), ['gate'], 'the first thing that happens is the gate, up on the track');
  assert.ok(Math.abs(seen[0].t - T_GATE) < 0.06);
  at(2.0);
  assert.deepEqual(seen.map((x) => x.e), ['gate', 'stir'], 'then the wall at the far end answers');
  assert.ok(Math.abs(seen[1].t - T_STIR) < 0.1);
  // the lamps: all six, then none — from the far end back
  assert.equal(s.lampsLit(), 6);
  at(1.0);
  assert.ok(seen.some((x) => x.e === 'blackout'));
  assert.ok(Math.abs(seen.find((x) => x.e === 'blackout').t - T_BLACK) < 0.06);
  at(0.9);
  assert.equal(s.lampsLit(), 0, 'the light is gone within a second of the first lamp going');
  assert.equal(s.lit, 0);
  // ...and then the alarm, and the doors
  at(0.9);
  assert.ok(seen.some((x) => x.e === 'alarm'), 'the siren starts with the doors');
  const alarm = seen.find((x) => x.e === 'alarm');
  assert.ok(Math.abs(alarm.t - T_ALARM) < 0.06);
  assert.ok(s.doorK > 0.99, 'the slab has barely moved yet (it starts where it is)');
  assert.ok(s.alarmT > 0 && s.alarmT < 1.5, 'the siren is counting from the alarm');
  assert.ok(s.wake > 0.9, 'and the rift is awake by then');
});

test('the doors take three minutes, and then the shelter has you', () => {
  const s = new ShelterScript();
  s.power(); s.open(); s.enter(); s.throwBreaker();
  const out = [];
  for (let i = 0; i < 4000 && !s.dead; i++) for (const e of s.step(0.05)) out.push({ e, t: s.t });
  assert.ok(s.dead, 'it ends');
  assert.equal(out.filter((x) => x.e === 'sealed').length, 1, 'exactly once');
  assert.equal(s.sealed, true);
  assert.ok(Math.abs(s.t - (T_ALARM + DOOR_TIME)) < 0.1, `three minutes after the alarm (${s.alarmT.toFixed(1)} s of door)`);
  assert.equal(DOOR_TIME, 180, 'three minutes, to the second');
  assert.ok(Math.abs(s.doorK) < 0.001);
  assert.ok(s.t <= s.alarmT + T_ALARM + 0.2, 'and the clock is the door\'s');
  const half = new ShelterScript();
  half.power(); half.open(); half.enter(); half.throwBreaker();
  for (let i = 0; i < 4000 && half.alarmT < DOOR_TIME / 2; i++) half.step(0.05);
  assert.ok(Math.abs(half.doorK - 0.5) < 0.02, 'halfway at ninety seconds');
});

test('they come up out of the crack one after another, and not all at once', () => {
  const s = new ShelterScript();
  s.power(); s.open(); s.enter(); s.throwBreaker();
  const times = [];
  for (let i = 0; i < 3000; i++) {
    for (const e of s.step(0.05)) if (e === 'out') times.push(s.t);
    if (s.out >= HORDE_MAX) break;
  }
  assert.equal(times.length, HORDE_MAX, 'the whole horde comes out');
  assert.ok(times[0] - T_ALARM < 0.1, 'the first is out with the alarm');
  for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1] + 0.2, 'and they follow each other');
});

test('out of the shelter the clock stops: the door is not your problem any more', () => {
  const s = new ShelterScript();
  s.power(); s.open(); s.enter(); s.throwBreaker();
  for (let i = 0; i < 200; i++) s.step(0.05);
  assert.ok(s.alarmT > 5);
  assert.equal(s.leave(), true);
  assert.equal(s.alarmT, -1, 'the siren is behind you');
  const t0 = s.doorK;
  for (let i = 0; i < 100; i++) s.step(0.05);
  assert.equal(s.doorK, t0, 'and the door stops mattering');
  assert.ok(!s.dead, 'nobody is sealed in');
  assert.equal(s.enter(), false, 'there is no going back down once it is awake');
});

// ---- 3. the joining-up ----
test('the five pumps unlock the cap; the forestry gate rolls on its own five generators (4.0a)', () => {
  const esc = src('src/game/escape.js');
  const power = esc.slice(esc.indexOf('  powerOn() {'), esc.indexOf('  // is the gate moving / open?'));
  assert.ok(power.length > 100, 'powerOn is there');
  assert.ok(power.includes('this.openGate()'), 'the yard\'s power rolls the gate by itself: there is no breaker in the forest');
  assert.ok(!power.includes('bunker'), 'and the forest does not wait on a shelter it does not have');
  const open = esc.slice(esc.indexOf('  openGate() {'), esc.indexOf('  gateShut() {'));
  assert.ok(open.includes("gate.state = 'opening'"), 'openGate is the one that rolls it');
  assert.ok(esc.includes('get gateOpen()'), 'and the rest of the escape can ask');
  assert.ok(!esc.includes('taskBunker') && !esc.includes('world.bunker'), 'the forest\'s task line and beacon never point at a shelter');
  // on the bog the escape is a stand-in, so the game tells the shelter itself
  const game = src('src/game/game.js');
  assert.ok(game.includes('this.bunker.onPower()'), 'the five pumps reach the cap on every участок');
});

test('the game builds it, ticks it, resets it — and the forest gets a stand-in by itself', () => {
  const g = src('src/game/game.js');
  assert.ok(g.includes('new Bunker(this)'), 'one shelter, built for both участки');
  assert.ok(g.includes('this.bunker.reset()'));
  assert.ok(g.includes('this.bunker.update(dt)'));
  assert.ok(g.indexOf('this.bunker.update(dt)') > g.indexOf('this.objectives.update(dt, true)'), 'the shelter writes the last word into the light slots');
  // the forest has no world.bunker, and the class says so before it builds anything
  const b = src('src/game/bunker.js');
  assert.ok(b.includes('this.B = this.world.bunker || null'));
  assert.ok(/if \(!this\.B\) return;/.test(b), 'no place, no shelter');
  // the E prompt is answered by the shelter, before the objectives fall through to a pump
  const ob = src('src/game/objectives.js');
  assert.ok(ob.includes("const BUNKER_KINDS = new Set(['shelterCap', 'shelterUp', 'shelterBreaker'])"));
  assert.ok(ob.includes('game.bunker.consider(consider)'));
  assert.ok(ob.indexOf('BUNKER_KINDS.has(best.kind)') < ob.indexOf('const spec = g.spec;'));
  // ...and the task line points down the hole while the breaker is still up
  assert.ok(ob.includes('b.needsBreaker'));
});

test('underground you are resolved against the shelter, and you stand on its floor', () => {
  const p = src('src/game/player.js');
  assert.ok(p.includes('(this.col || this.world.col).resolve'), 'the player\'s collision can be swapped');
  assert.ok(p.includes('this.col = null'));
  const b = src('src/game/bunker.js');
  assert.ok(b.includes('p.col = B.col'), 'the shelter hands its own walls over');
  assert.ok(b.includes('p.floorY = this.fy'), 'and its floor');
});

test('in co-op the road opens for everyone, not only for the host', () => {
  const n = src('src/game/netsync.js');
  assert.ok(n.includes("case 'xG'"), 'the gate is on the wire');
  assert.ok(n.includes('g.bunker?.remoteGate?.()'), 'and it raises the guest\'s own leaf');
  const b = src('src/game/bunker.js');
  assert.ok(b.includes("g.sync.ev('xG')"), 'the host says so once, from the only place that opens it');
  assert.ok(/remoteGate\(\) \{[\s\S]*W.open = true;/.test(b), 'and the guest\'s road is open too');
});

test('the car cannot leave the участок until the gate is up', () => {
  const w = src('src/game/winch.js');
  assert.ok(w.includes('shut()'), 'the winch asks the shelter');
  assert.ok(w.includes("t('winchGateShut')"), 'and says why it will not start');
  assert.ok(w.includes("if (this.shut()) {"), 'before the starter, not after it');
  assert.ok(w.indexOf("if (this.shut()) {") < w.indexOf("this.crank = Math.min(WINCH.crankT"), 'the gate is checked before the engine turns');
});

test('the siren for the closing doors is its own sound, and the gate\'s is not touched', () => {
  const a = src('src/audio/audio.js');
  for (const fn of ['bunkerBreaker', 'bunkerAlarm', 'bunkerDoors', 'riftWake', 'bunkerBlackout', 'razlomScreech']) {
    assert.ok(a.includes(`  ${fn}(`), `${fn} exists`);
  }
  assert.ok(a.includes('gateSiren('), 'the gate keeps its own');
  const alarm = a.slice(a.indexOf('  bunkerAlarm('), a.indexOf('  bunkerDoors('));
  assert.ok(alarm.includes('const period = 2.6'), 'a slower wail than the gate\'s 1.7');
  assert.ok(alarm.includes('stop: (fade'), 'and it can be cut');
});

test('every string the shelter shows exists in both languages', () => {
  const keys = ['aShelterUnlocked', 'hintShelter', 'aShelterOpen', 'aShelterIn', 'aBreath', 'aStir',
    'aDoorsClose', 'aRun', 'aDoorLeft', 'aShelterShut', 'hintRun', 'taskBunker', 'taskRunOut', 'aWorksOpen',
    'hintWorksOpen', 'hintWorks', 'noteGateBog', 'winchGateShut', 'winchGateShutHint',
    'useShelterLocked', 'useShelterUnlock', 'useShelterDown', 'useShelterUp', 'useBreaker', 'noteGateMoving'];
  const was = getLang();
  const ru = {};
  for (const k of keys) {
    assert.ok(t(k) && t(k) !== k, `${k} reads in Russian`);
    ru[k] = t(k);
  }
  assert.equal(t('deathBy').razlom, 'Разлом');
  setLang('en');
  for (const k of keys) {
    assert.ok(t(k) && t(k) !== k, `${k} reads in English`);
    assert.notEqual(t(k), ru[k], `${k} is not the Russian line left in the English table`);
  }
  assert.equal(t('deathBy').razlom, 'The Rift');
  setLang(was);
  const news = src('src/ui/news.js');
  assert.ok(news.includes("v:'3.0q'"), 'the patch notes say so');
  assert.ok(news.indexOf("v:'3.0q'") < news.indexOf("v:'3.0p'"), 'newest first');
});

// ---- 4. the whole thing, in a room with no screen ----
const stubGame = (w) => {
  const hud = { lines: [], setUse(l, p, ok, dim) { this.lines.push({ l, ok }); }, flashAlert(t2) { this.alert = t2; }, popup() {}, peek() {}, setHint(h) { this.hint = h; } };
  const deaths = [];
  const game = {
    map: 'bog', world: w, scene: new THREE.Scene(), time: 0, timeline: [], hud,
    audio: { ready: false }, particles: { burst() {} }, fx: { fade: 0, fovKick: 0 },
    player: { x: w.bunker.hatch.x, z: w.bunker.hatch.z - 2, y: 0, vx: 0, vz: 0, yaw: 0, pitch: 0, alive: true, floorY: null, col: null, eyeCur: 1.62 },
    addTrauma() {}, beginDeath(m, cause) { deaths.push({ type: m.type, cause }); game.player.alive = false; },
    escape: { opened: 0, openGate() { this.opened++; } },
  };
  return { game, hud, deaths };
};

test('power, the cap, the ladder, the breaker, the gate, the blackout, the alarm, and the door shutting for good', async () => {
  const w = bog();
  const { game, hud, deaths } = stubGame(w);
  const { Bunker } = await import('../src/game/bunker.js');
  const bun = new Bunker(game);
  const step = (sec, dt = 1 / 30) => { for (let i = 0; i < Math.ceil(sec / dt); i++) { game.time += dt; bun.update(dt); } };
  // no power: the cap is locked, and E says so
  step(0.2);
  bun.consider(() => {});
  bun.interact({ kind: 'shelterCap' }, true, (k) => k);
  assert.equal(hud.lines.at(-1).ok, false, 'locked, and the prompt does not pretend otherwise');
  assert.equal(bun.state, 'sealed');
  assert.equal(bun.needsBreaker, false, 'and the task line is still the pumps\' business');
  // five pumps: the lock lets go — and the gate does NOT move (the contactor is down here)
  bun.onPower();
  assert.equal(bun.state, 'unlocked');
  assert.equal(game.escape.opened, 0, 'the gate is still shut');
  assert.equal(bun.needsBreaker, true, 'the way out waits for the breaker now');
  bun.interact({ kind: 'shelterCap' }, true, (k) => k);
  assert.equal(bun.state, 'open', 'so you force the lock');
  assert.equal(bun.capDoor.rotation.y > 0.3, true, 'the door stands ajar');
  // down
  bun.interact({ kind: 'shelterCap' }, true, (k) => k);
  step(2.0);
  assert.equal(bun.inside, true);
  assert.equal(game.player.col, w.bunker.col, 'the camp\'s walls are not around you any more');
  assert.equal(game.player.floorY, w.bunker.y);
  assert.ok(Math.abs(game.player.y - w.bunker.y) < 1e-6);
  assert.ok(bun.lamps.every((L) => L.on > 0.5), 'all six are lit on the way in');
  // the breaker
  bun.interact({ kind: 'shelterBreaker' }, true, (k) => k);
  assert.equal(bun.script.thrown, true, 'the breaker is down');
  assert.equal(bun.gateOpen, false, 'the gate answers half a second later, not on the same frame');
  step(0.8);
  assert.equal(bun.gateOpen, true, 'and the gate on the track out is on its way up');
  assert.equal(game.escape.opened, 0, 'the forest\'s gate is not the shelter\'s business: it rolls on its own generators (4.0a)');
  assert.ok(bun.worksOpen > 0, 'the works\' leaf has started to lift');
  assert.ok(bun.worksLeaf.position.y > w.worksGate.leafY, 'and it is moving up its guides');
  step(2.0);
  assert.ok(bun.script.t > 2.3 && bun.script.wake > 0, 'the wall answers');
  assert.ok(bun.riftHalo.material.opacity > 0, 'and the crack is red');
  step(1.6);
  assert.equal(bun.script.lampsLit(), 0, 'the lamps are out');
  step(1.4);
  assert.ok(bun.script.alarmT >= 0, 'the siren');
  assert.ok(bun.horde.length > 0, 'and something is already out of the crack');
  // the leaf is up, and the road is open
  step(WORKS.openT + 1);
  assert.equal(bun.worksOpen >= 1, true, 'the leaf is all the way up');
  assert.equal(w.worksGate.open, true, 'and the road through it is open');
  assert.equal(w.col.free((w.worksGate.span.ax + w.worksGate.span.bx) / 2, (w.worksGate.span.az + w.worksGate.span.bz) / 2, 0.2), true, 'you can walk out');
  // she runs: back up the ladder before the slab is down
  game.player.x = w.bunker.ladder.x;
  game.player.z = w.bunker.ladder.z;
  bun.interact({ kind: 'shelterUp' }, true, (k) => k);
  step(2.0);
  assert.equal(bun.inside, false, 'out');
  assert.equal(game.player.col, null, 'and the camp\'s own walls are back');
  assert.equal(bun.state, 'left');
  step(3.0);
  assert.equal(deaths.length, 0, 'the cap banged three times and gave up');
  assert.ok(bun.doorMesh.position.y > w.bunker.y + 1.3, 'the slab was still on its way down when she left');
});

test('left down there, it has you: the doors shut and the night ends', async () => {
  const w = bog();
  const { game, deaths } = stubGame(w);
  const { Bunker } = await import('../src/game/bunker.js');
  const bun = new Bunker(game);
  bun.onPower(); bun.unlock(); bun.descend();
  for (let i = 0; i < 60; i++) bun.update(1 / 30);
  assert.equal(bun.inside, true);
  bun.throwBreaker();
  // the first one out of the crack is on her long before the doors are (the corridor is 22 m)
  let i = 0;
  for (; i < 4000 && !deaths.length; i++) { game.time += 1 / 30; bun.update(1 / 30); }
  assert.equal(deaths.length, 1, 'they catch her');
  assert.equal(deaths[0].cause, 'razlom', 'and the night says it was the rift');
  assert.equal(deaths[0].type, 'crawler', 'the death is a crawler\'s, because that is what they are');
  assert.ok(game.time < 40, `...and quickly (${game.time.toFixed(1)} s)`);
});
