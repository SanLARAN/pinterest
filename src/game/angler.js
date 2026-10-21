// Host-authoritative abduction, not an ordinary damage dealer. No timers survive a new run.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { clamp, angleDiff } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { buildAngler, poseAngler } from './anglerModel.js';
const ACTIVE = new Set(['play','morning','dusk','dawn']);
const PHASES = ['idle','stalk','drag','tie','bound','finish','cooldown'];
const dist = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);

export function isolatedTarget(players, unavailable, distance=CFG.ANGLER.ISOLATION) {
  return players.filter(p=>p.alive && !unavailable(p) && players.every(q=>q===p || !q.alive || dist(p,q)>distance))[0] || null;
}

export class Angler {
  constructor(game) { this.g=game; this.model=null; this.reset(); }
  reset() {
    for(const p of [this.g.player,...(this.g.remotes?.values()||[])]) if(p) p.anglerHold=false;
    Object.assign(this,{phase:'idle',clock:0,phaseT:0,cooldown:0,scan:0,victim:null,target:null,x:0,z:0,yaw:0,boundYaw:0,px:0,pz:0,deadline:0,koUntil:0,anger:0,voice:0,voiceUntil:0,seq:0,lastSeq:-1,impactPlayed:false,freeT:0,freeBy:null,dead:new Set(),nav:null});
    this.hide();
  }
  hide() { if(this.model){this.model.root.visible=false;this.model.ropes.visible=false;} if(this.status)this.status.hidden=true; if(this.shade)this.shade.hidden=true; }
  holds(id) { return !!this.victim && this.victim===id; }
  get busy() { return this.holds(this.g.player.id); }
  get unconscious() { return this.busy && this.clock<this.koUntil; }
  unavailable(p) { const g=this.g;return p.anglerHold || p.carrying || p.carriedBy || p.consumed || p.onCot || g.cabinets?.hides(p) || g.escape?.seats?.includes(p.id) || p.y-g.world.terrain.height(p.x,p.z)>2.5; }
  setPhase(phase) {if(phase==='tie')this.boundYaw=this.tree.yaw;if(phase==='finish'){this.impactPlayed=false;this.yaw=Math.atan2(this.px-this.x,this.pz-this.z);}this.phase=phase;this.phaseT=this.clock;this.nav=null;this.publish();}
  publish() { if(this.g.auth) this.g.sync?.ev('ag',this.snapshot()); }
  snapshot() {
    return {run:this.g.baseSeed>>>0,seq:++this.seq,phase:this.phase,x:this.x,z:this.z,yaw:this.yaw,by:this.boundYaw,free:this.freeT,helper:this.freeBy,victim:this.victim,px:this.px,pz:this.pz,
      left:Math.max(0,this.deadline-this.clock),ko:Math.max(0,this.koUntil-this.clock),elapsed:this.clock-this.phaseT,anger:this.anger,dead:[...this.dead]};
  }
  apply(d) {
    if(this.g.auth || !d || d.run!==(this.g.baseSeed>>>0) || !Number.isInteger(d.seq) || d.seq<=this.lastSeq || !PHASES.includes(d.phase)) return false;
    if(![d.x,d.z,d.yaw,d.by,d.free,d.px,d.pz,d.left,d.ko,d.elapsed,d.anger].every(Number.isFinite)) return false;
    if(Math.max(Math.abs(d.x),Math.abs(d.z),Math.abs(d.px),Math.abs(d.pz))>CFG.WORLD_WALL+3 || d.left<0 || d.left>CFG.ANGLER.RESCUE_SECONDS || d.ko<0 || d.ko>CFG.ANGLER.KNOCKOUT || d.elapsed<0) return false;
    if(d.victim!==null && (typeof d.victim!=='string' || !this.g.playerById(d.victim))) return false;
    this.lastSeq=d.seq;
    if(d.phase!==this.phase)this.impactPlayed=false;
    const newlyCaptured = this.victim!==d.victim && d.victim===this.g.player.id;
    if(this.victim!==d.victim) {this.release(false);this.victim=d.victim;}
    Object.assign(this,{phase:d.phase,x:d.x,z:d.z,yaw:d.yaw,boundYaw:d.by,freeT:clamp(d.free,0,CFG.ANGLER.RESCUE_HOLD),freeBy:typeof d.helper==='string'?d.helper:null,px:d.px,pz:d.pz,deadline:this.clock+d.left,koUntil:this.clock+d.ko,phaseT:this.clock-d.elapsed,anger:clamp(d.anger,0,3)});
    if (newlyCaptured) this.grabLocal();
    for(const id of Array.isArray(d.dead)?d.dead.slice(0,4):[]) if(typeof id==='string' && this.g.playerById(id) && !this.dead.has(id)) {this.dead.add(id);this.finalize(id);}
    return true;
  }
  chooseTree(p) {
    const trees=this.g.world.anglerTrees || [];
    const pool=trees.filter(q=>dist(p,q)>CFG.ANGLER.TREE_MIN && dist(p,q)<CFG.ANGLER.TREE_MAX);
    const rng=this.g.rng;
    for(let i=0;i<Math.min(80,pool.length);i++) {
      const q=pool[Math.floor((rng?.next()??Math.random())*pool.length)];
      for(let j=0;j<8;j++) {const a=j*Math.PI/4, at={x:q.x+Math.sin(a)*1.8,z:q.z+Math.cos(a)*1.8};
        if(this.g.world.navigation?.free(at.x,at.z,.65) && this.g.world.navigation.free(q.x+Math.sin(a)*.8,q.z+Math.cos(a)*.8,.25)) return {...q,goal:at,bound:{x:q.x+Math.sin(a)*.8,z:q.z+Math.cos(a)*.8},yaw:a};
      }
    }
    return null;
  }
  begin(p) {
    const tree=this.chooseTree(p);if(!tree)return false;
    this.tree=tree;this.target=p.id;
    const n=this.g.world.navigation;
    for(let i=0;i<12;i++) {const a=(this.g.rng?.next()??Math.random())*Math.PI*2,at={x:p.x+Math.sin(a)*15,z:p.z+Math.cos(a)*15};if(n?.free(at.x,at.z,.65)){this.x=at.x;this.z=at.z;this.yaw=Math.atan2(p.x-at.x,p.z-at.z);this.setPhase('stalk');return true;}}
    return false;
  }
  grab(p) {
    if(!p?.alive || this.unavailable(p))return false;
    this.victim=p.id;this.px=p.x;this.pz=p.z;p.anglerHold=true;
    this.anger=0;this.koUntil=0;this.freeT=0;
    if(p===this.g.player)this.grabLocal();
    this.setPhase('drag');return true;
  }
  grabLocal() {
    const g=this.g,p=g.player;p.anglerHold=true;p.yaw=this.yaw+Math.PI;p.pitch=.14;p.vx=p.vz=0;
    if(g.charge)g.charge.active=false;g.pingQueue=null;
    g.inventory?.close(false);g.objectives?.closeNote();g.tools?.cancelRecord();g.partMap?.fold(true);
    g.hud?.setIntro(null);g.hud?.setHint(null);
    g.hud?.flashAlert(t('anglerGrab'),'danger',3);g.audio?.sting?.(.65);
  }
  hear(id,loud,source) { if(this.holds(id) && source==='voice' && Number.isFinite(loud)){this.voice=clamp(loud,0,1);this.voiceUntil=this.clock+.22;} }
  move(dt,goal,speed) {
    const n=this.g.world.navigation;n?.beginFrame(this.g.time);
    const at=n?n.next(this,goal,dt,.6):goal;
    const dx=at.x-this.x,dz=at.z-this.z,d=Math.hypot(dx,dz);
    if(d<.04)return false;
    const turn=angleDiff(this.yaw,Math.atan2(dx,dz));this.yaw+=clamp(turn,-3*dt,3*dt);
    const v=Math.min(d,speed*dt)*(Math.abs(turn)>2?.1:1),pos={x:this.x+dx/d*v,z:this.z+dz/d*v};
    this.g.world.col.resolve(pos,.6);const moved=dist(this,pos);this.x=pos.x;this.z=pos.z;return moved>.002;
  }
  bind() {
    this.boundYaw=this.tree.yaw;
    this.px=this.tree.bound.x;this.pz=this.tree.bound.z;
    this.deadline=this.clock+CFG.ANGLER.RESCUE_SECONDS;this.freeT=0;this.freeBy=null;
    this.leaveAt={x:this.x+Math.sin(this.tree.yaw)*12,z:this.z+Math.cos(this.tree.yaw)*12};
    this.setPhase('bound');
  }
  release(notify=true) {
    const p=this.g.playerById?.(this.victim);
    if(p){p.anglerHold=false;p.vx=p.vz=0;p.eyeCur=CFG.PLAYER.eye;p.x=this.px;p.z=this.pz;if(p.buf){p.buf.length=0;p.revivedAt=performance.now();}}
    if(this.busy && notify)this.g.hud?.flashAlert(t('anglerFreed'),'dawn',3);
    this.victim=null;this.target=null;this.anger=0;this.freeT=0;this.freeBy=null;this.koUntil=0;
    if(notify){this.cooldown=this.clock+CFG.ANGLER.COOLDOWN;this.setPhase('cooldown');}
  }
  rescuer() {
    const g=this.g,p=g.playerById(this.victim);if(!p)return null;
    return g.livePlayers().find(q=>q!==p && !this.unavailable(q) && (q===g.player?g.input.useHeld:q.useHeld) && dist(q,p)<=CFG.ANGLER.RESCUE_REACH && !g.world.losBlocked(q.x,q.y+1,q.z,p.x,p.y+.8,p.z,.1))||null;
  }
  finalize(id) {
    const g=this.g,p=g.playerById(id);if(!p || p.consumed)return;
    p.alive=false;p.gone=true;p.consumed=true;p.anglerHold=false;p.cause='angler';p.bleedEnd=0;p.vx=p.vz=p.speed=0;
    if(id===g.player.id){g.cause='angler';g.localDeath='done';g.fx.fade=0;g.hud?.setUse(null);
      if(g.online)g.enterSpectate();else{g.state='over';g.audio?.setAmbience(0,0);g.onEnd?.({won:false,cause:'angler'});}
    }
    if(p!==g.player)g.hud?.flashAlert(t('anglerLost').replace('{name}',g.nameOf?.(p)||''),'danger',3);
    if(g.auth)g.checkTeam?.();
  }
  update(dt) {
    const g=this.g;
    if(!ACTIVE.has(g.state)){this.hide();return;}
    this.clock+=dt;let moving=false;
    if(g.auth) {
      if(this.victim && !g.playerById(this.victim)?.alive) this.release();
      if(this.phase==='idle' || this.phase==='cooldown') {
        this.scan-=dt;
        if(g.state==='play' && g.day>=CFG.ANGLER.FIRST_NIGHT && g.time>CFG.ANGLER.SPAWN_AFTER && this.clock>=this.cooldown && this.scan<=0){
          this.scan=1;const live=g.livePlayers(),i=Math.floor((g.rng?.next()??Math.random())*live.length);const p=isolatedTarget([...live.slice(i),...live.slice(0,i)],q=>this.unavailable(q));if(p)this.begin(p);
        }
      } else if(this.phase==='stalk') {
        const p=g.playerById(this.target), live=g.livePlayers();
        if(g.state!=='play'||!p?.alive||this.unavailable(p)||live.some(q=>q!==p && dist(q,p)<CFG.ANGLER.ISOLATION*.8)||this.clock-this.phaseT>80){this.release();}
        else{moving=this.move(dt,p,CFG.ANGLER.HUNT_SPEED);if(dist(this,p)<1.6 && !g.world.losBlocked(this.x,g.world.terrain.height(this.x,this.z)+1,this.z,p.x,p.y+.8,p.z,.1))this.grab(p);}
      } else if(this.phase==='drag') {
        moving=this.move(dt,this.tree.goal,CFG.ANGLER.DRAG_SPEED);
        const pos={x:this.x-Math.sin(this.yaw)*1.7,z:this.z-Math.cos(this.yaw)*1.7};g.world.col.resolve(pos,.25);this.px=pos.x;this.pz=pos.z;
        const loud=this.clock<this.voiceUntil?this.voice:0;
        this.anger=this.clock<this.koUntil?0:clamp(this.anger+dt*(loud>.52?1+(loud-.52)*3:-.25),0,3);
        if(this.anger>=CFG.ANGLER.VOICE_LIMIT && this.clock>=this.koUntil){this.koUntil=this.clock+CFG.ANGLER.KNOCKOUT;this.anger=0;if(this.busy){g.audio?.bump?.();g.addTrauma?.(.3);}this.publish();}
        if(dist(this,this.tree.goal)<.3){this.tieFrom={x:this.px,z:this.pz};this.setPhase('tie');}
        // Never hold someone in an unreachable drag forever. Abandon the hunt without teleporting them.
        if(this.phase==='drag' && this.clock-this.phaseT>CFG.ANGLER.MAX_DRAG)this.release();
      } else if(this.phase==='tie') {
        const k=clamp((this.clock-this.phaseT)/1.6,0,1);
        this.px=this.tieFrom.x+(this.tree.bound.x-this.tieFrom.x)*k;this.pz=this.tieFrom.z+(this.tree.bound.z-this.tieFrom.z)*k;
        if(k>=1)this.bind();
      } else if(this.phase==='bound') {
        const rescuer=this.rescuer();
        if(rescuer){this.freeT=this.freeBy===rescuer.id?this.freeT+dt:dt;this.freeBy=rescuer.id;}else{this.freeBy=null;this.freeT=0;}
        if(this.freeT>=CFG.ANGLER.RESCUE_HOLD)this.release();
        else if(this.clock>=this.deadline){moving=this.move(dt,this.tree.goal,CFG.ANGLER.HUNT_SPEED);if(dist(this,this.tree.goal)<.3)this.setPhase('finish');}
        else if(dist(this,this.leaveAt)>1)moving=this.move(dt,this.leaveAt,CFG.ANGLER.DRAG_SPEED);
      } else if(this.phase==='finish' && this.clock-this.phaseT>=CFG.ANGLER.FINISH_SECONDS) {
        const id=this.victim;this.dead.add(id);this.finalize(id);this.release(false);this.cooldown=this.clock+CFG.ANGLER.COOLDOWN;this.setPhase('cooldown');
      }
    }
    const p=g.playerById(this.victim);if(p)this.placeVictim(p,dt);
    this.present(dt,moving);
  }
  placeVictim(p,dt=0) {
    if(!this.holds(p.id))return;
    p.anglerHold=true;
    const k=this.g.auth||!dt?1:1-Math.exp(-18*dt);
    p.x+=(this.px-p.x)*k;p.z+=(this.pz-p.z)*k;p.y=this.g.world.terrain.height(p.x,p.z);p.vx=p.vz=p.speed=0;p.sprinting=false;
  }
  poseVictim(p) {
    const rig=p.rig;if(!rig)return;
    const n=rig.nodes,drag=this.phase==='drag';rig.root.position.set(p.x,p.y+(drag?.18:0),p.z);rig.root.rotation.set(drag?-Math.PI/2:0,drag?this.yaw:this.boundYaw,0);
    n.hips.position.y=drag?.25:.42;n.chest.rotation.set(drag?0:.12,0,0);n.head.rotation.set(.15,0,.15);
    for(const s of ['L','R']){n.shL.rotation.set(.3,0,-.35);n.shR.rotation.set(.3,0,.35);n['el'+s].rotation.set(-1.8,0,0);n['th'+s].rotation.set(drag?0:-1.1,0,0);n['kn'+s].rotation.set(drag?.1:1.3,0,0);}
    for(const m of p.kitMeshes?.values()||[])m.visible=false;
  }
  camera(camera) {
    if(!this.busy || !this.g.player.alive)return;
    const p=this.g.player,finish=this.phase==='finish',elapsed=this.clock-this.phaseT;
    const height=this.phase==='drag'?.4:this.phase==='tie'?.4+.68*clamp(elapsed/1.6,0,1):1.08;
    camera.position.set(p.x,p.y+height+Math.sin(this.clock*7)*.013,p.z);
    if(finish){const head=this._head||(this._head=new THREE.Vector3());if(this.model)this.model.nodes.head.getWorldPosition(head);else head.set(this.x,this.g.world.terrain.height(this.x,this.z)+2.25,this.z);camera.lookAt(head);camera.rotateZ(Math.sin(elapsed*3)*.05);}
  }
  lightSource(out) {
    if(!this.model?.root.visible)return;
    const at=new THREE.Vector3();this.model.nodes.lantern.getWorldPosition(at);at.y+=.15;
    out.push({id:'angler-lantern',x:at.x,y:at.y,z:at.z,I:1.5,R:13,c:[1,.62,.25],prio:this.busy?10:3,near:.15});
  }
  present(dt,moving) {
    if(this.phase==='idle'||this.phase==='cooldown'){this.hide();return;}
    if(this.phase==='finish' && this.clock-this.phaseT>2.4 && !this.impactPlayed){this.impactPlayed=true;if(this.busy){this.g.audio?.bump?.();this.g.addTrauma?.(.4);}}
    if(!this.model && this.g.scene && this.g.world.material){this.model=buildAngler(this.g.world.material);this.model.root.visible=false;this.g.scene.add(this.model.root,this.model.ropes);}
    if(this.model){const m=this.model,k=!this.g.auth&&m.root.visible?1-Math.exp(-16*dt):1;
      const ox=m.root.position.x,oz=m.root.position.z;
      m.root.position.x+=(this.x-ox)*k;m.root.position.z+=(this.z-oz)*k;m.root.position.y=this.g.world.terrain.height(m.root.position.x,m.root.position.z);
      m.root.rotation.y+=angleDiff(m.root.rotation.y,this.yaw)*k;m.root.visible=true;
      const gait=this.g.auth?+moving:Math.min(1,Math.hypot(m.root.position.x-ox,m.root.position.z-oz)/Math.max(.001,dt*1.5));
      poseAngler(m,this.clock,gait,this.phase==='finish'?this.clock-this.phaseT:0);
      m.ropes.visible=this.phase==='bound'||this.phase==='finish';m.ropes.rotation.y=this.boundYaw;m.ropes.position.set(this.px,this.g.world.terrain.height(this.px,this.pz),this.pz);m.root.updateMatrixWorld(true);
    }
  }
  hud() {
    if(typeof document==='undefined')return;
    if(!this.status){this.status=document.createElement('div');this.status.className='angler-status';this.status.setAttribute('role','status');this.shade=document.createElement('div');this.shade.className='angler-shade';document.body.append(this.shade,this.status);}
    const g=this.g,show=this.busy && g.player.alive && ACTIVE.has(g.state);this.status.hidden=!show;this.shade.hidden=!(show && (this.unconscious || this.phase==='finish' && this.clock-this.phaseT>2.6));
    if(show){const left=Math.ceil(Math.max(0,this.deadline-this.clock)),time=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
      this.status.textContent=this.unconscious?t('anglerKO'):(this.phase==='drag'||this.phase==='tie')?t('anglerDragged').replace('{n}',Math.round(this.anger/CFG.ANGLER.VOICE_LIMIT*100)):this.phase==='finish'?t('anglerFinish'):t(this.clock>=this.deadline?'anglerReturning':g.online?'anglerBound':'anglerBoundSolo').replace('{time}',time);
    }else if(this.phase==='bound' && g.player.alive && !this.unavailable(g.player) && Math.hypot(g.player.x-this.px,g.player.z-this.pz)<CFG.ANGLER.RESCUE_REACH && !g.world.losBlocked(g.player.x,g.player.y+1,g.player.z,this.px,g.world.terrain.height(this.px,this.pz)+.8,this.pz,.1)){g.hud.setUse(t(g.input.touch?'anglerRescueTouch':'anglerRescue'),this.freeT/CFG.ANGLER.RESCUE_HOLD);}
  }
}
