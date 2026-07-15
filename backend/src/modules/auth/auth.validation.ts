import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '@/modules/auth/auth.constants';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().max(160),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
    fullName: z.string().min(1).max(120),
    phone: z.string().min(5).max(20).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(160),
    password: z.string().min(1).max(128),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().max(160),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(1).max(120),
      phone: z.string().min(5).max(20),
      avatarUrl: z.string().url().max(500),
    })
    .partial(),
});
