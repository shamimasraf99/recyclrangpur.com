#!/usr/bin/env bash
# ============================================================================
# BikroyBD Production MySQL Backup Script (InnoDB Online Hot Backup)
# Usage:
#   ./deploy/scripts/backup_mysql.sh [BACKUP_DIR]
# Cron (Daily at 02:30 AM Asia/Dhaka):
#   30 2 * * * /var/www/bikroybd/current/deploy/scripts/backup_mysql.sh /var/backups/bikroybd >> /var/log/bikroybd/backup.log 2>&1
# ============================================================================
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/bikroybd/api.env}"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BACKUP_DIR="${1:-${BACKUP_DIR:-/var/backups/bikroybd}}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-bikroybd_db}"
DB_BACKUP_USER="${DB_BACKUP_USER:-${DB_USER:-bikroybd_backup}}"
DB_BACKUP_PASS="${DB_BACKUP_PASSWORD:-${DB_PASSWORD:-}}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"
chmod 0750 "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${DUMP_FILE}.sha256"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting MySQL hot backup for '${DB_NAME}' -> ${DUMP_FILE}"

MYSQL_PWD="$DB_BACKUP_PASS" mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_BACKUP_USER" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  --set-gtid-purged=OFF \
  "$DB_NAME" | gzip -9 > "$DUMP_FILE"

chmod 0640 "$DUMP_FILE"
sha256sum "$DUMP_FILE" > "$CHECKSUM_FILE"
chmod 0640 "$CHECKSUM_FILE"

# Verify gzip archive integrity and SHA-256 checksum immediately
gzip -t "$DUMP_FILE"
sha256sum -c "$CHECKSUM_FILE"

# Update latest symlink for rapid rollback access
ln -sfn "$DUMP_FILE" "${BACKUP_DIR}/latest.sql.gz"
ln -sfn "$CHECKSUM_FILE" "${BACKUP_DIR}/latest.sql.gz.sha256"

# Prune backups older than RETENTION_DAYS
find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_NAME}_*.sql.gz*" -mtime +"$RETENTION_DAYS" -delete

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup completed and verified: ${DUMP_FILE}"
