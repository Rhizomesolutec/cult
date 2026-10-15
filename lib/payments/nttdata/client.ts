import {
  createMerchTxnId,
  formatNttAmount,
  getNttDataConfig,
  type NttDataConfig,
} from "./config";
import {
  atomDecrypt,
  atomEncrypt,
  buildPaymentResponseSignatureString,
  buildStatusSignatureString,
  hmacSha512Hex,
} from "./crypto";
import type { AtomAuthSuccess, AtomCallbackPayload, AtomPaymentInstrument } from "./types";

const STATUS_API = "TXNVERIFICATION";
const STATUS_CURRENCY = "INR";

function extractEncData(raw: string): string {
  const text = raw.trim();
  if (!text.includes("=")) return text;

  const parts = text.split("&");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key.toLowerCase() === "encdata" && value) return value;
  }

  // Fallback: second segment as in official kits (merchId=...&encData=...)
  if (parts.length > 1) {
    const second = parts[1];
    const eq = second.indexOf("=");
    if (eq !== -1) return second.slice(eq + 1).trim();
  }

  throw new Error("NTT DATA response did not contain encData");
}

async function postEncrypted(
  url: string,
  encData: string,
  merchId: string,
): Promise<string> {
  const body = new URLSearchParams({
    encData,
    merchId,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`NTT DATA request failed (${res.status})`);
  }
  if (!text) {
    throw new Error("NTT DATA returned an empty response");
  }
  return text;
}

export function buildAuthRequestJson(input: {
  config: NttDataConfig;
  merchTxnId: string;
  amount: number;
  custEmail: string;
  custMobile: string;
  orderId: string;
  orderNumber: string;
}): string {
  const { config } = input;
  const amount = formatNttAmount(input.amount);
  const merchTxnDate = new Date()
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const payload = {
    payInstrument: {
      headDetails: {
        version: "OTSv1.1",
        api: "AUTH",
        platform: "FLASH",
      },
      merchDetails: {
        merchId: config.merchantId,
        userId: "",
        password: config.transactionPassword,
        merchTxnId: input.merchTxnId,
        merchTxnDate,
      },
      payDetails: {
        amount,
        product: config.product,
        custAccNo: "213232323",
        txnCurrency: "INR",
      },
      custDetails: {
        custEmail: input.custEmail,
        custMobile: input.custMobile,
      },
      extras: {
        udf1: input.orderId,
        udf2: input.orderNumber,
        udf3: "",
        udf4: "",
        udf5: "",
      },
    },
  };

  return JSON.stringify(payload);
}

export async function requestAtomToken(input: {
  amount: number;
  custEmail: string;
  custMobile: string;
  orderId: string;
  orderNumber: string;
  merchTxnId?: string;
}): Promise<AtomAuthSuccess & { config: NttDataConfig }> {
  const config = getNttDataConfig();
  const merchTxnId = input.merchTxnId || createMerchTxnId();
  const json = buildAuthRequestJson({
    config,
    merchTxnId,
    amount: input.amount,
    custEmail: input.custEmail,
    custMobile: input.custMobile,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
  });

  const encData = atomEncrypt(json, config.requestEncryptionKey);
  const raw = await postEncrypted(config.paymentUrl, encData, config.merchantId);
  const encResp = extractEncData(raw);
  const decrypted = atomDecrypt(encResp, config.responseEncryptionKey);
  const parsed = JSON.parse(decrypted) as AtomCallbackPayload & {
    atomTokenId?: string | number;
    responseDetails?: { txnStatusCode?: string; message?: string };
  };

  const txnStatusCode = String(
    parsed.responseDetails?.txnStatusCode ||
      parsed.responseDetails?.statusCode ||
      "",
  );
  const atomTokenId = parsed.atomTokenId != null ? String(parsed.atomTokenId) : "";

  if (txnStatusCode !== "OTS0000" || !atomTokenId) {
    throw new Error("Failed to obtain Atom Token ID from NTT DATA");
  }

  return { atomTokenId, merchTxnId, txnStatusCode, config };
}

export function parseCallbackEncData(encData: string): AtomCallbackPayload {
  const config = getNttDataConfig();
  const decrypted = atomDecrypt(encData, config.responseEncryptionKey);
  return JSON.parse(decrypted) as AtomCallbackPayload;
}

export function getPayInstrument(
  payload: AtomCallbackPayload,
): AtomPaymentInstrument | null {
  const raw = payload.payInstrument;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export function verifyPaymentResponseSignature(
  instrument: AtomPaymentInstrument,
): boolean {
  const config = getNttDataConfig();
  const merchId = String(instrument.merchDetails?.merchId ?? "");
  const atomTxnId = String(instrument.payDetails?.atomTxnId ?? "");
  const merchTxnId = String(instrument.merchDetails?.merchTxnId ?? "");
  const totalAmount = instrument.payDetails?.totalAmount;
  const statusCode = String(instrument.responseDetails?.statusCode ?? "");
  const subChannelRaw = instrument.payModeSpecificData?.subChannel;
  const subChannel = Array.isArray(subChannelRaw)
    ? String(subChannelRaw[0] ?? "")
    : String(subChannelRaw ?? "");
  const bankTxnId = String(
    instrument.payModeSpecificData?.bankDetails?.bankTxnId ?? "",
  );
  const provided = String(instrument.payDetails?.signature ?? "");

  if (
    !merchId ||
    !atomTxnId ||
    !merchTxnId ||
    totalAmount == null ||
    !statusCode ||
    !subChannel ||
    !bankTxnId ||
    !provided
  ) {
    return false;
  }

  const message = buildPaymentResponseSignatureString({
    merchId,
    atomTxnId,
    merchTxnId,
    totalAmount,
    statusCode,
    subChannel,
    bankTxnId,
  });
  const expected = hmacSha512Hex(message, config.responseHashKey);
  return expected === provided;
}

/**
 * Transaction Status (Requery) API — exact schema from NDPS PDF:
 * headDetails.api = TXNVERIFICATION, source = OTS;
 * signature = HMAC-SHA512(merchId+password+merchTxnId+amount+txnCurrency+api)
 * using the request hash key.
 */
export async function requeryTransactionStatus(input: {
  merchTxnId: string;
  amount: number;
  atomTxnId: string;
  merchTxnDate: string; // yyyy-MM-dd
}): Promise<AtomPaymentInstrument> {
  const config = getNttDataConfig();
  const amount = formatNttAmount(input.amount);
  const merchTxnDate = input.merchTxnDate.slice(0, 10);

  const signature = hmacSha512Hex(
    buildStatusSignatureString({
      merchId: config.merchantId,
      password: config.transactionPassword,
      merchTxnId: input.merchTxnId,
      amount,
      txnCurrency: STATUS_CURRENCY,
      api: STATUS_API,
    }),
    config.requestHashKey,
  );

  const payload = {
    payInstrument: {
      headDetails: {
        api: STATUS_API,
        source: "OTS",
      },
      merchDetails: {
        merchId: Number(config.merchantId) || config.merchantId,
        password: config.transactionPassword,
        merchTxnId: input.merchTxnId,
        merchTxnDate,
      },
      payDetails: {
        atomTxnId: input.atomTxnId,
        amount: Number(amount),
        txnCurrency: STATUS_CURRENCY,
        signature,
      },
    },
  };

  const encData = atomEncrypt(JSON.stringify(payload), config.requestEncryptionKey);

  // PDF sample uses GET ?merchId=&encData= ; also accept form POST like AUTH.
  const getUrl = `${config.statusUrl}?merchId=${encodeURIComponent(config.merchantId)}&encData=${encodeURIComponent(encData)}`;
  let raw = "";
  try {
    const res = await fetch(getUrl, {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });
    raw = await res.text();
    if (!res.ok || !raw) {
      throw new Error(`status GET failed (${res.status})`);
    }
  } catch {
    raw = await postEncrypted(config.statusUrl, encData, config.merchantId);
  }

  const encResp = extractEncData(raw);
  const decrypted = atomDecrypt(encResp, config.responseEncryptionKey);
  const parsed = JSON.parse(decrypted) as AtomCallbackPayload;
  const instrument = getPayInstrument(parsed);
  if (!instrument) {
    throw new Error("NTT DATA status response missing payInstrument");
  }
  return instrument;
}

/** Success codes from Transaction Status (Requery) PDF. */
export function isSuccessfulPaymentStatus(statusCode: string | undefined): boolean {
  return statusCode === "OTS0000" || statusCode === "OTS0002";
}

/** In-progress codes from Transaction Status (Requery) PDF — do not mark failed. */
export function isPendingPaymentStatus(statusCode: string | undefined): boolean {
  return (
    statusCode === "OTS0201" ||
    statusCode === "OTS0301" ||
    statusCode === "OTS0351" ||
    statusCode === "OTS0551"
  );
}

/** Clear failure / cancel codes from callback + requery PDFs. */
export function isFailedPaymentStatus(statusCode: string | undefined): boolean {
  return (
    statusCode === "OTS0001" ||
    statusCode === "OTS0101" ||
    statusCode === "OTS0600"
  );
}

export function verifyStatusResponseSignature(
  instrument: AtomPaymentInstrument,
  amount: number,
): boolean {
  const config = getNttDataConfig();
  const provided = String(instrument.payDetails?.signature ?? "");
  if (!provided) return false;

  const message = buildStatusSignatureString({
    merchId: String(instrument.merchDetails?.merchId ?? config.merchantId),
    password: config.transactionPassword,
    merchTxnId: String(instrument.merchDetails?.merchTxnId ?? ""),
    amount,
    txnCurrency: STATUS_CURRENCY,
    api: STATUS_API,
  });
  return hmacSha512Hex(message, config.responseHashKey) === provided;
}
