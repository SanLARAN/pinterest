// (4.2) The car's own paint and its stickers, in whichever shader draws it: the garage's, the wardrobe
// stills' (ui/mannequin.js), the world's (the road film). The base materials stay as they are; a sticker
// mesh gets a copy of its renderer's material with two lines more — the quad's uv and a texel from the
// look's sticker atlas (game/carLook.js) instead of the paint, the clear texels cut out.
import * as THREE from 'three';
import { cleanLook, lookKey, stickerAtlas, decalArrays } from '../game/carLook.js';
import { createWorldMaterial } from './sonar.js';

const MAIN = 'void main() {';

function vertWithUv(src) {
  const i = src.indexOf(MAIN);
  if (i < 0) throw new Error('carPaint: no main() in the vertex shader');
  return src.slice(0, i) + 'varying vec2 vDUv;\n' + MAIN + '\n  vDUv = uv;' + src.slice(i + MAIN.length);
}
function fragHead(src, decl) {
  const i = src.indexOf('void main()');
  if (i < 0) throw new Error('carPaint: no main() in the fragment shader');
  return src.slice(0, i) + decl + src.slice(i);
}
function after(src, re, code) {
  const m = re.exec(src);
  if (!m) throw new Error('carPaint: anchor not found: ' + re);
  const at = m.index + m[0].length;
  return src.slice(0, at) + code + src.slice(at);
}

// the garage's / the mannequin's shaders: `vec3 base = …;` is where a surface learns what it is made of
const BASE_RE = /vec3 base = [^;]*;/;
export function decalShaders(vert, frag, linear = true) {
  return {
    vertexShader: vertWithUv(vert),
    fragmentShader: after(fragHead(frag, 'uniform sampler2D uDecal;\nvarying vec2 vDUv;\n'), BASE_RE,
      `\n  vec4 dcl = texture2D(uDecal, vDUv);\n  if (dcl.a < 0.5) discard;\n  base = ${linear ? 'pow(dcl.rgb, vec3(2.2))' : 'dcl.rgb'};\n`),
  };
}

// a sticker material copied off a garage-style ShaderMaterial (shares its uniforms: the lights stay in step).
// uDecal: a uniform ({ value: texture }) — the copies of one renderer share it
export function decalMaterialFrom(base, uDecal) {
  const sh = decalShaders(base.vertexShader, base.fragmentShader);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...base.uniforms, uDecal: uDecal && 'value' in uDecal ? uDecal : { value: uDecal } },
    vertexShader: sh.vertexShader, fragmentShader: sh.fragmentShader,
    side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
  });
  return m;
}

// ---------------- the world's material (the road film) ----------------
// The world's palette has no car paints: kinds 52/53 (ui/garageSet.js CK) are the host's two colours, in the
// palette's terms — raw sRGB a little under (the khaki of GK.CARPAINT is #4e6b3c × 0.8), the night's ash and the
// day's colour made from it the way xNight/xDay make them from the garage kinds.
const DAY_RE = /vec3 dayC = [^;]*;/;
const PAINT = `
  if (k == 52 || k == 53) {
    vec3 cd = k == 52 ? uCarDye[0] : uCarDye[1];
    base = clamp(vec3(0.3) + cd * 1.2, 0.0, 1.0);
    dayC = cd * 1.25;
  }`;
const DECAL = `
  vec4 dcl = texture2D(uDecal, vDUv);
  if (dcl.a < 0.5) discard;
  base = clamp(vec3(0.3) + dcl.rgb * 0.96, 0.0, 1.0);
  dayC = dcl.rgb;`;

export function rawDye(hex, out = new THREE.Color()) {
  const s = String(hex || '#808080');
  const v = parseInt(s.slice(1, 7), 16) || 0;
  return out.setRGB(((v >> 16) & 255) / 255 * 0.8, ((v >> 8) & 255) / 255 * 0.8, (v & 255) / 255 * 0.8, THREE.LinearSRGBColorSpace);
}

export function carWorldMaterial(cc = ['#4e6b3c', '#8a6a48'], decalTex = null) {
  const m = createWorldMaterial();
  m.uniforms.uCarDye = { value: [rawDye(cc[0]), rawDye(cc[1])] };
  let frag = fragHead(m.fragmentShader, 'uniform vec3 uCarDye[2];\n' + (decalTex ? 'uniform sampler2D uDecal;\nvarying vec2 vDUv;\n' : ''));
  frag = after(frag, DAY_RE, PAINT + (decalTex ? DECAL : ''));
  m.fragmentShader = frag;
  if (decalTex) {
    m.vertexShader = vertWithUv(m.vertexShader);
    m.uniforms.uDecal = { value: decalTex };
    m.polygonOffset = true;
    m.polygonOffsetFactor = -1;
    m.polygonOffsetUnits = -4;
  } else m.side = THREE.DoubleSide; // (the Trueno's cabin is open now: its quads are seen from inside too)
  m.needsUpdate = true;
  return m;
}

// ---------------- the stickers themselves ----------------
const _tex = new Map(); // lookKey → { tex, users }
export function stickerTexture(look) {
  const l = cleanLook(look);
  const key = lookKey(l);
  let e = _tex.get(key);
  if (!e) {
    const tex = new THREE.DataTexture(stickerAtlas(l), 128, 128, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.NoColorSpace;
    tex.needsUpdate = true;
    e = { tex };
    _tex.set(key, e);
    if (_tex.size > 12) { // (old looks: let the oldest go)
      const [k0, e0] = _tex.entries().next().value;
      if (k0 !== key) { e0.tex.dispose(); _tex.delete(k0); }
    }
  }
  return e.tex;
}

// the sticker quads for a car model and a look, as a geometry (null: no stickers)
export function decalGeometry(model, look) {
  const l = cleanLook(look);
  if (!l.st.length || !model?.decals) return null;
  const a = decalArrays(model.decals, l);
  if (!a.count) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(a.dat, 4, true));
  g.setAttribute('uv', new THREE.BufferAttribute(a.uv, 2));
  g.computeBoundingSphere();
  return g;
}

// the windscreen's tint, for a renderer without a glass shader of its own (the film, the stills)
export function tintMaterial(tint) {
  const a = [0, 0.38, 0.6, 0.82][tint | 0] || 0;
  return new THREE.MeshBasicMaterial({ color: 0x0b0e12, transparent: true, opacity: a, depthWrite: false, side: THREE.DoubleSide });
}
