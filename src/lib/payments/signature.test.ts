import assert from "node:assert/strict";
import { test } from "node:test";
import { signPayload, TOLERANCE_SECONDS, verifySignature } from "./signature";

const secret = "test-webhook-secret-0123456789abcdef0123456789";
const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

test("a fresh, matching signature verifies", () => {
  assert.equal(verifySignature(body, signPayload(body, secret), secret), true);
});

test("tampered body, wrong secret or missing header fail", () => {
  const header = signPayload(body, secret);
  assert.equal(verifySignature(body.replace("completed", "expired"), header, secret), false);
  assert.equal(verifySignature(body, header, "another-secret-0123456789abcdef0123"), false);
  assert.equal(verifySignature(body, null, secret), false);
  assert.equal(verifySignature(body, header, ""), false);
});

test("old or future timestamps fail (replay window)", () => {
  const now = Math.floor(Date.now() / 1000);
  assert.equal(verifySignature(body, signPayload(body, secret, now - TOLERANCE_SECONDS - 1), secret, now), false);
  assert.equal(verifySignature(body, signPayload(body, secret, now + TOLERANCE_SECONDS + 1), secret, now), false);
  assert.equal(verifySignature(body, signPayload(body, secret, now - 60), secret, now), true);
});

test("malformed headers fail without throwing", () => {
  for (const header of ["", "garbage", "t=abc,v1=xyz", "t=1,v1=" + "0".repeat(10), "v1=" + "a".repeat(64)]) {
    assert.equal(verifySignature(body, header, secret), false, header);
  }
});
