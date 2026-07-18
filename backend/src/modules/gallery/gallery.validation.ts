import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

const entityType = z.enum(['gym', 'trainer', 'equipment', 'profile', 'general']);

export const createUploadUrlSchema = z.object({
  body: z.object({
    fileName: z.string().min(1).max(200),
    mimeType: z.string().min(1).max(100),
    size: z.number().int().positive(),
    entityType: entityType.optional(),
  }),
});

export const registerImageSchema = z.object({
  body: z.object({
    path: z.string().min(1).max(500),
    mimeType: z.string().max(100).optional(),
    size: z.number().int().nonnegative().optional(),
    entityType: entityType.optional(),
    entityId: z.string().uuid().optional(),
    caption: z.string().max(500).optional(),
  }),
});

export const listGallerySchema = withListQuery({
  gymId: z.string().uuid().optional(),
  entityType: entityType.optional(),
  entityId: z.string().uuid().optional(),
});

export const galleryIdSchema = idParamSchema;
