import Image from "next/image";
import Link from "next/link";
import { collections } from "@/lib/sample-data";

export function CollectionSplit() {
  return (
    <section aria-label="Featured collections" className="grid md:grid-cols-2">
      {collections.map((collection) => (
        <Link
          key={collection.href}
          href={collection.href}
          className="group media-cover block aspect-4/5 text-white lg:aspect-auto lg:h-[min(92svh,60rem)]"
        >
          <Image
            src={collection.image.src}
            alt={collection.image.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-[1.03]"
            style={{ objectPosition: collection.image.position }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/50 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-gutter pb-10 text-center lg:pb-14">
            <h2 className="type-title-l">{collection.label}</h2>
            <span className="btn btn-glass">{collection.cta}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
