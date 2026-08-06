import { Router } from 'express';
import { PlanController } from '@/modules/plans/plans.controller';
import {
  createPlanSchema,
  updatePlanSchema,
  listPlansSchema,
  planIdSchema,
} from '@/modules/plans/plans.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate, requireGym);

router.get(
  '/',
  requirePermission(Permission.PLAN_READ),
  validate(listPlansSchema),
  asyncHandler(PlanController.list),
);

router.get(
  '/:id',
  requirePermission(Permission.PLAN_READ),
  validate(planIdSchema),
  asyncHandler(PlanController.getById),
);

router.post(
  '/',
  requirePermission(Permission.PLAN_CREATE),
  validate(createPlanSchema),
  asyncHandler(PlanController.create),
);

router.patch(
  '/:id',
  requirePermission(Permission.PLAN_UPDATE),
  validate(updatePlanSchema),
  asyncHandler(PlanController.update),
);

router.post(
  '/:id/activate',
  requirePermission(Permission.PLAN_UPDATE),
  validate(planIdSchema),
  asyncHandler(PlanController.activate),
);

router.post(
  '/:id/deactivate',
  requirePermission(Permission.PLAN_UPDATE),
  validate(planIdSchema),
  asyncHandler(PlanController.deactivate),
);

router.delete(
  '/:id',
  requirePermission(Permission.PLAN_DELETE),
  validate(planIdSchema),
  asyncHandler(PlanController.remove),
);

export default router;
