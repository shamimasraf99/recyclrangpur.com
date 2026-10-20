import { Response } from 'express';
import { WishlistModel } from '../models/wishlist.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';

function isValidPositiveInt(val: string | undefined): number | null {
  if (!val || !/^\d+$/.test(String(val).trim())) return null;
  const num = parseInt(String(val).trim(), 10);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

export class WishlistController {
  static async getWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const items = await WishlistModel.getUserWishlist(req.user.id);
      return sendSuccess(res, items);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async addWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const productId = isValidPositiveInt(req.params.productId);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      await WishlistModel.add(req.user.id, productId);
      return sendSuccess(res, null, 'পছন্দের তালিকায় যুক্ত করা হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async removeWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const productId = isValidPositiveInt(req.params.productId);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      await WishlistModel.remove(req.user.id, productId);
      return sendSuccess(res, null, 'পছন্দের তালিকা থেকে সরানো হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
