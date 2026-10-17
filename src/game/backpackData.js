// The four pockets are the only storage for usable field items. Small consumables stack;
// mission parts/notes belong to the shared objective, heavy UAZ parts occupy both hands.
export const BAG_SIZE = 4;
export const BAG_KINDS = ['stones', 'glow', 'torch', 'flare', 'battery', 'tape', 'crowbar'];
export const BAG_LIMIT = { stones: 3, glow: 3, torch: 1, flare: 6, battery: 3, tape: 1, crowbar: 1 };
export const LOOT_KIND = { nuts: 'stones', glow: 'glow', battery: 'battery', flare: 'flare' };
export const kindIndex = (kind) => BAG_KINDS.indexOf(kind);
export function fitsPocket(slots, kind) {
  return BAG_KINDS.includes(kind) && Array.isArray(slots) && slots.length === BAG_SIZE && (slots.includes(kind) || slots.includes(null));
}
export function cleanPockets(a) {
  if (!Array.isArray(a) || a.length !== BAG_SIZE) return null;
  const seen = new Set();
  for (const k of a) {
    if (k !== null && (!BAG_KINDS.includes(k) || seen.has(k))) return null;
    if (k !== null) seen.add(k);
  }
  return a.slice();
}
export function cleanParcel(d) {
  if (!d || !BAG_KINDS.includes(d.kind) || ['tape', 'crowbar'].includes(d.kind)) return null;
  if (!Number.isInteger(d.n) || d.n < 0 || d.n > BAG_LIMIT[d.kind]) return null;
  if (!d.n && d.kind !== 'flare') return null;
  if (d.kind === 'torch' && (d.n !== 1 || !Number.isFinite(d.charge) || d.charge < 0 || d.charge > 1)) return null;
  return { kind: d.kind, n: d.n, ...(d.kind === 'torch' ? { charge: d.charge } : {}), ...(d.kind === 'flare' ? { gun: !!d.gun } : {}) };
}
export const BAG_ICON = {
  stones: '<path d="m17 15 17-7 16 12-4 23-23 4-11-17Z"/><circle cx="32" cy="28" r="9"/><path d="m23 47 5 8 15-3 10-12-7-7"/>',
  glow: '<path d="m37 7 9 5-20 45-9-5Z"/><path d="m34 13 9 5M20 45l9 5M22 38l13-27"/>',
  torch: '<path d="m23 29 15 4-6 23-15-4Z"/><path d="m23 29-5-10 6-12 24 7-1 13-9 6M20 18l25 7M24 9l-1 10M43 14l-4 9"/><path d="m27 36 4 1-2 8-4-1Z"/>',
  flare: '<path d="m10 17 38-3 7 5-1 11-26 2-6 19-13-1 7-22-6-1Z"/><path d="m27 32 9-1-4 10h-8M47 15l-1 16M18 17l-2 10"/>',
  battery: '<path d="M24 8h16v7H24ZM20 15h24v41H20Z"/><path d="M27 26h10M32 21v10M27 47h10"/>',
  tape: '<rect x="7" y="17" width="50" height="35" rx="4"/><path d="M10 12h25l7 5M14 23h36v16H14ZM20 44h24l4 8H16Z"/><circle cx="22" cy="31" r="5"/><circle cx="42" cy="31" r="5"/><path d="M27 31h10"/>',
  crowbar: '<path d="m27 57-6-2 17-36-2-8-5-1-6 5-5-2 6-9 13 1 7 12-19 40Z"/><path d="m22 50 6 3M24 55l1-4"/>',
};
export const iconSvg = (kind) => `<svg viewBox="0 0 64 64" aria-hidden="true">${BAG_ICON[kind] || ''}</svg>`;
