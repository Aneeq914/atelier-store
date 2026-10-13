import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BagLineControls } from "@/components/cart/bag-line-controls";
import { CheckoutButton } from "@/components/checkout/checkout-button";
import { CollectionHeader } from "@/components/collection/collection-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StockStatus } from "@/components/product/stock-status";
import { getBagProducts } from "@/db/queries/catalog";
import { readBag } from "@/lib/bag-cookie";
import { reconcileBag } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { withNext } from "@/lib/auth-routes";
import { BAG_HREF, NEW_ARRIVALS_HREF, SIGN_IN_HREF } from "@/lib/routes";
import { bagCopy, checkoutCopy } from "@/lib/sample-data";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: bagCopy.title, robots: { index: false } };

// Reads the bag cookie, the session and current stock on every request.
export const instant = false;

export default async function BagPage({ searchParams }: PageProps<"/bag">) {
  const [lines, session, { checkout }] = await Promise.all([readBag(), getSession(), searchParams]);
  const products = await getBagProducts(lines.map((line) => line.productId));
  const { items, subtotal, count } = reconcileBag(lines, products);
  const needsReview = items.some((item) => item.status !== "ok");

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: bagCopy.title }]} />
      </div>
      <CollectionHeader eyebrow={bagCopy.eyebrow} title={bagCopy.title} />
      {checkout === "cancelled" && (
        <div className="container-page pb-6">
          <p role="status" className="type-caption border-l-2 pl-3">
            {checkoutCopy.cancelled}
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="container-page pb-section">
          <div className="flex flex-col items-start gap-6 border-t py-16">
            <p className="type-body">{bagCopy.empty}</p>
            <Link href={NEW_ARRIVALS_HREF} className="btn btn-secondary">
              {bagCopy.emptyLink}
            </Link>
          </div>
        </div>
      ) : (
        <div className="container-page pb-section">
          <div className="grid gap-x-12 gap-y-10 border-t pt-2 lg:grid-cols-12">
            <section aria-label="Items in your bag" className="lg:col-span-8">
              <ul className="divide-y">
                {items.map(({ product, quantity, max, lineTotal, status }) => {
                  const [image] = product.images;
                  const href = `/products/${product.slug}`;
                  return (
                    <li key={product.id} className="grid grid-cols-[6rem_1fr] gap-4 py-6 sm:grid-cols-[8rem_1fr] sm:gap-6">
                      <Link href={href} className="media-product" tabIndex={-1} aria-hidden="true">
                        <Image
                          src={image.src}
                          alt=""
                          fill
                          sizes="8rem"
                          className={`object-cover ${status === "sold_out" ? "opacity-50" : ""}`}
                          style={{ objectPosition: image.position }}
                        />
                      </Link>
                      <div className="flex min-w-0 flex-col gap-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link href={href} className="type-body link-quiet wrap-anywhere">
                              {product.name}
                            </Link>
                            <p className="type-caption text-muted">
                              {product.colour} · {formatPrice(product.price)}
                            </p>
                          </div>
                          <p className={`type-body-strong shrink-0 ${status === "sold_out" ? "text-muted" : ""}`}>
                            {status === "sold_out" ? "—" : formatPrice(lineTotal)}
                          </p>
                        </div>
                        <StockStatus stock={product.stock} />
                        {status === "reduced" && <p className="type-caption text-error">{bagCopy.reduced(product.stock)}</p>}
                        {status === "sold_out" && <p className="type-caption text-error">{bagCopy.soldOut}</p>}
                        <BagLineControls productId={product.id} name={product.name} quantity={quantity} max={max} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside aria-labelledby="bag-summary-title" className="lg:col-span-4 lg:pt-6">
              <div className="flex flex-col gap-5 bg-surface p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                <h2 id="bag-summary-title" className="type-title-xs">
                  {bagCopy.summary}
                </h2>
                <dl className="type-caption flex flex-col gap-2">
                  <div className="flex justify-between gap-4">
                    <dt>
                      {bagCopy.subtotal} ({count} {count === 1 ? "piece" : "pieces"})
                    </dt>
                    <dd className="type-body-strong">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{bagCopy.shipping}</dt>
                    <dd>{bagCopy.shippingValue}</dd>
                  </div>
                </dl>
                {session ? (
                  <CheckoutButton disabled={needsReview || count === 0} />
                ) : (
                  <Link href={withNext(SIGN_IN_HREF, BAG_HREF)} className="btn btn-primary w-full">
                    {checkoutCopy.signInToCheckout}
                  </Link>
                )}
                {needsReview && <p className="type-caption text-error">{checkoutCopy.reviewBag}</p>}
                <p className="type-caption text-muted">{bagCopy.later}</p>
                <Link href={NEW_ARRIVALS_HREF} className="btn btn-secondary w-full">
                  {bagCopy.continue}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
