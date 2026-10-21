// The Angler: one low-poly butcher, built with the forest's material and light rules.
import * as THREE from 'three';
import { MeshBuilder, KIND as K } from '../world/builder.js';

export function buildAngler(material) {
  const root = new THREE.Group(), nodes = {}, geometries = [];
  function part(name, parent, at, build) {
    const n = new THREE.Group(); n.position.set(...at); parent.add(n); nodes[name] = n;
    const b = new MeshBuilder(256); build(b); const geo = b.toGeometry(); geometries.push(geo);
    n.add(new THREE.Mesh(geo, material)); return n;
  }
  const belly = part('belly', root, [0,1.05,0], b => {
    b.place(0,-.5,0,0,Math.PI/8,0,1.25,1,.95);b.cylinder(8,.36,.65,.65,K.FLESH);
    b.place(0,.15,0,0,Math.PI/8,0,1.25,1,.95);b.cylinder(8,.65,.5,.65,K.FLESH);
    b.place(0,.8,0,0,Math.PI/8,0,1.25,1,.95);b.cylinder(8,.5,.27,.25,K.FLESH);
    b.place(0,-.55,.46); b.taper(.98,.1,1.1,.12,1.4,K.BONE); // heavy, stained apron
    for(const s of [-1,1]) { b.place(s*.31,.8,.35,0,0,s*.3); b.box(.08,.55,.045,K.EFFIGY); }
    b.place(0,.35,-.52); b.box(.7,.08,.035,K.EFFIGY); // knot across his back
    b.place(0,.2,-.55); b.box(.12,.5,.04,K.EFFIGY);
  });
  part('head', belly, [0,1.2,.04], b => {
    b.identity(); b.octa(.28,.32,K.FLESH);
    b.place(0,.21,-.015); b.box(.46,.15,.37,K.WOOD);
    for(const s of [-1,1]) { b.place(s*.1,.035,.22); b.box(.075,.025,.025,K.ROCK); }
    b.place(0,-.12,.22); b.box(.22,.11,.04,K.METAL); // old breathing muzzle
  });
  for(const s of [-1,1]) {
    part('leg'+s, root, [s*.34,1.12,0], b => {
      b.identity(); b.limb([0,0,0],[0,-.82,.05],.21,.15,K.WOOD,6);
      b.place(0,-.93,.12); b.box(.33,.3,.53,K.ROCK);
    });
    const arm = part('arm'+s, belly, [s*.72,.77,0], b => {
      b.identity(); b.limb([0,0,0],[s*.08,-.7,.05],.2,.14,K.FLESH,6);
      b.limb([s*.08,-.7,.05],[s*.06,-1.03,.13],.14,.12,K.FLESH,6);
      b.place(s*.06,-1.04,.13); b.box(.22,.24,.22,K.FLESH);
    });
    if(s===1) part('lantern', arm, [.06,-1.36,.13], b => {
      b.identity(); b.limb([0,.2,0],[0,.43,0],.025,.025,K.METAL,4);
      b.place(0,0,0); b.cylinder(6,.17,.17,.06,K.METAL);
      b.place(0,.24,0); b.cone(6,.22,.12,K.METAL);
      b.place(0,.08,0); b.cylinder(6,.105,.1,.19,K.EYE);
      for(let i=0;i<4;i++) {const a=i*Math.PI/2;b.identity();b.limb([Math.sin(a)*.14,0,Math.cos(a)*.14],[Math.sin(a)*.14,.23,Math.cos(a)*.14],.016,.016,K.METAL,4);}
    });
  }
  const ropes = new THREE.Group(), b = new MeshBuilder(128); root.add(ropes);
  for(const y of [.55,.83,1.05]) for(let i=0;i<14;i++) {
    const a=i*Math.PI/7,c=(i+1)*Math.PI/7;
    b.identity();b.limb([Math.cos(a)*.34,y,Math.sin(a)*.29],[Math.cos(c)*.34,y,Math.sin(c)*.29],.018,.018,K.WOOD,3);
  }
  const rg=b.toGeometry();geometries.push(rg);ropes.add(new THREE.Mesh(rg,material));
  // Ropes live in world space; they must not follow the butcher when he leaves.
  root.remove(ropes);
  return {root,nodes,ropes,dispose(){for(const g of geometries)g.dispose();root.removeFromParent();ropes.removeFromParent();}};
}

export function poseAngler(model, t, moving, finish=0) {
  const n=model.nodes, s=Math.sin(t*4.3);
  const lean=Math.min(1,finish);
  n.belly.rotation.x=lean*.12;
  n.belly.rotation.z=s*.045*moving;
  n.head.position.z=.04+lean*.2;
  n.head.rotation.x=lean*.45;
  n['leg-1'].rotation.x=s*.34*moving; n.leg1.rotation.x=-s*.34*moving;
  const windup=Math.min(1,finish/1.6),strike=Math.max(0,Math.min(1,(finish-2.1)/.4));
  n['arm-1'].rotation.x=finish ? -2.65*windup+1.8*strike : .15+s*.13*moving;
  n.arm1.rotation.x=-.12-s*.12*moving;
  n.arm1.rotation.z=Math.sin(t*1.8)*.06;
  n.head.rotation.y=finish?0:Math.sin(t*.65)*.2;
}
