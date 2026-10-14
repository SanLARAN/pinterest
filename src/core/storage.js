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
