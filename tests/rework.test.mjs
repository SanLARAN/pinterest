// Regressions for 1.11: pocket capacity, transactional pickups/drops, full phrases and the new rig.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BAG_SIZE, BAG_KINDS, fitsPocket, cleanPockets, cleanParcel } from '../src/game/backpackData.js';
import { Backpack } from '../src/game/inventory.js';
import { PHRASE, PhraseCapture, encodePhrase, decodePhrase, validPhrase } from '../src/audio/phrases.js';
import { VoiceMimic } from '../src/game/voiceMimic.js';
import { AudioEngine } from '../src/audio/audio.js';
import { cleanLobbyRules } from '../src/net/lobbyRules.js';
import { buildCrawler, ANIMS } from '../src/game/monsters.js';
import { Ghosts } from '../src/render/ghosts.js';
import { GlowSticks } from '../src/game/glowsticks.js';
import { Input } from '../src/input/input.js';
import { Mates } from '../src/ui/mates.js';

const ctx={createBuffer:(_,n,hz)=>{const data=new Float32Array(n);return{duration:n/hz,length:n,sampleRate:hz,numberOfChannels:1,getChannelData:()=>data};}};
const tone=(hz,seconds,amplitude=.12)=>Float32Array.from({length:Math.floor(hz*seconds)},(_,i)=>amplitude*Math.sin(i*2*Math.PI*273/hz));

test('exactly four pockets; stackable consumables are not a fifth pocket',()=>{
 assert.equal(BAG_SIZE,4);
 const slots=['stones','glow','tape','crowbar'];
 assert.equal(fitsPocket(slots,'torch'),false);assert.equal(fitsPocket(slots,'glow'),true);
 for(const k of BAG_KINDS) assert.equal(fitsPocket(['stones',null,null,null],k),true);
 for(const a of [null,[],['glow'],[null,null,null,null,null],['tape','tape',null,null],['invalid',null,null,null]]) assert.equal(cleanPockets(a),null);
 assert.deepEqual(cleanPockets(slots),slots);assert.notEqual(cleanPockets(slots),slots);
});
test('dropped parcels validate ammunition, ownership kind and exact flashlight charge',()=>{
 assert.deepEqual(cleanParcel({kind:'torch',n:1,charge:.137}),{kind:'torch',n:1,charge:.137});
 assert.deepEqual(cleanParcel({kind:'flare',n:0,gun:true}),{kind:'flare',n:0,gun:true});
 for(const d of [null,{}, {kind:'tape',n:1},{kind:'stones',n:4},{kind:'glow',n:-1},{kind:'battery',n:Infinity},{kind:'torch',n:1,charge:NaN},{kind:'torch',n:1,charge:1.01}]) assert.equal(cleanParcel(d),null);
});
function pack() {
 const p={id:'a',alive:true,x:0,y:0,z:0,eyeCur:1.65,stones:3,flares:0,hasFlare:false,yaw:0,forward:()=>({x:0,z:-1})};
 const g={auth:true,state:'play',time:50,player:p,remotes:new Map(),playerById:id=>id==='a'?p:g.remotes.get(id),
  glows:{count:1,held:null},torch:{has:false,charge:0,spare:0,_taken(it){it.taken=true;},items:[]},tools:{hasCrowbar:false,tapeHeld:null,groundHeight:()=>.18},
  escape:{load:()=>null,seatOf:()=>-1},cabinets:{locked:()=>false,list:[]},
  world:{terrain:{height:()=>0},material:new THREE.MeshBasicMaterial(),col:{free:()=>true},losBlocked:()=>false},
  scene:new THREE.Scene(),hud:{popup(){}},audio:{ready:false},setFlares:(n,has)=>{p.flares=n;p.hasFlare=has;},sync:{send(){},ev(){}},stats:{}};
 const b=Object.create(Backpack.prototype);g.inventory=b;
 Object.assign(b,{g,slots:['stones','glow',null,null],cells:0,equipped:null,pending:new Map(),remoteSlots:new Map(),world:new Map(),claims:new Map(),applied:new Set(),parcelApplied:new Set(),meshes:new Map(),geo:{stones:new THREE.BoxGeometry(),torch:new THREE.BoxGeometry(),battery:new THREE.BoxGeometry(),flare:new THREE.BoxGeometry()},summaryKey:''});
 return{b,g,p};
}
test('reconcile frees the actual pocket when its item is used up, not every item of that type',()=>{
 const{b,g,p}=pack();b.equipped='stones';p.stones=0;b.reconcile();assert.equal(b.slots[0],null);assert.equal(b.equipped,null);
 g.torch.has=true;g.torch.charge=0;b.reconcile();assert.equal(b.slots[0],'torch');
 p.hasFlare=true;b.reconcile();assert.ok(b.slots.includes('flare'),'an empty flare gun remains a physical object');
});
test('host reservations prevent two simultaneous last-slot grants',()=>{
 const{b,g}=pack();g.remotes.set('b',{id:'b',alive:true});b.receiveSlots('b',['stones','glow','tape',null]);
 assert.equal(b.reserve('b','crowbar'),true);assert.equal(b.reserve('b','torch'),false);
 assert.equal(b.reserve('b','not-an-item'),false);
});
test('one physical dropped parcel has one winner, repeat/older snapshots never duplicate it',()=>{
 const{b,g,p}=pack();const parcel={id:'a:test',nonce:'test',from:'a',kind:'battery',n:2,x:0,y:.2,z:-.4,yaw:0,rev:1,taker:null};
 b.applyParcel(parcel);assert.equal(b.world.size,1);assert.equal(b.cells,0);
 assert.equal(b.hostPick('a',parcel.id),true);assert.equal(b.cells,2);assert.equal(b.hostPick('a',parcel.id),false);
 b.applyParcel({...parcel,rev:2,taker:'a'});b.applyParcel(parcel);assert.equal(b.cells,2);assert.equal(b.world.get(parcel.id).taker,'a');
 assert.equal(b.meshes.get(parcel.id).visible,false);
});
test('full backpack denies a world pickup without hiding or destroying the object',()=>{
 const{b,g}=pack();b.slots=['stones','glow','tape','crowbar'];
 const d={id:'a:torch',nonce:'torch',from:'a',kind:'torch',n:1,charge:.27,x:0,y:0,z:0,yaw:0,rev:1,taker:null};b.applyParcel(d);
 // Keep the synthetic field-tool slots occupied (their systems are stubbed in this fixture).
 b.slots=['stones','glow','tape','crowbar'];
 assert.equal(b.hostPick('a',d.id),false);assert.equal(b.world.get(d.id).taker,null);assert.equal(b.meshes.get(d.id).visible,true);assert.equal(g.torch.has,false);
});
test('drop acknowledgement removes exactly the pending item, and picking it up preserves charge',()=>{
 const{b,g}=pack();g.torch.has=true;g.torch.charge=.173;b.reconcile();
 const d=b.parcel('torch');b.pending.set('drop',{kind:'torch',parcel:d});
 assert.equal(b.hostDrop('a','drop',d),true);assert.equal(g.torch.has,false);assert.equal(b.pending.size,0);
 const world=[...b.world.values()][0];assert.equal(world.y,.21);assert.equal(world.charge,.173);
 assert.equal(b.hostPick('a',world.id),true);assert.equal(g.torch.has,true);assert.equal(g.torch.charge,.173);
});
test('world pickup validates reach, vertical floor, line of sight and living hands',()=>{
 for(const change of [({p})=>p.x=8,({p})=>p.y=8,({g})=>g.world.losBlocked=()=>true,({p})=>p.alive=false,({p})=>p.carrying='friend',({g})=>g.escape.load=()=>({})]) {
  const fixture=pack(),{b}=fixture;b.applyParcel({id:'x',from:'a',nonce:'x',kind:'battery',n:1,x:0,y:0,z:0,yaw:0,rev:1,taker:null});change(fixture);assert.equal(b.hostPick('a','x'),false);
 }
});
test('cabinet claim is settled once and a full bag leaves its loot in the cabinet',()=>{
 const{b,g}=pack();const it={kind:'battery',taken:false};let given=0;
 g.cabinets.list=[{opened:true,locked:false,front:{x:0,z:0},spec:{y:0},items:[it]}];g.cabinets._taken=()=>it.taken=true;g.cabinets._give=()=>{given++;b.cells++;};
 b.slots=['stones','glow','tape','crowbar'];assert.equal(b.hostClaim('a','cabinet',0,0),false);assert.equal(it.taken,false);
 b.slots[3]=null;assert.equal(b.hostClaim('a','cabinet',0,0),true);assert.equal(it.taken,true);assert.equal(given,1);
 b.applyClaim([...b.claims.values()][0]);assert.equal(given,1);
});

test('full voice phrase preserves the ORIGINAL rate, length, pitch, amplitude and internal pauses',()=>{
 for(const hz of [8000,44100,48000,96000]) {
  const raw=tone(hz,5.75);raw.fill(0,Math.floor(hz*2.1),Math.floor(hz*2.55));
  const clip=encodePhrase(raw,hz),decoded=decodePhrase(clip,ctx),out=decoded.getChannelData(0);
  assert.ok(validPhrase(clip));assert.equal(decoded.duration,5.75);assert.equal(decoded.sampleRate,hz);assert.equal(out.length,raw.length);
  let max=0;for(let i=0;i<out.length;i++)max=Math.max(max,Math.abs(out[i]-raw[i]));assert.ok(max<=1/32767,`PCM error ${max}`);
  assert.equal(out[Math.floor(hz*2.3)],0);
 }
});
test('phrase bounds and malformed PCM are rejected; silence is not learned',()=>{
 assert.equal(encodePhrase(new Float32Array(48000),48000),null);
 for(const [a,hz]of[[tone(48000,.1),48000],[tone(48000,1),0],[tone(48000,1),Infinity],[new Float32Array(48000*31),48000]]) assert.equal(encodePhrase(a,hz),null);
 const good=encodePhrase(tone(8000,1),8000);
 for(const d of [null,{}, {...good,hz:NaN},{...good,n:1},{...good,pcm:'!'.repeat(good.pcm.length)},{...good,pcm:good.pcm+'A'}]) {assert.equal(validPhrase(d),false);assert.equal(decodePhrase(d,ctx),null);}
});
test('VAD waits through gaps BETWEEN words, then returns one complete phrase, never 1.8 seconds',()=>{
 const hz=8000,out=[],v=new PhraseCapture((a,h)=>out.push([a,h]));const silence=new Float32Array(400),speech=tone(hz,.05);
 for(let i=0;i<8;i++)v.push(silence,hz,-48);
 for(let i=0;i<140;i++)v.push(i>=50&&i<59?silence:speech,hz,-48); // seven seconds, a 450ms pause
 assert.equal(out.length,0);
 for(let i=0;i<17;i++)v.push(silence,hz,-48);
 assert.equal(out.length,1);assert.ok(out[0][0].length/hz>7);assert.equal(out[0][1],hz);assert.equal(v.parts.length,0);
});
test('an overlong utterance is discarded whole instead of being replayed as a truncated sentence',()=>{
 const hz=8000,out=[],v=new PhraseCapture((...a)=>out.push(a));
 for(let i=0;i<PHRASE.maxSeconds+2;i++)v.push(tone(hz,1),hz,-48);
 for(let i=0;i<2;i++)v.push(new Float32Array(hz),hz,-48);
 assert.equal(out.length,0);assert.equal(v.overflow,false);assert.equal(v.parts.length,0);
});
test('Shade accepts each participant, stores only two complete clips per player and never lobby audio',()=>{
 const players=new Map([['a',{alive:true}],['b',{alive:true}],['c',{alive:true}]]),v=Object.create(VoiceMimic.prototype);
 v.g={auth:true,state:'play',playerById:id=>players.get(id)};v.bank=new Map();v.rates=new Map();
 const clip=encodePhrase(tone(8000,.4),8000);
 for(const pid of players.keys())for(let i=0;i<3;i++){v.rates.delete(pid);assert.equal(v.accept(pid,String(i),clip),true);}
 assert.equal(v.bank.size,3);for(const clips of v.bank.values()){assert.equal(clips.length,2);assert.deepEqual(clips.map(p=>p.id),['1','2']);}
 v.g.state='idle';v.rates.clear();assert.equal(v.accept('a','menu',clip),false);
 v.g.state='play';players.get('a').alive=false;assert.equal(v.accept('a','dead',clip),false);assert.equal(v.accept('stranger','x',clip),false);
});
test('clean imitation uses exactly 1x / 0 cents, only gain + the normal spatial VOICE path',()=>{
 const connected=[],node=()=>({connect(dest){connected.push(dest);return dest;},disconnect(){},gain:{value:0,setTargetAtTime(){}},positionX:{value:0},positionY:{value:0},positionZ:{value:0}});
 let source;const a=Object.create(AudioEngine.prototype);
 a.ctx={state:'running',currentTime:1,createBufferSource:()=>source={...node(),playbackRate:{value:9},detune:{value:9},start(){},stop(){}},createGain:node};a._panner=node;a.voiceBus=node();a.voiceGains=new Map([['b',0]]);
 const buffer=ctx.createBuffer(1,8000,8000);buffer.getChannelData(0).set(tone(8000,1));
 const sound=a.cleanImitation('b',buffer,1,2,3);
 assert.equal(source.buffer,buffer);assert.equal(source.playbackRate.value,1);assert.equal(source.detune.value,0);assert.equal(connected.at(-1),a.voiceBus);
 assert.equal(connected[0].gain.value,0,'muted person stays muted when imitated');sound.stop();sound.stop();
});
test('hidden names cannot be forced back on by TAB/peek',()=>{
 let clears=0;const mates=Object.create(Mates.prototype);mates.clear=()=>clears++;
 mates.update({roomRules:{hideNames:true}},null,true);assert.equal(clears,1);
 assert.deepEqual(cleanLobbyRules({hideNames:true}),{hideNames:true});for(const v of [null,{}, {hideNames:'true'},{hideNames:1}])assert.deepEqual(cleanLobbyRules(v),{hideNames:false});
});
test('the new Crawler has six articulated HUMAN hands and fits the entire echo buffer',()=>{
 const rig=buildCrawler(),count=rig.parts.reduce((n,p)=>n+p.arr.count,0);
 assert.ok(count>3000);assert.ok(count<=4096);for(const name of ['FL','FR','ML','MR','BL','BR'])assert.ok(rig.nodes['palm'+name]);
 for(const state of ['idle','wander','search','hunt'])for(let phase=0;phase<7;phase+=.4){ANIMS.crawler({rig,state,phase,speedCur:3,headYaw:.3,seed:2},.016,phase);rig.root.updateMatrixWorld(true);for(const p of rig.parts){assert.ok(p.node.matrixWorld.elements.every(Number.isFinite));assert.ok(p.arr.pos.every(Number.isFinite));}}
 const ghosts=new Ghosts(new THREE.Scene(),1);const ghost=ghosts.spawn(rig,1);assert.equal(ghost.count,count,'no rear arms disappear due to the old 3200-vertex buffer');
});

test('a full flare-ammo pocket can still be upgraded with the actual gun',()=>{
 const{b,p}=pack();p.flares=6;p.hasFlare=false;b.reconcile();
 assert.equal(b.canReceive('flare'),false);assert.equal(b.canReceive('flare',false,true),true);
 assert.equal(b.reserve(p.id,'flare',true),true);p.hasFlare=true;assert.equal(b.canReceive('flare',false,true),false);
});
test('a burning stick counts toward the same three-stick pocket limit',()=>{
 const{b,g}=pack();g.glows.count=2;g.glows.held={};assert.equal(b.count('glow'),3);assert.equal(b.canReceive('glow'),false);
});
test('drop retries resend an acknowledgement, never a second physical item',()=>{
 const{b,g}=pack();let sent=0;g.sync.ev=(type)=>{if(type==='ibp')sent++};
 assert.equal(b.hostDrop('a','retry',{kind:'stones',n:3}),true);
 assert.equal(b.hostDrop('a','retry',{kind:'stones',n:3}),true);assert.equal(b.world.size,1);assert.equal(sent,2);
});
test('death retries the in-flight drop under the SAME nonce',()=>{
 const{b,g}=pack();g.auth=false;const sent=[];g.coop={toHost:(...args)=>sent.push(args)};
 b.pending.set('already-sent',{kind:'stones',parcel:{kind:'stones',n:3},death:false,retry:1});
 b.drop(0,true);assert.equal(b.pending.size,1);assert.equal(b.pending.get('already-sent').death,true);
 assert.equal(sent[0][1][0],'already-sent');assert.equal(sent[0][1][2],1);
});
test('late drop ACK clears the outgoing item once, not a new item of the same kind',()=>{
 const{b,p}=pack();const d={id:'a:late',from:'a',nonce:'late',kind:'stones',n:3,x:0,y:0,z:0,yaw:0,rev:1,taker:null};
 b.applyParcel(d);assert.equal(p.stones,0);p.stones=2;
 b.applyParcel({...d,rev:2,taker:'b'});assert.equal(p.stones,2);
});

test('a lit glow stick has one host-arbitrated winner, just like a dropped parcel',()=>{
 const{g,b,p}=pack(),sticks=Object.create(GlowSticks.prototype);let grants=0;
 const s={id:'a#1',owner:'a',state:'ground',left:90,x:0,y:0,z:0};
 Object.assign(sticks,{g,list:[s],_take:(s,id)=>{s.owner=id;s.state='held';}});g.glows=sticks;sticks.count=0;
 g.sync.ev=(type)=>{if(type==='ga')grants++};g.remotes.set('b',{...p,id:'b'});b.receiveSlots('b',['stones','glow',null,null]);
 assert.equal(sticks.hostPick('a',s.id),true);assert.equal(sticks.hostPick('b',s.id),false);
 assert.equal(s.owner,'a');assert.equal(grants,1);
});
test('a full bag or a wall prevents a lit-stick pickup without moving it',()=>{
 for(const blocked of['capacity','wall']) {
  const{g,b}=pack(),sticks=Object.create(GlowSticks.prototype),s={id:'a#1',state:'ground',left:90,x:0,y:0,z:0};
  Object.assign(sticks,{g,list:[s],count:0,_take:()=>assert.fail('a denied pickup must not change the stick')});g.glows=sticks;
  if(blocked==='capacity')b.slots=['stones','battery','tape','crowbar'];else g.world.losBlocked=()=>true;
  assert.equal(sticks.hostPick('a',s.id),false);assert.equal(s.state,'ground');
 }
});
test('expected pointer unlock and a late lock request cannot pause or trap an open bag',()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document,events=new Map();
 const canvas={addEventListener(){}};
 try {
  globalThis.window={addEventListener(){}};
  globalThis.document={pointerLockElement:canvas,addEventListener:(type,fn)=>events.set(type,fn),exitPointerLock(){this.pointerLockElement=null;}};
  const input=new Input(canvas),changed=events.get('pointerlockchange');input.locked=true;input.uiMode=true;
  input.exitLock();changed();assert.deepEqual(input.consume(),[],'intentional unlock never becomes pause');
  document.pointerLockElement=canvas;changed();assert.equal(document.pointerLockElement,null,'a late lock is immediately released');changed();assert.deepEqual(input.consume(),[]);
  input.uiMode=false;document.pointerLockElement=canvas;changed();document.pointerLockElement=null;changed();
  assert.deepEqual(input.consume(),['unlock'],'the ordinary browser Escape still pauses');
 } finally { if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument; }
});
test('pause/menu input muting stops automatic capture and learning without erasing prior consented phrases',()=>{
 const{g}=pack();g.mic={state:'on',floor:-60};const v=new VoiceMimic(g),hz=8000;
 g.inputMuted=true;g.mic.onPCM(tone(hz,1),hz);assert.equal(v.capture.n,0);v.learn(tone(hz,1),hz);assert.equal(v.bank.size,0);
 g.inputMuted=false;g.mic.onPCM(tone(hz,1),hz);g.mic.onPCM(new Float32Array(hz),hz);assert.equal(v.bank.size,1);
 g.inputMuted=true;g.mic.onPCM(tone(hz,1),hz);assert.equal(v.bank.size,1);v.clear();assert.equal(g.mic.onPCM,null);assert.equal(v.bank.size,0);
});
