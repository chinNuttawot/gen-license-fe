/**
 * bundleCrypto.ts
 * Client-side AES-256-GCM encryption for license bundles.
 *
 * Encrypt → produces an opaque .aglic file
 * Decrypt → needs the Bundle Key shown at export time
 */

// ──────────────────── Types ────────────────────────────────

export interface LicenseBundle {
  version: 1;
  meta: {
    company: string;
    licenseType: string;
    expiry: string;
    issuedAt: string;
    hwids?: string[];
  };
  tokens: string[];
}

interface EncryptedEnvelope {
  /** Format version */
  v: 1;
  /** Algorithm identifier */
  alg: "AES-GCM-256";
  /** Base64 IV (12 bytes) */
  iv: string;
  /** Base64 AES-GCM ciphertext (includes 16-byte auth tag) */
  data: string;
}

// ──────────────────── Helpers ───────────────────────────────

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ──────────────────── Encrypt ───────────────────────────────

/**
 * Encrypts a bundle with a freshly-generated AES-256-GCM key.
 *
 * @returns
 *   `fileContent` — the string to save as .aglic (base64-encoded JSON envelope)
 *   `bundleKey`   — base64 symmetric key the reader MUST have to decrypt
 */
export async function encryptBundle(bundle: LicenseBundle): Promise<{
  fileContent: string;
  bundleKey: string;
}> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(bundle));

  // 1. Generate random 256-bit key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,   // extractable — we need to export it for the user
    ["encrypt", "decrypt"]
  );

  // 2. Random 96-bit IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  // 4. Export raw key → base64
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const bundleKey = toBase64(rawKey);

  // 5. Build envelope JSON → base64 (double-encoding makes it look more opaque)
  const envelope: EncryptedEnvelope = {
    v: 1,
    alg: "AES-GCM-256",
    iv: toBase64(iv),
    data: toBase64(ciphertext),
  };

  const fileContent = btoa(JSON.stringify(envelope));
  return { fileContent, bundleKey };
}

// ──────────────────── Decrypt ───────────────────────────────

/**
 * Decrypts a .aglic file back to a LicenseBundle.
 *
 * @param fileContent  The raw string content of the .aglic file
 * @param bundleKey    The base64 Bundle Key shown at export time
 */
export async function decryptBundle(
  fileContent: string,
  bundleKey: string
): Promise<LicenseBundle> {
  // Parse envelope
  const envelope: EncryptedEnvelope = JSON.parse(atob(fileContent));
  if (envelope.v !== 1 || envelope.alg !== "AES-GCM-256") {
    throw new Error("Unsupported bundle format.");
  }

  // Import key
  const keyBytes = fromBase64(bundleKey);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.data);
  let plaintext: ArrayBuffer;

  try {
    plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  } catch {
    throw new Error("Decryption failed — wrong Bundle Key or corrupted file.");
  }

  const json = new TextDecoder().decode(plaintext);
  return JSON.parse(json) as LicenseBundle;
}

// ──────────────────── Download helper ───────────────────────

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
