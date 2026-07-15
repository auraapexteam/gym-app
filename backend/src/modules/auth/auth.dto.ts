import { Session } from '@supabase/supabase-js';
import { ProfileRow, ProfileDto, SessionDto } from '@/modules/auth/auth.types';

export const toProfileDto = (row: ProfileRow): ProfileDto => ({
  id: row.id,
  email: row.email,
  phone: row.phone,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  role: row.role,
  gymId: row.gym_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toSessionDto = (session: Session): SessionDto => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  expiresAt: session.expires_at ?? null,
  tokenType: 'bearer',
});
