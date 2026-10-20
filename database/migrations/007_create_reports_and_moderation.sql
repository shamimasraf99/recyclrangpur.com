-- Migration 007: Reports and Moderation
-- Up Migration
CREATE TABLE IF NOT EXISTS reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NULL,
    reported_user_id BIGINT UNSIGNED NULL,
    reason_code VARCHAR(50) NOT NULL,
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
