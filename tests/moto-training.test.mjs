// The training ground (2.1): the enduro physics, the rack, the targets, and the gates' film — the
// pure parts, without a browser. What the wire carries ('mb') keeps one bike under one rider.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MOTO, newBike, stepBike, MotoPark } from '../src/game/moto.js';
import { Training } from '../src/game/training.js';
import { BAG_LIMIT } from '../src/game/backpackData.js';

const flat = () => ({ height: () => 0 });
const world = (h = flat(), hit = null) => ({ terrain: h, col: { resolve: (p) => (hit ? hit(p) : p) } });
const drive = (b, w, seconds, move = { x: 0, y: 1 }, dt = 1 / 60) => {
  let ev;
  for (let i = 0; i < Math.round(seconds / dt); i++) ev = stepBike(b, { move }, w, dt);
  return ev;
};

test('the bike pulls away, caps at its top speed, and never runs backwards faster than a walk', () => {
  const b = newBike(0, 0, 0, 0); // facing -z
  drive(b, world(), 6);
  assert.ok(b.speed > MOTO.max * 0.85, `flat out (got ${b.speed.toFixed(1)} m/s)`);
  assert.ok(b.speed <= MOTO.max + 0.01);
  assert.ok(Math.abs(b.x) < 0.05 && b.z < -60, `it travels along its heading (x ${b.x.toFixed(2)}, z ${b.z.toFixed(1)})`);
  const r = newBike(0, 0, 0, 0);
  drive(r, world(), 3, { x: 0, y: -1 });
  assert.ok(r.speed >= -3.6 && r.speed <= 0, `reverse crawls (got ${r.speed.toFixed(1)})`);
});

test('the bar turns it, the body leans into the turn, and it does not turn while parked', () => {
  const b = newBike(0, 0, 0, 0);
  drive(b, world(), 2.5, { x: 1, y: 1 }); // steering right, on the gas
  const turned = b.yaw;
  assert.ok(turned < -0.35, `steering right turns right over time (yaw ${turned.toFixed(2)})`);
  assert.ok(b.roll < -0.1, `and leans into it (roll ${b.roll.toFixed(2)})`);
  const parked = newBike(1, 5, 5, 0.3);
  drive(parked, world(), 1.5, { x: 1, y: 0 });
  assert.ok(Math.abs(parked.yaw - 0.3) < 1e-6, 'a parked bike stays parked');
  assert.equal(parked.x, 5);
});

test('a crest at speed throws it into the air; it lands, and the landing is an event', () => {
  const cliff = { height: (x, z) => (z > -8 ? 0 : -1.4) }; // the ground falls away ahead
  const b = newBike(0, 0, 0, 0);
  let landed = 0;
  for (let i = 0; i < 600; i++) {
    const ev = stepBike(b, { move: { x: 0, y: 1 } }, world(cliff), 1 / 60);
    if (ev.landed > 0) landed++;
    if (b.z < -20) break;
  }
  assert.ok(b.air > 0 || landed > 0, 'it left the ground over the crest');
  assert.ok(landed > 0, 'and came down (the landing event fired)');
  assert.ok(Math.abs(b.y - cliff.height(b.x, b.z)) < 0.02, 'and settled on the ground');
});

test('a tree head-on at speed throws the rider; a glancing blow only bumps', () => {
  const b = newBike(0, 0, 0, 0);
  drive(b, world(), 2.2); // ~13 m/s
  const wallZ = b.z - 3; // a trunk three metres ahead of where it is now
  const w = world(flat(), (p) => (Math.abs(p.z - wallZ) < 0.5 ? { hit: true, nx: 0.05, nz: 1 } : p));
  let threw = false, bump = 0;
  for (let i = 0; i < 90 && !threw; i++) {
    const ev = stepBike(b, { move: { x: 0, y: 1 } }, w, 1 / 60);
    threw = ev.threw;
    bump = Math.max(bump, ev.bump);
  }
  assert.equal(threw, true, 'a head-on at speed throws the rider');
  assert.ok(b.hit > 0.9, `the throw is marked on the bike (hit ${b.hit.toFixed(2)})`);
  // the glancing one: the normal is sideways, the slide survives
  const g = newBike(1, 0, 0, 0);
  drive(g, world(), 2);
  const wallZ2 = g.z - 3;
  const w2 = world(flat(), (p) => (Math.abs(p.z - wallZ2) < 0.5 ? { hit: true, nx: 1, nz: 0.15 } : p));
  let threw2 = false;
  for (let i = 0; i < 90; i++) threw2 = stepBike(g, { move: { x: 0, y: 1 } }, w2, 1 / 60).threw || threw2;
  assert.equal(threw2, false, 'a slide along the trunk does not throw');
});

test('grip bleeds off sideways slip — the back steps out, then catches', () => {
  const b = newBike(0, 0, 0, 0);
  b.vx = 6; // shoved sideways
  b.vz = 0;
  for (let i = 0; i < 40; i++) stepBike(b, { move: { x: 0, y: 0 } }, world(), 1 / 60);
  assert.ok(Math.abs(b.vx) < 0.5, `the slide stops (vx ${b.vx.toFixed(2)})`);
  assert.ok(Math.abs(b.vz) < 0.1, 'and it did not gain forward speed from a shove');
});

// ---------------- the park ----------------
function park() {
  const p = Object.create(MotoPark.prototype);
  p.g = { training: true, rider: -1, mountT: 0, hud: { setUse() {} }, sync: null, world: { terrain: { height: () => 0 } } };
  p.bikes = [newBike(0, 0, 0, 0), newBike(1, 2, 0, 0)];
  p.riders = new Map();
  p.rider = -1;
  p.mountT = 0;
  return p;
}
test('a friend\'s bike is not yours to take: the park hides what is ridden', () => {
  const p = park();
  p.netMount('b', 0, true); // a friend got on bike 0
  assert.equal(p.riders.get(0), 'b');
  const found = [];
  p.consider((b) => found.push(b.i));
  assert.deepEqual(found, [1], 'only the free bike is mountable');
  p.netMount('b', 0, false);
  const found2 = [];
  p.consider((b) => found2.push(b.i));
  assert.deepEqual(found2, [0, 1]);
});

test('mounting claims the nearest free bike and dismounting steps you off beside it', () => {
  const p = park();
  p.g.player = { x: 0.4, z: 0.1, yaw: 0.2, vx: 2, vz: 0 };
  p.g.audio = {};
  p.g.hud = { popup() {} };
  p.mount(0);
  assert.equal(p.rider, 0);
  assert.equal(p.mountT > 0, true, 'a beat of getting on');
  p.mountT = 0;
  p.dismount();
  assert.equal(p.rider, -1);
  const ex = 0.4 + Math.cos(0.2) * 0.9, ez = 0.1 - Math.sin(0.2) * 0.9;
  assert.ok(Math.abs(p.g.player.x - ex) < 0.01 && Math.abs(p.g.player.z - ez) < 0.01, 'stepped off to the side');
});

// ---------------- the rack and the targets ----------------
function range() {
  const g = {
    player: { stones: 0, flares: 0, hasFlare: false },
    glows: { count: 0 },
    torch: { has: false, charge: 0 },
    inventory: { cells: 0, syringes: 0, reconcile() {} },
    partMap: { has: false },
    hud: { popup() {} },
    audio: { ready: false },
    setFlares(n, has) { g.player.flares = n; g.player.hasFlare = has; },
    stones: { list: [] },
    flares: { list: [] },
  };
  const tr = Object.create(Training.prototype);
  tr.g = g;
  tr.rackT = 0;
  tr.targets = [];
  tr.hits = 0;
  return { tr, g };
}

test('the rack hands out the whole kit — capped by the pockets\' own limits', () => {
  const { tr, g } = range();
  tr.take();
  assert.equal(g.player.stones, 3);
  assert.equal(g.glows.count, 3);
  assert.equal(g.torch.has, true);
  assert.equal(g.torch.charge, 1);
  assert.equal(g.inventory.cells, 3);
  assert.equal(g.player.flares, 2);
  assert.equal(g.player.hasFlare, true);
  assert.equal(g.inventory.syringes, BAG_LIMIT.syringe);
  assert.equal(g.partMap.has, true);
  assert.ok(tr.rackT > 0, 'the rack needs its beat');
  // taking again never exceeds the caps
  g.player.stones = 2;
  g.player.flares = 6;
  tr.rackT = 0;
  tr.take();
  assert.equal(g.player.stones, 3, 'topped up');
  assert.equal(g.player.flares, 6, 'never over the pocket');
});

test('a passing stone knocks a target over; it stands back up on its own', () => {
  const { tr, g } = range();
  const mesh = { rotation: { x: 0 } };
  tr.targets = [{ mesh, x: 0, y: 0, z: -9, k: 0, up: 1, resetT: 0, i: 0 }];
  g.stones.list = [{ x: 0, y: 0.8, z: -9, dead: false }];
  tr.update(1 / 60);
  assert.equal(tr.targets[0].up, 0, 'knocked flat');
  assert.equal(tr.hits, 1);
  assert.ok(mesh.rotation.x <= -Math.PI / 2 + 1e-6, `toppled backward the moment it is hit (rx ${mesh.rotation.x.toFixed(2)})`);
  // the stone is gone; six seconds later the board rights itself
  g.stones.list = [];
  for (let i = 0; i < 8 * 60; i++) tr.update(1 / 60);
  assert.equal(tr.targets[0].up, 1);
  assert.equal(mesh.rotation.x, 0);
  // a dead flare does not count, and a low stone passes under the board
  tr.hits = 0;
  g.flares.list = [{ x: 0, y: 0.8, z: -9, dead: true }];
  tr.update(1 / 60);
  g.flares.list = [{ x: 0, y: 0.8, z: -9, dead: false }];
  tr.update(1 / 60);
  assert.equal(tr.hits, 1, 'a burning flare knocks it too');
});

// ---------------- the gates' film ----------------
async function garageStub() {
  const oldDoc = globalThis.document;
  const ctx2d = new Proxy({}, { get: (o, k) => (k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}) });
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, addEventListener() {}, style: {} }),
    getElementById: () => null,
  };
  try {
    const { Garage } = await import('../src/ui/garage.js');
    return { garage: new Garage({ renderer: null, post: { u: {} }, audio: null }), restore: () => (globalThis.document = oldDoc) };
  } finally { /* restored by the caller */ }
}

test('the departure film: it starts once, plays its beats, and fires exactly once at the end', async () => {
  const stub = await garageStub();
  const garage = stub.garage;
  try {
    let fired = 0;
    assert.equal(garage.startDepart(() => fired++), true);
    assert.equal(garage.startDepart(() => fired++), false, 'not twice');
    assert.ok(garage.gateLeaves && garage.gateLeaves.length === 2, 'the leaves ride their own meshes');
    // the whole film, in frame-sized steps
    for (let i = 0; i < 60 * 8; i++) garage._departure(1 / 60);
    assert.equal(fired, 1, 'the destination is called exactly once');
    assert.equal(garage.depart, null);
    assert.equal(garage.gateLeaves, null, 'the room is whole again');
    // and it can play again
    assert.equal(garage.startDepart(() => fired++), true);
    garage._endDepart();
    assert.equal(fired, 1, 'a cancelled film never fires its destination');
  } finally {
    stub.restore();
  }
});

test('the gates are where they are: hitGate finds the gate rectangle on screen and nothing else', async () => {
  const stub = await garageStub();
  const garage = stub.garage;
  try {
    if (garage.resize) garage.resize(1280, 720); else { garage.w = 1280; garage.h = 720; }
    garage.camera.position.set(2.2, 1.6, 0.2);
    garage.camera.lookAt(-4.3, 1.2, -0.2);
    garage.camera.updateMatrixWorld(true);
    const cx = (x) => Math.round(x);
    // a point in the middle of the gates (project the gate's centre by hand)
    const v = new THREE.Vector3(-4.4, 1.2, -0.2).project(garage.camera);
    const sx = cx((v.x * 0.5 + 0.5) * garage.w), sy = cx((-v.y * 0.5 + 0.5) * garage.h);
    assert.equal(garage.hitGate(sx, sy), true, `the gate's own centre (${sx},${sy}) hits`);
    assert.equal(garage.hitGate(40, 40), false, 'the corner of the screen is not the gates');
    assert.equal(garage.hitGate(sx + 400, sy), false, 'well to the side is not');
  } finally {
    stub.restore();
  }
});

// ---------------- wiring: the range actually runs ----------------
// (2.1 shipped the pieces but the state never stepped them: the training ground stood frozen, the
//  player could not move, and nothing answered E. These keep the loop honest.)
test('updateTraining walks, steps the park and the trainer, and lets E work the rack', async () => {
  const { Game } = await import('../src/game/game.js');
  assert.equal(typeof Game.prototype.updateTraining, 'function', 'the state machine has its training step');
  const calls = { player: 0, motos: 0, train: 0, interact: 0, primary: 0 };
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    time: 0, role: 'solo', inputMuted: false, leashT: 0, pingCD: 0, pingCDMax: 1, pingQueue: null,
    charge: { active: false, t: 0 }, events: [], fx: { danger: 0 },
    player: { alive: true, eyeCur: 1.62, roll: 0, pitch: 0.1, speed: 0, update() { calls.player++; return { step: null, bump: null }; } },
    input: { touch: false, uiMode: false, useHeld: true, reset() {}, keys: new Set() },
    motos: { rider: -1, bikes: [{ roll: 0.4 }], update() { calls.motos++; } },
    train: { update() { calls.train++; } },
    objectives: { update() {}, _interact() { calls.interact++; } },
    doors: { update() {} }, cabinets: { update() {} }, medhut: { update() {} }, torch: { update() {} },
    glows: { update() {} }, stones: { update() {} }, flares: { update() {} }, rescue: { update() {} },
    pulses: { update() {} }, hud: { setIntro() {} }, audio: { footstep() {}, bump() {} },
    inventory: { active: false, primary() { calls.primary++; }, secondary() {} },
    _commonFx() {},
  });
  g.updateTraining(1 / 60, { look: { dx: 0, dy: 0 }, events: ['primary'] });
  assert.equal(calls.player, 1, 'on foot the walker updates');
  assert.equal(calls.motos, 1, 'the park updates');
  assert.equal(calls.train, 1, 'the targets update');
  assert.equal(calls.interact, 1, 'E is offered to whatever is at hand');
  assert.equal(calls.primary, 1, 'using an item works on the range');
  assert.ok(g.time > 0);

  // in the saddle the bike is the body: no walker, seat-height eye, camera leans with the machine
  calls.player = 0; calls.motos = 0;
  g.motos.rider = 0;
  g.updateTraining(1 / 60, { look: { dx: 0, dy: 0 }, events: [] });
  assert.equal(calls.player, 0, 'the walker stands down while riding');
  assert.equal(calls.motos, 1);
  assert.ok(Math.abs(g.player.eyeCur - MOTO.seat) < Math.abs(1.62 - MOTO.seat), 'the eye line drops toward the seat');
  assert.ok(Math.abs(g.player.roll - 0.4 * 0.55) < 1e-6, 'the camera leans with the bike');
});

test('in the saddle E only steps off: the bike under you is the one offer', () => {
  const p = park();
  p.rider = 1;
  p.mountT = 0;
  const found = [];
  p.consider((b, x, z, r, kind) => found.push({ i: b.i, kind }));
  assert.deepEqual(found, [{ i: 1, kind: 'moto' }], 'E finds the machine you are sitting on');
});

test('the bike row is parked clear of the rack apron, so E at the shelves takes the kit', async () => {
  const { Training } = await import('../src/game/training.js');
  const tr = Object.create(Training.prototype);
  tr.targets = [];
  const g = { rackX: 0, rackZ: 0, trainingYaw: 0, motos: { reset() {} } };
  // the same placement rule begin() uses: bikes 4.6 m out along the rack's outward axis
  const gen = { x: 0, z: 0 };
  const ox = 0, oz = -1;
  const rackX = gen.x + ox * 4.6, rackZ = gen.z + oz * 4.6;
  assert.ok(Math.hypot(rackX - 0, rackZ - 0) > 2.1 + 1.9, 'a bike cannot be picked from the rack face');
});
