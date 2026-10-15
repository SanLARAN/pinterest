import * as THREE from 'three';

/**
 * Single full-screen pass: chromatic aberration, colour grade, anime speed
 * lines, VHS glitch, scanlines, film grain ("noise"), vignette, flashes.
 */
export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.enabled = true;
    this.samples = 4;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { samples: this.samples, type: THREE.UnsignedByteType, depthBuffer: true });
    this.uniforms = {
      tDiffuse: { value: this.rt.texture },
      uTime: { value: 0 },
      uCA: { value: 0 },
      uFlash: { value: 0 },
      uFlashColor: { value: new THREE.Vector3(1, 1, 1) },
      uDamage: { value: 0 },
      uSpeed: { value: 0 },
      uGlitch: { value: 0 },
      uLow: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uGrain: { value: 0.055 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false, depthWrite: false,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float uTime, uCA, uFlash, uDamage, uSpeed, uGlitch, uLow, uGrain;
        uniform vec3 uFlashColor;
        uniform vec2 uRes;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec2 uv = vUv;
          // VHS tracking glitch
          if (uGlitch > 0.001) {
            float band = step(0.94, hash(vec2(floor(uv.y * 24.0), floor(uTime * 30.0))));
            uv.x += band * (hash(vec2(uTime, uv.y)) - 0.5) * 0.06 * uGlitch;
          }
          vec2 c = uv - 0.5;
          float r2 = dot(c, c);
          vec2 off = c * (0.0035 + uCA * 0.03) * (0.4 + r2 * 2.5);
          vec3 col;
          col.r = texture2D(tDiffuse, uv + off).r;
          col.g = texture2D(tDiffuse, uv).g;
          col.b = texture2D(tDiffuse, uv - off).b;
          // grade: saturation + slight contrast + warm/magenta split tone
          float l = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(vec3(l), col, 1.16);
          col = (col - 0.5) * 1.05 + 0.5;
          col += vec3(0.02, -0.005, 0.03) * (1.0 - l);
          // speed lines (anime)
          if (uSpeed > 0.01) {
            float ang = atan(c.y, c.x);
            float n = hash(vec2(floor(ang * 70.0), floor(uTime * 18.0)));
            float line = step(0.86, n) * smoothstep(0.12, 0.42, r2) * uSpeed;
            col = mix(col, vec3(1.0, 0.95, 1.0), line * 0.32);
          }
          // low time: pulsing red edges
          float edge = smoothstep(0.12, 0.55, r2);
          col = mix(col, vec3(0.9, 0.02, 0.18), clamp(uDamage * edge * 1.3 + uLow * edge * 0.5, 0.0, 0.85));
          // scanlines + grain
          col *= 0.97 + 0.03 * sin(gl_FragCoord.y * 3.14159);
          float g = hash(gl_FragCoord.xy * 0.71 + fract(uTime * 7.13) * 91.0) - 0.5;
          col += g * uGrain;
          // vignette (purple tinted)
          col = mix(col, col * vec3(0.55, 0.35, 0.65), smoothstep(0.18, 0.75, r2) * 0.8);
          col = mix(col, uFlashColor, uFlash);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(geo, mat);
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setSamples(n) {
    if (n === this.samples) return;
    this.samples = n;
    const w = this.rt.width, h = this.rt.height;
    this.rt.dispose();
    this.rt = new THREE.WebGLRenderTarget(w, h, { samples: n, type: THREE.UnsignedByteType, depthBuffer: true });
    this.uniforms.tDiffuse.value = this.rt.texture;
  }

  setSize(w, h) {
    this.rt.setSize(w, h);
    this.uniforms.uRes.value.set(w, h);
  }

  render(scene, camera, fx, time, speedK, lowK) {
    const r = this.renderer;
    const u = this.uniforms;
    u.uTime.value = time;
    u.uCA.value = fx.ca;
    u.uFlash.value = Math.min(0.85, fx.flash);
    u.uFlashColor.value.set(fx.flashColor[0], fx.flashColor[1], fx.flashColor[2]);
    u.uDamage.value = fx.damage;
    u.uGlitch.value = fx.glitch;
    u.uSpeed.value = speedK;
    u.uLow.value = lowK;
    if (!this.enabled) {
      r.setRenderTarget(null);
      r.render(scene, camera);
      return;
    }
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    this.calls = r.info.render.calls;
    this.tris = r.info.render.triangles;
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }
}
