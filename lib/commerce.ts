import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const CART_COOKIE = "cult_cart_sid";

export async function getOrCreateCartSessionId() {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomUUID();
  store.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return sessionId;
}

export async function getCartSessionId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function createOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CS-${stamp}-${rand}`;
}
