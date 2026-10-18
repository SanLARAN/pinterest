// The pack itself, in the round: a battered field rucksack you can turn with a finger — The Forest's
// inventory, not a hotbar. Four front pockets hold the four pocket items as real little meshes; a click on
// a pocket button lifts its item out of the cloth and turns it to the light. Its own tiny renderer and
// scene: the forest keeps running behind it.
import * as THREE from 'three';
import { BAG_SIZE } from '../game/backpackData.js';

const TINT = {
  stones: 0x8d9aa3, glow: 0x7fd08a, torch: 0xc9c2a4, flare: 0xb45a3f, battery: 0x6d7f6a,
  tape: 0x7a6a48, crowbar: 0x8f3f36, map: 0xc8bd93, adrenaline: 0xd8c7a0,
};

function itemMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uHi: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vP;
      void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uHi; varying vec3 vN; varying vec3 vP;
      void main(){
        float sh = .42 + .58 * max(0.0, dot(normalize(vN), normalize(vec3(-.45,.75,.9))));
        float rim = .35 + .65 * max(0.0, dot(normalize(vN), normalize(vec3(.2,.1,-1.))));
        vec3 c = uColor * sh + uColor * rim * (0.18 + uHi * 0.8) + vec3(0.22,0.16,0.05) * uHi;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

export class Bag3D {
  constructor(backpack) {
    this.bp = backpack;
    this.g = backpack.g;
    this.ok = false;
    this.yaw = -0.42;
    this.pitch = 0.12;
    this.wantYaw = -0.42;
    this.wantPitch = 0.12;
    this.t = 0;
    this.items = [];
    this.select = -1;
    this.drag = null;
    this.geoCache = {};
  }

  // build lazily, the first time a bag is actually opened: a second WebGL context at boot is wasteful
  mount(canvas) {
    if (this.ok) return true;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      this.renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.warn('[bag3d] no second context', e);
      return false;
    }
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
    this.camera.position.set(0, 0.35, 5.2);
    this.camera.lookAt(0, 0.05, 0);
    // warm workshop light from the left, a cold rim from behind: the pack has to read in a dark room
    const key = new THREE.DirectionalLight(0xffd9a8, 2.4);
    key.position.set(-2.2, 3.2, 3.4);
    const rim = new THREE.DirectionalLight(0x9fc4ff, 1.4);
    rim.position.set(2.6, 1.0, -2.8);
    this.scene.add(key, rim, new THREE.AmbientLight(0x3b3a2c, 1.6));
    this.pack = this.buildPack();
    this.scene.add(this.pack.root);
    this.items = this.pack.items;
    this.bindDrag();
    this.resize();
    this.ok = true;
    return true;
  }

  buildPack() {
    const root = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0x3d452f, roughness: 0.92, metalness: 0.02 });
    const cloth2 = new THREE.MeshStandardMaterial({ color: 0x2f3624, roughness: 0.95 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x3a2f21, roughness: 0.8 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x7b7663, roughness: 0.45, metalness: 0.7 });
    const box = (w, h, d, m, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      root.add(mesh);
      return mesh;
    };
    // the body: a tall soft box with a heavier bottom
    box(1.34, 1.5, 0.62, cloth, 0, 0, 0);
    box(1.4, 0.16, 0.68, leather, 0, -0.79, 0.02);
    box(1.28, 0.22, 0.66, cloth2, 0, -0.66, 0.01);
    // the flap over the top and its two buckles
    const flap = new THREE.Group();
    flap.position.set(0, 0.62, 0.1);
    root.add(flap);
    const flapMesh = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.52, 0.34), cloth2);
    flapMesh.position.set(0, 0, 0.3);
    flapMesh.rotation.x = -0.12;
    flap.add(flapMesh);
    for (const x of [-0.38, 0.38]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.05), leather);
      b.position.set(x, -0.16, 0.49);
      b.rotation.x = -0.12;
      flap.add(b);
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.07), metal);
      buckle.position.set(x, -0.36, 0.5);
      root.add(buckle);
    }
    // two shoulder straps looped over the back
    for (const x of [-0.4, 0.4]) {
      const s = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 6, 16, Math.PI), cloth2);
      s.position.set(x, 0.28, -0.32);
      s.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      root.add(s);
    }
    // four pockets in a 2×2 grid, and an anchor in each for its item
    const items = [];
    const px = [-0.33, 0.33], py = [-0.14, -0.5];
    for (let i = 0; i < BAG_SIZE; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.42, 0.24), cloth);
      p.position.set(px[i % 2], py[(i / 2) | 0], 0.36);
      root.add(p);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.26), leather);
      lip.position.set(px[i % 2], py[(i / 2) | 0] + 0.2, 0.37);
      root.add(lip);
      const anchor = new THREE.Group();
      anchor.position.set(px[i % 2], py[(i / 2) | 0] + 0.03, 0.52);
      root.add(anchor);
      items.push({ anchor, mesh: null, kind: null, pop: 0, slot: i });
    }
    // a small hand torch clipped to the side, for scale
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.12), metal);
    clip.position.set(0.72, 0.2, 0.1);
    root.add(clip);
    this.packMats = { cloth, cloth2, leather, metal };
    return { root, items };
  }

  itemGeometry(kind) {
    if (this.geoCache[kind] !== undefined) return this.geoCache[kind];
    const b = this.bp, g = this.bp.g;
    let geo = b.geo?.[kind] || null;
    if (!geo && (kind === 'tape' || kind === 'crowbar')) geo = g.tools?.geo?.[kind] || null;
    if (!geo) geo = b.geo?.stones || null;
    if (geo && !geo.attributes.normal) geo.computeVertexNormals();
    this.geoCache[kind] = geo;
    return geo;
  }

  setSlots(slots, equipped) {
    this.slots = slots;
    this.equipped = equipped;
    const eq = equipped ? slots.indexOf(equipped) : -1;
    this.select = this.select >= 0 && slots[this.select] ? this.select : eq;
    if (this.ok) this.syncItems();
  }

  syncItems() {
    const slots = this.slots || [];
    for (const it of this.items) {
      const kind = slots[it.slot] || null;
      if (kind === it.kind) continue;
      if (it.mesh) { it.anchor.remove(it.mesh); it.mesh.geometry = it.mesh.geometry; it.mesh.material.dispose?.(); it.mesh = null; }
      it.kind = kind;
      it.pop = kind ? 1 : 0;
      if (!kind) continue;
      const geo = this.itemGeometry(kind);
      if (!geo) continue;
      const m = new THREE.Mesh(geo, itemMaterial(TINT[kind] || 0x999999));
      m.scale.setScalar(0.9);
      m.rotation.set(-0.35, 0.4, 0.2);
      it.anchor.add(m);
      it.mesh = m;
    }
  }

  bindDrag() {
    const c = this.canvas;
    const down = (e) => {
      this.drag = { x: e.clientX, y: e.clientY, yaw: this.wantYaw, pitch: this.wantPitch };
      c.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!this.drag) return;
      const dx = (e.clientX - this.drag.x) / Math.max(1, c.clientWidth);
      const dy = (e.clientY - this.drag.y) / Math.max(1, c.clientHeight);
      this.wantYaw = this.drag.yaw + dx * 2.6;
      this.wantPitch = Math.max(-0.5, Math.min(0.7, this.drag.pitch + dy * 1.4));
    };
    const up = () => { this.drag = null; };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('lostpointercapture', up);
  }

  resize() {
    if (!this.ok) return;
    const c = this.canvas;
    const w = Math.max(1, c.clientWidth | 0), h = Math.max(1, c.clientHeight | 0);
    if (this._w === w && this._h === h) return;
    this._w = w;
    this._h = h;
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  frame(dt) {
    if (!this.ok) return;
    this.resize();
    this.t += dt;
    if (!this.drag) this.wantYaw += dt * 0.12; // a slow turn when nobody touches it
    this.yaw += (this.wantYaw - this.yaw) * Math.min(1, dt * 8);
    this.pitch += (this.wantPitch - this.pitch) * Math.min(1, dt * 8);
    this.pack.root.rotation.set(this.pitch, this.yaw, Math.sin(this.t * 0.7) * 0.015);
    // the selected pocket's item lifts out and turns; the rest sit in the cloth
    for (const it of this.items) {
      if (!it.mesh) continue;
      const sel = it.slot === this.select && it.kind;
      const want = sel ? 1.0 : 0.0;
      it.pop += (want - it.pop) * Math.min(1, dt * 7);
      it.mesh.position.set(0, it.pop * 0.24, it.pop * 0.9);
      it.mesh.rotation.y += dt * (sel ? 1.1 : 0.18);
      it.mesh.scale.setScalar(0.78 + it.pop * 0.5);
      it.mesh.material.uniforms.uHi.value = it.pop * 0.55;
    }
    this.pack.root.position.y = Math.sin(this.t * 0.9) * 0.012;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (!this.ok) return;
    for (const it of this.items) { it.mesh?.material.dispose?.(); it.mesh = null; }
    for (const m of Object.values(this.packMats)) m.dispose();
    this.renderer.dispose();
    this.ok = false;
  }
}
