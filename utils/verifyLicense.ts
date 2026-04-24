/**
 * verifyLicense.ts — Agent-Side License Verification
 *
 * Two exports:
 *  - verifyLicense()     → Browser / Deno / modern Node (Web Crypto API / SubtleCrypto)
 *  - verifyLicenseNode() → Node.js >= 18 built-in `crypto` (sync)
 */

// ============================================================
// Shared Types
// ============================================================

export interface LicensePayload {
  company: string;
  licenseType: "account-based" | "station-based";
  /** Always 1 — each token IS one license. */
  quantity: 1;
  /** Position of this token in the batch (1-based). */
  index: number;
  hwid: string | null;
  expiry: string;
  issuedAt: string;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  payload?: LicensePayload;
}

export interface VerifyOptions {
  /** Required for station-based licenses */
  hwid?: string;
}

// ============================================================
// Browser / Web Crypto API version (async)
// ============================================================

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const cleaned = publicKeyBase64.replace(/\\n/g, "").replace(/\s/g, "");
  const keyBuffer = base64ToArrayBuffer(cleaned);
  return crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "Ed25519" },
    false,
    ["verify"]
  );
}

/**
 * verifyLicense — Browser / Deno / modern Node (Web Crypto API).
 *
 * @param token           Base64 license token from /api/license/generate
 * @param publicKeyBase64 PUBLIC_KEY (base64 SPKI, no PEM headers)
 * @param options         { hwid } — required for station-based licenses
 */
export async function verifyLicense(
  token: string,
  publicKeyBase64: string,
  options: VerifyOptions = {}
): Promise<VerifyResult> {
  try {
    // 1. Decode Base64 token
    let tokenObj: { data: string; signature: string };
    try {
      const decoded = atob(token);
      tokenObj = JSON.parse(decoded);
    } catch {
      return { valid: false, reason: "Invalid token format: failed to decode Base64." };
    }

    const { data, signature } = tokenObj;
    if (typeof data !== "string" || typeof signature !== "string") {
      return { valid: false, reason: "Invalid token structure: missing data or signature." };
    }

    // 2. Parse payload
    let payload: LicensePayload;
    try {
      payload = JSON.parse(data);
    } catch {
      return { valid: false, reason: "Invalid token payload: data is not valid JSON." };
    }

    // 3. Import public key & verify Ed25519 signature
    let pubKey: CryptoKey;
    try {
      pubKey = await importPublicKey(publicKeyBase64);
    } catch (err) {
      return { valid: false, reason: `Failed to import public key: ${(err as Error).message}` };
    }

    const encoder = new TextEncoder();
    const sigValid = await crypto.subtle.verify(
      { name: "Ed25519" },
      pubKey,
      hexToUint8Array(signature),
      encoder.encode(data)
    );

    if (!sigValid) {
      return { valid: false, reason: "Signature verification failed. Token may be tampered." };
    }

    // 4. Check expiry
    const expiryMs = new Date(payload.expiry).getTime();
    if (isNaN(expiryMs)) {
      return { valid: false, reason: "Invalid expiry date in token payload." };
    }
    if (Date.now() > expiryMs) {
      return {
        valid: false,
        reason: `License expired on ${new Date(payload.expiry).toLocaleDateString()}.`,
        payload,
      };
    }

    // 5. HWID check (station-based)
    if (payload.licenseType === "station-based") {
      if (!options.hwid) {
        return {
          valid: false,
          reason: "Station-based license requires hwid for verification.",
          payload,
        };
      }
      if (payload.hwid !== options.hwid) {
        return {
          valid: false,
          reason: `Hardware ID mismatch. Expected "${payload.hwid}", got "${options.hwid}".`,
          payload,
        };
      }
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: `Unexpected error: ${(err as Error).message}` };
  }
}

// ============================================================
// Node.js version — built-in `crypto` (sync)
// ============================================================

/**
 * verifyLicenseNode — Node.js >= 18 synchronous variant.
 *
 * @param token           Base64 license token
 * @param publicKeyBase64 PUBLIC_KEY (base64 SPKI, no PEM headers)
 * @param options         { hwid } — required for station-based
 */
export function verifyLicenseNode(
  token: string,
  publicKeyBase64: string,
  options: VerifyOptions = {}
): VerifyResult {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPublicKey, verify } = require("crypto") as typeof import("crypto");

  try {
    // 1. Decode token
    let tokenObj: { data: string; signature: string };
    try {
      tokenObj = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    } catch {
      return { valid: false, reason: "Invalid token format: failed to decode Base64." };
    }

    const { data, signature } = tokenObj;
    if (typeof data !== "string" || typeof signature !== "string") {
      return { valid: false, reason: "Invalid token structure." };
    }

    // 2. Parse payload
    let payload: LicensePayload;
    try {
      payload = JSON.parse(data);
    } catch {
      return { valid: false, reason: "Invalid token payload." };
    }

    // 3. Verify signature
    const cleaned = publicKeyBase64.replace(/\\n/g, "").replace(/\s/g, "");
    const pemBody = cleaned.match(/.{1,64}/g)!.join("\n");
    const pem = `-----BEGIN PUBLIC KEY-----\n${pemBody}\n-----END PUBLIC KEY-----\n`;
    const pubKey = createPublicKey({ key: pem, format: "pem", type: "spki" });

    const sigValid = verify(
      null,
      Buffer.from(data, "utf8"),
      pubKey,
      Buffer.from(signature, "hex")
    );

    if (!sigValid) {
      return { valid: false, reason: "Signature verification failed. Token may be tampered." };
    }

    // 4. Expiry
    if (Date.now() > new Date(payload.expiry).getTime()) {
      return { valid: false, reason: `License expired on ${payload.expiry}.`, payload };
    }

    // 5. HWID
    if (payload.licenseType === "station-based") {
      const { hwid } = options;
      if (!hwid) {
        return { valid: false, reason: "hwid required for station-based verification.", payload };
      }
      if (payload.hwid !== hwid) {
        return {
          valid: false,
          reason: `Hardware ID mismatch. Expected "${payload.hwid}", got "${hwid}".`,
          payload,
        };
      }
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: `Unexpected error: ${(err as Error).message}` };
  }
}
