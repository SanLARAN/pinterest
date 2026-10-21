// Bounded, deterministic CRT art. One bit per pixel, no URLs, HTML or uploaded textures on the wire.
export const SCREEN_W=32, SCREEN_H=24, SCREEN_HEX=SCREEN_W*SCREEN_H/4;
export const SCREEN_PRESETS=['blank','smile','listener','crawler','watcher','howler','angler','shade'];
const FONT={
 A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'101111111111101',O:'010101101101010',P:'110101110100100',Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',
 '0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
 ' ':'000000000000000','!':'010010010000010','?':'110001010000010','.':'000000000000010',':':'000010000010000','-':'000000111000000','+':'000010111010000','/':'001001010100100','<':'001010100010001','>':'100010001010100','_':'000000000000111','=':'000111000111000',
 'Б':'111100110101110','Г':'111100100100100','Д':'011011101111101','Ж':'101111010111101','З':'110001010001110','И':'101101111111101','Й':'010101111111101','Л':'011101101101101','П':'111101101101101','Ф':'010111111111010','Ц':'101101101111001','Ч':'101101111001001','Ш':'101101111111111','Щ':'101101111111001','Ъ':'110010011011011','Ы':'101101111111111','Ь':'100100110101110','Э':'110001011001110','Ю':'101111111111101','Я':'011101011101101',
};
for(const [c,a]of Object.entries({'А':'A','В':'B','Е':'E','Ё':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','У':'Y','Х':'X'}))FONT[c]=FONT[a];
export function encodePixels(p) {let s='';for(let i=0;i<SCREEN_W*SCREEN_H;i+=4){let v=0;for(let b=0;b<4;b++)v|=(p[i+b]?1:0)<<(3-b);s+=v.toString(16);}return s;}
export function decodePixels(s) {const p=new Uint8Array(SCREEN_W*SCREEN_H);if(typeof s!=='string'||s.length!==SCREEN_HEX||!/^[0-9a-f]+$/i.test(s))return p;for(let i=0;i<s.length;i++){const v=parseInt(s[i],16);for(let b=0;b<4;b++)p[i*4+b]=(v>>(3-b))&1;}return p;}
export function paintLine(p,x0,y0,x1,y1,value=1) {
 x0=Math.max(0,Math.min(31,Math.round(x0)));x1=Math.max(0,Math.min(31,Math.round(x1)));y0=Math.max(0,Math.min(23,Math.round(y0)));y1=Math.max(0,Math.min(23,Math.round(y1)));
 const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
 for(let n=0;n<100;n++){p[y0*32+x0]=value?1:0;if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}}
}
export function presetPixels(id='smile') {
 const p=new Uint8Array(768),line=(...a)=>paintLine(p,...a),rect=(x,y,w,h,v=1)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&i<32&&j>=0&&j<24)p[j*32+i]=v;};
 const oval=(x,y,rx,ry)=>{for(let a=0;a<Math.PI*2;a+=.07){const xx=Math.round(x+Math.cos(a)*rx),yy=Math.round(y+Math.sin(a)*ry);if(xx>=0&&xx<32&&yy>=0&&yy<24)p[yy*32+xx]=1;}};
 if(id==='smile'){rect(8,7,3,4);rect(21,7,3,4);line(8,15,12,18);line(12,18,20,18);line(20,18,24,15);}
 if(id==='listener'){oval(16,10,6,8);line(12,2,10,0);line(20,2,23,0);oval(16,13,4,5);rect(13,9,7,8);rect(14,10,5,6,0);rect(8,4,3,8);rect(22,4,3,8);line(12,19,6,23);line(20,19,26,23);}
 if(id==='crawler'){oval(16,8,5,6);rect(12,7,3,3,0);rect(18,7,3,3,0);line(11,13,13,19);line(13,19,20,19);line(20,19,22,13);for(const x of[13,16,19])line(x,12,x,15);for(let i=0;i<3;i++){line(11,14+i*3,2+i*2,12+i*4);line(21,14+i*3,29-i*2,12+i*4);}line(16,19,16,23);}
 if(id==='watcher'){oval(16,8,4,7);line(12,13,7,23);line(20,13,25,23);line(12,13,20,13);line(16,15,16,23);rect(13,7,7,1,0);rect(15,6,2,2);}
 if(id==='howler'){oval(16,12,6,8);oval(16,12,3,5);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(16+Math.cos(a)*7,12+Math.sin(a)*8,16+Math.cos(a)*12,12+Math.sin(a)*11);}line(10,19,5,23);line(22,19,27,23);}
 if(id==='angler'){oval(16,4,3,3);line(9,8,23,8);line(11,8,11,16);line(21,8,21,16);line(11,16,21,16);line(11,11,21,11);rect(15,6,2,1);line(21,9,26,6);rect(24,7,5,6);rect(25,8,3,4,0);rect(26,9,1,2);line(11,9,7,13);line(7,13,6,15);rect(2,15,6,4);line(13,16,11,23);line(19,16,20,23);}
 if(id==='shade'){oval(16,8,5,6);rect(10,4,13,2);line(11,4,16,0);line(16,0,22,4);rect(12,7,3,1);rect(19,7,2,1);line(11,14,7,23);line(21,14,25,23);line(7,17,25,17);line(16,14,16,23);}
 return p;
}
export const DEFAULT_SCREEN=Object.freeze({bits:encodePixels(presetPixels('smile')),text:''});
export function cleanScreen(v) {
 const o=v&&typeof v==='object'?v:{};
 const bits=typeof o.bits==='string'&&o.bits.length===SCREEN_HEX&&/^[0-9a-f]+$/i.test(o.bits)?o.bits.toLowerCase():DEFAULT_SCREEN.bits;
 const text=typeof o.text==='string'?o.text.slice(0,96).normalize('NFC').replace(/[^\p{L}\p{N} .,:!?+\-_/<>＝=\n]/gu,'').slice(0,24):'';
 return{bits,text};
}
export function screenKey(v){const s=cleanScreen(v);return s.bits+':'+s.text;}
export function composeScreen(v) {
 const s=cleanScreen(v),p=decodePixels(s.bits),lines=[];
 for(const row of s.text.toUpperCase().split('\n')){for(let i=0;i<row.length;i+=8)lines.push(row.slice(i,i+8));if(!row)lines.push('');}
 if(!s.text)return p;
 const visible=lines.slice(0,3),top=24-visible.length*6+1;
 for(let y=top-1;y<24;y++)p.fill(0,y*32,(y+1)*32);
 visible.forEach((row,j)=>[...row].forEach((c,i)=>{const glyph=FONT[c]||FONT['?'];for(let k=0;k<15;k++)if(glyph[k]==='1')p[(top+j*6+Math.floor(k/3))*32+i*4+k%3]=1;}));return p;
}
// Horizontal runs keep even a completely filled screen cheap. Worst-case checkerboard: 2304 vertices.
export function screenRects(v) {
 const p=composeScreen(v),r=[];for(let y=0;y<24;y++)for(let x=0;x<32;x++){if(!p[y*32+x])continue;const start=x;while(x+1<32&&p[y*32+x+1])x++;r.push({x:start,y,w:x-start+1});}return r;
}
