// (3.0p) The survey board on the garage's back wall.
//
// It used to be a paper-coloured box with five pencil rings, which on a dark wall read as a blank sheet — "a map
// that shows nothing". It now prints the real plan of the участок the room is playing, from the same PNG the solo
// panel shows (public/maps/forest.png / bog.png, drawn from the real terrain by scripts/mapPreview.mjs).
//
// The drawing is a plain function of a 2D context, so it can be checked without a browser, a GPU or a canvas:
// tests/round30p.test.mjs hands it a recording context and looks at what it actually printed.
// portrait, because the plate is portrait (440×560): a landscape board would leave half of it empty paper
export const MAP_BOARD = { w: 560, h: 678, plane: { w: 0.95, h: 1.15 } };

const PAPER = '#c9c2a8';
const EDGE = '#8e8870';
const INK = '#3f4838';
const RULE = '#6d6a52';
const SMALL = '#5f5b46';

// o: { id: 'forest' | 'bog', img: Image|null, title, ground, foot, empty }
// returns { plate: { x, y, w, h } | null, empty: boolean } — what was actually drawn
export function paintMapBoard(ctx, o) {
  const W = MAP_BOARD.w, H = MAP_BOARD.h;
  const bog = o.id === 'bog';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = EDGE;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(5, 5, W - 10, H - 10);

  // the same age as the rules poster next to it: foxing, and a print that has been out in the damp
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = 0.05 + (i % 4) * 0.01;
    ctx.fillStyle = i % 2 ? '#6a6244' : '#e6dfc4';
    ctx.fillRect((i * 197) % (W - 8), (i * 131) % (H - 8), 3 + (i % 17), 2 + (i % 11));
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#4c5544';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 16, W - 36, H - 32);
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = INK;
  ctx.fillText(o.title, 34, 48);
  ctx.textAlign = 'right';
  ctx.fillStyle = bog ? '#5c4a3a' : INK;
  ctx.fillText(o.ground, W - 34, 48);
  ctx.fillStyle = RULE;
  ctx.fillRect(34, 58, W - 68, 2);

  // the plate itself, fitted whole (portrait into whatever the board is)
  const box = { x: 34, y: 70, w: W - 68, h: H - 70 - 34 };
  const img = o.img;
  let plate = null;
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const k = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    const x = box.x + (box.w - w) / 2, y = box.y + (box.h - h) / 2;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(60,66,50,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    plate = { x, y, w, h };
  } else {
    // no plate on this machine (a build without the maps): say so plainly, and keep the board a board
    ctx.strokeStyle = 'rgba(90,92,70,0.35)';
    ctx.lineWidth = 1;
    for (let x = box.x; x < box.x + box.w; x += 24) { ctx.beginPath(); ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + box.h); ctx.stroke(); }
    for (let y = box.y; y < box.y + box.h; y += 24) { ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke(); }
    ctx.fillStyle = '#5a5c48';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(o.empty, box.x + box.w / 2, box.y + box.h / 2);
  }

  // the footnote: what is on that ground — the same words the solo panel uses
  ctx.textAlign = 'center';
  ctx.fillStyle = SMALL;
  ctx.font = '19px monospace';
  ctx.fillText(o.foot, W / 2, H - 20, W - 76);

  // two nails: the board is pinned up, not framed
  ctx.fillStyle = '#3c4136';
  for (const x of [26, W - 26]) { ctx.beginPath(); ctx.arc(x, 26, 5, 0, Math.PI * 2); ctx.fill(); }

  return { plate, empty: !plate, box };
}
