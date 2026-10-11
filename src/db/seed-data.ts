// Seed data for the catalog tables, loaded by `npm run db:seed` (src/db/seed.ts).
// Photos are local files in public/images/sample (from Pexels, credit URL on each).

import type { products } from "@/db/schema";
import { photo } from "@/lib/sample-images";

export const seedCategories = [
  { slug: "handbags", name: "Handbags", position: 0 },
  { slug: "shoes", name: "Shoes", position: 1 },
  { slug: "eyewear", name: "Eyewear", position: 2 },
  { slug: "fragrance", name: "Fragrance", position: 3 },
  { slug: "accessories", name: "Accessories", position: 4 },
];

type ProductInsert = typeof products.$inferInsert;

export type SeedProduct = Omit<ProductInsert, "id" | "categoryId" | "createdAt" | "updatedAt"> & {
  categorySlug: string;
  quantity: number;
};

// Listed newest first: the seed gives each product a creation date one day
// older than the one before, which sets the "New arrivals" order.
export const seedProducts: SeedProduct[] = [
  {
    slug: "bar-loafer-black-calfskin",
    name: "Bar loafer in black calfskin",
    categorySlug: "shoes",
    priceCents: 98000,
    quantity: 12,
    styleCode: "AT 1001 BLK",
    colour: "Black",
    badge: "New",
    summary: "A collapsible-heel loafer in polished calfskin with a slim metal bar across the vamp.",
    description:
      "Cut from a single piece of polished calfskin, the loafer has a soft heel that folds down to wear as a mule. A slim palladium bar crosses the vamp, and the leather sole is stitched by hand.",
    details: ["Polished calfskin", "Palladium-finish bar", "Fold-down heel", "Leather sole", "Made in Italy"],
    images: [photo("product-loafer", 9327156, "Black leather loafers beside a structured bag")],
  },
  {
    slug: "croc-embossed-platform-mule",
    name: "Croc-embossed platform mule",
    categorySlug: "shoes",
    priceCents: 115000,
    quantity: 2,
    styleCode: "AT 1002 NVY",
    colour: "Midnight navy",
    summary: "An open-toe mule on a stacked wooden platform, upper in croc-embossed leather.",
    description:
      "The upper is croc-embossed calf leather in deep navy, set on a stacked wooden platform and block heel. Studs trace the edge of the sole.",
    details: ["Croc-embossed calf leather", "Wooden platform, 4 cm", "Block heel, 11 cm", "Leather lining", "Made in Spain"],
    images: [photo("product-mule", 26965814, "Navy croc-embossed platform mules")],
  },
  {
    slug: "cat-eye-acetate-sunglasses",
    name: "Cat-eye acetate sunglasses",
    categorySlug: "eyewear",
    priceCents: 52000,
    quantity: 8,
    styleCode: "AT 2001 RED",
    colour: "Cherry red",
    badge: "Exclusive",
    summary: "A sharp cat-eye frame in polished acetate with grey gradient lenses.",
    description:
      "Hand-polished acetate shapes a lifted cat-eye. The lenses give full UV protection, and five-barrel hinges keep the fit secure.",
    details: ["Hand-polished acetate", "Grey gradient lenses", "100% UV protection", "Includes leather case", "Made in Italy"],
    images: [
      photo("product-cat-eye-sunglasses", 27353350, "Cat-eye sunglasses in cherry red and tortoiseshell on white"),
      photo("cat-eye-sunglasses-pair", 27353347, "The cat-eye frame in black acetate, in soft daylight"),
    ],
  },
  {
    slug: "canvas-leather-tote",
    name: "Canvas and leather tote",
    categorySlug: "handbags",
    priceCents: 145000,
    quantity: 0,
    styleCode: "AT 3001 TAN",
    colour: "Tan",
    summary: "An unstructured tote in heavy cotton canvas with leather-wrapped handles.",
    description:
      "Heavy cotton canvas, washed for softness, with leather-wrapped handles that sit comfortably on the shoulder. Inside, a zipped pocket keeps small things in place.",
    details: ["Cotton canvas", "Leather-wrapped handles", "Interior zip pocket", "W 40 × H 38 × D 12 cm", "Made in Portugal"],
    images: [photo("product-tote", 8148587, "Tan canvas tote held beside a plant", "50% 40%")],
  },
  {
    slug: "ivory-riding-boot",
    name: "Ivory rubber riding boot",
    categorySlug: "shoes",
    priceCents: 79000,
    quantity: 5,
    styleCode: "AT 1003 IVY",
    colour: "Ivory",
    badge: "New",
    summary: "A knee-high riding boot moulded in natural rubber, in a soft ivory.",
    description:
      "Moulded in one piece from natural rubber, the boot is waterproof and light. A cotton lining and a cushioned insole make it comfortable for the whole day.",
    details: ["Natural rubber", "Cotton lining", "Cushioned insole", "Shaft height 38 cm", "Made in France"],
    images: [photo("product-riding-boot", 5786404, "Pair of ivory knee-high boots on white")],
  },
  {
    slug: "eau-de-parfum-100ml",
    name: "Eau de parfum, 100 ml",
    categorySlug: "fragrance",
    priceCents: 21000,
    quantity: 30,
    styleCode: "AT 4001 100",
    colour: "100 ml",
    summary: "A warm, woody fragrance with fig leaf, cedar and a trace of salt air.",
    description:
      "Green fig leaf opens onto a heart of cedar and iris and settles into amber and salt. It comes in a weighted glass bottle with a brushed steel cap.",
    details: ["Top: fig leaf, bergamot", "Heart: cedar, iris", "Base: amber, sea salt", "Refillable bottle", "Made in France"],
    images: [
      photo("product-parfum-sand", 8361545, "Glass perfume bottle with a blank label resting in sand"),
      photo("parfum-sand-angle", 8361540, "The perfume bottle set at an angle in sand"),
    ],
  },
  {
    slug: "octagonal-metal-sunglasses",
    name: "Octagonal metal sunglasses",
    categorySlug: "eyewear",
    priceCents: 46000,
    quantity: 1,
    styleCode: "AT 2002 GLD",
    colour: "Gold, blue lens",
    imageAspect: "landscape",
    summary: "A fine octagonal frame in gold-tone titanium with soft blue lenses.",
    description:
      "Lightweight titanium is drawn into an octagonal frame and finished in gold. The pale blue lenses cut glare without darkening the view.",
    details: ["Gold-tone titanium", "Blue tinted lenses", "Adjustable nose pads", "Includes leather case", "Made in Japan"],
    images: [
      photo("octagonal-sunglasses-front", 1499476, "Octagonal gold sunglasses with blue lenses, front view"),
      photo("octagonal-sunglasses-angle", 1499480, "The octagonal frame from a high angle"),
      photo("octagonal-sunglasses-side", 1499481, "The octagonal frame lying folded"),
      photo("octagonal-sunglasses-pair", 1499477, "The octagonal frame beside a dark cat-eye pair"),
    ],
  },
  {
    slug: "steel-chronograph-watch",
    name: "Steel chronograph watch",
    categorySlug: "accessories",
    priceCents: 320000,
    quantity: 6,
    styleCode: "AT 5001 STL",
    colour: "Steel, grey dial",
    summary: "A 42 mm chronograph in brushed steel with a grey sunray dial and link bracelet.",
    description:
      "A self-winding chronograph movement sits inside a 42 mm brushed steel case. The grey sunray dial has three sub-dials, and the bracelet closes with a fold-over clasp.",
    details: ["Automatic chronograph movement", "42 mm steel case", "Sapphire crystal", "Water resistant to 100 m", "Swiss made"],
    images: [photo("product-chronograph", 190819, "Steel chronograph watch with a link bracelet")],
  },
  {
    slug: "soft-pouch",
    name: "The Soft Pouch",
    categorySlug: "handbags",
    priceCents: 189000,
    quantity: 4,
    styleCode: "AT 3002 TPE",
    colour: "Taupe",
    summary: "A slouchy pouch in woven nappa with a knotted top handle, worn in the crook of the arm.",
    description:
      "Strips of supple nappa are woven by hand into a soft, gathered pouch, finished with a knotted top handle. It holds a phone, cards and keys, with a magnetic closure at the top.",
    details: ["Hand-woven nappa leather", "Knotted top handle", "Magnetic closure", "W 28 × H 18 × D 10 cm", "Made in Italy"],
    images: [
      photo("spotlight-pouch", 18938663, "Woman in a long black coat carrying a small woven pouch", "50% 85%"),
      photo("pouch-carry", 18938664, "The pouch carried at the hip against a black coat", "50% 80%"),
      photo("pouch-walk", 18938666, "Walking with the pouch in hand on an autumn bridge", "50% 75%"),
      photo("pouch-portrait", 18938661, "Model in a black coat in front of autumn trees", "50% 30%"),
    ],
  },
];
