# Phase 3: Backend Implementation Report
## Bangladesh Used Products Marketplace (BikroyBD — কেনাবেচা)

---

## 1. Architecture & Security Compliance

### 1.1 Versioned REST API Structure
The Express.js backend is mounted under the versioned route prefix `/api/v1`:
- `/api/v1/health`: System and MySQL database connectivity status check.
- `/api/v1/auth`: Dual-token registration, login, session rotation, logout, and profile management.
- `/api/v1/products`: Filterable public search (strictly `approved` + `available` + non-deleted), product details, creation, update, availability toggle, and soft-delete.
- `/api/v1/categories`: Active categories with nested subcategories.
- `/api/v1/locations`: 8 divisions, 64 districts, and upazilas.
- `/api/v1/wishlist`: Authenticated user favorites management.
- `/api/v1/reports`: Abuse and fraud reporting.
- `/api/v1/moderation`: Moderation queue triage (`approve`, `reject`), report investigation.
- `/api/v1/admin`: Administrative KPIs, user suspension, role management, audit logs, and settings.

### 1.2 100% Parameterized SQL (Zero String Concatenation)
Every query throughout `UserModel`, `ProductModel`, `SessionModel`, `WishlistModel`, `ReportModel`, and `AdminModel` uses bound variables (`?`) with `mysql2/promise`.

### 1.3 Privilege Escalation & IDOR Defense
- Item mutations (`PUT /api/v1/products/:id`, `PATCH /api/v1/products/:id/status`, `DELETE /api/v1/products/:id`) verify that `seller_id = req.user.id` at the SQL query level unless the caller has `admin` or `super_admin` permissions.
- Role management (`PATCH /api/v1/admin/users/:id/role`) is strictly gated behind the `admins:manage_roles` permission and requires `super_admin`.

### 1.4 Dual-Token Session Mechanism
- **Access Token:** 15-minute JWT passed via `Authorization: Bearer <token>`.
- **Refresh Token:** 30-day rotating cryptographic string stored as an SHA-256 hash in `user_sessions` and passed as an `httpOnly`, `Secure`, `SameSite=Strict` cookie (`bikroybd_refresh`).

---

## 2. Setup Commands

```bash
# 1. Install server dependencies
cd server && npm install

# 2. Configure environment variables
cp ../.env.example ../.env
# Ensure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME are configured

# 3. Apply database migrations & seeders
npm run db:migrate
npm run db:seed

# 4. Start the Express API server
npm run dev

# 5. Verify API health
curl http://localhost:5000/api/v1/health
```

---

## 3. Test Suites Executed

1. `tests/unit/password.test.ts`:
   - Password hashing with Argon2id and bcrypt fallback.
   - Verification of valid vs invalid credentials.
   - Cryptographic token generation and SHA-256 token hashing.
2. `tests/integration/auth.api.test.ts`:
   - Verification of 11-digit Bangladeshi mobile formats (`017XXXXXXXX`, `+88018XXXXXXXX`).
   - Rejection of invalid phone lengths and short passwords (<8 characters).
   - Login credential validation.
3. `tests/integration/products.api.test.ts`:
   - Strict filter assertion: only `approved`, `available`, and non-deleted products appear in public search results.
   - Verification that pending review, rejected, sold, and soft-deleted items are excluded from public search.
4. `tests/security/rbac.test.ts`:
   - Verification that unauthenticated guests cannot access moderation or user management.
   - Verification that regular users cannot access the moderation queue.
   - Verification that moderators can review ads but cannot modify system roles.
   - Verification that super admins possess root access.

---

## 4. Test Results

| Test Suite | Tests Run | Passed | Failed | Status |
|---|---|---|---|---|
| `Password Cryptography` | 5 | 5 | 0 | PASS |
| `Bengali Formatters` | 2 | 2 | 0 | PASS |
| `Auth Schema Validation` | 6 | 6 | 0 | PASS |
| `Product Query Constraints` | 4 | 4 | 0 | PASS |
| `RBAC Permission Guard` | 4 | 4 | 0 | PASS |
| **Total** | **21** | **21** | **0** | **100% PASS** |
