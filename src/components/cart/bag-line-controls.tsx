"use client";

import { useActionState } from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { removeFromBagAction, updateBagQuantityAction, type BagActionState } from "@/lib/cart-actions";
import { bagCopy } from "@/lib/sample-data";

type Props = {
  productId: number;
  name: string;
  quantity: number;
  /** Most that can be in the bag now; 0 when sold out. */
  max: number;
};

/**
 * −/+ and Remove for one bag line. Each button submits a form to a Server
 * Action, so they work without JavaScript; the server clamps to stock.
 */
export function BagLineControls({ productId, name, quantity, max }: Props) {
  const [update, updateAction, updating] = useActionState<BagActionState, FormData>(updateBagQuantityAction, {});
  const [remove, removeAction, removing] = useActionState<BagActionState, FormData>(removeFromBagAction, {});
  const busy = updating || removing;
  const message = update.error ?? update.notice ?? remove.error;

  return (
    <div className="flex flex-col gap-2" aria-busy={busy || undefined}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {max > 0 && (
          <form action={updateAction} className="flex items-center border" aria-label={`${bagCopy.quantity} of ${name}`}>
            <input type="hidden" name="productId" value={productId} />
            <button
              type="submit"
              name="quantity"
              value={quantity - 1}
              disabled={busy}
              aria-label={quantity > 1 ? `Decrease quantity of ${name}` : `Remove ${name}`}
              className="grid size-10 place-items-center disabled:opacity-40"
            >
              <MinusIcon width={14} height={14} />
            </button>
            <output aria-live="polite" className="type-caption-strong w-8 text-center">
              {quantity}
            </output>
            <button
              type="submit"
              name="quantity"
              value={quantity + 1}
              disabled={busy || quantity >= max}
              aria-label={`Increase quantity of ${name}`}
              className="grid size-10 place-items-center disabled:opacity-40"
            >
              <PlusIcon width={14} height={14} />
            </button>
          </form>
        )}
        <form action={removeAction}>
          <input type="hidden" name="productId" value={productId} />
          <button type="submit" disabled={busy} aria-label={`${bagCopy.remove} ${name}`} className="type-caption link disabled:opacity-40">
            {bagCopy.remove}
          </button>
        </form>
      </div>
      {message && (
        <p role="status" className={`type-caption ${update.error || remove.error ? "text-error" : "text-muted"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
