import type { Metadata } from "next";
import { CollectionHeader } from "@/components/collection/collection-header";
import { CollectionNav } from "@/components/collection/collection-nav";
import { CollectionProducts } from "@/components/collection/collection-products";
import { ServicesStrip } from "@/components/home/services-strip";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getNewArrivals } from "@/db/queries/catalog";
import { NEW_ARRIVALS_HREF } from "@/lib/routes";
import { newArrivals } from "@/lib/sample-data";

// The homepage shows the newest 8; this page shows a longer run of the same order.
const PAGE_LIMIT = 24;

export const metadata: Metadata = {
  title: newArrivals.title,
  description: newArrivals.intro,
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(PAGE_LIMIT);

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: newArrivals.title }]} />
      </div>
      <CollectionHeader eyebrow={newArrivals.eyebrow} title={newArrivals.title} intro={newArrivals.intro} />
      <CollectionNav currentHref={NEW_ARRIVALS_HREF} />
      <CollectionProducts
        label={newArrivals.title}
        products={products}
        empty={{ message: newArrivals.empty, link: { label: "Back to home", href: "/" } }}
      />
      <ServicesStrip />
    </>
  );
}
