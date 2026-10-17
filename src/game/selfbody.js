// Your own body, from behind your eyes: look down and there it is — the clothes you picked in the wardrobe,
// your legs walking under you, your boots on the ground. Lit by whatever lights the forest (the morning, a
// work lamp, the glow stick in your hand) and, at night, found by your own echo the way the trees are.
//
// The camera doesn't move for it. The body hangs under the eyes, a little behind them (your eyes sit ahead of
// your spine — and further ahead when you look down), and folds into a deep squat when you crouch (the eyes
// drop to a metre: the body has to fit under them). The head is never drawn — you're looking out of it — and
// the arms step aside whenever the hands are busy with something drawn up close (a glow stick, a part for the
// УАЗ, a friend over your shoulder). In the УАЗ you sit in your seat (the driver's hands on the wheel).
// Nothing here goes over the network: your friends see your remote body, as always.
import { CFG } from '../core/config.js';
import { clamp, lerp } from '../core/rng.js';
import { buildSurvivor, poseCarrier, poseFur } from './survivor.js';
import { fitKey } from './outfit.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';

const PI = Math.PI;
// A body a few percent smaller than the one your friends see, so the collar sits a hand's width under your
// eyes; and your eyes kept this far ahead of it. (The camera's near plane is 5 cm: closer than that, cloth
// would be cut open at the bottom of the screen.)
const SCALE = 0.965;
const CLEAR = 0.045;

export class SelfBody {
  constructor(game) {
    this.game = game;
    this.rig = null;
    this.mat = null;
    this.meshes = [];
    this.arms = { L: [], R: [] };
    this.key = '';
    this.front = 0.12; // how far the clothes reach forward around the collar (see dress)
  }

  // what you wear tonight (built again only when it changed)
  dress(fit, rimHex) {
    const key = `${fitKey(fit)}|${rimHex}`;
    if (this.rig && key === this.key) return;
    this.undress();
    this.key = key;
    const rig = buildSurvivor(fit);
    rig.root.visible = false;
    rig.root.scale.setScalar(SCALE);
    const mat = createPersonMaterial(rig.dyes, rimHex);
    mat.uniforms.uEcho.value = 1;
    const meshes = dressPerson(rig, mat);
    const n = rig.nodes;
    const under = (o, top) => {
      for (let q = o; q; q = q.parent) if (q === top) return true;
      return false;
    };
    let front = 0.1;
    rig.parts.forEach((p, i) => {
      const m = meshes[i];
      if (under(p.node, n.head)) m.visible = false; // you look out of it
      else if (under(p.node, n.shL)) this.arms.L.push(m);
      else if (under(p.node, n.shR)) this.arms.R.push(m);
      else if (p.node === n.chest) {
        // a collar, a big fleece collar, a neck seal: whatever sits right under your chin
        const a = p.arr.pos;
        for (let j = 0; j < a.length; j += 3) if (a[j + 1] > 0.3 && Math.abs(a[j]) < 0.2) front = Math.max(front, a[j + 2]);
      }
    });
    this.front = front;
    this.rig = rig;
    this.mat = mat;
    this.meshes = meshes;
    this.game.scene.add(rig.root);
  }

  undress() {
    if (!this.rig) return;
    if (this.rig.root.parent) this.rig.root.parent.remove(this.rig.root);
    undressPerson(this.meshes);
    this.mat.dispose();
    this.rig = null;
    this.mat = null;
    this.meshes = [];
    this.arms = { L: [], R: [] };
    this.key = '';
  }

  hide() {
    if (this.rig) this.rig.root.visible = false;
  }

  // every frame, once the player has moved. show: whether you could see yourself at all right now
  place(show) {
    const rig = this.rig;
    if (!rig) return;
    const root = rig.root;
    if (!show) {
      root.visible = false;
      return;
    }
    const g = this.game, p = g.player, es = g.escape, n = rig.nodes;
    root.visible = true;
    if (es.mySeat >= 0) {
      es._seatRig(rig, es.mySeat, false, es.mySeat === 0);
      root.translateZ(-this._clear(n.chest.rotation.x));
      this._arms(true, true);
      return;
    }
    const P = CFG.PLAYER;
    const k = clamp((P.eye - p.eyeCur) / (P.eye - P.crouchEye), 0, 1); // standing 0 → squatting 1
    const amp = clamp(p.speed / 3.2, 0, 1.4) * (1 - 0.5 * k);
    poseSelf(rig, p.bobPhase || 0, amp, k);
    const now = performance.now();
    poseFur(rig, Math.min(0.1, (now - (this._t || now)) / 1000), p.speed); // (a tail behind you, as it should be)
    this._t = now;
    const carrying = !!p.carrying, part = !!es.held;
    if (carrying) poseCarrier(rig);
    root.position.set(p.x, p.y + (p.bobY || 0), p.z);
    root.rotation.set(0, p.yaw + PI, 0); // (the rig faces +z; you look down -z)
    root.translateZ(-this._clear(n.chest.rotation.x));
    // hands busy with something drawn up close: those arms step aside
    this._arms(!(carrying || part || (g.torch && g.torch.on)), !(carrying || part || !!g.glows.held));
  }

  // how far back the body goes: the top of your collar, wherever the chest's lean puts it, stays behind your eyes
  _clear(lean) {
    return SCALE * (0.61 * Math.sin(lean) + this.front * Math.cos(lean)) + CLEAR;
  }

  _arms(l, r) {
    for (const m of this.arms.L) m.visible = l;
    for (const m of this.arms.R) m.visible = r;
  }
}

// standing → walking → a deep squat. k: how far down the crouch is (follows your eye height). The hips don't
// bob here: your eyes bob with the whole body (the root), so the body under them holds still as you walk
function poseSelf(rig, phase, amp, k) {
  const n = rig.nodes;
  const s = Math.sin(phase);
  rig.root.rotation.x = 0;
  n.hips.position.set(0, lerp(0.94, 0.42, k), 0);
  n.hips.rotation.set(0, 0, 0);
  n.chest.rotation.set(lerp(0.05 * amp, 0.4, k), 0, 0);
  n.head.rotation.set(0, 0, 0);
  n.thL.rotation.set(s * 0.55 * amp - 1.45 * k, 0, -0.07 * k);
  n.thR.rotation.set(-s * 0.55 * amp - 1.45 * k, 0, 0.07 * k);
  n.knL.rotation.x = Math.max(0, -s) * 0.7 * amp + 2.25 * k;
  n.knR.rotation.x = Math.max(0, s) * 0.7 * amp + 2.25 * k;
  n.shL.rotation.set(-s * 0.45 * amp - 0.5 * k, 0, -0.07 - 0.12 * k);
  n.shR.rotation.set(s * 0.45 * amp - 0.5 * k, 0, 0.07 + 0.12 * k);
  n.elL.rotation.x = -0.25 - amp * 0.2 - 0.55 * k;
  n.elR.rotation.x = -0.25 - amp * 0.2 - 0.55 * k;
}
