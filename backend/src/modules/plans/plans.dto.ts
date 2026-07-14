import { PlanRow, PlanDto } from '@/modules/plans/plans.types';

export const toPlanDto = (row: PlanRow): PlanDto => ({
  id: row.id,
  gymId: row.gym_id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  durationDays: row.duration_days,
  features: row.features ?? [],
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
