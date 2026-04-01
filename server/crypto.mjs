import crypto from "crypto";

function getKeyMaterial() {
  return process.env.APP_ENCRYPTION_KEY || process.env.JWT_SECRET || "vexor-local-encryption-key";
}

function deriveKey() {
  return crypto.createHash("sha256").update(getKeyMaterial()).digest();
}

export function encryptJson(value) {
  if (value == null) return null;

  const iv = crypto.randomBytes(12);
  const key = deriveKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    content: encrypted.toString("base64"),
  });
}

export function decryptJson(value, fallback = null) {
  if (!value) return fallback;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    const iv = Buffer.from(parsed.iv, "base64");
    const tag = Buffer.from(parsed.tag, "base64");
    const content = Buffer.from(parsed.content, "base64");
    const key = deriveKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]).toString("utf8");
    return JSON.parse(decrypted);
  } catch {
    return fallback;
  }
}

