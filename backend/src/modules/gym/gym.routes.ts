import { Router } from 'express';
import { GymController } from '@/modules/gym/gym.controller';
import {
  updateGymSchema,
  gymIdParamSchema,
  createStaffSchema,
  staffIdParamSchema,
  createJoinRequestSchema,
  joinRequestIdParamSchema,
} from '@/modules/gym/gym.validation';
import { authenticate, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate);

// Public directory search & Join requests for customers
router.get('/directory', asyncHandler(GymController.listPublicDirectory));
router.get('/saved', asyncHandler(GymController.listSaved));
router.post('/:id/bookmark', validate(gymIdParamSchema), asyncHandler(GymController.toggleBookmark));
router.post('/join-request', validate(createJoinRequestSchema), asyncHandler(GymController.createJoinRequest));
router.get('/join-request/status', asyncHandler(GymController.getJoinRequestStatus));

// Join request management for gym owners
router.get(
  '/join-requests/pending',
  requirePermission(Permission.GYM_MANAGE),
  asyncHandler(GymController.listPendingJoinRequests),
);

router.patch(
  '/join-requests/:id/approve',
  requirePermission(Permission.GYM_MANAGE),
  validate(joinRequestIdParamSchema),
  asyncHandler(GymController.approveJoinRequest),
);

router.patch(
  '/join-requests/:id/reject',
  requirePermission(Permission.GYM_MANAGE),
  validate(joinRequestIdParamSchema),
  asyncHandler(GymController.rejectJoinRequest),
);

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

