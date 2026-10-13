import type { Metadata } from "next";
import { CollectionHeader } from "@/components/collection/collection-header";
import { getCatalogCounts } from "@/db/queries/catalog";
import { authCopy } from "@/lib/sample-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: authCopy.admin.title, robots: { index: false } };

// Checks the role before rendering anything: signed-out visitors get a 307 to
// sign-in, signed-in non-admins a 404 (the admin area isn't advertised).
export const instant = false;

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const counts = await getCatalogCounts();

  const stats = [
    { label: "Products", value: counts.products },
    { label: "Categories", value: counts.categories },
    { label: "Sold out", value: counts.soldOut },
  ];

  return (
    <>
      <CollectionHeader eyebrow={`Signed in as ${user.email}`} title={authCopy.admin.overview} />
      <div className="container-page pb-section">
        <dl className="grid gap-x-2 gap-y-8 border-t pt-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2">
              <dt className="type-caption text-muted">{stat.label}</dt>
              <dd className="type-title-l">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
