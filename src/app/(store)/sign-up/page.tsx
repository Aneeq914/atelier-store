import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { CollectionHeader } from "@/components/collection/collection-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { signUpAction } from "@/lib/auth-actions";
import { safeNextPath, withNext } from "@/lib/auth-routes";
import { SIGN_IN_HREF } from "@/lib/routes";
import { authCopy } from "@/lib/sample-data";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: authCopy.signUp.title, robots: { index: false } };

// Same as sign-in: reads the session and ?next=, renders per request.
export const instant = false;

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const next = safeNextPath((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: authCopy.signUp.title }]} />
      </div>
      <CollectionHeader eyebrow={authCopy.eyebrow} title={authCopy.signUp.title} intro={authCopy.signUp.intro} />
      <div className="container-page pb-section">
        <div className="flex max-w-md flex-col gap-8">
          <AuthForm
            kind="sign-up"
            action={signUpAction}
            next={next}
            submit={authCopy.signUp.submit}
            pending={authCopy.signUp.pending}
            fields={[
              { name: "name", label: "Name", type: "text", autoComplete: "name" },
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              {
                name: "password",
                label: "Password",
                type: "password",
                autoComplete: "new-password",
                hint: authCopy.signUp.passwordHint,
              },
            ]}
          />
          <p className="type-caption text-muted">
            {authCopy.signUp.switchPrompt}{" "}
            <Link href={withNext(SIGN_IN_HREF, next)} className="link text-foreground">
              {authCopy.signUp.switchLink}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
