"use client";

import { useActionState } from "react";
import { startCheckoutAction, type CheckoutState } from "@/lib/checkout-actions";
import { checkoutCopy } from "@/lib/sample-data";

/** Starts checkout through a Server Action (works without JavaScript). The server re-checks the bag and stock. */
export function CheckoutButton({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckoutAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3" aria-busy={pending || undefined}>
      {state.error && (
        <p role="alert" className="type-caption border-l-2 border-error pl-3 text-error">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={disabled || pending} className="btn btn-primary w-full">
        {pending ? checkoutCopy.starting : checkoutCopy.checkout}
      </button>
    </form>
  );
}
