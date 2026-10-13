"use server";

import { refresh } from "next/cache";
import { getBagProducts } from "@/db/queries/catalog";
import { readBag, writeBag } from "@/lib/bag-cookie";
import { addLine, removeLine, setLineQuantity, type BagChange } from "@/lib/cart";

// Bag Server Actions. Each one is a public endpoint, so it validates its own
// input, reads current stock straight from the database, applies the rules in
// src/lib/cart.ts, and writes the cookie. Guests and signed-in shoppers alike.

export type BagActionState = {
  error?: string;
  notice?: string;
  /** Set when an add succeeded; a new value each time so the UI can confirm again. */
  addedAt?: number;
};

const SOMETHING_WRONG = "Something went wrong. Please try again.";

function positiveInt(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function quantityInput(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= 9999 ? number : null;
}

async function save(change: BagChange, before: unknown[]) {
  if (change.lines !== before) await writeBag(change.lines);
}

export async function addToBagAction(_state: BagActionState, formData: FormData): Promise<BagActionState> {
  const productId = positiveInt(formData.get("productId"));
  if (!productId) return { error: SOMETHING_WRONG };

  const [product] = await getBagProducts([productId]);
  if (!product) return { error: "This piece is no longer available." };

  const lines = await readBag();
  const change = addLine(lines, productId, product.stock);
  await save(change, lines);
  if (change.error) return { error: change.error };
  return { addedAt: Date.now(), notice: change.notice };
}

export async function updateBagQuantityAction(_state: BagActionState, formData: FormData): Promise<BagActionState> {
  const productId = positiveInt(formData.get("productId"));
  const quantity = quantityInput(formData.get("quantity"));
  if (!productId || quantity === null) return { error: SOMETHING_WRONG };

  const lines = await readBag();
  const [product] = await getBagProducts([productId]);
  const change = product ? setLineQuantity(lines, productId, product.stock, quantity) : { lines: removeLine(lines, productId) };
  await save(change, lines);
  refresh(); // re-render /bag with the new quantities and subtotal
  return { notice: change.notice };
}

export async function removeFromBagAction(_state: BagActionState, formData: FormData): Promise<BagActionState> {
  const productId = positiveInt(formData.get("productId"));
  if (!productId) return { error: SOMETHING_WRONG };

  const lines = await readBag();
  await writeBag(removeLine(lines, productId));
  refresh();
  return {};
}
