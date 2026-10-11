import Image from "next/image";
import Link from "next/link";
import { categoryTiles } from "@/lib/sample-data";

export function CategoryTiles() {
  return (
    <section aria-labelledby="categories-title" className="section container-page">
      <h2 id="categories-title" className="sr-only">
        Shop by category
      </h2>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-4">
        {categoryTiles.map((category) => (
          <li key={category.href}>
            <Link href={category.href} className="group flex flex-col gap-4">
              <div className="media-product">
                <Image
                  src={category.image.src}
                  alt={category.image.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
                />
              </div>
              <span className="type-caption-strong link-quiet self-center">
                {category.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
