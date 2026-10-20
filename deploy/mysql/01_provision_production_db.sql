-- ============================================================================
-- BikroyBD Production MySQL 8.0+ Provisioning & Least-Privilege Access Script
-- ============================================================================
-- Execute as MySQL root/admin on the target Linux VPS:
--   sudo mysql -u root -p < deploy/mysql/01_provision_production_db.sql
--
-- IMPORTANT: Replace placeholder passwords before executing in production!
-- Generate strong passwords using: openssl rand -base64 32
-- ============================================================================

-- 1. Create Production Database with Full Bengali Unicode (utf8mb4) Support
CREATE DATABASE IF NOT EXISTS `bikroybd_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Create Restricted Schema Migration User (Bound strictly to loopback 127.0.0.1)
-- Used ONLY during `npm run db:migrate` deployment steps.
CREATE USER IF NOT EXISTS 'bikroybd_migrator'@'127.0.0.1'
  IDENTIFIED WITH caching_sha2_password BY 'REPLACE_WITH_STRONG_MIGRATOR_PASSWORD'
  FAILED_LOGIN_ATTEMPTS 5 PASSWORD_LOCK_TIME 2;

REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'bikroybd_migrator'@'127.0.0.1';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, LOCK TABLES
  ON `bikroybd_db`.* TO 'bikroybd_migrator'@'127.0.0.1';

-- 3. Create Restricted Application Runtime User (Bound strictly to loopback 127.0.0.1)
-- Used by the Express API (`DB_USER=bikroybd_app`).
-- Deliberately excludes DROP, TRUNCATE, ALTER, CREATE, FILE, SUPER, and GRANT OPTION.
CREATE USER IF NOT EXISTS 'bikroybd_app'@'127.0.0.1'
  IDENTIFIED WITH caching_sha2_password BY 'REPLACE_WITH_STRONG_APP_RUNTIME_PASSWORD'
  WITH MAX_USER_CONNECTIONS 60
  FAILED_LOGIN_ATTEMPTS 5 PASSWORD_LOCK_TIME 2;

REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'bikroybd_app'@'127.0.0.1';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE
  ON `bikroybd_db`.* TO 'bikroybd_app'@'127.0.0.1';

-- 4. Create Read-Only Backup User for Automated mysqldump Jobs
CREATE USER IF NOT EXISTS 'bikroybd_backup'@'127.0.0.1'
  IDENTIFIED WITH caching_sha2_password BY 'REPLACE_WITH_STRONG_BACKUP_PASSWORD';

REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'bikroybd_backup'@'127.0.0.1';

GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES, PROCESS
  ON `bikroybd_db`.* TO 'bikroybd_backup'@'127.0.0.1';

FLUSH PRIVILEGES;

-- 5. Verification Queries
SHOW GRANTS FOR 'bikroybd_app'@'127.0.0.1';
SHOW GRANTS FOR 'bikroybd_migrator'@'127.0.0.1';
SHOW GRANTS FOR 'bikroybd_backup'@'127.0.0.1';
