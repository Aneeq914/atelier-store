import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, revokeOtherSessions } from "better-auth/api";

// For this app's database-backed sessions (no secondary storage or cookie cache).
// Better Auth 1.7.7 lists only 100 rows before revoking other sessions. Override
// that operation while retaining its authoritative session middleware and options.
export const databaseSessionRevocation = {
  id: "database-session-revocation",
  endpoints: {
    revokeOtherSessions: createAuthEndpoint(
      revokeOtherSessions.path,
      revokeOtherSessions.options,
      async (ctx) => {
        const { user, session } = ctx.context.session;
        await ctx.context.adapter.deleteMany({
          model: "session",
          where: [
            { field: "userId", value: user.id },
            { field: "token", operator: "ne", value: session.token },
          ],
        });
        return ctx.json({ status: true });
      },
    ),
  },
} satisfies BetterAuthPlugin;
