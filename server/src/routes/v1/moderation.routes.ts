import { Router } from 'express';
import { ModerationController } from '../../controllers/moderation.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();
router.use(authenticate);

// Listing Moderation Queue & Decision Endpoints
router.get(
  '/queue',
  requirePermission('listings:moderate'),
  ModerationController.getQueue
);

router.post(
  '/:id/approve',
  requirePermission('listings:moderate'),
  auditLog('product:approved', 'product'),
  ModerationController.approveProduct
);

router.post(
  '/:id/reject',
  requirePermission('listings:moderate'),
  auditLog('product:rejected', 'product'),
  ModerationController.rejectProduct
);

// Abuse & Violation Report Queue & Investigation Endpoints
router.get(
  '/reports',
  requirePermission('reports:review'),
  ModerationController.getReports
);

router.post(
  '/reports/:id/investigate',
  requirePermission('reports:review'),
  auditLog('report:investigating', 'report'),
  ModerationController.investigateReport
);

router.post(
  '/reports/:id/resolve',
  requirePermission('reports:review'),
  auditLog('report:resolved', 'report'),
  ModerationController.resolveReport
);

router.post(
  '/reports/:id/dismiss',
  requirePermission('reports:review'),
  auditLog('report:dismissed', 'report'),
  ModerationController.dismissReport
);

export default router;
