import { Router, Request, Response } from 'express';
import { ProductModel } from '../../models/product.model';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { sendSuccess, sendError } from '../../utils/apiResponse';

const router = Router();

// GET /api/v1/seller/listings - Current authenticated seller's ads
router.get('/listings', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
    const listings = await ProductModel.getSellerListings(req.user.id);
    return sendSuccess(res, listings);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// POST /api/v1/seller/products/:id/submit - Submit draft for approval
router.post('/products/:id/submit', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
    const productId = parseInt(req.params.id, 10);
    const success = await ProductModel.submitDraftForApproval(productId, req.user.id);
    if (!success) {
      return sendError(res, 'BAD_REQUEST', 'ড্রাফট বিজ্ঞাপনটি জমা দেওয়া যায়নি / Could not submit draft', 400);
    }
    return sendSuccess(res, null, 'বিজ্ঞাপনটি অনুমোদনের জন্য জমা দেওয়া হয়েছে');
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

// POST /api/v1/seller/contacts/track - Public inquiry telemetry
router.post('/contacts/track', async (req: Request, res: Response) => {
  try {
    const { productId, sellerId, channel } = req.body;
    if (!productId || !sellerId || !channel) {
      return sendError(res, 'BAD_REQUEST', 'Missing required telemetry parameters', 400);
    }

    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    await ProductModel.trackContact({
      productId: Number(productId),
      sellerId: Number(sellerId),
      buyerId: null,
      channel: channel === 'whatsapp_click' ? 'whatsapp_click' : 'phone_reveal',
      ipAddress
    });

    return sendSuccess(res, null, 'Contact tracked');
  } catch (err: any) {
    // Non-blocking telemetry
    return sendSuccess(res, null);
  }
});

// GET /api/v1/seller/:id - Public seller profile & approved listings
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id, 10);
    if (isNaN(sellerId)) {
      return sendError(res, 'BAD_REQUEST', 'Invalid seller ID', 400);
    }

    const data = await ProductModel.getPublicSellerProfile(sellerId);
    if (!data) {
      return sendError(res, 'NOT_FOUND', 'বিক্রেতার প্রোফাইল পাওয়া যায়নি / Seller not found', 404);
    }

    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

export default router;
