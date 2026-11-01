// The bog is earned (3.0s). Solo, the peat works open once a shift on the forestry has been won — driven out
// on the УАЗ or lived to the last dawn, alone or with friends. The atlas already counts wins (and syncs them
// to the cloud); it now also counts the ones won on the bog, so «the forest is cleared» is simply a win that
// was not a bog win. Wins from before 3.0s count as the forest's: the bog was open to everyone then.
//
// In a room the ground is the host's to pick, but it is everyone's night: a player who has not cleared the
// forest is asked and has to agree (net/coop.js, mapAsk). This file is the rule; coop and the menu read it.
import { atlasLog } from './storage.js';

export function forestCleared(log = atlasLog) {
  return (log?.wins | 0) - (log?.bogWins | 0) > 0;
}

// can this machine pick the ground `map` on its own?
export function mapOpen(map, log = atlasLog) {
  return map !== 'bog' || forestCleared(log);
}

// which players in a room still have to say yes before the bog is the room's ground: everyone who has not
// cleared the forest, except the one who picked it (the host's own pick is their yes)
export function mapAskList(map, players, hostId) {
  if (map !== 'bog') return [];
  return players.filter((p) => p.id !== hostId && !p.cleared).map((p) => p.id);
}

// a room may pick the bog at all only if someone in it has been there and back through the forest
export function roomMapOpen(map, players) {
  return map !== 'bog' || players.some((p) => p.cleared);
}
