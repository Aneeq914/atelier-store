import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { updateNameAction } from "@/lib/auth-actions";
import { ACCOUNT_DETAILS_HREF } from "@/lib/routes";
import { authCopy } from "@/lib/sample-data";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: authCopy.account.details, robots: { index: false } };

// Same as the account overview: check the session before rendering anything.
export const instant = false;

const memberSince = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export default async function AccountDetailsPage() {
  const { user } = await requireUser(ACCOUNT_DETAILS_HREF);
  const copy = authCopy.account;

  return (
    <AccountShell user={user} currentHref={ACCOUNT_DETAILS_HREF} title={copy.details} intro={copy.detailsIntro}>
      <div className="flex max-w-md flex-col gap-10">
        <AuthForm
          kind="profile"
          action={updateNameAction}
          submit={copy.save}
          pending={copy.saving}
          initialValues={{ name: user.name }}
          fields={[{ name: "name", label: "Name", type: "text", autoComplete: "name" }]}
        />

        <section aria-labelledby="sign-in-email-title" className="flex flex-col gap-3 border-t pt-8">
          <h2 id="sign-in-email-title" className="type-title-xs">
            Sign-in details
          </h2>
          <dl className="type-caption grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted">Email</dt>
            <dd className="wrap-anywhere">{user.email}</dd>
            <dt className="text-muted">Member since</dt>
            <dd>{memberSince.format(user.createdAt)}</dd>
          </dl>
          <p className="type-caption text-muted">{copy.emailNote}</p>
        </section>
      </div>
    </AccountShell>
  );
}
