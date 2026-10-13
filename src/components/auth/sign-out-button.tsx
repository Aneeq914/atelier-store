import { signOutAction } from "@/lib/auth-actions";

/** A form button that signs out through a Server Action (works without JavaScript). */
export function SignOutButton({ label, className = "btn btn-secondary" }: { label: string; className?: string }) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
