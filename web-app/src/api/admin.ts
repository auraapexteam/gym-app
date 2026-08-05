import axiosInstance from './axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export interface OnboardGymPayload {
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  owner?: {
    email: string;
    password?: string;
    fullName: string;
  };
}

export const adminApi = {
  getPlatformStats: () =>
    axiosInstance.get<ApiResponse<any>>('/admin/stats'),

  listGyms: (params?: PaginationParams & { status?: string }) =>
    axiosInstance.get<PaginatedResponse<any>>('/admin/gyms', { params }),

  getGymById: (id: string) =>
    axiosInstance.get<ApiResponse<any>>(`/admin/gyms/${id}`),

  onboardGym: (data: OnboardGymPayload) =>
    axiosInstance.post<ApiResponse<any>>('/admin/gyms', data),

  approveGym: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/admin/gyms/${id}/approve`),

  suspendGym: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/admin/gyms/${id}/suspend`),

  activateGym: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/admin/gyms/${id}/activate`),

  listAuditLogs: (params?: PaginationParams & { gymId?: string; action?: string }) =>
    axiosInstance.get<PaginatedResponse<any>>('/admin/audit-logs', { params }),
};
