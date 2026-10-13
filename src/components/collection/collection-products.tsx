import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import type { Product } from "@/db/queries/catalog";

type Props = {
  label: string;
  products: Product[];
  empty: { message: string; link: { label: string; href: string } };
  /** How the list is ordered, shown on the right of the count row. */
  sortLabel?: string;
};

/** Product count, then the grid; a short message and a way out when there's nothing to show. */
export function CollectionProducts({ label, products, empty, sortLabel = "Newest first" }: Props) {
  if (products.length === 0) {
    return (
      <div className="container-page">
        <div className="flex flex-col items-start gap-6 border-t py-16">
          <p className="type-body">{empty.message}</p>
          <Link href={empty.link.href} className="btn btn-secondary">
            {empty.link.label}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section aria-label={label}>
      <div className="container-page">
        <p className="type-caption flex justify-between gap-4 border-t py-4 text-muted">
          <span>
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </span>
          <span>{sortLabel}</span>
        </p>
      </div>
      {/* The first row is above the fold on every breakpoint (2 → 3 → 4 columns). */}
      <ProductGrid products={products} eagerCount={4} />
    </section>
  );
}
