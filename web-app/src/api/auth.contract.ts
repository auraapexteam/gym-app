import type { User } from '@/types';

export interface BackendProfile {
  id: string; email: string; phone: string | null; fullName: string | null;
  avatarUrl: string | null; role: User['role'] | 'owner'; gymId: string | null;
  status: string; createdAt: string; updatedAt: string;
}

export interface BackendAuthResponse {
  session: { accessToken: string; refreshToken: string; expiresAt: number | null; tokenType: 'bearer' };
  profile: BackendProfile;
}

export const toUser = (profile: BackendProfile): User => ({
  id: profile.id, email: profile.email, name: profile.fullName || profile.email,
  role: profile.role === 'owner' ? 'gym_owner' : profile.role,
  avatar: profile.avatarUrl || undefined, phone: profile.phone || undefined,
  gymId: profile.gymId || undefined, isActive: profile.status === 'active',
  createdAt: profile.createdAt, updatedAt: profile.updatedAt,
});

export function toAuthResponse(data: BackendAuthResponse) {
  if (!data.session?.accessToken || !data.session.refreshToken || !data.profile?.id) {
    throw new Error('Sign-in did not return a renewable session. Please try again.');
  }
  return { user: toUser(data.profile), token: data.session.accessToken,
    refreshToken: data.session.refreshToken, expiresAt: data.session.expiresAt };
}
