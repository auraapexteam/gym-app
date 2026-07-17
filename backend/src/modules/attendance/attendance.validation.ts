import { z } from 'zod';
import { withListQuery } from '@/shared/validators';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const checkInSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
});

export const manualCheckInSchema = z.object({
  body: z.object({
    memberId: z.string().uuid(),
  }),
});

export const listAttendanceSchema = withListQuery({
  memberId: z.string().uuid().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});
