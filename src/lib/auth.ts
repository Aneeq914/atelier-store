import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { authLogger } from "@/lib/auth-logger";
import { authRateLimitOptions } from "@/lib/auth-rate-limit";
import { databaseSessionRevocation } from "@/lib/session-revocation";

export const auth = betterAuth({
  ...authRateLimitOptions,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  logger: authLogger,
  plugins: [databaseSessionRevocation, nextCookies()],
});
