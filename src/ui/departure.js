// Shared deterministic film timing: all peers use the same roster slot for the late passenger.
export const DEPARTURE = Object.freeze({ boardStart:2.6, boardEnd:4.8, driveStart:5.2, stumbleStart:3.5, stumbleEnd:4.7, recoverEnd:5.6, fadeStart:9.5, end:10.3 });
export function latePassenger(slots) { const passengers=slots.filter(s=>s>0);return passengers.length?Math.max(...passengers):-1; }
export function departureBeat(t) {
  const d=DEPARTURE, clamp=v=>Math.max(0,Math.min(1,v));
  return { board:clamp((t-d.boardStart)/(d.boardEnd-d.boardStart)),drive:clamp((t-d.driveStart)/2.4),
    stumble:t>=d.stumbleStart&&t<d.recoverEnd, fall:clamp((t-d.stumbleStart)/.5)*(1-clamp((t-d.stumbleEnd)/(d.recoverEnd-d.stumbleEnd))),
    chase:t>=d.recoverEnd, fade:1-clamp((t-d.fadeStart)/.7),done:t>=d.end };
}
