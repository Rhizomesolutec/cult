import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth-edge";

export { ADMIN_COOKIE };

function getCredentials() {
  const username = process.env.ADMIN_USERNAME || "Cultscribe";
  const password = process.env.ADMIN_PASSWORD || "cultscribe@2026";
  const secret =
    process.env.ADMIN_SESSION_SECRET || "cultscribe-admin-session-fallback";
  return { username, password, secret };
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyAdminCredentials(username: string, password: string) {
  const creds = getCredentials();
  if (
    username.length !== creds.username.length ||
    password.length !== creds.password.length
  ) {
    return false;
  }
  const userOk = timingSafeEqual(
    Buffer.from(username),
    Buffer.from(creds.username),
  );
  const passOk = timingSafeEqual(
    Buffer.from(password),
    Buffer.from(creds.password),
  );
  return userOk && passOk;
}

export function createAdminSessionToken() {
  const { secret, username } = getCredentials();
  const issuedAt = Date.now().toString();
  const payload = `${username}.${issuedAt}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, issuedAt, signature] = parts;
  const { secret, username: expectedUser } = getCredentials();
  if (username !== expectedUser) return false;
  const payload = `${username}.${issuedAt}`;
  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return null;
  }
  return { username: getCredentials().username };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
