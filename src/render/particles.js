// CPU particle bursts (sparks, embers, splashes). Additive glowing points; alive particles are kept packed.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
uniform float uPix;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPix / max(-mv.z, 0.2), 0.0, 48.0);
}
`;
const FRAG = /* glsl */ `
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a = a * a;
  gl_FragColor = vec4(vColor * a * 1.6, 1.0);
}
`;

export class Particles {
  constructor(scene, max = 1600) {
    this.max = max;
    this.n = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.base = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.size0 = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.ca = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    this.sa = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.pa);
    geo.setAttribute('aColor', this.ca);
    geo.setAttribute('aSize', this.sa);
    geo.setDrawRange(0, 0);
    this.geo = geo;
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
    this.points.renderOrder = 8;
    scene.add(this.points);
  }

  clear() {
    this.n = 0;
    this.geo.setDrawRange(0, 0);
  }

  // opts: color [r,g,b], speed, up, life, size, gravity, drag, spread (position jitter), dir {x,y,z}, cone
  burst(x, y, z, count, o = {}) {
    const color = o.color || [1, 1, 1];
    for (let k = 0; k < count; k++) {
      if (this.n >= this.max) return;
      const i = this.n++;
      const sp = (o.speed ?? 3) * (0.35 + Math.random() * 0.65);
      let vx, vy, vz;
      if (o.dir) {
        const c = o.cone ?? 0.5;
        vx = o.dir.x + (Math.random() - 0.5) * c * 2;
        vy = o.dir.y + (Math.random() - 0.5) * c * 2;
        vz = o.dir.z + (Math.random() - 0.5) * c * 2;
      } else {
        const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
        vx = r * Math.cos(th); vy = u; vz = r * Math.sin(th);
      }
      const l = Math.hypot(vx, vy, vz) || 1;
      const j = o.spread ?? 0;
      this.pos[i * 3] = x + (Math.random() - 0.5) * j;
      this.pos[i * 3 + 1] = y + (Math.random() - 0.5) * j;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * j;
      this.vel[i * 3] = (vx / l) * sp;
      this.vel[i * 3 + 1] = (vy / l) * sp + (o.up ?? 0);
      this.vel[i * 3 + 2] = (vz / l) * sp;
      const tint = 0.75 + Math.random() * 0.5;
      this.base[i * 3] = color[0] * tint;
      this.base[i * 3 + 1] = color[1] * tint;
      this.base[i * 3 + 2] = color[2] * tint;
      const life = (o.life ?? 1) * (0.6 + Math.random() * 0.6);
      this.life[i] = life;
      this.maxLife[i] = life;
      this.size0[i] = (o.size ?? 0.12) * (0.6 + Math.random() * 0.8);
      this.grav[i] = o.gravity ?? -6;
      this.drag[i] = o.drag ?? 1.5;
    }
  }

  _kill(i) {
    const last = --this.n;
    if (i === last) return;
    for (let c = 0; c < 3; c++) {
      this.pos[i * 3 + c] = this.pos[last * 3 + c];
      this.vel[i * 3 + c] = this.vel[last * 3 + c];
      this.base[i * 3 + c] = this.base[last * 3 + c];
    }
    this.life[i] = this.life[last];
    this.maxLife[i] = this.maxLife[last];
    this.size0[i] = this.size0[last];
    this.grav[i] = this.grav[last];
    this.drag[i] = this.drag[last];
  }

  update(dt, pixScale) {
    this.mat.uniforms.uPix.value = pixScale;
    for (let i = this.n - 1; i >= 0; i--) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this._kill(i);
        continue;
      }
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= d;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d + this.grav[i] * dt;
      this.vel[i * 3 + 2] *= d;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    for (let i = 0; i < this.n; i++) {
      const t = this.life[i] / this.maxLife[i];
      const f = t * t;
      this.col[i * 3] = this.base[i * 3] * f;
      this.col[i * 3 + 1] = this.base[i * 3 + 1] * f;
      this.col[i * 3 + 2] = this.base[i * 3 + 2] * f;
      this.size[i] = this.size0[i] * (0.4 + 0.6 * t);
    }
    this.geo.setDrawRange(0, this.n);
    if (this.n > 0) {
      this.pa.clearUpdateRanges(); this.pa.addUpdateRange(0, this.n * 3); this.pa.needsUpdate = true;
      this.ca.clearUpdateRanges(); this.ca.addUpdateRange(0, this.n * 3); this.ca.needsUpdate = true;
      this.sa.clearUpdateRanges(); this.sa.addUpdateRange(0, this.n); this.sa.needsUpdate = true;
    }
  }
}
