// HUSH 1.12: deterministic footpaths, real lit material, menu input and physically shared wardrobe.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ForestTrails } from '../src/world/trails.js';
import { Collision } from '../src/world/collision.js';
import { MeshBuilder, KIND } from '../src/world/builder.js';
import { World, LANDMARKS } from '../src/world/world.js';
import { buildAtlasDesk } from '../src/ui/garageStudio.js';
import { Wardrobe } from '../src/ui/wardrobe.js';
import { Input } from '../src/input/input.js';
import { item, owns } from '../src/game/outfit.js';

function flatWorld(){return{seed:1337,half:300,lake:null,col:new Collision(300),terrain:{height:()=>0},props:[],addProp(x,z,build){this.props.push({x,z,build});}};}
test('a route bends around walls and cannot cut a diagonal corner',()=>{
 const w=flatWorld();w.col.add(0,-10,0,10,1,3);const t=new ForestTrails(w),p=t.route({x:-14,z:0},{x:14,z:0});
 assert.ok(p?.length>25);assert.ok(p.some(p=>Math.abs(p.z)>11));
 for(let i=1;i<p.length;i++)assert.ok(t.clear(p[i-1],p[i]),'every interpolated section is walkable');
});
test('paths stay outside the lake and are deterministic, not tied to pickup RNG',()=>{
 const w=flatWorld();w.lake={x:0,z:0,r:7};const a=new ForestTrails(w),b=new ForestTrails(w),from={x:-18,z:0},to={x:18,z:0};
 const pa=a.route(from,to),pb=b.route(from,to);assert.deepEqual(pa,pb);assert.ok(pa);
 for(const p of pa)assert.ok(Math.hypot(p.x,p.z)>10.8);
});
test('the real forest connects all main destinations; no new trunk or log blocks the corridor',()=>{
 const w=new World(new THREE.Scene(),new THREE.MeshBasicMaterial()).generate(),t=w.trails;
 for(const id of['camp','cabin','tower','stones','wreck','firetower','zarya','yard','medhut','cabin3','cabin4','cabin5'])assert.ok(t.nodes.has(id),id);
 assert.equal(t.routes.length,20);assert.ok(t.length>1000&&t.length<2300);assert.ok(t.vertices>30000&&t.vertices<90000);
 for(const r of t.routes)for(const p of r.points) {
  assert.ok(w.col.free(p.x,p.z,.28),`${r.from} -> ${r.to} blocked at ${p.x},${p.z}`);
  assert.ok(t.near(p.x,p.z,.5));
 }
 const reached=new Set(['camp']);for(let i=0;i<20;i++)for(const r of t.routes){if(reached.has(r.from))reached.add(r.to);if(reached.has(r.to))reached.add(r.from);}
 for(const id of['cabin','tower','stones','wreck','firetower','zarya','yard','medhut','cabin3','cabin4','cabin5'])assert.ok(reached.has(id),`${id} must be reachable from camp`);
 for(const m of w.meshes)m.geometry.dispose();w.material.dispose();
});
test('baked paths contain earth, ruts and encroaching grass, never emissive eye/shard geometry',()=>{
 const w=flatWorld(),t=new ForestTrails(w).generate(LANDMARKS).build(),b=new MeshBuilder();
 for(const p of w.props)p.build(b);
 const a=b.toArrays(),kinds=new Set();for(let i=0;i<a.count;i++)kinds.add(a.dat[i*4+3]);
 for(const k of[KIND.TRAIL,KIND.TRAIL_GRASS,KIND.TRAIL_RUT])assert.ok(kinds.has(k));
 assert.ok(!kinds.has(KIND.EYE)&&!kinds.has(KIND.SHARD));assert.ok(a.pos.every(Number.isFinite));
});
test('a baked mesh append keeps material/hidden-edge bytes and honours its placement matrix',()=>{
 const a=new MeshBuilder();a.tri([0,0,0],[1,0,0],[0,1,0],KIND.TRAIL,7);const data=a.toArrays(),b=new MeshBuilder(1);
 b.place(2,3,4);b.append(data);const out=b.toArrays();assert.equal(out.count,3);assert.deepEqual([...out.dat],[...data.dat]);
 assert.deepEqual([...out.pos],[2,3,4,3,3,4,2,4,4]);
});
test('the atlas keeps its finite book-desk furniture without adding a dressing cabinet',()=>{
 for(const a of[buildAtlasDesk()]){assert.ok(a.count>200&&a.count<5000);assert.ok(a.pos.every(Number.isFinite));}
 assert.ok(owns('boykisser'),'the free existing outfit stays free');assert.equal(item('trueno').slot,'car');
});
test('Enter/Space on native menu controls never also emits global confirm/start/skip',()=>{
 const ow=globalThis.window,od=globalThis.document,listeners=new Map();
 try {
  globalThis.window={addEventListener:(name,fn)=>listeners.set(name,fn)};globalThis.document={addEventListener(){}};
  const input=new Input({addEventListener(){}}),down=listeners.get('keydown');
  for(const code of['Enter','NumpadEnter','Space'])down({code,target:{closest:()=>({}),tagName:'BUTTON'},preventDefault:()=>assert.fail('native activation must remain available')});
  assert.deepEqual(input.consume(),[]);
  down({code:'Enter',target:{closest:()=>null,tagName:'BODY'},preventDefault(){}});assert.deepEqual(input.consume(),['confirm']);
 } finally {if(ow===undefined)delete globalThis.window;else globalThis.window=ow;if(od===undefined)delete globalThis.document;else globalThis.document=od;}
});

test('paint/catalogue modes never hide the shop catalogue when opening it from a colour view',()=>{
 const attrs=[],w=Object.create(Wardrobe.prototype);w.mode='paint';w.slot='shop';w.el={dataset:{},querySelectorAll:()=>[{dataset:{wrMode:'items'},setAttribute:(k,v)=>attrs.push([k,v])}]};
 w._renderMode();assert.equal(w.mode,'items');assert.equal(w.el.dataset.mode,'items');assert.deepEqual(attrs,[['aria-pressed','true']]);
 w.slot='body';w.setMode('paint');assert.equal(w.el.dataset.mode,'paint');
});
