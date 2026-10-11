import { ProductGridSection } from "@/components/product/product-grid-section";
import { getNewArrivals } from "@/db/queries/catalog";

export async function NewArrivals() {
  const products = await getNewArrivals();

  return (
    <ProductGridSection
      id="new-arrivals-title"
      eyebrow="Just landed"
      title="New arrivals"
      link={{ label: "View all", href: "/collections/new" }}
      products={products}
    />
  );
}
