// Game modes, heroes and the rules that depend on them. Pure, so it can be tested without a browser.
import { BERSERKER_SKILLS } from './berserker.js';
import { PSI } from './psi.js';


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

/**
 * Heroes. `moves` are the hero's own actions. `skills` are the ids of his three abilities:
 * psi skills for the knight (sim/psi.js PSI.skills), berserker abilities for the berserker
 * (sim/berserker.js BERSERKER_SKILLS). `mods` change the sword: damage, swing interval and swing time.
 */
export const CHARACTERS = [
  {
    id: 'knight',
    name: 'Sir Pip',
    blurb: 'The last knight of Emberkeep.',
    moves: [
      { key: 'Click', name: 'Swing', desc: 'Sword strike, your basic attack' },
      { key: 'Shift', name: 'Dash', desc: 'Quick dash with a brief window of invulnerability' },
    ],
    skills: ['skill1', 'skill2', 'skill3'],
    mods: { damageMul: 1, swingCooldownMul: 1, swingTimeMul: 1 },
  },
  {
    id: 'berserker',
    name: 'Ashmane',
    blurb: 'Ash-grey hair, a frost blade, and no fear of his own blood.',
    moves: [
      { key: 'Click', name: 'Frost thrust', desc: 'Heavy, slow thrust with the frost blade: hits very hard but takes its time' },
      { key: 'Shift', name: 'Dash', desc: 'Quick dash with a brief window of invulnerability' },
    ],
    skills: ['skill1', 'skill2', 'skill3'],
    mods: { damageMul: 2.2, swingCooldownMul: 1.9, swingTimeMul: 1.6 },
  },
];

/** The sword modifiers of a hero (knight's are neutral). */
export function modsFor(id) {
  return CHARACTERS.find((c) => c.id === id)?.mods ?? CHARACTERS[0].mods;
}

/** The ability definitions a hero's `skills` ids refer to. */
export function skillDefsFor(id) {
  return id === 'berserker' ? BERSERKER_SKILLS : PSI.skills;
}

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
