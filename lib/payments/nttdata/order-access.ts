import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { OrderDocument } from "@/lib/models/Order";

/**
 * Post-payment order view authorization.
 * Atom returns cross-site (and browsers may block cookies via Tracking Prevention),
 * so the callback attaches a short-lived token in the redirect URL.
 */

function accessSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.NTTDATA_RESPONSE_HASH_KEY?.trim() ||
    "cult-order-access"
  );
}

/** Signed token (works without a DB write). */
export function createOrderAccessToken(
  orderId: string,
  sessionId: string,
  ttlSeconds = 60 * 60 * 24,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  const sig = createHmac("sha256", accessSecret())
    .update(`${payload}.${sessionId}`)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifySignedOrderAccessToken(
  orderId: string,
  sessionId: string,
  token: string,
): boolean {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;
  const [id, expStr, sig] = parts;
  if (!id || !expStr || !sig || id !== orderId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

  const expected = createHmac("sha256", accessSecret())
    .update(`${id}.${exp}.${sessionId}`)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Persist a random view token on the order (survives domain/cookie issues). */
export async function issueOrderViewToken(
  order: OrderDocument,
  ttlSeconds = 60 * 60 * 24,
): Promise<string> {
  const token = randomBytes(24).toString("hex");
  order.payment = {
    ...order.payment,
    viewToken: token,
    viewTokenExpiresAt: new Date(Date.now() + ttlSeconds * 1000),
  };
  await order.save();
  return token;
}

export function verifyOrderViewToken(
  order: {
    payment?: {
      viewToken?: string;
      viewTokenExpiresAt?: Date | string | null;
    };
  },
  token: string,
): boolean {
  const stored = order.payment?.viewToken?.trim();
  if (!stored || !token || stored !== token.trim()) return false;
  const expires = order.payment?.viewTokenExpiresAt;
  if (!expires) return false;
  const expMs = new Date(expires).getTime();
  return Number.isFinite(expMs) && expMs > Date.now();
}

export function verifyOrderAccessToken(
  orderId: string,
  sessionId: string,
  token: string,
  order?: {
    payment?: {
      viewToken?: string;
      viewTokenExpiresAt?: Date | string | null;
    };
  },
): boolean {
  if (order && verifyOrderViewToken(order, token)) return true;
  return verifySignedOrderAccessToken(orderId, sessionId, token);
}
