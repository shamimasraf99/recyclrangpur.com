# Architecture & System Design Document
## Bangladesh Used Products Marketplace (কেনাবেচা - BikroyBD)
**Document Version:** 1.0.0 (Phase 1 Deliverable)  
**Target Platform:** Web (Desktop, Tablet, Mobile Responsive)  
**Primary Region:** Bangladesh (Asia/Dhaka timezone, BDT ৳ currency)  
**Languages:** Bangla (বাংলা - Primary, Hind Siliguri typography) & English (Secondary)

---

## 1. Executive Summary & Business Topology

BikroyBD is a specialized classified marketplace tailored specifically to the buying and selling of pre-owned (used) goods across Bangladesh. The platform adopts a peer-to-peer (P2P) classifieds model:
- **Zero Mandatory Checkout in v1:** Sellers publish listings; buyers search, filter, view verified seller profiles, and contact sellers directly via phone, WhatsApp, or secure in-app messaging.
- **Geographic Hyper-Localization:** Full support for all 8 administrative divisions of Bangladesh, 64 districts, and 495+ upazilas/thanas with bilingual search (Bangla and English).
- **Proactive Trust & Moderation:** Listings are subjected to a rigorous moderation workflow (`Draft` -> `Pending` -> `Approved` / `Rejected`) with strict role-based controls. Only approved and active listings are indexed in public search.

```
                           +---------------------------+
                           |   End Users (Web/Mobile)  |
                           +-------------+-------------+
                                         |
                                         v
                           +---------------------------+
                           |  Reverse Proxy & CDN      |
                           |  (Nginx / Cloudflare)     |
                           |  - SSL / TLS 1.3 Term     |
                           |  - DDoS & Bot Protection  |
                           |  - Static Assets Cache    |
                           +-------------+-------------+
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
        +-------------------------+             +-------------------------+
        | React SPA (Vite + TS)   |             | Express.js REST API     |
        | - Tailwind CSS          |             | - Node.js LTS           |
        | - Hind Siliguri Font    |             | - Zod Input Validation  |
        | - i18n (BN / EN)        |             | - RBAC Middleware       |
        | - Light / Dark Theme    |             | - Rate Limiters         |
        +-------------------------+             +------------+------------+
                                                             |
                                         +-------------------+-------------------+
                                         |                   |                   |
                                         v                   v                   v
                               +-------------------+  +---------------+  +---------------+
                               |  MySQL 8.0+ DB    |  | Cloudinary /  |  | Redis / Cache |
                               |  - InnoDB Engine  |  | S3 Storage    |  | - Sessions    |
                               |  - UTC Datetime   |  | - WebP / Avif |  | - Rate Limits |
                               |  - FullText / B-  |  | - Image Resizer| | - Cache Tags  |
                               |    tree Indexes   |  +---------------+  +---------------+
                               +-------------------+
```

---

## 2. System Architecture & Component Decomposition

### 2.1 Frontend Architecture (React 18 + TypeScript + Tailwind CSS)
- **Framework & Tooling:** React 18, TypeScript (Strict Mode), Vite build system.
- **Styling & Design System:** Tailwind CSS with CSS custom variables for seamless Light / Dark theme toggling.
- **Typography:** Webfont loader for **Hind Siliguri** (Bangla primary font) paired with Inter/Roboto (English secondary).
- **State Management & Data Fetching:** TanStack React Query (server-state caching, optimistic updates, pagination) + Zustand (client UI state: active theme, language preference, mobile drawer state, filter panels).
- **Form Handling & Validation:** React Hook Form + Zod resolvers matching backend validation schemas.
- **Internationalization (i18n):** Context-based i18n provider with complete dictionary bundles (`bn.json` and `en.json`), default locale set to `bn` with persistent user override.

#### Frontend Directory Blueprint:
```
client/
├── index.html
├── src/
│   ├── assets/
│   │   ├── fonts/           # Hind Siliguri TTF / WOFF2
│   │   └── icons/           # Custom SVG icons
│   ├── components/
│   │   ├── common/          # Button, Input, Modal, Badge, Dropdown, SkeletonLoader
│   │   ├── layout/          # Navbar, MobileNav, Footer, Sidebar, ThemeToggle, LanguageSwitcher
│   │   ├── product/         # ProductCard, ProductGrid, ImageGallery, ContactModal, ConditionBadge
│   │   ├── location/        # DivisionDistrictSelector, LocationModal
│   │   └── admin/           # StatCard, DataTable, ModerationToolbar, AuditLogViewer
│   ├── context/             # AuthContext, ThemeContext, LanguageContext
│   ├── hooks/               # useAuth, useProducts, useDebounce, useMediaQuery
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ProductListingPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── PostAdPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── Auth/            # LoginPage, RegisterPage, ForgotPasswordPage
│   │   └── Admin/           # AdminDashboard, ModerationQueue, UserManagement, CategoryManager
│   ├── services/            # Axios API client, authService, productService, locationService
│   ├── types/               # Local UI viewmodels & re-exports from /shared
│   └── utils/               # currencyFormatter (৳), bengaliNumberConverter, dateFormatter
```

---

### 2.2 Backend Architecture (Node.js + Express.js + MySQL)
- **Runtime:** Node.js LTS (v20+).
- **Framework:** Express.js with modular router architecture.
- **Database Driver:** `mysql2/promise` with high-performance connection pooling.
- **Security Interceptors:** `helmet` (HSTS, CSP, XSS protections), `cors` (strict origin whitelist), `cookie-parser`, `csurf` or double-submit CSRF tokens for state-mutating requests, `express-rate-limit` (endpoint-specific throttles).
- **Validation Engine:** `zod` for zero-trust runtime request validation of body, query parameters, and URL params.
- **Media Processing Pipeline:** `multer` memory storage -> `sharp` image inspection (magic bytes, strip EXIF metadata, dimension bounding max 1920x1080, WebP conversion) -> Cloudinary / S3 upload.

#### Backend Directory Blueprint:
```
server/
├── src/
│   ├── config/              # env.ts, db.ts, cloudinary.ts, rateLimiters.ts
│   ├── constants/           # errorCodes.ts, permissions.ts, roles.ts
│   ├── controllers/         # authController, productController, moderationController, adminController
│   ├── middleware/          # authenticate.ts, authorize.ts, validate.ts, rateLimit.ts, auditLogger.ts
│   ├── models/              # Data access objects with parameterized SQL queries
│   ├── routes/              # /api/v1/auth, /api/v1/products, /api/v1/categories, /api/v1/admin
│   ├── services/            # authService, productService, emailService, mediaService, moderationService
│   ├── utils/               # passwordHasher.ts (Argon2id/bcrypt), apiResponse.ts, logger.ts
│   └── app.ts               # Express bootstrap & error handling middleware
```

---

## 3. Role-Based Access Control (RBAC) Architecture

The application enforces a 5-tier role model. Permissions are granularly stored in the database (`permissions` and `role_permissions` tables) and verified on the backend before executing any privileged action.

| Permission Code | Guest | User | Moderator | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `listings:view:approved` |  |  |  |  |  |
| `listings:search` |  |  |  |  |  |
| `seller:contact:view` |  |  |  |  |  |
| `listings:create` |  |  |  |  |  |
| `listings:edit:own` |  |  |  |  |  |
| `listings:delete:own` |  |  |  |  |  |
| `listings:mark_sold:own`|  |  |  |  |  |
| `wishlist:manage` |  |  |  |  |  |
| `reports:create` |  |  |  |  |  |
| `listings:moderate` |  |  |  |  |  |
| `listings:view:pending` |  |  |  |  |  |
| `reports:review` |  |  |  |  |  |
| `users:view_all` |  |  |  |  |  |
| `users:suspend` |  |  |  |  |  |
| `categories:manage` |  |  |  |  |  |
| `banners:manage` |  |  |  |  |  |
| `settings:view` |  |  |  |  |  |
| `settings:update` |  |  |  |  |  |
| `audit_logs:view` |  |  |  |  |  |
| `admins:manage_roles` |  |  |  |  |  |
| `system:critical_config`|  |  |  |  |  |

---

## 4. Product Lifecycle & Moderation State Machine

```
              +----------------+
              | User Submits   |
              | New Listing    |
              +-------+--------+
                      |
                      v
             [ Status: PENDING ] <================+
                      |                           |
         +------------+------------+              |
         |                         |              |
         v                         v              |
   (Moderator Rejects)       (Moderator Approves) | User updates rejected
         |                         |              | listing and resubmits
         v                         v              |
  [ Status: REJECTED ]      [ Status: APPROVED ]  |
  - Reason code logged      - Indexed in public   |
  - Notification sent         search & categories |
  - User can edit & resubmit -+-------------------+
                                   |
                +------------------+------------------+
                |                                     |
                v                                     v
       [ User Marks RESERVED ]               [ User Marks SOLD ]
       - Hidden from active filters         - Retained in seller profile
       - Retains direct link                 - Excluded from active buy search
```

---

## 5. Security & Threat Mitigation Plan

1. **Password Storage:** Uses **Argon2id** (memory cost: 65536 KB, time cost: 3 iterations, parallelism: 4) with automatic fallback to **bcrypt** (salt rounds: 12) if native Argon2 modules are unavailable.
2. **Session Security:** 
   - Refresh tokens stored in `httpOnly`, `Secure` (in production), `SameSite=Strict` cookies.
   - Access tokens (short-lived, 15 minutes) passed via Bearer headers or memory.
   - User sessions recorded in `user_sessions` with IP address and user-agent for instant session revocation upon password change or logout.
3. **CSRF Defense:** SameSite cookie isolation combined with double-submit CSRF tokens on all mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`).
4. **Rate Limiting:**
   - Auth endpoints (`/login`, `/register`, `/forgot-password`): 5 requests per 15 minutes per IP.
   - Search & Catalog endpoints: 120 requests per minute per IP.
   - Media upload endpoints: 20 uploads per hour per authenticated user.
   - Report submission: 5 reports per hour per authenticated user.
5. **Media Pipeline Validation:**
   - Multi-layer verification: Extension check, MIME header check, and byte-level Magic Number inspection (`image/jpeg`, `image/png`, `image/webp`).
   - File size ceiling: 5 MB per image, maximum 5 images per listing.
   - Stripping of EXIF GPS geolocation coordinates prior to CDN storage to safeguard seller home locations.
6. **SQL Injection Mitigation:**
   - 100% Parameterized queries via `mysql2/promise` prepared statements (`?` placeholders).
   - Zero raw query concatenation.
