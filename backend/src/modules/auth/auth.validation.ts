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

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1).max(4096) }).strict(),
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
      phone:     z.string().min(5).max(20).nullable().or(z.literal('')),
      avatarUrl: z.literal('').nullable(),
      avatarPath: z.string().min(1).max(500).nullable(),
      dateOfBirth: z.string().date().refine(value => value <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future').nullable(),
      gender: z.string().max(40).nullable(),
      weightKg: z.number().positive().max(500).nullable(),
      heightCm: z.number().positive().max(300).nullable(),
      fitnessLevel: z.string().max(60).nullable(),
      fitnessGoal: z.string().max(300).nullable(),
      trainingFrequency: z.string().max(80).nullable(),
      locationAddress: z.string().max(300).nullable(),
      gymPreference: z.string().max(200).nullable(),
      hasHealthCondition: z.boolean().nullable(),
      healthConditions: z.array(z.string().min(1).max(100)).max(20),
      dietaryPreference: z.string().max(100).nullable(),
      onboardingCompleted: z.boolean(),
      healthDataConsent: z.boolean(),
    })
    .partial().strict().refine(value => Object.keys(value).length > 0, 'Provide a profile field to update')
    .refine(value => {
      const health = [value.weightKg, value.heightCm, value.fitnessLevel, value.fitnessGoal,
        value.trainingFrequency, value.hasHealthCondition, value.dietaryPreference];
      const collecting = health.some(item => item !== undefined && item !== null && item !== '') || Boolean(value.healthConditions?.length);
      return !collecting || value.healthDataConsent === true;
    }, 'Consent is required to save optional fitness information'),
});

export const phoneOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(8).max(20),
    code: z.string().min(4, 'OTP code must be at least 4 digits').max(10),
  }),
});

