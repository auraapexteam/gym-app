import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('RBAC Authorization', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Super Admin restriction (requireSuperAdmin)', () => {
    it('should allow super_admin to access admin routes', async () => {
      setupAuthUser(Role.SUPER_ADMIN, null, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba5');

      // Mock platform stats DB response
      mockTable('gyms', 5); // total count
      mockTable('subscriptions', 10);
      mockTable('members', 20);

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba5');

      if (res.status !== 200) {
        console.log('DEBUG RBAC ADMIN STATS:', res.status, JSON.stringify(res.body));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block gym owners from accessing admin routes', async () => {
      setupAuthUser(Role.OWNER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROLE_FORBIDDEN');
    });

    it('should block customers from accessing admin routes', async () => {
      setupAuthUser(Role.CUSTOMER, null, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Permission restriction (requirePermission)', () => {
    it('should block customers from reading trainer details (requires TRAINER_READ)', async () => {
      setupAuthUser(Role.CUSTOMER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      const res = await request(app)
        .get('/api/v1/trainers')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PERMISSION_DENIED');
    });

    it('should allow owners to view trainers', async () => {
      setupAuthUser(Role.OWNER, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2', '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');
      mockTable('trainers', { items: [], total: 0 });

      const res = await request(app)
        .get('/api/v1/trainers')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
