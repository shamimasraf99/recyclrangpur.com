import { Router } from 'express';
import { CategoryController } from '../../controllers/category.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

// Publicly fetch active categories (or all categories if authenticated staff with ?all=true)
router.get('/', optionalAuthenticate, CategoryController.getCategories);

// Protected Admin Category & Subcategory CRUD
router.post(
  '/',
  authenticate,
  requirePermission('categories:manage'),
  auditLog('CATEGORY_CREATE', 'category'),
  CategoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  requirePermission('categories:manage'),
  auditLog('CATEGORY_UPDATE', 'category'),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('categories:manage'),
  auditLog('CATEGORY_DELETE', 'category'),
  CategoryController.deleteCategory
);

router.post(
  '/:id/subcategories',
  authenticate,
  requirePermission('categories:manage'),
  auditLog('SUBCATEGORY_CREATE', 'subcategory'),
  CategoryController.createSubcategory
);

router.put(
  '/subcategories/:subId',
  authenticate,
  requirePermission('categories:manage'),
  auditLog('SUBCATEGORY_UPDATE', 'subcategory'),
  CategoryController.updateSubcategory
);

router.delete(
  '/subcategories/:subId',
  authenticate,
  requirePermission('categories:manage'),
  auditLog('SUBCATEGORY_DELETE', 'subcategory'),
  CategoryController.deleteSubcategory
);

export default router;
