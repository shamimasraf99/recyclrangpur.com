import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';

function isValidPositiveInt(val: string | undefined): number | null {
  if (!val || !/^\d+$/.test(String(val).trim())) return null;
  const num = parseInt(String(val).trim(), 10);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

export class ProductController {
  /**
   * GET /api/v1/products - Public Search & Filtering
   * Only approved and available products appear.
   */
  static async getProducts(req: Request, res: Response) {
    try {
      const result = await ProductModel.searchPublicProducts(req.query as any);
      return sendSuccess(res, result.products, undefined, result.meta);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  /**
   * GET /api/v1/products/:id - Product Detail
   * Enforces moderation visibility rules (draft, pending, rejected, archived are restricted to owner/staff)
   * and redacts contact_phone when hide_phone is enabled.
   */
  static async getProductById(req: AuthenticatedRequest, res: Response) {
    try {
      const rawId = req.params.id?.trim();
      if (!rawId || rawId.length > 240) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product identifier', 400);
      }

      const product = await ProductModel.findById(rawId);
      if (!product) {
        return sendError(res, 'NOT_FOUND', 'বিজ্ঞাপনটি পাওয়া যায়নি / Product not found', 404);
      }

      const isOwner = Boolean(req.user && req.user.id === Number(product.seller_id));
      const isStaff = Boolean(
        req.user &&
          (req.user.roles.includes('moderator') ||
            req.user.roles.includes('admin') ||
            req.user.roles.includes('super_admin'))
      );

      const isPubliclyVisible =
        product.moderation_status === 'approved' && product.availability_status !== 'archived';

      if (!isPubliclyVisible && !isOwner && !isStaff) {
        return sendError(
          res,
          'FORBIDDEN',
          'এই বিজ্ঞাপনটি এখনো সর্বসাধারণের জন্য উন্মুক্ত নয় / Listing is not publicly accessible',
          403
        );
      }

      const sanitizedProduct = { ...product };
      if (Boolean(product.hide_phone) && !isOwner && !isStaff) {
        sanitizedProduct.contact_phone = null;
      }

      return sendSuccess(res, sanitizedProduct);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  /**
   * POST /api/v1/products - Create New Listing (User+)
   */
  static async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);

      const productId = await ProductModel.create({
        ...req.body,
        sellerId: req.user.id
      });

      const product = await ProductModel.findById(productId);
      return sendSuccess(
        res,
        product,
        'বিজ্ঞাপনটি সফলভাবে তৈরি হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমান',
        undefined,
        201
      );
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  /**
   * PUT /api/v1/products/:id - Update Listing (Owner / Admin)
   * Prevents IDOR.
   */
  static async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const isAdmin = req.user.roles.includes('admin') || req.user.roles.includes('super_admin');

      const updated = await ProductModel.update(productId, req.user.id, isAdmin, req.body);
      if (!updated) {
        return sendError(res, 'FORBIDDEN', 'আপনি এই বিজ্ঞাপনটি পরিবর্তন করার অধিকারী নন / Forbidden', 403);
      }

      const product = await ProductModel.findById(productId);
      return sendSuccess(res, product, 'বিজ্ঞাপনটি আপডেট হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  /**
   * PATCH /api/v1/products/:id/status - Update Availability Status (Sold / Reserved / Available / Archived)
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const { availabilityStatus } = req.body;
      if (!['available', 'reserved', 'sold', 'archived'].includes(availabilityStatus)) {
        return sendError(res, 'VALIDATION_ERROR', 'অবৈধ স্ট্যাটাস মান / Invalid availabilityStatus', 422);
      }

      const isAdmin = req.user.roles.includes('admin') || req.user.roles.includes('super_admin');

      const result = await ProductModel.updateAvailability(
        productId,
        req.user.id,
        isAdmin,
        availabilityStatus
      );
      if (!result.success) {
        if (result.error?.includes('Invalid status transition')) {
          return sendError(res, 'INVALID_STATUS_TRANSITION', result.error, 400);
        }
        return sendError(res, 'FORBIDDEN', 'স্ট্যাটাস পরিবর্তন করার অনুমতি নেই / Forbidden', 403);
      }

      return sendSuccess(res, { id: productId, availabilityStatus }, 'স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  /**
   * DELETE /api/v1/products/:id - Soft Delete Listing
   */
  static async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const productId = isValidPositiveInt(req.params.id);
      if (!productId) {
        return sendError(res, 'INVALID_ID', 'অবৈধ বিজ্ঞাপন আইডি / Invalid product ID', 400);
      }

      const isAdmin = req.user.roles.includes('admin') || req.user.roles.includes('super_admin');

      const success = await ProductModel.softDelete(productId, req.user.id, isAdmin);
      if (!success) {
        return sendError(res, 'FORBIDDEN', 'বিজ্ঞাপনটি মুছার অনুমতি নেই / Forbidden', 403);
      }

      return sendSuccess(res, null, 'বিজ্ঞাপনটি সফলভাবে মুছে ফেলা হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  /**
   * GET /api/v1/seller/listings - Current Seller's Ads
   */
  static async getSellerListings(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      const listings = await ProductModel.getSellerListings(req.user.id);
      return sendSuccess(res, listings);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
