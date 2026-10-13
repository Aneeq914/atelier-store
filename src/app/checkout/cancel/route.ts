import { NextResponse, type NextRequest } from "next/server";
import { getOrderForUser } from "@/db/queries/orders";
import { getPaymentProvider } from "@/lib/payments/provider";
import { getSession } from "@/lib/session";

// The shopper chose to go back from the payment page. Close the provider
// session; its expired webhook then marks the order expired and gives the
// stock back. The bag cookie was never cleared, so the bag is intact.

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("order") ?? "";
  const auth = await getSession();
  const order = auth && reference ? await getOrderForUser(reference, auth.user.id) : null;

  if (order?.status === "pending_payment" && order.providerSessionId) {
    try {
      await getPaymentProvider().expireSession(order.providerSessionId);
    } catch (error) {
      console.error("[checkout] couldn't expire the session on cancel", order.reference, error);
    }
  }
  return NextResponse.redirect(new URL("/bag?checkout=cancelled", request.url));
}
