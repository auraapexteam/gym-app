import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Cross-Gym Tenant Isolation Verification', () => {
  beforeEach(() => {
    resetMocks();
  });

  const GYM_A = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
  const GYM_B = '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2';
  const OWNER_A = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6';

  describe('Plans Cross-Access Protection', () => {
    it('should prevent Owner A from retrieving a plan belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      // Mock Gym B's plan
      mockTable('plans', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb4',
          gym_id: GYM_B,
          name: 'Gym B Elite Plan',
          price: 2000,
          duration_days: 30,
          is_active: true,
        }
      ]);

      const res = await request(app)
        .get('/api/v1/plans/47d7dfca-8857-48f8-b3ab-5c30fbdb7bb4')
        .set('Authorization', `Bearer ${OWNER_A}`);

      expect(res.status).toBe(404);
    });

    it('should prevent Owner A from updating a plan belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      mockTable('plans', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb4',
          gym_id: GYM_B,
          name: 'Gym B Elite Plan',
          price: 2000,
          duration_days: 30,
          is_active: true,
        }
      ]);

      const res = await request(app)
        .patch('/api/v1/plans/47d7dfca-8857-48f8-b3ab-5c30fbdb7bb4')
        .set('Authorization', `Bearer ${OWNER_A}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
    });
  });

  describe('Equipment Cross-Access Protection', () => {
    it('should prevent Owner A from retrieving equipment belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      mockTable('equipment', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bc4',
          gym_id: GYM_B,
          name: 'Treadmill',
          status: 'active',
        }
      ]);

      const res = await request(app)
        .get('/api/v1/equipment/47d7dfca-8857-48f8-b3ab-5c30fbdb7bc4')
        .set('Authorization', `Bearer ${OWNER_A}`);

      expect(res.status).toBe(404);
    });

    it('should prevent Owner A from updating equipment belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      mockTable('equipment', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bc4',
          gym_id: GYM_B,
          name: 'Treadmill',
          status: 'active',
        }
      ]);

      const res = await request(app)
        .patch('/api/v1/equipment/47d7dfca-8857-48f8-b3ab-5c30fbdb7bc4')
        .set('Authorization', `Bearer ${OWNER_A}`)
        .send({ name: 'Hacked Treadmill' });

      expect(res.status).toBe(404);
    });
  });

  describe('Members Cross-Access Protection', () => {
    it('should prevent Owner A from retrieving a member belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      mockTable('members', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bd4',
          gym_id: GYM_B,
          full_name: 'Gym B Member',
        }
      ]);

      const res = await request(app)
        .get('/api/v1/members/47d7dfca-8857-48f8-b3ab-5c30fbdb7bd4')
        .set('Authorization', `Bearer ${OWNER_A}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Trainers Cross-Access Protection', () => {
    it('should prevent Owner A from retrieving a trainer belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      mockTable('trainers', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7be4',
          gym_id: GYM_B,
          full_name: 'Gym B Trainer',
        }
      ]);

      const res = await request(app)
        .get('/api/v1/trainers/47d7dfca-8857-48f8-b3ab-5c30fbdb7be4')
        .set('Authorization', `Bearer ${OWNER_A}`);

      expect(res.status).toBe(404);
    });
  });

  describe('QR Code Cross-Access Protection', () => {
    it('should prevent Owner A from revoking a QR code belonging to Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      mockTable('qr_codes', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bf4',
          gym_id: GYM_B,
          code: 'GYM_B_QR_CODE',
        }
      ]);

      const res = await request(app)
        .post('/api/v1/qr/47d7dfca-8857-48f8-b3ab-5c30fbdb7bf4/revoke')
        .set('Authorization', `Bearer ${OWNER_A}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Gallery Cross-Access Protection', () => {
    it('should prevent Owner A from registering a gallery image for Gym B', async () => {
      setupAuthUser(Role.OWNER, GYM_A, OWNER_A);

      const res = await request(app)
        .post('/api/v1/gallery')
        .set('Authorization', `Bearer ${OWNER_A}`)
        .send({
          entityType: 'gym',
          entityId: GYM_B,
          path: `${GYM_A}/gallery/test.png`,
        });

      // GalleryService.register checks requireGymId which maps to GYM_A, and then registers it under OWNER_A's gym (GYM_A) rather than GYM_B
      expect(res.status).toBe(201);
      expect(res.body.data.gymId).toBe(GYM_A); // Successfully scoped to GYM_A!
    });
  });
});
