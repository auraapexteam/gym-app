import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { resetMocks } from './utils/test-helpers';
import { RazorpayService } from '@/modules/payments/razorpay.service';
import { PaymentService } from '@/modules/payments/payments.service';
import { supabase } from '@/config/supabase';

const app = createApp();
const originalFrom = vi.mocked(supabase.from).getMockImplementation()!;
const eventId = 'evt_test_123456';
const orderId = 'order_test_123';
const paymentId = 'pay_test_123';

// Real Razorpay envelopes have no event ID: it is a delivery header, while
// payment/order IDs belong to nested entities.
const capturedEvent = () => ({
  entity: 'event',
  account_id: 'acc_synthetic_test',
  event: 'payment.captured',
  contains: ['payment'],
  payload: { payment: { entity: { id: paymentId, order_id: orderId, method: 'card', status: 'captured' } } },
  created_at: 1791072000,
});

describe('Razorpay delivery IDs, persistence and retries', () => {
  let events: Map<string, any>;
  let faults: { lookup?: boolean; insert?: boolean; complete?: boolean };
  let fetchPayment: ReturnType<typeof vi.spyOn>;
  let confirmPayment: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(supabase.from).mockImplementation(originalFrom);
    resetMocks();
    events = new Map();
    faults = {};
    vi.spyOn(RazorpayService, 'verifyWebhookSignature').mockReturnValue(true);
    fetchPayment = vi.spyOn(RazorpayService, 'fetchPayment').mockResolvedValue({ id: paymentId, status: 'captured' });
    confirmPayment = vi.spyOn(PaymentService, 'confirmFromWebhook').mockResolvedValue(undefined);
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table !== 'payment_events') return originalFrom(table);
      let id: string;
      let inserted: any;
      let updated: any;
      const fail = { data: null, error: { code: 'DATABASE_UNAVAILABLE', message: 'private database detail' } };
      const execute = () => {
        if (inserted) {
          if (faults.insert) return fail;
          events.set(inserted.event_id, { ...inserted });
          return { data: { event_id: inserted.event_id }, error: null };
        }
        if (updated) {
          if (updated.status === 'processed' && faults.complete) return fail;
          const existing = events.get(id);
          if (!existing) return { data: null, error: null };
          events.set(id, { ...existing, ...updated });
          return { data: { event_id: id }, error: null };
        }
        return faults.lookup ? fail : { data: events.get(id) ?? null, error: null };
      };
      const chain: any = {
        select: () => chain,
        eq: (_column: string, value: string) => { id = value; return chain; },
        insert: (payload: any) => { inserted = payload; return chain; },
        update: (payload: any) => { updated = payload; return chain; },
        single: async () => execute(),
        maybeSingle: async () => execute(),
        then: (resolve: any) => Promise.resolve(resolve(execute())),
      };
      return chain;
    }) as any);
  });

  const post = (payload: any = capturedEvent(), id = eventId) => request(app)
    .post('/webhooks/razorpay').set('x-razorpay-signature', 'valid_sig')
    .set('x-razorpay-event-id', id).send(payload);

  it('processes an ID-less real envelope and preserves the exact signed body bytes', async () => {
    const raw = JSON.stringify(capturedEvent(), null, 2);
    const res = await request(app).post('/webhooks/razorpay').type('json')
      .set('x-razorpay-signature', 'valid_sig').set('x-razorpay-event-id', eventId).send(raw);
    expect(res.status).toBe(200);
    expect(RazorpayService.verifyWebhookSignature).toHaveBeenCalledWith(raw, 'valid_sig');
    expect(confirmPayment).toHaveBeenCalledWith(orderId, paymentId, 'card');
    expect(events.get(eventId)).toMatchObject({ status: 'processed', event_type: 'payment.captured' });
  });

  it('skips a retried delivery with the same header after successful processing', async () => {
    expect((await post()).status).toBe(200);
    expect((await post()).status).toBe(200);
    expect(events.size).toBe(1);
    expect(fetchPayment).toHaveBeenCalledTimes(1);
    expect(confirmPayment).toHaveBeenCalledTimes(1);
  });

  it('requires the header even if a legacy body ID is supplied', async () => {
    const res = await request(app).post('/webhooks/razorpay')
      .set('x-razorpay-signature', 'valid_sig').send({ ...capturedEvent(), id: eventId });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_WEBHOOK_EVENT_ID');
    expect(events.size).toBe(0);
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it.each(['id', 'event_id'])('rejects a conflicting legacy body %s', async (field) => {
    const res = await post({ ...capturedEvent(), [field]: 'evt_different' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CONFLICTING_WEBHOOK_EVENT_ID');
    expect(events.size).toBe(0);
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it('allows a matching legacy ID without using it instead of the header', async () => {
    expect((await post({ ...capturedEvent(), id: eventId })).status).toBe(200);
    expect(events.get(eventId).status).toBe('processed');
  });

  it('rejects duplicate or comma-combined event ID headers', async () => {
    const res = await request(app).post('/webhooks/razorpay')
      .set('x-razorpay-signature', 'valid_sig').set('x-razorpay-event-id', [eventId, 'evt_other'])
      .send(capturedEvent());
    expect(res.status).toBe(400);
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it.each([null, [], { event: 1 }, { event: 'payment.captured', payload: { payment: { entity: { id: 123 } } } }])
  ('rejects malformed signed payload %j', async (payload) => {
    const res = await request(app).post('/webhooks/razorpay').type('json')
      .set('x-razorpay-signature', 'valid_sig').set('x-razorpay-event-id', eventId).send(JSON.stringify(payload));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_WEBHOOK_PAYLOAD');
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it('rejects invalid signatures without touching payment events', async () => {
    vi.mocked(RazorpayService.verifyWebhookSignature).mockReturnValue(false);
    const res = await post();
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    expect(events.size).toBe(0);
    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it('responds with failure and retries a failed event instead of acknowledging lost work', async () => {
    fetchPayment.mockResolvedValueOnce({ id: paymentId, status: 'failed' });
    const failed = await post();
    expect(failed.status).toBe(503);
    expect(failed.body.success).toBe(false);
    expect(events.get(eventId).status).toBe('failed');
    expect(confirmPayment).not.toHaveBeenCalled();
    expect((await post()).status).toBe(200);
    expect(events.get(eventId).status).toBe('processed');
    expect(confirmPayment).toHaveBeenCalledTimes(1);
  });

  it.each(['lookup', 'insert'] as const)('does not perform payment work when event %s persistence fails', async (failure) => {
    faults[failure] = true;
    const res = await post();
    expect(res.status).toBe(503);
    expect(confirmPayment).not.toHaveBeenCalled();
    expect(fetchPayment).not.toHaveBeenCalled();
    expect(JSON.stringify(res.body)).not.toContain('private database');
  });

  it('reports a failed completion write so the provider will retry', async () => {
    faults.complete = true;
    const res = await post();
    expect(res.status).toBe(503);
    expect(events.get(eventId).status).toBe('failed');
    expect(confirmPayment).toHaveBeenCalledTimes(1);
  });

  it('rejects an event ID reused for a different payment before applying that payment', async () => {
    expect((await post()).status).toBe(200);
    const conflicting = capturedEvent();
    conflicting.payload.payment.entity.id = 'pay_different';
    expect((await post(conflicting)).status).toBe(503);
    expect(confirmPayment).toHaveBeenCalledTimes(1);
    expect(events.get(eventId).payload.payload.payment.entity.id).toBe(paymentId);
  });

  it('does not mark incomplete payment notifications as processed', async () => {
    const res = await post({ entity: 'event', event: 'payment.captured', payload: {} });
    expect(res.status).toBe(503);
    expect(events.get(eventId).status).toBe('failed');
    expect(confirmPayment).not.toHaveBeenCalled();
  });
});
