import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEmail, validateField, validateForm, validateName, validateNewPassword } from "./auth-validation";

test("names are required and capped", () => {
  assert.equal(validateName("Ada"), undefined);
  assert.equal(validateName("   "), "Enter your name.");
  assert.match(validateName("x".repeat(101)) ?? "", /100 characters/);
});

test("emails need a plausible shape", () => {
  assert.equal(validateEmail("ada@example.com"), undefined);
  assert.equal(validateEmail(" ada@example.com "), undefined);
  for (const bad of ["ada", "ada@", "ada@example", "a da@example.com", "@example.com"]) {
    assert.match(validateEmail(bad) ?? "", /valid email/, bad);
  }
  assert.equal(validateEmail(""), "Enter your email address.");
});

test("new passwords are 8 to 128 characters", () => {
  assert.equal(validateNewPassword("12345678"), undefined);
  assert.match(validateNewPassword("1234567") ?? "", /at least 8/);
  assert.match(validateNewPassword("x".repeat(129)) ?? "", /128/);
  assert.equal(validateNewPassword(""), "Create a password.");
});

test("sign-in only checks that a password was entered", () => {
  assert.equal(validateField("sign-in", "password", "short"), undefined);
  assert.equal(validateField("sign-in", "password", ""), "Enter your password.");
});

test("validateForm returns every problem at once, and only for that form's fields", () => {
  assert.deepEqual(Object.keys(validateForm("sign-up", { name: "", email: "x", password: "1" })), ["name", "email", "password"]);
  assert.deepEqual(validateForm("sign-up", { name: "Ada", email: "ada@example.com", password: "correct-horse" }), {});
  assert.deepEqual(validateForm("profile", { name: "Ada" }), {});
  assert.deepEqual(Object.keys(validateForm("sign-in", {})), ["email", "password"]);
});
