// Account-separated local caches. Auth tokens use the SDK's storage, never this save bus.
const ACTIVE='hush.active-account.v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const listeners=new Set(),memory=new Map();let muted=0;
function readActive(){try{const v=localStorage.getItem(ACTIVE);return UUID.test(v||'')?v:'guest';}catch{return'guest';}}
let scope=readActive();
export const getScope=()=>scope;
export const isAccountScope=(v=scope)=>UUID.test(v||'');
export function scopedKey(key,owner=scope){if(owner==='guest')return key;if(!isAccountScope(owner))throw new Error('bad_scope');return`hush.account.${owner}.${key}`;}
export function readJSON(key,fallback=null,owner=scope){let k;try{k=scopedKey(key,owner);}catch{return fallback;}let raw=null;try{raw=localStorage.getItem(k);}catch{}if(raw===null)raw=memory.get(k)??null;try{return raw===null?fallback:JSON.parse(raw);}catch{return fallback;}}
export function writeJSON(key,value,section=null,owner=scope){let k;try{k=scopedKey(key,owner);}catch{return false;}let ok=true;try{const raw=JSON.stringify(value);memory.set(k,raw);localStorage.setItem(k,raw);}catch{ok=false;}if(section)signalSave(section,owner);return ok;}
export function setScope(owner){if(owner!=='guest'&&!isAccountScope(owner))throw new Error('bad_scope');scope=owner;try{if(owner==='guest')localStorage.removeItem(ACTIVE);else localStorage.setItem(ACTIVE,owner);}catch{}}
export function onSave(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export function signalSave(section,owner=scope){if(muted)return;for(const fn of listeners){try{fn({section,owner});}catch{/* Saving must never interrupt a game frame. */}}}
export function hydrate(fn){muted++;try{return fn();}finally{muted--;}}
export function readDevice(){const v=readJSON('hush.device.v1',null,'guest')||readJSON('hush.settings.v1',{},'guest');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
// settings that belong to this machine only: never the cloud, always re-overlaid on load
export const DEVICE_KEYS=['quality','graphics','micEnabled','micSens','micCal','voiceVol'];
export function saveDevice(settings){const v={};for(const k of DEVICE_KEYS)v[k]=settings[k];writeJSON('hush.device.v1',v,null,'guest');}
export function readMeta(owner=scope){const v=readJSON('hush.cloud-meta.v1',{},owner)||{};return{version:Math.max(0,Number(v.version)||0),dirty:v.dirty===true,rev:Math.max(0,Number(v.rev)||0),lastSync:typeof v.lastSync==='string'?v.lastSync:null};}
export function writeMeta(meta,owner=scope){writeJSON('hush.cloud-meta.v1',meta,null,owner);}
// randomUUID is HTTPS-only in some browsers. Guest play must still boot on a LAN preview.
export function newSaveId(){if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();const b=new Uint8Array(16);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(b);else for(let i=0;i<16;i++)b[i]=Math.random()*256;b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
