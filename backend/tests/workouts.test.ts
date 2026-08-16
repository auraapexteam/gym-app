import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();

describe('Workouts Module', () => {
  const customerProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
  const gymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/v1/workouts/history', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/workouts/history');
      expect(res.status).toBe(401);
    });

    it('should return chronological workout history for authenticated user', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      mockTable('workout_logs', [
        {
          id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bf1',
          profile_id: customerProfileId,
          workout_name: 'Push Day - Chest & Triceps',
          category: 'Push Day',
          duration_min: 55,
          calories_burned: 420,
          exercises_count: 8,
          exercises: [
            { name: 'Incline Dumbbell Press', sets: 4, reps: 10, weightKg: 30 },
            { name: 'Cable Tricep Pushdown', sets: 3, reps: 12, weightKg: 25 },
          ],
          log_date: '2026-08-14',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/workouts/history')
        .set('Authorization', `Bearer ${customerProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].workoutName).toBe('Push Day - Chest & Triceps');
      expect(res.body.data[0].durationMin).toBe(55);
      expect(res.body.data[0].caloriesBurned).toBe(420);
      expect(res.body.data[0].exercisesCount).toBe(8);
      expect(res.body.data[0].exercises.length).toBe(2);
    });
  });

  describe('POST /api/v1/workouts', () => {
    it('should successfully log a new workout routine', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const payload = {
        workoutName: 'Pull Day - Back & Biceps',
        category: 'Pull Day',
        durationMin: 60,
        caloriesBurned: 480,
        exercisesCount: 6,
        exercises: [
          { name: 'Lat Pulldown', sets: 4, reps: 10, weightKg: 65 },
          { name: 'Barbell Curl', sets: 3, reps: 12, weightKg: 30 },
        ],
        logDate: '2026-08-15',
      };

      const res = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${customerProfileId}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workoutName).toBe(payload.workoutName);
      expect(res.body.data.durationMin).toBe(60);
      expect(res.body.data.caloriesBurned).toBe(480);
      expect(res.body.data.exercises.length).toBe(2);
    });

    it('should return 400 for invalid payload (missing workoutName)', async () => {
      setupAuthUser(Role.CUSTOMER, gymId, customerProfileId);

      const res = await request(app)
        .post('/api/v1/workouts')
        .set('Authorization', `Bearer ${customerProfileId}`)
        .send({
          category: 'Push Day',
          durationMin: 45,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
