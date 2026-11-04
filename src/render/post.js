import { effectiveGraphics } from './graphicsSettings.js';
// Lightweight post pipeline: HDR scene -> bloom (1/4 res) -> composite with film grain,
// chromatic aberration, shockwave, glitch, ash grade (only red survives), tunnel vignette,
// fear flicker and tape-roll interference.
import * as THREE from 'three';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { shared } from './sonar.js';

// Reuse Three's tested edge search inside the existing composite, before grain and scanlines.
// No extra full-size framebuffer, and no multisampled half-float resolve.
const FXAA = FXAAShader.fragmentShader
  .slice(FXAAShader.fragmentShader.indexOf('#define EDGE_STEP_COUNT'), FXAAShader.fragmentShader.lastIndexOf('void main()'));


const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BRIGHT_FRAG = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
  c += texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = max(l - uThreshold, 0.0) / max(l, 1e-4);
  gl_FragColor = vec4(c * k, 1.0);
}
`;

const BLUR_FRAG = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
  c += texture2D(tSrc, vUv + uDir * 1.384615).rgb * 0.316216;
  c += texture2D(tSrc, vUv - uDir * 1.384615).rgb * 0.316216;
  c += texture2D(tSrc, vUv + uDir * 3.230769).rgb * 0.070270;
  c += texture2D(tSrc, vUv - uDir * 3.230769).rgb * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}
`;

// (4.0) light through the morning fog. For every pixel (at half size) the view ray is walked out through the
// fog to whatever the pixel shows, asking the sun's shadow map at each step "is the sun here?" — the lit steps
// scatter light toward you (more when you look toward the sun: Henyey–Greenstein), the shadowed ones take
// the sun's share out of the fog the world shader already put there. Out come the shafts between the trunks
// and the dark wedges of their shadows hanging in the milk. r: the light, g: the shade.
const RAYS_FRAG = /* glsl */ `
uniform sampler2D tDepth;
uniform sampler2D uSunMap;
uniform mat4 uSunMat;
uniform vec4 uSunK;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform float uDensity;
uniform float uMaxD;
uniform float uTime;
varying vec2 vUv;
float hashR(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float sunAt(vec3 p) {
  vec3 q = (uSunMat * vec4(p, 1.0)).xyz;
  if (q.x <= 0.0 || q.y <= 0.0 || q.x >= 1.0 || q.y >= 1.0 || q.z >= 1.0) return 1.0;
  vec4 t = texture2D(uSunMap, q.xy);
  return step(q.z - uSunK.w * 2.0, t.r + t.g / 255.0);
}
void main() {
  float z = texture2D(tDepth, vUv).r;
  vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
  vp.xyz /= vp.w;
  float dist = z >= 0.99999 ? 1e4 : length(vp.xyz);
  vec3 dir = normalize((uCamWorld * vec4(vp.xyz, 0.0)).xyz);
  float far = min(dist, uMaxD);
  const int N = 22;
  float dt = far / float(N);
  float jit = hashR(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0);
  float lit = 0.0, shade = 0.0;
  for (int i = 0; i < N; i++) {
    float t = (float(i) + jit) * dt;
    float w = exp(-uDensity * t);
    float s = sunAt(uCamPos + dir * t);
    lit += s * w;
    shade += (1.0 - s) * w;
  }
  float k = uDensity * dt;
  float mu = dot(dir, uSunDir), g = 0.5;
  float hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5);
  gl_FragColor = vec4(lit * k * hg, shade * k, 0.0, 1.0);
}
`;

const COMPOSITE_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uRes;
uniform float uTime;
uniform float uAberr;
uniform float uGrain;
uniform float uDanger;
uniform float uRed;
uniform float uWhite;
uniform float uGlitch;
uniform float uPsych;
uniform float uShockR;
uniform float uShockAmp;
uniform float uBloom;
uniform float uFade;
uniform float uWarm;
uniform float uFlicker;
uniform float uAsh;
uniform bool uAA;
uniform float uUserExposure;
uniform float uUserBloom;
uniform float uUserGrain;
uniform float uUserAberr;
uniform float uUserVignette;
uniform float uUserScanlines;
uniform float uUserFlicker;
uniform sampler2D tRays;
uniform float uRays;
uniform vec3 uRayC;
uniform vec3 uRayFog;
varying vec2 vUv;
${FXAA}
vec4 sceneSample(vec2 uv) {
  return uAA ? ApplyFXAA(tScene, 1.0 / uRes, uv) : texture2D(tScene, uv);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  // something close: the image starts to roll like a dying tape
  if (uDanger > 0.25) {
    float k = (uDanger - 0.25) * 1.33;
    float band = fract(uTime * 0.23);
    float yb = uv.y - band;
    float roll = exp(-yb * yb * 700.0);
    uv.x += roll * k * 0.01 * sin(uv.y * 380.0 + uTime * 40.0);
    uv.x += (hash12(vec2(floor(uv.y * 160.0), floor(uTime * 30.0))) - 0.5) * 0.0025 * k;
  }
  if (uGlitch > 0.001) {
    float line = floor(uv.y * 48.0);
    float g = hash12(vec2(line, floor(uTime * 24.0)));
    if (g < uGlitch * 0.55) uv.x += (hash12(vec2(line * 1.7, floor(uTime * 31.0))) - 0.5) * 0.09 * uGlitch;
    float block = step(1.0 - uGlitch * 0.08, hash12(floor(uv * vec2(12.0, 7.0)) + floor(uTime * 15.0)));
    uv += block * 0.02 * vec2(1.0, 0.0);
  }
  if (uPsych > 0.001) {
    // it has hold of you: the world leans in and breathes wrong (2.1s)
    vec2 pc = uv - 0.5;
    float br = sin(uTime * 6.3) * 0.5 + sin(uTime * 10.7) * 0.5;
    uv = 0.5 + pc * (1.0 - uPsych * 0.055 + uPsych * 0.035 * br);
    uv.x += uPsych * 0.004 * sin(uv.y * 44.0 + uTime * 8.0);
    uv.y += uPsych * 0.003 * sin(uv.x * 38.0 - uTime * 6.4);
  }
  vec2 c = uv - 0.5;
  c.x *= aspect;
  float dist = length(c);
  if (uShockAmp > 0.001) {
    float w = dist - uShockR;
    float ring = exp(-w * w * 260.0) * uShockAmp;
    vec2 dir = c / max(dist, 1e-4);
    uv -= dir * ring * 0.035 * vec2(1.0 / aspect, 1.0);
  }
  vec2 rd = uv - 0.5;
  float ab = uAberr * uUserAberr * (0.25 + dot(rd, rd) * 2.5) * 0.022;
  vec3 col;
  vec4 s0 = sceneSample(uv);
  col.r = ab < 0.00001 ? s0.r : sceneSample(uv + rd * ab).r;
  col.g = s0.g;
  col.b = ab < 0.00001 ? s0.b : sceneSample(uv - rd * ab).b;
  float ashK = clamp(s0.a, 0.0, 1.0); // the scene marks what a lamp lights in its own colours (alpha → 0)
  vec3 bl = texture2D(tBloom, uv).rgb;
  col += bl * uBloom * uUserBloom;
  if (uRays > 0.001) {
    // (4.0) the shafts (half size, so four taps smooth the march's dither away)
    vec2 tx = 1.0 / uRes;
    vec2 rr = (texture2D(tRays, uv + tx * vec2(-1.2, -0.6)).rg + texture2D(tRays, uv + tx * vec2(1.2, 0.6)).rg
      + texture2D(tRays, uv + tx * vec2(-0.6, 1.2)).rg + texture2D(tRays, uv + tx * vec2(0.6, -1.2)).rg) * 0.25;
    col = max(col + (uRayC * rr.r - uRayFog * rr.g) * uRays, 0.0);
  }

  // tone: filmic shoulder, crushed toe — shadows fall into true black
  // (in daylight the toe and the tunnel let go: the world is open)
  col = 1.0 - exp(-col * uUserExposure * (1.4 + 0.35 * uWarm));
  col = max(col - 0.01, 0.0) * 1.01;
  col = pow(col, vec3(1.15 - 0.17 * uWarm));
  // the forest is ash; only blood (and amber) keeps its colour
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float redness = clamp((col.r - col.b) * 2.2 - 0.08, 0.0, 1.0);
  vec3 ash = vec3(lum) * vec3(0.9, 0.98, 1.05);
  col = mix(col, mix(ash, col, redness), uAsh * ashK);
  col = mix(col, col * vec3(1.06, 0.98, 0.9), uWarm);

  // tunnel vision: the dark closes in when something is near
  float vig = smoothstep(1.02 - uDanger * 0.32, 0.1, dist);
  col *= mix(1.0, vig, uUserVignette * 0.92 * (1.0 - 0.72 * uWarm));
  float beat = 0.6 + 0.4 * sin(uTime * 6.0);
  col += vec3(0.3, 0.0, 0.01) * uDanger * (1.0 - vig) * beat;

  if (uPsych > 0.001) {
    float pl = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(pl) * vec3(0.85, 0.95, 1.12), uPsych * 0.6); // the colour leaves first
    float pulse = 0.5 + 0.5 * sin(uTime * 9.0);
    col *= 1.0 - uPsych * (0.28 + 0.3 * pulse) * smoothstep(0.25, 0.95, dist); // the edges close in, breathing with it
    float slice = step(0.986 - uPsych * 0.05, hash12(vec2(floor(uv.y * 22.0), floor(uTime * 13.0))));
    col = mix(col, 1.0 - col, slice * uPsych * 0.7); // now and then a band of the world is inverted, for a blink
  }

  col = mix(col, vec3(0.62, 0.015, 0.01), clamp(uRed, 0.0, 1.0) * 0.5);
  col += vec3(uWhite);

  // grain: the darkness is never empty
  float n = hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 917.0);
  col += (n - 0.5) * uGrain * uUserGrain * (0.75 + 0.5 * (1.0 - clamp(lum * 3.0, 0.0, 1.0)));
  col *= mix(1.0, 0.965 + 0.035 * sin(gl_FragCoord.y * 3.14159 + uTime * 2.0), uUserScanlines);
  // slow film breathing + fear flicker
  col *= mix(1.0, 0.975 + 0.025 * sin(uTime * 1.7 + sin(uTime * 0.37) * 3.0), uUserFlicker) * (1.0 - uFlicker * uUserFlicker);
  col *= uFade;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    const opts = { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.rtScene = new THREE.WebGLRenderTarget(4, 4, opts);
    const bo = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.rtA = new THREE.WebGLRenderTarget(4, 4, bo);
    this.rtB = new THREE.WebGLRenderTarget(4, 4, bo);

    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    this.quad = new THREE.Mesh(geo);
    this.quad.frustumCulled = false;
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.quad);

    this.bright = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 0.5 } },
      vertexShader: FS_VERT, fragmentShader: BRIGHT_FRAG, depthTest: false, depthWrite: false,
    });
    this.blur = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: FS_VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false,
    });
    this.comp = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: this.rtScene.texture },
        tBloom: { value: this.rtA.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uAberr: { value: 0.15 },
        uGrain: { value: 0.05 },
        uDanger: { value: 0 },
        uRed: { value: 0 },
        uWhite: { value: 0 },
        uGlitch: { value: 0 },
        uPsych: { value: 0 },
        uShockR: { value: 0 },
        uShockAmp: { value: 0 },
        uBloom: { value: 0.8 },
        uFade: { value: 1 },
        uWarm: { value: 0 },
        uFlicker: { value: 0 },
        uAsh: { value: 0.62 },
        uAA: { value: true },
        uUserExposure: { value: 1 }, uUserBloom: { value: 1 }, uUserGrain: { value: 1 },
        uUserAberr: { value: 1 }, uUserVignette: { value: 1 }, uUserScanlines: { value: 1 }, uUserFlicker: { value: 1 },
        tRays: { value: null }, uRays: { value: 0 },
        uRayC: { value: new THREE.Color(1.0, 0.86, 0.66) }, uRayFog: { value: new THREE.Color(0.3, 0.31, 0.33) },
      },
      vertexShader: FS_VERT, fragmentShader: COMPOSITE_FRAG, depthTest: false, depthWrite: false,
    });
    // (4.0) the morning's light shafts: the scene's depth (to know how far each ray goes) and a half-size target
    this.rtScene.depthTexture = new THREE.DepthTexture(4, 4);
    this.rtRays = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.rays = new THREE.ShaderMaterial({
      uniforms: {
        tDepth: { value: this.rtScene.depthTexture },
        uSunMap: shared.uSunMap, uSunMat: shared.uSunMat, uSunK: shared.uSunK,
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
        uCamPos: { value: new THREE.Vector3() }, uSunDir: shared.uSun,
        uDensity: { value: 0.04 }, uMaxD: { value: 70 }, uTime: { value: 0 },
      },
      vertexShader: FS_VERT, fragmentShader: RAYS_FRAG, depthTest: false, depthWrite: false,
    });
    this.raysOn = true;
    this.comp.uniforms.tRays.value = this.rtRays.texture;
    this.u = this.comp.uniforms;
    this.w = 1;
    this.h = 1;
  }

  // Never enable half-float MSAA again through a caller or a quality switch. Keeping the target
  // single-sampled is the fix; FXAA is a shader setting, not a new allocation.
  setSamples() { this.rtScene.samples = 0; }
  setAntialias(on) { this.u.uAA.value = !!on; }
  dropSamples() { this.setSamples(); }

  setGraphics(raw) {
    const g = effectiveGraphics(raw);
    for (const [key, value] of Object.entries({ Exposure: g.exposure, Bloom: g.bloom, Grain: g.grain,
      Aberr: g.aberration, Vignette: g.vignette, Scanlines: +g.scanlines, Flicker: +g.flicker })) {
      this.u['uUser' + key].value = value;
    }
  }

  setSize(cssW, cssH, scale) {
    const w = Math.max(2, Math.round(cssW * scale));
    const h = Math.max(2, Math.round(cssH * scale));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.rtScene.setSize(w, h);
    const bw = Math.max(2, w >> 2), bh = Math.max(2, h >> 2);
    this.rtA.setSize(bw, bh);
    this.rtB.setSize(bw, bh);
    this.rtRays.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1));
    this.u.uRes.value.set(w, h);
    this.bloomW = bw;
    this.bloomH = bh;
  }

  setRays(on) { this.raysOn = !!on; }

  // (4.0) how strong the shafts are this frame: the morning's milk (uFog · uMorning) is where they live; the clear
  // victory dawn has a faint haze of them; at night there's no sun and no pass at all
  _raysStrength() {
    if (!this.raysOn || shared.uSunK.value.x <= 0) return 0;
    const dawn = shared.uDawn.value, milk = shared.uFog.value * shared.uMorning.value;
    return dawn * (0.35 + 0.65 * milk);
  }

  _pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.fsScene, this.cam);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.rtScene);
    r.clear();
    r.render(scene, camera);

    const rays = this._raysStrength();
    this.u.uRays.value = rays;
    if (rays > 0.001) {
      const R = this.rays.uniforms, milk = shared.uFog.value * shared.uMorning.value;
      R.uInvProj.value.copy(camera.projectionMatrixInverse);
      R.uCamWorld.value.copy(camera.matrixWorld);
      R.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
      // (the same fog the world shader draws: sonar.js — milk 0.05 a metre, the clear dawn 0.016)
      R.uDensity.value = 0.016 + (0.05 - 0.016) * milk;
      R.uTime.value = this.u.uTime.value;
      this._pass(this.rays, this.rtRays);
    }

    if (this.u.uBloom.value * this.u.uUserBloom.value > 0) {
      this.bright.uniforms.tSrc.value = this.rtScene.texture;
      this.bright.uniforms.uTexel.value.set(1 / this.w, 1 / this.h);
      this._pass(this.bright, this.rtA);
      for (let i = 0; i < 2; i++) {
        const s = i === 0 ? 1 : 2;
        this.blur.uniforms.tSrc.value = this.rtA.texture;
        this.blur.uniforms.uDir.value.set(s / this.bloomW, 0);
        this._pass(this.blur, this.rtB);
        this.blur.uniforms.tSrc.value = this.rtB.texture;
        this.blur.uniforms.uDir.value.set(0, s / this.bloomH);
        this._pass(this.blur, this.rtA);
      }
    }
    this._pass(this.comp, null);
  }

  // (3.0z) the reel's eye: the finished picture drawn once more, small, into a target of its own (8-bit RGBA) that
  // main.js reads back with a fence instead of copying the full-size canvas. One fullscreen pass at ~640×360.
  // (4.0: `slot` — the camera's frame has a target of its own, so a reel grab still being read is never resized)
  capture(w, h, slot = 'rtGrab') {
    if (!this[slot]) this[slot] = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false });
    else if (this[slot].width !== w || this[slot].height !== h) this[slot].setSize(w, h);
    this._pass(this.comp, this[slot]);
    this.renderer.setRenderTarget(null);
    return this[slot];
  }
}
