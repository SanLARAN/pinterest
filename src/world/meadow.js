// Field grass shares the paths' palette and real lighting. A separate, culled mesh per chunk:
// blades are decorative, never colliders or hundreds of thousands of shadow-map occluders.
import * as THREE from 'three';
import { RNG, smoothstep } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';

export class Meadow {
  constructor(world) { this.world=world;this.meshes=[];this.tufts=0;this.vertices=0;this.samples=[]; }
  allowed(x,z) {
    const w=this.world,L=w.lake,Y=w.zarya;
    if(L&&Math.hypot(x-L.x,z-L.z)<L.r+3)return false;
    if(Math.abs(x-96)<17&&z>230)return false; // forestry yard, gate and escape road
    if(w.trails?.near(x,z,.32)||!w.col.free(x,z,.2))return false;
    for(const f of Y?.floors||[])if(Math.abs(x-f.x)<f.w/2+.35&&Math.abs(z-f.z)<f.d/2+.35)return false;
    if(Y&&Math.abs(x-Y.x)<6.3&&Math.abs(z-Y.z)<6.3)return false;
    const lm=w.inLandmark(x,z);
    if(lm&&['cabin','cabin2','medhut','yard','wreck','wreck2','tower','tower2'].includes(lm.id)&&Math.hypot(x-lm.x,z-lm.z)<lm.r*.8)return false;
    return true;
  }
  generate() {
    const w=this.world,rng=new RNG(w.seed^0x6d656164),C=40,buckets=new Map(),half=w.half-12,step=1.25;
    for(let gz=-half;gz<half;gz+=step)for(let gx=-half;gx<half;gx+=step) {
      const x=gx+rng.float(-.6,.6),z=gz+rng.float(-.6,.6);
      const patch=w.terrain.noise.noise(x/19+42,z/19-63),small=w.terrain.noise.noise(x/5.5,z/5.5);
      let density=.32+.5*smoothstep(-.55,.55,patch)+.13*small;
      density*=smoothstep(5,10,Math.hypot(x,z-3)); // trodden camp centre, softly feathered edge
      if(!rng.chance(density)||!this.allowed(x,z))continue;
      const k=`${Math.floor((x+300)/C)},${Math.floor((z+300)/C)}`;
      if(!buckets.has(k))buckets.set(k,{b:new MeshBuilder(16000),weights:[],heights:[]});
      const q=buckets.get(k),y=w.terrain.height(x,z)+.008,h=rng.float(.12,.33)*(1+.2*patch),yaw=rng.float(0,Math.PI);
      for(let i=0;i<3;i++) {
        const a=yaw+i*1.047,dx=Math.cos(a)*rng.float(.045,.095),dz=Math.sin(a)*rng.float(.045,.095),hh=h*rng.float(.7,1.15);
        q.b.identity();q.b.triN([x-dx,y,z-dz],[x+dx,y,z+dz],[x+dx*.8,y+hh,z+dz*.8],[0,1,0],KIND.TRAIL_GRASS);
        q.weights.push(0,0,1);q.heights.push(hh,hh,hh);
      }
      this.tufts++;if(this.samples.length<256)this.samples.push({x,z,y,h});
    }
    // Same fragment shader/uniforms as the forest: no emissive grass or bright navigation stripe.
    const vertexShader=w.material.vertexShader?.replace('varying vec3 vWorld;',`attribute float blade;
attribute float bladeHeight;
uniform float uTime;
uniform vec3 uCam;
varying vec3 vWorld;`).replace('vWorld = wp.xyz;',`float fade=1.-smoothstep(58.,83.,distance(wp.xz,uCam.xz));
  wp.y-=blade*bladeHeight*(1.-fade);
  wp.x+=blade*fade*.055*sin(uTime*1.7+wp.x*.72+wp.z*.43);
  wp.z+=blade*fade*.025*cos(uTime*1.3+wp.x*.51+wp.z*.37);
  vWorld = wp.xyz;`);
    this.material=vertexShader?new THREE.ShaderMaterial({uniforms:w.material.uniforms,vertexShader,fragmentShader:w.material.fragmentShader,side:THREE.DoubleSide}):w.material;
    for(const q of buckets.values()) {
      const geo=q.b.toGeometry();geo.setAttribute('blade',new THREE.Float32BufferAttribute(q.weights,1));geo.setAttribute('bladeHeight',new THREE.Float32BufferAttribute(q.heights,1));geo.computeBoundingSphere();geo.boundingSphere.radius+=.15;
      // Keep the first blade of EVERY tuft at the start of one fixed index buffer. Far LOD
      // draws all patches uniformly, never half of a chunk or a rectangular strip of missing grass.
      const indices=[];for(let i=0;i<q.b.count;i+=9)indices.push(i,i+1,i+2);
      const lowCount=indices.length;for(let i=0;i<q.b.count;i+=9)indices.push(i+3,i+4,i+5,i+6,i+7,i+8);
      geo.setIndex(indices);
      const mesh=new THREE.Mesh(geo,this.material);mesh.userData.fieldGrass=true;mesh.userData.centre=geo.boundingSphere.center.clone();mesh.userData.lowCount=lowCount;mesh.userData.fullCount=q.b.count;w.scene.add(mesh);this.meshes.push(mesh);this.vertices+=q.b.count;
    }
    return this;
  }
  update(camera) {
    for(const m of this.meshes){const p=m.userData.centre,d=Math.hypot(p.x-camera.position.x,p.z-camera.position.z);m.visible=d<110;m.geometry.setDrawRange(0,d>55?m.userData.lowCount:m.userData.fullCount);}
  }
}
