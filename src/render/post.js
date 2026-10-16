// Lightweight post pipeline: HDR scene -> bloom (1/4 res) -> composite with film grain,
// chromatic aberration, shockwave, glitch, ash grade (only red survives), tunnel vignette,
// fear flicker and tape-roll interference.
import * as THREE from 'three';

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
uniform float uShockR;
uniform float uShockAmp;
uniform float uBloom;
uniform float uFade;
uniform float uWarm;
uniform float uFlicker;
uniform float uAsh;
varying vec2 vUv;

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
  float ab = uAberr * (0.25 + dot(rd, rd) * 2.5) * 0.022;
  vec3 col;
  col.r = texture2D(tScene, uv + rd * ab).r;
  col.g = texture2D(tScene, uv).g;
  col.b = texture2D(tScene, uv - rd * ab).b;
  vec3 bl = texture2D(tBloom, uv).rgb;
  col += bl * uBloom;

  // tone: filmic shoulder, crushed toe — shadows fall into true black
  // (in daylight the toe and the tunnel let go: the world is open)
  col = 1.0 - exp(-col * (1.4 + 0.35 * uWarm));
  col = max(col - 0.01, 0.0) * 1.01;
  col = pow(col, vec3(1.15 - 0.17 * uWarm));
  // the forest is ash; only blood (and amber) keeps its colour
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float redness = clamp((col.r - col.b) * 2.2 - 0.08, 0.0, 1.0);
  vec3 ash = vec3(lum) * vec3(0.9, 0.98, 1.05);
  col = mix(col, mix(ash, col, redness), uAsh);
  col = mix(col, col * vec3(1.06, 0.98, 0.9), uWarm);

  // tunnel vision: the dark closes in when something is near
  float vig = smoothstep(1.02 - uDanger * 0.32, 0.1, dist);
  col *= mix(1.0, vig, 0.92 * (1.0 - 0.72 * uWarm));
  float beat = 0.6 + 0.4 * sin(uTime * 6.0);
  col += vec3(0.3, 0.0, 0.01) * uDanger * (1.0 - vig) * beat;

  col = mix(col, vec3(0.62, 0.015, 0.01), clamp(uRed, 0.0, 1.0) * 0.5);
  col += vec3(uWhite);

  // grain: the darkness is never empty
  float n = hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 917.0);
  col += (n - 0.5) * uGrain * (0.75 + 0.5 * (1.0 - clamp(lum * 3.0, 0.0, 1.0)));
  col *= 0.965 + 0.035 * sin(gl_FragCoord.y * 3.14159 + uTime * 2.0);
  // slow film breathing + fear flicker
  col *= (0.975 + 0.025 * sin(uTime * 1.7 + sin(uTime * 0.37) * 3.0)) * (1.0 - uFlicker);
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
        uShockR: { value: 0 },
        uShockAmp: { value: 0 },
        uBloom: { value: 0.8 },
        uFade: { value: 1 },
        uWarm: { value: 0 },
        uFlicker: { value: 0 },
        uAsh: { value: 0.62 },
      },
      vertexShader: FS_VERT, fragmentShader: COMPOSITE_FRAG, depthTest: false, depthWrite: false,
    });
    this.u = this.comp.uniforms;
    this.w = 1;
    this.h = 1;
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
    this.u.uRes.value.set(w, h);
    this.bloomW = bw;
    this.bloomH = bh;
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
    this._pass(this.comp, null);
  }
}
