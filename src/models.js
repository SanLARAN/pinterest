import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
//  Procedural low-poly models. Every part carries a vertex colour and an
//  "aEmissive" weight so lights glow without extra materials/draw calls.
// ---------------------------------------------------------------------------

const _c = new THREE.Color();

export function finish(g, color, emissive = 0) {
  if (g.index) g = g.toNonIndexed();
  g.deleteAttribute('uv');
  _c.set(color);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3), em = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    em[i] = emissive;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aEmissive', new THREE.BufferAttribute(em, 1));
  g.computeVertexNormals();
  return g;
}

export function box(list, w, h, d, x, y, z, color, o = {}) {
  let g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const pos = g.attributes.position;
  if (o.tx !== undefined || o.tz !== undefined || o.sz !== undefined) {
    const tx = o.tx ?? 1, tz = o.tz ?? 1, sz = o.sz ?? 0;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) {
        pos.setX(i, pos.getX(i) * tx);
        pos.setZ(i, pos.getZ(i) * tz + sz);
      }
    }
  }
  if (o.rx) g.rotateX(o.rx);
  if (o.rz) g.rotateZ(o.rz);
  if (o.ry) g.rotateY(o.ry);
  g.translate(x, y, z);
  list.push(finish(g, color, o.e || 0));
}

export function cyl(list, rTop, rBot, h, seg, x, y, z, color, o = {}) {
  let g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1).toNonIndexed();
  if (o.rx) g.rotateX(o.rx);
  if (o.rz) g.rotateZ(o.rz);
  if (o.ry) g.rotateY(o.ry);
  g.translate(x, y, z);
  list.push(finish(g, color, o.e || 0));
}

export function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return c.getHex();
}

/** Lambert material with per-vertex emissive, hit flash and burn uniforms. */
export function makeGlowMaterial(opts = {}) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, ...opts });
  const u = { uFlash: { value: 0 }, uBurn: { value: 0 }, uGhost: { value: 0 } };
  mat.userData.u = u;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFlash = u.uFlash;
    shader.uniforms.uBurn = u.uBurn;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aEmissive;\nvarying float vEmis;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEmis = aEmissive;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFlash;\nuniform float uBurn;\nvarying float vEmis;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.06, 0.07), uBurn);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * vEmis * 1.8 * (1.0 - uBurn);')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.97, 0.9), uFlash);');
  };
  mat.customProgramCacheKey = () => 'glowmat';
  return mat;
}

// ---------------------------------------------------------------------------
// Rally car (player + rivals). Faces +Z. Length ~4.2, width ~1.9.
// ---------------------------------------------------------------------------
export function buildRallyGeometry({ color, color2, lights = 0xfff1a8, isPlayer = false }) {
  const L = [];
  const dark = 0x1d1726, glass = 0x241a3d, metal = 0x4a4458;
  const body = color, trim = color2, bodyD = shade(color, 0.7);
  box(L, 1.9, 0.5, 4.1, 0, 0.58, 0, body);                                   // lower body
  box(L, 1.84, 0.24, 3.95, 0, 0.95, 0.02, body, { tx: 0.96, tz: 0.97 });     // shoulder
  box(L, 1.6, 0.56, 2.0, 0, 1.34, -0.3, glass, { tx: 0.84, tz: 0.7, sz: -0.12 }); // cabin glass
  box(L, 1.36, 0.08, 1.38, 0, 1.64, -0.4, body);                             // roof
  box(L, 0.5, 0.025, 1.39, 0, 1.69, -0.4, trim);                            // roof stripe
  box(L, 0.5, 0.025, 1.25, 0, 1.08, 1.4, trim);                             // hood stripe
  box(L, 0.42, 0.13, 0.55, 0, 1.73, -0.05, bodyD);                           // roof scoop
  // flared arches
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(L, 0.24, 0.36, 1.08, sx * 0.99, 0.78, sz * 1.32, bodyD);
  box(L, 1.98, 0.34, 0.32, 0, 0.42, 2.1, dark);                              // front bumper
  box(L, 1.98, 0.3, 0.26, 0, 0.46, -2.08, dark);                             // rear bumper
  box(L, 1.96, 0.07, 0.48, 0, 1.5, -1.92, trim);                             // wing
  box(L, 0.09, 0.32, 0.14, -0.62, 1.3, -1.9, dark);
  box(L, 0.09, 0.32, 0.14, 0.62, 1.3, -1.9, dark);
  box(L, 0.06, 0.3, 0.5, -0.98, 1.5, -1.92, trim);                           // wing end plates
  box(L, 0.06, 0.3, 0.5, 0.98, 1.5, -1.92, trim);
  // rally light pod
  for (const x of [-0.6, -0.2, 0.2, 0.6]) box(L, 0.28, 0.24, 0.12, x, 0.98, 2.02, lights, { e: 1 });
  box(L, 1.5, 0.06, 0.16, 0, 0.84, 2.02, dark);
  // headlights / taillights
  box(L, 0.42, 0.14, 0.05, -0.62, 0.66, 2.1, 0xfff6e0, { e: 1 });
  box(L, 0.42, 0.14, 0.05, 0.62, 0.66, 2.1, 0xfff6e0, { e: 1 });
  box(L, 0.44, 0.14, 0.05, -0.62, 0.8, -2.1, 0xff1f45, { e: 1 });
  box(L, 0.44, 0.14, 0.05, 0.62, 0.8, -2.1, 0xff1f45, { e: 1 });
  // side trim stripe
  box(L, 1.94, 0.1, 3.2, 0, 0.66, 0.1, trim);
  // mud flaps + exhaust
  box(L, 0.42, 0.3, 0.04, -0.9, 0.35, -1.92, dark);
  box(L, 0.42, 0.3, 0.04, 0.9, 0.35, -1.92, dark);
  box(L, 0.18, 0.18, 0.32, 0.55, 0.36, -2.18, metal);
  // hood guns (everyone's armed in this rally)
  const gl = isPlayer ? 1.0 : 0.75;
  box(L, 0.14, 0.14, gl, -0.48, 1.13, 1.45 + (isPlayer ? 0.12 : 0), metal);
  box(L, 0.14, 0.14, gl, 0.48, 1.13, 1.45 + (isPlayer ? 0.12 : 0), metal);
  box(L, 0.3, 0.16, 0.36, -0.48, 1.12, 0.92, dark);
  box(L, 0.3, 0.16, 0.36, 0.48, 1.12, 0.92, dark);
  if (isPlayer) {
    // neon underglow strips
    box(L, 0.06, 0.06, 3.0, -0.97, 0.36, 0.05, 0x29f3ff, { e: 1 });
    box(L, 0.06, 0.06, 3.0, 0.97, 0.36, 0.05, 0x29f3ff, { e: 1 });
  }
  return mergeGeometries(L);
}

// Raider buggy (the "goons"): open roll cage, spiked ram, glowing red eyes.
export function buildGoonGeometry({ color = 0x2a1f33, color2 = 0xff3355 }) {
  const L = [];
  const dark = 0x15111b, metal = 0x5b5566, steel = 0x8d8899;
  box(L, 1.7, 0.28, 3.4, 0, 0.52, 0, color);
  box(L, 1.55, 0.4, 1.0, 0, 0.82, 1.2, color, { tz: 0.5, sz: -0.2 });
  box(L, 1.4, 0.06, 0.8, 0, 1.03, 1.1, color2);
  for (const x of [-0.66, 0.66]) {
    box(L, 0.1, 0.85, 0.1, x, 1.08, 0.35, dark);
    box(L, 0.1, 0.85, 0.1, x, 1.08, -0.75, dark);
    box(L, 0.1, 0.1, 1.2, x, 1.5, -0.2, dark);
  }
  box(L, 1.42, 0.1, 0.1, 0, 1.5, 0.35, dark);
  box(L, 1.42, 0.1, 0.1, 0, 1.5, -0.75, dark);
  box(L, 0.5, 0.45, 0.55, 0, 0.88, -0.2, dark);                              // seat
  box(L, 0.4, 0.38, 0.4, 0, 1.25, -0.15, color2);                            // helmet
  box(L, 0.34, 0.1, 0.05, 0, 1.28, 0.06, 0xff2a3a, { e: 1 });               // visor
  box(L, 1.25, 0.6, 0.9, 0, 0.85, -1.35, metal);                             // engine
  box(L, 0.16, 0.5, 0.16, -0.4, 1.3, -1.6, steel);
  box(L, 0.16, 0.5, 0.16, 0.4, 1.3, -1.6, steel);
  box(L, 1.85, 0.22, 0.25, 0, 0.45, 1.78, steel);                            // ram bar
  for (const x of [-0.6, 0, 0.6]) box(L, 0.14, 0.14, 0.42, x, 0.5, 2.05, steel, { tx: 0.2, tz: 0.2 });
  box(L, 0.3, 0.1, 0.05, -0.45, 0.8, 1.72, 0xff1a3a, { e: 1 });
  box(L, 0.3, 0.1, 0.05, 0.45, 0.8, 1.72, 0xff1a3a, { e: 1 });
  box(L, 0.16, 0.16, 0.85, 0, 1.64, 0.35, metal);                            // turret gun
  return mergeGeometries(L);
}

export const RALLY_WHEELS = [
  { x: -0.86, y: 0.42, z: 1.32, r: 0.42, w: 0.36, front: true },
  { x: 0.86, y: 0.42, z: 1.32, r: 0.42, w: 0.36, front: true },
  { x: -0.86, y: 0.42, z: -1.32, r: 0.42, w: 0.36, front: false },
  { x: 0.86, y: 0.42, z: -1.32, r: 0.42, w: 0.36, front: false },
];
export const GOON_WHEELS = [
  { x: -0.95, y: 0.5, z: 1.15, r: 0.5, w: 0.42, front: true },
  { x: 0.95, y: 0.5, z: 1.15, r: 0.5, w: 0.42, front: true },
  { x: -1.0, y: 0.52, z: -1.2, r: 0.55, w: 0.5, front: false },
  { x: 1.0, y: 0.52, z: -1.2, r: 0.55, w: 0.5, front: false },
];

export function buildWheelGeometry() {
  const L = [];
  cyl(L, 1, 1, 1, 10, 0, 0, 0, 0x1b1622, { rz: Math.PI / 2 });
  cyl(L, 0.55, 0.55, 1.08, 6, 0, 0, 0, 0xd8d2e6, { rz: Math.PI / 2 });
  return mergeGeometries(L);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export function buildCactusGeometry() {
  const L = [];
  const g = 0x2f9e6e, g2 = 0x3fbf86;
  cyl(L, 0.4, 0.48, 4.2, 6, 0, 2.1, 0, g);
  cyl(L, 0.28, 0.4, 0.5, 6, 0, 4.45, 0, g2);
  cyl(L, 0.26, 0.26, 1.0, 6, 0.75, 2.0, 0, g, { rz: Math.PI / 2 });
  cyl(L, 0.26, 0.3, 1.7, 6, 1.25, 2.75, 0, g);
  cyl(L, 0.24, 0.24, 0.8, 6, -0.62, 2.6, 0, g, { rz: Math.PI / 2 });
  cyl(L, 0.22, 0.26, 1.2, 6, -1.0, 3.1, 0, g2);
  return mergeGeometries(L);
}

export function buildRockGeometry(seed = 1) {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const pos = g.attributes.position;
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  // jitter shared vertices consistently (icosahedron is non-indexed)
  const map = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = map.get(key);
    if (k === undefined) { k = 0.75 + r() * 0.5; map.set(key, k); }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.75, pos.getZ(i) * k);
  }
  g.translate(0, 0.35, 0);
  return finish(g, 0xffffff);
}

export function buildPalmGeometry() {
  const L = [];
  const trunk = 0x8a5a3c, leaf = 0x2fae7a, leaf2 = 0x1f8a63;
  let x = 0, y = 0;
  for (let i = 0; i < 6; i++) {
    const h = 1.3;
    cyl(L, 0.26 - i * 0.025, 0.3 - i * 0.025, h, 6, x, y + h / 2, 0, i % 2 ? trunk : shade(trunk, 0.85));
    y += h * 0.97; x += 0.12 + i * 0.03;
  }
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const g = new THREE.ConeGeometry(0.5, 3.4, 3, 1).toNonIndexed();
    g.scale(1, 1, 0.25);
    g.translate(0, 1.7, 0);
    g.rotateZ(-1.9 + (k % 2) * 0.25);
    g.rotateY(a);
    g.translate(x, y + 0.1, 0);
    L.push(finish(g, k % 2 ? leaf : leaf2));
  }
  return mergeGeometries(L);
}

export function buildPostGeometry() {
  const L = [];
  box(L, 0.2, 1.4, 0.2, 0, 0.7, 0, 0xf4eefc);
  box(L, 0.22, 0.32, 0.22, 0, 1.25, 0, 0xff2e88, { e: 0.85 });
  return mergeGeometries(L);
}

export function buildBarrelGeometry() {
  const L = [];
  cyl(L, 0.55, 0.55, 1.25, 8, 0, 0.625, 0, 0xe0303a);
  cyl(L, 0.57, 0.57, 0.22, 8, 0, 0.75, 0, 0xffd23d, { e: 0.25 });
  cyl(L, 0.45, 0.45, 0.06, 8, 0, 1.27, 0, 0x501820);
  return mergeGeometries(L);
}

export function buildTireStackGeometry() {
  const L = [];
  for (let i = 0; i < 3; i++) {
    cyl(L, 0.8, 0.8, 0.38, 9, 0, 0.2 + i * 0.4, 0, i === 1 ? 0xf4eefc : 0x1d1726);
  }
  cyl(L, 0.45, 0.45, 0.05, 9, 0, 1.2, 0, 0x0c0a10);
  return mergeGeometries(L);
}

export function buildChevronGeometry(dir = 1) {
  const L = [];
  box(L, 0.16, 1.4, 0.16, -0.9, 0.7, 0, 0x3b3445);
  box(L, 0.16, 1.4, 0.16, 0.9, 0.7, 0, 0x3b3445);
  box(L, 2.8, 1.2, 0.14, 0, 1.9, 0, 0x16121c);
  for (let k = -1; k <= 1; k++) {
    const cx = k * 0.75 * dir;
    box(L, 0.18, 0.62, 0.05, cx - 0.1 * dir, 2.08, 0.09, 0xffe23d, { rz: 0.62 * dir, e: 0.6 });
    box(L, 0.18, 0.62, 0.05, cx - 0.1 * dir, 1.72, 0.09, 0xffe23d, { rz: -0.62 * dir, e: 0.6 });
  }
  return mergeGeometries(L);
}

export function buildMesaGeometry(seed = 3) {
  // hexagonal stack with strata colours
  const L = [];
  const cols = [0xc65a3e, 0xd9744a, 0xa94640, 0xe0905a, 0xb85044];
  let r = 1, y = 0;
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 5; i++) {
    const h = 0.16 + rnd() * 0.1;
    const r2 = r * (0.9 + rnd() * 0.06);
    cyl(L, r2, r, h, 7, 0, y + h / 2, 0, cols[i % cols.length]);
    y += h; r = r2;
  }
  cyl(L, r * 0.97, r, 0.05, 7, 0, y + 0.025, 0, 0xe6a060);
  return mergeGeometries(L);
}

export function buildCanisterGeometry() {
  const L = [];
  cyl(L, 0.45, 0.45, 1.1, 6, 0, 0, 0, 0x29f3ff, { e: 0.9 });
  cyl(L, 0.25, 0.3, 0.3, 6, 0, 0.7, 0, 0xffffff, { e: 0.6 });
  cyl(L, 0.48, 0.48, 0.14, 6, 0, -0.2, 0, 0x0d4a66, { e: 0.3 });
  return mergeGeometries(L);
}

export function buildRageGeometry() {
  const L = [];
  const g = new THREE.OctahedronGeometry(0.7, 0);
  g.scale(1, 1.25, 1);
  L.push(finish(g, 0xff2e88, 1));
  const ring = new THREE.TorusGeometry(1.0, 0.09, 4, 12);
  ring.rotateX(Math.PI / 2);
  L.push(finish(ring, 0xffe23d, 1));
  return mergeGeometries(L);
}
