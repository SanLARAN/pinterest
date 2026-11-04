// One run of the game: rules, scoring, director, scares, juice.
import * as THREE from 'three';
import { CFG, dangerMultiplier, monsterTargets, diffDay, fovFor } from '../core/config.js';
import { RNG, Simplex2, clamp, lerp, smoothstep, damp, angleDiff } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { createMonster, ShadeRig, buildRig } from './monsters.js';
import { RemotePlayer, PLAYER_HEX } from './remote.js';
import { SelfBody } from './selfbody.js';
import { myFit } from './outfit.js';
import { Beyond } from '../ui/beyond.js';
import { earn, EARN } from './wallet.js';
import { NetSync } from './netsync.js';
import { Objectives } from './objectives.js';
import { Player, spring } from './player.js';
import { Shards } from './shards.js';
import { Stones } from './stones.js';
import { Doors } from './doors.js';
import { Flares } from './flares.js';
import { GlowSticks } from './glowsticks.js';
import { MedHut } from './medhut.js';
import { Rescue } from './rescue.js';
import { Escape } from './escape.js';
import { Bunker } from './bunker.js'; // 3.0q: the shelter under the peat works' camp, and what is in it
import { Cabinets } from './cabinets.js';
import { Torches } from './torch.js';
import { PhotoCamera } from './photo.js'; // 4.0: the camera and its flash
import { ForestTools } from './tools.js';
import { Expedition } from './expedition.js';
import { Backpack } from './inventory.js';
import { FieldView } from './fieldView.js';
import { Bag3D } from '../ui/bag3d.js';
import { MotoPark, MOTO, riderEye } from './moto.js';
import { Training } from './training.js';
import { VoiceMimic } from './voiceMimic.js';
import { Dread } from './dread.js';
import { Campfire } from './campfire.js';
import { IntroCutscene } from './intro.js';
import { CAP } from '../world/world.js';
import { shared } from '../render/sonar.js';
import { Pulses } from '../render/pulses.js';
import { WaveField, waterKick } from './waves.js'; // (3.0n) the water answers whoever touches it
import {PartMap} from './partMap.js';
import { Angler } from './angler.js'; // 2.1o: the man with the lantern (see CFG.ANGLER)
import { Stray } from './stray.js'; // 2.1v: the girl who takes the voice (see CFG.STRAY)
import { buildStrayBody, poseStrayLunge } from './strayBody.js'; // 3.0t: her muzzle, for the death close-up
import { echoOf, mistScale, speedScale } from './water.js'; // 3.0b: what water does to a sound
import { inert } from '../core/inert.js'; // 3.0: a system the current map does not have
import { syncPumps } from '../world/bog.js'; // 3.0c: a running pump drains its sector
import { Drowned } from './drowned.js'; // 3.0d: the one in the water
import { Gnats } from './gnat.js'; // 3.0e: the swarm that eats your echo
import { Magpies } from './magpies.js'; // 3.1c: the birds that tell
import { Winch } from './winch.js'; // 3.0f: the way out of the bog
import { Rain } from '../render/rain.js'; // 3.0i: the bog's own weather — a fine drizzle, nothing more
import { Tentacles, TENT } from '../render/tentacles.js'; // 4.0: the arms on the horizon

const RED = [1.0, 0.13, 0.08];
const CUT_FADE = 13.9; // s into the fly-by when the screen starts going dark
const SONAR = [0.84, 0.92, 1.0]; // cold, colourless light
const STONE = [0.85, 0.95, 1.0];
const HOWL = [1.0, 0.36, 0.1];
const LAMPC = [1.0, 0.74, 0.42];
const MORNING_LIGHT = 0.95;
const FADE_IN = 1.4; // s: up out of the film's black into the first night
const DAWN_SECONDS = 11; // the last night lets go of the sky slowly
const NO_LOOK = { dx: 0, dy: 0 };
const SRC_SELF = new Set(['voice', 'ping', 'step', 'bump', 'breath', 'repair', 'door', 'flare', 'glow', 'part', 'engine', 'torch', 'crowbar', 'ladder', 'camera']);
const _v = new THREE.Vector3();
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class Game {
  constructor(deps) {
    Object.assign(this, deps); // scene, camera, world, pulses, ghosts, eyes, particles, audio, mic, input, hud, radar, post
    this.hl = null; // the shift's highlight director (src/game/highlights.js), attached by main.js
    this.map = this.world.mapId || 'forest'; // which участок this shift is on (3.0: 'forest' | 'bog')
    this.player = new Player(this.world);
    this.dread = new Dread(this, this.eyes);
    this.shards = new Shards(this.scene);
    this.stones = new Stones();
    this.shade = new ShadeRig();
    this.objectives = new Objectives(this);
    this.doors = new Doors(this);
    this.flares = new Flares(this);
    this.tentacles = new Tentacles(this.scene); // (4.0) far out past the edge, some nights
    this.tentAt = -1;
    this.tentShake = [];
    this.glows = new GlowSticks(this);
    this.medhut = new MedHut(this); // (after the glow sticks: its lantern is one of their small lights)
    this.rescue = new Rescue(this);
    this.angler = new Angler(this); // the man with the lantern, from the third night (see CFG.ANGLER)
    this.stray = new Stray(this); // the fourth night's girl: walk past her, never run (see CFG.STRAY)
    this.drowned = new Drowned(this); // 3.0d: the bog's own — it waits in the water (see game/drowned.js)
    this.gnats = new Gnats(this); // 3.0e: the swarm that eats your echo (see game/gnat.js)
    this.magpies = new Magpies(this); // 3.1c: flocks in the dead trees that go up rattling (see game/magpies.js)
    this.winch = new Winch(this); // 3.0f: the УАЗ in the bog, the cable and the drum (see game/winch.js)
    // (3.0i) the bog drizzles. It is scenery, not mechanics: no sound, no effect on the echo, no doused flares
    this.rain = this.map === 'bog' ? new Rain(this.scene) : null;
    // the forestry yard, the УАЗ and its four parts, the way out — the forest's, not the bog's
    // (3.0k) the stand-ins need the *fields*, not only the methods: the seat index is what every "can you use
    // your hands" test asks about (a missing one made the wristwatch refuse to come up on the bog — TAB was
    // dead, and the pack's own checks read it too), and the torch's charge is read as a number.
    this.escape = this.map === 'forest' ? new Escape(this) : inert(Escape, this, { load: () => null, seatOf: () => -1, mySeat: -1, seats: [], count: 0 });
    // (3.0q) the shelter under the peat works' camp: the cap, the corridor, the breaker at the far end, the crack
    // — and the works' gate on the track out, which is the same circuit. The forest has none of it: there is no
    // world.bunker out there, and the class says so itself (every call a no-op, every field false)
    this.bunker = new Bunker(this);
    this.cabinets = new Cabinets(this); // cupboards in the buildings (and the шкафандр)
    this.torch = this.map === 'forest' ? new Torches(this) : inert(Torches, this, { hasLight: false, has: false, on: false, charge: 0, items: [], spare: 0 }); // flashlights (3.0r: `items`/`spare` too — a guest's torch claim used to throw on the host)
    this.tools = new ForestTools(this);
    // (4.0) the camera: one lies out in the forest (the bog has none — its spots are the forest's landmarks)
    this.camItem = this.map === 'forest' ? new PhotoCamera(this) : inert(PhotoCamera, this, { has: false, shots: 0, items: [], film: [], bursts: [], label: '' });
    this.expedition = this.map === 'forest' ? new Expedition(this) : inert(Expedition, this);
    this.selfBody = new SelfBody(this); // yours, when you look down
    this.beyond = new Beyond(document.getElementById('beyond')); // co-op: the dead talk among themselves
    this.hud.onNoteClose = () => this.objectives.closeNote();
    this.events = [];
    this.monsters = [];
    this.timeline = [];
    this.noiseGen = new Simplex2(99);
    this.state = 'idle';
    this.fx = this._fxDefaults();
    this.time = 0;
    this.score = 0;
    this.mult = 1;
    this.hearingScale = 1;
    this.speedScale = 1;
    // (3.0n) the rings travelling on the water: pure state, uploaded to the shader every frame
    this.waves = new WaveField();
    this.onEnd = null; // (result) => void
    // co-op
    this.role = 'solo'; // solo | host | client
    this.coop = null;
    this.sync = null;
    this.remotes = new Map(); // id -> RemotePlayer
    this.spectate = null; // { target } once you're dead and watching someone
    this.inputMuted = false; // co-op pause: the world goes on, you just stand there
    this.netT = 0; // the host's night clock (guests)
    this.scareRigs = {};
    this._ears = { x: 0, y: 0, z: 0 };
    this.roomRules = { hideNames: false };
    // (3.0h) the parts map hangs in the forestry yard and prints the forest's four hiding places: on the bog there
    // is no yard and no UAZ to lay out. Inert, so the bag never offers an item that does not exist here
    this.partMap = this.map === 'forest' ? new PartMap(this) : inert(PartMap, this, { has: false, owner: null, locations: [], source: null, distance: () => 1 });
    this.inventory = new Backpack(this);
    this.fieldView = new FieldView(this);
    this.bag3d = new Bag3D(this); // the round pack (a desktop's view of the same four pockets)
    this.motos = new MotoPark(this); // the training ground's bikes (idle outside it)
    this.train = null; // the Training instance, while the shift is a training one
    this.voiceMimic = new VoiceMimic(this);
    this.fire = new Campfire(this); // the camp's fire: lit for the last evening, out for the night
    this.opening = new IntroCutscene(this); // the opening film: 2.1j over the fire, 3.0l on the проезд (this.intro is the monster reveal)
    this.fadeIn = 0; // s of fade-in after the cut scene hands over to the night
  }

  // ---------------- co-op: who is where ----------------
  get auth() {
    return this.role !== 'client'; // this machine decides what the monsters do
  }
  get online() {
    return this.role !== 'solo';
  }

  livePlayers() {
    const a = [];
    if (this.player.alive) a.push(this.player);
    for (const r of this.remotes.values()) if (r.alive) a.push(r);
    return a;
  }
  isPlayer(p) {
    return p === this.player || (!!p && this.remotes.get(p.id) === p);
  }
  playerById(id) {
    if (id === this.player.id) return this.player;
    return this.remotes.get(id) || null;
  }
  nameOf(player) {
    const p = typeof player === 'string' ? this.playerById(player) : player;
    return this.roomRules.hideNames ? t('anonymousPlayer').replace('{n}', (p?.slot || 0) + 1) : p?.name || '???';
  }
  localAlive() {
    return this.player.alive;
  }
  monsterById(id) {
    for (const m of this.monsters) if (m.id === id) return m;
    return null;
  }
  // where "you" hear and see from: yourself, or the friend you're watching after you died
  ears() {
    return this._ears;
  }
  _updateEars() {
    const e = this._ears;
    const watched = this.spectate && this.spectate.target;
    const src = watched || this.player;
    e.x = src.x;
    e.y = src.y + (src.eyeCur || 1.6);
    e.z = src.z;
  }
  distToEars(x, z) {
    return Math.hypot(this._ears.x - x, this._ears.z - z);
  }

  // join a co-op night: players = [{ id, name, slot }] from the host's start message
  setupOnline(coop, players) {
    this.coop = coop;
    this.roomRules = { hideNames: !!coop.rules?.hideNames };
    this.role = coop.isHost ? 'host' : 'client';
    this.sync = new NetSync(this, coop);
    this.player.id = coop.selfId;
    this._dropRemotes();
    for (const p of players) {
      if (p.id === coop.selfId) continue;
      const r = new RemotePlayer(this, p);
      this.remotes.set(p.id, r);
      this.audio.voiceSpatial(p.id, true);
    }
    this.teamSize = players.length;
  }

  // teammates gone from this machine (their bodies too)
  _dropRemotes() {
    for (const r of this.remotes.values()) r.dispose();
    this.remotes.clear();
  }

  setupSolo() {
    this._dropRemotes();
    this.role = 'solo';
    this.coop = null;
    this.sync = null;
    this.player.id = 'me';
    this.teamSize = 1;
  }

  // leaving a co-op night (game over / back to the menu): voices go back to the lobby
  teardownOnline() {
    for (const id of this.audio.voices.keys()) {
      this.audio.voiceSpatial(id, false);
      this.audio.voiceSet(id, 0, 0, 0, 1);
    }
    for (const r of this.remotes.values()) {
      r.rig.root.visible = false;
      this.audio.voiceSpatial(r.id, false);
      this.audio.voiceSet(r.id, 0, 0, 0, 1);
    }
    this.glows.view.visible = this.glows.viewHalo.visible = false;
  }

  removeRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    this.rescue.left(r);
    this.glows.dropFor(r.id, r.x, r.z);
    this.escape.dropFor(r.id, r.x, r.z);
    this.tools.dropFor(r.id, r.x, r.z);
    this.partMap?.dropFor(r.id);
    this.voiceMimic.forget(id);
    this.inventory.remoteSlots.delete(id);
    this.remotes.delete(id);
    r.dispose();
    this.escape.left(id);
    this.cabinets.left(id);
    if (this.state !== 'over') this.hud.popup(t('mateLeft').replace('{name}', this.nameOf(r)), 'dim');
    if (this.spectate && this.spectate.target === r) this.nextSpectate();
    if (this.auth) this.checkTeam();
  }

  _fxDefaults() {
    return { trauma: 0, glitch: 0, psych: 0, red: 0, white: 0, shockT: 9, shockAmp: 0, fovKick: 0, danger: 0, slowT: 0, timeScale: 1, fade: 1, aberr: 0.12 };
  }

  // ---------------- lifecycle ----------------
  reset(opts = {}) {
    this.training = !!opts.training; // the departure film landed you at the training ground
    this.rng = new RNG(opts.seed != null ? opts.seed >>> 0 : (Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.baseSeed = opts.seed != null ? opts.seed >>> 0 : 0; // the flare gun's nightly body is chosen from it, alike on every machine
    this.time = 0;
    this.day = 1; // every dawn but the last one is just a breather
    this.world.decay?.setDay(1); // (4.0) a new shift finds the forest as it was
    this.tentacles?.stop();
    this.tentAt = -1;
    this.daysTotal = CFG.SHIFT.OPTIONS.includes(opts.days) ? opts.days : CFG.SHIFT.DAYS; // (2.1s: the host picks 2, 4 or 6 nights)
    this.seizedByWatcher = false;
    this.score = 0;
    this.mult = 1;
    this.stats = { shards: 0, close: 0, escapes: 0, loudest: 0, hunts: 0, gens: 0, bodies: 0, thrown: 0, flares: 0, glows: 0, revives: 0, syringes: 0, parts: 0, seen: {} }; // seen: creatures that showed themselves (the atlas); syringes: friends raised with the needle
    this.state = this.training ? 'training' : 'morning'; // the schoolyard has no dusk to wait out
    this.finale = false; // (3.1m) the forest's last morning
    this.grace = true;
    this.fx = this._fxDefaults();
    if (this.audio) this.audio.psychosis(0); // never carry the last death's ringing into a new shift
    this.timeline = [];
    this.player.reset(opts.slot || 0);
    this.player.alive = true;
    this.selfBody.dress(myFit(), PLAYER_HEX[(opts.slot || 0) % 4]);
    this.spectate = null;
    this.localDeath = false;
    this.inputMuted = false;
    this.teamOverAt = 0;
    this.netT = 0;
    this.rescue.reset();
    this.rescue.resetPlayer(this.player);
    for (const r of this.remotes.values()) this.rescue.resetPlayer(r);
    this.angler.reset(); // the rope, the hunt, the clock — a new night owes him nothing
    this.stray.reset(); // she is not out there until the night puts her there (2.1v)
    this.drowned.reset(); // ...and neither is the one in the water (3.0d)
    this.gnats.reset(); // ...nor the midges (3.0e)
    this.magpies.reset(); // ...nor the birds (3.1c)
    this.winch.reset(); // ...and the car is back in the water where it went down (3.0f)
    this.echoMul = 1; // how much longer an echo takes to come back (the Гнус: 2)
    this.echoMulT = 0;
    this.strayWorn = false;
    this.wornLine = 0;
    this.micDeadByStray = false;
    this.audio.prefetchAnglerFound?.(); // his entrance sting, fetched long before the third night
    this.glows.reset();
    this.fire.reset();
    this.pulses.clear();
    this.waves.clear(); // (3.0n) no ring survives into the next night
    this.ghosts.clear();
    this.particles.clear();
    this.stones.clear();
    this.flares.clear();
    this.doors.reset();
    this.radar.clear();
    for (const m of this.monsters) m.dispose();
    this.monsters = [];
    this.shards.reset(this.world, this.rng);
    this.objectives.reset(this.rng);
    this.escape.reset(new RNG((this.rng.next() * 4294967296) >>> 0)); // (its own stream: the same on every machine)
    this.bunker.reset(); // (3.0q) the shelter: the cap locked, the lamps burning, nothing out of the crack
    this.cabinets.reset(new RNG((this.rng.next() * 4294967296) >>> 0));
    const torchSeed = (this.rng.next() * 4294967296) >>> 0;
    this.torch.reset(new RNG(torchSeed), opts.online || this.online);
    this.camItem.reset(new RNG((torchSeed ^ 0x63616d72) >>> 0), opts.online || this.online); // (4.0: from the torch's seed — the night's own draws stay as they were)
    this.tools.reset();
    this.expedition.reset();
    this.setFlares(0, false);
    this.partMap.reset();
    this.inventory.reset();
    this.fieldView.reset();
    this.voiceMimic.reset();
    this.roomRules = { hideNames: this.online ? !!this.coop.rules?.hideNames : !!settings.lobbyHideNames };
    this.objectives.setMorning(true);
    this.charge = { active: false, t: 0 };
    this.pingCD = 0;
    this.pingCDMax = CFG.ECHO.cd;
    this.echoReadyCued = true;
    this.stepNoise = 0;
    this.killer = null;
    this.deathT = 0;
    this.dawnT = 0;
    this.morningT = 0;
    this.duskT = 0;
    this.duskHit = false;
    this.morningAudio = false;
    this.events = [];
    this._resetNight();
    if (this.map === 'bog') syncPumps(this.world, this.objectives.gens); // no pump runs yet: the water is where it was
    shared.uDawn.value = MORNING_LIGHT;
    shared.uMorning.value = 1;
    this._morningSun(0); // (4.0: the first morning's sun comes up low too — updateMorning lifts it)
    shared.uFear.value = 0;
    this.dread.reset();
    this.hud.setIntro(null);
    this.hud.setHint(null);
    this.hud.setUse(null);
    this.hud.showNote(null);
    this.hud.setSkip(true);
    if (this.training) {
      this.train = this.train || new Training(this);
      this.train.begin();
      this.motos.reset();
      this.hud.setIntro(t('trainingBig'), t('trainingSmall'));
      this.hud.setSkip(false);
    } else if (this.train) {
      this.train.end();
      this.train = null;
      this.motos.dispose();
    }
    // The shift opens in the evening, on the road: a УАЗ comes up the track and stops at the flooded проезд,
    // four of them get out and start the camp pump, and the first night begins when the picture goes dark (see
    // intro.js, 3.0l). A debug jump into the night (main.js) calls startNight itself, which puts the film away.
    this.fadeIn = 0;
    if (!this.training) this.opening.begin();
  }

  // the opening cut scene is playing: the world is posed for it, the player is not on their feet yet
  // (not updateIntro — that name belongs to the monsters' first reveal)
  updateOpening(dt, raw) {
    this.time += dt;
    this.netFrame(dt); // a guest still answers the host, and everyone sees where everyone is
    this.opening.update(dt, raw.events);
    this.glows.update(dt); // the fire is one of the small lights (see GlowSticks.lightSources)
    this._commonFx(dt);
    if (this.opening.done) this.startNight();
  }

  // everything that measures the night starts from zero when the light dies
  _resetNight() {
    this.lastHeardAlert = -10;
    this.lastScreamAlert = -10;
    this.screamFlag = false;
    this.nextScare = 80 + this.rng.float(0, 35);
    this.scareCount = 0;
    this.firstPingT = -1;
    this.lastPulseT = -9;
    this.intro = { t: 0, phase: 0, autoSnap: false, revealDone: false, itHearsT: -1 };
    this.tut = { step: 0, t: 0, wait: 2.2, done: settings.tutorialDone };
    this.awake = false; // the first SPAWN_DELAY seconds of the night nothing is out there yet
    this.calmHintOff = 0;
    this.lastMultStep = 1;
    this.endgame = false;
    this.wakeT = 0;
    this.hinted = {};
  }

  // ---------------- morning → dusk → night ----------------
  updateMorning(dt, raw) {
    const p = this.player;
    this.morningT += dt;
    this.time += dt;
    this._morningSun(this.morningT / CFG.SHIFT.MORNING);
    if (!this.morningAudio && this.audio.ready && this.audio.ambOn) {
      this.morningAudio = true;
      this.audio.setMorning(true);
    }
    this.netFrame(dt);
    for (const e of this.inputMuted ? [] : raw.events) {
      if (e === 'confirm' || e === 'skip') {
        if (this.auth) {
          this.startDusk();
          return;
        }
        this.coop.toHost('sk', 1); // a guest asks; the host's word starts the dusk for everyone
      } else if (e === 'carry') this.carryKey(); // R: set the part down (2.1q: hauling is morning work too)
      // (3.1p) the whole kit by day: a part thrown down, the needle (2.1r), a stone, the torch, the map, a battery,
      // the tape's record button. (A glow stick and the flare gun say they are for the dark; see glows.use, fireFlare)
      else if (e === 'primary') this.inventory.primary();
      else if (e === 'secondary') this.inventory.secondary();
    }
    if (this.state !== 'morning') return;
    // E puts a page away (a body can be searched by day now)
    if (this.objectives.note && raw.events.includes('useDown')) {
      this.objectives.closeNote();
      this.events = raw.events.filter((e) => e !== 'useDown');
    }
    // the morning's own timeline: the hints a find schedules (the night clears it when it starts)
    for (let i = this.timeline.length - 1; i >= 0; i--) {
      if (this.time >= this.timeline[i].at) {
        const ev = this.timeline[i];
        this.timeline.splice(i, 1);
        ev.fn();
      }
    }
    // (2.1r: down at dawn is a state of its own now — the body lies where it fell until hands move it;
    // Player.update has no alive-guard and would happily walk the corpse around by keyboard)
    const pev = !p.alive ? { step: null, bump: null, breath: null }
      : this.angler.myCap() ? (this.angler.captiveFrame(dt, this.inputMuted ? NO_LOOK : raw.look), { step: null, bump: null, breath: null })
      : p.update(dt, this.input, this.inputMuted || this.inventory.active ? NO_LOOK : raw.look, this.inputMuted || this.inventory.active);
    this.angler.update(dt);
    if (pev.step) this.audio.footstep(pev.step.intensity * 0.8);
    if (pev.bump) {
      this.audio.bump();
      this.addTrauma(0.12);
    }
    this._jumpEvents(pev, false);
    // (2.1k: there used to be a 26 m leash round the camp here — an invisible wall that pushed you back
    // with a hint. The morning is short and the forest is the point: walk out if you want to.)
    const hud = this.hud;
    if (this.morningT > 0.8 && this.morningT < 7.5) hud.setIntro(this.day > 1 ? t('morningBigN').replace('{n}', this.day).replace('{d}', this.daysTotal) : t('morningBig'), t('morningSmall'));
    else hud.setIntro(null);
    let hint = null;
    if (this.morningT > 8 && this.morningT < 17) hint = this.input.touch ? t('morningHintTouch') : t('morningHint');
    else if (this.morningT > 19 && this.morningT < 26) hint = t(this.map === 'bog' ? 'morningGenBog' : 'morningGen');
    hud.setHint(hint);
    this.objectives.update(dt, false);
    if (this.map === 'bog') syncPumps(this.world, this.objectives.gens); // the bog's water (3.0c)
    this.doors.update(dt);
    this.stones.update(dt, this); // (3.1p: a stone thrown by day has to land)
    this.flares.update(dt);
    this.rescue.update(dt); // the bleed clock and the carrying shoulder do not stop for the sun (2.1r)
    this.escape.update(dt); // the parts live and roll in daylight too (2.1q)
    this.cabinets.update(dt);
    this.medhut.update(dt);
    this.torch.update(dt);
    this.camItem?.update(dt);
    this.glows.update(dt);
    this.pulses.update(this.time);
    this._waterFrame();
    this.audio.morningTick();
    this.fx.danger = 0;
    this._commonFx(dt);
    if (this.morningT >= CFG.SHIFT.MORNING + (this.auth ? 0 : 6)) this.startDusk(); // a guest only goes alone if the host never says
  }

  // (3.0n) retire the spent rings and hand the live ones to the shader: called with the pulses, so the water
  // and the echo always agree about when a step happened
  _waterFrame() {
    // (the stub games some tests build have no field: make one rather than fail a frame)
    if (!this.waves) this.waves = new WaveField();
    this.waves.update(this.time);
    this.waves.write(shared);
  }

  // ---------------- the training ground ----------------
  // The forest in daylight with nothing to lose: walk about, take the whole kit off the rack, put stones
  // and flares into the targets, and ride one of the four enduro bikes. There is no night clock, no
  // monsters and no score here; the pause menu's «ЗАВЕРШИТЬ ПОЛИГОН» is the way out (see main.js).
  updateTraining(dt, raw) {
    const p = this.player;
    const input = this.input;
    this.time += dt;
    if (this.online) {
      this.netFrame(dt);
      this.updateRemotes(dt);
    }
    for (const e of this.inputMuted ? [] : raw.events) {
      if (e === 'pingDown') this.pingPress();
      else if (e === 'primary') this.inventory.primary();
      else if (e === 'secondary') this.inventory.secondary();
    }
    this._echoClock(dt);

    // on foot: the usual walker. In the saddle the bike is the body (MotoPark.update writes it back).
    const riding = this.motos.rider >= 0;
    if (!riding) {
      const pev = p.update(dt, input, this.inputMuted || this.inventory.active ? NO_LOOK : raw.look, this.inputMuted || this.inventory.active);
      if (pev.step) this.audio.footstep(pev.step.intensity * 0.8);
      if (pev.bump) { this.audio.bump(); this.addTrauma(0.14); }
      this._jumpEvents(pev, false);
    }
    this.motos.update(dt, input);
    if (this.motos.rider >= 0) {
      // (3.1r) your eyes ride the machine: up and back in a wheelie, down on the nose under the front brake, over
      // in the lean — and your weight back with Shift
      const b = this.motos.bikes[this.motos.rider];
      if (b) {
        p.eyeCur = riderEye(b, input.sprint ? MOTO.back : 0) - (p.y || 0);
        p.roll = b.roll * 0.75;
        p.pitch = damp(p.pitch, b.pitch * 0.8 - 0.07, 14, dt);
      }
    }

    // the same lamps, doors, cupboards and kit as a night — just without the night
    this.objectives.update(dt, false); // lamps + the camp generator's hum (no night logic when night=false)
    if (this.map === 'bog') syncPumps(this.world, this.objectives.gens);
    this.objectives._interact(dt); // E: the rack, a bike, a door, a cupboard
    this.train?.update(dt); // the targets
    this.doors.update(dt);
    this.cabinets.update(dt);
    this.medhut.update(dt);
    this.torch.update(dt);
    this.camItem?.update(dt);
    this.glows.update(dt);
    this.stones.update(dt, this);
    this.flares.update(dt);
    this.rescue.update(dt);
    this.pulses.update(this.time);
    this._waterFrame();

    // HUD: the intro speaks once; then only what your hands are near
    if (this.time > 9 && this.time - dt <= 9) this.hud.setIntro(null);

    this.fx.danger = 0;
    this._commonFx(dt);
  }

  // the morning of the next day: the camp again, the shift goes on (the first morning starts from reset)
  startMorning(day) {
    if (day <= this.day && this.state !== 'dawn') return;
    this.day = day;
    this.state = 'morning';
    this.world.decay?.setDay(day); // (4.0) the forest the night left: more dead trees, stick men, red paint
    this.tentacles?.stop();
    this.tentAt = -1;
    this.time = 0; // the night's clocks start clean (the fallen stay down — their own clock runs on: see Rescue.bleedLeft)
    this.morningT = 0;
    this.duskT = 0;
    this.duskHit = false;
    this.morningAudio = false; // the birds come back with the next frame
    this.hud.setIntro(null);
    this.hud.setHint(null);
    this.hud.setUse(null);
    this.hud.setSkip(true);
    this.timeline = [];
    this.dread.reset();
    this.audio.setAmbience(0.25, 0);
    shared.uDawn.value = MORNING_LIGHT;
    shared.uMorning.value = 1;
    this._morningSun(0);
    this.objectives.setMorning(true);
  }

  // (4.0) the arms on the horizon (render/tentacles.js). At nightfall the host (or a solo game) decides whether
  // tonight something far off comes up, and when — likelier as the shift goes on; the room gets the seed at that
  // moment ('tn') and everyone sees the same arms rise and fall. Nothing in the forest is touched: it is too far
  _scheduleTentacles() {
    this.tentacles?.stop();
    this.tentAt = -1;
    this.tentShake = [];
    if (!this.auth) return;
    const T = CFG.TENTACLES;
    const base = this.online ? this.baseSeed : (Math.random() * 4294967295) >>> 0;
    const r = new RNG((base ^ Math.imul(this.day | 0, 0x9e3779b1) ^ 0x74656e74) >>> 0);
    const p = Math.min(T.maxChance, T.chance + T.perDay * (this.day - 1));
    const go = r.chance(p);
    const at = r.float(T.minT, T.maxT);
    this.tentSeed = ((r.next() * 4294967295) >>> 0) || 1;
    if (this.debugTentacles) this.tentAt = 4;
    else if (go) this.tentAt = at;
  }

  startTentacles(seed) {
    if (this.tentacles.active || !(this.state === 'play' || this.state === 'dying')) return false;
    this.tentacles.start(seed >>> 0);
    return true;
  }

  _tentFrame(dt) {
    if (this.auth && this.state === 'play' && this.tentAt > 0 && this.time >= this.tentAt) {
      this.tentAt = -1;
      if (this.startTentacles(this.tentSeed) && this.role === 'host') this.sync.ev('tn', this.tentSeed);
    }
    if (!this.tentacles.active) return;
    if (!(this.state === 'play' || this.state === 'dying' || this.state === 'escape')) { this.tentacles.stop(); return; }
    this.tentacles.update(dt, this.camera.position, this.time);
    const delay = TENT.far / 343; // (it is a long way off: you see it, then you hear it)
    for (const e of this.tentacles.take()) {
      if (e.type === 'rise') this.audio.tentacleRise(e.az, this.camera.position, delay);
      else {
        this.audio.tentacleCrash(e.az, this.camera.position, delay, 1);
        this.tentShake.push(this.time + delay);
      }
    }
    for (let i = this.tentShake.length - 1; i >= 0; i--) {
      if (this.time < this.tentShake[i]) continue;
      this.addTrauma(0.12); // the ground carries it
      this.tentShake.splice(i, 1);
    }
  }

  // (4.0) the morning sun climbs: it comes up low over the trees (long shadows, the fog lit from the side, shafts
  // between the trunks) and by the dusk it stands a little higher — on the same bearing as it always has
  _morningSun(k) {
    const el = 0.17 + 0.23 * smoothstep(0, 1, Math.min(1, Math.max(0, k))); // ~10° → ~23°
    const az = Math.atan2(0.42, -0.66);
    shared.uSun.value.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  }

  startDusk() {
    if (this.state !== 'morning') return;
    this.state = 'dusk';
    this.duskT = 0;
    this.duskHit = false;
    this.duskLight = shared.uDawn.value;
    this.hud.setIntro(null);
    this.hud.setHint(null);
    this.hud.setUse(null);
    this.hud.setSkip(false);
    this.audio.dusk();
    this.objectives.campFail();
    if (this.role === 'host') this.sync.ev('du');
  }

  updateDusk(dt, raw) {
    this.duskT += dt;
    this.time += dt;
    const k = this.duskT;
    // the light drains in under two seconds, stuttering like a dying bulb — then it's just gone
    let L = this.duskLight * (1 - smoothstep(0.15, 1.75, k));
    if (k > 0.45 && k < 1.75 && Math.sin(k * 61) * Math.sin(k * 23) > 0.2) L *= 0.2;
    shared.uDawn.value = Math.max(0, L);
    this.netFrame(dt);
    if (this.angler.myCap()) { this.angler.captiveFrame(dt, this.inputMuted ? NO_LOOK : raw.look); this.angler.update(dt); }
    else this.player.update(dt, this.input, this.inputMuted ? NO_LOOK : raw.look, true); // you stop dead and stare
    if (k >= 1.8 && !this.duskHit) {
      this.duskHit = true;
      shared.uDawn.value = 0;
      this.addTrauma(0.55);
      this.fx.glitch = 0.7;
      this.fx.shockT = 0;
      this.fx.shockAmp = 0.7;
    }
    this.objectives.update(dt, false);
    if (this.map === 'bog') syncPumps(this.world, this.objectives.gens); // a pump started or stopped (3.0c)
    this.doors.update(dt);
    this.rescue.update(dt);
    this.pulses.update(this.time);
    this._waterFrame();
    this._commonFx(dt);
    if (k >= CFG.DUSK_SECONDS) this.startNight();
  }

  startNight() {
    // (the opening film is over by now, or a debug jump / a skip is putting it away)
    // (finish() marks itself 'done' before calling this, so the film's own hand-over is fadeIn > 0)
    const fromFilm = (this.opening && this.opening.state === 'run') || this.fadeIn > 0;
    if (fromFilm) this.opening.cancel();
    // (4.0) a film put away before its first frame (a debug jump, a host who starts the night at once) left the
    // picture in the black the film opens from: nothing restored it. Come up out of it the way the film's own end does
    if (fromFilm && this.fadeIn <= 0 && this.fx.fade < 1) this.fadeIn = FADE_IN;
    this.state = 'play';
    this.finale = false;
    this.time = 0;
    this.world.decay?.setDay(this.day); // (4.0: a debug jump into a later night has its forest too)
    this._scheduleTentacles();
    shared.uDawn.value = 0;
    shared.uMorning.value = 0;
    shared.uSun.value.set(0.5, 0.35, -0.8).normalize(); // if you ever see the sky again, it'll be a sunrise
    this.pulses.clear();
    this.ghosts.clear();
    this.timeline = [];
    this.audio.setMorning(false);
    this.objectives.setMorning(false);
    this.objectives.startNight(this.day, this.baseSeed);
    if (this.map === 'bog' && this.drowned) this.drowned.spawnNight(); // 3.0d: it is already in the water
    if (this.map === 'bog' && this.gnats) this.gnats.startNight();
    if (this.map === 'forest' && this.magpies) this.magpies.startNight(this.day, this.baseSeed); // 3.1c
    this._resetNight();
    this.dread.reset();
    this.hud.setSkip(false);
    this.hud.setIntro(null);
    this.hud.setHint(null);
    // the film leaves you where you stood watching the fire — so look at it: the night opens on the camp,
    // the dying coals and the tent, not on the black away from it (2.1k: you used to wake facing the forest,
    // in the dark, with nothing to go by)
    if (fromFilm) {
      const f = this.fire;
      const p = this.player;
      const a = Math.atan2(-(f.x - p.x), -(f.z - p.z));
      p.yaw = a + 0.18;
      p.pitch = -0.12;
    }
    this.hud.flashAlert(t('nightTag').replace('{n}', this.day).replace('{d}', this.daysTotal), 'dim', 2.4);
    // nothing is out there yet: the forest sleeps for SPAWN_DELAY seconds (see updateDirector → wake)
    for (const m of this.monsters) m.dispose();
    this.monsters = [];
  }

  // at a generator your body kneels into the work (SelfBody) and your eyes come down with it.
  // workK: 0 free on your feet, 1 leaning into the bolts
  _workPose(dt) {
    const working = !!(this.objectives.working && this.player.alive && (this.state === 'play' || this.state === 'morning'));
    this.workK = damp(this.workK || 0, working ? 1 : 0, working ? 5 : 4, dt);
    if (this.workK > 0.01) {
      const p = this.player;
      const eye = working ? Math.min(p.eyeCur || 1.6, 1.62) : p.eyeCur;
      p.eyeCur = lerp(eye, 1.1, this.workK); // down toward the bolts, up again when you step back
    }
  }

  // where tonight falls across the whole shift, in the four-night tables' terms (2.1s)
  diffDay() { return diffDay(this.day, this.daysTotal); }

  // how much of the shift is still ahead (the speed bonus for driving out early is paid by the second)
  shiftLeft() {
    const S = CFG.SHIFT;
    const dayLen = S.NIGHT + S.MORNING + CFG.DUSK_SECONDS;
    const left = (this.daysTotal - this.day) * dayLen;
    if (this.finale) return Math.max(0, S.FINALE - this.time); // (3.1m) the last morning: what is left of it
    if (this.state === 'play') return Math.max(0, left + Math.max(0, S.NIGHT - this.time));
    if (this.state === 'morning') return Math.max(0, left + Math.max(0, S.NIGHT + S.MORNING - this.morningT));
    if (this.state === 'dusk') return Math.max(0, left + S.NIGHT);
    return Math.max(0, left + (this.state === 'dawn' ? 0 : S.NIGHT)); // dawn pays out in full: the day is done
  }

  // seconds of quiet left at the start of the night (0 once they're up)
  calmLeft() {
    return this.state === 'play' && !this.awake ? Math.max(0, CFG.SPAWN_DELAY - this.time) : 0;
  }

  // the calm is over: the first two of them get up, far off, and the forest lets you know
  wake() {
    this.awake = true;
    let m = null;
    if (this.map === 'bog') {
      // (3.0k) the bog wakes its own. The forest's listeners and crawlers were never here: what comes up out
      // of the water is the Дrowned, and the first cloud of the Гнус takes to the air at the same moment.
      m = this.drowned?.spawnNight?.() || null;
      this.gnats?.wakeNow?.();
    } else {
      const a = this.spawnMonster('listener', 70, 95);
      const b = this.spawnMonster('listener', 75, 100);
      m = a || b;
    }
    if (this.role === 'host') {
      if (m) this.sync.ev('aw', Math.round(m.x), Math.round(m.z));
      else this.sync.ev('aw');
    }
    this.fxAwake(m ? m.x : null, m ? m.z : null);
    this.dirT = 1.2;
  }

  fxAwake(x = null, z = null) {
    this.awake = true;
    if (this.state !== 'play') return;
    const p = this.ears();
    let wx = x, wz = z;
    if (wx === null || wz === null) {
      const a = this.rng.float(0, Math.PI * 2);
      wx = p.x + Math.cos(a) * 85;
      wz = p.z + Math.sin(a) * 85;
    }
    if (this.map === 'bog') {
      // (3.0k) a bog has no howl in it: the sound of the night starting is water moving where nothing
      // should be moving. Same warning, the map's own voice.
      this.audio.splash(0.7);
      this.audio.sting(0.3);
      if (this.player.alive || this.spectate) {
        this.hud.flashAlert(t('aDrowned'), 'warn', 2.8);
        this.hud.peek(3.5);
        this.addTrauma(0.12);
      }
      this.radar.blip(wx, wz, 'unknown');
      return;
    }
    this.audio.forestWake(wx, this.world.terrain.height(wx, wz) + 2.5, wz);
    if (this.player.alive || this.spectate) {
      this.hud.flashAlert(t('aTheyWake'), 'warn', 2.8);
      this.hud.peek(3.5);
      this.addTrauma(0.12);
    }
    this.radar.blip(wx, wz, 'unknown');
  }

  // how brightly the sound waves light (x, y, z) right now
  lightAt(x, y, z) {
    let L = 0;
    for (const s of this.pulses.slots) {
      if (!s.active) continue;
      L += Pulses.lightAt(s, Math.hypot(x - s.x, y - s.y, z - s.z), this.time);
    }
    return L;
  }

  // what the Howler's wave counts as "moving" (anyone: you, or a teammate by their last report)
  movingForHowler(pl = this.player) {
    if (pl === this.player) return pl.speed > 0.7 || !pl.grounded; // (4.0: a jump is movement too)
    return pl.speed > 0.7 || !!pl.charging || !!pl.air;
  }

  // ---------------- helpers ----------------
  addTrauma(v) {
    const k = settings.scares === 'reduced' ? 0.6 : 1;
    this.fx.trauma = Math.min(1, this.fx.trauma + v * k);
  }

  // somewhere around a living player (any of them), not too close to anyone
  _around() {
    const live = this.livePlayers();
    return live.length ? live[Math.floor(this.rng.next() * live.length)] : this.player;
  }
  _clearOfPlayers(x, z, dmin) {
    for (const q of this.livePlayers()) if (Math.hypot(q.x - x, q.z - z) < dmin) return false;
    return true;
  }

  spawnMonster(type, dmin, dmax) {
    // (3.0k) a belt on the braces: every forest creature goes through here, and none of them belongs on the
    // bog. (The bog's own — the Дrowned, the Гнус — are not monsters of this kind and do not come through here.)
    if (this.map === 'bog') return null;
    const p = this._around();
    const w = this.world.wall - 6;
    for (let k = 0; k < 40; k++) {
      const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(dmin, dmax);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w) continue;
      if (this.online && !this._clearOfPlayers(x, z, dmin * 0.75)) continue;
      if (!this.world.col.free(x, z, 1) || this.world.inYard(x, z, 1.5)) continue;
      const L = this.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      const m = createMonster(type, this);
      m.spawn(x, z);
      this.monsters.push(m);
      return m;
    }
    return null;
  }

  relocate(m) {
    const p = this._around();
    const w = this.world.wall - 6;
    for (let k = 0; k < 30; k++) {
      const a = this.rng.float(0, Math.PI * 2), d = this.rng.float(55, 85);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w || !this.world.col.free(x, z, 1) || this.world.inYard(x, z, 1.5)) continue;
      if (this.online && !this._clearOfPlayers(x, z, 40)) continue;
      const L = this.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      m.spawn(x, z);
      return;
    }
  }

  // a sound happened in the world (authoritative side: the monsters hear it). pid = who made it
  noise(x, z, loud, source, scream = false, pid = null) {
    if (loud <= 0 || this.state !== 'play' || !this.auth) return 0;
    if (this.map === 'bog') this.gnats.hear(x, z, loud, source); // 3.0e: the midges come to whatever is loudest
    if (this.map === 'forest') this.magpies.hear(x, z, loud, source, pid); // 3.1c: a loud noise by their tree sends them up
    let n = 0;
    for (const m of this.monsters) {
      const r = m.hear(x, z, loud, source, scream, pid);
      if (r) {
        n++;
        if (r === 'hunt' && scream) {
          m.huntCause = 'scream';
          m.huntCausePid = pid;
        }
      }
    }
    return n;
  }

  // a sound YOU made: heard here (solo / host) or sent to the host (guest)
  playerNoise(x, z, loud, source, scream = false) {
    if (loud <= 0 || this.state !== 'play' || !this.player.alive) return;
    if (this.auth) this.noise(x, z, loud, source, scream, this.player.id);
    else if (SRC_SELF.has(source)) this.sync.noise(x, z, loud, source, scream);
  }

  eyePos() {
    const p = this.player;
    return { x: p.x, y: p.y + p.eyeCur, z: p.z };
  }

  // ---------------- player sound ----------------
  // device (4.0): the echolocator's wave — its own radius, strength and slow fade, whatever its (small) loudness
  emitPlayerPulse(loud, fromMic, device = false) {
    const p = this.player;
    const e = this.eyePos();
    const E = CFG.ECHO;
    let R = device ? E.radius : fromMic ? CFG.voiceRevealRadius(loud) : CFG.revealRadius(loud);
    // the участок (3.0b): knee-deep water shortens and slows the wave, vapour swallows its return
    const echo = echoOf(this.world, e.x, e.z);
    R *= echo.scale * mistScale(this.world, e.x, e.z);
    const first = this.firstPingT < 0;
    if (first) {
      R = Math.max(R, 52);
      this.firstPingT = this.time;
      this.onFirstPing(this.player);
    }
    const strength = device ? E.strength : 0.8 + loud * 0.7;
    this.lastPulseT = this.time;
    if (this.sync) this.sync.ev('pu', +e.x.toFixed(2), +(e.y - 0.25).toFixed(2), +e.z.toFixed(2), +loud.toFixed(3), device ? 2 : fromMic ? 1 : 0);
    const s = this.pulses.emit(e.x, e.y - 0.25, e.z, this.time, { radius: R, strength, speed: echo.speed, decay: device ? E.decay : 0.38 + (1 - loud) * 0.22, color: SONAR, kind: 'player' });
    if (echo.scale < 1 || echo.speed !== CFG.PULSE.speed) {
      // a wave that dies in the water: the sound tells you before the picture does
      this.audio.sonarSweep(loud * 0.6, false);
    }
    // (4.0) the device's wave is clean and wide, but it is a device: no shout in the screen, a soft ring in the ears,
    // and every return ticks clearly (those clicks are for you alone — they are what "pings well" means)
    const vis = device ? 0.45 : loud;
    this.echoTicks(s, device ? 0.75 : loud);
    this.fx.shockT = 0;
    this.fx.shockAmp = 0.35 + vis * 0.75;
    this.addTrauma(device ? 0.03 : 0.06 + loud * 0.22);
    this.fx.fovKick = Math.max(this.fx.fovKick, device ? 1.2 : 1.5 + loud * 5);
    this.hud.pulseCross();
    this.audio.sonarSweep(device ? 0.4 : loud, !device && loud > 0.45);
    this.particles.burst(e.x, e.y - 0.4, e.z, 10 + Math.round(vis * 26), { color: [0.5, 0.6, 0.66], speed: 6 + vis * 12, life: 0.55, size: 0.06, gravity: 0, drag: 2.2, dir: { x: 0, y: 0, z: 0 }, cone: 1, spread: 0.5 });
    return s;
  }

  // echo returns: soft clicks from objects as the wave reaches them
  echoTicks(s, loud) {
    const col = this.world.col;
    const list = col.query(s.x, s.z, s.radius);
    const N = 20;
    const best = new Array(N).fill(null);
    const extra = [];
    for (let i = 0; i < list.length; i++) {
      const c = col.caps[list[i]];
      const cx = (c.ax + c.bx) * 0.5, cz = (c.az + c.bz) * 0.5;
      const dx = cx - s.x, dz = cz - s.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.2 || d > s.radius) continue;
      const sec = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * N) % N;
      if (!best[sec] || d < best[sec].d) best[sec] = { d, x: cx, z: cz, k: c.kind };
      else if (extra.length < 14 && Math.random() < 0.05) extra.push({ d, x: cx, z: cz, k: c.kind });
    }
    const kindMap = { [CAP.TREE]: 0, [CAP.ROCK]: 1, [CAP.WOOD]: 2, [CAP.METAL]: 3, [CAP.WATER]: 4, [CAP.EFFIGY]: 2, [CAP.FENCE]: 3 };
    for (const b of best.concat(extra)) {
      if (!b) continue;
      const gain = (0.22 + loud * 0.5) * Math.pow(1 - b.d / s.radius, 1.3);
      this.audio.tick(b.d / s.speed, this.audio.panOf(b.x, b.z), gain, 0.9 + Math.random() * 0.25, kindMap[b.k] ?? 0);
    }
  }

  // (4.0) SPACE: the echolocator. One press, one wave — or, while it is still empty, a flinch of the arc and a dull
  // click of the button (nothing to hear for anyone else)
  pingPress() {
    if (this.pingCD > 0) {
      this.hud.cooldownDeny();
      this.audio.echoDeny?.();
      return;
    }
    this._ping();
  }

  // (4.0) a jump: the push off is a breath and a rustle; the landing is a thud the ground passes on — the harder
  // you came down, the further (a sprint step's worth for an ordinary jump). night: monsters may hear it
  _jumpEvents(pev, night) {
    const p = this.player;
    if (pev.jump) {
      this.audio.jumpPush?.(!!pev.jump.wet);
      if (night) this.playerNoise(p.x, p.z, 0.06, 'step');
      this.stats.jumps = (this.stats.jumps || 0) + 1;
    }
    const L = pev.land;
    if (!L) return;
    const wet = speedScale(this.world, p.x, p.z) < 0.999;
    this.audio.land?.(L.k, wet);
    this.addTrauma(0.04 + L.k * 0.16);
    if (!night) return;
    const loud = Math.min(0.32, 0.1 + 0.032 * L.impact) * (p.crouching ? 0.5 : 1);
    this.pulses.emitStep(p.x, p.y + 0.2, p.z, this.time, { radius: 6 + L.k * 5, strength: 0.55 + L.k * 0.3, speed: 16, decay: 1.8, kind: 'step' });
    this.playerNoise(p.x, p.z, loud, 'step');
    this.stepNoise = Math.max(this.stepNoise, loud);
    if (wet) waterKick(this.waves, this.world, p.x, p.z, this.time, 'run', 1.1);
  }

  _ping() {
    const E = CFG.ECHO, p = this.player;
    this.pingCD = this.pingCDMax = E.cd;
    this.echoReadyCued = false;
    this.audio.echoPing?.();
    this.stats.echoes = (this.stats.echoes || 0) + 1;
    this.emitPlayerPulse(E.noise, false, true);
    this.playerNoise(p.x, p.z, E.noise, 'ping', false);
    this.radar.noiseR = Math.max(this.radar.noiseR, CFG.hearRadius(E.noise));
  }

  // the device refills (at half speed while the gnats are in your eyes — see game/gnat.js); a soft double tick
  // when it is ready again
  _echoClock(dt) {
    if (this.pingCD <= 0) return;
    this.pingCD = Math.max(0, this.pingCD - dt / (this.echoMul || 1));
    if (this.pingCD === 0 && !this.echoReadyCued) {
      this.echoReadyCued = true;
      this.hud.pingReady?.();
      if (this.player.alive) this.audio.echoReady?.();
    }
  }

  onScream() {
    this.hlNote('scream');
    if (this.time - this.lastScreamAlert > 3) {
      this.hud.flashAlert(t('aDontScream'), 'danger', 1.2);
      this.lastScreamAlert = this.time;
    }
    this.fx.red = Math.max(this.fx.red, 0.25);
    this.addTrauma(0.25);
  }

  throwStone() {
    const p = this.player;
    if (p.stones <= 0) {
      this.hud.popup(t('aNoStones'), 'dim');
      this.hud.flashStones();
      return;
    }
    p.stones--;
    this.stats.thrown++;
    const cp = Math.cos(p.pitch);
    const dx = -Math.sin(p.yaw) * cp, dz = -Math.cos(p.yaw) * cp, dy = Math.sin(p.pitch);
    const e = this.eyePos();
    this.stones.throw(e.x + dx * 0.4, e.y - 0.15, e.z + dz * 0.4, dx, dy, dz);
    if (this.sync) this.sync.ev('st', +(e.x + dx * 0.4).toFixed(2), +(e.y - 0.15).toFixed(2), +(e.z + dz * 0.4).toFixed(2), +dx.toFixed(3), +dy.toFixed(3), +dz.toFixed(3));
    this.audio.throwWhoosh();
    this.addTrauma(0.05);
    if (this.tut.step === 3) this.tut.t = 99;
  }

  onStoneImpact(h, owner = null) {
    const s = this.pulses.emit(h.x, h.y + 0.3, h.z, this.time, { radius: 17, strength: 1.0, decay: 0.55, color: STONE, kind: 'stone' });
    this.echoTicks(s, 0.35);
    this.audio.impact(h.x, h.y, h.z, h.water);
    if (h.water) waterKick(this.waves, this.world, h.x, h.z, this.time, 'stone'); // (3.0n) it pushes the surface too
    this.particles.burst(h.x, h.y + 0.15, h.z, h.water ? 26 : 18, {
      color: h.water ? [0.5, 0.8, 1.0] : [0.9, 0.97, 1.0], speed: h.water ? 3.5 : 4.5, up: h.water ? 3 : 1.5,
      life: h.water ? 0.9 : 0.6, size: 0.09, gravity: -9, drag: 1,
    });
    this.radar.blip(h.x, h.z, 'stone');
    this.noise(h.x, h.z, h.water ? 0.5 : 0.46, 'stone', false, owner ?? this.player.id); // every machine simulates every stone; only the host's monsters listen
  }

  // ---------------- hands ----------------
  // R: a part in your arms goes down; in the УАЗ, out of your seat; carrying a friend by the car, into the back
  carryKey() {
    if (this.expedition.onTower) return this.expedition.descend();
    const es = this.escape;
    if (es.held) return es.putDown();
    if (es.mySeat >= 0) return es.standUp();
    if (this.player.carrying && es.canLoad() && es.loadBody()) return;
    this.rescue.carryKey();
  }

  handsFull() {
    this.hud.popup(t('aHandsFull'), 'dim');
  }

  // sitting in the УАЗ: no walking, just looking about
  seatedLook(look) {
    const p = this.player;
    p.yaw -= look.dx;
    p.pitch = clamp(p.pitch - look.dy, -1.1, 1.1);
    p.crouching = false;
    p.sprinting = false;
    p.speed = 0;
    p.bobY = 0;
    return { step: null, bump: null, breath: false };
  }

  // ---------------- away in the УАЗ ----------------
  // (every machine at once: the host said who's in the car — see Escape.depart)
  startEscape(inCar) {
    if (this.state !== 'play') return;
    const shiftLeft = this.shiftLeft(); // counted while the night still runs: what the team didn't need
    this.state = 'escape';
    this.escaped = inCar;
    this.charge.active = false;
    this.hud.setUse(null);
    this.hud.setHint(null);
    this.hud.setIntro(null);
    this.hud.intro.classList.remove('red');
    this.objectives.closeNote();
    document.body.classList.add('cutscene');
    document.body.classList.remove('spectating');
    this.spectLabel = null;
    // the score: the shift's bonus — whole if you're in the car, some of it if you're in it hurt,
    // a little if the others got out without you. Every second of the shift you didn't need is paid out
    let bonus = CFG.SCORE.win + Math.max(0, Math.round(shiftLeft)) * CFG.SCORE.speedBonus;
    if (!inCar) bonus = Math.round(bonus * 0.3);
    else if (!this.player.alive) bonus = Math.round(bonus * 0.6);
    this.winBonus = bonus;
    this.score += bonus;
    this.stats.escaped = inCar ? 1 : 0;
    for (const m of this.monsters) {
      if (m.breath) { m.breath.stop(); m.breath = null; }
      if (m.lampGhost) { this.ghosts.release(m.lampGhost); m.lampGhost = null; }
    }
    this.fx.danger = 0;
    this.fx.trauma = 0;
    this.audio.setAmbience(0.45, 0);
  }

  endEscape() {
    if (this.state !== 'escape') return;
    this.state = 'won'; // (the results screen still watches the road)
    document.body.classList.remove('cutscene');
    this.escape.endCut();
    this.audio.setAmbience(0, 0);
    const inCar = !!this.escaped;
    if (this.onEnd) this.onEnd({ won: inCar, escaped: true, left: !inCar, coop: this.online, alive: this.player.alive });
  }

  // behind the results screen: the car keeps going, or (the old way) you look round the morning forest
  afterWon(dt, camera, realT) {
    this.time += dt;
    if (this.escape.cut) {
      this.escape.afterCut(dt);
      this.fx.fade = Math.min(0.8, this.fx.fade + dt * 0.35); // (back up out of the dark, behind the results)
    } else this.player.yaw += dt * 0.05;
    this.applyView(camera, realT);
  }

  // ---------------- the flare gun ----------------
  setFlares(n, has = n > 0) {
    const p = this.player;
    p.flares = n;
    p.hasFlare = has;
    document.body.classList.toggle('has-flare', n > 0);
  }

  // it was lying by the body you just searched
  onFlareFound(granted = false, body = this.objectives.bodies[this.objectives.flareBody]) {
    if (!granted) return this.inventory.claim('gun', this.objectives.bodies.indexOf(body));
    // a gun you find again the next night is a reload: one cartridge, not another full load
    const add = this.player.hasFlare ? 1 : CFG.FLARE.charges;
    this.setFlares(Math.min(6, add + (this.player.flares | 0)), true); // upgrade an existing ammo pocket
    this.hud.popup(`+ ${t('flareGun')} · ${t('flareCharges').replace('{n}', CFG.FLARE.charges)}`, 'amber');
    this.hud.flashFlares();
    this.audio.flareFound();
    this.inventory.reconcile();
    if (!this.hinted.flare) {
      this.hinted.flare = true;
      this.timeline.push({ at: this.time + 1.2, fn: () => this.hud.setHint(t(this.input.touch ? 'hintFlareTouch' : 'hintFlare')) });
      this.timeline.push({ at: this.time + 8.5, fn: () => this.hud.setHint(null) });
    }
  }

  // a teammate found it
  fxMateFlare(r) {
    this.hud.popup(t('mateFlare').replace('{name}', this.nameOf(r)), 'amber');
    for (const b of this.objectives.bodies) if (b.gun) b.gun.visible = false;
  }

  // Q: up it goes. it lights the forest red for a quarter of a minute — and calls everything in it
  fireFlare() {
    const p = this.player;
    if (p.alive && this.state === 'morning') { this.hud.popup(t('aFlareDay'), 'dim'); return; } // (3.1p: say so, not nothing)
    if (!p.alive || (this.state !== 'play' && this.state !== 'training')) return;
    if (p.flares <= 0 || !p.hasFlare) {
      this.hud.popup(t(p.hasFlare ? 'aNoFlares' : 'aNoFlareGun'), 'dim');
      if (p.hasFlare) this.hud.flashFlares();
      return;
    }
    this.setFlares(p.flares - 1, true);
    this.stats.flares++;
    this.hud.flashFlares();
    // where you look, a touch higher (you fire a flare up, not at things)
    const pitch = clamp(p.pitch + 0.12, -0.6, 1.5);
    const cp = Math.cos(pitch);
    const dx = -Math.sin(p.yaw) * cp, dz = -Math.cos(p.yaw) * cp, dy = Math.sin(pitch);
    const e = this.eyePos();
    const x = e.x + dx * 0.5, y = e.y - 0.1 + dy * 0.5, z = e.z + dz * 0.5;
    this.flares.launch(x, y, z, dx, dy, dz, p.id);
    if (this.sync) this.sync.ev('fl', +x.toFixed(2), +y.toFixed(2), +z.toFixed(2), +dx.toFixed(3), +dy.toFixed(3), +dz.toFixed(3));
    this.audio.flareShot(x, y, z, true);
    this.addTrauma(0.16);
    this.fx.fovKick = Math.max(this.fx.fovKick, 4);
    this.fx.white = Math.max(this.fx.white, 0.1);
    this.particles.burst(x, y, z, 16, { color: [1, 0.55, 0.35], speed: 4, life: 0.4, size: 0.05, gravity: -4, drag: 2, dir: { x: dx, y: dy, z: dz }, cone: 0.35 });
    this.playerNoise(p.x, p.z, CFG.FLARE.launchLoud, 'flare');
    if (!this.hinted.flareLure) {
      this.hinted.flareLure = true;
      this.timeline.push({ at: this.time + 2.2, fn: () => this.hud.setHint(`<span class="red">${t('hintFlareLure')}</span>`) });
      this.timeline.push({ at: this.time + 7.5, fn: () => this.hud.setHint(null) });
    }
  }

  // a teammate fired one: it flies here too
  remoteFlare(r, x, y, z, dx, dy, dz) {
    this.flares.launch(x, y, z, dx, dy, dz, r.id);
    this.audio.flareShot(x, y, z, false);
    const near = Math.max(0, 1 - this.distToEars(x, z) / 30);
    if (near > 0) this.addTrauma(0.1 * near);
  }

  // a teammate made a sound: you see their wave (tinted with their colour) and hear their click / clap / shout
  // fromMic: 0 a click from an old build, 1 their voice, 2 (4.0) their echolocator
  remotePulse(r, x, y, z, loud, fromMic) {
    loud = Math.max(0, Math.min(1, loud));
    const device = fromMic === 2, E = CFG.ECHO;
    let R = device ? E.radius : fromMic ? CFG.voiceRevealRadius(loud) : CFG.revealRadius(loud);
    const echo = echoOf(this.world, x, z);
    R *= echo.scale * mistScale(this.world, x, z);
    const first = this.firstPingT < 0;
    if (first) R = Math.max(R, 52);
    const c = r.hex;
    const k = 0.32;
    const color = [SONAR[0] * (1 - k) + (((c >> 16) & 255) / 255) * k, SONAR[1] * (1 - k) + (((c >> 8) & 255) / 255) * k, SONAR[2] * (1 - k) + ((c & 255) / 255) * k];
    this.pulses.emit(x, y, z, this.time, { radius: R, strength: device ? E.strength : 0.8 + loud * 0.7, speed: echo.speed, decay: device ? E.decay : 0.38 + (1 - loud) * 0.22, color, kind: 'player' });
    if (device) this.audio.mateEcho?.(x, y + 0.25, z);
    else if (!fromMic) this.audio.matePing(x, y + 0.25, z, loud, CFG.SCREAM);
    // whoever made the sound flashes up at the heart of their own wave
    if (!(this.spectate && this.spectate.target === r) && this.distToEars(r.x, r.z) > 1.2) {
      const vis = device ? 0.5 : loud;
      this.ghosts.spawn(r.rig, this.time, { strength: 0.55 + vis * 0.6, color: r.hex, life: 1.6 + vis, decay: 1.1, jitter: 0.4 });
      r.revealT = this.time;
    }
    this.lastPulseT = this.time;
    if (first && this.state === 'play') {
      this.firstPingT = this.time;
      this.onFirstPing(r);
    }
  }

  onFirstPing() {
    this.hud.setIntro(null);
    // the forest is still asleep: say so, once — the first night is hard enough to begin
    if (this.calmLeft() > 8 && this.player.alive) {
      this.tut.wait = 6.2; // the first tutorial line waits for this one
      this.timeline.push({
        at: this.time + 0.7,
        fn: () => {
          if (this.awake || !this.player.alive) return;
          this.hud.setHint(t('hintCalm'));
          this.calmHintOff = this.time + 4.8;
        },
      });
    }
  }

  // a shard is money too (wallet.js): yours, and on a co-op night everyone's
  earnShards(n) {
    earn(n);
    this.stats.earned = (this.stats.earned | 0) + n;
  }

  onMateShard(r) {
    this.earnShards(EARN.shard);
    if (r) this.hud.popup(t('mateShard').replace('{name}', this.nameOf(r)), 'amber');
  }

  onShard(s, i) {
    if (this.sync && i !== undefined) this.sync.ev('sh', i);
    this.earnShards(EARN.shard);
    this.stats.shards++;
    const pts = CFG.SCORE.shard * this.mult;
    this.score += pts;
    this.hud.popup(`+${Math.round(pts)} ${t('aShard')}`, 'amber');
    this.audio.shardPickup(this.stats.shards);
    this.particles.burst(s.x, s.y, s.z, 40, { color: [1.0, 0.7, 0.25], speed: 5, up: 2, life: 1.0, size: 0.11, gravity: -4, drag: 1.6 });
    this.particles.burst(s.x, s.y, s.z, 16, { color: [1.0, 0.9, 0.6], speed: 9, life: 0.35, size: 0.06, gravity: 0, drag: 3 });
    this.fx.white = Math.max(this.fx.white, 0.06);
    this.addTrauma(0.08);
    const p = this.player;
    if (p.stones < CFG.PLAYER.maxStones && this.inventory.canReceive('stones')) p.stones++;
    // a little amber pulse of light
    this.pulses.emit(s.x, s.y, s.z, this.time, { radius: 7, strength: 0.6, decay: 1.4, color: [1.0, 0.72, 0.35], kind: 'shard' });
  }

  onMonsterHunt(m) {
    const pid = m.tgt ? m.tgt.id : null;
    if (this.role === 'host') this.sync.ev('hu', m.id, pid);
    this.fxHunt(m, pid);
  }

  fxHunt(m, pid) {
    const mine = pid == null || pid === this.player.id;
    if (mine) this.stats.hunts++;
    if (m.type === 'howler') {
      this.audio.howlerBark(m.x, m.y + 1.8, m.z);
      this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 20, strength: 0.9, decay: 0.8, color: HOWL, kind: 'monster' });
      if (!this.hinted.howlSpot && mine && this.player.alive) {
        this.hinted.howlSpot = true;
        this.hud.setHint(`<span class="red">${t('hintHowlerSpot')}</span>`);
        this.timeline.push({ at: this.time + 4.5, fn: () => this.hud.setHint(null) });
      }
    } else {
      this.audio.screech(m.x, m.y + 2.4, m.z, 1);
      this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 26, strength: 0.95, decay: 0.75, color: RED, kind: 'monster' });
    }
    if (!mine || !this.player.alive) {
      // it's after someone else: you still hear it, and it still shakes you if it's close
      const k = Math.max(0, 1 - m.playerDist / 40);
      if (k > 0) this.addTrauma(0.25 * k);
      return;
    }
    this.hud.flashAlert(t('aHunt'), 'danger', 1.8);
    this.fx.glitch = Math.max(this.fx.glitch, 0.65);
    this.fx.red = Math.max(this.fx.red, 0.3);
    this.addTrauma(0.45);
  }

  onMonsterInvestigate(m, d, pid = null) {
    if (this.role === 'host') this.sync.ev('in', m.id, pid, Math.round(d));
    this.fxInvestigate(m, d, pid);
  }

  fxInvestigate(m, d, pid) {
    const mine = pid == null || pid === this.player.id;
    if (mine && this.player.alive && this.time - this.lastHeardAlert > 6 && d < 65 && !m.intro) {
      this.hud.flashAlert(t('aHeard'), 'warn', 1.3);
      this.lastHeardAlert = this.time;
    }
    if (this.time - (m.lastGrowl || -9) > 5) {
      this.audio.growl(m.x, m.y + 2.4, m.z, 0.55);
      m.lastGrowl = this.time;
    }
  }

  onMonsterLost(m) {
    const pid = m.tgt ? m.tgt.id : null;
    if (this.role === 'host') this.sync.ev('lo', m.id, pid);
    this.fxLost(m, pid);
  }

  fxLost(m, pid) {
    if (this.state !== 'play' || !this.player.alive) return;
    if (pid != null && pid !== this.player.id) return;
    if (m.playerDist > 7) {
      this.stats.escapes++;
      const pts = CFG.SCORE.escape * this.mult;
      this.score += pts;
      this.hud.popup(`+${Math.round(pts)} ${t('aEscaped')}`, 'cyan');
      this.fx.slowT = 0.5;
    }
  }

  // ---------------- the Howler ----------------
  onHowlerInhale(m) {
    if (this.role === 'host') this.sync.ev('ih', m.id);
    this.fxInhale(m);
  }

  fxInhale(m) {
    this.audio.howlerInhale(m.x, m.y + 1.8, m.z);
    const d = m.playerDist;
    if (d < m.cfg.howlR + 8) {
      this.fx.danger = Math.max(this.fx.danger, 0.5);
      if (!this.hinted.howl && this.player.alive) {
        this.hinted.howl = true;
        this.hud.setHint(`<span class="red">${t('hintHowler')}</span>`);
        this.timeline.push({ at: this.time + 4.2, fn: () => this.hud.setHint(null) });
      }
    }
  }

  onHowl(m) {
    if (this.role === 'host') this.sync.ev('hw', m.id);
    this.fxHowl(m);
  }

  fxHowl(m) {
    const R = m.cfg.howlR;
    this.audio.howlerHowl(m.x, m.y + 2.2, m.z, 1);
    // the howl is a wave of its own: it lights the forest red for everyone, you included
    const s = this.pulses.emit(m.x, m.y + 2.0, m.z, this.time, { radius: R, strength: 1.05, decay: 0.55, color: HOWL, kind: 'monster' });
    this.echoTicks(s, 0.5);
    const d = m.playerDist;
    if (d < R) {
      const k = 1 - d / R;
      this.addTrauma(0.2 + 0.4 * k);
      this.fx.red = Math.max(this.fx.red, 0.2 + 0.3 * k);
      this.fx.shockT = 0;
      this.fx.shockAmp = 0.3 + 0.6 * k;
    }
    this.radar.blip(m.x, m.z, 'monster', true);
  }

  onHowlerBark(m) {
    if (this.role === 'host') this.sync.ev('hb', m.id);
    this.fxBark(m);
  }

  fxBark(m) {
    this.audio.howlerBark(m.x, m.y + 1.8, m.z);
    this.pulses.emit(m.x, m.y + 1.6, m.z, this.time, { radius: 18, strength: 0.8, decay: 0.9, color: HOWL, kind: 'monster' });
    if (m.playerDist < 18) this.addTrauma(0.12);
  }

  // the two that come later: one of each, ever
  updateArrivals() {
    if (this.map === 'bog') return; // (3.0k) the watcher and the howler are the forest's late guests
    const n = this.objectives.count;
    for (const type of ['watcher', 'howler']) {
      if (this.monsters.some((m) => m.type === type)) continue;
      const c = CFG.MONSTER[type];
      const due = this.time >= c.arrive || (n >= c.arriveGens && this.time >= c.arrive * 0.5);
      if (!due || this.state !== 'play') continue;
      let h = null;
      if (type === 'watcher') {
        const w = createMonster('watcher', this);
        w.vanish(6);
        this.monsters.push(w);
      } else {
        h = this.spawnMonster('howler', 70, 110);
        if (!h) continue;
        h.howlT = 26;
      }
      if (this.role === 'host') this.sync.ev('ar', type, h ? Math.round(h.x) : 0, h ? Math.round(h.z) : 0);
      this.fxArrive(type, h ? h.x : null, h ? h.z : null);
    }
  }

  fxArrive(type, hx = null, hz = null) {
    if (type === 'watcher') this.audio.watcherArrive();
    else {
      // far away, it announces itself
      const p = this.ears();
      const x = hx ?? p.x + 90, z = hz ?? p.z;
      this.audio.howlerHowl(x, this.world.terrain.height(x, z) + 2.2, z, 0.8);
    }
    this.hud.flashAlert(t(type === 'watcher' ? 'aWatcherArrive' : 'aHowlerArrive'), 'warn', 2.6);
    this.audio.sting(0.3);
  }

  // ---------------- objectives ----------------
  onCorpseSearched(body, k) {
    this.stats.bodies++;
    const pts = CFG.SCORE.corpse * this.mult;
    this.score += pts;
    this.hud.popup(`+${Math.round(pts)} ${t('aFound')}: ${t('parts')[CFG.GENERATORS[k].part]}`, 'amber');
    this.particles.burst(body.x, body.y + 0.3, body.z, 18, { color: [1.0, 0.72, 0.3], speed: 2.5, up: 1.5, life: 0.8, size: 0.06, gravity: -4, drag: 2 });
    this.audio.heartbeat(0.7);
    this.addTrauma(0.06);
    this.playerNoise(body.x, body.z, 0.1, 'repair');
  }

  // a teammate found a part
  fxMateFound(r, k) {
    const spec = CFG.GENERATORS[k];
    if (!spec) return;
    this.hud.popup(t('mateFound').replace('{name}', this.nameOf(r)).replace('{part}', t('parts')[spec.part]), 'amber');
  }

  onSpark(g, remote = false) {
    const x = g.x, y = g.y + 0.7, z = g.z;
    this.audio.spark(x, y, z);
    this.particles.burst(x, y, z, 34, { color: [1.0, 0.9, 0.55], speed: 7, up: 2.5, life: 0.55, size: 0.05, gravity: -9, drag: 1.2 });
    this.pulses.emit(x, y, z, this.time, { radius: 8, strength: 0.95, decay: 1.6, color: [0.85, 0.92, 1.0], kind: 'stone' });
    if (!remote) this.playerNoise(x, z, g.spec.sparkLoud, 'repair');
    const near = Math.max(0, 1 - this.distToEars(x, z) / 12);
    this.addTrauma(0.18 * (remote ? near : 1));
    if (!remote || near > 0.5) {
      this.fx.white = Math.max(this.fx.white, 0.12);
      this.fx.glitch = Math.max(this.fx.glitch, 0.3);
    }
  }

  onSpinUp(g) {
    this.hud.flashAlert(t('aSpinUp'), 'warn', 2.2);
    this.audio.sting(0.25);
  }

  onGeneratorStarted(g, count, by = null) {
    this.hlNote('genStart');
    this.stats.gens = count;
    const pts = g.paid ? 0 : CFG.SCORE.generator * this.mult; // (2.1q: cranking a beaten engine back earns the light, not the points twice)
    g.paid = true;
    this.score += pts;
    this.hud.popup(pts > 0
      ? (by ? `+${Math.round(pts)} · ${t(this.map === 'bog' ? 'mateStartedBog' : 'mateStarted').replace('{name}', this.nameOf(by))}` : `+${Math.round(pts)}`)
      : t(this.map === 'bog' ? 'genRestartedBog' : 'genRestarted'), 'amber');
    // (3.0g) on the bog the chain is pumps: same five, different machine
    this.hud.flashAlert(t(this.map === 'bog' ? 'aPumpOn' : 'aGenOn').replace('{n}', count), 'dawn', 2.6);
    this.hud.peek(4);
    // the light coming back: a warm wave rolls out from the lamp
    const L = g.site.lamp;
    this.pulses.emit(L.x, L.y - 1, L.z, this.time, { radius: 24, strength: 1.0, decay: 0.45, color: LAMPC, kind: 'shard' });
    this.particles.burst(L.x, L.y, L.z, 30, { color: [1.0, 0.82, 0.5], speed: 4, life: 0.9, size: 0.06, gravity: -3, drag: 1.6 });
    this.fx.white = Math.max(this.fx.white, 0.08);
    this.addTrauma(0.15);
    this.noise(g.x, g.z, g.spec.startLoud, 'repair'); // the engine roars — the host's monsters hear it whoever started it
    // all five: there's power — the forestry yard's floodlight and siren, or the peat works' camp and the lock on
    // its cap (3.0q: on the bog the escape is a stand-in, so the shelter is told directly)
    if (count >= 5) this.timeline.push({ at: this.time + 1.8, fn: () => { if (this.state !== 'play') return; this.escape.powerOn(); this.bunker.onPower(); } });
  }

  // a thing beat a running generator until it stopped (2.1q): the count falls and the task points back
  onGenBroken(g, remote = false) {
    this.hlNote('genBroken');
    this.stats.gens = this.objectives.count;
    if (!remote && this.sab && this.sab.day === this.day) this.sab.done++;
    this.hud.flashAlert(t(this.map === 'bog' ? 'aGenBrokenBog' : 'aGenBroken').replace('{site}', this.objectives.siteAt(g.site)), 'danger', 3);
    this.hud.peek(4);
    this.audio.sting(0.4);
    this.noise(g.x, g.z, g.spec.startLoud, 'repair'); // the death rattle carries: things come to look
  }

  // ---------------- death ----------------
  // the Watcher has hold of you (2.1s): your feet stop answering; your head and your light still do
  onSeized(on) {
    this.seizedByWatcher = !!on;
    if (on) {
      this.hlNote('seize');
      this.fx.glitch = Math.max(this.fx.glitch, 0.85);
      this.addTrauma(0.4);
    }
  }

  // a moment worth seeing again (2.1u). The director keeps the seconds around it, so the reel shows how it
  // happened, not only that it did.
  hlNote(kind, meta) {
    this.hl?.note(kind, meta);
  }

  kill(m, victim = this.player) {
    if (this.state !== 'play') return;
    // A thing on the ground cannot reach someone sixteen metres up the lookout. It can wait below.
    if (victim.y - m.y > 3.1) return;
    const cause = m.huntCause === 'scream' && (m.huntCausePid == null || m.huntCausePid === victim.id) ? 'scream' : m.type;
    this.hlNote('death', { cause });
    if (victim !== this.player) {
      // co-op host: one of the others was caught. it stays with the body; the rest can get away.
      // (down, not dead: they bleed out slowly — unless someone gets them onto the hut's cot. see Rescue)
      if (!victim.alive) return;
      const bleed = this.rescue.bleedFor(victim);
      victim.die(victim.x, victim.z);
      victim.cause = cause;
      this.sync.ev('ki', m.id, victim.id, cause, +victim.x.toFixed(2), +victim.z.toFixed(2), bleed);
      this.rescue.down(victim, bleed);
      m.feed();
      this.fxMateDied(victim, m);
      this.checkTeam();
      return;
    }
    if (!this.player.alive) return;
    if (this.online) {
      const bleed = this.rescue.bleedFor(this.player);
      if (this.auth) {
        this.sync.ev('ki', m.id, this.player.id, cause, +this.player.x.toFixed(2), +this.player.z.toFixed(2), bleed);
        m.feed();
      }
      this.localDie(m, cause);
      this.rescue.down(this.player, bleed);
      if (this.auth) this.checkTeam();
      return;
    }
    this.state = 'dying';
    this.beginDeath(m, cause);
  }

  // the host says someone was caught
  netKill(mid, pid, cause, x, z, bleed) {
    if (this.state !== 'play') return;
    const m = this.monsterById(mid);
    if (pid === this.player.id) {
      if (!this.player.alive) return;
      this.localDie(m || { type: 'listener', x: this.player.x + 1, z: this.player.z, id: -1 }, cause || 'listener');
      this.rescue.down(this.player, Number.isFinite(bleed) ? bleed : this.rescue.bleedFor(this.player));
      return;
    }
    const r = this.remotes.get(pid);
    if (!r || !r.alive) return;
    this.hlNote('death', { cause: cause || 'listener' });
    r.die(x, z);
    r.cause = cause;
    this.rescue.down(r, Number.isFinite(bleed) ? bleed : this.rescue.bleedFor(r));
    this.fxMateDied(r, m);
  }

  // co-op: brought back on the first-aid hut's cot — on your feet beside it, gasping (see Rescue)
  reviveLocal(x, z, yaw) {
    const p = this.player;
    p.alive = true;
    p.x = x;
    p.z = z;
    p.yaw = yaw;
    p.pitch = -0.12;
    p.vx = p.vz = 0;
    p.speed = 0;
    p.y = this.world.terrain.height(x, z);
    p.stamina = 30;
    p.exhausted = false;
    p.carrying = null;
    p.carriedBy = null;
    p.onCot = false;
    p.gone = false;
    this.localDeath = false;
    this.spectate = null;
    this.spectLabel = null;
    this.jsGhost = null;
    this.charge.active = false;
    document.body.classList.remove('spectating');
    this.fx.fade = 1;
    this.fx.white = Math.max(this.fx.white, 0.55);
    this.fx.red = 0.25;
    this.addTrauma(0.35);
    this.audio.heartbeat(0.8);
    this.timeline.push({ at: this.time + 0.9, fn: () => this.audio.heartbeat(0.55) });
    this.hud.flashAlert(t('aRevived'), 'dawn', 2.6);
    this.hlNote('revive');
  }

  // the шкафандр kept you (every machine: the host said so). Yours: the doors shut in front of your face
  shkafDeath(c) {
    const p = this.player;
    if (!p.alive || (this.state !== 'play' && this.state !== 'dying')) return;
    const m = { type: 'shkaf', x: c.group.position.x, z: c.group.position.z, id: -1, y: c.group.position.y };
    this.shkafCab = c;
    this.stats.seen.shkaf = 1;
    if (this.online) {
      p.gone = true;
      p.consumed = true;
      this.localDie(m, 'shkaf');
      if (this.auth) this.checkTeam();
      return;
    }
    this.state = 'dying';
    this.beginDeath(m, 'shkaf');
  }

  // ...and a friend's: nothing left to carry to the hut
  shkafTook(r, c) {
    if (!r.alive) return;
    r.die(c.group.position.x, c.group.position.z);
    r.gone = true;
    r.consumed = true;
    r.cause = 'shkaf';
    r.carriedBy = null;
    const near = this.distToEars(r.x, r.z) < 30;
    this.audio.mateDeath(r.x, r.y + 1.2, r.z, near);
    this.hud.flashAlert(t('mateShkafDied').replace('{name}', this.nameOf(r)), 'danger', 2.8);
    this.addTrauma(near ? 0.4 : 0.15);
    this.fx.red = Math.max(this.fx.red, near ? 0.4 : 0.15);
    if (this.spectate && this.spectate.target === r) this.timeline.push({ at: this.time + 1.6, fn: () => this.nextSpectate() });
    if (this.auth) this.checkTeam();
  }

  // the Angler came back for you (every machine: the host said so). Yours: the lantern, close.
  anglerDeath(m) {
    const p = this.player;
    if (!p.alive || (this.state !== 'play' && this.state !== 'dying')) return;
    this.stats.seen.angler = 1;
    if (this.online) {
      p.gone = true;
      p.consumed = true;
      this.localDie(m, 'angler');
      if (this.auth) this.checkTeam();
      return;
    }
    this.state = 'dying';
    this.beginDeath(m, 'angler');
  }

  // ...and a friend's: by the tree there is nothing left to carry to the hut
  anglerTook(r, tree) {
    if (!r.alive) return;
    r.die(tree.ax, tree.az);
    r.gone = true;
    r.consumed = true;
    r.cause = 'angler';
    r.carriedBy = null;
    const near = this.distToEars(r.x, r.z) < 30;
    this.audio.mateDeath(r.x, r.y + 1.2, r.z, near);
    this.hud.flashAlert(t('anglerMateDied').replace('{name}', this.nameOf(r)), 'danger', 2.8);
    this.addTrauma(near ? 0.4 : 0.15);
    this.fx.red = Math.max(this.fx.red, near ? 0.4 : 0.15);
    if (this.spectate && this.spectate.target === r) this.timeline.push({ at: this.time + 1.6, fn: () => this.nextSpectate() });
    if (this.auth) this.checkTeam();
  }

  // co-op: you're dead, the night goes on without you
  localDie(m, cause) {
    const p = this.player;
    p.alive = false;
    this.localDeath = true;
    this.charge.active = false;
    this.hud.setUse(null);
    this.objectives.closeNote();
    this.objectives.target = null;
    this.beginDeath(m, cause);
  }

  fxMateDied(r, m) {
    this.hlNote('down');
    const near = this.distToEars(r.x, r.z) < 30;
    if (this.player.alive && !this.hinted.downed) {
      // the first time: they can still be saved
      this.hinted.downed = true;
      this.timeline.push({ at: this.time + 2.6, fn: () => this.hud.setHint(t(this.input.touch ? 'hintDownedTouch' : 'hintDowned')) });
      this.timeline.push({ at: this.time + 10, fn: () => this.hud.setHint(null) });
    }
    this.audio.mateDeath(r.x, r.y + 1.4, r.z, near);
    if (m && m.x !== undefined) this.pulses.emit(r.x, r.y + 1.2, r.z, this.time, { radius: near ? 18 : 12, strength: 0.9, decay: 0.8, color: RED, kind: 'monster' });
    this.hud.flashAlert(t('mateDied').replace('{name}', this.nameOf(r)), 'danger', 2.4);
    this.addTrauma(near ? 0.4 : 0.15);
    this.fx.red = Math.max(this.fx.red, near ? 0.35 : 0.15);
    if (this.spectate && this.spectate.target === r) this.timeline.push({ at: this.time + 1.6, fn: () => this.nextSpectate() });
  }

  // host: nobody left standing → in a moment, the night ends for everyone
  checkTeam() {
    if (!this.auth || !this.online || this.state !== 'play' || this.teamOverAt) return;
    if (this.livePlayers().length === 0) this.teamOverAt = this.time + 2.3;
  }

  // the end of a co-op night that nobody survived (or the host vanished)
  endOnline(won, extra = {}) {
    if (this.state === 'over' || this.state === 'idle') return;
    if (this.role === 'host' && !won) this.sync.ev('en');
    if (this.jsGhost) this.ghosts.release(this.jsGhost);
    this.jsGhost = null;
    this.state = 'over';
    this.fx.fade = 0;
    this.audio.setAmbience(0, 0);
    if (this.onEnd) this.onEnd({ won, cause: this.cause || 'listener', coop: true, alive: this.player.alive, ...extra });
  }

  hostLost() {
    if (this.state === 'over' || this.state === 'idle') return;
    this.endOnline(false, { hostLost: true });
  }

  scareRig(type) {
    // 2.1v: she is not one of the monster rigs — (3.0t) the close-up is her own body, posed by its own code
    if (type === 'stray') return (this.scareRigs.stray ||= buildStrayBody());
    return (this.scareRigs[type] ||= buildRig(type));
  }

  enterSpectate() {
    this.spectate = { target: null };
    this.nextSpectate();
    this.fx.fade = 1;
    this.fx.red = 0.2;
    document.body.classList.add('spectating');
  }

  nextSpectate() {
    if (!this.spectate) return;
    const carrier = this.player.carriedBy && this.remotes.get(this.player.carriedBy);
    if (carrier && carrier.alive) {
      // over their shoulder: you see what they see
      this.spectate.target = carrier;
      this.spectLabel = null;
      return;
    }
    const live = [...this.remotes.values()].filter((r) => r.alive);
    const i = live.indexOf(this.spectate.target);
    this.spectate.target = live.length ? live[(i + 1) % live.length] : null;
    this.spectLabel = null;
  }

  beginDeath(m, cause) {
    this.stats.seen[m.type] = 1;
    this.deathT = 0;
    this.killer = m;
    this.killType = m.type;
    this.killX = m.x;
    this.killZ = m.z;
    this.cause = cause;
    const reduced = settings.scares === 'reduced';
    this.audio.jumpscare(reduced ? 0.45 : m.type === 'shkaf' ? 0.55 : 1);
    this.fx.trauma = reduced ? 0.6 : 1;
    this.fx.white = reduced ? 0 : 0.85;
    this.fx.red = 0.7;
    this.fx.glitch = 1;
    this.hud.setHint(null);
    this.hud.setIntro(null);
    this.objectives.closeNote(); // the page in your hands goes with you, prompt and all
    this.hud.peekUntil = 0;
    for (const q of this.monsters) if (q !== m && q.breath) { q.breath.stop(); q.breath = null; }
    this.jsGhost = null;
    this.jsYaw = Math.atan2(-(m.x - this.player.x), -(m.z - this.player.z));
  }

  // the kill: it's in your face. solo → game over; co-op → you watch the others
  updateDying(dt) {
    if (this.killType === 'shkaf') return this._dyingShkaf(dt);
    this.deathT += dt;
    const p = this.player;
    const reduced = settings.scares === 'reduced';
    // whip the camera to face it
    const want = Math.atan2(-(this.killX - p.x), -(this.killZ - p.z));
    let da = want - p.yaw;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    p.yaw += da * Math.min(1, dt * 25);
    p.pitch = damp(p.pitch, 0.05, 20, dt);
    // pose the killer in your face (a stand-in rig: the real one may already be walking away)
    const type = this.killType;
    const rig = this.scareRig(type);
    const n = rig.nodes;
    const tt = this.deathT;
    if (type === 'listener') {
      n.spine.rotation.x = 0.95;
      n.neck.rotation.x = -0.4;
      n.head.rotation.x = 0.45;
      n.head.rotation.z = Math.sin(tt * 45) * 0.12;
      n.head.rotation.y = Math.sin(tt * 33) * 0.08;
      n.jaw.rotation.x = 0.85 + Math.sin(tt * 38) * 0.18;
      n.shoulderL.rotation.x = -2.1; n.shoulderR.rotation.x = -2.1;
      n.shoulderL.rotation.z = -0.5; n.shoulderR.rotation.z = 0.5;
      n.elbowL.rotation.x = -0.5; n.elbowR.rotation.x = -0.5;
    } else if (type === 'watcher') {
      // its face comes apart down the middle
      const open = Math.min(1, tt * 3.2);
      n.faceL.rotation.y = -1.1 * open;
      n.faceR.rotation.y = 1.1 * open;
      n.head.rotation.z = 0.9 + Math.sin(tt * 40) * 0.08;
      n.neck.rotation.x = 0.5;
      n.spine.rotation.x = 0.7;
      n.shoulderL.rotation.x = -2.5; n.shoulderR.rotation.x = -2.5;
      n.shoulderL.rotation.z = -0.7; n.shoulderR.rotation.z = 0.7;
      n.elbowL.rotation.x = -0.9; n.elbowR.rotation.x = -0.9;
    } else if (type === 'howler') {
      n.pelvis.rotation.x = 0.1;
      n.chest.rotation.x = 0.15;
      n.chest.scale.setScalar(1);
      n.neck.rotation.x = 0.1;
      n.head.rotation.x = -0.2 + Math.sin(tt * 36) * 0.08;
      n.head.rotation.z = Math.sin(tt * 47) * 0.15;
      n.jaw.rotation.x = 1.15 + Math.sin(tt * 30) * 0.15;
      n.shoulderL.rotation.x = -1.6; n.shoulderR.rotation.x = -1.6;
      n.shoulderL.rotation.z = -0.9; n.shoulderR.rotation.z = 0.9;
    } else if (type === 'stray') {
      // (3.0t) she rises off her toes in front of you, the jaw open and both hands coming up to your face
      poseStrayLunge(rig, tt);
    } else {
      n.head.rotation.set(-.18+Math.sin(tt*38)*.06,Math.sin(tt*23)*.12,Math.sin(tt*50)*.13);
      n.jaw.rotation.x = .95 + Math.sin(tt * 40) * .2;
      n.body.rotation.x = -.42-.2*smoothstep(0,.6,tt);
      // Front palms lunge around the skull instead of leaving six motionless spider legs.
      n.hipFL.rotation.set(-.75,.28,.6); n.hipFR.rotation.set(-.75,-.28,-.6);
      n.knFL.rotation.x=-.7+Math.sin(tt*31)*.12; n.knFR.rotation.x=-.7-Math.sin(tt*31)*.12;
      n.palmFL.rotation.x=.8; n.palmFR.rotation.x=.8;
    }
    const camY = p.y + p.eyeCur;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const r = rig.root;
    r.position.set(0, 0, 0);
    r.rotation.set(0, Math.atan2(-fx, -fz), 0);
    r.updateMatrixWorld(true);
    n.head.getWorldPosition(_v);
    const lunge = Math.max(0, 1 - tt * 5);
    const dist = (type === 'listener' ? 1.05 : type === 'howler' ? 1.3 : type === 'watcher' ? 0.9 : 0.95) + lunge * 1.8;
    r.position.set(p.x + fx * dist - _v.x, camY - _v.y + 0.12, p.z + fz * dist - _v.z);
    const strobe = reduced ? 1 : (Math.floor(tt * 14) % 2 === 0 ? 1.6 : 0.35);
    if (!this.jsGhost) this.jsGhost = this.ghosts.spawn(rig, this.time, { sticky: true, strength: strobe, full: 1, color: type === 'watcher' ? 0xe8eef4 : type === 'howler' ? 0xff5a18 : type === 'stray' ? 0xcdbf9f : 0xff3020 });
    else {
      this.ghosts.refresh(this.jsGhost, rig);
      this.jsGhost.strength = strobe;
    }
    this.fx.trauma = Math.max(this.fx.trauma, reduced ? 0.4 : 0.8 - tt * 0.3);
    this.fx.glitch = Math.max(this.fx.glitch, 0.6);
    this.fx.red = Math.max(this.fx.red, 0.4);
    this.fx.fovKick = -12;
    if (tt > 1.45) {
      this.fx.fade = Math.max(0, 1 - (tt - 1.45) * 4);
    }
    if (tt > 1.75) {
      this.ghosts.release(this.jsGhost);
      this.jsGhost = null;
      if (this.online) {
        this.localDeath = 'done';
        this.enterSpectate();
        return;
      }
      this.state = 'over';
      this.fx.fade = 0;
      this.audio.setAmbience(0, 0);
      if (this.onEnd) this.onEnd({ won: false, cause: this.cause });
    }
  }

  // inside the шкафандр: the doors close in front of you, the rollers close in, red, then nothing
  _dyingShkaf(dt) {
    this.deathT += dt;
    const tt = this.deathT;
    const p = this.player;
    const c = this.shkafCab;
    if (c) {
      const b = c.group.position;
      p.x = b.x + c.fwd.x * 0.02;
      p.z = b.z + c.fwd.z * 0.02;
      p.y = b.y - (c.D.lift || 0);
      p.eyeCur = Math.max(0.55, 1.1 - tt * 0.35);
      p.yaw = c.spec.yaw + Math.PI + Math.sin(tt * 31) * 0.06; // (facing out: the doors close in front of you)
      p.pitch = -0.08 + Math.sin(tt * 23) * 0.07 - tt * 0.1;
    }
    const fx = this.fx;
    fx.trauma = Math.max(fx.trauma, 0.85 - tt * 0.2);
    fx.red = Math.max(fx.red, 0.55);
    fx.glitch = Math.max(fx.glitch, 0.45);
    fx.fovKick = -6;
    if (tt > 0.85) fx.fade = Math.max(0, 1 - (tt - 0.85) * 2.2);
    if (tt > 1.8) {
      if (this.jsGhost) this.ghosts.release(this.jsGhost);
      this.jsGhost = null;
      if (this.online) {
        this.localDeath = 'done';
        this.enterSpectate();
        return;
      }
      this.state = 'over';
      fx.fade = 0;
      this.audio.setAmbience(0, 0);
      if (this.onEnd) is.onEnd({ won: false, cause: 'shkaf' });
    }
  }

  // ---------------- dawn ----------------
  // the night is over. Dawns one to three are a breather for whoever is still standing;
  // the fourth is the end of the shift and the win. The host's word starts it for everyone.
  startDawn() {
    this.bunker?.evacuate?.(); // (3.0q) the shelter does not keep anyone past the night
    this.tentacles?.stop(); // (4.0: whatever was out there goes back down with the light)
    this.tentAt = -1;
    this.state = 'dawn';
    this.dawnT = 0;
    shared.uDawn.value = 0;
    shared.uMorning.value = 0;
    this.hud.setIntro(null);
    this.hud.intro.classList.remove('red');
    this.hud.setUse(null);
    this.objectives.closeNote();
    if (this.role === 'host') this.sync.ev('dn', this.day);
    const noneStanding = this.rescue.dawnPeace(); // dawn raises nobody (2.1q), but rescue goes on in daylight (2.1r)
    if (noneStanding && this.day < this.daysTotal) { this.endOnline(false); return; } // nobody left to come for anyone
    const last = this.day >= this.daysTotal;
    // (3.0f) on the bog the last dawn is not the win: the car is still in the water, and the winch pays for it
    const bogFinal = last && this.map === 'bog' && !!this.winch && !this.winch.driven;
    // (3.1m) ...and in the forest it is not the win either: the УАЗ is. Outlasting the shift buys one more morning
    const forestFinal = last && this.map !== 'bog';
    if (last && !bogFinal && !forestFinal) {
      this.winBonus = CFG.SCORE.win;
      if (!this.player.alive) this.winBonus = Math.round(this.winBonus * 0.3); // your team made it; you didn't
      this.score += this.winBonus;
    } else {
      const pts = Math.round(CFG.SCORE.night * this.mult);
      this.score += pts;
      this.hud.popup(`+${pts} ${t('popNight')}`, 'dawn');
    }
    this.audio.dawn();
    this.audio.setAmbience(0.25, 0);
    this.hud.setHint(null);
    for (const m of this.monsters) m.setState('flee');
    const line = bogFinal ? t('winchFinale') : forestFinal ? t('finaleDawn') : t(last ? 'winTitle' : 'dawnSurvived');
    this.hud.flashAlert(line.replace('{n}', this.day).replace('{d}', this.daysTotal), 'dawn', bogFinal || forestFinal ? 4 : 3);
  }

  // (3.1m) the forest's last morning. The shift is won by driving out, not by outlasting it: daylight, nothing
  // hunting, the engines, the parts and the yard as the nights left them — and CFG.SHIFT.FINALE seconds to finish
  // the УАЗ and go. It runs as a 'play' state, because the whole way out (engines, the shelter's breaker, the
  // seats, the drive) belongs to the night; the hunters, the errands, the scares and the last night's wake are
  // what `finale` switches off. Every machine starts it on its own from the same dawn.
  startFinale() {
    this.state = 'play';
    this.finale = true;
    this.time = 0;
    this.cause = 'shiftEnd';
    this.awake = false; // the Angler and the girl wait for a forest that is awake: this one never wakes
    this.endgame = false;
    this.timeline = [];
    for (const m of this.monsters) m.dispose();
    this.monsters = [];
    shared.uDawn.value = MORNING_LIGHT;
    shared.uMorning.value = 1;
    shared.uSun.value.set(0.42, 0.62, -0.66).normalize();
    this.audio.setMorning(true);
    this.audio.setAmbience(0.25, 0);
    this.objectives.setMorning(true);
    this.hud.setHint(null);
    this.hud.setSkip(false);
    this.hud.setIntro(t('finaleBig'), t('finaleSmall').replace('{m}', Math.round(CFG.SHIFT.FINALE / 60)));
    this.timeline.push({ at: 7, fn: () => this.hud.setIntro(null) });
  }

  // (3.1m) the last morning ran out and the УАЗ is still in the yard: the shift is over, and it was not a win
  failShift() {
    if (this.state !== 'play') return;
    this.cause = 'shiftEnd';
    if (this.online) return this.endOnline(false, { cause: 'shiftEnd' });
    this.state = 'over';
    this.fx.fade = 0;
    this.audio.setAmbience(0, 0);
    if (this.onEnd) this.onEnd({ won: false, cause: 'shiftEnd' });
  }

  updateDawn(dt) {
    this.dawnT += dt;
    // 2.1k: the day used to jump to 0.15 on the first frame and be full by second five; now the sky opens
    // over the whole dawn, and the warm palette comes in behind the light, so nothing pops
    const k = smoothstep(0, DAWN_SECONDS - 1.2, this.dawnT);
    shared.uDawn.value = MORNING_LIGHT * k;
    shared.uMorning.value = smoothstep(0.35, 1, k);
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (this.dawnT > 1.5) {
        m.dispose();
        this.monsters.splice(i, 1);
      } else m.update(dt, this.time);
    }
    if (this.dawnT > DAWN_SECONDS && this.state === 'dawn') {
      if (this.day >= this.daysTotal) {
        // (3.0f) the bog's last dawn is not the end of the shift: the car is. Light, no monsters, and one
        // machine still in the water — everything the level was about, in one last thing to do by hand
        if (this.map === 'bog' && this.winch && !this.winch.driven) { this.winch.finale(); return; }
        if (this.map !== 'bog') { this.startFinale(); return; } // (3.1m) the forest: drive out, or the shift is lost
        this.state = 'won';
        if (this.onEnd) this.onEnd({ won: true, coop: this.online, alive: this.player.alive });
      } else this.startMorning(this.day + 1);
    }
  }

  // ---------------- scares ----------------
  scare() {
    const opts = ['apparition', 'snap', 'whisper', 'runner'];
    if (this.auth && this.voiceMimic.available) opts.push('mimic', 'mimic');
    let kind = this.rng.pick(opts);
    if (this.scareCount === 0) kind = 'snap';
    this.scareCount++;
    // the forest holds its breath first (sometimes something inhales behind you), then the hit
    const reduced = settings.scares === 'reduced';
    const lead = kind === 'whisper' ? 1.4 : this.rng.float(0.75, 1.15);
    this.audio.preScare(lead, kind === 'whisper' ? 'silence' : null, reduced ? 0.6 : 1);
    this.timeline.push({ at: this.time + lead, fn: () => { if (this.state === 'play' && this.player.alive) this['scare_' + kind](); } });
  }

  _ahead(d, lateral = 0) {
    const p = this.player;
    const f = p.forward();
    const x = p.x + f.x * d + -f.z * lateral, z = p.z + f.z * d + f.x * lateral;
    return { x, z, y: this.world.terrain.height(x, z) };
  }

  scare_apparition() {
    const p = this.player;
    const a = this._ahead(this.rng.float(2.8, 4.2), this.rng.float(-0.6, 0.6));
    this.shade.place(a.x, a.y, a.z, Math.atan2(p.x - a.x, p.z - a.z));
    const reduced = settings.scares === 'reduced';
    this.pulses.emit(p.x, p.y + 1.3, p.z, this.time, { radius: 9, strength: 0.75, decay: 2.2, color: [1, 0.85, 0.82], kind: 'scare' });
    this.stats.seen.shade = 1;
    this.ghosts.spawn(this.shade.rig, this.time, { strength: reduced ? 0.9 : 1.6, life: 0.6, decay: 3.5, color: 0xff3a2a, full: 0.7 });
    this.audio.sting(reduced ? 0.6 : 1);
    this.addTrauma(0.55);
    this.fx.glitch = 0.8;
    if (!reduced) this.fx.white = 0.22;
    this.radar.blip(a.x, a.z, 'unknown');
  }

  scare_runner() {
    const p = this.player;
    const side = this.rng.sign();
    const d = this.rng.float(9, 13);
    {
      // you hear it coming before you see it: the sound sweeps the whole path at ~18 m/s
      const f = p.forward();
      const at = (lat) => [p.x + f.x * d - f.z * lat, p.y + 0.4, p.z + f.z * d + f.x * lat];
      this.audio.runnerPass(...at(-9.5 * side), ...at(9.5 * side), 1.05);
    }
    for (let i = 0; i < 5; i++) {
      this.timeline.push({
        at: this.time + 0.25 + i * 0.14,
        fn: () => {
          const f = p.forward();
          const lat = side * (-5 + i * 2.5);
          const x = p.x + f.x * d - f.z * lat, z = p.z + f.z * d + f.x * lat;
          const y = this.world.terrain.height(x, z);
          this.shade.place(x, y, z, Math.atan2(-f.z * side, f.x * side));
          this.shade.rig.root.rotation.x = 0.25;
          this.stats.seen.shade = 1;
          this.ghosts.spawn(this.shade.rig, this.time, { strength: 1.1, life: 0.9, decay: 2.5, color: 0xff3a2a });
          this.shade.rig.root.rotation.x = 0;
          if (i === 0) this.pulses.emit(p.x, p.y + 1.3, p.z, this.time, { radius: 16, strength: 0.45, decay: 1.6, color: [1, 0.85, 0.82], kind: 'scare' });
        },
      });
    }
    this.addTrauma(0.2);
    this.fx.glitch = 0.35;
  }

  scare_snap() {
    const p = this.player;
    const f = p.forward();
    const lat = this.rng.float(-5, 5);
    const d = -this.rng.float(5, 8);
    const x = p.x + f.x * d - f.z * lat, z = p.z + f.z * d + f.x * lat;
    const y = this.world.terrain.height(x, z);
    this.audio.branchSnap(x, y + 1.2, z, 1.7, true); // ...then one slow step, and a breath
    this.pulses.emit(x, y + 1.0, z, this.time, { radius: 9, strength: 0.9, decay: 0.9, color: [0.85, 0.9, 1], kind: 'scare' });
    if (this.awake && this.rng.chance(0.45)) {
      this.shade.place(x, y, z, Math.atan2(p.x - x, p.z - z));
      this.stats.seen.shade = 1;
      this.ghosts.spawn(this.shade.rig, this.time, { strength: 1.0, life: 1.6, decay: 1.4, color: 0xff3a2a });
    }
    this.radar.blip(x, z, 'unknown');
    this.addTrauma(0.15);
  }

  scare_whisper() {
    // right behind your head, a little to one side. it knows the name of the game.
    const p = this.player;
    const f = p.forward();
    const side = this.rng.sign() * 0.3;
    this.audio.whisper(p.x - f.x * 0.55 - f.z * side, p.y + p.eyeCur, p.z - f.z * 0.55 + f.x * side);
    this.fx.glitch = 0.3;
  }

  scare_mimic() {
    if (!this.voiceMimic.replay()) this.scare_snap();
  }

  // ---------------- per-frame ----------------
  // co-op housekeeping every frame, whatever the phase: messages in, teammates, messages out
  netFrame(dt) {
    if (this.sync) this.sync.process();
    this.updateRemotes(dt);
    this._updateEars();
    if (this.sync && this.state !== 'over' && this.state !== 'idle') this.sync.tick(dt);
  }

  // teammates: interpolate, place their voices, and — in daylight or a lamp's light — simply show them
  updateRemotes(dt) {
    if (this.online) for (const id of this.audio.voices.keys()) if (!this.remotes.has(id)) this.audio.voiceSet(id, 0, 0, 0, 0);
    if (!this.remotes.size) return;
    // daylight — including the range, which is a morning that never ends (a teammate used to vanish
    // there: nothing was lighting them, so the echo rule blanked their body)
    const day = this.state === 'morning' || this.state === 'training' || (this.state === 'dusk' && this.duskT < 1.5) || this.state === 'dawn' || this.state === 'won';
    const meAlive = this.player.alive;
    const watched = this.spectate && this.spectate.target;
    for (const r of this.remotes.values()) {
      r.update(dt);
      // (3.1p) she no longer drags their shape about with her: the one she took is down, and lies where they fell
      // the dead are heard only by the dead — and by each other from anywhere: close, everywhere at once
      this.audio.voiceMode(r.id, !meAlive && !r.alive ? 'beyond' : 'forest');
      this.audio.voiceSet(r.id, r.x, r.y + (r.alive ? r.eyeCur : 0.35), r.z, r.alive || !meAlive ? 1 : 0);
      // in daylight — or in any real light: a lamp, a flare, a glow stick, the hut's lantern — they're simply
      // there, in their own clothes (not while you're behind their eyes, or they're on your shoulder)
      const lit = day ? 1 : this.glowAt(r.x, r.y + (r.alive || r.carriedBy ? 1.2 : 0.4), r.z);
      // On the range there is nothing to hide behind: a friend is drawn there whatever the hour, the
      // lamp or the cupboard thinks. (They used to blink out when a state packet landed mid-teardown.)
      const range = this.state === 'training';
      // (4.0) and close by you just see them: fully at three metres, fading out by nine (people.js uNear)
      const cp = this.camera.position;
      const nd = Math.hypot(r.x - cp.x, r.y + (r.alive ? 1 : 0.3) - cp.y, r.z - cp.z);
      r.near = day ? 0 : 1 - smoothstep(3, 9, nd);
      r.mat.uniforms.uNear.value = r.near;
      r.rig.root.visible = watched !== r && !this.onShoulder(r)
        && (range ? r.alive : (lit > 0.03 || r.near > 0.01) && this.state !== 'idle' && !this.cabinets.hides(r));
      if (lit > 0.06 && !day) r.revealT = this.time;
    }
  }

  update(dt, raw) {
    const fx = this.fx;
    const input = this.input;
    this.fire.update(dt); // burns through every state, so the camp never forgets it was there
    if (this.inputMuted) raw = { look: NO_LOOK, events: [] };
    this.inventory.update(dt);
    this.fieldView.update(dt);
    this.bag3d.update(dt);
    this.partMap.update(dt);
    this.voiceMimic.update(dt);
    if (this.inventory.active) raw = { look: NO_LOOK, events: [] };
    let look = raw.look;
    this.events = raw.events;
    this.tools.update(dt);
    this.expedition.update(dt);
    if (this.expedition.viewing) look = { dx: look.dx * 0.3, dy: look.dy * 0.3 };
    if (this.state === 'intro') return this.updateOpening(dt, raw);
    if (this.state === 'morning') return this.updateMorning(dt, raw);
    if (this.state === 'dusk') return this.updateDusk(dt, raw);
    if (this.state === 'training') return this.updateTraining(dt, raw);

    if (this.state === 'dying') {
      this._updateEars();
      this.updateDying(dt);
      this.doors.update(dt);
      this.cabinets.update(dt);
      this.flares.update(dt);
      this.torch.update(dt);
      this.camItem.update(dt);
      this.glows.update(dt);
      this.time += dt;
      this._commonFx(dt);
      return;
    }
    if (this.state === 'escape') {
      // the УАЗ is leaving: everyone watches the same fly-by (see Escape.updateCut)
      this.netFrame(dt);
      this.time += dt;
      this.doors.update(dt);
      this.flares.update(dt);
      this.torch.update(dt);
      this.camItem.update(dt);
      this.glows.update(dt);
      this.escape.update(dt);
      for (const m of this.monsters) m.update(dt, this.time);
      if (this.escape.updateCut(dt)) this.endEscape();
      this.fx.fade = Math.max(0, Math.min(this.fx.fade, 1 - smoothstep(CUT_FADE, CUT_FADE + 1.6, this.escape.cut ? this.escape.cut.t : 99)));
      this._commonFx(dt);
      return;
    }
    if (this.state === 'dawn') {
      this.netFrame(dt);
      this.updateDawn(dt);
      if (this.map === 'bog' && this.winch) {
        // (3.0f) the only dawn you can still work in: the car has to come out of the water, and dawn is light enough
        this.winch.update(dt);
        this.objectives.update(dt, false);
        if (this.player.alive) this.objectives._interact(dt, true);
      }
      this.doors.update(dt);
      this.flares.update(dt);
      this.medhut.update(dt);
      this.torch.update(dt);
      this.camItem.update(dt);
      this.glows.update(dt);
      this.rescue.update(dt);
      for (const e of this.inputMuted ? [] : raw.events) {
        if (e === 'carry') this.rescue.carryKey();
        else if (e === 'primary') this.inventory.primary();
        else if (e === 'secondary') this.inventory.secondary();
      }
      this.time += dt;
      this.angler.update(dt);
      this.stray.update(dt); // dawn: she is gone with the rest of them
      if (this.player.alive) {
        if (this.angler.myCap()) this.angler.captiveFrame(dt, look);
        else this.player.update(dt, input, look, this.inputMuted);
      }
      this._commonFx(dt);
      return;
    }
    if (this.state !== 'play') return;

    this.time += dt;
    this.grace = this.time < Math.max(CFG.GRACE_SECONDS, CFG.SPAWN_DELAY + 5) || (this.firstPingT >= 0 && this.time < this.firstPingT + 8) || this.firstPingT < 0;
    this.netFrame(dt);
    if (this.state !== 'play') return; // the host ended the night
    if (this.teamOverAt && this.time >= this.teamOverAt) return this.endOnline(false);
    // eight minutes and the sky pales: the host's dawn covers the whole room
    // (3.1m: the last morning ends the shift instead — a guest gives the host's word six seconds to arrive)
    if (this.finale) { if (this.time >= CFG.SHIFT.FINALE + (this.auth ? 0 : 6)) return this.failShift(); }
    else if (this.auth && this.time >= CFG.SHIFT.NIGHT) return this.startDawn();

    // timeline events
    for (let i = this.timeline.length - 1; i >= 0; i--) {
      if (this.time >= this.timeline[i].at) {
        const ev = this.timeline[i];
        this.timeline.splice(i, 1);
        ev.fn();
      }
    }
    if (this.state !== 'play') return;
    if (!this.player.alive) return this.updateDead(dt, raw);

    // ---- input events ----
    const es = this.escape;
    const caught = this.cabinets.busy; // (caught, or pulling someone out: your hands are on that)
    const heldByHim = !!this.angler.myCap(); // 2.1o: in the Angler's hands your keys are for struggling, nothing else
    const heldByHer = !!this.player.heldByStray || this.strayWorn; // 2.1v: her hand on your throat, or her voice in your mouth
    const heldByWater = this.drowned.captiveLocal(); // 3.0d: a hand round your ankle, and the water is patient
    for (const e of raw.events) {
      if (heldByHim || heldByHer) continue;
      if (caught && e !== 'pingDown') continue;
      if (e === 'pingDown') this.pingPress();
      else if (e === 'primary') this.inventory.primary();
      else if (e === 'secondary') this.inventory.secondary();
      else if (e === 'carry') this.carryKey();
    }
    // E puts a note away
    if (this.objectives.note && raw.events.includes('useDown')) {
      this.objectives.closeNote();
      this.events = raw.events.filter((e) => e !== 'useDown');
    }
    this._echoClock(dt);
    if (this.echoMulT > 0) {
      this.echoMulT = Math.max(0, this.echoMulT - dt);
      if (this.echoMulT === 0) this.echoMul = 1; // the echo comes back on time again
    }

    // ---- player ----
    const p = this.player;
    // (in the УАЗ you sit still and look about: see Escape._seated)
    // she is wearing you (2.1v): you stand exactly where you were, and only your head is yours
    const pev = heldByHim ? (this.angler.captiveFrame(dt, this.inputMuted ? NO_LOOK : raw.look), { step: null, bump: null, breath: null })
      : heldByWater ? this.drowned.dragFrame(dt)
      : this.strayWorn ? this.seatedLook(look) : es.mySeat >= 0 || caught || (this.expedition.onTower && !this.expedition.walkTop) ? this.seatedLook(look) : p.update(dt, input, look, this.inputMuted || this.inventory.active || this.seizedByWatcher || p.heldByStray, es.load(p.id));
    if (this.expedition.walkTop) this.expedition.clampDeck(); // (2.1s: the lookout's rails)
    if (pev.step) {
      const s = pev.step;
      // (3.0b) a step in the water is a splash and a ring on the surface; on the planks it is a creak
      if (s.water) {
        this.audio.wade(s.intensity, s.depth || 0.3); // 3.0k: water under a foot has its own sound
        // (3.0n) and the surface itself takes the push: a boot, a stride, a crouched tip-toe
        waterKick(this.waves, this.world, p.x, p.z, this.time, s.mode === 'sprint' ? 'run' : s.mode === 'crouch' ? 'tap' : 'step', 0.7 + 0.5 * Math.min(1, (s.depth || 0.3) / 0.7));
        this.pulses.emitStep(p.x, this.world.water?.level ?? p.y, p.z, this.time, { radius: s.ring || 8, strength: 0.5, speed: 12, decay: 1.6, kind: 'step' });
      } else if (s.plank) {
        this.audio.creak(s.intensity);
      } else {
        this.audio.footstep(s.intensity);
      }
      if (s.brush) this.audio.rustle(s.brush, s.intensity, s.dry); // (4.0) the undergrowth around your legs
      if (s.mode === 'crouch') {
        this.pulses.emitStep(p.x, p.y + 0.15, p.z, this.time, { radius: 2.6, strength: 0.3, speed: 10, decay: 2.4, kind: 'step' });
        // ...unless it is a crouched step in the water: that still splashes, quietly (or one through a bush: it rustles)
        if (s.water || s.brush) this.playerNoise(p.x, p.z, s.loud, 'step');
      } else {
        const sprint = s.mode === 'sprint';
        this.pulses.emitStep(p.x, p.y + 0.2, p.z, this.time, { radius: sprint ? 9 : 5.5, strength: sprint ? 0.6 : 0.42, speed: 16, decay: sprint ? 1.9 : 2.3, kind: 'step' });
        this.playerNoise(p.x, p.z, s.loud, 'step');
        this.stepNoise = Math.max(this.stepNoise, s.loud);
      }
    }
    if (pev.bump) {
      const b = pev.bump;
      this.audio.bump();
      this.addTrauma(0.22 + b.strength * 0.2);
      this.pulses.emitStep(b.x, p.y + 1.2, b.z, this.time, { radius: 5, strength: 0.9, speed: 14, decay: 1.1, kind: 'step' });
      this.playerNoise(p.x, p.z, 0.26, 'bump');
      this.stepNoise = Math.max(this.stepNoise, 0.26);
      this.particles.burst(b.x, p.y + 1.3, b.z, 12, { color: [0.55, 0.8, 0.9], speed: 2.5, life: 0.7, size: 0.05, gravity: -5, drag: 2, dir: { x: b.nx, y: 0.3, z: b.nz }, cone: 0.8 });
    }
    this._jumpEvents(pev, true);
    if (pev.breath) {
      this.audio.breathHeavy();
      this.playerNoise(p.x, p.z, 0.14, 'breath');
      if (!this.exhaustWarned) {
        this.hud.popup(t('aExhausted'), 'dim');
        this.exhaustWarned = true;
      }
    }
    if (!p.exhausted) this.exhaustWarned = false;
    this.stepNoise = Math.max(0, this.stepNoise - dt * 0.6);
    this._workPose(dt);

    // ---- microphone ----
    const mev = this.mic.update(dt, this.audio.outputDb());
    if (mev.loud > 0) {
      this.playerNoise(p.x, p.z, mev.loud, 'voice', mev.scream);
      this.stats.loudest = Math.max(this.stats.loudest, mev.loud);
    }
    if (mev.pulse > 0) this.emitPlayerPulse(mev.pulse, true);
    if (mev.scream && !this.screamFlag) this.onScream();
    this.screamFlag = mev.scream;
    if (this.mic.lostFlag) {
      this.mic.lostFlag = false;
      this.hud.flashAlert(t('aMicLost'), 'warn', 2);
      this.hud.setMic('off');
    }

    // ---- world ----
    this.pulses.update(this.time);
    this._waterFrame();
    this.stones.update(dt, this);
    this.doors.update(dt);
    this.flares.update(dt);
    this.medhut.update(dt);
    this.torch.update(dt);
    this.camItem.update(dt);
    this.glows.update(dt);
    this.rescue.update(dt);
    es.update(dt);
    this.cabinets.update(dt);
    const nearest = this.updateMonsters(dt);
    this.angler.update(dt);
    this.stray.update(dt);
    this.drowned.update(dt); // the bog: it drags you out into the deep (3.0d)
    this.gnats.update(dt); // ...and the midges eat your echo (3.0e)
    this.magpies.update(dt); // ...and the birds tell on you (3.1c)
    this.winch.update(dt); // ...and the water comes back unless the drum keeps turning (3.0f)
    if (this.state !== 'play') return; // killed this frame
    if (!this.player.alive) return; // co-op: caught this frame — the death plays from the next one
    this.shards.update(dt, this);
    this.objectives.update(dt, true);
    if (this.state !== 'play') return; // (the car left)
    // (3.0q) the shelter: its lamps write the last word into the light slots, its script runs the beats, and the
    // ones it lets out are its own. (It can end the night, so ask again before going on.)
    this.bunker.update(dt);
    if (this.state !== 'play') return;
    es.beacons(dt);
    if (this.auth && !this.finale) this.updateArrivals();
    this.updateFronts();
    if (!this.finale) this.updateDirector(dt); // (3.1m: the last morning sends nobody)
    if (!this.finale && this.time > this.nextScare) {
      this.nextScare = this.time + this.rng.float(55, 115);
      if (!this.monsters.some((m) => m.state === 'hunt')) this.scare();
    }
    this.updateIntro(dt);
    if (!this.finale) this.dread.update(dt);

    // ---- scoring ----
    this.score += dt * CFG.SCORE.perSecond * this.mult;

    // ---- danger / atmosphere ----
    const dread = this.firstPingT < 0 ? 0.16 : 0; // a slow heartbeat in the dark before your first sound
    fx.danger = damp(fx.danger, Math.max(nearest, dread), 3, dt);
    this.audio.update(fx.danger, Math.min(1, this.time / CFG.SHIFT.NIGHT));
    this.audio.setAmbience(this.finale ? 0.25 : 0.9, fx.danger);

    // four minutes into the last night the forest stops pretending: everything comes looking, for good
    if (!this.finale && this.day >= this.daysTotal && this.time >= CFG.SHIFT.LAST_WAKE && this.auth) {
      if (!this.endgame) {
        this.endgame = true;
        this.wakeT = 5;
        if (this.role === 'host') this.sync.ev('wk');
        this.fxWake();
      }
      this.wakeT -= dt;
      if (this.wakeT <= 0) {
        this.wakeT = 14;
        const live = this.livePlayers();
        for (const m of this.monsters) {
          const q = live.length ? live[Math.floor(this.rng.next() * live.length)] : p;
          if (m.state === 'wander' || m.state === 'search' || m.state === 'idle') m.investigate(q.x + this.rng.float(-7, 7), q.z + this.rng.float(-7, 7));
        }
      }
    }

    this._commonFx(dt);
  }

  fxWake() {
    this.hud.flashAlert(t('aAwake'), 'danger', 3);
    this.audio.sting(0.7);
  }

  // co-op, after your death: the kill plays out, then you see the night through a friend's eyes
  updateDead(dt, raw) {
    if (this.localDeath === true) this.updateDying(dt);
    else if (this.spectate) {
      for (const e of raw.events) if (e === 'pingDown' || e === 'primary' || e === 'throw' || e === 'skip') this.nextSpectate();
      if (!this.spectate.target || !this.spectate.target.alive) this.nextSpectate();
    }
    this.mic.update(dt, this.audio.outputDb()); // keeps the meter honest; the dead make no noise
    this.pulses.update(this.time);
    this._waterFrame();
    this.stones.update(dt, this);
    this.doors.update(dt);
    this.flares.update(dt);
    this.medhut.update(dt);
    this.torch.update(dt);
    this.camItem.update(dt);
    this.glows.update(dt);
    this.rescue.update(dt);
    this.angler.update(dt); // a dead host still keeps his rope and his clock
    this.stray.update(dt); // (3.1p) ...and she goes on walking under the name of the one she took
    this.escape.update(dt);
    this.cabinets.update(dt);
    if (this.player.alive) return; // brought back this frame
    const nearest = this.updateMonsters(dt);
    if (this.state !== 'play') return;
    this.objectives.update(dt, true);
    if (this.auth && !this.finale) this.updateArrivals();
    this.updateFronts();
    if (!this.finale) this.updateDirector(dt);
    this.fx.danger = damp(this.fx.danger, nearest * 0.8, 3, dt);
    this.audio.update(this.fx.danger, Math.min(1, this.time / CFG.SHIFT.NIGHT));
    this.audio.setAmbience(this.finale ? 0.25 : 0.9, this.fx.danger);
    if (!this.finale && this.day >= this.daysTotal && this.time >= CFG.SHIFT.LAST_WAKE && this.auth && !this.endgame) {
      this.endgame = true;
      if (this.role === 'host') this.sync.ev('wk');
      this.fxWake();
    }
    this._commonFx(dt);
  }

  updateMonsters(dt) {
    let danger = 0;
    for (const m of this.monsters) {
      m.update(dt, this.time);
      if (this.state !== 'play') return 1;
      danger = Math.max(danger, m.danger());
      this.lampGhost(m);
      // close call: it passed right by you and never knew
      const d = m.playerDist;
      if (this.player.alive && m.type !== 'watcher' && m.type !== 'angler' && m.state !== 'hunt' && m.state !== 'feed' && d < 4.6 && this.time - m.lastCloseCall > 25 && this.firstPingT >= 0) {
        m.lastCloseCall = this.time;
        this.stats.close++;
        const pts = CFG.SCORE.closeCall * this.mult;
        this.score += pts;
        this.hud.popup(`+${Math.round(pts)} ${t('aClose')}`, 'red');
        this.fx.slowT = 0.7;
        this.audio.heartbeat(0.9);
        this.audio.sniff(m.x, m.y + m.headY, m.z, 0.55);
        this.addTrauma(0.12);
      }
    }
    return danger;
  }

  // steady light at a spot: a running generator's lamp, or a burning flare (0..1)
  glowAt(x, y, z) {
    return Math.max(this.objectives.lampAt(x, z), this.flares.lightAt(x, y, z), this.glows.lightAt(x, y, z));
  }

  // a friend over the shoulder of the one whose eyes you're looking through (you, or whoever you watch):
  // not drawn — they'd fill the view
  onShoulder(r) {
    if (r.alive || !r.carriedBy) return false;
    const watched = this.spectate && this.spectate.target;
    return r.carriedBy === this.player.id || (!!watched && r.carriedBy === watched.id);
  }

  // a glow stick's light (or the hut's lantern) at a spot (0..1)
  smallLightAt(x, y, z) {
    return this.glows.lightAt(x, y, z);
  }

  // standing in a lamp's (or a flare's) light, a monster can simply be seen — a live afterimage that follows it
  lampGhost(m) {
    const lit = m.state === 'lurk' ? 0 : this.glowAt(m.x, m.y + 1.5, m.z);
    if (lit > 0.06) {
      const str = Math.min(0.85, 0.22 + lit * 1.3);
      if (!m.lampGhost) {
        m.lampGhost = this.ghosts.spawn(m.rig, this.time, { sticky: true, strength: str, full: 0.25, color: m.ghostColor, jitter: 0.6 });
        this.stats.seen[m.type] = 1;
      }
      else {
        this.ghosts.refresh(m.lampGhost, m.rig);
        m.lampGhost.strength = str;
      }
      m.lastGhostT = this.time;
    } else if (m.lampGhost) {
      this.ghosts.release(m.lampGhost);
      m.lampGhost = null;
    }
  }

  updateFronts() {
    for (const s of this.pulses.fronts()) {
      this.voiceMimic.reveal(s);
      this.stray?.reveal(s);
      for (const m of this.monsters) {
        const d = Math.hypot(m.x - s.x, m.y + 1.4 - s.y, m.z - s.z);
        if (d > s.prevR && d <= s.curR && d <= s.radius) {
          const fall = 1 - smoothstep(s.radius * 0.42, s.radius, d);
          const str = clamp(s.strength * (0.65 + 0.7 * fall), 0.6, 1.8);
          this.ghosts.spawn(m.rig, this.time, { strength: str, color: m.ghostColor, life: 2.9, decay: 0.85 });
          m.lastGhostT = this.time;
          this.stats.seen[m.type] = 1;
          if (m.type === 'watcher' && !m.revealed) {
            m.revealed = true;
            if (this.time - (this.lastWatcherSting ?? -99) > 40 && this.player.alive) {
              this.lastWatcherSting = this.time;
              this.audio.watcherSting();
              this.addTrauma(0.3);
              this.fx.glitch = Math.max(this.fx.glitch, 0.5);
            }
            if (!this.hinted.watcher && this.player.alive) {
              this.hinted.watcher = true;
              this.hud.setHint(`<span class="red">${t('hintWatcher')}</span>`);
              this.timeline.push({ at: this.time + 5.5, fn: () => this.hud.setHint(null) });
            }
          }
          this.radar.blip(m.x, m.z, 'monster', m.state === 'hunt');
          if (s.kind !== 'monster') this.audio.monsterReturn(0, m.x, m.y + 2, m.z, 0.25 + str * 0.3);
          if (!this.intro.revealDone && s.kind === 'player' && this.player.alive && Math.hypot(m.x - this.player.x, m.z - this.player.z) < 45) {
            this.intro.revealDone = true;
            this.intro.itHearsT = this.time;
            this.hud.setIntro(t('itHears'), null);
            this.hud.intro.classList.add('red');
            this.audio.sting(0.35);
            this.addTrauma(0.2);
          }
        }
      }
      for (const r of this.remotes.values()) {
        if ((this.spectate && this.spectate.target === r) || this.onShoulder(r) || r.consumed) continue;
        const d = Math.hypot(r.x - s.x, r.y + 1.0 - s.y, r.z - s.z);
        if (d > s.prevR && d <= s.curR && d <= s.radius && d > 0.8) {
          const fall = 1 - smoothstep(s.radius * 0.42, s.radius, d);
          this.ghosts.spawn(r.rig, this.time, { strength: clamp(s.strength * (0.55 + 0.6 * fall), 0.45, 1.4), color: r.alive ? r.hex : 0x7c8588, life: 2.6, decay: 0.9, jitter: 0.4, dyeK: r.alive ? 1 : 0.3 });
          r.revealT = this.time;
          this.radar.blip(r.x, r.z, 'mate');
        }
      }
      this.shards.onFront(s, this);
      this.objectives.onFront(s);
      this.escape.onFront(s);
    }
  }

  // from the third night the things have learned what the humming boxes mean (2.1q): up to twice a
  // night one of them is sent to beat a running generator until it stops. Host-only, at the 1 Hz tick.
  _sabotageTick() {
    const B = CFG.GEN_BREAK;
    if (!this.sab || this.sab.day !== this.day) this.sab = { day: this.day, done: 0, next: B.firstAfter };
    const S = this.sab;
    if (this.diffDay() < B.fromDay || S.done >= B.maxPerNight || this.time < S.next) return;
    if (this.monsters.some((m) => m.sab)) return; // one errand at a time
    const ob = this.objectives;
    if (!ob.count || ob.count >= 5) { S.next = this.time + 20; return; } // nothing to break — or the yard already has its power
    let best = null, bestD = -1;
    for (const g of ob.gens) {
      if (!g.running || this.time - (g.ranAt ?? -99) < B.minRun) continue;
      let nd = 1e9;
      for (const p of this.livePlayers()) nd = Math.min(nd, Math.hypot(p.x - g.x, p.z - g.z));
      if (nd < B.playerClearR) continue; // not under your nose: you hear it die from away off
      if (nd > bestD) { bestD = nd; best = g; }
    }
    if (!best) { S.next = this.time + 15; return; }
    let m0 = null, md = 1e9;
    for (const m of this.monsters) {
      if (m.type !== 'listener' && m.type !== 'crawler') continue;
      if (m.state === 'hunt' || m.state === 'feed' || m.state === 'flee' || m.scripted) continue;
      const d = Math.hypot(m.x - best.x, m.z - best.z);
      if (d < md) { md = d; m0 = m; }
    }
    if (!m0 || md > 110) { S.next = this.time + 15; return; }
    m0.sab = best;
    m0.sabT = 0;
    m0.sabWhack = 0;
    m0.sabAge = 0;
    m0.investigate(best.x, best.z);
    S.next = this.time + this.rng.float(B.gap[0], B.gap[1]);
  }

  updateDirector(dt) {
    this.mult = dangerMultiplier(this.auth ? this.time : this.netT || this.time, this.diffDay());
    if (this.mult !== this.lastMultStep) {
      this.lastMultStep = this.mult;
      this.hud.flashAlert(`${t('aWake')} ×${this.mult.toFixed(1)}`, 'warn', 2.2);
      this.hud.peek(4);
      this.audio.sting(0.35);
    }
    if (!this.auth) return;
    const S = CFG.SHIFT;
    const dayLen = S.NIGHT + S.MORNING + CFG.DUSK_SECONDS;
    const prog = Math.min(1, ((this.day - 1) * dayLen + Math.min(this.time, S.NIGHT)) / (this.daysTotal * dayLen));
    this.hearingScale = 1 + prog * 0.35;
    this.speedScale = 1 + prog * 0.18;
    if (!this.awake) {
      if (this.time < CFG.SPAWN_DELAY) return; // the forest is still asleep
      this.wake();
    }
    this.dirT = (this.dirT || 0) - dt;
    if (this.dirT > 0) return;
    this.dirT = 1.0;
    if (this.map === 'bog') {
      // (3.0k) the bog keeps its own books: the Дrowned is in the water (see game/drowned.js) and the Гнус has
      // its own clock (see game/gnat.js). Nothing here reads the forest's table of listeners and crawlers.
      if (this.drowned && !this.drowned.bodyObj()) this.drowned.spawnNight();
      this._sabotageTick();
      return;
    }
    const want = monsterTargets(this.time, this.diffDay());
    let L = 0, C = 0;
    for (const m of this.monsters) {
      if (m.type === 'listener') L++;
      else if (m.type === 'crawler') C++;
    }
    // a bigger team draws a few more of them
    const extra = this.online ? Math.max(0, Math.round((this.livePlayers().length - 1) * 0.7)) : 0;
    if (L < Math.min(CFG.MAX_LISTENERS, want.listeners + extra)) this.spawnMonster('listener', 60, 90);
    else if (C < want.crawlers) this.spawnMonster('crawler', 55, 85);
    for (const m of this.monsters) {
      if (m.type === 'angler') continue; // he is exactly where his errand put him
      if ((m.state === 'wander' || m.state === 'idle') && m.tgtDist > 120 && !m.intro) this.relocate(m);
      if (m.intro && m.tgtDist > 120) { m.intro = false; this.relocate(m); }
    }
    this._sabotageTick();
  }

  updateIntro(dt) {
    const it = this.intro;
    it.t += dt;
    const hud = this.hud;
    if (this.firstPingT < 0) {
      if (it.t < 1.9) hud.setIntro(t('intro1'));
      else {
        const hint = this.input.touch ? t('introHintTouch') : this.mic.state === 'on' ? t('introHintMic') : t('introHintKeys');
        hud.setIntro(t('intro2'), hint);
      }
      if (it.t > 9 && !it.autoSnap) {
        it.autoSnap = true;
        this.scare_snap();
      }
      return;
    }
    if (it.itHearsT < 0 && !it.cleared) {
      it.cleared = true;
      hud.setIntro(null);
    }
    if (this.calmHintOff && (this.time > this.calmHintOff || this.awake)) {
      this.calmHintOff = 0;
      if (this.tut.done || this.tut.step === 0) hud.setHint(null);
    }
    if (it.itHearsT >= 0 && this.time - it.itHearsT > 2.4) {
      hud.setIntro(null);
      hud.intro.classList.remove('red');
      it.itHearsT = -1;
    }
    // tutorial hints (first run only)
    const tut = this.tut;
    if (tut.done) return;
    tut.t += dt;
    const touch = this.input.touch;
    if (tut.step === 0) {
      if (tut.t > tut.wait) { tut.step = this.morningT < 17 ? 1 : 2; tut.t = 0; }
    } else if (tut.step === 1) {
      hud.setHint(touch ? t('tutMoveTouch') : t('tutMove'));
      if (tut.t > 7) { tut.step = 2; tut.t = 0; }
    } else if (tut.step === 2) {
      hud.setHint(touch ? t('tutUseTouch') : t(this.map === 'bog' ? 'tutUseBog' : 'tutUse')); // (3.0r: the bog's machine is a pump)
      if (tut.t > 9 || this.stats.bodies > 0) { tut.step = 3; tut.t = 0; }
    } else if (tut.step === 3) {
      hud.setHint(touch ? t('tutStoneTouch') : t('tutStone'));
      if (tut.t > 7) { tut.step = 4; tut.t = 0; }
    } else if (tut.step === 4) {
      hud.setHint(`<span class="red">${t('tutScream')}</span>`);
      if (tut.t > 5) {
        tut.step = 5;
        tut.done = true;
        hud.setHint(null);
        settings.tutorialDone = true;
        saveSettings();
      }
    }
  }

  _commonFx(dt) {
    const fx = this.fx;
    this._tentFrame(dt);
    fx.trauma = Math.max(0, fx.trauma - dt * 1.05);
    fx.glitch = Math.max(0, fx.glitch - dt * 1.8);
    // the Watcher's grip (2.1s): while it holds you the psychosis climbs to the ceiling; let go and it leaks away
    fx.psych = this.seizedByWatcher ? Math.min(1, fx.psych + dt / 1.1) : Math.max(0, fx.psych - dt * 0.45);
    if (this.audio?.ready) this.audio.psychosis(fx.psych);
    // morning fog (2.1s): the day comes up milk-white and by dusk it has mostly burned off
    const fogT = this.state === 'morning' ? 1 : this.state === 'dawn' ? 0.6 : this.state === 'dusk' ? 0.3 : 0;
    shared.uFog.value += Math.max(-dt * 0.22, Math.min(dt * 0.22, fogT - shared.uFog.value));
    fx.red = Math.max(0, fx.red - dt * 1.4);
    fx.white = Math.max(0, fx.white - dt * 3.2);
    fx.shockT += dt;
    fx.fovKick = damp(fx.fovKick, 0, 5, dt);
    if (fx.slowT > 0) fx.slowT -= dt / Math.max(fx.timeScale, 0.3);
    fx.timeScale = damp(fx.timeScale, fx.slowT > 0 ? 0.45 : 1, 8, dt);
    // out of the opening film's black (2.1j left fadeIn assigned and never spent: the first night
    // started with fx.fade = 0 and stayed black — nothing could be seen or done)
    if (this.fadeIn > 0) {
      this.fadeIn = Math.max(0, this.fadeIn - dt);
      const k = 1 - this.fadeIn / FADE_IN;
      fx.fade = Math.max(fx.fade, smoothstep(0, 1, k));
    }
    // the bog's drizzle: it follows you, it thins at dawn and it stops when the shift does
    if (this.rain) {
      const live = this.state === 'play' || this.state === 'morning' || this.state === 'dawn' || this.state === 'dusk' || this.state === 'dying' || this.state === 'escape';
      this.rain.setVisible(live);
      if (live) {
        const p = this.player;
        // in the morning the drizzle is nearly gone; at night it is the level's own hush of water
        const strength = this.state === 'morning' ? 0.55 : 1;
        this.rain.update(dt, p.x, p.y, p.z, strength);
      }
    }
  }

  // camera + listener + post uniforms
  applyView(camera, realT) {
    const sp = this.spectate && this.spectate.target;
    const p = sp || this.player;
    const fx = this.fx;
    const sh = fx.trauma * fx.trauma;
    const introCam = this.state === 'intro' && this.opening.applyCamera(camera);
    const cutCam = introCam || ((this.state === 'escape' || this.state === 'won') && this.escape.applyCutCamera(camera));
    if (cutCam) {
      // the fly-by's camera (a hit from the gate still shakes it)
      if (sh > 0.001) {
        const n = this.noiseGen, tt = realT * 26;
        camera.rotateZ(sh * 0.05 * n.noise(tt, 13.7));
        camera.rotateX(sh * 0.04 * n.noise(tt, 7.1));
      }
    } else {
      const n = this.noiseGen;
      const tt = realT * 26;
      const nx = n.noise(tt, 1.3), ny = n.noise(tt, 7.1), nr = n.noise(tt, 13.7), px = n.noise(tt, 21.4), py = n.noise(tt, 31.9);
      // a held breath: the view is never perfectly still, and shakes more when it's close
      const br = 0.0035 + fx.danger * 0.0045 + (p.exhausted ? 0.006 : 0);
      const yaw = p.yaw + sh * 0.07 * nx + Math.sin(realT * 0.43) * br * 0.5;
      // (4.0) + the body's weight in the eyes: the landing's nod, a lean back into a push and forward into a stop
      const pitch = p.pitch + (p.viewPitch || 0) + sh * 0.06 * ny + Math.sin(realT * 1.05) * br;
      const roll = (p.roll || 0) + sh * 0.09 * nr + Math.sin(realT * 0.61 + 1.3) * br * 0.7;
      camera.rotation.set(pitch, yaw, roll, 'YXZ');
      const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
      const lf = p.swayF || 0, lr = p.swayR || 0; // (the head a hair behind the push, along and across the body)
      camera.position.set(p.x + cy * sh * 0.08 * px - sy * lf + cy * lr, p.y + p.eyeCur + (p.bobY || 0) + (p.viewY || 0) + sh * 0.06 * py, p.z - sy * sh * 0.08 * px - cy * lf - sy * lr);
      const base = fovFor(camera.aspect);
      const fov = this.expedition.viewing ? 22 : base + fx.fovKick + (p.sprinting ? 5 : 0);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = damp(camera.fov, fov, 10, 1 / 60);
        camera.updateProjectionMatrix();
      }
    }
    camera.updateMatrixWorld();
    camera.getWorldDirection(_v);
    this.audio.setListener(camera.position.x, camera.position.y, camera.position.z, _v.x, _v.y, _v.z);
    this.expedition.applyView(camera);
    this.world.grass?.update(camera);
    this.world.undergrowth?.update(camera);
    // on a bike your hands are on the bars: the first-person arms would be drawn across the cockpit
    const riding = this.motos?.rider >= 0;
    const hands = !cutCam && !sp && !riding && !this.expedition.onTower && this.player.alive && (this.state === 'play' || this.state === 'dawn' || this.state === 'training');
    const gear = hands && !this.partMap.active && !this.cabinets.busy && !this.inventory.active && this.inventory.equipT <= 0 && this.fieldView.watch < 0.1 && !this.escape.held && !this.player.carrying;
    const active = this.inventory.equipped;
    const hc = cutCam || sp ? camera : this._handCam(camera, realT); // (4.0) the hands on arms, not on the lens
    this.glows.placeView(hc, gear && active === 'glow');
    this.escape.placeView(hc, hands);
    this.cabinets.placeView(camera, hands);
    this.torch.placeView(hc, gear && active === 'torch');
    this.tools.placeView(hc, gear && (active === 'tape' || active === 'crowbar'));
    this.partMap.place(camera,hands&&!this.cabinets.busy&&!this.inventory.active);
    this.fieldView.place(hc, !cutCam && !sp && this.player.alive && !riding && !this.cabinets.busy && !this.expedition.onTower && ['play','morning','dawn','training'].includes(this.state));
    this.bag3d.place(camera);
    this.fire.placeCamera(camera);
    this.motos.placeCockpit(camera, riding); // the rider's own bars (the arms above are off while riding)
    // your own body, under your eyes
    const st = this.state;
    this.selfBody.place(!cutCam && !sp && this.player.alive && !this.angler.heldLocal() && !this.cabinets.busy && !this.expedition.onTower && (st === 'play' || st === 'dawn' || st === 'morning' || st === 'dusk' || st === 'training'));

    const u = this.post.u;
    u.uAberr.value = 0.12 + fx.glitch * 0.9 + fx.danger * 0.25 + sh * 0.5 + fx.psych * 1.7;
    u.uGlitch.value = fx.glitch;
    u.uPsych.value = fx.psych;
    u.uRed.value = fx.red;
    u.uWhite.value = fx.white;
    u.uDanger.value = fx.danger;
    u.uGrain.value = 0.06 + fx.danger * 0.05 + fx.glitch * 0.1 + fx.psych * 0.14;
    u.uShockR.value = fx.shockT * 0.9;
    u.uShockAmp.value = fx.shockAmp * Math.max(0, 1 - fx.shockT * 1.3);
    u.uFade.value = fx.fade;
    u.uWarm.value = shared.uDawn.value;
    // under a burning flare the world gets its colour back: red
    const flareK = this.flares.lightAt(camera.position.x, camera.position.y, camera.position.z);
    u.uAsh.value = 0.62 * (1 - Math.min(1, shared.uDawn.value * 1.4)) * (1 - 0.7 * flareK);
    const live = this.state === 'play' || this.state === 'dying';
    u.uFlicker.value = this.state === 'play' ? this.dread.flicker : 0;
    shared.uFear.value = live ? smoothstep(0.5, 1.0, fx.danger) : 0;
  }

  // (4.0) where the hands are drawn from: the camera, plus a little of the arms' own life — they trail a quick turn
  // and swing back, sink a touch deeper than the eyes on a landing, lift as you rise, and drop and tilt in a run
  _handCam(camera, realT) {
    const hc = this._hcam || (this._hcam = new THREE.Object3D());
    const H = this._hs || (this._hs = { t: realT, yaw: camera.rotation.y, pitch: camera.rotation.x, ly: { x: 0, v: 0 }, lp: { x: 0, v: 0 }, run: 0, air: 0 });
    const dt = clamp(realT - H.t, 0, 0.1);
    H.t = realT;
    const p = this.player;
    if (dt > 0) {
      const wy = angleDiff(H.yaw, camera.rotation.y) / dt, wp = (camera.rotation.x - H.pitch) / dt;
      spring(H.ly, clamp(-wy * 0.011, -0.07, 0.07), 140, 17, dt);
      spring(H.lp, clamp(-wp * 0.009, -0.05, 0.05), 140, 17, dt);
      H.run = damp(H.run, p.sprinting && p.speed > 2 ? 1 : 0, 6, dt);
      H.air = damp(H.air, p.grounded === false ? clamp((p.vy || 0) * 0.25, -1, 1) : 0, 10, dt);
    }
    H.yaw = camera.rotation.y;
    H.pitch = camera.rotation.x;
    hc.position.copy(camera.position);
    hc.quaternion.copy(camera.quaternion);
    hc.rotateY(H.ly.x);
    hc.rotateX(H.lp.x - H.run * 0.07);
    const ph = p.bobPhase || 0, amp = p.bobAmp || 0;
    hc.translateX(Math.sin(ph) * amp * 0.18);
    hc.translateY(-H.run * 0.022 + (p.viewY || 0) * 0.6 - H.air * 0.012 - Math.abs(Math.sin(ph)) * amp * 0.08);
    hc.aspect = camera.aspect;
    hc.updateMatrixWorld(true);
    return hc;
  }

  hudUpdate(dt) {
    const p = this.player;
    this.hud.update(this, dt, this.input.peekHeld);
    this.beyond.update(this, dt);
    const sp = this.spectate;
    const self = this.online ? this.rescue.selfState() : null; // down / carried / cot / gone
    const key = sp ? `${sp.target ? sp.target.id : '-'}|${self}` : '';
    if (this.spectLabel !== key) {
      this.spectLabel = key;
      const el = document.getElementById('spect');
      if (sp) {
        el.style.setProperty('--c', sp.target ? sp.target.color : '#fff');
        const name = sp.target ? escHtml(this.nameOf(sp.target)) : '';
        const next = `<small>${t(this.input.touch ? 'spectNextTouch' : 'spectNext')}</small>`;
        if (self === 'carried' && sp.target) el.innerHTML = t('spectCarried').replace('{name}', name);
        else if (self === 'cot') el.innerHTML = sp.target ? `${t('spectCot')}<small>${t('spectWatching').replace('{name}', name)}</small>` : t('spectCot');
        else if (self === 'down') el.innerHTML = sp.target ? `${t('spectDown').replace('{name}', name)}<small>${t('spectDownHint')}</small>` : t('spectAllDead');
        else el.innerHTML = sp.target ? `${t('spectating').replace('{name}', name)}${next}` : t('spectAllDead');
      }
      document.body.classList.toggle('spectating', !!sp);
    }
    // touch: the buttons that only make sense right now
    const playing = this.state === 'play' && p.alive;
    const es = this.escape;
    document.body.classList.toggle('can-carry', playing && ((this.online && (!!p.carrying || !!this.rescue.liftTarget())) || !!es.held || es.mySeat >= 0));
    document.body.classList.toggle('carrying', playing && (!!p.carrying || !!es.held || es.mySeat >= 0));
    document.body.classList.toggle('holding', playing && !!es.held);
    document.body.classList.toggle('has-glow', playing && (this.glows.count > 0 || !!this.glows.held));
    document.body.classList.toggle('has-torch', playing && this.torch.has);
    // (4.0) no more charging: the ring is the microphone's alone, and the arc round the dot is the device refilling
    this.hud.ring(dt, this.mic, 0, this.mic.state === 'on');
    this.hud.cooldown((this.state === 'play' || this.state === 'training') && p.alive && this.pingCD > 0 ? this.pingCD / this.pingCDMax : 0);
    if (settings.radar) {
      const R = p.alive ? Math.max(this.mic.loud > 0 ? CFG.voiceHearRadius(this.mic.loud) : 0, this.stepNoise > 0 ? CFG.hearRadius(this.stepNoise) : 0) : 0;
      const scream = p.alive && this.mic.screamHeld > 0.1;
      const c = (sp && sp.target) || p;
      this.radar.draw(dt, c.x, c.z, c.yaw, this.pulses.slots, R, scream);
    }
  }
}

export { Pulses };
;
