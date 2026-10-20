import crypto from 'crypto';
import { query, withTransaction } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { ProductCondition, ModerationStatus, AvailabilityStatus } from '../../../shared/types';

export class ProductModel {
  /**
   * Search public listings.
   * STRICT CONSTRAINT: Only approved, available, and non-deleted products appear.
   */
  static async searchPublicProducts(filters: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string | number;
    subcategory?: string | number;
    division?: string | number;
    district?: string | number;
    condition?: ProductCondition;
    minPrice?: number;
    maxPrice?: number;
    isNegotiable?: boolean;
    sort?: 'newest' | 'price_low_high' | 'price_high_low' | 'most_viewed';
  }) {
    const page = Math.max(1, Math.floor(Number(filters.page) || 1));
    const limit = Math.min(60, Math.max(1, Math.floor(Number(filters.limit) || 24)));
    const offset = (page - 1) * limit;

    let whereClause = `
      WHERE p.moderation_status = 'approved'
        AND p.availability_status = 'available'
        AND p.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (filters.q) {
      whereClause += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
      const safeQ = String(filters.q).replace(/[%_]/g, '\\$&');
      const term = `%${safeQ}%`;
      params.push(term, term);
    }

    if (filters.category) {
      whereClause += ` AND (c.id = ? OR c.slug = ?)`;
      params.push(filters.category, filters.category);
    }

    if (filters.subcategory) {
      whereClause += ` AND (sc.id = ? OR sc.slug = ?)`;
      params.push(filters.subcategory, filters.subcategory);
    }

    if (filters.division) {
      whereClause += ` AND (d.id = ? OR d.slug = ?)`;
      params.push(filters.division, filters.division);
    }

    if (filters.district) {
      whereClause += ` AND (dist.id = ? OR dist.slug = ?)`;
      params.push(filters.district, filters.district);
    }

    if (filters.condition) {
      whereClause += ` AND p.\`condition\` = ?`;
      params.push(filters.condition);
    }

    if (filters.minPrice !== undefined && !isNaN(Number(filters.minPrice)) && Number(filters.minPrice) >= 0) {
      whereClause += ` AND p.price_bdt >= ?`;
      params.push(Number(filters.minPrice));
    }

    if (filters.maxPrice !== undefined && !isNaN(Number(filters.maxPrice)) && Number(filters.maxPrice) > 0) {
      whereClause += ` AND p.price_bdt <= ?`;
      params.push(Number(filters.maxPrice));
    }

    if (filters.isNegotiable !== undefined) {
      const boolVal = String(filters.isNegotiable) === 'true' || filters.isNegotiable === true;
      whereClause += ` AND p.is_negotiable = ?`;
      params.push(boolVal ? 1 : 0);
    }

    let orderClause = ` ORDER BY p.created_at DESC`;
    if (filters.sort === 'price_low_high') orderClause = ` ORDER BY p.price_bdt ASC`;
    else if (filters.sort === 'price_high_low') orderClause = ` ORDER BY p.price_bdt DESC`;
    else if (filters.sort === 'most_viewed') orderClause = ` ORDER BY p.views_count DESC`;

    const sql = `
      SELECT p.id, p.uuid, p.seller_id, p.title, p.slug, p.description,
             p.price_bdt as priceBdt, p.is_negotiable as isNegotiable,
             p.\`condition\`, p.views_count as viewsCount, p.is_featured as isFeatured,
             p.created_at as createdAt,
             c.id as categoryId, c.name_bn as categoryNameBn, c.name_en as categoryNameEn, c.slug as categorySlug,
             sc.id as subcategoryId, sc.name_bn as subcategoryNameBn, sc.name_en as subcategoryNameEn,
             d.id as divisionId, d.name_bn as divisionNameBn, d.name_en as divisionNameEn,
             dist.id as districtId, dist.name_bn as districtNameBn, dist.name_en as districtNameEn,
             (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primaryImage
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN subcategories sc ON p.subcategory_id = sc.id
      INNER JOIN locations_divisions d ON p.division_id = d.id
      INNER JOIN locations_districts dist ON p.district_id = dist.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];
    const rows = await query<RowDataPacket[]>(sql, queryParams);

    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN subcategories sc ON p.subcategory_id = sc.id
      INNER JOIN locations_divisions d ON p.division_id = d.id
      INNER JOIN locations_districts dist ON p.district_id = dist.id
      ${whereClause}
    `;
    const countRows = await query<RowDataPacket[]>(countSql, params);
    const totalItems = Number(countRows?.[0]?.total) || 0;

    return {
      products: rows,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit))
      }
    };
  }

  /**
   * Find product details by ID or Slug and increment view count
   */
  static async findById(idOrSlug: string | number): Promise<RowDataPacket | null> {
    const isNumeric = !isNaN(Number(idOrSlug)) && String(idOrSlug).trim() !== '';
    const condition = isNumeric ? `p.id = ?` : `p.slug = ?`;

    const rows = await query<RowDataPacket[]>(
      `SELECT p.*,
              u.full_name as seller_name, u.avatar_url as seller_avatar, u.is_verified as seller_verified, u.created_at as seller_joined,
              c.name_bn as category_name_bn, c.name_en as category_name_en, c.slug as category_slug,
              sc.name_bn as subcategory_name_bn, sc.name_en as subcategory_name_en,
              d.name_bn as division_name_bn, d.name_en as division_name_en,
              dist.name_bn as district_name_bn, dist.name_en as district_name_en
       FROM products p
       INNER JOIN users u ON p.seller_id = u.id
       INNER JOIN categories c ON p.category_id = c.id
       INNER JOIN subcategories sc ON p.subcategory_id = sc.id
       INNER JOIN locations_divisions d ON p.division_id = d.id
       INNER JOIN locations_districts dist ON p.district_id = dist.id
       WHERE ${condition} AND p.deleted_at IS NULL
       LIMIT 1`,
      [isNumeric ? Number(idOrSlug) : idOrSlug]
    );

    if (rows.length === 0) return null;

    const product = rows[0];

    // Increment view count asynchronously
    query(`UPDATE products SET views_count = views_count + 1 WHERE id = ?`, [product.id]).catch(() => {});

    // Fetch images
    const images = await query<RowDataPacket[]>(
      `SELECT id, image_url as imageUrl, thumbnail_url as thumbnailUrl, sort_order as sortOrder, is_primary as isPrimary
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [product.id]
    );

    return { ...product, images };
  }

  /**
   * Create new product listing in transaction
   */
  static async create(data: {
    sellerId: number;
    title: string;
    description: string;
    categoryId: number;
    subcategoryId: number;
    priceBdt: number;
    isNegotiable: boolean;
    condition: ProductCondition;
    divisionId: number;
    districtId: number;
    upazilaId?: number | null;
    areaDetails?: string | null;
    contactPhone: string;
    hidePhone: boolean;
    allowWhatsapp: boolean;
    imageUrls: string[];
    moderationStatus?: 'draft' | 'pending';
  }): Promise<number> {
    return await withTransaction(async (conn) => {
      const uuid = crypto.randomUUID();
      const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}-${uuid.slice(0, 8)}`;
      const modStatus = data.moderationStatus === 'draft' ? 'draft' : 'pending';

      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO products (
          uuid, seller_id, title, slug, description, category_id, subcategory_id,
          price_bdt, is_negotiable, \`condition\`, division_id, district_id, upazila_id,
          area_details, contact_phone, hide_phone, allow_whatsapp, moderation_status, availability_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [
          uuid,
          data.sellerId,
          data.title,
          slug,
          data.description,
          data.categoryId,
          data.subcategoryId,
          data.priceBdt,
          data.isNegotiable ? 1 : 0,
          data.condition,
          data.divisionId,
          data.districtId,
          data.upazilaId || null,
          data.areaDetails || null,
          data.contactPhone,
          data.hidePhone ? 1 : 0,
          data.allowWhatsapp ? 1 : 0,
          modStatus
        ]
      );

      const productId = res.insertId;

      // Insert image records
      for (let i = 0; i < data.imageUrls.length; i++) {
        const url = data.imageUrls[i];
        await conn.execute(
          `INSERT INTO product_images (product_id, image_url, thumbnail_url, sort_order, is_primary)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, url, url, i, i === 0 ? 1 : 0]
        );
      }

      return productId;
    });
  }

  /**
   * Update listing (Protected: seller owns the product or caller is admin)
   */
  static async update(
    productId: number,
    sellerId: number,
    isAdmin: boolean,
    data: any
  ): Promise<boolean> {
    const checkSql = isAdmin
      ? `SELECT id FROM products WHERE id = ? AND deleted_at IS NULL`
      : `SELECT id FROM products WHERE id = ? AND seller_id = ? AND deleted_at IS NULL`;
    const checkParams = isAdmin ? [productId] : [productId, sellerId];

    const rows = await query<RowDataPacket[]>(checkSql, checkParams);
    if (rows.length === 0) return false;

    await query(
      `UPDATE products
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           price_bdt = COALESCE(?, price_bdt),
           is_negotiable = COALESCE(?, is_negotiable),
           \`condition\` = COALESCE(?, \`condition\`),
           area_details = COALESCE(?, area_details),
           contact_phone = COALESCE(?, contact_phone),
           hide_phone = COALESCE(?, hide_phone),
           allow_whatsapp = COALESCE(?, allow_whatsapp),
           moderation_status = 'pending'
       WHERE id = ?`,
      [
        data.title ?? null,
        data.description ?? null,
        data.priceBdt ?? null,
        data.isNegotiable !== undefined ? (data.isNegotiable ? 1 : 0) : null,
        data.condition ?? null,
        data.areaDetails ?? null,
        data.contactPhone ?? null,
        data.hidePhone !== undefined ? (data.hidePhone ? 1 : 0) : null,
        data.allowWhatsapp !== undefined ? (data.allowWhatsapp ? 1 : 0) : null,
        productId
      ]
    );

    return true;
  }

  /**
   * Update availability status with transition safety (e.g. mark sold or reserved)
   */
  static async updateAvailability(
    productId: number,
    sellerId: number,
    isAdmin: boolean,
    newStatus: AvailabilityStatus
  ): Promise<{ success: boolean; error?: string }> {
    const rows = await query<RowDataPacket[]>(
      isAdmin
        ? `SELECT availability_status FROM products WHERE id = ? AND deleted_at IS NULL`
        : `SELECT availability_status FROM products WHERE id = ? AND seller_id = ? AND deleted_at IS NULL`,
      isAdmin ? [productId] : [productId, sellerId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Product not found or not owned by caller' };
    }

    const currentStatus = rows[0].availability_status as AvailabilityStatus;
    if (currentStatus === newStatus) {
      return { success: true };
    }

    const allowedTransitions: Record<AvailabilityStatus, AvailabilityStatus[]> = {
      available: ['reserved', 'sold', 'archived'],
      reserved: ['available', 'sold', 'archived'],
      sold: ['available', 'archived'],
      archived: ['available']
    };

    if (!isAdmin && !allowedTransitions[currentStatus]?.includes(newStatus)) {
      return { success: false, error: `Invalid status transition from ${currentStatus} to ${newStatus}` };
    }

    const sql = isAdmin
      ? `UPDATE products SET availability_status = ? WHERE id = ? AND deleted_at IS NULL`
      : `UPDATE products SET availability_status = ? WHERE id = ? AND seller_id = ? AND deleted_at IS NULL`;
    const params = isAdmin ? [newStatus, productId] : [newStatus, productId, sellerId];

    const result = await query<ResultSetHeader>(sql, params);
    return { success: result.affectedRows > 0 };
  }

  /**
   * Soft delete product
   */
  static async softDelete(productId: number, sellerId: number, isAdmin: boolean): Promise<boolean> {
    const sql = isAdmin
      ? `UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`
      : `UPDATE products SET deleted_at = NOW() WHERE id = ? AND seller_id = ? AND deleted_at IS NULL`;
    const params = isAdmin ? [productId] : [productId, sellerId];

    const result = await query<ResultSetHeader>(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Get all ads belonging to seller
   */
  static async getSellerListings(sellerId: number) {
    return await query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.price_bdt as priceBdt, p.\`condition\`,
              p.moderation_status as moderationStatus, p.availability_status as availabilityStatus,
              p.views_count as viewsCount, p.created_at as createdAt,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primaryImage
       FROM products p
       WHERE p.seller_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [sellerId]
    );
  }

  /**
   * Moderation Queue: fetch pending ads
   */
  static async getModerationQueue(page: number = 1, limit: number = 20) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));
    const offset = (safePage - 1) * safeLimit;
    const items = await query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.description, p.price_bdt as priceBdt, p.\`condition\`, p.created_at as createdAt,
              u.full_name as sellerName, u.email as sellerEmail, u.phone_number as sellerPhone,
              c.name_bn as categoryNameBn, dist.name_bn as districtNameBn,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primaryImage
       FROM products p
       INNER JOIN users u ON p.seller_id = u.id
       INNER JOIN categories c ON p.category_id = c.id
       INNER JOIN locations_districts dist ON p.district_id = dist.id
       WHERE p.moderation_status = 'pending' AND p.deleted_at IS NULL
       ORDER BY p.created_at ASC
       LIMIT ? OFFSET ?`,
      [safeLimit, offset]
    );

    const countRows = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM products WHERE moderation_status = 'pending' AND deleted_at IS NULL`
    );

    return {
      items,
      total: Number(countRows?.[0]?.total) || 0
    };
  }

  /**
   * Approve or reject product in moderation
   */
  static async setModerationStatus(
    productId: number,
    moderatorId: number,
    status: 'approved' | 'rejected',
    rejectReason?: string
  ): Promise<boolean> {
    const res = await query<ResultSetHeader>(
      `UPDATE products
       SET moderation_status = ?,
           reviewed_by = ?,
           reviewed_at = NOW(),
           reject_reason = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [status, moderatorId, rejectReason || null, productId]
    );
    return res.affectedRows > 0;
  }

  /**
   * Submit draft ad for moderation approval
   */
  static async submitDraftForApproval(productId: number, sellerId: number): Promise<boolean> {
    const res = await query<ResultSetHeader>(
      `UPDATE products
       SET moderation_status = 'pending'
       WHERE id = ? AND seller_id = ? AND moderation_status = 'draft' AND deleted_at IS NULL`,
      [productId, sellerId]
    );
    return res.affectedRows > 0;
  }

  /**
   * Track seller contact inquiry (phone reveal or whatsapp click)
   */
  static async trackContact(data: {
    productId: number;
    sellerId: number;
    buyerId: number | null;
    channel: 'phone_reveal' | 'whatsapp_click';
    ipAddress: string;
  }): Promise<void> {
    await query(
      `INSERT INTO seller_contacts (product_id, seller_id, buyer_id, contact_channel, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [data.productId, data.sellerId, data.buyerId, data.channel, data.ipAddress]
    );
  }

  /**
   * Fetch public seller profile and their active approved listings
   */
  static async getPublicSellerProfile(sellerId: number) {
    const users = await query<RowDataPacket[]>(
      `SELECT u.id, u.uuid, u.full_name as fullName, u.avatar_url as avatarUrl, u.bio,
              u.is_verified as isVerified, u.created_at as createdAt,
              d.name_bn as divisionNameBn, dist.name_bn as districtNameBn
       FROM users u
       LEFT JOIN locations_divisions d ON u.division_id = d.id
       LEFT JOIN locations_districts dist ON u.district_id = dist.id
       WHERE u.id = ? AND u.deleted_at IS NULL AND u.is_suspended = FALSE
       LIMIT 1`,
      [sellerId]
    );

    if (users.length === 0) return null;

    const seller = users[0];

    const listings = await query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.price_bdt as priceBdt, p.\`condition\`,
              p.views_count as viewsCount, p.created_at as createdAt,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primaryImage
       FROM products p
       WHERE p.seller_id = ? AND p.moderation_status = 'approved' AND p.availability_status = 'available' AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [sellerId]
    );

    return { seller, listings };
  }
}
