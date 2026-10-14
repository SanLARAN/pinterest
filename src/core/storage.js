// Safe localStorage wrappers (Safari private mode and sandboxed iframes can throw).
import { STORAGE } from '../config.js';
import { sanitizeEntries } from '../sim/highscores.js';

function get(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function loadScores() {
  try {
    return sanitizeEntries(JSON.parse(get(STORAGE.scores) || '[]'));
  } catch {
    return [];
  }
}

export function saveScores(list) {
  set(STORAGE.scores, JSON.stringify(list));
}

export const loadName = () => get(STORAGE.name) || '';
export const saveName = (name) => set(STORAGE.name, name);
export const loadMuted = () => get(STORAGE.muted) === '1';
export const saveMuted = (muted) => set(STORAGE.muted, muted ? '1' : '0');
/** Building translucency, 0..100 (default 50). */
export const loadTranslucency = () => {
  const v = parseInt(get(STORAGE.translucency), 10);
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 50;
};
export const saveTranslucency = (v) => set(STORAGE.translucency, String(Math.max(0, Math.min(100, Math.round(v)))));
