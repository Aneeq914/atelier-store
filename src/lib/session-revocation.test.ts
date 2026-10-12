import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth, type Session, type User } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { databaseSessionRevocation } from "./session-revocation";

const baseURL = "http://localhost:3000";

async function fixture() {
  // The production auth schema is generated during setup. Exercise the real
  // endpoint, middleware and adapter factory with synthetic database records.
  const records: { user: User[]; session: Session[]; account: []; verification: [] } = {
    user: [], session: [], account: [], verification: [],
  };
  const auth = betterAuth({
    baseURL,
    secret: "synthetic-session-revocation-secret-1234567890",
    database: memoryAdapter(records),
    emailAndPassword: { enabled: true },
    plugins: [databaseSessionRevocation, nextCookies()],
    logger: { disabled: true },
  });
  const { GET, POST } = toNextJsHandler(auth);
  async function login(email: string, signup = true) {
    const response = await POST(new Request(`${baseURL}/api/auth/${signup ? "sign-up" : "sign-in"}/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", email, password: "test-password-123" }),
    }));
    assert.equal(response.status, 200);
    return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  }
  const currentCookie = await login("owner@example.com");
  const current = records.session[0];
  const otherCookie = await login("other@example.com");
  const other = records.session[1];
  const attackerCookie = await login("owner@example.com", false);
  const getSession = async (cookie: string) => {
    const response = await GET(new Request(`${baseURL}/api/auth/get-session`, { headers: { cookie } }));
    assert.equal(response.status, 200);
    return response.json();
  };
  const revoke = (cookie = currentCookie, origin = baseURL) => POST(new Request(`${baseURL}/api/auth/revoke-other-sessions`, {
    method: "POST",
    headers: { cookie, origin },
  }));
  return { auth, records, current, other, currentCookie, otherCookie, attackerCookie, getSession, revoke };
}

for (const expiredCount of [0, 120]) {
  test(`revoke every other session with 150 live and ${expiredCount} expired records`, async () => {
    const f = await fixture();
    f.records.session.unshift(...Array.from({ length: expiredCount + 150 }, (_, index) => ({
      ...f.current,
      id: `history-${index}`,
      token: `history-${index}`,
      expiresAt: new Date(Date.now() + (index < expiredCount ? -60_000 : 3_600_000)),
    })));
    assert.ok((await f.getSession(f.attackerCookie)).session);
    const response = await f.revoke();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: true });
    assert.deepEqual(f.records.session.map(({ id }) => id).sort(), [f.current.id, f.other.id].sort());
    assert.equal(await f.getSession(f.attackerCookie), null);
    assert.equal((await f.getSession(f.currentCookie)).session.id, f.current.id);
    assert.equal((await f.getSession(f.otherCookie)).session.id, f.other.id);
    assert.equal((await f.revoke()).status, 200, "revocation is idempotent");
  });
}

test("revocation retains authentication and origin controls", async () => {
  const f = await fixture();
  const ids = f.records.session.map(({ id }) => id);
  assert.equal((await f.revoke("")).status, 401);
  assert.equal((await f.revoke("better-auth.session_token=forged")).status, 401);
  assert.equal((await f.revoke(f.currentCookie, "https://untrusted.example")).status, 403);
  assert.deepEqual(f.records.session.map(({ id }) => id), ids);
  f.current.expiresAt = new Date(Date.now() - 60_000);
  assert.equal((await f.revoke()).status, 401);
  assert.ok((await f.getSession(f.attackerCookie)).session);
  assert.ok((await f.getSession(f.otherCookie)).session);
});

test("a database deletion failure cannot report successful revocation", async (t) => {
  const f = await fixture();
  const context = await f.auth.$context;
  t.mock.method(context.adapter, "deleteMany", async () => {
    throw new Error("synthetic database failure");
  });
  const response = await f.revoke();
  assert.equal(response.status, 500);
  assert.ok((await f.getSession(f.attackerCookie)).session);
  assert.ok((await f.getSession(f.currentCookie)).session);
});
