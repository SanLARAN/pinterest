import * as THREE from 'three';
import { clamp, wrapAngle } from './noise.js';

const _target = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();
const _shake = { x: 0, y: 0, roll: 0 };
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

/**
 * High "top-down third-person" chase camera. Follows the car's travel
 * direction, pulls back with speed, widens FOV on nitro, adds shake.
 */
export class ChaseCamera {
  constructor(camera, fx) {
    this.cam = camera;
    this.fx = fx;
    this.yaw = 0;
    this.mode = 'chase';
    this.blend = 1;
    this.orbitA = 0;
    this.carY = 0;
    this.fovBase = 55;
    this.fovKick = 0;
    this.pos = new THREE.Vector3(0, 60, -60);
    this.lookAt = new THREE.Vector3();
    this.far = false;
    this.aspect = 1;
  }

  setAspect(aspect) {
    this.aspect = aspect;
    this.portrait = aspect < 0.85;
    // keep a minimum horizontal field of view on tall (portrait) screens
    const minH = 58 * Math.PI / 180;
    const vFromH = 2 * Math.atan(Math.tan(minH / 2) / aspect) * 180 / Math.PI;
    this.fovBase = clamp(Math.max(52, vFromH), 52, 92);
  }

  snap(car) {
    this.yaw = car.heading;
    this.carY = car.pos.y;
    this.blend = 1;
    this.update(0, car, true);
  }

  /** Start a smooth transition (e.g. from title orbit into the chase). */
  transition() { this.blend = 0; }

  update(dt, car, instant = false) {
    const cam = this.cam;
    const fx = this.fx;
    const speed = car.dead ? 0 : car.speed;
    this.carY += (car.pos.y - this.carY) * (instant ? 1 : 1 - Math.exp(-6 * dt));

    if (this.mode === 'orbit' || this.mode === 'victory' || this.mode === 'death') {
      const victory = this.mode === 'victory';
      const death = this.mode === 'death';
      this.orbitA += dt * (victory ? 0.5 : death ? 0.25 : 0.12);
      const r = victory ? 13 : death ? 18 : 22;
      const h = victory ? 6 : death ? 14 : 8;
      _desired.set(car.pos.x + Math.sin(this.orbitA) * r, this.carY + h, car.pos.z + Math.cos(this.orbitA) * r);
      _look.set(car.pos.x, this.carY + (victory ? 1.2 : death ? 0 : 4), car.pos.z);
    } else {
      // chase
      let travel = car.heading;
      if (speed > 6) {
        const vy = Math.atan2(car.vel.x, car.vel.z);
        travel = car.heading + wrapAngle(vy - car.heading) * 0.55;
      }
      const diff = wrapAngle(travel - this.yaw);
      this.yaw += instant ? diff : diff * (1 - Math.exp(-4.2 * dt));
      const fxy = Math.sin(this.yaw), fzy = Math.cos(this.yaw);
      const sp = clamp(speed / 50, 0, 1.5);
      const farK = this.far ? 1.35 : 1;
      const pk = this.portrait ? 1 : 0;
      const dist = (13 + sp * 6) * farK * (1 - pk * 0.2);
      const height = (19 + sp * 5) * farK * (1 + pk * 0.3);
      const ahead = (5 + sp * 9) * (1 + pk * 0.8);
      _desired.set(car.pos.x - fxy * dist, this.carY + height, car.pos.z - fzy * dist);
      _look.set(car.pos.x + fxy * ahead, this.carY + 0.5, car.pos.z + fzy * ahead);
    }

    if (instant || this.blend >= 1) {
      this.pos.copy(_desired);
      this.lookAt.copy(_look);
    } else {
      this.blend = Math.min(1, this.blend + dt * 0.9);
      const k = 1 - Math.exp(-5 * dt) * (1 - this.blend);
      this.pos.lerp(_desired, k);
      this.lookAt.lerp(_look, k);
    }
    cam.position.copy(this.pos);
    cam.lookAt(this.lookAt);

    // fov: speed + nitro kick
    const wantKick = car.boosting ? 10 : 0;
    this.fovKick += (wantKick - this.fovKick) * (1 - Math.exp(-6 * dt));
    const fov = this.fovBase + clamp(speed / 50, 0, 1.4) * 4 + this.fovKick;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // shake (camera space)
    fx.shake(_shake);
    if (_shake.x !== 0 || _shake.y !== 0 || _shake.roll !== 0) {
      _right.set(1, 0, 0).applyQuaternion(cam.quaternion);
      _up.set(0, 1, 0).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(_right, _shake.x).addScaledVector(_up, _shake.y);
      cam.rotateZ(_shake.roll);
    }
  }
}
