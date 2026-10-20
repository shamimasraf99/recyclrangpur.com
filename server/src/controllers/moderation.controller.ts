import { Response } from 'express';
import { ProductModel } from '../models/product.model';
import { ReportModel } from '../models/report.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';

function isValidPositiveInt(val: string | undefined): number | null {
  if (!val || !/^\d+$/.test(String(val).trim())) return null;
  const num = parseInt(String(val).trim(), 10);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

export class ModerationController {
  static async getQueue(req: AuthenticatedRequest, res: Response) {
    try {
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20)) : 20;

      const result = await ProductModel.getModerationQueue(page, limit);
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

  static async approveProduct(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const success = await ProductModel.setModerationStatus(productId, req.user.id, 'approved');
      if (!success) {
        return sendError(res, 'NOT_FOUND', 'বিজ্ঞাপনটি পাওয়া যায়নি', 404);
      }

      return sendSuccess(res, { id: productId, moderationStatus: 'approved' }, 'বিজ্ঞাপনটি সফলভাবে অনুমোদিত হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async rejectProduct(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const { rejectReason } = req.body;

      if (!rejectReason || !String(rejectReason).trim()) {
        return sendError(res, 'BAD_REQUEST', 'প্রত্যাখ্যানের সুনির্দিষ্ট কারণ উল্লেখ করা আবশ্যক', 400);
      }

      const success = await ProductModel.setModerationStatus(productId, req.user.id, 'rejected', String(rejectReason).trim());
      if (!success) {
        return sendError(res, 'NOT_FOUND', 'বিজ্ঞাপনটি পাওয়া যায়নি', 404);
      }

      return sendSuccess(
        res,
        { id: productId, moderationStatus: 'rejected', rejectReason: String(rejectReason).trim() },
        'বিজ্ঞাপনটি প্রত্যাখ্যান করা হয়েছে'
      );
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25)) : 25;

      const result = await ReportModel.list(status, page, limit);
      return sendSuccess(res, result.reports, undefined, {
        page,
        limit,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit))
      });
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async investigateReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);
      const reportId = isValidPositiveInt(req.params.id);
      if (!reportId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ রিপোর্ট আইডি / Invalid report ID', 400);
      }

      const { notes } = req.body;

      await ReportModel.updateStatus(reportId, req.user.id, 'investigating', notes);
      return sendSuccess(res, { id: reportId, status: 'investigating' }, 'রিপোর্টটি তদন্তাধীনে নেওয়া হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async resolveReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);
      const reportId = isValidPositiveInt(req.params.id);
      if (!reportId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ রিপোর্ট আইডি / Invalid report ID', 400);
      }

      const { resolutionNotes } = req.body;

      if (!resolutionNotes || !String(resolutionNotes).trim()) {
        return sendError(res, 'BAD_REQUEST', 'মীমাংসার নোট আবশ্যক', 400);
      }

      await ReportModel.resolve(reportId, req.user.id, String(resolutionNotes).trim());
      return sendSuccess(res, { id: reportId, status: 'resolved' }, 'রিপোর্ট নিষ্পত্তি সম্পন্ন হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async dismissReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Staff auth required', 401);
      const reportId = isValidPositiveInt(req.params.id);
      if (!reportId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ রিপোর্ট আইডি / Invalid report ID', 400);
      }

      const { resolutionNotes } = req.body;

      await ReportModel.updateStatus(reportId, req.user.id, 'dismissed', resolutionNotes || 'Dismissed by moderator');
      return sendSuccess(res, { id: reportId, status: 'dismissed' }, 'রিপোর্টটি খারিজ করা হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
