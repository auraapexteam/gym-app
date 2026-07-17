export type EquipmentStatus = 'operational' | 'maintenance' | 'retired';
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface EquipmentRow {
  id: string;
  gym_id: string;
  name: string;
  category: string | null;
  description: string | null;
  quantity: number;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  image_url: string | null;
  purchased_at: string | null;
  last_serviced_at: string | null;
  next_service_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentDto {
  id: string;
  gymId: string;
  name: string;
  category: string | null;
  description: string | null;
  quantity: number;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  imageUrl: string | null;
  purchasedAt: string | null;
  lastServicedAt: string | null;
  nextServiceAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentInput {
  name: string;
  category?: string;
  description?: string;
  quantity?: number;
  condition?: EquipmentCondition;
  status?: EquipmentStatus;
  imageUrl?: string;
  purchasedAt?: string;
  lastServicedAt?: string;
  nextServiceAt?: string;
}

export type UpdateEquipmentInput = Partial<CreateEquipmentInput>;
