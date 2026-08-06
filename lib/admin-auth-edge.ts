export const ADMIN_COOKIE = "cult_admin_session";

/** Edge-safe verification for middleware (Web Crypto). */
export async function verifyAdminSessionTokenEdge(
  token: string | undefined | null,
  secret: string,
  expectedUsername: string,
) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, issuedAt, signature] = parts;
  if (username !== expectedUsername) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = new TextEncoder().encode(`${username}.${issuedAt}`);
  const sigBuf = await crypto.subtle.sign("HMAC", key, data);
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
