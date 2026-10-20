import { app } from './app';
import { env } from './config/env';
import { pool, checkDatabaseConnection } from './config/database';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, async () => {
  logger.info(`BikroyBD Marketplace API Gateway running on port ${env.PORT}`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    apiPrefix: env.API_PREFIX
  });

  const dbOk = await checkDatabaseConnection();
  if (dbOk) {
    logger.info(`[MYSQL] Connected successfully to database: ${env.DB_NAME}`);
  } else {
    logger.warn(
      `[MYSQL] Warning: Could not connect to MySQL at ${env.DB_HOST}:${env.DB_PORT}. Ensure MySQL service is running or check your .env configuration.`
    );
  }

  // Signal PM2 cluster manager that worker is ready to receive traffic
  if (typeof process.send === 'function') {
    process.send('ready');
  }
});

// Graceful Shutdown Handlers
const shutdown = async (signal: string) => {
  logger.info(`[${signal}] Initiating graceful shutdown...`);
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s, forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async () => {
    logger.info('[HTTP] Server closed.');
    try {
      await pool.end();
      logger.info('[MYSQL] Pool connections closed.');
    } catch (e: any) {
      logger.error('[MYSQL] Error during pool termination', { error: e?.message });
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  logger.error('[PROCESS] Unhandled Promise Rejection', {
    reason: reason?.message || String(reason)
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('[PROCESS] Uncaught Exception — initiating shutdown', {
    error: err.message,
    stack: err.stack
  });
  shutdown('UNCAUGHT_EXCEPTION');
});
