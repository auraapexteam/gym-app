import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { PaymentService } from '@/modules/payments/payments.service';
import { RazorpayService } from '@/modules/payments/razorpay.service';
import { RazorpayWebhookEvent } from '@/modules/payments/payments.types';
import { z } from 'zod';

const eventIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,255}$/);
const webhookSchema = z.object({
  id: eventIdSchema.optional(),
  event_id: eventIdSchema.optional(),
  event: z.string().min(1).max(100),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string().min(1).optional(),
        order_id: z.string().min(1).nullable().optional(),
        method: z.string().optional(),
      }).passthrough().optional(),
    }).passthrough().optional(),
    order: z.object({
      entity: z.object({ id: z.string().min(1).optional() }).passthrough().optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),
}).passthrough();

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

    // Razorpay's real event envelopes have no top-level event ID. The unique
    // delivery ID is in this header: https://razorpay.com/docs/webhooks/validate-test/
    const parsedId = eventIdSchema.safeParse(req.headers['x-razorpay-event-id']);
    if (!parsedId.success) {
      return res.status(400).json({
        success: false,
        message: 'A valid webhook event ID header is required',
        error: { code: 'INVALID_WEBHOOK_EVENT_ID' },
      });
    }

    let event: RazorpayWebhookEvent;
    try {
      event = webhookSchema.parse(JSON.parse(rawBody)) as RazorpayWebhookEvent;
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
        error: { code: 'INVALID_WEBHOOK_PAYLOAD' },
      });
    }

    if ((event.id !== undefined && event.id !== parsedId.data)
      || (event.event_id !== undefined && event.event_id !== parsedId.data)) {
      return res.status(400).json({
        success: false,
        message: 'Webhook event IDs conflict',
        error: { code: 'CONFLICTING_WEBHOOK_EVENT_ID' },
      });
    }

    logger.info({ event: event.event }, 'Razorpay webhook received');

    try {
      await PaymentService.handleWebhookEvent(event, parsedId.data);
    } catch (err) {
      // A non-2xx response lets Razorpay retry; 200 would silently lose a failed
      // payment update because there is no durable background processor here.
      logger.error({ err, event: event.event }, 'Webhook processing failed');
      return res.status(503).json({
        success: false,
        message: 'Webhook processing is temporarily unavailable',
        error: { code: 'WEBHOOK_PROCESSING_FAILED' },
      });
    }

    return res.status(200).json({ success: true });
  }
}
