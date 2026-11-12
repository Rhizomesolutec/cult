export type NttDataConfig = {
  env: "uat";
  paymentUrl: string;
  statusUrl: string;
  checkoutJsUrl: string;
  merchantId: string;
  transactionPassword: string;
  product: string;
  requestEncryptionKey: string;
  responseEncryptionKey: string;
  requestHashKey: string;
  responseHashKey: string;
  appUrl: string;
};

const UAT_AUTH = "https://paynetzuat.atomtech.in/ots/aipay/auth";
const UAT_STATUS = "https://paynetzuat.atomtech.in/ots/payment/status";
const UAT_CHECKOUT_JS =
  "https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js";
/** Same-origin copy used when the NTT DATA UAT CDN is down. */
export const UAT_CHECKOUT_JS_FALLBACK = "/payments/nttdata/atomcheckout-uat.js";

function required(name: string): string {
  const raw = process.env[name];
  const value = raw?.trim();
  if (raw === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (!value) {
    throw new Error(
      `Environment variable ${name} is set but empty in .env — add the UAT value and restart the Next.js server`,
    );
  }
  return value;
}

function assertUatUrl(name: string, url: string, allowedHost: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid ${name}`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS`);
  }
  if (parsed.hostname !== allowedHost) {
    throw new Error(
      `${name} must use the UAT host ${allowedHost} (production is disabled)`,
    );
  }
}

/**
 * UAT-only NTT DATA / Atom configuration.
 * Production env values and production hostnames are rejected.
 */
export function getNttDataConfig(): NttDataConfig {
  const envRaw = (process.env.NTTDATA_ENV || "uat").trim().toLowerCase();
  if (envRaw === "prod" || envRaw === "production") {
    throw new Error(
      "NTTDATA_ENV=prod is disabled. This integration is UAT-only.",
    );
  }

  const paymentUrl = process.env.NTTDATA_PAYMENT_URL?.trim() || UAT_AUTH;
  const statusUrl = process.env.NTTDATA_STATUS_URL?.trim() || UAT_STATUS;
  const checkoutJsUrl =
    process.env.NTTDATA_CHECKOUT_JS_URL?.trim() || UAT_CHECKOUT_JS;

  assertUatUrl("NTTDATA_PAYMENT_URL", paymentUrl, "paynetzuat.atomtech.in");
  assertUatUrl("NTTDATA_STATUS_URL", statusUrl, "paynetzuat.atomtech.in");
  assertUatUrl(
    "NTTDATA_CHECKOUT_JS_URL",
    checkoutJsUrl,
    "pgtest.atomtech.in",
  );

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NTTDATA_APP_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  if (!appUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_APP_URL (required for NTT DATA return URL)",
    );
  }

  return {
    env: "uat",
    paymentUrl,
    statusUrl,
    checkoutJsUrl,
    merchantId: required("NTTDATA_MERCHANT_ID"),
    transactionPassword: required("NTTDATA_TRANSACTION_PASSWORD"),
    product: process.env.NTTDATA_PRODUCT?.trim() || "NSE",
    requestEncryptionKey: required("NTTDATA_REQUEST_ENCRYPTION_KEY"),
    responseEncryptionKey: required("NTTDATA_RESPONSE_ENCRYPTION_KEY"),
    requestHashKey: required("NTTDATA_REQUEST_HASH_KEY"),
    responseHashKey: required("NTTDATA_RESPONSE_HASH_KEY"),
    appUrl,
  };
}

export function formatNttAmount(amount: number): string {
  return Number(amount).toFixed(2);
}

export function createMerchTxnId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CS${stamp}${rand}`.slice(0, 40);
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export type AtomReturnAppUrlResolution = {
  appUrl: string;
  source: "NTTDATA_RETURN_APP_URL" | "NEXT_PUBLIC_APP_URL" | "NTTDATA_APP_URL";
  returnUrlIsLocal: false;
  returnUrlIsHttps: true;
};

/**
 * Public HTTPS origin Atom will POST the payment response to:
 *   {appUrl}/api/payments/nttdata/callback
 *
 * Priority:
 * 1) NTTDATA_RETURN_APP_URL — dedicated tunnel/preview HTTPS origin for UAT tests
 * 2) NEXT_PUBLIC_APP_URL / NTTDATA_APP_URL — only when already public HTTPS
 *
 * Localhost / http origins are rejected for real Atom UAT checkout.
 */
export function resolveAtomReturnAppUrl(
  configuredAppUrl: string,
): AtomReturnAppUrlResolution {
  const dedicated = process.env.NTTDATA_RETURN_APP_URL?.trim().replace(
    /\/$/,
    "",
  );
  if (dedicated) {
    let parsed: URL;
    try {
      parsed = new URL(dedicated);
    } catch {
      throw new Error("Invalid NTTDATA_RETURN_APP_URL");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("NTTDATA_RETURN_APP_URL must use HTTPS");
    }
    if (isLoopbackHost(parsed.hostname)) {
      throw new Error("NTTDATA_RETURN_APP_URL cannot be localhost");
    }
    return {
      appUrl: dedicated,
      source: "NTTDATA_RETURN_APP_URL",
      returnUrlIsLocal: false,
      returnUrlIsHttps: true,
    };
  }

  const configured = configuredAppUrl.replace(/\/$/, "");
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("Invalid application URL for Atom return callback");
  }

  if (parsed.protocol !== "https:" || isLoopbackHost(parsed.hostname)) {
    throw new Error(
      "Atom UAT requires a public HTTPS return URL. Set NTTDATA_RETURN_APP_URL to your HTTPS tunnel or preview origin (example: https://xxxx.ngrok-free.app), whitelist that domain with NDPS, then restart. Keep NEXT_PUBLIC_APP_URL as http://localhost:3000 for local browsing.",
    );
  }

  const source = process.env.NEXT_PUBLIC_APP_URL?.trim()
    ? "NEXT_PUBLIC_APP_URL"
    : "NTTDATA_APP_URL";

  return {
    appUrl: configured,
    source,
    returnUrlIsLocal: false,
    returnUrlIsHttps: true,
  };
}

/**
 * After Atom posts to the callback, redirect to the public HTTPS origin.
 * Prefer NTTDATA_RETURN_APP_URL so vercel.app → custom-domain redirects
 * do not drop the order access query string.
 */
export function resolveCallbackAppUrl(req: Request): string {
  const dedicated = process.env.NTTDATA_RETURN_APP_URL?.trim().replace(
    /\/$/,
    "",
  );
  if (dedicated) {
    try {
      const parsed = new URL(dedicated);
      if (
        parsed.protocol === "https:" &&
        !isLoopbackHost(parsed.hostname)
      ) {
        return dedicated;
      }
    } catch {
      // fall through
    }
  }

  try {
    return new URL(req.url).origin;
  } catch {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3000"
    );
  }
}

async function probeUrlStatus(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
      headers: { Accept: "*/*" },
    });
    return res.status;
  } catch {
    return null;
  }
}

/**
 * Prefer the official UAT CDN. If it is down (common 503/404 outages),
 * fall back to the same-origin copy under /public/payments/nttdata.
 * The hosted payment page itself still loads from pgtest.atomtech.in.
 */
export async function resolveCheckoutJsUrl(
  preferredUrl: string,
): Promise<{ checkoutJsUrl: string; usedFallback: boolean }> {
  const status = await probeUrlStatus(preferredUrl);
  if (status != null && status >= 200 && status < 400) {
    return { checkoutJsUrl: preferredUrl, usedFallback: false };
  }
  return {
    checkoutJsUrl: UAT_CHECKOUT_JS_FALLBACK,
    usedFallback: true,
  };
}
