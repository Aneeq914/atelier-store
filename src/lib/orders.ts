import { randomInt } from "node:crypto";
import { MAX_PER_LINE, type BagLine } from "@/lib/cart";

// Order rules. Pure functions: the checkout action and the payment webhook
// call them inside database transactions with freshly locked rows.

export type OrderStatus = "pending_payment" | "paid" | "expired" | "failed";

/** How long the provider's checkout session stays open. */
export const SESSION_MINUTES = 30;
/** How long reserved stock is held. A little longer than the session, so a payment completed in its last second still finds the order pending. */
export const RESERVATION_MINUTES = SESSION_MINUTES + 2;

// No 0/O, 1/I/L: easy to read out over the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A public order number such as AT-7K3F9Q (31^6 ≈ 887 million combinations; the column is unique). */
export function generateReference() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `AT-${code}`;
}

export type StockRow = { id: number; name: string; slug: string; priceCents: number; stock: number };

export type OrderLine = {
  productId: number;
  productName: string;
  productSlug: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

/**
 * Turn the bag into order lines using rows read (and locked) inside the
 * checkout transaction. Prices come from these rows, never from the client.
 * Any shortfall refuses the whole order, so the shopper can review the bag.
 */
export function prepareOrder(bag: BagLine[], rows: StockRow[]): { lines: OrderLine[]; subtotalCents: number } | { error: string } {
  if (bag.length === 0) return { error: "Your bag is empty." };
  const byId = new Map(rows.map((row) => [row.id, row]));
  const lines: OrderLine[] = [];
  for (const { productId, quantity } of bag) {
    const row = byId.get(productId);
    if (!row) return { error: "A piece in your bag is no longer available. Please review your bag." };
    if (row.stock <= 0) return { error: `${row.name} has just sold out. Please remove it from your bag to continue.` };
    if (quantity > row.stock) return { error: `Only ${row.stock} of ${row.name} left. Please update your bag to continue.` };
    if (quantity < 1 || quantity > MAX_PER_LINE) return { error: "Please review the quantities in your bag." };
    lines.push({
      productId,
      productName: row.name,
      productSlug: row.slug,
      unitPriceCents: row.priceCents,
      quantity,
      lineTotalCents: row.priceCents * quantity,
    });
  }
  return { lines, subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0) };
}

/** A verified payment event, normalised from the provider's format. */
export type PaymentEvent = {
  id: string;
  type: "checkout.session.completed" | "checkout.session.expired" | (string & {});
  sessionId: string;
  paymentStatus?: "paid" | "unpaid";
  amountTotal?: number;
  currency?: string;
  reference?: string;
};

export type Transition =
  | { change: false; reason: string }
  | { change: true; status: OrderStatus; releaseStock: boolean; markPaid: boolean; reason: string };

/**
 * What a payment event does to an order. Only `pending_payment` orders move,
 * so duplicate, late or out-of-order events change nothing. Paid requires the
 * provider's amount and currency to match what we charged.
 */
export function transitionOrder(
  order: { status: OrderStatus; totalCents: number; currency: string; reference: string },
  event: PaymentEvent,
): Transition {
  if (order.status !== "pending_payment") return { change: false, reason: `order already ${order.status}` };
  if (event.reference && event.reference !== order.reference) return { change: false, reason: "reference mismatch" };

  if (event.type === "checkout.session.completed") {
    if (event.paymentStatus !== "paid") return { change: false, reason: "session completed but not paid" };
    if (event.amountTotal !== order.totalCents || event.currency !== order.currency) {
      // Money may have moved for the wrong amount: don't mark paid, don't release
      // the stock automatically; flag it for a person to review.
      return { change: true, status: "failed", releaseStock: false, markPaid: false, reason: "amount or currency mismatch" };
    }
    return { change: true, status: "paid", releaseStock: false, markPaid: true, reason: "payment confirmed" };
  }
  if (event.type === "checkout.session.expired") {
    return { change: true, status: "expired", releaseStock: true, markPaid: false, reason: "checkout expired" };
  }
  return { change: false, reason: `ignored event type ${event.type}` };
}
