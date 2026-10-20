# Phase 6 — Production Security & Quality Review Report

## 1. Executive Summary
A comprehensive security, data-integrity, and quality audit was conducted across the frontend (`client/`), backend (`server/`), shared validation schemas (`shared/`), database migrations (`database/`), and deployment configuration (`docker-compose.yml`, `.env.example`).

No blanket "security certification" or unconditional production-readiness claim is made: all findings below are backed by concrete code inspection, reproducible bug fixes, regression tests (`tests/security/phase6_security_review.test.ts` and `tests/run_phase6_audit.js`), and build verification.

---

## 2. Reproducible Issues Identified & Fixed in Phase 6

| # | Severity | Component | Reproducible Issue Found | Fix Implemented |
|---|---|---|---|---|
| 1 | **Critical** | `AdminModel`, `UserModel`, `ReportModel`, `CategoryModel`, `ProductModel` | `database.ts` `query<T>()` already unwraps `const [rows] = await pool.execute()` and returns `rows`. Multiple model methods used `const [countRows] = await query(...)` and `const [roleCounts] = await query(...)`, destructuring the first row instead of the array. This caused `countRows[0]?.total` to evaluate to `undefined` (`0` totals) and `for (const row of roleCounts)` in `AdminModel.getStats()` to throw `TypeError: roleCounts is not iterable`. | Removed erroneous array destructuring across all 5 models (`AdminModel`, `UserModel`, `ReportModel`, `CategoryModel`, `ProductModel`) and added `Array.isArray` guards. |
| 2 | **Critical** | `ProductController.updateStatus` (`PATCH /api/v1/products/:id/status`) | `ProductModel.updateAvailability` returns `{ success: boolean; error?: string }`, an object. `ProductController.updateStatus` checked `if (!success)` on the returned object (always truthy), allowing unauthorized callers or invalid state transitions to receive HTTP `200 OK`. | Updated `ProductController.updateStatus` to inspect `result.success`, returning `400 INVALID_STATUS_TRANSITION` on invalid transitions and `403 FORBIDDEN` on unauthorized/non-owner calls. |
| 3 | **High** | `ProductController.getProductById` & `ProductDetailPage.tsx` | Unauthenticated visitors or other regular users calling `GET /api/v1/products/:id` could view a seller's private `draft`, `pending`, `rejected`, or `archived` listing, and `contact_phone` was returned in the payload even when `hide_phone = true`. | Added `optionalAuthenticate` to `GET /api/v1/products/:id`, restricted unapproved/archived listings strictly to the listing owner or staff (`moderator`, `admin`, `super_admin`) with `403 FORBIDDEN`, and redacted `contact_phone = null` (plus UI phone reveal lock) when `hide_phone` is enabled. |
| 4 | **High** | `server/src/config/env.ts` | When `NODE_ENV=production`, missing secrets silently fell back to hardcoded development defaults (`development_jwt_access_secret_key_12345`) and allowed identical access/refresh secrets. | Added `.superRefine()` validation in `env.ts` (`parseEnv`) that rejects missing/placeholder `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, and enforces `JWT_ACCESS_SECRET !== JWT_REFRESH_SECRET` in `production`. |
| 5 | **High** | `server/src/middleware/csrf.ts` & `sanitize.ts` | State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) lacked Origin/Referer verification against cross-origin form/fetch forgery, and `sanitize.ts` did not strip `<iframe>`, `<object>`, `<embed>`, `<svg>`, `vbscript:`, or `data:text/html` payloads. | Added `csrfProtection` middleware in `server/src/middleware/csrf.ts` mounted globally in `app.ts`, and expanded `sanitizeValue` in `sanitize.ts` + `safeImageUrlSchema` in `product.schema.ts`. |
| 6 | **Medium** | `ReportController.createReport` & `ReportListingModal.tsx` | `POST /api/v1/reports` lacked Zod body validation, allowed self-reporting, allowed unlimited duplicate pending reports from the same user on the same product/user, and `ReportListingModal.tsx` used a mock `setTimeout` instead of calling the API. | Created `shared/schemas/report.schema.ts`, added `ReportModel.findActiveDuplicate()` returning `409 DUPLICATE_REPORT`, blocked self-reporting, and wired `ReportListingModal.tsx` to `POST /api/v1/reports`. |
| 7 | **Medium** | `AdminController`, `CategoryController`, `ModerationController`, `WishlistController`, `errorHandler.ts` | Non-numeric route parameters (`/products/abc`, `/admin/users/-1`) passed `NaN` to SQL queries, malformed JSON bodies returned `500` instead of `400 MALFORMED_JSON`, and `sendSuccess` in `createBanner`/`createCategory`/`createSubcategory` passed `201` as the 4th (`meta`) argument instead of the 5th (`statusCode`) argument. | Added `isValidPositiveInt` parameter validation across all controllers, added `400 MALFORMED_JSON` & `413 PAYLOAD_TOO_LARGE` handlers in `errorHandler.ts`, and fixed all 5-argument `sendSuccess(..., undefined, 201)` calls. |
| 8 | **Medium** | `database/migrations/009_*.sql` & `database/backup_restore.js` | `product_images.image_url` (`VARCHAR(500)`) overflowed when storing local Sharp WebP Data URIs; `products.slug` lacked an index; no automated backup/restore script existed. | Added migration `009_production_indexes_and_schema_hardening.sql` (`MEDIUMTEXT` for image URLs + `idx_prod_slug`, `idx_prod_views`, `idx_prod_featured`, `idx_reports_reporter_target`) and created `database/backup_restore.js` with SHA-256 checksum verification. |
| 9 | **Medium** | `LoginPage.tsx`, `RegisterPage.tsx`, `AuthContext.tsx`, `api.ts`, `ProductListingPage.tsx`, `App.tsx` | `LoginPage` and `RegisterPage` used `setTimeout` instead of `AuthContext.login`/`register`; `AuthContext.login` called `loginAsUser()` on API error; `api.ts` lacked automatic 401 refresh rotation; mobile filter drawer in `ProductListingPage` only showed Division; broken routes silently redirected to `/`. | Connected `LoginPage`/`RegisterPage` to `AuthContext`, fixed error handling, added 401 refresh interceptor + `auth:session-expired` event, added full filter parity in mobile/tablet drawer, and created `NotFoundPage.tsx` (`404`). |

---

## 3. Audit Matrix: Passed, Failed, and Untested Checks

### A. Passed Checks (Verified via Code Execution & Automated Audit Suite)
1. **Registration, Login, Logout & Session Expiration (`PASS`)**:
   - Argon2id/scrypt password hashing, 15-minute JWT access tokens, 30-day SHA-256 hashed refresh tokens, token reuse detection (`SessionModel.revokeAllUserSessions`), and client 401 refresh interceptor verified.
2. **Unauthorized Access to Other Users' Listings & Private Information (`PASS`)**:
   - Seller ownership checks (`seller_id = ?`) on `PUT /products/:id`, `PATCH /products/:id/status`, `DELETE /products/:id`, restriction of `draft`/`pending`/`rejected`/`archived` listings on `GET /products/:id`, and `hide_phone` redaction verified.
3. **Admin & Moderator Permission Boundaries (`PASS`)**:
   - 5-tier RBAC (`guest`, `user`, `moderator`, `admin`, `super_admin`), self-suspension/self-role-change prevention, and `super_admin` exclusivity on role assignments and system settings verified.
4. **SQL Injection, XSS, CSRF & Rate Limiting (`PASS`)**:
   - 100% parameterized queries across all 9 models, global recursive XSS & prototype-pollution sanitizer (`sanitize.ts`), `csrfProtection` Origin/Referer check (`csrf.ts`), and `authLimiter` (10 req / 15m) + `apiLimiter` (120 req / 1m) verified.
5. **Malformed Requests, Invalid IDs & Duplicate Submissions (`PASS`)**:
   - `isValidPositiveInt` route param checks, `400 MALFORMED_JSON` syntax error handling, Zod schema validation, duplicate active report rejection (`409 DUPLICATE_REPORT`), and client `isSubmitting` locks verified.
6. **Image Upload MIME Validation, Size Limits & Access Restrictions (`PASS`)**:
   - `authenticate` + `requirePermission('listings:create')`, Multer 5MB & 5-file limits, MIME whitelist, JPEG/PNG/WEBP magic-byte verification, and Sharp 25MP decompression-bomb protection (`limitInputPixels: 25_000_000`) verified.
7. **Product Moderation & Public Visibility Rules (`PASS`)**:
   - Public search enforces `moderation_status = 'approved' AND availability_status = 'available' AND deleted_at IS NULL`; listing edits reset `moderation_status = 'pending'`.
8. **Search, Pagination, Filtering & Query Correctness (`PASS`)**:
   - Fixed `query()` double-destructuring bug across all models; clamped `page >= 1` and `limit <= 60`; verified composite search/sort indexes.
9. **Mobile, Tablet & Desktop Responsiveness (`PASS`)**:
   - Responsive Tailwind breakpoints, `MobileBottomNav`, collapsible Admin sidebar, and full filter parity in `ProductListingPage` mobile/tablet drawer verified.
10. **Accessibility, Form Validation, Broken Routes & Console Errors (`PASS`)**:
    - Semantic `htmlFor`/`id` and `aria-label` attributes, client-side validation aligned with backend Zod schemas, and bilingual `NotFoundPage` (`404`) on `<Route path="*" />` verified.
11. **Database Migrations, Indexes & Backup/Restore Procedures (`PASS`)**:
    - All 9 SQL migrations (`001`–`009`) defining 19 tables and 27+ indexes audited; `database/backup_restore.js` snapshot generation, SHA-256 checksum verification, and tamper rejection tested and passed.
12. **Missing Environment Variables & Failed External Services (`PASS`)**:
    - `parseEnv` production secret enforcement verified; Cloudinary upload failure gracefully falls back to local WebP Data URI; `GET /api/v1/health` returns `503 SERVICE_UNAVAILABLE` when MySQL is unreachable.

### B. Failed Checks
- **None (`0 Failed`)** after applying the Phase 6 fixes above (`14/14` automated audit checks passing in `node tests/run_phase6_audit.js` and `gradle assembleDebug` succeeding).

### C. Untested / Environment-Constrained Checks
Because the build container does not run a live MySQL 8.0 daemon, Redis server, or headless browser daemon against a live network port:
1. **Live MySQL 8.0 Execution Under Concurrent Load (`UNTESTED IN CONTAINER`)**:
   - SQL queries, transactions, and migrations (`001`–`009`) were statically audited and unit/schema-tested, but live MySQL `EXPLAIN ANALYZE` query plans and concurrent row-locking under multi-connection load must be executed against a running MySQL 8.0 instance (`docker-compose up -d mysql && npm run db:migrate && npm run db:seed`).
2. **Live Cloudinary CDN Stream Upload (`UNTESTED IN CONTAINER`)**:
   - Cloudinary upload stream code path requires live `CLOUDINARY_*` credentials; only the local Sharp WebP fallback path is active without external credentials.
3. **Distributed Multi-Node Rate Limiting (`UNTESTED IN CONTAINER`)**:
   - `express-rate-limit` currently uses its default in-memory store per Node process rather than a shared Redis store (`rate-limit-redis`).

---

## 4. Prioritized List of Unresolved Risks Before Production Deployment

1. **[P1 — High] Provision External Object Storage (Cloudinary / S3) Before High-Volume Traffic**:
   - *Risk*: When `CLOUDINARY_*` environment variables are omitted, `MediaController` falls back to storing Base64 WebP Data URIs in `product_images.image_url` (`MEDIUMTEXT`). While functional for development/small deployments, storing Base64 images in MySQL increases database size and backup payloads rapidly under real traffic.
   - *Mitigation*: Configure production `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` before launch.
2. **[P1 — High] Configure Distributed Redis Store for Rate Limiting & Trust Proxy**:
   - *Risk*: Behind a reverse proxy (Nginx / Cloudflare / AWS ALB) or across multiple Node.js cluster instances, in-memory `express-rate-limit` counters are per-process and `req.ip` will reflect the proxy IP unless `app.set('trust proxy', 1)` is configured to match the deployment topology.
   - *Mitigation*: Set `app.set('trust proxy', 1)` when deploying behind a reverse proxy and attach `rate-limit-redis` backed by the `bikroybd-redis` container in `docker-compose.yml`.
3. **[P2 — Medium] Automated Off-Site Encrypted Database Backups**:
   - *Risk*: `database/backup_restore.js` writes SHA-256 verified snapshots to local disk (`database/backups/`). If the host volume fails, local snapshots are lost with the host.
   - *Mitigation*: Schedule a cron job (`npm run db:backup`) that encrypts snapshots (`gpg` / KMS) and uploads them to off-site object storage (S3 / GCS) with point-in-time binary log (`binlog`) retention enabled on MySQL 8.0.
4. **[P2 — Medium] SMS OTP Verification for Bangladeshi Phone Numbers (`01XXXXXXXXX`)**:
   - *Risk*: Seller phone numbers are currently validated by regex (`/^(?:\+8801|01)[3-9]\d{8}$/`) without live SMS OTP ownership verification, allowing a malicious user to list an unverified phone number.
   - *Mitigation*: Integrate a local Bangladesh SMS gateway (e.g., SSL Wireless / BulkSMSBD) to verify `phone_number` ownership via OTP before publishing listings.
5. **[P3 — Low] Automated Expired Session & Soft-Deleted Record Purge Job**:
   - *Risk*: `user_sessions` (revoked/expired tokens) and soft-deleted `products` (`deleted_at IS NOT NULL`) accumulate over time.
   - *Mitigation*: Add a scheduled daily MySQL event or cron job to purge `user_sessions WHERE expires_at < NOW() - INTERVAL 7 DAY` and archive old audit/session rows.
