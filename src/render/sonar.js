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
  uSun: { value: new THREE.Vector3(0.5, 0.35, -0.8).normalize() },
};

const PULSE_GLSL = /* glsl */ `
#define MAXP ${N}
uniform float uTime;
uniform vec4 uPA[MAXP];
uniform vec4 uPB[MAXP];
uniform vec4 uPC[MAXP];
uniform vec3 uCam;
uniform float uDawn;
uniform vec3 uSun;

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
    float fall = 1.0 - smoothstep(B.y * 0.42, B.y, d);
    float lit = front > 0.0 ? exp(-(front / B.x) * B.w) : 0.0;
    float ring = exp(-front * front * 0.8) * (1.0 - smoothstep(B.y - 4.0, B.y + 0.5, r));
    float facing = abs(dot(Nrm, dv / max(d, 0.001)));
    float s = B.z * fall;
    acc += uPC[i].rgb * s * (lit * (0.45 + 0.55 * facing) + ring * 1.7);
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

const EDGE_GLSL = /* glsl */ `
float edgeFactor(vec3 b, float w) {
  vec3 d = fwidth(b);
  vec3 a = smoothstep(d * max(w - 0.6, 0.0), d * (w + 0.6), b);
  return 1.0 - min(min(a.x, a.y), a.z);
}
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

const vec3 KC[12] = vec3[12](
  vec3(0.30, 0.56, 0.66),  // ground
  vec3(0.70, 0.90, 1.00),  // bark
  vec3(0.42, 0.95, 0.86),  // leaf
  vec3(0.58, 0.74, 1.00),  // rock
  vec3(1.00, 0.88, 0.72),  // wood
  vec3(0.82, 0.92, 1.00),  // metal
  vec3(1.00, 0.42, 0.38),  // effigy
  vec3(1.00, 0.20, 0.15),  // flesh
  vec3(1.00, 0.90, 0.85),  // bone
  vec3(1.00, 1.00, 1.00),  // eye
  vec3(0.45, 0.78, 1.00),  // water
  vec3(1.00, 0.70, 0.25)   // shard
);

void main() {
  vec3 Nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  if (dot(Nrm, toCam) < 0.0) Nrm = -Nrm;
  int k = int(vKind);
  vec3 base = KC[k];

  float ring;
  vec3 L = sonarLight(vWorld, Nrm, ring);

  float edge = edgeFactor(vBary, k == 0 ? 0.9 : 1.15);
  float distEdge = 1.0 - smoothstep(28.0, 115.0, camD) * 0.75;
  float grazing = smoothstep(0.02, 0.25, abs(dot(Nrm, toCam / camD)));
  edge *= distEdge * mix(0.35, 1.0, grazing);

  // stipple: gives faces a grainy point-cloud texture
  float st = hash13(floor(vWorld * 16.0));
  float face = (k == 0 ? 0.10 : 0.16) * (0.6 + 0.8 * st);
  if (k == 10) {
    face = 0.22 + 0.18 * sin(vWorld.x * 1.7 + uTime * 1.3) * sin(vWorld.z * 1.3 - uTime * 0.9);
  }
  float edgeGain = (k == 5 ? 1.55 : 1.15);

  vec3 col = base * L * (face + edge * edgeGain);
  col += vec3(0.9, 0.98, 1.0) * ring * edge * 0.55;
  // rare sparkles on the wavefront
  float sp = step(0.992, hash13(floor(vWorld * 11.0) + floor(uTime * 14.0)));
  col += base * sp * ring * 1.5;

  // depth fade
  col *= exp(-camD * 0.009);

  // dawn: the forest becomes visible
  if (uDawn > 0.0) {
    float sunL = max(dot(Nrm, uSun), 0.0);
    float sky = 0.5 + 0.5 * Nrm.y;
    vec3 warm = vec3(1.0, 0.8, 0.62);
    vec3 day = base * (0.32 * sky + 1.05 * sunL * warm) * (0.75 + 0.35 * st);
    day += edge * base * 0.12;
    vec3 fogC = vec3(0.62, 0.52, 0.5);
    float fog = 1.0 - exp(-camD * 0.016);
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
const GHOST_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
uniform vec3 uColor;
uniform float uAlpha;
uniform float uFlash;
uniform float uFull;
varying vec3 vWorld;
varying vec3 vBary;
varying float vKind;
${EDGE_GLSL}
void main() {
  vec3 Nrm = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  float facing = abs(dot(Nrm, toCam / camD));
  float edge = edgeFactor(vBary, 1.25);
  int k = int(vKind);
  vec3 c = uColor;
  if (k == 8) c = mix(uColor, vec3(1.0, 0.85, 0.8), 0.55); // bone parts read whiter
  vec3 col = c * (edge * 2.6 + 0.26 + 0.5 * facing + uFull * (0.35 + 0.4 * facing));
  if (k == 9) col = vec3(3.2, 2.8, 2.6); // eyes burn
  float fl = 0.82 + 0.18 * sin(uTime * 53.0 + vWorld.y * 17.0);
  col *= uAlpha * fl;
  col += uFlash * c * edge * 2.5;
  col *= exp(-camD * 0.007);
  gl_FragColor = vec4(col, 1.0);
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
    },
    vertexShader: WORLD_VERT,
    fragmentShader: GHOST_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
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
  vec3 L = sonarLight(wp, vec3(0.0), ring);
  vCol = (L * 0.55 + ring * vec3(0.8, 0.95, 1.0) * 0.6) * (0.5 + aSeed.w);
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
    uniforms: { uDawn: shared.uDawn, uSun: shared.uSun, uTime: shared.uTime },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDawn;
      uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 top = vec3(0.28, 0.42, 0.7);
        vec3 hor = vec3(1.25, 0.72, 0.5);
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
