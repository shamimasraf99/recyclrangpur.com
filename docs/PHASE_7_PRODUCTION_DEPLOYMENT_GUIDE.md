# Phase 7: Production Preparation & Deployment Guide (BikroyBD Marketplace)

**Target Architecture**
- **Compute**: Linux VPS (Ubuntu 22.04 / 24.04 LTS, 2+ vCPU, 4 GB+ RAM) running Node.js 20/22 LTS.
- **Database**: MySQL 8.0+ (`InnoDB`, `utf8mb4` / `utf8mb4_unicode_ci` for Bengali script).
- **Frontend**: React 18 + Vite production static bundle (`/var/www/bikroybd/current/client/dist`) served directly by Nginx with immutable asset caching.
- **Backend API**: Express + TypeScript REST API (`127.0.0.1:5000`) clustered via PM2 (`deploy/pm2/ecosystem.config.cjs`) or managed via Systemd (`deploy/systemd/bikroybd-api.service`) behind Nginx reverse proxy.
- **Edge & TLS**: Custom domain (`bikroybd.com`) with Let's Encrypt TLS 1.2/1.3 certificates, OCSP stapling, and HSTS (`max-age=63072000; includeSubDomains; preload`).

---

## 1. Production Build & Environment Configuration

### 1.1 Keeping Secrets Outside the Repository
- **Never commit `.env` or production secrets to Git.** `.gitignore` strictly excludes `.env`, `.env.*`, `*.pem`, `*.key`, `*.crt`, and `database/backups/*.sql*`.
- **Frontend Bundle Isolation**: Only public `VITE_API_BASE_URL` and `VITE_APP_URL` variables exist in `client/.env.production.example`. The build script (`scripts/build_production.js`) automatically scans `client/src` and `client/dist` and fails the build if any database credential or backend secret pattern (`DB_PASSWORD`, `JWT_*_SECRET`, `COOKIE_SECRET`, `CLOUDINARY_API_SECRET`) is detected.
- **Backend Secrets Location on VPS**: Store production secrets in `/etc/bikroybd/api.env` owned by `root:bikroybd` with `0640` permissions:

```bash
sudo mkdir -p /etc/bikroybd
sudo cp deploy/env/production.env.template /etc/bikroybd/api.env

# Generate distinct 64-byte hex secrets for production JWT and Cookie signing:
openssl rand -hex 64  # Paste into JWT_ACCESS_SECRET
openssl rand -hex 64  # Paste into JWT_REFRESH_SECRET
openssl rand -hex 64  # Paste into COOKIE_SECRET

sudo chown root:bikroybd /etc/bikroybd/api.env
sudo chmod 0640 /etc/bikroybd/api.env
```

### 1.2 Production Build Command
```bash
npm ci
npm run build
```
- Compiles `shared` (`shared/dist`), `client` (`client/dist`), and `server` (`server/dist`).
- Executes the automated frontend secret scanner across all generated client assets.

---

## 2. MySQL Database Creation, Restricted User, Migrations & Backups

### 2.1 Provision Database & Restricted Users (`deploy/mysql/01_provision_production_db.sql`)
In production, the Express API **must not** connect as `root` (`server/src/config/env.ts` explicitly rejects `DB_USER=root` when `NODE_ENV=production`). We separate database privileges across three least-privilege accounts bound to `127.0.0.1`:
1. `bikroybd_app`@`127.0.0.1` (**Runtime API User**): Granted **only** `SELECT, INSERT, UPDATE, DELETE, EXECUTE` on `bikroybd_db.*`. Cannot `DROP`, `TRUNCATE`, `ALTER`, or `CREATE` tables.
2. `bikroybd_migrator`@`127.0.0.1` (**Migration Runner User**): Granted `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, LOCK TABLES` on `bikroybd_db.*`. Used exclusively during `npm run db:migrate`.
3. `bikroybd_backup`@`127.0.0.1` (**Hot Backup User**): Granted read-only `SELECT, SHOW VIEW, TRIGGER, LOCK TABLES, PROCESS` on `bikroybd_db.*`.

```bash
# 1. Edit deploy/mysql/01_provision_production_db.sql on the VPS to insert generated passwords
# 2. Execute as MySQL root:
sudo mysql -u root -p < deploy/mysql/01_provision_production_db.sql
```

### 2.2 Running Production Schema Migrations
`database/migrate.js` acquires a MySQL advisory lock (`GET_LOCK('bikroybd_migration_lock', 30)`), verifies SHA-256 checksums of all 9 SQL migrations (`001` through `009`), and applies unapplied migrations inside ACID transactions:

```bash
# Offline structural & checksum verification of all 9 migration files:
npm run db:migrate:verify

# Apply migrations against live MySQL using the migrator user:
DB_USER=bikroybd_migrator DB_PASSWORD='<MIGRATOR_PASSWORD>' npm run db:migrate
```
*(Note: `npm run db:seed` is automatically blocked when `NODE_ENV=production` to prevent test data from polluting the live marketplace.)*

---

## 3. Secure Deployment Commands

We use an atomic symlinked release layout (`/var/www/bikroybd/releases/<TIMESTAMP>` -> `/var/www/bikroybd/current`) via `deploy/scripts/deploy_release.sh`:

```bash
# One-time directory provisioning on Ubuntu VPS:
sudo useradd --system --create-home --shell /bin/bash bikroybd
sudo mkdir -p /var/www/bikroybd/releases /var/backups/bikroybd /var/log/bikroybd
sudo chown -R bikroybd:bikroybd /var/www/bikroybd /var/backups/bikroybd /var/log/bikroybd

# Execute zero-downtime atomic deployment:
chmod +x deploy/scripts/*.sh
./deploy/scripts/deploy_release.sh
```

What `deploy/scripts/deploy_release.sh` enforces automatically:
1. Verifies `/etc/bikroybd/api.env` exists outside the repo and has `0600` or `0640` permissions.
2. Takes a pre-deployment hot MySQL backup (`deploy/scripts/backup_mysql.sh`).
3. Stages an immutable release directory (`/var/www/bikroybd/releases/<RELEASE_ID>`) excluding `.git` and `.env*`.
4. Runs `npm ci && npm run build`.
5. Runs `npm run db:migrate` under advisory lock.
6. Atomically flips `/var/www/bikroybd/current` via `mv -Tf` and reloads PM2 (`pm2 reload`) + Nginx (`nginx -t && systemctl reload nginx`).
7. Polls `/api/v1/health/ready` and runs `deploy/scripts/smoke_test.js`; if health or smoke checks fail, automatically triggers `deploy/scripts/rollback_release.sh`.

---

## 4. Reverse Proxy & HTTPS Configuration (`deploy/nginx/bikroybd.conf`)

```bash
# 1. Install Nginx & Certbot on Ubuntu VPS
sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Obtain Let's Encrypt TLS certificate for bikroybd.com and www.bikroybd.com
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d bikroybd.com -d www.bikroybd.com --agree-tos -m ops@bikroybd.com --non-interactive

# 3. Enable production Nginx configuration
sudo cp deploy/nginx/bikroybd.conf /etc/nginx/sites-available/bikroybd.conf
sudo ln -sfn /etc/nginx/sites-available/bikroybd.conf /etc/nginx/sites-enabled/bikroybd.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Key protections in `deploy/nginx/bikroybd.conf`:
- Redirects HTTP (`80`) to `https://bikroybd.com` (`301`) and canonicalizes `www.bikroybd.com` -> `bikroybd.com`.
- Enforces TLS 1.2 / TLS 1.3, OCSP stapling, HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and Content-Security-Policy.
- Serves `/var/www/bikroybd/current/client/dist` with 1-year `immutable` caching on `/assets/*` and `no-cache` SPA fallback on `/index.html`.
- Proxies `/api/v1/` to `http://127.0.0.1:5000` with `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Request-Id`, edge rate limiting (`limit_req_zone`), and `client_max_body_size 26M`.

---

## 5. Process Management & Restart Strategy

Two production process managers are provided:

### Option A: PM2 Cluster Mode (`deploy/pm2/ecosystem.config.cjs`)
- Runs multiple worker processes (`exec_mode: 'cluster'`, `wait_ready: true`, `listen_timeout: 8000`, `kill_timeout: 10000`).
- Automatically restarts workers exceeding `512M` RAM (`max_memory_restart: '512M'`) with exponential backoff (`exp_backoff_restart_delay: 100`).
- `server/src/index.ts` sends `process.send('ready')` after binding the port and checking MySQL, and drains in-flight requests + MySQL pool connections on `SIGTERM`/`SIGINT`.

```bash
pm2 start deploy/pm2/ecosystem.config.cjs --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u bikroybd --hp /home/bikroybd
```

### Option B: Hardened Systemd Service (`deploy/systemd/bikroybd-api.service`)
```bash
sudo cp deploy/systemd/bikroybd-api.service /etc/systemd/system/bikroybd-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now bikroybd-api
```

---

## 6. Production CORS, Cookie & Trusted-Origin Configuration

- **Reverse Proxy Awareness**: `server/src/app.ts` sets `app.set('trust proxy', env.TRUST_PROXY)` so `req.ip`, `req.secure`, and `express-rate-limit` use the true client IP forwarded by Nginx.
- **Strict HTTPS Trusted Origins**: `getTrustedOrigins(env)` in `server/src/config/env.ts` strips `http://localhost:*` origins when `NODE_ENV=production` and requires `APP_URL`, `CORS_ORIGIN`, and `TRUSTED_ORIGINS` to start with `https://`.
- **Hardened Refresh Cookie (`server/src/utils/cookies.ts`)**: `bikroybd_refresh` is issued and cleared using centralized options:
  - `HttpOnly: true` (inaccessible to `document.cookie`)
  - `Secure: true` (transmitted strictly over HTTPS in production)
  - `SameSite: 'strict'` (blocks cross-site request attachment)
  - `Path: '/api/v1/auth'` (never sent on general product/image requests)

---

## 7. Log Rotation & Error Monitoring Guidance

- **Structured JSON Logging (`server/src/utils/logger.ts`)**:
  - Emits single-line JSON logs in `NODE_ENV=production` with `timestamp`, `level`, `requestId` (`X-Request-Id`), `method`, `path`, `statusCode`, `durationMs`, and `ip`.
  - Automatically redacts sensitive keys (`password`, `passwordHash`, `accessToken`, `refreshToken`, `authorization`, `cookie`, `bikroybd_refresh`, `db_password`).
- **Linux Logrotate (`deploy/logrotate/bikroybd`)**:
  ```bash
  sudo cp deploy/logrotate/bikroybd /etc/logrotate.d/bikroybd
  sudo chmod 0644 /etc/logrotate.d/bikroybd
  sudo logrotate -d /etc/logrotate.d/bikroybd
  ```
  Rotates `/var/log/bikroybd/*.log` daily, keeps 14 compressed archives, and signals Nginx (`USR1`) and PM2 (`pm2 reloadLogs`).

---

## 8. Database Backup & Restore Verification

```bash
# 1.Offline & Schema Checksum Backup/Restore Verification (No live MySQL required):
npm run db:audit
npm run db:backup
npm run db:restore

# 2. Live VPS Hot Backup & Restore Verification:
./deploy/scripts/backup_mysql.sh /var/backups/bikroybd
./deploy/scripts/restore_mysql.sh /var/backups/bikroybd/latest.sql.gz bikroybd_restore_verify_db
```

---

## 9. Health-Check & Smoke-Test Procedures

- **Liveness & Diagnostics**: `GET /api/v1/health` returns HTTP `200` (`503` if MySQL is unreachable) with database latency, memory usage (`rss`, `heapUsed`), and uptime.
- **Load-Balancer / Deployment Readiness**: `GET /api/v1/health/ready` returns HTTP `200` when the database pool is ready to serve traffic.
- **Automated End-to-End Smoke Suite (`deploy/scripts/smoke_test.js`)**:
  ```bash
  # Run self-contained production smoke verification suite:
  npm run test:smoke

  # Run against live deployed domain:
  SMOKE_TEST_URL=https://bikroybd.com npm run test:smoke
  ```

---

## 10. Rollback & Recovery Instructions

If a deployment introduces a regression or fails post-deploy checks:
```bash
# Instant Application Symlink Rollback (re-points /var/www/bikroybd/current to previous release & reloads PM2/Nginx):
./deploy/scripts/rollback_release.sh

# Full Application + MySQL Snapshot Rollback:
./deploy/scripts/rollback_release.sh --restore-db
```

---

## 11. Verification Status & Manual Execution Checklist

### Verified Automatically in This Workspace
- `npm run build`: Built `shared/dist`, `client/dist`, and `server/dist`; scanned 48 frontend files and confirmed **0 leaked secrets**.
- `npm test` (`tests/run_phase6_audit.js`): **55 / 55** security, RBAC, SQLi/XSS/CSRF, media magic-byte, and production env validation checks passed.
- `npm run test:smoke` (`deploy/scripts/smoke_test.js`): **10 / 10** end-to-end production smoke tests passed (health/readiness, HSTS/CSP headers, CORS/CSRF blocking, registration/login/refresh token rotation & reuse detection, image upload magic-byte check, seller listing -> moderator approval -> public visibility, admin permission boundary, and backup/restore SHA-256 verification).
- `npm run db:migrate:verify && npm run db:audit && npm run db:backup && npm run db:restore`: All 9 migrations and deterministic backup/restore checksums verified.

### Manual Steps Required on Target Linux VPS (No Remote SSH/DNS Credentials in Workspace)
Because this build container does not have SSH credentials, a live public VPS IP, or DNS registrar access for `bikroybd.com`:
1. Provision Ubuntu 22.04/24.04 LTS VPS and point DNS `A`/`AAAA` records for `bikroybd.com` and `www.bikroybd.com` to the VPS IP.
2. Copy `deploy/env/production.env.template` to `/etc/bikroybd/api.env`, populate live secrets (`openssl rand -hex 64`) and Cloudinary credentials, and set `chmod 0640 /etc/bikroybd/api.env`.
3. Execute `sudo mysql -u root -p < deploy/mysql/01_provision_production_db.sql` on the VPS MySQL 8.0 server after setting strong passwords for `bikroybd_app`, `bikroybd_migrator`, and `bikroybd_backup`.
4. Issue Let's Encrypt TLS certificates via `certbot` and enable `deploy/nginx/bikroybd.conf` and `deploy/logrotate/bikroybd`.
5. Run `./deploy/scripts/deploy_release.sh` on the VPS and verify live HTTPS traffic with `SMOKE_TEST_URL=https://bikroybd.com npm run test:smoke`.
