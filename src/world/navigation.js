// Host-only, bounded local A*. Static walls/furniture AND live door/gate capsules are consulted.
// Door-centred grids and continuous edge tests find narrow, rotated openings without wall clipping.
import { CFG } from '../core/config.js';
const CELL=.5,MAX_NODES=6000;
class Heap{constructor(){this.a=[];}push(v){let i=this.a.length;this.a.push(v);while(i){const p=(i-1)>>1;if(this.a[p].f<=v.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=v;}pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let j=i*2+1;if(j+1<this.a.length&&this.a[j+1].f<this.a[j].f)j++;if(this.a[j].f>=last.f)break;this.a[i]=this.a[j];i=j;}this.a[i]=last;}return first;}}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function buildingPortal(b){const yaw=b.ry||0,c=Math.cos(yaw),s=Math.sin(yaw),local=b.gap?(b.gap[0]+b.gap[1])/2:0,z=b.D/2;const mid={x:b.x+local*c+z*s,z:b.z-local*s+z*c},normal={x:s,z:c};return{...b,c,s,mid,inside:{x:mid.x-s*1.15,z:mid.z-c*1.15},outside:{x:mid.x+s*1.4,z:mid.z+c*1.4},normal};}
function inside(p,a){const dx=a.x-p.x,dz=a.z-p.z;return Math.abs(dx*p.c-dz*p.s)<p.W/2-.08&&Math.abs(dx*p.s+dz*p.c)<p.D/2-.08;}
export class ForestNavigation {
 constructor(world){this.world=world;this.portals=[...(world.doors||[]),...(world.navBuildings||[])].map(buildingPortal);this.stamp=null;this.plansThisFrame=0;this.searches=0;this.expanded=0;}
 beginFrame(stamp){if(this.stamp!==stamp){this.stamp=stamp;this.plansThisFrame=0;}}
 radiusAt(x,z,r){for(const p of this.portals)if(Math.hypot(x-p.mid.x,z-p.mid.z)<1.8)return Math.min(r,.32);return r;}
 free(x,z,r=.5){const rr=this.radiusAt(x,z,r),w=this.world,L=w.lake;if(Math.max(Math.abs(x),Math.abs(z))>CFG.WORLD_WALL-1)return false;if(L&&Math.hypot(x-L.x,z-L.z)<L.r+.55+rr)return false;return w.col.free(x,z,rr);}
 segment(a,b,r=.5){const d=distance(a,b),n=Math.max(1,Math.ceil(d/.2));for(let i=0;i<=n;i++)if(!this.free(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,r))return false;return true;}
 redirect(a,b){for(const p of this.portals){const ai=inside(p,a),bi=inside(p,b);if(ai===bi)continue;const near=ai?p.inside:p.outside,far=ai?p.outside:p.inside;
   const dx=a.x-p.mid.x,dz=a.z-p.mid.z,tangent=Math.abs(dx*p.c-dz*p.s),depth=Math.abs(dx*p.s+dz*p.c);
   return{point:distance(a,near)<.65||tangent<.23&&depth<2?far:near,portal:p};
  }return{point:b,portal:null};}
 path(a,b,r=.5,portal=null){
  this.searches++;const began=performance.now();
  let origin=portal?.mid;if(!origin){let best=7;for(const p of this.portals){const d=Math.min(distance(a,p.mid),distance(b,p.mid));if(d<best){best=d;origin=p.mid;}}}origin=origin||{x:0,z:0};
  const key=(x,z)=>`${x},${z}`,point=(x,z)=>({x:origin.x+x*CELL,z:origin.z+z*CELL});
  const valid=new Map(),ok=(x,z)=>{const k=key(x,z);if(!valid.has(k)){const p=point(x,z);valid.set(k,this.free(p.x,p.z,r));}return valid.get(k);};
  const nearest=(p,connect)=>{const x=Math.round((p.x-origin.x)/CELL),z=Math.round((p.z-origin.z)/CELL);for(let ring=0;ring<=8;ring++)for(let dz=-ring;dz<=ring;dz++)for(let dx=-ring;dx<=ring;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==ring||!ok(x+dx,z+dz))continue;const q=point(x+dx,z+dz);if(!connect||this.segment(p,q,r))return{x:x+dx,z:z+dz};}return null;};
  const start=nearest(a,true),goal=nearest(b,false);if(!start||!goal)return null;
  const loX=Math.min(start.x,goal.x)-18,hiX=Math.max(start.x,goal.x)+18,loZ=Math.min(start.z,goal.z)-18,hiZ=Math.max(start.z,goal.z)+18;
  const records=new Map(),best=new Map(),closed=new Set(),open=new Heap(),gk=key(goal.x,goal.z),sk=key(start.x,start.z);const first={...start,k:sk,g:0,f:distance(start,goal)};records.set(sk,first);open.push(first);best.set(sk,0);let last=null,nodes=0;
  while(open.a.length&&nodes++<MAX_NODES){const q=open.pop();if(closed.has(q.k))continue;closed.add(q.k);if(q.k===gk){last=q;break;}
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const x=q.x+dx,z=q.z+dz,k=key(x,z);if(x<loX||x>hiX||z<loZ||z>hiZ||closed.has(k)||!ok(x,z))continue;
    const from=point(q.x,q.z),to=point(x,z);if(!this.segment(from,to,r))continue;const g=q.g+Math.hypot(dx,dz);if(g>=(best.get(k)??Infinity))continue;const next={x,z,k,g,f:g+Math.hypot(x-goal.x,z-goal.z)*.95,parent:q.k};best.set(k,g);records.set(k,next);open.push(next);
   }
  }
  this.expanded=nodes;this.lastMs=performance.now()-began;if(!last)return null;
  const result=[];while(last){result.push(point(last.x,last.z));last=records.get(last.parent);}result.reverse();
  if(this.segment(result[result.length-1],b,r))result.push({...b});
  return result;
 }
 next(agent,goal,dt,r){const a={x:agent.x,z:agent.z},redirect=this.redirect(a,goal);let b=redirect.point;const d=distance(a,b);if(d>42&&!redirect.portal)b={x:a.x+(b.x-a.x)/d*36,z:a.z+(b.z-a.z)/d*36};
  if(this.segment(a,b,r)){agent.nav=null;return b;}
  if(agent.navRetry>0)agent.navRetry-=dt;
  let nav=agent.nav;if(nav)nav.ttl-=dt;
  const replan=!nav||nav.ttl<=0||distance(nav.goal,b)>2||nav.index>=nav.path.length||!this.segment(a,nav.path[nav.index],r);
  if(replan&&this.plansThisFrame<1&&!(agent.navRetry>0)){this.plansThisFrame++;const path=this.path(a,b,r,redirect.portal);if(path?.length){nav=agent.nav={path,index:0,goal:{...b},ttl:.9+((Number(agent.id)||0)%5)*.11};}else{agent.nav=null;agent.navRetry=.75;return this.probe(a,b,r);}}
  if(!nav)return this.probe(a,b,r);
  while(nav.index<nav.path.length-1&&distance(a,nav.path[nav.index])<.38)nav.index++;
  let at=nav.index;for(let i=Math.min(nav.path.length-1,at+10);i>at;i--)if(this.segment(a,nav.path[i],r)){at=i;break;}
  return this.segment(a,nav.path[at],r)?nav.path[at]:a;
 }
 probe(a,b,r){const yaw=Math.atan2(b.x-a.x,b.z-a.z);for(const delta of[0,.5,-.5,1,-1,1.5,-1.5]){const p={x:a.x+Math.sin(yaw+delta)*1.2,z:a.z+Math.cos(yaw+delta)*1.2};if(this.segment(a,p,r))return p;}return a;}
}
