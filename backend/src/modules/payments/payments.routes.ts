import { Router } from 'express';
import { PaymentController } from '@/modules/payments/payments.controller';
import { WebhookController } from '@/modules/payments/payments.webhook';
import {
  createOrderSchema,
  verifyPaymentSchema,
  listPaymentsSchema,
  paymentIdSchema,
} from '@/modules/payments/payments.validation';
import {
  authenticate,
  requirePermission,
  validate,
  asyncHandler,
  paymentRateLimiter,
} from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

router.use(authenticate);

// Checkout: any authenticated user (customer self-purchase or staff-assisted).
router.post(
  '/orders',
  paymentRateLimiter,
  validate(createOrderSchema),
  asyncHandler(PaymentController.createOrder),
);

router.post(
  '/verify',
  paymentRateLimiter,
  validate(verifyPaymentSchema),
  asyncHandler(PaymentController.verify),
);

// Revenue / payment records (owner & permitted staff).
router.get(
  '/',
  requirePermission(Permission.PAYMENT_READ),
  validate(listPaymentsSchema),
  asyncHandler(PaymentController.list),
);

router.get(
  '/:id',
  requirePermission(Permission.PAYMENT_READ),
  validate(paymentIdSchema),
  asyncHandler(PaymentController.getById),
);

router.post(
  '/:id/refund',
  requirePermission(Permission.REFUND_CREATE),
  validate(paymentIdSchema),
  asyncHandler(PaymentController.refund),
);

/**
 * Webhook router — mounted separately in app.ts with a raw body parser and NO
 * authentication (Razorpay authenticates via HMAC signature instead).
 */
const webhookRouter = Router();
webhookRouter.post('/razorpay', asyncHandler(WebhookController.handleRazorpay));

export { webhookRouter };
export default router;
