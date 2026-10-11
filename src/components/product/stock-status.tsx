import { getStockLabel, getStockStatus, type StockStatus as Status } from "@/lib/stock";

const dotClass: Record<Status, string> = {
  in_stock: "bg-success",
  low_stock: "bg-warning",
  sold_out: "bg-muted",
};

const textClass: Record<Status, string> = {
  in_stock: "text-foreground",
  low_stock: "text-warning",
  sold_out: "text-muted",
};

export function StockStatus({ stock }: { stock: number }) {
  const status = getStockStatus(stock);

  return (
    <p className={`type-caption-strong flex items-center gap-2 ${textClass[status]}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotClass[status]}`} />
      {getStockLabel(stock)}
    </p>
  );
}
