import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Angler, isolatedTarget } from '../src/game/angler.js';
import { buildAngler, poseAngler } from '../src/game/anglerModel.js';
import { CFG } from '../src/core/config.js';
import { NetSync } from '../src/game/netsync.js';
import { Player } from '../src/game/player.js';
import { Rescue } from '../src/game/rescue.js';
import { cleanFit, owns, DEFAULT_FIT } from '../src/game/outfit.js';
import { buildSurvivor, poseSurvivor, poseKeanu } from '../src/game/survivor.js';
import { departureBeat, latePassenger, DEPARTURE } from '../src/ui/departure.js';

function fixture(auth=true) {
  const p={id:'me',alive:true,x:0,y:0,z:0,yaw:0,pitch:0,eyeCur:1.6};
  const mate={id:'mate',alive:true,x:100,y:0,z:0,useHeld:false};
  const messages=[];
  const g={auth,online:true,state:'play',time:60,day:3,player:p,remotes:new Map([['mate',mate]]),input:{useHeld:false},
    world:{terrain:{height:()=>0},anglerTrees:[{x:0,z:40,y:0}],navigation:{free:()=>true,beginFrame(){},next:(_,goal)=>goal},col:{resolve(){}},losBlocked:()=>false},
    rng:{next:()=>0},livePlayers(){return [p,mate].filter(q=>q.alive);},playerById(id){return id===p.id?p:this.remotes.get(id)||null;},
    sync:{ev:(...a)=>messages.push(a)},hud:{flashAlert(){},setUse(){},setIntro(){},setHint(){}},fx:{fade:1},enterSpectate(){this.spectate=true;},checkTeam(){this.checked=true;},nameOf:q=>q.id};
  const a=g.angler=new Angler(g);return {g,a,p,mate,messages};
}
function grabbed() {const f=fixture();assert.ok(f.a.begin(f.p));assert.ok(f.a.grab(f.p));return f;}

test('isolation: a companion within 32 m protects you, dead companions do not',()=>{
  const a={alive:true,x:0,z:0},b={alive:true,x:31,z:0};
  assert.equal(isolatedTarget([a,b],()=>false),null);
  b.x=33;assert.equal(isolatedTarget([a,b],()=>false),a);
  b.alive=false;b.x=1;assert.equal(isolatedTarget([a,b],()=>false),a);
  assert.equal(isolatedTarget([a,b],p=>p===a),null);
});
test('no Angler before night 3 or on the training ground',()=>{
  const {g,a}=fixture();g.day=2;a.update(1);assert.equal(a.phase,'idle');
  g.day=3;g.state='training';a.update(1);assert.equal(a.phase,'idle');
  g.state='play';a.update(1);assert.equal(a.phase,'stalk');
});
test('abduction selects an actual non-stump tree, rejects maps without reachable trees',()=>{
  const {g,a,p}=fixture();const tree=a.chooseTree(p);assert.equal(tree.z,40);assert.ok(tree.bound);
  g.world.navigation.free=()=>false;assert.equal(a.chooseTree(p),null);assert.equal(a.begin(p),false);
});
test('captured player is immobilised but look remains available',()=>{
  const world={spawn:{x:0,z:0,yaw:0},terrain:{height:()=>0},col:{resolve:()=>({hit:false})}};
  const p=new Player(world);p.anglerHold=true;p.vx=10;
  p.update(.1,{move:{x:1,y:1},turn:0,sprint:true,crouch:false},{dx:.2,dy:.1});
  assert.equal(p.x,0);assert.equal(p.z,0);assert.equal(p.sprinting,false);assert.equal(p.yaw,-.2);
});
test('voice knock-out integrates duration, not packet spam; quiet voices do not trigger it',()=>{
  const {a,p}=grabbed();a.move=()=>false;
  for(let i=0;i<30;i++){a.hear(p.id,.3,'voice');a.update(.1);}assert.equal(a.koUntil,0);
  for(let i=0;i<100;i++)a.hear(p.id,1,'voice');assert.equal(a.anger,0,'packets alone do not advance the meter');
  for(let i=0;i<20;i++){a.hear(p.id,1,'voice');a.update(.1);}
  assert.ok(a.koUntil>a.clock);assert.equal(a.unconscious,true);assert.ok(p.alive);
});
test('a shout from a different player or a stone cannot knock out the captive',()=>{
  const {a,p}=grabbed();a.move=()=>false;
  for(let i=0;i<30;i++){a.hear('mate',1,'voice');a.hear(p.id,1,'stone');a.update(.1);}assert.equal(a.koUntil,0);
});
test('five-minute deadline starts at the tree, not at capture, and survives dawn/night clock resets',()=>{
  const {a,g}=grabbed();a.clock=42;a.bind();const deadline=a.deadline;
  assert.equal(deadline-a.clock,300);
  g.state='morning';g.time=0;a.move=()=>false;a.update(30);
  assert.equal(a.deadline,deadline);assert.equal(a.deadline-a.clock,270);
  g.state='dusk';a.update(3);assert.equal(a.deadline-a.clock,267);
});
test('rescue needs a living, nearby, unobstructed ally continuously holding interact',()=>{
  const {a,p,mate,g}=grabbed();a.bind();a.move=()=>false;
  mate.x=a.px+1;mate.z=a.pz;mate.useHeld=true;
  for(let i=0;i<20;i++)a.update(.1);assert.equal(a.phase,'bound');
  mate.useHeld=false;a.update(.1);assert.equal(a.freeT,0);
  mate.useHeld=true;g.world.losBlocked=()=>true;a.update(1);assert.equal(a.freeT,0);
  g.world.losBlocked=()=>false;for(let i=0;i<34;i++)a.update(.1);
  assert.equal(a.phase,'cooldown');assert.equal(p.anglerHold,false);assert.equal(p.alive,true);
});
test('expiration returns the butcher, plays a POV finish, then permanently excludes revival this run',()=>{
  const {a,g,p}=grabbed();a.bind();a.clock=a.deadline+.01;a.x=a.tree.goal.x;a.z=a.tree.goal.z;
  a.update(.01);assert.equal(a.phase,'finish');assert.equal(p.alive,true);
  a.update(CFG.ANGLER.FINISH_SECONDS+.01);
  assert.equal(p.alive,false);assert.equal(p.consumed,true);assert.equal(p.gone,true);assert.equal(g.spectate,true);
  assert.equal(a.phase,'cooldown');assert.ok(a.dead.has(p.id));
  let revived=0;Rescue.prototype.dawnSweep.call({g,downed:()=>[p],revive(){revived++;}});assert.equal(revived,0);
});
test('unreachable drag releases the victim instead of imprisoning or teleporting forever',()=>{
  const {a,p}=grabbed();a.move=()=>false;
  a.update(CFG.ANGLER.MAX_DRAG+1);assert.equal(a.phase,'cooldown');assert.equal(p.anglerHold,false);assert.equal(p.alive,true);
});
test('host snapshots are monotonic, validate coordinates, and reliably repeat permanent death',()=>{
  const host=grabbed(),client=fixture(false);const d=host.a.snapshot();
  assert.ok(client.a.apply(d));assert.equal(client.a.victim,'me');assert.equal(client.p.anglerHold,true);
  assert.equal(client.a.apply(d),false);assert.equal(client.a.apply({...d,seq:d.seq+1,x:NaN}),false);
  assert.equal(client.a.apply({...d,seq:d.seq+1,x:99999}),false);
  host.a.dead.add('me');host.a.release(false);host.a.phase='cooldown';
  client.a.apply(host.a.snapshot());assert.equal(client.p.consumed,true);assert.equal(client.p.alive,false);
});
test('non-host cannot forge Angler events or snapshots; captive cannot issue inventory actions',()=>{
  const {g,a,p}=grabbed();let claims=0;g.inventory={hostClaim(){claims++;}};
  const sync=new NetSync(g,{isHost:true,hostId:'me'});
  sync.handle('ibc',['x','y','z'],p.id);assert.equal(claims,0);
  const f=fixture(false),s=new NetSync(f.g,{isHost:false,hostId:'host'});const d=a.snapshot();
  s.handle('ev',['ag',d],'stranger');assert.equal(f.a.phase,'idle');
  s.handle('sn',{m:[],a:d},'stranger');assert.equal(f.a.phase,'idle');
  s.handle('ev',['ag',d],'host');assert.equal(f.a.phase,'drag');
});
test('reset clears captivity, KO and permanent death list for the next run',()=>{
  const {a,p}=grabbed();a.dead.add('mate');a.koUntil=999;a.reset();
  assert.equal(a.phase,'idle');assert.equal(p.anglerHold,false);assert.equal(a.dead.size,0);assert.equal(a.unconscious,false);
});
test('procedural butcher/lantern/rope model has finite geometry and no extra materials or contexts',()=>{
  const material=new THREE.MeshBasicMaterial(),m=buildAngler(material);assert.ok(m.nodes.lantern);
  let triangles=0;m.root.traverse(o=>{if(o.geometry){assert.equal(o.material,material);const a=o.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));triangles+=a.length/9;}});
  assert.ok(triangles<2500);poseAngler(m,3,1,1);assert.ok(Number.isFinite(m.nodes['arm-1'].rotation.x));poseAngler(m,3,0,1.8);const raised=m.nodes['arm-1'].rotation.x;poseAngler(m,3,0,2.5);assert.ok(m.nodes['arm-1'].rotation.x>raised,'windup is followed by an actual downward strike');m.dispose();material.dispose();
});
test('Keanu is free, cleanly persists over the existing outfit protocol, and preserves old defaults',()=>{
  const fit=cleanFit({head:'keanuhair',body:'keanusuit'});assert.equal(fit.head,'keanuhair');assert.equal(fit.body,'keanusuit');
  assert.ok(owns(fit.head)&&owns(fit.body));assert.equal(DEFAULT_FIT.head,'hood');assert.equal(DEFAULT_FIT.body,'jacket');
});
test('Keanu idle draws, plays and stows a real rigged guitar, cancelled for movement/departure',()=>{
  const rig=buildSurvivor({head:'keanuhair',body:'keanusuit'});poseSurvivor(rig,0,0,false,false);
  assert.equal(poseKeanu(rig,0),false);assert.equal(rig.nodes.guitar.visible,false);
  assert.equal(poseKeanu(rig,3),false);assert.equal(rig.nodes.guitar.visible,true);
  assert.equal(poseKeanu(rig,6),true);const angle=rig.nodes.elR.rotation.x;poseKeanu(rig,6.1);assert.notEqual(rig.nodes.elR.rotation.x,angle);
  assert.equal(poseKeanu(rig,14),false);assert.equal(rig.nodes.guitar.visible,false);
  poseKeanu(rig,6,false);assert.equal(rig.nodes.guitar.visible,false);
});
test('departure picks exactly one deterministic late passenger; solo keeps its driver',()=>{
  assert.equal(latePassenger([0,1,2,3]),3);assert.equal(latePassenger([0,2]),2);assert.equal(latePassenger([0]),-1);
});
test('all boarding completes before driving; stumbling, recovery and chase precede the fade',()=>{
  assert.equal(departureBeat(DEPARTURE.boardEnd).board,1);assert.equal(departureBeat(DEPARTURE.boardEnd).drive,0);
  assert.ok(departureBeat(4).fall>0);assert.equal(departureBeat(5).chase,false);assert.equal(departureBeat(6).chase,true);
  assert.equal(departureBeat(6).fade,1);assert.equal(departureBeat(11).done,true);
});

test('the next run rejects delayed snapshots from the previous run',()=>{
  const host=grabbed(),f=fixture(false);f.g.baseSeed=9;
  assert.equal(f.a.apply(host.a.snapshot()),false);assert.equal(f.a.phase,'idle');
});
test('a captive host still broadcasts release/death to guests; authority is not blocked by captivity',()=>{
  const f=fixture(false),wire=new NetSync(f.g,{isHost:false,hostId:'mate'}),d=grabbed().a.snapshot();
  wire.handle('ev',['ag',{...d,victim:'mate'}],'mate');assert.equal(f.a.victim,'mate');
  wire.handle('ev',['ag',{...d,seq:d.seq+1,victim:null,phase:'cooldown'}],'mate');
  assert.equal(f.a.phase,'cooldown');assert.equal(f.a.victim,null);
});
test('clearing old captivity on reset cannot teleport the new spawn back to the previous tree',()=>{
  const {a,p}=grabbed();a.px=123;a.pz=50;p.x=7;p.z=8;a.reset();assert.equal(p.x,7);assert.equal(p.z,8);
});
test('four real garage rigs board before departure, keep one runner, and restore on cancellation',async()=>{
  const old=globalThis.document;
  const ctx=new Proxy({}, {get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx,addEventListener(){},style:{}}),getElementById:()=>null};
  let garage;
  try {
    const {Garage}=await import('../src/ui/garage.js');
    garage=new Garage({renderer:null,post:{u:{}},audio:null});
    garage.setPlayers([0,1,2,3].map(slot=>({id:'p'+slot,name:'p'+slot,slot,fit:DEFAULT_FIT})));
    garage.startDepart(()=>{});const initial=garage.carRoot.position.x;
    for(let i=0;i<300;i++){garage.t+=1/60;garage._departure(1/60);garage._figures(1/60);}
    assert.deepEqual([...garage.depart.boarded],[1,2]);assert.equal(garage.carRoot.position.x,initial);
    assert.ok(garage.figs[1].rig.root.parent===garage.carMesh);assert.ok(garage.figs[2].rig.root.parent===garage.carMesh);
    assert.notEqual(garage.figs[3].rig.root.parent,garage.carMesh);assert.equal(garage.figs[1].leaving,false);
    for(let i=0;i<100;i++){garage.t+=1/60;garage._departure(1/60);garage._figures(1/60);}
    assert.ok(garage.carRoot.position.x<initial);assert.equal(garage.depart.laggard,3);
    garage._endDepart();assert.equal(garage.figs[1].rig.root.parent,garage.scene);
    assert.ok(Math.abs(garage.figs[3].rig.root.rotation.z)<1e-8);
  } finally {if(garage){for(let i=0;i<4;i++)garage._dropFig(i);}globalThis.document=old;}
});

test('guest rescuers receive the real hold progress, not a permanently empty progress ring',()=>{
  const host=grabbed(),guest=fixture(false);host.a.bind();host.a.freeT=1.5;host.a.freeBy='mate';
  assert.ok(guest.a.apply(host.a.snapshot()));assert.equal(guest.a.freeT,1.5);assert.equal(guest.a.freeBy,'mate');
});
test('bound body orientation stays fixed while the butcher walks away or turns back',()=>{
  const {a,p}=grabbed();a.tree.yaw=.7;a.bind();p.rig=buildSurvivor();
  a.yaw=2;a.poseVictim(p);const yaw=p.rig.root.rotation.y;a.yaw=-1;a.poseVictim(p);
  assert.equal(yaw,.7);assert.equal(p.rig.root.rotation.y,.7);
});
