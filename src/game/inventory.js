// Diegetic backpack + a bridge to the field simulations. World claims and dropped parcels are host
// authoritative. Claims are retained in the heartbeat: a lost event cannot eat or duplicate a pickup.
import * as THREE from 'three';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { geometryOf } from './uaz.js';
import { buildFlareGun } from './objectives.js';
import { BAG_SIZE, BAG_KINDS, BAG_LIMIT, LOOT_KIND, fitsPocket, cleanPockets, cleanParcel, iconSvg } from './backpackData.js';

const round = (v) => Math.round(v * 100) / 100;
const KEYS = { stones: 'bagStones', glow: 'bagGlow', torch: 'torchName', flare: 'flareGun', battery: 'bagBattery', tape: 'tapeName', crowbar: 'crowbarName' };
export const bagName = (kind) => t(KEYS[kind] || 'bagEmpty');

function parcelGeometry(kind) {
  const b = new MeshBuilder();
  if (kind === 'flare') buildFlareGun(b, new THREE.Matrix4());
  else if (kind === 'flareAmmo') {
    for(const x of [-.025,.025]) { b.place(x,.05,0); b.cylinder(6,.02,.02,.1,KIND.SHARD); b.place(x,.004,0); b.cylinder(6,.022,.022,.01,KIND.METAL); }
  } else if (kind === 'battery') {
    b.place(0,.035,0,0,0,Math.PI/2); b.cylinder(6,.022,.022,.07,KIND.METAL);
    b.place(-.042,.035,0,0,0,Math.PI/2); b.cylinder(6,.009,.009,.008,KIND.SHARD);
  } else if (kind === 'glow') {
    b.place(0,.025,0,Math.PI/2); b.cylinder(6,.014,.014,.18,KIND.SHARD);
    b.place(0,.025,.09); b.box(.024,.024,.018,KIND.METAL);
  } else {
    for(let i=0;i<3;i++) { b.place((i-1)*.075,.035,(i%2)*.055,0,i*.8,Math.PI/2); b.cylinder(6,.035,.035,.035,KIND.METAL); }
  }
  return geometryOf(b.toArrays());
}

export class Backpack {
  constructor(game) {
    this.g = game;
    this.geo = Object.fromEntries(['stones','glow','flare','flareAmmo','battery'].map(k => [k, parcelGeometry(k)]));
    this.geo.torch = game.torch.geo;
    this.heldViews = {};
    this.el = document.createElement('section');
    this.el.id = 'backpack'; this.el.hidden = true;
    this.el.setAttribute('role','dialog'); this.el.setAttribute('aria-modal','true');
    this.el.innerHTML = `<div class="bag-shade"></div><div class="bag-wrap"><div class="bag-handle"></div><div class="bag-strap a"></div><div class="bag-strap b"></div><div class="bag-shell"><div class="bag-flap"><span class="bag-stamp">HUSH / FIELD EQUIPMENT</span><h2></h2><span class="bag-serial">04 · PERSONAL KIT</span><i class="bag-buckle a"></i><i class="bag-buckle b"></i></div><div class="bag-pockets">${Array.from({length:BAG_SIZE},(_,i)=>`<button type="button" class="bag-pocket" data-slot="${i}"><span class="bag-num">0${i+1}</span><span class="bag-item"></span><span class="bag-item-name"></span><span class="bag-item-count"></span></button>`).join('')}</div><p class="bag-tip"></p><div class="bag-bottom"><span class="bag-capacity"></span><button type="button" class="bag-close"></button></div></div><p class="bag-world"></p></div><div class="bag-menu" hidden><span></span><button type="button" data-action="equip"></button><button type="button" data-action="drop"></button></div>`;
    document.body.append(this.el);
    this.pockets = [...this.el.querySelectorAll('[data-slot]')];
    this.menu = this.el.querySelector('.bag-menu');
    this.el.addEventListener('contextmenu', e => e.preventDefault());
    for(const button of this.pockets) {
      button.addEventListener('contextmenu', e => { e.preventDefault(); this.context(+button.dataset.slot); });
      button.addEventListener('click', () => this.context(+button.dataset.slot));
    }
    this.el.querySelector('.bag-close').addEventListener('click', () => this.close());
    const shade=this.el.querySelector('.bag-shade');
    // Touch BAG opens on pointerdown and hides that control. Its eventual click can be retargeted
    // onto the shade: only dismiss if this gesture actually STARTED on the shade.
    shade.addEventListener('pointerdown',()=>{this.shadePressed=this.uiReady;});
    shade.addEventListener('pointercancel',()=>{this.shadePressed=false;});
    shade.addEventListener('click',()=>{const dismiss=this.shadePressed;this.shadePressed=false;if(dismiss)this.close();});
    this.el.querySelector('[data-action="equip"]').addEventListener('click', () => this.equip(this.menuSlot));
    this.el.querySelector('[data-action="drop"]').addEventListener('click', () => this.drop(this.menuSlot));
    this.el.addEventListener('keydown', e => {
      if(!this.opened) return;
      if(e.code === 'Escape' && !this.menu.hidden) { e.stopPropagation(); this.menu.hidden = true; this.pockets[this.menuSlot]?.focus(); }
      // Keep keyboard focus in the open bag, without letting Tab raise the watch behind it.
      if(e.code === 'Tab') {
        e.preventDefault(); e.stopPropagation();
        const buttons = [...this.el.querySelectorAll('button')].filter(b => !b.disabled && b.offsetParent !== null);
        const i = buttons.indexOf(document.activeElement), d = e.shiftKey ? -1 : 1;
        buttons[(i+d+buttons.length)%buttons.length]?.focus();
      }
    });
    this.reset();
  }

  reset() {
    this.close(false); this.progress = 0; this.equipped = null; this.equipT = 0;
    this.slots = ['stones','glow',null,null]; this.cells = 0;
    this.world = new Map(); this.claims = new Map(); this.applied = new Set(); this.parcelApplied = new Set(); this.droppedApplied = new Set();
    this.remoteSlots = new Map(); this.pending = new Map(); this.seq = 0; this.epoch = Date.now().toString(36);
    this.claimPending = null; this.beat = 0; this.summaryKey = ''; this.wasAlive = true;
    this.renderKey = ''; this.uiReady = false;
    if(this.meshes) for(const m of this.meshes.values()) this.g.scene.remove(m);
    this.meshes = new Map();
  }
  get active() { return this.opened || this.progress > .01; }
  get blocked() { return this.active || this.pending.size > 0; }
  owns(k) {
    const g=this.g;
    return k==='stones' ? g.player.stones>0 : k==='glow' ? g.glows.count>0 || !!g.glows.held : k==='torch' ? g.torch.has : k==='flare' ? !!g.player.hasFlare || g.player.flares>0 : k==='battery' ? this.cells>0 : k==='tape' ? !!g.tools.tapeHeld : k==='crowbar' ? g.tools.hasCrowbar : false;
  }
  count(k) {
    const g=this.g;
    return k==='stones'?g.player.stones:k==='glow'?g.glows.count+(g.glows.held?1:0):k==='battery'?this.cells:k==='flare'?g.player.flares|0:1;
  }
  canReceive(k, announce=false, upgrade=false) {
    let ok = fitsPocket(this.slots,k);
    if(ok && upgrade && k==='flare' && !this.g.player.hasFlare) return true;
    if(ok && this.owns(k)) {
      if(['stones','glow','battery','flare'].includes(k)) ok = this.count(k) < BAG_LIMIT[k];
      else if(k==='torch') ok = this.g.torch.charge < .99;
      else ok=false;
    }
    if(!ok && announce) this.full();
    return ok;
  }
  full() { this.g.hud.popup(t('bagFull'),'amber'); }
  reserve(pid, kind, upgrade=false) {
    if(!kind) return true; // currency is not a usable item
    if(pid===this.g.player.id) return this.canReceive(kind,false,upgrade);
    const slots=this.remoteSlots.get(pid) || ['stones','glow',null,null];
    if(!fitsPocket(slots,kind)) return false;
    if(!slots.includes(kind)) slots[slots.indexOf(null)] = kind;
    this.remoteSlots.set(pid,slots);
    return true;
  }
  receiveSlots(pid,a) {
    const slots=cleanPockets(a);
    if(slots && this.g.remotes.has(pid)) this.remoteSlots.set(pid,slots);
  }
  reconcile() {
    for(let i=0;i<BAG_SIZE;i++) if(this.slots[i] && !this.owns(this.slots[i])) this.slots[i]=null;
    for(const k of BAG_KINDS) if(this.owns(k) && !this.slots.includes(k)) {
      const empty=this.slots.indexOf(null);
      if(empty>=0) this.slots[empty]=k;
    }
    if(this.equipped && !this.slots.includes(this.equipped)) this.equipped=null;
    const key=JSON.stringify(this.slots);
    if(key!==this.summaryKey) {
      this.summaryKey=key;
      if(this.g.sync) this.g.sync.send('ip',this.slots.slice());
    }
  }

  toggle() { if(this.opened) this.close(); else this.open(); }
  open() {
    const g=this.g;
    if(!g.player.alive || !['play','morning','dawn'].includes(g.state) || g.inputMuted) return false;
    if(g.player.carrying || g.escape.held || g.escape.mySeat>=0 || g.cabinets.busy || g.expedition.onTower) { g.handsFull(); return false; }
    this.opened=true; this.uiReady=false; this.shadePressed=false; this.el.hidden=false; this.el.classList.remove('ready');
    this.menu.hidden=true; this.reconcile(); this.renderKey=''; this.render();
    g.input.uiMode=true; g.input.reset(); g.charge.active=false; g.pingQueue=null;
    g.tools.cancelRecord();
    if(g.torch.on) g.torch.toggle();
    g.objectives.closeNote(); g.hud.setHint(null); g.hud.setUse(null);
    document.body.classList.add('bag-open'); g.input.exitLock();
    if(g.audio.ready) g.audio.paper();
    return true;
  }
  close(lock=true) {
    const had=this.opened;
    this.opened=false; this.uiReady=false; this.menu.hidden=true; this.el.classList.remove('ready');
    document.body.classList.remove('bag-open');
    this.g.input.uiMode=false;
    if(had) {
      this.g.input.reset();
      if(lock && !this.g.inputMuted && this.g.player.alive) this.g.input.requestLock(true);
    }
    this.el.hidden=true;
    if (this.el.contains(document.activeElement)) document.activeElement.blur();
  }
  context(i) {
    const kind=this.slots[i];
    if(!kind || !this.opened || !this.uiReady || this.pending.size) return;
    this.menuSlot=i; this.menu.hidden=false;
    this.menu.querySelector('span').textContent=bagName(kind);
    this.menu.querySelector('[data-action="equip"]').textContent=t(this.equipped===kind?'bagStow':'bagEquip');
    this.menu.querySelector('[data-action="drop"]').textContent=t('bagDrop');
    const r=this.pockets[i].getBoundingClientRect();
    this.menu.style.left=`${Math.max(12,Math.min(innerWidth-232,r.x+r.width*.4))}px`;
    this.menu.style.top=`${Math.max(12,Math.min(innerHeight-150,r.y+r.height*.5))}px`;
    this.menu.querySelector('button').focus();
  }
  equip(i) {
    const kind=this.slots[i]; if(!kind || this.pending.size) return;
    if(this.g.torch.on) this.g.torch.toggle();
    this.g.tools.cancelRecord();
    this.equipped=this.equipped===kind?null:kind; this.equipT=.32;
    this.close();
  }
  primary() {
    const g=this.g;
    if(this.lowerWatch() || this.blocked || this.equipT>0 || !g.player.alive || g.inputMuted || !['play','dawn'].includes(g.state)) return;
    if(g.escape.held) { g.escape.throwHeld(); return; }
    if(g.player.carrying || g.cabinets.busy || g.expedition.onTower || g.escape.mySeat>=0) return;
    const k=this.equipped;
    if(k==='stones') g.throwStone();
    else if(k==='glow') g.glows.use();
    else if(k==='torch') g.torch.toggle();
    else if(k==='flare') g.fireFlare();
    else if(k==='tape') g.tools.play();
    else if(k==='battery') {
      if(!g.torch.has) { g.hud.popup(t('bagBatteryNoTorch'),'dim'); return; }
      if(g.torch.charge>=.99) { g.hud.popup(t('bagBatteryFull'),'dim'); return; }
      if(this.cells>0) { this.cells--; g.torch.addBattery(); }
    } else if(k==='crowbar') g.hud.popup(t('bagPryHint'),'dim');
    this.reconcile();
  }
  lowerWatch() { const g=this.g; if(g.fieldView?.watch>.12) { g.input.peekHeld=false; g.input.peekTouchUntil=0; return true; } return false; }
  secondary() { if(!this.lowerWatch() && !this.blocked && this.equipped==='tape' && this.equipT<=0) this.g.tools.record(); }

  parcel(kind) {
    const d={kind,n:this.count(kind)};
    if(kind==='torch') d.charge=this.g.torch.charge;
    if(kind==='flare') d.gun=!!this.g.player.hasFlare;
    return cleanParcel(d);
  }
  clear(kind) {
    const g=this.g;
    if(kind==='stones') g.player.stones=0;
    if(kind==='glow') g.glows.count=0;
    if(kind==='torch') { g.torch.on=false; g.torch.has=false; g.torch.charge=0; }
    if(kind==='flare') g.setFlares(0,false);
    if(kind==='battery') this.cells=0;
    if(this.equipped===kind) this.equipped=null;
  }
  gain(d) {
    const g=this.g,k=d.kind;
    if(k==='stones') g.player.stones=Math.min(BAG_LIMIT.stones,g.player.stones+d.n);
    if(k==='glow') g.glows.count=Math.min(BAG_LIMIT.glow,g.glows.count+d.n);
    if(k==='battery') this.cells=Math.min(BAG_LIMIT.battery,this.cells+d.n);
    if(k==='torch') { g.torch.has=true; g.torch.charge=Math.min(1,g.torch.charge+d.charge); g.stats.torch=1; }
    if(k==='flare') g.setFlares(Math.min(BAG_LIMIT.flare,(g.player.flares|0)+d.n),!!g.player.hasFlare||d.gun);
    this.reconcile();
  }
  drop(i,death=false) {
    const g=this.g,kind=this.slots[i]; if(!kind || (!death && this.pending.size)) return false;
    if(death) for(const [nonce,req] of this.pending) if(req.kind===kind) { req.death=true; req.retry=0; if(!g.auth) g.coop.toHost('ibd',[nonce,req.parcel,1]); return true; }
    if(kind==='tape' || kind==='crowbar') {
      const it=g.tools.items.find(it=>it.kind===kind&&it.owner===g.player.id&&it.state==='held');
      if(!it) return false;
      if(death) { if(g.auth) g.tools.dropFor(g.player.id,g.player.x,g.player.z); }
      else g.tools.request('drop',it.i,it.clip);
      this.menu.hidden=true; return true;
    }
    if(kind==='glow' && g.glows.held) {
      const s=g.glows.held; g.glows.dropFor(g.player.id,g.player.x,g.player.z);
      if(g.sync) g.sync.ev('gd',s.id,round(s.x),round(s.z));
    }
    const parcel=this.parcel(kind);
    if(!parcel) { this.reconcile(); this.renderKey=''; return true; }
    const nonce=`${this.epoch}.${++this.seq}`;
    this.pending.set(nonce,{kind,parcel,death,retry:2}); this.menu.hidden=true;
    if(g.auth) this.hostDrop(g.player.id,nonce,parcel,death);
    else g.coop.toHost('ibd',[nonce,parcel,death?1:0]);
    return true;
  }
  hostDrop(pid,nonce,raw,death=false) {
    const g=this.g,p=g.playerById(pid),d=cleanParcel(raw);
    const bad=()=>{ if(g.auth && p && typeof nonce==='string' && nonce.length<=60) this.reject(pid,nonce); return false; };
    if(!g.auth || !p || typeof nonce!=='string' || nonce.length>60 || !d) return bad();
    const id=`${pid}:${nonce}`,old=this.world.get(id);
    if(old) { if(g.sync) g.sync.ev('ibp',old); else this.applyParcel(old); return true; } // retry the ACK, never spawn twice
    if(!['play','morning','dying','dawn'].includes(g.state)) return bad();
    if(!death && (!p.alive || p.carrying || g.escape.load(pid) || g.escape.seatOf(pid)>=0 || g.cabinets.locked(pid))) return bad();
    if(death && p.alive && !(pid===g.player.id&&g.state==='dying')) return bad();
    if([...this.world.values()].filter(q=>!q.taker).length>=96) { this.reject(pid,nonce); return false; }
    const f=p.forward(); let x=p.x,z=p.z;
    for(const dist of [.65,.35,0]) { const xx=p.x+f.x*dist,zz=p.z+f.z*dist; if(g.world.col.free(xx,zz,.18)) { x=xx;z=zz;break; } }
    const item={id,from:pid,nonce,...d,x:round(x),y:round(g.tools.groundHeight(x,z)+.025),z:round(z),yaw:round(p.yaw),rev:1,taker:null};
    this.applyParcel(item); if(g.sync) g.sync.ev('ibp',item);
    return true;
  }
  reject(pid,nonce) {
    if(pid===this.g.player.id) { this.pending.delete(nonce); this.full(); }
    else this.g.sync?.send('ibr',nonce,pid);
  }
  hostPick(pid,id) {
    const g=this.g,p=g.playerById(pid),d=this.world.get(id);
    if(!g.auth || !p?.alive || !d || d.taker || p.carrying || g.escape.load(pid) || g.cabinets.locked(pid) || Math.hypot(p.x-d.x,p.z-d.z)>2.5 || Math.abs(p.y-d.y)>2 || g.world.losBlocked(p.x,p.y+p.eyeCur,p.z,d.x,d.y+.1,d.z,.2)) return false;
    if(!this.reserve(pid,d.kind)) { if(pid===g.player.id) this.full(); return false; }
    const next={...d,taker:pid,rev:d.rev+1}; this.applyParcel(next); if(g.sync) g.sync.ev('ibp',next); return true;
  }
  applyParcel(d) {
    if(!d || typeof d.id!=='string' || d.id.length>150 || typeof d.from!=='string' || typeof d.nonce!=='string' || !cleanParcel(d) || ![d.x,d.y,d.z,d.yaw,d.rev].every(Number.isFinite) || Math.abs(d.x)>310 || Math.abs(d.z)>310 || Math.abs(d.y)>100 || (d.taker!==null && typeof d.taker!=='string')) return;
    const old=this.world.get(d.id); if(old && old.rev>=d.rev) return;
    this.world.set(d.id,{...d});
    const pending=this.pending.get(d.nonce);
    if(d.from===this.g.player.id && !this.droppedApplied?.has(d.id)) {
      (this.droppedApplied ||= new Set()).add(d.id); this.clear(pending?.kind || d.kind); this.pending.delete(d.nonce);
    }
    if(d.taker===this.g.player.id && !this.parcelApplied.has(d.id)) {
      this.parcelApplied.add(d.id); this.gain(d);
      if(this.g.audio.ready) this.g.audio.cabinetItem('nuts');
      this.g.hud.popup(`+ ${bagName(d.kind)}`,'amber');
    }
    let mesh=this.meshes.get(d.id);
    if(!mesh && !d.taker) { mesh=new THREE.Mesh(this.geo[d.kind==='flare'&&!d.gun?'flareAmmo':d.kind],this.g.world.material); mesh.frustumCulled=false; this.g.scene.add(mesh); this.meshes.set(d.id,mesh); }
    if(mesh) { mesh.visible=!d.taker; mesh.position.set(d.x,d.y,d.z); mesh.rotation.set(0,d.yaw,0); }
    this.reconcile();
  }
  consider(fn) {
    if(this.blocked) return;
    for(const d of this.world.values()) if(!d.taker && Math.abs(d.y-this.g.player.y)<1.6) fn(d,d.x,d.z,1.7,'bagDrop');
  }
  interact(d,pressed,T) {
    const ok=this.canReceive(d.kind);
    this.g.hud.setUse(ok?`${T('useTake')} ${d.kind==='flare'&&!d.gun?t('bagCartridges'):bagName(d.kind)}`:t('bagFull'),0,ok);
    if(pressed && ok) { if(this.g.auth) this.hostPick(this.g.player.id,d.id); else this.g.coop.toHost('ibq',d.id); }
  }

  claim(source,a,b=0) {
    if(this.claimPending) return false;
    const g=this.g;
    let kind=source==='torch'?'torch':source==='gun'?'flare':LOOT_KIND[g.cabinets.list[a]?.items[b]?.kind];
    if(kind && !this.canReceive(kind,true,source==='gun')) return false;
    this.claimPending={source,a,b,left:2};
    if(g.auth) return this.hostClaim(g.player.id,source,a,b);
    g.coop.toHost('ibc',[source,a,b]); return true;
  }
  hostClaim(pid,source,a,b=0) {
    const g=this.g,p=g.playerById(pid); let kind=null,loot=null,obj,spot;
    const fail=()=>{ if(pid===g.player.id) this.claimPending=null; return false; };
    if(!g.auth || !p?.alive || !Number.isInteger(a) || !Number.isInteger(b) || p.carrying || g.escape.load(pid) || g.cabinets.locked(pid) || g.escape.seatOf(pid)>=0) return fail();
    if(source==='torch') { obj=g.torch.items[a]; if(!obj || obj.taken) return fail(); kind='torch'; spot=obj; }
    else if(source==='cabinet') { const c=g.cabinets.list[a]; obj=c?.items[b]; if(!c || !obj || obj.taken || !c.opened || c.locked) return fail(); kind=LOOT_KIND[obj.kind]; loot=obj.kind; spot={x:c.front.x,y:c.spec.y,z:c.front.z}; }
    else if(source==='gun') { obj=g.objectives.bodies[a]; if(!obj?.gun?.visible) return fail(); kind='flare'; spot=obj; }
    else return fail();
    if(Math.hypot(p.x-spot.x,p.z-spot.z)>2.8 || Math.abs(p.y-spot.y)>2 || g.world.losBlocked(p.x,p.y+p.eyeCur,p.z,spot.x,spot.y+.45,spot.z,.22) || (kind && !this.reserve(pid,kind,source==='gun'))) return fail();
    const id=`${source}:${a}:${b}`; if(this.claims.has(id)) return fail();
    const claim={id,pid,source,a,b,kind,loot};
    this.applyClaim(claim); if(g.sync) g.sync.ev('ibg',claim); return true;
  }
  applyClaim(d) {
    if(!d || typeof d.pid!=='string' || !['torch','cabinet','gun'].includes(d.source) || !Number.isInteger(d.a) || !Number.isInteger(d.b) || d.id!==`${d.source}:${d.a}:${d.b}`) return;
    if(this.claims.has(d.id) && this.applied.has(d.id)) return;
    if(d.source==='torch') { const it=this.g.torch.items[d.a]; if(!it) return; this.g.torch._taken(it); }
    if(d.source==='cabinet') { const c=this.g.cabinets.list[d.a]; if(!c?.items[d.b]) return; this.g.cabinets._taken(c,d.b); }
    if(d.source==='gun') { const b=this.g.objectives.bodies[d.a]; if(!b?.gun) return; b.gun.visible=false; }
    this.claims.set(d.id,d);
    if(d.pid===this.g.player.id && !this.applied.has(d.id)) {
      this.applied.add(d.id); this.claimPending=null;
      if(d.source==='torch') {
        const g=this.g; g.torch.has=true; g.torch.charge=Math.min(1,g.torch.charge+.5+g.torch.spare); g.torch.spare=0; g.stats.torch=1;
        if(g.audio.ready) g.audio.cabinetItem('flare'); g.hud.popup(t('torchGot'),'amber');
      }
      if(d.source==='cabinet') this.g.cabinets._give(this.g.cabinets.list[d.a].items[d.b].kind);
      if(d.source==='gun') this.g.onFlareFound(true);
      this.reconcile();
    } else this.applied.add(d.id);
  }
  netState() { return { d:[...this.world.values()],c:[...this.claims.values()] }; }
  netMerge(s) {
    if(!s || !Array.isArray(s.d) || !Array.isArray(s.c)) return;
    for(const d of s.d.slice(0,384)) this.applyParcel(d);
    for(const c of s.c.slice(0,96)) this.applyClaim(c);
  }

  update(dt) {
    const g=this.g;
    const alive=g.player.alive && g.state!=='dying';
    if(!alive && this.wasAlive && ['play','dying'].includes(g.state)) {
      this.close(false); g.tools.cancelRecord();
      for(let i=0;i<BAG_SIZE;i++) this.drop(i,true);
    }
    this.wasAlive=alive;
    if(this.opened && (!alive || g.inputMuted || !['play','morning','dawn'].includes(g.state))) this.close(false);
    this.progress=Math.max(0,Math.min(1,this.progress+(this.opened?1:-1)*dt/(this.opened?.7:.32)));
    this.equipT=Math.max(0,this.equipT-dt);
    if(this.opened && this.progress>.94 && !this.uiReady && !g.input.locked && !document.pointerLockElement) { this.uiReady=true; this.el.classList.add('ready'); this.pockets.find(b=>!b.disabled)?.focus({preventScroll:true}); }
    if(this.claimPending && (this.claimPending.left-=dt)<=0) this.claimPending=null;
    if(g.player.carrying || g.escape.held) { if(g.torch.on) g.torch.toggle(); }
    if(g.online && !g.auth) for(const [nonce,req] of this.pending) { req.retry-=dt; if(req.retry<=0) { req.retry=2; g.coop.toHost('ibd',[nonce,req.parcel,req.death?1:0]); } }
    this.reconcile();
    document.body.classList.toggle('item-equipped', !!this.equipped);
    document.body.classList.toggle('equipped-tape', this.equipped === 'tape');
    if(this.opened) this.render();
    this.beat-=dt;
    if(this.beat<=0) { this.beat=3; if(g.sync) g.sync.send('ip',this.slots.slice()); }
  }
  render() {
    const g=this.g;
    const key=[t('bagTitle'),this.equipped,this.slots.join(','),...BAG_KINDS.map(k=>this.count(k)),g.torch.charge.toFixed(2),g.tools.tapeHeld?.charges,this.pending.size,!!g.glows.held,!!g.player.hasFlare].join('|');
    if(key===this.renderKey) return; this.renderKey=key;
    this.el.setAttribute('aria-label',t('bagTitle'));
    this.el.querySelector('h2').textContent=t('bagTitle');
    this.el.querySelector('.bag-tip').textContent=t(g.input.touch?'bagTipT':'bagTip');
    this.el.querySelector('.bag-world').textContent=t('bagWorld');
    this.el.querySelector('.bag-capacity').textContent=`${this.slots.filter(Boolean).length} / ${BAG_SIZE} · ${t('bagSlots')}`;
    this.el.querySelector('.bag-close').textContent=`${t('bagClose')}  [ I / ESC ]`;
    this.slots.forEach((kind,i)=>{
      const b=this.pockets[i]; b.classList.toggle('empty',!kind); b.classList.toggle('equipped',!!kind&&kind===this.equipped);
      b.disabled=!!this.pending.size;
      b.querySelector('.bag-item').innerHTML=kind?iconSvg(kind):'<i>+</i>';
      const name=kind==='flare'&&!g.player.hasFlare?t('bagCartridges'):bagName(kind);
      b.querySelector('.bag-item-name').textContent=kind?name:t('bagEmpty');
      let sub=kind?`${this.count(kind)}${['stones','glow','battery','flare'].includes(kind)?` / ${BAG_LIMIT[kind]}`:''}`:'';
      if(kind==='torch') sub=`${Math.ceil(g.torch.charge*100)}%`;
      if(kind==='tape') sub=`${g.tools.tapeHeld?.charges||0} / 2`;
      if(kind==='glow' && g.glows.held) sub+=` · ${t('bagLit')}`;
      if(kind && kind===this.equipped) sub+=` · ${t('bagInHands')}`;
      b.querySelector('.bag-item-count').textContent=sub;
      b.setAttribute('aria-label',`${i+1}: ${kind?name:t('bagEmpty')}${sub?`, ${sub}`:''}`);
    });
  }
}
