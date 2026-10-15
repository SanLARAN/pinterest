// Chapter/wave director. Pure: all side effects go through the `env` callbacks.
import { bossForWave } from './bosses.js';
export const CHAPTERS = [
  { title: 'The Gate Breaks', story: 'A rift tore open beneath Emberkeep gate. Gloopings spill from the cracks. Hold the courtyard!' },
  { title: 'Imps in the Orchard', story: 'Shade imps dart over the walls, hunting the king\u2019s gardens. Be quick, Sir Pip.' },
  { title: 'Bones on the Walls', story: 'The Bonewardens rise from the moat, bows drawn toward the keep.' },
  { title: 'The Mire Ogres Stir', story: 'The ogres of Mirewood answer the Hollow King\u2019s call and come charging.' },
  { title: 'The Hollow Champion', story: 'The Hollow King\u2019s champion strides through the rift. Defeat him and the keep is free.' },
];

export function chapterFor(n) {
  if (n % 5 === 0) {
    const b = bossForWave(n);
    return { title: b.title, story: b.story };
  }
  if (n >= 1 && n <= CHAPTERS.length) return CHAPTERS[n - 1];
  return { title: `Rift Tide ${n}`, story: 'The rift breathes harder. More shapes pour from the cracks.' };
}

/**
 * Wave `n`. Story caps the spawn total at 90 so the campaign has a finite length.
 * Endless lifts that cap: the spawn total keeps growing, and so do foe health and damage.
 * Spawn pace and the alive cap stay bounded to keep the frame time steady.
 */
export function waveSpec(n, endless = false) {
  const isBoss = n % 5 === 0;
  // Harder than the first cut: more foes, faster spawns, tougher foes, harder hits.
  const total = endless ? 10 + n * 4 : Math.min(90, 10 + n * 4);
  const pool = [{ item: 'slime', weight: 9 }];
  if (n >= 2) pool.push({ item: 'imp', weight: 5 + n * 0.6 });
  if (n >= 2) pool.push({ item: 'archer', weight: 2 + n * 0.5 });
  if (n >= 3) pool.push({ item: 'brute', weight: 1.5 + n * 0.45 });
  return {
    number: n,
    isBoss,
    bossId: isBoss ? bossForWave(n).id : null,
    total,
    interval: Math.max(0.32, 1.2 - n * 0.07),
    maxAlive: Math.min(14 + n * 3, 40),
    pool,
    hpScale: 1 + (n - 1) * 0.14,
    dmgScale: 1 + (n - 1) * 0.05,
    introTime: n === 1 ? 1.2 : 2.4,
    ...chapterFor(n),
  };
}

export class WaveDirector {
  constructor(rng, endless = false) {
    this.rng = rng;
    this.endless = endless;
    this.wave = 0;
    this.phase = 'idle';
    this.timer = 0;
    this.spec = null;
    this.spawned = 0;
    this.bossSpawned = false;
    this.spawnTimer = 0;
  }

  /** Begins the next wave (called once at run start and after each clear). */
  nextWave(env) {
    this.wave += 1;
    this.spec = waveSpec(this.wave, this.endless);
    this.spawned = 0;
    this.bossSpawned = false;
    this.phase = 'intro';
    this.timer = this.spec.introTime;
    env.onChapter(this.spec);
  }

  update(dt, env) {
    if (this.phase === 'idle' || !this.spec) return;
    const spec = this.spec;
    switch (this.phase) {
      case 'intro':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.phase = 'spawning';
          this.spawnTimer = 0.2;
        }
        break;
      case 'spawning': {
        if (spec.isBoss && !this.bossSpawned) {
          this.bossSpawned = true;
          env.spawn('boss', spec.hpScale, spec.bossId);
        }
        this.spawnTimer -= dt;
        const alive = env.alive();
        if (this.spawnTimer <= 0 && this.spawned < spec.total && alive < spec.maxAlive) {
          const type = this.rng.weighted(spec.pool);
          env.spawn(type, spec.hpScale);
          this.spawned++;
          this.spawnTimer = spec.interval * (0.8 + this.rng.next() * 0.4);
        }
        if (this.spawned >= spec.total) this.phase = 'clearing';
        break;
      }
      case 'clearing':
        if (env.alive() === 0) {
          this.phase = 'breather';
          this.timer = 2;
          env.onCleared(spec);
        }
        break;
      case 'breather':
        this.timer -= dt;
        if (this.timer <= 0) this.nextWave(env);
        break;
      default:
        break;
    }
  }
}
