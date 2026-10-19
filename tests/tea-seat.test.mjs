import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GET_UP_SECONDS, TEA_SEAT, teaSeatMotion } from '../src/ui/teaSeat.js';
import { Garage } from '../src/ui/garage.js';
import { GarageStudio } from '../src/ui/garageStudio.js';
import { buildSurvivor, poseSurvivor } from '../src/game/survivor.js';
import { cleanFit } from '../src/game/outfit.js';
import { DRUM_AT } from '../src/ui/garageSet.js';

const fixture=(age=0,phase='sip',t=.8)=>{
 const rig=buildSurvivor(cleanFit()),m=teaSeatMotion(age,.42);
 rig.root.position.fromArray(m.root);rig.root.rotation.y=m.yaw;poseSurvivor(rig,0,0,false,false);
 const f={rig,st:{phase,t,next:4},look:{yaw:0,pitch:0},id:'menu',slot:1};
 const g={t:2,cut:age?{t:1.3+m.rc}:null,cup:new THREE.Object3D(),cupHome:new THREE.Vector3(DRUM_AT[0]-.08,.92,DRUM_AT[2]+.12),voice:null,smoke:{emit(){}},_applyLook:Garage.prototype._applyLook};
 Garage.prototype._chair.call(g,f,.016);rig.root.updateMatrixWorld(true);return{g,f,m};
};

test('the menu survivor uses the existing tea chair, not an extra platform or cabinet',()=>{
 const m=teaSeatMotion(0);
 assert.deepEqual(m.root,TEA_SEAT.pos);assert.equal(m.yaw,TEA_SEAT.yaw);assert.equal(m.up,0);
 assert.equal('reflect' in GarageStudio.prototype,false);assert.equal('_mirror' in GarageStudio.prototype,false);
});
test('the cup reaches the mouth during a sip and is on the drum before standing',()=>{
 const seated=fixture();assert.equal(seated.f.rig.nodes.hips.position.y,.55);
 const mouth=seated.f.rig.nodes.head.localToWorld(new THREE.Vector3(0,-.07,.15));assert.ok(seated.g.cup.position.distanceTo(mouth)<.001);
 const putting=fixture(GET_UP_SECONDS*.4);assert.equal(putting.m.up,0);assert.ok(putting.g.cup.position.distanceTo(putting.g.cupHome)<.001);
 const standing=fixture(GET_UP_SECONDS);assert.equal(standing.m.up,1);assert.equal(standing.f.rig.nodes.hips.position.y,.94);assert.ok(standing.g.cup.position.distanceTo(standing.g.cupHome)<.001);
});
test('turning the standing preview does not move it back into the chair or drum',()=>{
 for(let yaw=-Math.PI*4;yaw<Math.PI*4;yaw+=.2) {
  const m=teaSeatMotion(GET_UP_SECONDS,yaw),actual=[m.root[0]+Math.sin(m.yaw)*.36,m.root[2]+Math.cos(m.yaw)*.36];
  assert.ok(Math.abs(actual[0]-m.anchor[0])<1e-9&&Math.abs(actual[1]-m.anchor[2])<1e-9);
  assert.ok(Math.hypot(actual[0]-DRUM_AT[0],actual[1]-DRUM_AT[2])>.7);
 }
});
test('sit/put down/stand poses and both arms stay finite throughout the reversible transition',()=>{
 let previous=null;
 for(let age=0;age<=GET_UP_SECONDS+.01;age+=.02) {
  const{f,m}=fixture(age);
  for(const p of f.rig.parts)assert.ok(p.node.matrixWorld.elements.every(Number.isFinite));
  if(previous)assert.ok(Math.hypot(m.root[0]-previous.root[0],m.root[2]-previous.root[2])<.2,'no root teleport');
  previous=m;
 }
});
