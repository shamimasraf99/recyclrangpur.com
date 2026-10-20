import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class ReportModel {
  static async findActiveDuplicate(data: {
    reporterId: number;
    productId?: number;
    reportedUserId?: number;
  }): Promise<boolean> {
    if (data.productId) {
      const rows = await query<RowDataPacket[]>(
        `SELECT id FROM reports
         WHERE reporter_id = ? AND product_id = ? AND status IN ('pending', 'investigating')
         LIMIT 1`,
        [data.reporterId, data.productId]
      );
      return rows.length > 0;
    }
    if (data.reportedUserId) {
      const rows = await query<RowDataPacket[]>(
        `SELECT id FROM reports
         WHERE reporter_id = ? AND reported_user_id = ? AND status IN ('pending', 'investigating')
         LIMIT 1`,
        [data.reporterId, data.reportedUserId]
      );
      return rows.length > 0;
    }
    return false;
  }

  static async create(data: {
    reporterId: number;
    productId?: number;
    reportedUserId?: number;
    reasonCode: string;
    explanation: string;
  }): Promise<number> {
    const res = await query<ResultSetHeader>(
      `INSERT INTO reports (reporter_id, product_id, reported_user_id, reason_code, explanation, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [data.reporterId, data.productId || null, data.reportedUserId || null, data.reasonCode, data.explanation]
    );
    return res.insertId;
  }

  static async list(status?: string, page: number = 1, limit: number = 25) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 25)));
    const offset = (safePage - 1) * safeLimit;
    let sql = `
      SELECT r.*,
             u.full_name as reporterName, u.email as reporterEmail,
             p.title as productTitle, p.price_bdt as productPrice,
             ru.full_name as reportedUserName, ru.email as reportedUserEmail,
             rev.full_name as reviewerName
      FROM reports r
      INNER JOIN users u ON r.reporter_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN users ru ON r.reported_user_id = ru.id
      LEFT JOIN users rev ON r.reviewer_id = rev.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (status && status !== 'all') {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
    const countRows = await query<RowDataPacket[]>(countSql, params);

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const rows = await query<RowDataPacket[]>(sql, params);
    return {
      reports: rows.map(r => ({
        id: r.id,
        reporterId: r.reporter_id,
        reporterName: r.reporterName,
        reporterEmail: r.reporterEmail,
        productId: r.product_id,
        productTitle: r.productTitle,
        productPrice: r.productPrice ? Number(r.productPrice) : null,
        reportedUserId: r.reported_user_id,
        reportedUserName: r.reportedUserName,
        reportedUserEmail: r.reportedUserEmail,
        reasonCode: r.reason_code,
        explanation: r.explanation,
        status: r.status,
        reviewerId: r.reviewer_id,
        reviewerName: r.reviewerName,
        resolutionNotes: r.resolution_notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      })),
      total: Number(countRows?.[0]?.total) || 0
    };
  }

  static async updateStatus(
    reportId: number,
    reviewerId: number,
    status: 'investigating' | 'resolved' | 'dismissed',
    resolutionNotes?: string
  ) {
    await query(
      `UPDATE reports
       SET status = ?,
           reviewer_id = ?,
           resolution_notes = COALESCE(?, resolution_notes)
       WHERE id = ?`,
      [status, reviewerId, resolutionNotes || null, reportId]
    );
  }

  static async resolve(reportId: number, reviewerId: number, resolutionNotes: string) {
    return this.updateStatus(reportId, reviewerId, 'resolved', resolutionNotes);
  }
}
