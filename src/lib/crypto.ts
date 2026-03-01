/**
 * Phone number encryption/decryption using AES-256-GCM.
 * Requires ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 * Generate with: openssl rand -hex 32
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        // In development/test, use a deterministic fallback key
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "ENCRYPTION_KEY must be set in production (64 hex chars). Generate with: openssl rand -hex 32"
            );
        }
        // Dev fallback — never use in production
        return Buffer.from("0".repeat(64), "hex");
    }
    return Buffer.from(key, "hex");
}

/**
 * Encrypts a phone number.
 * Returns a base64-encoded string containing iv:authTag:ciphertext
 */
export function encryptPhone(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Store as: base64(iv):base64(authTag):base64(ciphertext)
    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64"),
    ].join(":");
}

/**
 * Decrypts a phone number encrypted by encryptPhone().
 * Returns null if decryption fails (tampered data, wrong key, etc.)
 */
export function decryptPhone(ciphertext: string): string | null {
    try {
        const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");
        if (!ivB64 || !authTagB64 || !encryptedB64) return null;

        const key = getKey();
        const iv = Buffer.from(ivB64, "base64");
        const authTag = Buffer.from(authTagB64, "base64");
        const encrypted = Buffer.from(encryptedB64, "base64");

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return decrypted.toString("utf8");
    } catch {
        return null;
    }
}

/**
 * Checks if a string looks like an encrypted phone (has the iv:tag:data format).
 * Used to maintain backwards compatibility during migration.
 */
export function isEncrypted(value: string): boolean {
    return value.split(":").length === 3;
}
