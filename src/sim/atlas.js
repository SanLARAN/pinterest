// The Atlas: a book of everything the knight has met. Entries unlock on first contact
// (a foe spawns, a boss appears, an item is picked up or bought). Pure data and rules.
import { ENEMY_DEFS } from './defs.js';
import { BOSS_DEFS } from './bosses.js';
import { ITEMS, ITEM_IDS } from './items.js';

export const ATLAS_TABS = ['monster', 'boss', 'item'];

// ENEMY_DEFS also holds the generic 'boss' spawn type; bosses are listed by BOSS_DEFS instead
const MONSTER_IDS = Object.keys(ENEMY_DEFS).filter((id) => id !== 'boss');

const MONSTER_LORE = {
  slime: 'A wobbling mass of rift slime. Slow to think and quick to hop, it bounces straight at the nearest knight. Easy to cut down, dangerous in numbers.',
  imp: 'A shadow that weaves in and out of your swings. Hard to pin down, and its claws are sharp. Stay patient and strike when it lands.',
  archer: 'A Bonewarden that keeps its distance and looses telegraphed arrows. Step off the line of fire, then close the gap while it reloads.',
  brute: 'A Mire Ogre that winds up a heavy charge. Sidestep the windup, because one hit from it can flatten a knight.',
};

/** Every atlas entry, in book order. Items come from the shop/loot table. */
export function catalog() {
  const monsters = MONSTER_IDS.map((id) => ({
    kind: 'monster', id, name: ENEMY_DEFS[id].name, desc: MONSTER_LORE[id] ?? '', hp: ENEMY_DEFS[id].hp,
  }));
  const bosses = Object.keys(BOSS_DEFS).map((id) => ({
    kind: 'boss', id, name: BOSS_DEFS[id].name, desc: BOSS_DEFS[id].story, hp: BOSS_DEFS[id].hp, skills: BOSS_DEFS[id].skills,
  }));
  const items = ITEM_IDS.map((id) => ({
    kind: 'item', id, name: ITEMS[id].name, desc: ITEMS[id].desc, passive: !!ITEMS[id].passive,
  }));
  return { monster: monsters, boss: bosses, item: items };
}

export function emptyAtlas() {
  return { monster: [], boss: [], item: [] };
}

/** Accepts whatever came out of storage and keeps only known ids, each once. */
export function normalizeAtlas(raw) {
  const out = emptyAtlas();
  if (!raw || typeof raw !== 'object') return out;
  const valid = {
    monster: new Set(MONSTER_IDS),
    boss: new Set(Object.keys(BOSS_DEFS)),
    item: new Set(ITEM_IDS),
  };
  for (const kind of ATLAS_TABS) {
    const list = Array.isArray(raw[kind]) ? raw[kind] : [];
    for (const id of list) {
      if (valid[kind].has(id) && !out[kind].includes(id)) out[kind].push(id);
    }
  }
  return out;
}

export function isKnown(atlas, kind, id) {
  return !!atlas && Array.isArray(atlas[kind]) && atlas[kind].includes(id);
}

/** Returns a new atlas with the entry added, or the same object when it was already known. */
export function discover(atlas, kind, id) {
  if (isKnown(atlas, kind, id)) return atlas;
  return { ...atlas, [kind]: [...atlas[kind], id] };
}
