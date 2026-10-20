import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class NotificationModel {
  static async create(data: {
    userId: number;
    type: string;
    titleBn: string;
    titleEn: string;
    bodyBn: string;
    bodyEn: string;
    link?: string;
  }): Promise<number> {
    const res = await query<ResultSetHeader>(
      `INSERT INTO notifications (user_id, type, title_bn, title_en, body_bn, body_en, link, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [data.userId, data.type, data.titleBn, data.titleEn, data.bodyBn, data.bodyEn, data.link || null]
    );
    return res.insertId;
  }

  static async getUserNotifications(userId: number) {
    return await query<RowDataPacket[]>(
      `SELECT id, type, title_bn as titleBn, title_en as titleEn, body_bn as bodyBn, body_en as bodyEn, link, is_read as isRead, created_at as createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );
  }

  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const res = await query<ResultSetHeader>(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return res.affectedRows > 0;
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const rows = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return rows[0]?.count || 0;
  }
}
