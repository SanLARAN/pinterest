// The departure film's schedule, as pure data (the staging lives in garage.js).
//
// Clicking the garage gates takes the room to the training ground. The film used to roll the car out
// while its passengers were still walking to it; now boarding is the point of the scene: everybody
// but one files in and sits down, only then does the car move — and the one who lingered trips over
// his own feet on the concrete, gets up swearing and runs the rolling car down, hauling himself in
// over the back as it leaves through the gates. Alone (the menu's ПОЛИГОН), it's the short version:
// key, headlights, gone.
//
// Everything here is seconds from the click. The plan is derived only from which lobby slots are
// occupied, so every machine in the room stages the identical film.

export const DEPART = {
  latchAt: 0.9, // the bolt slides
  gateFrom: 1.05, gateTo: 2.6, // the leaves swing
  keyAt: 2.0, // the starter
  idleAt: 2.9, // it catches; headlights
  boardFrom: 2.6, boardTo: 4.4, // everybody but one walks to the car…
  climbFor: 0.55, // …and climbs in
  driveAt: 5.2, // the car moves only once they're seated
  runAt: 3.6, // the straggler finally stirs
  tripAt: 4.7, // …and goes down on the concrete
  downUntil: 5.5, // a breath on the floor
  upBy: 6.2, // back on his feet
  catchAt: 8.8, // (nominal) his hand finds the rolling car — distance decides, this is the backstop
  fadeAt: 10.1,
  doneAt: 10.9,
  crawlV: 0.85, // m/s the car creeps while he's still behind it
  solo: { driveAt: 3.4, fadeAt: 5.9, doneAt: 6.7 },
};

// where a passenger stands to climb in, per lobby slot (car-local; the open side faces the camera)
export const DOORS = { 1: [0.1, 0, 0.95], 2: [-0.4, 0, 0.95], 3: [0.1, 0, 1.15] };
// passenger seats, car-local: front, then the bench's far end; the straggler always gets the bench's
// near end, so the room watches him come over the back on the camera's side
export const SEATS = [[0.12, 0, -0.42], [1.15, 0, -0.38]];
export const STRAGGLER_SEAT = [1.15, 0, 0.38];
// the rear quarter he runs at and grabs (car-local)
export const GRAB_POINT = [1.7, 0, 0.95];

// occupied: which of the four lobby slots hold a figure (slot 0 drives and is already in the car)
export function departPlan(occupied) {
  const passengers = [1, 2, 3].filter((s) => occupied && occupied[s]);
  if (!passengers.length) {
    return { solo: true, straggler: -1, boarders: [], seats: {}, driveAt: DEPART.solo.driveAt, fadeAt: DEPART.solo.fadeAt, doneAt: DEPART.solo.doneAt };
  }
  const straggler = passengers[passengers.length - 1]; // the last place filled is the one who lingers
  const boarders = passengers.filter((s) => s !== straggler);
  const seats = { [straggler]: STRAGGLER_SEAT };
  boarders.forEach((s, i) => { seats[s] = SEATS[i] || STRAGGLER_SEAT; });
  return { solo: false, straggler, boarders, seats, driveAt: DEPART.driveAt, fadeAt: DEPART.fadeAt, doneAt: DEPART.doneAt };
}
