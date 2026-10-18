// Only durable game data crosses the cloud boundary. No PCM, tokens, permissions or device calibration.
import {readJSON,writeJSON,hydrate,setScope} from '../core/persistence.js';
import {settings,atlasLog,getScores,freshAtlas,defaultSettings,reloadStorageState} from '../core/storage.js';
import {wardrobe,ITEMS,cleanHex,reloadWardrobe} from '../game/outfit.js';
import {wallet,reloadWallet} from '../game/wallet.js';
import {cleanScreen} from '../game/screenFace.js';
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const n=(v,max=1e9)=>Math.max(0,Math.min(max,Math.floor(Number.isFinite(+v)?+v:0)));
const name=v=>String(v||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,14);
export const PRODUCTS=['leshy','plague','cosmos','trueno'];
export function cleanWallet(raw){const v=obj(raw),shards=n(v.shards),owned=Array.isArray(v.owned)?[...new Set(v.owned.filter(id=>PRODUCTS.includes(id)))]:[];return{shards,total:Math.max(shards,n(v.total)),owned,version:n(v.version)};}
export function cleanSettings(raw){const v=obj(raw),d=defaultSettings(),out={};for(const k of['lang','volume','mouseSens','invertY','voiceEcho','scares','radar','name','tutorialDone','lobbyHideNames'])out[k]=d[k];out.lang=['ru','en'].includes(v.lang)?v.lang:d.lang;out.name=name(v.name);for(const k of['invertY','voiceEcho','radar','tutorialDone','lobbyHideNames'])if(typeof v[k]==='boolean')out[k]=v[k];for(const[k,max]of[['volume',1],['mouseSens',4]])if(Number.isFinite(v[k]))out[k]=Math.max(k==='mouseSens'?.1:0,Math.min(max,v[k]));if(typeof v.scares==='string'&&['full','less','off','reduced','lite'].includes(v.scares))out.scares=v.scares;return out;}
function safeMap(v,boolean=false){const out={};for(const[k,value]of Object.entries(obj(v)).slice(0,96))if(/^[a-z0-9_:-]{1,40}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k))out[k]=boolean?!!value:n(value);return out;}
export function cleanAtlas(raw){const v=obj(raw),out=freshAtlas();for(const k of Object.keys(out)){if(typeof out[k]==='number')out[k]=n(v[k]);else if(typeof out[k]==='boolean')out[k]=typeof v[k]==='boolean'?v[k]:out[k];else if(Array.isArray(out[k]))out[k]=out[k].map((_,i)=>n(Array.isArray(v[k])?v[k][i]:0));else out[k]=safeMap(v[k],k==='read');}return out;}
export function cleanOutfit(raw){const v=obj(raw),out={colors:{},screen:cleanScreen(v.screen)};for(const slot of['head','body','car'])out[slot]=ITEMS[slot].some(it=>it.id===v[slot])?v[slot]:ITEMS[slot][0].id;for(const slot of['head','body','car'])for(const it of ITEMS[slot]){const c=obj(v.colors)[it.id];if(Array.isArray(c))out.colors[it.id]=[cleanHex(c[0],it.c[0]),cleanHex(c[1],it.c[1])];}return out;}
export function cleanScores(raw){return(Array.isArray(raw)?raw:[]).slice(0,100).map(v=>{v=obj(v);return{name:name(v.name)||'???',score:n(v.score),time:n(v.time,86400),won:!!v.won,shards:n(v.shards,256),gens:n(v.gens,5),coop:n(v.coop,4),date:n(v.date,Date.now()+86400000)}}).sort((a,b)=>b.score-a.score||a.time-b.time).slice(0,10);}
export function cleanPayload(raw){const v=obj(raw);if(Number(v.v)>1)throw new Error('cloud_version');return{v:1,settings:cleanSettings(v.settings),outfit:cleanOutfit(v.outfit),atlas:cleanAtlas(v.atlas),scores:cleanScores(v.scores)};}
export function capturePayload(){return cleanPayload({settings,outfit:wardrobe,atlas:atlasLog,scores:getScores()});}
export function scopeSnapshot(owner){return{payload:cleanPayload({settings:readJSON('hush.settings.v1',{},owner),outfit:readJSON('hush.outfit.v1',{},owner),atlas:readJSON('hush.atlas.v1',{},owner),scores:readJSON('hush.scores.v1',[],owner)}),wallet:cleanWallet(readJSON('hush.wallet.v1',{},owner))};}
export function cacheSnapshot(owner,payload,coins=null){const p=cleanPayload(payload);for(const[key,data]of[['hush.settings.v1',p.settings],['hush.outfit.v1',p.outfit],['hush.atlas.v1',p.atlas],['hush.scores.v1',p.scores]])writeJSON(key,data,null,owner);if(coins)writeJSON('hush.wallet.v1',cleanWallet(coins),null,owner);return p;}
export function activateSnapshot(owner,payload,coins){cacheSnapshot(owner,payload,coins);hydrate(()=>{setScope(owner);reloadWallet();reloadStorageState();reloadWardrobe();});}
export function legacyAvailable(){const{payload:p,wallet:w}=scopeSnapshot('guest');return w.total>0||w.owned.length>0||p.atlas.nights>0||p.scores.length>0||p.outfit.head!=='hood'||p.outfit.body!=='jacket';}
