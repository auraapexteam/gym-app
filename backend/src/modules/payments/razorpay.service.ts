import crypto from 'crypto';
import { getRazorpayClient } from '@/config/razorpay';
import { env, isRazorpayConfigured } from '@/config/env';
import { PaymentError, ServiceUnavailableError } from '@/shared/errors';
import { safeCompare } from '@/shared/utils';

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

/**
 * Isolated wrapper around the Razorpay SDK and its signature crypto. Keeping all
 * external payment-provider concerns here means the rest of the payment module
 * never imports Razorpay directly.
 */
export class RazorpayService {
  private static ensureConfigured(): void {
    if (!isRazorpayConfigured) {
      throw new ServiceUnavailableError('Payments are not configured', 'PAYMENTS_DISABLED');
    }
  }

  /** Create a Razorpay order for a one-time membership checkout. */
  static async createOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<CreatedOrder> {
    this.ensureConfigured();
    try {
      const order = await getRazorpayClient().orders.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      });
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch (error) {
      throw new PaymentError(describeError(error, 'Failed to create payment order'), 'ORDER_CREATE_FAILED');
    }
  }

  /** Verify the checkout signature returned by the client after payment. */
  static verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeCompare(expected, signature);
  }

  /** Verify a webhook payload against the raw body and webhook secret. */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return safeCompare(expected, signature);
  }

  /** Issue a refund for a captured payment. */
  static async refund(razorpayPaymentId: string, amount?: number): Promise<void> {
    this.ensureConfigured();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = amount ? { amount: Math.round(amount * 100) } : {};
      await getRazorpayClient().payments.refund(razorpayPaymentId, body);
    } catch (error) {
      throw new PaymentError(describeError(error, 'Refund failed'), 'REFUND_FAILED');
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeError(error: any, fallback: string): string {
  return error?.error?.description ?? error?.message ?? fallback;
}

export { isRazorpayConfigured };
