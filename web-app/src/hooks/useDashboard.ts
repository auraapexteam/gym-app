import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api';

// Mock data for demo when backend is not connected
const mockStats = {
  monthlyRevenue: 842000,
  revenueGrowth: 12.4,
  todayCheckins: 147,
  activeMembers: 1284,
  memberGrowth: 8.2,
  membershipRenewals: 23,
  pendingPayments: 15400,
  classFillRate: 78,
  nutritionOrders: 42,
};

const mockRevenueChart = [
  { month: 'Jan', revenue: 620000, target: 700000 },
  { month: 'Feb', revenue: 710000, target: 720000 },
  { month: 'Mar', revenue: 680000, target: 730000 },
  { month: 'Apr', revenue: 750000, target: 740000 },
  { month: 'May', revenue: 820000, target: 760000 },
  { month: 'Jun', revenue: 790000, target: 780000 },
  { month: 'Jul', revenue: 842000, target: 800000 },
];

const mockAttendanceChart = [
  { day: 'Mon', checkins: 120 },
  { day: 'Tue', checkins: 98 },
  { day: 'Wed', checkins: 145 },
  { day: 'Thu', checkins: 132 },
  { day: 'Fri', checkins: 160 },
  { day: 'Sat', checkins: 187 },
  { day: 'Sun', checkins: 75 },
];

const mockMembershipGrowth = [
  { month: 'Jan', members: 980, new: 64, churned: 20 },
  { month: 'Feb', members: 1024, new: 72, churned: 28 },
  { month: 'Mar', members: 1068, new: 80, churned: 36 },
  { month: 'Apr', members: 1120, new: 88, churned: 36 },
  { month: 'May', members: 1192, new: 96, churned: 24 },
  { month: 'Jun', members: 1248, new: 76, churned: 20 },
  { month: 'Jul', members: 1284, new: 52, churned: 16 },
];

const mockRecentPayments = [
  { id: '1', transactionId: 'TXN001', memberId: 'm1', memberName: 'Arjun Sharma', amount: 2999, type: 'membership' as const, status: 'completed' as const, gateway: 'razorpay' as const, createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: '2', transactionId: 'TXN002', memberId: 'm2', memberName: 'Priya Patel', amount: 499, type: 'nutrition' as const, status: 'completed' as const, gateway: 'razorpay' as const, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '3', transactionId: 'TXN003', memberId: 'm3', memberName: 'Rahul Gupta', amount: 4999, type: 'membership' as const, status: 'pending' as const, gateway: 'razorpay' as const, createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: '4', transactionId: 'TXN004', memberId: 'm4', memberName: 'Sneha Singh', amount: 1200, type: 'class' as const, status: 'completed' as const, gateway: 'cash' as const, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: '5', transactionId: 'TXN005', memberId: 'm5', memberName: 'Vikram Reddy', amount: 2999, type: 'membership' as const, status: 'failed' as const, gateway: 'razorpay' as const, createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
];

const mockPeakHours = [
  { hour: '6 AM', count: 28 },
  { hour: '7 AM', count: 52 },
  { hour: '8 AM', count: 78 },
  { hour: '9 AM', count: 64 },
  { hour: '10 AM', count: 45 },
  { hour: '11 AM', count: 32 },
  { hour: '12 PM', count: 38 },
  { hour: '5 PM', count: 92 },
  { hour: '6 PM', count: 112 },
  { hour: '7 PM', count: 98 },
  { hour: '8 PM', count: 76 },
  { hour: '9 PM', count: 42 },
];

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
