import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Inventory, ITEMS, INV_SLOTS, buy, sell, trade, sellPrice, makeStock, chapterLoot, bossLoot } from '../src/sim/items.js';
import { createRng } from '../src/util/rng.js';

test('inventory: six slots, fills in order, refuses a seventh item', () => {
  const inv = new Inventory();
  assert.equal(inv.slots.length, INV_SLOTS);
  assert.equal(INV_SLOTS, 6);
  for (let i = 0; i < 6; i++) assert.equal(inv.add('potion'), i);
  assert.equal(inv.hasRoom(), false);
  assert.equal(inv.add('ether'), -1);
});

test('inventory: taking an item frees its slot', () => {
  const inv = new Inventory();
  inv.add('potion');
  inv.add('ether');
  assert.equal(inv.take(0), 'potion');
  assert.equal(inv.slots[0], null);
  assert.equal(inv.add('crystal'), 0, 'the freed slot is reused first');
});

test('shop: buying spends gold, takes the stock item, and needs room and gold', () => {
  const inv = new Inventory();
  const stock = ['potion', 'crystal'];
  const r = buy(stock, 0, inv, 20);
  assert.equal(r.ok, true);
  assert.equal(r.gold, 20 - ITEMS.potion.price);
  assert.equal(stock[0], null, 'bought item leaves the stock');
  assert.equal(inv.slots[0], 'potion');
  assert.equal(buy(stock, 0, inv, 99).ok, false, 'sold out');
  assert.equal(buy(stock, 1, inv, 0).ok, false, 'not enough gold');
  for (let i = 0; i < 5; i++) inv.add('potion');
  assert.equal(buy(stock, 1, inv, 99).ok, false, 'pack full');
});

test('shop: selling pays half price (at least 1) and frees the slot', () => {
  const inv = new Inventory();
  inv.add('crystal');
  const r = sell(inv, 0, 3);
  assert.equal(r.ok, true);
  assert.equal(r.gold, 3 + sellPrice('crystal'));
  assert.equal(inv.slots[0], null);
  assert.equal(sell(inv, 0, 3).ok, false, 'empty slot cannot be sold');
  assert.ok(sellPrice('potion') >= 1);
});

test('shop: trade swaps items and settles the price gap in gold', () => {
  const inv = new Inventory();
  inv.add('potion'); // cheap item in slot 0
  const stock = ['crystal']; // expensive item
  const diff = ITEMS.crystal.price - ITEMS.potion.price;
  const broke = trade(stock, 0, inv, 0, 0);
  assert.equal(broke.ok, false, 'cannot pay the gap with no gold');
  const r = trade(stock, 0, inv, 0, diff + 5);
  assert.equal(r.ok, true);
  assert.equal(r.gold, 5, 'paid the gap');
  assert.equal(inv.slots[0], 'crystal');
  assert.equal(stock[0], 'potion', 'merchant keeps the traded item');
});

test('shop: trading a dearer item for a cheaper one refunds the gap', () => {
  const inv = new Inventory();
  inv.add('crystal');
  const stock = ['potion'];
  const r = trade(stock, 0, inv, 0, 0);
  assert.equal(r.ok, true);
  assert.equal(r.gold, ITEMS.crystal.price - ITEMS.potion.price);
});

test('shop: trade needs a selected pack item', () => {
  const inv = new Inventory();
  assert.equal(trade(['potion'], 0, inv, 0, 99).ok, false);
});

test('shop: stock is distinct and drawn from known items', () => {
  const rng = createRng(77);
  const stock = makeStock(rng, 4);
  assert.equal(stock.length, 4);
  assert.equal(new Set(stock).size, 4);
  for (const id of stock) assert.ok(ITEMS[id]);
});

test('loot: chapter and boss drops are always known items', () => {
  const rng = createRng(5);
  for (let i = 0; i < 200; i++) {
    assert.ok(ITEMS[chapterLoot(rng)]);
    assert.ok(ITEMS[bossLoot(rng)]);
  }
});
