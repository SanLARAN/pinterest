// The repair hands (2.1): the wrench at a generator, the kneel under it, and the eyes that come
// down to the bolts. All poses are plain node math — no browser needed to check them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { poseWork } from '../src/game/selfbody.js';
import { Game } from '../src/game/game.js';

const rot = () => ({ x: 0, y: 0, z: 0 });
function rig() {
  return {
    nodes: {
      hips: { position: { x: 0, y: 0.94, z: 0 }, rotation: rot() },
      chest: { rotation: rot() },
      head: { rotation: rot() },
      thL: { rotation: rot() }, thR: { rotation: rot() },
      knL: { rotation: rot() }, knR: { rotation: rot() },
      shL: { rotation: rot() }, shR: { rotation: rot() },
      elL: { rotation: rot() }, elR: { rotation: rot() },
    },
  };
}

test('the repair kneel: right knee down, left foot planted, chest into the machine, eyes on the bolts', () => {
  const r = rig();
  poseWork(r, 1, 0);
  const n = r.nodes;
  assert.equal(n.hips.position.y, 0.5); // the right knee is on the ground
  assert.equal(n.hips.position.x, 0.05); // the weight over the planted foot
  assert.equal(n.chest.rotation.x, 0.55); // leaning in over the engine
  assert.equal(n.head.rotation.x, -0.4); // watching your own hands
  assert.equal(n.thL.rotation.x, -1.5); // the left thigh: foot flat by the machine
  assert.equal(n.knL.rotation.x, 1.75);
  assert.equal(n.knR.rotation.x, 2.45); // the right knee folded behind
});

test('the kneel eases in over whatever the walk left in the joints, never snaps', () => {
  const r = rig();
  r.nodes.hips.position.y = 0.94; // fresh off poseSelf, standing
  r.nodes.chest.rotation.x = 0.1;
  poseWork(r, 0.5, 3);
  assert.ok(Math.abs(r.nodes.hips.position.y - (0.94 + 0.5) / 2) < 1e-9, `hips ${r.nodes.hips.position.y}`);
  assert.ok(Math.abs(r.nodes.chest.rotation.x - (0.1 + 0.55) / 2) < 1e-9);
  const before = r.nodes.hips.position.y;
  poseWork(r, 0.001, 3);
  assert.ok(Math.abs(r.nodes.hips.position.y - before) < 0.0005, 'a whisper of work barely moves the body');
});

test('the wrench arm swings and the steadying hand does not', () => {
  const a = rig(), b = rig();
  poseWork(a, 1, 0);
  poseWork(b, 1, Math.PI / 14); // a quarter turn of the crank: the wrench at its extreme
  const swing = Math.abs(a.nodes.shR.rotation.x - b.nodes.shR.rotation.x);
  const steady = Math.abs(a.nodes.shL.rotation.x - b.nodes.shL.rotation.x);
  assert.ok(swing > 0.15, `the wrench arm covers ${swing.toFixed(2)} rad of work`);
  assert.ok(swing > steady * 2.5, 'the wrench arm works far harder than the steadying hand');
});

// the eyes come down to the bolts while the hands are on an engine, and back up when you step away
function bare() {
  const g = Object.create(Game.prototype);
  g.state = 'play';
  g.role = 'solo';
  g.player = { id: 'a', alive: true, eyeCur: 1.62 };
  g.objectives = { working: null };
  g.workK = 0;
  return g;
}
test('at a generator the work pose settles in and the eyes drop toward the bolts', () => {
  const g = bare();
  g.objectives.working = {}; // your hands are on an engine
  for (let i = 0; i < 90; i++) Game.prototype._workPose.call(g, 1 / 60);
  assert.ok(g.workK > 0.9, `workK ${g.workK}`);
  assert.ok(g.player.eyeCur < 1.2 && g.player.eyeCur > 1.05, `eyeCur ${g.player.eyeCur}`);
  // step back: it lets go, and the eyes follow
  g.objectives.working = null;
  for (let i = 0; i < 120; i++) Game.prototype._workPose.call(g, 1 / 60);
  assert.ok(g.workK < 0.02, `workK ${g.workK}`);
  // a dead player's body never kneels into a machine
  const dead = bare();
  dead.player.alive = false;
  dead.objectives.working = {};
  for (let i = 0; i < 60; i++) Game.prototype._workPose.call(dead, 1 / 60);
  assert.ok(dead.workK < 0.02);
});
