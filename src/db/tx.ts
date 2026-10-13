import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Transactions (WebSocket Pool). The default `db` (src/db/index.ts) uses the
// Neon HTTP driver, which can't run interactive transactions. Use this only
// for writes that must be all-or-nothing and lock rows: starting checkout
// (reserve stock + create the order) and applying payment webhooks.
// Node 24 provides the global WebSocket the driver needs.

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// One pool per server process (dev hot reloads re-run this module).
const globalForPool = globalThis as unknown as { atelierPool?: Pool };
const pool = globalForPool.atelierPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
globalForPool.atelierPool = pool;

export const txDb = drizzle({ client: pool, schema, casing: "snake_case" });

export type Tx = Parameters<Parameters<typeof txDb.transaction>[0]>[0];
