import "server-only";
import { cookies } from "next/headers";
import { parseBag, serializeBag, type BagLine } from "@/lib/cart";

// The bag cookie: product ids and quantities only ("12:1,7:2"). httpOnly, so
// only the server reads or writes it; it is never trusted (see src/lib/cart.ts).
export const BAG_COOKIE = "atelier_bag";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function readBag() {
  return parseBag((await cookies()).get(BAG_COOKIE)?.value);
}

/** Only call from Server Actions (cookies can't be written while rendering). */
export async function writeBag(lines: BagLine[]) {
  const jar = await cookies();
  if (lines.length === 0) {
    jar.delete(BAG_COOKIE);
    return;
  }
  jar.set(BAG_COOKIE, serializeBag(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearBag() {
  (await cookies()).delete(BAG_COOKIE);
}
