-- Migration 006: Wishlists and Seller Contact Logs
-- Up Migration
CREATE TABLE IF NOT EXISTS wishlists (
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_wl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_wl_user (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seller_contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    seller_id BIGINT UNSIGNED NOT NULL,
    buyer_id BIGINT UNSIGNED NULL,
    contact_channel ENUM('phone_reveal', 'whatsapp_click', 'message') NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sc_prod FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_buyer FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_sc_seller (seller_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
