import { z } from 'zod';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_COMPLEXITY_MESSAGE,
} from '@/modules/auth/auth.constants';

/** Reusable strong-password schema used at registration and password reset. */
const strongPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128)
  .regex(PASSWORD_REGEX, PASSWORD_COMPLEXITY_MESSAGE);

export const registerSchema = z.object({
  body: z.object({
    email:    z.string().email().max(160),
    password: strongPassword,
    fullName: z.string().min(1).max(120),
    phone:    z.string().min(5).max(20).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email().max(160),
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
    password:    strongPassword,
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName:  z.string().min(1).max(120),
      phone:     z.string().min(5).max(20),
      avatarUrl: z.string().url().max(500),
    })
    .partial(),
});
