// The steed for the berserker's Summon Steed: it trots in, the knight leaps on, it gallops while
// he rides, and it trots off when the ride ends. The timeline is driven by the ability's
// remaining time (see BerserkAbilities.elapsed), so the visuals can never outlast the ability.
import { createSteedModel } from '../render/steedModel.js';
import { STEED } from '../sim/berserker.js';
import { easeOutCubic } from '../util/math.js';

const ARRIVE = 0.35; // seconds for the steed to trot in from the side
const RIDE_H = 0.85; // height of the knight's root while seated
const SIDE = 1.4; // how far to the side the steed waits before it trots in

export class Steed {
  constructor(scene) {
    this.model = createSteedModel();
    this.root = this.model.root;
    this.root.rotation.order = 'YXZ';
    this.root.visible = false;
    scene.add(this.root);
    this.phase = 'idle';
    this.gallop = 0;
  }

  /** True only while the knight is galloping (the trample zone). */
  get riding() {
    return this.phase === 'ride';
  }

  /**
   * `t` is seconds since the summon, or null once the ride has ended. `s` is the steed's
   * stats at the current level ({ duration, speed }). Sets the knight's ride state
   * (riding, rideH, rideMul) before his own update runs.
   */
  update(dt, hero, t, s) {
    if (t === null || !s) {
      if (this.phase !== 'idle') this.stop(hero);
      return;
    }
    const mountEnd = ARRIVE + STEED.mountTime;
    const dismountAt = s.duration - STEED.dismountTime;
    const fx = Math.sin(hero.facing);
    const fz = Math.cos(hero.facing);
    const toSide = { x: fz * SIDE, z: -fx * SIDE }; // to the knight's right
    const speed = Math.hypot(hero.vx, hero.vz);
    hero.riding = true; // no swinging from the summon until the ride is over
    this.root.visible = true;
    this.root.rotation.y = hero.facing;

    if (t < ARRIVE) {
      this.phase = 'arrive';
      const k = easeOutCubic(t / ARRIVE);
      this.place(hero.x + toSide.x * (1 - k), hero.z + toSide.z * (1 - k), hero.y);
      hero.rideH = 0;
      hero.rideMul = 1;
    } else if (t < mountEnd) {
      this.phase = 'mount';
      const p = (t - ARRIVE) / STEED.mountTime;
      this.place(hero.x, hero.z, hero.y);
      // the leap: an arc up and onto the saddle
      hero.rideH = RIDE_H * p + Math.sin(Math.PI * p) * 0.9;
      hero.rideMul = 1;
    } else if (t < dismountAt) {
      this.phase = 'ride';
      this.place(hero.x, hero.z, hero.y);
      hero.rideH = RIDE_H;
      hero.rideMul = s.speed;
    } else {
      this.phase = 'dismount';
      const p = Math.min(1, (t - dismountAt) / STEED.dismountTime);
      // the jump off, and the steed trots away and shrinks out of sight
      this.place(hero.x + toSide.x * p * 2, hero.z + toSide.z * p * 2, hero.y);
      this.root.scale.setScalar(Math.max(0.001, 1 - p * 0.9));
      hero.rideH = RIDE_H * (1 - p) + Math.sin(Math.PI * p) * 0.6;
      hero.rideMul = 1;
    }

    this.animate(dt, speed);
  }

  place(x, z, y) {
    this.root.position.set(x, y, z);
  }

  /** Legs swing in a gallop while riding; a slow shuffle while summoning or dismounting. */
  animate(dt, speed) {
    const riding = this.phase === 'ride';
    this.gallop += dt * (riding ? 6 + speed * 0.6 : 2.5);
    const amp = riding ? 0.7 : 0.15;
    const legs = this.model.legs;
    // diagonal pairs move together: front-left with back-right, and so on
    const offsets = [0, Math.PI, Math.PI, 0];
    for (let i = 0; i < legs.length; i++) legs[i].rotation.x = Math.sin(this.gallop + offsets[i]) * amp;
    this.root.position.y += riding ? Math.abs(Math.sin(this.gallop)) * 0.05 : 0;
  }

  /** Hides the steed and gives the knight his feet back. */
  stop(hero) {
    this.phase = 'idle';
    this.root.visible = false;
    this.root.scale.setScalar(1);
    for (const leg of this.model.legs) leg.rotation.x = 0;
    if (hero) {
      hero.riding = false;
      hero.rideH = 0;
      hero.rideMul = 1;
    }
  }
}
