import "server-only";
import type { PaymentEvent } from "@/lib/orders";
import { mockProvider } from "@/lib/payments/mock";

// The payment provider boundary. Checkout and the webhook only talk to this
// interface; swapping the mock for Stripe means adding a `stripe.ts` with the
// same three methods (checkout.sessions.create with price_data from our order
// lines, checkout.sessions.expire, webhooks.constructEvent).

export type CheckoutLine = { name: string; unitAmount: number; quantity: number };

export type CreateCheckoutSessionInput = {
  reference: string;
  lines: CheckoutLine[];
  /** In cents. Always the order total computed from our database. */
  amountTotal: number;
  currency: string;
  customerEmail: string;
  /** May contain {CHECKOUT_SESSION_ID}, replaced by the provider (Stripe convention). */
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<{ id: string; url: string }>;
  /** Close an open session (cancel or abandoned); the provider then sends an expired event. */
  expireSession(sessionId: string): Promise<void>;
  /** The event, if the signature is valid and recent; otherwise null. */
  verifyWebhook(rawBody: string, headers: Headers): PaymentEvent | null;
}

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  if (name === "mock") return mockProvider;
  throw new Error(`Unknown PAYMENT_PROVIDER "${name}". Only "mock" is available until Stripe is added.`);
}
