import { applyPaymentEvent } from "@/db/queries/orders";
import { getPaymentProvider } from "@/lib/payments/provider";

// Payment webhooks: the ONLY way an order becomes paid.
// 1. Verify the signature over the raw body (400, nothing touched, if invalid).
// 2. Apply the event once (duplicates are recorded and skipped) in a transaction.
// 3. 200 when handled, 500 on an unexpected error so the provider retries.

export async function POST(request: Request) {
  const rawBody = await request.text();
  const event = getPaymentProvider().verifyWebhook(rawBody, request.headers);
  if (!event) return Response.json({ error: "invalid signature" }, { status: 400 });

  try {
    const result = await applyPaymentEvent(event);
    if (result.outcome === "ignored" && event.type === "checkout.session.completed" && event.paymentStatus === "paid" && result.status !== "paid") {
      // Money moved for an order that's no longer waiting for it (e.g. expired).
      // Needs a person: refund or fulfil by hand.
      console.error(`[payments] PAID EVENT FOR ${result.status.toUpperCase()} ORDER ${result.reference}: needs review (refund or fulfil)`, event.id);
    } else if (result.outcome === "unknown_session") {
      console.warn("[payments] event for an unknown session", event.id, event.sessionId);
    }
    return Response.json({ received: true, outcome: result.outcome });
  } catch (error) {
    console.error("[payments] webhook processing failed", event.id, error);
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
