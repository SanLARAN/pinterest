# Hollowkeep

A chibi, low-poly, top-down castle roguelite built with Three.js and Vite.

Emberkeep's gate has split open. The Hollow King's rift is spilling shadows into the courtyard,
and Sir Pip, the last knight of the keep, has to hold the walls. Every run generates a new
realm from simplex noise: rolling terrain, forests, rocks, roads and mountains around a
procedurally placed castle. Five chapters per cycle; a boss (the Hollow Champion) closes each
fifth chapter.

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
| Pause | Esc / P | Pause button (top right) |
| Restart | R / Enter (after game over) | Restart button |
| Mute | M | Sound button |
| Debug overlay | F3 | — |

Without a manual aim, the swing assists toward the nearest foe in range.

### Systems

- **Combat:** arc swings with sweep-tracked hits, hit-stop, trauma-based screen shake,
  damage popups, additive sparks, death slow-motion before the game-over screen.
- **Enemies:** Gloopling (hops), Shade Imp (weaving), Bonewarden archer (telegraphed shots),
  Mire Ogre (windup and charge), and the Hollow Champion boss (shockwave slams, enrages at
  half health). Enemies emerge from rift markers after a telegraph.
- **Pathing:** BFS flow field on a 1-unit grid (8-directional, no corner cutting) with a
  line-of-sight shortcut.
- **Progression:** shards fill the XP bar; each level offers 3 random boons from 9 upgrades.
- **Scoring:** kill points × combo multiplier (×1 to ×5), coins +5, chapter clear bonus 100 × chapter.
- **High scores:** top 10 stored locally in the browser. Name entry happens on game over.

### Project layout

```
src/
  config.js          tuning knobs (timestep, hero, camera, storage keys)
  util/              seeded RNG, simplex noise, math helpers
  sim/               pure simulation: layout, nav, collision, waves, scoring, upgrades, high scores
  render/            geometry builders, palette, pooled particles, world & character models
  game/              orchestrator (game.js), hero, enemies, pickups, arrows, juice (FX)
  core/              input (keyboard/mouse/touch), audio (WebAudio synth), storage
  ui/                DOM HUD and screens
test/                node:test suites for the pure simulation
```

The simulation modules do not import Three.js, so they run under `node --test`.
