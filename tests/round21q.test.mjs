// 2.1q regressions: the Angler actually catches a loner now (distance-scaled approach), things break
// running generators from the third night (and the break rides the state merge without resurrecting),
// car parts may be hauled in the morning, the flashlight and the syringe actually turn up, and no
// points are paid twice for the same engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CFG } from '../src/core/config.js';
import { RNG } from '../src/core/rng.js';
import { Angler, approachSpeed } from '../src/game/angler.js';
import { Objectives } from '../src/game/objectives.js';
import { Game } from '../src/game/game.js';
import { LANDMARKS } from '../src/world/world.js';
import { SPOTS, torchCount } from '../src/game/torch.js';
import { LOOT_ITEMS, LOOT_W } from '../src/game/cabinets.js';
import { LOOT_KIND } from '../src/game/backpackData.js';

const A = CFG.ANGLER;

// ---------- the Angler closes distance ----------
test('approach speed: a lope while far, a workman’s walk up close', () => {
  assert.equal(approachSpeed(100), A.approachFar);
  assert.equal(approachSpeed(A.farR), A.approachFar);
  assert.equal(approachSpeed(12), A.approach);
  assert.equal(approachSpeed(0), A.approach);
  const mid = approachSpeed(21);
  assert.ok(mid > A.approach && mid < A.approachFar, `eases between (${mid})`);
  assert.ok(A.approachFar < CFG.PLAYER.sprint, 'even his lope is out-sprintable — toward friends');
});

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
  for (let gx = -192; gx <= 192; gx += 16) for (let gz = -192; gz <= 192; gz += 16)
    caps.push({ kind: 0, h: 9, ax: gx, az: gz, bx: gx, bz: gz, r: 0.3 });
  const g = {
    role: 'solo', state: 'play', day: 3, daysTotal: 4, diffDay() { return this.day; }, awake: true, time: 120, score: 0, mult: 1,
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

test('a loner who just keeps walking away is still taken (he did not use to be)', () => {
  const g = fakeGame();
  let grabbedAt = -1;
  for (let i = 0; i < 90 / 0.05; i++) {
    g.angler.update(0.05);
    for (const m of [...g.monsters]) m.update(0.05, g.time);
    g.time += 0.05;
    if (g.angler.cap) { grabbedAt = g.time; break; }
    g.player.x += CFG.PLAYER.walk * 0.05; // not sprinting, not stopping: just walking off, alone
    g.player.speed = CFG.PLAYER.walk;
  }
  assert.ok(g.angler.cap, 'the hand closed');
  assert.equal(g.angler.cap.phase, 'drag');
  assert.ok(grabbedAt > 0 && grabbedAt - 120 < 60, `taken without an evening of it (${(grabbedAt - 120).toFixed(1)} s of stalking)`);
});

// ---------- generator sabotage ----------
function mkGen(k, running = true) {
  return {
    k, si: k, site: { id: 'camp', lamp: { x: 0, y: 3, z: 0 } },
    spec: { spin: 5, dur: 4, mode: 'cord', pulls: 3, part: 'fuel', startLoud: 0.5 },
    x: k * 40, y: 0, z: 0, phase: running ? 'running' : 'dead', progress: running ? 1 : 0,
    pulls: 3, pullCD: 0, spinT: 0, spinNoiseT: 0, hasPart: true, known: true, running,
    lamp: running ? 1 : 0, flick: 0, hum: { spin() {}, sputter() { this.sp = true; }, stop() {} },
    beaconT: 0, clankT: 0, sparkT: 0, paid: true, broken: false, breakRev: 0, ranAt: 0,
  };
}
function objectivesDouble(calls) {
  const o = Object.create(Objectives.prototype);
  o.gens = [mkGen(0), mkGen(1)];
  o.bodies = [];
  o.count = 2;
  o.dirty = false;
  o.g = {
    time: 200,
    audio: { genStart() {} },
    onGenBroken(g, remote) { calls.push([g.k, remote]); },
    onGeneratorStarted() {},
    onSpinUp() {},
  };
  return o;
}

test('a beaten generator stops, wants cranking again, and the break rides the merge (never backwards-resurrected)', () => {
  const hostCalls = [], guestCalls = [];
  const host = objectivesDouble(hostCalls);
  const before = JSON.parse(JSON.stringify(host.netState()));
  host.hostBreakGen(host.gens[0]);
  const hg = host.gens[0];
  assert.equal(hg.running, false);
  assert.equal(hg.broken, true);
  assert.equal(hg.phase, 'dead');
  assert.equal(hg.progress, 0);
  assert.equal(hg.pulls, 0);
  assert.equal(hg.breakRev, 1);
  assert.equal(host.count, 1);
  assert.deepEqual(hostCalls, [[0, false]]);
  const state = host.netState();
  assert.equal(state.g[0][5], 1, 'the revision rides the wire');

  const guest = objectivesDouble(guestCalls);
  guest.netMerge(state, null);
  assert.equal(guest.gens[0].running, false, 'the guest’s engine stops too');
  assert.equal(guest.gens[0].broken, true);
  assert.deepEqual(guestCalls, [[0, true]]);
  // a stale pre-break snapshot (running, rev 0) must not bring it back
  guest.netMerge(before, null);
  assert.equal(guest.gens[0].running, false, 'stale word cannot resurrect it');
  assert.equal(guest.gens[0].phase, 'dead');

  // cranked again on the host: broken clears, the run clock for the next errand restarts
  host._start(host.gens[0]);
  assert.equal(host.gens[0].broken, false);
  assert.equal(host.gens[0].ranAt, 200);
  assert.equal(host.count, 2);
});

test('the director sends a thing to a far, long-running generator — from night 4 (3.1m), at most twice a night, never the Watcher', () => {
  const mk = (day, px, pz, done = 0) => {
    const g = Object.create(Game.prototype);
    g.day = day; g.time = 200; g.role = 'host'; g.rng = new RNG(3);
    g.objectives = {
      count: 2,
      gens: [
        { k: 0, x: 0, z: 0, running: true, ranAt: 100 },
        { k: 1, x: 50, z: 0, running: true, ranAt: 190 }, // too fresh: minRun spares it
        { k: 2, x: 90, z: 0, running: false, ranAt: 0 },
      ],
    };
    g.livePlayers = () => [{ x: px, z: pz, alive: true }];
    g.monsters = [
      { type: 'listener', state: 'wander', x: 6, z: 0, sab: null, inv: null, investigate(x, z) { this.inv = [x, z]; } },
      { type: 'watcher', state: 'lurk', x: 1, z: 0, sab: null, investigate() {} },
    ];
    if (done) g.sab = { day, done, next: 0 };
    return g;
  };
  const third = mk(3, 120, 120);
  third._sabotageTick();
  assert.equal(third.monsters[0].sab, null, '(3.1m) the third night is the Angler’s: the engines are left alone');
  const g = mk(4, 120, 120);
  g._sabotageTick();
  assert.equal(g.monsters[0].sab.k, 0, 'the old, far engine gets the errand');
  assert.deepEqual(g.monsters[0].inv, [0, 0]);
  assert.equal(g.monsters[1].sab, null, 'the Watcher is never sent');
  // one errand at a time, and the night’s budget is two
  g._sabotageTick();
  assert.equal(g.sab.done, 0, 'nothing double-sent');
  const spent = mk(4, 120, 120, 2);
  spent._sabotageTick();
  assert.equal(spent.monsters[0].sab, null, 'two a night is the lot');
  // night two: they still ignore the machines
  const early = mk(2, 120, 120);
  early._sabotageTick();
  assert.equal(early.monsters[0].sab, null);
  // a player standing at the engine: not under their nose
  const guarded = mk(4, 4, 0);
  guarded._sabotageTick();
  assert.equal(guarded.monsters[0].sab, null, 'someone is right there: no errand');
});

test('an engine pays its points once per shift however often it is beaten and cranked back', () => {
  const g = Object.create(Game.prototype);
  g.stats = {}; g.score = 0; g.mult = 1; g.time = 0; g.state = 'play'; g.timeline = [];
  g.hud = { popup() {}, flashAlert() {}, peek() {} };
  g.pulses = { emit() {} };
  g.particles = { burst() {} };
  g.fx = { white: 0 };
  g.noise = () => {};
  g.addTrauma = () => {};
  g.nameOf = (id) => id;
  const gen = { paid: false, x: 0, z: 0, site: { lamp: { x: 0, y: 3, z: 0 } }, spec: { startLoud: 0.5 } };
  g.onGeneratorStarted(gen, 1);
  assert.equal(g.score, CFG.SCORE.generator);
  g.onGeneratorStarted(gen, 1);
  assert.equal(g.score, CFG.SCORE.generator, 'no second helping');
});

// ---------- loot & the morning ----------
test('two flashlights lie out there (three in co-op), and the syringe is ordinary loot now', () => {
  assert.equal(torchCount(false), 2, 'a solo night has two to find (it had one, and nobody found it)');
  assert.equal(torchCount(true), 3, 'a co-op night has three');
  assert.ok(SPOTS.length >= torchCount(true), 'enough spots to never double up');
  assert.ok(SPOTS.includes('sovkhoz'), 'the farm can hold one too');
  for (const id of SPOTS) assert.ok(LANDMARKS.some((l) => l.id === id), `spot ${id} is a real place`);

  assert.ok(LOOT_ITEMS.includes('syringe'), 'a dose turns up in ordinary cupboards');
  const sum = LOOT_W.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `weights still make a whole (${sum})`);
  assert.equal(LOOT_ITEMS.length, LOOT_W.length);
  assert.equal(LOOT_KIND.syringe, 'syringe', 'and the bag knows what to do with it');
});

test('in the morning your hands may haul a car part — but the УАЗ does not take passengers until night', () => {
  const scenario = (kinds, morning) => {
    const obj = Object.create(Objectives.prototype);
    const g = {
      player: { x: 0, z: 0, yaw: 0, alive: true, carrying: null, speed: 0, forward: () => ({ x: 0, z: -1 }) },
      input: { touch: false, useHeld: false },
      events: [],
      hud: { setUse() {} },
      inventory: { active: false, consider() {} },
      expedition: null, cabinets: { pry: null, consider() {} }, doors: null, rescue: null, glows: null, torch: null,
      tools: null, partMap: null, training: false, motos: null,
      escape: {
        mySeat: -1, held: null, idle() {}, canLoad: () => false,
        consider(fn) { for (const k of kinds) fn({ key: 'wheel' }, 0, -0.5, 2, k); },
        interact(best) { g._kind = best.kind; },
      },
    };
    obj.g = g; obj.bodies = []; obj.gens = []; obj.note = null; obj.target = null; obj.searchT = 0;
    obj._interact(0.016, morning);
    return obj.target ? obj.target.kind : null;
  };
  assert.equal(scenario(['part', 'carDoor'], true), 'part', 'morning: the part is offered, the car door is not');
  assert.equal(scenario(['carDoor'], true), null, 'morning: no sitting in the car');
  assert.equal(scenario(['carFit'], true), 'carFit', 'morning: fitting it is fine too');
  assert.equal(scenario(['carDoor'], false), 'carDoor', 'night: as it always was');
});
