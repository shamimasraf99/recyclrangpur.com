# Phase 2: Frontend Implementation Report
## Bangladesh Used Products Marketplace (BikroyBD — কেনাবেচা)

---

## 1. Route Map

| URL Path | Component | Description & Key Functionality | Access Level |
|---|---|---|---|
| `/` | `HomePage` | Hero search, location quick-selector, category grid, featured listings carousel, latest ads, CTA banner. | Public |
| `/products` | `ProductListingPage` | Filterable catalog by category, division, district, condition, price range (BDT ৳), negotiable flag, sorting, search keyword. | Public |
| `/category/:slug` | `CategoryPage` | Category banner, subcategory pills, filtered listing view. | Public |
| `/products/:id` | `ProductDetailPage` | Multi-image gallery, condition badge, price in BDT, seller card, direct contact modal (Phone click-to-reveal & WhatsApp), report listing modal. | Public |
| `/login` | `LoginPage` | Email / Phone login with validation, demo user / admin quick-fill buttons. | Public |
| `/register` | `RegisterPage` | Account creation with 11-digit Bangladeshi phone validation (`017...`), full name, password. | Public |
| `/profile` | `ProfilePage` | User profile management, bio, location, verification badge. | Authenticated |
| `/dashboard` | `SellerDashboardPage` | Seller ad management: All, Active, Pending, Sold tabs; mark as sold, delete, KPI metrics. | Authenticated |
| `/post-ad` | `PostAdPage` | 3-step listing creation wizard: Category -> Details & Pricing -> Photos (max 5), Location & Contact phone. | Authenticated |
| `/wishlist` | `WishlistPage` | Saved favorite listings with quick removal and contact action. | Authenticated |
| `/seller/:id` | `PublicSellerProfilePage` | Public seller profile, verification status, join date, all active ads by the seller. | Public |
| `/admin` | `AdminDashboardPage` | Moderation queue with one-click approve/reject actions, user account suspension controls, audit log stream. | Admin / Staff |
| `/admin/login` | `AdminLoginPage` | Dedicated authentication screen for staff members. | Public |

---

## 2. Component Inventory

### 2.1 Common Atoms & Molecules (`client/src/components/common/`)
- `Button`: Primary emerald, secondary, outline, danger, and ghost variants; size variants (`sm`, `md`, `lg`), loading spinner, and icon support.
- `Badge`: Standardized badges for **Condition** (`like_new`, `good`, `fair`, `for_parts`), **Moderation** (`pending`, `approved`, `rejected`), and **Availability** (`available`, `reserved`, `sold`).
- `Modal`: Accessible backdrop dialog with Escape key and overlay click listeners.
- `SkeletonLoader`: Shimmer card and detail page skeletons for realistic loading states.
- `EmptyState`: Contextual empty placeholders for searches, wishlists, and moderation queues.

### 2.2 Shell & Layout Components (`client/src/components/layout/`)
- `Navbar`: Sticky blurred header, logo, location selector trigger, language toggle (`বাংলা` / `English`), theme toggle (`Light` / `Dark`), wishlist badge counter, user menu, demo switcher.
- `MobileBottomNav`: Fixed bottom bar for small screens with elevated Post Ad center button.
- `Footer`: Division directory, category directory, buyer safety advice (Direct inspection, zero advance payment rule), BDT currency notation.

### 2.3 Product & Contact Components (`client/src/components/product/`)
- `ProductCard`: Responsive card with primary image, condition badge, BDT formatted price, location tag, time ago, and wishlist toggle.
- `SellerContactModal`: Direct communication modal with click-to-reveal phone masking, clipboard copy, direct WhatsApp deep link (`https://wa.me/...`), and physical safety tips.
- `ReportListingModal`: Abuse reporting modal with reason codes (`fraud_scam`, `prohibited_item`, `counterfeit`, etc.).

### 2.4 Geographic Components (`client/src/components/location/`)
- `LocationSelectorModal`: Cascading selector for all 8 Bangladesh divisions and 64 districts with bilingual labels.

---

## 3. Design System & Accessibility

- **Typography:** **Hind Siliguri** (Google Fonts) as primary font with Bengali numeral support (`০-৯`) and currency glyph (`৳ BDT`).
- **Color Palette:**
  - Emerald Green (`#059669` / `#10b981`): National Bangladesh primary accent.
  - Rose Accent (`#f43f5e`): Wishlist hearts and destructive actions.
  - Amber (`#f59e0b`): Featured highlights and moderation pending indicators.
- **Themes:** Complete Dark / Light theme coverage using Tailwind CSS `.dark` selector and persisted in `localStorage`.
- **Responsive Breakpoints:** Mobile-first layout optimized for vertical smartphone viewports (360px+) through widescreen desktop (1280px+).

---

## 4. Development Fixtures & Backend Readiness

- Isolated development fixtures located in `client/src/fixtures/mockData.ts` provide realistic Bangladeshi classified listings (iPhone 14 Pro, MacBook Air M2, Yamaha R15 V3, Sony Bravia 55", Segun wood sofa, Nikon D750 for parts) across Dhaka and Chattogram.
- When Phase 3 (Backend REST API) and Phase 4 (Marketplace Integration) are implemented, service adapters in `client/src/services/` will replace the fixture data seamlessly with Axios HTTP calls to `/api/v1/...`.
