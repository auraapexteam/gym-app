export interface DashboardDto {
  members: { total: number; active: number };
  subscriptions: { active: number; expiringSoon: number };
  revenue: { today: number; thisMonth: number; allTime: number };
  attendance: { today: number; last7Days: number; last30Days: number };
}

export interface RevenuePointDto {
  date: string;
  total: number;
  count: number;
}

export interface AttendancePointDto {
  date: string;
  count: number;
}

export interface DailyRevenueRow {
  revenue_date: string;
  total_revenue: number;
  payment_count: number;
}

export interface DailyAttendanceRow {
  attendance_date: string;
  check_in_count: number;
}
