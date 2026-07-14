export type TrainerStatus = 'active' | 'inactive';

export interface TrainerRow {
  id: string;
  gym_id: string;
  profile_id: string | null;
  full_name: string;
  specialization: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  status: TrainerStatus;
  created_at: string;
  updated_at: string;
}

export interface TrainerDto {
  id: string;
  gymId: string;
  profileId: string | null;
  fullName: string;
  specialization: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  status: TrainerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainerInput {
  fullName: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  profileId?: string;
  password?: string;
}


export type UpdateTrainerInput = Partial<CreateTrainerInput> & { status?: TrainerStatus };
