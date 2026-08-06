export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type Gender = 'male' | 'female' | 'other';

/** Persistence row shape for `public.members`. */
export interface MemberRow {
  id: string;
  gym_id: string;
  profile_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  status: MemberStatus;
  joined_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** API contract returned to clients (never the raw row). */
export interface MemberDto {
  id: string;
  gymId: string;
  profileId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  status: MemberStatus;
  joinedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  planName?: string | null;
  renewDate?: string | null;
}

export interface CreateMemberInput {
  fullName: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  profileId?: string;
}

export type UpdateMemberInput = Partial<CreateMemberInput> & { status?: MemberStatus };
