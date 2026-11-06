// Which участок a shift is played on. Two of them now: the forest the game began in, and the peat bog
// (3.0; since 5.0 «Топь», world/swamp.js). The World is built once at boot from the URL (?map=bog), and the menu offers the
// choice; picking the one that is not loaded is a reload with the map in the query — the level is a whole
// piece of ground, not a switch you can throw under a running shift.
export const MAP_IDS = ['forest', 'bog'];

export const cleanMap = (v) => (v === 'bog' ? 'bog' : 'forest');

// what the menu calls them
export const MAP_KEY = { forest: 'mapForest', bog: 'mapBog' };

// the shift's length is a setting, the map is not: it decides the world, so it goes in the URL.
// (3.0u) range: arrive at the training ground (its film), not in a shift — the range is the forest's, in daylight
export function runUrl(map, days, base = '', { range = false } = {}) {
  const m = range ? 'forest' : cleanMap(map);
  const q = new URLSearchParams();
  if (m === 'bog') q.set('map', 'bog');
  q.set(range ? 'range' : 'autostart', '');
  if ([2, 4, 6].includes(+days)) q.set('days', String(+days));
  return `${base}?${q.toString()}`.replace('?&', '?');
}

// should this machine reload before it can play the shift the menu asked for?
export const needsReload = (chosen, loaded) => cleanMap(chosen) !== cleanMap(loaded);
