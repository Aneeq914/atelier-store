"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Re-fetch the order page every 2 seconds while the payment webhook hasn't
 * landed yet, up to about 30 seconds. The page re-renders from the database, so
 * the status shown is always the server's, never the browser's.
 */
export function RefreshWhilePending({ intervalMs = 2000, maxTries = 15 }: { intervalMs?: number; maxTries?: number }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= maxTries) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((count) => count + 1);
    }, intervalMs);
    return () => clearTimeout(timer);
  }, [tries, maxTries, intervalMs, router]);

  return tries >= maxTries ? (
    <p role="status" className="type-caption text-muted">
      This is taking longer than usual. We&apos;ll keep this page up to date; you can refresh it in a minute.
    </p>
  ) : null;
}
