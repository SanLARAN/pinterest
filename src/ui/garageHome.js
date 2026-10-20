// A title screen in the garage, not a second game scene. The atlas has a keyboard/touch hit target,
// but its visible object is the real closed book on the desk; it has no navigation-menu button.
import * as THREE from 'three';
import { t } from '../core/i18n.js';
import { myFit } from '../game/outfit.js';

export class GarageHome {
  constructor({ensureGarage,atlas,onWardrobe}) {
    this.ensureGarage=ensureGarage;this.atlas=atlas;this.active=false;this.onWardrobe=onWardrobe;this.ray=new THREE.Raycaster();
    this.book=document.getElementById('btnAtlas');this.caption=document.getElementById('homeRoomCaption');
    this.book.addEventListener('pointerenter',()=>{const g=this.ensureGarage();if(g?.studio)g.studio.hover='book';});
    this.book.addEventListener('pointerleave',()=>{const g=this.ensureGarage();if(g?.studio)g.studio.hover='';});
    this.book.addEventListener('focus',()=>{const g=this.ensureGarage();if(g?.studio)g.studio.hover='book';});
    this.book.addEventListener('blur',()=>{const g=this.ensureGarage();if(g?.studio)g.studio.hover='';});
    const menu=document.getElementById('menu');
    menu.addEventListener('pointermove',e=>{if(!this.active||e.pointerType==='touch')return;this.ensureGarage()?.pointer(e.clientX,e.clientY,true);const over=!e.target.closest('button,input,a')&&this.hitSurvivor(e.clientX,e.clientY);menu.classList.toggle('over-survivor',over);if(this.ensureGarage()?.studio&&this.ensureGarage().studio.hover!=='book')this.ensureGarage().studio.hover=over?'survivor':'';},{passive:true});
    menu.addEventListener('click',e=>{if(this.active&&!e.target.closest('button,input,a')&&this.hitSurvivor(e.clientX,e.clientY))this.onWardrobe?.();});
    window.addEventListener('pagehide',()=>this.leave());
  }
  hitSurvivor(x,y) {
    const g=this.ensureGarage(),rig=g?.studio?.resident.rig;if(!rig?.root.visible)return false;
    rig.root.updateMatrixWorld(true);this.ray.setFromCamera(new THREE.Vector2(x/g.w*2-1,1-y/g.h*2),g.camera);
    return this.ray.intersectObject(rig.root,true).length>0;
  }
  enter() {
    const g=this.ensureGarage();if(!g)return;
    if(g.view!=='menu'||!g.visible){g.open('menu');g.setPlayers([]);const f=myFit();g.setCar(f.car,f.cc);g.studio?.setFit(f);}
  }
  setActive(active) {
    this.active=active;this.book.hidden=!active;this.caption.hidden=!active;
    document.body.classList.toggle('garage-home',active);
    if(!active){document.getElementById('menu').classList.remove('over-survivor');const g=this.ensureGarage();if(g?.studio){g.studio.hover='';g.studio.cancelBook();}}
  }
  place() {
    if(!this.active)return;
    const g=this.ensureGarage(),r=g?.studio?.bookRect();
    this.book.setAttribute('aria-label',t('homeBookOpen'));this.book.title=t('homeBookOpen');
    this.book.querySelector('span').textContent=t('homeBookOpen');
    if(this.returnBookFocus){this.returnBookFocus=false;this.book.focus({preventScroll:true});}
    if(g?.studio && g.studio.lastLang!==t('homeBookTitle')){g.studio.lastLang=t('homeBookTitle');g.studio.drawBook();}
    const visible=r&&r.x>-20&&r.y>0&&r.x+r.w<innerWidth+20&&r.y+r.h<innerHeight-35&&r.w>15;
    this.book.classList.toggle('book-fallback',!visible);
    if(visible){const width=Math.max(48,r.w+12),height=Math.max(44,r.h+10);Object.assign(this.book.style,{right:'auto',left:`${Math.max(8,Math.min(innerWidth-width-8,r.x-(width-r.w)/2))}px`,top:`${Math.max(8,r.y-(height-r.h)/2)}px`,width:`${width}px`,height:`${height}px`});}
    else Object.assign(this.book.style,{left:'auto',right:'24px',top:'44%',width:'84px',height:'113px'});
  }
  openAtlas() {
    if(!this.active)return;
    const g=this.ensureGarage();
    if(!g?.studio)return this.atlas.open();
    // The cover lifts in the garage's frame. If that frame stalls (an overlay opened, the tab lost
    // focus mid-animation), the callback would never fire and the book would be stuck half-open with
    // no journal behind it — so the click itself guarantees the journal opens either way.
    let opened=false;
    g.studio.openBook(()=>{opened=true;if(this.active)this.atlas.open();});
    setTimeout(()=>{if(!opened&&this.active&&!this.atlas.shown){g.studio.cancelBook();this.atlas.open();}},1400);
  }
  atlasClosed() {
    this.ensureGarage()?.studio?.cancelBook();this.returnBookFocus=true;
  }
  leave() {this.active=false;this.book.hidden=true;this.ensureGarage()?.studio?.cancelBook();}
}
