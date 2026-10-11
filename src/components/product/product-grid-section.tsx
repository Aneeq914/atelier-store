import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/db/queries/catalog";

type Props = {
  id: string;
  eyebrow?: string;
  title: string;
  link?: { label: string; href: string };
  products: Product[];
};

/** Section heading plus an edge-to-edge product grid (home, product page). */
export function ProductGridSection({ id, eyebrow, title, link, products }: Props) {
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
      <ul className="grid-products">
        {products.map((product) => (
          <li key={product.slug}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
