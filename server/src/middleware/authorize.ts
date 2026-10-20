import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { sendError } from '../utils/apiResponse';

/**
 * Require specific granular permission (Super Admin bypasses all checks)
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'অননুমোদিত অ্যাক্সেস / Unauthorized', 401);
    }

    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    if (!req.user.permissions.includes(permissionCode)) {
      return sendError(res, 'FORBIDDEN', 'এই কাজটি করার জন্য আপনার অনুমতি নেই / Permission denied', 403);
    }

    return next();
  };
}

/**
 * Require specific user role
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'অননুমোদিত অ্যাক্সেস / Unauthorized', 401);
    }

    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    const hasRole = req.user.roles.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      return sendError(res, 'FORBIDDEN', 'আপনার রোল এই রিসোর্সে অনুমোদিত নয় / Forbidden role', 403);
    }

    return next();
  };
}
