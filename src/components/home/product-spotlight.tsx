import Image from "next/image";
import Link from "next/link";
import { StockStatus } from "@/components/product/stock-status";
import { getProductBySlug } from "@/db/queries/catalog";
import { formatPrice } from "@/lib/format";
import { spotlight } from "@/lib/sample-data";

export async function ProductSpotlight() {
  const product = await getProductBySlug(spotlight.productSlug);
  if (!product) return null;
  const [image] = product.images;

  return (
    <section aria-labelledby="spotlight-title" className="grid bg-surface lg:grid-cols-2">
      <div className="media-cover aspect-4/5 lg:aspect-auto lg:min-h-[48rem]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: image.position }}
        />
      </div>

      <div className="flex flex-col justify-center px-gutter py-section lg:px-16">
        <div className="flex max-w-xl flex-col gap-6">
          <p className="type-caption text-muted">{spotlight.eyebrow}</p>
          <h2 id="spotlight-title" className="type-title-xl">
            {product.name}
          </h2>
          <p className="type-body">{product.summary}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {product.details.slice(0, 3).map((detail) => (
              <li key={detail} className="type-caption-strong">
                {detail}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-6">
            <p className="type-body-strong">{formatPrice(product.price)}</p>
            <StockStatus stock={product.stock} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/products/${product.slug}`} className="btn btn-primary">
              {spotlight.cta}
            </Link>
            <Link href={spotlight.secondary.href} className="btn btn-secondary">
              {spotlight.secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
