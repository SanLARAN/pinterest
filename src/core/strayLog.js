// The Stray's tally (2.1v): how many times a shift has met her, and whether her skin is yours yet.
// Ten meetings and the oversized tee and the wolf ears can be worn — free, but earned, so the wardrobe
// can show a locked piece with a count instead of a price. Living here rather than in wardrobe or in
// stray.js keeps the rule out of the render code and out of three.js: the test reads it with no scene.
import { readJSON, writeJSON } from './persistence.js';
import { atlasLog } from './storage.js';

export const STRAY_KEY = 'hush.stray.v1';
export const STRAY_MEET = 10; // meetings that unlock her skin (see CFG.STRAY.meet)

function clean(v) {
  const o = v && typeof v === 'object' ? v : {};
  const met = Math.max(0, Math.min(999, Math.floor(Number(o.met) || 0)));
  return { met, skin: o.skin === true || met >= STRAY_MEET };
}

// Ten meetings, or ten nights the atlas already saw her in (synced to the cloud): whichever is further
// along. The live tally is local and immediate; the atlas count survives a new device.
export function strayLog() {
  const local = clean(readJSON(STRAY_KEY, null));
  const seen = Math.max(0, Math.floor(Number(atlasLog?.seen?.stray) || 0));
  const met = Math.max(local.met, seen);
  return { met, skin: local.skin === true || met >= STRAY_MEET };
}

export function strayMet() {
  return strayLog().met;
}

export function straySkinUnlocked() {
  return strayLog().skin;
}

// one more meeting. Returns { met, skin, fresh } — fresh is true only on the night the tenth one lands.
export function noteStrayMeeting(n = 1) {
  const before = strayLog();
  if (before.met >= STRAY_MEET) return { ...before, fresh: false };
  const met = Math.min(STRAY_MEET, before.met + Math.max(1, Math.floor(n)));
  const skin = met >= STRAY_MEET;
  writeJSON(STRAY_KEY, { met, skin }, 'stray');
  return { met, skin, fresh: skin && !before.skin };
}

// how far along the ten you are (0..1) — the wardrobe's locked card reads this
export function strayProgress() {
  return Math.min(1, strayMet() / STRAY_MEET);
}

// test-only: a wiped tally
export function clearStrayLog() {
  writeJSON(STRAY_KEY, { met: 0, skin: false }, 'stray');
}
