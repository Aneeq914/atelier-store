// Stock rules shown to shoppers. Plain functions, safe to use anywhere.

export type StockStatus = "in_stock" | "low_stock" | "sold_out";

export const LOW_STOCK_THRESHOLD = 3;

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return "sold_out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export function getStockLabel(stock: number) {
  switch (getStockStatus(stock)) {
    case "sold_out":
      return "Sold out";
    case "low_stock":
      return `Only ${stock} left`;
    default:
      return "In stock";
  }
}
