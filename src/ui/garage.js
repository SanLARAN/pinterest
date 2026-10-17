// The co-op lobby, in 3D: a garage at night. Everyone who joins the room takes their place — the host at the
// wheel of the УАЗ, the next on a chair with a thermos cup, the next leaning by the wicket door with a smoke,
// the last on one knee packing a rucksack (again). When the host presses START the engine turns over, catches,
// the headlights flare on the gates — and the night begins.
//
// Drawn with the game's main renderer and post chain (no extra WebGL context): the menu's forest just isn't
// rendered while the lobby is open. Same faceted wire-on-faces look as everything else, but lit — a bulb under
// a tin shade, moonlight through the gap, a lantern, the dash, an ember.
import * as THREE from 'three';
import { EDGE_GLSL } from '../render/sonar.js';
import { Particles } from '../render/particles.js';
import { clamp, lerp, damp } from '../core/rng.js';
import { buildSurvivor, dyeColors } from '../game/survivor.js';
import { cleanFit, shapeKey, item } from '../game/outfit.js';
import {
  ROOM, GATE, WIN, CAR, BULB, BULB_LOCAL, BULB2, BULB2_LOCAL, CARP, SPOTS, LANTERN_AT, DRUM_AT, ITEM_SPOTS, PACK,
  buildRoom, buildCeiling, buildWicket, buildProps, buildBulb, buildBulb2, buildCarBody, buildCarWheels, buildCarGlass, buildSteering,
  buildItems, buildPack, buildPackFlap, buildCigarette, buildCup, buildLighter, buildFlame, buildPasser,
} from './garageSet.js';

const PI = Math.PI;
const VERT = /* glsl */ `
attribute vec4 data;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vBary = data.xyz;
  vKind = floor(data.w * 255.0 + 0.5);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
${EDGE_GLSL}
uniform float uTime;
uniform vec3 uCam;
uniform vec4 uPing;
uniform vec2 uPingK;
uniform vec4 uBulb;     // the hanging bulb: xyz, brightness
uniform vec4 uBulb2;    // the bare one over the right half
uniform vec4 uLamp;     // the clamp lamp over the bench
uniform vec4 uLantern;  // the packer's lantern
uniform vec4 uGap;      // moonlight through the wicket door
uniform vec4 uWin;      // ...and through the window
uniform float uSky;     // the night outside (lightning lifts it)
uniform vec3 uHeadP0;
uniform vec3 uHeadP1;
uniform vec3 uHeadD;
uniform float uHeadI;
uniform vec4 uTail;
uniform vec4 uDash;
uniform vec4 uEmber;
uniform vec4 uFlame;
uniform float uAmb;
uniform vec4 uFill;     // a soft cool fill from the camera's side: xyz direction, strength
uniform float uFade;
uniform float uNoise;
uniform vec4 uBlob[10]; // contact shadows on the floor: x, z, radius, strength
uniform vec4 uCarBox;   // the car's shadow: centre x, z, half length, half width
uniform vec3 uDye[4];
uniform vec4 uGlow;
uniform vec3 uGlowCol;
uniform float uHover;
uniform float uAppear;  // 1 = here; 0..1 = materialising from the feet up
uniform vec2 uAppearY;
uniform float uAlpha;   // < 1: glass
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;

// what things are made of, on a person (as in the wardrobe)
const vec3 PAL[12] = vec3[12](
  vec3(0.30, 0.33, 0.35), vec3(0.36, 0.25, 0.17), vec3(0.34, 0.50, 0.24), vec3(0.19, 0.19, 0.21),
  vec3(0.44, 0.40, 0.33), vec3(0.60, 0.64, 0.68), vec3(0.78, 0.13, 0.10), vec3(0.84, 0.66, 0.56),
  vec3(0.86, 0.80, 0.70), vec3(1.00, 0.86, 0.55), vec3(0.22, 0.32, 0.48), vec3(1.00, 0.70, 0.25)
);
// ...and in the garage (kinds 19…47)
const vec3 GPAL[31] = vec3[31](
  vec3(0.30, 0.30, 0.29),  // concrete
  vec3(0.46, 0.45, 0.42),  // block, whitewashed long ago
  vec3(0.15, 0.23, 0.23),  // oil paint on the lower wall
  vec3(0.25, 0.29, 0.16),  // УАЗ khaki
  vec3(0.72, 0.74, 0.76),  // chrome
  vec3(0.07, 0.07, 0.075), // rubber
  vec3(0.09, 0.09, 0.095), // dark
  vec3(0.75, 0.74, 0.66),  // headlamp glass
  vec3(0.42, 0.05, 0.04),  // tail lamp
  vec3(1.00, 0.85, 0.60),  // bulb
  vec3(1.00, 0.45, 0.15),  // ember
  vec3(0.17, 0.27, 0.19),  // gate green
  vec3(0.36, 0.20, 0.11),  // rust
  vec3(0.07, 0.11, 0.21),  // the night outside
  vec3(0.12, 0.16, 0.12),  // dash glass
  vec3(0.80, 0.75, 0.62),  // paper
  vec3(0.30, 0.33, 0.22),  // canvas
  vec3(0.62, 0.62, 0.60),  // tin
  vec3(0.60, 0.09, 0.06),  // red paint
  vec3(0.17, 0.11, 0.08),  // seat
  vec3(0.035, 0.035, 0.04),// oil
  vec3(0.24, 0.17, 0.11),  // dark wood
  vec3(1.00, 0.70, 0.35),  // lantern glass
  vec3(1.00, 0.60, 0.22),  // radio dial
  vec3(0.0, 0.0, 0.0),     // the thing outside
  vec3(1.00, 0.75, 0.35),  // flame
  vec3(0.55, 0.62, 0.66),  // glass
  vec3(0.70, 0.52, 0.12),  // yellow paint
  vec3(0.75, 0.10, 0.08),  // red marks
  vec3(1.00, 0.85, 0.60),  // the bare bulb
  vec3(0.045, 0.065, 0.12) // the yard outside, under the moon
);

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 near(vec3 lp, float I, float k, vec3 col, vec3 N) {
  vec3 L = lp - vWorld;
  float d2 = dot(L, L);
  return col * I * (0.3 + 0.7 * max(dot(N, L * inversesqrt(max(d2, 1e-5))), 0.0)) / (1.0 + d2 * k);
}

void main() {
  int k = int(vKind + 0.5);
  if (uAppear < 0.999) {
    float h = mix(uAppearY.x, uAppearY.y, uAppear);
    if (vWorld.y > h + (hash13(floor(vWorld * 37.0)) - 0.5) * 0.12) discard;
  }
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  vec3 V = normalize(toCam);
  if (dot(N, V) < 0.0) N = -N;
  vec3 base = k < 12 ? PAL[k] : k < 19 ? ((k == 13) ? uDye[0] : (k == 14 || k == 17) ? uDye[1] : (k == 15) ? uDye[2] : uDye[3]) : GPAL[clamp(k - 19, 0, 30)];

  // the echo: a wavefront, a flash, an afterglow (a voice doesn't light the whole garage)
  float age = uTime - uPing.w;
  float d = length(vWorld - uPing.xyz);
  float front = age * uPingK.x - d;
  float ring = age >= 0.0 ? exp(-(front * front) / (uPingK.y * uPingK.y)) : 0.0;
  float since = max(front, 0.0) / uPingK.x;
  float lit = front > 0.0 ? 0.5 * exp(-since * 1.6) + 0.25 * exp(-since * 0.45) : 0.0;
  float reach = 1.0 - smoothstep(5.0, 10.0, d);
  ring *= reach;
  lit *= reach;

  vec3 light = vec3(0.0);
  float spec = 0.0;
  // the bulb under its tin shade: down and out, hardly up
  {
    vec3 L = uBulb.xyz - vWorld;
    float d2 = dot(L, L);
    vec3 l = L * inversesqrt(d2);
    float shade = 0.18 + 0.82 * smoothstep(0.06, 0.5, l.y);
    float I = uBulb.w * shade / (1.0 + d2 * 0.09);
    light += vec3(1.0, 0.7, 0.42) * I * (0.12 + 0.88 * max(dot(N, l), 0.0));
    spec += I * pow(max(dot(N, normalize(l + V)), 0.0), 48.0);
  }
  // the bare bulb: all around, weaker
  {
    vec3 L = uBulb2.xyz - vWorld;
    float d2 = dot(L, L);
    vec3 l = L * inversesqrt(d2);
    float I = uBulb2.w / (1.0 + d2 * 0.22);
    light += vec3(1.0, 0.74, 0.48) * I * (0.15 + 0.85 * max(dot(N, l), 0.0));
    spec += I * 0.6 * pow(max(dot(N, normalize(l + V)), 0.0), 48.0);
  }
  // the clamp lamp: a tight cone onto the bench
  {
    vec3 L = uLamp.xyz - vWorld;
    float d2 = dot(L, L);
    vec3 l = L * inversesqrt(d2);
    light += vec3(1.0, 0.82, 0.6) * uLamp.w * smoothstep(0.55, 0.85, l.y) * (0.2 + 0.8 * max(dot(N, l), 0.0)) / (1.0 + d2 * 1.6);
  }
  light += near(uLantern.xyz, uLantern.w, 0.7, vec3(1.0, 0.6, 0.28), N);
  // moonlight: the gap of the wicket door, the window
  {
    vec3 L = uGap.xyz - vWorld;
    float d2 = dot(L, L);
    vec3 l = L * inversesqrt(d2);
    float into = smoothstep(-0.2, 0.7, dot(-l, normalize(vec3(1.0, -0.45, 0.1))));
    light += vec3(0.42, 0.56, 0.95) * uGap.w * uSky * into * (0.15 + 0.85 * max(dot(N, l), 0.0)) / (1.0 + d2 * 0.35);
    vec3 W = uWin.xyz - vWorld;
    float w2 = dot(W, W);
    vec3 w = W * inversesqrt(w2);
    float inw = smoothstep(-0.1, 0.8, dot(-w, normalize(vec3(0.0, -0.55, 1.0))));
    light += vec3(0.42, 0.56, 0.95) * uWin.w * uSky * inw * (0.15 + 0.85 * max(dot(N, w), 0.0)) / (1.0 + w2 * 0.3);
  }
  if (uHeadI > 0.001) {
    for (int i = 0; i < 2; i++) {
      vec3 hp = i == 0 ? uHeadP0 : uHeadP1;
      vec3 L = vWorld - hp;
      float d2 = dot(L, L);
      vec3 l = L * inversesqrt(d2);
      float cone = smoothstep(0.72, 0.93, dot(l, uHeadD)) + 0.05;
      float I = uHeadI * cone * 2.4 / (1.0 + d2 * 0.07);
      light += vec3(1.0, 0.93, 0.78) * I * max(dot(N, -l), 0.0);
      spec += I * 0.6 * pow(max(dot(N, normalize(-l + V)), 0.0), 40.0);
    }
  }
  light += near(uTail.xyz, uTail.w * 0.6, 4.0, vec3(1.0, 0.12, 0.06), N);
  light += near(uDash.xyz, uDash.w * 0.35, 9.0, vec3(0.55, 1.0, 0.65), N);
  light += near(uEmber.xyz, uEmber.w * 0.22, 30.0, vec3(1.0, 0.42, 0.12), N);
  light += near(uFlame.xyz, uFlame.w, 2.5, vec3(1.0, 0.7, 0.35), N);
  if (uGlow.w > 0.0) {
    vec3 gd = uGlow.xyz - vWorld;
    float gl = length(gd);
    light += uGlowCol * uGlow.w * (0.3 + 0.7 * max(dot(N, gd / max(gl, 0.001)), 0.0)) * (1.0 - smoothstep(0.0, 0.6, gl));
  }
  light += vec3(0.42, 0.5, 0.62) * uAmb * (0.55 + 0.45 * N.y);
  light += vec3(0.55, 0.62, 0.75) * uFill.w * (0.25 + 0.75 * max(dot(N, uFill.xyz), 0.0));
  light += vec3(0.75, 0.84, 0.92) * lit * 0.35;

  // contact shadows, dirt in the corners
  float occ = 1.0;
  if (vWorld.y < 0.03) {
    for (int i = 0; i < 10; i++) {
      vec4 b = uBlob[i];
      if (b.w <= 0.0) continue;
      float r = length(vWorld.xz - b.xy) / b.z;
      occ *= 1.0 - b.w * (1.0 - smoothstep(0.25, 1.0, r));
    }
    vec2 q = abs(vWorld.xz - uCarBox.xy) - uCarBox.zw;
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    occ *= 1.0 - 0.8 * (1.0 - smoothstep(-0.3, 0.45, sd));
    float wall = min(min(vWorld.x + 4.3, 4.3 - vWorld.x), vWorld.z + 3.2);
    occ *= 0.62 + 0.38 * smoothstep(0.0, 0.7, wall);
  } else if (k == 20 || k == 21) {
    occ *= 0.6 + 0.4 * smoothstep(0.0, 0.6, vWorld.y);
  }
  light *= occ;
  spec *= occ;

  float shin = (k == 22 || k == 23 || k == 26 || k == 45 || k == 5 || k == 36) ? 1.0 : (k == 24 || k == 39 || k == 37) ? 0.4 : 0.0;
  float edge = edgeFactor(vBary, 1.0);
  float dash = hash13(floor(vWorld * uNoise));
  edge *= 0.55 + 0.45 * smoothstep(0.1, 0.6, dash);
  float st = hash13(floor(vWorld * uNoise * 1.7));
  float lum = dot(light, vec3(0.3, 0.5, 0.2));

  vec3 col = base * light * (0.8 + 0.2 * st);
  col += spec * shin * vec3(1.0, 0.9, 0.75) * 0.5;
  col += base * edge * (0.05 + 0.3 * min(lum, 1.5) + 0.35 * uHover + 0.8 * lit + 1.3 * ring);
  col += vec3(0.78, 0.85, 0.9) * ring * edge * 0.45;
  col += vec3(0.6, 0.8, 0.9) * uHover * edge * 0.25;

  if (k == 17 || k == 18) {
    float fl = 0.86 + 0.14 * sin(uTime * 9.0 + vWorld.y * 40.0) * sin(uTime * 5.3);
    col = base * 1.45 * fl + vec3(0.25) * fl;
  } else if (k == 9) col = base * 1.6;
  else if (k == 26) col += vec3(1.0, 0.95, 0.82) * 4.5 * uHeadI;
  else if (k == 27) col += vec3(1.0, 0.1, 0.05) * 2.6 * uTail.w;
  else if (k == 28) col = vec3(1.0, 0.8, 0.52) * (0.3 + 2.8 * uBulb.w);
  else if (k == 48) col = vec3(1.0, 0.82, 0.56) * (0.2 + 4.0 * uBulb2.w);
  else if (k == 49) col = base * uSky * (0.8 + 0.2 * st) + base * edge * 0.3;
  else if (k == 29) col = vec3(1.0, 0.34, 0.08) * (0.25 + 3.2 * uEmber.w);
  else if (k == 32) col = base * uSky * mix(1.2, 0.45, smoothstep(0.2, 3.5, vWorld.y)) + base * edge * 0.15;
  else if (k == 33) col += vec3(0.5, 1.0, 0.55) * 1.6 * uDash.w;
  else if (k == 41) col = vec3(1.0, 0.62, 0.28) * (0.2 + 2.6 * uLantern.w);
  else if (k == 42) col = vec3(1.0, 0.6, 0.22) * 0.85;
  else if (k == 43) col = vec3(0.0);
  else if (k == 44) col = vec3(1.0, 0.72, 0.36) * 3.6;

  float a = 1.0;
  if (uAlpha < 0.999) {
    float facing = clamp(dot(N, V), 0.0, 1.0);
    a = uAlpha * (0.35 + 0.65 * pow(1.0 - facing, 2.0)) + spec * 0.35;
    col = vec3(0.5, 0.6, 0.66) * (0.08 + lum * 0.4) + spec * vec3(1.0, 0.9, 0.75) * 0.6;
  }
  gl_FragColor = vec4(col * uFade, clamp(a, 0.0, 1.0));
}
`;

// soft light in dusty air: headlight cones, the cone under the bulb, the moonlight shaft
const BEAM_VERT = /* glsl */ `
uniform float uLen;
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  vAlong = clamp(-position.y / uLen, 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uI;
uniform float uFade;
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = abs(dot(normalize(vN), normalize(vV)));
  float a = pow(f, 1.8) * pow(1.0 - vAlong, 1.3) * smoothstep(0.0, 0.08, vAlong) * uI;
  gl_FragColor = vec4(uColor * a * uFade, 1.0);
}
`;

// dust motes drifting in the light (all on the GPU)
const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform vec4 uBulb;
uniform vec3 uHeadP0;
uniform vec3 uHeadD;
uniform float uHeadI;
uniform float uPix;
varying float vB;
void main() {
  vec3 p = position;
  float s = aSeed * 6.2831;
  p += vec3(sin(uTime * 0.11 + s * 3.0), sin(uTime * 0.07 + s * 5.0) * 0.6, cos(uTime * 0.09 + s * 7.0)) * 0.22;
  vec3 L = p - uBulb.xyz;
  float b = uBulb.w * smoothstep(0.2, 0.7, -L.y / max(length(L), 0.001)) / (1.0 + dot(L, L) * 0.5);
  vec3 H = p - uHeadP0;
  b += uHeadI * smoothstep(0.75, 0.95, dot(normalize(H), uHeadD)) / (1.0 + dot(H, H) * 0.12) * 1.4;
  vB = b * (0.5 + 0.5 * sin(uTime * (1.0 + aSeed) + s * 9.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(0.018 * uPix / max(-mv.z, 0.2), 1.0, 4.0);
}
`;
const DUST_FRAG = /* glsl */ `
uniform float uFade;
varying float vB;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vB;
  gl_FragColor = vec4(vec3(1.0, 0.85, 0.65) * a * 0.9 * uFade, 1.0);
}
`;

// smoke and steam: soft puffs that grow and fade (alpha blended, unlike the additive sparks)
const SMOKE_VERT = /* glsl */ `
attribute vec4 aCol; // rgb + alpha
attribute float aSize;
uniform float uPix;
varying vec4 vCol;
void main() {
  vCol = aCol;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPix / max(-mv.z, 0.2), 1.0, 160.0);
}
`;
const SMOKE_FRAG = /* glsl */ `
uniform float uFade;
varying vec4 vCol;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.05, d);
  a *= 0.75 + 0.25 * sin(c.x * 17.0 + c.y * 11.0);
  gl_FragColor = vec4(vCol.rgb * uFade, vCol.a * a * uFade);
}
`;

class Smoke {
  constructor(scene, max = 220) {
    this.max = max;
    this.n = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.age = new Float32Array(max);
    this.life = new Float32Array(max);
    this.s0 = new Float32Array(max);
    this.s1 = new Float32Array(max);
    this.a0 = new Float32Array(max);
    this.rise = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.base = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.ca = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    this.sa = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa);
    g.setAttribute('aCol', this.ca);
    g.setAttribute('aSize', this.sa);
    g.setDrawRange(0, 0);
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uPix: { value: 600 }, uFade: { value: 1 } },
      vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
    scene.add(this.points);
    this.pull = null; // a draught: { x, y, z, r, k } drags smoke toward the gap
  }
  clear() {
    this.n = 0;
    this.geo.setDrawRange(0, 0);
  }
  // o: life, s0, s1 (sizes, m), a (alpha), rise (m/s²), drag, col [r,g,b], jitter
  emit(x, y, z, vx, vy, vz, o = {}) {
    if (this.n >= this.max) return;
    const i = this.n++;
    const j = o.jitter ?? 0.15;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx + (Math.random() - 0.5) * j;
    this.vel[i * 3 + 1] = vy + (Math.random() - 0.5) * j;
    this.vel[i * 3 + 2] = vz + (Math.random() - 0.5) * j;
    this.age[i] = 0;
    this.life[i] = (o.life ?? 2.5) * (0.8 + Math.random() * 0.4);
    this.s0[i] = o.s0 ?? 0.05;
    this.s1[i] = (o.s1 ?? 0.4) * (0.8 + Math.random() * 0.4);
    this.a0[i] = o.a ?? 0.25;
    this.rise[i] = o.rise ?? 0.15;
    this.drag[i] = o.drag ?? 1.2;
    const c = o.col || [0.6, 0.6, 0.62];
    this.base[i * 3] = c[0]; this.base[i * 3 + 1] = c[1]; this.base[i * 3 + 2] = c[2];
  }
  _kill(i) {
    const l = --this.n;
    if (i === l) return;
    for (let c = 0; c < 3; c++) {
      this.pos[i * 3 + c] = this.pos[l * 3 + c];
      this.vel[i * 3 + c] = this.vel[l * 3 + c];
      this.base[i * 3 + c] = this.base[l * 3 + c];
    }
    this.age[i] = this.age[l]; this.life[i] = this.life[l]; this.s0[i] = this.s0[l]; this.s1[i] = this.s1[l];
    this.a0[i] = this.a0[l]; this.rise[i] = this.rise[l]; this.drag[i] = this.drag[l];
  }
  update(dt, pix, fade) {
    this.mat.uniforms.uPix.value = pix;
    this.mat.uniforms.uFade.value = fade;
    const P = this.pull;
    for (let i = this.n - 1; i >= 0; i--) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        this._kill(i);
        continue;
      }
      const dk = Math.exp(-this.drag[i] * dt);
      let ax = 0, az = 0;
      if (P) {
        const dx = P.x - this.pos[i * 3], dy = P.y - this.pos[i * 3 + 1], dz = P.z - this.pos[i * 3 + 2];
        const d = Math.hypot(dx, dy, dz);
        if (d < P.r && d > 0.01) {
          const s = P.k * (1 - d / P.r) / d;
          ax = dx * s;
          az = dz * s;
          this.vel[i * 3 + 1] += dy * s * dt * 0.3;
        }
      }
      this.vel[i * 3] = this.vel[i * 3] * dk + ax * dt;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dk + this.rise[i] * dt;
      this.vel[i * 3 + 2] = this.vel[i * 3 + 2] * dk + az * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    for (let i = 0; i < this.n; i++) {
      const x = this.age[i] / this.life[i];
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * Math.sqrt(x);
      const a = this.a0[i] * Math.min(1, x * 8) * (1 - x) * (1 - x);
      this.col[i * 4] = this.base[i * 3]; this.col[i * 4 + 1] = this.base[i * 3 + 1]; this.col[i * 4 + 2] = this.base[i * 3 + 2];
      this.col[i * 4 + 3] = a;
    }
    this.geo.setDrawRange(0, this.n);
    if (this.n) {
      this.pa.clearUpdateRanges(); this.pa.addUpdateRange(0, this.n * 3); this.pa.needsUpdate = true;
      this.ca.clearUpdateRanges(); this.ca.addUpdateRange(0, this.n * 4); this.ca.needsUpdate = true;
      this.sa.clearUpdateRanges(); this.sa.addUpdateRange(0, this.n); this.sa.needsUpdate = true;
    }
  }
}

// ---------------- helpers ----------------
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const seg = (t, a, b) => ease((t - a) / (b - a)); // 0 → 1 between a and b
const bell = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d)); // up over a→b, down over c→d
const rnd = (a, b) => a + Math.random() * (b - a);
function geometryFrom(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}
const FORE_DIR = new THREE.Vector3(0, -0.27, 0.06).normalize();
const HAND = new THREE.Vector3(0, -0.305, 0.066); // the hand, in the forearm's frame
const Z = new THREE.Vector3(0, 0, 1);
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3();
const _h = new THREE.Vector3(), _w = new THREE.Vector3(), _w2 = new THREE.Vector3(), _pole = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();

// two-bone IK: a hand (A = 'L' | 'R') to the world point W, the elbow toward `pole` (chest space), blended by k
function reach(rig, A, W, pole, k = 1) {
  if (k <= 0.001) return;
  const n = rig.nodes, sh = n['sh' + A], el = n['el' + A];
  const H = n.chest.worldToLocal(_h.copy(W));
  const S = sh.position;
  const L1 = el.position.length(), L2 = 0.31;
  const D = _v1.copy(H).sub(S);
  const d = clamp(D.length(), 0.05, L1 + L2 - 0.002);
  const u = D.normalize();
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const v = _v2.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
  const E = _v3.copy(S).addScaledVector(u, L1 * Math.cos(a)).addScaledVector(v, L1 * Math.sin(a));
  _q1.setFromUnitVectors(_v4.copy(el.position).normalize(), _v5.copy(E).sub(S).normalize());
  sh.quaternion.slerp(_q1, k);
  const f = _v5.copy(H).sub(E).normalize().applyQuaternion(_q2.copy(sh.quaternion).invert());
  _q1.setFromUnitVectors(FORE_DIR, f);
  el.quaternion.slerp(_q1, k);
}
function handPos(rig, A, out) {
  return rig.nodes['el' + A].localToWorld(out.copy(HAND));
}

// where the tags hang over an empty place (world), per slot
const EMPTY_TAG = [null, [SPOTS[1].pos[0], 1.25, SPOTS[1].pos[2]], [SPOTS[2].pos[0] + 0.15, 2.05, SPOTS[2].pos[2]], [SPOTS[3].pos[0], 1.35, SPOTS[3].pos[2]]];

export class Garage {
  constructor({ renderer, post, audio }) {
    this.renderer = renderer;
    this.post = post;
    this.audio = audio;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    this.t = 0;
    this.w = 1;
    this.h = 1;
    this.safe = { top: 70, bottom: 190 };
    this.fade = 0;
    this.visible = false;
    this.view = 'home';
    this.voice = null; // id -> 0..1, set by the lobby
    const V4 = (x = 0, y = 0, z = 0, w = 0) => new THREE.Vector4(x, y, z, w);
    this.u = {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uPing: { value: V4(0, 0, 0, -1e4) },
      uPingK: { value: new THREE.Vector2(4.5, 0.16) },
      uBulb: { value: V4(BULB.x, 2.3, BULB.z, 1) },
      uBulb2: { value: V4(BULB2.x, 2.3, BULB2.z, 0.7) },
      uLamp: { value: V4(1.95, 1.42, ROOM.Z0 + 0.2, 0.7) },
      uLantern: { value: V4(LANTERN_AT[0], 0.13, LANTERN_AT[2], 0.6) },
      uGap: { value: V4(ROOM.X0 - 0.25, 1.0, (GATE.wz0 + GATE.wz1) / 2, 0.9) },
      uWin: { value: V4((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, ROOM.Z0 - 0.2, 0.45) },
      uSky: { value: 1 },
      uHeadP0: { value: new THREE.Vector3() },
      uHeadP1: { value: new THREE.Vector3() },
      uHeadD: { value: new THREE.Vector3(-1, -0.04, 0).normalize() },
      uHeadI: { value: 0 },
      uTail: { value: V4() },
      uDash: { value: V4() },
      uEmber: { value: V4() },
      uFlame: { value: V4() },
      uAmb: { value: 0.13 },
      uFill: { value: V4(0.35, 0.55, 0.76, 0.16) },
      uFade: { value: 0 },
      uNoise: { value: 26 },
      uBlob: { value: Array.from({ length: 10 }, () => V4()) },
      uCarBox: { value: V4(CAR.x, CAR.z, CAR.len / 2 + 0.05, CAR.wid / 2 + 0.02) },
    };
    this.matSet = this._mat({}, { side: THREE.DoubleSide });
    this.matGlass = this._mat({ uAlpha: { value: 0.16 } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this._build();
    this.figs = [null, null, null, null];
    this.cut = null; // the engine start
    this.events = { flash: 0, nextFlash: rnd(25, 45), flashes: [], passer: null, nextPasser: rnd(40, 70) };
    this.ptr = { x: 0, y: 0, on: false, nx: 0, ny: 0 };
    this.hoverSlot = -1;
    this.camShake = 0;
    this.steer = 0;
    this.exhaustT = 0;
    this.idle = 0; // engine running
    this.anchorsOut = [];
    this.timeScale = 1;
  }

  _mat(own = {}, opts = {}) {
    const uniforms = {
      ...this.u,
      uDye: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
      uGlow: { value: new THREE.Vector4() },
      uGlowCol: { value: new THREE.Color(1, 0.8, 0.4) },
      uHover: { value: 0 },
      uAppear: { value: 1 },
      uAppearY: { value: new THREE.Vector2(0, 2.1) },
      uAlpha: { value: 1 },
      ...own,
    };
    return new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, ...opts });
  }

  _mesh(arr, mat = this.matSet, parent = this.scene) {
    const m = new THREE.Mesh(geometryFrom(arr), mat);
    m.frustumCulled = false;
    parent.add(m);
    return m;
  }

  _build() {
    const S = this.scene;
    this._mesh(buildRoom());
    this.ceiling = this._mesh(buildCeiling());
    this._mesh(buildProps());
    // the wicket door, ajar, swaying in the draught
    this.wicket = this._mesh(buildWicket());
    this.wicket.position.set(ROOM.X0 - 0.05, GATE.wy0 + 0.01, GATE.wz1 - 0.01);
    // the bulb on its wire
    this.bulbPivot = new THREE.Group();
    this.bulbPivot.position.set(BULB.x, ROOM.H - 0.2, BULB.z);
    S.add(this.bulbPivot);
    this._mesh(buildBulb(), this.matSet, this.bulbPivot);
    this.bulbSwing = { a: 0.05, b: 0.03, va: 0, vb: 0 };
    this.bulb2Pivot = new THREE.Group();
    this.bulb2Pivot.position.set(BULB2.x, ROOM.H, BULB2.z);
    S.add(this.bulb2Pivot);
    this._mesh(buildBulb2(), this.matSet, this.bulb2Pivot);
    // the car: a static root (wheels), a body on its springs, the body's meshes in car-local coordinates
    this.carRoot = new THREE.Group();
    this.carRoot.position.set(CAR.x, 0, CAR.z);
    S.add(this.carRoot);
    this._mesh(buildCarWheels(), this.matSet, this.carRoot);
    this.carBody = new THREE.Group();
    this.carBody.position.set(0, 0.45, 0);
    this.carRoot.add(this.carBody);
    this.carMesh = new THREE.Group();
    this.carMesh.position.set(0, -0.45, 0);
    this.carBody.add(this.carMesh);
    this._mesh(buildCarBody(), this.matSet, this.carMesh);
    const glass = this._mesh(buildCarGlass(), this.matGlass, this.carMesh);
    glass.renderOrder = 5;
    this.steering = new THREE.Group();
    this.steering.position.set(...CARP.wheelC);
    this.steering.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...CARP.wheelN).normalize());
    this.carMesh.add(this.steering);
    this.steerMesh = this._mesh(buildSteering(), this.matSet, this.steering);
    this.shake = { roll: 0, vroll: 0, pitch: 0, vpitch: 0, y: 0, vy: 0 };
    // light shafts
    const beam = (len, r, color) => {
      const g = new THREE.ConeGeometry(r, len, 18, 1, true);
      g.translate(0, -len / 2, 0);
      const m = new THREE.ShaderMaterial({
        uniforms: { uLen: { value: len }, uColor: { value: new THREE.Color(...color) }, uI: { value: 0 }, uFade: this.u.uFade },
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = 7;
      return mesh;
    };
    this.headBeams = CARP.head.map(([x, y, z]) => {
      const b = beam(3.4, 0.95, [1.0, 0.92, 0.75]);
      b.position.set(x - 0.02, y, z);
      b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(-1, -0.05, 0).normalize());
      this.carMesh.add(b);
      return b;
    });
    this.bulbBeam = beam(2.2, 1.35, [1.0, 0.72, 0.45]);
    this.bulbBeam.position.set(0, BULB_LOCAL - 0.02, 0);
    this.bulbPivot.add(this.bulbBeam);
    this.gapBeam = beam(3.0, 0.55, [0.45, 0.6, 1.0]);
    this.gapBeam.position.set(ROOM.X0 - 0.2, 1.55, (GATE.wz0 + GATE.wz1) / 2 + 0.05);
    this.gapBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, -0.42, -0.1).normalize());
    S.add(this.gapBeam);
    // dust in the light
    const N = 90;
    const dp = new Float32Array(N * 3), ds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const inBeam = i < 22;
      const a = Math.random() * PI * 2, r = Math.sqrt(Math.random());
      if (inBeam) {
        dp[i * 3] = CAR.x - 2.1 - Math.random() * 2.0;
        dp[i * 3 + 1] = 0.5 + Math.random() * 0.9;
        dp[i * 3 + 2] = CAR.z + (Math.random() - 0.5) * 1.6;
      } else {
        dp[i * 3] = BULB.x + Math.cos(a) * r * 1.8;
        dp[i * 3 + 1] = 0.3 + Math.random() * 2.1;
        dp[i * 3 + 2] = BULB.z + Math.sin(a) * r * 1.8;
      }
      ds[i] = Math.random();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    this.dustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: this.u.uTime, uBulb: this.u.uBulb, uHeadP0: this.u.uHeadP0, uHeadD: this.u.uHeadD, uHeadI: this.u.uHeadI, uPix: { value: 600 }, uFade: this.u.uFade },
      vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dg, this.dustMat);
    dust.frustumCulled = false;
    dust.renderOrder = 8;
    S.add(dust);
    this.smoke = new Smoke(S);
    this.smoke.pull = { x: ROOM.X0 - 0.15, y: 1.5, z: (GATE.wz0 + GATE.wz1) / 2, r: 2.6, k: 0.9 };
    this.sparks = new Particles(S, 260);
    // the thing that walks past the window
    this.passer = this._mesh(buildPasser());
    this.passer.position.set(-9, 0, ROOM.Z0 - ROOM.T - 0.22);
    this.passer.visible = false;
    // spot props
    this.cup = this._mesh(buildCup());
    this.cupHome = new THREE.Vector3(DRUM_AT[0] - 0.08, 0.92, DRUM_AT[2] + 0.12);
    this.cup.position.copy(this.cupHome);
    this.cig = this._mesh(buildCigarette());
    this.cig.visible = false;
    this.lighter = new THREE.Group();
    S.add(this.lighter);
    this._mesh(buildLighter(), this.matSet, this.lighter);
    this.flame = this._mesh(buildFlame(), this.matSet, this.lighter);
    this.lighter.visible = false;
    // the rucksack and what goes in it
    this.pack = new THREE.Group();
    S.add(this.pack);
    this._mesh(buildPack(), this.matSet, this.pack);
    this.flap = new THREE.Group();
    this.flap.position.set(0, PACK.h, -PACK.d * 0.41);
    this.pack.add(this.flap);
    this._mesh(buildPackFlap(), this.matSet, this.flap);
    this.items = buildItems().map((arr, i) => ({ mesh: this._mesh(arr), i, state: 'floor', t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), dur: 0.4, arc: 0.3, yaw: ITEM_SPOTS[i][2] }));
    this._resetPacker();
  }

  // ---------------- who is where ----------------
  // list: [{ slot, id, name, self, host, fit }]
  setPlayers(list) {
    for (let s = 0; s < 4; s++) {
      const p = list.find((q) => q.slot === s);
      const f = this.figs[s];
      if (!p) {
        if (f && !f.leaving) {
          f.leaving = true;
          f.leaveT = 0;
        }
        continue;
      }
      if (f && f.id === p.id && !f.leaving) {
        f.self = p.self;
        f.name = p.name;
        this._dress(f, p.fit);
        continue;
      }
      if (f) this._dropFig(s);
      this._addFig(s, p);
    }
  }

  _addFig(s, p) {
    const fit = cleanFit(p.fit);
    const mat = this._mat();
    mat.uniforms.uAppear.value = 0;
    const f = {
      slot: s, id: p.id, name: p.name, self: p.self, fit, key: '', mat, rig: null, t: 0, appear: 0, leaving: false, leaveT: 0,
      look: { yaw: 0, pitch: 0, wy: 0, wp: 0, next: 0.5, tgt: null, at: null }, st: { phase: 'intro', t: 0 }, glow: false,
    };
    this.figs[s] = f;
    this._dress(f, fit);
    const spot = SPOTS[s];
    mat.uniforms.uAppearY.value.set(s === 0 ? 0.55 : -0.05, 2.15);
    if (s === 0) {
      this.carMesh.add(f.rig.root);
      f.rig.root.position.set(...spot.pos);
    } else {
      this.scene.add(f.rig.root);
      f.rig.root.position.set(...spot.pos);
    }
    f.rig.root.rotation.y = spot.yaw;
    if (s === 3) this._resetPacker();
    // a little echo where they sit down
    const at = this._headWorld(f, _w);
    this.ping(at.x, at.y - 0.4, at.z, 3.2, 0.12);
    if (this.audio && this.visible) this.audio.garageArrive && this.audio.garageArrive();
  }

  _dress(f, fitIn) {
    const fit = cleanFit(fitIn);
    const key = shapeKey(fit);
    if (!f.rig || key !== f.key) {
      const old = f.rig;
      const rig = buildSurvivor(fit);
      for (const part of rig.parts) {
        const m = new THREE.Mesh(geometryFrom(part.arr), f.mat);
        m.frustumCulled = false;
        part.node.add(m);
      }
      rig.root.rotation.order = 'YXZ';
      if (old) {
        rig.root.position.copy(old.root.position);
        rig.root.rotation.copy(old.root.rotation);
        const parent = old.root.parent;
        if (parent) {
          parent.remove(old.root);
          parent.add(rig.root);
        }
        old.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      }
      f.rig = rig;
      f.key = key;
    }
    f.fit = fit;
    dyeColors(fit, f.mat.uniforms.uDye.value);
    const hi = item(fit.head);
    f.glow = !!(hi && hi.glow);
    f.mat.uniforms.uGlowCol.value.copy(f.mat.uniforms.uDye.value[1]);
  }

  _dropFig(s) {
    const f = this.figs[s];
    if (!f) return;
    if (f.rig.root.parent) f.rig.root.parent.remove(f.rig.root);
    f.rig.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    f.mat.dispose();
    this.figs[s] = null;
    // their things go back where they were
    if (s === 1) this.cup.position.copy(this.cupHome), this.cup.rotation.set(0, 0, 0);
    if (s === 2) {
      this.cig.visible = false;
      this.lighter.visible = false;
      this.u.uEmber.value.w = 0;
      this.u.uFlame.value.w = 0;
    }
    if (s === 3) this._resetPacker();
  }

  _resetPacker() {
    const [px, , pz] = SPOTS[3].pos, yaw = SPOTS[3].yaw;
    this.packHome = { x: px + Math.sin(yaw) * 0.44, z: pz + Math.cos(yaw) * 0.44, yaw: yaw + PI };
    this.pack.position.set(this.packHome.x, 0, this.packHome.z);
    this.pack.rotation.set(0, this.packHome.yaw, 0);
    if (this.pack.parent !== this.scene) this.scene.add(this.pack);
    this.flap.rotation.x = 0;
    for (const it of this.items) {
      it.state = 'floor';
      this._itemHome(it, it.mesh.position);
      it.mesh.rotation.set(0, yaw + it.yaw, 0);
      it.mesh.visible = true;
    }
  }

  _itemHome(it, out) {
    const [px, , pz] = SPOTS[3].pos, yaw = SPOTS[3].yaw;
    const [lx, lz] = ITEM_SPOTS[it.i];
    return out.set(px + Math.cos(yaw) * lx + Math.sin(yaw) * lz, 0.003, pz - Math.sin(yaw) * lx + Math.cos(yaw) * lz);
  }

  // ---------------- echoes ----------------
  ping(x, y, z, speed = 4.5, width = 0.16) {
    this.u.uPing.value.set(x, y, z, this.t);
    this.u.uPingK.value.set(speed, width);
  }

  // your voice (or a friend's) lights the garage from their mouth
  voicePing(slot, strength) {
    const f = this.figs[slot];
    if (!f || f.leaving) return;
    const p = this._headWorld(f, _w);
    this.ping(p.x, p.y, p.z, 3.2 + strength * 2.5, 0.14);
  }

  // ---------------- open / close ----------------
  open(view) {
    if (!this.visible) {
      this.visible = true;
      this.fade = 0;
      if (this.audio) this.audio.garageAmb(true);
      this.t0 = this.t;
    }
    this.view = view;
  }

  close() {
    if (!this.visible) return;
    this.visible = false;
    if (this.audio) this.audio.garageAmb(false);
    if (this.cut && !this.cut.done) this.cut = null;
    this._stopEngine(0.4);
  }

  get starting() {
    return !!(this.cut && !this.cut.fired);
  }

  // ---------------- the car starts ----------------
  startCar(onDone) {
    if (this.cut) return false;
    this.cut = { t: 0, onDone, keyed: false, caught: false, honk: 0, fired: false, done: false };
    return true;
  }

  abortStart() {
    if (!this.cut) return;
    this.cut = null;
    this._stopEngine(0.8);
    this.fade = Math.max(this.fade, 0.3);
    this.u.uHeadI.value = 0;
    this.u.uDash.value.w = 0;
    this.u.uTail.value.w = 0;
    if (this.figs[2]) this.figs[2].rig.root.rotation.y = SPOTS[2].yaw;
    for (const f of this.figs) if (f) f.st = { phase: 'idle', t: 0, next: rnd(1, 3), nextTap: 5 };
    this._resetPacker();
    this.cup.position.copy(this.cupHome);
  }

  _stopEngine(fade) {
    if (this.engine) {
      try { this.engine.stop(fade); } catch { /* */ }
      this.engine = null;
    }
    this.idle = 0;
  }

  // after the night started, the engine keeps idling for a breath while the screen changes
  releaseEngine(fade = 2.2) {
    this._stopEngine(fade);
    this.cut = null;
    this.u.uHeadI.value = 0;
    this.u.uDash.value.w = 0;
    this.u.uTail.value.w = 0;
    for (const f of this.figs) if (f) f.st = { phase: 'idle', t: 0, next: rnd(1, 3), nextTap: 5, i: -1 };
    if (this.figs[2]) this.figs[2].rig.root.rotation.y = SPOTS[2].yaw;
    this._resetPacker();
    this.cup.position.copy(this.cupHome);
    this.smoke.clear();
    this.butt = null;
  }

  _cutscene(dt) {
    const c = this.cut;
    if (!c) return;
    c.t += dt;
    const t = c.t;
    const A = this.audio;
    if (!c.keyed && t >= 0.35) {
      c.keyed = true;
      if (A) this.engine = A.carStart();
    }
    if (!c.caught && t >= 1.25) {
      c.caught = true;
      this.idle = 1;
      this.shake.vroll += 0.55;
      this.shake.vpitch -= 0.25;
      this.shake.vy += 0.25;
      this.camShake = 0.5;
      this.bulbSwing.va += 0.25;
      const ex = this._carPoint(CARP.exhaust, _w);
      for (let i = 0; i < 14; i++) this.smoke.emit(ex.x + 0.05, ex.y, ex.z, rnd(0.6, 1.6), rnd(0, 0.4), rnd(-0.3, 0.3), { life: 2.6, s0: 0.12, s1: 0.9, a: 0.32, rise: 0.25, drag: 1.6, col: [0.42, 0.42, 0.44], jitter: 0.5 });
      const eng = this._carPoint([-1.3, 1.1, 0], _w2);
      this.ping(eng.x, eng.y, eng.z, 6.5, 0.22);
    }
    if (c.honk < 2 && t >= 2.3 + c.honk * 0.24) {
      c.honk++;
      if (A && A.carHorn) A.carHorn(c.honk === 2);
    }
    // the dash comes alive with the key, sags while the starter drags the battery down, the lamps flare on the catch
    const dash = t < 0.4 ? 0 : t < 1.25 ? 0.45 + 0.1 * Math.sin(t * 40) : 1;
    this.u.uDash.value.w = dash * 0.9;
    const hl = t < 1.25 ? 0 : t < 1.33 ? 1 : t < 1.4 ? 0.15 : t < 1.47 ? 1 : t < 1.52 ? 0.5 : 1;
    this.u.uHeadI.value = hl;
    this.u.uTail.value.w = t < 1.25 ? 0 : 0.7;
    // fade to the night
    if (t > 2.95) this.fade = Math.max(0, 1 - (t - 2.95) / 0.65);
    if (!c.fired && t >= 3.65) {
      c.fired = true;
      c.done = true;
      const fn = c.onDone;
      c.onDone = null;
      if (fn) fn();
    }
  }

  _carPoint(p, out) {
    return this.carMesh.localToWorld(out.set(p[0], p[1], p[2]));
  }

  // ---------------- every frame ----------------
  frame(dt) {
    if (!this.visible) return;
    dt *= this.timeScale; // (tests freeze it for stills)
    this.t += dt;
    const u = this.u;
    if (!this.cut || this.cut.t < 2.95) this.fade = Math.min(1, this.fade + dt * 1.4);
    u.uFade.value = 1;
    u.uTime.value = this.t;
    this.homeK = damp(this.homeK ?? 1, this.view === 'home' ? 1 : 0, 2.2, dt);
    this._cutscene(dt);
    this._ambient(dt);
    this._car(dt);
    this._figures(dt);
    this._camera(dt);
    this._blobs();
    this._butt(dt);
    this.smoke.update(dt, this._pix(), 1);
    this.sparks.update(dt, this._pix());
    this.dustMat.uniforms.uPix.value = this._pix();
    this._anchors();
    this._render();
  }

  _pix() {
    return this.post.h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
  }

  _render() {
    const p = this.post.u;
    p.uAberr.value = 0.12;
    p.uGlitch.value = 0;
    p.uRed.value = 0;
    p.uWhite.value = 0;
    p.uDanger.value = 0;
    p.uGrain.value = 0.055;
    p.uShockAmp.value = 0;
    p.uFade.value = this.fade * this.fade;
    p.uWarm.value = 0.42;
    p.uFlicker.value = this.flicker || 0;
    p.uAsh.value = 0.28;
    this.u.uCam.value.copy(this.camera.position);
    this.post.u.uTime.value = this.t;
    this.renderer.info.reset();
    this.post.render(this.scene, this.camera);
  }

  // when the lobby closes, leave the post chain the way the menu likes it
  restorePost() {
    const p = this.post.u;
    p.uFade.value = 0;
    p.uWarm.value = 0;
    p.uAsh.value = 0.62;
    p.uFlicker.value = 0;
  }

  // ---------------- the room breathes ----------------
  _ambient(dt) {
    const u = this.u;
    const e = this.events;
    // the bulb: swings a little, buzzes, now and then browns out
    const sw = this.bulbSwing;
    sw.va += (-sw.a * 9 - sw.va * 0.25) * dt;
    sw.vb += (-sw.b * 9 - sw.vb * 0.25) * dt;
    sw.a += sw.va * dt;
    sw.b += sw.vb * dt;
    if (Math.abs(sw.a) < 0.012 && Math.random() < dt * 0.3) sw.va += rnd(-0.05, 0.05); // a draught
    this.bulbPivot.rotation.set(sw.a, 0, sw.b);
    this.bulbPivot.updateMatrixWorld(true);
    const bp = this.bulbPivot.localToWorld(_w.set(0, BULB_LOCAL, 0));
    e.brown = Math.max(0, (e.brown || 0) - dt);
    if (e.brown <= 0 && Math.random() < dt * 0.05) e.brown = rnd(0.15, 0.5);
    let bulb = 1.55 + Math.sin(this.t * 31) * 0.018 + Math.sin(this.t * 7.3) * 0.015;
    if (e.brown > 0) bulb *= 0.55 + 0.45 * (Math.sin(this.t * 63) > 0.3 ? 1 : 0.4);
    if (this.cut && this.cut.t > 0.4 && this.cut.t < 1.25) bulb *= 0.93 + 0.07 * Math.sin(this.cut.t * 50);
    u.uBulb.value.set(bp.x, bp.y, bp.z, bulb);
    // the bare bulb sways with its own wire, and stutters now and then
    this.bulb2Pivot.rotation.set(Math.sin(this.t * 0.7 + 1) * 0.03, 0, Math.sin(this.t * 0.53) * 0.025);
    this.bulb2Pivot.updateMatrixWorld(true);
    const b2 = this.bulb2Pivot.localToWorld(_w2.set(0, BULB2_LOCAL, 0));
    e.stutter = Math.max(0, (e.stutter || 0) - dt);
    if (e.stutter <= 0 && Math.random() < dt * 0.12) e.stutter = rnd(0.2, 0.9);
    let b2i = 0.62 + Math.sin(this.t * 37) * 0.015;
    if (e.stutter > 0) b2i *= Math.sin(this.t * 71) > 0.1 ? 1 : 0.15;
    u.uBulb2.value.set(b2.x, b2.y, b2.z, b2i);
    this.bulbBeam.material.uniforms.uI.value = 0.045 * bulb;
    this.flicker = e.brown > 0 ? 0.04 : 0;
    // the lantern's flame breathes
    u.uLantern.value.w = 0.8 + 0.08 * Math.sin(this.t * 9.1) * Math.sin(this.t * 3.7) + 0.04 * Math.sin(this.t * 23);
    // the wicket door sways in the draught
    this.wicket.rotation.y = GATE.open + Math.sin(this.t * 0.6) * 0.025 + Math.sin(this.t * 1.7) * 0.01;
    // lightning, far off: the gap and the window flash, thunder a while later
    e.nextFlash -= dt;
    if (e.nextFlash <= 0 && !this.cut) {
      e.nextFlash = rnd(35, 75);
      e.flashes = [0, 0.13, rnd(0.3, 0.5)];
      e.thunderAt = this.t + rnd(1.4, 3.0);
      e.flashT = 0;
    }
    if (e.flashes.length) {
      e.flashT += dt;
      while (e.flashes.length && e.flashT >= e.flashes[0]) {
        e.flashes.shift();
        e.flash = rnd(0.7, 1.0);
      }
    }
    if (e.thunderAt && this.t >= e.thunderAt) {
      e.thunderAt = 0;
      if (this.audio && this.audio.garageThunder) this.audio.garageThunder();
    }
    e.flash = Math.max(0, e.flash - dt * 7);
    u.uSky.value = 1 + e.flash * 7;
    this.gapBeam.material.uniforms.uI.value = 0.045 * u.uSky.value;
    // something walks past the window (only the driver can see it)
    e.nextPasser -= dt;
    if (!e.passer && e.nextPasser <= 0 && !this.cut) {
      e.nextPasser = rnd(55, 100);
      e.passer = { t: 0, dur: rnd(3.6, 5.0), dir: Math.random() < 0.5 ? 1 : -1 };
      this.passer.visible = true;
      if (this.audio && this.audio.garageSteps) this.audio.garageSteps(e.passer.dur, e.passer.dir);
    }
    if (e.passer) {
      const P = e.passer;
      P.t += dt;
      const x = P.t / P.dur;
      const cx = (WIN.x0 + WIN.x1) / 2;
      this.passer.position.x = cx + (x - 0.5) * 3.4 * P.dir;
      this.passer.position.y = Math.abs(Math.sin(P.t * 3.6)) * 0.03 - 0.1;
      this.passer.rotation.z = Math.sin(P.t * 3.6) * 0.03;
      // it blocks the moon as it passes
      const over = 1 - clamp(Math.abs(this.passer.position.x - cx) / 0.7, 0, 1);
      u.uWin.value.w = 0.45 * (1 - over * 0.8);
      if (x >= 1) {
        e.passer = null;
        this.passer.visible = false;
        u.uWin.value.w = 0.45;
      }
    }
  }

  // ---------------- the car on its springs ----------------
  _car(dt) {
    const s = this.shake;
    const c = this.cut;
    // cranking: the body heaves with each compression; running: a fine shiver
    let fy = 0, froll = 0;
    if (c && c.t > 0.4 && c.t < 1.25) {
      const ph = Math.sin(c.t * PI * 2 * 5.2);
      fy += Math.max(0, ph) * 0.9;
      froll += ph * 0.5;
    }
    s.vroll += (-s.roll * 60 - s.vroll * 5 + froll) * dt;
    s.vpitch += (-s.pitch * 60 - s.vpitch * 5) * dt;
    s.vy += (-s.y * 90 - s.vy * 7 + fy) * dt;
    s.roll += s.vroll * dt;
    s.pitch += s.vpitch * dt;
    s.y += s.vy * dt;
    const idle = this.idle;
    const shiver = idle * (Math.sin(this.t * 2 * PI * 27) * 0.0018 + Math.sin(this.t * 2 * PI * 13.5) * 0.0012);
    this.carBody.position.y = 0.45 + s.y * 0.05 + shiver;
    this.carBody.rotation.x = s.roll * 0.04 + idle * Math.sin(this.t * 2 * PI * 9) * 0.0015;
    this.carBody.rotation.z = s.pitch * 0.03;
    this.carRoot.updateMatrixWorld(true);
    // lamps in the world
    this._carPoint(CARP.head[0], this.u.uHeadP0.value);
    this._carPoint(CARP.head[1], this.u.uHeadP1.value);
    const tl = this._carPoint([2.02, 0.95, 0], _w);
    this.u.uTail.value.set(tl.x + 0.3, tl.y, tl.z, this.u.uTail.value.w);
    const dp = this._carPoint(CARP.dash, _w);
    this.u.uDash.value.set(dp.x, dp.y, dp.z, this.u.uDash.value.w);
    for (const b of this.headBeams) b.material.uniforms.uI.value = 0.11 * this.u.uHeadI.value;
    // the steering wheel
    this.steerMesh.rotation.x = this.steer;
    // exhaust while it runs
    if (idle > 0) {
      this.exhaustT -= dt;
      if (this.exhaustT <= 0) {
        this.exhaustT = 0.08;
        const ex = this._carPoint(CARP.exhaust, _w);
        this.smoke.emit(ex.x + 0.04, ex.y, ex.z, rnd(0.5, 1.0), rnd(0.05, 0.25), rnd(-0.15, 0.15), { life: 2.0, s0: 0.08, s1: 0.6, a: 0.16, rise: 0.22, drag: 1.4, col: [0.46, 0.46, 0.48], jitter: 0.2 });
      }
    }
  }

  // ---------------- people ----------------
  _figures(dt) {
    for (let s = 0; s < 4; s++) {
      const f = this.figs[s];
      if (!f) continue;
      f.t += dt;
      if (f.leaving) {
        f.leaveT += dt;
        f.appear = Math.max(0, 1 - f.leaveT / 0.7);
        if (f.appear <= 0) {
          this._dropFig(s);
          continue;
        }
      } else f.appear = Math.min(1, f.appear + dt / 1.1);
      f.mat.uniforms.uAppear.value = f.appear >= 1 ? 1 : f.appear;
      f.mat.uniforms.uHover.value = damp(f.mat.uniforms.uHover.value, s === this.hoverSlot && f.self ? 1 : 0, 10, dt);
      f.st.t += dt;
      this._lookAround(f, dt);
      const n = f.rig.nodes;
      // a clean base pose every frame (the spot fills in the rest)
      for (const k of ['chest', 'head', 'thL', 'thR', 'knL', 'knR', 'shL', 'shR', 'elL', 'elR']) n[k].rotation.set(0, 0, 0);
      n.hips.rotation.set(0, 0, 0);
      n.shL.rotation.z = -0.07;
      n.shR.rotation.z = 0.07;
      n.elL.rotation.x = n.elR.rotation.x = -0.2;
      if (s === 0) this._driver(f, dt);
      else if (s === 1) this._chair(f, dt);
      else if (s === 2) this._smoker(f, dt);
      else this._packer(f, dt);
      this._glow(f);
      if (n.crow) this._crow(f, dt);
    }
  }

  // eyes: whoever's talking, the others, you — or nothing in particular
  _lookAround(f, dt) {
    const L = f.look;
    L.next -= dt;
    let talker = null, best = 0.16;
    if (this.voice) {
      for (const g of this.figs) {
        if (!g || g === f || g.leaving) continue;
        const lv = this.voice(g.id);
        if (lv > best) { best = lv; talker = g; }
      }
    }
    if (talker && (L.tgt !== talker || L.next < -1)) {
      if (Math.random() < dt * 4) {
        L.at = talker;
        L.tgt = talker;
        L.next = rnd(1.2, 2.5);
      }
    } else if (L.next <= 0) {
      L.next = rnd(1.6, 4.2);
      const r = Math.random();
      const others = this.figs.filter((g) => g && g !== f && !g.leaving);
      if (r < 0.32) L.tgt = 'cam';
      else if (r < 0.62 && others.length) L.tgt = others[Math.floor(Math.random() * others.length)];
      else {
        L.tgt = null;
        L.wy = rnd(-0.8, 0.8);
        L.wp = rnd(-0.2, 0.25);
      }
    }
    if (this.cut && this.cut.t > 1.3 && f.slot !== 0) L.tgt = 'car';
    if (this.events.passer && f.slot === 0 && this.events.passer.t > 0.6) L.tgt = 'window';
    let wy = L.wy, wp = L.wp;
    if (L.tgt) {
      let p;
      if (L.tgt === 'cam') p = _w.copy(this.camera.position);
      else if (L.tgt === 'car') p = this._carPoint([-0.6, 1.4, 0.2], _w);
      else if (L.tgt === 'window') p = _w.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, ROOM.Z0);
      else if (L.tgt.rig) p = this._headWorld(L.tgt, _w);
      if (p) {
        const root = f.rig.root;
        root.updateMatrixWorld(true);
        const lp = root.worldToLocal(p);
        const hy = f.rig.nodes.hips.position.y + 0.72;
        const dx = lp.x, dy = lp.y - hy, dz = lp.z - f.rig.nodes.hips.position.z;
        wy = clamp(Math.atan2(dx, dz), -1.25, 1.25);
        wp = clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.55, 0.6);
        if (Math.abs(Math.atan2(dx, dz)) > 1.9) { wy = L.yaw * 0.5; wp = 0; } // behind them: never mind
      }
    }
    const rate = L.tgt === 'window' ? 9 : 4.5;
    L.yaw = damp(L.yaw, wy, rate, dt);
    L.pitch = damp(L.pitch, wp, rate, dt);
  }

  // head + chest turn toward the look (on top of whatever the body is doing)
  _applyLook(f, k = 1, extraPitch = 0) {
    const n = f.rig.nodes;
    const L = f.look;
    n.chest.rotation.y += L.yaw * 0.25 * k;
    n.head.rotation.y += L.yaw * 0.72 * k;
    n.head.rotation.x += (L.pitch - n.chest.rotation.x - n.hips.rotation.x) * k + extraPitch;
    // talking: a little nod in the rhythm of their voice
    const lv = this.voice ? this.voice(f.id) : 0;
    if (lv > 0.05) {
      n.head.rotation.x += Math.sin(this.t * 11 + f.slot) * 0.05 * lv;
      n.head.rotation.z += Math.sin(this.t * 6.3 + f.slot) * 0.03 * lv;
    }
  }

  _headWorld(f, out) {
    f.rig.root.updateMatrixWorld(true);
    return f.rig.nodes.head.localToWorld(out.set(0, 0.04, 0.02));
  }

  _glow(f) {
    const u = f.mat.uniforms;
    if (!f.glow) {
      u.uGlow.value.w = 0;
      return;
    }
    const p = f.rig.nodes.head.localToWorld(_w.set(0, -0.02, 0.18));
    const fl = f.fit.head === 'pumpkin' ? 0.55 + 0.12 * Math.sin(this.t * 11) * Math.sin(this.t * 6.1) : 0.22;
    u.uGlow.value.set(p.x, p.y, p.z, fl);
  }

  _crow(f, dt) {
    const n = f.rig.nodes;
    f.crow = f.crow || { t: 0, yaw: 0, tilt: 0 };
    const c = f.crow;
    c.t -= dt;
    if (c.t <= 0) {
      c.t = 0.25 + Math.random() * 1.4;
      c.yaw = (Math.random() - 0.5) * 2.2;
      c.tilt = (Math.random() - 0.5) * 0.7;
    }
    n.crowHead.rotation.y = damp(n.crowHead.rotation.y, c.yaw, 30, dt);
    n.crowHead.rotation.z = damp(n.crowHead.rotation.z, c.tilt, 30, dt);
  }

  // ---- slot 0: at the wheel ----
  _driver(f, dt) {
    const n = f.rig.nodes;
    const st = f.st;
    const t = this.t;
    const breathe = Math.sin(t * 1.6 + 1) * 0.012;
    n.hips.position.set(0, 1.02, 0.0);
    n.hips.rotation.x = -0.1;
    n.chest.rotation.x = -0.02 + breathe;
    for (const [A, s] of [['L', -1], ['R', 1]]) {
      n['th' + A].rotation.set(-1.5, 0, s * 0.07);
      n['kn' + A].rotation.x = 0.88;
    }
    // what the hands are up to
    if (st.phase === 'intro' && st.t > 1.8) { st.phase = 'idle'; st.t = 0; st.next = rnd(2, 5); }
    if (st.phase === 'idle') {
      st.next -= dt;
      if (st.next <= 0 && !this.cut) {
        st.phase = ['drum', 'mirror', 'steer', 'drum', 'steer'][Math.floor(Math.random() * 5)];
        st.t = 0;
      }
    } else if (st.phase !== 'intro' && st.t > (st.phase === 'steer' ? 2.6 : 1.9)) {
      st.phase = 'idle';
      st.t = 0;
      st.next = rnd(2.5, 6);
    }
    let steerWant = 0;
    if (st.phase === 'steer') steerWant = Math.sin(st.t * 2.4) * 0.45 * bell(st.t, 0, 0.4, 2.0, 2.6);
    this.steer = damp(this.steer, steerWant, 6, dt);
    this._applyLook(f, 1);
    f.rig.root.updateMatrixWorld(true);
    // the grips follow the wheel as it turns
    const grip = (a, out) => {
      const aa = a + this.steer;
      return this.steering.localToWorld(out.set(0.0, Math.sin(aa) * CARP.wheelRad, Math.cos(aa) * CARP.wheelRad));
    };
    const gL = grip(PI * 0.82, _v1.clone());
    const gR = grip(PI * 0.18, _v2.clone());
    let L = gL, R = gR, kL = 1, kR = 1;
    const c = this.cut;
    const mirror = this._carPoint([-0.62, 1.62, 0.02], new THREE.Vector3());
    if (st.phase === 'intro' || st.phase === 'mirror') {
      const x = st.t / 1.8;
      const k = bell(x, 0.0, 0.25, 0.75, 1.0);
      mirror.y += Math.sin(st.t * 9) * 0.012 * k;
      L = gL.clone().lerp(mirror, k);
      f.look.tgt = k > 0.3 ? null : f.look.tgt;
      if (k > 0.3) { f.look.wy = -0.55; f.look.wp = -0.25; }
    }
    if (st.phase === 'drum') {
      const tap = Math.max(0, Math.sin(st.t * 22)) * 0.025 * bell(st.t, 0, 0.2, 1.5, 1.9);
      R = gR.clone().add(_v3.set(0, tap, 0));
    }
    if (c) {
      const ct = c.t;
      const key = this._carPoint(CARP.key, new THREE.Vector3());
      const toKey = seg(ct, 0, 0.32) * (1 - seg(ct, 1.4, 1.75));
      key.x += seg(ct, 0.32, 0.42) * 0.0; // (the turn is in the wrist)
      key.y += -0.012 * seg(ct, 0.33, 0.4);
      L = gL.clone().lerp(key, toKey);
      if (ct > 2.15 && ct < 2.85) {
        // a double honk: the palm on the centre of the wheel
        const hub = this.steering.localToWorld(new THREE.Vector3(0.03, 0, 0));
        const push = Math.max(0, Math.sin((ct - 2.15) * PI / 0.24)) * 0.03;
        R = gR.clone().lerp(hub.add(_v3.set(push, 0, 0)), bell(ct, 2.15, 2.25, 2.7, 2.85));
      }
      if (ct > 1.55 && ct < 2.1) {
        // a look over at the others: ready?
        f.look.tgt = null;
        f.look.wy = 1.05;
        f.look.wp = 0.1;
      } else if (ct > 2.85) {
        f.look.tgt = null;
        f.look.wy = 0;
        f.look.wp = 0.05;
      }
      if (ct > 1.7 && ct < 2.1) n.head.rotation.x += Math.sin((ct - 1.7) * PI * 5) * 0.08; // a nod
    }
    reach(f.rig, 'L', L, _pole.set(-1, -0.7, -0.2), kL);
    reach(f.rig, 'R', R, _pole.set(1, -0.7, -0.2), kR);
  }

  // ---- slot 1: on the chair, a cup of tea ----
  _chair(f, dt) {
    const n = f.rig.nodes;
    const st = f.st;
    const t = this.t;
    const c = this.cut;
    const rc = c && c.t > 1.3 ? c.t - 1.3 : -1; // reaction time
    // sitting → standing (on the start)
    const up = rc < 0 ? 0 : seg(rc, 1.0, 1.9);
    const sipK = st.phase === 'sip' ? bell(st.t, 0, 0.6, 1.6, 2.4) : 0;
    n.hips.position.set(0, lerp(0.55, 0.94, up), lerp(-0.02, 0.36, up));
    n.hips.rotation.x = lerp(0.05, 0, up);
    const lean = lerp(0.36, 0.05, up) + 0.3 * up * (1 - up) * 4 * 0.5;
    n.chest.rotation.x = lerp(lean, 0.1, sipK) + Math.sin(t * 1.5) * 0.01;
    for (const [A, s] of [['L', -1], ['R', 1]]) {
      n['th' + A].rotation.set(lerp(-1.5, 0, up), 0, s * lerp(0.1, 0.02, up));
      n['kn' + A].rotation.x = lerp(1.5, 0.04, up);
    }
    // a foot tapping now and then
    st.tap = (st.tap ?? rnd(2, 6)) - dt;
    if (st.tap < -3.5) st.tap = rnd(4, 10);
    if (st.tap < 0 && up === 0) n.thR.rotation.x += Math.max(0, Math.sin(t * 2 * PI * 2.1)) * 0.05;
    // phases
    if (st.phase === 'intro' && st.t > 1.7) { st.phase = 'idle'; st.t = 0; st.next = rnd(3, 7); }
    if (st.phase === 'idle') {
      st.next -= dt;
      if (st.next <= 0 && !c) { st.phase = 'sip'; st.t = 0; }
    } else if (st.phase === 'sip' && st.t > 2.4) {
      st.phase = 'idle';
      st.t = 0;
      st.next = rnd(5, 10);
    }
    this._applyLook(f, 1 - sipK * 0.7, -0.22 * sipK);
    f.rig.root.updateMatrixWorld(true);
    const root = f.rig.root;
    // the cup: held in both hands over the knees; up to the mouth to sip; to the drum and back
    const hold = root.localToWorld(new THREE.Vector3(0, 0.66, 0.38 + 0.0));
    const mouth = f.rig.nodes.head.localToWorld(new THREE.Vector3(0, -0.07, 0.15));
    let cupAt = hold.clone().lerp(mouth, sipK);
    let one = 0; // 1 = only the left hand on it
    if (st.phase === 'intro') {
      // pick it up from the drum
      const k = 1 - seg(st.t, 0.5, 1.4);
      cupAt = cupAt.lerp(this.cupHome, k * (st.t > 0.5 ? 1 : 0));
      if (st.t <= 0.5) cupAt = this.cupHome.clone();
      one = 1 - seg(st.t, 1.1, 1.5);
    }
    if (rc >= 0) {
      // the engine catches: down with the cup on the drum, and up
      const k = seg(rc, 0.0, 0.7);
      cupAt = cupAt.lerp(this.cupHome, k);
      one = seg(rc, 0.0, 0.3);
    }
    const onDrum = (st.phase === 'intro' && st.t <= 0.5) || (rc >= 0.7);
    this.cup.position.copy(onDrum ? this.cupHome : cupAt);
    this.cup.rotation.set(0, 0, -0.9 * sipK * (onDrum ? 0 : 1));
    const hx = root.localToWorld(new THREE.Vector3(0.055, 0, 0)).sub(root.position); // toward their +x side
    const R = cupAt.clone().add(hx).add(_v3.set(0, -0.01, 0));
    const L = cupAt.clone().sub(hx).add(_v3.set(0, -0.015, 0));
    const fetch = cupAt.clone().add(_v3.set(0, 0.0, 0));
    const reachDrum = (st.phase === 'intro' && st.t < 1.4) || (rc >= 0 && rc < 0.9);
    const kArms = onDrum && rc >= 0.7 ? 1 - seg(rc, 0.7, 1.1) : 1;
    reach(f.rig, 'R', reachDrum ? fetch : R, _pole.set(0.8, -0.6, -0.3), kArms);
    reach(f.rig, 'L', L, _pole.set(-0.8, -0.6, -0.3), kArms * (1 - one));
    // steam off the tea
    if (!onDrum) {
      st.steam = (st.steam || 0) - dt;
      if (st.steam <= 0 && sipK < 0.2) {
        st.steam = 0.22;
        this.smoke.emit(this.cup.position.x, this.cup.position.y + 0.05, this.cup.position.z, 0, 0.12, 0, { life: 1.6, s0: 0.02, s1: 0.16, a: 0.12, rise: 0.12, drag: 1.5, col: [0.8, 0.82, 0.85], jitter: 0.04 });
      }
    }
  }

  // ---- slot 2: by the door, smoking ----
  _smoker(f, dt) {
    const n = f.rig.nodes;
    const st = f.st;
    const t = this.t;
    const c = this.cut;
    const rc = c && c.t > 1.3 ? c.t - 1.3 : -1;
    const off = rc < 0 ? 0 : seg(rc, 0.45, 1.3); // pushes off the wall
    n.hips.position.set(0, 0.93, lerp(0.03, 0.06, off));
    n.hips.rotation.x = lerp(-0.06, 0, off);
    n.chest.rotation.x = lerp(-0.15, 0.02, off) + Math.sin(t * 1.3) * 0.01;
    n.thR.rotation.set(-0.08, 0, 0.05);
    n.knR.rotation.x = 0.06;
    n.thL.rotation.set(lerp(-0.62, -0.05, off), 0, lerp(-0.1, -0.04, off));
    n.knL.rotation.x = lerp(1.7, 0.08, off);
    if (rc >= 0) f.rig.root.rotation.y = SPOTS[2].yaw + seg(rc, 0.6, 1.4) * 0.55;
    else f.rig.root.rotation.y = SPOTS[2].yaw;
    // phases: intro (lights up) · idle · drag · tap (ash)
    if (st.phase === 'intro' && st.t > 3.4) { st.phase = 'idle'; st.t = 0; st.next = rnd(2, 4); st.nextTap = rnd(4, 8); }
    if (st.phase === 'idle') {
      st.next -= dt;
      st.nextTap -= dt;
      if (!c && st.next <= 0) { st.phase = 'drag'; st.t = 0; }
      else if (!c && st.nextTap <= 0) { st.phase = 'tap'; st.t = 0; st.nextTap = rnd(6, 12); }
    } else if ((st.phase === 'drag' && st.t > 3.6) || (st.phase === 'tap' && st.t > 0.8)) {
      st.phase = 'idle';
      st.t = 0;
      st.next = rnd(4, 8);
    }
    const drag = st.phase === 'drag' ? bell(st.t, 0, 0.5, 1.4, 1.9) : st.phase === 'intro' ? bell(st.t, 0.2, 0.6, 2.6, 3.0) : 0;
    const exhale = st.phase === 'drag' ? bell(st.t, 1.9, 2.1, 3.0, 3.6) : st.phase === 'intro' ? bell(st.t, 3.0, 3.1, 3.3, 3.4) : 0;
    this._applyLook(f, 1 - Math.max(drag, exhale) * 0.6, -0.25 * exhale + 0.08 * drag);
    f.rig.root.updateMatrixWorld(true);
    const root = f.rig.root;
    const head = n.head;
    const mouth = head.localToWorld(new THREE.Vector3(0, -0.075, 0.13));
    const rest = root.localToWorld(new THREE.Vector3(-0.13, 1.28, 0.22));
    const belly = root.localToWorld(new THREE.Vector3(-0.07, 1.1, 0.17));
    let L = rest.clone().lerp(mouth.clone().add(root.localToWorld(new THREE.Vector3(-0.01, 0, 0.02)).sub(root.position)), drag);
    if (st.phase === 'tap') L.y -= Math.max(0, Math.sin(st.t * 18)) * 0.03 * bell(st.t, 0, 0.1, 0.5, 0.8);
    let hasCig = true;
    if (rc >= 0) {
      // the butt goes out through the gap
      const fl = seg(rc, 0.0, 0.25) * (1 - seg(rc, 0.35, 0.8));
      const out = root.localToWorld(new THREE.Vector3(-0.4, 1.35, 0.15));
      L = L.lerp(out, fl);
      if (rc > 0.28) hasCig = false;
      if (rc > 0.28 && !st.flicked) {
        st.flicked = true;
        this._flickButt();
      }
    }
    // the other arm across the belly holds the elbow (or the lighter, at first)
    let R = belly;
    if (st.phase === 'intro') {
      const lit = bell(st.t, 0.35, 0.7, 1.9, 2.3);
      const tip = mouth.clone().add(_v3.set(0, -0.01, 0)).add(root.localToWorld(new THREE.Vector3(0.0, 0, 0.09)).sub(root.position));
      R = belly.clone().lerp(tip, lit);
      this.lighter.visible = lit > 0.3;
      const flame = st.t > 0.85 && st.t < 1.9;
      if (flame && !st.clicked) {
        st.clicked = true;
        if (this.audio && this.audio.lighter && this.visible) this.audio.lighter();
      }
      this.u.uFlame.value.w = flame ? 0.9 + Math.sin(t * 40) * 0.1 : 0;
      this.flame.visible = flame;
    } else {
      this.lighter.visible = false;
      this.u.uFlame.value.w = 0;
    }
    if (rc >= 0) R = belly.clone().lerp(root.localToWorld(new THREE.Vector3(0.2, 0.95, 0.06)), seg(rc, 0.4, 1.0));
    reach(f.rig, 'L', L, _pole.set(-0.6, -0.8, -0.1), 1);
    reach(f.rig, 'R', R, _pole.set(0.9, -0.5, 0.2), 1);
    f.rig.root.updateMatrixWorld(true);
    // the cigarette in the fingers, the lighter in the other hand
    const hp = handPos(f.rig, 'L', new THREE.Vector3());
    const ep = n.elL.getWorldPosition(new THREE.Vector3());
    const dir = hp.clone().sub(ep).normalize();
    const side = root.localToWorld(new THREE.Vector3(1, 0, 0)).sub(root.position).normalize();
    const cdir = dir.clone().multiplyScalar(0.35).add(side.multiplyScalar(-0.75)).add(_v3.set(0, 0.25, 0)).normalize();
    this.cig.visible = hasCig && f.appear > 0.6;
    this.cig.position.copy(hp).addScaledVector(dir, 0.02);
    this.cig.quaternion.setFromUnitVectors(Z, drag > 0.5 ? dir.clone().negate().lerp(cdir, 0.3).normalize() : cdir);
    this.cig.updateMatrixWorld(true);
    if (this.lighter.visible) {
      const rp = handPos(f.rig, 'R', new THREE.Vector3());
      this.lighter.position.copy(rp).add(_v3.set(0, 0.03, 0));
      this.u.uFlame.value.set(rp.x, rp.y + 0.07, rp.z, this.u.uFlame.value.w);
    }
    // the ember: glows up on a drag
    const tip = this.cig.localToWorld(new THREE.Vector3(0, 0, 0.066));
    const glowing = this.cig.visible && !(st.phase === 'intro' && st.t < 1.2);
    this.u.uEmber.value.set(tip.x, tip.y, tip.z, glowing ? 0.3 + drag * 0.9 * (0.8 + 0.2 * Math.sin(t * 30)) : 0);
    // smoke: a thread off the tip, a cloud out of the mouth
    if (glowing) {
      st.thread = (st.thread || 0) - dt;
      if (st.thread <= 0) {
        st.thread = 0.11;
        this.smoke.emit(tip.x, tip.y + 0.01, tip.z, 0, 0.1, 0, { life: 2.2, s0: 0.012, s1: 0.13, a: 0.1, rise: 0.18, drag: 1.0, col: [0.7, 0.74, 0.8], jitter: 0.03 });
      }
    }
    if (exhale > 0.2) {
      st.puff = (st.puff || 0) - dt;
      if (st.puff <= 0) {
        st.puff = 0.045;
        const fwd = head.localToWorld(new THREE.Vector3(0, 0.35, 1)).sub(head.getWorldPosition(new THREE.Vector3())).normalize();
        this.smoke.emit(mouth.x, mouth.y, mouth.z, fwd.x * 0.6, fwd.y * 0.6 + 0.1, fwd.z * 0.6, { life: 2.4, s0: 0.03, s1: 0.32, a: 0.2, rise: 0.1, drag: 1.4, col: [0.72, 0.76, 0.82], jitter: 0.12 });
      }
    }
  }

  _flickButt() {
    const tip = this.cig.localToWorld(new THREE.Vector3(0, 0, 0.06));
    const to = new THREE.Vector3(ROOM.X0 - 0.6, 0.05, (GATE.wz0 + GATE.wz1) / 2 + 0.2);
    const v = to.sub(tip);
    this.sparks.burst(tip.x, tip.y, tip.z, 10, { color: [1, 0.45, 0.12], speed: 1.2, life: 0.5, size: 0.04, gravity: -6, drag: 1.0, dir: { x: v.x, y: v.y + 1.2, z: v.z }, cone: 0.25 });
    this.butt = { p: tip.clone(), v: new THREE.Vector3(v.x * 1.4, 2.0, v.z * 1.4), t: 0 };
    this.u.uEmber.value.w = 0;
  }

  // ---- slot 3: on one knee, packing (and repacking) the rucksack ----
  _packer(f, dt) {
    const n = f.rig.nodes;
    const st = f.st;
    const t = this.t;
    const c = this.cut;
    const rc = c && c.t > 1.3 ? c.t - 1.3 : -1;
    const root = f.rig.root;
    if ((st.phase === 'intro' && st.t > 1.0) || st.phase === 'idle') { st.phase = 'pack'; st.t = 0; st.i = this._nextItem(); }
    // the cycle: pack · close · lift · open · unpack → pack
    let bend = 0.42, twist = 0, side = 1, handAt = null, bothTop = 0, lift = 0;
    const mouthW = this.pack.localToWorld(new THREE.Vector3(0, PACK.h + 0.03, 0));
    const insideW = this.pack.localToWorld(new THREE.Vector3(0, PACK.h - 0.16, 0));
    if (rc >= 0 && st.phase !== 'react') { st.phase = 'react'; st.t = 0; st.swept = 0; }
    if (st.phase === 'pack') {
      const it = this.items[st.i];
      if (!it) { st.phase = 'close'; st.t = 0; }
      else {
        const home = this._itemHome(it, new THREE.Vector3());
        const lx = ITEM_SPOTS[it.i][0];
        side = lx >= 0 ? 1 : -1; // their +x side: the 'R' hand
        const T = st.t;
        bend = 0.42 + 0.6 * bell(T, 0, 0.7, 0.9, 1.5);
        twist = side * 0.42 * bell(T, 0, 0.6, 0.9, 1.4);
        const look = root.localToWorld(new THREE.Vector3(side * 0.13, 0.98, 0.36));
        const grab = home.clone().add(_v3.set(0, 0.07, 0));
        if (T < 0.85) handAt = grab;
        else if (T < 1.6) handAt = grab.lerp(look, seg(T, 0.85, 1.4));
        else if (T < 2.1) handAt = look.clone().lerp(mouthW, seg(T, 1.6, 2.05));
        else if (T < 2.5) handAt = mouthW.clone().lerp(insideW, seg(T, 2.1, 2.4));
        else handAt = insideW.clone().lerp(mouthW.clone().add(_v3.set(0, 0.06, 0)), seg(T, 2.5, 2.9));
        if (T > 0.7 && T < 2.4 && it.state === 'floor') { it.state = 'hand'; it.side = side; }
        if (T >= 2.4 && it.state === 'hand') { it.state = 'bag'; it.mesh.visible = false; }
        bothTop = bell(T, 2.75, 2.95, 3.1, 3.3);
        if (T > 0.9 && T < 1.6) { f.look.tgt = null; f.look.wy = side * 0.25; f.look.wp = 0.35; }
        if (T > 3.45) {
          st.t = 0;
          st.i = this._nextItem();
          if (st.i < 0) { st.phase = 'close'; st.t = 0; }
        }
      }
    } else if (st.phase === 'close') {
      this.flap.rotation.x = lerp(-2.25, 0, seg(st.t, 0.1, 0.6));
      bothTop = bell(st.t, 0, 0.2, 0.7, 0.9);
      if (!st.zipped && st.t > 0.3) { st.zipped = true; if (this.audio && this.audio.zipper && this.visible) this.audio.zipper(); }
      if (st.t > 0.9) { st.phase = 'lift'; st.t = 0; st.zipped = false; }
    } else if (st.phase === 'lift') {
      lift = bell(st.t, 0.1, 0.6, 1.2, 1.7);
      bend = 0.42 - 0.2 * lift;
      if (st.t > 1.7 && !st.thud) { st.thud = true; if (this.audio && this.audio.softThud && this.visible) this.audio.softThud(); }
      if (st.t > 2.1) { st.phase = 'open'; st.t = 0; st.thud = false; }
    } else if (st.phase === 'open') {
      this.flap.rotation.x = lerp(0, -2.25, seg(st.t, 0.1, 0.5));
      bothTop = bell(st.t, 0, 0.15, 0.4, 0.6);
      if (st.t > 0.6) { st.phase = 'unpack'; st.t = 0; st.k = 0; }
    } else if (st.phase === 'unpack') {
      // in, out, toss it back on the floor — one after another
      const per = 0.55;
      const k = Math.floor(st.t / per);
      const T = st.t - k * per;
      handAt = mouthW.clone().lerp(insideW, bell(T, 0, 0.15, 0.2, 0.32)).add(_v3.set(0, 0.1 * seg(T, 0.3, 0.5), 0));
      side = k % 2 ? 1 : -1;
      if (k > st.k - 1 && T > 0.3 && st.k <= k && st.k < this.items.length) {
        const it = this.items[st.k];
        it.state = 'fly';
        it.mesh.visible = true;
        it.from.copy(mouthW);
        this._itemHome(it, it.to);
        it.t = 0;
        it.dur = 0.4;
        it.arc = 0.28;
        st.k++;
      }
      bend = 0.5;
      if (st.t > per * this.items.length + 0.4) { st.phase = 'pack'; st.t = 0; st.i = this._nextItem(); }
    } else if (st.phase === 'react') {
      // everything left on the floor goes in at once, flap down, up on the feet, rucksack on the shoulder
      for (const it of this.items) {
        if ((it.state === 'floor' || it.state === 'hand') && st.t > 0.05 + st.swept * 0.09) {
          it.state = 'fly';
          it.from.copy(it.mesh.position);
          it.to.copy(insideW);
          it.t = 0;
          it.dur = 0.3;
          it.arc = 0.2;
          it.into = true;
          st.swept++;
        }
      }
      this.flap.rotation.x = lerp(this.flap.rotation.x, 0, seg(st.t, 0.4, 0.7));
      if (!st.zipped && st.t > 0.45) { st.zipped = true; if (this.audio && this.audio.zipper && this.visible) this.audio.zipper(true); }
      bothTop = bell(st.t, 0.2, 0.4, 0.75, 0.9);
    }
    const up = rc < 0 ? 0 : seg(rc, 0.9, 1.7);
    // body
    n.hips.position.set(0, lerp(0.56, 0.94, up), lerp(-0.05, 0.05, up));
    n.hips.rotation.x = lerp(0.1, 0, up);
    n.chest.rotation.x = lerp(bend + Math.sin(t * 1.4) * 0.01, 0.06, up);
    n.chest.rotation.y = twist * (1 - up);
    n.thL.rotation.set(lerp(-1.45, -0.02, up), 0, lerp(-0.32, -0.03, up));
    n.knL.rotation.x = lerp(1.45, 0.04, up);
    n.thR.rotation.set(lerp(-0.08, 0.0, up), 0, lerp(0.06, 0.03, up));
    n.knR.rotation.x = lerp(1.6, 0.04, up);
    this._applyLook(f, 1, 0.15 * (1 - up));
    root.updateMatrixWorld(true);
    // the rucksack: on the floor; lifted to weigh it; on the shoulder at the end
    const homeP = new THREE.Vector3(this.packHome.x, 0, this.packHome.z);
    if (up > 0) {
      // slung over one shoulder: it hangs at their side, where you can see it
      const sh = n.chest.localToWorld(new THREE.Vector3(0.3, -0.02, -0.16));
      this.pack.position.copy(homeP.lerp(sh, up));
      this.pack.rotation.set(0.12 * up, this.packHome.yaw + (SPOTS[3].yaw - this.packHome.yaw + 0.35) * up, 0.18 * up);
    } else {
      this.pack.position.set(this.packHome.x, lift * 0.32, this.packHome.z);
      this.pack.rotation.set(0, this.packHome.yaw, Math.sin(st.t * 7) * 0.05 * lift);
    }
    if (st.phase === 'intro') {
      // the rucksack lands, a little dust
      const k = seg(st.t, 0, 0.35);
      this.pack.position.y = (1 - k) * 0.25;
      if (k >= 1 && !st.landed) {
        st.landed = true;
        if (this.audio && this.audio.softThud && this.visible) this.audio.softThud();
        this.smoke.emit(this.pack.position.x, 0.05, this.pack.position.z, 0, 0.15, 0, { life: 1.2, s0: 0.1, s1: 0.5, a: 0.08, rise: 0.05, drag: 2, col: [0.5, 0.48, 0.45], jitter: 0.4 });
      }
      this.flap.rotation.x = lerp(0, -2.25, seg(st.t, 0.4, 0.9));
    }
    this.pack.updateMatrixWorld(true);
    // hands
    const top = (s) => this.pack.localToWorld(new THREE.Vector3(s * 0.15, PACK.h + 0.02, PACK.d * 0.3));
    const sideP = (s) => this.pack.localToWorld(new THREE.Vector3(s * (PACK.w / 2 + 0.03), PACK.h * 0.55, 0));
    const steady = this.pack.localToWorld(new THREE.Vector3(0, PACK.h * 0.85, PACK.d * 0.52));
    let L, R;
    const work = side > 0 ? 'R' : 'L';
    if (lift > 0) { L = sideP(1); R = sideP(-1); }
    else if (handAt) {
      if (work === 'L') { L = handAt; R = steady.clone().add(_v3.set(0.06, 0, 0)); }
      else { R = handAt; L = steady.clone().add(_v3.set(-0.06, 0, 0)); }
    } else { L = steady.clone(); R = steady.clone(); }
    if (bothTop > 0) { L = L.clone().lerp(top(1), bothTop); R = R.clone().lerp(top(-1), bothTop); }
    if (up > 0) {
      const strap = n.chest.localToWorld(new THREE.Vector3(0.14, 0.52, 0.12));
      R = R.clone().lerp(strap, up);
      L = L.clone().lerp(root.localToWorld(new THREE.Vector3(-0.2, 0.92, 0.05)), up);
    }
    reach(f.rig, 'L', L, _pole.set(-0.9, -0.5, -0.2), 1);
    reach(f.rig, 'R', R, _pole.set(0.9, -0.5, -0.2), 1);
    root.updateMatrixWorld(true);
    // items in flight / in hand
    for (const it of this.items) {
      if (it.state === 'hand') {
        const hp = handPos(f.rig, it.side > 0 ? 'R' : 'L', new THREE.Vector3());
        it.mesh.position.copy(hp).add(_v3.set(0, -0.05, 0));
        it.mesh.rotation.y += dt * 1.5;
      } else if (it.state === 'fly') {
        it.t += dt;
        const x = Math.min(1, it.t / it.dur);
        it.mesh.position.copy(it.from).lerp(it.to, x);
        it.mesh.position.y += Math.sin(x * PI) * it.arc;
        it.mesh.rotation.y += dt * 6;
        if (x >= 1) {
          if (it.into) { it.state = 'bag'; it.mesh.visible = false; it.into = false; }
          else { it.state = 'floor'; it.mesh.rotation.set(0, SPOTS[3].yaw + it.yaw, 0); }
        }
      }
    }
  }

  _nextItem() {
    for (const it of this.items) if (it.state === 'floor') return it.i;
    return -1;
  }

  // ---------------- contact shadows ----------------
  _blobs() {
    const B = this.u.uBlob.value;
    let i = 0;
    const put = (x, z, r, s) => {
      if (i < B.length) B[i++].set(x, z, r, s);
    };
    put(DRUM_AT[0], DRUM_AT[2], 0.42, 0.55);
    put(LANTERN_AT[0], LANTERN_AT[2], 0.16, 0.5);
    put(SPOTS[1].pos[0], SPOTS[1].pos[2], 0.42, 0.45); // the chair
    put(this.pack.position.x, this.pack.position.z, 0.36 * (1 - clamp(this.pack.position.y, 0, 1)), 0.55);
    put(3.85, 0.42, 0.45, 0.5); // tyres
    for (let s = 1; s < 4; s++) {
      const f = this.figs[s];
      if (!f) continue;
      const p = f.rig.nodes.hips.getWorldPosition(_w);
      put(p.x, p.z, 0.5, 0.55 * f.appear);
    }
    while (i < B.length) B[i++].set(0, 0, 1, 0);
  }

  // ---------------- the camera ----------------
  resize(w, h) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.camera.aspect = this.w / this.h;
    this._fit();
  }

  setSafe(top, bottom) {
    if (Math.abs(top - this.safe.top) < 2 && Math.abs(bottom - this.safe.bottom) < 2) return;
    this.safe.top = top;
    this.safe.bottom = bottom;
    this._fit();
  }

  // pick a distance that shows everyone, between the UI's top bar and bottom dock
  _fit() {
    const cam = this.camera;
    const a = this.w / this.h;
    // a tall screen can't hold the whole garage at a useful size: it shows the middle and drifts side to side
    const portrait = a < 0.85;
    const narrow = !portrait && a < 1.25;
    cam.fov = portrait ? 46 : narrow ? 40 : 34;
    const pitch = portrait ? -0.5 : narrow ? -0.27 : -0.18;
    const yaw = portrait ? 0.0 : 0.07;
    const dir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    const target = new THREE.Vector3(-0.3, 0.85, 0.35);
    const pts = [];
    const bx = portrait ? [-2.35, 1.85] : narrow ? [-4.25, 3.45] : [-4.3, 3.6], by = [0.0, portrait ? 1.9 : 2.15], bz = portrait ? [-1.3, 2.4] : [-1.7, 2.55];
    for (const x of bx) for (const y of by) for (const z of bz) pts.push(new THREE.Vector3(x, y, z));
    const sy = Math.max(0.3, 1 - (this.safe.top + this.safe.bottom) / this.h);
    const sx = 1 - 24 / this.w;
    cam.clearViewOffset();
    cam.updateProjectionMatrix();
    const fits = (d) => {
      cam.position.copy(target).addScaledVector(dir, -d);
      cam.lookAt(target);
      cam.updateMatrixWorld(true);
      for (const p of pts) {
        const v = p.clone().project(cam);
        if (v.z > 1 || Math.abs(v.x) > sx || Math.abs(v.y) > sy) return false;
      }
      return true;
    };
    let lo = 3, hi = 40;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    this.base = { target, dir, d: hi, pan: portrait ? [-1.7, 1.45] : null };
    // centre the picture in the space the UI leaves
    const cy = (this.safe.bottom - this.safe.top) / 2;
    if (Math.abs(cy) > 1) cam.setViewOffset(this.w, this.h, 0, cy, this.w, this.h);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }

  _camera(dt) {
    if (!this.base) this._fit();
    const cam = this.camera;
    if (this.debugCam) {
      // (tests: look closely at one place)
      cam.position.set(...this.debugCam.pos);
      cam.lookAt(...this.debugCam.at);
      cam.updateMatrixWorld(true);
      return;
    }
    let { target } = this.base;
    const { dir, d } = this.base;
    const P = this.ptr;
    P.nx = damp(P.nx, P.on ? P.x : 0, 2.5, dt);
    P.ny = damp(P.ny, P.on ? P.y : 0, 2.5, dt);
    const home = 1 + 0.12 * (this.homeK ?? 1);
    const push = this.cut ? 1 - seg(this.cut.t, 0, 3.6) * 0.07 : 1;
    const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    // (portrait) the slow sweep — toward whoever's talking, centred on the car when it starts
    let panX = 0;
    if (this.base.pan) {
      const [l, r] = this.base.pan;
      let want = l + (r - l) * ease((Math.sin(this.t * 0.26) + 1) / 2);
      let best = 0.18;
      if (this.voice) {
        for (const f of this.figs) {
          if (!f || f.leaving) continue;
          const lv = this.voice(f.id);
          if (lv > best) {
            best = lv;
            want = clamp(this._headWorld(f, _w).x - target.x, l, r);
          }
        }
      }
      if (this.cut) want = 0.25;
      this.panX = damp(this.panX ?? 0, want, this.cut ? 2.5 : 0.9, dt);
      panX = this.panX;
    }
    target = target.clone();
    target.x += panX;
    cam.position.copy(target).addScaledVector(dir, -d * home * push);
    cam.position.addScaledVector(right, P.nx * 0.35 + Math.sin(this.t * 0.17) * 0.12);
    cam.position.y += -P.ny * 0.15 + Math.sin(this.t * 0.23) * 0.05;
    const look = target.clone();
    this.camShake = Math.max(0, this.camShake - dt * 1.6);
    if (this.camShake > 0) {
      const k = this.camShake * this.camShake * 0.035;
      look.x += (Math.random() - 0.5) * k;
      look.y += (Math.random() - 0.5) * k;
    }
    cam.lookAt(look);
    cam.updateMatrixWorld(true);
    this.ceiling.visible = cam.position.y < ROOM.H - 0.05; // (from above it would hide everything)
  }

  // the pointer, for a little parallax (and to find your own figure under it)
  pointer(clientX, clientY, on = true) {
    this.ptr.x = (clientX / this.w) * 2 - 1;
    this.ptr.y = (clientY / this.h) * 2 - 1;
    this.ptr.on = on;
    this.hoverSlot = on ? this.hit(clientX, clientY) : -1;
    return this.hoverSlot;
  }

  // which figure is under a screen point (CSS px) — a capsule from the hips to the head
  hit(clientX, clientY) {
    let best = -1, bd = 1e9;
    for (const f of this.figs) {
      if (!f || f.leaving || f.appear < 0.5) continue;
      const a = this._screen(f.rig.nodes.hips.getWorldPosition(_w), _v1);
      const b = this._screen(this._headWorld(f, _w2).add(_v3.set(0, 0.1, 0)), _v2);
      if (!a || !b) continue;
      const r = Math.abs(a.y - b.y) * 0.45 + 8;
      const vx = b.x - a.x, vy = b.y - a.y;
      const l2 = vx * vx + vy * vy || 1;
      const k = clamp(((clientX - a.x) * vx + (clientY - a.y) * vy) / l2, -0.3, 1.1);
      const dx = clientX - (a.x + vx * k), dy = clientY - (a.y + vy * k);
      const dd = Math.hypot(dx, dy);
      if (dd < r && dd < bd) { bd = dd; best = f.slot; }
    }
    return best;
  }

  _screen(p, out) {
    const v = _v4.copy(p).project(this.camera);
    if (v.z > 1) return null;
    return out.set((v.x * 0.5 + 0.5) * this.w, (-v.y * 0.5 + 0.5) * this.h, 0);
  }

  // where each slot's name tag hangs (CSS px), refreshed every frame
  _anchors() {
    const out = this.anchorsOut;
    out.length = 0;
    for (let s = 0; s < 4; s++) {
      const f = this.figs[s];
      let p;
      if (f && !f.leaving) p = this._headWorld(f, _w).add(_v3.set(0, 0.3, 0));
      else if (s === 0) p = this._carPoint([0.1, 2.1, 0.42], _w);
      else p = _w.set(...EMPTY_TAG[s]);
      const sc = this._screen(p, _v1);
      const on = !!sc && sc.x > -30 && sc.x < this.w + 30;
      out.push(on ? { slot: s, x: sc.x, y: sc.y, on: true, here: !!(f && !f.leaving), appear: f ? f.appear : 0 } : { slot: s, on: false });
    }
    return out;
  }

  // the butt flying out through the gap, trailing sparks
  _butt(dt) {
    const b = this.butt;
    if (!b) return;
    b.t += dt;
    b.v.y -= 9.8 * dt;
    b.p.addScaledVector(b.v, dt);
    if (b.p.y < 0.02 || b.t > 1.2) {
      this.sparks.burst(b.p.x, 0.03, b.p.z, 6, { color: [1, 0.45, 0.12], speed: 0.8, up: 0.6, life: 0.4, size: 0.035, gravity: -5, drag: 1.5 });
      this.butt = null;
    } else this.sparks.burst(b.p.x, b.p.y, b.p.z, 1, { color: [1, 0.5, 0.15], speed: 0.2, life: 0.35, size: 0.03, gravity: 0, drag: 2 });
  }

  anchors() {
    return this.anchorsOut;
  }
}
