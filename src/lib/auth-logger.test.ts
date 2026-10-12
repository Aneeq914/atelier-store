import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { authLogger } from "./auth-logger";

const controls = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;

test("auth logs encode controls and arguments into a single record", (t) => {
  const sinks = {
    error: t.mock.method(console, "error", () => {}),
    warn: t.mock.method(console, "warn", () => {}),
    info: t.mock.method(console, "log", () => {}),
  };
  const payload = 'https://untrusted.example/\r\nFORGED\t\0\x1b[2J\x7f\x85\u2028\u2029"\\';
  const circular: { self?: unknown } = {};
  circular.self = circular;

  for (const level of ["error", "warn", "info"] as const) {
    authLogger.log(level, `Rejected: ${payload}`);
    authLogger.log(level, "Details: %s", payload, new Error(payload), circular);
    assert.equal(sinks[level].mock.callCount(), 2);
    for (const [index, call] of sinks[level].mock.calls.entries()) {
      assert.equal(call.arguments.length, 1);
      const line = String(call.arguments[0]);
      assert.doesNotMatch(line, controls);
      const record = JSON.parse(line);
      assert.equal(record.level, level);
      assert.equal(record.source, "Better Auth");
      assert.ok(Number.isFinite(Date.parse(record.timestamp)));
      if (index === 0) assert.equal(record.message, `Rejected: ${payload}`);
      else {
        assert.ok(record.message.includes(payload));
        assert.ok(record.message.includes("Error:"));
        assert.ok(record.message.includes("[Circular"));
      }
    }
  }
});

test("unauthenticated callback rejection remains 403 with a single safe log record", async (t) => {
  // Auth tables are not shipped yet; use synthetic tables for this middleware flow.
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "synthetic-auth-logger-test-secret-1234567890",
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    emailAndPassword: { enabled: true },
    plugins: [nextCookies()],
    logger: authLogger,
  });
  await auth.$context;
  const error = t.mock.method(console, "error", () => {});
  const info = t.mock.method(console, "log", () => {});
  const network = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network request");
  });
  const { POST } = toNextJsHandler(auth);
  const payloads = [
    "https://untrusted.example/ordinary",
    "https://untrusted.example/\r\nFORGED\x1b[2J\x85\u2028\u2029",
  ];

  for (const callbackURL of payloads) {
    error.mock.resetCalls();
    const response = await POST(new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "test-password", callbackURL }),
    }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, "INVALID_CALLBACK_URL");
    assert.equal(error.mock.callCount(), 1);
    const [line] = error.mock.calls[0].arguments;
    assert.doesNotMatch(String(line), controls);
    assert.equal(JSON.parse(String(line)).message, `Invalid callbackURL: ${callbackURL}`);
  }
  assert.equal(info.mock.callCount(), 0, "retain Better Auth's default warn threshold");
  assert.equal(network.mock.callCount(), 0);
});
