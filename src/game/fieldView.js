// First-person props are real geometry, moving with the wrists, not a screen-space stats panel.
// Both the backpack reach and the watch raise temporarily replace the matching SelfBody arms.
import * as THREE from 'three';
import { clamp, damp, lerp, smoothstep } from '../core/rng.js';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { fmtTime } from '../ui/hud.js';

// where you stand, the way the guard's map writes it: whole metres, x first (2.1r)
export function fmtPos(x, z) { return `${Math.round(x)}, ${Math.round(z)}`; }

const VERT=`varying vec3 vN; varying vec3 vP; varying vec2 vUv;
void main(){vN=normalize(normalMatrix*normal);vP=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
function material(color,light=1) {
  return new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color().setHex(color,THREE.LinearSRGBColorSpace)},light:{value:light}},vertexShader:VERT,
    fragmentShader:`uniform vec3 color; uniform float light; varying vec3 vN; varying vec3 vP;
    void main(){float sh=.55+.45*max(0.,dot(normalize(vN),normalize(vec3(-.4,.7,1.))));
    float weave=.965+.035*sin(vP.y*900.)*sin(vP.x*800.);gl_FragColor=vec4(color*light*sh*weave,0.);}`});
}
function cube(parent,geo,mat,x,y,z,w,h,d) {
  const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z);m.scale.set(w,h,d);m.frustumCulled=false;m.renderOrder=7;parent.add(m);return m;
}
const ease=(x)=>x*x*(3-2*x);

// (3.1l) a digital watch draws its time in seven segments, and the unlit ones are still faintly there — that ghost
// «88:88» behind the digits is most of what makes an LCD read as a watch and not a screen.
const SEG={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','-':'g'};
function segPath(c,pts) { c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill(); }
function hSeg(c,x,y,l,t) { segPath(c,[[x,y+t/2],[x+t/2,y],[x+l-t/2,y],[x+l,y+t/2],[x+l-t/2,y+t],[x+t/2,y+t]]); }
function vSeg(c,x,y,l,t) { segPath(c,[[x+t/2,y],[x+t,y+t/2],[x+t,y+l-t/2],[x+t/2,y+l],[x,y+l-t/2],[x,y+t/2]]); }
// one digit in a w×h box, stroke t; `on` draws its lit segments, everything else in the ghost colour
export function drawDigit(c,ch,x,y,w,h,t,on,ghost) {
  const lit=SEG[ch]||'',g=2,half=h/2;
  const segs={a:()=>hSeg(c,x+g,y,w-2*g,t),g:()=>hSeg(c,x+g,y+half-t/2,w-2*g,t),d:()=>hSeg(c,x+g,y+h-t,w-2*g,t),
    f:()=>vSeg(c,x,y+g,half-g,t),b:()=>vSeg(c,x+w-t,y+g,half-g,t),e:()=>vSeg(c,x,y+half+g/2,half-g,t),c:()=>vSeg(c,x+w-t,y+half+g/2,half-g,t)};
  for(const [k,draw] of Object.entries(segs)) { c.fillStyle=lit.includes(k)?on:ghost;draw(); }
}
// a long task does not fit one line of an LCD: it walks through it a character at a time, the way they do
export function marquee(text,cols,step) {
  if(text.length<=cols) return text;
  const loop=`${text}   ·   `;const i=step%loop.length;
  return (loop+loop).slice(i,i+cols);
}

export class FieldView {
  constructor(game) {
    this.g=game; this.watch=0; this.box=new THREE.BoxGeometry(1,1,1);
    this.mat={cloth:material(0x354239,.8),skin:material(0xa38471,.75),glove:material(0x686655,.85),resin:material(0x171c1c,1),steel:material(0x6c7773,.9),canvas:material(0x4a4931,.75),leather:material(0x332d22,.9)};
    this.root=new THREE.Group();this.root.visible=false;game.scene.add(this.root);
    this.left=this.arm(-1);this.right=this.arm(1);this.root.add(this.left,this.right);
    this.watchCase=this.buildWatch(); this.watchCase.scale.setScalar(.73); this.left.add(this.watchCase);
    this.bag=this.buildBag();this.root.add(this.bag);
    this.wrench=this.buildWrench();this.right.add(this.wrench);this.wrench.visible=false;
    this.prop=new THREE.Group();this.root.add(this.prop);
    this.props={};
    for(const kind of ['stones','battery','flare','flareAmmo','camera']) {
      if(!game.inventory.geo[kind]) continue; // (4.0: the camera is the forest's)
      const m=new THREE.Mesh(game.inventory.geo[kind],game.tools.viewMat);m.visible=false;m.frustumCulled=false;m.renderOrder=8;
      this.prop.add(m);this.props[kind]=m;
    }
    this.a11y=document.createElement('output');this.a11y.id='watchData';this.a11y.className='sr-only';
    this.a11y.setAttribute('aria-label',t('watchInfo'));document.getElementById('hud').append(this.a11y);
  }
  reset() { this.watch=0;this.work=0;this.root.visible=false;this.lcdKey='';this.lastLCD=0;document.body.classList.remove('watch-up'); }
  // the wrench at a generator: a shaft, a head and an open jaw, hung off the working hand
  buildWrench() {
    const w=new THREE.Group();w.position.set(0,.19,.01);w.rotation.z=.12;
    cube(w,this.box,this.mat.steel,0,.1,0,.026,.2,.026);
    cube(w,this.box,this.mat.steel,0,.215,0,.06,.045,.028);
    cube(w,this.box,this.mat.steel,-.024,.25,.0,.022,.06,.024).rotation.z=.5;
    cube(w,this.box,this.mat.steel,.024,.25,.0,.022,.06,.024).rotation.z=-.5;
    return w;
  }
  arm(side) {
    const a=new THREE.Group();
    const sleeve=cube(a,this.box,this.mat.cloth,side*.055,-.255,.035,.102,.29,.11);sleeve.rotation.z=side*.24;sleeve.rotation.x=-.25;
    cube(a,this.box,this.mat.cloth,0,-.122,-.012,.094,.08,.095);
    cube(a,this.box,this.mat.skin,0,-.055,-.01,.079,.075,.073);
    const palm=cube(a,this.box,this.mat.glove,0,.123,.004,.092,.1,.068);palm.rotation.x=-.18;
    for(let i=0;i<4;i++) cube(a,this.box,this.mat.glove,(i-1.5)*.023,.181,-.008,.02,.045,.045).rotation.x=-.8;
    cube(a,this.box,this.mat.glove,side*.051,.119,.022,.032,.075,.044).rotation.z=side*.35;
    return a;
  }
  buildWatch() {
    const g=new THREE.Group();g.position.set(0,-.012,.053);
    const outline=new THREE.Shape();
    const points=[[-.064,.084],[.064,.084],[.0775,.0705],[.0775,-.0705],[.064,-.084],[-.064,-.084],[-.0775,-.0705],[-.0775,.0705]];
    points.forEach(([x,y],i)=>i?outline.lineTo(x,y):outline.moveTo(x,y));outline.closePath();
    const caseGeo=new THREE.ExtrudeGeometry(outline,{depth:.03,bevelEnabled:false});caseGeo.translate(0,0,-.015);
    const body=new THREE.Mesh(caseGeo,this.mat.resin);body.renderOrder=7;body.frustumCulled=false;g.add(body);
    for(const s of [-1,1]) {
      cube(g,this.box,this.mat.resin,0,s*.115,s>0?-.064:-.006,.082,.06,.019);
      for(let i=0;i<4;i++) cube(g,this.box,this.mat.glove,0,s*(.101+i*.016),.005,.075,.006,.004);
      for(const y of [-.05,.052]) cube(g,this.box,this.mat.steel,s*.079,y,-.002,.009,.026,.015);
      for(const x of [-.053,.053]) cube(g,this.box,this.mat.steel,x,s*.074,.017,.006,.006,.003);
    }
    const c=document.createElement('canvas');c.width=512;c.height=536; // (3.1l) the face's own proportions (.143 × .15)
    this.lcdCanvas=c;this.lcd=c.getContext('2d');this.lcdTex=new THREE.CanvasTexture(c);
    this.lcdTex.minFilter=THREE.LinearFilter;this.lcdTex.magFilter=THREE.LinearFilter;
    const m=new THREE.ShaderMaterial({uniforms:{map:{value:this.lcdTex}},vertexShader:VERT,
      fragmentShader:'uniform sampler2D map; varying vec2 vUv; void main(){gl_FragColor=vec4(texture2D(map,vUv).rgb,0.);}'});
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.143,.15),m);face.position.z=.0165;face.renderOrder=8;g.add(face);
    this.drawLCD();return g;
  }
  buildBag() {
    const g=new THREE.Group();
    cube(g,this.box,this.mat.canvas,0,0,0,.4,.43,.18);
    cube(g,this.box,this.mat.leather,-.15,.015,.099,.032,.4,.015);cube(g,this.box,this.mat.leather,.15,.015,.099,.032,.4,.015);
    for(const x of [-.1,.1]) cube(g,this.box,this.mat.canvas,x,-.055,.12,.16,.19,.07);
    const flap=new THREE.Group();flap.position.set(0,.21,-.075);g.add(flap);
    cube(flap,this.box,this.mat.canvas,0,-.045,.09,.42,.14,.19);this.flap=flap;
    for(const x of [-.15,.15]) cube(g,this.box,this.mat.steel,x,.055,.126,.05,.04,.009);
    cube(g,this.box,this.mat.leather,-.065,.255,-.01,.025,.08,.025);cube(g,this.box,this.mat.leather,.065,.255,-.01,.025,.08,.025);
    cube(g,this.box,this.mat.leather,0,.286,-.01,.15,.022,.025);
    return g;
  }
  update(dt) {
    const g=this.g;
    const held=g.input.peekHeld || performance.now()<g.input.peekTouchUntil;
    const can=g.player.alive && !g.partMap?.active && !g.inventory.active && !g.inputMuted && !g.cabinets.busy && !g.player.carrying && !g.escape.held && !g.expedition.onTower && g.escape.mySeat<0 && ['play','morning','dawn','training'].includes(g.state);
    this.watch=damp(this.watch,can&&held?1:0,can&&held?9:12,dt);
    if(this.watch<.001) this.watch=0;
    document.body.classList.toggle('watch-up',this.watch>.45);
    if(this.watch>.01) { this.lastLCD-=dt;if(this.lastLCD<=0) { this.lastLCD=.2;this.drawLCD(); } }
    // at a generator the arms come up and the wrench goes to work (the body kneels under them)
    const working=!!(can && g.objectives?.working && ['play','morning'].includes(g.state) && this.watch<.2);
    this.work=damp(this.work||0,working?1:0,working?6:5,dt);
    if(this.work<.001) this.work=0;
  }
  drawLCD() {
    const g=this.g,p=g.player;
    if(!this.lcd) return;
    const bog=g.map==='bog'; // (5.0a) «Топь» counts chapters, not generators and car parts
    const ch=bog&&g.level2?.chapter;const task=bog?(ch?t('l2Goal_'+ch.id):''):(g.objectives.taskText()||t('watchFind'));
    const calm=Math.ceil(g.calmLeft?.()||0),state=g.state,S=CFG.SHIFT;
    // the shift has four days: the big number counts DOWN — to dusk in the morning, to dawn at night
    const fin=!!g.finale; // (3.1m) the last morning counts down to the end of the shift
    const rem=fin?Math.max(0,S.FINALE-(g.time||0)):state==='play'?Math.max(0,S.NIGHT-(g.time||0)):state==='morning'?Math.max(0,S.MORNING-(g.morningT||0)):(g.time||0);
    const info={time:fmtTime(rem),day:`${g.day||1}/${g.daysTotal||S.DAYS}`,gens:g.objectives.count||0,parts:g.escape.count||0,chapter:bog?(g.level2?.i??0)+1:0,score:Math.floor(g.score||0),mult:(g.mult||1).toFixed(1),team:g.online?`${g.livePlayers().length}/${g.remotes.size+1}`:'1/1',pos:fmtPos(p.x,p.z),calm,task,torch:g.torch.has?Math.ceil(g.torch.charge*100):null};
    // (3.1l) the task walks through its one line a character every 0.2 s (the LCD's own refresh)
    const step=Math.floor(performance.now()/200);
    const line=marquee(task.toUpperCase(),30,step);
    const key=JSON.stringify(info)+t('watchTime')+state+fin+line;if(key===this.lcdKey) return;this.lcdKey=key;this.data=info;
    // (3.1l) a digital watch, not a little screen: the bezel prints, one LCD window with the time in seven big
    // segments (the unlit ones faintly there), a few short readouts in the watch's own caps, the task walking
    // through one line. At night the window glows the blue-green of an electroluminescent backlight; by day it
    // is a plain grey-green LCD.
    const c=this.lcd,night=state!=='morning'&&!fin;
    const ink=night?'#082320':'#1b2a22',ghost=night?'rgba(8,35,32,.1)':'rgba(27,42,34,.08)';
    c.fillStyle='#121718';c.fillRect(0,0,512,536);
    const rim=c.createLinearGradient(0,0,0,536);rim.addColorStop(0,'#1d2425');rim.addColorStop(1,'#0c1011');c.fillStyle=rim;c.fillRect(8,8,496,520);
    // the bezel's print
    c.fillStyle='#d3d9d2';c.font='bold 34px monospace';c.textAlign='left';c.fillText('HUSH',30,50);
    c.fillStyle='#c24f45';c.font='bold 17px monospace';c.textAlign='right';c.fillText('WR 50M',482,46);
    c.fillStyle='#7f8f8b';c.font='bold 15px monospace';c.textAlign='center';c.fillText('ALARM · CHRONOGRAPH',256,72);
    // the window: a dark frame, then the glass
    c.fillStyle='#2b3330';c.fillRect(24,86,464,370);
    const lcd=c.createLinearGradient(0,92,0,450);
    if(night){lcd.addColorStop(0,'#4e9e92');lcd.addColorStop(.55,'#64b5a7');lcd.addColorStop(1,'#3e8478');}
    else{lcd.addColorStop(0,'#9fa98d');lcd.addColorStop(.55,'#c1cdb1');lcd.addColorStop(1,'#93ab97');}
    c.fillStyle=lcd;c.fillRect(30,92,452,358);
    c.fillStyle='rgba(0,0,0,.14)';c.fillRect(30,92,452,5);c.fillRect(30,92,5,358); // the glass sits in the frame
    // top line: which part of the shift, and what the big number counts to
    c.fillStyle=ink;c.font='bold 23px monospace';c.textAlign='left';
    c.fillText(`${t(state==='morning'||fin?'watchDay':'watchNight')} ${info.day}`,46,126);
    c.textAlign='right';c.font='bold 18px monospace';
    c.fillText(t(fin?'watchToEnd':state==='play'?'watchToDawn':state==='morning'?'watchToDusk':'watchTime'),468,124);
    // the time: MM:SS in seven segments, slanted the way watch digits are
    const [mm,ss]=info.time.split(':').map((p)=>p.slice(-2)); // (a training stopwatch past 99 minutes keeps two digits)
    c.setTransform(1,0,-.09,1,18,0); // (setTransform, not transform: the same call every canvas has)
    const W=78,H=128,T=15,Y=146;
    [...mm].forEach((ch,i)=>drawDigit(c,ch,58+i*(W+16),Y,W,H,T,ink,ghost));
    c.fillStyle=ink;c.fillRect(246,Y+34,15,15);c.fillRect(246,Y+H-50,15,15);
    [...ss].forEach((ch,i)=>drawDigit(c,ch,278+i*(W+16),Y,W,H,T,ink,ghost));
    c.setTransform(1,0,0,1,0,0);
    // the readouts, two short lines
    c.textAlign='left';c.font='bold 22px monospace';c.fillStyle=ink;
    c.fillText(bog?`${t('l2Ch').replace('{n}',info.chapter)} / 7`:`${t('watchGens')} ${info.gens}/5`,46,320);
    for(let i=0;i<5;i++){c.fillStyle=i<info.gens?ink:ghost;c.fillRect(176+i*24,302,17,20);}
    c.fillStyle=ink;c.textAlign='right';c.fillText(`${t('watchAlive')} ${info.team}`,468,320);
    c.textAlign='left';c.fillText(bog?(ch?t('l2_'+ch.id):''):`${t('watchCar')} ${info.parts}/4`,46,352);
    c.textAlign='right';c.fillText(`${t('watchScore')} ${String(info.score).padStart(5,'0')} x${info.mult}`,468,352);
    c.fillRect(46,366,422,2);
    // the task, one walking line; then where you stand and the one gauge that matters right now
    c.textAlign='left';c.font='bold 22px monospace';c.fillText(line,46,398);
    c.font='bold 19px monospace';c.fillText(`${t('watchPos')} ${info.pos}`,46,434);
    c.textAlign='right';
    c.fillText(calm>0?`${t('watchCalm')} ${calm}s`:info.torch!==null?`${t('watchBat')} ${info.torch}%`:`${t('watchBag')} ${g.inventory.slots.filter(Boolean).length}/4`,468,434);
    // the buttons' names on the case, under the glass
    c.fillStyle='#7f8f8b';c.font='bold 15px monospace';c.textAlign='left';c.fillText('LIGHT',30,490);
    c.textAlign='right';c.fillText('MODE',482,490);c.textAlign='center';c.fillStyle='#5d6b67';c.fillText('ILLUMINATOR',256,512);c.textAlign='left';
    this.lcdTex.needsUpdate=true;
    if(this.a11y) this.a11y.textContent=`${t('watchDayN').replace('{n}',g.day||1).replace('{d}',g.daysTotal||S.DAYS)}. ${info.time}. ${bog?`${t('l2Ch').replace('{n}',info.chapter)} / 7. ${ch?t('l2_'+ch.id):''}`:`${t('generators')} ${info.gens}/5. ${t('watchCar')} ${info.parts}/4`}. ${t('score')} ${info.score} x${info.mult}. ${t('watchAlive')} ${info.team}. ${t('watchPos')} ${info.pos}. ${calm?`${t('watchCalm')} ${calm}. `:''}${task}`;
  }
  place(camera,show) {
    const g=this.g,bag=g.inventory,reach=bag.progress,k=ease(clamp(this.watch,0,1));
    this.root.visible=!!show;if(!show) return;
    this.root.position.copy(camera.position);this.root.quaternion.copy(camera.quaternion);
    const wk=this.work||0;
    this.left.visible=k>.005||reach>.005||wk>.05;this.right.visible=reach>.005||wk>.05 || (!!bag.equipped && bag.equipT<=0 && !bag.active && !g.player.carrying && !g.escape.held && k<.1);
    this.wrench.visible=wk>.3&&reach<.01&&k<.1;
    this.watchCase.visible=k>.005;
    this.bag.visible=reach>.22 && !g.bag3d?.active; // the round pack draws its own
    // once the pack is out in front of you, the arm that swung it there leaves the frame (it would sit
    // across the pouch you are reaching for)
    if (g.bag3d?.active && g.bag3d.state.k > 0.45) { this.right.visible = false; this.left.visible = k > .005; }
    this.prop.visible=this.right.visible && reach<.01 && k<.1 && wk<.3;
    const reachBack=Math.sin(clamp(reach/.48,0,1)*Math.PI);
    const wide=smoothstep(.8,1.3,camera.aspect); // keep the full wrist inside a portrait phone too
    this.left.position.set(lerp(-.46,lerp(-.012,-.09,wide),k),lerp(-.62,lerp(-.04,-.025,wide),k),lerp(-.25,lerp(-.3,-.26,wide),k));
    this.left.rotation.set(lerp(-.8,-.035,k),lerp(.6,-.04,k),lerp(-1.2,.035,k));
    this.right.position.set(.215,-.27,-.4);this.right.rotation.set(-1.05,-.1,-.1);
    if(wk>.01&&reach<.01&&k<.1) {
      // the repair: the left hand steadies the housing, the right leans on the wrench
      const sw=Math.sin(performance.now()/1000*7);
      this.left.position.set(-.24,-.3,-.43);this.left.rotation.set(-1.05,.4,.18);
      this.right.position.set(.18,-.33+sw*.02*wk,-.45);this.right.rotation.set(-1.2+sw*.16*wk,-.18,-.12);
    }
    if(reach>.001) {
      const pull=smoothstep(.24,.88,reach);
      this.right.position.set(lerp(-.22,.25,pull),lerp(.10,-.22,pull),lerp(.04,-.48,pull));
      this.right.rotation.set(lerp(-2.1,-.3,pull),-.3,lerp(-.8,.1,pull));
      this.left.position.set(-.29-reachBack*.12,lerp(-.6,-.24,pull),lerp(-.18,-.5,pull));
      this.left.rotation.set(-.2,.1,-.25);
      this.bag.position.set(0,lerp(-.85,-.3,pull),-.64);this.bag.rotation.set(-.12+reachBack*.3,reachBack*.2,reachBack*-.13);
      this.flap.rotation.x=-smoothstep(.45,1,reach)*1.25;
    }
    this.prop.position.set(.2,-.25,-.43);this.prop.rotation.set(-.12,-.1,-.1);
    for(const [kind,m] of Object.entries(this.props)) {
      m.visible=!bag.active && (kind==='flareAmmo' ? bag.equipped==='flare'&&!g.player.hasFlare : bag.equipped===kind && (kind!=='flare'||g.player.hasFlare));
      m.rotation.set(kind==='flare'?0:-.35,kind==='flare'?-Math.PI/2:0,kind==='battery'?-.25:0);
      m.scale.setScalar(kind==='stones'?.7:1);
      if(kind==='camera') { // (4.0) held up, lens forward; the shot jerks it in your hand
        const kick=g.camItem?.kick||0;
        m.position.set(-.035,.04+kick*.012,-.02+kick*.03);m.rotation.set(-.08+kick*.22,.12,-.04);
      }
    }
    if(g.partMap?.amount>.01){const d=g.partMap.distance(camera),k=g.partMap.amount;this.left.visible=this.right.visible=true;this.watchCase.visible=false;this.bag.visible=this.prop.visible=false;this.left.position.set(-.25,-.42-(1-k)*.3,-d+.025);this.right.position.set(.25,-.42-(1-k)*.3,-d+.025);this.left.rotation.set(.1,0,.08);this.right.rotation.set(.1,0,-.08);}
    const dyes=g.selfBody.rig?.dyes;
    if(dyes?.[2]?.isColor){this.mat.cloth.uniforms.color.value.copy(dyes[2]);const fur=g.selfBody.rig.fit?.body==='fluffy';this.mat.glove.uniforms.color.value.copy(fur?dyes[2]:this.mat.steel.uniforms.color.value).multiplyScalar(fur?.9:.8);}
  }
}
