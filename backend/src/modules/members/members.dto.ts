import { MemberRow, MemberDto } from '@/modules/members/members.types';

/** Map a persistence row to its API DTO. */
export const toMemberDto = (row: MemberRow): MemberDto => ({
  id: row.id,
  gymId: row.gym_id,
  profileId: row.profile_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  gender: row.gender,
  dateOfBirth: row.date_of_birth,
  address: row.address,
  emergencyContact: row.emergency_contact,
  status: row.status,
  joinedAt: row.joined_at,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
