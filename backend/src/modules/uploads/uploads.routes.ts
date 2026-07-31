import { Router } from 'express';
import { UploadsController } from '@/modules/uploads/uploads.controller';
import { createSignedUploadUrlSchema } from '@/modules/uploads/uploads.validation';
import { authenticate, validate, asyncHandler } from '@/shared/middleware';

const router = Router();

// Any authenticated user may request a signed URL for their own personal
// (avatar / progress-photo) uploads — no gym or role restriction.
router.use(authenticate);

router.post(
  '/signed-url',
  validate(createSignedUploadUrlSchema),
  asyncHandler(UploadsController.createSignedUploadUrl),
);

export default router;
