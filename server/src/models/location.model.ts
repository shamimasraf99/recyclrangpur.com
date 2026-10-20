import { query } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

export class LocationModel {
  static async listDivisions() {
    return await query<RowDataPacket[]>(
      `SELECT id, name_bn as nameBn, name_en as nameEn, slug, sort_order as sortOrder
       FROM locations_divisions
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
    );
  }

  static async listDistricts(divisionId?: number) {
    let sql = `
      SELECT id, division_id as divisionId, name_bn as nameBn, name_en as nameEn, slug, sort_order as sortOrder
      FROM locations_districts
      WHERE is_active = TRUE
    `;
    const params: any[] = [];
    if (divisionId) {
      sql += ` AND division_id = ?`;
      params.push(divisionId);
    }
    sql += ` ORDER BY sort_order ASC`;
    return await query<RowDataPacket[]>(sql, params);
  }

  static async listUpazilas(districtId: number) {
    return await query<RowDataPacket[]>(
      `SELECT id, district_id as districtId, name_bn as nameBn, name_en as nameEn, slug
       FROM locations_upazilas
       WHERE district_id = ? AND is_active = TRUE
       ORDER BY sort_order ASC`,
      [districtId]
    );
  }
}
