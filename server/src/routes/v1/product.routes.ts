import { Router } from 'express';
import { ProductController } from '../../controllers/product.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { apiLimiter } from '../../middleware/rateLimiter';
import {
  createProductSchema,
  updateProductSchema,
  updateAvailabilitySchema,
  productQuerySchema
} from '../../../../shared/schemas/product.schema';

const router = Router();

// Public Discovery Endpoints (Strictly approved & available items in search; owner/staff check on detail)
router.get('/', apiLimiter, validate(productQuerySchema, 'query'), ProductController.getProducts);
router.get('/:id', apiLimiter, optionalAuthenticate, ProductController.getProductById);

// Protected Seller Endpoints
router.post(
  '/',
  authenticate,
  requirePermission('listings:create'),
  validate(createProductSchema),
  ProductController.createProduct
);

router.put(
  '/:id',
  authenticate,
  validate(updateProductSchema),
  ProductController.updateProduct
);

router.patch(
  '/:id/status',
  authenticate,
  validate(updateAvailabilitySchema),
  ProductController.updateStatus
);

router.delete(
  '/:id',
  authenticate,
  ProductController.deleteProduct
);

export default router;
