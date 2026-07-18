import { AuditLogRow, AuditLogDto } from '@/modules/admin/admin.types';

export const toAuditLogDto = (row: AuditLogRow): AuditLogDto => ({
  id: row.id,
  actorId: row.actor_id,
  actorRole: row.actor_role,
  gymId: row.gym_id,
  action: row.action,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  result: row.result,
  ipAddress: row.ip_address,
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
});
