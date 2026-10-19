// Eye glints: pairs of tiny burning points in the dark. Real monsters glint when they are
// facing you; the forest also shows you eyes that belong to nothing at all.
// Depth-tested (trees hide them), additive, never write depth.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aI;
attribute float aSize;
uniform float uPix;
varying vec3 vColor;
varying float vI;
void main() {
  vColor = aColor;
  vI = aI;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPix / max(-mv.z, 0.3), 5.5, 24.0);
  if (aI < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;
const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vI;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  c.y *= 1.7; // a narrow, squinting slit
  float d = length(c);
  float core = smoothstep(0.3, 0.05, d);
  float halo = smoothstep(0.5, 0.0, d);
  float a = core * 4.0 + halo * halo * 0.6;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a * vI, 1.0);
}
`;

export class Eyes {
  constructor(scene, max = 24) {
    this.max = max;
    this.items = [];
    const n = max * 2;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.int = new Float32Array(n);
    this.size = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.ca = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    this.ia = new THREE.BufferAttribute(this.int, 1).setUsage(THREE.DynamicDrawUsage);
    this.sa = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.pa);
    geo.setAttribute('aColor', this.ca);
    geo.setAttribute('aI', this.ia);
    geo.setAttribute('aSize', this.sa);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uPix: { value: 600 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 7;
    scene.add(this.points);
    for (let i = 0; i < max; i++) this.items.push({ alive: false });
    this.dirty = true;
  }

  clear() {
    for (const it of this.items) it.alive = false;
    this.int.fill(0);
    this.ia.needsUpdate = true;
  }

  // yaw: the direction the face looks (monster convention: forward = (sin, cos))
  add(x, y, z, yaw, o = {}) {
    let it = this.items.find((q) => !q.alive);
    if (!it) it = this.items.reduce((a, b) => (a.t0 < b.t0 ? a : b));
    const half = (o.spacing ?? 0.22) * 0.5;
    it.alive = true;
    it.x = x; it.y = y; it.z = z;
    it.rx = Math.cos(yaw) * half;
    it.rz = -Math.sin(yaw) * half;
    it.t0 = o.time ?? 0;
    it.life = o.life ?? 0.5;
    it.peak = o.intensity ?? 1;
    it.color = o.color ?? [1.0, 0.16, 0.1];
    it.size = o.size ?? 0.16;
    it.blinkAt = o.blink ? it.life * (0.35 + Math.random() * 0.3) : -1;
    return it;
  }

  update(time, pixScale) {
    this.mat.uniforms.uPix.value = pixScale;
    let any = false;
    for (let i = 0; i < this.max; i++) {
      const it = this.items[i];
      const a = i * 2, b = a + 1;
      if (!it.alive) {
        if (this.int[a] !== 0 || this.int[b] !== 0) { this.int[a] = this.int[b] = 0; any = true; }
        continue;
      }
      const age = time - it.t0;
      if (age > it.life || age < -0.5) {
        it.alive = false;
        this.int[a] = this.int[b] = 0;
        any = true;
        continue;
      }
      // fade in fast, hold, sink out; an optional slow blink in the middle
      let k = Math.min(1, Math.max(0, age) / 0.07) * Math.min(1, (it.life - age) / 0.22);
      if (it.blinkAt > 0 && Math.abs(age - it.blinkAt) < 0.06) k = 0;
      const I = k * it.peak;
      this.pos[a * 3] = it.x - it.rx; this.pos[a * 3 + 1] = it.y; this.pos[a * 3 + 2] = it.z - it.rz;
      this.pos[b * 3] = it.x + it.rx; this.pos[b * 3 + 1] = it.y; this.pos[b * 3 + 2] = it.z + it.rz;
      for (const j of [a, b]) {
        this.col[j * 3] = it.color[0]; this.col[j * 3 + 1] = it.color[1]; this.col[j * 3 + 2] = it.color[2];
        this.size[j] = it.size;
        this.int[j] = I;
      }
      any = true;
    }
    if (any) {
      this.pa.needsUpdate = true;
      this.ca.needsUpdate = true;
      this.ia.needsUpdate = true;
      this.sa.needsUpdate = true;
    }
  }
}
