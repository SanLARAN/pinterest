// Items, the 6-slot pack, and the merchant's buy / sell / trade rules. Pure logic.

export const INV_SLOTS = 6;
export const SHOP_STOCK = 4;

export const ITEMS = {
  potion: {
    id: 'potion', name: 'Healing Draught', desc: 'Restores 40 HP', price: 8, color: '#e5484d', icon: 'potion',
    effect: { heal: 40 },
  },
  ether: {
    id: 'ether', name: 'Ether Vial', desc: 'Restores 60 psi energy', price: 10, color: '#8c5cf0', icon: 'vial',
    effect: { psi: 60 },
  },
  whetstone: {
    id: 'whetstone', name: 'Whetstone', desc: '+3 swing damage, permanently', price: 16, color: '#c9c9d6', icon: 'blade',
    effect: { damage: 3 },
  },
  heartfruit: {
    id: 'heartfruit', name: 'Heart Fruit', desc: '+20 max HP and heal 20', price: 18, color: '#ff7aa2', icon: 'fruit',
    effect: { maxHp: 20, heal: 20 },
  },
  feather: {
    id: 'feather', name: 'Wind Feather', desc: '+0.4 move speed, permanently', price: 14, color: '#7fe0ff', icon: 'feather',
    effect: { speed: 0.4 },
  },
  crystal: {
    id: 'crystal', name: 'Mind Crystal', desc: '+1 psi regen per second, permanently', price: 22, color: '#7ff0e0', icon: 'crystal',
    effect: { psiRegen: 1 },
  },
};

export const ITEM_IDS = Object.keys(ITEMS);

const CHAPTER_POOL = [
  { item: 'potion', weight: 5 },
  { item: 'ether', weight: 4 },
  { item: 'whetstone', weight: 2 },
  { item: 'heartfruit', weight: 2 },
  { item: 'feather', weight: 2 },
  { item: 'crystal', weight: 1.5 },
];
const BOSS_POOL = [
  { item: 'heartfruit', weight: 3 },
  { item: 'whetstone', weight: 3 },
  { item: 'crystal', weight: 3 },
  { item: 'feather', weight: 2 },
  { item: 'potion', weight: 2 },
];

/** Item dropped when a chapter is cleared. `rng.weighted` returns the item id. */
export function chapterLoot(rng) {
  return rng.weighted(CHAPTER_POOL);
}

/** Item dropped by a boss. Bosses drop three of these. */
export function bossLoot(rng) {
  return rng.weighted(BOSS_POOL);
}

export function sellPrice(id) {
  return Math.max(1, Math.floor(ITEMS[id].price / 2));
}

export class Inventory {
  constructor() {
    this.slots = new Array(INV_SLOTS).fill(null);
  }

  reset() {
    this.slots.fill(null);
  }

  hasRoom() {
    return this.slots.indexOf(null) >= 0;
  }

  /** Puts an item in the first free slot. Returns the slot index, or -1 if the pack is full. */
  add(id) {
    const i = this.slots.indexOf(null);
    if (i < 0) return -1;
    this.slots[i] = id;
    return i;
  }

  /** Removes and returns the item in a slot (null if empty). */
  take(i) {
    const id = this.slots[i] ?? null;
    this.slots[i] = null;
    return id;
  }
}

/** Fills a stock list with distinct random items (null entries are sold-out slots). */
export function makeStock(rng, count = SHOP_STOCK) {
  const pool = [...ITEM_IDS];
  const out = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(rng.next() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/** Buy stock[idx] for gold. Returns { ok, gold, msg }. */
export function buy(stock, idx, inv, gold) {
  const id = stock[idx];
  if (!id) return { ok: false, gold, msg: 'Sold out' };
  const price = ITEMS[id].price;
  if (gold < price) return { ok: false, gold, msg: `Need ${price - gold} more gold` };
  if (!inv.hasRoom()) return { ok: false, gold, msg: 'Your pack is full' };
  inv.add(id);
  stock[idx] = null;
  return { ok: true, gold: gold - price, msg: `Bought ${ITEMS[id].name}` };
}

/** Sell the item in pack slot `slot` for half its price. */
export function sell(inv, slot, gold) {
  const id = inv.slots[slot];
  if (!id) return { ok: false, gold, msg: 'Nothing to sell' };
  inv.take(slot);
  const gain = sellPrice(id);
  return { ok: true, gold: gold + gain, msg: `Sold ${ITEMS[id].name} for ${gain}` };
}

/**
 * Trade the pack item in `slot` for stock[idx]. The merchant keeps the item you give.
 * Price difference is settled in gold: you pay the gap if the stock item costs more,
 * and you receive the gap if it costs less.
 */
export function trade(stock, idx, inv, slot, gold) {
  const give = inv.slots[slot];
  const get = stock[idx];
  if (!give) return { ok: false, gold, msg: 'Select an item from your pack first' };
  if (!get) return { ok: false, gold, msg: 'Sold out' };
  const diff = ITEMS[get].price - ITEMS[give].price;
  if (gold - diff < 0) return { ok: false, gold, msg: `Need ${diff - gold} more gold` };
  inv.slots[slot] = get;
  stock[idx] = give;
  const settle = diff > 0 ? `paid ${diff}` : diff < 0 ? `received ${-diff}` : 'even trade';
  return { ok: true, gold: gold - diff, msg: `Traded for ${ITEMS[get].name} (${settle})` };
}

/**
 * Applies a consumable or permanent boost to the hero. `target` is { stats, psi, heal }.
 * Items never equip, so stats only ever grow.
 */
export function applyItem(id, target) {
  const e = ITEMS[id].effect;
  const { stats, psi, heal } = target;
  if (e.maxHp) stats.maxHp += e.maxHp;
  if (e.heal) heal(e.heal);
  if (e.psi) psi.gain(e.psi);
  if (e.damage) stats.damage += e.damage;
  if (e.speed) stats.speed += e.speed;
  if (e.psiRegen) stats.psiRegen += e.psiRegen;
}
