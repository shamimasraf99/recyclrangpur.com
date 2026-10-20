import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class WishlistModel {
  static async getUserWishlist(userId: number) {
    return await query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.price_bdt as priceBdt, p.condition, p.created_at as createdAt,
              c.name_bn as categoryNameBn, dist.name_bn as districtNameBn,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primaryImage
       FROM wishlists w
       INNER JOIN products p ON w.product_id = p.id
       INNER JOIN categories c ON p.category_id = c.id
       INNER JOIN locations_districts dist ON p.district_id = dist.id
       WHERE w.user_id = ? AND p.deleted_at IS NULL
       ORDER BY w.created_at DESC`,
      [userId]
    );
  }

  static async add(userId: number, productId: number): Promise<void> {
    await query(
      `INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)`,
      [userId, productId]
    );
  }

  static async remove(userId: number, productId: number): Promise<void> {
    await query(
      `DELETE FROM wishlists WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    );
  }
}
