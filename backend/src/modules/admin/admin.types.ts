export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  gym_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  result: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogDto {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  gymId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  result: string;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformStatsDto {
  gyms: number;
  activeGyms: number;
  members: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export interface OnboardGymInput {
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  owner?: {
    email: string;
    password: string;
    fullName: string;
  };
}
