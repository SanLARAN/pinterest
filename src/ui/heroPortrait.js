// Animated hero portrait for the title screen: the game's own knight model, idling in a small canvas.
// It only draws while its canvas is on screen, and holds one still frame for reduced-motion users.
import * as THREE from 'three';
import { createHeroModel } from '../render/heroModel.js';
import { bitmapUniforms } from '../render/bitmap.js';

export class HeroPortrait {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(canvas.width, canvas.height, false);

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xdfe4ff, 0x3a2a4a, 2.2));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.6);
    key.position.set(3, 6, 4);
    this.scene.add(key);

    this.id = 'knight';
    this.model = createHeroModel(this.id);
    this.model.root.rotation.order = 'YXZ';
    this.scene.add(this.model.root);
    this.armBase = this.model.armR.rotation.x;

    // hero stands 1.9 units tall; frame head and torso with a little room above the plume
    this.camera = new THREE.PerspectiveCamera(28, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(0.5, 1.45, 4.6);
    this.camera.lookAt(0, 1.05, 0);

    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.t = 0;
    this.running = false;
    this.last = 0;
    this.frame = this.frame.bind(this);
    this.pose();
    this.renderer.render(this.scene, this.camera);
  }

  /** Shows another hero's model (the title screen's picker). */
  setCharacter(id) {
    if (id === this.id) return;
    this.scene.remove(this.model.root);
    this.id = id;
    this.model = createHeroModel(id);
    this.model.root.rotation.order = 'YXZ';
    this.scene.add(this.model.root);
    this.armBase = this.model.armR.rotation.x;
    this.pose();
    this.renderer.render(this.scene, this.camera);
  }

  /** Idle loop: breathing bob, a slow turn, and a small arm sway. */
  pose() {
    const r = this.model.root;
    const t = this.t;
    r.position.y = Math.sin(t * 2.4) * 0.035;
    r.rotation.y = Math.sin(t * 0.7) * 0.4;
    this.model.armR.rotation.x = this.armBase + Math.sin(t * 2.4 + 1) * 0.12;
    bitmapUniforms.uTime.value = t;
  }

  start() {
    if (this.running) return;
    if (this.reduced) {
      this.pose();
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.t += dt;
    this.model.hair?.update(dt, 0, 0, 0); // a breeze moves the hair even when the hero stands still
    this.last = now;
    // skip the GPU work while the title screen is showing something else
    if (this.canvas.offsetParent === null) return;
    this.pose();
    this.renderer.render(this.scene, this.camera);
  }
}
