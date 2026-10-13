# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

Atelier Store is an eCommerce app at an early stage. The stack is wired up, and the **homepage** and **product detail page** (`/products/[slug]`) read their products from Postgres (seeded sample data). The **New arrivals** page (`/collections/new`) and **category pages** (`/collections/[slug]`) list products, and **search** (`/search?q=`) finds them. Customers can **sign up, sign in and out** (email/password), see **`/account`**, and admins reach **`/admin`** (see **Authentication**). The **shopping bag** (`/bag`) works: add, change quantity, remove, current prices, subtotal, stock limits (see **Cart**). **Checkout** creates orders and takes payment through a **mock, Stripe-shaped provider** (no real money; see **Checkout and orders**). Editorial collections aren't built, so links such as `/collections/women` and `/collections/winter` currently 404. Don't assume any of these exist.

## Commands

```bash
npm run dev            # dev server (Turbopack) on http://localhost:3000
npm run build          # production build; needs DATABASE_URL set (src/db/index.ts throws without it)
npm run lint           # ESLint (flat config, eslint-config-next)
npm test               # node:test via tsx, runs src/**/*.test.ts (single file: npx tsx --test path/to/file.test.ts)
npx tsc --noEmit       # typecheck (run `npx next typegen` first if `.next/` is missing — LayoutProps/PageProps are generated)

npm run auth:generate  # Better Auth CLI (auth@1.7.7, keep in step with better-auth): writes auth-schema.generated.ts (gitignored) to compare with src/db/schema/auth.ts
npm run auth:set-role -- <email> <customer|admin>   # the only way to change a role (e.g. make the first admin)
npm run db:generate    # drizzle-kit: create SQL migration in ./drizzle from schema
npm run db:migrate     # apply migrations to Neon
npm run db:push        # push schema directly (prototyping only)
npm run db:seed        # load the sample catalog (safe to re-run; resets stock to seed values)
```

To browse or edit data, use the Neon console (Tables / SQL Editor), not Drizzle Studio. Studio runs any SQL sent to `localhost:4983` with no auth and `Access-Control-Allow-Origin: *`, so any web page open while it runs can query the database with your `DATABASE_URL` role. Don't add a `db:studio` script back.

Tests use Node's built-in `node:test` and `node:assert`, run through `tsx` (plain `node --test` can't resolve the extensionless imports). Put them next to the code as `*.test.ts`.

## Environment

Copy `.env.example` to `.env`. Required: `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. `drizzle.config.ts` loads `.env` via `dotenv/config`; Next.js loads it on its own.

## Architecture

Stack: Next.js 16 (App Router, `src/` dir, `@/*` → `src/*`), React 19, TypeScript (strict), Tailwind CSS v4, Better Auth, Drizzle ORM, Neon Postgres.

How the pieces connect:

- `src/db/schema/index.ts` exports every table (catalog tables in `catalog.ts`). It feeds Drizzle Kit (`drizzle.config.ts`) and the runtime client (`src/db/index.ts`), and is passed to the Better Auth Drizzle adapter. Auth tables are in `auth.ts` (migration `drizzle/0001_auth.sql`).
- `src/db/index.ts` exports `db`, built on the **Neon HTTP driver** (`drizzle-orm/neon-http`), for all reads and simple writes. It can't run interactive transactions, so `src/db/tx.ts` exports `txDb` (`drizzle-orm/neon-serverless`, a WebSocket `Pool`), used **only** for writes that must be all-or-nothing and lock rows: starting checkout and applying payment webhooks.
- `src/lib/auth.ts` is the server-side Better Auth instance (Drizzle adapter with `provider: "pg"`, email/password enabled, `nextCookies()` plugin so Server Actions can set auth cookies). Import it only from server code. Its `logger` is `authLogger` (`src/lib/auth-logger.ts`), which writes each log as one JSON line with control characters escaped, because Better Auth logs request values such as a rejected `callbackURL` as-is. Keep it.
- `src/app/api/auth/[...all]/route.ts` mounts Better Auth via `toNextJsHandler(auth)`; all auth HTTP endpoints live under `/api/auth/*`.
- `src/lib/auth-client.ts` exports `authClient` (`better-auth/react`) for client components.

Storefront:

- `src/app/(store)/layout.tsx` wraps storefront pages with `SiteHeader` and `SiteFooter`. The root layout stays bare, so auth or admin pages can live outside the `(store)` group.
- `SiteHeader` (client) is fixed. On paths in its `OVERLAY_PATHS` set it floats transparent with white content over a full-bleed first section and turns solid after scrolling. On every other path it renders a spacer so content starts below it. If you add a page that opens with a full-bleed image, add its path to that set. The menu is a native `<dialog>` drawer.
- `src/components/home/*` are the homepage sections. `src/components/collection/*` are shared by every collection page: `CollectionHeader` (eyebrow, h1, optional intro; also used by auth and account pages), `CollectionNav` (New arrivals plus every category, built on `LinkRow` from `src/components/layout/link-row.tsx`, the shared row of text links with the current one underlined; it wraps instead of scrolling so the current link is always visible) and `CollectionProducts` (count row plus grid, or an empty state). `src/components/product/*` is shared by every page that shows products: `ProductCard`, `ProductGrid` (the edge-to-edge grid; `eagerCount` loads the first images eagerly when the grid starts above the fold), `ProductGridSection` (heading plus `ProductGrid`), `StockStatus`, `ProductGallery`, `ProductAccordion`, `AddToBagButton`.
- Product data comes from the database through `src/db/queries/catalog.ts` (see **Database conventions**). The stock rules are in `src/lib/stock.ts` (`getStockStatus`: 0 means sold out, up to `LOW_STOCK_THRESHOLD` (3) means low stock). `src/lib/sample-data.ts` holds page copy and editorial imagery; client components import it, so it must not import from `src/db`. Category links are built by `categoryHref()` in `src/lib/routes.ts`, which also holds `NEW_ARRIVALS_HREF` (`/collections/new`). That's a fixed route under `/collections`, so no category may use the slug `new`. The homepage section and the New arrivals page share their copy (`newArrivals` in `sample-data.ts`) and `getNewArrivals()` order; the page shows up to 24. Photos are local files in `public/images/sample/` (from Pexels, with a `credit` URL on each), built by `photo()` in `src/lib/sample-images.ts`. `src/lib/format.ts` has `formatPrice` (takes cents).
- **Product page, 404s and partialPrefetching:** `/products/[slug]` lists every product in `generateStaticParams`, awaits `params` and looks up the product **before** rendering, and calls `notFound()` for unknown slugs. It exports:
  - `ensureStatic = "navigation"`: an unknown slug waits for the full page instead of getting the streamed fallback shell, so it returns a real **404** (in dev and production). This requires every read on the page to be cached (`"use cache"`, `cacheLife` of at least `"minutes"`).
  - `instant = false`: silences the dev warning "URL data outside of Suspense", which is expected for this approach.
  - Don't move the product lookup inside `<Suspense>`. Once streaming starts, `notFound()` can only send status 200 with `noindex`. Use this pattern for any dynamic route where a missing record must return 404.
  - `/collections/[slug]` (category pages) uses the same pattern. It also shows "New elsewhere" (`getNewArrivals(4, categoryId)`), so categories with few products don't end on a near-empty grid. The static `/collections/new` route takes precedence over `[slug]`.
- **Search (`/search`):** the header icon links here. The page shell is static; everything that depends on `q` sits in one `<Suspense>` that awaits `searchParams` and passes the cleaned query to the cached `searchProducts()`. That's the pattern for any page that reads `searchParams`. The form is `next/form` (a GET form, submitted as a client-side navigation).
  - **How matching works:** term handling lives in `src/lib/search.ts` (tested). Every word must appear in the name, colour, summary or category name, with plurals reduced ("boots" → "boot"). Style codes match only when the whole query is the start of the code, so "100" doesn't find "AT 1001". LIKE wildcards are escaped. There's no fuzzy matching or Postgres full-text search yet, so "100ml" misses "100 ml".
  - Results are `noindex`. With no query, it shows collection links and new arrivals; with no results, collection links and a link onward.
- **No hard-coded DOM ids in reusable components.** Next keeps the previous page hidden in the document, so two copies of a form can both be present. Fixed ids then collide, and labels and `aria-describedby` point at the wrong element. Use `useId()`, as `AuthForm` does.
- Product images: set `imageAspect: "landscape"` (the `image_aspect` column) on products whose photos are 4:3. The gallery then uses 4:3 frames instead of cropping them into 4:5.

## Database conventions

The catalog lives in Postgres (Neon) through Drizzle: schema in `src/db/schema/catalog.ts`, first migration in `drizzle/0000_catalog.sql`, seed data in `src/db/seed-data.ts`. Follow these rules for any change to it.

- **Version 1 scope:** tables are:
  - the catalog (`categories`, `products`, `product_stock`);
  - auth;
  - orders (`orders`, `order_items`, `payment_events`, all in `schema/orders.ts`, migration `0002_orders.sql`);
  - `mock_checkout_sessions`, which belongs to the mock provider only. Drop it with the mock.

  The bag deliberately has **no tables** (it's a cookie; see **Cart**). Don't add reviews, wishlists or product variants unless asked.
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
- **Schema files:** all schema lives in `src/db/schema/`: `catalog.ts`, `auth.ts` (hand-written to Better Auth's core schema plus `role`; after changing auth config or plugins, run `npm run auth:generate` and copy any new fields across, don't overwrite), and `index.ts`, which exports everything. Add new table groups as new files and export them from `index.ts`.
- **Migrations:**
  - Workflow: change the schema → `npm run db:generate` → review the SQL → commit `drizzle/` → `npm run db:migrate`.
  - `db:push` is only for throwaway prototypes, never production.
  - Neon branches: `dev` for local work (`DATABASE_URL` in `.env`), `main` for production. Deploys run migrations before `next build`.
- **Seeding:** `src/db/seed.ts` (script `db:seed`, run with `tsx`) loads `src/db/seed-data.ts`. It must be safe to re-run (upsert by slug), and must use `db.batch()` so it's all-or-nothing on the HTTP driver.
- **Reading data:**
  - Pages and components never import `db`. All catalog reads go through `src/db/queries/catalog.ts`: `getProductBySlug`, `getProductSlugs`, `getNewArrivals` (optionally excluding a category), `getRelatedProducts`, `getCategories`, `getCategoryBySlug`, `getProductsByCategory` (no pagination yet; add it before categories grow past a few dozen products), `searchProducts`. Add new reads there, following the same caching pattern.
  - These map rows to the existing `Product` shape, so components don't change. Two things to know: `category` is `{ id, slug, name, href }`, and `price` is in cents. A product with no stock row counts as 0 (sold out).
  - Each query uses `"use cache"`, `cacheTag("catalog")` and `cacheLife("minutes")`.
  - After writes, invalidate with `updateTag("catalog")` in Server Actions, or `revalidateTag("catalog", "max")` elsewhere.
  - The stock rules stay as plain functions in `src/lib/stock.ts`.
- **Builds need the database:** pages are prerendered from it, so `next build` and `next dev` need a real `DATABASE_URL` with migrations applied and the catalog seeded. A fake URL no longer works.
- **Ordering:** "New arrivals" are the newest 8 by `created_at`. The seed gives each product a fixed date, one day apart in list order, so the order is the same on every run.
- **Stock changes go through transactions** (`txDb`): reserved when checkout starts, given back on expiry, cancel or failure. The product page still shows stock up to a minute old; the bag and checkout read it fresh.

## Checkout and orders

There's no real payment provider yet. **`PAYMENT_PROVIDER=mock`** is a Stripe-shaped test provider: a hosted page at `/mock-checkout/[id]`, signed webhooks, and session expiry. It needs `PAYMENT_WEBHOOK_SECRET` (32+ characters) and **refuses to run in production**, because anyone could mark orders paid with it. Not in version 1: tax, shipping charges, refunds, emails, order history, guest checkout.

- **Trust rules:**
  - The browser never sends prices or payment status.
  - Order lines copy the name and unit price from the database **inside the checkout transaction**.
  - An order becomes `paid` **only** through a verified webhook (HMAC `t=…,v1=…` over the raw body, at most 5 minutes old), **and** the provider's amount and currency must equal `orders.total_cents`.
  - The return URL (`/checkout/return`) proves nothing. It only clears the bag and shows the order page.
- **Flow:**
  - `startCheckoutAction` (`src/lib/checkout-actions.ts`, signed-in only) calls `startOrder()` (`src/db/queries/orders.ts`). In one transaction, that:
    - expires overdue reservations and this shopper's previous unfinished checkout;
    - locks the `product_stock` rows (`FOR UPDATE`, in id order);
    - runs `prepareOrder()` (`src/lib/orders.ts`);
    - reserves the stock;
    - inserts the `pending_payment` order with 32-minute expiry.
  - Then the provider session is created (30 minutes) and the shopper is redirected. If the provider fails, `failPendingOrder()` gives the stock back.
- **Webhook** (`/api/webhooks/payments`):
  - It checks the signature, returning 400 if invalid, then calls `applyPaymentEvent()`. In one transaction, that records the event id in `payment_events` (a duplicate does nothing), locks the order, and applies `transitionOrder()`.
  - Only `pending_payment` orders move:
    - completed + paid + matching amount → `paid`;
    - a mismatch → `failed`, with stock kept, for review;
    - expired → `expired`, with stock given back.
  - It returns 500 on an unexpected error so the provider retries.
  - A paid event for an order that's no longer pending is logged as needing review.
- **Failed or abandoned payments:**
  - A declined card leaves the session open, so the shopper can retry.
  - Cancel goes through `/checkout/cancel`, which expires the session. Its webhook expires the order and restocks, and the bag stays.
  - An abandoned session expires.
  - Each new checkout also expires overdue orders, as a safety net.
- **Pages:**
  - `/checkout/orders/[reference]`: the owner only (anyone else gets a 404). It shows paid, pending (re-checks every 2 seconds, up to about 30) or closed.
  - `/bag`: Checkout or "Sign in to check out".
- **Moving to Stripe:**
  - Add `src/lib/payments/stripe.ts` implementing `PaymentProvider`:
    - `checkout.sessions.create` with `price_data` from the order lines and `expires_at`;
    - `checkout.sessions.expire`;
    - `webhooks.constructEvent`, mapped to `PaymentEvent`.
  - Select it in `getPaymentProvider()`.
  - Then drop the mock page, `mock.ts` and `mock_checkout_sessions`.
  - Test once against Stripe test mode: retries, signature format, async payment methods.

## Cart (the bag)

The bag itself never reserves stock; checkout does (see above).

- **Persistence:**
  - One httpOnly cookie, `atelier_bag` (30 days), holding **only** product ids and quantities: `12:1,7:2` (URL-encoded on the wire).
  - It works the same for guests and signed-in shoppers.
  - Signing in keeps it; `signOutAction` clears it.
  - It isn't synced across devices. A database cart belongs with checkout and orders.
- **Never trust the cookie:**
  - Prices, names and stock always come from the database.
  - `parseBag` skips malformed parts and merges duplicates (max 50 lines).
  - Every quantity is clamped to `maxQuantity(stock)`, which is `min(stock, MAX_PER_LINE = 10)`.
  - No signing is needed, because tampering can only shrink the bag.
- **Where things live:**
  - The rules are in `src/lib/cart.ts` (pure, tested): `parseBag`, `addLine`, `setLineQuantity`, `removeLine`, and `reconcileBag`, which returns items, an integer-cent subtotal and the count.
  - `src/lib/bag-cookie.ts` (server only) has `readBag`, `writeBag` (Server Actions only) and `clearBag`.
  - `src/lib/cart-actions.ts` has `addToBagAction`, `updateBagQuantityAction` and `removeFromBagAction`. Each validates its input, reads stock fresh, applies the rules, writes the cookie, and calls `refresh()`.
- **Fresh stock:** the bag and its actions use `getBagProducts()` (`catalog.ts`), which is **uncached** on purpose. Catalog pages keep their one-minute cache.
- **Stock that drops after adding:**
  - `/bag` shows the lower quantity ("reduced") or "Sold out" (not charged).
  - The cookie is corrected on the next change, because rendering can't write cookies.
- **UI:**
  - `AddToBagButton` (product page; the page stays static) and `BagLineControls` (−/+ and Remove) are forms posting to the actions, so they work without JavaScript.
  - `/bag` reads the cookie, so it's dynamic, with `instant = false`.
  - There's no header count badge yet. A badge would need a client-readable count, because the header is on static pages.

## Authentication

Better Auth 1.7.7, email/password only. Not in version 1: social sign-in, password reset, email verification, 2FA. Add them only when asked.

- **Config:** behaviour (password rules, 30-day sessions refreshed daily, the `role` field) is in `src/lib/auth-options.ts`, shared by `src/lib/auth.ts` and the tests. The cookie cache stays **off**, so every session read hits the database. That's why role changes and revoked sessions apply on the next request, and `databaseSessionRevocation` depends on it.
- **Roles:**
  - `user.role` is `customer` (default) or `admin`, with a database check constraint.
  - It's a Better Auth `additionalField` with `input: false`: sign-up ignores a client-sent role, and `update-user` rejects it.
  - Change it only with `npm run auth:set-role`.
  - **Don't** add an env list of admin emails. Without email verification, anyone could sign up with that address first.
  - **Don't** switch to the `admin` plugin without a reason; it adds ban and impersonation endpoints.
- **Checking access (the security boundary):** use `src/lib/session.ts` (server only):
  - `getSession()` reads the session once per request.
  - `requireUser(returnTo)` redirects to sign-in.
  - `requireAdmin()` redirects signed-out visitors and sends a 404 to non-admins.
  - Call them **at the top of every protected page** (with `export const instant = false`, so redirects are real 307s and 404s) **and inside every protected Server Action**.
  - Never rely on a layout: layouts don't re-run on navigation. `src/app/admin/layout.tsx` deliberately makes no auth decision.
- **`src/proxy.ts`:** an optimistic gate for `/account/*` and `/admin/*`. No session cookie means a redirect to `/sign-in?next=…`. It only checks that the cookie exists, so it's not a security check.
- **Forms:**
  - Sign-up, sign-in and sign-out are Server Actions in `src/lib/auth-actions.ts`. They call `auth.api.*` with `headers: await headers()`, and `nextCookies()` (keep it the last plugin) sets the cookie.
  - `updateNameAction` (account details) also lives there and calls `requireUser()` first.
  - **Validation rules are shared:** `src/lib/auth-validation.ts` (tested) is used by the browser and by every action. Actions return `{ fieldErrors, formError, values, saved }`.
  - They work without JavaScript, because the server returns the same field errors.
  - With JavaScript, `AuthForm` (`src/components/auth/`) adds:
    - checks before sending, with a message under each field that clears as it's fixed;
    - focus on the first problem;
    - a pending button and `aria-busy`;
    - a Show/Hide password toggle and a "saved" message.
  - Add new account forms to it (a new `FormKind`) rather than building another form.
  - Wrong email or password gets one generic message. "Account already exists" links to sign-in, keeping `next`.
  - `?next=` always goes through `safeNextPath()` (`src/lib/auth-routes.ts`), which blocks off-site redirects.
- **Pages:**
  - `/sign-in` and `/sign-up` send signed-in visitors on.
  - The account area is `/account` (overview) and `/account/details` (edit name; email is read-only). Both are wrapped in `AccountShell` (breadcrumbs, heading, the account `LinkRow` with Sign out, plus Admin for admins).
  - New account pages: add a link in `AccountShell`, and call `requireUser()` on the page. No order history yet.
  - `/admin` has its own minimal layout outside the store.
  - All of these pages are `noindex`.
- **The header doesn't read the session,** so catalog pages stay static. The account icon links to `/account`.

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
