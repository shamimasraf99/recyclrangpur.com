import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class AdminModel {
  static async getStats() {
    const userCounts = await query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN is_suspended = 1 THEN 1 ELSE 0 END) as suspendedUsers,
        SUM(CASE WHEN is_suspended = 0 THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verifiedUsers
      FROM users WHERE deleted_at IS NULL
    `);

    const roleCounts = await query<RowDataPacket[]>(`
      SELECT r.name, COUNT(ur.user_id) as count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.name
    `);

    const roleMap: Record<string, number> = {};
    if (Array.isArray(roleCounts)) {
      for (const row of roleCounts) {
        roleMap[row.name] = Number(row.count);
      }
    }

    const listingCounts = await query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as totalListings,
        SUM(CASE WHEN moderation_status = 'approved' AND availability_status = 'available' AND deleted_at IS NULL THEN 1 ELSE 0 END) as activeApprovedListings,
        SUM(CASE WHEN moderation_status = 'pending' AND deleted_at IS NULL THEN 1 ELSE 0 END) as pendingModeration,
        SUM(CASE WHEN moderation_status = 'rejected' AND deleted_at IS NULL THEN 1 ELSE 0 END) as rejectedListings,
        SUM(CASE WHEN moderation_status = 'draft' AND deleted_at IS NULL THEN 1 ELSE 0 END) as draftListings,
        SUM(CASE WHEN availability_status = 'sold' THEN 1 ELSE 0 END) as soldListings,
        SUM(CASE WHEN is_featured = 1 AND deleted_at IS NULL THEN 1 ELSE 0 END) as featuredListings
      FROM products
    `);

    const reportCounts = await query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as totalReports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingReports,
        SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END) as investigatingReports,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedReports,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissedReports
      FROM reports
    `);

    const categoryCount = await query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM categories WHERE is_active = TRUE`);
    const subcategoryCount = await query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM subcategories WHERE is_active = TRUE`);
    const bannerCount = await query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM banners WHERE is_active = TRUE`);

    const topCategories = await query<RowDataPacket[]>(`
      SELECT c.id, c.name_bn as nameBn, c.name_en as nameEn, c.icon_name as iconName, COUNT(p.id) as listingCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY listingCount DESC
      LIMIT 6
    `);

    const users = userCounts?.[0] || {};
    const listings = listingCounts?.[0] || {};
    const reports = reportCounts?.[0] || {};

    return {
      users: {
        total: Number(users.totalUsers) || 0,
        active: Number(users.activeUsers) || 0,
        suspended: Number(users.suspendedUsers) || 0,
        verified: Number(users.verifiedUsers) || 0,
        regular: roleMap['user'] || 0,
        moderators: roleMap['moderator'] || 0,
        admins: roleMap['admin'] || 0,
        superAdmins: roleMap['super_admin'] || 0
      },
      listings: {
        total: Number(listings.totalListings) || 0,
        active: Number(listings.activeApprovedListings) || 0,
        pending: Number(listings.pendingModeration) || 0,
        rejected: Number(listings.rejectedListings) || 0,
        draft: Number(listings.draftListings) || 0,
        sold: Number(listings.soldListings) || 0,
        featured: Number(listings.featuredListings) || 0
      },
      reports: {
        total: Number(reports.totalReports) || 0,
        pending: Number(reports.pendingReports) || 0,
        investigating: Number(reports.investigatingReports) || 0,
        resolved: Number(reports.resolvedReports) || 0,
        dismissed: Number(reports.dismissedReports) || 0
      },
      content: {
        categories: Number(categoryCount?.[0]?.count) || 0,
        subcategories: Number(subcategoryCount?.[0]?.count) || 0,
        activeBanners: Number(bannerCount?.[0]?.count) || 0
      },
      topCategories: Array.isArray(topCategories) ? topCategories : []
    };
  }

  static async listAllListings(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: number;
    isFeatured?: boolean;
  }) {
    const page = Math.max(1, Math.floor(Number(filters.page) || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(Number(filters.limit) || 20)));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*,
             u.full_name as sellerName, u.email as sellerEmail, u.phone_number as sellerPhone,
             c.name_bn as categoryNameBn, c.name_en as categoryNameEn,
             d.name_bn as districtNameBn, d.name_en as districtNameEn
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      INNER JOIN locations_districts d ON p.district_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR u.full_name LIKE ? OR p.contact_phone LIKE ?)`;
      const searchVal = String(filters.search);
      const term = `%${searchVal}%`;
      params.push(term, term, term, term);
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending' || filters.status === 'approved' || filters.status === 'rejected' || filters.status === 'draft') {
        sql += ` AND p.moderation_status = ? AND p.deleted_at IS NULL`;
        params.push(filters.status);
      } else if (filters.status === 'sold' || filters.status === 'available' || filters.status === 'reserved') {
        sql += ` AND p.availability_status = ? AND p.deleted_at IS NULL`;
        params.push(filters.status);
      } else if (filters.status === 'archived' || filters.status === 'removed') {
        sql += ` AND (p.availability_status = 'archived' OR p.deleted_at IS NOT NULL)`;
      }
    }

    if (filters.categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(filters.categoryId);
    }

    if (filters.isFeatured !== undefined) {
      sql += ` AND p.is_featured = ?`;
      params.push(filters.isFeatured ? 1 : 0);
    }

    // Count Query
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
    const countRows = await query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows?.[0]?.total) || 0;

    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await query<RowDataPacket[]>(sql, params);

    // Fetch primary images for these listings
    const productIds = rows.map(r => r.id);
    const imagesMap: Record<number, any[]> = {};
    if (productIds.length > 0) {
      const images = await query<RowDataPacket[]>(
        `SELECT product_id, image_url, thumbnail_url, is_primary
         FROM product_images
         WHERE product_id IN (${productIds.map(() => '?').join(',')})
         ORDER BY sort_order ASC`,
        productIds
      );
      for (const img of images) {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
        imagesMap[img.product_id].push({
          imageUrl: img.image_url,
          thumbnailUrl: img.thumbnail_url,
          isPrimary: Boolean(img.is_primary)
        });
      }
    }

    const items = rows.map(r => ({
      id: r.id,
      uuid: r.uuid,
      sellerId: r.seller_id,
      seller: {
        id: r.seller_id,
        fullName: r.sellerName,
        email: r.sellerEmail,
        phoneNumber: r.sellerPhone
      },
      title: r.title,
      slug: r.slug,
      description: r.description,
      categoryId: r.category_id,
      categoryNameBn: r.categoryNameBn,
      categoryNameEn: r.categoryNameEn,
      districtNameBn: r.districtNameBn,
      districtNameEn: r.districtNameEn,
      priceBdt: Number(r.price_bdt),
      condition: r.condition,
      moderationStatus: r.moderation_status,
      rejectReason: r.reject_reason,
      availabilityStatus: r.availability_status,
      viewsCount: r.views_count,
      isFeatured: Boolean(r.is_featured),
      contactPhone: r.contact_phone,
      deletedAt: r.deleted_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      images: imagesMap[r.id] || []
    }));

    return { items, total };
  }

  static async toggleFeatured(productId: number, isFeatured: boolean) {
    const featuredUntil = isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
    await query(
      `UPDATE products
       SET is_featured = ?, featured_until = ?
       WHERE id = ?`,
      [isFeatured ? 1 : 0, featuredUntil, productId]
    );
  }

  static async removeListing(productId: number, reviewerId: number, reason?: string) {
    await query(
      `UPDATE products
       SET deleted_at = NOW(),
           availability_status = 'archived',
           reviewed_by = ?,
           reject_reason = COALESCE(?, reject_reason)
       WHERE id = ?`,
      [reviewerId, reason || 'Administrative removal / violation', productId]
    );
  }

  static async getBanners(adminMode: boolean = false) {
    let sql = `
      SELECT id, title, image_url as imageUrl, target_url as targetUrl,
             placement, is_active as isActive, start_at as startAt,
             end_at as endAt, sort_order as sortOrder, created_at as createdAt
      FROM banners
    `;
    if (!adminMode) {
      sql += ` WHERE is_active = TRUE AND (start_at IS NULL OR start_at <= NOW()) AND (end_at IS NULL OR end_at >= NOW())`;
    }
    sql += ` ORDER BY sort_order ASC, created_at DESC`;
    return await query<RowDataPacket[]>(sql);
  }

  static async createBanner(data: {
    title: string;
    imageUrl: string;
    targetUrl?: string;
    placement?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const res = await query<ResultSetHeader>(
      `INSERT INTO banners (title, image_url, target_url, placement, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.imageUrl,
        data.targetUrl || null,
        data.placement || 'home_hero',
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
        data.sortOrder || 0
      ]
    );
    return res.insertId;
  }

  static async updateBanner(id: number, data: {
    title?: string;
    imageUrl?: string;
    targetUrl?: string;
    placement?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    await query(
      `UPDATE banners
       SET title = COALESCE(?, title),
           image_url = COALESCE(?, image_url),
           target_url = COALESCE(?, target_url),
           placement = COALESCE(?, placement),
           is_active = COALESCE(?, is_active),
           sort_order = COALESCE(?, sort_order)
       WHERE id = ?`,
      [
        data.title ?? null,
        data.imageUrl ?? null,
        data.targetUrl ?? null,
        data.placement ?? null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
        data.sortOrder ?? null,
        id
      ]
    );
  }

  static async deleteBanner(id: number) {
    await query(`DELETE FROM banners WHERE id = ?`, [id]);
  }

  static async getAuditLogs(page: number = 1, limit: number = 20, action?: string, entityType?: string) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));
    const offset = (safePage - 1) * safeLimit;
    let sql = `
      SELECT a.*, u.full_name as userName, u.email as userEmail
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }
    if (entityType) {
      sql += ` AND a.entity_type = ?`;
      params.push(entityType);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
    const countRows = await query<RowDataPacket[]>(countSql, params);

    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const logs = await query<RowDataPacket[]>(sql, params);

    return {
      logs: logs.map(l => ({
        id: l.id,
        userId: l.user_id,
        userName: l.userName,
        userEmail: l.userEmail,
        userRole: l.user_role,
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        ipAddress: l.ip_address,
        userAgent: l.user_agent,
        newValues: typeof l.new_values === 'string' ? JSON.parse(l.new_values) : l.new_values,
        oldValues: typeof l.old_values === 'string' ? JSON.parse(l.old_values) : l.old_values,
        createdAt: l.created_at
      })),
      total: Number(countRows?.[0]?.total) || 0
    };
  }

  static async getSettings(isPublicOnly: boolean = false) {
    const sql = isPublicOnly 
      ? `SELECT \`key\`, \`value\` FROM settings WHERE is_public = TRUE`
      : `SELECT \`key\`, \`value\`, description, is_public FROM settings`;
    const rows = await query<RowDataPacket[]>(sql);
    const map: Record<string, string> = {
      site_name_bn: 'বিক্রয়বিডি (BikroyBD)',
      site_name_en: 'BikroyBD Marketplace',
      support_phone: '01700000000',
      support_email: 'support@bikroybd.com',
      currency_symbol: '৳',
      require_ad_approval: 'true',
      max_images_per_ad: '5',
      emergency_notice_bn: 'সতর্কবার্তা: পণ্য স্বচক্ষে যাচাই করে সরাসরি মূল্য পরিশোধ করুন।',
      emergency_notice_en: 'Notice: Always inspect products in person before direct cash payment.',
      emergency_notice_active: 'true'
    };
    for (const r of rows) {
      map[r.key] = r.value;
    }
    return map;
  }

  static async updateSetting(key: string, value: string, updaterId: number) {
    await query(
      `INSERT INTO settings (\`key\`, \`value\`, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_by = VALUES(updated_by)`,
      [key, value, updaterId]
    );
  }
}
