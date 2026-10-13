import { createHmac, timingSafeEqual } from "node:crypto";

// Webhook signatures, Stripe-style: header "t=<unix seconds>,v1=<hex HMAC-SHA256
// of `${t}.${rawBody}`>". The timestamp is signed too, so an old captured event
// can't be replayed after the tolerance window.

export const SIGNATURE_HEADER = "x-atelier-signature";
export const TOLERANCE_SECONDS = 5 * 60;

export function signPayload(rawBody: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

/** True only for a well-formed, matching, recent signature. Constant-time comparison. */
export function verifySignature(rawBody: string, header: string | null, secret: string, now = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || !/^[0-9a-f]{64}$/.test(parts.v1 ?? "")) return false;
  if (Math.abs(now - timestamp) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  return timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}
