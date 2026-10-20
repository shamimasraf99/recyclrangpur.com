/**
 * PM2 Production Cluster Configuration for BikroyBD Express API
 * Usage:
 *   pm2 start deploy/pm2/ecosystem.config.cjs --env production
 *   pm2 reload deploy/pm2/ecosystem.config.cjs --env production --update-env
 */
module.exports = {
  apps: [
    {
      name: 'bikroybd-api',
      cwd: '/var/www/bikroybd/current',
      script: 'server/dist/index.js',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 8000,
      kill_timeout: 10000,
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 100,
      max_restarts: 15,
      min_uptime: '10s',
      autorestart: true,
      merge_logs: true,
      out_file: '/var/log/bikroybd/api-out.log',
      error_file: '/var/log/bikroybd/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
