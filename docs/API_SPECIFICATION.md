# REST API v1 Specification
## Bangladesh Used Products Marketplace (BikroyBD)
**Base Path:** `/api/v1`  
**Data Format:** `application/json` (Multipart for uploads: `multipart/form-data`)  
**Security Headers:** `Authorization: Bearer <access_token>`, `X-CSRF-Token: <csrf_token>`

---

## 1. Global Standard Response Format

All API responses follow a uniform envelope structure.

### 1.1 Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "লিস্টিং সফলভাবে তৈরি করা হয়েছে",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### 1.2 Error Response (`400`, `401`, `403`, `404`, `422`, `429`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "প্রদত্ত তথ্যে কিছু ভুল রয়েছে",
    "details": [
      {
        "field": "price_bdt",
        "message": "মূল্য অবশ্যই ধনাত্মক সংখ্যা হতে হবে"
      }
    ]
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Profile (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/auth/csrf-token` | Public | Generates anti-CSRF token for state-changing calls |
| `POST` | `/auth/register` | Public (Rate-limited) | Register with full_name, email, phone_number, password |
| `POST` | `/auth/login` | Public (Rate-limited) | Login with email/phone & password. Returns JWT + sets HttpOnly cookie |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotate refresh token and issue new 15-min access token |
| `POST` | `/auth/logout` | Authenticated | Revoke active session in DB and clear cookie |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile, permissions, and roles |
| `PUT` | `/auth/profile` | Authenticated | Update full_name, avatar, location, language preference |
| `PUT` | `/auth/change-password` | Authenticated | Update password securely (hashes with Argon2id) |

---

### 2.2 Product Listings (`/api/v1/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products` | Public | Filtered public product catalog. Strict constraint: only `approved`, `available`, non-deleted products. |
| `GET` | `/products/:slugOrId` | Public | Full product detail with image gallery, seller metadata, and view counter increment. |
| `POST` | `/products` | User+ | Create new listing. Starts in `pending` (or `draft`). Validates Zod schema. |
| `PUT` | `/products/:id` | Owner / Admin | Update product details. Status changes back to `pending` on critical edits. |
| `PATCH` | `/products/:id/status` | Owner / Admin | Update availability status (`available`, `reserved`, `sold`, `archived`). |
| `DELETE` | `/products/:id` | Owner / Admin | Soft delete product (`deleted_at = NOW()`). |

#### `GET /api/v1/products` Query Parameters:
- `page` (default: 1, max: 100)
- `limit` (default: 24, max: 60)
- `q` (Search query in title and description)
- `category` (Category slug or ID)
- `subcategory` (Subcategory slug or ID)
- `division` (Division slug or ID)
- `district` (District slug or ID)
- `upazila` (Upazila slug or ID)
- `condition` (`like_new`, `good`, `fair`, `for_parts`)
- `min_price` / `max_price` (Price range in BDT)
- `is_negotiable` (boolean)
- `sort` (`newest`, `price_low_high`, `price_high_low`, `most_viewed`)

---

### 2.3 Media & Image Upload (`/api/v1/media`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/media/upload` | Authenticated | Upload up to 5 product photos (JPEG/PNG/WebP, max 5MB each). Sharp validates magic bytes, strips EXIF, generates WebP thumbnail (400x300) and display (1280x960). |

---

### 2.4 Categories & Geographical Locations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | Returns all active categories with nested subcategories |
| `GET` | `/locations/divisions` | Public | List all 8 Bangladesh divisions with Bangla & English names |
| `GET` | `/locations/districts` | Public | List 64 districts (optional `?division_id=X` filter) |
| `GET` | `/locations/upazilas` | Public | List Upazilas / Thanas (requires `?district_id=X`) |

---

### 2.5 Wishlist (`/api/v1/wishlist`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/wishlist` | Authenticated | List all favorited products for the authenticated user |
| `POST` | `/wishlist/:productId` | Authenticated | Add product to favorites |
| `DELETE` | `/wishlist/:productId` | Authenticated | Remove product from favorites |

---

### 2.6 Seller Dashboard (`/api/v1/seller`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/seller/listings` | Authenticated | List all owned ads across all moderation states (`pending`, `approved`, `rejected`, `draft`) |
| `GET` | `/seller/stats` | Authenticated | Ad views, active count, sold count, favorite count |

---

### 2.7 Violations & Reports (`/api/v1/reports`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/reports` | Authenticated | Report fraudulent ad, spam, prohibited item, or counterfeit item |

---

### 2.8 Moderation Queue (`/api/v1/moderation`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/moderation/queue` | Moderator+ | Fetch pending listings for review (sorted by oldest first) |
| `POST` | `/moderation/:id/approve` | Moderator+ | Approve listing, sets status to `approved`, creates notification |
| `POST` | `/moderation/:id/reject` | Moderator+ | Reject listing with standardized reason code & explanation |
| `GET` | `/moderation/reports` | Moderator+ | Review submitted abuse reports and take punitive action |

---

### 2.9 Administration (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | Admin+ | Aggregated KPIs: total users, active listings, pending reviews, reports |
| `GET` | `/admin/users` | Admin+ | Paginated user management with status filters |
| `PATCH` | `/admin/users/:id/status` | Admin+ | Suspend or reactivate user account |
| `PATCH` | `/admin/users/:id/role` | Super Admin | Promote or demote user roles |
| `GET` | `/admin/audit-logs` | Admin+ | Searchable audit trail with actor, action, and JSON diffs |
| `GET` | `/admin/settings` | Admin+ | View system config keys (e.g. max upload size, auto-expire days) |
| `PUT` | `/admin/settings` | Super Admin | Update system configuration values |
