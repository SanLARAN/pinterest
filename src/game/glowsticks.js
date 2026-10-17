// Glow sticks. Everyone starts the night with one: crack it (G) and it glows pale green for a couple of
// minutes — held up in your hand, or (G again) thrown ahead to light up a spot. A stick still glowing on
// the ground can be picked up again (E). Its light is real light: under it the forest has its colours,
// a monster in it can be seen, and the Watcher won't step into it.
//
// The first-aid hut's two lanterns are small lights too: they share the world shader's slots
// (shared.uGlow) with the sticks — see lightSources().
//
// Every machine simulates every stick (crack / throw / pick up are events); a stick held by a teammate
// glows in their hand, and when someone goes down whatever they held falls where they fell.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { CAP } from '../world/world.js';
import { Collision } from '../world/collision.js';
import { shared, shadowLights, GLOW_SLOTS } from '../render/sonar.js';
import { clamp, smoothstep } from '../core/rng.js';

const G = CFG.GLOW;
const PICK_R = 1.7;
const FADE = 3; // s a spent stick takes to go dark
const DIM = 18; // ...and it starts to fade this long before
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _res = { d: 0, nx: 0, nz: 0 };
const UP = new THREE.Vector3(0, 1, 0);

let _tex = null;
function glowTexture() {
  if (_tex) return _tex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.2, 'rgba(200,255,210,0.7)');
  gr.addColorStop(0.5, 'rgba(120,255,150,0.16)');
  gr.addColorStop(1, 'rgba(80,255,120,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  _tex = new THREE.CanvasTexture(c);
  return _tex;
}

// additive on colour, but leaves the scene's alpha alone (alpha tells the post pass what a light shows
// in its own colours — a halo shouldn't wash that out)
export function haloMaterial(color, tex = glowTexture()) {
  return new THREE.SpriteMaterial({
    map: tex, color, transparent: true, depthWrite: false, opacity: 0,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
}

// the stick itself: unlit, it simply glows (alpha 0: drawn in its own colour)
const STICK_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const STICK_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uI;
uniform vec3 uCam;
varying vec3 vN;
varying vec3 vW;
void main() {
  float f = abs(dot(normalize(vN), normalize(uCam - vW)));
  vec3 c = uColor * (0.18 + uI * (0.9 + 0.9 * f)) + vec3(0.3, 0.35, 0.3) * uI * f * f;
  gl_FragColor = vec4(c, 0.0);
}`;

export class GlowSticks {
  constructor(game) {
    this.g = game;
    this.list = [];
    this.count = 1; // sticks you haven't cracked yet
    this.crackN = 0;
    this.lanterns = []; // [{ x, y, z, I, c: [r, g, b], R }] — the first-aid hut's lights
    this.geo = new THREE.CylinderGeometry(0.012, 0.012, 0.17, 6, 1);
    this.color = new THREE.Color(G.color[0], G.color[1], G.color[2]);
    this.view = this._mesh(); // yours, in your hand (first person)
    this.view.renderOrder = 9;
    this.viewHalo = new THREE.Sprite(haloMaterial(0xb8ffc8));
    this.viewHalo.scale.setScalar(0.22);
    this.viewHalo.visible = false;
    game.scene.add(this.view, this.viewHalo);
    this.hinted = false;
    this._src = []; // this frame's small lights (see update)
  }

  _mesh() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: this.color }, uI: { value: 0 }, uCam: shared.uCam },
      vertexShader: STICK_VERT,
      fragmentShader: STICK_FRAG,
    });
    const m = new THREE.Mesh(this.geo, mat);
    m.visible = false;
    m.frustumCulled = false;
    return m;
  }

  // a new night: one stick each, nothing glowing
  reset() {
    for (const s of this.list) this._free(s);
    this.list = [];
    this.count = 1;
    this.crackN = 0;
    this.view.visible = this.viewHalo.visible = false;
    this.hinted = false;
    this._src = this.lightSources();
    this._uniforms();
  }

  _free(s) {
    if (s.mesh) {
      this.g.scene.remove(s.mesh, s.halo);
      s.mesh.material.dispose();
      s.halo.material.dispose();
    }
    s.mesh = s.halo = null;
  }

  find(id) {
    return this.list.find((s) => s.id === id) || null;
  }
  heldBy(pid) {
    return this.list.find((s) => s.state === 'held' && s.owner === pid) || null;
  }
  get held() {
    return this.heldBy(this.g.player.id);
  }

  // how bright a stick is right now (0..1): it takes a moment to catch, and fades near the end
  power(s) {
    const catchUp = smoothstep(0, 0.6, s.age);
    let k = 0.3 + 0.7 * catchUp;
    if (s.left < DIM) k *= 0.3 + 0.7 * clamp(s.left / DIM, 0, 1);
    if (s.left < 0) k *= Math.max(0, 1 + s.left / FADE);
    return k;
  }

  // ---------------- you ----------------
  // G: crack one — or throw the one in your hand
  use() {
    const g = this.g, p = g.player;
    if (!p.alive) return;
    if (g.state !== 'play') {
      g.hud.popup(t('aGlowDay'), 'dim');
      return;
    }
    const h = this.held;
    if (h) {
      this.throwHeld(h);
      return;
    }
    if (this.count <= 0) {
      g.hud.popup(t('aNoGlow'), 'dim');
      g.hud.flashGlows();
      return;
    }
    this.count--;
    g.hud.flashGlows();
    const id = `${p.id}#${++this.crackN}`;
    this.crack(id, p.id, G.burn);
    if (g.sync) g.sync.ev('gc', id);
    g.playerNoise(p.x, p.z, G.crackLoud, 'glow');
    g.stats.glows = (g.stats.glows | 0) + 1;
    if (!this.hinted) {
      this.hinted = true;
      g.hud.setHint(t(g.input.touch ? 'hintGlowTouch' : 'hintGlow'));
      g.timeline.push({ at: g.time + 6, fn: () => g.hud.setHint(null) });
    }
  }

  // anyone's stick catches (pid's hand)
  crack(id, pid, left = G.burn) {
    if (this.find(id)) return;
    const holder = this.g.playerById(pid);
    const s = { id, owner: pid, state: 'held', x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0, left, age: 0, rest: 0, mesh: null, halo: null, spin: 0 };
    if (holder) this._holdPos(s, holder);
    this.list.push(s);
    const own = pid === this.g.player.id;
    this.g.audio.glowCrack(s.x, s.y, s.z, own);
    if (!own) this._visuals(s);
  }

  _visuals(s) {
    if (s.mesh) return;
    s.mesh = this._mesh();
    s.halo = new THREE.Sprite(haloMaterial(0xa8ffbc));
    s.halo.scale.setScalar(0.85);
    s.halo.renderOrder = 6;
    this.g.scene.add(s.mesh, s.halo);
  }

  // G again: the stick in your hand flies where you look
  throwHeld(s) {
    const g = this.g, p = g.player;
    const cp = Math.cos(p.pitch);
    const dx = -Math.sin(p.yaw) * cp, dz = -Math.cos(p.yaw) * cp, dy = Math.sin(p.pitch);
    const e = g.eyePos();
    const x = e.x + dx * 0.35, y = e.y - 0.2, z = e.z + dz * 0.35;
    this.fly(s, x, y, z, dx, dy, dz);
    if (g.sync) g.sync.ev('gt', s.id, +x.toFixed(2), +y.toFixed(2), +z.toFixed(2), +dx.toFixed(3), +dy.toFixed(3), +dz.toFixed(3), Math.round(s.left));
    g.audio.throwWhoosh();
    g.addTrauma(0.03);
  }

  fly(s, x, y, z, dx, dy, dz) {
    s.state = 'fly';
    s.x = x; s.y = y; s.z = z;
    s.vx = dx * G.speed;
    s.vy = dy * G.speed + 3.2;
    s.vz = dz * G.speed;
    s.rest = 0;
    s.spin = 0;
    this._visuals(s);
  }

  // a teammate threw theirs (or one we never saw cracked)
  remoteThrow(pid, id, x, y, z, dx, dy, dz, left) {
    let s = this.find(id);
    if (!s) {
      s = { id, owner: pid, state: 'held', x, y, z, vx: 0, vy: 0, vz: 0, left: Number.isFinite(left) ? left : G.burn, age: 1, rest: 0, mesh: null, halo: null, spin: 0 };
      this.list.push(s);
    } else if (Number.isFinite(left)) s.left = left;
    this.fly(s, x, y, z, dx, dy, dz);
  }

  // E on a stick lying on the ground: it's yours now
  pick(s) {
    const g = this.g;
    if (this.held) return;
    this._take(s, g.player.id);
    if (g.sync) g.sync.ev('gp', s.id);
    g.audio.glowPick();
  }
  remotePick(pid, id) {
    const s = this.find(id);
    if (s) this._take(s, pid);
  }
  _take(s, pid) {
    const had = this.heldBy(pid);
    if (had && had !== s) this._ground(had); // (two at once: the old one drops)
    s.owner = pid;
    s.state = 'held';
    if (pid === this.g.player.id) this._free(s);
    else this._visuals(s);
  }

  // whoever held it went down (or left): it falls where they were
  dropFor(pid, x, z) {
    const s = this.heldBy(pid);
    if (!s) return;
    s.x = x;
    s.z = z;
    this._ground(s);
  }
  _ground(s) {
    s.state = 'ground';
    s.vx = s.vy = s.vz = 0;
    s.y = this._floor(s.x, s.z) + 0.02;
    s.spin = Math.random() * Math.PI;
    this._visuals(s);
  }
  _floor(x, z) {
    const g = this.g;
    return g.world.terrain.height(x, z) + (g.doors && g.doors.indoors(x, z) ? 0.2 : 0);
  }

  // what the E prompt can find: sticks glowing on the ground
  consider(fn) {
    if (this.held) return;
    for (const s of this.list) if (s.state === 'ground' && s.left > 0) fn(s, s.x, s.z, PICK_R, 'glow');
  }

  // ---------------- per frame ----------------
  _holdPos(s, holder) {
    const g = this.g;
    if (holder === g.player) {
      // low in your right hand, a little ahead — but never further out than your own elbows reach
      // (inside the circle you take up: up against a wall, the light stays on your side of it)
      const p = holder;
      const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw), cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);
      const fx = -sy * cp, fy = sp, fz = -cy * cp;
      s.x = p.x + fx * 0.2 + cy * 0.12;
      s.y = p.y + p.eyeCur - 0.3 + fy * 0.3;
      s.z = p.z + fz * 0.2 - sy * 0.12;
      return;
    }
    // a teammate: in their (right) hand
    const rig = holder.rig;
    if (!rig || !rig.nodes.elL) {
      s.x = holder.x; s.y = holder.y + 1.1; s.z = holder.z;
      return;
    }
    rig.root.updateMatrixWorld(true);
    rig.nodes.elL.localToWorld(_v.set(0, -0.33, 0.08));
    s.x = _v.x; s.y = _v.y; s.z = _v.z;
    const ox = s.x - holder.x, oz = s.z - holder.z, od = Math.hypot(ox, oz);
    if (od > 0.28) {
      s.x = holder.x + (ox / od) * 0.28;
      s.z = holder.z + (oz / od) * 0.28;
    }
  }

  update(dt) {
    const g = this.g;
    const world = g.world;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const s = this.list[i];
      s.age += dt;
      s.left -= dt;
      if (s.left < -FADE) {
        this._free(s);
        this.list.splice(i, 1);
        continue;
      }
      if (s.state === 'held') {
        const holder = g.playerById(s.owner);
        if (!holder || !holder.alive) {
          if (holder) { s.x = holder.x; s.z = holder.z; }
          this._ground(s);
        } else this._holdPos(s, holder);
      } else if (s.state === 'fly') {
        s.vy -= G.gravity * dt;
        const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt, nz = s.z + s.vz * dt;
        s.spin += dt * 14;
        const floor = this._floor(nx, nz);
        let bounced = false;
        // trees, walls
        const h = ny - world.terrain.height(nx, nz);
        for (const ci of world.col.query(nx, nz, 1)) {
          const c = world.col.caps[ci];
          if (c.kind === CAP.WATER || h > c.h) continue;
          Collision.closest(c, nx, nz, _res);
          if (_res.d < 0.05) {
            const vn = s.vx * _res.nx + s.vz * _res.nz;
            if (vn < 0) {
              s.vx = (s.vx - 1.6 * vn * _res.nx) * 0.45;
              s.vz = (s.vz - 1.6 * vn * _res.nz) * 0.45;
            }
            bounced = true;
            break;
          }
        }
        if (bounced) {
          if (Math.hypot(s.vx, s.vz) > 1.5) g.audio.glowLand(s.x, s.y, s.z, 0.6);
          continue;
        }
        const L = world.lake;
        if (L && ny <= L.y + 0.02 && Math.hypot(nx - L.x, nz - L.z) < L.r + 1) {
          // into the lake: it floats, still glowing
          s.x = nx; s.z = nz; s.y = L.y + 0.01;
          g.audio.impact(s.x, s.y, s.z, true);
          this._ground(s);
          s.y = L.y + 0.01;
          continue;
        }
        if (ny <= floor + 0.02) {
          const v = Math.hypot(s.vx, s.vy, s.vz);
          if (v > 2.2) g.audio.glowLand(nx, floor, nz, Math.min(1, v / 9));
          s.vy = Math.abs(s.vy) * 0.28;
          s.vx *= 0.5;
          s.vz *= 0.5;
          s.x = nx; s.z = nz; s.y = floor + 0.02;
          if (v < 1.6 || ++s.rest > 4) this._ground(s);
          continue;
        }
        s.x = nx; s.y = ny; s.z = nz;
        if (s.age > 12) this._ground(s);
      }
      this._place(s);
    }
    this._src = this.lightSources();
    this._uniforms();
  }

  _place(s) {
    if (!s.mesh) return;
    const k = this.power(s);
    const on = s.y > -50;
    s.mesh.visible = s.halo.visible = on;
    s.mesh.position.set(s.x, s.y, s.z);
    if (s.state === 'ground') s.mesh.rotation.set(Math.PI / 2, s.spin, 0, 'YXZ');
    else if (s.state === 'fly') s.mesh.rotation.set(s.spin, s.spin * 0.3, 0);
    else s.mesh.rotation.set(0.3, 0, 0.2);
    s.mesh.material.uniforms.uI.value = k;
    s.halo.position.set(s.x, s.y + 0.02, s.z);
    s.halo.material.opacity = 0.7 * k;
    s.halo.scale.setScalar(0.7 + 0.8 * k);
  }

  // your own stick, drawn in your hand (after the camera is placed)
  placeView(camera, show) {
    const s = show ? this.held : null;
    this.view.visible = this.viewHalo.visible = !!s;
    if (!s) return;
    const k = this.power(s);
    const m = this.view;
    m.position.set(0.21, -0.19, -0.46);
    m.position.applyMatrix4(camera.matrixWorld);
    m.quaternion.copy(camera.quaternion).multiply(_q.setFromAxisAngle(_v.set(1, 0, 0.35).normalize(), 0.5));
    m.material.uniforms.uI.value = k;
    this.viewHalo.position.copy(m.position);
    this.viewHalo.material.opacity = 0.5 * k;
  }

  // ---------------- light ----------------
  // every small light, brightest first for the camera: [{ x, y, z, I, c, R, prio }]
  lightSources() {
    const out = [];
    for (const L of this.lanterns) if (L.I > 0.001) out.push({ x: L.x, y: L.y, z: L.z, I: L.I, c: L.c, R: L.R, prio: 0, near: L.near ?? 0.15, id: L });
    const me = this.g.player.id;
    for (const s of this.list) {
      if (s.y < -50) continue;
      const I = G.light * this.power(s);
      if (I <= 0.001) continue;
      // (lying on the ground its light is lifted a little: from right at the ground it would only graze it)
      out.push({ x: s.x, y: s.y + (s.state === 'ground' ? 0.35 : 0.1), z: s.z, I, c: G.color, R: G.radius, prio: s.state === 'held' && s.owner === me ? 2 : 0, near: 0.1, id: s });
    }
    return out;
  }

  _uniforms() {
    const src = this._src.slice();
    const e = this.g.ears ? this.g.ears() : { x: 0, y: 0, z: 0 };
    if (src.length > GLOW_SLOTS) {
      for (const l of src) l.score = l.prio * 1e6 - Math.hypot(l.x - e.x, l.y - e.y, l.z - e.z) / Math.max(0.2, l.I);
      src.sort((a, b) => b.score - a.score);
    }
    // keep a light in the slot it had (its shadow faces stay valid there); newcomers take the free ones
    const slots = this._slots || (this._slots = new Array(GLOW_SLOTS).fill(null));
    const chosen = src.slice(0, GLOW_SLOTS);
    const placed = new Array(GLOW_SLOTS).fill(null);
    for (let i = 0; i < GLOW_SLOTS; i++) {
      const was = slots[i];
      const k = was ? chosen.findIndex((l) => l && l.id === was) : -1;
      if (k >= 0) {
        placed[i] = chosen[k];
        chosen[k] = null;
      }
    }
    for (const l of chosen) {
      if (!l) continue;
      const i = placed.indexOf(null);
      if (i < 0) break;
      placed[i] = l;
    }
    const U = shared.uGlow.value, C = shared.uGlowC.value;
    for (let i = 0; i < GLOW_SLOTS; i++) {
      const l = placed[i];
      slots[i] = l ? l.id : null;
      if (!l) {
        U[i].w = 0;
        shadowLights.glow[i] = null;
        continue;
      }
      U[i].set(l.x, l.y, l.z, l.I);
      C[i].set(l.c[0], l.c[1], l.c[2], l.R);
      const sl = shadowLights.glow[i] || (shadowLights.glow[i] = { x: 0, y: 0, z: 0, R: 0, near: 0 });
      sl.x = l.x;
      sl.y = l.y;
      sl.z = l.z;
      sl.R = l.R;
      sl.near = l.near;
    }
  }

  // how much small light falls at (x, y, z) — same falloff as the shader, and walls stop it too (0..1)
  lightAt(x, y, z) {
    let best = 0;
    const world = this.g.world;
    for (const l of this._src) {
      const d = Math.hypot(l.x - x, l.y - y, l.z - z);
      if (d > l.R) continue;
      const f = 1 - smoothstep(l.R * 0.05, l.R, d);
      const v = f * f * Math.min(1, l.I);
      if (v <= best) continue;
      if (world.losBlocked && world.losBlocked(l.x, l.y, l.z, x, y, z, 0.3)) continue;
      best = v;
    }
    return best;
  }
}
