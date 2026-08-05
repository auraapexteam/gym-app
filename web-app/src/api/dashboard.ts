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
    axiosInstance.get<ApiResponse<any>>('/analytics/dashboard'),

  getRevenueChart: (from?: string, to?: string) =>
    axiosInstance.get<ApiResponse<any>>('/analytics/revenue', { params: { from, to } }),

  getAttendanceChart: (from?: string, to?: string) =>
    axiosInstance.get<ApiResponse<any>>('/analytics/attendance', { params: { from, to } }),

  getMembershipGrowth: () =>
    axiosInstance.get<ApiResponse<MembershipGrowthData[]>>('/dashboard/membership-growth'),

  getRecentPayments: (limit?: number) =>
    axiosInstance.get<ApiResponse<Payment[]>>('/payments', { params: { limit } }),

  getRecentActivity: () =>
    axiosInstance.get<ApiResponse<CheckIn[]>>('/attendance', { params: { limit: 10 } }),

  getUpcomingRenewals: () =>
    axiosInstance.get<ApiResponse<any[]>>('/subscriptions', { params: { status: 'active' } }),

  getPeakHours: () =>
    axiosInstance.get<ApiResponse<{ hour: string; count: number }[]>>('/dashboard/peak-hours'),
};
