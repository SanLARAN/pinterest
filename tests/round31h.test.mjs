// 3.1h: «Последний свет», the forest's opening film, rebuilt. The 2.1j film fell out of a foggy sky, put four
// people 1.7 m from the flames all at once, left the fire burning after «putting it out», and laid people down on a
// crate. Now: a crane onto the real camp at sunset, then one shot per player doing one real job before the night
// (torch / tent / fuel / douse, at the backpack, the tent, the generator and the fire), then the generator dies
// and they all turn to the dark. These run the film headless, frame by frame, the way Game.updateOpening drives it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

globalThis.document ||= { body: { classList: { add() {}, remove() {} } } };
globalThis.localStorage ||= { getItem: () => null, setItem() {}, removeItem() {} };
const { IntroCutscene, ForestOpening } = await import('../src/game/intro.js');
const { CampFilm, choresFor, campObstacles, FIRE, BACKPACK, BENCH_A, BENCH_B, SEAT_OF } = await import('../src/game/campFilm.js');
const { CAMP_TENT, tentPoint } = await import('../src/world/campLayout.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

const GEN = { x: -3.8, z: 7.4 };
function film(seats = 4) {
  const log = { douse: [], fail: 0, morning: [], stream: 0 };
  const game = {
    scene: new THREE.Scene(), online: false, map: 'forest',
    world: { terrain: { height: () => 0 } },
    audio: { setMorning() {} },
    fire: { stream: (p, k) => { if (k > 0) log.stream++; }, douse: (v) => log.douse.push(v), puff() {}, reset() {}, out() {} },
    fx: { fade: 0, glitch: 0 },
    hud: { setIntro() {}, setHint() {}, setUse() {}, setSkip() {} },
    input: { requestLock() {} },
    objectives: { gens: [{ x: GEN.x, z: GEN.z }], setMorning: (on) => log.morning.push(on), campFail: () => log.fail++, update() {} },
  };
  const o = new CampFilm(game); // (3.1n: the forest opens on the road first — ForestOpening — then this film)
  o.forceSeats = seats;
  o.begin();
  o._build();
  return { o, game, log };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function segDist(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
  const k = L2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2)) : 0;
  return Math.hypot(p.x - (a.x + dx * k), p.z - (a.z + dz * k));
}
// inside the tent's own cloth (not its collision margin)
function inTent(p) {
  const dx = p.x - CAMP_TENT.x, dz = p.z - CAMP_TENT.z, c = Math.cos(CAMP_TENT.yaw), s = Math.sin(CAMP_TENT.yaw);
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  return Math.abs(lx) < CAMP_TENT.halfWidth - 0.15 && Math.abs(lz) < CAMP_TENT.halfLength - 0.1;
}

test('the forestry gets the road and then the camp film; the old bog arrival is gone (5.0a)', () => {
  const forest = new IntroCutscene({ map: 'forest', scene: new THREE.Scene() });
  assert.ok(forest instanceof ForestOpening);
  assert.ok(forest.camp instanceof CampFilm);
  assert.doesNotMatch(src('src/game/intro.js'), /BogArrival/, '«Топь» opens with its own first chapter (game/level2.js)');
  assert.match(src('src/game/intro.js'), /new CampFilm\(game\)/);
});

test('who does what: every count has a story, and the fire always goes out last', () => {
  assert.deepEqual(choresFor(1), [['douse', 'torch']]);
  assert.deepEqual(choresFor(2), [['fuel'], ['douse']]);
  assert.deepEqual(choresFor(3), [['torch'], ['fuel'], ['douse']]);
  assert.deepEqual(choresFor(4), [['torch'], ['tent'], ['fuel'], ['douse']]);
  for (const n of [1, 2, 3, 4]) {
    const { o } = film(n);
    assert.equal(o.cast.length, n);
    assert.equal(o.beats[o.beats.length - 1].chore, n === 1 ? 'torch' : 'douse');
    const kinds = o.shots.map((s) => s.kind);
    assert.equal(kinds[0], 'crane');
    assert.equal(kinds[kinds.length - 1], 'finale');
    assert.deepEqual(kinds.slice(1, -1), o.beats.map((b) => b.chore), 'one shot per job, in order');
    assert.ok(o.dur < 25, `${n} players: ${o.dur.toFixed(1)} s`);
  }
});

test('the seats are on the real benches and nobody starts inside anything', () => {
  for (const s of Object.values(SEAT_OF)) {
    assert.ok(Math.min(segDist(s, BENCH_A[0], BENCH_A[1]), segDist(s, BENCH_B[0], BENCH_B[1])) < 1e-6, 'on a log');
    assert.ok(dist(s, FIRE) > 2.5, 'well back from the flames');
  }
  const { o } = film(4);
  assert.ok(dist(o.st.douse.at, FIRE) >= 1.5 && dist(o.st.douse.at, FIRE) < 1.8, 'close enough to pour, outside the stones');
  assert.ok(dist(o.st.fuel.at, GEN) > 1.0 && dist(o.st.fuel.at, GEN) < 1.4, 'at the generator, not in it');
  assert.ok(dist(o.st.torch.at, BACKPACK) > 0.5 && dist(o.st.torch.at, BACKPACK) < 0.9);
  assert.ok(!inTent(o.st.tent.at), 'kneels outside the tent');
});

test('frame by frame: no NaN, no teleports, nobody walks through the fire, the tent, the pack or the generator', () => {
  for (const n of [1, 2, 3, 4]) {
    const { o } = film(n);
    const prev = new Map();
    for (let t = 0; t <= o.dur; t += 1 / 60) {
      o._actors(t, 1 / 60, true);
      for (const a of o.cast) {
        assert.ok(Number.isFinite(a.x + a.z + a.yaw), `${n}p t=${t.toFixed(2)}`);
        const p = prev.get(a);
        if (p) assert.ok(dist(a, p) * 60 < 1.9, `${n}p ${a.chores[0]} jumps at t=${t.toFixed(2)}`);
        prev.set(a, { x: a.x, z: a.z });
        if (a.seg.type === 'walk') {
          assert.ok(dist(a, FIRE) > 1.3, `${a.chores[0]} walks into the fire at t=${t.toFixed(2)}`);
          assert.ok(!inTent(a), `${a.chores[0]} walks through the tent at t=${t.toFixed(2)}`);
          assert.ok(dist(a, BACKPACK) > 0.3, 'round the pack');
          assert.ok(dist(a, GEN) > 0.6, 'round the generator');
        }
      }
    }
  }
});

test('the feet do not slide: the stride is the distance walked', () => {
  const { o } = film(4);
  for (const a of o.cast) {
    for (const s of a.segs.filter((x) => x.type === 'walk')) {
      o._actors(s.t0 + 0.001, 0, true);
      const x0 = a.x, z0 = a.z, ph0 = a.phase;
      o._actors((s.t0 + s.t1) / 2, 0, true);
      // along a straight leg the distance is the straight line; along a turn, never more than the path walked
      const walked = (a.phase - ph0) / Math.PI * 0.62;
      assert.ok(walked + 1e-6 >= Math.hypot(a.x - x0, a.z - z0), 'never further than the steps');
      assert.ok(walked > 0.2, 'and the steps go on while they move');
    }
  }
});

test('a seek always gives the same frame (positions, headings and joints)', () => {
  const { o } = film(4);
  const snap = () => o.cast.map((a) => [a.x, a.z, a.yaw, a.rig.nodes.hips.position.y, a.rig.nodes.shR.rotation.x, a.rig.nodes.knL.rotation.x]);
  for (const t of [1.2, 6.1, 10.9, 14.2, 18.0, 21.5]) {
    o._actors(t, 0, true);
    const A = snap();
    o._actors(o.dur * Math.random(), 0, true);
    o._actors(t, 0, true);
    const B = snap();
    A.forEach((row, i) => row.forEach((v, j) => assert.ok(Math.abs(v - B[i][j]) < 1e-9, `t=${t} actor ${i} value ${j}`)));
  }
});

test('each job faces its work: the fire, the generator, the tent opening, and the trees with the flashlight', () => {
  const { o } = film(4);
  const facing = (a, to) => (Math.sin(a.yaw) * (to.x - a.x) + Math.cos(a.yaw) * (to.z - a.z)) / Math.hypot(to.x - a.x, to.z - a.z);
  const mid = (chore) => { const b = o.beats.find((x) => x.chore === chore); return (b.actT0 + b.actT1) / 2; };
  o._actors(mid('douse'), 0, true);
  assert.ok(facing(o.cast.find((a) => a.chores.includes('douse')), FIRE) > 0.99);
  o._actors(mid('fuel'), 0, true);
  assert.ok(facing(o.cast.find((a) => a.chores.includes('fuel')), GEN) > 0.99);
  o._actors(mid('tent'), 0, true);
  assert.ok(facing(o.cast.find((a) => a.chores.includes('tent')), tentPoint(0.15, CAMP_TENT.halfLength)) > 0.99);
  const torch = o.beats.find((b) => b.chore === 'torch');
  o._actors(torch.actT0 + 0.2, 0, true);
  const t = o.cast.find((a) => a.chores.includes('torch'));
  assert.ok(facing(t, BACKPACK) > 0.97, 'facing the pack to take it');
  o._actors(torch.actT1 - 0.05, 0, true);
  assert.ok(Math.abs(Math.atan2(Math.sin(t.yaw - (o.st.torch.aim + 0.42)), Math.cos(t.yaw - (o.st.torch.aim + 0.42)))) < 0.05, 'sweeping the trees');
});

test('the things in their hands: picked up, used, and (alone) the bucket put down before the flashlight', () => {
  const { o } = film(1);
  const a = o.cast[0];
  const d = o.beats.find((b) => b.chore === 'douse'), tr = o.beats.find((b) => b.chore === 'torch');
  o._actors(1, 0, true);
  assert.equal(a.bucket.inHand, false, 'by the bench at first');
  o._actors(d.actT0 + 0.5, 0, true);
  assert.equal(a.bucket.inHand, true);
  o._actors(tr.actT0 + 0.1, 0, true);
  assert.equal(a.bucket.inHand, 'dropped', 'the same hand takes the flashlight');
  assert.equal(a.torch.inHand, false);
  o._actors(tr.actT1, 0, true);
  assert.equal(a.torch.inHand, true);
  assert.equal(a.torch.node.parent, a.rig.nodes.elR, 'the flashlight points where the arm points');
  assert.ok(a.torch.cone.material.opacity > 0, 'and it is on');
  const f = film(4);
  const fuel = f.o.beats.find((b) => b.chore === 'fuel'), tent = f.o.beats.find((b) => b.chore === 'tent');
  const fa = f.o.cast.find((x) => x.chores.includes('fuel'));
  f.o._actors(fuel.actT0 + 0.6 * (fuel.actT1 - fuel.actT0), 0, true);
  assert.equal(fa.can.inHand, true);
  assert.ok(fa.can.node.rotation.x > 1, 'tipped to pour');
  f.o._world(tent.actT1 + 0.1, 0, true);
  assert.equal(f.o.flap.scale.y, 1, 'the flap is down');
});

test('the fire really goes out with the bucket, and the generator dies once — a seek back lights it again', () => {
  const { o, log } = film(4);
  const d = o.beats.find((b) => b.chore === 'douse');
  o._world(d.actT0 - 0.5, 1 / 60, true);
  assert.ok(log.douse.at(-1) > 0.75, 'burning before the bucket');
  o._actors(d.actT0 + 0.4 * (d.actT1 - d.actT0), 1 / 60, true);
  assert.ok(log.stream > 0, 'the water goes on the coals');
  o._world(d.actT1 + 0.2, 1 / 60, true);
  assert.equal(log.douse.at(-1), 0, 'out after it, for good');
  o._world(o.tLampOff - 0.1, 1 / 60, true);
  assert.equal(log.fail, 0);
  o._world(o.tLampOff + 0.1, 1 / 60, true);
  o._world(o.tLampOff + 0.5, 1 / 60, true);
  assert.equal(log.fail, 1, 'the camp generator coughs out once (objectives.campFail, the game\'s own dusk)');
  o._world(o.tLampOff - 1, 1 / 60, true);
  assert.equal(log.morning.at(-1), true, 'a seek back before it: the lamp is lit again');
  assert.ok(o.tLook > o.tLampOff && o.tFade > o.tLook && o.dur > o.tFade, 'lamp, look, black, night');
});

test('a second run does not keep the first run\'s people; the forest has its own subtitle', async () => {
  const { o, game } = film(4);
  const before = game.scene.children.length;
  o.forceSeats = 1;
  o.begin();
  o._build();
  assert.equal(o.cast.length, 1);
  assert.ok(game.scene.children.length < before, 'the four from before are gone from the scene');
  assert.match(src('src/game/campFilm.js'), /setIntro\(t\('introBig'\), t\('introSmallCamp'\)\)/);
  globalThis.document.documentElement ||= {};
  const { t, setLang } = await import('../src/core/i18n.js');
  for (const lang of ['ru', 'en']) { setLang(lang); assert.notEqual(t('introSmallCamp'), 'introSmallCamp'); assert.doesNotMatch(t('introSmallCamp'), /УАЗ|UAZ|flood|проезд/i); }
  setLang('ru');
});

test('the camera: a crane, a shot per job that holds its person, the camp at the end', () => {
  const { o } = film(4);
  assert.ok(o.shots[0].t1 >= o.shots[1].t0, 'no gap after the crane');
  for (const s of o.shots.slice(1, -1)) {
    const b = o.beats.find((x) => x.chore === s.kind);
    assert.ok(s.t0 <= b.actT0 && s.t1 >= b.actT1, `${s.kind}: the whole job is in its shot`);
    const t = (b.actT0 + b.actT1) / 2;
    o._actors(t, 0, true);
    const c = o.cameraAt(t);
    const a = s.a;
    const d = Math.hypot(c.p[0] - a.x, c.p[2] - a.z);
    assert.ok(d > 1.8 && d < 4.5, `${s.kind}: ${d.toFixed(1)} m from them`);
    // the person is in front of the lens
    const fx = c.l[0] - c.p[0], fz = c.l[2] - c.p[2], ax = a.x - c.p[0], az = a.z - c.p[2];
    assert.ok((fx * ax + fz * az) / Math.hypot(fx, fz) / Math.hypot(ax, az) > 0.75, `${s.kind}: they are in the picture`);
  }
  assert.ok(o.obs.length >= 6 && campObstacles().some((x) => x.name === 'tent'));
});
