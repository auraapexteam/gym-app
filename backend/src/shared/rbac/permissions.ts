import { Role } from '@/shared/rbac/roles';

/**
 * Granular permissions. Higher roles do NOT implicitly inherit permissions —
 * every permission is granted explicitly through `ROLE_PERMISSIONS` (and, for
 * staff, additionally through per-user grants stored on the staff record).
 */
export enum Permission {
  // Members
  MEMBER_READ = 'member.read',
  MEMBER_CREATE = 'member.create',
  MEMBER_UPDATE = 'member.update',
  MEMBER_DELETE = 'member.delete',

  // Plans
  PLAN_READ = 'plan.read',
  PLAN_CREATE = 'plan.create',
  PLAN_UPDATE = 'plan.update',
  PLAN_DELETE = 'plan.delete',

  // Subscriptions
  SUBSCRIPTION_READ = 'subscription.read',
  SUBSCRIPTION_MANAGE = 'subscription.manage',

  // Payments / revenue
  PAYMENT_READ = 'payment.read',
  REVENUE_READ = 'revenue.read',
  REFUND_CREATE = 'refund.create',

  // Attendance
  ATTENDANCE_READ = 'attendance.read',
  ATTENDANCE_CREATE = 'attendance.create',

  // QR
  QR_READ = 'qr.read',
  QR_MANAGE = 'qr.manage',

  // Trainers
  TRAINER_READ = 'trainer.read',
  TRAINER_MANAGE = 'trainer.manage',

  // Equipment
  EQUIPMENT_READ = 'equipment.read',
  EQUIPMENT_MANAGE = 'equipment.manage',

  // Gallery
  GALLERY_READ = 'gallery.read',
  GALLERY_MANAGE = 'gallery.manage',

  // Analytics
  ANALYTICS_READ = 'analytics.read',

  // Gym settings
  GYM_READ = 'gym.read',
  GYM_MANAGE = 'gym.manage',
  STAFF_MANAGE = 'staff.manage',

  // Platform administration (super admin)
  PLATFORM_MANAGE = 'platform.manage',
}

/**
 * Default permission set per role. Staff receive a conservative baseline that
 * an owner can extend via per-user grants on the staff record.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [Permission.PLATFORM_MANAGE, ...Object.values(Permission)],

  [Role.OWNER]: [
    Permission.MEMBER_READ, Permission.MEMBER_CREATE, Permission.MEMBER_UPDATE, Permission.MEMBER_DELETE,
    Permission.PLAN_READ, Permission.PLAN_CREATE, Permission.PLAN_UPDATE, Permission.PLAN_DELETE,
    Permission.SUBSCRIPTION_READ, Permission.SUBSCRIPTION_MANAGE,
    Permission.PAYMENT_READ, Permission.REVENUE_READ, Permission.REFUND_CREATE,
    Permission.ATTENDANCE_READ, Permission.ATTENDANCE_CREATE,
    Permission.QR_READ, Permission.QR_MANAGE,
    Permission.TRAINER_READ, Permission.TRAINER_MANAGE,
    Permission.EQUIPMENT_READ, Permission.EQUIPMENT_MANAGE,
    Permission.GALLERY_READ, Permission.GALLERY_MANAGE,
    Permission.ANALYTICS_READ,
    Permission.GYM_READ, Permission.GYM_MANAGE, Permission.STAFF_MANAGE,
  ],

  [Role.STAFF]: [
    Permission.MEMBER_READ, Permission.MEMBER_CREATE,
    Permission.PLAN_READ,
    Permission.SUBSCRIPTION_READ,
    Permission.ATTENDANCE_READ, Permission.ATTENDANCE_CREATE,
    Permission.QR_READ,
    Permission.TRAINER_READ,
    Permission.EQUIPMENT_READ,
    Permission.GALLERY_READ,
    Permission.GYM_READ,
  ],

  [Role.TRAINER]: [
    Permission.MEMBER_READ,
    Permission.ATTENDANCE_READ,
    Permission.TRAINER_READ,
    Permission.GYM_READ,
  ],

  [Role.CUSTOMER]: [
    Permission.PLAN_READ,
    Permission.SUBSCRIPTION_READ,
    Permission.ATTENDANCE_READ, Permission.ATTENDANCE_CREATE,
    Permission.GALLERY_READ,
    Permission.GYM_READ,
  ],
};

/** Resolve the effective permissions for a role, merged with explicit grants. */
export function resolvePermissions(role: Role, extraGrants: string[] = []): Permission[] {
  const base = ROLE_PERMISSIONS[role] ?? [];
  const granted = extraGrants.filter((g): g is Permission =>
    Object.values(Permission).includes(g as Permission),
  );
  return Array.from(new Set([...base, ...granted]));
}
