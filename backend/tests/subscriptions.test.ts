import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser, addMockProfile } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';

const app = createApp();

describe('Subscriptions Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/v1/subscriptions/me', () => {
    it('should successfully return the logged-in customer\'s subscriptions', async () => {
      setupAuthUser(Role.CUSTOMER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      mockTable('members', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          profile_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7',
          gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2'
        }
      ]);

      mockTable('subscriptions', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb4',
          member_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
          status: 'active',
          amount: 1500,
          plan: { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2', name: 'Elite Plan', price: 1500, duration_days: 30 },
          member: { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1', full_name: 'Test Member', email: 'member@example.com', phone: null }
        }
      ]);

      const res = await request(app)
        .get('/api/v1/subscriptions/me')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('active');
    });
  });

  describe('POST /api/v1/subscriptions/manual', () => {
    it('should successfully record a manual sales/subscription for an owner', async () => {
      setupAuthUser(Role.OWNER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      // Mock member check profile lookup
      addMockProfile({
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        email: 'member@example.com',
        role: Role.CUSTOMER,
        gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
        status: AccountStatus.ACTIVE,
      });

      // Mock member check members lookup
      mockTable('members', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
        profile_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        status: AccountStatus.ACTIVE,
      });

      // Mock plan lookup
      mockTable('plans', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2',
        price: 2000,
        duration_days: 30,
        gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
        is_active: true,
      });

      // Mock subscription insert
      mockTable('subscriptions', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
          member_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
          status: 'active',
        }
      ]);

      // Mock payment insert
      mockTable('payments', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb5',
        amount: 2000,
        status: 'captured',
      });

      // Mock database RPC call
      mockTable('rpc:create_manual_membership', {
        subscription_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
        payment_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb5',
      });

      const res = await request(app)
        .post('/api/v1/subscriptions/manual')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6')
        .send({
          memberId: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          planId: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2',
          method: 'cash',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
    });

    it('should fail if memberId is not a valid UUID', async () => {
      setupAuthUser(Role.OWNER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      const res = await request(app)
        .post('/api/v1/subscriptions/manual')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6')
        .send({
          memberId: 'invalid-id',
          planId: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          method: 'cash',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
