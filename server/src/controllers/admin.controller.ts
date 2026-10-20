import { Response } from 'express';
import { AdminModel } from '../models/admin.model';
import { UserModel } from '../models/user.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';

function isValidPositiveInt(val: string | undefined): number | null {
  if (!val || !/^\d+$/.test(String(val).trim())) return null;
  const num = parseInt(String(val).trim(), 10);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

function isSafeUrl(url: string | undefined): boolean {
  if (!url) return true;
  const trimmed = String(url).trim();
  if (/^(?:javascript|vbscript|data:text\/html)/i.test(trimmed)) return false;
  return /^(https?:\/\/|\/|data:image\/(webp|jpeg|jpg|png);base64,)/i.test(trimmed);
}

export class AdminController {
  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await AdminModel.getStats();
      return sendSuccess(res, stats);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20)) : 20;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await UserModel.listUsers(page, limit, search, role, status);
      return sendSuccess(res, result.users, undefined, {
        page,
        limit,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit))
      });
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getUserDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = isValidPositiveInt(req.params.id);
      if (!userId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ইউজার আইডি / Invalid user ID', 400);
      }

      const details = await UserModel.getUserDetails(userId);
      if (!details) {
        return sendError(res, 'NOT_FOUND', 'ব্যবহারকারী পাওয়া যায়নি', 404);
      }
      return sendSuccess(res, details);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async suspendUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = isValidPositiveInt(req.params.id);
      if (!userId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ইউজার আইডি / Invalid user ID', 400);
      }

      const { isSuspended, reason } = req.body;

      if (req.user && req.user.id === userId && isSuspended) {
        return sendError(res, 'BAD_REQUEST', 'আপনি নিজের একাউন্ট স্থগিত করতে পারবেন না / Cannot suspend own account', 400);
      }

      await UserModel.setSuspension(userId, Boolean(isSuspended), reason);
      return sendSuccess(
        res,
        { userId, isSuspended: Boolean(isSuspended) },
        isSuspended ? 'একাউন্টটি স্থগিত করা হয়েছে' : 'একাউন্ট পুনরায় সক্রিয় করা হয়েছে'
      );
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);

      // Enforce: ONLY Super Admin can manage roles
      if (!req.user.roles.includes('super_admin')) {
        return sendError(res, 'FORBIDDEN', 'শুধুমাত্র সুপার অ্যাডমিন রোল পরিবর্তন করতে পারেন / Only Super Admin can change roles', 403);
      }

      const userId = isValidPositiveInt(req.params.id);
      if (!userId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ইউজার আইডি / Invalid user ID', 400);
      }

      const { role } = req.body;

      // Prevent self-role modification / privilege escalation
      if (req.user.id === userId) {
        return sendError(res, 'BAD_REQUEST', 'আপনি নিজের রোল পরিবর্তন করতে পারবেন না / Cannot alter your own administrative role', 400);
      }

      if (!['user', 'moderator', 'admin', 'super_admin'].includes(role)) {
        return sendError(res, 'BAD_REQUEST', 'অননুমোদিত রোল স্পেসিফিকেশন / Invalid role specified', 400);
      }

      await UserModel.updateUserRole(userId, role);
      return sendSuccess(res, { userId, role }, 'ব্যবহারকারীর রোল সফলভাবে পরিবর্তিত হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async listAllListings(req: AuthenticatedRequest, res: Response) {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20)) : 20;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
      const isFeatured = req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined;

      const result = await AdminModel.listAllListings({
        page,
        limit,
        search,
        status,
        categoryId,
        isFeatured
      });

      return sendSuccess(res, result.items, undefined, {
        page,
        limit,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit))
      });
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async toggleFeatured(req: AuthenticatedRequest, res: Response) {
    try {
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const { isFeatured } = req.body;

      await AdminModel.toggleFeatured(productId, Boolean(isFeatured));
      return sendSuccess(
        res,
        { productId, isFeatured: Boolean(isFeatured) },
        isFeatured ? 'বিজ্ঞাপনটি ফিচার্ড করা হয়েছে' : 'ফিচার্ড স্ট্যাটাস প্রত্যাহার করা হয়েছে'
      );
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async removeListing(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const { reason } = req.body;

      await AdminModel.removeListing(productId, req.user.id, reason);
      return sendSuccess(res, { productId }, 'বিজ্ঞাপনটি সফলভাবে সরিয়ে নেওয়া হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async listBanners(req: AuthenticatedRequest, res: Response) {
    try {
      const adminMode = Boolean(req.user && (req.user.roles.includes('admin') || req.user.roles.includes('super_admin')));
      const banners = await AdminModel.getBanners(adminMode);
      return sendSuccess(res, banners);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async createBanner(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, imageUrl, targetUrl, placement, isActive, sortOrder } = req.body;
      if (!title || !imageUrl) {
        return sendError(res, 'BAD_REQUEST', 'ব্যানারের শিরোনাম এবং ছবির লিঙ্ক আবশ্যক', 400);
      }

      if (!isSafeUrl(imageUrl) || !isSafeUrl(targetUrl)) {
        return sendError(res, 'BAD_REQUEST', 'অবৈধ ব্যানার লিঙ্ক / Unsafe banner URL', 400);
      }

      const id = await AdminModel.createBanner({
        title,
        imageUrl,
        targetUrl,
        placement,
        isActive,
        sortOrder
      });

      return sendSuccess(res, { id }, 'নতুন ব্যানার সফলভাবে সংরক্ষিত হয়েছে', undefined, 201);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async updateBanner(req: AuthenticatedRequest, res: Response) {
    try {
      const id = isValidPositiveInt(req.params.id);
      if (!id) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ব্যানার আইডি / Invalid banner ID', 400);
      }

      if (!isSafeUrl(req.body.imageUrl) || !isSafeUrl(req.body.targetUrl)) {
        return sendError(res, 'BAD_REQUEST', 'অবৈধ ব্যানার লিঙ্ক / Unsafe banner URL', 400);
      }

      await AdminModel.updateBanner(id, req.body);
      return sendSuccess(res, { id }, 'ব্যানার তথ্য আপডেট হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async deleteBanner(req: AuthenticatedRequest, res: Response) {
    try {
      const id = isValidPositiveInt(req.params.id);
      if (!id) {
        return sendError(res, 'INVALID_ID', 'অবৈধ ব্যানার আইডি / Invalid banner ID', 400);
      }

      await AdminModel.deleteBanner(id);
      return sendSuccess(res, { id }, 'ব্যানার সফলভাবে মুছে ফেলা হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20)) : 20;
      const action = req.query.action as string | undefined;
      const entityType = req.query.entityType as string | undefined;

      const result = await AdminModel.getAuditLogs(page, limit, action, entityType);
      return sendSuccess(res, result.logs, undefined, {
        page,
        limit,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit))
      });
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await AdminModel.getSettings(false);
      return sendSuccess(res, settings);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getPublicSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await AdminModel.getSettings(true);
      return sendSuccess(res, settings);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);

      // Enforce: Restrict critical system settings strictly to Super Admin
      if (!req.user.roles.includes('super_admin')) {
        return sendError(res, 'FORBIDDEN', 'শুধুমাত্র সুপার অ্যাডমিন সিস্টেম সেটিংস পরিবর্তন করতে পারেন / Only Super Admin can modify system settings', 403);
      }

      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return sendError(res, 'BAD_REQUEST', 'অবৈধ সেটিংস প্যারামিটার / Invalid settings payload', 400);
      }

      for (const [k, v] of Object.entries(settings)) {
        await AdminModel.updateSetting(k, String(v), req.user.id);
      }

      return sendSuccess(res, null, 'সিস্টেম সেটিংস সফলভাবে সংরক্ষিত হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
