// The four-day shift, the adrenaline syringe and the enduro bikes: pure logic, no DOM required.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CFG } from '../src/core/config.js';
import { Game } from '../src/game/game.js';
import { Moto } from '../src/game/moto.js';
import { Training } from '../src/game/training.js';
import { Rescue } from '../src/game/rescue.js';

test('the shift is four days of 8:00 nights and 1:45 mornings', () => {
  assert.equal(CFG.CYCLE.days, 4);
  assert.equal(CFG.CYCLE.night, 480);
  assert.equal(CFG.CYCLE.morning, 105);
  assert.equal(CFG.MORNING_SECONDS, CFG.CYCLE.morning);
  assert.ok(CFG.CYCLE.lastWake > 0 && CFG.CYCLE.lastWake < CFG.CYCLE.night);
});

function cycle(day, time, endgame = false) {
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    state: 'play', time, day, endgame, wakeT: 0, role: 'host',
    nightOverAt: Game.prototype.nightOverAt, endgameAt: Game.prototype.endgameAt,
    calls: [],
  });
  g.startMorning = () => { g.calls.push('morning'); g.state = 'morning'; };
  g.startDawn = () => { g.calls.push('dawn'); g.state = 'dawn'; };
  g.fxWake = () => { g.calls.push('wake'); };
  g.sync = { ev: (...a) => g.calls.push('ev:' + a[0]) };
  g.tickCycle(0.1);
  return g;
}

test('a night ends in a new morning until the fourth day', () => {
  const a = cycle(1, CFG.CYCLE.night + 1);
  assert.deepEqual(a.calls, ['morning']);
  assert.equal(a.state, 'morning');
  const b = cycle(3, CFG.CYCLE.night + 1);
  assert.deepEqual(b.calls, ['morning']);
  const c = cycle(4, CFG.CYCLE.night + 1);
  assert.deepEqual(c.calls, ['dawn']); // the fourth night ends the shift in daylight
  assert.ok(!c.calls.includes('morning'));
});

test('the last night wakes the forest early and then never lets go', () => {
  const early = cycle(4, CFG.CYCLE.lastWake - 5);
  assert.equal(early.endgame, false);
  const late = cycle(4, CFG.CYCLE.lastWake + 1);
  assert.equal(late.endgame, true);
  assert.deepEqual(late.calls, ['ev:wk', 'wake']);
  const past = cycle(4, 300, true);
  assert.deepEqual(past.calls, []); // already awake: no re-announcing
});

function bikeGame() {
  const g = {
    player: { x: 0, z: 0, y: 0, yaw: 0, alive: true },
    world: { col: { resolve: () => ({ hit: false }) }, terrain: { height: () => 0 } },
    input: { move: { x: 0, y: 1 }, sprint: false, crouch: false },
    particles: { burst() {} }, addTrauma() {}, audio: { ready: false },
  };
  const m = Object.create(Moto.prototype);
  m.g = g;
  m.bikes = [];
  m.bike = null;
  m.orbit = 0;
  m.orbitPitch = 0;
  const b = { x: 0, z: 0, y: 0, yaw: 0, v: 0, vy: 0, steer: 0, lean: 0, pitch: 0, onGround: true };
  return { g, m, b };
}

test('the throttle pulls an enduro up to its top speed and the brake brings it back', () => {
  const { g, m, b } = bikeGame();
  for (let i = 0; i < 400; i++) m.drive(b, 1 / 60, 1);
  assert.ok(b.v > CFG.MOTO.top * 0.75, `speed ${b.v}`);
  assert.ok(b.v <= CFG.MOTO.top * 1.19 + 0.001);
  g.input.move.y = -1;
  for (let i = 0; i < 200; i++) m.drive(b, 1 / 60, 1);
  assert.ok(b.v < 1.5, `braked to ${b.v}`);
});

test('the bars turn the bike and it leans into the corner', () => {
  const { g, m, b } = bikeGame();
  for (let i = 0; i < 90; i++) m.drive(b, 1 / 60, 1);
  const yaw0 = b.yaw;
  g.input.move.y = 0.6;
  g.input.move.x = 1;
  for (let i = 0; i < 60; i++) m.drive(b, 1 / 60, 1);
  assert.ok(Math.abs(b.yaw - yaw0) > 0.05, 'the bike turned');
  assert.ok(b.lean < -0.02, 'and leaned into it');
});

test('the suspension leaves the ground on a crest and lands again', () => {
  const { g, m, b } = bikeGame();
  let drop = false;
  g.world.terrain.height = () => (drop ? 0 : 0);
  for (let i = 0; i < 200; i++) m.drive(b, 1 / 60, 1);
  // a real lip: the ground under the bike falls away
  b.y = 0.6;
  b.onGround = true;
  m.drive(b, 1 / 60, 1);
  assert.equal(b.onGround, false);
  for (let i = 0; i < 120; i++) m.drive(b, 1 / 60, 1);
  assert.equal(b.onGround, true);
  assert.ok(Math.abs(b.y) < 0.001);
});

test('the syringe finds a friend who is down, in front, within reach — and not yourself', () => {
  const me = { id: 'a', alive: true, x: 0, z: 0, yaw: 0, forward: () => ({ x: 0, z: -1 }) };
  const down = { id: 'b', alive: false, x: 0, z: -1.4, gon: false, gone: false, consumed: false };
  const behind = { id: 'c', alive: false, x: 0, z: 3, gone: false, consumed: false };
  const g = {
    online: true, auth: true, player: me,
    remotes: new Map([['b', down], ['c', behind]]),
    inventory: { syringes: 1, reconcile() {} },
    hud: { popup() {} }, audio: { cabinetItem() {} },
    playerById: (id) => (id === 'a' ? me : id === 'b' ? down : behind),
    world: { terrain: { height: () => 0 } },
    score: 0, mult: 1, stats: {},
  };
  const r = Object.create(Rescue.prototype);
  r.g = g;
  let revived = null;
  r.hostAdrenaline = (bodyId, reviverId) => { revived = [bodyId, reviverId]; return true; };
  r.downed = Rescue.prototype.downed;
  assert.equal(r.adrenaline(), true);
  assert.deepEqual(revived, ['b', 'a']);
  assert.equal(g.inventory.syringes, 0);
  // empty pockets: the second press does nothing
  assert.equal(r.adrenaline(), false);
});

test('a syringe revive sets the five-minute come-down and brings the body up where it fell', () => {
  const b = { id: 'b', alive: false, x: 3, z: 4, yaw: 0.2, gone: false, onCot: true, carriedBy: null, revive(x, z, yaw) { this.alive = true; this.x = x; this.z = z; this.yaw = yaw; } };
  const g = {
    auth: true, player: { id: 'a', alive: true }, score: 0, mult: 1, stats: {},
    world: { terrain: { height: () => 1 } },
    audio: { reviveGasp() {} }, hud: { popup() {} },
    playerById: () => b,
    nameOf: () => 'Friend',
  };
  const r = Object.create(Rescue.prototype);
  r.g = g;
  r.adrenalineRevive(b, 3, 4, 0.2, 'a');
  assert.equal(b.alive, true);
  assert.equal(b.adrenaline, CFG.ADRENALINE.duration);
  assert.deepEqual([b.x, b.z], [3, 4]);
});

test('the training rack hands out supplies the bag counts, not pocket furniture', () => {
  const inv = {
    slots: ['stones', 'glow', 'adrenaline', null], syringes: 0,
    gain(d) { this.syringes += d.n; this.last = d; },
    reconcile() {}, full() {},
  };
  const g = { player: { id: 'a' }, inventory: inv, tools: { items: [], geo: {} }, hud: { popup() {} }, audio: { ready: false } };
  const tr = Object.create(Training.prototype);
  tr.g = g;
  tr.items = [];
  tr.give('adrenaline');
  assert.equal(inv.syringes, 1);
  assert.deepEqual(inv.last, { kind: 'adrenaline', n: 1 });
  tr.give('flare');
  assert.deepEqual(inv.last, { kind: 'flare', n: 2, gun: true });
});

test('a whole enduro builds, spawns one per survivor and packs itself away', async () => {
  const THREE = await import('three');
  const scene = new THREE.Scene();
  const hits = [];
  const g = {
    scene, time: 0, remotes: new Map(), addTrauma() {},
    world: { terrain: { height: () => 0 }, col: { resolve: (p) => { hits.push(p.x); return { hit: false, nx: 0, nz: 0 }; }, free: () => true } },
    player: { x: 0, z: 0, y: 0, yaw: 0, alive: true, eyeCur: 1.6 },
    input: { move: { x: 0, y: 0 }, sprint: false, crouch: false, touch: false },
    hud: { setUse() {}, popup() {} }, audio: { ready: false }, particles: { burst() {} },
  };
  const moto = new Moto(g);
  moto.reset(true);
  assert.equal(moto.bikes.length, CFG.TRAINING.bikes); // one per seat, even when you're alone
  assert.equal(moto.group.children.length, CFG.TRAINING.bikes);
  const b = moto.bikes[0];
  let meshes = 0;
  b.root.traverse((o) => { if (o.isMesh) meshes++; });
  assert.ok(meshes > 25, `the bike has wheels, forks, bars, a tank (${meshes} meshes)`);
  moto.reset(false);
  assert.equal(moto.bikes.length, 0);
  assert.equal(moto.group.children.length, 0);
});

test('the training rack builds nine labelled places on one bench', async () => {
  const THREE = await import('three');
  // the boards are canvas textures; node has no DOM, so give them just enough of one
  const ctx = new Proxy({ measureText: (s) => ({ width: String(s).length * 7 }) }, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
  try {
    const geo = () => new THREE.BoxGeometry(0.2, 0.1, 0.3);
    const g = {
      scene: new THREE.Scene(), time: 0, input: { touch: false },
      world: { terrain: { height: () => 2 } },
      torch: { geo: geo() }, tools: { geo: { tape: geo(), crowbar: geo() } },
      inventory: { geo: { stones: geo(), glow: geo(), flare: geo(), battery: geo(), map: geo(), adrenaline: geo() } },
      hud: { setUse() {}, popup() {} }, audio: { ready: false },
      player: { x: CFG.TRAINING.rack.x, z: CFG.TRAINING.rack.z + 1.6, y: 2, alive: true, forward: () => ({ x: 0, z: -1 }) },
      moto: { riding: false },
    };
    g.scene.add(new THREE.Group());
    const tr = new Training(g);
    tr.reset(true);
    assert.equal(tr.items.length, 9);
    const kinds = tr.items.map((i) => i.kind).sort();
    assert.deepEqual(kinds, ['adrenaline', 'battery', 'crowbar', 'flare', 'glow', 'map', 'stones', 'tape', 'torch']);
    const xs = tr.items.map((i) => i.x);
    assert.ok(Math.min(...xs) > CFG.TRAINING.rack.x - 2.8 && Math.max(...xs) < CFG.TRAINING.rack.x + 2.8, 'all on the bench');
    assert.ok(tr.items.every((i) => Math.abs(i.y - 3) < 0.05), 'on top of it');
    // E at the nearest board: the prompt, then the item
    const raw = { events: [], look: { dx: 0, dy: 0 } };
    assert.equal(tr.update(0.016, raw), true, 'the rack takes the prompt');
    let given = null;
    tr.give = (k) => { given = k; };
    raw.events = ['useDown'];
    tr.update(0.016, raw);
    assert.ok(given, 'pressing E takes something');
  } finally {
    delete globalThis.document;
  }
});
