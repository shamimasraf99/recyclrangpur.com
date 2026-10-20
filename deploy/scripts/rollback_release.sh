#!/usr/bin/env bash
# ============================================================================
# BikroyBD Production Atomic Rollback & Recovery Script
# Usage:
#   ./deploy/scripts/rollback_release.sh [TARGET_RELEASE_DIR] [--restore-db]
# ============================================================================
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/bikroybd}"
RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bikroybd}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:5000/api/v1/health/ready}"

TARGET_RELEASE="${1:-}"
RESTORE_DB="${2:-}"

if [ -z "$TARGET_RELEASE" ] || [ "$TARGET_RELEASE" = "--restore-db" ]; then
  if [ "$TARGET_RELEASE" = "--restore-db" ]; then
    RESTORE_DB="--restore-db"
  fi
  # Automatically pick the immediate previous release directory
  TARGET_RELEASE="$(ls -1dt "${RELEASES_DIR}"/*/ 2>/dev/null | sed -n '2p' | sed 's:/$::')"
fi

if [ -z "$TARGET_RELEASE" ] || [ ! -d "$TARGET_RELEASE" ]; then
  echo "[ERROR] No valid previous release directory found to roll back to."
  exit 1
fi

echo "=================================================================="
echo " [ROLLBACK] Reverting active symlink to: ${TARGET_RELEASE}"
echo "=================================================================="

# 1. Optional Database Snapshot Rollback
if [ "$RESTORE_DB" = "--restore-db" ]; then
  LATEST_BACKUP="${BACKUP_DIR}/latest.sql.gz"
  echo "[ROLLBACK-DB] Restoring MySQL database from ${LATEST_BACKUP}..."
  bash "${TARGET_RELEASE}/deploy/scripts/restore_mysql.sh" "$LATEST_BACKUP"
fi

# 2. Atomically Re-point Symlink to Target Release
ln -sfn "$TARGET_RELEASE" "${CURRENT_LINK}.rollback"
mv -Tf "${CURRENT_LINK}.rollback" "$CURRENT_LINK"

# 3. Reload PM2 & Nginx
pm2 reload "${CURRENT_LINK}/deploy/pm2/ecosystem.config.cjs" --env production --update-env
sudo nginx -t && sudo systemctl reload nginx

# 4. Verify Health Check After Rollback
curl -fsS --retry 5 --retry-delay 2 "$HEALTH_URL"
echo ""
echo "[ROLLBACK COMPLETE] Service restored to ${TARGET_RELEASE} and verified healthy."
