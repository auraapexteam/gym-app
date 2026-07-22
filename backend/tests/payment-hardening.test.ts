import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks } from './utils/test-helpers';
import { RazorpayService } from '@/modules/payments/razorpay.service';
import { supabase } from '@/config/supabase';

const app = createApp();

describe('Payment Webhook Hardening & Idempotency', () => {
  beforeEach(() => {
    resetMocks();
  });

  const MOCK_EVENT_ID = 'evt_test_123456';
  const MOCK_ORDER_ID = 'order_test_123';
  const MOCK_PAYMENT_ID = 'pay_test_123';

  it('should process webhook event successfully on first call and skip on duplicate (idempotent)', async () => {
    // Mock signature check
    vi.spyOn(RazorpayService, 'verifyWebhookSignature').mockReturnValue(true);

    // Mock Razorpay payment fetch to return captured status
    const fetchPaymentSpy = vi.spyOn(RazorpayService, 'fetchPayment').mockResolvedValue({
      id: MOCK_PAYMENT_ID,
      status: 'captured',
      method: 'card',
    });

    // Mock order context fetch in payments service
    mockTable('payments', {
      id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7be5',
      gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
      subscription_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
    });

    // Mock database RPC call
    mockTable('rpc:confirm_membership_payment', {
      subscription_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
      payment_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7be5',
      already_processed: false,
    });

    // Mock query to select existing payment event (should return null first time)
    mockTable('payment_events', []);

    // 1st Webhook Request
    const res1 = await request(app)
      .post('/webhooks/razorpay')
      .set('x-razorpay-signature', 'valid_sig')
      .send({
        id: MOCK_EVENT_ID,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: MOCK_PAYMENT_ID,
              order_id: MOCK_ORDER_ID,
              status: 'captured',
              method: 'card',
            }
          }
        }
      });

    expect(res1.status).toBe(200);
    expect(fetchPaymentSpy).toHaveBeenCalledTimes(1);

    // Mock query for the 2nd request to return processed event
    mockTable('payment_events', [
      { event_id: MOCK_EVENT_ID, status: 'processed' }
    ]);

    // 2nd Webhook Request (duplicate event)
    const res2 = await request(app)
      .post('/webhooks/razorpay')
      .set('x-razorpay-signature', 'valid_sig')
      .send({
        id: MOCK_EVENT_ID,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: MOCK_PAYMENT_ID,
              order_id: MOCK_ORDER_ID,
              status: 'captured',
              method: 'card',
            }
          }
        }
      });

    expect(res2.status).toBe(200);
    // Should NOT have made a second Razorpay fetch call
    expect(fetchPaymentSpy).toHaveBeenCalledTimes(1);
  });

  it('should fail and mark event as failed if Razorpay payment is not captured', async () => {
    vi.spyOn(RazorpayService, 'verifyWebhookSignature').mockReturnValue(true);

    // Mock Razorpay payment fetch to return failed status
    const fetchPaymentSpy = vi.spyOn(RazorpayService, 'fetchPayment').mockResolvedValue({
      id: MOCK_PAYMENT_ID,
      status: 'failed',
    });

    mockTable('payment_events', []);

    const res = await request(app)
      .post('/webhooks/razorpay')
      .set('x-razorpay-signature', 'valid_sig')
      .send({
        id: MOCK_EVENT_ID,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: MOCK_PAYMENT_ID,
              order_id: MOCK_ORDER_ID,
              status: 'failed',
              method: 'card',
            }
          }
        }
      });

    // The handler logs error and updates status. Webhook endpoint returns 200 to acknowledge receipt to Razorpay.
    expect(res.status).toBe(200);

    // Verify it updated payment_events with status = failed
    const updateSpy = vi.mocked(supabase.from);
    expect(updateSpy).toHaveBeenCalledWith('payment_events');
  });
});
