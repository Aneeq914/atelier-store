import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { isAdmin, withNext } from "@/lib/auth-routes";
import { ADMIN_HREF, SIGN_IN_HREF } from "@/lib/routes";

// The real authorization checks. Call them at the top of every protected page
// and inside every protected Server Action: layouts don't re-run on navigation,
// and the proxy only checks that a cookie exists.

/** The current session (user + session), or null. Read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The signed-in session, or a redirect to sign-in that comes back to `returnTo`. */
export async function requireUser(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(withNext(SIGN_IN_HREF, returnTo));
  return session;
}

/** An admin session. Signed-out visitors go to sign-in; signed-in non-admins get a 404. */
export async function requireAdmin(returnTo = ADMIN_HREF) {
  const session = await requireUser(returnTo);
  if (!isAdmin(session.user)) notFound();
  return session;
}
