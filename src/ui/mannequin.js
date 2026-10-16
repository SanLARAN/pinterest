// Your survivor, in 3D, on its own small canvas: standing beside the main menu (a transparent window over
// the forest, lit by a lamp at its feet and by every echo you send), and on the wardrobe stage (turn it,
// come closer, try things on). The wardrobe's item cards are stills from the same renderer.
//
// Drawn the game's way — grainy wire on low-poly faces — but with a lamp on it, so you can actually see
// the colours you pick. One WebGL context for all of it: the canvas moves between the menu and the stage.
import * as THREE from 'three';
import { EDGE_GLSL } from '../render/sonar.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { RNG, clamp, lerp, damp } from '../core/rng.js';
import { buildSurvivor, poseSurvivor, dyeColors } from '../game/survivor.js';
import { cleanFit, shapeKey, item } from '../game/outfit.js';

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
uniform float uTime;
uniform vec3 uCam;
uniform vec4 uPing;    // echo origin xyz, start time
uniform vec2 uPingK;   // speed, ring width
uniform vec3 uDye[4];  // headwear main / accent, outfit main / accent
uniform vec3 uKeyPos;  // the lamp
uniform float uKey;
uniform float uAmb;
uniform float uNoise;
uniform float uFade;
uniform float uHover;
uniform float uOpaque; // 0 = a window over the menu's forest, 1 = a black stage
uniform float uGroundR;
uniform vec4 uGlow;    // a candle / glowing lenses: xyz, strength
uniform vec3 uGlowCol;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;

// what things are made of, on a person (the forest palette is for the forest)
const vec3 PAL[12] = vec3[12](
  vec3(0.30, 0.33, 0.35),  // ground
  vec3(0.36, 0.25, 0.17),  // bark: old leather boots
  vec3(0.34, 0.50, 0.24),  // leaf: a pumpkin stem
  vec3(0.19, 0.19, 0.21),  // rock: soles, felt boots, the crow
  vec3(0.44, 0.40, 0.33),  // wood: trousers, rope
  vec3(0.60, 0.64, 0.68),  // metal
  vec3(0.78, 0.13, 0.10),  // effigy: a red sash
  vec3(0.84, 0.66, 0.56),  // flesh: skin
  vec3(0.86, 0.80, 0.70),  // bone: a beak
  vec3(1.00, 0.86, 0.55),  // eye: a glint
  vec3(0.22, 0.32, 0.48),  // water: denim
  vec3(1.00, 0.70, 0.25)   // shard
);

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
  if (dot(N, V) < 0.0) N = -N;
  int k = int(vKind + 0.5); // (an interpolated constant can land a hair under the integer)
  bool glow = k >= 17;
  vec3 base = k >= 13 ? (k == 13 ? uDye[0] : (k == 14 || k == 17) ? uDye[1] : k == 15 ? uDye[2] : uDye[3]) : PAL[k];
  float facing = clamp(dot(N, V), 0.0, 1.0);

  // the echo: a wavefront, a quick flash, a long afterglow
  float age = uTime - uPing.w;
  float d = length(vWorld - uPing.xyz);
  float front = age * uPingK.x - d;
  float ring = age >= 0.0 ? exp(-(front * front) / (uPingK.y * uPingK.y)) : 0.0;
  float since = max(front, 0.0) / uPingK.x;
  float lit = front > 0.0 ? 0.6 * exp(-since * 1.7) + 0.4 * exp(-since * 0.4) : 0.0;

  vec3 Ld = normalize(uKeyPos - vWorld);
  float diff = max(dot(N, Ld), 0.0);
  float sky = 0.55 + 0.45 * N.y;
  float rim = pow(1.0 - facing, 3.0);
  vec3 light = vec3(1.0, 0.8, 0.6) * diff * uKey + vec3(0.5, 0.58, 0.66) * sky * uAmb
             + vec3(0.55, 0.66, 0.8) * rim * 0.45 + vec3(0.8, 0.88, 0.95) * lit * 0.4;
  if (uGlow.w > 0.0) {
    vec3 gd = uGlow.xyz - vWorld;
    float gl = length(gd);
    light += uGlowCol * uGlow.w * (0.3 + 0.7 * max(dot(N, gd / max(gl, 0.001)), 0.0)) * (1.0 - smoothstep(0.0, 0.6, gl));
  }

  float edge = edgeFactor(vBary, 1.0);
  float dash = hash13(floor(vWorld * uNoise));
  edge *= 0.55 + 0.45 * smoothstep(0.1, 0.6, dash);
  float st = hash13(floor(vWorld * uNoise * 1.7));

  vec3 col = base * light * (0.82 + 0.18 * st);
  col += base * edge * (0.3 + 0.3 * uHover + 0.9 * lit + 1.3 * ring);
  col += vec3(0.78, 0.85, 0.9) * ring * edge * 0.5;
  col += base * step(0.992, hash13(floor(vWorld * uNoise * 1.3) + floor(uTime * 14.0))) * ring;
  if (glow) {
    float fl = 0.86 + 0.14 * sin(uTime * 9.0 + vWorld.y * 40.0) * sin(uTime * 5.3);
    col = base * 1.45 * fl + vec3(0.25) * fl;
  }
  if (k == 9) col = base * 1.6;

  float a = 1.0;
  if (k == 0) {
    float gr = length(vWorld.xz) / uGroundR;
    float fade = 1.0 - smoothstep(0.2, 1.0, gr);
    col = base * (light * 0.3 * (0.6 + 0.4 * st) + edge * (0.3 + lit + 1.3 * ring)) * fade;
    a = clamp(fade * 0.35 + edge * fade * 0.5, 0.0, 1.0);
  }
  gl_FragColor = vec4(col * uFade, mix(a * uFade, 1.0, uOpaque));
}
`;

// a patch of low-poly ground (it fades out toward its edge)
function groundGeometry(R, seed = 11) {
  const b = new MeshBuilder(1024);
  const r = new RNG(seed);
  const n = 8, c = (2 * R) / n;
  const H = [];
  for (let j = 0; j <= n; j++) {
    H.push([]);
    for (let i = 0; i <= n; i++) H[j].push(-0.012 - 0.03 * r.next());
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x0 = -R + i * c, z0 = -R + j * c;
      if (Math.hypot(x0 + c / 2, z0 + c / 2) > R + c * 0.5) continue;
      const a = [x0, H[j][i], z0], bb = [x0 + c, H[j][i + 1], z0], cc = [x0 + c, H[j + 1][i + 1], z0 + c], d = [x0, H[j + 1][i], z0 + c];
      b.tri(a, d, cc, KIND.GROUND);
      b.tri(a, cc, bb, KIND.GROUND);
    }
  }
  const arr = b.toArrays();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  return g;
}

function geometryFrom(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}

// a rig with real meshes on its bones
function dressRig(fit, mat) {
  const rig = buildSurvivor(fit);
  for (const p of rig.parts) {
    const m = new THREE.Mesh(geometryFrom(p.arr), mat);
    m.frustumCulled = false;
    p.node.add(m);
  }
  return rig;
}
function disposeRig(rig) {
  rig.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}

const easeInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
// 0 → 1 → 0 over a gesture: up in `a`, hold, down over the last `r` (fractions of its length)
const bell = (x, a = 0.25, r = 0.3) => (x <= 0 || x >= 1 ? 0 : x < a ? easeInOut(x / a) : x > 1 - r ? easeInOut((1 - x) / r) : 1);

const GESTURE_LEN = { hat: 1.15, body: 1.5, wave: 1.6, startle: 0.9 };
// where a hand goes to settle each hat (head space, x mirrored to the hand's side)
const HAT_TOUCH = {
  hood: [0.08, 0.1, 0.14],
  ushanka: [0.12, 0.13, 0.16],
  gasmask: [0.12, -0.03, 0.15],
  pumpkin: [0.22, 0.02, 0.06],
};
const FORE_DIR = new THREE.Vector3(0, -0.27, 0.06).normalize();
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3();
const _h = new THREE.Vector3(), _p = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

// framing on the stage: whole body / the head
const FOCUS = {
  body: { y: 0.96, h: 2.12 },
  head: { y: 1.64, h: 0.98 },
};

export class Mannequin {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'mq-gl';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power', stencil: false });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(24, 1, 0.05, 40);
    this.u = {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uPing: { value: new THREE.Vector4(0, 0, 0, -1e4) },
      uPingK: { value: new THREE.Vector2(4, 0.12) },
      uDye: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
      uKeyPos: { value: new THREE.Vector3(-1.2, 0.5, 1.6) },
      uKey: { value: 0.7 },
      uAmb: { value: 0.16 },
      uNoise: { value: 26 },
      uFade: { value: 0 },
      uHover: { value: 0 },
      uOpaque: { value: 0 },
      uGroundR: { value: 0.95 },
      uGlow: { value: new THREE.Vector4(0, 0, 0, 0) },
      uGlowCol: { value: new THREE.Color(1, 0.8, 0.4) },
    };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG });
    this.ground = new THREE.Mesh(groundGeometry(0.95), this.mat);
    this.ground.frustumCulled = false;
    this.scene.add(this.ground);

    // the cards' stills: their own uniforms, their own rigs, an offscreen target
    this.tu = THREE.UniformsUtils.clone(this.u);
    this.tu.uDye.value = [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()]; // (clone shares array items)
    this.tmat = new THREE.ShaderMaterial({ uniforms: this.tu, vertexShader: VERT, fragmentShader: FRAG });
    this.tground = new THREE.Mesh(this.ground.geometry, this.tmat);
    this.tground.frustumCulled = false;
    this.tscene = new THREE.Scene();
    this.tscene.add(this.tground);
    this.tcam = new THREE.PerspectiveCamera(24, 1, 0.05, 40);
    this.trigs = new Map(); // shapeKey -> rig
    this.rt = null;

    this.rig = null;
    this.fit = null;
    this.mode = 'menu'; // menu | stage
    this.host = null;
    this.t = 0;
    this.w = 0;
    this.h = 0;
    this.visible = true;
    this.hover = 0;
    this.hovering = false;
    this.gesture = null; // { type, t }
    this.nextPing = 0.6;
    this.pingStart = -1e9;
    this.look = { yaw: 0, pitch: 0, wantYaw: 0, wantPitch: 0, at: -1e9, nx: 0, ny: 0 };
    this.wander = { t: 0, yaw: 0, pitch: 0 };
    this.crow = { t: 0, yaw: 0, tilt: 0 };
    this.orbit = { yaw: 0.5, pitch: 0.08, zoom: 1, vyaw: 0, idle: 9, base: 0.5 };
    this.focus = 'body';
    this.view = { y: FOCUS.body.y, h: FOCUS.body.h };
    this.ptrs = new Map();
    this.dragged = false;
    this.onTap = null;
    this.onInteract = null;
    this._bindPointer();
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
  }

  // ---------------- where it lives ----------------
  attach(host, mode) {
    if (this.host !== host) {
      if (this.ro && this.host) this.ro.unobserve(this.host);
      this.host = host;
      host.prepend(this.canvas);
      if (this.ro) this.ro.observe(host);
    }
    this.mode = mode;
    const stage = mode === 'stage';
    this.u.uOpaque.value = stage ? 1 : 0;
    this.renderer.setClearColor(stage ? 0x050404 : 0x000000, stage ? 1 : 0);
    // the stage: a work lamp up front. the menu: a lantern on the ground at its feet — light from below
    this.u.uKeyPos.value.set(stage ? 1.3 : -0.9, stage ? 2.3 : 0.18, stage ? 2.2 : 1.25);
    this.u.uKey.value = stage ? 0.95 : 0.66;
    this.u.uAmb.value = stage ? 0.3 : 0.06;
    this.u.uGroundR.value = stage ? 0.95 : 0.5;
    this.orbit.zoom = 1;
    this.orbit.vyaw = 0;
    this.orbit.idle = 9;
    this.w = this.h = 0;
    this.resize();
    if (stage) {
      this.view.y = FOCUS[this.focus].y;
      this.view.h = FOCUS[this.focus].h;
    }
  }

  // the menu figure stands three-quarters on, toward the menu (side: -1 = it stands left of the menu)
  setMenuYaw(yaw) {
    this.orbit.base = yaw;
    if (this.mode === 'menu') this.orbit.yaw = yaw;
  }

  resize() {
    if (!this.host) return;
    const w = Math.max(1, Math.round(this.host.clientWidth));
    const h = Math.max(1, Math.round(this.host.clientHeight));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------- what it wears ----------------
  setFit(fitIn, gesture = null) {
    const fit = cleanFit(fitIn);
    const shapeChanged = !this.fit || shapeKey(fit) !== shapeKey(this.fit);
    if (shapeChanged) {
      const old = this.rig;
      this.rig = dressRig(fit, this.mat);
      if (old) {
        this.scene.remove(old.root);
        disposeRig(old);
      }
      this.scene.add(this.rig.root);
      this._crowSeen = !!this.rig.nodes.crow;
    }
    this.fit = fit;
    dyeColors(fit, this.u.uDye.value);
    const hi = item(fit.head);
    this.glowOn = !!(hi && hi.glow);
    this.u.uGlowCol.value.copy(this.u.uDye.value[1]);
    if (gesture) this.play(gesture);
  }

  play(type) {
    if (!GESTURE_LEN[type]) return;
    this.gesture = { type, t: 0 };
    if (type !== 'startle') this.ping();
  }

  setFocus(f) {
    if (FOCUS[f]) this.focus = f;
  }

  // ---------------- echoes ----------------
  ping() {
    const cam = this.camera.position;
    const tgt = new THREE.Vector3(0, this.view.y, 0);
    const dir = cam.clone().sub(tgt).normalize();
    const o = tgt.addScaledVector(dir, 1.6);
    this.u.uPing.value.set(o.x, o.y, o.z, this.t);
    this.u.uPingK.value.set(this.mode === 'stage' ? 3.6 : 4.2, 0.13);
    this.pingStart = this.t;
    this.nextPing = this.t + (this.mode === 'stage' ? 3.6 : 9);
  }

  // where the pointer is, in this canvas' normalised coordinates (may lie outside it)
  pointerAt(clientX, clientY) {
    if (!this.w) return;
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2) return;
    this.look.nx = ((clientX - r.left) / r.width) * 2 - 1;
    this.look.ny = -(((clientY - r.top) / r.height) * 2 - 1);
    this.look.at = this.t;
  }

  setHover(on) {
    this.hovering = !!on;
  }

  // ---------------- every frame ----------------
  frame(dt) {
    if (!this.rig || !this.host || this.w < 4 || this.h < 4) return;
    this.t += dt;
    const u = this.u;
    if (this.t >= this.nextPing) this.ping();
    this.hover = damp(this.hover, this.hovering ? 1 : 0, 8, dt);
    u.uHover.value = this.hover;
    u.uFade.value = Math.min(1, u.uFade.value + dt * 1.6);
    this._camera(dt);
    this._animate(dt);
    u.uTime.value = this.t;
    u.uCam.value.copy(this.camera.position);
    this._glow(this.rig, u, this.t, this.glowOn);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  _camera(dt) {
    const o = this.orbit;
    const stage = this.mode === 'stage';
    o.idle += dt;
    if (stage) {
      const f = FOCUS[this.focus];
      this.view.y = damp(this.view.y, f.y, 4.5, dt);
      this.view.h = damp(this.view.h, f.h, 4.5, dt);
      if (!this.ptrs.size) {
        o.yaw += o.vyaw * dt;
        o.vyaw *= Math.exp(-dt * 3);
        // left alone, it turns back to show its front, swaying a little
        if (o.idle > 3.5) {
          const want = o.base + Math.sin(this.t * 0.35) * 0.32;
          let dy = want - o.yaw;
          dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          o.yaw += dy * (1 - Math.exp(-dt * 0.9));
          o.pitch = damp(o.pitch, 0.08, 0.9, dt);
        }
      }
    } else {
      this.view.y = FOCUS.body.y;
      this.view.h = FOCUS.body.h;
      o.yaw = damp(o.yaw, o.base + Math.sin(this.t * 0.21) * 0.05, 2, dt);
      o.pitch = 0.06;
    }
    const fovV = THREE.MathUtils.degToRad(this.camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * this.camera.aspect);
    const need = this.view.h * 0.5 * (stage ? 1.08 : 1.0);
    const halfW = stage ? (this.focus === 'head' ? this.view.h * 0.5 : 0.62) : 0.5;
    const d = Math.max(need / Math.tan(fovV / 2), halfW / Math.tan(fovH / 2)) * o.zoom;
    const cp = Math.cos(o.pitch);
    const ty = this.view.y;
    this.camera.position.set(Math.sin(o.yaw) * cp * d, ty + Math.sin(o.pitch) * d, Math.cos(o.yaw) * cp * d);
    this.camera.lookAt(0, ty, 0);
    this.camera.near = Math.max(0.02, d * 0.1);
    this.camera.far = d * 4 + 4;
    this.camera.updateProjectionMatrix();
  }

  _animate(dt) {
    const rig = this.rig, n = rig.nodes, t = this.t;
    poseSurvivor(rig, 0, 0, false, false);
    // breathing, weight on one leg, arms hanging loose
    const br = Math.sin(t * 1.75);
    n.chest.rotation.x = br * 0.022 - 0.02;
    n.hips.position.y = 0.94 + br * 0.004;
    n.hips.rotation.y = Math.sin(t * 0.37) * 0.05;
    n.hips.rotation.z = Math.sin(t * 0.29) * 0.018;
    n.shL.rotation.z = -0.07 - br * 0.012;
    n.shR.rotation.z = 0.07 + br * 0.012;
    n.shL.rotation.x = Math.sin(t * 0.8) * 0.03;
    n.shR.rotation.x = -Math.sin(t * 0.8 + 1) * 0.03;
    n.elL.rotation.x = n.elR.rotation.x = -0.18;
    n.thL.rotation.x = 0.02;
    n.thR.rotation.x = -0.04;
    n.knR.rotation.x = 0.06;

    // the head: follows your pointer for a while, otherwise looks around (and at you after an echo)
    const L = this.look;
    if (this.t - L.at < 3.5) {
      const p = this._lookFromPointer();
      L.wantYaw = p.yaw;
      L.wantPitch = p.pitch;
    } else {
      const w = this.wander;
      w.t -= dt;
      if (w.t <= 0) {
        w.t = 1.6 + Math.random() * 2.8;
        const toCam = this._camYawLocal();
        const atYou = this.t - this.pingStart < 2.5 || Math.random() < 0.35;
        w.yaw = atYou ? toCam : clamp(toCam + (Math.random() - 0.5) * 1.6, -0.9, 0.9);
        w.pitch = (Math.random() - 0.6) * 0.25;
      }
      L.wantYaw = w.yaw;
      L.wantPitch = w.pitch;
    }
    L.yaw = damp(L.yaw, L.wantYaw, 5, dt);
    L.pitch = damp(L.pitch, L.wantPitch, 5, dt);
    n.head.rotation.y = L.yaw * 0.75;
    n.head.rotation.x = L.pitch;
    n.chest.rotation.y = L.yaw * 0.2;

    // gestures
    const g = this.gesture;
    if (g) {
      g.t += dt;
      const len = GESTURE_LEN[g.type];
      const x = g.t / len;
      if (x >= 1) this.gesture = null;
      else this._gesture(g.type, x, n);
    }
    this._crow(dt);
  }

  // the arm nearer the viewer does the showing
  _nearArm() {
    return Math.sin(this.orbit.yaw) >= 0 ? 'R' : 'L';
  }

  // two-bone IK: put a hand (A = 'L' | 'R') at H (chest space), elbow toward `pole`, blended in by k
  _reach(A, H, pole, k) {
    if (k <= 0.001) return;
    const n = this.rig.nodes, sh = n['sh' + A], el = n['el' + A];
    const S = sh.position;
    const L1 = el.position.length(), L2 = 0.31; // shoulder → elbow, elbow → hand
    const D = _v1.copy(H).sub(S);
    const d = clamp(D.length(), 0.05, L1 + L2 - 0.002);
    const u = D.normalize();
    const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const v = _v2.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
    const E = _v3.copy(S).addScaledVector(u, L1 * Math.cos(a)).addScaledVector(v, L1 * Math.sin(a));
    _q1.setFromUnitVectors(_v4.copy(el.position).normalize(), _v5.copy(E).sub(S).normalize());
    sh.quaternion.slerp(_q1, k);
    // the forearm, in the shoulder's (blended) frame
    const f = _v5.copy(H).sub(E).normalize().applyQuaternion(_q2.copy(sh.quaternion).invert());
    _q1.setFromUnitVectors(FORE_DIR, f);
    el.quaternion.slerp(_q1, k);
  }

  _gesture(type, x, n) {
    const A = this._nearArm();
    const s = A === 'R' ? 1 : -1;
    const head = n.head.position; // (chest space)
    if (type === 'hat') {
      // a hand up to the hat: settle it, a little tug
      const k = bell(x, 0.3, 0.32);
      const tug = Math.sin(clamp((x - 0.3) / 0.4, 0, 1) * Math.PI * 2) * 0.018;
      const t = HAT_TOUCH[this.fit.head] || HAT_TOUCH.hood;
      _h.set(head.x + s * t[0], head.y + t[1] + tug, head.z + t[2]);
      this._reach(A, _h, _p.set(s, -0.55, 0.35), k);
      n.head.rotation.x += -0.1 * k;
      n.head.rotation.z = -s * 0.08 * k;
    } else if (type === 'body') {
      // hands on the hips, a turn this way and that: "well?"
      const k = bell(x, 0.24, 0.3);
      for (const [B, t] of [['L', -1], ['R', 1]]) this._reach(B, _h.set(t * 0.205, 0.0, 0.05), _p.set(t, 0.15, -0.6), k);
      n.chest.rotation.y += Math.sin(x * Math.PI * 2) * 0.24 * k;
      n.head.rotation.x = lerp(n.head.rotation.x, 0.3, k * 0.7);
      n.hips.position.y += Math.max(0, Math.sin(x * Math.PI * 3)) * 0.01 * k;
    } else if (type === 'wave') {
      const k = bell(x, 0.2, 0.25);
      const w = Math.sin(x * Math.PI * 6) * 0.07;
      this._reach(A, _h.set(s * (0.44 + w), 0.98, 0.1), _p.set(s, -0.7, -0.1), k);
      n.head.rotation.z = -s * 0.07 * k;
    } else if (type === 'startle') {
      // something out there: it flinches, hands up to the face, and hunches
      const k = bell(x, 0.1, 0.6);
      n.chest.rotation.x += 0.22 * k;
      for (const [B, t] of [['L', -1], ['R', 1]]) this._reach(B, _h.set(head.x + t * 0.1, head.y - 0.08, head.z + 0.24), _p.set(t, -1, 0), k);
      n.hips.position.y -= 0.05 * k;
      n.thL.rotation.x -= 0.2 * k;
      n.thR.rotation.x -= 0.2 * k;
      n.knL.rotation.x += 0.4 * k;
      n.knR.rotation.x += 0.4 * k;
    }
  }

  _crow(dt) {
    const n = this.rig.nodes;
    if (!n.crow) return;
    const c = this.crow;
    c.t -= dt;
    if (c.t <= 0) {
      // crows don't turn their heads, they snap them
      c.t = 0.25 + Math.random() * 1.4;
      c.yaw = (Math.random() - 0.5) * 2.2;
      c.tilt = (Math.random() - 0.5) * 0.7;
    }
    n.crowHead.rotation.y = damp(n.crowHead.rotation.y, c.yaw, 30, dt);
    n.crowHead.rotation.z = damp(n.crowHead.rotation.z, c.tilt, 30, dt);
    n.crow.rotation.y = Math.sin(this.t * 0.5) * 0.15;
  }

  // the viewer's direction as a head yaw (the rig faces +z)
  _camYawLocal() {
    return clamp(Math.atan2(this.camera.position.x, this.camera.position.z), -0.9, 0.9);
  }

  _lookFromPointer() {
    const L = this.look;
    const cam = this.camera;
    const v = new THREE.Vector3(L.nx, L.ny, 0.5).unproject(cam).sub(cam.position).normalize();
    const head = this.rig.nodes.head.getWorldPosition(new THREE.Vector3());
    // the point the pointer marks about a metre out of the screen from the figure
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    const plane = head.clone().addScaledVector(fwd, -Math.min(1.1, cam.position.distanceTo(head) * 0.6));
    const tt = plane.clone().sub(cam.position).dot(fwd) / Math.max(0.05, v.dot(fwd));
    const P = cam.position.clone().addScaledVector(v, tt).sub(head);
    return { yaw: clamp(Math.atan2(P.x, P.z), -0.95, 0.95), pitch: clamp(-Math.atan2(P.y, Math.hypot(P.x, P.z)), -0.45, 0.5) };
  }

  _glow(rig, u, t, on) {
    if (!on) {
      u.uGlow.value.w = 0;
      return;
    }
    const h = rig.nodes.head;
    h.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(0, -0.02, 0.18).applyMatrix4(h.matrixWorld);
    const fl = rig.fit.head === 'pumpkin' ? 0.55 + 0.12 * Math.sin(t * 11) * Math.sin(t * 6.1) : 0.22;
    u.uGlow.value.set(p.x, p.y, p.z, fl * (u.uFade ? u.uFade.value : 1));
  }

  // where to hang a name label: just over the head, in CSS pixels of the canvas (null when off-screen)
  headScreen(lift = 0.36) {
    if (!this.rig || !this.w) return null;
    const v = this.rig.nodes.head.getWorldPosition(new THREE.Vector3());
    v.y += lift;
    v.project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * this.w, y: (-v.y * 0.5 + 0.5) * this.h };
  }

  // ---------------- the stage: your hands ----------------
  _bindPointer() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'stage' || (e.button !== undefined && e.button > 0)) return;
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
      if (this.ptrs.size >= 2) {
        const pd = this._pinchDist();
        if (this.pinch > 0 && pd > 0) o.zoom = clamp(o.zoom * (this.pinch / pd), 0.55, 1.5);
        this.pinch = pd;
        return;
      }
      const k = 0.009;
      o.yaw -= dx * k;
      o.pitch = clamp(o.pitch + dy * 0.005, -0.25, 0.75);
      o.vyaw = o.vyaw * 0.6 + (-dx * k * 60) * 0.4;
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
      if (this.mode !== 'stage') return;
      e.preventDefault();
      const o = this.orbit;
      o.zoom = clamp(o.zoom * Math.exp(e.deltaY * 0.0012), 0.55, 1.5);
      o.idle = 0;
    }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _pinchDist() {
    const a = [...this.ptrs.values()];
    return a.length >= 2 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0;
  }

  // ---------------- stills for the item cards ----------------
  // draws `fit` into a 2D canvas: slot 'head' = a portrait, 'body' = the whole figure
  still(fitIn, slot, canvas) {
    const fit = cleanFit(fitIn);
    const W = canvas.width, H = canvas.height;
    if (W < 2 || H < 2) return;
    const SS = 2; // supersampled, then scaled down
    const rw = W * SS, rh = H * SS;
    if (!this.rt || this.rt.width !== rw || this.rt.height !== rh) {
      if (this.rt) this.rt.dispose();
      this.rt = new THREE.WebGLRenderTarget(rw, rh, { depthBuffer: true });
      this._px = new Uint8Array(rw * rh * 4);
      this._c2 = document.createElement('canvas');
      this._c2.width = rw;
      this._c2.height = rh;
    }
    const key = shapeKey(fit);
    let rig = this.trigs.get(key);
    if (!rig) {
      rig = dressRig(fit, this.tmat);
      this.trigs.set(key, rig);
    }
    for (const r of this.trigs.values()) r.root.visible = r === rig;
    if (!rig.root.parent) this.tscene.add(rig.root);
    rig.fit = fit;
    const n = rig.nodes;
    poseSurvivor(rig, 0, 0, false, false);
    n.shL.rotation.z = -0.1;
    n.shR.rotation.z = 0.1;
    n.head.rotation.y = 0.18;
    if (n.crowHead) n.crowHead.rotation.y = 0.6;
    const tu = this.tu;
    dyeColors(fit, tu.uDye.value);
    tu.uGlowCol.value.copy(tu.uDye.value[1]);
    tu.uOpaque.value = 1;
    tu.uFade.value = 1;
    tu.uHover.value = 0;
    tu.uKey.value = 1.0;
    tu.uAmb.value = 0.32;
    tu.uTime.value = 1.3;
    tu.uPing.value.set(0, 0, 0, -1e4);
    const cam = this.tcam;
    cam.aspect = W / H;
    const head = slot === 'head';
    const yaw = head ? 0.42 : 0.38;
    const ty = head ? 1.7 : 0.98;
    const hh = head ? 0.58 : 2.06;
    const d = (hh * 0.5) / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    cam.position.set(Math.sin(yaw) * d, ty + 0.03 * d, Math.cos(yaw) * d);
    cam.lookAt(0, ty, 0);
    cam.near = 0.05;
    cam.far = d * 4;
    cam.updateProjectionMatrix();
    tu.uCam.value.copy(cam.position);
    tu.uKeyPos.value.set(1.4, 2.4, 2.4);
    tu.uNoise.value = head ? 60 : 26;
    tu.uGroundR.value = 0.95;
    this.tground.visible = !head;
    const hi = item(fit.head);
    this._glow(rig, tu, 1.3, !!(hi && hi.glow));

    const r = this.renderer;
    const prevClear = r.getClearColor(new THREE.Color());
    const prevAlpha = r.getClearAlpha();
    r.setRenderTarget(this.rt);
    r.setClearColor(0x0b0908, 1);
    r.clear();
    r.render(this.tscene, cam);
    r.readRenderTargetPixels(this.rt, 0, 0, rw, rh, this._px);
    r.setRenderTarget(null);
    r.setClearColor(prevClear, prevAlpha);
    // flip (GL rows run bottom-up) and shrink
    const c2 = this._c2.getContext('2d');
    const img = c2.createImageData(rw, rh);
    const row = rw * 4;
    for (let y = 0; y < rh; y++) img.data.set(this._px.subarray((rh - 1 - y) * row, (rh - y) * row), y * row);
    c2.putImageData(img, 0, 0);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this._c2, 0, 0, W, H);
  }
}
