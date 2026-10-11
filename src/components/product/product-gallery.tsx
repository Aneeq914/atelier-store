"use client";

import Image from "next/image";
import { useState, type UIEvent } from "react";
import type { ProductImage } from "@/db/schema";

type Aspect = "portrait" | "landscape";

type Props = {
  images: ProductImage[];
  name: string;
  /** Landscape shots get 4:3 frames, one per row on desktop. */
  aspect?: Aspect;
};

// Portrait on desktop: first image full width, the rest two-up; a leftover odd
// image spans the row. Landscape images are always full width.
function spansRow(index: number, count: number, aspect: Aspect) {
  if (aspect === "landscape") return true;
  return index === 0 || (index === count - 1 && (count - 1) % 2 === 1);
}

/** Swipeable slides on small screens, a stacked editorial grid from 1024px. */
export function ProductGallery({ images, name, aspect = "portrait" }: Props) {
  const [active, setActive] = useState(0);

  const onScroll = (event: UIEvent<HTMLUListElement>) => {
    const el = event.currentTarget;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative">
      <ul
        aria-label={`${name} images`}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-px lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => {
          const wide = spansRow(index, images.length, aspect);
          return (
            <li
              key={image.src}
              className={`relative w-full shrink-0 snap-start overflow-hidden bg-well ${aspect === "landscape" ? "aspect-4/3" : "aspect-4/5"} ${wide ? "lg:col-span-2" : ""}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={wide ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 29vw, 100vw"}
                loading={index === 0 ? "eager" : undefined}
                fetchPriority={index === 0 ? "high" : undefined}
                className="object-cover"
                style={{ objectPosition: image.position }}
              />
            </li>
          );
        })}
      </ul>

      {images.length > 1 && (
        <p
          aria-hidden="true"
          className="type-caption-strong absolute right-3 bottom-3 bg-background px-2 py-1 lg:hidden"
        >
          {active + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
