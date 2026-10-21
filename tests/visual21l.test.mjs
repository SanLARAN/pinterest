import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { IntroCutscene } from '../src/game/intro.js';
import { CAMP_TENT, tentPoint } from '../src/world/campLayout.js';
import { Backpack } from '../src/game/inventory.js';
import { Post } from '../src/render/post.js';

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
