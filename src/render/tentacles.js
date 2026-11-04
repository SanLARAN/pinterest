// (4.0) Out past the edge of the map, now and then, at night: something enormous comes up out of the ground on the
// horizon — three, four, five arms as tall as the hills, writhing against a sky gone a dull red — and then they
// fall, and the ground carries the crash to you a couple of seconds after you saw it. Nothing in the forest is
// touched; it is far too far. It is just there, and it is big, and it is waking up.
// Drawn like the sky: the whole thing follows your eyes and sits at the far plane, so every tree, hill and wall in
// the forest stands in front of it. One event is a seed — the host picks it and sends it ('tn'), so a room sees
// the same arms at the same moment. The arms are tubes bent on the CPU every frame (~1.2k vertices in all).
import * as THREE from 'three';
import { RNG, smoothstep } from '../core/rng.js';

const SEG = 22, SIDES = 7;
export const TENT = {
  dist: 118, // where it is drawn (m, in the eyes' frame — it reads as a few hundred metres off, beyond the hills)
  depth: 20, // the base sits this far under eye level: the hills and the trees hide where it comes out
  far: 640, // how far it "really" is: the crash comes that many metres / 343 m/s after you see it
  rise: 3.4, // s: out of the ground
  writhe: [8, 12], // s: up there
  fall: 2.6, // s: going over
  sink: 7, // s: back down into the ground
};

// everything about one event, from its seed (the same on every machine)
export function tentaclePlan(seed) {
  const r = new RNG((seed >>> 0) || 1);
  const az = r.float(0, Math.PI * 2);
  const n = r.int(3, 5);
  const arms = [];
  for (let i = 0; i < n; i++) {
    arms.push({
      off: (i - (n - 1) / 2) * r.float(0.07, 0.12) + r.float(-0.03, 0.03), // spread across the horizon (rad)
      len: r.float(58, 88),
      r0: r.float(4.4, 6.6),
      delay: i * r.float(0.35, 0.9) + r.float(0, 0.4),
      writhe: r.float(TENT.writhe[0], TENT.writhe[1]),
      curl: r.float(0.9, 1.8) * (r.chance(0.5) ? 1 : -1),
      freq: r.float(0.5, 0.9),
      phase: r.float(0, 6.283),
      lean: r.float(-0.18, 0.18),
      side: r.chance(0.5) ? 1 : -1, // which way it falls
      dist: TENT.dist + r.float(-4, 6),
    });
  }
  const end = Math.max(...arms.map((a) => a.delay + TENT.rise + a.writhe + TENT.fall + TENT.sink));
  return { seed: seed >>> 0, az, arms, end };
}

// where an arm is in its life at time t (s since the start): 'rise' | 'writhe' | 'fall' | 'sink' | 'gone', k 0..1
export function armPhase(a, t) {
  let u = t - a.delay;
  if (u < 0) return { ph: 'wait', k: 0 };
  if (u < TENT.rise) return { ph: 'rise', k: u / TENT.rise };
  u -= TENT.rise;
  if (u < a.writhe) return { ph: 'writhe', k: u / a.writhe };
  u -= a.writhe;
  if (u < TENT.fall) return { ph: 'fall', k: u / TENT.fall };
  u -= TENT.fall;
  if (u < TENT.sink) return { ph: 'sink', k: u / TENT.sink };
  return { ph: 'gone', k: 1 };
}

const VERT = /* glsl */ `
attribute float aS;
varying float vS;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vS = aS;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  vec4 cp = projectionMatrix * viewMatrix * wp;
  cp.z = cp.w * 0.999995; // at the far plane: behind everything in the forest
  gl_Position = cp;
}`;
const FRAG = /* glsl */ `
uniform float uGlow;
uniform float uTime;
varying float vS;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  // a dark shape against the red behind it: its edges catch that light (wide — the arm is a few pixels across
  // from here, and a thin rim would be thinner than one), the wet ridges glint as they crawl up it
  float rim = pow(f, 1.25);
  float ridge = 0.5 + 0.5 * sin(vS * 90.0 - uTime * 2.3);
  vec3 flesh = vec3(0.05, 0.011, 0.015) * (0.7 + 0.6 * ridge);
  vec3 col = flesh + vec3(0.75, 0.085, 0.06) * rim * (0.3 + 0.7 * uGlow) + vec3(0.22, 0.02, 0.02) * ridge * rim * uGlow;
  col *= smoothstep(-0.05, 0.3, vS); // the base goes into the dark (and the dust)
  gl_FragColor = vec4(col, 0.05); // (alpha: the post keeps its colour — see post.js ashK)
}`;
// the sky behind them goes a dull red while they're up (and the dust at their roots)
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 cp = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  cp.z = cp.w * 0.999996;
  gl_Position = cp;
}`;
const GLOW_FRAG = /* glsl */ `
uniform float uGlow;
uniform float uTime;
varying vec2 vUv;
void main() {
  // brightest on the horizon behind them, climbing up the sky about as high as they reach
  vec2 c = vUv - vec2(0.5, 0.3);
  float g = exp(-c.x * c.x * 8.0 - c.y * c.y * (c.y > 0.0 ? 5.0 : 40.0)) * uGlow;
  g *= 0.85 + 0.15 * sin(uTime * 1.7 + vUv.x * 9.0) * sin(uTime * 0.6);
  gl_FragColor = vec4(vec3(0.3, 0.045, 0.028) * g, 0.0);
}`;

export class Tentacles {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.group.frustumCulled = false;
    scene.add(this.group);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uGlow: { value: 0 }, uTime: { value: 0 } },
      vertexShader: VERT, fragmentShader: FRAG, depthWrite: false, depthFunc: THREE.LessEqualDepth,
    });
    this.glowMat = new THREE.ShaderMaterial({
      uniforms: { uGlow: this.mat.uniforms.uGlow, uTime: this.mat.uniforms.uTime },
      vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, depthWrite: false, transparent: true,
      // added as it is (three's additive blend would scale it by the alpha), and the scene's alpha left alone
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(260, 120), this.glowMat);
    this.glow.frustumCulled = false;
    this.glow.renderOrder = -9; // (just after the sky)
    this.group.add(this.glow);
    this.arms = [];
    this.plan = null;
    this.t = 0;
    this.events = []; // what the game should hear: { type: 'rise' | 'impact', arm, at } (drained by take())
  }

  get active() { return !!this.plan; }

  // a new event (seed from the host); its azimuth and arms all come from the seed
  start(seed) {
    this.stop();
    const plan = tentaclePlan(seed);
    this.plan = plan;
    this.t = 0;
    for (const a of plan.arms) {
      const ring = SIDES, verts = (SEG + 1) * ring + 1;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
      const s = new Float32Array(verts);
      for (let i = 0; i <= SEG; i++) for (let j = 0; j < ring; j++) s[i * ring + j] = i / SEG;
      s[verts - 1] = 1;
      geo.setAttribute('aS', new THREE.BufferAttribute(s, 1));
      const idx = [];
      for (let i = 0; i < SEG; i++) {
        for (let j = 0; j < ring; j++) {
          const a0 = i * ring + j, a1 = i * ring + ((j + 1) % ring), b0 = a0 + ring, b1 = a1 + ring;
          idx.push(a0, b0, a1, a1, b0, b1);
        }
      }
      const tip = verts - 1, last = SEG * ring;
      for (let j = 0; j < ring; j++) idx.push(last + j, tip, last + ((j + 1) % ring));
      geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, this.mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = 5;
      this.group.add(mesh);
      this.arms.push({ a, mesh, ph: 'wait', hit: false, rose: false });
    }
    this.group.visible = true;
    // (in the group's own frame, which follows the eyes: the plane faces back at them from behind the arms)
    const az = plan.az;
    this.glow.position.set(Math.sin(az) * (TENT.dist + 14), 4, Math.cos(az) * (TENT.dist + 14));
    this.glow.rotation.set(0, az + Math.PI, 0);
    return plan;
  }

  stop() {
    for (const A of this.arms) {
      this.group.remove(A.mesh);
      A.mesh.geometry.dispose();
    }
    this.arms = [];
    this.plan = null;
    this.group.visible = false;
    this.mat.uniforms.uGlow.value = 0;
  }

  // what happened since the last call (the game turns these into sound, a shake, a line in the timeline)
  take() {
    const e = this.events;
    this.events = [];
    return e;
  }

  update(dt, eye, time) {
    if (!this.plan) return;
    this.t += dt;
    const P = this.plan, t = this.t;
    this.group.position.copy(eye);
    this.mat.uniforms.uTime.value = time;
    let glow = 0;
    for (const A of this.arms) {
      const { ph, k } = armPhase(A.a, t);
      if (ph !== 'wait' && !A.rose) { A.rose = true; this.events.push({ type: 'rise', arm: A.a, az: P.az + A.a.off }); }
      if ((ph === 'sink' || ph === 'gone') && !A.hit) { A.hit = true; this.events.push({ type: 'impact', arm: A.a, az: P.az + A.a.off }); }
      A.ph = ph;
      A.mesh.visible = ph !== 'wait' && ph !== 'gone';
      const up = ph === 'rise' ? smoothstep(0, 1, k) : ph === 'wait' ? 0 : 1;
      glow = Math.max(glow, ph === 'rise' ? k : ph === 'writhe' ? 1 : ph === 'fall' ? 1 : ph === 'sink' ? 1 - k : 0);
      if (A.mesh.visible) this._bend(A, ph, k, up, t);
    }
    this.mat.uniforms.uGlow.value = glow;
    if (t > P.end) this.stop();
  }

  // the spine: out of the ground and up, curling at the tip, waving; then over (gravity), then down into the earth
  _bend(A, ph, k, up, t) {
    const a = A.a, az = this.plan.az + a.off;
    const pos = A.mesh.geometry.attributes.position.array, nor = A.mesh.geometry.attributes.normal.array;
    const fx = Math.sin(az), fz = Math.cos(az); // away from you
    const rx = Math.cos(az), rz = -Math.sin(az); // across the horizon
    const L = a.len * (ph === 'rise' ? 0.15 + 0.85 * up : 1);
    // the whole arm tips over as it falls (from upright to past flat) and sinks after
    const over = ph === 'fall' ? Math.pow(k, 1.8) * 1.75 : ph === 'sink' ? 1.75 : 0;
    const sink = ph === 'sink' ? smoothstep(0, 1, k) * (a.len * 0.6) : 0;
    const rise = ph === 'rise' ? (1 - up) * 12 : 0;
    let x = 0, y = -TENT.depth - rise - sink, z = 0;
    let ang = a.lean + over * a.side; // from the vertical, across the horizon (+ toward rx)
    const step = L / SEG;
    const calm = ph === 'fall' ? 1 - k : ph === 'sink' ? 0 : 1;
    const ring = SIDES, bx = fx * a.dist, bz = fz * a.dist;
    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const s = i / SEG;
      pts.push([x, y, z, ang]);
      // the writhe: a wave that runs up the arm, stronger toward the tip, and a curl at the end
      const wave = Math.sin(t * a.freq * 2.2 + a.phase - s * 5.5) * 0.11 * s * calm;
      const curl = a.curl * Math.pow(s, 3) * 0.32 * (0.6 + 0.4 * Math.sin(t * a.freq + a.phase)) * calm;
      ang += wave + curl / SEG * 3;
      const lean2 = Math.sin(t * a.freq * 1.3 + a.phase * 2 + s * 3) * 0.05 * s * calm; // a little toward / away
      x += Math.sin(ang) * step;
      y += Math.cos(ang) * step;
      z += lean2 * step;
    }
    for (let i = 0; i <= SEG; i++) {
      const [px, py, pz, an] = pts[i], s = i / SEG;
      const rad = a.r0 * Math.pow(1 - s, 0.85) * (1 + 0.08 * Math.sin(s * 30 + t * 2)) + 0.25;
      // the frame: along the arm (in the plane across the horizon), and two directions round it
      const tx = Math.sin(an), ty = Math.cos(an); // tangent in (across, up)
      for (let j = 0; j < ring; j++) {
        const th = (j / ring) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        // normal = c * (perpendicular in the plane) + sn * (toward/away)
        const nA = c * ty, nU = -c * tx, nF = sn;
        const wx = bx + rx * (px + nA * rad) + fx * (pz + nF * rad);
        const wy = py + nU * rad;
        const wz = bz + rz * (px + nA * rad) + fz * (pz + nF * rad);
        const o = (i * ring + j) * 3;
        pos[o] = wx; pos[o + 1] = wy; pos[o + 2] = wz;
        nor[o] = rx * nA + fx * nF; nor[o + 1] = nU; nor[o + 2] = rz * nA + fz * nF;
      }
    }
    const [qx, qy, qz, qa] = pts[SEG], o = (SEG + 1) * ring * 3;
    pos[o] = bx + rx * (qx + Math.sin(qa) * 0.6) + fx * qz;
    pos[o + 1] = qy + Math.cos(qa) * 0.6;
    pos[o + 2] = bz + rz * (qx + Math.sin(qa) * 0.6) + fz * qz;
    nor[o] = rx * Math.sin(qa); nor[o + 1] = Math.cos(qa); nor[o + 2] = rz * Math.sin(qa);
    A.mesh.geometry.attributes.position.needsUpdate = true;
    A.mesh.geometry.attributes.normal.needsUpdate = true;
  }

  dispose() {
    this.stop();
    this.scene.remove(this.group);
    this.glow.geometry.dispose();
  }
}

// is a bearing (rad, world) within the view? (for the timeline / the first-sighting hint)
export function bearingVisible(az, camYaw, halfFov = 0.75) {
  // forward is (-sin yaw, -cos yaw); the arms stand at (sin az, cos az)
  const fwd = Math.atan2(-Math.sin(camYaw), -Math.cos(camYaw));
  let d = az - fwd;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  return Math.abs(d) < halfFov;
}
