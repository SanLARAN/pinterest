// ============================================================
// ECHO — one shared uniform block drives every material in the game.
// Expanding spherical wavefronts light geometry in a thin band, with a
// fading "memory" glow inside, plus dampers (the Tall One drinks sound).
// ============================================================
import * as THREE from 'three';

export const MAX_WAVES = 8;
export const MAX_DAMP = 3;

export function createEchoUniforms() {
  const waves = [];
  const wstr = [];
  const wcol = [];
  for (let i = 0; i < MAX_WAVES; i++) {
    waves.push(new THREE.Vector4(0, 0, 0, 0));
    wstr.push(0);
    wcol.push(new THREE.Color(0.55, 1.0, 0.88));
  }
  const damp = [];
  for (let i = 0; i < MAX_DAMP; i++) damp.push(new THREE.Vector4(0, 0, 0, 0));
  return {
    uWaves: { value: waves },
    uWaveStr: { value: wstr },
    uWaveCol: { value: wcol },
    uDamp: { value: damp },
    uWidth: { value: 2.3 },
    uGain: { value: 1.0 },
    uTime: { value: 0 },
    uReveal: { value: 1 },       // 1 = daylight (echo is a subtle shimmer), 0 = pitch black night
    uCam: { value: new THREE.Vector3() },
    uTint: { value: new THREE.Color(0x7dffd8) },
  };
}

const VERT_HEAD = /* glsl */`
varying vec3 vEchoWorld;
`;

const VERT_BODY = /* glsl */`
#ifdef USE_INSTANCING
  vEchoWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
  vEchoWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif
`;

const FRAG_BODY = /* glsl */`
{
  float dampF = 1.0;
  for (int j = 0; j < ${MAX_DAMP}; j++) {
    if (uDamp[j].w > 0.001) {
      float dd = distance(vEchoWorld, uDamp[j].xyz);
      dampF *= 1.0 - 0.96 * smoothstep(uDamp[j].w, uDamp[j].w * 0.22, dd);
    }
  }
  vec3 echoSum = vec3(0.0);
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    float rad = uWaves[i].w;
    if (rad <= 0.001) continue;
    float s = uWaveStr[i];
    if (s <= 0.001) continue;
    float d = distance(vEchoWorld, uWaves[i].xyz);
    float band = exp(-pow((d - rad) / max(uWidth, 0.2), 2.0));
    float inside = smoothstep(rad, rad - uWidth * 8.0, d) * 0.20;
    echoSum += uWaveCol[i] * ((band * 1.15 + inside) * s);
  }
  echoSum *= dampF * uGain;
  float far = 1.0 - smoothstep(96.0, 175.0, distance(vEchoWorld, uCam));
  float dayMix = mix(1.35, 0.34, uReveal);
  gl_FragColor.rgb += echoSum * far * dayMix;
}
`;

const UNIFORM_DECLS = /* glsl */`
uniform vec4 uWaves[${MAX_WAVES}];
uniform float uWaveStr[${MAX_WAVES}];
uniform vec3 uWaveCol[${MAX_WAVES}];
uniform vec4 uDamp[${MAX_DAMP}];
uniform float uWidth;
uniform float uGain;
uniform float uTime;
uniform float uReveal;
uniform vec3 uCam;
uniform vec3 uTint;
`;

/**
 * Patch any three.js material that uses the standard shader chunks
 * (Lambert / Phong / Standard / Basic-with-lights) so it reacts to echoes.
 */
export function patchEcho(material, U) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_HEAD)
      .replace('#include <project_vertex>', '#include <project_vertex>\n' + VERT_BODY);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + UNIFORM_DECLS + VERT_HEAD);
    if (shader.fragmentShader.includes('#include <fog_fragment>')) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', '#include <fog_fragment>\n' + FRAG_BODY);
    } else {
      shader.fragmentShader += '\n' + FRAG_BODY;
    }
  };
  material.customProgramCacheKey = () => 'echo30';
  return material;
}

/** Push the live wave list into the shared uniform block. */
export function syncEchoUniforms(U, game, camera) {
  const waves = U.uWaves.value, str = U.uWaveStr.value, col = U.uWaveCol.value;
  const n = Math.min(game.waves.length, MAX_WAVES);
  for (let i = 0; i < MAX_WAVES; i++) {
    if (i < n) {
      const w = game.waves[i];
      waves[i].set(w.x, w.y, w.z, w.r);
      str[i] = Math.min(1.6, w.str * (w.loud ? 1.25 : 1));
      if (w.color === 1) col[i].setRGB(1.0, 0.72, 0.28);            // generator burst: amber
      else if (w.kind === 'scream') col[i].setRGB(1.0, 0.22, 0.32);  // scream: blood
      else if (w.kind === 'monster') col[i].setRGB(1.0, 0.3, 0.4);
      else col[i].setRGB(0.52, 1.0, 0.86);
    } else { waves[i].w = 0; str[i] = 0; }
  }
  const d = U.uDamp.value;
  for (let i = 0; i < MAX_DAMP; i++) {
    const dm = game.dampers[i];
    if (dm) d[i].set(dm.x, dm.y, dm.z, dm.r); else d[i].w = 0;
  }
  U.uTime.value = game.t;
  U.uReveal.value = game.globalEcho;
  U.uCam.value.copy(camera.position);
  U.uGain.value = 1.0;
}
