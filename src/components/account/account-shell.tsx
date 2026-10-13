import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CollectionHeader } from "@/components/collection/collection-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LinkRow } from "@/components/layout/link-row";
import { isAdmin } from "@/lib/auth-routes";
import { ACCOUNT_DETAILS_HREF, ACCOUNT_HREF, ADMIN_HREF } from "@/lib/routes";
import { authCopy } from "@/lib/sample-data";

type Props = {
  /** The signed-in user, from requireUser() on the page. */
  user: { role?: string | null };
  currentHref: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

/**
 * Frame for every account page: breadcrumbs, heading, account navigation (with
 * sign-out), then the page. It makes no auth decision; each page calls
 * requireUser() first and passes the user in.
 */
export function AccountShell({ user, currentHref, title, intro, children }: Props) {
  const links = [
    { label: authCopy.account.overview, href: ACCOUNT_HREF },
    { label: authCopy.account.details, href: ACCOUNT_DETAILS_HREF },
    ...(isAdmin(user) ? [{ label: authCopy.account.admin, href: ADMIN_HREF }] : []),
  ];
  const current = links.find((link) => link.href === currentHref);
  const crumbs =
    currentHref === ACCOUNT_HREF
      ? [{ label: "Home", href: "/" }, { label: authCopy.account.title }]
      : [{ label: "Home", href: "/" }, { label: authCopy.account.title, href: ACCOUNT_HREF }, { label: current?.label ?? title }];

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={crumbs} />
      </div>
      <CollectionHeader eyebrow={authCopy.eyebrow} title={title} intro={intro} />
      <LinkRow label="Account" links={links} currentHref={currentHref}>
        <li>
          <SignOutButton label={authCopy.account.signOut} className="link-quiet text-muted" />
        </li>
      </LinkRow>
      <div className="container-page pb-section">
        <div className="border-t pt-8">{children}</div>
      </div>
    </>
  );
}
