import { Request, Response } from 'express';
import crypto from 'crypto';
import { SubscriptionService } from '../services/subscription';
import { logger } from '../utils/logger';

export class WebhookController {
  static async handleRazorpayWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !secret) {
        logger.warn('Webhook warning: Missing signature or webhook secret.');
        return res.status(400).json({ success: false, message: 'Invalid signature configuration' });
      }

      // Convert body to string if it isn't one already (it should be the raw buffer/text string)
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      // Verify Razorpay signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        logger.error('Webhook signature verification failed!');
        return res.status(400).json({ success: false, message: 'Signature verification failed' });
      }

      const eventData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const event = eventData.event;
      logger.info({ event }, 'Razorpay Webhook Event received');

      switch (event) {
        case 'subscription.charged': {
          const subscriptionPayload = eventData.payload.subscription.entity;
          const paymentPayload = eventData.payload.payment.entity;

          const razorpaySubscriptionId = subscriptionPayload.id;
          const currentStart = new Date(subscriptionPayload.current_start * 1000);
          const currentEnd = new Date(subscriptionPayload.current_end * 1000);

          // 1. Update the subscription in Supabase to active and record cycle dates
          const localSub = await SubscriptionService.updateSubscriptionStatus(
            razorpaySubscriptionId,
            'active',
            currentStart,
            currentEnd
          );

          // 2. Record the payment record in Supabase
          const amountInRupees = paymentPayload.amount / 100;
          await SubscriptionService.recordPayment(
            localSub.id,
            amountInRupees,
            'success',
            paymentPayload.id,
            new Date(paymentPayload.created_at * 1000)
          );

          logger.info({ razorpaySubscriptionId }, 'Successfully processed subscription.charged');
          break;
        }

        case 'subscription.cancelled':
        case 'subscription.halted': {
          const subscriptionPayload = eventData.payload.subscription.entity;
          const razorpaySubscriptionId = subscriptionPayload.id;

          await SubscriptionService.updateSubscriptionStatus(
            razorpaySubscriptionId,
            event === 'subscription.cancelled' ? 'cancelled' : 'expired'
          );

          logger.info({ event, razorpaySubscriptionId }, 'Processed subscription cancel/halt event');
          break;
        }

        case 'payment.failed': {
          const paymentPayload = eventData.payload.payment.entity;
          logger.warn({ orderId: paymentPayload.order_id, paymentId: paymentPayload.id }, 'Payment failed for order');
          break;
        }

        default:
          logger.info({ event }, 'Unhandled webhook event type');
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error(error, 'Webhook error');
      return res.status(500).json({ success: false, message: error.message || 'Webhook processing failed' });
    }
  }
}
