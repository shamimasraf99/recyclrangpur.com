import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'accesstoken',
  'refreshtoken',
  'token',
  'tokenhash',
  'token_hash',
  'authorization',
  'cookie',
  'set-cookie',
  'bikroybd_refresh',
  'jwt_access_secret',
  'jwt_refresh_secret',
  'cookie_secret',
  'db_password',
  'cloudinary_api_secret'
]);

/**
 * Recursively redacts sensitive credentials, tokens, and secrets before logging.
 */
export function redactSecrets(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    return input.map((item) => redactSecrets(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSecrets(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  environment: string;
  message: string;
  meta?: Record<string, unknown>;
}

export const logger = {
  log(level: LogEntry['level'], message: string, meta?: Record<string, unknown>) {
    if (env.NODE_ENV === 'test') return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'bikroybd-api',
      environment: env.NODE_ENV,
      message,
      ...(meta ? { meta: redactSecrets(meta) as Record<string, unknown> } : {})
    };

    if (env.NODE_ENV === 'production') {
      const line = JSON.stringify(entry);
      if (level === 'error') {
        console.error(line);
      } else if (level === 'warn') {
        console.warn(line);
      } else {
        console.log(line);
      }
    } else {
      const metaStr = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
      console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
    }
  },
  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  },
  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }
};

/**
 * Attaches a unique X-Request-Id header and logs structured request telemetry.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'];
  const requestId =
    typeof existingId === 'string' && /^[a-zA-Z0-9-_]{8,64}$/.test(existingId)
      ? existingId
      : crypto.randomUUID();

  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, `${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  });

  next();
}
