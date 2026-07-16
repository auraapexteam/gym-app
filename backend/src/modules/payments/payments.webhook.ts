import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { PaymentService } from '@/modules/payments/payments.service';
import { RazorpayService } from '@/modules/payments/razorpay.service';
import { RazorpayWebhookEvent } from '@/modules/payments/payments.types';

/**
 * Razorpay webhook receiver.
 *
 * Mounted with a raw body parser so the exact bytes can be verified against the
 * webhook signature. Only signature-verified events are processed; every event
 * is handled idempotently, so Razorpay retries never double-apply.
 */
export class WebhookController {
  static async handleRazorpay(req: Request, res: Response): Promise<Response> {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {});

    if (typeof signature !== 'string' || !RazorpayService.verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Rejected Razorpay webhook: invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
        error: { code: 'INVALID_WEBHOOK_SIGNATURE' },
      });
    }

    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
        error: { code: 'INVALID_WEBHOOK_PAYLOAD' },
      });
    }

    logger.info({ event: event.event }, 'Razorpay webhook received');

    try {
      await PaymentService.handleWebhookEvent(event);
    } catch (err) {
      // Acknowledge receipt but log processing failures for investigation.
      logger.error({ err, event: event.event }, 'Webhook processing failed');
    }

    return res.status(200).json({ success: true });
  }
}
