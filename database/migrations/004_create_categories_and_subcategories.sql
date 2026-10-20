-- Migration 004: Categories and Subcategories
-- Up Migration
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_bn VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon_name VARCHAR(100) NOT NULL,
    description_bn TEXT NULL,
    description_en TEXT NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cat_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subcategories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name_bn VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subcat_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    UNIQUE KEY uq_subcat_slug (category_id, slug),
    INDEX idx_subcat_active (category_id, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
