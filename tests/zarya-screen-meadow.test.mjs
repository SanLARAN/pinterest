import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { ITEMS, cleanFit, fitKey, shapeKey, owns } from '../src/game/outfit.js';
import { buildSurvivor } from '../src/game/survivor.js';
import { SCREEN_HEX, SCREEN_PRESETS, DEFAULT_SCREEN, encodePixels, decodePixels, paintLine, presetPixels, cleanScreen, composeScreen, screenRects } from '../src/game/screenFace.js';
import { CampPower, canRepairCamp, CAMP_REPAIR_SECONDS, CAMP_LAMP_FIRST } from '../src/game/campPower.js';
import { LAMP_SLOTS, shared, shadowLights } from '../src/render/sonar.js';
import { Expedition } from '../src/game/expedition.js';
import { NetSync } from '../src/game/netsync.js';
import { buildModel } from '../src/ui/atlasModels.js';

let world;
const realWorld=()=>world||(world=new World(new THREE.Scene(),new THREE.MeshBasicMaterial()).generate());
test('field grass fills the map, not just a painted route; it does not enter water/buildings or block paths',()=>{
 const w=realWorld(),m=w.grass;
 assert.ok(m.tufts>50000&&m.tufts<120000);assert.equal(m.meshes.length,225);assert.equal(m.vertices,m.tufts*9);
 assert.ok(m.samples.every(p=>m.allowed(p.x,p.z)&&Number.isFinite(p.y+p.h)));
 for(const f of w.zarya.floors)assert.equal(m.allowed(f.x,f.z),false);
 assert.equal(m.allowed(w.lake.x,w.lake.z),false);
 for(const mesh of m.meshes){assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));assert.ok(!w.occluders.includes(mesh.geometry),'tiny blades must not multiply all shadow cube draws');}
 m.update({position:{x:0,z:0}});assert.ok(m.meshes.filter(m=>m.visible).length<40);
 const near=m.meshes.find(x=>x.visible&&x.geometry.drawRange.count===x.userData.fullCount),far=m.meshes.find(x=>x.visible&&x.geometry.drawRange.count===x.userData.lowCount);assert.ok(near&&far);assert.equal(far.userData.lowCount*3,far.userData.fullCount);
 for(const r of w.trails.routes)for(const p of r.points)assert.ok(w.col.free(p.x,p.z,.28));
});
test('the first-aid cabinet is mounted against the actual dining wall, with a reachable front',()=>{
 const w=realWorld(),c=w.cabinets.find(c=>c.id==='zarya:aid'),f=w.zarya.floors[2];
 const wallX=f.x-17/2+.08,backX=c.x-.22/2;
 assert.ok(Math.abs(backX-wallX)<.025);assert.equal(c.wallMounted,true);
 assert.ok(w.col.free(c.x+.66,c.z,.35));
 assert.equal(w.cabinets.filter(c=>c.id.startsWith('zarya:')).length,8);
});
test('Zarya has a real sixth (local) engine and seven indoor/outdoor fixtures without replacing main sites',()=>{
 const w=realWorld(),C=w.zarya;
 assert.equal(w.sites.length,6); // (2.1s: + the sovkhoz site)assert.equal(C.generator.id,'zarya-local');assert.equal(C.lights.length,7);
 assert.equal(C.lights.filter(l=>l.inside).length,4);assert.ok(CAMP_LAMP_FIRST+C.lights.length<=LAMP_SLOTS);
 const f=C.generator.front;assert.ok(w.col.free(f.x,f.z,.35));assert.ok(!w.col.free(C.generator.x,C.generator.z,.35));
 for(const l of C.lights)assert.ok(Number.isFinite(l.x+l.y+l.z));
});
function powerFixture(auth=true){
 const site={x:0,y:0,z:0,front:{x:0,z:1.4}},p={id:'self',x:0,y:0,z:1.4,alive:true,speed:0,eyeCur:1.62,forward:()=>({x:0,z:-1})};
 const g={auth,state:'play',player:p,input:{useHeld:true},inventory:{active:false},world:{zarya:{generator:site},losBlocked:()=>false},audio:{ready:false},hud:{popup(){}},noise(){},livePlayers:()=>[p],objectives:{count:0}};
 const power=Object.assign(Object.create(CampPower.prototype),{g,site,lights:[{x:0,y:2,z:0},{x:5,y:2,z:0,inside:true}],bulbs:[{},{}],bulbMat:{},progress:0,running:false,intensity:0,clankT:0,beat:0,localHolding:false});
 return{g,p,power};
}
test('only real nearby stationary, alive, free-handed held-use can repair the camp engine',()=>{
 const{g,p}=powerFixture();assert.equal(canRepairCamp(g,p,true),true);
 for(const [k,v]of[['alive',false],['speed',2],['y',4],['carrying','friend']]){const was=p[k];p[k]=v;assert.equal(canRepairCamp(g,p,true),false,k);p[k]=was;}
 p.x=20;assert.equal(canRepairCamp(g,p,true),false);p.x=0;
 g.inputMuted=true;assert.equal(canRepairCamp(g,p,true),false);g.inputMuted=false;
 g.world.losBlocked=()=>true;assert.equal(canRepairCamp(g,p,true),false);g.world.losBlocked=()=>false;
 const other={...p,id:'guest',useHeld:true};assert.equal(canRepairCamp(g,other),true);other.gearPose=1;assert.equal(canRepairCamp(g,other),false);
});
test('host repairs in six simulation seconds; no arbitrary client progress or main-quest completion',()=>{
 const{g,power}=powerFixture();for(let i=0;i<Math.ceil((CAMP_REPAIR_SECONDS+.1)/.05);i++){power.localHolding=true;power.update(.05);}
 assert.equal(power.running,true);assert.equal(g.objectives.count,0);assert.ok(shared.uLamp.value[CAMP_LAMP_FIRST].w>0);
 power.silence();assert.equal(shared.uLamp.value[CAMP_LAMP_FIRST].w,0);assert.equal(shadowLights.lamp[CAMP_LAMP_FIRST],null);
 const client=powerFixture(false).power;for(let i=0;i<200;i++){client.localHolding=true;client.update(.05);}assert.equal(client.progress,0);assert.equal(client.running,false);
});
test('power snapshots are bounded, monotone, reset-safe and merge even when speaker revision is unchanged',()=>{
 const{power}=powerFixture(false);power.netMerge([500,0]);power.netMerge([100,0]);assert.equal(power.progress,.5);
 for(const a of[[1001,0],[-1,0],[NaN,1],[500,'true'],null,[]])power.netMerge(a);assert.equal(power.running,false);
 const exp={power,speaker:{rev:0}};Expedition.prototype.netMerge.call(exp,[0,0,0,1000,1]);assert.equal(power.running,true);
 power.reset();assert.equal(power.progress,0);assert.equal(power.running,false);
});
test('a forged guest speaker/power event cannot switch on the host-authoritative local grid',()=>{
 let merges=0;const n=new NetSync({remotes:new Map(),expedition:{netMerge(){merges++;}}},{isHost:false,hostId:'host'});
 n.event(['spe',[0,0,0,1000,1]],'guest',false);assert.equal(merges,0);
 n.event(['spe',[0,0,0,1000,1]],'host',true);assert.equal(merges,1);
});
test('pixel packets round trip exactly, are small, and discard malformed data instead of fetching URLs',()=>{
 const pixels=Uint8Array.from({length:768},(_,i)=>(i*37)%5===0?1:0),bits=encodePixels(pixels);
 assert.equal(bits.length,SCREEN_HEX);assert.deepEqual(decodePixels(bits),pixels);
 const clean=cleanScreen({bits:'https://example.com/a.png',text:'A'.repeat(900),url:'unsafe'});
 assert.equal(clean.bits,DEFAULT_SCREEN.bits);assert.equal(clean.text.length,24);assert.deepEqual(Object.keys(clean).sort(),['bits','text']);
 assert.ok(JSON.stringify(cleanFit({head:'screen',screen:{bits,text:'НЕ ШУМИ'}})).length<700);
});
test('mouse/touch lines fill every crossed pixel; eraser and text work in both alphabets',()=>{
 const p=new Uint8Array(768);paintLine(p,0,0,31,23);assert.ok(p.reduce((a,b)=>a+b)>31);paintLine(p,0,0,31,23,0);assert.equal(p.reduce((a,b)=>a+b),0);
 const empty=encodePixels(p),ru=composeScreen({bits:empty,text:'НЕ ШУМИ'}),en=composeScreen({bits:empty,text:'BE QUIET'});
 assert.ok(ru.some(Boolean)&&en.some(Boolean));assert.notDeepEqual(ru,en);assert.equal(ru.length,768);
});
test('five monster portrait presets are distinct, editable bitmaps, not remote image dependencies',()=>{
 const images=SCREEN_PRESETS.map(id=>encodePixels(presetPixels(id)));assert.equal(new Set(images).size,SCREEN_PRESETS.length);
 for(const id of['listener','crawler','watcher','howler','shade'])assert.ok(presetPixels(id).reduce((a,b)=>a+b)>35,id);
});
test('free CRT geometry changes with the artwork, colours do not, and the fullest survivor fits all echo buffers',()=>{
 assert.equal(owns('screen'),true);
 const a=cleanFit({head:'screen'}),b=cleanFit({...a,screen:{bits:encodePixels(presetPixels('crawler')),text:'ПРИВЕТ'}});
 assert.notEqual(fitKey(a),fitKey(b));assert.notEqual(shapeKey(a),shapeKey(b));assert.equal(shapeKey(a),shapeKey({...a,hc:['#112233','#445566']}));
 const bits=encodePixels(Uint8Array.from({length:768},(_,i)=>(i+Math.floor(i/32))%2));
 for(const body of ITEMS.body){const rig=buildSurvivor(cleanFit({head:'screen',body:body.id,screen:{bits}}));const n=rig.parts.reduce((n,p)=>n+p.arr.count,0);assert.ok(n<8192);assert.ok(rig.parts.every(p=>p.arr.pos.every(Number.isFinite)));}
 assert.ok(screenRects({bits:'f'.repeat(192)}).length<=24,'solid fill should use rows, not 768 individual boxes');
});

test('the physical atlas can still build every place, including the new local generator and wall cabinet',()=>{
 const mat=new THREE.MeshBasicMaterial(),w=realWorld();
 for(const id of['camp','cabin','medhut','tower','stones','wreck','firetower','zarya','sovkhoz']){
  const model=buildModel(id,mat,{world:w});assert.ok(model.root.children.length>0,id);
  model.root.traverse(o=>{if(o.geometry){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));o.geometry.dispose();}});
 }
 mat.dispose();
});
