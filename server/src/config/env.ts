import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEV_ACCESS_SECRET = 'development_jwt_access_secret_key_12345';
const DEV_REFRESH_SECRET = 'development_jwt_refresh_secret_key_12345';
const DEV_COOKIE_SECRET = 'development_cookie_secret_key_12345';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    API_PREFIX: z.string().default('/api/v1'),
    APP_URL: z.string().default('http://localhost:3000'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    TRUSTED_ORIGINS: z.string().default(''),
    TRUST_PROXY: z.union([z.coerce.number().int().min(0), z.boolean()]).default(1),

    // MySQL Database
    DB_HOST: z.string().min(1).default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1).default('root'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().min(1).default('bikroybd_db'),
    DB_CONNECTION_LIMIT: z.coerce.number().int().positive().max(200).default(10),

    // JWT & Sessions
    JWT_ACCESS_SECRET: z.string().min(16).default(DEV_ACCESS_SECRET),
    JWT_REFRESH_SECRET: z.string().min(16).default(DEV_REFRESH_SECRET),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('30d'),
    COOKIE_SECRET: z.string().min(16).default(DEV_COOKIE_SECRET),
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),

    // Logging & Monitoring
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_DIR: z.string().default('/var/log/bikroybd'),

    // Cloudinary / Object Storage (Optional — falls back to Sharp WebP Data URI if unconfigured)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.DB_PASSWORD || data.DB_PASSWORD === 'your_secure_db_password') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DB_PASSWORD'],
          message: 'Production environment requires a non-empty, non-placeholder DB_PASSWORD'
        });
      }
      if (data.DB_USER === 'root') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DB_USER'],
          message: 'Production environment must use a restricted MySQL user instead of root'
        });
      }
      if (data.JWT_ACCESS_SECRET === DEV_ACCESS_SECRET || data.JWT_ACCESS_SECRET.includes('your_jwt_access_secret')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'Production environment requires a unique, strong JWT_ACCESS_SECRET'
        });
      }
      if (data.JWT_REFRESH_SECRET === DEV_REFRESH_SECRET || data.JWT_REFRESH_SECRET.includes('your_jwt_refresh_secret')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'Production environment requires a unique, strong JWT_REFRESH_SECRET'
        });
      }
      if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct in production'
        });
      }
      if (data.COOKIE_SECRET === DEV_COOKIE_SECRET || data.COOKIE_SECRET === 'your_cookie_signing_secret') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['COOKIE_SECRET'],
          message: 'Production environment requires a unique COOKIE_SECRET'
        });
      }
      if (!data.APP_URL.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['APP_URL'],
          message: 'Production APP_URL must use HTTPS (e.g., https://bikroybd.com)'
        });
      }
      const origins = [data.CORS_ORIGIN, data.TRUSTED_ORIGINS]
        .flatMap((o) => o.split(',').map((s) => s.trim()))
        .filter(Boolean);
      if (origins.some((o) => !o.startsWith('https://'))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: 'All production CORS_ORIGIN and TRUSTED_ORIGINS entries must use HTTPS'
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(rawEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  return envSchema.parse(rawEnv);
}

export function getTrustedOrigins(config: EnvConfig = env): Set<string> {
  const configured = [config.CORS_ORIGIN, config.APP_URL, config.TRUSTED_ORIGINS]
    .flatMap((o) => (o || '').split(',').map((s) => s.trim()))
    .filter(Boolean);

  if (config.NODE_ENV !== 'production') {
    configured.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000');
  }

  return new Set(configured);
}

export const env = parseEnv(process.env);
