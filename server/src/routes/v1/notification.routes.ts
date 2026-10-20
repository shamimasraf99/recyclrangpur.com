import { Router, Response } from 'express';
import { NotificationModel } from '../../models/notification.model';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { sendSuccess, sendError } from '../../utils/apiResponse';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
    const notifications = await NotificationModel.getUserNotifications(req.user.id);
    const unreadCount = await NotificationModel.getUnreadCount(req.user.id);
    return sendSuccess(res, { notifications, unreadCount });
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
    const notifId = parseInt(req.params.id, 10);
    await NotificationModel.markAsRead(notifId, req.user.id);
    return sendSuccess(res, null, 'Notification marked as read');
  } catch (err: any) {
    return sendError(res, 'SERVER_ERROR', err.message, 500);
  }
});

export default router;
