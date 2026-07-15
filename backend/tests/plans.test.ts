import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Plans Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/plans', () => {
    it('should successfully create a membership plan', async () => {
      setupAuthUser(Role.OWNER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      // Mock plans table mock creation return value
      mockTable('plans', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1',
        name: 'Basic Plan',
        price: 1500,
        durationDays: 30,
        gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
        is_active: true,
      });

      const res = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6')
        .send({
          name: 'Basic Plan',
          price: 1500,
          durationDays: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Basic Plan');
    });

    it('should reject plan creation if duration is negative', async () => {
      setupAuthUser(Role.OWNER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      const res = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6')
        .send({
          name: 'Invalid Plan',
          price: 1500,
          durationDays: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/plans', () => {
    it('should return paginated membership plans', async () => {
      setupAuthUser(Role.CUSTOMER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      mockTable('plans', [
        { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', name: 'Plan One', price: 1000, durationDays: 30, gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', is_active: true },
        { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3', name: 'Plan Two', price: 2000, durationDays: 90, gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', is_active: true },
      ]);

      const res = await request(app)
        .get('/api/v1/plans?gymId=47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });
});
