import assert from "node:assert/strict";
import { test } from "node:test";
import { generateReference, prepareOrder, transitionOrder, type PaymentEvent } from "./orders";

test("generateReference makes readable, unique-looking order numbers", () => {
  const refs = new Set(Array.from({ length: 2000 }, generateReference));
  for (const ref of refs) assert.match(ref, /^AT-[2-9A-HJKMNP-Z]{6}$/);
  assert.equal(refs.size, 2000, "no collisions in a sample");
});

const rows = [
  { id: 1, name: "Bar loafer", slug: "bar-loafer", priceCents: 98000, stock: 12 },
  { id: 2, name: "Platform mule", slug: "platform-mule", priceCents: 115000, stock: 2 },
  { id: 4, name: "Canvas tote", slug: "canvas-tote", priceCents: 145000, stock: 0 },
];

test("prepareOrder builds lines with database prices and an integer-cent subtotal", () => {
  const result = prepareOrder(
    [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 2 },
    ],
    rows,
  );
  assert.ok("lines" in result);
  assert.deepEqual(
    result.lines.map((l) => [l.productId, l.productName, l.unitPriceCents, l.quantity, l.lineTotalCents]),
    [
      [1, "Bar loafer", 98000, 1, 98000],
      [2, "Platform mule", 115000, 2, 230000],
    ],
  );
  assert.equal(result.subtotalCents, 328000);
});

test("prepareOrder refuses the whole order on any shortfall", () => {
  assert.deepEqual(prepareOrder([], rows), { error: "Your bag is empty." });
  assert.match((prepareOrder([{ productId: 2, quantity: 3 }], rows) as { error: string }).error, /Only 2 of Platform mule left/);
  assert.match((prepareOrder([{ productId: 4, quantity: 1 }], rows) as { error: string }).error, /sold out/);
  assert.match((prepareOrder([{ productId: 1, quantity: 1 }, { productId: 99, quantity: 1 }], rows) as { error: string }).error, /no longer available/);
  assert.match((prepareOrder([{ productId: 1, quantity: 11 }], rows) as { error: string }).error, /quantities/);
});

const pending = { status: "pending_payment" as const, totalCents: 328000, currency: "usd", reference: "AT-ABC234" };
const completed: PaymentEvent = {
  id: "evt_1",
  type: "checkout.session.completed",
  sessionId: "cs_1",
  paymentStatus: "paid",
  amountTotal: 328000,
  currency: "usd",
  reference: "AT-ABC234",
};

test("a paid completion with matching amount marks the order paid", () => {
  assert.deepEqual(transitionOrder(pending, completed), {
    change: true,
    status: "paid",
    releaseStock: false,
    markPaid: true,
    reason: "payment confirmed",
  });
});

test("an amount or currency mismatch is never marked paid", () => {
  for (const event of [{ ...completed, amountTotal: 100 }, { ...completed, currency: "eur" }]) {
    const t = transitionOrder(pending, event);
    assert.ok(t.change && t.status === "failed" && !t.markPaid && !t.releaseStock);
  }
});

test("expiry releases stock; unpaid completions and unknown types do nothing", () => {
  assert.deepEqual(transitionOrder(pending, { ...completed, type: "checkout.session.expired" }), {
    change: true,
    status: "expired",
    releaseStock: true,
    markPaid: false,
    reason: "checkout expired",
  });
  assert.equal(transitionOrder(pending, { ...completed, paymentStatus: "unpaid" }).change, false);
  assert.equal(transitionOrder(pending, { ...completed, type: "charge.refunded" }).change, false);
  assert.equal(transitionOrder(pending, { ...completed, reference: "AT-OTHER2" }).change, false);
});

test("only pending orders move: duplicates and late events are harmless", () => {
  assert.equal(transitionOrder({ ...pending, status: "paid" }, completed).change, false, "duplicate completion");
  assert.equal(transitionOrder({ ...pending, status: "paid" }, { ...completed, type: "checkout.session.expired" }).change, false, "expiry after paid");
  assert.equal(transitionOrder({ ...pending, status: "expired" }, completed).change, false, "payment after expiry");
});
