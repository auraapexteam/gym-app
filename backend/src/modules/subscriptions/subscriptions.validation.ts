import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

export const listSubscriptionsSchema = withListQuery({
  status: z.enum(['pending', 'active', 'expired', 'cancelled']).optional(),
  memberId: z.string().uuid().optional(),
});

export const createManualSubscriptionSchema = z.object({
  body: z.object({
    memberId: z.string().uuid(),
    planId: z.string().uuid(),
    method: z.enum(['cash', 'card', 'upi', 'netbanking', 'wallet', 'other']).optional(),
  }),
});

export const subscriptionIdSchema = idParamSchema;
