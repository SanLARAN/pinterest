// 3.0q: the shelter under the forestry yard, and the rift at the end of it.
//
// Three things are checked here. The place: the corridor is under the yard and under the forest, well clear of
// the cut, and it has a floor of its own that the player stands on (world/bunker.js). The script: one switch,
// then the gate, the crack, the lamps going out, the alarm and three minutes of door, in that order and with
// nothing left to chance (ShelterScript). And the joining-up: the yard's power only unlocks the cap, the gate
// moves only when the breaker is thrown, and the shelter can end the night.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { CFG } from '../src/core/config.js';
import { BUNKER, DOOR_TIME, HORDE_MAX, ShelterScript, bunkerFloor, bunkerRoom, inBunker, T_GATE, T_STIR, T_BLACK, T_ALARM } from '../src/world/bunker.js';
import { t, setLang, getLang } from '../src/core/i18n.js';

// the shelter builds sprites, and a sprite wants a canvas. Node has none: give the two little canvases the
// halo texture asks for a stub that draws nothing (nothing here is looked at, only built)
globalThis.document = globalThis.document || {
  documentElement: {},
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({
      createRadialGradient: () => ({ addColorStop() {} }),
      fillRect() {}, fillStyle: '',
    }),
  }),
};

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let world = null;
const forest = () => world || (world = new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate());

// ---- 1. the place ----
test('the shelter is under the yard: a landing, a long corridor, a vault at the far end', () => {
  const w = forest();
  const B = w.bunker;
  assert.ok(B, 'the forest has a shelter — the bog has none of it');
  assert.equal(B.y, w.yard.y - BUNKER.depth, 'its floor is the yard\'s ground, five and a half metres down');
  assert.ok(inBunker(B.landing.x0 + 1, B.landing.z0 + 1), 'the landing is a room');
  assert.equal(bunkerRoom(B.hall.x0 + 1, B.hall.z0 + 1), 'hall');
  assert.equal(bunkerRoom(B.vault.x0 + 1, B.vault.z0 + 1), 'vault');
  assert.equal(bunkerRoom(0, 0), null, 'and the rest of the forest is not');
  assert.equal(bunkerFloor(0, 0, 0), null, 'no floor of its own out in the open');
  assert.equal(bunkerFloor(B.hall.x0 + 1, B.hall.z0 + 1, 10), 10 - BUNKER.depth);
  // the corridor is a corridor: long, and it runs away from the yard, not under the cut behind it
  const len = B.hall.z1 - B.hall.z0;
  assert.ok(len > 20, `the corridor is long (${len.toFixed(1)} m)`);
  assert.ok(B.vault.z0 < B.hall.z0, 'the vault is past the corridor, which is the point of the walk');
  assert.ok(B.hall.z1 < CFG.YARD.z + CFG.YARD.d / 2, "the corridor starts under the yard's own fence");
  assert.ok(B.y + BUNKER.landing.h < w.yard.y - 1.2, 'and every bit of it is under the ground (the cut above falls away)');
  // the way in is in the yard, the way out is the same hole
  assert.ok(Math.abs(B.hatch.x - CFG.YARD.x) < CFG.YARD.w / 2 && Math.abs(B.hatch.z - CFG.YARD.z) < CFG.YARD.d / 2, 'the cap stands inside the fence');
  assert.equal(bunkerRoom(B.spawn.x, B.spawn.z), 'landing', 'you come down in the landing');
  assert.ok(Math.hypot(B.spawn.x - B.ladder.x, B.spawn.z - B.ladder.z) < 3.5, 'with the ladder a step or two behind you');
});

test('the cap does not stand on the car, and the wall round it is solid', () => {
  const w = forest();
  const B = w.bunker;
  const car = w.yard.car;
  const d = Math.hypot(B.hatch.x - car.x, B.hatch.z - car.z);
  assert.ok(d > 3.5, `there is room to drive past the cap (${d.toFixed(1)} m from the УАЗ)`);
  // you cannot walk through the cap: its four walls are colliders, and the inside is not
  assert.equal(w.col.free(B.hatch.x, B.hatch.z - B.hatch.d / 2, 0.4), false, 'the door side is a wall');
  // the shelter's own collision set is separate from the forest's: the yard is not full of its walls
  assert.notEqual(B.col, w.col);
  assert.equal(w.col.free(B.hall.x0 + 1, CFG.YARD.z + 6, 0.35), true, 'the corridor does not put a wall in the yard');
  assert.equal(B.col.free(B.hall.x0 + 0.2, B.hall.z0 + 2, 0.35), false, 'and inside, the corridor wall is a wall');
});

// ---- 2. the script ----
test('until the yard is on the mains, the cap is sealed and there is nothing to throw', () => {
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
  assert.deepEqual(seen.map((x) => x.e), ['gate'], 'the first thing that happens is the gate, up in the yard');
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
  assert.deepEqual(out.filter((x) => x.e === 'sealed').length, 1, 'exactly once');
  assert.equal(s.sealed, true);
  assert.ok(Math.abs(s.t - (T_ALARM + DOOR_TIME)) < 0.1, `three minutes after the alarm (${s.alarmT.toFixed(1)} s of door)`);
  assert.equal(DOOR_TIME, 180, 'three minutes, to the second');
  // the slab comes down in one slow movement, and the door is shut exactly at the end
  assert.ok(Math.abs(s.doorK) < 0.001);
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
  assert.ok(times[0] - (T_ALARM) < 0.1, 'the first is out with the alarm');
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
  assert.ok(!s.dead || s.dead === false, 'nobody is sealed in');
  assert.equal(s.enter(), false, 'there is no going back down once it is awake');
});

// ---- 3. the joining-up ----
test('the generators unlock the cap; only the shelter\'s breaker moves the gate', () => {
  const esc = src('src/game/escape.js');
  const power = esc.slice(esc.indexOf('  powerOn() {'), esc.indexOf('  // is the gate moving / open?'));
  assert.ok(power.length > 200, 'powerOn is there');
  assert.ok(!power.includes("gate.state = 'opening'"), 'the yard\'s power does not open the gate by itself');
  assert.ok(power.includes('bunker?.onPower'), 'it tells the shelter the lock can let go');
  const open = esc.slice(esc.indexOf('  openGate() {'), esc.indexOf('  gateShut() {'));
  assert.ok(open.includes("gate.state = 'opening'"), 'openGate is the one that rolls it');
  assert.ok(esc.includes('get gateOpen()'), 'and the rest of the escape can ask');
  // the task line says where the gate is held
  assert.ok(esc.includes('if (!this.gateOpen) return t(\'taskBunker\')'));
});

test('the game builds it, ticks it, resets it — and the bog has a stand-in', () => {
  const g = src('src/game/game.js');
  assert.ok(g.includes('new Bunker(this)'), 'the forest has one');
  assert.ok(g.includes("inert(Bunker, this, { state: 'sealed'"), 'the bog has a no-op');
  assert.ok(g.includes('this.bunker.reset()'));
  assert.ok(g.includes('this.bunker.update(dt)'));
  // the shelter writes the last word into the light slots: after the objectives, not before
  assert.ok(g.indexOf('this.bunker.update(dt)') > g.indexOf('this.objectives.update(dt, true)'));
  // the E prompt is answered by the shelter, before the objectives fall through to a generator
  const ob = src('src/game/objectives.js');
  assert.ok(ob.includes("const BUNKER_KINDS = new Set(['shelterCap', 'shelterUp', 'shelterBreaker'])"));
  assert.ok(ob.includes('game.bunker.consider(consider)'));
  assert.ok(ob.indexOf('BUNKER_KINDS.has(best.kind)') < ob.indexOf('const spec = g.spec;'));
});

test('underground you are resolved against the shelter, and you stand on its floor', () => {
  const p = src('src/game/player.js');
  assert.ok(p.includes('(this.col || this.world.col).resolve'), 'the player\'s collision can be swapped');
  assert.ok(p.includes('this.col = null'));
  const b = src('src/game/bunker.js');
  assert.ok(b.includes('p.col = B.col'), 'the shelter hands its own walls over');
  assert.ok(b.includes('p.floorY = this.fy'), 'and its floor');
});

test('the siren for the closing doors is its own sound, and the gate\'s is not touched', () => {
  const a = src('src/audio/audio.js');
  for (const fn of ['bunkerBreaker', 'bunkerAlarm', 'bunkerDoors', 'riftWake', 'bunkerBlackout', 'razlomScreech']) {
    assert.ok(a.includes(`  ${fn}(`), `${fn} exists`);
  }
  assert.ok(a.includes('gateSiren('), 'the gate keeps its own');
  // the doors' siren is slower than the gate's, and it is stoppable
  const alarm = a.slice(a.indexOf('  bunkerAlarm('), a.indexOf('  bunkerDoors('));
  assert.ok(alarm.includes('const period = 2.6'), 'a slower wail than the gate\'s 1.7');
  assert.ok(alarm.includes('stop: (fade'), 'and it can be cut');
});

test('every string the shelter shows exists in both languages', () => {
  const keys = ['aYardPower', 'aShelterUnlocked', 'hintShelter', 'aShelterOpen', 'aShelterIn', 'aBreath', 'aStir',
    'aDoorsClose', 'aRun', 'aDoorLeft', 'aShelterShut', 'hintRun', 'taskBunker', 'taskRunOut',
    'useShelterLocked', 'useShelterUnlock', 'useShelterDown', 'useShelterUp', 'useBreaker', 'noteGateMoving', 'noteGateOn', 'deadRazlom'];
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
test('power, the cap, the ladder, the breaker, the blackout, the alarm, and the door shutting for good', async () => {
  const w = forest();
  const hud = { lines: [], setUse(l, p, ok, dim) { this.lines.push({ l, ok }); }, flashAlert(t2) { this.alert = t2; }, popup() {}, peek() {}, setHint() {} };
  const deaths = [];
  const game = {
    world: w, scene: new THREE.Scene(), time: 0, timeline: [], hud,
    audio: { ready: false }, particles: { burst() {} }, fx: { fade: 0, fovKick: 0 },
    player: { x: w.bunker.hatch.x, z: w.bunker.hatch.z - 2, y: 0, vx: 0, vz: 0, yaw: 0, pitch: 0, alive: true, floorY: null, col: null, eyeCur: 1.62 },
    addTrauma() {}, beginDeath(m, cause) { deaths.push({ type: m.type, cause }); game.player.alive = false; },
    escape: { opened: 0, openGate() { this.opened++; } },
  };
  const { Bunker } = await import('../src/game/bunker.js');
  const bun = new Bunker(game);
  const step = (sec, dt = 1 / 30) => { for (let i = 0; i < Math.ceil(sec / dt); i++) { game.time += dt; bun.update(dt); } };
  // the yard has no power: the cap is locked, and E says so
  step(0.2);
  bun.consider(() => {});
  bun.interact({ kind: 'shelterCap' }, true, (k) => k);
  assert.equal(hud.lines.at(-1).ok, false, 'locked, and the prompt does not pretend otherwise');
  assert.equal(bun.state, 'sealed');
  // five generators: the lock lets go — and the gate does NOT move (game/escape.js asks the bunker)
  bun.onPower();
  assert.equal(bun.state, 'unlocked');
  assert.equal(game.escape.opened, 0, 'the gate is still shut: the contactor is down here');
  bun.interact({ kind: 'shelterCap' }, true, (k) => k);
  assert.equal(bun.state, 'open', 'so you force the lock');
  assert.equal(bun.capDoor.rotation.y > 0.3, true, 'the door stands ajar');
  // down
  bun.interact({ kind: 'shelterCap' }, true, (k) => k);
  step(2.0);
  assert.equal(bun.inside, true);
  assert.equal(game.player.col, w.bunker.col, 'the yard\'s walls are not around you any more');
  assert.equal(game.player.floorY, w.bunker.y);
  assert.ok(Math.abs(game.player.y - w.bunker.y) < 1e-6);
  // the lamps are burning: the last word in the light slots
  assert.ok(bun.lamps.every((L) => L.on > 0.5), 'all six are lit on the way in');
  // the breaker
  bun.interact({ kind: 'shelterBreaker' }, true, (k) => k);
  assert.equal(bun.script.thrown, true, 'the breaker is down');
  step(0.8);
  assert.equal(game.escape.opened, 1, 'the gate rolls, up in the yard');
  step(2.0);
  assert.ok(bun.script.t > 2.3 && bun.script.wake > 0, 'the wall answers');
  assert.ok(bun.riftHalo.material.opacity > 0, 'and the crack is red');
  step(1.6);
  assert.equal(bun.script.lampsLit(), 0, 'the lamps are out');
  assert.equal(bun.lamps.filter((L) => L.on > 0.4).length, 0, 'and every bulb with them');
  step(1.4);
  assert.ok(bun.script.alarmT >= 0, 'the siren');
  assert.ok(bun.horde.length > 0, 'and something is already out of the crack');
  // she runs: back up the ladder before the slab is down
  game.player.x = w.bunker.ladder.x;
  game.player.z = w.bunker.ladder.z;
  bun.interact({ kind: 'shelterUp' }, true, (k) => k);
  step(2.0);
  assert.equal(bun.inside, false, 'out');
  assert.equal(game.player.col, null, 'and the yard\'s walls are back');
  assert.equal(bun.state, 'left');
  step(3.0);
  assert.equal(deaths.length, 0, 'the cap banged three times and gave up');
  assert.ok(bun.doorMesh.position.y > w.bunker.y + 1.3, 'the slab was still on its way down when she left');
});

test('left down there, it has you: the doors shut and the night ends', async () => {
  const w = forest();
  const deaths = [];
  const game = {
    world: w, scene: new THREE.Scene(), time: 0, timeline: [],
    hud: { setUse() {}, flashAlert() {}, popup() {}, peek() {}, setHint() {} },
    audio: { ready: false }, particles: { burst() {} }, fx: { fade: 0, fovKick: 0 },
    player: { x: w.bunker.hatch.x, z: w.bunker.hatch.z - 2, y: 0, vx: 0, vz: 0, yaw: 0, pitch: 0, alive: true, floorY: null, col: null },
    addTrauma() {}, beginDeath(m, cause) { deaths.push({ type: m.type, cause }); game.player.alive = false; },
    escape: { openGate() {} },
  };
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
