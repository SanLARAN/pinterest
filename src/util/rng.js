// Small, fast, seedable PRNG (mulberry32) plus helpers.

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted(entries) {
      let total = 0;
      for (const e of entries) total += e.weight;
      if (total <= 0) return undefined;
      let r = next() * total;
      for (const e of entries) {
        r -= e.weight;
        if (r <= 0) return e.item;
      }
      return entries[entries.length - 1].item;
    },
  };
}

/** Short human-friendly run code derived from a seed, e.g. "HK-7F3A". */
export function seedCode(seed) {
  return 'HK-' + (seed >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-4);
}
