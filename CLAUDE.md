# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

Atelier Store is an eCommerce app at an early stage. The stack is wired up, and the **homepage** and **product detail page** (`/products/[slug]`) read their products from Postgres (seeded sample data). There are no collection pages, cart, auth UI or payments yet, so links such as `/collections/*`, `/bag` and `/account` currently 404. "Add to bag" only shows a confirmation; it isn't connected to a cart. Don't assume any of these exist.

## Commands

```bash
npm run dev            # dev server (Turbopack) on http://localhost:3000
npm run build          # production build; needs DATABASE_URL set (src/db/index.ts throws without it)
npm run lint           # ESLint (flat config, eslint-config-next)
npx tsc --noEmit       # typecheck (run `npx next typegen` first if `.next/` is missing — LayoutProps/PageProps are generated)

npm run auth:generate  # Better Auth CLI: writes auth tables into src/db/schema/auth.ts
npm run db:generate    # drizzle-kit: create SQL migration in ./drizzle from schema
npm run db:migrate     # apply migrations to Neon
npm run db:push        # push schema directly (prototyping only)
npm run db:studio      # Drizzle Studio
npm run db:seed        # load the sample catalog (safe to re-run; resets stock to seed values)
```

There is no test runner set up yet.

## Environment

Copy `.env.example` to `.env`. Required: `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. `drizzle.config.ts` loads `.env` via `dotenv/config`; Next.js loads it on its own.

## Architecture

Stack: Next.js 16 (App Router, `src/` dir, `@/*` → `src/*`), React 19, TypeScript (strict), Tailwind CSS v4, Better Auth, Drizzle ORM, Neon Postgres.

How the pieces connect:

- `src/db/schema/index.ts` exports every table (catalog tables in `catalog.ts`). It feeds Drizzle Kit (`drizzle.config.ts`) and the runtime client (`src/db/index.ts`), and is passed to the Better Auth Drizzle adapter. There are no auth tables yet, so **auth calls fail until `auth:generate` has run, its file is exported from `index.ts`, and a migration is applied**.
- `src/db/index.ts` exports `db`, built on the **Neon HTTP driver** (`drizzle-orm/neon-http`). That driver does not support interactive/multi-statement transactions. Anything that needs `db.transaction()` (e.g. checkout, stock updates) requires switching to `drizzle-orm/neon-serverless` (WebSocket `Pool`).
- `src/lib/auth.ts` is the server-side Better Auth instance (Drizzle adapter with `provider: "pg"`, email/password enabled, `nextCookies()` plugin so Server Actions can set auth cookies). Import it only from server code.
- `src/app/api/auth/[...all]/route.ts` mounts Better Auth via `toNextJsHandler(auth)`; all auth HTTP endpoints live under `/api/auth/*`.
- `src/lib/auth-client.ts` exports `authClient` (`better-auth/react`) for client components.

Storefront:

- `src/app/(store)/layout.tsx` wraps storefront pages with `SiteHeader` and `SiteFooter`. The root layout stays bare, so auth or admin pages can live outside the `(store)` group.
- `SiteHeader` (client) is fixed. On paths in its `OVERLAY_PATHS` set it floats transparent with white content over a full-bleed first section and turns solid after scrolling. On every other path it renders a spacer so content starts below it. If you add a page that opens with a full-bleed image, add its path to that set. The menu is a native `<dialog>` drawer.
- `src/components/home/*` are the homepage sections. `src/components/product/*` is shared by every page that shows products: `ProductCard`, `ProductGridSection` (heading plus edge-to-edge grid), `StockStatus`, `ProductGallery`, `ProductAccordion`, `AddToBagButton`.
- Product data comes from the database through `src/db/queries/catalog.ts` (see **Database conventions**). The stock rules are in `src/lib/stock.ts` (`getStockStatus`: 0 means sold out, up to `LOW_STOCK_THRESHOLD` (3) means low stock). `src/lib/sample-data.ts` holds page copy and editorial imagery; client components import it, so it must not import from `src/db`. Category links are built by `categoryHref()` in `src/lib/routes.ts`. Photos are local files in `public/images/sample/` (from Pexels, with a `credit` URL on each), built by `photo()` in `src/lib/sample-images.ts`. `src/lib/format.ts` has `formatPrice` (takes cents).
- **Product page, 404s and partialPrefetching:** `/products/[slug]` lists every product in `generateStaticParams`, awaits `params` and looks up the product **before** rendering, and calls `notFound()` for unknown slugs. It exports:
  - `ensureStatic = "navigation"`: an unknown slug waits for the full page instead of getting the streamed fallback shell, so it returns a real **404** (in dev and production). This requires every read on the page to be cached (`"use cache"`, `cacheLife` of at least `"minutes"`).
  - `instant = false`: silences the dev warning "URL data outside of Suspense", which is expected for this approach.
  - Don't move the product lookup inside `<Suspense>`. Once streaming starts, `notFound()` can only send status 200 with `noindex`. Use this pattern for any dynamic route where a missing record must return 404.
- Product images: set `imageAspect: "landscape"` (the `image_aspect` column) on products whose photos are 4:3. The gallery then uses 4:3 frames instead of cropping them into 4:5.

## Database conventions

The catalog lives in Postgres (Neon) through Drizzle: schema in `src/db/schema/catalog.ts`, first migration in `drizzle/0000_catalog.sql`, seed data in `src/db/seed-data.ts`. Follow these rules for any change to it.

- **Version 1 scope:** only `categories`, `products` and `product_stock`. Don't add carts, orders, payments, reviews, wishlists or product variants unless asked.
- **Relationships:**
  - One category has many products. `products.category_id` is required, indexed, and `on delete restrict`.
  - Each product has exactly one stock row. `product_stock.product_id` is the primary key and `on delete cascade`.
  - Stock lives in its own table, not as a column on `products`, so variants can get their own stock rows later.
- **Columns:**
  - Primary keys are auto-generated integers (`generatedAlwaysAsIdentity`).
  - `slug` is unique on categories and products. URLs use slugs, never ids.
  - Money is `price_cents` (integer, ≥ 0). USD only, no currency column. `formatPrice` takes cents.
  - Stock is `quantity` (integer, ≥ 0).
  - `details` is `text[]`.
  - `images` is `jsonb` typed as `ProductImage[]` (`{ src, alt, position?, credit? }`); the first image is the listing image. Move images to a `product_images` table only when they need managing one by one.
  - `image_aspect` is an enum: `portrait` or `landscape`.
  - Timestamps are `created_at` and `updated_at`, with time zone. "New arrivals" sorts by `created_at`.
  - Set `casing: "snake_case"` in both `drizzle.config.ts` and the `drizzle()` client: camelCase in TypeScript, snake_case in SQL.
- **Schema files:** all schema lives in `src/db/schema/`: `catalog.ts`, `auth.ts` (written by `auth:generate`), and `index.ts`, which exports everything. Add new table groups as new files and export them from `index.ts`.
- **Migrations:**
  - Workflow: change the schema → `npm run db:generate` → review the SQL → commit `drizzle/` → `npm run db:migrate`.
  - `db:push` is only for throwaway prototypes, never production.
  - Neon branches: `dev` for local work (`DATABASE_URL` in `.env`), `main` for production. Deploys run migrations before `next build`.
- **Seeding:** `src/db/seed.ts` (script `db:seed`, run with `tsx`) loads `src/db/seed-data.ts`. It must be safe to re-run (upsert by slug), and must use `db.batch()` so it's all-or-nothing on the HTTP driver.
- **Reading data:**
  - Pages and components never import `db`. All catalog reads go through `src/db/queries/catalog.ts`: `getProductBySlug`, `getProductSlugs`, `getNewArrivals`, `getRelatedProducts`. Add new reads there, following the same caching pattern.
  - These map rows to the existing `Product` shape, so components don't change. Two things to know: `category` is `{ id, slug, name, href }`, and `price` is in cents. A product with no stock row counts as 0 (sold out).
  - Each query uses `"use cache"`, `cacheTag("catalog")` and `cacheLife("minutes")`.
  - After writes, invalidate with `updateTag("catalog")` in Server Actions, or `revalidateTag("catalog", "max")` elsewhere.
  - The stock rules stay as plain functions in `src/lib/stock.ts`.
- **Builds need the database:** pages are prerendered from it, so `next build` and `next dev` need a real `DATABASE_URL` with migrations applied and the catalog seeded. A fake URL no longer works.
- **Ordering:** "New arrivals" are the newest 8 by `created_at`. The seed gives each product a fixed date, one day apart in list order, so the order is the same on every run.
- **Later, not version 1:** once orders exist, read stock fresh (uncached, inside `<Suspense>`) on the product page, and change stock inside transactions (this needs `drizzle-orm/neon-serverless`).

## Design system

All tokens and primitives live in `src/app/globals.css` (Tailwind v4, CSS-first; there is no `tailwind.config`). Fonts are loaded in `src/app/layout.tsx` (Jost → `--font-jost`, Cormorant Garamond → `--font-cormorant`, wordmark only).

- **Closed palette:** `--color-*: initial` removes Tailwind's default colours. Use the semantic utilities (`text-foreground`, `bg-background`, `bg-surface`, `bg-well`, `border-divider`, `text-muted`, `text-error`…) plus `black`/`white`. They resolve through runtime `--c-*` variables, so wrapping a block in `.theme-inverse` flips it to white-on-black. There is no site-wide dark mode, by design.
- **Typography:** use the `type-*` role utilities (`type-caption`, `type-body`, `type-title-s`…`type-title-xxl`, `type-display`, `type-cta`, `type-wordmark`) instead of raw `text-*`/`font-*`. Large roles get bigger at 1024px through CSS variables.
- **Layout:** `container-page` (gutter 16/32/64px), `container-prose`, `grid-page` (12 col, 8px gap), `grid-products` (edge-to-edge, 1px gaps, 2→3→4 cols), `section` (vertical rhythm), `scroll-x`, `media-product` (square frame on `well`), `media-cover` (editorial frame). The media frames don't style the image: put `object-cover` (photos) or `object-contain` (clean cut-outs) on the `next/image` `fill` image yourself. Spacing tokens: `px-gutter`, `h-header`, `py-section`.
- **Components:** `btn` + `btn-primary | btn-secondary | btn-on-image | btn-glass` (+ `btn-sm`), `btn-icon`, `btn-icon-ghost`, `link` (always underlined), `link-quiet` (underline on hover/`aria-current`), `field`. They are in `@layer components`, so utilities override them.
- **Gotcha:** don't combine a custom utility (`container-page`, `type-*`) with a Tailwind utility that sets the same property (e.g. `container-page lg:max-w-xl`, `type-wordmark text-4xl`). Which one wins isn't guaranteed. Nest an extra element instead, or use the provided variable (`[--wordmark-size:…]`).
- **Radius:** square everywhere. The scale is reset; only `rounded-xs` (2px, fields) and `rounded-full` exist.
- Breakpoints: Tailwind defaults, except `xl` = 1440px and `2xl` = 1920px.

## Config notes

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. These change data-fetching and caching rules. Check `node_modules/next/dist/docs/` before writing data-fetching code.
- Tailwind v4 is compiled through the `@tailwindcss/turbopack` loader in `next.config.ts` (there is no PostCSS config). Theme tokens live in `src/app/globals.css`.
- `.gitignore` ignores `.env*` but keeps `.env.example`.
