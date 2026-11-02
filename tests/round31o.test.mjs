// 3.1o: «обрывы при ходьбе… на полигоне светло и всё дёргано ходит, а на мотоциклах норм едешь»; «в анимации мы
// начинаем ехать с обрыва карты, и видно, что сзади карта обрывается»; «переделай модельку уазика — он весь
// дырявый, вот референс, только без крыши». Three fixes, each made un-repeatable below.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '', width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
});
globalThis.document = globalThis.document || {
  documentElement: stubEl(), body: stubEl(), head: stubEl(), getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [],
  createElement: () => stubEl(), createElementNS: () => stubEl(), addEventListener() {}, removeEventListener() {},
};
globalThis.window = globalThis.window || {
  addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { search: '', href: 'http://localhost/' },
};
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { CFG } = await import('../src/core/config.js');
const { World } = await import('../src/world/world.js');
const { Player } = await import('../src/game/player.js');
const { FAR, roadHeight, groundAt, lampFirst } = await import('../src/world/yard.js');
const { buildCarBody, buildCarWheels, CARP } = await import('../src/ui/garageSet.js');
const { geometryOf, buildPart } = await import('../src/game/uaz.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let _world = null;
const forest = () => (_world ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate());

// ---------------- walking ----------------
// On foot the head bobbed as −|sin|: at every footfall the camera's vertical speed flipped in one frame, four
// times a second. In the dark you never saw it; in daylight (the training ground, the morning, by a lamp) the
// whole world jolted on every step. A bike has no bob, so a bike rode smooth.
function walk(hz, seconds, sprintAt = Infinity) {
  const w = forest();
  const p = new Player(w);
  p.reset(0);
  p.yaw = 4.7; // along open ground from the camp
  const input = { move: { x: 0, y: 1 }, sprint: false, crouch: false, turn: 0 };
  const ys = [];
  for (let i = 0; i < hz * seconds; i++) {
    input.sprint = i / hz >= sprintAt;
    p.update(1 / hz, input, { dx: 0, dy: 0 });
    ys.push(p.bobY);
  }
  return ys;
}

test('the bob eases into each footfall: no one-frame bounce, at 185 Hz or at 60', () => {
  for (const hz of [185, 60]) {
    const ys = walk(hz, 4).slice(hz); // (past the first second's start-up)
    let jerk = 0, low = 0;
    for (let i = 2; i < ys.length; i++) {
      const v1 = (ys[i] - ys[i - 1]) * hz, v0 = (ys[i - 1] - ys[i - 2]) * hz;
      jerk = Math.max(jerk, Math.abs(v1 - v0));
      low = Math.min(low, ys[i]);
    }
    // −|sin| gave ~0.6 m/s of vertical speed reversed inside one frame; cos² changes it by a few cm/s per frame
    assert.ok(jerk < (hz > 100 ? 0.08 : 0.2), `${hz} Hz: the bob's vertical speed jumps ${jerk.toFixed(3)} m/s in a frame`);
    assert.ok(low < -0.015, `${hz} Hz: and it still bobs (${low.toFixed(3)} m)`);
  }
});

test('breaking into a run deepens the bob gradually, not in one drop', () => {
  const ys = walk(185, 4, 2);
  // a run's bob is deeper and quicker (7.5 cm, 5 steps a second): its vertical speed changes by up to ~0.2 m/s a
  // frame at 185 Hz — smoothly. The old curve reversed 2.3 m/s at every footfall of a run.
  let jerk = 0;
  for (let i = 185 * 2 - 5; i < 185 * 3; i++) jerk = Math.max(jerk, Math.abs((ys[i] - ys[i - 1]) - (ys[i - 1] - ys[i - 2])) * 185);
  assert.ok(jerk < 0.3, `starting a sprint, the bob's vertical speed jumps ${jerk.toFixed(3)} m/s in a frame`);
  assert.match(src('src/game/player.js'), /this\.bobAmp = damp\(this\.bobAmp \|\| 0, ampTo, 8, dt\);/);
  assert.doesNotMatch(src('src/game/player.js'), /Math\.abs\(Math\.sin\(this\.bobPhase\)\)/);
});

// ---------------- the land past the edge ----------------
test('the highway runs on into the haze both ways, with land and pines past the forest on all three sides', () => {
  const w = forest();
  const R = CFG.ROAD, HY = roadHeight(w);
  const tris = [];
  for (const m of w.outside.meshes) {
    const p = m.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 9) tris.push([p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5], p[i + 6], p[i + 7], p[i + 8]]);
  }
  const box = new THREE.Box3();
  for (const m of w.outside.meshes) box.union(m.geometry.boundingBox);
  // nothing stray far off (the north shoulder used to be laid 340 m out, at twice the road's z)
  assert.ok(box.min.x >= FAR.x0 - 6 && box.max.x <= FAR.x1 + 6 && box.min.z >= FAR.z0 - 6 && box.max.z <= FAR.z1 + 6,
    `everything out there stays inside the far land: ${box.min.x.toFixed(0)}…${box.max.x.toFixed(0)}, ${box.min.z.toFixed(0)}…${box.max.z.toFixed(0)}`);
  const asphalt = (x) => tris.some((t) => Math.abs(t[1] - HY) < 0.01 && Math.abs(t[4] - HY) < 0.01 && Math.min(t[0], t[3], t[6]) <= x && Math.max(t[0], t[3], t[6]) >= x && Math.min(t[2], t[5], t[8]) <= R.z && Math.max(t[2], t[5], t[8]) >= R.z);
  for (const x of [FAR.x0 + 20, -300, R.x0 - 30, 300, R.x1 + 100, FAR.x1 - 20]) assert.ok(asphalt(x), `asphalt under x = ${x}`);
  // the far shoulder is where it should be now
  assert.ok(tris.some((t) => t[2] > R.z + 4.4 && t[2] < R.z + 6.5 && Math.abs(t[1] - HY) < 0.15), 'the north shoulder by the road');
  // ground east and west of the forest, beyond the strip, past the road
  const ground = (x, z) => tris.some((t) => Math.min(t[0], t[3], t[6]) <= x && Math.max(t[0], t[3], t[6]) >= x && Math.min(t[2], t[5], t[8]) <= z && Math.max(t[2], t[5], t[8]) >= z);
  for (const [x, z] of [[450, 150], [-420, 200], [100, 480], [600, 344], [-480, 344]]) assert.ok(ground(x, z), `ground at ${x}, ${z}`);
  assert.equal(w.outside.lamps.every((L) => L.x > R.x0 - 70 && L.x < R.x1 + 170), true, 'the glowing lamps: the stretch you can see');
  assert.ok(Math.abs(((lampFirst() - CFG.YARD.x) / R.lampEvery) % 1) < 1e-9, 'one lamp still stands where the cut comes in');
});

test('where the coarse land meets the finer ground, the finer ground\'s in-between vertices are in its edge (no crack)', () => {
  const w = forest();
  const verts = new Set();
  const key = (x, y, z) => `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
  for (const m of w.outside.meshes) {
    const p = m.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) verts.add(key(p[i], p[i + 1], p[i + 2]));
  }
  const H = CFG.WORLD_HALF;
  const on = (x, z) => verts.has(key(x, groundAt(w, x, z), z));
  // the forest's east and west edges, the strip's ends and its far side: every 2.5 m vertex is shared
  for (let z = 2.5; z < 300; z += 25) { assert.ok(on(H, z), `east seam at z ${z}`); assert.ok(on(-H, z), `west seam at z ${z}`); }
  for (let z = 302.5; z < 400; z += 10) { assert.ok(on(CFG.ROAD.x0, z), `the strip's west end at z ${z}`); }
  for (let x = -87.5; x < 255; x += 20) assert.ok(on(x, 400), `the strip's far side at x ${x}`);
});

test('the road film opens on road that goes on behind the car, and traffic comes out of the haze', () => {
  const film = src('src/game/roadFilm.js');
  const hw = /\{ k: 'wide'[^}]*hw: \[(\d+),/.exec(film);
  assert.ok(hw, 'the wide shot');
  assert.ok(+hw[1] < FAR.x1 - 250, `the car starts at x ${hw[1]}: the road runs on ${FAR.x1 - hw[1]} m behind it`);
  const esc = src('src/game/escape.js');
  assert.match(esc, /x: dir > 0 \? R\.x0 - 120 : R\.x1 \+ 120/);
  assert.match(esc, /shared\.uRoadK\.value\.set\(1\.5, lampFirst\(\), FAR\.x1\)/);
});

// ---------------- the УАЗ ----------------
// Rays at the body from every side, against front faces only (the game's material culls back faces, so a
// panel seen from behind is a hole): every ray aimed at the body must stop at its skin.
function hitter(arr) {
  const mesh = new THREE.Mesh(geometryOf(arr), new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
  mesh.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  return (o, d) => {
    rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize());
    return rc.intersectObject(mesh)[0] || null;
  };
}
const inArch = (x, y) => [[0.66, 1.72], [-1.72, -0.76]].some(([a, b]) => x > a - 0.02 && x < b + 0.02 && y < 0.99);

for (const forestCar of [false, true]) {
  test(`the ${forestCar ? 'yard\'s broken' : 'whole'} УАЗ has no holes: its sides, front and tail stop every ray`, () => {
    const hit = hitter(buildCarBody({ forest: forestCar }));
    let n = 0;
    for (let x = -1.98; x <= 1.98; x += 0.07) {
      for (let y = 0.64; y <= 1.25; y += 0.05) {
        const front = x < -0.74;
        if (front && y > 0.99) continue; // (above the wings: the hood, or the bay)
        if (front && y < 0.67) continue; // (the wings stop short of the sill, over the bumper, as the real ones do)
        if (inArch(x, y)) continue;
        for (const s of [-1, 1]) {
          const h = hit([x, y, s * 4], [0, 0, -s]);
          assert.ok(h && Math.abs(h.point.z) > 0.84, `side ${s} at x ${x.toFixed(2)}, y ${y.toFixed(2)}: ${h ? h.point.z.toFixed(2) : 'through'}`);
          n++;
        }
      }
    }
    for (let z = -0.85; z <= 0.85; z += 0.05) {
      for (let y = 0.68; y <= 1.0; y += 0.04) { // (under 0.66 the wings are open over the bumper, as on the real car)
        const f = hit([-4, y, z], [1, 0, 0]);
        assert.ok(f && f.point.x < -1.95, `the front at y ${y.toFixed(2)}, z ${z.toFixed(2)}`);
        const r = hit([4, y, z], [-1, 0, 0]);
        assert.ok(r && r.point.x > 1.95, `the tail at y ${y.toFixed(2)}, z ${z.toFixed(2)}`);
        n += 2;
      }
    }
    // from above, the wings; and the hood (the whole car's — the yard's is its own mesh, propped open)
    for (let x = -1.95; x <= -0.8; x += 0.08) {
      for (const z of forestCar ? [-0.8, -0.7, 0.7, 0.8] : [-0.8, -0.5, 0, 0.5, 0.8]) {
        const h = hit([x, 4, z], [0, -1, 0]);
        assert.ok(h && h.point.y > 0.95, `from above at ${x.toFixed(2)}, ${z}`);
        n++;
      }
    }
    // ...and the arches are open: the wheel well is there behind each, not the panel
    for (const x of [-1.19, 1.19]) {
      const h = hit([x, 0.88, 4], [0, 0, -1]);
      assert.ok(h && h.point.z < 0.8, `through the arch at x ${x}`);
    }
    assert.ok(n > 1200, `${n} rays`);
  });
}

test('the УАЗ after the reference: lamps, grille, plates, the spare, the windscreen — and its roof off', () => {
  const arr = buildCarBody();
  const g = geometryOf(arr);
  const k = g.attributes.data.array; // (kind in the data's 4th byte)
  const kinds = new Set();
  for (let i = 3; i < k.length; i += 4) kinds.add(k[i]);
  for (const [name, kind] of [['headlamp glass', 26], ['tail lamps', 27], ['chrome', 23], ['amber indicators', 46], ['the plates', 8]]) assert.ok(kinds.has(kind), name);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  assert.ok(bb.max.y > 1.7 && bb.max.y < 1.8, `the windscreen's top is the highest thing: ${bb.max.y.toFixed(2)} (no hoops, no roof)`);
  assert.ok(bb.max.x > 2.25, 'the spare on the tailgate');
  assert.ok(bb.min.x < -2.2, 'the bumper and its plate up front');
  assert.ok(arr.count / 3 < 4000, `${arr.count / 3} triangles`);
  // the seats the crew sit in are where they were
  const hit = hitter(arr);
  const seat = hit([0.12, 2, 0.42], [0, -1, 0]);
  assert.ok(seat && Math.abs(seat.point.y - 0.9) < 0.05, `the driver's seat at ${seat?.point.y.toFixed(2)}`);
});

test('a wheel\'s rim closes the tyre\'s hole: no ring of daylight round the hub', () => {
  const r = CARP.wheelR;
  for (const arr of [buildCarWheels({}, 0), buildPart('wheel').toArrays()]) {
    const g = geometryOf(arr);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
    if (g.boundingBox.max.y - g.boundingBox.min.y < 0.5) mesh.rotation.x = Math.PI / 2; // (the part lies on its side: axle along y)
    mesh.updateMatrixWorld(true);
    const rc = new THREE.Raycaster();
    for (let a = 0.13; a < 6.28; a += 0.4) { // (off the polygons' own corners: a ray down a shared edge is a tie, not a hole)
      for (const k of [0.3, 0.5, 0.57, 0.585]) {
        for (const s of [-1, 1]) {
          rc.set(new THREE.Vector3(Math.cos(a) * r * k, Math.sin(a) * r * k, s * 2), new THREE.Vector3(0, 0, -s));
          assert.ok(rc.intersectObject(mesh).length > 0, `a ray through the wheel at ${k} r, angle ${a.toFixed(1)}, side ${s}`);
        }
      }
    }
  }
});
