import Image from "next/image";
import Link from "next/link";
import { hero } from "@/lib/sample-data";

export function Hero() {
  const [primary, secondary] = hero.images;

  return (
    <section className="relative h-[88svh] min-h-[34rem] text-white lg:h-svh lg:max-h-[68rem]">
      {/* One image on small screens, a diptych from 1024px. */}
      <div className="absolute inset-0 grid lg:grid-cols-2">
        <div className="media-cover">
          <Image
            src={primary.src}
            alt={primary.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: primary.position }}
          />
        </div>
        <div className="media-cover hidden lg:block">
          <Image
            src={secondary.src}
            alt={secondary.alt}
            fill
            loading="eager"
            sizes="50vw"
            className="object-cover"
            style={{ objectPosition: secondary.position }}
          />
          {/* Tones down the bright window so the header stays legible. */}
          <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/70 via-black/30 to-transparent"
      />

      <div className="container-page relative flex h-full flex-col items-center justify-end gap-5 pb-14 text-center lg:pb-20">
        <p className="type-caption-strong">{hero.eyebrow}</p>
        <h1 className="type-title-xxl">{hero.title}</h1>
        <Link href={hero.cta.href} className="btn btn-on-image mt-2">
          {hero.cta.label}
        </Link>
      </div>
    </section>
  );
}
