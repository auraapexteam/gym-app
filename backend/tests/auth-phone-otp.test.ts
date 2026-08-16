import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, addMockProfile } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';

const app = createApp();

describe('Auth Phone OTP Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/auth/phone-otp', () => {
    it('should successfully send OTP to valid phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone-otp')
        .send({ phone: '+919876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent to +919876543210');
    });

    it('should reject invalid phone numbers', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone-otp')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle OTP provider errors gracefully', async () => {
      mockTable('otp:error', { message: 'SMS Gateway rate limit exceeded' });

      const res = await request(app)
        .post('/api/v1/auth/phone-otp')
        .send({ phone: '+919876543210' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should successfully verify valid OTP and return session and profile', async () => {
      const profileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
      addMockProfile({
        id: profileId,
        email: '919876543210@phone.auraapex.internal',
        phone: '+919876543210',
        fullName: 'OTP Member',
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+919876543210',
          code: '123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session).toBeDefined();
      expect(res.body.data.session.accessToken).toBeDefined();
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.role).toBe('customer');
    });

    it('should fail with 401 Unauthorized for invalid OTP code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+919876543210',
          code: '000000',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
