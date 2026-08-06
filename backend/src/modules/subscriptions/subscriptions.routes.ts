import { Router } from 'express';
import { SubscriptionController } from '@/modules/subscriptions/subscriptions.controller';
import {
  listSubscriptionsSchema,
  createManualSubscriptionSchema,
  subscriptionIdSchema,
} from '@/modules/subscriptions/subscriptions.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate);

// Customer: my subscriptions.
router.get(
  '/me',
  requirePermission(Permission.SUBSCRIPTION_READ),
  asyncHandler(SubscriptionController.me),
);

// Owner/staff: manage gym subscriptions.
router.get(
  '/',
  requireGym,
  requirePermission(Permission.SUBSCRIPTION_READ),
  validate(listSubscriptionsSchema),
  asyncHandler(SubscriptionController.list),
);

router.post(
  '/manual',
  requirePermission(Permission.SUBSCRIPTION_MANAGE),
  validate(createManualSubscriptionSchema),
  asyncHandler(SubscriptionController.createManual),
);

router.get(
  '/:id',
  requirePermission(Permission.SUBSCRIPTION_READ),
  validate(subscriptionIdSchema),
  asyncHandler(SubscriptionController.getById),
);

router.post(
  '/:id/cancel',
  requirePermission(Permission.SUBSCRIPTION_MANAGE),
  validate(subscriptionIdSchema),
  asyncHandler(SubscriptionController.cancel),
);

export default router;
