import axiosInstance from './axios';
import type { CheckIn, ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export const attendanceApi = {
  getAll: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<CheckIn>>('/attendance', { params }),

  stats: () =>
    axiosInstance.get<ApiResponse<any>>('/attendance/stats'),

  manualCheckIn: (data: { memberId: string }) =>
    axiosInstance.post<ApiResponse<CheckIn>>('/attendance/manual', data),

  checkIn: (data: { qrCode: string }) =>
    axiosInstance.post<ApiResponse<CheckIn>>('/attendance/check-in', data),
};
