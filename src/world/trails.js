// The old forestry footpaths. Built once, before trees/scatter, with their OWN RNG; not quest lines.
// They reserve a narrow walkable corridor and use the forest's ordinary, shadowed light material.
import { RNG } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';
import { Collision } from './collision.js';

export const TRAIL_CELL = 2;
export const TRAIL_CLEARANCE = .88;
const GRID = 16;
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
// Soil needs its across-path coordinate for a mossy, irregular edge, not a hard painted ribbon.
function soilQuad(b,points,across) {
  b._ensure(6);
  for(const i of[0,1,2,0,2,3])b._v(...points[i],Math.round(across[i]*255),255,255,KIND.TRAIL);
}

const key = (x,z) => `${x},${z}`;

class Heap {
  constructor() { this.a=[]; }
  push(v) { const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p;}a[i]=v; }
  pop() { const a=this.a,first=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].f<a[j].f)j++;if(a[j].f>=v.f)break;a[i]=a[j];i=j;}a[i]=v;}return first; }
}

// Kept separate from rendering so route/collision regressions run without WebGL or a DOM.
export class ForestTrails {
  constructor(world) {
    this.world=world;this.rng=new RNG((world.seed^0x71a115)>>>0);
    this.routes=[];this.buckets=new Map();this.nodes=new Map();this.length=0;this.vertices=0;
  }
  safe(x,z,r=TRAIL_CLEARANCE) {
    const w=this.world,L=w.lake;
    return Math.max(Math.abs(x),Math.abs(z))<w.half-20 && (!L||Math.hypot(x-L.x,z-L.z)>L.r+3+r) && w.col.free(x,z,r);
  }
  clear(a,b,r=TRAIL_CLEARANCE) {
    const n=Math.max(1,Math.ceil(distance(a,b)/.6));
    for(let i=0;i<=n;i++)if(!this.safe(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,r))return false;
    return true;
  }
  nearestFree(p) {
    const x=Math.round(p.x/TRAIL_CELL),z=Math.round(p.z/TRAIL_CELL);
    for(let ring=0;ring<=10;ring++)for(let dz=-ring;dz<=ring;dz++)for(let dx=-ring;dx<=ring;dx++) {
      if(Math.max(Math.abs(dx),Math.abs(dz))!==ring)continue;
      const q={x:(x+dx)*TRAIL_CELL,z:(z+dz)*TRAIL_CELL};
      if(this.safe(q.x,q.z))return q;
    }
    return null;
  }
  route(start,end) {
    const C=TRAIL_CELL,s={x:Math.round(start.x/C),z:Math.round(start.z/C)},goal={x:Math.round(end.x/C),z:Math.round(end.z/C)};
    const loX=Math.min(s.x,goal.x)-14,hiX=Math.max(s.x,goal.x)+14,loZ=Math.min(s.z,goal.z)-14,hiZ=Math.max(s.z,goal.z)+14;
    const open=new Heap(),best=new Map(),closed=new Set(),valid=new Map(),records=new Map();
    const heuristic=(x,z)=>Math.hypot(x-goal.x,z-goal.z);
    const allowed=(x,z)=>{const k=key(x,z);if(!valid.has(k))valid.set(k,this.safe(x*C,z*C));return valid.get(k);};
    const sk=key(s.x,s.z),gk=key(goal.x,goal.z);best.set(sk,0);open.push({...s,g:0,f:heuristic(s.x,s.z),k:sk});
    let last=null,steps=0;
    while(open.a.length&&steps++<16000) {
      const p=open.pop();if(closed.has(p.k))continue;closed.add(p.k);
      if(p.k===gk){last=p;break;}
      const h0=this.world.terrain.height(p.x*C,p.z*C);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++) {
        if(!dx&&!dz)continue;
        const x=p.x+dx,z=p.z+dz,k=key(x,z);
        if(x<loX||x>hiX||z<loZ||z>hiZ||closed.has(k)||!allowed(x,z))continue;
        if(dx&&dz&&(!allowed(x,p.z)||!allowed(p.x,z)))continue;
        const dh=Math.abs(this.world.terrain.height(x*C,z*C)-h0);if(dh>1.6)continue;
        // Long-wave variation, not random per-visit noise: deterministic gentle bends.
        const wav=1+.12*Math.sin(x*.17+z*.12)+.1*Math.cos(z*.21-x*.09);
        const g=p.g+Math.hypot(dx,dz)*wav+dh*.26;
        if(g>=(best.get(k)??Infinity))continue;
        const next={x,z,g,f:g+heuristic(x,z)*.75,k,parent:p.k};best.set(k,g);records.set(k,next);open.push(next);
      }
    }
    if(!last)return null; // no fake route through a wall if a future map closes a passage
    const points=[];
    while(last){points.push({x:last.x*C,z:last.z*C});last=records.get(last.parent);}
    if(points[points.length-1]?.x!==s.x*C||points[points.length-1]?.z!==s.z*C)points.push({x:s.x*C,z:s.z*C});
    points.reverse();
    for(let pass=0;pass<4;pass++)for(let i=1;i<points.length-1;i++) {
      const a=points[i-1],p=points[i],b=points[i+1],q={x:p.x*.5+(a.x+b.x)*.25,z:p.z*.5+(a.z+b.z)*.25};
      if(this.clear(a,q)&&this.clear(q,b))points[i]=q;
    }
    const out=[points[0]];
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(distance(a,b)/.85));
      for(let j=1;j<=n;j++)out.push({x:a.x+(b.x-a.x)*j/n,z:a.z+(b.z-a.z)*j/n});
    }
    return out;
  }
  generate(landmarks) {
    const fixed={camp:[0,13],west:[-40,26],north:[-55,-48],east:[32,-26],south:[24,77],cross:[23,140],lookoutFork:[-130,113],zaryaFork:[-125,-130],yardFork:[96,210]};
    for(const [id,[x,z]]of Object.entries(fixed))this.nodes.set(id,this.nearestFree({x,z}));
    const destinations=[['tower','west'],['wreck','north'],['cabin','east'],['stones','south'],['firetower','lookoutFork'],['zarya','zaryaFork'],['yard','yardFork'],['medhut','camp'],['cabin2','cross']];
    for(const [id,parent]of destinations) {
      const L=landmarks.find(l=>l.id===id),from=this.nodes.get(parent);if(!L||!from)continue;
      const d=Math.max(1,Math.hypot(from.x-L.x,from.z-L.z)),r=id==='yard'?19:id==='zarya'?29:Math.max(4,L.r-2);
      const p=id==='yard'?{x:96,z:236}:id==='zarya'?{x:L.x,z:L.z+29}:{x:L.x+(from.x-L.x)/d*r,z:L.z+(from.z-L.z)/d*r};
      this.nodes.set(id,this.nearestFree(p));
    }
    const edges=[['camp','west'],['west','north'],['camp','east'],['camp','south'],['west','tower'],['north','wreck'],['east','cabin'],['south','stones'],['south','cross'],['tower','lookoutFork'],['lookoutFork','firetower'],['north','zaryaFork'],['zaryaFork','zarya'],['cross','yardFork'],['yardFork','yard'],['camp','medhut'],['cross','cabin2']];
    for(const [from,to]of edges) {
      const a=this.nodes.get(from),b=this.nodes.get(to);if(!a||!b)continue;
      const points=this.route(a,b);if(!points)continue;
      const route={from,to,points,length:0};
      for(let i=1;i<points.length;i++) {
        const p=points[i-1],q=points[i],seg={a:p,b:q,route};route.length+=distance(p,q);
        const x0=Math.floor((Math.min(p.x,q.x)-3)/GRID),x1=Math.floor((Math.max(p.x,q.x)+3)/GRID),z0=Math.floor((Math.min(p.z,q.z)-3)/GRID),z1=Math.floor((Math.max(p.z,q.z)+3)/GRID);
        for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const k=key(x,z);if(!this.buckets.has(k))this.buckets.set(k,[]);this.buckets.get(k).push(seg);}
      }
      this.length+=route.length;this.routes.push(route);
    }
    return this;
  }
  near(x,z,r=1.35) {
    const segs=this.buckets.get(key(Math.floor(x/GRID),Math.floor(z/GRID)));if(!segs)return false;
    const out={};
    for(const {a,b}of segs)if(Collision.closest({ax:a.x,az:a.z,bx:b.x,bz:b.z,r:0},x,z,out).d<r)return true;
    return false;
  }
  crosses(ax,az,bx,bz,r=1.8) {
    const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)));
    for(let i=0;i<=n;i++)if(this.near(ax+(bx-ax)*i/n,az+(bz-az)*i/n,r))return true;
    return false;
  }
  build() {
    const w=this.world,rng=this.rng,terr=w.terrain;
    for(const route of this.routes)for(let begin=0;begin<route.points.length-1;begin+=10) {
      const arr=new MeshBuilder(320),end=Math.min(route.points.length-1,begin+10),mid=route.points[(begin+end)>>1];
      for(let i=begin;i<end;i++) {
        const a=route.points[i],b=route.points[i+1],d=distance(a,b);if(d<.001)continue;
        const nx=-(b.z-a.z)/d,nz=(b.x-a.x)/d,phase=i*.13+route.length*.09;
        const half=.58+.12*Math.sin(phase),overgrown=Math.sin(i*.23+route.length)>.67;
        const v=(p,side)=>{const x=p.x+nx*side,z=p.z+nz*side;return[x,terr.height(x,z)+.021,z];};
        // Worn soil fades in and out under tufts. No paint crossing a landmark's solid geometry.
        if(!overgrown||rng.chance(.38)) {
          soilQuad(arr,[v(a,-half),v(a,0),v(b,0),v(b,-half)],[0,.5,.5,0]);
          soilQuad(arr,[v(a,0),v(a,half),v(b,half),v(b,0)],[.5,1,1,.5]);
          if(rng.chance(.25)) {const off=rng.float(-.3,.3),width=rng.float(.035,.075);arr.quadN(v(a,off-width),v(b,off-width),v(b,off+width),v(a,off+width),[0,1,0],KIND.TRAIL_RUT,15);}
        }
        const tufts=overgrown?7:4;
        for(let g=0;g<tufts;g++) {
          const t=rng.next(),side=g===0&&overgrown?rng.float(-half,half):(g%2?1:-1)*rng.float(half*.7,half+ .42),x=a.x+(b.x-a.x)*t+nx*side,z=a.z+(b.z-a.z)*t+nz*side,y=terr.height(x,z)+.025;
          const h=rng.float(.09,overgrown?.25:.19),wid=rng.float(.045,.09),yaw=rng.float(0,Math.PI);
          for(const angle of[yaw,yaw+Math.PI*.48]) {const dx=Math.cos(angle)*wid,dz=Math.sin(angle)*wid;arr.triN([x-dx,y,z-dz],[x+dx,y,z+dz],[x+dx*.7,y+h,z+dz*.7],[0,1,0],KIND.TRAIL_GRASS);}
        }
        if(i%15===4) {
          const c={x:(a.x+b.x)/2,z:(a.z+b.z)/2},span=rng.float(.35,.7);
          arr.identity();arr.limb([c.x-nx*span,terr.height(c.x-nx*span,c.z-nz*span)+.025,c.z-nz*span],[c.x+nx*span,terr.height(c.x+nx*span,c.z+nz*span)+.04,c.z+nz*span],.026,.012,KIND.BARK,3);
        }
      }
      const geometry=arr.toArrays();this.vertices+=geometry.count;
      w.addProp(mid.x,mid.z,b=>b.append(geometry));
    }
    // A handful of rotten direction posts. No objective names, glowing arrows or new HUD.
    for(const id of['west','south','north']) {
      const p=this.nodes.get(id);if(!p)continue;
      const x=p.x+1.65,z=p.z+.4,y=terr.height(x,z);
      w.addProp(x,z,b=>{b.place(x,y,z,0,-.35,.12);b.box(.1,1.2,.1,KIND.WOOD,{bottom:true});b.place(x,y+.96,z,0,-.35,.08);b.box(.55,.12,.055,KIND.WOOD);});
    }
    return this;
  }
}
