// Shopping bag rules. Pure functions, no I/O: the Server Actions and /bag call
// them with fresh product data from the database.
//
// The bag cookie holds only product ids and quantities ("12:1,7:2"). It is
// never trusted: prices, names and stock always come from the database, and
// every quantity is clamped to what can actually be bought.

export type BagLine = { productId: number; quantity: number };

/** Most distinct products in one bag (keeps the cookie well under 4 KB). */
export const MAX_LINES = 50;
/** Most of one product per bag, whatever the stock. */
export const MAX_PER_LINE = 10;

/** How many of a product can be in the bag right now. */
export function maxQuantity(stock: number) {
  return Math.max(0, Math.min(Math.floor(stock), MAX_PER_LINE));
}

/** Reads the cookie value. Bad parts are skipped and duplicates merged, so a tampered cookie never throws. */
export function parseBag(raw: string | undefined | null): BagLine[] {
  if (!raw) return [];
  const quantities = new Map<number, number>();
  for (const part of raw.split(",")) {
    const match = /^(\d{1,9}):(\d{1,6})$/.exec(part.trim());
    if (!match) continue;
    const productId = Number(match[1]);
    const quantity = Number(match[2]);
    if (productId < 1 || quantity < 1) continue;
    if (!quantities.has(productId) && quantities.size >= MAX_LINES) continue;
    quantities.set(productId, Math.min((quantities.get(productId) ?? 0) + quantity, MAX_PER_LINE));
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function serializeBag(lines: BagLine[]) {
  return lines.map((line) => `${line.productId}:${line.quantity}`).join(",");
}

export type BagChange = {
  lines: BagLine[];
  /** The change didn't happen (or only partly); say why. */
  error?: string;
  /** The change happened but was adjusted (e.g. clamped to stock). */
  notice?: string;
};

function limitMessage(max: number, stock: number) {
  if (max < stock) return `You can have up to ${MAX_PER_LINE} of each piece.`;
  return stock === 1 ? "Only 1 available, and it's already in your bag." : `Only ${stock} available, and they're all in your bag.`;
}

const withQuantity = (lines: BagLine[], productId: number, quantity: number) =>
  lines.some((line) => line.productId === productId)
    ? lines.map((line) => (line.productId === productId ? { productId, quantity } : line))
    : [...lines, { productId, quantity }];

/** Add `count` of a product, never beyond what can be bought. */
export function addLine(lines: BagLine[], productId: number, stock: number, count = 1): BagChange {
  const max = maxQuantity(stock);
  const current = lines.find((line) => line.productId === productId)?.quantity ?? 0;
  if (max === 0) return { lines, error: "This piece is sold out." };
  if (current === 0 && lines.length >= MAX_LINES) return { lines, error: "Your bag is full. Remove something to add this piece." };
  if (current >= max) return { lines: withQuantity(lines, productId, max), error: limitMessage(max, stock) };
  const quantity = Math.min(current + count, max);
  return {
    lines: withQuantity(lines, productId, quantity),
    notice: current + count > max ? limitMessage(max, stock) : undefined,
  };
}

/** Set a product's quantity. Below 1 removes it; above what can be bought is clamped. */
export function setLineQuantity(lines: BagLine[], productId: number, stock: number, quantity: number): BagChange {
  if (!lines.some((line) => line.productId === productId)) return { lines };
  if (quantity < 1) return { lines: removeLine(lines, productId) };
  const max = maxQuantity(stock);
  if (max === 0) return { lines: removeLine(lines, productId), notice: "This piece is sold out, so we removed it from your bag." };
  const clamped = Math.min(Math.floor(quantity), max);
  return { lines: withQuantity(lines, productId, clamped), notice: quantity > max ? limitMessage(max, stock) : undefined };
}

export function removeLine(lines: BagLine[], productId: number) {
  return lines.filter((line) => line.productId !== productId);
}

export type BagItem<P> = {
  product: P;
  /** The quantity used for the line total (after clamping to stock). */
  quantity: number;
  /** What the cookie asked for. */
  requested: number;
  /** Most that can be in the bag now (drives the + button). */
  max: number;
  /** In cents. */
  lineTotal: number;
  status: "ok" | "reduced" | "sold_out";
};

/**
 * Join the bag with current product data. Prices and stock come from
 * `products`, never the cookie. Unknown products are dropped, sold-out lines
 * are kept (so the shopper can see and remove them) but not charged.
 */
export function reconcileBag<P extends { id: number; price: number; stock: number }>(lines: BagLine[], products: P[]) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const items: BagItem<P>[] = [];
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) continue;
    const max = maxQuantity(product.stock);
    const quantity = Math.min(line.quantity, max);
    items.push({
      product,
      quantity,
      requested: line.quantity,
      max,
      lineTotal: product.price * quantity,
      status: max === 0 ? "sold_out" : quantity < line.quantity ? "reduced" : "ok",
    });
  }
  return {
    items,
    /** In cents; sold-out lines count as 0. */
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    /** Pieces that will be charged. */
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
