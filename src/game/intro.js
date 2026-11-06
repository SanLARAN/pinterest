// Which film opens a shift. The forestry opens on the road (3.1n: roadFilm.js, the УАЗ at sunset with the radio
// on) and then the camp's last evening (3.1h: campFilm.js). The second level, «Топь», has no opening film of this
// kind any more (5.0a): it is told in chapters, and its first chapter is a film of its own (game/level2.js).
// `new IntroCutscene(game)` keeps the one object Game talks to: begin/update/applyCamera/cancel/seek.
import { CampFilm } from './campFilm.js';
import { RoadFilm } from './roadFilm.js';

// ---------------- which film opens the shift ----------------
export class IntroCutscene {
  constructor(game) {
    return new ForestOpening(game);
  }
}

// (3.1n) the forest opens on the road: the УАЗ at sunset with the radio on, into the forestry's yard (roadFilm.js),
// then the camp's last evening (campFilm.js, without its own title — the road had it). One object for Game, the
// same calls as either film; Enter during the road skips the whole opening, during the camp the rest of the camp.
export class ForestOpening {
  constructor(game) {
    this.g = game;
    this.road = new RoadFilm(game);
    this.camp = new CampFilm(game);
    this.camp.afterRoad = true;
    this.part = null;
    this.state = 'idle';
    this.done = false;
  }

  set forceSeats(n) { this.road.forceSeats = n; this.camp.forceSeats = n; }
  get forceSeats() { return this.road.forceSeats; }
  get t() { return this.part === this.camp ? this.road.dur + this.camp.t : this.road.t; }
  get dur() { return this.road.dur + this.camp.dur; }

  begin() {
    this.state = 'run';
    this.done = false;
    this.part = this.road;
    this.road.begin();
  }

  update(dt, events) {
    if (this.state !== 'run') return;
    if (this.part === this.road) {
      this.road.update(dt, events);
      if (this.road.state !== 'done') return;
      if (this.road.skipAll) {
        // skipped on the road: the camp is put away unseen (its fire out, its generator down) and the night begins
        this.camp.begin();
        this.camp.finish();
        this._done();
        return;
      }
      this.part = this.camp;
      this.camp.begin();
      return;
    }
    this.camp.update(dt, events);
    if (this.camp.done) this._done();
  }

  _done() {
    this.state = 'done';
    this.done = true;
  }

  cancel() {
    if (this.state !== 'run') return;
    if (this.part === this.road) this.road.end();
    else this.camp.cancel();
    this._done();
  }

  applyCamera(camera) {
    return this.part ? this.part.applyCamera(camera) : false;
  }

  // the debug seek runs across both: road seconds first, then the camp's
  seek(tt) {
    if (tt < this.road.dur) {
      if (this.part !== this.road) { this.camp.cancel(); this.part = this.road; this.road.begin(); }
      this.road.seek(tt);
    } else {
      if (this.part !== this.camp) { this.road.end(); this.part = this.camp; this.camp.begin(); }
      this.camp.seek(tt - this.road.dur);
    }
  }
}

export { CampFilm } from './campFilm.js';
export { RoadFilm } from './roadFilm.js';
