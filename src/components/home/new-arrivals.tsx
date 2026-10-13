import { ProductGridSection } from "@/components/product/product-grid-section";
import { getNewArrivals } from "@/db/queries/catalog";
import { NEW_ARRIVALS_HREF } from "@/lib/routes";
import { newArrivals } from "@/lib/sample-data";

export async function NewArrivals() {
  const products = await getNewArrivals();

  return (
    <ProductGridSection
      id="new-arrivals-title"
      eyebrow={newArrivals.eyebrow}
      title={newArrivals.title}
      link={{ label: "View all", href: NEW_ARRIVALS_HREF }}
      products={products}
    />
  );
}
