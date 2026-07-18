import { supabase } from '@/config/supabase';
import { AppError } from '@/shared/errors';
import { DailyRevenueRow, DailyAttendanceRow } from '@/modules/analytics/analytics.types';

/**
 * Read-only reporting repository. Analytics owns no tables; it reads aggregates
 * from other domains' tables and the analytics views. It must never write.
 */
export class AnalyticsRepository {
  private fail(message: string, cause: unknown): never {
    throw new AppError(message, 500, 'DB_ERROR', false, cause instanceof Error ? cause.message : cause);
  }

  private async count(table: string, apply: (q: unknown) => unknown, gymId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from(table).select('id', { count: 'exact', head: true }).eq('gym_id', gymId);
    query = apply(query);
    const { count, error } = await query;
    if (error) this.fail(`Failed to count ${table}`, error);
    return count ?? 0;
  }

  memberCount(gymId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.count('members', (q: any) => q.is('deleted_at', null), gymId);
  }

  activeMemberCount(gymId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.count('members', (q: any) => q.is('deleted_at', null).eq('status', 'active'), gymId);
  }

  activeSubscriptionCount(gymId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.count('subscriptions', (q: any) => q.eq('status', 'active'), gymId);
  }

  expiringSubscriptionCount(gymId: string, beforeIso: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.count(
      'subscriptions',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: any) => q.eq('status', 'active').lte('end_date', beforeIso),
      gymId,
    );
  }

  async dailyRevenue(gymId: string, from?: string, to?: string): Promise<DailyRevenueRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('vw_daily_revenue')
      .select('revenue_date, total_revenue, payment_count')
      .eq('gym_id', gymId)
      .order('revenue_date', { ascending: true });
    if (from) query = query.gte('revenue_date', from);
    if (to) query = query.lte('revenue_date', to);

    const { data, error } = await query;
    if (error) this.fail('Failed to load revenue', error);
    return (data as DailyRevenueRow[]) ?? [];
  }

  async dailyAttendance(gymId: string, from?: string, to?: string): Promise<DailyAttendanceRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('vw_daily_attendance')
      .select('attendance_date, check_in_count')
      .eq('gym_id', gymId)
      .order('attendance_date', { ascending: true });
    if (from) query = query.gte('attendance_date', from);
    if (to) query = query.lte('attendance_date', to);

    const { data, error } = await query;
    if (error) this.fail('Failed to load attendance', error);
    return (data as DailyAttendanceRow[]) ?? [];
  }
}

export const analyticsRepository = new AnalyticsRepository();
