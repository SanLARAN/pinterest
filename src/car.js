import * as THREE from 'three';
import { CFG, KIND_STATS } from './config.js';
import { clamp } from './noise.js';
import { makeGlowMaterial, buildRallyGeometry, buildGoonGeometry, RALLY_WHEELS, GOON_WHEELS } from './models.js';
import { SOLID } from './world.js';

const _pt = { x: 0, y: 0, z: 0, tx: 0, tz: 1, heading: 0, idx: 0 };
const _ax = new THREE.Vector3();
const _dq = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0);

let BLOB_GEO = null, BLOB_MAT = null;
function blobAssets() {
  if (BLOB_GEO) return;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grd.addColorStop(0, 'rgba(30,8,30,0.75)');
  grd.addColorStop(1, 'rgba(30,8,30,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  BLOB_GEO = new THREE.PlaneGeometry(2.6, 4.8);
  BLOB_GEO.rotateX(-Math.PI / 2);
  BLOB_MAT = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
}

export class Car {
  constructor(game, def, index) {
    this.game = game;
    this.def = def;
    this.index = index;
    this.kind = def.kind;
    this.name = def.name;
    this.isPlayer = def.kind === 'player';
    this.st = { ...KIND_STATS[def.kind] };
    if (def.skill) {
      this.st.maxSpeed *= def.skill;
      this.st.accel *= 0.9 + 0.1 * def.skill;
    }
    this.color = def.color;
    this.color2 = def.color2;

    // ---- visuals
    this.mat = makeGlowMaterial();
    this.root = new THREE.Group();
    this.chassis = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.chassis);
    this.chassis.add(this.body);
    const geo = def.kind === 'goon' ? buildGoonGeometry(def) : buildRallyGeometry({ ...def, isPlayer: this.isPlayer });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = true;
    this.body.add(this.mesh);
    const W = def.kind === 'goon' ? GOON_WHEELS : RALLY_WHEELS;
    this.wheels = W.map((w) => {
      const pivot = new THREE.Object3D();
      pivot.position.set(w.x, w.y, w.z);
      const spin = new THREE.Object3D();
      spin.scale.set(w.w, w.r, w.r);
      pivot.add(spin);
      this.chassis.add(pivot);
      return { pivot, spin, ...w };
    });
    this.wheelR = W[0].r;
    blobAssets();
    this.blob = new THREE.Mesh(BLOB_GEO, BLOB_MAT);
    this.blob.renderOrder = 1;
    this.blob.visible = false;
    game.scene.add(this.blob);
    game.scene.add(this.root);

    // ---- state (allocated once)
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.wv = new THREE.Vector3();
    this.ww = new THREE.Vector3();
    this.wq = new THREE.Quaternion();
    this.q = { idx: -1, s: 0, lateral: 0, dist: 0 };
    this.sway = { p: 0, r: 0, vp: 0, vr: 0, sq: 1, vsq: 0 };
    this.skid = [{ x: 0, y: 0, z: 0, on: false }, { x: 0, y: 0, z: 0, on: false }];
    this.input = { throttle: 0, brake: 0, steer: 0, fire: false, boost: false };
    this.active = true;
    this.reset();
  }

  reset() {
    this.vel.set(0, 0, 0);
    this.vy = 0;
    this.heading = 0;
    this.yawRate = 0;
    this.speed = 0;
    this.fwdSpeed = 0;
    this.slip = 0;
    this.prevFwd = 0;
    this.aLong = 0;
    this.grounded = true;
    this.airTime = 0;
    this.maxAir = 0;
    this.lastGH = 0;
    this.hp = this.st.hp;
    this.dead = false;
    this.wreckT = 0;
    this.nitro = this.isPlayer ? 0.4 : 0;
    this.boosting = false;
    this.freeBoost = 0;
    this.drifting = false;
    this.driftDir = 0;
    this.driftT = 0;
    this.driftEnd = 0;
    this.heat = 0;
    this.overheated = false;
    this.fireCd = 0;
    this.shot = 0;
    this.flash = 0;
    this.burn = 0;
    this.ghost = 0;
    this.invuln = 0;
    this.lap = -1;
    this.prevS = undefined;
    this.progress = 0;
    this.finished = false;
    this.finishTime = 0;
    this.lastAttacker = null;
    this.lastAttackT = -100;
    this.speedMul = 1;
    this.steerVis = 0;
    this.spin = 0;
    this.pitch = 0; this.roll = 0; this.tPitch = 0; this.tRoll = 0;
    this.sway.p = this.sway.r = this.sway.vp = this.sway.vr = this.sway.vsq = 0;
    this.sway.sq = 1;
    this.dustT = 0;
    this.smokeT = 0;
    this.fireT = 0;
    this.onRoad = true;
    this.skid[0].on = this.skid[1].on = false;
    this.mat.userData.u.uBurn.value = 0;
    this.mat.userData.u.uFlash.value = 0;
    this.mesh.visible = true;
    this.kills = 0;
    this.respawnT = 0;
  }

  setActive(on) {
    this.active = on;
    this.root.visible = on;
    if (!on) this.blob.visible = false;
  }

  /** Put the car on the track at arc-length s. Keeps lap/progress continuous. */
  place(s, lateral, speed = 0, progressOverride = null) {
    const T = this.game.track;
    T.pointAt(s, lateral, _pt);
    this.pos.set(_pt.x, 0, _pt.z);
    this.heading = _pt.heading;
    this.vel.set(_pt.tx * speed, 0, _pt.tz * speed);
    T.query(_pt.x, _pt.z, _pt.idx, this.q);
    const gh = this.game.world.groundHeight(_pt.x, _pt.z, this.q);
    this.pos.y = gh;
    this.lastGH = gh;
    this.vy = 0;
    this.grounded = true;
    this.yawRate = 0;
    this.airTime = 0;
    const L = T.length;
    const old = progressOverride !== null ? progressOverride : this.progress;
    this.lap = Math.round((old - this.q.s) / L);
    this.prevS = this.q.s;
    this.progress = this.lap * L + this.q.s;
    this.pitch = this.roll = 0;
    this.skid[0].on = this.skid[1].on = false;
  }

  updateProgress() {
    const L = this.game.track.length;
    const s = this.q.s;
    const prev = this.prevS;
    if (prev !== undefined) {
      if (prev > L * 0.75 && s < L * 0.25) this.lap++;
      else if (prev < L * 0.25 && s > L * 0.75) this.lap--;
    }
    this.prevS = s;
    this.progress = this.lap * L + s;
  }

  // -------------------------------------------------------------- physics
  physics(dt, inp) {
    const st = this.st;
    const T = this.game.track;
    const W = this.game.world;
    T.query(this.pos.x, this.pos.z, this.q.idx, this.q);
    const lat = Math.abs(this.q.lateral);
    this.onRoad = lat < T.hw + 0.8;
    const surfGrip = this.onRoad ? 1 : 0.7;
    const surfMax = this.onRoad ? 1 : 0.64;
    const surfDrag = this.onRoad ? 0 : 0.55;

    const sinH = Math.sin(this.heading), cosH = Math.cos(this.heading);
    const fx = sinH, fz = cosH, rx = -cosH, rz = sinH;
    let vF = this.vel.x * fx + this.vel.z * fz;
    let vR = this.vel.x * rx + this.vel.z * rz;
    const vF0 = vF;

    if (this.freeBoost > 0) this.freeBoost -= dt;
    this.boosting = this.freeBoost > 0 || (inp.boost && this.nitro > 0.004);
    if (this.boosting && this.freeBoost <= 0) this.nitro = Math.max(0, this.nitro - dt * st.nitroBurn);
    const maxV = (this.boosting ? st.boostSpeed : st.maxSpeed) * surfMax * this.speedMul;

    // ---- drift state machine (tap brake while steering at speed)
    if (!this.drifting) {
      if (this.grounded && inp.brake > 0.5 && Math.abs(inp.steer) > 0.35 && vF > 17) {
        this.drifting = true;
        this.driftDir = Math.sign(inp.steer);
        this.driftT = 0;
        this.driftEnd = 0;
      }
    } else {
      this.driftT += dt;
      const into = inp.steer * this.driftDir;
      if (into < 0.12) this.driftEnd += dt; else this.driftEnd = 0;
      if (this.driftEnd > (into < -0.4 ? 0.12 : 0.28) || vF < 10 || this.airTime > 0.6) this.drifting = false;
    }

    if (this.grounded) {
      if (inp.throttle > 0 && vF < maxV) {
        const k = 1 - Math.pow(Math.max(0, vF) / maxV, 2) * 0.72;
        vF += st.accel * inp.throttle * k * dt * (vF < 0 ? 1.6 : 1);
      }
      if (this.boosting && vF < maxV) vF += st.boostAccel * dt;
      if (inp.brake > 0) {
        if (vF > 1) vF -= (this.drifting ? st.driftBrake : st.brake) * inp.brake * dt;
        else if (inp.throttle <= 0) vF = Math.max(-st.reverseSpeed, vF - st.reverseAccel * inp.brake * dt);
      }
      vF -= vF * (st.drag + surfDrag) * dt;
      if (inp.throttle <= 0 && inp.brake <= 0) vF -= Math.sign(vF) * Math.min(Math.abs(vF), st.coast * dt);
      if (vF > maxV) vF = Math.max(maxV, vF - 30 * dt);

      let grip = st.grip * surfGrip;
      if (this.drifting) grip *= st.driftGrip;
      const vR0 = vR;
      vR *= Math.exp(-grip * dt);
      if (this.drifting && vF > 0) vF += Math.abs(vR0 - vR) * 0.6;

      const spd = Math.abs(vF);
      const turnable = clamp(spd / 9, 0, 1);
      const fall = 1 - st.turnFall * clamp(spd / st.maxSpeed, 0, 1.2);
      let target;
      if (this.drifting) {
        target = -(this.driftDir * st.driftYaw + inp.steer * st.turnRate * 0.55) * turnable;
      } else {
        target = -inp.steer * st.turnRate * turnable * fall * (vF >= 0 ? 1 : -1);
      }
      this.yawRate += (target - this.yawRate) * (1 - Math.exp(-st.yawResp * dt));
    } else {
      this.yawRate += (-inp.steer * 1.0 - this.yawRate) * (1 - Math.exp(-2.5 * dt));
      vF -= vF * 0.04 * dt;
    }

    this.heading += this.yawRate * dt;
    this.vel.x = fx * vF + rx * vR;
    this.vel.z = fz * vF + rz * vR;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // world bounds
    const tr = this.game.terrain;
    const lim = tr.size / 2 - 20;
    const cx = tr.x0 + tr.size / 2, cz = tr.z0 + tr.size / 2;
    if (this.pos.x < cx - lim) { this.pos.x = cx - lim; this.vel.x = Math.abs(this.vel.x) * 0.3; }
    if (this.pos.x > cx + lim) { this.pos.x = cx + lim; this.vel.x = -Math.abs(this.vel.x) * 0.3; }
    if (this.pos.z < cz - lim) { this.pos.z = cz - lim; this.vel.z = Math.abs(this.vel.z) * 0.3; }
    if (this.pos.z > cz + lim) { this.pos.z = cz + lim; this.vel.z = -Math.abs(this.vel.z) * 0.3; }

    this.collideProps();

    // ---- vertical
    T.query(this.pos.x, this.pos.z, this.q.idx, this.q);
    const gh = W.groundHeight(this.pos.x, this.pos.z, this.q);
    this.vy -= CFG.GRAVITY * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= gh) {
      const wasAir = !this.grounded;
      const impact = -this.vy;
      this.pos.y = gh;
      const gvy = dt > 1e-5 ? (gh - this.lastGH) / dt : 0;
      this.vy = clamp(gvy, -40, st.maxLaunch);
      if (wasAir && this.airTime > 0.12) this.onLand(impact, this.airTime);
      this.grounded = true;
      this.airTime = 0;
    } else {
      if (this.pos.y > gh + 0.32) this.grounded = false;
      if (!this.grounded) {
        this.airTime += dt;
        if (this.airTime > this.maxAir) this.maxAir = this.airTime;
      }
    }
    this.lastGH = gh;

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    const vFn = this.vel.x * fx + this.vel.z * fz;
    this.aLong = dt > 1e-5 ? (vFn - vF0) / dt : 0;
    this.fwdSpeed = vFn;
    this.slip = this.vel.x * rx + this.vel.z * rz;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.ghost > 0) this.ghost -= dt;
  }

  onLand(impact, air) {
    this.sway.vsq -= Math.min(6, impact * 0.22);
    this.game.onCarLand(this, impact, air);
  }

  collideProps() {
    const W = this.game.world, st = this.st;
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    for (let k = -1; k <= 1; k += 2) {
      const cx = this.pos.x + fx * st.axle * k, cz = this.pos.z + fz * st.axle * k;
      W.forColliders(cx, cz, st.radius + 1.5, (c) => {
        const dx = cx - c.x, dz = cz - c.z;
        const rr = st.radius + c.r;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr) return false;
        if (c.y !== undefined && c.kind !== 'mesa' && this.pos.y > c.y + 3.2) return false; // flying over
        const d = Math.sqrt(d2) || 0.001;
        const nx = dx / d, nz = dz / d;
        const vn = this.vel.x * nx + this.vel.z * nz;
        const impact = -vn;
        if (c.kind === 'cactus' || c.kind === 'post' || c.kind === 'sign') {
          if (impact > 2 || this.speed > 6) {
            this.game.onPropSmash(this, c, Math.max(impact, this.speed * 0.5));
            const keep = c.kind === 'post' ? 0.97 : 0.88;
            this.vel.x *= keep; this.vel.z *= keep;
            return false;
          }
        }
        if (c.kind === 'barrel') {
          this.game.onBarrelHit(c, this);
          return false;
        }
        const pen = rr - d;
        this.pos.x += nx * pen;
        this.pos.z += nz * pen;
        if (vn < 0) {
          const e = SOLID[c.kind] ?? 0.3;
          this.vel.x -= (1 + e) * vn * nx;
          this.vel.z -= (1 + e) * vn * nz;
          const fr = c.kind === 'tire' ? 0.93 : 0.82;
          this.vel.x *= fr; this.vel.z *= fr;
          this.yawRate += (Math.random() - 0.5) * Math.min(impact, 30) * 0.06;
          if (impact > 4) this.game.onWallHit(this, impact, cx - nx * st.radius, cz - nz * st.radius, c);
        }
        return false;
      });
    }
  }

  // --------------------------------------------------------------- damage
  damage(amount, attacker, cause) {
    if (this.dead || !this.active) return false;
    if (this.invuln > 0 || this.ghost > 0) return false;
    this.flash = 1;
    if (attacker && attacker !== this) { this.lastAttacker = attacker; this.lastAttackT = this.game.time; }
    if (this.isPlayer) {
      this.game.onPlayerDamage(amount, attacker, cause);
      return false;
    }
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die(attacker, cause);
      return true;
    }
    return false;
  }

  die(killer, cause) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    this.wreckT = 0;
    this.drifting = false;
    this.boosting = false;
    this.wv.set(this.vel.x * 0.55, 10 + Math.random() * 7, this.vel.z * 0.55);
    this.ww.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 9);
    this.wq.setFromAxisAngle(UP, this.heading);
    this.game.onCarKilled(this, killer, cause);
  }

  updateWreck(dt) {
    this.wreckT += dt;
    this.wv.y -= CFG.GRAVITY * dt;
    this.pos.addScaledVector(this.wv, dt);
    const w = this.ww.length();
    if (w > 0.01) {
      _ax.copy(this.ww).multiplyScalar(1 / w);
      _dq.setFromAxisAngle(_ax, w * dt);
      this.wq.premultiply(_dq);
    }
    this.game.track.query(this.pos.x, this.pos.z, this.q.idx, this.q);
    const gh = this.game.world.groundHeight(this.pos.x, this.pos.z, this.q) + 0.55;
    if (this.pos.y < gh) {
      this.pos.y = gh;
      if (this.wv.y < -4) {
        const imp = -this.wv.y;
        this.wv.y *= -0.32;
        this.wv.x *= 0.6; this.wv.z *= 0.6;
        this.ww.multiplyScalar(0.5);
        this.game.onWreckBounce(this, imp);
      } else {
        this.wv.y = 0;
        this.wv.x *= 0.88; this.wv.z *= 0.88;
        this.ww.multiplyScalar(0.86);
      }
    }
    this.burn = Math.min(1, this.burn + dt * 3);
    this.speed = Math.hypot(this.wv.x, this.wv.z);
  }

  // -------------------------------------------------------------- visuals
  updateVisual(dt, time) {
    if (!this.active) return;
    this.root.position.copy(this.pos);
    const u = this.mat.userData.u;
    if (this.dead) {
      this.root.quaternion.copy(this.wq);
      this.chassis.rotation.set(0, 0, 0);
      this.body.rotation.set(0, 0, 0);
      this.body.scale.set(1, 1, 1);
    } else {
      this.root.rotation.set(0, this.heading, 0);
      const W = this.game.world;
      if (dt > 0) {
        const x = this.pos.x, z = this.pos.z, h = this.heading;
        const fx = Math.sin(h), fz = Math.cos(h), rx = -Math.cos(h), rz = Math.sin(h);
        if (this.grounded) {
          const hint = this.q.idx;
          const hf = W.groundAt(x + fx * 1.4, z + fz * 1.4, hint);
          const hb = W.groundAt(x - fx * 1.4, z - fz * 1.4, hint);
          const hr = W.groundAt(x + rx * 0.9, z + rz * 0.9, hint);
          const hl = W.groundAt(x - rx * 0.9, z - rz * 0.9, hint);
          this.tPitch = clamp(-Math.atan2(hf - hb, 2.8), -0.5, 0.5);
          this.tRoll = clamp(Math.atan2(hl - hr, 1.8), -0.5, 0.5);
        } else {
          this.tPitch = clamp(-this.vy * 0.028, -0.45, 0.45);
          this.tRoll *= 0.97;
        }
        const k = 1 - Math.exp(-(this.grounded ? 14 : 4) * dt);
        this.pitch += (this.tPitch - this.pitch) * k;
        this.roll += (this.tRoll - this.roll) * k;
        // body sway spring
        const s = this.sway;
        const tp = clamp(-this.aLong * 0.0035, -0.09, 0.09);
        const trr = clamp(this.fwdSpeed * this.yawRate * 0.0032, -0.11, 0.11);
        s.vp += ((tp - s.p) * 140 - s.vp * 13) * dt;
        s.vr += ((trr - s.r) * 140 - s.vr * 13) * dt;
        s.vsq += ((1 - s.sq) * 220 - s.vsq * 13) * dt;
        s.p += s.vp * dt; s.r += s.vr * dt; s.sq += s.vsq * dt;
        s.sq = clamp(s.sq, 0.7, 1.25);
      }
      this.chassis.rotation.set(this.pitch, 0, this.roll);
      this.body.rotation.set(this.sway.p, 0, this.sway.r);
      const sq = this.sway.sq;
      this.body.scale.set(1 + (1 - sq) * 0.45, sq, 1 + (1 - sq) * 0.45);
    }
    // wheels
    this.spin += (this.dead ? 0 : this.fwdSpeed) * dt / this.wheelR;
    const sv = this.input.steer * 0.5;
    this.steerVis += (sv - this.steerVis) * (1 - Math.exp(-14 * dt));
    for (let k = 0; k < 4; k++) {
      const w = this.wheels[k];
      w.spin.rotation.x = this.spin;
      if (w.front) w.pivot.rotation.y = -this.steerVis;
    }
    // material feedback
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 9);
    u.uFlash.value = this.flash * 0.85;
    u.uBurn.value = this.burn;
    this.mesh.visible = this.ghost > 0 ? Math.floor(time * 18) % 2 === 0 : true;
    // blob shadow (low quality only)
    if (this.game.lowShadows) {
      const gh = this.game.world.groundHeight(this.pos.x, this.pos.z, this.q);
      this.blob.visible = true;
      this.blob.position.set(this.pos.x, gh + 0.06, this.pos.z);
      this.blob.rotation.y = this.heading;
      const hgt = Math.max(0, this.pos.y - gh);
      const sc = 1 + hgt * 0.06;
      this.blob.scale.set(sc, 1, sc);
    } else {
      this.blob.visible = false;
    }
  }

  writeWheels(inst, base) {
    if (!this.active) {
      for (let k = 0; k < 4; k++) inst.setMatrixAt(base + k, ZERO_M);
      return;
    }
    this.root.updateMatrixWorld(true);
    for (let k = 0; k < 4; k++) inst.setMatrixAt(base + k, this.wheels[k].spin.matrixWorld);
  }

  /** World position of a local point (uses heading only; cheap). */
  localToWorld(lx, ly, lz, out) {
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    out.x = this.pos.x + c * lx + s * lz;
    out.y = this.pos.y + ly;
    out.z = this.pos.z - s * lx + c * lz;
    return out;
  }
}
