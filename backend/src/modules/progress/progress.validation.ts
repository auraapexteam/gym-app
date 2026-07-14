import { z } from 'zod';

export const logWeightSchema = z.object({
  body: z.object({
    weight: z.number().positive(),
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  }),
});

export const logWaterSchema = z.object({
  body: z.object({
    amountMl: z.number().int().nonnegative(),
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  }),
});

export const logProteinSchema = z.object({
  body: z.object({
    amountG: z.number().int().nonnegative(),
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  }),
});

export const logImageSchema = z.object({
  body: z.object({
    imageUrl: z.string().url(),
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  }),
});

export const getMonthSummarySchema = z.object({
  query: z.object({
    year: z.string().regex(/^\d{4}$/).transform(Number),
    month: z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number),
  }),
});
