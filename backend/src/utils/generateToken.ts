import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random token.
 * @param length - Number of random bytes (output hex string is 2x this length). Default: 32 → 64-char hex.
 */
export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex');
};

/**
 * Generate a Kemet-branded booking reference number.
 * Format: KMT-<YYYYMMDD>-<6 chars alphanumeric>
 * Example: KMT-20260521-A3BX7Q
 */
export const generateReferenceNumber = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KMT-${today}-${suffix}`;
};

/**
 * Generate a short OTP-style numeric code.
 * @param digits - Number of digits. Default: 6.
 */
export const generateOtpCode = (digits: number = 6): string => {
  const buffer = randomBytes(4);
  const num = buffer.readUInt32BE(0);
  const otp = num % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
};

export default { generateSecureToken, generateReferenceNumber, generateOtpCode };
