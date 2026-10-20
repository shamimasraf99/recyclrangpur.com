import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips dangerous XSS vectors (<script>, <iframe>, <object>, <embed>,
 * inline event handlers, javascript:/vbscript:/data:text/html URIs, null bytes)
 * from strings in request payloads while preserving valid Bengali Unicode text.
 */
export function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') {
    return val
      .replace(/\0/g, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<\/?script[^>]*>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<\/?(?:iframe|object|embed|applet|meta|link|style|svg)\b[^>]*>/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(?:javascript|vbscript)\s*:/gi, '')
      .replace(/data\s*:\s*text\/html[^"'\s>]*/gi, '');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      // Prevent prototype pollution keys
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return val;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as any;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as any;
  }
  return next();
}
