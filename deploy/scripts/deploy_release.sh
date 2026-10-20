#!/usr/bin/env bash
# ============================================================================
# BikroyBD Production Zero-Downtime Atomic Deployment Script
# Target Architecture:
#   /var/www/bikroybd/releases/<RELEASE_ID>
#   /var/www/bikroybd/current -> symlink to active release
#   /etc/bikroybd/api.env     -> root/bikroybd-owned secret file (0640)
# ============================================================================
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/bikroybd}"
RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"
ENV_FILE="${ENV_FILE:-/etc/bikroybd/api.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bikroybd}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:5000/api/v1/health/ready}"
KEEP_RELEASES=5

RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
NEW_RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
PREVIOUS_RELEASE=""

if [ -L "$CURRENT_LINK" ]; then
  PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK" || true)"
fi

echo "=================================================================="
echo " BikroyBD Production Deployment — Release ${RELEASE_ID}"
echo "=================================================================="

# 1. Verify External Secrets File Exists & Has Restricted Permissions
if [ ! -f "$ENV_FILE" ]; then
  echo "[ABORT] Production secrets file missing at ${ENV_FILE}."
  echo "Copy deploy/env/production.env.template to ${ENV_FILE} and chmod 0640 before deploying."
  exit 1
fi

PERMS="$(stat -c '%a' "$ENV_FILE")"
if [[ "$PERMS" != "600" && "$PERMS" != "640" ]]; then
  echo "[ABORT] Insecure permissions (${PERMS}) on ${ENV_FILE}. Expected 600 or 640."
  exit 1
fi

# 2. Pre-Deployment Database Backup
echo "[1/7] Running pre-deployment MySQL backup..."
bash ./deploy/scripts/backup_mysql.sh "$BACKUP_DIR"

# 3. Stage New Immutable Release Directory
echo "[2/7] Staging release directory: ${NEW_RELEASE_DIR}"
mkdir -p "$NEW_RELEASE_DIR"
rsync -a --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env*' \
  --exclude='database/backups/*.sql*' \
  ./ "${NEW_RELEASE_DIR}/"

cd "$NEW_RELEASE_DIR"

# 4. Install Dependencies & Build Production Bundles
echo "[3/7] Installing dependencies & building shared, client, and server artifacts..."
npm ci
npm run build

# 5. Execute Database Migrations with Advisory Lock
echo "[4/7] Applying forward-only MySQL schema migrations..."
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
npm run db:migrate

# 6. Atomically Switch Current Symlink & Reload PM2 + Nginx
echo "[5/7] Atomically switching ${CURRENT_LINK} -> ${NEW_RELEASE_DIR}"
ln -sfn "$NEW_RELEASE_DIR" "${CURRENT_LINK}.tmp"
mv -Tf "${CURRENT_LINK}.tmp" "$CURRENT_LINK"

echo "[6/7] Reloading PM2 cluster & validating Nginx configuration..."
if pm2 describe bikroybd-api >/dev/null 2>&1; then
  pm2 reload "${CURRENT_LINK}/deploy/pm2/ecosystem.config.cjs" --env production --update-env
else
  pm2 start "${CURRENT_LINK}/deploy/pm2/ecosystem.config.cjs" --env production
fi
pm2 save

sudo nginx -t
sudo systemctl reload nginx

# 7. Post-Deployment Health & Smoke Verification (Auto-Rollback on Failure)
echo "[7/7] Verifying readiness endpoint (${HEALTH_URL}) and running smoke tests..."
ATTEMPTS=0
MAX_ATTEMPTS=10
until curl -fsS "$HEALTH_URL" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[ERROR] Health check failed after ${MAX_ATTEMPTS} attempts! Triggering automatic rollback..."
    if [ -n "$PREVIOUS_RELEASE" ]; then
      bash "${CURRENT_LINK}/deploy/scripts/rollback_release.sh" "$PREVIOUS_RELEASE"
    fi
    exit 1
  fi
  sleep 2
done

SMOKE_TEST_URL="http://127.0.0.1:5000" node "${CURRENT_LINK}/deploy/scripts/smoke_test.js"

# Prune older release directories beyond KEEP_RELEASES
cd "$RELEASES_DIR"
ls -1dt ./*/ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "=================================================================="
echo " [SUCCESS] Release ${RELEASE_ID} deployed and verified!"
echo "=================================================================="
