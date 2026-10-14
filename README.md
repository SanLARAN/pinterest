# Hollowkeep

A chibi, low-poly, top-down castle roguelite built with Three.js and Vite.

Emberkeep's gate has split open. The Hollow King's rift is spilling shadows into the courtyard,
and Sir Pip, the last knight of the keep, has to hold the walls. Every run generates a new
realm from simplex noise: rolling terrain, forests, rocks, roads and mountains around a
procedurally placed castle. Five chapters per cycle; a boss (the Hollow Champion) closes each
fifth chapter.

The realm is about 1.45x larger than the first version (176 x 176 cells, play radius 58), and
the 3D world is drawn in a dark, pixelated style: a low internal resolution upscaled with
nearest-neighbour filtering, moonlit fog and palette, glowing braziers, a vignette and scanlines.
The parchment UI stays crisp on top.

## Play

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the bundle on :4173
npm test           # simulation unit tests (node:test)
```

### Controls

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | Left stick (dynamic) |
| Swing | Click, hold Space / J | Tap or drag the right stick (auto-swings) |
| Aim | Mouse cursor | Right stick |
| Dash | Shift / right-click / K | DASH button |
| Psi Burst | Q | Psi button (BURST) |
| Mind Lance | E | Psi button (LANCE) |
| Telekinetic Pull | C | Psi button (PULL) |
| Use pack item | 1–6 | Tap a pack slot |
| Merchant: select / buy / trade / sell / leave | 1–6 select, F next stock, B buy, T trade, X sell, Esc leave | Tap cards and buttons |
| Pause | Esc / P | Pause button (top right) |
| Restart | R / Enter (after game over) | Restart button |
| Mute | M | Sound button |
| Settings (building translucency 0–100%, default 50%) | Settings button on the title or pause screen | Settings button |
| Debug overlay | F3 | — |

Without a manual aim, the swing assists toward the nearest foe in range.

### Systems

- **Combat:** arc swings with sweep-tracked hits, hit-stop, trauma-based screen shake,
  damage popups, additive sparks, death slow-motion before the game-over screen.
- **Enemies:** Gloopling (hops), Shade Imp (weaving), Bonewarden archer (telegraphed shots),
  Mire Ogre (windup and charge). Enemies emerge from rift markers after a telegraph.
- **Bosses:** every 5th chapter is a boss, rotating through four unique bosses, each with three
  telegraphed skills (`src/sim/bosses.js`):
  Hollow Champion (slam, charge, blink), Ash Witch (volley, nova, summon),
  Mire Colossus (quake, charge, summon, takes 35% less damage), Ember Wraith (nova, blink, volley).
  Bosses enrage below half health. Each boss kill drops three relics and restocks the merchant.
- **Enemy stronghold:** a walled compound north of the start. Its four gates stay sealed (portcullis
  bars) until six bosses are slain. Then the gates lift, the two inner rifts start spawning foes, and
  the throne (300 HP) can be struck with swings and psi. Shattering it wins the run: a 3-second
  victory timer, a 2000-point bonus, and a Victory screen. The objective card tracks progress.
- **Dash:** ends in a burst of yellow lightning that crackles out around the knight.
- **Items:** a 6-slot pack of one-use items, permanent boosts and passives: Healing Draught (heal 40),
  Ether Vial (psi +60), Whetstone (swing damage +3), Heart Fruit (max HP +20, heal 20),
  Wind Feather (speed +0.4), Mind Crystal (psi regen +0.5/s). Passive items (gold dot in the pack,
  summed in the passive badge above the pack): Iron Ring (regen 1 HP/s), Stone Bracer (damage taken
  −20%), Lucky Charm (coin pickups ×2), Quickstep Anklet (dash cooldown −30%), Wolf Fang (melee
  damage +10%, stacking). Relics drop from boss kills
  (three) and from each cleared chapter (one). When the pack is full, a relic stays on the
  ground until a slot frees up.
- **Merchant:** a stall stands on the map. Walking into it opens the shop, which freezes the
  game. Buy stock for coins, sell a pack item for half its price, or trade a pack item for a
  stock item (the price difference is settled in coins). Esc or Leave closes it. It reopens
  only after you step back out of range.
- **Pathing:** BFS flow field on a 1-unit grid (8-directional, no corner cutting) with a
  line-of-sight shortcut.
- **Psi energy:** a 100-point meter regenerates about 1.2 per second (plus boons and items: Mind Spring
  +0.6, Mind Crystal +0.5) and gains 5 per kill.
  Q **Psi Burst** (35): radial shockwave that damages and knocks back nearby foes and stuns them
  briefly. E **Mind Lance** (25): a piercing bolt along your aim that strikes each foe once.
  C **Telekinetic Pull** (40): drags everything in range toward you and stuns it for about 1.4s.
  Each skill has its own short cooldown. The rules live in `src/sim/psi.js`.
- **Progression:** shards fill the XP bar; each level offers 3 random boons from 10 upgrades.
- **Scoring:** kill points × combo multiplier (×1 to ×5), coins +5, chapter clear bonus 100 × chapter.
  Coins are also the shop currency; they are tracked separately from score.
- **Waves:** harder than the first cut: more foes per chapter, faster spawns, tougher foes, and
  hits that scale with the chapter.
- **Look:** a faceted low-poly knight with a gem crest, gold pauldrons and a torn cape; the enemy
  castle and the stronghold use bitmap materials. Buildings and scaffolding fade where they hide the
  knight (the Settings translucency slider). A dithered bitmap frame sits around the screen edge.
  A dark bitmap style: posterized colour bands with an ordered Bayer dither on the
  vertex-coloured models, wind sway on foliage, a banded sky, and drifting fireflies
  (`src/render/bitmap.js`).
- **High scores:** top 10 stored locally in the browser. Name entry happens on game over.

### Project layout

```
src/
  config.js          tuning knobs (timestep, world size, pixel scale, camera, storage keys)
  util/              seeded RNG, simplex noise, math helpers
  sim/               pure simulation: layout, nav, collision, waves, scoring, upgrades, psi, bosses, items & shop, high scores
  render/            geometry builders, bitmap shader, palette, pooled particles, world, character, merchant models
  game/              orchestrator (game.js), hero, enemies, pickups, arrows, juice (FX)
  core/              input (keyboard/mouse/touch), audio (WebAudio synth), storage
  ui/                DOM HUD and screens
test/                node:test suites for the pure simulation
```

The simulation modules do not import Three.js, so they run under `node --test`.
