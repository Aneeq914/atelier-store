// Change a user's role: `npm run auth:set-role -- <email> <customer|admin>`.
// Roles can't be set through sign-up or the API (Better Auth `input: false`),
// so this local script, run against the database in .env, is how the first
// admin is made: sign up normally, then promote that email.
// The change applies on the user's next request (no cookie cache).

import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { roles, user, type Role } from "../src/db/schema";

const [email, role] = process.argv.slice(2);

function fail(message: string): never {
  console.error(message);
  console.error("Usage: npm run auth:set-role -- <email> <customer|admin>");
  process.exit(1);
}

if (!email || !role) fail("Missing email or role.");
if (!roles.includes(role as Role)) fail(`Unknown role "${role}". Use one of: ${roles.join(", ")}.`);

db.update(user)
  .set({ role: role as Role })
  .where(eq(user.email, email.trim().toLowerCase()))
  .returning({ email: user.email, role: user.role })
  .then(([updated]) => {
    if (!updated) fail(`No user with email ${email}.`);
    console.log(`${updated.email} is now ${updated.role}.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
