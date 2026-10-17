// Two seconds of telephone-band mono PCM. <= 16 kB base64 per clip, sent only when a player puts the
// recorder down. No file uploads, no localStorage. Kept on the device for this night, erased at reset.
export const TAPE = { seconds: 2, hz: 6000, samples: 12000, delay: 3, duration: 20, charges: 2, loud: 0.65, every: 2 };
export const CLIP_LIMIT = Math.ceil(TAPE.samples / 3) * 4;
export function validClip(s) {
  return typeof s === 'string' && s.length === CLIP_LIMIT && /^[A-Za-z0-9+/]+$/.test(s);
}
export function encodeTape(samples, hz) {
  if (!samples || !samples.length || !Number.isFinite(hz) || hz < 6000 || hz > 192000) return null;
  let peak = 0, sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Number.isFinite(samples[i]) ? samples[i] : 0;
    peak = Math.max(peak, Math.abs(v)); sum += v * v;
  }
  if (peak < 0.006 || sum / samples.length < 0.000003) return null; // silence is not a lure
  const gain = Math.min(5, 0.78 / peak);
  const stride = hz / TAPE.hz;
  const bytes = new Uint8Array(TAPE.samples);
  // Average a source window instead of aliasing microphone hiss into the voice band.
  for (let i = 0; i < bytes.length; i++) {
    const lo = Math.floor(i * stride), hi = Math.min(samples.length, Math.floor((i + 1) * stride));
    let v = 0;
    for (let j = lo; j < hi; j++) v += Number.isFinite(samples[j]) ? samples[j] : 0;
    v /= Math.max(1, hi - lo);
    const fade = Math.min(1, i / 90, (bytes.length - 1 - i) / 90);
    bytes[i] = 128 + Math.round(Math.max(-1, Math.min(1, v * gain * fade)) * 127);
  }
  // Small enough not to overflow String.fromCharCode on mobile engines.
  let raw = '';
  for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
  return btoa(raw);
}
export function decodeTape(s, ctx) {
  if (!validClip(s)) return null;
  const raw = atob(s);
  if (raw.length !== TAPE.samples) return null;
  const buf = ctx.createBuffer(1, TAPE.samples, TAPE.hz), a = buf.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (raw.charCodeAt(i) - 128) / 127;
  return buf;
}
