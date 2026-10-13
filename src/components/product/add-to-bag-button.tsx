"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { BagIcon } from "@/components/icons";
import { addToBagAction, type BagActionState } from "@/lib/cart-actions";
import { BAG_HREF } from "@/lib/routes";
import { bagCopy } from "@/lib/sample-data";

/**
 * Adds one of the product to the bag through a Server Action (works without
 * JavaScript). The server checks current stock; this only shows the result.
 */
export function AddToBagButton({ productId, soldOut }: { productId: number; soldOut: boolean }) {
  const [state, formAction, pending] = useActionState<BagActionState, FormData>(addToBagAction, {});
  // Show "Added to bag" for a moment after each successful add.
  const [confirmedAt, setConfirmedAt] = useState<number | undefined>();
  const justAdded = state.addedAt !== undefined && state.addedAt !== confirmedAt;

  useEffect(() => {
    if (state.addedAt === undefined) return;
    const timer = setTimeout(() => setConfirmedAt(state.addedAt), 2500);
    return () => clearTimeout(timer);
  }, [state.addedAt]);

  if (soldOut) {
    return (
      <button type="button" disabled className="btn btn-primary w-full">
        Sold out
      </button>
    );
  }

  const message = state.error ?? state.notice;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        <BagIcon width={16} height={16} />
        {pending ? bagCopy.adding : justAdded ? bagCopy.added : bagCopy.add}
      </button>
      <div role="status" className="type-caption flex flex-wrap items-center gap-x-3 gap-y-1">
        {message && <span className={state.error ? "text-error" : "text-muted"}>{message}</span>}
        {(state.addedAt !== undefined || state.error) && (
          <Link href={BAG_HREF} className="link">
            {bagCopy.view}
          </Link>
        )}
      </div>
    </form>
  );
}
