import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AddToBagButton } from "@/components/product/add-to-bag-button";
import { ProductAccordion } from "@/components/product/product-accordion";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGridSection } from "@/components/product/product-grid-section";
import { StockStatus } from "@/components/product/stock-status";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/db/queries/catalog";
import { formatPrice } from "@/lib/format";
import { services, shippingAndReturns } from "@/lib/sample-data";
import { getStockStatus } from "@/lib/stock";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return { title: product.name, description: product.summary };
}

// The whole page must be static. For a slug not prerendered at build time, the
// first request waits for the complete page instead of streaming a fallback
// shell, so notFound() runs before anything is sent and returns a real 404
// (after streaming starts it can only send 200 + noindex). This requires every
// read on the page to be cached ("use cache", cacheLife of at least "minutes").
export const ensureStatic = "navigation";
// Reading params before rendering rules out an instant skeleton on navigation;
// a correct 404 matters more here, so opt out of that dev check.
export const instant = false;

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { category } = product;
  const soldOut = getStockStatus(product.stock) === "sold_out";
  const related = await getRelatedProducts(product.id, category.id);

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: category.name, href: category.href },
            { label: product.name },
          ]}
        />
      </div>

      <div className="lg:grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.name} aspect={product.imageAspect} />
        </div>

        <div className="px-gutter pt-8 lg:col-span-5 lg:px-12 lg:pt-0 xl:px-16">
          <div className="flex flex-col gap-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Link href={category.href} className="type-caption link-quiet text-muted">
                  {category.name}
                </Link>
                {product.badge && (
                  <span className="type-micro border px-1.5 py-1">{product.badge}</span>
                )}
              </div>
              <h1 className="type-title-l">{product.name}</h1>
              <p className="type-body-strong">{formatPrice(product.price)}</p>
              <StockStatus stock={product.stock} />
            </div>

            <div className="flex flex-col gap-3">
              <p className="type-body">{product.summary}</p>
              <dl className="type-caption grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-muted">Colour</dt>
                <dd>{product.colour}</dd>
                <dt className="text-muted">Style</dt>
                <dd>{product.styleCode}</dd>
              </dl>
            </div>

            <div className="flex flex-col gap-3">
              <AddToBagButton soldOut={soldOut} />
              {soldOut ? (
                <p className="type-caption text-muted">
                  This piece is currently unavailable.{" "}
                  <Link href="/contact" className="link text-foreground">
                    Ask a client advisor
                  </Link>{" "}
                  about restocks.
                </p>
              ) : (
                <Link href="/contact" className="btn btn-secondary w-full">
                  Contact a client advisor
                </Link>
              )}
            </div>

            <ul className="type-caption flex flex-col gap-1.5 text-muted">
              {services.slice(0, 2).map((service) => (
                <li key={service.title}>
                  {service.title}. {service.body}
                </li>
              ))}
            </ul>

            <ProductAccordion
              sections={[
                {
                  title: "Description",
                  open: true,
                  content: <p className="type-body">{product.description}</p>,
                },
                {
                  title: "Details",
                  content: (
                    <ul className="type-body flex list-disc flex-col gap-1 pl-5">
                      {product.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ),
                },
                {
                  title: "Shipping & returns",
                  content: (
                    <div className="type-body flex flex-col gap-3">
                      {shippingAndReturns.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <ProductGridSection
        id="related-title"
        eyebrow="Continue browsing"
        title="You may also like"
        link={{ label: `All ${category.name.toLowerCase()}`, href: category.href }}
        products={related}
      />
    </>
  );
}
