// Complete, unmodified utterances for the Shade, separate from the deliberately lo-fi two-second tape.
// Raw mono PCM16 at the microphone's ORIGINAL sample rate. No pitch change, normalization, clipping of
// syllables, fades, filters, text transcription or voice synthesis. Everything lives in this night's RAM.
export const PHRASE = { maxSeconds: 30, minSeconds: .32, minRate: 8000, maxRate: 96000, release: .8, pre: .24, tail: .2 };
export const PHRASE_MAX_BYTES = PHRASE.maxSeconds * PHRASE.maxRate * 2;

export function encodePhrase(raw,hz) {
  if(!(raw instanceof Float32Array) || !Number.isInteger(hz) || hz<PHRASE.minRate || hz>PHRASE.maxRate || raw.length<hz*PHRASE.minSeconds || raw.length>hz*PHRASE.maxSeconds) return null;
  const bytes=new Uint8Array(raw.length*2),view=new DataView(bytes.buffer);let energy=0;
  for(let i=0;i<raw.length;i++) { const v=Number.isFinite(raw[i])?Math.max(-1,Math.min(1,raw[i])):0;energy+=v*v;view.setInt16(i*2,Math.round(v*32767),true); }
  if(energy/raw.length<1e-7) return null;
  let s='';for(let i=0;i<bytes.length;i+=16384) s+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return {v:1,hz,n:raw.length,pcm:btoa(s)};
}
export function validPhrase(d) {
  return !!d && d.v===1 && Number.isInteger(d.hz) && d.hz>=PHRASE.minRate && d.hz<=PHRASE.maxRate && Number.isInteger(d.n) && d.n>=d.hz*PHRASE.minSeconds && d.n<=d.hz*PHRASE.maxSeconds && typeof d.pcm==='string' && d.pcm.length===Math.ceil(d.n*2/3)*4 && d.pcm.length<=Math.ceil(PHRASE_MAX_BYTES/3)*4 && /^[A-Za-z0-9+/]*={0,2}$/.test(d.pcm);
}
export function decodePhrase(d,ctx) {
  if(!validPhrase(d)) return null;
  try {
    const s=atob(d.pcm);if(s.length!==d.n*2) return null;
    const b=ctx.createBuffer(1,d.n,d.hz),out=b.getChannelData(0);let energy=0;
    for(let i=0;i<d.n;i++) { let v=s.charCodeAt(i*2)|(s.charCodeAt(i*2+1)<<8);if(v&32768)v-=65536;out[i]=v/32767;energy+=out[i]*out[i]; }
    return energy/d.n>1e-7?b:null;
  } catch { return null; }
}

// VAD works on recorder chunks, not render frames, so a slow renderer cannot truncate a sentence.
// >30s continuous speech is discarded as a WHOLE, never cut up and passed off as a complete phrase.
export class PhraseCapture {
  constructor(done) { this.done=done;this.reset(); }
  reset() { this.hz=0;this.pre=[];this.preN=0;this.parts=[];this.n=0;this.quiet=0;this.voiced=0;this.active=false;this.overflow=false; }
  push(chunk,hz,threshold=-48) {
    if(!(chunk instanceof Float32Array) || !chunk.length || !Number.isInteger(hz) || hz<PHRASE.minRate || hz>PHRASE.maxRate) return;
    if(this.hz && this.hz!==hz) this.reset();this.hz=hz;
    let sum=0;for(const v of chunk) if(Number.isFinite(v)) sum+=v*v;
    const speaking=20*Math.log10(Math.sqrt(sum/chunk.length)+1e-9)>threshold;
    if(this.overflow) { this.quiet=speaking?0:this.quiet+chunk.length; if(this.quiet>=hz*PHRASE.release) this.reset(); return; }
    if(!this.active) {
      if(speaking) {
        this.active=true;this.parts=this.pre.slice();this.n=this.preN;this.pre=[];this.preN=0;
      } else {
        this.pre.push(chunk.slice());this.preN+=chunk.length;
        while(this.pre.length>1 && this.preN-this.pre[0].length>=hz*PHRASE.pre) this.preN-=this.pre.shift().length;
        return;
      }
    }
    this.parts.push(chunk.slice());this.n+=chunk.length;
    if(speaking) { this.voiced+=chunk.length;this.quiet=0; } else this.quiet+=chunk.length;
    if(this.n>hz*PHRASE.maxSeconds) { this.parts=[];this.n=0;this.overflow=true;this.quiet=0;return; }
    if(this.quiet>=hz*PHRASE.release) {
      const n=Math.max(0,this.n-Math.max(0,this.quiet-Math.floor(hz*PHRASE.tail)));
      if(this.voiced>=hz*.22 && n>=hz*PHRASE.minSeconds) {
        const raw=new Float32Array(n);let at=0;
        for(const p of this.parts) { const part=p.subarray(0,n-at);raw.set(part,at);at+=part.length;if(at===n) break; }
        this.done(raw,hz);
      }
      this.reset();
    }
  }
}
