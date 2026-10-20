import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { query } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

export interface AuthenticatedUser {
  id: number;
  uuid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  permissions: string[];
  isSuspended: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

async function resolveUserFromToken(token: string): Promise<{ user?: AuthenticatedUser; error?: { code: string; message: string; status: number } }> {
  const payload = verifyAccessToken(token);
  if (!payload) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: 'টোকেনের মেয়াদ শেষ বা ভুল / Invalid or expired token',
        status: 401
      }
    };
  }

  const users = await query<RowDataPacket[]>(
    `SELECT u.id, u.uuid, u.full_name, u.email, u.phone_number, u.is_suspended,
            GROUP_CONCAT(DISTINCT r.name) as role_names,
            GROUP_CONCAT(DISTINCT p.code) as permission_codes
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     WHERE u.id = ? AND u.deleted_at IS NULL
     GROUP BY u.id`,
    [payload.userId]
  );

  if (users.length === 0) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: 'ব্যবহারকারী পাওয়া যায়নি / User not found',
        status: 401
      }
    };
  }

  const dbUser = users[0];
  if (dbUser.is_suspended) {
    return {
      error: {
        code: 'FORBIDDEN',
        message: 'আপনার একাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে / Account suspended',
        status: 403
      }
    };
  }

  return {
    user: {
      id: dbUser.id,
      uuid: dbUser.uuid,
      fullName: dbUser.full_name,
      email: dbUser.email,
      phoneNumber: dbUser.phone_number,
      roles: dbUser.role_names ? dbUser.role_names.split(',') : [],
      permissions: dbUser.permission_codes ? dbUser.permission_codes.split(',') : [],
      isSuspended: Boolean(dbUser.is_suspended)
    }
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'UNAUTHORIZED', 'প্রথমে লগইন করুন / Please authenticate', 401);
    }

    const token = authHeader.split(' ')[1];
    const resolved = await resolveUserFromToken(token);
    if (resolved.error) {
      return sendError(res, resolved.error.code, resolved.error.message, resolved.error.status);
    }

    req.user = resolved.user;
    return next();
  } catch (error) {
    return sendError(res, 'INTERNAL_SERVER_ERROR', 'Authentication validation failed', 500);
  }
}

/**
 * Optional authentication middleware for endpoints that behave differently
 * when accessed by an owner or moderator/admin vs an anonymous visitor.
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const resolved = await resolveUserFromToken(token);
    if (resolved.user) {
      req.user = resolved.user;
    }
    return next();
  } catch {
    return next();
  }
}
