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
