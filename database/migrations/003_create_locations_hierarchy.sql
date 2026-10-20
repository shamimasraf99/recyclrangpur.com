-- Migration 003: Locations Hierarchy (Divisions, Districts, Upazilas)
-- Up Migration
CREATE TABLE IF NOT EXISTS locations_divisions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS locations_districts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    division_id INT UNSIGNED NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_dist_division FOREIGN KEY (division_id) REFERENCES locations_divisions (id) ON DELETE RESTRICT,
    INDEX idx_dist_division (division_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS locations_upazilas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    district_id INT UNSIGNED NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    sort_order SMALLINT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_upazila_district FOREIGN KEY (district_id) REFERENCES locations_districts (id) ON DELETE RESTRICT,
    UNIQUE KEY uq_upazila_district_slug (district_id, slug),
    INDEX idx_upazila_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
