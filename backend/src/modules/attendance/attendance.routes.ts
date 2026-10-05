import { Router } from 'express';
import { AttendanceController } from '@/modules/attendance/attendance.controller';
import {
  checkInSchema,
  manualCheckInSchema,
  listAttendanceSchema,
} from '@/modules/attendance/attendance.validation';
import {
  authenticate,
  requireGym,
  requireRole,
  requirePermission,
  validate,
  asyncHandler,
  attendanceRateLimiter,
} from '@/shared/middleware';
import { Permission, Role, STAFF_ROLES } from '@/shared/rbac';

const router = Router();

router.use(authenticate);

// Customer QR check-in.
router.post(
  '/check-in',
  attendanceRateLimiter,
  requireRole(Role.CUSTOMER),
  requirePermission(Permission.ATTENDANCE_CREATE),
  validate(checkInSchema),
  asyncHandler(AttendanceController.checkIn),
);

// Customer's own history.
router.get(
  '/me',
  requireRole(Role.CUSTOMER),
  requirePermission(Permission.ATTENDANCE_READ),
  asyncHandler(AttendanceController.me),
);

// Staff manual check-in.
router.post(
  '/manual',
  requireRole(...STAFF_ROLES, Role.SUPER_ADMIN),
  requireGym,
  requirePermission(Permission.ATTENDANCE_CREATE),
  validate(manualCheckInSchema),
  asyncHandler(AttendanceController.manualCheckIn),
);

// Owner/staff gym-wide reads.
router.get(
  '/',
  requireRole(...STAFF_ROLES, Role.SUPER_ADMIN),
  requireGym,
  requirePermission(Permission.ATTENDANCE_READ),
  validate(listAttendanceSchema),
  asyncHandler(AttendanceController.list),
);

router.get(
  '/stats',
  requireRole(...STAFF_ROLES, Role.SUPER_ADMIN),
  requireGym,
  requirePermission(Permission.ATTENDANCE_READ),
  asyncHandler(AttendanceController.stats),
);

export default router;
