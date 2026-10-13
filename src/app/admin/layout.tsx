import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { authCopy } from "@/lib/sample-data";

// Admin shell, outside the storefront layout. It makes no auth decision:
// layouts don't re-run on navigation, so every admin page and admin Server
// Action calls requireAdmin() itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b">
        <div className="container-page flex h-header items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <Link href="/" className="type-wordmark [--wordmark-size:1.5rem]">
              Atelier
            </Link>
            <span className="type-caption text-muted">{authCopy.admin.title}</span>
          </div>
          <nav aria-label="Admin" className="flex items-center gap-5">
            <Link href="/" className="type-caption link-quiet">
              {authCopy.admin.backToStore}
            </Link>
            <SignOutButton label={authCopy.account.signOut} className="btn btn-secondary btn-sm" />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
