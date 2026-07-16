import { Router } from 'express';
import { QrController } from '@/modules/qr/qr.controller';
import { generateQrSchema, listQrSchema, qrIdSchema } from '@/modules/qr/qr.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate, requireGym);

router.get('/active', requirePermission(Permission.QR_READ), asyncHandler(QrController.getActive));

router.get(
  '/',
  requirePermission(Permission.QR_READ),
  validate(listQrSchema),
  asyncHandler(QrController.list),
);

router.post(
  '/generate',
  requirePermission(Permission.QR_MANAGE),
  validate(generateQrSchema),
  asyncHandler(QrController.generate),
);

router.post(
  '/:id/revoke',
  requirePermission(Permission.QR_MANAGE),
  validate(qrIdSchema),
  asyncHandler(QrController.revoke),
);

export default router;
