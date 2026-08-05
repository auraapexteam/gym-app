import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      const raw = res.data.data;
      if (raw && typeof raw === 'object' && ('revenue' in raw || 'members' in raw)) {
        return {
          monthlyRevenue: raw.revenue?.thisMonth ?? 0,
          revenueGrowth: 0,
          todayCheckins: raw.attendance?.todayCheckIns ?? 0,
          activeMembers: raw.members?.active ?? 0,
          memberGrowth: 0,
          membershipRenewals: raw.subscriptions?.expiringSoon ?? 0,
          pendingPayments: 0,
          classFillRate: 0,
          nutritionOrders: 0,
        };
      }
      return raw;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenueChart(period: 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'revenue', period],
    queryFn: async () => {
      const now = new Date();
      const days = period === 'week' ? 7 : period === 'year' ? 365 : 30;
      const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const from = past.toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];

      const res = await dashboardApi.getRevenueChart(from, to);
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useAttendanceChart() {
  return useQuery({
    queryKey: ['dashboard', 'attendance'],
    queryFn: async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const from = past.toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];

      const res = await dashboardApi.getAttendanceChart(from, to);
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMembershipGrowth() {
  return useQuery({
    queryKey: ['dashboard', 'membership-growth'],
    queryFn: async () => [] as any[],
  });
}

export function useRecentPayments() {
  return useQuery({
    queryKey: ['dashboard', 'recent-payments'],
    queryFn: async () => {
      const res = await dashboardApi.getRecentPayments(5);
      return res.data.data;
    },
  });
}

export function usePeakHours() {
  return useQuery({
    queryKey: ['dashboard', 'peak-hours'],
    queryFn: async () => [] as { hour: string; count: number }[],
  });
}
