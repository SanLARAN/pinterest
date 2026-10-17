// Settings + local high-score table (localStorage, fails gracefully).
const SETTINGS_KEY = 'hush.settings.v1';
const SCORES_KEY = 'hush.scores.v1';
const MAX_SCORES = 10;

const DEFAULTS = {
  lang: (navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en',
  volume: 0.85,
  mouseSens: 1.0,
  invertY: false,
  micEnabled: true,
  micSens: 0.55,
  voiceEcho: true,
  scares: 'full',
  quality: 'auto',
  radar: false, // minimal HUD by default; the radar is an opt-in assist
  name: '',
  tutorialDone: false,
  voiceVol: {}, // co-op: your volume for each friend, by name (only the ones you changed)
  micCal: null, // the 15-second setup: { floor, talk, shout } dBFS (see ui/miccal.js)
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. */
  }
}

export const settings = { ...DEFAULTS, ...read(SETTINGS_KEY, {}) };
export function saveSettings() {
  write(SETTINGS_KEY, settings);
}

export function getScores() {
  const list = read(SCORES_KEY, []);
  return Array.isArray(list) ? list.filter((s) => s && typeof s.score === 'number') : [];
}

// returns { rank (0-based or -1), list }
export function submitScore(entry) {
  const list = getScores();
  const item = {
    name: (entry.name || '???').slice(0, 14),
    score: Math.floor(entry.score),
    time: Math.round(entry.time),
    won: !!entry.won,
    shards: entry.shards | 0,
    gens: entry.gens | 0,
    coop: entry.coop | 0, // co-op: how many of you were out there
    date: Date.now(),
  };
  list.push(item);
  list.sort((a, b) => b.score - a.score || b.time - a.time);
  const trimmed = list.slice(0, MAX_SCORES);
  write(SCORES_KEY, trimmed);
  return { rank: trimmed.indexOf(item), list: trimmed };
}

export function bestScore() {
  const l = getScores();
  return l.length ? l[0].score : 0;
}

// ---------------- the atlas: what you have lived through, night after night ----------------
const ATLAS_KEY = 'hush.atlas.v1';
function freshAtlas() {
  return {
    nights: 0, wins: 0, best: 0, // best = longest night survived (s)
    seen: {}, // creature -> nights it showed itself to you
    kills: {}, // cause -> times it got you ('scream' too)
    gens: 0, bodies: 0, shards: 0, stones: 0, flares: 0, glows: 0, revives: 0,
    parts: [0, 0, 0, 0, 0], // generator #k started (fuel, plug, fuses, belt, battery)
    carFit: [0, 0, 0, 0], // the УАЗ's parts you fitted yourself (wheel, battery, carburettor, can)
    torches: 0, tapes: 0, crowbars: 0, pried: 0, surveys: 0, lookouts: 0, camps: 0,
    carParts: 0, escapes: 0, // ...all of them, and the nights you drove out of the forest
    sites: {}, // site id -> generators started there
    read: {}, // atlas entries you've opened
    fresh: true, // a red dot by the menu link: there's something new to read
  };
}
function loadAtlas() {
  const a = freshAtlas();
  const raw = read(ATLAS_KEY, null);
  if (!raw || typeof raw !== 'object') return a;
  for (const k of Object.keys(a)) {
    const v = raw[k];
    if (v == null || typeof v !== typeof a[k] || Array.isArray(v) !== Array.isArray(a[k])) continue;
    a[k] = Array.isArray(a[k]) ? a[k].map((d, i) => (Number.isFinite(v[i]) ? v[i] : d)) : v;
  }
  return a;
}
export const atlasLog = loadAtlas();
export function saveAtlas() {
  write(ATLAS_KEY, atlasLog);
}

// one night is over. stats = game.stats (+ seen/shades), res = { won, cause }, started = [{ k, site }] of running generators
export function recordNight(stats, res, started = []) {
  const a = atlasLog;
  a.nights++;
  if (res.won) a.wins++;
  a.best = Math.max(a.best, Math.round(stats.time || 0));
  for (const type of Object.keys(stats.seen || {})) {
    if (!a.seen[type] && !a.read[type]) a.fresh = true; // a first meeting: the atlas has a page for it
    a.seen[type] = (a.seen[type] | 0) + 1;
  }
  if (!res.won && res.cause && !res.hostLost) a.kills[res.cause] = (a.kills[res.cause] | 0) + 1;
  a.bodies += stats.bodies | 0;
  a.shards += stats.shards | 0;
  a.stones += stats.thrown | 0;
  a.flares += stats.flares | 0;
  a.glows += stats.glows | 0;
  a.revives += stats.revives | 0;
  a.torches += stats.torch | 0;
  for (const k of ['tapes', 'crowbars', 'pried', 'surveys', 'lookouts', 'camps']) a[k] += stats[k] | 0;
  a.carParts += stats.parts | 0;
  for (let i = 0; i < 4; i++) a.carFit[i] += (stats.carFit && stats.carFit[i]) | 0;
  if (res.escaped && res.won) a.escapes++;
  for (const g of started) {
    a.gens++;
    if (g.k >= 0 && g.k < 5) a.parts[g.k]++;
    if (g.site) a.sites[g.site] = (a.sites[g.site] | 0) + 1;
  }
  saveAtlas();
}
