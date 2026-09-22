import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Auth Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a customer', async () => {
      // Mock profiles database insert to return profile info
      mockTable('profiles', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        email: 'customer@example.com',
        role: Role.CUSTOMER,
        status: 'active',
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'customer@example.com',
          password: 'Password123!',
          fullName: 'Test Customer',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.role).toBe(Role.CUSTOMER);
    });

    it('should fail registration with invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: '123',
          fullName: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in', async () => {
      mockTable('profiles', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1',
        email: 'riyal@gmail.com',
        role: Role.OWNER,
        status: 'active',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'riyal@gmail.com',
          password: 'Riyal@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session.accessToken).toBe('test-token');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return profile information for authenticated user', async () => {
      setupAuthUser(Role.CUSTOMER, null, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3', 'cust@example.com');

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3');

      if (res.status !== 200) {
        console.log('DEBUG AUTH ME:', res.status, JSON.stringify(res.body));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3');
    });

    it('should throw unauthorized without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/auth/account & DELETE /api/v1/auth/me', () => {
    it('should successfully delete customer account', async () => {
      setupAuthUser(Role.CUSTOMER, null, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba5', 'delete-me@example.com');
      mockTable('profiles', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba5',
        email: 'delete-me@example.com',
        role: Role.CUSTOMER,
        status: 'active',
      });

      const res = await request(app)
        .delete('/api/v1/auth/account')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Account deleted successfully');
    });

    it('should reject unauthenticated delete request', async () => {
      const res = await request(app).delete('/api/v1/auth/account');
      expect(res.status).toBe(401);
    });

    it('should prevent super_admin self-deletion', async () => {
      setupAuthUser(Role.SUPER_ADMIN, null, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba0', 'admin@example.com');
      mockTable('profiles', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba0',
        email: 'admin@example.com',
        role: Role.SUPER_ADMIN,
        status: 'active',
      });

      const res = await request(app)
        .delete('/api/v1/auth/account')
        .set('Authorization', 'Bearer 47d7dfca-8857-48f8-b3ab-5c30fbdb7ba0');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
