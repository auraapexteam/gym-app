import { z } from 'zod';
import { idParamSchema, withListQuery } from '@/shared/validators';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const memberBody = {
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(160).optional(),
  phone: z.string().min(5).max(20).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: isoDate.optional(),
  address: z.string().max(500).optional(),
  emergencyContact: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  profileId: z.string().uuid().optional(),
};

export const createMemberSchema = z.object({
  body: z.object(memberBody),
});

export const updateMemberSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      ...memberBody,
      status: z.enum(['active', 'inactive', 'suspended']).optional(),
    })
    .partial(),
});

export const listMembersSchema = withListQuery({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const memberIdSchema = idParamSchema;
