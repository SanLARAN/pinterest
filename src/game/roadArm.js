// (5.0b) The arm across the highway: «то самое щупальце» — one of the things the forest only ever saw on the horizon
// (render/tentacles.js), lying across the road at the junction with the convoy round it. In chapter 1 it lies
// still for a long time, and then it does not.
//
// It is a thing in the world, not a picture on the sky: the world's own material (so the flashers, the floodlight
// and the sodium lamps are what show it, and an echo finds it like a tree), a tube of flesh with two rows of pale
// suckers along its underside. The tube is built once, straight, in its own frame (x along it, y/z round it) and
// bent every frame onto a spine: each vertex remembers where along the arm it is, at what angle round it and how
// far out, and is put back there on the spine's frame. The pose is a pure function of the film's time
// (armPose), so a seek, a skip or a second machine lands on the same arm.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { ARM_PATH, HIGHWAY } from '../world/swamp.js';

export const ARM = {
  seg: 64, // rings along it
  sides: 12, // ...and round it
  r0: 2.75, // the base's radius (m); it tapers to TIP at the end
  tip: 0.16,
};
const L0 = 100; // the straight tube's length while it is built (any number: only the fractions matter)

// its radius at s (0 base … 1 tip), before it breathes
export function armRadius(s) {
  return ARM.tip + (ARM.r0 - ARM.tip) * Math.pow(1 - clamp(s, 0, 1), 0.9);
}

// the rest line resampled by length: [{ x, z }] for s = i / seg
let _rest = null;
export function restLine() {
  if (_rest) return _rest;
  const P = ARM_PATH, cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = cum[cum.length - 1], out = [];
  for (let i = 0; i <= ARM.seg; i++) {
    const d = (i / ARM.seg) * total;
    let k = 1;
    while (k < P.length - 1 && cum[k] < d) k++;
    const f = (d - cum[k - 1]) / (cum[k] - cum[k - 1] || 1);
    out.push({ x: lerp(P[k - 1][0], P[k][0], f), z: lerp(P[k - 1][1], P[k][1], f) });
  }
  _rest = { pts: out, length: total };
  return _rest;
}

// where along the arm (s) it is nearest a point on the ground
export function armSAt(x, z) {
  const { pts } = restLine();
  let best = 0, bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - x, pts[i].z - z);
    if (d < bd) { bd = d; best = i; }
  }
  return best / ARM.seg;
}

const bell = (x, w) => Math.exp(-(x / w) * (x / w));

// The arm at film time t: positions (seg+1)×3, radii, and a roll (rad) per ring. `T` is the film's timeline:
//   twitch — a ripple runs under the skin, the tip flicks
//   lift   — the middle comes up off the road, leaning toward the convoy …
//   slam   — … and comes down on the lead police car
//   sweep  — it drags east along the road, through the ambulance, rolling as it goes (the suckers show)
//   tip    — the tip comes up out of the ditch, writhing, as tall as the lamps
//   truck  — and comes down on the lorry at the head of the queue
// ground(x, z): the height of the ground there
export function armPose(t, T, ground, out = null) {
  const n = ARM.seg + 1;
  const o = out || { pos: new Float32Array(n * 3), rad: new Float32Array(n), roll: new Float32Array(n) };
  const { pts } = restLine();
  const sRoad = T.sRoad ?? armSAt(HIGHWAY.block, HIGHWAY.z);
  const sCar = T.sCar ?? sRoad - 0.04;
  // the envelopes (0..1) of each beat
  const tw = t >= T.twitch && t < T.twitch + 1.6 ? (t - T.twitch) / 1.6 : -1;
  const wake = smoothstep(T.lift, T.lift + 0.5, t);
  const lift = t < T.slam - 0.32 ? smoothstep(T.lift, T.slam - 0.32, t) : 0;
  // the fall: from the top to the car in 0.32 s, accelerating; then a bounce, and it settles on what is left
  let H = 0;
  if (t >= T.lift && t < T.slam - 0.32) H = 9.5 * Math.pow(lift, 0.8);
  else if (t >= T.slam - 0.32 && t < T.slam) H = 9.5 * (1 - Math.pow((t - (T.slam - 0.32)) / 0.32, 2)) - 0.4 * smoothstep(T.slam - 0.06, T.slam, t);
  else if (t >= T.slam) H = -0.4 + 1.6 * Math.sin(clamp((t - T.slam) / 0.6, 0, 1) * Math.PI) * Math.exp(-(t - T.slam) * 1.4) + 0.9 * smoothstep(T.slam, T.slam + 1.2, t);
  // toward the convoy (east, +x) while it is up, and the drag after the blow
  const lean = t >= T.lift ? 13 * smoothstep(T.lift + 0.4, T.slam - 0.1, t) : 0;
  const drag = t >= T.sweep ? 9 * smoothstep(T.sweep, T.sweep + 1.8, t) : 0;
  const rollK = smoothstep(T.sweep - 0.2, T.sweep + 1.6, t);
  // the tip: up out of the ditch, writhing; then down on the lorry
  const tipUp = t >= T.tip ? smoothstep(T.tip, T.tip + 2.2, t) : 0;
  const tipDown = t >= T.truck - 0.35 ? smoothstep(T.truck - 0.35, T.truck, t) : 0;
  const alive = smoothstep(T.lift, T.lift + 3, t); // after the wake it never lies still again
  for (let i = 0; i < n; i++) {
    const s = i / ARM.seg;
    const p = pts[i];
    let x = p.x, z = p.z;
    const r = armRadius(s);
    let y = ground(x, z) + r * 0.82;
    if (s < 0.07) y -= ((0.07 - s) / 0.07) * 4.2; // the base goes into the earth
    // breathing: is it alive? barely
    let rr = r * (1 + 0.022 * Math.sin(t * 0.9 + s * 5));
    // the twitch: a bulge running down it, a flick at the end
    if (tw >= 0) {
      rr *= 1 + 0.34 * bell(s - lerp(0.22, 0.78, tw), 0.06) * Math.sin(tw * Math.PI);
      const flick = Math.sin(tw * Math.PI) * smoothstep(0.82, 1, s);
      x += 0.9 * flick * Math.sin(tw * 9);
      y += 0.5 * flick;
    }
    // the middle: up, over and down on the car, then dragged along the road
    const mid = bell(s - sCar, 0.13);
    y += H * mid;
    x += (lean + drag) * bell(s - sCar, 0.17);
    // once it is awake: a slow writhe along all of it (not at the buried base)
    const live = alive * smoothstep(0.08, 0.2, s);
    y += live * 0.55 * Math.sin(t * 1.7 - s * 9) * (1 - mid);
    x += live * 0.8 * Math.sin(t * 1.1 - s * 6 + 1.3);
    // the tip section: rises and lashes, as tall as the lamps
    const tipW = smoothstep(0.74, 1, s);
    if (tipUp > 0) {
      const up = tipUp * (1 - tipDown);
      y += up * 12 * tipW * tipW;
      x += up * 3.2 * Math.sin(t * 2.3 + s * 7) * tipW;
      z += up * (2.4 * Math.sin(t * 1.6 + s * 5) * tipW - 3 * tipW);
    }
    if (tipDown > 0) {
      // the last third swings over onto the lorry (x ≈ 0 in the north lane) and slams flat
      const k = tipDown * tipW;
      x = lerp(x, lerp(-14, 2, tipW), k);
      z = lerp(z, lerp(344, HIGHWAY.lane, tipW), k);
      y = lerp(y, ground(x, z) + rr * 0.7 + (1 - tipDown) * 10 * tipW, k);
    }
    o.pos[i * 3] = x;
    o.pos[i * 3 + 1] = y;
    o.pos[i * 3 + 2] = z;
    o.rad[i] = rr * (1 + 0.06 * wake * Math.sin(t * 7 + s * 23)); // awake, it ripples
    o.roll[i] = rollK * 1.7 * bell(s - sCar, 0.2) + live * 0.25 * Math.sin(t * 0.8 + s * 4);
  }
  return o;
}

// ---------------------------------------------------------------- the mesh

function buildTube() {
  const b = new MeshBuilder(12000);
  b.identity();
  const S = ARM.seg, N = ARM.sides;
  // a ridge every third ring and a lumpy hide between them: in a lamp's light (where the shader shows things in
  // their own colour and draws no edges) the light itself has to find the shape
  const relief = (i, j) => 1 + (i % 3 === 0 ? 0.075 : -0.02) + 0.045 * Math.sin(j * 2.1 + i * 1.3) * Math.sin(i * 0.7 + j);
  const ringPt = (i, j, rk = 1) => {
    const s = i / S, th = (j / N) * Math.PI * 2, r = armRadius(s) * rk * (rk === 1 ? relief(i, j % N) : 1);
    return [s * L0, Math.cos(th) * r, Math.sin(th) * r];
  };
  for (let i = 0; i < S; i++) {
    // a ridge every third ring is drawn: the arm reads as segmented flesh, not as a pipe
    const ridge = i % 3 === 0 ? 0 : 1;
    for (let j = 0; j < N; j++) {
      const a = ringPt(i, j), bb = ringPt(i, j + 1), c = ringPt(i + 1, j + 1), d = ringPt(i + 1, j);
      b.quad(a, bb, c, d, KIND.FLESH, ridge | 2 | 4 | 8);
    }
  }
  // the tip: a short cone past the last ring
  for (let j = 0; j < N; j++) {
    b.tri(ringPt(S, j), ringPt(S, j + 1), [L0 + 0.5, 0, 0], KIND.FLESH, 2 | 4);
  }
  // the suckers: two rows along the underside, from a fifth of the way out to the tip, each a pale raised rim
  // round a cup
  for (let i = Math.round(S * 0.2); i < S - 1; i += 1) {
    for (const side of [-1, 1]) {
      const s = (i + (side > 0 ? 0.5 : 0)) / S;
      const r = armRadius(s);
      const th = Math.PI + side * 0.62; // under it, a little to each side
      const size = r * 0.3;
      const ds = size / (L0 * 0.8), dth = size / r;
      const at = (u, v, rk) => {
        const ss = s + u * ds, tt = th + v * dth, rr = armRadius(ss) * rk;
        return [ss * L0, Math.cos(tt) * rr, Math.sin(tt) * rr];
      };
      const K = 7;
      for (let k = 0; k < K; k++) {
        const a0 = (k / K) * Math.PI * 2, a1 = ((k + 1) / K) * Math.PI * 2;
        const o0 = at(Math.cos(a0), Math.sin(a0), 1.05), o1 = at(Math.cos(a1), Math.sin(a1), 1.05);
        const i0 = at(Math.cos(a0) * 0.6, Math.sin(a0) * 0.6, 1.035), i1 = at(Math.cos(a1) * 0.6, Math.sin(a1) * 0.6, 1.035);
        const nrm = [0, Math.cos(th), Math.sin(th)];
        b.quadN(o0, o1, i1, i0, nrm, KIND.BONE, 2 | 8);
        b.triN(i0, i1, at(0, 0, 0.97), nrm, KIND.FLESH, 2 | 4);
      }
    }
  }
  return b;
}

// each vertex: where along the arm (s), the angle round it, how far out (×radius), how far past the tip
function skinParams(pos, count) {
  const S = new Float32Array(count), TH = new Float32Array(count), RK = new Float32Array(count), EX = new Float32Array(count);
  for (let v = 0; v < count; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let s = x / L0, ex = 0;
    if (s > 1) { ex = x - L0; s = 1; }
    S[v] = clamp(s, 0, 1);
    EX[v] = ex;
    const r = Math.hypot(y, z);
    TH[v] = Math.atan2(z, y);
    RK[v] = r / armRadius(S[v]);
  }
  return { S, TH, RK, EX };
}

const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

export class RoadArm {
  constructor(scene, material) {
    const b = buildTube();
    this.geo = b.toGeometry();
    this.count = b.count;
    this.skin = skinParams(this.geo.attributes.position.array, this.count);
    this.mesh = new THREE.Mesh(this.geo, material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.updateMatrix();
    scene.add(this.mesh);
    const n = ARM.seg + 1;
    this.pose = { pos: new Float32Array(n * 3), rad: new Float32Array(n), roll: new Float32Array(n) };
    // the spine's frame per ring: tangent, normal, binormal (parallel-transported from "up")
    this.T = new Float32Array(n * 3);
    this.N = new Float32Array(n * 3);
    this.B = new Float32Array(n * 3);
  }

  // put the arm where it is at film time t
  update(t, T, ground) {
    armPose(t, T, ground, this.pose);
    this._frames();
    this._skin();
  }

  _frames() {
    const n = ARM.seg + 1, P = this.pose.pos, T = this.T, N = this.N, B = this.B;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), c = Math.min(n - 1, i + 1);
      _t.set(P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]).normalize();
      if (i === 0) _n.copy(_up);
      else _n.set(N[(i - 1) * 3], N[(i - 1) * 3 + 1], N[(i - 1) * 3 + 2]);
      _n.addScaledVector(_t, -_n.dot(_t));
      if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0).addScaledVector(_t, -_t.x);
      _n.normalize();
      _b.crossVectors(_t, _n);
      T[i * 3] = _t.x; T[i * 3 + 1] = _t.y; T[i * 3 + 2] = _t.z;
      N[i * 3] = _n.x; N[i * 3 + 1] = _n.y; N[i * 3 + 2] = _n.z;
      B[i * 3] = _b.x; B[i * 3 + 1] = _b.y; B[i * 3 + 2] = _b.z;
    }
  }

  _skin() {
    const { S, TH, RK, EX } = this.skin;
    const P = this.pose.pos, R = this.pose.rad, RL = this.pose.roll, T = this.T, N = this.N, B = this.B;
    const out = this.geo.attributes.position.array;
    const seg = ARM.seg;
    for (let v = 0; v < this.count; v++) {
      const u = S[v] * seg;
      const i = Math.min(seg - 1, Math.floor(u)), f = u - i, j = i + 1;
      const lp = (A, k) => A[i * 3 + k] + (A[j * 3 + k] - A[i * 3 + k]) * f;
      const r = (R[i] + (R[j] - R[i]) * f) * RK[v];
      const th = TH[v] + RL[i] + (RL[j] - RL[i]) * f;
      const c = Math.cos(th), s = Math.sin(th), ex = EX[v];
      for (let k = 0; k < 3; k++) out[v * 3 + k] = lp(P, k) + lp(T, k) * ex + (lp(N, k) * c + lp(B, k) * s) * r;
    }
    this.geo.attributes.position.needsUpdate = true;
  }

  // a point on the arm's spine (s 0..1), for the film's lights, shakes and camera
  at(s, out = new THREE.Vector3()) {
    const u = clamp(s, 0, 1) * ARM.seg, i = Math.min(ARM.seg - 1, Math.floor(u)), f = u - i, P = this.pose.pos;
    return out.set(lerp(P[i * 3], P[i * 3 + 3], f), lerp(P[i * 3 + 1], P[i * 3 + 4], f), lerp(P[i * 3 + 2], P[i * 3 + 5], f));
  }

  dispose() {
    this.mesh.removeFromParent();
    this.geo.dispose();
  }
}
