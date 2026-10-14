// Checkpoint snapshot for checkpoint mode. Taken when a boss falls, restored when the knight dies.
// Pure data: the game gathers the values, this copies them so later changes to the live run
// cannot leak into the saved checkpoint.

/**
 * @param {object} s  plain values gathered from the live run
 * @returns {object}  an independent copy of the checkpoint fields
 */
export function captureCheckpoint(s) {
  return {
    wave: s.wave, // director wave of the boss that was just slain; the run resumes at wave + 1
    bossesSlain: s.bossesSlain,
    gatesOpen: !!s.gatesOpen,
    throneHp: s.throneHp,
    score: s.score,
    kills: s.kills,
    coins: s.coins,
    level: s.level,
    xp: s.xp,
    xpNext: s.xpNext,
    stats: { ...s.stats },
    inv: [...s.inv], // item ids or null
    psiLevels: { ...s.psiLevels },
  };
}
