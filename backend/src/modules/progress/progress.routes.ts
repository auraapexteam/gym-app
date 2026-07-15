import { Router } from 'express';
import { ProgressController } from '@/modules/progress/progress.controller';
import {
  logWeightSchema,
  logWaterSchema,
  logProteinSchema,
  logImageSchema,
  getMonthSummarySchema,
} from '@/modules/progress/progress.validation';
import { authenticate, requireRole, validate, asyncHandler } from '@/shared/middleware';
import { Role } from '@/shared/rbac';

const router = Router();

// All progress routes require authentication.
router.use(authenticate);

/**
 * Progress data is personal health information that belongs to the customer.
 * Write operations are restricted to the CUSTOMER role — staff, owners, and
 * trainers must not be able to log progress on behalf of a user.
 * The read endpoint (month summary) is also customer-only.
 */
router.get(
  '/month',
  requireRole(Role.CUSTOMER),
  validate(getMonthSummarySchema),
  asyncHandler(ProgressController.getMonthSummary),
);

router.post(
  '/weight',
  requireRole(Role.CUSTOMER),
  validate(logWeightSchema),
  asyncHandler(ProgressController.logWeight),
);

router.post(
  '/water',
  requireRole(Role.CUSTOMER),
  validate(logWaterSchema),
  asyncHandler(ProgressController.logWater),
);

router.post(
  '/protein',
  requireRole(Role.CUSTOMER),
  validate(logProteinSchema),
  asyncHandler(ProgressController.logProtein),
);

router.post(
  '/image',
  requireRole(Role.CUSTOMER),
  validate(logImageSchema),
  asyncHandler(ProgressController.logImage),
);

export default router;
