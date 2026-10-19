// The pack in the round. On a desktop the flat pocket grid gives way to a real rucksack hanging in
// front of your eyes: drag anywhere to turn it over, a pouch's flap lifts as you point at it, and the
// item rises out of its pocket to be taken or stowed. The flat grid stays the touch fallback — and
// the keyboard's, which never left. The state math lives in BagState, pure and tested; the meshes
// and the pointer are a thin skin over it.
import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/rng.js';

const VERT = 'varying vec3 vN; varying vec3 vP; varying vec2 vUv;\nvoid main(){vN=normalize(normalMatrix*normal);vP=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
function material(color, light = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color().setHex(color, THREE.LinearSRGBColorSpace) }, light: { value: light } },
    vertexShader: VERT,
    fragmentShader: 'uniform vec3 color; uniform float light; varying vec3 vN; varying vec3 vP;\n    void main(){float sh=.55+.45*max(0.,dot(normalize(vN),normalize(vec3(-.4,.7,1.))));\n    float weave=.965+.035*sin(vP.y*900.)*sin(vP.x*800.);gl_FragColor=vec4(color*light*sh*weave,0.);}',
  });
}
function cube(parent, box, mat, x, y, z, w, h, d) {
  const m = new THREE.Mesh(box, mat);
  m.position.set(x, y, z); m.scale.set(w, h, d); m.frustumCulled = false; m.renderOrder = 7;
  parent.add(m);
  return m;
}

// where each of the four pockets hangs on the pack (pack-local metres), and how its flap swings.
// The two front pouches are the big ones (a recorder, a crowbar); the side ones take the small stuff.
const POCKETS = [
  { x: -0.105, y: -0.075, z: 0.115, w: 0.16, h: 0.2, d: 0.075, kind: 'front', label: 'I' },
  { x: 0.105, y: -0.075, z: 0.115, w: 0.16, h: 0.2, d: 0.075, kind: 'front', label: 'II' },
  { x: -0.225, y: -0.02, z: 0.02, w: 0.075, h: 0.19, d: 0.15, kind: 'side', label: 'III' },
  { x: 0.225, y: -0.02, z: 0.02, w: 0.075, h: 0.19, d: 0.15, kind: 'side', label: 'IV' },
];
const YAW_MAX = 1.15;
const PITCH_MAX = 0.42;

// everything the animation needs, none of the DOM: turns, springs, flaps and lift-outs
export class BagState {
  constructor() {
    this.yaw = 0; this.pitch = 0; this.vyaw = 0; this.vpitch = 0;
    this.dragging = false;
    this.hover = -1; // which pouch the pointer is on (-1 none)
    this.picked = -1; // which pouch's item is lifted out (-1 none)
    this.k = 0; // the pack's presence 0..1 (swung in front of the eyes)
    this.pockets = Array.from({ length: POCKETS.length }, () => ({ flap: 0, lift: 0 }));
  }

  // a drag of (dx, dy) pixels turns the pack; you can only turn it so far before it springs back
  drag(dx, dy) {
    this.vyaw = clamp(this.vyaw - dx * 0.012, -4.5, 4.5);
    this.vpitch = clamp(this.vpitch - dy * 0.009, -3, 3);
    this.dragging = true;
  }

  release() { this.dragging = false; }

  // point at a pouch: its flap lifts a little, as a hand would
  point(i) { this.hover = i; }

  // click a pouch: its item rises out for taking. Clicking the lifted one stows it back
  pick(i) {
    if (i < 0 || i >= POCKETS.length) { this.picked = -1; return false; }
    this.picked = this.picked === i ? -1 : i;
    return this.picked === i;
  }

  tick(dt) {
    // the turn: free while dragging, springing back to face you when let go
    if (!this.dragging) { this.vyaw = damp(this.vyaw, -this.yaw * 9, 7, dt); this.vpitch = damp(this.vpitch, -this.pitch * 7, 7, dt); }
    this.yaw = clamp(this.yaw + this.vyaw * dt, -YAW_MAX, YAW_MAX);
    this.pitch = clamp(this.pitch + this.vpitch * dt, -PITCH_MAX, PITCH_MAX);
    if (this.yaw <= -YAW_MAX || this.yaw >= YAW_MAX) this.vyaw *= 0.2;
    if (this.pitch <= -PITCH_MAX || this.pitch >= PITCH_MAX) this.vpitch *= 0.2;
    for (let i = 0; i < this.pockets.length; i++) {
      const p = this.pockets[i];
      const flapT = this.picked === i ? 1 : this.hover === i ? 0.55 : 0;
      p.flap = damp(p.flap, flapT, 12, dt);
      p.lift = damp(p.lift, this.picked === i ? 1 : 0, 10, dt);
    }
    this.k = damp(this.k, 1, 8, dt);
  }

  // where an item sits as it lifts out of pocket i (0..1): out of the pouch, up and toward you
  liftOut(i, out = { x: 0, y: 0, z: 0 }) {
    const P = POCKETS[i] || POCKETS[0];
    const k = this.pockets[i]?.lift || 0;
    out.x = lerp(P.x, P.x * 0.35, k);
    out.y = lerp(P.y, 0.16 + P.y * 0.25, k);
    out.z = lerp(P.z, P.z + 0.24, k);
    return out;
  }
}

export class Bag3D {
  constructor(game) {
    this.g = game;
    this.state = new BagState();
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.mat = { canvas: material(0x4a4931, 0.78), leather: material(0x332d22, 0.9), strap: material(0x2a2620, 0.85), steel: material(0x6c7773, 0.95), accent: material(0x6d3b2e, 0.85) };
    this.root = new THREE.Group();
    this.root.visible = false;
    this.pivot = new THREE.Group(); // the pack turns on this
    this.root.add(this.pivot);
    game.scene.add(this.root);
    this._build();
    this.ray = new THREE.Raycaster();
    this.hits = [];
    this.active = false;
    this.pointer = { x: 0, y: 0 };
    this._wire();
  }

  _build() {
    const b = this.pivot;
    // the main body: a soft trapezoid of waxed canvas with a leather bottom
    cube(b, this.box, this.mat.canvas, 0, 0, 0, 0.4, 0.46, 0.19);
    cube(b, this.box, this.mat.leather, 0, -0.185, 0, 0.41, 0.09, 0.2);
    cube(b, this.box, this.mat.canvas, 0, 0.205, -0.03, 0.36, 0.1, 0.15); // the collar
    // the lid, hinged at the back: it stands open while you browse
    this.lid = new THREE.Group();
    this.lid.position.set(0, 0.24, -0.09);
    b.add(this.lid);
    cube(this.lid, this.box, this.mat.canvas, 0, -0.06, 0.1, 0.42, 0.15, 0.19);
    cube(this.lid, this.box, this.mat.leather, 0, -0.14, 0.1, 0.42, 0.03, 0.19);
    for (const x of [-0.15, 0.15]) cube(this.lid, this.box, this.mat.steel, x, -0.015, 0.19, 0.05, 0.045, 0.012);
    // shoulder straps peeking over the top, the grab handle
    for (const x of [-0.11, 0.11]) cube(b, this.box, this.mat.strap, x, 0.29, -0.02, 0.045, 0.1, 0.05);
    cube(b, this.box, this.mat.strap, 0, 0.315, 0.02, 0.14, 0.028, 0.045);
    // the four pouches: a box each, a flap on a hinge, and a hitbox the pointer can find
    this.pocketView = POCKETS.map((P) => {
      const g = new THREE.Group();
      g.position.set(P.x, P.y, P.z);
      b.add(g);
      cube(g, this.box, this.mat.canvas, 0, 0, 0, P.w, P.h, P.d);
      cube(g, this.box, this.mat.leather, 0, -P.h / 2 + 0.012, 0, P.w + 0.008, 0.03, P.d + 0.006);
      const flap = new THREE.Group();
      flap.position.set(0, P.h / 2 - 0.008, -P.d / 2);
      g.add(flap);
      cube(flap, this.box, P.kind === 'front' ? this.mat.accent : this.mat.leather, 0, -0.038, P.d / 2, P.w + 0.01, 0.085, P.d + 0.008);
      cube(flap, this.box, this.mat.steel, 0, -0.075, P.d / 2, 0.03, 0.026, 0.012);
      // the item itself, hung inside the pouch; swapped when the pocket's contents change
      const item = new THREE.Group();
      item.position.set(0, -0.01, 0.01);
      g.add(item);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(P.w + 0.05, P.h + 0.06, P.d + 0.06), this.mat.strap);
      hit.visible = false; // (raycast finds invisible meshes; the eyes get the real pouch)
      g.add(hit);
      return { g, flap, item, hit, P, kind: null };
    });
  }

  // DOM: the same #backpack overlay carries the pointer; in 3D mode its shade is the drag surface
  _wire() {
    const el = this.g.inventory.el;
    this._move = (e) => {
      if (!this.active) return;
      const r = el.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      if (this._held) {
        this.state.drag(e.movementX || (this._lx ? e.clientX - this._lx : 0), e.movementY || (this._ly ? e.clientY - this._ly : 0));
        this.state.point(-1);
      } else {
        this.state.point(this.hitPocket());
        el.style.cursor = this.state.hover >= 0 ? 'pointer' : 'grab';
      }
      this._lx = e.clientX; this._ly = e.clientY;
    };
    this._down = (e) => {
      if (!this.active) return;
      if (e.button !== 0) return;
      this._held = true;
      this.g.inventory.shadePressed = false; // a turn of the pack must never read as a click on the shade
      this._lx = e.clientX; this._ly = e.clientY;
      el.style.cursor = 'grabbing';
    };
    this._up = (e) => {
      if (!this.active || !this._held) return;
      this._held = false;
      el.style.cursor = 'grab';
      this.g.inventory.shadePressed = false;
      if (Math.hypot(e.clientX - this._lx, e.clientY - this._ly) > 6) return; // that was a turn, not a click
      const i = this.hitPocket();
      if (i >= 0 && this.g.inventory.pickPocket(i, e.clientX, e.clientY)) this.state.pick(i);
      else if (i < 0) this.state.pick(-1);
    };
    this._leave = () => { this._held = false; this.state.point(-1); };
    el.addEventListener('pointermove', this._move);
    el.addEventListener('pointerdown', this._down);
    el.addEventListener('pointerup', this._up);
    el.addEventListener('pointerleave', this._leave);
  }

  open() {
    this.active = true;
    this.state = new BagState();
    this.state.k = 0.25; // it swings in as the hands bring it round
    this.root.visible = true;
    this.syncSlots();
    this.g.inventory.el.style.cursor = 'grab';
  }

  close() {
    this.active = false;
    this.root.visible = false;
    this.g.inventory.el.style.cursor = '';
  }

  // which pouch the pointer is over (raycast against the hitboxes, in the game camera's space)
  hitPocket() {
    if (!this.camera) return -1;
    this.ray.setFromCamera({ x: this.pointer.x, y: this.pointer.y }, this.camera);
    const boxes = this.pocketView.map((p) => p.hit);
    const hits = this.ray.intersectObjects(boxes, false);
    return hits.length ? boxes.indexOf(hits[0].object) : -1;
  }

  // the pockets show what the slots hold; long things get the big front pouches' room
  syncSlots() {
    const kinds = this.g.inventory.slots;
    this.pocketView.forEach((p, i) => {
      const kind = kinds[i] || null;
      if (p.kind === kind) return;
      p.kind = kind;
      for (const c of [...p.item.children]) { p.item.remove(c); }
      if (!kind) return;
      const geo = this.geoFor(kind);
      if (geo) {
        const m = new THREE.Mesh(geo, this.itemMat(kind));
        m.frustumCulled = false;
        m.renderOrder = 8;
        p.item.add(m);
      }
    });
  }

  geoFor(kind) {
    const inv = this.g.inventory;
    if (inv.geo[kind]) return inv.geo[kind];
    if (kind === 'tape' || kind === 'crowbar') { // the field tools ride in their own holders
      if (!this._toolGeo) {
        const tape = new THREE.BoxGeometry(0.1, 0.032, 0.068);
        const bar = new THREE.CylinderGeometry(0.011, 0.011, 0.2, 6);
        bar.rotateZ(Math.PI / 2);
        const hook = new THREE.CylinderGeometry(0.011, 0.011, 0.05, 6);
        hook.translate(0.1, 0.018, 0);
        hook.rotateZ(0.9);
        this._toolGeo = { tape, crowbar: bar, hook };
      }
      return kind === 'tape' ? this._toolGeo.tape : this._toolGeo.crowbar;
    }
    return null;
  }

  itemMat(kind) {
    if (!this._im) this._im = material(0x8a92a0, 0.95);
    return this._im;
  }

  update(dt) {
    if (!this.active) return;
    this.state.tick(dt);
    this.syncSlots();
  }

  // every rendered frame, after the camera has moved: the pack hangs in front of your eyes
  place(camera) {
    if (!this.active) return;
    this.camera = camera; // the pointer's raycasts run between frames, from the last place()
    const s = this.state;
    this.root.position.copy(camera.position);
    this.root.quaternion.copy(camera.quaternion);
    this.root.translateY(-0.055);
    const k = s.k;
    this.pivot.position.set(lerp(0.12, 0, k), lerp(-0.12, -0.235, k), lerp(-0.38, -0.6, k));
    this.pivot.rotation.set(s.pitch, s.yaw, 0);
    this.pivot.scale.setScalar(lerp(0.82, 1, k));
    this.lid.rotation.x = -0.5 - 0.85 * k;
    this.pocketView.forEach((p, i) => {
      p.flap.rotation.x = -(p.P.kind === 'front' ? 0.25 : 0.12) - p.flap * (p.P.kind === 'front' ? 1.5 : 1.1);
      const at = s.liftOut(i, this._at || (this._at = { x: 0, y: 0, z: 0 }));
      const lift = p.flap; // follows the same ease
      p.item.position.set(lerp(0, at.x - p.P.x, lift), lerp(-0.01, at.y - p.P.y, lift), lerp(0.01, at.z - p.P.z, lift));
      p.item.rotation.x = lift * -0.5;
      p.item.scale.setScalar(lerp(0.55, 1, lift) * (p.kind === 'stones' || p.kind === 'battery' ? 0.9 : 1));
    });
  }

  dispose() {
    const el = this.g.inventory.el;
    el.removeEventListener('pointermove', this._move);
    el.removeEventListener('pointerdown', this._down);
    el.removeEventListener('pointerup', this._up);
    el.removeEventListener('pointerleave', this._leave);
    this.root.parent?.remove(this.root);
  }
}

export const BAG3D_POCKETS = POCKETS;
