import { supabase } from '@/config/supabase';
import { logger } from '@/config/logger';

export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  gymId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  result?: 'success' | 'failure';
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes immutable audit records for privileged/security-sensitive actions.
 *
 * Audit writes are best-effort and must never break the primary business flow,
 * so failures are logged but swallowed. Records are never updated or deleted.
 */
export class AuditService {
  static async record(entry: AuditEntry): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        actor_id: entry.actorId ?? null,
        actor_role: entry.actorRole ?? null,
        gym_id: entry.gymId ?? null,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId ?? null,
        result: entry.result ?? 'success',
        ip_address: entry.ipAddress ?? null,
        metadata: entry.metadata ?? {},
      });
    } catch (err) {
      logger.error({ err, action: entry.action }, 'Failed to write audit log');
    }
  }
}
