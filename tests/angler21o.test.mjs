// 2.1o regressions: the Angler (isolation hunt, the drag, the rope, the knockout, the finish),
// the Keanu set, and the departure film's new boarding schedule. (Its guitar idle left in 2.1q.)
// Fast and deterministic: the Angler's host loop runs against a fake game, no browser, no relays.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CFG } from '../src/core/config.js';
import { RNG } from '../src/core/rng.js';
import { setLang, t } from '../src/core/i18n.js';
import { PROTOCOL } from '../src/net/net.js';
import { Angler, isolationOf, pickTarget, canSelfFree, struggleStep, irritationStep, chooseTree } from '../src/game/angler.js';
import { buildAngler, createMonster, TYPES, STATES } from '../src/game/monsters.js';
import { buildSurvivor, rigVerts } from '../src/game/survivor.js';
import { cleanFit, fullSet, ITEMS, THEMES } from '../src/game/outfit.js';
import { DEPART, departPlan, faceYaw } from '../src/ui/departure.js';
import { SCREEN_PRESETS, presetPixels, encodePixels, decodePixels } from '../src/game/screenFace.js';
import { AudioEngine } from '../src/audio/audio.js';
import { statSync, readFileSync } from 'node:fs';
import { CHAPTERS, ENTRIES, atlasText, pageList } from '../src/ui/atlasData.js';
import { buildModel } from '../src/ui/atlasModels.js';
import * as THREE from 'three';

const A = CFG.ANGLER;

// ---------- balance & protocol ----------
test('the Angler works from the third night, walks faster than you walk and slower than you run', () => {
  assert.equal(A.fromDay, 3);
  assert.equal(A.boundFor, 300); // five minutes at the tree
  assert.ok(A.approach > CFG.PLAYER.walk && A.approach < CFG.PLAYER.sprint, 'you can outrun him — for a while');
  assert.ok(A.haul < A.approach, 'hauling a person is slower than coming for one');
  assert.ok(A.after > CFG.SPAWN_DELAY, 'never during the sleeping-forest calm');
  assert.equal(PROTOCOL, 21); // 4.0: the camera, the arms (20 in 3.0y: ready ticks; 19 in 3.0s: the bog question; 18 in 2.1v: the Stray's stream)
  assert.ok(TYPES.includes('angler') && STATES.includes('haul') && STATES.includes('finish'), 'on the wire as a fifth monster');
});

// ---------- pure pieces ----------
test('he takes the alone: isolation, target choice and who may chew the rope', () => {
  const a = { id: 'a', x: 0, z: 0, alive: true }, b = { id: 'b', x: 10, z: 0, alive: true }, c = { id: 'c', x: 90, z: 0, alive: true };
  assert.equal(isolationOf(a, [a, b, c]), 10);
  assert.equal(isolationOf(c, [a, b, c]), 80);
  assert.equal(pickTarget([a, b, c]), c, 'the pair by the fire is safe; the one off alone is not');
  assert.equal(pickTarget([a, b]), null, 'nobody is 32 m from anybody: no hunt');
  assert.equal(pickTarget([{ ...c, held: true }]), null, 'never the one he already has');
  assert.equal(canSelfFree([a], 'a'), true, 'solo: the rope is yours to chew');
  assert.equal(canSelfFree([a, b], 'a'), false, 'a friend is on their feet: wait for them');
  assert.equal(canSelfFree([a, { ...b, alive: false }], 'a'), true, 'a downed friend cannot come');
});

test('struggling fills and leaks; a loud captive earns the fist on schedule', () => {
  let m = 0;
  for (let i = 0; i < 14; i++) m = struggleStep(m, 1, 0.05, A.struggleHit, A.struggleDecay);
  assert.ok(m >= 0.999, `fourteen alternating presses tear free (${m})`);
  assert.ok(struggleStep(0.5, 0, 4, A.struggleHit, A.struggleDecay) < 0.3, 'resting loses it');
  let v = 0, koAt = -1;
  for (let i = 0; i < 200 && koAt < 0; i++) {
    const r = irritationStep(v, 0.95, 0.05, A);
    v = r.v;
    if (r.ko) koAt = i * 0.05;
  }
  assert.ok(koAt > 1.5 && koAt < 5, `screaming on the drag: blackout in ${koAt.toFixed(1)} s`);
  assert.equal(irritationStep(2.0, 0.3, 1, A).ko, false, 'ordinary talking never does it');
  assert.ok(irritationStep(2.0, 0.3, 4, A).v < 2.0, 'and quiet calms him down');
});

test('the tree is a real trunk 30–60 m off, the captive facing back the way they came', () => {
  const rng = new RNG(7);
  const caps = [
    { kind: 0, h: 0.7, ax: 35, az: 0, bx: 35, bz: 0, r: 0.45 }, // a stump: too short to tie anyone to
    { kind: 1, h: 9, ax: 38, az: 0, bx: 38, bz: 0, r: 0.5 }, // a rock, not a tree
    { kind: 0, h: 9, ax: 10, az: 0, bx: 10, bz: 0, r: 0.3 }, // too close
    { kind: 0, h: 9, ax: 40, az: 0, bx: 40, bz: 0, r: 0.3 }, // the one
  ];
  const tree = chooseTree(caps, 0, 0, () => rng.next(), A);
  assert.ok(tree && tree.x === 40, 'the tall trunk in the ring');
  assert.ok(tree.ax < 40 && tree.ax > 38, 'the captive sits on the near side of it');
  const fwd = { x: -Math.sin(tree.yaw), z: -Math.cos(tree.yaw) };
  assert.ok(fwd.x < -0.99, 'facing back toward where they were taken (and where help comes from)');
  assert.equal(chooseTree(caps, 0, 0, () => rng.next(), A, () => true), null, 'a vetoed ring leaves him empty-handed');
});

// ---------- the rig ----------
test('the butcher carries a lantern and a cleaver, and fits an echo ghost whole', () => {
  const rig = buildAngler();
  assert.ok(rig.nodes.lantern && rig.nodes.cleaver, 'lantern in one hand, cleaver in the other');
  const n = rig.parts.reduce((s, p) => s + p.arr.count, 0);
  assert.ok(n < 8192, `fits the ghost buffer (${n})`);
  assert.ok(rig.parts.every((p) => p.arr.pos.every(Number.isFinite)));
});

// ---------- the host loop, on a fake game ----------
function fakeGame() {
  const remotes = new Map();
  const audio = new Proxy({ ready: false }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  const hud = new Proxy({}, { get: () => () => {} });
  const player = {
    id: 'me', x: 0, z: 0, y: 0, yaw: 0, pitch: 0, roll: 0, vx: 0, vz: 0, speed: 0,
    alive: true, held: false, carrying: null, crouching: false, sprinting: false,
    eyeCur: 1.62, stamina: 100, bobY: 0, forward() { return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) }; },
  };
  const caps = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2, d = 34 + (i % 5) * 5;
    caps.push({ kind: 0, h: 9, ax: Math.cos(a) * d, az: Math.sin(a) * d, bx: Math.cos(a) * d, bz: Math.sin(a) * d, r: 0.3 });
  }
  const g = {
    role: 'solo', state: 'play', day: 3, daysTotal: 4, awake: true, time: 120, score: 0, mult: 1,
    diffDay() { return this.day; }, // a four-night shift: effective day is the day
    player, remotes, monsters: [], timeline: [], events: [],
    rng: new RNG(4242),
    world: {
      col: { caps, free: () => true, resolve: () => ({ hit: false }) },
      terrain: { height: () => 0 }, lake: null, navigation: null,
      inYard: () => false, losBlocked: () => false,
    },
    doors: null,
    escape: { route: () => null, blocks: () => false, seatOf: () => -1, dropFor() {}, mySeat: -1 },
    glows: { dropFor() {} }, rescue: { place() {} },
    audio, hud, sync: null, coop: null,
    mic: { state: 'off', loud: 0 },
    input: { move: { x: 0, y: 0 }, useHeld: false, touch: false },
    inventory: { active: false, close() { this.active = false; } },
    charge: { active: false }, fx: { fade: 1, red: 0 },
    livePlayers() { return [player, ...remotes.values()].filter((p) => p.alive); },
    playerById(id) { return id === 'me' ? player : remotes.get(id) || null; },
    isPlayer(p) { return !!p && (p.id === 'me' || remotes.has(p.id)); },
    distToEars(x, z) { return Math.hypot(x - player.x, z - player.z); },
    nameOf(p) { return (p && p.id) || String(p); },
    addTrauma() {}, playerNoise() {},
    anglerDeath(m) { this._died = m.type; player.alive = false; },
    anglerTook() { this._took = true; },
    hearingScale: 1, speedScale: 1, grace: false,
  };
  Object.defineProperty(g, 'auth', { get: () => g.role !== 'client' });
  Object.defineProperty(g, 'online', { get: () => g.role !== 'solo' });
  g.angler = new Angler(g);
  g.angler.coolT = 0;
  return g;
}

function drive(g, seconds, dt = 0.05, frame = null) {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) {
    if (frame) frame(i);
    g.angler.update(dt);
    for (const m of [...g.monsters]) m.update(dt, g.time);
    g.time += dt;
  }
}

function untilGrabbed(g) {
  for (let i = 0; i < 2400 && !g.angler.cap; i++) {
    g.angler.update(0.05);
    for (const m of [...g.monsters]) m.update(0.05, g.time);
    g.time += 0.05;
  }
  return g.angler.cap;
}

test('night three: he comes for the loner, and struggling on the drag tears free', () => {
  const g = fakeGame();
  const cap = untilGrabbed(g);
  assert.ok(cap && cap.phase === 'drag', 'the hand closed');
  assert.equal(g.player.held, true);
  const treeD = Math.hypot(cap.tree.x, cap.tree.z);
  assert.ok(treeD >= A.treeMin - 1 && treeD <= A.treeMax + 1, `the tree is ${treeD.toFixed(0)} m off`);
  // alternate A/D like your life depends on it
  let sign = 1;
  for (let i = 0; i < 300 && g.angler.cap; i++) {
    g.input.move.x = (sign = -sign);
    g.angler.captiveFrame(0.05, { dx: 0, dy: 0 });
    g.angler.update(0.05);
  }
  assert.equal(g.angler.cap, null, 'torn free on the way');
  assert.equal(g.player.held, false);
  assert.equal(g.player.alive, true);
});

test('screaming on the drag earns a knockout; carried through, the five minutes end at the tree', () => {
  const g = fakeGame();
  const cap = untilGrabbed(g);
  assert.ok(cap);
  g.mic = { state: 'on', loud: 0.95 };
  drive(g, 4);
  assert.ok(g.angler.cap && (g.angler.cap.ko > 0 || g.angler.cap.phase !== 'drag'), 'the fist landed');
  g.mic = { state: 'off', loud: 0 };
  // no struggle: he makes his tree and ties the knot
  for (let i = 0; i < 3000 && g.angler.cap && g.angler.cap.phase !== 'bound'; i++) {
    g.angler.update(0.05);
    for (const m of [...g.monsters]) m.update(0.05, g.time);
    g.time += 0.05;
  }
  assert.ok(g.angler.cap && g.angler.cap.phase === 'bound', 'tied');
  assert.ok(g.angler.cap.boundLeft > A.boundFor - 5, 'a fresh five minutes');
  assert.equal(g.angler.cap.selfFree, true, 'solo: the rope can be chewed');
  // nobody comes; the clock runs out and so does he — back out of the dark
  g.angler.cap.boundLeft = 0.05;
  drive(g, 30);
  assert.equal(g._died, 'angler', 'finished at the tree, for good');
});

test('dawn drops a drag where it lies, but the tied stay tied and the clock keeps running', () => {
  const g = fakeGame();
  untilGrabbed(g);
  g.state = 'dawn';
  g.angler.update(0.05);
  assert.equal(g.angler.cap, null, 'dropped at first light');

  const g2 = fakeGame();
  untilGrabbed(g2);
  for (let i = 0; i < 3000 && g2.angler.cap && g2.angler.cap.phase !== 'bound'; i++) {
    g2.angler.update(0.05);
    for (const m of [...g2.monsters]) m.update(0.05, g2.time);
    g2.time += 0.05;
  }
  const left = g2.angler.cap.boundLeft;
  g2.state = 'morning';
  g2.angler.update(1);
  assert.ok(g2.angler.cap && g2.angler.cap.phase === 'bound', 'still tied in daylight: friends can walk out to the tree');
  assert.ok(g2.angler.cap.boundLeft < left, 'and his clock did not stop for the sun');
});

test('back among friends he lets the matter drop; an untie is the host’s word, checked by distance', () => {
  const g = fakeGame();
  g.role = 'host';
  const mate = { id: 'r1', x: 80, z: 0, y: 0, yaw: 0, alive: true, held: false, loud: 0, speed: 0, carriedBy: null };
  g.remotes.set('r1', mate);
  g.player.x = -80; // two loners: he picks one (the local player is as alone as the mate)
  drive(g, 2);
  assert.ok(g.angler.hunt, 'someone is being stalked');
  mate.x = g.player.x + 5; // together again
  drive(g, A.regroupT + 2);
  assert.equal(g.angler.hunt, null, 'interest lost');
  assert.equal(g.angler.cap, null);

  // the untie: too far is no untie, at the rope it is
  g.angler.cap = { pid: 'r1', phase: 'bound', tree: { x: 40, z: 0, r: 0.3, ax: 39.2, az: 0, fx: 38, fz: 0, yaw: 1.5 }, t: 0, dragT: 0, boundLeft: 200, irrit: 0, ko: 0, struggle: 0, returning: false, mid: -1, selfFree: false };
  mate.held = true; mate.x = 39.2; mate.z = 0;
  g.player.x = 0; g.player.z = 0;
  g.angler.hostUntie('r1', 'me');
  assert.ok(g.angler.cap, 'forty metres of good intentions cut nothing');
  g.player.x = 38.4;
  g.angler.hostUntie('r1', 'me');
  assert.equal(g.angler.cap, null, 'at the rope, it counts');
});

// ---------- Keanu ----------
test('the Keanu set is free, dyed and complete — and travels without a guitar (2.1q took it away)', () => {
  assert.ok(THEMES.includes('keanu'));
  assert.ok(ITEMS.head.some((i) => i.id === 'keanuhair') && ITEMS.body.some((i) => i.id === 'keanusuit'));
  const fit = cleanFit({ head: 'keanuhair', body: 'keanusuit' });
  assert.equal(fit.head, 'keanuhair');
  assert.equal(fullSet(fit), 'keanu');
  const rig = buildSurvivor(fit);
  assert.equal(rig.nodes.guitar, undefined, 'no guitar on the rig any more');
  assert.ok(rigVerts(rig) < 8192, `fits the echo buffers (${rigVerts(rig)})`);
  assert.ok(rig.parts.every((p) => p.arr.pos.every(Number.isFinite)));
});

// ---------- the film ----------
test('the departure film: one schedule, and the car moves only once everyone is in (3.0u)', () => {
  // (2.1o staged one passenger left behind to chase the rolling car; 3.0u boards everyone before the latch —
  // see tests/round30u for the boarding itself — so the film's schedule no longer depends on who is in the room)
  const plan = departPlan();
  assert.equal(plan.driveAt, DEPART.driveAt);
  assert.ok(DEPART.keyAt < DEPART.idleAt && DEPART.idleAt < DEPART.driveAt && DEPART.driveAt < DEPART.fadeAt && DEPART.fadeAt < DEPART.doneAt);
  assert.ok(DEPART.gateTo <= DEPART.idleAt, 'the gates are open before the car catches');
});

// ---------- words ----------
test('the Angler is named in both languages, on the death screen and at the rope', () => {
  const oldDoc = globalThis.document; globalThis.document = { documentElement: {} };
  try {
    setLang('ru');
    assert.equal(t('deathBy').angler, 'Удильщик');
    assert.match(t('anglerGrabbed'), /ВЗЯЛ/);
    setLang('en');
    assert.equal(t('deathBy').angler, 'The Angler');
    assert.match(t('anglerGrabbed'), /HAS YOU/);
  } finally { setLang('ru'); globalThis.document = oldDoc; }
});

// ---------- the atlas ----------
test('the atlas has his page: entry, both languages, and a plate that stands, walks and hauls', () => {
  const beasts = CHAPTERS.find((c) => c.id === 'beasts');
  assert.ok(beasts.entries.includes('angler'), 'chapter I lists him');
  assert.equal(ENTRIES.angler.kind, 'beast');
  assert.deepEqual(ENTRIES.angler.log.map((l) => l[1]), ['seen:angler', 'kills:angler'], 'the log reads his stats');
  for (const lang of ['ru', 'en']) {
    const e = atlasText(lang).entries.angler;
    assert.ok(e && e.name && e.latin && e.text.length >= 2 && e.tips.length >= 3 && e.facts.length >= 5 && e.quote, lang);
  }
  assert.equal(atlasText('ru').entries.angler.name, 'Удильщик');
  assert.equal(atlasText('en').entries.angler.name, 'The Angler');
  // the whole book still resolves: every listed page has an entry and both texts
  for (const p of pageList()) {
    if (p.id === 'contents') continue;
    assert.ok(ENTRIES[p.id], p.id);
    assert.ok(atlasText('ru').entries[p.id] && atlasText('en').entries[p.id], p.id);
  }
  const mat = new THREE.MeshBasicMaterial();
  const model = buildModel('angler', mat);
  assert.ok(model && model.root.children.length > 0, 'the plate builds');
  const S = { t: 0, dt: 1 / 30, lit: 0.5, pinged: false, camAz: 0.3, react: 99 };
  for (let i = 0; i < 90; i++) { S.t += S.dt; model.tick(S); } // his idle round
  S.react = 0;
  for (let i = 0; i < 150; i++) { S.t += S.dt; S.react += S.dt; model.tick(S); } // his sound: the walk, the grab, the haul
  for (const pose of model.poses || []) pose();
  model.root.traverse((o) => { if (o.geometry) { assert.ok(o.geometry.attributes.position.array.every(Number.isFinite)); o.geometry.dispose(); } });
  mat.dispose();
});

// ---------- the borrowed sting ----------
test('his entrance is a recording the forest borrowed — filed, loadable and wired to his appearing', () => {
  const url = new URL('../public/audio/angler-found.mp3', import.meta.url);
  const st = statSync(url);
  assert.ok(st.size > 50_000, `the file is really carried (${st.size} B)`);
  const head = readFileSync(url).subarray(0, 3);
  assert.ok(head.toString('latin1') === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0), 'and it is an MP3');
  assert.equal(typeof AudioEngine.prototype.anglerFound, 'function', 'the engine can play it');
  assert.equal(typeof AudioEngine.prototype.prefetchAnglerFound, 'function', 'and fetch it before the third night');
});

// ---------- the film faces forward; the screen knows his face ----------
test('the departure cast faces where it runs: rigs look down +Z, so the yaw is a plain atan2', () => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [3, 4], [-2, -5], [7, -1]]) {
    const y = faceYaw(2, -3, 2 + dx, -3 + dz), d = Math.hypot(dx, dz);
    assert.ok(Math.abs(Math.sin(y) - dx / d) < 1e-9 && Math.abs(Math.cos(y) - dz / d) < 1e-9, `toward ${dx},${dz}`);
  }
  assert.equal(faceYaw(5, 5, 5, 9), 0, 'straight down +Z needs no turn at all');
  assert.equal(faceYaw(0, 0, -4, 0), -Math.PI / 2, 'toward the gates (-X) is the seated yaw — the straggler ran back-first on +PI');
});

test('the screen head can wear him: a lantern in one hand, a cleaver in the other', () => {
  assert.ok(SCREEN_PRESETS.includes('angler'));
  for (const id of SCREEN_PRESETS) {
    const lit = presetPixels(id).reduce((a, b) => a + b, 0);
    assert.ok(id === 'blank' ? lit === 0 : lit > 35, `${id}: ${lit}`);
  }
  const p = presetPixels('angler');
  assert.deepEqual([...decodePixels(encodePixels(p))], [...p], 'the wire round-trip keeps every pixel');
});
