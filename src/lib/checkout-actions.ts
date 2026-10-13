"use server";

import { redirect } from "next/navigation";
import { attachProviderSession, failPendingOrder, startOrder } from "@/db/queries/orders";
import { readBag } from "@/lib/bag-cookie";
import { SESSION_MINUTES } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments/provider";
import { appUrl } from "@/lib/payments/urls";
import { BAG_HREF } from "@/lib/routes";
import { requireUser } from "@/lib/session";

// Start checkout. The client sends nothing but the click: the bag comes from
// the cookie (ids and quantities), prices and stock from the database, inside
// a transaction that reserves the stock and creates the pending order. The
// provider is told the amount; it never decides it.

export type CheckoutState = { error?: string };

export async function startCheckoutAction(): Promise<CheckoutState> {
  const { user } = await requireUser(BAG_HREF);
  const bag = await readBag();
  if (bag.length === 0) return { error: "Your bag is empty." };

  const provider = getPaymentProvider();
  let started: Awaited<ReturnType<typeof startOrder>>;
  try {
    started = await startOrder({ userId: user.id, bag, provider: provider.name });
  } catch (error) {
    console.error("[checkout] couldn't create the order", error);
    return { error: "We couldn't start checkout. Nothing was charged. Please try again." };
  }

  // Close provider sessions for reservations we just released, so they can't be paid.
  for (const sessionId of started.staleSessions) {
    await provider.expireSession(sessionId).catch((error) => console.error("[checkout] couldn't expire session", sessionId, error));
  }

  if ("error" in started) return { error: started.error };
  const { order } = started;

  let url: string;
  try {
    const session = await provider.createCheckoutSession({
      reference: order.reference,
      lines: order.lines.map((line) => ({ name: line.productName, unitAmount: line.unitPriceCents, quantity: line.quantity })),
      amountTotal: order.totalCents,
      currency: order.currency,
      customerEmail: user.email,
      successUrl: appUrl("/checkout/return?session_id={CHECKOUT_SESSION_ID}"),
      cancelUrl: appUrl(`/checkout/cancel?order=${order.reference}`),
      expiresAt: new Date(Date.now() + SESSION_MINUTES * 60_000),
    });
    await attachProviderSession(order.orderId, session.id);
    url = session.url;
  } catch (error) {
    console.error("[checkout] couldn't create the payment session", error);
    await failPendingOrder(order.orderId);
    return { error: "We couldn't start the payment. Nothing was charged. Please try again." };
  }
  redirect(url);
}
