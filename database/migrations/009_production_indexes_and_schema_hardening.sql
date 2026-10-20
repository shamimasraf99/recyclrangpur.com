-- Migration 009: Production Indexes and Schema Hardening
-- 1. Expand image_url / thumbnail_url columns to MEDIUMTEXT so both CDN URLs and local WebP Data URIs never overflow VARCHAR(500)
ALTER TABLE product_images
    MODIFY COLUMN image_url MEDIUMTEXT NOT NULL,
    MODIFY COLUMN thumbnail_url MEDIUMTEXT NOT NULL;

ALTER TABLE banners
    MODIFY COLUMN image_url MEDIUMTEXT NOT NULL;

-- 2. Add missing production performance indexes for slug lookup, views sorting, featured filtering, and duplicate report detection
CREATE INDEX idx_prod_slug ON products (slug);
CREATE INDEX idx_prod_views ON products (moderation_status, availability_status, views_count DESC);
CREATE INDEX idx_prod_featured ON products (is_featured, moderation_status, availability_status);
CREATE INDEX idx_reports_reporter_target ON reports (reporter_id, product_id, reported_user_id, status);
