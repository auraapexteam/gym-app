import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const equipmentBody = {
  name: z.string().min(1).max(160),
  category: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  quantity: z.number().int().nonnegative().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  status: z.enum(['operational', 'maintenance', 'retired']).optional(),
  imageUrl: z.string().url().max(500).optional(),
  purchasedAt: isoDate.optional(),
  lastServicedAt: isoDate.optional(),
  nextServiceAt: isoDate.optional(),
};

export const createEquipmentSchema = z.object({ body: z.object(equipmentBody) });

export const updateEquipmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object(equipmentBody).partial(),
});

export const listEquipmentSchema = withListQuery({
  status: z.enum(['operational', 'maintenance', 'retired']).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
});

export const equipmentIdSchema = idParamSchema;
