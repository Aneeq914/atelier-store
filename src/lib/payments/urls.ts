/** Absolute URL for this app (provider redirects and the mock's webhook delivery). */
export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export const WEBHOOK_PATH = "/api/webhooks/payments";
