import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

// Runtime fallback generated once per process lifecycle in dev/test if env vars are omitted
const PROCESS_FALLBACK_KEY = crypto.randomBytes(32);

/**
 * Derives a consistent 32-byte cryptographic key for AES-256-GCM.
 *
 * Production Security Rules:
 * - Strictly requires dedicated COOKIE_ENCRYPTION_SECRET (no fallback to JWT_SECRET).
 * - Requires a 64-character hexadecimal string representing exactly 32 random bytes.
 * - Generate via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Development / Test Rules:
 * - Uses COOKIE_ENCRYPTION_SECRET, fallback JWT_SECRET, or runtime PROCESS_FALLBACK_KEY.
 */
export const getEncryptionKey = () => {
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.COOKIE_ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error(
        'FATAL: Dedicated COOKIE_ENCRYPTION_SECRET must be configured in production environment. Do not reuse JWT_SECRET. Generate a 64-character hex key via: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    const cleanSecret = secret.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(cleanSecret)) {
      throw new Error(
        'FATAL: COOKIE_ENCRYPTION_SECRET must be a 64-character hexadecimal string representing 32 random bytes. Generate securely using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    return Buffer.from(cleanSecret, 'hex');
  }

  // Development and test environments
  const devSecret = process.env.COOKIE_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!devSecret) {
    return PROCESS_FALLBACK_KEY;
  }
  const cleanDev = devSecret.trim();
  if (/^[0-9a-fA-F]{64}$/.test(cleanDev)) {
    return Buffer.from(cleanDev, 'hex');
  }
  return crypto.createHash('sha256').update(cleanDev).digest();
};

/**
 * Encrypts a sensitive authentication token before storing it in a client-side cookie.
 * Solves CodeQL CWE-312 / CWE-315 (Clear-text storage of sensitive information).
 *
 * @param {string} plainToken - The JWT or sensitive token to encrypt
 * @returns {string} Encrypted token in format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export const encryptCookieToken = (plainToken) => {
  if (!plainToken || typeof plainToken !== 'string') return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a cookie token for authentication verification.
 *
 * Fail-Closed Security Policy:
 * 1. If the token contains colons (:), it is strictly handled as an AES-256-GCM encrypted token.
 *    Any tampering, invalid tag, or corrupted ciphertext immediately fails closed (returns null).
 * 2. If the token contains no colons and exactly 2 dots (.), it represents a legacy plaintext JWT.
 *    Safe Migration Policy:
 *    - Legacy plaintext JWT cookies are REJECTED BY DEFAULT.
 *    - Legacy acceptance is strictly opt-in via ALLOW_LEGACY_COOKIE_AUTH=true.
 *    - Operators should enable this flag during a 7-day migration deployment window only, then remove it.
 *    - An optional LEGACY_COOKIE_MIGRATION_DEADLINE (ISO date or epoch ms) can enforce automatic expiration.
 *
 * @param {string} cookieValue - The encrypted token string from req.cookies
 * @returns {string|null} The decrypted token string, or raw JWT if valid format and permitted, or null
 */
export const decryptCookieToken = (cookieValue) => {
  if (!cookieValue || typeof cookieValue !== 'string') return null;

  // 1. Strict Encrypted Token handling (colon-delimited hex)
  if (cookieValue.includes(':')) {
    const parts = cookieValue.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    if (!ivHex || !authTagHex || !encryptedHex) return null;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
        return null;
      }

      const key = getEncryptionKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Any decipher/authTag failure fails closed immediately
      return null;
    }
  }

  // 2. Legacy Migration Pass-Through (3 dot-delimited parts)
  // Strictly opt-in only; rejected by default.
  if (process.env.ALLOW_LEGACY_COOKIE_AUTH === 'true') {
    // Optional migration deadline enforcement (e.g. ISO-8601 string or epoch timestamp)
    if (process.env.LEGACY_COOKIE_MIGRATION_DEADLINE) {
      const deadline = new Date(process.env.LEGACY_COOKIE_MIGRATION_DEADLINE).getTime();
      if (Number.isNaN(deadline) || Date.now() > deadline) {
        return null; // Migration window has expired or deadline is invalid (fail closed)
      }
    }

    const dotParts = cookieValue.split('.');
    if (dotParts.length === 3 && dotParts.every((p) => p.length > 0)) {
      return cookieValue;
    }
  }

  return null;
};
