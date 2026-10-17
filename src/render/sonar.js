// Sonar shaders. The world is pitch black; only expanding sound waves (pulses) light it up.
// Every lit surface shows glowing low-poly wire edges + faint stippled faces.
import * as THREE from 'three';
import { CFG } from '../core/config.js';

const N = CFG.PULSE.slots;

export const shared = {
  uTime: { value: 0 },
  uPA: { value: Array.from({ length: N }, () => new THREE.Vector4(0, 0, 0, -1e4)) }, // origin.xyz, start time
  uPB: { value: Array.from({ length: N }, () => new THREE.Vector4(30, 0, 0, 1)) }, // speed, radius, strength, decay
  uPC: { value: Array.from({ length: N }, () => new THREE.Vector4(1, 1, 1, 0)) }, // rgb tint
  uCam: { value: new THREE.Vector3() },
  uDawn: { value: 0 },
  uMorning: { value: 0 }, // 1 = the calm morning (high sun, blue sky), 0 = the victory dawn
  uFear: { value: 0 }, // 0..1 — when something hunts you, the forest bleeds red
  uSun: { value: new THREE.Vector3(0.5, 0.35, -0.8).normalize() },
  // work lamps of running generators: xyz + intensity (0 = off)
  uLamp: { value: Array.from({ length: 5 }, () => new THREE.Vector4(0, -100, 0, 0)) },
  uLampR: { value: CFG.LAMP_R },
  // burning signal flares (the two brightest): xyz + intensity (0 = none)
  uFlare: { value: Array.from({ length: 2 }, () => new THREE.Vector4(0, -100, 0, 0)) },
  uFlareR: { value: CFG.FLARE.radius },
};

const PULSE_GLSL = /* glsl */ `
#define MAXP ${N}
uniform float uTime;
uniform vec4 uPA[MAXP];
uniform vec4 uPB[MAXP];
uniform vec4 uPC[MAXP];
uniform vec3 uCam;
uniform float uDawn;
uniform float uMorning;
uniform float uFear;
uniform vec3 uSun;
uniform vec4 uLamp[5];
uniform float uLampR;
uniform vec4 uFlare[2];
uniform float uFlareR;

// a signal flare: hard red light from above, over a whole stretch of forest. surfaces turned away
// from it stay dark (it's the only thing out here that casts a direction)
vec3 flareLight(vec3 P, vec3 Nrm) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 2; i++) {
    vec4 Fl = uFlare[i];
    if (Fl.w <= 0.001) continue;
    vec3 dv = Fl.xyz - P;
    float d = length(dv);
    if (d > uFlareR) continue;
    float fall = 1.0 - smoothstep(uFlareR * 0.12, uFlareR, d);
    float facing = dot(Nrm, Nrm) > 0.5 ? 0.16 + 0.84 * max(dot(Nrm, dv / max(d, 0.001)), 0.0) : 1.0;
    acc += vec3(1.0, 0.27, 0.17) * Fl.w * fall * facing;
  }
  return acc;
}

// steady warm light pooled under the work lamps of running generators
vec3 lampLight(vec3 P, vec3 Nrm) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec4 Lm = uLamp[i];
    if (Lm.w <= 0.001) continue;
    vec3 dv = Lm.xyz - P;
    float d = length(dv);
    if (d > uLampR * 1.5) continue;
    float fall = 1.0 - smoothstep(uLampR * 0.12, uLampR * 1.5, d);
    float facing = dot(Nrm, Nrm) > 0.5 ? 0.35 + 0.65 * abs(dot(Nrm, dv / max(d, 0.001))) : 1.0;
    acc += vec3(1.0, 0.72, 0.4) * Lm.w * fall * fall * facing;
  }
  return acc;
}

// accumulate sonar light at point P (N = facing normal, may be zero for points)
vec3 sonarLight(vec3 P, vec3 Nrm, out float ringOut) {
  vec3 acc = vec3(0.0);
  float ringSum = 0.0;
  for (int i = 0; i < MAXP; i++) {
    vec4 B = uPB[i];
    if (B.z <= 0.001) continue;
    vec4 A = uPA[i];
    float age = uTime - A.w;
    if (age < 0.0) continue;
    vec3 dv = P - A.xyz;
    float d = length(dv);
    if (d > B.y) continue;
    float r = age * B.x;
    float front = r - d;
    if (front < -1.8) continue;
    // steep falloff: the far edge of a ping is only a rumour of shapes
    float fall = 1.0 - smoothstep(B.y * 0.28, B.y, d);
    // light: a quick flash that sinks fast, then a long dim afterimage
    float since = max(front, 0.0) / B.x;
    float lit = front > 0.0 ? 0.6 * exp(-since * B.w * 2.0) + 0.4 * exp(-since * B.w * 0.55) : 0.0;
    float ring = exp(-front * front * 1.15) * (1.0 - smoothstep(B.y - 4.0, B.y + 0.5, r));
    float facing = abs(dot(Nrm, dv / max(d, 0.001)));
    float s = B.z * fall;
    acc += uPC[i].rgb * s * (lit * (0.3 + 0.7 * facing) + ring * 1.45);
    ringSum += ring * s;
  }
  ringOut = ringSum;
  return acc;
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
`;

export const EDGE_GLSL = /* glsl */ `
float edgeFactor(vec3 b, float w) {
  vec3 d = fwidth(b);
  vec3 a = smoothstep(d * max(w - 0.6, 0.0), d * (w + 0.6), b);
  return 1.0 - min(min(a.x, a.y), a.z);
}
`;

// night palette per material kind (shared with the atlas portraits)
export const KIND_COLORS_GLSL = /* glsl */ `
// cold, ashen palette: the forest is grey bone and frost, only flesh is red
const vec3 KC[12] = vec3[12](
  vec3(0.27, 0.31, 0.33),  // ground
  vec3(0.60, 0.66, 0.68),  // bark
  vec3(0.44, 0.55, 0.54),  // leaf
  vec3(0.54, 0.59, 0.65),  // rock
  vec3(0.76, 0.68, 0.60),  // wood
  vec3(0.70, 0.76, 0.82),  // metal
  vec3(0.92, 0.32, 0.26),  // effigy
  vec3(1.00, 0.14, 0.09),  // flesh
  vec3(0.90, 0.84, 0.78),  // bone
  vec3(1.00, 1.00, 1.00),  // eye
  vec3(0.34, 0.46, 0.54),  // water
  vec3(1.00, 0.70, 0.25)   // shard
);
`;

const WORLD_VERT = /* glsl */ `
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

const WORLD_FRAG = /* glsl */ `
${PULSE_GLSL}
${EDGE_GLSL}
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;

${KIND_COLORS_GLSL}// daylight palette: what the forest looks like when you can actually see it
const vec3 DC[12] = vec3[12](
  vec3(0.34, 0.38, 0.22),  // ground: moss and needles
  vec3(0.42, 0.33, 0.25),  // bark
  vec3(0.25, 0.42, 0.21),  // leaf
  vec3(0.52, 0.52, 0.49),  // rock
  vec3(0.62, 0.47, 0.32),  // wood
  vec3(0.86, 0.62, 0.18),  // metal: generators are painted safety yellow
  vec3(0.50, 0.38, 0.27),  // effigy: just sticks, in daylight
  vec3(0.78, 0.24, 0.20),  // flesh
  vec3(0.86, 0.80, 0.72),  // bone
  vec3(1.00, 1.00, 1.00),  // eye
  vec3(0.36, 0.52, 0.62),  // water
  vec3(1.00, 0.70, 0.25)   // shard
);

void main() {
  vec3 Nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  if (dot(Nrm, toCam) < 0.0) Nrm = -Nrm;
  int k = int(vKind + 0.5); // (an interpolated constant can land a hair under the integer)
  vec3 base = KC[k];

  float ring;
  vec3 L = sonarLight(vWorld, Nrm, ring);
  vec3 lamp = lampLight(vWorld, Nrm);
  vec3 flare = flareLight(vWorld, Nrm);
  L += lamp + flare;

  float edge = edgeFactor(vBary, k == 0 ? 0.75 : 1.0);
  float distEdge = 1.0 - smoothstep(14.0, 90.0, camD) * 0.82;
  float grazing = smoothstep(0.02, 0.25, abs(dot(Nrm, toCam / camD)));
  edge *= distEdge * mix(0.3, 1.0, grazing);
  // scanned, not drawn: lines break into grainy dashes
  float dash = hash13(floor(vWorld * 9.0));
  edge *= 0.4 + 0.6 * smoothstep(0.12, 0.62, dash);
  if (k == 0) edge *= 0.6; // the ground grid stays a whisper

  // point-cloud faces: mostly black with sparse specks (averaged out in the distance)
  float st = hash13(floor(vWorld * 16.0));
  float speck = mix(smoothstep(0.80, 0.97, st), 0.11, smoothstep(9.0, 38.0, camD));
  float face = (k == 0 ? 0.03 : 0.045) + speck * (k == 0 ? 0.2 : 0.3);
  if (k == 10) {
    face = 0.1 + 0.08 * sin(vWorld.x * 1.7 + uTime * 1.3) * sin(vWorld.z * 1.3 - uTime * 0.9);
  }
  float edgeGain = (k == 5 ? 1.75 : 1.4);

  vec3 col = base * L * (face + edge * edgeGain);
  col += base * lamp * (0.17 + 0.12 * st); // a lamp fills surfaces, not just their edges
  col += base * flare * (0.26 + 0.2 * st); // ...and so does a flare, red, everywhere it reaches
  col += vec3(0.78, 0.85, 0.9) * ring * edge * 0.42;
  // rare sparkles on the wavefront
  float sp = step(0.993, hash13(floor(vWorld * 11.0) + floor(uTime * 14.0)));
  col += base * sp * ring * 1.1;

  // the dark eats distance
  col *= exp(-camD * 0.015);

  // fear: when something is hunting you the forest bleeds
  if (uFear > 0.001) {
    float lum = dot(col, vec3(0.35, 0.5, 0.15));
    col = mix(col, vec3(lum * 1.55, lum * 0.16, lum * 0.12), uFear * 0.65);
  }

  // daylight (the morning, or the dawn you earned): the forest becomes visible
  if (uDawn > 0.0) {
    vec3 dbase = DC[k];
    float sunL = max(dot(Nrm, uSun), 0.0);
    float sky = 0.5 + 0.5 * Nrm.y;
    vec3 warm = mix(vec3(1.0, 0.8, 0.62), vec3(1.0, 0.93, 0.82), uMorning);
    vec3 day = dbase * (mix(0.36, 0.5, uMorning) * sky + 1.05 * sunL * warm) * (0.8 + 0.3 * st);
    day += edge * dbase * 0.1;
    vec3 fogC = mix(vec3(0.62, 0.52, 0.5), vec3(0.72, 0.76, 0.78), uMorning);
    float fog = 1.0 - exp(-camD * mix(0.016, 0.011, uMorning));
    day = mix(day, fogC, fog);
    col = mix(col, day + col * 0.3, uDawn);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createWorldMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: WORLD_VERT,
    fragmentShader: WORLD_FRAG,
    extensions: { derivatives: true },
  });
}

// ---------------- monster afterimages ("echo ghosts") ----------------
// A ghost is a dark silhouette that blots out whatever the sonar lit behind it, outlined in
// blood-red wire, with burning eyes. Premultiplied blending: rgb adds light, alpha darkens.
// The vertices shiver and the silhouette tears in horizontal slices — it is never quite still.
const GHOST_VERT = /* glsl */ `
attribute vec4 data;
uniform float uTime;
uniform float uJitter;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
float gh(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float tq = floor(uTime * 16.0);
  float vh = dot(floor(position * 37.0), vec3(1.0, 57.0, 113.0));
  wp.xyz += (vec3(gh(vh + tq), gh(vh + tq + 19.1), gh(vh + tq + 41.7)) - 0.5) * 0.04 * uJitter;
  vWorld = wp.xyz;
  vBary = data.xyz;
  vKind = floor(data.w * 255.0 + 0.5);
  vec4 mv = viewMatrix * wp;
  float band = floor(wp.y * 5.0);
  float tear = step(0.88, gh(band * 7.31 + tq * 1.37));
  mv.x += tear * (gh(band + tq * 0.71) - 0.5) * 0.45 * uJitter;
  gl_Position = projectionMatrix * mv;
}
`;

const GHOST_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
uniform vec3 uColor;
uniform float uAlpha;
uniform float uFlash;
uniform float uFull;
uniform float uBody;
uniform vec3 uDye[4]; // a teammate's clothes: headwear main / accent, outfit main / accent
uniform float uDyeK;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
${EDGE_GLSL}
void main() {
  vec3 Nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  float facing = abs(dot(Nrm, toCam / camD));
  float edge = edgeFactor(vBary, 1.1);
  int k = int(vKind + 0.5); // (an interpolated constant can land a hair under the integer)
  vec3 c = uColor;
  if (k == 8) c = mix(uColor, vec3(0.85, 0.74, 0.7), 0.35); // bone reads paler
  // what they wear shows in the fill (fully in daylight / lamplight); the wire keeps most of their colour,
  // so you still tell your friends apart — and from the things with red outlines
  vec3 fillC = c;
  float fillK = 1.0;
  bool glow = false;
  if (k >= 13 && k <= 18) {
    vec3 dye = k == 13 ? uDye[0] : (k == 14 || k == 17) ? uDye[1] : k == 15 ? uDye[2] : uDye[3];
    fillC = mix(c, dye, uDyeK);
    c = mix(c, dye, uDyeK * 0.35);
    fillK = 1.0 + 0.7 * uDyeK;
    glow = k >= 17;
  }
  // stuttering, not smooth: it flickers like a bad signal
  float fl = 0.72 + 0.28 * step(0.35, fract(sin(floor(uTime * 24.0) * 12.9898 + floor(vWorld.y * 4.0) * 78.233) * 43758.5453));
  float dist = exp(-camD * 0.011);
  vec3 col = c * edge * 2.3 + fillC * fillK * (0.05 + 0.2 * facing * facing + uFull * (0.32 + 0.45 * facing));
  float a = clamp(uAlpha * uBody * (1.0 - edge * 0.65), 0.0, 0.93);
  if (k == 9) { col = vec3(3.6, 2.7, 2.3); a = 0.0; } // eyes burn
  if (glow) { col = mix(col, fillC * 2.6 + 0.3, uDyeK); a *= 1.0 - 0.7 * uDyeK; } // a carved grin, lenses: a light of its own
  col *= uAlpha * fl * dist;
  col += uFlash * c * edge * 2.2 * dist;
  gl_FragColor = vec4(col, a);
}
`;

export function createGhostMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uCam: shared.uCam,
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: 0 },
      uFlash: { value: 0 },
      uFull: { value: 0 },
      uBody: { value: 0.85 },
      uJitter: { value: 1 },
      uDye: { value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1)] },
      uDyeK: { value: 0 },
    },
    vertexShader: GHOST_VERT,
    fragmentShader: GHOST_FRAG,
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    extensions: { derivatives: true },
  });
}

// ---------------- floating dust motes revealed by the waves ----------------
const MOTE_VERT = /* glsl */ `
${PULSE_GLSL}
attribute vec4 aSeed;
uniform float uBox;
uniform float uPix;
varying vec3 vCol;
void main() {
  vec3 p = aSeed.xyz * vec3(uBox, 12.0, uBox);
  float ph = aSeed.w * 6.2831;
  p += vec3(sin(uTime * 0.11 + ph) * 1.8, sin(uTime * 0.07 + ph * 1.7) * 0.8, cos(uTime * 0.09 + ph * 2.3) * 1.8);
  vec3 halfB = vec3(uBox * 0.5, 6.0, uBox * 0.5);
  vec3 wp = uCam + mod(p - uCam + halfB, vec3(uBox, 12.0, uBox)) - halfB;
  float ring;
  vec3 L = sonarLight(wp, vec3(0.0), ring) + lampLight(wp, vec3(0.0)) * 1.6 + flareLight(wp, vec3(0.0)) * 1.2;
  vCol = (L * 0.3 + ring * vec3(0.7, 0.76, 0.8) * 0.38) * (0.3 + aSeed.w);
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uPix * (1.0 + aSeed.w) / max(-mv.z, 0.5), 1.0, 6.0);
  if (dot(vCol, vCol) < 0.0004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;
const MOTE_FRAG = /* glsl */ `
varying vec3 vCol;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.1, length(c));
  gl_FragColor = vec4(vCol * a, 1.0);
}
`;

export function createMotes(count = 2600) {
  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) seeds[i] = Math.random();
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uBox: { value: 46 }, uPix: { value: 9 } },
    vertexShader: MOTE_VERT,
    fragmentShader: MOTE_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

// ---------------- sky dome (only visible at dawn) ----------------
export function createSky() {
  const geo = new THREE.SphereGeometry(140, 24, 12);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDawn: shared.uDawn, uSun: shared.uSun, uTime: shared.uTime, uMorning: shared.uMorning },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDawn;
      uniform float uMorning;
      uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 top = mix(vec3(0.28, 0.42, 0.7), vec3(0.34, 0.54, 0.86), uMorning);
        vec3 hor = mix(vec3(1.25, 0.72, 0.5), vec3(0.98, 0.9, 0.82), uMorning);
        vec3 c = mix(hor, top, smoothstep(-0.05, 0.55, h));
        float sun = pow(max(dot(vDir, uSun), 0.0), 64.0) * 2.5 + pow(max(dot(vDir, uSun), 0.0), 6.0) * 0.4;
        c += vec3(1.0, 0.75, 0.5) * sun;
        gl_FragColor = vec4(c * uDawn, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.renderOrder = -10;
  return m;
}

// ---------------- shards (amber collectibles) ----------------
const SHARD_VERT = /* glsl */ `
attribute vec4 data;
attribute float aGlow;
attribute float aPhase;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
varying float vGlow;
varying float vY;
void main() {
  vec3 p = position;
  vKind = floor(data.w * 255.0 + 0.5);
  if (vKind < 11.5) {
    float a = uTime * 1.3 + aPhase;
    float c = cos(a), s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y += sin(uTime * 2.0 + aPhase) * 0.08;
  }
  vY = position.y;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vBary = data.xyz;
  vGlow = aGlow;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
const SHARD_FRAG = /* glsl */ `
uniform vec3 uCam;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
varying float vGlow;
varying float vY;
${EDGE_GLSL}
void main() {
  if (vGlow < 0.003) discard;
  float camD = length(uCam - vWorld);
  vec3 amber = vec3(1.0, 0.66, 0.22);
  vec3 col;
  if (vKind > 11.5) {
    // light beam above the shard
    float f = 1.0 - smoothstep(0.6, 5.0, vY);
    col = amber * 0.5 * f * (0.7 + 0.3 * sin(uTime * 3.0 + vY * 2.0));
  } else {
    float edge = edgeFactor(vBary, 1.3);
    col = amber * (edge * 2.6 + 0.55);
  }
  col *= vGlow * exp(-camD * 0.006);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createShardMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uCam: shared.uCam },
    vertexShader: SHARD_VERT,
    fragmentShader: SHARD_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    extensions: { derivatives: true },
  });
}
