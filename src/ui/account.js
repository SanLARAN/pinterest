import {cloudWords,cloudError} from '../cloud/words.js';
import {scopeSnapshot} from '../cloud/snapshot.js';
import {getScope,isAccountScope} from '../core/persistence.js';
import {wallet} from '../game/wallet.js';
import {reliableTouchButtons} from './touchButtons.js';
import {socialWords} from './socialWords.js';
import {copyText} from './clipboard.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class AccountUI {
 constructor({cloud,canOpen=()=>true,canChange=()=>true,getRoom=()=>null,getInviteLink=()=>null,onJoin=()=>{},onNav=null,onProfile=null}){
  this.onNav=onNav;this.onProfile=onProfile; // (3.0x) the corner portrait opens the full profile; a name in a list opens theirs
  this.cloud=cloud;this.canOpen=canOpen;this.canChange=canChange;this.getRoom=getRoom;this.getInviteLink=getInviteLink;this.onJoin=onJoin;this.opened=false;this.view='profile';this.mode='login';this.draft={};this.edited=new Set();this.results=null;this.query='';this.busy=false;this.message='';this.error='';this.lastUser=cloud.user?.id||null;
  this.el=document.createElement('section');this.el.id='accountPanel';this.el.className='account-panel';this.el.hidden=true;this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-labelledby','cloudTitle');document.body.append(this.el);
  this.disposeTouch=reliableTouchButtons(this.el,()=>this.opened,()=>this.cloud.user?.id||'guest');
  this.nav=document.getElementById('btnAccount');this.lobbyNav=document.getElementById('btnLobbyFriends');this.nav?.addEventListener('click',()=>this.onNav?this.onNav():this.open());this.lobbyNav?.addEventListener('click',()=>this.open('invite'));
  this.el.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();this.close();}if(e.code==='Tab'){const a=[...this.el.querySelectorAll('button,input,textarea')].filter(x=>!x.disabled&&x.getClientRects().length),i=a.indexOf(document.activeElement);if(a.length){e.preventDefault();a[(i+(e.shiftKey?-1:1)+a.length)%a.length].focus();}}});this.el.addEventListener('keyup',e=>e.stopPropagation());
  this.el.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();if(!this.busy)this.submit(e.target);});
  this.el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||!b.dataset.action)return;if(b.dataset.action==='close'){this.close();return;}if(!this.busy)this.action(b.dataset.action,b.dataset.id);});
  this.el.addEventListener('input',e=>{if(e.target.name&&e.target.name!=='query')this.edited.add(e.target.name);if(e.target.name==='query'){this.query=e.target.value;clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>this.find(),450);}});
  this.off=cloud.on(()=>{const id=cloud.user?.id||null;if(id!==this.lastUser){this.lastUser=id;this.draft={};this.edited.clear();if(!id)this.mode='login';this.confirm=null;this.results=null;this.skipCapture=true;}if(!this.busy)this.scheduleRender();if(cloud.fromEmailLink&&!this.linkOpened&&this.canOpen()){this.linkOpened=true;if(cloud.lastError)this.error=cloudError(cloud.lastError);this.open('profile');}else if(cloud.recovery&&!this.recoveryDismissed&&!this.opened&&this.canOpen())this.open('profile');});
  this.el.addEventListener('pointerdown',()=>{this.pointerActive=true;});const released=()=>{this.pointerActive=false;setTimeout(()=>{if(this.renderPending)this.scheduleRender();},75);};this.el.addEventListener('pointerup',released);this.el.addEventListener('pointercancel',released);this.el.addEventListener('compositionstart',()=>{this.composing=true;});this.el.addEventListener('compositionend',()=>{this.composing=false;this.scheduleRender();});
  this.timer=setInterval(()=>{if(this.opened&&this.view==='friends')this.scheduleRender();},15000);this.render();
 }
 isOpen(){return this.opened;}
 open(view='profile'){
  if(!this.canOpen())return;this.previous=document.activeElement;this.scrollReset=true;this.view=view;this.opened=true;this.el.hidden=false;document.body.classList.add('account-open');if(this.cloud.recovery){this.mode='password';this.view='profile';}this.render();this.el.querySelector('[data-action="close"]')?.focus({preventScroll:true});this.cloud.ensure().catch(e=>{this.error=cloudError(e);this.render();});
 }
 close(){if(!this.opened)return;this.opened=false;this.confirm=null;this.clearPasswords();for(const k of['profile_name','profile_handle']){delete this.draft[k];this.edited.delete(k);}this.el.hidden=true;document.body.classList.remove('account-open');if(this.cloud.recovery)this.recoveryDismissed=true;(this.previous?.isConnected?this.previous:this.nav)?.focus({preventScroll:true});}
 capture(){if(this.skipCapture){this.skipCapture=false;return;}for(const input of this.el.querySelectorAll('input[name]'))if(input.name!=='query'&&(this.edited.has(input.name)||document.activeElement===input||input.type==='password'))this.draft[input.name]=input.value;}
 clearPasswords(){delete this.draft.password;delete this.draft.again;for(const input of this.el.querySelectorAll('input[type="password"]'))input.value='';}
 field(label,name,type='text',value='',attrs=''){return`<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;}
 button(action,text,id='',cls=''){return`<button type="button" data-action="${action}"${id?` data-id="${esc(id)}"`:''} class="${cls}"${this.busy?' disabled':''}>${esc(text)}</button>`;}
 status(){const c=this.cloud,W=cloudWords();return`<div class="cloud-state state-${esc(c.status)}"><i></i><span>${esc(W.states[c.status]||W.states.offline)}</span></div>`;}
 scheduleRender(){if(this.renderFrame)return;this.renderFrame=requestAnimationFrame(()=>{this.renderFrame=null;if(this.busy||this.pointerActive||this.composing){this.renderPending=true;return;}this.render();});}
 render(){
  if(this.opened&&(this.pointerActive||this.composing)){this.renderPending=true;return;}if(this.renderFrame){cancelAnimationFrame(this.renderFrame);this.renderFrame=null;}this.renderPending=false;
  const W=cloudWords(),c=this.cloud,count=c.social.invites.length+c.social.requests.filter(r=>r.recipient_id===c.user?.id).length;
  if(this.nav&&!this.nav.dataset.portrait){this.nav.innerHTML=`<i class="cloud-indicator ${esc(c.status)}"></i><span>${esc(W.nav)}</span>${count?`<b class="cloud-badge">${count}</b>`:''}`;this.nav.title=W.states[c.status]||W.states.guest;}
  if(this.lobbyNav)this.lobbyNav.textContent=socialWords().send;if(!this.opened)return;
  const scroll=this.scrollReset?0:(this.el.querySelector('.account-card')?.scrollTop||0);this.scrollReset=false;
  const active=document.activeElement,focus=active?.closest?.('#accountPanel')?{name:active.name,action:active.dataset?.action,id:active.dataset?.id,start:active.selectionStart,end:active.selectionEnd}:null;this.capture();
  let body=this.view==='invite'?this.inviteHTML(W):this.view==='friends'&&c.user?this.friendsHTML(W):c.user&&!c.recovery?this.profileHTML(W):this.authHTML(W);
  if(this.confirm)body=`<div class="cloud-confirm"><p>${esc(this.confirm.text)}</p>${this.button('confirm',W.yes,'','primary')}${this.button('cancelConfirm',W.no)}</div>`+body;
  this.el.innerHTML=`<div class="account-card"><header><div><h2 id="cloudTitle">${this.view==='invite'?socialWords().invite:W.title}</h2><p>${this.view==='invite'?socialWords().choose:W.sub}</p></div><button type="button" data-action="close" aria-label="${W.close}">×</button></header><nav class="account-tabs"${this.view==='invite'?' hidden':''}>${this.button('profile',W.profile,'',this.view==='profile'?'selected':'')}${this.button('friends',W.friends+(count?` · ${count}`:''),'',this.view==='friends'?'selected':'')}</nav>${this.status()}<div id="cloudMessage" role="status" aria-live="polite" class="cloud-message${this.error?' error':''}">${esc(this.error||this.message)}</div>${body}<footer><small>${esc(W.localCache)}</small>${this.button('close',W.close)}</footer></div>`;
  this.el.querySelector('.account-card').scrollTop=scroll;
  if(focus){const a=[...this.el.querySelectorAll('input,button')],next=a.find(e=>focus.name?e.name===focus.name:e.dataset.action===focus.action&&e.dataset.id===focus.id);if(next&&!next.disabled){next.focus({preventScroll:true});if(focus.name&&typeof focus.start==='number')try{next.setSelectionRange(focus.start,focus.end);}catch{}}}
 }
 authHTML(W){
  const recovery=this.cloud.recovery,mode=recovery?'password':this.mode,can=this.canChange();
  let fields='';if(mode!=='password')fields+=this.field(W.email,'email','email',this.draft.email||'','required maxlength="254" autocomplete="email"');
  if(mode==='register')fields+=this.field(W.name,'display_name','text',this.draft.display_name||'','required maxlength="14" autocomplete="nickname"');
  if(mode!=='recover')fields+=this.field(mode==='password'?W.password:W.pass,'password','password',this.draft.password||'',`required minlength="${mode==='login'?1:8}" maxlength="128" autocomplete="${mode==='login'?'current-password':'new-password'}"`);
  if(mode==='register'||mode==='password')fields+=this.field(W.passwordAgain,'again','password',this.draft.again||'','required minlength="8" maxlength="128" autocomplete="new-password"');
  const label=mode==='register'?W.register:mode==='recover'?W.reset:mode==='password'?W.setPassword:W.login;
  return`${mode!=='password'?`<button type="button" data-action="google" class="google-login"><b aria-hidden="true">G</b>${esc(socialWords().google)}</button><p class="auth-or">${esc(socialWords().or)}</p>`:''}${this.view==='friends'?`<p class="cloud-note">${W.loginFriends}</p>`:''}<form data-kind="${mode}" class="cloud-form">${fields}<button type="submit" class="primary"${this.busy||!can?' disabled':''}>${this.busy?'…':esc(label)}</button></form><p class="cloud-note">${can?W.verifyNote:W.leaveRoom}</p><div class="cloud-links">${this.button('login',W.login)}${this.button('register',W.register)}${this.button('recover',W.recover)}${this.button('resend',W.resend)}${this.button('mailHelp',socialWords().mail)}</div><div class="cloud-guest"><p>${W.guestNote}</p>${this.button('guest',W.guest)}</div>`;
 }
 profileHTML(W){
  const c=this.cloud,p=c.profile,can=this.canChange();let html=`<p class="cloud-email">${esc(c.user.email||'')}</p>`;
  if(c.importPending){const g=scopeSnapshot('guest');return html+`<div class="cloud-choice"><h3>${W.importTitle}</h3><p>${W.importNote}</p><p>${g.wallet.shards} ${W.shards} · ${g.wallet.owned.length} ${W.profile==='Profile'?'purchases':'покупок'} · ${g.payload.atlas.nights} ${W.profile==='Profile'?'nights':'ночей'}</p>${this.button('import',W.import,'','primary')}${this.button('fresh',W.fresh)}${this.button('logout',W.logout)}</div>`;}
  if(!p)return html+`<p>${esc(W.states.loading)}</p>${this.button('retry',W.retry)}${this.button('logout',W.logout)}`;
  if(c.pendingSnapshot&&!can)html+=`<p class="cloud-note">${W.scopeWait}</p>`;
  if(c.conflict)html+=`<div class="cloud-choice"><h3>${W.conflictTitle}</h3><p>${W.conflictNote}</p>${this.button('remote',W.remote)}${this.button('local',W.local)}</div>`;
  html+=`<div class="cloud-wallet"><b>${getScope()===c.user.id?wallet.shards:'—'}</b> ${W.shards}${c.pending?`<small>+${c.pending} · ${W.pending}</small>`:''}</div><form class="cloud-form profile-form" data-kind="profile">${this.field(W.name,'profile_name','text',this.draft.profile_name??p.display_name,'required maxlength="14" autocomplete="nickname"')}${this.field(W.handle,'profile_handle','text',this.draft.profile_handle??p.handle,'required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" autocomplete="off" spellcheck="false"')}<button type="submit"${this.busy||!can?' disabled':''}>${W.saveProfile}</button></form>${!can?`<p class="cloud-note">${W.leaveRoom}</p>`:''}<div class="cloud-links">${this.button('retry',W.retry)}${this.button('logout',W.logout)}</div>`;
  if(c.lastSync)html+=`<p class="cloud-note">${W.lastSync}: ${esc(new Date(c.lastSync).toLocaleString())}</p>`;return html;
 }
 inviteHTML(W){const S=socialWords(),c=this.cloud;return `<button type="button" data-action="copyInvite" class="invite-copy">${S.copy}</button>`+(c.user?`<section class="cloud-list"><h3>${S.friends}</h3>${c.social.friends.map(f=>this.row(f,this.button('invite',S.send,f.id),`<small>${W.presence[f.state]||W.presence.offline}</small>`)).join('')||`<p class="cloud-note">${S.empty}</p>`}</section>`:`<p class="cloud-note">${S.signin}</p>${this.button('inviteLogin',S.login)}`);}
 row(person,buttons,extra=''){return`<div class="cloud-person"><div>${this.onProfile&&person.id?`<button type="button" class="cloud-name" data-action="viewProfile" data-id="${esc(person.id)}">${esc(person.display_name)}</button>`:`<b>${esc(person.display_name)}</b>`}<span>@${esc(person.handle)}</span>${extra}</div><div class="cloud-row-actions">${buttons}</div></div>`;}
 friendsHTML(W){
  const c=this.cloud,u=c.user.id,s=c.social;let html=`<form data-kind="search" class="cloud-search"><label>${W.search}<input name="query" value="${esc(this.query)}" maxlength="21" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="@putnik" /></label><button type="submit"${this.busy?' disabled':''}>${W.find}</button></form><p class="cloud-note">${W.searchHint}</p>`;
  if(this.results){html+=`<div class="cloud-results">${this.results.length?this.results.map(p=>this.row(p,s.friends.some(f=>f.id===p.id)?esc(W.list):s.requests.some(r=>r.sender_id===p.id||r.recipient_id===p.id)?esc(W.outgoing):this.button('add',W.add,p.id))).join(''):`<p>${W.nothing}</p>`}</div>`;}
  const section=(title,rows)=>`<section class="cloud-list"><h3>${title}</h3>${rows||`<p class="cloud-note">${W.empty}</p>`}</section>`;
  html+=section(W.invites,s.invites.map(i=>this.row(i,this.button('acceptInvite',W.join,i.id,'primary')+this.button('declineInvite',W.decline,i.id),`<small>${esc(i.room_code)}</small>`)).join(''));
  html+=section(W.incoming,s.requests.filter(r=>r.recipient_id===u).map(r=>this.row(r,this.button('accept',W.accept,r.id,'primary')+this.button('decline',W.decline,r.id))).join(''));
  html+=section(W.list,s.friends.map(f=>{const fresh=f.seen_at&&Date.now()-Date.parse(f.seen_at)<90000,state=fresh?f.state:'offline';return this.row(f,(state==='lobby'?this.button('joinFriend',W.join,f.id):'')+(this.getRoom()?this.button('invite',W.invite,f.id):'')+this.button('remove',W.remove,f.id)+this.button('block',W.block,f.id),`<small class="friend-state ${esc(state)}">${esc(W.presence[state]||W.presence.offline)}</small>`);}).join(''));
  html+=section(W.outgoing,s.requests.filter(r=>r.sender_id===u).map(r=>this.row(r,this.button('cancel',W.cancel,r.id))).join(''));
  html+=section(W.blocked,s.blocked.map(r=>this.row(r,this.button('unblock',W.unblock,r.id))).join(''));return html;
 }
 async perform(fn){if(this.busy)return;this.capture();this.busy=true;this.error='';this.message='';this.render();try{await fn();}catch(e){this.error=cloudError(e);}finally{this.busy=false;this.clearPasswords();this.render();}}
 submit(form){const kind=form.dataset.kind,v=Object.fromEntries(new FormData(form));if(kind==='search'){this.find();return;}this.perform(async()=>{
  const W=cloudWords();if(kind==='profile'){await this.cloud.updateProfile(v.profile_handle,v.profile_name);delete this.draft.profile_name;delete this.draft.profile_handle;this.edited.delete('profile_name');this.edited.delete('profile_handle');this.skipCapture=true;this.message=W.profileSaved;return;}
  if((kind==='register'||kind==='password')&&v.password!==v.again)throw new Error('password_mismatch');
  await this.cloud.authenticate(kind,{email:v.email,password:v.password,name:v.display_name});if(kind==='register')this.message=W.sent;if(kind==='recover')this.message=W.recoverySent;if(kind==='password')this.message=W.passwordSaved;
 });}
 async find(){clearTimeout(this.searchTimer);const query=this.query.trim().replace(/^@/,'').toLowerCase();if(!/^[a-z0-9_]{3,20}$/.test(query)){this.results=null;this.render();return;}const ticket=this.searchTicket=(this.searchTicket||0)+1;try{const result=await this.cloud.search(query);if(ticket===this.searchTicket){this.results=result;this.error='';this.scheduleRender();}}catch(e){if(ticket===this.searchTicket){this.error=cloudError(e);this.render();}}}
 // a toast's own buttons: accept the invitation (or turn it down) without opening the panel
 async toastInvite(id, accept) {
  if (!id || this.busy) return false;
  this.busy = true;
  try {
   const room = await this.cloud.answerInvite(id, !!accept);
   if (!accept) return true;
   if (!room || !/^[A-HJ-NP-Z2-9]{4,8}$/.test(room.room_code)) throw new Error('not_in_lobby');
   await this.onJoin(room);
   return true;
  } catch (e) {
   this.error = cloudError(e);
   this.render();
   return false;
  } finally {
   this.busy = false;
  }
 }
 action(action,id,confirmed=false){
  const W=cloudWords();if(['profile','friends'].includes(action)){this.capture();this.scrollReset=true;this.view=action;this.render();if(action==='friends'&&this.cloud.user)this.cloud.refreshSocial().catch(e=>{this.error=cloudError(e);this.render();});return;}
  if(['login','register','recover'].includes(action)){this.clearPasswords();this.mode=action;this.message='';this.error='';this.view='profile';this.render();return;}
  if(action==='cancelConfirm'){this.confirm=null;this.render();return;}
  if(action==='viewProfile'&&this.onProfile){const s=this.cloud.social,p=[...s.friends,...s.requests,...s.blocked,...(this.results||[])].find(x=>x.id===id||x.sender_id===id);this.close();this.onProfile(id,p?.display_name||'');return;}
  if(action==='confirm'){const c=this.confirm;this.confirm=null;if(c)this.action(c.action,c.id,true);return;}
  if(!confirmed&&(['remove','block'].includes(action)||['acceptInvite','joinFriend'].includes(action)&&this.getRoom())){this.confirm={action,id,text:action==='block'?W.confirmBlock:action==='remove'?W.confirmRemove:W.confirmJoin};this.render();return;}
  this.perform(async()=>{
   if(action==='google'){await this.cloud.googleLogin();return;}
   if(action==='mailHelp'){this.message=socialWords().mailHelp;return;}
   if(action==='copyInvite'){const link=this.getInviteLink();if(!link)throw new Error('not_in_lobby');await copyText(link);this.message=socialWords().copied;return;}
   if(action==='inviteLogin'){this.view='profile';this.mode='login';return;}
   if(action==='guest'){if(this.cloud.user||isAccountScope())await this.cloud.logout();this.close();return;}
   if(action==='logout'){await this.cloud.logout();return;}
   if(action==='retry'){await this.cloud.retry();return;}
   if(action==='resend'){const email=this.draft.email;if(!email)throw new Error('invalid_credentials');await this.cloud.authenticate('resend',{email});this.message=W.sent;return;}
   if(action==='import'||action==='fresh'){await this.cloud.initialize(action==='import');return;}
   if(action==='remote'||action==='local'){await this.cloud.resolveConflict(action);for(const k of['profile_name','profile_handle']){delete this.draft[k];this.edited.delete(k);}this.skipCapture=true;return;}
   if(action==='invite'){await this.cloud.invite(id);this.message=W.inviteSent;return;}
   if(action==='declineInvite'){await this.cloud.answerInvite(id,false);return;}
   if(action==='acceptInvite'||action==='joinFriend'){const room=action==='acceptInvite'?await this.cloud.answerInvite(id,true):await this.cloud.joinFriend(id);if(!/^[A-HJ-NP-Z2-9]{4,8}$/.test(room.room_code))throw new Error('not_in_lobby');await this.onJoin(room);return;}
   const map={add:'request',accept:'accept',decline:'decline',cancel:'cancel',remove:'remove',block:'block',unblock:'unblock'};if(map[action])await this.cloud.friendAction(map[action],['accept','decline','cancel'].includes(action)?null:id,['accept','decline','cancel'].includes(action)?id:null);
  });
 }
 destroy(){this.off();clearInterval(this.timer);clearTimeout(this.searchTimer);this.disposeTouch();if(this.renderFrame)cancelAnimationFrame(this.renderFrame);this.el.remove();}
}
