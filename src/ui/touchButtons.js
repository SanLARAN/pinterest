// A mobile browser can swallow the first click after editing text. Preserve native semantics,
// then fall back only if no click arrived. Deferred renders may replace the button before 50ms.
export function reliableTouchButtons(el,isOpen,getContext=()=>null){
 let pending=null,suppress=null;
 const click=e=>{
  const oldPointer=typeof e.pointerId!=='number'||e.pointerId<=0||e.pointerId===suppress?.pointerId;
  if(suppress&&oldPointer&&e.isTrusted&&e.detail>0&&performance.now()<suppress.until&&Math.hypot(e.clientX-suppress.x,e.clientY-suppress.y)<25){suppress=null;e.preventDefault();e.stopImmediatePropagation();}
 };
 document.addEventListener('click',click,true);
 el.addEventListener('pointerdown',e=>{const button=e.target.closest('button');pending=e.pointerType==='touch'&&button?{button,id:e.pointerId,x:e.clientX,y:e.clientY,context:getContext(),action:button.dataset.action,target:button.dataset.id,form:button.closest('form')?.dataset.kind||'',type:button.type}:null;});
 el.addEventListener('pointercancel',()=>{pending=null;});el.addEventListener('click',()=>{pending=null;},true);
 el.addEventListener('pointerup',e=>{
  const tap=pending;if(!tap||tap.id!==e.pointerId)return;
  if(!tap.button.contains(e.target)||Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>10){pending=null;return;}
  setTimeout(()=>{
   if(!isOpen()||pending!==tap||getContext()!==tap.context)return;
   const button=tap.button.isConnected?tap.button:[...el.querySelectorAll('button')].find(b=>b.dataset.action===tap.action&&b.dataset.id===tap.target&&(b.closest('form')?.dataset.kind||'')===tap.form&&b.type===tap.type);
   if(!button||button.disabled)return;
   pending=null;suppress={x:e.clientX,y:e.clientY,pointerId:tap.id,until:performance.now()+700};button.click();
  },50);
 });
 return()=>{document.removeEventListener('click',click,true);pending=null;suppress=null;};
}
