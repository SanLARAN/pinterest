// The water answers (3.0n).
//
// The bog's surface was a flat plate that only ever *lit up* when a sound wave crossed it: you could splash
// and see a bright circle, but the water itself never moved. Now every body that touches it pushes it — your
// boot, a friend walking past, a stone you threw, the Дrowned coming up out of the peat — and the surface
// carries those rings for a couple of seconds.
//
// The field is a handful of travelling rings. It lives here, in plain numbers, for two reasons: the shader
// and the game must agree on exactly where the water stands (the same numbers are uploaded as uniforms), and
// a test can check the waves without a GPU.
import { WATER } from './water.js';

export const WAVES = {
  slots: 8, // rings alive at once (oldest is recycled)
  ring: 6.5, // m — how far one ring travels before it is spent
  speed: 2.4, // m/s — the front of a ring
  life: 3.4, // s — hard cap, whatever the geometry says
  decay: 0.55, // 1/s — how fast a ring settles: a step's ring is still readable a second later
  band: 2.6, // m — how far the crest trails behind its front (the swell is heavy, not a pond)
  lead: 1.0, // m — ...and how little of it runs ahead of the front
  k: 1.9, // crest wave number: one swell fits the band

  // who made it: the height of the ring, in metres, before the depth is taken into account
  amp: { tap: 0.014, step: 0.06, run: 0.1, stone: 0.09, body: 0.17, brute: 0.26 },
  // ...and how far it runs
  reach: { tap: 4.0, step: 6.5, run: 8.0, stone: 7.5, body: 9.0, brute: 11.0 },
};

export class WaveField {
  constructor(n = WAVES.slots) {
    this.slots = Array.from({ length: n }, () => ({ live: false, x: 0, z: 0, t0: 0, amp: 0, speed: 0, ring: 0, decay: 0, kind: 0 }));
    this.next = 1; // ring id, so anything watching a ring can tell two rings apart
    this.written = 0;
  }

  // o: { time, amp, ring, speed, decay, kind }
  add(x, z, o = {}) {
    const list = this.slots;
    let slot = list.find((s) => !s.live);
    if (!slot) {
      // all of them are out: the oldest goes
      slot = list.reduce((a, b) => (a.t0 <= b.t0 ? a : b), list[0]);
    }
    slot.live = true;
    slot.x = x;
    slot.z = z;
    slot.t0 = o.time ?? 0;
    slot.amp = o.amp ?? WAVES.amp.step;
    slot.speed = o.speed ?? WAVES.speed;
    slot.ring = o.ring ?? WAVES.ring;
    slot.decay = o.decay ?? WAVES.decay;
    slot.kind = o.kind || 0;
    slot.id = this.next++;
    return slot;
  }

  // the surface at (x, z) at time t: summed over every ring whose crest is passing
  at(x, z, t) {
    let h = 0;
    for (const s of this.slots) {
      if (!s.live) continue;
      const age = t - s.t0;
      if (age < 0 || age > WAVES.life) continue;
      const r = age * s.speed;
      if (r > s.ring) continue;
      const d = Math.hypot(x - s.x, z - s.z);
      const q = d - r; // signed distance behind the crest
      if (q > WAVES.lead || q < -WAVES.band) continue;
      const env = Math.exp(-q * q * 1.4) * (1 - r / s.ring) * Math.exp(-age * s.decay);
      h += s.amp * env * Math.cos(q * WAVES.k);
    }
    return h;
  }

  // how many rings are still moving (tests, and the HUD's debug readout)
  update(t) {
    let live = 0;
    for (const s of this.slots) {
      if (!s.live) continue;
      const age = t - s.t0;
      if (age > WAVES.life || age * s.speed > s.ring) s.live = false;
      else live++;
    }
    return live;
  }

  clear() {
    for (const s of this.slots) s.live = false;
    this.written = 0;
  }

  // hand the live rings to the shader: x, z, t0, amp / speed, ring, decay, kind
  write(u) {
    if (!u || !u.uWv || !u.uWvR) return 0;
    const A = u.uWv.value, B = u.uWvR.value;
    for (let i = 0; i < A.length; i++) {
      const s = this.slots[i];
      if (!s || !s.live) { A[i].set(0, 0, 0, 0); B[i].set(1, 1, 1, 0); continue; }
      A[i].set(s.x, s.z, s.t0, s.amp);
      B[i].set(s.speed, s.ring, s.decay, s.kind);
    }
    this.written = A.length;
    return this.written;
  }
}

// What a body touching the surface does to it. Nothing happens on the planks (they are dry and they creak
// instead) and nothing happens on peat: this is the water's whole answer to being walked on.
// kind: 'tap' | 'step' | 'run' | 'stone' | 'body' | 'brute'; force: 0..1 extra weight (a heavy landing)
export function waterKick(field, world, x, z, time, kind = 'step', force = 1) {
  const w = world?.water;
  if (!field || !w) return 0;
  if (world.onWalk?.(x, z, 0)) return 0;
  const depth = w.depth(x, z);
  if (!(depth > WATER.depthWet)) return 0;
  const base = WAVES.amp[kind] ?? WAVES.amp.step;
  // deeper water holds a bigger ring: a puddle barely answers, a flooded проезд answers for you
  const amp = base * (0.55 + 0.75 * Math.min(1, depth / 0.6)) * force;
  const ring = (WAVES.reach[kind] ?? WAVES.reach.step) * (0.7 + 0.5 * Math.min(1, depth / 0.6));
  field.add(x, z, { time, amp, ring, kind: kind === 'brute' ? 2 : kind === 'body' ? 1 : 0 });
  return amp;
}

// (what the surface is worth to a listener: a ring is loud where it is deep — the audio already knows this,
// this is only the number the renderer and the game share)
export const waveSpeed = (w) => WAVES.speed * (0.8 + 0.4 * Math.min(1, Math.max(0, w || 0)));
