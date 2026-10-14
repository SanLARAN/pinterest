// Geometry helpers. Parts are baked into one vertex-coloured mesh so each
// model (or the whole prop set) costs a single draw call.
import * as THREE from 'three';

const _v = new THREE.Vector3();
const _n = new THREE.Vector3();
const _m3 = new THREE.Matrix3();
const _c = new THREE.Color();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _m4 = new THREE.Matrix4();

export class GeoAccumulator {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.colors = [];
    this.indices = [];
    this.count = 0;
  }

  /** Appends geometry transformed by matrix (optional) and painted with color. */
  add(geometry, color, matrix = null) {
    const pos = geometry.attributes.position;
    const nor = geometry.attributes.normal;
    const index = geometry.index;
    _c.set(color);
    const nm = matrix ? _m3.getNormalMatrix(matrix) : null;
    const base = this.count;
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i);
      if (matrix) _v.applyMatrix4(matrix);
      this.positions.push(_v.x, _v.y, _v.z);
      if (nor) {
        _n.fromBufferAttribute(nor, i);
        if (nm) _n.applyMatrix3(nm).normalize();
        this.normals.push(_n.x, _n.y, _n.z);
      } else {
        this.normals.push(0, 1, 0);
      }
      this.colors.push(_c.r, _c.g, _c.b);
    }
    if (index) {
      for (let i = 0; i < index.count; i++) this.indices.push(base + index.getX(i));
    } else {
      for (let i = 0; i < pos.count; i++) this.indices.push(base + i);
    }
    this.count += pos.count;
    return this;
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    g.setIndex(new THREE.Uint32BufferAttribute(this.indices, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/** Adds a primitive to an accumulator with a position/rotation/scale transform. */
export function part(acc, geo, color, t = {}) {
  const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = t;
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(sx, sy, sz);
  _m4.compose(_p, _q, _s);
  acc.add(geo, color, _m4);
  return acc;
}

/** Shared material set for baked, vertex-coloured models. */
export function vertexMaterial(extra = {}) {
  return new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, ...extra });
}

export const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sphere: (r, ws = 10, hs = 8, phi0 = 0, phiL = Math.PI * 2, th0 = 0, thL = Math.PI) =>
    new THREE.SphereGeometry(r, ws, hs, phi0, phiL, th0, thL),
  cyl: (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg),
  cone: (r, h, seg = 6) => new THREE.ConeGeometry(r, h, seg),
  ico: (r, d = 0) => new THREE.IcosahedronGeometry(r, d),
  dodeca: (r) => new THREE.DodecahedronGeometry(r, 0),
  octa: (r) => new THREE.OctahedronGeometry(r, 0),
  torus: (r, t, rs = 4, ts = 10, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc),
};
