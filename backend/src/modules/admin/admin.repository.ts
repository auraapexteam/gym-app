import { supabase } from '@/config/supabase';
import { AppError } from '@/shared/errors';
import { PaginatedResult } from '@/shared/types';
import { AuditLogRow, PlatformStatsDto } from '@/modules/admin/admin.types';

export interface ListAuditLogsParams {
  page: number;
  limit: number;
  offset: number;
  order: 'asc' | 'desc';
  gymId?: string;
  action?: string;
}

/**
 * Platform-admin reads. Intentionally NOT tenant-scoped — the admin module
 * operates across every gym. Owns reads of the platform tables (audit_logs) and
 * cross-tenant aggregate reporting.
 */
export class AdminRepository {
  private fail(message: string, cause: unknown): never {
    throw new AppError(message, 500, 'DB_ERROR', false, cause instanceof Error ? cause.message : cause);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async count(table: string, apply?: (q: any) => any): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from(table).select('id', { count: 'exact', head: true });
    if (apply) query = apply(query);
    const { count, error } = await query;
    if (error) this.fail(`Failed to count ${table}`, error);
    return count ?? 0;
  }

  async platformStats(): Promise<PlatformStatsDto> {
    const [gyms, activeGyms, members, activeSubscriptions, revenueRows] = await Promise.all([
      this.count('gyms'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.count('gyms', (q: any) => q.eq('status', 'active')),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.count('members', (q: any) => q.is('deleted_at', null)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.count('subscriptions', (q: any) => q.eq('status', 'active')),
      this.allRevenue(),
    ]);

    return { gyms, activeGyms, members, activeSubscriptions, totalRevenue: revenueRows };
  }

  private async allRevenue(): Promise<number> {
    const { data, error } = await supabase.from('vw_daily_revenue').select('total_revenue');
    if (error) this.fail('Failed to load platform revenue', error);
    const rows = (data as { total_revenue: number }[]) ?? [];
    return rows.reduce((sum, row) => sum + Number(row.total_revenue), 0);
  }

  async listAuditLogs(params: ListAuditLogsParams): Promise<PaginatedResult<AuditLogRow>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('audit_logs')
      .select(
        'id, actor_id, actor_role, gym_id, action, resource_type, resource_id, result, ip_address, metadata, created_at',
        { count: 'exact' },
      );

    if (params.gymId) query = query.eq('gym_id', params.gymId);
    if (params.action) query = query.eq('action', params.action);

    query = query
      .order('created_at', { ascending: params.order === 'asc' })
      .range(params.offset, params.offset + params.limit - 1);

    const { data, error, count } = await query;
    if (error) this.fail('Failed to list audit logs', error);
    return {
      items: (data as AuditLogRow[]) ?? [],
      total: count ?? 0,
      page: params.page,
      limit: params.limit,
    };
  }
}

export const adminRepository = new AdminRepository();
