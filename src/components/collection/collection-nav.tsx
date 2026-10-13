import { LinkRow } from "@/components/layout/link-row";
import { getCategories } from "@/db/queries/catalog";
import { NEW_ARRIVALS_HREF } from "@/lib/routes";
import { newArrivals } from "@/lib/sample-data";

/** Links between collection pages (New arrivals plus every category); the current one is underlined. */
export async function CollectionNav({ currentHref }: { currentHref?: string }) {
  const categories = await getCategories();
  const links = [
    { label: newArrivals.title, href: NEW_ARRIVALS_HREF },
    ...categories.map((category) => ({ label: category.name, href: category.href })),
  ];

  return <LinkRow label="Collections" links={links} currentHref={currentHref} />;
}
