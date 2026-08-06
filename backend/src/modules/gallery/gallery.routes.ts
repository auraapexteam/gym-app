import { Router } from 'express';
import { GalleryController } from '@/modules/gallery/gallery.controller';
import {
  createUploadUrlSchema,
  registerImageSchema,
  listGallerySchema,
  galleryIdSchema,
} from '@/modules/gallery/gallery.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate, requireGym);

router.get(
  '/',
  requirePermission(Permission.GALLERY_READ),
  validate(listGallerySchema),
  asyncHandler(GalleryController.list),
);

router.post(
  '/upload-url',
  requirePermission(Permission.GALLERY_MANAGE),
  validate(createUploadUrlSchema),
  asyncHandler(GalleryController.createUploadUrl),
);

router.post(
  '/',
  requirePermission(Permission.GALLERY_MANAGE),
  validate(registerImageSchema),
  asyncHandler(GalleryController.register),
);

router.delete(
  '/:id',
  requirePermission(Permission.GALLERY_MANAGE),
  validate(galleryIdSchema),
  asyncHandler(GalleryController.remove),
);

export default router;
