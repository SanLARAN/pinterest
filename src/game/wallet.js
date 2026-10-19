import {readJSON,writeJSON,isAccountScope} from '../core/persistence.js';
import {queueReward,pendingRewards} from '../cloud/rewards.js';
// Your shards: the amber ones you pick up in the forest are also money. Kept in the browser, spent in the
// shop (see outfit.js: SHOP) on things to wear — and on a car for the garage.
//
//   +1 for every shard you pick up (on a co-op night, everyone gets the +1 when anyone picks one up)
//   +10 for driving away in the УАЗ
const KEY = 'hush.wallet.v1';

function load() {
  const w = { shards: 0, total: 0, owned: [], version:0 };
  try {
    const raw=readJSON(KEY);
    if (raw && typeof raw === 'object') {
      w.shards = Math.max(0, Math.floor(+raw.shards || 0));
      w.total = Math.max(w.shards, Math.floor(+raw.total || 0));
      w.version=Math.max(0,Math.floor(+raw.version||0));
      if (Array.isArray(raw.owned)) w.owned = raw.owned.filter((x) => typeof x === 'string' && x.length < 32).slice(0, 64);
    }
  } catch {
    /* a fresh wallet */
  }
  return w;
}

export const wallet = load();
const subs = new Set();

function save() {
  writeJSON(KEY,wallet,'wallet');
  for (const f of subs) {
    try { f(wallet); } catch { /* */ }
  }
}

// (fn) is called whenever the purse changes; returns an unsubscribe
export function onWallet(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

let purchaseBackend=null;
export function setPurchaseBackend(fn){purchaseBackend=fn;}
export function reloadWallet(){Object.assign(wallet,load());save();}
export function applyWallet(value){wallet.shards=Math.max(0,Math.floor(+value.shards||0));wallet.total=Math.max(wallet.shards,Math.floor(+value.total||0));wallet.version=Math.max(0,Math.floor(+value.version||0));wallet.owned=Array.isArray(value.owned)?[...new Set(value.owned.filter(v=>['leshy','plague','cosmos','trueno'].includes(v)))]:[];save();}
export {pendingRewards};
export const EARN = { shard: 1, escape: 10 };

export function earn(n) {
  n = Math.floor(n);
  if (!(n > 0)) return;
  if(isAccountScope()){queueReward(n);for(const f of subs){try{f(wallet);}catch{}}return;}
  wallet.shards += n;
  wallet.total += n;
  save();
}

export function hasProduct(id) {
  return wallet.owned.includes(id);
}

// true: it's yours now (or already was)
export function buyProduct(id, price) {
  if (hasProduct(id)) return true;
  if(isAccountScope()){if(!purchaseBackend)return Promise.reject(new Error('cloud_offline'));return purchaseBackend(id);}
  if (wallet.shards < price) return false;
  wallet.shards -= price;
  wallet.owned.push(id);
  save();
  return true;
}
