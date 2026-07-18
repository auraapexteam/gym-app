import { Router } from 'express';
import { AnalyticsController } from '@/modules/analytics/analytics.controller';
import { analyticsRangeSchema } from '@/modules/analytics/analytics.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate, requireGym, requirePermission(Permission.ANALYTICS_READ));

router.get('/dashboard', asyncHandler(AnalyticsController.dashboard));
router.get('/revenue', validate(analyticsRangeSchema), asyncHandler(AnalyticsController.revenue));
router.get('/attendance', validate(analyticsRangeSchema), asyncHandler(AnalyticsController.attendance));

export default router;
