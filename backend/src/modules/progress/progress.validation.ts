import { z } from 'zod';
import { env } from '@/config/env';

/**
 * Returns today's ISO date string (YYYY-MM-DD) in UTC.
 * Used to prevent logging progress entries with future dates.
 */
const todayIso = () => new Date().toISOString().slice(0, 10);

/** Validates YYYY-MM-DD date that is not in the future. */
const pastOrTodayDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((d) => d <= todayIso(), {
    message: 'Log date cannot be in the future',
  });

export const logWeightSchema = z.object({
  body: z.object({
    /** Weight in kilograms. Physiologically reasonable range: 1–500 kg. */
    weight:  z.number().min(1, 'Weight must be at least 1 kg').max(500, 'Weight cannot exceed 500 kg'),
    logDate: pastOrTodayDate,
  }),
});

export const logWaterSchema = z.object({
  body: z.object({
    /** Water intake in millilitres. Max 20 litres (20 000 ml) per day. */
    amountMl: z.number().int().min(0).max(20_000, 'Water intake cannot exceed 20 000 ml per day'),
    logDate:  pastOrTodayDate,
  }),
});

export const logProteinSchema = z.object({
  body: z.object({
    /** Protein intake in grams. Max 1 000 g per day. */
    amountG: z.number().int().min(0).max(1_000, 'Protein intake cannot exceed 1 000 g per day'),
    logDate: pastOrTodayDate,
  }),
});

export const logStepsSchema = z.object({
  body: z.object({
    /** Daily step count. Reasonable upper bound: 100 000 steps/day. */
    steps:   z.number().int().min(0).max(100_000, 'Steps cannot exceed 100 000 per day'),
    logDate: pastOrTodayDate,
  }),
});

export const logImageSchema = z.object({
  body: z.object({
    /**
     * Progress images must be stored in Supabase Storage (this project's bucket).
     * We verify the URL starts with the project's Supabase storage host to prevent
     * arbitrary external image URLs being persisted.
     */
    imageUrl: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith(env.SUPABASE_URL),
        { message: 'Image URL must be a Supabase storage URL for this project' },
      ),
    logDate: pastOrTodayDate,
  }),
});

export const getMonthSummarySchema = z.object({
  query: z.object({
    year:  z.string().regex(/^\d{4}$/).transform(Number),
    month: z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number),
  }),
});
