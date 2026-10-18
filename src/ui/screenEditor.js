import { getLang } from '../core/i18n.js';
import { SCREEN_PRESETS, cleanScreen, decodePixels, encodePixels, presetPixels, paintLine, composeScreen } from '../game/screenFace.js';
const WORDS={
 ru:{title:'ЛИЦО ЭКРАНА',sub:'32 × 24 · люминофор',draw:'Карандаш',erase:'Ластик',undo:'Отменить',clear:'Очистить',text:'Надпись · до 24 знаков, 3 строки',hint:'Рисуй мышью или пальцем. Текст выводится снизу. Цвет свечения меняется во вкладке «Краска».',apply:'ПРИМЕНИТЬ',cancel:'НАЗАД',canvas:'Пиксельный рисунок на голове-экране',presets:{blank:'Пустой',smile:'Улыбка',listener:'Слушатель',crawler:'Ползун',watcher:'Наблюдатель',howler:'Ревун',shade:'Тень'}},
 en:{title:'SCREEN FACE',sub:'32 × 24 · phosphor',draw:'Pencil',erase:'Eraser',undo:'Undo',clear:'Clear',text:'Caption · up to 24 characters, 3 lines',hint:'Draw with a mouse or finger. Text appears along the bottom. Change the phosphor in Paint.',apply:'APPLY',cancel:'BACK',canvas:'Pixel drawing on the screen head',presets:{blank:'Blank',smile:'Smile',listener:'Listener',crawler:'Crawler',watcher:'Watcher',howler:'Howler',shade:'Shade'}},
};
export class ScreenEditor {
 constructor({getValue,onApply,getColor}) {
  this.getValue=getValue;this.onApply=onApply;this.getColor=getColor;this.opened=false;this.eraser=false;
  this.el=document.createElement('section');this.el.id='screenEditor';this.el.hidden=true;this.el.className='screen-editor';this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-labelledby','screenEditorTitle');
  document.body.append(this.el);
  this.el.addEventListener('keydown',e=>{
   e.stopPropagation(); // typing and Escape belong to the editor, not game/wardrobe shortcuts
   if(e.key==='Escape'){e.preventDefault();this.close();}
   if(e.key==='Tab'){const a=[...this.el.querySelectorAll('button,textarea,canvas')].filter(x=>!x.disabled),i=a.indexOf(document.activeElement),next=(i+(e.shiftKey?-1:1)+a.length)%a.length;e.preventDefault();a[next]?.focus();}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();this.undo();}
  });
  this.el.addEventListener('keyup',e=>e.stopPropagation());
  // Some mobile browsers consume the first click after editing a focused text field.
  // Keep native button/keyboard clicks, with a pointer-up fallback only if no click arrived.
  // A delayed compatibility click must not fall through the now-closed editor into the wardrobe.
  document.addEventListener('pointerdown',()=>{this.suppressClick=null;},true);
  document.addEventListener('click',e=>{
   const s=this.suppressClick;
   if(s&&e.isTrusted&&e.detail>0&&performance.now()<s.until&&Math.hypot(e.clientX-s.x,e.clientY-s.y)<25){this.suppressClick=null;e.preventDefault();e.stopImmediatePropagation();}
  },true);
  this.el.addEventListener('pointerdown',e=>{
   const button=e.target.closest('button');
   this.pendingTap=e.pointerType==='touch'&&button?{button,id:e.pointerId,x:e.clientX,y:e.clientY}:null;
  });
  this.el.addEventListener('pointercancel',()=>{this.pendingTap=null;});
  this.el.addEventListener('pointerup',e=>{
   const tap=this.pendingTap;if(!tap||tap.id!==e.pointerId)return;
   if(!tap.button.contains(e.target)||Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>10){this.pendingTap=null;return;}
   setTimeout(()=>{
    if(this.opened&&this.pendingTap===tap){this.pendingTap=null;this.suppressClick={x:e.clientX,y:e.clientY,until:performance.now()+700};tap.button.click();}
   },50);
  });
  this.el.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;this.pendingTap=null;
   if(b.dataset.preset){this.remember();this.pixels=presetPixels(b.dataset.preset);this.render();}
   if(b.dataset.tool){this.eraser=b.dataset.tool==='erase';this.syncTools();}
   if(b.dataset.action==='clear'){this.remember();this.pixels.fill(0);this.render();}
   if(b.dataset.action==='undo')this.undo();
   if(b.dataset.action==='cancel')this.close();
   if(b.dataset.action==='apply'){this.onApply(this.value());this.close();}
  });
 }
 value(){return cleanScreen({bits:encodePixels(this.pixels),text:this.input.value});}
 remember(){this.history.push(encodePixels(this.pixels));if(this.history.length>32)this.history.shift();}
 undo(){if(this.history.length){this.pixels=decodePixels(this.history.pop());this.render();}}
 open() {
  if(this.opened)return;this.opened=true;this.previous=document.activeElement;this.history=[];this.eraser=false;
  const W=WORDS[getLang()]||WORDS.ru,s=cleanScreen(this.getValue());this.pixels=decodePixels(s.bits);
  this.el.innerHTML=`<div class="screen-editor-card"><header><div><h2 id="screenEditorTitle">${W.title}</h2><p>${W.sub}</p></div><button type="button" data-action="cancel" aria-label="${W.cancel}">×</button></header><canvas width="320" height="240" tabindex="0" role="img" aria-label="${W.canvas}"></canvas><div class="screen-tools"><button type="button" data-tool="draw">${W.draw}</button><button type="button" data-tool="erase">${W.erase}</button><button type="button" data-action="undo">${W.undo}</button><button type="button" data-action="clear">${W.clear}</button></div><div class="screen-presets">${SCREEN_PRESETS.map(id=>`<button type="button" data-preset="${id}">${W.presets[id]}</button>`).join('')}</div><label>${W.text}<textarea maxlength="24" rows="2" spellcheck="false"></textarea></label><p class="screen-editor-hint">${W.hint}</p><footer><button type="button" data-action="cancel">${W.cancel}</button><button type="button" class="primary" data-action="apply">${W.apply}</button></footer></div>`;
  this.input=this.el.querySelector('textarea');this.input.value=s.text;this.input.addEventListener('input',()=>this.render());
  this.canvas=this.el.querySelector('canvas');this.el.hidden=false;document.body.classList.add('screen-editing');this.syncTools();
  const point=e=>{const r=this.canvas.getBoundingClientRect();return{x:Math.floor((e.clientX-r.left)/r.width*32),y:Math.floor((e.clientY-r.top)/r.height*24)};};
  this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;e.preventDefault();if(this.pointer!==undefined)return;this.canvas.focus({preventScroll:true});this.remember();this.pointer=e.pointerId;this.canvas.setPointerCapture(e.pointerId);this.last=point(e);paintLine(this.pixels,this.last.x,this.last.y,this.last.x,this.last.y,this.eraser?0:1);this.render();});
  this.canvas.addEventListener('pointermove',e=>{if(this.pointer!==e.pointerId)return;e.preventDefault();const p=point(e);paintLine(this.pixels,this.last.x,this.last.y,p.x,p.y,this.eraser?0:1);this.last=p;this.render();});
  const end=e=>{if(this.pointer===e.pointerId){this.pointer=undefined;this.last=null;}};
  this.canvas.addEventListener('pointerup',end);this.canvas.addEventListener('pointercancel',end);this.canvas.addEventListener('lostpointercapture',end);
  this.canvas.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();const c=this.cursor||{x:16,y:12};c.x=Math.max(0,Math.min(31,c.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));c.y=Math.max(0,Math.min(23,c.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)));this.cursor=c;this.render();}else if(e.code==='Space'||e.key==='Enter'){e.preventDefault();const c=this.cursor||{x:16,y:12};this.remember();paintLine(this.pixels,c.x,c.y,c.x,c.y,this.eraser?0:1);this.render();}});
  this.render();this.canvas.focus({preventScroll:true});
 }
 syncTools(){for(const b of this.el.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String((b.dataset.tool==='erase')===this.eraser));}
 render(){const c=this.canvas.getContext('2d'),p=composeScreen(this.value());c.fillStyle='#060c0a';c.fillRect(0,0,320,240);c.fillStyle=this.getColor?.()||'#9cffb0';for(let y=0;y<24;y++)for(let x=0;x<32;x++)if(p[y*32+x])c.fillRect(x*10+1,y*10+1,8,8);if(this.cursor){c.strokeStyle='#f0ebd1';c.lineWidth=1;c.strokeRect(this.cursor.x*10+.5,this.cursor.y*10+.5,9,9);}}
 close(){if(!this.opened)return;this.opened=false;this.pointer=undefined;this.pendingTap=null;this.el.hidden=true;document.body.classList.remove('screen-editing');(this.previous?.isConnected?this.previous:document.getElementById('wrScreenEdit'))?.focus({preventScroll:true});}
}
