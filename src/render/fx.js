// ============================================================
// FX — particles, camera rig (bob / shake / fov kick), procedural
// jumpscare faces, and the optional bloom composer.
// ============================================================
import * as THREE from 'three';
import { clamp, damp, lerp, TAU } from '../core/util.js';

// ------------------------------------------------------------------ particles
const P_VERT = /* glsl */`
attribute vec3 aCol;
attribute float aSize;
attribute float aLife;
uniform float uPix;
varying vec3 vCol;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 0.4);
  gl_PointSize = aSize * uPix * (170.0 / dist);
  gl_Position = projectionMatrix * mv;
  vCol = aCol;
  vA = aLife;
  if (aLife <= 0.001) gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
}
`;
const P_FRAG = /* glsl */`
varying vec3 vCol;
varying float vA;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float a = smoothstep(0.25, 0.01, d) * clamp(vA, 0.0, 1.0);
  gl_FragColor = vec4(vCol * a * (0.6 + vA), a);
}
`;

export class Particles {
  constructor(max = 1600) {
    this.max = max;
    this.n = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.life = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.maxLife = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1));
    geo.setDrawRange(0, max);
    this.geo = geo;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uPix: { value: 1 } },
      vertexShader: P_VERT, fragmentShader: P_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
  }
  spawn(x, y, z, vx, vy, vz, life, size, r, g, b, drag = 2.2, grav = -3) {
    let i;
    if (this.n < this.max) { i = this.n++; }
    else { i = (Math.random() * this.max) | 0; }
    const i3 = i * 3;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.col[i3] = r; this.col[i3 + 1] = g; this.col[i3 + 2] = b;
    this.life[i] = 1; this.maxLife[i] = life;
    this.baseSize[i] = size; this.size[i] = size;
    this.drag[i] = drag; this.grav[i] = grav;
  }
  burst(x, y, z, o = {}) {
    const n = o.count ?? 14;
    const sp = o.speed ?? 4;
    const life = o.life ?? 0.8;
    const c = o.color ?? [0.5, 1, 0.85];
    const up = o.up ?? 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const e = (Math.random() - 0.3) * up;
      const s = sp * (0.35 + Math.random() * 0.9);
      this.spawn(
        x + (Math.random() - 0.5) * (o.jitter ?? 0.3),
        y + (Math.random() - 0.5) * (o.jitter ?? 0.3),
        z + (Math.random() - 0.5) * (o.jitter ?? 0.3),
        Math.cos(a) * s, e * s + (o.lift ?? 0), Math.sin(a) * s,
        life * (0.6 + Math.random() * 0.8), (o.size ?? 2.4) * (0.6 + Math.random()),
        c[0], c[1], c[2], o.drag ?? 2.4, o.grav ?? -2.4,
      );
    }
  }
  /** Sonic ring kicked up along the ground when you ping — pure juice. */
  ring(x, y, z, radius, color = [0.45, 1, 0.85], count = 46, ground) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + Math.random() * 0.08;
      const r = radius * (0.82 + Math.random() * 0.36);
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const py = ground ? ground(px, pz) + 0.12 : y;
      this.spawn(px, py, pz, Math.cos(a) * 1.4, 0.9 + Math.random(), Math.sin(a) * 1.4,
        0.55 + Math.random() * 0.5, 2.0 + Math.random() * 1.8, color[0], color[1], color[2], 2.8, -1.6);
    }
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const i3 = i * 3;
      if (this.life[i] <= 0) { this.size[i] = 0; continue; }
      const ml = this.maxLife[i];
      this.life[i] -= dt / ml;
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[i3] *= d; this.vel[i3 + 2] *= d;
      this.vel[i3 + 1] = this.vel[i3 + 1] * d + this.grav[i] * dt;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      const l = clamp(this.life[i], 0, 1);
      this.size[i] = this.baseSize[i] * (0.35 + l * 0.85);
      if (this.life[i] <= 0) this.size[i] = 0;
    }
    // compact occasionally so the pool does not stay full of dead slots
    if (this.n > this.max * 0.7) {
      let w = 0;
      for (let i = 0; i < this.n; i++) {
        if (this.life[i] > 0) {
          if (w !== i) {
            const a = w * 3, b = i * 3;
            this.pos[a] = this.pos[b]; this.pos[a + 1] = this.pos[b + 1]; this.pos[a + 2] = this.pos[b + 2];
            this.vel[a] = this.vel[b]; this.vel[a + 1] = this.vel[b + 1]; this.vel[a + 2] = this.vel[b + 2];
            this.col[a] = this.col[b]; this.col[a + 1] = this.col[b + 1]; this.col[a + 2] = this.col[b + 2];
            this.life[w] = this.life[i]; this.maxLife[w] = this.maxLife[i];
            this.size[w] = this.size[i]; this.baseSize[w] = this.baseSize[i];
            this.drag[w] = this.drag[i]; this.grav[w] = this.grav[i];
          }
          w++;
        }
      }
      this.n = w;
    }
    for (let i = this.n; i < this.max; i++) { this.life[i] = 0; this.size[i] = 0; }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aCol.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aLife.needsUpdate = true;
  }
  setPixelRatio(pr) { this.mat.uniforms.uPix.value = pr; }
  clear() { this.n = 0; }
}

// ------------------------------------------------------------------ camera rig
export class CameraRig {
  constructor(camera) {
    this.cam = camera;
    this.shake = 0; this.kick = 0; this.roll = 0;
    this.fovBase = camera.fov; this.fov = camera.fov;
    this.pos = new THREE.Vector3();
    this.smooth = new THREE.Vector3();
    this.deathT = -1;
    this.drift = 0;
    this.punch = new THREE.Vector3();
  }
  addShake(v) { this.shake = Math.min(2.2, this.shake + v); }
  addKick(v) { this.kick = Math.min(1.4, this.kick + v); }
  punchDir(x, y, z, amt) { this.punch.set(x, y, z).multiplyScalar(amt); }

  update(dt, player, game, opts = {}) {
    const cam = this.cam;
    const sens = opts.shakeEnabled === false ? 0 : 1;
    this.drift += dt;

    if (!player.alive) {
      this.deathT = this.deathT < 0 ? 0 : this.deathT + dt;
      const k = clamp(this.deathT / 1.5, 0, 1);
      const gy = game.world.heightAt(player.x, player.z);
      this.pos.set(player.x + Math.sin(player.hitDir) * k * 0.9, lerp(player.eye, gy + 0.45, k), player.z + Math.cos(player.hitDir) * k * 0.9);
      cam.position.copy(this.pos);
      cam.rotation.set(lerp(player.pitch, 0.62, k), player.yaw + Math.sin(this.drift * 0.6) * 0.05 * k, lerp(0, 1.15 * Math.sin(player.hitDir * 0.7), k));
      this.fov = damp(this.fov, this.fovBase + 12 * k, 4, dt);
      cam.fov = this.fov; cam.updateProjectionMatrix();
      return;
    }
    this.deathT = -1;

    // head bob + breathing
    const bobA = player.bobAmt;
    const bobY = Math.sin(player.bob * 2) * 0.052 * bobA;
    const bobX = Math.cos(player.bob) * 0.036 * bobA;
    const breath = Math.sin(this.drift * (1.2 + player.panting * 3.4)) * (0.008 + player.panting * 0.02);
    const crouch = player.crouchT ?? 0;
    const eyeY = player.y + lerp(1.70, 1.02, crouch) + bobY + breath;
    const ca = Math.cos(player.yaw), sa = Math.sin(player.yaw);
    this.pos.set(player.x + ca * bobX, eyeY, player.z - sa * bobX);
    this.smooth.lerp(this.pos, Math.min(1, dt * 26));
    cam.position.copy(this.smooth).add(this.punch);
    this.punch.multiplyScalar(Math.exp(-9 * dt));

    // shake
    this.shake = Math.max(0, this.shake - dt * 2.1);
    this.kick = Math.max(0, this.kick - dt * 5.5);
    const s = this.shake * this.shake * 0.42 * sens;
    const t = this.drift * 42;
    const sx = (Math.sin(t * 1.7) + Math.sin(t * 0.83) * 0.6) * s * 0.09;
    const sy = (Math.cos(t * 2.1) + Math.sin(t * 1.13) * 0.6) * s * 0.09;
    const sr = Math.sin(t * 1.31) * s * 0.075;
    cam.position.x += sx; cam.position.y += sy;

    // roll: strafe lean + shake + footstep
    const strafe = clamp(player.inputs.ax, -1, 1);
    const targetRoll = -strafe * 0.022 * (player.speed / 3.2) + sr + Math.sin(player.bob) * 0.008 * bobA;
    this.roll = damp(this.roll, targetRoll, 12, dt);
    cam.rotation.set(player.pitch + this.kick * 0.06, player.yaw, this.roll);

    // fov: sprint + adrenaline + terror
    const want = this.fovBase
      + (player.sprint ? 7.5 : 0) * clamp(player.speed / 5, 0, 1)
      + (player.adrenaline > 0 ? 3.5 : 0)
      + player.heart * 4.5
      + this.kick * 3.5;
    this.fov = damp(this.fov, want, 7, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
  }
}

// ------------------------------------------------------------------ bloom
export function makeComposer(renderer, scene, camera, enabled) {
  if (!enabled) return null;
  return import('three/examples/jsm/postprocessing/EffectComposer.js').then(async ({ EffectComposer }) => {
    const [{ RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/examples/jsm/postprocessing/RenderPass.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/OutputPass.js'),
    ]);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.72, 0.62, 0.36);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.bloom = bloom;
    return composer;
  });
}

// ------------------------------------------------------------------ jumpscare faces
/** Procedurally drawn horror faces — no external assets. Returns a data URL. */
export function makeFace(kind = 'whisperer') {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const rnd = mulberry(Math.random() * 1e9);

  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);

  const pale = kind === 'weeper' ? ['#e8e2d4', '#8d8677'] : kind === 'tall' ? ['#cfc7bb', '#4b463f'] : ['#ded6c6', '#6f6a5e'];
  // head
  const cx = S * 0.5, cy = S * (kind === 'tall' ? 0.56 : 0.52);
  const hw = S * (kind === 'tall' ? 0.30 : 0.34), hh = S * (kind === 'tall' ? 0.50 : 0.44);
  const grad = g.createRadialGradient(cx - hw * 0.25, cy - hh * 0.3, hw * 0.1, cx, cy, hw * 1.5);
  grad.addColorStop(0, pale[0]);
  grad.addColorStop(0.55, pale[1]);
  grad.addColorStop(1, '#000');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(cx, cy, hw, hh, 0, 0, TAU);
  g.fill();
  // jaw
  g.beginPath();
  g.moveTo(cx - hw * 0.82, cy + hh * 0.2);
  g.quadraticCurveTo(cx, cy + hh * (kind === 'weeper' ? 1.5 : 1.25), cx + hw * 0.82, cy + hh * 0.2);
  g.fill();

  // skin mottling
  for (let i = 0; i < 900; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * hw * r * 1.05, y = cy + Math.sin(a) * hh * r * 1.05;
    g.fillStyle = `rgba(${20 + rnd() * 40 | 0},${16 + rnd() * 26 | 0},${14 + rnd() * 20 | 0},${0.05 + rnd() * 0.16})`;
    g.beginPath(); g.arc(x, y, 2 + rnd() * 22, 0, TAU); g.fill();
  }
  // veins
  g.strokeStyle = 'rgba(40,10,14,0.5)';
  for (let i = 0; i < 26; i++) {
    g.lineWidth = 0.7 + rnd() * 2.2;
    g.beginPath();
    let x = cx + (rnd() - 0.5) * hw * 1.7, y = cy + (rnd() - 0.5) * hh * 1.5;
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) { x += (rnd() - 0.5) * 60; y += (rnd() - 0.2) * 54; g.lineTo(x, y); }
    g.stroke();
  }

  const eyeY = cy - hh * (kind === 'tall' ? 0.22 : 0.18);
  const eyeDX = hw * (kind === 'tall' ? 0.42 : 0.44);
  // eye sockets
  for (const s of [-1, 1]) {
    const ex = cx + s * eyeDX;
    const eg = g.createRadialGradient(ex, eyeY, 2, ex, eyeY, hw * 0.42);
    eg.addColorStop(0, '#000');
    eg.addColorStop(0.6, 'rgba(0,0,0,0.96)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg;
    g.beginPath();
    g.ellipse(ex, eyeY, hw * 0.34, hh * (kind === 'weeper' ? 0.20 : 0.26), s * 0.12, 0, TAU);
    g.fill();
    // glint
    if (kind !== 'tall') {
      g.fillStyle = `rgba(255,${kind === 'weeper' ? 240 : 210},${kind === 'weeper' ? 240 : 200},${0.5 + rnd() * 0.4})`;
      g.beginPath(); g.arc(ex + s * hw * 0.03, eyeY + hh * 0.02, hw * (kind === 'weeper' ? 0.035 : 0.026), 0, TAU); g.fill();
    }
    // tears
    if (kind === 'weeper') {
      g.fillStyle = 'rgba(10,6,6,0.85)';
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.ellipse(ex + (rnd() - 0.5) * hw * 0.2, eyeY + hh * (0.2 + k * 0.16), hw * 0.045, hh * 0.12, 0, 0, TAU);
        g.fill();
      }
    }
  }

  // mouth
  const my = cy + hh * (kind === 'weeper' ? 0.62 : 0.52);
  const mw = hw * (kind === 'weeper' ? 0.62 : kind === 'tall' ? 0.22 : 0.86);
  const mh = hh * (kind === 'weeper' ? 0.52 : kind === 'tall' ? 0.62 : 0.30);
  g.fillStyle = '#050203';
  g.beginPath();
  g.ellipse(cx, my, mw, mh, 0, 0, TAU);
  g.fill();
  // teeth
  if (kind !== 'tall') {
    g.fillStyle = '#e6e0cf';
    const teeth = kind === 'weeper' ? 12 : 16;
    for (let i = 0; i < teeth; i++) {
      const t = (i / (teeth - 1) - 0.5) * 2;
      const x = cx + t * mw * 0.92;
      const th = mh * (0.5 - Math.abs(t) * 0.18) * (0.7 + rnd() * 0.6);
      g.beginPath();
      g.moveTo(x - mw * 0.055, my - mh * 0.86);
      g.lineTo(x + mw * 0.055, my - mh * 0.86);
      g.lineTo(x, my - mh * 0.86 + th);
      g.closePath(); g.fill();
      g.beginPath();
      g.moveTo(x - mw * 0.05, my + mh * 0.86);
      g.lineTo(x + mw * 0.05, my + mh * 0.86);
      g.lineTo(x, my + mh * 0.86 - th * 0.85);
      g.closePath(); g.fill();
    }
  } else {
    // the tall one: a vertical slit stitched shut
    g.strokeStyle = '#1a1414'; g.lineWidth = 7;
    for (let i = -5; i <= 5; i++) {
      g.beginPath();
      g.moveTo(cx - mw * 0.9, my + i * mh * 0.16);
      g.lineTo(cx + mw * 0.9, my + i * mh * 0.16 + 8);
      g.stroke();
    }
  }

  // fingers reaching from the bottom (whisperer)
  if (kind === 'whisperer') {
    g.strokeStyle = '#b9b0a0';
    for (let i = 0; i < 7; i++) {
      g.lineWidth = 12 + rnd() * 14;
      g.beginPath();
      const x = S * (0.1 + i * 0.13) + (rnd() - 0.5) * 40;
      g.moveTo(x, S);
      g.quadraticCurveTo(x + (rnd() - 0.5) * 120, S * 0.78, cx + (rnd() - 0.5) * hw * 1.6, cy + hh * (0.8 + rnd() * 0.5));
      g.stroke();
    }
  }

  // vignette + grain + scanlines
  const vg = g.createRadialGradient(cx, cy, S * 0.18, cx, cy, S * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.94)');
  g.fillStyle = vg; g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 46;
    d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n * 0.9, 0, 255); d[i + 2] = clamp(d[i + 2] + n * 0.85, 0, 255);
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(255,20,40,0.06)';
  g.fillRect(0, 0, S, S);
  return c.toDataURL('image/jpeg', 0.86);
}

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
