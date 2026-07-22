import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser, addMockProfile } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';
import { supabase } from '@/config/supabase';

const app = createApp();

describe('Attendance Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/attendance/manual', () => {
    it('should successfully check-in a member manually', async () => {
      setupAuthUser(Role.STAFF, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8');

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

      // Mock active subscription lookup
      mockTable('subscriptions', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
          gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
          member_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          status: 'active',
          end_date: new Date(Date.now() + 86400000).toISOString()
        }
      ]);

      // Mock attendance duplication check and insert
      mockTable('attendances', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb9',
          gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
          member_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          status: 'success',
          attendance_date: '1970-01-01', // different date so duplicate check passes
        }
      ]);

      const res = await request(app)
        .post('/api/v1/attendance/manual')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8')
        .send({
          memberId: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        });

      if (res.status !== 201) {
        console.log('DEBUG ATTENDANCE POST:', res.status, JSON.stringify(res.body));
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });

    it('should fail check-in if there is no active subscription', async () => {
      setupAuthUser(Role.STAFF, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8');

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

      // Return empty subscriptions list (no plan active)
      mockTable('subscriptions', []);

      const res = await request(app)
        .post('/api/v1/attendance/manual')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8')
        .send({
          memberId: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MEMBERSHIP_INACTIVE');
    });
  });

  describe('GET /api/v1/attendance/me', () => {
    it('should return the customer\'s own check-in logs', async () => {
      setupAuthUser(Role.CUSTOMER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3');

      // Mock members lookup
      mockTable('members', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
          profile_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3',
          gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2'
        }
      ]);

      mockTable('attendances', [
        { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb9', member_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1', gym_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', created_at: new Date().toISOString() }
      ]);

      const res = await request(app)
        .get('/api/v1/attendance/me')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });
});
