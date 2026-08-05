import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(1000).optional().or(z.literal('')),
    price: z.coerce.number().nonnegative(),
    durationDays: z.coerce.number().int().positive().optional(),
    duration: z.coerce.number().int().positive().optional(),
    features: z.array(z.string().max(120)).max(50).optional(),
    benefits: z.array(z.string().max(120)).max(50).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().min(1).max(120),
      description: z.string().max(1000).optional().or(z.literal('')),
      price: z.coerce.number().nonnegative(),
      durationDays: z.coerce.number().int().positive(),
      duration: z.coerce.number().int().positive(),
      features: z.array(z.string().max(120)).max(50),
      benefits: z.array(z.string().max(120)).max(50),
      isActive: z.boolean(),
    })
    .partial(),
});

export const listPlansSchema = withListQuery({
  gymId: z.string().uuid().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const planIdSchema = idParamSchema;
