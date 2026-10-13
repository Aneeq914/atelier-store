// Turns what a shopper typed into safe, forgiving search terms.

export const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 5;

/** The `q` search param as one trimmed string ("" when missing). */
export function normalizeQuery(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

// Search matches substrings, so dropping a plural ending still finds the
// singular and the plural ("boots" → "boot" matches "boot" and "boots").
function singular(word: string) {
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Lowercase, de-duplicated words; every term must match for a product to be a result. */
export function toSearchTerms(query: string) {
  const words = query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean)
    .map(singular);
  return [...new Set(words)].slice(0, MAX_TERMS);
}

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`);

/** An ILIKE pattern that matches the term anywhere, with `%`, `_` and `\` taken literally. */
export function toLikePattern(term: string) {
  return `%${escapeLike(term)}%`;
}

/** An ILIKE pattern that matches text starting with the query (style codes: "AT 3001" but not "100"). */
export function toPrefixPattern(query: string) {
  return `${escapeLike(query)}%`;
}
