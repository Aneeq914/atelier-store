# Atelier Store

Next.js (App Router) + TypeScript + Tailwind CSS + Better Auth + Drizzle ORM + Neon Postgres.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values.
3. `npm run auth:generate` — writes the Better Auth tables to `src/db/schema.ts`.
4. `npm run db:generate` then `npm run db:migrate` (or `npm run db:push` while prototyping).
5. `npm run dev`

## Structure

- `src/db/index.ts` — Drizzle client (Neon HTTP driver)
- `src/db/schema.ts` — table definitions
- `src/lib/auth.ts` — Better Auth server config
- `src/lib/auth-client.ts` — Better Auth React client
- `src/app/api/auth/[...all]/route.ts` — auth route handler
- `drizzle.config.ts` — Drizzle Kit config
