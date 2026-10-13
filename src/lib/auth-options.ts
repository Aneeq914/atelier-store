import type { BetterAuthOptions } from "better-auth";

const DAY = 60 * 60 * 24;

// The parts of the Better Auth config that define behaviour, shared by
// src/lib/auth.ts (with the real database) and the tests (with a memory adapter).
// Version 1: email/password only; no email verification, password reset or social sign-in.
export const authOptions = {
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128, autoSignIn: true },
  user: {
    additionalFields: {
      // input: false: sign-up replaces any client-sent role with the default,
      // and update-user rejects it. Change roles with `npm run auth:set-role`.
      role: { type: "string", input: false, defaultValue: "customer" },
    },
  },
  // Persistent sessions: 30 days, extended at most once a day while in use.
  // The cookie cache stays off (the default), so every session read hits the
  // database: role changes and revoked sessions apply on the next request, and
  // databaseSessionRevocation relies on that.
  session: { expiresIn: 30 * DAY, updateAge: DAY },
} satisfies BetterAuthOptions;
