import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

const trainerBody = {
  fullName: z.string().min(1).max(120),
  specialization: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().min(5).max(20).optional(),
  email: z.string().email().max(160).optional(),
  imageUrl: z.string().url().max(500).optional(),
  profileId: z.string().uuid().optional(),
};

export const createTrainerSchema = z.object({ body: z.object(trainerBody) });

export const updateTrainerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ ...trainerBody, status: z.enum(['active', 'inactive']) }).partial(),
});

export const listTrainersSchema = withListQuery({
  status: z.enum(['active', 'inactive']).optional(),
});

export const trainerIdSchema = idParamSchema;
