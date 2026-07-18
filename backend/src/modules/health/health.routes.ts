import { Router } from 'express';
import { HealthController } from '@/modules/health/health.controller';
import { asyncHandler } from '@/shared/middleware';

const router = Router();

router.get('/health', asyncHandler(HealthController.health));
router.get('/ready', asyncHandler(HealthController.ready));
router.get('/live', HealthController.live);

export default router;
