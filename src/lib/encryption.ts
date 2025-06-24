import crypto from "crypto";

const algorithm = "aes-256-gcm";
const salt = "salt";
const iterations = 100000;
const keyLength = 32;

// Get encryption key from environment or generate one
const getEncryptionKey = () => {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    "default-encryption-secret-change-in-production";
  return crypto.pbkdf2Sync(secret, salt, iterations, keyLength, "sha256");
};

export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decrypt(encryptedData: {
  encrypted: string;
  iv: string;
  authTag: string;
}): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Helper functions for API key storage
export function encryptApiKey(apiKey: string): string {
  const encryptedData = encrypt(apiKey);
  // Store as a JSON string containing all necessary data for decryption
  return JSON.stringify(encryptedData);
}

export function decryptApiKey(encryptedKey: string): string {
  try {
    const encryptedData = JSON.parse(encryptedKey);
    return decrypt(encryptedData);
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    throw new Error("Invalid encrypted key format");
  }
}

export function getLastFourChars(apiKey: string): string {
  return apiKey.slice(-4);
}
