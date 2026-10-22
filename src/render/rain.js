// The bog's weather: weak, steady rain. (3.0i)
//
// It is not a storm and it is not a soundtrack — it is the thing that makes this участок feel like a place and
// not a diorama: a fine drizzle you walk through, that keeps the planks greasy and the air grey. It carries no
// gameplay: it does not douse a flare, it does not hide you, it does not change what a step sounds like. What it
// does change is the look of the night — thin bright streaks in the lamp, and a sky that is never quite clear.
//
// The drops live in a box that travels with the player: 1 600 points in a 44 × 22 × 44 m volume, wrapped around
// so the rain never runs out and never needs more than one draw call. They fall at their own speeds (8–12 m/s)
// with a slight wind shear, which is what makes it read as rain and not as falling dots.
import * as THREE from 'three';

const COUNT = 1600;
const BOX = 44; // how wide a patch of rain follows you
const TOP = 20; // ...and how high it starts
const FALL = [8.2, 12.4]; // m/s: a fine drop, not a downpour
const WIND = [0.9, 0.35]; // x, z drift per second

export class Rain {
  constructor(scene) {
    this.scene = scene;
    const pos = new Float32Array(COUNT * 3);
    this.speed = new Float32Array(COUNT);
    this.seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX;
      pos[i * 3 + 1] = Math.random() * TOP;
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOX;
      this.speed[i] = FALL[0] + Math.random() * (FALL[1] - FALL[0]);
      this.seed[i] = Math.random() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    // a drop is two pixels of pale grey, additive-free: the night material would make it a glowing dot
    const mat = new THREE.PointsMaterial({
      color: 0x9fb0b6,
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.NormalBlending,
      fog: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
    this.points.visible = false;
    scene.add(this.points);
    this.pos = pos;
    this.origin = new THREE.Vector3();
    this.t = 0;
    this.gust = 0;
  }

  setVisible(on) {
    this.points.visible = !!on;
  }

  // x, y, z: the player. The box is re-centred when they walk out of the middle of it, so the rain stays with
  // them without a per-frame wrap over 1 600 drops
  update(dt, x, y, z, strength = 1) {
    this.t += dt;
    // a slow gust: the drizzle leans, then stands up again
    this.gust = Math.sin(this.t * 0.23) * 0.5 + Math.sin(this.t * 0.061 + 1.7) * 0.5;
    const cx = x, cy = y, cz = z;
    this.origin.set(cx, cy, cz);
    this.points.position.set(cx, cy - 2.4, cz);
    const p = this.pos;
    const wx = WIND[0] * (1 + this.gust * 0.6) * dt;
    const wz = WIND[1] * dt;
    const half = BOX / 2;
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3;
      let dy = p[j + 1] - this.speed[i] * dt * strength;
      let dx = p[j] + wx + Math.sin(this.t * 1.3 + this.seed[i]) * 0.04 * dt;
      let dz = p[j + 2] + wz;
      if (dy < -2.4) dy += TOP; // below the player's feet: back to the top
      if (dx > half) dx -= BOX; else if (dx < -half) dx += BOX;
      if (dz > half) dz -= BOX; else if (dz < -half) dz += BOX;
      p[j] = dx;
      p[j + 1] = dy;
      p[j + 2] = dz;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
