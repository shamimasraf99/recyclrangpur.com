# Security Architecture & RBAC Matrix
## Bangladesh Used Products Marketplace (BikroyBD)
**Document Version:** 1.0.0 (Phase 1 Deliverable)

---

## 1. Authentication & Session Architecture

### 1.1 Password Hashing Specification
- **Primary Algorithm:** `argon2id` (RFC 9106 recommended parameters)
  - Memory cost ($m$): $65536 \text{ KiB}$ (64 MB)
  - Time cost ($t$): $3 \text{ iterations}$
  - Parallelism ($p$): $4 \text{ threads}$
  - Hash length: 32 bytes
- **Fallback Compatibility:** `bcrypt` with work factor (salt rounds) = 12 if native compilation for argon2 is unavailable in restricted host environments.
- **Timing-Safe Comparison:** All password checks and token hash comparisons utilize `crypto.timingSafeEqual` to thwart timing side-channel attacks.

### 1.2 Dual-Token Session Mechanism
1. **Short-Lived Access Token (JWT):**
   - Lifespan: 15 minutes.
   - Payload: `{ sub: userId, email, roles: string[], permissions: string[], jti }`
   - Transmitted in Authorization Header: `Bearer <token>`
2. **Rotating Refresh Token:**
   - Lifespan: 30 days.
   - Stored in Database: SHA-256 hash stored in `user_sessions` alongside client IP, User-Agent, and expiration timestamp.
   - Transmitted in Cookie: `httpOnly`, `Secure` (production), `SameSite=Strict`, `Path=/api/v1/auth`.
   - **Reuse Detection:** If an already-rotated or revoked refresh token is presented, the entire session family for that user is immediately revoked (compromise defense).

---

## 2. Server-Enforced RBAC Middleware Architecture

Authorization is strictly verified on the backend using declarative Express middleware rather than trusting frontend states.

```typescript
// Express RBAC Middleware Pattern
export const requirePermission = (permissionCode: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'অনুগ্রহ করে প্রথমে লগইন করুন' } });
    }
    
    // Super admins bypass granular checks
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    const hasPermission = req.user.permissions.includes(permissionCode);
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'এই কাজটি করার জন্য আপনার অনুমতি নেই' } 
      });
    }

    return next();
  };
};

export const requireOwnershipOrAdmin = (modelLookupFn: (req: Request) => Promise<number | null>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const ownerId = await modelLookupFn(req);
    if (!ownerId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'আইটেমটি পাওয়া যায়নি' } });
    }

    const isOwner = req.user && req.user.id === ownerId;
    const isAdminOrSuper = req.user && (req.user.roles.includes('admin') || req.user.roles.includes('super_admin'));

    if (!isOwner && !isAdminOrSuper) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'অননুমোদিত অ্যাক্সেস' } });
    }

    return next();
  };
};
```

---

## 3. Threat Modeling & Mitigation Catalog

| Threat Category | Potential Attack Vector | BikroyBD Mitigation Strategy |
|---|---|---|
| **Insecure Direct Object Reference (IDOR)** | Attacker changes `:id` in `PUT /api/v1/products/:id` to alter another seller's listing. | Verified via `requireOwnershipOrAdmin` middleware; query enforces `WHERE id = ? AND seller_id = ?` for non-admins. |
| **Cross-Site Request Forgery (CSRF)** | Malicious third-party site triggers state changes using ambient browser cookies. | SameSite=Strict cookies + Double Submit CSRF token verified via `X-CSRF-Token` header on all POST/PUT/PATCH/DELETE routes. |
| **Cross-Site Scripting (XSS)** | Malicious JavaScript injected via ad description or title. | Input sanitized via DOMPurify/validator; React JSX automatic escaping; HTTP CSP headers configured via `helmet`. |
| **SQL Injection (SQLi)** | Raw string concatenation in product search or filter queries. | 100% prepared statements with parameterized queries (`mysql2/promise` with `?` bind variables). |
| **Malicious File Upload** | Attacker uploads executable or web shell disguised as `.jpg`. | Buffer magic-byte inspection (disallow files whose initial bytes do not match JPEG/PNG/WebP magic numbers); Sharp re-encoding to standardized WebP; stripping of EXIF GPS coordinates. |
| **Credential Stuffing / Brute Force** | Automated dictionary attacks against `/api/v1/auth/login`. | `express-rate-limit` capped at 5 attempts per 15 minutes per IP; account lockout flag activated upon 5 consecutive failed attempts. |
| **Data Leakage in Public Responses** | Returning password hashes, phone numbers of privacy-protected sellers, or deleted records. | Strict DTO projections in repository layer (`SELECT id, title, price_bdt...` never `SELECT *`); `hide_phone` logic masks numbers on public endpoints. |
| **Privilege Escalation** | Regular user sends `role: "admin"` in user update payload. | Role updates isolated strictly to `/api/v1/admin/users/:id/role` gated behind `super_admin` permission. DTO validation strips unrecognized fields. |

---

## 4. Environment Variables Blueprint (`.env.example`)

```ini
# Application Runtime
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Database Configuration (MySQL 8.0+)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=bikroybd_user
DB_PASSWORD=strong_database_password_here
DB_NAME=bikroybd_db
DB_CONNECTION_LIMIT=20

# JWT & Authentication Secrets
JWT_ACCESS_SECRET=replace_with_64_character_hex_secret_key
JWT_REFRESH_SECRET=replace_with_another_64_character_hex_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
COOKIE_SECRET=replace_with_secure_cookie_signing_secret

# Object Storage (Cloudinary / S3)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
