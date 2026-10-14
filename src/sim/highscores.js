// Local high-score table logic. Storage is injected so this stays testable.
export const MAX_SCORES = 10;
export const DEFAULT_NAME = 'KNIGHT';

/** Each mode keeps its own table. The key is the mode id; see core/storage.js. */
export const MODE_LABELS = { classic: 'Classic', checkpoint: 'Checkpoints' };
export const modeOf = (checkpoints) => (checkpoints ? 'checkpoint' : 'classic');

export function cleanName(raw) {
  const s = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .trim()
    .slice(0, 12);
  return s || DEFAULT_NAME;
}

export function sanitizeEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e.score === 'number' && Number.isFinite(e.score))
    .map((e) => ({
      name: cleanName(e.name),
      score: Math.max(0, Math.floor(e.score)),
      wave: Math.max(1, Math.floor(Number(e.wave) || 1)),
      kills: Math.max(0, Math.floor(Number(e.kills) || 0)),
      level: Math.max(1, Math.floor(Number(e.level) || 1)),
      time: Number(e.time) || 0,
      seed: String(e.seed ?? ''),
    }))
    .sort(byScore)
    .slice(0, MAX_SCORES);
}

function byScore(a, b) {
  return b.score - a.score || a.time - b.time;
}

export function qualifies(list, score) {
  if (score <= 0) return false;
  if (list.length < MAX_SCORES) return true;
  return score > list[list.length - 1].score;
}

/** Inserts an entry; returns the new list and the 1-based rank (or null if it didn't make the table). */
export function addScore(list, entry) {
  const next = [...list, entry].sort(byScore).slice(0, MAX_SCORES);
  const idx = next.indexOf(entry);
  return { list: next, rank: idx >= 0 ? idx + 1 : null };
}
