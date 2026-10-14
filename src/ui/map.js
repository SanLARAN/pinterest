// World map for the TAB panel: drawn on a 2D canvas from plain data (no three import).
// North is up (negative z), the way the knight faces the enemy keep at the start.
const INK = '#2b1d3a';
const PARCH = '#efdcae';
const STONE = '#c9b48a';
const KEEP = '#a8925f';
const VIOLET = '#8c5cf0';
const GOLD = '#f6c24f';
const CRIMSON = '#c0392b';
const GREEN = '#4caf50';

/**
 * Draws the whole map. `m` = { radius, castleHalf, keepHalf, base:{x,z,half,gates:[box]},
 * throne:{x,z}, gatesOpen, rifts:[{x,z}], baseRifts:[{x,z}], stall:{x,z}|null,
 * hero:{x,z,facing,dead}, foes:[{x,z,boss}] }.
 */
export function drawWorldMap(ctx, size, m) {
  const k = size / (m.radius * 2 + 4);
  const P = (x, z) => [size / 2 + x * k, size / 2 + z * k];
  ctx.clearRect(0, 0, size, size);

  // the playable ring
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, m.radius * k, 0, Math.PI * 2);
  ctx.fillStyle = PARCH;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  const square = (cx, cz, half, fill) => {
    const [x0, y0] = P(cx - half, cz - half);
    const [x1, y1] = P(cx + half, cz + half);
    ctx.fillStyle = fill;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  };
  // the player's castle and keep at the centre
  square(0, 0, m.castleHalf, STONE);
  square(0, 0, m.keepHalf, KEEP);
  // the enemy stronghold
  square(m.base.x, m.base.z, m.base.half, '#8f7fb0');
  // gates: dark iron while sealed, green once open
  ctx.lineWidth = 4;
  ctx.strokeStyle = m.gatesOpen ? GREEN : INK;
  for (const b of m.base.gates) {
    const [x0, y0] = P(b.minX, b.minZ);
    const [x1, y1] = P(b.maxX, b.maxZ);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  // the throne
  const [tx, ty] = P(m.throne.x, m.throne.z);
  ctx.beginPath();
  ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = m.gatesOpen ? GOLD : VIOLET;
  ctx.fill();

  // rift markers: outside rifts always, inner rifts dimmed until the gates open
  const cross = (x, z, color, alpha) => {
    const [px, py] = P(x, z);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 4, py - 4);
    ctx.lineTo(px + 4, py + 4);
    ctx.moveTo(px + 4, py - 4);
    ctx.lineTo(px - 4, py + 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  for (const r of m.rifts) cross(r.x, r.z, CRIMSON, 1);
  for (const r of m.baseRifts) cross(r.x, r.z, CRIMSON, m.gatesOpen ? 1 : 0.35);

  // the merchant's stall
  if (m.stall) {
    const [sx, sy] = P(m.stall.x, m.stall.z);
    ctx.fillStyle = GOLD;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.fillRect(sx - 3.5, sy - 3.5, 7, 7);
    ctx.strokeRect(sx - 3.5, sy - 3.5, 7, 7);
  }

  // foes, bosses larger
  for (const f of m.foes) {
    const [fx, fy] = P(f.x, f.z);
    ctx.beginPath();
    ctx.arc(fx, fy, f.boss ? 5 : 2.4, 0, Math.PI * 2);
    ctx.fillStyle = f.boss ? GOLD : CRIMSON;
    ctx.fill();
    if (f.boss) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // the knight, with a heading tick (drawn last so it is never hidden)
  const [hx, hy] = P(m.hero.x, m.hero.z);
  const fx = Math.sin(m.hero.facing);
  const fz = Math.cos(m.hero.facing);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + fx * 11, hy + fz * 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = m.hero.dead ? '#777' : '#6fb3ff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();

  // compass
  ctx.fillStyle = INK;
  ctx.font = '700 14px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('N', size / 2, 6);
}
