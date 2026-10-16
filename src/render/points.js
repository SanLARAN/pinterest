// ============================================================
// POINTS — the echolocation point cloud. This is what you actually "see":
// tens of thousands of dots that flare as a wavefront passes over them.
// ============================================================
import * as THREE from 'three';
import { MAX_WAVES, MAX_DAMP } from './echo.js';
import { clamp, TAU } from '../core/util.js';
import { TREE } from '../sim/world.js';

const VERT = /* glsl */`
attribute vec3 aCol;
attribute float aSize;
attribute float aSeed;
uniform vec4 uWaves[${MAX_WAVES}];
uniform float uWaveStr[${MAX_WAVES}];
uniform vec3 uWaveCol[${MAX_WAVES}];
uniform vec4 uDamp[${MAX_DAMP}];
uniform float uWidth, uGain, uTime, uReveal, uPix, uPersonal;
uniform vec3 uCam;
varying float vI;
varying vec3 vCol;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float dampF = 1.0;
  for (int j = 0; j < ${MAX_DAMP}; j++) {
    if (uDamp[j].w > 0.001) {
      float dd = distance(wp.xyz, uDamp[j].xyz);
      dampF *= 1.0 - 0.985 * smoothstep(uDamp[j].w, uDamp[j].w * 0.18, dd);
    }
  }
  float echo = 0.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    float rad = uWaves[i].w;
    if (rad <= 0.001) continue;
    float s = uWaveStr[i];
    if (s <= 0.001) continue;
    float d = distance(wp.xyz, uWaves[i].xyz);
    float band = exp(-pow((d - rad) / max(uWidth * 0.85, 0.15), 2.0));
    float inside = smoothstep(rad, rad - uWidth * 6.5, d) * 0.16;
    float a = (band * 1.25 + inside) * s;
    echo += a;
    col += uWaveCol[i] * a;
  }
  echo *= dampF * uGain;
  col *= dampF;
  // you always feel the ground right under your feet
  float near = 1.0 - smoothstep(1.2, 6.5, distance(wp.xyz, uCam));
  echo += near * uPersonal * (1.0 - uReveal * 0.85);
  col += vec3(0.42, 0.85, 0.74) * near * uPersonal * (1.0 - uReveal * 0.85);
  // daylight: faint dust motes dancing
  float day = uReveal * (0.10 + 0.10 * sin(uTime * 1.9 + aSeed * 41.0));
  echo += day; col += vec3(1.0, 0.95, 0.8) * day;
  echo *= 0.55 + 0.45 * sin(aSeed * 91.7 + uTime * 0.6);
  vI = echo;
  vCol = (col + aCol * echo * 0.85) * aCol;
  vec4 mv = viewMatrix * wp;
  float dist = max(-mv.z, 0.6);
  gl_PointSize = aSize * uPix * (1.0 + echo * 2.6) * (150.0 / dist);
  gl_Position = projectionMatrix * mv;
  if (echo < 0.014 || dist > 210.0) gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
}
`;

const FRAG = /* glsl */`
varying float vI;
varying vec3 vCol;
void main(){
  if (vI < 0.014) discard;
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float a = smoothstep(0.25, 0.02, d);
  float core = smoothstep(0.06, 0.0, d);
  vec3 rgb = vCol * (1.0 + core * 1.7) * min(vI, 1.6);
  gl_FragColor = vec4(rgb * a, a * clamp(vI, 0.0, 1.0));
}
`;

const TINT = {
  ground: new THREE.Color(0.42, 1.0, 0.82),
  grass: new THREE.Color(0.55, 1.0, 0.55),
  foliage: new THREE.Color(0.5, 1.0, 0.72),
  wood: new THREE.Color(0.85, 0.78, 0.6),
  stone: new THREE.Color(0.85, 0.95, 1.0),
  metal: new THREE.Color(1.0, 0.85, 0.5),
  bone: new THREE.Color(1.0, 0.98, 0.9),
  water: new THREE.Color(0.35, 0.8, 1.0),
};

/** Build the static scatter cloud for a world. */
export function buildPointCloud(world, U, quality = 'high') {
  const pos = [], col = [], size = [], seedArr = [];
  let s = 1;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const add = (x, y, z, tint, sz) => {
    pos.push(x, y, z);
    col.push(tint.r, tint.g, tint.b);
    size.push(sz * (0.7 + rnd() * 0.7));
    seedArr.push(rnd());
  };

  const dense = quality === 'high';
  // ---- ground ----
  const cell = dense ? 3.1 : 4.6;
  const R = world.half * 1.02;
  for (let x = -R; x <= R; x += cell) {
    for (let z = -R; z <= R; z += cell) {
      const d = Math.hypot(x, z);
      if (d > R) continue;
      const jx = x + (rnd() - 0.5) * cell, jz = z + (rnd() - 0.5) * cell;
      const h = world.heightAt(jx, jz);
      const dc = Math.hypot(jx, jz);
      if (dc > world.half * 0.86 && rnd() > 0.55) continue;         // thin out the far rim
      if (dc < world.half * 0.5 && rnd() > 0.72) continue;          // and the near middle
      const underwater = world.isWater(jx, jz);
      if (underwater) {
        if (rnd() > 0.3) continue;
        add(jx, world.lakeLevel + 0.02, jz, TINT.water, 1.5);
      } else {
        const slope = world.slopeAt(jx, jz);
        add(jx, h + 0.05, jz, slope > 0.42 ? TINT.stone : rnd() > 0.55 ? TINT.grass : TINT.ground, slope > 0.42 ? 1.5 : 1.15);
      }
    }
  }

  // ---- trees ----
  const T = world.trees.data;
  for (let i = 0; i < world.trees.count; i++) {
    if (!dense && (i & 1)) continue;
    const o = i * 6;
    const x = T[o], z = T[o + 1], y = T[o + 2], sc = T[o + 3], rot = T[o + 4], type = T[o + 5];
    const trunkH = sc * (type === TREE.BIRCH ? 0.72 : 0.5);
    const steps = type === TREE.DEAD ? 4 : 3;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const a = rot + t * 5.1;
      const rr = (type === TREE.BIRCH ? 0.16 : 0.3) * (1 - t * 0.55);
      add(x + Math.cos(a) * rr, y + trunkH * t, z + Math.sin(a) * rr, TINT.wood, type === TREE.BIRCH ? 1.5 : 1.3);
    }
    if (type === TREE.DEAD) {
      for (let b = 0; b < 4; b++) {
        const a = rot + b * 1.7;
        const hh = trunkH * (0.6 + b * 0.1);
        for (let k = 1; k <= 3; k++) {
          const t = k / 3;
          add(x + Math.cos(a) * t * sc * 0.28, y + hh + t * sc * 0.12, z + Math.sin(a) * t * sc * 0.28, TINT.wood, 1.35);
        }
      }
    } else if (type === TREE.PINE || type === TREE.SPRUCE) {
      const layers = type === TREE.PINE ? 4 : 3;
      for (let l = 0; l < layers; l++) {
        const t = l / layers;
        const cy = y + trunkH * (0.55 + t * 0.62);
        const cr = sc * (type === TREE.PINE ? 0.30 : 0.26) * (1 - t * 0.72);
        const pts = dense ? 6 : 4;
        for (let p = 0; p < pts; p++) {
          const a = rot + (p / pts) * TAU + t;
          add(x + Math.cos(a) * cr, cy + (rnd() - 0.5) * 0.4, z + Math.sin(a) * cr, TINT.foliage, 1.7);
        }
        add(x, cy + cr * 0.5, z, TINT.foliage, 1.5);
      }
    } else {
      const cy = y + trunkH * 1.05;
      const cr = sc * 0.3;
      const pts = dense ? 9 : 6;
      for (let p = 0; p < pts; p++) {
        const a = (p / pts) * TAU + rot;
        const rr = cr * (0.6 + rnd() * 0.6);
        add(x + Math.cos(a) * rr, cy + (rnd() - 0.5) * cr * 0.8, z + Math.sin(a) * rr, TINT.foliage, 1.7);
      }
    }
  }

  // ---- rocks / bushes / logs ----
  for (let i = 0; i < world.rocks.count; i++) {
    const o = i * 6, x = world.rocks.data[o], z = world.rocks.data[o + 1], y = world.rocks.data[o + 2], sc = world.rocks.data[o + 3];
    const n = clamp(Math.round(sc * 2.2), 2, 8);
    for (let k = 0; k < n; k++) {
      const a = rnd() * TAU, r = sc * (0.4 + rnd() * 0.55);
      add(x + Math.cos(a) * r, y + rnd() * sc * 0.8, z + Math.sin(a) * r, TINT.stone, 1.4);
    }
  }
  for (let i = 0; i < world.bushes.count; i++) {
    if (!dense && (i % 3)) continue;
    const o = i * 5, x = world.bushes.data[o], z = world.bushes.data[o + 1], y = world.bushes.data[o + 2], sc = world.bushes.data[o + 3];
    for (let k = 0; k < 3; k++) {
      const a = rnd() * TAU;
      add(x + Math.cos(a) * sc * 0.5, y + rnd() * sc * 0.8, z + Math.sin(a) * sc * 0.5, TINT.grass, 1.2);
    }
  }
  for (let i = 0; i < world.logs.count; i++) {
    const o = i * 6, x = world.logs.data[o], z = world.logs.data[o + 1], y = world.logs.data[o + 2], len = world.logs.data[o + 3], rot = world.logs.data[o + 4];
    for (let k = 0; k <= 4; k++) {
      const t = (k / 4 - 0.5) * len;
      add(x + Math.cos(rot) * t, y + 0.2, z - Math.sin(rot) * t, TINT.wood, 1.4);
    }
  }

  // ---- props: generators, corpses, landmarks ----
  const boxPts = (cx, cy, cz, w, h, d, rot, tint, n) => {
    for (let k = 0; k < n; k++) {
      const e = k % 12;
      const sx = (e < 4 ? 1 : e < 8 ? -1 : (rnd() * 2 - 1)) * w * 0.5;
      const sy = (e < 4 ? 1 : e >= 8 ? -1 : (rnd() * 2 - 1)) * h * 0.5;
      const sz = (e < 4 || e >= 8 ? (rnd() * 2 - 1) : (e < 8 ? 1 : -1)) * d * 0.5;
      const c = Math.cos(rot), s2 = Math.sin(rot);
      add(cx + sx * c - sz * s2, cy + sy, cz + sx * s2 + sz * c, tint, 1.6);
    }
  };
  for (const g of world.gens) {
    boxPts(g.x, g.y + 1.05, g.z, 2.1, 2.0, 1.5, g.rot, TINT.metal, 34);
    boxPts(g.x, g.y + 3.4, g.z, 0.28, 2.6, 0.28, 0, TINT.metal, 10);      // lamp post
    for (let k = 0; k < 16; k++) {                                          // fence ring
      const a = (k / 16) * TAU;
      add(g.x + Math.cos(a) * 5.2, g.y + 0.85, g.z + Math.sin(a) * 5.2, TINT.wood, 1.3);
      add(g.x + Math.cos(a) * 5.2, g.y + 0.25, g.z + Math.sin(a) * 5.2, TINT.wood, 1.3);
    }
  }
  for (const c of world.corpses) {
    for (let k = 0; k < 16; k++) {
      const t = k / 16;
      const a = c.rot;
      add(c.x + Math.cos(a) * (t - 0.5) * 1.8, c.y + 0.28 + Math.sin(t * 6) * 0.08, c.z - Math.sin(a) * (t - 0.5) * 1.8, TINT.bone, 1.35);
    }
    add(c.x + Math.cos(c.rot) * 1.05, c.y + 0.4, c.z - Math.sin(c.rot) * 1.05, TINT.bone, 1.6);
  }
  for (const lm of world.landmarks) {
    if (lm.kind === 'mast') { for (let k = 0; k <= 26; k++) { const t = k / 26; add(lm.x + Math.cos(t * 9) * (1 - t) * 1.1, lm.y + t * lm.h, lm.z + Math.sin(t * 9) * (1 - t) * 1.1, TINT.metal, 1.6); } }
    else if (lm.kind === 'cabin') boxPts(lm.x, lm.y + 1.5, lm.z, 6.4, 3.0, 5.2, lm.rot, TINT.wood, 46);
    else if (lm.kind === 'circle') for (const st of lm.stones) for (let k = 0; k < 7; k++) add(st.x + (rnd() - 0.5) * st.s, st.y + rnd() * st.h, st.z + (rnd() - 0.5) * st.s, TINT.stone, 1.55);
    else if (lm.kind === 'tent') boxPts(lm.x, lm.y + 0.8, lm.z, 2.4, 1.6, 2.4, lm.rot, TINT.wood, 20);
    else if (lm.kind === 'fire') for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; add(lm.x + Math.cos(a) * 1.1, lm.y + 0.16, lm.z + Math.sin(a) * 1.1, TINT.stone, 1.3); }
  }

  // ---- the rim: a wall of echoes so you know where the world ends ----
  for (let k = 0; k < (dense ? 2600 : 1300); k++) {
    const a = rnd() * TAU;
    const r = world.half * (0.93 + rnd() * 0.14);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = world.heightAt(x, z);
    add(x, h + rnd() * 22, z, TINT.wood, 1.7);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seedArr, 1));
  geo.computeBoundingSphere();
  geo.boundingSphere.radius = world.half * 2.4;
  geo.boundingSphere.center.set(0, 0, 0);

  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, U, {
      uPix: { value: 1 },
      uPersonal: { value: 0.30 },
    }),
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });
  // share the live uniform objects with the rest of the scene
  for (const k of Object.keys(U)) mat.uniforms[k] = U[k];
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 4;
  return { points: pts, mat, count: pos.length / 3 };
}

// ---------------- dynamic auras (monsters, teammates) ----------------
const AURA_VERT = /* glsl */`
attribute vec3 aCol;
attribute float aSize;
uniform float uPix, uTime;
varying vec3 vCol;
varying float vA;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec4 mv = viewMatrix * wp;
  float dist = max(-mv.z, 0.6);
  gl_PointSize = aSize * uPix * (190.0 / dist);
  gl_Position = projectionMatrix * mv;
  vCol = aCol;
  vA = 1.0;
  if (aSize <= 0.001) gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
}
`;
const AURA_FRAG = /* glsl */`
varying vec3 vCol;
varying float vA;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float a = smoothstep(0.25, 0.0, d);
  gl_FragColor = vec4(vCol * a * 1.9, a * vA);
}
`;

export class Auras {
  constructor(max = 900) {
    this.max = max;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setDrawRange(0, max);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uPix: { value: 1 }, uTime: { value: 0 } },
      vertexShader: AURA_VERT, fragmentShader: AURA_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.geo = geo;
    this.n = 0;
  }
  reset() { this.n = 0; }
  push(x, y, z, r, g, b, size) {
    if (this.n >= this.max) return;
    const i = this.n * 3;
    this.pos[i] = x; this.pos[i + 1] = y; this.pos[i + 2] = z;
    this.col[i] = r; this.col[i + 1] = g; this.col[i + 2] = b;
    this.size[this.n] = size;
    this.n++;
  }
  flush() {
    for (let i = this.n; i < this.max; i++) this.size[i] = 0;
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aCol.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
  }
}

/** Scatter a humanoid point silhouette for a monster. */
export function monsterAura(auras, m, t, player) {
  const D = m.def;
  const hunting = m.state === 'hunt' || m.state === 'lunge';
  const d = Math.hypot(player.x - m.x, player.z - m.z);
  const near = clamp(1 - d / 46, 0, 1);
  let r = 0.32, g = 0.36, b = 0.36;
  if (hunting) { r = 1.0; g = 0.12 + 0.1 * Math.sin(t * 9); b = 0.18; }
  else if (m.state === 'investigate' || m.state === 'search') { r = 0.85; g = 0.42; b = 0.2; }
  const inten = clamp(0.14 + near * 0.75 + (hunting ? 0.35 : 0), 0, 1.4);
  const h = D.height * (m.state === 'spawn' ? clamp(m.spawnT / 1.7, 0, 1) : 1);
  const sway = Math.sin(m.anim * 2.2) * 0.12;
  const ca = Math.cos(m.yaw), sa = Math.sin(m.yaw);
  const P = (lx, ly, lz, s) => {
    auras.push(m.x + lx * ca - lz * sa, m.y + ly, m.z + lx * sa + lz * ca, r * inten, g * inten, b * inten, s);
  };
  if (m.type === 'tall') {
    for (let k = 0; k < 16; k++) { const y = (k / 16) * h; P(Math.sin(k * 1.3 + sway) * 0.3, y, Math.cos(k * 1.7) * 0.3, 2.1); }
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; P(Math.cos(a) * (2.4 + sway), h * 0.62, Math.sin(a) * 2.4, 1.7); }   // long arms
    P(0, h * 0.98, 0, 2.4); P(-0.45, h * 0.95, 0.2, 1.8); P(0.45, h * 0.95, 0.2, 1.8);
    P(0, h * 1.06, 0.1, 3.0);
  } else if (m.type === 'weeper') {
    for (let k = 0; k < 12; k++) { const y = (k / 12) * h; P(Math.sin(k * 1.1 + sway * 3) * 0.35, y, Math.cos(k * 1.4) * 0.28, 1.9); }
    for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + t * (m.wailT > 0.2 ? 3.2 : 0.6); const rr = 0.9 + m.wailT * 2.6; P(Math.cos(a) * rr, h * 0.86, Math.sin(a) * rr, 1.6); }
    P(0, h * 1.02, 0, 2.6);
  } else {
    for (let k = 0; k < 11; k++) { const y = (k / 11) * h; P(Math.sin(k * 1.2 + sway * 2) * 0.26, y, Math.cos(k * 1.5) * 0.22, 1.7); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; P(Math.cos(a) * 0.55, h * 0.96, Math.sin(a) * 0.55, 1.5); }
    P(0, h * 1.03, 0, 2.3);
    P(-0.2, h * 1.0, 0.28, 1.9); P(0.2, h * 1.0, 0.28, 1.9);      // eye sockets
    const leg = Math.sin(m.anim * 3.1) * 0.4;
    P(-0.22 + leg * 0.3, h * 0.22, leg, 1.4); P(0.22 - leg * 0.3, h * 0.22, -leg, 1.4);
  }
}

export function playerAura(auras, p, t) {
  const inten = 0.9;
  for (let k = 0; k < 10; k++) {
    const y = (k / 10) * 1.8 + 0.1;
    const a = k * 1.7 + t * 1.4;
    auras.push(p.x + Math.cos(a) * 0.24, p.y + y, p.z + Math.sin(a) * 0.24, 0.35 * inten, 0.95 * inten, 1.0 * inten, 1.9);
  }
  auras.push(p.x, p.y + 1.95, p.z, 0.5, 1.0, 1.0, 2.6);
}
