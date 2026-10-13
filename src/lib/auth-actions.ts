"use server";

import { isAPIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { clearBag } from "@/lib/bag-cookie";
import { safeNextPath, withNext } from "@/lib/auth-routes";
import { LIMITS, validateForm, type FieldErrors } from "@/lib/auth-validation";
import { ACCOUNT_DETAILS_HREF, SIGN_IN_HREF } from "@/lib/routes";
import { requireUser } from "@/lib/session";

// Server Actions for the auth and account forms. They call Better Auth on the
// server; the nextCookies() plugin writes the session cookie. Each action
// validates its own input with the same rules as the browser: Server Actions
// are public endpoints, and the forms also work without JavaScript.

export type FormState = {
  /** A problem with the whole submission, shown at the top of the form. */
  formError?: { message: string; link?: { label: string; href: string } };
  /** Problems with single fields, shown under each one. */
  fieldErrors?: FieldErrors;
  /** Echoed back so the form keeps what was typed (never the password). */
  values?: { name?: string; email?: string };
  /** A success message (account details). */
  saved?: string;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const GENERIC = "Something went wrong on our side. Please try again.";
const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";

function isRateLimited(error: unknown) {
  return isAPIError(error) && (error.status === 429 || error.statusCode === 429 || error.status === "TOO_MANY_REQUESTS");
}

export async function signUpAction(_state: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  const values = { name, email };

  const fieldErrors = validateForm("sign-up", { name, email, password });
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
  } catch (error) {
    if (isRateLimited(error)) return { formError: { message: RATE_LIMITED }, values };
    const code = isAPIError(error) ? (error.body as { code?: string } | undefined)?.code : undefined;
    if (code?.startsWith("USER_ALREADY_EXISTS")) {
      return {
        formError: {
          message: "There's already an account with this email.",
          link: { label: "Sign in instead", href: withNext(SIGN_IN_HREF, next) },
        },
        values,
      };
    }
    if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
      return { fieldErrors: { password: `Use ${LIMITS.password.min} to ${LIMITS.password.max} characters.` }, values };
    }
    if (code === "INVALID_EMAIL") return { fieldErrors: { email: "Enter a valid email address." }, values };
    console.error(error);
    return { formError: { message: GENERIC }, values };
  }
  redirect(next);
}

export async function signInAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  const fieldErrors = validateForm("sign-in", { email, password });
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    if (isRateLimited(error)) return { formError: { message: RATE_LIMITED }, values };
    // One message for a wrong email or password, so the form doesn't reveal which accounts exist.
    if (isAPIError(error)) return { formError: { message: "That email and password don't match. Please try again." }, values };
    console.error(error);
    return { formError: { message: GENERIC }, values };
  }
  redirect(safeNextPath(formData.get("next")));
}

/** Account details: change the display name. Email changes aren't offered yet. */
export async function updateNameAction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireUser(ACCOUNT_DETAILS_HREF);
  const name = text(formData, "name");
  const values = { name };

  const fieldErrors = validateForm("profile", { name });
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await auth.api.updateUser({ body: { name }, headers: await headers() });
  } catch (error) {
    if (isRateLimited(error)) return { formError: { message: RATE_LIMITED }, values };
    console.error(error);
    return { formError: { message: GENERIC }, values };
  }
  refresh(); // re-render the account pages with the new name
  return { saved: "Your name has been updated.", values };
}

/** Deletes the session in the database and clears the cookie. Also empties the bag (shared devices). */
export async function signOutAction() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // Already signed out (no or expired session): nothing to undo.
    if (!isAPIError(error)) throw error;
  }
  await clearBag();
  redirect("/");
}
