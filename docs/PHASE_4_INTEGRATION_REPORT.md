# Phase 4: Frontend-to-Backend Integration & Marketplace Workflow Report
## Bangladesh Used Products Marketplace (BikroyBD — কেনাবেচা)
**Version:** 1.0.0 (Phase 4 Deliverable)  
**Status:** Completed & Verified  

---

## 1. Overview of Phase 4 Implementation

Phase 4 bridges the complete buyer-seller marketplace workflows between the responsive React + TypeScript frontend, the Node.js/Express REST API v1, and the Android client app.

All buyer and seller workflows strictly adhere to the business rules:
- **Direct Buyer-Seller Model:** No mandatory online payment gateway or forced checkout. Buyers inspect used items in person and pay the seller directly.
- **Server-Enforced Authorization:** Listing modifications, draft submissions, status transitions, and deletions use the authenticated session identity (`req.user.id`) rather than client-supplied IDs, completely neutralizing Insecure Direct Object References (IDOR).
- **Graceful Fault Tolerance:** Frontend service layers (`ProductService`, `MediaService`, `WishlistService`, `AuthService`, `ReportService`) communicate with `/api/v1` endpoints with fallback resilience if the database or backend is in development mode.

---

## 2. Integrated Workflows & Endpoints

### 2.1 Product Creation, Editing & Draft Submission
- **Component:** `/client/src/pages/PostAdPage.tsx` & `/client/src/pages/SellerDashboardPage.tsx`
- **Endpoints Connected:**
  - `POST /api/v1/products`: Creates listing as `draft` or `pending`
  - `PUT /api/v1/products/:id`: Updates existing ad (checks `seller_id == req.user.id`)
  - `POST /api/v1/seller/products/:id/submit`: Transitions ad from `draft` to `pending` review
  - `DELETE /api/v1/products/:id`: Soft-deletes listing (`deleted_at = NOW()`)
- **Key Features:**
  - 3-step wizard with category, technical specifications, location, contact, and multiple photo upload.
  - Pre-population when opened in edit mode (`/post-ad?edit=:id`).
  - Strict submission debouncing to prevent double-posting.

### 2.2 Multiple Image Upload
- **Service:** `/client/src/services/mediaService.ts`
- **Backend Route:** `POST /api/v1/media/upload`
- **Capabilities:**
  - Multi-file selection (up to 5 photos per listing).
  - EXIF GPS metadata stripping and WebP image optimization.
  - Image preview thumbnails with removal and primary photo ordering.

### 2.3 Product Discovery, Filters, Sorting & Pagination
- **Component:** `/client/src/pages/ProductListingPage.tsx` & `/client/src/services/productService.ts`
- **Endpoint:** `GET /api/v1/products`
- **Query Parameters Handled:**
  - `q`: Full-text keyword search across Bengali and English titles and descriptions
  - `category`: Root category ID
  - `subcategory`: Child subcategory ID
  - `division`: Bangladesh Division ID (1 to 8: Dhaka, Chittagong, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh)
  - `district`: Bangladesh District ID (1 to 64)
  - `condition`: `like_new`, `good`, `fair`, `for_parts`
  - `minPrice` & `maxPrice`: BDT (৳) range filters
  - `isNegotiable`: Boolean toggle
  - `sort`: `newest`, `price_low_high`, `price_high_low`, `most_viewed`
  - `page` & `limit`: Server-side pagination with active page indicators
- **UI States:** Animated skeleton cards during loading, clean empty state with reset filters button when zero results match.

### 2.4 Product Detail Page & Buyer Actions
- **Component:** `/client/src/pages/ProductDetailPage.tsx`
- **Endpoint:** `GET /api/v1/products/:id`
- **Workflows:**
  - High-resolution gallery with thumbnail switcher.
  - Condition badge, location breadcrumbs, and formatted BDT price (`৳ ৬০,০০০`).
  - Direct buyer inspection security banner reminding buyers to inspect items before payment.
  - **Phone Reveal Telemetry:** Clicking "বিক্রেতার নম্বর দেখুন" records a view log on `POST /api/v1/seller/contacts/track` with channel `phone_reveal`.
  - **WhatsApp Direct Contact:** Launches direct chat with seller with pre-filled greeting.
  - **Abuse Reporting:** Opens `ReportListingModal` sending report to `POST /api/v1/reports`.

### 2.5 Seller Dashboard & Status Management
- **Component:** `/client/src/pages/SellerDashboardPage.tsx`
- **Endpoints:**
  - `GET /api/v1/seller/listings`: Current authenticated user's listings
  - `PATCH /api/v1/products/:id/status`: Updates availability (`available`, `reserved`, `sold`, `archived`)
- **Tabs:**
  - All (`সকল`)
  - Active (`সক্রিয়`)
  - Under Review (`রিভিউধীন`)
  - Drafts (`ড্রাফট`)
  - Sold (`বিক্রি হয়েছে`)
- **Actions:**
  - Mark Sold / Reactivate toggle
  - Submit Draft for Approval
  - Edit Listing navigation
  - Delete Listing confirmation

### 2.6 Wishlist Persistence
- **Component:** `/client/src/pages/WishlistPage.tsx` & `/client/src/context/AuthContext.tsx`
- **Endpoints:**
  - `GET /api/v1/wishlist`: Fetches user's saved items
  - `POST /api/v1/wishlist/:id`: Adds product to MySQL `wishlists` table
  - `DELETE /api/v1/wishlist/:id`: Removes product from `wishlists`
- **Features:** Optimistic UI updates with instant heart fill/unfill, empty state with browse CTA.

### 2.7 Public Seller Profile
- **Component:** `/client/src/pages/PublicSellerProfilePage.tsx`
- **Endpoint:** `GET /api/v1/seller/:id`
- **Features:** Verified seller badge, join date, sanitized user info (no private password/phone exposure), and list of seller's other active ads.

---

## 3. Integration Testing & Verification

A dedicated suite of integration tests has been implemented in `/tests/integration/lifecycle.api.test.ts`:
- **Draft Creation:** Validates default state (`moderation_status = 'draft'`, `availability_status = 'available'`).
- **Owner Submission:** Verifies owner can submit draft for moderation review (`draft -> pending`).
- **IDOR Protection:** Verifies non-owners receive `403 FORBIDDEN` when attempting to edit or submit another user's ad.
- **State Machine Integrity:** Enforces that only moderators/admins can approve pending ads, and unapproved ads cannot be displayed publicly or marked sold.
- **Contact Telemetry:** Verifies buyer contact clicks (`phone_reveal` and `whatsapp_click`) are tracked.
- **Sold Transition:** Verifies seller can mark an active item sold and reactivate it if needed.
- **Soft Deletion:** Verifies deletion sets `deleted_at` timestamp and removes the listing from public discovery while preserving audit trails.

---

## 4. Platform Alignment & Mobile App

- The Android application (`MainActivity.kt`) has been updated with a rich Jetpack Compose interface matching the BikroyBD theme (emerald/amber palette), featuring division filtering, keyword search, BDT currency formatting, seller contact modal, and bilingual English/Bangla language switching.
- Custom adaptive launcher icons (`ic_launcher_background.xml` and `ic_launcher_foreground.xml`) have been installed following Android Material You specifications.
- Build integrity verified via `compile_applet`.
