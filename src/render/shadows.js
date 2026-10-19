// Omni shadows: walls stop light. Every small light (glow sticks, the first-aid hut's lanterns) and every work
// lamp gets a row in one RGBA8 atlas: six square tiles, one per cube face, each texel holding how far from the
// light the nearest thing is in that direction (16 bits over the light's reach). The world, the people and the
// dust motes look into it (sonar.js: omniShadow) — so the lantern inside the hut lights the hut, spills out of
// the doorway and the two little windows, and nothing else.
//
// What casts shadows: everything built into the forest's chunks except the ground itself (trees, rocks,
// cabins, the fence...) plus whatever moves and registers itself (doors, the yard's gate, the УАЗ).
// A light's faces are redrawn only when it moves, when the light in its slot changes, or when something that
// moves near it moved — a lantern on a wall costs six small draws once, not every frame.
import * as THREE from 'three';
import { shared, shadowLights, GLOW_SLOTS, LAMP_SLOTS, SHADOW_TILE, SHADOW_ROWS } from './sonar.js';

const T = SHADOW_TILE;
const MAX_FACES = 30; // redraws per frame for lights that only drifted a little (a new light always draws at once)
// the six faces: which way the camera looks, which way is up (matches shTap in sonar.js)
const FACES = [
  [[1, 0, 0], [0, 1, 0]],
  [[-1, 0, 0], [0, 1, 0]],
  [[0, 1, 0], [0, 0, 1]],
  [[0, -1, 0], [0, 0, -1]],
  [[0, 0, 1], [0, 1, 0]],
  [[0, 0, -1], [0, 1, 0]],
].map(([d, u]) => [new THREE.Vector3(...d), new THREE.Vector3(...u)]);

const VERT = /* glsl */ `
attribute vec4 data;
varying vec3 vW;
varying float vK;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vK = floor(data.w * 255.0 + 0.5);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
uniform vec3 uL;
uniform float uInvR;
uniform float uNear;
varying vec3 vW;
varying float vK;
void main() {
  if (abs(vK - 50.0) < 0.5) discard; // chain-link: light goes through it
  float d = length(vW - uL);
  if (d < uNear) discard; // the lamp's own cage, its shade, the hand that holds it
  float v = clamp(d * uInvR, 0.0, 0.99999);
  float hi = floor(v * 255.0) / 255.0;
  gl_FragColor = vec4(hi, fract(v * 255.0), 0.0, 1.0);
}`;

const _t = new THREE.Vector3();
const _white = new THREE.Color(1, 1, 1);
const _keep = new THREE.Color();

export class OmniShadows {
  constructor(renderer) {
    this.r = renderer;
    this.rt = new THREE.WebGLRenderTarget(6 * T, SHADOW_ROWS * T, {
      type: THREE.UnsignedByteType, format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      generateMipmaps: false, depthBuffer: true, stencilBuffer: false,
    });
    this.rt.texture.colorSpace = THREE.NoColorSpace;
    shared.uShadowMap.value = this.rt.texture;
    this.scene = new THREE.Scene();
    this.scene.matrixWorldAutoUpdate = false;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uL: { value: new THREE.Vector3() }, uInvR: { value: 0.1 }, uNear: { value: 0.1 } },
      vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide,
    });
    this.cam = new THREE.PerspectiveCamera(90, 1, 0.02, 10);
    this.slots = Array.from({ length: SHADOW_ROWS }, () => ({ x: 0, y: 0, z: 0, R: 0, near: 0, frame: -1, valid: false }));
    this.dyn = [];
    this.frame = 0;
    this.enabled = true;
    this.faces = 0; // drawn this frame (for the fps overlay / tests)
    this._cleared = false;
  }

  // a chunk's props (ground excluded): drawn as they are, forever
  addStatic(geo) {
    const m = new THREE.Mesh(geo, this.mat);
    m.matrixAutoUpdate = false;
    m.updateMatrixWorld(true);
    this.scene.add(m);
    return m;
  }

  // something that moves: a mesh in the main scene (its own world matrix is followed every frame).
  // r = how far its geometry reaches from its origin (to know which lights it can matter to)
  addDynamic(src, r = null) {
    const geo = src.geometry;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, this.mat);
    m.matrixAutoUpdate = false;
    m.frustumCulled = true;
    this.scene.add(m);
    const d = { src, mesh: m, r: r ?? geo.boundingSphere.radius + geo.boundingSphere.center.length(), last: new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), vis: null, changed: 0, c: new THREE.Vector3() };
    this.dyn.push(d);
    return d;
  }

  removeDynamic(src) {
    const i = this.dyn.findIndex((d) => d.src === src);
    if (i < 0) return;
    this.scene.remove(this.dyn[i].mesh);
    this.dyn.splice(i, 1);
  }

  _visible(o) {
    for (let p = o; p; p = p.parent) if (!p.visible) return false;
    return !!o.parent || o.isScene;
  }

  // everything's shadows up to date for this frame (before the forest is drawn). cam: the viewer (who gets
  // their nearby lights first when there's a queue)
  update(cam) {
    this.frame++;
    this.faces = 0;
    const F = this.frame;
    for (const d of this.dyn) {
      const s = d.src;
      s.updateWorldMatrix(true, false);
      const vis = this._visible(s);
      if (vis !== d.vis || !d.last.equals(s.matrixWorld)) {
        d.last.copy(s.matrixWorld);
        d.mesh.matrixWorld.copy(s.matrixWorld);
        d.mesh.visible = vis;
        if (d.vis !== null || vis) d.changed = F;
        d.vis = vis;
        d.c.setFromMatrixPosition(s.matrixWorld);
      }
    }
    const UG = shared.uShG.value, UL = shared.uShL.value;
    if (!this.enabled) {
      for (const u of UG) u.w = 0;
      for (const u of UL) u.w = 0;
      for (const s of this.slots) s.valid = false;
      return;
    }
    const urgent = [], later = [];
    for (let row = 0; row < SHADOW_ROWS; row++) {
      const L = row < GLOW_SLOTS ? shadowLights.glow[row] : shadowLights.lamp[row - GLOW_SLOTS];
      const U = row < GLOW_SLOTS ? UG[row] : UL[row - GLOW_SLOTS];
      const s = this.slots[row];
      if (!L || !(L.R > 0.05) || !Number.isFinite(L.x + L.y + L.z)) {
        s.valid = false;
        U.w = 0;
        continue;
      }
      const moved = s.valid ? Math.hypot(L.x - s.x, L.y - s.y, L.z - s.z) : Infinity;
      let dyn = false;
      if (s.valid) {
        for (const d of this.dyn) {
          if (d.changed > s.frame && d.c.distanceTo(_t.set(L.x, L.y, L.z)) < L.R + d.r) {
            dyn = true;
            break;
          }
        }
      }
      if (!(moved > 0.012 || Math.abs(L.R - s.R) > 0.01 || Math.abs((L.near || 0) - s.near) > 0.001 || dyn)) continue;
      const job = { row, L, U, s };
      if (!s.valid || moved > 0.6 || Math.abs(L.R - s.R) > 0.5) urgent.push(job);
      else {
        job.k = cam ? Math.hypot(L.x - cam.position.x, L.y - cam.position.y, L.z - cam.position.z) : 0;
        later.push(job);
      }
    }
    if (!urgent.length && !later.length) return;
    later.sort((a, b) => a.k - b.k);
    const r = this.r;
    const prevTarget = r.getRenderTarget();
    r.getClearColor(_keep);
    const keepA = r.getClearAlpha();
    r.setClearColor(_white, 1);
    if (!this._cleared) {
      // the first time: the whole atlas to "nothing in the way"
      this.rt.scissorTest = false;
      this.rt.viewport.set(0, 0, 6 * T, SHADOW_ROWS * T);
      r.setRenderTarget(this.rt);
      r.clear(true, true, false);
      this._cleared = true;
    }
    for (const j of urgent) this._draw(j);
    for (const j of later) {
      if (this.faces + 6 > MAX_FACES) break;
      this._draw(j);
    }
    this.rt.scissorTest = false;
    r.setRenderTarget(prevTarget);
    r.setClearColor(_keep, keepA);
  }

  _draw({ row, L, U, s }) {
    const r = this.r, cam = this.cam, rt = this.rt;
    const near = L.near || 0;
    const u = this.mat.uniforms;
    u.uL.value.set(L.x, L.y, L.z);
    u.uInvR.value = 1 / L.R;
    u.uNear.value = near;
    cam.near = Math.max(0.01, Math.min(near * 0.5, 0.05));
    cam.far = L.R;
    cam.updateProjectionMatrix();
    rt.scissorTest = true;
    for (let f = 0; f < 6; f++) {
      const [D, Up] = FACES[f];
      cam.position.set(L.x, L.y, L.z);
      cam.up.copy(Up);
      cam.lookAt(_t.set(L.x + D.x, L.y + D.y, L.z + D.z));
      cam.updateMatrixWorld(true);
      rt.viewport.set(f * T, row * T, T, T);
      rt.scissor.set(f * T, row * T, T, T);
      r.setRenderTarget(rt);
      r.clear(true, true, false);
      r.render(this.scene, cam);
    }
    this.faces += 6;
    s.x = L.x;
    s.y = L.y;
    s.z = L.z;
    s.R = L.R;
    s.near = near;
    s.valid = true;
    s.frame = this.frame;
    U.set(L.x, L.y, L.z, L.R);
  }
}
