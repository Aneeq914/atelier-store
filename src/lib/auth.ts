import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { authLogger } from "@/lib/auth-logger";
import { authOptions } from "@/lib/auth-options";
import { databaseSessionRevocation } from "@/lib/session-revocation";

// Server only. baseURL and secret come from BETTER_AUTH_URL and BETTER_AUTH_SECRET.
// Behaviour (roles, sessions, password rules) lives in auth-options.ts.
export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  logger: authLogger,
  plugins: [databaseSessionRevocation, nextCookies()], // nextCookies must stay last
});

export type AuthSession = typeof auth.$Infer.Session;
