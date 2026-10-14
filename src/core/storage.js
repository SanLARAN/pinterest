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

const SCORE_KEYS = { classic: STORAGE.scores, checkpoint: STORAGE.scoresCheckpoint };

/** High-score table for a mode ('classic' | 'checkpoint'). Unknown modes fall back to classic. */
export function loadScores(mode = 'classic') {
  try {
    return sanitizeEntries(JSON.parse(get(SCORE_KEYS[mode] ?? STORAGE.scores) || '[]'));
  } catch {
    return [];
  }
}

export function saveScores(list, mode = 'classic') {
  set(SCORE_KEYS[mode] ?? STORAGE.scores, JSON.stringify(list));
}

/** Checkpoint after each boss. Off unless the player turns it on. */
export const loadCheckpoints = () => get(STORAGE.checkpoints) === '1';
export const saveCheckpoints = (on) => set(STORAGE.checkpoints, on ? '1' : '0');

export const loadName = () => get(STORAGE.name) || '';
export const saveName = (name) => set(STORAGE.name, name);
export const loadMuted = () => get(STORAGE.muted) === '1';
export const saveMuted = (muted) => set(STORAGE.muted, muted ? '1' : '0');
/** Atlas discoveries: { monster: [], boss: [], item: [] } of ids. */
export function loadAtlasRaw() {
  try {
    return JSON.parse(get(STORAGE.atlas) || 'null');
  } catch {
    return null;
  }
}
export const saveAtlasRaw = (atlas) => set(STORAGE.atlas, JSON.stringify(atlas));

/** Building translucency, 0..100 (default 50). */
export const loadTranslucency = () => {
  const v = parseInt(get(STORAGE.translucency), 10);
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 50;
};
export const saveTranslucency = (v) => set(STORAGE.translucency, String(Math.max(0, Math.min(100, Math.round(v)))));
