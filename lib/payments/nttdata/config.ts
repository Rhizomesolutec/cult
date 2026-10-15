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
