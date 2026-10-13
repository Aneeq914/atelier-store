import assert from "node:assert/strict";
import { test } from "node:test";
import { isAdmin, safeNextPath, withNext } from "./auth-routes";

test("safeNextPath keeps same-site paths", () => {
  assert.equal(safeNextPath("/account"), "/account");
  assert.equal(safeNextPath("/admin?tab=1#top"), "/admin?tab=1#top");
  assert.equal(safeNextPath("/products/soft-pouch"), "/products/soft-pouch");
});

test("safeNextPath rejects anything that could leave the site", () => {
  for (const next of [
    "//evil.com",
    "//evil.com/account",
    "/\\evil.com",
    "\\\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    "/" + "a".repeat(600),
  ]) {
    assert.equal(safeNextPath(next), "/account", next);
  }
  assert.equal(safeNextPath(undefined), "/account");
  assert.equal(safeNextPath(["/admin"]), "/account");
  assert.equal(safeNextPath("//evil.com", "/"), "/");
});

test("withNext encodes the return path", () => {
  assert.equal(withNext("/sign-in", "/admin?x=1"), "/sign-in?next=%2Fadmin%3Fx%3D1");
  assert.equal(withNext("/sign-in", undefined), "/sign-in");
});

test("isAdmin only accepts the admin role", () => {
  assert.equal(isAdmin({ role: "admin" }), true);
  assert.equal(isAdmin({ role: "customer" }), false);
  assert.equal(isAdmin({ role: "Admin" }), false);
  assert.equal(isAdmin({}), false);
  assert.equal(isAdmin(null), false);
});
