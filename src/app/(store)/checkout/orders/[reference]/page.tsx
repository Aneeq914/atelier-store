import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshWhilePending } from "@/components/checkout/refresh-while-pending";
import { CollectionHeader } from "@/components/collection/collection-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getOrderForUser } from "@/db/queries/orders";
import { formatPrice } from "@/lib/format";
import { BAG_HREF, NEW_ARRIVALS_HREF } from "@/lib/routes";
import { checkoutCopy } from "@/lib/sample-data";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

// The customer's own order, read from the database on every request. The status
// shown is the one the verified payment webhook set; coming back from the
// payment page proves nothing.
export const instant = false;

export default async function OrderPage({ params }: PageProps<"/checkout/orders/[reference]">) {
  const { reference } = await params;
  const { user } = await requireUser(`/checkout/orders/${reference}`);
  const order = await getOrderForUser(reference, user.id);
  if (!order) notFound();

  const copy = checkoutCopy.order;
  const heading =
    order.status === "paid"
      ? { title: copy.paidTitle, intro: copy.paidIntro }
      : order.status === "pending_payment"
        ? { title: copy.pendingTitle, intro: copy.pendingIntro }
        : { title: copy.closedTitle, intro: order.status === "failed" ? copy.failedIntro : copy.closedIntro };

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `${copy.eyebrow} ${order.reference}` }]} />
      </div>
      <CollectionHeader eyebrow={`${copy.eyebrow} ${order.reference}`} title={heading.title} intro={heading.intro} />
      <div className="container-page pb-section">
        <div className="flex max-w-2xl flex-col gap-8">
          {order.status === "pending_payment" && <RefreshWhilePending />}

          <section aria-labelledby="order-items-title" className="flex flex-col gap-4 border-t pt-6">
            <h2 id="order-items-title" className="type-title-xs">
              {copy.items}
            </h2>
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="type-caption flex justify-between gap-4 py-3">
                  <span className="wrap-anywhere">
                    <Link href={`/products/${item.productSlug}`} className="link-quiet">
                      {item.productName}
                    </Link>{" "}
                    <span className="text-muted">
                      × {item.quantity} · {formatPrice(item.unitPriceCents)}
                    </span>
                  </span>
                  <span className="shrink-0">{formatPrice(item.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <p className="type-body-strong flex justify-between gap-4 border-t pt-4">
              <span>{copy.total}</span>
              <span>{formatPrice(order.totalCents)}</span>
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            {order.status === "expired" || order.status === "failed" ? (
              <Link href={BAG_HREF} className="btn btn-primary">
                {copy.backToBag}
              </Link>
            ) : null}
            <Link href={NEW_ARRIVALS_HREF} className="btn btn-secondary">
              {copy.continue}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
