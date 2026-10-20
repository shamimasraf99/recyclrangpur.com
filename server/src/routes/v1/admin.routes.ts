import { Router } from 'express';
import { AdminController } from '../../controllers/admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission, requireRole } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();
router.use(authenticate);

// 1. Dashboard Overview Statistics
router.get(
  '/stats',
  requireRole('admin', 'super_admin'),
  AdminController.getStats
);

// 2. User Search, Details, Suspension, and Super Admin Role Management
router.get(
  '/users',
  requirePermission('users:view_all'),
  AdminController.listUsers
);

router.get(
  '/users/:id',
  requirePermission('users:view_all'),
  AdminController.getUserDetails
);

router.patch(
  '/users/:id/suspend',
  requirePermission('users:suspend'),
  auditLog('user:suspend_toggled', 'user'),
  AdminController.suspendUser
);

// Critical role modification restricted STRICTLY to Super Admin
router.patch(
  '/users/:id/role',
  requireRole('super_admin'),
  auditLog('user:role_changed', 'user'),
  AdminController.updateUserRole
);

// 3. Marketplace Listings Management (Approval, Feature toggle, Take-down)
router.get(
  '/listings',
  requirePermission('listings:moderate'),
  AdminController.listAllListings
);

router.patch(
  '/listings/:id/featured',
  requirePermission('listings:moderate'),
  auditLog('product:featured_toggled', 'product'),
  AdminController.toggleFeatured
);

router.delete(
  '/listings/:id',
  requirePermission('listings:moderate'),
  auditLog('product:removed', 'product'),
  AdminController.removeListing
);

// 4. Banner Management
router.get(
  '/banners',
  requirePermission('banners:manage'),
  AdminController.listBanners
);

router.post(
  '/banners',
  requirePermission('banners:manage'),
  auditLog('banner:created', 'banner'),
  AdminController.createBanner
);

router.put(
  '/banners/:id',
  requirePermission('banners:manage'),
  auditLog('banner:updated', 'banner'),
  AdminController.updateBanner
);

router.delete(
  '/banners/:id',
  requirePermission('banners:manage'),
  auditLog('banner:deleted', 'banner'),
  AdminController.deleteBanner
);

// 5. System Audit Trail
router.get(
  '/audit-logs',
  requirePermission('audit_logs:view'),
  AdminController.getAuditLogs
);

// 6. System Settings & Contact Info (Restricted to Super Admin for modifications)
router.get(
  '/settings',
  requirePermission('settings:view'),
  AdminController.getSettings
);

router.put(
  '/settings',
  requireRole('super_admin'),
  auditLog('settings:updated', 'settings'),
  AdminController.updateSettings
);

export default router;
