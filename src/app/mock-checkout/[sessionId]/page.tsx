import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getMockSession, TEST_CARDS } from "@/lib/payments/mock";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };

// The mock provider's hosted payment page (stands in for checkout.stripe.com).
// Reads the provider's own session record, not our orders.
export const instant = false;

export default async function MockCheckoutPage({ params }: PageProps<"/mock-checkout/[sessionId]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { sessionId } = await params;
  const session = await getMockSession(sessionId);
  if (!session) notFound();

  const { expired } = session;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <div className="type-caption-strong bg-black px-gutter py-2 text-center text-white">
        Test payment page: no real card is charged and no money moves
      </div>
      <main className="flex flex-1 items-start justify-center px-gutter py-12">
        <div className="flex w-full max-w-md flex-col gap-8 bg-background p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="type-caption text-muted">Mock Pay · Order {session.metadata.reference}</p>
            <h1 className="type-title-l">{formatPrice(session.amountTotal)}</h1>
            <p className="type-caption text-muted">{session.metadata.customer_email}</p>
          </div>

          <ul className="type-caption flex flex-col gap-2 border-t pt-4">
            {session.lineItems.map((line) => (
              <li key={line.name} className="flex justify-between gap-4">
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>{formatPrice(line.unitAmount * line.quantity)}</span>
              </li>
            ))}
          </ul>

          {session.status === "complete" ? (
            <div className="flex flex-col gap-4">
              <p role="status" className="type-body">
                Payment complete.
              </p>
              <Link href={session.successUrl.replace("{CHECKOUT_SESSION_ID}", session.id)} className="btn btn-primary w-full">
                Return to the store
              </Link>
            </div>
          ) : expired ? (
            <div className="flex flex-col gap-4">
              <p role="status" className="type-body">
                This checkout has expired. Nothing was charged.
              </p>
              <Link href="/bag" className="btn btn-secondary w-full">
                Back to your bag
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {session.lastError && (
                <p role="alert" className="type-caption border-l-2 border-error pl-3 text-error">
                  {session.lastError}
                </p>
              )}
              {/* Plain form posts to the provider endpoint (full page navigation, like Stripe). */}
              <form method="post" action={`/mock-checkout/${session.id}/pay`} className="flex flex-col gap-3">
                <button type="submit" name="card" value={TEST_CARDS.success} className="btn btn-primary w-full">
                  Pay {formatPrice(session.amountTotal)} with test card {TEST_CARDS.success.slice(-4)}
                </button>
                <button type="submit" name="card" value={TEST_CARDS.declined} className="btn btn-secondary w-full">
                  Try a declined card ({TEST_CARDS.declined.slice(-4)})
                </button>
              </form>
              <div className="type-caption flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <Link href={session.cancelUrl} className="link">
                  Cancel and return to the store
                </Link>
                <form method="post" action={`/mock-checkout/${session.id}/pay`}>
                  <button type="submit" name="intent" value="expire" className="link-quiet text-muted">
                    Simulate expiry
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
