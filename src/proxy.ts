import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { withNext } from "@/lib/auth-routes";
import { SIGN_IN_HREF } from "@/lib/routes";

// Optimistic gate for signed-in areas: no session cookie, straight to sign-in.
// It only checks that the cookie exists (no database call). It is NOT the
// security check: pages and Server Actions verify the session with
// requireUser() / requireAdmin() from src/lib/session.ts.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(new URL(withNext(SIGN_IN_HREF, pathname + search), request.url));
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout/:path*"],
};
