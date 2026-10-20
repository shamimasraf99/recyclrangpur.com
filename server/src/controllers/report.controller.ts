import { Response } from 'express';
import { ReportModel } from '../models/report.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';

export class ReportController {
  static async createReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const { productId, reportedUserId, reasonCode, explanation } = req.body;

      if (reportedUserId && Number(reportedUserId) === req.user.id) {
        return sendError(res, 'BAD_REQUEST', 'আপনি নিজের বিরুদ্ধে অভিযোগ করতে পারবেন না / Cannot report yourself', 400);
      }

      // Prevent duplicate pending/investigating reports from the same user on the same target
      const isDuplicate = await ReportModel.findActiveDuplicate({
        reporterId: req.user.id,
        productId: productId ? Number(productId) : undefined,
        reportedUserId: reportedUserId ? Number(reportedUserId) : undefined
      });

      if (isDuplicate) {
        return sendError(
          res,
          'DUPLICATE_REPORT',
          'এই বিষয়ে আপনার একটি অভিযোগ ইতিমধ্যে পর্যালোচনার অধীনে রয়েছে / Duplicate active report exists',
          409
        );
      }

      const id = await ReportModel.create({
        reporterId: req.user.id,
        productId: productId ? Number(productId) : undefined,
        reportedUserId: reportedUserId ? Number(reportedUserId) : undefined,
        reasonCode,
        explanation
      });

      return sendSuccess(
        res,
        { id },
        'অভিযোগ সফলভাবে গ্রহণ করা হয়েছে। মডারেশন টিম শীঘ্রই যাচাই করবে।',
        undefined,
        201
      );
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
