import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { authRateLimitOptions } from "./auth-rate-limit";

test("forwarding headers cannot buy extra password attempts", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const baseURL = "http://localhost:3000";
  const auth = betterAuth({
    ...authRateLimitOptions,
    baseURL,
    secret: "synthetic-auth-rate-limit-secret-1234567890",
    database: memoryAdapter({ user: [], account: [], session: [], verification: [] }),
    emailAndPassword: { enabled: true },
    // Better Auth enables this by default only in production.
    rateLimit: { enabled: true },
    plugins: [nextCookies()],
    logger: { disabled: true },
  });
  const { POST } = toNextJsHandler(auth);
  const email = "synthetic@example.com";
  const password = "synthetic-password-123";
  const request = (path: string, body: object, headers: Record<string, string> = {}) =>
    POST(new Request(`${baseURL}/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }));
  assert.equal((await request("sign-up/email", { name: "Test", email, password })).status, 200);
  const context = await auth.$context;
  const verify = t.mock.method(context.password, "verify");
  const attempt = (headers: Record<string, string>, guess = "wrong-password") =>
    request("sign-in/email", { email, password: guess }, headers);

  assert.equal((await attempt({ "x-forwarded-for": "192.0.2.1" }, password)).status, 200);
  assert.equal((await attempt({ "x-forwarded-for": "192.0.2.2" })).status, 401);
  assert.equal((await attempt({ "x-forwarded-for": "2001:db8::1" })).status, 401);
  const spoofedHeaders: Record<string, string>[] = [
    { "x-forwarded-for": "192.0.2.3" },
    { "x-forwarded-for": "192.0.2.4, 198.51.100.1" },
    { "x-forwarded-for": "invalid" },
    { "x-real-ip": "192.0.2.5", "cf-connecting-ip": "192.0.2.6" },
    {},
  ];
  for (const headers of spoofedHeaders) {
    const response = await attempt(headers);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("x-retry-after"), "10");
  }
  assert.equal(verify.mock.callCount(), 3, "blocked requests never check the password");

  t.mock.timers.tick(10_001);
  assert.equal((await attempt({}, password)).status, 200, "sign-in recovers after expiry");

  t.mock.timers.tick(10_001);
  const concurrent = await Promise.all(Array.from({ length: 8 }, (_, i) =>
    attempt({ "x-forwarded-for": `198.51.100.${i + 1}` })));
  assert.equal(concurrent.filter((response) => response.status === 401).length, 3);
  assert.equal(concurrent.filter((response) => response.status === 429).length, 5);
  assert.equal(verify.mock.callCount(), 7);
});
