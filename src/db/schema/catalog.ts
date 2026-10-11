import { relations, sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Column names are camelCase here and snake_case in SQL (`casing: "snake_case"`).

export type ProductImage = {
  src: string;
  alt: string;
  /** CSS object-position, used when the frame crops the photo. */
  position?: string;
  /** Source page, for attribution. */
  credit?: string;
};

export const imageAspect = pgEnum("image_aspect", ["portrait", "landscape"]);

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  /** Display order in menus and tiles. */
  position: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer()
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text().notNull().unique(),
    name: text().notNull(),
    styleCode: text().notNull().unique("products_style_code_unique"),
    colour: text().notNull(),
    /** USD, in cents: 189000 = $1,890. */
    priceCents: integer().notNull(),
    badge: text(),
    summary: text().notNull(),
    description: text().notNull(),
    details: text().array().notNull().default(sql`'{}'::text[]`),
    /** Ordered; the first image is the listing image. */
    images: jsonb().$type<ProductImage[]>().notNull().default(sql`'[]'::jsonb`),
    imageAspect: imageAspect().notNull().default("portrait"),
    /** "New arrivals" sort by this. */
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    check("products_price_cents_check", sql`${t.priceCents} >= 0`),
  ],
);

// One row per product. Kept separate from `products` so stock (which changes
// often) can later move to per-variant rows without touching the catalog.
export const productStock = pgTable(
  "product_stock",
  {
    productId: integer()
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("product_stock_quantity_check", sql`${t.quantity} >= 0`)],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  stock: one(productStock),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, { fields: [productStock.productId], references: [products.id] }),
}));
