import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const analyticsRangeSchema = z.object({
  query: z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
});
