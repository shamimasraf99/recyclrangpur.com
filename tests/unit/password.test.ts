import { hashPassword, verifyPassword, generateSecureToken, hashToken } from '../../server/src/utils/password';

describe('Password & Token Cryptography Utility', () => {
  const plainPassword = 'SecretPassword123!';

  test('hashes password using Argon2id or bcrypt', async () => {
    const hash = await hashPassword(plainPassword);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
  });

  test('verifies correct password returns true', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword(plainPassword, hash);
    expect(isValid).toBe(true);
  });

  test('verifies incorrect password returns false', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword('WrongPassword!', hash);
    expect(isValid).toBe(false);
  });

  test('generates secure 64-hex-character token', () => {
    const token = generateSecureToken(32);
    expect(token).toHaveLength(64);
  });

  test('hashes token using SHA-256 reproducibly', () => {
    const token = 'sample-random-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
