import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { CollectionHeader } from "@/components/collection/collection-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { signInAction } from "@/lib/auth-actions";
import { safeNextPath, withNext } from "@/lib/auth-routes";
import { SIGN_UP_HREF } from "@/lib/routes";
import { authCopy } from "@/lib/sample-data";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: authCopy.signIn.title, robots: { index: false } };

// Reads the session (to send signed-in visitors on) and ?next=, so it renders
// per request and blocks: a redirect here is a real 307.
export const instant = false;

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const next = safeNextPath((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: authCopy.signIn.title }]} />
      </div>
      <CollectionHeader eyebrow={authCopy.eyebrow} title={authCopy.signIn.title} intro={authCopy.signIn.intro} />
      <div className="container-page pb-section">
        <div className="flex max-w-md flex-col gap-8">
          <AuthForm
            kind="sign-in"
            action={signInAction}
            next={next}
            submit={authCopy.signIn.submit}
            pending={authCopy.signIn.pending}
            fields={[
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
          />
          <p className="type-caption text-muted">
            {authCopy.signIn.switchPrompt}{" "}
            <Link href={withNext(SIGN_UP_HREF, next)} className="link text-foreground">
              {authCopy.signIn.switchLink}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
