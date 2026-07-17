import { Router } from 'express';
import { AttendanceController } from '@/modules/attendance/attendance.controller';
import {
  checkInSchema,
  manualCheckInSchema,
  listAttendanceSchema,
} from '@/modules/attendance/attendance.validation';
import {
  authenticate,
  requirePermission,
  validate,
  asyncHandler,
  attendanceRateLimiter,
} from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate);

// Customer QR check-in.
router.post(
  '/check-in',
  attendanceRateLimiter,
  requirePermission(Permission.ATTENDANCE_CREATE),
  validate(checkInSchema),
  asyncHandler(AttendanceController.checkIn),
);

// Customer's own history.
router.get(
  '/me',
  requirePermission(Permission.ATTENDANCE_READ),
  asyncHandler(AttendanceController.me),
);

// Staff manual check-in.
router.post(
  '/manual',
  requirePermission(Permission.ATTENDANCE_CREATE),
  validate(manualCheckInSchema),
  asyncHandler(AttendanceController.manualCheckIn),
);

// Owner/staff gym-wide reads.
router.get(
  '/',
  requirePermission(Permission.ATTENDANCE_READ),
  validate(listAttendanceSchema),
  asyncHandler(AttendanceController.list),
);

router.get(
  '/stats',
  requirePermission(Permission.ATTENDANCE_READ),
  asyncHandler(AttendanceController.stats),
);

export default router;
