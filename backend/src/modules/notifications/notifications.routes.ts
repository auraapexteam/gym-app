import { Router } from 'express';
import { NotificationController } from '@/modules/notifications/notifications.controller';
import {
  listNotificationsSchema,
  notificationIdSchema,
} from '@/modules/notifications/notifications.validation';
import { authenticate, validate, asyncHandler } from '@/shared/middleware';

const router = Router();

// Notifications belong to the authenticated recipient — no extra permission needed.
router.use(authenticate);

router.get('/', validate(listNotificationsSchema), asyncHandler(NotificationController.list));
router.get('/unread-count', asyncHandler(NotificationController.unreadCount));
router.post('/read-all', asyncHandler(NotificationController.markAllRead));
router.patch('/:id/read', validate(notificationIdSchema), asyncHandler(NotificationController.markRead));

export default router;
