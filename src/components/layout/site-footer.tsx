import Link from "next/link";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { footerLinks } from "@/lib/sample-data";

export function SiteFooter() {
  return (
    <footer className="theme-inverse">
      <div className="container-page section grid-page gap-y-12">
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
          <h2 className="type-title-s">Sign up for Atelier updates</h2>
          <p className="type-body max-w-md text-muted">
            New collections, private events and the stories behind the craft.
          </p>
          <div className="max-w-md">
            <NewsletterForm />
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="col-span-12 grid grid-cols-2 gap-x-2 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7"
        >
          {footerLinks.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h2 className="type-title-xs">{group.title}</h2>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="type-caption link-quiet text-muted hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="container-page flex flex-col gap-6 border-t pt-8 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <Link href="/" className="type-wordmark [--wordmark-size:2.25rem] lg:[--wordmark-size:3.75rem]">
          Atelier
        </Link>
        <div className="flex flex-col gap-1 sm:items-end">
          <span className="type-caption">United States (USD)</span>
          <span className="type-caption text-muted">© Atelier. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
