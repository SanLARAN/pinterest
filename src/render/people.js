// Teammates as your eyes see them: a solid body in their own clothes, lit only by real light — the
// morning sun, a work lamp, a flare, a glow stick, the hut's lantern. In the dark there is nothing to
// see (the echo still finds them: that's the afterimage in ghosts.js).
//
// Alpha out is "how much of this is lit": the post pass leaves lit colours alone instead of turning them
// to ash (see the world shader in sonar.js), so a friend standing under a lamp is simply a friend.
//
// Your own body (seen when you look down — see SelfBody) is the one person the echo lights directly, the way
// it lights the forest: uEcho = 1. (A friend's echo is their afterimage instead.)
import * as THREE from 'three';
import { PULSE_GLSL, EDGE_GLSL, shared } from './sonar.js';

const VERT = /* glsl */ `
attribute vec4 data;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vBary;
varying float vKind;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vLocal = position;
  vBary = data.xyz;
  vKind = floor(data.w * 255.0 + 0.5);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
${PULSE_GLSL}
${EDGE_GLSL}
uniform vec3 uDye[4];  // headwear main / accent, outfit main / accent
uniform vec3 uRim;     // their colour in the team
uniform float uShow;   // fades them in and out
uniform float uEcho;   // 1 = your own body: found by the echo like the trees are
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vBary;
varying float vKind;

// what things are made of, on a person (the same palette as the wardrobe's mannequin)
const vec3 PAL[12] = vec3[12](
  vec3(0.30, 0.33, 0.35), vec3(0.36, 0.25, 0.17), vec3(0.34, 0.50, 0.24), vec3(0.19, 0.19, 0.21),
  vec3(0.44, 0.40, 0.33), vec3(0.60, 0.64, 0.68), vec3(0.78, 0.13, 0.10), vec3(0.84, 0.66, 0.56),
  vec3(0.86, 0.80, 0.70), vec3(1.00, 0.86, 0.55), vec3(0.22, 0.32, 0.48), vec3(1.00, 0.70, 0.25)
);

void main() {
  vec3 Ncr = cross(dFdx(vWorld), dFdy(vWorld));
  float Ncl = length(Ncr);
  vec3 N = Ncl > 1e-12 ? Ncr / Ncl : vec3(0.0, 1.0, 0.0);
  vec3 toCam = uCam - vWorld;
  float camD = length(toCam);
  vec3 V = toCam / camD;
  if (dot(N, V) < 0.0) N = -N;
  int k = int(vKind + 0.5);
  vec3 base = k >= 13 ? (k == 13 ? uDye[0] : (k == 14 || k == 17) ? uDye[1] : k == 15 ? uDye[2] : uDye[3]) : PAL[k];
  float st = hash13(floor(vWorld * 26.0));

  // real light only
  vec3 lamp = lampLight(vWorld, N) * vec3(1.0, 1.2, 1.55);
  vec3 glow = glowLight(vWorld, N);
  vec3 flare = flareLight(vWorld, N);
  float sunL = max(dot(N, uSun), 0.0);
  float sky = 0.5 + 0.5 * N.y;
  vec3 warm = mix(vec3(1.0, 0.8, 0.62), vec3(1.0, 0.93, 0.82), uMorning);
  vec3 day = (mix(0.36, 0.5, uMorning) * sky + 1.05 * sunL * warm) * uDawn;
  vec3 light = day + (lamp + glow) * 1.3 + flare * 0.75;
  float lum = max(light.r, max(light.g, light.b));

  float facing = clamp(dot(N, V), 0.0, 1.0);
  float rim = pow(1.0 - facing, 3.0);
  float edge = edgeFactor(vBary, 1.0);
  vec3 col = base * light * (0.84 + 0.22 * st);
  col += base * edge * 0.1 * min(lum, 1.0);
  col += uRim * rim * 0.16 * clamp(lum * 2.0, 0.0, 1.0);
  if (k >= 17) {
    float fl = 0.86 + 0.14 * sin(uTime * 9.0 + vWorld.y * 40.0) * sin(uTime * 5.3);
    col = base * 1.45 * fl + vec3(0.25) * fl;
  }
  if (k == 9) col = base * 1.6;
  float nat = clamp(lum * 1.6, 0.0, 1.0);
  if (uEcho > 0.0) {
    // the sonar's ash: grainy wire over dark faces, brighter on the wavefront (sonar.js, the world shader)
    float ring;
    vec3 L = sonarLight(vWorld, N, ring);
    // (grain fixed to the cloth, not to the world it walks through: no crawl)
    float dash = hash13(floor(vLocal * 30.0) + 7.0);
    float e = edge * (0.4 + 0.6 * smoothstep(0.12, 0.62, dash));
    vec3 ash = clamp(vec3(0.3) + base * 0.75, 0.0, 1.0);
    float speck = smoothstep(0.82, 0.97, hash13(floor(vLocal * 55.0)));
    vec3 echo = ash * L * (0.05 + 0.2 * speck + e * 1.4) + vec3(0.78, 0.85, 0.9) * ring * e * 0.42;
    col += echo * uEcho * (1.0 - nat);
  }

  // the dark eats distance; daylight has its haze
  col *= mix(exp(-camD * 0.015), 1.0, uDawn);
  vec3 fogC = mix(vec3(0.62, 0.52, 0.5), vec3(0.72, 0.76, 0.78), uMorning);
  col = mix(col, fogC, (1.0 - exp(-camD * mix(0.016, 0.011, uMorning))) * uDawn);
  if (uFear > 0.001) {
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(l * 1.3, l * 0.22, l * 0.18), uFear * 0.85);
  }
  gl_FragColor = vec4(col * uShow, 1.0 - nat * 0.95);
}
`;

export function createPersonMaterial(dyes, rimHex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uDye: { value: dyes.map((c) => c.clone()) },
      uRim: { value: new THREE.Color(rimHex) },
      uShow: { value: 1 },
      uEcho: { value: 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
}

function geometryFrom(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}

// real meshes on a survivor rig's bones (the rig keeps posing them); returns the meshes
export function dressPerson(rig, mat) {
  const meshes = [];
  for (const p of rig.parts) {
    const m = new THREE.Mesh(geometryFrom(p.arr), mat);
    m.frustumCulled = false;
    p.node.add(m);
    meshes.push(m);
  }
  return meshes;
}

export function undressPerson(meshes) {
  for (const m of meshes) {
    if (m.parent) m.parent.remove(m);
    m.geometry.dispose();
  }
}
