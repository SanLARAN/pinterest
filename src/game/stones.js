// Throwable stones: fly in the dark, make noise + a remote echo where they land.
import { CAP } from '../world/world.js';
import { Collision } from '../world/collision.js';

export class Stones {
  constructor() {
    this.list = [];
  }
  clear() {
    this.list = [];
  }
  throw(x, y, z, dx, dy, dz) {
    const sp = 16.5;
    this.list.push({ x, y, z, vx: dx * sp, vy: dy * sp + 4.2, vz: dz * sp, t: 0, trailT: 0 });
  }
  update(dt, game) {
    const world = game.world;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const s = this.list[i];
      s.t += dt;
      s.vy -= 19 * dt;
      const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt, nz = s.z + s.vz * dt;
      s.trailT -= dt;
      if (s.trailT <= 0) {
        game.particles.burst(s.x, s.y, s.z, 1, { color: [0.5, 0.65, 0.75], speed: 0.1, life: 0.35, size: 0.05, gravity: 0, drag: 2 });
        s.trailT = 0.03;
      }
      let hit = null;
      const groundY = world.terrain.height(nx, nz);
      if (ny <= groundY + 0.05) hit = { x: nx, y: groundY + 0.05, z: nz, water: false };
      if (!hit) {
        const list = world.col.query(nx, nz, 1.5);
        for (const ci of list) {
          const c = world.col.caps[ci];
          if (c.kind === CAP.WATER) continue;
          if (ny - groundY > c.h) continue;
          const res = { d: 0, nx: 0, nz: 0 };
          Collision.closest(c, nx, nz, res);
          if (res.d < 0.08) {
            hit = { x: nx + res.nx * 0.1, y: ny, z: nz + res.nz * 0.1, water: false, kind: c.kind };
            break;
          }
        }
      }
      if (!hit && world.lake) {
        const L = world.lake;
        if (Math.hypot(nx - L.x, nz - L.z) < L.r + 2 && ny <= L.y + 0.05) hit = { x: nx, y: L.y, z: nz, water: true };
      }
      if (hit || s.t > 4) {
        this.list.splice(i, 1);
        if (hit) game.onStoneImpact(hit);
        continue;
      }
      s.x = nx; s.y = ny; s.z = nz;
    }
  }
}
