import "server-only";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, paymentEvents, products, productStock } from "@/db/schema";
import { txDb, type Tx } from "@/db/tx";
import type { BagLine } from "@/lib/cart";
import { generateReference, prepareOrder, RESERVATION_MINUTES, transitionOrder, type PaymentEvent } from "@/lib/orders";

// Order reads (HTTP driver) and the all-or-nothing writes (transaction driver).
// Stock is reserved when checkout starts and given back exactly once: every
// release goes through a status change away from pending_payment.

/** A customer's own order with its lines, or null (also for someone else's order). */
export async function getOrderForUser(reference: string, userId: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.reference, reference), eq(orders.userId, userId)),
    with: { items: { orderBy: [asc(orderItems.id)] } },
  });
  return order ?? null;
}

export async function getOrderBySessionId(sessionId: string) {
  return (await db.query.orders.findFirst({ where: eq(orders.providerSessionId, sessionId) })) ?? null;
}

/** Put an order's reserved stock back. Call only after moving the order out of pending_payment. */
async function restock(tx: Tx, orderId: number) {
  const items = await tx
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (item.productId === null) continue; // product deleted since
    await tx
      .update(productStock)
      .set({ quantity: sql`${productStock.quantity} + ${item.quantity}` })
      .where(eq(productStock.productId, item.productId));
  }
}

/** Expire pending orders matching `where` and give their stock back. Returns their provider session ids. */
async function expirePending(tx: Tx, where: ReturnType<typeof and>) {
  const stale = await tx
    .select({ id: orders.id, sessionId: orders.providerSessionId })
    .from(orders)
    .where(and(eq(orders.status, "pending_payment"), where))
    .for("update", { skipLocked: true });
  for (const order of stale) {
    await tx.update(orders).set({ status: "expired" }).where(eq(orders.id, order.id));
    await restock(tx, order.id);
  }
  return stale.map((order) => order.sessionId).filter((id): id is string => id !== null);
}

/**
 * Start checkout: in one transaction, release overdue reservations and this
 * shopper's previous unfinished checkout, lock the stock rows, check every
 * line, reserve the stock and create the pending order with database prices.
 * Returns the order, or the reason it couldn't be created.
 */
export async function startOrder(input: { userId: string; bag: BagLine[]; provider: string }) {
  return txDb.transaction(async (tx) => {
    // Safety net for missed expiry webhooks, and one open checkout per shopper
    // (stops repeated clicks from tying up stock).
    const overdueSessions = await expirePending(tx, lt(orders.expiresAt, new Date()));
    const previousSessions = await expirePending(tx, eq(orders.userId, input.userId));

    const ids = [...new Set(input.bag.map((line) => line.productId))].sort((a, b) => a - b);
    const rows = ids.length
      ? await tx
          .select({ id: products.id, name: products.name, slug: products.slug, priceCents: products.priceCents, stock: productStock.quantity })
          .from(products)
          .innerJoin(productStock, eq(productStock.productId, products.id))
          .where(inArray(products.id, ids))
          .orderBy(asc(products.id)) // consistent lock order avoids deadlocks
          .for("update", { of: productStock })
      : [];

    const prepared = prepareOrder(input.bag, rows);
    if ("error" in prepared) return { error: prepared.error, staleSessions: [...overdueSessions, ...previousSessions] };

    for (const line of prepared.lines) {
      await tx
        .update(productStock)
        .set({ quantity: sql`${productStock.quantity} - ${line.quantity}` })
        .where(eq(productStock.productId, line.productId));
    }

    const reference = generateReference();
    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        userId: input.userId,
        status: "pending_payment",
        subtotalCents: prepared.subtotalCents,
        totalCents: prepared.subtotalCents,
        currency: "usd",
        paymentProvider: input.provider,
        expiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60_000),
      })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values(prepared.lines.map((line) => ({ ...line, orderId: order.id })));

    return {
      order: { orderId: order.id, reference, totalCents: prepared.subtotalCents, currency: "usd", lines: prepared.lines },
      staleSessions: [...overdueSessions, ...previousSessions],
    };
  });
}

export async function attachProviderSession(orderId: number, sessionId: string) {
  await db.update(orders).set({ providerSessionId: sessionId }).where(eq(orders.id, orderId));
}

/** The provider couldn't start a session: fail the order and give the stock back. */
export async function failPendingOrder(orderId: number) {
  await txDb.transaction(async (tx) => {
    const [locked] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).for("update");
    if (locked?.status !== "pending_payment") return;
    await tx.update(orders).set({ status: "failed" }).where(eq(orders.id, orderId));
    await restock(tx, orderId);
  });
}

export type WebhookResult =
  | { outcome: "duplicate" }
  | { outcome: "unknown_session" }
  | { outcome: "applied" | "ignored"; reference: string; status: string; reason: string };

/**
 * Apply a verified payment event exactly once. The event id is recorded in
 * the same transaction as the order change: a repeated delivery finds it and
 * does nothing; if anything fails, both roll back and the provider retries.
 */
export async function applyPaymentEvent(event: PaymentEvent): Promise<WebhookResult> {
  return txDb.transaction(async (tx) => {
    const recorded = await tx
      .insert(paymentEvents)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: paymentEvents.id });
    if (recorded.length === 0) return { outcome: "duplicate" };

    const [order] = await tx
      .select({ id: orders.id, reference: orders.reference, status: orders.status, totalCents: orders.totalCents, currency: orders.currency })
      .from(orders)
      .where(eq(orders.providerSessionId, event.sessionId))
      .for("update");
    if (!order) return { outcome: "unknown_session" };
    await tx.update(paymentEvents).set({ orderId: order.id }).where(eq(paymentEvents.id, event.id));

    const transition = transitionOrder(order, event);
    if (!transition.change) return { outcome: "ignored", reference: order.reference, status: order.status, reason: transition.reason };

    await tx
      .update(orders)
      .set({ status: transition.status, ...(transition.markPaid ? { paidAt: new Date() } : {}) })
      .where(eq(orders.id, order.id));
    if (transition.releaseStock) await restock(tx, order.id);
    return { outcome: "applied", reference: order.reference, status: transition.status, reason: transition.reason };
  });
}
