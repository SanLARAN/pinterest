// 2.1r regressions: coordinates on the watch, and rescue that works in daylight — the bleed clock
// now runs in remaining seconds (it survives the night-time reset), dawn neither raises nor
// finishes the fallen while a friend stands, and the morning E-prompt sees the mate and the cot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fmtPos } from '../src/game/fieldView.js';
import { Rescue } from '../src/game/rescue.js';
import { Objectives } from '../src/game/objectives.js';
import { t } from '../src/core/i18n.js';

test('the watch says where you stand, the way the guard’s map writes it', () => {
  assert.equal(fmtPos(-60.4, 127.6), '-60, 128');
  assert.equal(fmtPos(0, 0), '0, 0');
  assert.equal(fmtPos(205.49, -230.5), '205, -230');
  assert.ok(t('watchPos').length > 0, 'and it has a label in the dictionary');
});

function rescueDouble() {
  const evs = [];
  const me = { id: 'me', alive: true, x: 0, z: 0, y: 0, yaw: 0, carrying: null, carriedBy: null, forward: () => ({ x: 0, z: -1 }) };
  const mate = { id: 'b', alive: true, x: 3, z: 0, y: 0, yaw: 0, carrying: null, carriedBy: null, downs: 0, gone: false, onCot: false, consumed: false };
  const remotes = new Map([['b', mate]]);
  const g = {
    online: true, auth: true, time: 400, state: 'morning', player: me, remotes,
    mult: 1, score: 0, stats: {},
    sync: { ev: (...a) => evs.push(a) },
    hud: { popup() {}, pulse() {}, beacon() {} },
    audio: { reviveGasp() {} },
    radar: { blip() {} },
    escape: null, glows: null, medhut: null, spectate: null,
    world: { terrain: { height: () => 0 } },
    nameOf: (id) => id,
    playerById: (id) => (id === 'me' ? me : remotes.get(id) || null),
    livePlayers: () => [me, mate].filter((p) => p.alive),
  };
  const r = Object.create(Rescue.prototype);
  r.g = g; r.cotId = null; r.waitRv = 0; r.askT = 0; r.jab = null; r.reviveT = 0; r.beaconT = 0;
  return { g, r, me, mate, evs };
}

test('the bleed clock runs in remaining seconds — the dawn time-reset neither stops nor stretches it', () => {
  const { g, r, mate, evs } = rescueDouble();
  mate.alive = false;
  r.down(mate, 120);
  assert.equal(mate.bleedLeft, 120);
  assert.equal(r.timeLeft(mate), 120);
  g.time = 0; // startMorning put the night clock back to zero under him
  r.update(30);
  assert.equal(r.timeLeft(mate), 90, 'thirty seconds of morning cost thirty seconds');
  assert.equal(mate.gone, false);
  r.update(120);
  assert.equal(mate.gone, true, 'and when they run out in daylight, he is gone — the host says so');
  assert.deepEqual(evs.filter((e) => e[0] === 'bo').map((e) => e[1]), ['b']);

  // a revive stops the clock for good: no zombie expiry hours later
  const d2 = rescueDouble();
  d2.mate.alive = false;
  d2.mate.revive = function (x, z) { this.alive = true; this.x = x; this.z = z; };
  d2.r.down(d2.mate, 60);
  d2.r.revive(d2.mate, 1, 2, 0, 'me');
  assert.equal(d2.mate.alive, true);
  assert.equal(d2.mate.bleedLeft, null);
  d2.r.update(600);
  assert.equal(d2.mate.gone, false);
});

test('in the morning the E-prompt sees a friend on the ground, same as at night', () => {
  const scenario = (morning) => {
    const obj = Object.create(Objectives.prototype);
    const g = {
      player: { x: 0, z: 0, yaw: 0, alive: true, carrying: null, speed: 0, forward: () => ({ x: 0, z: -1 }) },
      input: { touch: false, useHeld: false },
      events: [],
      hud: { setUse() {} },
      inventory: { active: false, consider() {} },
      expedition: null, cabinets: { pry: null, consider() {} }, doors: null, glows: null, torch: null,
      tools: null, partMap: null, training: false, motos: null,
      rescue: { consider(fn) { fn({ id: 'b' }, 0, -0.5, 2, 'mate'); }, idle() {}, interact() {} },
      escape: { mySeat: -1, held: null, consider() {}, idle() {}, canLoad: () => false },
    };
    obj.g = g; obj.bodies = []; obj.gens = []; obj.note = null; obj.target = null; obj.searchT = 0;
    obj._interact(0.016, morning);
    return obj.target ? obj.target.kind : null;
  };
  assert.equal(scenario(true), 'mate', 'morning: hands still find the fallen');
  assert.equal(scenario(false), 'mate', 'night: as it always was');
});
