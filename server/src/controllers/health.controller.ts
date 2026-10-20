import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class HealthController {
  static async check(req: Request, res: Response) {
    const start = Date.now();
    const isDbConnected = await checkDatabaseConnection();
    const dbLatencyMs = Date.now() - start;
    const mem = process.memoryUsage();

    const data = {
      status: isDbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        status: isDbConnected ? 'connected' : 'disconnected',
        latencyMs: dbLatencyMs
      },
      memoryMB: {
        rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100
      },
      uptimeSeconds: Math.round(process.uptime()),
      version: '1.0.0',
      region: 'Asia/Dhaka'
    };

    if (!isDbConnected) {
      return sendError(res, 'DATABASE_DISCONNECTED', 'Database connection error', 503, [data]);
    }

    return sendSuccess(res, data, 'BikroyBD API Gateway is healthy');
  }

  static async ready(req: Request, res: Response) {
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      return sendError(res, 'SERVICE_NOT_READY', 'Database pool is not ready', 503);
    }
    return sendSuccess(res, { ready: true, timestamp: new Date().toISOString() }, 'Service ready to accept traffic');
  }
}
