import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/collection/collection-header";
import { CollectionNav } from "@/components/collection/collection-nav";
import { CollectionProducts } from "@/components/collection/collection-products";
import { ServicesStrip } from "@/components/home/services-strip";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGridSection } from "@/components/product/product-grid-section";
import { getCategories, getCategoryBySlug, getNewArrivals, getProductsByCategory } from "@/db/queries/catalog";
import { NEW_ARRIVALS_HREF } from "@/lib/routes";
import { categoryCollection, newArrivals } from "@/lib/sample-data";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: category.name, description: `${category.name} from the atelier, newest first.` };
}

// Same as the product page: wait for the complete page so an unknown slug gets
// a real 404 instead of a streamed 200 (every read here is cached).
export const ensureStatic = "navigation";
export const instant = false;

export default async function CategoryPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, elsewhere] = await Promise.all([
    getProductsByCategory(category.id),
    getNewArrivals(4, category.id),
  ]);

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.name }]} />
      </div>
      <CollectionHeader eyebrow={categoryCollection.eyebrow} title={category.name} />
      <CollectionNav currentHref={category.href} />
      <CollectionProducts
        label={category.name}
        products={products}
        empty={{
          message: categoryCollection.empty,
          link: { label: `Shop ${newArrivals.title.toLowerCase()}`, href: NEW_ARRIVALS_HREF },
        }}
      />
      {elsewhere.length > 0 && (
        <ProductGridSection
          id="elsewhere-title"
          eyebrow={categoryCollection.more.eyebrow}
          title={categoryCollection.more.title}
          link={{ label: "View all new arrivals", href: NEW_ARRIVALS_HREF }}
          products={elsewhere}
        />
      )}
      <ServicesStrip />
    </>
  );
}
