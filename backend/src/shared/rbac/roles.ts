/**
 * Platform roles. Roles are broad; permissions (see `permissions.ts`) are the
 * granular unit of authorization. Never hardcode role strings elsewhere —
 * always reference this enum.
 */
export enum Role {
  CUSTOMER = 'customer',
  OWNER = 'owner',
  STAFF = 'staff',
  TRAINER = 'trainer',
  SUPER_ADMIN = 'super_admin',
}

export const ALL_ROLES: Role[] = Object.values(Role);

/** Roles that operate inside the owner dashboard / staff surface. */
export const STAFF_ROLES: Role[] = [Role.OWNER, Role.STAFF, Role.TRAINER];

/** Roles that manage a single tenant (gym). */
export const GYM_MANAGER_ROLES: Role[] = [Role.OWNER, Role.STAFF];
