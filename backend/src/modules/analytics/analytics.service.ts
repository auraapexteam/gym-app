import { analyticsRepository } from '@/modules/analytics/analytics.repository';
import {
  DashboardDto,
  RevenuePointDto,
  AttendancePointDto,
} from '@/modules/analytics/analytics.types';
import { AttendanceService } from '@/modules/attendance';
import { todayUtc, daysAgoUtc } from '@/shared/utils';

const EXPIRING_SOON_DAYS = 7;

/**
 * Analytics — a read-only reporting module. It derives insights from other
 * domains but never mutates business data and is never a source of truth.
 */
export class AnalyticsService {
  static async dashboard(gymId: string): Promise<DashboardDto> {
    const expiringBefore = new Date();
    expiringBefore.setUTCDate(expiringBefore.getUTCDate() + EXPIRING_SOON_DAYS);

    const [
      totalMembers,
      activeMembers,
      activeSubs,
      expiringSubs,
      revenueRows,
      attendance,
    ] = await Promise.all([
      analyticsRepository.memberCount(gymId),
      analyticsRepository.activeMemberCount(gymId),
      analyticsRepository.activeSubscriptionCount(gymId),
      analyticsRepository.expiringSubscriptionCount(gymId, expiringBefore.toISOString()),
      analyticsRepository.dailyRevenue(gymId),
      AttendanceService.stats(gymId),
    ]);

    const today = todayUtc();
    const monthStart = `${today.slice(0, 7)}-01`;
    let revenueToday = 0;
    let revenueMonth = 0;
    let revenueAll = 0;
    for (const row of revenueRows) {
      const amount = Number(row.total_revenue);
      revenueAll += amount;
      if (row.revenue_date >= monthStart) revenueMonth += amount;
      if (row.revenue_date === today) revenueToday += amount;
    }

    return {
      members: { total: totalMembers, active: activeMembers },
      subscriptions: { active: activeSubs, expiringSoon: expiringSubs },
      revenue: { today: revenueToday, thisMonth: revenueMonth, allTime: revenueAll },
      attendance,
    };
  }

  static async revenueSeries(gymId: string, from?: string, to?: string): Promise<RevenuePointDto[]> {
    const rows = await analyticsRepository.dailyRevenue(gymId, from ?? daysAgoUtc(30), to);
    return rows.map((row) => ({
      date: row.revenue_date,
      total: Number(row.total_revenue),
      count: row.payment_count,
    }));
  }

  static async attendanceSeries(
    gymId: string,
    from?: string,
    to?: string,
  ): Promise<AttendancePointDto[]> {
    const rows = await analyticsRepository.dailyAttendance(gymId, from ?? daysAgoUtc(30), to);
    return rows.map((row) => ({ date: row.attendance_date, count: row.check_in_count }));
  }
}
