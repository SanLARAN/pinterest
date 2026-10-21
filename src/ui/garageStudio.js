// The same garage is the title screen, lobby and dressing room. One live renderer, no floating avatar.
import * as THREE from 'three';
import { MeshBuilder } from '../world/builder.js';
import { clamp, damp, RNG } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { myFit, cleanFit, fitKey } from '../game/outfit.js';
import { poseSurvivor, poseFur, poseKeanu } from '../game/survivor.js';
import { GET_UP_SECONDS, teaSeatMotion } from './teaSeat.js';
import { Mannequin } from './mannequin.js'; // only lazily used for the small, cached catalogue stills

const FOCUS={body:{y:1.02,h:2.5,w:1.35},head:{y:1.72,h:1.05,w:1.05},car:{y:.8,h:2.3,w:4.9}};
const v3=new THREE.Vector3();
const box=(b,x,y,z,w,h,d,kind=4,rz=0)=>{b.place(x,y,z,0,0,rz);b.box(w,h,d,kind);};

export function buildAtlasDesk() {
  const b=new MeshBuilder(700);
  box(b,.25,.76,2.29,1.32,.07,.77,4);
  for(const x of[-.31,.81])for(const z of[2.0,2.59])box(b,x,.36,z,.065,.72,.065,5);
  box(b,.25,.15,2.29,1.14,.035,.57,4);
  // Tin mug and flashlight beside the journal.
  b.place(.76,.82,2.1);b.cylinder(8,.055,.058,.13,5,{capBottom:true});
  b.place(.75,.81,2.48,0,0,.08);b.box(.038,.03,.21,5);
  // The desk lamp and its bent neck.
  box(b,-.22,.82,2.08,.17,.025,.15,5);
  b.identity();b.limb([-.22,.84,2.08],[-.25,1.21,2.1],.014,.012,5,5);b.limb([-.25,1.21,2.1],[.04,1.37,2.13],.012,.01,5,5);
  b.place(.05,1.31,2.13,0,0,-.2);b.cone(8,.12,.09,5,{capBottom:false});
  b.place(.05,1.29,2.13);b.octa(.026,.025,44);
  return b.toArrays();
}

export class GarageStudio {
  constructor(garage) {
    this.g=garage;this.fitKey='';this.adapter=null;this.hover='';this.look=new THREE.Vector3(.2,.95,.8);
    garage._mesh(buildAtlasDesk());
    this.resident={rig:null,key:'',id:'menu-survivor',slot:1,t:0,look:{yaw:0,pitch:0,wy:0,wp:0,next:1,tgt:null,at:null},st:{phase:'sip',t:0},mat:garage._mat({uNeutral:{value:.18},uFill:{value:new THREE.Vector4(.2,.55,.8,.34)}})};
    // Reuse the lobby's proven tea/hand IK, without changing the real engine-start cutscene.
    this.chairView=Object.create(garage);this.chairView.cut=null;
    this.standAge=0;this.seatMotion=teaSeatMotion(0);this.ownsCup=false;
    this.carPreviewMat=garage._mat({uNeutral:{value:.65}});
    this.setFit(myFit());this._book();this._outside();
    this.bookAmount=0;this.bookWant=0;this.lastLang='';
  }
  setFit(fit) {
    const f=cleanFit(fit),key=fitKey(f);if(key===this.fitKey)return;
    this.fitKey=key;this.g._dress(this.resident,f);
    const root=this.resident.rig.root;if(!root.parent)this.g.scene.add(root);root.position.fromArray(this.seatMotion.root);
  }
  _book() {
    const g=this.g;this.book=new THREE.Group();this.book.position.set(.26,.827,2.32);this.book.rotation.y=-.2;g.scene.add(this.book);
    const b=new MeshBuilder(120);box(b,0,-.023,0,.58,.026,.4,4);box(b,.008,0,0,.55,.035,.37,31);box(b,-.282,0,0,.025,.064,.41,4);
    // A bookmark projects out from the pages; the atlas is recognisable without a label/button.
    box(b,.1,.006,.226,.038,.007,.12,6);g._mesh(b.toArrays(),g.matSet,this.book);
    this.bookLid=new THREE.Group();this.bookLid.position.set(-.292,.023,0);this.book.add(this.bookLid);
    const lid=new MeshBuilder(32);box(lid,.292,0,0,.584,.015,.412,4);g._mesh(lid.toArrays(),g.matSet,this.bookLid);
    this.bookCanvas=document.createElement('canvas');this.bookCanvas.width=768;this.bookCanvas.height=512;
    this.bookTexture=new THREE.CanvasTexture(this.bookCanvas);
    this.bookMat=new THREE.ShaderMaterial({uniforms:{map:{value:this.bookTexture},hover:{value:0}},
      vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform sampler2D map;uniform float hover;varying vec2 v;void main(){gl_FragColor=vec4(texture2D(map,v).rgb*(.82+hover*.18),1.);}'});
    this.bookFace=new THREE.Mesh(new THREE.PlaneGeometry(.57,.398),this.bookMat);this.bookFace.position.set(.292,.009,0);this.bookFace.rotation.x=-Math.PI/2;this.bookLid.add(this.bookFace);
    this.drawBook();
    document.fonts?.ready.then(()=>this.drawBook());
  }
  drawBook() {
    const c=this.bookCanvas.getContext('2d');c.fillStyle='#2e3c32';c.fillRect(0,0,768,512);
    const rng=new RNG(172);for(let i=0;i<1700;i++){c.fillStyle=i%2?'#e2d3a40b':'#00000012';c.fillRect(rng.int(0,767),rng.int(0,511),rng.int(1,14),rng.int(1,3));}
    c.strokeStyle='#a7a17d';c.lineWidth=3;c.strokeRect(28,27,712,458);c.strokeRect(36,35,696,442);
    c.fillStyle='#bfb895';c.textAlign='center';c.font='18px "JetBrains Mono",monospace';c.fillText(t('homeBookDept'),384,91);
    c.font='bold 95px "JetBrains Mono",monospace';c.fillText(t('homeBookTitle'),384,244,650);
    c.font='22px "JetBrains Mono",monospace';c.fillText(t('homeBookSub'),384,299,650);
    c.strokeStyle='#8c9670';c.beginPath();c.arc(384,374,30,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(355,374);c.lineTo(413,374);c.moveTo(384,344);c.lineTo(384,404);c.stroke();
    c.font='13px "JetBrains Mono",monospace';c.fillText('EX. 014  /  FIELD COPY  /  1986',384,451);
    this.bookTexture.needsUpdate=true;
  }
  _outside() {
    const b=new MeshBuilder(500),rng=new RNG(811);
    for(let i=0;i<20;i++) {const x=-5.1-rng.next()*4,z=-3.5+rng.next()*6.5,h=3+rng.next()*3;
      box(b,x,h*.4,z,.18,h*.8,.18,1);for(let k=0;k<3;k++){b.place(x,h*.35+k*h*.21,z);b.cone(5,.9-k*.2,h*.55,2);}}
    this.g._mesh(b.toArrays());
  }
  openBook(callback) { this.bookWant=1;this.bookCallback=callback;this.bookStarted=performance.now(); } // a second click replaces the wait, never wedges it
  cancelBook() { this.bookCallback=null;this.bookWant=0; }
  bookRect() {
    this.book.updateMatrixWorld(true);const a=[];
    for(const x of[-.32,.32])for(const z of[-.23,.23]) {const p=new THREE.Vector3(x,.045,z);this.book.localToWorld(p);p.project(this.g.camera);if(p.z>1||p.z< -1)return null;a.push(p);}
    const xs=a.map(p=>(p.x*.5+.5)*this.g.w),ys=a.map(p=>(.5-p.y*.5)*this.g.h);
    return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  }
  beginDressing() {
    if(this.g.view!=='menu') {
      this.standAge=0;
      this.resident.st={phase:'idle',t:0,next:3};
    }
  }
  frame(dt) {
    const g=this.g,dressing=g.view==='dressing',home=g.view==='menu',active=home||dressing,f=this.resident;
    if(active) this.standAge=clamp(this.standAge+(dressing?dt:-dt),0,GET_UP_SECONDS);
    this.seatMotion=teaSeatMotion(this.standAge,this.adapter?.orbit.yaw??.42);
    f.rig.root.visible=active&&(!this.adapter?.carOn||this.standAge<GET_UP_SECONDS);
    for(const peer of g.figs)if(peer)peer.rig.root.visible=!active;
    g.carRoot.rotation.y=dressing&&this.adapter?.carOn?this.adapter.orbit.yaw-.3:0;
    for(const mesh of g.carParts)if(mesh.material===g.matSet||mesh.material===this.carPreviewMat)mesh.material=dressing&&this.adapter?.carOn?this.carPreviewMat:g.matSet;
    g.carRoot.updateMatrixWorld(true);
    g.u.uHeadD.value.set(-1,-.04,0).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),g.carRoot.rotation.y);
    g._carPoint(g.CP.head[0],g.u.uHeadP0.value);g._carPoint(g.CP.head[1],g.u.uHeadP1.value);
    if(home)this.setFit(myFit());
    f.mat.uniforms.uNeutral.value=dressing ? .78 : .18;
    f.mat.uniforms.uHover.value=damp(f.mat.uniforms.uHover.value,(this.hover==='survivor'||g.studioHover)? .45:0,8,dt);
    g.u.uDesk.value.set(.05,1.29,2.13,.8);
    if(active) {
      const motion=this.seatMotion,n=f.rig.nodes;
      poseSurvivor(f.rig,g.t*.8,0,false,false);n.hips.rotation.set(0,0,0);
      f.rig.root.position.fromArray(motion.root);f.rig.root.rotation.set(0,motion.yaw,0);
      f.st.t+=dt;f.t+=dt;
      f.look.yaw=damp(f.look.yaw,home?Math.sin(g.t*.25)*.22+.2:0,4,dt);
      f.look.pitch=damp(f.look.pitch,Math.sin(g.t*.2)*.04,4,dt);
      this.chairView.cut=this.standAge>0?{t:1.3+motion.rc}:null;
      g._chair.call(this.chairView,f,dt);
      this.ownsCup=true;
      const gesture=this.adapter?.gesture;
      if(gesture) {
        gesture.t+=dt;
        if(motion.up>=.999) {const k=Math.sin(clamp(gesture.t/1.2,0,1)*Math.PI);n.shR.rotation.x-=k*(gesture.type==='hat'?1.5:.55);n.elR.rotation.x-=k*.8;}
        if(gesture.t>1.2)this.adapter.gesture=null;
      }
      poseFur(f.rig,dt);g._glow(f);
      const playing=poseKeanu(f.rig,g.t,!gesture);
      g.cup.visible=!f.rig.nodes.guitar?.visible;
      if(playing && g.audio?.ready && Math.floor(g.t*3)!==this.guitarBeat){this.guitarBeat=Math.floor(g.t*3);g.audio.guitarNote?.(this.guitarBeat);}
    } else if(this.ownsCup) {
      // The visible lobby chair owns the real mug again; never overwrite a friend's sip.
      if(!g.figs[1]||g.figs[1].leaving){g.cup.position.copy(g.cupHome);g.cup.rotation.set(0,0,0);}
      this.ownsCup=false;
    }
    if(this.adapter&&dressing)this.adapter.tick(dt);
    this.bookAmount=damp(this.bookAmount,this.bookWant,9,dt);this.bookLid.rotation.z=this.bookAmount*2.1;
    this.bookMat.uniforms.hover.value=damp(this.bookMat.uniforms.hover.value,this.hover==='book'?1:0,8,dt);
    if(this.bookCallback&&performance.now()-this.bookStarted>260) {const cb=this.bookCallback;this.bookCallback=null;cb();}
  }
  camera(dt) {
    const g=this.g,cam=g.camera,dressing=g.view==='dressing',portrait=g.w/g.h<.8;
    let target,pos;
    if(dressing&&this.adapter) {
      const a=this.adapter,r=a.host?.getBoundingClientRect(),f=FOCUS[a.focus]||FOCUS.body;
      if(!r||r.width<1||r.height<1)return;
      cam.fov=32;cam.setViewOffset(g.w,g.h,g.w/2-r.x-r.width/2,g.h/2-r.y-r.height/2,g.w,g.h);
      const d=Math.max(f.h*g.h/(Math.max(100,r.height)*.83*2*Math.tan(Math.PI*cam.fov/360)),f.w*g.h/(Math.max(100,r.width)*.83*2*Math.tan(Math.PI*cam.fov/360)))*a.orbit.zoom;
      target=a.carOn?new THREE.Vector3(.35,f.y,-.6):new THREE.Vector3(...this.seatMotion.anchor).add(v3.set(0,f.y-.39*(1-this.seatMotion.up),0));
      const yaw=a.carOn ? -.4 : 0,pitch=a.orbit.pitch;
      pos=target.clone().add(v3.set(Math.sin(yaw)*d,Math.sin(pitch)*d,Math.cos(yaw)*Math.cos(pitch)*d));
    } else {
      cam.clearViewOffset();cam.fov=portrait?44:38;
      target=portrait?new THREE.Vector3(1.5,.9,1.6):new THREE.Vector3(.4,.9,.8);
      pos=portrait?new THREE.Vector3(1.5,3.8,10.6):new THREE.Vector3(.7,2.65,7.8);
      if(g.w/g.h>2)pos.z+=1.2;
      pos.x+=(g.ptr.on?g.ptr.x:0)*.06;pos.y+=(g.ptr.on?g.ptr.y:0)*.025;
    }
    if(!this.cameraStarted) {cam.position.copy(pos);this.look.copy(target);this.cameraStarted=true;}
    else {cam.position.lerp(pos,1-Math.exp(-dt*6));this.look.lerp(target,1-Math.exp(-dt*6));}
    cam.lookAt(this.look);cam.near=.06;cam.far=60;cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
    g.ceiling.visible=cam.position.y<2.94;
  }

}

// Preserves the wardrobe's UI/preview API while moving its actual survivor into the shared 3D garage.
export class GarageMannequin {
  constructor(studio,onReturn=()=>{}) {
    this.studio=studio;this.g=studio.g;this.renderer=this.g.renderer;this.mode='menu';this.focus='body';this.host=null;this.onReturn=onReturn;
    this.orbit={yaw:.3,base:.3,pitch:.08,zoom:1,vyaw:0,idle:0};this.ptrs=new Map();this.gesture=null;this.carOn=false;this.bound=new WeakSet();
  }
  get rig(){return this.studio.resident.rig;}
  attach(host,mode) {
    this.host=host;this.mode=mode;
    if(mode==='stage'){this.studio.beginDressing();this.studio.adapter=this;this.g.open('dressing');this._bind(host);this.orbit.zoom=1;this.orbit.pitch=.08;}
    else {this.carOn=false;this.ptrs.clear();this.orbit.vyaw=0;this.gesture=null;this.studio.adapter=null;this.onReturn();}
  }
  setFit(fit,gesture=null){this.studio.setFit(fit);if(gesture)this.play(gesture);}
  setFocus(f){this.focus=f;this.orbit.zoom=1;}
  setMenuYaw(yaw){this.orbit.base=yaw;}
  setHover(on){this.g.studioHover=on;}
  pointerAt(x,y){this.g.pointer(x,y,true);}
  resize(){}
  ping(){const p=this.rig.nodes.head.getWorldPosition(new THREE.Vector3());this.g.ping(p.x,p.y,p.z,4,.13);}
  play(type){this.gesture={type,t:0};}
  showCar(id,colors){this.carOn=!!id;if(id)this.g.setCar(id,colors);else{const f=myFit();this.g.setCar(f.car,f.cc);this.g.u.uHeadI.value=0;this.g.u.uTail.value.w=0;this.g.carRoot.rotation.y=0;}}
  toggleLights(){this.g.u.uHeadI.value=this.g.u.uHeadI.value>.1?0:.75;}
  frame(dt){this.g.frame(dt);}
  headScreen(lift=.3){const p=this.rig.nodes.head.getWorldPosition(new THREE.Vector3());p.y+=lift;p.project(this.g.camera);const r=this.host?.getBoundingClientRect();return r&&!this.carOn?{x:(p.x*.5+.5)*this.g.w-r.x,y:(.5-p.y*.5)*this.g.h-r.y}:null;}
  still(fit,slot,canvas,view){if(!this.thumbs)this.thumbs=new Mannequin();this.thumbs.still(fit,slot,canvas,view);}
  tick(dt){if(!this.ptrs.size){this.orbit.yaw+=this.orbit.vyaw*dt;this.orbit.vyaw*=Math.exp(-dt*5);}this.orbit.idle+=dt;}
  _bind(host) {
    if(this.bound.has(host))return;this.bound.add(host);
    host.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();this.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:0,at:performance.now()});if(this.ptrs.size>1)for(const p of this.ptrs.values())p.pinched=true;host.setPointerCapture(e.pointerId);this._pinch=this._distance();this.onInteract?.();});
    host.addEventListener('pointermove',e=>{const p=this.ptrs.get(e.pointerId);if(!p)return;e.preventDefault();const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;p.moved+=Math.abs(dx)+Math.abs(dy);
      if(this.ptrs.size===2){const d=this._distance();if(this._pinch&&d)this.orbit.zoom=clamp(this.orbit.zoom*this._pinch/d,.65,1.65);this._pinch=d;}
      else {this.orbit.yaw+=dx*.009;this.orbit.pitch=clamp(this.orbit.pitch+dy*.003,-.1,.35);this.orbit.vyaw=dx*.05;}this.orbit.idle=0;});
    const end=e=>{const p=this.ptrs.get(e.pointerId);if(e.type==='pointerup'&&p&&!p.pinched&&p.moved<6&&performance.now()-p.at<350){this.ping();this.onTap?.();}this.ptrs.delete(e.pointerId);this._pinch=0;};host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.addEventListener('lostpointercapture',end);
    host.addEventListener('wheel',e=>{e.preventDefault();this.orbit.zoom=clamp(this.orbit.zoom+e.deltaY*.001,.65,1.65);this.onInteract?.();},{passive:false});
  }
  _distance(){const p=[...this.ptrs.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
}
