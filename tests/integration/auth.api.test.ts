import { registerSchema, loginSchema } from '../../shared/schemas/auth.schema';

describe('Auth Validation Schemas', () => {
  describe('Bangladeshi Mobile & Registration Constraints', () => {
    test('accepts valid 11-digit Bangladeshi mobile formats', () => {
      const validPayload = {
        fullName: 'তানভীর আহমেদ',
        email: 'tanvir@example.com',
        phoneNumber: '01712345678',
        password: 'Password123!',
        preferredLanguage: 'bn' as const
      };

      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('accepts international +880 format for Bangladeshi mobile', () => {
      const validPayload = {
        fullName: 'রাশেদুল করিম',
        email: 'rashed@example.com',
        phoneNumber: '+8801812345678',
        password: 'Password123!',
        preferredLanguage: 'bn' as const
      };

      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid or non-Bangladeshi phone numbers', () => {
      const invalidPayload = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '12345678', // Invalid length
        password: 'Password123!',
        preferredLanguage: 'en' as const
      };

      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    test('rejects passwords shorter than 8 characters', () => {
      const shortPassPayload = {
        fullName: 'User Name',
        email: 'user@example.com',
        phoneNumber: '01912345678',
        password: 'short',
        preferredLanguage: 'bn' as const
      };

      const result = registerSchema.safeParse(shortPassPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Validation', () => {
    test('accepts email or phone identifier', () => {
      expect(loginSchema.safeParse({ identifier: 'user@example.com', password: 'secretpassword' }).success).toBe(true);
      expect(loginSchema.safeParse({ identifier: '01711223344', password: 'secretpassword' }).success).toBe(true);
    });

    test('rejects empty credentials', () => {
      expect(loginSchema.safeParse({ identifier: '', password: '' }).success).toBe(false);
    });
  });
});
