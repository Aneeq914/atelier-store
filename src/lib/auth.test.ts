import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { authOptions } from "./auth-options";
import { databaseSessionRevocation } from "./session-revocation";

// The real auth options and endpoints, with an in-memory database.
const baseURL = "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;

function fixture() {
  const records: Record<"user" | "session" | "account" | "verification", Record<string, unknown>[]> = {
    user: [], session: [], account: [], verification: [],
  };
  const auth = betterAuth({
    ...authOptions,
    baseURL,
    secret: "synthetic-auth-test-secret-1234567890abcdef",
    database: memoryAdapter(records),
    plugins: [databaseSessionRevocation, nextCookies()],
    logger: { disabled: true },
  });
  const { GET, POST } = toNextJsHandler(auth);
  const post = (path: string, body: object, cookie = "") =>
    POST(new Request(`${baseURL}/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseURL, cookie },
      body: JSON.stringify(body),
    }));
  const cookieOf = (response: Response) =>
    response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  const getSession = async (cookie: string) =>
    (await GET(new Request(`${baseURL}/api/auth/get-session`, { headers: { cookie } }))).json();
  return { records, post, cookieOf, getSession };
}

const credentials = { name: "Test Customer", email: "customer@example.com", password: "correct-horse-1" };

test("sign-up creates a customer with a persistent 30-day session", async () => {
  const f = fixture();
  const response = await f.post("sign-up/email", credentials);
  assert.equal(response.status, 200);

  const setCookie = response.headers.getSetCookie().join("\n");
  assert.match(setCookie, /better-auth\.session_token=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  assert.match(setCookie, /Max-Age=2592000/, "cookie lasts 30 days");

  const session = await f.getSession(f.cookieOf(response));
  assert.equal(session.user.email, credentials.email);
  assert.equal(session.user.role, "customer");
  const lifetime = new Date(session.session.expiresAt).getTime() - Date.now();
  assert.ok(lifetime > 29 * DAY_MS && lifetime <= 30 * DAY_MS, "session expires in 30 days");
});

test("a client can't make itself admin", async () => {
  const f = fixture();
  const response = await f.post("sign-up/email", { ...credentials, role: "admin" });
  assert.equal(response.status, 200);
  const cookie = f.cookieOf(response);
  assert.equal((await f.getSession(cookie)).user.role, "customer", "sign-up ignores a client-sent role");

  const update = await f.post("update-user", { role: "admin" }, cookie);
  assert.equal(update.status, 400, "update-user rejects role");
  assert.equal((await f.getSession(cookie)).user.role, "customer");
  assert.equal(f.records.user[0].role, "customer");
});

test("sign-in checks the password and gives one error for any mismatch", async () => {
  const f = fixture();
  await f.post("sign-up/email", credentials);

  const wrongPassword = await f.post("sign-in/email", { email: credentials.email, password: "wrong-password-1" });
  const unknownEmail = await f.post("sign-in/email", { email: "nobody@example.com", password: "wrong-password-1" });
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.equal((await wrongPassword.json()).code, (await unknownEmail.json()).code);

  const ok = await f.post("sign-in/email", { email: credentials.email, password: credentials.password });
  assert.equal(ok.status, 200);
  assert.equal((await f.getSession(f.cookieOf(ok))).user.email, credentials.email);
});

test("sign-out deletes the session so the cookie stops working", async () => {
  const f = fixture();
  const cookie = f.cookieOf(await f.post("sign-up/email", credentials));
  assert.ok(await f.getSession(cookie));

  assert.equal((await f.post("sign-out", {}, cookie)).status, 200);
  assert.equal(f.records.session.length, 0, "session row removed");
  assert.equal(await f.getSession(cookie), null);
});

test("an expired session is rejected", async () => {
  const f = fixture();
  const cookie = f.cookieOf(await f.post("sign-up/email", credentials));
  f.records.session[0].expiresAt = new Date(Date.now() - 1000);
  assert.equal(await f.getSession(cookie), null);
});

test("passwords must be 8 to 128 characters", async () => {
  const f = fixture();
  assert.equal((await f.post("sign-up/email", { ...credentials, password: "short" })).status, 400);
  assert.equal((await f.post("sign-up/email", { ...credentials, password: "x".repeat(129) })).status, 400);
  assert.equal(f.records.user.length, 0);
});
