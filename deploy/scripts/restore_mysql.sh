#!/usr/bin/env bash
# ============================================================================
# BikroyBD Production MySQL Restore & Verification Script
# Usage:
#   ./deploy/scripts/restore_mysql.sh /var/backups/bikroybd/latest.sql.gz [TARGET_DB_NAME]
# ============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz> [target_database_name]"
  exit 1
fi

DUMP_FILE="$1"
CHECKSUM_FILE="${DUMP_FILE}.sha256"

if [ ! -f "$DUMP_FILE" ]; then
  echo "[ERROR] Backup archive not found: $DUMP_FILE"
  exit 1
fi

ENV_FILE="${ENV_FILE:-/etc/bikroybd/api.env}"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
TARGET_DB="${2:-${DB_NAME:-bikroybd_db}}"
DB_ADMIN_USER="${DB_MIGRATOR_USER:-bikroybd_migrator}"
DB_ADMIN_PASS="${DB_MIGRATOR_PASSWORD:-${DB_PASSWORD:-}}"

echo "[1/4] Verifying gzip archive integrity: $DUMP_FILE"
gzip -t "$DUMP_FILE"

if [ -f "$CHECKSUM_FILE" ]; then
  echo "[2/4] Verifying SHA-256 cryptographic checksum..."
  (cd "$(dirname "$DUMP_FILE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")")
else
  echo "[2/4] Warning: Checksum file $CHECKSUM_FILE not found, proceeding with gzip-verified archive."
fi

echo "[3/4] Restoring backup into database '${TARGET_DB}' on ${DB_HOST}:${DB_PORT}..."
gzip -dc "$DUMP_FILE" | MYSQL_PWD="$DB_ADMIN_PASS" mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_ADMIN_USER" \
  --default-character-set=utf8mb4 \
  "$TARGET_DB"

echo "[4/4] Verifying restored core tables in '${TARGET_DB}'..."
TABLE_COUNT=$(MYSQL_PWD="$DB_ADMIN_PASS" mysql -N -s \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_ADMIN_USER" \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${TARGET_DB}';")

if [ "${TABLE_COUNT:-0}" -lt 15 ]; then
  echo "[ERROR] Restore verification failed: expected at least 15 tables, found ${TABLE_COUNT}"
  exit 1
fi

echo "[SUCCESS] Database '${TARGET_DB}' restored and verified (${TABLE_COUNT} tables active)."
