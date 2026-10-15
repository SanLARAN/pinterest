import * as THREE from 'three';
import { smoothstep, lerp, mulberry32 } from './noise.js';
import { PAL } from './config.js';

/**
 * Low-poly heightfield built from the track's noise. The ground near the
 * road is flattened to the road height so the ribbon sits snugly on it.
 */
export class Terrain {
  constructor(track) {
    this.track = track;
    const b = track.bounds;
    const margin = 260;
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const size = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) + margin * 2;
    this.cells = 150;
    this.cell = size / this.cells;
    this.size = size;
    this.x0 = cx - size / 2;
    this.z0 = cz - size / 2;
    const N = this.cells + 1;
    this.N = N;
    this.h = new Float32Array(N * N);
    this.d = new Float32Array(N * N);
    const hw = track.hw;
    const nr = { i: -1, d: Infinity };
    const reach = hw + 32;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = this.x0 + i * this.cell, z = this.z0 + j * this.cell;
        const nat = track.naturalHeight(x, z);
        track.nearest(x, z, reach, nr);
        let h = nat;
        const k = j * N + i;
        if (nr.i >= 0) {
          const th = track.h[nr.i];
          const t = smoothstep(hw + 1.0, reach, nr.d);
          h = lerp(th - 0.45, nat, t);
          this.d[k] = nr.d;
        } else {
          this.d[k] = 999;
        }
        this.h[k] = h;
      }
    }
  }

  /** Exact height of the rendered triangle surface at (x, z). */
  heightAt(x, z) {
    const N = this.N;
    let fx = (x - this.x0) / this.cell, fz = (z - this.z0) / this.cell;
    if (fx < 0) fx = 0; else if (fx > N - 1.001) fx = N - 1.001;
    if (fz < 0) fz = 0; else if (fz > N - 1.001) fz = N - 1.001;
    const i = Math.floor(fx), j = Math.floor(fz);
    const u = fx - i, v = fz - j;
    const h = this.h;
    const k = j * N + i;
    if (u + v <= 1) {
      const h00 = h[k];
      return h00 + u * (h[k + 1] - h00) + v * (h[k + N] - h00);
    }
    const h11 = h[k + N + 1];
    return h11 + (1 - u) * (h[k + N] - h11) + (1 - v) * (h[k + 1] - h11);
  }

  buildMesh() {
    const N = this.N, C = this.cells;
    const triCount = C * C * 2;
    const pos = new Float32Array(triCount * 9);
    const col = new Float32Array(triCount * 9);
    const rng = mulberry32(this.track.seed * 31 + 5);
    const noise = this.track.hnoise;
    const cSand = new THREE.Color(PAL.sand), cTerra = new THREE.Color(PAL.terracotta);
    const cRed = new THREE.Color(PAL.redRock), cCliff = new THREE.Color(PAL.cliff);
    const cScrub = new THREE.Color(PAL.scrub), cDust = new THREE.Color(PAL.dust);
    const c = new THREE.Color(), tmp = new THREE.Color();
    const hw = this.track.hw;
    let p = 0;
    const v = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const emit = (ia, ja, ib, jb, ic, jc) => {
      const ka = ja * N + ia, kb = jb * N + ib, kc = jc * N + ic;
      v[0] = this.x0 + ia * this.cell; v[1] = this.h[ka]; v[2] = this.z0 + ja * this.cell;
      v[3] = this.x0 + ib * this.cell; v[4] = this.h[kb]; v[5] = this.z0 + jb * this.cell;
      v[6] = this.x0 + ic * this.cell; v[7] = this.h[kc]; v[8] = this.z0 + jc * this.cell;
      // face normal y
      const ux = v[3] - v[0], uy = v[4] - v[1], uz = v[5] - v[2];
      const wx = v[6] - v[0], wy = v[7] - v[1], wz = v[8] - v[2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const ndy = ny / (Math.hypot(nx, ny, nz) || 1);
      const ha = (v[1] + v[4] + v[7]) / 3;
      const da = (this.d[ka] + this.d[kb] + this.d[kc]) / 3;
      const cxm = (v[0] + v[3] + v[6]) / 3, czm = (v[2] + v[5] + v[8]) / 3;
      // height bands
      if (ha < 2) c.copy(cSand).lerp(cTerra, Math.max(0, (ha + 6) / 8) * 0.5);
      else if (ha < 14) c.copy(cTerra).lerp(cSand, Math.max(0, (8 - ha) / 12) * 0.6);
      else c.copy(cTerra).lerp(cRed, Math.min(1, (ha - 14) / 10));
      // strata stripes on high ground
      if (ha > 10 && Math.sin(ha * 1.3) > 0.6) c.lerp(cRed, 0.35);
      const slope = 1 - ndy;
      if (slope > 0.12) c.lerp(cCliff, Math.min(1, (slope - 0.12) * 2.6));
      const sn = noise.noise(cxm * 0.012, czm * 0.012);
      if (sn > 0.35 && slope < 0.15) c.lerp(cScrub, Math.min(0.8, (sn - 0.35) * 2.5));
      if (da < hw + 16) c.lerp(cDust, (1 - Math.max(0, da - hw) / 16) * 0.75);
      const jit = 0.94 + rng() * 0.1;
      tmp.copy(c).multiplyScalar(jit);
      for (let q = 0; q < 9; q++) pos[p + q] = v[q];
      for (let q = 0; q < 3; q++) { col[p + q * 3] = tmp.r; col[p + q * 3 + 1] = tmp.g; col[p + q * 3 + 2] = tmp.b; }
      p += 9;
    };
    for (let j = 0; j < C; j++) {
      for (let i = 0; i < C; i++) {
        emit(i, j, i, j + 1, i + 1, j);
        emit(i + 1, j, i, j + 1, i + 1, j + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    return mesh;
  }
}
