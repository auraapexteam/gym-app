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

// Read plans: any authenticated user (customer, unlinked browser, staff, owner) can list or get plans
router.get(
  '/',
  authenticate,
  validate(listPlansSchema),
  asyncHandler(PlanController.list),
);

router.get(
  '/:id',
  authenticate,
  validate(planIdSchema),
  asyncHandler(PlanController.getById),
);

// Management routes: require a gym context and appropriate permissions
router.use(authenticate, requireGym);

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
