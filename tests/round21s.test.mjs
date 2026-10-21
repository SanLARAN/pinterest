// 2.1s regressions: shift length (2/4/6 nights, difficulty stretched by effective day), the sovkhoz
// in the generator chain, the dead cow + tractor + ringing stall chains, the walkable lookout deck,
// the Watcher's grip, and the lobby/settings plumbing that carries the days.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CFG, diffDay, monsterTargets } from '../src/core/config.js';
import { RNG } from '../src/core/rng.js';
import { cleanLobbyRules } from '../src/net/lobbyRules.js';
import { pickChain } from '../src/game/objectives.js';
import { chainAt, deckClampPos } from '../src/game/expedition.js';
import { Watcher } from '../src/game/monsters.js';
import { World, CABINET_DIMS, LANDMARKS } from '../src/world/world.js';

class MemoryStorage { constructor() { this.map = new Map(); } get length() { return this.map.size; } key(i) { return [...this.map.keys()][i] ?? null; } getItem(k) { return this.map.get(k) ?? null; } setItem(k, v) { this.map.set(k, String(v)); } removeItem(k) { this.map.delete(k); } clear() { this.map.clear(); } }
globalThis.localStorage = new MemoryStorage();
const { cleanSettings } = await import('../src/cloud/snapshot.js');

test('the shift runs 2, 4 or 6 nights and difficulty stretches by effective day', () => {
  assert.deepEqual(CFG.SHIFT.OPTIONS, [2, 4, 6]);
  assert.equal(CFG.SHIFT.DAYS, 4);
  for (let d = 1; d <= 4; d++) assert.equal(diffDay(d, 4), d, 'a four-night shift is itself');
  assert.equal(diffDay(1, 2), 2);
  assert.equal(diffDay(2, 2), 4, 'night 2 of 2 is a finale');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((d) => diffDay(d, 6)), [1, 2, 2, 3, 4, 4]);
  assert.equal(diffDay(3, 99), 3, 'nonsense lengths fall back to four');
  assert.equal(diffDay(1, undefined), 1);
  // and through the tables: the last night of a short shift is as crowded as the old fourth
  assert.equal(monsterTargets(300, diffDay(2, 2)).crawlers, monsterTargets(300, 4).crawlers);
  assert.ok(monsterTargets(300, diffDay(2, 6)).crawlers < monsterTargets(300, 4).crawlers);
});

test('the days travel through the lobby rules and the cloud settings, cleaned', () => {
  assert.equal(cleanLobbyRules({ days: 6 }).days, 6);
  assert.equal(cleanLobbyRules({ days: 2 }).days, 2);
  assert.equal(cleanLobbyRules({ days: 5 }).days, 4, 'not an option: back to four');
  assert.equal(cleanLobbyRules(null).days, 4);
  assert.equal(cleanLobbyRules({ hideNames: true, days: 6 }).hideNames, true, 'the older rule rides along');
  assert.equal(cleanSettings({ shiftDays: 6 }).shiftDays, 6);
  assert.equal(cleanSettings({ shiftDays: 3 }).shiftDays, 4);
  assert.equal(cleanSettings({}).shiftDays, 4);
});

test('the chain: camp first, the sovkhoz always in, exactly one forest site stood down', () => {
  const droppedSeen = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const chain = pickChain(new RNG(seed * 7919), 6);
    assert.equal(chain.length, 5);
    assert.equal(chain[0], 0, 'camp first');
    assert.ok(chain.includes(5), 'the sovkhoz (site 5) always works a shift now');
    assert.equal(new Set(chain).size, 5, 'no site twice');
    const missing = [1, 2, 3, 4].filter((i) => !chain.includes(i));
    assert.equal(missing.length, 1, 'exactly one forest site stands down');
    droppedSeen.add(missing[0]);
  }
  assert.equal(droppedSeen.size, 4, 'over many shifts every forest site gets its turn as scrap');
});

test('the lookout deck: rails all round, one ladder gap, and stepping in is the way down', () => {
  assert.deepEqual(deckClampPos(0, 0), { x: 0, z: 0, off: false });
  assert.equal(deckClampPos(3, 0).x, 1.78, 'the east rail');
  assert.equal(deckClampPos(0, -3).z, -1.78, 'the north rail');
  assert.equal(deckClampPos(1.2, 3).z, 1.78, 'the south rail holds away from the ladder');
  const gap = deckClampPos(0.1, 1.9);
  assert.equal(gap.z, 1.9, 'in the gap you may stand over the ladder');
  assert.equal(gap.off, false);
  assert.equal(deckClampPos(0.1, 2.5).off, true, 'one more step and you are climbing down');
  assert.equal(deckClampPos(-0.49, 1.97).off, true);
  assert.equal(deckClampPos(-0.51, 1.97).off, false, 'but only in the gap');
});

test('a chain is brushed within its radius and not beyond', () => {
  const chains = [{ x: 0, z: 0 }, { x: 3, z: 0 }];
  assert.equal(chainAt(chains, 0.3, 0.2, CFG.CHAIN.r), 0);
  assert.equal(chainAt(chains, 2.6, 0, CFG.CHAIN.r), 1);
  assert.equal(chainAt(chains, 1.5, 0, CFG.CHAIN.r), -1);
  assert.equal(CFG.CHAIN.loud, 0.5);
});

function watcherDouble() {
  const w = Object.create(Watcher.prototype);
  const victim = { id: 'me', alive: true, x: 1, y: 0, z: 0, held: false };
  const evs = [], seized = [], kills = [];
  w.cfg = CFG.MONSTER.watcher;
  w.id = 7; w.x = 0; w.z = 0; w.y = 0; w.yaw = 0; w.headYaw = 0; w.speedCur = 0;
  w.seizing = null; w.seizeT = 0; w.seizeK = 0; w.seizeVis = false; w.gripCD = 0; w.state = 'stalk';
  w.syncRig = () => {};
  w.game = {
    player: victim, time: 0,
    sync: { ev: (...a) => evs.push(a) },
    pulses: { emit() {} },
    ghosts: { release() {} },
    kill: (m, v) => kills.push(v),
    onSeized: (on) => seized.push(on),
  };
  return { w, victim, evs, seized, kills };
}

test("the Watcher takes hold before it kills — and light on it breaks the grip", () => {
  assert.equal(CFG.MONSTER.watcher.seize, 1.6);
  const { w, victim, evs, seized, kills } = watcherDouble();
  w.beginSeize(victim);
  assert.equal(w.seizing, victim);
  assert.deepEqual(evs[0], ['wz', 7, 'me', 1]);
  assert.deepEqual(seized, [true], 'the held one is told: feet stop, psychosis starts');
  assert.equal(w.seizeTick(0.5, false), true, 'still held half a second in');
  assert.equal(kills.length, 0, 'not dead yet — that is the point');
  assert.equal(w.seizeTick(0.2, true), false, 'a light on it...');
  assert.equal(w.seizing, null);
  assert.equal(w.state, 'lurk', '...and it is simply gone');
  assert.deepEqual(seized, [true, false]);
  assert.equal(kills.length, 0, 'nobody died');
  assert.ok(w.gripCD > 0, 'and it does not take hold again in the same breath');
});

test('unlit for the whole grip, the kill lands — and the word goes out before it', () => {
  const { w, victim, evs, seized, kills } = watcherDouble();
  w.beginSeize(victim);
  assert.equal(w.seizeTick(1.0, false), true);
  assert.equal(w.seizeTick(0.7, false), false, '1.7 s of grip: over');
  assert.deepEqual(kills, [victim]);
  assert.deepEqual(evs.at(-1), ['wz', 7, 'me', 0], 'released over the wire as the kill lands');
  assert.deepEqual(seized, [true, false]);
});

test('the sovkhoz grew: chains at the stall mouths, a dead cow, a tractor with a padlocked toolbox', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate();
  const L = LANDMARKS.find((l) => l.id === 'sovkhoz');
  assert.equal(w.sovkhozChains.length, 7, 'one chain per stall partition mouth');
  for (const c of w.sovkhozChains) assert.ok(Math.hypot(c.x - L.x, c.z - L.z) < L.r, 'chains hang at the farm');
  assert.ok(w.sovkhozCow && Math.hypot(w.sovkhozCow.x - L.x, w.sovkhozCow.z - L.z) < L.r, 'the cow lies at the farm');
  assert.ok(!w.col.free(w.sovkhozCow.x, w.sovkhozCow.z, 0.4), 'and you cannot walk through her');
  const tb = w.cabinets.find((c) => c.id === 'sovkhoz:tractor');
  assert.ok(tb && tb.kind === 'toolbox' && tb.locked === true, "the tractor's toolbox wants a crowbar");
  assert.deepEqual(tb.loot, ['battery', 'shard', 'nuts']);
  assert.ok(CABINET_DIMS.toolbox && CABINET_DIMS.toolbox.h < CABINET_DIMS.locker.h, 'a toolbox is not a locker stood on a tractor');
  const site = w.sites.find((s) => s.id === 'sovkhoz');
  assert.ok(site, 'a generator site at the farm');
  assert.ok(Math.hypot(site.x - L.x, site.z - L.z) < L.r);
  assert.equal(w.sites.length, 6);
  assert.ok(w.col.free(site.x + 1.6, site.z, 0.4) || w.col.free(site.x - 1.6, site.z, 0.4), 'room to stand at its generator');
});
