// What a collider is, for everything that asks "may I stand here / does light pass".
// It lives on its own because a second map (world/bog.js) has to speak the same language, and importing
// it from World would make the two modules import each other. World re-exports it, so nothing else changes.
export const CAP = { TREE: 0, ROCK: 1, WOOD: 2, METAL: 3, WATER: 4, EFFIGY: 5, FENCE: 6 }; // FENCE: chain-link (you see and light through it)
