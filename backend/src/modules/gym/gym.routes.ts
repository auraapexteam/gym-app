import { Router } from 'express';
import { GymController } from '@/modules/gym/gym.controller';
import { updateGymSchema, gymIdParamSchema, createStaffSchema, staffIdParamSchema } from '@/modules/gym/gym.validation';
import { authenticate, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate);

router.get('/me', requirePermission(Permission.GYM_READ), asyncHandler(GymController.getMine));

router.patch(
  '/me',
  requirePermission(Permission.GYM_MANAGE),
  validate(updateGymSchema),
  asyncHandler(GymController.updateMine),
);

// Staff management routes
router.get(
  '/me/staff',
  requirePermission(Permission.STAFF_MANAGE),
  asyncHandler(GymController.listStaff),
);

router.post(
  '/me/staff',
  requirePermission(Permission.STAFF_MANAGE),
  validate(createStaffSchema),
  asyncHandler(GymController.createStaff),
);

router.delete(
  '/me/staff/:id',
  requirePermission(Permission.STAFF_MANAGE),
  validate(staffIdParamSchema),
  asyncHandler(GymController.deleteStaff),
);

router.get(
  '/:id',
  requirePermission(Permission.GYM_READ),
  validate(gymIdParamSchema),
  asyncHandler(GymController.getPublic),
);

export default router;

