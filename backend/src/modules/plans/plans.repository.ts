import { BaseRepository } from '@/shared/repositories';
import { PlanRow } from '@/modules/plans/plans.types';

const PLAN_COLUMNS =
  'id, gym_id, name, description, price, duration_days, features, is_active, created_at, updated_at';

export class PlanRepository extends BaseRepository<PlanRow> {
  constructor() {
    super('plans', { softDelete: true, defaultSelect: PLAN_COLUMNS });
  }
}

export const planRepository = new PlanRepository();
