import { Router } from 'express';
import { AdminController } from '@/modules/admin/admin.controller';
import {
  onboardGymSchema,
  listGymsSchema,
  listAuditLogsSchema,
  gymIdSchema,
} from '@/modules/admin/admin.validation';
import { authenticate, requireSuperAdmin, validate, asyncHandler } from '@/shared/middleware';

const router = Router();

// Every admin route is restricted to the platform super admin.
router.use(authenticate, requireSuperAdmin);

router.get('/stats', asyncHandler(AdminController.platformStats));
router.get('/audit-logs', validate(listAuditLogsSchema), asyncHandler(AdminController.listAuditLogs));

router.post('/gyms', validate(onboardGymSchema), asyncHandler(AdminController.onboardGym));
router.get('/gyms', validate(listGymsSchema), asyncHandler(AdminController.listGyms));
router.get('/gyms/:id', validate(gymIdSchema), asyncHandler(AdminController.getGym));
router.post('/gyms/:id/approve', validate(gymIdSchema), asyncHandler(AdminController.approveGym));
router.post('/gyms/:id/suspend', validate(gymIdSchema), asyncHandler(AdminController.suspendGym));
router.post('/gyms/:id/activate', validate(gymIdSchema), asyncHandler(AdminController.activateGym));

export default router;
