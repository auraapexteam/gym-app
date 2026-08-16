import { Router } from 'express';
import { WorkoutController } from '@/modules/workouts/workout.controller';
import { logWorkoutSchema, getWorkoutHistorySchema } from '@/modules/workouts/workout.validation';
import { authenticate, validate, asyncHandler } from '@/shared/middleware';

const router = Router();

router.use(authenticate);

router.get('/history', validate(getWorkoutHistorySchema), asyncHandler(WorkoutController.getHistory));
router.post('/', validate(logWorkoutSchema), asyncHandler(WorkoutController.logWorkout));

export default router;
