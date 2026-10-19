// The Shade learns WHOLE phrases from every willing microphone in the run. Only the host holds the
// two most recent phrases per player. On an imitation, one PCM clip and one location go to the team.
// This is playback of the actual recording, never an AI-generated or pitch-shifted voice.
import { encodePhrase, decodePhrase, validPhrase, PhraseCapture } from '../audio/phrases.js';
import { buildSurvivor, poseSurvivor } from './survivor.js';
import { myFit, cleanFit } from './outfit.js';
import { PLAYER_HEX } from './remote.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';

export class VoiceMimic {
  constructor(game) {
    this.g=game;this.bank=new Map();this.rates=new Map();this.seq=0;
    this.capture=new PhraseCapture((raw,hz)=>this.learn(raw,hz));
    this.reset();
  }
  reset() {
    this.clear();this.wait=22;this.seq=0;this.run=Date.now().toString(36);
    this.g.mic.onPCM=(chunk,hz)=>{
      const g=this.g;
      if(!chunk || g.inputMuted || !g.player.alive || !['play','morning'].includes(g.state) || (g.mic.selfUntil && performance.now()<g.mic.selfUntil)) { this.capture.reset();return; }
      this.capture.push(chunk,hz,Math.max(-60,Math.min(-28,g.mic.floor+10)));
    };
  }
  clear() {
    this.stop();this.capture?.reset();this.bank.clear();this.rates.clear();
    this.g.mic.onPCM=null;
  }
  stop() {
    if(this.sound) { this.sound.stop();this.sound=null; }
    if(this.figure) {
      this.g.scene.remove(this.figure.rig.root);undressPerson(this.figure.meshes);this.figure.mat.dispose();this.figure=null;
    }
    this.current=null;
  }
  forget(pid) {
    this.bank.delete(pid);this.rates.delete(pid);
    if(this.current?.pid===pid) this.stop();
  }
  learn(raw,hz) {
    const g=this.g;if(g.inputMuted || !g.player.alive || !['play','morning'].includes(g.state) || g.mic.state!=='on') return;
    const clip=encodePhrase(raw,hz);if(!clip) return;
    const id=`${this.run}.${++this.seq}`;
    if(g.auth) this.accept(g.player.id,id,clip);
    else g.coop.toHost('vp',[id,clip]);
  }
  accept(pid,id,clip) {
    const g=this.g,p=g.playerById(pid);
    if(!g.auth || !p?.alive || !['play','morning'].includes(g.state) || typeof id!=='string' || id.length>64 || !validPhrase(clip)) return false;
    const now=performance.now();if(now-(this.rates.get(pid)||-1e9)<1500) return false;
    const list=this.bank.get(pid)||[];if(list.some(p=>p.id===id)) return false;
    list.push({id,pid,clip});while(list.length>2) list.shift();this.bank.set(pid,list);this.rates.set(pid,now);return true;
  }
  get available() { return [...this.bank.values()].some(a=>a.length); }
  replay() {
    const g=this.g;if(!g.auth || g.state!=='play' || this.current || !this.available) return false;
    const live=g.livePlayers();if(!live.length) return false;
    const target=live[Math.floor(g.rng.next()*live.length)];
    const all=[...this.bank.values()].flat().filter(p=>g.playerById(p.pid));
    const distant=all.filter(p=>{const owner=g.playerById(p.pid);return owner!==target && Math.hypot(owner.x-target.x,owner.z-target.z)>22;});
    const list=distant.length?distant:all;if(!list.length) return false;
    const phrase=list[Math.floor(g.rng.next()*list.length)];
    let spot=null;
    for(let i=0;i<24;i++) {
      const a=target.yaw+g.rng.float(-2.7,2.7),d=g.rng.float(10,19),x=target.x-Math.sin(a)*d,z=target.z-Math.cos(a)*d;
      if(Math.abs(x)>280 || Math.abs(z)>280 || !g.world.col.free(x,z,.5) || g.world.inYard(x,z,1)) continue;
      if(g.livePlayers().some(p=>Math.hypot(p.x-x,p.z-z)<5)) continue;
      const lake=g.world.lake;if(lake && Math.hypot(x-lake.x,z-lake.z)<lake.r+1) continue;
      spot={x,y:g.tools.groundHeight(x,z),z,yaw:Math.atan2(target.x-x,target.z-z)};break;
    }
    if(!spot) return false;
    const info=g.online?g.coop.players().find(p=>p.id===phrase.pid):null;
    const d={id:phrase.id,pid:phrase.pid,clip:phrase.clip,...spot,fit:cleanFit(info?.fit||myFit()),slot:info?.slot||0};
    if(g.sync) g.sync.ev('ve',d);
    this.hear(d);this.wait=g.rng.float(55,90);return true;
  }
  hear(d) {
    const g=this.g;
    if(!d || g.state!=='play' || typeof d.id!=='string' || typeof d.pid!=='string' || ![d.x,d.y,d.z,d.yaw].every(Number.isFinite) || Math.abs(d.x)>300 || Math.abs(d.z)>300 || Math.abs(d.y)>100 || !validPhrase(d.clip)) return false;
    this.stop();
    const duration=d.clip.n/d.clip.hz;
    this.current={...d,end:performance.now()+(duration+1.5)*1000,duration};
    const rig=buildSurvivor(cleanFit(d.fit)),hex=PLAYER_HEX[(d.slot|0)&3];
    const mat=createPersonMaterial(rig.dyes,hex);mat.uniforms.uEcho.value=1;
    const meshes=dressPerson(rig,mat);rig.root.position.set(d.x,d.y,d.z);rig.root.rotation.y=d.yaw;rig.root.visible=false;g.scene.add(rig.root);
    this.figure={rig,hex,meshes,mat};
    if(g.audio.ready) {
      const buffer=decodePhrase(d.clip,g.audio.ctx);
      if(buffer) this.sound=g.audio.cleanImitation(d.pid,buffer,d.x,d.y+1.5,d.z);
    }
    // Never feed our own imitation back into the phrase bank or the microphone's threat meter.
    g.mic.selfUntil=performance.now()+duration*1000+400;
    g.stats.seen.shade=1;
    // A voice reveals a survivor-shaped echo, just like real speech. No red monster marker gives it away.
    g.pulses.emit(d.x,d.y+1.35,d.z,g.time,{radius:19,strength:.7,decay:.65,color:[.84,.92,1],kind:'shadeVoice'});
    return true;
  }
  reveal(front) {
    const c=this.current,f=this.figure,g=this.g;if(!c||!f)return;
    const d=Math.hypot(c.x-front.x,c.y+1-front.y,c.z-front.z);
    if(d>front.prevR && d<=front.curR && d<=front.radius) g.ghosts.spawn(f.rig,g.time,{strength:.95,color:f.hex,life:2.5,decay:.9});
  }
  update(dt) {
    const g=this.g;
    if(!['play','morning'].includes(g.state)) { if(this.current) this.stop();this.capture.reset();return; }
    const c=this.current;
    if(c && this.figure) {
      if(performance.now()>=c.end) { this.stop(); }
      else {
        const f=this.figure;poseSurvivor(f.rig,g.time*.8,0,false,false);
        f.rig.nodes.head.rotation.y=Math.sin(g.time*.5)*.14;
        f.rig.root.position.set(c.x,c.y,c.z);f.rig.root.rotation.set(0,c.yaw,0);
        f.rig.root.visible=g.glowAt(c.x,c.y+1,c.z)>.03;
        if(this.sound) this.sound.gain(g.audio.voiceGains.get(c.pid)??1);
      }
    }
    if(g.auth && g.state==='play' && g.awake) {
      this.wait-=dt;if(this.wait<=0) { this.wait=8;this.replay(); }
    }
  }
}
