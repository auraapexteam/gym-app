import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Progress Module', () => {
  const customerProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
  const gymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';

  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/progress/note', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/progress/note')
        .send({ note: 'Felt great', logDate: '2026-09-15' });
      expect(res.status).toBe(401);
    });

    it('should successfully log a daily note', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const payload = {
        note: 'Felt energetic today during chest workout. Stretched for 15 mins.',
        logDate: '2026-09-15',
      };

      const res = await request(app)
        .post('/api/v1/progress/note')
        .set('Authorization', `Bearer ${customerProfileId}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Daily note saved successfully');
      expect(res.body.data.note).toBe(payload.note);
      expect(res.body.data.log_date).toBe(payload.logDate);
      expect(res.body.data.profile_id).toBe(customerProfileId);
    });

    it('should return 400 for empty note or missing logDate', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const res = await request(app)
        .post('/api/v1/progress/note')
        .set('Authorization', `Bearer ${customerProfileId}`)
        .send({ note: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/progress/sleep', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/progress/sleep')
        .send({ durationMinutes: 465, quality: 'Good', logDate: '2026-09-15' });
      expect(res.status).toBe(401);
    });

    it('should successfully log daily sleep', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const payload = {
        durationMinutes: 465,
        quality: 'Good',
        logDate: '2026-09-15',
      };

      const res = await request(app)
        .post('/api/v1/progress/sleep')
        .set('Authorization', `Bearer ${customerProfileId}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sleep log saved successfully');
      expect(res.body.data.duration_minutes).toBe(465);
      expect(res.body.data.quality).toBe('Good');
      expect(res.body.data.log_date).toBe(payload.logDate);
    });

    it('should return 400 for negative sleep duration or invalid quality', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const res = await request(app)
        .post('/api/v1/progress/sleep')
        .set('Authorization', `Bearer ${customerProfileId}`)
        .send({
          durationMinutes: -10,
          quality: 'InvalidQuality',
          logDate: '2026-09-15',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/progress/month', () => {
    it('should return monthly summary including notesLogs and sleepLogs', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      mockTable('progress_logs', [
        { id: 'p-1', profile_id: customerProfileId, weight: 75, log_date: '2026-09-15' },
      ]);
      mockTable('water_logs', [
        { id: 'w-1', profile_id: customerProfileId, amount_ml: 2500, log_date: '2026-09-15' },
      ]);
      mockTable('protein_logs', [
        { id: 'pr-1', profile_id: customerProfileId, amount_g: 150, log_date: '2026-09-15' },
      ]);
      mockTable('steps_logs', [
        { id: 's-1', profile_id: customerProfileId, steps: 8500, log_date: '2026-09-15' },
      ]);
      mockTable('progress_images', []);
      mockTable('notes_logs', [
        { id: 'n-1', profile_id: customerProfileId, note: 'Leg day felt great!', log_date: '2026-09-15' },
      ]);
      mockTable('sleep_logs', [
        { id: 'sl-1', profile_id: customerProfileId, duration_minutes: 465, quality: 'Good', log_date: '2026-09-15' },
      ]);

      const res = await request(app)
        .get('/api/v1/progress/month?year=2026&month=9')
        .set('Authorization', `Bearer ${customerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('weightLogs');
      expect(res.body.data).toHaveProperty('waterLogs');
      expect(res.body.data).toHaveProperty('proteinLogs');
      expect(res.body.data).toHaveProperty('stepsLogs');
      expect(res.body.data).toHaveProperty('notesLogs');
      expect(res.body.data).toHaveProperty('sleepLogs');
      expect(res.body.data.notesLogs.length).toBe(1);
      expect(res.body.data.notesLogs[0].note).toBe('Leg day felt great!');
      expect(res.body.data.sleepLogs.length).toBe(1);
      expect(res.body.data.sleepLogs[0].duration_minutes).toBe(465);
    });
  });
});
