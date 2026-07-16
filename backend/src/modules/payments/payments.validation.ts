import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

export const createOrderSchema = z.object({
  body: z.object({
    planId: z.string().uuid(),
    memberId: z.string().uuid().optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    paymentId: z.string().min(1),
    signature: z.string().min(1),
  }),
});

export const listPaymentsSchema = withListQuery({
  status: z.enum(['created', 'pending', 'success', 'failed', 'refunded']).optional(),
  memberId: z.string().uuid().optional(),
});

export const paymentIdSchema = idParamSchema;
