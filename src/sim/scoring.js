// Score, combo multiplier and wave bonuses. Pure logic.
export const COMBO_WINDOW = 2.8; // seconds between kills before the combo resets
export const MAX_MULTIPLIER = 5;

export class ScoreKeeper {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.kills = 0;
    this.coins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
  }

  get multiplier() {
    return Math.min(MAX_MULTIPLIER, 1 + Math.floor(this.combo / 4));
  }

  /** Registers a kill. Returns the points gained and the multiplier used. */
  kill(basePoints) {
    this.kills++;
    this.combo++;
    this.comboTimer = COMBO_WINDOW;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const multiplier = this.multiplier;
    const gained = basePoints * multiplier;
    this.score += gained;
    return { gained, multiplier, combo: this.combo };
  }

  collectCoin(value) {
    this.coins++;
    this.score += value;
    return value;
  }

  waveBonus(wave) {
    const bonus = 100 * wave;
    this.score += bonus;
    return bonus;
  }

  breakCombo() {
    this.combo = 0;
    this.comboTimer = 0;
  }

  update(dt) {
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.breakCombo();
    }
  }
}
