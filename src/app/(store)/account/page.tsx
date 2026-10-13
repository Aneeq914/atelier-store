import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";
import { isAdmin } from "@/lib/auth-routes";
import { ACCOUNT_DETAILS_HREF, ACCOUNT_HREF, ADMIN_HREF, NEW_ARRIVALS_HREF } from "@/lib/routes";
import { authCopy } from "@/lib/sample-data";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: authCopy.account.title, robots: { index: false } };

// Checks the session before rendering anything (signed-out visitors get a real
// 307 to sign-in). The proxy's cookie check is only a fast first gate.
export const instant = false;

const memberSince = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export default async function AccountPage() {
  const { user } = await requireUser(ACCOUNT_HREF);
  const copy = authCopy.account;

  return (
    <AccountShell user={user} currentHref={ACCOUNT_HREF} title={`Hello, ${user.name}`}>
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        <section aria-labelledby="account-details-title" className="flex flex-col gap-4">
          <h2 id="account-details-title" className="type-title-xs">
            {copy.details}
          </h2>
          <dl className="type-caption grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted">Name</dt>
            <dd className="wrap-anywhere">{user.name}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="wrap-anywhere">{user.email}</dd>
            <dt className="text-muted">Member since</dt>
            <dd>{memberSince.format(user.createdAt)}</dd>
          </dl>
          <Link href={ACCOUNT_DETAILS_HREF} className="type-caption-strong link self-start">
            {copy.editDetails}
          </Link>
        </section>

        <section aria-labelledby="account-shop-title" className="flex flex-col gap-4">
          <h2 id="account-shop-title" className="type-title-xs">
            {copy.shop.title}
          </h2>
          <p className="type-caption text-muted">{copy.shop.body}</p>
          <Link href={NEW_ARRIVALS_HREF} className="type-caption-strong link self-start">
            {copy.shop.link}
          </Link>
        </section>

        {isAdmin(user) && (
          <section aria-labelledby="account-admin-title" className="flex flex-col gap-4">
            <h2 id="account-admin-title" className="type-title-xs">
              {copy.admin}
            </h2>
            <p className="type-caption text-muted">{copy.adminBody}</p>
            <Link href={ADMIN_HREF} className="type-caption-strong link self-start">
              {copy.goToAdmin}
            </Link>
          </section>
        )}
      </div>
    </AccountShell>
  );
}
