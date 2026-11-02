// 3.1r: «замени мотоциклы на полигоне вот на эти (kugoo_wish01.blend) + сделай крутую эндуро-физику с упором в
// реализм чисто для фана». The model is the owner's, exported from Blender into the game's own mesh format; the
// physics is a pitching, sprung chassis with a motor, two brakes, a friction circle and wheel gyros in the air.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null, style: {} }) };
globalThis.window = globalThis.window || { location: { search: '' } };

const { MOTO, newBike, stepBike, buildKugoo, poseKugoo, riderEye } = await import('../src/game/moto.js');
const { KUGOO_GROUPS, KUGOO_PIVOTS } = await import('../src/game/kugooModel.js');
const { World } = await import('../src/world/world.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

const flat = { height: () => 0 };
const W = (t = flat, hit = null) => ({ terrain: t, col: { resolve: (p) => (hit ? hit(p) : p) } });
const seated = (h, x = 0, z = 0, yaw = 0) => {
  const b = newBike(0, x, z, yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const hf = h.height(x + fx * MOTO.half, z + fz * MOTO.half), hb = h.height(x - fx * MOTO.half, z - fz * MOTO.half);
  b.y = (hf + hb) / 2; b.pitch = Math.atan2(hf - hb, 2 * MOTO.half);
  return b;
};
const ride = (b, w, s, inp) => {
  const out = { threw: null, maxPitch: -9, minPitch: 9, rear: 0, air: 0, maxV: 0, landed: 0 };
  for (let i = 0; i < Math.round(s * 60); i++) {
    const e = stepBike(b, typeof inp === 'function' ? inp(i / 60) : inp, w, 1 / 60);
    out.maxPitch = Math.max(out.maxPitch, b.pitch); out.minPitch = Math.min(out.minPitch, b.pitch);
    if (b.load[0] === 0 && b.load[1] > 0) out.rear += 1 / 60;
    if (!b.grounded) out.air += 1 / 60;
    out.maxV = Math.max(out.maxV, Math.hypot(b.vx, b.vz));
    if (e.landed) out.landed++;
    if (e.threw) { out.threw = e.cause; break; }
  }
  return out;
};

// ---------------- the model ----------------
test('the Kugoo is the owner\'s model, in its moving parts, assembled at its own pivots', () => {
  for (const g of ['body', 'swing', 'steer', 'forkLow', 'wheelF', 'wheelR']) assert.ok(KUGOO_GROUPS[g]?.n > 300, `${g}: ${KUGOO_GROUPS[g]?.n} triangles`);
  const total = Object.values(KUGOO_GROUPS).reduce((a, g) => a + g.n, 0);
  assert.ok(total > 10000 && total < 20000, `${total} triangles: detailed, but a game's`);
  const root = buildKugoo(8, new THREE.MeshBasicMaterial());
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  assert.ok(size.z > 1.35 && size.z < 1.65, `nose to tail ${size.z.toFixed(2)} m (the real one: 1.45)`);
  assert.ok(size.y > 0.85 && size.y < 1.15, `to the bars ${size.y.toFixed(2)} m`);
  assert.ok(box.min.y > -0.02 && box.min.y < 0.03, 'its tyres on the ground');
  // the wheels sit where the model's axles are, both on the ground
  const P = root.userData.kugoo;
  for (const [w, k] of [[P.wheelF, 'wheelF'], [P.wheelR, 'wheelR']]) {
    const v = w.getWorldPosition(new THREE.Vector3());
    assert.ok(v.distanceTo(new THREE.Vector3(...KUGOO_PIVOTS[k])) < 0.002, `${k} at its axle`);
  }
  // the fork compresses along the steering axis; the swingarm swings the rear wheel up; the bar turns
  const b = newBike(0, 0, 0, 0);
  b.comp = [MOTO.sag[0] + 0.08, MOTO.sag[1] + 0.08];
  b.steer = 0.4;
  poseKugoo(root, b);
  root.updateMatrixWorld(true);
  const f = P.wheelF.getWorldPosition(new THREE.Vector3()), r = P.wheelR.getWorldPosition(new THREE.Vector3());
  assert.ok(r.y - KUGOO_PIVOTS.wheelR[1] > 0.07, 'the rear wheel rose with its arm');
  const axle = new THREE.Vector3(1, 0, 0).applyQuaternion(P.wheelF.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(Math.abs(axle.z) > 0.3, `the front wheel turned with the bar (axle ${axle.z.toFixed(2)})`);
  void f;
  assert.match(src('tools/kugoo/export.py'), /DECIMATE/);
});

// ---------------- the physics ----------------
test('on its springs at rest, with the weight split as the geometry says', () => {
  const b = seated(flat);
  ride(b, W(), 1.5, { move: { x: 0, y: 0 } });
  assert.ok(Math.abs(b.y) < 0.02 && Math.abs(b.pitch) < 0.02, 'it sits level');
  const front = b.load[0] / (b.load[0] + b.load[1]);
  assert.ok(front > 0.44 && front < 0.5, `a touch more on the rear (${(front * 100).toFixed(0)}% front)`);
  assert.ok(Math.abs(b.load[0] + b.load[1] - MOTO.mass * MOTO.gravity) < 15, 'the springs hold its weight');
});

test('off the line the front comes up — a hand on the gas keeps it from going over; Shift holds a wheelie', () => {
  const plain = ride(seated(flat), W(), 6, { move: { x: 0, y: 1 } });
  assert.equal(plain.threw, null);
  assert.ok(plain.maxPitch > 0.08 && plain.maxPitch < 0.35, `the front lifts off the line (${plain.maxPitch.toFixed(2)} rad)`);
  const back = ride(seated(flat), W(), 8, { move: { x: 0, y: 1 }, sprint: true });
  assert.equal(back.threw, null, 'held on the gas with your weight back, it does not loop by itself');
  assert.ok(back.rear > 1.5, `riding the back wheel (${back.rear.toFixed(1)} s)`);
  assert.ok(back.maxPitch < 0.6, `short of the balance point (${back.maxPitch.toFixed(2)})`);
  // and the brake brings it down
  const b = seated(flat);
  ride(b, W(), 1.2, { move: { x: 0, y: 1 }, sprint: true });
  ride(b, W(), 0.5, { move: { x: 0, y: -1 }, sprint: true });
  assert.ok(b.pitch < 0.1, `a tap of the brake puts the front down (${b.pitch.toFixed(2)})`);
});

test('the brakes: hard, the nose dives, and it stops inside a stoppie', () => {
  const b = seated(flat);
  b.vz = -15; b.speed = 15;
  let r = { threw: null, minPitch: 0 };
  for (let i = 0; i < 300 && b.speed > 0.05; i++) {
    const e = stepBike(b, { move: { x: 0, y: -1 } }, W(), 1 / 60);
    r.minPitch = Math.min(r.minPitch, b.pitch);
    if (e.threw) { r.threw = e.cause; break; }
  }
  assert.equal(r.threw, null);
  assert.ok(Math.abs(b.speed) <= 0.05, 'stopped (held at a standstill, the brake paddles it back: that is its own test)');
  assert.ok(Math.abs(b.z) > 14 && Math.abs(b.z) < 24, `in ${Math.abs(b.z).toFixed(1)} m from 54 km/h`);
  assert.ok(r.minPitch < -0.04, `the fork dives (${r.minPitch.toFixed(2)})`);
});

test('it turns by leaning at speed, and the grip is a circle: brake hard in a full lean and the front tucks', () => {
  const b = seated(flat);
  b.vz = -10;
  const r = ride(b, W(), 3, { move: { x: 1, y: 0.3 } });
  assert.equal(r.threw, null);
  assert.ok(b.yaw < -1.5, `round it goes (${b.yaw.toFixed(2)} rad in 3 s)`);
  assert.ok(b.roll < -0.5 && b.roll > -Math.atan(MOTO.mu) - 0.02, `leaned in, inside the grip (${b.roll.toFixed(2)})`);
  const c = seated(flat);
  c.vz = -13;
  const s = ride(c, W(), 3, (tt) => ({ move: { x: 1, y: tt < 1 ? 0.2 : -1 } }));
  assert.equal(s.threw, 'lowside', 'grip spent on braking is not there for the turn');
});

test('in the air the wheels are gyros: gas lifts the nose, the brake drops it', () => {
  const cliff = { height: (x, z) => (z > -12 ? 0 : -5) };
  const pitchAfter = (inAir) => {
    const b = seated(cliff);
    let p0 = null;
    for (let i = 0; i < 400; i++) {
      const air = !b.grounded && b.z < -12.5;
      if (air && p0 === null) p0 = b.pitch;
      const e = stepBike(b, { move: { x: 0, y: air ? inAir : 1 } }, W(cliff), 1 / 60);
      if (air && b.vy < -6) return b.pitch - p0;
      if (e.threw) return null;
    }
    return null;
  };
  const gas = pitchAfter(1), brake = pitchAfter(-1);
  assert.ok(gas !== null && brake !== null);
  assert.ok(gas > brake + 0.2, `gas ${gas.toFixed(2)} vs brake ${brake.toFixed(2)} rad`);
});

test('a nose-first landing puts you over the bars; a flat one is just a landing', () => {
  const drop = { height: (x, z) => (z > -10 ? 0 : -3) };
  const nose = seated(drop);
  const n = ride(nose, W(drop), 4, (tt) => ({ move: { x: 0, y: nose.grounded || nose.z > -10 ? 1 : -1 } }));
  const flatL = seated(drop);
  const f = ride(flatL, W(drop), 4, (tt) => ({ move: { x: 0, y: flatL.grounded || flatL.z > -10 ? 1 : 0.6 } }));
  assert.equal(n.threw, 'bars', `the brake in the air buried the front (${n.threw})`);
  assert.equal(f.threw, null, 'a little gas in the air, and it lands on both wheels');
  assert.ok(f.landed >= 1);
});

test('a bottomed-out landing is metal on metal, not a trampoline; a trunk never adds speed', () => {
  const rollers = { height: (x, z) => (z > -40 ? 0 : 0.6 * Math.sin(z * 0.5)) };
  const b = seated(rollers);
  let gap = 0;
  for (let i = 0; i < 900; i++) { stepBike(b, { move: { x: 0, y: 1 } }, W(rollers), 1 / 60); gap = Math.max(gap, b.y - rollers.height(b.x, b.z)); }
  assert.ok(gap < 2.5, `the highest it got over 0.6 m rollers: ${gap.toFixed(2)} m (a stiff stop fired it 5.5 m)`);
  // into a rock at an angle: out of it, slower
  const c = seated(flat);
  c.vx = -3.9; c.vz = 9.5; c.yaw = Math.atan2(3.9, -9.5);
  const v0 = Math.hypot(c.vx, c.vz);
  const rock = (p) => (p.z > 2 ? { hit: true, nx: -0.46, nz: -0.89 } : p);
  let vmax = 0;
  for (let i = 0; i < 30; i++) { stepBike(c, { move: { x: 0, y: 0 } }, W(flat, rock), 1 / 60); vmax = Math.max(vmax, Math.hypot(c.vx, c.vz)); }
  assert.ok(vmax <= v0 + 0.05, `${vmax.toFixed(1)} m/s after the rock, ${v0.toFixed(1)} before`);
});

test('four minutes through the real forest: no NaN, no rocket, no loop out of nowhere', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate();
  const crashes = {};
  let maxV = 0;
  for (let run = 0; run < 8; run++) {
    const b = seated(w.terrain, 20 + run * 15, -30 + run * 9, run * 0.8);
    for (let i = 0; i < 60 * 30; i++) {
      const tt = i / 60;
      const u = Math.sin(tt * 0.7 + run) * 0.8 + (Math.sin(tt * 3.1) > 0.85 ? 0.6 : 0);
      const e = stepBike(b, { move: { x: Math.max(-1, Math.min(1, u)), y: Math.sin(tt * 0.5 + run * 2) > -0.6 ? 1 : -1 }, sprint: Math.sin(tt * 1.3) > 0.8 }, w, 1 / 60);
      assert.ok([b.x, b.y, b.z, b.pitch, b.roll, b.vx, b.vz].every(Number.isFinite), 'finite');
      maxV = Math.max(maxV, Math.hypot(b.vx, b.vz));
      if (e.threw) {
        crashes[e.cause] = (crashes[e.cause] || 0) + 1;
        const s = seated(w.terrain, b.x, b.z, b.yaw);
        Object.assign(b, { y: s.y, pitch: s.pitch, vx: 0, vz: 0, vy: 0, wp: 0, roll: 0, down: 0 });
      }
    }
  }
  assert.ok(maxV < MOTO.max * 1.1, `top ${maxV.toFixed(1)} m/s`);
  assert.ok(!crashes.loop || crashes.loop <= 2, `loops: ${crashes.loop || 0}`);
});

test('your eyes ride it: up in a wheelie, over in a lean, the camera with them', () => {
  const b = seated(flat);
  const e0 = riderEye(b);
  assert.ok(e0 > 1.2 && e0 < 1.5, `on the seat of a pit bike (${e0.toFixed(2)} m)`);
  b.pitch = 0.4;
  assert.ok(riderEye(b) < e0, 'a wheelie tips you back and down a little');
  const game = src('src/game/game.js');
  assert.match(game, /p\.eyeCur = riderEye\(b, input\.sprint \? MOTO\.back : 0\) - \(p\.y \|\| 0\);/);
  assert.match(game, /p\.pitch = damp\(p\.pitch, b\.pitch \* 0\.8 - 0\.07, 14, dt\);/);
});
