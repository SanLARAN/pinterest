// One physical map per run, printed from the seeded ORIGINAL hiding places. Not a GPS/minimap.
import * as THREE from 'three';
import {CFG} from '../core/config.js';
import {t} from '../core/i18n.js';
import {damp} from '../core/rng.js';
import {shared,PULSE_GLSL} from '../render/sonar.js';
export const MAP_WIDTH=.43,MAP_HEIGHT=.49;
export function mapProjection(x,z,size=720,pad=88){const span=CFG.WORLD_HALF*2;return{x:pad+(x+CFG.WORLD_HALF)/span*size,y:170+(CFG.WORLD_HALF-z)/span*size};}
export function initialPartLocations(parts){return parts.map(p=>({key:p.key,site:p.site,x:p.home?.x??p.x,z:p.home?.z??p.z}));}
const vertex='varying vec2 uv0;varying vec3 worldPos;void main(){uv0=uv;vec4 p=modelMatrix*vec4(position,1.);worldPos=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}';
export class PartMap {
 constructor(game){
  this.g=game;const Y=game.world.yard;this.source={x:Y.x+14.75,y:game.world.terrain.height(Y.x+14.75,Y.z+1.45)+.872,z:Y.z+1.45,taken:false};
  this.canvas=document.createElement('canvas');this.canvas.width=896;this.canvas.height=1088;this.texture=new THREE.CanvasTexture(this.canvas);this.texture.minFilter=THREE.LinearFilter;
  this.worldMat=new THREE.ShaderMaterial({uniforms:{...shared,map:{value:this.texture}},vertexShader:vertex,fragmentShader:`${PULSE_GLSL} uniform sampler2D map;varying vec2 uv0;varying vec3 worldPos;void main(){vec3 N=vec3(0.,1.,0.);float ring;vec3 echo=sonarLight(worldPos,N,ring);vec3 real=lampLight(worldPos,N)*1.3+glowLight(worldPos,N)+flareLight(worldPos,N)+vec3(uDawn*.85);float lit=clamp(max(real.r,max(real.g,real.b)),0.,1.);gl_FragColor=vec4(texture2D(map,uv0).rgb*(real+echo*.13),1.-lit*.95);}`,side:THREE.DoubleSide});
  this.worldMesh=new THREE.Mesh(new THREE.PlaneGeometry(.43,.51),this.worldMat);this.worldMesh.rotation.x=-Math.PI/2;this.worldMesh.position.set(this.source.x,this.source.y,this.source.z);game.scene.add(this.worldMesh);
  this.viewRoot=new THREE.Group();this.viewRoot.visible=false;game.scene.add(this.viewRoot);
  const mat=new THREE.ShaderMaterial({uniforms:{map:{value:this.texture}},vertexShader:vertex,fragmentShader:'uniform sampler2D map;varying vec2 uv0;void main(){vec3 c=texture2D(map,uv0).rgb;gl_FragColor=vec4(c*.82,0.);}',side:THREE.DoubleSide});
  this.paper=new THREE.Mesh(new THREE.PlaneGeometry(MAP_WIDTH,MAP_HEIGHT,2,2),mat);this.paper.frustumCulled=false;this.paper.renderOrder=9;this.viewRoot.add(this.paper);
  this.a11y=document.createElement('output');this.a11y.id='partMapData';this.a11y.className='sr-only';this.a11y.hidden=true;document.getElementById('hud').append(this.a11y);this.reset();
 }
 reset(){this.has=false;this.owner=null;this.sequence=0;this.want=false;this.amount=0;this.source.taken=false;this.worldMesh.visible=true;this.viewRoot.visible=false;this.locations=initialPartLocations(this.g.escape.parts);this.lang='';this.draw();}
 fold(now=false){this.want=false;if(now){this.amount=0;this.viewRoot.visible=false;}}
 get active(){return this.want||this.amount>.01;}
 toggle(){if(!this.has)return;this.want=!this.want;this.g.input.peekHeld=false;this.g.input.peekTouchUntil=0;if(this.g.audio.ready)this.g.audio.paper();}
 claimed(pid){this.source.taken=true;this.worldMesh.visible=false;this.owner=pid;}
 consider(fn){if(!this.source.taken)fn(this.source,this.source.x,this.source.z,1.8,'partMap');}
 interact(pressed,T){const ok=this.g.inventory.canReceive('map');this.g.hud.setUse(ok?T('usePartMap'):t('bagFull'),0,ok);if(pressed&&ok)this.g.inventory.claim('map',0,0);}
 dropFor(pid){if(!this.g.auth||this.owner!==pid)return;const p=this.g.playerById(pid);if(p)this.g.inventory.hostDrop(pid,`map-left-${++this.sequence}`,{kind:'map',n:1},!p.alive,true);}
 update(dt){if(!this.has||!this.g.player.alive||this.g.inputMuted||this.g.inventory.active||this.g.inventory.equipped!=='map'||this.g.player.carrying||this.g.escape.held||this.g.cabinets.busy)this.want=false;this.amount=damp(this.amount,this.want?1:0,10,dt);this.a11y.hidden=!(this.has&&this.amount>.01);if(!this.has)this.amount=0;const title=t('partMapTitle');if(this.lang!==title){this.lang=title;this.draw();}}
 distance(camera){const tan=Math.tan(camera.fov*Math.PI/360);return Math.max(.43,MAP_WIDTH/(2*tan*camera.aspect*.84),MAP_HEIGHT/(2*tan*.78));}
 place(camera,show){this.viewRoot.visible=!!show&&this.amount>.01;if(!this.viewRoot.visible)return;this.viewRoot.position.copy(camera.position);this.viewRoot.quaternion.copy(camera.quaternion);this.paper.position.set(0,-.035-(1-this.amount)*.6,-this.distance(camera));this.paper.rotation.set((1-this.amount)*-.5,0,.015);}
 draw(){
  const c=this.canvas.getContext('2d');c.fillStyle='#bcb18b';c.fillRect(0,0,896,1088);c.strokeStyle='#716f50';c.lineWidth=4;c.strokeRect(24,24,848,1040);
  c.fillStyle='#30392d';c.font='bold 38px monospace';c.textAlign='center';c.fillText(t('partMapTitle'),448,82,790);c.font='18px monospace';c.fillText(t('partMapLegend'),448,122,780);
  c.strokeStyle='#7c8061';c.lineWidth=1;for(let i=0;i<=6;i++){const p=88+i*720/6;c.beginPath();c.moveTo(p,170);c.lineTo(p,890);c.moveTo(88,170+i*720/6);c.lineTo(808,170+i*720/6);c.stroke();}
  // All map marks are world locations, never players/monsters, and never update as a carried part moves.
  const w=this.g.world;for(const L of[{x:0,z:0,name:t('partMapCamp')},{x:w.yard.x,z:w.yard.z,name:t('partMapYard')}]){const p=mapProjection(L.x,L.z);c.fillStyle='#30392d';c.fillRect(p.x-6,p.y-6,12,12);c.font='bold 17px monospace';c.fillText(L.name,p.x,p.y+27);}
  const lake=w.lake;if(lake){const p=mapProjection(lake.x,lake.z);c.strokeStyle='#617574';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,lake.r*720/600,lake.r*720/600*.9,.1,0,Math.PI*2);c.stroke();}
  const names=t('carParts');this.locations.forEach((loc,i)=>{const p=mapProjection(loc.x,loc.z);c.strokeStyle='#8e3024';c.lineWidth=4;c.beginPath();c.moveTo(p.x-8,p.y-8);c.lineTo(p.x+8,p.y+8);c.moveTo(p.x+8,p.y-8);c.lineTo(p.x-8,p.y+8);c.stroke();c.fillStyle='#582b22';c.font='bold 23px monospace';c.textAlign='left';c.fillText(String(i+1),p.x+12,p.y-9);});
  c.textAlign='left';c.fillStyle='#30392d';c.font='bold 26px monospace';this.locations.forEach((loc,i)=>c.fillText(`${i+1}. ${names[loc.key]} · ${Math.round(loc.x)}, ${Math.round(loc.z)}`,54,931+i*36,788));
  c.font='bold 18px monospace';c.fillText('N ↑',785,151);c.font='15px monospace';c.fillText(t('partMapCloseHint'),54,1070,790);
  c.strokeStyle='#f6e3a244';for(const x of[300,598]){c.lineWidth=2;c.beginPath();c.moveTo(x,26);c.lineTo(x,1060);c.stroke();}this.texture.needsUpdate=true;
  this.a11y.textContent=t('partMapLegend')+'. '+this.locations.map(loc=>`${names[loc.key]}: ${t('placeAt')[loc.site]||loc.site}; ${Math.round(loc.x)}, ${Math.round(loc.z)}`).join('. ');
 }
}
