import { Router } from 'express';
import { ProgressController } from '@/modules/progress/progress.controller';
import {
  logWeightSchema,
  logWaterSchema,
  logProteinSchema,
  logImageSchema,
  getMonthSummarySchema,
} from '@/modules/progress/progress.validation';
import { authenticate, validate, asyncHandler } from '@/shared/middleware';

const router = Router();

// Secure all progress logging endpoints under authentication
router.use(authenticate);

router.get('/month', validate(getMonthSummarySchema), asyncHandler(ProgressController.getMonthSummary));
router.post('/weight', validate(logWeightSchema), asyncHandler(ProgressController.logWeight));
router.post('/water', validate(logWaterSchema), asyncHandler(ProgressController.logWater));
router.post('/protein', validate(logProteinSchema), asyncHandler(ProgressController.logProtein));
router.post('/image', validate(logImageSchema), asyncHandler(ProgressController.logImage));

export default router;
