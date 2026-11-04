// 3.0x: a player's card — the numbers a full-screen profile shows. Built from what this machine already keeps
// (the atlas, the score table, the purse, the Stray's tally, the outfit), published to the profile row for friends
// (hush_card_publish), and read back from it. Self-reported and cosmetic: nothing is decided by it.
//
// Pure: buildCard takes the pieces, cleanCard takes anything and returns a card that is safe to draw.

export const CARD_V = 1;
const int = (v, max = 1e9) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const KILLERS = ['listener', 'crawler', 'watcher', 'howler', 'shkaf', 'angler', 'stray', 'drowned', 'razlom', 'shark', 'scream'];
const CREATURES = ['listener', 'crawler', 'watcher', 'howler', 'shkaf', 'angler', 'stray', 'shade', 'drowned', 'gnat'];

export function buildCard({ atlas = {}, scores = [], wallet = {}, strayMet = 0, fit = null, now = Date.now() } = {}) {
  const kills = atlas.kills || {};
  const seen = atlas.seen || {};
  const top = Object.entries(kills).filter(([k]) => KILLERS.includes(k)).map(([k, n]) => [k, int(n)]).filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 4);
  const best = (scores || []).reduce((m, s) => Math.max(m, int(s && s.score)), 0);
  return cleanCard({
    v: CARD_V,
    nights: atlas.nights, wins: atlas.wins, bogWins: atlas.bogWins, escapes: atlas.escapes,
    best: atlas.best, gens: atlas.gens, bodies: atlas.bodies, revives: atlas.revives,
    shards: wallet.total, score: best, stray: strayMet,
    met: CREATURES.filter((c) => int(seen[c]) > 0).length,
    kills: Object.fromEntries(top),
    fit, at: now,
  });
}

// anything → a card that is safe to draw (unknown keys dropped, numbers clamped, the outfit kept small)
export function cleanCard(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const kills = {};
  for (const [k, n] of Object.entries(c.kills && typeof c.kills === 'object' ? c.kills : {})) {
    if (KILLERS.includes(k) && int(n) > 0 && Object.keys(kills).length < 4) kills[k] = int(n, 1e6);
  }
  const fit = c.fit && typeof c.fit === 'object' && JSON.stringify(c.fit).length < 600 ? c.fit : null;
  return {
    v: CARD_V,
    nights: int(c.nights, 1e6), wins: int(c.wins, 1e6), bogWins: int(c.bogWins, 1e6), escapes: int(c.escapes, 1e6),
    best: int(c.best, 1e5), gens: int(c.gens, 1e7), bodies: int(c.bodies, 1e7), revives: int(c.revives, 1e6),
    shards: int(c.shards, 1e9), score: int(c.score, 1e9), stray: int(c.stray, 10), met: int(c.met, CREATURES.length),
    kills, fit, at: int(c.at, 9e15),
  };
}

// the forest is cleared by a win that was not a bog win (the same rule as core/mapUnlock.js)
export const cardForest = (card) => card.wins - card.bogWins > 0;
export const cardCreatures = CREATURES.length;
