import assert from "node:assert/strict";
import { test } from "node:test";
import { addLine, MAX_LINES, MAX_PER_LINE, parseBag, reconcileBag, removeLine, serializeBag, setLineQuantity } from "./cart";

test("parseBag reads good input and round-trips", () => {
  const lines = parseBag("12:1,7:2");
  assert.deepEqual(lines, [{ productId: 12, quantity: 1 }, { productId: 7, quantity: 2 }]);
  assert.equal(serializeBag(lines), "12:1,7:2");
  assert.deepEqual(parseBag(undefined), []);
  assert.deepEqual(parseBag(""), []);
});

test("parseBag ignores tampered parts, merges duplicates and caps size", () => {
  assert.deepEqual(parseBag("garbage,7:-1,0:3,8:0,9:1.5,abc:2,5:2,5:3, 6:1 "), [
    { productId: 5, quantity: 5 },
    { productId: 6, quantity: 1 },
  ]);
  assert.deepEqual(parseBag("7:999"), [{ productId: 7, quantity: MAX_PER_LINE }]);
  const many = Array.from({ length: MAX_LINES + 20 }, (_, i) => `${i + 1}:1`).join(",");
  assert.equal(parseBag(many).length, MAX_LINES);
});

test("addLine adds, merges and never exceeds stock", () => {
  let change = addLine([], 7, 2);
  assert.deepEqual(change.lines, [{ productId: 7, quantity: 1 }]);
  assert.equal(change.error, undefined);
  change = addLine(change.lines, 7, 2);
  assert.deepEqual(change.lines, [{ productId: 7, quantity: 2 }]);
  change = addLine(change.lines, 7, 2);
  assert.deepEqual(change.lines, [{ productId: 7, quantity: 2 }], "third add stays at stock");
  assert.equal(change.error, "Only 2 available, and they're all in your bag.");
  assert.equal(addLine([{ productId: 3, quantity: 1 }], 3, 1).error, "Only 1 available, and it's already in your bag.");
});

test("addLine rejects sold-out products and respects the per-line cap", () => {
  const soldOut = addLine([{ productId: 1, quantity: 1 }], 9, 0);
  assert.equal(soldOut.error, "This piece is sold out.");
  assert.deepEqual(soldOut.lines, [{ productId: 1, quantity: 1 }], "bag unchanged");
  const capped = addLine([{ productId: 4, quantity: MAX_PER_LINE }], 4, 30);
  assert.equal(capped.error, `You can have up to ${MAX_PER_LINE} of each piece.`);
  assert.equal(capped.lines[0].quantity, MAX_PER_LINE);
});

test("addLine clamps a bag line that is already above stock", () => {
  const change = addLine([{ productId: 7, quantity: 5 }], 7, 2);
  assert.deepEqual(change.lines, [{ productId: 7, quantity: 2 }]);
  assert.ok(change.error);
});

test("addLine refuses a new product when the bag is full", () => {
  const full = Array.from({ length: MAX_LINES }, (_, i) => ({ productId: i + 1, quantity: 1 }));
  assert.match(addLine(full, 999, 5).error ?? "", /bag is full/);
  assert.equal(addLine(full, 1, 5).error, undefined, "existing product can still go up");
});

test("setLineQuantity clamps, removes at 0, and ignores products not in the bag", () => {
  const bag = [{ productId: 7, quantity: 1 }];
  const clamped = setLineQuantity(bag, 7, 2, 999);
  assert.deepEqual(clamped.lines, [{ productId: 7, quantity: 2 }]);
  assert.equal(clamped.notice, "Only 2 available, and they're all in your bag.");
  assert.deepEqual(setLineQuantity(bag, 7, 2, 0).lines, []);
  assert.deepEqual(setLineQuantity(bag, 7, 2, -3).lines, []);
  assert.deepEqual(setLineQuantity(bag, 8, 5, 2).lines, bag);
  const soldOut = setLineQuantity(bag, 7, 0, 1);
  assert.deepEqual(soldOut.lines, []);
  assert.match(soldOut.notice ?? "", /sold out/);
});

test("removeLine removes only that product", () => {
  assert.deepEqual(removeLine([{ productId: 1, quantity: 1 }, { productId: 2, quantity: 3 }], 1), [{ productId: 2, quantity: 3 }]);
});

test("reconcileBag uses current prices and stock, never the cookie", () => {
  const products = [
    { id: 1, price: 98000, stock: 12 }, // loafer
    { id: 2, price: 115000, stock: 1 }, // stock fell from 2 to 1
    { id: 3, price: 145000, stock: 0 }, // sold out
  ];
  const bag = reconcileBag(
    [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 2 },
      { productId: 3, quantity: 1 },
      { productId: 99, quantity: 1 }, // unknown: dropped
    ],
    products,
  );
  assert.deepEqual(
    bag.items.map((item) => [item.product.id, item.quantity, item.requested, item.status, item.lineTotal, item.max]),
    [
      [1, 2, 2, "ok", 196000, 10],
      [2, 1, 2, "reduced", 115000, 1],
      [3, 0, 1, "sold_out", 0, 0],
    ],
  );
  assert.equal(bag.subtotal, 196000 + 115000, "integer cents; sold-out not charged");
  assert.equal(bag.count, 3);
});

test("reconcileBag on an empty bag", () => {
  assert.deepEqual(reconcileBag([], []), { items: [], subtotal: 0, count: 0 });
});
