// Title-menu social corner. The portrait is the survivor's actual wardrobe model, rendered once on change.
import {myFit,fitKey} from '../game/outfit.js';
import {myName} from '../net/coop.js';
import {onSave} from '../core/persistence.js';
import {cloudWords} from '../cloud/words.js';
import {socialWords} from './socialWords.js';
import {reliableTouchButtons} from './touchButtons.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class SocialDock {
 constructor({cloud,account,portrait,onProfile=null}){
  this.onProfile=onProfile; // (3.0x) a friend's name opens their full profile; your own name, yours
  this.cloud=cloud;this.account=account;this.portrait=portrait;this.el=document.getElementById('socialDock');this.canvas=this.el.querySelector('canvas');this.self=document.getElementById('btnAccount');this.list=this.el.querySelector('.social-list');
  this.el.addEventListener('click',e=>{const b=e.target.closest('[data-social]');if(!b)return;if(b.dataset.social==='add'){account.open('friends');setTimeout(()=>account.el.querySelector('[name=query]')?.focus(),50);}else if(b.dataset.social==='join')account.action('joinFriend',b.dataset.id);else if(b.dataset.id&&this.onProfile){const f=cloud.social.friends.find(x=>x.id===b.dataset.id);this.onProfile(b.dataset.id,f?.display_name||'');}else account.open('friends');});
  const me=this.el.querySelector('.social-name');if(me&&onProfile){me.dataset.profile='self';me.tabIndex=0;me.setAttribute('role','button');me.addEventListener('click',()=>onProfile(null));me.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();onProfile(null);}});}
  this.touch=reliableTouchButtons(this.el,()=>!this.el.hidden,()=>cloud.user?.id||'guest');this.off=cloud.on(()=>this.update());this.saveOff=onSave(e=>{if(e.section==='outfit')this.requestPortrait();});this.timer=setInterval(()=>this.update(),15000);this.update();
 }
 update(){const c=this.cloud,S=socialWords(),W=cloudWords();this.self.setAttribute('aria-label',S.profile);this.self.title=S.profile;this.el.querySelector('.social-name').textContent=myName();this.el.querySelector('.social-tag').textContent=c.user?c.profile?'@'+c.profile.handle:W.states[c.status]:S.guest;this.el.querySelector('.social-sync').className='social-sync '+c.status;this.el.querySelector('[data-social=add]').textContent=S.add;
  const incoming=c.social.requests.filter(r=>r.recipient_id===c.user?.id).length,invites=c.social.invites.length;this.el.querySelector('.social-heading').textContent=`${S.friends} · ${c.social.friends.length}`;
  const rows=c.social.friends.map(f=>{const state=f.seen_at&&Date.now()-Date.parse(f.seen_at)<90000?f.state:'offline';return`<div class="social-friend"><button type="button" data-social="view" data-action="social-view" data-id="${esc(f.id)}"><i class="presence-dot ${esc(state)}"></i><span>${esc(f.display_name)}<small>${esc(W.presence[state]||W.presence.offline)}</small></span></button>${state==='lobby'?`<button type="button" data-social="join" data-action="social-join" data-id="${esc(f.id)}">${S.join}</button>`:''}</div>`;}).join('');
  const html=(incoming||invites?`<button type="button" class="social-inbox" data-social="view" data-action="social-inbox">${S.requests}: ${incoming} · ${W.invites}: ${invites}</button>`:'')+(rows||`<p class="social-empty">${c.user?S.empty:S.signin}</p>`);if(html!==this.listKey){const top=this.list.scrollTop;this.list.innerHTML=html;this.list.scrollTop=top;this.listKey=html;}
  this.requestPortrait();
 }
 requestPortrait(){const key=fitKey(myFit());if(this.key===key||this.paintTimer)return;this.paintTimer=setTimeout(()=>{this.paintTimer=null;try{if(this.portrait(myFit(),this.canvas)!==false)this.key=key;}catch{/* the avatar remains a usable account button if WebGL is unavailable */}},220);}
 destroy(){this.off();this.saveOff();this.touch();clearInterval(this.timer);clearTimeout(this.paintTimer);}
}
