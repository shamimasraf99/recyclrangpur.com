import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { query } from '../config/database';

export function auditLog(action: string, entityType: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Intercept finish event to log after successful response
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || null;
          const userRole = req.user?.roles.join(',') || 'anonymous';
          const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
          const userAgent = req.headers['user-agent'] || null;
          const entityId = req.params.id || 'N/A';

          await query(
            `INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, ip_address, user_agent, new_values)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              userRole,
              action,
              entityType,
              entityId,
              ipAddress,
              userAgent,
              req.body ? JSON.stringify(req.body) : null
            ]
          );
        } catch (err) {
          console.error('[AUDIT_LOG_ERROR]', err);
        }
      }
    });

    return next();
  };
}
