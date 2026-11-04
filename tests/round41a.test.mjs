import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '',
  width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {},
  querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => ({
    fillRect() {}, clearRect() {}, strokeRect() {}, drawImage() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, fill() {}, fillText() {}, arc() {}, ellipse() {},
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: new Uint8Array(4) }),
    putImageData() {},
  }),
});
globalThis.document = globalThis.document || {
  documentElement: stubEl(), body: stubEl(), head: stubEl(),
  getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [],
  createElement: () => stubEl(), createElementNS: () => stubEl(),
  addEventListener() {}, removeEventListener() {},
};
globalThis.window = globalThis.window || {
  addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { search: '', href: 'http://localhost/' },
};
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');
const { lakeSurface } = await import('../src/world/lake.js');
const { Player } = await import('../src/game/player.js');
const { CFG } = await import('../src/core/config.js');
const { RoadFilm, arrivalPath, TF } = await import('../src/game/roadFilm.js');
const { RoadTraffic, trafficAt } = await import('../src/game/roadTraffic.js');
const { LakeShark, SHARK, sharkPose, buildLakeShark } = await import('../src/game/lakeShark.js');
const { AudioEngine } = await import('../src/audio/audio.js');
const { NetSync } = await import('../src/game/netsync.js');
const { PF } = await import('../src/game/remote.js');
const { WATER, depthOf, swimming, speedScale } = await import('../src/game/water.js');
const { JUNCTION_POST } = await import('../src/world/yard.js');
const { GK, buildCarWheels } = await import('../src/ui/garageSet.js');
const { buildSurvivor, poseSwimming } = await import('../src/game/survivor.js');
const { setLang, t } = await import('../src/core/i18n.js');
let world;
const forest = () => world ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate();
const src = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');

class Param {
  constructor(value=0) {this.value=value;this.calls=[];}
  call(method,v){assert.ok(Number.isFinite(v),'a finite AudioParam');this.value=v;this.calls.push([method,v]);}
  setTargetAtTime(v){this.call('target',v);}
  setValueAtTime(v){this.call('value',v);}
  cancelScheduledValues(){}
}
class Node {
  constructor(){this.edges=[];for(const p of ['gain','frequency','Q','threshold','knee','ratio','attack','release','positionX','positionY','positionZ'])this[p]=new Param();}
  connect(n){this.edges.push(n);return n;}
  disconnect(n){this.edges=n?this.edges.filter(v=>v!==n):[];}
}
function audioFixture(){
 const a=new AudioEngine(),ctx={state:'running',currentTime:1,sampleRate:48000,destination:new Node(),createBiquadFilter:()=>new Node(),createDynamicsCompressor:()=>new Node(),createPanner:()=>new Node()};
 ctx.listener={};for(const p of ['positionX','positionY','positionZ','forwardX','forwardY','forwardZ'])ctx.listener[p]=new Param();
 ctx.resume=()=>{ctx.resumes=(ctx.resumes||0)+1;return Promise.resolve();};a.ctx=ctx;return a;
}

test('audio: a 180° turn never interpolates the HRTF forward through zero; invalid views recover',()=>{
 const a=audioFixture();
 for(const v of [[0,0,-1],[0,0,1],[NaN,Infinity,0],[0,1,0],[0,0,0]]){
   a.setListener(NaN,2,Infinity,...v);
   assert.ok(Object.values(a.listener).every(Number.isFinite));
   const L=a.ctx.listener, f=[L.forwardX.value,L.forwardY.value,L.forwardZ.value];
   assert.ok(Math.abs(Math.hypot(...f)-1)<1e-8);
   assert.ok(Math.hypot(f[0],f[2])>=.0199,'a basis not parallel to up');
   assert.ok(L.forwardZ.calls.every(c=>c[0]==='value'),'orientation must be assigned atomically');
 }
 const p=a._panner(NaN,Infinity,undefined);assert.deepEqual([p.positionX.value,p.positionY.value,p.positionZ.value],[a.listener.x,a.listener.y,a.listener.z]);
});

test('audio watchdog: only non-finite samples rebuild filters, with voice/self-gate edges preserved',()=>{
 const a=audioFixture(),old=new Node(),gate=new Node();a.stunLP=old;a.master=new Node();a.limiter=new Node();
 a.pauseGain=new Node();a.voiceBus=new Node();a.deathBus=new Node();
 for(const b of [a.pauseGain,a.voiceBus,a.deathBus])b.connect(old);
 a.voiceBus.connect(gate);a.master.connect(a.limiter);old.frequency.value=19000;
 a.outAnalyser={getFloatTimeDomainData:b=>b.fill(NaN)};a._outBuf=new Float32Array(16);
 a.watchdog(1);assert.equal(a._audioRepairs,1);assert.notEqual(a.stunLP,old);
 for(const b of [a.pauseGain,a.voiceBus,a.deathBus])assert.ok(b.edges.includes(a.stunLP));
 assert.ok(a.voiceBus.edges.includes(gate));assert.equal(a.stunLP.frequency.value,19000);
 a.watchdog(1.1);a.watchdog(2);assert.equal(a._audioRepairs,1,'bounded repairs');
 a.outAnalyser.getFloatTimeDomainData=b=>b.fill(0);a.watchdog(5);assert.equal(a._audioRepairs,1,'real silence is not a failure');
});

test('audio watchdog: interrupted contexts resume, paused/closed/offline ones do not',async()=>{
 const a=audioFixture();a.ctx.state='suspended';a.watchdog(1);a.watchdog(1.6);assert.equal(a.ctx.resumes,1);
 await new Promise(r=>setImmediate(r));a.pausedFlag=true;a.watchdog(3);assert.equal(a.ctx.resumes,1);
 a.pausedFlag=false;a.ctx.state='closed';a.watchdog(4);assert.equal(a.ctx.resumes,1);
 a.ctx.state='suspended';a.offline=true;a.watchdog(5);assert.equal(a.ctx.resumes,1);
});

test('traffic: the wheelie overtakes in the side shot; police pursue in pass/drone, then both leave',()=>{
 const c={x:210};const a=trafficAt(14,c),b=trafficAt(17,c),d=trafficAt(20,c);
 assert.ok(a.biker.x>c.x&&d.biker.x<c.x);assert.ok(b.biker.wheelie>.55);
 assert.ok(b.biker.z>CFG.ROAD.z,'between camera and car, not hidden behind it');
 assert.equal(trafficAt(23,c).police.visible,false);
 assert.equal(trafficAt(29,c).police.visible,true);assert.equal(trafficAt(35,c).police.visible,true);
 assert.ok(trafficAt(35,c).biker.x<trafficAt(35,c).police.x);
 assert.equal(trafficAt(TF+.01,c).police.visible,false);
 assert.ok(Object.values(trafficAt(17,c).biker).every(v=>typeof v==='boolean'||Number.isFinite(v)));
});

test('traffic: wheelie pivots round the rear contact, spins both wheels and disposes sound/meshes',()=>{
 const scene=new THREE.Scene(),t=new RoadTraffic(scene,new THREE.MeshBasicMaterial());
 t.update(17,{x:200});t.root.updateMatrixWorld(true);
 const k=t.bike.userData.kugoo,front=new THREE.Vector3(),rear=new THREE.Vector3();
 k.wheelF.getWorldPosition(front);k.wheelR.getWorldPosition(rear);
 assert.ok(front.y-rear.y>.55,'the FRONT wheel lifts');assert.ok(Math.abs(rear.y-(CFG.ROAD.y+.015+.2218))<.005);
 for(const side of['L','R']){
  const hand=t.rig.nodes['el'+side].localToWorld(new THREE.Vector3(0,-.305,.066));
  const target=k.steer.localToWorld(new THREE.Vector3(side==='L'?.29:-.29,.278,.086));
  assert.ok(hand.distanceTo(target)<.015,'both hands stay on the actual Kugoo grips during the wheelie');
 }
 let stopped=0;t.sound({filmMoto:()=>({move(){},stop(){stopped++;}})});
 assert.equal(scene.children.length,1);t.dispose();assert.equal(scene.children.length,0);assert.equal(stopped,1);
});

test('arrival: the car follows the cut and yard ground instead of the highway altitude',()=>{
 const w=forest(),f=new RoadFilm({world:w});f._plan();
 let maxError=0;
 for(let tt=TF;tt<f.tStop;tt+=.1){const c=f.carAt(tt);assert.ok(Object.values(c).every(Number.isFinite));if(c.z<CFG.ROAD.z-10)maxError=Math.max(maxError,Math.abs(c.y-f._ground(c.x,c.z)));}
 assert.ok(maxError<1e-7);assert.ok(f._ground(CFG.YARD.x,CFG.YARD.z)>CFG.ROAD.y+1,'the yard sits above the highway');
});

test('arrival: the full car silhouette clears the relocated junction pole',()=>{
 const curve=new THREE.CatmullRomCurve3(arrivalPath().map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal',.5);
 let clear=Infinity;const L=curve.getLength(),X=CFG.YARD.x+JUNCTION_POST,Z=CFG.ROAD.z-7.2;
 for(let d=0;d<L;d+=.08){const p=curve.getPointAt(d/L),v=curve.getTangentAt(d/L),yaw=Math.atan2(v.z,-v.x),cy=Math.cos(yaw),sy=Math.sin(yaw);
  const dx=X-p.x,dz=Z-p.z,lx=dx*cy-dz*sy,lz=dx*sy+dz*cy;
  clear=Math.min(clear,Math.hypot(Math.max(-2.25-lx,0,lx-2.29),Math.max(-1.1-lz,0,lz-1.1))-.12);
 }
 assert.ok(clear>.15,`full UAZ/pole clearance: ${clear.toFixed(3)} m`);
});

test('lake: water overlaps the terrain shore, and the old circular wall no longer blocks swimmers',()=>{
 const w=forest(),L=w.lake;assert.ok(L.meshR>L.r+8);assert.ok(w.water?.swim);
 assert.ok(depthOf(w,L.x,L.z)>SHARK.deep);assert.equal(depthOf(w,0,0),0);
 const p={x:L.x,z:L.z};w.col.resolve(p,CFG.PLAYER.radius);assert.ok(Math.hypot(p.x-L.x,p.z-L.z)<.01,'not pushed 28 metres out of a water collider');
 // The circumference is buried under the bank in every direction, not an open vertical seam.
 let low=Infinity;assert.ok(L.bank.length>30);for(const[a,z,b,v]of L.bank)for(let i=0;i<=8;i++){const u=i/8;low=Math.min(low,w.terrain.height(a+(b-a)*u,z+(v-z)*u)-L.y);}
 assert.ok(low>.35,`bank covers every edge and midpoint by ${low.toFixed(2)} m`);
 const M=w.landmarks.find(l=>l.id==='lake'),surface=lakeSurface(w.terrain,M,L.y),edges=new Map();
 const key=p=>`${p[0].toFixed(5)},${p[2].toFixed(5)}`;
 for(const{p}of surface.triangles)for(let i=0;i<3;i++){const a=p[i],b=p[(i+1)%3],id=[key(a),key(b)].sort().join('/'),e=edges.get(id);if(e)e.n++;else edges.set(id,{a,b,n:1});}
 for(const{a,b,n}of edges.values()){
   assert.ok(n<=2,'no stacked water triangles');
   if(n===1)assert.ok(w.terrain.height((a[0]+b[0])/2,(a[2]+b[2])/2)-L.y>.35,'no exposed mesh boundary or flood-fill cutoff');
 }
 const dock=w.walks[0];assert.equal(depthOf(w,(dock.ax+dock.bx)/2,L.z),0,'the pier is dry');
});

test('lake: wading slows, deep water floats the eyes, sprint/crouch/jump cannot run along the bottom',()=>{
 const w=forest(),L=w.lake,p=new Player(w);p.x=L.x+5;p.z=L.z+4;p.y=w.terrain.height(p.x,p.z);
 const input={move:{x:0,y:1},turn:0,crouch:true,sprint:true,jumpAt:performance.now()+1};
 for(let i=0;i<90;i++)p.update(1/60,input,{dx:0,dy:0});
 assert.equal(p.swimming,true);assert.equal(p.sprinting,false);assert.equal(p.crouching,false);assert.equal(p.grounded,false);
 assert.ok(p.y+p.eyeCur>L.y+.1&&p.y+p.eyeCur<L.y+.5,'eyes float at the surface');
 assert.ok(p.speed<CFG.PLAYER.walk*.6);assert.ok(Math.abs(p.vy)<.001);assert.equal(speedScale(w,p.x,p.z),WATER.swimSpeed);
});

test('swimming: the co-op flag is distinct from falling and every rig joint stays finite',()=>{
 assert.equal(PF.swim,512);assert.match(src('src/game/netsync.js'),/p\.swimming\) f \|= PF\.swim/);
 assert.match(src('src/game/remote.js'),/poseSwimming\(this\.rig/);assert.match(src('src/game/selfbody.js'),/p\.swimming\) poseSwimming/);
 const rig=buildSurvivor();for(let i=0;i<20;i++){poseSwimming(rig,i*.2);rig.root.updateMatrixWorld(true);for(const n of Object.values(rig.nodes))assert.ok(n.matrixWorld.elements.every(Number.isFinite));}
});

function sharkGame(auth=true){
 const w=forest(),L=w.lake,player={id:'me',x:L.x+5,z:L.z+4,y:L.y-1.25,alive:true,vx:0,vz:0,yaw:0,pitch:0};
 const remotes=new Map(),events=[],calls=[];
 const g={world:w,map:'forest',scene:new THREE.Scene(),auth,online:false,state:'play',time:12,player,remotes,fx:{fade:1},stats:{seen:{}},
  livePlayers:()=>[player,...remotes.values()].filter(p=>p.alive),playerById:id=>id==='me'?player:remotes.get(id),
  sync:{ev:(...a)=>events.push(a)},audio:{impact(){},wade(){},jumpscare(){},mateDeath(){},setAmbience(){}},hud:{flashAlert(){}},pulses:{emit(){}},
  waves:{add(){}},glows:{dropFor(){}},escape:{dropFor(){}},checkTeam(){},distToEars:()=>2,nameOf:()=> 'Mate',hlNote(){},addTrauma(){},
  beginDeath(m,cause){this.killType=m.type;this.cause=cause;this.deathT=0;calls.push(['death',cause]);},
  localDie(m,cause){player.alive=false;this.localDeath=true;this.beginDeath(m,cause);},enterSpectate(){calls.push(['spectate']);},onEnd:r=>calls.push(['end',r.cause]),
 };
 g.lakeShark=new LakeShark(g);return{g,events,calls,L};
}

test('shark: a guest cannot invent the attack; forged guest events and invalid coordinates are ignored',()=>{
 const {g}=sharkGame(false);for(let i=0;i<180;i++)g.lakeShark.update(1/60);assert.equal(g.lakeShark.attacks.size,0);
 const sync=new NetSync(g,{isHost:false});sync.event(['lksh','me',g.player.x,g.player.z,0],'stranger',false);assert.equal(g.lakeShark.attacks.size,0);
 sync.event(['lksh','me',NaN,g.player.z,0],'host',true);assert.equal(g.lakeShark.attacks.size,0);
 sync.event(['lksh','me',g.player.x,g.player.z,0],'host',true);assert.equal(g.lakeShark.attacks.size,1);
});

test('shark: only sustained deep water triggers; one host event, one bite, then no rescue body',()=>{
 const {g,events,calls,L}=sharkGame();g.online=true;
 for(let i=0;i<45;i++)g.lakeShark.update(1/60);assert.equal(g.lakeShark.attacks.size,0);
 g.player.x=0;g.player.z=0;g.lakeShark.update(.1);g.player.x=L.x+5;g.player.z=L.z+4;
 for(let i=0;i<60;i++)g.lakeShark.update(1/60);assert.equal(events.length,0,'deep-water clock resets ashore');
 for(let i=0;i<15;i++)g.lakeShark.update(1/60);assert.equal(events.length,1);assert.equal(events[0][0],'lksh');
 assert.equal(g.lakeShark.holds('me'),true);
 for(let i=0;i<90;i++)g.lakeShark.update(1/60);assert.equal(g.player.alive,false);assert.equal(g.player.consumed,true);
 assert.equal(g.cause,'shark');assert.equal(calls.filter(c=>c[0]==='death').length,1);assert.equal(events.length,1);
 g.lakeShark.reset();assert.equal(g.scene.children.length,0);assert.equal(g.lakeShark.consumed.size,0);
});

test('shark: solo death has its own cinematic and result, never a forest-monster stand-in',()=>{
 const {g,calls}=sharkGame();assert.equal(g.lakeShark.start('me',g.player.x,g.player.z,0),true);
 g.lakeShark.update(SHARK.bite+.01);assert.equal(g.state,'dying');assert.equal(g.cause,'shark');
 for(let i=0;i<121;i++)g.lakeShark.dying(1/60);
 assert.equal(g.state,'over');assert.ok(calls.some(c=>c[0]==='end'&&c[1]==='shark'));
 assert.match(src('src/game/game.js'),/killType === 'shark'\) return this\.lakeShark\.dying/);
});

test('shark: the morning-to-night transition waits for the bite camera, including a guest receiving dusk',()=>{
 for(const role of['host','guest']){
  let dusk=0;const g={state:'morning',role,lakeShark:{attacks:new Map([['me',{}]])},audio:{dusk(){dusk++;}},
   hud:{setIntro(){},setHint(){},setUse(){},setSkip(){}},objectives:{campFail(){}},sync:{ev(){}},duskT:99};
  Game.prototype.startDusk.call(g);assert.equal(g.state,'morning');assert.equal(g._duskQueued,true);assert.equal(dusk,0);
  g.lakeShark.attacks.clear();Game.prototype.startDusk.call(g);
  assert.equal(g.state,'dusk');assert.equal(g._duskQueued,false);assert.equal(g.duskT,0);assert.equal(dusk,1);
 }
});

test('shark: model/trajectory are finite; the jaw shuts at the bite and the fin clears the water',()=>{
 const rig=buildLakeShark(new THREE.MeshBasicMaterial());rig.root.traverse(m=>{if(m.isMesh)assert.ok(m.geometry.attributes.position.array.every(Number.isFinite));});
 assert.ok(sharkPose(.65).jaw>.7);assert.ok(sharkPose(1.1).jaw<.01);assert.ok(sharkPose(1).height>1);
 assert.equal(sharkPose(SHARK.dive+.01).visible,false);rig.dispose();
 for(let a=0;a<4;a+=.01)assert.ok(Object.values(sharkPose(a)).every(v=>typeof v==='boolean'||Number.isFinite(v)));
});

test('shark: witnesses recoil, see the victim lifted and later see no floating rescue corpse',()=>{
 const {g}=sharkGame();const r={id:'mate',x:g.player.x,z:g.player.z,y:g.player.y,alive:true,rig:buildSurvivor(),die(){this.alive=false;}};g.remotes.set(r.id,r);
 g.lakeShark.start('mate',r.x,r.z,0);assert.ok(g.lakeShark.shock.has('me'));
 g.lakeShark.update(.75);g.lakeShark.poseRemote(r);assert.equal(r.rig.root.visible,true);assert.ok(r.rig.root.position.y>g.world.lake.y-.2);
 g.lakeShark.update(1.1);g.lakeShark.poseRemote(r);assert.equal(r.rig.root.visible,false);assert.equal(r.consumed,true);
});

test('wheels: no chrome spokes coplanar with the painted disc',()=>{
 const a=buildCarWheels({},0),p=a.pos,d=a.dat;let chrome=0;
 for(let i=0;i<p.length/3;i++)if(d[i*4+3]===GK.CHROME){chrome++;assert.ok(Math.hypot(p[i*3],p[i*3+1])<.105,'chrome is confined to the hub, not flashing bars');}
 assert.ok(chrome>0);assert.ok(a.pos.every(Number.isFinite));
});

test('4.1 lake warnings, witness reaction and death names exist in both languages',()=>{
 for(const lang of ['ru','en']){setLang(lang);for(const key of ['lakeDeepWarning','lakeMateTaken'])assert.notEqual(t(key),key);assert.ok(t('deathBy').shark);assert.ok(t('pfKillers').shark);}setLang('ru');
});

// Full controllers, not a replacement death/physics loop. Two peers use an in-memory wire,
// but run the production NetSync parser, player, remote rig, phase clock and spectator code.
const noop = new Proxy(function(){},{get:()=>noop,apply:()=>undefined});
function fullGame(){
 const scene=new THREE.Scene(),w=forest(),input={move:{x:0,y:0},crouch:false,sprint:false,turn:0,uiMode:false,events:[],useHeld:false,touch:false,consume:()=>[]};
 const audio=new Proxy({ready:false,voices:new Map()},{get:(o,k)=>k in o?o[k]:noop});
 const g=new Game({scene,world:w,camera:new THREE.PerspectiveCamera(70,1.6,.05,400),input,audio,hud:noop,radar:noop,post:noop,shadows:noop,
  pulses:{emit(){},emitStep(){},update(){},clear(){},fronts:()=>[]},
  ghosts:{clear(){},spawn:()=>({count:0}),release(){}},eyes:{add(){},clear(){}},particles:{burst(){},clear(){}},
  mic:{state:'off',update:()=>({loud:0,pulse:0,scream:false}),inIframe:()=>false}});
 return g;
}
const frame=(g,events=[])=>g.update(1/60,{events,look:{dx:0,dy:0}});
function inLake(g){
 const L=g.world.lake,p=g.player;p.x=L.x+8;p.z=L.z+12;p.y=g.world.terrain.height(p.x,p.z);p.vx=p.vz=0;
}

test('full Game: morning and night both float, breach, bite once and finish with the shark result',()=>{
 for(const phase of['morning','play']){
  const g=fullGame();g.setupSolo();g.reset({seed:41});g.opening.cancel();
  if(phase==='play')g.startNight();else g.state='morning';
  inLake(g);let end=null;g.onEnd=r=>end=r;
  for(let i=0;i<75;i++)frame(g);
  assert.equal(g.player.swimming,true);assert.ok(g.lakeShark.attacks.has(g.player.id));
  for(let i=0;i<230&&g.state!=='over';i++)frame(g);
  assert.equal(g.state,'over');assert.equal(end?.cause,'shark');assert.equal(g.player.alive,false);
  assert.equal(g.stats.seen.shark,1);g.lakeShark.reset();
 }
});

test('full co-op Game: host authorises a guest breach; witness, consumed body, spectator and queued dusk agree',()=>{
 const host=fullGame(),guest=fullGame(),qs=[[],[]],events=[];
 const roster=[{id:'host',slot:0,name:'Host'},{id:'guest',slot:1,name:'Guest'}];
 for(const[g,i]of[[host,0],[guest,1]]){
  const send=(type,d,target)=>{if(type==='ev')events.push([i,...d]);qs[1-i].push([type,structuredClone(d),i?'guest':'host']);};
  const coop={isHost:!i,selfId:i?'guest':'host',hostId:'host',rules:{},send,toHost:send,drain:()=>qs[i].splice(0)};
  g.setupOnline(coop,roster);g.reset({seed:41,slot:i});g.opening.cancel();g.state='morning';
 }
 inLake(guest);const L=host.world.lake;host.player.x=L.x-23;host.player.z=L.z+12;host.player.y=host.world.terrain.height(host.player.x,host.player.z);
 // Keep the witness within the reaction radius, outside the deep-water trigger.
 host.player.x=guest.player.x+12;host.player.z=guest.player.z;host.player.floorY=L.y+.5;host.player.y=L.y+.5;
 for(const[a,b]of[[host,guest],[guest,host]])Object.assign(a.remotes.get(b.player.id),{x:b.player.x,y:b.player.y,z:b.player.z,yaw:b.player.yaw});
 const both=()=>{frame(host);frame(guest);};
 for(let i=0;i<90;i++)both();
 assert.equal(events.filter(e=>e[1]==='lksh').length,1);assert.ok(host.lakeShark.shock.has('host'));assert.ok(guest.lakeShark.attacks.has('guest'));
 frame(guest,['confirm']);both();assert.equal(host._duskQueued,true);assert.equal(host.state,'morning');
 for(let i=0;i<220&&host.state==='morning';i++)both();
 both();
 assert.equal(host.state,'dusk');assert.equal(guest.state,'dusk');assert.equal(guest.localDeath,'done');
 assert.equal(guest.player.alive,false);assert.equal(host.remotes.get('guest').consumed,true);
 assert.equal(host.remotes.get('guest').rig.root.visible,false);assert.equal(guest.spectate?.target?.id,'host');
 assert.equal(events.filter(e=>e[1]==='lksh').length,1);
 host.lakeShark.reset();guest.lakeShark.reset();host._dropRemotes();guest._dropRemotes();
});
