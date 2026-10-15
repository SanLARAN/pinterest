# NOISE RALLY

**10 seconds to live. Kill to drive. Win the ride.**

A low-poly combat rally for the browser, played from a high top-down chase cam, with a Mullet MadJack-style twist: your life is a clock that is always running out. Wreck rival drivers and raider buggies to buy time, chain kills into combos, and finish 3 laps in first place to **win the ride**.

Built with [three.js](https://threejs.org) and [Vite](https://vitejs.dev). Everything is generated at runtime: the tracks and desert come from seeded simplex noise, the models are procedural low-poly geometry, and all sound and music is synthesized with the Web Audio API. The game ships no image, model or audio files.

## Play

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build on http://localhost:4173
```

## Rules

| | |
|---|---|
| ⏱ **The clock** | You start with **10 s** and it never stops. It caps at 20 s. At zero, you're scrap. |
| 💀 **Kills** | Rival driver **+3.5 s**, raider buggy **+1.75 s**. Both are worth more while your combo is running. |
| 🏁 **Checkpoints** | Each neon gate gives about **+2 s** (6 gates per lap, scaled to track length). |
| 💥 **Damage** | Getting shot or rammed costs time. Ram while on nitro and you take no damage. |
| 🔥 **Combo** | Kills within 3.6 s multiply your score, up to x10. At **x5** you hit OVERDRIVE: faster fire and no overheating. |
| 🏆 **Win** | Finish 3 laps in **P1** to win the ride. The finish bonus scales with your position and the time you have left. |

Style bonuses: RAM, HEAD-ON, NITRO SLAM, AIRBORNE, DRIFT KILL, LONG SHOT, MULTI, CHAIN, KABOOM (barrels), REVENGE, LEADER DOWN. Long drifts and big jumps also add points and a little time.

## Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Steer | A / D, ← / → | Left thumb (floating stick) | Left stick / D-pad |
| Gas | W / ↑ | automatic | RT |
| Brake / reverse | S / ↓ | DRIFT button | LT |
| Drift | Brake + steer at speed | DRIFT + stick | LB + stick |
| Fire | Space / J / left click | FIRE (auto-fire on lock by default) | A / X |
| Nitro | Shift / K | NITRO | B / RB |
| Pause | Esc / P | ❚❚ button | Start |
| Instant restart | R | Pause menu | Back |
| Music on/off | M | Settings | |
| Camera distance | C | Settings | |

**Perfect start:** press gas during the last beat of the countdown for a nitro burst.

## Features

- Three noise-generated circuits with jumps, start/finish gate, checkpoints, cacti, rocks, mesas, explosive barrels and pickups (nitro, overdrive).
- Seven named rival AIs with their own skill and aggression. They follow racing lines, dodge traffic, use nitro, ram you and shoot. Raider buggies come at you head-on, then turn and hunt.
- Juice: trauma screen shake, hit-stop, slow motion, chromatic aberration, flashes, explosions with fireballs, smoke, sparks, debris and shockwaves, skid marks, dust, tracers, shell casings, and body roll and squash.
- A "noise" post-processing pass: film grain, scanlines, VHS glitch, vignette and anime speed lines.
- Start screen, pause, results with score breakdown, and a local **top-10 high-score table** with 3-letter tags (`localStorage`).
- Quality presets (auto / low / medium / high) with automatic downgrade if the frame rate drops. Shadows, MSAA and pixel ratio adapt for mobile.

## Project layout

```
src/
  main.js        boot + error handling
  game.js        game states, race rules, scoring, events, effects
  track.js       noise track generator, speed profile, spatial queries
  terrain.js     low-poly heightfield blended to the road
  world.js       road ribbon, gates, props + colliders, pickups
  car.js         arcade vehicle physics, damage, wrecks, visuals
  ai.js          rival racing AI + raider AI
  weapons.js     hitscan guns with aim assist, enemy bolts
  particles.js   pooled sprites, low-poly puffs, debris, rings, skid marks
  camera.js      chase / orbit / victory cameras
  post.js        post-processing pass
  audio.js       synthesized engine, SFX and music
  hud.js, ui.js  HUD, menus, results, high-score entry
  input.js       keyboard, touch, gamepad
```

`?autopilot` in the URL lets the AI drive your car during a race (demo and testing mode).
