---
name: build-ui
description: Build or update customer-facing ecommerce UI in Atelier Store using the existing design system, components, product patterns and responsive conventions. Use whenever creating or significantly changing a customer-facing page, section or component (storefront pages such as home, collections, product, bag or account; product cards and grids; navigation; empty states), even if the request just says "add a page", "build a section" or "make it match the rest of the site". Not for backend-only, database-only, auth or config changes with no visible UI.
argument-hint: <page, section or component to build or change>
---

# Build UI

Build or update the following UI:

$ARGUMENTS

The goal is UI that looks like it was always part of the store: same type, spacing, cards, grids and states as the pages around it, reading real data the same way they do, and verified in a browser before calling it done. Work through the steps in order; each one exists because skipping it caused a real problem before.

## 1. Inspect the current implementation first

Read `CLAUDE.md`, especially **Design system**, **Storefront** and **Database conventions**. Then open the pages closest to what you're building (for example `src/app/(store)/collections/new/page.tsx` for a listing, `products/[slug]/page.tsx` for a detail view) and the components they render.

Search for links that already point at the new UI (`grep -rn "/the-route" src`). Menus, tiles and breadcrumbs often link to routes that 404 today, and they tell you the expected URL and how people will arrive.

## 2. Search for reusable components before creating new ones

Look in `src/components/` (`product/`, `collection/`, `home/`, `layout/`) before writing markup. The building blocks are product cards and grids, grid sections, collection headers, collection navigation, count rows with empty states, breadcrumbs and the services strip.

If the new UI needs markup that an existing page already has inline, extract a shared component and move the existing page onto it. Don't make a near-copy: copies drift apart, and then pages stop matching. Keep the refactor to what the new UI needs.

## 3. Reuse the existing design system and patterns

- **Type:** `type-*` role utilities, never raw `text-*` sizes or `font-*` weights.
- **Colour:** semantic colours only (`text-muted`, `bg-surface`, `border-divider`…). The palette is closed, so don't add colours.
- **Layout:** `container-page`, `grid-products`, `media-product` or `media-cover`, `section` and `pt-section`. Use the `btn`, `link` and `link-quiet` classes. Corners stay square.
- **Gotcha:** don't put a custom utility and a Tailwind utility for the same property on one element (for example `container-page max-w-xl`). Nest an extra element instead.
- **Copy and links:** page text goes in `src/lib/sample-data.ts`, which must not import `src/db`. Fixed hrefs and URL builders go in `src/lib/routes.ts`. Reuse them so wording and URLs stay in one place.

## 4. Keep the change focused on the requested feature

Build what was asked. Things you notice along the way, like a missing filter, an unbranded 404 or an editorial page nobody built, go in the summary as follow-ups rather than into the code. Small enabling refactors from step 2 are fine; redesigning neighbouring pages is not.

## 5. Keep responsive behaviour consistent

Match the existing breakpoints: product grids go 2 → 3 → 4 columns, and gutters come from `container-page`. Check three widths: 390 (phone), 820 (tablet) and 1440 (desktop).

Problems seen before, worth checking each time:
- **A current item hidden off-screen.** In a sideways-scrolling row, the current item can sit out of view with nothing showing there's more. Prefer wrapping short link lists.
- **A single word alone on the last line of an intro.** `text-pretty` fixes it.
- **Grids that look broken with little data.** Some categories have only 1–3 products, so design for that with real data.
- **Image loading.** Load images in the first visible row eagerly (`eagerCount` on `ProductGrid`, usually 4) and everything else lazily.

## 6. Follow the current product and database patterns

- **Data access:** read data only through `src/db/queries/catalog.ts`. Components never import `db`. New reads follow the existing pattern there: `"use cache"`, `cacheTag("catalog")`, `cacheLife("minutes")`, and mapping to the existing `Product` or `Category` shape.
- **Money and stock:** prices are cents, formatted with `formatPrice`. Stock labels come from `src/lib/stock.ts`.
- **Dynamic routes:** for example `[slug]`. Use `generateStaticParams`, look up the record *before* rendering, call `notFound()` when it's missing, and export `ensureStatic = "navigation"` and `instant = false`. Without that, unknown URLs return 200 instead of 404. Don't move the lookup inside `<Suspense>`.
- **Empty states:** give every list a short message and a link onward.
- **Schema changes:** if the UI seems to need a new column, such as a category description, stop and ask. Schema changes go through the migration workflow in `CLAUDE.md` and are a separate decision.

## 7. Run and visually verify the application

1. **Dev server:** check whether port 3000 is already in use. Next.js refuses a second dev server in the same folder, so reuse a running one. Its log is `.next/dev/logs/next-development.log`. Don't stop a server you didn't start; it may be the user's.
2. **Status codes:** use `curl` on every new route, plus an unknown slug, which must return 404.
3. **Look at it in a real browser.** Use Claude in Chrome when it's connected:
   - Click the real way in (menu, tile, breadcrumb, "View all") and use Back.
   - Read the console. "Message channel closed" errors come from extensions, so ignore them.
   - **Leave the last tab open when done.** Closing it quits Chrome on this machine, and `about:blank` is refused.
   - Chrome won't go narrower than about 650px. For true phone width, use headless Edge through `puppeteer-core` at 390×844.
4. **What to check:** layout matches neighbouring pages, no sideways scrolling, real states show (sold out, badges, low counts, empty), and entry links work.
5. **Hidden extra elements:** Next.js keeps the previous page hidden in the page code. When counting elements in a script, count only visible ones (`el.checkVisibility()`).

## 8. Run the normal project checks

```bash
npx next typegen        # after adding routes (PageProps types)
npx tsc --noEmit
npm run lint
npm test
npx next build          # needs DATABASE_URL; confirm new routes are prerendered (○, 1m / 1h)
```

Signed-in pages (`/account/*`, `/admin`, `/sign-in`, `/sign-up`) build as dynamic (ƒ) by design, because they read the session. Catalog pages must stay ○ or ◐.

## 9. Fix reproducible issues without expanding scope

Fix what you can reproduce in steps 7–8, then re-run the affected checks. If something is broken but unrelated to this change, report it instead of fixing it.

## 10. Summarize what changed

Keep it short, with the key points first and in plain words:

- **What was built:** in the user's terms (the route, what's on it, which links now work).
- **Changes:** the main files, including any shared components extracted.
- **Verification:** a small table of what was checked and the result.
- **Issues found and fixed** during verification.
- **Things to know:** limits, follow-ups, and anything that needs a decision.
- **Commit status.** Don't commit or push unless asked.
