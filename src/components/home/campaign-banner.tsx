import Image from "next/image";
import Link from "next/link";
import { campaign } from "@/lib/sample-data";

export function CampaignBanner() {
  return (
    <section
      aria-labelledby="campaign-title"
      className="media-cover aspect-3/4 text-white sm:aspect-4/3 lg:aspect-auto lg:h-[min(85svh,52rem)]"
    >
      <Image
        src={campaign.image.src}
        alt={campaign.image.alt}
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: campaign.image.position }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent lg:bg-linear-to-l lg:from-black/55 lg:via-black/15"
      />
      {/* Copy sits on the empty side of the photo: bottom on phones, right on desktop. */}
      <div className="container-page absolute inset-0 flex flex-col items-start justify-end gap-5 pb-12 lg:items-end lg:justify-center lg:pb-0 lg:text-right">
        <p className="type-caption-strong">{campaign.eyebrow}</p>
        <h2 id="campaign-title" className="type-display max-w-[10ch]">
          {campaign.title}
        </h2>
        <p className="type-body max-w-sm">{campaign.body}</p>
        <Link href={campaign.cta.href} className="btn btn-on-image mt-2">
          {campaign.cta.label}
        </Link>
      </div>
    </section>
  );
}
