import './backpack.css';
// ТИШЕ / HUSH — entry point: renderer, boot, menu attract mode, state machine, main loop.
import '@fontsource/rubik-wet-paint/cyrillic-400.css';
import '@fontsource/rubik-wet-paint/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './style.css';
import './profile.css'; // 3.0x: the full-screen profile
import './garage-home.css';
import './screen-editor.css';
import './cloud.css';
import './social.css';

import * as THREE from 'three';
import { CFG, fovFor } from './core/config.js';
import { settings, saveSettings, submitScore, recordNight } from './core/storage.js';
import { setLang, t } from './core/i18n.js';
import { World } from './world/world.js';
import { shared, createWorldMaterial, createMotes, createSky } from './render/sonar.js';
import { Pulses } from './render/pulses.js';
import { Post } from './render/post.js';
import { qualityPlan } from './render/quality.js';
import { effectiveGraphics } from './render/graphicsSettings.js';
import './graphics.css';
import { OmniShadows } from './render/shadows.js';
import { cleanMap, runUrl, needsReload } from './core/maps.js'; // 3.0g: the two участка and how the menu switches
import { mapOpen } from './core/mapUnlock.js'; // 3.0s: the bog is earned on the forestry
import { Ghosts } from './render/ghosts.js';
import { Eyes } from './render/eyes.js';
import { Particles } from './render/particles.js';
import { audio, latencyFor } from './audio/audio.js';
import { MenuMusic } from './audio/music.js';
import { mic, Mic } from './audio/mic.js';
import { Input } from './input/input.js';
import { HUD, fmtTime, fmtScore } from './ui/hud.js';
import { Radar } from './ui/radar.js';
import { Menus } from './ui/menus.js';
import { installDesktopUpdate } from './ui/desktopUpdate.js'; // 3.0m: the exe keeps itself current
import { Game } from './game/game.js';
import { buildListener } from './game/monsters.js';
import { PLAYER_COLORS } from './game/remote.js';
import { EARN, wallet, onWallet, pendingRewards } from './game/wallet.js';
import { Highlights, HL_CAPTURE } from './game/highlights.js';
import { Reel } from './ui/reel.js';
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
import { ProfileScreen, myCard } from './ui/profile.js'; // 3.0x
import { KeysPanel } from './ui/keysPanel.js'; // 3.0y
import { QuickWheel } from './ui/quickWheel.js'; // 3.1c: hold the backpack key, point, let go

setLang(settings.lang);

const params = new URLSearchParams(location.search);
const DEBUG = {
  t: parseFloat(params.get('t')) || 0,
  speed: parseFloat(params.get('speed')) || 1,
  autostart: params.has('autostart'),
  perfGraph: params.has('perf'), // (3.0w) a frame-time strip: which frames are long, and what happened in them
  range: params.has('range'), // (3.0u) a reload that was on its way to the training ground: play its film, not a shift
  night: params.has('night'), // skip the morning
  nointro: params.has('nointro'), // ...and the opening cut scene
  seats: parseInt(params.get('seats'), 10) || 0, // preview a lobby's four goodnights alone
  nomic: params.has('nomic'),
  fps: params.has('fps'),
  map: params.get('map') || '', // ?map=bog: walk the peat bog (3.0: the second участок)
  days: +params.get('days') || 0, // ?days=2|4|6: the shift length a pick in the menu asked for
  shelter: params.has('shelter'), // (3.0q) start on the peat works' camp with the cap unlocked: the shelter, without five pumps
  unlock: params.has('unlock') || params.has('shelter'), // (3.0s) the bog without a forest win: for the harness and for testing a build
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
const world = new World(scene, worldMat, DEBUG.map === 'bog' || DEBUG.shelter ? 'bog' : 'forest'); // (3.0q: the shelter is on the bog)
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
// Phones and tablets live in touch mode from the first frame: no pointer-lock prompt on a device with no
// mouse, and the look stick, hands, echo and SKIP button are already where they belong.
// (A touchscreen laptop keeps its mouse: the primary pointer is fine there, so this does not fire.)
if (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) input.setTouch(true);
const coop = new Coop({ audio, mic });
const mates = new Mates($('mates'));
const voiceMix = new VoiceMix(audio); // your volume for each friend's voice
const menuMusic = new MenuMusic(); // the record under the main menu (its own volume setting)

// (3.1g) the sound card's buffer: small for a quick echo, larger for Bluetooth headphones (see audio.js latencyFor).
// Decided before the first click creates the AudioContext; device names are there once the mic was ever allowed.
async function pickAudioBuffer() {
  let label = '';
  try {
    if (settings.audioBuffer === 'auto' && navigator.mediaDevices?.enumerateDevices) {
      const outs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audiooutput');
      label = (outs.find((d) => d.deviceId === 'default') || outs[0])?.label || '';
    }
  } catch { /* no device list: the small buffer */ }
  audio.latencyHint = latencyFor(settings.audioBuffer, label);
}
pickAudioBuffer();
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
const MENU_COVERS = ['settingsPanel', 'howPanel', 'scoresPanel', 'soloPanel', 'coopPanel'];
let game = null;
const quickWheel = new QuickWheel({ getGame: () => game, input }); // (3.1c)
let runOnline = false; // the current / last run is a co-op night

let state = 'boot'; // boot | menu | playing | paused | over
let overAt = 0;
let menuTime = 0;
const perf = { acc: 0, n: 0, scale: 1, cool: 3, ceiling: 9, ceilT: 0, fpsEl: null, fps: 60 };

// ---------------- resolution ----------------
// 2.1m: restore detail without restoring HDR MSAA. High uses a fixed high-resolution scene;
// auto (or an explicit custom override) trades pixels for frame time. Bound both the scene and the output canvas by pixel/GL limits.
const maxTargetSize = Math.min(renderer.capabilities.maxTextureSize,
  renderer.getContext().getParameter(renderer.getContext().MAX_RENDERBUFFER_SIZE));
function renderPlan() {
  return qualityPlan(settings.quality, innerWidth, innerHeight, window.devicePixelRatio, maxTargetSize, !!perf.recovery, settings.graphics);
}
function scaleBounds() {
  const p = renderPlan();
  return [p.minScale, p.maxScale];
}
function applyAntialias() {
  post.setAntialias(renderPlan().fxaa);
}
function applyGraphics() {
  const g = effectiveGraphics(settings.graphics);
  post.setGraphics(settings.graphics);
  shadows.enabled = g.shadows;
  if ((g.showFPS || DEBUG.fps) && !perf.fpsEl) {
    perf.fpsEl = document.createElement('div');
    perf.fpsEl.className = 'graphics-fps';
    document.body.appendChild(perf.fpsEl);
  }
  if (perf.fpsEl) perf.fpsEl.hidden = !(g.showFPS || DEBUG.fps);
}
function applyQuality() {
  perf.recovery = false; // an explicit preset choice retries full quality after a context fallback
  const p = renderPlan();
  perf.scale = p.adaptive ? Math.min(1, p.maxScale) : p.maxScale;
  perf.ceiling = 9; // a new preset starts with a clean slate (no ceiling from the old one)
  perf.ceilT = 0;
  perf.cool = 3;
  perf.slow = 0;
  applyAntialias();
  applyGraphics();
  resize();
}
function resize() {
  perf.resizedAt = perf.frameNo; // (3.0w: the ?perf strip marks the frames that paid for a resize)
  const w = innerWidth, h = innerHeight;
  const p = renderPlan();
  perf.scale = Math.min(p.maxScale, Math.max(p.minScale, perf.scale));
  // Dynamic scene scaling must not reallocate the default framebuffer on every adjustment.
  if (perf.outputW !== w || perf.outputH !== h || perf.outputScale !== p.outputScale) {
    renderer.setPixelRatio(p.outputScale);
    renderer.setSize(w, h, false);
    perf.outputW = w; perf.outputH = h; perf.outputScale = p.outputScale;
  }
  camera.aspect = w / h;
  camera.fov = fovFor(camera.aspect);
  camera.updateProjectionMatrix();
  post.setSize(w, h, perf.scale);
  applyAntialias();
  radar.resize();
  if (garage) garage.resize(w, h);
}
window.addEventListener('resize', resize);
// A context loss is a real fallback, not a reason to lower quality on every healthy machine.
// Keep that fallback through restoration; only an explicit quality choice retries the larger buffers.
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  post.dropSamples();
  perf.recovery = true;
});
canvas.addEventListener('webglcontextrestored', () => {
  resize();
});

function pixScale() {
  return post.h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
}

function perfTick(dt) {
  perf.acc += dt;
  perf.n++;
  perf.cool -= dt;
  perf.ceilT -= dt;
  perf.slow = perf.slow || 0;
  if (perf.ceilT <= 0) perf.ceiling = 9;
  if (perf.acc < 1) return;
  const avg = perf.acc / perf.n;
  perf.acc = 0;
  perf.n = 0;
  // Preset high stays fixed. Only auto or explicit custom adaptation may reduce detail.
  if (renderPlan().adaptive && (state === 'playing' || state === 'menu')) {
    const [lo, hi] = scaleBounds();
    const target = renderPlan().targetFPS;
    const slow = avg > 1 / (target * 5 / 6);
    const awful = avg > 1 / (target * 35 / 60);
    perf.slow = slow ? perf.slow + 1 : 0;
    // (3.0v) every step of the scale is a resize of the targets — a hitch you feel as a jerk. Under a lamp the frame
    // rate sits right on the line, and one slow second at a time the scale went down, up after 5 s, down again…
    // Now: two slow seconds in a row (or one awful one) before a step down, and a step down holds for a minute
    if (slow && (perf.slow >= 2 || awful) && perf.scale > lo + 0.001) {
      perf.ceiling = perf.scale - 0.05;
      perf.ceilT = 60;
      // a device far from the adaptive target takes a bigger first step, so the first seconds on a weak phone
      // stop stuttering instead of walking down one notch per second
      perf.scale = Math.max(lo, perf.scale - (awful ? 0.2 : 0.12));
      perf.cool = 6;
      perf.slow = 0;
      resize();
    } else if (avg < 1 / (target * .95) && perf.scale < Math.min(hi, perf.ceiling) - 0.001 && perf.cool <= 0) {
      perf.scale = Math.min(hi, perf.ceiling, perf.scale + 0.06);
      perf.cool = 8;
      perf.slow = 0;
      resize();
    }
  }
}
// Count actual drawn frames against wall time, not the clamped simulation delta or hidden co-op ticks.
function measureFPS(now) {
  if (!perf.sampleT) { perf.sampleT = now; perf.sampleFrames = 0; return; }
  perf.sampleFrames++;
  const elapsed = now - perf.sampleT;
  if (elapsed < 1000) return;
  perf.fps = perf.sampleFrames * 1000 / elapsed;
  perf.measured = true;
  perf.sampleT = now; perf.sampleFrames = 0;
  if (perf.fpsEl) perf.fpsEl.textContent = `${perf.fps.toFixed(0)} fps · ${post.w}×${post.h} · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris`;
}
document.addEventListener('visibilitychange', () => { perf.sampleT = 0; perf.measured = false; });

// ---------------- menus ----------------
installDesktopUpdate(); // (no-op in a browser: it needs the desktop shell's bridge)

let keysPanel = null; // (3.0y) the settings' key rebinding (built below, once the input and the audio exist)
const menus = new Menus({
  unlockAll: () => DEBUG.unlock,
  graphicsStats: () => ({ w: post.w, h: post.h, ow: canvas.width, oh: canvas.height, fps: perf.measured ? perf.fps : 0, fxaa: post.u.uAA.value }),
  onPlay: () => startSoloShift(), // (3.0u: through the garage — you get in, the car drives out)
  onResume: () => resume(),
  onRestart: () => restartRun(),
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
    if (key === 'volume') { audio.setVolume(settings.volume); menuMusic.applyVolume(); }
    if (key === 'music') menuMusic.applyVolume();
    if (key === 'voiceEcho') mic.setEcho(settings.voiceEcho);
    if (key === 'micEnabled') {
      if (!settings.micEnabled && mic.state === 'on') mic.stop();
      if (settings.micEnabled && mic.state !== 'on') {
        audio.init();
        mic.start(audio).then(micChanged);
      }
      micChanged();
    }
    if (key === 'quality' || key?.startsWith('graphics:') && key !== 'graphics:effects') applyQuality();
    if (key === 'graphics:effects') applyGraphics();
    if (key === 'radar') applyRadar();
    if (key === 'audioBuffer') { pickAudioBuffer(); $('sAudioBufNote').hidden = !audio.ctx; } // (3.1g) a running context keeps its buffer
    if (key === 'lang' || key === undefined) {
      hud.cache = {};
      atlas.applyI18n();
      wardrobe.applyI18n();
      reel.applyI18n();
      keysPanel?.refresh(); // (3.0y: the key names in the new language)
      news.render();
      account.render();social.update();syncIdentityFields();
      updateMicUI();
      lobby.render();
      $('lockHint').textContent = input.lockFailed ? t('dragToLook') : t(input.lockHint() || 'clickToLook');
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
  // (3.0x) a name in the room's list: your own profile, a friend's (by their cloud id), or a stranger's card
  onProfile: (peer) => { const r = coop.roster.get(peer); if (!r) return; if (r.self) profile.open({ self: true }); else profile.open({ id: r.uid, name: r.name }); },
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
// 2.1u: the shift's highlight reel — the director watches for the stupid moments, the reel plays them back
const highlights = new Highlights();
const reel = new Reel({ audio });
let reelAutoT = 0, overTouched = false; // (a reel opens by itself once, unless you are already clicking things)
$('over').addEventListener('pointerdown', () => { overTouched = true; });
$('btnReel').addEventListener('click', () => {
  if (!audio.ready) audio.init();
  audio.uiClick();
  reel.open(highlights.list());
});
const home=new GarageHome({ensureGarage,atlas,onWardrobe:()=>wardrobe.open()});
// No account gate on play, and no cloud request in the frame loop.
const canApplyAccount=()=>state==='menu'&&!coop.active&&!lobby.starting&&!wardrobe.isOpen()&&!atlas.isOpen()&&!micCal.isOpen()&&!['settingsPanel','howPanel','scoresPanel','soloPanel'].some(id=>menus.isOpen(id));
const cloud=new CloudController({
 canApply:canApplyAccount,
 onApplied:()=>{setLang(settings.lang);menus.applyI18n();menus.loadSettingsForm();$('nameInput').value=settings.name;if(!coop.active)$('coopName').value=settings.name;atlas.applyI18n();atlas.refreshBadge();wardrobe.applyI18n();news.render();audio.setVolume(settings.volume);menuMusic.applyVolume();mic.setEcho(settings.voiceEcho);updateMicUI();lobby.menuLabel();if(garage?.view==='menu'){const f=myFit();garage.setCar(f.car,f.cc);garage.studio.setFit(f);}syncIdentityFields();account?.render();social.update();},
 getPresence:()=>{const room=coop.active&&!coop.inRun&&coop.phase==='lobby'?coop.code:null;return{state:['playing','paused'].includes(state)?'playing':room?'lobby':'online',room,strategy:coop.signalling?.only||'default'};},
 onNotice:notice=>notifications.push(notice)
});
setIdentityProvider(()=>{const owner=getScope(),p=cloud.profile?.id===owner?cloud.profile:isAccountScope(owner)?readJSON('hush.cloud-profile.v1',null,owner):null;if(p?.id===owner||owner==='guest'&&cloud.user&&cloud.profile)return{locked:true,name:p?.display_name||cloud.profile.display_name};return null;});
function syncIdentityFields(){const p=currentIdentity();for(const id of['nameInput','coopName']){const input=$(id);input.readOnly=!!p?.locked;input.title=p?.locked?socialWords().locked:'';if(p?.locked)input.value=p.name;}}
const account=new AccountUI({cloud,canOpen:()=>state==='menu'&&!wardrobe.isOpen()&&!atlas.isOpen()&&!micCal.isOpen()&&!lobby.rulesOpen&&!lobby.starting,canChange:canApplyAccount,getRoom:()=>coop.active&&!coop.inRun?coop.code:null,getInviteLink:()=>coop.active?coop.inviteLink():null,onJoin:async room=>{
 if(state!=='menu'||lobby.starting)throw new Error('leave_room');account.close();lobby.open();if(coop.active&&coop.code===room.room_code)return;await coop.join(room.room_code,{strategy:room.strategy});lobby.render();
}});
// (3.0y) rebinding keys, in the settings, above «back»
const keysHost=document.createElement('div');keysHost.className='keys-host';$('btnSettingsBack').before(keysHost); // (3.1e: hidden with the basic settings while advanced graphics is open)
keysPanel=new KeysPanel({host:keysHost,input,uiSound:(k)=>{if(audio.ready)audio.uiClick();}});
$('btnSettingsBack').addEventListener('click',()=>keysPanel.refresh());
const portraitOf=(fit,canvas)=>{if(!wardrobe.mq)return false;wardrobe.mq.still(fit,'head',canvas);return true;};
// (3.0x) the full-screen profile: from your portrait or name in the corner, a friend's name, a name in the lobby
const profile=new ProfileScreen({cloud,portrait:portraitOf,canOpen:()=>state==='menu'&&!wardrobe.isOpen()&&!atlas.isOpen()&&!lobby.starting,
 onAccount:()=>account.open('profile'),onJoin:(id)=>account.action('joinFriend',id),
 onInvite:Object.assign((id)=>cloud.invite(id),{available:()=>coop.active&&!!coop.code&&!coop.inRun})});
account.onNav=()=>profile.open({self:true});
account.onProfile=(id,name)=>profile.open(id===cloud.user?.id?{self:true}:{id,name});
const social=new SocialDock({cloud,account,portrait:portraitOf,onProfile:(id,name)=>profile.open(id?{id,name}:{self:true})});
// (3.0x) your card for your friends' view of you: published when the cloud is ready and after every shift — only when it changed
let cardKey='',cardTimer=0;
function publishCard(){clearTimeout(cardTimer);cardTimer=setTimeout(()=>{if(!cloud.user||!cloud.ready)return;const card=myCard(),key=JSON.stringify({...card,at:0});if(key===cardKey)return;cloud.publishCard(card).then(()=>{cardKey=key;}).catch(()=>{});},1500);}
cloud.on(()=>{const uid=cloud.user?.id||null;if(coop.uid!==uid){coop.uid=uid;if(coop.active)coop.announce();}if(cloud.ready)publishCard();});
const notifications=new SocialToasts({cloud,account});
lobby.onInvite=()=>account.open('invite');
cloud.on(()=>syncIdentityFields());
let overReward=null;
// the way into the reel, on the results screen: a count when there is something to see
function paintReelButton() {
  const btn = $('btnReel');
  if (!btn) return;
  const n = highlights.count;
  const count = $('reelCount');
  if (count) count.textContent = n ? String(n) : '';
  btn.classList.toggle('dim', !n);
  btn.title = n ? t('hlOpenHint').replace('{n}', n) : t('hlEmpty');
}

function renderOverWallet(){const el=$('overWallet');if(!el||!overReward)return;const{earned,escBonus}=overReward;el.textContent=earned>0?t('walletNight').replace('{n}',earned).replace('{escape}',escBonus?t('walletEscape').replace('{n}',escBonus):'').replace('{total}',wallet.shards):'';if(pendingRewards()>0)el.textContent+=' · '+cloudWords().pending;}
onWallet(()=>{if(state==='over')renderOverWallet();});cloud.on(()=>{if(state==='over')renderOverWallet();});

coop.on('change', () => {lobby.render();cloud.presenceChanged();cloud.safePoint();});
coop.on('start', (d) => beginCoopRun(d));
coop.on('mapRefused', () => { lobby.render(); if (audio.ready) audio.uiClick(); }); // (3.0s) someone said no to the bog
coop.on('mapLocked', () => lobby.render());
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
  // 3.0g: the host's участок is the room's. A guest standing somewhere else gets sent there (with the room code,
  // so it walks straight back into the lobby) rather than into a forest the others are not in
  const rmap = d.tr ? 'forest' : cleanMap(d.rules?.map || 'forest'); // (3.0u: the gates lead to the forest's range)
  if (needsReload(rmap, world.mapId)) {
    settings.shiftMap = rmap;
    saveSettings();
    const u = runUrl(rmap, d.rules?.days || settings.shiftDays);
    location.href = coop.code ? `${u}&room=${coop.code}` : u;
    return;
  }
  if (d.cut && state === 'menu' && ensureGarage()) {
    if (atlas.isOpen()) atlas.close();
    if (wardrobe.isOpen()) wardrobe.close();
    for (const id of ['settingsPanel', 'howPanel', 'scoresPanel', 'soloPanel']) menus.show(id, false);
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
$('btnStart').addEventListener('click', () => { audio.init(); menuMusic.retry(); });
// first interaction anywhere unlocks audio (browser autoplay policy) — and the menu's record
const unlockAudio = () => { audio.init(); menuMusic.retry(); };
window.addEventListener('pointerdown', unlockAudio, { capture: true });
window.addEventListener('keydown', unlockAudio, { capture: true });

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
  // 3.0g: the участок is a whole piece of ground, so it is decided before the shift starts — if the menu
  // picked the one that is not loaded, this is a reload with it in the URL (and the shift starts on arrival)
  // (3.0u) the training ground is the forest's, in daylight, whatever ground the shifts are played on: «ПОЛИГОН»
  // after a bog shift used to reload onto the bog with autostart — and start an ordinary night
  const toRange = !!(opts.training || opts.coop?.tr);
  let wantMap = toRange ? 'forest' : cleanMap(opts.map || opts.coop?.rules?.map || settings.shiftMap);
  // (3.0s) solo, the bog is earned on the forestry. A room's ground is the host's, and the players who have not
  // earned it agreed to it in the lobby (net/coop.js) — so only a solo shift is turned back to the forest here
  if (!opts.coop && !mapOpen(wantMap) && !DEBUG.unlock) wantMap = 'forest';
  if (needsReload(wantMap, world.mapId)) {
    if (!toRange) { settings.shiftMap = wantMap; saveSettings(); } // (the range does not change where you play shifts)
    location.href = runUrl(wantMap, opts.days || settings.shiftDays, '', { range: toRange && !opts.coop });
    return;
  }
  if (opts.coop?.rules?.map && needsReload(opts.coop.rules.map, world.mapId)) return; // (a friend on the bog, you in the forest)
  account.close();overReward=null;
  const online = !!opts.coop;
  const training = toRange; // the departure film's destination
  if (!online && state === 'over' && performance.now() - overAt < 450) return;
  if (!online && coop.active) coop.leave(); // a solo night: you leave the room
  clearTimeout(reelAutoT);
  highlights.reset(); // a shift, a new reel
  reel.close();
  if (!game.hl) game.hl = highlights;
  if (runOnline && game.online) game.teardownOnline();
  atlas.close(); // a co-op host can start the night while you're reading
  wardrobe.close(); // ...or trying on a hat
  audio.init();
  audio.setVolume(settings.volume);
  menuMusic.stop(); // the record is for the garage, not for the forest
  menus.only(null);
  menus.show('settingsPanel', false);
  menus.show('howPanel', false);
  menus.show('scoresPanel', false);
  menus.show('soloPanel', false);
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
    game.reset({ seed: opts.coop.seed, slot: me ? me.slot : 0, online: true, training, days: opts.coop.rules?.days });
    game.setupOnline(coop, opts.coop.players);
  } else {
    game.setupSolo();
    game.opening.forceSeats = DEBUG.seats;
    game.reset({ training, days: DEBUG.days || settings.shiftDays });
    if (DEBUG.night || DEBUG.nointro || DEBUG.t > 0 || DEBUG.shelter) game.startNight();
    if (DEBUG.t > 0) {
      game.time = DEBUG.t;
      game.firstPingT = Math.max(0, DEBUG.t - 30);
      game.tut.done = true;
    }
    // (3.0q) ?shelter: the camp on the mains and the cap unlocked, you standing in front of it. What is down
    // there still has to be walked, and the breaker still has to be thrown by hand.
    if (DEBUG.shelter) {
      game.tut.done = true;
      try {
        game.bunker.onPower(); // the camps have power: the cap's lock lets go (the pumps are not needed for this)
        game.bunker.unlock();
        const H = game.world.bunker && game.world.bunker.hatch;
        if (H) {
          const p2 = game.player;
          p2.x = H.x;
          p2.z = H.z - H.d / 2 - 1.8;
          p2.y = game.world.terrain.height(p2.x, p2.z) + 0.08;
          p2.yaw = Math.PI; // facing the cap
        }
      } catch (e) {
        console.warn('[shelter] debug start failed', e);
      }
    }
  }
  beginRewards();
  state = 'playing';
  cloud.presenceChanged();
  setBodyState();
  post.u.uFade.value = 1;
  if (!input.touch) input.requestLock();
  audio.startAmbience();
  audio.prefetchMeadow(); // the corpses' meadow is fetched before you reach the first one
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
// the menu's «ПОЛИГОН»: the same departure film, played alone — you get in, the gates, the engine, gone
function startTrainingSolo() {
  if (state !== 'menu') return;
  // (3.0u) the range is the forest's: from the bog, go there first (the film plays once, on arrival)
  if (world.mapId !== 'forest') { location.href = runUrl('forest', settings.shiftDays, '', { range: true }); return; }
  playGarageFilm(() => startRun({ training: true }));
}

// (3.0u) a solo shift starts in the garage too: you get into the car and it drives out through the gates, and the
// shift's own opening (the УАЗ at the flooded проезд, the camp) picks it up from there. Debug jumps skip it.
function startSoloShift() {
  if (state !== 'menu' || DEBUG.nointro || DEBUG.night || DEBUG.t > 0 || DEBUG.shelter) { startRun(); return; }
  playGarageFilm(() => startRun());
}

// the garage's departure film, alone: then `done`
function playGarageFilm(done) {
  // (3.0v) the mouse is taken now, while the click that started this still counts as one: asked for after the film,
  // the browser refuses (no gesture), and you used to land in the night with a «click to look» hint
  if (!input.touch) input.requestLock(true);
  if (!garage && !ensureGarage()) { done(); return; }
  audio.init();
  audio.setVolume(settings.volume);
  menuMusic.stop();
  menus.only(null);
  home.leave();
  lobby.close();
  document.body.classList.add('cutscene');
  const finish = () => {
    document.body.classList.remove('cutscene');
    garage.close();
    done();
  };
  ensureSoloFig();
  garage.open('room');
  if (!garage.startDepart(finish)) finish();
}

// your figure at his door, for the solo film (the lobby keeps its own figures)
function ensureSoloFig() {
  if (!garage) return;
  if (!garage.figs[0]) garage.setPlayers([{ id: 'me', name: settings.name || '???', slot: 0, self: true, fit: myFit() }]);
  if (garage.figs[0]) garage.figs[0].appear = 1; // (already standing there when the film opens, not fading in on the jump)
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
    ? `${fmtTime(game.time)} · ${t(game.map === 'bog' ? 'pumps' : 'generators')} ${game.objectives.count}/5<br>${t('score')} ${fmtScore(game.score)} ×${game.mult.toFixed(1)}`
    : `${t('morningBig')}`;
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
  reel.close();
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
    // the range is packed up with the run: no bike left standing in the lobby, nobody left in the saddle
    if (game.training) {
      game.motos.dismount(true);
      game.motos.dispose();
      game.train?.end();
      game.train = null;
      game.training = false;
    }
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
  menuMusic.start();
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
  res = { map: game.map, ...res }; // (3.0s) which ground the shift was won on: the atlas opens the bog by it
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
    publishCard(); // (3.0x) the night is in the card friends see
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
  // the reel's last shot: how the night ended is a moment too
  const hlEnd = res.escaped ? (res.won ? 'escape' : 'left') : (res.won ? 'win' : 'death');
  highlights.note(hlEnd, { cause: res.cause });
  highlights.stop();
  menus.showOver(res, stats, rank, list, team); // (3.0r: res.map — the end screen speaks the ground's words)
  paintReelButton();
  // the night's own trailer: solo, a few moments to speak of, and you have not touched the results yet
  overTouched = false;
  clearTimeout(reelAutoT);
  if (!online && game && !game.training && highlights.count >= 3) {
    reelAutoT = setTimeout(() => {
      if (state === 'over' && !reel.isOpen && !overTouched) reel.open(highlights.list());
    }, 1700);
  }
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
        if (state === 'playing') quickWheel.press(); // (3.1c) a short press is the pack, a hold the quick wheel
        break;
      case 'pause':
        if (state === 'playing' && quickWheel.open) { quickWheel.close(); break; }
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
        else if (menus.isOpen('soloPanel')) menus.show('soloPanel', false);
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
        // the range has no "again": its one way out is ЗАВЕРШИТЬ ПОЛИГОН in the pause menu
        if (game?.training) break;
        if (state === 'over' || (state === 'paused' && !runOnline)) restartRun();
        break;
      case 'confirm':
        if (account.isOpen() || atlas.isOpen() || wardrobe.isOpen() || menus.isOpen('settingsPanel') || menus.isOpen('howPanel') || menus.isOpen('scoresPanel') || menus.isOpen('soloPanel') || lobby.isOpen()) break;
        if (game?.training) break;
        if (state === 'over') restartRun();
        else if (state === 'menu') menus.openSolo(); // Enter asks for the shift length first (2.1t)
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
  if (render && !document.hidden && state !== 'boot') measureFPS(now);
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
  if (state === 'playing' && game) quickWheel.frame(now); // (3.1c)
  else if (quickWheel.open || quickWheel.hold) quickWheel.close();

  const garageOn = state === 'menu' && !atlasOpen && !wardrobeOpen && !!garage;
  home.setActive(state==='menu'&&!atlasOpen&&!wardrobeOpen&&!lobby.isOpen()&&!['settingsPanel','howPanel','scoresPanel','soloPanel'].some(id=>menus.isOpen(id))&&!micCal.isOpen()&&!account.isOpen());
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
      if (!input.touch && (game.state === 'play' || game.state === 'morning' || game.state === 'training') && !input.locked) {
        if (!input.lockFailed) lockMsg = t(input.lockHint() || 'clickToLook'); // (3.1i) never «drag»: say why it won't lock
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
  game._bufferH = post.h; // (the fire's water beads size themselves in world metres)
  post.u.uTime.value = now / 1000;
  renderer.info.reset();
  shadows.update(camera);
  post.render(scene, camera);
  // 2.1u: the highlight director's eye — only while the night is actually running
  const grabsBefore = hlGrabs;
  if (state === 'playing' && game && game.state !== 'idle') highlights.update(game.time, highlightFrame);
  if (DEBUG.perfGraph) perfGraph(now, { faces: shadows.faces || 0, grab: hlGrabs !== grabsBefore, resized: perf.resizedAt === perf.frameNo, calls: renderer.info.render.calls });
  perf.frameNo = (perf.frameNo || 0) + 1;
  if (state === 'menu' && !MENU_COVERS.some((id) => menus.isOpen(id))) wardrobe.menuFrame(rawDt);
}

// ---------------- the highlight reel's eye (2.1u) ----------------
// A small JPEG of what is on screen right now. The director asks for one at ~10 a second.
// (Called right after post.render, in the same frame: the drawing buffer is still there.)
//
// (3.0w) It used to be drawImage(webglCanvas) into a 2D canvas, right here in the frame. That is a synchronous
// read of the GPU's picture: the CPU stops until the GPU has finished the frame, ten times a second — a hitch you
// feel as «micro-teleports» while walking, and the heavier the frame (under a lamp, in daylight) the longer each
// stop. Now createImageBitmap takes the snapshot without waiting for it, and the shrink and the JPEG happen later,
// off the frame. The old path stays only for a browser without createImageBitmap.
//
// (3.0z) createImageBitmap was not enough: on the author's machine (~185 fps) the ?perf strip still showed a
// 18–25 ms frame at every snapshot, «reel grab YES» on the worst one — the browser still copies the full-size
// WebGL canvas inside the frame to make the bitmap. Now the GPU draws the finished picture once more into a small
// target of its own (post.capture, ~640×360) and three's readRenderTargetPixelsAsync reads it through a pixel
// buffer and a fence: nothing in the frame waits for the GPU, and the canvas itself is never read. The flip
// (GL rows are bottom-up), the crop and the JPEG happen when the pixels arrive, between frames.
const HL_W = HL_CAPTURE.w, HL_H = HL_CAPTURE.h;
let hlGrabber = null, hlGrabs = 0;
function highlightFrame(t) {
  hlGrabs++;
  try {
    if (!hlGrabber) {
      const cv = document.createElement('canvas');
      cv.width = HL_W; cv.height = HL_H;
      const ctx = cv.getContext('2d', { alpha: false });
      if (!ctx) return null;
      hlGrabber = { cv, ctx, busy: 0, bufs: [], tmp: null, tctx: null };
    }
    const src = renderer.domElement;
    const { cv, ctx } = hlGrabber;
    const sw = src.width || 1, sh = src.height || 1;
    const k = Math.max(HL_W / sw, HL_H / sh); // cover: no black bars in the reel
    const w = sw * k, h = sh * k;
    const encode = () => new Promise((res) => {
      try { cv.toBlob((b) => res(b), 'image/jpeg', HL_CAPTURE.q); } catch { res(null); }
    });
    if (hlGrabber.busy > 3) return null; // (a slow encoder: skip a frame rather than queue them up)
    if (typeof renderer.readRenderTargetPixelsAsync === 'function') {
      const gw = Math.max(1, Math.round(w)), gh = Math.max(1, Math.round(h));
      const rt = post.capture(gw, gh);
      const size = gw * gh * 4;
      let buf = hlGrabber.bufs.pop();
      if (!buf || buf.length !== size) buf = new Uint8Array(size); // (a few reused buffers: no 1 MB of garbage a shot)
      hlGrabber.busy++;
      const blob = renderer.readRenderTargetPixelsAsync(rt, 0, 0, gw, gh, buf)
        .then((px) => {
          let { tmp, tctx } = hlGrabber;
          if (!tmp || tmp.width !== gw || tmp.height !== gh) {
            tmp = hlGrabber.tmp = document.createElement('canvas');
            tmp.width = gw; tmp.height = gh;
            tctx = hlGrabber.tctx = tmp.getContext('2d');
          }
          tctx.putImageData(new ImageData(new Uint8ClampedArray(px.buffer, px.byteOffset, size), gw, gh), 0, 0);
          hlGrabber.bufs.push(px);
          ctx.setTransform(1, 0, 0, -1, 0, HL_H); // (GL's rows run bottom-up)
          ctx.drawImage(tmp, (HL_W - gw) / 2, (HL_H - gh) / 2);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          return encode();
        })
        .catch(() => null)
        .finally(() => { hlGrabber.busy--; });
      return { t, blob };
    }
    if (typeof createImageBitmap === 'function') {
      hlGrabber.busy++;
      const blob = createImageBitmap(src, { resizeWidth: Math.max(1, Math.round(w)), resizeHeight: Math.max(1, Math.round(h)), resizeQuality: 'low' })
        .then((bmp) => {
          ctx.drawImage(bmp, (HL_W - w) / 2, (HL_H - h) / 2);
          bmp.close?.();
          return encode();
        })
        .catch(() => null)
        .finally(() => { hlGrabber.busy--; });
      return { t, blob };
    }
    ctx.drawImage(src, (HL_W - w) / 2, (HL_H - h) / 2, w, h);
    return { t, blob: encode() };
  } catch {
    return null; // (no canvas / a lost context: the reel simply has nothing to keep)
  }
}

// ---------------- ?perf (3.0w) ----------------
// A strip of the last 240 frame times in the corner (red: longer than 25 ms), how many long frames in the last
// ten seconds, and what the longest of them was doing: shadow faces redrawn, a resize, a reel snapshot, draw calls.
// For «it jerks on my machine»: a screenshot of this says which.
const PG = { n: 240, dt: new Float32Array(240), flags: [], i: 0, last: 0, el: null, ctx: null };
function perfGraph(now, info) {
  if (!PG.el) {
    PG.el = document.createElement('canvas');
    PG.el.width = 480; PG.el.height = 120;
    PG.el.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:300;width:480px;height:120px;background:rgba(0,0,0,.72);border:1px solid #445;pointer-events:none';
    document.body.appendChild(PG.el);
    PG.ctx = PG.el.getContext('2d');
  }
  const dt = PG.last ? now - PG.last : 16.7;
  PG.last = now;
  PG.dt[PG.i] = dt;
  PG.flags[PG.i] = { ...info, at: now };
  PG.i = (PG.i + 1) % PG.n;
  const c = PG.ctx;
  c.fillStyle = '#05070a'; c.fillRect(0, 0, 480, 120);
  c.fillStyle = '#334'; c.fillRect(0, 120 - 16.7 * 2, 480, 1); c.fillRect(0, 120 - 33.3 * 2, 480, 1); // 60 and 30 fps lines
  let worst = -1, wv = 0, long = 0, sum = 0;
  for (let k = 0; k < PG.n; k++) {
    const j = (PG.i + k) % PG.n, v = PG.dt[j];
    sum += v;
    if (v > 25) long++;
    if (v > wv) { wv = v; worst = j; }
    c.fillStyle = v > 25 ? '#e0473c' : v > 18 ? '#d8b26a' : '#7fa88a';
    const hgt = Math.min(118, v * 2);
    c.fillRect(k * 2, 120 - hgt, 2, hgt);
  }
  const f = PG.flags[(worst - 1 + PG.n) % PG.n] || {}; // (a long interval is paid for by the frame before it)
  c.fillStyle = '#d6cdc0'; c.font = '11px monospace';
  c.fillText(`avg ${(sum / PG.n).toFixed(1)} ms · long >25ms: ${long}/240 · worst ${wv.toFixed(0)} ms`, 6, 13);
  c.fillText(`worst frame: shadow faces ${f.faces ?? '-'} · reel grab ${f.grab ? 'YES' : 'no'} · resize ${f.resized ? 'YES' : 'no'} · calls ${f.calls ?? '-'}`, 6, 27);
}

// (3.0h) a failed boot says so, and offers the one ground that is known to build. Before this, any throw in the
// generation or in the menu's own setup left the sonar loader spinning on «лес растёт…» for ever.
function bootFailed(where, e) {
  console.error(`[boot] ${where} failed on ${world.mapId}`, e);
  const line = $('bootText');
  if (line) line.textContent = `${t('bootFailed')} ${world.mapId === 'bog' ? t('mapBog') : t('mapForest')} — ${e && e.message ? e.message : e}`;
  const retry = $('bootRetry');
  if (retry) {
    retry.hidden = false;
    retry.textContent = t('bootRetry');
    retry.onclick = () => { location.href = runUrl('forest', settings.shiftDays); }; // the forest always builds
  }
}

// ---------------- boot ----------------
function boot() {
  applyQuality();
  applyRadar();
  requestAnimationFrame(frame);
  // if the tables are still empty after 45 seconds, something is stuck rather than slow: say it
  setTimeout(() => {
    if (state === 'boot' || document.getElementById('boot')?.classList.contains('show')) {
      if (!game) bootFailed('timeout', new Error('45 s and still loading'));
    }
  }, 45000);
  // let the boot screen paint before the heavy generation
  setTimeout(() => {
    // (3.0h) everything that can fail on a given участок fails HERE, and says so. A throw used to leave the
    // boot screen spinning on «лес растёт…» for ever — which is what a broken map looked like from outside
    try {
      world.generate();
      for (const g of world.occluders) shadows.addStatic(g);
      game = new Game({ scene, camera, world, pulses, ghosts, eyes, particles, audio, mic, input, hud, radar, post, shadows, drawPortrait: (fit, canvas, view) => {
        if (!wardrobe.mq) return false;
        wardrobe.mq.still(fit, 'body', canvas, view);
        return true;
      } });
    } catch (e) {
      bootFailed('build', e);
      return;
    }
    game.onEnd = onEnd;
    try {
      setupAttract();
      wardrobe.init(); // the live survivor now belongs to the shared garage scene
    } catch (e) {
      bootFailed('menu', e);
      return;
    }
    // warm up shaders so the first ping doesn't hitch
    renderer.compile(scene, camera);
    window.__hush = { world, game, shared, pulses, ghosts, eyes, renderer, perf, mic, audio, music: menuMusic, input, hud, post, shadows, coop, lobby, atlas, wardrobe, micCal, news, home, debug: DEBUG, profile, startRun, pause, resume, toMenu, highlights, reel, get opening() { return game && game.opening; }, ensureGarage, cloud, account, social, notifications, get garage() { return garage; }, get state() { return state; } };
    state = 'menu';
    menuTime = 0;
    post.u.uFade.value = 0;
    menuMusic.applyVolume();
    menuMusic.start(); // the browser may hold it until the first tap: a gesture calls retry()
    menus.only('menu');
    home.enter();
    updateMicUI();
    // 3.0g: a link that names the ground wins over the remembered one — otherwise ?map=bog would bounce the
    // player back to the forest the moment the shift started
    if (DEBUG.map === 'bog' || DEBUG.shelter) { settings.shiftMap = 'bog'; saveSettings(); } // (3.0q: the shelter is on the bog)
    if (DEBUG.range) startTrainingSolo(); // (3.0u) arrived from the bog on the way to the range: its film, then the range
    else if (DEBUG.autostart) startRun();
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
