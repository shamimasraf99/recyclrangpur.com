import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { env } from './env';

export const pool: Pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z', // UTC standard
  supportBigNumbers: true,
  bigNumberStrings: false,
});

/**
 * Execute parameterized query with automatic connection management
 */
export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

/**
 * Transaction helper for multi-table atomic operations
 */
export async function withTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  }
}
