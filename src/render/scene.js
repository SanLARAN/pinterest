// ============================================================
// SCENE — low-poly forest renderer: faceted terrain, instanced trees,
// procedural props, animated sky/fog/light from morning to black night.
// ============================================================
import * as THREE from 'three';
import { patchEcho } from './echo.js';
import { clamp, lerp, smoothstep, TAU } from '../core/util.js';
import { fbm2 } from '../core/noise.js';
import { TREE } from '../sim/world.js';

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec3 uZenith, uHorizon, uSunColor, uSunDir;
uniform float uSunPow, uSunInt, uStars, uTime, uNight;
float hash31(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11,0.27,0.43)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(smoothstep(0.40, 0.96, h), 0.8));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * pow(sd, uSunPow) * uSunInt;
  col += uSunColor * pow(sd, 7.0) * uSunInt * 0.22;
  vec3 cell = floor(d * 210.0);
  float s = hash31(cell);
  float star = smoothstep(0.9976, 1.0, s) * (0.55 + 0.45 * sin(uTime * 2.4 + s * 140.0));
  col += vec3(0.85, 0.93, 1.0) * star * uStars * smoothstep(0.02, 0.28, d.y);
  col = mix(col, col * vec3(0.72, 0.86, 1.0), uNight * 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Scene3D {
  constructor(canvas, world, U, opts = {}) {
    this.canvas = canvas;
    this.world = world;
    this.U = U;
    this.quality = opts.quality || 'high';
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xcfe0ee, 40, 420);
    this.camera = new THREE.PerspectiveCamera(74, 1, 0.08, 2400);
    this.camera.rotation.order = 'YXZ';
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: this.quality === 'high', powerPreference: 'high-performance',
      stencil: false, depth: true, alpha: false, failIfMajorPerformanceCaveat: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.setClearColor(0x05080b, 1);
    this.maxPixelRatio = this.quality === 'high' ? 2 : 1.15;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
    this.groups = {};
    this.lamps = [];
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this._tmp = {
      c1: new THREE.Color(), c2: new THREE.Color(), c3: new THREE.Color(),
      k1: new THREE.Color(), k2: new THREE.Color(), k3: new THREE.Color(),
      v1: new THREE.Vector3(),
    };
    this.time = 0;
    this.skyState = { sunEl: 0.7, sunAz: 0.6 };
    this.build();
    this.resize();
  }

  mat(color, opts = {}) {
    const m = new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opts));
    return patchEcho(m, this.U);
  }

  build() {
    this.buildSky();
    this.buildLights();
    this.buildContent();
    this.buildBirds();
  }

  buildContent() {
    this.buildTerrain();
    this.buildWater();
    this.buildForest();
    this.buildRocks();
    this.buildLandmarks();
    this.buildGenerators();
    this.buildCorpses();
  }

  /** Throw the forest away and grow a new one (used when the seed changes). */
  rebuild(world) {
    this.disposeContent();
    this.world = world;
    this.buildContent();
  }

  disposeContent() {
    const kill = (obj) => {
      obj.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) m.dispose && m.dispose();
        }
      });
    };
    for (let i = this.root.children.length - 1; i >= 0; i--) {
      const c = this.root.children[i];
      kill(c);
      this.root.remove(c);
    }
    for (const k of ['terrain', 'water', 'trunks', 'cones', 'leaves', 'branches', 'rocks', 'logs', 'bushes', 'landmarkGroup', 'beacon', 'tentDark', 'fireLight']) {
      if (this[k] && this[k].parent && this[k].parent !== this.root) { kill(this[k]); this[k].parent.remove(this[k]); }
      this[k] = null;
    }
    this.gens = []; this.corpses = []; this.fireFlames = [];
  }

  // ---------------- sky ----------------
  buildSky() {
    const geo = new THREE.SphereGeometry(1200, 24, 16);
    this.skyU = {
      uZenith: { value: new THREE.Color(0x4f9fe8) },
      uHorizon: { value: new THREE.Color(0xd7e9f7) },
      uSunColor: { value: new THREE.Color(0xfff0cf) },
      uSunDir: { value: new THREE.Vector3(0.4, 0.6, 0.3) },
      uSunPow: { value: 900 },
      uSunInt: { value: 1.4 },
      uStars: { value: 0 },
      uTime: { value: 0 },
      uNight: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xbfd9ff, 0x4a5a3a, 0.95);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.35);
    this.sun.position.set(120, 180, 80);
    this.scene.add(this.sun);
    this.moon = new THREE.DirectionalLight(0x6f8fd0, 0.0);
    this.moon.position.set(-90, 120, -60);
    this.scene.add(this.moon);
    this.amb = new THREE.AmbientLight(0x2a3a44, 0.18);
    this.scene.add(this.amb);
  }

  // ---------------- terrain ----------------
  buildTerrain() {
    const w = this.world;
    const size = w.half * 2 + 20;
    const seg = this.quality === 'high' ? 148 : 104;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const grassA = new THREE.Color(0x4d7f3a), grassB = new THREE.Color(0x6a9c46), dry = new THREE.Color(0x8a8a52);
    const dirt = new THREE.Color(0x5b4632), rock = new THREE.Color(0x6b6f74), sand = new THREE.Color(0xb9a882);
    const moss = new THREE.Color(0x39603a), dark = new THREE.Color(0x2c3a2c);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = w.heightAt(x, z);
      pos.setY(i, y);
      const slope = w.slopeAt(x, z);
      const n = fbm2(x, z, { scale: 9, octaves: 2, seed: 991 }) * 0.5 + 0.5;
      const n2 = fbm2(x, z, { scale: 34, octaves: 2, seed: 442 }) * 0.5 + 0.5;
      const dc = Math.hypot(x, z);
      c.copy(grassA).lerp(grassB, n);
      c.lerp(moss, n2 * 0.45);
      c.lerp(dry, clamp((y - 6) / 16, 0, 1) * 0.35);
      if (y < w.lakeLevel + 1.5) c.lerp(sand, clamp(1 - (y - w.lakeLevel) / 1.5, 0, 1) * 0.85);
      if (y < w.lakeLevel - 0.4) c.lerp(dirt, 0.6);
      c.lerp(rock, clamp((slope - 0.24) / 0.6, 0, 1) * 0.9);
      if (dc > w.half * 0.84) c.lerp(dark, smoothstep(w.half * 0.84, w.half * 1.0, dc));
      c.lerp(rock, smoothstep(w.half * 0.95, w.half * 1.15, dc) * 0.75);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // faceted low-poly: un-index + flat per-face colour
    const ng = geo.toNonIndexed();
    ng.computeVertexNormals();
    const np = ng.attributes.position, nc = ng.attributes.color;
    const jit = (x, z) => 0.9 + fbm2(x * 3.1, z * 3.1, { scale: 4.2, octaves: 1, seed: 77 }) * 0.22;
    for (let f = 0; f < np.count; f += 3) {
      let r = 0, g = 0, b = 0, cx = 0, cz = 0;
      for (let k = 0; k < 3; k++) { r += nc.getX(f + k); g += nc.getY(f + k); b += nc.getZ(f + k); cx += np.getX(f + k); cz += np.getZ(f + k); }
      r /= 3; g /= 3; b /= 3;
      const j = jit(cx / 3, cz / 3);
      for (let k = 0; k < 3; k++) { nc.setXYZ(f + k, r * j, g * j, b * j); }
    }
    nc.needsUpdate = true;
    ng.computeBoundingSphere();
    const mat = this.mat(0xffffff, { vertexColors: true });
    this.terrain = new THREE.Mesh(ng, mat);
    this.terrain.receiveShadow = false;
    this.root.add(this.terrain);
    this.terrainTris = np.count / 3;
  }

  buildWater() {
    const w = this.world;
    const geo = new THREE.CircleGeometry(w.lake.r * 1.22, 44);
    geo.rotateX(-Math.PI / 2);
    const mat = this.mat(0x0d2b33, { transparent: true, opacity: 0.86 });
    this.water = new THREE.Mesh(geo, mat);
    this.water.position.set(w.lake.x, w.lakeLevel, w.lake.z);
    this.root.add(this.water);
  }

  // ---------------- forest ----------------
  buildForest() {
    const w = this.world;
    const T = w.trees.data, N = w.trees.count;
    let nCone = 0, nLeaf = 0, nBranch = 0;
    for (let i = 0; i < N; i++) {
      const t = T[i * 6 + 5];
      if (t === TREE.PINE) nCone += 3;
      else if (t === TREE.SPRUCE) nCone += 2;
      else if (t === TREE.BIRCH) nLeaf += 2;
      else nBranch += 4;
    }
    const trunkGeo = new THREE.CylinderGeometry(0.10, 0.30, 1, 5, 1);
    trunkGeo.translate(0, 0.5, 0);
    const coneGeo = new THREE.ConeGeometry(1, 1, 6, 1);
    coneGeo.translate(0, 0.5, 0);
    const leafGeo = new THREE.IcosahedronGeometry(1, 0);
    const branchGeo = new THREE.CylinderGeometry(0.035, 0.11, 1, 4, 1);
    branchGeo.translate(0, 0.5, 0);

    const mTrunk = this.mat(0x4a3a2b);
    const mCone = this.mat(0x2f5b34);
    const mLeaf = this.mat(0x4c8a3c);
    const mBranch = this.mat(0x3c342c);

    this.trunks = new THREE.InstancedMesh(trunkGeo, mTrunk, N);
    this.cones = new THREE.InstancedMesh(coneGeo, mCone, Math.max(1, nCone));
    this.leaves = new THREE.InstancedMesh(leafGeo, mLeaf, Math.max(1, nLeaf));
    this.branches = new THREE.InstancedMesh(branchGeo, mBranch, Math.max(1, nBranch));
    for (const m of [this.trunks, this.cones, this.leaves, this.branches]) {
      m.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      m.frustumCulled = false;
      this.root.add(m);
    }

    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    const P = new THREE.Vector3(), S = new THREE.Vector3();
    const col = new THREE.Color();
    let ci = 0, li = 0, bi = 0;
    const setInst = (mesh, i, x, y, z, sx, sy, sz, rx, ry, rz, color) => {
      E.set(rx, ry, rz); Q.setFromEuler(E);
      P.set(x, y, z); S.set(sx, sy, sz);
      M.compose(P, Q, S);
      mesh.setMatrixAt(i, M);
      if (color) mesh.setColorAt(i, color);
    };

    for (let i = 0; i < N; i++) {
      const o = i * 6;
      const x = T[o], z = T[o + 1], y = T[o + 2] - 0.18, sc = T[o + 3], rot = T[o + 4], type = T[o + 5];
      const dc = Math.hypot(x, z);
      const rim = smoothstep(w.half * 0.8, w.half * 1.0, dc);
      let trunkCol;
      if (type === TREE.BIRCH) trunkCol = col.setRGB(0.82, 0.80, 0.74);
      else if (type === TREE.DEAD) trunkCol = col.setRGB(0.30 + rim * 0.05, 0.28, 0.26);
      else trunkCol = col.setRGB(0.30, 0.22, 0.15).lerp(new THREE.Color(0.22, 0.2, 0.18), rim);
      const lean = (fbm2(x, z, { scale: 30, octaves: 1, seed: 17 }) - 0.5) * 0.12;

      if (type === TREE.PINE) {
        const th = sc * 0.62;
        setInst(this.trunks, i, x, y, z, sc * 0.085, th, sc * 0.085, lean, rot, lean * 0.6, trunkCol);
        const layers = [[0.42, 0.36, 0.42], [0.66, 0.28, 0.32], [0.88, 0.19, 0.24]];
        for (const [hf, rf, hh] of layers) {
          const g = 0.86 + fbm2(x * 2, z * 2, { scale: 6, octaves: 1, seed: 33 + ci }) * 0.3;
          const cc = col.setRGB(0.16 * g, 0.36 * g * (1 - rim * 0.55), 0.18 * g);
          setInst(this.cones, ci++, x, y + th * hf, z, sc * rf, sc * hh, sc * rf, lean, rot + ci, lean * 0.6, cc);
        }
      } else if (type === TREE.SPRUCE) {
        const th = sc * 0.52;
        setInst(this.trunks, i, x, y, z, sc * 0.075, th, sc * 0.075, lean, rot, lean * 0.6, trunkCol);
        const layers = [[0.5, 0.34, 0.5], [0.82, 0.22, 0.36]];
        for (const [hf, rf, hh] of layers) {
          const g = 0.85 + fbm2(x * 2, z * 2, { scale: 7, octaves: 1, seed: 51 + ci }) * 0.32;
          const cc = col.setRGB(0.18 * g, 0.40 * g * (1 - rim * 0.5), 0.20 * g);
          setInst(this.cones, ci++, x, y + th * hf, z, sc * rf, sc * hh, sc * rf, lean, rot + ci, lean * 0.6, cc);
        }
      } else if (type === TREE.BIRCH) {
        const th = sc * 0.78;
        setInst(this.trunks, i, x, y, z, sc * 0.045, th, sc * 0.045, lean * 1.6, rot, lean, trunkCol);
        for (let k = 0; k < 2; k++) {
          const g = 0.9 + fbm2(x, z, { scale: 5, octaves: 1, seed: 71 + li }) * 0.25;
          const cc = col.setRGB(0.40 * g, 0.62 * g, 0.28 * g);
          const rr = sc * (k ? 0.16 : 0.22);
          setInst(this.leaves, li++, x + (k ? sc * 0.09 : -sc * 0.05), y + th * (k ? 1.02 : 0.86), z + (k ? -sc * 0.06 : sc * 0.05),
            rr, rr * 0.82, rr, lean, rot + li * 1.7, lean, cc);
        }
      } else {
        const th = sc * 0.92;
        setInst(this.trunks, i, x, y, z, sc * 0.055, th, sc * 0.055, lean * 2.2, rot, lean * 1.4, trunkCol);
        for (let b = 0; b < 4; b++) {
          const a = rot + b * 1.62;
          const hh = th * (0.55 + b * 0.11);
          const len = sc * (0.26 + (b % 2) * 0.1);
          const cc = col.setRGB(0.24, 0.22, 0.20);
          E.set(0, a, 0); Q.setFromEuler(E);
          const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.85 + b * 0.12);
          Q.multiply(tilt);
          P.set(x + Math.cos(a) * 0.1, y + hh, z - Math.sin(a) * 0.1);
          S.set(sc * 0.05, len, sc * 0.05);
          M.compose(P, Q, S);
          this.branches.setMatrixAt(bi, M);
          this.branches.setColorAt(bi, cc);
          bi++;
        }
      }
    }
    this.trunks.count = N;
    this.cones.count = ci; this.leaves.count = li; this.branches.count = bi;
    for (const m of [this.trunks, this.cones, this.leaves, this.branches]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      m.frustumCulled = false;
    }
  }

  buildRocks() {
    const w = this.world;
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const mRock = this.mat(0x6d7175);
    this.rocks = new THREE.InstancedMesh(rockGeo, mRock, Math.max(1, w.rocks.count));
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
    const col = new THREE.Color();
    let i = 0;
    for (let k = 0; k < w.rocks.count; k++, i++) {
      const o = k * 6;
      const sc = w.rocks.data[o + 3];
      E.set(Math.random() * 0.6, w.rocks.data[o + 4], Math.random() * 0.6); Q.setFromEuler(E);
      P.set(w.rocks.data[o], w.rocks.data[o + 2], w.rocks.data[o + 1]);
      S.set(sc, sc * w.rocks.data[o + 5], sc * (0.8 + Math.random() * 0.5));
      M.compose(P, Q, S);
      this.rocks.setMatrixAt(i, M);
      const g = 0.75 + Math.random() * 0.4;
      this.rocks.setColorAt(i, col.setRGB(0.42 * g, 0.44 * g, 0.46 * g));
    }
    const logGeo = new THREE.CylinderGeometry(0.28, 0.34, 1, 6, 1);
    const mLog = this.mat(0x4a3a28);
    this.logs = new THREE.InstancedMesh(logGeo, mLog, Math.max(1, w.logs.count));
    for (let k = 0; k < w.logs.count; k++) {
      const o = k * 6;
      E.set(0, 0, Math.PI / 2); Q.setFromEuler(E);
      const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), w.logs.data[o + 4]);
      q2.multiply(Q);
      P.set(w.logs.data[o], w.logs.data[o + 2], w.logs.data[o + 1]);
      S.set(w.logs.data[o + 5] * 1.6, w.logs.data[o + 3], w.logs.data[o + 5] * 1.6);
      M.compose(P, q2, S);
      this.logs.setMatrixAt(k, M);
      this.logs.setColorAt(k, col.setRGB(0.28, 0.22, 0.16));
    }
    const bushGeo = new THREE.ConeGeometry(0.62, 1, 4, 1);
    bushGeo.translate(0, 0.5, 0);
    const mBush = this.mat(0x33552c);
    this.bushes = new THREE.InstancedMesh(bushGeo, mBush, Math.max(1, w.bushes.count));
    for (let k = 0; k < w.bushes.count; k++) {
      const o = k * 5;
      E.set((Math.random() - 0.5) * 0.3, w.bushes.data[o + 4], (Math.random() - 0.5) * 0.3); Q.setFromEuler(E);
      const sc = w.bushes.data[o + 3];
      P.set(w.bushes.data[o], w.bushes.data[o + 2] - 0.05, w.bushes.data[o + 1]);
      S.set(sc, sc * 1.25, sc);
      M.compose(P, Q, S);
      this.bushes.setMatrixAt(k, M);
      const g = 0.7 + Math.random() * 0.5;
      this.bushes.setColorAt(k, col.setRGB(0.20 * g, 0.36 * g, 0.17 * g));
    }
    for (const m of [this.rocks, this.logs, this.bushes]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.frustumCulled = false;
      this.root.add(m);
    }
  }

  buildLandmarks() {
    const w = this.world;
    const g = new THREE.Group();
    this.root.add(g);
    this.landmarkGroup = g;

    // radio mast with a blinking beacon
    const mast = w.landmarks.find((l) => l.kind === 'mast');
    const mMast = this.mat(0x8a4a3a);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, mast.h, 4), mMast);
      leg.position.set(mast.x + Math.cos(a) * 1.15, mast.y + mast.h / 2, mast.z + Math.sin(a) * 1.15);
      leg.rotation.z = -Math.cos(a) * 0.075; leg.rotation.x = Math.sin(a) * 0.075;
      g.add(leg);
    }
    for (let k = 0; k < 6; k++) {
      const y = mast.y + 1.6 + k * (mast.h - 2) / 6;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1 - k * 0.12, 0.05, 3, 6), mMast);
      ring.position.set(mast.x, y, mast.z); ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }
    this.beaconMat = this.mat(0x220000, { emissive: 0xff2211, emissiveIntensity: 0 });
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), this.beaconMat);
    this.beacon.position.set(mast.x, mast.y + mast.h + 0.3, mast.z);
    g.add(this.beacon);

    // tent + campfire at the start
    const tent = w.landmarks.find((l) => l.kind === 'tent');
    const mTent = this.mat(0xb8543a);
    const t = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.9, 4), mTent);
    t.position.set(tent.x, tent.y + 0.9, tent.z); t.rotation.y = tent.rot + Math.PI / 4;
    g.add(t);
    this.tentDark = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), this.mat(0x0a0a0c, { side: THREE.DoubleSide }));
    this.tentDark.position.set(tent.x + Math.cos(tent.rot) * 1.25, tent.y + 0.6, tent.z - Math.sin(tent.rot) * 1.25);
    this.tentDark.rotation.y = tent.rot + Math.PI / 2;
    g.add(this.tentDark);

    const fire = w.landmarks.find((l) => l.kind === 'fire');
    const mStone = this.mat(0x6a6a68);
    this.firePos = new THREE.Vector3(fire.x, fire.y, fire.z);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU;
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), mStone);
      s.position.set(fire.x + Math.cos(a) * 1.05, fire.y + 0.12, fire.z + Math.sin(a) * 1.05);
      s.rotation.set(a, a * 2, a * 0.5);
      g.add(s);
    }
    const mChar = this.mat(0x1a1614);
    for (let k = 0; k < 4; k++) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.2, 4), mChar);
      l.position.set(fire.x, fire.y + 0.2, fire.z);
      l.rotation.set(Math.PI / 2 + (k - 1.5) * 0.24, k * 0.9, 0);
      g.add(l);
    }
    this.fireMat = this.mat(0xff6a1a, { emissive: 0xff5a10, emissiveIntensity: 2.4, transparent: true, opacity: 0.95 });
    this.fireLight = new THREE.PointLight(0xff8a3a, 14, 26, 2);
    this.fireLight.position.set(fire.x, fire.y + 0.9, fire.z);
    g.add(this.fireLight);
    this.fireFlames = [];
    for (let k = 0; k < 5; k++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.24 - k * 0.03, 0.7 - k * 0.09, 4), this.fireMat);
      f.position.set(fire.x + (k - 2) * 0.09, fire.y + 0.34 + k * 0.05, fire.z + (k % 2 ? 0.08 : -0.08));
      g.add(f);
      this.fireFlames.push(f);
    }

    // ruined cabin
    const cab = w.cabin;
    const mWood = this.mat(0x4b3a28);
    const mWood2 = this.mat(0x3a2d20);
    const walls = [[6.4, 3.0, 0.35, 0, 2.6], [6.4, 2.2, 0.35, 0, -2.6], [0.35, 2.6, 5.2, 3.2, 0], [0.35, 1.5, 5.2, -3.2, 0]];
    for (const [sx, sy, sz, ox, oz] of walls) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), sx > 1 ? mWood : mWood2);
      const c = Math.cos(cab.rot), s = Math.sin(cab.rot);
      m.position.set(cab.x + ox * c - oz * s, cab.y + sy / 2 - 0.15, cab.z + ox * s + oz * c);
      m.rotation.y = cab.rot;
      g.add(m);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 3.4), mWood2);
    const rc = Math.cos(cab.rot), rs = Math.sin(cab.rot);
    roof.position.set(cab.x + 0.4 * rc - 1.2 * rs, cab.y + 3.1, cab.z + 0.4 * rs + 1.2 * rc);
    roof.rotation.set(0, cab.rot, 0.24);
    g.add(roof);
    this.stashPos = new THREE.Vector3(cab.x, cab.y, cab.z);

    // stone circle
    const mMon = this.mat(0x5c6167);
    for (const s of w.stones) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.1 * s.s, s.h, 0.7 * s.s), mMon);
      m.position.set(s.x, s.y + s.h / 2 - 0.2, s.z);
      m.rotation.set(0.06, s.rot, (Math.random() - 0.5) * 0.12);
      g.add(m);
    }
    const altar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.3), mMon);
    altar.position.set(w.circle.x, heightSafe(w, w.circle.x, w.circle.z) + 0.25, w.circle.z);
    g.add(altar);
  }

  buildGenerators() {
    const w = this.world;
    this.gens = [];
    const mBody = this.mat(0x4a5a4e);
    const mDark = this.mat(0x2a2f2c);
    const mPad = this.mat(0x5a5a58);
    const mFence = this.mat(0x4a3c2c);
    for (const g of w.gens) {
      const grp = new THREE.Group();
      grp.position.set(g.x, g.y, g.z);
      grp.rotation.y = g.rot;
      const pad = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.32, 6.0), mPad);
      pad.position.y = 0.02; grp.add(pad);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 1.6), mBody);
      body.position.y = 1.05; grp.add(body);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.18, 1.8), mDark);
      top.position.y = 2.05; grp.add(top);
      for (let k = 0; k < 2; k++) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.7, 6), mDark);
        pipe.position.set(k ? 0.8 : -0.8, 2.85, -0.3);
        pipe.rotation.z = k ? -0.22 : 0.22;
        grp.add(pipe);
      }
      const screenMat = this.mat(0x120a08, { emissive: 0xff3a12, emissiveIntensity: 0.25 });
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.06), screenMat);
      screen.position.set(0, 1.35, 0.83); grp.add(screen);
      // fuse socket (glows when you hold a fuse)
      const socketMat = this.mat(0x201a10, { emissive: 0xffb454, emissiveIntensity: 0.0 });
      const socket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.16), socketMat);
      socket.position.set(-0.72, 0.95, 0.85); grp.add(socket);
      // lamp post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 3.4, 5), mDark);
      post.position.set(2.6, 1.7, -1.6); grp.add(post);
      const lampMat = this.mat(0x2a2a22, { emissive: 0xffd9a0, emissiveIntensity: 0.0 });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), lampMat);
      lamp.position.set(2.6, 3.45, -1.6); grp.add(lamp);
      const light = new THREE.PointLight(0xffd9a0, 0, 34, 2);
      light.position.set(2.6, 3.4, -1.6);
      light.visible = false;
      grp.add(light);
      // fence
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU;
        const px = Math.cos(a) * 5.3, pz = Math.sin(a) * 5.3;
        if (k === 3 || k === 4) continue;                       // gate gap
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.7, 0.14), mFence);
        p.position.set(px, 0.85, pz); grp.add(p);
        if (k % 2 === 0) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.09, 0.09), mFence);
          rail.position.set(px, 1.35, pz); rail.rotation.y = -a; grp.add(rail);
        }
      }
      this.root.add(grp);
      this.gens.push({ g, grp, lampMat, lamp, light, screenMat, socketMat, flicker: 0 });
    }
  }

  buildCorpses() {
    const w = this.world;
    this.corpses = [];
    const mSkin = this.mat(0xa9a08d);
    const mCloth = this.mat(0x3d4a44);
    const mCloth2 = this.mat(0x59443a);
    const mBlood = this.mat(0x2a0a0c);
    for (const c of w.corpses) {
      const grp = new THREE.Group();
      grp.position.set(c.x, c.y, c.z);
      grp.rotation.y = c.rot;
      const pose = c.pose % 4;
      const cloth = c.id % 2 ? mCloth : mCloth2;
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 1.05), cloth);
      torso.position.set(0, 0.26, 0);
      torso.rotation.z = pose === 1 ? 0.35 : pose === 3 ? -0.2 : 0.05;
      grp.add(torso);
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.23, 0), mSkin);
      head.position.set(pose === 2 ? 0.42 : 0.05, 0.24, 0.78);
      grp.add(head);
      for (let k = 0; k < 2; k++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.19, 0.9), cloth);
        leg.position.set(k ? 0.17 : -0.17, 0.16, -0.85);
        leg.rotation.y = (k ? 1 : -1) * (pose === 1 ? 0.6 : 0.14);
        leg.rotation.x = pose === 3 ? -0.4 : 0;
        grp.add(leg);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.72), mSkin);
        arm.position.set(k ? 0.42 : -0.42, 0.15, 0.16);
        arm.rotation.y = (k ? 1 : -1) * (pose === 0 ? 1.15 : 0.5);
        arm.rotation.z = (k ? -1 : 1) * 0.2;
        grp.add(arm);
      }
      const blood = new THREE.Mesh(new THREE.CircleGeometry(0.85, 7), mBlood);
      blood.rotation.x = -Math.PI / 2;
      blood.position.set(0.2, 0.03, -0.35);
      grp.add(blood);
      // faint marker so a body can be spotted at arm's length in total darkness
      const mkMat = new THREE.MeshBasicMaterial({ color: 0xd8cfc0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const mk = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mkMat);
      mk.position.set(0, 0.75, 0);
      grp.add(mk);
      this.root.add(grp);
      this.corpses.push({ c, grp, mk, mkMat });
    }
  }

  buildBirds() {
    const geo = new THREE.BufferGeometry();
    this.birdN = 16;
    const arr = new Float32Array(this.birdN * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({ color: 0x22303a, size: 1.5, sizeAttenuation: true, fog: true, transparent: true, opacity: 0.9 });
    this.birds = new THREE.Points(geo, mat);
    this.birds.frustumCulled = false;
    this.birdSeed = Array.from({ length: this.birdN }, () => ({ a: Math.random() * TAU, r: 30 + Math.random() * 90, y: 30 + Math.random() * 34, s: 0.14 + Math.random() * 0.2 }));
    this.scene.add(this.birds);
  }

  // ---------------- per-frame ----------------
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.pixelRatio = this.renderer.getPixelRatio();
  }

  setPixelRatio(pr) {
    this.maxPixelRatio = pr;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pr));
    this.resize();
  }

  updateSky(skyT, dt, camPos) {
    const s = this.skyU;
    const T = this._tmp;
    // keyframes: 0 morning -> 0.45 sunset -> 0.75 twilight -> 1 night
    const zen = T.c1, hor = T.c2, sunC = T.c3;
    if (skyT < 0.42) {
      const k = skyT / 0.42;
      zen.set(0x4f9fe8).lerp(T.k1.set(0x2b3f7a), k);
      hor.set(0xd7e9f7).lerp(T.k2.set(0xff8a3c), k);
      sunC.set(0xfff0cf).lerp(T.k3.set(0xff5a20), k);
    } else if (skyT < 0.72) {
      const k = (skyT - 0.42) / 0.3;
      zen.set(0x2b3f7a).lerp(T.k1.set(0x0a1020), k);
      hor.set(0xff8a3c).lerp(T.k2.set(0x3a1a24), k);
      sunC.set(0xff5a20).lerp(T.k3.set(0x552233), k);
    } else {
      const k = (skyT - 0.72) / 0.28;
      zen.set(0x0a1020).lerp(T.k1.set(0x03060b), k);
      hor.set(0x3a1a24).lerp(T.k2.set(0x060c12), k);
      sunC.set(0x552233).lerp(T.k3.set(0x9fb6e8), k);
    }
    s.uZenith.value.copy(zen);
    s.uHorizon.value.copy(hor);
    s.uSunColor.value.copy(sunC);
    s.uStars.value = smoothstep(0.5, 0.86, skyT);
    s.uNight.value = skyT;
    s.uTime.value += dt;
    s.uSunInt.value = lerp(1.5, 0.55, smoothstep(0.3, 0.8, skyT));
    s.uSunPow.value = lerp(900, 220, skyT);

    // sun travels from high to below the horizon; the moon takes over
    const el = lerp(0.62, -0.34, smoothstep(0, 0.8, skyT));
    const az = lerp(0.9, 2.4, skyT);
    const dir = T.v1.set(Math.cos(az) * Math.cos(el * 1.4), Math.sin(el * 1.5), Math.sin(az) * Math.cos(el * 1.4)).normalize();
    s.uSunDir.value.copy(dir);
    this.sun.position.copy(dir).multiplyScalar(220);
    this.sun.color.copy(sunC);
    this.sun.intensity = lerp(1.45, 0.0, smoothstep(0.34, 0.78, skyT));
    this.moon.position.set(-dir.x * 180, Math.abs(dir.y) * 140 + 40, -dir.z * 180);
    this.moon.intensity = lerp(0.0, 0.085, smoothstep(0.62, 1, skyT));
    this.hemi.intensity = lerp(0.95, 0.035, smoothstep(0.2, 0.9, skyT));
    this.hemi.color.setHex(skyT > 0.5 ? 0x1b2a44 : 0xbfd9ff);
    this.hemi.groundColor.setHex(skyT > 0.5 ? 0x080c0a : 0x4a5a3a);
    this.amb.intensity = lerp(0.2, 0.012, smoothstep(0.2, 0.9, skyT));

    // fog closes in as the light dies — this is what makes the forest a black room
    const f = this.scene.fog;
    f.color.copy(hor).lerp(T.k1.set(0x03070a), smoothstep(0.6, 1, skyT));
    f.near = lerp(38, 1.5, smoothstep(0.25, 0.95, skyT));
    f.far = lerp(430, 62, smoothstep(0.25, 0.95, skyT));
    this.renderer.setClearColor(f.color, 1);
    this.renderer.toneMappingExposure = lerp(1.02, 1.30, smoothstep(0.3, 1, skyT));

    this.sky.position.copy(camPos);
    // beacon blinks only at night
    this.beaconMat.emissiveIntensity = skyT > 0.45 ? (Math.sin(s.uTime.value * 2.4) > 0.72 ? 3.2 : 0.05) : 0.0;
    // camp fire dies at dusk
    const fireOn = clamp(1 - smoothstep(0.32, 0.62, skyT), 0, 1);
    this.fireLight.intensity = fireOn * (11 + Math.sin(s.uTime.value * 13) * 2.4 + Math.sin(s.uTime.value * 7.3) * 1.6);
    this.fireMat.emissiveIntensity = fireOn * 2.6;
    this.fireMat.opacity = 0.25 + fireOn * 0.7;
    if (this.fireFlames) for (let i = 0; i < this.fireFlames.length; i++) {
      const f2 = this.fireFlames[i];
      f2.scale.setScalar((0.6 + fireOn * 0.6) * (0.85 + Math.sin(s.uTime.value * (9 + i * 2.1)) * 0.18));
      f2.visible = fireOn > 0.02;
    }
    this.fireLight.visible = fireOn > 0.02;

    // birds only by day
    this.birds.visible = skyT < 0.5;
    if (this.birds.visible) {
      const arr = this.birds.geometry.attributes.position;
      for (let i = 0; i < this.birdN; i++) {
        const b = this.birdSeed[i];
        b.a += dt * b.s;
        arr.setXYZ(i, Math.cos(b.a) * b.r, b.y + Math.sin(b.a * 3 + i) * 3.5, Math.sin(b.a) * b.r);
      }
      arr.needsUpdate = true;
      this.birds.material.opacity = 1 - skyT * 2;
    }
  }

  update(game, dt, player) {
    this.time += dt;
    this.updateSky(game.skyT, dt, this.camera.position);

    // generator lamps
    for (const G of this.gens) {
      const g = G.g;
      const on = g.fixed ? g.lamp : 0;
      G.flicker = on > 0.05 ? (Math.sin(this.time * 21 + g.id) > 0.93 ? 0.35 : 1) : 0;
      const i = on * G.flicker;
      G.lampMat.emissiveIntensity = i * 3.4;
      G.screenMat.emissiveIntensity = on > 0.02 ? 1.6 * i : 0.22 + Math.sin(this.time * 3 + g.id) * 0.08;
      G.socketMat.emissiveIntensity = !g.fixed && player.fuses > 0 ? 1.1 + Math.sin(this.time * 6) * 0.5 : 0.0;
      const d = Math.hypot(player.x - g.x, player.z - g.z);
      G.light.visible = on > 0.05 && d < 95;
      G.light.intensity = on > 0.05 ? 26 * i * clamp(1 - d / 95, 0.15, 1) : 0;
    }

    // corpse markers: only visible when you are right on top of them
    for (const C of this.corpses) {
      const d = Math.hypot(player.x - C.c.x, player.z - C.c.z);
      const want = C.c.searched ? 0 : clamp(1 - d / 13, 0, 1) * (1 - game.skyT * 0.15);
      C.mkMat.opacity = want * (0.45 + 0.35 * Math.sin(this.time * 2.2 + C.c.id));
      C.mk.visible = want > 0.02;
      C.grp.rotation.z = C.c.searched ? 0 : Math.sin(this.time * 0.4 + C.c.id) * 0.0;
    }

    // water shimmer
    const wsc = 1 + Math.sin(this.time * 0.5) * 0.0015;
    this.water.scale.set(wsc, 1, wsc);
  }
}

function heightSafe(w, x, z) { return w.heightAt(x, z); }
