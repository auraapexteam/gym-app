import { z } from 'zod';
import { idParamSchema, listQuerySchema } from '@/shared/validators';

export const generateQrSchema = z.object({
  body: z.object({
    label: z.string().max(120).optional(),
  }),
});

export const listQrSchema = listQuerySchema;
export const qrIdSchema = idParamSchema;
