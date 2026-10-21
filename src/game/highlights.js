// The shift's highlight reel (2.1u): a director that watches the night for the moments worth laughing at
// afterwards — a death, a grab, the Watcher's grip, a friend going down, a chain ringing you out, a
// generator blowing up, a scream — and keeps the seconds *around* each one, so the reel shows the stupid
// thing that led to it, not just the punchline.
//
// It owns no rendering and no network: frames come from the caller (a small JPEG grab of the canvas, see
// main.js) and are treated as opaque tokens here, so the whole thing is testable in plain Node. The reel UI
// (ui/reel.js) plays the result back and writes it out as a video file.
//
// A take = one moment being recorded: [start - pre, note + post]. Takes of the same kind merge, and a take
// that lands inside the open one merges too, so a grab that becomes a death is one continuous shot rather
// than the same second twice.
export const HL = {
  fps: 7, // frames a second while recording (the reel is found-footage, 7 is plenty)
  pre: 3.4, // how much of the run-up a moment keeps
  post: 2.4, // ...and of the aftermath
  max: 6, // clips kept per shift
  dedupe: 1.8, // s: the same kind of moment never opens twice this close together
  minFrames: 3, // fewer than this and the take is a blink, not a moment
  mergeGap: 0.45, // s: takes this close to an earlier clip join it instead of starting a second one
};

// what makes the reel, and how much it is worth when the reel has to drop something
export const HL_WEIGHT = {
  escape: 11, // you actually got away
  left: 9, // ...or the car drove off while you were still standing there
  win: 10, // you survived to the last morning
  death: 10, // ...and you didn't
  grab: 9, // the Angler had you
  seize: 9, // the Watcher's gaze
  down: 8, // a friend went down
  revive: 7, // ...and got up again
  genBroken: 7, // a thing beat your generator to death
  genStart: 6, // the light came back on
  chain: 5, // a stall chain gave you away
  scream: 5, // you yelled in the dark
};

export const HL_KINDS = Object.keys(HL_WEIGHT);

export class Highlights {
  constructor(opts = {}) {
    this.fps = opts.fps ?? HL.fps;
    this.pre = opts.pre ?? HL.pre;
    this.post = opts.post ?? HL.post;
    this.max = opts.max ?? HL.max;
    this.dedupe = opts.dedupe ?? HL.dedupe;
    this.minFrames = opts.minFrames ?? HL.minFrames;
    this.mergeGap = opts.mergeGap ?? HL.mergeGap;
    this.reset();
  }

  reset() {
    this.t = 0;
    this.lastGrab = -1e9;
    this.buffer = []; // the lead-in: recent frames, so the first moment still has a run-up
    this.takes = [];
    this.clips = [];
    this.seen = new Map(); // kind → last note time
    this.closed = false;
  }

  get count() {
    return this.clips.length;
  }

  // seconds of footage in the reel (frames are not enough: the reel is played back at its own pace)
  duration() {
    return this.clips.reduce((a, c) => a + Math.max(0.2, c.end - c.start), 0);
  }

  // something happened. The caller does not pass the time: update() carries the clock, so a note from
  // deep inside the game (a monster, a chain) always lands on the same timeline as the frames.
  note(kind, meta = {}) {
    if (this.closed || !(kind in HL_WEIGHT)) return null;
    const t = this.t;
    const last = this.seen.get(kind);
    if (last != null && t - last < this.dedupe) return null;
    this.seen.set(kind, t);
    const open = this.takes.find((k) => k.kind === kind);
    if (open) {
      open.end = Math.max(open.end, t + this.post); // the same moment, still going on
      open.meta = { ...open.meta, ...meta };
      return open;
    }
    const take = {
      kind,
      meta: { ...meta },
      start: Math.max(0, t - this.pre),
      end: t + this.post,
      weight: HL_WEIGHT[kind] ?? 3,
      frames: [],
    };
    // the run-up we already have: whatever the lead-in buffer holds inside the window
    for (const f of this.buffer) if (f.t >= take.start) take.frames.push(f);
    this.takes.push(take);
    return take;
  }

  // the clock and the frames. grab(t) returns an opaque frame (or null); called at ~fps while playing.
  update(t, grab = null) {
    if (this.closed) return;
    if (!(t >= this.t)) t = this.t; // time never runs backwards (a restart comes with reset())
    this.t = t;
    if (t - this.lastGrab >= 1 / this.fps - 1e-6) {
      this.lastGrab = t;
      const frame = grab ? grab(t) : null;
      if (frame) {
        const f = { t, frame };
        this.buffer.push(f);
        for (const k of this.takes) if (t >= k.start && t <= k.end) k.frames.push(f);
      }
    }
    // forget the lead-in we can no longer need
    const cut = this.t - this.pre - 0.5;
    while (this.buffer.length && this.buffer[0].t < cut) this.buffer.shift();
    // a take whose tail is behind us is a clip now
    const done = this.takes.filter((k) => this.t > k.end);
    if (done.length) {
      for (const k of done) this._close(k);
      this.takes = this.takes.filter((k) => this.t <= k.end);
    }
  }

  // the night is over: close what is open and stop recording (the reel keeps what it has)
  stop() {
    if (this.closed) return;
    for (const k of this.takes) this._close(k);
    this.takes = [];
    this.closed = true;
  }

  // chronological: the reel tells the night in order
  list() {
    return this.clips.slice().sort((a, b) => a.start - b.start);
  }

  _close(k) {
    const frames = k.frames.slice().sort((a, b) => a.t - b.t);
    const uniq = [];
    for (const f of frames) if (!uniq.length || f.t > uniq[uniq.length - 1].t + 1e-6) uniq.push(f);
    if (uniq.length < this.minFrames) return;
    // does it run into the clip before it? then it is the same shot (a grab turning into a death)
    const last = this.clips[this.clips.length - 1];
    if (last && uniq[0].t <= last.end + this.mergeGap) {
      const byT = new Map(last.frames.map((f) => [f.t, f]));
      for (const f of uniq) if (!byT.has(f.t)) byT.set(f.t, f);
      last.frames = [...byT.values()].sort((a, b) => a.t - b.t);
      last.end = Math.max(last.end, uniq[uniq.length - 1].t);
      if (k.weight > last.weight) {
        last.kind = k.kind;
        last.weight = k.weight;
      }
      last.kinds = [...new Set([...(last.kinds || [last.kind]), k.kind])];
      last.meta = { ...last.meta, ...k.meta };
      return;
    }
    this.clips.push({
      kind: k.kind,
      kinds: [k.kind],
      meta: k.meta,
      weight: k.weight,
      start: uniq[0].t,
      end: uniq[uniq.length - 1].t,
      frames: uniq,
    });
    while (this.clips.length > this.max) {
      // drop the least interesting: the lowest weight, and among equals the earliest
      let worst = 0;
      for (let i = 1; i < this.clips.length; i++) {
        const a = this.clips[i], b = this.clips[worst];
        if (a.weight < b.weight || (a.weight === b.weight && a.start < b.start)) worst = i;
      }
      this.clips.splice(worst, 1);
    }
  }
}

// ---------------- the reel as a running order ----------------
// The UI plays clips back to back with a card between them. This is the arithmetic of that, kept out of the
// DOM so it can be checked.
export function reelPlan(clips, { lead = 0.5, tail = 0.4 } = {}) {
  return clips.map((c, i) => ({
    ...c,
    index: i,
    duration: Math.max(0.2, c.end - c.start) + lead + tail,
    lead,
    tail,
  }));
}

export function reelDuration(plan) {
  return plan.reduce((a, c) => a + c.duration, 0);
}

// the saved file: no clock, just the night's date, so a folder of them sorts
export function reelFileName(date = new Date(), ext = 'webm') {
  const p = (n) => String(n).padStart(2, '0');
  return `hush-highlights-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.${ext}`;
}

// the frame under the playhead: the last one at or before `at`
export function frameAt(frames, at) {
  if (!frames || !frames.length) return null;
  let lo = 0, hi = frames.length - 1, best = frames[0];
  if (at <= frames[0].t) return frames[0];
  if (at >= frames[hi].t) return frames[hi];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].t <= at) { best = frames[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}
