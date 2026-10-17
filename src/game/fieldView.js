// First-person props are real geometry, moving with the wrists, not a screen-space stats panel.
// Both the backpack reach and the watch raise temporarily replace the matching SelfBody arms.
import * as THREE from 'three';
import { clamp, damp, lerp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { fmtTime } from '../ui/hud.js';

const VERT=`varying vec3 vN; varying vec3 vP; varying vec2 vUv;
void main(){vN=normalize(normalMatrix*normal);vP=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
function material(color,light=1) {
  return new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(color)},light:{value:light}},vertexShader:VERT,
    fragmentShader:`uniform vec3 color; uniform float light; varying vec3 vN; varying vec3 vP;
    void main(){float sh=.4+.6*max(0.,dot(normalize(vN),normalize(vec3(-.4,.7,1.))));
    float weave=.965+.035*sin(vP.y*900.)*sin(vP.x*800.);gl_FragColor=vec4(color*light*sh*weave,0.);}`});
}
function cube(parent,geo,mat,x,y,z,w,h,d) {
  const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z);m.scale.set(w,h,d);m.frustumCulled=false;m.renderOrder=7;parent.add(m);return m;
}
const ease=(x)=>x*x*(3-2*x);
function wrap(ctx,text,width) {
  const rows=[];let row='';
  for(const word of text.split(/\s+/)) { if(row && ctx.measureText(`${row} ${word}`).width>width) { rows.push(row);row=word; } else row+=(row?' ':'')+word; }
  if(row) rows.push(row);return rows;
}

export class FieldView {
  constructor(game) {
    this.g=game; this.watch=0; this.box=new THREE.BoxGeometry(1,1,1);
    this.mat={cloth:material(0x354239,.8),skin:material(0xa38471,.75),glove:material(0x252e29,.9),resin:material(0x171c1c,1),steel:material(0x6c7773,.9),canvas:material(0x4a4931,.75),leather:material(0x332d22,.9)};
    this.root=new THREE.Group();this.root.visible=false;game.scene.add(this.root);
    this.left=this.arm(-1);this.right=this.arm(1);this.root.add(this.left,this.right);
    this.watchCase=this.buildWatch(); this.watchCase.scale.setScalar(.73); this.left.add(this.watchCase);
    this.bag=this.buildBag();this.root.add(this.bag);
    this.prop=new THREE.Group();this.root.add(this.prop);
    this.props={};
    for(const kind of ['stones','battery','flare','flareAmmo']) {
      const m=new THREE.Mesh(game.inventory.geo[kind],game.tools.viewMat);m.visible=false;m.frustumCulled=false;m.renderOrder=8;
      this.prop.add(m);this.props[kind]=m;
    }
    this.a11y=document.createElement('output');this.a11y.id='watchData';this.a11y.className='sr-only';
    this.a11y.setAttribute('aria-label',t('watchInfo'));document.getElementById('hud').append(this.a11y);
  }
  reset() { this.watch=0;this.root.visible=false;this.lcdKey='';this.lastLCD=0;document.body.classList.remove('watch-up'); }
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
    const c=document.createElement('canvas');c.width=512;c.height=672;
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
    const can=g.player.alive && !g.inventory.active && !g.inputMuted && !g.cabinets.busy && !g.player.carrying && !g.escape.held && !g.expedition.onTower && g.escape.mySeat<0 && ['play','morning','dawn'].includes(g.state);
    this.watch=damp(this.watch,can&&held?1:0,can&&held?9:12,dt);
    if(this.watch<.001) this.watch=0;
    document.body.classList.toggle('watch-up',this.watch>.45);
    if(this.watch>.01) { this.lastLCD-=dt;if(this.lastLCD<=0) { this.lastLCD=.2;this.drawLCD(); } }
  }
  drawLCD() {
    const g=this.g,p=g.player;
    if(!this.lcd) return;
    const task=g.objectives.taskText()||t('watchFind');
    const calm=Math.ceil(g.calmLeft?.()||0),state=g.state;
    const info={time:fmtTime(g.time||0),gens:g.objectives.count||0,parts:g.escape.count||0,score:Math.floor(g.score||0),mult:(g.mult||1).toFixed(1),team:g.online?`${g.livePlayers().length}/${g.remotes.size+1}`:'1/1',calm,task,torch:g.torch.has?Math.ceil(g.torch.charge*100):null};
    const key=JSON.stringify(info)+t('watchTime')+state;if(key===this.lcdKey) return;this.lcdKey=key;this.data=info;
    const c=this.lcd;c.fillStyle='#151c1d';c.fillRect(0,0,512,672);
    c.fillStyle='#ccd5cd';c.font='bold 40px monospace';c.fillText('HUSH',34,64);
    c.font='bold 20px monospace';c.fillStyle='#c24f45';c.fillText('WR 50M',379,59);
    c.fillStyle='#95443d';c.fillRect(32,86,448,3);c.fillStyle='#8aaba8';c.font='bold 20px monospace';c.textAlign='center';c.fillText('ILLUMINATOR',256,119);c.textAlign='left';
    c.fillStyle='#3b453c';c.fillRect(30,140,452,422);
    const bg=c.createLinearGradient(0,145,0,558);bg.addColorStop(0,'#9da78b');bg.addColorStop(.5,'#c0ceb0');bg.addColorStop(1,'#8caa98');c.fillStyle=bg;c.fillRect(36,146,440,410);
    c.fillStyle='#1e322a';c.font='bold 20px monospace';c.fillText(`${t('watchTime')} / ${t(state==='morning'?'watchDay':'watchNight')}`,51,177);
    c.font='bold 76px monospace';c.fillText(info.time,46,254);
    c.font='bold 23px monospace';c.fillText(`${t('watchGens')} ${info.gens}/5`,51,291);
    for(let i=0;i<5;i++){c.globalAlpha=i<info.gens?1:.18;c.fillRect(301+i*29,270,20,21);}c.globalAlpha=1;
    c.font='bold 22px monospace';c.fillText(`${t('watchCar')} ${info.parts}/4   ${t('watchAlive')} ${info.team}`,51,324);
    c.fillText(`${t('watchScore')} ${String(info.score).padStart(5,'0')}  x${info.mult}`,51,357);
    c.font='20px monospace';c.fillText(calm>0?`${t('watchCalm')} ${calm}s`:info.torch!==null?`${t('watchBat')} ${info.torch}%`:`${t('watchBag')} ${g.inventory.slots.filter(Boolean).length}/4`,51,388);
    c.fillRect(51,402,410,2);
    c.font='bold 22px monospace';
    const rows=wrap(c,task,410);
    // Long objectives scroll by whole lines; no information is removed to fit the small LCD.
    const start=rows.length>4?Math.floor((g.time||0)/3)%Math.max(1,rows.length-3):0;
    rows.slice(start,start+4).forEach((s,i)=>c.fillText(s,51,434+i*28));
    c.fillStyle='#7b9390';c.font='bold 20px monospace';c.textAlign='center';c.fillText('ALARM · CHRONOGRAPH',256,604);c.font='16px monospace';c.fillText('LIGHT                 DATA',256,645);c.textAlign='left';
    this.lcdTex.needsUpdate=true;
    if(this.a11y) this.a11y.textContent=`${info.time}. ${t('generators')} ${info.gens}/5. ${t('watchCar')} ${info.parts}/4. ${t('score')} ${info.score} x${info.mult}. ${t('watchAlive')} ${info.team}. ${calm?`${t('watchCalm')} ${calm}. `:''}${task}`;
  }
  place(camera,show) {
    const g=this.g,bag=g.inventory,reach=bag.progress,k=ease(clamp(this.watch,0,1));
    this.root.visible=!!show;if(!show) return;
    this.root.position.copy(camera.position);this.root.quaternion.copy(camera.quaternion);
    this.left.visible=k>.005||reach>.005;this.right.visible=reach>.005 || (!!bag.equipped && bag.equipT<=0 && !bag.active && !g.player.carrying && !g.escape.held && k<.1);
    this.watchCase.visible=k>.005;
    this.bag.visible=reach>.22;
    this.prop.visible=this.right.visible && reach<.01 && k<.1;
    const reachBack=Math.sin(clamp(reach/.48,0,1)*Math.PI);
    const wide=smoothstep(.8,1.3,camera.aspect); // keep the full wrist inside a portrait phone too
    this.left.position.set(lerp(-.46,lerp(-.012,-.09,wide),k),lerp(-.62,lerp(-.04,-.025,wide),k),lerp(-.25,lerp(-.3,-.26,wide),k));
    this.left.rotation.set(lerp(-.8,-.035,k),lerp(.6,-.04,k),lerp(-1.2,.035,k));
    this.right.position.set(.215,-.27,-.4);this.right.rotation.set(-1.05,-.1,-.1);
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
    }
    const dyes=g.selfBody.rig?.dyes;
    if(dyes?.[0]?.isColor) this.mat.cloth.uniforms.color.value.copy(dyes[0]);
  }
}
