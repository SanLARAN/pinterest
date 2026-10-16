// The atlas plate: a live 3D portrait on its own small canvas. The specimen is drawn the way the game
// draws the forest — black faces, grainy glowing wire — and lit by an echo that leaves the viewer every few
// seconds (or whenever you click it). Drag to turn it, wheel / pinch to come closer.
import * as THREE from 'three';
import { EDGE_GLSL, KIND_COLORS_GLSL } from '../render/sonar.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { RNG, clamp } from '../core/rng.js';
import { buildModel } from './atlasModels.js';

const VERT = /* glsl */ `
attribute vec4 data;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vBary = data.xyz;
  vKind = floor(data.w * 255.0 + 0.5);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
${EDGE_GLSL}
${KIND_COLORS_GLSL}
uniform float uTime;
uniform vec3 uCam;
uniform vec4 uPing;   // origin xyz, start time
uniform vec2 uPingK;  // speed (m/s), ring width (m)
uniform float uBase;  // how much of it stays visible between echoes
uniform float uNoise; // dash / speck cells per metre (scaled to the specimen)
uniform vec3 uGround; // ground disc: centre x, z, radius
uniform vec4 uLamp;   // a running work lamp: xyz, intensity
uniform float uLampR;
uniform float uFade;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  vec3 V = toCam / camD;
  if (dot(N, toCam) < 0.0) N = -N;
  int k = int(vKind + 0.5); // (an interpolated constant can land a hair under the integer)
  bool beam = k > 11;
  if (beam) k = 11;
  vec3 base = KC[k];
  float facing = abs(dot(N, V));

  // the echo: a wavefront, a quick flash, a long afterglow
  float age = uTime - uPing.w;
  float d = length(vWorld - uPing.xyz);
  float front = age * uPingK.x - d;
  float ring = age >= 0.0 ? exp(-(front * front) / (uPingK.y * uPingK.y)) : 0.0;
  float since = max(front, 0.0) / uPingK.x;
  float lit = front > 0.0 ? 0.75 * exp(-since * 1.5) + 0.25 * exp(-since * 0.3) : 0.0;
  float L = uBase * (0.45 + 0.55 * facing) + lit * (0.3 + 0.7 * facing) + ring * 1.5;

  vec3 lamp = vec3(0.0);
  if (uLamp.w > 0.0) {
    vec3 ld = uLamp.xyz - vWorld;
    float dl = length(ld);
    float fall = 1.0 - smoothstep(uLampR * 0.08, uLampR, dl);
    lamp = vec3(1.0, 0.72, 0.4) * uLamp.w * fall * fall * (0.35 + 0.65 * abs(dot(N, ld / max(dl, 0.001))));
  }

  float edge = edgeFactor(vBary, k == 0 ? 0.8 : 1.05);
  edge *= mix(0.35, 1.0, smoothstep(0.02, 0.3, facing));
  // scanned, not drawn: lines break into grainy dashes; faces are a sparse point cloud
  float dash = hash13(floor(vWorld * uNoise));
  edge *= 0.45 + 0.55 * smoothstep(0.1, 0.6, dash);
  float st = hash13(floor(vWorld * uNoise * 1.8));
  float face = 0.05 + smoothstep(0.8, 0.97, st) * 0.3;

  vec3 col = base * L * (face + edge * (k == 5 ? 1.75 : 1.45));
  col += base * lamp * (0.55 * edge + 0.16 + 0.1 * st);
  col += vec3(0.78, 0.85, 0.9) * ring * edge * 0.45;
  float sp = step(0.992, hash13(floor(vWorld * uNoise * 1.3) + floor(uTime * 14.0)));
  col += base * sp * ring * 1.1;
  if (k == 9) col += vec3(1.0, 0.16, 0.1) * (0.75 + 0.45 * sin(uTime * 5.3)) * (0.55 + lit); // the eyes burn
  if (k == 11) col += base * (0.06 + 0.3 * lit) * (0.45 + 0.55 * edge); // amber holds a glow
  if (beam) col = base * (0.1 + 0.5 * lit + ring) * (0.4 + 0.6 * edge);
  if (k == 0) {
    float gd = length(vWorld.xz - uGround.xy) / uGround.z;
    col *= (1.0 - smoothstep(0.3, 1.0, gd)) * 0.8;
  }
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

const NICE = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 50];

let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

// a patch of low-poly ground under the specimen (it fades out toward the plate's edge)
function groundGeometry(R, seed = 7) {
  const b = new MeshBuilder(2048);
  const r = new RNG(seed);
  const n = 8;
  const c = (2 * R) / n;
  const H = [];
  for (let j = 0; j <= n; j++) {
    H.push([]);
    for (let i = 0; i <= n; i++) H[j].push(-c * (0.02 + 0.05 * r.next()));
  }
  b.identity();
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x0 = -R + i * c, z0 = -R + j * c;
      if (Math.hypot(x0 + c / 2, z0 + c / 2) > R + c * 0.5) continue;
      const a = [x0, H[j][i], z0], bb = [x0 + c, H[j][i + 1], z0], cc = [x0 + c, H[j + 1][i + 1], z0 + c], d = [x0, H[j + 1][i], z0 + c];
      b.tri(a, d, cc, KIND.GROUND);
      b.tri(a, cc, bb, KIND.GROUND);
    }
  }
  const g = new THREE.BufferGeometry();
  const arr = b.toArrays();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  return g;
}

export class Specimen {
  // host: the plate element (the canvas goes in first). opts.onScale({ px, label }) — the scale ruler
  constructor(host, opts = {}) {
    this.host = host;
    this.onScale = opts.onScale || null;
    this.ctx = opts.ctx || {};
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'plate-gl';
    host.prepend(this.canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'low-power', stencil: false });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 500);
    this.u = {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uPing: { value: new THREE.Vector4(0, 0, 0, -1e4) },
      uPingK: { value: new THREE.Vector2(5, 0.1) },
      uBase: { value: 0.3 },
      uNoise: { value: 9 },
      uGround: { value: new THREE.Vector3(0, 0, 2) },
      uLamp: { value: new THREE.Vector4(0, 0, 0, 0) },
      uLampR: { value: 6 },
      uFade: { value: 1 },
    };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG });
    this.groundMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.groundMesh.frustumCulled = false;
    this.scene.add(this.groundMesh);
    const glowMat = (color, opacity) => new THREE.SpriteMaterial({ map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity });
    this.glow = [new THREE.Sprite(glowMat(0xffd2a0, 0.9)), new THREE.Sprite(glowMat(0xff9a50, 0.35))];
    for (const s of this.glow) {
      s.visible = false;
      this.scene.add(s);
    }

    this.models = new Map();
    this.model = null;
    this.t = 0;
    this.nextPing = 0;
    this.reactT = -1e9;
    this.pingStart = -1e9;
    this.target = new THREE.Vector3();
    this.orbit = { yaw: 0.5, pitch: 0.15, zoom: 1, dist0: 5, vyaw: 0, idle: 9, spin: 0 };
    this.ptrs = new Map();
    this.dragged = false;
    this.w = 0;
    this.h = 0;
    this._scaleKey = '';
    this._bindPointer();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(host);
    }
    this.resize();
  }

  resize() {
    const w = Math.max(1, Math.round(this.host.clientWidth));
    const h = Math.max(1, Math.round(this.host.clientHeight));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.model) this._fit(this.model);
  }

  _get(key) {
    let m = this.models.get(key);
    if (!m) {
      m = buildModel(key, this.mat, this.ctx);
      if (!m) return null;
      this._prepare(m);
      this.models.set(key, m);
    }
    return m;
  }

  // its measurements (built once, without showing it): { height, length } in metres
  measure(key) {
    const m = this._get(key);
    return m ? { height: m.height, length: m.length } : null;
  }

  // a still of the plate right now (for a page that turns back over it)
  snapshot() {
    if (!this.model || this.w < 4) return '';
    try {
      this.renderer.render(this.scene, this.camera);
      return this.canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      return '';
    }
  }

  // build (once) and show a specimen
  show(key) {
    const m = this._get(key);
    if (!m) return null;
    if (m === this.model) return m;
    if (this.model) this.scene.remove(this.model.root);
    this.model = m;
    this.scene.add(m.root);
    this.groundMesh.geometry = m.ground;
    this.u.uGround.value.set(m.center.x, m.center.z, m.groundR);
    this.u.uBase.value = m.base;
    this.u.uNoise.value = clamp(9 * (2.6 / m.size), 0.5, 600);
    const v = m.view || {};
    this.orbit.yaw = v.yaw ?? 0.5;
    this.orbit.pitch = v.pitch ?? 0.15;
    this.orbit.zoom = 1;
    this.orbit.vyaw = 0;
    this.orbit.idle = 9;
    this.orbit.spin = 0.12;
    this._fit(m);
    const lamp = m.lamp;
    for (const s of this.glow) s.visible = !!lamp;
    if (lamp) {
      this.glow[0].position.set(lamp.x, lamp.y, lamp.z);
      this.glow[1].position.set(lamp.x, lamp.y, lamp.z);
      this.glow[0].scale.setScalar(0.85);
      this.glow[1].scale.setScalar(3.4);
      this.u.uLampR.value = lamp.r;
    }
    this.u.uLamp.value.w = 0;
    this.u.uFade.value = 0;
    this.reactT = -1e9;
    this.nextPing = this.t + 0.25; // it surfaces with its first echo
    this.pingStart = -1e9;
    this.u.uPing.value.w = -1e4;
    return m;
  }

  // pose it once, measure it, give it ground
  _prepare(m) {
    const S0 = { t: 0, dt: 1 / 60, lit: 0, pinged: false, camAz: 0, react: 1e9 };
    m.tick(S0);
    m.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m.root, true);
    if (box.isEmpty()) box.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
    box.min.y = Math.min(box.min.y, 0);
    // the facts quote it at rest...
    const rest = box.getSize(new THREE.Vector3());
    m.height = rest.y;
    m.length = Math.max(rest.x, rest.z);
    // ...but the frame must hold its every pose (the last one listed puts it back at rest)
    for (const pose of m.poses || []) {
      pose();
      m.root.updateMatrixWorld(true);
      box.union(new THREE.Box3().setFromObject(m.root, true));
    }
    if (m.poses) m.tick(S0);
    m.bounds = box;
    const size = box.getSize(new THREE.Vector3());
    m.center = box.getCenter(new THREE.Vector3());
    m.size = Math.max(size.x, size.y, size.z);
    m.radius = 0.5 * size.length();
    m.groundR = Math.max(0.62 * Math.hypot(size.x, size.z), 0.42 * size.y, 0.05);
    m.ground = groundGeometry(m.groundR, m.key.length * 13 + 5);
    m.ground.translate(m.center.x, 0, m.center.z);
  }

  _fit(m) {
    const v = m.view || {};
    if (v.focus) this.target.set(v.focus[0], v.focus[1], v.focus[2]);
    else this.target.set(m.center.x, v.focusY ?? m.center.y, m.center.z);
    const r = m.radius * (v.fit ?? 1);
    const fovV = THREE.MathUtils.degToRad(this.camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * this.camera.aspect);
    this.orbit.dist0 = (r / Math.sin(Math.min(fovV, fovH) / 2)) * 0.98;
  }

  // an echo from where you stand
  ping() {
    const m = this.model;
    if (!m) return;
    const cam = this.camera.position;
    const dir = cam.clone().sub(this.target).normalize();
    const o = this.target.clone().addScaledVector(dir, m.radius * 1.25);
    this.u.uPing.value.set(o.x, o.y, o.z, this.t);
    this.u.uPingK.value.set(Math.max(0.05, m.radius * 2.3), Math.max(0.004, m.radius * 0.07));
    this.pingStart = this.t;
    this.pingOrigin = o;
    this.pinged = true;
    this.nextPing = this.t + 3.4;
  }

  // its sound was played: let it react (and show it)
  react() {
    this.reactT = this.t;
    this.ping();
  }

  // echo light reaching the specimen's centre right now (0..1)
  _litAtCentre() {
    if (this.pingStart < -1e8 || !this.model) return 0;
    const K = this.u.uPingK.value;
    const front = (this.t - this.pingStart) * K.x - this.pingOrigin.distanceTo(this.target);
    if (front <= 0) return 0;
    const s = front / K.x;
    return 0.75 * Math.exp(-s * 1.5) + 0.25 * Math.exp(-s * 0.3);
  }

  frame(dt) {
    const m = this.model;
    if (!m || this.w < 4 || this.h < 4) return;
    this.t += dt;
    this.pinged = false;
    if (this.t >= this.nextPing) this.ping();
    // the turntable: your hands first, then inertia, then a slow drift
    const o = this.orbit;
    o.idle += dt;
    if (!this.ptrs.size) {
      o.yaw += o.vyaw * dt;
      o.vyaw *= Math.exp(-dt * 3.2);
      const want = o.idle > 2.5 ? 0.16 : 0;
      o.spin += (want - o.spin) * (1 - Math.exp(-dt * 1.2));
      o.yaw += o.spin * dt;
    }
    const d = o.dist0 * o.zoom;
    const cp = Math.cos(o.pitch);
    this.camera.position.set(this.target.x + Math.sin(o.yaw) * cp * d, this.target.y + Math.sin(o.pitch) * d, this.target.z + Math.cos(o.yaw) * cp * d);
    this.camera.lookAt(this.target);
    this.camera.near = Math.max(0.002, d * 0.02);
    this.camera.far = d * 6 + m.radius * 4;
    this.camera.updateProjectionMatrix();

    const lit = this._litAtCentre();
    let az = o.yaw % (Math.PI * 2);
    if (az > Math.PI) az -= Math.PI * 2;
    if (az < -Math.PI) az += Math.PI * 2;
    m.tick({ t: this.t, dt, lit, pinged: this.pinged, camAz: az, react: this.t - this.reactT });

    const u = this.u;
    u.uTime.value = this.t;
    u.uCam.value.copy(this.camera.position);
    u.uFade.value = Math.min(1, u.uFade.value + dt * 3);
    if (m.lamp) {
      const fl = 0.92 + 0.08 * Math.sin(this.t * 31) * Math.sin(this.t * 7.3);
      u.uLamp.value.set(m.lamp.x, m.lamp.y, m.lamp.z, 0.75 * fl * u.uFade.value);
      this.glow[0].material.opacity = 0.9 * fl * u.uFade.value;
      this.glow[1].material.opacity = 0.32 * fl * u.uFade.value;
    }
    this.renderer.render(this.scene, this.camera);
    this._scale(d);
  }

  // a scale bar: some round length that comes out 44–110 px on the plate
  _scale(d) {
    if (!this.onScale) return;
    const mpp = (2 * d * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) / this.h;
    let L = NICE[NICE.length - 1];
    for (const n of NICE) {
      if (n / mpp >= 44) {
        L = n;
        break;
      }
    }
    const px = Math.round(L / mpp);
    const key = `${L}|${px}`;
    if (key === this._scaleKey) return;
    this._scaleKey = key;
    this.onScale({ px, meters: L });
  }

  _bindPointer() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button > 0) return;
      try { c.setPointerCapture(e.pointerId); } catch { /* */ }
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
      if (this.ptrs.size === 2) this.pinch = this._pinchDist();
      this.dragged = false;
      this.orbit.vyaw = 0;
    });
    c.addEventListener('pointermove', (e) => {
      const p = this.ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) this.dragged = true;
      const o = this.orbit;
      o.idle = 0;
      o.spin = 0;
      if (this.ptrs.size >= 2) {
        const pd = this._pinchDist();
        if (this.pinch > 0 && pd > 0) o.zoom = clamp(o.zoom * (this.pinch / pd), 0.45, 1.8);
        this.pinch = pd;
        return;
      }
      const k = 0.0085;
      o.yaw -= dx * k;
      o.pitch = clamp(o.pitch + dy * 0.006, -0.12, 1.05);
      o.vyaw = o.vyaw * 0.6 + (-dx * k / Math.max(1 / 120, 1 / 60)) * 0.4;
      this.onInteract && this.onInteract();
    });
    const up = (e) => {
      const p = this.ptrs.get(e.pointerId);
      if (!p) return;
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size < 2) this.pinch = 0;
      const tap = !this.dragged && performance.now() - p.t < 400 && e.type === 'pointerup';
      if (tap && !this.ptrs.size) {
        this.ping();
        this.onTap && this.onTap();
      }
      this.orbit.idle = 0;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const o = this.orbit;
      o.zoom = clamp(o.zoom * Math.exp(e.deltaY * 0.0012), 0.45, 1.8);
      o.idle = 0;
    }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _pinchDist() {
    const a = [...this.ptrs.values()];
    return a.length >= 2 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0;
  }

  // the height of the current specimen (m), for the facts
  get height() {
    return this.model ? this.model.height : 0;
  }
}
