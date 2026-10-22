// A stand-in for a system that a map does not have.
//
// The forest has a forestry yard with a gate and a УАЗ, a fire tower with binoculars, and one flashlight lying
// out there each night. The peat bog has none of those things, and every one of those systems reads its
// coordinates out of the map while it is being built. Rather than guard thirty call sites, the game hands
// itself an object with the same methods that does nothing: the shift runs, and the parts of it that belong to
// the forest are simply not there.
//
// `defaults` is for the few members whose *return value* is used as if it were data (the seat list, the seat
// index, whether you are standing on the tower).
//
// (3.0i) A getter cannot be left to the prototype. It reads fields that the constructor never ran and never
// set, and a getter written as `return this.tower !== null` then answers **true** on a stand-in that has no
// `tower` at all — which is exactly what happened: on the bog `expedition.onTower` was true, the game handed
// the whole player controller to the "seated on the lookout" branch, and you could look around but not walk.
// So accessors are shadowed on the object itself: with their default if one is given, otherwise with false
// (a missing system is missing, not true).
export function inert(Ctor, game, defaults = {}) {
  const obj = Object.create(Ctor.prototype);
  obj.g = game;
  obj.inert = true;
  for (const name of Object.getOwnPropertyNames(Ctor.prototype)) {
    if (name === 'constructor') continue;
    const desc = Object.getOwnPropertyDescriptor(Ctor.prototype, name);
    if (!desc) continue;
    if (typeof desc.value === 'function') {
      obj[name] = defaults[name] || (() => undefined);
      continue;
    }
    if (desc.get || desc.set) {
      const v = name in defaults ? defaults[name] : false;
      Object.defineProperty(obj, name, { value: v, writable: true, configurable: true, enumerable: false });
    }
  }
  for (const [k, v] of Object.entries(defaults)) if (!(k in obj)) obj[k] = v;
  return obj;
}
