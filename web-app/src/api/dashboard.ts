import axiosInstance from './axios';
import type {
  ApiResponse,
  DashboardStats,
  RevenueData,
  AttendanceData,
  MembershipGrowthData,
  Payment,
  CheckIn,
} from '@/types';

export const dashboardApi = {
  getStats: () =>
    axiosInstance.get<ApiResponse<DashboardStats>>('/dashboard/stats'),

  getRevenueChart: (period?: 'week' | 'month' | 'year') =>
    axiosInstance.get<ApiResponse<RevenueData[]>>('/dashboard/revenue', { params: { period } }),

  getAttendanceChart: (period?: 'week' | 'month') =>
    axiosInstance.get<ApiResponse<AttendanceData[]>>('/dashboard/attendance', { params: { period } }),

  getMembershipGrowth: () =>
    axiosInstance.get<ApiResponse<MembershipGrowthData[]>>('/dashboard/membership-growth'),

  getRecentPayments: (limit?: number) =>
    axiosInstance.get<ApiResponse<Payment[]>>('/dashboard/recent-payments', { params: { limit } }),

  getRecentActivity: () =>
    axiosInstance.get<ApiResponse<CheckIn[]>>('/dashboard/recent-activity'),

  getUpcomingRenewals: () =>
    axiosInstance.get<ApiResponse<{ member: string; date: string; plan: string }[]>>(
      '/dashboard/upcoming-renewals',
    ),

  getPeakHours: () =>
    axiosInstance.get<ApiResponse<{ hour: string; count: number }[]>>('/dashboard/peak-hours'),
};
