const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats a USD amount stored in cents: 189000 → "$1,890". */
export function formatPrice(cents: number) {
  return usd.format(cents / 100);
}
