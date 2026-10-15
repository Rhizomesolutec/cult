import { createCipheriv, createDecipheriv, createHmac, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

/**
 * Atom / NTT DATA AES-256-CBC with PBKDF2-SHA512 key derivation.
 * Matches the official AtomAES.php and nttdatapay-nodejs sample kits.
 * Key and salt are both the encryption key provided by NDPS.
 */
export function atomEncrypt(plainText: string, key: string): string {
  const password = Buffer.from(key, "utf8");
  const salt = Buffer.from(key, "utf8");
  const derivedKey = pbkdf2Sync(password, salt, 65536, 32, "sha512");
  const cipher = createCipheriv(ALGORITHM, derivedKey, IV);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf8")),
    cipher.final(),
  ]);
  return encrypted.toString("hex").toUpperCase();
}

export function atomDecrypt(cipherHex: string, key: string): string {
  const encryptedText = Buffer.from(cipherHex, "hex");
  const password = Buffer.from(key, "utf8");
  const salt = Buffer.from(key, "utf8");
  const derivedKey = pbkdf2Sync(password, salt, 65536, 32, "sha512");
  const decipher = createDecipheriv(ALGORITHM, derivedKey, IV);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hmacSha512Hex(message: string, hashKey: string): string {
  return createHmac("sha512", hashKey).update(message, "utf8").digest("hex");
}

/**
 * Final transaction / callback signature (Transaction API Non-Seamless V5):
 * merchId + atomTxnId + merchTxnId + totalAmount(2dp) + txnStatusCode + subChannel + bankTxnId
 */
export function buildPaymentResponseSignatureString(input: {
  merchId: string;
  atomTxnId: string;
  merchTxnId: string;
  totalAmount: number | string;
  statusCode: string;
  subChannel: string;
  bankTxnId: string;
}): string {
  const amount = Number(input.totalAmount).toFixed(2);
  return (
    String(input.merchId) +
    String(input.atomTxnId) +
    String(input.merchTxnId) +
    amount +
    String(input.statusCode) +
    String(input.subChannel) +
    String(input.bankTxnId)
  );
}

/**
 * Transaction Status (Requery) request/response signature sequence:
 * merchID + Password + merchTxnID + amount + txnCurrency + api
 * e.g. 446442Test@12367a44ce2ed4c610.00INRTXNVERIFICATION
 */
export function buildStatusSignatureString(input: {
  merchId: string;
  password: string;
  merchTxnId: string;
  amount: number | string;
  txnCurrency: string;
  api: string;
}): string {
  return (
    String(input.merchId) +
    String(input.password) +
    String(input.merchTxnId) +
    Number(input.amount).toFixed(2) +
    String(input.txnCurrency) +
    String(input.api)
  );
}
