# Data Dictionary & Database Schema Specification
## Bangladesh Used Products Marketplace (BikroyBD)
**Engine:** MySQL 8.0+ (InnoDB)  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Time Standard:** UTC (stored as `DATETIME` or `TIMESTAMP` in UTC, formatted to `Asia/Dhaka` GMT+6 in UI)

---

## 1. Table Inventory

| # | Table Name | Purpose / Description |
|---|---|---|
| 1 | `roles` | System roles (guest, user, moderator, admin, super_admin) |
| 2 | `permissions` | Granular capability flags (e.g., `listings:moderate`) |
| 3 | `role_permissions` | Many-to-many junction between roles and permissions |
| 4 | `users` | User accounts with authentication credentials, profile data, and status |
| 5 | `user_roles` | Many-to-many junction assigning roles to users |
| 6 | `user_sessions` | Active user refresh sessions with device and IP tracking |
| 7 | `locations_divisions` | 8 administrative divisions of Bangladesh (e.g., ঢাকা, চট্টগ্রাম) |
| 8 | `locations_districts` | 64 administrative districts under the 8 divisions |
| 9 | `locations_upazilas` | Upazilas / Thanas under the 64 districts |
| 10 | `categories` | Primary marketplace categories (bilingual titles, slug, icon) |
| 11 | `subcategories` | Secondary classification under primary categories |
| 12 | `products` | Core product classified listings with condition, price, status, location |
| 13 | `product_images` | Image URLs, thumbnails, sort orders, and primary image flags |
| 14 | `wishlists` | Saved/favorited products per user |
| 15 | `reports` | User/Listing violation reports for moderation triage |
| 16 | `notifications` | In-app user notifications (bilingual title/body, status, link) |
| 17 | `banners` | Promotional and announcement banners |
| 18 | `settings` | Key-value store for global platform configurations |
| 19 | `audit_logs` | Immutable audit trail for all admin/moderator actions |
| 20 | `schema_migrations` | Tracks applied database migration scripts |

---

## 2. Table Schemas & Specifications

### 2.1 `roles`
Stores definition of user roles.
```sql
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,          -- 'guest', 'user', 'moderator', 'admin', 'super_admin'
    display_name_bn VARCHAR(100) NOT NULL,     -- 'ব্যবহারকারী', 'মডারেটর', 'অ্যাডমিন', etc.
    display_name_en VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 `permissions`
Stores fine-grained permissions.
```sql
CREATE TABLE permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,         -- 'listings:create', 'listings:moderate', etc.
    module VARCHAR(50) NOT NULL,               -- 'listings', 'users', 'reports', 'settings'
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 `role_permissions`
Maps roles to permissions.
```sql
CREATE TABLE role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### 2.4 `users`
Registered user accounts.
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,   -- E.164 or BD format (01XXXXXXXXX)
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason VARCHAR(255) NULL,
    suspended_at DATETIME NULL,
    division_id INT UNSIGNED NULL,
    district_id INT UNSIGNED NULL,
    upazila_id INT UNSIGNED NULL,
    preferred_language ENUM('bn', 'en') DEFAULT 'bn',
    last_login_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone_number),
    INDEX idx_users_status (is_suspended, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5 `user_roles`
User-to-role assignment.
```sql
CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### 2.6 `user_sessions`
Active refresh token sessions.
```sql
CREATE TABLE user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,      -- SHA-256 of refresh token
    ip_address VARCHAR(45) NOT NULL,          -- IPv4 or IPv6
    user_agent VARCHAR(500) NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_session_lookup (user_id, is_revoked, expires_at)
) ENGINE=InnoDB;
```

### 2.7 Location Hierarchy (`locations_divisions`, `locations_districts`, `locations_upazilas`)
Bangladesh 3-tier geography.
```sql
CREATE TABLE locations_divisions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_bn VARCHAR(100) NOT NULL,             -- 'ঢাকা', 'চট্টগ্রাম', etc.
    name_en VARCHAR(100) NOT NULL,             -- 'Dhaka', 'Chattogram'
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations_districts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    division_id INT UNSIGNED NOT NULL,
    name_bn VARCHAR(100) NOT NULL,             -- 'ঢাকা', 'গাজীপুর', etc.
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_dist_division FOREIGN KEY (division_id) REFERENCES locations_divisions (id) ON DELETE RESTRICT,
    INDEX idx_dist_division (division_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations_upazilas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    district_id INT UNSIGNED NOT NULL,
    name_bn VARCHAR(100) NOT NULL,             -- 'ধানমন্ডি', 'মিরপুর', etc.
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_upazila_district FOREIGN KEY (district_id) REFERENCES locations_districts (id) ON DELETE RESTRICT,
    UNIQUE KEY uq_upazila_district_slug (district_id, slug),
    INDEX idx_upazila_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.8 Categories & Subcategories
```sql
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_bn VARCHAR(120) NOT NULL,             -- 'মোবাইল ও গ্যাজেট'
    name_en VARCHAR(120) NOT NULL,             -- 'Mobiles & Gadgets'
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon_name VARCHAR(100) NOT NULL,           -- e.g. 'phone-portrait', 'laptop', 'car'
    description_bn TEXT NULL,
    description_en TEXT NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cat_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subcategories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name_bn VARCHAR(120) NOT NULL,             -- 'স্মার্টফোন'
    name_en VARCHAR(120) NOT NULL,             -- 'Smartphones'
    slug VARCHAR(120) NOT NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subcat_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    UNIQUE KEY uq_subcat_slug (category_id, slug),
    INDEX idx_subcat_active (category_id, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.9 `products` (Classified Listings)
Core classified ads table with all mandatory fields and statuses.
```sql
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    seller_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(240) NOT NULL,
    description TEXT NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    subcategory_id INT UNSIGNED NOT NULL,
    price_bdt DECIMAL(12, 2) NOT NULL,
    is_negotiable BOOLEAN DEFAULT FALSE,
    
    -- Mandatory Condition: 'like_new', 'good', 'fair', 'for_parts'
    `condition` ENUM('like_new', 'good', 'fair', 'for_parts') NOT NULL,
    
    -- Mandatory Geographic coordinates
    division_id INT UNSIGNED NOT NULL,
    district_id INT UNSIGNED NOT NULL,
    upazila_id INT UNSIGNED NULL,
    area_details VARCHAR(255) NULL,            -- e.g., 'House 12, Road 4, Sector 7, Uttara'
    
    -- Contact & Privacy
    contact_phone VARCHAR(20) NOT NULL,
    hide_phone BOOLEAN DEFAULT FALSE,          -- If true, contact only through in-app or masked
    allow_whatsapp BOOLEAN DEFAULT TRUE,
    
    -- Mandatory Moderation Status: 'draft', 'pending', 'approved', 'rejected'
    moderation_status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reject_reason TEXT NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    
    -- Mandatory Availability Status: 'available', 'reserved', 'sold', 'archived'
    availability_status ENUM('available', 'reserved', 'sold', 'archived') NOT NULL DEFAULT 'available',
    
    views_count INT UNSIGNED DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_prod_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_division FOREIGN KEY (division_id) REFERENCES locations_divisions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_district FOREIGN KEY (district_id) REFERENCES locations_districts (id) ON DELETE RESTRICT,
    CONSTRAINT fk_prod_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,

    -- High-Performance Composite Indexes for Public Filter Queries
    INDEX idx_prod_search (moderation_status, availability_status, deleted_at, category_id, district_id, created_at DESC),
    INDEX idx_prod_price (moderation_status, availability_status, price_bdt),
    INDEX idx_prod_seller (seller_id, created_at DESC),
    FULLTEXT INDEX idx_prod_fulltext (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.10 `product_images`
Product photo gallery with optimization targets.
```sql
CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NOT NULL,
    public_id VARCHAR(255) NULL,              -- Cloudinary / S3 asset identifier
    sort_order TINYINT UNSIGNED DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    width INT UNSIGNED NULL,
    height INT UNSIGNED NULL,
    file_size_bytes INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_pimg_product (product_id, sort_order)
) ENGINE=InnoDB;
```

### 2.11 `wishlists`
```sql
CREATE TABLE wishlists (
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_wl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_wl_user (user_id, created_at DESC)
) ENGINE=InnoDB;
```

### 2.12 `reports`
Classified violation reporting and moderation triage.
```sql
CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NULL,
    reported_user_id BIGINT UNSIGNED NULL,
    reason_code VARCHAR(50) NOT NULL,          -- 'prohibited_item', 'fraud_scam', 'wrong_category', 'offensive', etc.
    explanation TEXT NOT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    reviewer_id BIGINT UNSIGNED NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rep_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_rep_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_rep_reported_user FOREIGN KEY (reported_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_rep_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_rep_status (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.13 `notifications`
```sql
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,                 -- 'ad_approved', 'ad_rejected', 'price_drop', 'new_message'
    title_bn VARCHAR(200) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    body_bn TEXT NOT NULL,
    body_en TEXT NOT NULL,
    link VARCHAR(255) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notif_user_unread (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.14 `banners`, `settings`, and `audit_logs`
```sql
CREATE TABLE banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    target_url VARCHAR(500) NULL,
    placement ENUM('home_hero', 'category_top', 'sidebar') NOT NULL DEFAULT 'home_hero',
    is_active BOOLEAN DEFAULT TRUE,
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL,
    description VARCHAR(255) NULL,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_setting_updater FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    user_role VARCHAR(50) NULL,
    action VARCHAR(100) NOT NULL,              -- 'product:approved', 'user:suspended', 'category:created'
    entity_type VARCHAR(50) NOT NULL,          -- 'product', 'user', 'category', 'setting'
    entity_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_audit_search (entity_type, entity_id, created_at DESC),
    INDEX idx_audit_action (action, created_at DESC)
) ENGINE=InnoDB;
```
