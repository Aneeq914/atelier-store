import { NextResponse, type NextRequest } from "next/server";
import { expireMockSession, payMockSession, sendAfterResponse } from "@/lib/payments/mock";

// The mock provider's form endpoint. A plain form POST answered with a 303, so
// the browser does a full page navigation back to the store (like returning
// from checkout.stripe.com), and the address bar ends on the real order URL.
// The webhook is sent after this response, so the order page may briefly show
// "Confirming…". In production the mock throws and nothing happens.

export async function POST(request: NextRequest, { params }: RouteContext<"/mock-checkout/[sessionId]/pay">) {
  const { sessionId } = await params;
  const form = await request.formData();
  const back = new URL(`/mock-checkout/${sessionId}`, request.url);

  if (form.get("intent") === "expire") {
    const event = await expireMockSession(sessionId);
    if (event) sendAfterResponse(event);
    return NextResponse.redirect(back, 303);
  }

  const result = await payMockSession(sessionId, String(form.get("card") ?? ""));
  if ("event" in result && result.event) sendAfterResponse(result.event);
  if ("successUrl" in result && result.successUrl) return NextResponse.redirect(result.successUrl, 303);
  return NextResponse.redirect(back, 303); // declined or no longer open: show the page again
}
