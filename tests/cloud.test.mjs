import test from 'node:test';import assert from 'node:assert/strict';
class MemoryStorage{constructor(){this.map=new Map();}get length(){return this.map.size;}key(i){return[...this.map.keys()][i]??null;}getItem(k){return this.map.get(k)??null;}setItem(k,v){this.map.set(k,String(v));}removeItem(k){this.map.delete(k);}clear(){this.map.clear();}}
globalThis.localStorage=new MemoryStorage();
const{getScope,setScope,readJSON,writeJSON,readMeta,DEVICE_KEYS}=await import('../src/core/persistence.js');
const{defaultSettings}=await import('../src/core/storage.js');
const{cleanSettings}=await import('../src/cloud/snapshot.js');
const{settings,saveSettings}=await import('../src/core/storage.js');
const{wardrobe,saveWardrobe}=await import('../src/game/outfit.js');
const{wallet,buyProduct}=await import('../src/game/wallet.js');
const{cleanPayload,activateSnapshot,scopeSnapshot,capturePayload}=await import('../src/cloud/snapshot.js');
const{CloudController}=await import('../src/cloud/controller.js');
const{beginRewards,queueReward,endRewards,rewardRows,pendingRewards}=await import('../src/cloud/rewards.js');
const{authRedirect}=await import('../src/cloud/client.js');
const clone=x=>structuredClone(x),session=u=>({user:u,access_token:'synthetic-test-token'}),uid=()=>crypto.randomUUID();
function reset(){endRewards();localStorage.clear();setScope('guest');activateSnapshot('guest',cleanPayload({settings:{lang:'ru',name:'Guest'}}),{shards:100,total:100,owned:[],version:0});}
function fakeBackend(){
 const users=[{id:uid(),email:'a@example.invalid'},{id:uid(),email:'b@example.invalid'}],snapshots=new Map(users.map((u,i)=>[u.id,{profile:{id:u.id,handle:'player_'+i,display_name:'Player'+i},save:{version:1,initialized:true,payload:cleanPayload({settings:{name:'Player'+i}}),updated_at:new Date().toISOString()},wallet:{shards:100+i*100,total:100+i*100,owned:[],version:0}}]));
 let current=users[0],sessionValue=null;const calls=[],runs=new Map(),listeners=new Set();let failAfterReward=false;
 const api={users,snapshots,calls,setUser:u=>{current=u;sessionValue=u?session(u):null;},setFailReward:()=>{failAfterReward=true;},gate:null};
 const client={auth:{onAuthStateChange(fn){listeners.add(fn);return{data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}};},async getSession(){return{data:{session:sessionValue},error:null};},async signInWithPassword({email}){current=users.find(u=>u.email===email);sessionValue=session(current);for(const fn of listeners)fn('SIGNED_IN',sessionValue);return{data:{session:sessionValue},error:null};},async signOut(){sessionValue=null;for(const fn of listeners)fn('SIGNED_OUT',null);return{error:null};}},channel(){const ch={on(){return ch;},subscribe(){return ch;}};return ch;},removeChannel:async()=>{},async rpc(name,p={}){
  calls.push({name,p:clone(p),user:current?.id});if(api.gate?.name===name){const gate=api.gate;api.gate=null;return gate.promise;}
  const s=snapshots.get(current?.id);if(p.p_owner&&p.p_owner!==current?.id)return{error:{message:'wrong_account'}};let data=null;
  if(name==='hush_bootstrap'||name==='hush_snapshot')data=s;
  if(name==='hush_social')data={friends:[],requests:[],invites:[],blocked:[]};
  if(name==='hush_initialize'){if(!s.save.initialized){s.save.initialized=true;s.save.version++;s.save.payload=clone(p.p_payload);if(p.p_legacy)s.wallet={...clone(p.p_legacy),version:1};}data=s;}
  if(name==='hush_save'){if(p.p_version!==s.save.version)data={conflict:true,snapshot:s};else{s.save.version++;s.save.payload=clone(p.p_payload);data={conflict:false,snapshot:s};}}
  if(name==='hush_buy'){const price={leshy:40,plague:60,cosmos:80,trueno:86}[p.p_product];if(!price)return{error:{message:'bad_product'}};if(!s.wallet.owned.includes(p.p_product)){if(s.wallet.shards<price)return{error:{message:'insufficient_funds'}};s.wallet.shards-=price;s.wallet.owned.push(p.p_product);s.wallet.version++;}data=s;}
  if(name==='hush_begin_run'){if(!runs.has(p.p_nonce))runs.set(p.p_nonce,{paid:false});data={ok:true};}
  if(name==='hush_finish_run'){const r=runs.get(p.p_nonce);if(!r.paid){r.paid=true;s.wallet.shards+=p.p_earned;s.wallet.total+=p.p_earned;s.wallet.version++;}if(failAfterReward){failAfterReward=false;return{error:{message:'network_test_failure'}};}data={ok:true,snapshot:s};}
  return{data:clone(data),error:null};
 }};api.client=client;return api;
}
async function loggedIn(backend,options={}){backend.setUser(backend.users[0]);const c=new CloudController({clientFactory:async()=>backend.client,...options});c.client=backend.client;await c.sessionChanged(session(backend.users[0]));return c;}

test('cloud payload excludes passwords, PCM and hardware settings; scores/art/maps stay bounded',()=>{
 reset();const p=cleanPayload({v:1,settings:{name:'<Nick>',lang:'ru',micCal:{floor:10},micEnabled:true,quality:'high',voiceVol:{private:1},volume:.7,password:'never'},outfit:{head:'screen',screen:{bits:'f'.repeat(192),text:'НЕ ШУМИ'}},atlas:JSON.parse('{"seen":{"__proto__":99,"crawler":2}}'),scores:Array.from({length:100},(_,i)=>({score:i,name:'A'})),tokens:'never',pcm:[1,2]});
 assert.equal(p.outfit.screen.text,'НЕ ШУМИ');assert.equal(p.scores.length,10);assert.equal(p.scores[0].score,99);assert.equal(p.settings.name,'Nick');for(const k of['password','micCal','micEnabled','quality','voiceVol'])assert.equal(k in p.settings,false);assert.equal(Object.hasOwn(p.atlas.seen,'__proto__'),false);assert.equal(p.atlas.seen.crawler,2);assert.equal('tokens'in p,false);assert.throws(()=>cleanPayload({v:2}),/cloud_version/);
});
test('guest and account local saves never overwrite one another; device consent/calibration stays local',()=>{
 reset();settings.micEnabled=false;settings.micCal={floor:-65};saveSettings();const guest=scopeSnapshot('guest'),a=uid();activateSnapshot(a,cleanPayload({settings:{name:'Cloud'},outfit:{head:'screen'}}),{shards:5,total:5,owned:[],version:3});assert.equal(settings.micEnabled,false);assert.equal(settings.micCal.floor,-65);settings.name='Changed';saveSettings();wardrobe.screen.text='HELLO';saveWardrobe();assert.equal(scopeSnapshot('guest').payload.settings.name,guest.payload.settings.name);assert.equal(scopeSnapshot('guest').wallet.shards,100);activateSnapshot('guest',guest.payload,guest.wallet);assert.equal(wallet.shards,100);assert.equal(settings.name,'Guest');assert.notEqual(wardrobe.screen.text,'HELLO');
});
test('guest shop stays local and a product cannot charge twice',()=>{reset();assert.equal(buyProduct('leshy',40),true);assert.equal(buyProduct('leshy',40),true);assert.equal(wallet.shards,60);assert.equal(wallet.owned.filter(v=>v==='leshy').length,1);});
test('first login does not silently import or discard guest data; explicit import is one-time',async()=>{
 reset();const b=fakeBackend(),s=b.snapshots.get(b.users[0].id);s.save.initialized=false;s.save.version=0;s.wallet={shards:0,total:0,owned:[],version:0};const c=await loggedIn(b);try{assert.equal(c.importPending,true);assert.equal(getScope(),'guest');assert.equal(wallet.shards,100);await c.initialize(true);assert.equal(getScope(),b.users[0].id);assert.equal(wallet.shards,100);assert.equal(scopeSnapshot('guest').wallet.shards,100);writeJSON('hush.wallet.v1',{shards:999,total:999,owned:[]},null,'guest');await c.initialize(true);assert.equal(wallet.shards,100);}finally{c.destroy();}
});
test('gameplay/menu safety defers applying a fetched profile, without blocking the game',async()=>{
 reset();const b=fakeBackend();let safe=false;const c=await loggedIn(b,{canApply:()=>safe});try{assert.equal(getScope(),'guest');assert.equal(settings.name,'Guest');assert.equal(c.status,'waiting');safe=true;c.safePoint();assert.equal(getScope(),b.users[0].id);assert.equal(settings.name,'Player0');}finally{c.destroy();}
});
test('many local settings edits create no per-frame requests and save in one owner-checked batch',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{b.calls.length=0;for(let i=0;i<30;i++){settings.volume=i/30;saveSettings();}assert.equal(b.calls.filter(x=>x.name==='hush_save').length,0);await c.flush();const saves=b.calls.filter(x=>x.name==='hush_save');assert.equal(saves.length,1);assert.equal(saves[0].p.p_owner,b.users[0].id);assert.equal(saves[0].p.p_payload.settings.volume,29/30);assert.equal(c.dirty,false);}finally{c.destroy();}
});
test('CAS conflict never silently overwrites another device; explicit local choice uses latest version',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{settings.name='Offline edit';saveSettings();const s=b.snapshots.get(b.users[0].id);s.save.version=2;s.save.payload.settings.name='Other device';assert.equal(await c.flush(),false);assert.ok(c.conflict);assert.equal(s.save.payload.settings.name,'Other device');await c.resolveConflict('local');assert.equal(s.save.payload.settings.name,'Offline edit');assert.equal(s.save.version,3);assert.equal(c.conflict,null);}finally{c.destroy();}
});
test('late snapshots and older wallet versions cannot roll confirmed state backwards',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{const old=clone(b.snapshots.get(b.users[0].id));settings.name='New';saveSettings();await c.flush();c.receive(old);assert.equal(settings.name,'New');assert.equal(c.version,2);c.acceptWallet({shards:60,total:100,owned:['leshy'],version:5});c.acceptWallet({shards:100,total:100,owned:[],version:4});assert.equal(wallet.shards,60);assert.deepEqual(wallet.owned,['leshy']);}finally{c.destroy();}
});
test('an old account’s in-flight save cannot hydrate or mutate the newly signed-in account',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{let resolve;const promise=new Promise(r=>resolve=r);b.gate={name:'hush_save',promise};settings.name='Account A pending';saveSettings();const pending=c.flush();await Promise.resolve();b.setUser(b.users[1]);await c.sessionChanged(session(b.users[1]));const snapshotA=clone(b.snapshots.get(b.users[0].id));snapshotA.save.version=2;resolve({data:{conflict:false,snapshot:snapshotA},error:null});await assert.rejects(pending,/stale_session/);assert.equal(getScope(),b.users[1].id);assert.equal(settings.name,'Player1');assert.equal(wallet.shards,200);assert.equal(c.saving,false);}finally{c.destroy();}
});
test('cloud purchases use server catalogue, not editable browser balance or client price',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{wallet.shards=999999;b.snapshots.get(b.users[0].id).wallet.shards=10;await assert.rejects(c.purchase('trueno'),/insufficient_funds/);const call=b.calls.find(x=>x.name==='hush_buy');assert.deepEqual(Object.keys(call.p).sort(),['p_owner','p_product']);assert.equal(b.snapshots.get(b.users[0].id).wallet.shards,10);}finally{c.destroy();}
});
test('reward receipts survive a lost response; replay credits once and stays in the original owner namespace',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{beginRewards();queueReward(3);endRewards({won:false,time:9});assert.equal(pendingRewards(),3);b.setFailReward();await assert.rejects(c.flushRewards(),/network_test_failure/);assert.equal(pendingRewards(),3);await c.flushRewards();assert.equal(wallet.shards,103);assert.equal(pendingRewards(),0);const other=uid();assert.equal(rewardRows(other).length,0);}finally{c.destroy();}
});
test('signing out restores the untouched guest wardrobe, wallet and stats',async()=>{
 reset();const b=fakeBackend(),c=await loggedIn(b);try{assert.equal(wallet.shards,100);wallet.shards=7;await c.logout();assert.equal(getScope(),'guest');assert.equal(settings.name,'Guest');assert.equal(wallet.shards,100);assert.equal(wardrobe.head,'hood');}finally{c.destroy();}
});
test('auth email links never accept an arbitrary redirect origin',()=>{
 assert.equal(authRedirect({href:'https://evil.example/steal'}),'https://sanlaran.github.io/pinterest/');assert.equal(authRedirect({href:'https://sanlaran.github.io/pinterest/play/?room=ABCDE#secret'}),'https://sanlaran.github.io/pinterest/play/');assert.equal(authRedirect({href:'http://127.0.0.1:5173/?room=ABCDE'}),'http://127.0.0.1:5173/');
});

test('an unavailable initial cloud pull is offline/retryable, never stuck loading or replacing guest data',async()=>{
 reset();const b=fakeBackend(),original=b.client.rpc;b.client.rpc=async(name,p)=>name==='hush_bootstrap'?{error:{message:'Failed to fetch'}}:original(name,p);b.setUser(b.users[0]);const c=new CloudController();c.client=b.client;
 try{await assert.rejects(c.sessionChanged(session(b.users[0])),/fetch/);assert.equal(c.status,'offline');assert.equal(c.profile,null);assert.equal(getScope(),'guest');assert.equal(wallet.shards,100);}finally{c.destroy();}
});

test('fresh sign-in always trusts the server wallet, not a corrupted higher-version local cache',async()=>{
 reset();const b=fakeBackend(),owner=b.users[0].id;activateSnapshot(owner,cleanPayload({settings:{name:'Cached'}}),{shards:999999,total:999999,owned:['cosmos'],version:999999});const c=await loggedIn(b);try{assert.equal(wallet.shards,100);assert.deepEqual(wallet.owned,[]);assert.equal(wallet.version,0);}finally{c.destroy();}
});
test('an invalid cache owner can never fall through into the guest save',()=>{
 reset();writeJSON('hush.wallet.v1',{shards:999,total:999,owned:[]},null,'not-a-user');assert.equal(readJSON('hush.wallet.v1',{},'guest').shards,100);assert.equal(readJSON('hush.wallet.v1',null,'not-a-user'),null);
});
test('blocked browser storage keeps the current cloud snapshot in memory without crashing guest play',()=>{
 reset();const previous=globalThis.localStorage;globalThis.localStorage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')},removeItem(){throw new Error('blocked')}};try{const owner=uid();activateSnapshot(owner,cleanPayload({settings:{name:'Memory'},outfit:{head:'screen'}}),{shards:23,total:23,owned:[],version:2});assert.equal(settings.name,'Memory');assert.equal(wallet.shards,23);assert.equal(wardrobe.head,'screen');}finally{globalThis.localStorage=previous;setScope('guest');}
});

test('the sound and music sliders survive the cloud cleaner (music used to reset on every refresh)',()=>{
 reset();settings.volume=0.31;settings.music=0.17;saveSettings();
 const snap=scopeSnapshot('guest');
 assert.equal(snap.payload.settings.volume,0.31);assert.equal(snap.payload.settings.music,0.17);
 activateSnapshot('guest',snap.payload,snap.wallet); // what a page refresh with a session does to you
 assert.equal(settings.volume,0.31);assert.equal(settings.music,0.17,'music must not fall back to the 0.55 default');
 // and no future setting may die the same silent death: every default key either crosses or is device-local
 const carried=new Set(Object.keys(cleanSettings({})));
 for(const k of Object.keys(defaultSettings()))assert.ok(carried.has(k)||DEVICE_KEYS.includes(k),`${k}: whitelist it in cleanSettings or declare it device-local`);
});
