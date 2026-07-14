import { z } from 'zod';

const timing = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM'),
});

const weekday = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const updateGymSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(160),
      email: z.string().email().max(160),
      phone: z.string().min(5).max(20),
      address: z.string().max(500),
      description: z.string().max(2000),
      logoUrl: z.string().url().max(500),
      timings: z.record(weekday, timing),
      weeklyOff: z.array(weekday).max(7),
      settings: z.record(z.string(), z.unknown()),
    })
    .partial(),
});

export const gymIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
