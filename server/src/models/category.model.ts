import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class CategoryModel {
  static async listAll(includeInactive: boolean = false) {
    let catSql = `
      SELECT id, name_bn as nameBn, name_en as nameEn, slug, icon_name as iconName,
             description_bn as descriptionBn, description_en as descriptionEn,
             sort_order as sortOrder, is_active as isActive, created_at as createdAt
      FROM categories
    `;
    if (!includeInactive) {
      catSql += ` WHERE is_active = TRUE`;
    }
    catSql += ` ORDER BY sort_order ASC, id ASC`;
    const categories = await query<RowDataPacket[]>(catSql);

    let subSql = `
      SELECT id, category_id as categoryId, name_bn as nameBn, name_en as nameEn,
             slug, sort_order as sortOrder, is_active as isActive, created_at as createdAt
      FROM subcategories
    `;
    if (!includeInactive) {
      subSql += ` WHERE is_active = TRUE`;
    }
    subSql += ` ORDER BY sort_order ASC, id ASC`;
    const subcategories = await query<RowDataPacket[]>(subSql);

    return categories.map(cat => ({
      ...cat,
      isActive: Boolean(cat.isActive),
      subcategories: subcategories
        .filter(sub => sub.categoryId === cat.id)
        .map(s => ({ ...s, isActive: Boolean(s.isActive) }))
    }));
  }

  static async findById(id: number) {
    const rows = await query<RowDataPacket[]>(
      `SELECT id, name_bn as nameBn, name_en as nameEn, slug, icon_name as iconName,
              description_bn as descriptionBn, description_en as descriptionEn,
              sort_order as sortOrder, is_active as isActive
       FROM categories WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async createCategory(data: {
    nameBn: string;
    nameEn: string;
    slug: string;
    iconName: string;
    descriptionBn?: string;
    descriptionEn?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<number> {
    const res = await query<ResultSetHeader>(
      `INSERT INTO categories (name_bn, name_en, slug, icon_name, description_bn, description_en, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nameBn,
        data.nameEn,
        data.slug,
        data.iconName,
        data.descriptionBn || null,
        data.descriptionEn || null,
        data.sortOrder || 0,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1
      ]
    );
    return res.insertId;
  }

  static async updateCategory(id: number, data: {
    nameBn?: string;
    nameEn?: string;
    slug?: string;
    iconName?: string;
    descriptionBn?: string;
    descriptionEn?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<void> {
    await query(
      `UPDATE categories
       SET name_bn = COALESCE(?, name_bn),
           name_en = COALESCE(?, name_en),
           slug = COALESCE(?, slug),
           icon_name = COALESCE(?, icon_name),
           description_bn = COALESCE(?, description_bn),
           description_en = COALESCE(?, description_en),
           sort_order = COALESCE(?, sort_order),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        data.nameBn ?? null,
        data.nameEn ?? null,
        data.slug ?? null,
        data.iconName ?? null,
        data.descriptionBn ?? null,
        data.descriptionEn ?? null,
        data.sortOrder ?? null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
        id
      ]
    );
  }

  static async deleteCategory(id: number): Promise<void> {
    // Check if category has active products
    const countRows = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL`,
      [id]
    );
    const count = Number(countRows?.[0]?.count) || 0;
    if (count > 0) {
      // Soft-deactivate if products exist
      await query(`UPDATE categories SET is_active = FALSE WHERE id = ?`, [id]);
    } else {
      await query(`DELETE FROM categories WHERE id = ?`, [id]);
    }
  }

  static async createSubcategory(data: {
    categoryId: number;
    nameBn: string;
    nameEn: string;
    slug: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<number> {
    const res = await query<ResultSetHeader>(
      `INSERT INTO subcategories (category_id, name_bn, name_en, slug, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.categoryId,
        data.nameBn,
        data.nameEn,
        data.slug,
        data.sortOrder || 0,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1
      ]
    );
    return res.insertId;
  }

  static async updateSubcategory(id: number, data: {
    nameBn?: string;
    nameEn?: string;
    slug?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<void> {
    await query(
      `UPDATE subcategories
       SET name_bn = COALESCE(?, name_bn),
           name_en = COALESCE(?, name_en),
           slug = COALESCE(?, slug),
           sort_order = COALESCE(?, sort_order),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        data.nameBn ?? null,
        data.nameEn ?? null,
        data.slug ?? null,
        data.sortOrder ?? null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
        id
      ]
    );
  }

  static async deleteSubcategory(id: number): Promise<void> {
    const countRows = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM products WHERE subcategory_id = ? AND deleted_at IS NULL`,
      [id]
    );
    const count = Number(countRows?.[0]?.count) || 0;
    if (count > 0) {
      await query(`UPDATE subcategories SET is_active = FALSE WHERE id = ?`, [id]);
    } else {
      await query(`DELETE FROM subcategories WHERE id = ?`, [id]);
    }
  }
}
