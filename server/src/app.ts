import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import v1Routes from './routes/v1';
import { env, getTrustedOrigins } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/sanitize';
import { csrfProtection } from './middleware/csrf';
import { apiLimiter } from './middleware/rateLimiter';
import { sendError } from './utils/apiResponse';
import { requestLoggerMiddleware } from './utils/logger';

export const app = express();

// Trust reverse proxy (Nginx / Cloudflare) so req.ip, X-Forwarded-For, and Secure cookies work accurately
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

// Security Headers (HSTS, CSP, Frameguard, Referrer-Policy)
app.use(
  helmet({
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  })
);

// Production-Hardened Multi-Origin CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const trustedOrigins = getTrustedOrigins(env);
      if (trustedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
  })
);

// Body & Cookie Parsers (1MB limit for JSON/URL-encoded to prevent memory DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Global XSS & Prototype Pollution Input Sanitizer
app.use(sanitizeInput);

// CSRF Origin/Referer Verification for State-Changing Requests
app.use(csrfProtection);

// Structured Request Logger & X-Request-Id Correlation
app.use(requestLoggerMiddleware);

// Mount REST API V1 with Global Rate Limiter
app.use(env.API_PREFIX, apiLimiter, v1Routes);

// Root Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    platform: 'BikroyBD — Bangladesh Used Products Marketplace',
    version: '1.0.0',
    documentation: '/docs/API_SPECIFICATION.md',
    healthCheck: `${env.API_PREFIX}/health`
  });
});

// 404 Not Found Catch-All
app.use((req: Request, res: Response) => {
  sendError(res, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
