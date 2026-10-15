import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG, PAL } from './config.js';
import { mulberry32, clamp } from './noise.js';
import {
  makeGlowMaterial, box, buildCactusGeometry, buildRockGeometry, buildPalmGeometry, buildPostGeometry,
  buildBarrelGeometry, buildTireStackGeometry, buildChevronGeometry, buildMesaGeometry,
  buildCanisterGeometry, buildRageGeometry,
} from './models.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();
const _pt = { x: 0, y: 0, z: 0, tx: 0, tz: 1, heading: 0, idx: 0 };
const _tq = { idx: -1, s: 0, lateral: 0, dist: 0 };
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

const SOLID = { rock: 0.3, mesa: 0.2, pylon: 0.25, palm: 0.25, tire: 0.75 };

/**
 * Everything static in a stage: sky, lights, terrain mesh, road ribbon,
 * gates, props (with colliders) and pickups.
 */
export class World {
  constructor(game) {
    this.game = game;
    this.track = game.track;
    this.terrain = game.terrain;
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.rng = mulberry32(this.track.seed * 977 + 3);
    this.colliders = [];
    this.hash = new Map();
    this.hashCell = 16;
    this.propMat = makeGlowMaterial();
    this.time = 0;
    this._buildTerrain();
    this._buildRoad();
    this._buildStartLine();
    this._buildGates();
    this._buildProps();
    this._buildPickups();
  }

  dispose() {
    this.game.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
      }
    });
  }

  // ------------------------------------------------------------------ ground
  groundHeight(x, z, q) {
    let h = this.terrain.heightAt(x, z);
    if (q) {
      const a = Math.abs(q.lateral), hw = this.track.hw;
      if (a < hw + 1.5) {
        let rh = this.track.heightAtS(q.s) + 0.03;
        if (a > hw) rh -= ((a - hw) / 1.5) * 0.32;
        if (rh > h) h = rh;
      }
    }
    return h;
  }

  /** Ground height anywhere. `hint` = a nearby track sample index (cheap local search). */
  groundAt(x, z, hint = -1) {
    this.track.query(x, z, hint, _tq, hint >= 0);
    this.lastIdx = _tq.idx;
    if (_tq.dist > this.track.hw + 20) return this.terrain.heightAt(x, z);
    return this.groundHeight(x, z, _tq);
  }

  setPropShadows(on) {
    for (const m of this.smallProps || []) m.castShadow = on;
  }

  // ----------------------------------------------------------------- terrain
  _buildTerrain() {
    this.terrainMesh = this.terrain.buildMesh();
    this.group.add(this.terrainMesh);
  }

  _buildRoad() {
    const T = this.track, n = T.n, hw = T.hw;
    const lat = [-hw - 2.6, -hw - 1.5, -hw, -hw * 0.55, -hw * 0.18, hw * 0.18, hw * 0.55, hw, hw + 1.5, hw + 2.6];
    const dy = [-1.9, -0.32, 0, 0, 0, 0, 0, 0, -0.32, -1.9];
    const m = lat.length;
    const pos = new Float32Array(n * m * 3);
    const col = new Float32Array(n * m * 3);
    const cRoad = new THREE.Color(PAL.road), cDark = new THREE.Color(PAL.roadDark);
    const cEdge = new THREE.Color(PAL.roadEdge), cShoulder = new THREE.Color(PAL.dust).multiplyScalar(0.92);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = T.px[i], z = T.pz[i], h = T.h[i] + 0.03, rx = T.rx[i], rz = T.rz[i];
      const wash = T.noise.noise(i * 0.09, 7.7) * 0.05 + (i % 2 ? 0.015 : -0.015);
      for (let k = 0; k < m; k++) {
        const o = (i * m + k) * 3;
        pos[o] = x + rx * lat[k];
        pos[o + 1] = h + dy[k];
        pos[o + 2] = z + rz * lat[k];
        if (k === 0 || k === m - 1) c.copy(cShoulder).multiplyScalar(0.8);
        else if (k === 1 || k === m - 2) c.copy(cShoulder);
        else if (k === 2 || k === m - 3) c.copy(cEdge);
        else if (k === 3 || k === m - 4) c.copy(cDark);
        else c.copy(cRoad);
        c.multiplyScalar(1 + wash);
        col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b;
      }
    }
    const idx = [];
    for (let i = 0; i < n; i++) {
      const i2 = (i + 1) % n;
      for (let k = 0; k < m - 1; k++) {
        const a = i * m + k, b = i * m + k + 1, cc = i2 * m + k, d = i2 * m + k + 1;
        idx.push(a, b, cc, b, d, cc);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    this.group.add(mesh);
    this.roadMesh = mesh;
    this._buildJumpDecals();
  }

  /** Crisp hazard stripes on jump ramps + arrow chevrons before them. */
  _buildJumpDecals() {
    const T = this.track, n = T.n, hw = T.hw;
    const pos = [], col = [];
    const cA = new THREE.Color(PAL.neonYellow), cB = new THREE.Color(0x231833), cP = new THREE.Color(PAL.neonPink);
    const quad = (i0, i1, l0, l1, c, lift = 0.05) => {
      const a = i0 % n, b = i1 % n;
      const p = (i, l) => [T.px[i] + T.rx[i] * l, T.h[i] + 0.03 + lift, T.pz[i] + T.rz[i] * l];
      const v00 = p(a, l0), v01 = p(a, l1), v10 = p(b, l0), v11 = p(b, l1);
      pos.push(...v00, ...v01, ...v10, ...v01, ...v11, ...v10);
      for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b);
    };
    const up = T.jumpUp || 8;
    for (const j of T.jumps) {
      // stripes up the ramp
      for (let k = -up; k < 0; k += 2) {
        const i0 = (j + k + n) % n;
        quad(i0, i0 + 1, -hw + 0.6, hw - 0.6, ((k / 2) & 1) ? cA : cB);
      }
      // arrows on the approach
      for (let a = 0; a < 3; a++) {
        const base = (j - up - 10 - a * 7 + n) % n;
        for (const side of [-1, 1]) {
          const l0 = side * 0.6, l1 = side * (hw * 0.7);
          // a skewed parallelogram reads as a chevron "^"
          const b0 = base, b1 = (base + 2) % n, t0 = (base + 2) % n, t1 = (base + 4) % n;
          const P = (i, l) => [T.px[i] + T.rx[i] * l, T.h[i] + 0.08, T.pz[i] + T.rz[i] * l];
          const v0 = P(b0, l1), v1 = P(b1, l1), v2 = P(t1, l0), v3 = P(t0, l0);
          if (side > 0) pos.push(...v0, ...v2, ...v1, ...v0, ...v3, ...v2);
          else pos.push(...v0, ...v1, ...v2, ...v0, ...v2, ...v3);
          for (let k = 0; k < 6; k++) col.push(cP.r, cP.g, cP.b);
        }
      }
    }
    if (!pos.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _buildStartLine() {
    const T = this.track;
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 32;
    const g = cv.getContext('2d');
    for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) {
      g.fillStyle = (x + y) % 2 ? '#1a1224' : '#f6f0ff';
      g.fillRect(x * 16, y * 16, 16, 16);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    const geo = new THREE.PlaneGeometry(T.hw * 2, 2.6);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(geo, mat);
    T.pointAt(0, 0, _pt);
    mesh.position.set(_pt.x, _pt.y + 0.05, _pt.z);
    mesh.rotation.y = _pt.heading;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  // ------------------------------------------------------------------- gates
  _buildGates() {
    const T = this.track, hw = T.hw;
    const parts = [];
    this.gates = [];
    const neonGeoParts = [];
    for (let k = 0; k < T.checkpoints.length; k++) {
      const s = T.checkpoints[k];
      const isStart = k === 0;
      T.pointAt(s, 0, _pt);
      const span = hw + 2.0;
      const H = isStart ? 8.5 : 7.2;
      const local = [];
      const pc = isStart ? 0x241a33 : 0x2a1f3a;
      box(local, 1.3, H, 1.3, -span, H / 2, 0, pc);
      box(local, 1.3, H, 1.3, span, H / 2, 0, pc);
      box(local, 1.8, 0.5, 1.8, -span, 0.25, 0, 0x150f1d);
      box(local, 1.8, 0.5, 1.8, span, 0.25, 0, 0x150f1d);
      box(local, span * 2 + 1.3, isStart ? 1.8 : 1.0, 1.0, 0, H + (isStart ? 0.9 : 0.5), 0, pc);
      const g = mergeGeometries(local);
      _m.makeRotationY(_pt.heading);
      _m.setPosition(_pt.x, _pt.y, _pt.z);
      g.applyMatrix4(_m);
      parts.push(g);
      // neon strips (separate so they can pulse)
      const nl = [];
      const nc = isStart ? PAL.neonPink : PAL.neonCyan;
      box(nl, span * 2 - 0.4, 0.22, 1.06, 0, H - 0.05, 0, nc, { e: 1 });
      box(nl, 0.22, H - 1, 1.36, -span + 0.68, H / 2, 0, nc, { e: 1 });
      box(nl, 0.22, H - 1, 1.36, span - 0.68, H / 2, 0, nc, { e: 1 });
      if (isStart) box(nl, span * 2 - 0.4, 0.22, 1.06, 0, H + 1.85, 0, PAL.neonCyan, { e: 1 });
      const ng = mergeGeometries(nl);
      ng.applyMatrix4(_m);
      const nmat = makeGlowMaterial();
      const nmesh = new THREE.Mesh(ng, nmat);
      this.group.add(nmesh);
      this.gates.push({ s, mesh: nmesh, mat: nmat, pulse: 0, x: _pt.x, z: _pt.z, y: _pt.y, heading: _pt.heading });
      // pylon colliders
      for (const sgn of [-1, 1]) {
        this._addCollider({ x: _pt.x - _pt.tz * span * sgn, z: _pt.z + _pt.tx * span * sgn, r: 0.95, kind: 'pylon' });
      }
      if (isStart) this._buildBanner(_pt, span, H);
    }
    const mesh = new THREE.Mesh(mergeGeometries(parts), this.propMat);
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  _buildBanner(pt, span, H) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 512, 0);
    grd.addColorStop(0, '#ff2e88'); grd.addColorStop(0.5, '#7a2bff'); grd.addColorStop(1, '#29f3ff');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 64);
    for (let x = 0; x < 64; x++) {
      g.fillStyle = x % 2 ? '#120c1a' : '#fff';
      g.fillRect(x * 8, 0, 8, 6); g.fillRect(x * 8 + (x % 2 ? -8 : 0), 58, 8, 6);
    }
    g.font = 'italic 900 40px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#1a0f26'; g.fillText('NOISE RALLY  ·  START / FINISH', 259, 35);
    g.fillStyle = '#fff'; g.fillText('NOISE RALLY  ·  START / FINISH', 256, 32);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const geo = new THREE.PlaneGeometry(span * 2 - 0.6, 1.6);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(pt.x, pt.y + H + 0.9, pt.z);
    m.rotation.y = pt.heading + Math.PI;
    m.translateZ(-0.52);
    this.group.add(m);
    const m2 = m.clone();
    m2.position.set(pt.x, pt.y + H + 0.9, pt.z);
    m2.rotation.y = pt.heading;
    m2.translateZ(-0.52);
    this.group.add(m2);
  }

  pulseGate(index) {
    const g = this.gates[index];
    if (g) g.pulse = 1;
  }

  // ------------------------------------------------------------------- props
  _addCollider(c) {
    c.alive = true;
    c.id = this.colliders.length;
    this.colliders.push(c);
    const cs = this.hashCell;
    const r = c.r;
    const x0 = Math.floor((c.x - r) / cs), x1 = Math.floor((c.x + r) / cs);
    const z0 = Math.floor((c.z - r) / cs), z1 = Math.floor((c.z + r) / cs);
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
      const key = (a + 2048) * 8192 + (b + 2048);
      let bucket = this.hash.get(key);
      if (!bucket) { bucket = []; this.hash.set(key, bucket); }
      bucket.push(c);
    }
    return c;
  }

  /** Iterate colliders near (x, z). Callback may return true to stop. */
  forColliders(x, z, r, fn) {
    const cs = this.hashCell;
    const x0 = Math.floor((x - r) / cs), x1 = Math.floor((x + r) / cs);
    const z0 = Math.floor((z - r) / cs), z1 = Math.floor((z + r) / cs);
    this._stamp = (this._stamp || 0) + 1;
    const stamp = this._stamp;
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
      const bucket = this.hash.get((a + 2048) * 8192 + (b + 2048));
      if (!bucket) continue;
      for (let i = 0; i < bucket.length; i++) {
        const c = bucket[i];
        if (!c.alive || c.stamp === stamp) continue;
        c.stamp = stamp;
        if (fn(c)) return;
      }
    }
  }

  _clear(x, z, r) {
    let ok = true;
    this.forColliders(x, z, r + 6, (c) => {
      const dx = c.x - x, dz = c.z - z;
      if (dx * dx + dz * dz < (r + c.r) * (r + c.r)) { ok = false; return true; }
      return false;
    });
    return ok;
  }

  _inst(geo, count, shadow = true) {
    const mesh = new THREE.InstancedMesh(geo, this.propMat, Math.max(1, count));
    mesh.count = 0;
    mesh.castShadow = shadow;
    this.group.add(mesh);
    return mesh;
  }

  _place(mesh, c, x, y, z, rotY, sx, sy, sz, color) {
    const i = mesh.count++;
    _e.set(0, rotY, 0);
    _q.setFromEuler(_e);
    _s.set(sx, sy, sz);
    _p.set(x, y, z);
    _m.compose(_p, _q, _s);
    mesh.setMatrixAt(i, _m);
    if (color !== undefined) { _cc.set(color); mesh.setColorAt(i, _cc); }
    if (c) { c.mesh = mesh; c.inst = i; c.matrix = _m.clone(); c.y = y; }
    return i;
  }

  _buildProps() {
    const T = this.track, hw = T.hw, rng = this.rng, terrain = this.terrain;
    const nr = { i: -1, d: Infinity };
    const lim = terrain.size / 2 - 30;
    const cxm = terrain.x0 + terrain.size / 2, czm = terrain.z0 + terrain.size / 2;
    const inBounds = (x, z) => Math.abs(x - cxm) < lim && Math.abs(z - czm) < lim;
    const roadside = (minD, maxD, power = 1.6) => {
      const i = Math.floor(rng() * T.n);
      const side = rng() < 0.5 ? -1 : 1;
      const d = minD + Math.pow(rng(), power) * (maxD - minD);
      return { x: T.px[i] + T.rx[i] * side * d, z: T.pz[i] + T.rz[i] * side * d, i, side, d };
    };
    const farFromRoad = (x, z, minD) => {
      T.nearest(x, z, minD + 1, nr);
      return nr.i < 0;
    };

    // ---- tire walls on the outside of tight corners + chevrons
    const tires = [], chevL = [], chevR = [];
    const n = T.n;
    let lastSign = -1e9;
    for (let i = 0; i < n; i++) {
      const k = T.curv[i];
      if (Math.abs(k) > 1 / 60 && i % 2 === 0) {
        const side = -Math.sign(k); // outside of the turn
        const d = hw + 3.2;
        tires.push({ x: T.px[i] + T.rx[i] * side * d, z: T.pz[i] + T.rz[i] * side * d });
      }
      // chevron sign shortly before corner peaks
      const a = Math.abs(k);
      if (a > 1 / 70 && a >= Math.abs(T.curv[(i + 1) % n]) && a >= Math.abs(T.curv[(i - 1 + n) % n]) && i - lastSign > 40) {
        lastSign = i;
        const j = (i - 14 + n) % n;
        const side = -Math.sign(k);
        const d = hw + 5.5;
        const heading = Math.atan2(-T.tx[j], -T.tz[j]);
        (k > 0 ? chevR : chevL).push({ x: T.px[j] + T.rx[j] * side * d, z: T.pz[j] + T.rz[j] * side * d, heading });
      }
    }
    const tireMesh = this._inst(buildTireStackGeometry(), tires.length);
    for (const t of tires) {
      if (!this._clear(t.x, t.z, 0.6)) continue;
      const c = this._addCollider({ x: t.x, z: t.z, r: 0.85, kind: 'tire' });
      this._place(tireMesh, c, t.x, terrain.heightAt(t.x, t.z) - 0.05, t.z, rng() * 6, 1, 1, 1);
    }
    const chevMeshR = this._inst(buildChevronGeometry(1), chevR.length);
    const chevMeshL = this._inst(buildChevronGeometry(-1), chevL.length);
    for (const [list, mesh] of [[chevR, chevMeshR], [chevL, chevMeshL]]) {
      for (const s of list) {
        const c = this._addCollider({ x: s.x, z: s.z, r: 1.0, kind: 'sign' });
        this._place(mesh, c, s.x, terrain.heightAt(s.x, s.z) - 0.1, s.z, s.heading, 1, 1, 1);
      }
    }

    // ---- marker posts along both edges
    const postGeo = buildPostGeometry();
    const step = Math.round(22 / T.spacing);
    const postMesh = this._inst(postGeo, Math.ceil(n / step) * 2 + 2, false);
    for (let i = 0; i < n; i += step) {
      for (const side of [-1, 1]) {
        const d = hw + 2.9;
        const x = T.px[i] + T.rx[i] * side * d, z = T.pz[i] + T.rz[i] * side * d;
        if (!this._clear(x, z, 0.4)) continue;
        const c = this._addCollider({ x, z, r: 0.35, kind: 'post' });
        this._place(postMesh, c, x, T.h[i] - 0.25, z, rng() * 6, 1, 1, 1);
      }
    }

    // ---- barrels in small clusters near the road (shoot them!)
    const barrels = [];
    for (let k = 0; k < 18; k++) {
      const i = Math.floor(rng() * n);
      if (Math.abs(T.curv[i]) > 1 / 60) continue;
      if (i * T.spacing < 60) continue;
      const side = rng() < 0.5 ? -1 : 1;
      const cnt = 2 + Math.floor(rng() * 3);
      for (let b = 0; b < cnt; b++) {
        const d = hw + 1.4 + rng() * 3.2;
        const ii = (i + Math.floor(rng() * 3)) % n;
        const x = T.px[ii] + T.rx[ii] * side * d + (rng() - 0.5) * 1.5;
        const z = T.pz[ii] + T.rz[ii] * side * d + (rng() - 0.5) * 1.5;
        barrels.push({ x, z });
      }
    }
    const barrelMesh = this._inst(buildBarrelGeometry(), barrels.length);
    for (const b of barrels) {
      if (!this._clear(b.x, b.z, 0.6)) continue;
      const c = this._addCollider({ x: b.x, z: b.z, r: 0.65, kind: 'barrel' });
      this._place(barrelMesh, c, b.x, this.groundAt(b.x, b.z) - 0.03, b.z, rng() * 6, 1, 1, 1);
    }
    this.barrelMesh = barrelMesh;

    // ---- palms around the start / finish
    const palmMesh = this._inst(buildPalmGeometry(), 28);
    for (let k = 0; k < 60 && palmMesh.count < 28; k++) {
      const s = (rng() - 0.5) * 260;
      const i = Math.floor(T.wrapS(s) / T.spacing) % n;
      const side = rng() < 0.5 ? -1 : 1;
      const d = hw + 6 + rng() * 22;
      const x = T.px[i] + T.rx[i] * side * d, z = T.pz[i] + T.rz[i] * side * d;
      if (!farFromRoad(x, z, hw + 5) || !this._clear(x, z, 1.5)) continue;
      const sc = 0.9 + rng() * 0.5;
      const c = this._addCollider({ x, z, r: 0.5 * sc, kind: 'palm' });
      this._place(palmMesh, c, x, terrain.heightAt(x, z) - 0.2, z, rng() * 6, sc, sc, sc);
    }

    // ---- cacti
    const cactusMesh = this._inst(buildCactusGeometry(), 300);
    for (let k = 0; k < 2400 && cactusMesh.count < 300; k++) {
      const p = roadside(hw + 5, 120);
      if (!inBounds(p.x, p.z) || !farFromRoad(p.x, p.z, hw + 4) || !this._clear(p.x, p.z, 1.2)) continue;
      const sc = 0.7 + rng() * 0.7;
      const c = this._addCollider({ x: p.x, z: p.z, r: 0.55 * sc, kind: 'cactus' });
      this._place(cactusMesh, c, p.x, terrain.heightAt(p.x, p.z) - 0.15, p.z, rng() * 6, sc, sc * (0.85 + rng() * 0.3), sc);
    }

    // ---- rocks (instance coloured)
    const rockMesh = this._inst(buildRockGeometry(7), 320);
    const rockCols = [0xa8564a, 0x8f4640, 0xc06a4e, 0x7a3c45, 0xb5735a];
    for (let k = 0; k < 2400 && rockMesh.count < 320; k++) {
      const p = roadside(hw + 6, 160, 1.3);
      if (!inBounds(p.x, p.z) || !farFromRoad(p.x, p.z, hw + 5)) continue;
      const big = rng() < 0.18;
      const sc = big ? 3 + rng() * 4 : 0.8 + rng() * 1.8;
      if (big && !farFromRoad(p.x, p.z, hw + 12)) continue;
      if (!this._clear(p.x, p.z, sc)) continue;
      const c = this._addCollider({ x: p.x, z: p.z, r: sc * 0.95, kind: 'rock' });
      this._place(rockMesh, c, p.x, terrain.heightAt(p.x, p.z) - sc * 0.15, p.z, rng() * 6, sc * (0.8 + rng() * 0.5), sc, sc * (0.8 + rng() * 0.5), rockCols[Math.floor(rng() * rockCols.length)]);
    }

    // ---- mesas (landmarks)
    const mesaMesh = this._inst(buildMesaGeometry(11), 14);
    for (let k = 0; k < 400 && mesaMesh.count < 14; k++) {
      const p = roadside(70, 230, 1);
      if (!inBounds(p.x, p.z) || !farFromRoad(p.x, p.z, 60)) continue;
      const r = 18 + rng() * 26;
      if (!farFromRoad(p.x, p.z, r + 24) || !this._clear(p.x, p.z, r)) continue;
      const h = 22 + rng() * 34;
      const c = this._addCollider({ x: p.x, z: p.z, r: r * 0.95, kind: 'mesa' });
      this._place(mesaMesh, c, p.x, terrain.heightAt(p.x, p.z) - 3, p.z, rng() * 6, r, h, r);
    }

    this.smallProps = [tireMesh, chevMeshL, chevMeshR, barrelMesh, cactusMesh, rockMesh];
    for (const mesh of [tireMesh, chevMeshL, chevMeshR, postMesh, barrelMesh, palmMesh, cactusMesh, rockMesh, mesaMesh]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /** Remove a breakable / explosive prop. */
  breakProp(c) {
    if (!c.alive) return;
    c.alive = false;
    if (c.mesh) {
      c.mesh.setMatrixAt(c.inst, ZERO);
      c.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  resetProps() {
    for (const c of this.colliders) {
      if (!c.alive && c.mesh) {
        c.mesh.setMatrixAt(c.inst, c.matrix);
        c.mesh.instanceMatrix.needsUpdate = true;
      }
      c.alive = true;
    }
    for (const p of this.pickups) { p.active = true; p.timer = 0; }
  }

  // ----------------------------------------------------------------- pickups
  _buildPickups() {
    const T = this.track, rng = this.rng;
    this.pickups = [];
    const spots = [];
    const tries = 200;
    for (let k = 0; k < tries && spots.length < 10; k++) {
      const s = 90 + rng() * (T.length - 140);
      let ok = true;
      for (const o of spots) {
        const d = Math.abs(o - s);
        if (Math.min(d, T.length - d) < 110) { ok = false; break; }
      }
      for (const j of T.jumps) {
        const d = Math.abs(j * T.spacing - s);
        if (Math.min(d, T.length - d) < 40) ok = false;
      }
      if (ok) spots.push(s);
    }
    spots.sort((a, b) => a - b);
    const canGeo = buildCanisterGeometry(), rageGeo = buildRageGeometry();
    this.canMesh = new THREE.InstancedMesh(canGeo, this.propMat, spots.length);
    this.rageMesh = new THREE.InstancedMesh(rageGeo, this.propMat, spots.length);
    this.canMesh.frustumCulled = false;
    this.rageMesh.frustumCulled = false;
    const ringGeo = new THREE.RingGeometry(1.3, 1.9, 24);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    this.ringMesh = new THREE.InstancedMesh(ringGeo, this.ringMat, spots.length);
    this.ringMesh.frustumCulled = false;
    let ci = 0, ri = 0;
    spots.forEach((s, k) => {
      const kind = k % 4 === 2 ? 'rage' : 'nitro';
      const lateral = (rng() - 0.5) * (T.hw * 1.2);
      T.pointAt(s, lateral, _pt);
      const p = { kind, s, x: _pt.x, y: _pt.y, z: _pt.z, active: true, timer: 0, ring: k };
      p.inst = kind === 'rage' ? ri++ : ci++;
      this.pickups.push(p);
      _cc.set(kind === 'rage' ? PAL.neonPink : PAL.neonCyan);
      this.ringMesh.setColorAt(k, _cc);
    });
    this.canMesh.count = ci;
    this.rageMesh.count = ri;
    this.group.add(this.canMesh, this.rageMesh, this.ringMesh);
  }

  update(dt) {
    this.time += dt;
    const t = this.time;
    for (const p of this.pickups) {
      if (!p.active) {
        p.timer -= dt;
        if (p.timer <= 0) p.active = true;
      }
      const mesh = p.kind === 'rage' ? this.rageMesh : this.canMesh;
      if (p.active) {
        _e.set(p.kind === 'rage' ? 0 : 0.35, t * 2.2 + p.s, 0);
        _q.setFromEuler(_e);
        _p.set(p.x, p.y + 1.6 + Math.sin(t * 3 + p.s) * 0.3, p.z);
        _s.set(1, 1, 1);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(p.inst, _m);
        const pulse = 1 + Math.sin(t * 5 + p.s) * 0.12;
        _m.makeScale(pulse, 1, pulse);
        _m.setPosition(p.x, p.y + 0.12, p.z);
        this.ringMesh.setMatrixAt(p.ring, _m);
      } else {
        mesh.setMatrixAt(p.inst, ZERO);
        this.ringMesh.setMatrixAt(p.ring, ZERO);
      }
    }
    this.canMesh.instanceMatrix.needsUpdate = true;
    this.rageMesh.instanceMatrix.needsUpdate = true;
    this.ringMesh.instanceMatrix.needsUpdate = true;
    for (const g of this.gates) {
      if (g.pulse > 0) {
        g.pulse = Math.max(0, g.pulse - dt * 1.6);
        g.mat.userData.u.uFlash.value = g.pulse * 0.85;
      }
    }
  }
}

const _cc = new THREE.Color();
export { SOLID };
