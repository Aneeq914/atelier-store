import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  /** Names the navigation for screen readers. */
  label: string;
  links: { label: string; href: string }[];
  currentHref?: string;
  /** Extra items after the links, e.g. a sign-out button. */
  children?: ReactNode;
};

/** A row of text links with the current one underlined. Wraps rather than scrolls, so the current link is always visible. */
export function LinkRow({ label, links, currentHref, children }: Props) {
  return (
    <nav aria-label={label} className="container-page pb-6">
      <ul className="type-caption-strong flex flex-wrap items-center gap-x-6 gap-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} aria-current={link.href === currentHref ? "page" : undefined} className="link-quiet">
              {link.label}
            </Link>
          </li>
        ))}
        {children}
      </ul>
    </nav>
  );
}
