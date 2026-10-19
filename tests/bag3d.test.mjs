// The round pack (2.1): the turn, the springs, the flaps and the lift-outs — all the state math the
// 3D rucksack animates, without a browser. Plus the inventory bridge: which UI opens on which device.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BagState, BAG3D_POCKETS } from '../src/ui/bag3d.js';
import { Backpack } from '../src/game/inventory.js';

const tick = (s, seconds, dt = 1 / 60) => { for (let i = 0; i < Math.round(seconds / dt); i++) s.tick(dt); };

test('the pack turns with a drag, but only so far — then it stops dead, not spinning', () => {
  const s = new BagState();
  s.drag(-400, 0);
  for (let i = 0; i < 40; i++) s.tick(1 / 60); // a hard flick
  assert.ok(Math.abs(s.yaw) <= 1.15 + 1e-9, `yaw ${s.yaw}`);
  assert.ok(Math.abs(s.pitch) <= 0.42 + 1e-9);
  // piling on more turns never escapes the clamp
  for (let i = 0; i < 200; i++) { s.drag(-900, -900); s.tick(1 / 60); }
  assert.ok(Math.abs(s.yaw) <= 1.15 + 1e-9 && Math.abs(s.pitch) <= 0.42 + 1e-9);
});

test('let go and it swings back to face you', () => {
  const s = new BagState();
  s.drag(-350, 120);
  s.release();
  tick(s, 1.6);
  assert.ok(Math.abs(s.yaw) < 0.02, `yaw ${s.yaw}`);
  assert.ok(Math.abs(s.pitch) < 0.02, `pitch ${s.pitch}`);
});

test('a pouch lifts its flap a little under the pointer, all the way when picked', () => {
  const s = new BagState();
  s.point(2);
  tick(s, 0.5);
  assert.ok(s.pockets[2].flap > 0.4 && s.pockets[2].flap < 0.62, `hover flap ${s.pockets[2].flap}`);
  assert.equal(s.pockets[0].flap, 0, 'the other pouches stay shut');
  assert.equal(s.pick(2), true, 'picking reports the item coming out');
  tick(s, 0.5);
  assert.ok(s.pockets[2].flap > 0.9);
  assert.ok(s.pockets[2].lift > 0.6, 'the item rises out');
  assert.equal(s.pick(2), false, 'picking it again stows it back');
  tick(s, 0.8);
  assert.ok(s.pockets[2].lift < 0.05);
  assert.equal(s.pick(-1), false);
  assert.equal(s.pick(9), false, 'a phantom pocket is not pickable');
});

test('the lifted item travels out of its pouch, up and toward the eyes', () => {
  const s = new BagState();
  s.pick(0);
  tick(s, 2.0);
  const at = s.liftOut(0);
  const P = BAG3D_POCKETS[0];
  assert.ok(at.z > P.z + 0.15, 'toward the camera');
  assert.ok(at.y > P.y, 'rising');
  // and at rest (nothing picked) it sits exactly in its pouch
  const rest = new BagState();
  tick(rest, 0.1);
  const r = rest.liftOut(3);
  assert.equal(r.x, BAG3D_POCKETS[3].x);
  assert.equal(r.y, BAG3D_POCKETS[3].y);
  assert.equal(r.z, BAG3D_POCKETS[3].z);
});

// the flat grid stays the touch fallback; the round pack is the desktop's (inventory.round)
function packBag(touch) {
  const b = Object.create(Backpack.prototype);
  b.g = {
    input: { touch },
    bag3d: touch ? null : { open() { b.opened3d = true; }, close() { b.closed3d = true; } },
  };
  return b;
}
test('the round pack is the desktop view; touch keeps the flat grid', () => {
  const desk = packBag(false);
  assert.equal(desk.round, true);
  const touch = packBag(true);
  assert.equal(touch.round, false, 'no 3D pack on a touch screen');
});
