// Pulse (sound wave) manager. Writes into the shared shader uniforms and tracks wavefronts on the CPU
// so gameplay can react when a wave reaches something (monster afterimages, shard chimes, radar blips).
import { CFG } from '../core/config.js';
import { shared } from '../render/sonar.js';

export class Pulses {
  constructor() {
    const n = CFG.PULSE.slots;
    this.mainSlots = n - CFG.PULSE.stepSlots;
    this.slots = [];
    for (let i = 0; i < n; i++) {
      this.slots.push({
        active: false, x: 0, y: 0, z: 0, t0: 0, speed: 30, radius: 0, strength: 0, decay: 1,
        prevR: 0, curR: 0, kind: 'player', id: 0, color: [1, 1, 1], life: 0,
      });
    }
    this.stepIdx = 0;
    this.nextId = 1;
  }

  clear() {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].active = false;
      shared.uPB.value[i].z = 0;
    }
  }

  _write(i) {
    const s = this.slots[i];
    shared.uPA.value[i].set(s.x, s.y, s.z, s.t0);
    shared.uPB.value[i].set(s.speed, s.radius, s.active ? s.strength : 0, s.decay);
    shared.uPC.value[i].set(s.color[0], s.color[1], s.color[2], 0);
  }

  // opts: radius, strength, speed, decay, color, kind
  emit(x, y, z, time, opts) {
    let best = -1, bestScore = -Infinity;
    for (let i = 0; i < this.mainSlots; i++) {
      const s = this.slots[i];
      if (!s.active) { best = i; break; }
      // replace the most faded pulse
      const age = time - s.t0;
      const score = age - s.life;
      if (score > bestScore) { bestScore = score; best = i; }
    }
    return this._set(best, x, y, z, time, opts);
  }

  emitStep(x, y, z, time, opts) {
    const n = CFG.PULSE.stepSlots;
    const i = this.mainSlots + (this.stepIdx++ % n);
    return this._set(i, x, y, z, time, opts);
  }

  _set(i, x, y, z, time, o) {
    const s = this.slots[i];
    s.active = true;
    s.x = x; s.y = y; s.z = z;
    s.t0 = time;
    s.speed = o.speed || CFG.PULSE.speed;
    s.radius = o.radius;
    s.strength = o.strength ?? 1;
    s.decay = o.decay ?? 0.55;
    s.color = o.color || [1, 1, 1];
    s.kind = o.kind || 'player';
    s.prevR = 0;
    s.curR = 0;
    s.id = this.nextId++;
    s.life = s.radius / s.speed + 6 / s.decay;
    this._write(i);
    return s;
  }

  update(time) {
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (!s.active) continue;
      const age = time - s.t0;
      s.prevR = s.curR;
      s.curR = Math.min(age * s.speed, s.radius + 0.01);
      if (age > s.life) {
        s.active = false;
        shared.uPB.value[i].z = 0;
      }
    }
  }

  // iterate main pulses whose wavefront moved this frame
  *fronts() {
    for (let i = 0; i < this.mainSlots; i++) {
      const s = this.slots[i];
      if (s.active && s.curR > s.prevR && s.prevR <= s.radius) yield s;
    }
  }

  // brightness the shader would give at distance d from pulse s right now (approx)
  static lightAt(s, d, time) {
    if (d > s.radius) return 0;
    const front = (time - s.t0) * s.speed - d;
    if (front < 0) return 0;
    const fall = 1 - Math.min(1, Math.max(0, (d - s.radius * 0.42) / (s.radius * 0.58)));
    return s.strength * fall * Math.exp(-(front / s.speed) * s.decay);
  }
}
