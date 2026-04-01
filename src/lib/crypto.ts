/**
 * AES-256-GCM encryption for sensitive values (Meta tokens).
 * Key must be 32 bytes (64 hex chars) from ENCRYPTION_KEY env var.
 * NEVER expose encrypted values or keys to the frontend.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)"
    );
  }
  return Buffer.from(hex, "hex");
}

export interface EncryptedValue {
  enc: string; // base64 ciphertext
  iv: string;  // base64 IV
  tag: string; // base64 auth tag
}

export function encrypt(plaintext: string): EncryptedValue {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    enc: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decrypt(value: EncryptedValue): string {
  const key = getKey();
  const iv = Buffer.from(value.iv, "base64");
  const tag = Buffer.from(value.tag, "base64");
  const ciphertext = Buffer.from(value.enc, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function hashSHA256(data: string | Buffer): string {
  const { createHash } = require("crypto");
  return createHash("sha256")
    .update(data)
    .digest("hex");
}
