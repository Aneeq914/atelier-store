import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";
import { mockCheckoutSessions } from "@/db/schema";
import type { PaymentEvent } from "@/lib/orders";
import type { PaymentProvider } from "@/lib/payments/provider";
import { SIGNATURE_HEADER, signPayload, verifySignature } from "@/lib/payments/signature";
import { assertMockAllowed } from "@/lib/payments/guard";
import { appUrl, WEBHOOK_PATH } from "@/lib/payments/urls";

// A Stripe-shaped mock provider for development and tests. It has its own
// "database" (mock_checkout_sessions), a hosted payment page
// (/mock-checkout/[id]) and sends signed webhooks to /api/webhooks/payments,
// after the browser has been redirected, like Stripe. No money moves.
// It refuses to run in production (see ./guard.ts).


function webhookSecret() {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) throw new Error("PAYMENT_WEBHOOK_SECRET is not set (32+ characters).");
  return secret;
}

export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
} as const;

type SessionRow = typeof mockCheckoutSessions.$inferSelect;

/** The event the mock sends, in Stripe's shape. */
function buildEvent(type: "checkout.session.completed" | "checkout.session.expired", session: SessionRow) {
  return {
    id: `evt_mock_${randomBytes(12).toString("hex")}`,
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: session.id,
        object: "checkout.session",
        status: session.status,
        payment_status: session.paymentStatus,
        amount_total: session.amountTotal,
        currency: session.currency,
        metadata: session.metadata,
      },
    },
  };
}

/** Deliver the event after the response is sent, like a real provider (asynchronous to the redirect). */
export function sendAfterResponse(event: ReturnType<typeof buildEvent>) {
  after(() => deliverEvent(event, appUrl(WEBHOOK_PATH)));
}

/** POST a signed event to our webhook, retrying like a provider would (1s, 2s, 4s). */
export async function deliverEvent(event: ReturnType<typeof buildEvent>, endpoint: string) {
  const body = JSON.stringify(event);
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", [SIGNATURE_HEADER]: signPayload(body, webhookSecret()) },
        body,
      });
      if (response.ok) return true;
      console.error(`[mock-pay] webhook ${event.type} got ${response.status} (attempt ${attempt + 1})`);
      if (response.status >= 400 && response.status < 500) return false; // a 4xx won't fix itself
    } catch (error) {
      console.error(`[mock-pay] webhook ${event.type} failed (attempt ${attempt + 1})`, error);
    }
  }
  return false;
}

/** The provider's session record, plus whether it can still be paid. */
export async function getMockSession(id: string) {
  assertMockAllowed();
  const [session] = await db.select().from(mockCheckoutSessions).where(eq(mockCheckoutSessions.id, id));
  if (!session) return null;
  const expired = session.status === "expired" || (session.status === "open" && session.expiresAt.getTime() <= Date.now());
  return { ...session, expired };
}

/** Mark an open session expired; returns the expired event to send, or null if it wasn't open. */
export async function expireMockSession(id: string) {
  assertMockAllowed();
  const [session] = await db
    .update(mockCheckoutSessions)
    .set({ status: "expired" })
    .where(and(eq(mockCheckoutSessions.id, id), eq(mockCheckoutSessions.status, "open")))
    .returning();
  return session ? buildEvent("checkout.session.expired", session) : null;
}

/** Pay an open session with a test card. Returns the completed event, or a decline message. */
export async function payMockSession(id: string, card: string) {
  assertMockAllowed();
  const session = await getMockSession(id);
  if (!session || session.status !== "open") return { error: "This checkout is no longer open." } as const;
  if (session.expiresAt.getTime() <= Date.now()) {
    const expired = await expireMockSession(id);
    return { error: "This checkout has expired.", event: expired } as const;
  }
  if (card.replaceAll(" ", "") !== TEST_CARDS.success.replaceAll(" ", "")) {
    await db.update(mockCheckoutSessions).set({ lastError: "Your card was declined. Try another card." }).where(eq(mockCheckoutSessions.id, id));
    return { error: "declined" } as const;
  }
  const [paid] = await db
    .update(mockCheckoutSessions)
    .set({ status: "complete", paymentStatus: "paid", lastError: null })
    .where(and(eq(mockCheckoutSessions.id, id), eq(mockCheckoutSessions.status, "open")))
    .returning();
  if (!paid) return { error: "This checkout is no longer open." } as const;
  return { event: buildEvent("checkout.session.completed", paid), successUrl: paid.successUrl.replace("{CHECKOUT_SESSION_ID}", paid.id) } as const;
}

export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckoutSession(input) {
    assertMockAllowed();
    webhookSecret(); // fail before creating anything if webhooks can't be signed
    const id = `cs_mock_${randomBytes(12).toString("hex")}`;
    await db.insert(mockCheckoutSessions).values({
      id,
      amountTotal: input.amountTotal,
      currency: input.currency,
      lineItems: input.lines,
      metadata: { reference: input.reference, customer_email: input.customerEmail },
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      expiresAt: input.expiresAt,
    });
    return { id, url: `/mock-checkout/${id}` };
  },

  async expireSession(sessionId) {
    const event = await expireMockSession(sessionId);
    if (event) sendAfterResponse(event);
  },

  verifyWebhook(rawBody, headers) {
    if (!verifySignature(rawBody, headers.get(SIGNATURE_HEADER), webhookSecret())) return null;
    try {
      const event = JSON.parse(rawBody);
      const session = event?.data?.object ?? {};
      if (typeof event.id !== "string" || typeof event.type !== "string" || typeof session.id !== "string") return null;
      return {
        id: event.id,
        type: event.type,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        reference: session.metadata?.reference,
      } satisfies PaymentEvent;
    } catch {
      return null;
    }
  },
};
