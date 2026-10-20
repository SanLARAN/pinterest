// Diegetic backpack + a bridge to the field simulations. World claims and dropped parcels are host
// authoritative. Claims are retained in the heartbeat: a lost event cannot eat or duplicate a pickup.
import * as THREE from 'three';
import { t, getLang } from '../core/i18n.js';
import {TORCH} from './torch.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { geometryOf } from './uaz.js';
import { buildFlareGun } from './objectives.js';
import { BAG_SIZE, BAG_KINDS, BAG_LIMIT, BAG_TABS, LOOT_KIND, fitsPocket, cleanPockets, cleanParcel, iconSvg } from './backpackData.js';

const round = (v) => Math.round(v * 100) / 100;
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEYS = { stones: 'bagStones', glow: 'bagGlow', torch: 'torchItem', flare: 'flareGun', battery: 'bagBattery', tape: 'tapeItem', crowbar: 'crowbarName', map: 'partMapName', syringe: 'bagSyringe' };
export const bagName = (kind) => t(KEYS[kind] || 'bagEmpty');

function parcelGeometry(kind) {
  const b = new MeshBuilder();
  if(kind==='map'){b.place(0,.016,0);b.box(.24,.014,.19,KIND.BONE);for(const x of[-.07,.04]){b.place(x,.026,0);b.box(.005,.003,.17,KIND.WOOD);}}
  else if (kind === 'flare') buildFlareGun(b, new THREE.Matrix4());
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
    this.geo = Object.fromEntries(['stones','glow','flare','flareAmmo','battery','map','syringe'].map(k => [k, parcelGeometry(k)]));
    this.geo.torch = game.torch.geo;
    this.heldViews = {};
    this.el = document.createElement('section');
    this.el.id = 'backpack'; this.el.hidden = true;
    this.el.setAttribute('role','dialog'); this.el.setAttribute('aria-modal','true');
    this.tab = 'all';
    this.sel = null;
    this.el.innerHTML = `
      <div class="bp-veil"></div>
      <div class="bp-frame">
        <header class="bp-head">
          <div class="bp-kicker">HUSH · FIELD KIT</div>
          <h2 class="bp-title"></h2>
          <div class="bp-cap"><span class="bp-cap-k"></span><b class="bp-cap-v"></b></div>
        </header>
        <nav class="bp-tabs" role="tablist"></nav>
        <div class="bp-main">
          <div class="bp-gridwrap"><div class="bp-grid" role="listbox"></div><p class="bp-tip"></p></div>
          <aside class="bp-side">
            <figure class="bp-fig" aria-hidden="true">
              <span class="bp-fig-glow"></span>
              <svg class="bp-body" viewBox="0 0 220 340">
                <g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
                  <path d="M64 112q-6 2-6 18v92q0 10 9 10h86q9 0 9-10v-92q0-16-6-18" fill="#1b2118"/>
                  <path d="M64 112q-6 2-6 18v92q0 10 9 10h86q9 0 9-10v-92q0-16-6-18"/>
                  <path d="M70 128h80M70 216h80" stroke="#39422e" stroke-width="1.6"/>
                  <rect x="88" y="138" width="44" height="28" rx="3" fill="#242b1f" stroke="#3f4934"/>
                  <path d="M94 214l-7 92h26l1-92Z" fill="#2b3225"/>
                  <path d="M126 214l7 92h-26l-1-92Z" fill="#232a1e"/>
                  <path d="M84 306h28M110 306h28" stroke="#0e120c" stroke-width="8"/>
                  <path d="M84 92q26-12 52 0l6 92q1 22-10 34H88q-11-12-10-34Z" fill="#414c36"/>
                  <path d="M110 96v122M90 148h40M90 180h40" stroke="#2c3526" stroke-width="2"/>
                  <path d="M92 90q18 12 36 0l-2 16q-16 9-32 0Z" fill="#7d4534"/>
                  <path d="M86 100q-15 15-14 43l1 33q0 7 7 7l9-3 2-33 8-30Z" fill="#3a432f"/>
                  <path d="M134 100q15 15 14 43l-1 33q0 7-7 7l-9-3-2-33-8-30Z" fill="#3a432f"/>
                  <path d="M100 188q10 8 20 0"/>
                  <circle cx="110" cy="66" r="21" fill="#4a5540"/>
                  <path d="M89 66q21-26 42 0Z" fill="#1f2519"/>
                  <path d="M92 60q18-12 36 0" stroke="#1f2519" stroke-width="4"/>
                </g>
              </svg>
              <span class="bp-held" aria-hidden="true"></span>
            </figure>
            <div class="bp-card">
              <h3 class="bp-name"></h3>
              <p class="bp-latin"></p>
              <p class="bp-desc"></p>
              <div class="bp-chips"></div>
              <div class="bp-actions">
                <button type="button" data-bp="equip"></button>
                <button type="button" data-bp="drop"></button>
              </div>
            </div>
          </aside>
        </div>
        <footer class="bp-foot">
          <span class="bp-hint"></span>
          <span class="bp-keys"></span>
          <button type="button" class="bp-close"></button>
        </footer>
        <div class="bp-drop" hidden><b></b><span></span></div>
      </div>`;
    document.body.append(this.el);
    this.grid = this.el.querySelector('.bp-grid');
    this.tabsEl = this.el.querySelector('.bp-tabs');
    this.nameEl = this.el.querySelector('.bp-name');
    this.latinEl = this.el.querySelector('.bp-latin');
    this.descEl = this.el.querySelector('.bp-desc');
    this.chipsEl = this.el.querySelector('.bp-chips');
    this.heldEl = this.el.querySelector('.bp-held');
    this.capEl = this.el.querySelector('.bp-cap-v');
    this.equipBtn = this.el.querySelector('[data-bp="equip"]');
    this.dropBtn = this.el.querySelector('[data-bp="drop"]');
    this.dropZone = this.el.querySelector('.bp-drop');
    this.tabsEl.innerHTML = BAG_TABS.map((x) => `<button type="button" role="tab" data-tab="${x.id}"></button>`).join('');
    this.el.addEventListener('contextmenu', (e) => e.preventDefault());
    this.tabsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      this.tab = b.dataset.tab;
      this.renderKey = '';
      this.render();
      this.grid.querySelector('.bp-slot.owned')?.focus({ preventScroll: true });
    });
    this.grid.addEventListener('click', (e) => {
      if (performance.now() < (this._skipClickUntil || 0)) return;
      const b = e.target.closest('.bp-slot[data-kind]');
      if (!b || b.disabled) return;
      const kind = b.dataset.kind;
      const now = performance.now();
      if (this._lastClick && this._lastClick.kind === kind && now - this._lastClick.t < 380) {
        this._lastClick = null;
        this.equipKind(kind);
        return;
      }
      this._lastClick = { kind, t: now };
      this.sel = kind;
      this.renderKey = '';
      this.render();
    });
    this.grid.addEventListener('pointerdown', (e) => this._dragStart(e));
    this.equipBtn.addEventListener('click', () => this.equipKind(this.sel));
    this.dropBtn.addEventListener('click', () => this.dropKind(this.sel));
    this.el.querySelector('.bp-close').addEventListener('click', () => this.close());
    const shade = this.el.querySelector('.bp-veil');
    // Touch BAG opens on pointerdown and hides that control. Its eventual click can be retargeted
    // onto the veil: only dismiss if this gesture actually STARTED on the veil.
    shade.addEventListener('pointerdown', () => { this.shadePressed = this.uiReady; });
    shade.addEventListener('pointercancel', () => { this.shadePressed = false; });
    shade.addEventListener('click', () => { const dismiss = this.shadePressed; this.shadePressed = false; if (dismiss) this.close(); });
    this.el.addEventListener('keydown', (e) => {
      if (!this.opened) return;
      if (e.code === 'Escape') { e.stopPropagation(); this.close(); return; }
      const list = [...this.grid.querySelectorAll('.bp-slot[data-kind]:not([disabled])')];
      const at = list.indexOf(document.activeElement);
      const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 }[e.code];
      if (step) {
        e.preventDefault(); e.stopPropagation();
        const next = at < 0 ? 0 : (at + step + list.length) % list.length;
        list[next]?.focus({ preventScroll: true });
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (this.sel) this.equipKind(this.sel);
        return;
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        if (this.sel) this.dropKind(this.sel);
        return;
      }
      // Keep keyboard focus in the open bag, without letting Tab raise the watch behind it.
      if (e.code === 'Tab') {
        e.preventDefault(); e.stopPropagation();
        const buttons = [...this.el.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null);
        const i = buttons.indexOf(document.activeElement), d = e.shiftKey ? -1 : 1;
        buttons[(i + d + buttons.length) % buttons.length]?.focus();
      }
    });
    this.reset();
  }

  reset() {
    this.close(false); this.progress = 0; this.equipped = null; this.equipT = 0;
    this.slots = ['stones','glow',null,null]; this.cells = 0; this.syringes = 0;
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
    return k==='stones' ? g.player.stones>0 : k==='glow' ? g.glows.count>0 || !!g.glows.held : k==='torch' ? g.torch.has : k==='flare' ? !!g.player.hasFlare || g.player.flares>0 : k==='battery' ? this.cells>0 : k==='tape' ? !!g.tools.tapeHeld : k==='crowbar' ? g.tools.hasCrowbar : k==='map'?!!g.partMap?.has:k==='syringe'?this.syringes>0:false;
  }
  count(k) {
    const g=this.g;
    return k==='stones'?g.player.stones:k==='glow'?g.glows.count+(g.glows.held?1:0):k==='battery'?this.cells:k==='flare'?g.player.flares|0:k==='syringe'?this.syringes:1;
  }
  canReceive(k, announce=false, upgrade=false) {
    let ok = fitsPocket(this.slots,k);
    if(ok && upgrade && k==='flare' && !this.g.player.hasFlare) return true;
    if(ok && this.owns(k)) {
      if(['stones','glow','battery','flare','syringe'].includes(k)) ok = this.count(k) < BAG_LIMIT[k];
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
  // on a desktop the pack opens in the round (see ui/bag3d.js); the flat grid is the touch fallback
  get round() { return !!this.g.bag3d && (!this.g.input.touch || innerWidth >= 720); } // a narrow phone keeps the flat grid; landscape and tablets get the real pack
  open() {
    const g=this.g;
    if(!g.player.alive || !['play','morning','dawn','training'].includes(g.state) || g.inputMuted) return false;
    if(g.player.carrying || g.escape.held || g.escape.mySeat>=0 || g.cabinets.busy || g.expedition.onTower) { g.handsFull(); return false; }
    this.opened=true; this.uiReady=false; this.shadePressed=false; this.el.hidden=false; this.el.classList.remove('ready');
    this.reconcile(); this.sel=this.equipped||null; this.renderKey=''; this.render();
    g.input.uiMode=true; g.input.reset(); g.charge.active=false; g.pingQueue=null;
    g.tools.cancelRecord();g.partMap?.fold(true);
    if(g.torch.on) g.torch.toggle();
    g.objectives.closeNote(); g.hud.setHint(null); g.hud.setUse(null);
    document.body.classList.add('bag-open');
    g.input.exitLock();
    if(g.audio.ready) g.audio.paper();
    return true;
  }
  close(lock=true) {
    const had=this.opened;
    this.opened=false; this.uiReady=false; this.el.classList.remove('ready');
    document.body.classList.remove('bag-open','bag-3d','bag-dragging');
    if(this.g.bag3d) this.g.bag3d.close();
    this.g.input.uiMode=false;
    if(had) {
      this.g.input.reset();
      if(lock && !this.g.inputMuted && this.g.player.alive) this.g.input.requestLock(true);
    }
    this.el.hidden=true;
    if (this.el.contains(document.activeElement)) document.activeElement.blur();
  }
  equip(i) {
    const kind=this.slots[i]; if(!kind || this.pending.size) return;
    if(this.g.torch.on) this.g.torch.toggle();
    this.g.tools.cancelRecord();this.g.partMap?.fold(true);
    this.equipped=this.equipped===kind?null:kind; this.equipT=.32;
    this.close();
  }
  primary() {
    const g=this.g;
    if(this.lowerWatch() || this.blocked || this.equipT>0 || !g.player.alive || g.inputMuted || !['play','dawn','training'].includes(g.state)) return;
    if(g.escape.held) { g.escape.throwHeld(); return; }
    if(g.player.carrying || g.cabinets.busy || g.expedition.onTower || g.escape.mySeat>=0) return;
    const k=this.equipped;
    if(k==='stones') g.throwStone();
    else if(k==='glow') g.glows.use();
    else if(k==='torch') g.torch.toggle();
    else if(k==='flare') g.fireFlare();
    else if(k==='tape') g.tools.play();
    else if(k==='map')g.partMap.toggle();
    else if(k==='battery') {
      if(!g.torch.has) { g.hud.popup(t('bagBatteryNoTorch'),'dim'); return; }
      if(g.torch.charge>=.99) { g.hud.popup(t('bagBatteryFull'),'dim'); return; }
      if(this.cells>0) { this.cells--; g.torch.addBattery(); }
    } else if(k==='syringe') g.rescue.startJab();
    else if(k==='crowbar') g.hud.popup(t('bagPryHint'),'dim');
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
    if(kind==='syringe') this.syringes=0;
    if(kind==='map'&&g.partMap){g.partMap.has=false;g.partMap.fold(true);}
    if(this.equipped===kind) this.equipped=null;
  }
  gain(d) {
    const g=this.g,k=d.kind;
    if(k==='stones') g.player.stones=Math.min(BAG_LIMIT.stones,g.player.stones+d.n);
    if(k==='glow') g.glows.count=Math.min(BAG_LIMIT.glow,g.glows.count+d.n);
    if(k==='map')g.partMap.has=true;
    if(k==='battery') this.cells=Math.min(BAG_LIMIT.battery,this.cells+d.n);
    if(k==='syringe') this.syringes=Math.min(BAG_LIMIT.syringe,this.syringes+d.n);
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
      return true;
    }
    if(kind==='glow' && g.glows.held) {
      const s=g.glows.held; g.glows.dropFor(g.player.id,g.player.x,g.player.z);
      if(g.sync) g.sync.ev('gd',s.id,round(s.x),round(s.z));
    }
    const parcel=this.parcel(kind);
    if(!parcel) { this.reconcile(); this.renderKey=''; return true; }
    const nonce=`${this.epoch}.${++this.seq}`;
    this.pending.set(nonce,{kind,parcel,death,retry:2});
    if(g.auth) this.hostDrop(g.player.id,nonce,parcel,death);
    else g.coop.toHost('ibd',[nonce,parcel,death?1:0]);
    return true;
  }
  hostDrop(pid,nonce,raw,death=false,forced=false) {
    const g=this.g,p=g.playerById(pid),d=cleanParcel(raw);
    const bad=()=>{ if(g.auth && p && typeof nonce==='string' && nonce.length<=60) this.reject(pid,nonce); return false; };
    if(!g.auth || !p || typeof nonce!=='string' || nonce.length>60 || !d) return bad();
    const id=`${pid}:${nonce}`,old=this.world.get(id);
    if(old) { if(g.sync) g.sync.ev('ibp',old); else this.applyParcel(old); return true; } // retry the ACK, never spawn twice
    if(d.kind==='map'&&g.partMap?.owner!==pid)return bad();
    if(!['play','morning','dying','dawn','training'].includes(g.state)) return bad();
    if(!forced&&!death && (!p.alive || p.carrying || g.escape.load(pid) || g.escape.seatOf(pid)>=0 || g.cabinets.locked(pid))) return bad();
    if(!forced&&death && p.alive && !(pid===g.player.id&&g.state==='dying')) return bad();
    if(d.kind!=='map'&&[...this.world.values()].filter(q=>!q.taker).length>=96) { this.reject(pid,nonce); return false; }
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
    if(d.kind==='map'&&this.g.partMap)this.g.partMap.owner=d.taker;
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
    let kind=source==='torch'?'torch':source==='gun'?'flare':source==='map'?'map':LOOT_KIND[g.cabinets.list[a]?.items[b]?.kind];
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
    else if(source==='map'){obj=g.partMap?.source;if(!obj||obj.taken||a!==0||b!==0)return fail();kind='map';spot=obj;}
    else if(source==='gun') { obj=g.objectives.bodies[a]; if(!obj?.gun?.visible) return fail(); kind='flare'; spot=obj; }
    else return fail();
    if(Math.hypot(p.x-spot.x,p.z-spot.z)>2.8 || Math.abs(p.y-spot.y)>2 || g.world.losBlocked(p.x,p.y+p.eyeCur,p.z,spot.x,spot.y+.45,spot.z,.22) || (kind && !this.reserve(pid,kind,source==='gun'))) return fail();
    const id=`${source}:${a}:${b}`; if(this.claims.has(id)) return fail();
    const claim={id,pid,source,a,b,kind,loot};
    this.applyClaim(claim); if(g.sync) g.sync.ev('ibg',claim); return true;
  }
  applyClaim(d) {
    if(!d || typeof d.pid!=='string' || !['torch','cabinet','gun','map'].includes(d.source) || !Number.isInteger(d.a) || !Number.isInteger(d.b) || d.id!==`${d.source}:${d.a}:${d.b}`) return;
    if(this.claims.has(d.id) && this.applied.has(d.id)) return;
    if(d.source==='torch') { const it=this.g.torch.items[d.a]; if(!it) return; this.g.torch._taken(it); }
    if(d.source==='cabinet') { const c=this.g.cabinets.list[d.a]; if(!c?.items[d.b]) return; this.g.cabinets._taken(c,d.b); }
    if(d.source==='map'){if(!this.g.partMap)return;this.g.partMap.claimed(d.pid);}
    if(d.source==='gun') { const b=this.g.objectives.bodies[d.a]; if(!b?.gun) return; b.gun.visible=false; }
    this.claims.set(d.id,d);
    if(d.pid===this.g.player.id && !this.applied.has(d.id)) {
      this.applied.add(d.id); this.claimPending=null;
      if(d.source==='torch') {
        const g=this.g; g.torch.has=true; g.torch.charge=Math.min(1,g.torch.charge+TORCH.found+g.torch.spare); g.torch.spare=0; g.stats.torch=1;
        if(g.audio.ready) g.audio.cabinetItem('flare'); g.hud.popup(t('torchGot'),'amber');
      }
      if(d.source==='cabinet') this.g.cabinets._give(this.g.cabinets.list[d.a].items[d.b].kind);
      if(d.source==='gun') this.g.onFlareFound(true);
      if(d.source==='map'){this.g.partMap.has=true;this.g.hud.popup(t('partMapTaken'),'amber');}
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
    if(this.opened && (!alive || g.inputMuted || !['play','morning','dawn','training'].includes(g.state))) this.close(false);
    this.progress=Math.max(0,Math.min(1,this.progress+(this.opened?1:-1)*dt/(this.opened?.7:.32)));
    this.equipT=Math.max(0,this.equipT-dt);
    if(this.opened && this.progress>.94 && !this.uiReady && !g.input.locked && !document.pointerLockElement) { this.uiReady=true; this.el.classList.add('ready'); this.grid.querySelector('.bp-slot.owned')?.focus({preventScroll:true}); }
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
  // ---------------- the page ----------------
  // The pack opens as a page of its own: tabs, a field of slots, and the item you point at described
  // on the right beside the survivor who has to carry it. No 3D rucksack, no four-pocket diagram.
  render() {
    const g=this.g;
    const lang=getLang();
    const key=[t('bagTitle'),lang,this.tab,this.sel,this.equipped,this.slots.join(','),...BAG_KINDS.map(k=>this.count(k)),g.torch.charge.toFixed(2),g.tools.tapeHeld?.charges,this.pending.size,!!g.glows.held,!!g.player.hasFlare].join('|');
    if(key===this.renderKey) return; this.renderKey=key;
    const touch=g.input.touch;
    const tab=BAG_TABS.find(x=>x.id===this.tab)||BAG_TABS[0];
    const kinds=tab.kinds;
    const owns=(k)=>this.count(k)>0||this.owns(k);
    if(!this.sel||!kinds.includes(this.sel)) this.sel=kinds.find(owns)||null;
    const k=this.sel, has=k?owns(k):false;
    this.el.setAttribute('aria-label',t('bagTitle'));
    this.el.querySelector('.bp-title').textContent=t('bagTitle');
    this.el.querySelector('.bp-kicker').textContent=t('bagKicker');
    this.el.querySelector('.bp-cap-k').textContent=t('bagCanHold');
    this.capEl.textContent=`${this.slots.filter(Boolean).length} / ${BAG_SIZE}`;
    this.el.querySelector('.bp-close').textContent=t('bagClose');
    this.el.querySelector('.bp-hint').textContent=t(touch?'bagTipT':'bagTip');
    this.el.querySelector('.bp-keys').textContent=t(touch?'bpKeysT':'bpKeys');
    this.tabsEl.querySelectorAll('[data-tab]').forEach((b)=>{
      const on=b.dataset.tab===this.tab;
      b.textContent=t('bpTab_'+b.dataset.tab);
      b.setAttribute('aria-selected',on?'true':'false');
      b.tabIndex=on?0:-1;
    });
    // the field of slots: every kind of the chosen shelf, then its empty places
    const tiles=kinds.map((kind)=>{
      const n=this.count(kind), on=this.equipped===kind;
      const sel=kind===this.sel;
      const name=kind==='flare'&&!g.player.hasFlare?t('bagCartridges'):bagName(kind);
      const live=owns(kind);
      return `<button type="button" class="bp-slot${live?' owned':' void'}${sel?' sel':''}${on?' on':''}" data-kind="${kind}" ${live?'':'disabled'} aria-label="${esc(name)}${live?`, ${n}`:''}"${sel?' aria-current="true"':''}>
        <span class="bp-ico">${iconSvg(kind)}</span>
        <span class="bp-lbl">${esc(name)}</span>
        <span class="bp-n">${live?'×'+n:''}</span>
        ${on?`<i class="bp-mark">${esc(t('bagInHands'))}</i>`:''}
      </button>`;
    });
    while(tiles.length%5||tiles.length<25) tiles.push('<span class="bp-slot void filler" aria-hidden="true"></span>');
    this.grid.innerHTML=tiles.join('');
    // the right-hand page: what it is, and what it costs you to carry
    const nm=k?(k==='flare'&&!g.player.hasFlare?t('bagCartridges'):bagName(k)):t('bagEmpty');
    this.nameEl.textContent=nm;
    this.latinEl.textContent=k?t('bagSub_'+k):t('bagPickHint');
    this.descEl.textContent=k?t('bagAbout_'+k):t('bagPickHint');
    const chips=[];
    if(k){
      const cnt=this.count(k);
      const limited=['stones','glow','battery','flare','syringe'].includes(k);
      chips.push([t('bagCount'), limited?`${cnt} / ${BAG_LIMIT[k]}`:`${cnt}`]);
      const i=this.slots.indexOf(k);
      if(i>=0) chips.push([t('bagSlot'), `${i+1} / ${BAG_SIZE}`]);
      if(k==='torch') chips.push([t('bagCharge'), `${Math.ceil(g.torch.charge*100)}%`]);
      if(k==='tape') chips.push([t('bagCharge'), `${g.tools.tapeHeld?.charges||0} / 2`]);
      if(k==='glow'&&g.glows.held) chips.push([t('bagState'), t('bagLit')]);
      if(this.equipped===k) chips.push([t('bagState'), t('bagInHands')]);
      if(this.pending.size) chips.push([t('bagState'), t('bagPending')]);
    }
    this.chipsEl.innerHTML=chips.map(([a,b])=>`<span><i>${esc(a)}</i><b>${esc(b)}</b></span>`).join('');
    this.equipBtn.textContent=this.equipped===k?t('bagStow'):t('bagEquip');
    this.equipBtn.disabled=!has||!!this.pending.size;
    this.dropBtn.textContent=t('bagDrop');
    this.dropBtn.disabled=!has||!!this.pending.size;
    this.heldEl.innerHTML=k&&has?iconSvg(k):'';
    this.heldEl.className='bp-held'+(k&&has?' show':'');
    this.dropZone.querySelector('b').textContent=t('bagDrop');
    this.dropZone.querySelector('span').textContent=t('bagDropHint');
    this.dropZone.hidden=!document.body.classList.contains('bag-dragging');
  }

  // ---------------- throwing things out ----------------
  // Drag a tile off the page (or onto the drop strip) and let go: the item leaves the pack and lies
  // where you stand, the same way the old context menu did it, whether you are host or guest.
  _dragStart(e) {
    if(!this.opened||!this.uiReady||e.button>0) return;
    const b=e.target.closest('.bp-slot[data-kind]');
    if(!b||b.disabled) return;
    this.drag={kind:b.dataset.kind,x:e.clientX,y:e.clientY,live:false};
    this._md=(ev)=>this._dragMove(ev);
    this._mu=(ev)=>this._dragEnd(ev);
    addEventListener('pointermove',this._md);
    addEventListener('pointerup',this._mu);
    addEventListener('pointercancel',this._mu);
  }
  _dragMove(e) {
    const d=this.drag; if(!d) return;
    if(!d.live&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8) return;
    if(!d.live){
      d.live=true;
      d.ghost=document.createElement('div');
      d.ghost.className='bp-ghost';
      d.ghost.innerHTML=`${iconSvg(d.kind)}<b>×${this.count(d.kind)}</b>`;
      document.body.append(d.ghost);
      document.body.classList.add('bag-dragging');
      this.dropZone.hidden=false;
    }
    d.ghost.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
    const zone=this.dropZone.getBoundingClientRect();
    const onZone=e.clientX>=zone.left&&e.clientX<=zone.right&&e.clientY>=zone.top&&e.clientY<=zone.bottom;
    const over=document.elementFromPoint(e.clientX,e.clientY);
    this.dropZone.classList.toggle('hot',onZone);
    this.dropZone.classList.toggle('away',!onZone&&(!over||!over.closest('.bp-frame')));
  }
  _dragEnd(e) {
    removeEventListener('pointermove',this._md);
    removeEventListener('pointerup',this._mu);
    removeEventListener('pointercancel',this._mu);
    const d=this.drag; this.drag=null;
    if(!d||!d.live){ return; }
    const zone=this.dropZone.getBoundingClientRect();
    const onZone=e.clientX>=zone.left&&e.clientX<=zone.right&&e.clientY>=zone.top&&e.clientY<=zone.bottom;
    const over=document.elementFromPoint(e.clientX,e.clientY);
    const out=onZone||!over||!over.closest('.bp-frame');
    d.ghost?.remove();
    document.body.classList.remove('bag-dragging');
    this.dropZone.hidden=true; this.dropZone.classList.remove('hot','away');
    this._skipClickUntil=performance.now()+300;
    if(out) this.dropKind(d.kind);
  }
  equipKind(kind) {
    if(!kind||!this.opened||this.pending.size) return;
    const i=this.slots.indexOf(kind);
    if(i>=0) this.equip(i);
  }
  dropKind(kind) {
    if(!kind||!this.opened||this.pending.size) return false;
    const i=this.slots.indexOf(kind);
    if(i<0) return false;
    const ok=this.drop(i);
    if(ok&&this.g.audio?.ready) this.g.audio.paper();
    this.renderKey='';
    this.render();
    return ok;
  }
}
