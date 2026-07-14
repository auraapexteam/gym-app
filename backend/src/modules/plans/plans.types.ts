export interface PlanRow {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanDto {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: string[];
  isActive?: boolean;
}

export type UpdatePlanInput = Partial<CreatePlanInput>;
