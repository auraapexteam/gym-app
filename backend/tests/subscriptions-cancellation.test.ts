import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Subscription Cancellation RBAC Module', () => {
  const customerProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
  const otherCustomerProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8';
  const ownerProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6';
  const gymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
  const subId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7bc1';
  const memberId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1';

  beforeEach(() => {
    resetMocks();
  });

  const subscriptionRecord = {
    id: subId,
    gym_id: gymId,
    member_id: memberId,
    plan_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2',
    status: 'active',
    start_date: '2026-08-01T00:00:00Z',
    end_date: '2026-08-31T00:00:00Z',
    auto_renew: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    plan: { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2', name: 'Monthly Plan', price: 1500, duration_days: 30 },
    member: { id: memberId, profile_id: customerProfileId, full_name: 'Alex Customer', email: 'alex@example.com', phone: '+919876543210' },
  };

  it('should allow customer self-service cancellation of their own active subscription', async () => {
    setupAuthUser(Role.CUSTOMER, null, customerProfileId);
    mockTable('subscriptions', subscriptionRecord);

    const res = await request(app)
      .post(`/api/v1/subscriptions/${subId}/cancel`)
      .set('Authorization', `Bearer ${customerProfileId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Subscription cancelled');
  });

  it('should allow gym owner to cancel subscription for their gym member', async () => {
    setupAuthUser(Role.OWNER, gymId, ownerProfileId);
    mockTable('subscriptions', subscriptionRecord);

    const res = await request(app)
      .post(`/api/v1/subscriptions/${subId}/cancel`)
      .set('Authorization', `Bearer ${ownerProfileId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should forbid other customers from cancelling someone else subscription (403)', async () => {
    setupAuthUser(Role.CUSTOMER, null, otherCustomerProfileId);
    mockTable('subscriptions', subscriptionRecord);

    const res = await request(app)
      .post(`/api/v1/subscriptions/${subId}/cancel`)
      .set('Authorization', `Bearer ${otherCustomerProfileId}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
