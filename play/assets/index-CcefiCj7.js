const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dist-BiSlllSF.js","./dist-BlDYBy57.js","./dist-C6p1lRRO.js"])))=>i.map(i=>d[i]);
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e,t,n,r,i,a,o,s,c,l=1e3,u=1001,d=1002,f=1003,p=1004,m=1005,h=1006,g=1007,_=1008,v=1009,y=1010,b=1011,x=1012,S=1013,C=1014,w=1015,T=1016,E=1017,D=1018,ee=1020,O=35902,k=35899,A=1021,te=1022,j=1023,ne=1026,M=1027,re=1028,ie=1029,ae=1030,oe=1031,se=1033,ce=33776,le=33777,ue=33778,N=33779,de=35840,fe=35841,pe=35842,me=35843,he=36196,ge=37492,_e=37496,ve=37488,ye=37489,be=37490,xe=37491,Se=37808,Ce=37809,we=37810,Te=37811,Ee=37812,De=37813,Oe=37814,ke=37815,Ae=37816,je=37817,Me=37818,Ne=37819,Pe=37820,P=37821,Fe=36492,Ie=36494,Le=36495,F=36283,Re=36284,I=36285,ze=36286,Be=2300,Ve=2301,He=2302,Ue=2303,We=2400,Ge=2401,Ke=2402,qe=3200,Je=`srgb`,Ye=`srgb-linear`,Xe=`linear`,Ze=`srgb`,Qe=7680,$e=35044,et=35048,tt=2e3;function nt(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function rt(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function it(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function at(){let e=it(`canvas`);return e.style.display=`block`,e}var ot={};function st(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function ct(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function L(...e){e=ct(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function R(...e){e=ct(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function lt(...e){let t=e.join(` `);t in ot||(ot[t]=!0,L(...e))}function ut(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var dt={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},ft=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},pt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),mt=1234567,ht=Math.PI/180,gt=180/Math.PI;function _t(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(pt[e&255]+pt[e>>8&255]+pt[e>>16&255]+pt[e>>24&255]+`-`+pt[t&255]+pt[t>>8&255]+`-`+pt[t>>16&15|64]+pt[t>>24&255]+`-`+pt[n&63|128]+pt[n>>8&255]+`-`+pt[n>>16&255]+pt[n>>24&255]+pt[r&255]+pt[r>>8&255]+pt[r>>16&255]+pt[r>>24&255]).toLowerCase()}function vt(e,t,n){return Math.max(t,Math.min(n,e))}function yt(e,t){return(e%t+t)%t}function bt(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function xt(e,t,n){return e===t?0:(n-e)/(t-e)}function St(e,t,n){return(1-n)*e+n*t}function Ct(e,t,n,r){return St(e,t,1-Math.exp(-n*r))}function wt(e,t=1){return t-Math.abs(yt(e,t*2)-t)}function Tt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Et(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function Dt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Ot(e,t){return e+Math.random()*(t-e)}function kt(e){return e*(.5-Math.random())}function At(e){e!==void 0&&(mt=e);let t=mt+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function jt(e){return e*ht}function Mt(e){return e*gt}function Nt(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Pt(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Ft(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function It(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:L(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Lt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function Rt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var zt={DEG2RAD:ht,RAD2DEG:gt,generateUUID:_t,clamp:vt,euclideanModulo:yt,mapLinear:bt,inverseLerp:xt,lerp:St,damp:Ct,pingpong:wt,smoothstep:Tt,smootherstep:Et,randInt:Dt,randFloat:Ot,randFloatSpread:kt,seededRandom:At,degToRad:jt,radToDeg:Mt,isPowerOfTwo:Nt,ceilPowerOfTwo:Pt,floorPowerOfTwo:Ft,setQuaternionFromProperEuler:It,normalize:Rt,denormalize:Lt};o=Symbol.iterator;var z=class{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=vt(this.x,e.x,t.x),this.y=vt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=vt(this.x,e,t),this.y=vt(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(vt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(vt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[o](){yield this.x,yield this.y}};e=z,e.prototype.isVector2=!0;var Bt=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:L(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(vt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};s=Symbol.iterator;var B=class{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ht.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ht.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=vt(this.x,e.x,t.x),this.y=vt(this.y,e.y,t.y),this.z=vt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=vt(this.x,e,t),this.y=vt(this.y,e,t),this.z=vt(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(vt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Vt.copy(this).projectOnVector(e),this.sub(Vt)}reflect(e){return this.sub(Vt.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(vt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[s](){yield this.x,yield this.y,yield this.z}};t=B,t.prototype.isVector3=!0;var Vt=new B,Ht=new Bt,V=class{constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return lt(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Ut.makeScale(e,t)),this}rotate(e){return lt(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Ut.makeRotation(-e)),this}translate(e,t){return lt(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Ut.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};n=V,n.prototype.isMatrix3=!0;var Ut=new V,Wt=new V().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Gt=new V().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Kt(){let e={enabled:!0,workingColorSpace:Ye,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Jt(e.r),e.g=Jt(e.g),e.b=Jt(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Yt(e.r),e.g=Yt(e.g),e.b=Yt(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Xe:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return lt(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return lt(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Ye]:{primaries:t,whitePoint:r,transfer:Xe,toXYZ:Wt,fromXYZ:Gt,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Je},outputColorSpaceConfig:{drawingBufferColorSpace:Je}},[Je]:{primaries:t,whitePoint:r,transfer:Ze,toXYZ:Wt,fromXYZ:Gt,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Je}}}),e}var qt=Kt();function Jt(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Yt(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Xt,Zt=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Xt===void 0&&(Xt=it(`canvas`)),Xt.width=e.width,Xt.height=e.height;let t=Xt.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Xt}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=it(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Jt(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Jt(t[e]/255)*255):t[e]=Jt(t[e]);return{data:t,width:e.width,height:e.height}}return L(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Qt=0,$t=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Qt++}),this.uuid=_t(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(en(r[t].image)):e.push(en(r[t]))}else e=en(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function en(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Zt.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(L(`Texture: Unable to serialize Texture.`),{})}var tn=0,nn=new B,rn=class e extends ft{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=u,i=u,a=h,o=_,s=j,c=v,l=e.DEFAULT_ANISOTROPY,d=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:tn++}),this.uuid=_t(),this.name=``,this.source=new $t(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new z(0,0),this.repeat=new z(1,1),this.center=new z(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new V,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(nn).x}get height(){return this.source.getSize(nn).y}get depth(){return this.source.getSize(nn).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){L(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?L(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case l:e.x-=Math.floor(e.x);break;case u:e.x=e.x<0?0:1;break;case d:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case l:e.y-=Math.floor(e.y);break;case u:e.y=e.y<0?0:1;break;case d:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};rn.DEFAULT_IMAGE=null,rn.DEFAULT_MAPPING=300,rn.DEFAULT_ANISOTROPY=1,c=Symbol.iterator;var an=class{constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=vt(this.x,e.x,t.x),this.y=vt(this.y,e.y,t.y),this.z=vt(this.z,e.z,t.z),this.w=vt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=vt(this.x,e,t),this.y=vt(this.y,e,t),this.z=vt(this.z,e,t),this.w=vt(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(vt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[c](){yield this.x,yield this.y,yield this.z,yield this.w}};r=an,r.prototype.isVector4=!0;var on=class extends ft{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:h,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new an(0,0,e,t),this.scissorTest=!1,this.viewport=new an(0,0,e,t),this.textures=[];let r=new rn({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:h,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new $t(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},sn=class extends on{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},cn=class extends rn{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=f,this.minFilter=f,this.wrapR=u,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},ln=class extends rn{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=f,this.minFilter=f,this.wrapR=u,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},un=class e{constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/dn.setFromMatrixColumn(e,0).length(),i=1/dn.setFromMatrixColumn(e,1).length(),a=1/dn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(pn,e,mn)}lookAt(e,t,n){let r=this.elements;return _n.subVectors(e,t),_n.lengthSq()===0&&(_n.z=1),_n.normalize(),hn.crossVectors(n,_n),hn.lengthSq()===0&&(Math.abs(n.z)===1?_n.x+=1e-4:_n.z+=1e-4,_n.normalize(),hn.crossVectors(n,_n)),hn.normalize(),gn.crossVectors(_n,hn),r[0]=hn.x,r[4]=gn.x,r[8]=_n.x,r[1]=hn.y,r[5]=gn.y,r[9]=_n.y,r[2]=hn.z,r[6]=gn.z,r[10]=_n.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],ee=r[13],O=r[2],k=r[6],A=r[10],te=r[14],j=r[3],ne=r[7],M=r[11],re=r[15];return i[0]=a*x+o*T+s*O+c*j,i[4]=a*S+o*E+s*k+c*ne,i[8]=a*C+o*D+s*A+c*M,i[12]=a*w+o*ee+s*te+c*re,i[1]=l*x+u*T+d*O+f*j,i[5]=l*S+u*E+d*k+f*ne,i[9]=l*C+u*D+d*A+f*M,i[13]=l*w+u*ee+d*te+f*re,i[2]=p*x+m*T+h*O+g*j,i[6]=p*S+m*E+h*k+g*ne,i[10]=p*C+m*D+h*A+g*M,i[14]=p*w+m*ee+h*te+g*re,i[3]=_*x+v*T+y*O+b*j,i[7]=_*S+v*E+y*k+b*ne,i[11]=_*C+v*D+y*A+b*M,i[15]=_*w+v*ee+y*te+b*re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,ee=d*g-f*h,O=_*ee-v*D+y*E+b*T-x*w+S*C;if(O===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let k=1/O;return e[0]=(o*ee-s*D+c*E)*k,e[1]=(r*D-n*ee-i*E)*k,e[2]=(m*S-h*x+g*b)*k,e[3]=(d*x-u*S-f*b)*k,e[4]=(s*T-a*ee-c*w)*k,e[5]=(t*ee-r*T+i*w)*k,e[6]=(h*y-p*S-g*v)*k,e[7]=(l*S-d*y+f*v)*k,e[8]=(a*D-o*T+c*C)*k,e[9]=(n*T-t*D-i*C)*k,e[10]=(p*x-m*y+g*_)*k,e[11]=(u*y-l*x-f*_)*k,e[12]=(o*w-a*E-s*C)*k,e[13]=(t*E-n*w+r*C)*k,e[14]=(m*v-p*b-h*_)*k,e[15]=(l*b-u*v+d*_)*k,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=dn.set(r[0],r[1],r[2]).length(),o=dn.set(r[4],r[5],r[6]).length(),s=dn.set(r[8],r[9],r[10]).length();i<0&&(a=-a),fn.copy(this);let c=1/a,l=1/o,u=1/s;return fn.elements[0]*=c,fn.elements[1]*=c,fn.elements[2]*=c,fn.elements[4]*=l,fn.elements[5]*=l,fn.elements[6]*=l,fn.elements[8]*=u,fn.elements[9]*=u,fn.elements[10]*=u,t.setFromRotationMatrix(fn),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=tt,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=tt,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};i=un,i.prototype.isMatrix4=!0;var dn=new B,fn=new un,pn=new B(0,0,0),mn=new B(1,1,1),hn=new B,gn=new B,_n=new B,vn=new un,yn=new Bt,bn=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(vt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-vt(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(vt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-vt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(vt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-vt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:L(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return vn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(vn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return yn.setFromEuler(this),this.setFromQuaternion(yn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};bn.DEFAULT_ORDER=`XYZ`;var xn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Sn=0,Cn=new B,wn=new Bt,Tn=new un,En=new B,Dn=new B,On=new B,kn=new Bt,An=new B(1,0,0),jn=new B(0,1,0),Mn=new B(0,0,1),Nn={type:`added`},Pn={type:`removed`},Fn={type:`childadded`,child:null},In={type:`childremoved`,child:null},Ln=class e extends ft{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Sn++}),this.uuid=_t(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new B,n=new bn,r=new Bt,i=new B(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new un},normalMatrix:{value:new V}}),this.matrix=new un,this.matrixWorld=new un,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new xn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return wn.setFromAxisAngle(e,t),this.quaternion.multiply(wn),this}rotateOnWorldAxis(e,t){return wn.setFromAxisAngle(e,t),this.quaternion.premultiply(wn),this}rotateX(e){return this.rotateOnAxis(An,e)}rotateY(e){return this.rotateOnAxis(jn,e)}rotateZ(e){return this.rotateOnAxis(Mn,e)}translateOnAxis(e,t){return Cn.copy(e).applyQuaternion(this.quaternion),this.position.add(Cn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(An,e)}translateY(e){return this.translateOnAxis(jn,e)}translateZ(e){return this.translateOnAxis(Mn,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Tn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?En.copy(e):En.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Dn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Tn.lookAt(Dn,En,this.up):Tn.lookAt(En,Dn,this.up),this.quaternion.setFromRotationMatrix(Tn),r&&(Tn.extractRotation(r.matrixWorld),wn.setFromRotationMatrix(Tn),this.quaternion.premultiply(wn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(R(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Nn),Fn.child=e,this.dispatchEvent(Fn),Fn.child=null):R(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Pn),In.child=e,this.dispatchEvent(In),In.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Tn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Tn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Tn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Nn),Fn.child=e,this.dispatchEvent(Fn),Fn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Dn,e,On),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Dn,kn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Ln.DEFAULT_UP=new B(0,1,0),Ln.DEFAULT_MATRIX_AUTO_UPDATE=!0,Ln.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Rn=class extends Ln{constructor(){super(),this.isGroup=!0,this.type=`Group`}},zn={type:`move`},Bn=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Rn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Rn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new B,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new B),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Rn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new B,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new B,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(zn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Rn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Vn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Hn={h:0,s:0,l:0},Un={h:0,s:0,l:0};function Wn(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Gn=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Je){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=qt.workingColorSpace){return this.r=e,this.g=t,this.b=n,qt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=qt.workingColorSpace){if(e=yt(e,1),t=vt(t,0,1),n=vt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Wn(i,r,e+1/3),this.g=Wn(i,r,e),this.b=Wn(i,r,e-1/3)}return qt.colorSpaceToWorking(this,r),this}setStyle(e,t=Je){function n(t){t!==void 0&&parseFloat(t)<1&&L(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:L(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);L(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Je){let n=Vn[e.toLowerCase()];return n===void 0?L(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Jt(e.r),this.g=Jt(e.g),this.b=Jt(e.b),this}copyLinearToSRGB(e){return this.r=Yt(e.r),this.g=Yt(e.g),this.b=Yt(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Je){return qt.workingToColorSpace(Kn.copy(this),e),Math.round(vt(Kn.r*255,0,255))*65536+Math.round(vt(Kn.g*255,0,255))*256+Math.round(vt(Kn.b*255,0,255))}getHexString(e=Je){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qt.workingColorSpace){qt.workingToColorSpace(Kn.copy(this),t);let n=Kn.r,r=Kn.g,i=Kn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=qt.workingColorSpace){return qt.workingToColorSpace(Kn.copy(this),t),e.r=Kn.r,e.g=Kn.g,e.b=Kn.b,e}getStyle(e=Je){qt.workingToColorSpace(Kn.copy(this),e);let t=Kn.r,n=Kn.g,r=Kn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Hn),this.setHSL(Hn.h+e,Hn.s+t,Hn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Hn),e.getHSL(Un);let n=St(Hn.h,Un.h,t),r=St(Hn.s,Un.s,t),i=St(Hn.l,Un.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Kn=new Gn;Gn.NAMES=Vn;var qn=class extends Ln{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Jn=new B,Yn=new B,Xn=new B,Zn=new B,Qn=new B,$n=new B,er=new B,tr=new B,nr=new B,rr=new B,ir=new an,ar=new an,or=new an,sr=class e{constructor(e=new B,t=new B,n=new B){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Jn.subVectors(e,t),r.cross(Jn);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Jn.subVectors(r,t),Yn.subVectors(n,t),Xn.subVectors(e,t);let a=Jn.dot(Jn),o=Jn.dot(Yn),s=Jn.dot(Xn),c=Yn.dot(Yn),l=Yn.dot(Xn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Zn)!==null&&Zn.x>=0&&Zn.y>=0&&Zn.x+Zn.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Zn)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Zn.x),s.addScaledVector(a,Zn.y),s.addScaledVector(o,Zn.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return ir.setScalar(0),ar.setScalar(0),or.setScalar(0),ir.fromBufferAttribute(e,t),ar.fromBufferAttribute(e,n),or.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ir,i.x),a.addScaledVector(ar,i.y),a.addScaledVector(or,i.z),a}static isFrontFacing(e,t,n,r){return Jn.subVectors(n,t),Yn.subVectors(e,t),Jn.cross(Yn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Jn.subVectors(this.c,this.b),Yn.subVectors(this.a,this.b),Jn.cross(Yn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Qn.subVectors(r,n),$n.subVectors(i,n),tr.subVectors(e,n);let s=Qn.dot(tr),c=$n.dot(tr);if(s<=0&&c<=0)return t.copy(n);nr.subVectors(e,r);let l=Qn.dot(nr),u=$n.dot(nr);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Qn,a);rr.subVectors(e,i);let f=Qn.dot(rr),p=$n.dot(rr);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector($n,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return er.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(er,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Qn,a).addScaledVector($n,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},cr=class{constructor(e=new B(1/0,1/0,1/0),t=new B(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ur.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ur.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=ur.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,ur):ur.fromBufferAttribute(r,t),ur.applyMatrix4(e.matrixWorld),this.expandByPoint(ur);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),dr.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),dr.copy(e.boundingBox)),dr.applyMatrix4(e.matrixWorld),this.union(dr)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ur),ur.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(vr),yr.subVectors(this.max,vr),fr.subVectors(e.a,vr),pr.subVectors(e.b,vr),mr.subVectors(e.c,vr),hr.subVectors(pr,fr),gr.subVectors(mr,pr),_r.subVectors(fr,mr);let t=[0,-hr.z,hr.y,0,-gr.z,gr.y,0,-_r.z,_r.y,hr.z,0,-hr.x,gr.z,0,-gr.x,_r.z,0,-_r.x,-hr.y,hr.x,0,-gr.y,gr.x,0,-_r.y,_r.x,0];return!Sr(t,fr,pr,mr,yr)||(t=[1,0,0,0,1,0,0,0,1],!Sr(t,fr,pr,mr,yr))?!1:(br.crossVectors(hr,gr),t=[br.x,br.y,br.z],Sr(t,fr,pr,mr,yr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ur).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ur).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(lr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),lr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),lr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),lr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),lr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),lr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),lr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),lr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(lr)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},lr=[new B,new B,new B,new B,new B,new B,new B,new B],ur=new B,dr=new cr,fr=new B,pr=new B,mr=new B,hr=new B,gr=new B,_r=new B,vr=new B,yr=new B,br=new B,xr=new B;function Sr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){xr.fromArray(e,a);let o=i.x*Math.abs(xr.x)+i.y*Math.abs(xr.y)+i.z*Math.abs(xr.z),s=t.dot(xr),c=n.dot(xr),l=r.dot(xr);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Cr=new B,wr=new z,Tr=0,Er=class extends ft{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Tr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=$e,this.updateRanges=[],this.gpuType=w,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)wr.fromBufferAttribute(this,t),wr.applyMatrix3(e),this.setXY(t,wr.x,wr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Cr.fromBufferAttribute(this,t),Cr.applyMatrix3(e),this.setXYZ(t,Cr.x,Cr.y,Cr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Cr.fromBufferAttribute(this,t),Cr.applyMatrix4(e),this.setXYZ(t,Cr.x,Cr.y,Cr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Cr.fromBufferAttribute(this,t),Cr.applyNormalMatrix(e),this.setXYZ(t,Cr.x,Cr.y,Cr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Cr.fromBufferAttribute(this,t),Cr.transformDirection(e),this.setXYZ(t,Cr.x,Cr.y,Cr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Lt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Rt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Lt(t,this.array)),t}setX(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Lt(t,this.array)),t}setY(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Lt(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Lt(t,this.array)),t}setW(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),r=Rt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),r=Rt(r,this.array),i=Rt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},Dr=class extends Er{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Or=class extends Er{constructor(e,t,n){super(new Uint32Array(e),t,n)}},kr=class extends Er{constructor(e,t,n){super(new Float32Array(e),t,n)}},Ar=new cr,jr=new B,Mr=new B,Nr=class{constructor(e=new B,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Ar.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;jr.subVectors(e,this.center);let t=jr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(jr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Mr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(jr.copy(e.center).add(Mr)),this.expandByPoint(jr.copy(e.center).sub(Mr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Pr=0,Fr=new un,Ir=new Ln,Lr=new B,Rr=new cr,zr=new cr,Br=new B,Vr=class e extends ft{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Pr++}),this.uuid=_t(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(nt(e)?Or:Dr)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new V().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Fr.makeRotationFromQuaternion(e),this.applyMatrix4(Fr),this}rotateX(e){return Fr.makeRotationX(e),this.applyMatrix4(Fr),this}rotateY(e){return Fr.makeRotationY(e),this.applyMatrix4(Fr),this}rotateZ(e){return Fr.makeRotationZ(e),this.applyMatrix4(Fr),this}translate(e,t,n){return Fr.makeTranslation(e,t,n),this.applyMatrix4(Fr),this}scale(e,t,n){return Fr.makeScale(e,t,n),this.applyMatrix4(Fr),this}lookAt(e){return Ir.lookAt(e),Ir.updateMatrix(),this.applyMatrix4(Ir.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Lr).negate(),this.translate(Lr.x,Lr.y,Lr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new kr(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&L(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new cr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)R(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new B(-1/0,-1/0,-1/0),new B(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Rr.setFromBufferAttribute(n),this.morphTargetsRelative?(Br.addVectors(this.boundingBox.min,Rr.min),this.boundingBox.expandByPoint(Br),Br.addVectors(this.boundingBox.max,Rr.max),this.boundingBox.expandByPoint(Br)):(this.boundingBox.expandByPoint(Rr.min),this.boundingBox.expandByPoint(Rr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&R(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Nr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)R(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new B,1/0);else if(e){let n=this.boundingSphere.center;if(Rr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];zr.setFromBufferAttribute(n),this.morphTargetsRelative?(Br.addVectors(Rr.min,zr.min),Rr.expandByPoint(Br),Br.addVectors(Rr.max,zr.max),Rr.expandByPoint(Br)):(Rr.expandByPoint(zr.min),Rr.expandByPoint(zr.max))}Rr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Br.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Br));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Br.fromBufferAttribute(a,t),o&&(Lr.fromBufferAttribute(e,t),Br.add(Lr)),r=Math.max(r,n.distanceToSquared(Br))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&R(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){R(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Er(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new B,s[e]=new B;let c=new B,l=new B,u=new B,d=new z,f=new z,p=new z,m=new B,h=new B;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new B,y=new B,b=new B,x=new B;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Er(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new B,i=new B,a=new B,o=new B,s=new B,c=new B,l=new B,u=new B;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Br.fromBufferAttribute(e,t),Br.normalize(),e.setXYZ(t,Br.x,Br.y,Br.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Er(a,r,i)}if(this.index===null)return L(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Hr=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=$e,this.updateRanges=[],this.version=0,this.uuid=_t()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=_t()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=_t()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},Ur=new B,Wr=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Ur.fromBufferAttribute(this,t),Ur.applyMatrix4(e),this.setXYZ(t,Ur.x,Ur.y,Ur.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ur.fromBufferAttribute(this,t),Ur.applyNormalMatrix(e),this.setXYZ(t,Ur.x,Ur.y,Ur.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ur.fromBufferAttribute(this,t),Ur.transformDirection(e),this.setXYZ(t,Ur.x,Ur.y,Ur.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Lt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Rt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Rt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Lt(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Lt(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Lt(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Lt(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),r=Rt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),r=Rt(r,this.array),i=Rt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){st(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Er(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){st(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Gr=new B,Kr=new B,qr=new V,Jr=class{constructor(e=new B(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Gr.subVectors(n,t).cross(Kr.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Gr),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||qr.getNormalMatrix(e),r=this.coplanarPoint(Gr).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Yr=0,Xr=class extends ft{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Yr++}),this.uuid=_t(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Gn(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Qe,this.stencilZFail=Qe,this.stencilZPass=Qe,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){L(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?L(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Gn().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Jr().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new z().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new z().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Zr=class extends Xr{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new Gn(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Qr,$r=new B,ei=new B,ti=new B,ni=new z,ri=new z,ii=new un,ai=new B,oi=new B,si=new B,ci=new z,li=new z,ui=new z,di=class extends Ln{constructor(e=new Zr){if(super(),this.isSprite=!0,this.type=`Sprite`,Qr===void 0){Qr=new Vr;let e=new Hr(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Qr.setIndex([0,1,2,0,2,3]),Qr.setAttribute(`position`,new Wr(e,3,0,!1)),Qr.setAttribute(`uv`,new Wr(e,2,3,!1))}this.geometry=Qr,this.material=e,this.center=new z(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&R(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),ei.setFromMatrixScale(this.matrixWorld),ii.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ti.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ei.multiplyScalar(-ti.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;fi(ai.set(-.5,-.5,0),ti,a,ei,r,i),fi(oi.set(.5,-.5,0),ti,a,ei,r,i),fi(si.set(.5,.5,0),ti,a,ei,r,i),ci.set(0,0),li.set(1,0),ui.set(1,1);let o=e.ray.intersectTriangle(ai,oi,si,!1,$r);if(o===null&&(fi(oi.set(-.5,.5,0),ti,a,ei,r,i),li.set(0,1),o=e.ray.intersectTriangle(ai,si,oi,!1,$r),o===null))return;let s=e.ray.origin.distanceTo($r);s<e.near||s>e.far||t.push({distance:s,point:$r.clone(),uv:sr.getInterpolation($r,ai,oi,si,ci,li,ui,new z),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function fi(e,t,n,r,i,a){ni.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?ri.copy(ni):(ri.x=a*ni.x-i*ni.y,ri.y=i*ni.x+a*ni.y),e.copy(t),e.x+=ri.x,e.y+=ri.y,e.applyMatrix4(ii)}var pi=new B,mi=new B,hi=new B,gi=new B,_i=class{constructor(e=new B,t=new B(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,pi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=pi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(pi.copy(this.origin).addScaledVector(this.direction,t),pi.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){mi.copy(e).add(t).multiplyScalar(.5),hi.copy(t).sub(e).normalize(),gi.copy(this.origin).sub(mi);let i=e.distanceTo(t)*.5,a=-this.direction.dot(hi),o=gi.dot(this.direction),s=-gi.dot(hi),c=gi.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(mi).addScaledVector(hi,d),f}intersectSphere(e,t){if(e.radius<0)return null;pi.subVectors(e.center,this.origin);let n=pi.dot(this.direction),r=pi.dot(pi)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,pi)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,ee,O,k,A,te,j;if(y>=b&&y>=x?(w=s,D=u,k=p,j=g,s>=0?(S=c,C=l,T=d,E=f,ee=m,O=h,A=_,te=v):(S=l,C=c,T=f,E=d,ee=h,O=m,A=v,te=_)):b>=x?(w=c,D=d,k=m,j=_,c>=0?(S=l,C=s,T=f,E=u,ee=h,O=p,A=v,te=g):(S=s,C=l,T=u,E=f,ee=p,O=h,A=g,te=v)):(w=l,D=f,k=h,j=v,l>=0?(S=s,C=c,T=u,E=d,ee=p,O=m,A=g,te=_):(S=c,C=s,T=d,E=u,ee=m,O=p,A=_,te=g)),w===0)return null;let ne=S/w,M=C/w,re=1/w,ie=T-ne*D,ae=E-M*D,oe=ee-ne*k,se=O-M*k,ce=A-ne*j,le=te-M*j,ue=ce*se-le*oe,N=ie*le-ae*ce,de=oe*ae-se*ie;if(r){if(ue<0||N<0||de<0)return null}else if((ue<0||N<0||de<0)&&(ue>0||N>0||de>0))return null;let fe=ue+N+de;if(fe===0)return null;let pe=re*(ue*D+N*k+de*j);return(fe>0?pe<0:pe>0)?null:this.at(pe/fe,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},vi=class extends Xr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Gn(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},yi=new un,bi=new _i,xi=new Nr,Si=new B,Ci=new B,wi=new B,Ti=new B,Ei=new B,Di=new B,Oi=new B,ki=new B,Ai=class extends Ln{constructor(e=new Vr,t=new vi){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Di.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Ei.fromBufferAttribute(s,e),a?Di.addScaledVector(Ei,r):Di.addScaledVector(Ei.sub(t),r))}t.add(Di)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),xi.copy(n.boundingSphere),xi.applyMatrix4(i),bi.copy(e.ray).recast(e.near),!(xi.containsPoint(bi.origin)===!1&&(bi.intersectSphere(xi,Si)===null||bi.origin.distanceToSquared(Si)>(e.far-e.near)**2))&&(yi.copy(i).invert(),bi.copy(e.ray).applyMatrix4(yi),(n.boundingBox===null||bi.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,bi)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Mi(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Mi(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Mi(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Mi(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ji(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;ki.copy(s),ki.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(ki);return l<n.near||l>n.far?null:{distance:l,point:ki.clone(),object:e}}function Mi(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Ci),e.getVertexPosition(c,wi),e.getVertexPosition(l,Ti);let u=ji(e,t,n,r,Ci,wi,Ti,Oi);if(u){let e=new B;sr.getBarycoord(Oi,Ci,wi,Ti,e),i&&(u.uv=sr.getInterpolatedAttribute(i,s,c,l,e,new z)),a&&(u.uv1=sr.getInterpolatedAttribute(a,s,c,l,e,new z)),o&&(u.normal=sr.getInterpolatedAttribute(o,s,c,l,e,new B),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new B,materialIndex:0};sr.getNormal(Ci,wi,Ti,t.normal),u.face=t,u.barycoord=e}return u}var Ni=class extends rn{constructor(e=null,t=1,n=1,r,i,a,o,s,c=f,l=f,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Pi=class extends Er{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Fi=new un,Ii=new un,Li=[],Ri=new cr,zi=new un,Bi=new Ai,Vi=new Nr,Hi=class extends Ai{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Pi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,zi)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new cr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Fi),Ri.copy(e.boundingBox).applyMatrix4(Fi),this.boundingBox.union(Ri)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Nr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Fi),Vi.copy(e.boundingSphere).applyMatrix4(Fi),this.boundingSphere.union(Vi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Bi.geometry=this.geometry,Bi.material=this.material,Bi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Vi.copy(this.boundingSphere),Vi.applyMatrix4(n),e.ray.intersectsSphere(Vi)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Fi),Ii.multiplyMatrices(n,Fi),Bi.matrixWorld=Ii,Bi.raycast(e,Li);for(let e=0,n=Li.length;e<n;e++){let n=Li[e];n.instanceId=i,n.object=this,t.push(n)}Li.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Pi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ni(new Float32Array(r*this.count),r,this.count,re,w));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Ui=new Nr,Wi=new z(.5,.5),Gi=new B,Ki=class{constructor(e=new Jr,t=new Jr,n=new Jr,r=new Jr,i=new Jr,a=new Jr){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=tt,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ui.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ui.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ui)}intersectsSprite(e){return Ui.center.set(0,0,0),Ui.radius=.7071067811865476+Wi.distanceTo(e.center),Ui.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ui)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Gi.x=r.normal.x>0?e.max.x:e.min.x,Gi.y=r.normal.y>0?e.max.y:e.min.y,Gi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Gi)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},qi=class extends Xr{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new Gn(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ji=new un,Yi=new _i,Xi=new Nr,Zi=new B,Qi=class extends Ln{constructor(e=new Vr,t=new qi){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Xi.copy(n.boundingSphere),Xi.applyMatrix4(r),Xi.radius+=i,e.ray.intersectsSphere(Xi)===!1)return;Ji.copy(r).invert(),Yi.copy(e.ray).applyMatrix4(Ji);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);Zi.fromBufferAttribute(l,n),$i(Zi,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)Zi.fromBufferAttribute(l,a),$i(Zi,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function $i(e,t,n,r,i,a,o){let s=Yi.distanceSqToPoint(e);if(s<n){let n=new B;Yi.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ea=class extends rn{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ta=class extends rn{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},na=class extends rn{constructor(e,t,n=C,r,i,a,o=f,s=f,c,l=ne,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new $t(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},ra=class extends na{constructor(e,t=C,n=301,r,i,a=f,o=f,s,c=ne){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ia=class extends rn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},aa=class e extends Vr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new kr(c,3)),this.setAttribute(`normal`,new kr(l,3)),this.setAttribute(`uv`,new kr(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new B;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},oa=class e extends Vr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new kr(p,3)),this.setAttribute(`normal`,new kr(m,3)),this.setAttribute(`uv`,new kr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},sa=class e extends Vr{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new B,d=new B,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new kr(p,3)),this.setAttribute(`normal`,new kr(m,3)),this.setAttribute(`uv`,new kr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};function ca(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(ua(i))i.isRenderTargetTexture?(L(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(ua(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function la(e){let t={};for(let n=0;n<e.length;n++){let r=ca(e[n]);for(let e in r)t[e]=r[e]}return t}function ua(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function da(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function fa(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:qt.workingColorSpace}var pa={clone:ca,merge:la},ma=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ha=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ga=class extends Xr{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ma,this.fragmentShader=ha,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ca(e.uniforms),this.uniformsGroups=da(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new Gn().setHex(r.value);break;case`v2`:this.uniforms[n].value=new z().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new B().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new an().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new V().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new un().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},_a=class extends ga{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},va=class extends Xr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=qe,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ya=class extends Xr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ba(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function xa(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Sa=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Ca=class extends Sa{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:We,endingEnd:We}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ge:i=e,o=2*t-n;break;case Ke:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Ge:a=e,s=2*n-t;break;case Ke:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},wa=class extends Sa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Ta=class extends Sa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ea=class extends Sa{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=ka(n,t,g,y,r);i[p]=Da(x,o,_,b,m)}return i}};function Da(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Oa(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function ka(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=Da(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Oa(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Aa=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=ba(t,this.TimeBufferType),this.values=ba(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ba(e.times,Array),values:ba(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),xa(e.settings)&&(n.settings={inTangents:ba(e.settings.inTangents,Array),outTangents:ba(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ta(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new wa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ca(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ea(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Be:t=this.InterpolantFactoryMethodDiscrete;break;case Ve:t=this.InterpolantFactoryMethodLinear;break;case He:t=this.InterpolantFactoryMethodSmooth;break;case Ue:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return L(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Be;case this.InterpolantFactoryMethodLinear:return Ve;case this.InterpolantFactoryMethodSmooth:return He;case this.InterpolantFactoryMethodBezier:return Ue}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;xa(this.settings)&&(ja(this.settings.inTangents,e),ja(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(R(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(R(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){R(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){R(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&rt(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){R(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===He,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,xa(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function ja(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Aa.prototype.ValueTypeName=``,Aa.prototype.TimeBufferType=Float32Array,Aa.prototype.ValueBufferType=Float32Array,Aa.prototype.DefaultInterpolation=Ve;var Ma=class extends Aa{constructor(e,t,n){super(e,t,n)}};Ma.prototype.ValueTypeName=`bool`,Ma.prototype.ValueBufferType=Array,Ma.prototype.DefaultInterpolation=Be,Ma.prototype.InterpolantFactoryMethodLinear=void 0,Ma.prototype.InterpolantFactoryMethodSmooth=void 0;var Na=class extends Aa{constructor(e,t,n,r){super(e,t,n,r)}};Na.prototype.ValueTypeName=`color`;var Pa=class extends Aa{constructor(e,t,n,r){super(e,t,n,r)}};Pa.prototype.ValueTypeName=`number`;var Fa=class extends Sa{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Bt.slerpFlat(i,0,a,c-o,a,c,s);return i}},Ia=class extends Aa{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Fa(this.times,this.values,this.getValueSize(),e)}};Ia.prototype.ValueTypeName=`quaternion`,Ia.prototype.InterpolantFactoryMethodSmooth=void 0;var La=class extends Aa{constructor(e,t,n){super(e,t,n)}};La.prototype.ValueTypeName=`string`,La.prototype.ValueBufferType=Array,La.prototype.DefaultInterpolation=Be,La.prototype.InterpolantFactoryMethodLinear=void 0,La.prototype.InterpolantFactoryMethodSmooth=void 0;var Ra=class extends Aa{constructor(e,t,n,r){super(e,t,n,r)}};Ra.prototype.ValueTypeName=`vector`;var za=new B,Ba=new Bt,Va=new B,Ha=class extends Ln{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new un,this.projectionMatrix=new un,this.projectionMatrixInverse=new un,this.coordinateSystem=tt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(za,Ba,Va),Va.x===1&&Va.y===1&&Va.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(za,Ba,Va.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(za,Ba,Va),Va.x===1&&Va.y===1&&Va.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(za,Ba,Va.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Ua=new B,Wa=new z,Ga=new z,Ka=class extends Ha{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=gt*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(ht*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return gt*2*Math.atan(Math.tan(ht*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ua.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ua.x,Ua.y).multiplyScalar(-e/Ua.z),Ua.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ua.x,Ua.y).multiplyScalar(-e/Ua.z)}getViewSize(e,t){return this.getViewBounds(e,Wa,Ga),t.subVectors(Ga,Wa)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(ht*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},qa=class extends Ha{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ja=-90,Ya=1,Xa=class extends Ln{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Ka(Ja,Ya,e,t);r.layers=this.layers,this.add(r);let i=new Ka(Ja,Ya,e,t);i.layers=this.layers,this.add(i);let a=new Ka(Ja,Ya,e,t);a.layers=this.layers,this.add(a);let o=new Ka(Ja,Ya,e,t);o.layers=this.layers,this.add(o);let s=new Ka(Ja,Ya,e,t);s.layers=this.layers,this.add(s);let c=new Ka(Ja,Ya,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Za=class extends Ka{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Qa=`\\[\\]\\.:\\/`,$a=RegExp(`[\\[\\]\\.:\\/]`,`g`),eo=`[^\\[\\]\\.:\\/]`,to=`[^`+Qa.replace(`\\.`,``)+`]`,no=`((?:WC+[\\/:])*)`.replace(`WC`,eo),ro=`(WCOD+)?`.replace(`WCOD`,to),io=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,eo),ao=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,eo),oo=RegExp(`^`+no+ro+io+ao+`$`),so=[`material`,`materials`,`bones`,`map`],co=class{constructor(e,t,n){let r=n||lo.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},lo=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace($a,``)}static parseTrackName(e){let t=oo.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);so.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){L(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){R(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){R(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){R(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){R(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){R(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){R(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){R(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;R(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){R(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){R(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};lo.Composite=co,lo.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},lo.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},lo.prototype.GetterByBindingType=[lo.prototype._getValue_direct,lo.prototype._getValue_array,lo.prototype._getValue_arrayElement,lo.prototype._getValue_toArray],lo.prototype.SetterByBindingTypeAndVersioning=[[lo.prototype._setValue_direct,lo.prototype._setValue_direct_setNeedsUpdate,lo.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[lo.prototype._setValue_array,lo.prototype._setValue_array_setNeedsUpdate,lo.prototype._setValue_array_setMatrixWorldNeedsUpdate],[lo.prototype._setValue_arrayElement,lo.prototype._setValue_arrayElement_setNeedsUpdate,lo.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[lo.prototype._setValue_fromArray,lo.prototype._setValue_fromArray_setNeedsUpdate,lo.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],a=class{constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}},a.prototype.isMatrix2=!0;function uo(e,t,n,r){let i=fo(r);switch(n){case A:return e*t;case re:return e*t/i.components*i.byteLength;case ie:return e*t/i.components*i.byteLength;case ae:return e*t*2/i.components*i.byteLength;case oe:return e*t*2/i.components*i.byteLength;case te:return e*t*3/i.components*i.byteLength;case j:return e*t*4/i.components*i.byteLength;case se:return e*t*4/i.components*i.byteLength;case ce:case le:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ue:case N:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case fe:case me:return Math.max(e,16)*Math.max(t,8)/4;case de:case pe:return Math.max(e,8)*Math.max(t,8)/2;case he:case ge:case ve:case ye:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case _e:case be:case xe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Se:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ce:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case we:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Te:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Ee:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case De:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Oe:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case ke:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Ae:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case je:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Me:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Ne:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Pe:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case P:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Fe:case Ie:case Le:return Math.ceil(e/4)*Math.ceil(t/4)*16;case F:case Re:return Math.ceil(e/4)*Math.ceil(t/4)*8;case I:case ze:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function fo(e){switch(e){case v:case y:return{byteLength:1,components:1};case x:case b:case T:return{byteLength:2,components:1};case E:case D:return{byteLength:2,components:4};case C:case S:case w:return{byteLength:4,components:1};case O:case k:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?L(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function po(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function mo(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var H={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},U={common:{diffuse:{value:new Gn(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new V},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new V}},envmap:{envMap:{value:null},envMapRotation:{value:new V},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new V}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new V}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new V},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new V},normalScale:{value:new z(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new V},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new V}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new V}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new V}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Gn(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new B},probesMax:{value:new B},probesResolution:{value:new B}},points:{diffuse:{value:new Gn(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0},uvTransform:{value:new V}},sprite:{diffuse:{value:new Gn(16777215)},opacity:{value:1},center:{value:new z(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new V},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0}}},ho={basic:{uniforms:la([U.common,U.specularmap,U.envmap,U.aomap,U.lightmap,U.fog]),vertexShader:H.meshbasic_vert,fragmentShader:H.meshbasic_frag},lambert:{uniforms:la([U.common,U.specularmap,U.envmap,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.fog,U.lights,{emissive:{value:new Gn(0)},envMapIntensity:{value:1}}]),vertexShader:H.meshlambert_vert,fragmentShader:H.meshlambert_frag},phong:{uniforms:la([U.common,U.specularmap,U.envmap,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.fog,U.lights,{emissive:{value:new Gn(0)},specular:{value:new Gn(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:H.meshphong_vert,fragmentShader:H.meshphong_frag},standard:{uniforms:la([U.common,U.envmap,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.roughnessmap,U.metalnessmap,U.fog,U.lights,{emissive:{value:new Gn(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:H.meshphysical_vert,fragmentShader:H.meshphysical_frag},toon:{uniforms:la([U.common,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.gradientmap,U.fog,U.lights,{emissive:{value:new Gn(0)}}]),vertexShader:H.meshtoon_vert,fragmentShader:H.meshtoon_frag},matcap:{uniforms:la([U.common,U.bumpmap,U.normalmap,U.displacementmap,U.fog,{matcap:{value:null}}]),vertexShader:H.meshmatcap_vert,fragmentShader:H.meshmatcap_frag},points:{uniforms:la([U.points,U.fog]),vertexShader:H.points_vert,fragmentShader:H.points_frag},dashed:{uniforms:la([U.common,U.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:H.linedashed_vert,fragmentShader:H.linedashed_frag},depth:{uniforms:la([U.common,U.displacementmap]),vertexShader:H.depth_vert,fragmentShader:H.depth_frag},normal:{uniforms:la([U.common,U.bumpmap,U.normalmap,U.displacementmap,{opacity:{value:1}}]),vertexShader:H.meshnormal_vert,fragmentShader:H.meshnormal_frag},sprite:{uniforms:la([U.sprite,U.fog]),vertexShader:H.sprite_vert,fragmentShader:H.sprite_frag},background:{uniforms:{uvTransform:{value:new V},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:H.background_vert,fragmentShader:H.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new V}},vertexShader:H.backgroundCube_vert,fragmentShader:H.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:H.cube_vert,fragmentShader:H.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:H.equirect_vert,fragmentShader:H.equirect_frag},distance:{uniforms:la([U.common,U.displacementmap,{referencePosition:{value:new B},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:H.distance_vert,fragmentShader:H.distance_frag},shadow:{uniforms:la([U.lights,U.fog,{color:{value:new Gn(0)},opacity:{value:1}}]),vertexShader:H.shadow_vert,fragmentShader:H.shadow_frag}};ho.physical={uniforms:la([ho.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new V},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new V},clearcoatNormalScale:{value:new z(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new V},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new V},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new V},sheen:{value:0},sheenColor:{value:new Gn(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new V},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new V},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new V},transmissionSamplerSize:{value:new z},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new V},attenuationDistance:{value:0},attenuationColor:{value:new Gn(0)},specularColor:{value:new Gn(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new V},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new V},anisotropyVector:{value:new z},anisotropyMap:{value:null},anisotropyMapTransform:{value:new V}}]),vertexShader:H.meshphysical_vert,fragmentShader:H.meshphysical_frag};var go={r:0,b:0,g:0},_o=new un,vo=new V;vo.set(-1,0,0,0,1,0,0,0,1);function yo(e,t,n,r,i,a){let o=new Gn(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new Ai(new aa(1,1,1),new ga({name:`BackgroundCubeMaterial`,uniforms:ca(ho.backgroundCube.uniforms),vertexShader:ho.backgroundCube.vertexShader,fragmentShader:ho.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(_o.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(vo),l.material.toneMapped=qt.getTransfer(i.colorSpace)!==Ze,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Ai(new oa(2,2),new ga({name:`BackgroundMaterial`,uniforms:ca(ho.background.uniforms),vertexShader:ho.background.vertexShader,fragmentShader:ho.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=qt.getTransfer(i.colorSpace)!==Ze,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(go,fa(e)),n.buffers.color.setClear(go.r,go.g,go.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function bo(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function xo(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function So(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(L(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&L(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Co(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Jr,s=new V,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var wo=4,To=6,Eo=20,Do=256,Oo=new qa,ko=new Gn,Ao=null,jo=0,Mo=0,No=!1,Po=new B,Fo=new B,Io=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Po}=i;Ao=this._renderer.getRenderTarget(),jo=this._renderer.getActiveCubeFace(),Mo=this._renderer.getActiveMipmapLevel(),No=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Uo(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ho(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ao,jo,Mo),this._renderer.xr.enabled=No,e.scissorTest=!1,zo(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ao=this._renderer.getRenderTarget(),jo=this._renderer.getActiveCubeFace(),Mo=this._renderer.getActiveMipmapLevel(),No=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:h,minFilter:h,generateMipmaps:!1,type:T,format:j,colorSpace:Ye,depthBuffer:!1},r=Ro(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ro(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Lo(r)),this._blurMaterial=Vo(r,e,t),this._ggxMaterial=Bo(r,e,t)}return r}_compileMaterial(e){let t=new Ai(new Vr,e);this._renderer.compile(t,Oo)}_sceneToCubeUV(e,t,n,r,i){let a=new Ka(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(ko),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ai(new aa,new vi({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(ko),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;zo(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Uo()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ho());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;zo(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Oo)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-wo?n-d+wo:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,zo(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Oo),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,zo(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Oo)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];zo(t,3*l*(r>this._lodMax-wo?r-this._lodMax+wo:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,Oo)}};function Lo(e){let t=[],n=[],r=e,i=e-wo+1+To;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?Fo.set(1,r,n):e===1?Fo.set(-n,1,-r):e===2?Fo.set(-n,r,1):e===3?Fo.set(-1,r,-n):e===4?Fo.set(-n,-1,r):Fo.set(n,r,-1),Fo.toArray(l,(e*6+t)*3)}}let u=new Vr;u.setAttribute(`position`,new Er(c,3)),u.setAttribute(`outputDirection`,new Er(l,3)),n.push(new Ai(u,null)),r>wo&&r--}return{lodMeshes:n,sizeLods:t}}function Ro(e,t,n){let r=new sn(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function zo(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Bo(e,t,n){return new ga({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:Do,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Wo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Vo(e,t,n){return new ga({name:`SphericalGaussianBlur`,defines:{SAMPLES:Eo,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Wo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Ho(){return new ga({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Wo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Uo(){return new ga({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Wo(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Go=class extends sn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ea(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new aa(5,5,5),i=new ga({name:`CubemapFromEquirect`,uniforms:ca(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Ai(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=h),new Xa(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function Ko(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Go(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Io(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Io(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function qo(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&lt(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Jo(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0||(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++),t}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?Or:Dr)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Yo(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Xo(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:R(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Zo(e,t,n){let r=new WeakMap,i=new an;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new cn(h,p,m,u);g.type=w,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new z(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Qo(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var $o={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function es(e,t,n,r,i,a){let o=new sn(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new Vr;l.setAttribute(`position`,new kr([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new kr([0,2,0,0,2,0],2));let u=new _a({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Ai(l,u),f=new qa(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new sn(t,n,{type:T,depthBuffer:!1,stencilBuffer:!1}),c=new sn(t,n,{type:T,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},qt.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=$o[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var ts=new rn,ns=new na(1,1),rs=new cn,is=new ln,as=new ea,os=[],ss=[],cs=new Float32Array(16),ls=new Float32Array(9),us=new Float32Array(4);function ds(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=os[i];if(a===void 0&&(a=new Float32Array(i),os[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function fs(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function ps(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function ms(e,t){let n=ss[t];n===void 0&&(n=new Int32Array(t),ss[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function hs(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function gs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(fs(n,t))return;e.uniform2fv(this.addr,t),ps(n,t)}}function _s(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(fs(n,t))return;e.uniform3fv(this.addr,t),ps(n,t)}}function vs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(fs(n,t))return;e.uniform4fv(this.addr,t),ps(n,t)}}function ys(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(fs(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),ps(n,t)}else{if(fs(n,r))return;us.set(r),e.uniformMatrix2fv(this.addr,!1,us),ps(n,r)}}function bs(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(fs(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),ps(n,t)}else{if(fs(n,r))return;ls.set(r),e.uniformMatrix3fv(this.addr,!1,ls),ps(n,r)}}function xs(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(fs(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),ps(n,t)}else{if(fs(n,r))return;cs.set(r),e.uniformMatrix4fv(this.addr,!1,cs),ps(n,r)}}function Ss(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Cs(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(fs(n,t))return;e.uniform2iv(this.addr,t),ps(n,t)}}function ws(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(fs(n,t))return;e.uniform3iv(this.addr,t),ps(n,t)}}function Ts(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(fs(n,t))return;e.uniform4iv(this.addr,t),ps(n,t)}}function Es(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Ds(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(fs(n,t))return;e.uniform2uiv(this.addr,t),ps(n,t)}}function Os(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(fs(n,t))return;e.uniform3uiv(this.addr,t),ps(n,t)}}function ks(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(fs(n,t))return;e.uniform4uiv(this.addr,t),ps(n,t)}}function As(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(ns.compareFunction=n.isReversedDepthBuffer()?518:515,a=ns):a=ts,n.setTexture2D(t||a,i)}function js(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||is,i)}function Ms(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||as,i)}function Ns(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||rs,i)}function Ps(e){switch(e){case 5126:return hs;case 35664:return gs;case 35665:return _s;case 35666:return vs;case 35674:return ys;case 35675:return bs;case 35676:return xs;case 5124:case 35670:return Ss;case 35667:case 35671:return Cs;case 35668:case 35672:return ws;case 35669:case 35673:return Ts;case 5125:return Es;case 36294:return Ds;case 36295:return Os;case 36296:return ks;case 35678:case 36198:case 36298:case 36306:case 35682:return As;case 35679:case 36299:case 36307:return js;case 35680:case 36300:case 36308:case 36293:return Ms;case 36289:case 36303:case 36311:case 36292:return Ns}}function Fs(e,t){e.uniform1fv(this.addr,t)}function Is(e,t){let n=ds(t,this.size,2);e.uniform2fv(this.addr,n)}function Ls(e,t){let n=ds(t,this.size,3);e.uniform3fv(this.addr,n)}function Rs(e,t){let n=ds(t,this.size,4);e.uniform4fv(this.addr,n)}function zs(e,t){let n=ds(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Bs(e,t){let n=ds(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Vs(e,t){let n=ds(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Hs(e,t){e.uniform1iv(this.addr,t)}function Us(e,t){e.uniform2iv(this.addr,t)}function Ws(e,t){e.uniform3iv(this.addr,t)}function Gs(e,t){e.uniform4iv(this.addr,t)}function Ks(e,t){e.uniform1uiv(this.addr,t)}function qs(e,t){e.uniform2uiv(this.addr,t)}function Js(e,t){e.uniform3uiv(this.addr,t)}function Ys(e,t){e.uniform4uiv(this.addr,t)}function Xs(e,t,n){let r=this.cache,i=t.length,a=ms(n,i);fs(r,a)||(e.uniform1iv(this.addr,a),ps(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?ns:ts;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Zs(e,t,n){let r=this.cache,i=t.length,a=ms(n,i);fs(r,a)||(e.uniform1iv(this.addr,a),ps(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||is,a[e])}function Qs(e,t,n){let r=this.cache,i=t.length,a=ms(n,i);fs(r,a)||(e.uniform1iv(this.addr,a),ps(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||as,a[e])}function $s(e,t,n){let r=this.cache,i=t.length,a=ms(n,i);fs(r,a)||(e.uniform1iv(this.addr,a),ps(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||rs,a[e])}function ec(e){switch(e){case 5126:return Fs;case 35664:return Is;case 35665:return Ls;case 35666:return Rs;case 35674:return zs;case 35675:return Bs;case 35676:return Vs;case 5124:case 35670:return Hs;case 35667:case 35671:return Us;case 35668:case 35672:return Ws;case 35669:case 35673:return Gs;case 5125:return Ks;case 36294:return qs;case 36295:return Js;case 36296:return Ys;case 35678:case 36198:case 36298:case 36306:case 35682:return Xs;case 35679:case 36299:case 36307:return Zs;case 35680:case 36300:case 36308:case 36293:return Qs;case 36289:case 36303:case 36311:case 36292:return $s}}var tc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Ps(t.type)}},nc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=ec(t.type)}},rc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},ic=/(\w+)(\])?(\[|\.)?/g;function ac(e,t){e.seq.push(t),e.map[t.id]=t}function oc(e,t,n){let r=e.name,i=r.length;for(ic.lastIndex=0;;){let a=ic.exec(r),o=ic.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){ac(n,l===void 0?new tc(s,e,t):new nc(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new rc(s),ac(n,e)),n=e}}}var sc=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);oc(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function cc(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var lc=37297,uc=0;function dc(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var fc=new V;function pc(e){qt._getMatrix(fc,qt.workingColorSpace,e);let t=`mat3( ${fc.elements.map(e=>e.toFixed(4))} )`;switch(qt.getTransfer(e)){case Xe:return[t,`LinearTransferOETF`];case Ze:return[t,`sRGBTransferOETF`];default:return L(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function mc(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+dc(e.getShaderSource(t),r)}return i}function hc(e,t){let n=pc(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var gc={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function _c(e,t){let n=gc[t];return n===void 0?(L(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var vc=new B;function yc(){return qt.getLuminanceCoefficients(vc),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${vc.x.toFixed(4)}, ${vc.y.toFixed(4)}, ${vc.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function bc(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Cc).join(`
`)}function xc(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Sc(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Cc(e){return e!==``}function wc(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Tc(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Ec=/^[ \t]*#include +<([\w\d./]+)>/gm;function Dc(e){return e.replace(Ec,kc)}var Oc=new Map;function kc(e,t){let n=H[t];if(n===void 0){let e=Oc.get(t);if(e!==void 0)n=H[e],L(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return Dc(n)}var Ac=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function jc(e){return e.replace(Ac,Mc)}function Mc(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Nc(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Pc={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Fc(e){return Pc[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ic={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Lc(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Ic[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var Rc={302:`ENVMAP_MODE_REFRACTION`};function zc(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Rc[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Bc={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Vc(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Bc[e.combine]||`ENVMAP_BLENDING_NONE`}function Hc(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Uc(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Fc(n),l=Lc(n),u=zc(n),d=Vc(n),f=Hc(n),p=bc(n),m=xc(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Cc).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Cc).join(`
`),_.length>0&&(_+=`
`)):(g=[Nc(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Cc).join(`
`),_=[Nc(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:H.tonemapping_pars_fragment,n.toneMapping===0?``:_c(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,H.colorspace_pars_fragment,hc(`linearToOutputTexel`,n.outputColorSpace),yc(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Cc).join(`
`)),o=Dc(o),o=wc(o,n),o=Tc(o,n),s=Dc(s),s=wc(s,n),s=Tc(s,n),o=jc(o),s=jc(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=cc(i,i.VERTEX_SHADER,y),S=cc(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=mc(i,x,`vertex`),n=mc(i,S,`fragment`);R(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):L(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new sc(i,h),T=Sc(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,lc)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=uc++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Wc=0,Gc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Kc(e),t.set(e,n)),n}},Kc=class{constructor(e){this.id=Wc++,this.code=e,this.usedTimes=0}};function qc(e){return e===1030||e===37490||e===36285}function Jc(e,t,n,r,i,a){let o=new xn,s=new Gc,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&L(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,ee,O,k;if(C){let e=ho[C];D=e.vertexShader,ee=e.fragmentShader}else{D=i.vertexShader,ee=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),te=e.state.buffers.depth.getReversed(),j=h.isInstancedMesh===!0,ne=h.isBatchedMesh===!0,M=!!i.map,re=!!i.matcap,ie=!!x,ae=!!i.aoMap,oe=!!i.lightMap,se=!!i.bumpMap&&i.wireframe===!1,ce=!!i.normalMap,le=!!i.displacementMap,ue=!!i.emissiveMap,N=!!i.metalnessMap,de=!!i.roughnessMap,fe=i.anisotropy>0,pe=i.clearcoat>0,me=i.dispersion>0,he=i.retroreflectivity>0,ge=i.iridescence>0,_e=i.sheen>0,ve=i.transmission>0,ye=fe&&!!i.anisotropyMap,be=pe&&!!i.clearcoatMap,xe=pe&&!!i.clearcoatNormalMap,Se=pe&&!!i.clearcoatRoughnessMap,Ce=ge&&!!i.iridescenceMap,we=ge&&!!i.iridescenceThicknessMap,Te=_e&&!!i.sheenColorMap,Ee=_e&&!!i.sheenRoughnessMap,De=!!i.specularMap,Oe=!!i.specularColorMap,ke=!!i.specularIntensityMap,Ae=ve&&!!i.transmissionMap,je=ve&&!!i.thicknessMap,Me=!!i.gradientMap,Ne=!!i.alphaMap,Pe=i.alphaTest>0,P=!!i.alphaHash,Fe=!!i.extensions,Ie=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Ie=e.toneMapping);let Le={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:ee,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:ne,batchingColor:ne&&h._colorsTexture!==null,instancing:j,instancingColor:j&&h.instanceColor!==null,instancingMorph:j&&h.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:qt.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:M,matcap:re,envMap:ie,envMapMode:ie&&x.mapping,envMapCubeUVHeight:S,aoMap:ae,lightMap:oe,bumpMap:se,normalMap:ce,displacementMap:le,emissiveMap:ue,normalMapObjectSpace:ce&&i.normalMapType===1,normalMapTangentSpace:ce&&i.normalMapType===0,packedNormalMap:ce&&i.normalMapType===0&&qc(i.normalMap.format),metalnessMap:N,roughnessMap:de,anisotropy:fe,anisotropyMap:ye,clearcoat:pe,clearcoatMap:be,clearcoatNormalMap:xe,clearcoatRoughnessMap:Se,dispersion:me,retroreflection:he,iridescence:ge,iridescenceMap:Ce,iridescenceThicknessMap:we,sheen:_e,sheenColorMap:Te,sheenRoughnessMap:Ee,specularMap:De,specularColorMap:Oe,specularIntensityMap:ke,transmission:ve,transmissionMap:Ae,thicknessMap:je,gradientMap:Me,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Ne,alphaTest:Pe,alphaHash:P,combine:i.combine,mapUv:M&&m(i.map.channel),aoMapUv:ae&&m(i.aoMap.channel),lightMapUv:oe&&m(i.lightMap.channel),bumpMapUv:se&&m(i.bumpMap.channel),normalMapUv:ce&&m(i.normalMap.channel),displacementMapUv:le&&m(i.displacementMap.channel),emissiveMapUv:ue&&m(i.emissiveMap.channel),metalnessMapUv:N&&m(i.metalnessMap.channel),roughnessMapUv:de&&m(i.roughnessMap.channel),anisotropyMapUv:ye&&m(i.anisotropyMap.channel),clearcoatMapUv:be&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:xe&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Se&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:Ce&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:we&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:Ee&&m(i.sheenRoughnessMap.channel),specularMapUv:De&&m(i.specularMap.channel),specularColorMapUv:Oe&&m(i.specularColorMap.channel),specularIntensityMapUv:ke&&m(i.specularIntensityMap.channel),transmissionMapUv:Ae&&m(i.transmissionMap.channel),thicknessMapUv:je&&m(i.thicknessMap.channel),alphaMapUv:Ne&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(ce||fe),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(M||Ne),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&ce===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:te,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ie,decodeVideoTexture:M&&i.map.isVideoTexture===!0&&qt.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:ue&&i.emissiveMap.isVideoTexture===!0&&qt.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Fe&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Fe&&i.extensions.multiDraw===!0||ne)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Le.vertexUv1s=c.has(1),Le.vertexUv2s=c.has(2),Le.vertexUv3s=c.has(3),c.clear(),Le}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=ho[t];n=pa.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Uc(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Yc(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Xc(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Zc(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Qc(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Xc),r.length>1&&r.sort(t||Zc),i.length>1&&i.sort(t||Zc)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function $c(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Qc,e.set(t,[i])):n>=r.length?(i=new Qc,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function el(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new B,color:new Gn};break;case`SpotLight`:n={position:new B,direction:new B,color:new Gn,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new B,color:new Gn,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new B,skyColor:new Gn,groundColor:new Gn};break;case`RectAreaLight`:n={color:new Gn,position:new B,halfWidth:new B,halfHeight:new B}}return e[t.id]=n,n}}}function tl(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new z};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new z};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new z,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var nl=0;function rl(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function il(e){let t=new el,n=tl(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new B);let i=new B,a=new un,o=new un;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(rl);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=U.LTC_FLOAT_1,r.rectAreaLTC2=U.LTC_FLOAT_2):(r.rectAreaLTC1=U.LTC_HALF_1,r.rectAreaLTC2=U.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=nl++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function al(e){let t=new il(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function ol(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new al(e),t.set(n,[a])):r>=i.length?(a=new al(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var sl=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,cl=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,ll=[new B(1,0,0),new B(-1,0,0),new B(0,1,0),new B(0,-1,0),new B(0,0,1),new B(0,0,-1)],ul=[new B(0,-1,0),new B(0,-1,0),new B(0,0,1),new B(0,0,-1),new B(0,-1,0),new B(0,-1,0)],dl=new un,fl=new B,pl=new B;function ml(e,t,n){let r=new Ki,i=new z,a=new z,o=new an,s=new va,c=new ya,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},p=new ga({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new z},radius:{value:4}},vertexShader:sl,fragmentShader:cl}),m=p.clone();m.defines.HORIZONTAL_PASS=1;let g=new Vr;g.setAttribute(`position`,new Er(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Ai(g,p),v=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let y=this.type;this.render=function(t,n,s){if(v.enabled===!1||v.autoUpdate===!1&&v.needsUpdate===!1||t.length===0)return;this.type===2&&(L(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),p=e.state;p.setBlending(0),p.buffers.depth.getReversed()===!0?p.buffers.color.setClear(0,0,0,0):p.buffers.color.setClear(1,1,1,1),p.buffers.depth.setTest(!0),p.setScissorTest(!1);let m=y!==this.type;m&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){L(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let g=d.getFrameExtents();i.multiply(g),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/g.x),i.x=a.x*g.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/g.y),i.y=a.y*g.y,d.mapSize.y=a.y));let _=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=_,d.map===null||m===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){L(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new sn(i.x,i.y,{format:ae,type:T,minFilter:h,magFilter:h,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new na(i.x,i.y,w),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=ne,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=f,d.map.depthTexture.magFilter=f}else l.isPointLight?(d.map=new Go(i.x),d.map.depthTexture=new ra(i.x,C)):(d.map=new sn(i.x,i.y),d.map.depthTexture=new na(i.x,i.y,C)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=ne,this.type===1?(d.map.depthTexture.compareFunction=_?518:515,d.map.depthTexture.minFilter=h,d.map.depthTexture.magFilter=h):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=f,d.map.depthTexture.magFilter=f);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let v=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<v;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),fl.setFromMatrixPosition(l.matrixWorld),e.position.copy(fl),pl.copy(e.position),pl.add(ll[t]),e.up.copy(ul[t]),e.lookAt(pl),e.updateMatrixWorld(),n.makeTranslation(-fl.x,-fl.y,-fl.z),dl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(dl,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),p.viewport(o)}r=d.getFrustum(t),S(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&b(d,s),d.needsUpdate=!1}y=this.type,v.needsUpdate=!1,e.setRenderTarget(c,l,d)};function b(n,r){let a=t.update(_);p.defines.VSM_SAMPLES!==n.blurSamples&&(p.defines.VSM_SAMPLES=n.blurSamples,m.defines.VSM_SAMPLES=n.blurSamples,p.needsUpdate=!0,m.needsUpdate=!0),n.mapPass===null?n.mapPass=new sn(i.x,i.y,{format:ae,type:T}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),p.uniforms.shadow_pass.value=n.map.depthTexture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,p,_,null),m.uniforms.shadow_pass.value=n.mapPass.texture,m.uniforms.resolution.value.set(n.map.width,n.map.height),m.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,m,_,null)}function x(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,E)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function S(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=x(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=x(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)S(c[e],i,a,o,s)}function E(e){e.target.removeEventListener(`dispose`,E);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function hl(e,t){function n(){let t=!1,n=new an,r=null,i=new an(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?N(e.DEPTH_TEST):de(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=dt[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?N(e.STENCIL_TEST):de(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Gn(0,0,0),T=0,E=!1,D=null,ee=null,O=null,k=null,A=null,te=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),j=!1,ne=0,M=e.getParameter(e.VERSION);M.indexOf(`WebGL`)===-1?M.indexOf(`OpenGL ES`)!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(M)[1]),j=ne>=2):(ne=parseFloat(/^WebGL (\d)/.exec(M)[1]),j=ne>=1);let re=null,ie={},ae=e.getParameter(e.SCISSOR_BOX),oe=e.getParameter(e.VIEWPORT),se=new an().fromArray(ae),ce=new an().fromArray(oe);function le(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let ue={};ue[e.TEXTURE_2D]=le(e.TEXTURE_2D,e.TEXTURE_2D,1),ue[e.TEXTURE_CUBE_MAP]=le(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ue[e.TEXTURE_2D_ARRAY]=le(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ue[e.TEXTURE_3D]=le(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),N(e.DEPTH_TEST),o.setFunc(3),ye(!1),be(1),N(e.CULL_FACE),_e(0);function N(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function de(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function fe(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function pe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function me(t){return h!==t&&(e.useProgram(t),h=t,!0)}let he={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};he[103]=e.MIN,he[104]=e.MAX;let ge={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function _e(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(de(e.BLEND),g=!1);else if(g===!1&&(N(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:R(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:R(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:R(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:R(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a=a||n,o=o||r,s=s||i,(n!==v||a!==x)&&(e.blendEquationSeparate(he[n],he[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(ge[r],ge[i],ge[o],ge[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ve(t,n){t.side===2?de(e.CULL_FACE):N(e.CULL_FACE);let r=t.side===1;n&&(r=!r),ye(r),t.blending===1&&t.transparent===!1?_e(0):_e(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),Se(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?N(e.SAMPLE_ALPHA_TO_COVERAGE):de(e.SAMPLE_ALPHA_TO_COVERAGE)}function ye(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function be(t){t===0?de(e.CULL_FACE):(N(e.CULL_FACE),t!==ee&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),ee=t}function xe(t){t!==O&&(j&&e.lineWidth(t),O=t)}function Se(t,n,r){t?(N(e.POLYGON_OFFSET_FILL),(k!==n||A!==r)&&(k=n,A=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):de(e.POLYGON_OFFSET_FILL)}function Ce(t){t?N(e.SCISSOR_TEST):de(e.SCISSOR_TEST)}function we(t){t===void 0&&(t=e.TEXTURE0+te-1),re!==t&&(e.activeTexture(t),re=t)}function Te(t,n,r){r===void 0&&(r=re===null?e.TEXTURE0+te-1:re);let i=ie[r];i===void 0&&(i={type:void 0,texture:void 0},ie[r]=i),(i.type!==t||i.texture!==n)&&(re!==r&&(e.activeTexture(r),re=r),e.bindTexture(t,n||ue[t]),i.type=t,i.texture=n)}function Ee(){let t=ie[re];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function De(){try{e.compressedTexImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Oe(){try{e.compressedTexImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function ke(){try{e.texSubImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Ae(){try{e.texSubImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function je(){try{e.compressedTexSubImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Me(){try{e.compressedTexSubImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Ne(){try{e.texStorage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Pe(){try{e.texStorage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function P(){try{e.texImage2D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Fe(){try{e.texImage3D(...arguments)}catch(e){R(`WebGLState:`,e)}}function Ie(t){return d[t]===void 0?e.getParameter(t):d[t]}function Le(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function F(t){se.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),se.copy(t))}function Re(t){ce.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),ce.copy(t))}function I(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function ze(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Be(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},re=null,ie={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Gn(0,0,0),T=0,E=!1,D=null,ee=null,O=null,k=null,A=null,se.set(0,0,e.canvas.width,e.canvas.height),ce.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:N,disable:de,bindFramebuffer:fe,drawBuffers:pe,useProgram:me,setBlending:_e,setMaterial:ve,setFlipSided:ye,setCullFace:be,setLineWidth:xe,setPolygonOffset:Se,setScissorTest:Ce,activeTexture:we,bindTexture:Te,unbindTexture:Ee,compressedTexImage2D:De,compressedTexImage3D:Oe,texImage2D:P,texImage3D:Fe,pixelStorei:Le,getParameter:Ie,updateUBOMapping:I,uniformBlockBinding:ze,texStorage2D:Ne,texStorage3D:Pe,texSubImage2D:ke,texSubImage3D:Ae,compressedTexSubImage2D:je,compressedTexSubImage3D:Me,scissor:F,viewport:Re,reset:Be}}function gl(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),v=new z,y=new WeakMap,b=new Set,x,S=new WeakMap,C=!1;try{C=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function w(e,t){return C?new OffscreenCanvas(e,t):it(`canvas`)}function T(e,t,n){let r=1,i=Ie(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);x===void 0&&(x=w(n,a));let o=t?w(n,a):x;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),L(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&L(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function E(e){return e.generateMipmaps}function D(t){e.generateMipmap(t)}function ee(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function O(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];L(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||L(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?Xe:qt.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function k(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,L(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function A(e,t){return E(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function te(e){let t=e.target;t.removeEventListener(`dispose`,te),ne(t),t.isVideoTexture&&y.delete(t),t.isHTMLTexture&&b.delete(t)}function j(e){let t=e.target;t.removeEventListener(`dispose`,j),ie(t)}function ne(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=S.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&re(e),Object.keys(i).length===0&&S.delete(n)}r.remove(e)}function re(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=S.get(i);delete a[n.__cacheKey],o.memory.textures--}function ie(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let ae=0;function oe(){ae=0}function se(){return ae}function ce(e){ae=e}function le(){let e=ae;return e>=i.maxTextures&&L(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),ae+=1,e}function ue(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function N(t,i){let a=r.get(t);if(t.isVideoTexture&&P(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)L(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)L(`WebGLRenderer: Texture marked for update but image is incomplete`);else{xe(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function de(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?xe(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function fe(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?xe(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function pe(t,i){let a=r.get(t);t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version?Se(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let me={[l]:e.REPEAT,[u]:e.CLAMP_TO_EDGE,[d]:e.MIRRORED_REPEAT},he={[f]:e.NEAREST,[p]:e.NEAREST_MIPMAP_NEAREST,[m]:e.NEAREST_MIPMAP_LINEAR,[h]:e.LINEAR,[g]:e.LINEAR_MIPMAP_NEAREST,[_]:e.LINEAR_MIPMAP_LINEAR},ge={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function _e(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&L(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,me[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,me[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,me[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,he[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,he[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,ge[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function ve(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,te));let i=n.source,a=S.get(i);a===void 0&&(a={},S.set(i,a));let s=ue(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&re(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function ye(e,t,n){return Math.floor(Math.floor(e/n)/t)}function be(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=ye(n.start,r.width,4),c=ye(t.start,r.width,4);n.start<=i+1&&a===c&&ye(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function xe(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=ve(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let d=r.get(u);if(u.version!==d.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=qt.getPrimaries(qt.workingColorSpace),r=o.colorSpace===``?null:qt.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=T(o.image,!1,i.maxTextureSize);t=Fe(o,t);let r=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=O(o.internalFormat,r,f,o.normalized,o.colorSpace,o.isVideoTexture);_e(c,o);let m,h=o.mipmaps,g=o.isVideoTexture!==!0,_=d.__version===void 0||l===!0,v=u.dataReady,y=A(o,t);if(o.isDepthTexture)p=k(o.format===M,o.type),_&&(g?n.texStorage2D(e.TEXTURE_2D,1,p,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,p,t.width,t.height,0,r,f,null));else if(o.isDataTexture){if(h.length>0){g&&_&&n.texStorage2D(e.TEXTURE_2D,y,p,h[0].width,h[0].height);for(let t=0,i=h.length;t<i;t++)m=h[t],g?v&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,m.width,m.height,r,f,m.data):n.texImage2D(e.TEXTURE_2D,t,p,m.width,m.height,0,r,f,m.data);o.generateMipmaps=!1}else g?(_&&n.texStorage2D(e.TEXTURE_2D,y,p,t.width,t.height),v&&be(o,t,r,f)):n.texImage2D(e.TEXTURE_2D,0,p,t.width,t.height,0,r,f,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){g&&_&&n.texStorage3D(e.TEXTURE_2D_ARRAY,y,p,h[0].width,h[0].height,t.depth);for(let i=0,a=h.length;i<a;i++)if(m=h[i],o.format!==1023){if(r!==null){if(g){if(v){if(o.layerUpdates.size>0){let t=uo(m.width,m.height,o.format,o.type);for(let a of o.layerUpdates){let o=m.data.subarray(a*t/m.data.BYTES_PER_ELEMENT,(a+1)*t/m.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,m.width,m.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,m.width,m.height,t.depth,r,m.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,p,m.width,m.height,t.depth,0,m.data,0,0)}else L(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else g?v&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,m.width,m.height,t.depth,r,f,m.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,p,m.width,m.height,t.depth,0,r,f,m.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{g&&_&&n.texStorage2D(e.TEXTURE_2D,y,p,h[0].width,h[0].height);for(let t=0,i=h.length;t<i;t++)m=h[t],o.format===1023?g?v&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,m.width,m.height,r,f,m.data):n.texImage2D(e.TEXTURE_2D,t,p,m.width,m.height,0,r,f,m.data):r===null?L(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):g?v&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,m.width,m.height,r,m.data):n.compressedTexImage2D(e.TEXTURE_2D,t,p,m.width,m.height,0,m.data)}}else if(o.isDataArrayTexture){if(g){if(_&&n.texStorage3D(e.TEXTURE_2D_ARRAY,y,p,t.width,t.height,t.depth),v){if(o.layerUpdates.size>0){let i=uo(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,f,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,f,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,p,t.width,t.height,t.depth,0,r,f,t.data)}else if(o.isData3DTexture)g?(_&&n.texStorage3D(e.TEXTURE_3D,y,p,t.width,t.height,t.depth),v&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,f,t.data)):n.texImage3D(e.TEXTURE_3D,0,p,t.width,t.height,t.depth,0,r,f,t.data);else if(o.isFramebufferTexture){if(_){if(g)n.texStorage2D(e.TEXTURE_2D,y,p,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<y;t++)n.texImage2D(e.TEXTURE_2D,t,p,i,a,0,r,f,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),b.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of b)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(h.length>0){if(g&&_){let t=Ie(h[0]);n.texStorage2D(e.TEXTURE_2D,y,p,t.width,t.height)}for(let t=0,i=h.length;t<i;t++)m=h[t],g?v&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,f,m):n.texImage2D(e.TEXTURE_2D,t,p,r,f,m);o.generateMipmaps=!1}else if(g){if(_){let r=Ie(t);n.texStorage2D(e.TEXTURE_2D,y,p,r.width,r.height)}v&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,f,t)}else n.texImage2D(e.TEXTURE_2D,0,p,r,f,t);E(o)&&D(c),d.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function Se(t,o,s){if(o.image.length!==6)return;let c=ve(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=qt.getPrimaries(qt.workingColorSpace),r=o.colorSpace===``?null:qt.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=T(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Fe(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),v=O(o.internalFormat,g,_,o.normalized,o.colorSpace),y=o.isVideoTexture!==!0,b=u.__version===void 0||c===!0,x=l.dataReady,S=A(o,h);_e(e.TEXTURE_CUBE_MAP,o);let C;if(f){y&&b&&n.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,h.width,h.height);for(let t=0;t<6;t++){C=m[t].mipmaps;for(let r=0;r<C.length;r++){let i=C[r];o.format===1023?y?x&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,g,_,i.data):g===null?L(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):y?x&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,i.data)}}}else{if(C=o.mipmaps,y&&b){C.length>0&&S++;let t=Ie(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,t.width,t.height)}for(let t=0;t<6;t++)if(p){y?x&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<C.length;r++){let i=C[r].image[t].image;y?x&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,v,i.width,i.height,0,g,_,i.data)}}else{y?x&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,g,_,m[t]);for(let r=0;r<C.length;r++){let i=C[r];y?x&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,v,g,_,i.image[t])}}}E(o)&&D(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function Ce(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=O(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),Pe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,Ne(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function we(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=k(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Pe(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ne(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ne(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=O(o.internalFormat,c,l,o.normalized,o.colorSpace);Pe(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ne(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ne(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Te(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,te)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),_e(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else N(i.depthTexture,0);let u=l.__webglTexture,d=Ne(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)Pe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)Pe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Ee(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)Te(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?Te(i.__webglFramebuffer[0],t,0):Te(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),we(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),we(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function De(t,n,i){let a=r.get(t);n!==void 0&&Ce(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&Ee(t)}function Oe(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,j);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&Pe(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=O(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=Ne(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),we(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),_e(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)Ce(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else Ce(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);E(i)&&D(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),_e(c,a),Ce(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),E(a)&&D(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),_e(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)Ce(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else Ce(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);E(i)&&D(r),n.unbindTexture()}t.depthBuffer&&Ee(t)}function ke(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(E(a)){let t=ee(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),D(t),n.unbindTexture()}}}let Ae=[],je=[];function Me(t){if(t.samples>0){if(Pe(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(Ae.length=0,je.length=0,Ae.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(Ae.push(l),je.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,je)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ae))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function Ne(e){return Math.min(i.maxSamples,e.samples)}function Pe(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function P(e){let t=o.render.frame;y.get(e)!==t&&(y.set(e,t),e.update())}function Fe(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(qt.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&L(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):R(`WebGLTextures: Unsupported texture color space:`,n)),t}function Ie(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(v.width=e.naturalWidth||e.width,v.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(v.width=e.displayWidth,v.height=e.displayHeight):(v.width=e.width,v.height=e.height),v}this.allocateTextureUnit=le,this.resetTextureUnits=oe,this.getTextureUnits=se,this.setTextureUnits=ce,this.setTexture2D=N,this.setTexture2DArray=de,this.setTexture3D=fe,this.setTextureCube=pe,this.rebindTextures=De,this.setupRenderTarget=Oe,this.updateRenderTargetMipmap=ke,this.updateMultisampleRenderTarget=Me,this.setupDepthRenderbuffer=Ee,this.setupFrameBufferTexture=Ce,this.useMultisampledRTT=Pe,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function _l(e,t){function n(n,r=``){let i,a=qt.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var vl=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,yl=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,bl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ia(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new ga({vertexShader:vl,fragmentShader:yl,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ai(new oa(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},xl=class extends ft{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new bl,g={},_=t.getContextAttributes(),y=null,b=null,x=[],S=[],w=new z,T=null,E=null,D=new Ka;D.viewport=new an;let O=new Ka;O.viewport=new an;let k=[D,O],A=new Za,te=null,re=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=x[e];return t===void 0&&(t=new Bn,x[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=x[e];return t===void 0&&(t=new Bn,x[e]=t),t.getGripSpace()},this.getHand=function(e){let t=x[e];return t===void 0&&(t=new Bn,x[e]=t),t.getHandSpace()};function ie(e){let t=S.indexOf(e.inputSource);if(t===-1)return;let n=x[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ae(){r.removeEventListener(`select`,ie),r.removeEventListener(`selectstart`,ie),r.removeEventListener(`selectend`,ie),r.removeEventListener(`squeeze`,ie),r.removeEventListener(`squeezestart`,ie),r.removeEventListener(`squeezeend`,ie),r.removeEventListener(`end`,ae),r.removeEventListener(`inputsourceschange`,oe);for(let e=0;e<x.length;e++){let t=S[e];t!==null&&(S[e]=null,x[e].disconnect(t))}te=null,re=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(y),f=null,d=null,u=null,r=null,b=null,pe.stop(),n.isPresenting=!1,e.setPixelRatio(T),e.setSize(w.width,w.height,!1),E!==null){let e=E.camera;e.fov=E.fov,e.zoom=E.zoom,e.updateProjectionMatrix(),E=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&L(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&L(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(y=e.getRenderTarget(),r.addEventListener(`select`,ie),r.addEventListener(`selectstart`,ie),r.addEventListener(`selectend`,ie),r.addEventListener(`squeeze`,ie),r.addEventListener(`squeezestart`,ie),r.addEventListener(`squeezeend`,ie),r.addEventListener(`end`,ae),r.addEventListener(`inputsourceschange`,oe),_.xrCompatible!==!0&&await t.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(w),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?M:ne,a=_.stencil?ee:C);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),b=new sn(d.textureWidth,d.textureHeight,{format:j,type:v,depthTexture:new na(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new sn(f.framebufferWidth,f.framebufferHeight,{format:j,type:v,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),pe.setContext(r),pe.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function oe(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=S.indexOf(n);r>=0&&(S[r]=null,x[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=S.indexOf(n);if(r===-1){for(let e=0;e<x.length;e++)if(e>=S.length){S.push(n),r=e;break}else if(S[e]===null){S[e]=n,r=e;break}if(r===-1)break}let i=x[r];i&&i.connect(n)}}let se=new B,ce=new B;function le(e,t,n){se.setFromMatrixPosition(t.matrixWorld),ce.setFromMatrixPosition(n.matrixWorld);let r=se.distanceTo(ce),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function ue(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),A.near=O.near=D.near=t,A.far=O.far=D.far=n,(te!==A.near||re!==A.far)&&(r.updateRenderState({depthNear:A.near,depthFar:A.far}),te=A.near,re=A.far),A.layers.mask=e.layers.mask|6,D.layers.mask=A.layers.mask&-5,O.layers.mask=A.layers.mask&-3;let i=e.parent,a=A.cameras;ue(A,i);for(let e=0;e<a.length;e++)ue(a[e],i);a.length===2?le(A,D,O):A.projectionMatrix.copy(D.projectionMatrix),E===null&&e.isPerspectiveCamera&&(E={camera:e,fov:e.fov,zoom:e.zoom}),N(e,A,i)};function N(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=gt*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return A},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(A)},this.getCameraTexture=function(e){return g[e]};let de=null;function fe(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(b,f.framebuffer),e.setRenderTarget(b));let i=!1;t.length!==A.cameras.length&&(A.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(b,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(b))}let o=k[n];o===void 0&&(o=new Ka,o.layers.enable(n),o.viewport=new an,k[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(A.matrix.copy(o.matrix),A.matrix.decompose(A.position,A.quaternion,A.scale)),i===!0&&A.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new ia,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<x.length;e++){let t=S[e],n=x[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}de&&de(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let pe=new po;pe.setAnimationLoop(fe),this.setAnimationLoop=function(e){de=e},this.dispose=function(){}}},Sl=new un,Cl=new V;Cl.set(-1,0,0,0,1,0,0,0,1);function wl(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,fa(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Sl.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Cl),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Tl(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return R(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?L(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):L(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var El=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Dl=null;function Ol(){return Dl===null&&(Dl=new Ni(El,16,16,ae,T),Dl.name=`DFG_LUT`,Dl.minFilter=h,Dl.magFilter=h,Dl.wrapS=u,Dl.wrapT=u,Dl.generateMipmaps=!1,Dl.needsUpdate=!0),Dl}var kl=class{constructor(e={}){let{canvas:t=at(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=v}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([se,oe,ie]),g=new Set([v,C,x,ee,E,D]),y=new Uint32Array(4),b=new Int32Array(4),S=new B,w=null,O=null,k=[],A=[],te=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let j=this,ne=!1,M=null,re=null,ae=null,ce=null;this._outputColorSpace=Je;let le=0,ue=0,N=null,de=-1,fe=null,pe=new an,me=new an,he=null,ge=new Gn(0),_e=0,ve=t.width,ye=t.height,be=1,xe=null,Se=null,Ce=new an(0,0,ve,ye),we=new an(0,0,ve,ye),Te=!1,Ee=new Ki,De=!1,Oe=!1,ke=new un,Ae=new B,je=new an,Me={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ne=!1;function Pe(){return N===null?be:1}let P=n;function Fe(e,n){return t.getContext(e,n)}let Ie,Le,F,Re,I,ze,Be,Ve,He,Ue,We,Ge,Ke,qe,Ye,Xe,Ze,Qe,$e,et,nt,rt,it;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,lt,!1),t.addEventListener(`webglcontextrestored`,dt,!1),t.addEventListener(`webglcontextcreationerror`,ft,!1),P===null){let t=`webgl2`;if(P=Fe(t,e),P===null)throw Fe(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}ot()}catch(e){throw t.removeEventListener(`webglcontextlost`,lt,!1),t.removeEventListener(`webglcontextrestored`,dt,!1),t.removeEventListener(`webglcontextcreationerror`,ft,!1),R(`WebGLRenderer: `+e.message),e}function ot(){Ie=new qo(P),Ie.init(),nt=new _l(P,Ie),Le=new So(P,Ie,e,nt),F=new hl(P,Ie),Le.reversedDepthBuffer&&d&&F.buffers.depth.setReversed(!0),re=P.createFramebuffer(),ae=P.createFramebuffer(),ce=P.createFramebuffer(),Re=new Xo(P),I=new Yc,ze=new gl(P,Ie,F,I,Le,nt,Re),Be=new Ko(j),Ve=new mo(P),rt=new bo(P,Ve),He=new Jo(P,Ve,Re,rt),Ue=new Qo(P,He,Ve,rt,Re),Qe=new Zo(P,Le,ze),Ye=new Co(I),We=new Jc(j,Be,Ie,Le,rt,Ye),Ge=new wl(j,I),Ke=new $c,qe=new ol(Ie),Ze=new yo(j,Be,F,Ue,p,s),Xe=new ml(j,Ue,Le),it=new Tl(P,Re,Le,F),$e=new xo(P,Ie,Re),et=new Yo(P,Ie,Re),Re.programs=We.programs,j.capabilities=Le,j.extensions=Ie,j.properties=I,j.renderLists=Ke,j.shadowMap=Xe,j.state=F,j.info=Re}m!==1009&&(te=new es(m,t.width,t.height,o,r,i));let ct=new xl(j,P);this.xr=ct,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let e=Ie.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ie.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return be},this.setPixelRatio=function(e){e!==void 0&&(be=e,this.setSize(ve,ye,!1))},this.getSize=function(e){return e.set(ve,ye)},this.setSize=function(e,n,r=!0){ct.isPresenting?L(`WebGLRenderer: Can't change size while VR device is presenting.`):(ve=e,ye=n,t.width=Math.floor(e*be),t.height=Math.floor(n*be),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),te!==null&&te.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(ve*be,ye*be).floor()},this.setDrawingBufferSize=function(e,n,r){ve=e,ye=n,be=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)R(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){L(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}te.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(pe)},this.getViewport=function(e){return e.copy(Ce)},this.setViewport=function(e,t,n,r){e.isVector4?Ce.set(e.x,e.y,e.z,e.w):Ce.set(e,t,n,r),F.viewport(pe.copy(Ce).multiplyScalar(be).round())},this.getScissor=function(e){return e.copy(we)},this.setScissor=function(e,t,n,r){e.isVector4?we.set(e.x,e.y,e.z,e.w):we.set(e,t,n,r),F.scissor(me.copy(we).multiplyScalar(be).round())},this.getScissorTest=function(){return Te},this.setScissorTest=function(e){F.setScissorTest(Te=e)},this.setOpaqueSort=function(e){xe=e},this.setTransparentSort=function(e){Se=e},this.getClearColor=function(e){return e.copy(Ze.getClearColor())},this.setClearColor=function(){Ze.setClearColor(...arguments)},this.getClearAlpha=function(){return Ze.getClearAlpha()},this.setClearAlpha=function(){Ze.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=Ze.getClearColor(),r=Ze.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(y[0]=i,y[1]=a,y[2]=o,y[3]=r,P.clearBufferuiv(P.COLOR,0,y)):(b[0]=i,b[1]=a,b[2]=o,b[3]=r,P.clearBufferiv(P.COLOR,0,b))}else r|=P.COLOR_BUFFER_BIT}t&&(r|=P.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&P.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),M=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,lt,!1),t.removeEventListener(`webglcontextrestored`,dt,!1),t.removeEventListener(`webglcontextcreationerror`,ft,!1),Ze.dispose(),Ke.dispose(),qe.dispose(),I.dispose(),Be.dispose(),Ue.dispose(),rt.dispose(),it.dispose(),We.dispose(),ct.dispose(),ct.removeEventListener(`sessionstart`,yt),ct.removeEventListener(`sessionend`,bt),xt.stop()};function lt(e){e.preventDefault(),st(`WebGLRenderer: Context Lost.`),ne=!0}function dt(){st(`WebGLRenderer: Context Restored.`),ne=!1;let e=Re.autoReset,t=Xe.enabled,n=Xe.autoUpdate,r=Xe.needsUpdate,i=Xe.type;ot(),Re.autoReset=e,Xe.enabled=t,Xe.autoUpdate=n,Xe.needsUpdate=r,Xe.type=i}function ft(e){R(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function pt(e){let t=e.target;t.removeEventListener(`dispose`,pt),mt(t)}function mt(e){ht(e),I.remove(e)}function ht(e){let t=I.get(e).programs;t!==void 0&&(t.forEach(function(e){We.releaseProgram(e)}),e.isShaderMaterial&&We.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Me);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=jt(e,t,n,r,i);F.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=He.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;rt.setup(i,r,s,n,c);let h,g=$e;if(c!==null&&(h=Ve.get(c),g=et,g.setIndex(h)),i.isMesh)r.wireframe===!0?(F.setLineWidth(r.wireframeLinewidth*Pe()),g.setMode(P.LINES)):g.setMode(P.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),F.setLineWidth(e*Pe()),i.isLineSegments?g.setMode(P.LINES):i.isLineLoop?g.setMode(P.LINE_LOOP):g.setMode(P.LINE_STRIP)}else i.isPoints?g.setMode(P.POINTS):i.isSprite&&g.setMode(P.TRIANGLES);if(i.isBatchedMesh){if(Ie.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ve.get(c).bytesPerElement:1,o=I.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(P,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function gt(e,t,n,r){M!==null&&e.isNodeMaterial&&M.setObject(r,e),De===!0&&Ye.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,Dt(e,t,r),e.side=0,e.needsUpdate=!0,Dt(e,t,r),e.side=2):Dt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),M!==null&&M.renderStart(e,t,n),O=qe.get(n),O.init(t),A.push(O),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(O.pushLight(e),e.castShadow&&O.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(O.pushLight(e),e.castShadow&&O.pushShadow(e))}),O.setupLights(),M!==null&&M.updateLights(O.state.lightsArray),Oe=this.localClippingEnabled,De=Ye.init(this.clippingPlanes,Oe),De===!0&&Ye.setGlobalState(this.clippingPlanes,t),M!==null&&Xe.render(O.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];gt(o,n,t,e),r.add(o)}else gt(i,n,t,e),r.add(i)}}),O=A.pop(),M!==null&&M.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=I.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Ie.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let _t=null;function vt(e){_t&&_t(e)}function yt(){xt.stop()}function bt(){xt.start()}let xt=new po;xt.setAnimationLoop(vt),typeof self<`u`&&xt.setContext(self),this.setAnimationLoop=function(e){_t=e,ct.setAnimationLoop(e),e===null?xt.stop():xt.start()},ct.addEventListener(`sessionstart`,yt),ct.addEventListener(`sessionend`,bt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){R(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(ne===!0)return;M!==null&&M.renderStart(e,t);let n=ct.enabled===!0&&ct.isPresenting===!0,r=te!==null&&(N===null||n)&&te.begin(j,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),ct.enabled===!0&&ct.isPresenting===!0&&(te===null||te.isCompositing()===!1)&&(ct.cameraAutoUpdate===!0&&ct.updateCamera(t),t=ct.getCamera()),e.isScene===!0&&e.onBeforeRender(j,e,t,N),O=qe.get(e,A.length),O.init(t),O.state.textureUnits=ze.getTextureUnits(),A.push(O),ke.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Ee.setFromProjectionMatrix(ke,tt,t.reversedDepth),Oe=this.localClippingEnabled,De=Ye.init(this.clippingPlanes,Oe),w=Ke.get(e,k.length),w.init(),k.push(w),ct.enabled===!0&&ct.isPresenting===!0){let e=j.xr.getDepthSensingMesh();e!==null&&St(e,t,-1/0,j.sortObjects)}St(e,t,0,j.sortObjects),w.finish(),M!==null&&M.updateLights(O.state.lightsArray),j.sortObjects===!0&&w.sort(xe,Se),Ne=ct.enabled===!1||ct.isPresenting===!1||ct.hasDepthSensing()===!1,Ne&&Ze.addToRenderList(w,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),De===!0&&Ye.beginShadows();let i=O.state.shadowsArray;if(Xe.render(i,e,t),De===!0&&Ye.endShadows(),(r&&te.hasRenderPass())===!1){let n=w.opaque,r=w.transmissive;if(O.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];wt(n,r,e,a)}Ne&&Ze.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];Ct(w,e,n,n.viewport)}}else r.length>0&&wt(n,r,e,t),Ne&&Ze.render(e),Ct(w,e,t)}N!==null&&ue===0&&(ze.updateMultisampleRenderTarget(N),ze.updateRenderTargetMipmap(N)),r&&te.end(j),e.isScene===!0&&e.onAfterRender(j,e,t),rt.resetDefaultState(),de=-1,fe=null,A.pop(),A.length>0?(O=A[A.length-1],ze.setTextureUnits(O.state.textureUnits),De===!0&&Ye.setGlobalState(j.clippingPlanes,O.state.camera)):O=null,k.pop(),w=k.length>0?k[k.length-1]:null,M!==null&&M.renderEnd()};function St(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)O.pushLightProbeGrid(e);else if(e.isLight)O.pushLight(e),e.castShadow&&O.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(Ee)){r&&je.setFromMatrixPosition(e.matrixWorld).applyMatrix4(ke);let i=Ue.update(e),a=e.material;a.visible&&w.push(e,i,a,n,je.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(Ee))){let i=Ue.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),je.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),je.copy(e.boundingSphere.center)),je.applyMatrix4(e.matrixWorld).applyMatrix4(ke)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&w.push(e,i,c,n,je.z,s,t)}}else a.visible&&w.push(e,i,a,n,je.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)St(i[e],t,n,r)}function Ct(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;O.setupLightsView(n),De===!0&&Ye.setGlobalState(j.clippingPlanes,n),r&&F.viewport(pe.copy(r)),i.length>0&&Tt(i,t,n),a.length>0&&Tt(a,t,n),o.length>0&&Tt(o,t,n),F.buffers.depth.setTest(!0),F.buffers.depth.setMask(!0),F.buffers.color.setMask(!0),F.setPolygonOffset(!1)}function wt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(O.state.transmissionRenderTarget[r.id]===void 0){let e=Ie.has(`EXT_color_buffer_half_float`)||Ie.has(`EXT_color_buffer_float`);O.state.transmissionRenderTarget[r.id]=new sn(1,1,{generateMipmaps:!0,type:e?T:v,minFilter:_,samples:Math.max(4,Le.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:qt.workingColorSpace})}let a=O.state.transmissionRenderTarget[r.id],o=r.viewport||pe;a.setSize(o.z*j.transmissionResolutionScale,o.w*j.transmissionResolutionScale);let s=j.getRenderTarget(),c=j.getActiveCubeFace(),l=j.getActiveMipmapLevel();j.setRenderTarget(a),j.getClearColor(ge),_e=j.getClearAlpha(),_e<1&&j.setClearColor(16777215,.5),j.clear(),Ne&&Ze.render(n);let u=j.toneMapping;j.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),O.setupLightsView(r),De===!0&&Ye.setGlobalState(j.clippingPlanes,r),Tt(e,n,r),ze.updateMultisampleRenderTarget(a),ze.updateRenderTargetMipmap(a),Ie.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,Et(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(ze.updateMultisampleRenderTarget(a),ze.updateRenderTargetMipmap(a))}j.setRenderTarget(s,c,l),j.setClearColor(ge,_e),d!==void 0&&(r.viewport=d),j.toneMapping=u}function Tt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&Et(o,t,n,s,l,c)}}function Et(e,t,n,r,i,a){M!==null&&i.isNodeMaterial&&M.setObject(e,i),e.onBeforeRender(j,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(j,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,j.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,j.renderBufferDirect(n,t,r,i,e,a),i.side=2):j.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(j,t,n,r,i,a)}function Dt(e,t,n){t.isScene!==!0&&(t=Me);let r=I.get(e),i=O.state.lights,a=O.state.shadowsArray,o=i.state.version,s=We.getParameters(e,i.state,a,t,n,O.state.lightProbeGridArray),c=We.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Be.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,pt),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return kt(e,s),d}else s.uniforms=We.getUniforms(e),M!==null&&e.isNodeMaterial&&M.build(e,n,s),e.onBeforeCompile(s,j),d=We.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ye.uniform),kt(e,s),r.needsLights=Nt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=O.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function Ot(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=sc.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function kt(e,t){let n=I.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function At(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];S.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(S))return n}return null}function jt(e,t,n,r,i){t.isScene!==!0&&(t=Me),ze.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?j.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:qt.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Be.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=j.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=I.get(r),y=O.state.lights;if(De===!0&&(Oe===!0||e!==fe)){let t=e===fe&&r.id===de;Ye.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ye.numPlanes||v.numIntersection!==Ye.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=O.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let x=v.currentProgram;b===!0&&(x=Dt(r,t,i),M&&r.isNodeMaterial&&M.onUpdateProgram(r,x,v));let S=!1,C=!1,w=!1,T=x.getUniforms(),E=v.uniforms;if(F.useProgram(x.program)&&(S=!0,C=!0,w=!0),r.id!==de&&(de=r.id,C=!0),v.needsLights){let e=At(O.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,C=!0)}if(S||fe!==e){F.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),T.setValue(P,`projectionMatrix`,e.projectionMatrix),T.setValue(P,`viewMatrix`,e.matrixWorldInverse);let t=T.map.cameraPosition;t!==void 0&&t.setValue(P,Ae.setFromMatrixPosition(e.matrixWorld)),Le.logarithmicDepthBuffer&&T.setValue(P,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&T.setValue(P,`isOrthographic`,e.isOrthographicCamera===!0),fe!==e&&(fe=e,C=!0,w=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&T.setValue(P,`sunShadowMap`,y.state.sunShadowMap,ze),y.state.directionalShadowMap.length>0&&T.setValue(P,`directionalShadowMap`,y.state.directionalShadowMap,ze),y.state.spotShadowMap.length>0&&T.setValue(P,`spotShadowMap`,y.state.spotShadowMap,ze),y.state.pointShadowMap.length>0&&T.setValue(P,`pointShadowMap`,y.state.pointShadowMap,ze)),i.isSkinnedMesh){T.setOptional(P,i,`bindMatrix`),T.setOptional(P,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),T.setValue(P,`boneTexture`,e.boneTexture,ze))}i.isBatchedMesh&&(T.setOptional(P,i,`batchingTexture`),T.setValue(P,`batchingTexture`,i._matricesTexture,ze),T.setOptional(P,i,`batchingIdTexture`),T.setValue(P,`batchingIdTexture`,i._indirectTexture,ze),T.setOptional(P,i,`batchingColorTexture`),i._colorsTexture!==null&&T.setValue(P,`batchingColorTexture`,i._colorsTexture,ze));let D=n.morphAttributes;if((D.position!==void 0||D.normal!==void 0||D.color!==void 0)&&Qe.update(i,n,x),(C||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,T.setValue(P,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(E.envMapIntensity.value=t.environmentIntensity),E.dfgLUT!==void 0&&(E.dfgLUT.value=Ol()),C){if(T.setValue(P,`toneMappingExposure`,j.toneMappingExposure),v.needsLights&&Mt(E,w),a&&r.fog===!0&&Ge.refreshFogUniforms(E,a),Ge.refreshMaterialUniforms(E,r,be,ye,O.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;E.probesSH.value=e.texture,E.probesMin.value.copy(e.boundingBox.min),E.probesMax.value.copy(e.boundingBox.max),E.probesResolution.value.copy(e.resolution)}sc.upload(P,Ot(v),E,ze)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(sc.upload(P,Ot(v),E,ze),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&T.setValue(P,`center`,i.center),T.setValue(P,`modelViewMatrix`,i.modelViewMatrix),T.setValue(P,`normalMatrix`,i.normalMatrix),T.setValue(P,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];it.update(n,x),it.bind(n,x)}}return x}function Mt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Nt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return le},this.getActiveMipmapLevel=function(){return ue},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=I.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),I.get(e.texture).__webglTexture=t,I.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=I.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,le=t,ue=n;let r=null,i=!1,a=!1;if(e){let o=I.get(e);if(o.__useDefaultFramebuffer!==void 0){F.bindFramebuffer(P.FRAMEBUFFER,o.__webglFramebuffer),pe.copy(e.viewport),me.copy(e.scissor),he=e.scissorTest,F.viewport(pe),F.scissor(me),F.setScissorTest(he),de=-1;return}if(o.__webglFramebuffer===void 0)ze.setupRenderTarget(e);else if(o.__hasExternalTextures)ze.rebindTextures(e,I.get(e.texture).__webglTexture,I.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&I.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);ze.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=I.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&ze.useMultisampledRTT(e)===!1?I.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,pe.copy(e.viewport),me.copy(e.scissor),he=e.scissorTest}else pe.copy(Ce).multiplyScalar(be).floor(),me.copy(we).multiplyScalar(be).floor(),he=Te;if(n!==0&&(r=re),F.bindFramebuffer(P.FRAMEBUFFER,r)&&F.drawBuffers(e,r),F.viewport(pe),F.scissor(me),F.setScissorTest(he),i){let r=I.get(e.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=I.get(e.textures[t]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=I.get(e.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,t.__webglTexture,n)}de=-1};function Pt(e){let t=I.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Le.textureFormatReadable(e.format),t.__typeReadable=Le.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){R(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=I.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){F.bindFramebuffer(P.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+s);let u=Pt(o);if(u.__formatReadable===!1){R(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){R(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&P.readPixels(t,n,r,i,nt.convert(c),nt.convert(l),a)}finally{let e=N===null?null:I.get(N).__webglFramebuffer;F.bindFramebuffer(P.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=I.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){F.bindFramebuffer(P.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+s);let d=Pt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,f),P.bufferData(P.PIXEL_PACK_BUFFER,a.byteLength,P.STREAM_READ),P.readPixels(t,n,r,i,nt.convert(l),nt.convert(u),0),P.bindBuffer(P.PIXEL_PACK_BUFFER,null);let p=N===null?null:I.get(N).__webglFramebuffer;F.bindFramebuffer(P.FRAMEBUFFER,p);let m=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await ut(P,m,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,f),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,a),P.bindBuffer(P.PIXEL_PACK_BUFFER,null),P.deleteBuffer(f),P.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;ze.setTexture2D(e,0),P.copyTexSubImage2D(P.TEXTURE_2D,n,0,0,o,s,i,a),F.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=nt.convert(t.format),_=nt.convert(t.type),v;t.isData3DTexture?(ze.setTexture3D(t,0),v=P.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(ze.setTexture2DArray(t,0),v=P.TEXTURE_2D_ARRAY):(ze.setTexture2D(t,0),v=P.TEXTURE_2D),F.activeTexture(P.TEXTURE0),F.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,t.flipY),F.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),F.pixelStorei(P.UNPACK_ALIGNMENT,t.unpackAlignment);let y=F.getParameter(P.UNPACK_ROW_LENGTH),b=F.getParameter(P.UNPACK_IMAGE_HEIGHT),x=F.getParameter(P.UNPACK_SKIP_PIXELS),S=F.getParameter(P.UNPACK_SKIP_ROWS),C=F.getParameter(P.UNPACK_SKIP_IMAGES);F.pixelStorei(P.UNPACK_ROW_LENGTH,h.width),F.pixelStorei(P.UNPACK_IMAGE_HEIGHT,h.height),F.pixelStorei(P.UNPACK_SKIP_PIXELS,l),F.pixelStorei(P.UNPACK_SKIP_ROWS,u),F.pixelStorei(P.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=I.get(e),r=I.get(t),h=I.get(n.__renderTarget),g=I.get(r.__renderTarget);F.bindFramebuffer(P.READ_FRAMEBUFFER,h.__webglFramebuffer),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,I.get(e).__webglTexture,i,d+n),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,I.get(t).__webglTexture,a,m+n)),P.blitFramebuffer(l,u,o,s,f,p,o,s,P.DEPTH_BUFFER_BIT,P.NEAREST);F.bindFramebuffer(P.READ_FRAMEBUFFER,null),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||I.has(e)){let n=I.get(e),r=I.get(t);F.bindFramebuffer(P.READ_FRAMEBUFFER,ae),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,ce);for(let e=0;e<c;e++)w?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,n.__webglTexture,i),T?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,r.__webglTexture,a),i===0?T?P.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):P.copyTexSubImage2D(v,a,f,p,l,u,o,s):P.blitFramebuffer(l,u,o,s,f,p,o,s,P.COLOR_BUFFER_BIT,P.NEAREST);F.bindFramebuffer(P.READ_FRAMEBUFFER,null),F.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?P.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?P.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):P.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):P.texSubImage2D(P.TEXTURE_2D,a,f,p,o,s,g,_,h);F.pixelStorei(P.UNPACK_ROW_LENGTH,y),F.pixelStorei(P.UNPACK_IMAGE_HEIGHT,b),F.pixelStorei(P.UNPACK_SKIP_PIXELS,x),F.pixelStorei(P.UNPACK_SKIP_ROWS,S),F.pixelStorei(P.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&P.generateMipmap(v),F.unbindTexture()},this.initRenderTarget=function(e){I.get(e).__webglFramebuffer===void 0&&ze.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?ze.setTextureCube(e,0):e.isData3DTexture?ze.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?ze.setTexture2DArray(e,0):ze.setTexture2D(e,0),F.unbindTexture()},this.resetState=function(){le=0,ue=0,N=null,F.reset(),rt.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return tt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=qt._getDrawingBufferColorSpace(e),t.unpackColorSpace=qt._getUnpackColorSpace()}},W={WORLD_SEED:1337,WORLD_HALF:300,WORLD_WALL:286,CHUNK:40,TERRAIN_CELL:2.5,RUN_SECONDS:1800,GRACE_SECONDS:12,MORNING_SECONDS:32,DUSK_SECONDS:3.6,CAMP_LEASH:26,CAMERA_FAR:150,FOV:72,PLAYER:{radius:.35,eye:1.62,crouchEye:1.02,walk:3.1,sprint:5.7,crouch:1.45,accel:16,decel:20,stamina:100,sprintDrain:21,staminaRegen:16,exhaustedUntil:35,stepWalk:.78,stepSprint:1.15,stepCrouch:.62,maxStones:3,stoneRegen:55},PULSE:{slots:16,stepSlots:3,speed:30,stepSpeed:18},revealRadius:e=>12+54*e,hearRadius:e=>3+72*Math.max(e,0)**1.35,SCREAM:.78,MONSTER:{listener:{wander:1.05,investigate:2.1,hunt:4.7,hearing:1,lock:6,radius:.45},crawler:{wander:1.6,investigate:3.2,hunt:6.1,hearing:.62,stepHearing:2.2,lock:3.2,radius:.45},watcher:{stalk:3.5,hearing:0,lock:0,radius:.4,litThreshold:.13,arrive:240,arriveGens:2},howler:{wander:1.25,investigate:2.6,hunt:6.4,hearing:.6,minLoud:.4,lock:6.5,radius:.6,arrive:480,arriveGens:3,howlR:46},killDist:1.35},GENERATORS:[{part:`fuel`,mode:`cord`,dur:4,clank:[1,1.5],clankLoud:.12,pulls:3,pullLoud:.34,startLoud:.6},{part:`plug`,mode:`hold`,dur:7,clank:[.9,1.4],clankLoud:.15,startLoud:.62},{part:`fuses`,mode:`spark`,dur:9,clank:[1,1.6],clankLoud:.16,spark:[1.3,3],sparkLoud:.5,startLoud:.64},{part:`belt`,mode:`clank`,dur:10,clank:[.55,.95],clankLoud:.3,startLoud:.66},{part:`battery`,mode:`spinup`,dur:8,clank:[1,1.5],clankLoud:.15,spin:9,spinLoud:.42,startLoud:.72}],GEN_SITES:[`cabin`,`tower`,`stones`,`wreck`],LAMP_R:10,SCORE:{perSecond:10,shard:250,closeCall:300,escape:500,corpse:400,generator:2e3,win:25e3,speedBonus:10},SHARDS:46};function Al(e){return 1+Math.floor(e/300)*.5}function jl(e){let t=e/60,n=2,r=0;return t>=2&&(n=3),t>=4&&(r=1),t>=7&&(n=4),t>=10&&(r=2),t>=15&&(n=5),t>=20&&(r=3),t>=25&&(n=6),{listeners:n,crawlers:r}}var Ml=`hush.settings.v1`,Nl=`hush.scores.v1`,Pl=10,Fl={lang:(navigator.language||`ru`).toLowerCase().startsWith(`ru`)?`ru`:`en`,volume:.85,mouseSens:1,invertY:!1,micEnabled:!0,micSens:.55,voiceEcho:!0,scares:`full`,quality:`auto`,radar:!1,name:``,tutorialDone:!1};function Il(e,t){try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}function Ll(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}var G={...Fl,...Il(Ml,{})};function Rl(){Ll(Ml,G)}function zl(){let e=Il(Nl,[]);return Array.isArray(e)?e.filter(e=>e&&typeof e.score==`number`):[]}function Bl(e){let t=zl(),n={name:(e.name||`???`).slice(0,14),score:Math.floor(e.score),time:Math.round(e.time),won:!!e.won,shards:e.shards|0,gens:e.gens|0,coop:e.coop|0,date:Date.now()};t.push(n),t.sort((e,t)=>t.score-e.score||t.time-e.time);let r=t.slice(0,Pl);return Ll(Nl,r),{rank:r.indexOf(n),list:r}}var Vl={ru:{title:`ТИШЕ`,tagline:`Ты слеп. Лес — нет.`,subtitle:`эхолокационный хоррор · запусти пять генераторов`,play:`ИГРАТЬ`,scores:`РЕКОРДЫ`,settings:`НАСТРОЙКИ`,howto:`КАК ИГРАТЬ`,back:`НАЗАД`,resume:`ПРОДОЛЖИТЬ`,restart:`ЗАНОВО`,menu:`В МЕНЮ`,paused:`ПАУЗА`,callsign:`Позывной`,headphones:`Играй в наушниках. Звук — твои глаза.`,loading:`лес растёт…`,micOn:`МИКРОФОН: ВКЛ`,micOff:`МИКРОФОН: ВЫКЛ`,micAsk:`Разрешить микрофон`,micDenied:`Микрофон недоступен — играй клавишами (ПРОБЕЛ / кнопка ЭХО).`,micIframe:`Браузер блокирует микрофон во встроенном окне.`,micOpenTab:`Открыть в новой вкладке`,micTest:`проверь микрофон: скажи «эй»`,score:`СЧЁТ`,best:`рекорд`,generators:`генераторы`,stones:`камни`,stamina:`дыхание`,intro1:`ты ничего не видишь`,intro2:`издай звук`,introHintMic:`хлопни, щёлкни языком или скажи «эй» — или зажми ПРОБЕЛ`,introHintKeys:`нажми ПРОБЕЛ — короткий щелчок, зажми — громче`,introHintTouch:`нажми ЭХО — щелчок, удерживай — громче`,itHears:`оно тебя слышит`,tutMove:`уходи тихо — WASD · Shift бег (шумно) · C красться`,tutMoveTouch:`уходи тихо — левый стик · до упора = бег (шумно)`,tutStone:`ПКМ / F — бросить камень и отвлечь их`,tutStoneTouch:`КАМЕНЬ — бросить и отвлечь их`,tutUse:`у генератора лежит тело — подойди и удерживай E · Tab — что делать дальше`,tutUseTouch:`у генератора лежит тело — подойди, появится кнопка РУКИ · тап по верху — задача`,tutScream:`и что бы ни случилось — не кричи`,morningBig:`утро`,morningSmall:`лагерь на старой просеке`,morningHint:`осмотрись · WASD — идти, мышь — смотреть`,morningHintTouch:`осмотрись · левый стик — идти, правая часть экрана — смотреть`,morningGen:`генератор тарахтит. птицы. всё хорошо.`,campLeash:`не уходи далеко от лагеря`,skipHint:`Enter — пропустить`,touchSkip:`ПРОПУСТИТЬ`,touchUse:`РУКИ`,siteAt:{camp:`в лагере`,cabin:`у охотничьей избушки`,tower:`у старой вышки`,stones:`у каменного круга`,wreck:`у разбитой машины`},parts:{fuel:`канистра бензина`,plug:`свеча зажигания`,fuses:`предохранители`,belt:`приводной ремень`,battery:`аккумулятор`},actions:{fuel:`залить бензин`,plug:`вкрутить свечу`,fuses:`поменять предохранители`,belt:`натянуть ремень`,battery:`подключить аккумулятор`},noteKicker:`записка`,noteClose:`E / тап — убрать`,notes:[`Свет вырубился разом, генератор заглох. Бензин в канистре — залей и дёрни шнур. Второй генератор — {next}, иди на писк рации. И тише. ОНИ слышат.`,`Свечу я выкрутил, держи. Третий — {next}. Там ходит высокий, без лица. Пока на него падает свет — он не двигается. Не давай ему темноты.`,`Предохранители в кармане. Искрят — будет громко. Четвёртый — {next}. Услышишь глубокий вдох — замри. Оно видит своим воем: кто шевелится, того и берёт.`,`Ремень снял с машины. Последний генератор — {next}. Камень уводит их в сторону: брось подальше — и иди.`,`Аккумулятор ещё держит. Подключи — генератор долго раскручивается и ревёт на весь лес. Продержись. Я не смог.`],taskCamp:`генератор в лагере заглох — найди, чем его заправить`,taskFollow:`иди на писк рации — генератор {site}`,taskFindNext:`найди следующий генератор`,taskRepair:`почини генератор {site}`,taskSpin:`генератор раскручивается — продержись`,useSearch:`E · обыскать`,useHold:`удерживай E · {action}`,useCord:`E · дёрнуть шнур {n}/{m}`,useNeed:`нужно: {part}`,useSpin:`раскручивается…`,useSearchT:`РУКИ · обыскать`,useHoldT:`держи РУКИ · {action}`,useCordT:`РУКИ · дёрнуть шнур {n}/{m}`,aHeard:`ОНО УСЛЫШАЛО`,aHunt:`ОХОТА`,aEscaped:`ОТОРВАЛСЯ`,aClose:`ВПРИТЫК`,aShard:`ОСКОЛОК`,aDontScream:`НЕ КРИЧИ`,aWake:`ЛЕС ПРОСЫПАЕТСЯ`,aExhausted:`ты задыхаешься — это слышно`,aNoStones:`нет камней`,aMicLost:`микрофон отключён`,aFound:`НАЙДЕНО`,aGenOn:`ГЕНЕРАТОР {n}/5`,aSpinUp:`РАСКРУЧИВАЕТСЯ… ДЕРЖИСЬ`,aWatcherArrive:`в темноте появилось что-то новое`,aHowlerArrive:`что-то огромное проснулось`,aAwake:`ЛЕС ПРОСНУЛСЯ`,hintWatcher:`НАБЛЮДАТЕЛЬ — двигается только в темноте. держи его на свету`,hintHowler:`глубокий вдох… ЗАМРИ`,hintHowlerSpot:`оно увидело движение — уйди с этого места и снова замри`,deadTitle:`ТЕБЯ НАШЛИ`,deadScream:`ТЫ ЗАКРИЧАЛ`,deadCrawler:`ОНО ПОЛЗЛО К ТЕБЕ`,deadWatcher:`ОНО ПОДОШЛО В ТЕМНОТЕ`,deadHowler:`ОНО УВИДЕЛО ДВИЖЕНИЕ`,winTitle:`СВЕТ`,winKicker:`генераторы 5/5`,winSub:`пять генераторов гудят. тьма отступает. лес отпускает тебя.`,gensGot:`генераторы`,survived:`продержался`,shardsGot:`осколки`,closeCalls:`впритык`,escapes:`отрывы`,loudest:`громче всего`,newRecord:`НОВЫЙ РЕКОРД`,restartHint:`R / Enter / тап — заново`,noScores:`пока пусто. стань первым.`,rank:`#`,name:`имя`,time:`время`,sVolume:`Громкость`,sMouse:`Чувствительность мыши`,sInvert:`Инверсия Y`,sMic:`Микрофон`,sMicSens:`Чувствительность микрофона`,sEcho:`Эхо голоса`,sRadar:`Радар (подсказка)`,sScares:`Скримеры`,sScaresFull:`полные`,sScaresReduced:`мягкие (без вспышек)`,sQuality:`Графика`,sQAuto:`авто`,sQHigh:`высокая`,sQLow:`низкая`,sLang:`Язык`,on:`вкл`,off:`выкл`,howtoBody:`
<p><b>Утро. Лагерь, гудит генератор, поют птицы.</b> А потом свет гаснет разом — и ты в огромном тёмном лесу, где ничего не видно. Любой звук — эхолокатор: волна расходится от тебя и на секунды проявляет деревья, камни… и <span class="red">их</span>.</p>
<p><b>Цель — запустить пять генераторов.</b> У каждого лежит тело того, кто пытался раньше: обыщи его (удерживай E) — там деталь и записка, где искать следующий. Генератор, о котором ты знаешь, пищит рацией — иди на звук. Починка шумит: стук, искры, рёв мотора при запуске. Запустил — уходи. Вокруг работающего генератора горит лампа: в её свете видно тварей.</p>
<p><b>Микрофон:</b> щёлкни языком, хлопни, скажи «эй». Громче звук — дальше видно. Но <span class="red">они слышат так же далеко</span>. Крик (кольцо вокруг точки стало красным) — мгновенная охота. <b>Без микрофона:</b> ПРОБЕЛ / ЛКМ — щелчок, удерживай — громче.</p>
<p><b>Слушатели и Ползуны</b> идут туда, где был звук. Пискнул — уходи. Камень (ПКМ / F) уводит их в сторону. Позже приходят двое других, по одному на лес: <b>Наблюдатель</b> глух, но двигается, только пока на него не падает свет, — свети на него; лампы он обходит. <b>Ревун</b> почти не слышит, но иногда набирает воздух и воет: всё, что движется в этой волне, он видит. Услышал вдох — замри.</p>
<p><b>Интерфейса почти нет.</b> Кольцо вокруг точки — твоя громкость. Tab — время, генераторы и текущая задача. Полоска сверху заполняется с каждым генератором. Через 30 минут лес просыпается окончательно.</p>
<p><b>Очки:</b> время × множитель опасности, найденные тела, генераторы, осколки, проходы впритык, отрывы. За победу — бонус, и тем больше, чем быстрее.</p>
<p><b>С друзьями:</b> «С ДРУЗЬЯМИ» → «СОЗДАТЬ» и отправь ссылку (или код) — до 4 игроков в одном лесу. Голоса слышно с той стороны, где стоит друг, и тише издалека; <span class="red">монстры слышат их так же</span>. Эхо друзей тоже освещает лес. Погибший смотрит глазами живых, и живые его не слышат.</p>
<table class="keys">
<tr><td>WASD · стрелки</td><td>движение и поворот</td></tr>
<tr><td>Мышь</td><td>обзор (клик — захват курсора)</td></tr>
<tr><td>ПРОБЕЛ / ЛКМ</td><td>эхо: тап — щелчок, удерживай — громко</td></tr>
<tr><td>E (удерживать)</td><td>обыскать тело · чинить генератор</td></tr>
<tr><td>ПКМ / F</td><td>бросить камень</td></tr>
<tr><td>Shift / C</td><td>бег / красться</td></tr>
<tr><td>Tab</td><td>время, генераторы, задача</td></tr>
<tr><td>Enter</td><td>пропустить утро</td></tr>
<tr><td>M · Esc / P</td><td>микрофон · пауза</td></tr>
</table>`,touchPing:`ЭХО`,touchStone:`КАМЕНЬ`,clickToLook:`кликни, чтобы управлять взглядом`,dragToLook:`зажми ЛКМ и тяни, чтобы смотреть`,touchCrouch:`ТИХО`,deathBy:{listener:`Слушатель`,crawler:`Ползун`,watcher:`Наблюдатель`,howler:`Ревун`},coopBtn:`С ДРУЗЬЯМИ`,coopBtnRoom:`КОМНАТА {code}`,coopTitle:`С ДРУЗЬЯМИ`,coopCreate:`СОЗДАТЬ`,coopOr:`или войди по коду / ссылке друга`,coopJoin:`ВОЙТИ`,coopNote:`до 4 игроков · голос по близости: друзей слышно оттуда, где они стоят, — и монстрам тоже · лучше с микрофоном и в наушниках · без регистрации и серверов`,coopRoom:`КОМНАТА`,coopCopy:`скопировать ссылку`,coopCopied:`скопировано`,coopStart:`НАЧАТЬ`,coopLeave:`ВЫЙТИ ИЗ КОМНАТЫ`,coopYou:`ты`,coopHost:`хост`,coopFree:`свободно`,coopJoining:`подключаемся…`,coopWaitFriends:`ждём друзей — отправь им ссылку или код`,coopReadyHost:`все на месте? жми НАЧАТЬ`,coopSearching:`ищем комнату…`,coopNoHost:`хоста не видно. проверь код — или хост вышел`,coopWaitHost:`ждём, пока хост начнёт`,coopInRun:`идёт ночь — ты попадёшь в следующую`,coopFull:`в комнате уже 4 игрока`,coopVersion:`у вас разные версии игры — обновите страницу`,coopHostLeft:`хост вышел из комнаты`,coopError:`не удалось подключиться. проверь интернет`,coopBadCode:`код — 5 символов, например K7Q2M`,coopRelays:`связь`,coopNoRelays:`нет связи с ретрансляторами — проверь интернет или VPN`,coopMicOn:`микрофон включён — друзья тебя слышат`,coopMicOff:`микрофон выключен — друзья тебя не услышат`,coopMicAsk:`включить`,coopTag:`ко-оп {n}`,defaultName:`Путник`,toLobby:`В ЛОББИ`,pauseCoop:`игра не на паузе: ты стоишь в лесу`,mateDied:`{name} погиб`,mateLeft:`{name} отключился`,mateFound:`{name}: {part}`,mateStarted:`{name} запустил генератор`,spectating:`ты мёртв · глазами: <b>{name}</b>`,spectNext:`ПРОБЕЛ / клик — следующий`,spectNextTouch:`тап — следующий`,spectAllDead:`ты мёртв`,teamAlive:`в живых {n} из {m}`,teamWonDead:`ты погиб, но команда выбралась`,teamAllDead:`никто не дожил до утра`,hostLostTitle:`СВЯЗЬ ПОТЕРЯНА`,hostLostSub:`хост вышел из игры`,coopRestartHint:`хост может начать заново`,teamHead:`КОМАНДА`,meters:`м`,ms:`мс`,stAlive:`жив`,stDead:`мёртв`},en:{title:`HUSH`,tagline:`You are blind. The forest is not.`,subtitle:`an echolocation horror · start five generators`,play:`PLAY`,scores:`HIGH SCORES`,settings:`SETTINGS`,howto:`HOW TO PLAY`,back:`BACK`,resume:`RESUME`,restart:`RESTART`,menu:`MAIN MENU`,paused:`PAUSED`,callsign:`Callsign`,headphones:`Wear headphones. Sound is your eyes.`,loading:`growing the forest…`,micOn:`MIC: ON`,micOff:`MIC: OFF`,micAsk:`Allow microphone`,micDenied:`Microphone unavailable — play with keys (SPACE / ECHO button).`,micIframe:`The browser blocks the mic inside embedded frames.`,micOpenTab:`Open in a new tab`,micTest:`test your mic: say “hey”`,score:`SCORE`,best:`best`,generators:`generators`,stones:`stones`,stamina:`breath`,intro1:`you cannot see anything`,intro2:`make a sound`,introHintMic:`clap, click your tongue or say “hey” — or hold SPACE`,introHintKeys:`tap SPACE for a click, hold for louder`,introHintTouch:`tap ECHO for a click, hold for louder`,itHears:`it can hear you`,tutMove:`move away quietly — WASD · Shift run (loud) · C sneak`,tutMoveTouch:`move away quietly — left stick · push fully to run (loud)`,tutStone:`RMB / F — throw a stone to distract them`,tutStoneTouch:`STONE — throw it to distract them`,tutUse:`there is a body by the generator — walk up and hold E · Tab — what to do next`,tutUseTouch:`there is a body by the generator — walk up, a HANDS button appears · tap the top — task`,tutScream:`and whatever happens — do not scream`,morningBig:`morning`,morningSmall:`camp at the old clearing`,morningHint:`look around · WASD to walk, mouse to look`,morningHintTouch:`look around · left stick to walk, right side of the screen to look`,morningGen:`the generator chugs. birds. all is well.`,campLeash:`don't wander far from camp`,skipHint:`Enter — skip`,touchSkip:`SKIP`,touchUse:`HANDS`,siteAt:{camp:`at the camp`,cabin:`by the hunting cabin`,tower:`by the old tower`,stones:`by the stone circle`,wreck:`by the wrecked truck`},parts:{fuel:`a can of fuel`,plug:`a spark plug`,fuses:`fuses`,belt:`a drive belt`,battery:`a battery`},actions:{fuel:`pour the fuel`,plug:`fit the spark plug`,fuses:`replace the fuses`,belt:`fit the belt`,battery:`connect the battery`},noteKicker:`note`,noteClose:`E / tap — put away`,notes:[`The lights died all at once and the generator stalled. Fuel's in the can — pour it in, pull the cord. The second generator is {next}, follow the radio beeps. And be quiet. THEY hear.`,`I took the spark plug out — it's yours. The third one is {next}. Something tall walks there, no face. While light is on it, it can't move. Don't give it the dark.`,`Fuses are in my pocket. They spark — it will be loud. The fourth is {next}. If you hear a deep breath in — freeze. It sees with its howl: whatever moves, it takes.`,`Pulled the belt off the truck. The last generator is {next}. A stone pulls them away: throw it far, then walk.`,`The battery still holds. Hook it up — it takes forever to spin up and roars the whole forest awake. Hold on. I couldn't.`],taskCamp:`the camp generator stalled — find something to fuel it`,taskFollow:`follow the radio beeps — generator {site}`,taskFindNext:`find the next generator`,taskRepair:`repair the generator {site}`,taskSpin:`the generator is spinning up — hold on`,useSearch:`E · search`,useHold:`hold E · {action}`,useCord:`E · pull the cord {n}/{m}`,useNeed:`need: {part}`,useSpin:`spinning up…`,useSearchT:`HANDS · search`,useHoldT:`hold HANDS · {action}`,useCordT:`HANDS · pull the cord {n}/{m}`,aHeard:`IT HEARD THAT`,aHunt:`HUNTED`,aEscaped:`ESCAPED`,aClose:`CLOSE CALL`,aShard:`SHARD`,aDontScream:`DON'T SCREAM`,aWake:`THE FOREST STIRS`,aExhausted:`you are gasping — they can hear it`,aNoStones:`no stones`,aMicLost:`microphone disconnected`,aFound:`FOUND`,aGenOn:`GENERATOR {n}/5`,aSpinUp:`SPINNING UP… HOLD ON`,aWatcherArrive:`something new is out in the dark`,aHowlerArrive:`something huge has woken up`,aAwake:`THE FOREST IS AWAKE`,hintWatcher:`THE WATCHER — moves only in the dark. keep it lit`,hintHowler:`a deep breath… FREEZE`,hintHowlerSpot:`it saw you move — get off this spot, then freeze again`,deadTitle:`IT FOUND YOU`,deadScream:`YOU SCREAMED`,deadCrawler:`IT CRAWLED TO YOU`,deadWatcher:`IT CAME CLOSER IN THE DARK`,deadHowler:`IT SAW YOU MOVE`,winTitle:`LIGHT`,winKicker:`generators 5/5`,winSub:`five generators hum. the dark backs off. the forest lets you go.`,gensGot:`generators`,survived:`survived`,shardsGot:`shards`,closeCalls:`close calls`,escapes:`escapes`,loudest:`loudest`,newRecord:`NEW HIGH SCORE`,restartHint:`R / Enter / tap — restart`,noScores:`empty. be the first.`,rank:`#`,name:`name`,time:`time`,sVolume:`Volume`,sMouse:`Mouse sensitivity`,sInvert:`Invert Y`,sMic:`Microphone`,sMicSens:`Mic sensitivity`,sEcho:`Voice echo`,sRadar:`Radar (assist)`,sScares:`Jumpscares`,sScaresFull:`full`,sScaresReduced:`gentle (no flashes)`,sQuality:`Graphics`,sQAuto:`auto`,sQHigh:`high`,sQLow:`low`,sLang:`Language`,on:`on`,off:`off`,howtoBody:`
<p><b>Morning. A camp, a humming generator, birdsong.</b> Then the light dies all at once — and you are in a vast dark forest where you cannot see. Every sound is sonar: a wave spreads out from you and for a few seconds reveals trees, rocks… and <span class="red">them</span>.</p>
<p><b>The goal: start five generators.</b> By each one lies the body of someone who tried before you: search it (hold E) for the part and a note about where the next one is. A generator you know about beeps on its radio — follow the sound. Repairs are noisy: clanks, sparks, the engine roaring to life. Got it running? Leave. A running generator lights a lamp, and in its light you can see them.</p>
<p><b>Microphone:</b> click your tongue, clap, say “hey”. Louder sound — you see further. But <span class="red">they hear just as far</span>. A scream (the ring around the dot turns red) means an instant hunt. <b>No mic:</b> SPACE / LMB — a click, hold for louder.</p>
<p><b>Listeners and Crawlers</b> walk to where the sound was. Made a noise? Move. A stone (RMB / F) lures them away. Later two others arrive, one of each per forest: <b>the Watcher</b> is deaf but moves only while no light is on it — keep it lit; it won't enter a lamp. <b>The Howler</b> barely hears, but now and then it fills its chest and howls: whatever moves inside that wave, it sees. Hear the breath — freeze.</p>
<p><b>There is almost no interface.</b> The ring around the dot is your loudness. Tab shows time, generators and the current task. The hairline at the top fills with each generator. After 30 minutes the forest wakes up for good.</p>
<p><b>Score:</b> time × danger multiplier, bodies found, generators, shards, close calls, escapes. Winning gives a bonus — bigger the faster you are.</p>
<p><b>With friends:</b> WITH FRIENDS → CREATE and send the link (or code) — up to 4 players in one forest. Voices come from where your friends stand and fade with distance; <span class="red">the monsters hear them just as well</span>. Their echoes light the forest too. The dead watch through the eyes of the living — and the living can't hear them.</p>
<table class="keys">
<tr><td>WASD · arrows</td><td>move &amp; turn</td></tr>
<tr><td>Mouse</td><td>look (click to lock cursor)</td></tr>
<tr><td>SPACE / LMB</td><td>echo: tap = click, hold = loud</td></tr>
<tr><td>E (hold)</td><td>search a body · repair a generator</td></tr>
<tr><td>RMB / F</td><td>throw stone</td></tr>
<tr><td>Shift / C</td><td>run / sneak</td></tr>
<tr><td>Tab</td><td>time, generators, task</td></tr>
<tr><td>Enter</td><td>skip the morning</td></tr>
<tr><td>M · Esc / P</td><td>mic · pause</td></tr>
</table>`,touchPing:`ECHO`,touchStone:`STONE`,clickToLook:`click to control the camera`,dragToLook:`hold LMB and drag to look around`,touchCrouch:`SNEAK`,deathBy:{listener:`Listener`,crawler:`Crawler`,watcher:`Watcher`,howler:`Howler`},coopBtn:`WITH FRIENDS`,coopBtnRoom:`ROOM {code}`,coopTitle:`WITH FRIENDS`,coopCreate:`CREATE`,coopOr:`or join with a friend's code / link`,coopJoin:`JOIN`,coopNote:`up to 4 players · proximity voice: you hear friends from where they stand — and so do the monsters · mic and headphones recommended · no sign-up, no servers`,coopRoom:`ROOM`,coopCopy:`copy link`,coopCopied:`copied`,coopStart:`START`,coopLeave:`LEAVE ROOM`,coopYou:`you`,coopHost:`host`,coopFree:`empty seat`,coopJoining:`connecting…`,coopWaitFriends:`waiting for friends — send them the link or code`,coopReadyHost:`everyone here? press START`,coopSearching:`looking for the room…`,coopNoHost:`can't see the host. check the code — or the host left`,coopWaitHost:`waiting for the host to start`,coopInRun:`a night is under way — you'll join the next one`,coopFull:`the room already has 4 players`,coopVersion:`you have different game versions — reload the page`,coopHostLeft:`the host left the room`,coopError:`could not connect. check your internet`,coopBadCode:`the code is 5 characters, like K7Q2M`,coopRelays:`link`,coopNoRelays:`no relay connection — check your internet or VPN`,coopMicOn:`mic on — your friends can hear you`,coopMicOff:`mic off — your friends won't hear you`,coopMicAsk:`turn on`,coopTag:`co-op {n}`,defaultName:`Wanderer`,toLobby:`LOBBY`,pauseCoop:`the game isn't paused: you're standing in the forest`,mateDied:`{name} is dead`,mateLeft:`{name} disconnected`,mateFound:`{name}: {part}`,mateStarted:`{name} started a generator`,spectating:`you're dead · watching: <b>{name}</b>`,spectNext:`SPACE / click — next`,spectNextTouch:`tap — next`,spectAllDead:`you're dead`,teamAlive:`{n} of {m} alive`,teamWonDead:`you died, but your team made it`,teamAllDead:`nobody lived to see the morning`,hostLostTitle:`CONNECTION LOST`,hostLostSub:`the host left the game`,coopRestartHint:`the host can start again`,teamHead:`TEAM`,meters:`m`,ms:`ms`,stAlive:`alive`,stDead:`dead`}},Hl=`ru`;function Ul(e){Hl=Vl[e]?e:`ru`,document.documentElement.lang=Hl}function Wl(){return Hl}function K(e){let t=Vl[Hl][e];return t===void 0?Vl.ru[e]??e:t}function Gl(e){let t=e>>>0;return function(){t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var Kl=class{constructor(e=Date.now()){this.next=Gl(e)}float(e=0,t=1){return e+(t-e)*this.next()}int(e,t){return Math.floor(this.float(e,t+1))}pick(e){return e[Math.floor(this.next()*e.length)]}chance(e){return this.next()<e}sign(){return this.next()<.5?-1:1}},ql=.5*(Math.sqrt(3)-1),Jl=(3-Math.sqrt(3))/6,Yl=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]],Xl=class{constructor(e=1){let t=Gl(e),n=new Uint8Array(256);for(let e=0;e<256;e++)n[e]=e;for(let e=255;e>0;e--){let r=Math.floor(t()*(e+1)),i=n[e];n[e]=n[r],n[r]=i}this.perm=new Uint8Array(512);for(let e=0;e<512;e++)this.perm[e]=n[e&255]}noise(e,t){let n=this.perm,r=(e+t)*ql,i=Math.floor(e+r),a=Math.floor(t+r),o=(i+a)*Jl,s=e-(i-o),c=t-(a-o),l=+(s>c),u=s>c?0:1,d=s-l+Jl,f=c-u+Jl,p=s-1+2*Jl,m=c-1+2*Jl,h=i&255,g=a&255,_=0,v=0,y=0,b=.5-s*s-c*c;if(b>0){let e=Yl[n[h+n[g]]&7];b*=b,_=b*b*(e[0]*s+e[1]*c)}let x=.5-d*d-f*f;if(x>0){let e=Yl[n[h+l+n[g+u]]&7];x*=x,v=x*x*(e[0]*d+e[1]*f)}let S=.5-p*p-m*m;if(S>0){let e=Yl[n[h+1+n[g+1]]&7];S*=S,y=S*S*(e[0]*p+e[1]*m)}return 70*(_+v+y)}fbm(e,t,n=4,r=2,i=.5){let a=1,o=1,s=0,c=0;for(let l=0;l<n;l++)s+=a*this.noise(e*o,t*o),c+=a,a*=i,o*=r;return s/c}},q=(e,t,n)=>e<t?t:e>n?n:e,Zl=(e,t,n)=>e+(t-e)*n,Ql=(e,t,n)=>{let r=q((n-e)/(t-e),0,1);return r*r*(3-2*r)},$l=(e,t,n,r)=>Zl(e,t,1-Math.exp(-n*r));function eu(e,t){let n=t-e;for(;n>Math.PI;)n-=Math.PI*2;for(;n<-Math.PI;)n+=Math.PI*2;return n}var J={GROUND:0,BARK:1,LEAF:2,ROCK:3,WOOD:4,METAL:5,EFFIGY:6,FLESH:7,BONE:8,EYE:9,WATER:10,SHARD:11},tu=new Bt,nu=new bn,ru=new B,iu=new B,au=class{constructor(e=2048){this.pos=new Float32Array(e*9),this.dat=new Uint8Array(e*12),this.count=0,this.m=new un,this.e=this.m.elements,this.flip=!1,this.kind=0}reset(){return this.count=0,this.identity(),this}_ensure(e){let t=(this.count+e)*3;if(t<=this.pos.length)return;let n=this.pos.length;for(;n<t;)n*=2;let r=new Float32Array(n);r.set(this.pos.subarray(0,this.count*3));let i=new Uint8Array(n/3*4);i.set(this.dat.subarray(0,this.count*4)),this.pos=r,this.dat=i}identity(){return this.m.identity(),this.flip=!1,this}place(e,t,n,r=0,i=0,a=0,o=1,s=o,c=o){return nu.set(r,i,a,`YXZ`),tu.setFromEuler(nu),ru.set(e,t,n),iu.set(o,s,c),this.m.compose(ru,tu,iu),this.flip=this.m.determinant()<0,this}setMatrix(e){return this.m.copy(e),this.flip=this.m.determinant()<0,this}_v(e,t,n,r,i,a,o){let s=this.e,c=this.count*3;this.pos[c]=s[0]*e+s[4]*t+s[8]*n+s[12],this.pos[c+1]=s[1]*e+s[5]*t+s[9]*n+s[13],this.pos[c+2]=s[2]*e+s[6]*t+s[10]*n+s[14];let l=this.count*4;this.dat[l]=r,this.dat[l+1]=i,this.dat[l+2]=a,this.dat[l+3]=o,this.count++}tri(e,t,n,r=this.kind,i=0){if(this.flip){let e=t;t=n,n=e,i=i&2|(i&1)<<2|(i&4)>>2}this._ensure(3);let a=i&2?255:0,o=i&4?255:0,s=i&1?255:0;this._v(e[0],e[1],e[2],255,o,s,r),this._v(t[0],t[1],t[2],a,255,s,r),this._v(n[0],n[1],n[2],a,o,255,r)}quad(e,t,n,r,i=this.kind,a=0){this.tri(e,t,n,i,4|(a&1?1:0)|(a&2?2:0)),this.tri(e,n,r,i,1|(a&4?2:0)|(a&8?4:0))}quadN(e,t,n,r,i,a=this.kind){let o=t[0]-e[0],s=t[1]-e[1],c=t[2]-e[2],l=n[0]-e[0],u=n[1]-e[1],d=n[2]-e[2],f=s*d-c*u,p=c*l-o*d,m=o*u-s*l;f*i[0]+p*i[1]+m*i[2]<0?this.quad(e,r,n,t,a):this.quad(e,t,n,r,a)}triN(e,t,n,r,i=this.kind,a=0){let o=t[0]-e[0],s=t[1]-e[1],c=t[2]-e[2],l=n[0]-e[0],u=n[1]-e[1],d=n[2]-e[2],f=s*d-c*u,p=c*l-o*d,m=o*u-s*l;if(f*r[0]+p*r[1]+m*r[2]<0){let r=a&2|(a&1)<<2|(a&4)>>2;this.tri(e,n,t,i,r)}else this.tri(e,t,n,i,a)}cylinder(e,t,n,r,i=this.kind,a={}){let o=a.y0||0,s=a.phase||0,c=a.capTop!==!1&&n>.001,l=!!a.capBottom,u=a.ringEdges!==!1,d=o+r;for(let r=0;r<e;r++){let a=s+r/e*Math.PI*2,f=s+(r+1)/e*Math.PI*2,p=Math.cos(a),m=Math.sin(a),h=Math.cos(f),g=Math.sin(f),_=[p*t,o,m*t],v=[h*t,o,g*t],y=[p*n,d,m*n],b=[h*n,d,g*n];this.quad(v,_,y,b,i,u?0:5),c&&this.tri([0,d,0],b,y,i,5),l&&this.tri([0,o,0],_,v,i,5)}}cone(e,t,n,r=this.kind,i={}){let a=i.y0||0,o=i.phase||0,s=[i.ax||0,a+n,i.az||0],c=i.hideRibs?6:0;for(let n=0;n<e;n++){let l=o+n/e*Math.PI*2,u=o+(n+1)/e*Math.PI*2,d=[Math.cos(l)*t,a,Math.sin(l)*t],f=[Math.cos(u)*t,a,Math.sin(u)*t];this.tri(f,d,s,r,c),i.capBottom!==!1&&this.tri([0,a,0],d,f,r,5)}}box(e,t,n,r=this.kind,i={}){let a=-e/2,o=e/2,s=i.bottom?0:-t/2,c=i.bottom?t:t/2,l=-n/2,u=n/2,d=[[a,s,l],[o,s,l],[o,c,l],[a,c,l],[a,s,u],[o,s,u],[o,c,u],[a,c,u]],f=i.skip||``;f.includes(`z-`)||this.quadN(d[0],d[1],d[2],d[3],[0,0,-1],r),f.includes(`z+`)||this.quadN(d[4],d[5],d[6],d[7],[0,0,1],r),f.includes(`x-`)||this.quadN(d[0],d[3],d[7],d[4],[-1,0,0],r),f.includes(`x+`)||this.quadN(d[1],d[2],d[6],d[5],[1,0,0],r),f.includes(`y+`)||this.quadN(d[3],d[2],d[6],d[7],[0,1,0],r),f.includes(`y-`)||this.quadN(d[0],d[1],d[5],d[4],[0,-1,0],r)}taper(e,t,n,r,i,a=this.kind,o=0,s=0){let c=[[-e/2,0,-t/2],[e/2,0,-t/2],[e/2,0,t/2],[-e/2,0,t/2],[-n/2+s,i,-r/2+o],[n/2+s,i,-r/2+o],[n/2+s,i,r/2+o],[-n/2+s,i,r/2+o]];this.quadN(c[0],c[1],c[5],c[4],[0,0,-1],a),this.quadN(c[1],c[2],c[6],c[5],[1,0,0],a),this.quadN(c[2],c[3],c[7],c[6],[0,0,1],a),this.quadN(c[3],c[0],c[4],c[7],[-1,0,0],a),this.quadN(c[4],c[5],c[6],c[7],[0,1,0],a),this.quadN(c[0],c[1],c[2],c[3],[0,-1,0],a)}rock(e,t,n=this.kind,r=.28,i=.7){let a=(1+Math.sqrt(5))/2,o=[[-1,a,0],[1,a,0],[-1,-a,0],[1,-a,0],[0,-1,a],[0,1,a],[0,-1,-a],[0,1,-a],[a,0,-1],[a,0,1],[-a,0,-1],[-a,0,1]].map(n=>{let a=Math.hypot(n[0],n[1],n[2]),o=e*(1-r/2+t()*r)/a;return[n[0]*o,n[1]*o*i,n[2]*o]});for(let e of[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]){let t=o[e[0]],r=o[e[1]],i=o[e[2]],a=[(t[0]+r[0]+i[0])/3,(t[1]+r[1]+i[1])/3,(t[2]+r[2]+i[2])/3];this.triN(t,r,i,a,n)}}octa(e,t,n=this.kind){let r=[0,t,0],i=[0,-t,0],a=[[e,0,0],[0,0,e],[-e,0,0],[0,0,-e]];for(let e=0;e<4;e++){let o=a[e],s=a[(e+1)%4];this.triN(o,s,r,[o[0]+s[0],t,o[2]+s[2]],n),this.triN(o,s,i,[o[0]+s[0],-t,o[2]+s[2]],n)}}limb(e,t,n,r,i=this.kind,a=4){let o=t[0]-e[0],s=t[1]-e[1],c=t[2]-e[2],l=Math.hypot(o,s,c)||1e-4,u=this.m.clone(),d=this.flip,f=new B(o/l,s/l,c/l),p=new Bt().setFromUnitVectors(new B(0,1,0),f),m=new un().compose(new B(e[0],e[1],e[2]),p,new B(1,1,1));this.m.multiply(m),this.cylinder(a,n,r,l,i,{capTop:!0,capBottom:!0,phase:Math.PI/a}),this.m.copy(u),this.flip=d}toGeometry(){let e=new Vr;return e.setAttribute(`position`,new Er(this.pos.slice(0,this.count*3),3)),e.setAttribute(`data`,new Er(this.dat.slice(0,this.count*4),4,!0)),e.computeBoundingSphere(),e.computeBoundingBox(),e}toArrays(){return{pos:this.pos.slice(0,this.count*3),dat:this.dat.slice(0,this.count*4),count:this.count}}},ou=class{constructor(e){this.noise=new Xl(e),this.half=W.WORLD_HALF,this.cell=W.TERRAIN_CELL,this.n=Math.round(2*this.half/this.cell),this.H=new Float32Array((this.n+1)*(this.n+1)),this.flats=[],this.basins=[]}rawHeight(e,t){let n=this.noise,r=n.fbm(e/120,t/120,3)*7.5+n.noise(e/40+11.3,t/40-7.1)*2.4+n.noise(e/13.7,t/13.7)*.5,i=Math.max(Math.abs(e),Math.abs(t)),a=Ql(this.half-55,this.half,i);return r+=a*a*30+a*n.noise(e/9,t/9)*3,r}addFlat(e,t,n){this.flats.push({x:e,z:t,r:n,h:this.rawHeight(e,t)})}addBasin(e,t,n,r){this.basins.push({x:e,z:t,r:n,depth:r})}shapedHeight(e,t){let n=this.rawHeight(e,t);for(let r of this.flats){let i=Math.hypot(e-r.x,t-r.z);i<r.r&&(n=Zl(n,r.h,1-Ql(r.r*.55,r.r,i)))}for(let r of this.basins){let i=Math.hypot(e-r.x,t-r.z);i<r.r*1.4&&(n-=r.depth*(1-Ql(r.r*.6,r.r*1.4,i)))}return n}finalize(){let e=this.n,t=this.cell,n=this.half;for(let r=0;r<=e;r++)for(let i=0;i<=e;i++)this.H[r*(e+1)+i]=this.shapedHeight(-n+i*t,-n+r*t)}h(e,t){let n=this.n;return e=e<0?0:e>n?n:e,t=t<0?0:t>n?n:t,this.H[t*(n+1)+e]}height(e,t){let n=this.cell,r=(e+this.half)/n,i=(t+this.half)/n,a=Math.floor(r),o=Math.floor(i);a<0&&(a=0),o<0&&(o=0),a>this.n-1&&(a=this.n-1),o>this.n-1&&(o=this.n-1);let s=Math.min(Math.max(r-a,0),1),c=Math.min(Math.max(i-o,0),1),l=this.h(a,o),u=this.h(a+1,o),d=this.h(a,o+1),f=this.h(a+1,o+1);return c>s?l+(f-d)*s+(d-l)*c:l+(u-l)*s+(f-u)*c}build(e,t,n,r,i){let a=this.cell,o=this.half,s=Math.max(0,Math.floor((t+o)/a)),c=Math.min(this.n,Math.floor((r+o)/a)),l=Math.max(0,Math.floor((n+o)/a)),u=Math.min(this.n,Math.floor((i+o)/a));e.identity();for(let t=l;t<u;t++)for(let n=s;n<c;n++){let r=-o+n*a,i=r+a,s=-o+t*a,c=s+a,l=[r,this.h(n,t),s],u=[i,this.h(n+1,t),s],d=[r,this.h(n,t+1),c],f=[i,this.h(n+1,t+1),c];e.tri(l,d,f,J.GROUND,4),e.tri(l,f,u,J.GROUND,1)}}},su=class e{constructor(e,t=8){this.half=e,this.cell=t,this.n=Math.ceil(2*e/t),this.cells=Array(this.n*this.n);for(let e=0;e<this.cells.length;e++)this.cells[e]=[];this.caps=[],this.stamp=new Uint32Array(1024),this.qid=1,this._out=[]}_ci(e){let t=Math.floor((e+this.half)/this.cell);return t<0?0:t>=this.n?this.n-1:t}add(e,t,n,r,i,a=6,o=0){let s=this.caps.length;if(this.caps.push({ax:e,az:t,bx:n,bz:r,r:i,h:a,kind:o}),this.stamp.length<=s){let e=new Uint32Array(this.stamp.length*2);e.set(this.stamp),this.stamp=e}let c=this._ci(Math.min(e,n)-i),l=this._ci(Math.max(e,n)+i),u=this._ci(Math.min(t,r)-i),d=this._ci(Math.max(t,r)+i);for(let e=u;e<=d;e++)for(let t=c;t<=l;t++)this.cells[e*this.n+t].push(s);return s}circle(e,t,n,r=6,i=0){return this.add(e,t,e,t,n,r,i)}query(e,t,n){let r=this._out;r.length=0;let i=++this.qid,a=this._ci(e-n),o=this._ci(e+n),s=this._ci(t-n),c=this._ci(t+n);for(let e=s;e<=c;e++)for(let t=a;t<=o;t++){let n=this.cells[e*this.n+t];for(let e=0;e<n.length;e++){let t=n[e];this.stamp[t]!==i&&(this.stamp[t]=i,r.push(t))}}return r}static closest(e,t,n,r){let i=e.bx-e.ax,a=e.bz-e.az,o=i*i+a*a,s=0;o>1e-8&&(s=((t-e.ax)*i+(n-e.az)*a)/o,s=s<0?0:s>1?1:s);let c=e.ax+i*s,l=e.az+a*s,u=t-c,d=n-l,f=Math.sqrt(u*u+d*d);return r.d=f-e.r,r.nx=f>1e-6?u/f:1,r.nz=f>1e-6?d/f:0,r}resolve(t,n,r=1/0){let i={d:0,nx:0,nz:0},a={hit:!1,nx:0,nz:0,depth:0,kind:-1,idx:-1};for(let o=0;o<3;o++){let o=this.query(t.x,t.z,n+2),s=!1;for(let c=0;c<o.length;c++){let l=this.caps[o[c]];if(l.h<r&&r!==1/0)continue;e.closest(l,t.x,t.z,i);let u=n-i.d;u>0&&(t.x+=i.nx*u,t.z+=i.nz*u,s=!0,u>a.depth&&(a.hit=!0,a.depth=u,a.nx=i.nx,a.nz=i.nz,a.kind=l.kind,a.idx=o[c]))}if(!s)break}return a}free(t,n,r){let i={d:0,nx:0,nz:0},a=this.query(t,n,r+2);for(let o=0;o<a.length;o++)if(e.closest(this.caps[a[o]],t,n,i),i.d<r)return!1;return!0}},cu={TREE:0,ROCK:1,WOOD:2,METAL:3,WATER:4,EFFIGY:5},lu=[{id:`camp`,x:0,z:0,r:11},{id:`cabin`,x:58,z:-74,r:15,ry:.5},{id:`tower`,x:-114,z:40,r:12,ry:.3},{id:`stones`,x:98,z:108,r:17},{id:`wreck`,x:-50,z:-118,r:12,ry:1.1},{id:`lake`,x:152,z:-30,r:31},{id:`graves`,x:-152,z:-60,r:16,ry:-.2},{id:`cabin2`,x:-40,z:170,r:13,ry:2.2},{id:`stones2`,x:205,z:175,r:14},{id:`tower2`,x:190,z:-190,r:11,ry:1},{id:`graves2`,x:-210,z:120,r:14,ry:.7},{id:`wreck2`,x:30,z:-230,r:11,ry:.2}],uu=new un,du=new un,fu=new Bt,pu=new bn,mu=new B,hu=new B;function gu(e,t,n,r){return pu.set(0,r,0,`YXZ`),fu.setFromEuler(pu),new un().compose(new B(e,t,n),fu.clone(),new B(1,1,1))}function Y(e,t,n,r,i,a=0,o=0,s=0,c=1,l=c,u=c){pu.set(a,o,s,`YXZ`),fu.setFromEuler(pu),mu.set(n,r,i),hu.set(c,l,u),du.compose(mu,fu,hu),uu.multiplyMatrices(t,du),e.setMatrix(uu)}function _u(e,t,n){let r=Math.cos(n),i=Math.sin(n);return[e*r+t*i,-e*i+t*r]}var vu=class{constructor(e,t){this.scene=e,this.material=t,this.seed=W.WORLD_SEED,this.half=W.WORLD_HALF,this.terrain=new ou(this.seed),this.col=new su(this.half,8),this.meshes=[],this.props=[],this.lake=null,this.spawn={x:0,z:0,yaw:0},this.effigies=[]}generate(){let e=performance.now(),t=new Kl(this.seed),n=this.terrain;for(let e of lu)e.id===`lake`?(n.addFlat(e.x,e.z,e.r+8),n.addBasin(e.x,e.z,e.r*.95,3.6)):n.addFlat(e.x,e.z,e.r*1.25);n.finalize();for(let e of lu){let n=e.id.replace(/\d+$/,``),r=this[`lm_`+n];r&&r.call(this,e,t)}return this.genSites(),this.genTrees(t),this.genScatter(t),this.buildChunks(),this.genTime=performance.now()-e,this}addProp(e,t,n){this.props.push({x:e,z:t,build:n})}inLandmark(e,t,n=0){for(let r of lu){let i=e-r.x,a=t-r.z;if(i*i+a*a<(r.r+n)*(r.r+n))return r}return null}genTrees(e){let t=5.4,n=this.half-4,r=this.terrain.noise,i=0;for(let a=-n;a<n;a+=t)for(let o=-n;o<n;o+=t){let t=o+e.float(-2.1,2.1),n=a+e.float(-2.1,2.1);if(this.inLandmark(t,n,1))continue;let s=.12+.82*Ql(-.45,.3,r.noise(t/70+40,n/70-20)*.7+r.noise(t/23,n/23)*.3);if(!e.chance(s))continue;let c=this.terrain.height(t,n),l=e.next(),u=e.float(.8,1.3);l<.66?this.pine(t,c,n,u,e):l<.84?this.deadTree(t,c,n,u,e):l<.95?this.birch(t,c,n,u,e):this.stump(t,c,n,e),i++}this.treeCount=i}pine(e,t,n,r,i){let a=i.float(0,6.283),o=i.float(-.05,.05),s=i.float(-.05,.05),c=i.float(1.8,3),l=i.chance(.4)?4:3,u=i.float(1.7,2.3),d=i.float(0,6);this.addProp(e,n,f=>{f.place(e,t-.3,n,o,a,s,r,r*i.float(.95,1.05),r),f.cylinder(5,.27,.12,c+l*1.5,J.BARK,{capTop:!1});let p=c,m=u;for(let e=0;e<l;e++){let t=2.7-e*.28;f.cone(7,m,t,J.LEAF,{y0:p,phase:d+e}),p+=t*.56,m*=.73}}),this.col.circle(e,n,.3*r,10*r,cu.TREE)}deadTree(e,t,n,r,i){let a=i.float(0,6.283),o=i.float(-.12,.12),s=i.float(5,8.5),c=[],l=i.int(2,5);for(let e=0;e<l;e++){let e=s*i.float(.35,.85),t=i.float(0,6.283),n=i.float(1,2.6)*(1.2-e/s),r=i.float(.2,.9);c.push([e,t,n,r])}return this.addProp(e,n,i=>{i.place(e,t-.3,n,o,a,o*.5,r),i.cylinder(5,.33,.06,s,J.BARK,{capTop:!0});for(let[e,t,n,r]of c){let a=.3*(1-e/s)+.05,o=Math.cos(t)*n,c=Math.sin(t)*n;i.limb([Math.cos(t)*a*.5,e,Math.sin(t)*a*.5],[o,e+n*r,c],.09,.02,J.BARK),n>1.6&&i.limb([o*.6,e+n*r*.6,c*.6],[o*.8-c*.3,e+n*r+.7,c*.8+o*.3],.04,.01,J.BARK)}}),this.col.circle(e,n,.32*r,8*r,cu.TREE),{x:e,z:n,h:s*r}}birch(e,t,n,r,i){let a=i.float(0,6.283),o=i.float(3.5,5),s=i.next()*1e6|0;this.addProp(e,n,c=>{let l=new Kl(s);c.place(e,t-.3,n,i.float(-.06,.06),a,0,r),c.cylinder(5,.2,.12,o+1,J.BARK,{capTop:!1}),c.place(e,t-.3+(o+1.2)*r,n,0,a,0,r),c.rock(1.9,()=>l.next(),J.LEAF,.4,.85),c.place(e+.6*r,t-.3+(o+.2)*r,n+.4*r,0,a+1,0,r*.7),c.rock(1.6,()=>l.next(),J.LEAF,.4,.8)}),this.col.circle(e,n,.24*r,7*r,cu.TREE)}stump(e,t,n,r){let i=r.float(.35,.55);this.addProp(e,n,a=>{a.place(e,t-.2,n,0,r.float(0,6),0,1),a.cylinder(6,i,i*.85,r.float(.4,.8),J.BARK,{capTop:!0})}),this.col.circle(e,n,i,.7,cu.TREE)}genScatter(e){let t=this.half-10;for(let n=0;n<900;n++){let n=e.float(-t,t),r=e.float(-t,t);if(this.inLandmark(n,r,2)||!this.col.free(n,r,1.5))continue;let i=e.chance(.15)?e.float(1.4,2.6):e.float(.4,1),a=this.terrain.height(n,r),o=e.next()*1e9|0,s=e.float(0,6.28);this.addProp(n,r,e=>{let t=new Kl(o);e.place(n,a+i*.15,r,0,s,0,1),e.rock(i,()=>t.next(),J.ROCK,.35,.62)}),this.col.circle(n,r,i*.85,i*1.2,cu.ROCK)}for(let n=0;n<260;n++){let n=e.float(-t,t),r=e.float(-t,t);if(this.inLandmark(n,r,3))continue;let i=e.float(0,6.28),a=e.float(3,7),o=n+Math.cos(i)*a,s=r+Math.sin(i)*a;if(!this.col.free(n,r,1)||!this.col.free(o,s,1)||!this.col.free((n+o)/2,(r+s)/2,1))continue;let c=this.terrain.height(n,r)+.25,l=this.terrain.height(o,s)+.25,u=e.float(.25,.4);this.addProp(n,r,e=>{e.identity(),e.limb([n,c,r],[o,l,s],u,u*.8,J.BARK,6),e.limb([n+(o-n)*.4,c+(l-c)*.4+u*.5,r+(s-r)*.4],[n+(o-n)*.4+Math.sin(i)*1.1,c+1,r+(s-r)*.4-Math.cos(i)*1.1],.07,.02,J.BARK)}),this.col.add(n,r,o,s,u+.05,.8,cu.WOOD)}let n=[[6,16],[-14,9],[11,-15],[-7,-21],[26,4]];for(let r=0;r<70;r++){let r=e.float(0,6.28),i=e.float(40,t);n.push([Math.cos(r)*i,Math.sin(r)*i])}for(let[t,r]of n)!this.inLandmark(t,r,.5)&&this.col.free(t,r,.8)&&this.effigy(t,r,e)}effigy(e,t,n){let r=this.terrain.height(e,t),i=n.float(0,6.28),a=n.chance(.5),o=n.float(-.25,.25);this.effigies.push({x:e,z:t}),this.addProp(e,t,n=>{let s=gu(e,r,t,i),c=a?1.6:0;Y(n,s,0,0,0,0,0,o),a?(n.limb([0,c+1.7,0],[0,4.6,0],.012,.012,J.EFFIGY),n.limb([0,4.6,-.4],[0,4.6,.6],.04,.04,J.EFFIGY)):n.limb([0,0,0],[0,2.4,0],.05,.04,J.EFFIGY);let l=c+1.7;n.limb([0,c+.6,0],[0,l,0],.035,.03,J.EFFIGY),n.limb([-.55,l-.25,0],[.55,l-.3,0],.03,.03,J.EFFIGY),n.limb([0,c+.65,0],[-.25,c,.05],.03,.02,J.EFFIGY),n.limb([0,c+.65,0],[.22,c,-.05],.03,.02,J.EFFIGY),Y(n,s,0,l+.12,0,.3,0,o),n.octa(.14,.16,J.EFFIGY)}),this.col.circle(e,t,.12,2,cu.EFFIGY)}lm_camp(e,t){let n=this.terrain.height(e.x,e.z);this.spawn={x:e.x+.4,z:e.z+2.5,yaw:Math.PI};let r=new Kl(77),i=()=>r.next();this.addProp(e.x,e.z,t=>{let r=gu(e.x,n,e.z,0);for(let e=0;e<9;e++){let n=e/9*Math.PI*2;Y(t,r,Math.cos(n)*.95,.05,Math.sin(n)*.95,0,n,0,1),t.rock(.24,i,J.ROCK,.3,.7)}for(let e=0;e<5;e++){let n=e/5*Math.PI*2+.3;Y(t,r,0,0,0),t.limb([Math.cos(n)*.7,.05,Math.sin(n)*.7],[Math.cos(n+2)*.1,.9,Math.sin(n+2)*.1],.06,.03,J.WOOD)}Y(t,r,0,0,0),t.limb([-3.4,.3,-1.8],[-2.1,.3,-3.4],.24,.22,J.BARK,6),t.limb([3,.3,-2.6],[3.6,.3,-.6],.22,.22,J.BARK,6),Y(t,r,-4.2,0,2.6,0,.4,0);let a=1.1,o=1.2,s=1.2,c=[-1.1,0,-1.2],l=[a,0,-1.2],u=[0,s,-1.2+.3],d=[-1.1,0,o],f=[a,0,o],p=[0,s*.7,o];t.quadN(c,d,p,u,[-1,.6,0],J.WOOD),t.quadN(l,u,p,f,[1,.6,0],J.WOOD),t.quadN(c,u,p,d,[1,-.6,0],J.WOOD),t.quadN(l,f,p,u,[-1,-.6,0],J.WOOD),t.triN(c,l,u,[0,0,-1],J.WOOD),Y(t,r,2.1,.3,2.4,.2,.7,0),t.box(.45,.6,.3,J.WOOD)}),this.col.circle(e.x,e.z,1.05,.5,cu.ROCK),this.col.add(e.x-3.4,e.z-1.8,e.x-2.1,e.z-3.4,.26,.6,cu.WOOD),this.col.add(e.x+3,e.z-2.6,e.x+3.6,e.z-.6,.24,.6,cu.WOOD);let[a,o]=[e.x-4.2,e.z+2.6];this.col.add(a-.5,o-1.1,a+.5,o+1.1,1,1.2,cu.WOOD)}lm_cabin(e,t){let n=this.terrain.height(e.x,e.z),r=e.ry||0,i=5.5,a=2.7,o=.2;this.addProp(e.x,e.z,s=>{let c=gu(e.x,n,e.z,r);Y(s,c,0,.1,0),s.box(7.4,.2,5.9,J.WOOD),Y(s,c,0,a/2,-5.5/2),s.box(7,a,o,J.WOOD),Y(s,c,-7/2,a/2,0),s.box(o,a,i,J.WOOD),Y(s,c,7/2,a/2,0),s.box(o,a,i,J.WOOD),Y(s,c,-3/2,a/2,i/2),s.box(4,a,o,J.WOOD),Y(s,c,5.4/2,a/2,i/2),s.box(1.6,a,o,J.WOOD),Y(s,c,1.2,2.4000000000000004,i/2),s.box(1.4,.6,o,J.WOOD),Y(s,c,1.9,a*.42,3.35,0,-1.1,0),s.box(1.3,a*.82,.08,J.WOOD);let l=.5,u=4.2,d=[[-7/2-l,2.5500000000000003,3.25],[4,2.5500000000000003,3.25],[4,u,0],[-7/2-l,u,0],[-7/2-l,2.5500000000000003,-5.5/2-l],[4,2.5500000000000003,-5.5/2-l]];Y(s,c,0,0,0),s.quadN(d[0],d[1],d[2],d[3],[0,1,1],J.WOOD),s.quadN(d[0],d[1],d[2],d[3],[0,-1,-1],J.WOOD),s.quadN(d[4],d[5],d[2],d[3],[0,1,-1],J.WOOD),s.quadN(d[4],d[5],d[2],d[3],[0,-1,1],J.WOOD);for(let e of[-1,1]){let t=[[e*7/2,a,i/2],[e*7/2,a,-5.5/2],[e*7/2,4.1000000000000005,0]];s.triN(t[0],t[1],t[2],[e,0,0],J.WOOD)}Y(s,c,-2.2,3.9000000000000004,-1.2),s.box(.6,2.6,.6,J.ROCK),Y(s,c,-1.6,.2,-1.4),s.box(1.5,.8,.9,J.WOOD,{bottom:!0}),Y(s,c,-.6,.2,-.6,0,.4,.5),s.box(.5,.9,.5,J.WOOD,{bottom:!0}),Y(s,c,2.3,.2,-1.6),s.box(1,.5,2,J.WOOD,{bottom:!0});for(let e=0;e<7;e++)Y(s,c,-7/2-2+e*1.9,0,5.95,t.float(-.2,.2),0,t.float(-.2,.2)),s.cylinder(4,.07,.06,t.float(.8,1.2),J.WOOD,{capTop:!0})});let s=(t,n,i,s)=>{let[c,l]=_u(t,n,r),[u,d]=_u(i,s,r);this.col.add(e.x+c,e.z+l,e.x+u,e.z+d,o,a,cu.WOOD)};s(-7/2,-5.5/2,7/2,-5.5/2),s(-7/2,-5.5/2,-7/2,i/2),s(7/2,-5.5/2,7/2,i/2),s(-7/2,i/2,.5,i/2),s(1.9,i/2,7/2,i/2),s(-2.3,-1.4,-.9,-1.4),s(2.3,-2.4,2.3,-.8)}lm_tower(e,t){let n=this.terrain.height(e.x,e.z),r=e.ry||0,i=2.6;this.addProp(e.x,e.z,t=>{let a=gu(e.x,n,e.z,r);Y(t,a,0,0,0);let o=(e,t,n)=>[e*(i+-2.05*n),30*n-.2,t*(i+-2.05*n)],s=[[-1,-1],[1,-1],[1,1],[-1,1]];for(let[e,n]of s)t.limb(o(e,n,0),o(e,n,1),.13,.07,J.METAL);for(let e=1;e<=8;e++){let n=(e-1)/8,r=e/8;for(let i=0;i<4;i++){let[a,c]=s[i],[l,u]=s[(i+1)%4];t.limb(o(a,c,r),o(l,u,r),.04,.04,J.METAL,3),t.limb(o(a,c,n),o(l,u,r),.03,.03,J.METAL,3),e%2==0&&t.limb(o(l,u,n),o(a,c,r),.03,.03,J.METAL,3)}}Y(t,a,0,30,0),t.box(1.8,.15,1.8,J.METAL),Y(t,a,0,30,0),t.limb([0,0,0],[0,6,0],.06,.02,J.METAL),Y(t,a,.7,31.5,0,0,0,-1.2),t.cone(8,.6,.3,J.METAL),Y(t,a,-.6,32.5,.3,1.1,.4,0),t.cone(8,.5,.25,J.METAL),Y(t,a,5.2,0,2.5,0,.1,0),t.box(2.4,2.2,2,J.METAL,{bottom:!0}),Y(t,a,5.2,2.25,2.5,.08,.1,0),t.box(2.8,.1,2.4,J.METAL);for(let e=0;e<3;e++)Y(t,a,2.6+e*.75,0,4.4+e%2*.3,0,0,e===2?1.5:0),t.cylinder(7,.3,.3,.9,J.METAL,{capTop:!0,y0:e===2?-.3:0})});for(let[t,n]of[[-1,-1],[1,-1],[1,1],[-1,1]]){let[a,o]=_u(t*i,n*i,r);this.col.circle(e.x+a,e.z+o,.25,30,cu.METAL)}let[a,o]=_u(5.2,2.5,r);this.col.circle(e.x+a,e.z+o,1.45,2.2,cu.METAL);let[s,c]=_u(3.3,4.5,r);this.col.add(e.x+s-.8,e.z+c,e.x+s+.8,e.z+c,.4,.9,cu.METAL)}lm_stones(e,t){let n=this.terrain.height(e.x,e.z),r=e.r>15?9:7,i=e.r*.5,a=[];for(let e=0;e<r;e++){let n=e/r*Math.PI*2+t.float(-.1,.1),i=t.chance(.18);a.push({a:n,h:t.float(2.2,3.4),fallen:i,tilt:t.float(-.12,.12)})}this.addProp(e.x,e.z,t=>{let r=gu(e.x,n,e.z,0);for(let e of a){let n=Math.cos(e.a)*i,a=Math.sin(e.a)*i;e.fallen?(Y(t,r,n,.35,a,Math.PI/2-.1,-e.a+Math.PI/2,0),t.taper(1.1,.7,.8,.5,e.h,J.ROCK)):(Y(t,r,n,-.2,a,e.tilt,-e.a+Math.PI/2,e.tilt*.5),t.taper(1.15,.7,.75,.45,e.h,J.ROCK))}Y(t,r,0,0,0,0,.3,0),t.box(2.4,.85,1.3,J.ROCK,{bottom:!0}),Y(t,r,0,.9,0,0,.3,0),t.octa(.25,.32,J.EFFIGY)});for(let t of a){let n=e.x+Math.cos(t.a)*i,r=e.z+Math.sin(t.a)*i;this.col.circle(n,r,.75,t.fallen?.8:t.h,cu.ROCK)}this.col.add(e.x-1.1,e.z-.35,e.x+1.1,e.z+.35,.7,.9,cu.ROCK)}lm_wreck(e,t){let n=this.terrain.height(e.x,e.z),r=e.ry||0;this.addProp(e.x,e.z,i=>{let a=gu(e.x,n,e.z,r),o=a.clone().multiply(new un().makeRotationX(.12)).multiply(new un().makeRotationZ(-.05));Y(i,o,0,.78,0),i.box(4.4,.75,1.85,J.METAL),Y(i,o,-.25,1.15,0),i.taper(2.5,1.75,1.6,1.45,.72,J.METAL,0,.2);for(let[e,t,n]of[[-1.4,-.95,!1],[1.4,-.95,!1],[-1.4,.95,!0],[1.4,.95,!1]])n||(Y(i,o,e,.38,t,Math.PI/2,0,0),i.cylinder(8,.38,.38,.24,J.METAL,{capTop:!0,capBottom:!0,y0:-.12}));Y(i,o,.3,.95,1.35,0,.9,0),i.box(1.1,.9,.07,J.METAL),Y(i,a,3.4,.12,1.8,0,0,0),i.cylinder(8,.4,.4,.25,J.METAL,{capTop:!0}),Y(i,a,-3.2,0,-2.2,0,0,.3),i.cylinder(7,.3,.3,.9,J.METAL,{capTop:!0});for(let e=-3;e<=3;e++)e!==0&&(Y(i,a,e*4.2,0,-3.6,t.float(-.25,.25),0,t.float(-.2,.2)),i.box(.14,1.1,.14,J.WOOD,{bottom:!0}))});let[i,a]=_u(-1.9,0,r),[o,s]=_u(1.9,0,r);this.col.add(e.x+i,e.z+a,e.x+o,e.z+s,.95,1.6,cu.METAL);let[c,l]=_u(3.4,1.8,r);this.col.circle(e.x+c,e.z+l,.4,.3,cu.METAL);let[u,d]=_u(-3.2,-2.2,r);this.col.circle(e.x+u,e.z+d,.35,.9,cu.METAL)}lm_lake(e,t){let n=this.terrain.flats.find(t=>t.x===e.x&&t.z===e.z),r=(n?n.h:this.terrain.height(e.x,e.z))-.85;this.lake={x:e.x,z:e.z,r:e.r-3.5,y:r},this.addProp(e.x,e.z,t=>{t.identity();let n=e.r-1;for(let i=0;i<5;i++){let a=i/5*n,o=(i+1)/5*n;for(let n=0;n<40;n++){let s=n/40*Math.PI*2,c=(n+1)/40*Math.PI*2,l=[e.x+Math.cos(s)*a,r,e.z+Math.sin(s)*a],u=[e.x+Math.cos(c)*a,r,e.z+Math.sin(c)*a],d=[e.x+Math.cos(s)*o,r,e.z+Math.sin(s)*o],f=[e.x+Math.cos(c)*o,r,e.z+Math.sin(c)*o];i===0?t.triN(l,d,f,[0,1,0],J.WATER,5):(t.triN(l,d,f,[0,1,0],J.WATER,5),t.triN(l,f,u,[0,1,0],J.WATER,3))}}let i=e.x-e.r-3,a=e.x-e.r+9;for(let n=i;n<a;n+=.55)t.place(n,r+.45,e.z,0,0,Math.sin(n*7)*.05,1),t.box(.45,.08,2,J.WOOD);for(let n=i+1;n<a;n+=2.4)for(let i of[-.9,.9])t.place(n,r-1.2,e.z+i,0,0,0,1),t.cylinder(5,.09,.09,1.9,J.WOOD,{capTop:!0});t.place(e.x+6,r-.15,e.z+8,.25,.8,.1,1),t.taper(.6,2.6,1.2,3,.6,J.WOOD)}),this.col.circle(e.x,e.z,e.r-3.5,0,cu.WATER)}lm_graves(e,t){let n=this.terrain.height(e.x,e.z),r=e.ry||0,i=[];for(let e=0;e<3;e++)for(let n=0;n<5;n++)t.chance(.2)||i.push({lx:-6+n*3+t.float(-.4,.4),lz:-4+e*3.5+t.float(-.3,.3),cross:t.chance(.55),tx:t.float(-.25,.25),tz:t.float(-.2,.2)});let a=[],o=7.5,s=[[-10,-7.5],[10,-7.5],[10,o],[-10,o]];for(let e=0;e<4;e++){let[n,r]=s[e],[i,o]=s[(e+1)%4],c=Math.hypot(i-n,o-r),l=Math.floor(c/2.2);for(let s=0;s<=l;s++){let c=s/l;e===2&&c>.4&&c<.6||a.push({lx:n+(i-n)*c,lz:r+(o-r)*c,rail:s<l&&t.chance(.7)&&!(e===2&&c>=.3&&c<.6),nx:n+(i-n)*((s+1)/l),nz:r+(o-r)*((s+1)/l),tilt:t.float(-.2,.2)})}}this.addProp(e.x,e.z,t=>{let o=gu(e.x,n,e.z,r);for(let e of i)e.cross?(Y(t,o,e.lx,-.1,e.lz,e.tx,0,e.tz),t.box(.13,1.5,.13,J.WOOD,{bottom:!0}),Y(t,o,e.lx,1,e.lz,e.tx,0,e.tz),t.box(.8,.12,.12,J.WOOD)):(Y(t,o,e.lx,-.1,e.lz,e.tx,0,e.tz),t.taper(.75,.22,.6,.18,1,J.ROCK));for(let e of a)Y(t,o,e.lx,0,e.lz,e.tilt,0,e.tilt*.5),t.box(.12,1.2,.12,J.WOOD,{bottom:!0}),e.rail&&(Y(t,o,0,0,0),t.limb([e.lx,.9,e.lz],[e.nx,.85,e.nz],.04,.04,J.WOOD,3),t.limb([e.lx,.45,e.lz],[e.nx,.5,e.nz],.04,.04,J.WOOD,3))});for(let t of i){let[n,i]=_u(t.lx,t.lz,r);this.col.circle(e.x+n,e.z+i,t.cross?.18:.38,1.2,t.cross?cu.WOOD:cu.ROCK)}for(let t of a){let[n,i]=_u(t.lx,t.lz,r);if(t.rail){let[a,o]=_u(t.nx,t.nz,r);this.col.add(e.x+n,e.z+i,e.x+a,e.z+o,.12,1.2,cu.WOOD)}else this.col.circle(e.x+n,e.z+i,.12,1.2,cu.WOOD)}let[c,l]=_u(0,.5,r),u=this.terrain.height(e.x+c,e.z+l);this.deadTree(e.x+c,u,e.z+l,1.5,t),this.effigy(e.x+c+1.3,e.z+l+.5,t)}genSites(){let e=new Kl(4242);this.sites=[];let t=[`camp`,...W.GEN_SITES];for(let n of t){let t=lu.find(e=>e.id===n),r,i,a,o;if(n===`camp`)r=t.x-3.8,i=t.z+7.4,a=t.x-1.5,o=t.z+5.3;else{let n=this._freeSpot(t.x,t.z,4,t.r-2.5,2.1,e);r=n.x,i=n.z;let s=this._freeSpot(r,i,2.8,4.6,1,e,t);a=s.x,o=s.z}let s=Math.atan2(t.x-r,t.z-i)+(n===`camp`?0:e.float(-.5,.5)),c=this.terrain.height(r,i),[l,u]=_u(.78,-.32,s),[d,f]=_u(1.2,-.32,s),p={id:n,x:r,z:i,y:c,yaw:s,lamp:{x:r+d,y:c+3,z:i+f},corpse:{x:a,z:o,yaw:Math.atan2(r-a,i-o)+e.float(-.6,.6),seed:e.int(1,1e6)}};this.sites.push(p),this.genProp(p);let[m,h]=_u(-.5,0,s),[g,_]=_u(.5,0,s);this.col.add(r+m,i+h,r+g,i+_,.48,1.2,cu.METAL),this.col.circle(r+l,i+u,.1,3.2,cu.METAL)}}_freeSpot(e,t,n,r,i,a,o=null){let s=a.float(0,Math.PI*2);for(let a=n;a<=r;a+=.6)for(let n=0;n<20;n++){let r=s+n/20*Math.PI*2,c=e+Math.cos(r)*a,l=t+Math.sin(r)*a;if(!(o&&Math.hypot(c-o.x,l-o.z)>o.r-1)&&this.col.free(c,l,i))return{x:c,z:l}}return{x:e+n,z:t}}genProp(e){this.addProp(e.x,e.z,t=>{let n=gu(e.x,e.y,e.z,e.yaw),r=J.METAL;Y(t,n,0,0,0);for(let e of[-.3,.3])t.limb([-.68,.06,e],[.68,.06,e],.045,.045,r,4);Y(t,n,0,.12,0),t.box(1.12,.6,.6,r,{bottom:!0}),Y(t,n,.05,.72,0),t.box(.86,.24,.48,r,{bottom:!0}),Y(t,n,.3,.96,.05),t.cylinder(6,.06,.06,.06,r),Y(t,n,.3,.42,.31,Math.PI/2,0,0),t.cylinder(8,.2,.2,.08,r),Y(t,n,-.33,.46,.31),t.box(.34,.26,.04,J.WOOD),Y(t,n,0,0,0);for(let[e,n]of[[-.62,-.34],[.62,-.34],[-.62,.34],[.62,.34]])t.limb([e,.06,n],[e,.98,n],.025,.025,r,4);for(let e of[-.34,.34])t.limb([-.62,.98,e],[.62,.98,e],.025,.025,r,4);t.limb([-.48,.72,-.18],[-.52,1.28,-.22],.045,.04,r,5);let i=.78,a=-.32;t.limb([i,0,a],[i,3.15,a],.05,.035,r,5),t.limb([i,3.12,a],[1.2,3.18,a],.025,.02,r,4),Y(t,n,1.2,2.98,a),t.cone(6,.2,.22,r),Y(t,n,0,0,0),t.limb([.56,.3,-.3],[i,.05,-.27],.015,.015,r,3),t.limb([i,.05,-.27],[i,1.2,-.3],.012,.012,r,3),Y(t,n,-.95,.12,.55,0,.5,0),t.box(.42,.22,.2,J.WOOD)})}buildChunks(){let e=W.CHUNK,t=this.half,n=Math.ceil(2*t/e),r=Array(n*n);for(let e=0;e<r.length;e++)r[e]=[];for(let i of this.props){let a=Math.min(n-1,Math.max(0,Math.floor((i.x+t)/e)));r[Math.min(n-1,Math.max(0,Math.floor((i.z+t)/e)))*n+a].push(i)}let i=new au(6e4),a=0;for(let o=0;o<n;o++)for(let s=0;s<n;s++){i.reset();let c=-t+s*e,l=-t+o*e;this.terrain.build(i,c,l,c+e,l+e);for(let e of r[o*n+s])i.identity(),e.build(i);if(i.count===0)continue;let u=new Ai(i.toGeometry(),this.material);u.matrixAutoUpdate=!1,u.updateMatrix(),this.scene.add(u),this.meshes.push(u),a+=i.count/3}this.tris=a,this.props=null}randomOpenPoint(e,t=20,n=60){let r=W.WORLD_WALL-12;for(let i=0;i<n;i++){let n=e.float(-r,r),i=e.float(-r,r);if(!(Math.hypot(n-this.spawn.x,i-this.spawn.z)<t)&&!(this.lake&&Math.hypot(n-this.lake.x,i-this.lake.z)<this.lake.r+3)&&this.col.free(n,i,1.2))return{x:n,z:i}}return{x:e.float(-50,50),z:e.float(-50,50)}}},yu=W.PULSE.slots,X={uTime:{value:0},uPA:{value:Array.from({length:yu},()=>new an(0,0,0,-1e4))},uPB:{value:Array.from({length:yu},()=>new an(30,0,0,1))},uPC:{value:Array.from({length:yu},()=>new an(1,1,1,0))},uCam:{value:new B},uDawn:{value:0},uMorning:{value:0},uFear:{value:0},uSun:{value:new B(.5,.35,-.8).normalize()},uLamp:{value:Array.from({length:5},()=>new an(0,-100,0,0))},uLampR:{value:W.LAMP_R}},bu=`
#define MAXP ${yu}
uniform float uTime;
uniform vec4 uPA[MAXP];
uniform vec4 uPB[MAXP];
uniform vec4 uPC[MAXP];
uniform vec3 uCam;
uniform float uDawn;
uniform float uMorning;
uniform float uFear;
uniform vec3 uSun;
uniform vec4 uLamp[5];
uniform float uLampR;

// steady warm light pooled under the work lamps of running generators
vec3 lampLight(vec3 P, vec3 Nrm) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec4 Lm = uLamp[i];
    if (Lm.w <= 0.001) continue;
    vec3 dv = Lm.xyz - P;
    float d = length(dv);
    if (d > uLampR * 1.5) continue;
    float fall = 1.0 - smoothstep(uLampR * 0.12, uLampR * 1.5, d);
    float facing = dot(Nrm, Nrm) > 0.5 ? 0.35 + 0.65 * abs(dot(Nrm, dv / max(d, 0.001))) : 1.0;
    acc += vec3(1.0, 0.72, 0.4) * Lm.w * fall * fall * facing;
  }
  return acc;
}

// accumulate sonar light at point P (N = facing normal, may be zero for points)
vec3 sonarLight(vec3 P, vec3 Nrm, out float ringOut) {
  vec3 acc = vec3(0.0);
  float ringSum = 0.0;
  for (int i = 0; i < MAXP; i++) {
    vec4 B = uPB[i];
    if (B.z <= 0.001) continue;
    vec4 A = uPA[i];
    float age = uTime - A.w;
    if (age < 0.0) continue;
    vec3 dv = P - A.xyz;
    float d = length(dv);
    if (d > B.y) continue;
    float r = age * B.x;
    float front = r - d;
    if (front < -1.8) continue;
    // steep falloff: the far edge of a ping is only a rumour of shapes
    float fall = 1.0 - smoothstep(B.y * 0.28, B.y, d);
    // light: a quick flash that sinks fast, then a long dim afterimage
    float since = max(front, 0.0) / B.x;
    float lit = front > 0.0 ? 0.6 * exp(-since * B.w * 2.0) + 0.4 * exp(-since * B.w * 0.55) : 0.0;
    float ring = exp(-front * front * 1.15) * (1.0 - smoothstep(B.y - 4.0, B.y + 0.5, r));
    float facing = abs(dot(Nrm, dv / max(d, 0.001)));
    float s = B.z * fall;
    acc += uPC[i].rgb * s * (lit * (0.3 + 0.7 * facing) + ring * 1.45);
    ringSum += ring * s;
  }
  ringOut = ringSum;
  return acc;
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
`,xu=`
float edgeFactor(vec3 b, float w) {
  vec3 d = fwidth(b);
  vec3 a = smoothstep(d * max(w - 0.6, 0.0), d * (w + 0.6), b);
  return 1.0 - min(min(a.x, a.y), a.z);
}
`,Su=`
attribute vec4 data;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vBary = data.xyz;
  vKind = floor(data.w * 255.0 + 0.5);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,Cu=`
${bu}
${xu}
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;

// cold, ashen palette: the forest is grey bone and frost, only flesh is red
const vec3 KC[12] = vec3[12](
  vec3(0.27, 0.31, 0.33),  // ground
  vec3(0.60, 0.66, 0.68),  // bark
  vec3(0.44, 0.55, 0.54),  // leaf
  vec3(0.54, 0.59, 0.65),  // rock
  vec3(0.76, 0.68, 0.60),  // wood
  vec3(0.70, 0.76, 0.82),  // metal
  vec3(0.92, 0.32, 0.26),  // effigy
  vec3(1.00, 0.14, 0.09),  // flesh
  vec3(0.90, 0.84, 0.78),  // bone
  vec3(1.00, 1.00, 1.00),  // eye
  vec3(0.34, 0.46, 0.54),  // water
  vec3(1.00, 0.70, 0.25)   // shard
);
// daylight palette: what the forest looks like when you can actually see it
const vec3 DC[12] = vec3[12](
  vec3(0.34, 0.38, 0.22),  // ground: moss and needles
  vec3(0.42, 0.33, 0.25),  // bark
  vec3(0.25, 0.42, 0.21),  // leaf
  vec3(0.52, 0.52, 0.49),  // rock
  vec3(0.62, 0.47, 0.32),  // wood
  vec3(0.86, 0.62, 0.18),  // metal: generators are painted safety yellow
  vec3(0.50, 0.38, 0.27),  // effigy: just sticks, in daylight
  vec3(0.78, 0.24, 0.20),  // flesh
  vec3(0.86, 0.80, 0.72),  // bone
  vec3(1.00, 1.00, 1.00),  // eye
  vec3(0.36, 0.52, 0.62),  // water
  vec3(1.00, 0.70, 0.25)   // shard
);

void main() {
  vec3 Nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  if (dot(Nrm, toCam) < 0.0) Nrm = -Nrm;
  int k = int(vKind);
  vec3 base = KC[k];

  float ring;
  vec3 L = sonarLight(vWorld, Nrm, ring);
  vec3 lamp = lampLight(vWorld, Nrm);
  L += lamp;

  float edge = edgeFactor(vBary, k == 0 ? 0.75 : 1.0);
  float distEdge = 1.0 - smoothstep(14.0, 90.0, camD) * 0.82;
  float grazing = smoothstep(0.02, 0.25, abs(dot(Nrm, toCam / camD)));
  edge *= distEdge * mix(0.3, 1.0, grazing);
  // scanned, not drawn: lines break into grainy dashes
  float dash = hash13(floor(vWorld * 9.0));
  edge *= 0.4 + 0.6 * smoothstep(0.12, 0.62, dash);
  if (k == 0) edge *= 0.6; // the ground grid stays a whisper

  // point-cloud faces: mostly black with sparse specks (averaged out in the distance)
  float st = hash13(floor(vWorld * 16.0));
  float speck = mix(smoothstep(0.80, 0.97, st), 0.11, smoothstep(9.0, 38.0, camD));
  float face = (k == 0 ? 0.03 : 0.045) + speck * (k == 0 ? 0.2 : 0.3);
  if (k == 10) {
    face = 0.1 + 0.08 * sin(vWorld.x * 1.7 + uTime * 1.3) * sin(vWorld.z * 1.3 - uTime * 0.9);
  }
  float edgeGain = (k == 5 ? 1.75 : 1.4);

  vec3 col = base * L * (face + edge * edgeGain);
  col += base * lamp * (0.17 + 0.12 * st); // a lamp fills surfaces, not just their edges
  col += vec3(0.78, 0.85, 0.9) * ring * edge * 0.42;
  // rare sparkles on the wavefront
  float sp = step(0.993, hash13(floor(vWorld * 11.0) + floor(uTime * 14.0)));
  col += base * sp * ring * 1.1;

  // the dark eats distance
  col *= exp(-camD * 0.015);

  // fear: when something is hunting you the forest bleeds
  if (uFear > 0.001) {
    float lum = dot(col, vec3(0.35, 0.5, 0.15));
    col = mix(col, vec3(lum * 1.55, lum * 0.16, lum * 0.12), uFear * 0.65);
  }

  // daylight (the morning, or the dawn you earned): the forest becomes visible
  if (uDawn > 0.0) {
    vec3 dbase = DC[k];
    float sunL = max(dot(Nrm, uSun), 0.0);
    float sky = 0.5 + 0.5 * Nrm.y;
    vec3 warm = mix(vec3(1.0, 0.8, 0.62), vec3(1.0, 0.93, 0.82), uMorning);
    vec3 day = dbase * (mix(0.36, 0.5, uMorning) * sky + 1.05 * sunL * warm) * (0.8 + 0.3 * st);
    day += edge * dbase * 0.1;
    vec3 fogC = mix(vec3(0.62, 0.52, 0.5), vec3(0.72, 0.76, 0.78), uMorning);
    float fog = 1.0 - exp(-camD * mix(0.016, 0.011, uMorning));
    day = mix(day, fogC, fog);
    col = mix(col, day + col * 0.3, uDawn);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;function wu(){return new ga({uniforms:{...X},vertexShader:Su,fragmentShader:Cu,extensions:{derivatives:!0}})}var Tu=`
attribute vec4 data;
uniform float uTime;
uniform float uJitter;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
float gh(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float tq = floor(uTime * 16.0);
  float vh = dot(floor(position * 37.0), vec3(1.0, 57.0, 113.0));
  wp.xyz += (vec3(gh(vh + tq), gh(vh + tq + 19.1), gh(vh + tq + 41.7)) - 0.5) * 0.04 * uJitter;
  vWorld = wp.xyz;
  vBary = data.xyz;
  vKind = floor(data.w * 255.0 + 0.5);
  vec4 mv = viewMatrix * wp;
  float band = floor(wp.y * 5.0);
  float tear = step(0.88, gh(band * 7.31 + tq * 1.37));
  mv.x += tear * (gh(band + tq * 0.71) - 0.5) * 0.45 * uJitter;
  gl_Position = projectionMatrix * mv;
}
`,Eu=`
uniform float uTime;
uniform vec3 uCam;
uniform vec3 uColor;
uniform float uAlpha;
uniform float uFlash;
uniform float uFull;
uniform float uBody;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
${xu}
void main() {
  vec3 Nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  float facing = abs(dot(Nrm, toCam / camD));
  float edge = edgeFactor(vBary, 1.1);
  int k = int(vKind);
  vec3 c = uColor;
  if (k == 8) c = mix(uColor, vec3(0.85, 0.74, 0.7), 0.35); // bone reads paler
  // stuttering, not smooth: it flickers like a bad signal
  float fl = 0.72 + 0.28 * step(0.35, fract(sin(floor(uTime * 24.0) * 12.9898 + floor(vWorld.y * 4.0) * 78.233) * 43758.5453));
  float dist = exp(-camD * 0.011);
  vec3 col = c * (edge * 2.3 + 0.05 + 0.2 * facing * facing + uFull * (0.32 + 0.45 * facing));
  float a = clamp(uAlpha * uBody * (1.0 - edge * 0.65), 0.0, 0.93);
  if (k == 9) { col = vec3(3.6, 2.7, 2.3); a = 0.0; } // eyes burn
  col *= uAlpha * fl * dist;
  col += uFlash * c * edge * 2.2 * dist;
  gl_FragColor = vec4(col, a);
}
`;function Du(e){return new ga({uniforms:{uTime:X.uTime,uCam:X.uCam,uColor:{value:new Gn(e)},uAlpha:{value:0},uFlash:{value:0},uFull:{value:0},uBody:{value:.85},uJitter:{value:1}},vertexShader:Tu,fragmentShader:Eu,transparent:!0,blending:5,blendEquation:100,blendSrc:201,blendDst:205,blendSrcAlpha:201,blendDstAlpha:205,depthWrite:!1,extensions:{derivatives:!0}})}var Ou=`
${bu}
attribute vec4 aSeed;
uniform float uBox;
uniform float uPix;
varying vec3 vCol;
void main() {
  vec3 p = aSeed.xyz * vec3(uBox, 12.0, uBox);
  float ph = aSeed.w * 6.2831;
  p += vec3(sin(uTime * 0.11 + ph) * 1.8, sin(uTime * 0.07 + ph * 1.7) * 0.8, cos(uTime * 0.09 + ph * 2.3) * 1.8);
  vec3 halfB = vec3(uBox * 0.5, 6.0, uBox * 0.5);
  vec3 wp = uCam + mod(p - uCam + halfB, vec3(uBox, 12.0, uBox)) - halfB;
  float ring;
  vec3 L = sonarLight(wp, vec3(0.0), ring) + lampLight(wp, vec3(0.0)) * 1.6;
  vCol = (L * 0.3 + ring * vec3(0.7, 0.76, 0.8) * 0.38) * (0.3 + aSeed.w);
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uPix * (1.0 + aSeed.w) / max(-mv.z, 0.5), 1.0, 6.0);
  if (dot(vCol, vCol) < 0.0004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`,ku=`
varying vec3 vCol;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.1, length(c));
  gl_FragColor = vec4(vCol * a, 1.0);
}
`;function Au(e=2600){let t=new Vr,n=new Float32Array(e*4);for(let t=0;t<e*4;t++)n[t]=Math.random();t.setAttribute(`aSeed`,new Er(n,4)),t.setAttribute(`position`,new Er(new Float32Array(e*3),3));let r=new Qi(t,new ga({uniforms:{...X,uBox:{value:46},uPix:{value:9}},vertexShader:Ou,fragmentShader:ku,transparent:!0,blending:2,depthWrite:!1}));return r.frustumCulled=!1,r}function ju(){let e=new Ai(new sa(140,24,12),new ga({uniforms:{uDawn:X.uDawn,uSun:X.uSun,uTime:X.uTime,uMorning:X.uMorning},vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      uniform float uDawn;
      uniform float uMorning;
      uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 top = mix(vec3(0.28, 0.42, 0.7), vec3(0.34, 0.54, 0.86), uMorning);
        vec3 hor = mix(vec3(1.25, 0.72, 0.5), vec3(0.98, 0.9, 0.82), uMorning);
        vec3 c = mix(hor, top, smoothstep(-0.05, 0.55, h));
        float sun = pow(max(dot(vDir, uSun), 0.0), 64.0) * 2.5 + pow(max(dot(vDir, uSun), 0.0), 6.0) * 0.4;
        c += vec3(1.0, 0.75, 0.5) * sun;
        gl_FragColor = vec4(c * uDawn, 1.0);
      }`,side:1,depthWrite:!1}));return e.frustumCulled=!1,e.renderOrder=-10,e}var Mu=`
attribute vec4 data;
attribute float aGlow;
attribute float aPhase;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
varying float vGlow;
varying float vY;
void main() {
  vec3 p = position;
  vKind = floor(data.w * 255.0 + 0.5);
  if (vKind < 11.5) {
    float a = uTime * 1.3 + aPhase;
    float c = cos(a), s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y += sin(uTime * 2.0 + aPhase) * 0.08;
  }
  vY = position.y;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vBary = data.xyz;
  vGlow = aGlow;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,Nu=`
uniform vec3 uCam;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
varying float vGlow;
varying float vY;
${xu}
void main() {
  if (vGlow < 0.003) discard;
  float camD = length(uCam - vWorld);
  vec3 amber = vec3(1.0, 0.66, 0.22);
  vec3 col;
  if (vKind > 11.5) {
    // light beam above the shard
    float f = 1.0 - smoothstep(0.6, 5.0, vY);
    col = amber * 0.5 * f * (0.7 + 0.3 * sin(uTime * 3.0 + vY * 2.0));
  } else {
    float edge = edgeFactor(vBary, 1.3);
    col = amber * (edge * 2.6 + 0.55);
  }
  col *= vGlow * exp(-camD * 0.006);
  gl_FragColor = vec4(col, 1.0);
}
`;function Pu(){return new ga({uniforms:{uTime:X.uTime,uCam:X.uCam},vertexShader:Mu,fragmentShader:Nu,transparent:!0,blending:2,depthWrite:!1,extensions:{derivatives:!0}})}var Fu=class{constructor(){let e=W.PULSE.slots;this.mainSlots=e-W.PULSE.stepSlots,this.slots=[];for(let t=0;t<e;t++)this.slots.push({active:!1,x:0,y:0,z:0,t0:0,speed:30,radius:0,strength:0,decay:1,prevR:0,curR:0,kind:`player`,id:0,color:[1,1,1],life:0});this.stepIdx=0,this.nextId=1}clear(){for(let e=0;e<this.slots.length;e++)this.slots[e].active=!1,X.uPB.value[e].z=0}_write(e){let t=this.slots[e];X.uPA.value[e].set(t.x,t.y,t.z,t.t0),X.uPB.value[e].set(t.speed,t.radius,t.active?t.strength:0,t.decay),X.uPC.value[e].set(t.color[0],t.color[1],t.color[2],0)}emit(e,t,n,r,i){let a=-1,o=-1/0;for(let e=0;e<this.mainSlots;e++){let t=this.slots[e];if(!t.active){a=e;break}let n=r-t.t0-t.life;n>o&&(o=n,a=e)}return this._set(a,e,t,n,r,i)}emitStep(e,t,n,r,i){let a=W.PULSE.stepSlots,o=this.mainSlots+this.stepIdx++%a;return this._set(o,e,t,n,r,i)}_set(e,t,n,r,i,a){let o=this.slots[e];return o.active=!0,o.x=t,o.y=n,o.z=r,o.t0=i,o.speed=a.speed||W.PULSE.speed,o.radius=a.radius,o.strength=a.strength??1,o.decay=a.decay??.55,o.color=a.color||[1,1,1],o.kind=a.kind||`player`,o.prevR=0,o.curR=0,o.id=this.nextId++,o.life=o.radius/o.speed+6.5/o.decay,this._write(e),o}update(e){for(let t=0;t<this.slots.length;t++){let n=this.slots[t];if(!n.active)continue;let r=e-n.t0;n.prevR=n.curR,n.curR=Math.min(r*n.speed,n.radius+.01),r>n.life&&(n.active=!1,X.uPB.value[t].z=0)}}*fronts(){for(let e=0;e<this.mainSlots;e++){let t=this.slots[e];t.active&&t.curR>t.prevR&&t.prevR<=t.radius&&(yield t)}}static lightAt(e,t,n){if(t>e.radius)return 0;let r=(n-e.t0)*e.speed-t;if(r<0)return 0;let i=Math.min(1,Math.max(0,(t-e.radius*.28)/(e.radius*.72))),a=1-i*i*(3-2*i),o=r/e.speed;return e.strength*a*(.6*Math.exp(-o*e.decay*2)+.4*Math.exp(-o*e.decay*.55))}},Iu=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Lu=`
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = max(l - uThreshold, 0.0) / max(l, 1e-4);
  gl_FragColor = vec4(c * k, 1.0);
}
`,Ru=`
uniform sampler2D tSrc;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
  c += texture2D(tSrc, vUv + uDir * 1.384615).rgb * 0.316216;
  c += texture2D(tSrc, vUv - uDir * 1.384615).rgb * 0.316216;
  c += texture2D(tSrc, vUv + uDir * 3.230769).rgb * 0.070270;
  c += texture2D(tSrc, vUv - uDir * 3.230769).rgb * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}
`,zu=`
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uRes;
uniform float uTime;
uniform float uAberr;
uniform float uGrain;
uniform float uDanger;
uniform float uRed;
uniform float uWhite;
uniform float uGlitch;
uniform float uShockR;
uniform float uShockAmp;
uniform float uBloom;
uniform float uFade;
uniform float uWarm;
uniform float uFlicker;
uniform float uAsh;
varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  // something close: the image starts to roll like a dying tape
  if (uDanger > 0.25) {
    float k = (uDanger - 0.25) * 1.33;
    float band = fract(uTime * 0.23);
    float yb = uv.y - band;
    float roll = exp(-yb * yb * 700.0);
    uv.x += roll * k * 0.01 * sin(uv.y * 380.0 + uTime * 40.0);
    uv.x += (hash12(vec2(floor(uv.y * 160.0), floor(uTime * 30.0))) - 0.5) * 0.0025 * k;
  }
  if (uGlitch > 0.001) {
    float line = floor(uv.y * 48.0);
    float g = hash12(vec2(line, floor(uTime * 24.0)));
    if (g < uGlitch * 0.55) uv.x += (hash12(vec2(line * 1.7, floor(uTime * 31.0))) - 0.5) * 0.09 * uGlitch;
    float block = step(1.0 - uGlitch * 0.08, hash12(floor(uv * vec2(12.0, 7.0)) + floor(uTime * 15.0)));
    uv += block * 0.02 * vec2(1.0, 0.0);
  }
  vec2 c = uv - 0.5;
  c.x *= aspect;
  float dist = length(c);
  if (uShockAmp > 0.001) {
    float w = dist - uShockR;
    float ring = exp(-w * w * 260.0) * uShockAmp;
    vec2 dir = c / max(dist, 1e-4);
    uv -= dir * ring * 0.035 * vec2(1.0 / aspect, 1.0);
  }
  vec2 rd = uv - 0.5;
  float ab = uAberr * (0.25 + dot(rd, rd) * 2.5) * 0.022;
  vec3 col;
  col.r = texture2D(tScene, uv + rd * ab).r;
  col.g = texture2D(tScene, uv).g;
  col.b = texture2D(tScene, uv - rd * ab).b;
  vec3 bl = texture2D(tBloom, uv).rgb;
  col += bl * uBloom;

  // tone: filmic shoulder, crushed toe — shadows fall into true black
  // (in daylight the toe and the tunnel let go: the world is open)
  col = 1.0 - exp(-col * (1.4 + 0.35 * uWarm));
  col = max(col - 0.01, 0.0) * 1.01;
  col = pow(col, vec3(1.15 - 0.17 * uWarm));
  // the forest is ash; only blood (and amber) keeps its colour
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float redness = clamp((col.r - col.b) * 2.2 - 0.08, 0.0, 1.0);
  vec3 ash = vec3(lum) * vec3(0.9, 0.98, 1.05);
  col = mix(col, mix(ash, col, redness), uAsh);
  col = mix(col, col * vec3(1.06, 0.98, 0.9), uWarm);

  // tunnel vision: the dark closes in when something is near
  float vig = smoothstep(1.02 - uDanger * 0.32, 0.1, dist);
  col *= mix(1.0, vig, 0.92 * (1.0 - 0.72 * uWarm));
  float beat = 0.6 + 0.4 * sin(uTime * 6.0);
  col += vec3(0.3, 0.0, 0.01) * uDanger * (1.0 - vig) * beat;

  col = mix(col, vec3(0.62, 0.015, 0.01), clamp(uRed, 0.0, 1.0) * 0.5);
  col += vec3(uWhite);

  // grain: the darkness is never empty
  float n = hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 917.0);
  col += (n - 0.5) * uGrain * (0.75 + 0.5 * (1.0 - clamp(lum * 3.0, 0.0, 1.0)));
  col *= 0.965 + 0.035 * sin(gl_FragCoord.y * 3.14159 + uTime * 2.0);
  // slow film breathing + fear flicker
  col *= (0.975 + 0.025 * sin(uTime * 1.7 + sin(uTime * 0.37) * 3.0)) * (1.0 - uFlicker);
  col *= uFade;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`,Bu=class{constructor(e){this.renderer=e;let t={type:T,depthBuffer:!0,minFilter:h,magFilter:h};this.rtScene=new sn(4,4,t);let n={type:T,depthBuffer:!1,minFilter:h,magFilter:h};this.rtA=new sn(4,4,n),this.rtB=new sn(4,4,n),this.cam=new qa(-1,1,1,-1,0,1);let r=new Vr;r.setAttribute(`position`,new Er(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),r.setAttribute(`uv`,new Er(new Float32Array([0,0,2,0,0,2]),2)),this.quad=new Ai(r),this.quad.frustumCulled=!1,this.fsScene=new qn,this.fsScene.add(this.quad),this.bright=new ga({uniforms:{tSrc:{value:null},uTexel:{value:new z},uThreshold:{value:.5}},vertexShader:Iu,fragmentShader:Lu,depthTest:!1,depthWrite:!1}),this.blur=new ga({uniforms:{tSrc:{value:null},uDir:{value:new z}},vertexShader:Iu,fragmentShader:Ru,depthTest:!1,depthWrite:!1}),this.comp=new ga({uniforms:{tScene:{value:this.rtScene.texture},tBloom:{value:this.rtA.texture},uRes:{value:new z(1,1)},uTime:{value:0},uAberr:{value:.15},uGrain:{value:.05},uDanger:{value:0},uRed:{value:0},uWhite:{value:0},uGlitch:{value:0},uShockR:{value:0},uShockAmp:{value:0},uBloom:{value:.8},uFade:{value:1},uWarm:{value:0},uFlicker:{value:0},uAsh:{value:.62}},vertexShader:Iu,fragmentShader:zu,depthTest:!1,depthWrite:!1}),this.u=this.comp.uniforms,this.w=1,this.h=1}setSize(e,t,n){let r=Math.max(2,Math.round(e*n)),i=Math.max(2,Math.round(t*n));if(r===this.w&&i===this.h)return;this.w=r,this.h=i,this.rtScene.setSize(r,i);let a=Math.max(2,r>>2),o=Math.max(2,i>>2);this.rtA.setSize(a,o),this.rtB.setSize(a,o),this.u.uRes.value.set(r,i),this.bloomW=a,this.bloomH=o}_pass(e,t){this.quad.material=e,this.renderer.setRenderTarget(t),this.renderer.render(this.fsScene,this.cam)}render(e,t){let n=this.renderer;n.setRenderTarget(this.rtScene),n.clear(),n.render(e,t),this.bright.uniforms.tSrc.value=this.rtScene.texture,this.bright.uniforms.uTexel.value.set(1/this.w,1/this.h),this._pass(this.bright,this.rtA);for(let e=0;e<2;e++){let t=e===0?1:2;this.blur.uniforms.tSrc.value=this.rtA.texture,this.blur.uniforms.uDir.value.set(t/this.bloomW,0),this._pass(this.blur,this.rtB),this.blur.uniforms.tSrc.value=this.rtB.texture,this.blur.uniforms.uDir.value.set(0,t/this.bloomH),this._pass(this.blur,this.rtA)}this._pass(this.comp,null)}},Vu=class{constructor(e,t=56,n=3200){this.list=[],this.maxVerts=n;for(let r=0;r<t;r++){let t=new Vr,r=new Float32Array(n*3),i=new Uint8Array(n*4),a=new Er(r,3);a.setUsage(et);let o=new Er(i,4,!0);o.setUsage(et),t.setAttribute(`position`,a),t.setAttribute(`data`,o),t.setDrawRange(0,0),t.boundingSphere=new Nr(new B,4.5);let s=new Ai(t,Du(16722464));s.visible=!1,s.matrixAutoUpdate=!1,s.renderOrder=5,e.add(s),this.list.push({mesh:s,geo:t,pos:r,dat:i,pa:a,da:o,born:-1,life:0,strength:0,model:null,sticky:!1,count:0})}}clear(){for(let e of this.list)e.mesh.visible=!1,e.born=-1,e.sticky=!1}_take(e){let t=null,n=-1;for(let r of this.list){if(!r.mesh.visible&&!r.sticky)return r;if(r.sticky)continue;let i=e-r.born;i>n&&(n=i,t=r)}return t||this.list[0]}spawn(e,t,n={}){let r=this._take(t);e.root.updateMatrixWorld(!0);let i=0,a=r.model!==e.key;for(let t of e.parts){let e=t.node.matrixWorld.elements,n=t.arr.pos,o=t.arr.dat,s=t.arr.count;if(i+s>this.maxVerts)break;let c=r.pos;for(let t=0;t<s;t++){let r=n[t*3],a=n[t*3+1],o=n[t*3+2],s=(i+t)*3;c[s]=e[0]*r+e[4]*a+e[8]*o+e[12],c[s+1]=e[1]*r+e[5]*a+e[9]*o+e[13],c[s+2]=e[2]*r+e[6]*a+e[10]*o+e[14]}a&&r.dat.set(o.subarray(0,s*4),i*4),i+=s}r.model=e.key,r.count=i,r.geo.setDrawRange(0,i),r.pa.clearUpdateRanges(),r.pa.addUpdateRange(0,i*3),r.pa.needsUpdate=!0,a&&(r.da.clearUpdateRanges(),r.da.addUpdateRange(0,i*4),r.da.needsUpdate=!0),r.geo.boundingSphere.center.copy(e.root.position),r.geo.boundingSphere.center.y+=1.5,r.born=t,r.life=n.life??2.6,r.strength=n.strength??1,r.decay=n.decay??1.25,r.sticky=!!n.sticky;let o=r.mesh.material.uniforms;return o.uColor.value.set(n.color??16722464),o.uFull.value=n.full??0,o.uBody.value=n.body??.85,o.uJitter.value=n.jitter??1,r.mesh.visible=!0,r}refresh(e,t){t.root.updateMatrixWorld(!0);let n=0;for(let r of t.parts){let t=r.node.matrixWorld.elements,i=r.arr.pos,a=r.arr.count;if(n+a>this.maxVerts)break;let o=e.pos;for(let e=0;e<a;e++){let r=i[e*3],a=i[e*3+1],s=i[e*3+2],c=(n+e)*3;o[c]=t[0]*r+t[4]*a+t[8]*s+t[12],o[c+1]=t[1]*r+t[5]*a+t[9]*s+t[13],o[c+2]=t[2]*r+t[6]*a+t[10]*s+t[14]}n+=a}e.pa.clearUpdateRanges(),e.pa.addUpdateRange(0,n*3),e.pa.needsUpdate=!0,e.geo.boundingSphere.center.copy(t.root.position),e.geo.boundingSphere.center.y+=1.5}release(e){e&&(e.sticky=!1,e.mesh.visible=!1)}update(e){for(let t of this.list){if(!t.mesh.visible)continue;let n=e-t.born,r=t.mesh.material.uniforms;if(t.sticky){r.uAlpha.value=t.strength,r.uFlash.value=0;continue}if(n>t.life){t.mesh.visible=!1;continue}let i=Math.exp(-n*t.decay)*(1-Math.max(0,(n-t.life*.7)/(t.life*.3)));r.uAlpha.value=t.strength*i,r.uFlash.value=Math.max(0,1-n*7)*t.strength}}},Hu=`
attribute vec3 aColor;
attribute float aI;
attribute float aSize;
uniform float uPix;
varying vec3 vColor;
varying float vI;
void main() {
  vColor = aColor;
  vI = aI;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPix / max(-mv.z, 0.3), 5.5, 24.0);
  if (aI < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`,Uu=`
varying vec3 vColor;
varying float vI;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  c.y *= 1.7; // a narrow, squinting slit
  float d = length(c);
  float core = smoothstep(0.3, 0.05, d);
  float halo = smoothstep(0.5, 0.0, d);
  float a = core * 4.0 + halo * halo * 0.6;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a * vI, 1.0);
}
`,Wu=class{constructor(e,t=24){this.max=t,this.items=[];let n=t*2;this.pos=new Float32Array(n*3),this.col=new Float32Array(n*3),this.int=new Float32Array(n),this.size=new Float32Array(n);let r=new Vr;this.pa=new Er(this.pos,3).setUsage(et),this.ca=new Er(this.col,3).setUsage(et),this.ia=new Er(this.int,1).setUsage(et),this.sa=new Er(this.size,1).setUsage(et),r.setAttribute(`position`,this.pa),r.setAttribute(`aColor`,this.ca),r.setAttribute(`aI`,this.ia),r.setAttribute(`aSize`,this.sa),this.mat=new ga({uniforms:{uPix:{value:600}},vertexShader:Hu,fragmentShader:Uu,transparent:!0,depthWrite:!1,blending:2}),this.points=new Qi(r,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=7,e.add(this.points);for(let e=0;e<t;e++)this.items.push({alive:!1});this.dirty=!0}clear(){for(let e of this.items)e.alive=!1;this.int.fill(0),this.ia.needsUpdate=!0}add(e,t,n,r,i={}){let a=this.items.find(e=>!e.alive);a||(a=this.items.reduce((e,t)=>e.t0<t.t0?e:t));let o=(i.spacing??.22)*.5;return a.alive=!0,a.x=e,a.y=t,a.z=n,a.rx=Math.cos(r)*o,a.rz=-Math.sin(r)*o,a.t0=i.time??0,a.life=i.life??.5,a.peak=i.intensity??1,a.color=i.color??[1,.16,.1],a.size=i.size??.16,a.blinkAt=i.blink?a.life*(.35+Math.random()*.3):-1,a}update(e,t){this.mat.uniforms.uPix.value=t;let n=!1;for(let t=0;t<this.max;t++){let r=this.items[t],i=t*2,a=i+1;if(!r.alive){(this.int[i]!==0||this.int[a]!==0)&&(this.int[i]=this.int[a]=0,n=!0);continue}let o=e-r.t0;if(o>r.life||o<-.5){r.alive=!1,this.int[i]=this.int[a]=0,n=!0;continue}let s=Math.min(1,Math.max(0,o)/.07)*Math.min(1,(r.life-o)/.22);r.blinkAt>0&&Math.abs(o-r.blinkAt)<.06&&(s=0);let c=s*r.peak;this.pos[i*3]=r.x-r.rx,this.pos[i*3+1]=r.y,this.pos[i*3+2]=r.z-r.rz,this.pos[a*3]=r.x+r.rx,this.pos[a*3+1]=r.y,this.pos[a*3+2]=r.z+r.rz;for(let e of[i,a])this.col[e*3]=r.color[0],this.col[e*3+1]=r.color[1],this.col[e*3+2]=r.color[2],this.size[e]=r.size,this.int[e]=c;n=!0}n&&(this.pa.needsUpdate=!0,this.ca.needsUpdate=!0,this.ia.needsUpdate=!0,this.sa.needsUpdate=!0)}},Gu=`
attribute vec3 aColor;
attribute float aSize;
uniform float uPix;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPix / max(-mv.z, 0.2), 0.0, 48.0);
}
`,Ku=`
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a = a * a;
  gl_FragColor = vec4(vColor * a * 1.6, 1.0);
}
`,qu=class{constructor(e,t=1600){this.max=t,this.n=0,this.pos=new Float32Array(t*3),this.col=new Float32Array(t*3),this.size=new Float32Array(t),this.vel=new Float32Array(t*3),this.base=new Float32Array(t*3),this.life=new Float32Array(t),this.maxLife=new Float32Array(t),this.size0=new Float32Array(t),this.grav=new Float32Array(t),this.drag=new Float32Array(t);let n=new Vr;this.pa=new Er(this.pos,3).setUsage(et),this.ca=new Er(this.col,3).setUsage(et),this.sa=new Er(this.size,1).setUsage(et),n.setAttribute(`position`,this.pa),n.setAttribute(`aColor`,this.ca),n.setAttribute(`aSize`,this.sa),n.setDrawRange(0,0),this.geo=n,this.mat=new ga({uniforms:{uPix:{value:600}},vertexShader:Gu,fragmentShader:Ku,transparent:!0,depthWrite:!1,blending:2}),this.points=new Qi(n,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=8,e.add(this.points)}clear(){this.n=0,this.geo.setDrawRange(0,0)}burst(e,t,n,r,i={}){let a=i.color||[1,1,1];for(let o=0;o<r;o++){if(this.n>=this.max)return;let r=this.n++,o=(i.speed??3)*(.35+Math.random()*.65),s,c,l;if(i.dir){let e=i.cone??.5;s=i.dir.x+(Math.random()-.5)*e*2,c=i.dir.y+(Math.random()-.5)*e*2,l=i.dir.z+(Math.random()-.5)*e*2}else{let e=Math.random()*2-1,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e*e);s=n*Math.cos(t),c=e,l=n*Math.sin(t)}let u=Math.hypot(s,c,l)||1,d=i.spread??0;this.pos[r*3]=e+(Math.random()-.5)*d,this.pos[r*3+1]=t+(Math.random()-.5)*d,this.pos[r*3+2]=n+(Math.random()-.5)*d,this.vel[r*3]=s/u*o,this.vel[r*3+1]=c/u*o+(i.up??0),this.vel[r*3+2]=l/u*o;let f=.75+Math.random()*.5;this.base[r*3]=a[0]*f,this.base[r*3+1]=a[1]*f,this.base[r*3+2]=a[2]*f;let p=(i.life??1)*(.6+Math.random()*.6);this.life[r]=p,this.maxLife[r]=p,this.size0[r]=(i.size??.12)*(.6+Math.random()*.8),this.grav[r]=i.gravity??-6,this.drag[r]=i.drag??1.5}}_kill(e){let t=--this.n;if(e!==t){for(let n=0;n<3;n++)this.pos[e*3+n]=this.pos[t*3+n],this.vel[e*3+n]=this.vel[t*3+n],this.base[e*3+n]=this.base[t*3+n];this.life[e]=this.life[t],this.maxLife[e]=this.maxLife[t],this.size0[e]=this.size0[t],this.grav[e]=this.grav[t],this.drag[e]=this.drag[t]}}update(e,t){this.mat.uniforms.uPix.value=t;for(let t=this.n-1;t>=0;t--){if(this.life[t]-=e,this.life[t]<=0){this._kill(t);continue}let n=Math.exp(-this.drag[t]*e);this.vel[t*3]*=n,this.vel[t*3+1]=this.vel[t*3+1]*n+this.grav[t]*e,this.vel[t*3+2]*=n,this.pos[t*3]+=this.vel[t*3]*e,this.pos[t*3+1]+=this.vel[t*3+1]*e,this.pos[t*3+2]+=this.vel[t*3+2]*e}for(let e=0;e<this.n;e++){let t=this.life[e]/this.maxLife[e],n=t*t;this.col[e*3]=this.base[e*3]*n,this.col[e*3+1]=this.base[e*3+1]*n,this.col[e*3+2]=this.base[e*3+2]*n,this.size[e]=this.size0[e]*(.4+.6*t)}this.geo.setDrawRange(0,this.n),this.n>0&&(this.pa.clearUpdateRanges(),this.pa.addUpdateRange(0,this.n*3),this.pa.needsUpdate=!0,this.ca.clearUpdateRanges(),this.ca.addUpdateRange(0,this.n*3),this.ca.needsUpdate=!0,this.sa.clearUpdateRanges(),this.sa.addUpdateRange(0,this.n),this.sa.needsUpdate=!0)}},Ju={a:[800,1250,2600],o:[500,880,2500],u:[340,760,2300],i:[290,2250,3e3],e:[470,1850,2600],y:[420,1450,2400],A:[1e3,1500,3e3]},Yu=[`a`,`o`,`u`,`i`,`e`,`y`],Xu=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)};function Zu(e,t,n=2){let r=Math.floor(e.sampleRate*n),i=e.createBuffer(1,r,e.sampleRate),a=i.getChannelData(0),o=0,s=0,c=0,l=0,u=0,d=0,f=0,p=0;for(let e=0;e<r;e++){let n=Math.random()*2-1;t===`white`?a[e]=n:t===`pink`?(o=.99886*o+n*.0555179,s=.99332*s+n*.0750759,c=.969*c+n*.153852,l=.8665*l+n*.3104856,u=.55*u+n*.5329522,d=-.7616*d-n*.016898,a[e]=(o+s+c+l+u+d+f+n*.5362)*.11,f=n*.115926):(p=(p+.02*n)/1.02,a[e]=p*3.5)}return i}function Qu(e,t,n){let r=Math.floor(e.sampleRate*t),i=e.createBuffer(2,r,e.sampleRate);for(let t=0;t<2;t++){let a=i.getChannelData(t);for(let t=0;t<r;t++){let i=t/r,o=t<e.sampleRate*.12&&Math.random()<.004?(Math.random()*2-1)*2:0;a[t]=((Math.random()*2-1)*(1-i)**n+o)*.6}}return i}function $u(e){let t=1024,n=new Float32Array(t);for(let r=0;r<t;r++){let i=r*2/t-1;n[r]=(Math.PI+e)*i/(Math.PI+e*Math.abs(i))}return n}var ed=new class{constructor(){this.ctx=null,this.ambOn=!1,this.nextAmbEvent=0,this.nextBeat=0,this.listener={x:0,y:0,z:0,fx:0,fz:-1},this._outBuf=null,this.offline=!1,this.voices=new Map}get ready(){return!!this.ctx&&(this.ctx.state===`running`||this.offline)}get now(){return this.ctx?this.ctx.currentTime:0}init(e){if(this.ctx){this.ctx.state!==`running`&&!this.offline&&this.ctx.resume().catch(()=>{});return}let t=window.AudioContext||window.webkitAudioContext;if(!t&&!e)return;let n=this.ctx=e||new t({latencyHint:`interactive`});this.offline=!!e,this.master=n.createGain(),this.master.gain.value=G.volume,this.limiter=n.createDynamicsCompressor(),this.limiter.threshold.value=-9,this.limiter.knee.value=6,this.limiter.ratio.value=14,this.limiter.attack.value=.002,this.limiter.release.value=.22,this.master.connect(this.limiter),this.limiter.connect(n.destination),this.outAnalyser=n.createAnalyser(),this.outAnalyser.fftSize=512,this.limiter.connect(this.outAnalyser),this._outBuf=new Float32Array(this.outAnalyser.fftSize),this.stunLP=n.createBiquadFilter(),this.stunLP.type=`lowpass`,this.stunLP.frequency.value=2e4,this.stunLP.Q.value=.6,this.stunLP.connect(this.master),this.pauseGain=n.createGain(),this.pauseGain.connect(this.stunLP);let r=e=>{let t=n.createGain();return t.gain.value=e,t.connect(this.pauseGain),t};this.sfx=r(1),this.amb=r(0),this.echoBus=r(.9),this.body=r(1),this.duckGain=n.createGain(),this.amb.disconnect(),this.amb.connect(this.duckGain),this.duckGain.connect(this.pauseGain),this._freshDeathBus(),this.ui=n.createGain(),this.ui.gain.value=.5,this.ui.connect(this.master),this.reverb=n.createConvolver(),this.reverb.buffer=Qu(n,3.2,2.6),this.revSend=n.createGain(),this.revSend.gain.value=1;let i=n.createGain();i.gain.value=.55,this.revSend.connect(this.reverb),this.reverb.connect(i),i.connect(this.pauseGain),this.gateAnalyser=n.createAnalyser(),this.gateAnalyser.fftSize=512,this.sfx.connect(this.gateAnalyser),this.echoBus.connect(this.gateAnalyser),i.connect(this.gateAnalyser),this._gateBuf=new Float32Array(this.gateAnalyser.fftSize),this.voiceBus=n.createGain(),this.voiceBus.gain.value=1.15,this.voiceBus.connect(this.stunLP),this.voiceBus.connect(this.gateAnalyser),this.white=Zu(n,`white`,2),this.pink=Zu(n,`pink`,3),this.brown=Zu(n,`brown`,4),this.distHard=$u(80),this.distSoft=$u(12),this.distScream=$u(40),n.listener.positionX&&(n.listener.upX.value=0,n.listener.upY.value=1,n.listener.upZ.value=0)}setVolume(e){this.master&&this.master.gain.setTargetAtTime(e,this.now,.05)}setPaused(e){this.pausedFlag=e,this.ctx&&this.pauseGain.gain.setTargetAtTime(+!e,this.now,.06)}outputDb(){if(!this.gateAnalyser||this.pausedFlag)return-100;let e=this._gateBuf;this.gateAnalyser.getFloatTimeDomainData(e);let t=0;for(let n=0;n<e.length;n++)t+=e[n]*e[n];let n=Math.max(.001,this.master.gain.value);return 20*Math.log10(Math.sqrt(t/e.length)*n+1e-9)}setListener(e,t,n,r,i,a){if(this.listener.x=e,this.listener.y=t,this.listener.z=n,this.listener.fx=r,this.listener.fz=a,!this.ctx)return;let o=this.ctx.listener,s=this.now;o.positionX?(o.positionX.setTargetAtTime(e,s,.02),o.positionY.setTargetAtTime(t,s,.02),o.positionZ.setTargetAtTime(n,s,.02),o.forwardX.setTargetAtTime(r,s,.02),o.forwardY.setTargetAtTime(i,s,.02),o.forwardZ.setTargetAtTime(a,s,.02)):o.setPosition&&(o.setPosition(e,t,n),o.setOrientation(r,i,a,0,1,0))}panOf(e,t){let n=this.listener,r=e-n.x,i=t-n.z,a=Math.hypot(r,i)||1,o=-n.fz,s=n.fx;return Math.max(-1,Math.min(1,(r*o+i*s)/a))}behindOf(e,t){let n=this.listener,r=e-n.x,i=t-n.z,a=Math.hypot(r,i)||1;return(r*n.fx+i*n.fz)/a<-.2}_noise(e=this.white){let t=this.ctx.createBufferSource();return t.buffer=e,t.loop=!0,t}_gain(e=0){let t=this.ctx.createGain();return t.gain.value=e,t}_filter(e,t,n=1){let r=this.ctx.createBiquadFilter();return r.type=e,r.frequency.value=t,r.Q.value=n,r}_osc(e,t){let n=this.ctx.createOscillator();return n.type=e,n.frequency.value=t,n}_env(e,t,n,r,i,a=0){let o=e.gain;return o.cancelScheduledValues(t),o.setValueAtTime(1e-4,t),o.linearRampToValueAtTime(r,t+n),a&&o.setValueAtTime(r,t+n+a),o.exponentialRampToValueAtTime(1e-4,t+n+a+i),t+n+a+i}_panner(e,t,n,r=3,i=1.1){let a=this.ctx.createPanner();return a.panningModel=`HRTF`,a.distanceModel=`inverse`,a.refDistance=r,a.rolloffFactor=i,a.maxDistance=150,a.positionX?(a.positionX.value=e,a.positionY.value=t,a.positionZ.value=n):a.setPosition(e,t,n),a}_stereo(e){let t=this.ctx.createStereoPanner();return t.pan.value=e,t}_out(e,t,n=0){if(e.connect(t),n>0){let t=this._gain(n);e.connect(t),t.connect(this.revSend)}}_noiseBurst(e,{buf:t,type:n=`bandpass`,f:r=1e3,q:i=1,a=.002,d:o=.1,gain:s=.5,dest:c,rev:l=0,fEnd:u,hold:d=0}){let f=this._noise(t||this.white),p=this._filter(n,r,i);u&&p.frequency.exponentialRampToValueAtTime(u,e+a+d+o);let m=this._gain();f.connect(p).connect(m),this._out(m,c||this.sfx,l);let h=this._env(m,e,a,s,o,d);return f.start(e,Math.random()*1.5),f.stop(h+.05),m}_tone(e,{type:t=`sine`,f:n=440,fEnd:r,a:i=.005,d:a=.2,gain:o=.3,dest:s,rev:c=0,hold:l=0,detune:u=0}){let d=this._osc(t,n);d.detune.value=u,r&&d.frequency.exponentialRampToValueAtTime(r,e+i+l+a);let f=this._gain();d.connect(f),this._out(f,s||this.sfx,c);let p=this._env(f,e,i,o,a,l);return d.start(e),d.stop(p+.05),{o:d,g:f}}click(e=.3,t=null){if(!this.ready)return;let n=this.now,r=t||this.sfx;this._noiseBurst(n,{f:3400,q:2.5,a:8e-4,d:.03,gain:.7+e,dest:r}),this._tone(n,{f:2100,fEnd:900,a:.001,d:.05,gain:.35,dest:r}),this._tone(n+.01,{f:1250,fEnd:990,a:.004,d:.7,gain:.07,rev:.6,dest:r})}clap(e=.6,t=null){if(!this.ready)return;let n=this.now,r=t||this.sfx;for(let t=0;t<3;t++)this._noiseBurst(n+t*.009,{f:1150+t*200,q:.9,a:.001,d:.012,gain:.6*e,dest:r});this._noiseBurst(n+.027,{f:1200,q:.7,a:.001,d:.14,gain:.9*e,rev:.9,dest:r})}shout(e=.9,t=null){if(!this.ready)return;let n=t||this.sfx,r=this.now,i=.35+e*.25,a=this._osc(`sawtooth`,170+e*90);a.frequency.linearRampToValueAtTime(230+e*120,r+.08),a.frequency.linearRampToValueAtTime(190+e*60,r+i);let o=this._osc(`sine`,5.5),s=this._gain(6+e*10);o.connect(s).connect(a.frequency);let c=this._filter(`bandpass`,720,6),l=this._filter(`bandpass`,1180,7),u=this._filter(`bandpass`,2600,8),d=this._gain(),f=this.ctx.createWaveShaper();f.curve=e>.75?this.distSoft:null,a.connect(c),a.connect(l),a.connect(u);let p=this._gain(1);c.connect(p),l.connect(p);let m=this._gain(.5);u.connect(m).connect(p),p.connect(f).connect(d),this._out(d,n,.8),this._env(d,r,.03,.55*e,.25,i-.1),a.start(r),o.start(r),a.stop(r+i+.4),o.stop(r+i+.4),this._noiseBurst(r,{f:1800,q:.8,a:.02,d:.25,hold:i-.15,gain:.08*e,dest:n})}sonarSweep(e,t=!1){if(!this.ready)return;let n=this.now;this._noiseBurst(n,{buf:this.pink,f:300,fEnd:2400,q:1.6,a:.05,d:.6+e*.6,gain:.05+e*.08,rev:.5}),t&&this._tone(n,{f:70,fEnd:38,a:.01,d:.7,gain:.35*e})}tick(e,t,n,r=1,i=0){if(!this.ready||n<.01)return;let a=this.now+e;this.ctx;let o=this._stereo(t);o.connect(this.sfx);let s=this._gain();if(s.connect(o),i===3){let e=this._osc(`triangle`,1900*r),t=this._osc(`sine`,2930*r);e.connect(s),t.connect(s),this._env(s,a,.001,n*.5,.35),e.start(a),t.start(a),e.stop(a+.4),t.stop(a+.4)}else if(i===4){let e=this._noise(),t=this._filter(`lowpass`,1600,.7);e.connect(t).connect(s),this._env(s,a,.003,n*.6,.12),e.start(a,Math.random()),e.stop(a+.2)}else{let e=this._osc(`sine`,(i===1?2300:i===2?1500:3e3)*r);e.connect(s),this._env(s,a,.001,n*.45,i===1?.04:.03),e.start(a),e.stop(a+.08)}}monsterReturn(e,t,n,r,i=.6){if(!this.ready)return;let a=this.now+e,o=this._panner(t,n,r,4,.8);o.connect(this.sfx);let s=this._gain();s.connect(o);let c=this._osc(`sawtooth`,62),l=this._osc(`sawtooth`,93.5),u=this._filter(`lowpass`,420,4);c.connect(u),l.connect(u),u.connect(s),this._env(s,a,.01,i*.5,.45),c.start(a),l.start(a),c.stop(a+.6),l.stop(a+.6);let d=this._noise(),f=this._filter(`bandpass`,900,3),p=this._gain();d.connect(f).connect(p).connect(o),p.gain.setValueAtTime(1e-4,a),p.gain.exponentialRampToValueAtTime(i*.25,a+.22),p.gain.linearRampToValueAtTime(1e-4,a+.24),d.start(a,Math.random()),d.stop(a+.3)}chime(e,t,n,r=0,i=.3,a=!0){if(!this.ready)return;let o=this.now,s=660*2**(r%12/12),c=this._osc(`sine`,s),l=this._osc(`sine`,s*2.76),u=this._gain(s*1.8);u.gain.exponentialRampToValueAtTime(1,o+1.2),l.connect(u).connect(c.frequency);let d=this._gain();if(c.connect(d),a){let r=this._panner(e,t,n,4,1);d.connect(r),r.connect(this.sfx)}else this._out(d,this.sfx,.5);let f=this._gain(.35);d.connect(f),f.connect(this.revSend),this._env(d,o,.003,i,1.8),c.start(o),l.start(o),c.stop(o+2),l.stop(o+2)}shardPickup(e){if(!this.ready)return;let t=this.now;[0,4,7,12].forEach((n,r)=>{let i=t+r*.06,a=523*2**((n+e%5)/12);this._tone(i,{f:a,a:.003,d:.9,gain:.16,rev:.6}),this._tone(i,{f:a*2.01,a:.003,d:.4,gain:.05})}),this._noiseBurst(t,{f:7e3,q:1,a:.01,d:.5,gain:.08,type:`highpass`})}footstep(e=.5,t=null){if(!this.ready)return;let n=this.now,r=t||this.sfx,i=650+Math.random()*700;this._noiseBurst(n,{f:i,q:.9,a:.002,d:.06+e*.06,gain:.12+e*.3,dest:r}),this._noiseBurst(n+.02,{f:i*2.4,q:2,a:.004,d:.05,gain:.04+e*.08,dest:r}),e>.6&&this._tone(n,{f:95,fEnd:55,a:.002,d:.08,gain:.25*e,dest:r})}mateStep(e,t,n,r=.4){if(!this.ready)return;let i=this._panner(e,t,n,2.5,1.3);i.connect(this.sfx),this.footstep(r*.8,i)}matePing(e,t,n,r,i=.78){if(!this.ready)return;let a=this._panner(e,t,n,4,1);a.connect(this.sfx),r<.36?this.click(r,a):r<i?this.clap(r,a):this.shout(r,a)}mateDeath(e,t,n,r=!1){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,6,.8);a.connect(this.sfx);let o=this._osc(`sawtooth`,310);o.frequency.linearRampToValueAtTime(420,i+.12),o.frequency.exponentialRampToValueAtTime(140,i+.75);let s=this._filter(`bandpass`,950,5),c=this._filter(`bandpass`,1500,6),l=this._gain();o.connect(s),o.connect(c),s.connect(l),c.connect(l),this._out(l,a,.9),this._env(l,i,.02,r?.5:.38,.12,.55),o.start(i),o.stop(i+.95),this._noiseBurst(i+.58,{type:`lowpass`,f:420,q:.8,a:.004,d:.4,gain:.55,dest:a,rev:.6}),this._tone(i+.6,{f:60,fEnd:34,a:.004,d:.5,gain:.4,dest:a})}voiceAttach(e,t){if(this.init(),!this.ctx)return;this.voiceDetach(e);let n=this.ctx,r=new Audio;r.muted=!0,r.srcObject=t;let i=r.play();i&&i.catch&&i.catch(()=>{});let a;try{a=n.createMediaStreamSource(t)}catch(e){console.warn(`[voice] no audio track yet`,e);return}let o=this._filter(`highpass`,110,.7),s=this._filter(`lowpass`,7200,.7),c=n.createAnalyser();c.fftSize=256;let l=this._gain(1),u=this._gain(1),d=this._gain(0),f=this._gain(0),p=this._panner(0,0,0,2.2,1.15);p.maxDistance=90,a.connect(o).connect(s).connect(l),s.connect(c),l.connect(u),l.connect(d),l.connect(f),u.connect(this.voiceBus),d.connect(p).connect(this.voiceBus),f.connect(this.revSend),this.voices.set(e,{el:r,src:a,hp:o,lp:s,g:l,dry:u,wet:d,rv:f,pn:p,level:c,buf:new Float32Array(256),spatial:!1})}voiceSpatial(e,t){let n=this.voices.get(e);if(!n||n.spatial===t)return;n.spatial=t;let r=this.now;n.dry.gain.setTargetAtTime(+!t,r,.08),n.wet.gain.setTargetAtTime(+!!t,r,.08),n.rv.gain.setTargetAtTime(t?.22:0,r,.08)}voiceSet(e,t,n,r,i){let a=this.voices.get(e);if(!a)return;let o=this.now,s=a.pn;s.positionX?(s.positionX.setTargetAtTime(t,o,.03),s.positionY.setTargetAtTime(n,o,.03),s.positionZ.setTargetAtTime(r,o,.03)):s.setPosition(t,n,r),Math.abs((a.lastGain??-1)-i)>.01&&(a.lastGain=i,a.g.gain.setTargetAtTime(i,o,.06))}voiceLevel(e){let t=this.voices.get(e);if(!t)return 0;t.level.getFloatTimeDomainData(t.buf);let n=0;for(let e=0;e<t.buf.length;e++)n+=t.buf[e]*t.buf[e];let r=20*Math.log10(Math.sqrt(n/t.buf.length)+1e-9);return Math.max(0,Math.min(1,(r+55)/40))}voiceDetach(e){let t=this.voices.get(e);if(t){this.voices.delete(e);try{t.src.disconnect(),t.g.disconnect(),t.pn.disconnect(),t.rv.disconnect()}catch{}t.el.srcObject=null}}voiceDetachAll(){for(let e of[...this.voices.keys()])this.voiceDetach(e)}bump(){if(!this.ready)return;let e=this.now;this._tone(e,{f:90,fEnd:42,a:.002,d:.3,gain:.7}),this._noiseBurst(e,{type:`lowpass`,f:600,q:.7,a:.002,d:.12,gain:.5,rev:.4});let t=this._osc(`sawtooth`,130);t.frequency.linearRampToValueAtTime(95,e+.35);let n=this._filter(`bandpass`,520,6),r=this._gain();t.connect(n).connect(r),this._out(r,this.sfx,.3),this._env(r,e+.05,.03,.12,.3),t.start(e),t.stop(e+.5)}throwWhoosh(){this.ready&&this._noiseBurst(this.now,{f:500,fEnd:2600,q:2.2,a:.04,d:.22,gain:.18})}impact(e,t,n,r=!1){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,4,.9);a.connect(this.sfx);let o=this._gain(.7);if(a.connect(o),o.connect(this.revSend),r){let e=this._noise(),t=this._filter(`lowpass`,3500,1),n=this._gain();t.frequency.exponentialRampToValueAtTime(500,i+.45),e.connect(t).connect(n).connect(a),this._env(n,i,.005,.9,.45),e.start(i,Math.random()),e.stop(i+.6);return}let s=this._noise(),c=this._filter(`bandpass`,1700,3),l=this._gain();s.connect(c).connect(l).connect(a),this._env(l,i,.001,1.2,.05),s.start(i,Math.random()),s.stop(i+.1);let u=this._osc(`sine`,420);u.frequency.exponentialRampToValueAtTime(180,i+.1);let d=this._gain();u.connect(d).connect(a),this._env(d,i,.001,.8,.12),u.start(i),u.stop(i+.2);let f=this._noise(),p=this._filter(`bandpass`,2300,3),m=this._gain();f.connect(p).connect(m).connect(a),this._env(m,i+.16,.001,.4,.04),f.start(i+.16,Math.random()),f.stop(i+.25)}_freshDeathBus(){if(this.deathBus){let e=this.deathBus;e.gain.setTargetAtTime(0,this.now,.04),setTimeout(()=>{try{e.disconnect()}catch{}},600)}this.deathBus=this.ctx.createGain(),this.deathBus.connect(this.stunLP)}resetFx(){if(!this.ctx)return;let e=this.now;this.stunLP.frequency.cancelScheduledValues(e),this.stunLP.frequency.setValueAtTime(2e4,e),this.duckGain.gain.cancelScheduledValues(e),this.duckGain.gain.setValueAtTime(this.duckGain.gain.value,e),this.duckGain.gain.linearRampToValueAtTime(1,e+.4),this._freshDeathBus()}stun(e=1,t=3){if(!this.stunLP)return;let n=this.now,r=this.stunLP.frequency,i=2e4*.03**e;r.cancelScheduledValues(n),r.setValueAtTime(2e4,n),r.setValueAtTime(2e4,n+.14),r.exponentialRampToValueAtTime(i,n+.5),r.setValueAtTime(i,n+.5+t*.22),r.exponentialRampToValueAtTime(2e4,n+t)}tinnitus(e,t=3,n=.02){[6150,6163].forEach((r,i)=>this._tone(e,{f:r,a:.4,hold:t*.3,d:t*.7,gain:n*(i?.6:1),dest:this.master}))}duck(e=.1,t=.3,n=1,r=2){if(!this.duckGain)return;let i=this.now,a=this.duckGain.gain;a.cancelScheduledValues(i),a.setValueAtTime(Math.max(1e-4,a.value),i),a.linearRampToValueAtTime(e,i+t),a.setValueAtTime(e,i+t+n),a.linearRampToValueAtTime(1,i+t+n+r)}preScare(e=.9,t=null,n=1){if(!this.ready)return;let r=this.now;this.duck(.03,e*.5,e*.5+.6,2.8),t||(t=Math.random()<.45?`inhale`:Math.random()<.55?`pressure`:`silence`);let i=r+e-.12;if(t===`inhale`){let e=this.listener,t=Math.random()<.5?-1:1,a=e.x-e.fx*.5-e.fz*t*.3,o=e.z-e.fz*.5+e.fx*t*.3,s=this._panner(a,e.y+.05,o,.5,1.6);s.connect(this.sfx);let c=this._noise(this.pink),l=this._filter(`bandpass`,480,1.7);l.frequency.setValueAtTime(480,r+.1),l.frequency.exponentialRampToValueAtTime(1800,i);let u=this._gain(0);c.connect(l).connect(u).connect(s),u.gain.setValueAtTime(1e-4,r+.1),u.gain.exponentialRampToValueAtTime(.5*n,i-.02),u.gain.linearRampToValueAtTime(1e-4,i),c.start(r,Math.random()),c.stop(i+.05)}else t===`pressure`&&(this._tone(r,{f:33,fEnd:47,a:e-.13,d:.02,gain:.2*n,dest:this.body}),this._noiseBurst(r,{f:5500,q:.9,a:e-.13,d:.015,gain:.04*n}))}_shaper(e){let t=this.ctx.createWaveShaper();return t.curve=e,t.oversample=`4x`,t}_ring(e,t,n,r){let i=this._gain(0),a=this._osc(`sine`,t);return a.connect(i.gain),e.connect(i),a.start(n),a.stop(n+r+.05),i}_voice(e,t){let n=t.dur,r=this._osc(t.type||`sawtooth`,t.f0[0][1]),i=r.frequency;i.setValueAtTime(t.f0[0][1],e);for(let n=1;n<t.f0.length;n++)i.exponentialRampToValueAtTime(t.f0[n][1],e+t.f0[n][0]);if(t.vib){let i=this._osc(`sine`,t.vib[0]),a=this._gain(t.vib[1]);i.connect(a).connect(r.detune),i.start(e),i.stop(e+n+.05)}if(t.jitter)for(let i=e;i<e+n;i+=.028)r.detune.setValueAtTime((Math.random()*2-1)*t.jitter,i);let a=this._gain(1);if(r.connect(a),t.rasp){let r=this._noise(this.white),i=this._gain(t.rasp);r.connect(i).connect(a),r.start(e,Math.random()*1.5),r.stop(e+n+.05)}let o=this._gain(1),s=typeof t.vowel==`string`?[[0,t.vowel]]:t.vowel,c=t.q||7,l=[1,.7,.4];for(let n=0;n<3;n++){let r=this._filter(`bandpass`,Ju[s[0][1]][n],n===0?c*.7:c);r.frequency.setValueAtTime(Ju[s[0][1]][n],e);for(let t=1;t<s.length;t++)r.frequency.linearRampToValueAtTime(Ju[s[t][1]][n],e+s[t][0]);let i=this._gain(l[n]*(t.fg||3));a.connect(r).connect(i).connect(o)}return r.start(e),r.stop(e+n+.05),o}heartbeat(e,t=0,n=null){if(!this.ready)return;let r=t||this.now,i=n||this.body;this._tone(r,{f:62,fEnd:38,a:.006,d:.14,gain:e,dest:i}),this._noiseBurst(r,{buf:this.brown,type:`lowpass`,f:150,q:.7,a:.004,d:.12,gain:e*.6,dest:i}),this._tone(r+.21,{f:55,fEnd:36,a:.006,d:.16,gain:e*.7,dest:i}),this._noiseBurst(r+.21,{buf:this.brown,type:`lowpass`,f:125,q:.7,a:.004,d:.12,gain:e*.4,dest:i})}breathHeavy(){if(!this.ready)return;let e=this.now;this._noiseBurst(e,{f:950,q:1.1,a:.12,d:.25,hold:.1,gain:.12}),this._noiseBurst(e+.5,{f:700,q:1.1,a:.08,d:.3,hold:.05,gain:.09})}growl(e,t,n,r=.8){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,4,.9);a.connect(this.sfx);let o=this._gain(.25);a.connect(o),o.connect(this.revSend);let s=this._gain(0),c=this._shaper(this.distSoft),l=this._gain(.7);s.connect(c).connect(l).connect(a);let u=62+Math.random()*18,d=this._voice(i,{f0:[[0,u],[.5,u*1.14],[1.35,u*.76]],vowel:[[0,`u`],[.5,`o`],[1.25,`y`]],dur:1.45,vib:[5,25],jitter:60,rasp:.55,q:4,fg:2.8}),f=this._gain(.6),p=this._osc(`square`,23+Math.random()*10),m=this._gain(.4);p.connect(m).connect(f.gain),d.connect(f).connect(s),p.start(i),p.stop(i+1.5);let h=this._osc(`triangle`,u/2);h.frequency.exponentialRampToValueAtTime(u*.38,i+1.35);let g=this._gain(.35);h.connect(g).connect(s),h.start(i),h.stop(i+1.5),this._env(s,i,.18,r,.75,.42)}screech(e,t,n,r=1){if(!this.ready)return;let i=this.now,a=this.ctx,o=this._panner(e,t,n,6,.6);o.connect(this.sfx);let s=a.createDelay(1.5);s.delayTime.value=.43+Math.random()*.1;let c=this._filter(`lowpass`,1600,.7),l=this._gain(.36);s.connect(c).connect(l).connect(s);let u=this._gain(.4);c.connect(u),u.connect(this.sfx),u.connect(this.revSend),this.offline||setTimeout(()=>{try{s.disconnect(),l.disconnect()}catch{}},6e3);let d=this._gain(0),f=this._shaper(this.distScream),p=this._filter(`highpass`,90,.7),m=this._gain(.5);d.connect(f).connect(p).connect(m),m.connect(o),m.connect(s);let h=this._gain(.55);m.connect(h),h.connect(this.revSend),[720,860].forEach((e,t)=>{let n=e*(.95+Math.random()*.1),r=this._voice(i,{f0:[[0,n*.7],[.12,n*1.22],[.45,n*1.08],[1.5,n*.5]],vowel:[[0,`A`],[.35,`i`],[1.25,`e`]],dur:1.6,vib:[6.5+t*1.3,70],jitter:50,rasp:.45,q:6,fg:3.5}),a=this._gain(.5);r.connect(a).connect(d)});let g=this._voice(i,{f0:[[0,90],[.2,112],[1.4,62]],vowel:[[0,`o`],[1.2,`u`]],dur:1.5,vib:[4,30],jitter:35,rasp:.3,q:4,fg:3}),_=this._gain(.6);g.connect(_).connect(d);let v=this._osc(`sawtooth`,1900);v.frequency.exponentialRampToValueAtTime(1150,i+1.3);let y=this._ring(v,1350,i,1.4),b=this._filter(`bandpass`,2800,1.2),x=this._gain(.14);y.connect(b).connect(x).connect(d),v.start(i),v.stop(i+1.45),this._env(d,i,.025,.6*r,1.15,.3),this._noiseBurst(i,{type:`highpass`,f:2e3,a:8e-4,d:.03,gain:.5*r,dest:o})}heavyStep(e,t,n,r=.5,i=1){if(!this.ready)return;let a=this.now,o=this._panner(e,t,n,3,1.2);o.connect(this.sfx);let s=this._osc(`sine`,75*i);s.frequency.exponentialRampToValueAtTime(40*i,a+.12/i);let c=this._gain();s.connect(c).connect(o),this._env(c,a,.003,r,.15/i),s.start(a),s.stop(a+.2/i+.05);let l=this._noise(),u=this._filter(`bandpass`,(500+Math.random()*400)*i,1),d=this._gain();l.connect(u).connect(d).connect(o),this._env(d,a,.003,r*.6,.09),l.start(a,Math.random()),l.stop(a+.15)}chitter(e,t,n,r=.5){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,3,1.1);a.connect(this.sfx);let o=6+Math.floor(Math.random()*6);for(let e=0;e<o;e++){let t=i+e*(.03+Math.random()*.02),n=this._noise(),o=this._filter(`bandpass`,2500+Math.random()*2500,6),s=this._gain();n.connect(o).connect(s).connect(a),this._env(s,t,.001,r,.02),n.start(t,Math.random()),n.stop(t+.04)}}sniff(e,t,n,r=.6){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,1.5,1.3);a.connect(this.sfx);let o=2+Math.floor(Math.random()*3);for(let e=0;e<o;e++){let t=i+e*(.13+Math.random()*.05);this._noiseBurst(t,{f:2100+Math.random()*900,q:2.2,a:.03,d:.07,gain:r*2.4,dest:a})}this.exhale(e,t,n,r*1.6,i+o*.16+.15,a)}exhale(e,t,n,r=.4,i=0,a=null){if(!this.ready)return;let o=i||this.now,s=a;s||(s=this._panner(e,t,n,1.5,1.3),s.connect(this.sfx)),this._noiseBurst(o,{buf:this.pink,f:620,fEnd:360,q:1.3,a:.09,d:.7,hold:.18,gain:r,dest:s})}breather(e,t,n,r=!1){if(!this.ready)return null;let i=this._panner(e,t,n,r?4:2.5,r?1.1:1.4);i.connect(this.sfx);let a=this._gain(0),o=this._noise(this.pink),s=this._filter(`bandpass`,r?300:520,2.2);o.connect(s).connect(a).connect(i),o.start(this.now,Math.random()*2);let c=this,l=0;return{setPos(e,t,n){let r=c.now;i.positionX?(i.positionX.setTargetAtTime(e,r,.05),i.positionY.setTargetAtTime(t,r,.05),i.positionZ.setTargetAtTime(n,r,.05)):i.setPosition(e,t,n)},update(e,t){let n=c.now;if(n<l)return;let i=2.6/e;l=n+i;let o=a.gain;o.cancelScheduledValues(n),o.setValueAtTime(1e-4,n),o.linearRampToValueAtTime(t,n+i*.35),o.linearRampToValueAtTime(1e-4,n+i*.5),o.linearRampToValueAtTime(t*.8,n+i*.75),o.linearRampToValueAtTime(1e-4,n+i*.98),s.frequency.setValueAtTime(r?230+Math.random()*150:420+Math.random()*300,n)},stop(){try{a.gain.setTargetAtTime(0,c.now,.05),o.stop(c.now+.3)}catch{}}}}sting(e=1){if(!this.ready)return;let t=this.now,n=e>=.9;this._tone(t,{f:74,fEnd:26,a:.004,d:1,gain:.8*e}),this._noiseBurst(t,{f:2e3,fEnd:450,q:.6,a:.002,d:.55,gain:.45*e,rev:.6});let r=this._gain(0),i=this._filter(`lowpass`,7e3,.7);r.connect(i),this._out(i,this.sfx,.8),[1046.5,1108.7,1480,1568,554.4].forEach((e,n)=>{let i=this._osc(`sawtooth`,e*(1+(Math.random()-.5)*.006)),a=this._osc(`sine`,5.5+Math.random()*2),o=this._gain(14+n*3);a.connect(o).connect(i.detune),i.frequency.exponentialRampToValueAtTime(e*.982,t+1.1);let s=this._gain(.075);i.connect(s).connect(r),i.start(t),a.start(t),i.stop(t+1.3),a.stop(t+1.3)}),this._env(r,t,.004,e,1,.12),this._noiseBurst(t,{f:3300,q:2.5,a:.003,d:.3,gain:.22*e,rev:.4});let a=this._gain(0),o=this._filter(`lowpass`,200,4);o.frequency.setValueAtTime(200,t),o.frequency.exponentialRampToValueAtTime(2200,t+.06),o.frequency.exponentialRampToValueAtTime(260,t+1),[61.7,65.4,92.5].forEach(e=>{let n=this._osc(`sawtooth`,e);n.connect(o),n.start(t),n.stop(t+1.2)}),o.connect(a),this._out(a,this.sfx,.5),this._env(a,t,.01,.24*e,.9,.1),n&&this.stun(.45,1.7)}_whisperVoice(e,t,n,r,i,a){let o=this._panner(t,n,r,.55,1.6);o.connect(this.sfx);let s=this._gain(.12);o.connect(s),s.connect(this.revSend);let c=this._noise(this.white),l=[0,1,2].map(e=>this._filter(`bandpass`,1e3,e?9:6)),u=this._gain(0);l.forEach((e,t)=>{let n=this._gain([1,.8,.45][t]*7);c.connect(e).connect(n).connect(u)});let d=this._filter(`bandpass`,4e3,1.3),f=this._gain(0);c.connect(d).connect(f);let p=this._filter(`bandpass`,1300,.7),m=this._gain(0);c.connect(p).connect(m);let h=this._gain(i),g=this._filter(`highpass`,260,.7);u.connect(h),f.connect(h),m.connect(h),h.connect(g).connect(o);let _=e;for(let[e,t,n,r=1]of a){if(e===`v`){let e=Ju[n];l.forEach((t,n)=>t.frequency.setTargetAtTime(e[n],_,.012)),u.gain.setTargetAtTime(.9*r,_,.02),u.gain.setTargetAtTime(0,_+t*.75,.03)}else e===`s`?(d.frequency.setValueAtTime(n,_),f.gain.setTargetAtTime(.75*r,_,.03),f.gain.setTargetAtTime(0,_+t*.8,.03)):e===`t`?(d.frequency.setValueAtTime(n||4800,_),f.gain.setValueAtTime(1.1*r,_),f.gain.setTargetAtTime(0,_+.004,.007)):e===`h`&&(m.gain.setTargetAtTime(.55*r,_,t*.3),m.gain.setTargetAtTime(0,_+t*.6,t*.15));_+=t}return c.start(e,Math.random()),c.stop(_+.4),_}whisper(e,t,n){if(!this.ready)return;let r=this.now,i=Wl()!==`en`,a=[[`h`,.3,null,.7]],o=3+Math.floor(Math.random()*3);for(let e=0;e<o;e++){let e=Math.random();e<.4?a.push([`t`,.03,4200+Math.random()*1500,.6]):e<.7?a.push([`s`,.09,Math.random()<.5?5500:3e3,.55]):a.push([`h`,.07,null,.6]),a.push([`v`,.1+Math.random()*.07,Yu[Math.floor(Math.random()*Yu.length)],.55+Math.random()*.2])}a.push([`_`,.28]),i?a.push([`s`,.4,2900,.8],[`_`,.12],[`t`,.035,4800],[`v`,.16,`i`],[`s`,.3,2800,.95],[`v`,.32,`e`,.85],[`h`,.4,null,.45]):a.push([`s`,.4,2900,.8],[`_`,.12],[`h`,.1,null,.9],[`v`,.2,`a`,.9],[`s`,.45,2800,.95],[`h`,.35,null,.4]),this._whisperVoice(r,e,t,n,.3,a);let s=this.listener,c=-s.fz,l=s.fx,u=(e-s.x)*c+(n-s.z)*l>=0?1:-1,d=s.x-s.fx*.45-c*u*.35,f=s.z-s.fz*.45-l*u*.35;this._whisperVoice(r+.06,d,t,f,.13,a)}branchSnap(e,t,n,r=1,i=!1){if(!this.ready)return;let a=this.now,o=this._panner(e,t,n,4,.8);o.connect(this.sfx);let s=this._gain(.6);o.connect(s),s.connect(this.revSend);let c=5+Math.floor(Math.random()*4),l=a;for(let e=0;e<c;e++){let t=r*(e===0?4:1.2+Math.random()*1.4);this._noiseBurst(l,{type:`highpass`,f:1200+Math.random()*2400,q:.8,a:4e-4,d:.01+Math.random()*.018,gain:t,dest:o}),l+=.005+Math.random()*(e===0?.02:.014)}if(this._noiseBurst(a,{f:900+Math.random()*600,q:6,a:8e-4,d:.09,gain:r*2.2,dest:o}),this._tone(a,{f:170,fEnd:70,a:.002,d:.1,gain:r*.5,dest:o}),i){let i=a+.85;this._tone(i,{f:75,fEnd:40,a:.003,d:.15,gain:.22*r,dest:o}),this._noiseBurst(i,{buf:this.brown,type:`lowpass`,f:600,a:.002,d:.09,gain:.3*r,dest:o}),this._noiseBurst(i+.006,{type:`highpass`,f:2800,a:.001,d:.05,gain:.2*r,dest:o}),this.exhale(e,t+.5,n,.32*r,a+1.5)}}runnerPass(e,t,n,r,i,a,o=1.1){if(!this.ready)return;let s=this.now,c=this._panner(e,t,n,3,1);c.positionX?(c.positionX.setValueAtTime(e,s),c.positionX.linearRampToValueAtTime(r,s+o),c.positionY.setValueAtTime(t,s),c.positionY.linearRampToValueAtTime(i,s+o),c.positionZ.setValueAtTime(n,s),c.positionZ.linearRampToValueAtTime(a,s+o)):c.setPosition((e+r)/2,(t+i)/2,(n+a)/2),c.connect(this.sfx);let l=this._gain(.25);c.connect(l),l.connect(this.revSend);let u=Math.round(o*7);for(let e=0;e<u;e++){let t=s+e/7+Math.random()*.02;this._noiseBurst(t,{buf:this.brown,type:`lowpass`,f:700,q:.7,a:.002,d:.08,gain:1.6,dest:c}),this._noiseBurst(t+.005,{type:`highpass`,f:2600+Math.random()*1500,q:.7,a:.001,d:.05,gain:.55,dest:c})}let d=this._noise(this.pink),f=this._filter(`bandpass`,760,1.4),p=this._gain(0);d.connect(f).connect(p).connect(c);for(let e=s;e<s+o;e+=.19)p.gain.setValueAtTime(1e-4,e),p.gain.linearRampToValueAtTime(.65,e+.06),p.gain.linearRampToValueAtTime(1e-4,e+.17);d.start(s,Math.random()),d.stop(s+o+.1);let m=s+o*.45,h=this._voice(m,{f0:[[0,135],[.28,100]],vowel:`a`,dur:.32,vib:[11,50],jitter:80,rasp:.6,q:4,fg:3}),g=this._gain(0),_=this._shaper(this.distSoft);h.connect(_).connect(g).connect(c),this._env(g,m,.02,.85,.26,.05)}jumpscare(e=1){if(!this.ready)return;let t=this.now,n=e>.7,r=n?e:e*.6,i=this.deathBus;n||(i=this._gain(.4),i.connect(this.deathBus)),this._tone(t,{f:120,fEnd:24,a:.002,d:1.2,gain:1*r,dest:i}),this._noiseBurst(t,{buf:this.brown,type:`lowpass`,f:320,q:.8,a:.001,d:.3,gain:1.4*r,dest:i}),this._noiseBurst(t,{type:`highpass`,f:2500,q:.7,a:5e-4,d:.04,gain:.9*r,dest:i});let a=this._gain(1),o=this._gain(1),s=this._shaper(n?this.distScream:this.distSoft),c=this._filter(`highpass`,170,.7),l=this._gain(0);a.connect(o).connect(s).connect(c).connect(l).connect(i);let u=this._gain(.5);if(l.connect(u),u.connect(this.revSend),n){let e=this._osc(`square`,14),n=this._gain(.55);e.connect(n).connect(o.gain),e.start(t),e.stop(t+.6)}if([560,650,800].forEach((e,n)=>{let r=e*(.97+Math.random()*.06),i=this._voice(t,{f0:[[0,r*.82],[.07,r*1.18],[.5,r*1.06],[1.45,r*.58]],vowel:[[0,`A`],[.6,`A`],[1.4,`o`]],dur:1.5,vib:[9+n*1.7,55],jitter:45,rasp:.5,q:5,fg:4}),o=this._gain(.34);i.connect(o).connect(a)}),this._env(l,t,.004,.95*r,1.05,.42),n){let e=this._osc(`sawtooth`,2350);e.frequency.exponentialRampToValueAtTime(1500,t+.6);let n=this._ring(e,1730,t,.6),a=this._filter(`bandpass`,3200,1.1),o=this._gain(0);n.connect(a).connect(o).connect(i),this._env(o,t,.003,.42*r,.5,.05),e.start(t),e.stop(t+.65)}this._noiseBurst(t,{f:5200,fEnd:700,q:.7,a:.002,d:.5,gain:.55*r,dest:i}),this.duck(1e-4,.05,3,3),n?(this.stun(1,3.8),this.tinnitus(t+.35,3.6,.022),this.heartbeat(.55,t+2.3,i),this.heartbeat(.32,t+3.9,i)):this.stun(.4,1.8)}startAmbience(){if(!this.ready||this.ambOn)return;this.ambOn=!0;let e=this.now,t=this._noise(this.brown),n=this._filter(`bandpass`,380,.6),r=this._gain(.3),i=this._osc(`sine`,.07),a=this._gain(170);i.connect(a).connect(n.frequency);let o=this._osc(`sine`,.113),s=this._gain(.18);o.connect(s).connect(r.gain),t.connect(n).connect(r).connect(this.amb),t.start(e),i.start(e),o.start(e);let c=this._noise(this.pink),l=this._filter(`bandpass`,1650,14),u=this._gain(.05),d=this._osc(`sine`,.05),f=this._gain(400);d.connect(f).connect(l.frequency),c.connect(l).connect(u).connect(this.amb),c.start(e),d.start(e);let p=this._gain(.07),m=this._filter(`lowpass`,240,.7);m.connect(p).connect(this.amb),[41.2,41.75,82.9].forEach((t,n)=>{let r=this._osc(n===2?`triangle`:`sine`,t);r.connect(m),r.start(e)});let h=this._gain(0),g=this._filter(`lowpass`,500,.8);g.connect(h).connect(this.amb),[82.41,87.31,116.54,123.47,174.61].forEach(t=>{let n=this._osc(`sawtooth`,t);n.detune.value=(Math.random()-.5)*18;let r=this._osc(`sine`,.05+Math.random()*.12),i=this._gain(.5),a=this._gain(.5);r.connect(i).connect(a.gain),n.connect(a).connect(g),n.start(e),r.start(e)});let _=this._gain(0);[31,33.1].forEach(t=>{let n=this._osc(`sine`,t);n.connect(_),n.start(e)}),_.connect(this.amb);let v=this._gain(0);[2093,2117.5].forEach(t=>{let n=this._osc(`sine`,t);n.connect(v),n.start(e)}),v.connect(this.amb),this.ambNodes={wg:r,dg:p,tg:h,tlp:g,sub:_,glass:v},this.nextAmbEvent=e+4}setAmbience(e,t=0){if(!this.ctx)return;let n=this.now;this.amb.gain.setTargetAtTime(e,n,.8);let r=this.ambNodes;r&&(r.dg.gain.setTargetAtTime(.06+t*.12,n,1.5),r.tg.gain.setTargetAtTime(Xu(.2,.9,t)*.06,n,.9),r.tlp.frequency.setTargetAtTime(420+t*1500,n,1),r.sub.gain.setTargetAtTime(t*t*.16,n,.8),r.glass.gain.setTargetAtTime(Xu(.3,.6,t)*(1-Xu(.8,1,t))*.005,n,1.2))}ambientEvent(e=0,t=null){if(!this.ready)return;let n=this.listener,r=t;if(!r){if(Math.random()<.22+e*.5)r=[`knocks`,`scream`,`steps`,`groan`][Math.floor(Math.random()*4)];else{let e=Math.random();r=e<.25?`owl`:e<.45?`howl`:e<.7?`creak`:e<.87?`snap`:`leaves`}}let i=r===`knocks`||r===`scream`||r===`steps`||r===`groan`,a=Math.random()*Math.PI*2,o=i?22+Math.random()*20:30+Math.random()*40,s=n.x+Math.cos(a)*o,c=n.z+Math.sin(a)*o,l=n.y+4,u=this.now,d=this._panner(s,l,c,6,.7);d.connect(this.amb);let f=this._gain(.8);if(d.connect(f),f.connect(this.revSend),r===`owl`)for(let e=0;e<2;e++){let t=this._osc(`sine`,390),n=this._gain(),r=u+e*.45;t.frequency.setValueAtTime(360,r),t.frequency.linearRampToValueAtTime(410,r+.08),t.frequency.linearRampToValueAtTime(330,r+.35),t.connect(n).connect(d),this._env(n,r,.04,.25,.3),t.start(r),t.stop(r+.5)}else if(r===`howl`){let e=this._osc(`sine`,380),t=this._gain(),n=this._osc(`sine`,5),r=this._gain(12);n.connect(r).connect(e.frequency),e.frequency.setValueAtTime(300,u),e.frequency.linearRampToValueAtTime(560,u+.9),e.frequency.linearRampToValueAtTime(380,u+2.8),e.connect(t).connect(d),this._env(t,u,.5,.18,1.6,.8),e.start(u),n.start(u),e.stop(u+3.2),n.stop(u+3.2)}else if(r===`creak`){let e=this._osc(`sawtooth`,110),t=this._filter(`bandpass`,700,9),n=this._gain();e.frequency.setValueAtTime(95,u),e.frequency.linearRampToValueAtTime(150,u+1.4);let r=this._osc(`square`,24),i=this._gain(30);r.connect(i).connect(e.frequency),e.connect(t).connect(n).connect(d),this._env(n,u,.3,.14,.6,.8),e.start(u),r.start(u),e.stop(u+1.9),r.stop(u+1.9)}else if(r===`snap`)this.branchSnap(s,l,c,.35);else if(r===`leaves`){let e=this._noise(this.pink),t=this._filter(`bandpass`,3200,.8),n=this._gain();e.connect(t).connect(n).connect(d),this._env(n,u,.6,.2,1.2,.4),e.start(u,Math.random()),e.stop(u+2.4)}else if(r===`knocks`){let e=2+Math.floor(Math.random()*2),t=210+Math.random()*70;for(let n=0;n<e;n++){let e=u+n*(.34+Math.random()*.08);this._tone(e,{f:t,fEnd:t*.9,a:.001,d:.17,gain:.9,dest:d}),this._tone(e,{f:t*2.7,fEnd:t*2.5,a:.001,d:.06,gain:.3,dest:d}),this._noiseBurst(e,{type:`highpass`,f:1500,a:5e-4,d:.014,gain:.55,dest:d})}}else if(r===`scream`){let e=this._voice(u,{f0:[[0,880],[.3,1080],[1.7,500]],vowel:[[0,`A`],[1.5,`o`]],dur:1.8,vib:[6,45],jitter:30,rasp:.3,q:6,fg:3}),t=this._filter(`lowpass`,2200,.7),n=this._gain(0);e.connect(t).connect(n).connect(d);let r=this._gain(1.2);n.connect(r),r.connect(this.revSend),this._env(n,u,.08,.55,1.2,.5)}else if(r===`steps`){let e=Math.random()<.5?-1:1,t=n.x+Math.cos(a+e*.5)*o,r=n.z+Math.sin(a+e*.5)*o;d.positionX&&(d.positionX.setValueAtTime(s,u),d.positionX.linearRampToValueAtTime(t,u+3.2),d.positionZ.setValueAtTime(c,u),d.positionZ.linearRampToValueAtTime(r,u+3.2),d.positionY.setValueAtTime(n.y,u));for(let e=0;e<6;e++){let t=u+e*(.55+Math.random()*.08);this._noiseBurst(t,{buf:this.brown,type:`lowpass`,f:650,a:.002,d:.1,gain:3.2,dest:d}),this._noiseBurst(t+.008,{type:`highpass`,f:2400,a:.001,d:.06,gain:1,dest:d})}}else if(r===`groan`){let e=this._osc(`sawtooth`,46);e.frequency.linearRampToValueAtTime(58,u+2.4);let t=this._osc(`sine`,7),n=this._gain(4);t.connect(n).connect(e.frequency);let r=this._filter(`bandpass`,260,6);r.frequency.linearRampToValueAtTime(430,u+2.4);let i=this._filter(`bandpass`,1450,8),a=this._ring(e,173,u,2.9),o=this._gain(0);e.connect(r).connect(o),a.connect(i).connect(o),o.connect(d),this._env(o,u,.6,5,1.2,.9),e.start(u),t.start(u),e.stop(u+2.9),t.stop(u+2.9)}}update(e,t=0){if(!this.ready)return;let n=this.now;if(this.ambOn&&n>this.nextAmbEvent&&(this.ambientEvent(t),this.nextAmbEvent=n+7+Math.random()*14),e>.05){if(n>this.nextBeat){this.heartbeat(.25+e*.55);let t=62+e*90;this.nextBeat=n+60/t}}else this.nextBeat=Math.max(this.nextBeat,n)}dawn(){if(!this.ready)return;let e=this.now;[220,277.2,329.6,440,554.4].forEach((t,n)=>this._tone(e+n*.4,{f:t,a:2.5,d:5,hold:2,gain:.05,rev:.6}));for(let t=0;t<14;t++){let t=e+1.5+Math.random()*7,n=2800+Math.random()*1800;this._tone(t,{f:n,fEnd:n*(.7+Math.random()*.6),a:.01,d:.12,gain:.04}),this._tone(t+.15,{f:n*1.1,fEnd:n*.8,a:.01,d:.1,gain:.03})}}setMorning(e){if(this.morning=e,!this.ctx)return;let t=this.now,n=this.ambNodes;n&&(n.dg.gain.cancelScheduledValues(t),n.dg.gain.setTargetAtTime(e?0:.07,t,e?.2:2.5),n.tg.gain.setTargetAtTime(0,t,.3),n.sub.gain.setTargetAtTime(0,t,.3)),e&&(this.nextBird=t+.4)}morningTick(){if(!this.ready||!this.morning)return;let e=this.now;e<(this.nextBird||0)||(this.nextBird=e+.3+Math.random()*1.5,this.bird())}bird(e=null){if(!this.ready)return;let t=this.listener,n=Math.random();e=e||(n<.4?`chirp`:n<.64?`trill`:n<.84?`tsee`:n<.92?`cuckoo`:`pecker`);let r=e===`cuckoo`||e===`pecker`,i=Math.random()*Math.PI*2,a=r?35+Math.random()*25:10+Math.random()*28,o=t.x+Math.cos(i)*a,s=t.z+Math.sin(i)*a,c=t.y+3+Math.random()*7,l=this._panner(o,c,s,6,.6),u=this._gain(6);u.connect(l),l.connect(this.amb);let d=this._gain(.35);l.connect(d),d.connect(this.revSend);let f=this.now,p=u;if(e===`chirp`){let e=2+Math.floor(Math.random()*4),t=3e3+Math.random()*2200,n=Math.random()<.5;for(let r=0;r<e;r++){let e=f+r*(.07+Math.random()*.05),i=t*(1+(Math.random()-.5)*.12);this._tone(e,{f:i,fEnd:i*(n?1.35:.7),a:.004,d:.055,gain:.07,dest:p})}}else if(e===`trill`){let e=.5+Math.random()*.6,t=this._osc(`sine`,3800+Math.random()*1200),n=this._osc(`sine`,24+Math.random()*10),r=this._gain(500+Math.random()*400);n.connect(r).connect(t.frequency);let i=this._gain(0);t.connect(i).connect(p),this._env(i,f,.05,.05,e*.6,e*.3),t.start(f),n.start(f),t.stop(f+e+.1),n.stop(f+e+.1)}else if(e===`tsee`){let e=2+Math.floor(Math.random()*2),t=5600+Math.random()*900,n=t*.72;for(let r=0;r<e;r++){let e=f+r*.36;this._tone(e,{f:t,fEnd:t*.96,a:.01,d:.1,gain:.05,dest:p}),this._tone(e+.15,{f:n,fEnd:n*.9,a:.01,d:.12,gain:.05,dest:p})}}else if(e===`cuckoo`)this._tone(f,{type:`triangle`,f:680,fEnd:650,a:.04,d:.22,gain:.1,dest:p}),this._tone(f+.34,{type:`triangle`,f:560,fEnd:530,a:.04,d:.3,gain:.09,dest:p});else{let e=12+Math.floor(Math.random()*8),t=900+Math.random()*400;for(let n=0;n<e;n++){let r=f+n*.055;this._tone(r,{f:t,fEnd:t*.85,a:.001,d:.025,gain:.16*(1-n/(e*1.6)),dest:p})}}}dusk(){if(!this.ready)return;this.setMorning(!1);let e=this.now;this.duck(.03,.5,2.2,4),this._noiseBurst(e,{buf:this.pink,type:`lowpass`,f:260,fEnd:2600,a:1.7,d:.05,gain:.22,dest:this.body});let t=e+1.8;this._tone(t,{f:52,fEnd:21,a:.008,d:2.8,gain:.95,dest:this.body}),this._noiseBurst(t,{buf:this.brown,type:`lowpass`,f:220,a:.01,d:2.4,gain:1.4,dest:this.body,rev:.9}),this._noiseBurst(t,{type:`bandpass`,f:900,q:.7,a:.004,d:.5,gain:.25,dest:this.body,rev:.6}),[3136,3322].forEach(e=>this._tone(t,{f:e,a:.002,d:2.2,gain:.012,dest:this.body}))}genHum(e,t,n,r=!1){if(!this.ready)return null;let i=this.now,a=this._panner(e,t,n,2.5,1.15);a.connect(this.amb);let o=this._gain(0);o.connect(a);let s=this._osc(`sawtooth`,52),c=this._osc(`sawtooth`,104.5),l=this._filter(`lowpass`,460,1.3),u=this._gain(.6),d=this._osc(`square`,13),f=this._gain(.38);d.connect(f).connect(u.gain),s.connect(l),c.connect(l),l.connect(u).connect(o);let p=this._noise(this.white),m=this._filter(`bandpass`,2300,1.5),h=this._gain(.035);p.connect(m).connect(h).connect(u);let g=[s,c,d,p];g.forEach(e=>e.start(i));let _=this,v=(e,t=.25)=>{let n=_.now;s.frequency.setTargetAtTime(30+22*e,n,t),c.frequency.setTargetAtTime(60+44.5*e,n,t),d.frequency.setTargetAtTime(6+7*e,n,t),l.frequency.setTargetAtTime(260+200*e,n,t),o.gain.setTargetAtTime(.03+.17*e,n,t)};r?v(.05,.05):v(1,.4);let y=!1;return{spin(e){y||v(Math.min(1,Math.max(0,e)),.3)},sputter(){if(y)return;let e=_.now;for(let t=0;t<7;t++){let n=e+t*.19;o.gain.setValueAtTime(t%2?.04:.2*(1-t/9),n),s.frequency.setValueAtTime(52-t*4.2,n),d.frequency.setValueAtTime(13-t*1.3,n)}o.gain.setTargetAtTime(0,e+1.35,.12)},stop(){if(y)return;y=!0;let e=_.now;o.gain.cancelScheduledValues(e),o.gain.setTargetAtTime(0,e,.15),g.forEach(t=>{try{t.stop(e+.8)}catch{}})}}}genStart(e,t,n){if(!this.ready)return;let r=this.now,i=this._panner(e,t,n,4,.9);i.connect(this.sfx);let a=this._gain(.4);i.connect(a),a.connect(this.revSend);let o=this._osc(`sawtooth`,170);o.frequency.exponentialRampToValueAtTime(420,r+.6);let s=this._filter(`bandpass`,900,2),c=this._gain(0);o.connect(s).connect(c).connect(i),this._env(c,r,.04,.22,.12,.45),o.start(r),o.stop(r+.7),[.22,.46].forEach(e=>this._noiseBurst(r+e,{buf:this.brown,type:`lowpass`,f:320,a:.005,d:.16,gain:1.6,dest:i})),this._noiseBurst(r+.68,{buf:this.brown,type:`lowpass`,f:420,a:.004,d:.3,gain:2,dest:i}),this._noiseBurst(r+.7,{type:`highpass`,f:3e3,a:6e-4,d:.02,gain:.5,dest:i}),this._tone(r+.85,{f:3700,a:.001,d:.35,gain:.05,dest:i}),[100,150].forEach((e,t)=>this._tone(r+.8,{f:e,a:.3,d:1.2,hold:.4,gain:t?.03:.05,dest:i})),[196,246.9,293.7,370].forEach((e,t)=>this._tone(r+.75+t*.06,{type:`triangle`,f:e,a:.6,d:2.6,hold:.4,gain:.035,dest:this.body,rev:.7}))}cordPull(e,t,n,r=!1){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,2.5,1.1);if(a.connect(this.sfx),this._noiseBurst(i,{type:`bandpass`,f:1100,fEnd:3600,q:2,a:.03,d:.18,gain:.5,dest:a}),!r){for(let e=0;e<4;e++)this._noiseBurst(i+.18+e*.075,{buf:this.brown,type:`lowpass`,f:300,a:.004,d:.07,gain:1*(1-e/4.5),dest:a});this._noiseBurst(i+.5,{buf:this.pink,type:`bandpass`,f:500,q:.8,a:.05,d:.5,gain:.15,dest:a})}}clank(e,t,n,r=.6){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,2.5,1.2);a.connect(this.sfx);let o=480+Math.random()*380;[[1,.32,.22],[2.76,.18,.14],[5.4,.09,.08],[8.93,.05,.05]].forEach(([e,t,n])=>{this._tone(i,{f:o*e,a:.001,d:t*(.7+r*.6),gain:n*r*2,dest:a})}),this._noiseBurst(i,{type:`highpass`,f:2800,a:5e-4,d:.012,gain:.9*r,dest:a})}glug(e,t,n){if(!this.ready)return;let r=this.now,i=this._panner(e,t,n,2,1.3);i.connect(this.sfx);let a=3+Math.floor(Math.random()*4);for(let e=0;e<a;e++){let t=r+e*(.09+Math.random()*.06),n=180+Math.random()*140;this._tone(t,{f:n,fEnd:n*2.1,a:.004,d:.05,gain:.18,dest:i})}this._noiseBurst(r,{buf:this.pink,type:`lowpass`,f:700,a:.08,d:.4,hold:.2,gain:.25,dest:i})}spark(e,t,n){if(!this.ready)return;let r=this.now,i=this._panner(e,t,n,3,1);i.connect(this.sfx);let a=this._gain(.3);i.connect(a),a.connect(this.revSend),this._noiseBurst(r,{type:`highpass`,f:2200,a:4e-4,d:.035,gain:2.2,dest:i});let o=this._osc(`sawtooth`,118),s=this._filter(`bandpass`,1700,2.2),c=this._ring(o,61,r,.4),l=this._gain(0);c.connect(s).connect(l).connect(i),this._env(l,r,.002,.5,.25,.05),o.start(r),o.stop(r+.4),this._noiseBurst(r+.02,{type:`highpass`,f:6e3,a:.01,d:.45,gain:.18,dest:i})}beacon(e,t,n){if(!this.ready)return;let r=this.now,i=this._panner(e,t,n,8,.45);i.connect(this.sfx),this._noiseBurst(r,{type:`bandpass`,f:2600,q:1.2,a:.004,d:.1,gain:.26,dest:i}),this._tone(r+.05,{type:`square`,f:1318.5,a:.003,d:.06,hold:.04,gain:.12,dest:i}),this._tone(r+.19,{type:`square`,f:987.8,a:.003,d:.08,hold:.04,gain:.12,dest:i})}flies(e,t,n){if(!this.ready)return null;let r=this.now,i=this._panner(e,t,n,1.1,1.5);i.connect(this.amb);let a=this._filter(`bandpass`,620,1.2),o=this._gain(0);a.connect(o).connect(i);let s=[];[188,212,243].forEach(e=>{let t=this._osc(`sawtooth`,e),n=this._osc(`sine`,6+Math.random()*8),r=this._gain(14+Math.random()*10);n.connect(r).connect(t.frequency);let i=this._gain(.33),o=this._osc(`sine`,.3+Math.random()*.6),c=this._gain(.3);o.connect(c).connect(i.gain),t.connect(i).connect(a),s.push(t,n,o)}),s.forEach(e=>e.start(r)),o.gain.setTargetAtTime(.36,r,.6);let c=this;return{stop(){let e=c.now;o.gain.setTargetAtTime(0,e,.3),s.forEach(t=>{try{t.stop(e+1.5)}catch{}})}}}discover(e,t,n){if(!this.ready)return;let r=this.now,i=this._gain(0),a=this._filter(`lowpass`,650,.8);i.connect(a),this._out(a,this.body,.5),[110,116.5].forEach(e=>{let t=this._osc(`sawtooth`,e);t.connect(i),t.start(r),t.stop(r+3)}),this._env(i,r,.7,.05,1.9,.2),this._tone(r+.2,{f:1975,a:.6,d:1.6,gain:.006,dest:this.body})}paper(){if(!this.ready)return;let e=this.now;this._noiseBurst(e,{type:`bandpass`,f:1400,q:.8,a:.06,d:.18,gain:.12,dest:this.body});for(let t=0;t<5;t++)this._noiseBurst(e+.05+t*(.04+Math.random()*.05),{type:`highpass`,f:2600+Math.random()*2e3,a:.001,d:.02+Math.random()*.03,gain:.16,dest:this.body})}watcherPresence(e,t=0,n=0,r=0,i=!1){if(!this.ready)return;if(!this.wNodes){if(e<=0)return;let i=this.now,a=this._panner(t,n,r,4,1);a.connect(this.amb);let o=this._gain(1);o.connect(a);let s=this._gain(0),c=this._gain(0),l=this._gain(0);[1760,1767.3].forEach(e=>{let t=this._osc(`sine`,e);t.connect(s),t.start(i)});let u=this._noise(this.pink),d=this._filter(`bandpass`,2600,3),f=this._gain(.6),p=this._osc(`sine`,.35),m=this._gain(.4);p.connect(m).connect(f.gain),u.connect(d).connect(f).connect(c),u.start(i),p.start(i);let h=this._filter(`lowpass`,320,.8);[73.4,77.8].forEach(e=>{let t=this._osc(`sawtooth`,e);t.connect(h),t.start(i)}),h.connect(l),[s,c,l].forEach(e=>e.connect(o)),this.wNodes={pn:a,g1:s,g2:c,g3:l,level:0}}let a=this.wNodes;if(e<=0&&a.level<=0)return;a.level=e;let o=this.now;a.g1.gain.setTargetAtTime(e*e*.03,o,.4),a.g2.gain.setTargetAtTime(e*(i?.14:.04),o,.25),a.g3.gain.setTargetAtTime(e*.1,o,.5),e>0&&a.pn.positionX&&(a.pn.positionX.setTargetAtTime(t,o,.1),a.pn.positionY.setTargetAtTime(n,o,.1),a.pn.positionZ.setTargetAtTime(r,o,.1))}crack(e,t,n,r=.5){if(!this.ready)return;let i=this.now,a=this._panner(e,t,n,2,1.2);a.connect(this.sfx);let o=2+Math.floor(Math.random()*3),s=i;for(let e=0;e<o;e++)this._noiseBurst(s,{type:`bandpass`,f:1600+Math.random()*1800,q:4,a:5e-4,d:.008+Math.random()*.01,gain:r*3.2,dest:a}),s+=.015+Math.random()*.035;this._tone(i,{f:150,fEnd:90,a:.001,d:.05,gain:r*.3,dest:a})}watcherSting(){if(!this.ready)return;let e=this.now;this._tone(e,{f:60,fEnd:24,a:.004,d:1.2,gain:.7});let t=this._gain(0),n=this._filter(`lowpass`,7500,.7);t.connect(n),this._out(n,this.sfx,.9),[1568,1661.2,1760,2093,2217.5].forEach((n,r)=>{let i=this._osc(`sawtooth`,n),a=this._osc(`sine`,7+Math.random()*3),o=this._gain(20+r*6);a.connect(o).connect(i.detune),i.frequency.exponentialRampToValueAtTime(n*1.03,e+1.2);let s=this._gain(.06);i.connect(s).connect(t),i.start(e),a.start(e),i.stop(e+1.5),a.stop(e+1.5)}),this._env(t,e,.006,.9,1.2,.08),this._noiseBurst(e,{type:`highpass`,f:4e3,a:.002,d:.4,gain:.15,rev:.6})}watcherArrive(){if(!this.ready)return;let e=this.listener,t=Math.random()*Math.PI*2,n=e.x+Math.cos(t)*40,r=e.z+Math.sin(t)*40,i=this._panner(n,e.y+3,r,12,.6);i.connect(this.sfx);let a=this._gain(.8);i.connect(a),a.connect(this.revSend);let o=this.now;[1244.5,1864.7].forEach((e,t)=>{let n=this._osc(`sine`,e),r=this._osc(`sine`,4.5),a=this._gain(9);r.connect(a).connect(n.detune);let s=this._gain(0);n.connect(s).connect(i),this._env(s,o,1.4,t?.05:.09,2.2,1.6),n.start(o),r.start(o),n.stop(o+5.4),r.stop(o+5.4)})}howlerInhale(e,t,n){if(!this.ready)return;let r=this.now,i=1.8,a=this._panner(e,t,n,7,.6);a.connect(this.sfx);let o=this._gain(.5);a.connect(o),o.connect(this.revSend);let s=this._noise(this.pink),c=this._filter(`bandpass`,260,1.4);c.frequency.exponentialRampToValueAtTime(1150,r+i);let l=this._gain(0);s.connect(c).connect(l).connect(a),l.gain.setValueAtTime(1e-4,r),l.gain.exponentialRampToValueAtTime(1.3,r+i-.05),l.gain.linearRampToValueAtTime(1e-4,r+i),s.start(r,Math.random()),s.stop(r+i+.05);let u=this._osc(`sawtooth`,36);u.frequency.linearRampToValueAtTime(44,r+i);let d=this._filter(`lowpass`,170,1),f=this._gain(0);u.connect(d).connect(f).connect(a),f.gain.setValueAtTime(1e-4,r),f.gain.exponentialRampToValueAtTime(.5,r+i-.05),f.gain.linearRampToValueAtTime(1e-4,r+i),u.start(r),u.stop(r+i+.05),this.duck(.25,.6,1.2000000000000002,1.5)}howlerHowl(e,t,n,r=1){if(!this.ready)return;let i=this.now,a=this.ctx,o=this._panner(e,t,n,10,.45);o.connect(this.sfx);let s=this.listener,c=Math.hypot(e-s.x,n-s.z),l=Math.sqrt(10/(10+.45*Math.max(0,c-10))),u=a.createDelay(1.5);u.delayTime.value=.55;let d=this._filter(`lowpass`,1200,.7),f=this._gain(.4);u.connect(d).connect(f).connect(u);let p=this._gain(.45*l);d.connect(p),p.connect(this.sfx),p.connect(this.revSend),this.offline||setTimeout(()=>{try{u.disconnect(),f.disconnect()}catch{}},8e3);let m=this._gain(0),h=this._shaper(this.distScream),g=this._gain(.55);m.connect(h).connect(g),g.connect(o),g.connect(u);let _=this._gain(.9*l);g.connect(_),_.connect(this.revSend);let v=this._voice(i,{f0:[[0,92],[.3,150],[1.3,126],[2.1,66]],vowel:[[0,`o`],[.35,`A`],[1.5,`u`]],dur:2.2,vib:[4.5,45],jitter:45,rasp:.6,q:5,fg:3}),y=this._gain(.7);v.connect(y).connect(m);let b=this._voice(i,{f0:[[0,300],[.3,470],[1.3,410],[2.1,220]],vowel:[[0,`A`],[1.2,`o`]],dur:2.2,vib:[5.5,60],jitter:40,rasp:.3,q:6,fg:3}),x=this._gain(.35);b.connect(x).connect(m),this._env(m,i,.12,.55*r,1.2,.8);let S=this._osc(`sine`,46);S.frequency.exponentialRampToValueAtTime(32,i+2.2);let C=this._gain(0);S.connect(C).connect(o),this._env(C,i,.1,.7*r,1.6,.5),S.start(i),S.stop(i+2.3)}howlerBark(e,t,n){if(!this.ready)return;let r=this.now,i=this._panner(e,t,n,6,.7);i.connect(this.sfx);let a=this._gain(0),o=this._shaper(this.distScream),s=this._gain(.5);a.connect(o).connect(s).connect(i);let c=this._gain(.4);s.connect(c),c.connect(this.revSend),this._voice(r,{f0:[[0,120],[.08,175],[.38,85]],vowel:[[0,`A`],[.3,`o`]],dur:.42,jitter:60,rasp:.8,q:5,fg:3}).connect(a),this._env(a,r,.015,.6,.3,.05)}uiHover(){if(!this.ready)return;let e=this.now,t=this._osc(`sine`,1900),n=this._gain();t.connect(n).connect(this.ui),this._env(n,e,.002,.08,.04),t.start(e),t.stop(e+.08)}uiClick(){if(!this.ready)return;let e=this.now,t=this._osc(`sine`,700);t.frequency.exponentialRampToValueAtTime(1500,e+.08);let n=this._gain();t.connect(n).connect(this.ui),this._env(n,e,.003,.18,.14),t.start(e),t.stop(e+.2)}},td=`
class HushRecorder extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(2048); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === 2048) { this.port.postMessage(this.buf.slice(0)); this.n = 0; }
      }
    }
    return true;
  }
}
registerProcessor('hush-recorder', HushRecorder);
`,nd=class e{constructor(){this.state=`off`,this.db=-100,this.floor=-58,this.trig=-45,this.screamDb=-18,this.loud=0,this.meter=0,this.peakLoud=0,this.active=!1,this.pending=!1,this.windowMax=0,this.onsetT=0,this.sinceEmit=0,this.releaseT=0,this.screamHeld=0,this.calib=[],this.calibrated=!1,this.snippets=[],this.ring=null,this.ringPos=0,this.capStart=-1,this.enabledEcho=G.voiceEcho,this.lostFlag=!1}static inIframe(){try{return window.self!==window.top}catch{return!0}}async start(t){if(this.state===`on`||this.state===`pending`)return this.state===`on`;if(this.engine=t,!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.isSecureContext)return this.state=`unsupported`,!1;try{let e=document.permissionsPolicy||document.featurePolicy;if(e&&e.allowsFeature&&!e.allowsFeature(`microphone`))return this.state=`blocked`,!1}catch{}this.state=`pending`;let n;try{n=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!1,autoGainControl:!1,channelCount:1}})}catch(t){return this.state=e.inIframe()&&(t.name===`NotAllowedError`||t.name===`SecurityError`)?`blocked`:`denied`,!1}let r=t.ctx;this.stream=n,this.src=r.createMediaStreamSource(n),this.analyser=r.createAnalyser(),this.analyser.fftSize=1024,this.analyser.smoothingTimeConstant=0,this.buf=new Float32Array(this.analyser.fftSize),this.src.connect(this.analyser);let i=n.getAudioTracks()[0],a=i&&i.getSettings?i.getSettings().echoCancellation:!1;this.leak=a?-26:-11,this.gate=r.createGain(),this.gate.gain.value=0;let o=r.createBiquadFilter();o.type=`highpass`,o.frequency.value=220,this.src.connect(this.gate),this.gate.connect(o),this.echoOut=r.createGain(),this.echoOut.gain.value=+!!this.enabledEcho,this.echoOut.connect(t.echoBus);for(let[e,t,n,i]of[[.32,3200,-.55,.36],[.66,2100,.6,.24],[1.08,1300,.05,.15],[1.55,900,-.3,.08]]){let a=r.createDelay(2);a.delayTime.value=e;let s=r.createBiquadFilter();s.type=`lowpass`,s.frequency.value=t;let c=r.createStereoPanner();c.pan.value=n;let l=r.createGain();l.gain.value=i,o.connect(a).connect(s).connect(c).connect(l).connect(this.echoOut)}let s=r.createGain();s.gain.value=.35,o.connect(s),s.connect(this.echoOut);let c=r.createGain();c.gain.value=.5,this.echoOut.connect(c),c.connect(t.revSend);try{if(r.audioWorklet){let e=URL.createObjectURL(new Blob([td],{type:`application/javascript`}));await r.audioWorklet.addModule(e),this.rec=new AudioWorkletNode(r,`hush-recorder`,{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]}),this.ring=new Float32Array(Math.floor(r.sampleRate*3)),this.rec.port.onmessage=e=>this._push(e.data);let t=r.createGain();t.gain.value=0,this.src.connect(this.rec),this.rec.connect(t).connect(r.destination)}}catch{this.rec=null}return i&&(i.onended=()=>{this.state=`off`,this.lostFlag=!0}),this.calib=[],this.calibrated=!1,this.state=`on`,!0}stop(){this.stream&&this.stream.getTracks().forEach(e=>e.stop());try{this.src&&this.src.disconnect(),this.rec&&this.rec.disconnect()}catch{}this.stream=null,this.state=`off`,this.loud=0,this.meter=0,this.active=!1}setEcho(e){this.enabledEcho=e,this.echoOut&&this.echoOut.gain.setTargetAtTime(+!!e,this.engine.now,.05)}recalibrate(){this.calib=[],this.calibrated=!1}_push(e){let t=this.ring;if(t)for(let n=0;n<e.length;n++)t[this.ringPos]=e[n],this.ringPos=(this.ringPos+1)%t.length}_captureBegin(){if(!this.ring)return;let e=Math.floor(this.engine.ctx.sampleRate*.12);this.capStart=(this.ringPos-e+this.ring.length)%this.ring.length}_captureEnd(){if(!this.ring||this.capStart<0)return;let e=this.ring,t=(this.ringPos-this.capStart+e.length)%e.length,n=this.engine.ctx.sampleRate;if(t=Math.min(t+Math.floor(n*.1),Math.floor(n*1.8)),t<n*.15){this.capStart=-1;return}let r=this.engine.ctx.createBuffer(1,t,n),i=r.getChannelData(0),a=0;for(let n=0;n<t;n++){let t=e[(this.capStart+n)%e.length];i[n]=t,Math.abs(t)>a&&(a=Math.abs(t))}let o=a>.001?.7/a:1,s=Math.floor(n*.03);for(let e=0;e<t;e++){let n=1;e<s?n=e/s:e>t-s&&(n=(t-e)/s),i[e]*=o*n}this.snippets.push(r),this.snippets.length>5&&this.snippets.shift(),this.capStart=-1}mimic(e,t,n,r=.8){let i=this.engine;if(!i||!i.ready||!this.snippets.length)return!1;let a=i.ctx,o=i.now,s=this.snippets[Math.floor(Math.random()*this.snippets.length)],c=.72+Math.random()*.1,l=a.createBufferSource();l.buffer=s,l.playbackRate.value=c,l.detune.setValueAtTime(0,o),l.detune.linearRampToValueAtTime(-250,o+s.duration*1.3);let u=a.createBiquadFilter();u.type=`lowpass`,u.frequency.value=2400;let d=a.createWaveShaper();d.curve=i.distSoft;let f=a.createGain();f.gain.value=r;let p=i._panner(e,t,n,3,.9);l.connect(u).connect(d).connect(f).connect(p),p.connect(i.sfx);let m=a.createGain();m.gain.value=.7,f.connect(m),m.connect(i.revSend),l.start(o);let h=a.createBufferSource();h.buffer=s,h.playbackRate.value=c*.8,h.detune.setValueAtTime(0,o),h.detune.linearRampToValueAtTime(-400,o+s.duration*1.6);let g=a.createGain();g.gain.value=0;let _=a.createOscillator();_.frequency.value=38+Math.random()*12,_.connect(g.gain);let v=a.createBiquadFilter();v.type=`lowpass`,v.frequency.value=1500;let y=a.createGain();return y.gain.value=r*.55,h.connect(g).connect(v).connect(y).connect(p),h.start(o+.035),_.start(o),_.stop(o+.1+s.duration*1.8),this.selfUntil=performance.now()+s.duration*1500+300,!0}update(e,t){let n={pulse:0,loud:0,scream:!1};if(this.state!==`on`)return this.loud=0,this.meter=Math.max(0,this.meter-e*3),n;this.analyser.getFloatTimeDomainData(this.buf);let r=0;for(let e=0;e<this.buf.length;e++)r+=this.buf[e]*this.buf[e];let i=Math.sqrt(r/this.buf.length),a=20*Math.log10(i+1e-9);if(this.db=a,!this.calibrated){if(this.calib.push(a),this.calib.length>=50){let e=[...this.calib].sort((e,t)=>e-t);this.floor=q(e[Math.floor(e.length*.5)],-85,-40),this.calibrated=!0}return this.loud=0,this.meter=0,n}let o=G.micSens,s=Zl(21,7,o),c=q(this.floor+s,-66,-26),l=t+this.leak;this.selfUntil&&performance.now()<this.selfUntil&&(c=Math.max(c,-22)),c=Math.max(c,l);let u=Zl(34,26,o),d=Math.max(c+u,-20+(.55-o)*10);this.trig=c,this.screamDb=d;let f=a>c?q((a-c)/(d-c),.02,1):0;a<this.floor?this.floor+=(a-this.floor)*Math.min(1,e*3):f===0&&(this.floor+=(a-this.floor)*Math.min(1,e*.06)),this.floor=q(this.floor,-88,-38),this.loud=f;let p=a>this.floor?q((a-this.floor)/(d-this.floor),0,1.15):0;return this.meter=p>this.meter?p:Math.max(p,this.meter-e*1.6),f>this.peakLoud&&(this.peakLoud=f),f>=W.SCREAM?this.screamHeld+=e:this.screamHeld=Math.max(0,this.screamHeld-e*2),n.scream=this.screamHeld>.14,n.loud=f,f>0?(this.active||(this.active=!0,this.pending=!0,this.onsetT=0,this.windowMax=f,this._captureBegin()),this.windowMax=Math.max(this.windowMax,f),this.onsetT+=e,this.releaseT=0,this.pending&&this.onsetT>=.06?(n.pulse=this.windowMax,this.pending=!1,this.sinceEmit=0,this.windowMax=0):this.pending||(this.sinceEmit+=e,this.sinceEmit>=.45&&(n.pulse=Math.max(this.windowMax,f),this.sinceEmit=0,this.windowMax=0)),this.gate&&this.gate.gain.setTargetAtTime(1,this.engine.now,.01)):this.active&&(this.releaseT+=e,this.releaseT>.14&&(this.pending&&this.windowMax>0&&(n.pulse=this.windowMax),this.active=!1,this.pending=!1,this._captureEnd(),this.gate&&this.gate.gain.setTargetAtTime(0,this.engine.now,.06))),n}},rd=new nd,id=new Set([`KeyW`,`KeyA`,`KeyS`,`KeyD`,`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`Space`,`ShiftLeft`,`ShiftRight`,`KeyC`,`KeyF`,`KeyM`,`KeyP`,`KeyR`,`KeyE`,`Tab`,`Enter`]),ad=class{constructor(e){this.canvas=e,this.keys=new Set,this.move={x:0,y:0},this.lookDX=0,this.lookDY=0,this.turn=0,this.sprint=!1,this.crouch=!1,this.pingHeld=!1,this.useHeld=!1,this.peekHeld=!1,this.peekTouchUntil=0,this.events=[],this.locked=!1,this.lockFailed=!1,this.touch=!1,this.gameActive=!1,this.joy={id:-1,ox:0,oy:0,x:0,y:0,mag:0},this.look={id:-1,x:0,y:0},this.mouseDrag={down:!1,x:0,y:0,moved:0,t:0},this._bind()}emit(e){this.events.push(e)}consume(){let e=this.events;return this.events=[],e}_bind(){window.addEventListener(`keydown`,e=>{if(e.target&&(e.target.tagName===`INPUT`||e.target.tagName===`SELECT`))(e.code===`Enter`||e.code===`Escape`)&&e.target.blur();else if(id.has(e.code)&&this.gameActive&&e.preventDefault(),e.code===`Space`&&e.preventDefault(),!e.repeat)switch(this.keys.add(e.code),e.code){case`Space`:this.pingHeld=!0,this.emit(`pingDown`);break;case`KeyF`:this.emit(`throw`);break;case`KeyE`:this.useHeld=!0,this.emit(`useDown`);break;case`KeyC`:this.crouch=!this.crouch,this.emit(`crouch`);break;case`KeyM`:this.emit(`mic`);break;case`Tab`:this.peekHeld=!0;break;case`Escape`:case`KeyP`:this.emit(`pause`);break;case`KeyR`:this.emit(`restart`);break;case`Enter`:case`NumpadEnter`:this.emit(`confirm`)}}),window.addEventListener(`keyup`,e=>{this.keys.delete(e.code),e.code===`Tab`&&(this.peekHeld=!1),e.code===`KeyE`&&(this.useHeld=!1),e.code===`Space`&&this.pingHeld&&(this.pingHeld=!1,this.emit(`pingUp`))}),window.addEventListener(`blur`,()=>{this.keys.clear(),this.peekHeld=!1,this.useHeld=!1,this.pingHeld&&(this.pingHeld=!1,this.emit(`pingUp`)),this.emit(`blur`)});let e=this.canvas;e.addEventListener(`contextmenu`,e=>e.preventDefault()),e.addEventListener(`mousedown`,e=>{this.touch||this.gameActive&&(!this.locked&&!this.lockFailed?this.requestLock(!0):e.button===0?this.locked?(this.pingHeld=!0,this.emit(`pingDown`)):this.mouseDrag={down:!0,x:e.clientX,y:e.clientY,moved:0,t:performance.now()}:e.button===2&&this.emit(`throw`))}),window.addEventListener(`mouseup`,e=>{if(e.button===0&&(this.locked&&this.pingHeld&&!this.keys.has(`Space`)&&(this.pingHeld=!1,this.emit(`pingUp`)),this.mouseDrag.down)){let e=this.mouseDrag;e.down=!1,e.moved<6&&performance.now()-e.t<300&&this.gameActive&&(this.emit(`pingDown`),this.emit(`pingUp`))}}),window.addEventListener(`mousemove`,e=>{if(this.locked)Math.abs(e.movementX)<400&&Math.abs(e.movementY)<400&&(this.lookDX+=e.movementX,this.lookDY+=e.movementY);else if(this.mouseDrag.down){let t=e.clientX-this.mouseDrag.x,n=e.clientY-this.mouseDrag.y;this.mouseDrag.moved+=Math.abs(t)+Math.abs(n),this.mouseDrag.x=e.clientX,this.mouseDrag.y=e.clientY,this.lookDX+=t*1.4,this.lookDY+=n*1.4}}),document.addEventListener(`pointerlockchange`,()=>{let e=this.locked;this.locked=document.pointerLockElement===this.canvas,this.locked&&(this.lockFails=0),e&&!this.locked&&(this.pingHeld&&(this.pingHeld=!1,this.emit(`pingUp`)),this.emit(`unlock`))}),document.addEventListener(`pointerlockerror`,()=>{this._reqFromClick&&!this._reqPromise&&(this.lockFails=(this.lockFails||0)+1,this.lockFails>=2&&(this.lockFailed=!0))}),window.addEventListener(`touchstart`,()=>this.setTouch(!0),{passive:!0,once:!0})}requestLock(e=!1){if(this.touch||this.locked)return;let t=this.canvas;if(this._reqFromClick=e,!t.requestPointerLock){this.lockFailed=!0;return}let n=()=>{e&&(this.lockFails=(this.lockFails||0)+1,this.lockFails>=2&&(this.lockFailed=!0))};try{let e=t.requestPointerLock({unadjustedMovement:!0});this._reqPromise=!!(e&&e.catch),e&&e.catch&&e.catch(e=>{if(e&&e.name===`NotSupportedError`)try{let e=t.requestPointerLock();e&&e.catch&&e.catch(n)}catch{n()}else n()})}catch{this._reqPromise=!1;try{t.requestPointerLock()}catch{n()}}}exitLock(){document.pointerLockElement&&document.exitPointerLock()}setTouch(e){this.touch!==e&&(this.touch=e,document.body.classList.toggle(`touch`,e))}bindTouchUI(e){let t=e.querySelector(`#joyZone`),n=e.querySelector(`#lookZone`),r=e.querySelector(`#joyBase`),i=e.querySelector(`#joyKnob`),a=(e,t,n)=>{r.style.opacity=e?`1`:`0`,e&&(r.style.transform=`translate(${t-70}px, ${n-70}px)`)};t.addEventListener(`pointerdown`,e=>{e.preventDefault(),this.setTouch(!0),this.joy.id===-1&&(this.joy={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0,mag:0},t.setPointerCapture(e.pointerId),a(!0,e.clientX,e.clientY),i.style.transform=`translate(0px, 0px)`)}),t.addEventListener(`pointermove`,e=>{if(e.pointerId!==this.joy.id)return;let t=e.clientX-this.joy.ox,n=e.clientY-this.joy.oy,o=Math.hypot(t,n);if(o>62){let r=o-62;this.joy.ox+=t/o*r,this.joy.oy+=n/o*r,t=e.clientX-this.joy.ox,n=e.clientY-this.joy.oy,a(!0,this.joy.ox,this.joy.oy)}this.joy.x=t/62,this.joy.y=-n/62,this.joy.mag=Math.min(1,Math.hypot(this.joy.x,this.joy.y)),i.style.transform=`translate(${t}px, ${n}px)`,r.classList.toggle(`sprint`,this.joy.mag>.94)});let o=e=>{e.pointerId===this.joy.id&&(this.joy={id:-1,ox:0,oy:0,x:0,y:0,mag:0},a(!1),r.classList.remove(`sprint`))};t.addEventListener(`pointerup`,o),t.addEventListener(`pointercancel`,o),n.addEventListener(`pointerdown`,e=>{e.preventDefault(),this.setTouch(!0),this.look.id===-1&&(this.look={id:e.pointerId,x:e.clientX,y:e.clientY},n.setPointerCapture(e.pointerId))}),n.addEventListener(`pointermove`,e=>{e.pointerId===this.look.id&&(this.lookDX+=(e.clientX-this.look.x)*2.2,this.lookDY+=(e.clientY-this.look.y)*2.2,this.look.x=e.clientX,this.look.y=e.clientY)});let s=e=>{e.pointerId===this.look.id&&(this.look.id=-1)};n.addEventListener(`pointerup`,s),n.addEventListener(`pointercancel`,s);let c=(t,n,r)=>{let i=e.querySelector(t);i.addEventListener(`pointerdown`,e=>{e.preventDefault(),e.stopPropagation(),this.setTouch(!0),i.classList.add(`down`);try{i.setPointerCapture(e.pointerId)}catch{}n&&n()});let a=e=>{e.preventDefault(),i.classList.remove(`down`),r&&r()};i.addEventListener(`pointerup`,a),i.addEventListener(`pointercancel`,a),i.addEventListener(`contextmenu`,e=>e.preventDefault())};c(`#tPing`,()=>{this.pingHeld=!0,this.emit(`pingDown`)},()=>{this.pingHeld&&(this.pingHeld=!1,this.emit(`pingUp`))}),c(`#tStone`,()=>this.emit(`throw`));let l=e.querySelector(`#peekZone`);l&&l.addEventListener(`pointerdown`,e=>{e.preventDefault(),this.setTouch(!0),this.emit(`peek`)}),c(`#tCrouch`,()=>{this.crouch=!this.crouch,this.emit(`crouch`)}),c(`#tUse`,()=>{this.useHeld=!0,this.emit(`useDown`)},()=>{this.useHeld=!1}),c(`#tSkip`,()=>this.emit(`skip`))}poll(){let e=this.keys,t=0,n=0,r=0;(e.has(`KeyW`)||e.has(`ArrowUp`))&&(n+=1),(e.has(`KeyS`)||e.has(`ArrowDown`))&&--n,e.has(`KeyD`)&&(t+=1),e.has(`KeyA`)&&--t,e.has(`ArrowLeft`)&&--r,e.has(`ArrowRight`)&&(r+=1);let i=e.has(`ShiftLeft`)||e.has(`ShiftRight`);this.joy.id!==-1&&(t+=this.joy.x,n+=this.joy.y,this.joy.mag>.94&&(i=!0));let a=Math.hypot(t,n);a>1&&(t/=a,n/=a),this.move.x=t,this.move.y=n,this.turn=r,this.sprint=i;let o=this.lookDX,s=this.lookDY;this.lookDX=0,this.lookDY=0;let c=.0022*G.mouseSens;return{dx:o*c,dy:s*c*(G.invertY?-1:1)}}reset(){this.keys.clear(),this.pingHeld=!1,this.useHeld=!1,this.peekHeld=!1,this.crouch=!1,this.lookDX=this.lookDY=0,this.events=[]}},od=e=>document.getElementById(e);function sd(e){e=Math.max(0,Math.floor(e));let t=Math.floor(e/60),n=e%60;return`${String(t).padStart(2,`0`)}:${String(n).padStart(2,`0`)}`}function cd(e){return Math.floor(e).toLocaleString(`ru-RU`).replace(/\u00a0/g,` `)}var ld=7,ud=27,dd=e=>ld+ud*Math.min(1.12,Math.max(0,e)),fd=class{constructor(){this.el=od(`hud`),this.dawn=od(`dawnFill`),this.peekEl=od(`peek`),this.peekTime=od(`peekTime`),this.peekSub=od(`peekSub`),this.peekGens=[...od(`peekGens`).children],this.peekTask=od(`peekTask`),this.useEl=od(`use`),this.useRing=od(`useRing`),this.noteEl=od(`note`),this.beaconEl=od(`beacon`),this.skipEl=od(`skip`),this.onNoteClose=null,this.noteEl.addEventListener(`pointerdown`,e=>{e.preventDefault(),this.onNoteClose&&this.onNoteClose()}),this.stones=od(`stones`),this.stamWrap=od(`stam`),this.stam=od(`stamFill`),this.cross=od(`crosshair`),this.noiseRing=od(`noiseRing`),this.screamRing=od(`screamRing`),this.ripple=od(`ripple`),this.alert=od(`alert`),this.hint=od(`hint`),this.intro=od(`intro`),this.popups=[];let e=od(`popups`);for(let t=0;t<6;t++){let t=document.createElement(`div`);t.className=`popup`,e.appendChild(t),this.popups.push(t)}this.popIdx=0,this.cache={},this.hintKey=null,this.clock=0,this.peekUntil=0,this.stonesUntil=0,this.lastMinute=-1,this.ringU=0,this.taskUntil=0}show(e){this.el.classList.toggle(`hidden`,!e),e||document.body.classList.remove(`can-use`,`morning`,`note-open`),e&&(this.cache={},this.lastMinute=-1,this.ringU=0)}_set(e,t,n){this.cache[e]!==n&&(this.cache[e]=n,t.textContent=n)}_cls(e,t,n,r){let i=e+`:`+n;this.cache[i]!==r&&(this.cache[i]=r,t.classList.toggle(n,r))}peek(e=3){this.peekUntil=Math.max(this.peekUntil,this.clock+e)}update(e,t,n=!1){this.clock+=t;let r=e.state!==`morning`&&e.state!==`dusk`,i=e.objectives.count,a=(i/5).toFixed(2);this.cache.dawn!==a&&(this.cache.dawn=a,this.dawn.style.transform=`scaleX(${a})`);let o=r?Math.floor(e.time/60):-1;r&&o!==this.lastMinute&&(this.lastMinute>=0&&this.peek(3.2),this.lastMinute=o);let s=r&&(n||this.clock<this.peekUntil);if(s){this._set(`pt`,this.peekTime,sd(e.time));let t=e.online?` · ${K(`teamAlive`).replace(`{n}`,e.livePlayers().length).replace(`{m}`,e.remotes.size+1)}`:``;this._set(`ps`,this.peekSub,`${K(`generators`)} ${i}/5 · ${K(`score`)} ${cd(e.score)} ×${e.mult.toFixed(1)}${t}`),this._set(`ptask`,this.peekTask,e.objectives.taskText()),this.cache.pg!==i&&(this.cache.pg=i,this.peekGens.forEach((e,t)=>e.classList.toggle(`on`,t<i)))}this._cls(`peek`,this.peekEl,`show`,s),this._cls(`task`,this.peekTask,`fresh`,this.clock<this.taskUntil);let c=e.player.stones;this.cache.stones!==c&&(this.cache.stones!==void 0&&(this.stonesUntil=this.clock+2.4),this.cache.stones=c,[...this.stones.children].forEach((e,t)=>e.classList.toggle(`on`,t<c))),this._cls(`stones`,this.stones,`show`,s||this.clock<this.stonesUntil);let l=e.player.stamina,u=Math.round(l);this.cache.stam!==u&&(this.cache.stam=u,this.stam.style.transform=`scaleX(${(l/100).toFixed(3)})`),this._cls(`stam`,this.stamWrap,`show`,l<99.5),this._cls(`stam`,this.stamWrap,`low`,e.player.exhausted)}task(){this.peek(5.5),this.taskUntil=this.clock+5.5}setUse(e,t=0,n=!0,r=!1){let i=e?`${e}|${n}|${r}`:``;this.cache.use!==i&&(this.cache.use=i,e&&(this.useEl.textContent=e),this.useEl.classList.toggle(`show`,!!e),this.useEl.classList.toggle(`blocked`,!!r),document.body.classList.toggle(`can-use`,!!e&&n));let a=e?Math.max(0,Math.min(1,t)):0,o=a.toFixed(3);if(this.cache.useP!==o){this.cache.useP=o;let e=2*Math.PI*13;this.useRing.style.strokeDasharray=`${(e*a).toFixed(2)} ${e.toFixed(2)}`,this.useRing.style.opacity=a>.001?`1`:`0`}}showNote(e,t){let n=this.noteEl;document.body.classList.toggle(`note-open`,!!e),e?(n.querySelector(`.k`).textContent=e,n.querySelector(`.t`).textContent=t,n.querySelector(`.f`).textContent=K(`noteClose`),n.classList.remove(`show`),n.offsetWidth,n.classList.add(`show`)):n.classList.remove(`show`)}beacon(e,t){let n=this.beaconEl;n.style.setProperty(`--a`,`${e.toFixed(3)}rad`),n.style.setProperty(`--o`,t<25?`1`:t<70?`0.8`:`0.55`),n.classList.remove(`go`),n.offsetWidth,n.classList.add(`go`)}setSkip(e){this.cache.skip!==e&&(this.cache.skip=e,this.skipEl.textContent=e?K(`skipHint`):``,document.body.classList.toggle(`morning`,e))}flashStones(){this.stonesUntil=this.clock+2.4}ring(e,t,n,r){let i=.3;r&&t.screamDb>t.floor&&(i=Math.min(.8,Math.max(.05,(t.trig-t.floor)/(t.screamDb-t.floor))));let a=i+W.SCREAM*(1-i),o=r?t.meter:0;n>0&&(o=Math.max(o,i+n*(1-i))),this.ringU=o>this.ringU?o:Math.max(o,this.ringU-e*2.4);let s=this.ringU,c=dd(s).toFixed(1);this.cache.ringR!==c&&(this.cache.ringR=c,this.noiseRing.setAttribute(`r`,c));let l=dd(a).toFixed(1);this.cache.scrR!==l&&(this.cache.scrR=l,this.screamRing.setAttribute(`r`,l));let u=s>=a?`s`:s>=i?`e`:s>.09?`q`:``;this.cache.zone!==u&&(this.cache.zone=u,this.cross.dataset.zone=u),this._cls(`cross`,this.cross,`charging`,n>0)}setMic(){}pulseCross(){this.ripple.classList.remove(`go`),this.ripple.offsetWidth,this.ripple.classList.add(`go`)}popup(e,t=``){let n=this.popups[this.popIdx++%this.popups.length];n.textContent=e,n.className=`popup`,n.offsetWidth,n.className=`popup show `+t}flashAlert(e,t=``,n=1.6){this.alert.textContent=e,this.alert.dataset.text=e,this.alert.className=``,this.alert.offsetWidth,this.alert.className=`show `+t,this.alert.style.setProperty(`--dur`,n+`s`)}setHint(e){this.hintKey!==e&&(this.hintKey=e,e?(this.hint.classList.remove(`show`),this.hint.offsetWidth,this.hint.innerHTML=e,this.hint.classList.add(`show`)):this.hint.classList.remove(`show`))}setIntro(e,t){e?(this.intro.innerHTML=`<div class="big">${e}</div>${t?`<div class="small">${t}</div>`:``}`,this.intro.classList.add(`show`)):this.intro.classList.remove(`show`)}},pd=class{constructor(e){this.c=e,this.ctx=e.getContext(`2d`),this.blips=[],this.range=62,this.sweep=0,this.t=0,this.noiseR=0,this.resize()}resize(){let e=this.c.getBoundingClientRect(),t=Math.min(window.devicePixelRatio||1,2),n=Math.max(60,Math.round((e.width||170)*t));this.c.width!==n&&(this.c.width=n,this.c.height=n),this.dpr=t}clear(){this.blips.length=0}blip(e,t,n,r=!1){this.blips.length>80&&this.blips.shift(),this.blips.push({x:e,z:t,type:n,t:this.t,hunting:r})}draw(e,t,n,r,i,a,o){this.t+=e,this.sweep+=e*2.4;let s=this.ctx,c=this.c.width,l=c/2-3*this.dpr,u=l/this.range;s.clearRect(0,0,c,c),s.save(),s.translate(c/2,c/2);let d=s.createRadialGradient(0,0,l*.1,0,0,l);d.addColorStop(0,`rgba(10,12,13,0.62)`),d.addColorStop(1,`rgba(0,0,0,0.72)`),s.fillStyle=d,s.beginPath(),s.arc(0,0,l,0,Math.PI*2),s.fill(),s.save(),s.beginPath(),s.arc(0,0,l,0,Math.PI*2),s.clip(),s.strokeStyle=`rgba(170,186,190,0.09)`,s.lineWidth=1*this.dpr;for(let e of[15,30,45,60])s.beginPath(),s.arc(0,0,e*u,0,Math.PI*2),s.stroke();s.beginPath(),s.moveTo(-l,0),s.lineTo(l,0),s.moveTo(0,-l),s.lineTo(0,l),s.stroke();let f=this.sweep%(Math.PI*2);if(s.createConicGradient){let e=s.createConicGradient(f-Math.PI*.5,0,0);e.addColorStop(0,`rgba(170,186,190,0.0)`),e.addColorStop(.9,`rgba(170,186,190,0.0)`),e.addColorStop(1,`rgba(170,186,190,0.1)`),s.fillStyle=e,s.beginPath(),s.arc(0,0,l,0,Math.PI*2),s.fill()}s.strokeStyle=`rgba(190,200,204,0.22)`,s.beginPath(),s.moveTo(0,0),s.lineTo(Math.cos(f-Math.PI*.5)*l,Math.sin(f-Math.PI*.5)*l),s.stroke();let p=Math.cos(r),m=Math.sin(r),h=(e,r)=>{let i=e-t,a=r-n,o=i*p-a*m,s=-i*m-a*p;return[o*u,-s*u]};for(let e of i){if(!e.active||e.curR>=e.radius)continue;let[t,n]=h(e.x,e.z),r=1-e.curR/e.radius;s.strokeStyle=e.kind===`monster`?`rgba(255,60,50,${.7*r})`:e.kind===`stone`?`rgba(230,245,255,${.6*r})`:`rgba(190,204,208,${.6*r})`,s.lineWidth=1.5*this.dpr,s.beginPath(),s.arc(t,n,e.curR*u,0,Math.PI*2),s.stroke()}let g=a>0?W.hearRadius(a):0;this.noiseR=g>this.noiseR?g:Math.max(0,this.noiseR-e*40),this.noiseR>.5&&(s.fillStyle=o?`rgba(255,40,40,0.16)`:`rgba(255,170,90,0.08)`,s.strokeStyle=o?`rgba(255,60,60,0.9)`:`rgba(255,180,100,0.55)`,s.lineWidth=1.5*this.dpr,s.setLineDash([4*this.dpr,3*this.dpr]),s.beginPath(),s.arc(0,0,Math.min(this.noiseR,this.range*1.2)*u,0,Math.PI*2),s.fill(),s.stroke(),s.setLineDash([]));for(let e=this.blips.length-1;e>=0;e--){let t=this.blips[e],n=this.t-t.t,r=t.type===`monster`?4:t.type===`shard`||t.type===`beacon`?6:3;if(n>r){this.blips.splice(e,1);continue}let i=1-n/r,[a,o]=h(t.x,t.z),c=Math.hypot(a,o),u=c>l-6*this.dpr,d=u?(l-6*this.dpr)/c:1,f=a*d,p=o*d,m=n<.15?1+(.15-n)*6:1;if(t.type===`monster`){let e=5*this.dpr*m;s.fillStyle=`rgba(255,${t.hunting?30:60},${t.hunting?30:50},${i})`,s.shadowColor=`rgba(255,40,40,0.9)`,s.shadowBlur=10*this.dpr*i,s.beginPath(),s.moveTo(f,p-e),s.lineTo(f+e,p),s.lineTo(f,p+e),s.lineTo(f-e,p),s.closePath(),s.fill(),s.shadowBlur=0,t.hunting&&!u&&(s.strokeStyle=`rgba(255,60,60,${i})`,s.beginPath(),s.arc(f,p,e+4*this.dpr+Math.sin(this.t*20)*this.dpr,0,Math.PI*2),s.stroke())}else if(t.type===`shard`)s.fillStyle=`rgba(255,175,60,${i})`,s.shadowColor=`rgba(255,170,50,0.9)`,s.shadowBlur=8*this.dpr*i,s.beginPath(),s.arc(f,p,3*this.dpr*m,0,Math.PI*2),s.fill(),s.shadowBlur=0;else if(t.type===`beacon`){let e=3.5*this.dpr*m;s.strokeStyle=`rgba(255,185,90,${i})`,s.lineWidth=1.5*this.dpr,s.strokeRect(f-e,p-e,e*2,e*2)}else t.type===`mate`?(s.strokeStyle=`rgba(142,240,255,${i})`,s.shadowColor=`rgba(142,240,255,0.8)`,s.shadowBlur=8*this.dpr*i,s.lineWidth=1.5*this.dpr,s.beginPath(),s.arc(f,p,3.5*this.dpr*m,0,Math.PI*2),s.stroke(),s.shadowBlur=0):t.type===`stone`?(s.strokeStyle=`rgba(230,245,255,${i})`,s.lineWidth=1.5*this.dpr,s.beginPath(),s.arc(f,p,(3+n*6)*this.dpr,0,Math.PI*2),s.stroke()):(s.fillStyle=`rgba(200,210,220,${i*.9})`,s.font=`${11*this.dpr}px JetBrains Mono, monospace`,s.textAlign=`center`,s.textBaseline=`middle`,s.fillText(`?`,f,p))}s.restore(),s.strokeStyle=`rgba(170,186,190,0.28)`,s.lineWidth=1.5*this.dpr,s.beginPath(),s.arc(0,0,l,0,Math.PI*2),s.stroke(),s.fillStyle=`rgba(220,214,204,0.85)`;let _=5*this.dpr;s.beginPath(),s.moveTo(0,-_*1.3),s.lineTo(_,_),s.lineTo(0,_*.45),s.lineTo(-_,_),s.closePath(),s.fill(),s.restore()}},md=e=>document.getElementById(e);function hd(e){return String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}var gd=class{constructor(e){this.h=e,this.screens=[`menu`,`pause`,`over`,`settingsPanel`,`howPanel`,`scoresPanel`,`coopPanel`,`boot`],this.settingsReturn=null,this.highlight=-1,this._bind(),this.applyI18n(),this.loadSettingsForm(),this.renderScores()}show(e,t=!0){md(e).classList.toggle(`show`,t)}only(e){for(let t of this.screens)this.show(t,t===e);document.body.classList.toggle(`in-menu`,e===`menu`||e===`over`||e===`pause`)}isOpen(e){return md(e).classList.contains(`show`)}applyI18n(){document.querySelectorAll(`[data-i18n]`).forEach(e=>{e.textContent=K(e.dataset.i18n)}),md(`howBody`).innerHTML=K(`howtoBody`);let e=md(`titleText`);e.textContent=K(`title`),e.dataset.text=K(`title`),md(`bootText`).textContent=K(`loading`),document.title=`${K(`title`)} — ${K(`subtitle`)}`,this.renderScores()}_bind(){let e=(e,t)=>{let n=md(e);n.addEventListener(`click`,e=>{e.preventDefault(),this.h.uiSound&&this.h.uiSound(`click`),t(e)}),n.addEventListener(`mouseenter`,()=>this.h.uiSound&&this.h.uiSound(`hover`))};e(`btnPlay`,()=>this.h.onPlay()),e(`btnCoop`,()=>this.h.onCoop&&this.h.onCoop()),e(`btnLobby`,()=>this.h.onLobby&&this.h.onLobby()),e(`btnHow`,()=>this.show(`howPanel`)),e(`btnHowBack`,()=>this.show(`howPanel`,!1)),e(`btnScores`,()=>{this.renderScores(),this.show(`scoresPanel`)}),e(`btnScoresBack`,()=>this.show(`scoresPanel`,!1)),e(`btnSettings`,()=>this.openSettings(`menu`)),e(`btnSettingsP`,()=>this.openSettings(`pause`)),e(`btnSettingsBack`,()=>this.closeSettings()),e(`btnResume`,()=>this.h.onResume()),e(`btnRestartP`,()=>this.h.onRestart()),e(`btnMenuP`,()=>this.h.onMenu()),e(`btnRestart`,()=>this.h.onRestart()),e(`btnMenu`,()=>this.h.onMenu()),e(`micToggle`,()=>this.h.onMicToggle()),e(`langBtn`,()=>{Ul(Wl()===`ru`?`en`:`ru`),G.lang=Wl(),Rl(),this.loadSettingsForm(),this.applyI18n(),this.h.onSettingsChanged&&this.h.onSettingsChanged()});let t=md(`nameInput`);t.value=G.name||``,t.addEventListener(`input`,()=>{G.name=t.value.trim().slice(0,14),Rl()}),t.addEventListener(`keydown`,e=>e.stopPropagation());let n=(e,t,n)=>{let r=md(e);r.addEventListener(`input`,()=>{G[t]=parseFloat(r.value),Rl(),n&&n(),this.h.onSettingsChanged&&this.h.onSettingsChanged(t)})},r=(e,t)=>{let n=md(e);n.addEventListener(`change`,()=>{G[t]=n.checked,Rl(),this.h.onSettingsChanged&&this.h.onSettingsChanged(t)})},i=(e,t)=>{let n=md(e);n.addEventListener(`change`,()=>{G[t]=n.value,Rl(),t===`lang`&&(Ul(n.value),this.applyI18n()),this.h.onSettingsChanged&&this.h.onSettingsChanged(t)})};n(`sVolume`,`volume`),n(`sMouse`,`mouseSens`),n(`sMicSens`,`micSens`),r(`sInvert`,`invertY`),r(`sMic`,`micEnabled`),r(`sEcho`,`voiceEcho`),r(`sRadar`,`radar`),i(`sScares`,`scares`),i(`sQuality`,`quality`),i(`sLang`,`lang`),md(`over`).addEventListener(`pointerdown`,e=>{e.target.id===`over`&&this.h.onRestart()})}loadSettingsForm(){md(`sVolume`).value=G.volume,md(`sMouse`).value=G.mouseSens,md(`sMicSens`).value=G.micSens,md(`sInvert`).checked=G.invertY,md(`sMic`).checked=G.micEnabled,md(`sEcho`).checked=G.voiceEcho,md(`sRadar`).checked=!!G.radar,md(`sScares`).value=G.scares,md(`sQuality`).value=G.quality,md(`sLang`).value=Wl()}openSettings(e){this.settingsReturn=e,this.loadSettingsForm(),this.show(`settingsPanel`)}closeSettings(){this.show(`settingsPanel`,!1)}renderScores(e=-1,t=`scoreTable`){let n=zl();if(t===`scoreTable`){let e=n[0],t=md(`bestLine`);t&&(t.innerHTML=e?`${hd(K(`best`))} <b>${cd(e.score)}</b> · ${sd(e.time)} · ${e.won?`☀`:`${e.gens|0}/5`}`:``)}let r=md(t);if(!r)return;if(!n.length){r.innerHTML=`<div class="empty">${hd(K(`noScores`))}</div>`;return}let i=`<div class="row head"><span class="r">${K(`rank`)}</span><span class="n">${hd(K(`name`))}</span><span class="s">${hd(K(`score`))}</span><span class="t">${hd(K(`time`))}</span></div>`;n.forEach((t,n)=>{let r=n===e?` me`:``,a=(t.won?`<span class="w">☀</span>`:t.gens?`<span class="g">${t.gens|0}/5</span>`:``)+(t.coop>1?`<span class="c">${hd(K(`coopTag`).replace(`{n}`,t.coop))}</span>`:``);i+=`<div class="row${r}"><span class="r">${n+1}</span><span class="n">${hd(t.name||`???`)}${a}</span><span class="s">${cd(t.score)}</span><span class="t">${sd(t.time)}</span></div>`}),r.innerHTML=i}setMicStatus(e,t){let n=md(`micStatus`),r=md(`micToggle`),i=md(`micWarn`),a=e===`on`;n.textContent=a?K(`micOn`):e===`pending`?`…`:K(`micOff`),n.className=a?`on`:`off`,r.textContent=K(a?`off`:`micAsk`),md(`micTest`).style.display=a?`flex`:`none`;let o=``;e===`blocked`||e===`denied`&&t||e===`unsupported`&&t?o=`${hd(K(`micIframe`))} <a href="${hd(location.href)}" target="_blank" rel="noopener">${hd(K(`micOpenTab`))} ↗</a><br>${hd(K(`micDenied`))}`:(e===`denied`||e===`unsupported`)&&(o=hd(K(`micDenied`))),i.innerHTML=o,i.classList.toggle(`show`,!!o)}micTest(e,t){md(`micTestFill`).style.transform=`scaleX(${Math.min(1,e)})`,md(`micTestTrig`).style.left=`${(t*100).toFixed(1)}%`}showOver(e,t,n,r,i=null){let a=e.won;md(`over`).classList.toggle(`won`,a),md(`overKicker`).textContent=a?`${K(`winKicker`)} · ${sd(t.time)}`:`${K(`survived`)} ${sd(t.time)} · ${K(`generators`)} ${t.gens|0}/5`;let o=K(a?`winTitle`:{scream:`deadScream`,crawler:`deadCrawler`,watcher:`deadWatcher`,howler:`deadHowler`}[e.cause]||`deadTitle`),s=!a&&e.cause!==`scream`&&K(`deathBy`)[e.cause]||``,c=a?K(`winSub`):s?`— ${s}`:``;e.coop&&(e.hostLost?(o=K(`hostLostTitle`),c=K(`hostLostSub`)):a&&!e.alive?c=K(`teamWonDead`):a||(c=`${K(`teamAllDead`)}${s?` · ${s}`:``}`)),md(`overTitle`).textContent=o,md(`overSub`).textContent=c;let l=md(`overTeam`);l.innerHTML=i&&i.length?`<div class="row head"><span>${hd(K(`teamHead`))}</span></div>`+i.map(e=>`<div class="row"><i class="dot" style="--c:${e.color}"></i><span class="n">${hd(e.name)}${e.self?` <em>· ${hd(K(`coopYou`))}</em>`:``}</span><span class="st ${e.alive?`alive`:``}">${hd(e.alive?K(`stAlive`):K(`stDead`))}</span><span class="s">${cd(e.score)}</span></div>`).join(``):``,md(`overScore`).textContent=cd(t.score),md(`newRecord`).classList.toggle(`show`,n===0&&t.score>0);let u=`${Math.round(t.loudest/.78*100)}%`;md(`overStats`).innerHTML=[[`${t.gens|0}/5`,K(`gensGot`)],[t.shards,K(`shardsGot`)],[t.close,K(`closeCalls`)],[t.escapes,K(`escapes`)],[u,K(`loudest`)]].map(([e,t])=>`<div><b>${hd(e)}</b><span>${hd(t)}</span></div>`).join(``),this.renderScores(n,`overTable`)}};function _d(e){return{key:e,root:new Ln,nodes:{},parts:[]}}function vd(e,t,n,r,i,a){let o=new Ln;return o.position.set(r,i,a),(n||e.root).add(o),e.nodes[t]=o,o.userData.rest=o.position.clone(),o}var yd=new au(512);function Z(e,t,n){yd.reset(),n(yd),e.parts.push({node:t,arr:yd.toArrays()})}function bd(){let e=_d(`listener`),t=(t,n,r,i,a)=>vd(e,t,n,r,i,a),n=t(`hips`,null,0,1.6,0);Z(e,n,e=>{e.place(0,-.04,0),e.box(.42,.22,.27,J.FLESH)});let r=t(`spine`,n,0,.06,0);Z(e,r,e=>{e.identity(),e.taper(.32,.22,.52,.3,.98,J.FLESH,.06);for(let t=0;t<6;t++)e.place(0,.12+t*.15,-.13-t*.006,-1.2,0,0),e.cone(4,.035,.13,J.BONE);for(let t=0;t<4;t++)for(let n of[-1,1])e.identity(),e.limb([n*.05,.48+t*.11,.15],[n*.27,.42+t*.11,.05],.018,.012,J.BONE,3)});let i=t(`chest`,r,0,.98,.06),a=t(`neck`,i,0,0,.04);Z(e,a,e=>{e.identity(),e.limb([0,0,0],[0,.3,.14],.075,.05,J.FLESH)});let o=t(`head`,a,0,.3,.14);Z(e,o,e=>{e.place(0,0,-.06,Math.PI/2+.2,0,0),e.taper(.25,.26,.08,.11,.56,J.BONE),e.place(0,.08,-.06,0,0,0),e.rock(.17,Td(3),J.BONE,.1,1),e.identity();for(let t of[-1,1]){let n=[t*.08,.14,-.08],r=[t*.3,.52,-.2],i=[t*.42,.95,-.12],a=[t*.62,1.25,-.25];e.limb(n,r,.035,.028,J.BONE,4),e.limb(r,i,.028,.02,J.BONE,4),e.limb(i,a,.02,.008,J.BONE,3),e.limb(r,[t*.18,.78,.12],.02,.006,J.BONE,3),e.limb(i,[t*.25,1.22,.02],.018,.005,J.BONE,3),e.limb(i,[t*.68,.98,.05],.016,.005,J.BONE,3),e.limb([t*.36,.7,-.17],[t*.6,.66,-.36],.016,.005,J.BONE,3)}e.place(-.085,.07,.07),e.octa(.032,.03,J.EYE),e.place(.085,.07,.07),e.octa(.032,.03,J.EYE)}),Z(e,t(`jaw`,o,0,-.06,-.02),e=>{e.place(0,0,0,Math.PI/2+.35,0,0),e.taper(.19,.08,.06,.04,.46,J.BONE);for(let t=0;t<5;t++)for(let n of[-1,1])e.place(n*(.07-t*.01),.02-t*.03,.1+t*.07,0,0,0),e.cone(3,.014,.06,J.BONE)});for(let r of[-1,1]){let a=r<0?`L`:`R`,o=t(`shoulder`+a,i,r*.27,-.04,0);Z(e,o,e=>{e.identity(),e.limb([0,0,0],[0,-.98,0],.06,.045,J.FLESH)});let s=t(`elbow`+a,o,0,-.98,0);Z(e,s,e=>{e.identity(),e.limb([0,0,0],[0,-.98,0],.045,.03,J.FLESH)}),Z(e,t(`hand`+a,s,0,-.98,0),e=>{e.identity();for(let t=0;t<4;t++){let n=(t-1.5)*.12;e.limb([n*.3,0,.02],[n+r*.03,-.42,.08+Math.abs(n)*.2],.014,.004,J.BONE,3)}});let c=t(`thigh`+a,n,r*.14,-.08,0);Z(e,c,e=>{e.identity(),e.limb([0,0,0],[0,-.8,.12],.08,.05,J.FLESH)});let l=t(`knee`+a,c,0,-.8,.12);Z(e,l,e=>{e.identity(),e.limb([0,0,0],[0,-.78,-.2],.05,.035,J.FLESH)}),Z(e,t(`foot`+a,l,0,-.78,-.2),e=>{e.identity(),e.limb([0,0,0],[-.05,-.02,.25],.03,.01,J.BONE,3),e.limb([0,0,0],[.05,-.02,.24],.03,.01,J.BONE,3)})}return e}function xd(){let e=_d(`crawler`),t=(t,n,r,i,a)=>vd(e,t,n,r,i,a),n=t(`body`,null,0,.62,0);Z(e,n,e=>{e.place(0,0,-.6,Math.PI/2,0,0),e.taper(.34,.26,.46,.32,1.3,J.FLESH,.02);for(let t=0;t<7;t++)e.place(0,.17,-.5+t*.17,-.5,0,0),e.cone(4,.04,.18,J.BONE)});let r=t(`head`,n,0,.06,.72);Z(e,r,e=>{e.place(0,.02,-.05,Math.PI/2-.1,0,0),e.taper(.3,.24,.14,.12,.42,J.BONE);for(let t=0;t<4;t++)e.place((t%2?1:-1)*(.05+(t>1?.06:0)),.09-(t>1?.03:0),.16+(t>1?-.05:0)),e.octa(.022,.022,J.EYE)}),Z(e,t(`jaw`,r,0,-.07,0),e=>{e.place(0,0,-.02,Math.PI/2+.25,0,0),e.taper(.26,.06,.1,.04,.38,J.BONE);for(let t=0;t<6;t++)for(let n of[-1,1])e.place(n*(.1-t*.012),.02-t*.02,.06+t*.05,0,0,0),e.cone(3,.012,.05,J.BONE)});for(let[r,i,a,o]of[[`FL`,-.2,.42,1],[`FR`,.2,.42,1],[`ML`,-.22,-.05,0],[`MR`,.22,-.05,0],[`BL`,-.2,-.5,-1],[`BR`,.2,-.5,-1]]){let s=i<0?-1:1,c=t(`hip`+r,n,i,0,a),l=s*.55,u=.42,d=o*.25;Z(e,c,e=>{e.identity(),e.limb([0,0,0],[l,u,d],.05,.035,J.FLESH)}),Z(e,t(`kn`+r,c,l,u,d),e=>{e.identity(),e.limb([0,0,0],[s*.32,-1.02,o*.2],.035,.012,J.BONE,4)})}return e}function Sd(){let e=_d(`shade`),t=(t,n,r,i,a)=>vd(e,t,n,r,i,a),n=t(`torso`,null,0,1.25,0);return Z(e,n,e=>{e.identity(),e.taper(.3,.18,.42,.22,.95,J.FLESH),e.limb([-.1,0,0],[-.13,-1.25,.02],.06,.035,J.FLESH),e.limb([.1,0,0],[.12,-1.25,-.03],.06,.035,J.FLESH),e.limb([-.22,.9,0],[-.32,-.3,.08],.04,.025,J.FLESH),e.limb([.22,.9,0],[.3,-.35,.1],.04,.025,J.FLESH),e.limb([-.32,-.3,.08],[-.34,-.62,.12],.012,.004,J.BONE,3),e.limb([.3,-.35,.1],[.33,-.66,.14],.012,.004,J.BONE,3)}),Z(e,t(`head`,n,0,1.12,.02),e=>{e.identity(),e.octa(.13,.2,J.BONE);for(let t=0;t<12;t++){let n=t/12*Math.PI*2;Math.sin(n)>.6||e.limb([Math.cos(n)*.1,.12,Math.sin(n)*.1-.02],[Math.cos(n)*.17,-.65-t%3*.12,Math.sin(n)*.15-.04],.012,.003,J.FLESH,3)}e.place(-.045,.02,.11),e.octa(.018,.012,J.EYE),e.place(.045,.02,.11),e.octa(.018,.012,J.EYE)}),e}function Cd(){let e=_d(`watcher`),t=(t,n,r,i,a)=>vd(e,t,n,r,i,a),n=t(`hips`,null,0,1.8,0);Z(e,n,e=>{e.place(0,-.03,0),e.box(.3,.16,.18,J.FLESH)});let r=t(`spine`,n,0,.05,0);Z(e,r,e=>{e.identity(),e.taper(.2,.13,.32,.17,.9,J.FLESH,-.04);for(let t=0;t<5;t++)for(let n of[-1,1])e.identity(),e.limb([n*.03,.4+t*.1,.085],[n*.16,.36+t*.1,.02],.012,.008,J.BONE,3)});let i=t(`chest`,r,0,.9,-.04),a=t(`neck`,i,0,0,.02);Z(e,a,e=>{e.identity(),e.limb([0,0,0],[0,.44,.07],.045,.034,J.FLESH)});let o=t(`head`,a,0,.44,.07);Z(e,o,e=>{e.place(0,.17,-.02),e.octa(.125,.27,J.FLESH),e.place(0,.3,-.05),e.octa(.09,.16,J.BONE)});for(let r of[-1,1]){let a=r<0?`L`:`R`;Z(e,t(`face`+a,o,r*.004,.17,.09),e=>{e.place(r*.055,0,0),e.box(.1,.4,.035,J.BONE);for(let t=0;t<6;t++)e.place(r*.008,.15-t*.06,.012,0,0,r*-Math.PI/2),e.cone(3,.012,.05,J.BONE)});let s=t(`shoulder`+a,i,r*.2,-.03,0);Z(e,s,e=>{e.identity(),e.limb([0,0,0],[0,-1.05,0],.045,.032,J.FLESH)});let c=t(`elbow`+a,s,0,-1.05,0);Z(e,c,e=>{e.identity(),e.limb([0,0,0],[0,-1.05,0],.032,.022,J.FLESH)}),Z(e,t(`hand`+a,c,0,-1.05,0),e=>{e.identity();for(let t=0;t<3;t++){let n=(t-1)*.07;e.limb([n*.4,0,.01],[n+r*.02,-.5,.05],.012,.003,J.BONE,3)}});let l=t(`thigh`+a,n,r*.1,-.06,0);Z(e,l,e=>{e.identity(),e.limb([0,0,0],[0,-.9,.04],.05,.035,J.FLESH)});let u=t(`knee`+a,l,0,-.9,.04);Z(e,u,e=>{e.identity(),e.limb([0,0,0],[0,-.86,-.06],.035,.022,J.FLESH)}),Z(e,t(`foot`+a,u,0,-.86,-.06),e=>{e.identity(),e.limb([0,0,0],[0,-.02,.24],.022,.008,J.BONE,3)})}return e}function wd(){let e=_d(`howler`),t=(t,n,r,i,a)=>vd(e,t,n,r,i,a),n=t(`pelvis`,null,0,1.05,-.45);Z(e,n,e=>{e.place(0,0,0),e.box(.62,.42,.5,J.FLESH)});let r=t(`chest`,n,0,.12,.15);Z(e,r,e=>{e.place(0,0,0,Math.PI/2-.42,0,0),e.taper(.66,.52,1.08,.78,1.05,J.FLESH,.08);for(let t=0;t<6;t++)e.place(0,.36+t*.05,.05+t*.17,-.9,0,0),e.cone(4,.06,.26-t*.02,J.BONE)});let i=t(`neck`,r,0,.5,.92);Z(e,i,e=>{e.identity(),e.limb([0,-.05,-.1],[0,.02,.18],.17,.14,J.FLESH)});let a=t(`head`,i,0,.02,.22);Z(e,a,e=>{e.place(0,.02,-.04,Math.PI/2,0,0),e.taper(.38,.3,.26,.18,.4,J.BONE),e.place(0,.14,.02),e.rock(.17,Td(11),J.BONE,.2,.7);for(let t=0;t<4;t++)e.place((t%2?1:-1)*(.08+(t>1?.05:0)),.1-(t>1?.04:0),.24-(t>1?.05:0)),e.octa(.02,.018,J.EYE)}),Z(e,t(`jaw`,a,0,-.1,-.02),e=>{e.place(0,0,0,Math.PI/2+.15,0,0),e.taper(.36,.12,.26,.07,.5,J.BONE);for(let t=0;t<6;t++)for(let n of[-1,1])e.place(n*(.14-t*.015),.03,.08+t*.065,0,0,0),e.cone(3,.018,.08,J.BONE)});for(let i of[-1,1]){let a=i<0?`L`:`R`,o=t(`shoulder`+a,r,i*.52,.36,.78);Z(e,o,e=>{e.identity(),e.limb([0,0,0],[i*.08,-.82,.12],.13,.09,J.FLESH,5)});let s=t(`elbow`+a,o,i*.08,-.82,.12);Z(e,s,e=>{e.identity(),e.limb([0,0,0],[0,-.78,.06],.09,.08,J.FLESH,5)}),Z(e,t(`hand`+a,s,0,-.78,.06),e=>{e.identity();for(let t=0;t<3;t++){let n=(t-1)*.07;e.limb([n,0,0],[n*1.4,-.12,.2],.035,.012,J.BONE,3)}});let c=t(`thigh`+a,n,i*.28,-.12,0);Z(e,c,e=>{e.identity(),e.limb([0,0,0],[0,-.5,.18],.14,.1,J.FLESH,5)});let l=t(`knee`+a,c,0,-.5,.18);Z(e,l,e=>{e.identity(),e.limb([0,0,0],[0,-.46,-.16],.1,.07,J.FLESH,5)}),Z(e,t(`foot`+a,l,0,-.46,-.16),e=>{e.identity(),e.limb([0,0,0],[0,-.02,.3],.07,.03,J.BONE,4)})}return e}function Td(e){let t=e;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function Ed(e,t,n){let r=e.rig.nodes,i=e.speedCur,a=q(i/2,0,1.1),o=e.state===`hunt`,s=e.phase,c=Math.sin(s);r.thighL.rotation.x=c*.6*a-(o?.25:0),r.thighR.rotation.x=-c*.6*a-(o?.25:0),r.kneeL.rotation.x=Math.max(0,-c)*.8*a+.08,r.kneeR.rotation.x=Math.max(0,c)*.8*a+.08;let l=o?-1.15:e.state===`search`?-.35:.05;r.shoulderL.rotation.x=-c*.4*a+l+Math.sin(n*1.3)*.04,r.shoulderR.rotation.x=c*.4*a+l+Math.sin(n*1.1+1)*.04,r.shoulderL.rotation.z=-.1-(o?.25:0),r.shoulderR.rotation.z=.1+(o?.25:0),r.elbowL.rotation.x=-.25-a*.2+(o?-.4:0),r.elbowR.rotation.x=-.25-a*.2+(o?-.4:0),r.spine.rotation.x=(o?.62:e.state===`search`?.42:.26)+Math.sin(s*2)*.03,r.hips.position.y=1.6+Math.abs(c)*.06*a-(o?.16:0),r.neck.rotation.x=o?-.45:-.25;let u=e.state===`search`||e.state===`idle`||e.listenT>0;r.head.rotation.z=u?Math.sin(n*1.9+e.seed)*.4:Math.sin(n*.7)*.06,r.head.rotation.y=q(e.headYaw,-.9,.9),r.jaw.rotation.x=o?.55+Math.sin(n*24)*.12:.06+Math.max(0,Math.sin(n*.8+e.seed))*.1}function Dd(e,t,n){let r=e.rig.nodes,i=q(e.speedCur/2.5,0,1.2),a=e.phase,o=[`FL`,`FR`,`ML`,`MR`,`BL`,`BR`];for(let e=0;e<6;e++){let t=a+(e%2?Math.PI:0)+(e>>1)*.9,n=Math.sin(t);r[`hip`+o[e]].rotation.y=n*.45*i,r[`hip`+o[e]].rotation.z=(e%2?-1:1)*Math.max(0,Math.cos(t))*.35*i}r.body.position.y=.62+Math.abs(Math.sin(a*2))*.05*i+(e.state===`hunt`?-.1:0),r.body.rotation.z=Math.sin(a)*.06*i,r.head.rotation.y=q(e.headYaw,-.7,.7)+Math.sin(n*13)*.05*(e.state===`hunt`?1:.2),r.head.rotation.z=e.state===`search`?Math.sin(n*3+e.seed)*.5:0,r.jaw.rotation.x=e.state===`hunt`?.5+Math.sin(n*30)*.15:.08}function Od(e,t,n){let r=e.rig.nodes,i=q(e.speedCur/3.2,0,1.1),a=e.phase,o=Math.sin(a);r.thighL.rotation.x=o*.55*i,r.thighR.rotation.x=-o*.55*i,r.kneeL.rotation.x=Math.max(0,-o)*.7*i+.05,r.kneeR.rotation.x=Math.max(0,o)*.7*i+.05,r.shoulderL.rotation.x=.18*i+Math.sin(a+.6)*.12*i,r.shoulderR.rotation.x=.18*i-Math.sin(a+.6)*.12*i,r.shoulderL.rotation.z=-.06,r.shoulderR.rotation.z=.06,r.elbowL.rotation.x=-.1,r.elbowR.rotation.x=-.1,r.spine.rotation.x=.12+i*.2,r.hips.position.y=1.8+Math.abs(o)*.05*i;let s=q(1-e.playerDist/14,0,1);r.neck.rotation.x=-.15-s*.2,r.head.rotation.z=Math.sin(n*.37+e.seed)*.25+(.35+s*.5)*(e.seed>5?1:-1),r.head.rotation.y=q(e.headYaw,-1.2,1.2),r.faceL.rotation.y=0,r.faceR.rotation.y=0}function kd(e,t,n){let r=e.rig.nodes,i=q(e.speedCur/2.4,0,1.3),a=e.phase,o=Math.sin(a),s=e.state,c=0,l=.1+Math.max(0,Math.sin(n*.9+e.seed))*.08,u=0;if(s===`inhale`){let t=q(e.stateT/1.8,0,1);c=t*.55,l=.15+t*.25,u=t*.35,r.chest.scale.setScalar(1+t*.12)}else if(s===`howl`){let t=q(e.stateT/.25,0,1)*(1-q((e.stateT-1.4)/.4,0,1));c=.55+.35*t,l=.4+.75*t+Math.sin(n*30)*.08*t,u=.35+.55*t,r.chest.scale.setScalar(1.12-.1*t)}else r.chest.scale.setScalar(1),s===`hunt`&&(l=.55+Math.sin(n*22)*.12);r.pelvis.rotation.x=-c*.5,r.pelvis.position.y=1.05+Math.abs(Math.sin(a*2))*.05*i-(s===`hunt`?.1:0),r.chest.rotation.x=-c*.75,r.neck.rotation.x=-c*.9+(s===`hunt`?.15:0),r.head.rotation.x=-c*.5,r.head.rotation.y=q(e.headYaw,-.7,.7)*(1-c),r.jaw.rotation.x=l;let d=c>.05?0:1;r.shoulderL.rotation.x=o*.5*i*d-c*1.2,r.shoulderR.rotation.x=-o*.5*i*d-c*1.2,r.shoulderL.rotation.z=-u,r.shoulderR.rotation.z=u,r.elbowL.rotation.x=Math.max(0,o)*.4*i*d-c*.4,r.elbowR.rotation.x=Math.max(0,-o)*.4*i*d-c*.4,r.thighL.rotation.x=-o*.45*i+c*.6,r.thighR.rotation.x=o*.45*i+c*.6,r.kneeL.rotation.x=Math.max(0,o)*.6*i,r.kneeR.rotation.x=Math.max(0,-o)*.6*i}function Ad(){let e=_d(`survivor`);e.root.rotation.order=`YXZ`;let t=(t,n,r,i,a)=>vd(e,t,n,r,i,a),n=t(`hips`,null,0,.94,0);Z(e,n,e=>{e.place(0,-.06,0),e.box(.32,.16,.2,J.WOOD)});let r=t(`chest`,n,0,.06,0);Z(e,r,e=>{e.identity(),e.taper(.34,.2,.42,.24,.56,J.WOOD),e.place(0,.3,-.17),e.box(.3,.38,.14,J.METAL),e.place(-.16,.52,-.13,0,0,-Math.PI/2),e.cylinder(6,.055,.055,.32,J.METAL,{ringEdges:!1})}),Z(e,t(`head`,r,0,.66,.02),e=>{e.identity(),e.octa(.115,.15,J.FLESH),e.place(0,.02,-.02,-.25,0,0),e.cone(7,.17,.32,J.WOOD)});for(let i of[-1,1]){let a=t(i<0?`shL`:`shR`,r,i*.24,.5,0);Z(e,a,e=>{e.identity(),e.limb([0,0,0],[i*.04,-.3,.02],.055,.045,J.WOOD,4)}),Z(e,t(i<0?`elL`:`elR`,a,i*.04,-.3,.02),e=>{e.identity(),e.limb([0,0,0],[0,-.28,.06],.045,.035,J.FLESH,4)});let o=t(i<0?`thL`:`thR`,n,i*.1,-.08,0);Z(e,o,e=>{e.identity(),e.limb([0,0,0],[0,-.42,.02],.075,.06,J.WOOD,4)}),Z(e,t(i<0?`knL`:`knR`,o,0,-.42,.02),e=>{e.identity(),e.limb([0,0,0],[0,-.42,-.02],.06,.045,J.WOOD,4),e.place(0,-.44,.05),e.box(.1,.07,.24,J.ROCK)})}return e}function jd(e,t,n,r,i){let a=e.nodes;if(i){e.root.rotation.x=-Math.PI/2,a.hips.position.y=.2,a.head.rotation.set(0,0,.6),a.shL.rotation.set(-2.6,0,-.3),a.shR.rotation.set(-.4,0,.5),a.thL.rotation.set(.2,0,0),a.thR.rotation.set(-.15,0,0),a.knL.rotation.x=.4,a.knR.rotation.x=.1;return}e.root.rotation.x=0;let o=q(n/3.2,0,1.4),s=Math.sin(t);a.hips.position.y=r?.62:.94-Math.abs(Math.cos(t))*.03*o,a.chest.rotation.x=r?.55:.08*o,a.head.rotation.set(r?-.35:0,0,0),a.thL.rotation.x=s*.55*o-(r?1.1:0),a.thR.rotation.x=-s*.55*o-(r?1.1:0),a.knL.rotation.x=Math.max(0,-s)*.7*o+(r?1.6:0),a.knR.rotation.x=Math.max(0,s)*.7*o+(r?1.6:0),a.shL.rotation.set(-s*.45*o,0,-.06),a.shR.rotation.set(s*.45*o,0,.06),a.elL.rotation.x=-.25-o*.2,a.elR.rotation.x=-.25-o*.2}var Md=0,Nd={listener:bd,crawler:xd,watcher:Cd,howler:wd};function Pd(e){return Nd[e]()}var Fd={x:1e5,z:1e5,y:0,speed:0,alive:!1,charging:!1,forward:()=>({x:0,z:-1})},Id=140,Ld=[`idle`,`wander`,`investigate`,`search`,`hunt`,`flee`,`feed`,`lurk`,`stalk`,`frozen`,`inhale`,`howl`],Rd=[`listener`,`crawler`,`watcher`,`howler`];function zd(e,t,n){return e+eu(e,t)*n}var Bd=class{constructor(e,t,n){this.id=n??++Md,this.type=e,this.game=t,this.cfg=W.MONSTER[e],this.rig=Nd[e](),this.ghostColor=16722464,this.noEyes=!1,this.headY=e===`crawler`?.7:2.1,this.stepGain=e===`crawler`?.5:1,this.stepPitch=1,this.strideHz=e===`crawler`?3.2:1.55,this.strideRef=e===`crawler`?2.5:1.8,this.huntTarget=null,this.lampGhost=null,this.x=0,this.z=0,this.y=0,this.yaw=0,this.state=`wander`,this.stateT=0,this.tx=0,this.tz=0,this.speedCur=0,this.phase=Math.random()*6,this.lastStepSign=1,this.lock=0,this.seed=Math.random()*10,this.headYaw=0,this.listenT=0,this.pauseT=0,this.stuckT=0,this.detourT=0,this.lastCloseCall=-100,this.breath=null,this.chitterT=2,this.heardCD=0,this.huntedPlayer=!1,this.alive=!0,this.scripted=null,this.playerDist=1e4,this.tgt=null,this.tgtDist=1e4,this.feedT=0,this.puppet=!1,this.snaps=[]}spawn(e,t,n=`wander`){this.x=e,this.z=t,this.y=this.game.world.terrain.height(e,t),this.playerDist=this.game.distToEars(e,t),this.state=n,this.stateT=0,this.pickTarget(),this.pickWander(),this.syncRig()}dispose(){this.breath&&this.breath.stop(),this.breath=null,this.lampGhost&&this.game.ghosts.release(this.lampGhost),this.lampGhost=null,this.alive=!1}danger(){let e=this.playerDist;return this.state===`hunt`?.55+.45*q(1-e/40,0,1):this.state===`investigate`||this.state===`search`?.55*q(1-e/28,0,1):.4*q(1-e/14,0,1)}animate(e,t){this.type===`listener`?Ed(this,e,t):Dd(this,e,t)}get hearingMult(){return this.cfg.hearing*this.game.hearingScale}nearestTo(e,t){let n=null,r=1e9;for(let i of this.game.livePlayers()){let a=Math.hypot(i.x-e,i.z-t);a<r&&(r=a,n=i)}return n}pickTarget(){let e=this.game;return this.state===`hunt`&&this.tgt&&this.tgt.alive&&e.isPlayer(this.tgt)||(this.tgt=this.nearestTo(this.x,this.z)),this.tgtDist=this.tgt?Math.hypot(this.tgt.x-this.x,this.tgt.z-this.z):1e4,this.tgt}pickWander(){let e=this.game.livePlayers();if(e.length&&Math.random()<.4){let t=e[Math.floor(Math.random()*e.length)],n=Math.random()*Math.PI*2,r=12+Math.random()*30;this.tx=t.x+Math.cos(n)*r,this.tz=t.z+Math.sin(n)*r}else{let e=Math.random()*Math.PI*2,t=15+Math.random()*35;this.tx=this.x+Math.cos(e)*t,this.tz=this.z+Math.sin(e)*t}let t=W.WORLD_WALL-8;this.tx=q(this.tx,-t,t),this.tz=q(this.tz,-t,t)}setState(e){this.state=e,this.stateT=0}investigate(e,t,n=!1){if(this.state===`hunt`||this.state===`feed`)return;let r=this.state!==`investigate`;return this.setState(`investigate`),this.tx=e,this.tz=t,this.slowInvestigate=n,this.listenT=.6,r}startHunt(e){let t=this.game;e&&(this.tgt=e,this.tgtDist=Math.hypot(e.x-this.x,e.z-this.z));let n=this.state!==`hunt`;this.setState(`hunt`),this.lock=this.cfg.lock,this.huntedPlayer=!0,n&&t.onMonsterHunt(this)}feed(e=4.5){this.setState(`feed`),this.feedT=e,this.huntTarget=null,this.speedCur=0}hear(e,t,n,r,i,a=null){if(!this.alive||this.state===`flee`||this.state===`feed`||this.scripted===`freeze`)return null;let o=e-this.x,s=t-this.z,c=Math.hypot(o,s),l=r===`step`&&this.cfg.stepHearing?this.cfg.stepHearing:1,u=W.hearRadius(n)*this.hearingMult*l;if(c>u)return null;let d=this.game,f=r!==`stone`&&r!==`scare`,p=a==null?null:d.playerById(a);if(this.state===`hunt`){if(f){if(this.lock=Math.max(this.lock,2.6),p&&p.alive&&p!==this.tgt){let e=Math.hypot(p.x-this.x,p.z-this.z);e<this.tgtDist*.6&&(this.tgt=p,this.tgtDist=e)}return`hunt`}let n=this.tgt||Fd,i=Math.hypot(n.x-this.x,n.z-this.z);return r===`stone`&&this.lock<this.cfg.lock*.75&&c<i&&i>3?(this.setState(`investigate`),this.tx=e,this.tz=t,this.slowInvestigate=!1,d.onMonsterLost(this),`investigate`):`hunt`}if(f&&!d.grace&&(i||c<Math.max(2.5,u*.22)))return this.startHunt(p&&p.alive?p:this.nearestTo(e,t)),`hunt`;let m=c*.12,h=Math.random()*Math.PI*2,g=Math.random()*m;return this.investigate(e+Math.cos(h)*g,t+Math.sin(h)*g)&&d.onMonsterInvestigate(this,c,a),`investigate`}syncRig(){let e=this.rig.root;e.position.set(this.x,this.y,this.z),e.rotation.y=this.yaw}_steer(e,t,n,r,i=this.state===`hunt`?7:2.6){let a=this.game,o=this.cfg;this.detourT>0&&(this.detourT-=e,t=this.dtx,n=this.dtz);let s=t-this.x,c=n-this.z;if(Math.hypot(s,c)>.05&&r>0){let t=Math.atan2(s,c),n=eu(this.yaw,t);this.yaw+=q(n,-i*e,i*e),r*=1-Math.min(.7,Math.abs(n)/Math.PI)}this.speedCur=Zl(this.speedCur,r,1-Math.exp(-6*e));let l=this.x,u=this.z;this.x+=Math.sin(this.yaw)*this.speedCur*e,this.z+=Math.cos(this.yaw)*this.speedCur*e;let d={x:this.x,z:this.z};if(a.world.col.resolve(d,o.radius),a.world.lake){let e=a.world.lake,t=d.x-e.x,n=d.z-e.z,r=Math.hypot(t,n);r<e.r+.5&&(d.x=e.x+t/r*(e.r+.5),d.z=e.z+n/r*(e.r+.5))}let f=W.WORLD_WALL;this.x=q(d.x,-f,f),this.z=q(d.z,-f,f);let p=Math.hypot(this.x-l,this.z-u);if(this.speedCur>.5&&p<this.speedCur*e*.3){if(this.stuckT+=e,this.stuckT>.6){let e=Math.random()<.5?-1:1,t=this.yaw+e*(Math.PI/2+Math.random()*.6);this.dtx=this.x+Math.sin(t)*4,this.dtz=this.z+Math.cos(t)*4,this.detourT=.9,this.stuckT=0}}else this.stuckT=Math.max(0,this.stuckT-e);this.y=Zl(this.y,a.world.terrain.height(this.x,this.z),1-Math.exp(-12*e))}update(e,t){this.puppet?this.follow(e):this.think(e,t),this.alive&&this.present(e,t)}think(e,t){let n=this.game;this.stateT+=e,this.heardCD-=e,this.listenT-=e,this.pickTarget();let r=this.cfg,i=n.speedScale;if(this.state!==`hunt`&&this.state!==`flee`&&this.state!==`feed`&&!this.scripted)for(let e of n.livePlayers()){let t=Math.hypot(e.x-this.x,e.z-this.z),r=t<.95,i=t<2.3&&(e.speed>1.75||e.speed>.3&&t<1.5);if(r||i&&!n.grace){this.startHunt(e);break}}let a=this.tgt||Fd,o=a.x-this.x,s=a.z-this.z,c=Math.hypot(o,s);this.tgtDist=c;let l=0,u=this.tx,d=this.tz;switch(this.state){case`idle`:l=0,this.headYaw=Zl(this.headYaw,q(eu(this.yaw,Math.atan2(o,s)),-.8,.8),e*2);break;case`wander`:this.pauseT>0?(this.pauseT-=e,l=0):(l=r.wander,Math.hypot(u-this.x,d-this.z)<2&&(this.pickWander(),Math.random()<.5&&(this.pauseT=1.5+Math.random()*3))),this.stateT>40&&(this.pickWander(),this.stateT=0);break;case`investigate`:{l=this.slowInvestigate?r.wander*1.25:r.investigate;let e=a.speed<.3;(Math.hypot(u-this.x,d-this.z)<1.6||this.stateT>30||e&&c<2.1)&&(this.setState(`search`),this.searchDur=4+Math.random()*3.5);break}case`search`:l=.35,u=this.x+Math.sin(t*.7+this.seed)*3,d=this.z+Math.cos(t*.6+this.seed)*3,c<2.1&&(u=this.x-o,d=this.z-s),this.stateT>this.searchDur&&(this.setState(`wander`),this.pickWander());break;case`hunt`:if(this.lock-=e,u=this.huntTarget?this.huntTarget.x:a.x,d=this.huntTarget?this.huntTarget.z:a.z,c<4&&(this.lock=Math.max(this.lock,1.2)),l=r.hunt*(c<7?1.18:1),this.stateT<.7&&(l*=.25),this.stateT>.35){let e=W.MONSTER.killDist,t=a.alive&&c<e?a:null;if(!t){let r=e;for(let e of n.livePlayers()){let n=Math.hypot(e.x-this.x,e.z-this.z);n<r&&(r=n,t=e)}}if(t){n.kill(this,t);return}}this.lock<=0&&(this.setState(`investigate`),this.tx=a.x+(Math.random()-.5)*6,this.tz=a.z+(Math.random()-.5)*6,n.onMonsterLost(this));break;case`feed`:this.feedT-=e,this.feedT<=0&&(this.setState(`wander`),this.pickWander());break;case`flee`:l=r.hunt,u=this.x+(this.x-a.x),d=this.z+(this.z-a.z)}if(l*=i,this._steer(e,u,d,l),this.state!==`idle`){let t=eu(this.yaw,Math.atan2(o,s)),n=this.state===`hunt`||c<10?q(t,-.9,.9):0;this.headYaw=Zl(this.headYaw,n,1-Math.exp(-4*e))}this.phase+=e*Math.PI*2*this.strideHz*q(this.speedCur/this.strideRef,0,2.2)}pushSnap(e,t){this.snaps.push({t:e,...t}),this.snaps.length>8&&this.snaps.shift()}follow(e){let t=this.snaps;if(!t.length)return;let n=performance.now()-Id,r=t[0],i=t[0];for(let e=t.length-1;e>=0;e--)if(t[e].t<=n){r=t[e],i=t[Math.min(e+1,t.length-1)];break}let a=i.t>r.t?(n-r.t)/(i.t-r.t):1;a=q(a,0,1.2);let o=Math.hypot(i.x-r.x,i.z-r.z)>8||Math.hypot(i.x-this.x,i.z-this.z)>14;o&&(r=i,a=1);let s=Math.min(a,1);this.x=Zl(r.x,i.x,a),this.z=Zl(r.z,i.z,a),this.yaw=zd(r.yaw,i.yaw,s),this.headYaw=Zl(r.hy,i.hy,s),this.speedCur=Zl(r.spd,i.spd,s);let c=s>.5?i:r;if(c.st===this.state?this.stateT+=e:(this.state===`lurk`&&(this.revealed=!1),this.state=c.st,this.stateT=0),this.lit=c.lit,this.intro=c.intro,this.scripted=c.scr?`freeze`:null,Math.abs(this.x)<2e3){let t=this.game.world.terrain.height(this.x,this.z);this.y=o?t:Zl(this.y,t,1-Math.exp(-12*e))}this.phase+=e*Math.PI*2*this.strideHz*q(this.speedCur/this.strideRef,0,2.2)}present(e,t){let n=this.game;this.playerDist=n.distToEars(this.x,this.z);let r=this.playerDist;this.animate(e,t),this.syncRig();let i=n.audio,a=r<32,o=Math.sin(this.phase)>=0?1:-1;if(o!==this.lastStepSign&&(this.lastStepSign=o,a&&this.speedCur>.4)){let e=q(.15+this.speedCur*.08,0,.7)*this.stepGain;i.heavyStep(this.x,this.y+.2,this.z,e,this.stepPitch)}if(this.type===`crawler`&&a&&(this.chitterT-=e,this.chitterT<=0&&(i.chitter(this.x,this.y+.6,this.z,this.state===`hunt`?.7:.35),this.chitterT=this.state===`hunt`?.5+Math.random()*.4:3+Math.random()*5)),r<28&&i.ready){if(this.breath||(this.breath=i.breather(this.x,this.y+2.2,this.z,this.type===`howler`)),this.breath){this.breath.setPos(this.x,this.y+(this.type===`crawler`?.7:this.type===`howler`?1.8:2.6),this.z);let e=this.state===`hunt`?2.8:this.state===`investigate`||this.state===`search`?1.5:1,t=this.state===`hunt`?.9:.45;this.breath.update(e,t)}}else this.breath&&r>36&&(this.breath.stop(),this.breath=null)}},Vd=class extends Bd{constructor(e,t){super(`watcher`,e,t),this.ghostColor=14279916,this.noEyes=!0,this.headY=3.2,this.strideHz=.95,this.strideRef=3,this.lit=!1,this.litStreak=0,this.lampWait=0,this.crackT=1,this.lurkT=3,this.state=`lurk`,this.x=this.z=1e4,this.playerDist=1e4}hear(){return null}danger(){return this.state===`lurk`||this.state===`flee`?0:q(1-this.playerDist/26,0,1)*(this.lit?.5:.8)}animate(e,t){Od(this,e,t)}appearBehind(e,t,n){let r=this.game,i=W.WORLD_WALL-6;if(!e)return!1;let a=e.forward();for(let o=0;o<40;o++){let o=(Math.random()-.5)*2.4,s=Math.cos(o),c=Math.sin(o),l=-a.x*s+a.z*c,u=-a.z*s-a.x*c,d=t+Math.random()*(n-t),f=e.x+l*d,p=e.z+u*d;if(Math.abs(f)>i||Math.abs(p)>i||!r.world.col.free(f,p,.8))continue;let m=r.world.lake;if(!(m&&Math.hypot(f-m.x,p-m.z)<m.r+3)&&!(r.objectives.lampAt(f,p)>.005)&&!(r.lightAt(f,r.world.terrain.height(f,p)+1.8,p)>.02)&&!r.livePlayers().some(e=>Math.hypot(e.x-f,e.z-p)<t*.7))return this.spawn(f,p,`stalk`),this.tgt=e,this.yaw=Math.atan2(e.x-f,e.z-p),this.litStreak=0,this.revealed=!1,!0}return!1}vanish(e){this.state=`lurk`,this.stateT=0,this.lurkT=e,this.x=this.z=1e4,this.playerDist=1e4,this.lit=!1,this.speedCur=0,this.lampGhost&&this.game.ghosts.release(this.lampGhost),this.lampGhost=null,this.syncRig()}setState(e){e===`flee`?this.vanish(1e9):super.setState(e)}dispose(){super.dispose(),this.game.audio.watcherPresence(0)}think(e,t){let n=this.game,r=this.cfg;if(this.stateT+=e,this.state===`lurk`){if(this.lurkT-=e,this.lurkT<=0){let e=n.livePlayers().filter(e=>!n.objectives.inLamp(e.x,e.z)),t=e.length?e[Math.floor(Math.random()*e.length)]:null;(!t||!this.appearBehind(t,27,37))&&(this.lurkT=1.5)}return}let i=this.pickTarget()||Fd,a=i.x-this.x,o=i.z-this.z,s=this.tgtDist,c=n.objectives.lampAt(this.x,this.z),l=n.lightAt(this.x,this.y+1.8,this.z)>r.litThreshold||c>.08;if(this.lit=l,this.state=l?`frozen`:`stalk`,this.litStreak=l?this.litStreak+e:Math.max(0,this.litStreak-e*.5),this.lampWait=i.alive&&n.objectives.inLamp(i.x,i.z)?this.lampWait+e:0,this.litStreak>14||this.lampWait>9||!i.alive){this.vanish(18+Math.random()*16);return}if(s>60&&!l){this.appearBehind(i,27,37)||this.vanish(2);return}let u=0;if(!l){u=r.stalk*n.speedScale*(s<4?.8:1);let e=Math.min(1.2,u*.4);n.objectives.lampAt(this.x+Math.sin(this.yaw)*e,this.z+Math.cos(this.yaw)*e)>.05&&(u=0)}if(u>0?(this._steer(e,i.x,i.z,u,3.2),this.phase+=e*Math.PI*2*this.strideHz*q(this.speedCur/this.strideRef,0,2),this.headYaw=Zl(this.headYaw,q(eu(this.yaw,Math.atan2(a,o)),-1.2,1.2),1-Math.exp(-3*e))):this.speedCur=0,!l&&this.stateT>.6){let e=null,t=W.MONSTER.killDist+.15;for(let r of n.livePlayers()){let n=Math.hypot(r.x-this.x,r.z-this.z);n<t&&(t=n,e=r)}if(e){n.kill(this,e);return}}}present(e,t){let n=this.game;if(this.state===`lurk`){this.playerDist=1e4,n.audio.watcherPresence(0);return}this.playerDist=n.distToEars(this.x,this.z);let r=this.playerDist,i=this.lit;!i&&this.speedCur>.01&&this.animate(e,t),this.syncRig();let a=q(1-r/24,0,1);n.audio.watcherPresence(a,this.x,this.y+2.8,this.z,!i&&this.speedCur>.3),!i&&this.speedCur>.5&&r<24&&(this.crackT-=e,this.crackT<=0&&(n.audio.crack(this.x,this.y+.8+Math.random()*2.2,this.z,.3+a*.55),this.crackT=.3+Math.random()*.55)),r<10&&n.localAlive()&&(n.fx.glitch=Math.max(n.fx.glitch,(1-r/10)*(i?.1:.32)))}},Hd=class extends Bd{constructor(e,t){super(`howler`,e,t),this.ghostColor=16734740,this.headY=1.8,this.stepGain=2.4,this.stepPitch=.6,this.strideHz=1.2,this.strideRef=2.2,this.howlT=14+Math.random()*8,this.barkT=0}animate(e,t){kd(this,e,t)}danger(){return this.state===`inhale`||this.state===`howl`?this.playerDist<this.cfg.howlR?.78:.15:super.danger()}hear(e,t,n,r,i,a){if(this.state===`inhale`||this.state===`howl`||n<this.cfg.minLoud)return null;let o=super.hear(e,t,n,r,i,a);return o===`hunt`&&r!==`stone`&&r!==`scare`&&(this.huntTarget={x:e,z:t}),o}startHunt(e){let t=e||this.tgt;!this.huntTarget&&t&&(this.huntTarget={x:t.x,z:t.z}),super.startHunt(e)}think(e,t){let n=this.game;if(this.state===`inhale`||this.state===`howl`){if(this.stateT+=e,this.pickTarget(),this.speedCur=Zl(this.speedCur,0,1-Math.exp(-8*e)),this.state===`inhale`&&this.stateT>=1.8)this.setState(`howl`),n.onHowl(this);else if(this.state===`howl`){let e=Math.min(this.cfg.howlR,Math.max(0,this.stateT-.1)*30),t=null,r=1e9;if(this.stateT<1.9)for(let i of n.livePlayers()){let a=Math.hypot(i.x-this.x,i.z-this.z);a<e&&a<r&&n.movingForHowler(i)&&(r=a,t=i)}t?this.spot(t):this.stateT>2&&(this.setState(`wander`),this.pickWander())}}else{if(this.state===`hunt`){if(this.barkT-=e,this.barkT<=0){this.barkT=1+Math.random()*.35,n.onHowlerBark(this);let e=null,t=18;for(let r of n.livePlayers()){let i=Math.hypot(r.x-this.x,r.z-this.z);i<t&&n.movingForHowler(r)&&(t=i,e=r)}e&&(this.tgt=e,this.huntTarget={x:e.x,z:e.z})}let t=this.huntTarget,r=this.tgt||Fd,i=Math.hypot(r.x-this.x,r.z-this.z);t&&Math.hypot(t.x-this.x,t.z-this.z)<1.7&&i>2.4&&this.stateT>.8&&(this.huntTarget=null,this.setState(`search`),this.searchDur=3.5+Math.random()*2.5,n.onMonsterLost(this))}else this.state!==`flee`&&this.state!==`feed`&&(this.huntTarget=null,this.howlT-=e,this.howlT<=0&&this.state!==`idle`&&(this.howlT=24+Math.random()*14,this.setState(`inhale`),n.onHowlerInhale(this)));super.think(e,t)}}spot(e){this.tgt=e,this.huntTarget={x:e.x,z:e.z},this.yaw=Math.atan2(e.x-this.x,e.z-this.z),this.state=`wander`,this.startHunt(e),this.barkT=1.1}};function Ud(e,t,n){return e===`watcher`?new Vd(t,n):e===`howler`?new Hd(t,n):new Bd(e,t,n)}var Wd=class{constructor(){this.rig=Sd()}place(e,t,n,r){let i=this.rig.root;i.position.set(e,t,n),i.rotation.y=r;let a=this.rig.nodes;a.head.rotation.z=(Math.random()-.5)*.9,a.head.rotation.x=(Math.random()-.5)*.4,a.torso.rotation.x=(Math.random()-.3)*.25}},Gd=[`#8ef0ff`,`#a6ff9e`,`#d2a8ff`,`#ffe08a`],Kd=[9367807,10944414,13805823,16769162],qd=110,Jd={crouch:1,sprint:2,alive:4,charging:8,use:16,morning:32},Yd=[[0,0],[1.5,.55],[-1.5,.55],[0,1.6]],Xd=class{constructor(e,t){this.game=e,this.id=t.id,this.name=t.name||`???`,this.slot=t.slot|0,this.color=Gd[this.slot%4],this.hex=Kd[this.slot%4];let n=e.world.spawn,[r,i]=Yd[this.slot%4],a=Math.cos(n.yaw),o=Math.sin(n.yaw);this.x=n.x+a*r+o*i,this.z=n.z-o*r+a*i,this.y=e.world.terrain.height(this.x,this.z),this.yaw=n.yaw,this.pitch=0,this.speed=0,this.crouching=!1,this.sprinting=!1,this.charging=!1,this.useHeld=!1,this.alive=!0,this.inRun=!0,this.eyeCur=W.PLAYER.eye,this.loud=0,this.score=0,this.gens=0,this.cause=null,this.buf=[],this.rig=Ad(),this.phase=0,this.stepAcc=0,this.lastStep=0,this.revealT=-9,this.lastHeard=performance.now()}forward(){return{x:-Math.sin(this.yaw),z:-Math.cos(this.yaw)}}push(e){if(!Array.isArray(e)||e.length<7)return;let t=performance.now();this.lastHeard=t;let n=e[6]|0;this.buf.push({t,x:+e[0],y:+e[1],z:+e[2],yaw:+e[3],pitch:+e[4],speed:+e[5],f:n}),this.buf.length>10&&this.buf.shift(),this.loud=+e[7]||0,e[8]!==void 0&&(this.score=+e[8]||0)}update(e){let t=this.buf;if(t.length){let n=performance.now()-qd,r=t[0],i=t[0];for(let e=t.length-1;e>=0;e--)if(t[e].t<=n){r=t[e],i=t[Math.min(e+1,t.length-1)];break}let a=i.t>r.t?(n-r.t)/(i.t-r.t):1;a=q(a,0,1.15),Math.hypot(i.x-r.x,i.z-r.z)>6&&(r=i,a=1);let o=Math.min(1,a),s=this.x,c=this.z;this.alive&&(this.x=Zl(r.x,i.x,a),this.z=Zl(r.z,i.z,a),this.y=Zl(r.y,i.y,o),this.yaw=r.yaw+eu(r.yaw,i.yaw)*o,this.pitch=Zl(r.pitch,i.pitch,o)),this.speed=Zl(r.speed,i.speed,o);let l=(o>.5?i:r).f;this.crouching=!!(l&Jd.crouch),this.sprinting=!!(l&Jd.sprint),this.charging=!!(l&Jd.charging),this.useHeld=!!(l&Jd.use),this.eyeCur=Zl(this.eyeCur,this.crouching?W.PLAYER.crouchEye:W.PLAYER.eye,1-Math.exp(-10*e));let u=Math.hypot(this.x-s,this.z-c);if(this.alive&&u<3&&this.speed>.3){let e=this.crouching?W.PLAYER.stepCrouch:this.sprinting?W.PLAYER.stepSprint:W.PLAYER.stepWalk;this.stepAcc+=u,this.phase+=u/e*Math.PI,this.stepAcc>=e&&(this.stepAcc-=e,this.game.distToEars(this.x,this.z)<26&&!this.crouching&&this.game.audio.mateStep(this.x,this.y+.1,this.z,this.sprinting?.85:.4))}}jd(this.rig,this.phase,this.alive?this.speed:0,this.crouching,!this.alive);let n=this.rig.root;n.position.set(this.x,this.y+(this.alive?0:.2),this.z),n.rotation.y=this.yaw+Math.PI}die(e,t){this.alive=!1,e!==void 0&&(this.x=e,this.z=t,this.y=this.game.world.terrain.height(e,t)),this.speed=0,this.charging=!1}},Zd=15,Qd=10,$d=[`voice`,`ping`,`step`,`bump`,`breath`,`repair`],ef=e=>Math.round(e*100)/100,tf=e=>Math.round(e*1e3)/1e3,nf=class{constructor(e,t){this.g=e,this.coop=t,this.psT=0,this.snT=0,this.obT=0,this.obBeat=3,this.voiceAcc=0,this.voiceScream=!1,this.voiceT=0}get host(){return this.coop.isHost}send(e,t,n){this.coop.send(e,t,n)}ev(e,...t){this.coop.send(`ev`,[e,...t])}noise(e,t,n,r,i){let a=$d.indexOf(r);a<0||(r===`voice`?(this.voiceAcc=Math.max(this.voiceAcc,n),this.voiceScream=this.voiceScream||i):this.coop.toHost(`nz`,[ef(e),ef(t),tf(n),a,+!!i]))}tick(e){let t=this.g,n=t.player;if(this.psT-=e,this.psT<=0){this.psT=n.alive?1/Zd:.5;let e=0;n.crouching&&(e|=Jd.crouch),n.sprinting&&(e|=Jd.sprint),n.alive&&(e|=Jd.alive),t.charge&&t.charge.active&&t.charge.t>.3&&(e|=Jd.charging),t.input.useHeld&&(e|=Jd.use);let r=t.mic.state===`on`?t.mic.loud:0;this.send(`ps`,[ef(n.x),ef(n.y),ef(n.z),tf(n.yaw),tf(n.pitch),ef(n.speed),e,ef(r),Math.floor(t.score)])}this.host||(this.voiceT-=e,this.voiceT<=0&&this.voiceAcc>0&&(this.voiceT=.12,this.coop.toHost(`nz`,[ef(n.x),ef(n.z),tf(this.voiceAcc),0,+!!this.voiceScream]),this.voiceAcc=0,this.voiceScream=!1)),this.host&&(t.state===`play`||t.state===`dawn`)&&(this.snT-=e,this.snT<=0&&(this.snT=1/Qd,this.send(`sn`,{t:ef(t.time),m:t.monsters.map(e=>this.packMonster(e))})));let r=t.objectives;this.obT-=e,this.obBeat-=e,(r.dirty&&this.obT<=0||this.obBeat<=0)&&(this.obT=.15,this.obBeat=3,r.dirty=!1,this.send(`ob`,r.netState()))}packMonster(e){let t=0;return e.lit&&(t|=1),e.intro&&(t|=2),e.scripted===`freeze`&&(t|=4),[e.id,Rd.indexOf(e.type),ef(e.x),ef(e.z),tf(e.yaw),ef(e.headYaw||0),ef(e.speedCur),Ld.indexOf(e.state),t]}process(){let e=this.g;for(let[t,n,r]of this.coop.drain()){try{this.handle(t,n,r)}catch(e){console.warn(`[sync] bad message`,t,e)}if(e.state===`over`||e.state===`idle`)break}}handle(e,t,n){let r=this.g,i=n===this.coop.hostId;switch(e){case`ps`:{let e=r.remotes.get(n);e&&e.push(t);break}case`sn`:!this.host&&i&&t&&Array.isArray(t.m)&&this.applySnap(t);break;case`ob`:t&&r.objectives.netMerge(t,r.remotes.get(n));break;case`nz`:{if(!this.host||!Array.isArray(t))break;let e=r.remotes.get(n);if(!e||!e.alive||r.state!==`play`)break;r.noise(+t[0],+t[1],Math.min(1,+t[2]),$d[t[3]]||`voice`,!!t[4],n);break}case`sk`:this.host&&r.state===`morning`&&r.startDusk();break;case`ev`:Array.isArray(t)&&this.event(t,n,i);break;case`_left`:r.removeRemote(n)}}event(e,t,n){let r=this.g,[i,a,o,s,c,l]=e,u=r.remotes.get(t);switch(i){case`pu`:u&&r.remotePulse(u,+a,+o,+s,+c,!!l);break;case`st`:u&&r.stones.throw(+a,+o,+s,+c,+l,+e[6],t);break;case`sh`:r.shards.take(a|0);break;case`fx`:r.objectives.remoteFx(a,o|0,s);break;case`fd`:u&&r.fxMateFound(u,o|0);break;default:{if(!n||this.host)break;let e=typeof a==`number`?r.monsterById(a):null;switch(i){case`du`:r.state===`morning`&&r.startDusk();break;case`hu`:e&&r.fxHunt(e,o);break;case`in`:e&&r.fxInvestigate(e,+s||0,o);break;case`lo`:e&&r.fxLost(e,o);break;case`ih`:e&&r.fxInhale(e);break;case`hw`:e&&r.fxHowl(e);break;case`hb`:e&&r.fxBark(e);break;case`ar`:r.fxArrive(a);break;case`wk`:r.fxWake();break;case`ki`:r.netKill(a,o,s,+c,+l);break;case`dn`:r.state===`play`&&r.startDawn();break;case`en`:r.endOnline(!1)}}}}applySnap(e){let t=this.g,n=performance.now();t.netT=+e.t||0;let r=new Set;for(let i of e.m){if(!Array.isArray(i))continue;let[e,a,o,s,c,l,u,d,f]=i,p=Rd[a];if(!p)continue;r.add(e);let m=t.monsterById(e);m||(m=Ud(p,t,e),m.puppet=!0,m.x=o,m.z=s,m.yaw=c,m.state=Ld[d]||`wander`,Math.abs(o)<2e3&&(m.y=t.world.terrain.height(o,s)),t.monsters.push(m)),m.pushSnap(n,{x:o,z:s,yaw:c,hy:l,spd:u,st:Ld[d]||`wander`,lit:!!(f&1),intro:!!(f&2),scr:!!(f&4)})}for(let e=t.monsters.length-1;e>=0;e--){let n=t.monsters[e];r.has(n.id)||(n.dispose(),t.monsters.splice(e,1))}}},rf=2.1,af=2.4,of=1.1,sf=1.15,cf=11,lf=[`dead`,`work`,`cord`,`spin`,`running`],uf=new un,df=new un,ff=new Bt,pf=new bn,mf=new B,hf=new B;function gf(e,t,n,r,i){pf.set(0,i,0,`YXZ`);let a=new un().compose(new B(t,n,r),new Bt().setFromEuler(pf),new B(1,1,1));return(t,n,r,i=0,o=0,s=0,c=1,l=c,u=c)=>{pf.set(i,o,s,`YXZ`),ff.setFromEuler(pf),df.compose(mf.set(t,n,r),ff,hf.set(c,l,u)),uf.multiplyMatrices(a,df),e.setMatrix(uf)}}var _f=null;function vf(){if(_f)return _f;let e=document.createElement(`canvas`);e.width=e.height=64;let t=e.getContext(`2d`),n=t.createRadialGradient(32,32,0,32,32,32);return n.addColorStop(0,`rgba(255,255,255,1)`),n.addColorStop(.18,`rgba(255,220,170,0.75)`),n.addColorStop(.5,`rgba(255,170,90,0.18)`),n.addColorStop(1,`rgba(255,140,60,0)`),t.fillStyle=n,t.fillRect(0,0,64,64),_f=new ta(e),_f}function yf(e,t){for(let n=t.length-1;n>0;n--){let r=Math.floor(e.next()*(n+1));[t[n],t[r]]=[t[r],t[n]]}return t}var bf=class{constructor(e){this.g=e;let t=e.world;this.sites=t.sites;let n=new au(4096);this.bodies=this.sites.map((e,r)=>this._buildBody(n,t,e,r)),this.glows=this.sites.map(t=>this._buildGlow(e.scene,t)),this.gens=[],this.chain=[],this.target=null,this.note=null,this.dirty=!1}netState(){return{g:this.gens.map(e=>[lf.indexOf(e.phase),Math.round(e.progress*1e3)/1e3,e.pulls,Math.round(e.spinT*100)/100,+!!e.hasPart|(e.known?2:0)|(e.running?4:0)]),b:this.bodies.reduce((e,t,n)=>e|(t.searched?1<<n:0),0)}}netMerge(e,t=null){if(!e||!Array.isArray(e.g))return;for(let n=0;n<this.gens.length;n++){let r=this.gens[n],i=e.g[n];if(!Array.isArray(i))continue;let a=lf[i[0]]||`dead`,o=i[4]|0;o&1&&(r.hasPart=!0),o&2&&!r.known&&(r.known=!0,r.beaconT=3.5),+i[1]>r.progress&&(r.progress=Math.min(1,+i[1])),(i[2]|0)>r.pulls&&(r.pulls=i[2]|0),lf.indexOf(a)>lf.indexOf(r.phase)?a===`running`?this._start(r,t||!0):(r.phase=a,a===`cord`&&(r.pullCD=0,r.pullQueued=!1),a===`spin`&&(r.spinT=Math.max(r.spinT,+i[3]||0),r.spinNoiseT=.6,this.g.onSpinUp(r))):a===`spin`&&r.phase===`spin`&&(r.spinT=Math.max(r.spinT,+i[3]||0))}let n=e.b|0;this.bodies.forEach((e,t)=>{n&1<<t&&!e.searched&&(e.searched=!0,e.item.visible=!1,this.target&&this.target.obj===e&&(this.searchT=0))})}remoteFx(e,t,n){let r=this.gens[t];if(!r)return;let i=this.g.audio;e===`clank`?i.clank(r.x,r.y+.6,r.z,n?1:.55):e===`glug`?i.glug(r.x,r.y+.9,r.z):e===`spark`?this.g.onSpark(r,!0):e===`pull`&&(i.cordPull(r.x,r.y+.6,r.z,!!n),this.g.particles.burst(r.x-.4,r.y+1.25,r.z,n?4:10,{color:[.35,.35,.38],speed:1.2,up:1.5,life:1.2,size:.09,gravity:.6,drag:1.2}))}_buildBody(e,t,n,r){let i=n.corpse,a=t.terrain.height(i.x,i.z),o=new Kl(i.seed);e.reset();let s=gf(e,i.x,a,i.z,i.yaw);s(.15,.012,.15,0,o.float(0,6),0,1,1,1.3),e.cylinder(7,.85,.8,.012,J.FLESH,{ringEdges:!1});let c=o.float(-.35,.35);s(0,.13,0,0,0,c),e.box(.44,.21,.64,J.WOOD),s(0,.2,-.05,0,0,c),e.box(.3,.04,.4,J.BONE),s(o.float(-.06,.06),.12,.46,o.float(-.3,.3),o.float(-.8,.8),0),e.rock(.12,()=>o.next(),J.FLESH,.18,.95),s(0,0,0);let l=o.float(.75,.95);e.limb([.21,.13,.26],[.32,.07,.26+l*.5],.05,.04,J.WOOD,4),e.limb([.32,.07,.26+l*.5],[.3,.05,.26+l],.04,.03,J.FLESH,4);let u=o.float(-.4,.2);e.limb([-.21,.13,.24],[-.48,.07,.02+u],.05,.04,J.WOOD,4),e.limb([-.48,.07,.02+u],[-.4,.05,-.32+u],.04,.03,J.FLESH,4);let d=o.float(-.25,.25);e.limb([.1,.11,-.3],[.17+d,.09,-.78],.065,.05,J.WOOD,4),e.limb([.17+d,.09,-.78],[.2+d*1.5,.07,-1.18],.05,.04,J.WOOD,4),e.limb([-.1,.11,-.3],[-.24,.09,-.75],.065,.05,J.WOOD,4),e.limb([-.24,.09,-.75],[-.18,.07,-1.16],.05,.04,J.WOOD,4),s(-.75,.04,.45,Math.PI/2,o.float(0,6),0),e.cylinder(6,.03,.04,.24,J.METAL);let f=new Ai(e.toGeometry(),this.g.world.material);f.matrixAutoUpdate=!1,this.g.scene.add(f),e.reset();let p=.5+l*.4,m=gf(e,i.x,a,i.z,i.yaw);this._buildItem(e,m,r,.62,p);let h=new Ai(e.toGeometry(),this.g.world.material);return h.matrixAutoUpdate=!1,this.g.scene.add(h),{site:n,x:i.x,z:i.z,y:a,mesh:f,item:h,k:-1,searched:!1,revealed:!1,flies:null}}_buildItem(e,t,n,r,i){let a=J.SHARD;t(r,0,i,0,.4+n,0),e.box(.3,.3,.16,a,{bottom:!0}),t(r,.3,i,0,.4+n,0),e.limb([-.1,0,0],[0,.12,0],.012,.012,a,3),e.limb([0,.12,0],[.1,0,0],.012,.012,a,3)}_buildGlow(e,t){let n=vf(),r=new di(new Zr({map:n,color:16765600,blending:2,depthWrite:!1,transparent:!0,opacity:0}));r.position.set(t.lamp.x,t.lamp.y-.05,t.lamp.z),r.scale.setScalar(1.3);let i=new di(new Zr({map:n,color:16751184,blending:2,depthWrite:!1,transparent:!0,opacity:0}));return i.position.copy(r.position),i.scale.setScalar(7),r.visible=i.visible=!1,e.add(r,i),{core:r,halo:i}}reset(e){this.chain=[0,...yf(e,[1,2,3,4])];for(let e of this.gens)e.hum&&e.hum.stop();this.gens=this.chain.map((e,t)=>({k:t,si:e,site:this.sites[e],spec:W.GENERATORS[t],x:this.sites[e].x,y:this.sites[e].y,z:this.sites[e].z,phase:`dead`,progress:0,pulls:0,pullCD:0,spinT:0,spinNoiseT:0,hasPart:!1,known:t===0,running:!1,lamp:0,flick:0,hum:null,beaconT:1.5+t,clankT:.5,sparkT:1.5}));for(let e of this.bodies)e.k=this.chain.indexOf(this.sites.indexOf(e.site)),e.searched=!1,e.revealed=!1,e.mesh.visible=!0,e.item.visible=!0,e.flies&&e.flies.stop(),e.flies=null;this.bodies[0].mesh.visible=!1,this.bodies[0].item.visible=!1,this.morningOn=!1,this.target=null,this.searchT=0,this.closeNote(),this.lastTask=``,this.pendingTask=null,this.count=0,this.dirty=!1,this.firstRevealDone=!1;for(let e=0;e<5;e++)X.uLamp.value[e].w=0;for(let e of this.glows)e.core.visible=e.halo.visible=!1}setMorning(e){this.morningOn=e;let t=this.gens[0];t.lamp=e?1:t.lamp}campFail(){let e=this.gens[0];if(this.morningOn=!1,e.flick=1.4,e.dying=!0,e.hum){e.hum.sputter();let t=e.hum;e.hum=null,setTimeout(()=>t.stop(),1600)}}startNight(){let e=this.gens[0];e.dying=!1,e.lamp=0,e.hum&&(e.hum.stop(),e.hum=null),this.bodies[0].mesh.visible=!0,this.bodies[0].item.visible=!0}silence(){for(let e of this.gens)e.hum&&e.hum.stop(),e.hum=null,e.lamp=0,e.running=!1;for(let e of this.bodies)e.flies&&e.flies.stop(),e.flies=null;this.morningOn=!1,this.closeNote();for(let e=0;e<5;e++)X.uLamp.value[e].w=0;for(let e of this.glows)e.core.visible=e.halo.visible=!1}lampAt(e,t){let n=0,r=W.LAMP_R;for(let i=0;i<5;i++){let a=X.uLamp.value[i];if(a.w<=.001)continue;let o=Math.hypot(a.x-e,a.z-t);if(o>r*1.5)continue;let s=1-Ql(r*.12,r*1.5,o);n=Math.max(n,s*s*Math.min(1,a.w/sf))}return n}inLamp(e,t){return this.lampAt(e,t)>.18}siteAt(e){return K(`siteAt`)[e.id]||``}taskText(){let e=this.gens.find(e=>!e.running);return e?e.phase===`spin`?K(`taskSpin`):e.hasPart?K(`taskRepair`).replace(`{site}`,this.siteAt(e.site)):e.k===0?K(`taskCamp`):e.known?K(`taskFollow`).replace(`{site}`,this.siteAt(e.site)):K(`taskFindNext`):``}update(e,t){let n=this.g,r=n.player,i=n.ears(),a=n.audio;for(let t of this.gens){let n=t.running||t.k===0&&this.morningOn?1:0;t.phase===`spin`&&(n=.25*Ql(0,t.spec.spin,t.spinT)*(Math.random()<.3?1:.2)),t.lamp=$l(t.lamp,n,t.running?3:6,e),t.dying&&(t.lamp=$l(t.lamp,0,1.6,e));let r=t.lamp;t.flick>0&&(t.flick-=e,r*=Math.random()<.45?.15:1),X.uLamp.value[t.si].set(t.site.lamp.x,t.site.lamp.y,t.site.lamp.z,r*sf);let i=this.glows[t.si];i.core.visible=i.halo.visible=r>.01,i.core.material.opacity=Math.min(1,r*1.2),i.halo.material.opacity=r*.22;let o=(t.running||t.k===0&&this.morningOn&&!t.dying)&&a.ready;o&&!t.hum&&(t.hum=a.genHum(t.x,t.y+.5,t.z)),!o&&t.hum&&!t.dying&&(t.hum.stop(),t.hum=null)}if(!t)return;for(let e of this.bodies){if(!e.mesh.visible)continue;let t=Math.hypot(e.x-i.x,e.z-i.z);t<15&&!e.flies&&a.ready?e.flies=a.flies(e.x,e.y+.3,e.z):t>20&&e.flies&&(e.flies.stop(),e.flies=null)}for(let t of this.gens){if(!r.alive)break;if(!t.known||t.running||t.phase===`spin`||(t.beaconT-=e,t.beaconT>0))continue;let i=Math.hypot(t.x-r.x,t.z-r.z);if(t.beaconT=2.2+2.8*q(i/90,0,1),i<3)continue;a.beacon(t.x,t.y+1.1,t.z);let o=t.x-r.x,s=t.z-r.z,c=-Math.sin(r.yaw),l=-Math.cos(r.yaw);n.hud.beacon(Math.atan2(o*-l+s*c,o*c+s*l),i),n.radar.blip(t.x,t.z,`beacon`)}for(let t of this.gens)t.phase===`spin`&&(t.spinT+=e,t.spinNoiseT-=e,t.hum?t.hum.spin(t.spinT/t.spec.spin):a.ready&&(t.hum=a.genHum(t.x,t.y+.5,t.z,!0)),t.spinNoiseT<=0&&(t.spinNoiseT=1.8,n.noise(t.x,t.z,t.spec.spinLoud,`repair`),n.particles.burst(t.x,t.y+1,t.z,8,{color:[1,.8,.45],speed:3,up:2,life:.5,size:.05,gravity:-6,drag:1.5})),t.spinT>=t.spec.spin&&this._start(t));this.note&&(this.note.t-=e,this.note.t<=0&&this.closeNote()),r.alive?this._interact(e):this.target&&(this.target=null,n.hud.setUse(null));let o=this.taskText();o!==this.lastTask&&(this.lastTask=o,this.pendingTask=o),this.pendingTask&&n.intro.itHearsT<0&&n.firstPingT>=0&&n.time>n.firstPingT+3.5&&(n.hud.task(),this.pendingTask=null)}_interact(e){let t=this.g,n=t.player,r=t.input,i=n.forward(),a=null,o=1e9,s=(e,t,r,s,c)=>{let l=t-n.x,u=r-n.z,d=Math.hypot(l,u);if(d>s)return;let f=d<1.1?1:(l*i.x+u*i.z)/d;if(f<.25)return;let p=d*(1.6-f);p<o&&(o=p,a={obj:e,kind:c,d})};for(let e of this.bodies)!e.searched&&e.mesh.visible&&s(e,e.x,e.z,rf,`body`);for(let e of this.gens)e.running||s(e,e.x,e.z,af,`gen`);a&&this.target&&a.obj!==this.target.obj&&(this.searchT=0),this.target=a;let c=r.useHeld,l=t.events.includes(`useDown`),u=n.speed<.6,d=t.hud;if(!a){this.searchT=0,d.setUse(null);return}let f=a.obj,p=e=>K(r.touch?e+`T`:e);if(a.kind===`body`){c&&u?this.searchT+=e:this.searchT=Math.max(0,this.searchT-e*2),d.setUse(p(`useSearch`),this.searchT/of,!0),this.searchT>=of&&(this.searchT=0,this._search(f));return}let m=f,h=m.spec;m.phase===`spin`?d.setUse(K(`useSpin`),m.spinT/h.spin,!1):m.hasPart?m.phase===`cord`?(d.setUse(p(`useCord`).replace(`{n}`,m.pulls).replace(`{m}`,h.pulls),m.pulls/h.pulls,!0),m.pullCD-=e,l&&(m.pullQueued=!0),m.pullQueued&&m.pullCD<=0&&(m.pullQueued=!1,this._pull(m))):(d.setUse(p(`useHold`).replace(`{action}`,K(`actions`)[h.part]),m.progress,!0),c&&u&&this._work(m,e)):d.setUse(K(`useNeed`).replace(`{part}`,K(`parts`)[h.part]),0,!1,!0)}_search(e){let t=this.g;e.searched=!0,e.item.visible=!1;let n=e.k,r=this.gens[n];r.hasPart=!0,r.known=!0,this.dirty=!0,t.sync&&t.sync.ev(`fd`,this.bodies.indexOf(e),n);let i=this.gens[n+1];i&&!i.running&&(i.known=!0,i.beaconT=3.5),t.onCorpseSearched(e,n);let a=i?this.siteAt(i.site):``,o=K(`notes`)[n].replace(`{next}`,a);this.openNote(`${K(`noteKicker`)} · ${K(`parts`)[r.spec.part]}`,o)}openNote(e,t){this.note={t:cf},this.g.hud.showNote(e,t),this.g.audio.paper()}closeNote(){this.note&&(this.note=null,this.g.hud.showNote(null))}_work(e,t){let n=this.g,r=e.spec;e.phase===`dead`&&(e.phase=`work`),e.progress=Math.min(1,e.progress+t/r.dur),this.dirty=!0,e.clankT-=t,e.clankT<=0&&(e.clankT=r.clank[0]+Math.random()*(r.clank[1]-r.clank[0]),r.part===`fuel`?n.audio.glug(e.x,e.y+.9,e.z):n.audio.clank(e.x,e.y+.6,e.z,r.mode===`clank`?1:.55),n.sync&&n.sync.ev(`fx`,r.part===`fuel`?`glug`:`clank`,e.k,+(r.mode===`clank`)),n.playerNoise(e.x,e.z,r.clankLoud,`repair`),n.addTrauma(r.mode===`clank`?.05:.02)),r.mode===`spark`&&(e.sparkT-=t,e.sparkT<=0&&(e.sparkT=r.spark[0]+Math.random()*(r.spark[1]-r.spark[0]),n.onSpark(e),n.sync&&n.sync.ev(`fx`,`spark`,e.k))),e.progress>=1&&(r.mode===`cord`?(e.phase=`cord`,e.pullCD=0,e.pullQueued=!1):r.mode===`spinup`?(e.phase=`spin`,e.spinT=0,e.spinNoiseT=.6,n.onSpinUp(e)):this._start(e))}_pull(e){let t=this.g,n=e.spec;e.pulls++,e.pullCD=.75,this.dirty=!0;let r=e.pulls>=n.pulls;t.audio.cordPull(e.x,e.y+.6,e.z,r),t.sync&&t.sync.ev(`fx`,`pull`,e.k,+!!r),t.playerNoise(e.x,e.z,n.pullLoud,`repair`),t.addTrauma(.08),t.particles.burst(e.x-.4,e.y+1.25,e.z,r?4:10,{color:[.35,.35,.38],speed:1.2,up:1.5,life:1.2,size:.09,gravity:.6,drag:1.2}),r&&this._start(e)}_start(e,t=null){if(e.running)return;let n=this.g;e.phase=`running`,e.running=!0,e.flick=1.2,e.hum&&e.hum.spin(1),this.count=this.gens.filter(e=>e.running).length,t||(this.dirty=!0),n.audio.genStart(e.x,e.y+.6,e.z),n.onGeneratorStarted(e,this.count,t&&t!==!0?t:null)}onFront(e){let t=this.g;for(let n of this.bodies){if(n.revealed||!n.mesh.visible)continue;let r=Math.hypot(n.x-e.x,n.y+.3-e.y,n.z-e.z);r>e.prevR&&r<=e.curR&&r<=e.radius&&(n.revealed=!0,n.searched||(t.audio.discover(n.x,n.y+.4,n.z),t.radar.blip(n.x,n.z,`beacon`)))}}},xf=class{constructor(e){this.world=e,this.id=`me`,this.alive=!0,this.reset()}reset(e=0){let t=this.world.spawn,[n,r]=Yd[e%4]||[0,0],i=Math.cos(t.yaw),a=Math.sin(t.yaw),o={x:t.x+i*n+a*r,z:t.z-a*n+i*r};e&&this.world.col.resolve(o,W.PLAYER.radius),this.x=o.x,this.z=o.z,this.yaw=t.yaw,this.alive=!0,this.pitch=-.04,this.roll=0,this.vx=0,this.vz=0,this.speed=0,this.y=this.world.terrain.height(this.x,this.z),this.eyeCur=W.PLAYER.eye,this.stamina=W.PLAYER.stamina,this.exhausted=!1,this.staminaDelay=0,this.stepAcc=0,this.bobPhase=0,this.bobY=0,this.crouching=!1,this.sprinting=!1,this.bumpCD=0,this.stones=W.PLAYER.maxStones,this.stoneTimer=0,this.breathT=0,this.moved=0,this.distFromSpawn=0}forward(){return{x:-Math.sin(this.yaw),z:-Math.cos(this.yaw)}}update(e,t,n,r=!1){let i=W.PLAYER,a={step:null,bump:null,breath:!1};this.yaw-=n.dx,this.pitch=q(this.pitch-n.dy,-1.35,1.35),this.yaw-=t.turn*2.3*e;let o=r?0:t.move.x,s=r?0:t.move.y,c=Math.min(1,Math.hypot(o,s));this.crouching=t.crouch&&!r;let l=t.sprint&&!this.crouching&&c>.3&&!this.exhausted&&this.stamina>2;this.sprinting=l;let u=this.crouching?i.crouch:l?i.sprint:i.walk,d=Math.sin(this.yaw),f=Math.cos(this.yaw),p=(-d*s+f*o)*u,m=(-f*s-d*o)*u,h=c>.01?i.accel:i.decel;this.vx=$l(this.vx,p,h,e),this.vz=$l(this.vz,m,h,e);let g=this.x,_=this.z,v={x:this.x+this.vx*e,z:this.z+this.vz*e},y=this.world.col.resolve(v,i.radius),b=W.WORLD_WALL;if(v.x=q(v.x,-b,b),v.z=q(v.z,-b,b),this.bumpCD-=e,y.hit){let e=-(this.vx*y.nx+this.vz*y.nz);e>1.9&&this.bumpCD<=0&&y.kind!==4&&(a.bump={nx:y.nx,nz:y.nz,x:v.x-y.nx*i.radius,z:v.z-y.nz*i.radius,strength:Math.min(1,e/5)},this.bumpCD=.7);let t=this.vx*y.nx+this.vz*y.nz;t<0&&(this.vx-=t*y.nx,this.vz-=t*y.nz)}this.x=v.x,this.z=v.z;let x=Math.hypot(this.x-g,this.z-_);this.speed=x/Math.max(e,1e-4),this.moved+=x,this.distFromSpawn=Math.hypot(this.x-this.world.spawn.x,this.z-this.world.spawn.z);let S=this.world.terrain.height(this.x,this.z);this.y=$l(this.y,S,18,e),this.sprinting&&this.speed>1?(this.stamina-=i.sprintDrain*e,this.staminaDelay=.8,this.stamina<=0&&(this.stamina=0,this.exhausted=!0,this.sprinting=!1)):(this.staminaDelay-=e,this.staminaDelay<=0&&(this.stamina=Math.min(i.stamina,this.stamina+i.staminaRegen*e*(this.exhausted?.7:1))),this.exhausted&&this.stamina>=i.exhaustedUntil&&(this.exhausted=!1)),this.exhausted?(this.breathT-=e,this.breathT<=0&&(a.breath=!0,this.breathT=1.15)):this.breathT=.3,this.stones<i.maxStones?(this.stoneTimer+=e,this.stoneTimer>=i.stoneRegen&&(this.stones++,this.stoneTimer=0)):this.stoneTimer=0;let C=this.crouching?i.crouchEye:i.eye;this.eyeCur=$l(this.eyeCur,C,10,e);let w=this.crouching?i.stepCrouch:this.sprinting?i.stepSprint:i.stepWalk;if(this.speed>.25){if(this.stepAcc+=x,this.bobPhase+=x/w*Math.PI,this.stepAcc>=w){this.stepAcc-=w;let e=this.crouching?`crouch`:this.sprinting?`sprint`:`walk`;a.step={loud:e===`sprint`?.24:e===`walk`?.085:0,mode:e,intensity:e===`sprint`?.85:e===`walk`?.4:.12}}}else this.stepAcc=Math.min(this.stepAcc,w*.6);let T=q(this.speed/i.sprint,0,1)*(this.sprinting?.075:.045);return this.bobY=-Math.abs(Math.sin(this.bobPhase))*T,this.roll=$l(this.roll,Math.sin(this.bobPhase)*T*.35-t.move.x*.012,10,e),a}},Sf=class{constructor(e){let t=new au(256);t.identity(),t.octa(.2,.36,J.SHARD),t.place(0,0,0,0,.6,0),t.octa(.12,.2,J.SHARD),t.identity(),t.limb([0,.45,0],[0,5.5,0],.03,.01,12,3);let n=t.toGeometry();this.max=W.SHARDS,this.glow=new Float32Array(this.max),this.phase=new Float32Array(this.max);for(let e=0;e<this.max;e++)this.phase[e]=Math.random()*6.28;this.glowAttr=new Pi(this.glow,1),this.glowAttr.setUsage(et),n.setAttribute(`aGlow`,this.glowAttr),n.setAttribute(`aPhase`,new Pi(this.phase,1)),this.mesh=new Hi(n,Pu(),this.max),this.mesh.frustumCulled=!1,this.mesh.renderOrder=6,e.add(this.mesh),this.items=[],this._m=new un}reset(e,t){this.items=[];let n=[],r=0;for(;n.length<this.max&&r++<4e3;){let r=e.randomOpenPoint(t,24);n.some(e=>Math.hypot(e.x-r.x,e.z-r.z)<16)||n.push(r)}n[0]=this._near(e,t,16,24)||n[0],n[1]=this._near(e,t,26,38)||n[1];for(let t=0;t<this.max;t++){let r=n[t%n.length],i=e.terrain.height(r.x,r.z)+1.05;this.items.push({x:r.x,y:i,z:r.z,alive:!0,chimeT:Math.random()*3}),this._m.makeTranslation(r.x,i,r.z),this.mesh.setMatrixAt(t,this._m),this.glow[t]=0}this.mesh.instanceMatrix.needsUpdate=!0,this.glowAttr.needsUpdate=!0}_near(e,t,n,r){for(let i=0;i<40;i++){let i=t.float(0,Math.PI*2),a=t.float(n,r),o=e.spawn.x+Math.cos(i)*a,s=e.spawn.z+Math.sin(i)*a;if(e.col.free(o,s,1.2))return{x:o,z:s}}return null}take(e){let t=this.items[e];t&&t.alive&&(t.alive=!1,this.glow[e]=0,this._m.makeScale(0,0,0),this.mesh.setMatrixAt(e,this._m),this.mesh.instanceMatrix.needsUpdate=!0,this.glowAttr.needsUpdate=!0)}remaining(){return this.items.reduce((e,t)=>e+ +!!t.alive,0)}onFront(e,t){for(let n=0;n<this.items.length;n++){let r=this.items[n];if(!r.alive)continue;let i=Math.hypot(r.x-e.x,r.y-e.y,r.z-e.z);if(i>e.prevR&&i<=e.curR&&i<=e.radius){let e=this.glow[n];this.glow[n]=Math.max(this.glow[n],1.25),e<.5&&(t.audio.chime(r.x,r.y,r.z,n%7,.12,!0),t.radar.blip(r.x,r.z,`shard`))}}}update(e,t){let n=t.player;if(!n.alive)return;let r=!1;for(let i=0;i<this.items.length;i++){let a=this.items[i];if(!a.alive){this.glow[i]!==0&&(this.glow[i]=0,r=!0);continue}let o=Math.hypot(a.x-n.x,a.z-n.z),s=this.glow[i]-e*.11;o<4.5&&(s=Math.max(s,.5*(1-o/4.5))),s=Math.max(0,s),s!==this.glow[i]&&(this.glow[i]=s,r=!0),o<22&&(a.chimeT-=e,a.chimeT<=0&&(t.audio.chime(a.x,a.y,a.z,i%5+7,.05*(1-o/22)+.01,!0),a.chimeT=3+Math.random()*2)),o<1.35&&Math.abs(n.y+1-a.y)<2.5&&(a.alive=!1,this.glow[i]=0,this._m.makeScale(0,0,0),this.mesh.setMatrixAt(i,this._m),this.mesh.instanceMatrix.needsUpdate=!0,r=!0,t.onShard(a,i))}r&&(this.glowAttr.needsUpdate=!0)}},Cf=class{constructor(){this.list=[]}clear(){this.list=[]}throw(e,t,n,r,i,a,o=null){let s=16.5;this.list.push({x:e,y:t,z:n,vx:r*s,vy:i*s+4.2,vz:a*s,t:0,trailT:0,owner:o})}update(e,t){let n=t.world;for(let r=this.list.length-1;r>=0;r--){let i=this.list[r];i.t+=e,i.vy-=19*e;let a=i.x+i.vx*e,o=i.y+i.vy*e,s=i.z+i.vz*e;i.trailT-=e,i.trailT<=0&&(t.particles.burst(i.x,i.y,i.z,1,{color:[.5,.65,.75],speed:.1,life:.35,size:.05,gravity:0,drag:2}),i.trailT=.03);let c=null,l=n.terrain.height(a,s);if(o<=l+.05&&(c={x:a,y:l+.05,z:s,water:!1}),!c){let e=n.col.query(a,s,1.5);for(let t of e){let e=n.col.caps[t];if(e.kind===cu.WATER||o-l>e.h)continue;let r={d:0,nx:0,nz:0};if(su.closest(e,a,s,r),r.d<.08){c={x:a+r.nx*.1,y:o,z:s+r.nz*.1,water:!1,kind:e.kind};break}}}if(!c&&n.lake){let e=n.lake;Math.hypot(a-e.x,s-e.z)<e.r+2&&o<=e.y+.05&&(c={x:a,y:e.y,z:s,water:!0})}c||i.t>4?(this.list.splice(r,1),c&&t.onStoneImpact(c,i.owner)):(i.x=a,i.y=o,i.z=s)}}},wf=new B,Tf=[1,.13,.08],Ef=[1,.82,.7],Df=class{constructor(e,t){this.g=e,this.eyes=t,this.reset()}reset(){let e=this.g.rng;this.hallT=e?e.float(55,80):60,this.flickT=1,this.flickLeft=0,this.flickAmt=0,this.introGlint=!1,this.eyes.clear()}get flicker(){return this.flickLeft>0?this.flickAmt:0}eyePos(e){let t=e.rig.nodes.head;e.rig.root.updateMatrixWorld(!0),t.getWorldPosition(wf);let n=e.yaw+(e.headYaw||0),r=e.type===`crawler`?.16:e.type===`howler`?.24:.09,i=e.type===`crawler`?.07:e.type===`howler`?.08:.06;return{x:wf.x+Math.sin(n)*r,y:wf.y+i,z:wf.z+Math.cos(n)*r,yaw:n}}glintMonster(e,t,n,r=!1){let i=this.eyePos(e);this.eyes.add(i.x,i.y,i.z,i.yaw,{time:this.g.time,life:n,intensity:t,blink:r,spacing:e.type===`crawler`?.2:e.type===`howler`?.18:.26,size:e.type===`crawler`||e.type===`howler`?.13:.16,color:Tf})}update(e){let t=this.g,n=t.player,r=t.rng,i=G.scares===`reduced`,a=!1;if(!this.introGlint&&t.firstPingT<0&&t.intro.t>4.6){let e=t.monsters.find(e=>e.intro);e&&this.glintMonster(e,.9,.9,!0),this.introGlint=!0}for(let i of t.monsters){if(i.state===`hunt`&&(a=!0),i.scripted===`freeze`||i.state===`flee`||i.noEyes)continue;let o=i.playerDist;if(o>42||o<2.5||(i.glintT===void 0&&(i.glintT=r.float(2,6)),i.glintT-=e,i.glintT>0))continue;let s=i.state;i.glintT=s===`hunt`?r.float(1.1,2.2):s===`investigate`||s===`search`?r.float(2.6,5):r.float(7,15);let c=Math.atan2(n.x-i.x,n.z-i.z);if(Math.abs(eu(i.yaw+(i.headYaw||0),c))>1.25||t.time-(i.lastGhostT??-9)<1.2)continue;let l=1-o/46,u=(s===`hunt`?1.1:s===`wander`||s===`idle`?.5:.8)*(.45+.55*l);this.glintMonster(i,u,s===`hunt`?.3:.45+r.float(0,.3),s!==`hunt`&&r.chance(.4))}for(let n of t.monsters)n.state!==`search`&&n.state!==`investigate`||n.playerDist>8||(n.sniffT=(n.sniffT??r.float(.6,2))-e,!(n.sniffT>0)&&(n.sniffT=r.float(3.5,6.5),t.audio.sniff(n.x,n.y+n.headY,n.z,.42+.25*(1-n.playerDist/8))));let o=t.time-(t.lastPulseT??-9)>2.4;t.firstPingT>=0&&t.time>45&&!a&&t.state===`play`&&(this.hallT-=e,this.hallT<=0&&o&&(this.hallT=r.float(24,48)*(t.time>900?.75:1),r.chance(.5)?this.peripheralShade():this.fakeEyes(t.time>600&&r.chance(.3)?r.int(3,5):1)));let s=t.fx.danger;this.flickLeft>0&&(this.flickLeft-=e),!i&&s>.5&&(this.flickT-=e,this.flickT<=0&&(this.flickAmt=r.float(.35,.85),this.flickLeft=r.float(.04,.12),this.flickT=r.float(.35,2.2)/s))}peripheralShade(){let e=this.g,t=e.player,n=e.rng;for(let r=0;r<8;r++){let r=n.sign(),i=t.yaw+r*n.float(.62,.86),a=n.float(9,17),o=t.x-Math.sin(i)*a,s=t.z-Math.cos(i)*a;if(!e.world.col.free(o,s,.6))continue;let c=e.world.terrain.height(o,s);if(e.shade.place(o,c,s,Math.atan2(t.x-o,t.z-s)),e.ghosts.spawn(e.shade.rig,e.time,{strength:n.float(.26,.4),life:1.3,decay:1.4,color:12065812,jitter:1.6,body:.5}),e.audio.duck(.12,.35,1.6,2.4),n.chance(.4)&&e.audio.exhale(o,c+1.8,s,.22),n.chance(.5)){let n=e.shade.rig.nodes.head;e.shade.rig.root.updateMatrixWorld(!0),n.getWorldPosition(wf),this.eyes.add(wf.x,wf.y+.02,wf.z,Math.atan2(t.x-o,t.z-s),{time:e.time,life:1,intensity:.6,spacing:.16,size:.12,color:Ef})}return}}fakeEyes(e){let t=this.g,n=t.player,r=t.rng;e>1&&t.audio.duck(.1,.5,2.2,2.6);for(let i=0;i<e;i++){let e=n.yaw+r.float(-.75,.75),a=r.float(13,32),o=n.x-Math.sin(e)*a,s=n.z-Math.cos(e)*a,c=t.world.terrain.height(o,s)+r.float(1.3,2.5);this.eyes.add(o,c,s,Math.atan2(n.x-o,n.z-s),{time:t.time+i*r.float(.1,.5),life:r.float(.6,1.3),intensity:r.float(.45,.8),blink:r.chance(.5),spacing:r.float(.2,.3),size:.16,color:r.chance(.75)?Tf:Ef})}}},Of=[1,.13,.08],kf=[.84,.92,1],Af=[.85,.95,1],jf=[1,.36,.1],Mf=[1,.74,.42],Nf=.95,Pf={dx:0,dy:0},Ff=new Set([`voice`,`ping`,`step`,`bump`,`breath`,`repair`]),If=new B,Lf=e=>String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),Rf=class{constructor(e){Object.assign(this,e),this.player=new xf(this.world),this.dread=new Df(this,this.eyes),this.shards=new Sf(this.scene),this.stones=new Cf,this.shade=new Wd,this.objectives=new bf(this),this.hud.onNoteClose=()=>this.objectives.closeNote(),this.events=[],this.monsters=[],this.timeline=[],this.noiseGen=new Xl(99),this.state=`idle`,this.fx=this._fxDefaults(),this.time=0,this.score=0,this.mult=1,this.hearingScale=1,this.speedScale=1,this.onEnd=null,this.role=`solo`,this.coop=null,this.sync=null,this.remotes=new Map,this.spectate=null,this.inputMuted=!1,this.netT=0,this.scareRigs={},this._ears={x:0,y:0,z:0}}get auth(){return this.role!==`client`}get online(){return this.role!==`solo`}livePlayers(){let e=[];this.player.alive&&e.push(this.player);for(let t of this.remotes.values())t.alive&&e.push(t);return e}isPlayer(e){return e===this.player||!!e&&this.remotes.get(e.id)===e}playerById(e){return e===this.player.id?this.player:this.remotes.get(e)||null}localAlive(){return this.player.alive}monsterById(e){for(let t of this.monsters)if(t.id===e)return t;return null}ears(){return this._ears}_updateEars(){let e=this._ears,t=this.spectate&&this.spectate.target||this.player;e.x=t.x,e.y=t.y+(t.eyeCur||1.6),e.z=t.z}distToEars(e,t){return Math.hypot(this._ears.x-e,this._ears.z-t)}setupOnline(e,t){this.coop=e,this.role=e.isHost?`host`:`client`,this.sync=new nf(this,e),this.player.id=e.selfId;for(let e of this.remotes.values())e.liveGhost&&this.ghosts.release(e.liveGhost);this.remotes.clear();for(let n of t){if(n.id===e.selfId)continue;let t=new Xd(this,n);this.remotes.set(n.id,t),this.audio.voiceSpatial(n.id,!0)}this.teamSize=t.length}setupSolo(){for(let e of this.remotes.values())e.liveGhost&&this.ghosts.release(e.liveGhost);this.remotes.clear(),this.role=`solo`,this.coop=null,this.sync=null,this.player.id=`me`,this.teamSize=1}teardownOnline(){for(let e of this.audio.voices.keys())this.audio.voiceSpatial(e,!1),this.audio.voiceSet(e,0,0,0,1);for(let e of this.remotes.values())e.liveGhost&&this.ghosts.release(e.liveGhost),e.liveGhost=null,this.audio.voiceSpatial(e.id,!1),this.audio.voiceSet(e.id,0,0,0,1)}removeRemote(e){let t=this.remotes.get(e);t&&(t.liveGhost&&this.ghosts.release(t.liveGhost),this.remotes.delete(e),this.state!==`over`&&this.hud.popup(K(`mateLeft`).replace(`{name}`,t.name),`dim`),this.spectate&&this.spectate.target===t&&this.nextSpectate(),this.auth&&this.checkTeam())}_fxDefaults(){return{trauma:0,glitch:0,red:0,white:0,shockT:9,shockAmp:0,fovKick:0,danger:0,slowT:0,timeScale:1,fade:1,aberr:.12}}reset(e={}){this.rng=new Kl(e.seed==null?(Date.now()^Math.random()*1e9)>>>0:e.seed>>>0),this.time=0,this.score=0,this.mult=1,this.stats={shards:0,close:0,escapes:0,loudest:0,hunts:0,gens:0,bodies:0},this.state=`morning`,this.grace=!0,this.fx=this._fxDefaults(),this.timeline=[],this.player.reset(e.slot||0),this.player.alive=!0,this.spectate=null,this.localDeath=!1,this.inputMuted=!1,this.teamOverAt=0,this.netT=0;for(let e of this.remotes.values())e.liveGhost=null;this.pulses.clear(),this.ghosts.clear(),this.particles.clear(),this.stones.clear(),this.radar.clear();for(let e of this.monsters)e.dispose();this.monsters=[],this.shards.reset(this.world,this.rng),this.objectives.reset(this.rng),this.objectives.setMorning(!0),this.charge={active:!1,t:0},this.pingCD=0,this.stepNoise=0,this.killer=null,this.deathT=0,this.dawnT=0,this.morningT=0,this.duskT=0,this.duskHit=!1,this.leashT=0,this.morningAudio=!1,this.events=[],this._resetNight(),X.uDawn.value=Nf,X.uMorning.value=1,X.uSun.value.set(.42,.62,-.66).normalize(),X.uFear.value=0,this.dread.reset(),this.hud.setIntro(null),this.hud.setHint(null),this.hud.setUse(null),this.hud.showNote(null),this.hud.setSkip(!0)}_resetNight(){this.lastHeardAlert=-10,this.lastScreamAlert=-10,this.screamFlag=!1,this.nextScare=80+this.rng.float(0,35),this.scareCount=0,this.firstPingT=-1,this.lastPulseT=-9,this.intro={t:0,phase:0,autoSnap:!1,revealDone:!1,itHearsT:-1},this.tut={step:0,t:0,done:G.tutorialDone},this.lastMultStep=1,this.endgame=!1,this.wakeT=0,this.hinted={}}updateMorning(e,t){let n=this.player;this.morningT+=e,this.time+=e,!this.morningAudio&&this.audio.ready&&this.audio.ambOn&&(this.morningAudio=!0,this.audio.setMorning(!0)),this.netFrame(e);for(let e of this.inputMuted?[]:t.events)if(e===`confirm`||e===`skip`){if(this.auth){this.startDusk();return}this.coop.toHost(`sk`,1)}if(this.state!==`morning`)return;let r=n.update(e,this.input,this.inputMuted?Pf:t.look,this.inputMuted);r.step&&this.audio.footstep(r.step.intensity*.8),r.bump&&(this.audio.bump(),this.addTrauma(.12));let i=W.CAMP_LEASH,a=n.x-0,o=n.z-3,s=Math.hypot(a,o);s>i&&(n.x=0+a/s*i,n.z=3+o/s*i,n.vx*=.2,n.vz*=.2,this.leashT=2.8);let c=this.hud;this.morningT>.8&&this.morningT<7.5?c.setIntro(K(`morningBig`),K(`morningSmall`)):c.setIntro(null);let l=null;this.morningT>8&&this.morningT<17?l=this.input.touch?K(`morningHintTouch`):K(`morningHint`):this.morningT>19&&this.morningT<26&&(l=K(`morningGen`)),this.leashT>0&&(this.leashT-=e,l=K(`campLeash`)),c.setHint(l),this.objectives.update(e,!1),this.pulses.update(this.time),this.audio.morningTick(),this.fx.danger=0,this._commonFx(e),this.morningT>=W.MORNING_SECONDS+(this.auth?0:6)&&this.startDusk()}startDusk(){this.state===`morning`&&(this.state=`dusk`,this.duskT=0,this.duskHit=!1,this.duskLight=X.uDawn.value,this.hud.setIntro(null),this.hud.setHint(null),this.hud.setSkip(!1),this.audio.dusk(),this.objectives.campFail(),this.role===`host`&&this.sync.ev(`du`))}updateDusk(e,t){this.duskT+=e,this.time+=e;let n=this.duskT,r=this.duskLight*(1-Ql(.15,1.75,n));n>.45&&n<1.75&&Math.sin(n*61)*Math.sin(n*23)>.2&&(r*=.2),X.uDawn.value=Math.max(0,r),this.netFrame(e),this.player.update(e,this.input,this.inputMuted?Pf:t.look,!0),n>=1.8&&!this.duskHit&&(this.duskHit=!0,X.uDawn.value=0,this.addTrauma(.55),this.fx.glitch=.7,this.fx.shockT=0,this.fx.shockAmp=.7),this.objectives.update(e,!1),this.pulses.update(this.time),this._commonFx(e),n>=W.DUSK_SECONDS&&this.startNight()}startNight(){this.state=`play`,this.time=0,X.uDawn.value=0,X.uMorning.value=0,X.uSun.value.set(.5,.35,-.8).normalize(),this.pulses.clear(),this.ghosts.clear();for(let e of this.remotes.values())e.liveGhost=null;if(this.timeline=[],this.audio.setMorning(!1),this.objectives.setMorning(!1),this.objectives.startNight(),this._resetNight(),this.dread.reset(),this.hud.setSkip(!1),this.hud.setIntro(null),this.hud.setHint(null),!this.auth){for(let e of this.monsters)e.dispose();this.monsters=[];return}let e=this.player,t=e.forward(),n=e.x+t.x*17+t.z*2.5,r=e.z+t.z*17-t.x*2.5;for(let e=0;e<20&&!this.world.col.free(n,r,.8);e++)n+=this.rng.float(-2,2),r+=this.rng.float(-2,2);let i=Ud(`listener`,this);i.spawn(n,r,`idle`),i.yaw=Math.atan2(e.x-n,e.z-r),i.scripted=`freeze`,i.intro=!0,this.monsters.push(i),this.spawnMonster(`listener`,75,100)}lightAt(e,t,n){let r=0;for(let i of this.pulses.slots)i.active&&(r+=Fu.lightAt(i,Math.hypot(e-i.x,t-i.y,n-i.z),this.time));return r}movingForHowler(e=this.player){return e===this.player?e.speed>.7||this.charge.active&&this.charge.t>.3:e.speed>.7||!!e.charging}addTrauma(e){let t=G.scares===`reduced`?.6:1;this.fx.trauma=Math.min(1,this.fx.trauma+e*t)}_around(){let e=this.livePlayers();return e.length?e[Math.floor(this.rng.next()*e.length)]:this.player}_clearOfPlayers(e,t,n){for(let r of this.livePlayers())if(Math.hypot(r.x-e,r.z-t)<n)return!1;return!0}spawnMonster(e,t,n){let r=this._around(),i=W.WORLD_WALL-6;for(let a=0;a<40;a++){let a=this.rng.float(0,Math.PI*2),o=this.rng.float(t,n),s=r.x+Math.cos(a)*o,c=r.z+Math.sin(a)*o;if(Math.abs(s)>i||Math.abs(c)>i||this.online&&!this._clearOfPlayers(s,c,t*.75)||!this.world.col.free(s,c,1))continue;let l=this.world.lake;if(l&&Math.hypot(s-l.x,c-l.z)<l.r+3)continue;let u=Ud(e,this);return u.spawn(s,c),this.monsters.push(u),u}return null}relocate(e){let t=this._around(),n=W.WORLD_WALL-6;for(let r=0;r<30;r++){let r=this.rng.float(0,Math.PI*2),i=this.rng.float(55,85),a=t.x+Math.cos(r)*i,o=t.z+Math.sin(r)*i;if(Math.abs(a)>n||Math.abs(o)>n||!this.world.col.free(a,o,1)||this.online&&!this._clearOfPlayers(a,o,40))continue;let s=this.world.lake;if(!(s&&Math.hypot(a-s.x,o-s.z)<s.r+3)){e.spawn(a,o);return}}}noise(e,t,n,r,i=!1,a=null){if(n<=0||this.state!==`play`||!this.auth)return 0;let o=0;for(let s of this.monsters){let c=s.hear(e,t,n,r,i,a);c&&(o++,c===`hunt`&&i&&(s.huntCause=`scream`,s.huntCausePid=a))}return o}playerNoise(e,t,n,r,i=!1){n<=0||this.state!==`play`||!this.player.alive||(this.auth?this.noise(e,t,n,r,i,this.player.id):Ff.has(r)&&this.sync.noise(e,t,n,r,i))}eyePos(){let e=this.player;return{x:e.x,y:e.y+e.eyeCur,z:e.z}}emitPlayerPulse(e,t){this.player;let n=this.eyePos(),r=W.revealRadius(e);this.firstPingT<0&&(r=Math.max(r,52),this.firstPingT=this.time,this.onFirstPing(this.player));let i=.8+e*.7;this.lastPulseT=this.time,this.sync&&this.sync.ev(`pu`,+n.x.toFixed(2),+(n.y-.25).toFixed(2),+n.z.toFixed(2),+e.toFixed(3),+!!t);let a=this.pulses.emit(n.x,n.y-.25,n.z,this.time,{radius:r,strength:i,decay:.38+(1-e)*.22,color:kf,kind:`player`});return this.echoTicks(a,e),this.fx.shockT=0,this.fx.shockAmp=.35+e*.75,this.addTrauma(.06+e*.22),this.fx.fovKick=Math.max(this.fx.fovKick,1.5+e*5),this.hud.pulseCross(),this.audio.sonarSweep(e,e>.45),this.particles.burst(n.x,n.y-.4,n.z,10+Math.round(e*26),{color:[.5,.6,.66],speed:6+e*12,life:.55,size:.06,gravity:0,drag:2.2,dir:{x:0,y:0,z:0},cone:1,spread:.5}),a}echoTicks(e,t){let n=this.world.col,r=n.query(e.x,e.z,e.radius),i=Array(20).fill(null),a=[];for(let t=0;t<r.length;t++){let o=n.caps[r[t]],s=(o.ax+o.bx)*.5,c=(o.az+o.bz)*.5,l=s-e.x,u=c-e.z,d=Math.hypot(l,u);if(d<1.2||d>e.radius)continue;let f=Math.floor((Math.atan2(u,l)+Math.PI)/(Math.PI*2)*20)%20;!i[f]||d<i[f].d?i[f]={d,x:s,z:c,k:o.kind}:a.length<14&&Math.random()<.05&&a.push({d,x:s,z:c,k:o.kind})}let o={[cu.TREE]:0,[cu.ROCK]:1,[cu.WOOD]:2,[cu.METAL]:3,[cu.WATER]:4,[cu.EFFIGY]:2};for(let n of i.concat(a)){if(!n)continue;let r=(.22+t*.5)*(1-n.d/e.radius)**1.3;this.audio.tick(n.d/e.speed,this.audio.panOf(n.x,n.z),r,.9+Math.random()*.25,o[n.k]??0)}}pingRelease(){let e=this.charge;if(!e.active||(e.active=!1,this.pingCD>0))return;this.pingCD=.22;let t=e.t,n=t<.18?.24:Zl(.32,1,q((t-.18)/.95,0,1));n<.36?this.audio.click(n):n<W.SCREAM?this.audio.clap(n):this.audio.shout(n);let r=n>=W.SCREAM;this.stats.loudest=Math.max(this.stats.loudest,n),this.emitPlayerPulse(n,!1),this.playerNoise(this.player.x,this.player.z,n,`ping`,r),r&&this.onScream(),this.radar.noiseR=Math.max(this.radar.noiseR,W.hearRadius(n))}onScream(){this.time-this.lastScreamAlert>3&&(this.hud.flashAlert(K(`aDontScream`),`danger`,1.2),this.lastScreamAlert=this.time),this.fx.red=Math.max(this.fx.red,.25),this.addTrauma(.25)}throwStone(){let e=this.player;if(e.stones<=0){this.hud.popup(K(`aNoStones`),`dim`),this.hud.flashStones();return}e.stones--;let t=Math.cos(e.pitch),n=-Math.sin(e.yaw)*t,r=-Math.cos(e.yaw)*t,i=Math.sin(e.pitch),a=this.eyePos();this.stones.throw(a.x+n*.4,a.y-.15,a.z+r*.4,n,i,r),this.sync&&this.sync.ev(`st`,+(a.x+n*.4).toFixed(2),+(a.y-.15).toFixed(2),+(a.z+r*.4).toFixed(2),+n.toFixed(3),+i.toFixed(3),+r.toFixed(3)),this.audio.throwWhoosh(),this.addTrauma(.05),this.tut.step===3&&(this.tut.t=99)}onStoneImpact(e,t=null){let n=this.pulses.emit(e.x,e.y+.3,e.z,this.time,{radius:17,strength:1,decay:.55,color:Af,kind:`stone`});this.echoTicks(n,.35),this.audio.impact(e.x,e.y,e.z,e.water),this.particles.burst(e.x,e.y+.15,e.z,e.water?26:18,{color:e.water?[.5,.8,1]:[.9,.97,1],speed:e.water?3.5:4.5,up:e.water?3:1.5,life:e.water?.9:.6,size:.09,gravity:-9,drag:1}),this.radar.blip(e.x,e.z,`stone`),this.noise(e.x,e.z,e.water?.5:.46,`stone`,!1,t??this.player.id)}remotePulse(e,t,n,r,i,a){i=Math.max(0,Math.min(1,i));let o=W.revealRadius(i),s=this.firstPingT<0;s&&(o=Math.max(o,52));let c=e.hex,l=.32,u=[kf[0]*.6799999999999999+(c>>16&255)/255*l,kf[1]*.6799999999999999+(c>>8&255)/255*l,kf[2]*.6799999999999999+(c&255)/255*l];this.pulses.emit(t,n,r,this.time,{radius:o,strength:.8+i*.7,decay:.38+(1-i)*.22,color:u,kind:`player`}),a||this.audio.matePing(t,n+.25,r,i,W.SCREAM),!(this.spectate&&this.spectate.target===e)&&this.distToEars(e.x,e.z)>1.2&&(this.ghosts.spawn(e.rig,this.time,{strength:.55+i*.6,color:e.hex,life:1.6+i,decay:1.1,jitter:.4}),e.revealT=this.time),this.lastPulseT=this.time,s&&this.state===`play`&&(this.firstPingT=this.time,this.onFirstPing(e))}onFirstPing(e=this.player){this.hud.setIntro(null);let t=this.auth?this.monsters.find(e=>e.intro):null;t&&(t.scripted=null,this.timeline.push({at:this.time+1.1,fn:()=>{let n=e.forward();t.investigate(e.x-n.z*3.2,e.z+n.x*3.2,!0)}}))}onShard(e,t){this.sync&&t!==void 0&&this.sync.ev(`sh`,t),this.stats.shards++;let n=W.SCORE.shard*this.mult;this.score+=n,this.hud.popup(`+${Math.round(n)} ${K(`aShard`)}`,`amber`),this.audio.shardPickup(this.stats.shards),this.particles.burst(e.x,e.y,e.z,40,{color:[1,.7,.25],speed:5,up:2,life:1,size:.11,gravity:-4,drag:1.6}),this.particles.burst(e.x,e.y,e.z,16,{color:[1,.9,.6],speed:9,life:.35,size:.06,gravity:0,drag:3}),this.fx.white=Math.max(this.fx.white,.06),this.addTrauma(.08);let r=this.player;r.stones<W.PLAYER.maxStones&&r.stones++,this.pulses.emit(e.x,e.y,e.z,this.time,{radius:7,strength:.6,decay:1.4,color:[1,.72,.35],kind:`shard`})}onMonsterHunt(e){let t=e.tgt?e.tgt.id:null;this.role===`host`&&this.sync.ev(`hu`,e.id,t),this.fxHunt(e,t)}fxHunt(e,t){let n=t==null||t===this.player.id;if(n&&this.stats.hunts++,e.type===`howler`?(this.audio.howlerBark(e.x,e.y+1.8,e.z),this.pulses.emit(e.x,e.y+1.6,e.z,this.time,{radius:20,strength:.9,decay:.8,color:jf,kind:`monster`}),!this.hinted.howlSpot&&n&&this.player.alive&&(this.hinted.howlSpot=!0,this.hud.setHint(`<span class="red">${K(`hintHowlerSpot`)}</span>`),this.timeline.push({at:this.time+4.5,fn:()=>this.hud.setHint(null)}))):(this.audio.screech(e.x,e.y+2.4,e.z,1),this.pulses.emit(e.x,e.y+1.6,e.z,this.time,{radius:26,strength:.95,decay:.75,color:Of,kind:`monster`})),!n||!this.player.alive){let t=Math.max(0,1-e.playerDist/40);t>0&&this.addTrauma(.25*t)}else this.hud.flashAlert(K(`aHunt`),`danger`,1.8),this.fx.glitch=Math.max(this.fx.glitch,.65),this.fx.red=Math.max(this.fx.red,.3),this.addTrauma(.45)}onMonsterInvestigate(e,t,n=null){this.role===`host`&&this.sync.ev(`in`,e.id,n,Math.round(t)),this.fxInvestigate(e,t,n)}fxInvestigate(e,t,n){(n==null||n===this.player.id)&&this.player.alive&&this.time-this.lastHeardAlert>6&&t<65&&!e.intro&&(this.hud.flashAlert(K(`aHeard`),`warn`,1.3),this.lastHeardAlert=this.time),this.time-(e.lastGrowl||-9)>5&&(this.audio.growl(e.x,e.y+2.4,e.z,.55),e.lastGrowl=this.time)}onMonsterLost(e){let t=e.tgt?e.tgt.id:null;this.role===`host`&&this.sync.ev(`lo`,e.id,t),this.fxLost(e,t)}fxLost(e,t){if(this.state===`play`&&this.player.alive&&(t==null||t===this.player.id)&&e.playerDist>7){this.stats.escapes++;let e=W.SCORE.escape*this.mult;this.score+=e,this.hud.popup(`+${Math.round(e)} ${K(`aEscaped`)}`,`cyan`),this.fx.slowT=.5}}onHowlerInhale(e){this.role===`host`&&this.sync.ev(`ih`,e.id),this.fxInhale(e)}fxInhale(e){this.audio.howlerInhale(e.x,e.y+1.8,e.z),e.playerDist<e.cfg.howlR+8&&(this.fx.danger=Math.max(this.fx.danger,.5),!this.hinted.howl&&this.player.alive&&(this.hinted.howl=!0,this.hud.setHint(`<span class="red">${K(`hintHowler`)}</span>`),this.timeline.push({at:this.time+4.2,fn:()=>this.hud.setHint(null)})))}onHowl(e){this.role===`host`&&this.sync.ev(`hw`,e.id),this.fxHowl(e)}fxHowl(e){let t=e.cfg.howlR;this.audio.howlerHowl(e.x,e.y+2.2,e.z,1);let n=this.pulses.emit(e.x,e.y+2,e.z,this.time,{radius:t,strength:1.05,decay:.55,color:jf,kind:`monster`});this.echoTicks(n,.5);let r=e.playerDist;if(r<t){let e=1-r/t;this.addTrauma(.2+.4*e),this.fx.red=Math.max(this.fx.red,.2+.3*e),this.fx.shockT=0,this.fx.shockAmp=.3+.6*e}this.radar.blip(e.x,e.z,`monster`,!0)}onHowlerBark(e){this.role===`host`&&this.sync.ev(`hb`,e.id),this.fxBark(e)}fxBark(e){this.audio.howlerBark(e.x,e.y+1.8,e.z),this.pulses.emit(e.x,e.y+1.6,e.z,this.time,{radius:18,strength:.8,decay:.9,color:jf,kind:`monster`}),e.playerDist<18&&this.addTrauma(.12)}updateArrivals(){let e=this.objectives.count;for(let t of[`watcher`,`howler`]){if(this.monsters.some(e=>e.type===t))continue;let n=W.MONSTER[t];if(!(this.time>=n.arrive||e>=n.arriveGens&&this.time>=n.arrive*.5)||this.state!==`play`)continue;let r=null;if(t===`watcher`){let e=Ud(`watcher`,this);e.vanish(6),this.monsters.push(e)}else{if(r=this.spawnMonster(`howler`,70,110),!r)continue;r.howlT=26}this.role===`host`&&this.sync.ev(`ar`,t,r?Math.round(r.x):0,r?Math.round(r.z):0),this.fxArrive(t,r?r.x:null,r?r.z:null)}}fxArrive(e,t=null,n=null){if(e===`watcher`)this.audio.watcherArrive();else{let e=this.ears(),r=t??e.x+90,i=n??e.z;this.audio.howlerHowl(r,this.world.terrain.height(r,i)+2.2,i,.8)}this.hud.flashAlert(K(e===`watcher`?`aWatcherArrive`:`aHowlerArrive`),`warn`,2.6),this.audio.sting(.3)}onCorpseSearched(e,t){this.stats.bodies++;let n=W.SCORE.corpse*this.mult;this.score+=n,this.hud.popup(`+${Math.round(n)} ${K(`aFound`)}: ${K(`parts`)[W.GENERATORS[t].part]}`,`amber`),this.particles.burst(e.x,e.y+.3,e.z,18,{color:[1,.72,.3],speed:2.5,up:1.5,life:.8,size:.06,gravity:-4,drag:2}),this.audio.heartbeat(.7),this.addTrauma(.06),this.playerNoise(e.x,e.z,.1,`repair`)}fxMateFound(e,t){let n=W.GENERATORS[t];n&&this.hud.popup(K(`mateFound`).replace(`{name}`,e.name).replace(`{part}`,K(`parts`)[n.part]),`amber`)}onSpark(e,t=!1){let n=e.x,r=e.y+.7,i=e.z;this.audio.spark(n,r,i),this.particles.burst(n,r,i,34,{color:[1,.9,.55],speed:7,up:2.5,life:.55,size:.05,gravity:-9,drag:1.2}),this.pulses.emit(n,r,i,this.time,{radius:8,strength:.95,decay:1.6,color:[.85,.92,1],kind:`stone`}),t||this.playerNoise(n,i,e.spec.sparkLoud,`repair`);let a=Math.max(0,1-this.distToEars(n,i)/12);this.addTrauma(.18*(t?a:1)),(!t||a>.5)&&(this.fx.white=Math.max(this.fx.white,.12),this.fx.glitch=Math.max(this.fx.glitch,.3))}onSpinUp(e){this.hud.flashAlert(K(`aSpinUp`),`warn`,2.2),this.audio.sting(.25)}onGeneratorStarted(e,t,n=null){this.stats.gens=t;let r=W.SCORE.generator*this.mult;this.score+=r,this.hud.popup(n?`+${Math.round(r)} · ${K(`mateStarted`).replace(`{name}`,n.name)}`:`+${Math.round(r)}`,`amber`),this.hud.flashAlert(K(`aGenOn`).replace(`{n}`,t),`dawn`,2.6),this.hud.peek(4);let i=e.site.lamp;this.pulses.emit(i.x,i.y-1,i.z,this.time,{radius:24,strength:1,decay:.45,color:Mf,kind:`shard`}),this.particles.burst(i.x,i.y,i.z,30,{color:[1,.82,.5],speed:4,life:.9,size:.06,gravity:-3,drag:1.6}),this.fx.white=Math.max(this.fx.white,.08),this.addTrauma(.15),this.noise(e.x,e.z,e.spec.startLoud,`repair`),t>=5&&this.auth&&this.timeline.push({at:this.time+1.4,fn:()=>{this.state===`play`&&this.startDawn()}})}kill(e,t=this.player){if(this.state!==`play`)return;let n=e.huntCause===`scream`&&(e.huntCausePid==null||e.huntCausePid===t.id)?`scream`:e.type;if(t!==this.player){if(!t.alive)return;t.die(t.x,t.z),t.cause=n,this.sync.ev(`ki`,e.id,t.id,n,+t.x.toFixed(2),+t.z.toFixed(2)),e.feed(),this.fxMateDied(t,e),this.checkTeam()}else this.player.alive&&(this.online?(this.auth&&(this.sync.ev(`ki`,e.id,this.player.id,n,+this.player.x.toFixed(2),+this.player.z.toFixed(2)),e.feed()),this.localDie(e,n),this.auth&&this.checkTeam()):(this.state=`dying`,this.beginDeath(e,n)))}netKill(e,t,n,r,i){if(this.state!==`play`)return;let a=this.monsterById(e);if(t===this.player.id){if(!this.player.alive)return;this.localDie(a||{type:`listener`,x:this.player.x+1,z:this.player.z,id:-1},n||`listener`);return}let o=this.remotes.get(t);o&&o.alive&&(o.die(r,i),o.cause=n,this.fxMateDied(o,a))}localDie(e,t){let n=this.player;n.alive=!1,this.localDeath=!0,this.charge.active=!1,this.hud.setUse(null),this.objectives.closeNote(),this.objectives.target=null,this.beginDeath(e,t)}fxMateDied(e,t){let n=this.distToEars(e.x,e.z)<30;this.audio.mateDeath(e.x,e.y+1.4,e.z,n),t&&t.x!==void 0&&this.pulses.emit(e.x,e.y+1.2,e.z,this.time,{radius:n?18:12,strength:.9,decay:.8,color:Of,kind:`monster`}),this.hud.flashAlert(K(`mateDied`).replace(`{name}`,e.name),`danger`,2.4),this.addTrauma(n?.4:.15),this.fx.red=Math.max(this.fx.red,n?.35:.15),this.spectate&&this.spectate.target===e&&this.timeline.push({at:this.time+1.6,fn:()=>this.nextSpectate()})}checkTeam(){this.auth&&this.online&&this.state===`play`&&!this.teamOverAt&&this.livePlayers().length===0&&(this.teamOverAt=this.time+2.3)}endOnline(e,t={}){this.state!==`over`&&this.state!==`idle`&&(this.role===`host`&&!e&&this.sync.ev(`en`),this.jsGhost&&this.ghosts.release(this.jsGhost),this.jsGhost=null,this.state=`over`,this.fx.fade=0,this.audio.setAmbience(0,0),this.onEnd&&this.onEnd({won:e,cause:this.cause||`listener`,coop:!0,alive:this.player.alive,...t}))}hostLost(){this.state!==`over`&&this.state!==`idle`&&this.endOnline(!1,{hostLost:!0})}scareRig(e){var t;return(t=this.scareRigs)[e]||(t[e]=Pd(e))}enterSpectate(){this.spectate={target:null},this.nextSpectate(),this.fx.fade=1,this.fx.red=.2,document.body.classList.add(`spectating`)}nextSpectate(){if(!this.spectate)return;let e=[...this.remotes.values()].filter(e=>e.alive),t=e.indexOf(this.spectate.target);this.spectate.target=e.length?e[(t+1)%e.length]:null,this.spectLabel=null}beginDeath(e,t){this.deathT=0,this.killer=e,this.killType=e.type,this.killX=e.x,this.killZ=e.z,this.cause=t;let n=G.scares===`reduced`;this.audio.jumpscare(n?.45:1),this.fx.trauma=n?.6:1,this.fx.white=n?0:.85,this.fx.red=.7,this.fx.glitch=1,this.hud.setHint(null),this.hud.setIntro(null),this.hud.peekUntil=0;for(let t of this.monsters)t!==e&&t.breath&&(t.breath.stop(),t.breath=null);this.jsGhost=null,this.jsYaw=Math.atan2(-(e.x-this.player.x),-(e.z-this.player.z))}updateDying(e){this.deathT+=e;let t=this.player,n=G.scares===`reduced`,r=Math.atan2(-(this.killX-t.x),-(this.killZ-t.z))-t.yaw;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;t.yaw+=r*Math.min(1,e*25),t.pitch=$l(t.pitch,.05,20,e);let i=this.killType,a=this.scareRig(i),o=a.nodes,s=this.deathT;if(i===`listener`)o.spine.rotation.x=.95,o.neck.rotation.x=-.4,o.head.rotation.x=.45,o.head.rotation.z=Math.sin(s*45)*.12,o.head.rotation.y=Math.sin(s*33)*.08,o.jaw.rotation.x=.85+Math.sin(s*38)*.18,o.shoulderL.rotation.x=-2.1,o.shoulderR.rotation.x=-2.1,o.shoulderL.rotation.z=-.5,o.shoulderR.rotation.z=.5,o.elbowL.rotation.x=-.5,o.elbowR.rotation.x=-.5;else if(i===`watcher`){let e=Math.min(1,s*3.2);o.faceL.rotation.y=-1.1*e,o.faceR.rotation.y=1.1*e,o.head.rotation.z=.9+Math.sin(s*40)*.08,o.neck.rotation.x=.5,o.spine.rotation.x=.7,o.shoulderL.rotation.x=-2.5,o.shoulderR.rotation.x=-2.5,o.shoulderL.rotation.z=-.7,o.shoulderR.rotation.z=.7,o.elbowL.rotation.x=-.9,o.elbowR.rotation.x=-.9}else i===`howler`?(o.pelvis.rotation.x=.1,o.chest.rotation.x=.15,o.chest.scale.setScalar(1),o.neck.rotation.x=.1,o.head.rotation.x=-.2+Math.sin(s*36)*.08,o.head.rotation.z=Math.sin(s*47)*.15,o.jaw.rotation.x=1.15+Math.sin(s*30)*.15,o.shoulderL.rotation.x=-1.6,o.shoulderR.rotation.x=-1.6,o.shoulderL.rotation.z=-.9,o.shoulderR.rotation.z=.9):(o.head.rotation.z=Math.sin(s*50)*.2,o.jaw.rotation.x=.9+Math.sin(s*40)*.2,o.body.rotation.x=-.6);let c=t.y+t.eyeCur,l=-Math.sin(t.yaw),u=-Math.cos(t.yaw),d=a.root;d.position.set(0,0,0),d.rotation.set(0,Math.atan2(-l,-u),0),d.updateMatrixWorld(!0),o.head.getWorldPosition(If);let f=Math.max(0,1-s*5),p=(i===`listener`?1.05:i===`howler`?1.3:i===`watcher`?.9:.95)+f*1.8;d.position.set(t.x+l*p-If.x,c-If.y+.12,t.z+u*p-If.z);let m=n?1:Math.floor(s*14)%2==0?1.6:.35;if(this.jsGhost?(this.ghosts.refresh(this.jsGhost,a),this.jsGhost.strength=m):this.jsGhost=this.ghosts.spawn(a,this.time,{sticky:!0,strength:m,full:1,color:i===`watcher`?15265524:i===`howler`?16734744:16724e3}),this.fx.trauma=Math.max(this.fx.trauma,n?.4:.8-s*.3),this.fx.glitch=Math.max(this.fx.glitch,.6),this.fx.red=Math.max(this.fx.red,.4),this.fx.fovKick=-12,s>1.45&&(this.fx.fade=Math.max(0,1-(s-1.45)*4)),s>1.75){if(this.ghosts.release(this.jsGhost),this.jsGhost=null,this.online){this.localDeath=`done`,this.enterSpectate();return}this.state=`over`,this.fx.fade=0,this.audio.setAmbience(0,0),this.onEnd&&this.onEnd({won:!1,cause:this.cause})}}startDawn(){this.state=`dawn`,this.dawnT=0,this.hud.setIntro(null),this.hud.intro.classList.remove(`red`),this.hud.setUse(null),this.objectives.closeNote(),this.role===`host`&&this.sync.ev(`dn`);let e=this.role===`client`&&this.netT>0?this.netT:this.time;this.winBonus=W.SCORE.win+Math.max(0,Math.round(W.RUN_SECONDS-e))*W.SCORE.speedBonus,this.player.alive||(this.winBonus=Math.round(this.winBonus*.3)),this.score+=this.winBonus,this.audio.dawn(),this.audio.setAmbience(.25,0),this.hud.setHint(null);for(let e of this.monsters)e.setState(`flee`);this.hud.flashAlert(K(`winTitle`),`dawn`,3)}updateDawn(e){this.dawnT+=e,X.uDawn.value=Ql(0,5,this.dawnT)*.85+.15;for(let t=this.monsters.length-1;t>=0;t--){let n=this.monsters[t];this.dawnT>1.5?(n.dispose(),this.monsters.splice(t,1)):n.update(e,this.time)}this.dawnT>7&&this.state===`dawn`&&(this.state=`won`,this.onEnd&&this.onEnd({won:!0,coop:this.online,alive:this.player.alive}))}scare(){let e=[`apparition`,`snap`,`whisper`,`runner`];this.mic.snippets.length&&e.push(`mimic`,`mimic`);let t=this.rng.pick(e);this.scareCount===0&&(t=`snap`),this.scareCount++;let n=G.scares===`reduced`,r=t===`whisper`?1.4:this.rng.float(.75,1.15);this.audio.preScare(r,t===`whisper`?`silence`:null,n?.6:1),this.timeline.push({at:this.time+r,fn:()=>{this.state===`play`&&this.player.alive&&this[`scare_`+t]()}})}_ahead(e,t=0){let n=this.player,r=n.forward(),i=n.x+r.x*e+-r.z*t,a=n.z+r.z*e+r.x*t;return{x:i,z:a,y:this.world.terrain.height(i,a)}}scare_apparition(){let e=this.player,t=this._ahead(this.rng.float(2.8,4.2),this.rng.float(-.6,.6));this.shade.place(t.x,t.y,t.z,Math.atan2(e.x-t.x,e.z-t.z));let n=G.scares===`reduced`;this.pulses.emit(e.x,e.y+1.3,e.z,this.time,{radius:9,strength:.75,decay:2.2,color:[1,.85,.82],kind:`scare`}),this.ghosts.spawn(this.shade.rig,this.time,{strength:n?.9:1.6,life:.6,decay:3.5,color:16726570,full:.7}),this.audio.sting(n?.6:1),this.addTrauma(.55),this.fx.glitch=.8,n||(this.fx.white=.22),this.radar.blip(t.x,t.z,`unknown`)}scare_runner(){let e=this.player,t=this.rng.sign(),n=this.rng.float(9,13);{let r=e.forward(),i=t=>[e.x+r.x*n-r.z*t,e.y+.4,e.z+r.z*n+r.x*t];this.audio.runnerPass(...i(-9.5*t),...i(9.5*t),1.05)}for(let r=0;r<5;r++)this.timeline.push({at:this.time+.25+r*.14,fn:()=>{let i=e.forward(),a=t*(-5+r*2.5),o=e.x+i.x*n-i.z*a,s=e.z+i.z*n+i.x*a,c=this.world.terrain.height(o,s);this.shade.place(o,c,s,Math.atan2(-i.z*t,i.x*t)),this.shade.rig.root.rotation.x=.25,this.ghosts.spawn(this.shade.rig,this.time,{strength:1.1,life:.9,decay:2.5,color:16726570}),this.shade.rig.root.rotation.x=0,r===0&&this.pulses.emit(e.x,e.y+1.3,e.z,this.time,{radius:16,strength:.45,decay:1.6,color:[1,.85,.82],kind:`scare`})}});this.addTrauma(.2),this.fx.glitch=.35}scare_snap(){let e=this.player,t=e.forward(),n=this.rng.float(-5,5),r=-this.rng.float(5,8),i=e.x+t.x*r-t.z*n,a=e.z+t.z*r+t.x*n,o=this.world.terrain.height(i,a);this.audio.branchSnap(i,o+1.2,a,1.7,!0),this.pulses.emit(i,o+1,a,this.time,{radius:9,strength:.9,decay:.9,color:[.85,.9,1],kind:`scare`}),this.rng.chance(.45)&&(this.shade.place(i,o,a,Math.atan2(e.x-i,e.z-a)),this.ghosts.spawn(this.shade.rig,this.time,{strength:1,life:1.6,decay:1.4,color:16726570})),this.radar.blip(i,a,`unknown`),this.addTrauma(.15)}scare_whisper(){let e=this.player,t=e.forward(),n=this.rng.sign()*.3;this.audio.whisper(e.x-t.x*.55-t.z*n,e.y+e.eyeCur,e.z-t.z*.55+t.x*n),this.fx.glitch=.3}scare_mimic(){let e=this.player,t=this.rng.float(0,Math.PI*2),n=this.rng.float(12,20),r=e.x+Math.cos(t)*n,i=e.z+Math.sin(t)*n,a=this.world.terrain.height(r,i);if(!this.mic.mimic(r,a+1.7,i,.9))return this.scare_snap();this.radar.blip(r,i,`unknown`),this.timeline.push({at:this.time+.9,fn:()=>{this.pulses.emit(r,a+1.5,i,this.time,{radius:8,strength:.6,decay:1.2,color:Of,kind:`scare`}),this.shade.place(r,a,i,Math.atan2(e.x-r,e.z-i)),this.ghosts.spawn(this.shade.rig,this.time,{strength:1.1,life:2,decay:1,color:16726570})}})}netFrame(e){this.sync&&this.sync.process(),this.updateRemotes(e),this._updateEars(),this.sync&&this.state!==`over`&&this.state!==`idle`&&this.sync.tick(e)}updateRemotes(e){if(this.online)for(let e of this.audio.voices.keys())this.remotes.has(e)||this.audio.voiceSet(e,0,0,0,0);if(!this.remotes.size)return;let t=this.state===`morning`||this.state===`dusk`&&this.duskT<1.5||this.state===`dawn`||this.state===`won`,n=this.player.alive;for(let r of this.remotes.values()){r.update(e),this.audio.voiceSet(r.id,r.x,r.y+(r.alive?r.eyeCur:.35),r.z,r.alive||!n?1:0);let i=this.spectate&&this.spectate.target===r?0:t?1:this.objectives.lampAt(r.x,r.z);if(i>.06){let e=t?.62:Math.min(.8,.22+i*1.2);r.liveGhost?(this.ghosts.refresh(r.liveGhost,r.rig),r.liveGhost.strength=e):r.liveGhost=this.ghosts.spawn(r.rig,this.time,{sticky:!0,strength:e,full:t?.7:.3,color:r.alive?r.hex:9081750,jitter:.25}),t||(r.revealT=this.time)}else r.liveGhost&&(this.ghosts.release(r.liveGhost),r.liveGhost=null)}}update(e,t){let n=this.fx,r=this.input;this.inputMuted&&(t={look:Pf,events:[]});let i=t.look;if(this.events=t.events,this.state===`morning`)return this.updateMorning(e,t);if(this.state===`dusk`)return this.updateDusk(e,t);if(this.state===`dying`){this._updateEars(),this.updateDying(e),this.time+=e,this._commonFx(e);return}if(this.state===`dawn`){this.netFrame(e),this.updateDawn(e),this.time+=e,this.player.alive&&this.player.update(e,r,i,this.inputMuted),this._commonFx(e);return}if(this.state!==`play`||(this.time+=e,this.grace=this.time<W.GRACE_SECONDS||this.firstPingT>=0&&this.time<this.firstPingT+8||this.firstPingT<0,this.netFrame(e),this.state!==`play`))return;if(this.teamOverAt&&this.time>=this.teamOverAt)return this.endOnline(!1);for(let e=this.timeline.length-1;e>=0;e--)if(this.time>=this.timeline[e].at){let t=this.timeline[e];this.timeline.splice(e,1),t.fn()}if(this.state!==`play`)return;if(!this.player.alive)return this.updateDead(e,t);for(let e of t.events)e===`pingDown`?(this.charge.active=!0,this.charge.t=0):e===`pingUp`?this.pingRelease():e===`throw`&&this.throwStone();this.objectives.note&&t.events.includes(`useDown`)&&(this.objectives.closeNote(),this.events=t.events.filter(e=>e!==`useDown`)),this.charge.active&&(this.charge.t+=e,this.charge.t>2.4&&this.pingRelease()),this.pingCD-=e;let a=this.player,o=a.update(e,r,i,this.inputMuted);if(o.step){let e=o.step;if(this.audio.footstep(e.intensity),e.mode===`crouch`)this.pulses.emitStep(a.x,a.y+.15,a.z,this.time,{radius:2.6,strength:.3,speed:10,decay:2.4,kind:`step`});else{let t=e.mode===`sprint`;this.pulses.emitStep(a.x,a.y+.2,a.z,this.time,{radius:t?9:5.5,strength:t?.6:.42,speed:16,decay:t?1.9:2.3,kind:`step`}),this.playerNoise(a.x,a.z,e.loud,`step`),this.stepNoise=Math.max(this.stepNoise,e.loud)}}if(o.bump){let e=o.bump;this.audio.bump(),this.addTrauma(.22+e.strength*.2),this.pulses.emitStep(e.x,a.y+1.2,e.z,this.time,{radius:5,strength:.9,speed:14,decay:1.1,kind:`step`}),this.playerNoise(a.x,a.z,.26,`bump`),this.stepNoise=Math.max(this.stepNoise,.26),this.particles.burst(e.x,a.y+1.3,e.z,12,{color:[.55,.8,.9],speed:2.5,life:.7,size:.05,gravity:-5,drag:2,dir:{x:e.nx,y:.3,z:e.nz},cone:.8})}o.breath&&(this.audio.breathHeavy(),this.playerNoise(a.x,a.z,.14,`breath`),this.exhaustWarned||(this.hud.popup(K(`aExhausted`),`dim`),this.exhaustWarned=!0)),a.exhausted||(this.exhaustWarned=!1),this.stepNoise=Math.max(0,this.stepNoise-e*.6);let s=this.mic.update(e,this.audio.outputDb());s.loud>0&&(this.playerNoise(a.x,a.z,s.loud,`voice`,s.scream),this.stats.loudest=Math.max(this.stats.loudest,s.loud)),s.pulse>0&&this.emitPlayerPulse(s.pulse,!0),s.scream&&!this.screamFlag&&this.onScream(),this.screamFlag=s.scream,this.mic.lostFlag&&(this.mic.lostFlag=!1,this.hud.flashAlert(K(`aMicLost`),`warn`,2),this.hud.setMic(`off`)),this.pulses.update(this.time),this.stones.update(e,this);let c=this.updateMonsters(e);if(this.state!==`play`||!this.player.alive||(this.shards.update(e,this),this.objectives.update(e,!0),this.state!==`play`))return;this.auth&&this.updateArrivals(),this.updateFronts(),this.updateDirector(e),this.time>this.nextScare&&(this.nextScare=this.time+this.rng.float(55,115),this.monsters.some(e=>e.state===`hunt`)||this.scare()),this.updateIntro(e),this.dread.update(e),this.score+=e*W.SCORE.perSecond*this.mult;let l=this.firstPingT<0?.16:0;if(n.danger=$l(n.danger,Math.max(c,l),3,e),this.audio.update(n.danger,this.time/W.RUN_SECONDS),this.audio.setAmbience(.9,n.danger),this.time>W.RUN_SECONDS&&this.auth&&(this.endgame||(this.endgame=!0,this.wakeT=5,this.role===`host`&&this.sync.ev(`wk`),this.fxWake()),this.wakeT-=e,this.wakeT<=0)){this.wakeT=14;let e=this.livePlayers();for(let t of this.monsters){let n=e.length?e[Math.floor(this.rng.next()*e.length)]:a;(t.state===`wander`||t.state===`search`||t.state===`idle`)&&t.investigate(n.x+this.rng.float(-7,7),n.z+this.rng.float(-7,7))}}this._commonFx(e)}fxWake(){this.hud.flashAlert(K(`aAwake`),`danger`,3),this.audio.sting(.7)}updateDead(e,t){if(this.localDeath===!0)this.updateDying(e);else if(this.spectate){for(let e of t.events)(e===`pingDown`||e===`throw`||e===`skip`)&&this.nextSpectate();(!this.spectate.target||!this.spectate.target.alive)&&this.nextSpectate()}this.mic.update(e,this.audio.outputDb()),this.pulses.update(this.time),this.stones.update(e,this);let n=this.updateMonsters(e);this.state===`play`&&(this.objectives.update(e,!0),this.auth&&this.updateArrivals(),this.updateFronts(),this.updateDirector(e),this.fx.danger=$l(this.fx.danger,n*.8,3,e),this.audio.update(this.fx.danger,this.time/W.RUN_SECONDS),this.audio.setAmbience(.9,this.fx.danger),this.time>W.RUN_SECONDS&&this.auth&&!this.endgame&&(this.endgame=!0,this.role===`host`&&this.sync.ev(`wk`),this.fxWake()),this._commonFx(e))}updateMonsters(e){let t=0;for(let n of this.monsters){if(n.update(e,this.time),this.state!==`play`)return 1;t=Math.max(t,n.danger()),this.lampGhost(n);let r=n.playerDist;if(this.player.alive&&n.type!==`watcher`&&n.state!==`hunt`&&n.state!==`feed`&&r<4.6&&this.time-n.lastCloseCall>25&&this.firstPingT>=0){n.lastCloseCall=this.time,this.stats.close++;let e=W.SCORE.closeCall*this.mult;this.score+=e,this.hud.popup(`+${Math.round(e)} ${K(`aClose`)}`,`red`),this.fx.slowT=.7,this.audio.heartbeat(.9),this.audio.sniff(n.x,n.y+n.headY,n.z,.55),this.addTrauma(.12)}}return t}lampGhost(e){let t=e.state===`lurk`?0:this.objectives.lampAt(e.x,e.z);if(t>.06){let n=Math.min(.85,.22+t*1.3);e.lampGhost?(this.ghosts.refresh(e.lampGhost,e.rig),e.lampGhost.strength=n):e.lampGhost=this.ghosts.spawn(e.rig,this.time,{sticky:!0,strength:n,full:.25,color:e.ghostColor,jitter:.6}),e.lastGhostT=this.time}else e.lampGhost&&(this.ghosts.release(e.lampGhost),e.lampGhost=null)}updateFronts(){for(let e of this.pulses.fronts()){for(let t of this.monsters){let n=Math.hypot(t.x-e.x,t.y+1.4-e.y,t.z-e.z);if(n>e.prevR&&n<=e.curR&&n<=e.radius){let r=1-Ql(e.radius*.42,e.radius,n),i=q(e.strength*(.65+.7*r),.6,1.8);this.ghosts.spawn(t.rig,this.time,{strength:i,color:t.ghostColor,life:2.9,decay:.85}),t.lastGhostT=this.time,t.type===`watcher`&&!t.revealed&&(t.revealed=!0,this.time-(this.lastWatcherSting??-99)>40&&this.player.alive&&(this.lastWatcherSting=this.time,this.audio.watcherSting(),this.addTrauma(.3),this.fx.glitch=Math.max(this.fx.glitch,.5)),!this.hinted.watcher&&this.player.alive&&(this.hinted.watcher=!0,this.hud.setHint(`<span class="red">${K(`hintWatcher`)}</span>`),this.timeline.push({at:this.time+5.5,fn:()=>this.hud.setHint(null)}))),this.radar.blip(t.x,t.z,`monster`,t.state===`hunt`),e.kind!==`monster`&&this.audio.monsterReturn(0,t.x,t.y+2,t.z,.25+i*.3),t.intro&&!this.intro.revealDone&&e.kind===`player`&&this.player.alive&&(this.intro.revealDone=!0,this.intro.itHearsT=this.time,this.hud.setIntro(K(`itHears`),null),this.hud.intro.classList.add(`red`),this.audio.sting(.35),this.addTrauma(.2))}}for(let t of this.remotes.values()){if(this.spectate&&this.spectate.target===t)continue;let n=Math.hypot(t.x-e.x,t.y+1-e.y,t.z-e.z);if(n>e.prevR&&n<=e.curR&&n<=e.radius&&n>.8){let r=1-Ql(e.radius*.42,e.radius,n);this.ghosts.spawn(t.rig,this.time,{strength:q(e.strength*(.55+.6*r),.45,1.4),color:t.alive?t.hex:8160648,life:2.6,decay:.9,jitter:.4}),t.revealT=this.time,this.radar.blip(t.x,t.z,`mate`)}}this.shards.onFront(e,this),this.objectives.onFront(e)}}updateDirector(e){if(this.mult=Al(this.auth?this.time:this.netT||this.time),this.mult!==this.lastMultStep&&(this.lastMultStep=this.mult,this.hud.flashAlert(`${K(`aWake`)} ×${this.mult.toFixed(1)}`,`warn`,2.2),this.hud.peek(4),this.audio.sting(.35)),!this.auth)return;let t=this.time/W.RUN_SECONDS;if(this.hearingScale=1+t*.35,this.speedScale=1+t*.18,this.dirT=(this.dirT||0)-e,this.dirT>0)return;this.dirT=1;let n=jl(this.time),r=0,i=0;for(let e of this.monsters)e.type===`listener`?r++:e.type===`crawler`&&i++;let a=this.online?Math.max(0,Math.round((this.livePlayers().length-1)*.7)):0;r<n.listeners+a?this.spawnMonster(`listener`,60,90):i<n.crawlers&&this.spawnMonster(`crawler`,55,85);for(let e of this.monsters)(e.state===`wander`||e.state===`idle`)&&e.tgtDist>120&&!e.intro&&this.relocate(e),e.intro&&e.tgtDist>120&&(e.intro=!1,this.relocate(e))}updateIntro(e){let t=this.intro;t.t+=e;let n=this.hud;if(this.firstPingT<0){if(t.t<1.9)n.setIntro(K(`intro1`));else{let e=this.input.touch?K(`introHintTouch`):this.mic.state===`on`?K(`introHintMic`):K(`introHintKeys`);n.setIntro(K(`intro2`),e)}t.t>9&&!t.autoSnap&&(t.autoSnap=!0,this.scare_snap());return}t.itHearsT<0&&!t.cleared&&(t.cleared=!0,n.setIntro(null)),t.itHearsT>=0&&this.time-t.itHearsT>2.4&&(n.setIntro(null),n.intro.classList.remove(`red`),t.itHearsT=-1);let r=this.tut;if(r.done)return;r.t+=e;let i=this.input.touch;r.step===0?r.t>2.2&&(r.step=this.morningT<17?1:2,r.t=0):r.step===1?(n.setHint(K(i?`tutMoveTouch`:`tutMove`)),r.t>7&&(r.step=2,r.t=0)):r.step===2?(n.setHint(K(i?`tutUseTouch`:`tutUse`)),(r.t>9||this.stats.bodies>0)&&(r.step=3,r.t=0)):r.step===3?(n.setHint(K(i?`tutStoneTouch`:`tutStone`)),r.t>7&&(r.step=4,r.t=0)):r.step===4&&(n.setHint(`<span class="red">${K(`tutScream`)}</span>`),r.t>5&&(r.step=5,r.done=!0,n.setHint(null),G.tutorialDone=!0,Rl()))}_commonFx(e){let t=this.fx;t.trauma=Math.max(0,t.trauma-e*1.05),t.glitch=Math.max(0,t.glitch-e*1.8),t.red=Math.max(0,t.red-e*1.4),t.white=Math.max(0,t.white-e*3.2),t.shockT+=e,t.fovKick=$l(t.fovKick,0,5,e),t.slowT>0&&(t.slowT-=e/Math.max(t.timeScale,.3)),t.timeScale=$l(t.timeScale,t.slowT>0?.45:1,8,e)}applyView(e,t){let n=this.spectate&&this.spectate.target||this.player,r=this.fx,i=r.trauma*r.trauma,a=this.noiseGen,o=t*26,s=a.noise(o,1.3),c=a.noise(o,7.1),l=a.noise(o,13.7),u=a.noise(o,21.4),d=a.noise(o,31.9),f=.0035+r.danger*.0045+(n.exhausted?.006:0),p=n.yaw+i*.07*s+Math.sin(t*.43)*f*.5,m=n.pitch+i*.06*c+Math.sin(t*1.05)*f,h=(n.roll||0)+i*.09*l+Math.sin(t*.61+1.3)*f*.7;e.rotation.set(m,p,h,`YXZ`);let g=Math.cos(n.yaw),_=Math.sin(n.yaw);e.position.set(n.x+g*i*.08*u,n.y+n.eyeCur+(n.bobY||0)+i*.06*d,n.z-_*i*.08*u);let v=W.FOV+r.fovKick+(n.sprinting?5:0);Math.abs(e.fov-v)>.01&&(e.fov=$l(e.fov,v,10,1/60),e.updateProjectionMatrix()),e.getWorldDirection(If),this.audio.setListener(e.position.x,e.position.y,e.position.z,If.x,If.y,If.z);let y=this.post.u;y.uAberr.value=.12+r.glitch*.9+r.danger*.25+i*.5,y.uGlitch.value=r.glitch,y.uRed.value=r.red,y.uWhite.value=r.white,y.uDanger.value=r.danger,y.uGrain.value=.06+r.danger*.05+r.glitch*.1,y.uShockR.value=r.shockT*.9,y.uShockAmp.value=r.shockAmp*Math.max(0,1-r.shockT*1.3),y.uFade.value=r.fade,y.uWarm.value=X.uDawn.value,y.uAsh.value=.62*(1-Math.min(1,X.uDawn.value*1.4));let b=this.state===`play`||this.state===`dying`;y.uFlicker.value=this.state===`play`?this.dread.flicker:0,X.uFear.value=b?Ql(.5,1,r.danger):0}hudUpdate(e){let t=this.player;this.hud.update(this,e,this.input.peekHeld);let n=this.spectate,r=n?n.target?n.target.id:`-`:``;if(this.spectLabel!==r){this.spectLabel=r;let e=document.getElementById(`spect`);n&&(e.style.setProperty(`--c`,n.target?n.target.color:`#fff`),e.innerHTML=n.target?`${K(`spectating`).replace(`{name}`,Lf(n.target.name))}<small>${K(this.input.touch?`spectNextTouch`:`spectNext`)}</small>`:K(`spectAllDead`)),document.body.classList.toggle(`spectating`,!!n)}let i=this.charge.active?this.charge.t<.18?.24:Zl(.32,1,q((this.charge.t-.18)/.95,0,1)):0;if(this.hud.ring(e,this.mic,this.state===`play`?i:0,this.mic.state===`on`),G.radar){let r=t.alive?Math.max(this.mic.loud,this.stepNoise,i):0,a=t.alive&&(this.mic.screamHeld>.1||i>=W.SCREAM),o=n&&n.target||t;this.radar.draw(e,o.x,o.z,o.yaw,this.pulses.slots,r,a)}}},zf=[],Bf=`modulepreload`,Vf=function(e,t){return new URL(e,t).href},Hf={},Uf=function(e){return e.pathname.endsWith(`.css`)},Wf=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Gf=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Vf(t,n);let r=s(t),i=Uf(r);return Wf(Hf,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Bf,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Kf=`hush-echolocation-horror`,qf=`ABCDEFGHJKMNPQRSTUVWXYZ23456789`;function Jf(e=5){let t=``,n=crypto.getRandomValues(new Uint8Array(e));for(let r=0;r<e;r++)t+=qf[n[r]%31];return t}function Yf(e){e=String(e||``).trim();let t=e.match(/[?&#]room=([A-Za-z0-9]+)/);return t&&(e=t[1]),e.toUpperCase().replace(/[^A-Z0-9]/g,``).slice(0,8)}var Xf=class{constructor(){this.links=[],this.selfId=null,this.code=null,this.peers=new Map,this.stream=null,this.onMessage=null,this.onPeerJoin=null,this.onPeerLeave=null,this.onPeerStream=null,this.onError=null,this._pingTimer=0}get connected(){return this.links.length>0}async join(e,{relays:t=null,test:n=!1,only:r=null}={}){this.connected&&await this.leave(),this.code=e;let i=`hush-`+e,a={appId:Kf,password:`hush:`+e};zf.length&&(a.turnConfig=zf),n&&(a._test_only_mdnsHostFallbackToLoopback=!0);let o=t&&t.length?[[`nostr`,{relayConfig:{urls:t,warnOnRelayFailure:!1}}]]:[[`nostr`,{relayConfig:{redundancy:6,warnOnRelayFailure:!1}}],[`torrent`,{relayConfig:{redundancy:4}}]];r&&(o=o.filter(([e])=>e===r));for(let[t,n]of o){let r;try{r=t===`nostr`?await Gf(()=>import(`./dist-BiSlllSF.js`),__vite__mapDeps([0,1]),import.meta.url):await Gf(()=>import(`./dist-C6p1lRRO.js`),__vite__mapDeps([2,1]),import.meta.url)}catch(e){console.warn(`[net] could not load`,t,e);continue}if(this.code!==e)return;this.selfId=r.selfId;let o;try{o=r.joinRoom({...a,...n},i,{onJoinError:e=>this.onError&&this.onError(e&&e.error?e.error:`join error`)})}catch(e){console.warn(`[net] joinRoom failed on`,t,e);continue}let s=this.links.length,c=o.makeAction(`m`);c.onMessage=(e,t)=>this._recv(e,t.peerId),o.onPeerJoin=e=>this._link(s,e),o.onPeerLeave=e=>this._unlink(s,e),o.onPeerStream=(e,t)=>this.onPeerStream&&this.onPeerStream(t,e),this.links.push({name:t,room:o,act:c,sockets:r.getRelaySockets})}if(!this.links.length)throw Error(`no signalling strategy available`);this._pingTimer=setInterval(()=>this._pingAll(),2e3)}async leave(){clearInterval(this._pingTimer);let e=this.links;this.links=[],this.peers.clear(),this.code=null;for(let t of e)try{await t.room.leave()}catch{}}relayStatus(e=null){let t=0,n=0,r=new Set;for(let i of this.links){if(e&&i.name!==e)continue;let a={};try{a=i.sockets?i.sockets():{}}catch{}for(let[e,i]of Object.entries(a))r.has(e)||(r.add(e),n++,i&&i.readyState===1&&t++)}return{open:t,total:n}}peerIds(){return[...this.peers.keys()]}rtt(e){let t=this.peers.get(e);return t?t.rtt:null}_link(e,t){let n=this.peers.get(t);n?n.links.add(e):(n={links:new Set([e]),primary:e,rtt:null,stuck:0},this.peers.set(t,n),this.stream&&setTimeout(()=>this.peers.get(t)===n&&this._addStream(t),this.selfId<t?0:1800),this.onPeerJoin&&this.onPeerJoin(t))}_unlink(e,t){let n=this.peers.get(t);n&&(n.links.delete(e),n.links.size===0?(this.peers.delete(t),this.onPeerLeave&&this.onPeerLeave(t)):n.primary===e&&(n.primary=n.links.values().next().value,this.stream&&this._addStream(t)))}async _pingAll(){this._voiceWatchdog();for(let[e,t]of this.peers){let n=this.links[t.primary];if(n)try{let r=await n.room.ping(e);this.peers.get(e)===t&&(t.rtt=Math.round(r))}catch{}}}send(e,t,n){let r=n===void 0?this.peerIds():Array.isArray(n)?n:[n];if(!r.length)return;let i=new Map;for(let e of r){let t=this.peers.get(e);t&&(i.has(t.primary)||i.set(t.primary,[]),i.get(t.primary).push(e))}let a=[e,t===void 0?null:t];for(let[e,t]of i){let n=this.links[e];if(n)try{let e=n.act.send(a,{target:t});e&&e.catch&&e.catch(()=>{})}catch{}}}_recv(e,t){Array.isArray(e)&&typeof e[0]==`string`&&this.peers.has(t)&&this.onMessage&&this.onMessage(e[0],e[1],t)}setStream(e){if(this.stream===e)return;let t=this.stream;if(this.stream=e,t)for(let e of this.links)try{e.room.removeStream(t)}catch{}if(e)for(let e of this.peers.keys())this._addStream(e)}_addStream(e){let t=this.peers.get(e),n=t&&this.links[t.primary];if(!n||!this.stream)return;let r=this._pc(e),i=this.stream.getTracks();if(!(r&&r.getSenders().some(e=>e.track&&i.includes(e.track))))try{let t=n.room.addStream(this.stream,{target:e});for(let e of t||[])e&&e.catch&&e.catch(e=>console.warn(`[net] addStream rejected`,e&&e.message))}catch(e){console.warn(`[net] addStream failed`,e&&e.message)}}_pc(e){let t=this.peers.get(e),n=t&&this.links[t.primary];if(!n)return null;try{return n.room.getPeers()[e]||null}catch{return null}}_voiceWatchdog(){if(!this.stream)return;let e=this.stream.getTracks();for(let[t,n]of this.peers){let r=this._pc(t);if(!r||r.connectionState===`closed`)continue;let i=r.getTransceivers().find(t=>t.sender&&t.sender.track&&e.includes(t.sender.track));if(!i)++n.stuck>=2&&(n.stuck=0,this._addStream(t));else if(i.currentDirection===`sendrecv`||i.currentDirection===`sendonly`)n.stuck=0;else if(r.signalingState===`stable`&&++n.stuck>=2){n.stuck=0;try{r.onnegotiationneeded&&r.onnegotiationneeded(new Event(`negotiationneeded`))}catch{}}}}},Zf=new Set([`hi`,`roster`,`full`,`start`,`bye`,`nm`,`lobby`]);function Qf(e){return String(e||``).replace(/[\u0000-\u001f<>]/g,``).trim().slice(0,14)||`???`}function $f(){return G.name||(G.name=`${K(`defaultName`)}-${10+Math.floor(Math.random()*90)}`,Rl()),Qf(G.name)}var ep=class{constructor({audio:e,mic:t}){this.audio=e,this.mic=t,this.net=new Xf,this.active=!1,this.isHost=!1,this.code=null,this.hostId=null,this.roster=new Map,this.phase=`lobby`,this.status=`idle`,this.joinedAt=0,this.inRun=!1,this.queue=[],this.handlers={},this.net.onPeerJoin=e=>this._onPeerJoin(e),this.net.onPeerLeave=e=>this._onPeerLeave(e),this.net.onMessage=(e,t,n)=>this._onMessage(e,t,n),this.net.onPeerStream=(e,t)=>this._onStream(e,t),this.net.onError=e=>console.warn(`[coop]`,e),this.lastStreamOf=new Map}get selfId(){return this.net.selfId}on(e,t){this.handlers[e]=t}emit(e,...t){let n=this.handlers[e];n&&n(...t)}me(){return this.roster.get(this.selfId)||null}players(){return[...this.roster.values()].filter(e=>e.slot>=0).sort((e,t)=>e.slot-t.slot)}everyone(){return[...this.roster.values()]}async create(){let e=Jf();return await this._enter(e,!0),e}async join(e){let t=Yf(e);if(t.length<4)throw Error(`bad code`);return await this._enter(t,!1),t}async _enter(e,t){await this.leave(),this.code=e,this.isHost=t,this.active=!0,this.phase=`lobby`,this.status=`joining`,this.hostId=null,this.roster.clear(),this.queue=[],this.inRun=!1,this.joinedAt=performance.now(),this.emit(`change`);let n=new URLSearchParams(location.search),r=n.get(`relays`)?n.get(`relays`).split(`,`).filter(Boolean):null,i=[`nostr`,`torrent`].includes(n.get(`net`))?n.get(`net`):null;try{await this.net.join(e,{relays:r,test:!!r,only:i})}catch(e){throw console.warn(`[coop] join failed`,e),this.active=!1,this.status=`error`,this.emit(`change`),e}this.code===e&&(this.roster.set(this.selfId,{id:this.selfId,name:$f(),slot:t?0:-1,host:t,mic:this.mic.state===`on`,inRun:!1,self:!0}),t&&(this.hostId=this.selfId),this.status=t?`waiting`:`searching`,this.syncVoice(),this.emit(`change`))}async leave(){if(this.active||this.net.connected){try{this.net.send(`bye`,null)}catch{}this.active=!1,this.inRun=!1,this.status=`idle`,this.code=null,this.hostId=null,this.roster.clear(),this.queue=[],this.lastStreamOf.clear(),this.audio.voiceDetachAll(),await this.net.leave(),this.emit(`change`)}}inviteLink(){let e=new URL(location.href);e.search=``,e.hash=``,e.searchParams.set(`room`,this.code);let t=new URLSearchParams(location.search);for(let n of[`relays`,`net`])t.get(n)&&e.searchParams.set(n,t.get(n));return e.toString()}relayStatus(){return this.net.relayStatus()}rtt(e){return this.net.rtt(e)}_hello(){return{v:1,name:$f(),host:this.isHost,mic:this.mic.state===`on`}}_onPeerJoin(e){this.net.send(`hi`,this._hello(),e)}_onMessage(e,t,n){if(!Zf.has(e))this.inRun&&this.queue.push([e,t,n]);else switch(e){case`hi`:this._onHello(n,t);break;case`roster`:!this.isHost&&t&&t.host===n&&this._onRoster(t);break;case`full`:!this.isHost&&n===this.hostId&&(this.status=`full`,this.emit(`change`),this.leave().then(()=>{this.status=`full`,this.emit(`change`)}));break;case`start`:!this.isHost&&n===this.hostId&&t&&this._onStart(t);break;case`bye`:this._onPeerLeave(n);break;case`nm`:{let e=this.roster.get(n);e&&t&&(e.name=Qf(t.name),e.mic=!!t.mic,this.isHost&&this._broadcastRoster(),this.emit(`change`));break}}}_onHello(e,t){if(!t||t.v!==1){this.status=`version`,this.emit(`change`);return}let n=this.roster.get(e);if(n||(n={id:e,slot:-1,inRun:!1,self:!1},this.roster.set(e,n)),n.name=Qf(t.name),n.host=!!t.host,n.mic=!!t.mic,t.host&&!this.isHost&&(this.hostId=e,this.status===`searching`&&(this.status=`ready`)),this.isHost){if(n.slot<0){let t=new Set(this.players().map(e=>e.slot)),r=0;for(;t.has(r);)r++;if(r>=4){this.net.send(`full`,null,e),this.roster.delete(e);return}n.slot=r}this._broadcastRoster()}this.emit(`change`)}_broadcastRoster(){if(!this.isHost)return;let e=this.players().map(e=>({id:e.id,name:e.name,slot:e.slot,host:!!e.host,mic:!!e.mic,inRun:!!e.inRun}));this.net.send(`roster`,{host:this.selfId,phase:this.phase,list:e})}_onRoster(e){this.hostId=e.host,this.phase=e.phase===`game`?`game`:`lobby`;let t=new Set([this.selfId]);for(let n of e.list||[]){t.add(n.id);let e=this.roster.get(n.id);e||(e={id:n.id,self:n.id===this.selfId},this.roster.set(n.id,e)),e.slot=n.slot|0,e.self||(e.name=Qf(n.name)),e.host=!!n.host,e.self||(e.mic=!!n.mic),e.inRun=!!n.inRun}(this.status===`searching`||this.status===`ready`)&&(this.status=`ready`),this.emit(`change`)}_onPeerLeave(e){let t=this.roster.get(e);(t||e===this.hostId)&&(this.roster.delete(e),this.lastStreamOf.delete(e),this.audio.voiceDetach(e),this.inRun&&this.queue.push([`_left`,null,e]),!this.isHost&&e===this.hostId&&(this.hostId=null,this.status=`hostLost`,this.emit(`hostLost`)),this.isHost&&this._broadcastRoster(),this.emit(`left`,t?t.name:`???`),this.emit(`change`))}announce(){let e=this.me();e&&(e.name=$f(),e.mic=this.mic.state===`on`,this.net.send(`nm`,{name:e.name,mic:e.mic}),this.isHost&&this._broadcastRoster(),this.emit(`change`))}startRun(){if(!this.isHost)return null;let e=this.players();for(let t of e)t.inRun=!0;this.phase=`game`;let t={seed:Math.random()*2**31>>>0,players:e.map(e=>({id:e.id,name:e.name,slot:e.slot}))};return this.net.send(`start`,t),this._broadcastRoster(),this._onStart(t),t}_onStart(e){if(Array.isArray(e.players)&&e.players.some(e=>e.id===this.selfId)){this.phase=`game`;for(let t of e.players){let e=this.roster.get(t.id);e&&(e.inRun=!0,e.slot=t.slot)}this.queue=[],this.inRun=!0,this.emit(`start`,e)}}endRun(){if(this.inRun=!1,this.queue=[],this.isHost){this.phase=`lobby`;for(let e of this.roster.values())e.inRun=!1;this._broadcastRoster()}}leaveRun(){this.inRun=!1,this.queue=[]}send(e,t,n){this.net.send(e,t,n)}toHost(e,t){this.hostId&&this.hostId!==this.selfId&&this.net.send(e,t,this.hostId)}drain(){let e=this.queue;return this.queue=[],e}syncVoice(){this.active&&this.net.setStream(this.mic.state===`on`&&this.mic.stream?this.mic.stream:null)}_onStream(e,t){this.lastStreamOf.get(e)!==t&&(this.lastStreamOf.set(e,t),this.audio.voiceAttach(e,t),this.emit(`change`))}},tp=e=>document.getElementById(e),np=e=>String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),rp=`<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,ip=`<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/></svg>`,ap=class{constructor({coop:e,mic:t,audio:n,onMicToggle:r,uiSound:i}){this.coop=e,this.mic=t,this.audio=n,this.onMicToggle=r,this.uiSound=i,this.el=tp(`coopPanel`),this.busy=!1,this.homeMsg=``,this.timer=0,this.copiedUntil=0,this._bind()}isOpen(){return this.el.classList.contains(`show`)}open(){tp(`coopName`).value=G.name||``,this.el.classList.add(`show`),this.render(),clearInterval(this.timer),this.timer=setInterval(()=>this.tick(),120)}close(){this.el.classList.remove(`show`),clearInterval(this.timer)}_bind(){let e=(e,t)=>{let n=tp(e);n.addEventListener(`click`,e=>{e.preventDefault(),this.uiSound&&this.uiSound(`click`),t(e)}),n.addEventListener(`mouseenter`,()=>this.uiSound&&this.uiSound(`hover`))};e(`btnCreate`,()=>this._go(()=>this.coop.create())),tp(`coopJoinForm`).addEventListener(`submit`,e=>{e.preventDefault(),this.uiSound&&this.uiSound(`click`);let t=Yf(tp(`coopCode`).value);t.length<4?(this.homeMsg=`<span class="warn">${np(K(`coopBadCode`))}</span>`,this.render()):(tp(`coopCode`).value=t,this._go(()=>this.coop.join(t)))}),e(`btnCopy`,()=>this._copy()),e(`btnStart`,()=>{this.coop.isHost&&this.coop.active&&this.coop.startRun()}),e(`btnLeave`,()=>{this.coop.leave().then(()=>this.render())}),e(`btnCoopBack`,()=>this.close()),e(`btnCoopMic`,()=>this.onMicToggle&&this.onMicToggle());let t=tp(`coopName`),n=0;t.addEventListener(`input`,()=>{G.name=Qf(t.value)===`???`?``:t.value.trim().slice(0,14),Rl();let e=tp(`nameInput`);e&&(e.value=G.name),clearTimeout(n),n=setTimeout(()=>this.coop.active&&this.coop.announce(),400)});for(let e of[`coopName`,`coopCode`])tp(e).addEventListener(`keydown`,e=>e.stopPropagation())}async _go(e){if(!this.busy){this.busy=!0,this.homeMsg=``,this.render();try{await e()}catch(e){this.homeMsg=`<span class="bad">${np(K(`coopError`))}</span>`,console.warn(`[lobby]`,e)}this.busy=!1,this.render()}}_copy(){let e=this.coop.inviteLink(),t=()=>{this.copiedUntil=performance.now()+1600,this.render()};navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(e).then(t,()=>this._copyFallback(e,t)):this._copyFallback(e,t)}_copyFallback(e,t){let n=document.createElement(`textarea`);n.value=e,n.style.cssText=`position:fixed;left:-9999px;top:0;opacity:0`,document.body.appendChild(n),n.select();try{document.execCommand(`copy`),t()}catch{}n.remove()}menuLabel(){let e=tp(`btnCoop`),t=this.coop.active&&!!this.coop.code;e.classList.toggle(`in-room`,t),tp(`btnCoopText`).textContent=t?K(`coopBtnRoom`).replace(`{code}`,this.coop.code):K(`coopBtn`)}render(){let e=this.coop;this.menuLabel();let t=e.active&&!!e.code;if(this.el.classList.toggle(`room`,t),this.el.classList.toggle(`home`,!t),tp(`btnCreate`).disabled=this.busy,tp(`btnJoin`).disabled=this.busy,!t){let t=this.homeMsg;!t&&this.busy&&(t=np(K(`coopJoining`))),!t&&e.status===`full`&&(t=`<span class="warn">${np(K(`coopFull`))}</span>`),!t&&e.status===`error`&&(t=`<span class="bad">${np(K(`coopError`))}</span>`),tp(`coopHomeMsg`).innerHTML=t;return}tp(`coopCodeOut`).textContent=e.code,tp(`btnCopyText`).textContent=performance.now()<this.copiedUntil?K(`coopCopied`):K(`coopCopy`),this._renderList(),this._renderStatus();let n=this.mic.state===`on`;tp(`coopMicRow`).classList.toggle(`on`,n),tp(`coopMicText`).textContent=K(n?`coopMicOn`:`coopMicOff`),tp(`btnCoopMic`).textContent=K(`coopMicAsk`);let r=tp(`btnStart`);r.classList.toggle(`hidden-host`,!e.isHost),r.disabled=!e.isHost||e.status===`joining`}_renderList(){let e=this.coop,t=e.players(),n=[];for(let r=0;r<4;r++){let i=t.find(e=>e.slot===r);if(!i){n.push(`<div class="row empty"><i class="dot"></i><span class="n">${np(K(`coopFree`))}</span><span></span><span class="p"></span></div>`);continue}let a=[];i.self&&a.push(K(`coopYou`)),i.host&&a.push(K(`coopHost`));let o=i.self?null:e.rtt(i.id);n.push(`<div class="row" data-id="${np(i.id)}"><i class="dot" style="--c:${Gd[r]}"></i><span class="n">${np(i.name)}${a.map(e=>`<em>${np(e)}</em>`).join(``)}</span><span class="mic ${i.mic?`on`:`off`}">${i.mic?rp:ip}</span><span class="p">${o==null?``:`${o} ${np(K(`ms`))}`}</span></div>`)}for(let t of e.everyone())t.slot>=0||n.push(`<div class="row wait"><i class="dot"></i><span class="n">${np(t.name||`…`)}${t.self?`<em>${np(K(`coopYou`))}</em>`:``}</span><span></span><span class="p">…</span></div>`);let r=n.join(``),i=tp(`coopList`);i._html!==r&&(i._html=r,i.innerHTML=r)}_renderStatus(){let e=this.coop,t=e.relayStatus(),n=(performance.now()-e.joinedAt)/1e3,r=``;r=e.status===`version`?`<span class="bad">${np(K(`coopVersion`))}</span>`:e.status===`joining`?np(K(`coopJoining`)):e.isHost?np(e.players().length>1?K(`coopReadyHost`):K(`coopWaitFriends`)):e.status===`hostLost`?`<span class="warn">${np(K(`coopHostLeft`))}</span>`:e.hostId?e.phase===`game`&&!(e.me()&&e.me().inRun)?np(K(`coopInRun`)):np(K(`coopWaitHost`)):n>14?`<span class="warn">${np(K(`coopNoHost`))}</span>`:np(K(`coopSearching`));let i=``;t.total>0&&(i=t.open===0&&n>6?`<span class="dim warn">${np(K(`coopNoRelays`))}</span>`:`<span class="dim">${np(K(`coopRelays`))} ${t.open}/${t.total}</span>`);let a=r+i,o=tp(`coopStatus`);o._html!==a&&(o._html=a,o.innerHTML=a)}tick(){if(!this.isOpen())return;let e=this.coop;if(!e.active)return this.render();this._renderStatus(),this._renderList();for(let t of tp(`coopList`).querySelectorAll(`.row[data-id]`)){let n=t.dataset.id,r=n===e.selfId?this.mic.state===`on`?Math.min(1,this.mic.meter):0:this.audio.voiceLevel(n),i=t.querySelector(`.dot`);i&&i.style.setProperty(`--lv`,r.toFixed(2))}this.copiedUntil&&performance.now()>this.copiedUntil&&(this.copiedUntil=0,tp(`btnCopyText`).textContent=K(`coopCopy`))}},op=new B,sp=class{constructor(e){this.el=e,this.items=new Map}clear(){for(let e of this.items.values())e.div.remove();this.items.clear()}update(e,t,n){let r=new Set,i=innerWidth,a=innerHeight;for(let o of e.remotes.values()){r.add(o.id);let s=this.items.get(o.id);if(!s){let e=document.createElement(`div`);e.className=`mate`,e.style.setProperty(`--c`,o.color),this.el.appendChild(e),s={div:e,key:``,op:-1,tx:``},this.items.set(o.id,s)}let c=e.spectate&&e.spectate.target===o,l=e.time-o.revealT,u=n||l<2.4?.95:l<3.4?.95*(3.4-l):0;c&&(u=0),op.set(o.x,o.y+(o.alive?o.eyeCur+.45:.6),o.z),op.project(t),(op.z>1||op.z<-1||Math.abs(op.x)>1.2||Math.abs(op.y)>1.2)&&(u=0);let d=Math.hypot(o.x-t.position.x,o.z-t.position.z),f=`${o.name}|${+!!o.alive}|${n?Math.round(d):-1}`;if(s.key!==f&&(s.key=f,s.div.innerHTML=`${cp(o.alive?o.name:`† ${o.name}`)}${n?`<small>${Math.round(d)} ${K(`meters`)}</small>`:``}`,s.div.classList.toggle(`dead`,!o.alive)),s.div.classList.toggle(`talk`,o.alive&&o.loud>.12&&u>0),u>0){let e=`translate(${((op.x+1)*.5*i).toFixed(0)}px, ${((1-op.y)*.5*a).toFixed(0)}px) translate(-50%, -100%)`;s.tx!==e&&(s.tx=e,s.div.style.transform=e)}let p=u.toFixed(2);s.op!==p&&(s.op=p,s.div.style.opacity=p)}for(let[e,t]of this.items)r.has(e)||(t.div.remove(),this.items.delete(e))}};function cp(e){return String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}Ul(G.lang);var lp=new URLSearchParams(location.search),up={t:parseFloat(lp.get(`t`))||0,speed:parseFloat(lp.get(`speed`))||1,autostart:lp.has(`autostart`),night:lp.has(`night`),nomic:lp.has(`nomic`),fps:lp.has(`fps`)},dp=e=>document.getElementById(e),fp=dp(`gl`),pp;try{pp=new kl({canvas:fp,antialias:!1,powerPreference:`high-performance`,stencil:!1})}catch(e){throw dp(`bootText`).textContent=`WebGL2 недоступен / WebGL2 is not available`,e}pp.outputColorSpace=Ye,pp.info.autoReset=!1,pp.setClearColor(0,1);var mp=new qn,hp=new Ka(W.FOV,innerWidth/innerHeight,.05,W.CAMERA_FAR);hp.rotation.order=`YXZ`;var gp=new Bu(pp),_p=new vu(mp,wu()),vp=new Fu,yp=new Vu(mp),bp=new Wu(mp),xp=new qu(mp),Sp=Au(2600);mp.add(Sp);var Cp=ju();mp.add(Cp);var wp=new fd,Tp=new pd(dp(`radar`)),Ep=new ad(fp);Ep.bindTouchUI(dp(`touch`));var Dp=new ep({audio:ed,mic:rd}),Op=new sp(dp(`mates`)),Q=null,kp=!1,$=`boot`,Ap=0,jp=0,Mp={acc:0,n:0,scale:1,cool:3,ceiling:9,ceilT:0,fpsEl:null,fps:60};function Np(){let e=Math.min(window.devicePixelRatio||1,2);return G.quality===`high`?[Math.min(e,1.5),Math.min(e,1.5)]:G.quality===`low`?[.55,.55]:[.5,Math.min(e,1.25)]}function Pp(){let[e,t]=Np();Mp.scale=Math.min(t,Math.max(e,G.quality===`auto`?Math.min(1,t):t)),Fp()}function Fp(){let e=innerWidth,t=innerHeight;pp.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)),pp.setSize(e,t,!1),hp.aspect=e/t,hp.updateProjectionMatrix(),gp.setSize(e,t,Mp.scale),Tp.resize()}window.addEventListener(`resize`,Fp);function Ip(){return gp.h/(2*Math.tan(zt.degToRad(hp.fov)/2))}function Lp(e){if(Mp.acc+=e,Mp.n++,Mp.cool-=e,Mp.ceilT-=e,Mp.ceilT<=0&&(Mp.ceiling=9),Mp.acc<1)return;let t=Mp.acc/Mp.n;if(Mp.fps=1/t,Mp.acc=0,Mp.n=0,G.quality===`auto`&&($===`playing`||$===`menu`)){let[e,n]=Np();t>1/50&&Mp.scale>e+.001?(Mp.ceiling=Mp.scale-.05,Mp.ceilT=30,Mp.scale=Math.max(e,Mp.scale-.12),Mp.cool=4,Fp()):t<1/57&&Mp.scale<Math.min(n,Mp.ceiling)-.001&&Mp.cool<=0&&(Mp.scale=Math.min(n,Mp.ceiling,Mp.scale+.06),Mp.cool=5,Fp())}Mp.fpsEl&&(Mp.fpsEl.textContent=`${Mp.fps.toFixed(0)} fps · ${gp.w}×${gp.h} · ${(pp.info.render.triangles/1e3).toFixed(0)}k tris`)}var Rp=new gd({onPlay:()=>Xp(),onResume:()=>$p(),onRestart:()=>Zp(),onMenu:()=>em(),onCoop:()=>zp.open(),onLobby:()=>em(!0),onMicToggle:()=>Hp(),onSettingsChanged:e=>{e===`volume`&&ed.setVolume(G.volume),e===`voiceEcho`&&rd.setEcho(G.voiceEcho),e===`micEnabled`&&(!G.micEnabled&&rd.state===`on`&&rd.stop(),G.micEnabled&&rd.state!==`on`&&(ed.init(),rd.start(ed).then(Vp)),Vp()),e===`quality`&&Pp(),e===`radar`&&Up(),(e===`lang`||e===void 0)&&(wp.cache={},Bp(),zp.render(),dp(`lockHint`).textContent=Ep.lockFailed?K(`dragToLook`):K(`clickToLook`))},uiSound:e=>{ed.ready&&(e===`hover`?ed.uiHover():ed.uiClick())}}),zp=new ap({coop:Dp,mic:rd,audio:ed,onMicToggle:()=>Hp(),uiSound:e=>{ed.ready&&(e===`hover`?ed.uiHover():ed.uiClick())}});Dp.on(`change`,()=>zp.render()),Dp.on(`start`,e=>Xp({coop:e})),Dp.on(`hostLost`,()=>{kp&&Q&&($===`playing`||$===`paused`)&&Q.hostLost(),zp.render()});function Bp(){Rp.setMicStatus(rd.state,nd.inIframe()),wp.setMic(rd.state),dp(`sMic`).checked=G.micEnabled}function Vp(){Bp(),Dp.active&&(Dp.syncVoice(),Dp.announce()),zp.render()}async function Hp(){ed.init(),rd.state===`on`?(rd.stop(),G.micEnabled=!1):(G.micEnabled=!0,Bp(),await rd.start(ed)),Rl(),Vp(),$===`playing`&&wp.popup(rd.state===`on`?K(`micOn`):K(`micOff`),`dim`)}function Up(){document.body.classList.toggle(`radar-on`,!!G.radar),Tp.resize()}dp(`pauseBtn`).addEventListener(`click`,e=>{e.stopPropagation(),$===`playing`&&Qp()}),dp(`btnStart`).addEventListener(`click`,()=>ed.init()),window.addEventListener(`pointerdown`,()=>ed.init(),{capture:!0}),window.addEventListener(`keydown`,()=>ed.init(),{capture:!0});var Wp={rig:null,yaw:.6,nextPing:.4,nextGlint:2.2};function Gp(){let e=bd(),t=2.35,n=_p.spawn.x+Math.cos(t)*21,r=_p.spawn.z+Math.sin(t)*21;e.root.position.set(n,_p.terrain.height(n,r),r),e.root.rotation.y=Math.atan2(_p.spawn.x-n,_p.spawn.z-r),e.nodes.spine.rotation.x=.35,e.nodes.neck.rotation.x=-.3,e.nodes.head.rotation.z=.35,e.nodes.shoulderL.rotation.x=-.2,e.nodes.shoulderR.rotation.x=.1,e.nodes.jaw.rotation.x=.25,Wp.rig=e}function Kp(e,t=!0){let n=hp.position;vp.emit(n.x,n.y-.3,n.z,jp,{radius:W.revealRadius(e),strength:.85+e*.5,decay:.42,color:t?[.84,.92,1]:[1,.2,.15],kind:`player`}),Wp.lastPing=jp}function qp(){let e=Wp.rig;e.root.updateMatrixWorld(!0);let t=e.nodes.head.getWorldPosition(new B),n=e.root.rotation.y;bp.add(t.x+Math.sin(n)*.09,t.y+.06,t.z+Math.cos(n)*.09,n,{time:jp,life:.75,intensity:.85,blink:Math.random()<.5,spacing:.26,size:.16})}function Jp(e){jp+=e,X.uTime.value=jp,Wp.yaw+=e*.06;let t=_p.spawn.x,n=_p.spawn.z;if(hp.position.set(t,_p.terrain.height(t,n)+1.7,n),hp.rotation.set(.03+Math.sin(jp*.21)*.03,Wp.yaw,Math.sin(jp*.13)*.01,`YXZ`),X.uCam.value.copy(hp.position),$===`menu`&&jp>Wp.nextPing&&(Kp(.5+Math.random()*.35),Wp.nextPing=jp+3.2+Math.random()*2.2),$===`menu`&&jp>Wp.nextGlint&&(jp-(Wp.lastPing??-9)>2.2&&Wp.nextPing-jp>.9&&qp(),Wp.nextGlint=jp+2.5+Math.random()*4),rd.state===`on`){let t=rd.update(e,ed.outputDb());t.pulse>0&&$===`menu`&&(Kp(Math.max(.35,t.pulse)),Wp.nextPing=jp+3);let n=rd.screamDb>rd.floor?(rd.trig-rd.floor)/(rd.screamDb-rd.floor):.3;Rp.micTest(rd.meter,Math.min(.9,Math.max(.05,n)))}vp.update(jp);for(let e of vp.fronts()){let t=Wp.rig.root.position,n=Math.hypot(t.x-e.x,t.y+1.4-e.y,t.z-e.z);n>e.prevR&&n<=e.curR&&yp.spawn(Wp.rig,jp,{strength:1,life:2.6,decay:1,color:16722464})}yp.update(jp),bp.update(jp,Ip()),xp.update(e,Ip());let r=gp.u;r.uAberr.value=.2,r.uGlitch.value=Math.max(0,r.uGlitch.value-e*2),r.uRed.value=0,r.uWhite.value=0,r.uDanger.value=0,r.uGrain.value=.06,r.uShockAmp.value=0,r.uFade.value=Math.min(1,r.uFade.value+e*.8),r.uWarm.value=0,r.uFlicker.value=0,r.uAsh.value=.62,X.uDawn.value=0,X.uFear.value=0}function Yp(){document.body.classList.toggle(`playing`,$===`playing`),Ep.gameActive=$===`playing`}function Xp(e={}){if(!Q)return;let t=!!e.coop;if(!(!t&&$===`over`&&performance.now()-Ap<450)){if(!t&&Dp.active&&Dp.leave(),kp&&Q.online&&Q.teardownOnline(),ed.init(),ed.setVolume(G.volume),Rp.only(null),Rp.show(`settingsPanel`,!1),Rp.show(`howPanel`,!1),Rp.show(`scoresPanel`,!1),zp.close(),wp.show(!0),wp.cache={},Ep.reset(),Op.clear(),document.body.classList.remove(`coop-over`,`coop-guest`,`spectating`),document.body.classList.toggle(`coop`,t),kp=t,t){let t=e.coop.players.find(e=>e.id===Dp.selfId);Q.setupSolo(),Q.reset({seed:e.coop.seed,slot:t?t.slot:0}),Q.setupOnline(Dp,e.coop.players)}else Q.setupSolo(),Q.reset(),(up.night||up.t>0)&&Q.startNight(),up.t>0&&(Q.time=up.t,Q.firstPingT=Math.max(0,up.t-30),Q.tut.done=!0);$=`playing`,Yp(),gp.u.uFade.value=1,Ep.touch||Ep.requestLock(),ed.startAmbience(),ed.resetFx(),ed.setAmbience(.9,0),ed.setPaused(!1),G.micEnabled&&!up.nomic&&rd.state===`off`&&(rd.start(ed).then(Vp),Bp()),im=performance.now()}}function Zp(){kp||Dp.active?Dp.active&&Dp.isHost&&$!==`playing`&&Dp.startRun():Xp()}function Qp(){if($!==`playing`||!Q||![`play`,`morning`,`dusk`].includes(Q.state))return;$=`paused`,Yp(),Q.online?(Q.inputMuted=!0,Ep.reset()):ed.setPaused(!0),Ep.exitLock();let e=Q.state===`play`;dp(`pauseStats`).innerHTML=e?`${sd(Q.time)} · ${K(`generators`)} ${Q.objectives.count}/5<br>${K(`score`)} ${cd(Q.score)} ×${Q.mult.toFixed(1)}`:`${K(`morningBig`)}`,Rp.only(`pause`)}function $p(){$===`paused`&&(Rp.show(`settingsPanel`,!1),Rp.only(null),$=`playing`,Yp(),ed.setPaused(!1),Q&&(Q.inputMuted=!1),Ep.touch||Ep.requestLock(),im=performance.now())}function em(e=!1){let t=kp;if(Q){for(let e of Q.monsters)e.dispose();Q.monsters=[],Q.state=`idle`,Q.objectives.silence(),ed.setMorning(!1),Q.inputMuted=!1,Q.online&&Q.teardownOnline(),Q.setupSolo()}kp=!1,(t||Dp.active)&&(e&&Dp.active?Dp.leaveRun():Dp.leave()),Op.clear(),document.body.classList.remove(`coop`,`coop-over`,`coop-guest`,`spectating`),X.uDawn.value=0,X.uMorning.value=0,vp.clear(),yp.clear(),bp.clear(),xp.clear(),Ep.exitLock(),ed.setPaused(!1),ed.resetFx(),ed.setAmbience(0,0),wp.show(!1),wp.setIntro(null),wp.setHint(null),$=`menu`,Yp(),Rp.only(`menu`),Rp.renderScores(),Bp(),gp.u.uFade.value=0,e&&Dp.active&&zp.open(),zp.menuLabel()}function tm(){let e=Dp.me(),t=[{name:$f(),color:Gd[e?e.slot%4:0],alive:Q.player.alive,score:Q.score,self:!0,slot:e?e.slot:0}];for(let e of Q.remotes.values())t.push({name:e.name,color:e.color,alive:e.alive,score:e.score,slot:e.slot});return t.sort((e,t)=>e.slot-t.slot)}function nm(e){let t=kp,n={...Q.stats,gens:Q.objectives.count,time:Q.time,score:Q.score,loudestDb:-100},r=t?tm():null,{rank:i,list:a}=Bl({name:G.name||`???`,score:Q.score,time:n.time,won:e.won,shards:n.shards,gens:n.gens,coop:t?Math.max(r.length,Q.teamSize||1):0});Rp.showOver(e,n,i,a,r),Rp.renderScores(),t?(Dp.endRun(),Q.teardownOnline(),Q.inputMuted=!1,document.body.classList.add(`coop-over`),document.body.classList.toggle(`coop-guest`,!Dp.isHost||!Dp.active),dp(`restartHint`).textContent=Dp.isHost&&Dp.active?K(`restartHint`):K(`coopRestartHint`)):(document.body.classList.remove(`coop-over`,`coop-guest`),dp(`restartHint`).textContent=K(`restartHint`)),document.body.classList.remove(`spectating`),Op.clear(),$=`over`,Ap=performance.now(),Yp(),Ep.exitLock(),wp.show(!1),Rp.only(`over`)}function rm(e){for(let t of e)switch(t){case`pause`:zp.isOpen()?zp.close():Rp.isOpen(`settingsPanel`)?Rp.closeSettings():Rp.isOpen(`howPanel`)?Rp.show(`howPanel`,!1):Rp.isOpen(`scoresPanel`)?Rp.show(`scoresPanel`,!1):$===`playing`?Qp():$===`paused`&&$p();break;case`unlock`:case`blur`:$===`playing`&&!Ep.touch&&Qp();break;case`restart`:($===`over`||$===`paused`&&!kp)&&Zp();break;case`confirm`:if(Rp.isOpen(`settingsPanel`)||Rp.isOpen(`howPanel`)||Rp.isOpen(`scoresPanel`)||zp.isOpen())break;$===`over`?Zp():$===`menu`?Xp():$===`paused`&&$p();break;case`mic`:Hp();break;case`peek`:$===`playing`&&wp.peek(3.5)}}document.addEventListener(`visibilitychange`,()=>{document.hidden&&$===`playing`&&!kp&&Qp()});var im=performance.now();function am(e){requestAnimationFrame(am),om(e,!0)}setInterval(()=>{document.hidden&&kp&&($===`playing`||$===`paused`)&&om(performance.now(),!1)},50);function om(e,t){let n=(e-im)/1e3;im=e,n>0||(n=1/60),n>.1&&(n=.1),Lp(n);let r=Ep.poll(),i=Ep.consume();if($!==`boot`){if(rm(i),$===`menu`)Jp(n);else if($===`playing`||$===`paused`&&kp&&Q&&Q.state!==`over`){let a=Math.min(n,.05)*(kp?1:Q.fx.timeScale)*up.speed;if(Q.update(a,$===`paused`?{look:{dx:0,dy:0},events:[]}:{look:r,events:i}),!t&&$!==`over`){Q.applyView(hp,e/1e3);return}if($===`playing`||$===`paused`){X.uTime.value=Q.time,yp.update(Q.time),bp.update(Q.time,Ip()),xp.update(a,Ip()),Q.applyView(hp,e/1e3),X.uCam.value.copy(hp.position),Q.hudUpdate(n),kp&&Op.update(Q,hp,Ep.peekHeld||wp.clock<wp.peekUntil);let t=``;!Ep.touch&&(Q.state===`play`||Q.state===`morning`)&&!Ep.locked&&(Ep.lockFailed?(Mp.dragHintAt||(Mp.dragHintAt=e),e-Mp.dragHintAt<7e3&&(t=K(`dragToLook`))):t=K(`clickToLook`));let r=dp(`lockHint`);r.textContent!==t&&t&&(r.textContent=t),document.body.classList.toggle(`needlock`,!!t),document.body.classList.toggle(`crouching`,Ep.crouch)}}else $===`over`&&Q&&Q.state===`won`&&(Q.player.yaw+=n*.05,Q.time+=n,X.uTime.value=Q.time,yp.update(Q.time),bp.update(Q.time,Ip()),xp.update(n,Ip()),Q.applyView(hp,e/1e3),X.uCam.value.copy(hp.position));$!==`playing`&&document.body.classList.remove(`needlock`),t&&(Cp.position.copy(hp.position),Sp.material.uniforms.uPix.value=9*(gp.h/900),gp.u.uTime.value=e/1e3,pp.info.reset(),gp.render(mp,hp))}}function sm(){Pp(),Up(),requestAnimationFrame(am),setTimeout(()=>{try{_p.generate()}catch(e){throw dp(`bootText`).textContent=`world generation failed: `+e.message,e}Q=new Rf({scene:mp,camera:hp,world:_p,pulses:vp,ghosts:yp,eyes:bp,particles:xp,audio:ed,mic:rd,input:Ep,hud:wp,radar:Tp,post:gp}),Q.onEnd=nm,Gp(),pp.compile(mp,hp),up.fps&&(Mp.fpsEl=document.createElement(`div`),Mp.fpsEl.style.cssText=`position:fixed;right:8px;top:64px;z-index:99;font:11px JetBrains Mono,monospace;color:#8ef0ff;opacity:.8;pointer-events:none`,document.body.appendChild(Mp.fpsEl)),window.__hush={world:_p,game:Q,shared:X,pulses:vp,ghosts:yp,eyes:bp,renderer:pp,perf:Mp,mic:rd,audio:ed,input:Ep,hud:wp,post:gp,coop:Dp,lobby:zp,debug:up,startRun:Xp,pause:Qp,resume:$p,toMenu:em,get state(){return $}},$=`menu`,jp=0,gp.u.uFade.value=0,Rp.only(`menu`),Bp(),up.autostart&&Xp(),lp.has(`sfx`)&&Gf(()=>import(`./sfxtest-DIBLm1Al.js`).then(e=>e.mountSfxPanel(ed)),[],import.meta.url),zp.menuLabel();let e=Yf(lp.get(`room`));e.length>=4&&(zp.open(),Dp.join(e).catch(e=>console.warn(`[coop] join failed`,e)).finally(()=>zp.render()))},60)}sm();