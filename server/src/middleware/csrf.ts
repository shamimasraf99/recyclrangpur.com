import { Request, Response, NextFunction } from 'express';
import { env, getTrustedOrigins } from '../config/env';
import { sendError } from '../utils/apiResponse';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defense-in-depth CSRF protection for state-changing requests.
 * Verifies that any browser Origin/Referer header on state-changing requests
 * matches allowed origins, preventing cross-site form/fetch forging against cookie endpoints.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const allowedOrigins = getTrustedOrigins(env);

  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    return sendError(
      res,
      'CSRF_ORIGIN_MISMATCH',
      'নিরাপত্তা ত্রুটি: অননুমোদিত অরিজিন থেকে অনুরোধ প্রত্যাখ্যান করা হয়েছে / Cross-origin state mutation blocked',
      403
    );
  }

  const referer = req.headers.referer;
  if (!origin && referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refOrigin)) {
        return sendError(
          res,
          'CSRF_REFERER_MISMATCH',
          'নিরাপত্তা ত্রুটি: অননুমোদিত রেফারার থেকে অনুরোধ প্রত্যাখ্যান করা হয়েছে / Cross-origin referer blocked',
          403
        );
      }
    } catch {
      return sendError(res, 'CSRF_INVALID_REFERER', 'Malformed Referer header', 403);
    }
  }

  return next();
}
