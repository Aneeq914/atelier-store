import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/db/queries/catalog";

type Props = {
  products: Product[];
  /** Load the first N images eagerly when the grid starts above the fold. */
  eagerCount?: number;
};

/** Edge-to-edge product grid, 2 → 3 → 4 columns. */
export function ProductGrid({ products, eagerCount = 0 }: Props) {
  return (
    <ul className="grid-products">
      {products.map((product, index) => (
        <li key={product.slug}>
          <ProductCard product={product} eager={index < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
