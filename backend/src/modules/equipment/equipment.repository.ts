import { BaseRepository } from '@/shared/repositories';
import { EquipmentRow } from '@/modules/equipment/equipment.types';

const EQUIPMENT_COLUMNS =
  'id, gym_id, name, category, description, quantity, condition, status, ' +
  'image_url, purchased_at, last_serviced_at, next_service_at, created_at, updated_at';

export class EquipmentRepository extends BaseRepository<EquipmentRow> {
  constructor() {
    super('equipment', { softDelete: true, defaultSelect: EQUIPMENT_COLUMNS });
  }
}

export const equipmentRepository = new EquipmentRepository();
