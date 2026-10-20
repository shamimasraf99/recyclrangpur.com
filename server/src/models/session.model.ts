import { query } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

export class SessionModel {
  static async createSession(data: {
    userId: number;
    tokenHash: string;
    ipAddress: string;
    userAgent: string | null;
    expiresAt: Date;
  }): Promise<void> {
    await query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [data.userId, data.tokenHash, data.ipAddress, data.userAgent, data.expiresAt]
    );
  }

  static async findSession(tokenHash: string): Promise<RowDataPacket | null> {
    const rows = await query<RowDataPacket[]>(
      `SELECT * FROM user_sessions
       WHERE token_hash = ? AND is_revoked = FALSE AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async findSessionAnyState(tokenHash: string): Promise<RowDataPacket | null> {
    const rows = await query<RowDataPacket[]>(
      `SELECT * FROM user_sessions WHERE token_hash = ? LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async revokeSession(tokenHash: string): Promise<void> {
    await query(
      `UPDATE user_sessions SET is_revoked = TRUE WHERE token_hash = ?`,
      [tokenHash]
    );
  }

  static async revokeAllUserSessions(userId: number): Promise<void> {
    await query(
      `UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = ?`,
      [userId]
    );
  }
}
