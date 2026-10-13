import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_QUERY_LENGTH, normalizeQuery, toLikePattern, toPrefixPattern, toSearchTerms } from "./search";

test("normalizeQuery trims, collapses spaces, takes the first value and caps length", () => {
  assert.equal(normalizeQuery("  black   loafer "), "black loafer");
  assert.equal(normalizeQuery(["tote", "bag"]), "tote");
  assert.equal(normalizeQuery(undefined), "");
  assert.equal(normalizeQuery("x".repeat(500)).length, MAX_QUERY_LENGTH);
});

test("toSearchTerms lowercases, strips punctuation, de-duplicates and makes plurals singular", () => {
  assert.deepEqual(toSearchTerms("Black Loafers"), ["black", "loafer"]);
  assert.deepEqual(toSearchTerms("boots, BOOT"), ["boot"]);
  assert.deepEqual(toSearchTerms("watches glasses boxes"), ["watch", "glass", "box"]);
  assert.deepEqual(toSearchTerms("shoes dress"), ["shoe", "dress"]);
  assert.deepEqual(toSearchTerms('"tote!" (canvas)'), ["tote", "canva"]);
  assert.deepEqual(toSearchTerms("eau-de-parfum 100ml"), ["eau-de-parfum", "100ml"]);
  assert.deepEqual(toSearchTerms("  ...  "), []);
  assert.equal(toSearchTerms("a b c d e f g").length, 5);
});

test("toLikePattern escapes LIKE wildcards so they match literally", () => {
  assert.equal(toLikePattern("tote"), "%tote%");
  assert.equal(toLikePattern("100%"), "%100\\%%");
  assert.equal(toLikePattern("a_b"), "%a\\_b%");
  assert.equal(toLikePattern("c:\\x"), "%c:\\\\x%");
  assert.equal(toPrefixPattern("AT 3001"), "AT 3001%");
  assert.equal(toPrefixPattern("50%"), "50\\%%");
});
