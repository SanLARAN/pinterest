// Lobby labels come from the selected account, never from an editable lobby field.
let provider=()=>null;
export function setIdentityProvider(fn){provider=typeof fn==='function'?fn:()=>null;}
export function currentIdentity(){try{const p=provider();return p?.locked&&typeof p.name==='string'?{locked:true,name:p.name}:null;}catch{return null;}}
