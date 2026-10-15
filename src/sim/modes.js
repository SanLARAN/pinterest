// Game modes, heroes and the rules that depend on them. Pure, so it can be tested without a browser.

/** Story keeps the six-boss gate-and-throne campaign. Endless has no end and one life. */
export const MODES = {
  story: {
    id: 'story',
    label: 'Story',
    blurb: 'Slay six bosses to open the enemy gates, then shatter the throne. Checkpoints are optional.',
  },
  endless: {
    id: 'endless',
    label: 'Endless',
    blurb: 'No throne and no end. The waves never stop growing. One life: the first fall ends the run.',
  },
};

/** Heroes. Only one for now; the picker is already in place for more. */
export const CHARACTERS = [
  { id: 'knight', name: 'Sir Pip', blurb: 'The last knight of Emberkeep.' },
];

export const DEFAULT_MODE = 'story';
export const DEFAULT_CHARACTER = 'knight';

/** Score table labels, keyed by table id (see tableOf). */
export const TABLE_LABELS = {
  classic: 'Story · no checkpoints',
  checkpoint: 'Story · checkpoints',
  endless: 'Endless',
};

/** Which high-score table a run writes to. Endless always has its own. */
export function tableOf(mode, checkpoints) {
  if (mode === 'endless') return 'endless';
  return checkpoints ? 'checkpoint' : 'classic';
}

/**
 * The rules a run starts with, from the mode and checkpoint setting chosen between runs.
 * Endless never uses checkpoints: its single life is the whole point.
 */
export function runSetup(mode, checkpointsOn) {
  const endless = mode === 'endless';
  const checkpoints = !endless && !!checkpointsOn;
  const id = endless ? 'endless' : 'story';
  return { mode: id, checkpoints, table: tableOf(id, checkpoints) };
}

export const isEndless = (mode) => mode === 'endless';
