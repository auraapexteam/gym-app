import { EquipmentRow, EquipmentDto } from '@/modules/equipment/equipment.types';

export const toEquipmentDto = (row: EquipmentRow): EquipmentDto => ({
  id: row.id,
  gymId: row.gym_id,
  name: row.name,
  category: row.category,
  description: row.description,
  quantity: row.quantity,
  condition: row.condition,
  status: row.status,
  imageUrl: row.image_url,
  purchasedAt: row.purchased_at,
  lastServicedAt: row.last_serviced_at,
  nextServiceAt: row.next_service_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
