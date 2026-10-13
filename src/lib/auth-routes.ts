// Auth helpers safe to use anywhere (no server or database imports).

import { ACCOUNT_HREF } from "@/lib/routes";

const ORIGIN = "http://atelier.invalid";

/**
 * Where to go after signing in or up. Only same-site paths are allowed, so a
 * crafted `?next=//evil.com` (or `/\evil.com`, `https://…`, `javascript:…`)
 * can't send people off-site; anything else falls back to the account page.
 */
export function safeNextPath(next: unknown, fallback = ACCOUNT_HREF) {
  if (typeof next !== "string" || !next.startsWith("/") || next.length > 512) return fallback;
  try {
    // Browsers treat "\" like "/", so "/\evil.com" would be protocol-relative.
    const url = new URL(next, ORIGIN);
    if (url.origin !== ORIGIN || next.startsWith("//") || next.includes("\\")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** The sign-in or sign-up URL that returns to `next` afterwards. */
export function withNext(href: string, next: string | undefined) {
  return next ? `${href}?next=${encodeURIComponent(next)}` : href;
}

export function isAdmin(user: { role?: string | null } | null | undefined) {
  return user?.role === "admin";
}
