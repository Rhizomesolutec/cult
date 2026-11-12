/**
 * Safe structured diagnostics for NTT DATA payment flows.
 * Never log secrets, encData, card data, or full customer PII.
 */

type DiagLevel = "info" | "warn" | "error";

export function nttdataDiag(
  scope: string,
  level: DiagLevel,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
) {
  const blockedExact = new Set([
    "password",
    "transactionpassword",
    "requestencryptionkey",
    "responseencryptionkey",
    "requesthashkey",
    "responsehashkey",
    "encdata",
    "signature",
    "cardnumber",
    "cvv",
    "custemail",
    "custmobile",
    "email",
    "mobile",
    "phone",
  ]);

  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (blockedExact.has(lower)) continue;
    if (lower.endsWith("password") || lower.endsWith("encryptionkey")) continue;
    if (lower.includes("encdata") || lower.includes("cardnumber")) continue;
    safe[key] = value;
  }

  const line = {
    scope: `nttdata/${scope}`,
    level,
    event,
    ...safe,
  };

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}
