"use client";

import { useEffect, useState } from "react";
import { BagIcon } from "@/components/icons";

// There is no cart yet: the button only confirms visually.
// Replace the click handler with the cart action once the cart exists.
export function AddToBagButton({ soldOut }: { soldOut: boolean }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(timer);
  }, [added]);

  if (soldOut) {
    return (
      <button type="button" disabled className="btn btn-primary w-full">
        Sold out
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setAdded(true)} className="btn btn-primary w-full">
        <BagIcon width={16} height={16} />
        {added ? "Added to bag" : "Add to bag"}
      </button>
      <p role="status" className="sr-only">
        {added ? "Added to bag" : ""}
      </p>
    </>
  );
}
