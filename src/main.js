import './backpack.css';
// ТИШЕ / HUSH — entry point: renderer, boot, menu attract mode, state machine, main loop.
import '@fontsource/rubik-wet-paint/cyrillic-400.css';
import '@fontsource/rubik-wet-paint/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './style.css';
import './garage-home.css';
import './screen-editor.css';
import './cloud.css';
import './social.css';

import * as THREE from 'three';
import { CFG } from './core/config.js';
import { settings, saveSettings, submitScore, recordNight } from './core/storage.js';
import { setLang, t } from './core/i18n.js';
import { World } from './world/world.js';
import { shared, createWorldMaterial, createMotes, createSky } from './render/sonar.js';
import { Pulses } from './render/pulses.js';
import { Post } from './render/post.js';
import { OmniShadows } from './render/shadows.js';
import { Ghosts } from './render/ghosts.js';
import { Eyes } from './render/eyes.js';
import { Particles } from './render/particles.js';
import { audio } from './audio/audio.js';
import { mic, Mic } from './audio/mic.js';
import { Input } from './input/input.js';
import { HUD, fmtTime, fmtScore } from './ui/hud.js';
import { Radar } from './ui/radar.js';
import { Menus } from './ui/menus.js';
import { Game } from './game/game.js';
import { buildListener } from './game/monsters.js';
import { PLAYER_COLORS } from './game/remote.js';
import { EARN, wallet, onWallet, pendingRewards } from './game/wallet.js';
import {myFit} from './game/outfit.js';
import {beginRewards,endRewards} from './cloud/rewards.js';
import {CloudController} from './cloud/controller.js';
import {cloudWords} from './cloud/words.js';
import {AccountUI} from './ui/account.js';
import {SocialDock} from './ui/socialDock.js';
import {SocialToasts} from './ui/socialToasts.js';
import {socialWords} from './ui/socialWords.js';
import {currentIdentity,setIdentityProvider} from './core/identity.js';
import {getScope,isAccountScope,readJSON} from './core/persistence.js';
import { News } from './ui/news.js';
import { MicCal } from './ui/miccal.js';
import { Coop, myName } from './net/coop.js';
import { cleanCode } from './net/net.js';
import { Lobby } from './ui/lobby.js';
import { Garage } from './ui/garage.js';
import { GarageStudio, GarageMannequin } from './ui/garageStudio.js';
import { GarageHome } from './ui/garageHome.js';
import { Mates } from './ui/mates.js';
import { VoiceMix, VoiceList } from './ui/voicemix.js';
import { Atlas } from './ui/atlas.js';
import { Wardrobe } from './ui/wardrobe.js';

setLang(settings.lang);

const params = new URLSearchParams(location.search);
const DEBUG = {
  t: parseFloat(params.get('t')) || 0,
  speed: parseFloat(params.get('speed')) || 1,
  autostart: params.has('autostart'),
  night: params.has('night'), // skip the morning
  nomic: params.has('nomic'),
  fps: params.has('fps'),
};

const $ = (id) => document.getElementById(id);
const canvas = $('gl');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
} catch (e) {
  $('bootText').textContent = 'WebGL2 недоступен / WebGL2 is not available';
  throw e;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.info.autoReset = false;
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CFG.FOV, innerWidth / innerHeight, 0.05, CFG.CAMERA_FAR);
camera.rotation.order = 'YXZ';
const post = new Post(renderer);
const shadows = new OmniShadows(renderer); // walls stop light (filled with the forest once it's generated)

// ---------------- systems ----------------
const worldMat = createWorldMaterial();
const world = new World(scene, worldMat);
const pulses = new Pulses();
const ghosts = new Ghosts(scene);
const eyes = new Eyes(scene);
const particles = new Particles(scene);
const motes = createMotes(2600);
scene.add(motes);
const sky = createSky();
scene.add(sky);
const hud = new HUD();
const radar = new Radar($('radar'));
const input = new Input(canvas);
input.bindTouchUI($('touch'));
const coop = new Coop({ audio, mic });
const mates = new Mates($('mates'));
const voiceMix = new VoiceMix(audio); // your volume for each friend's voice
const pauseVoices = new VoiceList($('pauseVoiceRows'), voiceMix, audio);
// the atlas (main menu): a field journal with live 3D plates. its own little canvas; the forest isn't drawn while it's open
const atlas = new Atlas({ audio, world, onClose: () => home.atlasClosed() });
// the wardrobe (main menu): your survivor stands by the buttons; click it to dress it. friends in your room
// hear about it as soon as you walk out
const wardrobe = new Wardrobe({
  audio, coop, name: () => myName(),
  stageFactory: () => {const g=ensureGarage();return g?new GarageMannequin(g.studio,()=>{if(lobby.isOpen())lobby.render();else home.enter();}):null;},
  onClose: () => {
    const back = lobby.isOpen() ? document.querySelector('#coopList button.fit') : $('btnWardrobe');
    if (back) back.focus({ preventScroll: true });
    cloud.safePoint();
  },
  onChange: () => {
    if (coop.active) coop.announce();
  },
});
const news = new News($('news')); // what's new, on the menu's left
// the microphone in 15 seconds (from the menu's mic row, and from the settings)
const micCal = new MicCal({
  mic,
  ensureMic: async () => {
    audio.init();
    if (mic.state !== 'on') {
      settings.micEnabled = true;
      await mic.start(audio);
      saveSettings();
      micChanged();
    }
    return mic.state === 'on';
  },
  sound: (k) => {
    if (!audio.ready) return;
    audio.wardrobe(k === 'done' ? 'buy' : k === 'fail' ? 'tap' : 'dye');
  },
});
for (const id of ['micCalBtn', 'btnMicCal']) $(id).addEventListener('click', (e) => {
  e.preventDefault();
  micCal.open();
});
// a modal over the menu hides the figure: don't draw it then
const MENU_COVERS = ['settingsPanel', 'howPanel', 'scoresPanel', 'coopPanel'];
let game = null;
let runOnline = false; // the current / last run is a co-op night

let state = 'boot'; // boot | menu | playing | paused | over
let overAt = 0;
let menuTime = 0;
const perf = { acc: 0, n: 0, scale: 1, cool: 3, ceiling: 9, ceilT: 0, fpsEl: null, fps: 60 };

// ---------------- resolution ----------------
function scaleBounds() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (settings.quality === 'high') return [Math.min(dpr, 1.5), Math.min(dpr, 1.5)];
  if (settings.quality === 'low') return [0.55, 0.55];
  return [0.5, Math.min(dpr, 1.25)];
}
function applyQuality() {
  const [lo, hi] = scaleBounds();
  perf.scale = Math.min(hi, Math.max(lo, settings.quality === 'auto' ? Math.min(1, hi) : hi));
  resize();
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  post.setSize(w, h, perf.scale);
  radar.resize();
  if (garage) garage.resize(w, h);
}
window.addEventListener('resize', resize);

function pixScale() {
  return post.h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
}

function perfTick(dt) {
  perf.acc += dt;
  perf.n++;
  perf.cool -= dt;
  perf.ceilT -= dt;
  if (perf.ceilT <= 0) perf.ceiling = 9;
  if (perf.acc < 1) return;
  const avg = perf.acc / perf.n;
  perf.fps = 1 / avg;
  perf.acc = 0;
  perf.n = 0;
  if (settings.quality === 'auto' && (state === 'playing' || state === 'menu')) {
    const [lo, hi] = scaleBounds();
    if (avg > 1 / 50 && perf.scale > lo + 0.001) {
      perf.ceiling = perf.scale - 0.05;
      perf.ceilT = 30;
      perf.scale = Math.max(lo, perf.scale - 0.12);
      perf.cool = 4;
      resize();
    } else if (avg < 1 / 57 && perf.scale < Math.min(hi, perf.ceiling) - 0.001 && perf.cool <= 0) {
      perf.scale = Math.min(hi, perf.ceiling, perf.scale + 0.06);
      perf.cool = 5;
      resize();
    }
  }
  if (perf.fpsEl) perf.fpsEl.textContent = `${perf.fps.toFixed(0)} fps · ${post.w}×${post.h} · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris`;
}

// ---------------- menus ----------------
const menus = new Menus({
  onPlay: () => startRun(),
  onResume: () => resume(),
  onRestart: () => restartRun(),
  onEndTraining: () => endTraining(),
  onRange: () => startTrainingSolo(),
  onMenu: () => toMenu(),
  onCoop: () => lobby.open(),
  onAtlas: () => {
    if (state === 'menu') home.openAtlas();
  },
  onShop: () => {
    if (state === 'menu') wardrobe.open('shop');
  },
  onLobby: () => toMenu(true),
  onMicToggle: () => toggleMic(),
  onSettingsChanged: (key) => {
    if (key === 'volume') audio.setVolume(settings.volume);
    if (key === 'voiceEcho') mic.setEcho(settings.voiceEcho);
    if (key === 'micEnabled') {
      if (!settings.micEnabled && mic.state === 'on') mic.stop();
      if (settings.micEnabled && mic.state !== 'on') {
        audio.init();
        mic.start(audio).then(micChanged);
      }
      micChanged();
    }
    if (key === 'quality') applyQuality();
    if (key === 'radar') applyRadar();
    if (key === 'lang' || key === undefined) {
      hud.cache = {};
      atlas.applyI18n();
      wardrobe.applyI18n();
      news.render();
      account.render();social.update();syncIdentityFields();
      updateMicUI();
      lobby.render();
      $('lockHint').textContent = input.lockFailed ? t('dragToLook') : t('clickToLook');
    }
  },
  uiSound: (k) => {
    if (!audio.ready) return;
    if (k === 'hover') audio.uiHover();
    else audio.uiClick();
  },
});

// ---------------- co-op ----------------
// the lobby's garage: one scene on the main renderer, built the first time it's needed
let garage = null;
let garageFailed = false;
function ensureGarage() {
  if (garage || garageFailed) return garage;
  try {
    garage = new Garage({ renderer, post, audio });
    garage.studio = new GarageStudio(garage);
    garage.resize(innerWidth, innerHeight);
    garage.voice = (id) => lobby.level(id);
    lobby.garage = garage;
  } catch (e) {
    console.warn('[garage] could not be built — the lobby stays flat', e);
    garageFailed = true;
    garage = null;
  }
  return garage;
}
const lobby = new Lobby({
  coop, mic, audio, mix: voiceMix,
  beforeOpen: () => { home.setActive(false); return ensureGarage(); },
  afterClose: () => home.enter(),
  onMicToggle: () => toggleMic(),
  onWardrobe: () => {
    if (state === 'menu') wardrobe.open(); // (over the lobby: you stay in the room)
  },
  uiSound: (k) => {
    if (!audio.ready) return;
    if (k === 'hover') audio.uiHover();
    else audio.uiClick();
  },
});
const home=new GarageHome({ensureGarage,atlas,onWardrobe:()=>wardrobe.open()});
// No account gate on play, and no cloud request in the frame loop.
const canApplyAccount=()=>state==='menu'&&!coop.active&&!lobby.starting&&!wardrobe.isOpen()&&!atlas.isOpen()&&!micCal.isOpen()&&!['settingsPanel','howPanel','scoresPanel'].some(id=>menus.isOpen(id));
const cloud=new CloudController({
 canApply:canApplyAccount,
 onApplied:()=>{setLang(settings.lang);menus.applyI18n();menus.loadSettingsForm();$('nameInput').value=settings.name;if(!coop.active)$('coopName').value=settings.name;atlas.applyI18n();atlas.refreshBadge();wardrobe.applyI18n();news.render();audio.setVolume(settings.volume);mic.setEcho(settings.voiceEcho);updateMicUI();lobby.menuLabel();if(garage?.view==='menu'){const f=myFit();garage.setCar(f.car,f.cc);garage.studio.setFit(f);}syncIdentityFields();account?.render();social.update();},
 getPresence:()=>{const room=coop.active&&!coop.inRun&&coop.phase==='lobby'?coop.code:null;return{state:['playing','paused'].includes(state)?'playing':room?'lobby':'online',room,strategy:coop.signalling?.only||'default'};},
 onNotice:notice=>notifications.push(notice)
});
setIdentityProvider(()=>{const owner=getScope(),p=cloud.profile?.id===owner?cloud.profile:isAccountScope(owner)?readJSON('hush.cloud-profile.v1',null,owner):null;if(p?.id===owner||owner==='guest'&&cloud.user&&cloud.profile)return{locked:true,name:p?.display_name||cloud.profile.display_name};return null;});
function syncIdentityFields(){const p=currentIdentity();for(const id of['nameInput','coopName']){const input=$(id);input.readOnly=!!p?.locked;input.title=p?.locked?socialWords().locked:'';if(p?.locked)input.value=p.name;}}
const account=new AccountUI({cloud,canOpen:()=>state==='menu'&&!wardrobe.isOpen()&&!atlas.isOpen()&&!micCal.isOpen()&&!lobby.rulesOpen&&!lobby.starting,canChange:canApplyAccount,getRoom:()=>coop.active&&!coop.inRun?coop.code:null,getInviteLink:()=>coop.active?coop.inviteLink():null,onJoin:async room=>{
 if(state!=='menu'||lobby.starting)throw new Error('leave_room');account.close();lobby.open();if(coop.active&&coop.code===room.room_code)return;await coop.join(room.room_code,{strategy:room.strategy});lobby.render();
}});
const social=new SocialDock({cloud,account,portrait:(fit,canvas)=>{if(!wardrobe.mq)return false;wardrobe.mq.still(fit,'head',canvas);return true;}});
const notifications=new SocialToasts({cloud,account});
lobby.onInvite=()=>account.open('invite');
cloud.on(()=>syncIdentityFields());
let overReward=null;
function renderOverWallet(){const el=$('overWallet');if(!el||!overReward)return;const{earned,escBonus}=overReward;el.textContent=earned>0?t('walletNight').replace('{n}',earned).replace('{escape}',escBonus?t('walletEscape').replace('{n}',escBonus):'').replace('{total}',wallet.shards):'';if(pendingRewards()>0)el.textContent+=' · '+cloudWords().pending;}
onWallet(()=>{if(state==='over')renderOverWallet();});cloud.on(()=>{if(state==='over')renderOverWallet();});

coop.on('change', () => {lobby.render();cloud.presenceChanged();cloud.safePoint();});
coop.on('start', (d) => beginCoopRun(d));
coop.on('hostLost', () => {
  if (runOnline && game && (state === 'playing' || state === 'paused')) game.hostLost();
  if (garage && garage.starting) {
    garage.abortStart();
    lobby.setStarting(false);
  }
  lobby.render();
});

// the host pressed START in the garage: the car starts first (everyone sees it), then the night.
// A restart from the results screen (no cut) goes straight in, as before.
function beginCoopRun(d) {
  account.close();
  if (d.cut && state === 'menu' && ensureGarage()) {
    if (atlas.isOpen()) atlas.close();
    if (wardrobe.isOpen()) wardrobe.close();
    for (const id of ['settingsPanel', 'howPanel', 'scoresPanel']) menus.show(id, false);
    if (!lobby.isOpen()) lobby.open();
    lobby.setStarting(true);
    const depart = d.cut === 2; // the gates open and the car takes the team to the training ground
    const ok = depart ? garage.startDepart(() => {
      lobby.setStarting(false);
      if (!coop.active || !coop.inRun || coop.status === 'hostLost' || state !== 'menu') {
        garage.abortStart();
        lobby.render();
        return;
      }
      startRun({ coop: d });
    }) : garage.startCar(() => {
      lobby.setStarting(false);
      if (!coop.active || !coop.inRun || coop.status === 'hostLost' || state !== 'menu') {
        garage.abortStart();
        lobby.render();
        return;
      }
      garage.releaseEngine(2.4); // it idles on under the first seconds of the morning
      startRun({ coop: d });
    });
    if (ok) return;
    lobby.setStarting(false);
  }
  startRun({ coop: d });
}

function updateMicUI() {
  menus.setMicStatus(mic.state, Mic.inIframe());
  hud.setMic(mic.state);
  $('sMic').checked = settings.micEnabled;
}

// the mic came on or went off: your friends' voice chat follows
function micChanged() {
  updateMicUI();
  if (coop.active) {
    coop.syncVoice();
    coop.announce();
  }
  lobby.render();
}

async function toggleMic() {
  audio.init();
  if (mic.state === 'on') {
    mic.stop();
    settings.micEnabled = false;
  } else {
    settings.micEnabled = true;
    updateMicUI();
    await mic.start(audio);
  }
  saveSettings();
  micChanged();
  if (state === 'playing') hud.popup(mic.state === 'on' ? t('micOn') : t('micOff'), 'dim');
}

function applyRadar() {
  document.body.classList.toggle('radar-on', !!settings.radar);
  radar.resize();
}

$('pauseBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  if (state === 'playing') pause();
});
$('btnStart').addEventListener('click', () => audio.init());
// first interaction anywhere unlocks audio (browser autoplay policy)
window.addEventListener('pointerdown', () => audio.init(), { capture: true });
window.addEventListener('keydown', () => audio.init(), { capture: true });

// ---------------- attract mode (menu background) ----------------
const attract = { rig: null, yaw: 0.6, nextPing: 0.4, nextGlint: 2.2 };
function setupAttract() {
  const rig = buildListener();
  const a = 2.35, d = 21;
  const x = world.spawn.x + Math.cos(a) * d, z = world.spawn.z + Math.sin(a) * d;
  rig.root.position.set(x, world.terrain.height(x, z), z);
  rig.root.rotation.y = Math.atan2(world.spawn.x - x, world.spawn.z - z);
  rig.nodes.spine.rotation.x = 0.35;
  rig.nodes.neck.rotation.x = -0.3;
  rig.nodes.head.rotation.z = 0.35;
  rig.nodes.shoulderL.rotation.x = -0.2;
  rig.nodes.shoulderR.rotation.x = 0.1;
  rig.nodes.jaw.rotation.x = 0.25;
  attract.rig = rig;
}

function attractPulse(loud, white = true) {
  const p = camera.position;
  pulses.emit(p.x, p.y - 0.3, p.z, menuTime, {
    radius: CFG.revealRadius(loud), strength: 0.85 + loud * 0.5, decay: 0.42, color: white ? [0.84, 0.92, 1.0] : [1, 0.2, 0.15], kind: 'player',
  });
  attract.lastPing = menuTime;
  wardrobe.ping(); // the same echo sweeps over your survivor by the buttons
}

// between the pings, the thing in the trees looks at you
function attractGlint() {
  const rig = attract.rig;
  rig.root.updateMatrixWorld(true);
  const h = rig.nodes.head;
  const v = h.getWorldPosition(new THREE.Vector3());
  const yaw = rig.root.rotation.y;
  eyes.add(v.x + Math.sin(yaw) * 0.09, v.y + 0.06, v.z + Math.cos(yaw) * 0.09, yaw, { time: menuTime, life: 0.75, intensity: 0.85, blink: Math.random() < 0.5, spacing: 0.26, size: 0.16 });
}

function updateAttract(dt) {
  menuTime += dt;
  shared.uTime.value = menuTime;
  attract.yaw += dt * 0.06;
  const sx = world.spawn.x, sz = world.spawn.z;
  camera.position.set(sx, world.terrain.height(sx, sz) + 1.7, sz);
  camera.rotation.set(0.03 + Math.sin(menuTime * 0.21) * 0.03, attract.yaw, Math.sin(menuTime * 0.13) * 0.01, 'YXZ');
  shared.uCam.value.copy(camera.position);
  if (state === 'menu' && menuTime > attract.nextPing) {
    attractPulse(0.5 + Math.random() * 0.35);
    attract.nextPing = menuTime + 3.2 + Math.random() * 2.2;
  }
  if (state === 'menu' && menuTime > attract.nextGlint) {
    if (menuTime - (attract.lastPing ?? -9) > 2.2 && attract.nextPing - menuTime > 0.9) attractGlint();
    attract.nextGlint = menuTime + 2.5 + Math.random() * 4;
  }
  // talk to the menu: your voice lights the forest
  if (mic.state === 'on') {
    const ev = mic.update(dt, audio.outputDb());
    if (ev.pulse > 0 && state === 'menu' && !micCal.isOpen()) {
      if (atlas.isOpen()) atlas.ping();
      else if (wardrobe.isOpen()) wardrobe.ping();
      else {
        attractPulse(Math.max(0.35, ev.pulse));
        attract.nextPing = menuTime + 3;
      }
      if (ev.pulse > 0.85) wardrobe.startle(); // you yelled: it flinches
    }
    const trigPos = mic.screamDb > mic.floor ? (mic.trig - mic.floor) / (mic.screamDb - mic.floor) : 0.3;
    menus.micTest(mic.meter, Math.min(0.9, Math.max(0.05, trigPos)));
  }
  pulses.update(menuTime);
  for (const s of pulses.fronts()) {
    const r = attract.rig.root.position;
    const d = Math.hypot(r.x - s.x, r.y + 1.4 - s.y, r.z - s.z);
    if (d > s.prevR && d <= s.curR) ghosts.spawn(attract.rig, menuTime, { strength: 1.0, life: 2.6, decay: 1.0, color: 0xff2a20 });
  }
  ghosts.update(menuTime);
  eyes.update(menuTime, pixScale());
  particles.update(dt, pixScale());
  const u = post.u;
  u.uAberr.value = 0.2;
  u.uGlitch.value = Math.max(0, u.uGlitch.value - dt * 2);
  u.uRed.value = 0;
  u.uWhite.value = 0;
  u.uDanger.value = 0;
  u.uGrain.value = 0.06;
  u.uShockAmp.value = 0;
  u.uFade.value = Math.min(1, u.uFade.value + dt * 0.8);
  u.uWarm.value = 0;
  u.uFlicker.value = 0;
  u.uAsh.value = 0.62;
  shared.uDawn.value = 0;
  shared.uFear.value = 0;
}

// the lobby's garage: your voice (and your friends') light it up like an echo
const voiceSeen = new Map(); // peer id -> { lv, t }
function updateGarage(dt) {
  menuTime += dt;
  const me = coop.me();
  if (mic.state === 'on') {
    const ev = mic.update(dt, audio.outputDb());
    if (ev.pulse > 0 && me) garage.voicePing(me.slot, Math.max(0.35, ev.pulse));
    else if(ev.pulse>0&&garage.studio){const p=garage.studio.resident.rig.nodes.head.getWorldPosition(new THREE.Vector3());garage.ping(p.x,p.y,p.z,4,.14);}
    const ratio=mic.screamDb>mic.floor?(mic.trig-mic.floor)/(mic.screamDb-mic.floor):.3;
    menus.micTest(mic.meter,Math.min(.9,Math.max(.05,ratio)));
  }
  const now = performance.now();
  for (const p of coop.players()) {
    if (p.self) continue;
    const lv = audio.voiceLevel(p.id);
    const v = voiceSeen.get(p.id) || { lv: 0, t: 0 };
    if (lv > 0.32 && v.lv <= 0.32 && now - v.t > 1500) {
      v.t = now;
      garage.voicePing(p.slot, lv);
    }
    v.lv = lv;
    voiceSeen.set(p.id, v);
  }
}

// ---------------- state transitions ----------------
function setBodyState() {
  document.body.classList.toggle('playing', state === 'playing');
  input.gameActive = state === 'playing';
}

// opts.coop = the host's start message ({ seed, players }) for a co-op night
function startRun(opts = {}) {
  if (!game) return;
  account.close();overReward=null;
  const online = !!opts.coop;
  const training = !!(opts.training || opts.coop?.tr); // the departure film's destination
  if (!online && state === 'over' && performance.now() - overAt < 450) return;
  if (!online && coop.active) coop.leave(); // a solo night: you leave the room
  if (runOnline && game.online) game.teardownOnline();
  atlas.close(); // a co-op host can start the night while you're reading
  wardrobe.close(); // ...or trying on a hat
  audio.init();
  audio.setVolume(settings.volume);
  menus.only(null);
  menus.show('settingsPanel', false);
  menus.show('howPanel', false);
  menus.show('scoresPanel', false);
  lobby.close();
  home.leave();garage?.close();
  hud.show(true);
  hud.cache = {};
  input.reset();
  mates.clear();
  document.body.classList.remove('coop-over', 'coop-guest', 'spectating', 'cutscene', 'in-car', 'holding');
  document.body.classList.toggle('coop', online);
  runOnline = online;
  if (online) {
    const me = opts.coop.players.find((p) => p.id === coop.selfId);
    game.setupSolo();
    game.reset({ seed: opts.coop.seed, slot: me ? me.slot : 0, online: true, training });
    game.setupOnline(coop, opts.coop.players);
  } else {
    game.setupSolo();
    game.reset({ training });
    if (DEBUG.night || DEBUG.t > 0) game.startNight();
    if (DEBUG.t > 0) {
      game.time = DEBUG.t;
      game.firstPingT = Math.max(0, DEBUG.t - 30);
      game.tut.done = true;
    }
  }
  beginRewards();
  state = 'playing';
  cloud.presenceChanged();
  setBodyState();
  post.u.uFade.value = 1;
  if (!input.touch) input.requestLock();
  audio.startAmbience();
  audio.resetFx(); // never start a run muffled, silent, or with the last death still ringing
  audio.setAmbience(0.9, 0);
  audio.setPaused(false);
  if (settings.micEnabled && !DEBUG.nomic && (mic.state === 'off')) {
    mic.start(audio).then(micChanged);
    updateMicUI();
  }
  lastFrame = performance.now();
}

// ---------------- the training ground ----------------
// the menu's «ПОЛИГОН»: the same departure film, played alone — gates, engine, everyone in (that's you)
function startTrainingSolo() {
  if (state !== 'menu') return;
  if (!garage && !ensureGarage()) return;
  audio.init();
  audio.setVolume(settings.volume);
  menus.only(null);
  home.leave();
  lobby.close();
  document.body.classList.add('cutscene');
  const done = () => {
    document.body.classList.remove('cutscene');
    garage.close();
    startRun({ training: true });
  };
  ensureSoloFig();
  garage.open('room');
  if (!garage.startDepart(done)) done();
}

// your figure at the wheel, for the solo film (the lobby keeps its own figures)
function ensureSoloFig() {
  if (!garage) return;
  if (!garage.figs[0]) garage.setPlayers([{ id: 'me', name: settings.name || '???', slot: 0, self: true, fit: myFit() }]);
}

// pack up the training: no scores, no records — the garage/lobby is where you were
function endTraining() {
  if (!game || state !== 'playing' || !game.training) return;
  const online = runOnline;
  game.inventory.close(false);
  game.fieldView.reset();
  game.tools.silence(true);
  game.expedition.silence();
  game.flares.clear();
  game.motos.dismount(true);
  game.motos.dispose();
  game.train?.end();
  game.train = null;
  game.training = false;
  game.state = 'idle';
  game.inputMuted = false;
  runOnline = false;
  document.body.classList.remove('spectating', 'cutscene', 'coop');
  mates.clear();
  hud.show(false);
  input.exitLock();
  audio.setPaused(false);
  if (online) {
    if (coop.isHost) coop.endRun(); else coop.leaveRun();
    game.teardownOnline();
    state = 'menu';
    setBodyState();
    lobby.open();
    lobby.render();
  } else {
    state = 'menu';
    setBodyState();
    menus.only('menu');
    home.enter();
  }
  cloud.presenceChanged();
  lastFrame = performance.now();
}

// "again": solo restarts at once; in co-op only the host can call a new night (for everyone)
function restartRun() {
  if (runOnline || coop.active) {
    if (coop.active && coop.isHost && state !== 'playing') coop.startRun();
    return;
  }
  startRun();
}

function pause() {
  game?.inventory.close(false);
  if (state !== 'playing' || !game || !['play', 'morning', 'dusk', 'training'].includes(game.state)) return;
  state = 'paused';
  setBodyState();
  game.tools.cancelRecord();
  game.expedition.closeView();
  game.inputMuted = true; // also prevents automatic phrase capture behind the solo pause menu
  input.reset();
  if (!game.online) audio.setPaused(true);
  input.exitLock();
  const night = game.state === 'play';
  const training = game.state === 'training';
  $('pauseStats').innerHTML = training
    ? t('trainingSmall')
    : night
    ? `${fmtTime(game.time)} · ${t('generators')} ${game.objectives.count}/5<br>${t('score')} ${fmtScore(game.score)} ×${game.mult.toFixed(1)}`
    : `${t('morningBig')}`;
  $('btnEndTraining').hidden = !training;
  $('btnRestartP').hidden = training;
  renderPauseVoices();
  menus.only('pause');
}

// co-op pause: a volume slider for each friend (the night goes on meanwhile)
function renderPauseVoices() {
  const list = game && game.online ? [...game.remotes.values()].sort((a, b) => a.slot - b.slot).map((r) => ({ id: r.id, name: r.name, color: r.color, dead: !r.alive })) : [];
  $('pauseVoices').classList.toggle('show', pauseVoices.render(list) > 0);
}

function resume() {
  if (state !== 'paused') return;
  menus.show('settingsPanel', false);
  menus.only(null);
  state = 'playing';
  setBodyState();
  audio.setPaused(false);
  if (game) game.inputMuted = false;
  if (!input.touch) input.requestLock();
  lastFrame = performance.now();
}

// keepRoom: co-op "to the lobby" — stay in the room with your friends
function toMenu(keepRoom = false) {
  account.close();endRewards({reason:'menu',time:game?.time,score:game?.score,gens:game?.objectives.count});overReward=null;
  const wasOnline = runOnline;
  // walking away from a night still leaves it in the atlas (what you met, what you started)
  if (game && (state === 'playing' || state === 'paused') && (game.state === 'play' || game.state === 'dying')) {
    try {
      const started = game.objectives.gens.filter((g) => g.running).map((g) => ({ k: g.k, site: g.site && g.site.id }));
      recordNight({ ...game.stats, time: game.time }, { won: false, cause: game.player && !game.player.alive ? game.cause : null }, started);
      atlas.refreshBadge();
    } catch (e) {
      console.warn('[atlas] could not record the night', e);
    }
  }
  if (game) {
    for (const m of game.monsters) m.dispose();
    game.monsters = [];
    game.state = 'idle';
    game.objectives.silence();
    game.escape.silence();
    game.cabinets.silence();
    game.inventory.close(false);
    game.fieldView.reset();
    game.voiceMimic.clear();
    game.tools.silence(true);
    game.expedition.silence();
    game.flares.clear();
    game.selfBody.hide();
    game.beyond.hide();
    audio.setMorning(false);
    game.inputMuted = false;
    if (game.online) game.teardownOnline();
    game.setupSolo();
  }
  runOnline = false;
  if (wasOnline || coop.active) {
    if (keepRoom && coop.active) coop.leaveRun();
    else coop.leave();
  }
  mates.clear();
  document.body.classList.remove('coop', 'coop-over', 'coop-guest', 'spectating', 'cutscene', 'in-car', 'holding', 'qte', 'beyond-on');
  shared.uDawn.value = 0;
  shared.uMorning.value = 0;
  pulses.clear();
  ghosts.clear();
  eyes.clear();
  particles.clear();
  input.exitLock();
  audio.setPaused(false);
  audio.resetFx();
  audio.setAmbience(0, 0);
  hud.show(false);
  hud.setIntro(null);
  hud.setHint(null);
  state = 'menu';
  setBodyState();
  menus.only('menu');
  menus.renderScores();
  updateMicUI();
  post.u.uFade.value = 0;
  if (keepRoom && coop.active) lobby.open();
  else home.enter();
  lobby.menuLabel();
  cloud.presenceChanged();cloud.safePoint();
}

function teamSummary() {
  const me = coop.me();
  const out = [{ name: game.roomRules.hideNames ? game.nameOf({slot: me?.slot||0}) : myName(), color: PLAYER_COLORS[me ? me.slot % 4 : 0], alive: game.player.alive, score: game.score, self: true, slot: me ? me.slot : 0 }];
  for (const r of game.remotes.values()) out.push({ name: game.nameOf(r), color: r.color, alive: r.alive, score: r.score, slot: r.slot });
  return out.sort((a, b) => a.slot - b.slot);
}

function onEnd(res) {
  const online = runOnline;
  const stats = {
    ...game.stats,
    gens: game.objectives.count,
    carParts: game.escape.count,
    time: game.time,
    score: game.score,
    loudestDb: -100,
  };
  const team = online ? teamSummary() : null;
  // the purse: what the night brought in (getting away pays too)
  let escBonus = 0;
  if (res.won && game.player.alive) {
    escBonus = EARN.escape;
    game.earnShards(escBonus);
  }
  stats.earned = game.stats.earned | 0;
  stats.escBonus = escBonus;
  endRewards({reason:'end',won:res.won,time:stats.time,score:stats.score,gens:stats.gens});
  try {
    const started = game.objectives.gens.filter((g) => g.running).map((g) => ({ k: g.k, site: g.site && g.site.id }));
    recordNight(stats, res, started);
    atlas.refreshBadge();
  } catch (e) {
    console.warn('[atlas] could not record the night', e);
  }
  const { rank, list } = submitScore({ name: settings.name || '???', score: game.score, time: stats.time, won: res.won, shards: stats.shards, gens: stats.gens, coop: online ? Math.max(team.length, game.teamSize || 1) : 0 });
  game.inventory.close(false);
  game.fieldView.reset();
  game.voiceMimic.clear();
  game.tools.silence(true); // stop lures and discard this night's recorded voice
  game.expedition.silence();
  game.flares.clear(); // (a burning flare would hiss on behind the end screen)
  menus.showOver(res, stats, rank, list, team);
  overReward={earned:stats.earned,escBonus};renderOverWallet();
  menus.renderScores();
  if (online) {
    coop.endRun();
    game.teardownOnline();
    game.inputMuted = false;
    document.body.classList.add('coop-over');
    document.body.classList.toggle('coop-guest', !coop.isHost || !coop.active);
    $('restartHint').textContent = coop.isHost && coop.active ? t('restartHint') : t('coopRestartHint');
  } else {
    document.body.classList.remove('coop-over', 'coop-guest');
    $('restartHint').textContent = t('restartHint');
  }
  document.body.classList.remove('spectating');
  mates.clear();
  state = 'over';
  cloud.presenceChanged();
  overAt = performance.now();
  setBodyState();
  input.exitLock();
  hud.show(false);
  menus.only('over');
}

// ---------------- global input ----------------
function handleEvents(events) {
  for (const e of events) {
    switch (e) {
      case 'bag':
        if (state === 'playing') game.inventory.toggle();
        break;
      case 'pause':
        if(state==='playing'&&game?.partMap?.active){game.partMap.fold(true);break;}
        if (state === 'playing' && game?.inventory.opened) { game.inventory.close(); break; }
        if(account.isOpen())account.close();
        else if (atlas.isOpen()) atlas.close();
        else if (wardrobe.isOpen()) wardrobe.close();
        else if (lobby.rulesOpen) lobby.closeRules();
        else if (lobby.isOpen()) {
          if (!lobby.starting) lobby.close();
        } else if (menus.isOpen('settingsPanel')) menus.closeSettings();
        else if (menus.isOpen('howPanel')) menus.show('howPanel', false);
        else if (menus.isOpen('scoresPanel')) menus.show('scoresPanel', false);
        else if (state === 'menu' && !news.st.folded) news.setFolded(true);
        else if (state === 'playing') pause();
        else if (state === 'paused') resume();
        break;
      case 'unlock':
        if (game?.inventory.active) break; // intentionally unlocked to reach into the backpack
        if (state === 'playing' && !input.touch) pause();
        break;
      case 'blur':
        if (state === 'playing' && !input.touch) pause();
        break;
      case 'restart':
        if (state === 'over' || (state === 'paused' && !runOnline)) restartRun();
        break;
      case 'confirm':
        if (account.isOpen() || atlas.isOpen() || wardrobe.isOpen() || menus.isOpen('settingsPanel') || menus.isOpen('howPanel') || menus.isOpen('scoresPanel') || lobby.isOpen()) break;
        if (state === 'over') restartRun();
        else if (state === 'menu') startRun();
        else if (state === 'paused') resume();
        break;
      case 'mic':
        toggleMic();
        break;
      case 'peek':
        if (state === 'playing') input.peekTouchUntil = performance.now() < input.peekTouchUntil ? 0 : performance.now() + 5000;
        break;
    }
  }
}
document.addEventListener('visibilitychange', () => {
  // solo: hiding the tab pauses. co-op: the night goes on (see the background tick below)
  if (document.hidden && state === 'playing' && !runOnline) pause();
});

// ---------------- main loop ----------------
let lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  step(now, true);
}

// browsers stop requestAnimationFrame in hidden tabs. In co-op the host's tab runs the monsters for
// everyone (and a guest still has to answer), so a hidden co-op tab keeps stepping without drawing.
setInterval(() => {
  if (document.hidden && runOnline && (state === 'playing' || state === 'paused')) step(performance.now(), false);
}, 50);

function step(now, render) {
  let rawDt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (!(rawDt > 0)) rawDt = 1 / 60;
  if (rawDt > 0.1) rawDt = 0.1;
  const atlasOpen = atlas.isOpen();
  const wardrobeOpen = !atlasOpen && wardrobe.isOpen();
  if (!atlasOpen && !wardrobeOpen) perfTick(rawDt);

  const look = input.poll();
  const events = input.consume();
  if (state === 'boot') return;
  handleEvents(events);

  const garageOn = state === 'menu' && !atlasOpen && !wardrobeOpen && !!garage;
  home.setActive(state==='menu'&&!atlasOpen&&!wardrobeOpen&&!lobby.isOpen()&&!['settingsPanel','howPanel','scoresPanel'].some(id=>menus.isOpen(id))&&!micCal.isOpen()&&!account.isOpen());
  if (state === 'menu') {
    if (garageOn) {if(!lobby.isOpen())home.enter();updateGarage(rawDt);}
    else if(atlasOpen||wardrobeOpen) {
      if(mic.state==='on'){const ev=mic.update(rawDt,audio.outputDb());if(ev.pulse>0&&!micCal.isOpen()){if(atlasOpen)atlas.ping();else wardrobe.ping();}}
    } else updateAttract(rawDt);
  } else if (state === 'playing' || (state === 'paused' && runOnline && game && game.state !== 'over')) {
    const dt = Math.min(rawDt, 0.05) * (runOnline ? 1 : game.fx.timeScale) * DEBUG.speed;
    game.update(dt, state === 'paused' ? { look: { dx: 0, dy: 0 }, events: [] } : { look, events });
    if (!render && state !== 'over') {
      game.applyView(camera, now / 1000);
      return;
    }
    if (state === 'playing' || state === 'paused') {
      shared.uTime.value = game.time;
      ghosts.update(game.time);
      eyes.update(game.time, pixScale());
      particles.update(dt, pixScale());
      game.applyView(camera, now / 1000);
      shared.uCam.value.copy(camera.position);
      game.hudUpdate(rawDt);
      if (runOnline) mates.update(game, camera, false);
      if (state === 'paused' && runOnline) {
        pauseVoices.tick();
        perf.voicesT = (perf.voicesT || 0) + rawDt;
        if (perf.voicesT > 0.25) {
          perf.voicesT = 0;
          renderPauseVoices(); // someone died or dropped while you were in the menu
        }
      }
      // pointer-lock hint (or drag-to-look hint when the browser/iframe refuses pointer lock)
      let lockMsg = '';
      if (!input.touch && (game.state === 'play' || game.state === 'morning') && !input.locked) {
        if (!input.lockFailed) lockMsg = t('clickToLook');
        else {
          if (!perf.dragHintAt) perf.dragHintAt = now;
          if (now - perf.dragHintAt < 7000) lockMsg = t('dragToLook');
        }
      }
      const lh = $('lockHint');
      if (lh.textContent !== lockMsg && lockMsg) lh.textContent = lockMsg;
      document.body.classList.toggle('needlock', !!lockMsg);
      document.body.classList.toggle('crouching', input.crouch);
    }
  } else if (state === 'over' && game && game.state === 'won') {
    // behind the results: the УАЗ's taillights going away down the highway (or, the old way, the morning forest)
    game.afterWon(rawDt, camera, now / 1000);
    shared.uTime.value = game.time;
    ghosts.update(game.time);
    eyes.update(game.time, pixScale());
    particles.update(rawDt, pixScale());
    shared.uCam.value.copy(camera.position);
  }
  if (state !== 'playing') document.body.classList.remove('needlock');
  if (!render) return;
  if (atlasOpen) {
    atlas.frame(rawDt);
    return;
  }
  if (wardrobeOpen) {
    wardrobe.frame(rawDt);
    return;
  }
  if (garageOn) {
    if(account.isOpen())return;
    garage.frame(rawDt);
    if(lobby.isOpen())lobby.place(garage.anchors());else home.place();
    return;
  }

  if(state==='menu')home.place(); // includes the book's 2D-cover fallback if the garage could not initialise
  sky.position.copy(camera.position);
  motes.material.uniforms.uPix.value = 9 * (post.h / 900);
  post.u.uTime.value = now / 1000;
  renderer.info.reset();
  shadows.update(camera);
  post.render(scene, camera);
  if (state === 'menu' && !MENU_COVERS.some((id) => menus.isOpen(id))) wardrobe.menuFrame(rawDt);
}

// ---------------- boot ----------------
function boot() {
  applyQuality();
  applyRadar();
  requestAnimationFrame(frame);
  // let the boot screen paint before the heavy generation
  setTimeout(() => {
    try {
      world.generate();
    } catch (e) {
      $('bootText').textContent = 'world generation failed: ' + e.message;
      throw e;
    }
    for (const g of world.occluders) shadows.addStatic(g);
    game = new Game({ scene, camera, world, pulses, ghosts, eyes, particles, audio, mic, input, hud, radar, post, shadows });
    game.onEnd = onEnd;
    setupAttract();
    wardrobe.init(); // the live survivor now belongs to the shared garage scene
    // warm up shaders so the first ping doesn't hitch
    renderer.compile(scene, camera);
    if (DEBUG.fps) {
      perf.fpsEl = document.createElement('div');
      perf.fpsEl.style.cssText = 'position:fixed;right:8px;top:64px;z-index:99;font:11px JetBrains Mono,monospace;color:#8ef0ff;opacity:.8;pointer-events:none';
      document.body.appendChild(perf.fpsEl);
    }
    window.__hush = { world, game, shared, pulses, ghosts, eyes, renderer, perf, mic, audio, input, hud, post, shadows, coop, lobby, atlas, wardrobe, micCal, news, home, debug: DEBUG, startRun, pause, resume, toMenu, ensureGarage, cloud, account, social, notifications, get garage() { return garage; }, get state() { return state; } };
    state = 'menu';
    menuTime = 0;
    post.u.uFade.value = 0;
    menus.only('menu');
    home.enter();
    updateMicUI();
    if (DEBUG.autostart) startRun();
    if (params.has('sfx')) import('./ui/sfxtest.js').then((m) => m.mountSfxPanel(audio));
    lobby.menuLabel();
    cloud.start();social.update();syncIdentityFields();
    setTimeout(() => {
      if (state === 'menu' && ensureGarage()) {
        try { renderer.compile(garage.scene, garage.camera); } catch { /* it'll compile on first draw */ }
      }
    }, 1200);
    // an invite link (?room=CODE): straight into your friend's room
    const room = cleanCode(params.get('room'));
    if (room.length >= 4) {
      lobby.open();
      coop.join(room).catch((e) => console.warn('[coop] join failed', e)).finally(() => lobby.render());
    }
  }, 60);
}
boot();
