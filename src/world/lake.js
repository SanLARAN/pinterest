// Flood the connected basin on the *rendered terrain triangles*, then clip its surface
// a little way under the bank. A disc or radial spokes can leave open chords across the shore.
export function lakeSurface(terrain, lake, level) {
  const n = terrain.n, cell = terrain.cell, half = terrain.half, limit = lake.r * 3;
  const threshold = level + 0.4;
  const i0 = Math.max(0, Math.floor((lake.x - limit + half) / cell));
  const i1 = Math.min(n - 1, Math.floor((lake.x + limit + half) / cell));
  const j0 = Math.max(0, Math.floor((lake.z - limit + half) / cell));
  const j1 = Math.min(n - 1, Math.floor((lake.z + limit + half) / cell));
  const vertex = (i, j) => ({ x: i * cell - half, z: j * cell - half, h: terrain.h(i, j) });
  const triangle = (i, j, s) => s
    ? [vertex(i, j), vertex(i + 1, j + 1), vertex(i + 1, j)]
    : [vertex(i, j), vertex(i, j + 1), vertex(i + 1, j + 1)];
  const key = (i, j, s) => (j * n + i) * 2 + s;
  const seen = new Set(), queue = [], triangles = [], bank = [];
  function add(i, j, s) {
    if (i < i0 || i > i1 || j < j0 || j > j1) return;
    const id = key(i, j, s);
    if (seen.has(id)) return;
    seen.add(id); queue.push([i, j, s]);
  }
  const cx = (lake.x + half) / cell, cz = (lake.z + half) / cell;
  add(Math.floor(cx), Math.floor(cz), cz % 1 > cx % 1 ? 0 : 1);
  let meshR = 0;
  for (let at = 0; at < queue.length; at++) {
    const [i, j, s] = queue[at], input = triangle(i, j, s), poly = [];
    const neighbours = s ? [[i, j, 0], [i + 1, j, 0], [i, j - 1, 0]]
      : [[i - 1, j, 1], [i, j + 1, 1], [i, j, 1]];
    for (let k = 0; k < 3; k++) {
      const a = input[k], b = input[(k + 1) % 3], insideA = a.h <= threshold, insideB = b.h <= threshold;
      if (insideA) poly.push(a);
      if (insideA !== insideB) {
        const u = (threshold - a.h) / (b.h - a.h);
        poly.push({ x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: threshold });
      }
      if (insideA || insideB) add(...neighbours[k]);
    }
    if (poly.length < 3) continue;
    for (const p of poly) meshR = Math.max(meshR, Math.hypot(p.x - lake.x, p.z - lake.z));
    for (let k = 1; k < poly.length - 1; k++) {
      triangles.push({ p: [poly[0], poly[k], poly[k + 1]].map(p => [p.x, level, p.z]),
        hide: poly.length === 3 && input.every(p => p.h <= threshold) ? (s ? 1 : 4) : 0 });
    }
    // Only the clipped outer edge is the shoreline; internal grid edges are shared exactly.
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k], b = poly[(k + 1) % poly.length];
      if (Math.abs(a.h - threshold) < 1e-6 && Math.abs(b.h - threshold) < 1e-6)
        bank.push([a.x, a.z, b.x, b.z]);
    }
  }
  return {
    triangles, bank, meshR,
    contains(x, z) {
      const gx = (x + half) / cell, gz = (z + half) / cell, i = Math.floor(gx), j = Math.floor(gz);
      if (i < i0 || i > i1 || j < j0 || j > j1) return false;
      return seen.has(key(i, j, gz - j > gx - i ? 0 : 1)) && terrain.height(x, z) <= threshold;
    },
  };
}
