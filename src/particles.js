import * as THREE from 'three';

// ---------------------------------------------------------------------------
//  Pooled, allocation-free effect systems. One draw call each.
// ---------------------------------------------------------------------------

const _col = new THREE.Color();

/** Additive glow billboards: flashes, sparks, tracers, muzzle flashes. */
export class SpriteSystem {
  constructor(max = 1600) {
    this.max = max;
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    const mk = (n) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(max * n), n);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    this.aPos = mk(3); this.aVel = mk(3); this.aCol = mk(4); this.aDat = mk(3);
    geo.setAttribute('iPos', this.aPos);
    geo.setAttribute('iVel', this.aVel);
    geo.setAttribute('iCol', this.aCol);
    geo.setAttribute('iDat', this.aDat);
    geo.instanceCount = 0;
    this.geo = geo;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec3 iPos; attribute vec3 iVel; attribute vec4 iCol; attribute vec3 iDat;
        varying vec4 vCol; varying vec2 vUv;
        void main() {
          vUv = uv; vCol = iCol;
          vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
          vec2 corner = position.xy;
          float size = iDat.x;
          if (iDat.z > 0.0) {
            vec3 vv = (modelViewMatrix * vec4(iVel, 0.0)).xyz;
            vec2 d = vv.xy; float l = length(d);
            d = l > 1e-4 ? d / l : vec2(1.0, 0.0);
            vec2 pp = vec2(-d.y, d.x);
            float len = size * (1.0 + l * iDat.z);
            mv.xy += d * corner.x * len + pp * corner.y * size;
          } else {
            float c = cos(iDat.y), s = sin(iDat.y);
            mv.xy += vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y) * size;
          }
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying vec4 vCol; varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float d = dot(p, p);
          if (d > 1.0) discard;
          float a = 1.0 - d; a *= a;
          float core = smoothstep(0.35, 0.0, d);
          gl_FragColor = vec4(vCol.rgb * (a + core * 0.6), vCol.a * a);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 10;
    // simulation state
    const f = () => new Float32Array(max);
    this.px = f(); this.py = f(); this.pz = f();
    this.vx = f(); this.vy = f(); this.vz = f();
    this.life = f(); this.maxLife = f();
    this.s0 = f(); this.s1 = f();
    this.r = f(); this.g = f(); this.b = f(); this.a = f();
    this.drag = f(); this.grav = f(); this.stretch = f(); this.rot = f();
    this.count = 0;
    this.frame = []; // one-frame sprites
    this.frameCount = 0;
  }

  spawn(x, y, z, vx, vy, vz, life, s0, s1, color, alpha = 1, drag = 0, grav = 0, stretch = 0) {
    if (this.count >= this.max - 160) return;
    const i = this.count++;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.life[i] = life; this.maxLife[i] = life;
    this.s0[i] = s0; this.s1[i] = s1;
    _col.set(color);
    this.r[i] = _col.r; this.g[i] = _col.g; this.b[i] = _col.b; this.a[i] = alpha;
    this.drag[i] = drag; this.grav[i] = grav; this.stretch[i] = stretch;
    this.rot[i] = Math.random() * 6.28;
  }

  /** Draw a sprite for this frame only (used for projectiles/glows). */
  draw(x, y, z, size, color, alpha = 1) {
    if (this.frameCount >= 160) return;
    let f = this.frame[this.frameCount];
    if (!f) { f = { x: 0, y: 0, z: 0, s: 0, r: 0, g: 0, b: 0, a: 0 }; this.frame.push(f); }
    _col.set(color);
    f.x = x; f.y = y; f.z = z; f.s = size; f.r = _col.r; f.g = _col.g; f.b = _col.b; f.a = alpha;
    this.frameCount++;
  }

  update(dt) {
    const P = this.aPos.array, V = this.aVel.array, C = this.aCol.array, D = this.aDat.array;
    let w = 0;
    for (let i = 0; i < this.count; i++) {
      const life = this.life[i] - dt;
      if (life <= 0) continue;
      const dr = Math.max(0, 1 - this.drag[i] * dt);
      let vx = this.vx[i] * dr, vy = this.vy[i] * dr - this.grav[i] * dt, vz = this.vz[i] * dr;
      const x = this.px[i] + vx * dt, y = this.py[i] + vy * dt, z = this.pz[i] + vz * dt;
      if (w !== i) {
        this.maxLife[w] = this.maxLife[i]; this.s0[w] = this.s0[i]; this.s1[w] = this.s1[i];
        this.r[w] = this.r[i]; this.g[w] = this.g[i]; this.b[w] = this.b[i]; this.a[w] = this.a[i];
        this.drag[w] = this.drag[i]; this.grav[w] = this.grav[i]; this.stretch[w] = this.stretch[i]; this.rot[w] = this.rot[i];
      }
      this.life[w] = life;
      this.px[w] = x; this.py[w] = y; this.pz[w] = z;
      this.vx[w] = vx; this.vy[w] = vy; this.vz[w] = vz;
      const t = 1 - life / this.maxLife[w];
      const size = this.s0[w] + (this.s1[w] - this.s0[w]) * t;
      const alpha = this.a[w] * (1 - t * t);
      const o3 = w * 3, o4 = w * 4;
      P[o3] = x; P[o3 + 1] = y; P[o3 + 2] = z;
      V[o3] = vx; V[o3 + 1] = vy; V[o3 + 2] = vz;
      C[o4] = this.r[w] * alpha; C[o4 + 1] = this.g[w] * alpha; C[o4 + 2] = this.b[w] * alpha; C[o4 + 3] = alpha;
      D[o3] = size; D[o3 + 1] = this.rot[w]; D[o3 + 2] = this.stretch[w];
      w++;
    }
    this.count = w;
    let total = w;
    for (let k = 0; k < this.frameCount; k++) {
      const f = this.frame[k];
      const o3 = total * 3, o4 = total * 4;
      P[o3] = f.x; P[o3 + 1] = f.y; P[o3 + 2] = f.z;
      V[o3] = 0; V[o3 + 1] = 0; V[o3 + 2] = 0;
      C[o4] = f.r * f.a; C[o4 + 1] = f.g * f.a; C[o4 + 2] = f.b * f.a; C[o4 + 3] = f.a;
      D[o3] = f.s; D[o3 + 1] = 0; D[o3 + 2] = 0;
      total++;
    }
    this.frameCount = 0;
    this.geo.instanceCount = total;
    for (const a of [this.aPos, this.aVel, this.aDat]) { a.clearUpdateRanges(); a.addUpdateRange(0, total * 3); a.needsUpdate = true; }
    this.aCol.clearUpdateRanges(); this.aCol.addUpdateRange(0, total * 4); this.aCol.needsUpdate = true;
  }

  clear() { this.count = 0; this.frameCount = 0; this.geo.instanceCount = 0; }
}

/**
 * Low-poly "puffs": faceted icospheres for fire, smoke and dust. Opaque
 * (no sorting), shaded with a fake sun, scale animates in/out.
 */
export class PuffSystem {
  constructor(max = 900, sunDir = new THREE.Vector3(0.4, 0.8, 0.3)) {
    this.max = max;
    const base = new THREE.IcosahedronGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', base.attributes.position);
    const mk = (n) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(max * n), n);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    this.aPS = mk(4); this.aCol = mk(4); this.aRot = mk(2);
    geo.setAttribute('iPS', this.aPS);
    geo.setAttribute('iCol', this.aCol);
    geo.setAttribute('iRot', this.aRot);
    geo.instanceCount = 0;
    this.geo = geo;
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSun: { value: sunDir.clone().normalize() } }]),
      vertexShader: /* glsl */`
        attribute vec4 iPS; attribute vec4 iCol; attribute vec2 iRot;
        varying vec4 vCol; varying vec3 vWorld; varying float vAlpha;
        #include <fog_pars_vertex>
        void main() {
          vCol = iCol;
          vAlpha = iRot.y;
          float c = cos(iRot.x), s = sin(iRot.x);
          vec3 p = position;
          p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
          p = vec3(p.x, c * p.y - s * p.z * 0.5, p.z);
          vec3 wp = iPS.xyz + p * iPS.w;
          vWorld = wp;
          vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun;
        varying vec4 vCol; varying vec3 vWorld; varying float vAlpha;
        #include <fog_pars_fragment>
        void main() {
          vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
          float l = max(dot(n, uSun), 0.0) * 0.5 + 0.68;
          vec3 col = mix(vCol.rgb * l, vCol.rgb * 1.4, vCol.a);
          gl_FragColor = vec4(col, vAlpha);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    const f = () => new Float32Array(max);
    this.px = f(); this.py = f(); this.pz = f(); this.vx = f(); this.vy = f(); this.vz = f();
    this.life = f(); this.maxLife = f(); this.size = f();
    this.r0 = f(); this.g0 = f(); this.b0 = f(); this.r1 = f(); this.g1 = f(); this.b1 = f();
    this.e0 = f(); this.e1 = f(); this.drag = f(); this.grav = f(); this.rot = f(); this.rs = f(); this.alpha = f();
    this.count = 0;
  }

  /** color0 -> color1 over life; emissive e0 -> e1; grav < 0 rises; alpha = start opacity. */
  spawn(x, y, z, vx, vy, vz, life, size, c0, c1, e0 = 0, e1 = 0, drag = 2, grav = 0, alpha = 1) {
    if (this.count >= this.max) return;
    const i = this.count++;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.life[i] = life; this.maxLife[i] = life; this.size[i] = size;
    _col.set(c0); this.r0[i] = _col.r; this.g0[i] = _col.g; this.b0[i] = _col.b;
    _col.set(c1); this.r1[i] = _col.r; this.g1[i] = _col.g; this.b1[i] = _col.b;
    this.e0[i] = e0; this.e1[i] = e1; this.drag[i] = drag; this.grav[i] = grav;
    this.rot[i] = Math.random() * 6.28; this.rs[i] = (Math.random() - 0.5) * 4; this.alpha[i] = alpha;
  }

  update(dt) {
    const PS = this.aPS.array, C = this.aCol.array, R = this.aRot.array;
    let w = 0;
    for (let i = 0; i < this.count; i++) {
      const life = this.life[i] - dt;
      if (life <= 0) continue;
      const dr = Math.max(0, 1 - this.drag[i] * dt);
      const vx = this.vx[i] * dr, vy = this.vy[i] * dr - this.grav[i] * dt, vz = this.vz[i] * dr;
      if (w !== i) {
        this.maxLife[w] = this.maxLife[i]; this.size[w] = this.size[i];
        this.r0[w] = this.r0[i]; this.g0[w] = this.g0[i]; this.b0[w] = this.b0[i];
        this.r1[w] = this.r1[i]; this.g1[w] = this.g1[i]; this.b1[w] = this.b1[i];
        this.e0[w] = this.e0[i]; this.e1[w] = this.e1[i]; this.drag[w] = this.drag[i]; this.grav[w] = this.grav[i];
        this.rs[w] = this.rs[i]; this.alpha[w] = this.alpha[i];
      }
      this.life[w] = life;
      this.vx[w] = vx; this.vy[w] = vy; this.vz[w] = vz;
      const x = (this.px[w] = this.px[i] + vx * dt);
      const y = (this.py[w] = this.py[i] + vy * dt);
      const z = (this.pz[w] = this.pz[i] + vz * dt);
      const rot = (this.rot[w] = this.rot[i] + this.rs[w] * dt);
      const t = 1 - life / this.maxLife[w];
      // quick pop-in, slow shrink
      const sc = t < 0.15 ? 0.45 + (t / 0.15) * 0.55 : 1 - Math.pow((t - 0.15) / 0.85, 1.6);
      const o4 = w * 4;
      PS[o4] = x; PS[o4 + 1] = y; PS[o4 + 2] = z; PS[o4 + 3] = this.size[w] * sc * (1 + t * 0.6);
      const ct = Math.min(1, t * 1.6);
      C[o4] = this.r0[w] + (this.r1[w] - this.r0[w]) * ct;
      C[o4 + 1] = this.g0[w] + (this.g1[w] - this.g0[w]) * ct;
      C[o4 + 2] = this.b0[w] + (this.b1[w] - this.b0[w]) * ct;
      C[o4 + 3] = this.e0[w] + (this.e1[w] - this.e0[w]) * ct;
      R[w * 2] = rot;
      R[w * 2 + 1] = this.alpha[w] * (t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4);
      w++;
    }
    this.count = w;
    this.geo.instanceCount = w;
    this.aPS.clearUpdateRanges(); this.aPS.addUpdateRange(0, w * 4); this.aPS.needsUpdate = true;
    this.aCol.clearUpdateRanges(); this.aCol.addUpdateRange(0, w * 4); this.aCol.needsUpdate = true;
    this.aRot.clearUpdateRanges(); this.aRot.addUpdateRange(0, w * 2); this.aRot.needsUpdate = true;
  }

  clear() { this.count = 0; this.geo.instanceCount = 0; }
}

/** Tumbling debris chunks with ground bounces. */
export class DebrisSystem {
  constructor(game, max = 260) {
    this.game = game;
    this.max = max;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ flatShading: true });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    for (let i = 0; i < max; i++) this.mesh.setColorAt(i, _col.set(0xffffff));
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.items = [];
    for (let i = 0; i < max; i++) {
      this.items.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0, wx: 0, wy: 0, wz: 0, sx: 1, sy: 1, sz: 1, life: 0, max: 1, color: new THREE.Color(), hint: -1, rest: false });
    }
    this.count = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
    this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }

  spawn(x, y, z, vx, vy, vz, size, color, life = 2.5, hint = -1) {
    if (this.count >= this.max) return;
    const d = this.items[this.count++];
    d.x = x; d.y = y; d.z = z; d.vx = vx; d.vy = vy; d.vz = vz;
    d.ax = Math.random() * 6; d.ay = Math.random() * 6; d.az = Math.random() * 6;
    d.wx = (Math.random() - 0.5) * 18; d.wy = (Math.random() - 0.5) * 18; d.wz = (Math.random() - 0.5) * 18;
    d.sx = size * (0.6 + Math.random() * 0.8); d.sy = size * (0.4 + Math.random() * 0.6); d.sz = size * (0.6 + Math.random() * 0.8);
    d.life = life; d.max = life; d.color.set(color); d.hint = hint; d.rest = false;
  }

  update(dt) {
    const g = 30;
    let w = 0;
    const items = this.items;
    for (let i = 0; i < this.count; i++) {
      const d = items[i];
      d.life -= dt;
      if (d.life <= 0) continue;
      if (!d.rest) {
        d.vy -= g * dt;
        d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        d.ax += d.wx * dt; d.ay += d.wy * dt; d.az += d.wz * dt;
        const W = this.game.world;
        const gh = W.groundAt(d.x, d.z, d.hint) + d.sy * 0.4;
        d.hint = W.lastIdx;
        if (d.y < gh) {
          d.y = gh;
          if (d.vy < -2.5) {
            d.vy *= -0.38; d.vx *= 0.6; d.vz *= 0.6;
            d.wx *= 0.6; d.wy *= 0.6; d.wz *= 0.6;
          } else { d.rest = true; d.vy = 0; }
        }
      }
      if (w !== i) { items[i] = items[w]; items[w] = d; }
      const k = Math.min(1, d.life / 0.4);
      this._e.set(d.ax, d.ay, d.az);
      this._q.setFromEuler(this._e);
      this._p.set(d.x, d.y, d.z);
      this._s.set(d.sx * k, d.sy * k, d.sz * k);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(w, this._m);
      this.mesh.setColorAt(w, d.color);
      w++;
    }
    this.count = w;
    this.mesh.count = w;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }

  clear() { this.count = 0; this.mesh.count = 0; }
}

/** Expanding ground shockwave rings. */
export class RingSystem {
  constructor(max = 8) {
    this.items = [];
    const geo = new THREE.RingGeometry(0.86, 1, 40);
    geo.rotateX(-Math.PI / 2);
    this.group = new THREE.Group();
    for (let i = 0; i < max; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      m.renderOrder = 9;
      this.group.add(m);
      this.items.push({ m, t: 0, life: 0, size: 1 });
    }
    this.next = 0;
  }

  spawn(x, y, z, size = 12, color = 0xffc070, life = 0.5) {
    const it = this.items[this.next];
    this.next = (this.next + 1) % this.items.length;
    it.m.position.set(x, y + 0.25, z);
    it.m.material.color.set(color);
    it.t = 0; it.life = life; it.size = size;
    it.m.visible = true;
  }

  update(dt) {
    for (const it of this.items) {
      if (!it.m.visible) continue;
      it.t += dt;
      const k = it.t / it.life;
      if (k >= 1) { it.m.visible = false; continue; }
      const e = 1 - Math.pow(1 - k, 3);
      const s = 0.5 + it.size * e;
      it.m.scale.set(s, 1, s);
      it.m.material.opacity = (1 - k) * 0.9;
    }
  }

  clear() { for (const it of this.items) it.m.visible = false; }
}

/** Ring-buffered tyre marks; fade by age in the shader. */
export class SkidMarks {
  constructor(max = 1400) {
    this.max = max;
    const pos = new Float32Array(max * 4 * 3);
    const seg = new Float32Array(max * 4);
    const idx = new Uint32Array(max * 6);
    for (let i = 0; i < max; i++) {
      const v = i * 4, o = i * 6;
      idx[o] = v; idx[o + 1] = v + 2; idx[o + 2] = v + 1;
      idx[o + 3] = v + 1; idx[o + 4] = v + 2; idx[o + 5] = v + 3;
      seg[v] = seg[v + 1] = seg[v + 2] = seg[v + 3] = -1e6;
    }
    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aSeg = new THREE.BufferAttribute(seg, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos);
    geo.setAttribute('aSeg', this.aSeg);
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.uniforms = { uHead: { value: 0 }, uMax: { value: max }, uColor: { value: new THREE.Color(0x3a1a12) } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      vertexShader: /* glsl */`
        attribute float aSeg; uniform float uHead; uniform float uMax; varying float vA;
        void main() {
          float age = uHead - aSeg;
          vA = clamp(1.0 - age / uMax, 0.0, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; varying float vA;
        void main() { gl_FragColor = vec4(uColor, vA * 0.5); 
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.head = 0;
    this.counter = 0;
  }

  add(x0, y0, z0, x1, y1, z1, w) {
    const dx = x1 - x0, dz = z1 - z0;
    const l = Math.hypot(dx, dz);
    if (l < 0.05 || l > 6) return;
    const px = (-dz / l) * w * 0.5, pz = (dx / l) * w * 0.5;
    const i = this.head;
    const P = this.aPos.array, S = this.aSeg.array;
    const o = i * 12;
    P[o] = x0 - px; P[o + 1] = y0; P[o + 2] = z0 - pz;
    P[o + 3] = x0 + px; P[o + 4] = y0; P[o + 5] = z0 + pz;
    P[o + 6] = x1 - px; P[o + 7] = y1; P[o + 8] = z1 - pz;
    P[o + 9] = x1 + px; P[o + 10] = y1; P[o + 11] = z1 + pz;
    const c = this.counter;
    S[i * 4] = S[i * 4 + 1] = S[i * 4 + 2] = S[i * 4 + 3] = c;
    this.aPos.addUpdateRange(o, 12);
    this.aSeg.addUpdateRange(i * 4, 4);
    this.aPos.needsUpdate = true;
    this.aSeg.needsUpdate = true;
    this.head = (this.head + 1) % this.max;
    this.counter++;
    this.uniforms.uHead.value = this.counter;
  }

  clear() {
    const S = this.aSeg.array;
    S.fill(-1e6);
    this.aSeg.clearUpdateRanges();
    this.aSeg.needsUpdate = true;
  }

  frameEnd() {
    // ranges are consumed by the renderer each frame; nothing else needed
  }
}
