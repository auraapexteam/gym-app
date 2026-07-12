import { RequestHandler } from 'express';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors';
import { Role, Permission } from '@/shared/rbac';

/**
 * Authorization middleware factory.
 *
 * Answers "is this user allowed to perform this action?". Runs strictly after
 * authentication and derives everything from the trusted `req.user` context —
 * never from client-supplied role/gym/user ids.
 */

/** Require the caller to hold one of the given roles. */
export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req, _res, next) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('Your role cannot perform this action', 'ROLE_FORBIDDEN');
    }
    next();
  };
};

/** Require the caller to hold ALL of the given permissions. */
export const requirePermission = (...permissions: Permission[]): RequestHandler => {
  return (req, _res, next) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const missing = permissions.filter((p) => !user.permissions.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenError('Missing required permission', 'PERMISSION_DENIED');
    }
    next();
  };
};

/** Require the caller to be the platform super admin. */
export const requireSuperAdmin: RequestHandler = requireRole(Role.SUPER_ADMIN);

/** Require the caller to be attached to a tenant (gym). */
export const requireGym: RequestHandler = (req, _res, next) => {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  if (user.role !== Role.SUPER_ADMIN && !user.gymId) {
    throw new ForbiddenError('No gym associated with this account', 'NO_GYM_CONTEXT');
  }
  next();
};
