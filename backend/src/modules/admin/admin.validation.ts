import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

export const onboardGymSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(160),
    slug: z.string().max(120).optional(),
    email: z.string().email().max(160).optional(),
    phone: z.string().min(5).max(20).optional(),
    address: z.string().max(500).optional(),
    owner: z
      .object({
        email: z.string().email().max(160),
        password: z.string().min(8).max(128),
        fullName: z.string().min(1).max(120),
      })
      .optional(),
  }),
});

export const listGymsSchema = withListQuery({
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

export const listAuditLogsSchema = withListQuery({
  gymId: z.string().uuid().optional(),
  action: z.string().max(80).optional(),
});

export const gymIdSchema = idParamSchema;
