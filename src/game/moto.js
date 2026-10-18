// Enduro bikes: one per survivor on the training ground. Arcade weight with an enduro's manners — the
// nose lifts under the throttle, the forks dive under the brake, the suspension eats the ground it lands
// on, and a rise taken fast turns into a jump. Ride with W/S (throttle, brake/reverse), A/D (steer),
// Shift (push), E (step off). The camera sits behind the shoulder and leans with the bike.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { clamp, damp } from '../core/rng.js';
import { t } from '../core/i18n.js';

const M = CFG.MOTO;
const COLORS = [0xa33d2c, 0x2f5c8a, 0xb78a45, 0x4c6b38];

function paint(hex, light = 0.9) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(hex) }, uLight: { value: light } },
    vertexShader: `varying vec3 vN; varying vec3 vP;
      void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uLight; varying vec3 vN; varying vec3 vP;
      void main(){
        float sh = .48 + .52 * max(0.0, dot(normalize(vN), normalize(vec3(-.35,.8,.5))));
        float low = .82 + .18 * max(0.0, -vP.y);
        gl_FragColor = vec4(uColor * sh * low * uLight, 1.0);
      }`,
  });
}

function cylinderBetween(a, b, r, mat, seg = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export class Moto {
  constructor(game) {
    this.g = game;
    this.bikes = [];
    this.bike = null;
    this.mountT = 0;
    this.orbit = 0;
    this.orbitPitch = 0;
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.mats = {
      dark: paint(0x15161a, 0.9),
      metal: paint(0x8d9297, 1.0),
      seat: paint(0x22201d, 0.8),
      engine: paint(0x3c3f40, 0.85),
      glass: paint(0xcfd7d2, 1.0),
    };
    this.paints = COLORS.map((c) => paint(c, 0.95));
    this.group = new THREE.Group();
    this.group.frustumCulled = false;
    game.scene.add(this.group);
    this.time = 0;
  }

  build(i) {
    const p = this.paints[i % this.paints.length];
    const g = new THREE.Group();
    const wheelGeo = new THREE.TorusGeometry(M.wheelR, 0.075, 6, 14);
    const tyreMat = this.mats.dark;
    const wheels = [];
    for (const z of [-M.wheelbase / 2, M.wheelbase / 2]) {
      const w = new THREE.Group();
      w.position.set(0, M.wheelR, z);
      const tyre = new THREE.Mesh(wheelGeo, tyreMat);
      tyre.rotation.y = Math.PI / 2;
      w.add(tyre);
      // knobby tread: a ring of little blocks
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const knob = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.045, 0.07), tyreMat);
        knob.position.set(0, Math.sin(a) * (M.wheelR + 0.05), Math.cos(a) * (M.wheelR + 0.05));
        knob.rotation.x = a;
        w.add(knob);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.13, 8), this.mats.metal);
      hub.rotation.z = Math.PI / 2;
      w.add(hub);
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        g.add(cylinderBetween(
          new THREE.Vector3(0, M.wheelR, z),
          new THREE.Vector3(0, M.wheelR + Math.cos(a) * M.wheelR, z + Math.sin(a) * M.wheelR),
          0.006, this.mats.metal, 4));
      }
      g.add(w);
      wheels.push(w);
    }
    // frame: a cradle of tubes, the tank over it, the seat behind
    const tube = (a, b, r = 0.028) => g.add(cylinderBetween(new THREE.Vector3(...a), new THREE.Vector3(...b), r, p));
    tube([0, 0.44, -0.22], [0, 0.78, -0.42], 0.03); // head tube
    tube([0, 0.44, -0.22], [0, 0.3, 0.28]); // lower cradle
    tube([0, 0.78, -0.42], [0, 0.52, 0.34], 0.032); // top tube
    tube([0, 0.3, 0.28], [0, 0.52, 0.34], 0.028);
    tube([0, 0.3, 0.28], [0, 0.62, 0.42], 0.024); // seat post
    // swingarm
    for (const x of [-0.05, 0.05]) tube([x, 0.34, 0.3], [x, M.wheelR, M.wheelbase / 2], 0.022);
    // forks: two shiny stanchions down to the axle
    for (const x of [-0.09, 0.09]) {
      g.add(cylinderBetween(new THREE.Vector3(x, 1.0, -0.5), new THREE.Vector3(x, M.wheelR, -M.wheelbase / 2), 0.022, this.mats.metal, 6));
      g.add(cylinderBetween(new THREE.Vector3(x, 0.74, -0.36), new THREE.Vector3(x, 1.0, -0.5), 0.032, p, 6));
    }
    // tank and seat
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.5), p);
    tank.position.set(0, 0.74, -0.02);
    tank.rotation.x = 0.08;
    g.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.55), this.mats.seat);
    seat.position.set(0, 0.66, 0.29);
    seat.rotation.x = -0.05;
    g.add(seat);
    // engine and exhaust
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.3), this.mats.engine);
    engine.position.set(0, 0.44, 0.02);
    g.add(engine);
    for (let k = 0; k < 4; k++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.2), this.mats.metal);
      fin.position.set(0, 0.34 + k * 0.06, 0.02);
      g.add(fin);
    }
    g.add(cylinderBetween(new THREE.Vector3(0.08, 0.5, 0.16), new THREE.Vector3(0.16, 0.56, 0.5), 0.035, this.mats.metal, 6));
    g.add(cylinderBetween(new THREE.Vector3(0.16, 0.56, 0.5), new THREE.Vector3(0.17, 0.6, 0.78), 0.045, this.mats.metal, 6));
    // mudguards
    for (const [z, r] of [[-M.wheelbase / 2, 0.5], [M.wheelbase / 2, 0.46]]) {
      const guard = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 4, 10, Math.PI * 0.8), p);
      guard.position.set(0, M.wheelR + 0.04, z);
      guard.rotation.set(0, Math.PI / 2, Math.PI * 0.62);
      g.add(guard);
    }
    // handlebar, grips, headlight
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.72, 6), this.mats.metal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.03, -0.47);
    g.add(bar);
    for (const x of [-0.3, 0.3]) {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.12, 6), this.mats.dark);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(x, 1.03, -0.47);
      g.add(grip);
    }
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 10), this.mats.glass);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(0, 0.93, -0.56);
    g.add(lamp);
    // a number plate and the fork brace
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.03), paint(0xd8d2b4, 0.95));
    plate.position.set(0, 0.7, -0.62);
    g.add(plate);

    const root = new THREE.Group();
    root.add(g);
    root.position.set(0, 0, 0);
    this.group.add(root);
    return { root, body: g, wheels, color: COLORS[i % COLORS.length] };
  }

  reset(training = false) {
    for (const b of this.bikes) { b.root.parent?.remove(b.root); b.root.traverse((o) => { if (o.geometry && !o.geometry.__shared) o.geometry.dispose(); }); }
    this.bikes = [];
    this.bike = null;
    this.mountT = 0;
    if (!training) return;
    const T = CFG.TRAINING;
    const n = CFG.TRAINING.bikes; // the school keeps one per seat, so each survivor has a bike
    for (let i = 0; i < n; i++) {
      const b = this.build(i);
      const x = T.spawn.x - 2.2 + i * 1.55;
      const z = T.spawn.z + 3.4;
      b.x = x; b.z = z;
      b.y = this.g.world.terrain.height(x, z);
      b.yaw = Math.PI * 0.94; // noses toward the forest
      b.v = 0; b.vy = 0; b.steer = 0; b.lean = 0; b.pitch = 0; b.onGround = true;
      b.idleT = 0;
      b.root.position.set(b.x, b.y, b.z);
      b.root.rotation.set(0, b.yaw, 0);
      this.bikes.push(b);
    }
  }

  get riding() { return !!this.bike; }

  near() {
    const p = this.g.player;
    let best = null, bd = M.standDist;
    for (const b of this.bikes) {
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  // E: swing a leg over the nearest bike, or step off the one you're on
  interact(pressed) {
    const g = this.g;
    if (!g.player.alive) return false;
    if (this.bike) {
      if (!pressed) return true;
      const b = this.bike;
      this.bike = null;
      this.mountT = 0;
      const f = { x: -Math.sin(b.yaw), z: -Math.cos(b.yaw) };
      let spot = { x: b.x + f.z * 0.9, z: b.z - f.x * 0.9 };
      if (!g.world.col.free(spot.x, spot.z, CFG.PLAYER.radius)) spot = { x: b.x - f.z * 0.9, z: b.z + f.x * 0.9 };
      g.player.x = spot.x; g.player.z = spot.z;
      g.player.y = g.world.terrain.height(spot.x, spot.z);
      g.player.vx = g.player.vz = 0;
      g.player.eyeCur = CFG.PLAYER.eye;
      return true;
    }
    const b = this.near();
    if (!b) return false;
    if (!pressed) { g.hud.setUse(t(g.input.touch ? 'motoT' : 'motoMount'), 0, true); return true; }
    this.bike = b;
    this.mountT = 0;
    g.player.yaw = b.yaw;
    this.camPos.set(b.x + Math.sin(b.yaw) * 4, b.y + 1.8, b.z + Math.cos(b.yaw) * 4);
    this.camLook.set(b.x, b.y + 1.2, b.z);
    return true;
  }

  update(dt, raw) {
    this.time += dt;
    const g = this.g;
    const p = g.player;
    const riding = this.bike;
    if (riding) {
      this.mountT = Math.min(M.mount, this.mountT + dt);
      const k = clamp(this.mountT / M.mount, 0, 1);
      const look = raw?.look || { dx: 0, dy: 0 };
      this.orbit = clamp(this.orbit - look.dx, -1.05, 1.05);
      this.orbitPitch = clamp(this.orbitPitch - look.dy * 0.6, -0.5, 0.5);
      this.drive(riding, dt, k);
      // you ride the bike, not yourself
      p.x = riding.x;
      p.z = riding.z;
      p.y = riding.y;
      p.yaw = riding.yaw;
      p.vx = p.vz = 0;
      p.speed = Math.abs(riding.v);
      p.eyeCur = CFG.MOTO.seat;
      if (this.orbit && Math.abs(this.orbit) < 0.05) this.orbit = 0;
      this.orbit = damp(this.orbit, 0, 0.9, dt);
    } else {
      this.orbit = damp(this.orbit, 0, 6, dt);
      this.orbitPitch = damp(this.orbitPitch, 0, 6, dt);
      for (const b of this.bikes) {
        if (Math.abs(b.v) > 0.02) this.drive(b, dt, 0, true); // parked bikes settle
      }
    }
    for (const b of this.bikes) this.place(b, dt);
  }

  drive(b, dt, k, coast = false) {
    const g = this.g;
    const input = g.input;
    const throttle = coast ? 0 : clamp(input.move.y, -1, 1);
    const steerIn = coast ? 0 : clamp(input.move.x, -1, 1);
    const boost = !coast && input.sprint;
    const brake = !coast && input.crouch;
    const top = M.top * (boost ? 1.18 : 1);
    // engine and brakes
    if (throttle > 0.05) {
      // full pull off the line, tapering only near the top so the bike actually gets there
      const over = Math.max(0, Math.abs(b.v) - top * 0.8) / (top * 0.2);
      const pull = M.power * throttle * Math.max(0, 1 - over);
      b.v += pull * dt;
    } else if (throttle < -0.05) {
      if (b.v > 0.6) b.v -= M.brake * -throttle * dt;
      else b.v -= M.reverse * -throttle * dt;
    }
    if (brake) b.v -= M.brake * 0.85 * Math.sign(b.v) * dt * (Math.abs(b.v) > 0.2 ? 1 : 0);
    // drag, rolling resistance
    b.v *= 1 - M.drag * dt;
    if (Math.abs(b.v) < 0.03) b.v = 0;
    b.v = clamp(b.v, -M.reverse, top);
    // steering: less lock at speed, and a real lean
    b.steer = damp(b.steer, steerIn, 9, dt);
    const grip = 1 - 0.55 * clamp(Math.abs(b.v) / M.top, 0, 1);
    b.yaw -= b.steer * M.steer * grip * dt * (b.v >= 0 ? 1 : -1);
    b.lean = damp(b.lean, -b.steer * M.lean * clamp(Math.abs(b.v) / 7, 0, 1), 7, dt);
    // move, with the forest's collision on our side
    const f = { x: -Math.sin(b.yaw), z: -Math.cos(b.yaw) };
    const nx = b.x + f.x * b.v * dt, nz = b.z + f.z * b.v * dt;
    const pos = { x: nx, z: nz };
    const hit = g.world.col.resolve(pos, 0.42);
    if (hit.hit) {
      const into = -(Math.sin(b.yaw) * -hit.nx + Math.cos(b.yaw) * -hit.nz);
      b.v *= 0.55;
      if (Math.abs(b.v) > 2.2 && k >= 1) { g.addTrauma(0.18); if (g.audio?.ready) g.audio.bump?.(); }
      if (into > 0.2) { b.v = Math.min(b.v, 0.6); }
    }
    b.x = clamp(pos.x, -CFG.WORLD_WALL, CFG.WORLD_WALL);
    b.z = clamp(pos.z, -CFG.WORLD_WALL, CFG.WORLD_WALL);
    // suspension: follow the ground, leave it on a crest, land hard
    const gy = g.world.terrain.height(b.x, b.z);
    const ahead = g.world.terrain.height(b.x + f.x * 1.1, b.z + f.z * 1.1);
    const slope = (ahead - gy) / 1.1;
    if (b.onGround) {
      const drop = b.y - gy;
      if (drop > 0.45 && Math.abs(b.v) > 4.2) {
        b.onGround = false;
        b.vy = Math.min(4.6, 1.4 + Math.abs(b.v) * 0.16);
      } else {
        b.y = damp(b.y, gy, 26, dt);
        // a crest taken fast kicks the bike up a little
        if (slope < -0.35 && Math.abs(b.v) > 8 && Math.random() < dt * 2) b.vy = Math.max(b.vy, 1.6);
      }
    } else {
      b.vy -= 9.81 * dt;
      b.y += b.vy * dt;
      if (b.y <= gy) {
        const hard = Math.min(1, -b.vy / 6);
        b.y = gy; b.vy = 0; b.onGround = true;
        if (hard > 0.35 && b === this.bike) g.addTrauma(hard * 0.35);
      }
    }
    // wheelie under power, dive under the brake
    const wantPitch = clamp(-Math.atan(slope) * 0.8, -0.4, 0.4) + (throttle > 0.4 && Math.abs(b.v) < 8 ? 0.16 : 0) - (brake ? 0.1 : 0);
    b.pitch = damp(b.pitch, wantPitch, 5, dt);
    if (Math.random() < dt * 8 && Math.abs(b.v) > 3 && b.onGround) {
      const back = { x: b.x + Math.sin(b.yaw) * 0.7, z: b.z + Math.cos(b.yaw) * 0.7 };
      g.particles?.burst(back.x, b.y + 0.05, back.z, 1, { color: [0.42, 0.36, 0.25], speed: 0.5, up: 0.4, life: 0.5, size: 0.07, gravity: 0.4, drag: 2 });
    }
  }

  place(b, dt) {
    // suspension travel and wheel spin are purely visual
    const spin = (b.v || 0) * dt / M.wheelR;
    for (const w of b.wheels) w.rotation.x += spin;
    b.root.position.set(b.x, b.y + (b.onGround ? 0 : 0), b.z);
    b.root.rotation.set(b.pitch || 0, b.yaw, b.lean || 0);
  }

  // third person: over the shoulder, low, with the horizon leaning into the corner
  applyView(camera, realT) {
    const b = this.bike;
    if (!b) return;
    const speed = Math.abs(b.v);
    const back = 3.9 + speed * 0.07;
    const up = 1.72 + this.orbitPitch * 1.2;
    const yaw = b.yaw + this.orbit;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const want = new THREE.Vector3(b.x - fx * back, b.y + up, b.z - fz * back);
    // keep the camera out of the trees
    // keep the chase camera out of a trunk when a tree comes up between you and it
    const pos = { x: want.x, z: want.z };
    this.g.world.col.resolve(pos, 0.25);
    want.x = pos.x; want.z = pos.z;
    this.camPos.lerp(want, 0.16);
    this.camLook.lerp(new THREE.Vector3(b.x + fx * 2.6, b.y + 1.25, b.z + fz * 2.6), 0.22);
    camera.position.copy(this.camPos);
    camera.up.set(0, 1, 0);
    camera.lookAt(this.camLook);
    camera.rotateZ(b.lean * 0.55);
    const fov = CFG.FOV + 4 + clamp(speed / M.top, 0, 1) * 10;
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = damp(camera.fov, fov, 6, 1 / 60); camera.updateProjectionMatrix(); }
    // a little shake at speed, and the roar of the wind in the audio
    const sh = clamp(speed / M.top, 0, 1) * 0.006;
    camera.rotateX((Math.sin(realT * 37) * 0.5 + Math.sin(realT * 23)) * sh);
    camera.rotateY((Math.sin(realT * 31) * 0.5 + Math.sin(realT * 17)) * sh);
  }
}
