import { supabase } from '@/config/supabase';
import { asyncHandler } from '@/shared/middleware/async-handler';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors';
import { Role, resolvePermissions } from '@/shared/rbac';
import { AccountStatus, UserContext } from '@/shared/types';
import { logger } from '@/config/logger';

interface ProfileRow {
  id: string;
  email: string;
  role: Role;
  gym_id: string | null;
  status: AccountStatus;
  gyms?: { status: string } | null;
}

/**
 * Authentication middleware.
 *
 * Answers "who is making this request?" — nothing more. It verifies the
 * Supabase-issued JWT, loads the profile (role, tenant, status), enforces
 * account/gym activity, resolves effective permissions, and attaches the
 * immutable `req.user` context. It never checks whether the action is allowed;
 * that is the authorization middleware's job.
 *
 * This is the one place (per the dependency rules) where a middleware may read
 * from the database directly.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    logger.warn({ error, token: token.substring(0, 15) + '...' }, 'Auth token verification failed');
    throw new UnauthorizedError('Invalid or expired token', 'INVALID_TOKEN');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, gym_id, status, gyms:gyms!profiles_gym_id_fkey(status)')
    .eq('id', data.user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    logger.error({ error: profileError, userId: data.user.id }, 'Profile database lookup failed');
    throw new UnauthorizedError('Failed to load profile', 'PROFILE_LOOKUP_FAILED');
  }
  if (!profile) {
    logger.warn({ userId: data.user.id }, 'Profile row not found in database');
    throw new UnauthorizedError('Profile not found', 'PROFILE_NOT_FOUND');
  }
  if (profile.status !== AccountStatus.ACTIVE) {
    logger.warn({ userId: data.user.id, status: profile.status }, 'User account status is not active');
    throw new ForbiddenError('Account is not active', 'ACCOUNT_INACTIVE');
  }

  // Suspending a gym disables every associated user except the super admin.
  if (profile.role !== Role.SUPER_ADMIN && profile.gyms && profile.gyms.status === 'suspended') {
    throw new ForbiddenError('Gym is suspended', 'GYM_SUSPENDED');
  }

  const grants = await loadStaffGrants(profile);

  const user: UserContext = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    gymId: profile.gym_id,
    status: profile.status,
    permissions: resolvePermissions(profile.role, grants),
  };

  req.user = user;
  next();
});

/** Staff/trainer accounts can receive additional per-user permission grants. */
async function loadStaffGrants(profile: ProfileRow): Promise<string[]> {
  if (profile.role !== Role.STAFF && profile.role !== Role.TRAINER) return [];
  if (!profile.gym_id) return [];

  const { data } = await supabase
    .from('gym_staff')
    .select('permissions')
    .eq('profile_id', profile.id)
    .eq('gym_id', profile.gym_id)
    .maybeSingle<{ permissions: string[] | null }>();

  return data?.permissions ?? [];
}
