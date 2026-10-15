// Local persistence: high-score table + settings.

const HS_KEY = 'noiseRally.scores.v1';
const SET_KEY = 'noiseRally.settings.v1';
const MAX = 10;

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (_) {
    return fallback;
  }
}

function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) { /* private mode */ }
}

export const HighScores = {
  list() {
    const l = read(HS_KEY, []);
    return Array.isArray(l) ? l.filter((e) => e && typeof e.score === 'number') : [];
  },
  best() {
    const l = this.list();
    return l.length ? l[0].score : 0;
  },
  qualifies(score) {
    if (score <= 0) return false;
    const l = this.list();
    return l.length < MAX || score > l[l.length - 1].score;
  },
  /** Insert and return the index of the new entry (or -1). */
  add(entry) {
    const l = this.list();
    const e = { ...entry, id: Date.now() + Math.random() };
    l.push(e);
    l.sort((a, b) => b.score - a.score);
    const out = l.slice(0, MAX);
    write(HS_KEY, out);
    return out.findIndex((x) => x.id === e.id);
  },
  rename(index, name) {
    const l = this.list();
    if (!l[index]) return;
    l[index].name = name;
    write(HS_KEY, l);
  },
};

export function loadSettings() {
  const d = {
    volume: 0.8, music: true, shake: 1, quality: 'auto', autoFire: 'touch',
    showFps: false, tag: 'ACE', track: 0, farCam: false,
  };
  const s = read(SET_KEY, {});
  return { ...d, ...(s && typeof s === 'object' ? s : {}) };
}

export function saveSettings(s) { write(SET_KEY, s); }
