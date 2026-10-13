import { NextResponse, type NextRequest } from "next/server";
import { getOrderBySessionId } from "@/db/queries/orders";
import { clearBag } from "@/lib/bag-cookie";
import { getSession } from "@/lib/session";

// The provider sends the shopper here after paying. This is NOT proof of
// payment (anyone can open this URL): it only empties the bag (the items are on
// the order now) and shows the order page, which reads the status that the
// verified webhook sets.

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  const [auth, order] = await Promise.all([getSession(), sessionId ? getOrderBySessionId(sessionId) : null]);

  if (!auth || !order || order.userId !== auth.user.id) {
    return NextResponse.redirect(new URL("/account", request.url));
  }
  await clearBag();
  return NextResponse.redirect(new URL(`/checkout/orders/${order.reference}`, request.url));
}
