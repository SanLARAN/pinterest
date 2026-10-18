// One local key per receipt: two tabs cannot overwrite one another's pending rewards.
import { getScope,isAccountScope,writeJSON,scopedKey,signalSave,newSaveId } from '../core/persistence.js';
const PREFIX='hush.reward.v1.';const memory=new Map();let active=null;
const uuid=newSaveId;
export function rewardRows(owner=getScope()){
 if(!isAccountScope(owner))return[];
 const rows=new Map();try{const prefix=scopedKey(PREFIX,owner);for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k?.startsWith(prefix))continue;const r=JSON.parse(localStorage.getItem(k));if(r&&isAccountScope(r.nonce)&&Number.isInteger(r.earned)&&r.earned>=0&&r.earned<=256)rows.set(r.nonce,r);}}catch{}
 for(const [key,r]of memory)if(key.startsWith(owner+':'))rows.set(r.nonce,r);
 return[...rows.values()].sort((a,b)=>a.started-b.started).slice(0,512);
}
function store(owner,row){memory.set(owner+':'+row.nonce,row);writeJSON(PREFIX+row.nonce,row,null,owner);signalSave('reward',owner);}
export function beginRewards(){endRewards({reason:'restart'});const owner=getScope();if(!isAccountScope(owner))return;const row={nonce:uuid(),earned:0,closed:false,started:Date.now(),summary:{}};active={owner,row};store(owner,row);}
export function queueReward(n){const owner=getScope();if(!isAccountScope(owner))return false;if(!active||active.owner!==owner)beginRewards();active.row.earned=Math.min(256,active.row.earned+Math.max(0,Math.floor(n)));store(owner,active.row);return true;}
export function endRewards(summary={}){if(!active)return;const{owner,row}=active;active=null;row.closed=true;row.summary={reason:String(summary.reason||'end').slice(0,24),won:!!summary.won,time:Math.max(0,Math.min(86400,Number(summary.time)||0)),score:Math.max(0,Math.min(1e9,Number(summary.score)||0)),gens:Math.max(0,Math.min(5,summary.gens|0))};store(owner,row);}
export function removeReward(owner,nonce){memory.delete(owner+':'+nonce);try{localStorage.removeItem(scopedKey(PREFIX+nonce,owner));}catch{}signalSave('reward-acked',owner);}
export function pendingRewards(owner=getScope()){return rewardRows(owner).reduce((n,r)=>n+r.earned,0);}
export function recoverAbandonedRewards(owner){for(const row of rewardRows(owner))if(!row.closed&&row.started<Date.now()-86400000){row.closed=true;row.summary={reason:'recovered'};store(owner,row);}}
if(typeof window!=='undefined')window.addEventListener('pagehide',()=>endRewards({reason:'tab_closed'}));
