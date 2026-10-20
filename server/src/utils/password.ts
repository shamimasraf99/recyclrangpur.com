import crypto from 'crypto';

let argon2: typeof import('argon2') | null = null;
try {
  argon2 = require('argon2');
} catch (e) {
  // Argon2 native bindings may not be available in all minimal container environments
}

const bcrypt = require('bcrypt');

/**
 * Hash password using Argon2id with automatic bcrypt fallback
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (argon2) {
    try {
      return await argon2.hash(plainText, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4
      });
    } catch {
      // Fallback if argon2 runtime fails
    }
  }
  return await bcrypt.hash(plainText, 12);
}

/**
 * Verify password with timing-safe comparison
 */
export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  if (hashed.startsWith('$argon2') && argon2) {
    try {
      return await argon2.verify(hashed, plainText);
    } catch {
      return false;
    }
  }
  return await bcrypt.compare(plainText, hashed);
}

/**
 * Generate cryptographically secure random token (e.g. for refresh tokens)
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * SHA-256 hash for storing refresh tokens safely in database
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
