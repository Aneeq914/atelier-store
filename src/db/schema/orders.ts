import { relations, sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products } from "./catalog";

// Orders are created when checkout starts (status pending_payment, stock
// reserved) and only ever become `paid` through a verified payment webhook.
// Order lines copy the product name and price at that moment, so later catalog
// changes never alter a past order.

export const orderStatus = pgEnum("order_status", ["pending_payment", "paid", "expired", "failed"]);

export const orders = pgTable(
  "orders",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** Public order number used in URLs and emails, e.g. AT-7K3F9Q. */
    reference: text().notNull().unique(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatus().notNull().default("pending_payment"),
    subtotalCents: integer().notNull(),
    /** What the customer pays. Equal to the subtotal until tax or shipping charges exist. */
    totalCents: integer().notNull(),
    currency: text().notNull().default("usd"),
    paymentProvider: text().notNull(),
    /** The provider's checkout session id; set right after the session is created. */
    providerSessionId: text().unique(),
    /** When the stock reservation lapses if the order isn't paid. */
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    paidAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    index("orders_status_expires_at_idx").on(t.status, t.expiresAt),
    check("orders_totals_check", sql`${t.subtotalCents} >= 0 and ${t.totalCents} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Null if the product is later deleted; the snapshot below stays. */
    productId: integer().references(() => products.id, { onDelete: "set null" }),
    productName: text().notNull(),
    productSlug: text().notNull(),
    unitPriceCents: integer().notNull(),
    quantity: integer().notNull(),
    lineTotalCents: integer().notNull(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    check("order_items_quantity_check", sql`${t.quantity} between 1 and 10`),
    check("order_items_amounts_check", sql`${t.unitPriceCents} >= 0 and ${t.lineTotalCents} >= 0`),
  ],
);

/** Every payment webhook event already handled, so a repeated delivery does nothing. */
export const paymentEvents = pgTable("payment_events", {
  /** The provider's event id. */
  id: text().primaryKey(),
  type: text().notNull(),
  orderId: integer().references(() => orders.id, { onDelete: "set null" }),
  receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// --- Mock payment provider only ("the provider's database"). Drop with the mock.

export type MockLineItem = { name: string; unitAmount: number; quantity: number };

export const mockCheckoutSessions = pgTable("mock_checkout_sessions", {
  id: text().primaryKey(),
  amountTotal: integer().notNull(),
  currency: text().notNull(),
  lineItems: jsonb().$type<MockLineItem[]>().notNull(),
  metadata: jsonb().$type<Record<string, string>>().notNull(),
  successUrl: text().notNull(),
  cancelUrl: text().notNull(),
  status: text().$type<"open" | "complete" | "expired">().notNull().default("open"),
  paymentStatus: text().$type<"unpaid" | "paid">().notNull().default("unpaid"),
  /** A declined test card message, shown on the payment page. */
  lastError: text(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
