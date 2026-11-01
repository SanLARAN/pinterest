// The departure film's schedule, as pure data (the staging lives in garage.js).
//
// The garage gates take the room out — to the training ground, or (3.0u) a solo shift. Since 3.0u the film
// opens with the boarding (ui/boarding.js): every figure gets into the car its own way while the film's clock
// is still below zero, and only then does this schedule run — the latch, the leaves, the key, the headlights,
// the wheels. Before 3.0u one passenger was left behind on purpose and chased the car out through the gates;
// the author asked for the car to move only once everyone is in, so that gag became the pack-carrier's stumble
// on the way to the car.
//
// Everything here is seconds from the end of the boarding (the film's zero).

export const DEPART = {
  latchAt: 0.9, // the bolt slides
  gateFrom: 1.05, gateTo: 2.6, // the leaves swing
  keyAt: 2.0, // the starter
  idleAt: 2.9, // it catches; headlights
  driveAt: 3.4, // the wheels
  fadeAt: 5.9,
  doneAt: 6.7,
};

// the same schedule for one or four: they are all in the car by zero
export function departPlan() {
  return { driveAt: DEPART.driveAt, fadeAt: DEPART.fadeAt, doneAt: DEPART.doneAt };
}

// the yaw that turns a survivor rig toward a point. The rig faces +Z, so this is a
// plain atan2 of the direction — no half-turn: with one, the whole cast walked
// backwards (the straggler chased the car back-first, as sharp eyes reported).
export function faceYaw(fx, fz, tx, tz) {
  return Math.atan2(tx - fx, tz - fz);
}
