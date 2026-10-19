// The menu uses the existing lobby tea chair, never an extra chair/platform in front of a friend.
import { SPOTS } from './garageSet.js';
import { clamp, lerp } from '../core/rng.js';

export const GET_UP_SECONDS = 1.25;
export const TEA_SEAT = SPOTS[1];
const ease = x => x*x*(3-2*x);
const segment = (t,a,b) => ease(clamp((t-a)/(b-a),0,1));

// rc follows Garage._chair's original sequence: put the mug down, then push up from the seat.
// Root compensation preserves a safe, fixed standing point while the preview is rotated.
export function teaSeatMotion(age,previewYaw=.42) {
  const rc=clamp(age/GET_UP_SECONDS,0,1)*2;
  const up=segment(rc,1,1.9),turn=segment(rc,1.8,2);
  const delta=Math.atan2(Math.sin(previewYaw-TEA_SEAT.yaw),Math.cos(previewYaw-TEA_SEAT.yaw));
  const yaw=TEA_SEAT.yaw+delta*turn;
  const [x,y,z]=TEA_SEAT.pos;
  const forward=.36*up;
  const anchor=[x+Math.sin(TEA_SEAT.yaw)*forward,y,z+Math.cos(TEA_SEAT.yaw)*forward];
  return {rc,up,yaw,anchor,root:[anchor[0]-Math.sin(yaw)*forward,y,anchor[2]-Math.cos(yaw)*forward],height:lerp(.55,.94,up)};
}
