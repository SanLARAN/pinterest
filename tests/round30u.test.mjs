// 3.0u: getting into the car, the range from the bog, and the Stray's voice in the atlas.
//
// - «ПОЛИГОН» after a bog shift reloaded onto the bog with autostart and began an ordinary night: the range is the
//   forest's, so it always goes there, with its own flag, and the ground chosen for shifts is left alone.
// - The Stray's atlas page had a «голос» button and no voice behind it since 2.1v (no case in playSound).
// - Every drive out of the garage opens with the boarding (ui/boarding.js): each of the four lobby places gets in
//   its own way, and the key, the gates and the wheels wait for the last one. The driver now stands at his door in
//   the lobby. A solo shift starts in the garage as well.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { BOARD, boardDur, boardingPlan, poseBoarding } from '../src/ui/boarding.js';
import { DEPART, departPlan } from '../src/ui/departure.js';
import { runUrl } from '../src/core/maps.js';
import { buildSurvivor } from '../src/game/survivor.js';

const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');

// ---------------------------------------------------------------- the range
test('the range is the forest\'s: a reload toward it carries its own flag, and the shifts\' ground is left alone', () => {
  assert.equal(runUrl('bog', 4, '', { range: true }), '?range=&days=4', 'not ?map=bog, not autostart');
  assert.equal(runUrl('bog', 4), '?map=bog&autostart=&days=4', 'an ordinary shift is unchanged');
  const main = src('main.js');
  assert.match(main, /let wantMap = toRange \? 'forest' :/);
  assert.match(main, /if \(!toRange\) \{ settings\.shiftMap = wantMap; saveSettings\(\); \}/);
  assert.match(main, /if \(world\.mapId !== 'forest'\) \{ location\.href = runUrl\('forest', settings\.shiftDays, '', \{ range: true \}\); return; \}/, 'from the bog the range reloads first');
  assert.match(main, /if \(DEBUG\.range\) startTrainingSolo\(\);/, 'and on arrival plays the range, not a shift');
  assert.match(main, /const rmap = d\.tr \? 'forest' :/, 'the room\'s gates lead to the forest\'s range too');
});

// ---------------------------------------------------------------- the atlas
test('every atlas page with a sound button has a sound behind it — the Stray\'s included', () => {
  const data = src('ui/atlasData.js'), atlas = src('ui/atlas.js');
  const keys = new Set([...data.matchAll(/\bsound: '(\w+)', kind:|\{ model: '\w+', sound: '(\w+)'/g)].map((m) => m[1] || m[2]).filter(Boolean));
  const body = atlas.slice(atlas.indexOf('  playSound(key) {'), atlas.indexOf('    this.soundTimers = T;'));
  const cases = new Set([...body.matchAll(/case '(\w+)'/g)].map((m) => m[1]));
  assert.ok(keys.size > 25, `pages read (${keys.size})`);
  for (const k of keys) assert.ok(cases.has(k), `«${k}» has a voice`);
  assert.match(body, /case 'stray':[\s\S]*?A\.strayHey\(/);
});

// ---------------------------------------------------------------- the boarding, as numbers
const D = { hips: 1.02, recline: -0.1, thigh: -1.5, knee: 0.88 };
const DRIVER_SEAT = [0.1, 0, 0.42];
const FROM = { 0: [0.32, 1.3], 1: [2.5, 1.82], 2: [-4.32, 2.78], 3: [-2.07, 2.32] };

test('four places, four ways in — and the plan is only who is in the room', () => {
  assert.deepEqual([0, 1, 2, 3].map((s) => BOARD[s].style), ['vault', 'climb', 'leap', 'stumble']);
  const full = boardingPlan([true, true, true, true]), solo = boardingPlan([true, false, false, false]);
  assert.deepEqual(full.slots, [0, 1, 2, 3]);
  assert.ok(solo.dur > 1 && solo.dur < 2, `alone it is quick (${solo.dur.toFixed(2)} s)`);
  assert.ok(full.dur > solo.dur && full.dur < 4.5, `four of them, under 4.5 s (${full.dur.toFixed(2)})`);
  assert.equal(boardingPlan([false, false, false, false]).dur, 0);
  // the smoker's dive goes over the driver's head: the driver has to be sitting by then
  const driverIn = BOARD[0].at + boardDur(0), dive = BOARD[2].at + BOARD[2].flick + BOARD[2].run;
  assert.ok(dive > driverIn, `the dive (${dive.toFixed(2)}) after the driver sits (${driverIn.toFixed(2)})`);
  const seats = [DRIVER_SEAT, BOARD[1].seat, BOARD[2].seat, BOARD[3].seat].map((s) => s.join(','));
  assert.equal(new Set(seats).size, 4, 'a seat each');
});

test('each of them moves from their place to their seat without a jump cut, and sits', () => {
  for (const s of [0, 1, 2, 3]) {
    const rig = buildSurvivor();
    const P = { from: FROM[s], fromYaw: 0, seat: s === 0 ? DRIVER_SEAT : null, D };
    const seat = s === 0 ? DRIVER_SEAT : BOARD[s].seat;
    let prev = null, maxStep = 0, peak = 0, tipped = 0, last = 'wait';
    for (let bt = 0; bt <= BOARD[s].at + boardDur(s) + 0.1; bt += 1 / 60) {
      for (const k of ['chest', 'head', 'thL', 'thR', 'knL', 'knR', 'shL', 'shR', 'elL', 'elR']) rig.nodes[k].rotation.set(0, 0, 0);
      rig.nodes.hips.rotation.set(0, 0, 0);
      last = poseBoarding(rig, s, bt, P);
      if (last === 'wait') continue;
      const p = rig.root.position;
      assert.ok([p.x, p.y, p.z, rig.root.rotation.y].every(Number.isFinite), `slot ${s} at ${bt.toFixed(2)}`);
      if (prev) maxStep = Math.max(maxStep, Math.hypot(p.x - prev.x, p.z - prev.z));
      prev = p.clone();
      peak = Math.max(peak, p.y);
      tipped = Math.max(tipped, rig.root.rotation.x);
    }
    assert.equal(last, 'seated', `slot ${s} ends in the car`);
    assert.ok(Math.hypot(rig.root.position.x - seat[0], rig.root.position.z - seat[2]) < 1e-6, `slot ${s} in its seat`);
    assert.ok(Math.abs(rig.root.rotation.y + Math.PI / 2) < 1e-6, 'facing the nose');
    assert.ok(maxStep < 0.12, `slot ${s}: no teleport (largest frame step ${maxStep.toFixed(3)} m)`);
    if (s === 0) assert.ok(peak > 0.4 && peak < 0.7, `the vault clears the door (${peak.toFixed(2)})`);
    if (s === 2) assert.ok(peak > 0.8, `the dive goes high, over the driver (${peak.toFixed(2)})`);
    if (s === 3) assert.ok(tipped > 1.0, `the stumble puts him on the concrete (${tipped.toFixed(2)} rad)`);
  }
});

// ---------------------------------------------------------------- the boarding, in the garage
async function garageWith(n) {
  const oldDoc = globalThis.document;
  const ctx2d = new Proxy({}, { get: (o, k) => (k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}) });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, addEventListener() {}, style: {} }), getElementById: () => null };
  const { Garage } = await import('../src/ui/garage.js');
  const garage = new Garage({ renderer: null, post: { u: {} }, audio: null });
  garage.setPlayers([...Array(n)].map((_, s) => ({ id: 'p' + s, name: 'P' + s, slot: s, self: s === 0, fit: null })));
  for (const f of garage.figs) if (f) f.appear = 1;
  return { garage, restore: () => (globalThis.document = oldDoc) };
}
const step = (garage, film, dt = 1 / 60) => { garage.t += dt; if (film === 'depart') garage._departure(dt); else garage._cutscene(dt); garage._figures(dt); };

test('the driver waits at his door in the lobby, not at the wheel', async () => {
  const { garage, restore } = await garageWith(1);
  try {
    for (let i = 0; i < 30; i++) garage._figures(1 / 60);
    const f = garage.figs[0];
    assert.equal(f.rig.root.parent, garage.carMesh);
    const p = f.rig.root.position, seat = garage.model.driver.pos;
    assert.ok(p.z > 1.0 && Math.hypot(p.x - seat[0], p.z - seat[2]) > 0.6, 'outside the car, by the door');
    assert.match(src('ui/garage.js'), /else if \(s === 0\) this\._driverOut\(f, dt\);/);
  } finally { restore(); }
});

test('the gates film: everyone in before the latch and the key, then the wheels; afterwards everyone home', async () => {
  const { garage, restore } = await garageWith(4);
  try {
    let fired = 0;
    assert.equal(garage.startDepart(() => fired++), true);
    const c = garage.depart;
    assert.ok(c.t < -3, `the clock starts below zero by the boarding (${c.t.toFixed(2)})`);
    const x0 = garage.carRoot.position.x;
    while (garage.depart && garage.depart.t < 0) {
      step(garage, 'depart');
      assert.equal(garage.depart.keyed, false, 'no key while someone is still getting in');
      assert.equal(garage.carRoot.position.x, x0, 'and the car does not move');
    }
    assert.ok(garage.figs.every((f) => f.board && f.board.seated), 'all four sitting at zero');
    assert.ok(garage.figs.every((f) => f.rig.root.parent === garage.carMesh), 'the car carries them');
    let moved = false;
    for (let i = 0; i < 60 * 8 && garage.depart; i++) { step(garage, 'depart'); if (garage.carRoot.position.x < x0 - 0.5) moved = true; }
    assert.ok(moved, 'then it drives out');
    assert.equal(fired, 1);
    // home again: the next time the lobby opens, nobody is sitting in the car doing their lobby business
    assert.ok(garage.figs.every((f) => !f.board));
    assert.equal(garage.figs[0].rig.root.parent, garage.carMesh);
    for (const s of [1, 2, 3]) assert.equal(garage.figs[s].rig.root.parent, garage.scene, `slot ${s} back in the room`);
  } finally { restore(); }
});

test('the room\'s START: the key waits for the boarding too, and a called-off film sends everyone home', async () => {
  const { garage, restore } = await garageWith(3);
  try {
    assert.equal(garage.startCar(() => {}), true);
    assert.ok(garage.cut.t < 0);
    while (garage.cut.t < 0) { step(garage, 'cut'); assert.equal(garage.cut.keyed, false); }
    for (let i = 0; i < 30; i++) step(garage, 'cut');
    assert.equal(garage.cut.keyed, true, 'the key turns once they are in');
    assert.ok(garage.figs.filter(Boolean).every((f) => f.board.seated));
    garage.abortStart();
    assert.ok(garage.figs.filter(Boolean).every((f) => !f.board));
    assert.equal(garage.figs[1].rig.root.parent, garage.scene);
  } finally { restore(); }
});

test('a solo shift starts in the garage as well, through the same film', () => {
  const main = src('main.js');
  assert.match(main, /onPlay: \(\) => startSoloShift\(\)/);
  assert.match(main, /function startSoloShift\(\) \{[\s\S]*?playGarageFilm\(\(\) => startRun\(\)\);/);
  assert.match(main, /function startTrainingSolo\(\) \{[\s\S]*?playGarageFilm\(\(\) => startRun\(\{ training: true \}\)\);/);
  assert.match(main, /DEBUG\.nointro \|\| DEBUG\.night/, 'debug jumps into the night skip it');
  assert.deepEqual(Object.keys(departPlan()).sort(), ['doneAt', 'driveAt', 'fadeAt']);
  assert.ok(DEPART.driveAt > DEPART.keyAt);
});
