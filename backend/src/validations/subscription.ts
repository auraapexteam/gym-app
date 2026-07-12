import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().min(1, 'planId is required').uuid('planId must be a valid UUID'),
  }),
});
