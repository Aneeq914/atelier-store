// Loads the sample catalog: `npm run db:seed`.
// Safe to re-run: rows are upserted by slug, and stock is reset to the seed values.
// Runs as a single db.batch(), so on the Neon HTTP driver it is all-or-nothing.

import { sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products, productStock } from "./schema";
import { seedCategories, seedProducts } from "./seed-data";

const DAY = 24 * 60 * 60 * 1000;
// Fixed dates keep "New arrivals" order the same on every run.
const NEWEST = Date.UTC(2026, 9, 1);

const categoryIdOf = (slug: string) => sql`(select id from ${categories} where slug = ${slug})`;
const productIdOf = (slug: string) => sql`(select id from ${products} where slug = ${slug})`;
const excluded = (column: string) => sql.raw(`excluded.${column}`);

async function main() {
  const categoryRows = seedCategories;

  const productRows = seedProducts.map(({ categorySlug, quantity, ...product }, index) => ({
    ...product,
    categoryId: categoryIdOf(categorySlug),
    createdAt: new Date(NEWEST - index * DAY),
  }));

  const stockRows = seedProducts.map((product) => ({
    productId: productIdOf(product.slug),
    quantity: product.quantity,
  }));

  await db.batch([
    db
      .insert(categories)
      .values(categoryRows)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: excluded("name"), position: excluded("position") },
      }),
    db
      .insert(products)
      .values(productRows)
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          categoryId: excluded("category_id"),
          name: excluded("name"),
          styleCode: excluded("style_code"),
          colour: excluded("colour"),
          priceCents: excluded("price_cents"),
          badge: excluded("badge"),
          summary: excluded("summary"),
          description: excluded("description"),
          details: excluded("details"),
          images: excluded("images"),
          imageAspect: excluded("image_aspect"),
          createdAt: excluded("created_at"),
          updatedAt: sql`now()`,
        },
      }),
    db
      .insert(productStock)
      .values(stockRows)
      .onConflictDoUpdate({
        target: productStock.productId,
        set: { quantity: excluded("quantity"), updatedAt: sql`now()` },
      }),
  ]);

  console.log(
    `Seeded ${categoryRows.length} categories, ${productRows.length} products and their stock.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
