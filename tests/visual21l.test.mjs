import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { IntroCutscene } from '../src/game/intro.js';
import { CAMP_TENT, tentPoint } from '../src/world/campLayout.js';
import { Backpack } from '../src/game/inventory.js';
import { Post } from '../src/render/post.js';

// (no map in the stub: the dispatcher hands back the forestry film, the 2.1j one)
function film(seats = 4) {
  const o = new IntroCutscene({ scene: new THREE.Scene(), online: false,
    world: { terrain: { height: () => 0 } }, audio: { fire: () => null }, fire: { stream() {} } });
  o.forceSeats = seats;
  o._build();
  return o;
}
const near = (a, b, eps = 1e-8) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const faceDot = (a, dx, dz) => (Math.sin(a.yawCur) * dx + Math.cos(a.yawCur) * dz) / Math.hypot(dx, dz);

test('every actor (including solo) faces the fire with the rig +Z, not the camera -Z', () => {
  for (const count of [1, 4]) {
    const o = film(count);
    o._actors(1, 0, true);
    for (const a of o.cast) assert.ok(faceDot(a, -a.x, -a.z) > 0.999);
    for (const a of o.cast) {
      o._actors(a.plan.tAct + 0.5, 0, true);
      assert.ok(faceDot(a, -a.x, -a.z) > 0.999, `slot ${a.slot} douses forwards`);
    }
  }
});

test('turn to bed completes before moving; the entire walk is forwards and deterministic', () => {
  const o = film();
  for (const a of o.cast) {
    const p = a.plan;
    o._actors(p.tWalk + p.turn * 0.5, 0, true);
    near(a.x, a.work.x); near(a.z, a.work.z);
    const tt = p.tWalk + p.turn + p.walk2 * 0.4;
    o._actors(tt, 1 / 60, true);
    assert.ok(faceDot(a, a.seat.bed.x - a.work.x, a.seat.bed.z - a.work.z) > .999);
    const x = a.x, z = a.z, phase = a.phase;
    o._actors(p.tBed + p.lie, 0, true); // seek backwards after an unrelated pose
    o._actors(tt, .1, true);
    near(a.x, x); near(a.z, z); near(a.phase, phase);
  }
});

test('tent route kneels outside, then goes through the centre of its rotated open +Z end', () => {
  const o = film(), a = o.cast.find(a => a.seat.sleep === 'tent'), p = a.plan;
  const local = () => {
    const dx = a.x - CAMP_TENT.x, dz = a.z - CAMP_TENT.z;
    return { x: dx * Math.cos(CAMP_TENT.yaw) - dz * Math.sin(CAMP_TENT.yaw),
      z: dx * Math.sin(CAMP_TENT.yaw) + dz * Math.cos(CAMP_TENT.yaw) };
  };
  for (const k of [.01, .15, .31]) {
    o._actors(p.tBed + p.lie * k, 0, true);
    near(local().z, 2.45);
  }
  for (const k of [.4, .6, .8, 1]) {
    o._actors(p.tBed + p.lie * k, 0, true);
    near(local().x, 0);
    assert.ok(local().z > 0 && local().z < 2.45);
    assert.ok(faceDot(a, a.seat.inside.x - a.seat.bed.x, a.seat.inside.z - a.seat.bed.z) > .999);
    near(a.rig.nodes.hips.position.y, .3);
    assert.equal(a.show, 1, 'cloth, not an arbitrary fade, hides the body');
  }
  near(a.x, tentPoint(0, .05).x);
  assert.ok(o.tFade >= p.tBed + p.lie, 'the film does not cut off the crawl');
});

test('lying pitch is local to the actor heading (YXZ), not a world-axis roll', () => {
  const o = film(1), a = o.cast[0];
  o._actors(a.plan.tBed + a.plan.lie, 0, true);
  assert.equal(a.rig.root.rotation.order, 'YXZ');
  a.rig.root.updateMatrixWorld(true);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(a.rig.root.quaternion);
  near(up.y, 0);
  assert.ok(up.x * -Math.sin(a.yaw) + up.z * -Math.cos(a.yaw) > .999);
});

// ---------------- the bog's arrival (3.0l) ----------------
globalThis.document ||= { body: { classList: { add() {}, remove() {} } } };

// (3.0l) the opening is an arrival now: a УАЗ up the track, four people out of it, the проезд under water, and
// the pump started. The film is driven by real time here, the way Game.updateOpening drives it.
function bogFilm(seats = 4) {
  const calls = [];
  const audio = new Proxy({}, {
    get: (_, k) => (...args) => {
      calls.push([k, ...args]);
      if (k === 'pumpRun') return { level() {}, glug() {}, stop() {} };
      if (k === 'uazStart') return { rev() {}, stop() {} };
      if (k === 'fire') return { level() {}, stop() {}, crackle() {} };
      return null;
    },
  });
  const scene = new THREE.Scene();
  const g = {
    scene, map: 'bog', online: false, state: 'intro', fx: { fade: 0 }, input: { requestLock() {} },
    world: { terrain: { height: () => 0 } },
    audio,
    fire: { reset() {}, douse() {}, out() {}, update() {} },
    hud: { setIntro() {}, setHint() {}, setUse() {}, setSkip() {} },
  };
  const o = new IntroCutscene(g);
  o.forceSeats = seats;
  o.begin();
  o._build();
  return { o, calls, scene, g };
}

const runFilm = (o, seconds, cam) => {
  const dt = 1 / 60;
  for (let i = 0; i < Math.ceil(seconds / dt) && o.state === 'run'; i++) {
    o.update(dt, []);
    if (cam) o.applyCamera(cam);
  }
  return o;
};

test('the film opens with the car on the road and ends with it standing at the water', () => {
  const { o } = bogFilm(4);
  const set = o.set;
  const start = Math.hypot(o.carNode.position.x - set.car.x, o.carNode.position.z - set.car.z);
  assert.ok(start > 15, 'it comes in from the road, not from the camp');
  runFilm(o, 4.6);
  near(o.carNode.position.x, set.car.x, 0.01);
  near(o.carNode.position.z, set.car.z, 0.01);
  assert.equal(o.carNode.rotation.y, o.carYaw, 'it stops nose to the water, not slewed round');
});

test('four doors open, four people get out, and only the crank seat starts the pump', () => {
  const { o, calls } = bogFilm(4);
  runFilm(o, o.dur + 0.5);
  const doors = calls.filter((c) => c[0] === 'carDoor');
  assert.equal(doors.length, 4, 'one door per seat');
  assert.equal(calls.filter((c) => c[0] === 'pumpStart').length, 1, 'the pump is started once');
  assert.ok(calls.some((c) => c[0] === 'pumpRun'), 'and then it runs for the rest of the film');
  assert.ok(!calls.some((c) => c[0] === 'genStart' || c[0] === 'genHum'), 'nothing here sounds like a generator');
  assert.equal(o.state, 'done');
  assert.equal(o.cast.length, 0, 'the film is torn down');
});

test('each of the four has their own job, at their own place, after the cut', () => {
  const { o } = bogFilm(4);
  assert.deepEqual(o.cast.map((a) => a.seat.act).sort(), ['crank', 'hose', 'prime', 'sign']);
  for (const a of o.cast) {
    const p = a.plan;
    o._actors(p.tAct + p.dur * 0.5, 1 / 60, true);
    near(a.x, a.work.x);
    near(a.z, a.work.z);
    assert.ok(a.u > 0.3 && a.u < 0.7, `${a.seat.act} is mid-action`);
  }
  // the four of them are within a few metres of the pump, and not on top of each other
  for (let i = 0; i < o.cast.length; i++) {
    for (let j = i + 1; j < o.cast.length; j++) {
      const A = o.cast[i].work, B = o.cast[j].work;
      const d = Math.hypot(A.x - B.x, A.z - B.z);
      assert.ok(d > 0.5 && d < 7.0, `seats ${i} and ${j} are ${d.toFixed(2)} m apart`);
      const fromPump = Math.hypot(o.cast[i].work.x - o.set.pump.x, o.cast[i].work.z - o.set.pump.z);
      assert.ok(fromPump < 6.5, 'nobody is working on the far side of the water');
    }
  }
});

test('the crossing is watched, then cut: one hard cut, and it lands on the pump', () => {
  const { o } = bogFilm(4);
  const set = o.set;
  o._actors(o.tJump - 0.05, 0, true);
  const before = o.cast.map((a) => ({ x: a.x, z: a.z }));
  for (const a of o.cast) {
    const d = Math.hypot(a.x - a.work.x, a.z - a.work.z);
    assert.ok(d > 1.5, 'they are still in the water at the cut');
  }
  o._actors(o.tJump + 0.001, 0, true);
  for (const [i, a] of o.cast.entries()) {
    near(a.x, a.work.x);
    near(a.z, a.work.z);
    assert.ok(Math.hypot(before[i].x - a.x, before[i].z - a.z) > 1.5, 'the cut moved them');
  }
  // the camera snaps at the same moment, and only there
  const cam = new THREE.PerspectiveCamera(50, 1.6, 0.05, 500);
  o.t = o.tJump - 0.02; o.active = true; o.applyCamera(cam);
  const p1 = cam.position.clone();
  o.t = o.tJump + 0.02; o.applyCamera(cam);
  assert.ok(cam.position.distanceTo(p1) > 1.0, 'a cut, not a pan');
  assert.equal(o._camKeys().filter((k) => k.cut).length, 1, 'exactly one cut in the film');
  assert.ok(set.pump.x < set.car.x, 'the pump is on the camp side of the water');
});

test('alone it is one person and one job, and the film is shorter without an audience', () => {
  const { o } = bogFilm(1);
  assert.equal(o.cast.length, 1);
  assert.equal(o.cast[0].seat.act, 'crank', 'alone you start the pump yourself');
  const four = bogFilm(4).o;
  assert.ok(o.dur < four.dur, 'one door, one walk, one job');
});

test('the sky only goes once the pump has taken water, and the picture is black at the end', () => {
  const { o, g } = bogFilm(4);
  runFilm(o, o.tDusk * 0.5);
  assert.ok(g.fx.fade > 0.9, 'still light while they work');
  const duskAt = o.cast.find((a) => a.seat.act === 'crank').plan.tAct + 0.4;
  assert.ok(o.tDusk >= duskAt, 'the dusk waits for the lever');
  runFilm(o, 1.0);
  assert.equal(g.fx.fade, 1);
  near(o.applyCamera(new THREE.PerspectiveCamera(50, 1.6, 0.05, 500)) ? 1 : 0, 1);
});

test('a skip ends it at once, and nothing in it ever plays a generator', () => {
  const { o, calls } = bogFilm(4);
  o.update(1 / 60, ['confirm']);
  runFilm(o, 2);
  assert.equal(o.state, 'done');
  assert.equal(o.cast.length, 0);
  assert.deepEqual(calls.filter((c) => /gen/.test(c[0])), []);
});

function classSet() {
  const s = new Set();
  return { add: v => s.add(v), contains: v => s.has(v) };
}
function bag() {
  const b = Object.create(Backpack.prototype);
  b.g = {}; b.portraitEl = { classList: classSet() }; b.figEl = { classList: classSet() };
  return b;
}

test('portrait retries an unavailable renderer, caches only success, and updates on rotation', () => {
  const b = bag(); let calls = 0, ready = false;
  b.g.drawPortrait = (_fit, _cv, view) => { calls++; assert.equal(view.transparent, true); return ready; };
  b.portrait(); b.portrait();
  assert.equal(calls, 2); assert.ok(!b.portraitKey);
  ready = true; b.portrait(); b.portrait();
  assert.equal(calls, 3); assert.equal(b.portraitEl.classList.contains('on'), true);
  b.portraitYaw = 1.2; b.portrait();
  assert.equal(calls, 4);
});

test('portrait is refreshed even when the inventory item cache has not changed', () => {
  const b = bag(); let calls = 0;
  b.portrait = () => calls++;
  // Stop after the portrait but before the rest of the DOM-heavy render; order is the regression.
  Object.defineProperty(b.g, 'input', { get() { throw new Error('past portrait'); } });
  b.renderKey = 'unchanged';
  // A minimal game snapshot for constructing renderKey.
  Object.assign(b, { slots: [], count: () => 0, pending: new Map() });
  Object.assign(b.g, { torch: { charge: 1 }, tools: {}, glows: {}, player: {} });
  assert.throws(() => b.render(), /past portrait/);
  assert.equal(calls, 1);
  b.render(); // now renderKey matches; portrait still runs
  assert.equal(calls, 2);
});

test('HDR target stays single-sampled through high/low changes, resize and context fallback', () => {
  const p = new Post({});
  for (const aa of [true, false, true]) {
    p.setAntialias(aa); p.setSamples(4); p.setSize(1920, 1080, .85); p.dropSamples();
    assert.equal(p.rtScene.samples, 0);
    assert.equal(p.u.uAA.value, aa);
  }
  assert.ok(p.comp.fragmentShader.includes('ApplyFXAA(tScene, 1.0 / uRes, uv)'));
});
