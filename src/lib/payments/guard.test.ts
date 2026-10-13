import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assertMockAllowed } from "./guard";

test("the mock provider refuses to run in production", () => {
  assert.throws(() => assertMockAllowed("production"), /disabled in production/);
  assert.doesNotThrow(() => assertMockAllowed("development"));
  assert.doesNotThrow(() => assertMockAllowed("test"));
});

test("every mock entry point checks the guard", () => {
  const source = readFileSync(new URL("./mock.ts", import.meta.url), "utf8");
  for (const fn of ["getMockSession", "expireMockSession", "payMockSession", "createCheckoutSession"]) {
    const start = source.indexOf(fn);
    assert.ok(start >= 0, `${fn} exists`);
    const body = source.slice(start, source.indexOf("\n}", start) + 2 || undefined);
    assert.match(body, /assertMockAllowed\(\)/, `${fn} calls assertMockAllowed()`);
  }
});
