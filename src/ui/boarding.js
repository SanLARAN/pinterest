// The boarding (3.0u): every drive out of the garage — a solo shift, the range, the room's START, the room's gates —
// opens with the team getting into the car, each of the four lobby places in its own way, and the key is not
// turned until the last one is in. Before this the driver was simply always at the wheel, and the car pulled out
// with a passenger still running after it.
//
//   0 · the driver   — leans on his door in the lobby; one hand on the frame and he VAULTS in over it.
//   1 · the chair    — stands up off the chair, walks round to the tailgate, a boot on the bumper and CLIMBS over.
//   2 · the smoker   — flicks the cigarette away, sprints the length of the garage and LEAPS in feet first, over
//                      the driver's head, into the front seat.
//   3 · the pack     — slings the pack in, runs, STUMBLES on the concrete, gets up and scrambles in over the back.
//
// All of it is car-local (nose −X, the driver's side +Z toward the camera) and pure: `poseBoarding` writes the
// rig's root and joints from a time and a plan, so every machine in a room stages the same seconds and the tests
// can drive it without a renderer. Times are seconds from the start of the boarding.

export const BOARD = {
  // per lobby place: when they move, the parts of their move (s), where they get in from and which seat they take
  0: { style: 'vault', at: 0.0, walk: 0.35, act: 0.5, settle: 0.45, door: [0.15, 0, 1.2] },
  1: { style: 'climb', at: 0.2, rise: 0.5, walk: 1.0, step: 0.45, over: 0.5, settle: 0.3, door: [2.3, 0, 0.42], seat: [1.15, 0, 0.38] },
  2: { style: 'leap', at: 0.1, flick: 0.35, run: 1.15, act: 0.55, settle: 0.3, door: [-0.35, 0, 1.3], seat: [0.12, 0, -0.42] },
  3: { style: 'stumble', at: 0.3, sling: 0.4, run: 1.3, trip: 0.75, over: 0.6, settle: 0.3, door: [2.35, 0, -0.15], seat: [1.15, 0, -0.38] },
  tail: 0.25, // a breath once the last one sits, before the key
};

// how long one place's move takes, start to seated
export function boardDur(slot) {
  const b = BOARD[slot];
  if (!b) return 0;
  const parts = { vault: ['walk', 'act', 'settle'], climb: ['rise', 'walk', 'step', 'over', 'settle'], leap: ['flick', 'run', 'act', 'settle'], stumble: ['sling', 'run', 'trip', 'over', 'settle'] }[b.style];
  return parts.reduce((s, k) => s + b[k], 0);
}

// occupied: which of the four places hold a figure. The plan is only that, so the whole room agrees.
export function boardingPlan(occupied) {
  const slots = [0, 1, 2, 3].filter((s) => occupied && occupied[s]);
  let end = 0;
  const at = {};
  for (const s of slots) {
    at[s] = { start: BOARD[s].at, end: BOARD[s].at + boardDur(s) };
    end = Math.max(end, at[s].end);
  }
  return { slots, at, dur: slots.length ? end + BOARD.tail : 0 };
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (k) => k * k * (3 - 2 * k);
const SEATED_YAW = -Math.PI / 2; // facing the nose, like the driver

// a walk or a run in the legs and arms (the rig's clean base is set by the caller every frame)
function gait(n, ph, run) {
  const a = run ? 0.75 : 0.55;
  n.thL.rotation.x = Math.sin(ph) * a;
  n.thR.rotation.x = -Math.sin(ph) * a;
  n.knL.rotation.x = Math.max(0, -Math.sin(ph)) * (run ? 1.0 : 0.7);
  n.knR.rotation.x = Math.max(0, Math.sin(ph)) * (run ? 1.0 : 0.7);
  n.shL.rotation.x = -Math.sin(ph) * (run ? 0.55 : 0.3);
  n.shR.rotation.x = Math.sin(ph) * (run ? 0.55 : 0.3);
  if (run) { n.elL.rotation.x = -0.9; n.elR.rotation.x = -0.9; n.chest.rotation.x = 0.28; }
  n.hips.position.y = 0.94 - Math.abs(Math.cos(ph)) * (run ? 0.05 : 0.03);
}

// sitting in the car (a passenger: hands in the lap; the driver's hands are the garage's, on the wheel)
export function poseSeatedPassenger(n, D, t = 0, slot = 1) {
  n.hips.position.set(0, D.hips, 0);
  n.hips.rotation.x = D.recline;
  n.chest.rotation.x = -0.02 + Math.sin(t * 1.6 + slot) * 0.012;
  n.head.rotation.y = Math.sin(t * 0.4 + slot * 2) * 0.18;
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(D.thigh, 0, s * 0.07);
    n['kn' + A].rotation.x = D.knee;
    n['sh' + A].rotation.set(-0.32, 0, s * 0.14);
    n['el' + A].rotation.x = -0.85;
  }
}

// blend from a standing figure into the seat (the last part of every style)
function settleInto(n, root, D, k, from, seat) {
  const e = sstep(k);
  root.position.set(lerp(from[0], seat[0], e), lerp(from[1], 0, e) + Math.sin(k * Math.PI) * 0.06, lerp(from[2], seat[2], e));
  n.hips.position.y = lerp(0.94, D.hips, e) - Math.sin(k * Math.PI) * 0.05; // the bounce of the seat
  n.hips.rotation.x = lerp(0, D.recline, e);
  n.thL.rotation.x = n.thR.rotation.x = lerp(n.thL.rotation.x, D.thigh, e);
  n.knL.rotation.x = n.knR.rotation.x = lerp(n.knL.rotation.x, D.knee, e);
}

const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };

// one place's boarding at time bt (seconds from the start of the boarding).
// P: { from: [x, z] car-local lobby spot, fromYaw, seat (car-local; the driver's comes from the car model),
//      D: the car model's seated pose { hips, recline, thigh, knee } }
// Returns 'wait' (not yet), 'move' or 'seated'. Writes root.position/rotation (car-local) and joints.
export function poseBoarding(rig, slot, bt, P) {
  const b = BOARD[slot];
  const n = rig.nodes, root = rig.root;
  const t = bt - b.at;
  if (t < 0) return 'wait';
  const D = P.D, seat = P.seat || b.seat, door = b.door;
  const from = [P.from[0], 0, P.from[1]];
  if (t >= boardDur(slot)) { root.position.set(seat[0], 0, seat[2]); root.rotation.set(0, SEATED_YAW, 0); poseSeatedPassenger(n, D, bt, slot); return 'seated'; }
  root.rotation.x = 0;
  root.rotation.z = 0;

  if (b.style === 'vault') {
    // a step to the door, a hand on the frame — and over in one go, the legs swung in together
    if (t < b.walk) {
      const k = sstep(t / b.walk);
      root.position.set(lerp(from[0], door[0], k), 0, lerp(from[2], door[2], k));
      root.rotation.y = angLerp(P.fromYaw ?? 0, yawTo(from[0], from[2], seat[0], seat[2]), k);
      gait(n, t * 9, false);
      n.shL.rotation.x = lerp(0, -1.2, k); // the hand goes to the door frame
      return 'move';
    }
    const u = t - b.walk;
    if (u < b.act) {
      const k = u / b.act;
      const e = sstep(k);
      root.position.set(lerp(door[0], seat[0], e), Math.sin(k * Math.PI) * 0.55, lerp(door[2], seat[2], e));
      root.rotation.y = angLerp(yawTo(door[0], door[2], seat[0], seat[2]), SEATED_YAW, e);
      n.shL.rotation.set(-1.35 + k * 0.6, 0, -0.3); // the frame under his palm
      n.shR.rotation.set(-0.6 - Math.sin(k * Math.PI) * 0.8, 0, 0.4); // the other arm out for balance
      n.thL.rotation.x = n.thR.rotation.x = -1.3 * Math.sin(k * Math.PI) - 0.2 * k; // the knees come up together
      n.knL.rotation.x = n.knR.rotation.x = 1.5 * Math.sin(k * Math.PI);
      n.chest.rotation.x = 0.25 * Math.sin(k * Math.PI);
      return 'move';
    }
    settleInto(n, root, D, (u - b.act) / b.settle, [seat[0], 0.0, seat[2]], seat);
    root.rotation.y = SEATED_YAW;
    return 'move';
  }

  if (b.style === 'climb') {
    // up off the chair, round to the tailgate, a boot on the bumper, a leg over, and down onto the bench
    let u = t;
    if (u < b.rise) {
      const k = sstep(u / b.rise);
      root.position.set(from[0], 0, from[2]);
      root.rotation.y = P.fromYaw ?? 0;
      n.hips.position.y = lerp(0.55, 0.94, k);
      n.chest.rotation.x = lerp(0.36, 0.1, k) + 0.25 * Math.sin(k * Math.PI); // the push up off the knees
      n.thL.rotation.x = n.thR.rotation.x = lerp(-1.45, 0, k);
      n.knL.rotation.x = n.knR.rotation.x = lerp(1.45, 0, k);
      return 'move';
    }
    u -= b.rise;
    if (u < b.walk) {
      const k = u / b.walk, e = sstep(k);
      root.position.set(lerp(from[0], door[0], e), 0, lerp(from[2], door[2], e));
      root.rotation.y = yawTo(from[0], from[2], door[0], door[2]);
      gait(n, u * 7.5, false);
      return 'move';
    }
    u -= b.walk;
    const atDoor = yawTo(door[0], door[2], seat[0], seat[2]);
    if (u < b.step) {
      // the boot on the bumper, both hands on the tailgate, up he comes
      const k = sstep(u / b.step);
      root.position.set(lerp(door[0], door[0] - 0.25, k), 0.38 * k, door[2]);
      root.rotation.y = angLerp(root.rotation.y, atDoor, Math.min(1, k * 3));
      n.thL.rotation.x = -1.45 * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5) * (1 - k * 0.6);
      n.knL.rotation.x = 1.6 * (1 - k * 0.5);
      n.shL.rotation.x = n.shR.rotation.x = -1.25;
      n.elL.rotation.x = n.elR.rotation.x = -0.6;
      n.chest.rotation.x = 0.35;
      return 'move';
    }
    u -= b.step;
    if (u < b.over) {
      // the other leg over the tailgate, sitting on it for a moment, then in
      const k = u / b.over, e = sstep(k);
      root.position.set(lerp(door[0] - 0.25, seat[0], e), 0.38 + Math.sin(k * Math.PI) * 0.28 - 0.38 * e, lerp(door[2], seat[2], e));
      root.rotation.y = angLerp(atDoor, SEATED_YAW, e);
      n.thR.rotation.x = -1.6 * Math.sin(k * Math.PI);
      n.knR.rotation.x = 1.4 * Math.sin(k * Math.PI);
      n.thL.rotation.x = -0.5 * (1 - k);
      n.shL.rotation.set(-0.9 * (1 - k), 0, -0.5);
      n.chest.rotation.x = 0.2 * (1 - k);
      return 'move';
    }
    u -= b.over;
    settleInto(n, root, D, u / b.settle, [seat[0], 0, seat[2]], seat);
    root.rotation.y = SEATED_YAW;
    return 'move';
  }

  if (b.style === 'leap') {
    // the cigarette goes (the garage draws the spark), then a sprint and a long dive in, feet first
    let u = t;
    if (u < b.flick) {
      const k = u / b.flick;
      root.position.set(from[0], 0, from[2]);
      root.rotation.y = angLerp(P.fromYaw ?? 0, yawTo(from[0], from[2], door[0], door[2]), sstep(k));
      n.shR.rotation.set(-0.9 - Math.sin(k * Math.PI) * 0.7, 0, 0.3); // the flick
      n.elR.rotation.x = -1.4 + k * 1.2;
      return 'move';
    }
    u -= b.flick;
    if (u < b.run) {
      const k = u / b.run;
      const e = k * (1.5 - 0.5 * k); // off fast, still running when he jumps (a sprint, not a teleport)
      root.position.set(lerp(from[0], door[0], e), 0, lerp(from[2], door[2], e));
      root.rotation.y = yawTo(from[0], from[2], door[0], door[2]);
      gait(n, u * 11, true);
      return 'move';
    }
    u -= b.run;
    if (u < b.act) {
      // the dive: off one foot, both legs out in front, over the side and over the driver, into the seat
      const k = u / b.act, e = sstep(k);
      root.position.set(lerp(door[0], seat[0], e), Math.sin(k * Math.PI) * 0.9, lerp(door[2], seat[2], e));
      root.rotation.y = angLerp(yawTo(door[0], door[2], seat[0], seat[2]), SEATED_YAW, e);
      root.rotation.x = -0.35 * Math.sin(k * Math.PI); // leaning back into it
      n.thL.rotation.x = n.thR.rotation.x = -1.35 * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5);
      n.knL.rotation.x = n.knR.rotation.x = 0.25;
      n.shL.rotation.set(-2.2 * Math.sin(k * Math.PI), 0, -0.5); // arms up and out
      n.shR.rotation.set(-2.2 * Math.sin(k * Math.PI), 0, 0.5);
      return 'move';
    }
    u -= b.act;
    settleInto(n, root, D, u / b.settle, [seat[0], 0.0, seat[2]], seat);
    root.rotation.y = SEATED_YAW;
    return 'move';
  }

  // 'stumble': the pack goes in first; he runs, goes down on the concrete, gets up and scrambles in over the back
  let u = t;
  const mid = [lerp(from[0], door[0], 0.55), 0, lerp(from[2], door[2], 0.55)];
  if (u < b.sling) {
    const k = u / b.sling;
    root.position.set(from[0], 0, from[2]);
    root.rotation.y = angLerp(P.fromYaw ?? 0, yawTo(from[0], from[2], door[0], door[2]), sstep(k));
    n.shR.rotation.set(-0.4 - Math.sin(k * Math.PI) * 1.9, 0, 0.2); // the throw, overarm
    n.chest.rotation.x = -0.15 * Math.sin(k * Math.PI);
    return 'move';
  }
  u -= b.sling;
  const runA = b.run * 0.55, runB = b.run - runA;
  if (u < runA) {
    const k = u / runA;
    root.position.set(lerp(from[0], mid[0], k), 0, lerp(from[2], mid[2], k));
    root.rotation.y = yawTo(from[0], from[2], door[0], door[2]);
    gait(n, u * 11, true);
    return 'move';
  }
  u -= runA;
  if (u < b.trip) {
    // down: hands out, a breath on the floor, up on one knee
    const k = u / b.trip;
    const fall = clamp01(k / 0.3), rise = clamp01((k - 0.55) / 0.45);
    const down = fall * (1 - sstep(rise));
    root.position.set(mid[0], 0, mid[2]);
    root.rotation.y = yawTo(from[0], from[2], door[0], door[2]);
    root.rotation.x = 1.25 * down;
    n.hips.position.y = lerp(0.94, 0.32, down);
    n.shL.rotation.x = lerp(0, -1.7, down);
    n.shR.rotation.x = lerp(0, -1.45, down);
    n.knL.rotation.x = Math.sin(rise * Math.PI) * 1.6;
    n.head.rotation.x = lerp(0, -0.7, down);
    return 'move';
  }
  u -= b.trip;
  if (u < runB) {
    const k = u / runB;
    root.position.set(lerp(mid[0], door[0], k), 0, lerp(mid[2], door[2], k));
    root.rotation.y = yawTo(mid[0], mid[2], door[0], door[2]);
    gait(n, u * 12, true);
    return 'move';
  }
  u -= runB;
  if (u < b.over) {
    // both hands on the back, a knee up on it, and over
    const k = u / b.over, e = sstep(k);
    root.position.set(lerp(door[0], seat[0], e), Math.sin(k * Math.PI) * 0.62, lerp(door[2], seat[2], e));
    root.rotation.y = angLerp(yawTo(door[0], door[2], seat[0], seat[2]), SEATED_YAW, e);
    n.shL.rotation.x = n.shR.rotation.x = -1.3 * (1 - k * 0.5);
    n.thL.rotation.x = -1.5 * Math.sin(k * Math.PI);
    n.knL.rotation.x = 1.7 * Math.sin(k * Math.PI);
    n.thR.rotation.x = -0.6 * Math.sin(k * Math.PI);
    n.chest.rotation.x = 0.5 * Math.sin(k * Math.PI);
    return 'move';
  }
  u -= b.over;
  settleInto(n, root, D, u / b.settle, [seat[0], 0, seat[2]], seat);
  root.rotation.y = SEATED_YAW;
  return 'move';
}
