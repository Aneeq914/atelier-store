// Catalog reads for the storefront. Pages and components use these functions,
// never `db` directly. Results are cached under the "catalog" tag: after a write,
// call updateTag("catalog") in a Server Action or revalidateTag("catalog", "max").

import { desc, eq, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { products, type ProductImage } from "@/db/schema";
import { categoryHref } from "@/lib/routes";

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

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: {
      id: row.category.id,
      slug: row.category.slug,
      name: row.category.name,
      href: categoryHref(row.category.slug),
    },
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

/** Newest products first. */
export async function getNewArrivals(limit = 8) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
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
