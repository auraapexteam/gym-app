import { Router } from 'express';
import { EquipmentController } from '@/modules/equipment/equipment.controller';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  listEquipmentSchema,
  equipmentIdSchema,
} from '@/modules/equipment/equipment.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate, requireGym);

router.get('/', requirePermission(Permission.EQUIPMENT_READ), validate(listEquipmentSchema), asyncHandler(EquipmentController.list));
router.post('/', requirePermission(Permission.EQUIPMENT_MANAGE), validate(createEquipmentSchema), asyncHandler(EquipmentController.create));
router.get('/:id', requirePermission(Permission.EQUIPMENT_READ), validate(equipmentIdSchema), asyncHandler(EquipmentController.getById));
router.patch('/:id', requirePermission(Permission.EQUIPMENT_MANAGE), validate(updateEquipmentSchema), asyncHandler(EquipmentController.update));
router.delete('/:id', requirePermission(Permission.EQUIPMENT_MANAGE), validate(equipmentIdSchema), asyncHandler(EquipmentController.remove));

export default router;
