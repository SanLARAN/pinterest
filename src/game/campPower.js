// Zarya's optional local grid, independent of the five main objective generators.
// Only the host advances repairs; guests contribute their real held-use state, never claimed seconds.
import * as THREE from 'three';
import { shared, shadowLights } from '../render/sonar.js';
import { clamp, damp } from '../core/rng.js';
import { t } from '../core/i18n.js';
export const CAMP_REPAIR_SECONDS=6;
export const CAMP_LAMP_FIRST=6; // 0..4 main sites, 5 yard, 6..12 Zarya

export function canRepairCamp(g,p,localHolding=false) {
  const site=g.world.zarya.generator,f=site.front;
  if(g.state!=='play'||!p?.alive||p.speed>.6||p.carrying||g.escape?.load?.(p.id)||g.escape?.seatOf?.(p.id)>=0||g.cabinets?.locked?.(p.id))return false;
  if(p===g.player ? (!localHolding||!g.input.useHeld||g.inputMuted||g.inventory?.active) : (!p.useHeld||p.gearPose===1))return false;
  const d=Math.hypot(p.x-f.x,p.z-f.z);
  if(d>2.35||Math.abs(p.y-site.y)>1.8)return false;
  if(d>1.1){const dir=p.forward();if(((f.x-p.x)*dir.x+(f.z-p.z)*dir.z)/d<.25)return false;}
  return !g.world.losBlocked(p.x,p.y+(p.eyeCur||1.62),p.z,f.x,site.y+.7,f.z,.25);
}

export class CampPower {
  constructor(game) {
    this.g=game;this.site=game.world.zarya.generator;this.lights=game.world.zarya.lights;
    this.bulbGeo=new THREE.IcosahedronGeometry(.055,0);this.bulbMat=new THREE.MeshBasicMaterial({color:0xffddb0,transparent:true});
    this.bulbs=this.lights.map(L=>{const m=new THREE.Mesh(this.bulbGeo,this.bulbMat);m.position.set(L.x,L.y,L.z);m.visible=false;game.scene.add(m);return m;});
    this.reset();
  }
  reset(){this.silence();this.progress=0;this.running=false;this.intensity=0;this.localHolding=false;this.clankT=0;this.beat=0;}
  silence(){if(this.hum)this.hum.stop();this.hum=null;for(let i=0;i<this.lights.length;i++){shared.uLamp.value[CAMP_LAMP_FIRST+i].w=0;shadowLights.lamp[CAMP_LAMP_FIRST+i]=null;this.bulbs[i].visible=false;}this.intensity=0;this.localHolding=false;}
  netState(){return[Math.round(this.progress*1000),this.running?1:0];}
  netMerge(a){
    if(!Array.isArray(a)||a.length!==2||!Number.isInteger(a[0])||a[0]<0||a[0]>1000||![0,1].includes(a[1])||(a[1]===1&&a[0]!==1000))return;
    const was=this.running,changed=a[0]/1000>this.progress;this.progress=Math.max(this.progress,a[0]/1000);this.running=this.running||a[1]===1;
    if(this.running&&!was&&this.g.audio.ready)this.g.audio.genStart(this.site.x,this.site.y+.5,this.site.z);
    else if(changed&&!this.running&&this.clankT<=0&&this.g.audio.ready){this.clankT=.9;this.g.audio.clank(this.site.x,this.site.y+.6,this.site.z,.75);}
  }
  consider(fn){if(!this.running){const f=this.site.front;fn(this.site,f.x,f.z,2.3,'campGenerator');}}
  interact(dt,held,T){this.localHolding=held;this.g.hud.setUse(T('useCampGenerator'),this.progress,!this.running);}
  update(dt) {
    const g=this.g,active=['play','morning','dusk','dawn'].includes(g.state);
    if(!active){this.silence();return;}
    this.clankT=Math.max(0,this.clankT-dt);
    if(g.auth&&!this.running) {
      const workers=(g.livePlayers?.()||[g.player]).filter(p=>canRepairCamp(g,p,this.localHolding));
      if(workers.length) {
        this.progress=clamp(this.progress+dt/CAMP_REPAIR_SECONDS,0,1);
        if(this.clankT<=0){this.clankT=.9;g.noise(this.site.x,this.site.z,.36,'repair');if(g.audio.ready)g.audio.clank(this.site.x,this.site.y+.6,this.site.z,.75);}
        if(this.progress>=1){this.running=true;g.noise(this.site.x,this.site.z,.72,'engine');g.hud.popup(t('campPowerOn'),'amber');if(g.audio.ready)g.audio.genStart(this.site.x,this.site.y+.5,this.site.z);}
        this.beat-=dt;if(this.beat<=0||this.running){this.beat=.2;if(g.sync)g.sync.ev('spe',g.expedition.netState());}
      }
    }
    this.localHolding=false;
    this.intensity=damp(this.intensity,this.running?1:0,3,dt);
    for(let i=0;i<this.lights.length;i++) {
      const L=this.lights[i],slot=CAMP_LAMP_FIRST+i,I=this.intensity*(L.inside ? 1.2 : 1.1);
      shared.uLamp.value[slot].set(L.x,L.y,L.z,I);
      shadowLights.lamp[slot]=I>.004?{x:L.x,y:L.y-.08,z:L.z,R:15,near:.18}:null;
      this.bulbs[i].visible=I>.01;
    }
    this.bulbMat.opacity=this.intensity;
    if(this.running&&g.audio.ready&&!this.hum)this.hum=g.audio.genHum(this.site.x,this.site.y+.5,this.site.z);
  }
}
