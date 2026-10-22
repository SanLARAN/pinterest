// A stand-in for a system that a map does not have.
//
// The forest has a forestry yard with a gate and a УАЗ, a fire tower with binoculars, and one flashlight lying
// out there each night. The peat bog has none of those things, and every one of those systems reads its
// coordinates out of the map while it is being built. Rather than guard thirty call sites, the game hands
// itself an object with the same methods that does nothing: the shift runs, and the parts of it that belong to
// the forest are simply not there.
//
// `defaults` is for the few methods whose *return value* is used as if it were data (the seat list, the seat
// index): a no-op returning undefined would be a shape the caller has to know about.
export function inert(Ctor, game, defaults = {}) {
  const obj = Object.create(Ctor.prototype);
  obj.g = game;
  obj.inert = true;
  for (const name of Object.getOwnPropertyNames(Ctor.prototype)) {
    if (name === 'constructor') continue;
    const desc = Object.getOwnPropertyDescriptor(Ctor.prototype, name);
    if (!desc || typeof desc.value !== 'function') continue; // getters keep their prototype behaviour
    obj[name] = defaults[name] || (() => undefined);
  }
  for (const [k, v] of Object.entries(defaults)) if (!(k in obj)) obj[k] = v;
  return obj;
}
