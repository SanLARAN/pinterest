// Builds the static world: noise terrain, merged props (trees, rocks, bushes),
// the castle, and animated braziers. Static geometry is merged to keep draw calls low.
import * as THREE from 'three';
import { GeoAccumulator, G } from './geo.js';
import { bitmapMaterial } from './bitmap.js';
import { Fader } from './fade.js';
import { COLORS } from './palette.js';
import { HALF, N, SIZE, CASTLE, roadWeight } from '../sim/layout.js';
import { smoothstep } from '../util/math.js';

const W = COLORS.world;
const _c1 = new THREE.Color();
const _c2 = new THREE.Color();
const _c3 = new THREE.Color();
const _m = new THREE.Matrix4();
const _pm = new THREE.Matrix4();
const _lm = new THREE.Matrix4();
const _qp = new THREE.Quaternion();
const _ep = new THREE.Euler();
const _vp = new THREE.Vector3();
const _vs = new THREE.Vector3();

function terrainGeometry(layout) {
  const H = layout.heights;
  const pos = new Float32Array(SIZE * SIZE * 3);
  const col = new Float32Array(SIZE * SIZE * 3);
  const colorOf = (x, z, h, slope) => {
    _c1.setHex(W.grassDark).lerp(_c2.setHex(W.grassLight), smoothstep(-0.4, 0.5, layout.patchNoise(x * 0.07, z * 0.07)));
    _c1.lerp(_c3.setHex(W.meadow), 0.55 * smoothstep(0.45, 0.8, layout.detailNoise(x * 0.1 + 30, z * 0.1 - 12)));
    const rock = Math.max(smoothstep(0.7, 1.2, slope), smoothstep(7, 11, h));
    _c1.lerp(_c3.setHex(W.rock), rock);
    if (h > 12) _c1.lerp(_c3.setHex(W.snow), smoothstep(12, 14, h));
    _c1.lerp(_c3.setHex(W.dirt), 0.92 * roadWeight(x, z));
    const edge = Math.max(Math.abs(x), Math.abs(z));
    if (edge < CASTLE.half + 0.6) {
      // courtyard flagstones
      const checker = (Math.floor(x) + Math.floor(z)) & 1;
      _c1.setHex(checker ? 0xd9ccb3 : 0xcdbf9f);
    }
    return _c1;
  };
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const idx = j * SIZE + i;
      const x = i - HALF;
      const z = j - HALF;
      const h = H[idx];
      pos[idx * 3] = x;
      pos[idx * 3 + 1] = h;
      pos[idx * 3 + 2] = z;
      const hx = H[j * SIZE + Math.min(SIZE - 1, i + 1)] - H[j * SIZE + Math.max(0, i - 1)];
      const hz = H[Math.min(SIZE - 1, j + 1) * SIZE + i] - H[Math.max(0, j - 1) * SIZE + i];
      const slope = Math.hypot(hx, hz) * 0.5;
      const c = colorOf(x, z, h, slope);
      col[idx * 3] = c.r;
      col[idx * 3 + 1] = c.g;
      col[idx * 3 + 2] = c.b;
    }
  }
  const index = new Uint32Array(N * N * 6);
  let k = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * SIZE + i;
      const b = a + 1;
      const c = a + SIZE;
      const d = c + 1;
      index[k++] = a; index[k++] = c; index[k++] = b;
      index[k++] = b; index[k++] = c; index[k++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeVertexNormals();
  return g;
}

/** Adds a sub-part of a prop: propMatrix * localTransform. */
function addLocal(acc, geo, color, propMatrix, t) {
  _ep.set(t.rx || 0, t.ry || 0, t.rz || 0);
  _qp.setFromEuler(_ep);
  _vp.set(t.x || 0, t.y || 0, t.z || 0);
  _vs.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
  _lm.compose(_vp, _qp, _vs);
  _pm.multiplyMatrices(propMatrix, _lm);
  acc.add(geo, color, _pm);
}

function propMatrix(p, y) {
  _vp.set(p.x, y, p.z);
  _ep.set(0, p.ry, 0);
  _qp.setFromEuler(_ep);
  _vs.setScalar(p.s);
  return new THREE.Matrix4().compose(_vp, _qp, _vs);
}

function addTree(acc, p, y) {
  const m = propMatrix(p, y);
  addLocal(acc, G.cyl(0.13, 0.18, 1.0, 6), W.trunk, m, { y: 0.5 });
  if (p.v < 2) {
    addLocal(acc, G.ico(0.72, 0), p.v === 0 ? W.leaf : 0x72bd5b, m, { y: 1.45 });
    addLocal(acc, G.ico(0.46, 0), W.leafDark, m, { y: 2.05, x: 0.22, z: -0.1 });
  } else {
    addLocal(acc, G.cone(0.78, 1.3, 6), W.pine, m, { y: 1.45 });
    addLocal(acc, G.cone(0.56, 1.1, 6), 0x2f8c52, m, { y: 2.2 });
    addLocal(acc, G.cone(0.34, 0.8, 6), 0x3a9a5c, m, { y: 2.8 });
  }
}

function addRock(acc, p, y) {
  const m = propMatrix(p, y);
  addLocal(acc, G.dodeca(0.6), W.rock, m, { y: 0.22, sx: 1.2, sy: 0.75, sz: 1.0 });
  if (p.v % 2 === 0) addLocal(acc, G.dodeca(0.3), 0xb5aca3, m, { x: 0.55, y: 0.1, z: 0.25, sy: 0.8 });
}

function addBush(acc, p, y) {
  const m = propMatrix(p, y);
  addLocal(acc, G.ico(0.5, 0), W.leafDark, m, { y: 0.3, sy: 0.7 });
  const flowers = p.v % 2 === 0 ? [W.flower, W.flowerY] : [W.flowerY, W.flower];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + p.ry;
    addLocal(acc, G.ico(0.09, 0), flowers[i % 2], m, { x: Math.cos(a) * 0.3, y: 0.56, z: Math.sin(a) * 0.3 });
  }
}

/** Castle geometry, split into per-side accumulators (N, S, E, W, keep) so each can fade on its own. */
function buildCastle(layout, accs) {
  const h = CASTLE.half;
  const wallH = CASTLE.wallH;
  // walls: boxes that are not the keep
  for (const b of layout.boxes) {
    if (b.kind === 'keep') continue;
    const sx = b.maxX - b.minX;
    const sz = b.maxZ - b.minZ;
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const side = Math.abs(cz + h) < 0.01 ? 'N' : Math.abs(cz - h) < 0.01 ? 'S' : Math.abs(cx + h) < 0.01 ? 'W' : 'E';
    const acc = accs[side];
    acc.add(G.box(sx, wallH, sz), W.stone, matAt(cx, wallH / 2, cz));
    acc.add(G.box(sx + 0.18, 0.5, sz + 0.18), W.stoneDark, matAt(cx, 0.25, cz));
    const along = sx > sz ? sx : sz;
    const n = Math.max(1, Math.floor(along / 1.0));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5;
      const mx = sx > sz ? cx + t * along : cx;
      const mz = sx > sz ? cz : cz + t * along;
      acc.add(G.box(sx > sz ? 0.5 : sx, 0.55, sx > sz ? sz : 0.5), W.stone, matAt(mx, wallH + 0.27, mz));
    }
  }
  // gate lintels
  for (const sz of [-1, 1]) accs[sz < 0 ? 'N' : 'S'].add(G.box(CASTLE.gate * 2, 1.0, 1.4), W.stone, matAt(0, wallH - 0.4, sz * h));
  // towers
  for (const t of layout.towers) {
    const acc = accs[t.z < 0 ? 'N' : 'S'];
    acc.add(G.cyl(1.5, 1.6, 6.4, 10), W.stone, matAt(t.x, 3.2, t.z));
    acc.add(G.cyl(1.62, 1.62, 0.4, 10), W.stoneDark, matAt(t.x, 0.2, t.z));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      acc.add(G.box(0.45, 0.55, 0.45), W.stone, matAt(t.x + Math.cos(a) * 1.4, 6.6, t.z + Math.sin(a) * 1.4));
    }
    acc.add(G.cone(1.9, 2.6, 10), W.roof, matAt(t.x, 7.9, t.z));
    acc.add(G.sphere(0.18, 6, 4), W.flowerY, matAt(t.x, 9.35, t.z));
    acc.add(G.cyl(0.03, 0.03, 1.0, 4), W.iron, matAt(t.x, 9.85, t.z));
    acc.add(G.box(0.02, 0.45, 0.7), W.roof, matAt(t.x + 0.35, 10.1, t.z));
  }
  // keep
  const acc = accs.keep;
  const K = CASTLE.keepHalf;
  acc.add(G.box(K * 2, CASTLE.keepH, K * 2), W.stone, matAt(0, CASTLE.keepH / 2, 0));
  acc.add(G.box(K * 2 + 0.3, 0.5, K * 2 + 0.3), W.stoneDark, matAt(0, 0.25, 0));
  const roof = G.cone(K * 1.6, 3.6, 4);
  acc.add(roof, W.roof, matAt(0, CASTLE.keepH + 1.8, 0, Math.PI / 4));
  for (const s of [-1, 1]) {
    for (const y of [4.6, 2.1]) {
      acc.add(G.box(0.5, 0.8, 0.12), 0x3d3440, matAt(s * 0.9, y, K + 0.02));
      acc.add(G.box(0.12, 0.8, 0.5), 0x3d3440, matAt(K + 0.02, y, s * 0.9));
    }
  }
  acc.add(G.box(1.2, 1.9, 0.14), 0x4a2f2a, matAt(0, 0.95, K + 0.02));
  acc.add(G.sphere(0.12, 6, 4), W.flowerY, matAt(0.35, 1.0, K + 0.12));
  for (const s of [-1, 1]) {
    acc.add(G.box(0.08, 1.7, 0.7), W.roof, matAt(s * (K + 0.02), 4.6, 0));
  }
  // braziers
  for (const b of layout.braziers) {
    acc.add(G.cyl(0.36, 0.36, 0.25, 8), W.stoneDark, matAt(b.x, 0.12, b.z));
    acc.add(G.cyl(0.07, 0.1, 0.9, 6), W.iron, matAt(b.x, 0.55, b.z));
    acc.add(G.cyl(0.42, 0.25, 0.5, 8), W.iron, matAt(b.x, 1.1, b.z));
  }
}

function matAt(x, y, z, ry = 0) {
  _vp.set(x, y, z);
  _ep.set(0, ry, 0);
  _qp.setFromEuler(_ep);
  _vs.set(1, 1, 1);
  return new THREE.Matrix4().compose(_vp, _qp, _vs);
}

/**
 * Builds the world meshes for a layout. Returns { group, flames, update(t), dispose() }.
 */
export function buildWorld(layout) {
  const group = new THREE.Group();
  const terrainMat = bitmapMaterial();
  const propMat = bitmapMaterial({ sway: 1 });

  const terrainGeo = terrainGeometry(layout);
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.userData.ground = true; // receives shadows only (see game.js castShadows)
  group.add(terrain);

  const propAcc = new GeoAccumulator();
  for (const p of layout.props) {
    const y = layout.heightAt(p.x, p.z);
    if (p.type === 'tree') addTree(propAcc, p, y);
    else if (p.type === 'rock') addRock(propAcc, p, y);
    else addBush(propAcc, p, y);
  }
  const propsGeo = propAcc.build();
  const props = new THREE.Mesh(propsGeo, propMat);
  group.add(props);

  // castle: one mesh per side plus the keep, each with its own fader (see render/fade.js)
  const castleAccs = { N: new GeoAccumulator(), S: new GeoAccumulator(), E: new GeoAccumulator(), W: new GeoAccumulator(), keep: new GeoAccumulator() };
  buildCastle(layout, castleAccs);
  const K = CASTLE.keepHalf;
  const H = CASTLE.half;
  const T = 1.7; // generous box so towers at the corners are included
  const castleBoxes = {
    N: { minX: -H - T, maxX: H + T, minY: 0, maxY: 11, minZ: -H - T, maxZ: -H + T },
    S: { minX: -H - T, maxX: H + T, minY: 0, maxY: 11, minZ: H - T, maxZ: H + T },
    W: { minX: -H - T, maxX: -H + T, minY: 0, maxY: 11, minZ: -H - T, maxZ: H + T },
    E: { minX: H - T, maxX: H + T, minY: 0, maxY: 11, minZ: -H - T, maxZ: H + T },
    keep: { minX: -K - 0.3, maxX: K + 0.3, minY: 0, maxY: CASTLE.keepH + 4, minZ: -K - 0.3, maxZ: K + 0.3 },
  };
  const castleMats = [];
  const fadeUnits = [];
  for (const key of ['N', 'S', 'E', 'W', 'keep']) {
    const mat = bitmapMaterial();
    castleMats.push(mat);
    group.add(new THREE.Mesh(castleAccs[key].build(), mat));
    fadeUnits.push(new Fader([mat], castleBoxes[key]));
  }

  // animated braziers
  const flameGeo = G.cone(0.2, 0.6, 5).translate(0, 0.3, 0);
  const flames = new THREE.InstancedMesh(
    flameGeo,
    new THREE.MeshBasicMaterial({ color: W.flame }),
    layout.braziers.length,
  );
  flames.frustumCulled = false;
  layout.braziers.forEach((b, i) => {
    _m.makeTranslation(b.x, 1.4, b.z);
    flames.setMatrixAt(i, _m);
  });
  group.add(flames);

  // glowing braziers: a ground halo and a soft orb above each bowl (additive, two draw calls)
  const haloGeo = new THREE.CircleGeometry(3.2, 18).rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: W.flame, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const halos = new THREE.InstancedMesh(haloGeo, haloMat, layout.braziers.length);
  halos.frustumCulled = false;
  const orbGeo = new THREE.IcosahedronGeometry(0.42, 0);
  const orbMat = new THREE.MeshBasicMaterial({
    color: W.flame, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const orbs = new THREE.InstancedMesh(orbGeo, orbMat, layout.braziers.length);
  orbs.frustumCulled = false;
  group.add(halos, orbs);

  const dispose = () => {
    haloGeo.dispose();
    haloMat.dispose();
    orbGeo.dispose();
    orbMat.dispose();
    halos.dispose();
    orbs.dispose();
    terrainGeo.dispose();
    propsGeo.dispose();
    flameGeo.dispose();
    terrainMat.dispose();
    propMat.dispose();
    for (const m of castleMats) m.dispose();
    group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    flames.material.dispose();
    flames.dispose();
    fireGeo.dispose();
    fireMat.dispose();
    fireflies.dispose();
  };

  // fireflies: slow drifting motes over the meadow (one draw call)
  const FIREFLIES = 60;
  const fireGeo = new THREE.SphereGeometry(0.07, 4, 3);
  const fireMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffe8, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const fireflies = new THREE.InstancedMesh(fireGeo, fireMat, FIREFLIES);
  fireflies.frustumCulled = false;
  const fireBase = [];
  for (let i = 0; i < FIREFLIES; i++) {
    const a = i * 2.399963; // golden angle spreads them evenly
    const r = 10 + ((i * 37) % 100) * 0.42;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    fireBase.push({ x, z, y: layout.heightAt(x, z) + 1.2 + (i % 5) * 0.25, ph: i * 1.7 });
  }
  group.add(fireflies);

  const update = (t) => {
    for (let i = 0; i < FIREFLIES; i++) {
      const f = fireBase[i];
      const x = f.x + Math.sin(t * 0.7 + f.ph) * 1.2;
      const z = f.z + Math.cos(t * 0.55 + f.ph * 1.3) * 1.2;
      const y = f.y + Math.sin(t * 1.4 + f.ph) * 0.5;
      const sc = 0.55 + 0.45 * Math.sin(t * 3 + f.ph);
      _m.makeScale(sc, sc, sc);
      _m.setPosition(x, y, z);
      fireflies.setMatrixAt(i, _m);
    }
    fireflies.instanceMatrix.needsUpdate = true;
    layout.braziers.forEach((b, i) => {
      const f = 1 + Math.sin(t * 17 + i * 1.7) * 0.12 + Math.sin(t * 29 + i) * 0.08;
      _m.makeScale(1, f * 1.1, 1);
      _m.setPosition(b.x, 1.4, b.z);
      flames.setMatrixAt(i, _m);
      const pulse = 1 + Math.sin(t * 5 + i * 2.3) * 0.06 + (f - 1) * 0.4;
      _m.makeScale(pulse, pulse, pulse);
      _m.setPosition(b.x, 1.6, b.z);
      orbs.setMatrixAt(i, _m);
      _m.makeScale(pulse, 1, pulse);
      _m.setPosition(b.x, 0.1, b.z);
      halos.setMatrixAt(i, _m);
    });
    flames.instanceMatrix.needsUpdate = true;
    orbs.instanceMatrix.needsUpdate = true;
    halos.instanceMatrix.needsUpdate = true;
  };
  update(0);

  return { group, flames, update, dispose, fadeUnits };
}
