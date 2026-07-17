import { Router } from 'express';
import { TrainerController } from '@/modules/trainers/trainers.controller';
import {
  createTrainerSchema,
  updateTrainerSchema,
  listTrainersSchema,
  trainerIdSchema,
} from '@/modules/trainers/trainers.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate, requireGym);

router.get('/', requirePermission(Permission.TRAINER_READ), validate(listTrainersSchema), asyncHandler(TrainerController.list));
router.post('/', requirePermission(Permission.TRAINER_MANAGE), validate(createTrainerSchema), asyncHandler(TrainerController.create));
router.get('/:id', requirePermission(Permission.TRAINER_READ), validate(trainerIdSchema), asyncHandler(TrainerController.getById));
router.patch('/:id', requirePermission(Permission.TRAINER_MANAGE), validate(updateTrainerSchema), asyncHandler(TrainerController.update));
router.delete('/:id', requirePermission(Permission.TRAINER_MANAGE), validate(trainerIdSchema), asyncHandler(TrainerController.remove));

export default router;
