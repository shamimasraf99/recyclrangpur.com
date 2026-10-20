import { describe, it, expect } from '@jest/globals';
import { sanitizeValue } from '../../server/src/middleware/sanitize';
import { csrfProtection } from '../../server/src/middleware/csrf';
import { parseEnv } from '../../server/src/config/env';
import { createProductSchema } from '../../shared/schemas/product.schema';
import { createReportSchema } from '../../shared/schemas/report.schema';
import { registerSchema } from '../../shared/schemas/auth.schema';

describe('Phase 6 — Production Security & Quality Regression Suite', () => {
  describe('1. Environment Variable & Production Secret Validation', () => {
    it('Rejects default/missing secrets when NODE_ENV=production', () => {
      expect(() =>
        parseEnv({
          NODE_ENV: 'production',
          DB_PASSWORD: ''
        } as any)
      ).toThrow();
    });

    it('Rejects identical JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production', () => {
      expect(() =>
        parseEnv({
          NODE_ENV: 'production',
          DB_PASSWORD: 'prod_strong_db_password_99',
          JWT_ACCESS_SECRET: 'same_secret_key_for_both_tokens_123456',
          JWT_REFRESH_SECRET: 'same_secret_key_for_both_tokens_123456',
          COOKIE_SECRET: 'unique_cookie_secret_key_987654321'
        } as any)
      ).toThrow();
    });

    it('Accepts strong, distinct secrets when NODE_ENV=production', () => {
      const parsed = parseEnv({
        NODE_ENV: 'production',
        DB_PASSWORD: 'prod_strong_db_password_99',
        JWT_ACCESS_SECRET: 'access_secret_key_production_987654321',
        JWT_REFRESH_SECRET: 'refresh_secret_key_production_123456789',
        COOKIE_SECRET: 'cookie_secret_key_production_555666777'
      } as any);
      expect(parsed.NODE_ENV).toBe('production');
    });
  });

  describe('2. XSS, Prototype Pollution & CSRF Hardening', () => {
    it('Sanitizes script, iframe, svg, inline handlers, javascript: and data:text/html while preserving Bengali Unicode', () => {
      const dirty = {
        title: 'আইফোন ১৩ <script>alert(1)</script><iframe src="evil"></iframe><svg onload=alert(1)>',
        link: 'javascript:alert(document.cookie)',
        dataUri: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        nested: JSON.parse('{"__proto__":{"polluted":true},"safe":"ঢাকা"}')
      };
      const cleaned = sanitizeValue(dirty) as any;
      expect(cleaned.title).toBe('আইফোন ১৩ ');
      expect(cleaned.link).not.toContain('javascript:');
      expect(cleaned.dataUri).not.toContain('data:text/html');
      expect(({} as any).polluted).toBeUndefined();
      expect(cleaned.nested.safe).toBe('ঢাকা');
    });

    it('Blocks cross-origin POST requests via csrfProtection middleware', () => {
      const req: any = {
        method: 'POST',
        headers: {
          origin: 'https://evil-attacker.example.com'
        }
      };
      let statusCode = 200;
      let body: any = null;
      const res: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(payload: any) {
          body = payload;
          return this;
        }
      };
      let nextCalled = false;
      csrfProtection(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(false);
      expect(statusCode).toBe(403);
      expect(body.error.code).toBe('CSRF_ORIGIN_MISMATCH');
    });
  });

  describe('3. Input Schema & Malformed Request Validation', () => {
    it('Rejects javascript: URIs in product imageUrls while allowing HTTPS and data:image/webp', () => {
      const bad = createProductSchema.safeParse({
        title: 'Samsung Galaxy S23 Ultra',
        description: 'Official phone in mint condition with full box and charger.',
        categoryId: 1,
        subcategoryId: 1,
        priceBdt: 85000,
        condition: 'like_new',
        divisionId: 1,
        districtId: 1,
        contactPhone: '01712345678',
        imageUrls: ['javascript:alert(1)']
      });
      expect(bad.success).toBe(false);

      const good = createProductSchema.safeParse({
        title: 'Samsung Galaxy S23 Ultra',
        description: 'Official phone in mint condition with full box and charger.',
        categoryId: 1,
        subcategoryId: 1,
        priceBdt: 85000,
        condition: 'like_new',
        divisionId: 1,
        districtId: 1,
        contactPhone: '01712345678',
        imageUrls: ['data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA='],
        moderationStatus: 'draft'
      });
      expect(good.success).toBe(true);
      if (good.success) {
        expect(good.data.moderationStatus).toBe('draft');
      }
    });

    it('Validates abuse report target and minimum explanation length', () => {
      const missingTarget = createReportSchema.safeParse({
        reasonCode: 'fraud_scam',
        explanation: 'This seller is asking for advance payment via bKash.'
      });
      expect(missingTarget.success).toBe(false);

      const validReport = createReportSchema.safeParse({
        productId: 5,
        reasonCode: 'fraud_scam',
        explanation: 'This seller is asking for advance payment via bKash.'
      });
      expect(validReport.success).toBe(true);
    });

    it('Enforces Bangladeshi phone number format on registration', () => {
      const invalidPhone = registerSchema.safeParse({
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '12345',
        password: 'password123'
      });
      expect(invalidPhone.success).toBe(false);
    });
  });
});
