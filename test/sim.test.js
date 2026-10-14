import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, hashSeed } from '../src/util/rng.js';
import { createNoise2D, fbm } from '../src/util/noise.js';
import { buildLayout, HALF, SIZE, PLAY_RADIUS, roadWeight } from '../src/sim/layout.js';
import { FlowField } from '../src/sim/nav.js';
import { resolveStatic, clampToArena } from '../src/sim/collision.js';
import { ScoreKeeper, COMBO_WINDOW } from '../src/sim/scoring.js';
import { WaveDirector, waveSpec } from '../src/sim/waves.js';
import { cleanName, qualifies, addScore, sanitizeEntries, MAX_SCORES } from '../src/sim/highscores.js';
import { drawUpgrades, UPGRADES } from '../src/sim/upgrades.js';
import { ENEMY_TYPES, ENEMY_DEFS } from '../src/sim/defs.js';

test('rng is deterministic per seed and in range', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) {
    const v = a.next();
    assert.equal(v, b.next());
    assert.ok(v >= 0 && v < 1);
  }
  assert.equal(typeof hashSeed('hollow'), 'number');
});

test('simplex noise is bounded and deterministic', () => {
  const n1 = createNoise2D(7);
  const n2 = createNoise2D(7);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < 2000; i++) {
    const x = (i * 0.37) % 50 - 25;
    const y = (i * 0.91) % 50 - 25;
    const v = n1(x, y);
    assert.equal(v, n2(x, y));
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  assert.ok(min > -1.2 && max < 1.2, `range ${min}..${max}`);
  assert.ok(max - min > 0.8, 'noise should vary');
  const f = fbm(n1, 0.3, 0.7, 4);
  assert.ok(Math.abs(f) <= 1.2);
});

test('layout: heightfield is finite and courtyard is flat', () => {
  const L = buildLayout(123);
  assert.equal(L.heights.length, SIZE * SIZE);
  for (const v of L.heights) assert.ok(Number.isFinite(v));
  for (const [x, z] of [[0, 0], [0, 7.5], [5, -5], [-8, 8]]) {
    assert.ok(Math.abs(L.heightAt(x, z)) < 0.01, `courtyard at ${x},${z} = ${L.heightAt(x, z)}`);
  }
});

test('layout: same seed gives same world, different seeds differ', () => {
  const a = buildLayout(9);
  const b = buildLayout(9);
  const c = buildLayout(10);
  assert.equal(a.props.length, b.props.length);
  assert.deepEqual(a.props[0], b.props[0]);
  assert.notEqual(a.heightAt(15, 15), c.heightAt(15, 15));
});

test('layout: props stay in play area, avoid castle, and rifts are free', () => {
  for (const seed of [1, 2, 3, 77, 999]) {
    const L = buildLayout(seed);
    assert.ok(L.props.length > 80, `props for seed ${seed}: ${L.props.length}`);
    for (const p of L.props) {
      assert.ok(Math.hypot(p.x, p.z) < PLAY_RADIUS);
      assert.ok(Math.max(Math.abs(p.x), Math.abs(p.z)) > 11, 'castle zone clear');
    }
    for (const rf of L.rifts) {
      assert.ok(Math.hypot(rf.x, rf.z) > 20 && Math.hypot(rf.x, rf.z) < PLAY_RADIUS);
    }
  }
});

test('navigation: enemies can route from rifts to the hero inside the castle', () => {
  let reachable = 0;
  let total = 0;
  for (const seed of [1, 2, 3, 4]) {
    const L = buildLayout(seed);
    const flow = new FlowField(L.blocked);
    flow.setGoal(L.start.x, L.start.z);
    for (const rf of L.rifts) {
      total++;
      if (flow.dist[flow.cellOf(rf.x, rf.z)] >= 0) reachable++;
    }
  }
  assert.ok(reachable / total > 0.9, `reachable ${reachable}/${total}`);
});

test('navigation: flow field steers around the castle wall through a gate', () => {
  const L = buildLayout(5);
  const flow = new FlowField(L.blocked);
  flow.setGoal(L.start.x, L.start.z); // hero in the courtyard, south of the keep
  const out = { x: 0, z: 0 };
  // enemy north of the wall, off the gate axis, so it must route around
  const ok = flow.steer(-8, -20, L.start.x, L.start.z, out);
  assert.ok(ok);
  assert.ok(Math.hypot(out.x, out.z) > 0.5);
  assert.ok(flow.dist[flow.cellOf(-8, -20)] > 0, 'enemy cell is reachable');
});

test('collision: pushes a body out of a tower and out of a wall', () => {
  const L = buildLayout(3);
  const body = { x: 11, z: 11 + 0.4, radius: 0.5 };
  resolveStatic(L, body);
  const t = L.towers[3];
  assert.ok(Math.hypot(body.x - t.x, body.z - t.z) >= 1.25 + 0.5 - 1e-3);
  const wall = { x: -6, z: -10.99, radius: 0.5 }; // x=-6 is solid wall (the gate is |x|<2.2)
  resolveStatic(L, wall);
  assert.ok(wall.z <= -11.7 - 0.5 + 1e-6 || wall.z >= -10.3 + 0.5 - 1e-6, `wall z ${wall.z}`);
  const inside = { x: 0, z: 0, radius: 0.5 };
  assert.equal(resolveStatic(L, inside), true, 'keep centre is solid');
});

test('collision: arena clamp keeps bodies inside the play circle', () => {
  const b = { x: 100, z: 0, radius: 0.5 };
  assert.equal(clampToArena(b), true);
  assert.ok(Math.hypot(b.x, b.z) <= PLAY_RADIUS - 0.5 + 1e-9);
});

test('roads: weight is 1 on the road and 0 far away', () => {
  assert.ok(roadWeight(0, 25) > 0.9);
  assert.equal(roadWeight(20, 20), 0);
});

test('scoring: combo multiplier ramps and resets on timeout or damage', () => {
  const s = new ScoreKeeper();
  for (let i = 0; i < 4; i++) s.kill(10);
  assert.equal(s.multiplier, 2);
  assert.equal(s.score, 10 + 10 + 10 + 20, 'kills 1-3 at x1, kill 4 at x2');
  s.update(COMBO_WINDOW + 0.01);
  assert.equal(s.combo, 0);
  for (let i = 0; i < 40; i++) s.kill(1);
  assert.equal(s.multiplier, 5, 'capped at x5');
  s.breakCombo();
  assert.equal(s.combo, 0);
  s.waveBonus(3);
  assert.equal(s.score > 300, true);
});

test('waves: director spawns the full wave, waits for clear, then advances', () => {
  const rng = createRng(4);
  const d = new WaveDirector(rng);
  const spawned = [];
  let alive = 0;
  let cleared = 0;
  const chapters = [];
  const env = {
    alive: () => alive,
    spawn: (type) => { spawned.push(type); alive++; },
    onChapter: (spec) => chapters.push(spec.number),
    onCleared: () => { cleared++; },
  };
  d.nextWave(env);
  assert.deepEqual(chapters, [1]);
  for (let t = 0; t < 60 && spawned.length < waveSpec(1).total; t += 1 / 60) d.update(1 / 60, env);
  assert.equal(spawned.length, waveSpec(1).total);
  assert.ok(spawned.every((s) => s === 'slime'), 'wave 1 is only slimes');
  // kill everything -> clears
  alive = 0;
  for (let t = 0; t < 10; t += 1 / 60) d.update(1 / 60, env);
  assert.equal(cleared, 1);
  for (let t = 0; t < 5; t += 1 / 60) d.update(1 / 60, env);
  assert.deepEqual(chapters, [1, 2]);
});

test('waves: boss appears on every fifth wave and is the first spawn', () => {
  const spec = waveSpec(5);
  assert.equal(spec.isBoss, true);
  const rng = createRng(1);
  const d = new WaveDirector(rng);
  const spawned = [];
  const env = { alive: () => 0, spawn: (t) => spawned.push(t), onChapter() {}, onCleared() {} };
  d.wave = 4;
  d.nextWave(env);
  for (let t = 0; t < 30; t += 1 / 60) d.update(1 / 60, env);
  assert.equal(spawned[0], 'boss');
  assert.ok(spawned.includes('brute') || spawned.length > 0);
});

test('highscores: sorting, qualification, cap and name cleaning', () => {
  assert.equal(cleanName('  <b>Sir Pip</b>\u0007  '), 'bSir Pip/b');
  assert.equal(cleanName(''), 'KNIGHT');
  assert.equal(cleanName('ABCDEFGHIJKLMNOP').length, 12);
  let list = [];
  for (let i = 0; i < MAX_SCORES; i++) {
    const r = addScore(list, { name: 'n' + i, score: (i + 1) * 100, time: i });
    list = r.list;
  }
  assert.equal(list.length, MAX_SCORES);
  assert.equal(list[0].score, 1000);
  assert.equal(qualifies(list, 50), false, 'below the lowest score');
  assert.equal(qualifies(list, 150), true);
  assert.equal(qualifies([], 0), false, 'zero never qualifies');
  const r = addScore(list, { name: 'top', score: 5000, time: 99 });
  assert.equal(r.rank, 1);
  assert.equal(r.list.length, MAX_SCORES);
  const r2 = addScore(list, { name: 'low', score: 1, time: 100 });
  assert.equal(r2.rank, null);
  const clean = sanitizeEntries([{ name: 'x', score: '12' }, null, { score: 5 }, { score: 'bad' }]);
  assert.equal(clean.length, 1, 'only real numeric scores survive');
  assert.equal(clean[0].score, 5);
});

test('upgrades: draws distinct boons and each mutates stats', () => {
  const rng = createRng(2);
  const picks = drawUpgrades(rng, 3);
  assert.equal(new Set(picks.map((p) => p.id)).size, 3);
  const stats = { damage: 1, reach: 1, arc: 1, swingCooldown: 1, speed: 1, maxHp: 100, dashCooldown: 1, lifesteal: 0, magnet: 1 };
  const hero = { heal() {} };
  for (const u of UPGRADES) u.apply(stats, hero);
  assert.ok(stats.damage > 1 && stats.speed > 1 && stats.maxHp > 100 && stats.lifesteal > 0);
});

test('defs: every enemy type has sane stats', () => {
  for (const t of ENEMY_TYPES) {
    const d = ENEMY_DEFS[t];
    assert.ok(d.hp > 0 && d.speed > 0 && d.radius > 0 && d.score > 0 && d.xp > 0, t);
  }
});
