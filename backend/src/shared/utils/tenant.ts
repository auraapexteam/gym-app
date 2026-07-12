import { ForbiddenError } from '@/shared/errors';
import { Role } from '@/shared/rbac';
import { UserContext } from '@/shared/types';

/**
 * Returns the tenant (gym) id the user belongs to, or throws when the account
 * has no tenant. Every tenant-scoped service call derives its `gym_id` from
 * here rather than trusting a client-supplied value.
 */
export function requireGymId(user: UserContext): string {
  if (!user.gymId) {
    throw new ForbiddenError('No gym associated with this account', 'NO_GYM_CONTEXT');
  }
  return user.gymId;
}

/**
 * Resolve the effective tenant id for an operation. Super admins may act on any
 * gym by supplying an explicit id; every other role is locked to their own gym.
 */
export function resolveGymId(user: UserContext, requestedGymId?: string): string {
  if (user.role === Role.SUPER_ADMIN) {
    if (!requestedGymId) {
      throw new ForbiddenError('gymId is required for platform operations', 'GYM_ID_REQUIRED');
    }
    return requestedGymId;
  }
  return requireGymId(user);
}
