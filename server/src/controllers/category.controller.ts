import { Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';

function isValidPositiveInt(val: string | undefined): number | null {
  if (!val || !/^\d+$/.test(String(val).trim())) return null;
  const num = parseInt(String(val).trim(), 10);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

export class CategoryController {
  static async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const isStaff = Boolean(
        req.user &&
          (req.user.roles.includes('admin') ||
            req.user.roles.includes('super_admin') ||
            req.user.roles.includes('moderator'))
      );
      const includeInactive = req.query.all === 'true' && isStaff;
      const categories = await CategoryModel.listAll(includeInactive);
      return sendSuccess(res, categories);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { nameBn, nameEn, slug, iconName, descriptionBn, descriptionEn, sortOrder, isActive } = req.body;
      if (!nameBn || !nameEn || !slug || !iconName) {
        return sendError(res, 'BAD_REQUEST', 'ক্যাটাগরির বাংলা ও ইংরেজি নাম, স্লাগ এবং আইকন আবশ্যক', 400);
      }

      const id = await CategoryModel.createCategory({
        nameBn: String(nameBn).trim(),
        nameEn: String(nameEn).trim(),
        slug: String(slug).trim().toLowerCase(),
        iconName: String(iconName).trim(),
        descriptionBn: descriptionBn ? String(descriptionBn).trim() : undefined,
        descriptionEn: descriptionEn ? String(descriptionEn).trim() : undefined,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      return sendSuccess(res, { id }, 'নতুন ক্যাটাগরি তৈরি সম্পন্ন হয়েছে', undefined, 201);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = isValidPositiveInt(req.params.id);
      if (!id) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ক্যাটাগরি আইডি / Invalid category ID', 400);
      }

      await CategoryModel.updateCategory(id, req.body);
      return sendSuccess(res, { id }, 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const id = isValidPositiveInt(req.params.id);
      if (!id) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ক্যাটাগরি আইডি / Invalid category ID', 400);
      }

      await CategoryModel.deleteCategory(id);
      return sendSuccess(res, { id }, 'ক্যাটাগরি সফলভাবে মুছে ফেলা/নিষ্ক্রিয় করা হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async createSubcategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryId = isValidPositiveInt(req.params.id);
      if (!categoryId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ক্যাটাগরি আইডি / Invalid category ID', 400);
      }

      const { nameBn, nameEn, slug, sortOrder, isActive } = req.body;

      if (!nameBn || !nameEn || !slug) {
        return sendError(res, 'BAD_REQUEST', 'সাবক্যাটাগরির নাম ও স্লাগ আবশ্যক', 400);
      }

      const subId = await CategoryModel.createSubcategory({
        categoryId,
        nameBn: String(nameBn).trim(),
        nameEn: String(nameEn).trim(),
        slug: String(slug).trim().toLowerCase(),
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      return sendSuccess(res, { id: subId, categoryId }, 'সাবক্যাটাগরি তৈরি সম্পন্ন হয়েছে', undefined, 201);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async updateSubcategory(req: AuthenticatedRequest, res: Response) {
    try {
      const subId = isValidPositiveInt(req.params.subId);
      if (!subId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ সাবক্যাটাগরি আইডি / Invalid subcategory ID', 400);
      }

      await CategoryModel.updateSubcategory(subId, req.body);
      return sendSuccess(res, { id: subId }, 'সাবক্যাটাগরি আপডেট সম্পন্ন হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async deleteSubcategory(req: AuthenticatedRequest, res: Response) {
    try {
      const subId = isValidPositiveInt(req.params.subId);
      if (!subId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ সাবক্যাটাগরি আইডি / Invalid subcategory ID', 400);
      }

      await CategoryModel.deleteSubcategory(subId);
      return sendSuccess(res, { id: subId }, 'সাবক্যাটাগরি মুছে ফেলা সম্পন্ন হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
