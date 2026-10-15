import { Noise2D, mulberry32, clamp } from './noise.js';

/**
 * Screen-level juice: trauma-based shake, hit-stop, slow motion and the
 * values that drive the post-processing pass (flash, aberration, glitch).
 */
export class FX {
  constructor(settings) {
    this.settings = settings;
    this.noise = new Noise2D(mulberry32(99));
    this.reset();
  }

  reset() {
    this.trauma = 0;
    this.t = 0;
    this.hitStopT = 0;
    this.slowT = 0;
    this.slowScale = 1;
    this.scale = 1;
    this.flash = 0;
    this.flashColor = [1, 1, 1];
    this.ca = 0;
    this.glitch = 0;
    this.damage = 0;
    this.kickX = 0; this.kickY = 0;
    this.lowTime = 0;
  }

  addTrauma(a) {
    this.trauma = Math.min(1, this.trauma + a);
  }

  kick(x, y) { this.kickX += x; this.kickY += y; }

  hitStop(sec) { this.hitStopT = Math.max(this.hitStopT, sec); }

  slowmo(scale, sec) {
    this.slowScale = Math.min(this.slowScale, scale);
    this.slowT = Math.max(this.slowT, sec);
  }

  doFlash(strength, r = 1, g = 1, b = 1) {
    if (strength >= this.flash) this.flashColor = [r, g, b];
    this.flash = Math.max(this.flash, strength);
  }

  aberrate(a) { this.ca = Math.min(1, this.ca + a); }
  doGlitch(a) { this.glitch = Math.min(1, this.glitch + a); }
  hurt(a) { this.damage = Math.min(1, this.damage + a); }

  update(dt) {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    this.flash = Math.max(0, this.flash - dt * 3.5);
    this.ca = Math.max(0, this.ca - dt * 2.2);
    this.glitch = Math.max(0, this.glitch - dt * 3);
    this.damage = Math.max(0, this.damage - dt * 1.8);
    this.kickX *= Math.exp(-dt * 12);
    this.kickY *= Math.exp(-dt * 12);
    if (this.hitStopT > 0) this.hitStopT -= dt;
    if (this.slowT > 0) {
      this.slowT -= dt;
      if (this.slowT <= 0) this.slowScale = 1;
    }
    const target = this.slowT > 0 ? this.slowScale : 1;
    this.scale += (target - this.scale) * (1 - Math.exp(-dt * 10));
  }

  timeScale() {
    if (this.hitStopT > 0) return 0.02;
    return this.scale;
  }

  /** Shake offsets in camera space. */
  shake(out) {
    const k = this.settings.shake;
    const s = this.trauma * this.trauma * k;
    const t = this.t * 22;
    out.x = (this.noise.noise(t, 1.7) * 1.1 * s) + this.kickX * k;
    out.y = (this.noise.noise(t, 9.3) * 0.9 * s) + this.kickY * k;
    out.roll = this.noise.noise(t, 21.1) * 0.05 * s;
    return out;
  }
}

export { clamp };
