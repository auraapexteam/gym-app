export const APP_NAME = 'Aura Apex';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export const ROUTES = {
  // Auth
  SPLASH: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  OTP_VERIFY: '/verify-otp',

  // Dashboard (role-based)
  DASHBOARD: '/dashboard',

  // Members
  MEMBERS: '/members',
  MEMBER_PROFILE: '/members/:id',
  MEMBER_ADD: '/members/add',

  // Check-ins
  CHECKINS: '/checkins',

  // Membership Plans
  PLANS: '/plans',

  // Trainers
  TRAINERS: '/trainers',

  // Staff
  STAFF: '/staff',

  // Equipment
  EQUIPMENT: '/equipment',

  // Nutrition
  NUTRITION: '/nutrition',

  // Orders
  ORDERS: '/orders',

  // Payments
  PAYMENTS: '/payments',

  // Attendance
  ATTENDANCE: '/attendance',

  // Analytics
  ANALYTICS: '/analytics',

  // Reports
  REPORTS: '/reports',

  // Notifications
  NOTIFICATIONS: '/notifications',

  // Settings
  SETTINGS: '/settings',

  // Super Admin
  SUPER_ADMIN: '/super-admin',
  MANAGE_GYMS: '/super-admin/gyms',
  MANAGE_OWNERS: '/super-admin/owners',
  PLATFORM_ANALYTICS: '/super-admin/analytics',
} as const;

export const MEMBERSHIP_STATUS_COLORS: Record<string, string> = {
  active: 'text-aura-success bg-aura-success/10 border-aura-success/20',
  expired: 'text-aura-danger bg-aura-danger/10 border-aura-danger/20',
  suspended: 'text-aura-warning bg-aura-warning/10 border-aura-warning/20',
  frozen: 'text-aura-info bg-aura-info/10 border-aura-info/20',
  pending: 'text-aura-muted bg-white/5 border-aura-border',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  completed: 'text-aura-success bg-aura-success/10 border-aura-success/20',
  pending: 'text-aura-warning bg-aura-warning/10 border-aura-warning/20',
  failed: 'text-aura-danger bg-aura-danger/10 border-aura-danger/20',
  refunded: 'text-aura-info bg-aura-info/10 border-aura-info/20',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'text-aura-warning bg-aura-warning/10 border-aura-warning/20',
  processing: 'text-aura-info bg-aura-info/10 border-aura-info/20',
  delivered: 'text-aura-success bg-aura-success/10 border-aura-success/20',
  cancelled: 'text-aura-danger bg-aura-danger/10 border-aura-danger/20',
  refunded: 'text-aura-muted bg-white/5 border-aura-border',
};

export const EQUIPMENT_CONDITION_COLORS: Record<string, string> = {
  excellent: 'text-aura-success bg-aura-success/10 border-aura-success/20',
  good: 'text-aura-primary bg-aura-primary/10 border-aura-primary/20',
  fair: 'text-aura-warning bg-aura-warning/10 border-aura-warning/20',
  poor: 'text-aura-danger bg-aura-danger/10 border-aura-danger/20',
  maintenance: 'text-aura-muted bg-white/5 border-aura-border',
};

export const PAGINATION_LIMIT = 10;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  gym_owner: 'Gym Owner',
  staff: 'Staff',
  trainer: 'Trainer',
  customer: 'Customer',
};
