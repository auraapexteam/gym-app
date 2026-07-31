import { z } from 'zod';

export const createSignedUploadUrlSchema = z.object({
  body: z.object({
    fileName: z.string().min(1).max(200),
    mimeType: z.string().min(1).max(100),
    size: z.number().int().positive(),
    purpose: z.enum(['avatar', 'progress-photo']),
  }),
});
