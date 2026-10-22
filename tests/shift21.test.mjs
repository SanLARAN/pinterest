// Regressions for the 2.1 shift: four days instead of the 45-minute limit, dawns that carry the day,
// the nightly flare gun, and the net messages that keep a room together. (Dawn raised the fallen until 2.1q.)
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CFG, dangerMultiplier, monsterTargets } from '../src/core/config.js';
import { Game } from '../src/game/game.js';
import { Rescue } from '../src/game/rescue.js';
import { NetSync } from '../src/game/netsync.js';
import { Objectives } from '../src/game/objectives.js';
import { PROTOCOL } from '../src/net/net.js';
import { shared } from '../src/render/sonar.js';

const S = CFG.SHIFT;

// the thinnest Game that still runs the day cycle: the clock parts, none of the forest
function bare(shift = {}) {
  const g = Object.create(Game.prototype);
  g.day = 1;
  g.daysTotal = 4;
  g.time = 0;
  g.morningT = 0;
  g.dawnT = 0;
  g.duskT = 0;
  g.score = 0;
  g.mult = 1;
  g.state = 'play';
  g.role = 'solo'; // auth and offline, straight from the getters
  g.player = { id: 'a', alive: true, x: 0, y: 0, z: 0, yaw: 1, stones: 0, flares: 0, hasFlare: false };
  g.remotes = new Map();
  g.playerById = (id) => (id === 'a' ? g.player : g.remotes.get(id));
  g.livePlayers = () => [g.player, ...[...g.remotes.values()].filter((r) => r.alive)];
  g.monsters = [];
  g.timeline = [];
  g.hud = { intro: { classList: { remove() {} } }, setIntro() {}, setHint() {}, setUse() {}, setSkip() {}, flashAlert() {}, popup() {}, showNote: null };
  g.audio = { ready: false, dawn() {}, dusk() {}, setAmbience() {}, setMorning() {}, morningTick() {}, reviveGasp() {} };
  g.input = { touch: false, uiMode: false, reset() {}, keys: new Set() };
  g.inventory = { active: false };
  g.player.update = () => ({ step: null, bump: null });
  g._commonFx = () => {};
  g.fx = { danger: 0 };
  g.objectives = { closeNote() {}, setMorning() {}, startNight() {}, update() {}, campFail() {} };
  g.doors = { update() {} };
  g.cabinets = { update() {} };
  g.angler = { myCap: () => null, heldLocal: () => false, update() {}, reset() {}, netState: () => 0 }; // 2.1o: nobody is in his hands here
  g.medhut = { update() {}, cot: { x: 0, y: 0, z: 0 } };
  g.torch = { update() {} };
  g.glows = { update() {} };
  g.pulses = { update() {}, clear() {} };
  g.sync = { ev() {}, process() {}, tick() {} };
  g.spectate = null;
  g._ears = { x: 0, y: 0, z: 0 };
  g.updateRemotes = () => {};
  g.coop = { toHost() {}, hostId: 'h' };
  g.world = { terrain: { height: () => 0 } };
  g.rescue = { dawnPeace() { return false; }, update() {} };
  g.escape = { held: null, mySeat: -1, update() {} }; // (2.1q: the yard lives through the morning too)
  g.stats = { revives: 0, syringes: 0 };
  g.onEnd = null;
  g.dread = { reset() {} };
  Object.assign(g, shift);
  return g;
}

test('the shift is four days: 8-minute nights, 1:45 mornings, no 45-minute limit', () => {
  assert.equal(S.DAYS, 4);
  assert.equal(S.NIGHT, 480);
  assert.equal(S.MORNING, 105);
  assert.equal('RUN_SECONDS' in CFG, false);
  assert.equal(PROTOCOL, 18); // 2.1v: the Stray's state stream and the voice she takes (was 17 in 2.1s)
});

test('danger steps every four minutes of a night and again with each dawn survived', () => {
  assert.equal(dangerMultiplier(0, 1), 1);
  assert.equal(dangerMultiplier(239, 1), 1);
  assert.equal(dangerMultiplier(240, 1), 1.5);
  assert.equal(dangerMultiplier(479, 1), 1.5);
  assert.equal(dangerMultiplier(0, 2), 1.5); // the second night starts where the first peaked
  assert.equal(dangerMultiplier(0, 4), 2.5);
  assert.equal(dangerMultiplier(240, 4), 3.0); // the endgame night
});

test('the forest sends more of them each night of the shift, listeners still capped at three', () => {
  assert.deepEqual(monsterTargets(0, 1), { listeners: 2, crawlers: 0 });
  assert.deepEqual(monsterTargets(240, 1), { listeners: 3, crawlers: 1 });
  assert.deepEqual(monsterTargets(0, 2), { listeners: 3, crawlers: 0 });
  assert.deepEqual(monsterTargets(300, 3), { listeners: 3, crawlers: 2 });
  assert.deepEqual(monsterTargets(180, 4), { listeners: 3, crawlers: 3 });
  for (let t = 0; t <= S.NIGHT; t += 60) for (let d = 1; d <= 4; d++) assert.ok(monsterTargets(t, d).listeners <= CFG.MAX_LISTENERS);
});

test('a night ends in a dawn; dawns one to three roll into the next morning, the fourth wins', () => {
  const g = bare();
  g.time = S.NIGHT - 0.01;
  // the host's own dawn, exactly at the bell
  g.startDawn();
  assert.equal(g.state, 'dawn');
  assert.equal(g.day, 1); // the day advances only when the next morning begins
  // the day comes up over eleven seconds, not in a flash (2.1k): half way in, the sky is still dim
  g.dawnT = 3;
  Game.prototype.updateDawn.call(g, 0.02);
  assert.ok(shared.uDawn.value < 0.5, 'the dawn is a ramp, not a switch');
  g.dawnT = 11.01;
  Game.prototype.updateDawn.call(g, 0.02);
  assert.equal(g.state, 'morning');
  assert.equal(g.day, 2);
  // the morning ends at 1:45, not at the old 32 seconds
  g.morningT = 104.9;
  Game.prototype.updateMorning.call(g, 0.05, { events: [] });
  assert.equal(g.state, 'morning', '1:44 of daylight is still daylight');
  g.morningT = 104.99;
  Game.prototype.updateMorning.call(g, 0.2, { events: [] });
  assert.equal(g.state, 'dusk', '1:45 and the light starts dying');
  // the last dawn is the shift's win
  g.day = 4;
  g.state = 'play';
  g.startDawn();
  let ended = null;
  g.onEnd = (r) => (ended = r);
  g.dawnT = 11.01;
  Game.prototype.updateDawn.call(g, 0.02);
  assert.equal(g.state, 'won');
  assert.deepEqual(ended, { won: true, coop: false, alive: true });
});

test('each survived dawn pays the night bonus; only the last one pays the win', () => {
  const g = bare();
  g.score = 1000;
  g.startDawn();
  assert.equal(g.score, 1000 + CFG.SCORE.night); // ×mult 1
  g.state = 'play';
  g.day = 4;
  g.startDawn();
  assert.equal(g.score, 1000 + CFG.SCORE.night + CFG.SCORE.win);
  // downed at the final dawn, you take the reduced share
  g.state = 'play';
  g.day = 4;
  g.player.alive = false;
  g.score = 0;
  g.startDawn();
  assert.equal(g.score, Math.round(CFG.SCORE.win * 0.3));
});

test('shiftLeft pays out the seconds the team did not need, by the day', () => {
  const g = bare();
  const dayLen = S.NIGHT + S.MORNING + CFG.DUSK_SECONDS;
  g.state = 'play';
  g.day = 1;
  g.time = 0;
  assert.equal(g.shiftLeft(), 3 * dayLen + S.NIGHT);
  g.time = S.NIGHT;
  assert.equal(g.shiftLeft(), 3 * dayLen);
  g.day = 4;
  g.time = S.NIGHT - 60;
  assert.equal(g.shiftLeft(), 60);
  g.state = 'morning';
  g.day = 2;
  g.morningT = 0;
  assert.equal(g.shiftLeft(), 2 * dayLen + S.NIGHT + S.MORNING);
});

test("the host's dawn carries the day over the wire; a guest far behind catches up", () => {
  const g = bare();
  g.role = 'client'; // online, and not the host's machine
  g.coop = { toHost() {}, hostId: 'h', isHost: false }; // NetSync.host reads it
  g.remotes.set('h', { id: 'h', alive: true });
  g.day = 1;
  const ns = Object.create(NetSync.prototype);
  ns.g = g;
  ns.coop = g.coop; // the sync's host getter reads it
  ns.event(['dn', 2], 'h', true);
  assert.equal(g.state, 'dawn');
  assert.equal(g.day, 2, 'a guest that missed a day catches up with the host word');
  // the host itself does not process its own broadcast twice
  g.state = 'play';
  g.day = 2;
  g.coop = { toHost() {}, hostId: 'h', isHost: true }; // now the host's own machine
  ns.coop = g.coop;
  ns.event(['dn', 3], 'h', true);
  assert.equal(g.state, 'play', 'the host does not process its own broadcast');
});

test('dawn raises nobody and finishes nobody while a friend still stands (2.1q/2.1r): the fallen keep their minutes into the morning', () => {
  const g = bare();
  g.role = 'host'; // online and the authority: the 'bo' word is the host's to say
  const evs = [];
  g.sync = { ev: (...a) => evs.push(a), process() {}, tick() {} };
  g.livePlayers = () => [g.player, ...g.remotes.values()].filter((p) => p.alive); // bare()'s own copy always lists the local player
  const me = { ...g.player, alive: false, gone: false, downs: 2, bleedLeft: 90, carriedBy: null, carrying: null, onCot: false, consumed: false };
  const carrier = { id: 'd', alive: true, gone: false, carrying: 'b', carriedBy: null, consumed: false, bleedLeft: 30 };
  const mate = { id: 'b', alive: false, gone: false, downs: 1, bleedLeft: 40, carriedBy: 'd', carrying: null, onCot: true, consumed: false, x: 3, z: 4, yaw: 0 };
  const eaten = { id: 'c', alive: false, gone: true, downs: 1, carriedBy: null, carrying: null, onCot: false, consumed: true };
  g.player = me;
  g.remotes.set('d', carrier);
  g.remotes.set('b', mate);
  g.remotes.set('c', eaten);
  const r = Object.create(Rescue.prototype);
  r.g = g;
  r.cotId = null;
  r.waitRv = 0;
  assert.equal(r.dawnPeace(), false, 'someone stands: dawn itself does nothing at all');
  assert.equal(me.alive, false, 'not raised');
  assert.equal(me.gone, false, 'and not finished either — there is still time to be carried');
  assert.equal(mate.gone, false);
  assert.equal(carrier.carrying, 'b', 'still on his shoulder at first light');
  assert.deepEqual(evs, [], 'no bo said');
  // nobody left standing: now the morning takes everyone, and says so
  carrier.alive = false;
  assert.equal(r.dawnPeace(), true, 'nobody to come for anyone');
  assert.equal(me.gone, true);
  assert.equal(mate.gone, true);
  assert.equal(carrier.gone, true);
  assert.equal(eaten.gone, true, 'the шкафандр still keeps what it took');
  assert.deepEqual(evs.filter((e) => e[0] === 'bo').map((e) => e[1]).sort(), ['a', 'b', 'd']);
});

test('a repaired camp generator holds its light through every dusk of the shift', () => {
  const obj = Object.create(Objectives.prototype);
  const hum = { sputtered: false, stopped: false, sputter() { this.sputtered = true; }, stop() { this.stopped = true; } };
  const gens = [{ running: false, lamp: 1, flick: 0, dying: false, hum }];
  obj.gens = gens;
  obj.campFail();
  assert.equal(gens[0].dying, true);
  assert.ok(hum.sputtered);
  assert.equal(gens[0].hum, null, 'the dying hum is handed off to its own stop timer');
  // repaired: the dusk passes without touching it
  const held = [{ running: true, lamp: 1, flick: 0, dying: false, hum: { sputter() { assert.fail('a running engine does not sputter'); }, stop() { assert.fail('and does not stop'); } } }];
  obj.bodies = [{ mesh: {}, item: {}, gun: { visible: false } }];
  obj.gens = held;
  obj.campFail();
  assert.equal(held[0].lamp, 1);
  assert.equal(held[0].dying, false);
  obj.startNight(2, 1234);
  assert.equal(held[0].lamp, 1);
});

test('the flare gun returns each night to a body chosen from the seed and the day, alike on every machine', () => {
  const obj = Object.create(Objectives.prototype);
  const mk = (gun) => ({ mesh: {}, item: {}, gun: { visible: !!gun } });
  obj.bodies = [mk(false), mk(true), mk(false), mk(false), mk(false)]; // reset(): the gun lies by body 1
  obj.flareBody = 1;
  obj.gens = [{ running: false, lamp: 0 }];
  // night 2, the gun still lying there: nothing moves
  obj.startNight(2, 20261019);
  assert.equal(obj.flareBody, 1);
  assert.equal(obj.bodies[1].gun.visible, true);
  // taken: the next night a fresh gun lies by a body picked from seed and day — never the camp's
  obj.bodies[1].gun.visible = false;
  obj.startNight(2, 20261019);
  assert.ok(obj.flareBody >= 1 && obj.flareBody <= 4, 'never the camp body');
  assert.equal(obj.bodies[obj.flareBody].gun.visible, true);
  const pick = obj.flareBody;
  // deterministic: every machine lays it by the same corpse
  const other = Object.create(Objectives.prototype);
  other.bodies = [mk(false), mk(true), mk(false), mk(false), mk(false)];
  other.bodies[1].gun.visible = false;
  other.flareBody = 1;
  other.gens = [{ running: false, lamp: 0 }];
  other.startNight(2, 20261019);
  assert.equal(other.flareBody, pick);
  // and the next night moves it again
  other.bodies[pick].gun.visible = false;
  other.startNight(3, 20261019);
  assert.ok(other.flareBody >= 1 && other.flareBody <= 4);
});

test('finding the flare gun again the next night is one cartridge, not another full load', () => {
  const g = bare();
  g.objectives = { bodies: [{}, { gun: { visible: false } }], flareBody: 1 };
  g.inventory = { claim() { assert.fail('granted directly'); }, reconcile() {} };
  g.hud = { ...g.hud, popup() {}, flashFlares() {} };
  g.audio = { flareFound() {} };
  g.hinted = {};
  g.stats = {};
  g.setFlares = (n, has) => { g.player.flares = n; g.player.hasFlare = has; }; // the real one paints the DOM
  g.player.hasFlare = true;
  g.player.flares = 1;
  Game.prototype.onFlareFound.call(g, true);
  assert.equal(g.player.flares, 2, 'one cartridge for the gun you still hold');
  g.player.hasFlare = false;
  g.player.flares = 0;
  Game.prototype.onFlareFound.call(g, true);
  assert.equal(g.player.flares, CFG.FLARE.charges, 'the first gun carries its full load');
});

// ---- the adrenaline syringe ----
import { Cabinets } from '../src/game/cabinets.js';
import { Player } from '../src/game/player.js';
import { cleanParcel, fitsPocket, BAG_LIMIT } from '../src/game/backpackData.js';

test('the syringe is a real pocket item: fits a pocket, parcels of one or two, never three', () => {
  assert.equal(fitsPocket(['stones','glow',null,null], 'syringe'), true);
  assert.equal(BAG_LIMIT.syringe, 2);
  assert.deepEqual(cleanParcel({ kind: 'syringe', n: 1 }), { kind: 'syringe', n: 1 });
  assert.deepEqual(cleanParcel({ kind: 'syringe', n: 2 }), { kind: 'syringe', n: 2 });
  for (const d of [{ kind: 'syringe', n: 0 }, { kind: 'syringe', n: 3 }, { kind: 'syringe', n: 1.5 }]) assert.equal(cleanParcel(d), null);
});

test("a guest's jab goes to the host, the host's word raises the fallen where they lie", () => {
  const jabber = bare();
  jabber.role = 'client'; // online, guest
  const mate = { id: 'b', alive: false, gone: false, consumed: false, carriedBy: null, onCot: false, x: 1.4, z: 0.2, yaw: 2, revive() { this.alive = true; }, adrenaline: 0 };
  jabber.remotes.set('b', mate);
  jabber.inventory = { syringes: 1, reconcile() {} };
  jabber.player.x = 0; jabber.player.z = 0;
  jabber.player.forward = () => ({ x: 1, z: 0 });
  jabber.coop = { toHost(type, d) { sent.push([type, d]); } };
  const r = Object.create(Rescue.prototype);
  r.g = jabber;
  r.downed = () => [mate];
  let sent = [];
  assert.equal(r.jabTarget(), mate, 'the fallen friend in front of you');
  r.startJab();
  assert.ok(r.jab, 'the channel opens');
  for (let i = 0; i < 120; i++) r._jabTick(1 / 60);
  assert.equal(jabber.inventory.syringes, 0, 'the dose is spent');
  assert.deepEqual(sent, [['ad', 'b']], 'the guest asks the host');
  // the host's side: valid → broadcast + local apply, with the debuff
  const host = bare();
  host.role = 'host';
  const hostMate = { ...mate, revive() { this.alive = true; } };
  hostMate.alive = false;
  const by = { id: 'a', alive: true, x: 0, z: 0 };
  host.player = by;
  host.remotes.set('b', hostMate);
  host.reviveLocal = () => {};
  host.nameOf = () => 'Mate';
  const evs = [];
  host.sync = { ev: (...a) => evs.push(a) };
  host.hud = { ...host.hud, popup() {} };
  const rh = Object.create(Rescue.prototype);
  rh.g = host;
  rh.hostAdrenaline('b', 'a');
  assert.equal(hostMate.alive, true, 'up on their feet');
  assert.equal(hostMate.adrenaline, CFG.SYRINGE.debuff, 'rubber legs for five minutes');
  assert.deepEqual(evs, [['arv', 'b', 1.4, 0.2, 2, 'a']]);
});

test('the host refuses a jab at the wrong body: up, gone, eaten, carried, on the cot, or too far away', () => {
  const host = bare();
  host.role = 'host';
  const evs = [];
  host.sync = { ev: (...a) => evs.push(a) };
  host.player = { id: 'a', alive: true, x: 0, z: 0 };
  host.reviveLocal = () => {};
  host.nameOf = () => 'Mate';
  host.hud = { ...host.hud, popup() {} };
  const rh = Object.create(Rescue.prototype);
  rh.g = host;
  for (const change of [(m) => (m.alive = true), (m) => (m.gone = true), (m) => (m.consumed = true), (m) => (m.carriedBy = 'a'), (m) => (m.onCot = true), (m) => (m.x = 30), () => (host.player.alive = false)]) {
    const m = { id: 'b', alive: false, gone: false, consumed: false, carriedBy: null, onCot: false, x: 1, z: 0, yaw: 0, revive() { this.alive = true; } };
    host.remotes.set('b', m);
    host.player.alive = true;
    change(m);
    const was = m.alive;
    rh.hostAdrenaline('b', 'a');
    assert.equal(m.alive, was, 'the host changed nothing');
  }
  assert.equal(evs.length, 0, 'and nothing went out on the wire');
});

test('a syringe revive pays the smaller score and counts separately from a cot revive', () => {
  const g = bare();
  g.player = { id: 'a', alive: true };
  g.reviveLocal = () => {};
  g.nameOf = () => 'Mate';
  const mate = { id: 'b', alive: false, x: 1, z: 1, revive() { this.alive = true; }, adrenaline: 0 };
  const r = Object.create(Rescue.prototype);
  r.g = g;
  r.revive(mate, 1, 1, 0, 'a', 'syringe');
  assert.equal(mate.adrenaline, CFG.SYRINGE.debuff);
  assert.equal(g.score, Math.round(CFG.SCORE.adrenaline * g.mult));
  assert.equal(g.stats.syringes, 1);
  assert.equal(g.stats.revives, 0);
  // the cot still heals without after-effects
  const mate2 = { id: 'c', alive: false, x: 1, z: 1, revive() { this.alive = true; }, adrenaline: 0 };
  g.stats.syringes = 0;
  r.revive(mate2, 1, 1, 0, 'a', 'cot');
  assert.equal(mate2.adrenaline, 0);
  assert.equal(g.stats.revives, 1);
  assert.equal(g.stats.syringes, 0);
});

test('rubber legs: the revived walk slower, run slower still, burn breath faster — and it wears off', () => {
  const world = { terrain: { height: () => 0 }, col: { resolve: (p) => p }, spawn: { x: 0, z: 0 } };
  const p = Object.create(Player.prototype);
  Object.assign(p, { x: 0, z: 0, y: 0, vx: 0, vz: 0, speed: 0, yaw: 0, pitch: 0, stamina: CFG.PLAYER.stamina, staminaDelay: 0, exhausted: false, stepAcc: 0, bobPhase: 0, bobY: 0, crouching: false, sprinting: false, bumpCD: 0, world, carrying: null, adrenaline: 0, eyeCur: CFG.PLAYER.eye });
  const WALK = CFG.PLAYER.walk;
  for (let i = 0; i < 120; i++) p.update(1 / 60, { move: { x: 0, y: 1 }, sprint: false, crouch: false, turn: 0 }, { dx: 0, dy: 0 });
  const plain = p.speed;
  assert.ok(plain > WALK * 0.9, `walking settles near ${WALK} m/s (got ${plain.toFixed(2)})`);
  p.adrenaline = CFG.SYRINGE.debuff;
  p.speed = 0;
  for (let i = 0; i < 120; i++) p.update(1 / 60, { move: { x: 0, y: 1 }, sprint: false, crouch: false, turn: 0 }, { dx: 0, dy: 0 });
  assert.ok(p.speed < plain * 0.9 && p.speed > plain * 0.6, `rubber legs walk ${p.speed.toFixed(2)} m/s`);
  const s0 = p.stamina;
  for (let i = 0; i < 60; i++) p.update(1 / 60, { move: { x: 0, y: 1 }, sprint: true, crouch: false, turn: 0 }, { dx: 0, dy: 0 });
  const drain = s0 - p.stamina;
  p.adrenaline = 0; p.exhausted = false; p.stamina = s0; p.staminaDelay = 0;
  for (let i = 0; i < 60; i++) p.update(1 / 60, { move: { x: 0, y: 1 }, sprint: true, crouch: false, turn: 0 }, { dx: 0, dy: 0 });
  assert.ok(drain > (s0 - p.stamina) * 1.4, 'breath burns at least 1.4x faster on adrenaline');
  assert.equal(p.adrenaline, 0);
});

test('co-op only: the locked cabinet hides one dose a shift, chosen by the night seed; solo hides none', () => {
  const cab = Object.create(Cabinets.prototype);
  const mk = (id, locked, items = []) => ({ id, locked, mimic: false, items, kind: 'cupboard', group: new THREE.Group() });
  cab.list = [mk('w1', false), mk('w2', false), mk('lock1', true), mk('lock2', true)];
  cab.itemGeo = { syringe: new THREE.BoxGeometry() };
  cab.mat = new THREE.MeshBasicMaterial();
  const rng = { next: () => 0.9 };
  assert.equal(cab._seedAdrenaline(rng), true);
  const withDose = cab.list.filter((c) => c.items.some((i) => i.kind === 'syringe'));
  assert.equal(withDose.length, 1);
  assert.equal(withDose[0].locked, true, 'the dose hides behind a lock');
  assert.equal(withDose[0].items.length, 1, 'one dose, one slot');
  // a cabinet never holds two doses, and a night without locked cabinets gives up quietly
  assert.equal(cab._seedAdrenaline(rng), true);
  for (const c of cab.list) assert.ok(c.items.filter((i) => i.kind === 'syringe').length <= 1);
  cab.list = [mk('w1', false)];
  assert.equal(cab._seedAdrenaline({ next: () => 0.5 }), false);
});
