import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Gym Bookmarks / Saved Gyms Module', () => {
  const customerProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
  const gymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/v1/gyms/saved', () => {
    it('should return 401 Unauthorized if no bearer token provided', async () => {
      const res = await request(app).get('/api/v1/gyms/saved');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return bookmarked partner gyms for authenticated user', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      mockTable('saved_gyms', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7be1',
          profile_id: customerProfileId,
          gym_id: gymId,
          created_at: new Date().toISOString(),
          gyms: {
            id: gymId,
            name: 'Cult.fit Koramangala',
            address: 'Koramangala, Bengaluru',
            logo_url: 'https://cdn.auraapex.test/cult.png',
            status: 'active',
            timings: {},
            weekly_off: [],
          },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/gyms/saved')
        .set('Authorization', `Bearer ${customerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(gymId);
      expect(res.body.data[0].name).toBe('Cult.fit Koramangala');
      expect(res.body.data[0].rating).toBe(4.8);
    });
  });

  describe('POST /api/v1/gyms/:id/bookmark', () => {
    it('should toggle bookmark on if gym is not yet bookmarked', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      mockTable('gyms', {
        id: gymId,
        name: 'Cult.fit Koramangala',
        status: 'active',
      });

      // No existing bookmark in saved_gyms
      mockTable('saved_gyms', null);

      const res = await request(app)
        .post(`/api/v1/gyms/${gymId}/bookmark`)
        .set('Authorization', `Bearer ${customerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSaved).toBe(true);
      expect(res.body.data.gymId).toBe(gymId);
    });

    it('should toggle bookmark off if gym is already bookmarked', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      mockTable('gyms', {
        id: gymId,
        name: 'Cult.fit Koramangala',
        status: 'active',
      });

      // Existing bookmark in saved_gyms
      mockTable('saved_gyms', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7be1',
        profile_id: customerProfileId,
        gym_id: gymId,
      });

      const res = await request(app)
        .post(`/api/v1/gyms/${gymId}/bookmark`)
        .set('Authorization', `Bearer ${customerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSaved).toBe(false);
      expect(res.body.data.gymId).toBe(gymId);
    });

    it('should return 400 Bad Request if gym id is invalid UUID', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const res = await request(app)
        .post('/api/v1/gyms/invalid-uuid/bookmark')
        .set('Authorization', `Bearer ${customerProfileId}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
