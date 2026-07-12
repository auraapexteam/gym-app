import rateLimit, { Options } from 'express-rate-limit';
import { env } from '@/config/env';
import { TooManyRequestsError } from '@/shared/errors';

const baseOptions: Partial<Options> = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new TooManyRequestsError()),
};

/** Relaxed limiter applied to all API traffic as a baseline. */
export const generalRateLimiter = rateLimit({ ...baseOptions, max: env.RATE_LIMIT_MAX });

/** Strict limiter for authentication endpoints (brute-force protection). */
export const authRateLimiter = rateLimit({ ...baseOptions, max: env.AUTH_RATE_LIMIT_MAX });

/** Strict limiter for payment-initiating endpoints. */
export const paymentRateLimiter = rateLimit({ ...baseOptions, max: 20 });

/** Medium limiter for attendance check-ins. */
export const attendanceRateLimiter = rateLimit({ ...baseOptions, max: 60 });
