// Cloud work is event-driven/debounced. Never called from a render/physics/network frame.
import {getScope,isAccountScope,onSave,readMeta,writeMeta,writeJSON,hydrate,newSaveId} from '../core/persistence.js';
import {capturePayload,scopeSnapshot,activateSnapshot,cleanPayload,cleanWallet} from './snapshot.js';
import {wallet,applyWallet,setPurchaseBackend} from '../game/wallet.js';
import {rewardRows,removeReward,recoverAbandonedRewards,pendingRewards} from './rewards.js';
import {createCloudClient,authRedirect,hasStoredSession,isAuthReturn,readAuthProviders,SUPABASE_URL} from './client.js';
const emptySocial=()=>({friends:[],requests:[],invites:[],blocked:[]});
const err=e=>e instanceof Error?e:Object.assign(new Error(e?.message||'cloud_error'),{code:e?.code,status:e?.status});
export class CloudController {
 constructor({clientFactory=createCloudClient,providers=readAuthProviders,navigate=url=>globalThis.location.assign(url),canApply=()=>true,onApplied=()=>{},getPresence=()=>({state:'online',room:null,strategy:'default'}),onNotice=()=>{}}={}){
  this.providers=providers;this.navigate=navigate;this.clientFactory=clientFactory;this.canApply=canApply;this.onApplied=onApplied;this.getPresence=getPresence;this.onNotice=onNotice;
  this.user=null;this.profile=null;this.client=null;this.ready=false;this.status=isAccountScope()?'cached':'guest';this.epoch=0;this.version=0;this.serverVersion=0;this.dirty=false;this.revision=0;this.social=emptySocial();this.listeners=new Set();this.clientId=newSaveId();this.lastSync=null;this.lastError=null;this.pendingSnapshot=null;this.importPending=false;this.conflict=null;this.recovery=false;this.disposed=false;this.fromEmailLink=isAuthReturn();
  this.unsubscribe=onSave(e=>this.changed(e));setPurchaseBackend(id=>this.purchase(id));
 }
 on(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners){try{fn(this);}catch{}}}
 start(){
  if(this.timer)return;
  this.timer=setInterval(()=>{if(this.user){this.heartbeat().catch(()=>{});this.refresh().catch(()=>{});this.flushRewards().catch(()=>{});this.flush().catch(()=>{});}},45000);
  this.safeTimer=setInterval(()=>{if(this.pendingSnapshot||this.pendingGuest)this.safePoint();},1000);
  this.online=()=>{if(this.user){this.retry().catch(()=>{});}};
  this.focus=()=>{if(typeof document==='undefined'||!document.hidden){this.safePoint();this.online();}};
  if(typeof window!=='undefined'){window.addEventListener('online',this.online);window.addEventListener('focus',this.focus);}
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.focus);
  if(isAccountScope()||hasStoredSession())this.ensure().catch(e=>this.failed(e));
 }
 async ensure(){
  if(this.client)return this.client;if(this.creating)return this.creating;
  this.creating=(async()=>{
   const client=await this.clientFactory();if(this.disposed)throw new Error('disposed');this.client=client;
   const sub=client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){this.recovery=true;this.emit();}
    // Supabase auth callbacks hold the SDK's storage lock: don't await another SDK call inside one.
    setTimeout(()=>{if(!this.disposed)this.sessionChanged(session).catch(e=>this.failed(e));},0);
   });this.authSubscription=sub.data?.subscription;
   const{data,error}=await client.auth.getSession();if(error)throw err(error);await this.sessionChanged(data.session);return client;
  })();try{return await this.creating;}finally{this.creating=null;}
 }
 async sessionChanged(session){
  const next=session?.user||null,uid=next?.id||null;
  if(uid===this.user?.id){this.user=next;if(this.loading)return this.loading;if(this.profile||!uid)return;}
  else if(!uid&&!this.user&&getScope()==='guest'){this.status='guest';this.emit();return;}
  this.epoch++;const epoch=this.epoch;this.stopChannel();this.saving=false;this.savePromise=null;this.rewardsBusy=false;this.rewardPromise=null;this.pendingGuest=false;this.refreshPromise=null;this.refreshPending=false;this.user=next;if(!uid)this.recovery=false;this.profile=null;this.ready=false;this.importPending=false;this.conflict=null;this.pendingSnapshot=null;this.social=emptySocial();this.socialPrimed=false;this.lastError=null;this.dirty=false;this.revision=0;this.serverVersion=0;
  if(!uid){this.status='guest';this.pendingGuest=true;this.safePoint();this.emit();return;}
  this.status='loading';this.emit();
  this.loading=(async()=>{const snapshot=await this.rpc('hush_bootstrap');if(epoch!==this.epoch)return;this.receive(snapshot);recoverAbandonedRewards(uid);await this.refreshSocial();this.subscribe();this.heartbeat().catch(()=>{});this.flushRewards().catch(()=>{});})();
  try{await this.loading;}catch(e){if(epoch===this.epoch)this.failed(e);throw e;}finally{if(epoch===this.epoch)this.loading=null;}
 }
 async rpc(name,params={}){
  const epoch=this.epoch,owner=this.user?.id;if(!owner||!this.client)throw new Error('not_authenticated');
  if(params.p_owner&&params.p_owner!==owner)throw new Error('wrong_account');
  const{data,error}=await this.client.rpc(name,params);
  if(epoch!==this.epoch||owner!==this.user?.id||this.disposed)throw new Error('stale_session');if(error)throw err(error);return data;
 }
 failed(error){const e=err(error);if(['stale_session','disposed'].includes(e.message))return;this.lastError=e.message;this.status=this.user||isAccountScope()?'offline':'guest';this.emit();if(this.user&&!this.retryTimer){this.retryDelay=Math.min(60000,(this.retryDelay||1000)*2);this.retryTimer=setTimeout(()=>{this.retryTimer=null;this.retry().catch(()=>{});},this.retryDelay);}}
 receive(snapshot){
  if(!snapshot||snapshot.profile?.id!==this.user?.id)throw new Error('wrong_account');
  if(snapshot.save?.initialized&&Number(snapshot.save.version)<this.serverVersion){this.acceptWallet(snapshot.wallet);return;}
  if(snapshot.save?.initialized)cleanPayload(snapshot.save.payload); // Reject newer schemas before queuing a safe-point apply.
  this.serverVersion=Math.max(this.serverVersion,Number(snapshot.save?.version)||0);
  this.profile=snapshot.profile;writeJSON('hush.cloud-profile.v1',this.profile,null,this.user.id);this.lastError=null;this.retryDelay=1000;
  if(!snapshot.save?.initialized){this.importPending=true;this.ready=false;this.status='import';if(getScope()!=='guest'&&this.canApply()){const g=scopeSnapshot('guest');activateSnapshot('guest',g.payload,g.wallet);this.onApplied();}this.emit();return;}
  if(this.ready&&getScope()===this.user.id&&Number(snapshot.save.version)===this.version){this.acceptWallet(snapshot.wallet);this.lastSync=snapshot.save.updated_at;this.status=this.conflict?'conflict':this.dirty?'pending':'synced';this.emit();return;}
  this.pendingSnapshot=snapshot;this.status='waiting';this.safePoint();this.emit();
 }
 safePoint(choice=null){
  if(!this.canApply())return false;
  if(this.pendingGuest){this.pendingGuest=false;const g=scopeSnapshot('guest');activateSnapshot('guest',g.payload,g.wallet);this.ready=false;this.status='guest';this.onApplied();return true;}
  const s=this.pendingSnapshot||this.conflict?.remote;if(!s||s.profile.id!==this.user?.id)return false;
  const owner=this.user.id,meta=this.ready&&getScope()===owner?{version:this.version,dirty:this.dirty,rev:this.revision}:readMeta(owner);
  const local=getScope()===owner?capturePayload():scopeSnapshot(owner).payload,remote=cleanPayload(s.save.payload),version=Number(s.save.version);
  const conflict=meta.dirty&&Number(meta.version)!==version;
  const coins=this.ready&&getScope()===owner&&wallet.version>Number(s.wallet.version)?cleanWallet(wallet):cleanWallet(s.wallet);
  if(conflict&&!choice){
   if(getScope()!==owner){activateSnapshot(owner,local,coins);this.onApplied();}else this.acceptWallet(coins);
   this.ready=true;this.version=Number(meta.version);this.dirty=true;this.revision=meta.rev||0;this.conflict={remote:s,local};this.pendingSnapshot=null;this.status='conflict';this.emit();return false;
  }
  const useLocal=choice==='local'||(meta.dirty&&choice!=='remote'),payload=useLocal?local:remote;
  activateSnapshot(owner,payload,coins);this.ready=true;this.importPending=false;this.version=version;this.dirty=!!useLocal;this.revision=meta.rev||0;this.profile=s.profile;this.pendingSnapshot=null;this.conflict=null;this.lastSync=s.save.updated_at;this.status=this.dirty?'pending':'synced';
  writeMeta({version:this.version,dirty:this.dirty,rev:this.revision,lastSync:this.lastSync},owner);this.onApplied();this.emit();if(this.dirty)this.scheduleSave();return true;
 }
 changed({section,owner}){
  if(!isAccountScope(owner))return;
  if(section==='reward'||section==='reward-acked'){this.emit();if(section==='reward')this.scheduleRewards();return;}
  if(section==='wallet')return;
  if(owner===this.user?.id&&getScope()===owner&&this.ready){this.dirty=true;this.revision++;writeMeta({version:this.version,dirty:true,rev:this.revision,lastSync:this.lastSync},owner);this.status=this.conflict?'conflict':'pending';this.scheduleSave();}
  else{const m=readMeta(owner);writeMeta({...m,dirty:true,rev:(m.rev||0)+1},owner);}
  this.emit();
 }
 scheduleSave(){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.flush().catch(e=>this.failed(e)),1500);}
 flush(){if(this.savePromise)return this.savePromise;let job;job=this.flushOnce().finally(()=>{if(this.savePromise===job)this.savePromise=null;});this.savePromise=job;return job;}
 async flushOnce(){
  if(this.saving||!this.user||!this.ready||getScope()!==this.user.id||this.conflict||!this.dirty)return false;
  const owner=this.user.id,epoch=this.epoch,rev=this.revision,version=this.version,payload=capturePayload();this.saving=true;this.status='saving';this.emit();
  try{
   const r=await this.rpc('hush_save',{p_owner:owner,p_version:version,p_payload:payload});
   if(r.conflict){this.conflict={remote:r.snapshot,local:capturePayload()};this.status='conflict';return false;}
   this.version=Number(r.snapshot.save.version);this.serverVersion=Math.max(this.serverVersion,this.version);this.dirty=rev!==this.revision;this.lastSync=r.snapshot.save.updated_at;this.profile=r.snapshot.profile;this.acceptWallet(r.snapshot.wallet);writeMeta({version:this.version,dirty:this.dirty,rev:this.revision,lastSync:this.lastSync},owner);this.status=this.dirty?'pending':'synced';if(this.dirty)this.scheduleSave();return true;
  }catch(e){this.failed(e);throw e;}finally{if(epoch===this.epoch){this.saving=false;this.emit();if(this.refreshPending){this.refreshPending=false;clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.refresh().catch(()=>{}),100);}}}
 }
 acceptWallet(value){if(!this.user||getScope()!==this.user.id)return;const v=cleanWallet(value);if(v.version>=wallet.version)hydrate(()=>applyWallet(v));}
 async initialize(importGuest){
  if(!this.canApply())throw new Error('leave_room');const owner=this.user?.id;if(!owner)throw new Error('not_authenticated');
  const g=importGuest?scopeSnapshot('guest'):{payload:cleanPayload({}),wallet:null};g.payload.settings.name=this.profile.display_name;
  const legacy=g.wallet?{shards:g.wallet.shards,total:g.wallet.total,owned:g.wallet.owned}:null;
  const s=await this.rpc('hush_initialize',{p_owner:owner,p_payload:g.payload,p_legacy:legacy});writeMeta({version:Number(s.save.version),dirty:false,rev:0},owner);this.receive(s);
 }
 async resolveConflict(choice){if(!['local','remote'].includes(choice)||!this.conflict)return;this.pendingSnapshot=this.conflict.remote;if(!this.safePoint(choice))throw new Error('leave_room');if(choice==='local')await this.flush();}
 refresh(){if(this.saving){this.refreshPending=true;return Promise.resolve(false);}if(this.refreshPromise)return this.refreshPromise;let job;job=this.refreshOnce().finally(()=>{if(this.refreshPromise===job)this.refreshPromise=null;});this.refreshPromise=job;return job;}
 async refreshOnce(){if(!this.user||!this.client)return;try{this.receive(await this.rpc('hush_snapshot'));await this.refreshSocial();}catch(e){this.failed(e);throw e;}}
 async retry(){if(!this.user){await this.ensure();return;}try{await this.refresh();await this.flush();await this.flushRewards();await this.heartbeat();}catch(e){this.failed(e);}}
 async purchase(product){
  const owner=getScope();if(!this.user||owner!==this.user.id||!this.ready||this.conflict)throw new Error(this.conflict?'cloud_conflict':'cloud_offline');
  await this.flushRewards();const s=await this.rpc('hush_buy',{p_owner:owner,p_product:product});if(getScope()!==owner)throw new Error('stale_session');this.acceptWallet(s.wallet);this.emit();return true;
 }
 scheduleRewards(delay=200){clearTimeout(this.rewardTimer);this.rewardTimer=setTimeout(()=>this.flushRewards().catch(e=>this.failed(e)),delay);}
 flushRewards(){if(this.rewardPromise)return this.rewardPromise;let job;job=this.flushRewardsOnce().finally(()=>{if(this.rewardPromise===job)this.rewardPromise=null;});this.rewardPromise=job;return job;}
 async flushRewardsOnce(){
  if(this.rewardsBusy||!this.user||!this.ready||getScope()!==this.user.id||this.importPending)return;const owner=this.user.id,epoch=this.epoch;this.rewardsBusy=true;
  try{for(const row of rewardRows(owner)){
   await this.rpc('hush_begin_run',{p_owner:owner,p_nonce:row.nonce});
   if(!row.closed)continue;
   const r=await this.rpc('hush_finish_run',{p_owner:owner,p_nonce:row.nonce,p_earned:row.earned,p_summary:row.summary||{}});
   if(!r.ok){this.scheduleRewards(Math.max(1000,Number(r.retry_after||5)*1000));continue;}
   this.acceptWallet(r.snapshot.wallet);removeReward(owner,row.nonce);
  }}catch(e){this.failed(e);throw e;}finally{if(epoch===this.epoch){this.rewardsBusy=false;this.emit();}}
 }
 async googleLogin(){
  if(!this.canApply())throw new Error('leave_room');const c=await this.ensure();if(this.user)return;
  const epoch=this.epoch,info=await this.providers();if(epoch!==this.epoch)throw new Error('stale_session');
  if(!info.external?.google)throw new Error('google_setup_required');
  const{data,error}=await c.auth.signInWithOAuth({provider:'google',options:{redirectTo:authRedirect(),skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});if(error)throw err(error);
  const url=new URL(data.url);if(url.origin!==new URL(SUPABASE_URL).origin||url.pathname!=='/auth/v1/authorize'||url.searchParams.get('provider')!=='google')throw new Error('google_redirect');
  if(epoch!==this.epoch)throw new Error('stale_session');if(!this.canApply())throw new Error('leave_room');this.navigate(url.href);
 }
 async authenticate(kind,{email,password,name}={}){
  if(!this.canApply())throw new Error('leave_room');const c=await this.ensure();let r;
  if(kind==='register')r=await c.auth.signUp({email,password,options:{emailRedirectTo:authRedirect(),data:{display_name:name}}});
  else if(kind==='login')r=await c.auth.signInWithPassword({email,password});
  else if(kind==='recover')r=await c.auth.resetPasswordForEmail(email,{redirectTo:authRedirect()});
  else if(kind==='resend')r=await c.auth.resend({type:'signup',email,options:{emailRedirectTo:authRedirect()}});
  else if(kind==='password')r=await c.auth.updateUser({password});else throw new Error('bad_action');
  if(r.error)throw err(r.error);if(kind==='password'){this.recovery=false;this.emit();}if(r.data?.session)await this.sessionChanged(r.data.session);return r.data;
 }
 async logout(){
  if(!this.canApply())throw new Error('leave_room');this.flush().catch(()=>{});this.flushRewards().catch(()=>{});this.heartbeat('offline').catch(()=>{});
  const c=await this.ensure();const{error}=await c.auth.signOut({scope:'local'});
  // auth-js removes the LOCAL session even when server revocation is offline. Do not restore it.
  if(error){const{data}=await c.auth.getSession();if(data?.session)throw err(error);}
  await this.sessionChanged(null);
 }
 async updateProfile(handle,name){if(!this.canApply())throw new Error('leave_room');const owner=this.user?.id,epoch=this.epoch;await this.flush();if(owner!==this.user?.id||epoch!==this.epoch)throw new Error('stale_session');if(this.conflict)throw new Error('cloud_conflict');const s=await this.rpc('hush_profile_update',{p_owner:owner,p_handle:handle,p_name:name});writeMeta({version:Number(s.save.version),dirty:false,rev:0},owner);this.dirty=false;this.receive(s);}
 async search(query){return await this.rpc('hush_search',{p_query:query});}
 async friendAction(action,target=null,request=null){this.social=await this.rpc('hush_friend_action',{p_owner:this.user.id,p_action:action,p_target:target,p_request:request});this.subscribe();this.emit();}
 async refreshSocial(){if(!this.user)return;const before=this.social,old=before.friends.map(f=>f.id).join(',');const after=await this.rpc('hush_social');this.social=after;
  const requests=new Set(before.requests.map(r=>r.id)),invites=new Set(before.invites.map(r=>r.id)),friends=new Set(before.friends.map(f=>f.id));
  for(const item of after.requests.filter(r=>r.recipient_id===this.user.id&&!requests.has(r.id)).slice(0,3))this.onNotice({type:'friend_request',item});
  for(const item of after.invites.filter(r=>!invites.has(r.id)).slice(0,3))this.onNotice({type:'room_invite',item});
  if(this.socialPrimed)for(const item of after.friends.filter(f=>!friends.has(f.id)).slice(0,2))this.onNotice({type:'friend_accept',item});this.socialPrimed=true;
  if(!this.channel||old!==after.friends.map(f=>f.id).join(','))this.subscribe();this.emit();}
 async heartbeat(state=null){if(!this.user||!this.client)return;const p=this.getPresence();await this.rpc('hush_heartbeat',{p_owner:this.user.id,p_client:this.clientId,p_state:state||p.state,p_room:state==='offline'?null:p.room,p_strategy:p.strategy||'default'});}
 presenceChanged(){clearTimeout(this.presenceTimer);this.presenceTimer=setTimeout(()=>this.heartbeat().catch(()=>{}),500);}
 async invite(friend){await this.heartbeat();const r=await this.rpc('hush_send_invite',{p_owner:this.user.id,p_client:this.clientId,p_friend:friend});return r;}
 async answerInvite(id,accept){const r=await this.rpc('hush_answer_invite',{p_owner:this.user.id,p_invite:id,p_accept:accept});await this.refreshSocial();return r;}
 async joinFriend(id){return this.rpc('hush_join_friend',{p_owner:this.user.id,p_friend:id});}
 stopChannel(){if(this.channel&&this.client)Promise.resolve(this.client.removeChannel(this.channel)).catch(()=>{});this.channel=null;}
 subscribe(){
  if(!this.client||!this.user)return;const ids=this.social.friends.map(f=>f.id).sort(),key=this.user.id+':'+ids.join(',');if(this.channel&&this.channelKey===key)return;this.stopChannel();this.channelKey=key;
  const epoch=this.epoch,refresh=()=>{if(epoch!==this.epoch)return;clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.refresh().catch(()=>{}),500);};
  const presence=e=>{if(epoch!==this.epoch)return;const row=e.new,f=this.social.friends.find(f=>f.id===row?.user_id);if(!f)return;
   // An unchanged heartbeat only extends the local lease: don't download saves/graphs for every friend.
   if(f.state===row.state&&(f.room_code||null)===(row.room_code||null)){if(Date.parse(row.seen_at)>Date.parse(f.seen_at||0))f.seen_at=row.seen_at;this.emit();}
   else{clearTimeout(this.socialTimer);this.socialTimer=setTimeout(()=>this.refreshSocial().catch(()=>{}),500);}
  };
  this.subscriptionSeq=(this.subscriptionSeq||0)+1;
  let ch=this.client.channel(`hush-social:${this.user.id}:${this.clientId}:${this.subscriptionSeq}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'hush_events',filter:`user_id=eq.${this.user.id}`},e=>{if(epoch!==this.epoch)return;refresh();});
  if(ids.length)for(const event of['INSERT','UPDATE'])ch=ch.on('postgres_changes',{event,schema:'public',table:'hush_presence',filter:`user_id=in.(${ids.join(',')})`},presence);
  this.channel=ch;ch.subscribe();
 }
 destroy(){this.disposed=true;this.epoch++;this.unsubscribe();this.authSubscription?.unsubscribe();this.stopChannel();for(const key of['timer','safeTimer','saveTimer','rewardTimer','retryTimer','presenceTimer','refreshTimer','socialTimer']){clearTimeout(this[key]);clearInterval(this[key]);}if(typeof window!=='undefined'){window.removeEventListener('online',this.online);window.removeEventListener('focus',this.focus);}if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.focus);setPurchaseBackend(null);this.listeners.clear();}
 get pending(){return pendingRewards();}
}
