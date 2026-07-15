import { Router } from 'express';
import { AuthController } from '@/modules/auth/auth.controller';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@/modules/auth/auth.validation';
import { authenticate, authRateLimiter, validate, asyncHandler } from '@/shared/middleware';

const router = Router();

// Public endpoints — strictly rate limited to deter brute force / abuse.
router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(AuthController.register));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(AuthController.login));
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword),
);
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword),
);

// Authenticated endpoints.
router.post('/logout', authenticate, asyncHandler(AuthController.logout));
router.get('/me', authenticate, asyncHandler(AuthController.me));
router.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(AuthController.updateMe));

export default router;
