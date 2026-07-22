import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { RazorpayService } from '@/modules/payments/razorpay.service';

const app = createApp();

describe('Payments Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/payments/orders', () => {
    it('should successfully create an order', async () => {
      setupAuthUser(Role.CUSTOMER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      // Mock RazorpayService.createOrder
      const createOrderSpy = vi.spyOn(RazorpayService, 'createOrder').mockResolvedValue({
        id: 'order_test_123',
        amount: 200000, // in paise
        currency: 'INR',
      });

      // Mock plans table lookup
      mockTable('plans', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1',
        price: 2000,
        gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
        is_active: true,
      });

      // Mock database RPC call
      mockTable('rpc:create_membership_order', {
        subscription_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7',
        payment_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba9',
      });

      const res = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7')
        .send({
          planId: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe('order_test_123');
      expect(createOrderSpy).toHaveBeenCalled();
    });
  });

  describe('POST /webhooks/razorpay', () => {
    it('should process webhook event successfully with valid signature', async () => {
      // Mock signature verification to return true
      const verifyWebhookSpy = vi.spyOn(RazorpayService, 'verifyWebhookSignature').mockReturnValue(true);

      const mockPayload = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_123',
              amount: 200000,
              currency: 'INR',
              order_id: 'order_test_123',
            },
          },
        },
      };

      // Mock DB table insert to avoid calling true DB
      mockTable('payment_events', {});

      const res = await request(app)
        .post('/webhooks/razorpay')
        .set('x-razorpay-signature', 'mock-signature')
        .send(mockPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(verifyWebhookSpy).toHaveBeenCalled();
    });

    it('should reject webhook when signature verification fails', async () => {
      vi.spyOn(RazorpayService, 'verifyWebhookSignature').mockReturnValue(false);

      const res = await request(app)
        .post('/webhooks/razorpay')
        .set('x-razorpay-signature', 'invalid-signature')
        .send({ event: 'order.paid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });
  });
});
