import crypto from 'crypto';
import { query, withTransaction } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface DbUser extends RowDataPacket {
  id: number;
  uuid: string;
  full_name: string;
  email: string;
  phone_number: string;
  password_hash: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  preferred_language: 'bn' | 'en';
  role_names?: string;
  permission_codes?: string;
  created_at: Date;
}

export class UserModel {
  static async findByEmailOrPhone(identifier: string): Promise<DbUser | null> {
    const rows = await query<DbUser[]>(
      `SELECT u.*,
              GROUP_CONCAT(DISTINCT r.name) as role_names,
              GROUP_CONCAT(DISTINCT p.code) as permission_codes
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE (u.email = ? OR u.phone_number = ?) AND u.deleted_at IS NULL
       GROUP BY u.id
       LIMIT 1`,
      [identifier, identifier]
    );
    return rows[0] || null;
  }

  static async findById(id: number): Promise<DbUser | null> {
    const rows = await query<DbUser[]>(
      `SELECT u.id, u.uuid, u.full_name, u.email, u.phone_number, u.avatar_url, u.bio,
              u.is_verified, u.is_suspended, u.suspended_reason, u.division_id, u.district_id, u.preferred_language,
              u.created_at, u.updated_at,
              GROUP_CONCAT(DISTINCT r.name) as role_names,
              GROUP_CONCAT(DISTINCT p.code) as permission_codes
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       GROUP BY u.id
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    passwordHash: string;
    preferredLanguage?: 'bn' | 'en';
  }): Promise<number> {
    return await withTransaction(async (conn) => {
      const userUuid = crypto.randomUUID();
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO users (uuid, full_name, email, phone_number, password_hash, preferred_language)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userUuid,
          data.fullName,
          data.email,
          data.phoneNumber,
          data.passwordHash,
          data.preferredLanguage || 'bn'
        ]
      );

      const userId = result.insertId;

      // Assign default 'user' role (role_id = 2)
      await conn.execute(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT ?, id FROM roles WHERE name = 'user' LIMIT 1`,
        [userId]
      );

      return userId;
    });
  }

  static async updateProfile(
    userId: number,
    data: { fullName?: string; bio?: string; divisionId?: number; districtId?: number; preferredLanguage?: 'bn' | 'en' }
  ): Promise<void> {
    await query(
      `UPDATE users
       SET full_name = COALESCE(?, full_name),
           bio = COALESCE(?, bio),
           division_id = COALESCE(?, division_id),
           district_id = COALESCE(?, district_id),
           preferred_language = COALESCE(?, preferred_language)
       WHERE id = ?`,
      [data.fullName ?? null, data.bio ?? null, data.divisionId ?? null, data.districtId ?? null, data.preferredLanguage ?? null, userId]
    );
  }

  static async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);
  }

  static async setSuspension(userId: number, isSuspended: boolean, reason?: string): Promise<void> {
    await query(
      `UPDATE users
       SET is_suspended = ?,
           suspended_reason = ?,
           suspended_at = ?
       WHERE id = ?`,
      [isSuspended, isSuspended ? (reason || 'Admin action') : null, isSuspended ? new Date() : null, userId]
    );
  }

  static async updateUserRole(userId: number, roleName: string): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);
      await conn.execute(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT ?, id FROM roles WHERE name = ? LIMIT 1`,
        [userId, roleName]
      );
    });
  }

  static async listUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
    status?: string
  ) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));
    const offset = (safePage - 1) * safeLimit;
    let sql = `
      SELECT u.id, u.uuid, u.full_name as fullName, u.email, u.phone_number as phoneNumber,
             u.avatar_url as avatarUrl, u.bio, u.is_verified as isVerified,
             u.is_suspended as isSuspended, u.suspended_reason as suspendedReason,
             u.suspended_at as suspendedAt, u.created_at as createdAt,
             GROUP_CONCAT(DISTINCT r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status === 'suspended') {
      sql += ` AND u.is_suspended = 1`;
    } else if (status === 'active') {
      sql += ` AND u.is_suspended = 0`;
    }

    sql += ` GROUP BY u.id`;

    if (role && role !== 'all') {
      sql += ` HAVING FIND_IN_SET(?, roles)`;
      params.push(role);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
    const countRows = await query<RowDataPacket[]>(countSql, params);

    sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const rows = await query<RowDataPacket[]>(sql, params);

    return {
      users: rows.map(r => ({
        ...r,
        isVerified: Boolean(r.isVerified),
        isSuspended: Boolean(r.isSuspended),
        roles: r.roles ? r.roles.split(',') : ['user']
      })),
      total: Number(countRows?.[0]?.total) || 0
    };
  }

  static async getUserDetails(id: number) {
    const user = await this.findById(id);
    if (!user) return null;

    const listingStats = await query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as totalListings,
        SUM(CASE WHEN moderation_status = 'approved' AND availability_status = 'available' AND deleted_at IS NULL THEN 1 ELSE 0 END) as activeListings,
        SUM(CASE WHEN availability_status = 'sold' THEN 1 ELSE 0 END) as soldListings
       FROM products WHERE seller_id = ?`,
      [id]
    );

    const reportCount = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM reports WHERE reported_user_id = ?`,
      [id]
    );

    const stats = listingStats?.[0] || {};

    return {
      id: user.id,
      uuid: user.uuid,
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      isVerified: Boolean(user.is_verified),
      isSuspended: Boolean(user.is_suspended),
      suspendedReason: (user as any).suspended_reason || null,
      divisionId: user.division_id,
      districtId: user.district_id,
      preferredLanguage: user.preferred_language,
      roles: user.role_names ? user.role_names.split(',') : ['user'],
      permissions: user.permission_codes ? user.permission_codes.split(',') : [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      stats: {
        totalListings: Number(stats.totalListings) || 0,
        activeListings: Number(stats.activeListings) || 0,
        soldListings: Number(stats.soldListings) || 0,
        reportsReceived: Number(reportCount?.[0]?.count) || 0
      }
    };
  }
}
