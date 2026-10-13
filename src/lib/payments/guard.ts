// The mock payment provider must never run in production: anyone could use
// its payment page to mark orders paid without paying. No imports, so it's
// easy to test and cheap to call at the top of every mock operation.

export function assertMockAllowed(env: string | undefined = process.env.NODE_ENV) {
  if (env === "production") {
    throw new Error("The mock payment provider is disabled in production. Set PAYMENT_PROVIDER to a real provider.");
  }
}
