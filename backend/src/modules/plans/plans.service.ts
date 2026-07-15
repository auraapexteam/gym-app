import { planRepository } from '@/modules/plans/plans.repository';
import { toPlanDto } from '@/modules/plans/plans.dto';
import { CreatePlanInput, PlanDto, PlanRow, UpdatePlanInput } from '@/modules/plans/plans.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError, BusinessRuleError } from '@/shared/errors';

/** Business logic for membership plans. Plans never activate memberships. */
export class PlanService {
  static async list(
    gymId: string,
    query: ListQuery,
    filters: { isActive?: boolean } = {},
  ): Promise<PaginatedResult<PlanDto>> {
    const result = await planRepository.findMany({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['name', 'description'],
      filters: filters.isActive === undefined ? undefined : { is_active: filters.isActive },
    });
    return { ...result, items: result.items.map(toPlanDto) };
  }

  static async getById(gymId: string, id: string): Promise<PlanDto> {
    return toPlanDto(await this.getRowOrThrow(gymId, id));
  }

  /** Internal lookup used by the subscription module (returns the raw row). */
  static async getActiveRow(gymId: string, id: string): Promise<PlanRow> {
    const row = await this.getRowOrThrow(gymId, id);
    return row;
  }

  /**
   * Resolve a purchasable plan by id (tenant derived from the plan itself).
   * Used by the payment module when a customer initiates a checkout.
   */
  static async getPurchasable(planId: string): Promise<PlanRow> {
    const row = await planRepository.findById(planId);
    if (!row) throw new NotFoundError('Plan not found', 'PLAN_NOT_FOUND');
    if (!row.is_active) throw new BusinessRuleError('Plan is not available', 'PLAN_INACTIVE');
    return row;
  }

  static async create(gymId: string, input: CreatePlanInput): Promise<PlanDto> {
    const row = await planRepository.create({
      gym_id: gymId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      duration_days: input.durationDays,
      features: input.features ?? [],
      is_active: input.isActive ?? true,
    });
    return toPlanDto(row);
  }

  static async update(gymId: string, id: string, input: UpdatePlanInput): Promise<PlanDto> {
    await this.getRowOrThrow(gymId, id);
    const patch: Partial<PlanRow> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.price !== undefined) patch.price = input.price;
    if (input.durationDays !== undefined) patch.duration_days = input.durationDays;
    if (input.features !== undefined) patch.features = input.features;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const updated = await planRepository.update(id, patch, gymId);
    if (!updated) throw new NotFoundError('Plan not found', 'PLAN_NOT_FOUND');
    return toPlanDto(updated);
  }

  static async setActive(gymId: string, id: string, isActive: boolean): Promise<PlanDto> {
    await this.getRowOrThrow(gymId, id);
    const updated = await planRepository.update(id, { is_active: isActive }, gymId);
    if (!updated) throw new NotFoundError('Plan not found', 'PLAN_NOT_FOUND');
    return toPlanDto(updated);
  }

  static async remove(gymId: string, id: string): Promise<void> {
    await this.getRowOrThrow(gymId, id);
    await planRepository.remove(id, gymId);
  }

  private static async getRowOrThrow(gymId: string, id: string): Promise<PlanRow> {
    const row = await planRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Plan not found', 'PLAN_NOT_FOUND');
    return row;
  }
}
