import { z } from 'zod';

export const exerciseDetailSchema = z.object({
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(100).optional(),
  reps: z.number().int().min(1).max(1000).optional(),
  weightKg: z.number().min(0).max(1000).optional(),
  notes: z.string().max(255).optional(),
});

export const logWorkoutSchema = z.object({
  body: z.object({
    workoutName: z.string().min(1).max(100),
    category: z.string().min(1).max(50),
    durationMin: z.number().int().min(1).max(1440),
    caloriesBurned: z.number().int().min(0).max(10000).optional(),
    exercisesCount: z.number().int().min(0).max(100).optional(),
    exercises: z.array(exerciseDetailSchema).optional(),
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logDate must be in YYYY-MM-DD format').optional(),
  }),
});

export const getWorkoutHistorySchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
});
