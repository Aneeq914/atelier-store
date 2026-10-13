import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import type { Product } from "@/db/queries/catalog";

type Props = {
  id: string;
  eyebrow?: string;
  title: string;
  link?: { label: string; href: string };
  products: Product[];
  /** Load the first N images eagerly when the section starts above the fold. */
  eagerCount?: number;
};

/** Section heading plus an edge-to-edge product grid (home, product page). */
export function ProductGridSection({ id, eyebrow, title, link, products, eagerCount }: Props) {
  return (
    <section aria-labelledby={id} className="pt-section">
      <div className="container-page mb-6 flex items-end justify-between gap-4 lg:mb-8">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="type-caption text-muted">{eyebrow}</p>}
          <h2 id={id} className="type-title-m">
            {title}
          </h2>
        </div>
        {link && (
          <Link href={link.href} className="type-caption-strong link shrink-0">
            {link.label}
          </Link>
        )}
      </div>
      <ProductGrid products={products} eagerCount={eagerCount} />
    </section>
  );
}
