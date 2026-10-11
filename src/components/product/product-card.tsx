import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/db/queries/catalog";
import { formatPrice } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";

export function ProductCard({ product }: { product: Product }) {
  const [image] = product.images;
  const soldOut = getStockStatus(product.stock) === "sold_out";
  const tag = soldOut ? "Sold out" : product.badge;

  return (
    <Link href={`/products/${product.slug}`} className="group block bg-background">
      <div className="media-product">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
          style={{ objectPosition: image.position }}
        />
        {tag && (
          <span
            className={`type-micro absolute top-3 left-3 bg-background px-1.5 py-1 ${soldOut ? "text-muted" : ""}`}
          >
            {tag}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 pt-3 pb-8">
        <h3 className="type-caption">{product.name}</h3>
        <p className={`type-caption-strong ${soldOut ? "text-muted" : ""}`}>{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
