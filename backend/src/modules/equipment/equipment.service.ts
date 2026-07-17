import { equipmentRepository } from '@/modules/equipment/equipment.repository';
import { toEquipmentDto } from '@/modules/equipment/equipment.dto';
import {
  CreateEquipmentInput,
  EquipmentDto,
  EquipmentRow,
  UpdateEquipmentInput,
} from '@/modules/equipment/equipment.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError } from '@/shared/errors';

/** Business logic for gym equipment inventory and maintenance tracking. */
export class EquipmentService {
  static async list(
    gymId: string,
    query: ListQuery,
    filters: { status?: string; condition?: string } = {},
  ): Promise<PaginatedResult<EquipmentDto>> {
    const result = await equipmentRepository.findMany({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['name', 'category'],
      filters: {
        status: filters.status,
        condition: filters.condition,
      },
    });
    return { ...result, items: result.items.map(toEquipmentDto) };
  }

  static async getById(gymId: string, id: string): Promise<EquipmentDto> {
    return toEquipmentDto(await this.getRowOrThrow(gymId, id));
  }

  static async create(gymId: string, input: CreateEquipmentInput): Promise<EquipmentDto> {
    const row = await equipmentRepository.create({
      gym_id: gymId,
      name: input.name,
      category: input.category ?? null,
      description: input.description ?? null,
      quantity: input.quantity ?? 1,
      condition: input.condition ?? 'good',
      status: input.status ?? 'operational',
      image_url: input.imageUrl ?? null,
      purchased_at: input.purchasedAt ?? null,
      last_serviced_at: input.lastServicedAt ?? null,
      next_service_at: input.nextServiceAt ?? null,
    });
    return toEquipmentDto(row);
  }

  static async update(gymId: string, id: string, input: UpdateEquipmentInput): Promise<EquipmentDto> {
    await this.getRowOrThrow(gymId, id);
    const patch: Partial<EquipmentRow> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.category !== undefined) patch.category = input.category ?? null;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.quantity !== undefined) patch.quantity = input.quantity;
    if (input.condition !== undefined) patch.condition = input.condition;
    if (input.status !== undefined) patch.status = input.status;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl ?? null;
    if (input.purchasedAt !== undefined) patch.purchased_at = input.purchasedAt ?? null;
    if (input.lastServicedAt !== undefined) patch.last_serviced_at = input.lastServicedAt ?? null;
    if (input.nextServiceAt !== undefined) patch.next_service_at = input.nextServiceAt ?? null;

    const updated = await equipmentRepository.update(id, patch, gymId);
    if (!updated) throw new NotFoundError('Equipment not found', 'EQUIPMENT_NOT_FOUND');
    return toEquipmentDto(updated);
  }

  static async remove(gymId: string, id: string): Promise<void> {
    await this.getRowOrThrow(gymId, id);
    await equipmentRepository.remove(id, gymId);
  }

  private static async getRowOrThrow(gymId: string, id: string): Promise<EquipmentRow> {
    const row = await equipmentRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Equipment not found', 'EQUIPMENT_NOT_FOUND');
    return row;
  }
}
