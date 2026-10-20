// The camp fire. The one warm thing in the forest, and where the shift begins: it is burning when the
// departure film lets go of the camera, it lights the faces around it, and by the time the first night
// starts it is out (see game/intro.js).
//
// Three cheap layers, no textures beyond one soft blob for the smoke:
//   · flames    — a handful of crossed blades in one additive shader, swaying and eating at themselves
//   · embers    — points rising out of the coals, animated entirely on the GPU
//   · smoke     — five soft sprites climbing and drifting, the column you can see from the sky
// Its light is one of the small lights (shared.uGlow, see GlowSticks.lightSources), so it lights the
// world, the people around it and their faces the same way a glow stick does.
import * as THREE from 'three';
import { shared } from '../render/sonar.js';
import { clamp, lerp, smoothstep } from '../core/rng.js';

const FIRE_C = [1.0, 0.52, 0.2]; // ember orange
const FIRE_R = 13; // m of reach
const FIRE_Y = 0.55; // the light sits in the flames, not on the ground

const FLAME_VERT = /* glsl */ `
  attribute float aPhase;
  attribute vec2 aUv;
  uniform float uTime;
  uniform float uLit;
  varying vec2 vUv;
  varying float vPh;
  void main() {
    vUv = aUv;
    vPh = aPhase;
    vec3 p = position;
    float t = uTime;
    float h = aUv.y * aUv.y;
    // the tip leans and curls on its own; the base stays in the coals
    p.x += (sin(t * 2.3 + aPhase * 6.3) * 0.07 + sin(t * 5.3 + aPhase * 2.1) * 0.03) * h;
    p.z += (cos(t * 1.9 + aPhase * 5.1) * 0.05 + sin(t * 3.7 + aPhase * 7.7) * 0.02) * h;
    p.y *= 0.6 + 0.4 * uLit;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FLAME_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uLit;
  varying vec2 vUv;
  varying float vPh;
  void main() {
    float y = vUv.y;
    float edge = smoothstep(0.0, 0.24, vUv.x) * smoothstep(1.0, 0.76, vUv.x);
    float body = edge * pow(max(1.0 - y, 0.0), 0.6) * smoothstep(0.0, 0.1, y);
    float flick = 0.72 + 0.28 * sin(uTime * 13.0 + vPh * 12.0) * sin(uTime * 6.7 + vPh * 3.0);
    vec3 hot = vec3(1.0, 0.82, 0.46);
    vec3 mid = vec3(1.0, 0.47, 0.11);
    vec3 tip = vec3(0.34, 0.06, 0.01);
    vec3 col = mix(hot, mid, smoothstep(0.04, 0.5, y));
    col = mix(col, tip, smoothstep(0.5, 1.0, y));
    float a = body * flick * uLit;
    if (a < 0.004) discard;
    // additive blending multiplies by alpha as well, so writing a here squared it and the flames
    // went out long before the fire did: keep alpha at 1 and let a do all of the dying
    gl_FragColor = vec4(col * a, 1.0);
  }
`;

const EMBER_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uLit;
  varying float vA;
  void main() {
    float life = fract(aSeed.w + uTime * (0.1 + aSeed.x * 0.12));
    float spread = 1.0 + life * 2.6;
    vec3 p = vec3(
      sin(aSeed.x * 6.283 + life * 5.4) * (0.1 + life * 0.42) * spread * 0.4,
      life * (1.1 + aSeed.y * 1.9),
      cos(aSeed.y * 6.283 + life * 4.2) * (0.1 + life * 0.42) * spread * 0.4
    );
    vA = uLit * (1.0 - life) * smoothstep(0.0, 0.06, life);
    gl_PointSize = 1.6 + aSeed.z * 3.4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const EMBER_FRAG = /* glsl */ `
  varying float vA;
  void main() {
    float r = 1.0 - smoothstep(0.06, 0.5, length(gl_PointCoord - 0.5));
    float a = vA * r;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0, 0.62, 0.22) * a * 1.7, a);
  }
`;

function softBlobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.32)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Campfire {
  constructor(game) {
    this.g = game;
    this.x = 0;
    this.z = 0;
    this.y = game.world.terrain.height(0, 0);
    this.t = 0;
    this.lit = 0; // 0 out, 1 roaring
    this.ember = 0; // what is left of it: the coals
    this.I = 0;
    this.group = new THREE.Group();
    this.group.position.set(this.x, this.y, this.z);
    game.scene.add(this.group);
    this._buildFlames();
    this._buildEmbers();
    this._buildSmoke();
  }

  _buildFlames() {
    const blades = 7;
    const pos = [], uv = [], phase = [];
    const vert = (x, y, z, u, v, ph) => {
      pos.push(x, y, z);
      uv.push(u, v);
      phase.push(ph);
    };
    for (let i = 0; i < blades; i++) {
      const a = (i / blades) * Math.PI * 2 + (i % 2) * 0.4;
      const ca = Math.cos(a), sa = Math.sin(a);
      const w = 0.3 - (i % 3) * 0.04;
      const h = 0.85 + (i % 4) * 0.16;
      const ph = i / blades;
      const P = (x, y) => [ca * x, y, sa * x];
      const bl = P(-w, 0), br = P(w, 0), tl = P(-w * 0.16, h), tr = P(w * 0.16, h);
      vert(...bl, 0, 0, ph);
      vert(...br, 1, 0, ph);
      vert(...tr, 1, 1, ph);
      vert(...bl, 0, 0, ph);
      vert(...tr, 1, 1, ph);
      vert(...tl, 0, 1, ph);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute('aUv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(phase), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uLit: { value: 1 } },
      vertexShader: FLAME_VERT,
      fragmentShader: FLAME_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.flames = new THREE.Mesh(geo, mat);
    this.flames.frustumCulled = false;
    this.flames.renderOrder = 6;
    this.flames.position.y = 0.18;
    this.group.add(this.flames);
    // the bloom of the fire on the air: one soft additive sprite, cheap and no post pass needed
    const gm = new THREE.SpriteMaterial({
      map: softBlobTexture(), color: 0xff8a2e, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    this.glow = new THREE.Sprite(gm);
    this.glow.position.y = 0.44;
    this.glow.scale.set(2.4, 2.4, 1);
    this.glow.renderOrder = 4;
    this.group.add(this.glow);
  }

  _buildEmbers() {
    const n = 34;
    const seeds = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) seeds[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uLit: { value: 1 } },
      vertexShader: EMBER_VERT,
      fragmentShader: EMBER_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.embers = new THREE.Points(geo, mat);
    this.embers.frustumCulled = false;
    this.embers.renderOrder = 7;
    this.group.add(this.embers);
  }

  _buildSmoke() {
    const tex = softBlobTexture();
    this.tex = tex;
    this.smoke = [];
    for (let i = 0; i < 5; i++) {
      const m = new THREE.SpriteMaterial({ map: tex, color: 0x8a8478, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.userData.seed = i / 5;
      s.renderOrder = 5;
      this.group.add(s);
      this.smoke.push(s);
    }
    // the steam of a doused fire: a short burst of fat white puffs
    this.puffT = 0;
    this.puffK = 0;
    this.steam = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.SpriteMaterial({ map: tex, color: 0xbdb8ae, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.userData.seed = Math.random();
      s.userData.a = Math.random() * Math.PI * 2;
      s.userData.r = 0.15 + Math.random() * 0.4;
      s.renderOrder = 6;
      this.group.add(s);
      this.steam.push(s);
    }
    // the pouring water: a dozen points of beaded spray, each on its own place in the arc
    this.streamK = 0;
    this.streamFrom = new THREE.Vector3();
    this._dropN = 14;
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this._dropN * 3), 3));
    dg.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(this._dropN), 1));
    this._dropPos = dg.attributes.position;
    const dm = new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 }, uPix: { value: 9 } },
      vertexShader: /* glsl */ `
        attribute float aU;
        uniform float uK;
        uniform float uPix;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp((0.075 + 0.03 * sin(aU * 3.14159)) * uPix / max(-mv.z, 0.35), 1.5, 22.0);
          vA = uK * smoothstep(0.0, 0.1, aU) * (1.0 - smoothstep(0.8, 1.0, aU));
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float r = 1.0 - smoothstep(0.08, 0.5, length(gl_PointCoord - 0.5));
          float a = vA * r * 0.75;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(0.74, 0.86, 0.94) * a, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._drops = new THREE.Points(dg, dm);
    this._drops.frustumCulled = false;
    this._drops.renderOrder = 7;
    this._drops.visible = false;
    this.group.add(this._drops);
    this._dropU = new Float32Array(this._dropN);
    for (let i = 0; i < this._dropN; i++) this._dropU[i] = i / this._dropN;
  }

  // one parabola from the lip of the pot down into the coals (called every frame the pour is happening)
  _stream(dt) {
    const k = this.streamK;
    const pts = this._drops;
    const g = this.group, from = this.streamFrom;
    pts.visible = k > 0.01;
    pts.material.uniforms.uK.value = k;
    if (!pts.visible) { this.streamK = 0; return; }
    const arr = this._dropPos.array, au = pts.geometry.attributes.aU.array;
    for (let i = 0; i < this._dropN; i++) {
      let u = (this._dropU[i] + dt * 1.5) % 1;
      this._dropU[i] = u;
      au[i] = u;
      // from the lip of the pot to the coals: a parabola that lifts a little and then drops in, all of
      // it in the fire's own space, so it follows the group wherever it sits
      const x = lerp(from.x, this.x, u);
      const z = lerp(from.z, this.z, u);
      const y0 = from.y - this.y;
      const y = lerp(y0, 0.06, u) + Math.sin(u * Math.PI) * 0.2;
      arr[i * 3] = x - g.position.x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z - g.position.z;
    }
    this._dropPos.needsUpdate = true;
    pts.geometry.attributes.aU.needsUpdate = true;
    this.streamK = Math.max(0, k - dt * 4); // goes out the moment the pot comes up
  }

  // the pixels per world metre at one metre (the droplets are ordered points: their size is in metres)
  placeCamera(camera) {
    if (!this._drops) return;
    const proj = camera.projectionMatrix.elements[5] || 1; // 1/tan(fov/2)
    const h = (this.g && this.g._bufferH) || (typeof innerHeight === 'number' ? innerHeight : 720);
    this._drops.material.uniforms.uPix.value = proj * h * 0.5;
  }

  // the water: a handful of droplets on one parabola from the pot's lip into the coals. `from` is the
  // world point the pot is pouring from, `k` 0..1 how hard (0 puts the stream away)
  stream(from, k = 1) {
    if (!this._drops) return;
    this.streamK = clamp(k, 0, 1);
    if (from) this.streamFrom.copy(from);
  }

  // water hits the coals: a hiss you can see
  puff(k = 1) {
    this.puffT = 1.7;
    this.puffK = Math.max(this.puffK, k);
  }

  // a new run: the fire is alive again
  reset() {
    this.t = 0;
    this.lit = 1;
    this.ember = 1;
    this.I = 1.3;
    this.group.visible = true;
    this.puffT = 0;
    for (const s of this.smoke) s.material.opacity = 0;
    for (const s of this.steam) s.material.opacity = 0;
  }

  // k 0..1: how much of it is still burning (see the intro's dousing)
  douse(k) {
    this.lit = clamp(k, 0, 1);
    this.ember = Math.max(this.ember, this.lit * 0.9);
  }

  // the fire is finished; only the coals are left, and they fade over the next minutes
  out() {
    this.lit = 0;
    this.ember = Math.max(this.ember, 0.55);
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    this.ember = Math.max(0, this.ember - dt * 0.009);
    // a fire does not burn evenly: three sines that never line up again
    const flick = 0.8 + 0.13 * Math.sin(t * 9.7) + 0.07 * Math.sin(t * 21.3 + 1.7) + 0.05 * Math.sin(t * 41.7 + 0.3);
    // (2.1k: the embers used to give 0.11 — so the first night began with the player standing in a
    // light that no shader could see. The coals now keep a small warm pool for the first minute, then go.)
    this.I = this.lit * Math.max(0.25, flick) * 1.35 + this.ember * (0.55 + 0.12 * Math.sin(t * 1.7));
    const on = this.lit > 0.01;
    this.flames.visible = on;
    this.embers.visible = on || this.ember > 0.05;
    this.flames.material.uniforms.uLit.value = this.lit;
    this.embers.material.uniforms.uLit.value = Math.max(this.lit, this.ember * 0.5);
    this.flames.scale.setScalar((0.62 + 0.04 * Math.sin(t * 3.1) + 0.13 * this.lit));
    this.glow.material.opacity = (0.34 * this.lit + 0.3 * this.ember) * (0.86 + 0.14 * Math.sin(t * 7.3));
    this.glow.scale.setScalar(1.5 + 0.45 * this.lit + 0.07 * Math.sin(t * 5.1));
    this.glow.material.color.setRGB(1, 0.5 + 0.12 * this.lit, 0.18 + 0.06 * this.lit);
    // smoke: a slow column that leans with the same wind the trees move in
    const day = shared.uDawn.value;
    for (const s of this.smoke) {
      const u = (s.userData.seed + t * 0.055) % 1;
      const lift = u * 4.6;
      const drift = Math.sin(t * 0.3 + s.userData.seed * 6.3) * 0.35 + u * u * 1.4;
      s.position.set(drift * 0.6, 0.5 + lift, drift * 0.25);
      const grow = 0.7 + u * 2.6;
      s.scale.set(grow, grow * 1.15, 1);
      const fade = Math.sin(Math.min(1, u) * Math.PI) * (1 - u * 0.35);
      s.material.opacity = fade * 0.13 * this.lit * (0.55 + 0.45 * day);
    }
    this._stream(dt);
    // and the steam of the dousing
    this.puffT = Math.max(0, this.puffT - dt);
    const pk = this.puffT > 0 ? 1 - this.puffT / 1.7 : 0;
    for (const s of this.steam) {
      if (this.puffT <= 0) { s.material.opacity = 0; continue; }
      const u = clamp(pk + s.userData.seed * 0.4, 0, 1);
      const rise = u * 2.2;
      s.position.set(Math.cos(s.userData.a) * s.userData.r * (1 + u * 2.4), 0.35 + rise, Math.sin(s.userData.a) * s.userData.r * (1 + u * 2.4));
      const grow = 0.3 + u * 1.35;
      s.scale.set(grow, grow, 1);
      s.material.opacity = Math.sin(Math.min(1, u) * Math.PI) * 0.2 * this.puffK;
    }
  }

  // one of the small lights: shared with the glow sticks (see GlowSticks.lightSources)
  lightSource(out) {
    if (this.I < 0.02) return;
    out.push({ x: this.x, y: this.y + FIRE_Y, z: this.z, I: this.I, c: FIRE_C, R: FIRE_R, prio: 0, near: 0.25, id: this });
  }
}
