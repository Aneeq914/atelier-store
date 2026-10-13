// Catalog reads for the storefront. Pages and components use these functions,
// never `db` directly. Results are cached under the "catalog" tag: after a write,
// call updateTag("catalog") in a Server Action or revalidateTag("catalog", "max").

import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products, productStock, type ProductImage } from "@/db/schema";
import { categoryHref } from "@/lib/routes";
import { toLikePattern, toPrefixPattern, toSearchTerms } from "@/lib/search";

export type Category = { id: number; slug: string; name: string; href: string };

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  /** USD, in cents. */
  price: number;
  /** Units available; 0 when the product has no stock row. */
  stock: number;
  styleCode: string;
  colour: string;
  badge?: string;
  summary: string;
  description: string;
  details: string[];
  /** The first image is the listing image. */
  images: ProductImage[];
  imageAspect: "portrait" | "landscape";
};

const withRelations = { category: true, stock: true } as const;

type ProductRow = NonNullable<Awaited<ReturnType<typeof findProduct>>>;

function findProduct(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: withRelations,
  });
}

function toCategory(row: { id: number; slug: string; name: string }): Category {
  return { id: row.id, slug: row.slug, name: row.name, href: categoryHref(row.slug) };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: toCategory(row.category),
    price: row.priceCents,
    stock: row.stock?.quantity ?? 0,
    styleCode: row.styleCode,
    colour: row.colour,
    badge: row.badge ?? undefined,
    summary: row.summary,
    description: row.description,
    details: row.details,
    images: row.images,
    imageAspect: row.imageAspect,
  };
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const row = await findProduct(slug);
  return row ? toProduct(row) : null;
}

export async function getProductSlugs() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((row) => row.slug);
}

/** In menu order. */
export async function getCategories() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const rows = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
  return rows.map(toCategory);
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const row = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  return row ? toCategory(row) : null;
}

/** Every product in the category, newest first. Add pagination before categories get large. */
export async function getProductsByCategory(categoryId: number) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    where: eq(products.categoryId, categoryId),
    with: withRelations,
    orderBy: [desc(products.createdAt)],
  });
  return rows.map(toProduct);
}

/** Newest products first, optionally leaving out one category. */
export async function getNewArrivals(limit = 8, excludeCategoryId?: number) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    where: excludeCategoryId === undefined ? undefined : ne(products.categoryId, excludeCategoryId),
    with: withRelations,
    orderBy: [desc(products.createdAt)],
    limit,
  });
  return rows.map(toProduct);
}

/** Same category first, then the rest of the catalog, newest first within each group. */
export async function getRelatedProducts(productId: number, categoryId: number, limit = 4) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    where: ne(products.id, productId),
    with: withRelations,
    orderBy: [desc(sql`${products.categoryId} = ${categoryId}`), desc(products.createdAt)],
    limit,
  });
  return rows.map(toProduct);
}

/**
 * Products where every search term appears in the name, colour, summary or
 * category name, or whose style code starts with the whole query (codes match
 * by prefix only, so "100" doesn't find "AT 1001"). Whole-query name matches
 * come first, then newest.
 */
export async function searchProducts(query: string, limit = 48) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const terms = toSearchTerms(query);
  if (terms.length === 0) return [];

  const matches = await db
    .select({ id: products.id })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(
      or(
        and(
          ...terms.map((term) => {
            const pattern = toLikePattern(term);
            return or(
              ilike(products.name, pattern),
              ilike(products.colour, pattern),
              ilike(products.summary, pattern),
              ilike(categories.name, pattern),
            );
          }),
        ),
        ilike(products.styleCode, toPrefixPattern(query)),
      ),
    )
    .orderBy(desc(sql`${products.name} ilike ${toLikePattern(query)}`), desc(products.createdAt))
    .limit(limit);
  if (matches.length === 0) return [];

  // Load the full rows (with category and stock), then restore the ranked order.
  const ids = matches.map((match) => match.id);
  const rows = await db.query.products.findMany({
    where: inArray(products.id, ids),
    with: withRelations,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toProduct(row)] : [];
  });
}

/** Catalog totals for the admin overview. A product with no stock row counts as sold out. */
export async function getCatalogCounts() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const [row] = await db
    .select({
      products: sql<number>`count(*)::int`,
      soldOut: sql<number>`count(*) filter (where coalesce(${productStock.quantity}, 0) = 0)::int`,
      categories: sql<number>`(select count(*)::int from ${categories})`,
    })
    .from(products)
    .leftJoin(productStock, eq(productStock.productId, products.id));
  return row;
}

/**
 * Products in the shopping bag, read fresh (no "use cache"): the bag and the
 * bag actions must see the current price and stock, not a minute-old copy.
 */
export async function getBagProducts(ids: number[]) {
  if (ids.length === 0) return [];
  const rows = await db.query.products.findMany({
    where: inArray(products.id, ids),
    with: withRelations,
  });
  return rows.map(toProduct);
}
