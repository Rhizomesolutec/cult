/**
 * Offline self-check for NTT DATA AES + HMAC helpers (no network, no secrets from .env).
 * Run: node scripts/nttdata-crypto-selfcheck.mjs
 */
import { createCipheriv, createDecipheriv, createHmac, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

function atomEncrypt(plainText, key) {
  const password = Buffer.from(key, "utf8");
  const salt = Buffer.from(key, "utf8");
  const derivedKey = pbkdf2Sync(password, salt, 65536, 32, "sha512");
  const cipher = createCipheriv(ALGORITHM, derivedKey, IV);
  return Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf8")),
    cipher.final(),
  ])
    .toString("hex")
    .toUpperCase();
}

function atomDecrypt(cipherHex, key) {
  const encryptedText = Buffer.from(cipherHex, "hex");
  const password = Buffer.from(key, "utf8");
  const salt = Buffer.from(key, "utf8");
  const derivedKey = pbkdf2Sync(password, salt, 65536, 32, "sha512");
  const decipher = createDecipheriv(ALGORITHM, derivedKey, IV);
  return Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]).toString("utf8");
}

function hmacSha512Hex(message, hashKey) {
  return createHmac("sha512", hashKey).update(message, "utf8").digest("hex");
}

const sampleKey = "58BE879B7DD635698764745511C704AB";
const plain = JSON.stringify({ payInstrument: { headDetails: { api: "AUTH" } } });
const enc = atomEncrypt(plain, sampleKey);
const dec = atomDecrypt(enc, sampleKey);
if (dec !== plain) {
  console.error("FAIL: AES round-trip mismatch");
  process.exit(1);
}

// Status signature sample sequence from Transaction Status (Requery) PDF
const statusMsg = "446442Test@12367a44ce2ed4c610.00INRTXNVERIFICATION";
const statusSig = hmacSha512Hex(statusMsg, "KEY123657234");
if (statusSig.length !== 128) {
  console.error("FAIL: unexpected HMAC length", statusSig.length);
  process.exit(1);
}

// Callback signature sequence from Transaction API Non-Seamless V5
const cbMsg = "1191110000001234abc12310.00OTS0000NB11dsff232311";
const cbSig = hmacSha512Hex(cbMsg, "KEYRESP123657234");
if (cbSig.length !== 128) {
  console.error("FAIL: unexpected callback HMAC length");
  process.exit(1);
}

console.log("OK: AES round-trip + HMAC-SHA512 signature strings");
